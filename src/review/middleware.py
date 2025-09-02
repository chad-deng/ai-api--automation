"""
Event Middleware for Workflow Events

This module provides middleware components for logging, metrics collection,
validation, and other cross-cutting concerns in the event processing pipeline.
"""
import time
from typing import Dict, Any, Optional, Set
from datetime import datetime, timezone
import structlog
from dataclasses import dataclass, field

from .events import WorkflowEventData, WorkflowEventType, EventMetadata

logger = structlog.get_logger()


@dataclass
class ValidationRule:
    """A validation rule for event data."""
    field_path: str  # e.g., "metadata.user_id" or "event_data.status"
    rule_type: str  # "required", "type", "range", "enum", "custom"
    rule_config: Dict[str, Any] = field(default_factory=dict)
    error_message: str = ""


class LoggingMiddleware:
    """Middleware for structured logging of workflow events."""
    
    def __init__(self, log_level: str = "INFO", include_event_data: bool = True):
        self.log_level = log_level.upper()
        self.include_event_data = include_event_data
        self._logger = structlog.get_logger("workflow.events")
    
    def __call__(self, event_data: WorkflowEventData) -> WorkflowEventData:
        """Log the workflow event."""
        log_data = {
            "event_id": event_data.event_id,
            "event_type": event_data.event_type.value,
            "aggregate_id": event_data.aggregate_id,
            "correlation_id": event_data.metadata.correlation_id,
            "user_id": event_data.metadata.user_id,
            "source": event_data.metadata.source,
            "timestamp": event_data.timestamp.isoformat(),
        }
        
        if self.include_event_data:
            log_data["event_data"] = event_data.event_data
        
        # Add causation chain if available
        if event_data.metadata.causation_id:
            log_data["causation_id"] = event_data.metadata.causation_id
        
        if self.log_level == "DEBUG":
            self._logger.debug("Workflow event processed", **log_data)
        elif self.log_level == "INFO":
            self._logger.info("Workflow event processed", **log_data)
        elif self.log_level == "WARNING":
            self._logger.warning("Workflow event processed", **log_data)
        
        return event_data


class MetricsMiddleware:
    """Middleware for collecting metrics on workflow events."""
    
    def __init__(self):
        self.event_counts: Dict[str, int] = {}
        self.processing_times: Dict[str, float] = {}
        self.error_counts: Dict[str, int] = {}
        self.last_reset = datetime.now(timezone.utc)
    
    def __call__(self, event_data: WorkflowEventData) -> WorkflowEventData:
        """Collect metrics for the workflow event."""
        event_type = event_data.event_type.value
        
        # Increment event count
        self.event_counts[event_type] = self.event_counts.get(event_type, 0) + 1
        
        # Track processing time
        start_time = time.time()
        
        # Add processing metadata
        if "metrics" not in event_data.metadata.additional_data:
            event_data.metadata.additional_data["metrics"] = {}
        
        event_data.metadata.additional_data["metrics"]["middleware_start_time"] = start_time
        event_data.metadata.additional_data["metrics"]["event_count"] = self.event_counts[event_type]
        
        logger.debug(
            "Metrics collected for event",
            event_type=event_type,
            total_count=self.event_counts[event_type]
        )
        
        return event_data
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get collected metrics."""
        return {
            "event_counts": self.event_counts.copy(),
            "processing_times": self.processing_times.copy(),
            "error_counts": self.error_counts.copy(),
            "collection_period": {
                "start": self.last_reset.isoformat(),
                "end": datetime.now(timezone.utc).isoformat()
            }
        }
    
    def reset_metrics(self) -> None:
        """Reset collected metrics."""
        self.event_counts.clear()
        self.processing_times.clear()
        self.error_counts.clear()
        self.last_reset = datetime.now(timezone.utc)


class ValidationMiddleware:
    """Middleware for validating workflow events."""
    
    def __init__(self):
        self.validation_rules: Dict[WorkflowEventType, List[ValidationRule]] = {}
        self._setup_default_rules()
    
    def _setup_default_rules(self) -> None:
        """Setup default validation rules for common event types."""
        
        # Rules for workflow creation events
        workflow_creation_rules = [
            ValidationRule(
                field_path="event_data.workflow_id",
                rule_type="required",
                error_message="Workflow ID is required for workflow creation events"
            ),
            ValidationRule(
                field_path="event_data.generated_test_id",
                rule_type="required",
                error_message="Generated test ID is required for workflow creation events"
            ),
            ValidationRule(
                field_path="metadata.user_id",
                rule_type="required",
                error_message="User ID is required for workflow creation events"
            )
        ]
        
        self.validation_rules[WorkflowEventType.WORKFLOW_CREATED] = workflow_creation_rules
        
        # Rules for status change events
        status_change_rules = [
            ValidationRule(
                field_path="event_data.old_status",
                rule_type="required",
                error_message="Old status is required for status change events"
            ),
            ValidationRule(
                field_path="event_data.new_status",
                rule_type="required",
                error_message="New status is required for status change events"
            ),
            ValidationRule(
                field_path="event_data.changed_by",
                rule_type="required",
                error_message="Changed by user is required for status change events"
            )
        ]
        
        status_events = [
            WorkflowEventType.STATUS_CHANGED_TO_PENDING,
            WorkflowEventType.STATUS_CHANGED_TO_IN_PROGRESS,
            WorkflowEventType.STATUS_CHANGED_TO_APPROVED,
            WorkflowEventType.STATUS_CHANGED_TO_REJECTED,
            WorkflowEventType.STATUS_CHANGED_TO_NEEDS_CHANGES,
            WorkflowEventType.STATUS_CHANGED_TO_CANCELLED,
        ]
        
        for event_type in status_events:
            self.validation_rules[event_type] = status_change_rules
        
        # Rules for comment events
        comment_rules = [
            ValidationRule(
                field_path="event_data.comment_id",
                rule_type="required",
                error_message="Comment ID is required for comment events"
            ),
            ValidationRule(
                field_path="event_data.author_id",
                rule_type="required",
                error_message="Author ID is required for comment events"
            )
        ]
        
        comment_events = [
            WorkflowEventType.COMMENT_ADDED,
            WorkflowEventType.COMMENT_UPDATED,
            WorkflowEventType.COMMENT_DELETED,
            WorkflowEventType.COMMENT_RESOLVED,
            WorkflowEventType.COMMENT_REOPENED,
        ]
        
        for event_type in comment_events:
            self.validation_rules[event_type] = comment_rules
    
    def add_validation_rule(self, event_type: WorkflowEventType, rule: ValidationRule) -> None:
        """Add a custom validation rule for an event type."""
        if event_type not in self.validation_rules:
            self.validation_rules[event_type] = []
        self.validation_rules[event_type].append(rule)
    
    def __call__(self, event_data: WorkflowEventData) -> WorkflowEventData:
        """Validate the workflow event."""
        rules = self.validation_rules.get(event_data.event_type, [])
        
        if not rules:
            return event_data
        
        validation_errors = []
        
        for rule in rules:
            try:
                if not self._validate_rule(event_data, rule):
                    validation_errors.append(rule.error_message)
            except Exception as e:
                validation_errors.append(f"Validation error for {rule.field_path}: {str(e)}")
        
        if validation_errors:
            error_msg = f"Event validation failed: {'; '.join(validation_errors)}"
            logger.error(
                "Event validation failed",
                event_type=event_data.event_type.value,
                event_id=event_data.event_id,
                errors=validation_errors
            )
            raise ValueError(error_msg)
        
        logger.debug(
            "Event validation passed",
            event_type=event_data.event_type.value,
            rules_checked=len(rules)
        )
        
        return event_data
    
    def _validate_rule(self, event_data: WorkflowEventData, rule: ValidationRule) -> bool:
        """Validate a single rule against event data."""
        value = self._get_field_value(event_data, rule.field_path)
        
        if rule.rule_type == "required":
            return value is not None and value != ""
        elif rule.rule_type == "type":
            expected_type = rule.rule_config.get("type")
            return isinstance(value, expected_type)
        elif rule.rule_type == "enum":
            allowed_values = rule.rule_config.get("values", [])
            return value in allowed_values
        elif rule.rule_type == "range":
            min_val = rule.rule_config.get("min")
            max_val = rule.rule_config.get("max")
            if min_val is not None and value < min_val:
                return False
            if max_val is not None and value > max_val:
                return False
            return True
        
        return True
    
    def _get_field_value(self, event_data: WorkflowEventData, field_path: str) -> Any:
        """Get value from event data using dot notation path."""
        parts = field_path.split(".")
        current = event_data
        
        for part in parts:
            if hasattr(current, part):
                current = getattr(current, part)
            elif isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None
        
        return current


class EnrichmentMiddleware:
    """Middleware for enriching events with additional context."""
    
    def __init__(self):
        pass
    
    def __call__(self, event_data: WorkflowEventData) -> WorkflowEventData:
        """Enrich event with additional context."""
        
        # Add processing timestamp
        event_data.metadata.additional_data["processing_timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Add environment info
        event_data.metadata.additional_data["environment"] = "production"  # Could be from config
        
        # Add trace information if not present
        if not event_data.metadata.trace_id:
            event_data.metadata.trace_id = f"trace_{event_data.event_id[:8]}"
        
        # Enrich based on event type
        self._enrich_by_event_type(event_data)
        
        return event_data
    
    def _enrich_by_event_type(self, event_data: WorkflowEventData) -> None:
        """Add event-type specific enrichments."""
        
        if event_data.event_type in [
            WorkflowEventType.STATUS_CHANGED_TO_APPROVED,
            WorkflowEventType.STATUS_CHANGED_TO_REJECTED
        ]:
            # Add review completion context
            event_data.metadata.additional_data["review_completed"] = True
            event_data.metadata.additional_data["outcome"] = (
                "approved" if event_data.event_type == WorkflowEventType.STATUS_CHANGED_TO_APPROVED 
                else "rejected"
            )
        
        elif event_data.event_type == WorkflowEventType.SLA_BREACHED:
            # Add SLA breach context
            event_data.metadata.additional_data["sla_breach"] = True
            event_data.metadata.additional_data["requires_escalation"] = True
        
        elif event_data.event_type in [
            WorkflowEventType.COMMENT_ADDED,
            WorkflowEventType.COMMENT_UPDATED
        ]:
            # Add comment context
            event_data.metadata.additional_data["interaction_type"] = "comment"
            if "comment_type" in event_data.event_data:
                event_data.metadata.additional_data["comment_category"] = event_data.event_data["comment_type"]


# Predefined middleware instances
default_logging_middleware = LoggingMiddleware()
default_metrics_middleware = MetricsMiddleware()
default_validation_middleware = ValidationMiddleware()
default_enrichment_middleware = EnrichmentMiddleware()

def get_default_middleware_pipeline() -> list:
    """Get the default middleware pipeline."""
    return [
        default_enrichment_middleware,
        default_validation_middleware,
        default_logging_middleware,
        default_metrics_middleware,
    ]