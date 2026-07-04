import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-slate-950 font-semibold hover:from-primary-500 hover:to-cyan-400 glow-primary border border-cyan-300/30',
    secondary: 'glass-card text-slate-200 hover:bg-slate-800/80 hover:text-white border border-slate-700/60',
    danger: 'bg-gradient-to-r from-accent-rose to-rose-600 text-white font-semibold hover:from-rose-500 hover:to-red-500 glow-rose border border-rose-400/30',
    emerald: 'bg-gradient-to-r from-accent-emerald to-emerald-600 text-slate-950 font-semibold hover:from-emerald-400 hover:to-emerald-500 glow-emerald border border-emerald-300/30',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
