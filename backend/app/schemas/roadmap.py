import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class MilestoneItem(BaseModel):
    id: Optional[int] = None
    order: int
    title: str
    category: str
    status: str  # "completed", "in_progress", "next", "future"
    progress_percentage: float
    description: str
    skills: List[str] = []
    action_items: List[str] = []


class CareerRoadmapResponse(BaseModel):
    id: int
    target_role_title: str
    overall_readiness: float
    milestones: List[MilestoneItem]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class CareerRoleRecommendation(BaseModel):
    id: int
    title: str
    category: str
    description: str
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    industry_demand: str
    growth_rate: str
    avg_starting_salary: str
    recommended_reason: str
    priority_level: str  # "High Match", "Emerging Match", "Pivot Role"
