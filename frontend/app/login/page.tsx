'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authApi.login({ email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            router.push('/dashboard');
        } catch {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center font-mono">
            <div className="w-full max-w-sm px-6">
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-white/60 text-sm font-bold tracking-tight">collabeditor</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white/90">Welcome back</h1>
                    <p className="text-white/30 text-sm mt-1">Sign in to continue</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/[0.04] text-white/80 rounded-lg px-4 py-3 border border-white/[0.08] focus:border-white/20 focus:outline-none text-sm placeholder:text-white/20"
                        placeholder="email"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/[0.04] text-white/80 rounded-lg px-4 py-3 border border-white/[0.08] focus:border-white/20 focus:outline-none text-sm placeholder:text-white/20"
                        placeholder="password"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-all text-sm"
                    >
                        {loading ? 'signing in...' : 'sign in →'}
                    </button>
                </form>

                <p className="text-white/20 text-sm mt-6 text-center">
                    no account?{' '}
                    <a href="/signup" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">
                        sign up
                    </a>
                </p>
            </div>
        </div>
    );
}