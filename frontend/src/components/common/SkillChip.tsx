import React from 'react';
import { Check, AlertCircle, X, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface SkillChipProps {
  name: string;
  category?: string;
  proficiency?: number;
  matchType?: 'matched' | 'partial' | 'missing' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export const SkillChip: React.FC<SkillChipProps> = ({
  name,
  proficiency,
  matchType = 'neutral',
  onClick,
  className = '',
}) => {
  const matchConfig = {
    matched: {
      bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50',
      icon: <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />,
      badge: 'bg-emerald-500/30 text-emerald-200',
      glow: 'hover:shadow-[0_2px_12px_rgba(16,185,129,0.3)]',
    },
    partial: {
      bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/50',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />,
      badge: 'bg-amber-500/30 text-amber-200',
      glow: 'hover:shadow-[0_2px_12px_rgba(245,158,11,0.3)]',
    },
    missing: {
      bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-500/50',
      icon: <X className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />,
      badge: 'bg-rose-500/30 text-rose-200',
      glow: 'hover:shadow-[0_2px_12px_rgba(244,63,94,0.3)]',
    },
    neutral: {
      bg: 'bg-[#211D38] text-[#F8FAFC] border-[#2A2548] hover:bg-[#2A2548] hover:border-[#8B5CF6]/50 hover:text-[#A78BFA]',
      icon: <Cpu className="w-3.5 h-3.5 text-[#8B5CF6]" />,
      badge: 'bg-[#19162C] text-[#A5A1BA]',
      glow: 'hover:shadow-[0_2px_12px_rgba(139,92,246,0.3)]',
    },
  };

  const current = matchConfig[matchType];

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={onClick ? { scale: 0.97, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 select-none ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${current.bg} ${current.glow} ${className}`}
    >
      <span className="transition-transform duration-200 group-hover:scale-110">{current.icon}</span>
      <span className="font-semibold tracking-tight transition-colors">{name}</span>
      {proficiency !== undefined && (
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-transform duration-200 group-hover:scale-105 ${current.badge}`}
        >
          {Math.round(proficiency)}%
        </span>
      )}
    </motion.div>
  );
};
