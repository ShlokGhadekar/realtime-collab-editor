'use client';
import { useRef } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';

export interface RunResult {
    output: string;
    failed: boolean;
    durationMs: number;
}

interface OutputPanelProps {
    height: number;
    onResize: (height: number) => void;
    running: boolean;
    result: RunResult | null;
    onClear: () => void;
    onClose: () => void;
}

export function OutputPanel({ height, onResize, running, result, onClear, onClose }: OutputPanelProps) {
    const panel = useRef<HTMLDivElement>(null);

    // drag the top edge to resize; pointer capture keeps the drag going outside the handle
    const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
        const handle = e.currentTarget;
        const bottom = panel.current!.getBoundingClientRect().bottom;
        handle.setPointerCapture(e.pointerId);
        const move = (ev: PointerEvent) =>
            onResize(Math.min(Math.max(bottom - ev.clientY, 120), window.innerHeight * 0.75));
        const stop = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', stop);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', stop);
    };

    return (
        <div ref={panel} style={{ height }} className="relative flex shrink-0 flex-col border-t border-hairline bg-canvas">
            <div
                onPointerDown={startResize}
                role="separator"
                aria-orientation="horizontal"
                className="absolute inset-x-0 -top-1 z-10 h-2 cursor-row-resize transition-colors hover:bg-primary/40"
            />
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-hairline px-3">
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-ink-muted">Output</span>
                    {running ? (
                        <span className="flex items-center gap-1.5 text-ink-subtle"><Spinner size={12} /> Running…</span>
                    ) : result && (
                        <span className={result.failed ? 'text-danger' : 'text-ink-subtle'}>
                            {result.failed ? 'Failed' : 'Finished'} in {(result.durationMs / 1000).toFixed(1)}s
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear output" className="px-1.5">
                        <Trash2 size={13} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close output" className="px-1.5">
                        <X size={14} />
                    </Button>
                </div>
            </div>
            <pre className={`flex-1 overflow-auto p-4 font-mono text-[13px] leading-5 whitespace-pre-wrap ${result?.failed ? 'text-danger' : 'text-ink-muted'}`}>
                {result?.output ?? (running ? '' : <span className="text-ink-tertiary">Run your code with ⌘↵ to see its output here.</span>)}
            </pre>
        </div>
    );
}
