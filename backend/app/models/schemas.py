from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CandidateConcept(BaseModel):
    concept_id: str
    concept_name: str
    terminology: str
    domain: str
    similarity_score: float
    hybrid_score: float
    rank: int
    description: str
    synonyms: List[str] = []
    umls_cui: Optional[str] = None
    matched_signals: List[str] = []
    relative_rejection_reason: Optional[str] = None

class EvidenceItem(BaseModel):
    source: str
    identifier: str
    title: str
    snippet: str
    relevance: str

class ProcessingStep(BaseModel):
    step_number: int
    name: str
    status: str
    latency_ms: float
    details: str

class MappingRequest(BaseModel):
    clinical_text: str = Field(..., min_length=2, max_length=2000, description="Clinical term, phrase, or sentence to map")
    target_terminology: Optional[str] = Field("All", description="SNOMED CT, ICD-10-CM, MeSH, UMLS, or All")
    clinical_notes: Optional[str] = Field(None, description="Optional supporting EHR context or patient notes")

class MappingResponse(BaseModel):
    mapping_id: str
    original_term: str
    clinical_notes: Optional[str] = None
    preprocessed_term: str
    selected_concept: CandidateConcept
    similarity_score: float
    confidence_score: float
    confidence_label: str  # High, Medium, Low
    target_terminology: str
    alternatives: List[CandidateConcept] = []
    reasoning: str
    clinical_justification: str
    why_selected: str
    why_alternatives_ranked_lower: List[str] = []
    evidence: List[EvidenceItem] = []
    requires_human_review: bool
    processing_steps: List[ProcessingStep] = []
    reasoning_engine: str
    timestamp: str
    review_status: str = "Pending"  # Pending, Accepted, Rejected

class BatchMappingRequest(BaseModel):
    terms: List[str]
    target_terminology: Optional[str] = "All"

class BatchMappingResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[MappingResponse]

class ReviewRequest(BaseModel):
    action: str = Field(..., description="'accept', 'reject', or 'switch_candidate'")
    selected_candidate_id: Optional[str] = None
    reviewer_comments: Optional[str] = None
    reviewer_id: Optional[str] = "Clinical Staff"

class ReviewResponse(BaseModel):
    mapping_id: str
    review_status: str
    action_applied: str
    reviewed_at: str
    reviewer_comments: Optional[str]

class AnalyticsOverview(BaseModel):
    total_mappings: int
    accepted_mappings: int
    rejected_mappings: int
    pending_reviews: int
    average_confidence: float
    active_accuracy: float
    timeline: List[Dict[str, Any]]
    confidence_distribution: List[Dict[str, Any]]
    terminology_breakdown: List[Dict[str, Any]]
    frequent_terms: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]

class EvaluationResult(BaseModel):
    dataset_size: int
    precision_at_1: float
    precision_at_5: float
    recall_at_5: float
    mrr: float
    top_1_accuracy: float
    top_5_accuracy: float
    mapping_coverage: float
    comparison: List[Dict[str, Any]]
    category_metrics: List[Dict[str, Any]]
    test_cases: List[Dict[str, Any]]

