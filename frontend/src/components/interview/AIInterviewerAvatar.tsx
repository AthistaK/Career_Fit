import React, { useState, useEffect } from 'react';
import { Sparkles, Mic, Volume2, Brain, CheckCircle2 } from 'lucide-react';
import { AvatarState, InterviewState } from '../../types/liveInterview';

interface AvatarProps {
  state: AvatarState;
  interviewState?: InterviewState;
  audioLevel?: number; // 0 to 1 for live mouth & glow responsiveness
}

export const AIInterviewerAvatar: React.FC<AvatarProps> = ({ state, interviewState, audioLevel = 0 }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [speakingFrame, setSpeakingFrame] = useState(0);

  // Natural organic blinking cycle (every 3.2 - 4.5 seconds)
  useEffect(() => {
    let blinkTimer: any;
    let blinkCloseTimer: any;

    const scheduleNextBlink = () => {
      const nextDelay = 3200 + Math.random() * 1500;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        blinkCloseTimer = setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 140);
      }, nextDelay);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(blinkCloseTimer);
    };
  }, []);

  // Subtle mouth animation clock during speech
  useEffect(() => {
    if (state !== 'speaking') {
      setSpeakingFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setSpeakingFrame((prev) => (prev + 1) % 12);
    }, 75);

    return () => clearInterval(interval);
  }, [state]);

  // Clean, minimal state label and badge configurations
  const getStateConfig = () => {
    if (interviewState === 'AI Speaking' || state === 'speaking') {
      return {
        label: 'AI Speaking',
        icon: Volume2,
        badgeColor: 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]',
        auraClass: 'bg-[#8B5CF6]/25 scale-110',
        dotClass: 'bg-[#8B5CF6] animate-ping',
      };
    }
    if (interviewState === 'Listening to You' || state === 'listening') {
      return {
        label: 'Listening to You',
        icon: Mic,
        badgeColor: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300',
        auraClass: 'bg-emerald-500/20 scale-105',
        dotClass: 'bg-emerald-400 animate-pulse',
      };
    }
    if (interviewState === 'Processing Answer' || state === 'thinking') {
      return {
        label: 'Processing Answer',
        icon: Brain,
        badgeColor: 'bg-amber-500/20 border-amber-500/60 text-amber-300',
        auraClass: 'bg-amber-500/20 scale-100',
        dotClass: 'bg-amber-400 animate-spin',
      };
    }
    if (interviewState === 'Interview Completed' || state === 'closing') {
      return {
        label: 'Interview Completed',
        icon: CheckCircle2,
        badgeColor: 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300',
        auraClass: 'bg-indigo-500/20 scale-100',
        dotClass: 'bg-indigo-400',
      };
    }
    return {
      label: 'Preparing',
      icon: Sparkles,
      badgeColor: 'bg-[#211D38] border-[#2A2548] text-[#A5A1BA]',
      auraClass: 'bg-[#8B5CF6]/10 scale-95',
      dotClass: 'bg-[#A78BFA] animate-pulse',
    };
  };

  const stateConfig = getStateConfig();
  const StateIcon = stateConfig.icon;

  // Posture transform based on state
  const getAvatarTransformClass = () => {
    switch (state) {
      case 'speaking':
        return 'animate-speaking-cadence';
      case 'listening':
        return 'scale-[1.015] translate-y-1';
      case 'thinking':
        return '-rotate-[1.5deg] -translate-y-1';
      case 'greeting':
        return 'rotate-[0.8deg] -translate-y-1';
      case 'closing':
        return 'translate-y-1';
      case 'idle':
      default:
        return 'animate-subtle-breath';
    }
  };

  // Lip-sync open factor (combines speechFrame rhythm + live audioLevel)
  const mouthOpenFactor =
    state === 'speaking'
      ? Math.min(1.0, (Math.sin(speakingFrame * 0.9) * 0.5 + 0.5) * 0.6 + audioLevel * 0.7)
      : 0;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#141029] via-[#100E21] to-[#0B0A19] border border-[#2A2548]">
      {/* ========================================================
          STUDIO BACKGROUND LIGHTING & ATMOSPHERE
      ======================================================== */}
      {/* Top Ambient Violet Spotlight */}
      <div className="absolute -top-16 w-full max-w-lg h-72 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />

      {/* Dynamic State Reactive Aura Ring */}
      <div
        className={`absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full transition-all duration-700 pointer-events-none blur-3xl ${stateConfig.auraClass}`}
      />

      {/* Speaking Soundwave Radial Ripples */}
      {state === 'speaking' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-80 h-80 rounded-full border border-[#8B5CF6]/30 animate-ping opacity-60"
            style={{ animationDuration: '2.5s' }}
          />
          <div
            className="w-96 h-96 rounded-full border border-[#A78BFA]/20 animate-ping opacity-40"
            style={{ animationDuration: '3.5s', animationDelay: '0.8s' }}
          />
        </div>
      )}

      {/* Listening Soundwave Pulse */}
      {state === 'listening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-80 h-80 rounded-full border border-emerald-500/30 animate-pulse opacity-50"
            style={{ animationDuration: '2s' }}
          />
        </div>
      )}

      {/* ========================================================
          3D AI RECRUITER AVATAR CHARACTER STAGE
          Completely uncropped, full upper body & head visible
      ======================================================== */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-3 sm:p-6 pb-14">
        <div
          className={`relative max-w-full max-h-full aspect-square flex items-center justify-center transition-transform duration-500 ease-out ${getAvatarTransformClass()}`}
          style={{ width: 'min(92%, 520px)', height: 'min(92%, 520px)' }}
        >
          {/* Main 3D Recruiter Avatar Image */}
          <img
            src="/ai_recruiter_avatar.png"
            alt="AI Interviewer"
            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_16px_40px_rgba(139,92,246,0.3)] transition-all duration-300"
          />

          {/* ========================================================
              NATURAL BLINKING OVERLAY (Left & Right Eyes)
          ======================================================== */}
          {isBlinking && (
            <>
              {/* Left Eye Eyelid */}
              <div
                className="absolute rounded-full bg-[#E8C2A0] shadow-inner pointer-events-none transition-all duration-75"
                style={{
                  top: '37.8%',
                  left: '42.2%',
                  width: '5.2%',
                  height: '2.2%',
                  transform: 'rotate(-4deg)',
                }}
              />
              {/* Right Eye Eyelid */}
              <div
                className="absolute rounded-full bg-[#E8C2A0] shadow-inner pointer-events-none transition-all duration-75"
                style={{
                  top: '37.8%',
                  left: '54.2%',
                  width: '5.2%',
                  height: '2.2%',
                  transform: 'rotate(4deg)',
                }}
              />
            </>
          )}

          {/* ========================================================
              LIVE LIP-SYNC / MOUTH SPEAKING OVERLAY
          ======================================================== */}
          {state === 'speaking' && mouthOpenFactor > 0.05 && (
            <div
              className="absolute pointer-events-none transition-transform duration-75 ease-out"
              style={{
                top: '51.8%',
                left: '48.2%',
                width: '4.8%',
                height: `${2.0 + mouthOpenFactor * 3.8}%`,
                transform: `scale(${1.0 + mouthOpenFactor * 0.15})`,
              }}
            >
              <div className="w-full h-full rounded-full bg-[#8E223D] border border-[#B93A57]/60 shadow-[0_0_4px_rgba(225,29,72,0.4)] flex items-center justify-center overflow-hidden">
                {mouthOpenFactor > 0.4 && (
                  <div className="w-3/4 h-[35%] rounded-full bg-[#FFFFFF]/90 -mt-1" />
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              HEADSET MICROPHONE ACTIVE GLOWING LED
          ======================================================== */}
          <div
            className={`absolute pointer-events-none rounded-full transition-all duration-300 ${
              state === 'speaking'
                ? 'bg-[#A78BFA] shadow-[0_0_12px_#8B5CF6] scale-125 animate-pulse'
                : state === 'listening'
                ? 'bg-emerald-400 shadow-[0_0_12px_#10B981] scale-110'
                : 'bg-[#8B5CF6]/60 shadow-[0_0_6px_#8B5CF6]'
            }`}
            style={{
              top: '56.2%',
              left: '59.8%',
              width: '1.6%',
              height: '1.6%',
            }}
          />
        </div>
      </div>

      {/* ========================================================
          FLOATING AVATAR STATUS BADGE
      ======================================================== */}
      <div className="absolute bottom-4 sm:bottom-5 z-20 flex items-center gap-2 select-none">
        <div
          className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full border backdrop-blur-md shadow-2xl transition-all duration-300 text-xs font-bold tracking-wide ${stateConfig.badgeColor}`}
        >
          <span className={`w-2 h-2 rounded-full ${stateConfig.dotClass}`} />
          <StateIcon className="w-3.5 h-3.5" />
          <span>{stateConfig.label}</span>

          {/* Equalizer animation bars during AI speech */}
          {state === 'speaking' && (
            <div className="flex items-end gap-0.5 h-3 ml-1">
              <span className="w-0.5 h-full bg-[#A78BFA] animate-pulse rounded-full" />
              <span
                className="w-0.5 h-2/3 bg-[#A78BFA] animate-pulse rounded-full"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="w-0.5 h-4/5 bg-[#A78BFA] animate-pulse rounded-full"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* CSS Keyframe animations for natural avatar movements */}
      <style>{`
        @keyframes subtleBreath {
          0%, 100% {
            transform: translateY(0px) scale(1.0);
          }
          50% {
            transform: translateY(-5px) scale(1.008);
          }
        }
        @keyframes speakingCadence {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-2px) rotate(0.8deg);
          }
          50% {
            transform: translateY(1.5px) rotate(-0.5deg);
          }
          75% {
            transform: translateY(-1px) rotate(0.6deg);
          }
        }
        .animate-subtle-breath {
          animation: subtleBreath 4.2s ease-in-out infinite;
        }
        .animate-speaking-cadence {
          animation: speakingCadence 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
