from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON, ForeignKey, Enum, Float, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine
from datetime import datetime, timezone
import structlog
import enum
from src.config.settings import Settings

logger = structlog.get_logger()
Base = declarative_base()

class ReviewStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_CHANGES = "needs_changes"
    CANCELLED = "cancelled"

class ReviewPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CommentType(enum.Enum):
    GENERAL = "general"
    ISSUE = "issue"
    SUGGESTION = "suggestion"
    QUESTION = "question"
    APPROVAL = "approval"

class ReviewRole(enum.Enum):
    DEVELOPER = "developer"
    REVIEWER = "reviewer"
    QA_LEAD = "qa_lead"
    TECH_LEAD = "tech_lead"
    SENIOR_DEVELOPER = "senior_developer"
    ADMIN = "admin"

class SlaStatus(enum.Enum):
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BREACHED = "breached"
    ESCALATED = "escalated"

class EscalationType(enum.Enum):
    WARNING = "warning"
    ESCALATION = "escalation"
    CRITICAL_ESCALATION = "critical_escalation"

class ApprovalStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class ApprovalWorkflowStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TestExecutionStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"

class QualityGateStatus(enum.Enum):
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    PENDING = "pending"

class TemplateType(enum.Enum):
    VALIDATION = "validation"
    BOUNDARY = "boundary"
    PERFORMANCE = "performance"
    ERROR_HANDLING = "error_handling"
    CONCURRENCY = "concurrency"
    ENVIRONMENT = "environment"

class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(255), unique=True, index=True)
    event_type = Column(String(100), nullable=False)
    project_id = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)
    processing_metadata = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

class GeneratedTest(Base):
    __tablename__ = "generated_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    webhook_event_id = Column(String(255), nullable=False)
    test_name = Column(String(255), nullable=False)
    test_content = Column(Text, nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="generated")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_run_at = Column(DateTime, nullable=True)
    last_run_result = Column(String(50), nullable=True)
    
    # Relationship to review workflow
    reviews = relationship("ReviewWorkflow", back_populates="generated_test")

class ReviewWorkflow(Base):
    __tablename__ = "review_workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    generated_test_id = Column(Integer, ForeignKey("generated_tests.id"), nullable=False, index=True)
    reviewer_id = Column(String(255), nullable=True)  # User ID or name
    assignee_id = Column(String(255), nullable=True)  # User ID or name
    status = Column(Enum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False)
    priority = Column(Enum(ReviewPriority), default=ReviewPriority.MEDIUM, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    workflow_metadata = Column(JSON, nullable=True)  # For additional workflow data
    
    # Relationships
    generated_test = relationship("GeneratedTest", back_populates="reviews")
    comments = relationship("ReviewComment", back_populates="review_workflow", cascade="all, delete-orphan")
    metrics = relationship("ReviewMetrics", back_populates="review_workflow", uselist=False, cascade="all, delete-orphan")
    sla_tracking = relationship("WorkflowSlaTracking", back_populates="review_workflow", uselist=False, cascade="all, delete-orphan")

class ReviewComment(Base):
    __tablename__ = "review_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    review_workflow_id = Column(Integer, ForeignKey("review_workflows.id"), nullable=False, index=True)
    author_id = Column(String(255), nullable=False)  # User ID or name
    comment_type = Column(Enum(CommentType), default=CommentType.GENERAL, nullable=False)
    content = Column(Text, nullable=False)
    line_number = Column(Integer, nullable=True)  # For code-specific comments
    file_path = Column(String(500), nullable=True)  # For file-specific comments
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    comment_metadata = Column(JSON, nullable=True)  # For additional comment data
    
    # Relationships
    review_workflow = relationship("ReviewWorkflow", back_populates="comments")

class ReviewMetrics(Base):
    __tablename__ = "review_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    review_workflow_id = Column(Integer, ForeignKey("review_workflows.id"), nullable=False, index=True)
    time_to_first_response_minutes = Column(Integer, nullable=True)
    time_to_completion_minutes = Column(Integer, nullable=True)
    total_comments = Column(Integer, default=0)
    issues_found = Column(Integer, default=0)
    suggestions_made = Column(Integer, default=0)
    revisions_requested = Column(Integer, default=0)
    code_quality_score = Column(Integer, nullable=True)  # 1-10 scale
    test_coverage_score = Column(Integer, nullable=True)  # 1-10 scale
    performance_score = Column(Integer, nullable=True)  # 1-10 scale
    security_score = Column(Integer, nullable=True)  # 1-10 scale
    overall_score = Column(Integer, nullable=True)  # 1-10 scale
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    review_workflow = relationship("ReviewWorkflow", back_populates="metrics")

class WorkflowSlaPolicy(Base):
    __tablename__ = "workflow_sla_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    priority = Column(Enum(ReviewPriority), nullable=False, unique=True, index=True)
    
    # SLA time limits in minutes
    initial_response_minutes = Column(Integer, nullable=False)  # Time to first reviewer assignment or comment
    completion_minutes = Column(Integer, nullable=False)        # Time to complete the review
    
    # Escalation thresholds (percentage of SLA time)
    warning_threshold_percent = Column(Integer, default=75)     # 75% of SLA time triggers warning
    escalation_threshold_percent = Column(Integer, default=100) # 100% of SLA time triggers escalation
    
    # Escalation settings
    escalation_enabled = Column(Boolean, default=True)
    auto_reassign_enabled = Column(Boolean, default=False)
    escalation_recipients = Column(JSON, nullable=True)  # List of user IDs to escalate to
    
    # Policy metadata
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    sla_tracking = relationship("WorkflowSlaTracking", back_populates="sla_policy")

class WorkflowSlaTracking(Base):
    __tablename__ = "workflow_sla_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    review_workflow_id = Column(Integer, ForeignKey("review_workflows.id"), nullable=False, index=True)
    sla_policy_id = Column(Integer, ForeignKey("workflow_sla_policies.id"), nullable=False, index=True)
    
    # SLA status and timing
    status = Column(Enum(SlaStatus), default=SlaStatus.ON_TRACK, nullable=False)
    
    # Key timestamps
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    first_response_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # SLA deadlines (calculated from policy and start time)
    initial_response_due_at = Column(DateTime, nullable=False)
    completion_due_at = Column(DateTime, nullable=False)
    
    # Breach tracking
    initial_response_breached = Column(Boolean, default=False)
    completion_breached = Column(Boolean, default=False)
    breach_duration_minutes = Column(Integer, default=0)  # Total time in breach
    
    # Escalation tracking
    warning_sent_at = Column(DateTime, nullable=True)
    escalation_sent_at = Column(DateTime, nullable=True)
    escalation_count = Column(Integer, default=0)
    last_escalation_type = Column(Enum(EscalationType), nullable=True)
    
    # Performance metrics
    time_to_first_response_minutes = Column(Integer, nullable=True)
    time_to_completion_minutes = Column(Integer, nullable=True)
    sla_compliance_score = Column(Integer, nullable=True)  # 0-100 percentage
    
    # Metadata
    tracking_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    review_workflow = relationship("ReviewWorkflow", back_populates="sla_tracking")
    sla_policy = relationship("WorkflowSlaPolicy", back_populates="sla_tracking")

class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(ApprovalWorkflowStatus), default=ApprovalWorkflowStatus.DRAFT, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Workflow configuration
    requires_all_stages = Column(Boolean, default=True, nullable=False)  # All stages required vs any stage
    auto_advance = Column(Boolean, default=True, nullable=False)  # Auto-advance to next stage
    allow_parallel_approvals = Column(Boolean, default=False, nullable=False)  # Allow parallel approvals within stage
    
    # Metadata and audit
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    workflow_metadata = Column(JSON, nullable=True)
    
    # Relationships
    stages = relationship("ApprovalWorkflowStage", back_populates="workflow", cascade="all, delete-orphan", order_by="ApprovalWorkflowStage.order_index")
    requests = relationship("ApprovalRequest", back_populates="workflow")

class ApprovalWorkflowStage(Base):
    __tablename__ = "approval_workflow_stages"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("approval_workflows.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)
    
    # Stage configuration
    required_approvals = Column(Integer, default=1, nullable=False)  # Number of approvals needed
    required_roles = Column(JSON, nullable=True)  # List of required roles
    allowed_roles = Column(JSON, nullable=True)  # List of roles that can approve
    is_optional = Column(Boolean, default=False, nullable=False)
    timeout_hours = Column(Integer, nullable=True)  # Auto-reject after timeout
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    stage_metadata = Column(JSON, nullable=True)
    
    # Relationships
    workflow = relationship("ApprovalWorkflow", back_populates="stages")
    stage_instances = relationship("ApprovalStageInstance", back_populates="stage")

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("approval_workflows.id"), nullable=False, index=True)
    review_workflow_id = Column(Integer, ForeignKey("review_workflows.id"), nullable=False, index=True)
    
    # Request details
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    requested_by = Column(String(255), nullable=False)
    priority = Column(Enum(ReviewPriority), default=ReviewPriority.MEDIUM, nullable=False)
    
    # Status tracking
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    current_stage_id = Column(Integer, ForeignKey("approval_workflow_stages.id"), nullable=True, index=True)
    
    # Timing
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    
    # Metadata
    request_metadata = Column(JSON, nullable=True)
    
    # Relationships
    workflow = relationship("ApprovalWorkflow", back_populates="requests")
    review_workflow = relationship("ReviewWorkflow")
    current_stage = relationship("ApprovalWorkflowStage", foreign_keys=[current_stage_id])
    stage_instances = relationship("ApprovalStageInstance", back_populates="request", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="request", cascade="all, delete-orphan")

class ApprovalStageInstance(Base):
    __tablename__ = "approval_stage_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("approval_requests.id"), nullable=False, index=True)
    stage_id = Column(Integer, ForeignKey("approval_workflow_stages.id"), nullable=False, index=True)
    
    # Stage instance status
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    order_index = Column(Integer, nullable=False)
    
    # Timing
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Progress tracking
    approvals_received = Column(Integer, default=0, nullable=False)
    approvals_required = Column(Integer, nullable=False)
    
    # Metadata
    stage_metadata = Column(JSON, nullable=True)
    
    # Relationships
    request = relationship("ApprovalRequest", back_populates="stage_instances")
    stage = relationship("ApprovalWorkflowStage", back_populates="stage_instances")
    approvals = relationship("Approval", back_populates="stage_instance")

class Approval(Base):
    __tablename__ = "approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("approval_requests.id"), nullable=False, index=True)
    stage_instance_id = Column(Integer, ForeignKey("approval_stage_instances.id"), nullable=False, index=True)
    
    # Approval details
    approver_id = Column(String(255), nullable=False)
    approver_role = Column(Enum(ReviewRole), nullable=False)
    status = Column(Enum(ApprovalStatus), nullable=False)
    
    # Content
    comments = Column(Text, nullable=True)
    conditions = Column(Text, nullable=True)  # Any conditions for approval
    
    # Timing
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Metadata
    approval_metadata = Column(JSON, nullable=True)
    
    # Relationships
    request = relationship("ApprovalRequest", back_populates="approvals")
    stage_instance = relationship("ApprovalStageInstance", back_populates="approvals")

# Analytics and Dashboard Models for Phase 3

class TestExecution(Base):
    """
    Comprehensive test execution tracking for dashboard analytics.
    Captures detailed metrics for performance monitoring and quality assessment.
    """
    __tablename__ = "test_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    generated_test_id = Column(Integer, ForeignKey("generated_tests.id"), nullable=False, index=True)
    webhook_event_id = Column(String(255), nullable=False, index=True)
    
    # Execution details
    execution_id = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(Enum(TestExecutionStatus), default=TestExecutionStatus.PENDING, nullable=False)
    test_framework = Column(String(100), nullable=True)  # pytest, unittest, etc.
    
    # Performance metrics
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    cpu_usage_percent = Column(Float, nullable=True)
    memory_usage_mb = Column(Float, nullable=True)
    
    # Quality metrics
    assertions_count = Column(Integer, default=0)
    assertions_passed = Column(Integer, default=0)
    assertions_failed = Column(Integer, default=0)
    quality_score = Column(Float, nullable=True)  # 0.0-1.0
    
    # Coverage and validation
    code_coverage_percent = Column(Float, nullable=True)
    endpoint_coverage_percent = Column(Float, nullable=True)
    validation_rules_passed = Column(Integer, default=0)
    validation_rules_failed = Column(Integer, default=0)
    
    # Results and diagnostics
    exit_code = Column(Integer, nullable=True)
    stdout_log = Column(Text, nullable=True)
    stderr_log = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    failure_reason = Column(String(500), nullable=True)
    
    # Environment and context
    environment_name = Column(String(100), nullable=True)
    python_version = Column(String(50), nullable=True)
    dependencies_hash = Column(String(255), nullable=True)
    git_commit_hash = Column(String(255), nullable=True)
    
    # Metadata
    execution_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    generated_test = relationship("GeneratedTest")
    quality_checks = relationship("QualityCheck", back_populates="test_execution")
    performance_metrics = relationship("PerformanceMetric", back_populates="test_execution")

class QualityCheck(Base):
    """
    Individual quality check results for comprehensive quality gate tracking.
    Supports the 90% quality threshold enforcement.
    """
    __tablename__ = "quality_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    test_execution_id = Column(Integer, ForeignKey("test_executions.id"), nullable=False, index=True)
    
    # Check details
    check_name = Column(String(255), nullable=False)
    check_type = Column(String(100), nullable=False)  # syntax, coverage, security, business_logic
    check_category = Column(String(100), nullable=False)  # automated, manual, hybrid
    
    # Results
    status = Column(Enum(QualityGateStatus), nullable=False)
    score = Column(Float, nullable=True)  # 0.0-1.0
    weight = Column(Float, default=1.0)  # Weight in overall quality score
    
    # Details and diagnostics
    message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    recommendations = Column(Text, nullable=True)
    
    # Timing
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    # Metadata
    check_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    test_execution = relationship("TestExecution", back_populates="quality_checks")

class PerformanceMetric(Base):
    """
    Detailed performance metrics for response time and system performance tracking.
    """
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    test_execution_id = Column(Integer, ForeignKey("test_executions.id"), nullable=False, index=True)
    
    # API performance
    endpoint_path = Column(String(500), nullable=True)
    http_method = Column(String(10), nullable=True)
    response_time_ms = Column(Float, nullable=True)
    status_code = Column(Integer, nullable=True)
    
    # Request/Response details
    request_size_bytes = Column(Integer, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    connection_time_ms = Column(Float, nullable=True)
    ssl_handshake_time_ms = Column(Float, nullable=True)
    
    # Performance thresholds
    response_threshold_met = Column(Boolean, default=True)
    performance_baseline_met = Column(Boolean, default=True)
    
    # System metrics during test
    system_cpu_percent = Column(Float, nullable=True)
    system_memory_percent = Column(Float, nullable=True)
    system_disk_io_mb = Column(Float, nullable=True)
    system_network_io_mb = Column(Float, nullable=True)
    
    # Database performance (if applicable)
    db_connection_count = Column(Integer, nullable=True)
    db_query_count = Column(Integer, nullable=True)
    db_query_duration_ms = Column(Float, nullable=True)
    
    # Metadata
    metric_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    test_execution = relationship("TestExecution", back_populates="performance_metrics")

class TemplateUsageMetric(Base):
    """
    Template usage analytics for optimization recommendations and effectiveness tracking.
    """
    __tablename__ = "template_usage_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    generated_test_id = Column(Integer, ForeignKey("generated_tests.id"), nullable=False, index=True)
    
    # Template information
    template_name = Column(String(255), nullable=False)
    template_type = Column(Enum(TemplateType), nullable=False)
    template_version = Column(String(50), nullable=True)
    template_hash = Column(String(255), nullable=True)
    
    # Usage metrics
    generation_time_ms = Column(Float, nullable=True)
    lines_generated = Column(Integer, nullable=True)
    complexity_score = Column(Float, nullable=True)  # 0.0-1.0
    
    # Effectiveness metrics
    success_rate = Column(Float, nullable=True)  # Based on execution results
    quality_contribution = Column(Float, nullable=True)  # Contribution to overall quality
    performance_impact = Column(Float, nullable=True)  # Impact on test performance
    
    # API context
    api_endpoint_path = Column(String(500), nullable=True)
    api_method = Column(String(10), nullable=True)
    api_complexity_level = Column(String(50), nullable=True)  # simple, medium, complex
    
    # Generation context
    openapi_schema_size = Column(Integer, nullable=True)
    parameters_count = Column(Integer, nullable=True)
    response_schemas_count = Column(Integer, nullable=True)
    
    # Metadata
    usage_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    generated_test = relationship("GeneratedTest")

class DashboardAlert(Base):
    """
    Alert management for centralized notification and threshold monitoring.
    """
    __tablename__ = "dashboard_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Alert classification
    alert_type = Column(String(100), nullable=False)  # performance, quality, system, workflow
    severity = Column(String(50), nullable=False)  # info, warning, error, critical
    category = Column(String(100), nullable=False)  # threshold_breach, system_error, quality_gate
    
    # Alert content
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    
    # Status tracking
    status = Column(String(50), default="active", nullable=False)  # active, acknowledged, resolved, suppressed
    acknowledged_by = Column(String(255), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(255), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Threshold and trigger information
    threshold_name = Column(String(255), nullable=True)
    threshold_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    trigger_condition = Column(String(255), nullable=True)
    
    # Context and relationships
    related_entity_type = Column(String(100), nullable=True)  # test_execution, review_workflow, etc.
    related_entity_id = Column(String(255), nullable=True)
    
    # Timing
    first_triggered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_triggered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    trigger_count = Column(Integer, default=1, nullable=False)
    
    # Metadata
    alert_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class DashboardMetricsCache(Base):
    """
    Optimized metrics caching for dashboard performance with <2 second load times.
    """
    __tablename__ = "dashboard_metrics_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), unique=True, nullable=False, index=True)
    
    # Cache metadata
    metric_type = Column(String(100), nullable=False)  # summary, performance, quality, trends
    time_period = Column(String(50), nullable=False)  # 1h, 24h, 7d, 30d
    dashboard_type = Column(String(100), nullable=False)  # executive, qa_ops, technical, analytics, alerts
    
    # Cached data
    cached_data = Column(JSON, nullable=False)
    data_hash = Column(String(255), nullable=True)  # For change detection
    
    # Cache control
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_accessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    access_count = Column(Integer, default=0, nullable=False)
    
    # Performance tracking
    generation_time_ms = Column(Float, nullable=True)
    data_size_bytes = Column(Integer, nullable=True)
    
    # Metadata
    cache_metadata = Column(JSON, nullable=True)

# Performance indexes for dashboard queries
Index('idx_test_executions_status_created', TestExecution.status, TestExecution.created_at)
Index('idx_test_executions_webhook_status', TestExecution.webhook_event_id, TestExecution.status)
Index('idx_quality_checks_execution_type', QualityCheck.test_execution_id, QualityCheck.check_type)
Index('idx_performance_metrics_endpoint_time', PerformanceMetric.endpoint_path, PerformanceMetric.created_at)
Index('idx_template_usage_type_created', TemplateUsageMetric.template_type, TemplateUsageMetric.created_at)
Index('idx_dashboard_alerts_status_severity', DashboardAlert.status, DashboardAlert.severity)
Index('idx_metrics_cache_type_period', DashboardMetricsCache.metric_type, DashboardMetricsCache.time_period)

engine = None
SessionLocal = None

async def init_db():
    global engine, SessionLocal
    settings = Settings()
    
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
    )
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Import all models to ensure they're registered
    from src.git.models import GitRepository, GitOperation, PullRequest, GitCommit, GitWebhookEvent
    from src.notifications.models import (
        NotificationChannel, NotificationTemplate, Notification, 
        NotificationLog, NotificationPreference
    )
    from src.review.events import WorkflowEvent
    
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()