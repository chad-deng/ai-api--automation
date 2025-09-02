"""
Pydantic schemas for Approval Workflow API
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from src.database.models import (
    ReviewPriority, ApprovalStatus, ApprovalWorkflowStatus, ReviewRole
)


# Base schemas

class ApprovalWorkflowStageBase(BaseModel):
    """Base schema for approval workflow stage"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    order_index: int = Field(..., ge=0)
    required_approvals: int = Field(default=1, ge=1)
    required_roles: Optional[List[str]] = Field(None, description="Required roles for approval")
    allowed_roles: Optional[List[str]] = Field(None, description="Allowed roles for approval")
    is_optional: bool = Field(default=False)
    timeout_hours: Optional[int] = Field(None, ge=1, description="Auto-reject timeout in hours")
    stage_metadata: Optional[Dict[str, Any]] = None


class ApprovalWorkflowStageCreate(ApprovalWorkflowStageBase):
    """Schema for creating approval workflow stage"""
    pass


class ApprovalWorkflowStageUpdate(BaseModel):
    """Schema for updating approval workflow stage"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    order_index: Optional[int] = Field(None, ge=0)
    required_approvals: Optional[int] = Field(None, ge=1)
    required_roles: Optional[List[str]] = None
    allowed_roles: Optional[List[str]] = None
    is_optional: Optional[bool] = None
    timeout_hours: Optional[int] = Field(None, ge=1)
    stage_metadata: Optional[Dict[str, Any]] = None


class ApprovalWorkflowStageResponse(ApprovalWorkflowStageBase):
    """Schema for approval workflow stage response"""
    id: int
    workflow_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Approval Workflow schemas

class ApprovalWorkflowBase(BaseModel):
    """Base schema for approval workflow"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    is_default: bool = Field(default=False)
    requires_all_stages: bool = Field(default=True, description="All stages required vs any stage")
    auto_advance: bool = Field(default=True, description="Auto-advance to next stage")
    allow_parallel_approvals: bool = Field(default=False, description="Allow parallel approvals within stage")
    workflow_metadata: Optional[Dict[str, Any]] = None


class ApprovalWorkflowCreate(ApprovalWorkflowBase):
    """Schema for creating approval workflow"""
    created_by: str = Field(..., max_length=255)
    stages: List[ApprovalWorkflowStageCreate] = Field(..., min_length=1)


class ApprovalWorkflowUpdate(BaseModel):
    """Schema for updating approval workflow"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[ApprovalWorkflowStatus] = None
    is_default: Optional[bool] = None
    requires_all_stages: Optional[bool] = None
    auto_advance: Optional[bool] = None
    allow_parallel_approvals: Optional[bool] = None
    workflow_metadata: Optional[Dict[str, Any]] = None


class ApprovalWorkflowResponse(ApprovalWorkflowBase):
    """Schema for approval workflow response"""
    id: int
    status: ApprovalWorkflowStatus
    created_by: str
    created_at: datetime
    updated_at: datetime
    stages: List[ApprovalWorkflowStageResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Approval Request schemas

class ApprovalRequestBase(BaseModel):
    """Base schema for approval request"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    priority: ReviewPriority = Field(default=ReviewPriority.MEDIUM)
    due_date: Optional[datetime] = None
    request_metadata: Optional[Dict[str, Any]] = None


class ApprovalRequestCreate(ApprovalRequestBase):
    """Schema for creating approval request"""
    workflow_name: Optional[str] = Field(None, description="Name of approval workflow to use (uses default if not specified)")
    requested_by: str = Field(..., max_length=255)


class ApprovalRequestUpdate(BaseModel):
    """Schema for updating approval request"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[ReviewPriority] = None
    due_date: Optional[datetime] = None
    request_metadata: Optional[Dict[str, Any]] = None


class ApprovalSubmission(BaseModel):
    """Schema for submitting an approval"""
    status: ApprovalStatus = Field(..., description="APPROVED or REJECTED")
    comments: Optional[str] = Field(None, max_length=5000)
    conditions: Optional[str] = Field(None, max_length=2000, description="Any conditions for approval")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v not in [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]:
            raise ValueError("Status must be APPROVED or REJECTED")
        return v


# Response schemas

class ApprovalResponse(BaseModel):
    """Schema for individual approval response"""
    id: int
    approver_id: str
    approver_role: ReviewRole
    status: ApprovalStatus
    comments: Optional[str] = None
    conditions: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApprovalStageStatusResponse(BaseModel):
    """Schema for approval stage status response"""
    stage_id: int
    stage_name: str
    order_index: int
    status: ApprovalStatus
    approvals_received: int
    approvals_required: int
    is_current: bool
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    approvals: List[ApprovalResponse] = []


class ApprovalRequestResponse(ApprovalRequestBase):
    """Schema for approval request response"""
    id: int
    workflow_id: int
    review_workflow_id: int
    requested_by: str
    status: ApprovalStatus
    current_stage_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ApprovalStatusResponse(BaseModel):
    """Schema for comprehensive approval status response"""
    request_id: int
    workflow_name: str
    title: str
    status: ApprovalStatus
    priority: ReviewPriority
    requested_by: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    current_stage_id: Optional[int] = None
    stages: List[ApprovalStageStatusResponse] = []


class PendingApprovalResponse(BaseModel):
    """Schema for pending approval items"""
    request_id: int
    title: str
    description: Optional[str] = None
    priority: ReviewPriority
    review_workflow_id: int
    created_at: datetime
    current_stage: Dict[str, Any]  # Current stage information


class PendingApprovalsResponse(BaseModel):
    """Schema for list of pending approvals"""
    approvals: List[PendingApprovalResponse] = []
    total_count: int
    approver_id: str
    approver_role: ReviewRole


# Workflow management schemas

class ApprovalWorkflowListResponse(BaseModel):
    """Schema for listing approval workflows"""
    workflows: List[ApprovalWorkflowResponse] = []
    total_count: int


class ApprovalRequestListResponse(BaseModel):
    """Schema for listing approval requests"""
    requests: List[ApprovalRequestResponse] = []
    total_count: int


class ApprovalAdvanceRequest(BaseModel):
    """Schema for manually advancing approval to next stage"""
    force: bool = Field(default=False, description="Force advancement even if current stage not complete")
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for manual advancement")


class ApprovalBulkAction(BaseModel):
    """Schema for bulk actions on approvals"""
    request_ids: List[int] = Field(..., min_length=1)
    action: str = Field(..., pattern="^(cancel|reassign|advance)$")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)


# Analytics and metrics schemas

class ApprovalMetrics(BaseModel):
    """Schema for approval metrics"""
    total_requests: int = 0
    completed_requests: int = 0
    pending_requests: int = 0
    rejected_requests: int = 0
    avg_completion_time_hours: Optional[float] = None
    avg_approvals_per_stage: float = 0.0
    completion_rate: float = 0.0  # Percentage
    
    # Stage metrics
    avg_stages_per_workflow: float = 0.0
    most_common_rejection_stage: Optional[str] = None
    
    # User metrics
    most_active_approvers: List[Dict[str, Any]] = Field(default_factory=list)
    bottleneck_stages: List[Dict[str, Any]] = Field(default_factory=list)


class ApprovalAnalytics(BaseModel):
    """Schema for approval analytics"""
    period_days: int = Field(..., ge=1, le=365)
    metrics: ApprovalMetrics
    trends: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    workflow_performance: List[Dict[str, Any]] = Field(default_factory=list)


# Error and validation schemas

class ApprovalError(BaseModel):
    """Schema for approval-specific errors"""
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now())


class ApprovalValidationError(BaseModel):
    """Schema for validation errors"""
    field: str
    message: str
    code: str