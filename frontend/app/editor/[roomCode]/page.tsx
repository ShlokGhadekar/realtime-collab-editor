'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { BeforeMount, OnMount } from '@monaco-editor/react';
import { Check, ChevronRight, CircleAlert, Copy, Link2, Play } from 'lucide-react';
import { errorMessage, executeCode, getSession, LANGUAGES, roomApi } from '@/lib/api';
import { CollabRoom, Peer, SaveStatus } from '@/lib/collab';
import { bindMonaco } from '@/lib/monaco-binding';
import { defineTheme, editorOptions, THEME_NAME } from '@/lib/monaco-theme';
import { AvatarStack, Button, buttonClass, Kbd, Spinner } from '@/components/ui';
import { OutputPanel, RunResult } from '@/components/output-panel';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// execution failures come back as normal output strings from the backend
const FAILED_OUTPUT = /^(Execution error|Code execution is not configured|No response)/;

export default function EditorPage() {
    const router = useRouter();
    const roomCode = useParams().roomCode as string;

    const [room, setRoom] = useState<CollabRoom | null>(null);
    const [roomName, setRoomName] = useState('');
    const [joinError, setJoinError] = useState('');
    const [synced, setSynced] = useState(false);
    const [connected, setConnected] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [peers, setPeers] = useState<Peer[]>([]);
    const [language, setLanguage] = useState('javascript');
    const [cursor, setCursor] = useState({ line: 1, column: 1 });
    const [copied, setCopied] = useState<'code' | 'link' | null>(null);

    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<RunResult | null>(null);
    const [showOutput, setShowOutput] = useState(false);
    const [outputHeight, setOutputHeight] = useState(240);

    const unbindEditor = useRef<(() => void) | null>(null);

    useEffect(() => {
        const session = getSession();
        if (!session) { router.replace('/login'); return; }

        let collab: CollabRoom | null = null;
        let cancelled = false;
        // joining is idempotent for members, and lets a shared /editor/CODE link work as an invite
        roomApi.join(roomCode).then(({ data }) => {
            if (cancelled) return;
            setRoomName(data.name);
            collab = new CollabRoom({
                roomCode,
                username: session.username,
                initialContent: data.content || `${LANGUAGES[data.language]?.comment ?? '//'} Start coding...\n`,
                initialLanguage: data.language,
                onSynced: () => setSynced(true),
                onConnectionChange: setConnected,
                onSaveStatusChange: setSaveStatus,
                onPeersChange: setPeers,
                onLanguageChange: setLanguage,
            });
            setRoom(collab);
        }).catch((err) => {
            if (!cancelled) setJoinError(errorMessage(err, `Room ${roomCode} doesn't exist or you can't access it.`));
        });

        return () => {
            cancelled = true;
            unbindEditor.current?.();
            unbindEditor.current = null;
            collab?.destroy();
        };
    }, [roomCode, router]);

    const handleRun = useCallback(async () => {
        if (!room || running) return;
        setRunning(true);
        setShowOutput(true);
        const started = performance.now();
        try {
            const output = await executeCode(room.text.toString(), room.language);
            setResult({ output: output || '(no output)', failed: FAILED_OUTPUT.test(output), durationMs: performance.now() - started });
        } catch (err) {
            setResult({ output: errorMessage(err, 'Execution failed.'), failed: true, durationMs: performance.now() - started });
        } finally {
            setRunning(false);
        }
    }, [room, running]);

    // Monaco commands are registered once, so they call the latest handlers through refs
    const shortcuts = useRef({ run: handleRun, save: () => room?.save() });
    useEffect(() => {
        shortcuts.current = { run: handleRun, save: () => room?.save() };
    }, [handleRun, room]);

    // the same shortcuts when focus is outside the editor
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey)) return;
            if (e.key === 's') { e.preventDefault(); shortcuts.current.save(); }
            if (e.key === 'Enter') { e.preventDefault(); shortcuts.current.run(); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const handleBeforeMount: BeforeMount = (monaco) => defineTheme(monaco);

    const handleMount: OnMount = (editor, monaco) => {
        if (!room) return;
        unbindEditor.current = bindMonaco(editor, monaco, room.text, room.awareness);
        // Monaco binds ⌘↵ to "insert line below" and swallows the event, so claim it here
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => shortcuts.current.run());
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => shortcuts.current.save());
        editor.onDidChangeCursorPosition(({ position }) =>
            setCursor({ line: position.lineNumber, column: position.column }));
        // Monaco measures glyphs once; re-measure after the web font arrives or cursors drift
        document.fonts.ready.then(() => monaco.editor.remeasureFonts());
        editor.focus();
    };

    // only computed once the editor renders (client side), where CSS variables are readable
    const options = useMemo(() => synced
        ? editorOptions(`${getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains-mono')}, ui-monospace, Menlo, monospace`)
        : undefined, [synced]);

    const copy = (what: 'code' | 'link') => {
        navigator.clipboard.writeText(what === 'code' ? roomCode : `${window.location.origin}/editor/${roomCode}`);
        setCopied(what);
        setTimeout(() => setCopied(null), 2000);
    };

    // one avatar per person, even if they have the room open in several tabs
    const online = [...new Map(peers.map((p) => [p.name, p])).values()];

    if (joinError) {
        return (
            <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
                <CircleAlert size={24} className="text-ink-subtle" />
                <p className="max-w-sm text-sm text-ink-muted">{joinError}</p>
                <Link href="/dashboard" className={buttonClass('secondary')}>Back to rooms</Link>
            </main>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-canvas">
            <title>{roomName ? `${roomName} · CollabEditor` : 'CollabEditor'}</title>

            <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-hairline px-3">
                <nav className="flex min-w-0 items-center gap-1.5 text-sm">
                    <Link href="/dashboard" className="shrink-0 rounded px-1.5 py-1 text-ink-subtle transition-colors hover:text-ink">Rooms</Link>
                    <ChevronRight size={14} className="shrink-0 text-ink-tertiary" />
                    <span className="truncate font-medium text-ink">{roomName}</span>
                    <button
                        onClick={() => copy('code')}
                        title="Copy room code"
                        className="ml-1 hidden shrink-0 items-center gap-1.5 rounded-md sm:flex border border-hairline bg-surface-1 px-1.5 py-0.5 font-mono text-xs tracking-wider text-ink-subtle transition-colors hover:border-hairline-strong hover:text-ink"
                    >
                        {roomCode}
                        {copied === 'code' ? <Check size={12} className="text-success" /> : <Copy size={11} />}
                    </button>
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    <SaveIndicator status={saveStatus} />
                    <div className="hidden sm:block"><AvatarStack people={online} /></div>
                    <div className="hidden sm:block">
                        <Button size="sm" onClick={() => copy('link')}>
                            {copied === 'link' ? <Check size={13} className="text-success" /> : <Link2 size={13} />}
                            {copied === 'link' ? 'Link copied' : 'Invite'}
                        </Button>
                    </div>
                    <select
                        aria-label="Language"
                        value={language}
                        onChange={(e) => room?.setLanguage(e.target.value)}
                        className="h-7 rounded-lg border border-hairline bg-surface-1 px-2 text-[13px] text-ink-muted transition-colors hover:border-hairline-strong focus:border-primary-focus focus:outline-none"
                    >
                        {Object.entries(LANGUAGES).map(([id, { label }]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                    <Button variant="primary" size="sm" onClick={handleRun} loading={running} disabled={!synced}>
                        {!running && <Play size={12} fill="currentColor" />} Run <Kbd>⌘↵</Kbd>
                    </Button>
                </div>
            </header>

            <div className="relative min-h-0 flex-1 bg-surface-1">
                {synced ? (
                    <MonacoEditor
                        height="100%"
                        language={language}
                        theme={THEME_NAME}
                        beforeMount={handleBeforeMount}
                        onMount={handleMount}
                        loading={<EditorLoading label="Loading editor…" />}
                        options={options}
                    />
                ) : (
                    <EditorLoading label="Connecting to room…" />
                )}
            </div>

            {showOutput && (
                <OutputPanel
                    height={outputHeight}
                    onResize={setOutputHeight}
                    running={running}
                    result={result}
                    onClear={() => setResult(null)}
                    onClose={() => setShowOutput(false)}
                />
            )}

            <footer className="flex h-7 shrink-0 items-center justify-between border-t border-hairline px-3 text-[11px] text-ink-subtle">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${connected ? 'bg-success' : 'animate-pulse bg-warning'}`} />
                        {connected ? 'Connected' : 'Reconnecting…'}
                    </span>
                    <span>{online.length} online</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>Ln {cursor.line}, Col {cursor.column}</span>
                    <span>{LANGUAGES[language]?.label ?? language}</span>
                    <button onClick={() => setShowOutput(!showOutput)} className="transition-colors hover:text-ink">
                        {showOutput ? 'Hide output' : 'Show output'}
                    </button>
                </div>
            </footer>
        </div>
    );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
    return (
        <span className="hidden items-center gap-1.5 px-1 text-xs text-ink-subtle md:flex" aria-live="polite">
            {status === 'saving' && <><Spinner size={12} /> Saving…</>}
            {status === 'saved' && <><Check size={13} /> Saved</>}
            {status === 'unsaved' && <><span className="size-1.5 rounded-full bg-warning" /> Unsaved</>}
        </span>
    );
}

function EditorLoading({ label }: { label: string }) {
    return (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-subtle">
            <Spinner /> {label}
        </div>
    );
}
