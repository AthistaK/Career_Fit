import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False)  # "resume_ready", "first_match", etc.
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(50), nullable=False)
    xp_reward = Column(Integer, default=100)
    category = Column(String(50), default="Career")  # "Resume", "Matching", "Growth"


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")


class UserXP(Base):
    __tablename__ = "user_xp"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_xp = Column(Integer, default=100)
    level = Column(Integer, default=1)
    level_title = Column(String(100), default="Career Explorer")
    streak_days = Column(Integer, default=1)
    last_active_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="xp_profile")
