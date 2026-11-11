import os
import csv
import json
import logging
import numpy as np
import faiss
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger("vector_search")

class VectorSearchService:
    def __init__(self):
        self.index = None
        self.concepts: List[Dict[str, Any]] = []
        self.dimension = settings.EMBEDDING_DIMENSION
        self.is_initialized = False

    def build_or_load_index(self, force_rebuild: bool = False):
        """Builds or loads the FAISS index with medical concepts and metadata."""
        if not force_rebuild and os.path.exists(settings.FAISS_INDEX_PATH) and os.path.exists(settings.FAISS_METADATA_PATH):
            try:
                logger.info(f"Loading existing FAISS index from {settings.FAISS_INDEX_PATH}")
                self.index = faiss.read_index(str(settings.FAISS_INDEX_PATH))
                with open(settings.FAISS_METADATA_PATH, "r", encoding="utf-8") as f:
                    self.concepts = json.load(f)
                self.dimension = self.index.d
                self.is_initialized = True
                logger.info(f"FAISS index loaded. Total concepts: {len(self.concepts)}, Dim: {self.dimension}")
                return
            except Exception as e:
                logger.warning(f"Could not load cached FAISS index: {e}. Rebuilding...")

        self._rebuild_index()

    def _rebuild_index(self):
        logger.info("Rebuilding FAISS index from sample concepts CSV...")
        concepts_list = []
        texts_to_embed = []

        if not os.path.exists(settings.CONCEPTS_CSV_PATH):
            raise FileNotFoundError(f"Concepts CSV not found at {settings.CONCEPTS_CSV_PATH}")

        with open(settings.CONCEPTS_CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                concept_id = row["concept_id"].strip()
                name = row["concept_name"].strip()
                terminology = row["terminology"].strip()
                domain = row["domain"].strip()
                desc = row["description"].strip()
                synonyms_raw = row["synonyms"].strip()
                synonyms = [s.strip() for s in synonyms_raw.split("|") if s.strip()]
                umls_cui = row.get("umls_cui", "").strip()

                concept_data = {
                    "concept_id": concept_id,
                    "concept_name": name,
                    "terminology": terminology,
                    "domain": domain,
                    "description": desc,
                    "synonyms": synonyms,
                    "umls_cui": umls_cui
                }
                concepts_list.append(concept_data)

                # Rich composite representation for dense vector mapping
                syn_str = ", ".join(synonyms)
                composite_text = f"{name}. Synonyms: {syn_str}. Definition: {desc} Domain: {domain}."
                texts_to_embed.append(composite_text)

        logger.info(f"Encoding {len(texts_to_embed)} medical concepts...")
        embeddings = embedding_service.encode(texts_to_embed)
        embeddings = np.ascontiguousarray(embeddings, dtype=np.float32)

        # L2 normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        self.dimension = embeddings.shape[1]

        # Inner Product on normalized vectors is exact Cosine Similarity
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)
        self.concepts = concepts_list
        self.is_initialized = True

        # Save to disk
        try:
            faiss.write_index(self.index, str(settings.FAISS_INDEX_PATH))
            with open(settings.FAISS_METADATA_PATH, "w", encoding="utf-8") as f:
                json.dump(self.concepts, f, indent=2)
            logger.info(f"FAISS index and metadata successfully saved to {settings.VECTOR_STORE_DIR}")
        except Exception as e:
            logger.error(f"Failed to persist FAISS index: {e}")

    def search(
        self,
        query_text: str,
        top_k: int = 10,
        terminology_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches FAISS index for top_k semantic neighbors of query_text,
        optionally filtered by terminology system.
        """
        if not self.is_initialized or self.index is None:
            self.build_or_load_index()

        q_vec = embedding_service.encode(query_text)
        q_vec = np.ascontiguousarray(q_vec.reshape(1, -1), dtype=np.float32)
        faiss.normalize_L2(q_vec)

        # Retrieve a wider pool if filtering is applied
        retrieve_k = min(len(self.concepts), top_k * 3 if terminology_filter and terminology_filter != "All" else top_k)
        scores, indices = self.index.search(q_vec, retrieve_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or idx >= len(self.concepts):
                continue
            item = dict(self.concepts[idx])
            sim_score = max(0.0, min(1.0, float(score)))  # clamp 0 to 1
            item["similarity_score"] = round(sim_score, 4)

            # Apply terminology filter if requested
            if terminology_filter and terminology_filter != "All":
                if item["terminology"].lower() != terminology_filter.lower():
                    continue

            results.append(item)
            if len(results) >= top_k:
                break

        return results

vector_search_service = VectorSearchService()

