import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
  ArrowRight,
  Award,
  Volume2,
} from 'lucide-react';
import { liveInterviewService } from '../services/liveInterviewService';
import { LiveInterviewSession } from '../types/liveInterview';
import { Button } from '../components/common/Button';

export const LiveInterviewReviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const sessionNum = Number(sessionId);

  const [session, setSession] = useState<LiveInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'evaluation' | 'strengths'>('evaluation');

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!sessionNum) {
      setError('Invalid interview session ID.');
      setLoading(false);
      return;
    }
    loadData();
  }, [sessionNum]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await liveInterviewService.getSession(sessionNum);
      setSession(data);
    } catch (err: any) {
      console.error('Failed to load interview review:', err);
      setError(err.response?.data?.detail || 'Failed to load interview report.');
    } finally {
      setLoading(false);
    }
  };

  const jumpToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, seconds);
      videoRef.current.play().catch(() => {});
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-[#F8FAFC]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center animate-spin">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <p className="text-xs text-[#A5A1BA]">Analyzing your interview performance and generating report...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-[#F8FAFC]">Report Unavailable</h2>
        <p className="text-xs text-[#A5A1BA]">{error || 'Could not load interview session.'}</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/live-interview')}>
          Back to AI Interview
        </Button>
      </div>
    );
  }

  const evaluation = session.evaluation;
  const turns = session.turns || [];
  const recordingUrl = liveInterviewService.getRecordingStreamUrl(session.id);

  // Category scores map for clean visual cards
  const categoryScores = [
    { name: 'Technical Knowledge', score: evaluation?.technical_score || 0, desc: 'Technical depth and terminology' },
    { name: 'Answer Relevance', score: evaluation?.relevance_score || 0, desc: 'Addressing specific question prompts' },
    { name: 'Communication Clarity', score: evaluation?.communication_score || 0, desc: 'Logical flow and articulation' },
    { name: 'Problem-Solving Approach', score: evaluation?.problem_solving_score || 0, desc: 'Triage, debugging, and trade-offs' },
    { name: 'Resume Understanding', score: evaluation?.resume_depth_score || 0, desc: 'Hands-on familiarity with listed projects' },
    { name: 'Job Role Knowledge', score: evaluation?.job_knowledge_score || 0, desc: 'Alignment with target position duties' },
    { name: 'HR & Behavioral', score: evaluation?.hr_behavioral_score || 0, desc: 'Team collaboration and composure' },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2548]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#A5A1BA]">
            <span
              onClick={() => navigate('/live-interview')}
              className="hover:text-[#F8FAFC] cursor-pointer transition-colors"
            >
              AI Live Interview
            </span>
            <span>/</span>
            <span className="text-[#A78BFA] font-bold">Performance Report</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] tracking-tight mt-1 flex items-center gap-2">
            Interview Performance Report
          </h1>
          <p className="text-xs text-[#A5A1BA] mt-0.5">
            Role: <strong className="text-[#F8FAFC]">{session.job_title}</strong> {session.company && `at ${session.company}`} •{' '}
            {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/live-interview')}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Practice Another
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Hero Overview Banner: Overall Score & Video Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overall Readiness Score Card */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#19162C] via-[#151226] to-[#100E21] border border-[#2A2548] shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A5A1BA] uppercase tracking-wider">
                Overall Interview Readiness
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40">
                AI Evaluated
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-[#F8FAFC] tracking-tight">
                {Math.round(evaluation?.overall_score || 0)}
              </span>
              <span className="text-lg font-bold text-[#A5A1BA]">/ 100</span>
            </div>

            <p className="text-xs text-[#A5A1BA] leading-relaxed">
              {evaluation?.summary ||
                'Candidate completed the interview assessment demonstrating balanced competency across technical and behavioral questions.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[#2A2548] text-center">
            <div className="p-3 rounded-xl bg-[#211D38] border border-[#2A2548]">
              <span className="block text-[10px] text-[#A5A1BA] font-bold">Questions</span>
              <span className="text-base font-extrabold text-[#F8FAFC] mt-0.5 block">{turns.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#211D38] border border-[#2A2548]">
              <span className="block text-[10px] text-[#A5A1BA] font-bold">Duration</span>
              <span className="text-base font-extrabold text-[#F8FAFC] mt-0.5 block">
                {session.duration_minutes}m
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#211D38] border border-[#2A2548]">
              <span className="block text-[10px] text-[#A5A1BA] font-bold">Difficulty</span>
              <span className="text-base font-extrabold text-[#A78BFA] capitalize mt-0.5 block">
                {session.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Video Playback Player */}
        <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-[#2A2548] overflow-hidden bg-[#100E21] shadow-xl flex flex-col">
          <div className="p-4 border-b border-[#2A2548] flex items-center justify-between bg-[#151226]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
              <Video className="w-4 h-4 text-[#8B5CF6]" />
              <span>Full Interview Video Recording</span>
            </div>
            <span className="text-[11px] text-[#A5A1BA]">
              {session.recording ? `${formatSeconds(session.recording.duration_seconds)} recorded` : 'Video Recording'}
            </span>
          </div>

          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[280px]">
            {session.recording ? (
              <video
                ref={videoRef}
                src={recordingUrl}
                controls
                className="w-full h-full max-h-[360px] object-contain"
              />
            ) : (
              <div className="p-8 text-center space-y-2 text-[#A5A1BA]">
                <Video className="w-8 h-8 text-[#8B5CF6] mx-auto opacity-50" />
                <p className="text-xs">Recording was disabled or is being processed.</p>
                <p className="text-[11px] text-[#A5A1BA]/80">Your full question transcript and evaluation are available below.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs: Evaluation Breakdown / Interactive Transcript / Recommendations */}
      <div className="flex items-center gap-2 border-b border-[#2A2548] pb-1">
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'evaluation'
              ? 'bg-[#8B5CF6] text-white shadow-soft'
              : 'text-[#A5A1BA] hover:bg-[#211D38] hover:text-[#F8FAFC]'
          }`}
        >
          7-Category Evaluation
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'transcript'
              ? 'bg-[#8B5CF6] text-white shadow-soft'
              : 'text-[#A5A1BA] hover:bg-[#211D38] hover:text-[#F8FAFC]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Timestamped Transcript ({turns.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('strengths')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'strengths'
              ? 'bg-[#8B5CF6] text-white shadow-soft'
              : 'text-[#A5A1BA] hover:bg-[#211D38] hover:text-[#F8FAFC]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Coaching & STAR Improvements</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: 7-CATEGORY EVALUATION BREAKDOWN
      ======================================================== */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryScores.map((cat) => (
              <div
                key={cat.name}
                className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-2 hover:border-[#8B5CF6]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F8FAFC] truncate">{cat.name}</span>
                  <span className="text-xs font-extrabold text-[#A78BFA]">{Math.round(cat.score)}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#211D38] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#8B5CF6] to-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#A5A1BA]">{cat.desc}</p>
              </div>
            ))}
          </div>

          {/* Missing Critical Points & Revision Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-4">
              <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Missing Critical Points
              </h3>
              <p className="text-xs text-[#A5A1BA]">
                Points you missed or should articulate more completely in future technical interviews:
              </p>
              <ul className="space-y-2 text-xs text-[#A5A1BA]">
                {evaluation?.missing_critical_points?.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#8B5CF6] font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-4">
              <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
                Recommended Topics to Revise
              </h3>
              <p className="text-xs text-[#A5A1BA]">
                Brush up on these technical topics before walking into your actual interview:
              </p>
              <div className="flex flex-wrap gap-2">
                {evaluation?.topics_to_revise?.map((top, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs font-semibold text-[#A78BFA]"
                  >
                    {top}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: TIMESTAMPED INTERACTIVE TRANSCRIPT
      ======================================================== */}
      {activeTab === 'transcript' && (
        <div className="space-y-4">
          <p className="text-xs text-[#A5A1BA]">
            Click any timestamp to jump the video player directly to that exchange.
          </p>

          <div className="space-y-4">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-3 hover:border-[#8B5CF6]/50 transition-all"
              >
                {/* Turn Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] text-xs font-bold flex items-center justify-center">
                      Q{turn.turn_order}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2 py-0.5 rounded-full">
                      {turn.question_category}
                    </span>
                  </div>

                  {/* Clickable Timestamp */}
                  <button
                    onClick={() => jumpToTimestamp(turn.timestamp_seconds)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#211D38] hover:bg-[#8B5CF6]/20 border border-[#2A2548] text-xs text-[#A78BFA] transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{formatSeconds(turn.timestamp_seconds)}</span>
                  </button>
                </div>

                {/* AI Question */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#A5A1BA] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                    AI Interviewer
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#F8FAFC]">
                    "{turn.question_text}"
                  </p>
                </div>

                {/* Student Answer */}
                <div className="space-y-1 pt-2 border-t border-[#2A2548]">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Volume2 className="w-3 h-3 text-emerald-400" />
                    Your Answer
                  </span>
                  <p className="text-xs text-[#A5A1BA] leading-relaxed italic bg-[#211D38]/60 p-3 rounded-xl border border-[#2A2548]">
                    {turn.student_transcript ? `"${turn.student_transcript}"` : '(No transcript captured)'}
                  </p>
                </div>

                {/* AI Feedback / Reaction */}
                {turn.ai_feedback && (
                  <p className="text-[11px] text-[#A78BFA]">
                    <strong>AI Note:</strong> {turn.ai_feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: COACHING & STAR IMPROVEMENTS
      ======================================================== */}
      {activeTab === 'strengths' && (
        <div className="space-y-6">
          {/* Strong Answers */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Strong Answers Highlighted
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluation?.strong_answers?.map((sa, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Strong Response
                  </span>
                  <p className="text-xs font-bold text-[#F8FAFC]">"{sa.question}"</p>
                  <p className="text-xs text-[#A5A1BA] italic bg-[#211D38] p-2.5 rounded-xl border border-[#2A2548]">
                    "{sa.excerpt}"
                  </p>
                  <p className="text-[11px] text-emerald-300">
                    <strong>Why it worked:</strong> {sa.strength_reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Answers Needing Improvement + Suggested STAR Answers */}
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Suggested STAR Improvements
            </h3>
            <div className="space-y-4">
              {evaluation?.answers_needing_improvement?.map((imp, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#F8FAFC]">"{imp.question}"</p>
                    <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Growth Area
                    </span>
                  </div>
                  <p className="text-xs text-rose-300">
                    <strong>Weakness:</strong> {imp.weakness}
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#211D38] border border-[#8B5CF6]/30 space-y-1">
                    <span className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider block">
                      Recommended STAR Delivery Format
                    </span>
                    <p className="text-xs text-[#F8FAFC] leading-relaxed">
                      {imp.suggested_star_answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Personal Recommendations */}
          <div className="p-6 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-3">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              Personalized Next Steps for Real Interviews
            </h3>
            <ul className="space-y-2 text-xs text-[#A5A1BA]">
              {evaluation?.personalized_recommendations?.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[#F8FAFC]">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
