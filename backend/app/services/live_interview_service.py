"""
Live AI Interview Engine Service.
Powers real-time conversational interviews, personalized question generation,
dynamic follow-ups, and 7-category evaluation grounded in student's verified
resume and target job description.
"""

import os
import re
from typing import Any, Dict, List, Optional, Tuple
from app.models.resume import Resume
from app.models.live_interview import LiveInterviewSession, LiveInterviewTurn
from app.services.nlp_service import NLPService


class LiveInterviewService:
    @staticmethod
    def _extract_resume_profile(resume: Optional[Resume]) -> Dict[str, Any]:
        """Extract structured profile attributes from the candidate's resume."""
        if not resume:
            return {
                "skills": [],
                "projects": [],
                "experience": [],
                "education": [],
                "candidate_name": "Candidate",
            }

        skills = [s.name for s in resume.skills] if resume.skills else []
        projects = []
        if resume.projects:
            for p in resume.projects:
                projects.append({
                    "title": p.title or "Project",
                    "description": p.description or "",
                    "technologies": p.technologies if isinstance(p.technologies, list) else [],
                })

        experience = []
        if resume.experience_records:
            for exp in resume.experience_records:
                experience.append({
                    "company": exp.company or "",
                    "position": exp.position or "",
                    "description": exp.description or "",
                })

        education = []
        if resume.education_records:
            for edu in resume.education_records:
                education.append({
                    "institution": edu.institution or "",
                    "degree": edu.degree or "",
                    "field": edu.field_of_study or "",
                })

        name = resume.parsed_name or "there"

        return {
            "skills": skills,
            "projects": projects,
            "experience": experience,
            "education": education,
            "candidate_name": name,
        }

    @staticmethod
    def _extract_job_keywords(job_description: str) -> List[str]:
        """Extract prioritized keywords and technical competencies from job description."""
        job_skills = NLPService.extract_skills_from_text(job_description, {})
        names = [s.name for s in job_skills]
        if not names:
            words = re.findall(r"\b[A-Z][a-zA-Z0-9+#.]*\b", job_description)
            names = list(set(words[:15]))
        return names

    @staticmethod
    def generate_opening_turn(
        session: LiveInterviewSession,
        resume: Optional[Resume],
    ) -> Tuple[str, str, str]:
        """
        Generate friendly, professional opening greeting and first question.
        Returns: (greeting, first_question, question_category)
        """
        profile = LiveInterviewService._extract_resume_profile(resume)
        name = profile["candidate_name"]
        job_title = session.job_title
        company = f" at {session.company}" if session.company else ""

        greeting = (
            f"Hello {name}! Welcome to your CareerFit live mock interview for the {job_title} role{company}. "
            f"I have reviewed your resume and the target role criteria. "
            f"We'll cover your technical projects, problem-solving abilities, and how your skills align with this position. "
            f"Take a deep breath, speak naturally, and let's get started!"
        )

        # First question: Grounded icebreaker connecting candidate to the role
        top_skills = profile["skills"][:3]
        skill_mention = f" including {', '.join(top_skills)}" if top_skills else ""

        first_question = (
            f"To begin, could you introduce yourself, summarize your core technical background{skill_mention}, "
            f"and explain what attracted you to this {job_title} role?"
        )

        return greeting, first_question, "HR & Behavioral"

    @staticmethod
    def generate_dynamic_response_and_next_question(
        session: LiveInterviewSession,
        resume: Optional[Resume],
        all_turns: List[LiveInterviewTurn],
        latest_student_answer: str,
    ) -> Tuple[str, Optional[str], Optional[str], bool]:
        """
        Processes student's latest transcript and dynamically determines:
        1. Contextual AI reaction/acknowledgment.
        2. Contextual follow-up OR next topic question based on the actual answer quality.
        3. Category.
        4. is_last_question / is_completed.
        """
        turn_count = len(all_turns)
        max_turns = 5 if session.duration_minutes <= 10 else (7 if session.duration_minutes <= 15 else 9)

        profile = LiveInterviewService._extract_resume_profile(resume)
        job_keywords = LiveInterviewService._extract_job_keywords(session.job_description)
        answer_lower = latest_student_answer.lower().strip()
        words = answer_lower.split()
        word_count = len(words)

        # Detect candidate's mentioned projects, technologies, and depth
        projects = profile["projects"]
        skills = profile["skills"]

        mentioned_projects = [
            p for p in projects if p["title"].lower() in answer_lower
        ]
        has_project_discussion = bool(
            mentioned_projects
            or any(w in answer_lower for w in ["project", "built", "implemented", "developed", "architected", "system", "app"])
        )

        matched_skills = [s for s in skills if s.lower() in answer_lower]
        matched_job_skills = [k for k in job_keywords if k.lower() in answer_lower]
        total_tech_matched = list(set(matched_skills + matched_job_skills))

        is_uncertain = any(
            phrase in answer_lower
            for phrase in ["not sure", "don't know", "dont know", "no idea", "haven't used", "never worked", "cannot recall"]
        )

        # 1. Closing Check (Final turn)
        if turn_count >= max_turns:
            ai_reaction = (
                "Thank you so much for those thorough explanations throughout our session today. "
                "You've given me a very clear picture of your engineering mindset and communication skills."
            )
            closing_question = (
                "To conclude our interview, do you have any final questions for me about the team, "
                f"the technology stack, or what it's like working as a {session.job_title}?"
            )
            return ai_reaction, closing_question, "Closing", True

        # 2. Dynamic AI reaction and follow-up based on candidate's answer quality
        if is_uncertain:
            # Case C: Candidate was uncertain or unfamiliar
            ai_reaction = (
                "That's completely fine. Honesty about technical boundaries is an important engineering trait."
            )
            fallback_skill = job_keywords[0] if job_keywords else "problem-solving"
            next_q = (
                f"Let's look at it from a different angle: when you encounter an unfamiliar library or framework "
                f"such as {fallback_skill}, what is your systematic process for reading documentation, debugging, "
                f"and getting up to speed quickly?"
            )
            next_cat = "Problem Solving & Learning"

        elif word_count < 14:
            # Case B: Incomplete or very brief answer -> ask to explain missing part
            ai_reaction = (
                "Thank you for that starting point, though your explanation was quite high-level."
            )
            next_q = (
                "Could you elaborate on the missing specifics? In particular, walk me through the step-by-step "
                "implementation details, technical trade-offs, and how you validated the outcome."
            )
            next_cat = "Deep Dive & Elaboration"

        elif has_project_discussion and (turn_count == 2 or len(mentioned_projects) > 0):
            # Case D: Candidate discussed a project -> Ask about personal contribution, tech choices, challenges, implementation
            target_proj = mentioned_projects[0] if mentioned_projects else (projects[0] if projects else None)
            proj_name = f"'{target_proj['title']}'" if target_proj else "that project you described"
            ai_reaction = (
                f"It's great to hear about your hands-on involvement with {proj_name}."
            )
            next_q = (
                f"Regarding {proj_name}, could you clarify your exact personal contribution versus the rest of your team? "
                "Specifically, what technology choices did you make, and what was the toughest technical hurdle or bug you had to overcome?"
            )
            next_cat = "Resume & Projects"

        elif total_tech_matched and word_count >= 25:
            # Case A: Good technical answer -> Ask deeper technical follow-up or edge cases
            top_kw = total_tech_matched[0]
            ai_reaction = (
                f"Strong explanation! You clearly understand how {top_kw} operates under the hood."
            )
            next_q = (
                f"Following up on your approach with {top_kw}: how do you handle edge cases, caching, or system reliability "
                "when the application experiences sudden traffic surges or network partitions?"
            )
            next_cat = "Technical Deep Dive"

        elif turn_count >= 4:
            # Case E: Behavioral / Collaboration (STAR format)
            ai_reaction = (
                "I appreciate the structured thought process you shared."
            )
            next_q = (
                "In software engineering, cross-functional collaboration is just as critical as code quality. "
                "Can you share an instance where you received critical feedback during a code review or had a disagreement "
                "with a colleague on technical direction, and how you resolved it constructively?"
            )
            next_cat = "HR & Behavioral"

        else:
            # Case F: Move to next relevant job competency
            next_skill = job_keywords[min(turn_count, len(job_keywords) - 1)] if job_keywords else "architecture"
            ai_reaction = (
                "Understood. That gives helpful context on your problem-solving style."
            )
            next_q = (
                f"Looking at the requirements for this {session.job_title} role, {next_skill} is a primary focus area. "
                f"Could you explain a practical scenario where you architected or maintained a feature relying on {next_skill}?"
            )
            next_cat = "Technical Core"

        is_last = (turn_count + 1 >= max_turns)
        return ai_reaction, next_q, next_cat, is_last

    @staticmethod
    def evaluate_completed_interview(
        session: LiveInterviewSession,
        resume: Optional[Resume],
        all_turns: List[LiveInterviewTurn],
    ) -> Dict[str, Any]:
        """
        Conducts thorough, fair evaluation across the 7 mandatory categories:
        1. Technical Knowledge
        2. Answer Relevance
        3. Communication Clarity
        4. Problem-Solving Approach
        5. Resume and Project Understanding
        6. Job Role Knowledge
        7. HR and Behavioural Responses
        """
        profile = LiveInterviewService._extract_resume_profile(resume)
        job_keywords = LiveInterviewService._extract_job_keywords(session.job_description)

        student_answers = [t.student_transcript or "" for t in all_turns if t.student_transcript]
        total_answers = len(student_answers)
        all_text = " ".join(student_answers).lower()
        total_words = sum(len(a.split()) for a in student_answers)
        avg_words_per_answer = (total_words / total_answers) if total_answers > 0 else 0

        # 1. Scoring Calculations based on observable answer quality:
        # Technical Knowledge (depth of technical vocabulary, frameworks mentioned)
        matched_tech = [k for k in job_keywords if k.lower() in all_text]
        tech_ratio = len(matched_tech) / max(len(job_keywords), 1)
        tech_score = round(min(95.0, max(50.0, 55.0 + tech_ratio * 40.0)), 1)

        # Answer Relevance (length and substance)
        if avg_words_per_answer >= 35:
            relevance_score = 88.0
        elif avg_words_per_answer >= 20:
            relevance_score = 78.0
        elif avg_words_per_answer >= 10:
            relevance_score = 65.0
        else:
            relevance_score = 50.0

        # Communication Clarity (structural words, transitions)
        comm_markers = ["firstly", "because", "result", "for example", "approach", "implemented", "specifically"]
        comm_found = sum(1 for m in comm_markers if m in all_text)
        comm_score = round(min(94.0, max(55.0, 60.0 + comm_found * 5.0)), 1)

        # Problem-Solving Approach
        problem_markers = ["debug", "troubleshoot", "test", "triage", "analyze", "resolve", "optimize", "challenge"]
        problem_found = sum(1 for m in problem_markers if m in all_text)
        problem_score = round(min(92.0, max(52.0, 58.0 + problem_found * 4.5)), 1)

        # Resume & Project Understanding
        proj_mentions = sum(
            1 for p in profile["projects"] if p["title"].lower() in all_text
        )
        resume_score = round(min(95.0, max(55.0, 65.0 + proj_mentions * 12.0)), 1)

        # Job Role Knowledge
        role_score = round(min(93.0, max(54.0, 62.0 + len(matched_tech) * 4.0)), 1)

        # HR & Behavioral
        hr_markers = ["collaborate", "learned", "feedback", "team", "growth", "responsibility"]
        hr_found = sum(1 for m in hr_markers if m in all_text)
        hr_score = round(min(95.0, max(58.0, 64.0 + hr_found * 5.0)), 1)

        # Overall weighted composite
        overall_score = round(
            tech_score * 0.22
            + relevance_score * 0.18
            + comm_score * 0.15
            + problem_score * 0.15
            + resume_score * 0.12
            + role_score * 0.10
            + hr_score * 0.08,
            1,
        )

        # 2. Extract Strong Answers & Answers Needing Improvement
        strong_answers = []
        answers_needing_improvement = []

        for idx, turn in enumerate(all_turns):
            ans = turn.student_transcript or ""
            word_count = len(ans.split())
            if word_count >= 30 and (any(k.lower() in ans.lower() for k in job_keywords) or any(m in ans.lower() for m in comm_markers)):
                strong_answers.append({
                    "turn_order": turn.turn_order,
                    "question": turn.question_text,
                    "excerpt": ans[:240] + ("..." if len(ans) > 240 else ""),
                    "strength_reason": "Clear technical specifics, structured reasoning, and relevant terminology.",
                })
            else:
                answers_needing_improvement.append({
                    "turn_order": turn.turn_order,
                    "question": turn.question_text,
                    "weakness": "Answer was somewhat brief or lacked quantified STAR metrics.",
                    "suggested_star_answer": (
                        f"Structured answer: (Situation) In my previous project, "
                        f"(Task) I was tasked with implementing this feature cleanly, "
                        f"(Action) I leveraged {job_keywords[0] if job_keywords else 'best practices'} to architect the module and ran thorough unit tests, "
                        f"(Result) successfully reducing latency and delivering the deliverable on schedule."
                    ),
                })

        # Missing Critical Points
        missing_skills = [k for k in job_keywords if k.lower() not in all_text][:4]
        missing_critical_points = [
            f"Discussing hands-on experience with {s}" for s in missing_skills
        ] if missing_skills else ["Quantifying measurable business or latency results in production"]

        # Personalized recommendations
        personalized_recommendations = [
            "Use the STAR methodology (Situation, Task, Action, Result) to format scenario-based answers.",
            "Explicitly connect your past resume project architectures to the company's tech stack.",
            f"Highlight specific debugging and scaling strategies when answering questions regarding {job_keywords[0] if job_keywords else 'backend architecture'}.",
            "Practice articulating trade-offs between speed of delivery and code maintainability.",
        ]

        # Topics to revise
        topics_to_revise = list(set(
            missing_skills
            + [s for s in profile["skills"][:3]]
            + ["System Design fundamentals", "STAR Behavioral storytelling"]
        ))[:5]

        summary = (
            f"Candidate completed {total_answers} interview exchanges for the {session.job_title} role with an overall readiness score of {overall_score}/100. "
            f"Demonstrated solid baseline communication and authentic resume project knowledge, with key growth areas in STAR quantification and deep architectural trade-offs."
        )

        return {
            "overall_score": overall_score,
            "technical_score": tech_score,
            "relevance_score": relevance_score,
            "communication_score": comm_score,
            "problem_solving_score": problem_score,
            "resume_depth_score": resume_score,
            "job_knowledge_score": role_score,
            "hr_behavioral_score": hr_score,
            "summary": summary,
            "strong_answers": strong_answers[:3],
            "answers_needing_improvement": answers_needing_improvement[:3],
            "missing_critical_points": missing_critical_points,
            "personalized_recommendations": personalized_recommendations,
            "topics_to_revise": topics_to_revise,
        }
