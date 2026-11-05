import React, { useEffect, useState, useRef } from 'react';

type CursorState = 'default' | 'button' | 'card' | 'link' | 'upload' | 'hidden';

export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [cursorState, setCursorState] = useState<CursorState>('default');

  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // 1. Accessibility & Device Detection: Fine pointer and no reduced motion
    const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasPointer || prefersReducedMotion) {
      setEnabled(false);
      document.body.classList.remove('custom-cursor-active');
      return;
    }

    setEnabled(true);
    document.body.classList.add('custom-cursor-active');

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Inputs & Textareas -> hide custom target cursor completely to let native text cursor work
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        setCursorState('hidden');
        return;
      }

      // Resume Upload Drop Zone
      if (
        target.closest('[class*="border-dashed"]') ||
        target.closest('[data-cursor="upload"]')
      ) {
        setCursorState('upload');
        return;
      }

      // Primary Buttons & Action items
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.getAttribute('role') === 'button' ||
        target.getAttribute('type') === 'button' ||
        target.getAttribute('type') === 'submit'
      ) {
        setCursorState('button');
        return;
      }

      // Interactive Cards
      if (
        target.closest('[class*="Card"]') ||
        target.closest('[class*="card"]') ||
        target.closest('[data-cursor="card"]')
      ) {
        if (target.closest('button') || target.closest('a')) {
          setCursorState('button');
        } else if (target.closest('.cursor-pointer')) {
          setCursorState('card');
        } else {
          setCursorState('default');
        }
        return;
      }

      // Text links & Navigation
      if (target.tagName === 'A' || target.closest('a')) {
        setCursorState('link');
        return;
      }

      // Generic pointer elements
      const computedCursor = window.getComputedStyle(target).cursor;
      if (computedCursor === 'pointer') {
        setCursorState('button');
        return;
      }

      setCursorState('default');
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);
    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Direct, zero-latency 60/120fps positioning loop
    const render = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouseRef.current.x}px, ${mouseRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [visible]);

  if (!enabled) return null;

  // Determine dynamic visual properties for the Target Cursor
  let targetScale = 'scale-100';
  let targetColor = 'text-brand-600';
  let targetFilter = '';
  let rotateAngle = 'rotate-0';

  if (clicked) {
    targetScale = 'scale-[0.82]';
    targetColor = 'text-cyan-400';
  } else if (cursorState === 'button') {
    targetScale = 'scale-[1.3]';
    targetColor = 'text-cyan-500';
    targetFilter = 'drop-shadow(0 0 5px rgba(6,182,212,0.6))';
  } else if (cursorState === 'card') {
    targetScale = 'scale-[1.18]';
    targetColor = 'text-cyan-600';
  } else if (cursorState === 'link') {
    targetScale = 'scale-[1.12]';
    targetColor = 'text-indigo-500';
    rotateAngle = 'rotate-45';
  } else if (cursorState === 'upload') {
    targetScale = 'scale-[1.35]';
    targetColor = 'text-emerald-500';
    targetFilter = 'drop-shadow(0 0 5px rgba(16,185,129,0.5))';
  }

  const isHidden = !visible || cursorState === 'hidden';

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[99999] overflow-hidden transition-opacity duration-150 ${
        isHidden ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Target Precision Reticle Element */}
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 pointer-events-none transition-[transform,color] duration-150 ease-out will-change-transform ${targetColor} ${targetScale} ${rotateAngle}`}
        style={{
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
          filter: targetFilter,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* Subtle Outer Target Circle */}
          <circle
            cx="13"
            cy="13"
            r="8.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.8"
            className="transition-all duration-150"
          />

          {/* 4-Direction Precision Crosshair Ticks */}
          {/* Top Tick */}
          <line
            x1="13"
            y1="1.5"
            x2="13"
            y2="4.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Bottom Tick */}
          <line
            x1="13"
            y1="21.5"
            x2="13"
            y2="24.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Left Tick */}
          <line
            x1="1.5"
            y1="13"
            x2="4.5"
            y2="13"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Right Tick */}
          <line
            x1="21.5"
            y1="13"
            x2="24.5"
            y2="13"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Center Precision Target Dot */}
          <circle
            cx="13"
            cy="13"
            r={cursorState === 'button' ? '2.5' : '1.8'}
            fill="currentColor"
            className="transition-all duration-150"
          />
        </svg>
      </div>
    </div>
  );
};
