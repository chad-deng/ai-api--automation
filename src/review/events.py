"""
Workflow Event System for QA Review Workflow

This module implements the core event system for tracking and managing workflow state changes
using an event sourcing pattern with CQRS support.
"""
import enum
from typing import Dict, Any, Optional, List, Callable, Union, Awaitable
from datetime import datetime, timezone
from dataclasses import dataclass, field
from uuid import uuid4
import asyncio
import structlog
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from src.database.models import Base

logger = structlog.get_logger()

class WorkflowEventType(enum.Enum):
    """Enumeration of all workflow event types for state changes and actions."""
    
    # Core Workflow Lifecycle Events
    WORKFLOW_CREATED = "workflow_created"
    WORKFLOW_ASSIGNED = "workflow_assigned"
    WORKFLOW_STARTED = "workflow_started"
    WORKFLOW_COMPLETED = "workflow_completed"
    WORKFLOW_CANCELLED = "workflow_cancelled"
    WORKFLOW_UPDATED = "workflow_updated"
    
    # Status Change Events
    STATUS_CHANGED_TO_PENDING = "status_changed_to_pending"
    STATUS_CHANGED_TO_IN_PROGRESS = "status_changed_to_in_progress"
    STATUS_CHANGED_TO_APPROVED = "status_changed_to_approved"
    STATUS_CHANGED_TO_REJECTED = "status_changed_to_rejected"
    STATUS_CHANGED_TO_NEEDS_CHANGES = "status_changed_to_needs_changes"
    STATUS_CHANGED_TO_CANCELLED = "status_changed_to_cancelled"
    
    # Priority Change Events
    PRIORITY_CHANGED = "priority_changed"
    DUE_DATE_CHANGED = "due_date_changed"
    
    # Assignment Events
    REVIEWER_ASSIGNED = "reviewer_assigned"
    REVIEWER_UNASSIGNED = "reviewer_unassigned"
    ASSIGNEE_CHANGED = "assignee_changed"
    
    # Comment Events
    COMMENT_ADDED = "comment_added"
    COMMENT_UPDATED = "comment_updated"
    COMMENT_DELETED = "comment_deleted"
    COMMENT_RESOLVED = "comment_resolved"
    COMMENT_REOPENED = "comment_reopened"
    
    # Review Events
    REVIEW_STARTED = "review_started"
    REVIEW_SUBMITTED = "review_submitted"
    REVIEW_APPROVED = "review_approved"
    REVIEW_REJECTED = "review_rejected"
    CHANGES_REQUESTED = "changes_requested"
    
    # Metrics Events
    METRICS_CALCULATED = "metrics_calculated"
    METRICS_UPDATED = "metrics_updated"
    SLA_BREACHED = "sla_breached"
    QUALITY_SCORE_CALCULATED = "quality_score_calculated"
    
    # Notification Events
    NOTIFICATION_SENT = "notification_sent"
    NOTIFICATION_FAILED = "notification_failed"
    REMINDER_SENT = "reminder_sent"
    ESCALATION_TRIGGERED = "escalation_triggered"
    
    # Integration Events
    GIT_BRANCH_CREATED = "git_branch_created"
    GIT_COMMIT_MADE = "git_commit_made"
    PULL_REQUEST_CREATED = "pull_request_created"
    PULL_REQUEST_MERGED = "pull_request_merged"
    
    # Error Events
    PROCESSING_ERROR = "processing_error"
    VALIDATION_ERROR = "validation_error"
    SYSTEM_ERROR = "system_error"


@dataclass
class EventMetadata:
    """Metadata for workflow events including correlation and causation tracking."""
    correlation_id: str = field(default_factory=lambda: str(uuid4()))
    causation_id: Optional[str] = None
    user_id: Optional[str] = None
    source: str = "system"
    version: str = "1.0"
    trace_id: Optional[str] = None
    additional_data: Dict[str, Any] = field(default_factory=dict)


class WorkflowEvent(Base):
    """Database model for workflow events using event sourcing pattern."""
    __tablename__ = "workflow_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(255), unique=True, index=True, nullable=False)
    event_type = Column(String(100), nullable=False, index=True)
    aggregate_id = Column(String(255), nullable=False, index=True)  # workflow_id
    aggregate_type = Column(String(50), nullable=False, default="review_workflow")
    sequence_number = Column(Integer, nullable=False)
    
    # Event data
    event_data = Column(JSON, nullable=False)
    event_metadata = Column(JSON, nullable=True)
    
    # Tracking fields
    correlation_id = Column(String(255), nullable=False, index=True)
    causation_id = Column(String(255), nullable=True, index=True)
    user_id = Column(String(255), nullable=True, index=True)
    source = Column(String(100), nullable=False, default="system")
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime, nullable=True)
    
    # Processing status
    processing_status = Column(String(50), default="pending", nullable=False)
    processing_error = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<WorkflowEvent(id={self.id}, type={self.event_type}, aggregate_id={self.aggregate_id})>"


@dataclass
class WorkflowEventData:
    """Structured data container for workflow events."""
    event_type: WorkflowEventType
    aggregate_id: str
    event_id: str = field(default_factory=lambda: str(uuid4()))
    event_data: Dict[str, Any] = field(default_factory=dict)
    metadata: EventMetadata = field(default_factory=EventMetadata)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event data to dictionary for serialization."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "aggregate_id": self.aggregate_id,
            "event_data": self.event_data,
            "metadata": {
                "correlation_id": self.metadata.correlation_id,
                "causation_id": self.metadata.causation_id,
                "user_id": self.metadata.user_id,
                "source": self.metadata.source,
                "version": self.metadata.version,
                "trace_id": self.metadata.trace_id,
                "additional_data": self.metadata.additional_data,
            },
            "timestamp": self.timestamp.isoformat(),
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WorkflowEventData':
        """Create event data from dictionary."""
        metadata_dict = data.get("metadata", {})
        metadata = EventMetadata(
            correlation_id=metadata_dict.get("correlation_id", str(uuid4())),
            causation_id=metadata_dict.get("causation_id"),
            user_id=metadata_dict.get("user_id"),
            source=metadata_dict.get("source", "system"),
            version=metadata_dict.get("version", "1.0"),
            trace_id=metadata_dict.get("trace_id"),
            additional_data=metadata_dict.get("additional_data", {}),
        )
        
        return cls(
            event_id=data["event_id"],
            event_type=WorkflowEventType(data["event_type"]),
            aggregate_id=data["aggregate_id"],
            event_data=data.get("event_data", {}),
            metadata=metadata,
            timestamp=datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00")),
        )


# Type aliases for better code readability
EventHandler = Callable[[WorkflowEventData], None]
AsyncEventHandler = Callable[[WorkflowEventData], Awaitable[None]]
EventMiddleware = Callable[[WorkflowEventData, Callable], Any]