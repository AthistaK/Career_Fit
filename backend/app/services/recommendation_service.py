"""
Career Role Recommendation & Skill Gap Prioritization Service for CareerPath.
"""

from typing import List
from sqlalchemy.orm import Session
from app.models.roadmap import CareerRole
from app.models.resume import Resume
from app.schemas.roadmap import CareerRoleRecommendation


class RecommendationService:
    @classmethod
    def get_role_recommendations_for_resume(
        cls, db: Session, resume: Resume
    ) -> List[CareerRoleRecommendation]:
        """
        Calculate career role alignment and prioritized skill gaps based on the user's analyzed resume.
        """
        roles = db.query(CareerRole).all()
        if not roles:
            return []

        user_skills_set = {s.name.lower() for s in resume.skills}
        recommendations: List[CareerRoleRecommendation] = []

        for role in roles:
            role_skills = role.key_skills or []
            if not role_skills:
                continue

            matched = []
            missing = []

            for sk in role_skills:
                if sk.lower() in user_skills_set:
                    matched.append(sk)
                else:
                    missing.append(sk)

            match_pct = round((len(matched) / len(role_skills)) * 100, 1)

            if match_pct >= 60:
                priority = "High Match"
                reason = f"You possess {len(matched)} of {len(role_skills)} key skills for this role. Only a few domain tools needed."
            elif match_pct >= 35:
                priority = "Emerging Match"
                reason = f"Strong foundational overlap ({len(matched)} matched). Bridging {len(missing)} skills will make you placement-ready."
            else:
                priority = "Pivot Role"
                reason = f"High-growth adjacent career path. Requires focused skill acquisition in {', '.join(missing[:3])}."

            recommendations.append(
                CareerRoleRecommendation(
                    id=role.id,
                    title=role.title,
                    category=role.category,
                    description=role.description,
                    match_percentage=match_pct,
                    matched_skills=matched,
                    missing_skills=missing,
                    industry_demand=role.industry_demand,
                    growth_rate=role.growth_rate,
                    avg_starting_salary=role.avg_starting_salary,
                    recommended_reason=reason,
                    priority_level=priority,
                )
            )

        # Sort by match percentage descending
        recommendations.sort(key=lambda r: r.match_percentage, reverse=True)
        return recommendations
