import re
from typing import Dict, Any, List

# Medical abbreviation lexicon mapping to expanded standard representations
MEDICAL_ABBREVIATIONS = {
    "htn": "hypertension",
    "bp": "blood pressure",
    "dm": "diabetes mellitus",
    "t2dm": "type 2 diabetes mellitus",
    "dm2": "type 2 diabetes mellitus",
    "t1dm": "type 1 diabetes mellitus",
    "dm1": "type 1 diabetes mellitus",
    "iddm": "insulin-dependent diabetes mellitus",
    "niddm": "non-insulin-dependent diabetes mellitus",
    "mi": "myocardial infarction",
    "ami": "acute myocardial infarction",
    "sob": "shortness of breath",
    "chf": "congestive heart failure",
    "hf": "heart failure",
    "ckd": "chronic kidney disease",
    "cva": "cerebrovascular accident stroke",
    "tia": "transient ischemic attack",
    "copd": "chronic obstructive pulmonary disease",
    "gerd": "gastroesophageal reflux disease",
    "pt": "patient",
    "c/o": "complains of",
    "s/p": "status post",
    "w/": "with",
    "w/o": "without",
    "hx": "history",
    "dx": "diagnosis",
    "rx": "treatment",
    "sx": "symptoms",
    "fx": "fracture",
    "hr": "heart rate",
    "rr": "respiratory rate",
    "afib": "atrial fibrillation",
    "a-fib": "atrial fibrillation",
    "pe": "pulmonary embolism",
    "dvt": "deep vein thrombosis",
    "uti": "urinary tract infection",
    "covid": "COVID-19 coronavirus disease 2019",
    "sars-cov-2": "COVID-19 severe acute respiratory syndrome coronavirus 2"
}

# Common medical spelling normalizations
SPELLING_NORMALIZATIONS = {
    "hiper tension": "hypertension",
    "hipertension": "hypertension",
    "hyper tension": "hypertension",
    "diabtes": "diabetes",
    "diabeetus": "diabetes",
    "infartion": "infarction",
    "infaction": "infarction",
    "dyspnoea": "dyspnea",
    "dispnea": "dyspnea",
    "asthama": "asthma",
    "pneumonie": "pneumonia",
    "pneumonitis": "pneumonitis",
    "arhythmia": "arrhythmia",
    "arythmia": "arrhythmia",
    "ischemia": "ischemia",
    "ischaemia": "ischemia",
    "kidny": "kidney",
    "anemic": "anemia",
    "febrile": "fever febrile"
}

NEGATION_PATTERNS = [
    r"\bno\b",
    r"\bnot\b",
    r"\bdenies\b",
    r"\bwithout\b",
    r"\bnegative for\b",
    r"\bno evidence of\b",
    r"\bruled out\b",
    r"\brule out\b",
    r"\babsence of\b",
    r"\bfree of\b"
]

class PreprocessingService:
    @staticmethod
    def preprocess_clinical_text(text: str) -> Dict[str, Any]:
        """
        Preprocesses raw clinical expressions while strictly preserving negation,
        expanding clinical acronyms, normalizing common typos, and extracting clinical phrases.
        """
        if not text:
            return {
                "cleaned_text": "",
                "original_text": "",
                "has_negation": False,
                "negation_terms": [],
                "expanded_abbreviations": [],
                "key_phrases": []
            }
        
        raw_text = text.strip()
        
        # 1. Check for clinical negation signals (do NOT remove them)
        negation_terms_found = []
        for pattern in NEGATION_PATTERNS:
            matches = re.findall(pattern, raw_text, flags=re.IGNORECASE)
            if matches:
                negation_terms_found.extend(matches)
        
        has_negation = len(negation_terms_found) > 0
        
        # 2. Whitespace cleanup and low-level character standardisation
        normalized = re.sub(r"[\r\n\t]+", " ", raw_text)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        
        # 3. Spelling correction
        lower_temp = normalized.lower()
        for typo, correction in SPELLING_NORMALIZATIONS.items():
            if typo in lower_temp:
                lower_temp = re.sub(rf"\b{re.escape(typo)}\b", correction, lower_temp)
        
        # 4. Token-level acronym expansion
        tokens = re.split(r"(\s+|[.,;!?])", lower_temp)
        expanded_abbreviations = []
        reconstructed_tokens = []
        
        for tok in tokens:
            cleaned_tok = tok.strip().lower()
            if cleaned_tok in MEDICAL_ABBREVIATIONS:
                expansion = MEDICAL_ABBREVIATIONS[cleaned_tok]
                expanded_abbreviations.append(f"{cleaned_tok} -> {expansion}")
                reconstructed_tokens.append(expansion)
            else:
                reconstructed_tokens.append(tok)
                
        processed_str = "".join(reconstructed_tokens)
        processed_str = re.sub(r"\s+", " ", processed_str).strip()
        
        # 5. Extract key clinical phrases
        words = [w for w in re.split(r"[^\w\-]+", processed_str) if len(w) > 2]
        key_phrases = []
        stopwords = {"the", "and", "with", "for", "that", "this", "from", "has", "have", "been", "was", "are", "per"}
        for w in words:
            if w.lower() not in stopwords and w.lower() not in key_phrases:
                key_phrases.append(w.lower())
        
        return {
            "cleaned_text": processed_str,
            "original_text": raw_text,
            "has_negation": has_negation,
            "negation_terms": list(set(negation_terms_found)),
            "expanded_abbreviations": expanded_abbreviations,
            "key_phrases": key_phrases[:8]
        }

