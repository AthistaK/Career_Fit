import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AnalysisHistoryResponse(BaseModel):
    id: int
    resume_id: Optional[int] = None
    action_type: str
    title: str
    score_value: float
    score_delta: float
    summary: Optional[str] = None
    details: Dict[str, Any] = {}
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ScoreProgressionPoint(BaseModel):
    date: str
    score: float
    title: str
    action_type: str
