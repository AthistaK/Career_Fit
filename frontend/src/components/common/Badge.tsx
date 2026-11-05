import React, { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'violet' | 'slate';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'indigo',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-bold gap-1.5',
  };

  const variantStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    indigo: 'bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    violet: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    slate: 'bg-[#211D38] text-[#A5A1BA] border border-[#2A2548]',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full tracking-wide ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
