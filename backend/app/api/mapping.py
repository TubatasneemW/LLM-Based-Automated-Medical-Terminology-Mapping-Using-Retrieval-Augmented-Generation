import uuid
import time
import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.models.database import get_db, MappingRecordDB
from app.models.schemas import (
    MappingRequest, MappingResponse, CandidateConcept, ProcessingStep,
    BatchMappingRequest, BatchMappingResponse, ReviewRequest, ReviewResponse, EvidenceItem
)
from app.services.preprocessing import PreprocessingService
from app.services.embedding_service import embedding_service
from app.services.vector_search import vector_search_service
from app.services.ranking_service import ranking_service
from app.services.rag_service import rag_service

router = APIRouter(prefix="/mapping", tags=["Terminology Mapping"])

async def execute_mapping_pipeline(
    clinical_text: str,
    target_terminology: str = "All",
    clinical_notes: Optional[str] = None
) -> MappingResponse:
    mapping_id = f"map_{uuid.uuid4().hex[:12]}"
    steps: List[ProcessingStep] = []

    # STEP 1: Clinical Text Processing
    t0 = time.time()
    preprocessed_info = PreprocessingService.preprocess_clinical_text(clinical_text)
    cleaned_query = preprocessed_info["cleaned_text"]
    lat_1 = round((time.time() - t0) * 1000, 2)
    steps.append(ProcessingStep(
        step_number=1,
        name="Clinical Text Preprocessing",
        status="completed",
        latency_ms=lat_1,
        details=f"Normalized input, expanded {len(preprocessed_info['expanded_abbreviations'])} acronyms, preserved negation flag ({preprocessed_info['has_negation']})."
    ))

    # STEP 2: Semantic Embedding Generation
    t0 = time.time()
    query_vector = embedding_service.encode(cleaned_query)
    lat_2 = round((time.time() - t0) * 1000, 2)
    steps.append(ProcessingStep(
        step_number=2,
        name="Semantic Embedding Generation",
        status="completed",
        latency_ms=lat_2,
        details=f"Generated {query_vector.shape[0]}-dimensional normalized dense representation."
    ))

    # STEP 3: Vector Database Retrieval (FAISS)
    t0 = time.time()
    retrieved_candidates = vector_search_service.search(
        cleaned_query,
        top_k=10,
        terminology_filter=target_terminology
    )
    lat_3 = round((time.time() - t0) * 1000, 2)
    steps.append(ProcessingStep(
        step_number=3,
        name="Vector Database Retrieval",
        status="completed",
        latency_ms=lat_3,
        details=f"Queried FAISS IndexFlatIP; retrieved {len(retrieved_candidates)} candidate concepts."
    ))

    # STEP 4: Candidate Re-Ranking
    t0 = time.time()
    ranked_candidates, conf_score, conf_label, req_review = ranking_service.rank_candidates(
        clinical_query=clinical_text,
        retrieved_candidates=retrieved_candidates,
        preprocessed_info=preprocessed_info,
        target_terminology=target_terminology,
        top_k=5
    )
    lat_4 = round((time.time() - t0) * 1000, 2)
    steps.append(ProcessingStep(
        step_number=4,
        name="Candidate Re-Ranking & Scoring",
        status="completed",
        latency_ms=lat_4,
        details=f"Applied hybrid multi-signal scoring (cosine, exact matching, synonyms, domain concordance). Calibrated confidence: {conf_score} ({conf_label})."
    ))

    # STEP 5: LLM Semantic Reasoning (RAG)
    t0 = time.time()
    rag_result = await rag_service.reason_and_map(
        clinical_text=clinical_text,
        clinical_notes=clinical_notes,
        preprocessed_info=preprocessed_info,
        ranked_candidates=ranked_candidates,
        confidence_score=conf_score,
        confidence_label=conf_label
    )
    lat_5 = round((time.time() - t0) * 1000, 2)
    selected_concept = rag_result.get("selected_concept") or (ranked_candidates[0] if ranked_candidates else None)
    
    steps.append(ProcessingStep(
        step_number=5,
        name="LLM Semantic Reasoning",
        status="completed",
        latency_ms=lat_5,
        details=f"Reasoned with {rag_result.get('reasoning_engine', 'Clinical Reasoner')}; validated contextual grounding against evidence."
    ))

    # STEP 6: Final Concept Mapping & Evidence Synthesis
    t0 = time.time()
    alternatives = [c for c in ranked_candidates if c.concept_id != selected_concept.concept_id] if selected_concept else []
    lat_6 = round((time.time() - t0) * 1000, 2)
    steps.append(ProcessingStep(
        step_number=6,
        name="Final Concept Mapping",
        status="completed",
        latency_ms=lat_6,
        details=f"Selected {selected_concept.concept_name} ({selected_concept.terminology}: {selected_concept.concept_id}) with {len(alternatives)} ranked alternatives."
    ))

    now_iso = datetime.utcnow().isoformat() + "Z"

    return MappingResponse(
        mapping_id=mapping_id,
        original_term=clinical_text,
        clinical_notes=clinical_notes,
        preprocessed_term=cleaned_query,
        selected_concept=selected_concept,
        similarity_score=selected_concept.similarity_score if selected_concept else 0.0,
        confidence_score=conf_score,
        confidence_label=conf_label,
        target_terminology=target_terminology,
        alternatives=alternatives,
        reasoning=rag_result.get("reasoning", ""),
        clinical_justification=rag_result.get("clinical_justification", ""),
        why_selected=rag_result.get("why_selected", ""),
        why_alternatives_ranked_lower=rag_result.get("why_alternatives_ranked_lower", []),
        evidence=rag_result.get("evidence", []),
        requires_human_review=req_review,
        processing_steps=steps,
        reasoning_engine=rag_result.get("reasoning_engine", "Local Grounded Clinical Reasoner"),
        timestamp=now_iso,
        review_status="Pending"
    )

@router.post("/map", response_model=MappingResponse)
async def map_terminology(req: MappingRequest, db: Session = Depends(get_db)):
    """Executes full RAG terminology mapping pipeline for a single clinical expression."""
    res = await execute_mapping_pipeline(
        clinical_text=req.clinical_text,
        target_terminology=req.target_terminology or "All",
        clinical_notes=req.clinical_notes
    )

    # Persist in DB
    record = MappingRecordDB(
        id=res.mapping_id,
        original_term=res.original_term,
        clinical_notes=res.clinical_notes,
        preprocessed_term=res.preprocessed_term,
        selected_concept_id=res.selected_concept.concept_id,
        selected_concept_name=res.selected_concept.concept_name,
        selected_terminology=res.selected_concept.terminology,
        similarity_score=res.similarity_score,
        confidence_score=res.confidence_score,
        confidence_label=res.confidence_label,
        review_status=res.review_status,
        reasoning=res.reasoning,
        payload_json=res.model_dump_json()
    )
    db.add(record)
    db.commit()

    return res

@router.post("/batch", response_model=BatchMappingResponse)
async def map_batch_terminology(req: BatchMappingRequest, db: Session = Depends(get_db)):
    """Maps a batch of clinical terms, commonly from CSV or bulk entry."""
    results = []
    successful = 0
    failed = 0

    for term in req.terms:
        cleaned = term.strip()
        if not cleaned:
            continue
        try:
            res = await execute_mapping_pipeline(
                clinical_text=cleaned,
                target_terminology=req.target_terminology or "All"
            )
            record = MappingRecordDB(
                id=res.mapping_id,
                original_term=res.original_term,
                clinical_notes=res.clinical_notes,
                preprocessed_term=res.preprocessed_term,
                selected_concept_id=res.selected_concept.concept_id,
                selected_concept_name=res.selected_concept.concept_name,
                selected_terminology=res.selected_concept.terminology,
                similarity_score=res.similarity_score,
                confidence_score=res.confidence_score,
                confidence_label=res.confidence_label,
                review_status=res.review_status,
                reasoning=res.reasoning,
                payload_json=res.model_dump_json()
            )
            db.add(record)
            results.append(res)
            successful += 1
        except Exception as e:
            failed += 1

    db.commit()
    return BatchMappingResponse(
        total=len(req.terms),
        successful=successful,
        failed=failed,
        results=results
    )

@router.get("/history")
def get_mapping_history(
    search: Optional[str] = None,
    terminology: Optional[str] = None,
    confidence: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieves previous terminology mapping requests with comprehensive filtering."""
    query = db.query(MappingRecordDB)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (MappingRecordDB.original_term.ilike(search_fmt)) |
            (MappingRecordDB.selected_concept_name.ilike(search_fmt)) |
            (MappingRecordDB.selected_concept_id.ilike(search_fmt))
        )

    if terminology and terminology != "All":
        query = query.filter(MappingRecordDB.selected_terminology.ilike(terminology.strip()))

    if confidence and confidence != "All":
        query = query.filter(MappingRecordDB.confidence_label.ilike(confidence.strip()))

    if status and status != "All":
        query = query.filter(MappingRecordDB.review_status.ilike(status.strip()))

    total = query.count()
    records = query.order_by(MappingRecordDB.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for r in records:
        try:
            data = json.loads(r.payload_json)
            # Ensure latest review status
            data["review_status"] = r.review_status
            data["reviewer_comments"] = r.reviewer_comments
            items.append(data)
        except Exception:
            pass

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "records": items
    }

@router.get("/export")
def export_history_csv(db: Session = Depends(get_db)):
    """Exports mapping history to CSV format."""
    records = db.query(MappingRecordDB).order_by(MappingRecordDB.created_at.desc()).all()
    
    csv_rows = ["Mapping ID,Original Term,Concept ID,Concept Name,Terminology,Similarity Score,Confidence Score,Confidence Label,Review Status,Created At"]
    for r in records:
        clean_term = r.original_term.replace('"', '""')
        clean_name = r.selected_concept_name.replace('"', '""')
        csv_rows.append(
            f'"{r.id}","{clean_term}","{r.selected_concept_id}","{clean_name}","{r.selected_terminology}",'
            f'{r.similarity_score},{r.confidence_score},"{r.confidence_label}","{r.review_status}","{r.created_at}"'
        )

    content = "\n".join(csv_rows)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=medical_terminology_mappings.csv"}
    )

@router.get("/{mapping_id}", response_model=MappingResponse)
def get_mapping_by_id(mapping_id: str, db: Session = Depends(get_db)):
    """Returns single mapping record with complete evidence and steps."""
    record = db.query(MappingRecordDB).filter(MappingRecordDB.id == mapping_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Mapping record not found")
    
    data = json.loads(record.payload_json)
    data["review_status"] = record.review_status
    data["reviewer_comments"] = record.reviewer_comments
    return data

@router.post("/{mapping_id}/review", response_model=ReviewResponse)
def review_mapping(mapping_id: str, req: ReviewRequest, db: Session = Depends(get_db)):
    """Allows clinician to accept, reject, or switch candidate mapping."""
    record = db.query(MappingRecordDB).filter(MappingRecordDB.id == mapping_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Mapping record not found")

    new_status = "Pending"
    if req.action.lower() == "accept":
        new_status = "Accepted"
    elif req.action.lower() == "reject":
        new_status = "Rejected"
    elif req.action.lower() == "switch_candidate" and req.selected_candidate_id:
        data = json.loads(record.payload_json)
        # Find candidate
        cand = next((c for c in data.get("alternatives", []) if c["concept_id"] == req.selected_candidate_id), None)
        if cand:
            record.selected_concept_id = cand["concept_id"]
            record.selected_concept_name = cand["concept_name"]
            record.selected_terminology = cand["terminology"]
            new_status = "Accepted"
            # Update payload
            data["selected_concept"] = cand
            record.payload_json = json.dumps(data)
    else:
        raise HTTPException(status_code=400, detail="Invalid review action")

    record.review_status = new_status
    record.reviewer_comments = req.reviewer_comments
    db.commit()

    return ReviewResponse(
        mapping_id=mapping_id,
        review_status=new_status,
        action_applied=req.action,
        reviewed_at=datetime.utcnow().isoformat() + "Z",
        reviewer_comments=req.reviewer_comments
    )

