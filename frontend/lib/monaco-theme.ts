import type * as Monaco from 'monaco-editor';

export const THEME_NAME = 'collab-dark';

// Editor chrome in the DESIGN.md palette; syntax colors are inherited from vs-dark.
export function defineTheme(monaco: typeof Monaco) {
    monaco.editor.defineTheme(THEME_NAME, {
        base: 'vs-dark',
        inherit: true,
        rules: [{ token: 'comment', foreground: '62666d', fontStyle: 'italic' }],
        colors: {
            'editor.background': '#0f1011',
            'editor.foreground': '#d0d6e0',
            'editorGutter.background': '#0f1011',
            'editorLineNumber.foreground': '#3e3e44',
            'editorLineNumber.activeForeground': '#8a8f98',
            'editor.lineHighlightBackground': '#141516',
            'editor.lineHighlightBorder': '#00000000',
            'editorCursor.foreground': '#f7f8f8',
            'editor.selectionBackground': '#5e6ad24d',
            'editor.inactiveSelectionBackground': '#5e6ad226',
            'editorIndentGuide.background1': '#23252a',
            'editorIndentGuide.activeBackground1': '#34343a',
            'editorWidget.background': '#141516',
            'editorWidget.border': '#34343a',
            'editorSuggestWidget.background': '#141516',
            'editorSuggestWidget.border': '#34343a',
            'editorSuggestWidget.selectedBackground': '#18191a',
            'scrollbarSlider.background': '#34343a66',
            'scrollbarSlider.hoverBackground': '#3e3e44aa',
            'scrollbarSlider.activeBackground': '#3e3e44',
        },
    });
}

export const editorOptions = (fontFamily: string): Monaco.editor.IStandaloneEditorConstructionOptions => ({
    fontSize: 13,
    lineHeight: 20,
    fontFamily,
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    tabSize: 2,
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    padding: { top: 20, bottom: 20 },
    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
});
