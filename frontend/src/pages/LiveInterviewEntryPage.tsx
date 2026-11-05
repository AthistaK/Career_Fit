import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  BookOpen,
  Sparkles,
  Calendar,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LiveInterviewSetupModal } from '../components/interview/LiveInterviewSetupModal';
import { liveInterviewService } from '../services/liveInterviewService';
import {
  LiveInterviewSession,
  LiveInterviewDashboardStats,
} from '../types/liveInterview';

export const LiveInterviewEntryPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<LiveInterviewDashboardStats | null>(null);
  const [sessions, setSessions] = useState<LiveInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, sessionsData] = await Promise.all([
        liveInterviewService.getDashboardStats().catch(() => null),
        liveInterviewService.getSessions().catch(() => []),
      ]);
      setStats(statsData);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Failed to load live interview dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Top Welcome / Hero Banner */}
      <div id="tour-live-interview-entry" className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#19162C] via-[#211D38] to-[#100E21] border border-[#2A2548] p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <Badge variant="indigo" icon={<Sparkles className="w-3.5 h-3.5" />}>
            CareerFit Live AI Interview
          </Badge>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
            Practice Like It's the Real Interview.
          </h1>

          <p className="text-xs sm:text-sm text-[#A5A1BA] leading-relaxed">
            Meet your personal AI interviewer. Practise real interview questions based on your resume and target job,
            receive real-time feedback, and improve your confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsSetupOpen(true)}
              leftIcon={<Video className="w-4 h-4" />}
              className="text-xs sm:text-sm px-6 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              Start New Interview
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/interview-prep')}
              leftIcon={<BookOpen className="w-4 h-4 text-[#8B5CF6]" />}
              className="text-xs sm:text-sm"
            >
              Interview Preparation Guide
            </Button>
          </div>
        </div>

        {/* Decorative Background Lighting */}
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Score */}
        <div className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-1">
          <span className="text-xs font-bold text-[#A5A1BA] uppercase tracking-wider">Latest Score</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">
              {stats?.latest_score !== null && stats?.latest_score !== undefined
                ? `${Math.round(stats.latest_score)}%`
                : '—'}
            </span>
            <span className="text-xs text-[#A5A1BA]">overall readiness</span>
          </div>
          {stats?.latest_session_id && (
            <button
              onClick={() => navigate(`/live-interview/review/${stats.latest_session_id}`)}
              className="text-[11px] font-bold text-[#A78BFA] hover:underline pt-1 flex items-center gap-1"
            >
              <span>View Latest Report</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Total Interviews */}
        <div className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-1">
          <span className="text-xs font-bold text-[#A5A1BA] uppercase tracking-wider">Total Completed</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">
              {stats?.total_interviews || 0}
            </span>
            <span className="text-xs text-[#A5A1BA]">interview sessions</span>
          </div>
          <p className="text-[11px] text-[#A5A1BA] pt-1">Across all difficulty levels</p>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-1">
          <span className="text-xs font-bold text-[#A5A1BA] uppercase tracking-wider">Average Score</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">
              {stats?.average_score ? `${Math.round(stats.average_score)}%` : '—'}
            </span>
            <span className="text-xs text-[#A5A1BA]">aggregate readiness</span>
          </div>
          <p className="text-[11px] text-[#A5A1BA] pt-1">Across previous attempts</p>
        </div>

        {/* Technical Competency */}
        <div className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] space-y-1">
          <span className="text-xs font-bold text-[#A5A1BA] uppercase tracking-wider">Technical Baseline</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#A78BFA]">
              {stats?.technical_avg ? `${Math.round(stats.technical_avg)}%` : '—'}
            </span>
            <span className="text-xs text-[#A5A1BA]">technical average</span>
          </div>
          <p className="text-[11px] text-[#A5A1BA] pt-1">Based on keyword depth</p>
        </div>
      </div>

      {/* Previous Interviews Table / Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Your Interview History</h2>
            <p className="text-xs text-[#A5A1BA]">Review your previous live interview sessions, transcripts, and video recordings</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSetupOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            New Session
          </Button>
        </div>

        {loading ? (
          <div className="p-8 rounded-2xl bg-[#19162C] text-center text-xs text-[#A5A1BA]">
            Loading interview history...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#19162C] border border-[#2A2548] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 text-[#A78BFA] mx-auto flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">No Interviews Practiced Yet</h3>
            <p className="text-xs text-[#A5A1BA] max-w-sm mx-auto">
              Start your first live interview with our cute, professional 3D AI interviewer to evaluate your skills and boost confidence.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSetupOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs mt-2"
            >
              Start Your First Interview
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => {
              const isDone = sess.status === 'completed';
              const score = sess.evaluation?.overall_score;

              return (
                <div
                  key={sess.id}
                  className="p-5 rounded-2xl bg-[#19162C] border border-[#2A2548] hover:border-[#8B5CF6]/60 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2 py-0.5 rounded-full">
                        {sess.interview_type} • {sess.difficulty}
                      </span>
                      <span className="text-xs text-[#A5A1BA] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sess.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#F8FAFC]">{sess.job_title}</h3>
                    {sess.company && <p className="text-xs text-[#A5A1BA]">{sess.company}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2A2548]">
                    <div className="flex items-center gap-2">
                      {isDone && score !== undefined ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-emerald-400">{Math.round(score)}%</span>
                          <span className="text-[10px] text-[#A5A1BA]">readiness</span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400 font-semibold">In Progress</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/live-interview/review/${sess.id}`)}
                          className="text-xs px-3"
                        >
                          View Report & Video
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/live-interview/room/${sess.id}`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          className="text-xs px-3"
                        >
                          Resume Room
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Setup Modal */}
      <LiveInterviewSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
    </div>
  );
};
