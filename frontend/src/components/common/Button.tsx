import React, { ReactNode, useRef } from 'react';
import { motion, useMotionValue, useSpring, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const rawOpacity = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 320, damping: 28, mass: 0.3 });
  const springY = useSpring(mouseY, { stiffness: 320, damping: 28, mass: 0.3 });
  const glowOpacity = useSpring(rawOpacity, { stiffness: 250, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
    rawOpacity.set(1);
  };

  const handleMouseLeave = () => {
    rawOpacity.set(0);
  };

  const baseStyles =
    'group relative inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0A19] disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden text-center';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs font-semibold gap-2 min-h-[36px]',
    md: 'px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold gap-2.5 min-h-[42px]',
    lg: 'px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-bold gap-3 min-h-[48px]',
  };

  const variantStyles = {
    primary:
      'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] focus:ring-[#8B5CF6] shadow-soft hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] active:bg-[#6D28D9]',
    secondary:
      'bg-[#211D38] text-[#F8FAFC] border border-[#2A2548] hover:bg-[#2A2548] hover:border-[#8B5CF6]/50 focus:ring-[#8B5CF6] shadow-soft-sm hover:shadow-soft',
    outline:
      'bg-transparent text-[#A78BFA] border border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/15 hover:border-[#8B5CF6] focus:ring-[#8B5CF6]',
    ghost: 'bg-transparent text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38]/80 focus:ring-[#8B5CF6]',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-soft hover:shadow-soft-md',
    accent:
      'bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#06B6D4] text-white hover:opacity-95 focus:ring-[#8B5CF6] shadow-[0_0_24px_rgba(139,92,246,0.35)]',
  };

  const isLightGlow = variant === 'primary' || variant === 'accent' || variant === 'danger';

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98, y: 0 } : {}}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Spring-Lagging Highlight Layer */}
      <motion.div
        aria-hidden="true"
        style={{
          x: springX,
          y: springY,
          opacity: glowOpacity,
        }}
        className="pointer-events-none absolute top-0 left-0 w-36 h-36 -ml-18 -mt-18 rounded-full will-change-transform z-0"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: isLightGlow
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 35%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(167, 139, 250, 0.15) 40%, transparent 70%)',
          }}
        />
      </motion.div>

      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current z-10 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && <span className="z-10 flex-shrink-0 inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-110">{leftIcon}</span>
      )}

      <span className="z-10 relative leading-normal inline-flex items-center text-center">{children}</span>

      {!isLoading && rightIcon && (
        <span className="z-10 flex-shrink-0 inline-flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1">{rightIcon}</span>
      )}
    </motion.button>
  );
};
