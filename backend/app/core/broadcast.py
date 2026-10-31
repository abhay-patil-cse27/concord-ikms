"""
Reusable publish-subscribe broadcast hub for real-time institutional events.
Enables real-time push to active SSE clients and multi-user sessions (Option C).
"""
import asyncio
from typing import Set, Dict, Any, Optional
from app.core.logging import logger
from app.core.sse import format_sse_event


class BroadcastHub:
    """
    Asynchronous Pub/Sub broker for real-time Server-Sent Events (SSE).
    Coordinates push notifications across active browser tabs and client sessions.
    """

    def __init__(self, max_queue_size: int = 100) -> None:
        self._subscribers: Set[asyncio.Queue] = set()
        self._max_queue_size = max_queue_size

    def subscribe(self) -> asyncio.Queue:
        """Register a new active client listener queue."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=self._max_queue_size)
        self._subscribers.add(queue)
        logger.debug(f"BroadcastHub: Client subscribed. Active listeners: {len(self._subscribers)}")
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Deregister client listener queue on disconnection."""
        self._subscribers.discard(queue)
        logger.debug(f"BroadcastHub: Client unsubscribed. Remaining listeners: {len(self._subscribers)}")

    async def publish(self, event_type: str, data: Dict[str, Any]) -> int:
        """
        Broadcast an event to all connected subscriber queues.
        Returns the number of clients that received the event payload.
        """
        if not self._subscribers:
            logger.debug(f"BroadcastHub: No active subscribers for event '{event_type}'.")
            return 0

        formatted_chunk = format_sse_event(event_type, data)
        deliveries = 0
        stale_queues = []

        for queue in list(self._subscribers):
            try:
                # Non-blocking enqueue to maintain high throughput
                queue.put_nowait(formatted_chunk)
                deliveries += 1
            except asyncio.QueueFull:
                logger.warning("BroadcastHub: Client queue full. Dropping message for lagging subscriber.")
            except Exception as exc:
                logger.error(f"BroadcastHub: Delivery exception: {exc}")
                stale_queues.append(queue)

        for stale in stale_queues:
            self._subscribers.discard(stale)

        logger.info(f"BroadcastHub: Event '{event_type}' delivered to {deliveries} subscriber(s).")
        return deliveries

    @property
    def subscriber_count(self) -> int:
        """Returns the current number of active subscriber queues."""
        return len(self._subscribers)


# Global singleton broadcast broker
broadcast_hub = BroadcastHub()

