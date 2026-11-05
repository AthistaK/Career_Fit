import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface ProgressRingProps {
  score: number; // 0 to 100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  colorScheme?: 'auto' | 'emerald' | 'indigo' | 'amber' | 'rose';
  animate?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  label = '/100',
  sublabel = 'Score',
  colorScheme = 'auto',
  animate = true,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const ringContainerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rawOpacity = useMotionValue(0);

  const springGlowX = useSpring(mouseX, { stiffness: 200, damping: 22, mass: 0.5 });
  const springGlowY = useSpring(mouseY, { stiffness: 200, damping: 22, mass: 0.5 });
  const glowOpacity = useSpring(rawOpacity, { stiffness: 200, damping: 22 });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  let strokeColor = '#8B5CF6'; // SkillSync violet
  if (colorScheme === 'auto') {
    if (score >= 80) strokeColor = '#10B981';
    else if (score >= 60) strokeColor = '#8B5CF6';
    else if (score >= 40) strokeColor = '#F59E0B';
    else strokeColor = '#F43F5E';
  } else if (colorScheme === 'emerald') strokeColor = '#10B981';
  else if (colorScheme === 'indigo') strokeColor = '#8B5CF6';
  else if (colorScheme === 'amber') strokeColor = '#F59E0B';
  else if (colorScheme === 'rose') strokeColor = '#F43F5E';

  useEffect(() => {
    if (!animate) {
      setDisplayScore(Math.round(score));
      return;
    }

    let start = 0;
    const end = Math.round(score);
    if (start === end) {
      setDisplayScore(end);
      return;
    }

    const duration = 1000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, animate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ringContainerRef.current) return;
    const rect = ringContainerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
    rawOpacity.set(1);
  };

  const handleMouseLeave = () => {
    rawOpacity.set(0);
  };

  return (
    <motion.div
      ref={ringContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative inline-flex flex-col items-center justify-center cursor-default select-none"
    >
      {/* Interactive Spring Glow Halo */}
      <motion.div
        aria-hidden="true"
        style={{
          x: springGlowX,
          y: springGlowY,
          opacity: glowOpacity,
        }}
        className="pointer-events-none absolute top-0 left-0 w-36 h-36 -ml-18 -mt-18 rounded-full will-change-transform z-0"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${strokeColor}45 0%, ${strokeColor}15 40%, transparent 70%)`,
          }}
        />
      </motion.div>

      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#211D38"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="transition-all"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
          style={{
            filter: `drop-shadow(0 0 8px ${strokeColor}60)`,
          }}
          className="transition-[filter] duration-200"
        />
      </svg>

      {/* Center Score Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight leading-none transition-transform duration-200 group-hover:scale-105 group-hover:text-[#A78BFA]">
          {displayScore}
        </span>
        {label && (
          <span className="text-xs font-semibold text-[#A5A1BA] mt-0.5 transition-colors group-hover:text-[#F8FAFC]">
            {label}
          </span>
        )}
      </div>

      {sublabel && (
        <span className="text-xs font-medium text-[#A5A1BA] mt-2 tracking-wide uppercase transition-colors group-hover:text-[#A78BFA] group-hover:font-bold z-10">
          {sublabel}
        </span>
      )}
    </motion.div>
  );
};
