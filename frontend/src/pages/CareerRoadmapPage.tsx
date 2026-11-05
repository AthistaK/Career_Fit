import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  CircleDot,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { SkillChip } from '../components/common/SkillChip';
import { LoadingState } from '../components/common/LoadingAndEmpty';
import { roadmapService } from '../services/extraServices';
import { CareerRoadmap } from '../types';

const ROLES = [
  'AI & Machine Learning Engineer',
  'Full Stack Developer',
  'Backend Software Engineer',
  'Cloud & DevOps Engineer',
  'Data Analyst / BI Specialist',
];

export const CareerRoadmapPage: React.FC = () => {
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || 'Full Stack Developer';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoadmapForRole = async (roleName: string) => {
    try {
      setLoading(true);
      const data = await roadmapService.getRoadmap(roleName);
      setRoadmap(data);
    } catch (err) {
      console.error('Failed to load roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmapForRole(selectedRole);
  }, [selectedRole]);

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald" icon={<Compass className="w-3.5 h-3.5" />}>
            Milestone Career Progression
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
            Interactive Career Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A1BA] mt-1">
            Step-by-step milestones tailored to your current skills and target placement role.
          </p>
        </div>

        {/* Role Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRole === r
                  ? 'bg-[#8B5CF6] text-white shadow-soft font-bold'
                  : 'bg-[#211D38] border border-[#2A2548] text-[#A5A1BA] hover:bg-[#2A2548] hover:text-[#F8FAFC]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState
          message="Generating Customized Roadmap..."
          subMessage={`Constructing 5-milestone progression path for ${selectedRole}`}
        />
      ) : roadmap ? (
        <div className="space-y-8">
          {/* Top Overall Readiness Summary */}
          <Card className="p-6 bg-gradient-to-r from-[#19162C] via-[#211D38] to-[#100E21] border border-[#2A2548] text-[#F8FAFC] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-lg">
              <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
                Placement Readiness
              </span>
              <h3 className="text-xl font-bold tracking-tight">{roadmap.target_role_title}</h3>
              <p className="text-xs text-[#A5A1BA] leading-relaxed">
                You have fulfilled {roadmap.overall_readiness}% of foundational requirements for this career track.
              </p>
            </div>

            <div className="w-full md:w-64 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#A5A1BA]">
                <span>Overall Track Readiness</span>
                <span className="text-[#A78BFA]">{roadmap.overall_readiness}%</span>
              </div>
              <ProgressBar value={roadmap.overall_readiness} height="md" color="brand" />
            </div>
          </Card>

          {/* Milestone Waypoint Progression Tree */}
          <div id="tour-roadmap" className="flex flex-col">
            {roadmap.milestones.map((ms, index) => {
              const isFirst = index === 0;
              const isLast = index === roadmap.milestones.length - 1;

              let statusIcon = <CircleDot className="w-4 h-4 text-[#A5A1BA]" />;
              let statusBadge = <Badge variant="slate" size="sm">Future Milestone</Badge>;
              let cardBorder = 'border-[#2A2548] bg-[#19162C]';
              let markerBgBorder = 'bg-[#19162C] border-2 border-[#2A2548] text-[#A5A1BA]';

              if (ms.status === 'completed') {
                statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                statusBadge = <Badge variant="emerald" size="sm">✓ Completed</Badge>;
                cardBorder = 'border-emerald-500/30 bg-[#19162C]';
                markerBgBorder =
                  'bg-[#19162C] border-2 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] text-emerald-400';
              } else if (ms.status === 'in_progress') {
                statusIcon = <Clock className="w-4 h-4 text-[#8B5CF6] animate-pulse" />;
                statusBadge = <Badge variant="indigo" size="sm">→ In Progress (Current)</Badge>;
                cardBorder =
                  'border-[#8B5CF6]/50 bg-[#19162C] shadow-[0_0_20px_rgba(139,92,246,0.15)]';
                markerBgBorder =
                  'bg-[#19162C] border-2 border-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.4)] text-[#8B5CF6]';
              } else if (ms.status === 'next') {
                statusIcon = <Sparkles className="w-4 h-4 text-amber-400" />;
                statusBadge = <Badge variant="amber" size="sm">Next Priority</Badge>;
                cardBorder = 'border-amber-500/30 bg-[#19162C]';
                markerBgBorder =
                  'bg-[#19162C] border-2 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] text-amber-400';
              }

              return (
                <div
                  key={ms.order}
                  className={`relative flex items-start gap-4 sm:gap-6 ${
                    isLast ? '' : 'pb-6 sm:pb-8'
                  }`}
                >
                  {/* Timeline Spine Column: Perfectly Centered Vertical Line + Marker */}
                  <div className="relative flex flex-col items-center flex-shrink-0 self-stretch w-8 sm:w-10">
                    {/* Continuous Vertical Timeline Line */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 w-0.5 bg-[#2A2548] ${
                        isFirst ? 'top-9' : 'top-0'
                      } ${isLast ? 'h-9' : 'bottom-0'}`}
                    />

                    {/* Milestone Pin Marker */}
                    <div
                      className={`relative z-10 mt-5 w-8 h-8 rounded-full ${markerBgBorder} flex items-center justify-center shadow-md flex-shrink-0 transition-transform duration-200 hover:scale-110`}
                      title={`Milestone 0${ms.order}: ${ms.title}`}
                    >
                      {statusIcon}
                    </div>
                  </div>

                  {/* Milestone Content Card */}
                  <Card className={`flex-1 min-w-0 p-5 sm:p-6 space-y-4 ${cardBorder}`}>
                    {/* Card Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2548]/60">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-[#211D38] border border-[#2A2548] text-[#A78BFA] text-xs font-black flex items-center justify-center flex-shrink-0 shadow-soft-sm">
                          0{ms.order}
                        </span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5A1BA] block">
                            {ms.category}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-[#F8FAFC] tracking-tight">
                            {ms.title}
                          </h4>
                        </div>
                      </div>
                      <div className="flex-shrink-0 self-start sm:self-auto">
                        {statusBadge}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#A5A1BA] leading-relaxed">
                      {ms.description}
                    </p>

                    {/* Associated Skills / Core Competencies */}
                    {ms.skills.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-[#A5A1BA] uppercase tracking-wider block">
                          Core Competencies:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {ms.skills.map((sk) => (
                            <SkillChip
                              key={sk}
                              name={sk}
                              matchType={ms.status === 'completed' ? 'matched' : 'neutral'}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Student Action Deliverables */}
                    {ms.action_items.length > 0 && (
                      <div className="p-4 bg-[#211D38] rounded-2xl border border-[#2A2548] space-y-2.5 w-full">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#2A2548]">
                          <BookOpen className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                          <h5 className="text-xs font-bold text-[#F8FAFC]">
                            Recommended Student Action Deliverables:
                          </h5>
                        </div>
                        <ul className="text-xs text-[#A5A1BA] space-y-2 pt-0.5">
                          {ms.action_items.map((action, i) => (
                            <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-1.5 flex-shrink-0" />
                              <span className="text-[#F8FAFC]/90">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
