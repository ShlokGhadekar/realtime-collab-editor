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

export default function DashboardPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [username, setUsername] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
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
            const res = await roomApi.create({ name: newRoomName, language: 'javascript' });
            setRooms([...rooms, res.data]);
            setShowCreate(false);
            setNewRoomName('');
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
            alert('Room not found. Check the code and try again.');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.clear();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-blue-400">CollabEditor</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">@{username}</span>
                    <button onClick={logout} className="text-gray-400 hover:text-white text-sm">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">Your Rooms</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowJoin(true)}
                            className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-sm transition"
                        >
                            Join Room
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm transition"
                        >
                            + New Room
                        </button>
                    </div>
                </div>

                {rooms.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg mb-2">No rooms yet</p>
                        <p className="text-sm">Create a room or join one with a code</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                onClick={() => router.push(`/editor/${room.code}`)}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-blue-500/50 transition group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition">
                                        {room.name}
                                    </h3>
                                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded font-mono">
                                        {room.language}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span className="font-mono text-xs tracking-wider">{room.code}</span>
                                    <span>{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Room Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none mb-4"
                            placeholder="Room name"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createRoom}
                                disabled={loading}
                                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Room Modal */}
            {showJoin && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-4">Join a Room</h3>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none mb-4 font-mono tracking-widest text-center text-lg"
                            placeholder="ENTER CODE"
                            maxLength={6}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowJoin(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={joinRoom}
                                disabled={loading}
                                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
                            >
                                {loading ? 'Joining...' : 'Join'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}