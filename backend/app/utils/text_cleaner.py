"""
Text cleaning, section extraction, and regex helpers for resume and job description parsing.
"""

import re
from typing import Dict, List, Optional, Tuple

# Common resume section header patterns
SECTION_HEADERS = {
    "education": [
        r"\b(?:education|academic background|academics|qualifications|educational background|degrees?)\b",
    ],
    "experience": [
        r"\b(?:work experience|professional experience|experience|employment history|internships?|work history)\b",
    ],
    "skills": [
        r"\b(?:skills|technical skills|key skills|core competencies|technologies|tools & technologies|skill set)\b",
    ],
    "projects": [
        r"\b(?:projects|academic projects|personal projects|key projects|capstone projects?)\b",
    ],
    "certifications": [
        r"\b(?:certifications|certificates|licenses|courses|accreditations|achievements & certifications)\b",
    ],
    "summary": [
        r"\b(?:summary|professional summary|profile|career objective|about me|objective)\b",
    ],
}

# Strong action verbs for resume improvement recommendations
ACTION_VERBS = {
    "developed", "designed", "architected", "engineered", "implemented", "built",
    "optimized", "spearheaded", "accelerated", "deployed", "scaled", "automated",
    "integrated", "collaborated", "orchestrated", "refactored", "formulated",
    "reduced", "increased", "boosted", "delivered", "executed", "constructed"
}


def clean_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    if not text:
        return ""
    # Replace non-breaking spaces and irregular whitespace
    text = re.sub(r"[\r\n\t\xa0]+", " ", text)
    # Remove excessive whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_email(text: str) -> Optional[str]:
    """Extract first valid email address from text."""
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w{2,6}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract standard phone number formats."""
    match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    return match.group(0) if match else None


def extract_links(text: str) -> List[str]:
    """Extract GitHub, LinkedIn, or portfolio URLs."""
    urls = re.findall(
        r"https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)",
        text,
    )
    # Also capture github.com/xxx or linkedin.com/in/xxx patterns without https
    short_urls = re.findall(r"\b(?:github\.com|linkedin\.com/in)/[a-zA-Z0-9_-]+", text, re.IGNORECASE)
    return list(set(urls + [f"https://{u}" for u in short_urls]))


def segment_resume_sections(text: str) -> Dict[str, str]:
    """
    Segment full resume text into structured sections based on recognized headers.
    Returns a dictionary mapping section names to extracted text content.
    """
    lines = text.splitlines()
    sections: Dict[str, List[str]] = {
        "header": [],
        "summary": [],
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "other": [],
    }

    current_section = "header"

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue

        # Check if this line is a section header (usually short <= 40 chars)
        matched_section = None
        if len(cleaned_line) <= 45:
            for section_name, patterns in SECTION_HEADERS.items():
                for pattern in patterns:
                    if re.search(pattern, cleaned_line, re.IGNORECASE):
                        matched_section = section_name
                        break
                if matched_section:
                    break

        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(cleaned_line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}
