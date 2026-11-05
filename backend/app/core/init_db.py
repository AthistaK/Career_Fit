"""
Database initialization and default seed catalog (Achievements, Roles).
"""

from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.models.achievement import Achievement
from app.models.roadmap import CareerRole
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INITIAL_ACHIEVEMENTS = [
    {
        "code": "resume_ready",
        "title": "Resume Ready",
        "description": "Uploaded and completed full analysis on your first resume.",
        "icon": "FileCheck",
        "xp_reward": 150,
        "category": "Resume",
    },
    {
        "code": "first_match",
        "title": "First Job Match",
        "description": "Matched your profile against your first target job description.",
        "icon": "Target",
        "xp_reward": 150,
        "category": "Matching",
    },
    {
        "code": "skills_unlocked_5",
        "title": "Skill Builder",
        "description": "Extracted and verified at least 5 verified technical skills.",
        "icon": "Cpu",
        "xp_reward": 100,
        "category": "Skills",
    },
    {
        "code": "career_explorer",
        "title": "Career Explorer",
        "description": "Generated an interactive career roadmap for your target role.",
        "icon": "Compass",
        "xp_reward": 200,
        "category": "Roadmap",
    },
    {
        "code": "resume_improved",
        "title": "Resume Polished",
        "description": "Explored actionable before/after resume improvements.",
        "icon": "Sparkles",
        "xp_reward": 120,
        "category": "Improvement",
    },
    {
        "code": "high_match_score",
        "title": "Strong Contender",
        "description": "Achieved an overall job match score of 80% or higher.",
        "icon": "Award",
        "xp_reward": 250,
        "category": "Matching",
    },
]

INITIAL_CAREER_ROLES = [
    {
        "title": "AI & Machine Learning Engineer",
        "slug": "ai-engineer",
        "category": "AI / Data",
        "description": "Designs and develops machine learning systems, fine-tunes models, and builds scalable AI inference pipelines.",
        "key_skills": ["Python", "PyTorch", "Machine Learning", "Scikit-Learn", "Deep Learning", "Docker", "FastAPI", "SQL"],
        "industry_demand": "Very High",
        "growth_rate": "+36% (High Growth)",
        "avg_starting_salary": "$95,000 - $135,000",
    },
    {
        "title": "Full Stack Developer",
        "slug": "full-stack-developer",
        "category": "Software Engineering",
        "description": "Builds end-to-end modern web applications spanning responsive frontend user interfaces and robust backend APIs.",
        "key_skills": ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "REST API", "Tailwind CSS", "Git"],
        "industry_demand": "High",
        "growth_rate": "+24% (Steady)",
        "avg_starting_salary": "$80,000 - $115,000",
    },
    {
        "title": "Backend Software Engineer",
        "slug": "backend-engineer",
        "category": "Software Engineering",
        "description": "Architects high-performance microservices, database schemas, secure authentication, and distributed pipelines.",
        "key_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "REST API", "CI/CD", "Linux"],
        "industry_demand": "High",
        "growth_rate": "+22% (High Demand)",
        "avg_starting_salary": "$85,000 - $120,000",
    },
    {
        "title": "Data Analyst / BI Specialist",
        "slug": "data-analyst",
        "category": "Data & Analytics",
        "description": "Transforms raw operational data into actionable dashboards, KPIs, business insights, and predictive models.",
        "key_skills": ["SQL", "Python", "Data Analysis", "Data Visualization", "Pandas", "Excel", "Problem Solving"],
        "industry_demand": "High",
        "growth_rate": "+18% (Growing)",
        "avg_starting_salary": "$70,000 - $95,000",
    },
    {
        "title": "Cloud & DevOps Engineer",
        "slug": "cloud-devops-engineer",
        "category": "Infrastructure",
        "description": "Automates cloud deployments, manages container orchestration, implements CI/CD pipelines, and monitors uptime.",
        "key_skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Shell/Bash", "Git"],
        "industry_demand": "Very High",
        "growth_rate": "+28% (Critical Need)",
        "avg_starting_salary": "$90,000 - $130,000",
    },
]


def init_db():
    """Create all database tables and seed baseline reference catalog."""
    logger.info("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

    db: Session = SessionLocal()
    try:
        # Seed Achievements if table is empty
        existing_achievements_count = db.query(Achievement).count()
        if existing_achievements_count == 0:
            logger.info("Seeding initial achievements catalog...")
            for ach in INITIAL_ACHIEVEMENTS:
                db.add(Achievement(**ach))
            db.commit()

        # Seed Career Roles if table is empty
        existing_roles_count = db.query(CareerRole).count()
        if existing_roles_count == 0:
            logger.info("Seeding standard career roles catalog...")
            for role in INITIAL_CAREER_ROLES:
                db.add(CareerRole(**role))
            db.commit()

        logger.info("Database initialization and reference seeding complete.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database initialization: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
