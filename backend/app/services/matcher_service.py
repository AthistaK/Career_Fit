"""
Explainable Job Match Engine for CareerPath.
Performs semantic skill extraction, categorizes Matched/Partial/Missing skills, and computes weighted match scores.
"""

from typing import Any, Dict, List, Tuple
from app.services.nlp_service import NLPService
from app.models.resume import Resume, ResumeSkill
from app.schemas.job import MatchSkillItem, ExplainableScoreComponent


class JobMatcherService:
    # Match weighting components (Sum = 1.0)
    WEIGHT_SKILL = 0.50
    WEIGHT_EXPERIENCE = 0.20
    WEIGHT_PROJECTS = 0.15
    WEIGHT_KEYWORD_TFIDF = 0.15

    @classmethod
    def match_resume_to_job(
        cls,
        resume: Resume,
        job_title: str,
        job_description: str,
    ) -> Dict[str, Any]:
        """
        Execute explainable matching between candidate resume and job description.
        """
        # 1. Extract job skills using NLP taxonomy
        job_skills = NLPService.extract_skills_from_text(job_description)
        resume_skill_names = {s.name.lower(): s for s in resume.skills}
        resume_skill_categories = set(s.category for s in resume.skills)

        # 2. Categorize job skills into Matched, Partial, Missing
        matched_skills: List[MatchSkillItem] = []
        partial_skills: List[MatchSkillItem] = []
        missing_skills: List[MatchSkillItem] = []

        for js in job_skills:
            js_name_lower = js.name.lower()
            if js_name_lower in resume_skill_names:
                user_skill = resume_skill_names[js_name_lower]
                matched_skills.append(
                    MatchSkillItem(
                        skill_name=js.name,
                        category=js.category,
                        match_type="matched",
                        importance="required",
                        relevance_note=f"Matched from your {user_skill.detected_section} profile.",
                    )
                )
            elif js.category in resume_skill_categories:
                # User has experience in this domain category (e.g., PostgreSQL for MySQL or React for Next.js)
                partial_skills.append(
                    MatchSkillItem(
                        skill_name=js.name,
                        category=js.category,
                        match_type="partial",
                        importance="preferred",
                        relevance_note=f"Partial foundation detected in '{js.category}'.",
                    )
                )
            else:
                missing_skills.append(
                    MatchSkillItem(
                        skill_name=js.name,
                        category=js.category,
                        match_type="missing",
                        importance="required",
                        relevance_note=f"High-priority skill requirement for {job_title}.",
                    )
                )

        total_req_skills = len(job_skills)
        if total_req_skills > 0:
            # Matched gives 1.0 weight, Partial gives 0.5 weight
            skill_score = ((len(matched_skills) * 1.0 + len(partial_skills) * 0.5) / total_req_skills) * 100.0
        else:
            # If job description mentions generic requirements, calculate base from resume breadth
            skill_score = min(80.0, len(resume.skills) * 10.0)

        skill_score = min(100.0, round(skill_score, 1))

        # 3. Experience Match Score
        has_experience = len(resume.experience_records) > 0
        if has_experience:
            # Check if job title keywords appear in experience descriptions
            exp_text = " ".join([f"{e.position} {e.company} {e.description}" for e in resume.experience_records])
            exp_tfidf = NLPService.calculate_tfidf_similarity(job_description, exp_text)
            exp_score = min(100.0, round(50.0 + (exp_tfidf * 0.5), 1))
        else:
            exp_score = 40.0  # College baseline

        # 4. Project Relevance Score
        has_projects = len(resume.projects) > 0
        if has_projects:
            proj_text = " ".join([f"{p.title} {p.description}" for p in resume.projects])
            proj_tfidf = NLPService.calculate_tfidf_similarity(job_description, proj_text)
            proj_score = min(100.0, round(60.0 + (proj_tfidf * 0.4), 1))
        else:
            proj_score = 30.0

        # 5. Full-text TF-IDF Keyword Similarity Score
        tfidf_similarity = NLPService.calculate_tfidf_similarity(resume.raw_text, job_description)

        # 6. Overall Weighted Match Score
        weighted_skill_pts = round(skill_score * cls.WEIGHT_SKILL, 1)
        weighted_exp_pts = round(exp_score * cls.WEIGHT_EXPERIENCE, 1)
        weighted_proj_pts = round(proj_score * cls.WEIGHT_PROJECTS, 1)
        weighted_tfidf_pts = round(tfidf_similarity * cls.WEIGHT_KEYWORD_TFIDF, 1)

        overall_score = round(
            weighted_skill_pts + weighted_exp_pts + weighted_proj_pts + weighted_tfidf_pts, 1
        )
        overall_score = max(15.0, min(99.0, overall_score))

        # 7. Formulate Explainable Breakdown Components
        score_components = [
            ExplainableScoreComponent(
                name="Direct Skills Match",
                weight=cls.WEIGHT_SKILL,
                raw_score=skill_score,
                weighted_points=weighted_skill_pts,
                description=f"Matched {len(matched_skills)} exact and {len(partial_skills)} partial skills out of {total_req_skills} job requirements.",
                breakdown_details=[f"Matched: {', '.join([s.skill_name for s in matched_skills[:4]]) or 'None'}"],
            ),
            ExplainableScoreComponent(
                name="Experience & Role Alignment",
                weight=cls.WEIGHT_EXPERIENCE,
                raw_score=exp_score,
                weighted_points=weighted_exp_pts,
                description=f"Evaluates past internships and work experience against role expectations.",
                breakdown_details=[f"{len(resume.experience_records)} experience records identified."],
            ),
            ExplainableScoreComponent(
                name="Project Practical Relevance",
                weight=cls.WEIGHT_PROJECTS,
                raw_score=proj_score,
                weighted_points=weighted_proj_pts,
                description="Measures alignment of academic and hands-on projects with job tech stack.",
                breakdown_details=[f"{len(resume.projects)} project entries analyzed for tech relevance."],
            ),
            ExplainableScoreComponent(
                name="Semantic Keyword Similarity",
                weight=cls.WEIGHT_KEYWORD_TFIDF,
                raw_score=tfidf_similarity,
                weighted_points=weighted_tfidf_pts,
                description="TF-IDF cosine similarity measuring holistic vocabulary and domain alignment.",
                breakdown_details=[f"Cosine similarity index: {tfidf_similarity}%."],
            ),
        ]

        # 8. Actionable recommendations
        recommendations = []
        if missing_skills:
            top_missing = [s.skill_name for s in missing_skills[:3]]
            recommendations.append(
                f"Bridge critical skill gaps by acquiring or documenting: {', '.join(top_missing)}."
            )
        if partial_skills:
            top_partial = [s.skill_name for s in partial_skills[:2]]
            recommendations.append(
                f"Highlight related experience with {', '.join(top_partial)} in your project descriptions."
            )
        if tfidf_similarity < 40:
            recommendations.append(
                "Incorporate domain-specific terminology from the job description naturally into your summary and project bullets."
            )
        if not recommendations:
            recommendations.append("Your profile shows exceptional alignment with this role. Prepare for technical interviews!")

        summary = f"Your profile achieves an overall {overall_score:.0f}% match with {job_title}. You satisfy {len(matched_skills)} core requirements with {len(missing_skills)} key skill gaps to bridge."

        return {
            "overall_match_score": overall_score,
            "skill_match_score": skill_score,
            "experience_match_score": exp_score,
            "project_match_score": proj_score,
            "keyword_similarity_score": tfidf_similarity,
            "matched_skills": matched_skills,
            "partial_skills": partial_skills,
            "missing_skills": missing_skills,
            "matched_skills_count": len(matched_skills),
            "partial_skills_count": len(partial_skills),
            "missing_skills_count": len(missing_skills),
            "score_components": score_components,
            "summary": summary,
            "recommendations": recommendations,
        }
