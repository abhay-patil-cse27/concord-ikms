"""LLM Guardrail and Safety Interceptor for CONCORD IKMS.

Provides multi-tiered defenses against:
1. Prompt injection & jailbreak patterns (e.g., instruction override, DAN mode).
2. Delimiter & special token smuggling (e.g., [INST], <|im_start|>, ### System:).
3. Invisible unicode control characters and zero-width spaces.
4. Toxic / abusive query attempts.
5. Out-of-band system prompt extraction attempts.
"""

import re
import unicodedata
from typing import Tuple, Optional


class PromptGuard:
    """Enterprise-grade prompt safety and sanitization pipeline."""

    # 1. Patterns indicative of prompt injection & instruction overrides
    INJECTION_PATTERNS = [
        re.compile(r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)", re.IGNORECASE),
        re.compile(r"(?i)\bdisregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)", re.IGNORECASE),
        re.compile(r"(?i)\byou\s+are\s+now\s+(in\s+)?(developer\s+mode|dan|jailbreak|unrestricted|god\s+mode)", re.IGNORECASE),
        re.compile(r"(?i)\bswitch\s+to\s+(developer\s+mode|dan\s+mode|unfiltered)", re.IGNORECASE),
        re.compile(r"(?i)\b(reveal|print|show|repeat|display|output)\s+(your\s+)?(system\s+prompt|initial\s+instructions|secret\s+instructions)", re.IGNORECASE),
        re.compile(r"(?i)\bwhat\s+(are\s+your|is\s+your)\s+(initial\s+prompt|system\s+instructions|system\s+prompt)", re.IGNORECASE),
        re.compile(r"(?i)\bpretend\s+you\s+have\s+no\s+(rules|limits|safety|restrictions)", re.IGNORECASE),
    ]

    # 2. Delimiters, chat template tokens, and system boundary smuggling
    DELIMITER_PATTERNS = [
        re.compile(r"<\s*\|\s*im_start\s*\|?>", re.IGNORECASE),
        re.compile(r"<\s*\|\s*im_end\s*\|?>", re.IGNORECASE),
        re.compile(r"\[\s*INST\s*\]", re.IGNORECASE),
        re.compile(r"\[\s*/\s*INST\s*\]", re.IGNORECASE),
        re.compile(r"###\s*(System|Instruction|Assistant|Human)\s*:", re.IGNORECASE),
        re.compile(r"```(system|prompt|instruction)", re.IGNORECASE),
    ]

    # 3. Explicit harmful/toxic indicators and direct attack payloads
    # Tuned to prevent false positives on legitimate computer science questions (e.g. "what is SQL in DBMS?")
    HARMFUL_PATTERNS = [
        re.compile(r"(?i)\b(how\s+to\s+hack\b|exploit\s+vulnerability|bypass\s+firewall)\b", re.IGNORECASE),
        re.compile(r"(?i)\b(make\s+a\s+bomb|create\s+malware|ransomware\s+script|steal\s+passwords)\b", re.IGNORECASE),
        # Detect active SQL injection attempt signatures
        re.compile(r"(?i)(union\s+select|drop\s+table\b|insert\s+into\b|exec\s+xp_|;\s*drop\s+|--\s*$|'\s*or\s+'?1'?\s*=\s*'?1)", re.IGNORECASE),
    ]

    # Standard institutional refusal message
    STANDARD_REFUSAL_MESSAGE = (
        "I am CONCORD, the institutional academic assistant for Kolhapur Institute of Technology (KIT). "
        "I can only assist with verified institutional policies, regulations, syllabi, and academic inquiries. "
        "Your query could not be processed as it violates institutional safety and usage guidelines."
    )

    @classmethod
    def sanitize_input(cls, text: str) -> str:
        """
        Normalize Unicode, remove non-printable control characters,
        zero-width spaces, and normalize excessive whitespace.
        """
        if not text:
            return ""

        # Normalize unicode to NFKC
        normalized = unicodedata.normalize("NFKC", text)

        # Remove invisible/zero-width characters and Bidirectional control overrides
        # e.g., \u200B (ZWSP), \u200C (ZWNJ), \u200D (ZWJ), \u202E (RLO)
        cleaned_chars = []
        for ch in normalized:
            category = unicodedata.category(ch)
            # Cc: Other, Control (except newline, tab, carriage return)
            # Cf: Other, Format (zero-width characters, RTL overrides)
            # Cs: Other, Surrogate
            if category in ("Cf", "Cs"):
                continue
            if category == "Cc" and ch not in ("\n", "\r", "\t"):
                continue
            cleaned_chars.append(ch)

        cleaned = "".join(cleaned_chars)
        # Collapse multiple spaces
        cleaned = re.sub(r"[ \t]+", " ", cleaned).strip()
        return cleaned

    @classmethod
    def check_prompt_safety(cls, text: str) -> Tuple[bool, Optional[str]]:
        """
        Evaluate if user prompt is safe to process.
        Returns:
            (True, None) if safe
            (False, refusal_reason) if unsafe or injection attempt
        """
        sanitized = cls.sanitize_input(text)

        # Check prompt injection patterns
        for pattern in cls.INJECTION_PATTERNS:
            if pattern.search(sanitized):
                return False, "Prompt injection attempt detected (instruction override)."

        # Check token delimiter smuggling
        for pattern in cls.DELIMITER_PATTERNS:
            if pattern.search(sanitized):
                return False, "Chat template or system delimiter smuggling detected."

        # Check harmful/abusive keywords
        for pattern in cls.HARMFUL_PATTERNS:
            if pattern.search(sanitized):
                return False, "Harmful or prohibited subject matter detected."

        return True, None

    @classmethod
    def sanitize_output(cls, text: str) -> str:
        """
        Post-generation output guard: strip leaked chat template tags or system artifacts.
        """
        if not text:
            return ""

        # Strip accidental template leakage
        cleaned = text
        for pattern in cls.DELIMITER_PATTERNS:
            cleaned = pattern.sub("", cleaned)

        return cleaned.strip()
