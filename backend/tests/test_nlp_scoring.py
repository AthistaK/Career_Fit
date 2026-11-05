import pytest
from app.services.nlp_service import NLPService
from app.services.scoring_service import ScoringService
from app.schemas.resume import ParsedResumeData, EducationItem, ProjectItem, ExperienceItem, SkillItem


def test_skill_extraction_taxonomy():
    sample_text = """
    Athista K
    Computer Science Student
    Proficient in Python, React, PostgreSQL, Docker, and Machine Learning.
    Familiar with Git, FastAPI, and Tailwind CSS. Strong Problem Solving skills.
    """
    skills = NLPService.extract_skills_from_text(sample_text)
    skill_names = [s.name for s in skills]

    assert "Python" in skill_names
    assert "React" in skill_names
    assert "PostgreSQL" in skill_names
    assert "Docker" in skill_names
    assert "Machine Learning" in skill_names
    assert "FastAPI" in skill_names
    assert "Problem Solving" in skill_names


def test_tfidf_cosine_similarity():
    text_a = "Python software engineer with machine learning and backend FastAPI skills."
    text_b = "Looking for Python backend developer skilled in FastAPI and machine learning."
    text_c = "Accountant with experience in auditing tax and financial balance sheets."

    sim_high = NLPService.calculate_tfidf_similarity(text_a, text_b)
    sim_low = NLPService.calculate_tfidf_similarity(text_a, text_c)

    assert sim_high > 20.0
    assert sim_high > sim_low
    assert sim_low < 5.0


def test_explainable_resume_scoring():
    skills = [
        SkillItem(name="Python", category="Programming Languages", proficiency_score=85.0),
        SkillItem(name="PostgreSQL", category="Databases", proficiency_score=80.0),
        SkillItem(name="React", category="Frameworks & Libraries", proficiency_score=75.0),
        SkillItem(name="Docker", category="Cloud & DevOps", proficiency_score=70.0),
        SkillItem(name="Git", category="Cloud & DevOps", proficiency_score=80.0),
    ]

    parsed = ParsedResumeData(
        name="Candidate Test",
        email="test@example.com",
        phone="+1 234 567 8900",
        links=["https://github.com/test"],
        education=[EducationItem(institution="MIT", degree="B.Tech Computer Science", gpa="8.8/10")],
        projects=[ProjectItem(title="CareerPath AI", description="Built FastAPI app with PostgreSQL", link="https://github.com/test/app")],
        experience=[ExperienceItem(company="Tech Corp", position="Software Intern", start_date="2025-06", description="Developed backend APIs")],
    )

    total_score, breakdown, strengths, improvements = ScoringService.calculate_resume_score(parsed, skills)

    assert 60.0 <= total_score <= 100.0
    assert "skills" in breakdown
    assert "experience" in breakdown
    assert "projects" in breakdown
    assert len(strengths) > 0
