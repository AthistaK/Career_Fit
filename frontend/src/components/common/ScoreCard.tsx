import React from 'react';
import { Card } from './Card';
import { ProgressRing } from './ProgressRing';
import { Badge } from './Badge';
import { ScoreBreakdown } from '../../types';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface ScoreCardProps {
  score: number;
  breakdown?: ScoreBreakdown;
  onViewDetails?: () => void;
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  breakdown,
  onViewDetails,
  className = '',
}) => {
  let statusBadge = <Badge variant="emerald">Placement Ready</Badge>;
  if (score < 60) statusBadge = <Badge variant="amber">Building Foundations</Badge>;
  else if (score < 80) statusBadge = <Badge variant="indigo">Competitive Profile</Badge>;

  return (
    <Card
      glowStrength="strong"
      className={`p-4 sm:p-6 relative overflow-hidden bg-[#19162C] border border-[#2A2548] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Resume Strength & Quality</span>
          <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] flex flex-wrap items-center gap-2 mt-0.5">
            CareerFit Score {statusBadge}
          </h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
        <ProgressRing score={score} size={150} strokeWidth={12} sublabel="CareerFit Score" />

        <div className="flex-1 w-full space-y-2.5">
          {breakdown && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-[#211D38] p-2.5 rounded-xl border border-[#2A2548]">
                <span className="font-semibold text-[#A5A1BA]">Technical Skills (40%)</span>
                <span className="font-bold text-[#F8FAFC]">{breakdown.skills?.score || 0} pts</span>
              </div>
              <div className="flex justify-between items-center bg-[#211D38] p-2.5 rounded-xl border border-[#2A2548]">
                <span className="font-semibold text-[#A5A1BA]">Projects Portfolio (20%)</span>
                <span className="font-bold text-[#F8FAFC]">{breakdown.projects?.score || 0} pts</span>
              </div>
              <div className="flex justify-between items-center bg-[#211D38] p-2.5 rounded-xl border border-[#2A2548]">
                <span className="font-semibold text-[#A5A1BA]">Experience / Internships (20%)</span>
                <span className="font-bold text-[#F8FAFC]">{breakdown.experience?.score || 0} pts</span>
              </div>
            </div>
          )}

          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="w-full mt-2"
            >
              View Full Scoring Breakdown
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
