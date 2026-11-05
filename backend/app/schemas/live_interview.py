from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class LiveInterviewSessionCreate(BaseModel):
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    job_title: str = Field(..., min_length=2, max_length=255)
    company: Optional[str] = None
    job_description: str = Field(..., min_length=10)
    interview_type: str = "combined"  # "technical" | "hr" | "combined"
    difficulty: str = "intermediate"  # "beginner" | "intermediate" | "advanced"
    duration_minutes: int = 15  # 10, 15, 20


class LiveInterviewTurnSubmit(BaseModel):
    student_transcript: str = Field(..., min_length=1)
    duration_seconds: Optional[float] = 0.0
    timestamp_seconds: Optional[float] = 0.0


class LiveInterviewTurnResponse(BaseModel):
    id: int
    session_id: int
    turn_order: int
    question_category: str
    question_text: str
    student_transcript: Optional[str] = None
    student_audio_duration_seconds: Optional[float] = 0.0
    ai_feedback: Optional[str] = None
    timestamp_seconds: Optional[float] = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class LiveInterviewEvaluationResponse(BaseModel):
    id: int
    session_id: int
    overall_score: float
    technical_score: float
    relevance_score: float
    communication_score: float
    problem_solving_score: float
    resume_depth_score: float
    job_knowledge_score: float
    hr_behavioral_score: float
    summary: Optional[str] = None
    strong_answers: List[Dict[str, Any]] = []
    answers_needing_improvement: List[Dict[str, Any]] = []
    missing_critical_points: List[str] = []
    personalized_recommendations: List[str] = []
    topics_to_revise: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


class LiveInterviewRecordingResponse(BaseModel):
    id: int
    session_id: int
    file_path: str
    file_size_bytes: int
    mime_type: str
    duration_seconds: float
    consent_given: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LiveInterviewSessionResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    job_title: str
    company: Optional[str] = None
    job_description: str
    interview_type: str
    difficulty: str
    duration_minutes: int
    status: str
    current_question_index: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    turns: List[LiveInterviewTurnResponse] = []
    evaluation: Optional[LiveInterviewEvaluationResponse] = None
    recording: Optional[LiveInterviewRecordingResponse] = None

    class Config:
        from_attributes = True


class LiveInterviewStartResponse(BaseModel):
    session: LiveInterviewSessionResponse
    greeting: str
    first_question: str
    first_turn_id: int
    first_question_category: str


class LiveInterviewTurnNextResponse(BaseModel):
    ai_reaction: str  # Short conversational reaction/acknowledgment
    next_question: Optional[str] = None
    next_turn_id: Optional[int] = None
    question_category: Optional[str] = None
    is_last_question: bool = False
    is_completed: bool = False


class LiveInterviewDashboardStats(BaseModel):
    total_interviews: int
    average_score: float
    latest_score: Optional[float] = None
    latest_session_id: Optional[int] = None
    technical_avg: float
    communication_avg: float
    problem_solving_avg: float
    recent_sessions: List[LiveInterviewSessionResponse] = []
