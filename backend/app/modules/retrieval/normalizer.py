"""Academic query preprocessor: typo correction, fuzzy matching, normalization, and acronym expansion."""
import difflib
import re
from typing import Dict, Tuple, List, Set, Any

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
    "cie": "continuous internal evaluation",
    "ese": "end semester examination",
    "atkt": "allowed to keep terms backlog",
    "sgpa": "semester grade point average",
    "cgpa": "cumulative grade point average",
}

# High-priority academic phrase corrections (handles multi-word and compound typos)
PHRASE_CORRECTIONS: Dict[str, str] = {
    "bid data": "big data",
    "big deta": "big data",
    "bog data": "big data",
    "atendance criteria": "attendance criteria",
    "passing criterea": "passing criteria",
    "pasing criteria": "passing criteria",
    "passing crteria": "passing criteria",
    "exam regulatons": "exam regulations",
    "exam regulaton": "exam regulations",
    "cocurricular activities": "co-curricular activities",
    "co curricular activities": "co-curricular activities",
    "financial analitics": "financial analytics",
    "finacial analytics": "financial analytics",
    "devpos lab": "devops lab",
    "devpos laboratory": "devops laboratory",
    "computng lab": "computing lab",
}

# Known single-word typos in academic queries
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
    "atendance": "attendance",
    "attandence": "attendance",
    "attendence": "attendance",
    "passsing": "passing",
    "pasing": "passing",
    "criterea": "criteria",
    "crteria": "criteria",
    "criteris": "criteria",
    "regulatons": "regulations",
    "regulaton": "regulation",
    "detension": "detention",
    "eligiblity": "eligibility",
    "condonaton": "condonation",
    "ordinence": "ordinance",
    "ordnace": "ordinance",
    "evalution": "evaluation",
    "evaluaton": "evaluation",
    "analitics": "analytics",
    "labortory": "laboratory",
    "cocurricular": "co-curricular",
    "semister": "semester",
    "semster": "semester",
}

# Comprehensive institutional lexicon for fuzzy edit-distance resolution
INSTITUTIONAL_VOCABULARY: List[str] = [
    "big", "data", "analytics", "hadoop", "spark", "mapreduce",
    "attendance", "eligibility", "condonation", "detention",
    "examination", "regulations", "autonomous", "passing", "criteria",
    "curriculum", "syllabus", "evaluation", "continuous", "internal",
    "end-semester", "backlogs", "promotion", "atkt", "ordinance",
    "co-curricular", "prerequisites", "credits", "course", "outcomes",
    "devops", "docker", "kubernetes", "pipeline", "jenkins",
    "cryptography", "network", "security", "protocols",
    "cloud", "computing", "distributed", "systems",
    "financial", "management", "statistics", "multivariate",
    "laboratory", "practical", "theory", "hours",
    "department", "computer", "science", "engineering", "faculty",
    "student", "hall-ticket", "grade", "sgpa", "cgpa", "revaluation",
    "malpractice", "grievance", "admission", "fees", "structure",
    "ucspc0701", "ucsmm0741", "ucscc0831"
]

STOPWORDS: Set[str] = {
    "what", "is", "the", "for", "in", "of", "and", "a", "an", "to",
    "how", "can", "tell", "me", "summarize", "summarise", "give", "explain",
    "about", "are", "do", "does", "any", "which", "where", "under", "with"
}


class AcademicQueryNormalizer:
    """
    Normalizes, fuzzily spell-checks, and enriches queries for optimal lexical and semantic retrieval.
    Applies multi-stage correction:
    1. Multi-word phrase regex correction (e.g. 'bid data' -> 'big data').
    2. Exact typo dictionary lookup.
    3. Levenshtein / difflib fuzzy close matching against the institutional vocabulary.
    4. Acronym expansion for maximum semantic recall.
    """

    @classmethod
    def normalize_with_metadata(cls, query: str) -> Tuple[str, str, Dict[str, str]]:
        """
        Full normalizer returning:
        - normalized_query: cleaned and corrected query
        - expanded_query: query with acronyms expanded
        - corrections: dictionary of {typo_word: corrected_word}
        """
        if not query:
            return "", "", {}

        # 1. Clean extra spaces
        text = re.sub(r"\s+", " ", query.strip())
        corrections: Dict[str, str] = {}

        # 2. Multi-word phrase level correction (case-insensitive)
        for p_typo, p_correct in PHRASE_CORRECTIONS.items():
            pattern = rf"\b{re.escape(p_typo)}\b"
            if re.search(pattern, text, flags=re.IGNORECASE):
                corrections[p_typo] = p_correct
                text = re.sub(pattern, p_correct, text, flags=re.IGNORECASE)

        # 3. Word-level correction: dictionary + fuzzy matching
        words = text.split(" ")
        cleaned_words = []

        for w in words:
            # Strip trailing/leading punctuation for clean matching while preserving original structure
            raw_word = re.sub(r'^[^\w]+|[^\w]+$', '', w)
            lower_w = raw_word.lower()

            if not lower_w or lower_w in STOPWORDS or lower_w.isdigit():
                cleaned_words.append(w)
                continue

            # Stage A: Check exact typo map
            if lower_w in TYPO_MAP:
                correct_w = TYPO_MAP[lower_w]
                corrections[raw_word] = correct_w
                new_w = w.replace(raw_word, correct_w)
                cleaned_words.append(new_w)
                continue

            # Stage B: If already in institutional vocabulary or common acronyms, keep as is
            if lower_w in INSTITUTIONAL_VOCABULARY or lower_w in ACRONYM_MAP:
                cleaned_words.append(w)
                continue

            # Stage C: Fuzzy edit-distance matching (cutoff 0.72 catches 1-2 character typos)
            if len(lower_w) >= 3:
                matches = difflib.get_close_matches(lower_w, INSTITUTIONAL_VOCABULARY, n=1, cutoff=0.72)
                if matches:
                    fuzzy_w = matches[0]
                    corrections[raw_word] = fuzzy_w
                    new_w = w.replace(raw_word, fuzzy_w)
                    cleaned_words.append(new_w)
                    continue

            cleaned_words.append(w)

        normalized_query = " ".join(cleaned_words)

        # 4. Build expanded query with acronym definitions appended if present
        expanded_terms = []
        lower_query = normalized_query.lower()
        for acronym, full_form in ACRONYM_MAP.items():
            pattern = rf"\b{re.escape(acronym)}\b"
            if re.search(pattern, lower_query) and full_form not in lower_query:
                expanded_terms.append(full_form)

        if expanded_terms:
            expanded_query = f"{normalized_query} ({', '.join(expanded_terms)})"
        else:
            expanded_query = normalized_query

        return normalized_query, expanded_query, corrections

    @classmethod
    def normalize(cls, query: str) -> Tuple[str, str]:
        """
        Convenience wrapper preserving backward compatibility.
        Returns (normalized_query, expanded_query).
        """
        norm, exp, _ = cls.normalize_with_metadata(query)
        return norm, exp
