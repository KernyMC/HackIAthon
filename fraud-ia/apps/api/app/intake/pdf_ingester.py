# apps/api/app/intake/pdf_ingester.py
import logging
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.config import get_settings
from ..rag.embeddings import get_embedding

logger = logging.getLogger(__name__)


def _chunk_text(text_content: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Split plain text into overlapping chunks."""
    words = text_content.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return [c for c in chunks if len(c.strip()) > 50]


async def extraer_texto_pdf(pdf_bytes: bytes) -> str:
    """Extract full text from PDF using Gemini multimodal."""
    settings = get_settings()
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel, Part

        vertexai.init(
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
        )
        model = GenerativeModel(settings.gemini_model)
        pdf_part = Part.from_data(data=pdf_bytes, mime_type="application/pdf")
        response = model.generate_content([
            pdf_part,
            "Extrae todo el texto del documento tal como aparece. No agregues comentarios ni resúmenes.",
        ])
        return response.text
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise


def ingestar_en_rag(db: Session, texto: str, nombre_archivo: str) -> str:
    """Chunk, embed, and insert PDF text into rag.business_chunks. Returns doc_id."""
    doc_id = f"peritaje_{uuid.uuid4().hex[:8]}"
    chunks = _chunk_text(texto)

    for i, chunk_text in enumerate(chunks):
        try:
            embedding = get_embedding(chunk_text)
            embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
            db.execute(
                text("""
                    INSERT INTO rag.business_chunks
                        (source_name, title, section, doc_type, chunk_text, embedding)
                    VALUES (:source, :title, :section, 'peritaje', :chunk, :emb::vector)
                """),
                {
                    "source": doc_id,
                    "title": nombre_archivo,
                    "section": f"chunk_{i + 1}",
                    "chunk": chunk_text,
                    "emb": embedding_str,
                },
            )
        except Exception as e:
            logger.warning(f"Failed to embed chunk {i}: {e}")

    db.commit()
    logger.info(f"Ingested {len(chunks)} chunks from '{nombre_archivo}' as {doc_id}")
    return doc_id
