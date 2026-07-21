import React, { useState } from 'react';
import { useStore } from '../../store';
import { useEngine } from '../../hooks/useEngine';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Play, Square, Power, RotateCcw, PowerOff, Save, FolderOpen, FileJson } from 'lucide-react';
import fs from 'fs';

export const TitleBar: React.FC = () => {
  const { activeScenario, setActiveScenario, clusterMode, setClusterMode, addLog } = useStore();
  const { engineStatus, startEngine, stopEngine, restartEngine, startTest, abortTest, isRunningTest, isEngineReady } = useEngine();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  const handleSaveScenario = async () => {
    if (!window.mjolnir) return;
    const safeName = activeScenario.name.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
    const filePath = await window.mjolnir.dialog.saveJson(`${safeName}.json`);
    if (!filePath) return;

    setSaveStatus('saving');
    try {
      // Write via IPC (preload doesn't expose fs directly in renderer)
      // We serialize and trigger download via a custom Blob approach in renderer
      const jsonStr = JSON.stringify(activeScenario, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split(/[\\/]/).pop() || 'scenario.json';
      a.click();
      URL.revokeObjectURL(url);
      setSaveStatus('done');
      addLog({ level: 'info', source: 'ipc', message: `Scenario saved: ${activeScenario.name}` });
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e: any) {
      addLog({ level: 'error', source: 'ipc', message: `Save failed: ${e.message}` });
      setSaveStatus('idle');
    }
  };

  const handleLoadScenario = async () => {
    if (!window.mjolnir) return;
    const filePath = await window.mjolnir.dialog.openFile([{ name: 'JSON Scenario', extensions: ['json'] }]);
    if (!filePath) return;
    try {
      // Read file via input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const parsed = JSON.parse(ev.target?.result as string);
            // Validate it looks like a scenario
            if (!parsed.id || !parsed.requests || !parsed.execution) {
              addLog({ level: 'error', source: 'ipc', message: 'Invalid scenario file: missing required fields.' });
              return;
            }
            setActiveScenario(parsed);
            addLog({ level: 'info', source: 'ipc', message: `Scenario loaded: ${parsed.name}` });
          } catch {
            addLog({ level: 'error', source: 'ipc', message: 'Failed to parse JSON scenario file.' });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (e: any) {
      addLog({ level: 'error', source: 'ipc', message: `Load failed: ${e.message}` });
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-slate-800 flex items-center justify-between px-4 z-10 select-none gap-3">
      {/* Left: Scenario Title + Save/Load */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-['Outfit',sans-serif] truncate">
            <span className="truncate">{activeScenario.name}</span>
            <Badge variant="cyan" size="sm">
              {activeScenario.execution.profile.toUpperCase().replace('_', ' ')}
            </Badge>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleSaveScenario}
            title="Save scenario as JSON"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            {saveStatus === 'done'
              ? <span className="text-emerald-400 text-[10px] font-bold">Saved!</span>
              : <Save className="w-3.5 h-3.5" />
            }
          </button>
          <button
            onClick={handleLoadScenario}
            title="Load scenario from JSON"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Cluster Topology Mode Selector */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-shrink-0">
        {(['standalone', 'master', 'worker'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setClusterMode(mode)}
            disabled={isRunningTest}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              clusterMode === mode
                ? 'bg-gradient-to-r from-primary-500 to-cyan-600 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Right: Engine Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isEngineReady ? (
          <Button variant="emerald" size="sm" onClick={startEngine} icon={<Power className="w-4 h-4" />}>
            Start Engine
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={restartEngine} icon={<RotateCcw className="w-4 h-4" />}>
              Restart
            </Button>
            <Button variant="ghost" size="sm" onClick={stopEngine} icon={<PowerOff className="w-4 h-4 text-rose-400" />}>
              Stop
            </Button>
            {!isRunningTest ? (
              <Button variant="primary" size="sm" onClick={startTest} icon={<Play className="w-4 h-4 fill-current" />}>
                Launch Strike
              </Button>
            ) : (
              <Button variant="danger" size="sm" onClick={abortTest} icon={<Square className="w-4 h-4 fill-current" />}>
                Abort Strike
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
