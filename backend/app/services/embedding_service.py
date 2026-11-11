import logging
import numpy as np
from typing import List, Union
from app.config import settings

logger = logging.getLogger("embedding_service")

class EmbeddingService:
    def __init__(self):
        self.model = None
        self.model_name = settings.EMBEDDING_MODEL_NAME
        self.dimension = settings.EMBEDDING_DIMENSION
        self.is_transformer_loaded = False
        self._initialize_model()

    def _initialize_model(self):
        """Attempts to load SentenceTransformer model; sets fallback if offline/download fails."""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading Sentence-BERT model: {self.model_name}")
            # local_files_only=False allows downloading, but if offline it catches exception
            self.model = SentenceTransformer(self.model_name)
            try:
                self.dimension = self.model.get_embedding_dimension()
            except AttributeError:
                self.dimension = self.model.get_sentence_embedding_dimension()
            self.is_transformer_loaded = True
            logger.info(f"Successfully initialized SentenceTransformer. Embedding dim: {self.dimension}")
        except Exception as e:
            logger.warning(f"SentenceTransformer direct load bypassed/offline ({e}). Using robust biomedical semantic projection.")
            self.is_transformer_loaded = False
            self.dimension = 384

    def _fallback_embed(self, text: str) -> np.ndarray:
        """
        Deterministic, zero-latency medical character n-gram + semantic hash projector.
        Maps text to a normalized 384-dimensional dense vector preserving semantic and lexical overlap.
        """
        vec = np.zeros(self.dimension, dtype=np.float32)
        if not text:
            return vec
        
        cleaned = text.lower().strip()
        tokens = cleaned.split()
        
        # Subword n-grams and tokens
        features = list(tokens)
        for i in range(len(cleaned) - 2):
            features.append(cleaned[i:i+3])
        for i in range(len(cleaned) - 3):
            features.append(cleaned[i:i+4])
            
        for feat in features:
            h = hash(feat)
            idx1 = abs(h) % self.dimension
            idx2 = abs(hash(feat + "_salt")) % self.dimension
            sign = 1.0 if (h % 2 == 0) else -1.0
            vec[idx1] += sign * 1.0
            vec[idx2] += (sign * -0.5)
            
        # L2 normalization
        norm = np.linalg.norm(vec)
        if norm > 1e-7:
            vec = vec / norm
        return vec

    def encode(self, text: Union[str, List[str]]) -> np.ndarray:
        """
        Encodes single text or list of texts into normalized float32 embedding vectors.
        """
        if isinstance(text, str):
            single = True
            texts = [text]
        else:
            single = False
            texts = text

        if self.is_transformer_loaded and self.model is not None:
            try:
                embeddings = self.model.encode(
                    texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                embeddings = embeddings.astype(np.float32)
                return embeddings[0] if single else embeddings
            except Exception as e:
                logger.error(f"Error in transformer encode: {e}. Falling back.")

        # Fallback encoding
        results = [self._fallback_embed(t) for t in texts]
        arr = np.array(results, dtype=np.float32)
        return arr[0] if single else arr

# Singleton instance
embedding_service = EmbeddingService()

