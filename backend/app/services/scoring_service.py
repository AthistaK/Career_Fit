"""
Explainable Multi-Factor Resume Scoring Service for CareerPath.
Calculates transparent scores with clear sub-factor contributions and actionable recommendations.
"""

from typing import Any, Dict, List, Tuple
from app.schemas.resume import ParsedResumeData, ScoreBreakdown, ScoreFactor, SkillItem


class ScoringService:
    # Configurable scoring factor weights (Sum = 1.0)
    WEIGHT_SKILLS = 0.40
    WEIGHT_EXPERIENCE = 0.20
    WEIGHT_PROJECTS = 0.20
    WEIGHT_EDUCATION = 0.10
    WEIGHT_STRUCTURE = 0.10

    @classmethod
    def evaluate_skills_factor(cls, skills: List[SkillItem]) -> ScoreFactor:
        """
        Evaluate technical breadth, depth, and category diversity.
        Max raw score: 100
        """
        count = len(skills)
        categories = set(s.category for s in skills)
        cat_count = len(categories)

        # Baseline: 0 skills = 0 score
        if count == 0:
            return ScoreFactor(
                score=0.0,
                max_score=100.0,
                weight=cls.WEIGHT_SKILLS,
                contribution=0.0,
                explanation="No recognized technical or soft skills were detected in the resume.",
                status="insufficient",
            )

        # Quantity score (up to 50 pts: 10 skills = 50 pts)
        qty_score = min(50.0, count * 5.0)
        # Category diversity score (up to 30 pts: 6 categories = 30 pts)
        div_score = min(30.0, cat_count * 6.0)
        # Proficiency depth score (up to 20 pts)
        avg_proficiency = sum(s.proficiency_score for s in skills) / count
        depth_score = (avg_proficiency / 100.0) * 20.0

        raw_score = min(100.0, round(qty_score + div_score + depth_score, 1))
        contribution = round(raw_score * cls.WEIGHT_SKILLS, 1)

        status = "excellent" if raw_score >= 80 else "good" if raw_score >= 60 else "needs_improvement"
        explanation = f"Detected {count} verified skills across {cat_count} domains (Programming, Frameworks, Cloud, etc.) with avg proficiency {avg_proficiency:.0f}%."

        return ScoreFactor(
            score=raw_score,
            max_score=100.0,
            weight=cls.WEIGHT_SKILLS,
            contribution=contribution,
            explanation=explanation,
            status=status,
        )

    @classmethod
    def evaluate_experience_factor(cls, parsed: ParsedResumeData) -> ScoreFactor:
        """Evaluate work experience, internships, and descriptive depth."""
        exp_count = len(parsed.experience)
        if exp_count == 0:
            return ScoreFactor(
                score=30.0,
                max_score=100.0,
                weight=cls.WEIGHT_EXPERIENCE,
                contribution=round(30.0 * cls.WEIGHT_EXPERIENCE, 1),
                explanation="No dedicated internship or professional experience section detected (standard for early college students).",
                status="needs_improvement",
            )

        # Score based on number of roles and bullet point detail
        base_exp = min(60.0, exp_count * 30.0)
        has_dates = any(e.start_date for e in parsed.experience)
        has_detailed_desc = any(len(e.description or "") > 50 for e in parsed.experience)

        quality_bonus = (20.0 if has_dates else 0.0) + (20.0 if has_detailed_desc else 0.0)
        raw_score = min(100.0, round(base_exp + quality_bonus, 1))
        contribution = round(raw_score * cls.WEIGHT_EXPERIENCE, 1)

        status = "excellent" if raw_score >= 80 else "good" if raw_score >= 50 else "needs_improvement"
        explanation = f"Detected {exp_count} role(s) / internships with structured descriptions and timelines."

        return ScoreFactor(
            score=raw_score,
            max_score=100.0,
            weight=cls.WEIGHT_EXPERIENCE,
            contribution=contribution,
            explanation=explanation,
            status=status,
        )

    @classmethod
    def evaluate_projects_factor(cls, parsed: ParsedResumeData) -> ScoreFactor:
        """Evaluate portfolio projects, technical descriptions, and live/code links."""
        proj_count = len(parsed.projects)
        if proj_count == 0:
            return ScoreFactor(
                score=20.0,
                max_score=100.0,
                weight=cls.WEIGHT_PROJECTS,
                contribution=round(20.0 * cls.WEIGHT_PROJECTS, 1),
                explanation="No projects section identified. Hands-on projects are critical for college engineering profiles.",
                status="insufficient",
            )

        # 2+ projects = 60 pts
        count_score = min(60.0, proj_count * 30.0)
        has_links = any(p.link or "http" in (p.description or "") for p in parsed.projects)
        has_details = any(len(p.description or "") > 40 for p in parsed.projects)

        link_bonus = 20.0 if has_links else 0.0
        desc_bonus = 20.0 if has_details else 10.0
        raw_score = min(100.0, round(count_score + link_bonus + desc_bonus, 1))
        contribution = round(raw_score * cls.WEIGHT_PROJECTS, 1)

        status = "excellent" if raw_score >= 80 else "good" if raw_score >= 50 else "needs_improvement"
        explanation = f"Detected {proj_count} project(s) showcasing practical application of tools."

        return ScoreFactor(
            score=raw_score,
            max_score=100.0,
            weight=cls.WEIGHT_PROJECTS,
            contribution=contribution,
            explanation=explanation,
            status=status,
        )

    @classmethod
    def evaluate_education_factor(cls, parsed: ParsedResumeData) -> ScoreFactor:
        """Evaluate educational background, degree program, and GPA."""
        edu_count = len(parsed.education)
        if edu_count == 0:
            return ScoreFactor(
                score=40.0,
                max_score=100.0,
                weight=cls.WEIGHT_EDUCATION,
                contribution=round(40.0 * cls.WEIGHT_EDUCATION, 1),
                explanation="Education section was not explicitly demarcated.",
                status="needs_improvement",
            )

        raw_score = 60.0
        if any(e.degree for e in parsed.education):
            raw_score += 20.0
        if any(e.gpa for e in parsed.education):
            raw_score += 15.0
        if any(e.end_date for e in parsed.education):
            raw_score += 5.0

        raw_score = min(100.0, raw_score)
        contribution = round(raw_score * cls.WEIGHT_EDUCATION, 1)

        return ScoreFactor(
            score=raw_score,
            max_score=100.0,
            weight=cls.WEIGHT_EDUCATION,
            contribution=contribution,
            explanation=f"Identified {edu_count} academic record(s) with degree and graduation timeline.",
            status="excellent" if raw_score >= 80 else "good",
        )

    @classmethod
    def evaluate_structure_factor(cls, parsed: ParsedResumeData) -> ScoreFactor:
        """Evaluate contact completeness (Email, Phone, GitHub/LinkedIn) and formatting."""
        score = 30.0
        details = []
        if parsed.email:
            score += 25.0
            details.append("Email detected")
        if parsed.phone:
            score += 20.0
            details.append("Phone detected")
        if parsed.links and len(parsed.links) > 0:
            score += 25.0
            details.append(f"{len(parsed.links)} portfolio/social links detected")

        raw_score = min(100.0, score)
        contribution = round(raw_score * cls.WEIGHT_STRUCTURE, 1)

        return ScoreFactor(
            score=raw_score,
            max_score=100.0,
            weight=cls.WEIGHT_STRUCTURE,
            contribution=contribution,
            explanation="; ".join(details) if details else "Contact information incomplete.",
            status="excellent" if raw_score >= 80 else "good" if raw_score >= 60 else "needs_improvement",
        )

    @classmethod
    def calculate_resume_score(
        cls, parsed: ParsedResumeData, skills: List[SkillItem]
    ) -> Tuple[float, Dict[str, Any], List[str], List[str]]:
        """
        Compute total explainable resume score, factor breakdown, strengths, and areas to improve.
        """
        f_skills = cls.evaluate_skills_factor(skills)
        f_exp = cls.evaluate_experience_factor(parsed)
        f_proj = cls.evaluate_projects_factor(parsed)
        f_edu = cls.evaluate_education_factor(parsed)
        f_struct = cls.evaluate_structure_factor(parsed)

        total_score = round(
            f_skills.contribution
            + f_exp.contribution
            + f_proj.contribution
            + f_edu.contribution
            + f_struct.contribution,
            1,
        )
        total_score = max(10.0, min(100.0, total_score))

        breakdown = {
            "skills": f_skills.model_dump(),
            "experience": f_exp.model_dump(),
            "projects": f_proj.model_dump(),
            "education": f_edu.model_dump(),
            "structure": f_struct.model_dump(),
            "total_score": total_score,
            "formula_explanation": "Score = 40%(Skills) + 20%(Experience) + 20%(Projects) + 10%(Education) + 10%(Structure & Contact)",
        }

        # Determine explainable strengths
        strengths = []
        if f_skills.score >= 70:
            strengths.append(f"Strong skill catalog: {len(skills)} technical competencies identified.")
        if f_proj.score >= 70:
            strengths.append(f"Demonstrated project practical application with {len(parsed.projects)} project entries.")
        if parsed.links:
            strengths.append("Contains professional portfolio / GitHub / LinkedIn profile links.")
        if f_edu.score >= 80:
            strengths.append("Clear educational background with degree and academic performance.")

        if not strengths:
            strengths.append("Resume successfully extracted and ready for targeted role matching.")

        # Determine explainable improvement areas
        improvements = []
        if f_skills.score < 70:
            improvements.append("Expand core technical skills and add specific frameworks/tools used in projects.")
        if f_proj.score < 70:
            improvements.append("Add 1-2 detailed capstone or web/AI projects with verifiable GitHub links.")
        if f_exp.score < 50:
            improvements.append("Highlight academic coursework, open-source contributions, or technical club roles.")
        if not parsed.links:
            improvements.append("Include your GitHub profile and LinkedIn URL in the header.")

        return total_score, breakdown, strengths, improvements
