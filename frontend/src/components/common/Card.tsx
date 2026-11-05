import React, { ReactNode, useRef } from 'react';
import { motion, useMotionValue, useSpring, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  bordered?: boolean;
  tiltEffect?: boolean;
  glowStrength?: 'normal' | 'strong' | 'subtle';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  bordered = true,
  tiltEffect = true,
  glowStrength = 'normal',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse coordinate motion values
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  // Layer 1: Core Glow Spring (Fast, precise)
  const coreGlowX = useSpring(mouseX, { stiffness: 280, damping: 26, mass: 0.4 });
  const coreGlowY = useSpring(mouseY, { stiffness: 280, damping: 26, mass: 0.4 });

  // Layer 2: Ambient Momentum Lag Glow Spring (Soft, lagging with natural inertia)
  const ambientGlowX = useSpring(mouseX, { stiffness: 100, damping: 20, mass: 0.8 });
  const ambientGlowY = useSpring(mouseY, { stiffness: 100, damping: 20, mass: 0.8 });

  // Parallax Tilt Springs
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 150, damping: 22, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 150, damping: 22, mass: 0.6 });

  // Elevation Lift Spring
  const rawY = useMotionValue(0);
  const y = useSpring(rawY, { stiffness: 150, damping: 22, mass: 0.6 });

  // Glow Opacity Spring
  const rawOpacity = useMotionValue(0);
  const glowOpacity = useSpring(rawOpacity, { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);
    rawOpacity.set(1);

    if (tiltEffect) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Soft ±2.2 degree max tilt
      rawRotateX.set(((y - centerY) / centerY) * -2.2);
      rawRotateY.set(((x - centerX) / centerX) * 2.2);
    }

    if (hoverEffect) {
      rawY.set(-3);
    }
  };

  const handleMouseLeave = () => {
    rawOpacity.set(0);
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawY.set(0);
  };

  // Glow intensity multipliers based on card hierarchy
  const opacityMultiplier = glowStrength === 'strong' ? 1.3 : glowStrength === 'subtle' ? 0.7 : 1.0;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        y,
        transformStyle: 'preserve-3d',
        perspective: 900,
      }}
      className={`group relative bg-[#19162C] text-[#F8FAFC] rounded-2xl ${
        bordered ? 'border border-[#2A2548] hover:border-[#8B5CF6]/50' : ''
      } shadow-soft hover:shadow-glow-violet transition-colors duration-300 overflow-hidden ${className}`}
      {...props}
    >
      {/* ============================================================ */}
      {/* TWO-LAYER FLUID MOMENTUM CURSOR GLOW (SkillSync Violet) */}
      {/* ============================================================ */}

      {/* Layer 2: Large Soft Ambient Momentum Glow (Lagging behind) */}
      <motion.div
        aria-hidden="true"
        style={{
          x: ambientGlowX,
          y: ambientGlowY,
          opacity: glowOpacity,
        }}
        className="pointer-events-none absolute top-0 left-0 w-[480px] h-[480px] -ml-[240px] -mt-[240px] rounded-full will-change-transform z-0"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(139, 92, 246, ${0.16 * opacityMultiplier}) 0%, rgba(167, 139, 250, ${0.08 * opacityMultiplier}) 40%, transparent 75%)`,
          }}
        />
      </motion.div>

      {/* Layer 1: Core Vibrant Violet-Lavender Highlight (Following close to pointer) */}
      <motion.div
        aria-hidden="true"
        style={{
          x: coreGlowX,
          y: coreGlowY,
          opacity: glowOpacity,
        }}
        className="pointer-events-none absolute top-0 left-0 w-[300px] h-[300px] -ml-[150px] -mt-[150px] rounded-full will-change-transform z-0"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(139, 92, 246, ${0.28 * opacityMultiplier}) 0%, rgba(124, 58, 237, ${0.18 * opacityMultiplier}) 28%, rgba(167, 139, 250, ${0.12 * opacityMultiplier}) 55%, transparent 78%)`,
          }}
        />
      </motion.div>

      {/* Card Content (Elevated in 3D stacking context) */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};
