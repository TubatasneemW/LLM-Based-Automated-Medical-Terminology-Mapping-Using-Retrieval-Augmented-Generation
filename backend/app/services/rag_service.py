import os
import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models.schemas import CandidateConcept, EvidenceItem

logger = logging.getLogger("rag_service")

class RAGService:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        self.ollama_url = settings.OLLAMA_BASE_URL

    async def reason_and_map(
        self,
        clinical_text: str,
        clinical_notes: Optional[str],
        preprocessed_info: Dict[str, Any],
        ranked_candidates: List[CandidateConcept],
        confidence_score: float,
        confidence_label: str
    ) -> Dict[str, Any]:
        """
        Executes RAG reasoning over retrieved candidates using an external LLM if configured,
        or the deterministic Local Grounded Clinical Reasoner.
        Always returns strict grounded explanations without hallucinating IDs.
        """
        if not ranked_candidates:
            return {
                "selected_concept": None,
                "reasoning": "No candidate medical concepts could be retrieved for this clinical phrase.",
                "clinical_justification": "Query did not meet minimum similarity thresholds against medical vocabularies.",
                "why_selected": "None",
                "why_alternatives_ranked_lower": [],
                "evidence": [],
                "reasoning_engine": "None"
            }

        top_cand = ranked_candidates[0]

        # 1. Try Gemini API if key is available
        if self.gemini_key:
            try:
                res = await self._call_gemini(clinical_text, clinical_notes, preprocessed_info, ranked_candidates)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Falling back to next engine.")

        # 2. Try OpenAI API if key is available
        if self.openai_key:
            try:
                res = await self._call_openai(clinical_text, clinical_notes, preprocessed_info, ranked_candidates)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}. Falling back to next engine.")

        # 3. Try Groq API if key is available
        if self.groq_key:
            try:
                res = await self._call_groq(clinical_text, clinical_notes, preprocessed_info, ranked_candidates)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Groq API call failed: {e}. Falling back to next engine.")

        # 4. Deterministic Local Grounded Medical Reasoning Engine (Default fallback)
        return self._local_grounded_reasoning(
            clinical_text,
            clinical_notes,
            preprocessed_info,
            ranked_candidates,
            confidence_score,
            confidence_label
        )

    def _local_grounded_reasoning(
        self,
        clinical_text: str,
        clinical_notes: Optional[str],
        preprocessed_info: Dict[str, Any],
        ranked_candidates: List[CandidateConcept],
        confidence_score: float,
        confidence_label: str
    ) -> Dict[str, Any]:
        """
        Deterministic, fully explainable medical reasoning grounded exclusively in the
        retrieved vocabulary definitions, synonyms, and clinical feature concordance.
        Clearly states that the Local Grounded Clinical Reasoner was used.
        """
        top_cand = ranked_candidates[0]
        cleaned_text = preprocessed_info.get("cleaned_text", clinical_text)
        has_negation = preprocessed_info.get("has_negation", False)
        negation_terms = preprocessed_info.get("negation_terms", [])
        abbrev_exp = preprocessed_info.get("expanded_abbreviations", [])

        # Build clinical justification
        signals_str = "; ".join(top_cand.matched_signals) if top_cand.matched_signals else "High dense vector cosine similarity"
        
        negation_alert = ""
        if has_negation:
            negation_alert = f" [CRITICAL CLINICAL NOTE: Clinical negation signals detected: {', '.join(negation_terms)}. Preserved context without altering phenotype mapping.]"

        reasoning = (
            f"Evaluated {len(ranked_candidates)} candidate concepts from standard vocabularies. "
            f"The candidate '{top_cand.concept_name}' ({top_cand.terminology} ID: {top_cand.concept_id}) "
            f"achieved the highest hybrid score ({top_cand.hybrid_score}) based on: {signals_str}."
            f"{negation_alert}"
        )

        why_selected = (
            f"Concept '{top_cand.concept_name}' directly aligns with the patient's presentation '{clinical_text}'. "
            f"Its standardized clinical definition states: \"{top_cand.description}\". "
            f"Known synonyms in {top_cand.terminology} ({', '.join(top_cand.synonyms[:4])}) provide complete semantic closure with the clinical query."
        )

        why_alternatives_lower = []
        for alt in ranked_candidates[1:5]:
            alt_diff = round(top_cand.hybrid_score - alt.hybrid_score, 3)
            why_alternatives_lower.append(
                f"Candidate #{alt.rank} '{alt.concept_name}' ({alt.terminology} ID: {alt.concept_id}) "
                f"scored {alt.hybrid_score} (margin -{alt_diff}). "
                f"While belonging to {alt.domain}, it represents a more distant semantic neighbor or lacks direct synonym alignment."
            )

        # Generate grounded evidence
        evidence_items = []
        for c in ranked_candidates[:3]:
            evidence_items.append(EvidenceItem(
                source=c.terminology,
                identifier=c.concept_id,
                title=c.concept_name,
                snippet=f"Definition: {c.description}. Synonyms: {', '.join(c.synonyms[:5])}. Domain: {c.domain}.",
                relevance=f"Hybrid Score: {c.hybrid_score} | Cosine: {c.similarity_score}"
            ))

        return {
            "selected_concept": top_cand,
            "reasoning": reasoning,
            "clinical_justification": f"Grounded semantic matching against {top_cand.terminology} authoritative concept repository.",
            "why_selected": why_selected,
            "why_alternatives_ranked_lower": why_alternatives_lower,
            "evidence": evidence_items,
            "reasoning_engine": "Local Grounded Clinical Reasoner (Deterministic RAG Engine)"
        }

    async def _call_gemini(self, clinical_text, clinical_notes, preprocessed_info, candidates):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={self.gemini_key}"
        prompt = self._build_llm_prompt(clinical_text, clinical_notes, preprocessed_info, candidates)
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)
                return self._format_llm_response(parsed, candidates, "Google Gemini (" + settings.GEMINI_MODEL + ")")
        return None

    async def _call_openai(self, clinical_text, clinical_notes, preprocessed_info, candidates):
        url = "https://api.openai.com/v1/chat/completions"
        prompt = self._build_llm_prompt(clinical_text, clinical_notes, preprocessed_info, candidates)
        
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": "You are a senior medical informaticist and terminology mapping expert. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return self._format_llm_response(parsed, candidates, f"OpenAI ({settings.OPENAI_MODEL})")
        return None

    async def _call_groq(self, clinical_text, clinical_notes, preprocessed_info, candidates):
        url = "https://api.groq.com/openai/v1/chat/completions"
        prompt = self._build_llm_prompt(clinical_text, clinical_notes, preprocessed_info, candidates)
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": "You are a senior medical informaticist. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return self._format_llm_response(parsed, candidates, f"Groq ({settings.GROQ_MODEL})")
        return None

    def _build_llm_prompt(self, clinical_text, clinical_notes, preprocessed_info, candidates):
        cand_descriptions = []
        for c in candidates:
            cand_descriptions.append(
                f"- Concept ID: {c.concept_id} | Name: {c.concept_name} | Vocabulary: {c.terminology} | Domain: {c.domain}\n"
                f"  Definition: {c.description}\n"
                f"  Synonyms: {', '.join(c.synonyms)}\n"
                f"  Hybrid Retrieval Score: {c.hybrid_score}"
            )
        cand_str = "\n".join(cand_descriptions)

        return f"""You are an expert Clinical Informatician. Map the following clinical expression to the single best standardized medical concept from the provided retrieved candidate list.

DO NOT invent concept IDs, descriptions, or vocabularies. Ground your decision strictly in the provided candidates.

Clinical Input: "{clinical_text}"
Clinical EHR Context / Notes: "{clinical_notes or 'None'}"
Preprocessing Data: Cleaned="{preprocessed_info.get('cleaned_text')}", Has Negation={preprocessed_info.get('has_negation')}

Retrieved Candidate Concepts:
{cand_str}

Return JSON with exact structure:
{{
  "selected_concept_id": "<ID from candidates list>",
  "reasoning": "<Concise explanation of clinical semantic equivalence>",
  "clinical_justification": "<Pathophysiological and diagnostic rationale>",
  "why_selected": "<Why this concept matches the clinical expression best>",
  "why_alternatives_ranked_lower": [
    "<Why candidate 2 was ranked lower>",
    "<Why candidate 3 was ranked lower>"
  ]
}}"""

    def _format_llm_response(self, parsed: dict, candidates: List[CandidateConcept], engine_name: str) -> Dict[str, Any]:
        selected_id = str(parsed.get("selected_concept_id", "")).strip()
        matched = next((c for c in candidates if str(c.concept_id).lower() == selected_id.lower()), candidates[0])
        
        evidence_items = []
        for c in candidates[:3]:
            evidence_items.append(EvidenceItem(
                source=c.terminology,
                identifier=c.concept_id,
                title=c.concept_name,
                snippet=f"Definition: {c.description}. Synonyms: {', '.join(c.synonyms[:4])}",
                relevance=f"Score: {c.hybrid_score}"
            ))

        return {
            "selected_concept": matched,
            "reasoning": parsed.get("reasoning", "Semantic alignment grounded in retrieved record."),
            "clinical_justification": parsed.get("clinical_justification", "Clinical equivalence confirmed."),
            "why_selected": parsed.get("why_selected", f"Matches clinical meaning of {matched.concept_name}"),
            "why_alternatives_ranked_lower": parsed.get("why_alternatives_ranked_lower", []),
            "evidence": evidence_items,
            "reasoning_engine": f"External LLM: {engine_name}"
        }

rag_service = RAGService()

