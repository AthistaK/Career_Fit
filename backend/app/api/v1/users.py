from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileResponse, UserUpdate
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get profile of current authenticated student."""
    xp_profile = GamificationService.get_or_create_xp_profile(db, current_user.id)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "college": current_user.college,
        "branch": current_user.branch,
        "graduation_year": current_user.graduation_year,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "created_at": current_user.created_at,
        "current_xp": xp_profile.current_xp,
        "level": xp_profile.level,
        "level_title": xp_profile.level_title,
    }


@router.put("/me", response_model=UserProfileResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Update profile details for the authenticated user."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.college is not None:
        current_user.college = user_update.college
    if user_update.branch is not None:
        current_user.branch = user_update.branch
    if user_update.graduation_year is not None:
        current_user.graduation_year = user_update.graduation_year
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url

    db.commit()
    db.refresh(current_user)

    xp_profile = GamificationService.get_or_create_xp_profile(db, current_user.id)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "college": current_user.college,
        "branch": current_user.branch,
        "graduation_year": current_user.graduation_year,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "created_at": current_user.created_at,
        "current_xp": xp_profile.current_xp,
        "level": xp_profile.level,
        "level_title": xp_profile.level_title,
    }
