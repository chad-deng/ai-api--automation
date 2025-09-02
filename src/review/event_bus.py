"""
Workflow Event Bus Implementation

This module provides the event publishing and subscription system for workflow events
with support for middleware, concurrent processing, and error handling.
"""
import asyncio
from typing import Dict, List, Optional, Set, Any, Callable, Union
from collections import defaultdict
from dataclasses import dataclass, field
import structlog
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager

from .events import (
    WorkflowEventType, 
    WorkflowEventData, 
    WorkflowEvent, 
    EventHandler, 
    AsyncEventHandler, 
    EventMiddleware
)
from src.database.models import get_db

logger = structlog.get_logger()


@dataclass
class SubscriberConfig:
    """Configuration for event subscribers."""
    handler: Union[EventHandler, AsyncEventHandler]
    event_types: Set[WorkflowEventType] = field(default_factory=set)
    priority: int = 100  # Lower numbers = higher priority
    is_async: bool = True
    max_retries: int = 3
    retry_delay: float = 1.0
    enabled: bool = True


@dataclass
class EventProcessingResult:
    """Result of event processing."""
    success: bool
    processed_count: int = 0
    failed_count: int = 0
    errors: List[str] = field(default_factory=list)
    processing_time_ms: float = 0


class WorkflowEventBus:
    """
    Central event bus for workflow events with support for:
    - Synchronous and asynchronous event handlers
    - Event middleware pipeline
    - Concurrent event processing
    - Error handling and retries
    - Event persistence
    """
    
    def __init__(self):
        self._subscribers: Dict[WorkflowEventType, List[SubscriberConfig]] = defaultdict(list)
        self._middleware: List[EventMiddleware] = []
        self._global_handlers: List[SubscriberConfig] = []
        self._processing_lock = asyncio.Lock()
        self._sequence_counters: Dict[str, int] = defaultdict(int)
        self._enabled = True
        
    def add_middleware(self, middleware: EventMiddleware) -> None:
        """Add middleware to the event processing pipeline."""
        self._middleware.append(middleware)
        logger.debug("Added event middleware", middleware_type=type(middleware).__name__)
    
    def subscribe(
        self, 
        event_types: Union[WorkflowEventType, Set[WorkflowEventType]], 
        handler: Union[EventHandler, AsyncEventHandler],
        priority: int = 100,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ) -> None:
        """Subscribe to specific event types."""
        if isinstance(event_types, WorkflowEventType):
            event_types = {event_types}
        
        is_async = asyncio.iscoroutinefunction(handler)
        
        subscriber = SubscriberConfig(
            handler=handler,
            event_types=event_types,
            priority=priority,
            is_async=is_async,
            max_retries=max_retries,
            retry_delay=retry_delay
        )
        
        for event_type in event_types:
            self._subscribers[event_type].append(subscriber)
            # Sort by priority (lower numbers first)
            self._subscribers[event_type].sort(key=lambda x: x.priority)
        
        logger.debug(
            "Subscribed to events",
            event_types=[et.value for et in event_types],
            handler=handler.__name__,
            is_async=is_async,
            priority=priority
        )
    
    def subscribe_to_all(
        self, 
        handler: Union[EventHandler, AsyncEventHandler],
        priority: int = 100,
        max_retries: int = 3
    ) -> None:
        """Subscribe to all event types."""
        is_async = asyncio.iscoroutinefunction(handler)
        
        subscriber = SubscriberConfig(
            handler=handler,
            event_types=set(),  # Empty set means all events
            priority=priority,
            is_async=is_async,
            max_retries=max_retries
        )
        
        self._global_handlers.append(subscriber)
        self._global_handlers.sort(key=lambda x: x.priority)
        
        logger.debug(
            "Subscribed to all events",
            handler=handler.__name__,
            is_async=is_async,
            priority=priority
        )
    
    def unsubscribe(self, event_type: WorkflowEventType, handler: Union[EventHandler, AsyncEventHandler]) -> None:
        """Unsubscribe a handler from an event type."""
        subscribers = self._subscribers.get(event_type, [])
        self._subscribers[event_type] = [
            sub for sub in subscribers 
            if sub.handler != handler
        ]
        
        logger.debug(
            "Unsubscribed from event",
            event_type=event_type.value,
            handler=handler.__name__
        )
    
    async def publish(
        self, 
        event_data: WorkflowEventData, 
        persist: bool = True,
        wait_for_completion: bool = False
    ) -> EventProcessingResult:
        """
        Publish an event to all subscribers.
        
        Args:
            event_data: The event data to publish
            persist: Whether to persist the event to database
            wait_for_completion: Whether to wait for all handlers to complete
        
        Returns:
            EventProcessingResult with processing statistics
        """
        if not self._enabled:
            logger.debug("Event bus disabled, skipping event", event_type=event_data.event_type.value)
            return EventProcessingResult(success=True)
        
        start_time = asyncio.get_event_loop().time()
        result = EventProcessingResult(success=True)
        
        try:
            # Apply middleware pipeline
            processed_event = await self._apply_middleware(event_data)
            
            # Persist event if requested
            if persist:
                await self._persist_event(processed_event)
            
            # Get all relevant subscribers
            subscribers = self._get_subscribers(processed_event.event_type)
            
            if not subscribers:
                logger.debug("No subscribers for event", event_type=processed_event.event_type.value)
                return result
            
            # Process events
            if wait_for_completion:
                result = await self._process_subscribers_sync(processed_event, subscribers)
            else:
                # Fire and forget - schedule for background processing
                asyncio.create_task(self._process_subscribers_async(processed_event, subscribers))
                result.processed_count = len(subscribers)
            
        except Exception as e:
            logger.error("Failed to publish event", error=str(e), event_type=event_data.event_type.value)
            result.success = False
            result.errors.append(str(e))
        
        result.processing_time_ms = (asyncio.get_event_loop().time() - start_time) * 1000
        
        logger.info(
            "Event published",
            event_type=event_data.event_type.value,
            aggregate_id=event_data.aggregate_id,
            correlation_id=event_data.metadata.correlation_id,
            subscribers_count=result.processed_count,
            processing_time_ms=result.processing_time_ms,
            success=result.success
        )
        
        return result
    
    async def _apply_middleware(self, event_data: WorkflowEventData) -> WorkflowEventData:
        """Apply middleware pipeline to event data."""
        processed_event = event_data
        
        for middleware in self._middleware:
            try:
                # Middleware can be sync or async
                if asyncio.iscoroutinefunction(middleware):
                    processed_event = await middleware(processed_event)
                else:
                    processed_event = middleware(processed_event)
            except Exception as e:
                logger.error(
                    "Middleware error", 
                    middleware=type(middleware).__name__,
                    error=str(e),
                    event_type=event_data.event_type.value
                )
                raise
        
        return processed_event
    
    def _get_subscribers(self, event_type: WorkflowEventType) -> List[SubscriberConfig]:
        """Get all subscribers for an event type."""
        # Get specific subscribers
        specific_subscribers = [
            sub for sub in self._subscribers.get(event_type, [])
            if sub.enabled
        ]
        
        # Get global subscribers
        global_subscribers = [sub for sub in self._global_handlers if sub.enabled]
        
        # Combine and sort by priority
        all_subscribers = specific_subscribers + global_subscribers
        all_subscribers.sort(key=lambda x: x.priority)
        
        return all_subscribers
    
    async def _process_subscribers_sync(
        self, 
        event_data: WorkflowEventData, 
        subscribers: List[SubscriberConfig]
    ) -> EventProcessingResult:
        """Process subscribers synchronously and wait for completion."""
        result = EventProcessingResult(success=True)
        
        for subscriber in subscribers:
            try:
                await self._invoke_handler(subscriber, event_data)
                result.processed_count += 1
            except Exception as e:
                result.failed_count += 1
                result.errors.append(str(e))
                logger.error(
                    "Handler failed",
                    handler=subscriber.handler.__name__,
                    error=str(e),
                    event_type=event_data.event_type.value
                )
        
        result.success = result.failed_count == 0
        return result
    
    async def _process_subscribers_async(
        self, 
        event_data: WorkflowEventData, 
        subscribers: List[SubscriberConfig]
    ) -> None:
        """Process subscribers asynchronously in the background."""
        tasks = []
        
        for subscriber in subscribers:
            task = asyncio.create_task(
                self._invoke_handler_with_retry(subscriber, event_data)
            )
            tasks.append(task)
        
        # Wait for all tasks to complete
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _invoke_handler(self, subscriber: SubscriberConfig, event_data: WorkflowEventData) -> None:
        """Invoke a single event handler."""
        if subscriber.is_async:
            await subscriber.handler(event_data)
        else:
            # Run sync handler in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, subscriber.handler, event_data)
    
    async def _invoke_handler_with_retry(
        self, 
        subscriber: SubscriberConfig, 
        event_data: WorkflowEventData
    ) -> None:
        """Invoke handler with retry logic."""
        last_error = None
        
        for attempt in range(subscriber.max_retries + 1):
            try:
                await self._invoke_handler(subscriber, event_data)
                return  # Success
            except Exception as e:
                last_error = e
                logger.warning(
                    "Handler attempt failed",
                    handler=subscriber.handler.__name__,
                    attempt=attempt + 1,
                    max_retries=subscriber.max_retries,
                    error=str(e),
                    event_type=event_data.event_type.value
                )
                
                if attempt < subscriber.max_retries:
                    await asyncio.sleep(subscriber.retry_delay)
        
        # All retries exhausted
        logger.error(
            "Handler failed after all retries",
            handler=subscriber.handler.__name__,
            max_retries=subscriber.max_retries,
            final_error=str(last_error),
            event_type=event_data.event_type.value
        )
    
    async def _persist_event(self, event_data: WorkflowEventData) -> None:
        """Persist event to database."""
        try:
            # Get next sequence number for this aggregate
            async with self._processing_lock:
                sequence_number = self._sequence_counters[event_data.aggregate_id] + 1
                self._sequence_counters[event_data.aggregate_id] = sequence_number
            
            # Create database record
            db_event = WorkflowEvent(
                event_id=event_data.event_id,
                event_type=event_data.event_type.value,
                aggregate_id=event_data.aggregate_id,
                aggregate_type="review_workflow",
                sequence_number=sequence_number,
                event_data=event_data.event_data,
                event_metadata=event_data.metadata.__dict__,
                correlation_id=event_data.metadata.correlation_id,
                causation_id=event_data.metadata.causation_id,
                user_id=event_data.metadata.user_id,
                source=event_data.metadata.source,
                created_at=event_data.timestamp
            )
            
            # Save to database
            db = next(get_db())
            try:
                db.add(db_event)
                db.commit()
                logger.debug(
                    "Event persisted",
                    event_id=event_data.event_id,
                    sequence_number=sequence_number,
                    event_type=event_data.event_type.value
                )
            except SQLAlchemyError as e:
                db.rollback()
                raise e
            finally:
                db.close()
                
        except Exception as e:
            logger.error("Failed to persist event", error=str(e), event_id=event_data.event_id)
            raise
    
    def enable(self) -> None:
        """Enable event processing."""
        self._enabled = True
        logger.info("Event bus enabled")
    
    def disable(self) -> None:
        """Disable event processing."""
        self._enabled = False
        logger.info("Event bus disabled")
    
    def get_subscriber_count(self, event_type: Optional[WorkflowEventType] = None) -> int:
        """Get the number of subscribers for an event type or total."""
        if event_type:
            return len(self._subscribers.get(event_type, []))
        else:
            total = sum(len(subs) for subs in self._subscribers.values())
            total += len(self._global_handlers)
            return total
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get event bus statistics."""
        stats = {
            "enabled": self._enabled,
            "total_subscribers": self.get_subscriber_count(),
            "global_handlers": len(self._global_handlers),
            "middleware_count": len(self._middleware),
            "event_type_subscriptions": {
                event_type.value: len(subscribers) 
                for event_type, subscribers in self._subscribers.items()
            }
        }
        return stats


# Global event bus instance
_event_bus: Optional[WorkflowEventBus] = None

def get_event_bus() -> WorkflowEventBus:
    """Get the global event bus instance."""
    global _event_bus
    if _event_bus is None:
        _event_bus = WorkflowEventBus()
    return _event_bus

def reset_event_bus() -> None:
    """Reset the global event bus (mainly for testing)."""
    global _event_bus
    _event_bus = None