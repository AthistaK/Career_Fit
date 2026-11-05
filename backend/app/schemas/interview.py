import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class InterviewPrepCreateRequest(BaseModel):
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    job_title: str
    company: Optional[str] = None
    job_description: str


class InterviewQuestionItem(BaseModel):
    id: str
    category: str
    question: str
    why_asked: str
    suggested_answer: str
    answer_structure: str
    important_points: List[str] = []
    is_prepared: bool = False


class ToggleQuestionPreparedRequest(BaseModel):
    is_prepared: bool


class InterviewPrepSessionResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    job_title: str
    company: Optional[str] = None
    job_description: str
    strengths_overview: List[str] = []
    improvement_recommendations: List[str] = []
    technical_topics_to_revise: List[str] = []
    delivery_tips: List[str] = []
    questions: List[InterviewQuestionItem] = []
    prepared_count: int = 0
    total_questions: int = 0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
