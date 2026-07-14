import json
from dataclasses import dataclass


@dataclass(frozen=True)
class SSEEvent:
    """
    One Server-Sent Event message.
    """

    event: str
    data: object

    def encode(self) -> str:
        payload = json.dumps(
            self.data,
            ensure_ascii=False,
            default=str,
        )

        return (
            f"event: {self.event}\n"
            f"data: {payload}\n\n"
        )