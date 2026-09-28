import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import * as Y from 'yjs';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { fromBase64, toBase64 } from 'lib0/buffer';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';
const SAVE_DELAY_MS = 2000;
const REMOTE = 'remote'; // transaction origin for changes that came from the server

const USER_COLORS = ['#f97316', '#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#34d399', '#60a5fa', '#fb7185'];

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface Peer {
    clientId: number;
    name: string;
    color: string;
}

interface SyncState {
    snapshot: string | null;
    updates: string[];
    nextSeq: number;
}

interface SyncUpdate {
    seq: number;
    update: string;
}

interface RoomOptions {
    roomCode: string;
    username: string;
    initialContent: string;
    initialLanguage: string;
    onSynced: () => void;
    onConnectionChange: (connected: boolean) => void;
    onSaveStatusChange: (status: SaveStatus) => void;
    onPeersChange: (peers: Peer[]) => void;
    onLanguageChange: (language: string) => void;
}

export const colorFor = (name: string) =>
    USER_COLORS[[...name].reduce((hash, ch) => (hash * 31 + ch.charCodeAt(0)) >>> 0, 0) % USER_COLORS.length];

/**
 * One collaborative editing session. The document is a Yjs CRDT, so edits merge
 * correctly no matter the order they arrive in. The server orders updates into a
 * log (each gets a `seq`), which lets us detect missed messages and lets clients
 * compact the log by saving snapshots.
 */
export class CollabRoom {
    readonly doc = new Y.Doc();
    readonly text = this.doc.getText('code');
    readonly awareness = new Awareness(this.doc);
    private readonly meta = this.doc.getMap<string>('meta');
    private readonly client: Client;
    private readonly opts: RoomOptions;

    private seq = 0;            // log entries applied so far (all of 0..seq-1)
    private synced = false;     // initial state received on the current connection
    private everSynced = false;
    private buffered: SyncUpdate[] = [];
    private dirty = false;
    private saveTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(opts: RoomOptions) {
        this.opts = opts;
        this.awareness.setLocalStateField('user', { name: opts.username, color: colorFor(opts.username) });

        this.doc.on('update', this.handleLocalUpdate);
        this.meta.observe(this.handleMetaChange);
        this.awareness.on('update', this.handleAwarenessUpdate);
        this.awareness.on('change', this.handlePeersChange);
        window.addEventListener('pagehide', this.flush);

        this.client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            connectHeaders: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
            reconnectDelay: 2000,
            onConnect: this.handleConnect,
            onWebSocketClose: () => {
                this.synced = false;
                opts.onConnectionChange(false);
            },
            onStompError: (frame) => console.error('STOMP error:', frame.headers.message),
        });
        this.client.activate();
    }

    get language() {
        return this.meta.get('language') || this.opts.initialLanguage;
    }

    setLanguage(language: string) {
        this.meta.set('language', language);
    }

    save = () => {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        // not connected: stays dirty and is retried after the next sync
        if (!this.dirty || !this.synced || !this.client.connected) return;
        this.dirty = false;
        this.opts.onSaveStatusChange('saving');
        this.publish('save', JSON.stringify({
            seq: this.seq,
            state: toBase64(Y.encodeStateAsUpdate(this.doc)),
            content: this.text.toString(),
            language: this.language,
        }));
    };

    destroy() {
        this.flush();
        window.removeEventListener('pagehide', this.flush);
        this.doc.off('update', this.handleLocalUpdate);
        this.awareness.off('update', this.handleAwarenessUpdate);
        this.client.deactivate();
        this.awareness.destroy();
        this.doc.destroy();
    }

    // ---- connection & sync ----

    private handleConnect = () => {
        const topic = `/topic/room/${this.opts.roomCode}`;
        this.client.subscribe(`${topic}/updates`, (msg) => this.receiveUpdate(JSON.parse(msg.body)));
        this.client.subscribe(`${topic}/awareness`, (msg) =>
            applyAwarenessUpdate(this.awareness, fromBase64(msg.body), REMOTE));
        this.client.subscribe('/user/queue/saved', () => {
            if (!this.dirty) this.opts.onSaveStatusChange('saved');
        });
        this.requestState();
        this.opts.onConnectionChange(true);
    };

    // (re)load the full room state; used on every connect and whenever we detect a gap
    private requestState() {
        this.synced = false;
        this.buffered = [];
        const sub = this.client.subscribe(`/app/room/${this.opts.roomCode}/state`, (msg) => {
            sub.unsubscribe();
            const state: SyncState = JSON.parse(msg.body);
            if (state.snapshot) Y.applyUpdate(this.doc, fromBase64(state.snapshot), REMOTE);
            state.updates.forEach((u) => Y.applyUpdate(this.doc, fromBase64(u), REMOTE));
            this.seq = state.nextSeq;
            this.synced = true;
            this.buffered.forEach((u) => this.receiveUpdate(u));
            this.buffered = [];

            if (!this.everSynced) {
                this.everSynced = true;
                this.seedIfNew();
                this.opts.onLanguageChange(this.language);
                this.opts.onSynced();
            } else {
                // push everything we have: covers edits made while offline and a server restart
                this.publish('update', toBase64(Y.encodeStateAsUpdate(this.doc)));
            }
            this.sendAwareness([this.doc.clientID]);
            if (this.dirty) this.save();
        });
    }

    private receiveUpdate(msg: SyncUpdate) {
        if (!this.synced) {
            this.buffered.push(msg);
            return;
        }
        if (msg.seq < this.seq) return; // already applied (part of the state we loaded)
        if (msg.seq > this.seq) {
            this.requestState(); // we missed something; Yjs makes re-applying harmless
            return;
        }
        Y.applyUpdate(this.doc, fromBase64(msg.update), REMOTE);
        this.seq++;
    }

    // Rooms with no Yjs history yet (new, or created before Yjs) start from their saved text.
    // The seed is built with a fixed client id, so if two people open the room at the same
    // moment they produce identical updates and Yjs keeps only one copy.
    private seedIfNew() {
        if (this.doc.store.clients.size > 0) return;
        const seed = new Y.Doc();
        seed.clientID = 0;
        seed.getText('code').insert(0, this.opts.initialContent.replace(/\r\n?/g, '\n'));
        seed.getMap('meta').set('language', this.opts.initialLanguage);
        Y.applyUpdate(this.doc, Y.encodeStateAsUpdate(seed), 'seed');
        seed.destroy();
    }

    // ---- outgoing ----

    private publish(action: string, body: string) {
        if (this.client.connected) {
            this.client.publish({ destination: `/app/room/${this.opts.roomCode}/${action}`, body });
        }
    }

    private handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
        if (origin === REMOTE) return;
        this.publish('update', toBase64(update));
        this.dirty = true;
        this.opts.onSaveStatusChange('unsaved');
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(this.save, SAVE_DELAY_MS);
    };

    private flush = () => {
        removeAwarenessStates(this.awareness, [this.doc.clientID], 'local');
        this.save();
    };

    // ---- presence & cursors ----

    private sendAwareness(clients: number[]) {
        this.publish('awareness', toBase64(encodeAwarenessUpdate(this.awareness, clients)));
    }

    private handleAwarenessUpdate = (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
    ) => {
        if (origin !== REMOTE) {
            this.sendAwareness([...added, ...updated, ...removed]);
        } else if (added.length > 0) {
            this.sendAwareness([this.doc.clientID]); // introduce ourselves to newcomers
        }
    };

    private handlePeersChange = () => {
        const peers: Peer[] = [];
        this.awareness.getStates().forEach((state, clientId) => {
            if (state.user) peers.push({ clientId, ...state.user });
        });
        this.opts.onPeersChange(peers);
    };

    private handleMetaChange = () => this.opts.onLanguageChange(this.language);
}
