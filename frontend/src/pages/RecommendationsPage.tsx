import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Compass,
  ArrowRight,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { SkillChip } from '../components/common/SkillChip';
import { LoadingState } from '../components/common/LoadingAndEmpty';
import { recommendationService } from '../services/extraServices';
import { CareerRoleRecommendation } from '../types';

export const RecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<CareerRoleRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await recommendationService.getRecommendations();
        setRecommendations(data);
      } catch (err) {
        console.error('Failed to load role recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading) {
    return <LoadingState message="Analyzing Career Opportunities..." subMessage="Evaluating skill compatibility across industry tech roles" />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="indigo" icon={<TrendingUp className="w-3.5 h-3.5" />}>
            Personalized Career Fit
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
            Career Role Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A1BA]">
            Roles prioritized based on your verified skills, project profile, and market demand.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/roadmap')}
          rightIcon={<Compass className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          View Roadmap
        </Button>
      </div>

      {/* Role Cards Grid */}
      <div id="tour-recommendations" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((role) => {
          let badgeVariant: 'emerald' | 'amber' | 'violet' = 'amber';
          if (role.priority_level === 'High Match') badgeVariant = 'emerald';
          else if (role.priority_level === 'Pivot Role') badgeVariant = 'violet';

          return (
            <Card key={role.id} hoverEffect className="p-6 space-y-5 flex flex-col justify-between bg-[#19162C] border border-[#2A2548]">
              <div className="space-y-4">
                {/* Role Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 max-w-[75%]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A5A1BA]">
                      {role.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#F8FAFC]">{role.title}</h3>
                  </div>
                  <Badge variant={badgeVariant}>{role.priority_level}</Badge>
                </div>

                {/* Match Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#A5A1BA]">Profile Compatibility</span>
                    <span className="text-[#A78BFA]">{role.match_percentage}%</span>
                  </div>
                  <ProgressBar value={role.match_percentage} height="sm" color="brand" />
                </div>

                <p className="text-xs text-[#A5A1BA] leading-relaxed">{role.description}</p>

                {/* Salary & Demand Tags */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-[#211D38] border border-[#2A2548] px-2.5 py-1 rounded-xl text-[#F8FAFC] font-semibold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    {role.avg_starting_salary}
                  </span>
                  <span className="bg-[#211D38] border border-[#2A2548] px-2.5 py-1 rounded-xl text-[#F8FAFC] font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    Demand: {role.industry_demand} ({role.growth_rate})
                  </span>
                </div>

                {/* Matched vs Missing Skills */}
                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Matched Skills ({role.matched_skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {role.matched_skills.map((s) => (
                        <SkillChip key={s} name={s} matchType="matched" />
                      ))}
                    </div>
                  </div>

                  {role.missing_skills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1 mb-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Missing Skill Gaps ({role.missing_skills.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {role.missing_skills.map((s) => (
                          <SkillChip key={s} name={s} matchType="missing" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/roadmap?role=${encodeURIComponent(role.title)}`)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full mt-4 text-xs sm:text-sm"
              >
                Generate Personalized Roadmap for {role.title}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
