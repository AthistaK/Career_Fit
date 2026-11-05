import datetime
from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class InterviewPrepSession(Base):
    __tablename__ = "interview_prep_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)

    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=False)

    # Strategy & Personalized Prep Sections
    strengths_overview = Column(JSON, default=list)
    improvement_recommendations = Column(JSON, default=list)
    technical_topics_to_revise = Column(JSON, default=list)
    delivery_tips = Column(JSON, default=list)

    # Categorized Questions & Guidance list:
    # Each question item is:
    # {
    #   "id": str,
    #   "category": str, # "Resume & Projects" | "Technical Core" | "Job-Specific" | "HR & Behavioral" | "Scenario & Problem Solving"
    #   "question": str,
    #   "why_asked": str,
    #   "suggested_answer": str,
    #   "answer_structure": str,
    #   "important_points": list[str],
    #   "is_prepared": bool
    # }
    questions = Column(JSON, default=list)

    prepared_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", backref="interview_prep_sessions")
    resume = relationship("Resume", backref="interview_prep_sessions")
    job = relationship("Job", backref="interview_prep_sessions")
