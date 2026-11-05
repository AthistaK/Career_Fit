"""
Gamification and Student Achievement Service for CareerPath.
Manages XP progression, dynamic levels, streak tracking, and verified milestone badge unlocking.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
import datetime
from app.models.achievement import Achievement, UserAchievement, UserXP
from app.schemas.achievement import AchievementItem, GamificationProfileResponse


class GamificationService:
    LEVEL_TITLES = {
        1: "Career Explorer",
        2: "Skill Apprentice",
        3: "Roadmap Navigator",
        4: "Industry Contender",
        5: "Placement Ace",
    }

    @classmethod
    def get_or_create_xp_profile(cls, db: Session, user_id: int) -> UserXP:
        """Get or initialize the user's XP profile."""
        xp_profile = db.query(UserXP).filter(UserXP.user_id == user_id).first()
        if not xp_profile:
            xp_profile = UserXP(
                user_id=user_id,
                current_xp=100,  # Welcome bonus
                level=1,
                level_title=cls.LEVEL_TITLES.get(1, "Career Explorer"),
                streak_days=1,
                last_active_at=datetime.datetime.utcnow(),
            )
            db.add(xp_profile)
            db.commit()
            db.refresh(xp_profile)
        return xp_profile

    @classmethod
    def award_xp(cls, db: Session, user_id: int, points: int) -> UserXP:
        """Add XP to user profile and recalculate level."""
        profile = cls.get_or_create_xp_profile(db, user_id)
        profile.current_xp += points

        # Level formula: Level = (current_xp // 300) + 1
        new_level = (profile.current_xp // 300) + 1
        profile.level = new_level
        profile.level_title = cls.LEVEL_TITLES.get(min(new_level, 5), "Placement Master")
        profile.last_active_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(profile)
        return profile

    @classmethod
    def check_and_unlock_achievement(
        cls, db: Session, user_id: int, code: str
    ) -> Optional[Achievement]:
        """
        Evaluate if an achievement should be unlocked for the user.
        If unlocked for the first time, awards the XP reward.
        """
        achievement = db.query(Achievement).filter(Achievement.code == code).first()
        if not achievement:
            return None

        # Check if already unlocked
        existing = (
            db.query(UserAchievement)
            .filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.id,
            )
            .first()
        )
        if existing:
            return None  # Already unlocked

        # Unlock achievement
        user_ach = UserAchievement(user_id=user_id, achievement_id=achievement.id)
        db.add(user_ach)
        db.commit()

        # Award XP
        cls.award_xp(db, user_id, achievement.xp_reward)
        return achievement

    @classmethod
    def get_user_gamification_overview(
        cls, db: Session, user_id: int
    ) -> GamificationProfileResponse:
        """Fetch the full gamification profile with all achievements and unlock states."""
        xp_profile = cls.get_or_create_xp_profile(db, user_id)
        all_achievements = db.query(Achievement).all()
        user_achievements = (
            db.query(UserAchievement)
            .filter(UserAchievement.user_id == user_id)
            .all()
        )
        unlocked_map = {ua.achievement_id: ua.unlocked_at for ua in user_achievements}

        achievement_items: List[AchievementItem] = []
        for ach in all_achievements:
            is_unlocked = ach.id in unlocked_map
            achievement_items.append(
                AchievementItem(
                    id=ach.id,
                    code=ach.code,
                    title=ach.title,
                    description=ach.description,
                    icon=ach.icon,
                    xp_reward=ach.xp_reward,
                    category=ach.category,
                    unlocked=is_unlocked,
                    unlocked_at=unlocked_map.get(ach.id),
                )
            )

        # Calculate progress to next level
        current_level_base_xp = (xp_profile.level - 1) * 300
        next_level_xp = xp_profile.level * 300
        xp_in_level = xp_profile.current_xp - current_level_base_xp
        progress_pct = round((xp_in_level / 300) * 100, 1)

        return GamificationProfileResponse(
            current_xp=xp_profile.current_xp,
            level=xp_profile.level,
            level_title=xp_profile.level_title,
            next_level_xp=next_level_xp,
            progress_to_next_level=min(100.0, max(0.0, progress_pct)),
            streak_days=xp_profile.streak_days,
            unlocked_count=len(unlocked_map),
            total_achievements=len(all_achievements),
            achievements=achievement_items,
        )
