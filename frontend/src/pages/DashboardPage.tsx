import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Target,
  Sparkles,
  Compass,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
  Plus,
  Video,
} from 'lucide-react';
import { resumeService } from '../services/resumeService';
import { jobService } from '../services/jobService';
import { historyService, recommendationService } from '../services/extraServices';
import { liveInterviewService } from '../services/liveInterviewService';
import {
  ResumeAnalysis,
  JobMatchResult,
  CareerRoleRecommendation,
  AnalysisHistoryItem,
  ScoreProgressionPoint,
} from '../types';
import { LiveInterviewDashboardStats } from '../types/liveInterview';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ScoreCard } from '../components/common/ScoreCard';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingState } from '../components/common/LoadingAndEmpty';
import { useTour } from '../context/TourContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { startTour } = useTour();

  const [loading, setLoading] = useState(true);
  const [latestResume, setLatestResume] = useState<ResumeAnalysis | null>(null);
  const [matches, setMatches] = useState<JobMatchResult[]>([]);
  const [recommendations, setRecommendations] = useState<CareerRoleRecommendation[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [progression, setProgression] = useState<ScoreProgressionPoint[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [interviewStats, setInterviewStats] = useState<LiveInterviewDashboardStats | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Load latest resume
        try {
          const res = await resumeService.getLatestResume();
          setLatestResume(res);
        } catch {
          setLatestResume(null);
        }

        // Load matches
        try {
          const m = await jobService.getMatches();
          setMatches(m);
        } catch {
          setMatches([]);
        }

        // Load recommendations
        try {
          const r = await recommendationService.getRecommendations();
          setRecommendations(r.slice(0, 3));
        } catch {
          setRecommendations([]);
        }

        // Load history & progression
        try {
          const h = await historyService.getHistory();
          setHistory(h.slice(0, 5));
          const p = await historyService.getScoreProgression();
          setProgression(p);
        } catch {
          setHistory([]);
          setProgression([]);
        }
        // Load live interview stats
        try {
          const stats = await liveInterviewService.getDashboardStats();
          setInterviewStats(stats);
        } catch {
          setInterviewStats(null);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Your Career Dashboard..." subMessage="Aggregating skill profiles, match statistics, and roadmap data" />;
  }

  const resumeScore = latestResume?.total_score || 0;
  const avgMatchScore = matches.length > 0
    ? Math.round(matches.reduce((acc, curr) => acc + curr.overall_match_score, 0) / matches.length)
    : 0;

  // Filter skills by category
  const skills = latestResume?.skills || [];
  const categories = ['All', ...Array.from(new Set(skills.map((s) => s.category)))];
  const filteredSkills = selectedCategory === 'All'
    ? skills
    : skills.filter((s) => s.category === selectedCategory);

  // Total missing skills across top recommendation
  const topRec = recommendations[0];
  const totalSkillGaps = topRec?.missing_skills?.length || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Banner */}
      <div
        id="tour-dashboard-hero"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#19162C] via-[#211D38] to-[#100E21] border border-[#2A2548] rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-[#F8FAFC] shadow-xl relative overflow-hidden"
      >
        <div className="space-y-2 z-10 max-w-xl">
          <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
            CareerFit Intelligence
          </Badge>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Know Your Fit. Build Your Career.
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A1BA]">
            {latestResume
              ? `Your CareerFit Score is ${resumeScore}/100. Target roles, skill gaps, and roadmap milestones are active.`
              : 'Upload your resume to calculate your CareerFit Score, identify missing skill gaps, and match with target roles.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 z-10 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            onClick={() => startTour(0)}
            leftIcon={<Compass className="w-4 h-4 text-[#8B5CF6]" />}
            className="w-full sm:w-auto text-xs"
          >
            Take a Tour
          </Button>
          <Button
            variant="accent"
            size="md"
            onClick={() => navigate('/analyzer')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {latestResume ? 'Re-Analyze Resume' : 'Analyze My Resume'}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/matcher')}
            leftIcon={<Target className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Match Job
          </Button>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatCard
          label="CareerFit Score"
          value={latestResume ? `${resumeScore}/100` : 'Not Set'}
          subtitle={latestResume ? 'Explainable 5-Factor Strength' : 'Upload resume to calculate'}
          icon={<FileText className="w-5 h-5" />}
          colorScheme="indigo"
          onClick={() => navigate('/analyzer')}
        />
        <StatCard
          label="Jobs Matched"
          value={matches.length}
          subtitle={`${matches.length} role descriptions analyzed`}
          icon={<Target className="w-5 h-5" />}
          colorScheme="cyan"
          onClick={() => navigate('/matcher')}
        />
        <StatCard
          label="Job Match Score (Avg)"
          value={matches.length > 0 ? `${avgMatchScore}%` : '0%'}
          subtitle="Across targeted positions"
          icon={<TrendingUp className="w-5 h-5" />}
          colorScheme="emerald"
          onClick={() => navigate('/matcher')}
        />
        <StatCard
          label="Skill Gaps Detected"
          value={totalSkillGaps}
          subtitle="Priority competencies to bridge"
          icon={<AlertCircle className="w-5 h-5" />}
          colorScheme="amber"
          onClick={() => navigate('/recommendations')}
        />
      </div>

      {/* Main Row: CareerFit Score Card & Target Career Card / Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Card (6 cols) */}
        <div className="lg:col-span-6">
          {latestResume ? (
            <ScoreCard
              score={resumeScore}
              breakdown={latestResume.score_breakdown}
              onViewDetails={() => navigate('/analyzer')}
            />
          ) : (
            <Card className="p-8 min-h-[300px] flex flex-col items-center justify-center text-center bg-[#19162C] border border-[#2A2548]">
              <div className="w-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-[#211D38] text-[#8B5CF6] border border-[#2A2548] rounded-2xl inline-flex items-center justify-center shadow-soft">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto flex flex-col items-center text-center">
                  <h3 className="text-base font-bold text-[#F8FAFC] text-center">No Resume Uploaded Yet</h3>
                  <p className="text-xs text-[#A5A1BA] text-center leading-relaxed">
                    Upload your PDF or DOCX resume to calculate your explainable CareerFit Score and skill breakdown.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-center">
                  <Button variant="primary" size="md" onClick={() => navigate('/analyzer')}>
                    Analyze My Resume
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Target Career Card (6 cols) */}
        <div className="lg:col-span-6">
          {topRec ? (
            <Card className="p-6 bg-[#19162C] border border-[#2A2548] flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
                    Target Career Alignment
                  </span>
                  <Badge variant={topRec.match_percentage >= 70 ? 'emerald' : 'amber'}>
                    {topRec.match_percentage}% Fit
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#F8FAFC]">{topRec.title}</h3>
                  <p className="text-xs text-[#A5A1BA] mt-1 line-clamp-2">
                    {topRec.recommended_reason || 'Personalized match based on verified skills, projects, and coursework.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold pt-1">
                  <span className="text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                    ✓ {topRec.matched_skills.length} Matched Skills
                  </span>
                  <span className="text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                    ⚡ {topRec.missing_skills.length} Skill Gaps
                  </span>
                  <span className="text-[#A5A1BA] bg-[#211D38] border border-[#2A2548] px-2.5 py-1 rounded-xl">
                    Demand: {topRec.industry_demand}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/roadmap?role=${encodeURIComponent(topRec.title)}`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full text-xs sm:text-sm"
                >
                  View Career Roadmap for {topRec.title}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-[#19162C] border border-[#2A2548] flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A78BFA]">
                  Target Career Alignment
                </span>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Discover Your Fit</h3>
                <p className="text-xs text-[#A5A1BA] leading-relaxed">
                  Upload your resume to calculate your compatibility with tech industry roles and generate a tailored 5-milestone roadmap.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/analyzer')}>
                Upload Resume to Discover Fit
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Access Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          hoverEffect
          onClick={() => navigate('/analyzer')}
          className="p-4 cursor-pointer flex flex-col justify-between space-y-2 bg-[#19162C] border border-[#2A2548] hover:border-[#8B5CF6]/50"
        >
          <div className="p-2 bg-[#8B5CF6] text-white rounded-xl w-fit shadow-soft">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Resume Analyzer</h4>
            <p className="text-[10px] text-[#A5A1BA]">5-factor scoring</p>
          </div>
          <span className="text-[11px] font-bold text-[#A78BFA] flex items-center gap-1">
            Analyze <ArrowRight className="w-3 h-3" />
          </span>
        </Card>

        <Card
          hoverEffect
          onClick={() => navigate('/matcher')}
          className="p-4 cursor-pointer flex flex-col justify-between space-y-2 bg-[#19162C] border border-[#2A2548] hover:border-[#06b6d4]/50"
        >
          <div className="p-2 bg-accent-cyan text-white rounded-xl w-fit shadow-soft">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Job Matcher</h4>
            <p className="text-[10px] text-[#A5A1BA]">Paste job description</p>
          </div>
          <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
            Match <ArrowRight className="w-3 h-3" />
          </span>
        </Card>

        <Card
          hoverEffect
          onClick={() => navigate('/roadmap')}
          className="p-4 cursor-pointer flex flex-col justify-between space-y-2 bg-[#19162C] border border-[#2A2548] hover:border-emerald-500/50"
        >
          <div className="p-2 bg-emerald-600 text-white rounded-xl w-fit shadow-soft">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Career Roadmap</h4>
            <p className="text-[10px] text-[#A5A1BA]">5-milestone progression</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
            Explore <ArrowRight className="w-3 h-3" />
          </span>
        </Card>

        <Card
          hoverEffect
          onClick={() => navigate('/improvements')}
          className="p-4 cursor-pointer flex flex-col justify-between space-y-2 bg-[#19162C] border border-[#2A2548] hover:border-[#8B5CF6]/50"
        >
          <div className="p-2 bg-[#8B5CF6] text-white rounded-xl w-fit shadow-soft">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Resume Optimizer</h4>
            <p className="text-[10px] text-[#A5A1BA]">Action verb upgrades</p>
          </div>
          <span className="text-[11px] font-bold text-[#A78BFA] flex items-center gap-1">
            Optimize <ArrowRight className="w-3 h-3" />
          </span>
        </Card>
      </div>

      {/* AI Live Interview Performance Section (Phase 10) */}
      <Card className="p-6 bg-gradient-to-r from-[#19162C] via-[#1A1633] to-[#100E21] border border-[#2A2548] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2548]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] shadow-soft">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F8FAFC]">AI Live Interview Performance</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Interactive 3D Avatar
                </span>
              </div>
              <p className="text-xs text-[#A5A1BA]">
                Real-time voice interviews grounded in your verified resume and target roles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/live-interview')}
              leftIcon={<Video className="w-3.5 h-3.5" />}
              className="text-xs shadow-[0_0_16px_rgba(139,92,246,0.35)]"
            >
              Practice AI Interview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#211D38] border border-[#2A2548]">
            <span className="text-[11px] font-bold text-[#A5A1BA] uppercase">Latest Interview Score</span>
            <div className="text-2xl font-black text-[#F8FAFC] mt-1">
              {interviewStats?.latest_score !== null && interviewStats?.latest_score !== undefined
                ? `${Math.round(interviewStats.latest_score)}%`
                : '—'}
            </div>
            <p className="text-[10px] text-[#A5A1BA] mt-0.5">Overall candidate readiness</p>
          </div>

          <div className="p-4 rounded-xl bg-[#211D38] border border-[#2A2548]">
            <span className="text-[11px] font-bold text-[#A5A1BA] uppercase">Total Completed</span>
            <div className="text-2xl font-black text-[#F8FAFC] mt-1">
              {interviewStats?.total_interviews || 0}
            </div>
            <p className="text-[10px] text-[#A5A1BA] mt-0.5">Mock interview sessions</p>
          </div>

          <div className="p-4 rounded-xl bg-[#211D38] border border-[#2A2548]">
            <span className="text-[11px] font-bold text-[#A5A1BA] uppercase">Average Performance</span>
            <div className="text-2xl font-black text-[#A78BFA] mt-1">
              {interviewStats?.average_score ? `${Math.round(interviewStats.average_score)}%` : '—'}
            </div>
            <p className="text-[10px] text-[#A5A1BA] mt-0.5">Across all completed attempts</p>
          </div>

          <div className="p-4 rounded-xl bg-[#211D38] border border-[#2A2548]">
            <span className="text-[11px] font-bold text-[#A5A1BA] uppercase">Technical Baseline</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {interviewStats?.technical_avg ? `${Math.round(interviewStats.technical_avg)}%` : '—'}
            </div>
            <p className="text-[10px] text-[#A5A1BA] mt-0.5">Technical terminology depth</p>
          </div>
        </div>
      </Card>

      {/* Skills Overview Section */}
      <Card className="p-6 space-y-6 bg-[#19162C] border border-[#2A2548]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2548]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Extracted Competencies</span>
            <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              Skill Profile Overview ({skills.length} detected)
            </h3>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#8B5CF6] text-white shadow-soft-sm'
                    : 'bg-[#211D38] text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#2A2548]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((sk) => (
              <div
                key={sk.name}
                className="p-3.5 rounded-2xl bg-[#211D38] border border-[#2A2548] space-y-2 hover:border-[#8B5CF6]/50 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#F8FAFC]">{sk.name}</span>
                  <Badge variant="slate" size="sm">{sk.category}</Badge>
                </div>
                <ProgressBar
                  value={sk.proficiency_score}
                  height="sm"
                  color="brand"
                  showPercentage
                  subValue={`${Math.round(sk.proficiency_score)}% Proficiency`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#A5A1BA] py-6 text-center">
            {latestResume ? 'No skills match the selected filter category.' : 'Upload your resume to extract and visualize your technical skills.'}
          </p>
        )}
      </Card>

      {/* Two Column Layout: Recommended Roles & Career Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommended Roles (6 cols) */}
        <div className="lg:col-span-6">
          <Card className="p-6 space-y-5 h-full flex flex-col justify-between bg-[#19162C] border border-[#2A2548]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Target Alignment</span>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Recommended Career Roles</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/recommendations')}>
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => navigate('/recommendations')}
                      className="p-4 rounded-2xl border border-[#2A2548] bg-[#211D38] hover:bg-[#2A2548] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#F8FAFC]">{role.title}</h4>
                          <Badge variant={role.match_percentage >= 60 ? 'emerald' : 'amber'} size="sm">
                            {role.match_percentage}% Match
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#A5A1BA] truncate">{role.recommended_reason}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#A5A1BA]" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#A5A1BA] py-4 text-center">Upload resume to view career role alignment.</p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/roadmap')}
              rightIcon={<Compass className="w-4 h-4" />}
              className="w-full mt-2"
            >
              Generate Role Roadmap
            </Button>
          </Card>
        </div>

        {/* Career Progress Area Chart (6 cols) */}
        <div className="lg:col-span-6">
          <Card className="p-6 space-y-4 h-full bg-[#19162C] border border-[#2A2548]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Progress Tracker</span>
              <h3 className="text-base font-bold text-[#F8FAFC]">Resume Score Progression</h3>
            </div>

            {progression.length > 1 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progression}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2548" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#A5A1BA' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#A5A1BA' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#19162C',
                        borderRadius: '12px',
                        border: '1px solid #2A2548',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-4 bg-[#211D38] rounded-2xl border border-dashed border-[#2A2548]">
                <TrendingUp className="w-8 h-8 text-[#8B5CF6] mb-2" />
                <p className="text-xs font-semibold text-[#F8FAFC]">Historical Trend Initializing</p>
                <p className="text-[11px] text-[#A5A1BA] max-w-xs mt-0.5">
                  As you re-upload polished resumes and run job matches, your score growth timeline will plot here.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <Card className="p-6 space-y-4 bg-[#19162C] border border-[#2A2548]">
        <div className="flex justify-between items-center pb-3 border-b border-[#2A2548]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Activity History</span>
            <h3 className="text-base font-bold text-[#F8FAFC]">Recent Career Actions</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            View History
          </Button>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-[#2A2548]">
            {history.map((h) => (
              <div key={h.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#211D38] text-[#8B5CF6] border border-[#2A2548]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#F8FAFC]">{h.title}</h5>
                    <p className="text-[11px] text-[#A5A1BA]">{h.summary}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#A78BFA] block">{h.score_value} pts</span>
                  <span className="text-[10px] text-[#A5A1BA] font-medium">
                    {new Date(h.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#A5A1BA] py-4 text-center">No recent activity recorded yet.</p>
        )}
      </Card>
    </div>
  );
};
