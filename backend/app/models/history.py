import datetime
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(50), nullable=False)  # "resume_analysis", "job_match", "resume_improvement"
    title = Column(String(255), nullable=False)
    score_value = Column(Float, nullable=False)
    score_delta = Column(Float, default=0.0)  # Change compared to previous analysis (+5.0, etc.)
    summary = Column(Text, nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="history_records")
