import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Download,
  Trash2,
  Eye,
  Star,
  Plus,
  Layers,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ScoreCard } from '../components/common/ScoreCard';
import { SkillChip } from '../components/common/SkillChip';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { resumeService } from '../services/resumeService';
import { ResumeAnalysis } from '../types';
import confetti from 'canvas-confetti';

export const ResumeAnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  const initialTab = searchParams.get('tab') === 'library' ? 'library' : 'analysis';
  const [activeTab, setActiveTab] = useState<'analysis' | 'library'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'library') {
      setActiveTab('library');
    } else if (tabParam === 'analysis') {
      setActiveTab('analysis');
    }
  }, [searchParams]);
  const [resume, setResume] = useState<ResumeAnalysis | null>(null);
  const [resumes, setResumes] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  // Resume Library state
  const [previewResume, setPreviewResume] = useState<ResumeAnalysis | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeAnalysis | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAllResumes = async () => {
    try {
      const list = await resumeService.getResumes();
      setResumes(list);
      if (list.length > 0) {
        // Set default or first resume if not already set
        setResume((prev) => {
          if (prev) {
            const found = list.find((r) => r.id === prev.id);
            return found || list.find((r) => r.is_default) || list[0];
          }
          return list.find((r) => r.is_default) || list[0];
        });
      }
    } catch {
      // No resumes yet
    }
  };

  useEffect(() => {
    loadAllResumes();
  }, []);

  const handleFileUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
      setError('Please upload a valid PDF or DOCX resume document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 4-stage visual processing progression
      setUploadProgressStage('Uploading resume document...');
      await new Promise((r) => setTimeout(r, 350));

      setUploadProgressStage('Extracting text & section boundaries with PyPDF/pdfplumber...');
      await new Promise((r) => setTimeout(r, 350));

      setUploadProgressStage('Detecting verified skills against 1,200+ taxonomy...');
      await new Promise((r) => setTimeout(r, 350));

      setUploadProgressStage('Computing explainable 5-factor CareerFit scoring model...');

      const analyzedResume = await resumeService.uploadResume(file);
      setResume(analyzedResume);
      await loadAllResumes();

      // Trigger celebration if good score
      if (analyzedResume.total_score >= 75) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze resume. Ensure text is readable and try again.');
    } finally {
      setLoading(false);
      setUploadProgressStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSetDefault = async (r: ResumeAnalysis) => {
    try {
      await resumeService.setDefaultResume(r.id);
      await loadAllResumes();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set default resume.');
    }
  };

  const handleDeleteResume = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await resumeService.deleteResume(deleteTarget.id);
      setDeleteTarget(null);
      await loadAllResumes();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete resume.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (r: ResumeAnalysis) => {
    try {
      await resumeService.downloadResume(r.id, r.filename);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="indigo" icon={<FileText className="w-3.5 h-3.5" />}>
            Resume Parsing & Multi-Resume Library
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
            Resume Analyzer & Library
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A1BA]">
            Upload multiple resumes, examine explainable CareerFit scoring factors, and manage your student resume library.
          </p>
        </div>

        {/* Tab Toggle: Analysis vs Resume Library */}
        <div className="flex items-center gap-2 bg-[#19162C] border border-[#2A2548] p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'analysis'
                ? 'bg-[#8B5CF6] text-white shadow-soft'
                : 'text-[#A5A1BA] hover:text-[#F8FAFC]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Resume Analysis
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'library'
                ? 'bg-[#8B5CF6] text-white shadow-soft'
                : 'text-[#A5A1BA] hover:text-[#F8FAFC]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Resume Library ({resumes.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESUME ANALYSIS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'analysis' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Active Resume Selector Pill Bar if multiple resumes exist */}
          {resumes.length > 1 && (
            <div className="p-3 bg-[#19162C] border border-[#2A2548] rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A5A1BA]">
                <FileText className="w-4 h-4 text-[#8B5CF6]" />
                <span>Viewing Analysis for:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setResume(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      resume?.id === r.id
                        ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6] text-[#A78BFA]'
                        : 'bg-[#211D38] border border-[#2A2548] text-[#A5A1BA] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <span>{r.filename}</span>
                    <span className="text-[10px] text-[#A78BFA]">({Math.round(r.total_score)} pts)</span>
                    {r.is_default && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload Drop Zone Card */}
          <Card
            id="tour-analyzer-upload"
            className="p-8 border-dashed border-2 border-[#2A2548] hover:border-[#8B5CF6]/60 transition-colors bg-[#19162C]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center text-center cursor-pointer py-6 space-y-3"
            >
              <div className="p-4 bg-[#211D38] text-[#8B5CF6] border border-[#2A2548] rounded-3xl shadow-soft">
                <UploadCloud className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Drag & Drop a Resume to Upload & Analyze
                </h3>
                <p className="text-xs text-[#A5A1BA] mt-1">
                  or <span className="font-bold text-[#A78BFA] underline">browse your device</span> (PDF or DOCX, Max 10MB)
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Badge variant="slate" size="sm">PDF</Badge>
                <Badge variant="slate" size="sm">DOCX</Badge>
                <Badge variant="emerald" size="sm">Multiple Resumes Supported</Badge>
              </div>
            </div>

            {/* Upload Processing State */}
            {loading && (
              <div className="mt-6 p-4 bg-[#211D38] rounded-2xl border border-[#2A2548] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                    {uploadProgressStage || 'Processing Resume...'}
                  </span>
                  <span className="text-[#A78BFA]">NLP Extracting</span>
                </div>
                <ProgressBar value={85} height="sm" color="brand" />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mt-4 p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Card>

          {/* Analysis Results View */}
          {resume && (
            <div className="space-y-8 animate-fadeIn">
              {/* Top Score Card & Contact Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <ScoreCard
                    score={resume.total_score}
                    breakdown={resume.score_breakdown}
                    onViewDetails={() => setIsFormulaModalOpen(true)}
                  />
                </div>

                <div className="lg:col-span-5">
                  <Card className="p-6 space-y-4 h-full flex flex-col justify-between bg-[#19162C] border border-[#2A2548]">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Profile Identity</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDownload(resume)}
                            title="Download document"
                            className="p-1.5 rounded-lg bg-[#211D38] text-[#A5A1BA] hover:text-[#F8FAFC] border border-[#2A2548] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPreviewResume(resume)}
                            title="Preview text"
                            className="p-1.5 rounded-lg bg-[#211D38] text-[#A5A1BA] hover:text-[#F8FAFC] border border-[#2A2548] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-[#F8FAFC] mt-1">
                        {resume.parsed_name || 'Candidate Profile'}
                      </h3>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[#A5A1BA]">
                          <span className="font-semibold">Email:</span>
                          <span className="font-medium text-[#F8FAFC]">{resume.parsed_email || 'Not detected'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#A5A1BA]">
                          <span className="font-semibold">Phone:</span>
                          <span className="font-medium text-[#F8FAFC]">{resume.parsed_phone || 'Not detected'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#A5A1BA]">
                          <span className="font-semibold">Document:</span>
                          <span className="font-medium text-[#F8FAFC] truncate max-w-[180px]">{resume.filename}</span>
                        </div>
                      </div>

                      {resume.parsed_links && resume.parsed_links.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#2A2548]">
                          <span className="text-xs font-bold text-[#A5A1BA] block mb-1.5">Detected Links:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {resume.parsed_links.map((link, i) => (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold text-[#A78BFA] bg-[#211D38] border border-[#2A2548] px-2 py-0.5 rounded-md hover:underline truncate max-w-[200px]"
                              >
                                {link.replace('https://', '')}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/improvements')}
                        rightIcon={<Sparkles className="w-3.5 h-3.5" />}
                        className="w-full text-xs"
                      >
                        Optimize Bullets
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/matcher')}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="w-full text-xs"
                      >
                        Match Role
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Strengths & Improvement Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-3 bg-emerald-500/10 border-emerald-500/25">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Identified Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-emerald-200">
                    {resume.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6 space-y-3 bg-amber-500/10 border-amber-500/25">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Actionable Improvement Opportunities</span>
                  </div>
                  <ul className="space-y-2 text-xs text-amber-200">
                    {resume.improvement_areas.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Extracted Skills Catalog */}
              <Card className="p-6 space-y-4 bg-[#19162C] border border-[#2A2548]">
                <div className="flex justify-between items-center pb-3 border-b border-[#2A2548]">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Taxonomy Verified</span>
                    <h3 className="text-base font-bold text-[#F8FAFC]">
                      Detected Technical & Professional Skills ({resume.skills.length})
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((sk) => (
                    <SkillChip
                      key={sk.name}
                      name={sk.name}
                      proficiency={sk.proficiency_score}
                      category={sk.category}
                      matchType="neutral"
                    />
                  ))}
                </div>
              </Card>

              {/* Structured Sections (Education, Projects, Experience) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Education */}
                <Card className="p-5 space-y-3 bg-[#19162C] border border-[#2A2548]">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#2A2548]">
                    <GraduationCap className="w-4 h-4 text-[#8B5CF6]" />
                    <h4 className="text-sm font-bold text-[#F8FAFC]">Education</h4>
                  </div>
                  {resume.education_records.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      {resume.education_records.map((edu, idx) => (
                        <div key={idx} className="space-y-0.5 bg-[#211D38] p-2.5 rounded-xl border border-[#2A2548]">
                          <p className="font-bold text-[#F8FAFC]">{edu.degree || 'Degree'}</p>
                          <p className="text-[#A5A1BA]">{edu.institution}</p>
                          {edu.gpa && <p className="text-[#A78BFA] font-semibold">GPA: {edu.gpa}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#A5A1BA] py-2">No education records demarcated.</p>
                  )}
                </Card>

                {/* Projects */}
                <Card className="p-5 space-y-3 bg-[#19162C] border border-[#2A2548]">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#2A2548]">
                    <FolderGit2 className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-[#F8FAFC]">Projects</h4>
                  </div>
                  {resume.projects.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      {resume.projects.map((proj, idx) => (
                        <div key={idx} className="space-y-1 bg-[#211D38] p-2.5 rounded-xl border border-[#2A2548]">
                          <p className="font-bold text-[#F8FAFC]">{proj.title || `Project ${idx + 1}`}</p>
                          <p className="text-[#A5A1BA] line-clamp-2">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#A5A1BA] py-2">No projects section detected.</p>
                  )}
                </Card>

                {/* Experience */}
                <Card className="p-5 space-y-3 bg-[#19162C] border border-[#2A2548]">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#2A2548]">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-[#F8FAFC]">Experience</h4>
                  </div>
                  {resume.experience_records.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      {resume.experience_records.map((exp, idx) => (
                        <div key={idx} className="space-y-0.5 bg-[#211D38] p-2.5 rounded-xl border border-[#2A2548]">
                          <p className="font-bold text-[#F8FAFC]">{exp.position}</p>
                          <p className="text-[#A5A1BA]">{exp.company}</p>
                          {exp.start_date && <p className="text-[#A5A1BA] text-[10px]">{exp.start_date}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#A5A1BA] py-2">No professional experience section detected.</p>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RESUME LIBRARY (TASK 3) */}
      {/* ========================================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Library Header & Upload CTA */}
          <div
            id="tour-resume-library"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#19162C] border border-[#2A2548] rounded-2xl"
          >
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Candidate Resume Library</h3>
              <p className="text-xs text-[#A5A1BA] mt-0.5">
                Manage all your resumes in one place. Choose which version to use for job matches and interview preparation.
              </p>
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={() => libraryFileInputRef.current?.click()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload Another Resume
            </Button>
            <input
              ref={libraryFileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Resumes Grid */}
          {resumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((r) => (
                <Card
                  key={r.id}
                  className="p-6 flex flex-col justify-between space-y-4 bg-[#19162C] border border-[#2A2548]"
                >
                  <div className="space-y-3">
                    {/* Header: File icon, Name & Default Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA] flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#F8FAFC] truncate" title={r.filename}>
                            {r.filename}
                          </h4>
                          <span className="text-[10px] text-[#A5A1BA] uppercase tracking-wider block">
                            {r.file_type.toUpperCase()} • {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {r.is_default && (
                        <Badge variant="indigo" size="sm">
                          Default
                        </Badge>
                      )}
                    </div>

                    {/* Score & Extracted Stats */}
                    <div className="p-3 bg-[#211D38] border border-[#2A2548] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#A5A1BA] uppercase">CareerFit Score</span>
                        <p className="text-lg font-extrabold text-[#F8FAFC]">
                          {Math.round(r.total_score)} <span className="text-xs text-[#A5A1BA]">/100</span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] font-semibold text-[#A5A1BA] space-y-0.5">
                        <p>{r.skills.length} Skills</p>
                        <p>{r.projects.length} Projects</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2 border-t border-[#2A2548]">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResume(r);
                          setActiveTab('analysis');
                        }}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        View Analysis
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewResume(r)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Preview Text
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!r.is_default && (
                        <button
                          onClick={() => handleSetDefault(r)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-[#211D38] border border-[#2A2548] text-[11px] font-bold text-[#A5A1BA] hover:text-[#F8FAFC] hover:border-[#8B5CF6]/40 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Star className="w-3 h-3 text-amber-400" />
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(r)}
                        className="py-1.5 px-3 rounded-lg bg-[#211D38] border border-[#2A2548] text-[11px] font-bold text-[#A5A1BA] hover:text-[#F8FAFC] hover:border-[#8B5CF6]/40 transition-colors flex items-center gap-1"
                        title="Download original file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center space-y-4 bg-[#19162C] border border-[#2A2548]">
              <div className="w-12 h-12 rounded-2xl bg-[#211D38] text-[#8B5CF6] border border-[#2A2548] flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#F8FAFC]">Your Resume Library is Empty</h4>
              <p className="text-xs text-[#A5A1BA] max-w-sm mx-auto">
                Upload your first resume in PDF or DOCX format to calculate your CareerFit score and save it to your library.
              </p>
              <Button size="sm" onClick={() => libraryFileInputRef.current?.click()}>
                Upload First Resume
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: Preview, Delete Confirmation & Scoring Formula */}
      {/* ========================================================================= */}

      {/* Preview Raw Resume Text Modal */}
      <Modal
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        title={previewResume ? `Resume Preview: ${previewResume.filename}` : 'Resume Preview'}
        subtitle="Extracted plain text and structured components"
        maxWidth="xl"
      >
        {previewResume && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#211D38] border border-[#2A2548] rounded-xl flex items-center justify-between text-[#A5A1BA]">
              <span>Name: <strong className="text-[#F8FAFC]">{previewResume.parsed_name || 'N/A'}</strong></span>
              <span>Score: <strong className="text-[#A78BFA]">{Math.round(previewResume.total_score)}/100</strong></span>
              <span>Format: <strong className="text-[#F8FAFC]">{previewResume.file_type.toUpperCase()}</strong></span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#F8FAFC] block mb-1">Parsed Resume Content:</span>
              <pre className="p-4 bg-[#0B0A19] border border-[#2A2548] rounded-xl text-[#A5A1BA] text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto">
                {previewResume.raw_text || 'No raw text saved for this legacy record.'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setPreviewResume(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Resume"
        subtitle="Confirm document deletion"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-[#A5A1BA]">
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Are you sure you want to delete <strong className="text-white">{deleteTarget?.filename}</strong>?
              Historical job match records will be preserved safely.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={handleDeleteResume} isLoading={deleting}>
              Delete Resume
            </Button>
          </div>
        </div>
      </Modal>

      {/* Explainable Scoring Methodology Modal */}
      <Modal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        title="Explainable CareerFit Scoring Methodology"
        subtitle="Mathematical factor distribution and evaluation criteria"
      >
        <div className="space-y-4 text-xs text-[#A5A1BA]">
          <div className="p-3.5 bg-[#211D38] border border-[#2A2548] text-[#A78BFA] rounded-xl font-mono text-[11px]">
            Score = 40%(Skills) + 20%(Experience) + 20%(Projects) + 10%(Education) + 10%(Structure)
          </div>

          <div className="space-y-3">
            <div className="border-b border-[#2A2548] pb-2">
              <h5 className="font-bold text-[#F8FAFC]">1. Technical Skills Breadth & Depth (40% Weight)</h5>
              <p className="mt-0.5 text-[#A5A1BA]">
                Evaluates quantity of verified skills against the curated taxonomy, diversity across domains (Languages, Frameworks, Cloud, Databases), and multi-section frequency.
              </p>
            </div>

            <div className="border-b border-[#2A2548] pb-2">
              <h5 className="font-bold text-[#F8FAFC]">2. Practical Projects & Portfolio (20% Weight)</h5>
              <p className="mt-0.5 text-[#A5A1BA]">
                Rewards hands-on applications, verifiable GitHub or live deployment links, and technical tool descriptions.
              </p>
            </div>

            <div className="border-b border-[#2A2548] pb-2">
              <h5 className="font-bold text-[#F8FAFC]">3. Work Experience & Internships (20% Weight)</h5>
              <p className="mt-0.5 text-[#A5A1BA]">
                Evaluates company/role context, duration timelines, and active action verbs.
              </p>
            </div>

            <div className="border-b border-[#2A2548] pb-2">
              <h5 className="font-bold text-[#F8FAFC]">4. Education & Academic Performance (10% Weight)</h5>
              <p className="mt-0.5 text-[#A5A1BA]">
                Recognizes university degree program, graduation year, and CGPA/percentage records.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-[#F8FAFC]">5. Structure & Professional Contact Links (10% Weight)</h5>
              <p className="mt-0.5 text-[#A5A1BA]">
                Ensures email, phone, and professional GitHub/LinkedIn profiles are accurately reachable by recruiters.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
