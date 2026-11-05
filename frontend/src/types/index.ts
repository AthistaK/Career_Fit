export interface User {
  id: number;
  email: string;
  full_name: string;
  college?: string;
  branch?: string;
  graduation_year?: number;
  avatar_url?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  current_xp: number;
  level: number;
  level_title: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SkillItem {
  name: string;
  category: string;
  proficiency_score: number;
  frequency: number;
  detected_section: string;
}

export interface EducationItem {
  institution?: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
}

export interface ExperienceItem {
  company?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_current: boolean;
}

export interface ProjectItem {
  title?: string;
  technologies: string[];
  description?: string;
  link?: string;
}

export interface CertificationItem {
  name: string;
  issuer?: string;
  issue_date?: string;
}

export interface ScoreFactor {
  score: number;
  max_score: number;
  weight: number;
  contribution: number;
  explanation: string;
  status: 'excellent' | 'good' | 'needs_improvement' | 'insufficient';
}

export interface ScoreBreakdown {
  skills: ScoreFactor;
  experience: ScoreFactor;
  projects: ScoreFactor;
  education: ScoreFactor;
  structure: ScoreFactor;
  total_score: number;
  formula_explanation: string;
}

export interface ResumeAnalysis {
  id: number;
  filename: string;
  file_type: string;
  file_path?: string;
  is_default?: boolean;
  raw_text?: string;
  parsed_name?: string;
  parsed_email?: string;
  parsed_phone?: string;
  parsed_links: string[];
  total_score: number;
  score_breakdown: ScoreBreakdown;
  summary?: string;
  strengths: string[];
  improvement_areas: string[];
  skills: SkillItem[];
  education_records: EducationItem[];
  experience_records: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  created_at: string;
}

export interface MatchSkillItem {
  skill_name: string;
  category: string;
  match_type: 'matched' | 'partial' | 'missing';
  importance: 'required' | 'preferred';
  relevance_note?: string;
}

export interface ExplainableScoreComponent {
  name: string;
  weight: number;
  raw_score: number;
  weighted_points: number;
  description: string;
  breakdown_details: string[];
}

export interface JobMatchResult {
  id: number;
  job_id: number;
  resume_id: number;
  job_title: string;
  company?: string;
  overall_match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  project_match_score: number;
  keyword_similarity_score: number;
  matched_skills_count: number;
  partial_skills_count: number;
  missing_skills_count: number;
  matched_skills: MatchSkillItem[];
  partial_skills: MatchSkillItem[];
  missing_skills: MatchSkillItem[];
  score_components: ExplainableScoreComponent[];
  summary?: string;
  recommendations: string[];
  created_at: string;
}

export interface CareerRoleRecommendation {
  id: number;
  title: string;
  category: string;
  description: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  industry_demand: string;
  growth_rate: string;
  avg_starting_salary: string;
  recommended_reason: string;
  priority_level: 'High Match' | 'Emerging Match' | 'Pivot Role';
}

export interface MilestoneItem {
  id?: number;
  order: number;
  title: string;
  category: string;
  status: 'completed' | 'in_progress' | 'next' | 'future';
  progress_percentage: number;
  description: string;
  skills: string[];
  action_items: string[];
}

export interface CareerRoadmap {
  id: number;
  target_role_title: string;
  overall_readiness: number;
  milestones: MilestoneItem[];
  created_at: string;
  updated_at: string;
}

export interface ResumeImprovementSuggestion {
  section: string;
  original_text: string;
  improved_text: string;
  reason: string;
  impact_metric: string;
}

export interface AnalysisHistoryItem {
  id: number;
  resume_id?: number;
  action_type: string;
  title: string;
  score_value: number;
  score_delta: number;
  summary?: string;
  details: Record<string, any>;
  created_at: string;
}

export interface ScoreProgressionPoint {
  date: string;
  score: number;
  title: string;
  action_type: string;
}

export interface AchievementItem {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface GamificationProfile {
  current_xp: number;
  level: number;
  level_title: string;
  next_level_xp: number;
  progress_to_next_level: number;
  streak_days: number;
  unlocked_count: number;
  total_achievements: number;
  achievements: AchievementItem[];
}

export interface InterviewQuestionItem {
  id: string;
  category: string;
  question: string;
  why_asked: string;
  suggested_answer: string;
  answer_structure: string;
  important_points: string[];
  is_prepared: boolean;
}

export interface InterviewPrepSession {
  id: number;
  user_id: number;
  resume_id?: number;
  job_id?: number;
  job_title: string;
  company?: string;
  job_description: string;
  strengths_overview: string[];
  improvement_recommendations: string[];
  technical_topics_to_revise: string[];
  delivery_tips: string[];
  questions: InterviewQuestionItem[];
  prepared_count: number;
  total_questions: number;
  created_at: string;
  updated_at: string;
}

export interface InterviewPrepCreateRequest {
  resume_id?: number;
  job_id?: number;
  job_title: string;
  company?: string;
  job_description: string;
}
