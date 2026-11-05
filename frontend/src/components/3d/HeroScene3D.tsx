import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  FileText,
  Target,
  Compass,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { isWebGLAvailable } from './WebGLDetector';
import { FallbackVisual } from './FallbackVisual';

export const HeroScene3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tilt interaction with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springConfig);

  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  if (!webglSupported) {
    return <FallbackVisual className={className} />;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-[410px] sm:h-[500px] lg:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 shadow-2xl border border-indigo-500/20 p-3 sm:p-6 flex items-center justify-center select-none ${className}`}
      style={{ perspective: 1200 }}
    >
      {/* Ambient background glow & grid lines */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent-cyan/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#4338ca_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 bg-white/10 backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 sm:gap-2 shadow-soft">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>CareerFit AI Analysis Engine</span>
      </div>

      {/* 3D Interactive Master Layer */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full max-w-md mx-auto flex items-center justify-center"
      >
        {/* ============================================================ */}
        {/* 1. CENTRAL FLOATING RESUME / CAREERFIT PROFILE CARD */}
        {/* ============================================================ */}
        <div
          className="relative z-10 w-[92%] sm:w-[360px] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(15,23,42,0.4)] border border-white/80 space-y-3 sm:space-y-4 text-slate-900"
          style={{ transform: 'translateZ(30px)' }}
        >
          {/* Card Header: Student Identity & Verified Pill */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-soft flex-shrink-0">
                <FileText className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-cyan-200" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  Candidate Profile
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                </h4>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-brand-500 flex-shrink-0" />
                  Computer Science • 2027
                </p>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full">
              PDF Parsed
            </span>
          </div>

          {/* Central CareerFit Score Ring Display */}
          <div className="flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-brand-50/80 to-indigo-50/80 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-brand-100/80">
            {/* SVG Progress Ring */}
            <div className="relative w-14 sm:w-16 h-14 sm:h-16 flex-shrink-0 flex items-center justify-center">
              <svg className="w-14 sm:w-16 h-14 sm:h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-brand-600"
                  strokeDasharray="94, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">94</span>
                <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase">/100</span>
              </div>
            </div>

            <div className="flex-1 space-y-0.5 sm:space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-brand-600">
                  CareerFit Score
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  Top 5%
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-700 leading-tight">
                Placement Ready Profile
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] text-slate-500">
                <span>Skills: 96%</span>
                <span>•</span>
                <span>Projects: 92%</span>
              </div>
            </div>
          </div>

          {/* Verified Extracted Skills Chips */}
          <div className="space-y-1.5 sm:space-y-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Extracted Competencies:
            </span>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Python
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-md text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> SQL
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> AI / ML
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> C++
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[9px] sm:text-[10px] font-semibold">
                +14 More
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SATELLITE FLOATING CARD (TOP-RIGHT): JOB MATCH COMPATIBILITY */}
        {/* ============================================================ */}
        <motion.div
          animate={{ y: [6, -6, 6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute -top-5 sm:-top-8 -right-2 sm:-right-8 z-20 bg-slate-900/90 backdrop-blur-md border border-cyan-400/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-xl text-white max-w-[170px] sm:max-w-[210px] space-y-1 sm:space-y-1.5 scale-90 sm:scale-100 origin-top-right"
          style={{ transform: 'translateZ(60px)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
                <Target className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Job Match Fit
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold text-emerald-400">94%</span>
          </div>

          <div>
            <h5 className="text-[10px] sm:text-[11px] font-bold text-white truncate">Junior AI & ML Engineer</h5>
            <p className="text-[8px] sm:text-[9px] text-slate-300">12 Matched • 0 Gaps</p>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* 3. SATELLITE FLOATING CARD (BOTTOM-LEFT): CAREER GROWTH & ROADMAP */}
        {/* ============================================================ */}
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          className="absolute -bottom-5 sm:-bottom-8 -left-2 sm:-left-8 z-20 bg-slate-900/90 backdrop-blur-md border border-indigo-400/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-xl text-white max-w-[180px] sm:max-w-[220px] space-y-1.5 sm:space-y-2 scale-90 sm:scale-100 origin-bottom-left"
          style={{ transform: 'translateZ(50px)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-brand-500/20 text-brand-400 rounded-lg">
                <Compass className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-brand-300">
                Career Roadmap
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-extrabold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +14 pts
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[8px] sm:text-[9px] text-slate-300 font-semibold">
              <span>Milestone 3 of 5</span>
              <span className="text-cyan-300 font-bold">Applied Projects</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-brand-500 to-cyan-400 h-full w-[60%] rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* 4. SATELLITE FLOATING MINI-BADGE (TOP-LEFT): TAXONOMY NLP */}
        {/* ============================================================ */}
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -top-4 sm:-top-5 -left-1 sm:-left-4 z-20 bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-white flex items-center gap-1.5 shadow-lg text-[9px] sm:text-[10px] font-bold scale-90 sm:scale-100 origin-top-left"
          style={{ transform: 'translateZ(40px)' }}
        >
          <Sparkles className="w-3 h-3 text-cyan-300" />
          <span className="text-brand-200">1,200+ Skill Taxonomy</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
