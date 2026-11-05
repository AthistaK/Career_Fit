import os
import datetime
from typing import Any, List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import (
    Resume,
    ResumeSkill,
    Education,
    Experience,
    Project,
    Certification,
)
from app.models.history import AnalysisHistory
from app.models.job import JobMatch
from app.models.interview import InterviewPrepSession
from app.schemas.resume import (
    ResumeAnalysisResponse,
    ResumeImprovementSuggestion,
    SkillItem,
    EducationItem,
    ExperienceItem,
    ProjectItem,
    CertificationItem,
)
from app.services.parser_service import ResumeParserService
from app.services.nlp_service import NLPService
from app.services.scoring_service import ScoringService
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("/upload", response_model=ResumeAnalysisResponse)
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Upload a PDF or DOCX resume, parse text, extract skills, compute explainable score, and persist relational models.
    """
    # 1. Validate file extension and size
    filename = file.filename or "resume.pdf"
    ext = "." + filename.lower().split(".")[-1]
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # 2. Parse document text and section boundaries
    try:
        raw_text, parsed_data, sections = ResumeParserService.parse_document(file_bytes, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract readable content from resume: {str(e)}",
        )

    # 3. Save physical file to disk for downloading later
    upload_dir = os.path.join(os.getcwd(), "uploads", "resumes")
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"user_{current_user.id}_{int(datetime.datetime.utcnow().timestamp())}_{filename.replace(' ', '_')}"
    saved_path = os.path.join(upload_dir, safe_name)
    try:
        with open(saved_path, "wb") as f:
            f.write(file_bytes)
    except Exception:
        saved_path = None

    # 4. Extract skills using curated taxonomy & section weighting
    extracted_skills = NLPService.extract_skills_from_text(raw_text, sections)

    # 5. Compute explainable multi-factor resume score
    total_score, score_breakdown, strengths, improvements = ScoringService.calculate_resume_score(
        parsed_data, extracted_skills
    )

    # 6. Check previous resume score to compute delta
    previous_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    score_delta = round(total_score - previous_resume.total_score, 1) if previous_resume else 0.0

    # 7. Check if this should be default resume
    has_default = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id, Resume.is_default == True)
        .first()
    )
    is_default = not bool(has_default)

    # 8. Save Resume model
    db_resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_type=ext.replace(".", ""),
        file_path=saved_path,
        is_default=is_default,
        raw_text=raw_text,
        parsed_name=parsed_data.name or current_user.full_name,
        parsed_email=parsed_data.email or current_user.email,
        parsed_phone=parsed_data.phone,
        parsed_links=parsed_data.links,
        total_score=total_score,
        score_breakdown=score_breakdown,
        summary=sections.get("summary") or f"Profile analyzed for {parsed_data.name or current_user.full_name}.",
        strengths=strengths,
        improvement_areas=improvements,
    )
    db.add(db_resume)
    db.flush()

    # 9. Persist skills
    for s in extracted_skills:
        db_skill = ResumeSkill(
            resume_id=db_resume.id,
            name=s.name,
            category=s.category,
            proficiency_score=s.proficiency_score,
            frequency=s.frequency,
            detected_section=s.detected_section,
        )
        db.add(db_skill)

    # 10. Persist education
    for edu in parsed_data.education:
        db_edu = Education(
            resume_id=db_resume.id,
            institution=edu.institution,
            degree=edu.degree,
            gpa=edu.gpa,
            end_date=edu.end_date,
        )
        db.add(db_edu)

    # 11. Persist experience
    for exp in parsed_data.experience:
        db_exp = Experience(
            resume_id=db_resume.id,
            company=exp.company,
            position=exp.position,
            start_date=exp.start_date,
            description=exp.description,
            is_current=exp.is_current,
        )
        db.add(db_exp)

    # 12. Persist projects
    for proj in parsed_data.projects:
        db_proj = Project(
            resume_id=db_resume.id,
            title=proj.title,
            description=proj.description,
            link=proj.link,
        )
        db.add(db_proj)

    # 13. Record in AnalysisHistory
    history_entry = AnalysisHistory(
        user_id=current_user.id,
        resume_id=db_resume.id,
        action_type="resume_analysis",
        title=f"Analyzed {filename}",
        score_value=total_score,
        score_delta=score_delta,
        summary=f"Detected {len(extracted_skills)} skills with overall resume score of {total_score}/100.",
        details=score_breakdown,
    )
    db.add(history_entry)
    db.commit()
    db.refresh(db_resume)

    # 14. Trigger Gamification Achievements & XP
    GamificationService.check_and_unlock_achievement(db, current_user.id, "resume_ready")
    if len(extracted_skills) >= 5:
        GamificationService.check_and_unlock_achievement(db, current_user.id, "skills_unlocked_5")

    return db_resume


@router.get("/", response_model=List[ResumeAnalysisResponse])
def get_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """List all resumes uploaded by the current user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return resumes


@router.get("/latest", response_model=ResumeAnalysisResponse)
def get_latest_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get the preferred default resume or most recently uploaded resume for the user."""
    # First check default
    default_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id, Resume.is_default == True)
        .first()
    )
    if default_resume:
        return default_resume

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume has been uploaded yet.",
        )
    return resume


@router.get("/{resume_id}", response_model=ResumeAnalysisResponse)
def get_resume_by_id(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get structured details of a specific resume."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied.",
        )
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Delete a resume from user's library. Safely preserves historical analysis and match records.
    """
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied.",
        )

    # Safely nullify foreign keys in historical records to preserve user data
    db.query(AnalysisHistory).filter(AnalysisHistory.resume_id == resume_id).update({"resume_id": None})
    db.query(JobMatch).filter(JobMatch.resume_id == resume_id).update({"resume_id": None})
    db.query(InterviewPrepSession).filter(InterviewPrepSession.resume_id == resume_id).update({"resume_id": None})

    # Remove physical file if present
    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass

    was_default = resume.is_default
    db.delete(resume)
    db.commit()

    # If deleted resume was default, assign next most recent resume as default
    if was_default:
        next_resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
            .first()
        )
        if next_resume:
            next_resume.is_default = True
            db.commit()

    return {"message": "Resume deleted successfully", "id": resume_id}


@router.get("/{resume_id}/download")
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Download the original uploaded resume file (PDF/DOCX) or plain text document."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    if resume.file_path and os.path.exists(resume.file_path):
        media_type = "application/pdf" if resume.file_type == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return FileResponse(
            path=resume.file_path,
            filename=resume.filename,
            media_type=media_type,
        )

    # Fallback plain text stream
    return PlainTextResponse(
        content=resume.raw_text,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{resume.filename}.txt"'},
    )


@router.patch("/{resume_id}/set-default", response_model=ResumeAnalysisResponse)
def set_default_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Set a specific resume as the user's default/active resume."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    db.query(Resume).filter(Resume.user_id == current_user.id).update({"is_default": False})
    resume.is_default = True
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/{resume_id}/improvements", response_model=List[ResumeImprovementSuggestion])
def get_resume_improvements(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Generate context-aware before/after improvement suggestions based on user's real resume entries."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    suggestions: List[ResumeImprovementSuggestion] = []

    # 1. Check Projects for action verbs & quantifiable metrics
    if resume.projects:
        for proj in resume.projects[:2]:
            desc = proj.description or "Worked on project using technical tools."
            improved = f"Architected and deployed {proj.title or 'web service'} utilizing modern components, optimizing query response latency by 35%."
            suggestions.append(
                ResumeImprovementSuggestion(
                    section="Projects",
                    original_text=desc[:180],
                    improved_text=improved,
                    reason="Replaced passive description with strong action verbs ('Architected', 'Deployed') and quantified impact metrics.",
                    impact_metric="+25% Recruiter Engagement",
                )
            )

    # 2. Check Experience
    if resume.experience_records:
        for exp in resume.experience_records[:2]:
            desc = exp.description or "Assisted with daily technical responsibilities."
            improved = f"Spearheaded feature development at {exp.company or 'tech team'} using industry best practices, accelerating delivery cycle by 20%."
            suggestions.append(
                ResumeImprovementSuggestion(
                    section="Experience",
                    original_text=desc[:180],
                    improved_text=improved,
                    reason="Demonstrated leadership ('Spearheaded') and quantified team contribution.",
                    impact_metric="+30% Impact Score",
                )
            )

    # 3. If no projects/experience, provide foundational improvement
    if not suggestions:
        suggestions.append(
            ResumeImprovementSuggestion(
                section="Summary",
                original_text=resume.summary or "Seeking an entry-level software position.",
                improved_text=f"Proactive Computer Science student skilled in {', '.join([s.name for s in resume.skills[:3]]) or 'Python & Web Development'}, passionate about engineering robust scalable software and solving real-world challenges.",
                reason="Transformed generic objective into a tailored skill-backed summary statement.",
                impact_metric="+40% Profile Clarity",
            )
        )

    # Unlock improvement achievement
    GamificationService.check_and_unlock_achievement(db, current_user.id, "resume_improved")
    return suggestions
