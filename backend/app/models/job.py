import datetime
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)  # Standardized skills required
    preferred_skills = Column(JSON, default=list)  # Standardized skills preferred
    extracted_experience_years = Column(Float, nullable=True)
    extracted_education_level = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    # Computed match scores (0 to 100)
    overall_match_score = Column(Float, nullable=False)
    skill_match_score = Column(Float, nullable=False)
    experience_match_score = Column(Float, nullable=False)
    project_match_score = Column(Float, nullable=False)
    keyword_similarity_score = Column(Float, nullable=False)

    # Detailed explainable breakdown
    score_explanation = Column(JSON, default=dict)
    summary = Column(Text, nullable=True)
    recommendations = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="job_matches")
    resume = relationship("Resume", back_populates="job_matches")
    job = relationship("Job", back_populates="matches")
    match_skills = relationship("MatchSkill", back_populates="job_match", cascade="all, delete-orphan")


class MatchSkill(Base):
    __tablename__ = "match_skills"

    id = Column(Integer, primary_key=True, index=True)
    job_match_id = Column(Integer, ForeignKey("job_matches.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    match_type = Column(String(20), nullable=False)  # "matched", "partial", "missing"
    importance = Column(String(20), default="required")  # "required" or "preferred"
    relevance_note = Column(String(255), nullable=True)

    job_match = relationship("JobMatch", back_populates="match_skills")
