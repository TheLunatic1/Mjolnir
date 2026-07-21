import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Terminal, X, Trash2, ChevronDown } from 'lucide-react';

const LEVEL_COLORS: Record<string, string> = {
  info:  'text-cyan-400',
  warn:  'text-amber-400',
  error: 'text-rose-400',
  debug: 'text-slate-500',
};

const LEVEL_BG: Record<string, string> = {
  info:  'bg-cyan-500/5',
  warn:  'bg-amber-500/5',
  error: 'bg-rose-500/10',
  debug: 'bg-slate-900/50',
};

export const LogDrawer: React.FC = () => {
  const { logs, clearLogs, logDrawerOpen, setLogDrawerOpen } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (logDrawerOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, logDrawerOpen]);

  if (!logDrawerOpen) return null;

  return (
    <div className="absolute bottom-9 left-64 right-0 z-30 flex flex-col" style={{ height: '280px' }}>
      {/* Drawer Panel */}
      <div className="flex-1 flex flex-col glass-panel border-t border-slate-700 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-9 flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Engine Log Console</span>
            <span className="text-[10px] font-mono text-slate-500 ml-2">{logs.length} entries</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLogDrawerOpen(false)}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded"
              title="Close log drawer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto font-mono text-[11px] bg-[#080b14]">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600">No logs yet.</div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 px-4 py-1.5 border-b border-slate-800/40 ${LEVEL_BG[log.level] ?? ''} hover:bg-white/[0.02] transition-colors`}
              >
                <span className="text-slate-600 flex-shrink-0 min-w-[70px]">{log.timestamp ?? ''}</span>
                <span className={`uppercase font-bold flex-shrink-0 w-11 ${LEVEL_COLORS[log.level] ?? 'text-slate-400'}`}>
                  {log.level}
                </span>
                <span className="text-slate-500 flex-shrink-0 w-14">[{log.source}]</span>
                <span className={`flex-1 leading-relaxed ${log.level === 'error' ? 'text-rose-300' : log.level === 'warn' ? 'text-amber-200' : 'text-slate-300'}`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};
