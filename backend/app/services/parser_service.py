"""
Robust Multi-Format Resume Parser (PDF, DOCX) for CareerPath.
Extracts plain text, contact details, links, and structured sections without losing formatting context.
"""

import io
import re
from typing import Dict, List, Optional, Tuple
import pdfplumber
from pypdf import PdfReader
from docx import Document
from app.utils.text_cleaner import (
    clean_text,
    extract_email,
    extract_phone,
    extract_links,
    segment_resume_sections,
)
from app.schemas.resume import ParsedResumeData, EducationItem, ExperienceItem, ProjectItem, CertificationItem


class ResumeParserService:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extract plain text from PDF using pdfplumber with fallback to pypdf."""
        extracted_text = []
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text(layout=True) or page.extract_text()
                    if text:
                        extracted_text.append(text)
        except Exception:
            # Fallback to PyPDF
            try:
                reader = PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text.append(text)
            except Exception as e:
                raise ValueError(f"Unable to parse PDF content: {str(e)}")

        full_text = "\n".join(extracted_text).strip()
        if not full_text:
            raise ValueError("The uploaded PDF does not contain readable text (it may be scanned/an image).")
        return full_text

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        """Extract plain text and tables from DOCX document."""
        try:
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        paragraphs.append(row_text)
            full_text = "\n".join(paragraphs).strip()
            if not full_text:
                raise ValueError("The uploaded DOCX file is empty.")
            return full_text
        except Exception as e:
            raise ValueError(f"Unable to parse DOCX file: {str(e)}")

    @classmethod
    def extract_candidate_name(cls, raw_text: str, header_text: str) -> Optional[str]:
        """Extract candidate name from header or initial lines."""
        lines = (header_text or raw_text).splitlines()
        for line in lines[:5]:
            cleaned = line.strip()
            # Ignore lines with email, phone, or website
            if not cleaned or "@" in cleaned or "http" in cleaned or any(c.isdigit() for c in cleaned):
                continue
            # Typical name length: 2 to 4 words, each capitalized
            words = cleaned.split()
            if 1 <= len(words) <= 4 and all(w[0].isupper() for w in words if w):
                return cleaned
        return None

    @classmethod
    def parse_education_section(cls, text: str) -> List[EducationItem]:
        """Extract structured education entries."""
        if not text:
            return []
        items = []
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        degrees = [
            "B.E", "B.Tech", "Bachelor of Engineering", "Bachelor of Technology",
            "B.Sc", "B.C.A", "BCA", "M.Tech", "M.S", "M.Sc", "MCA", "Master",
            "High School", "Higher Secondary", "Diploma"
        ]
        
        current_entry = {}
        for line in lines:
            # Check degree
            for deg in degrees:
                if deg.lower() in line.lower():
                    current_entry["degree"] = deg
                    break

            # Check GPA
            gpa_match = re.search(r"(?:gpa|cgpa|percentage|score)[\s:]*([0-9\.]+(?:\s*(?:/|out of)\s*[0-9\.]+)?%?)", line, re.IGNORECASE)
            if gpa_match:
                current_entry["gpa"] = gpa_match.group(1).strip()

            # Check year / date
            year_match = re.search(r"\b(20\d\d(?:\s*[-–]\s*(?:20\d\d|present|current))?)\b", line, re.IGNORECASE)
            if year_match:
                current_entry["end_date"] = year_match.group(1).strip()

            # Check institution
            if any(term in line.lower() for term in ["university", "college", "institute", "school", "campus"]):
                current_entry["institution"] = line

            if len(current_entry.keys()) >= 2:
                items.append(EducationItem(
                    institution=current_entry.get("institution", "Institution Not Specified"),
                    degree=current_entry.get("degree", "Degree / Field of Study"),
                    gpa=current_entry.get("gpa"),
                    end_date=current_entry.get("end_date"),
                ))
                current_entry = {}

        if current_entry and (current_entry.get("institution") or current_entry.get("degree")):
            items.append(EducationItem(
                institution=current_entry.get("institution", "Educational Institution"),
                degree=current_entry.get("degree", "Degree"),
                gpa=current_entry.get("gpa"),
                end_date=current_entry.get("end_date"),
            ))

        return items

    @classmethod
    def parse_experience_section(cls, text: str) -> List[ExperienceItem]:
        """Extract structured experience / internship entries."""
        if not text:
            return []
        items = []
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        
        # Simple chunking by role/company boundaries
        chunks = re.split(r"\n(?=[A-Z][A-Za-z\s]+[-–|])", text)
        for chunk in chunks:
            chunk_lines = [l.strip() for l in chunk.splitlines() if l.strip()]
            if not chunk_lines:
                continue
            header = chunk_lines[0]
            desc = " ".join(chunk_lines[1:]) if len(chunk_lines) > 1 else header

            # Extract dates
            date_match = re.search(r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}\s*[-–]\s*(?:Present|Current|\d{4}))\b", chunk, re.IGNORECASE)
            date_str = date_match.group(1) if date_match else None

            # Split header for company/role
            parts = re.split(r"[-–|•,]", header)
            role = parts[0].strip() if len(parts) > 0 else "Role"
            company = parts[1].strip() if len(parts) > 1 else None

            items.append(ExperienceItem(
                company=company or "Organization / Company",
                position=role,
                start_date=date_str,
                description=desc[:500],
                is_current="present" in (date_str or "").lower(),
            ))

        return items[:5]

    @classmethod
    def parse_projects_section(cls, text: str) -> List[ProjectItem]:
        """Extract structured project entries."""
        if not text:
            return []
        items = []
        chunks = re.split(r"\n(?=[A-Z0-9][A-Za-z0-9\s:_-]{3,40}(?:[-–|]|\n))", text)
        for chunk in chunks:
            lines = [l.strip() for l in chunk.splitlines() if l.strip()]
            if not lines:
                continue
            title = lines[0]
            desc = " ".join(lines[1:]) if len(lines) > 1 else lines[0]
            link = extract_links(chunk)

            items.append(ProjectItem(
                title=title[:100],
                description=desc[:500],
                link=link[0] if link else None,
            ))
        return items[:6]

    @classmethod
    def parse_certifications_section(cls, text: str) -> List[CertificationItem]:
        """Extract structured certification entries."""
        if not text:
            return []
        items = []
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for line in lines:
            if len(line) >= 4:
                items.append(CertificationItem(
                    name=line[:120],
                    issuer="Accredited Provider / Course",
                ))
        return items[:6]

    @classmethod
    def parse_document(cls, file_bytes: bytes, filename: str) -> Tuple[str, ParsedResumeData, Dict[str, str]]:
        """
        Main pipeline to parse an uploaded resume into raw text, structured sections, and entities.
        """
        ext = filename.lower().split(".")[-1]
        if ext == "pdf":
            raw_text = cls.extract_text_from_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            raw_text = cls.extract_text_from_docx(file_bytes)
        else:
            raise ValueError(f"Unsupported file format: .{ext}. Supported formats are PDF and DOCX.")

        # Segment into logical sections
        sections = segment_resume_sections(raw_text)

        # Extract contact entities
        email = extract_email(raw_text)
        phone = extract_phone(raw_text)
        links = extract_links(raw_text)
        name = cls.extract_candidate_name(raw_text, sections.get("header", ""))

        # Extract structured section models
        education = cls.parse_education_section(sections.get("education", ""))
        experience = cls.parse_experience_section(sections.get("experience", ""))
        projects = cls.parse_projects_section(sections.get("projects", ""))
        certifications = cls.parse_certifications_section(sections.get("certifications", ""))

        parsed_data = ParsedResumeData(
            name=name,
            email=email,
            phone=phone,
            links=links,
            education=education,
            experience=experience,
            projects=projects,
            certifications=certifications,
        )

        return raw_text, parsed_data, sections
