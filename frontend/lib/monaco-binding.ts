import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import type * as Monaco from 'monaco-editor';

type Editor = Monaco.editor.IStandaloneCodeEditor;

interface RemoteState {
    user?: { name: string; color: string };
    cursor?: { anchor: unknown; head: unknown } | null;
}

/**
 * Keeps a Monaco editor and a Y.Text in sync, edit by edit (never replacing the
 * whole document, which is what made cursors jump). Also shows other users'
 * cursors and makes undo/redo only affect your own changes.
 * Returns a function that removes the binding.
 */
export function bindMonaco(editor: Editor, monaco: typeof Monaco, text: Y.Text, awareness: Awareness) {
    const model = editor.getModel()!;
    const doc = text.doc!;
    const origin = { binding: 'monaco' }; // marks Yjs transactions that came from this editor
    const undoManager = new Y.UndoManager(text, { trackedOrigins: new Set([origin]) });
    let applyingRemote = false;

    // Yjs offsets must mean the same thing on every client, so always use \n
    applyingRemote = true;
    model.setEOL(monaco.editor.EndOfLineSequence.LF);
    model.setValue(text.toString());
    applyingRemote = false;

    // Monaco -> Yjs
    const modelListener = model.onDidChangeContent((event) => {
        if (applyingRemote) return;
        doc.transact(() => {
            // offsets refer to the text before this event, so apply back to front
            [...event.changes]
                .sort((a, b) => b.rangeOffset - a.rangeOffset)
                .forEach((change) => {
                    if (change.rangeLength > 0) text.delete(change.rangeOffset, change.rangeLength);
                    if (change.text) text.insert(change.rangeOffset, change.text);
                });
        }, origin);
    });

    // Yjs -> Monaco: apply each insert/delete in place; Monaco shifts local cursors itself
    const textObserver = (event: Y.YTextEvent, transaction: Y.Transaction) => {
        if (transaction.origin === origin) return;
        applyingRemote = true;
        let index = 0;
        for (const op of event.delta) {
            if (op.retain !== undefined) {
                index += op.retain;
            } else if (typeof op.insert === 'string') {
                const pos = model.getPositionAt(index);
                model.applyEdits([{ range: monaco.Range.fromPositions(pos), text: op.insert }]);
                index += op.insert.length;
            } else if (op.delete !== undefined) {
                const start = model.getPositionAt(index);
                const end = model.getPositionAt(index + op.delete);
                model.applyEdits([{ range: monaco.Range.fromPositions(start, end), text: '' }]);
            }
        }
        applyingRemote = false;
        if (transaction.origin === undoManager) {
            editor.setPosition(model.getPositionAt(index));
            editor.revealPositionInCenterIfOutsideViewport(model.getPositionAt(index));
        }
        renderRemoteCursors();
    };
    text.observe(textObserver);

    // undo/redo go through Yjs so they never undo someone else's typing
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => undoManager.undo());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => undoManager.redo());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => undoManager.redo());

    // share our cursor as Yjs relative positions, which stay correct while others edit
    const toRelative = (pos: Monaco.IPosition) =>
        Y.relativePositionToJSON(Y.createRelativePositionFromTypeIndex(text, model.getOffsetAt(pos)));
    const selectionListener = editor.onDidChangeCursorSelection(({ selection }) => {
        awareness.setLocalStateField('cursor', {
            anchor: toRelative(selection.getSelectionStart()),
            head: toRelative(selection.getPosition()),
        });
    });

    // draw everyone else's cursor and selection
    const decorations = editor.createDecorationsCollection();
    const styleSheet = document.createElement('style');
    document.head.appendChild(styleSheet);
    const styledClients = new Set<number>();

    const toIndex = (relative: unknown) => {
        const abs = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(relative), doc);
        return abs && abs.type === text ? abs.index : null;
    };

    const addStyles = (clientId: number, name: string, color: string) => {
        if (styledClients.has(clientId)) return;
        styledClients.add(clientId);
        const label = name.replace(/[^\w .-]/g, '').slice(0, 24);
        styleSheet.textContent += `
            .remote-selection-${clientId} { background-color: ${color}33; }
            .remote-cursor-${clientId} { position: absolute; height: 100%; border-left: 2px solid ${color}; }
            .remote-cursor-${clientId}::after {
                content: "${label}"; position: absolute; left: -2px; bottom: 100%;
                padding: 0 4px; border-radius: 3px 3px 3px 0; background: ${color}; color: #0a0a0a;
                font: 600 10px/16px system-ui, sans-serif; white-space: nowrap; pointer-events: none;
            }`;
    };

    const renderRemoteCursors = () => {
        const next: Monaco.editor.IModelDeltaDecoration[] = [];
        awareness.getStates().forEach((state: RemoteState, clientId) => {
            if (clientId === doc.clientID || !state.user || !state.cursor) return;
            const anchor = toIndex(state.cursor.anchor);
            const head = toIndex(state.cursor.head);
            if (anchor === null || head === null) return;

            addStyles(clientId, state.user.name, state.user.color);
            const forward = head >= anchor;
            const start = model.getPositionAt(Math.min(anchor, head));
            const end = model.getPositionAt(Math.max(anchor, head));
            next.push({
                range: monaco.Range.fromPositions(start, end),
                options: {
                    className: `remote-selection-${clientId}`,
                    [forward ? 'afterContentClassName' : 'beforeContentClassName']: `remote-cursor-${clientId}`,
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                },
            });
        });
        decorations.set(next);
    };
    awareness.on('change', renderRemoteCursors);
    renderRemoteCursors();

    return () => {
        modelListener.dispose();
        selectionListener.dispose();
        text.unobserve(textObserver);
        awareness.off('change', renderRemoteCursors);
        awareness.setLocalStateField('cursor', null);
        undoManager.destroy();
        decorations.clear();
        styleSheet.remove();
    };
}
