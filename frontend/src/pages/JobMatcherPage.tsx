import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Building2,
  Briefcase,
  Compass,
  FileText,
  Check,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressRing } from '../components/common/ProgressRing';
import { SkillChip } from '../components/common/SkillChip';
import { Modal } from '../components/common/Modal';
import { jobService } from '../services/jobService';
import { resumeService } from '../services/resumeService';
import { JobMatchResult, ResumeAnalysis } from '../types';
import confetti from 'canvas-confetti';

const JOB_TEMPLATES = [
  {
    title: 'Junior AI & ML Engineer',
    company: 'DeepTech Innovations',
    description: `We are looking for an ambitious Junior AI & Machine Learning Engineer to build and deploy intelligent models.
Required Skills: Python, PyTorch, Scikit-Learn, Machine Learning, Deep Learning, SQL, Docker, FastAPI.
Preferred: Natural Language Processing, Git, Linux.
Responsibilities: Design and fine-tune machine learning architectures, optimize inference pipelines, and integrate models into production APIs.`,
  },
  {
    title: 'Full Stack Software Engineer',
    company: 'CloudScale SaaS',
    description: `Seeking a motivated Full Stack Developer to engineer modern web applications.
Required: JavaScript, TypeScript, React, Node.js, PostgreSQL, Tailwind CSS, REST API, Git.
Preferred: Docker, Next.js, Redis.
Responsibilities: Develop responsive user interfaces with React and build scalable backend microservices.`,
  },
  {
    title: 'Cloud & DevOps Engineer',
    company: 'NextGen Infra',
    description: `Hiring an entry-level DevOps Engineer to maintain cloud infrastructure and CI/CD pipelines.
Required: Docker, Kubernetes, AWS, Linux, CI/CD, Shell/Bash, Git.
Preferred: Python, Terraform, PostgreSQL.
Responsibilities: Automate container builds, deploy Kubernetes clusters, and monitor production uptime.`,
  },
];

export const JobMatcherPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('Junior AI & ML Engineer');
  const [company, setCompany] = useState('Tech Solutions');
  const [description, setDescription] = useState(JOB_TEMPLATES[0].description);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);

  // Multiple Resume support: allow student to choose which resume to evaluate
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true);
        const list = await resumeService.getResumes();
        setResumes(list);
        if (list.length > 0) {
          const defaultRes = list.find((r) => r.is_default) || list[0];
          setSelectedResumeId(defaultRes.id);
        }
      } catch (err) {
        console.error('Failed to load candidate resumes:', err);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, []);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.length < 20) {
      setError('Please provide a complete job description (minimum 20 characters).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await jobService.instantMatch({
        title,
        company,
        description,
        resume_id: selectedResumeId || undefined,
      });
      setMatchResult(res);

      if (res.overall_match_score >= 80) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate job match. Please ensure you have uploaded a resume first.');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: typeof JOB_TEMPLATES[0]) => {
    setTitle(template.title);
    setCompany(template.company);
    setDescription(template.description);
    setMatchResult(null);
  };

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="cyan" icon={<Target className="w-3.5 h-3.5" />}>
            Explainable Job Matching Engine
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
            Job Matcher & Skill Gap Analysis
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A1BA]">
            Select your resume and paste any job description to calculate semantic fit, matched competencies, and missing skill gaps.
          </p>
        </div>

        {matchResult && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExplainModalOpen(true)}
              leftIcon={<HelpCircle className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Explain Match Score
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(
                  `/interview-prep?role=${encodeURIComponent(matchResult.job_title)}&company=${encodeURIComponent(
                    matchResult.company || ''
                  )}&resume_id=${matchResult.resume_id}`
                )
              }
              rightIcon={<Sparkles className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Prepare for Interview
            </Button>
          </div>
        )}
      </div>

      {/* Input Section Card */}
      <Card id="tour-matcher-form" className="p-6 sm:p-7 space-y-6 sm:space-y-7 bg-[#19162C] border border-[#2A2548]">
        {/* Resume Selection Selector (Task 3 integration) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#211D38] border border-[#2A2548] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#8B5CF6]" />
              Select Resume for this Analysis:
            </span>
            <span className="text-[11px] text-[#A5A1BA]">
              {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} in your library
            </span>
          </div>

          {loadingResumes ? (
            <div className="text-xs text-[#A5A1BA] py-3">Loading candidate resumes...</div>
          ) : resumes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {resumes.map((r) => {
                const isSelected = selectedResumeId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedResumeId(r.id);
                      setMatchResult(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 min-h-[58px] ${
                      isSelected
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#F8FAFC] shadow-soft-sm'
                        : 'bg-[#19162C] border-[#2A2548] text-[#A5A1BA] hover:bg-[#2A2548]/70 hover:text-[#F8FAFC]'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#A78BFA]' : 'text-[#A5A1BA]'}`} />
                        <span className="text-xs font-bold truncate">{r.filename}</span>
                        {r.is_default && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#A78BFA] bg-[#8B5CF6]/20 px-1.5 py-0.2 rounded flex-shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#A5A1BA] truncate">
                        Score: {Math.round(r.total_score)} pts • {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white' : 'border-[#2A2548]'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3.5 bg-[#19162C] rounded-xl border border-[#2A2548] flex items-center justify-between text-xs">
              <span className="text-[#A5A1BA]">No resumes uploaded yet. Upload one to begin matching.</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/analyzer')}>
                Upload Resume
              </Button>
            </div>
          )}
        </div>

        {/* Quick Test Templates */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-5 sm:pb-6 border-b border-[#2A2548]">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
            <span className="text-xs font-bold text-[#F8FAFC]">Quick Test Templates:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {JOB_TEMPLATES.map((t) => {
              const isSelected = title === t.title;
              return (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 select-none ${
                    isSelected
                      ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-soft font-bold'
                      : 'bg-[#211D38] border-[#2A2548] text-[#A5A1BA] hover:bg-[#2A2548] hover:text-[#F8FAFC] hover:border-[#8B5CF6]/50'
                  }`}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleMatch} className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#F8FAFC]">
                Target Job Title <span className="text-rose-400">*</span>
              </label>
              <div className="relative flex items-center">
                <Briefcase className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Junior AI Engineer"
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] placeholder-[#A5A1BA]/50 rounded-xl focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#F8FAFC]">
                Company Name <span className="text-[11px] font-normal text-[#A5A1BA]">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. DeepTech Innovations"
                  className="w-full h-11 pl-10 pr-4 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] placeholder-[#A5A1BA]/50 rounded-xl focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-bold text-[#F8FAFC]">
                Job Description & Requirements <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-[#A5A1BA]">
                Include core responsibilities & technical qualifications
              </span>
            </div>
            <textarea
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the job description, required skills, frameworks, and qualifications here..."
              className="w-full p-4 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] placeholder-[#A5A1BA]/50 rounded-2xl focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors leading-relaxed font-mono"
              required
            />
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-[#A5A1BA]">
              Matches across 4 weighted factors: Skills, Experience, Projects, and Semantic Similarity.
            </p>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              isLoading={loading}
              rightIcon={<Sparkles className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Calculate Explainable Match Score
            </Button>
          </div>
        </form>
      </Card>

      {/* Match Results Display with Perfect Alignments */}
      {matchResult && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Match Score Banner (Items Stretch for Consistent Height) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Score Ring Card (Centered & Well-Spaced) */}
            <div className="lg:col-span-5">
              <Card className="h-full flex flex-col justify-between items-center text-center p-6 sm:p-8 bg-[#19162C] border border-[#2A2548]">
                {/* Top Label */}
                <div className="w-full text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A5A1BA] block">
                    Job Match Compatibility
                  </span>
                </div>

                {/* Circular Score Ring - Center Aligned */}
                <div className="my-4 flex items-center justify-center w-full">
                  <ProgressRing
                    score={matchResult.overall_match_score}
                    size={160}
                    strokeWidth={14}
                    sublabel="Match Fit"
                  />
                </div>

                {/* Target Title, Company & Status Badge */}
                <div className="space-y-2 w-full text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant={
                        matchResult.overall_match_score >= 80
                          ? 'emerald'
                          : matchResult.overall_match_score >= 60
                          ? 'indigo'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {matchResult.overall_match_score >= 80
                        ? 'Placement Ready'
                        : matchResult.overall_match_score >= 60
                        ? 'Competitive Profile'
                        : 'Bridge Gaps Required'}
                    </Badge>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#F8FAFC] tracking-tight">
                    {matchResult.job_title}
                  </h3>
                  <p className="text-xs font-semibold text-[#A5A1BA] flex items-center justify-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#A78BFA]" />
                    {matchResult.company || 'Target Company'}
                  </p>

                  {selectedResume && (
                    <div className="pt-1">
                      <span className="text-[10px] text-[#A5A1BA] bg-[#211D38] border border-[#2A2548] px-2.5 py-0.5 rounded-full inline-block truncate max-w-[240px]">
                        Resume: {selectedResume.filename}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="w-full pt-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExplainModalOpen(true)}
                    leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    View Score Components
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/interview-prep?role=${encodeURIComponent(matchResult.job_title)}&company=${encodeURIComponent(
                          matchResult.company || ''
                        )}&resume_id=${matchResult.resume_id}`
                      )
                    }
                    rightIcon={<Compass className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    Prepare for Interview →
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Metric Summary Column */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <Card className="h-full flex flex-col justify-between p-6 space-y-4 bg-[#19162C] border border-[#2A2548]">
                {/* Header Aligned */}
                <div className="flex items-center justify-between pb-3 border-b border-[#2A2548]">
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#8B5CF6]" />
                    Analysis Summary & Diagnostics
                  </h4>
                  <span className="text-[11px] font-bold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded-full">
                    4-Factor Evaluation
                  </span>
                </div>

                {/* Summary Text Box */}
                <p className="text-xs text-[#A5A1BA] leading-relaxed bg-[#211D38] p-4 rounded-xl border border-[#2A2548]">
                  {matchResult.summary}
                </p>

                {/* 4 Factor Quick Breakdown: Equal Height and Uniform Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="h-full min-h-[84px] flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-emerald-300 leading-none">
                      {matchResult.skill_match_score}%
                    </p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-1.5">
                      Skills Match
                    </p>
                  </div>
                  <div className="h-full min-h-[84px] flex flex-col items-center justify-center p-3 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-[#A78BFA] leading-none">
                      {matchResult.experience_match_score}%
                    </p>
                    <p className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider mt-1.5">
                      Experience
                    </p>
                  </div>
                  <div className="h-full min-h-[84px] flex flex-col items-center justify-center p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-cyan-300 leading-none">
                      {matchResult.project_match_score}%
                    </p>
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mt-1.5">
                      Projects
                    </p>
                  </div>
                  <div className="h-full min-h-[84px] flex flex-col items-center justify-center p-3 rounded-xl border border-purple-500/30 bg-purple-500/15 text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-purple-300 leading-none">
                      {matchResult.keyword_similarity_score}%
                    </p>
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-1.5">
                      TF-IDF Sim
                    </p>
                  </div>
                </div>
              </Card>

              {/* Actionable Recommendations (Clean Bullet Alignment) */}
              {matchResult.recommendations.length > 0 && (
                <Card className="p-5 space-y-3 bg-[#211D38] border border-[#2A2548]">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#2A2548]">
                    <Sparkles className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                    <span className="text-xs font-bold text-[#F8FAFC]">
                      Recommended Next Steps for this Role:
                    </span>
                  </div>
                  <ul className="text-xs space-y-2">
                    {matchResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2.5 leading-relaxed text-[#A5A1BA]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-1.5 flex-shrink-0" />
                        <span className="text-[#F8FAFC]">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>

          {/* 3 Skill Columns: Equal Height & Proper Content Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Matched Skills */}
            <Card className="h-full flex flex-col justify-between p-6 space-y-4 border-emerald-500/25 bg-emerald-500/10">
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/25">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-emerald-300">
                      Matched Skills ({matchResult.matched_skills_count})
                    </h4>
                  </div>
                  <Badge variant="emerald" size="sm">Verified</Badge>
                </div>

                <div className="flex-1 flex flex-wrap gap-2 items-start content-start pt-1">
                  {matchResult.matched_skills.length > 0 ? (
                    matchResult.matched_skills.map((sk) => (
                      <SkillChip
                        key={sk.skill_name}
                        name={sk.skill_name}
                        category={sk.category}
                        matchType="matched"
                      />
                    ))
                  ) : (
                    <p className="text-xs text-[#A5A1BA] py-6 text-center w-full">
                      No direct required skills matched yet.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Partial Skills */}
            <Card className="h-full flex flex-col justify-between p-6 space-y-4 border-amber-500/25 bg-amber-500/10">
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/25">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-amber-300">
                      Partial Overlap ({matchResult.partial_skills_count})
                    </h4>
                  </div>
                  <Badge variant="amber" size="sm">Adjacent</Badge>
                </div>

                <div className="flex-1 flex flex-wrap gap-2 items-start content-start pt-1">
                  {matchResult.partial_skills.length > 0 ? (
                    matchResult.partial_skills.map((sk) => (
                      <SkillChip
                        key={sk.skill_name}
                        name={sk.skill_name}
                        category={sk.category}
                        matchType="partial"
                      />
                    ))
                  ) : (
                    <p className="text-xs text-[#A5A1BA] py-6 text-center w-full">
                      No adjacent skill foundations detected.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Missing Skills */}
            <Card className="h-full flex flex-col justify-between p-6 space-y-4 border-rose-500/25 bg-rose-500/10">
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-rose-500/25">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-rose-300">
                      Missing Skill Gaps ({matchResult.missing_skills_count})
                    </h4>
                  </div>
                  <Badge variant="rose" size="sm">Bridge Gap</Badge>
                </div>

                <div className="flex-1 flex flex-wrap gap-2 items-start content-start pt-1">
                  {matchResult.missing_skills.length > 0 ? (
                    matchResult.missing_skills.map((sk) => (
                      <SkillChip
                        key={sk.skill_name}
                        name={sk.skill_name}
                        category={sk.category}
                        matchType="missing"
                      />
                    ))
                  ) : (
                    <p className="text-xs text-emerald-300 py-6 font-semibold text-center w-full">
                      Zero skill gaps! You satisfy all role competencies.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Explainable Match Scoring Breakdown Modal */}
      <Modal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        title="Explainable Job Match Calculation"
        subtitle="Mathematical factor distribution for role compatibility"
      >
        <div className="space-y-4 text-xs text-[#A5A1BA]">
          <div className="p-3 bg-[#211D38] text-[#A78BFA] rounded-xl font-mono text-[11px] border border-[#2A2548]">
            Total Match = 50%(Skills) + 20%(Experience) + 15%(Projects) + 15%(TF-IDF Similarity)
          </div>

          <div className="space-y-3">
            {matchResult?.score_components.map((comp, idx) => (
              <div key={idx} className="border-b border-[#2A2548] pb-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#F8FAFC]">{comp.name}</span>
                  <span className="font-extrabold text-[#A78BFA]">
                    {comp.weighted_points} pts ({Math.round(comp.weight * 100)}% weight)
                  </span>
                </div>
                <p className="text-[#A5A1BA]">{comp.description}</p>
                {comp.breakdown_details?.length > 0 && (
                  <p className="text-[11px] text-[#A5A1BA]/70 mt-0.5">{comp.breakdown_details.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
