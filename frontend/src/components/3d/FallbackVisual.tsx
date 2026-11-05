import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Target,
  Compass,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

export const FallbackVisual: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-full min-h-[460px] flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 border border-indigo-500/20 select-none ${className}`}>
      {/* Background Radial Glow */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent-cyan/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Tag */}
      <div className="absolute top-4 left-4 z-20 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-xl text-white text-[11px] font-bold flex items-center gap-2 shadow-soft">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>CareerFit AI Analysis Engine</span>
      </div>

      {/* Central Floating Resume / CareerFit Card */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full max-w-md mx-auto flex items-center justify-center"
      >
        <div className="relative z-10 w-[92%] sm:w-[360px] bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-[0_20px_50px_rgba(15,23,42,0.4)] border border-white/80 space-y-4 text-slate-900">
          {/* Card Header: Student Identity */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-soft">
                <FileText className="w-4 h-4 text-cyan-200" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  Candidate Profile
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-brand-500" />
                  Computer Science • 2027
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              PDF Parsed
            </span>
          </div>

          {/* Central CareerFit Score Display */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-brand-50/80 to-indigo-50/80 p-3.5 rounded-2xl border border-brand-100/80">
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
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
                <span className="text-sm font-extrabold text-slate-900 leading-none">94</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase">/100</span>
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600">
                  CareerFit Score
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  Top 5%
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                Placement Ready Profile
              </p>
              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <span>Skills: 96%</span>
                <span>•</span>
                <span>Projects: 92%</span>
              </div>
            </div>
          </div>

          {/* Extracted Skills Chips */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Extracted Competencies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Python
              </span>
              <span className="px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> SQL
              </span>
              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> AI / ML
              </span>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> C++
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-semibold">
                +14 More
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Job Match Floating Card */}
        <motion.div
          animate={{ y: [6, -6, 6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute -top-8 -right-4 sm:-right-8 z-20 bg-slate-900/90 backdrop-blur-md border border-cyan-400/40 p-3.5 rounded-2xl shadow-xl text-white max-w-[210px] space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Job Match Fit
              </span>
            </div>
            <span className="text-xs font-extrabold text-emerald-400">94%</span>
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-white truncate">Junior AI & ML Engineer</h5>
            <p className="text-[9px] text-slate-300">12 Matched • 0 Missing Gaps</p>
          </div>
        </motion.div>

        {/* Bottom-Left Roadmap Milestone Floating Card */}
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          className="absolute -bottom-8 -left-4 sm:-left-8 z-20 bg-slate-900/90 backdrop-blur-md border border-indigo-400/40 p-3.5 rounded-2xl shadow-xl text-white max-w-[220px] space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-brand-500/20 text-brand-400 rounded-lg">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300">
                Career Roadmap
              </span>
            </div>
            <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +14 pts
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-slate-300 font-semibold">
              <span>Milestone 3 of 5</span>
              <span className="text-cyan-300 font-bold">Applied Projects</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-brand-500 to-cyan-400 h-full w-[60%] rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Top-Left Taxonomy Mini-Badge */}
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -top-5 -left-2 sm:-left-4 z-20 bg-indigo-950/80 backdrop-blur-md border border-indigo-500/30 px-2.5 py-1.5 rounded-xl text-white flex items-center gap-1.5 shadow-lg text-[10px] font-bold"
        >
          <Sparkles className="w-3 h-3 text-cyan-300" />
          <span className="text-brand-200">1,200+ Skill Taxonomy</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
