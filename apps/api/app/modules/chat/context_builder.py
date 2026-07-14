from dataclasses import dataclass
from typing import Sequence

from app.ai.retrieval.hybrid import (
    HybridSearchResult,
)


@dataclass(frozen=True)
class ContextSource:
    """
    One source included in the final LLM context.
    """

    citation_number: int
    result: HybridSearchResult
    formatted_text: str


@dataclass(frozen=True)
class BuiltContext:
    """
    Final context and citation mapping sent to the LLM.
    """

    context_text: str
    sources: list[ContextSource]


class RAGContextBuilder:
    """
    Convert retrieved chunks into structured, citation-aware context.
    """

    def __init__(
        self,
        *,
        maximum_characters: int = 24000,
        preview_characters: int = 240,
    ) -> None:
        if maximum_characters <= 0:
            raise ValueError(
                "Maximum context characters must be positive."
            )

        if preview_characters <= 0:
            raise ValueError(
                "Preview characters must be positive."
            )

        self.maximum_characters = maximum_characters
        self.preview_characters = preview_characters

    def build(
        self,
        results: Sequence[HybridSearchResult],
    ) -> BuiltContext:
        """
        Build context while preserving source-to-citation mapping.
        """

        sources: list[ContextSource] = []
        context_parts: list[str] = []

        used_characters = 0

        seen_items: set[str] = set()

        for result in results:
            if result.item_id in seen_items:
                continue

            seen_items.add(
                result.item_id
            )

            content = self._normalize_text(
                result.content
            )

            if not content:
                continue

            citation_number = len(sources) + 1

            page_label = (
                str(result.page_number)
                if result.page_number is not None
                else "unknown"
            )

            formatted_text = (
                f"[Source {citation_number}]\n"
                f"Filename: {result.filename}\n"
                f"Document ID: {result.document_id}\n"
                f"Chunk Index: {result.chunk_index}\n"
                f"Page: {page_label}\n"
                f"Content:\n{content}"
            )

            separator_length = (
                2 if context_parts else 0
            )

            projected_characters = (
                used_characters
                + separator_length
                + len(formatted_text)
            )

            if (
                projected_characters
                > self.maximum_characters
            ):
                remaining_characters = (
                    self.maximum_characters
                    - used_characters
                    - separator_length
                )

                if remaining_characters <= 200:
                    break

                formatted_text = (
                    formatted_text[
                        :remaining_characters
                    ].rstrip()
                    + "\n[Context truncated]"
                )

            source = ContextSource(
                citation_number=(
                    citation_number
                ),
                result=result,
                formatted_text=(
                    formatted_text
                ),
            )

            sources.append(
                source
            )

            context_parts.append(
                formatted_text
            )

            used_characters = len(
                "\n\n".join(
                    context_parts
                )
            )

            if (
                used_characters
                >= self.maximum_characters
            ):
                break

        return BuiltContext(
            context_text="\n\n".join(
                context_parts
            ),
            sources=sources,
        )

    def build_preview(
        self,
        content: str,
    ) -> str:
        """
        Return a compact source preview for the API response.
        """

        normalized_content = self._normalize_text(
            content
        )

        if (
            len(normalized_content)
            <= self.preview_characters
        ):
            return normalized_content

        return (
            normalized_content[
                :self.preview_characters
            ].rstrip()
            + "..."
        )

    @staticmethod
    def _normalize_text(
        text: str,
    ) -> str:
        return " ".join(
            text.split()
        ).strip()