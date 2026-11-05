import datetime
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # "pdf" or "docx"
    file_path = Column(String(512), nullable=True)  # Path to saved file on disk
    is_default = Column(Boolean, default=False)  # Preferred resume for quick analyses
    raw_text = Column(Text, nullable=False)

    # Extracted metadata
    parsed_name = Column(String(255), nullable=True)
    parsed_email = Column(String(255), nullable=True)
    parsed_phone = Column(String(50), nullable=True)
    parsed_links = Column(JSON, default=list)  # List of URLs (GitHub, LinkedIn)

    # Scoring details
    total_score = Column(Float, default=0.0)  # 0 to 100
    score_breakdown = Column(JSON, default=dict)  # Detailed factors breakdown

    # Summary & strengths/improvements
    summary = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    improvement_areas = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    skills = relationship("ResumeSkill", back_populates="resume", cascade="all, delete-orphan")
    education_records = relationship("Education", back_populates="resume", cascade="all, delete-orphan")
    experience_records = relationship("Experience", back_populates="resume", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="resume", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="resume", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="resume", cascade="all, delete-orphan")


class ResumeSkill(Base):
    __tablename__ = "resume_skills"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # Programming, Frameworks, etc.
    proficiency_score = Column(Float, default=70.0)  # Estimated based on frequency & section context
    frequency = Column(Integer, default=1)
    detected_section = Column(String(50), default="skills")

    resume = relationship("Resume", back_populates="skills")


class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String(255), nullable=True)
    degree = Column(String(255), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    gpa = Column(String(50), nullable=True)

    resume = relationship("Resume", back_populates="education_records")


class Experience(Base):
    __tablename__ = "experience"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=True)
    position = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    is_current = Column(Boolean, default=False)

    resume = relationship("Resume", back_populates="experience_records")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)
    technologies = Column(JSON, default=list)  # Extracted technologies
    description = Column(Text, nullable=True)
    link = Column(String(512), nullable=True)

    resume = relationship("Resume", back_populates="projects")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    issuer = Column(String(255), nullable=True)
    issue_date = Column(String(50), nullable=True)

    resume = relationship("Resume", back_populates="certifications")
