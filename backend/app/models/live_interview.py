import datetime
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class LiveInterviewSession(Base):
    __tablename__ = "live_interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)

    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=False)

    interview_type = Column(String(50), default="combined")  # "technical" | "hr" | "combined"
    difficulty = Column(String(50), default="intermediate")  # "beginner" | "intermediate" | "advanced"
    duration_minutes = Column(Integer, default=15)  # 10, 15, 20

    status = Column(String(50), default="setup")  # "setup" | "in_progress" | "completed" | "abandoned"
    current_question_index = Column(Integer, default=0)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", backref="live_interview_sessions")
    resume = relationship("Resume", backref="live_interview_sessions")
    job = relationship("Job", backref="live_interview_sessions")
    turns = relationship(
        "LiveInterviewTurn",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="LiveInterviewTurn.turn_order",
    )
    evaluation = relationship(
        "LiveInterviewEvaluation",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )
    recording = relationship(
        "LiveInterviewRecording",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )


class LiveInterviewTurn(Base):
    __tablename__ = "live_interview_turns"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("live_interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    turn_order = Column(Integer, nullable=False)  # 1, 2, 3...
    question_category = Column(String(100), default="Technical Core")
    question_text = Column(Text, nullable=False)
    student_transcript = Column(Text, nullable=True)
    student_audio_duration_seconds = Column(Float, default=0.0)
    ai_feedback = Column(Text, nullable=True)
    timestamp_seconds = Column(Float, default=0.0)  # Offset from interview start for video jumping
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("LiveInterviewSession", back_populates="turns")


class LiveInterviewEvaluation(Base):
    __tablename__ = "live_interview_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("live_interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    overall_score = Column(Float, default=0.0)  # 0 to 100
    technical_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    problem_solving_score = Column(Float, default=0.0)
    resume_depth_score = Column(Float, default=0.0)
    job_knowledge_score = Column(Float, default=0.0)
    hr_behavioral_score = Column(Float, default=0.0)

    summary = Column(Text, nullable=True)
    strong_answers = Column(JSON, default=list)
    answers_needing_improvement = Column(JSON, default=list)
    missing_critical_points = Column(JSON, default=list)
    personalized_recommendations = Column(JSON, default=list)
    topics_to_revise = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("LiveInterviewSession", back_populates="evaluation")


class LiveInterviewRecording(Base):
    __tablename__ = "live_interview_recordings"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("live_interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    file_path = Column(String(512), nullable=False)  # Path on disk
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="video/webm")
    duration_seconds = Column(Float, default=0.0)
    consent_given = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("LiveInterviewSession", back_populates="recording")
