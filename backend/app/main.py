import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.database import init_db, SessionLocal, MappingRecordDB
from app.services.vector_search import vector_search_service
from app.api.mapping import router as mapping_router, execute_mapping_pipeline
from app.api.analytics import router as analytics_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

async def seed_initial_records_if_empty():
    """Seeds a few initial clinical records if database is fresh, providing instant rich metrics."""
    db = SessionLocal()
    try:
        count = db.query(MappingRecordDB).count()
        if count == 0:
            logger.info("Database is empty. Seeding initial authentic medical mapping demonstrations...")
            seed_queries = [
                ("High blood pressure", "SNOMED CT", "Patient seen in cardiology clinic for blood pressure evaluation."),
                ("Patient presents with elevated blood glucose levels and frequent urination", "SNOMED CT", "Fasting blood sugar 184 mg/dL with polyuria and polydipsia."),
                ("Acute heart attack with chest tightness", "SNOMED CT", "Emergency department triage notes: substernal pressure radiating to left arm."),
                ("Shortness of breath on mild exertion", "ICD-10-CM", "Pulmonology evaluation for dyspnea on stairs."),
                ("Confirmed positive SARS-CoV-2 PCR swab", "SNOMED CT", "Infectious disease consult: symptomatic COVID-19 positive."),
                ("hiper tension with headaches", "SNOMED CT", "Outpatient clinic routine check."),
                ("CKD stage III with eGFR 45", "ICD-10-CM", "Nephrology follow-up report.")
            ]

            for term, sys, notes in seed_queries:
                res = await execute_mapping_pipeline(
                    clinical_text=term,
                    target_terminology=sys,
                    clinical_notes=notes
                )
                # Mark first two as Accepted, one as Rejected for realistic distribution
                status = "Accepted" if term in ["High blood pressure", "Acute heart attack with chest tightness"] else ("Rejected" if "hiper tension" in term else "Pending")
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
                    review_status=status,
                    reviewer_comments="Standard verification against clinical guidelines." if status == "Accepted" else None,
                    reasoning=res.reasoning,
                    payload_json=res.model_dump_json()
                )
                db.add(record)
            db.commit()
            logger.info("Database successfully seeded with realistic clinical mappings.")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing MedRAG Terminology Engine backend...")
    init_db()
    vector_search_service.build_or_load_index()
    await seed_initial_records_if_empty()
    yield
    # Shutdown
    logger.info("Shutting down MedRAG backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LLM-Based Automated Medical Terminology Mapping Using Retrieval-Augmented Generation (RAG)",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Routers
app.include_router(mapping_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "api_docs": "/docs",
        "endpoints": {
            "map": "/api/mapping/map",
            "batch": "/api/mapping/batch",
            "history": "/api/mapping/history",
            "overview": "/api/analytics/overview",
            "evaluation": "/api/analytics/evaluation",
            "health": "/api/health"
        }
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "vector_index_initialized": vector_search_service.is_initialized,
        "total_indexed_concepts": len(vector_search_service.concepts),
        "embedding_dimension": vector_search_service.dimension
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

