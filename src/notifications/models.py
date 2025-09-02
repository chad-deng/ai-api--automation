"""
Notification System Database Models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from src.database.models import Base


class NotificationType(enum.Enum):
    EMAIL = "email"
    SLACK = "slack"
    DASHBOARD = "dashboard"
    WEBHOOK = "webhook"


class NotificationStatus(enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    RETRY = "retry"


class NotificationPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EventType(enum.Enum):
    PR_OPENED = "pr_opened"
    PR_MERGED = "pr_merged"
    PR_CLOSED = "pr_closed"
    CHECKS_FAILED = "checks_failed"
    WORKFLOW_COMPLETED = "workflow_completed"
    REVIEW_APPROVED = "review_approved"
    REVIEW_REJECTED = "review_rejected"
    REVIEW_STALLED = "review_stalled"
    CONFLICT_DETECTED = "conflict_detected"
    DEPLOYMENT_SUCCESS = "deployment_success"
    DEPLOYMENT_FAILED = "deployment_failed"


class NotificationChannel(Base):
    __tablename__ = "notification_channels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    
    # Channel configuration
    config = Column(JSON, nullable=False)  # email addresses, Slack webhook URLs, etc.
    is_active = Column(Boolean, default=True)
    
    # Filtering settings
    event_types = Column(JSON, nullable=True)  # List of event types to handle
    priority_threshold = Column(Enum(NotificationPriority), default=NotificationPriority.LOW)
    
    # Rate limiting
    rate_limit_per_hour = Column(Integer, default=60)
    rate_limit_per_day = Column(Integer, default=500)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    notifications = relationship("Notification", back_populates="channel")


class NotificationTemplate(Base):
    __tablename__ = "notification_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    event_type = Column(Enum(EventType), nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    
    # Template content
    subject_template = Column(String(500), nullable=True)
    body_template = Column(Text, nullable=False)
    
    # Template variables documentation
    available_variables = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("notification_channels.id"), nullable=False, index=True)
    
    # Event information
    event_type = Column(Enum(EventType), nullable=False)
    event_id = Column(String(255), nullable=True)  # External event ID
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    
    # Recipients
    recipients = Column(JSON, nullable=False)  # List of email addresses, Slack channels, etc.
    
    # Content
    subject = Column(String(500), nullable=True)
    message = Column(Text, nullable=False)
    event_metadata = Column(JSON, nullable=True)  # Additional event data
    
    # Delivery status
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    scheduled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sent_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    
    # Error tracking
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0)
    
    # Relationships
    channel = relationship("NotificationChannel", back_populates="notifications")


class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False, index=True)
    
    # Attempt details
    attempt_number = Column(Integer, nullable=False)
    status = Column(Enum(NotificationStatus), nullable=False)
    
    # Response details
    response_code = Column(String(50), nullable=True)
    response_message = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    
    # External tracking
    external_id = Column(String(255), nullable=True)  # Message ID from email service, etc.
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    notification = relationship("Notification")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    
    # Preference settings
    email_enabled = Column(Boolean, default=True)
    slack_enabled = Column(Boolean, default=True)
    dashboard_enabled = Column(Boolean, default=True)
    
    # Event type preferences
    event_preferences = Column(JSON, nullable=True)  # Per-event notification settings
    
    # Timing preferences
    immediate_events = Column(JSON, nullable=True)  # Events to send immediately
    digest_frequency = Column(String(50), default="daily")  # hourly, daily, weekly
    quiet_hours_start = Column(String(5), nullable=True)  # "22:00"
    quiet_hours_end = Column(String(5), nullable=True)    # "08:00"
    timezone = Column(String(50), default="UTC")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))