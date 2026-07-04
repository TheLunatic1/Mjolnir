import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: string; isPositive: boolean };
  color?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'violet';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    rose: 'from-rose-500/10 to-rose-500/5 border-rose-500/30 text-rose-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/30 text-amber-400',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/30 text-violet-400',
  };

  return (
    <div className={`glass-card p-5 rounded-xl border bg-gradient-to-br transition-all hover:scale-[1.01] ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-['Outfit',sans-serif]">{title}</span>
        <div className="p-2 rounded-lg bg-slate-900/60 text-current">{icon}</div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">{value}</div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};
