"""
Vector Store Service
────────────────────
Singleton wrapper around ChromaDB.
Handles:
  • Embedding text via OpenAI text-embedding-3-small
  • Indexing resumes and job descriptions as vectors
  • Semantic similarity search (cosine distance)
  • Finding best-matching resumes for a given JD
"""
import logging
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Thin wrapper around OpenAI embeddings — singleton."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._ready = False
        return cls._instance

    def _ensure_ready(self):
        if not self._ready:
            from openai import OpenAI
            self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self._model  = getattr(settings, 'OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')
            self._ready  = True

    def embed(self, text: str) -> list[float]:
        """Embed a single text string → list[float]."""
        self._ensure_ready()
        text = text.replace('\n', ' ').strip()[:8000]
        resp = self._client.embeddings.create(model=self._model, input=text)
        return resp.data[0].embedding

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of strings in one API call."""
        self._ensure_ready()
        cleaned = [t.replace('\n', ' ').strip()[:8000] for t in texts]
        resp = self._client.embeddings.create(model=self._model, input=cleaned)
        return [item.embedding for item in resp.data]


class VectorStoreService:
    """ChromaDB vector store — singleton."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._ready = False
        return cls._instance

    def _ensure_ready(self):
        if not self._ready:
            import chromadb
            persist_dir = getattr(settings, 'CHROMA_PERSIST_DIR', './chroma_db')
            self._client = chromadb.PersistentClient(path=persist_dir)
            self._embedder = EmbeddingService()

            resume_col = getattr(settings, 'CHROMA_COLLECTION_NAME',    'resumes')
            jd_col     = getattr(settings, 'CHROMA_JD_COLLECTION_NAME', 'job_descriptions')

            self._resumes = self._client.get_or_create_collection(
                name=resume_col, metadata={'hnsw:space': 'cosine'}
            )
            self._jds = self._client.get_or_create_collection(
                name=jd_col, metadata={'hnsw:space': 'cosine'}
            )
            self._ready = True
            logger.info('VectorStoreService ready (ChromaDB)')

    # ── Resume operations ──────────────────────────────────────────

    def index_resume(self, resume_id: str, text: str, metadata: dict) -> None:
        """Add or update a resume vector. Call after parsing."""
        self._ensure_ready()
        embedding = self._embedder.embed(text)
        self._resumes.upsert(
            ids        = [resume_id],
            embeddings = [embedding],
            documents  = [text[:5000]],
            metadatas  = [{
                'resume_id':          resume_id,
                'candidate_name':     str(metadata.get('candidate_name', '')),
                'candidate_email':    str(metadata.get('candidate_email', '')),
                'company_id':         str(metadata.get('company_id', '')),
                'experience_years':   str(metadata.get('total_experience_years', 0)),
                'highest_education':  str(metadata.get('highest_education', '')),
            }],
        )
        logger.debug(f'Resume {resume_id} indexed in vector store.')

    def delete_resume(self, resume_id: str) -> None:
        self._ensure_ready()
        try:
            self._resumes.delete(ids=[resume_id])
        except Exception as e:
            logger.warning(f'Could not delete resume {resume_id} from vector store: {e}')

    # ── JD operations ──────────────────────────────────────────────

    def index_job(self, job_id: str, text: str, metadata: dict) -> None:
        """Add or update a JD vector."""
        self._ensure_ready()
        embedding = self._embedder.embed(text)
        self._jds.upsert(
            ids        = [job_id],
            embeddings = [embedding],
            documents  = [text[:5000]],
            metadatas  = [{
                'job_id':           job_id,
                'title':            str(metadata.get('title', '')),
                'company_id':       str(metadata.get('company_id', '')),
                'experience_level': str(metadata.get('experience_level', '')),
            }],
        )
        logger.debug(f'Job {job_id} indexed in vector store.')

    # ── Similarity queries ─────────────────────────────────────────

    def resume_similarity(self, resume_id: str, jd_text: str) -> float:
        """
        Cosine similarity between a specific resume and a JD text.
        Returns a float 0–1 (1 = identical).
        """
        self._ensure_ready()
        jd_embedding = self._embedder.embed(jd_text)
        result = self._resumes.query(
            query_embeddings = [jd_embedding],
            n_results        = 1,
            where            = {'resume_id': resume_id},
            include          = ['distances'],
        )
        if result['ids'] and result['ids'][0]:
            # ChromaDB cosine distance: 0 = identical, 2 = opposite
            # Similarity = 1 - distance/2  (maps to 0–1)
            distance = result['distances'][0][0]
            return round(max(0.0, 1.0 - distance), 4)
        return 0.0

    def find_similar_resumes(
        self,
        jd_text:    str,
        company_id: str,
        n_results:  int = 20,
    ) -> list[dict]:
        """
        Find the top-N resumes (by semantic similarity) for a JD.
        Returns list of {resume_id, similarity, metadata}.
        Useful for suggesting which resumes to screen.
        """
        self._ensure_ready()
        jd_embedding = self._embedder.embed(jd_text)
        result = self._resumes.query(
            query_embeddings = [jd_embedding],
            n_results        = n_results,
            where            = {'company_id': company_id},
            include          = ['documents', 'metadatas', 'distances'],
        )
        candidates = []
        for i, rid in enumerate(result['ids'][0]):
            similarity = round(max(0.0, 1.0 - result['distances'][0][i]), 4)
            candidates.append({
                'resume_id':  rid,
                'similarity': similarity,
                'metadata':   result['metadatas'][0][i],
            })
        # Already sorted by distance (ascending) → reverse for descending similarity
        candidates.sort(key=lambda x: x['similarity'], reverse=True)
        return candidates