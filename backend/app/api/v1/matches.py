from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job, JobMatch, MatchSkill
from app.models.history import AnalysisHistory
from app.schemas.job import JobCreateRequest, JobMatchResponse, MatchSkillItem, ExplainableScoreComponent
from app.services.matcher_service import JobMatcherService
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/matches", tags=["Job Matching"])


@router.post("/instant-match", response_model=JobMatchResponse)
def instant_job_match(
    request: JobCreateRequest,
    resume_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Paste a job description, run explainable matching against candidate's resume, and record results.
    """
    # 1. Fetch user's target resume
    if resume_id:
        resume = (
            db.query(Resume)
            .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
            .first()
        )
    else:
        # Default to latest resume
        resume = (
            db.query(Resume)
            .filter(Resume.user_id == current_user.id)
            .order_by(Resume.created_at.desc())
            .first()
        )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload your resume first before matching against jobs.",
        )

    if not request.description or len(request.description.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a detailed job description (minimum 20 characters).",
        )

    # 2. Run JobMatcherService
    match_result = JobMatcherService.match_resume_to_job(
        resume=resume,
        job_title=request.title,
        job_description=request.description,
    )

    # 3. Create or find Job entity
    job = Job(
        title=request.title,
        company=request.company or "Target Company",
        raw_text=request.description,
        required_skills=[s.skill_name for s in match_result["matched_skills"] + match_result["missing_skills"]],
        preferred_skills=[s.skill_name for s in match_result["partial_skills"]],
    )
    db.add(job)
    db.flush()

    # 4. Create JobMatch entity
    db_match = JobMatch(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job.id,
        overall_match_score=match_result["overall_match_score"],
        skill_match_score=match_result["skill_match_score"],
        experience_match_score=match_result["experience_match_score"],
        project_match_score=match_result["project_match_score"],
        keyword_similarity_score=match_result["keyword_similarity_score"],
        score_explanation=[comp.model_dump() for comp in match_result["score_components"]],
        summary=match_result["summary"],
        recommendations=match_result["recommendations"],
    )
    db.add(db_match)
    db.flush()

    # 5. Persist matched/partial/missing skills
    for item in match_result["matched_skills"] + match_result["partial_skills"] + match_result["missing_skills"]:
        db_match_skill = MatchSkill(
            job_match_id=db_match.id,
            skill_name=item.skill_name,
            category=item.category,
            match_type=item.match_type,
            importance=item.importance,
            relevance_note=item.relevance_note,
        )
        db.add(db_match_skill)

    # 6. Record in AnalysisHistory
    history = AnalysisHistory(
        user_id=current_user.id,
        resume_id=resume.id,
        action_type="job_match",
        title=f"Matched with {request.title}",
        score_value=match_result["overall_match_score"],
        score_delta=0.0,
        summary=f"Calculated {match_result['overall_match_score']:.0f}% match score with {len(match_result['matched_skills'])} matched skills.",
        details={"job_title": request.title, "company": request.company},
    )
    db.add(history)
    db.commit()

    # 7. Gamification triggers
    GamificationService.check_and_unlock_achievement(db, current_user.id, "first_match")
    if match_result["overall_match_score"] >= 80.0:
        GamificationService.check_and_unlock_achievement(db, current_user.id, "high_match_score")

    return JobMatchResponse(
        id=db_match.id,
        job_id=job.id,
        resume_id=resume.id,
        job_title=job.title,
        company=job.company,
        overall_match_score=db_match.overall_match_score,
        skill_match_score=db_match.skill_match_score,
        experience_match_score=db_match.experience_match_score,
        project_match_score=db_match.project_match_score,
        keyword_similarity_score=db_match.keyword_similarity_score,
        matched_skills_count=match_result["matched_skills_count"],
        partial_skills_count=match_result["partial_skills_count"],
        missing_skills_count=match_result["missing_skills_count"],
        matched_skills=match_result["matched_skills"],
        partial_skills=match_result["partial_skills"],
        missing_skills=match_result["missing_skills"],
        score_components=match_result["score_components"],
        summary=db_match.summary,
        recommendations=db_match.recommendations or [],
        created_at=db_match.created_at,
    )


@router.get("/", response_model=List[JobMatchResponse])
def get_user_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """List all previous job matches performed by current user."""
    matches = (
        db.query(JobMatch)
        .filter(JobMatch.user_id == current_user.id)
        .order_by(JobMatch.created_at.desc())
        .all()
    )
    results = []
    for m in matches:
        matched_skills = [
            MatchSkillItem(
                skill_name=ms.skill_name,
                category=ms.category,
                match_type=ms.match_type,
                importance=ms.importance,
                relevance_note=ms.relevance_note,
            )
            for ms in m.match_skills if ms.match_type == "matched"
        ]
        partial_skills = [
            MatchSkillItem(
                skill_name=ms.skill_name,
                category=ms.category,
                match_type=ms.match_type,
                importance=ms.importance,
                relevance_note=ms.relevance_note,
            )
            for ms in m.match_skills if ms.match_type == "partial"
        ]
        missing_skills = [
            MatchSkillItem(
                skill_name=ms.skill_name,
                category=ms.category,
                match_type=ms.match_type,
                importance=ms.importance,
                relevance_note=ms.relevance_note,
            )
            for ms in m.match_skills if ms.match_type == "missing"
        ]

        score_components = [
            ExplainableScoreComponent(**c) for c in (m.score_explanation or [])
        ]

        results.append(
            JobMatchResponse(
                id=m.id,
                job_id=m.job_id,
                resume_id=m.resume_id,
                job_title=m.job.title if m.job else "Target Role",
                company=m.job.company if m.job else "Target Company",
                overall_match_score=m.overall_match_score,
                skill_match_score=m.skill_match_score,
                experience_match_score=m.experience_match_score,
                project_match_score=m.project_match_score,
                keyword_similarity_score=m.keyword_similarity_score,
                matched_skills_count=len(matched_skills),
                partial_skills_count=len(partial_skills),
                missing_skills_count=len(missing_skills),
                matched_skills=matched_skills,
                partial_skills=partial_skills,
                missing_skills=missing_skills,
                score_components=score_components,
                summary=m.summary,
                recommendations=m.recommendations or [],
                created_at=m.created_at,
            )
        )
    return results


@router.get("/{match_id}", response_model=JobMatchResponse)
def get_match_by_id(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get single job match record with full explainable score and skill diffs."""
    m = (
        db.query(JobMatch)
        .filter(JobMatch.id == match_id, JobMatch.user_id == current_user.id)
        .first()
    )
    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job match result not found.",
        )

    matched_skills = [
        MatchSkillItem(
            skill_name=ms.skill_name,
            category=ms.category,
            match_type=ms.match_type,
            importance=ms.importance,
            relevance_note=ms.relevance_note,
        )
        for ms in m.match_skills if ms.match_type == "matched"
    ]
    partial_skills = [
        MatchSkillItem(
            skill_name=ms.skill_name,
            category=ms.category,
            match_type=ms.match_type,
            importance=ms.importance,
            relevance_note=ms.relevance_note,
        )
        for ms in m.match_skills if ms.match_type == "partial"
    ]
    missing_skills = [
        MatchSkillItem(
            skill_name=ms.skill_name,
            category=ms.category,
            match_type=ms.match_type,
            importance=ms.importance,
            relevance_note=ms.relevance_note,
        )
        for ms in m.match_skills if ms.match_type == "missing"
    ]

    score_components = [
        ExplainableScoreComponent(**c) for c in (m.score_explanation or [])
    ]

    return JobMatchResponse(
        id=m.id,
        job_id=m.job_id,
        resume_id=m.resume_id,
        job_title=m.job.title if m.job else "Target Role",
        company=m.job.company if m.job else "Target Company",
        overall_match_score=m.overall_match_score,
        skill_match_score=m.skill_match_score,
        experience_match_score=m.experience_match_score,
        project_match_score=m.project_match_score,
        keyword_similarity_score=m.keyword_similarity_score,
        matched_skills_count=len(matched_skills),
        partial_skills_count=len(partial_skills),
        missing_skills_count=len(missing_skills),
        matched_skills=matched_skills,
        partial_skills=partial_skills,
        missing_skills=missing_skills,
        score_components=score_components,
        summary=m.summary,
        recommendations=m.recommendations or [],
        created_at=m.created_at,
    )
