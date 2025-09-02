"""
Alert system for review bottlenecks and system issues.

Provides intelligent alerting based on QA Lead assessment criteria
and performance thresholds for proactive issue management.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import structlog

from ..database.models import get_db_session, AlertRule, Alert
from .metrics import metrics
from .analytics import review_analytics, quality_metrics

logger = structlog.get_logger()


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class AlertCategory(Enum):
    """Alert categories for classification."""
    PERFORMANCE = "performance"
    QUALITY = "quality"
    CAPACITY = "capacity"
    SYSTEM = "system"
    SECURITY = "security"


@dataclass
class AlertCondition:
    """Defines conditions that trigger alerts."""
    metric_name: str
    operator: str  # 'gt', 'lt', 'eq', 'gte', 'lte'
    threshold: float
    duration_minutes: int  # How long condition must persist
    category: AlertCategory
    severity: AlertSeverity


@dataclass
class AlertEvent:
    """Represents an alert event."""
    id: str
    title: str
    description: str
    severity: AlertSeverity
    category: AlertCategory
    triggered_at: datetime
    metric_value: float
    threshold: float
    context: Dict[str, Any]
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None


class AlertManager:
    """
    Comprehensive alert management system for QA Review Workflow.
    
    Monitors key performance indicators and triggers alerts
    when thresholds are exceeded, enabling proactive issue resolution.
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
        self.alert_rules = self._initialize_alert_rules()
        self.alert_handlers: Dict[AlertSeverity, List[Callable]] = {
            AlertSeverity.INFO: [],
            AlertSeverity.WARNING: [],
            AlertSeverity.CRITICAL: [],
            AlertSeverity.EMERGENCY: []
        }
        self.active_alerts: Dict[str, AlertEvent] = {}
        
    def _initialize_alert_rules(self) -> List[AlertCondition]:
        """Initialize alert rules based on QA Lead assessment criteria."""
        return [
            # Review Time Performance Alerts
            AlertCondition(
                metric_name="avg_review_time_minutes",
                operator="gt",
                threshold=18.0,  # Warning when exceeding standard business API target
                duration_minutes=15,
                category=AlertCategory.PERFORMANCE,
                severity=AlertSeverity.WARNING
            ),
            AlertCondition(
                metric_name="avg_review_time_minutes",
                operator="gt",
                threshold=25.0,  # Critical when exceeding complex API target
                duration_minutes=10,
                category=AlertCategory.PERFORMANCE,
                severity=AlertSeverity.CRITICAL
            ),
            
            # Target Compliance Alerts
            AlertCondition(
                metric_name="target_compliance_rate",
                operator="lt",
                threshold=70.0,  # QA Lead minimum target
                duration_minutes=30,
                category=AlertCategory.PERFORMANCE,
                severity=AlertSeverity.WARNING
            ),
            AlertCondition(
                metric_name="target_compliance_rate",
                operator="lt",
                threshold=50.0,  # Critical compliance failure
                duration_minutes=15,
                category=AlertCategory.PERFORMANCE,
                severity=AlertSeverity.CRITICAL
            ),
            
            # Queue Management Alerts
            AlertCondition(
                metric_name="review_queue_size",
                operator="gt",
                threshold=20.0,  # Queue backup warning
                duration_minutes=20,
                category=AlertCategory.CAPACITY,
                severity=AlertSeverity.WARNING
            ),
            AlertCondition(
                metric_name="review_queue_size",
                operator="gt",
                threshold=50.0,  # Critical queue backup
                duration_minutes=10,
                category=AlertCategory.CAPACITY,
                severity=AlertSeverity.CRITICAL
            ),
            
            # Quality Alerts
            AlertCondition(
                metric_name="avg_quality_score",
                operator="lt",
                threshold=0.75,  # Quality degradation warning
                duration_minutes=60,
                category=AlertCategory.QUALITY,
                severity=AlertSeverity.WARNING
            ),
            AlertCondition(
                metric_name="approval_rate",
                operator="lt",
                threshold=60.0,  # Low approval rate
                duration_minutes=30,
                category=AlertCategory.QUALITY,
                severity=AlertSeverity.WARNING
            ),
            
            # System Performance Alerts
            AlertCondition(
                metric_name="database_response_time_ms",
                operator="gt",
                threshold=200.0,  # Database slowdown
                duration_minutes=5,
                category=AlertCategory.SYSTEM,
                severity=AlertSeverity.WARNING
            ),
            AlertCondition(
                metric_name="test_generation_time_seconds",
                operator="gt",
                threshold=60.0,  # Slow test generation
                duration_minutes=10,
                category=AlertCategory.SYSTEM,
                severity=AlertSeverity.WARNING
            ),
            
            # Concurrent Reviews Capacity
            AlertCondition(
                metric_name="concurrent_reviews_active",
                operator="gt",
                threshold=15.0,  # High concurrency warning
                duration_minutes=10,
                category=AlertCategory.CAPACITY,
                severity=AlertSeverity.WARNING
            ),
            
            # Error Rate Alerts
            AlertCondition(
                metric_name="system_errors_per_hour",
                operator="gt",
                threshold=10.0,  # Elevated error rate
                duration_minutes=15,
                category=AlertCategory.SYSTEM,
                severity=AlertSeverity.WARNING
            ),
            AlertCondition(
                metric_name="system_errors_per_hour",
                operator="gt",
                threshold=25.0,  # Critical error rate
                duration_minutes=5,
                category=AlertCategory.SYSTEM,
                severity=AlertSeverity.CRITICAL
            )
        ]
    
    def add_alert_handler(self, severity: AlertSeverity, handler: Callable[[AlertEvent], None]):
        """Add a handler for alerts of specific severity."""
        self.alert_handlers[severity].append(handler)
    
    async def check_alert_conditions(self) -> List[AlertEvent]:
        """Check all alert conditions and trigger alerts as needed."""
        try:
            triggered_alerts = []
            
            # Get current metrics
            current_metrics = await self._gather_current_metrics()
            
            # Check each alert rule
            for rule in self.alert_rules:
                alert_event = await self._evaluate_alert_rule(rule, current_metrics)
                if alert_event:
                    triggered_alerts.append(alert_event)
            
            # Process triggered alerts
            for alert in triggered_alerts:
                await self._process_alert(alert)
            
            return triggered_alerts
            
        except Exception as e:
            self.logger.error("Failed to check alert conditions", error=str(e))
            return []
    
    async def _gather_current_metrics(self) -> Dict[str, float]:
        """Gather current metric values for alert evaluation."""
        try:
            # Get performance metrics
            performance_analysis = await review_analytics.analyze_review_performance(hours=1)
            quality_analysis = await quality_metrics.analyze_quality_metrics(hours=1)
            
            return {
                "avg_review_time_minutes": performance_analysis.avg_time_minutes,
                "target_compliance_rate": performance_analysis.target_compliance_rate,
                "review_queue_size": await self._get_current_queue_size(),
                "avg_quality_score": quality_analysis.avg_quality_score,
                "approval_rate": quality_analysis.approval_rate,
                "database_response_time_ms": await self._get_db_response_time(),
                "test_generation_time_seconds": await self._get_avg_generation_time(),
                "concurrent_reviews_active": await self._get_concurrent_reviews(),
                "system_errors_per_hour": await self._get_hourly_error_rate()
            }
            
        except Exception as e:
            self.logger.error("Failed to gather metrics", error=str(e))
            return {}
    
    async def _evaluate_alert_rule(
        self, 
        rule: AlertCondition, 
        metrics: Dict[str, float]
    ) -> Optional[AlertEvent]:
        """Evaluate a single alert rule against current metrics."""
        try:
            metric_value = metrics.get(rule.metric_name)
            if metric_value is None:
                return None
            
            # Check if condition is met
            condition_met = self._evaluate_condition(
                metric_value, 
                rule.operator, 
                rule.threshold
            )
            
            if not condition_met:
                # Resolve any existing alert for this rule
                await self._resolve_alert(rule.metric_name)
                return None
            
            # Check if this condition has persisted for required duration
            if not await self._condition_persisted(rule, metrics):
                return None
            
            # Create alert event
            alert_id = f"{rule.metric_name}_{rule.severity.value}"
            
            # Check if this alert is already active
            if alert_id in self.active_alerts:
                return None
            
            alert_event = AlertEvent(
                id=alert_id,
                title=self._generate_alert_title(rule, metric_value),
                description=self._generate_alert_description(rule, metric_value),
                severity=rule.severity,
                category=rule.category,
                triggered_at=datetime.utcnow(),
                metric_value=metric_value,
                threshold=rule.threshold,
                context=self._generate_alert_context(rule, metrics)
            )
            
            return alert_event
            
        except Exception as e:
            self.logger.error("Failed to evaluate alert rule", rule=rule.metric_name, error=str(e))
            return None
    
    def _evaluate_condition(self, value: float, operator: str, threshold: float) -> bool:
        """Evaluate if condition is met."""
        if operator == "gt":
            return value > threshold
        elif operator == "lt":
            return value < threshold
        elif operator == "gte":
            return value >= threshold
        elif operator == "lte":
            return value <= threshold
        elif operator == "eq":
            return abs(value - threshold) < 0.001
        else:
            return False
    
    async def _condition_persisted(
        self, 
        rule: AlertCondition, 
        current_metrics: Dict[str, float]
    ) -> bool:
        """Check if condition has persisted for required duration."""
        # This would implement persistence checking
        # For now, we'll assume conditions that are met have persisted
        return True
    
    async def _process_alert(self, alert: AlertEvent):
        """Process a triggered alert."""
        try:
            # Store alert in active alerts
            self.active_alerts[alert.id] = alert
            
            # Store alert in database
            await self._store_alert(alert)
            
            # Record metric
            metrics.record_system_error(
                component="alert_system",
                error_type=f"{alert.category.value}_alert",
                details=alert.title
            )
            
            # Trigger alert handlers
            handlers = self.alert_handlers.get(alert.severity, [])
            for handler in handlers:
                try:
                    await asyncio.get_event_loop().run_in_executor(None, handler, alert)
                except Exception as e:
                    self.logger.error(
                        "Alert handler failed",
                        handler=str(handler),
                        alert_id=alert.id,
                        error=str(e)
                    )
            
            self.logger.warning(
                "Alert triggered",
                alert_id=alert.id,
                severity=alert.severity.value,
                category=alert.category.value,
                metric=alert.metric_value,
                threshold=alert.threshold
            )
            
        except Exception as e:
            self.logger.error("Failed to process alert", alert_id=alert.id, error=str(e))
    
    async def resolve_alert(self, alert_id: str, resolution_notes: str = ""):
        """Manually resolve an alert."""
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert.resolved_at = datetime.utcnow()
                alert.resolution_notes = resolution_notes
                
                # Update in database
                await self._update_alert_resolution(alert)
                
                # Remove from active alerts
                del self.active_alerts[alert_id]
                
                self.logger.info(
                    "Alert resolved",
                    alert_id=alert_id,
                    resolution_notes=resolution_notes
                )
                
        except Exception as e:
            self.logger.error("Failed to resolve alert", alert_id=alert_id, error=str(e))
    
    async def _resolve_alert(self, metric_name: str):
        """Auto-resolve alerts when conditions are no longer met."""
        alerts_to_resolve = [
            alert_id for alert_id, alert in self.active_alerts.items()
            if metric_name in alert_id
        ]
        
        for alert_id in alerts_to_resolve:
            await self.resolve_alert(alert_id, "Condition no longer met")
    
    def _generate_alert_title(self, rule: AlertCondition, value: float) -> str:
        """Generate human-readable alert title."""
        titles = {
            "avg_review_time_minutes": f"Review Time Elevated: {value:.1f} minutes (threshold: {rule.threshold})",
            "target_compliance_rate": f"Compliance Rate Low: {value:.1f}% (threshold: {rule.threshold}%)",
            "review_queue_size": f"Queue Backup: {int(value)} items (threshold: {int(rule.threshold)})",
            "avg_quality_score": f"Quality Score Low: {value:.2f} (threshold: {rule.threshold})",
            "approval_rate": f"Approval Rate Low: {value:.1f}% (threshold: {rule.threshold}%)",
            "database_response_time_ms": f"Database Slow: {value:.0f}ms (threshold: {rule.threshold}ms)",
            "concurrent_reviews_active": f"High Concurrency: {int(value)} active (threshold: {int(rule.threshold)})",
            "system_errors_per_hour": f"Error Rate High: {value:.0f}/hour (threshold: {rule.threshold})"
        }
        
        return titles.get(rule.metric_name, f"Alert: {rule.metric_name} = {value}")
    
    def _generate_alert_description(self, rule: AlertCondition, value: float) -> str:
        """Generate detailed alert description with context and recommendations."""
        descriptions = {
            "avg_review_time_minutes": (
                f"Average review time has exceeded {rule.threshold} minutes, "
                f"currently at {value:.1f} minutes. This may indicate reviewer "
                f"bottlenecks or complex API types requiring optimization."
            ),
            "target_compliance_rate": (
                f"15-minute target compliance has dropped to {value:.1f}%, "
                f"below the {rule.threshold}% threshold. Review process "
                f"optimization may be needed to meet QA Lead targets."
            ),
            "review_queue_size": (
                f"Review queue has grown to {int(value)} items, exceeding "
                f"the {int(rule.threshold)} item threshold. Additional reviewer "
                f"capacity or process optimization may be required."
            ),
            "system_errors_per_hour": (
                f"System error rate has increased to {value:.0f} errors per hour, "
                f"above the {rule.threshold} error threshold. System stability "
                f"investigation recommended."
            )
        }
        
        return descriptions.get(
            rule.metric_name,
            f"Metric {rule.metric_name} has reached {value}, exceeding threshold of {rule.threshold}"
        )
    
    def _generate_alert_context(self, rule: AlertCondition, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Generate additional context for the alert."""
        return {
            "all_metrics": metrics,
            "rule_category": rule.category.value,
            "rule_severity": rule.severity.value,
            "threshold_exceeded_by": metrics.get(rule.metric_name, 0) - rule.threshold,
            "suggested_actions": self._get_suggested_actions(rule)
        }
    
    def _get_suggested_actions(self, rule: AlertCondition) -> List[str]:
        """Get suggested actions for alert resolution."""
        action_map = {
            "avg_review_time_minutes": [
                "Review current API complexity distribution",
                "Check for reviewer training opportunities", 
                "Consider implementing automated pre-screening",
                "Analyze recent review patterns for bottlenecks"
            ],
            "target_compliance_rate": [
                "Increase reviewer capacity during peak hours",
                "Implement batch review capabilities",
                "Optimize review interface for efficiency",
                "Review time allocation targets by API type"
            ],
            "review_queue_size": [
                "Add temporary reviewer capacity",
                "Prioritize high-impact API reviews",
                "Check for system bottlenecks in test generation",
                "Consider implementing queue management rules"
            ],
            "system_errors_per_hour": [
                "Check system logs for error patterns",
                "Monitor database and cache performance",
                "Review recent deployments for issues",
                "Verify external service availability"
            ]
        }
        
        return action_map.get(rule.metric_name, ["Investigate metric anomaly", "Check system health"])
    
    # Database operations
    async def _store_alert(self, alert: AlertEvent):
        """Store alert in database."""
        try:
            async with get_db_session() as session:
                db_alert = Alert(
                    alert_id=alert.id,
                    title=alert.title,
                    description=alert.description,
                    severity=alert.severity.value,
                    category=alert.category.value,
                    metric_value=alert.metric_value,
                    threshold=alert.threshold,
                    context=json.dumps(asdict(alert.context)) if alert.context else None,
                    triggered_at=alert.triggered_at
                )
                session.add(db_alert)
                await session.commit()
                
        except Exception as e:
            self.logger.error("Failed to store alert", alert_id=alert.id, error=str(e))
    
    async def _update_alert_resolution(self, alert: AlertEvent):
        """Update alert resolution in database."""
        try:
            async with get_db_session() as session:
                # Implementation would update the alert record
                pass
        except Exception as e:
            self.logger.error("Failed to update alert resolution", error=str(e))
    
    # Metric gathering helpers
    async def _get_current_queue_size(self) -> float:
        """Get current review queue size."""
        # Implementation would query pending reviews
        return 8.0  # Placeholder
    
    async def _get_db_response_time(self) -> float:
        """Get current database response time."""
        # Implementation would measure actual DB response time
        return 45.0  # Placeholder
    
    async def _get_avg_generation_time(self) -> float:
        """Get average test generation time."""
        # Implementation would calculate from recent generations
        return 12.5  # Placeholder
    
    async def _get_concurrent_reviews(self) -> float:
        """Get current concurrent review count."""
        # Implementation would query active review sessions
        return 5.0  # Placeholder
    
    async def _get_hourly_error_rate(self) -> float:
        """Get error rate for the last hour."""
        # Implementation would query error logs
        return 3.0  # Placeholder


class AlertNotificationService:
    """
    Service for sending alert notifications via multiple channels.
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    async def send_email_alert(self, alert: AlertEvent, recipients: List[str]):
        """Send email alert notification."""
        try:
            # Implementation would integrate with email service
            self.logger.info(
                "Email alert sent",
                alert_id=alert.id,
                recipients=recipients,
                severity=alert.severity.value
            )
        except Exception as e:
            self.logger.error("Failed to send email alert", error=str(e))
    
    async def send_slack_alert(self, alert: AlertEvent, channel: str):
        """Send Slack alert notification."""
        try:
            # Implementation would integrate with Slack API
            self.logger.info(
                "Slack alert sent",
                alert_id=alert.id,
                channel=channel,
                severity=alert.severity.value
            )
        except Exception as e:
            self.logger.error("Failed to send Slack alert", error=str(e))
    
    async def send_webhook_alert(self, alert: AlertEvent, webhook_url: str):
        """Send webhook alert notification."""
        try:
            # Implementation would send HTTP POST to webhook
            self.logger.info(
                "Webhook alert sent",
                alert_id=alert.id,
                webhook_url=webhook_url,
                severity=alert.severity.value
            )
        except Exception as e:
            self.logger.error("Failed to send webhook alert", error=str(e))


# Global alert manager instance
alert_manager = AlertManager()
notification_service = AlertNotificationService()