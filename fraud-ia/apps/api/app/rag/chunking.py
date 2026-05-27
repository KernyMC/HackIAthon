import re
from typing import List
from dataclasses import dataclass


@dataclass
class Chunk:
    text: str
    section: str
    chunk_index: int
    metadata: dict


def chunk_markdown(
    content: str,
    source_name: str,
    title: str,
    doc_type: str,
    chunk_size: int = 1000,
    overlap: int = 150,
) -> List[Chunk]:
    """Split markdown content into overlapping chunks preserving section context."""
    sections = _split_by_headers(content)
    chunks = []
    chunk_index = 0

    for section_title, section_text in sections:
        paragraphs = [p.strip() for p in section_text.split("\n\n") if p.strip()]
        current = ""

        for para in paragraphs:
            if len(current) + len(para) + 2 <= chunk_size:
                current = (current + "\n\n" + para).strip()
            else:
                if current:
                    chunks.append(
                        Chunk(
                            text=current,
                            section=section_title,
                            chunk_index=chunk_index,
                            metadata={
                                "source_name": source_name,
                                "title": title,
                                "section": section_title,
                                "doc_type": doc_type,
                            },
                        )
                    )
                    chunk_index += 1
                    # overlap: keep last 'overlap' chars
                    overlap_text = current[-overlap:] if len(current) > overlap else current
                    current = (overlap_text + "\n\n" + para).strip()
                else:
                    current = para

        if current:
            chunks.append(
                Chunk(
                    text=current,
                    section=section_title,
                    chunk_index=chunk_index,
                    metadata={
                        "source_name": source_name,
                        "title": title,
                        "section": section_title,
                        "doc_type": doc_type,
                    },
                )
            )
            chunk_index += 1

    return chunks


def _split_by_headers(content: str) -> List[tuple]:
    """Split markdown by h2/h3 headers, returning (header, content) pairs."""
    pattern = re.compile(r"^(#{1,3} .+)$", re.MULTILINE)
    matches = list(pattern.finditer(content))

    if not matches:
        return [("General", content)]

    sections = []
    for i, match in enumerate(matches):
        header = match.group(0).lstrip("#").strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        section_text = content[start:end].strip()
        if section_text:
            sections.append((header, section_text))

    return sections
