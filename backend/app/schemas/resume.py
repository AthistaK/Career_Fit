import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class SkillItem(BaseModel):
    name: str
    category: str
    proficiency_score: float = 70.0
    frequency: int = 1
    detected_section: str = "skills"


class EducationItem(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None


class ExperienceItem(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    is_current: bool = False


class ProjectItem(BaseModel):
    title: Optional[str] = None
    technologies: List[str] = []
    description: Optional[str] = None
    link: Optional[str] = None


class CertificationItem(BaseModel):
    name: str
    issuer: Optional[str] = None
    issue_date: Optional[str] = None


class ScoreFactor(BaseModel):
    score: float
    max_score: float
    weight: float
    contribution: float
    explanation: str
    status: str  # "excellent", "good", "needs_improvement", "insufficient"


class ScoreBreakdown(BaseModel):
    skills_score: ScoreFactor
    experience_score: ScoreFactor
    projects_score: ScoreFactor
    education_score: ScoreFactor
    structure_score: ScoreFactor
    total_score: float
    formula_explanation: str


class ParsedResumeData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    links: List[str] = []
    skills: List[SkillItem] = []
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []


class ResumeAnalysisResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_path: Optional[str] = None
    is_default: bool = False
    raw_text: Optional[str] = None
    parsed_name: Optional[str] = None
    parsed_email: Optional[str] = None
    parsed_phone: Optional[str] = None
    parsed_links: List[str] = []
    total_score: float
    score_breakdown: Dict[str, Any]
    summary: Optional[str] = None
    strengths: List[str] = []
    improvement_areas: List[str] = []
    skills: List[SkillItem] = []
    education_records: List[EducationItem] = []
    experience_records: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeImprovementSuggestion(BaseModel):
    section: str
    original_text: str
    improved_text: str
    reason: str
    impact_metric: str
