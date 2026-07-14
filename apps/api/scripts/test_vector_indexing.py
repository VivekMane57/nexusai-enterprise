from uuid import uuid4

from app.ai.embeddings.bge import (
    get_embedding_service,
)
from app.ai.retrieval.dense import (
    QdrantVectorStore,
)


def main() -> None:
    knowledge_base_id = uuid4()

    chunks = [
        (
            "NexusAI supports hybrid RAG using dense "
            "and sparse retrieval."
        ),
        (
            "The platform uses LangGraph to orchestrate "
            "agent workflows and tool execution."
        ),
        (
            "Qdrant stores normalized embeddings for "
            "semantic document retrieval."
        ),
    ]

    embedding_service = get_embedding_service()
    vector_store = QdrantVectorStore()

    print("=" * 60)
    print("EMBEDDING AND QDRANT TEST")
    print("=" * 60)
    print(f"Model: {embedding_service.model_name}")
    print(f"Dimension: {embedding_service.dimension}")
    print(f"Knowledge base: {knowledge_base_id}")

    vectors = embedding_service.embed_documents(
        chunks
    )

    vector_store.ensure_collection(
        knowledge_base_id=knowledge_base_id,
        vector_size=embedding_service.dimension,
    )

    point_ids = [
        uuid4()
        for _ in chunks
    ]

    payloads = [
        {
            "knowledge_base_id": str(
                knowledge_base_id
            ),
            "document_id": str(uuid4()),
            "chunk_index": index,
            "content": content,
            "source": "local_test",
        }
        for index, content in enumerate(chunks)
    ]

    inserted_count = vector_store.upsert_chunks(
        knowledge_base_id=knowledge_base_id,
        point_ids=point_ids,
        vectors=vectors,
        payloads=payloads,
    )

    query = (
        "Which vector database is used "
        "for semantic retrieval?"
    )

    query_vector = embedding_service.embed_query(
        query
    )

    results = vector_store.search(
        knowledge_base_id=knowledge_base_id,
        query_vector=query_vector,
        limit=3,
    )

    print(f"\nInserted points: {inserted_count}")
    print(f"Query: {query}")
    print("\nSearch results:")

    for rank, result in enumerate(
        results,
        start=1,
    ):
        print("\n" + "-" * 60)
        print(f"Rank: {rank}")
        print(f"Score: {result.score:.4f}")
        print(f"Chunk: {result.chunk_index}")
        print(result.content)

    vector_store.delete_collection(
        knowledge_base_id=knowledge_base_id
    )

    print("\nTemporary test collection deleted.")


if __name__ == "__main__":
    main()