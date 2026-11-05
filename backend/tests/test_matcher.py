import pytest
from app.services.matcher_service import JobMatcherService
from app.models.resume import Resume, ResumeSkill, Education, Experience, Project


def test_job_matching_breakdown():
    resume = Resume(
        id=1,
        filename="resume.pdf",
        file_type="pdf",
        raw_text="Experienced Python and React engineer with PostgreSQL, Docker, Git, and FastAPI experience.",
        skills=[
            ResumeSkill(name="Python", category="Programming Languages", proficiency_score=85.0, detected_section="skills"),
            ResumeSkill(name="React", category="Frameworks & Libraries", proficiency_score=80.0, detected_section="skills"),
            ResumeSkill(name="PostgreSQL", category="Databases", proficiency_score=80.0, detected_section="skills"),
            ResumeSkill(name="Docker", category="Cloud & DevOps", proficiency_score=75.0, detected_section="projects"),
        ],
        experience_records=[
            Experience(company="SaaS Co", position="Backend Intern", description="Built FastAPI endpoints and PostgreSQL schemas.")
        ],
        projects=[
            Project(title="Web Platform", description="React frontend with Python backend.")
        ],
    )

    job_title = "Junior Python Backend Developer"
    job_description = """
    We are seeking a Junior Backend Developer proficient in Python and PostgreSQL.
    Experience with Docker and FastAPI is required.
    Familiarity with Kubernetes and Figma is a plus.
    """

    result = JobMatcherService.match_resume_to_job(resume, job_title, job_description)

    assert result["overall_match_score"] > 50.0
    matched_names = [s.skill_name for s in result["matched_skills"]]
    partial_names = [s.skill_name for s in result["partial_skills"]]
    missing_names = [s.skill_name for s in result["missing_skills"]]

    assert "Python" in matched_names
    assert "PostgreSQL" in matched_names
    assert "Docker" in matched_names
    # Kubernetes is in "Cloud & DevOps" which candidate knows via Docker -> partial
    assert "Kubernetes" in partial_names
    # Figma is in "Tools & Platforms" which candidate does not have -> missing
    assert "Figma" in missing_names
    assert len(result["score_components"]) == 4
