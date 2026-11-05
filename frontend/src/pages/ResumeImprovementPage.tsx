import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingAndEmpty';
import { resumeService } from '../services/resumeService';
import { ResumeImprovementSuggestion } from '../types';

export const ResumeImprovementPage: React.FC = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<ResumeImprovementSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchImprovements = async () => {
      try {
        setLoading(true);
        const res = await resumeService.getLatestResume();
        const data = await resumeService.getImprovements(res.id);
        setSuggestions(data);
      } catch (err) {
        console.error('Failed to load improvements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImprovements();
  }, []);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return <LoadingState message="Optimizing Resume Content..." subMessage="Evaluating action verbs, sentence structure, and impact metrics" />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Resume Optimization
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
            Resume Optimizer & Bullet Improvements
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A1BA]">
            Improve your resume based on the role you're targeting. Compare weak descriptions with strong, metric-driven action statements.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/analyzer')}
          rightIcon={<FileText className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Re-Analyze Resume
        </Button>
      </div>

      {suggestions.length > 0 ? (
        <div id="tour-resume-optimizer" className="space-y-6">
          {suggestions.map((sug, idx) => (
            <Card key={idx} className="p-6 space-y-4 bg-[#19162C] border border-[#2A2548]">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2548]">
                <span className="text-xs font-bold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {sug.section} Section
                </span>
                <Badge variant="emerald" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                  {sug.impact_metric}
                </Badge>
              </div>

              {/* Before & After Split Visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before (Weak Phrasing) */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
                  <span className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Original / Weak Phrasing
                  </span>
                  <p className="text-xs text-rose-200 font-medium leading-relaxed italic">
                    "{sug.original_text}"
                  </p>
                </div>

                {/* After (High Impact) */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> High-Impact Action Statement
                    </span>
                    <button
                      onClick={() => handleCopy(sug.improved_text, idx)}
                      className="p-1 text-emerald-400 hover:text-emerald-200 transition-colors"
                      title="Copy improved bullet"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-emerald-200 font-bold leading-relaxed">
                    "{sug.improved_text}"
                  </p>
                </div>
              </div>

              {/* Rationale Note */}
              <div className="p-3 bg-[#211D38] rounded-xl border border-[#2A2548] text-xs text-[#A5A1BA] flex items-start gap-2">
                <span className="font-bold text-[#F8FAFC] flex-shrink-0">Why this matters:</span>
                <span>{sug.reason}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-4 bg-[#19162C] border border-[#2A2548]">
          <FileText className="w-10 h-10 text-[#A5A1BA] mx-auto" />
          <h3 className="text-base font-bold text-[#F8FAFC]">Upload Resume First</h3>
          <p className="text-xs text-[#A5A1BA] max-w-sm mx-auto">
            Upload your resume in the Analyzer to receive personalized before/after bullet point suggestions.
          </p>
          <Button onClick={() => navigate('/analyzer')}>Go to Resume Analyzer</Button>
        </Card>
      )}
    </div>
  );
};
