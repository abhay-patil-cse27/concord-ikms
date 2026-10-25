"""Reusable Server-Sent Events (SSE) formatter for standardized streaming payloads."""
import json
from typing import Any, Dict, Union


def format_sse_event(event_type: str, data: Union[Dict[str, Any], str, int, float]) -> str:
    """
    Format a standardized SSE event chunk.
    Example output:
        event: token\ndata: {"chunk": "Hello"}\n\n
    """
    payload_str = json.dumps(data) if isinstance(data, (dict, list)) else str(data)
    return f"event: {event_type}\ndata: {payload_str}\n\n"
