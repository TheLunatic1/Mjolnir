import React from 'react';
import { useStore } from '../../store';
import { useEngine } from '../../hooks/useEngine';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Play, Square, Power, RotateCcw } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const { activeScenario, clusterMode, setClusterMode } = useStore();
  const { engineStatus, startEngine, stopEngine, startTest, abortTest, isRunningTest, isEngineReady } = useEngine();

  return (
    <header className="h-16 glass-panel border-b border-slate-800 flex items-center justify-between px-6 z-10 select-none">
      {/* Left: Active Scenario Title */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Target Scenario</span>
          <h2 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif] flex items-center gap-2">
            {activeScenario.name}
            <Badge variant="cyan" size="sm">
              {activeScenario.execution.profile.toUpperCase().replace('_', ' ')}
            </Badge>
          </h2>
        </div>
      </div>

      {/* Center: Cluster Topology Mode Selector */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        {(['standalone', 'master', 'worker'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setClusterMode(mode)}
            disabled={isRunningTest}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              clusterMode === mode
                ? 'bg-gradient-to-r from-primary-600/30 to-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Right: Action Strike Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-2">
          <span>Made by <span className="text-cyan-400">TheLunatic1 (Salman Toha)</span></span>
        </div>
        {!isEngineReady ? (
          <Button variant="emerald" size="sm" onClick={startEngine} icon={<Power className="w-4 h-4" />}>
            Start Native Engine
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={stopEngine} icon={<RotateCcw className="w-4 h-4" />}>
              Restart Engine
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
