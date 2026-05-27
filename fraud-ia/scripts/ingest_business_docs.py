#!/usr/bin/env python3
"""
Ingest business knowledge base documents into rag.business_chunks with embeddings.
Reads Markdown files from docs/business_kb/, chunks them, generates embeddings
with Vertex AI gemini-embedding-001, and stores in AlloyDB.
"""
import os
import sys
import logging
import json
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).parent.parent
DOCS_DIR = REPO_ROOT / "docs" / "business_kb"

sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))


def get_engine():
    from sqlalchemy import create_engine
    from urllib.parse import quote_plus
    host = os.environ.get("ALLOYDB_HOST", "localhost")
    port = os.environ.get("ALLOYDB_PORT", "5432")
    db = os.environ.get("ALLOYDB_DATABASE", "fraudia")
    user = os.environ.get("ALLOYDB_USER", "loader_user")
    password = os.environ.get("ALLOYDB_PASSWORD", "")
    url = f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{db}"
    return create_engine(url, pool_pre_ping=True)


def get_embedding(text_content: str) -> list[float] | None:
    try:
        import vertexai
        from vertexai.language_models import TextEmbeddingModel

        project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
        location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        model_name = os.environ.get("EMBEDDING_MODEL", "gemini-embedding-001")
        dim = int(os.environ.get("EMBEDDING_DIM", "768"))

        vertexai.init(project=project, location=location)
        model = TextEmbeddingModel.from_pretrained(model_name)
        result = model.get_embeddings([text_content], output_dimensionality=dim)
        return result[0].values
    except Exception as e:
        logger.warning(f"Vertex AI embedding failed: {e}")
        return None


def chunk_markdown(content: str, chunk_size: int = 1000, overlap: int = 150) -> list[dict]:
    import re
    chunks = []
    pattern = re.compile(r"^(#{1,3} .+)$", re.MULTILINE)
    matches = list(pattern.finditer(content))

    if not matches:
        sections = [("General", content)]
    else:
        sections = []
        for i, match in enumerate(matches):
            header = match.group(0).lstrip("#").strip()
            start = match.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
            text = content[start:end].strip()
            if text:
                sections.append((header, text))

    chunk_index = 0
    for section, text in sections:
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        current = ""
        for para in paragraphs:
            if len(current) + len(para) + 2 <= chunk_size:
                current = (current + "\n\n" + para).strip()
            else:
                if current:
                    chunks.append({"section": section, "text": current, "index": chunk_index})
                    chunk_index += 1
                    current = (current[-overlap:] + "\n\n" + para).strip()
                else:
                    current = para
        if current:
            chunks.append({"section": section, "text": current, "index": chunk_index})
            chunk_index += 1

    return chunks


def ingest_file(engine, filepath: Path):
    from sqlalchemy import text

    content = filepath.read_text(encoding="utf-8")
    lines = content.split("\n")
    title = lines[0].lstrip("#").strip() if lines else filepath.stem
    source_name = filepath.name
    doc_type = "business_kb"

    logger.info(f"Ingesting: {source_name} ({len(content)} chars)")

    with engine.begin() as conn:
        # Upsert document record
        result = conn.execute(text("""
            INSERT INTO rag.business_documents (source_name, title, doc_type)
            VALUES (:source, :title, :doc_type)
            ON CONFLICT DO NOTHING
            RETURNING id
        """), {"source": source_name, "title": title, "doc_type": doc_type})
        row = result.fetchone()
        if not row:
            row = conn.execute(text(
                "SELECT id FROM rag.business_documents WHERE source_name = :s"
            ), {"s": source_name}).fetchone()
        doc_id = row[0]

        # Delete old chunks
        conn.execute(text(
            "DELETE FROM rag.business_chunks WHERE source_name = :s"
        ), {"s": source_name})

    chunks = chunk_markdown(content)
    logger.info(f"  → {len(chunks)} chunks")

    for chunk in chunks:
        embedding = get_embedding(chunk["text"])
        emb_str = None
        if embedding:
            emb_str = "[" + ",".join(str(v) for v in embedding) + "]"

        with engine.begin() as conn:
            params = {
                "doc_id": doc_id,
                "source": source_name,
                "title": title,
                "section": chunk["section"],
                "doc_type": doc_type,
                "idx": chunk["index"],
                "text": chunk["text"],
                "meta": json.dumps({"source": source_name, "section": chunk["section"]}),
            }
            if emb_str:
                params["emb"] = emb_str
                conn.execute(text("""
                    INSERT INTO rag.business_chunks
                        (document_id, source_name, title, section, doc_type,
                         chunk_index, chunk_text, metadata, embedding)
                    VALUES
                        (:doc_id, :source, :title, :section, :doc_type,
                         :idx, :text, CAST(:meta AS jsonb), CAST(:emb AS vector))
                """), params)
            else:
                conn.execute(text("""
                    INSERT INTO rag.business_chunks
                        (document_id, source_name, title, section, doc_type,
                         chunk_index, chunk_text, metadata)
                    VALUES
                        (:doc_id, :source, :title, :section, :doc_type,
                         :idx, :text, CAST(:meta AS jsonb))
                """), params)

    logger.info(f"  → Inserted {len(chunks)} chunks for {source_name}")


def validate_rag(engine):
    from sqlalchemy import text

    with engine.connect() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM rag.business_chunks")).scalar()
        with_emb = conn.execute(text(
            "SELECT COUNT(*) FROM rag.business_chunks WHERE embedding IS NOT NULL"
        )).scalar()
        logger.info(f"RAG validation: {total} chunks, {with_emb} with embeddings")

        if with_emb > 0:
            sample = conn.execute(text(
                "SELECT chunk_text FROM rag.business_chunks WHERE embedding IS NOT NULL LIMIT 1"
            )).scalar()
            logger.info(f"Sample chunk: {sample[:80]}...")


def main():
    logger.info("=== FraudIA RAG Ingestion ===")

    # Download from GCS if available
    gcs_bucket = os.environ.get("GCS_BUCKET", "")
    if gcs_bucket:
        _download_from_gcs(gcs_bucket)

    engine = get_engine()
    md_files = sorted(DOCS_DIR.glob("*.md"))
    if not md_files:
        logger.error(f"No markdown files found in {DOCS_DIR}")
        sys.exit(1)

    for filepath in md_files:
        try:
            ingest_file(engine, filepath)
        except Exception as e:
            logger.error(f"Failed to ingest {filepath.name}: {e}")

    validate_rag(engine)
    engine.dispose()
    logger.info("=== RAG ingestion completed ===")


def _download_from_gcs(bucket: str):
    try:
        from google.cloud import storage
        from pathlib import Path
        client = storage.Client()
        DOCS_DIR.mkdir(parents=True, exist_ok=True)
        for blob in client.list_blobs(bucket, prefix="docs/business_kb/"):
            if blob.name.endswith(".md"):
                dest = DOCS_DIR / Path(blob.name).name
                blob.download_to_filename(str(dest))
                logger.info(f"  Downloaded: {dest.name}")
    except Exception as e:
        logger.warning(f"GCS download failed: {e}")


if __name__ == "__main__":
    main()
