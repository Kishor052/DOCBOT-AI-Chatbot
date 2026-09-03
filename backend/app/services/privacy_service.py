# app/services/privacy_service.py
import re
import logging
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

class PIIRedactor:
    """Enterprise-Grade PII (Personally Identifiable Information) Redaction Engine."""
    
    # Regex patterns for sensitive data
    PATTERNS = {
        "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
        "credit_card": r'\b(?:\d[ -]*?){13,16}\b',
        "phone": r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
        "email_strict": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b',
        "api_key": r'\b(sk-[A-Za-z0-9]{20,T}|gsk_[A-Za-z0-9]{20,})\b'
    }

    @classmethod
    def redact_sensitive_text(cls, text: str, redact_emails: bool = False) -> Tuple[str, Dict[str, int]]:
        """Redacts sensitive PII patterns from raw text before indexing or LLM processing."""
        redacted_text = text
        stats = {}
        
        for key, pattern in cls.PATTERNS.items():
            if key == "email_strict" and not redact_emails:
                continue
            matches = re.findall(pattern, redacted_text)
            if matches:
                count = len(matches)
                stats[key] = count
                replacement = f"[REDACTED_{key.upper()}]"
                redacted_text = re.sub(pattern, replacement, redacted_text)
        
        if stats:
            logger.info(f"Redacted PII elements from document: {stats}")
            
        return redacted_text, stats

pii_redactor = PIIRedactor()
