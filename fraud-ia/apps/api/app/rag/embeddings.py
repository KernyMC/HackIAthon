import logging
from typing import List
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_embedding(text: str) -> List[float]:
    """Generate embedding for a text using Vertex AI."""
    try:
        import vertexai
        from vertexai.language_models import TextEmbeddingModel

        vertexai.init(
            project=settings.google_cloud_project,
            location=settings.google_cloud_location,
        )
        model = TextEmbeddingModel.from_pretrained(settings.embedding_model)
        embeddings = model.get_embeddings(
            [text],
            output_dimensionality=settings.embedding_dim,
        )
        return embeddings[0].values
    except Exception as e:
        logger.error(f"Vertex AI embedding failed: {e}, trying google-generativeai")
        return _get_embedding_genai(text)


def _get_embedding_genai(text: str) -> List[float]:
    import google.generativeai as genai

    genai.configure(api_key=None)  # uses ADC
    result = genai.embed_content(
        model=f"models/{settings.embedding_model}",
        content=text,
        output_dimensionality=settings.embedding_dim,
    )
    return result["embedding"]


def get_embeddings_batch(texts: List[str], batch_size: int = 5) -> List[List[float]]:
    """Generate embeddings for a list of texts in batches."""
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        for t in batch:
            emb = get_embedding(t)
            all_embeddings.append(emb)
    return all_embeddings
