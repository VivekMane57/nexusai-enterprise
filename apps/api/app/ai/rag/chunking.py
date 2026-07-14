from dataclasses import dataclass


@dataclass(frozen=True)
class TextChunk:
    index: int
    content: str
    character_count: int
    start_offset: int
    end_offset: int


class RecursiveTextChunker:
    """
    Split text into overlapping chunks while preferring natural boundaries.

    Boundary preference:
    1. Paragraph
    2. Line
    3. Sentence
    4. Word
    5. Hard character boundary
    """

    separators = (
        "\n\n",
        "\n",
        ". ",
        "? ",
        "! ",
        "; ",
        ", ",
        " ",
    )

    def chunk(
        self,
        text: str,
        *,
        chunk_size: int,
        chunk_overlap: int,
    ) -> list[TextChunk]:
        normalized_text = text.strip()

        if not normalized_text:
            return []

        if chunk_size <= 0:
            raise ValueError(
                "Chunk size must be greater than zero."
            )

        if chunk_overlap < 0:
            raise ValueError(
                "Chunk overlap cannot be negative."
            )

        if chunk_overlap >= chunk_size:
            raise ValueError(
                "Chunk overlap must be smaller than chunk size."
            )

        chunks: list[TextChunk] = []
        text_length = len(normalized_text)
        start = 0

        while start < text_length:
            desired_end = min(
                start + chunk_size,
                text_length,
            )

            end = self._find_best_boundary(
                normalized_text,
                start=start,
                desired_end=desired_end,
            )

            content = normalized_text[start:end].strip()

            if content:
                chunks.append(
                    TextChunk(
                        index=len(chunks),
                        content=content,
                        character_count=len(content),
                        start_offset=start,
                        end_offset=end,
                    )
                )

            if end >= text_length:
                break

            next_start = self._calculate_next_start(
                normalized_text,
                current_start=start,
                current_end=end,
                chunk_overlap=chunk_overlap,
            )

            if next_start <= start:
                next_start = end

            start = next_start

        return chunks

    def _find_best_boundary(
        self,
        text: str,
        *,
        start: int,
        desired_end: int,
    ) -> int:
        if desired_end >= len(text):
            return len(text)

        candidate_text = text[start:desired_end]

        minimum_boundary = int(
            len(candidate_text) * 0.60
        )

        for separator in self.separators:
            position = candidate_text.rfind(separator)

            if position >= minimum_boundary:
                return (
                    start
                    + position
                    + len(separator)
                )

        return desired_end

    @staticmethod
    def _calculate_next_start(
        text: str,
        *,
        current_start: int,
        current_end: int,
        chunk_overlap: int,
    ) -> int:
        if chunk_overlap == 0:
            return current_end

        next_start = max(
            current_start + 1,
            current_end - chunk_overlap,
        )

        while (
            next_start < current_end
            and not text[next_start].isspace()
        ):
            next_start += 1

        while (
            next_start < current_end
            and text[next_start].isspace()
        ):
            next_start += 1

        if next_start >= current_end:
            return current_end

        return next_start