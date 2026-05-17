'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authApi.signup(form);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            router.push('/dashboard');
        } catch {
            setError('Signup failed. Email or username may already be taken.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md border border-gray-800">
                <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
                <p className="text-gray-400 mb-6">Start collaborating in seconds</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    {[
                        { label: 'Username', key: 'username', type: 'text', placeholder: 'shlok' },
                        { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
                        { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                    ].map(({ label, key, type, placeholder }) => (
                        <div key={key}>
                            <label className="block text-sm text-gray-400 mb-1">{label}</label>
                            <input
                                type={type}
                                value={form[key as keyof typeof form]}
                                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none"
                                placeholder={placeholder}
                                required
                            />
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="text-gray-400 text-sm mt-6 text-center">
                    Already have an account?{' '}
                    <a href="/login" className="text-blue-400 hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}