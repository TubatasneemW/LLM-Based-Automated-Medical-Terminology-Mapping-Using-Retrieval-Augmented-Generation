import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class MappingRecordDB(Base):
    __tablename__ = "mapping_records"
    
    id = Column(String(64), primary_key=True, index=True)
    original_term = Column(String(500), nullable=False, index=True)
    clinical_notes = Column(Text, nullable=True)
    preprocessed_term = Column(String(500), nullable=False)
    selected_concept_id = Column(String(100), nullable=False, index=True)
    selected_concept_name = Column(String(255), nullable=False)
    selected_terminology = Column(String(50), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    confidence_label = Column(String(20), nullable=False)
    review_status = Column(String(20), default="Pending", index=True)
    reviewer_comments = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=False)
    payload_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

