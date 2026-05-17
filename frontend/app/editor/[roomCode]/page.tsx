'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { roomApi } from '@/lib/api';
import {
    connectWebSocket,
    disconnectWebSocket,
    sendCodeChange,
    CodeChangeMessage,
    PresenceMessage,
} from '@/lib/websocket';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function EditorPage() {
    const router = useRouter();
    const params = useParams();
    const roomCode = params.roomCode as string;

    const [code, setCode] = useState('// Start coding...\n');
    const [language, setLanguage] = useState('javascript');
    const [roomName, setRoomName] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);
    const [username, setUsername] = useState('');

    const isRemoteChange = useRef(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('username') || '';
        if (!token) { router.push('/login'); return; }
        setUsername(user);

        roomApi.myRooms().then((res) => {
            const room = res.data.find((r: {
                code: string;
                name: string;
                language: string;
                memberUsernames: string[];
                id: number;
            }) => r.code === roomCode);

            if (!room) { router.push('/dashboard'); return; }

            setRoomName(room.name);
            setLanguage(room.language);
            setMembers(room.memberUsernames);

            roomApi.getById(room.id).then((roomRes) => {
                setCode(roomRes.data.content || '// Start coding...\n');
            }).catch(() => {
                setCode('// Start coding...\n');
            });
        }).catch(() => {
            router.push('/login');
        });

        connectWebSocket(
            roomCode,
            user,
            (msg: CodeChangeMessage) => {
                if (msg.senderUsername !== user) {
                    isRemoteChange.current = true;
                    setCode(msg.content);
                }
            },
            (msg: PresenceMessage) => {
                if (msg.event === 'JOINED') {
                    setMembers((prev) => [...new Set([...prev, msg.username])]);
                } else {
                    setMembers((prev) => prev.filter((m) => m !== msg.username));
                }
            },
            () => setConnected(true)
        );

        return () => {
            disconnectWebSocket(roomCode, user);
        };
    }, [roomCode]);

    const handleCodeChange = useCallback((value: string | undefined) => {
        const newCode = value || '';
        setCode(newCode);

        if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
        }

        sendCodeChange({
            roomCode,
            content: newCode,
            senderUsername: username,
            language,
            timestamp: Date.now(),
        });
    }, [roomCode, username, language]);

    return (
        <div className="h-screen bg-gray-950 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-gray-400 hover:text-white text-sm transition"
                    >
                        ← Back
                    </button>
                    <span className="text-white font-medium">{roomName}</span>
                    <span className="font-mono text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                        {roomCode}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span className="text-xs text-gray-400">
                            {connected ? 'Live' : 'Connecting...'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {members.slice(0, 4).map((member) => (
                            <div
                                key={member}
                                title={member}
                                className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white"
                            >
                                {member[0].toUpperCase()}
                            </div>
                        ))}
                        {members.length > 4 && (
                            <span className="text-xs text-gray-400">+{members.length - 4}</span>
                        )}
                    </div>

                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-800 text-gray-300 text-sm rounded px-2 py-1 border border-gray-700"
                    >
                        {['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'].map((l) => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1">
                <MonacoEditor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                        tabSize: 2,
                    }}
                />
            </div>
        </div>
    );
}