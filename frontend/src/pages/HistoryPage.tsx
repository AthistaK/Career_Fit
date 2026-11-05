import React, { useEffect, useState } from 'react';
import {
  History,
  FileText,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingAndEmpty';
import { historyService } from '../services/extraServices';
import { AnalysisHistoryItem, ScoreProgressionPoint } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [progression, setProgression] = useState<ScoreProgressionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const [h, p] = await Promise.all([
          historyService.getHistory(),
          historyService.getScoreProgression(),
        ]);
        setHistory(h);
        setProgression(p);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Career Timeline..." subMessage="Compiling previous analyses, match records, and score deltas" />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div>
        <Badge variant="indigo" icon={<History className="w-3.5 h-3.5" />}>
          Longitudinal Progress Tracker
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
          Analysis & Career History
        </h1>
        <p className="text-xs sm:text-sm text-[#A5A1BA]">
          Track your resume quality growth, score changes (+8 pts), and previous job match evaluations.
        </p>
      </div>

      {/* Progression Chart Card */}
      <Card id="tour-history" className="p-6 space-y-4 bg-[#19162C] border border-[#2A2548]">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A5A1BA]">Score Evolution</span>
            <h3 className="text-base font-bold text-[#F8FAFC]">Career Readiness Growth Timeline</h3>
          </div>
        </div>

        {progression.length > 1 ? (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progression}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#histGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#A5A1BA]">
            More history entries will generate an interactive continuous growth trend.
          </div>
        )}
      </Card>

      {/* History Timeline Stream */}
      <Card className="p-6 space-y-4 bg-[#19162C] border border-[#2A2548]">
        <h3 className="text-base font-bold text-[#F8FAFC] pb-3 border-b border-[#2A2548]">
          Chronological Activity Log ({history.length})
        </h3>

        {history.length > 0 ? (
          <div className="divide-y divide-[#2A2548]">
            {history.map((item) => {
              const isMatch = item.action_type === 'job_match';
              const isPositive = item.score_delta >= 0;

              return (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-2xl border border-[#2A2548] ${isMatch ? 'bg-cyan-500/15 text-cyan-300' : 'bg-[#8B5CF6]/15 text-[#A78BFA]'}`}>
                      {isMatch ? <Target className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#F8FAFC]">{item.title}</h4>
                        <Badge variant={isMatch ? 'cyan' : 'indigo'} size="sm">
                          {isMatch ? 'Job Match' : 'Resume Scan'}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#A5A1BA]">{item.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t border-[#2A2548] sm:border-0">
                    <div>
                      <div className="text-base font-extrabold text-[#F8FAFC]">
                        {item.score_value} pts
                      </div>
                      {item.score_delta !== 0 && (
                        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isPositive ? `+${item.score_delta}` : item.score_delta} pts
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#A5A1BA] font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#A5A1BA] py-6 text-center">No history recorded yet.</p>
        )}
      </Card>
    </div>
  );
};
