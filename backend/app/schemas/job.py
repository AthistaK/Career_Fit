import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class JobCreateRequest(BaseModel):
    title: str
    company: Optional[str] = "Target Company"
    description: str


class MatchSkillItem(BaseModel):
    skill_name: str
    category: str
    match_type: str  # "matched", "partial", "missing"
    importance: str  # "required", "preferred"
    relevance_note: Optional[str] = None


class ExplainableScoreComponent(BaseModel):
    name: str
    weight: float
    raw_score: float
    weighted_points: float
    description: str
    breakdown_details: List[str]


class JobMatchResponse(BaseModel):
    id: int
    job_id: int
    resume_id: int
    job_title: str
    company: Optional[str] = None
    overall_match_score: float
    skill_match_score: float
    experience_match_score: float
    project_match_score: float
    keyword_similarity_score: float
    matched_skills_count: int
    partial_skills_count: int
    missing_skills_count: int
    matched_skills: List[MatchSkillItem]
    partial_skills: List[MatchSkillItem]
    missing_skills: List[MatchSkillItem]
    score_components: List[ExplainableScoreComponent]
    summary: Optional[str] = None
    recommendations: List[str] = []
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
