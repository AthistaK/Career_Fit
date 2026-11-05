import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  subValue?: string;
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'cyan';
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  subValue,
  color = 'brand',
  height = 'md',
  showPercentage = false,
  className = '',
}) => {
  const barContainerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(-100);
  const rawOpacity = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 300, damping: 25, mass: 0.4 });
  const glowOpacity = useSpring(rawOpacity, { stiffness: 220, damping: 24 });

  const clampedValue = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorGradients = {
    brand: 'bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#A78BFA]',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
    rose: 'bg-gradient-to-r from-rose-500 to-rose-400',
    cyan: 'bg-gradient-to-r from-[#06b6d4] to-[#22d3ee]',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barContainerRef.current) return;
    const rect = barContainerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    rawOpacity.set(1);
  };

  const handleMouseLeave = () => {
    rawOpacity.set(0);
  };

  return (
    <div
      ref={barContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group w-full select-none ${className}`}
    >
      {(label || showPercentage || subValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-[#A5A1BA] transition-colors group-hover:text-[#F8FAFC]">
          <span>{label}</span>
          <span className="transition-all duration-200 group-hover:font-bold group-hover:text-[#A78BFA] group-hover:scale-105">
            {subValue || (showPercentage ? `${Math.round(clampedValue)}%` : '')}
          </span>
        </div>
      )}

      <div
        className={`relative w-full bg-[#211D38] rounded-full overflow-hidden transition-all duration-200 ${
          heightStyles[height]
        } group-hover:ring-2 group-hover:ring-[#8B5CF6]/30 group-hover:shadow-soft-sm`}
      >
        <motion.div
          className={`h-full rounded-full relative overflow-hidden ${colorGradients[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Spring-Lagging Light Sweep along the bar */}
          <motion.div
            aria-hidden="true"
            style={{
              x: springX,
              opacity: glowOpacity,
            }}
            className="pointer-events-none absolute top-0 bottom-0 w-16 -ml-8 will-change-transform z-10"
          >
            <div
              className="w-full h-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 70%)',
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
