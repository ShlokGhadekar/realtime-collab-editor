'use client';
import { useEffect, useRef } from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

// native <dialog>: focus trapping, Escape to close and the backdrop come for free
export function Modal({ open, onClose, title, description, children }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = ref.current;
        if (open && !dialog?.open) dialog?.showModal();
        if (!open && dialog?.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onClick={(e) => e.target === ref.current && onClose()}
            className="m-auto mt-[15vh] w-[calc(100%-2rem)] max-w-md rounded-xl border border-hairline-strong bg-surface-2 p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
        >
            <div className="p-5">
                <h2 className="text-[15px] font-semibold tracking-[-0.2px]">{title}</h2>
                {description && <p className="mt-1 text-sm text-ink-subtle">{description}</p>}
                <div className="mt-5">{open && children}</div>
            </div>
        </dialog>
    );
}
