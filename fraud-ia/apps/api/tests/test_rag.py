"""
Tests for RAG chunking logic — no database required.
"""
import pytest
from apps.api.app.rag.chunking import chunk_markdown


def test_chunk_short_doc():
    content = "# Test Doc\n\nThis is a short document with very little content."
    chunks = chunk_markdown(content, "test.md", "Test Doc", "test")
    assert len(chunks) >= 1
    assert all(c.text for c in chunks)


def test_chunk_preserves_section():
    content = """# Doc
## Section 1
Content of section one that should be grouped together properly.

## Section 2
Content of section two with different material.
"""
    chunks = chunk_markdown(content, "test.md", "Doc", "test")
    sections = [c.section for c in chunks]
    assert "Section 1" in sections or "Section 2" in sections


def test_chunk_large_doc_splits():
    long_para = "Esta es una oración larga. " * 100
    content = f"# Big Doc\n\n{long_para}\n\n{long_para}"
    chunks = chunk_markdown(content, "big.md", "Big", "test", chunk_size=500)
    assert len(chunks) > 1


def test_chunk_returns_metadata():
    content = "# Meta Test\n\nSome content here."
    chunks = chunk_markdown(content, "meta.md", "Meta Test", "kb")
    assert chunks[0].metadata["source_name"] == "meta.md"
    assert chunks[0].metadata["doc_type"] == "kb"


def test_chunk_empty_doc():
    chunks = chunk_markdown("", "empty.md", "Empty", "test")
    assert len(chunks) == 0


def test_chunk_no_headers():
    content = "Just plain text without any markdown headers whatsoever."
    chunks = chunk_markdown(content, "plain.md", "Plain", "test")
    assert len(chunks) >= 1
    assert chunks[0].section == "General"
