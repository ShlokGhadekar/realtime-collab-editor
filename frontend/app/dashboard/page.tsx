'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Plus, SquareCode } from 'lucide-react';
import { clearSession, errorMessage, getSession, LANGUAGES, Room, roomApi } from '@/lib/api';
import { Avatar, AvatarStack, Button, ErrorMessage, Field, inputClass, Kbd, Logo } from '@/components/ui';
import { Modal } from '@/components/modal';

type ModalKind = 'create' | 'join' | null;

export default function DashboardPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [rooms, setRooms] = useState<Room[] | null>(null); // null while loading
    const [loadError, setLoadError] = useState('');
    const [modal, setModal] = useState<ModalKind>(null);

    const loadRooms = useCallback(() => {
        const session = getSession();
        if (!session) { router.replace('/login'); return; }
        roomApi.myRooms()
            .then((res) => { setUsername(session.username); setRooms(res.data); setLoadError(''); })
            .catch((err) => { setUsername(session.username); setLoadError(errorMessage(err, "Couldn't load your rooms.")); });
    }, [router]);

    useEffect(loadRooms, [loadRooms]);

    // Linear-style shortcuts: N = new room, J = join room
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (modal || e.metaKey || e.ctrlKey || e.altKey) return;
            if ((e.target as HTMLElement).closest('input, textarea, select')) return;
            if (e.key === 'n') { e.preventDefault(); setModal('create'); }
            if (e.key === 'j') { e.preventDefault(); setModal('join'); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [modal]);

    const signOut = () => {
        clearSession();
        router.push('/login');
    };

    return (
        <>
            <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/80 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
                    <Logo href="/dashboard" />
                    {username && (
                        <div className="flex items-center gap-3">
                            <Avatar name={username} />
                            <span className="hidden text-sm text-ink-muted sm:inline">{username}</span>
                            <Button variant="ghost" size="sm" onClick={signOut}>
                                <LogOut size={14} /> Sign out
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-[-0.6px]">Rooms</h1>
                        <p className="mt-1 text-sm text-ink-subtle">
                            {!rooms ? 'Loading your rooms…' : rooms.length === 0 ? 'Create a room or join one with a code.' : `${rooms.length} room${rooms.length === 1 ? '' : 's'} you're a member of`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setModal('join')}>Join room <Kbd>J</Kbd></Button>
                        <Button variant="primary" onClick={() => setModal('create')}>
                            <Plus size={15} /> New room <Kbd>N</Kbd>
                        </Button>
                    </div>
                </div>

                {loadError ? (
                    <div className="space-y-3">
                        <ErrorMessage>{loadError}</ErrorMessage>
                        <Button size="sm" onClick={loadRooms}>Try again</Button>
                    </div>
                ) : rooms === null ? (
                    <RoomListSkeleton />
                ) : rooms.length === 0 ? (
                    <EmptyState onCreate={() => setModal('create')} onJoin={() => setModal('join')} />
                ) : (
                    <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-surface-1">
                        {rooms.map((room) => <RoomRow key={room.id} room={room} me={username} />)}
                    </ul>
                )}
            </main>

            <Modal open={modal === 'create'} onClose={() => setModal(null)}
                title="New room" description="You'll get a code and a link to invite others.">
                <CreateRoomForm onCancel={() => setModal(null)} onCreated={(code) => router.push(`/editor/${code}`)} />
            </Modal>
            <Modal open={modal === 'join'} onClose={() => setModal(null)}
                title="Join a room" description="Enter the 6-character code someone shared with you.">
                <JoinRoomForm onCancel={() => setModal(null)} onJoined={(code) => router.push(`/editor/${code}`)} />
            </Modal>
        </>
    );
}

function RoomRow({ room, me }: { room: Room; me: string }) {
    const language = LANGUAGES[room.language] ?? { label: room.language, color: '#8a8f98' };
    const members = [...new Set(room.memberUsernames)].map((name) => ({ name }));
    return (
        <li>
            <Link href={`/editor/${room.code}`} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: language.color }} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{room.name}</p>
                    <p className="truncate text-xs text-ink-subtle">
                        {language.label} · {room.ownerUsername === me ? 'Owned by you' : `Owned by ${room.ownerUsername}`}
                    </p>
                </div>
                <div className="hidden sm:block"><AvatarStack people={members} max={3} /></div>
                <span className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-xs tracking-wider text-ink-subtle">{room.code}</span>
                <ChevronRight size={16} className="text-ink-tertiary transition-colors group-hover:text-ink-subtle" />
            </Link>
        </li>
    );
}

function RoomListSkeleton() {
    return (
        <div className="divide-y divide-hairline rounded-xl border border-hairline bg-surface-1" aria-hidden>
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                    <span className="size-2 rounded-full bg-surface-4" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 animate-pulse rounded bg-surface-4" />
                        <div className="h-2.5 w-24 animate-pulse rounded bg-surface-3" />
                    </div>
                    <div className="h-5 w-16 animate-pulse rounded-md bg-surface-3" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
    return (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-hairline-strong px-6 py-16 text-center">
            <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-surface-2 text-ink-subtle">
                <SquareCode size={20} />
            </span>
            <h2 className="mt-4 text-[15px] font-semibold">No rooms yet</h2>
            <p className="mt-1 max-w-sm text-sm text-ink-subtle">
                Create a room and share its link. Everyone in the room edits the same file in real time.
            </p>
            <div className="mt-6 flex gap-2">
                <Button onClick={onJoin}>Join with a code</Button>
                <Button variant="primary" onClick={onCreate}><Plus size={15} /> New room</Button>
            </div>
        </div>
    );
}

function CreateRoomForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (code: string) => void }) {
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await roomApi.create({ name: name.trim(), language });
            onCreated(res.data.code);
        } catch (err) {
            setError(errorMessage(err, 'Could not create the room.'));
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <ErrorMessage>{error}</ErrorMessage>
            <Field label="Name" placeholder="e.g. Interview prep" required autoFocus minLength={2} maxLength={50}
                value={name} onChange={(e) => setName(e.target.value)} />
            <div className="space-y-1.5">
                <label htmlFor="room-language" className="block text-[13px] font-medium text-ink-muted">Language</label>
                <select id="room-language" className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
                    {Object.entries(LANGUAGES).map(([id, { label }]) => <option key={id} value={id}>{label}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary" loading={loading}>Create room</Button>
            </div>
        </form>
    );
}

function JoinRoomForm({ onCancel, onJoined }: { onCancel: () => void; onJoined: (code: string) => void }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await roomApi.join(code);
            onJoined(res.data.code);
        } catch (err) {
            const message = errorMessage(err, '');
            setError(message.startsWith("Can't reach") ? message : `No room found with code ${code}.`);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <ErrorMessage>{error}</ErrorMessage>
            <Field label="Room code" placeholder="A1B2C3" required autoFocus minLength={6} maxLength={6}
                autoComplete="off" spellCheck={false}
                className="h-12 text-center font-mono text-lg tracking-[0.4em] uppercase"
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary" loading={loading}>Join room</Button>
            </div>
        </form>
    );
}
