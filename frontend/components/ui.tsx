import { useId } from 'react';
import Link from 'next/link';
import { Code2, Loader2 } from 'lucide-react';

// Shared building blocks styled per DESIGN.md. Colors come from the tokens in globals.css.
// No 'use client' here so server components (the landing page) can use these too.

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-focus',
    secondary: 'bg-surface-1 text-ink border border-hairline hover:bg-surface-2 hover:border-hairline-strong',
    ghost: 'text-ink-subtle hover:text-ink hover:bg-surface-2',
};

const SIZES: Record<Size, string> = {
    sm: 'h-7 px-2.5 text-[13px] gap-1.5',
    md: 'h-9 px-3.5 text-sm gap-2',
};

// also used to style <Link>s as buttons
export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', extra = '') =>
    `inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

export function Button({ variant, size, loading, className, children, disabled, ...props }: ButtonProps) {
    return (
        <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
            {loading && <Spinner />}
            {children}
        </button>
    );
}

export function Spinner({ size = 14 }: { size?: number }) {
    return <Loader2 size={size} className="animate-spin" aria-hidden />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 font-sans text-[11px] font-medium opacity-70">
            {children}
        </kbd>
    );
}

export const inputClass =
    'w-full h-10 rounded-lg border border-hairline bg-surface-1 px-3 text-sm text-ink placeholder:text-ink-tertiary transition-colors hover:border-hairline-strong focus:border-primary-focus focus:outline-none focus:ring-2 focus:ring-primary-focus/30';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
}

export function Field({ label, hint, className = '', ...props }: FieldProps) {
    const id = useId();
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-[13px] font-medium text-ink-muted">{label}</label>
            <input id={id} className={`${inputClass} ${className}`} {...props} />
            {hint && <p className="text-xs text-ink-tertiary">{hint}</p>}
        </div>
    );
}

export function ErrorMessage({ children }: { children: React.ReactNode }) {
    if (!children) return null;
    return (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-[13px] text-danger">
            {children}
        </p>
    );
}

export function Logo({ href = '/' }: { href?: string }) {
    return (
        <Link href={href} className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.3px] text-ink">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-white">
                <Code2 size={14} strokeWidth={2.5} />
            </span>
            CollabEditor
        </Link>
    );
}

export function Avatar({ name, color, size = 24 }: { name: string; color?: string; size?: number }) {
    return (
        <span
            title={name}
            style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.42 }}
            className={`grid shrink-0 place-items-center rounded-full font-semibold uppercase ring-2 ring-canvas ${color ? 'text-canvas' : 'bg-surface-4 text-ink-muted'}`}
        >
            {name[0]}
        </span>
    );
}

export function AvatarStack({ people, max = 4 }: { people: { name: string; color?: string }[]; max?: number }) {
    return (
        <div className="flex items-center -space-x-1.5">
            {people.slice(0, max).map((p) => <Avatar key={p.name} name={p.name} color={p.color} />)}
            {people.length > max && (
                <span className="grid size-6 place-items-center rounded-full bg-surface-4 text-[10px] font-medium text-ink-subtle ring-2 ring-canvas">
                    +{people.length - max}
                </span>
            )}
        </div>
    );
}

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    footer: React.ReactNode;
    children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, footer, children }: AuthLayoutProps) {
    return (
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
            <div className="w-full max-w-[360px]">
                <Logo />
                <h1 className="mt-10 text-2xl font-semibold tracking-[-0.6px]">{title}</h1>
                <p className="mt-1.5 text-sm text-ink-subtle">{subtitle}</p>
                <div className="mt-8">{children}</div>
                <p className="mt-8 text-sm text-ink-subtle">{footer}</p>
            </div>
        </main>
    );
}
