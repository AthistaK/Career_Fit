import datetime
from typing import List, Optional
from pydantic import BaseModel


class AchievementItem(BaseModel):
    id: int
    code: str
    title: str
    description: str
    icon: str
    xp_reward: int
    category: str
    unlocked: bool = False
    unlocked_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class GamificationProfileResponse(BaseModel):
    current_xp: int
    level: int
    level_title: str
    next_level_xp: int
    progress_to_next_level: float  # 0 to 100%
    streak_days: int
    unlocked_count: int
    total_achievements: int
    achievements: List[AchievementItem]
