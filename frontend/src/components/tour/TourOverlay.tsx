import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Layers,
  Target,
  BookOpen,
  TrendingUp,
  Sparkles,
  History,
  Settings,
  Video,
} from 'lucide-react';
import { useTour } from '../../context/TourContext';
import { Button } from '../common/Button';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TourOverlay: React.FC = () => {
  const {
    isTourActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
  } = useTour();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 180, left: 100 });
  const prevTargetIdRef = useRef<string | null>(null);

  // Return specific icon per step
  const getStepIcon = (id: string) => {
    switch (id) {
      case 'dashboard':
        return <LayoutDashboard className="w-5 h-5 text-[#8B5CF6]" />;
      case 'analyzer-upload':
        return <FileText className="w-5 h-5 text-indigo-400" />;
      case 'resume-library':
        return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'job-matcher':
        return <Target className="w-5 h-5 text-[#8B5CF6]" />;
      case 'interview-prep':
        return <BookOpen className="w-5 h-5 text-[#A78BFA]" />;
      case 'live-interview':
        return <Video className="w-5 h-5 text-[#8B5CF6]" />;
      case 'recommendations':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'roadmap':
        return <Compass className="w-5 h-5 text-amber-400" />;
      case 'improvements':
        return <Sparkles className="w-5 h-5 text-violet-400" />;
      case 'history':
        return <History className="w-5 h-5 text-blue-400" />;
      case 'settings':
        return <Settings className="w-5 h-5 text-purple-400" />;
      default:
        return <Compass className="w-5 h-5 text-[#8B5CF6]" />;
    }
  };

  // Position calculation engine
  const updateTargetPosition = useCallback(() => {
    if (!isTourActive) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const isMobile = viewportW < 640;
    const cardWidth = isMobile ? Math.min(440, viewportW - 32) : 440;
    const cardHeight = 280;

    // Strict horizontal center alignment across all pages and viewports
    const centeredLeft = Math.max(16, Math.round((viewportW - cardWidth) / 2));
    // Consistent optical center vertical placement
    const defaultCenterTop = Math.max(70, Math.round((viewportH - cardHeight) * 0.44));

    if (!currentStep.showSpotlight) {
      if (prevTargetIdRef.current !== currentStep.id) {
        prevTargetIdRef.current = currentStep.id;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setTargetRect(null);
      setTooltipPos((prev) => {
        if (Math.abs(prev.top - defaultCenterTop) > 1 || Math.abs(prev.left - centeredLeft) > 1) {
          return { top: defaultCenterTop, left: centeredLeft };
        }
        return prev;
      });
      return;
    }

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;

    if (el) {
      const rect = el.getBoundingClientRect();
      const isNavItem = currentStep.targetSelector.startsWith('#tour-nav-');

      // Smooth scroll into view when changing steps
      if (prevTargetIdRef.current !== currentStep.id) {
        prevTargetIdRef.current = currentStep.id;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (isNavItem) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          const isOutOfView = rect.top < 70 || rect.bottom > viewportH - 70;
          if (isOutOfView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }

      const newRect: TargetRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };

      setTargetRect((prev) => {
        if (
          !prev ||
          Math.abs(prev.top - newRect.top) > 0.5 ||
          Math.abs(prev.left - newRect.left) > 0.5 ||
          Math.abs(prev.width - newRect.width) > 0.5 ||
          Math.abs(prev.height - newRect.height) > 0.5
        ) {
          return newRect;
        }
        return prev;
      });

      // Calculate vertical position avoiding overlap with the spotlighted element
      const spotlightPad = isNavItem ? 3 : 6;
      const spotTop = rect.top - spotlightPad;
      const spotBottom = rect.bottom + spotlightPad;
      const spotLeft = rect.left - spotlightPad;
      const spotRight = rect.right + spotlightPad;

      let top = defaultCenterTop;

      // Check if the spotlighted element intersects with both the card's horizontal and vertical center area
      const horizontalOverlap = !(
        spotRight < centeredLeft - 16 ||
        spotLeft > centeredLeft + cardWidth + 16
      );
      const verticalOverlap = !(
        spotBottom < defaultCenterTop - 12 ||
        spotTop > defaultCenterTop + cardHeight + 12
      );
      const overlapsCenter = horizontalOverlap && verticalOverlap;

      if (overlapsCenter) {
        const canFitBelow = spotBottom + cardHeight + 20 <= viewportH;
        const canFitAbove = spotTop - cardHeight - 20 >= 70;

        if (canFitBelow) {
          top = Math.round(spotBottom + 16);
        } else if (canFitAbove) {
          top = Math.round(Math.max(70, spotTop - cardHeight - 16));
        } else {
          // Clamp safely within viewport bounds
          top = Math.round(Math.max(70, Math.min(viewportH - cardHeight - 16, spotBottom + 16)));
        }
      }

      setTooltipPos((prev) => {
        if (Math.abs(prev.top - top) > 0.5 || Math.abs(prev.left - centeredLeft) > 0.5) {
          return { top, left: centeredLeft };
        }
        return prev;
      });
    } else {
      // Element not yet mounted (e.g., during async route render)
      setTargetRect(null);
      setTooltipPos({
        top: defaultCenterTop,
        left: centeredLeft,
      });
    }
  }, [isTourActive, currentStep]);

  // High-performance rAF loop for smooth tracking during scrolls and responsive window changes
  useEffect(() => {
    if (!isTourActive) return;

    let animId: number;
    let isRunning = true;

    const loop = () => {
      if (!isRunning) return;
      updateTargetPosition();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const handleWindowChange = () => {
      updateTargetPosition();
    };

    window.addEventListener('resize', handleWindowChange, { passive: true });
    // Capture phase listener ensures scroll events inside sidebar nav containers are intercepted immediately
    window.addEventListener('scroll', handleWindowChange, { passive: true, capture: true });

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, { capture: true });
    };
  }, [isTourActive, updateTargetPosition]);

  if (!isTourActive) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const isNavItem = currentStep.targetSelector.startsWith('#tour-nav-');
  const spotlightPad = isNavItem ? 3 : 6;
  const rx = isNavItem ? 12 : 16;
  const borderRadiusClass = isNavItem ? 'rounded-xl' : 'rounded-2xl';

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-auto">
      {/* Dark Semi-Transparent SVG Backdrop with Spotlight Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-[9991]"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White background: dim entire viewport */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout: only cut out for targeted elements on spotlighted steps */}
            {currentStep.showSpotlight && targetRect && (
              <rect
                x={Math.max(0, targetRect.left - spotlightPad)}
                y={Math.max(0, targetRect.top - spotlightPad)}
                width={targetRect.width + spotlightPad * 2}
                height={targetRect.height + spotlightPad * 2}
                rx={rx}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Soft, deep dark overlay mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 7, 20, 0.76)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Subtle, Clean Violet Spotlight Border with Soft Outer Glow */}
      {currentStep.showSpotlight && targetRect && (
        <div
          style={{
            top: targetRect.top - spotlightPad,
            left: targetRect.left - spotlightPad,
            width: targetRect.width + spotlightPad * 2,
            height: targetRect.height + spotlightPad * 2,
          }}
          className={`fixed pointer-events-none z-[9992] ${borderRadiusClass} border border-[#8B5CF6] shadow-[0_0_16px_rgba(139,92,246,0.35)] transition-all duration-300`}
        />
      )}

      {/* Floating Information Explanation Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            maxWidth: 'calc(100vw - 32px)',
            width: 440,
          }}
          className="fixed z-[9999] bg-gradient-to-b from-[#19162C] via-[#151226] to-[#100E21] border border-[#8B5CF6]/60 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(139,92,246,0.2)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-[#F8FAFC] space-y-4 backdrop-blur-xl select-none"
        >
          {/* Card Header: Feature Icon, Step Pill, Title, Close Button */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#2A2548]">
            <div className="flex items-center gap-3 min-w-0">
              {/* Feature Icon in glowing container */}
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] shadow-[0_0_16px_rgba(139,92,246,0.3)] flex-shrink-0">
                {getStepIcon(currentStep.id)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded-full">
                    Step {currentStepIndex + 1} of {totalSteps}
                  </span>
                  <span className="text-[11px] font-bold text-[#A5A1BA] truncate">
                    {currentStep.category}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#F8FAFC] tracking-tight mt-0.5 truncate">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={skipTour}
              className="p-1.5 rounded-xl text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] transition-colors flex-shrink-0"
              aria-label="Close tour"
              title="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Pill indicator for sidebar steps */}
          {isNavItem && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#A78BFA] text-[11px] font-medium w-fit">
              <Compass className="w-3.5 h-3.5 text-[#8B5CF6] flex-shrink-0" />
              <span>Sidebar Navigation • Highlighted Item</span>
            </div>
          )}

          {/* Short, Simple Student-Friendly Explanation */}
          <p className="text-xs sm:text-sm text-[#A5A1BA] leading-relaxed">
            {currentStep.description}
          </p>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-[#A5A1BA] uppercase tracking-wider">Tour Progress</span>
              <span className="text-[#A78BFA]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#211D38] rounded-full h-1.5 overflow-hidden border border-[#2A2548]">
              <motion.div
                className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-purple-400 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-[#2A2548]">
            <button
              type="button"
              onClick={skipTour}
              className="text-xs font-semibold text-[#A5A1BA] hover:text-[#F8FAFC] transition-colors py-1.5 px-2 rounded-lg hover:bg-[#211D38]/50"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={prevStep}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  className="text-xs px-3"
                >
                  Previous
                </Button>
              )}

              {isLastStep ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={finishTour}
                  rightIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                  className="text-xs px-4 bg-gradient-to-r from-[#8B5CF6] to-emerald-500 border-none shadow-[0_0_18px_rgba(16,185,129,0.4)]"
                >
                  Finish Tour
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={nextStep}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs px-4 shadow-[0_0_16px_rgba(139,92,246,0.4)]"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
