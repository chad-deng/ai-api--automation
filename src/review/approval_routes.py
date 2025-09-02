"""
FastAPI routes for approval workflow management.
Provides endpoints for approval requests, submissions, and workflow management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import structlog

from src.database.models import get_db, ReviewRole
from src.auth.session import get_current_user
from src.review.approval_service import ApprovalService
from src.review.approval_schemas import (
    ApprovalRequestCreate, ApprovalRequestResponse, ApprovalStatusResponse,
    ApprovalSubmission, ApprovalResponse, PendingApprovalsResponse,
    ApprovalAdvanceRequest, ApprovalWorkflowCreate, ApprovalWorkflowResponse,
    ApprovalWorkflowListResponse, ApprovalRequestListResponse
)
from src.utils.error_handling import (
    NotFoundError, ValidationError, BusinessLogicError
)

logger = structlog.get_logger()

approval_router = APIRouter(prefix="/api/v1/approvals", tags=["approvals"])


def get_approval_service(db: Session = Depends(get_db)) -> ApprovalService:
    """Dependency to get approval service instance."""
    return ApprovalService(db)


def get_user_role(current_user: Optional[dict] = Depends(get_current_user)) -> ReviewRole:
    """Extract user role from current user session."""
    try:
        if not current_user:
            return ReviewRole.DEVELOPER
        role_str = current_user.get("role", "developer").upper()
        return ReviewRole(role_str.lower())
    except (ValueError, AttributeError):
        # Default to developer role if role is invalid or current_user is None
        return ReviewRole.DEVELOPER


# Approval Request Management

@approval_router.post("/reviews/{review_id}/request", response_model=ApprovalRequestResponse)
async def create_approval_request(
    review_id: int,
    request_data: ApprovalRequestCreate,
    current_user: dict = Depends(get_current_user),
    approval_service: ApprovalService = Depends(get_approval_service)
):
    """
    Create a new approval request for a review workflow.
    
    This initializes a multi-stage approval workflow for the specified review.
    The workflow template used can be specified or will default to the system default.
    """
    try:
        approval_request = approval_service.initialize_approval_workflow(
            review_workflow_id=review_id,
            workflow_name=request_data.workflow_name,
            requested_by=current_user["username"],
            priority=request_data.priority,
            title=request_data.title,
            description=request_data.description
        )
        
        logger.info(
            "Approval request created",
            approval_request_id=approval_request.id,
            review_workflow_id=review_id,
            requested_by=current_user["username"]
        )
        
        return approval_request
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to create approval request", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create approval request"
        )


@approval_router.get("/requests/{request_id}/status", response_model=ApprovalStatusResponse)
async def get_approval_status(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    approval_service: ApprovalService = Depends(get_approval_service)
):
    """
    Get comprehensive status information for an approval request.
    
    Returns detailed information about all stages, approvals received,
    and current workflow state.
    """
    try:
        status_info = approval_service.get_approval_status(request_id)
        
        return ApprovalStatusResponse(**status_info)
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to get approval status", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get approval status"
        )


@approval_router.get("/requests", response_model=ApprovalRequestListResponse)
async def list_approval_requests(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    priority_filter: Optional[str] = Query(None, description="Filter by priority"),
    requested_by: Optional[str] = Query(None, description="Filter by requester"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List approval requests with optional filtering.
    
    Supports filtering by status, priority, and requester.
    Results are paginated using limit and offset.
    """
    try:
        # This would be implemented in the approval service
        # For now, return empty list
        return ApprovalRequestListResponse(
            requests=[],
            total_count=0
        )
        
    except Exception as e:
        logger.error("Failed to list approval requests", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list approval requests"
        )


# Approval Submission

@approval_router.post("/requests/{request_id}/submit", response_model=ApprovalResponse)
async def submit_approval(
    request_id: int,
    approval_data: ApprovalSubmission,
    current_user: dict = Depends(get_current_user),
    user_role: ReviewRole = Depends(get_user_role),
    approval_service: ApprovalService = Depends(get_approval_service)
):
    """
    Submit an approval decision for the current stage of an approval request.
    
    Users can approve or reject the current stage if they have the required permissions.
    The system will automatically advance to the next stage if configured.
    """
    try:
        # Check if user can approve this request
        can_approve = approval_service.request_stage_approval(
            request_id=request_id,
            stage_id=None,  # Will check current stage
            approver_id=current_user["username"],
            approver_role=user_role
        )
        
        if not can_approve:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to approve this request at this stage"
            )
        
        # Submit the approval
        approval = approval_service.submit_approval(
            request_id=request_id,
            approver_id=current_user["username"],
            approver_role=user_role,
            status=approval_data.status,
            comments=approval_data.comments,
            conditions=approval_data.conditions
        )
        
        logger.info(
            "Approval submitted",
            approval_id=approval.id,
            request_id=request_id,
            approver_id=current_user["username"],
            status=approval_data.status.value
        )
        
        return approval
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except BusinessLogicError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to submit approval", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit approval"
        )


# Approval Management

@approval_router.get("/pending", response_model=PendingApprovalsResponse)
async def get_pending_approvals(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    user_role: ReviewRole = Depends(get_user_role),
    approval_service: ApprovalService = Depends(get_approval_service)
):
    """
    Get pending approvals for the current user.
    
    Returns a list of approval requests where the current user
    can provide approval for the current stage.
    """
    try:
        pending_approvals = approval_service.get_pending_approvals(
            approver_id=current_user["username"],
            approver_role=user_role,
            limit=limit
        )
        
        return PendingApprovalsResponse(
            approvals=pending_approvals,
            total_count=len(pending_approvals),
            approver_id=current_user["username"],
            approver_role=user_role
        )
        
    except Exception as e:
        logger.error("Failed to get pending approvals", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get pending approvals"
        )


@approval_router.post("/requests/{request_id}/advance", response_model=dict)
async def advance_approval_stage(
    request_id: int,
    advance_data: ApprovalAdvanceRequest,
    current_user: dict = Depends(get_current_user),
    user_role: ReviewRole = Depends(get_user_role),
    approval_service: ApprovalService = Depends(get_approval_service)
):
    """
    Manually advance an approval request to the next stage.
    
    This endpoint allows authorized users (typically admins or leads) to
    manually advance an approval workflow, optionally bypassing incomplete stages.
    """
    try:
        # Check permissions - only certain roles can force advancement
        if advance_data.force and user_role not in [ReviewRole.ADMIN, ReviewRole.QA_LEAD, ReviewRole.TECH_LEAD]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to force stage advancement"
            )
        
        next_stage = approval_service.advance_to_next_stage(
            request_id=request_id,
            force=advance_data.force
        )
        
        if next_stage:
            response = {
                "message": "Advanced to next stage",
                "next_stage_id": next_stage.stage_id,
                "next_stage_name": next_stage.stage.name
            }
        else:
            response = {
                "message": "Approval workflow completed",
                "next_stage_id": None,
                "next_stage_name": None
            }
        
        logger.info(
            "Approval stage advanced",
            request_id=request_id,
            advanced_by=current_user["username"],
            force=advance_data.force,
            reason=advance_data.reason
        )
        
        return response
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except BusinessLogicError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Failed to advance approval stage", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to advance approval stage"
        )


# Workflow Management (Admin endpoints)

@approval_router.post("/workflows", response_model=ApprovalWorkflowResponse)
async def create_approval_workflow(
    workflow_data: ApprovalWorkflowCreate,
    current_user: dict = Depends(get_current_user),
    user_role: ReviewRole = Depends(get_user_role),
    db: Session = Depends(get_db)
):
    """
    Create a new approval workflow template.
    
    Only administrators and QA leads can create new workflow templates.
    The workflow defines the stages and approval requirements.
    """
    try:
        # Check permissions
        if user_role not in [ReviewRole.ADMIN, ReviewRole.QA_LEAD]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create approval workflows"
            )
        
        # This would be implemented in the approval service
        # For now, return a placeholder response
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Workflow creation not yet implemented"
        )
        
    except Exception as e:
        logger.error("Failed to create approval workflow", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create approval workflow"
        )


@approval_router.get("/workflows", response_model=ApprovalWorkflowListResponse)
async def list_approval_workflows(
    active_only: bool = Query(True, description="Only return active workflows"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List available approval workflow templates.
    
    Returns all workflow templates that can be used for creating approval requests.
    """
    try:
        # This would be implemented in the approval service
        # For now, return empty list
        return ApprovalWorkflowListResponse(
            workflows=[],
            total_count=0
        )
        
    except Exception as e:
        logger.error("Failed to list approval workflows", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list approval workflows"
        )


@approval_router.get("/workflows/{workflow_id}", response_model=ApprovalWorkflowResponse)
async def get_approval_workflow(
    workflow_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific approval workflow template.
    
    Returns the workflow configuration including all stages and their requirements.
    """
    try:
        # This would be implemented in the approval service
        # For now, return not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
        
    except Exception as e:
        logger.error("Failed to get approval workflow", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get approval workflow"
        )


# Health check and permissions

@approval_router.get("/permissions", response_model=dict)
async def get_user_permissions(
    current_user: Optional[dict] = Depends(get_current_user),
    user_role: ReviewRole = Depends(get_user_role)
):
    """
    Get the current user's approval permissions.
    
    Returns information about what approval actions the user can perform
    based on their role and current system state.
    """
    try:
        user_id = current_user.get("username", "anonymous") if current_user else "anonymous"
        
        permissions = {
            "user_id": user_id,
            "role": user_role.value,
            "authenticated": current_user is not None,
            "can_create_workflows": user_role in [ReviewRole.ADMIN, ReviewRole.QA_LEAD],
            "can_force_advance": user_role in [ReviewRole.ADMIN, ReviewRole.QA_LEAD, ReviewRole.TECH_LEAD],
            "can_approve": True,  # All roles can approve if they meet stage requirements
            "can_view_all_requests": user_role in [ReviewRole.ADMIN, ReviewRole.QA_LEAD]
        }
        
        return permissions
        
    except Exception as e:
        logger.error("Failed to get user permissions", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user permissions"
        )