import React from 'react';
import { useStore } from '../../store';
import { ShieldAlert, ArrowUpRight, ArrowDownRight, Terminal, ChevronUp } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { engineStatus, liveMetrics, logs, logDrawerOpen, setLogDrawerOpen } = useStore();
  const latestLog = logs[logs.length - 1];
  const isRunning = engineStatus === 'running';

  return (
    <footer className="h-9 glass-panel border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 select-none z-10 relative">
      {/* Left: Log Drawer Toggle + Message Ticker */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLogDrawerOpen(!logDrawerOpen)}
          title={logDrawerOpen ? 'Close log console' : 'Open log console'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all hover:bg-slate-800 ${logDrawerOpen ? 'text-primary-400 bg-primary-500/10' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <ChevronUp className={`w-3 h-3 transition-transform ${logDrawerOpen ? 'rotate-180' : ''}`} />
          <span className="font-mono text-[10px] font-semibold">{logs.length}</span>
        </button>
        <div className="w-px h-4 bg-slate-800" />
        <span className="font-mono text-[11px] truncate max-w-lg text-slate-300">
          {latestLog ? `[${latestLog.source.toUpperCase()}] ${latestLog.message}` : 'System idle. Waiting for instructions.'}
        </span>
      </div>

      {/* Right: Real-Time Micro-Metrics Ticker */}
      <div className="flex items-center gap-5 font-mono text-[11px] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">VUs:</span>
          <span className="font-bold text-cyan-400">{isRunning ? (liveMetrics?.current_vus ?? 0) : 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">RPS:</span>
          <span className="font-bold text-emerald-400">{isRunning ? Math.round(liveMetrics?.current_rps ?? 0) : 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">P99:</span>
          <span className="font-bold text-amber-400">{(liveMetrics?.latencies?.total_duration?.p99 ?? 0).toFixed(1)} ms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowDownRight className="w-3 h-3 text-cyan-500" />
          <span>{isRunning ? ((liveMetrics?.bandwidth_in_bytes_per_sec ?? 0) / 1024).toFixed(1) : '0.0'} KB/s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpRight className="w-3 h-3 text-violet-500" />
          <span>{isRunning ? ((liveMetrics?.bandwidth_out_bytes_per_sec ?? 0) / 1024).toFixed(1) : '0.0'} KB/s</span>
        </div>
      </div>
    </footer>
  );
};
