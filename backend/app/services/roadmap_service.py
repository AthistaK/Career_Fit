"""
Interactive Career Roadmap Generator for CareerPath.
Constructs personalized step-by-step career roadmaps based on real user skills and target roles.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.roadmap import CareerRoadmap, RoadmapMilestone, CareerRole
from app.models.resume import Resume
from app.schemas.roadmap import CareerRoadmapResponse, MilestoneItem


class RoadmapService:
    @classmethod
    def generate_or_update_roadmap(
        cls, db: Session, user_id: int, target_role_title: str, resume: Optional[Resume] = None
    ) -> CareerRoadmap:
        """
        Generate or refresh an interactive milestone roadmap tailored to candidate's verified skills.
        """
        user_skills = {s.name.lower() for s in (resume.skills if resume else [])}

        # Look for existing roadmap for this user and target role
        roadmap = (
            db.query(CareerRoadmap)
            .filter(
                CareerRoadmap.user_id == user_id,
                CareerRoadmap.target_role_title == target_role_title,
            )
            .first()
        )

        if not roadmap:
            roadmap = CareerRoadmap(
                user_id=user_id,
                target_role_title=target_role_title,
                overall_readiness=0.0,
            )
            db.add(roadmap)
            db.flush()
        else:
            # Clear old milestones to regenerate updated progression
            db.query(RoadmapMilestone).filter(RoadmapMilestone.roadmap_id == roadmap.id).delete()

        # Define 5 milestone templates dynamically adjusted for target role
        is_ai = "ai" in target_role_title.lower() or "machine learning" in target_role_title.lower()
        is_devops = "devops" in target_role_title.lower() or "cloud" in target_role_title.lower()
        is_data = "data" in target_role_title.lower()

        if is_ai:
            milestones_config = [
                {
                    "order": 1,
                    "title": "Master Core Python & Numerical Computing",
                    "category": "Foundations",
                    "skills": ["Python", "NumPy", "Pandas", "Git"],
                    "description": "Solidify object-oriented Python, data manipulation with NumPy/Pandas, and version control.",
                    "action_items": ["Build 3 algorithmic data scripts", "Publish code to GitHub"],
                },
                {
                    "order": 2,
                    "title": "Learn Classical ML & Scikit-Learn",
                    "category": "Machine Learning",
                    "skills": ["Machine Learning", "Scikit-Learn", "SQL"],
                    "description": "Understand regression, classification, clustering, hyperparameter tuning, and relational databases.",
                    "action_items": ["Complete Kaggle EDA competition", "Train regression and classification pipelines"],
                },
                {
                    "order": 3,
                    "title": "Deep Learning & Neural Architectures",
                    "category": "Deep Learning",
                    "skills": ["PyTorch", "Deep Learning", "Natural Language Processing"],
                    "description": "Implement CNNs, Transformers, and NLP fine-tuning workflows.",
                    "action_items": ["Train an image or text classification model", "Deploy inference script"],
                },
                {
                    "order": 4,
                    "title": "Production Deployment & Containerization",
                    "category": "Engineering",
                    "skills": ["FastAPI", "Docker", "REST API"],
                    "description": "Wrap AI models in high-performance FastAPI microservices and containerize with Docker.",
                    "action_items": ["Containerize AI model server", "Write API test suite"],
                },
                {
                    "order": 5,
                    "title": "Industry Internship & Placement Readiness",
                    "category": "Career",
                    "skills": ["Problem Solving", "Communication"],
                    "description": "Complete 50+ DSA problems, build a capstone portfolio demo, and undergo mock interviews.",
                    "action_items": ["Host live portfolio demo", "Apply for AI/ML engineering internships"],
                },
            ]
        elif is_devops:
            milestones_config = [
                {
                    "order": 1,
                    "title": "Linux, Shell & Version Control Mastery",
                    "category": "Foundations",
                    "skills": ["Linux", "Shell/Bash", "Git"],
                    "description": "Master command-line administration, shell automation, and Git branching workflows.",
                    "action_items": ["Write bash backup scripts", "Manage Linux permissions"],
                },
                {
                    "order": 2,
                    "title": "Containerization with Docker & Compose",
                    "category": "Containers",
                    "skills": ["Docker", "Python", "REST API"],
                    "description": "Build multi-stage Dockerfiles and orchestrate multi-container services with compose.",
                    "action_items": ["Create optimized Docker images", "Orchestrate app + database stack"],
                },
                {
                    "order": 3,
                    "title": "Continuous Integration & Deployment (CI/CD)",
                    "category": "Automation",
                    "skills": ["CI/CD", "PostgreSQL"],
                    "description": "Design automated GitHub Actions pipelines with testing, linting, and automated building.",
                    "action_items": ["Configure automated test runner workflow", "Implement staging deploy step"],
                },
                {
                    "order": 4,
                    "title": "Cloud Infrastructure & Kubernetes",
                    "category": "Cloud",
                    "skills": ["AWS", "Kubernetes", "Terraform"],
                    "description": "Deploy applications on AWS (EC2/S3/EKS) and manage infrastructure via code.",
                    "action_items": ["Provision cloud VPC via Terraform", "Deploy sample cluster"],
                },
                {
                    "order": 5,
                    "title": "Production Monitoring & Career Launch",
                    "category": "Career",
                    "skills": ["Problem Solving", "Teamwork"],
                    "description": "Implement log aggregation, metrics monitoring, and prepare for DevOps placements.",
                    "action_items": ["Set up Prometheus/Grafana dashboard", "Practice SRE incident interviews"],
                },
            ]
        else:  # Full Stack / Software Engineering (Default)
            milestones_config = [
                {
                    "order": 1,
                    "title": "Core Languages & Data Structures",
                    "category": "Foundations",
                    "skills": ["JavaScript", "TypeScript", "Python", "Git"],
                    "description": "Master async programming, strict typing with TypeScript, and Git version control.",
                    "action_items": ["Solve 30 DSA questions", "Create well-structured GitHub repositories"],
                },
                {
                    "order": 2,
                    "title": "Modern Frontend & Component Architecture",
                    "category": "Frontend",
                    "skills": ["React", "Tailwind CSS", "HTML5", "CSS3"],
                    "description": "Build interactive, accessible, and responsive user interfaces with React and Tailwind.",
                    "action_items": ["Build responsive SPA with routing", "Integrate state management"],
                },
                {
                    "order": 3,
                    "title": "Backend Microservices & Databases",
                    "category": "Backend",
                    "skills": ["Node.js", "Express", "FastAPI", "PostgreSQL", "SQL"],
                    "description": "Design relational database schemas, REST APIs, and secure JWT authentication.",
                    "action_items": ["Design PostgreSQL schema with migrations", "Implement CRUD API with auth"],
                },
                {
                    "order": 4,
                    "title": "Full Stack Capstone & Containerization",
                    "category": "Portfolio",
                    "skills": ["Docker", "REST API", "CI/CD"],
                    "description": "Ship a production-grade full-stack SaaS project with containerized deployment.",
                    "action_items": ["Deploy project to cloud with CI/CD", "Write end-to-end documentation"],
                },
                {
                    "order": 5,
                    "title": "System Design & Placement Ready",
                    "category": "Career",
                    "skills": ["Problem Solving", "Communication"],
                    "description": "Learn basic system design concepts (caching, indexing, load balancing) and mock interview practice.",
                    "action_items": ["Complete 3 mock technical interviews", "Apply for software engineering roles"],
                },
            ]

        # Calculate status and progress dynamically for each milestone
        total_milestone_progress = 0.0
        milestone_objects = []

        for item in milestones_config:
            req_skills = item["skills"]
            matched_count = sum(1 for s in req_skills if s.lower() in user_skills)
            pct = (matched_count / len(req_skills)) * 100.0 if req_skills else 0.0

            if pct >= 80.0:
                status = "completed"
                progress = 100.0
            elif pct >= 30.0:
                status = "in_progress"
                progress = max(40.0, pct)
            elif item["order"] == 1 or (milestone_objects and milestone_objects[-1].status == "completed"):
                status = "next"
                progress = max(10.0, pct)
            else:
                status = "future"
                progress = pct

            total_milestone_progress += progress

            ms = RoadmapMilestone(
                roadmap_id=roadmap.id,
                order=item["order"],
                title=item["title"],
                category=item["category"],
                status=status,
                progress_percentage=round(progress, 1),
                description=item["description"],
                skills=item["skills"],
                action_items=item["action_items"],
            )
            db.add(ms)
            milestone_objects.append(ms)

        overall_readiness = round(total_milestone_progress / len(milestones_config), 1)
        roadmap.overall_readiness = overall_readiness
        db.commit()
        db.refresh(roadmap)

        return roadmap
