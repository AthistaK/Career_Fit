import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Circle,
  Briefcase,
  Building,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Award,
  AlertTriangle,
  Lightbulb,
  Layers,
  HelpCircle,
  Video,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';
import { interviewService } from '../services/interviewService';
import { resumeService } from '../services/resumeService';
import {
  InterviewPrepSession,
  ResumeAnalysis,
} from '../types';

export const InterviewPrepPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL query params if linked from Job Matcher
  const urlRole = searchParams.get('role') || '';
  const urlCompany = searchParams.get('company') || '';
  const urlResumeId = searchParams.get('resume_id');

  // State
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [sessions, setSessions] = useState<InterviewPrepSession[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewPrepSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active view tab: 'PREP' | 'NEW' | 'SESSIONS'
  const [activeTab, setActiveTab] = useState<'PREP' | 'NEW' | 'SESSIONS'>(
    urlRole ? 'NEW' : 'PREP'
  );

  // Form inputs for generating prep
  const [selectedResumeId, setSelectedResumeId] = useState<number | undefined>(
    urlResumeId ? parseInt(urlResumeId, 10) : undefined
  );
  const [targetRole, setTargetRole] = useState(urlRole);
  const [targetCompany, setTargetCompany] = useState(urlCompany);
  const [jobDescription, setJobDescription] = useState('');

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PREPARED' | 'UNPREPARED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete modal state
  const [sessionToDelete, setSessionToDelete] = useState<InterviewPrepSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Popular role quick presets
  const popularRoles = [
    'Full Stack Developer',
    'Frontend Engineer',
    'Backend Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Cloud Solutions Architect',
  ];

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resList, sessionList] = await Promise.all([
          resumeService.getResumes().catch(() => []),
          interviewService.getSessions().catch(() => []),
        ]);

        setResumes(resList);
        setSessions(sessionList);

        // Pre-select resume
        if (urlResumeId) {
          setSelectedResumeId(parseInt(urlResumeId, 10));
        } else if (resList.length > 0) {
          const defaultRes = resList.find((r) => r.is_default) || resList[0];
          setSelectedResumeId(defaultRes.id);
        }

        // Set active session
        if (sessionList.length > 0 && !urlRole) {
          setActiveSession(sessionList[0]);
          // Expand first 2 questions by default
          if (sessionList[0].questions?.length > 0) {
            setExpandedQuestionIds(
              new Set(sessionList[0].questions.slice(0, 2).map((q) => q.id))
            );
          }
          setActiveTab('PREP');
        } else if (urlRole) {
          setActiveTab('NEW');
        } else {
          setActiveTab('NEW');
        }
      } catch (err) {
        console.error('Failed to load initial interview prep data:', err);
        setError('Failed to load interview preparation sessions.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [urlRole, urlResumeId]);

  // Handle generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      setError('Please provide a target job role.');
      return;
    }
    if (!selectedResumeId && resumes.length === 0) {
      setError('Please upload a resume first before generating interview preparation.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const newSession = await interviewService.generatePrep({
        resume_id: selectedResumeId,
        job_title: targetRole.trim(),
        company: targetCompany.trim() || undefined,
        job_description:
          jobDescription.trim() ||
          `Target role: ${targetRole.trim()} at ${targetCompany.trim() || 'target enterprise'}. Core skills required: Modern architecture, robust problem solving, and effective engineering collaboration.`,
      });

      // Update session list and make new session active
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setActiveTab('PREP');

      // Expand first 2 questions
      if (newSession.questions?.length > 0) {
        setExpandedQuestionIds(
          new Set(newSession.questions.slice(0, 2).map((q) => q.id))
        );
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(
        err.response?.data?.detail || 'Failed to generate personalized interview questions.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle prepared status
  const handleTogglePrepared = async (questionId: string, currentStatus: boolean) => {
    if (!activeSession) return;
    const newStatus = !currentStatus;

    // Optimistic UI update
    const updatedQuestions = activeSession.questions.map((q) =>
      q.id === questionId ? { ...q, is_prepared: newStatus } : q
    );
    const newPreparedCount = updatedQuestions.filter((q) => q.is_prepared).length;

    const updatedSession = {
      ...activeSession,
      questions: updatedQuestions,
      prepared_count: newPreparedCount,
    };

    setActiveSession(updatedSession);
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );

    try {
      await interviewService.togglePrepared(activeSession.id, questionId, newStatus);
    } catch (err) {
      console.error('Failed to update prepared status on server:', err);
      // Rollback on failure
      setActiveSession(activeSession);
    }
  };

  // Toggle question accordion expansion
  const toggleExpand = (questionId: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Expand / collapse all questions
  const expandAll = () => {
    if (!activeSession) return;
    setExpandedQuestionIds(new Set(activeSession.questions.map((q) => q.id)));
  };

  const collapseAll = () => {
    setExpandedQuestionIds(new Set());
  };

  // Copy text helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete session handler
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      setIsDeleting(true);
      await interviewService.deleteSession(sessionToDelete.id);

      const remaining = sessions.filter((s) => s.id !== sessionToDelete.id);
      setSessions(remaining);

      if (activeSession?.id === sessionToDelete.id) {
        if (remaining.length > 0) {
          setActiveSession(remaining[0]);
          setActiveTab('PREP');
        } else {
          setActiveSession(null);
          setActiveTab('NEW');
        }
      }
      setSessionToDelete(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete interview preparation session.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Categories extraction
  const categories = useMemo(() => {
    if (!activeSession) return ['ALL'];
    const cats = Array.from(new Set(activeSession.questions.map((q) => q.category)));
    return ['ALL', ...cats];
  }, [activeSession]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (!activeSession) return [];

    return activeSession.questions.filter((q) => {
      // Category filter
      if (selectedCategory !== 'ALL' && q.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'PREPARED' && !q.is_prepared) {
        return false;
      }
      if (statusFilter === 'UNPREPARED' && q.is_prepared) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuestion = q.question.toLowerCase().includes(query);
        const matchesAnswer = q.suggested_answer.toLowerCase().includes(query);
        const matchesWhy = q.why_asked.toLowerCase().includes(query);
        const matchesPoints = q.important_points?.some((p) =>
          p.toLowerCase().includes(query)
        );
        return matchesQuestion || matchesAnswer || matchesWhy || matchesPoints;
      }
      return true;
    });
  }, [activeSession, selectedCategory, statusFilter, searchQuery]);

  // Helper badge color for category
  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'Resume & Projects':
        return 'violet';
      case 'Technical Core':
        return 'cyan';
      case 'Job-Specific':
        return 'amber';
      case 'HR & Behavioral':
        return 'emerald';
      case 'Scenario & Problem Solving':
        return 'purple';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <LoadingState
        message="Loading Interview Preparation Intelligence..."
        subMessage="Retrieving your interview sessions, personalized answers, and candidate project groundings"
      />
    );
  }

  return (
    <div className="space-y-8 pb-14 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            Interview Preparation
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A1BA] mt-1 max-w-2xl">
            Prepare for your next interview with questions based on your resume and selected job role.
          </p>
        </div>

        {/* Top Action Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            variant={activeTab === 'PREP' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('PREP')}
            disabled={!activeSession}
            leftIcon={<BookOpen className="w-4 h-4" />}
          >
            Active Prep
          </Button>
          <Button
            variant={activeTab === 'NEW' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('NEW')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Role Prep
          </Button>
          <Button
            variant={activeTab === 'SESSIONS' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('SESSIONS')}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Saved Sessions ({sessions.length})
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 font-bold ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================
          TAB 1: NEW ROLE PREP GENERATOR
      ======================================================== */}
      {activeTab === 'NEW' && (
        <Card id="tour-interview-prep" className="p-6 sm:p-8 bg-[#19162C] border border-[#2A2548] space-y-6">
          <div className="border-b border-[#2A2548] pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                Generate Personalized Interview Preparation
              </h2>
              <p className="text-xs text-[#A5A1BA] mt-0.5">
                Our intelligence engine extracts your actual projects, tech stack, and experience,
                matching them against the job description to generate targeted questions with STAR answers.
              </p>
            </div>
            {activeSession && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('PREP')}
                className="text-xs"
              >
                Back to Active Session →
              </Button>
            )}
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resume Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#F8FAFC]">
                  Select Grounding Resume:
                </label>
                {resumes.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs text-[#A5A1BA] flex items-center justify-between">
                    <span>No uploaded resumes found.</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/analyzer')}
                      className="text-xs"
                    >
                      Upload Resume
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                    className="w-full bg-[#211D38] border border-[#2A2548] rounded-xl px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename} (CareerFit: {r.total_score}%)
                        {r.is_default ? ' [Default]' : ''}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-[#A5A1BA]">
                  Questions will reference the projects and achievements parsed from this resume.
                </p>
              </div>

              {/* Target Company */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#F8FAFC]">
                  Target Company / Organization (Optional):
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, Microsoft, or Stealth Startup"
                    className="w-full bg-[#211D38] border border-[#2A2548] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#A5A1BA]/50 focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#A5A1BA]">
                  Helps calibrate company culture and engineering scope.
                </p>
              </div>
            </div>

            {/* Target Role Input + Preset Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#F8FAFC]">
                Target Job Role / Position <span className="text-rose-400">*</span>:
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, Backend Software Engineer"
                  className="w-full bg-[#211D38] border border-[#2A2548] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#A5A1BA]/50 focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>

              {/* Quick Role Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-[#A5A1BA] mr-1">Popular Roles:</span>
                {popularRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      targetRole === role
                        ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white font-bold'
                        : 'bg-[#211D38] border-[#2A2548] text-[#A5A1BA] hover:text-[#F8FAFC] hover:border-[#8B5CF6]/50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#F8FAFC]">
                  Job Description / Requirements (Optional but Recommended):
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setJobDescription(
                      `Role: ${targetRole || 'Software Engineer'}\nKey Requirements:\n- Build robust web services using React, TypeScript, Python, or Go\n- Experience with relational databases (PostgreSQL/MySQL) and RESTful API design\n- Good understanding of Git version control, CI/CD, and automated unit testing\n- Strong problem-solving skills and clean code practices`
                    )
                  }
                  className="text-[11px] font-semibold text-[#A78BFA] hover:text-white transition-colors"
                >
                  + Insert Sample JD Template
                </button>
              </div>
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description or key responsibilities here. The AI will cross-reference candidate skills against JD requirements to formulate targeted questions and bridge skill gaps."
                className="w-full bg-[#211D38] border border-[#2A2548] rounded-xl p-3.5 text-xs text-[#F8FAFC] placeholder-[#A5A1BA]/50 focus:outline-none focus:border-[#8B5CF6] transition-colors font-mono leading-relaxed"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-[#A5A1BA]">
                No live video or audio recorded. Generates structured answers grounded in your real qualifications.
              </p>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isGenerating || resumes.length === 0}
                leftIcon={isGenerating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {isGenerating
                  ? 'Generating Personalized Preparation...'
                  : 'Generate Interview Prep →'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ========================================================
          TAB 2: SAVED SESSIONS LIST
      ======================================================== */}
      {activeTab === 'SESSIONS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8B5CF6]" />
              Saved Interview Preparation Sessions ({sessions.length})
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('NEW')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Role Prep
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-12 text-center space-y-4 bg-[#19162C] border border-[#2A2548]">
              <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center mx-auto text-[#A78BFA]">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F8FAFC]">No Saved Sessions Yet</h3>
                <p className="text-xs text-[#A5A1BA] max-w-md mx-auto">
                  Generate your first personalized interview prep session for your target company or job role.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('NEW')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Prep Session
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessions.map((sess) => {
                const percent =
                  sess.total_questions > 0
                    ? Math.round((sess.prepared_count / sess.total_questions) * 100)
                    : 0;

                const isCurrent = activeSession?.id === sess.id;

                return (
                  <Card
                    key={sess.id}
                    className={`p-5 flex flex-col justify-between space-y-4 transition-all duration-200 ${
                      isCurrent
                        ? 'border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.2)] bg-[#19162C]'
                        : 'border-[#2A2548] bg-[#19162C] hover:border-[#8B5CF6]/50'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="violet" size="sm">
                          {sess.company || 'Enterprise Role'}
                        </Badge>
                        <span className="text-[10px] text-[#A5A1BA]">
                          {new Date(sess.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[#F8FAFC] truncate">
                          {sess.job_title}
                        </h3>
                        <p className="text-[11px] text-[#A5A1BA] mt-0.5">
                          {sess.total_questions} Personalized Questions
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-[#A5A1BA]">Preparation Progress</span>
                          <span className="text-[#A78BFA] font-bold">
                            {sess.prepared_count} / {sess.total_questions} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#211D38] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#2A2548] flex items-center justify-between gap-2">
                      <Button
                        variant={isCurrent ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => {
                          setActiveSession(sess);
                          setActiveTab('PREP');
                        }}
                        className="text-xs flex-1"
                      >
                        {isCurrent ? 'Continue Practicing' : 'Open Prep Session'}
                      </Button>
                      <button
                        onClick={() => setSessionToDelete(sess)}
                        className="p-2 rounded-xl text-[#A5A1BA] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: ACTIVE PREPARATION VIEW
      ======================================================== */}
      {activeTab === 'PREP' && activeSession && (
        <div className="space-y-6">
          {/* Top Session Hero Card */}
          <Card id="tour-interview-prep" className="p-6 bg-[#19162C] border border-[#2A2548] space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#2A2548]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="violet" icon={<Briefcase className="w-3.5 h-3.5" />}>
                    {activeSession.job_title}
                  </Badge>
                  {activeSession.company && (
                    <span className="text-xs font-bold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded-full">
                      @{activeSession.company}
                    </span>
                  )}
                  <span className="text-[11px] text-[#A5A1BA]">
                    Session #{activeSession.id} • Created {new Date(activeSession.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
                  Interview Readiness Strategy
                </h2>
              </div>

              {/* Progress Box & Live Mock Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start lg:self-auto">
                <Button
                  id="tour-live-interview-btn"
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/live-interview')}
                  leftIcon={<Video className="w-3.5 h-3.5" />}
                  className="text-xs shadow-[0_0_16px_rgba(139,92,246,0.35)]"
                >
                  Live Mock Interview with AI
                </Button>

                <div className="flex items-center gap-4 bg-[#211D38] p-3 rounded-2xl border border-[#2A2548]">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#A5A1BA] uppercase tracking-wider">
                      Prepared Questions
                    </p>
                    <p className="text-base font-extrabold text-[#F8FAFC]">
                      <span className="text-[#A78BFA]">{activeSession.prepared_count}</span> /{' '}
                      {activeSession.total_questions}{' '}
                      <span className="text-xs font-semibold text-[#A5A1BA]">
                        (
                        {activeSession.total_questions > 0
                          ? Math.round(
                              (activeSession.prepared_count / activeSession.total_questions) * 100
                            )
                          : 0}
                        %)
                      </span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] font-black text-xs">
                    {activeSession.total_questions > 0
                      ? `${Math.round(
                          (activeSession.prepared_count / activeSession.total_questions) * 100
                        )}%`
                      : '0%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Insights Matrix: 4 Equal Height Diagnostic Strategy Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {/* Card 1: Topics to Revise */}
              <div className="h-full flex flex-col justify-start p-5 rounded-2xl bg-[#211D38] border border-[#2A2548]">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs pb-2 border-b border-[#2A2548]">
                  <BookOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Topics to Revise</span>
                </div>
                <ul className="text-xs space-y-2 text-[#F8FAFC] pt-3">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span>Teamwork</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span>Problem Solving</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span>Technical Skills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span>Project Knowledge</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Your Strengths */}
              <div className="h-full flex flex-col justify-start p-5 rounded-2xl bg-[#211D38] border border-[#2A2548]">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs pb-2 border-b border-[#2A2548]">
                  <Award className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Your Strengths</span>
                </div>
                <ul className="text-xs space-y-2 text-[#F8FAFC] pt-3">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span>Practical project experience</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span>Technical skills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span>Problem-solving ability</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: What to Improve */}
              <div className="h-full flex flex-col justify-start p-5 rounded-2xl bg-[#211D38] border border-[#2A2548]">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs pb-2 border-b border-[#2A2548]">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>What to Improve</span>
                </div>
                <ul className="text-xs space-y-2 text-[#F8FAFC] pt-3">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>Explain projects clearly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>Prepare real project examples</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>Practice technical questions</span>
                  </li>
                </ul>
              </div>

              {/* Card 4: Answering Tips */}
              <div className="h-full flex flex-col justify-start p-5 rounded-2xl bg-[#211D38] border border-[#2A2548]">
                <div className="flex items-center gap-2 text-[#A78BFA] font-bold text-xs pb-2 border-b border-[#2A2548]">
                  <Lightbulb className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                  <span>Answering Tips</span>
                </div>
                <ul className="text-xs space-y-2 text-[#F8FAFC] pt-3">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#A78BFA] min-w-[56px]">Situation</span>
                    <span className="text-[#A5A1BA]">– Explain the situation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#A78BFA] min-w-[56px]">Task</span>
                    <span className="text-[#A5A1BA]">– Describe your responsibility.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#A78BFA] min-w-[56px]">Action</span>
                    <span className="text-[#A5A1BA]">– Explain what you did.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-[#A78BFA] min-w-[56px]">Result</span>
                    <span className="text-[#A5A1BA]">– Share the outcome.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Filtering & Search Toolbar */}
          <div className="space-y-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const count =
                  cat === 'ALL'
                    ? activeSession.questions.length
                    : activeSession.questions.filter((q) => q.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-[#8B5CF6] text-white shadow-soft font-bold'
                        : 'bg-[#19162C] text-[#A5A1BA] border border-[#2A2548] hover:text-[#F8FAFC] hover:border-[#8B5CF6]/40'
                    }`}
                  >
                    <span>{cat === 'ALL' ? 'All Questions' : cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-[#211D38] text-[#A5A1BA]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Filters: Search + Status Toggle + Expand/Collapse */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#19162C] p-3 rounded-2xl border border-[#2A2548]">
              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#A5A1BA] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter questions by keyword..."
                  className="w-full bg-[#211D38] border border-[#2A2548] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#A5A1BA]/50 focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>

              {/* Status Filter Buttons + Accordion Toggle */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                <div className="flex items-center gap-1 bg-[#211D38] p-1 rounded-xl border border-[#2A2548]">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      statusFilter === 'ALL'
                        ? 'bg-[#8B5CF6] text-white'
                        : 'text-[#A5A1BA] hover:text-[#F8FAFC]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('PREPARED')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      statusFilter === 'PREPARED'
                        ? 'bg-emerald-500 text-white'
                        : 'text-[#A5A1BA] hover:text-[#F8FAFC]'
                    }`}
                  >
                    Prepared
                  </button>
                  <button
                    onClick={() => setStatusFilter('UNPREPARED')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      statusFilter === 'UNPREPARED'
                        ? 'bg-amber-500 text-white'
                        : 'text-[#A5A1BA] hover:text-[#F8FAFC]'
                    }`}
                  >
                    Need Practice
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={expandAll}
                    className="text-[11px] px-2 py-1"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={collapseAll}
                    className="text-[11px] px-2 py-1"
                  >
                    Collapse
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Questions Accordion List */}
          {filteredQuestions.length === 0 ? (
            <Card className="p-8 text-center space-y-3 bg-[#19162C] border border-[#2A2548]">
              <HelpCircle className="w-8 h-8 text-[#A5A1BA] mx-auto" />
              <p className="text-xs font-bold text-[#F8FAFC]">No questions match current filters.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, index) => {
                const isExpanded = expandedQuestionIds.has(q.id);

                return (
                  <Card
                    key={q.id}
                    className={`transition-all duration-200 border bg-[#19162C] ${
                      q.is_prepared
                        ? 'border-emerald-500/30'
                        : 'border-[#2A2548] hover:border-[#8B5CF6]/40'
                    }`}
                  >
                    {/* Question Header Row */}
                    <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
                      <div
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <span className="w-6 h-6 rounded-lg bg-[#211D38] border border-[#2A2548] text-[#A78BFA] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={getCategoryBadgeVariant(q.category) as any}
                              size="sm"
                            >
                              {q.category}
                            </Badge>
                            {q.is_prepared && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Prepared
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] leading-snug">
                            {q.question}
                          </h3>
                        </div>
                      </div>

                      {/* Header Actions: Toggle Prepared + Expand Arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePrepared(q.id, q.is_prepared)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            q.is_prepared
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-[#211D38] border-[#2A2548] text-[#A5A1BA] hover:text-[#F8FAFC] hover:border-[#8B5CF6]'
                          }`}
                          title={q.is_prepared ? 'Mark as not prepared' : 'Mark as prepared'}
                        >
                          {q.is_prepared ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="hidden sm:inline">Ready</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4" />
                              <span className="hidden sm:inline">Mark Prepared</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleExpand(q.id)}
                          className="p-1.5 rounded-xl text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] transition-colors"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Content Details */}
                    {isExpanded && (
                      <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-[#2A2548] pt-4">
                        {/* Why Interviewer Asks This */}
                        <div className="p-3.5 rounded-xl bg-[#211D38] border border-[#2A2548] space-y-1">
                          <p className="text-[11px] font-bold text-[#A78BFA] flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Why the Interviewer Asks This:
                          </p>
                          <p className="text-xs text-[#A5A1BA] leading-relaxed">
                            {q.why_asked}
                          </p>
                        </div>

                        {/* Suggested Strategic Answer (Personalized) */}
                        <div className="p-4 rounded-xl bg-[#0B0A19] border border-[#2A2548] space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Suggested Strategic Answer (Grounded in Candidate Experience):
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCopy(q.id, q.suggested_answer)}
                              className="text-[11px] text-[#A5A1BA] hover:text-[#F8FAFC] flex items-center gap-1 transition-colors"
                            >
                              {copiedId === q.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Answer</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-[#F8FAFC] leading-relaxed font-sans">
                            {q.suggested_answer}
                          </p>
                        </div>

                        {/* Answer Structure Framework */}
                        {q.answer_structure && (
                          <div className="p-3 rounded-xl bg-[#211D38]/60 border border-[#2A2548] space-y-1">
                            <p className="text-[10px] font-bold text-[#A5A1BA] uppercase tracking-wider flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-[#8B5CF6]" />
                              Recommended Answer Structure:
                            </p>
                            <p className="text-xs text-[#A78BFA] font-mono leading-relaxed">
                              {q.answer_structure}
                            </p>
                          </div>
                        )}

                        {/* Key Points to Emphasize */}
                        {q.important_points?.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-bold text-[#A5A1BA]">
                              Important Points to Mention:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {q.important_points.map((pt, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] flex items-center gap-1.5"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                                  {pt}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        title="Delete Interview Preparation Session?"
        subtitle="This action will remove all saved practice progress for this session."
      >
        <div className="space-y-4 text-xs text-[#A5A1BA]">
          <p>
            Are you sure you want to delete the interview preparation session for{' '}
            <strong className="text-[#F8FAFC]">{sessionToDelete?.job_title}</strong>
            {sessionToDelete?.company ? ` at ${sessionToDelete.company}` : ''}?
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
            Your underlying resume and analysis history will remain completely safe. Only this specific practice session will be cleared.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#2A2548]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSessionToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDeleteSession}
              disabled={isDeleting}
              leftIcon={isDeleting ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Session'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
