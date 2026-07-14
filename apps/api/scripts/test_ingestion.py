from pathlib import Path

from app.ai.rag.chunking import RecursiveTextChunker
from app.modules.documents.constants import DocumentType
from app.modules.documents.extractor import (
    DocumentTextExtractor,
)


def detect_document_type(
    file_path: Path,
) -> DocumentType:
    extension = file_path.suffix.lower()

    mapping = {
        ".pdf": DocumentType.PDF,
        ".docx": DocumentType.DOCX,
        ".txt": DocumentType.TXT,
    }

    try:
        return mapping[extension]
    except KeyError as exc:
        raise ValueError(
            f"Unsupported extension: {extension}"
        ) from exc


def main() -> None:
    sample_path = Path(
        "sample_data/test_document.txt"
    )

    if not sample_path.exists():
        sample_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        sample_path.write_text(
            (
                "NexusAI Enterprise is an agentic AI platform.\n\n"
                "It supports document ingestion, hybrid retrieval, "
                "agent workflows, evaluation and monitoring.\n\n"
                "The ingestion pipeline extracts document text, "
                "creates overlapping chunks and stores embeddings "
                "inside Qdrant for semantic retrieval."
            ),
            encoding="utf-8",
        )

    extractor = DocumentTextExtractor()

    extracted_document = extractor.extract(
        file_path=str(sample_path),
        file_type=detect_document_type(sample_path),
    )

    chunker = RecursiveTextChunker()

    chunks = chunker.chunk(
        extracted_document.text,
        chunk_size=120,
        chunk_overlap=20,
    )

    print("=" * 60)
    print("DOCUMENT EXTRACTION RESULT")
    print("=" * 60)
    print(f"File: {sample_path}")
    print(
        f"Characters: "
        f"{len(extracted_document.text)}"
    )
    print(
        f"Pages: "
        f"{extracted_document.page_count}"
    )
    print(f"Chunks: {len(chunks)}")

    for chunk in chunks:
        print("\n" + "-" * 60)
        print(
            f"Chunk {chunk.index} "
            f"[{chunk.start_offset}:{chunk.end_offset}]"
        )
        print(
            f"Characters: "
            f"{chunk.character_count}"
        )
        print(chunk.content)


if __name__ == "__main__":
    main()