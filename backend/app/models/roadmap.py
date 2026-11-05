import datetime
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class CareerRole(Base):
    __tablename__ = "career_roles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    key_skills = Column(JSON, default=list)
    industry_demand = Column(String(50), default="High")
    growth_rate = Column(String(50), default="+22% (Next 5 years)")
    avg_starting_salary = Column(String(100), default="$85,000 - $115,000")


class CareerRoadmap(Base):
    __tablename__ = "career_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_role_title = Column(String(100), nullable=False)
    overall_readiness = Column(Float, default=0.0)  # 0 to 100
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
    milestones = relationship("RoadmapMilestone", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapMilestone.order")


class RoadmapMilestone(Base):
    __tablename__ = "roadmap_milestones"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("career_roadmaps.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)  # 1, 2, 3, 4, 5
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(50), default="future")  # "completed", "in_progress", "next", "future"
    progress_percentage = Column(Float, default=0.0)
    description = Column(Text, nullable=False)
    skills = Column(JSON, default=list)
    action_items = Column(JSON, default=list)

    roadmap = relationship("CareerRoadmap", back_populates="milestones")
