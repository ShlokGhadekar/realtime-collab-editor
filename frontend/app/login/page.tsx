'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, errorMessage, getSession, saveSession } from '@/lib/api';
import { AuthLayout, Button, ErrorMessage, Field } from '@/components/ui';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (getSession()) router.replace('/dashboard');
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authApi.login({ email, password });
            saveSession(res.data);
            router.push('/dashboard');
        } catch (err) {
            // the server says "Bad credentials"; keep the wording friendlier
            const message = errorMessage(err, '');
            setError(message.startsWith("Can't reach") ? message : 'Incorrect email or password.');
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to get back to your rooms."
            footer={<>No account yet? <Link href="/signup" className="text-ink hover:text-primary-hover">Create one</Link></>}
        >
            <form onSubmit={handleLogin} className="space-y-4">
                <ErrorMessage>{error}</ErrorMessage>
                <Field label="Email" type="email" autoComplete="email" required autoFocus
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                <Field label="Password" type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" variant="primary" className="w-full" loading={loading}>
                    Sign in
                </Button>
            </form>
        </AuthLayout>
    );
}
