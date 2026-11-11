import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedRAG Terminology Engine"
    VERSION: str = "2.4.0"
    API_PREFIX: str = "/api"
    
    # Storage
    DATA_DIR: Path = BASE_DIR / "app" / "data"
    CONCEPTS_CSV_PATH: Path = DATA_DIR / "sample_concepts.csv"
    EVALUATION_JSON_PATH: Path = DATA_DIR / "evaluation_dataset.json"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'medical_rag.db'}"
    VECTOR_STORE_DIR: Path = BASE_DIR / "vector_store"
    FAISS_INDEX_PATH: Path = VECTOR_STORE_DIR / "medical_concepts.index"
    FAISS_METADATA_PATH: Path = VECTOR_STORE_DIR / "concepts_meta.json"
    
    # Embedding
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # LLM Settings (optional API keys)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "meditron")
    
    # RAG Settings
    TOP_K_RETRIEVAL: int = 10
    TOP_K_CANDIDATES: int = 5
    SIMILARITY_THRESHOLD: float = 0.40
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
os.makedirs(BASE_DIR / "data", exist_ok=True)
os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)

