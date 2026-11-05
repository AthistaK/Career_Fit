from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.roadmap import CareerRoleRecommendation
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/", response_model=List[CareerRoleRecommendation])
def get_career_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get prioritized career roles and skill gaps based on current user's active resume.
    """
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    if not latest_resume:
        # If no resume uploaded yet, return standard roles with 0% match
        roles = RecommendationService.get_role_recommendations_for_resume(
            db, Resume(skills=[])
        )
        return roles

    return RecommendationService.get_role_recommendations_for_resume(db, latest_resume)
