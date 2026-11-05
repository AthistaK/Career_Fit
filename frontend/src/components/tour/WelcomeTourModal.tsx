import React from 'react';
import { Compass, Sparkles, ArrowRight } from 'lucide-react';
import { useTour } from '../../context/TourContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const WelcomeTourModal: React.FC = () => {
  const { showWelcomeModal, startTour, closeWelcomeModal } = useTour();

  if (!showWelcomeModal) return null;

  return (
    <Modal
      isOpen={showWelcomeModal}
      onClose={closeWelcomeModal}
      title=""
      maxWidth="md"
    >
      <div className="text-center space-y-5 pt-2 pb-1">
        {/* Glowing Compass Icon */}
        <div className="w-16 h-16 rounded-3xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center mx-auto text-[#A78BFA] shadow-[0_0_24px_rgba(139,92,246,0.35)]">
          <Compass className="w-8 h-8" />
        </div>

        {/* Welcome Heading & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> First-Time Orientation
          </div>
          <h2 className="text-2xl font-black text-[#F8FAFC] tracking-tight">
            Welcome to CareerFit!
          </h2>
          <p className="text-xs sm:text-sm text-[#A5A1BA] leading-relaxed max-w-md mx-auto">
            Your personal career assistant. Let's take a quick tour to discover how you can
            improve your resume, find suitable jobs and prepare for your career.
          </p>
        </div>

        {/* Feature Quick Bullet Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-1">
          <div className="p-3 rounded-xl bg-[#211D38] border border-[#2A2548] space-y-1">
            <p className="text-xs font-bold text-[#F8FAFC]">1. Score & Match</p>
            <p className="text-[11px] text-[#A5A1BA]">Explainable 5-factor scoring & instant role diagnostics.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#211D38] border border-[#2A2548] space-y-1">
            <p className="text-xs font-bold text-[#F8FAFC]">2. Practice & Prep</p>
            <p className="text-[11px] text-[#A5A1BA]">Targeted STAR interview answers based on real projects.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#211D38] border border-[#2A2548] space-y-1">
            <p className="text-xs font-bold text-[#F8FAFC]">3. Build Roadmap</p>
            <p className="text-[11px] text-[#A5A1BA]">Milestone learning path to bridge technical skill gaps.</p>
          </div>
        </div>

        {/* Action Buttons: Start Tour vs Explore on My Own */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={closeWelcomeModal}
            className="w-full sm:w-auto text-xs"
          >
            Explore on My Own
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => startTour(0)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs shadow-[0_0_16px_rgba(139,92,246,0.4)]"
          >
            Start Tour
          </Button>
        </div>
      </div>
    </Modal>
  );
};
