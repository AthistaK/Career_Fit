from typing import Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.roadmap import CareerRoadmap
from app.schemas.roadmap import CareerRoadmapResponse, MilestoneItem
from app.services.roadmap_service import RoadmapService
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/roadmap", tags=["Career Roadmap"])


class GenerateRoadmapRequest(BaseModel):
    target_role_title: str


@router.get("/", response_model=CareerRoadmapResponse)
def get_user_roadmap(
    role_title: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get current career roadmap for user or generate one dynamically for their latest resume and preferred role.
    """
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    target_title = role_title or "Full Stack Developer"
    roadmap = RoadmapService.generate_or_update_roadmap(
        db=db,
        user_id=current_user.id,
        target_role_title=target_title,
        resume=latest_resume,
    )

    # Unlock achievement
    GamificationService.check_and_unlock_achievement(db, current_user.id, "career_explorer")

    milestones = [
        MilestoneItem(
            id=m.id,
            order=m.order,
            title=m.title,
            category=m.category,
            status=m.status,
            progress_percentage=m.progress_percentage,
            description=m.description,
            skills=m.skills or [],
            action_items=m.action_items or [],
        )
        for m in roadmap.milestones
    ]

    return CareerRoadmapResponse(
        id=roadmap.id,
        target_role_title=roadmap.target_role_title,
        overall_readiness=roadmap.overall_readiness,
        milestones=milestones,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at,
    )


@router.post("/generate", response_model=CareerRoadmapResponse)
def generate_custom_roadmap(
    payload: GenerateRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Generate a custom interactive roadmap for a specific target role."""
    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )

    roadmap = RoadmapService.generate_or_update_roadmap(
        db=db,
        user_id=current_user.id,
        target_role_title=payload.target_role_title,
        resume=latest_resume,
    )

    GamificationService.check_and_unlock_achievement(db, current_user.id, "career_explorer")

    milestones = [
        MilestoneItem(
            id=m.id,
            order=m.order,
            title=m.title,
            category=m.category,
            status=m.status,
            progress_percentage=m.progress_percentage,
            description=m.description,
            skills=m.skills or [],
            action_items=m.action_items or [],
        )
        for m in roadmap.milestones
    ]

    return CareerRoadmapResponse(
        id=roadmap.id,
        target_role_title=roadmap.target_role_title,
        overall_readiness=roadmap.overall_readiness,
        milestones=milestones,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at,
    )
