import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from .embeddings import get_embedding

logger = logging.getLogger(__name__)


def buscar_conocimiento_negocio(
    db: Session, query: str, top_k: int = 5
) -> list[dict]:
    """
    Generate embedding for query, search rag.business_chunks by cosine similarity.
    Falls back to trigram text search if embeddings are not available.
    """
    try:
        query_embedding = get_embedding(query)
        embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

        sql = text("""
            SELECT
                source_name,
                title,
                section,
                doc_type,
                chunk_text,
                embedding <=> :query_embedding AS distance
            FROM rag.business_chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> :query_embedding
            LIMIT :top_k
        """)
        rows = db.execute(
            sql,
            {"query_embedding": embedding_str, "top_k": top_k},
        ).mappings().all()
        return [dict(r) for r in rows]

    except Exception as e:
        logger.warning(f"Vector search failed ({e}), falling back to text search")
        return _text_search_fallback(db, query, top_k)


def _text_search_fallback(db: Session, query: str, top_k: int) -> list[dict]:
    sql = text("""
        SELECT
            source_name,
            title,
            section,
            doc_type,
            chunk_text,
            0.5 AS distance
        FROM rag.business_chunks
        WHERE chunk_text ILIKE :q
        ORDER BY created_at
        LIMIT :top_k
    """)
    rows = db.execute(sql, {"q": f"%{query}%", "top_k": top_k}).mappings().all()
    return [dict(r) for r in rows]
