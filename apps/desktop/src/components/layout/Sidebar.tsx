import React from 'react';
import { useStore } from '../../store';
import type { NavTab } from '../../types';
import {
  Activity,
  Sliders,
  Code2,
  Server,
  Share2,
  Settings,
  FileText,
  Zap,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, engineStatus } = useStore();

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Live Dashboard', icon: <Activity className="w-5 h-5" /> },
    { id: 'builder', label: 'Visual Builder', icon: <Sliders className="w-5 h-5" /> },
    { id: 'editor', label: 'Code Mode (JS/TS)', icon: <Code2 className="w-5 h-5" /> },
    { id: 'monitoring', label: 'Host SSH Stats', icon: <Server className="w-5 h-5" /> },
    { id: 'distributed', label: 'Cloud Cluster', icon: <Share2 className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports & Export', icon: <FileText className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings & SLA', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 h-full glass-panel border-r border-slate-800 flex flex-col justify-between select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-glow-cyan p-1 overflow-hidden">
            <img src={logoImg} alt="Mjolnir Logo" className="w-full h-full object-contain animate-pulse-slow drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight font-['Outfit',sans-serif] bg-gradient-to-r from-white via-slate-200 to-primary-500 bg-clip-text text-transparent">
              MJOLNIR
            </h1>
            <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Enterprise Core v0.1</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/15 to-transparent text-primary-500 border-l-2 border-primary-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className={isActive ? 'text-primary-500' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Indicator */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Engine Status</span>
          <span className={`flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[11px] ${
            engineStatus === 'running' ? 'text-emerald-400' : engineStatus === 'idle' ? 'text-cyan-400' : 'text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              engineStatus === 'running' ? 'bg-emerald-400 animate-ping' : engineStatus === 'idle' ? 'bg-cyan-400' : 'bg-slate-600'
            }`} />
            {engineStatus}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              engineStatus === 'running' ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 w-full animate-pulse' : engineStatus === 'idle' ? 'bg-cyan-500 w-2/3' : 'bg-slate-700 w-1/4'
            }`}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 text-center font-medium tracking-wide">
          Made by <span className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">TheLunatic1 (Salman Toha)</span>
        </div>
      </div>
    </aside>
  );
};
