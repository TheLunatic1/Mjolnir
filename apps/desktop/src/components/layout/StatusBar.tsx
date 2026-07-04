import React from 'react';
import { useStore } from '../../store';
import { ShieldAlert, Cpu, Activity, ArrowUpRight, ArrowDownRight, Terminal } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { liveMetrics, hostStats, logs } = useStore();
  const latestLog = logs[logs.length - 1];

  return (
    <footer className="h-9 glass-panel border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-400 select-none z-10">
      {/* Left: Log Message Ticker */}
      <div className="flex items-center gap-2 max-w-xl truncate">
        <Terminal className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
        <span className="font-mono text-[11px] truncate text-slate-300">
          {latestLog ? `[${latestLog.source.toUpperCase()}] ${latestLog.message}` : 'System idle. Waiting for instructions.'}
        </span>
      </div>

      {/* Center: Author Attribution */}
      <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-sans px-3 py-0.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400">
        <span>Made by <strong className="text-cyan-400 font-bold">TheLunatic1 (Salman Toha)</strong></span>
      </div>

      {/* Right: Real-Time Micro-Metrics Ticker */}
      <div className="flex items-center gap-6 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">VUs:</span>
          <span className="font-bold text-cyan-400">{liveMetrics?.current_vus || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">RPS:</span>
          <span className="font-bold text-emerald-400">{Math.round(liveMetrics?.current_rps || 0)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">P99:</span>
          <span className="font-bold text-amber-400">{(liveMetrics?.latencies?.total_duration?.p99 || 0).toFixed(1)} ms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowDownRight className="w-3 h-3 text-cyan-500" />
          <span>{((liveMetrics?.bandwidth_in_bytes_per_sec || 0) / 1024).toFixed(1)} KB/s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpRight className="w-3 h-3 text-violet-500" />
          <span>{((liveMetrics?.bandwidth_out_bytes_per_sec || 0) / 1024).toFixed(1)} KB/s</span>
        </div>
        {hostStats && (
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
            <Cpu className="w-3 h-3 text-rose-500" />
            <span>Remote CPU: <strong className="text-rose-400">{hostStats.cpu_usage_percent}%</strong></span>
          </div>
        )}
      </div>
    </footer>
  );
};
