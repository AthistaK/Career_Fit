from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import InterviewPrepSession
from app.schemas.interview import (
    InterviewPrepCreateRequest,
    InterviewPrepSessionResponse,
    ToggleQuestionPreparedRequest,
)
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interview-prep", tags=["Interview Preparation"])


@router.post("/generate", response_model=InterviewPrepSessionResponse)
def generate_interview_prep_session(
    request: InterviewPrepCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Generate and persist a personalized interview preparation guide using the student's
    selected resume and job description.
    """
    # 1. Fetch specified resume or fallback to user's latest
    if request.resume_id:
        resume = (
            db.query(Resume)
            .filter(Resume.id == request.resume_id, Resume.user_id == current_user.id)
            .first()
        )
    else:
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
            .first()
        )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload a resume first to generate personalized interview questions.",
        )

    if not request.job_description or len(request.job_description.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid job description (minimum 15 characters).",
        )

    # 2. Generate grounded content via InterviewService
    prep_data = InterviewService.generate_interview_prep(
        resume=resume,
        job_title=request.job_title,
        company=request.company,
        job_description=request.job_description,
    )

    # 3. Persist session
    session = InterviewPrepSession(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=request.job_id,
        job_title=prep_data["job_title"],
        company=prep_data["company"],
        job_description=prep_data["job_description"],
        strengths_overview=prep_data["strengths_overview"],
        improvement_recommendations=prep_data["improvement_recommendations"],
        technical_topics_to_revise=prep_data["technical_topics_to_revise"],
        delivery_tips=prep_data["delivery_tips"],
        questions=prep_data["questions"],
        prepared_count=0,
        total_questions=prep_data["total_questions"],
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get("/", response_model=List[InterviewPrepSessionResponse])
def get_user_interview_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """List all saved interview preparation sessions for the student."""
    sessions = (
        db.query(InterviewPrepSession)
        .filter(InterviewPrepSession.user_id == current_user.id)
        .order_by(InterviewPrepSession.created_at.desc())
        .all()
    )
    return sessions


@router.get("/{session_id}", response_model=InterviewPrepSessionResponse)
def get_interview_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get single interview preparation session with all questions and status."""
    session = (
        db.query(InterviewPrepSession)
        .filter(InterviewPrepSession.id == session_id, InterviewPrepSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview preparation session not found.",
        )
    return session


@router.patch("/{session_id}/questions/{question_id}/toggle-prepared", response_model=InterviewPrepSessionResponse)
def toggle_question_prepared(
    session_id: int,
    question_id: str,
    payload: ToggleQuestionPreparedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Toggle the prepared status of a specific question in a session."""
    session = (
        db.query(InterviewPrepSession)
        .filter(InterviewPrepSession.id == session_id, InterviewPrepSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview preparation session not found.",
        )

    updated_questions = []
    prepared_count = 0

    for q in session.questions:
        q_copy = dict(q)
        if q_copy.get("id") == question_id:
            q_copy["is_prepared"] = payload.is_prepared
        if q_copy.get("is_prepared"):
            prepared_count += 1
        updated_questions.append(q_copy)

    session.questions = updated_questions
    session.prepared_count = prepared_count
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_200_OK)
def delete_interview_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Delete an interview preparation session."""
    session = (
        db.query(InterviewPrepSession)
        .filter(InterviewPrepSession.id == session_id, InterviewPrepSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied.",
        )
    db.delete(session)
    db.commit()
    return {"message": "Interview preparation session deleted successfully", "id": session_id}
