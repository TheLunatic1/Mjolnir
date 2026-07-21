import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { CheckCircle2, Code2, Sliders, XCircle, AlertTriangle } from 'lucide-react';

interface MarkerInfo {
  message: string;
  severity: number;
  startLineNumber: number;
  endLineNumber: number;
}

export const EditorPage: React.FC = () => {
  const { activeScenario, setActiveScenario, setActiveTab } = useStore();
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const handleEditorChange = (value?: string) => {
    if (value !== undefined) {
      setActiveScenario((prev) => ({
        ...prev,
        customTypeScript: value,
        scriptMode: true,
      }));
    }
  };

  const handleValidation = useCallback((newMarkers: MarkerInfo[]) => {
    setMarkers(newMarkers);
  }, []);

  const handleEditorMount = (editor: any) => {
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
  };

  const errorCount = markers.filter((m) => m.severity === 8).length;
  const warnCount = markers.filter((m) => m.severity === 4).length;
  const isValid = errorCount === 0;

  return (
    <div className="h-full flex flex-col overflow-hidden select-none">
      {/* Editor Header */}
      <div className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif] flex items-center gap-2">
              Advanced Code Mode
              <Badge variant="violet" size="sm">TypeScript / ES6+</Badge>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Executed in Mjolnir Core Embedded JS Runtime</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={activeScenario.scriptMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveScenario((p) => ({ ...p, scriptMode: !p.scriptMode }))}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {activeScenario.scriptMode ? 'Script Mode Active' : 'Enable Script Mode'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('builder')}
            icon={<Sliders className="w-4 h-4 text-cyan-400" />}
          >
            Visual Builder
          </Button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full bg-[#1e1e1e] relative">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={activeScenario.customTypeScript || ''}
          onChange={handleEditorChange}
          onValidate={handleValidation}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Menlo, monospace',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 16 },
          }}
        />
      </div>

      {/* Editor Footer — Real Diagnostics Bar */}
      <div className="h-10 glass-panel border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-400 flex-shrink-0 font-mono">
        <span>Available Modules: <strong className="text-cyan-400">mjolnir</strong> (http, check, sleep, faker, ws, grpc)</span>
        <div className="flex items-center gap-4">
          {isValid ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              No Errors
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3.5 h-3.5" />
              {errorCount} Error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {warnCount} Warning{warnCount !== 1 ? 's' : ''}
            </span>
          )}
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        </div>
      </div>
    </div>
  );
};
