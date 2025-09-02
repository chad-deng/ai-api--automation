"""
Event System Initialization and Integration

This module provides the initialization and integration point for the workflow event system,
including setup of default middleware and integration with the existing application.
"""
import structlog
from typing import Optional
from uuid import uuid4

from .events import WorkflowEventType, WorkflowEventData, EventMetadata
from .event_bus import WorkflowEventBus, get_event_bus, EventProcessingResult
from .middleware import (
    get_default_middleware_pipeline,
    LoggingMiddleware,
    MetricsMiddleware,
    ValidationMiddleware,
    EnrichmentMiddleware
)

logger = structlog.get_logger()


class WorkflowEventSystem:
    """Main interface for the workflow event system."""
    
    def __init__(self, event_bus: Optional[WorkflowEventBus] = None):
        self.event_bus = event_bus or get_event_bus()
        self._initialized = False
    
    def initialize(self, use_default_middleware: bool = True) -> None:
        """Initialize the event system with middleware."""
        if self._initialized:
            logger.warning("Event system already initialized")
            return
        
        if use_default_middleware:
            self._setup_default_middleware()
        
        self._setup_default_event_handlers()
        self._initialized = True
        
        logger.info("Workflow event system initialized")
    
    def _setup_default_middleware(self) -> None:
        """Setup the default middleware pipeline."""
        middleware_pipeline = get_default_middleware_pipeline()
        
        for middleware in middleware_pipeline:
            self.event_bus.add_middleware(middleware)
        
        logger.info("Default middleware pipeline configured", count=len(middleware_pipeline))
    
    def _setup_default_event_handlers(self) -> None:
        """Setup default event handlers for common functionality."""
        
        # Handler for workflow completion events
        async def workflow_completion_handler(event_data: WorkflowEventData):
            """Handle workflow completion events."""
            if event_data.event_type in [
                WorkflowEventType.STATUS_CHANGED_TO_APPROVED,
                WorkflowEventType.STATUS_CHANGED_TO_REJECTED,
                WorkflowEventType.WORKFLOW_COMPLETED,
                WorkflowEventType.WORKFLOW_CANCELLED
            ]:
                logger.info(
                    "Workflow completed",
                    workflow_id=event_data.aggregate_id,
                    status=event_data.event_type.value,
                    correlation_id=event_data.metadata.correlation_id
                )
        
        # Handler for SLA breach events
        async def sla_breach_handler(event_data: WorkflowEventData):
            """Handle SLA breach events."""
            logger.warning(
                "SLA breach detected",
                workflow_id=event_data.aggregate_id,
                correlation_id=event_data.metadata.correlation_id,
                breach_data=event_data.event_data
            )
            
            # Could trigger notifications here
            # await self._send_sla_breach_notification(event_data)
        
        # Handler for error events
        async def error_handler(event_data: WorkflowEventData):
            """Handle error events."""
            logger.error(
                "Workflow error occurred",
                workflow_id=event_data.aggregate_id,
                error_type=event_data.event_type.value,
                error_details=event_data.event_data,
                correlation_id=event_data.metadata.correlation_id
            )
        
        # Subscribe handlers
        completion_events = {
            WorkflowEventType.STATUS_CHANGED_TO_APPROVED,
            WorkflowEventType.STATUS_CHANGED_TO_REJECTED,
            WorkflowEventType.WORKFLOW_COMPLETED,
            WorkflowEventType.WORKFLOW_CANCELLED
        }
        
        error_events = {
            WorkflowEventType.PROCESSING_ERROR,
            WorkflowEventType.VALIDATION_ERROR,
            WorkflowEventType.SYSTEM_ERROR
        }
        
        self.event_bus.subscribe(completion_events, workflow_completion_handler, priority=50)
        self.event_bus.subscribe({WorkflowEventType.SLA_BREACHED}, sla_breach_handler, priority=10)
        self.event_bus.subscribe(error_events, error_handler, priority=1)
        
        logger.info("Default event handlers configured")
    
    async def publish_event(
        self, 
        event_type: WorkflowEventType,
        aggregate_id: str,
        event_data: dict,
        user_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        causation_id: Optional[str] = None,
        wait_for_completion: bool = False
    ) -> EventProcessingResult:
        """
        Convenience method to publish workflow events.
        
        Args:
            event_type: Type of event to publish
            aggregate_id: ID of the aggregate (workflow ID)
            event_data: Event-specific data
            user_id: ID of the user who triggered the event
            correlation_id: Correlation ID for request tracing
            causation_id: ID of the event that caused this event
            wait_for_completion: Whether to wait for all handlers to complete
        
        Returns:
            EventProcessingResult with processing statistics
        """
        if not self._initialized:
            logger.warning("Event system not initialized, initializing with defaults")
            self.initialize()
        
        # Create event metadata
        metadata = EventMetadata(
            user_id=user_id,
            correlation_id=correlation_id or str(uuid4()),  # Ensure correlation_id is never None
            causation_id=causation_id,
            source="workflow_service"
        )
        
        # Create event data
        workflow_event = WorkflowEventData(
            event_type=event_type,
            aggregate_id=aggregate_id,
            event_data=event_data,
            metadata=metadata
        )
        
        # Publish event
        return await self.event_bus.publish(
            workflow_event,
            wait_for_completion=wait_for_completion
        )
    
    def get_statistics(self) -> dict:
        """Get event system statistics."""
        return {
            "initialized": self._initialized,
            "event_bus_stats": self.event_bus.get_statistics()
        }
    
    def enable(self) -> None:
        """Enable event processing."""
        self.event_bus.enable()
    
    def disable(self) -> None:
        """Disable event processing."""
        self.event_bus.disable()


# Global event system instance
_event_system: Optional[WorkflowEventSystem] = None

def get_event_system() -> WorkflowEventSystem:
    """Get the global event system instance."""
    global _event_system
    if _event_system is None:
        _event_system = WorkflowEventSystem()
    return _event_system

def initialize_event_system() -> WorkflowEventSystem:
    """Initialize the global event system."""
    event_system = get_event_system()
    event_system.initialize()
    return event_system


# Convenience functions for common event publishing
async def publish_workflow_created(
    workflow_id: str,
    generated_test_id: int,
    user_id: str,
    correlation_id: Optional[str] = None
) -> EventProcessingResult:
    """Publish workflow created event."""
    event_system = get_event_system()
    return await event_system.publish_event(
        event_type=WorkflowEventType.WORKFLOW_CREATED,
        aggregate_id=workflow_id,
        event_data={
            "workflow_id": workflow_id,
            "generated_test_id": generated_test_id,
            "created_by": user_id
        },
        user_id=user_id,
        correlation_id=correlation_id
    )

async def publish_status_changed(
    workflow_id: str,
    old_status: str,
    new_status: str,
    changed_by: str,
    correlation_id: Optional[str] = None,
    causation_id: Optional[str] = None
) -> EventProcessingResult:
    """Publish status changed event."""
    event_system = get_event_system()
    
    # Map status to event type
    status_event_map = {
        "pending": WorkflowEventType.STATUS_CHANGED_TO_PENDING,
        "in_progress": WorkflowEventType.STATUS_CHANGED_TO_IN_PROGRESS,
        "approved": WorkflowEventType.STATUS_CHANGED_TO_APPROVED,
        "rejected": WorkflowEventType.STATUS_CHANGED_TO_REJECTED,
        "needs_changes": WorkflowEventType.STATUS_CHANGED_TO_NEEDS_CHANGES,
        "cancelled": WorkflowEventType.STATUS_CHANGED_TO_CANCELLED,
    }
    
    event_type = status_event_map.get(new_status.lower())
    if not event_type:
        raise ValueError(f"Unknown status: {new_status}")
    
    return await event_system.publish_event(
        event_type=event_type,
        aggregate_id=workflow_id,
        event_data={
            "workflow_id": workflow_id,
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": changed_by
        },
        user_id=changed_by,
        correlation_id=correlation_id,
        causation_id=causation_id
    )

async def publish_comment_added(
    workflow_id: str,
    comment_id: int,
    author_id: str,
    comment_type: str,
    content: str,
    correlation_id: Optional[str] = None
) -> EventProcessingResult:
    """Publish comment added event."""
    event_system = get_event_system()
    return await event_system.publish_event(
        event_type=WorkflowEventType.COMMENT_ADDED,
        aggregate_id=workflow_id,
        event_data={
            "workflow_id": workflow_id,
            "comment_id": comment_id,
            "author_id": author_id,
            "comment_type": comment_type,
            "content_length": len(content),
            "has_code_reference": "line_number" in content or "file_path" in content
        },
        user_id=author_id,
        correlation_id=correlation_id
    )

async def publish_sla_breach(
    workflow_id: str,
    breach_type: str,
    threshold_minutes: int,
    actual_minutes: int,
    correlation_id: Optional[str] = None
) -> EventProcessingResult:
    """Publish SLA breach event."""
    event_system = get_event_system()
    return await event_system.publish_event(
        event_type=WorkflowEventType.SLA_BREACHED,
        aggregate_id=workflow_id,
        event_data={
            "workflow_id": workflow_id,
            "breach_type": breach_type,
            "threshold_minutes": threshold_minutes,
            "actual_minutes": actual_minutes,
            "severity": "high" if actual_minutes > threshold_minutes * 2 else "medium"
        },
        correlation_id=correlation_id
    )