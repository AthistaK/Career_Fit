from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.achievement import GamificationProfileResponse
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/achievements", tags=["Gamification & Achievements"])


@router.get("/", response_model=GamificationProfileResponse)
def get_user_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get current student XP, level, unlocked badges, and milestones."""
    return GamificationService.get_user_gamification_overview(db, current_user.id)
