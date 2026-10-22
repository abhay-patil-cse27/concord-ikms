"""Academic query preprocessor: typo correction, normalization, and acronym expansion."""
import re
from typing import Dict, Tuple

# Institutional and academic acronym mappings commonly used across syllabus and institutional docs
ACRONYM_MAP: Dict[str, str] = {
    "bda": "big data analytics",
    "cns": "cryptography and network security",
    "nep": "national education policy",
    "co": "course outcome",
    "cos": "course outcomes",
    "po": "program outcome",
    "pos": "program outcomes",
    "pso": "program specific outcome",
    "psos": "program specific outcomes",
    "ai": "artificial intelligence",
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "dbms": "database management system",
    "os": "operating system",
    "cn": "computer networks",
    "se": "software engineering",
    "sdlc": "software development life cycle",
    "ci": "continuous integration",
    "cd": "continuous delivery",
    "devops": "devops development operations",
    "aws": "amazon web services",
    "gcp": "google cloud platform",
    "iot": "internet of things",
    "wt": "web technologies",
}

# Common typos in academic queries
TYPO_MAP: Dict[str, str] = {
    "syallbus": "syllabus",
    "syllbus": "syllabus",
    "sylabus": "syllabus",
    "sylabuss": "syllabus",
    "syllabous": "syllabus",
    "summaries": "summarize",
    "summarise": "summarize",
    "sumarize": "summarize",
    "sumarise": "summarize",
    "curriculam": "curriculum",
    "curriclum": "curriculum",
    "prereq": "prerequisites",
    "prerequisits": "prerequisites",
    "prerequsite": "prerequisites",
    "devpos": "devops",
    "deveops": "devops",
}


class AcademicQueryNormalizer:
    """Normalizes and enriches queries for optimal lexical and semantic retrieval."""

    @classmethod
    def normalize(cls, query: str) -> Tuple[str, str]:
        """
        Returns a tuple of:
        - normalized_query: cleaned and corrected query
        - expanded_query: query with acronyms expanded for maximum semantic recall
        """
        if not query:
            return "", ""

        # 1. Clean extra spaces
        text = re.sub(r"\s+", " ", query.strip())

        # 2. Correct known typos
        words = text.split(" ")
        cleaned_words = []
        for w in words:
            lower_w = w.lower().strip(",.?!:;")
            cleaned = TYPO_MAP.get(lower_w, w)
            cleaned_words.append(cleaned)

        normalized_query = " ".join(cleaned_words)

        # 3. Build expanded query with acronym definitions appended if present
        expanded_terms = []
        lower_query = normalized_query.lower()
        for acronym, full_form in ACRONYM_MAP.items():
            # Check for whole-word acronym match
            pattern = rf"\b{re.escape(acronym)}\b"
            if re.search(pattern, lower_query) and full_form not in lower_query:
                expanded_terms.append(full_form)

        if expanded_terms:
            expanded_query = f"{normalized_query} ({', '.join(expanded_terms)})"
        else:
            expanded_query = normalized_query

        return normalized_query, expanded_query
