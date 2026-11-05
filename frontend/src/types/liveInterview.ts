export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'greeting' | 'closing';

export type InterviewState =
  | 'Preparing'
  | 'AI Speaking'
  | 'Listening to You'
  | 'Processing Answer'
  | 'Interview Completed';

export interface LiveInterviewTurn {
  id: number;
  session_id: number;
  turn_order: number;
  question_category: string;
  question_text: string;
  student_transcript?: string | null;
  student_audio_duration_seconds?: number;
  ai_feedback?: string | null;
  timestamp_seconds: number;
  created_at: string;
}

export interface StrongAnswer {
  turn_order: number;
  question: string;
  excerpt: string;
  strength_reason: string;
}

export interface AnswerNeedingImprovement {
  turn_order: number;
  question: string;
  weakness: string;
  suggested_star_answer: string;
}

export interface LiveInterviewEvaluation {
  id: number;
  session_id: number;
  overall_score: number;
  technical_score: number;
  relevance_score: number;
  communication_score: number;
  problem_solving_score: number;
  resume_depth_score: number;
  job_knowledge_score: number;
  hr_behavioral_score: number;
  summary?: string | null;
  strong_answers: StrongAnswer[];
  answers_needing_improvement: AnswerNeedingImprovement[];
  missing_critical_points: string[];
  personalized_recommendations: string[];
  topics_to_revise: string[];
  created_at: string;
}

export interface LiveInterviewRecording {
  id: number;
  session_id: number;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds: number;
  consent_given: boolean;
  created_at: string;
}

export interface LiveInterviewSession {
  id: number;
  user_id: number;
  resume_id?: number | null;
  job_id?: number | null;
  job_title: string;
  company?: string | null;
  job_description: string;
  interview_type: 'technical' | 'hr' | 'combined' | string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | string;
  duration_minutes: number;
  status: 'setup' | 'in_progress' | 'completed' | 'abandoned' | string;
  current_question_index: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  turns: LiveInterviewTurn[];
  evaluation?: LiveInterviewEvaluation | null;
  recording?: LiveInterviewRecording | null;
}

export interface LiveInterviewSessionCreateRequest {
  resume_id?: number;
  job_id?: number;
  job_title: string;
  company?: string;
  job_description: string;
  interview_type?: string;
  difficulty?: string;
  duration_minutes?: number;
}

export interface LiveInterviewStartResponse {
  session: LiveInterviewSession;
  greeting: string;
  first_question: string;
  first_turn_id: number;
  first_question_category: string;
}

export interface LiveInterviewTurnSubmitRequest {
  student_transcript: string;
  duration_seconds?: number;
  timestamp_seconds?: number;
}

export interface LiveInterviewTurnNextResponse {
  ai_reaction: string;
  next_question?: string | null;
  next_turn_id?: number | null;
  question_category?: string | null;
  is_last_question: boolean;
  is_completed: boolean;
}

export interface LiveInterviewDashboardStats {
  total_interviews: number;
  average_score: number;
  latest_score?: number | null;
  latest_session_id?: number | null;
  technical_avg: number;
  communication_avg: number;
  problem_solving_avg: number;
  recent_sessions: LiveInterviewSession[];
}
