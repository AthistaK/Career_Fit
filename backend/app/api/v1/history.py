from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.history import AnalysisHistory
from app.schemas.history import AnalysisHistoryResponse, ScoreProgressionPoint

router = APIRouter(prefix="/history", tags=["Analysis History"])


@router.get("/", response_model=List[AnalysisHistoryResponse])
def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve chronologically ordered analysis and match activity history."""
    history_records = (
        db.query(AnalysisHistory)
        .filter(AnalysisHistory.user_id == current_user.id)
        .order_by(AnalysisHistory.created_at.desc())
        .limit(30)
        .all()
    )
    return history_records


@router.get("/progression", response_model=List[ScoreProgressionPoint])
def get_score_progression(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve score progression timeline data for plotting growth charts."""
    history_records = (
        db.query(AnalysisHistory)
        .filter(AnalysisHistory.user_id == current_user.id)
        .order_by(AnalysisHistory.created_at.asc())
        .all()
    )
    points = [
        ScoreProgressionPoint(
            date=h.created_at.strftime("%b %d, %H:%M"),
            score=h.score_value,
            title=h.title,
            action_type=h.action_type,
        )
        for h in history_records
    ]
    return points
