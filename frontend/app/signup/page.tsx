'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, errorMessage, getSession, saveSession } from '@/lib/api';
import { AuthLayout, Button, ErrorMessage, Field } from '@/components/ui';

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (getSession()) router.replace('/dashboard');
    }, [router]);

    const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [field]: e.target.value });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authApi.signup(form);
            saveSession(res.data);
            router.push('/dashboard');
        } catch (err) {
            setError(errorMessage(err, 'Could not create your account. Please try again.'));
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Start a room and invite others in seconds."
            footer={<>Already have an account? <Link href="/login" className="text-ink hover:text-primary-hover">Sign in</Link></>}
        >
            {/* limits mirror the backend's SignupRequest validation */}
            <form onSubmit={handleSignup} className="space-y-4">
                <ErrorMessage>{error}</ErrorMessage>
                <Field label="Username" autoComplete="username" required autoFocus minLength={3} maxLength={20}
                    hint="3–20 characters. Shown to people you code with."
                    value={form.username} onChange={update('username')} />
                <Field label="Email" type="email" autoComplete="email" required
                    value={form.email} onChange={update('email')} />
                <Field label="Password" type="password" autoComplete="new-password" required minLength={6} maxLength={40}
                    hint="At least 6 characters."
                    value={form.password} onChange={update('password')} />
                <Button type="submit" variant="primary" className="w-full" loading={loading}>
                    Create account
                </Button>
            </form>
        </AuthLayout>
    );
}
