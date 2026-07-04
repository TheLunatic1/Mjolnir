import React from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Play, Code2, Sliders, CheckCircle2, FileText, Download } from 'lucide-react';

export const EditorPage: React.FC = () => {
  const { activeScenario, setActiveScenario, setActiveTab } = useStore();

  const handleEditorChange = (value?: string) => {
    if (value !== undefined) {
      setActiveScenario((prev) => ({
        ...prev,
        customTypeScript: value,
        scriptMode: true,
      }));
    }
  };

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

      {/* Editor Footer Help Bar */}
      <div className="h-10 glass-panel border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-400 flex-shrink-0 font-mono">
        <span>Available Modules: <strong className="text-cyan-400">mjolnir</strong> (http, check, sleep, faker, ws, grpc)</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">● Live ES6+ Validation OK</span>
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
};
