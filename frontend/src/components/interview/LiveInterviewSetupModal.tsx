import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
  Clock,
  Gauge,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Video,
} from 'lucide-react';
import { Button } from '../common/Button';
import { resumeService } from '../../services/resumeService';
import { liveInterviewService } from '../../services/liveInterviewService';
import { ResumeAnalysis } from '../../types';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedResumeId?: number;
}

const TEMPLATES = [
  {
    title: 'Full Stack Engineer',
    company: 'NextGen Tech',
    desc: 'Seeking a Full Stack Engineer proficient in React, TypeScript, Python/Node.js, PostgreSQL, and REST API design. Experience with scalable microservices, automated testing, and CI/CD workflows required.',
  },
  {
    title: 'Python Backend Engineer',
    company: 'DataFlow Systems',
    desc: 'Looking for a Python Backend Developer with strong knowledge of FastAPI/Django, relational databases, caching with Redis, system architecture, and API security. Familiarity with Docker and Git is essential.',
  },
  {
    title: 'Frontend React Developer',
    company: 'CloudCanvas',
    desc: 'Frontend developer needed to architect modern, responsive UI applications using React, Tailwind CSS, State Management (Redux/Zustand), and Web APIs. Focus on performance, smooth animations, and clean reusable components.',
  },
];

export const LiveInterviewSetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  preselectedResumeId,
}) => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(preselectedResumeId || null);

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [interviewType, setInterviewType] = useState<'technical' | 'hr' | 'combined'>('combined');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [duration, setDuration] = useState<number>(15);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load candidate resumes on open
  useEffect(() => {
    if (isOpen) {
      loadResumes();
    }
  }, [isOpen]);

  const loadResumes = async () => {
    try {
      setLoadingResumes(true);
      const data = await resumeService.getResumes();
      setResumes(data);
      if (data.length > 0 && !selectedResumeId) {
        const def = data.find((r) => r.is_default) || data[0];
        setSelectedResumeId(def.id);
      }
    } catch (err) {
      console.error('Failed to load resumes for interview setup:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setJobTitle(tmpl.title);
    setCompany(tmpl.company);
    setJobDescription(tmpl.desc);
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedResumeId) {
      setError('Please select a resume from your library to ground the interview.');
      return;
    }
    if (!jobTitle.trim()) {
      setError('Target job title is required.');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError('Please provide a descriptive job description (at least 20 characters).');
      return;
    }

    // Immediately request fullscreen synchronously within the click event
    let fullscreenTriggered = false;
    try {
      if (document.documentElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        fullscreenTriggered = true;
      }
    } catch (fsErr) {
      console.warn('Browser rejected automatic fullscreen request:', fsErr);
      fullscreenTriggered = false;
    }

    try {
      setIsSubmitting(true);
      const session = await liveInterviewService.createSession({
        resume_id: selectedResumeId,
        job_title: jobTitle.trim(),
        company: company.trim() || undefined,
        job_description: jobDescription.trim(),
        interview_type: interviewType,
        difficulty: difficulty,
        duration_minutes: duration,
      });

      onClose();
      navigate(`/live-interview/room/${session.id}`, {
        state: { autoFullscreenTriggered: fullscreenTriggered },
      });
    } catch (err: any) {
      console.error('Failed to initialize live interview session:', err);
      setError(err.response?.data?.detail || 'Failed to start interview room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0A19]/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#19162C] via-[#151226] to-[#100E21] border border-[#2A2548] rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2548]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] shadow-[0_0_16px_rgba(139,92,246,0.3)]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#F8FAFC]">Configure Live AI Interview</h2>
              <p className="text-xs text-[#A5A1BA]">Set your role, resume context, and test criteria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStart} className="mt-6 space-y-6">
          {/* 1. Resume Selection from Library */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#F8FAFC] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8B5CF6]" />
                Select Grounding Resume:
              </span>
              <span className="text-[11px] font-normal text-[#A5A1BA]">
                {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} available
              </span>
            </label>

            {loadingResumes ? (
              <div className="p-4 rounded-xl bg-[#211D38] text-xs text-[#A5A1BA]">Loading library resumes...</div>
            ) : resumes.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#211D38] border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                <span>No resumes uploaded yet. Upload a resume first to personalize questions.</span>
                <Button size="sm" variant="outline" onClick={() => navigate('/analyzer')}>
                  Upload Resume
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-1">
                {resumes.map((r) => {
                  const isSelected = selectedResumeId === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedResumeId(r.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#F8FAFC]'
                          : 'bg-[#19162C] border-[#2A2548] text-[#A5A1BA] hover:bg-[#211D38]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-[#A78BFA] flex-shrink-0" />
                          <span className="text-xs font-bold truncate">{r.filename}</span>
                          {r.is_default && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#A78BFA] bg-[#8B5CF6]/25 px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#A5A1BA] mt-0.5">
                          Score: {Math.round(r.total_score)} pts • {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white' : 'border-[#2A2548]'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Job Target Details & Quick Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#8B5CF6]" />
                Target Job Description:
              </label>

              {/* Quick Template Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#A5A1BA] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                  Quick templates:
                </span>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-[#211D38] border border-[#2A2548] text-[#A78BFA] hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-colors"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Target Job Title (e.g. Software Engineer) *"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs text-[#F8FAFC] placeholder-[#A5A1BA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Company Name (Optional)"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs text-[#F8FAFC] placeholder-[#A5A1BA] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="Paste the job opening requirements, responsibilities, or competencies..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs text-[#F8FAFC] placeholder-[#A5A1BA] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* 3. Interview Preferences (Type, Difficulty, Duration) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#A5A1BA] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Interview Type:
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="combined">Combined (Tech + HR)</option>
                <option value="technical">Technical Only</option>
                <option value="hr">HR & Behavioral Only</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#A5A1BA] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Difficulty:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="beginner">Beginner (Intern / Junior)</option>
                <option value="intermediate">Intermediate (Standard)</option>
                <option value="advanced">Advanced (Senior / Deep)</option>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#A5A1BA] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Estimated Duration:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value={10}>10 Minutes (Express - ~5 Qs)</option>
                <option value={15}>15 Minutes (Standard - ~8 Qs)</option>
                <option value={20}>20 Minutes (Comprehensive - ~10 Qs)</option>
              </select>
            </div>
          </div>

          {/* Info Badge: No restriction */}
          <div className="p-3 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 flex items-center gap-2.5 text-xs text-[#A78BFA]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Open practice: No minimum score or job match restriction required. Practice freely!</span>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2548]">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="px-6 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              Enter Interview Room
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
