import React, { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'violet';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'indigo',
  onClick,
  className = '',
}) => {
  const iconBgStyles = {
    indigo: 'bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    violet: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  };

  return (
    <Card
      hoverEffect={!!onClick}
      onClick={onClick}
      className={`p-5 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#A5A1BA] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">{value}</p>
          {subtitle && <p className="text-xs font-medium text-[#A5A1BA]">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${iconBgStyles[colorScheme]}`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`px-1.5 py-0.5 rounded-md ${
              trend.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-[#A5A1BA] font-medium">vs last month</span>
        </div>
      )}
    </Card>
  );
};
