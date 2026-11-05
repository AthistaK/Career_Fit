import React, { useEffect, useState } from 'react';
import {
  Award,
  Flame,
  CheckCircle2,
  Cpu,
  Target,
  FileCheck,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingState } from '../components/common/LoadingAndEmpty';
import { achievementService } from '../services/extraServices';
import { GamificationProfile } from '../types';

export const AchievementsPage: React.FC = () => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        setLoading(true);
        const data = await achievementService.getGamificationProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load gamification profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGamification();
  }, []);

  if (loading || !profile) {
    return <LoadingState message="Loading Achievement Hub..." subMessage="Calculating XP, badges, and placement readiness tiers" />;
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileCheck': return <FileCheck className="w-6 h-6" />;
      case 'Target': return <Target className="w-6 h-6" />;
      case 'Cpu': return <Cpu className="w-6 h-6" />;
      case 'Compass': return <Compass className="w-6 h-6" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div>
        <Badge variant="amber" icon={<Award className="w-3.5 h-3.5" />}>
          Gamification & Milestones
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Student Achievements & Career XP
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Earn XP and unlock badges by analyzing resumes, bridging skill gaps, and improving your placement readiness.
        </p>
      </div>

      {/* Main Student Rank Level Banner */}
      <Card className="p-8 bg-gradient-to-r from-amber-500 via-orange-500 to-brand-600 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner">
              🏆
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
                Level {profile.level} Student
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight">{profile.level_title}</h2>
              <p className="text-xs text-amber-100 mt-0.5">
                {profile.unlocked_count} of {profile.total_achievements} Milestones Unlocked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            {/* Streak Counter */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3">
              <Flame className="w-6 h-6 text-amber-300 animate-bounce" />
              <div>
                <span className="text-xs text-amber-200 block font-semibold">Active Streak</span>
                <span className="text-lg font-extrabold">{profile.streak_days} Day</span>
              </div>
            </div>

            {/* Total XP */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl">
              <span className="text-xs text-amber-200 block font-semibold">Total Career XP</span>
              <span className="text-lg font-extrabold">{profile.current_xp} XP</span>
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-6 pt-4 border-t border-white/20 space-y-1.5 z-10 relative">
          <div className="flex justify-between text-xs font-bold text-amber-100">
            <span>Next Tier: Level {profile.level + 1}</span>
            <span>{profile.current_xp} / {profile.next_level_xp} XP ({profile.progress_to_next_level}%)</span>
          </div>
          <ProgressBar value={profile.progress_to_next_level} height="md" color="amber" />
        </div>
      </Card>

      {/* Badges Collection Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Career Achievement Badges</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.achievements.map((ach) => (
            <Card
              key={ach.id}
              className={`p-6 space-y-4 border transition-all ${
                ach.unlocked
                  ? 'bg-white border-amber-200/80 shadow-soft'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-3.5 rounded-2xl ${
                    ach.unlocked
                      ? 'bg-amber-100 text-amber-800 shadow-soft-sm'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {getIcon(ach.icon)}
                </div>

                <Badge variant={ach.unlocked ? 'emerald' : 'slate'} size="sm">
                  {ach.unlocked ? 'Unlocked' : 'Locked'}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {ach.title}
                  {ach.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ach.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold">
                <span className="text-amber-700">+{ach.xp_reward} XP Reward</span>
                <span className="text-slate-400 text-[10px] font-semibold">{ach.category}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
