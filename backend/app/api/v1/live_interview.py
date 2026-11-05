import datetime
import os
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.live_interview import (
    LiveInterviewSession,
    LiveInterviewTurn,
    LiveInterviewEvaluation,
    LiveInterviewRecording,
)
from app.schemas.live_interview import (
    LiveInterviewSessionCreate,
    LiveInterviewSessionResponse,
    LiveInterviewStartResponse,
    LiveInterviewTurnNextResponse,
    LiveInterviewTurnSubmit,
    LiveInterviewDashboardStats,
)
from app.services.live_interview_service import LiveInterviewService

router = APIRouter(prefix="/live-interview", tags=["AI Live Interview"])

# Directory for secure local video/audio storage
RECORDINGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "recordings")
os.makedirs(RECORDINGS_DIR, exist_ok=True)


@router.post("/sessions", response_model=LiveInterviewSessionResponse)
def create_live_interview_session(
    payload: LiveInterviewSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Configure and create a new live interview session.
    IMPORTANT: No minimum job match eligibility restriction!
    Every authenticated student can practice.
    """
    # 1. Fetch chosen resume or default/latest
    if payload.resume_id:
        resume = (
            db.query(Resume)
            .filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
            .first()
        )
    else:
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.is_default.desc(), Resume.created_at.desc())
            .first()
        )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found in your library. Please upload a resume before starting an interview.",
        )

    # 2. Persist session
    session = LiveInterviewSession(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=payload.job_id,
        job_title=payload.job_title,
        company=payload.company,
        job_description=payload.job_description,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        duration_minutes=payload.duration_minutes,
        status="setup",
        current_question_index=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get("/sessions", response_model=List[LiveInterviewSessionResponse])
def get_user_live_interview_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """List all previous and ongoing live interview sessions for the student."""
    sessions = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.user_id == current_user.id)
        .order_by(LiveInterviewSession.created_at.desc())
        .all()
    )
    return sessions


@router.get("/sessions/{session_id}", response_model=LiveInterviewSessionResponse)
def get_live_interview_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get single live interview session with turns, evaluation, and recording metadata."""
    session = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.id == session_id, LiveInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")
    return session


@router.post("/sessions/{session_id}/start", response_model=LiveInterviewStartResponse)
def start_live_interview_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Transitions session to in_progress and generates the AI interviewer's initial greeting
    and opening question based on the student's selected resume and job description.
    """
    session = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.id == session_id, LiveInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    resume = db.query(Resume).filter(Resume.id == session.resume_id).first() if session.resume_id else None

    # Generate personalized opening turn
    greeting, first_question, question_cat = LiveInterviewService.generate_opening_turn(session, resume)

    # Initialize Turn 1 if not already present
    existing_turn = (
        db.query(LiveInterviewTurn)
        .filter(LiveInterviewTurn.session_id == session.id, LiveInterviewTurn.turn_order == 1)
        .first()
    )
    if not existing_turn:
        turn = LiveInterviewTurn(
            session_id=session.id,
            turn_order=1,
            question_category=question_cat,
            question_text=first_question,
            timestamp_seconds=0.0,
        )
        db.add(turn)
        session.current_question_index = 1
        session.status = "in_progress"
        session.started_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(session)
        db.refresh(turn)
        first_turn_id = turn.id
    else:
        first_turn_id = existing_turn.id

    return {
        "session": session,
        "greeting": greeting,
        "first_question": first_question,
        "first_turn_id": first_turn_id,
        "first_question_category": question_cat,
    }


@router.post("/sessions/{session_id}/turn", response_model=LiveInterviewTurnNextResponse)
def submit_answer_and_get_next_turn(
    session_id: int,
    payload: LiveInterviewTurnSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Submits student's voice transcription or typed answer for current turn.
    AI analyzes the response and formulates dynamic follow-up or next topic question.
    """
    session = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.id == session_id, LiveInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    resume = db.query(Resume).filter(Resume.id == session.resume_id).first() if session.resume_id else None

    # Fetch latest turn
    current_turn = (
        db.query(LiveInterviewTurn)
        .filter(
            LiveInterviewTurn.session_id == session.id,
            LiveInterviewTurn.turn_order == session.current_question_index,
        )
        .first()
    )
    if not current_turn:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active question turn found.")

    # Record student answer
    current_turn.student_transcript = payload.student_transcript
    current_turn.student_audio_duration_seconds = payload.duration_seconds or 0.0
    current_turn.timestamp_seconds = payload.timestamp_seconds or 0.0

    all_turns = (
        db.query(LiveInterviewTurn)
        .filter(LiveInterviewTurn.session_id == session.id)
        .order_by(LiveInterviewTurn.turn_order)
        .all()
    )

    ai_reaction, next_q, next_cat, is_last = LiveInterviewService.generate_dynamic_response_and_next_question(
        session=session,
        resume=resume,
        all_turns=all_turns,
        latest_student_answer=payload.student_transcript,
    )

    current_turn.ai_feedback = ai_reaction

    next_turn_id = None
    if next_q:
        next_order = session.current_question_index + 1
        new_turn = LiveInterviewTurn(
            session_id=session.id,
            turn_order=next_order,
            question_category=next_cat or "Technical Core",
            question_text=next_q,
            timestamp_seconds=payload.timestamp_seconds or 0.0,
        )
        db.add(new_turn)
        session.current_question_index = next_order
        db.commit()
        db.refresh(new_turn)
        next_turn_id = new_turn.id
    else:
        db.commit()

    return {
        "ai_reaction": ai_reaction,
        "next_question": next_q,
        "next_turn_id": next_turn_id,
        "question_category": next_cat,
        "is_last_question": is_last,
        "is_completed": next_q is None,
    }


@router.post("/sessions/{session_id}/finish", response_model=LiveInterviewSessionResponse)
def finish_and_evaluate_interview(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Ends interview, processes all student answers across 7 categories, and generates
    the comprehensive evaluation performance report.
    """
    session = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.id == session_id, LiveInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    resume = db.query(Resume).filter(Resume.id == session.resume_id).first() if session.resume_id else None
    all_turns = (
        db.query(LiveInterviewTurn)
        .filter(LiveInterviewTurn.session_id == session.id)
        .order_by(LiveInterviewTurn.turn_order)
        .all()
    )

    # Run 7-category evaluation
    eval_data = LiveInterviewService.evaluate_completed_interview(
        session=session,
        resume=resume,
        all_turns=all_turns,
    )

    # Persist or update evaluation
    evaluation = (
        db.query(LiveInterviewEvaluation)
        .filter(LiveInterviewEvaluation.session_id == session.id)
        .first()
    )
    if not evaluation:
        evaluation = LiveInterviewEvaluation(
            session_id=session.id,
            overall_score=eval_data["overall_score"],
            technical_score=eval_data["technical_score"],
            relevance_score=eval_data["relevance_score"],
            communication_score=eval_data["communication_score"],
            problem_solving_score=eval_data["problem_solving_score"],
            resume_depth_score=eval_data["resume_depth_score"],
            job_knowledge_score=eval_data["job_knowledge_score"],
            hr_behavioral_score=eval_data["hr_behavioral_score"],
            summary=eval_data["summary"],
            strong_answers=eval_data["strong_answers"],
            answers_needing_improvement=eval_data["answers_needing_improvement"],
            missing_critical_points=eval_data["missing_critical_points"],
            personalized_recommendations=eval_data["personalized_recommendations"],
            topics_to_revise=eval_data["topics_to_revise"],
        )
        db.add(evaluation)
    else:
        for k, v in eval_data.items():
            setattr(evaluation, k, v)

    session.status = "completed"
    session.completed_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(session)

    return session


@router.post("/sessions/{session_id}/recording")
async def upload_interview_recording(
    session_id: int,
    file: UploadFile = File(...),
    duration_seconds: float = Form(0.0),
    consent_given: bool = Form(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Saves student's video/audio recording securely on local storage
    (not as raw blobs in PostgreSQL).
    """
    session = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.id == session_id, LiveInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    # Save to disk
    filename = f"interview_session_{session.id}.webm"
    target_path = os.path.join(RECORDINGS_DIR, filename)

    contents = await file.read()
    with open(target_path, "wb") as f:
        f.write(contents)

    file_size = len(contents)

    # Upsert recording metadata
    recording = (
        db.query(LiveInterviewRecording)
        .filter(LiveInterviewRecording.session_id == session.id)
        .first()
    )
    if not recording:
        recording = LiveInterviewRecording(
            session_id=session.id,
            file_path=target_path,
            file_size_bytes=file_size,
            mime_type=file.content_type or "video/webm",
            duration_seconds=duration_seconds,
            consent_given=consent_given,
        )
        db.add(recording)
    else:
        recording.file_path = target_path
        recording.file_size_bytes = file_size
        recording.mime_type = file.content_type or "video/webm"
        recording.duration_seconds = duration_seconds
        recording.consent_given = consent_given

    db.commit()
    db.refresh(recording)

    return {
        "message": "Recording uploaded successfully.",
        "recording_id": recording.id,
        "file_size_bytes": file_size,
        "duration_seconds": duration_seconds,
    }


@router.get("/sessions/{session_id}/recording")
def stream_interview_recording(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Streams the recorded video/audio for playback.
    Strictly protected: only the authenticated owner can access.
    """
    session = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.id == session_id, LiveInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    recording = (
        db.query(LiveInterviewRecording)
        .filter(LiveInterviewRecording.session_id == session.id)
        .first()
    )
    if not recording or not os.path.exists(recording.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording file not found.")

    return FileResponse(
        path=recording.file_path,
        media_type=recording.mime_type,
        filename=f"interview_{session.id}.webm",
    )


@router.delete("/sessions/{session_id}/recording")
def delete_interview_recording(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Delete recording file and metadata."""
    session = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.id == session_id, LiveInterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    recording = (
        db.query(LiveInterviewRecording)
        .filter(LiveInterviewRecording.session_id == session.id)
        .first()
    )
    if recording:
        if os.path.exists(recording.file_path):
            try:
                os.remove(recording.file_path)
            except OSError:
                pass
        db.delete(recording)
        db.commit()

    return {"message": "Recording deleted successfully."}


@router.get("/dashboard/stats", response_model=LiveInterviewDashboardStats)
def get_live_interview_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Provides high-level student interview statistics for dashboard displays."""
    sessions = (
        db.query(LiveInterviewSession)
        .filter(LiveInterviewSession.user_id == current_user.id)
        .order_by(LiveInterviewSession.created_at.desc())
        .all()
    )

    evaluations = [s.evaluation for s in sessions if s.evaluation]
    total_interviews = len([s for s in sessions if s.status == "completed"])

    if evaluations:
        avg_score = round(sum(e.overall_score for e in evaluations) / len(evaluations), 1)
        tech_avg = round(sum(e.technical_score for e in evaluations) / len(evaluations), 1)
        comm_avg = round(sum(e.communication_score for e in evaluations) / len(evaluations), 1)
        prob_avg = round(sum(e.problem_solving_score for e in evaluations) / len(evaluations), 1)
        latest_score = evaluations[0].overall_score
        latest_id = evaluations[0].session_id
    else:
        avg_score = 0.0
        tech_avg = 0.0
        comm_avg = 0.0
        prob_avg = 0.0
        latest_score = None
        latest_id = None

    return {
        "total_interviews": total_interviews,
        "average_score": avg_score,
        "latest_score": latest_score,
        "latest_session_id": latest_id,
        "technical_avg": tech_avg,
        "communication_avg": comm_avg,
        "problem_solving_avg": prob_avg,
        "recent_sessions": sessions[:5],
    }
