import { useRef, useCallback } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { Spinner } from '../ui/Spinner';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
  fontSize?: number;
  theme?: 'vs-dark' | 'light';
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  fontSize = 14,
  theme = 'vs-dark',
  height = '100%',
}: CodeEditorProps) {
  const editorRef = useRef<ReturnType<typeof MonacoEditor> | null>(null);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;

    // Custom keyboard shortcuts
    editor.addCommand(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.Enter,
      () => {
        // Trigger run via custom event
        window.dispatchEvent(new CustomEvent('editor:run'));
      },
    );
  }, []);

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      theme={theme}
      loading={<div className="flex items-center justify-center h-full bg-dark-900"><Spinner /></div>}
      options={{
        fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        readOnly,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        padding: { top: 12, bottom: 12 },
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      }}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
    />
  );
}
