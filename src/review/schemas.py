"""
Pydantic schemas for Review Workflow API
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from src.database.models import ReviewStatus, ReviewPriority, CommentType, ReviewRole, ApprovalStatus, SlaStatus, EscalationType


class ReviewWorkflowBase(BaseModel):
    """Base schema for review workflow"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    assignee_id: Optional[str] = Field(None, max_length=255)
    reviewer_id: Optional[str] = Field(None, max_length=255)
    priority: ReviewPriority = Field(default=ReviewPriority.MEDIUM)
    due_date: Optional[datetime] = None
    workflow_metadata: Optional[Dict[str, Any]] = None


class ReviewWorkflowCreate(ReviewWorkflowBase):
    """Schema for creating a new review workflow"""
    generated_test_id: int = Field(..., gt=0)


class ReviewWorkflowUpdate(BaseModel):
    """Schema for updating a review workflow"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    assignee_id: Optional[str] = Field(None, max_length=255)
    reviewer_id: Optional[str] = Field(None, max_length=255)
    priority: Optional[ReviewPriority] = None
    status: Optional[ReviewStatus] = None
    due_date: Optional[datetime] = None
    workflow_metadata: Optional[Dict[str, Any]] = None


class ReviewCommentBase(BaseModel):
    """Base schema for review comments"""
    content: str = Field(..., min_length=1, max_length=5000)
    comment_type: CommentType = Field(default=CommentType.GENERAL)
    line_number: Optional[int] = Field(None, ge=1)
    file_path: Optional[str] = Field(None, max_length=500)
    comment_metadata: Optional[Dict[str, Any]] = None


class ReviewCommentCreate(ReviewCommentBase):
    """Schema for creating a review comment"""
    author_id: str = Field(..., max_length=255)


class ReviewCommentResponse(ReviewCommentBase):
    """Schema for review comment response"""
    id: int
    review_workflow_id: int
    author_id: str
    resolved: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewMetricsResponse(BaseModel):
    """Schema for review metrics response"""
    id: int
    review_workflow_id: int
    time_to_first_response_minutes: Optional[int] = None
    time_to_completion_minutes: Optional[int] = None
    total_comments: int = 0
    issues_found: int = 0
    suggestions_made: int = 0
    revisions_requested: int = 0
    code_quality_score: Optional[int] = Field(None, ge=1, le=10)
    test_coverage_score: Optional[int] = Field(None, ge=1, le=10)
    performance_score: Optional[int] = Field(None, ge=1, le=10)
    security_score: Optional[int] = Field(None, ge=1, le=10)
    overall_score: Optional[int] = Field(None, ge=1, le=10)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GeneratedTestSummary(BaseModel):
    """Schema for generated test summary in review context"""
    id: int
    test_name: str
    file_path: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewWorkflowResponse(ReviewWorkflowBase):
    """Schema for review workflow response"""
    id: int
    generated_test_id: int
    status: ReviewStatus
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Approval integration
    has_approval_request: bool = Field(default=False, description="Whether this review has an active approval workflow")
    approval_status: Optional[ApprovalStatus] = Field(None, description="Current approval status if applicable")
    approval_request_id: Optional[int] = Field(None, description="ID of the approval request if applicable")
    
    # Relationships
    generated_test: Optional[GeneratedTestSummary] = None
    comments: List[ReviewCommentResponse] = []
    metrics: Optional[ReviewMetricsResponse] = None
    sla_tracking: Optional['WorkflowSlaTrackingResponse'] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewDashboardStats(BaseModel):
    """Schema for dashboard statistics"""
    total_reviews: int = 0
    pending_reviews: int = 0
    in_progress_reviews: int = 0
    completed_reviews: int = 0
    overdue_reviews: int = 0
    high_priority_pending: int = 0
    avg_completion_time_hours: float = 0.0
    date_range_days: int = 7


class ReviewSearchResult(BaseModel):
    """Schema for review search results"""
    id: int
    title: str
    description: Optional[str] = None
    status: ReviewStatus
    priority: ReviewPriority
    assignee_id: Optional[str] = None
    created_at: datetime


class ReviewSearchResponse(BaseModel):
    """Schema for search response"""
    query: str
    results: List[ReviewSearchResult]
    count: int
    total_available: Optional[int] = None


class ReviewStatusUpdate(BaseModel):
    """Schema for status update requests"""
    status: ReviewStatus
    message: Optional[str] = Field(None, max_length=1000)


class ReviewAssignment(BaseModel):
    """Schema for review assignment requests"""
    assignee_id: Optional[str] = Field(None, max_length=255)
    reviewer_id: Optional[str] = Field(None, max_length=255)
    priority: Optional[ReviewPriority] = None
    due_date: Optional[datetime] = None


class BulkReviewOperation(BaseModel):
    """Schema for bulk operations on reviews"""
    review_ids: List[int] = Field(..., min_length=1)
    operation: str = Field(..., pattern="^(assign|status_update|delete)$")
    parameters: Dict[str, Any] = Field(default_factory=dict)


class ReviewFilterOptions(BaseModel):
    """Schema for review filtering options"""
    status: Optional[List[ReviewStatus]] = None
    priority: Optional[List[ReviewPriority]] = None
    assignee_ids: Optional[List[str]] = None
    reviewer_ids: Optional[List[str]] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    due_before: Optional[datetime] = None
    has_overdue: Optional[bool] = None
    has_comments: Optional[bool] = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class ReviewAnalytics(BaseModel):
    """Schema for review analytics"""
    period_days: int = Field(..., ge=1, le=365)
    total_reviews: int = 0
    completed_reviews: int = 0
    avg_completion_time_minutes: Optional[float] = None
    avg_comments_per_review: float = 0.0
    avg_issues_per_review: float = 0.0
    avg_suggestions_per_review: float = 0.0
    completion_rate: float = 0.0  # Percentage
    on_time_completion_rate: float = 0.0  # Percentage
    
    # Status distribution
    status_distribution: Dict[str, int] = Field(default_factory=dict)
    priority_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Quality metrics
    avg_code_quality_score: Optional[float] = None
    avg_test_coverage_score: Optional[float] = None
    avg_performance_score: Optional[float] = None
    avg_security_score: Optional[float] = None
    avg_overall_score: Optional[float] = None
    
    # Top contributors
    most_active_reviewers: List[Dict[str, Any]] = Field(default_factory=list)
    most_assigned_developers: List[Dict[str, Any]] = Field(default_factory=list)


# SLA-related schemas

class WorkflowSlaPolicyBase(BaseModel):
    """Base schema for SLA policy"""
    priority: ReviewPriority
    initial_response_minutes: int = Field(..., gt=0, description="Minutes allowed for initial response")
    completion_minutes: int = Field(..., gt=0, description="Minutes allowed for completion")
    warning_threshold_percent: int = Field(default=75, ge=0, le=100, description="Percentage of time before warning")
    escalation_threshold_percent: int = Field(default=100, ge=0, le=150, description="Percentage of time before escalation")
    escalation_enabled: bool = Field(default=True, description="Whether escalation is enabled")
    auto_reassign_enabled: bool = Field(default=False, description="Whether auto-reassignment is enabled")
    escalation_recipients: Optional[List[str]] = Field(None, description="List of user IDs to escalate to")
    description: Optional[str] = Field(None, max_length=500, description="Policy description")


class WorkflowSlaPolicyCreate(WorkflowSlaPolicyBase):
    """Schema for creating SLA policy"""
    pass


class WorkflowSlaPolicyUpdate(BaseModel):
    """Schema for updating SLA policy"""
    initial_response_minutes: Optional[int] = Field(None, gt=0)
    completion_minutes: Optional[int] = Field(None, gt=0)
    warning_threshold_percent: Optional[int] = Field(None, ge=0, le=100)
    escalation_threshold_percent: Optional[int] = Field(None, ge=0, le=150)
    escalation_enabled: Optional[bool] = None
    auto_reassign_enabled: Optional[bool] = None
    escalation_recipients: Optional[List[str]] = None
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class WorkflowSlaPolicyResponse(WorkflowSlaPolicyBase):
    """Schema for SLA policy response"""
    id: int
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WorkflowSlaTrackingResponse(BaseModel):
    """Schema for SLA tracking response"""
    id: int
    review_workflow_id: int
    sla_policy_id: int
    status: SlaStatus
    
    # Timestamps
    started_at: datetime
    first_response_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    initial_response_due_at: datetime
    completion_due_at: datetime
    
    # Breach information
    initial_response_breached: bool = False
    completion_breached: bool = False
    breach_duration_minutes: int = 0
    
    # Escalation information
    warning_sent_at: Optional[datetime] = None
    escalation_sent_at: Optional[datetime] = None
    escalation_count: int = 0
    last_escalation_type: Optional[EscalationType] = None
    
    # Performance metrics
    time_to_first_response_minutes: Optional[int] = None
    time_to_completion_minutes: Optional[int] = None
    sla_compliance_score: Optional[int] = Field(None, ge=0, le=100, description="SLA compliance percentage")
    
    # Metadata
    tracking_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related objects
    sla_policy: Optional[WorkflowSlaPolicyResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SlaBreachAlert(BaseModel):
    """Schema for SLA breach alerts"""
    workflow_id: int
    tracking_id: int
    breach_type: str = Field(..., pattern="^(warning|initial_response|completion)$")
    priority: ReviewPriority
    status: SlaStatus
    breach_duration_minutes: int = 0
    escalation_type: Optional[EscalationType] = None
    assignee_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    due_date: datetime
    created_at: datetime


class SlaMetricsResponse(BaseModel):
    """Schema for SLA metrics response"""
    period_days: int
    total_workflows: int = 0
    completed_workflows: int = 0
    sla_compliance_rate: float = Field(0.0, ge=0.0, le=100.0, description="Overall SLA compliance percentage")
    
    # Response time metrics
    avg_response_time_minutes: float = 0.0
    avg_completion_time_minutes: float = 0.0
    
    # Breach metrics
    breach_count: int = 0
    at_risk_count: int = 0
    escalation_count: int = 0
    
    # Priority breakdown
    priority_metrics: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Metrics broken down by priority level"
    )
    
    # Trend data
    daily_metrics: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Daily SLA metrics for the period"
    )


class SlaComplianceReport(BaseModel):
    """Schema for SLA compliance reports"""
    report_period_days: int
    generated_at: datetime
    
    # Summary metrics
    total_reviews: int = 0
    compliant_reviews: int = 0
    compliance_rate: float = Field(0.0, ge=0.0, le=100.0)
    
    # Breach analysis
    total_breaches: int = 0
    response_time_breaches: int = 0
    completion_time_breaches: int = 0
    
    # Performance by priority
    priority_performance: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Top performers and issues
    best_performers: List[Dict[str, Any]] = Field(default_factory=list)
    worst_performers: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Recommendations
    recommendations: List[str] = Field(default_factory=list)


class SlaEscalationRequest(BaseModel):
    """Schema for manual SLA escalation requests"""
    sla_tracking_id: int = Field(..., gt=0)
    escalation_type: EscalationType
    reason: str = Field(..., min_length=1, max_length=1000)
    escalate_to: Optional[List[str]] = Field(None, description="Specific users to escalate to")
    urgent: bool = Field(default=False, description="Whether this is an urgent escalation")


class SlaSettingsUpdate(BaseModel):
    """Schema for updating SLA settings"""
    global_escalation_enabled: Optional[bool] = None
    default_warning_threshold: Optional[int] = Field(None, ge=0, le=100)
    default_escalation_threshold: Optional[int] = Field(None, ge=0, le=150)
    auto_reassignment_enabled: Optional[bool] = None
    escalation_cooldown_minutes: Optional[int] = Field(None, ge=0)


class SlaDashboardData(BaseModel):
    """Schema for SLA dashboard data"""
    current_time: datetime
    
    # Current status counts
    on_track_count: int = 0
    at_risk_count: int = 0
    breached_count: int = 0
    escalated_count: int = 0
    
    # Upcoming deadlines (next 24 hours)
    upcoming_response_deadlines: List[Dict[str, Any]] = Field(default_factory=list)
    upcoming_completion_deadlines: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Recent breaches (last 7 days)
    recent_breaches: List[SlaBreachAlert] = Field(default_factory=list)
    
    # Performance trends
    compliance_trend: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Active policies
    active_policies: List[WorkflowSlaPolicyResponse] = Field(default_factory=list)