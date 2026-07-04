import React from 'react';

interface BadgeProps {
  variant?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate';
  size?: 'sm' | 'md';
  pulse?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  size = 'md',
  pulse = false,
  children,
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-glow-cyan',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} select-none`}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      {children}
    </span>
  );
};
