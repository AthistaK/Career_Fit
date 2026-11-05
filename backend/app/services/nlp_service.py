"""
Explainable NLP, skill extraction, and TF-IDF vectorization engine for CareerPath.
"""

import re
from typing import Dict, List, Set, Tuple
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.utils.skill_taxonomy import SKILL_TAXONOMY, SKILL_LOOKUP, get_standard_skill
from app.schemas.resume import SkillItem


class NLPService:
    @staticmethod
    def normalize_token(token: str) -> str:
        """Lowercase and strip punctuation for clean keyword matching."""
        return re.sub(r"[^\w\+\#\.]", "", token.lower().strip())

    @classmethod
    def extract_skills_from_text(
        cls, text: str, sections_dict: Dict[str, str] = None
    ) -> List[SkillItem]:
        """
        Extract verified technical and soft skills from text using the curated taxonomy.
        Tracks occurrences across sections (skills, projects, experience) to compute explainable proficiency.
        """
        if not text:
            return []

        text_lower = " " + text.lower() + " "
        detected_skills: Dict[str, Dict] = {}

        # 1. Search taxonomy aliases in text using word boundary aware regex
        for alias, info in SKILL_LOOKUP.items():
            standard_name = info["name"]
            category = info["category"]

            # Escape special regex chars like c++, c#, .net
            escaped_alias = re.escape(alias)
            # Match boundary or symbol edge
            pattern = rf"(?:\b|(?<=[^a-zA-Z0-9])){escaped_alias}(?:\b|(?=[^a-zA-Z0-9]))"
            matches = list(re.finditer(pattern, text_lower))

            if matches:
                freq = len(matches)
                if standard_name not in detected_skills:
                    detected_skills[standard_name] = {
                        "name": standard_name,
                        "category": category,
                        "frequency": freq,
                        "sections": set(),
                    }
                else:
                    detected_skills[standard_name]["frequency"] += freq

        # 2. Check which sections contained the skill (if sections_dict is provided)
        if sections_dict:
            for sec_name, sec_text in sections_dict.items():
                sec_text_lower = " " + sec_text.lower() + " "
                for standard_name in detected_skills.keys():
                    for alias, info in SKILL_LOOKUP.items():
                        if info["name"] == standard_name:
                            escaped_alias = re.escape(alias)
                            pattern = rf"(?:\b|(?<=[^a-zA-Z0-9])){escaped_alias}(?:\b|(?=[^a-zA-Z0-9]))"
                            if re.search(pattern, sec_text_lower):
                                detected_skills[standard_name]["sections"].add(sec_name)
                                break

        # 3. Formulate structured SkillItems with explainable proficiency
        skill_items: List[SkillItem] = []
        for name, data in detected_skills.items():
            freq = data["frequency"]
            sections = data.get("sections", set())

            # Base proficiency calculation:
            # 60% base + 10% per section presence (projects, experience, etc.) + min(20%, freq * 5%)
            section_bonus = 0.0
            if "experience" in sections:
                section_bonus += 15.0
            if "projects" in sections:
                section_bonus += 15.0
            if "skills" in sections:
                section_bonus += 10.0

            freq_bonus = min(20.0, freq * 5.0)
            base_score = 50.0 + section_bonus + freq_bonus
            proficiency = min(95.0, max(50.0, base_score))

            detected_section_str = ", ".join(sections) if sections else "general"

            skill_items.append(
                SkillItem(
                    name=name,
                    category=data["category"],
                    proficiency_score=round(proficiency, 1),
                    frequency=freq,
                    detected_section=detected_section_str,
                )
            )

        # Sort skills by proficiency desc, frequency desc
        skill_items.sort(key=lambda s: (s.proficiency_score, s.frequency), reverse=True)
        return skill_items

    @classmethod
    def calculate_tfidf_similarity(cls, text_a: str, text_b: str) -> float:
        """
        Compute cosine similarity between two text corpuses using TF-IDF word vectors.
        Returns a score from 0.0 to 100.0.
        """
        if not text_a or not text_b:
            return 0.0
        try:
            vectorizer = TfidfVectorizer(
                stop_words="english",
                ngram_range=(1, 2),
                max_features=500,
            )
            tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            # Convert -1..1 cosine space to percentage
            return float(round(max(0.0, similarity) * 100, 1))
        except Exception:
            return 0.0
