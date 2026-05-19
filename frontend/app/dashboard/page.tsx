'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { roomApi } from '@/lib/api';

interface Room {
    id: number;
    name: string;
    code: string;
    language: string;
    ownerUsername: string;
    memberCount: number;
}

const LANG_COLORS: Record<string, string> = {
    javascript: 'text-yellow-400',
    typescript: 'text-blue-400',
    python: 'text-emerald-400',
    java: 'text-orange-400',
    cpp: 'text-purple-400',
    go: 'text-cyan-400',
    rust: 'text-red-400',
};

export default function DashboardPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [username, setUsername] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomLang, setNewRoomLang] = useState('javascript');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        setUsername(localStorage.getItem('username') || '');
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const res = await roomApi.myRooms();
            setRooms(res.data);
        } catch {
            router.push('/login');
        }
    };

    const createRoom = async () => {
        if (!newRoomName.trim()) return;
        setLoading(true);
        try {
            const res = await roomApi.create({ name: newRoomName, language: newRoomLang });
            router.push(`/editor/${res.data.code}`);
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = async () => {
        if (!joinCode.trim()) return;
        setLoading(true);
        try {
            const res = await roomApi.join(joinCode.toUpperCase());
            router.push(`/editor/${res.data.code}`);
        } catch {
            alert('Room not found');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white font-mono">
            {/* Nav */}
            <nav className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white/80 font-bold tracking-tight">collabeditor</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-white/30 text-sm">@{username}</span>
                    <button
                        onClick={() => { localStorage.clear(); router.push('/login'); }}
                        className="text-white/20 hover:text-white/50 text-sm transition-colors"
                    >
                        logout
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-2xl font-bold text-white/90 tracking-tight">Your rooms</h1>
                        <p className="text-white/30 text-sm mt-1">{rooms.length} active session{rooms.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowJoin(true)}
                            className="px-4 py-2 text-sm border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white/80 rounded transition-all"
                        >
                            join room
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded transition-all"
                        >
                            + new room
                        </button>
                    </div>
                </div>

                {/* Rooms list */}
                {rooms.length === 0 ? (
                    <div className="border border-dashed border-white/[0.06] rounded-xl py-20 text-center">
                        <p className="text-white/20 text-sm">no rooms yet</p>
                        <p className="text-white/10 text-xs mt-1">create one to start collaborating</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                onClick={() => router.push(`/editor/${room.code}`)}
                                className="group flex items-center justify-between px-5 py-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.10] rounded-xl cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 rounded-full bg-white/10 group-hover:bg-emerald-400/60 transition-colors" />
                                    <div>
                                        <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{room.name}</p>
                                        <p className="text-white/20 text-xs mt-0.5">{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs ${LANG_COLORS[room.language] || 'text-white/40'}`}>
                                        {room.language}
                                    </span>
                                    <span className="text-white/20 text-xs tracking-widest font-mono">{room.code}</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/10 group-hover:text-white/40 transition-colors">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white/80 font-bold mb-5">New room</h3>
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/20 mb-3"
                            placeholder="Room name"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                        />
                        <select
                            value={newRoomLang}
                            onChange={(e) => setNewRoomLang(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] text-white/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/20 mb-4"
                        >
                            {['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'].map(l => (
                                <option key={l} value={l} className="bg-[#1a1a1a]">{l}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 text-sm border border-white/[0.08] text-white/40 rounded-lg hover:text-white/60 transition-colors">
                                cancel
                            </button>
                            <button onClick={createRoom} disabled={loading} className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg disabled:opacity-50 transition-all">
                                {loading ? 'creating...' : 'create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join modal */}
            {showJoin && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white/80 font-bold mb-5">Join room</h3>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/20 mb-4 font-mono tracking-[0.3em] text-center text-lg"
                            placeholder="XXXXXX"
                            maxLength={6}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowJoin(false)} className="flex-1 py-2.5 text-sm border border-white/[0.08] text-white/40 rounded-lg hover:text-white/60 transition-colors">
                                cancel
                            </button>
                            <button onClick={joinRoom} disabled={loading} className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg disabled:opacity-50 transition-all">
                                {loading ? 'joining...' : 'join'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}