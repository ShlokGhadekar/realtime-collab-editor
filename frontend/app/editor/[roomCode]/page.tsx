'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { roomApi, executeCode, LANGUAGE_IDS } from '@/lib/api';
import {
    connectWebSocket,
    disconnectWebSocket,
    sendCodeChange,
    CodeChangeMessage,
    PresenceMessage,
} from '@/lib/websocket';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type SaveStatus = 'saved' | 'unsaved' | 'saving';

const COLORS = [
    'bg-violet-500', 'bg-emerald-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500'
];

export default function EditorPage() {
    const router = useRouter();
    const params = useParams();
    const roomCode = params.roomCode as string;

    const [code, setCode] = useState<string | null>(null);
    const [language, setLanguage] = useState('javascript');
    const [roomName, setRoomName] = useState('');
    const [roomId, setRoomId] = useState<number | null>(null);
    const [members, setMembers] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);
    const [username, setUsername] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [output, setOutput] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const [copied, setCopied] = useState(false);

    // refs — never stale inside callbacks
    const editorRef = useRef<any>(null);
    const isRemoteChange = useRef(false);
    const isInitialized = useRef(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
    const latestCode = useRef('');
    const usernameRef = useRef('');
    const roomIdRef = useRef<number | null>(null);
    const languageRef = useRef('javascript');
    const roomCodeRef = useRef(roomCode);

    const saveToServer = async (content: string, id: number) => {
        setSaveStatus('saving');
        try {
            await roomApi.saveContent(id, content);
            setSaveStatus('saved');
        } catch (e) {
            console.error('Save failed', e);
            setSaveStatus('unsaved');
        }
    };

    const handleRun = async () => {
        setRunning(true);
        setShowOutput(true);
        setOutput('Running...');
        try {
            const result = await executeCode(latestCode.current, languageRef.current);
            setOutput(result);
        } catch {
            setOutput('Execution failed.');
        } finally {
            setRunning(false);
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // keep refs in sync with state
    useEffect(() => { usernameRef.current = username; }, [username]);
    useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
    useEffect(() => { languageRef.current = language; }, [language]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('username') || '';
        if (!token) { router.push('/login'); return; }
        setUsername(user);
        usernameRef.current = user;

        roomApi.myRooms().then((res) => {
            const room = res.data.find((r: {
                code: string; name: string; language: string;
                memberUsernames: string[]; id: number;
            }) => r.code === roomCode);

            if (!room) { router.push('/dashboard'); return; }

            setRoomName(room.name);
            setLanguage(room.language);
            languageRef.current = room.language;
            const uniqueMembers = [...new Set<string>(room.memberUsernames)];
            setMembers(uniqueMembers);
            setRoomId(room.id);
            roomIdRef.current = room.id;

            roomApi.getById(room.id).then((roomRes) => {
                const savedContent = roomRes.data.content || '// Start coding...\n';
                isInitialized.current = false;
                setCode(savedContent);
                latestCode.current = savedContent;
            }).catch(() => {
                isInitialized.current = false;
                setCode('// Start coding...\n');
                latestCode.current = '// Start coding...\n';
            });
        }).catch(() => router.push('/login'));

        connectWebSocket(roomCode, user,
            (msg: CodeChangeMessage) => {
                if (msg.senderUsername !== user) {
                    isRemoteChange.current = true;
                    latestCode.current = msg.content;
                    if (editorRef.current) {
                        const editor = editorRef.current;
                        const position = editor.getPosition();
                        editor.setValue(msg.content);
                        if (position) editor.setPosition(position);
                    }
                }
            },
            (msg: PresenceMessage) => {
                setMembers((prev) => {
                    const without = prev.filter((m) => m !== msg.username);
                    if (msg.event === 'JOINED') return [...without, msg.username];
                    return without;
                });
            },
            () => setConnected(true)
        );

        return () => {
            disconnectWebSocket(roomCode, user);
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            if (autosaveTimer.current) clearInterval(autosaveTimer.current);
        };
    }, [roomCode]);

    useEffect(() => {
        if (!roomId) return;
        autosaveTimer.current = setInterval(() => {
            if (saveStatus === 'unsaved' && roomIdRef.current) {
                saveToServer(latestCode.current, roomIdRef.current);
            }
        }, 30000);
        return () => { if (autosaveTimer.current) clearInterval(autosaveTimer.current); };
    }, [roomId, saveStatus]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (roomIdRef.current) saveToServer(latestCode.current, roomIdRef.current);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleRun();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="h-screen bg-[#0d0d0d] flex flex-col font-mono">
            {/* Top bar */}
            <div className="h-11 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#111111]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </button>
                    <span className="text-white/10">|</span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white/70 text-xs font-medium">{roomName}</span>
                    </div>
                    <button
                        onClick={copyRoomCode}
                        className="flex items-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] rounded px-2 py-0.5 transition-all"
                    >
                        <span className="text-white/50 text-xs tracking-widest">{roomCode}</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        {copied && <span className="text-emerald-400 text-xs">✓</span>}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`text-xs transition-all ${
                        saveStatus === 'saved' ? 'text-emerald-400/70' :
                        saveStatus === 'saving' ? 'text-blue-400/70' : 'text-amber-400/70'
                    }`}>
                        {saveStatus === 'saved' ? '● saved' :
                         saveStatus === 'saving' ? '↑ saving' : '● unsaved'}
                    </span>

                    <div className="flex items-center">
                        {[...new Set(members)].slice(0, 5).map((member, i) => (
                            <div
                                key={member}
                                title={member}
                                style={{ zIndex: 10 - i, marginLeft: i > 0 ? '-6px' : '0' }}
                                className={`w-6 h-6 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#111111] relative`}
                            >
                                {member[0].toUpperCase()}
                            </div>
                        ))}
                        {members.length > 5 && (
                            <div style={{ zIndex: 0, marginLeft: '-6px' }} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/50 border-2 border-[#111111]">
                                +{members.length - 5}
                            </div>
                        )}
                    </div>

                    <select
                        value={language}
                        onChange={(e) => {
                            setLanguage(e.target.value);
                            languageRef.current = e.target.value;
                        }}
                        className="bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs rounded px-2 py-1 focus:outline-none focus:border-white/20"
                    >
                        {Object.keys(LANGUAGE_IDS).map((l) => (
                            <option key={l} value={l} className="bg-[#1a1a1a]">{l}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleRun}
                        disabled={running}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-black text-xs font-bold px-3 py-1.5 rounded transition-all"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 3l14 9-14 9V3z" />
                        </svg>
                        {running ? 'Running...' : 'Run'}
                        <span className="text-black/40 text-[10px]">⌘↵</span>
                    </button>

                    <button
                        onClick={() => roomIdRef.current && saveToServer(latestCode.current, roomIdRef.current)}
                        className="text-white/30 hover:text-white/70 text-xs transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                    </button>

                    <div
                        className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
                        title={connected ? 'Connected' : 'Connecting...'}
                    />
                </div>
            </div>

            {/* Editor + Output */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`${showOutput ? 'h-[60%]' : 'h-full'} transition-all`}>
                    {code === null ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex items-center gap-3 text-white/20 text-sm">
                                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Loading editor...
                            </div>
                        </div>
                    ) : (
                        <MonacoEditor
                            height="100%"
                            language={language}
                            defaultValue={code}
                            theme="vs-dark"
                            onMount={(editor) => {
                                editorRef.current = editor;
                                isInitialized.current = false;

                                editor.onDidChangeModelContent(() => {
                                    const value = editor.getValue();
                                    latestCode.current = value;

                                    if (isRemoteChange.current) {
                                        isRemoteChange.current = false;
                                        return;
                                    }

                                    if (!isInitialized.current) {
                                        isInitialized.current = true;
                                        return;
                                    }

                                    setSaveStatus('unsaved');

                                    sendCodeChange({
                                        roomCode: roomCodeRef.current,
                                        content: value,
                                        senderUsername: usernameRef.current,
                                        language: languageRef.current,
                                        timestamp: Date.now(),
                                    });

                                    if (debounceTimer.current) clearTimeout(debounceTimer.current);
                                    debounceTimer.current = setTimeout(() => {
                                        if (roomIdRef.current) {
                                            saveToServer(value, roomIdRef.current);
                                        }
                                    }, 2000);
                                });
                            }}
                            options={{
                                fontSize: 13,
                                fontFamily: '"JetBrains Mono", "Fira Code", Menlo, monospace',
                                fontLigatures: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                automaticLayout: true,
                                tabSize: 2,
                                lineNumbers: 'on',
                                renderLineHighlight: 'line',
                                cursorBlinking: 'smooth',
                                smoothScrolling: true,
                                padding: { top: 16 },
                            }}
                        />
                    )}
                </div>

                {showOutput && (
                    <div className="flex flex-col border-t border-white/[0.06] bg-[#0a0a0a]" style={{ height: '40%' }}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
                            <div className="flex items-center gap-2">
                                <span className="text-white/30 text-xs uppercase tracking-wider">Output</span>
                                {running && (
                                    <svg className="animate-spin text-emerald-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <button
                                onClick={() => setShowOutput(false)}
                                className="text-white/20 hover:text-white/50 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <pre className="flex-1 overflow-auto p-4 text-xs text-emerald-300/80 leading-relaxed font-mono">
                            {output || 'No output yet. Press ⌘↵ to run.'}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}