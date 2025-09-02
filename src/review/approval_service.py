"""
Approval Service for managing multi-stage approval workflows.
Handles workflow initialization, stage management, and approval processing.
"""
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import structlog
from datetime import datetime, timezone, timedelta

from src.database.models import (
    ApprovalWorkflow, ApprovalWorkflowStage, ApprovalRequest,
    ApprovalStageInstance, Approval, ReviewWorkflow,
    ApprovalStatus, ApprovalWorkflowStatus, ReviewRole, ReviewPriority
)
from src.utils.error_handling import (
    NotFoundError, ValidationError, BusinessLogicError
)

logger = structlog.get_logger()


class ApprovalService:
    """Service for managing approval workflows and processing approvals."""

    def __init__(self, db: Session):
        self.db = db

    def initialize_approval_workflow(
        self,
        review_workflow_id: int,
        workflow_name: Optional[str] = None,
        requested_by: str = "system",
        priority: ReviewPriority = ReviewPriority.MEDIUM,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> ApprovalRequest:
        """
        Initialize an approval workflow for a review.
        
        Args:
            review_workflow_id: ID of the review workflow to create approval for
            workflow_name: Name of the approval workflow template to use
            requested_by: User ID who requested the approval
            priority: Priority level for the approval request
            title: Custom title for the approval request
            description: Custom description for the approval request
            
        Returns:
            ApprovalRequest: The created approval request
            
        Raises:
            NotFoundError: If review workflow or approval workflow template not found
            ValidationError: If workflow configuration is invalid
        """
        try:
            # Validate review workflow exists
            review_workflow = self.db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_workflow_id
            ).first()
            
            if not review_workflow:
                raise NotFoundError(f"Review workflow {review_workflow_id} not found")

            # Get workflow template (use default if not specified)
            approval_workflow = self._get_approval_workflow_template(workflow_name)
            
            if not approval_workflow:
                raise NotFoundError(f"Approval workflow template '{workflow_name}' not found")

            # Create approval request
            approval_request = ApprovalRequest(
                workflow_id=approval_workflow.id,
                review_workflow_id=review_workflow_id,
                title=title or f"Approval for {review_workflow.title}",
                description=description or f"Multi-stage approval for review workflow {review_workflow_id}",
                requested_by=requested_by,
                priority=priority,
                status=ApprovalStatus.PENDING,
                created_at=datetime.now(timezone.utc)
            )
            
            self.db.add(approval_request)
            self.db.flush()  # Get the ID

            # Create stage instances
            self._initialize_stage_instances(approval_request, approval_workflow)
            
            # Set current stage to first stage
            first_stage = min(approval_request.stage_instances, key=lambda x: x.order_index)
            approval_request.current_stage_id = first_stage.stage_id
            approval_request.started_at = datetime.now(timezone.utc)
            
            self.db.commit()
            
            logger.info(
                "Approval workflow initialized",
                approval_request_id=approval_request.id,
                review_workflow_id=review_workflow_id,
                workflow_template=approval_workflow.name
            )
            
            return approval_request
            
        except Exception as e:
            self.db.rollback()
            logger.error(
                "Failed to initialize approval workflow",
                error=str(e),
                review_workflow_id=review_workflow_id
            )
            raise

    def request_stage_approval(
        self,
        request_id: int,
        stage_id: int,
        approver_id: str,
        approver_role: ReviewRole
    ) -> bool:
        """
        Check if an approver can approve a specific stage.
        
        Args:
            request_id: ID of the approval request
            stage_id: ID of the workflow stage
            approver_id: ID of the potential approver
            approver_role: Role of the potential approver
            
        Returns:
            bool: True if approval is allowed
            
        Raises:
            NotFoundError: If request or stage not found
        """
        try:
            # Get approval request and stage
            approval_request = self._get_approval_request(request_id)
            stage_instance = self._get_stage_instance(request_id, stage_id)
            
            # Check if stage is currently active
            if approval_request.current_stage_id != stage_id:
                return False
                
            # Check if stage is already completed
            if stage_instance.status in [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]:
                return False
                
            # Check role permissions
            stage = stage_instance.stage
            if not self._check_role_permissions(approver_role, stage):
                return False
                
            # Check if approver already submitted approval
            existing_approval = self.db.query(Approval).filter(
                and_(
                    Approval.request_id == request_id,
                    Approval.stage_instance_id == stage_instance.id,
                    Approval.approver_id == approver_id
                )
            ).first()
            
            return existing_approval is None
            
        except Exception as e:
            logger.error(
                "Error checking stage approval permission",
                error=str(e),
                request_id=request_id,
                stage_id=stage_id,
                approver_id=approver_id
            )
            raise

    def submit_approval(
        self,
        request_id: int,
        approver_id: str,
        approver_role: ReviewRole,
        status: ApprovalStatus,
        comments: Optional[str] = None,
        conditions: Optional[str] = None
    ) -> Approval:
        """
        Submit an approval decision for the current stage.
        
        Args:
            request_id: ID of the approval request
            approver_id: ID of the approver
            approver_role: Role of the approver
            status: Approval decision (APPROVED or REJECTED)
            comments: Optional comments from the approver
            conditions: Optional conditions for approval
            
        Returns:
            Approval: The created approval record
            
        Raises:
            NotFoundError: If request not found
            ValidationError: If approval is not allowed
            BusinessLogicError: If approval cannot be processed
        """
        try:
            approval_request = self._get_approval_request(request_id)
            current_stage_instance = self._get_current_stage_instance(approval_request)
            
            # Validate approval is allowed
            if not self.request_stage_approval(
                request_id, 
                current_stage_instance.stage_id,
                approver_id,
                approver_role
            ):
                raise ValidationError("Approval not allowed for this user/stage")
            
            # Create approval record
            approval = Approval(
                request_id=request_id,
                stage_instance_id=current_stage_instance.id,
                approver_id=approver_id,
                approver_role=approver_role,
                status=status,
                comments=comments,
                conditions=conditions,
                created_at=datetime.now(timezone.utc)
            )
            
            self.db.add(approval)
            
            # Update stage progress
            if status == ApprovalStatus.APPROVED:
                current_stage_instance.approvals_received += 1
            elif status == ApprovalStatus.REJECTED:
                # Rejection ends the stage immediately
                current_stage_instance.status = ApprovalStatus.REJECTED
                current_stage_instance.completed_at = datetime.now(timezone.utc)
                approval_request.status = ApprovalStatus.REJECTED
                approval_request.completed_at = datetime.now(timezone.utc)
            
            self.db.flush()
            
            # Check if stage is complete and advance if needed
            if status == ApprovalStatus.APPROVED:
                self._check_and_advance_stage(approval_request, current_stage_instance)
            
            self.db.commit()
            
            logger.info(
                "Approval submitted",
                approval_id=approval.id,
                request_id=request_id,
                approver_id=approver_id,
                status=status.value
            )
            
            return approval
            
        except Exception as e:
            self.db.rollback()
            logger.error(
                "Failed to submit approval",
                error=str(e),
                request_id=request_id,
                approver_id=approver_id
            )
            raise

    def check_stage_completion(
        self, 
        request_id: int,
        stage_id: Optional[int] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if a stage (or current stage) is complete.
        
        Args:
            request_id: ID of the approval request
            stage_id: Optional specific stage ID to check (defaults to current)
            
        Returns:
            Tuple of (is_complete, stage_info)
            
        Raises:
            NotFoundError: If request or stage not found
        """
        try:
            approval_request = self._get_approval_request(request_id)
            
            if stage_id is None:
                stage_instance = self._get_current_stage_instance(approval_request)
            else:
                stage_instance = self._get_stage_instance(request_id, stage_id)
            
            is_complete = stage_instance.status in [
                ApprovalStatus.APPROVED, 
                ApprovalStatus.REJECTED
            ]
            
            stage_info = {
                "stage_id": stage_instance.stage_id,
                "stage_name": stage_instance.stage.name,
                "status": stage_instance.status.value,
                "approvals_received": stage_instance.approvals_received,
                "approvals_required": stage_instance.approvals_required,
                "started_at": stage_instance.started_at,
                "completed_at": stage_instance.completed_at,
                "is_complete": is_complete
            }
            
            return is_complete, stage_info
            
        except Exception as e:
            logger.error(
                "Error checking stage completion",
                error=str(e),
                request_id=request_id,
                stage_id=stage_id
            )
            raise

    def advance_to_next_stage(
        self, 
        request_id: int,
        force: bool = False
    ) -> Optional[ApprovalStageInstance]:
        """
        Advance approval to the next stage.
        
        Args:
            request_id: ID of the approval request
            force: Force advancement even if current stage not complete
            
        Returns:
            Optional[ApprovalStageInstance]: Next stage instance or None if complete
            
        Raises:
            NotFoundError: If request not found
            BusinessLogicError: If advancement is not allowed
        """
        try:
            approval_request = self._get_approval_request(request_id)
            current_stage = self._get_current_stage_instance(approval_request)
            
            # Check if current stage is complete (unless forced)
            if not force and current_stage.status != ApprovalStatus.APPROVED:
                raise BusinessLogicError("Current stage is not complete")
            
            # Find next stage
            next_stage = self.db.query(ApprovalStageInstance).filter(
                and_(
                    ApprovalStageInstance.request_id == request_id,
                    ApprovalStageInstance.order_index > current_stage.order_index,
                    ApprovalStageInstance.status == ApprovalStatus.PENDING
                )
            ).order_by(ApprovalStageInstance.order_index).first()
            
            if not next_stage:
                # No more stages - complete the approval
                approval_request.status = ApprovalStatus.APPROVED
                approval_request.completed_at = datetime.now(timezone.utc)
                approval_request.current_stage_id = None
                
                self.db.commit()
                
                logger.info(
                    "Approval workflow completed",
                    request_id=request_id
                )
                
                return None
            
            # Advance to next stage
            approval_request.current_stage_id = next_stage.stage_id
            next_stage.started_at = datetime.now(timezone.utc)
            
            self.db.commit()
            
            logger.info(
                "Advanced to next stage",
                request_id=request_id,
                next_stage_id=next_stage.stage_id,
                next_stage_name=next_stage.stage.name
            )
            
            return next_stage
            
        except Exception as e:
            self.db.rollback()
            logger.error(
                "Failed to advance to next stage",
                error=str(e),
                request_id=request_id
            )
            raise

    def get_approval_status(self, request_id: int) -> Dict[str, Any]:
        """Get comprehensive approval status information."""
        try:
            approval_request = self._get_approval_request(request_id)
            
            # Get all stage instances
            stage_instances = self.db.query(ApprovalStageInstance).filter(
                ApprovalStageInstance.request_id == request_id
            ).order_by(ApprovalStageInstance.order_index).all()
            
            # Get all approvals
            approvals = self.db.query(Approval).filter(
                Approval.request_id == request_id
            ).all()
            
            # Build status response
            stages_info = []
            for stage_instance in stage_instances:
                stage_approvals = [
                    a for a in approvals 
                    if a.stage_instance_id == stage_instance.id
                ]
                
                stages_info.append({
                    "stage_id": stage_instance.stage_id,
                    "stage_name": stage_instance.stage.name,
                    "order_index": stage_instance.order_index,
                    "status": stage_instance.status.value,
                    "approvals_received": stage_instance.approvals_received,
                    "approvals_required": stage_instance.approvals_required,
                    "is_current": approval_request.current_stage_id == stage_instance.stage_id,
                    "started_at": stage_instance.started_at,
                    "completed_at": stage_instance.completed_at,
                    "approvals": [
                        {
                            "approver_id": a.approver_id,
                            "approver_role": a.approver_role.value,
                            "status": a.status.value,
                            "comments": a.comments,
                            "created_at": a.created_at
                        } for a in stage_approvals
                    ]
                })
            
            return {
                "request_id": approval_request.id,
                "workflow_name": approval_request.workflow.name,
                "title": approval_request.title,
                "status": approval_request.status.value,
                "priority": approval_request.priority.value,
                "requested_by": approval_request.requested_by,
                "created_at": approval_request.created_at,
                "started_at": approval_request.started_at,
                "completed_at": approval_request.completed_at,
                "current_stage_id": approval_request.current_stage_id,
                "stages": stages_info
            }
            
        except Exception as e:
            logger.error(
                "Error getting approval status",
                error=str(e),
                request_id=request_id
            )
            raise

    def get_pending_approvals(
        self, 
        approver_id: str,
        approver_role: ReviewRole,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get pending approvals for a specific user."""
        try:
            # Find approval requests where user can approve current stage
            pending_approvals = []
            
            # Get active approval requests
            active_requests = self.db.query(ApprovalRequest).filter(
                and_(
                    ApprovalRequest.status == ApprovalStatus.PENDING,
                    ApprovalRequest.current_stage_id.isnot(None)
                )
            ).limit(limit * 2).all()  # Get more to filter by permissions
            
            for request in active_requests:
                if len(pending_approvals) >= limit:
                    break
                    
                # Check if user can approve current stage
                if self.request_stage_approval(
                    request.id, 
                    request.current_stage_id,
                    approver_id,
                    approver_role
                ):
                    current_stage_instance = self._get_current_stage_instance(request)
                    
                    pending_approvals.append({
                        "request_id": request.id,
                        "title": request.title,
                        "description": request.description,
                        "priority": request.priority.value,
                        "review_workflow_id": request.review_workflow_id,
                        "created_at": request.created_at,
                        "current_stage": {
                            "stage_id": current_stage_instance.stage_id,
                            "stage_name": current_stage_instance.stage.name,
                            "approvals_received": current_stage_instance.approvals_received,
                            "approvals_required": current_stage_instance.approvals_required
                        }
                    })
            
            return pending_approvals
            
        except Exception as e:
            logger.error(
                "Error getting pending approvals",
                error=str(e),
                approver_id=approver_id
            )
            raise

    # Private helper methods
    
    def _get_approval_workflow_template(self, name: Optional[str] = None) -> ApprovalWorkflow:
        """Get approval workflow template by name or default."""
        query = self.db.query(ApprovalWorkflow).filter(
            ApprovalWorkflow.status == ApprovalWorkflowStatus.ACTIVE
        )
        
        if name:
            workflow = query.filter(ApprovalWorkflow.name == name).first()
        else:
            workflow = query.filter(ApprovalWorkflow.is_default == True).first()
            
        return workflow

    def _initialize_stage_instances(
        self, 
        approval_request: ApprovalRequest,
        approval_workflow: ApprovalWorkflow
    ):
        """Create stage instances for the approval request."""
        stages = sorted(approval_workflow.stages, key=lambda x: x.order_index)
        
        for stage in stages:
            stage_instance = ApprovalStageInstance(
                request_id=approval_request.id,
                stage_id=stage.id,
                status=ApprovalStatus.PENDING,
                order_index=stage.order_index,
                approvals_required=stage.required_approvals,
                approvals_received=0,
                created_at=datetime.now(timezone.utc)
            )
            
            self.db.add(stage_instance)

    def _get_approval_request(self, request_id: int) -> ApprovalRequest:
        """Get approval request by ID or raise NotFoundError."""
        approval_request = self.db.query(ApprovalRequest).filter(
            ApprovalRequest.id == request_id
        ).first()
        
        if not approval_request:
            raise NotFoundError(f"Approval request {request_id} not found")
            
        return approval_request

    def _get_stage_instance(
        self, 
        request_id: int, 
        stage_id: int
    ) -> ApprovalStageInstance:
        """Get stage instance or raise NotFoundError."""
        stage_instance = self.db.query(ApprovalStageInstance).filter(
            and_(
                ApprovalStageInstance.request_id == request_id,
                ApprovalStageInstance.stage_id == stage_id
            )
        ).first()
        
        if not stage_instance:
            raise NotFoundError(f"Stage instance not found for request {request_id}, stage {stage_id}")
            
        return stage_instance

    def _get_current_stage_instance(
        self, 
        approval_request: ApprovalRequest
    ) -> ApprovalStageInstance:
        """Get current stage instance for approval request."""
        if not approval_request.current_stage_id:
            raise BusinessLogicError("No current stage for approval request")
            
        return self._get_stage_instance(
            approval_request.id, 
            approval_request.current_stage_id
        )

    def _check_role_permissions(
        self, 
        approver_role: ReviewRole,
        stage: ApprovalWorkflowStage
    ) -> bool:
        """Check if role can approve this stage."""
        # Parse required/allowed roles from JSON
        required_roles = stage.required_roles or []
        allowed_roles = stage.allowed_roles or []
        
        # If no restrictions, allow all roles
        if not required_roles and not allowed_roles:
            return True
        
        role_value = approver_role.value
        
        # Check if role is specifically allowed
        if allowed_roles and role_value in allowed_roles:
            return True
            
        # Check if role meets requirements
        if required_roles and role_value in required_roles:
            return True
            
        return False

    def _check_and_advance_stage(
        self, 
        approval_request: ApprovalRequest,
        current_stage_instance: ApprovalStageInstance
    ):
        """Check if stage is complete and advance if configured to do so."""
        # Check if stage has enough approvals
        if current_stage_instance.approvals_received >= current_stage_instance.approvals_required:
            current_stage_instance.status = ApprovalStatus.APPROVED
            current_stage_instance.completed_at = datetime.now(timezone.utc)
            
            # Auto-advance if configured
            workflow = approval_request.workflow
            if workflow.auto_advance:
                self.advance_to_next_stage(approval_request.id)