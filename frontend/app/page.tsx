import Link from 'next/link';
import { GitMerge, MousePointer2, Play } from 'lucide-react';
import { buttonClass, Logo } from '@/components/ui';

const FEATURES = [
    {
        icon: GitMerge,
        title: 'Edits never collide',
        body: 'Every keystroke is a CRDT operation, so simultaneous edits merge the same way on every screen — no lost characters, no jumping cursors.',
    },
    {
        icon: MousePointer2,
        title: 'See who is where',
        body: 'Live cursors with names, selections and an online list. Undo only takes back your own changes.',
    },
    {
        icon: Play,
        title: 'Run it right there',
        body: 'Execute JavaScript, TypeScript, Python, Java, C++, Go and Rust from the editor and share the output.',
    },
];

export default function Home() {
    return (
        <div className="flex flex-1 flex-col">
            <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                <Logo />
                <nav className="flex items-center gap-2">
                    <Link href="/login" className={buttonClass('ghost', 'sm')}>Sign in</Link>
                    <Link href="/signup" className={buttonClass('primary', 'sm')}>Get started</Link>
                </nav>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
                <section className="pt-20 pb-14 text-center sm:pt-28">
                    <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-[-1.2px] sm:text-[56px] sm:leading-[1.1] sm:tracking-[-1.8px]">
                        Write code together, in real time.
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-balance text-base text-ink-subtle sm:text-lg">
                        Share a link and edit the same file with anyone. Changes merge instantly, cursors stay put, and you can run the result in seven languages.
                    </p>
                    <div className="mt-8 flex justify-center gap-3">
                        <Link href="/signup" className={buttonClass('primary')}>Start a room</Link>
                        <Link href="/login" className={buttonClass('secondary')}>Sign in</Link>
                    </div>
                </section>

                <EditorPreview />

                <section className="grid gap-4 py-20 sm:grid-cols-3">
                    {FEATURES.map(({ icon: Icon, title, body }) => (
                        <div key={title} className="rounded-xl border border-hairline bg-surface-1 p-6">
                            <Icon size={18} className="text-ink-subtle" />
                            <h2 className="mt-4 text-[15px] font-semibold tracking-[-0.2px]">{title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-ink-subtle">{body}</p>
                        </div>
                    ))}
                </section>
            </main>

            <footer className="border-t border-hairline">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 text-xs text-ink-tertiary sm:px-6">
                    <span>Built with Next.js, Spring Boot, Yjs and Monaco.</span>
                    <a href="https://github.com/ShlokGhadekar/realtime-collab-editor" className="transition-colors hover:text-ink-subtle">
                        Source on GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
}

// a static mock of the editor, showing two collaborators' cursors
function EditorPreview() {
    const cursor = (name: string, color: string) => (
        <span className="relative inline-block h-4 w-0 border-l-2 align-middle" style={{ borderColor: color }}>
            <span className="absolute bottom-full -left-0.5 rounded-sm rounded-bl-none px-1 font-sans text-[10px] leading-4 font-semibold whitespace-nowrap text-canvas" style={{ backgroundColor: color }}>
                {name}
            </span>
        </span>
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" aria-hidden>
            <div className="flex h-10 items-center justify-between border-b border-hairline px-4">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-subtle">Rooms</span>
                    <span className="text-ink-tertiary">/</span>
                    <span className="font-medium">Interview prep</span>
                    <span className="rounded-md bg-surface-3 px-1.5 font-mono text-[11px] tracking-wider text-ink-subtle">7F3A9C</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                        {[['M', '#22d3ee'], ['A', '#f472b6'], ['S', '#a78bfa']].map(([n, c]) => (
                            <span key={n} className="grid size-5 place-items-center rounded-full text-[9px] font-semibold text-canvas ring-2 ring-surface-1" style={{ backgroundColor: c }}>{n}</span>
                        ))}
                    </div>
                    <span className="flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[11px] font-medium text-white">
                        <Play size={9} fill="currentColor" /> Run
                    </span>
                </div>
            </div>
            <pre className="overflow-x-auto px-4 py-6 font-mono text-[13px] leading-6 text-ink-muted sm:px-6">
                <code>
                    <span className="text-ink-tertiary italic">{'# two-sum: return indices of the pair adding up to target\n'}</span>
                    <span className="text-[#c586c0]">def</span> <span className="text-[#dcdcaa]">two_sum</span>(nums, target):{'\n'}
                    {'    '}seen = {'{}'}{'\n'}
                    {'    '}<span className="text-[#c586c0]">for</span> i, n <span className="text-[#c586c0]">in</span> <span className="text-[#dcdcaa]">enumerate</span>(nums):{cursor('maya', '#22d3ee')}{'\n'}
                    {'        '}<span className="text-[#c586c0]">if</span> target - n <span className="text-[#c586c0]">in</span> seen:{'\n'}
                    {'            '}<span className="text-[#c586c0]">return</span> [seen[target - n], i]{'\n'}
                    {'        '}seen[n] = i{cursor('alex', '#f472b6')}{'\n'}
                    {'    '}<span className="text-[#c586c0]">return</span> []
                </code>
            </pre>
        </div>
    );
}
