"""
Personalized Interview Preparation Generation Service.
Generates grounded interview questions, answer frameworks, and preparation guides
using the candidate's actual parsed resume (projects, experience, verified skills)
and target job description.
"""

import uuid
from typing import Any, Dict, List, Optional
from app.models.resume import Resume
from app.services.nlp_service import NLPService


class InterviewService:
    @staticmethod
    def generate_interview_prep(
        resume: Resume,
        job_title: str,
        company: Optional[str],
        job_description: str,
    ) -> Dict[str, Any]:
        """
        Synthesizes student's verified resume profile with target job requirements
        to generate structured, categorized interview questions and coaching notes.
        """
        company_name = company or "the company"
        extracted_skills = [s.name for s in resume.skills]
        projects = resume.projects or []
        experience_records = resume.experience_records or []
        education_records = resume.education_records or []

        # Extract required skills from job description
        job_skills = NLPService.extract_skills_from_text(job_description, {})
        job_skill_names = [s.name for s in job_skills]

        # Categorize into matched and missing skills
        matched_skills = [s for s in job_skill_names if s.lower() in [es.lower() for es in extracted_skills]]
        missing_skills = [s for s in job_skill_names if s.lower() not in [es.lower() for es in extracted_skills]]

        questions: List[Dict[str, Any]] = []

        # =========================================================================
        # 1. RESUME & PROJECTS DEEP DIVE QUESTIONS (Grounded strictly in their resume)
        # =========================================================================
        if projects:
            for proj in projects[:3]:
                title = proj.title or "your technical project"
                desc = proj.description or "the implementation details"
                tech_list = proj.technologies if isinstance(proj.technologies, list) and proj.technologies else []
                tech_mention = f" utilizing {', '.join(tech_list[:4])}" if tech_list else ""

                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Resume & Projects",
                    "question": f"In your project '{title}', what was the biggest technical challenge you faced, and how did you resolve it?",
                    "why_asked": "Interviewers want to verify authentic project ownership, problem-solving under constraints, and hands-on depth.",
                    "suggested_answer": (
                        f"When developing '{title}'{tech_mention}, the key challenge was ensuring modular design and seamless data flow. "
                        f"I analyzed the requirements, broke down the implementation into clear stages, and tested the core components iteratively. "
                        f"This allowed me to build a reliable solution that accomplished the project goals while maintaining clean, maintainable code."
                    ),
                    "answer_structure": "Situation (project objective) -> Task (bottleneck or bug) -> Action (architectural choice or fix) -> Result (working deliverable).",
                    "important_points": [
                        f"Reference the specific tools you used in {title}",
                        "Highlight how you debugged or iterated through challenges",
                        "Quantify the outcome or user experience if possible",
                    ],
                    "is_prepared": False,
                })

                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Resume & Projects",
                    "question": f"If you had another two weeks to optimize or extend '{title}', what would you re-architect or improve?",
                    "why_asked": "Assesses engineering maturity, awareness of technical debt, and continuous improvement mindset.",
                    "suggested_answer": (
                        f"Reflecting on '{title}', I would focus on implementing comprehensive automated unit and integration tests, "
                        f"and optimizing caching or asynchronous handling to boost response latency and handle scale more efficiently."
                    ),
                    "answer_structure": "Acknowledge current state -> Identify clear optimization vector -> Explain architectural benefit.",
                    "important_points": [
                        "Demonstrate awareness of scalability and performance",
                        "Mention automated testing, CI/CD, or security considerations",
                    ],
                    "is_prepared": False,
                })

        if experience_records:
            for exp in experience_records[:2]:
                company_exp = exp.company or "your previous organization"
                role_exp = exp.position or "your role"
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Resume & Projects",
                    "question": f"During your experience as {role_exp} at {company_exp}, how did you collaborate with teammates and manage project timelines?",
                    "why_asked": "Tests communication, accountability, agile team workflow, and handling deadlines.",
                    "suggested_answer": (
                        f"At {company_exp}, I prioritized active communication through daily standups and sprint planning. "
                        f"I broke assigned deliverables into discrete milestones, maintained transparent progress via Git/issue trackers, "
                        f"and proactively communicated whenever technical blockers arose."
                    ),
                    "answer_structure": "Team context -> Coordination method -> Personal initiative -> Timely delivery.",
                    "important_points": [
                        f"Mention actual responsibilities from your time at {company_exp}",
                        "Highlight version control (Git) and team communication tools",
                    ],
                    "is_prepared": False,
                })

        # Fallback if student has minimal projects or experience
        if not projects and not experience_records:
            edu = education_records[0] if education_records else None
            institution = edu.institution if edu else "your degree program"
            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Resume & Projects",
                "question": f"What was the most challenging academic or personal software assignment you completed at {institution}?",
                "why_asked": "Evaluates academic rigor, self-directed learning, and software fundamentals.",
                "suggested_answer": (
                    f"During my coursework at {institution}, I tackled complex algorithmic and systems assignments where I designed "
                    f"data structures and implemented modular code. I focused on clean algorithmic complexity and verified correctness through unit tests."
                ),
                "answer_structure": "Course assignment context -> Algorithmic hurdle -> Code implementation -> Outcome.",
                "important_points": [
                    "Discuss specific computer science principles applied",
                    "Show curiosity and persistence beyond basic coursework",
                ],
                "is_prepared": False,
            })

        # =========================================================================
        # 2. TECHNICAL CORE QUESTIONS (Based on matched & verified skills)
        # =========================================================================
        top_skills = matched_skills[:4] or extracted_skills[:4]
        for skill in top_skills:
            skill_lower = skill.lower()
            if "python" in skill_lower:
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Technical Core",
                    "question": "Can you explain how Python manages memory, and how you prevent memory leaks when processing large datasets?",
                    "why_asked": "Differentiates surface-level syntax coders from engineers who understand the CPython runtime.",
                    "suggested_answer": (
                        "Python manages memory via reference counting combined with a cyclic garbage collector. "
                        "When handling large datasets, I avoid loading entire files into memory by using generator expressions and streaming iterators, "
                        "and leveraging specialized libraries like NumPy/Pandas that utilize contiguous memory buffers."
                    ),
                    "answer_structure": "Mechanism (ref counting & GC) -> Practical risk (cyclical references / memory spikes) -> Mitigation (generators, chunking).",
                    "important_points": [
                        "Mention generators / yield vs in-memory lists",
                        "Explain reference counting and the garbage collection cycles",
                    ],
                    "is_prepared": False,
                })
            elif "react" in skill_lower or "javascript" in skill_lower or "typescript" in skill_lower:
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Technical Core",
                    "question": f"In {skill}, how do you manage state transitions and avoid unnecessary re-renders in complex component trees?",
                    "why_asked": "Evaluates component architecture, performance optimization, and front-end fundamentals.",
                    "suggested_answer": (
                        "I keep state localized to where it is needed, hoisting only when shared across sibling trees. "
                        "I utilize memoization hooks (useMemo, useCallback) judiciously to preserve referential equality for child props, "
                        "and structure component hierarchies so expensive computational subtrees remain isolated from high-frequency state updates."
                    ),
                    "answer_structure": "Core principle (state localization) -> React reconciliation mechanism -> Performance tools (memo, profiling).",
                    "important_points": [
                        "Explain the virtual DOM diffing process",
                        "Discuss hook dependencies and memoization",
                    ],
                    "is_prepared": False,
                })
            elif "sql" in skill_lower or "database" in skill_lower or "postgres" in skill_lower:
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Technical Core",
                    "question": "How do database indexes work internally, and under what conditions might adding an index degrade performance?",
                    "why_asked": "Critical database knowledge required for scalable backend and full-stack positions.",
                    "suggested_answer": (
                        "Indexes typically use B-Tree structures to provide O(log n) lookup times for filtered queries. "
                        "However, every index incurs write amplification: INSERT, UPDATE, and DELETE operations must update the index tree, "
                        "and indexes consume storage. Therefore, indexes should be chosen based on actual query workload patterns."
                    ),
                    "answer_structure": "Data structure (B-Tree) -> Read benefit (O(log n)) -> Write trade-off (overhead on mutations).",
                    "important_points": [
                        "Explain B-Tree balanced lookup",
                        "Highlight write penalties and foreign key indexing",
                    ],
                    "is_prepared": False,
                })
            elif "docker" in skill_lower or "kubernetes" in skill_lower or "devops" in skill_lower:
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Technical Core",
                    "question": "What is the difference between a Docker container and a Virtual Machine, and how do you optimize Docker image size?",
                    "why_asked": "Tests systems knowledge, Linux kernel isolation, and production containerization practices.",
                    "suggested_answer": (
                        "Virtual Machines virtualize the entire hardware layer and include a full guest OS, whereas Docker containers share the host Linux kernel "
                        "using namespaces and cgroups for process isolation, resulting in faster startup and lower resource overhead. "
                        "To optimize images, I use multi-stage builds, minimal base images (like Alpine or distroless), and minimize layer count."
                    ),
                    "answer_structure": "Kernel sharing vs hypervisor -> Resource impact -> Optimization strategies (multi-stage builds).",
                    "important_points": [
                        "Namespaces & cgroups vs Hypervisor",
                        "Multi-stage Dockerfiles and .dockerignore",
                    ],
                    "is_prepared": False,
                })
            else:
                questions.append({
                    "id": str(uuid.uuid4()),
                    "category": "Technical Core",
                    "question": f"How have you applied {skill} in your projects, and what are its core architectural advantages?",
                    "why_asked": f"Confirms genuine competency with {skill} as listed on your resume.",
                    "suggested_answer": (
                        f"I utilized {skill} to address specific technical requirements in my projects. "
                        f"Its primary strengths are its ecosystem, reliability, and community support, which helped me structure my implementation cleanly."
                    ),
                    "answer_structure": "Tool overview -> Implementation context -> Strengths and best practices.",
                    "important_points": [
                        f"Connect {skill} directly to a verified project on your resume",
                        "Discuss industry standards and design patterns",
                    ],
                    "is_prepared": False,
                })

        # =========================================================================
        # 3. JOB-SPECIFIC & SKILL GAP QUESTIONS
        # =========================================================================
        questions.append({
            "id": str(uuid.uuid4()),
            "category": "Job-Specific",
            "question": f"This position is for a {job_title} at {company_name}. How do your specific qualifications prepare you to make an impact here?",
            "why_asked": "Tests role preparation, company research, and alignment between student skills and job needs.",
            "suggested_answer": (
                f"As a candidate with verified foundations in {', '.join(top_skills[:3]) if top_skills else 'software engineering'}, "
                f"I have practical project experience building and deploying functional applications. "
                f"I reviewed the responsibilities for {job_title} at {company_name}, and my ability to quickly master new technologies "
                f"and write testable code positions me to contribute effectively to your engineering objectives."
            ),
            "answer_structure": "Personal technical strengths -> Relevance to this specific job -> Value added to the engineering team.",
            "important_points": [
                f"Name the role '{job_title}' and mention {company_name}",
                "Anchor in real projects from your resume",
            ],
            "is_prepared": False,
        })

        if missing_skills:
            gap_skill = missing_skills[0]
            questions.append({
                "id": str(uuid.uuid4()),
                "category": "Job-Specific",
                "question": f"The job description mentions '{gap_skill}', which is not prominent in your resume. How do you plan to get up to speed?",
                "why_asked": "Assesses technical adaptability, intellectual honesty, and rapid self-directed learning.",
                "suggested_answer": (
                    f"While I haven't utilized {gap_skill} in a production environment yet, my strong foundation in {top_skills[0] if top_skills else 'core CS'} "
                    f"shares many underlying paradigms. When learning new tools, I dive into the official documentation, build hands-on prototypes, "
                    f"and study production open-source code to become proficient rapidly."
                ),
                "answer_structure": "Honest acknowledgment -> Leverage adjacent knowledge -> Proven learning roadmap -> Confidence in quick ramp-up.",
                "important_points": [
                    "Never guess or fake knowledge of a tool you don't know",
                    "Explain your systematic learning methodology with concrete past examples",
                ],
                "is_prepared": False,
            })

        # =========================================================================
        # 4. HR & BEHAVIORAL QUESTIONS
        # =========================================================================
        questions.append({
            "id": str(uuid.uuid4()),
            "category": "HR & Behavioral",
            "question": "Tell me about yourself and your journey in technology.",
            "why_asked": "Sets the tone of the interview; evaluates storytelling, passion, and concise professional communication.",
            "suggested_answer": (
                f"I am a passionate software engineering student focused on building practical, scalable systems. "
                f"Throughout my college journey, I have prioritized hands-on project work—developing solutions with {', '.join(top_skills[:3]) if top_skills else 'modern tech'} "
                f"where I tackled architectural and performance hurdles. "
                f"I am excited about this {job_title} opportunity at {company_name} because it aligns with my drive to engineer robust software and learn from an exceptional team."
            ),
            "answer_structure": "Present (who you are & current tech focus) -> Past (key projects & growth) -> Future (why this role at this company). Keep to 90 seconds.",
            "important_points": [
                "Keep under 2 minutes",
                "Highlight passion and real projects rather than just reading your resume",
                "Conclude with why you are sitting in this specific interview",
            ],
            "is_prepared": False,
        })

        questions.append({
            "id": str(uuid.uuid4()),
            "category": "HR & Behavioral",
            "question": "Describe a situation where you had a disagreement with a team member over a technical decision. How did you handle it?",
            "why_asked": "Assesses emotional intelligence, collaboration, humility, and data-driven decision making.",
            "suggested_answer": (
                "During a team project, a teammate and I differed on whether to use a relational database or a NoSQL store for our feature. "
                "Instead of arguing opinions, I suggested we write down our core access patterns and run a quick benchmark prototype against our expected query types. "
                "The data made the trade-offs clear, and we agreed amicably on the best solution for the user experience."
            ),
            "answer_structure": "Situation -> Conflict point -> Data-driven resolution step -> Team alignment outcome.",
            "important_points": [
                "Focus on the technical trade-offs, not personal friction",
                "Show that you seek consensus and respect differing viewpoints",
            ],
            "is_prepared": False,
        })

        # =========================================================================
        # 5. SCENARIO & PROBLEM SOLVING QUESTIONS
        # =========================================================================
        questions.append({
            "id": str(uuid.uuid4()),
            "category": "Scenario & Problem Solving",
            "question": f"Imagine you deploy a new feature for {job_title} and users immediately report high latency or errors. What is your diagnostic protocol?",
            "why_asked": "Evaluates incident response, debugging under pressure, telemetry awareness, and rollback discipline.",
            "suggested_answer": (
                "First, I would assess user impact and check whether an immediate rollback or traffic diversion is warranted to restore service health. "
                "Next, I would inspect application logs, APM metrics, error rates, and database slow-query logs to pinpoint the exact failure boundary. "
                "Once identified, I would write a reproducible regression test, apply the fix, verify in staging, deploy, and conduct a blameless post-mortem."
            ),
            "answer_structure": "Triage & mitigate (rollback if severe) -> Root-cause analysis (logs/metrics) -> Verified fix -> Blameless retrospective.",
            "important_points": [
                "Prioritize user uptime and immediate mitigation before prolonged debugging",
                "Mention observability (logs, metrics, APM)",
                "Emphasize writing regression tests to prevent recurrence",
            ],
            "is_prepared": False,
        })

        # Compile Strategic Notes
        strengths_overview = [
            f"Demonstrated hands-on experience with {len(projects)} practical software projects.",
            f"Strong verified competencies in {', '.join(top_skills[:3]) if top_skills else 'core software tools'}.",
            "Good multi-factor CareerFit resume structure with clear academic and technical sections.",
        ]

        improvement_recommendations = [
            "Prepare concrete numerical metrics for your projects (e.g., latency reduction, user count, test coverage).",
            f"Brush up on {missing_skills[0]} fundamentals" if missing_skills else "Review system design trade-offs and caching strategies.",
            "Practice delivering your 'Tell me about yourself' pitch concisely within 90 seconds.",
        ]

        technical_topics = list(set(top_skills + (missing_skills[:3] if missing_skills else [])))
        if not technical_topics:
            technical_topics = ["Data Structures & Algorithms", "REST API Architecture", "Database Indexing & ACID", "Git Branching Workflows"]

        delivery_tips = [
            "Use the STAR Method (Situation, Task, Action, Result) for all behavioral and project questions.",
            "Speak in the first person ('I designed', 'I debugged') to make your individual contribution unequivocal.",
            "Clarify ambiguities before jumping into technical solutions: ask clarifying questions like a working engineer.",
            "Prepare 3 thoughtful questions to ask the interviewer about their engineering culture, CI/CD, and mentorship.",
        ]

        return {
            "job_title": job_title,
            "company": company_name,
            "job_description": job_description,
            "strengths_overview": strengths_overview,
            "improvement_recommendations": improvement_recommendations,
            "technical_topics_to_revise": technical_topics,
            "delivery_tips": delivery_tips,
            "questions": questions,
            "prepared_count": 0,
            "total_questions": len(questions),
        }
