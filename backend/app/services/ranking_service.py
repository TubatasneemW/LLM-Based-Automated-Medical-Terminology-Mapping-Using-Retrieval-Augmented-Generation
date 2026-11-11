import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import CandidateConcept

class RankingService:
    @staticmethod
    def rank_candidates(
        clinical_query: str,
        retrieved_candidates: List[Dict[str, Any]],
        preprocessed_info: Dict[str, Any],
        target_terminology: str = "All",
        top_k: int = 5
    ) -> Tuple[List[CandidateConcept], float, str, bool]:
        """
        Multi-signal hybrid re-ranking combining:
        - Vector cosine similarity
        - Exact term matching
        - Synonym matching
        - Clinical contextual relevance & domain signals
        - Target terminology alignment
        
        Returns:
            (ranked_candidate_concepts, confidence_score, confidence_label, requires_human_review)
        """
        if not retrieved_candidates:
            return [], 0.0, "Low", True

        query_lower = clinical_query.lower().strip()
        cleaned_query = preprocessed_info.get("cleaned_text", query_lower)
        query_tokens = set(re.findall(r"\w+", cleaned_query))

        scored_candidates = []

        for cand in retrieved_candidates:
            sim_score = cand.get("similarity_score", 0.0)
            concept_name = cand["concept_name"].lower()
            synonyms = [s.lower() for s in cand.get("synonyms", [])]
            description = cand.get("description", "").lower()
            terminology = cand["terminology"]
            domain = cand.get("domain", "")

            matched_signals = []
            bonus_score = 0.0

            # 1. Exact Name Match or Inclusion
            if query_lower == concept_name:
                bonus_score += 0.35
                matched_signals.append(f"Exact match on preferred name: '{cand['concept_name']}'")
            elif concept_name in query_lower or query_lower in concept_name:
                bonus_score += 0.20
                matched_signals.append(f"Sub-string token match with concept name: '{cand['concept_name']}'")

            # 2. Synonym Matching
            for syn in synonyms:
                if syn == query_lower:
                    bonus_score += 0.30
                    matched_signals.append(f"Direct synonym hit: '{syn}'")
                    break
                elif syn in query_lower or (len(syn) > 4 and syn in cleaned_query):
                    bonus_score += 0.15
                    matched_signals.append(f"Synonym variant matched: '{syn}'")
                    break

            # 3. Clinical Token Overlap
            concept_tokens = set(re.findall(r"\w+", concept_name + " " + " ".join(synonyms)))
            overlap = query_tokens.intersection(concept_tokens)
            if overlap:
                overlap_ratio = len(overlap) / max(1, len(query_tokens))
                token_bonus = min(0.20, overlap_ratio * 0.20)
                bonus_score += token_bonus
                matched_signals.append(f"Clinical keyword overlap: {', '.join(list(overlap)[:4])}")

            # 4. Target Terminology Alignment
            if target_terminology and target_terminology != "All":
                if terminology.lower() == target_terminology.lower():
                    bonus_score += 0.10
                    matched_signals.append(f"Target terminology match: {terminology}")
                else:
                    bonus_score -= 0.15

            # 5. Domain Relevance from Description
            desc_tokens = set(re.findall(r"\w+", description))
            desc_overlap = query_tokens.intersection(desc_tokens)
            if len(desc_overlap) >= 2:
                bonus_score += 0.08
                matched_signals.append(f"Pathophysiological concordance ({domain})")

            # Hybrid Score calculation (weighted combination)
            hybrid_score = (0.50 * sim_score) + bonus_score
            hybrid_score = max(0.05, min(0.99, round(hybrid_score, 4)))

            scored_candidates.append({
                "concept_id": cand["concept_id"],
                "concept_name": cand["concept_name"],
                "terminology": cand["terminology"],
                "domain": domain,
                "similarity_score": sim_score,
                "hybrid_score": hybrid_score,
                "description": cand["description"],
                "synonyms": cand.get("synonyms", []),
                "umls_cui": cand.get("umls_cui"),
                "matched_signals": matched_signals
            })

        # Sort descending by hybrid_score
        scored_candidates.sort(key=lambda x: x["hybrid_score"], reverse=True)

        top_candidates = scored_candidates[:top_k]

        # Calibrated confidence probability estimation
        # Uses top hybrid score and margin between top candidate and 2nd candidate
        top_score = top_candidates[0]["hybrid_score"] if top_candidates else 0.0
        second_score = top_candidates[1]["hybrid_score"] if len(top_candidates) > 1 else 0.0
        margin = max(0.0, top_score - second_score)

        # Confidence calibration formula
        calibrated_conf = (0.65 * top_score) + (0.35 * min(1.0, margin * 2.5))
        calibrated_conf = max(0.10, min(0.98, round(calibrated_conf, 3)))

        if calibrated_conf >= 0.82:
            conf_label = "High"
            requires_human_review = False
        elif calibrated_conf >= 0.65:
            conf_label = "Medium"
            requires_human_review = margin < 0.06  # review if ambiguous close call
        else:
            conf_label = "Low"
            requires_human_review = True

        # Assign ranks and contrastive rejection rationale for alternative candidates
        result_candidates = []
        top_name = top_candidates[0]["concept_name"] if top_candidates else ""

        for idx, item in enumerate(top_candidates, start=1):
            rel_reason = None
            if idx > 1:
                rel_diff = round(top_score - item["hybrid_score"], 3)
                rel_reason = (
                    f"Ranked below #{1} ('{top_name}') by a margin of {rel_diff}. "
                    f"Has lower semantic/synonym concordance with query context '{query_lower}'."
                )

            result_candidates.append(CandidateConcept(
                concept_id=item["concept_id"],
                concept_name=item["concept_name"],
                terminology=item["terminology"],
                domain=item["domain"],
                similarity_score=item["similarity_score"],
                hybrid_score=item["hybrid_score"],
                rank=idx,
                description=item["description"],
                synonyms=item["synonyms"],
                umls_cui=item.get("umls_cui"),
                matched_signals=item["matched_signals"],
                relative_rejection_reason=rel_reason
            ))

        return result_candidates, calibrated_conf, conf_label, requires_human_review

ranking_service = RankingService()

