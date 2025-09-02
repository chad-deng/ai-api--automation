"""
SLA Service for Review Workflow Management
Handles SLA policy management, tracking, and breach detection/escalation
"""
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
import structlog
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from src.database.models import (
    WorkflowSlaPolicy, WorkflowSlaTracking, ReviewWorkflow,
    ReviewPriority, ReviewStatus, SlaStatus, EscalationType, SessionLocal
)
from src.notifications.service import NotificationService
from src.notifications.models import EventType, NotificationPriority

logger = structlog.get_logger()


class SlaService:
    """Service for managing SLA policies and tracking for review workflows"""
    
    def __init__(self):
        self.notification_service = NotificationService()
    
    def _get_db_session(self) -> Session:
        """Get database session"""
        return SessionLocal()
    
    async def initialize_sla_tracking(self, review_workflow_id: int) -> Optional[WorkflowSlaTracking]:
        """
        Initialize SLA tracking for a review workflow
        
        Args:
            review_workflow_id: ID of the review workflow to track
            
        Returns:
            WorkflowSlaTracking record or None if initialization failed
        """
        db = self._get_db_session()
        
        try:
            # Get the review workflow
            workflow = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_workflow_id
            ).first()
            
            if not workflow:
                logger.error("Review workflow not found", workflow_id=review_workflow_id)
                return None
            
            # Check if SLA tracking already exists
            existing_tracking = db.query(WorkflowSlaTracking).filter(
                WorkflowSlaTracking.review_workflow_id == review_workflow_id
            ).first()
            
            if existing_tracking:
                logger.info("SLA tracking already exists", 
                          workflow_id=review_workflow_id,
                          tracking_id=existing_tracking.id)
                return existing_tracking
            
            # Get SLA policy for this priority level
            sla_policy = await self._get_sla_policy_for_priority(workflow.priority)
            if not sla_policy:
                logger.warning("No SLA policy found for priority",
                             priority=workflow.priority.value,
                             workflow_id=review_workflow_id)
                return None
            
            # Calculate SLA deadlines
            start_time = workflow.created_at or datetime.now(timezone.utc)
            initial_response_due = start_time + timedelta(minutes=sla_policy.initial_response_minutes)
            completion_due = start_time + timedelta(minutes=sla_policy.completion_minutes)
            
            # Create SLA tracking record
            sla_tracking = WorkflowSlaTracking(
                review_workflow_id=review_workflow_id,
                sla_policy_id=sla_policy.id,
                started_at=start_time,
                initial_response_due_at=initial_response_due,
                completion_due_at=completion_due,
                status=SlaStatus.ON_TRACK
            )
            
            db.add(sla_tracking)
            db.commit()
            db.refresh(sla_tracking)
            
            logger.info("SLA tracking initialized",
                       workflow_id=review_workflow_id,
                       tracking_id=sla_tracking.id,
                       priority=workflow.priority.value,
                       initial_response_due=initial_response_due,
                       completion_due=completion_due)
            
            return sla_tracking
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to initialize SLA tracking",
                        workflow_id=review_workflow_id,
                        error=str(e))
            return None
        finally:
            db.close()
    
    async def update_sla_tracking(
        self, 
        review_workflow_id: int, 
        event_type: str,
        event_data: Optional[Dict] = None
    ) -> bool:
        """
        Update SLA tracking based on workflow events
        
        Args:
            review_workflow_id: ID of the review workflow
            event_type: Type of event (first_response, status_change, etc.)
            event_data: Additional event data
            
        Returns:
            True if update was successful
        """
        db = self._get_db_session()
        
        try:
            # Get SLA tracking record
            sla_tracking = db.query(WorkflowSlaTracking).filter(
                WorkflowSlaTracking.review_workflow_id == review_workflow_id
            ).first()
            
            if not sla_tracking:
                logger.warning("SLA tracking not found for workflow",
                             workflow_id=review_workflow_id)
                return False
            
            current_time = datetime.now(timezone.utc)
            updated = False
            
            # Handle different event types
            if event_type == "first_response" and not sla_tracking.first_response_at:
                sla_tracking.first_response_at = current_time
                sla_tracking.time_to_first_response_minutes = int(
                    (current_time - sla_tracking.started_at).total_seconds() / 60
                )
                updated = True
                
            elif event_type == "workflow_completed" and not sla_tracking.completed_at:
                sla_tracking.completed_at = current_time
                sla_tracking.time_to_completion_minutes = int(
                    (current_time - sla_tracking.started_at).total_seconds() / 60
                )
                updated = True
                
            elif event_type == "reviewer_assigned" and not sla_tracking.first_response_at:
                sla_tracking.first_response_at = current_time
                sla_tracking.time_to_first_response_minutes = int(
                    (current_time - sla_tracking.started_at).total_seconds() / 60
                )
                updated = True
            
            if updated:
                # Update SLA status and check for breaches
                await self._update_sla_status(sla_tracking, current_time)
                
                db.commit()
                
                logger.info("SLA tracking updated",
                           workflow_id=review_workflow_id,
                           event_type=event_type,
                           status=sla_tracking.status.value)
                
                # Check for SLA breaches and handle escalation
                await self._check_and_handle_breaches(sla_tracking)
            
            return True
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to update SLA tracking",
                        workflow_id=review_workflow_id,
                        event_type=event_type,
                        error=str(e))
            return False
        finally:
            db.close()
    
    async def check_sla_breaches(self) -> List[Dict]:
        """
        Check all active SLA tracking for breaches and at-risk workflows
        
        Returns:
            List of breach/at-risk information
        """
        db = self._get_db_session()
        
        try:
            current_time = datetime.now(timezone.utc)
            
            # Get all active SLA tracking records
            active_tracking = db.query(WorkflowSlaTracking).join(
                ReviewWorkflow
            ).filter(
                and_(
                    ReviewWorkflow.status.in_([
                        ReviewStatus.PENDING,
                        ReviewStatus.IN_PROGRESS,
                        ReviewStatus.NEEDS_CHANGES
                    ]),
                    WorkflowSlaTracking.completed_at.is_(None)
                )
            ).all()
            
            breaches_and_risks = []
            
            for tracking in active_tracking:
                old_status = tracking.status
                await self._update_sla_status(tracking, current_time)
                
                # If status changed, record it
                if tracking.status != old_status:
                    breaches_and_risks.append({
                        'workflow_id': tracking.review_workflow_id,
                        'tracking_id': tracking.id,
                        'old_status': old_status.value,
                        'new_status': tracking.status.value,
                        'priority': tracking.sla_policy.priority.value,
                        'initial_response_due': tracking.initial_response_due_at,
                        'completion_due': tracking.completion_due_at,
                        'breach_duration_minutes': tracking.breach_duration_minutes
                    })
                    
                    # Handle escalation
                    await self._check_and_handle_breaches(tracking)
            
            if breaches_and_risks:
                db.commit()
            
            return breaches_and_risks
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to check SLA breaches", error=str(e))
            return []
        finally:
            db.close()
    
    async def handle_escalation(
        self, 
        sla_tracking: WorkflowSlaTracking,
        escalation_type: EscalationType
    ) -> bool:
        """
        Handle SLA breach escalation
        
        Args:
            sla_tracking: SLA tracking record
            escalation_type: Type of escalation to perform
            
        Returns:
            True if escalation was handled successfully
        """
        try:
            current_time = datetime.now(timezone.utc)
            
            # Update escalation tracking
            sla_tracking.escalation_count += 1
            sla_tracking.last_escalation_type = escalation_type
            
            if escalation_type == EscalationType.WARNING:
                sla_tracking.warning_sent_at = current_time
            else:
                sla_tracking.escalation_sent_at = current_time
            
            # Send notifications based on escalation type
            await self._send_escalation_notification(sla_tracking, escalation_type)
            
            # Handle auto-reassignment if enabled
            if (escalation_type != EscalationType.WARNING and 
                sla_tracking.sla_policy.auto_reassign_enabled):
                await self._handle_auto_reassignment(sla_tracking)
            
            logger.info("SLA escalation handled",
                       tracking_id=sla_tracking.id,
                       escalation_type=escalation_type.value,
                       escalation_count=sla_tracking.escalation_count)
            
            return True
            
        except Exception as e:
            logger.error("Failed to handle SLA escalation",
                        tracking_id=sla_tracking.id,
                        escalation_type=escalation_type.value,
                        error=str(e))
            return False
    
    async def get_sla_metrics(
        self, 
        days: int = 30,
        priority: Optional[ReviewPriority] = None
    ) -> Dict:
        """
        Get SLA performance metrics
        
        Args:
            days: Number of days to analyze
            priority: Optional priority filter
            
        Returns:
            Dictionary containing SLA metrics
        """
        db = self._get_db_session()
        
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            query = db.query(WorkflowSlaTracking).filter(
                WorkflowSlaTracking.started_at >= start_date
            )
            
            if priority:
                query = query.join(WorkflowSlaPolicy).filter(
                    WorkflowSlaPolicy.priority == priority
                )
            
            tracking_records = query.all()
            
            if not tracking_records:
                return {
                    'total_workflows': 0,
                    'sla_compliance_rate': 0.0,
                    'avg_response_time_minutes': 0.0,
                    'avg_completion_time_minutes': 0.0,
                    'breach_count': 0,
                    'at_risk_count': 0
                }
            
            total_workflows = len(tracking_records)
            completed_workflows = [t for t in tracking_records if t.completed_at]
            
            # Calculate metrics
            sla_compliant = len([t for t in tracking_records 
                               if t.status in [SlaStatus.ON_TRACK]])
            
            initial_response_times = [t.time_to_first_response_minutes 
                                    for t in tracking_records 
                                    if t.time_to_first_response_minutes is not None]
            
            completion_times = [t.time_to_completion_minutes 
                              for t in completed_workflows 
                              if t.time_to_completion_minutes is not None]
            
            breach_count = len([t for t in tracking_records 
                              if t.status == SlaStatus.BREACHED])
            
            at_risk_count = len([t for t in tracking_records 
                               if t.status == SlaStatus.AT_RISK])
            
            return {
                'total_workflows': total_workflows,
                'completed_workflows': len(completed_workflows),
                'sla_compliance_rate': (sla_compliant / total_workflows) * 100,
                'avg_response_time_minutes': (
                    sum(initial_response_times) / len(initial_response_times)
                    if initial_response_times else 0.0
                ),
                'avg_completion_time_minutes': (
                    sum(completion_times) / len(completion_times)
                    if completion_times else 0.0
                ),
                'breach_count': breach_count,
                'at_risk_count': at_risk_count,
                'escalation_count': sum(t.escalation_count for t in tracking_records),
                'period_days': days
            }
            
        except Exception as e:
            logger.error("Failed to get SLA metrics", error=str(e))
            return {}
        finally:
            db.close()
    
    # Private helper methods
    
    async def _get_sla_policy_for_priority(self, priority: ReviewPriority) -> Optional[WorkflowSlaPolicy]:
        """Get SLA policy for given priority level"""
        db = self._get_db_session()
        
        try:
            return db.query(WorkflowSlaPolicy).filter(
                and_(
                    WorkflowSlaPolicy.priority == priority,
                    WorkflowSlaPolicy.is_active == True
                )
            ).first()
        finally:
            db.close()
    
    async def _update_sla_status(self, sla_tracking: WorkflowSlaTracking, current_time: datetime):
        """Update SLA status based on current time and deadlines"""
        # Skip if already completed
        if sla_tracking.completed_at:
            return
        
        # Check initial response SLA
        if not sla_tracking.first_response_at:
            if current_time > sla_tracking.initial_response_due_at:
                sla_tracking.initial_response_breached = True
                sla_tracking.status = SlaStatus.BREACHED
            elif current_time > (sla_tracking.initial_response_due_at - 
                               timedelta(minutes=(sla_tracking.sla_policy.initial_response_minutes * 
                                               (100 - sla_tracking.sla_policy.warning_threshold_percent) / 100))):
                sla_tracking.status = SlaStatus.AT_RISK
        
        # Check completion SLA
        if current_time > sla_tracking.completion_due_at:
            sla_tracking.completion_breached = True
            sla_tracking.status = SlaStatus.BREACHED
            sla_tracking.breach_duration_minutes = int(
                (current_time - sla_tracking.completion_due_at).total_seconds() / 60
            )
        elif current_time > (sla_tracking.completion_due_at - 
                           timedelta(minutes=(sla_tracking.sla_policy.completion_minutes * 
                                           (100 - sla_tracking.sla_policy.warning_threshold_percent) / 100))):
            if sla_tracking.status == SlaStatus.ON_TRACK:
                sla_tracking.status = SlaStatus.AT_RISK
        
        # Calculate compliance score
        if sla_tracking.completed_at:
            total_sla_minutes = sla_tracking.sla_policy.completion_minutes
            actual_minutes = sla_tracking.time_to_completion_minutes or 0
            sla_tracking.sla_compliance_score = max(0, min(100, 
                int(100 * (total_sla_minutes - max(0, actual_minutes - total_sla_minutes)) / total_sla_minutes)
            ))
    
    async def _check_and_handle_breaches(self, sla_tracking: WorkflowSlaTracking):
        """Check for breaches and handle escalation"""
        current_time = datetime.now(timezone.utc)
        
        # Check if we need to send warning
        if (sla_tracking.status == SlaStatus.AT_RISK and 
            not sla_tracking.warning_sent_at and
            sla_tracking.sla_policy.escalation_enabled):
            await self.handle_escalation(sla_tracking, EscalationType.WARNING)
        
        # Check if we need to escalate
        elif (sla_tracking.status == SlaStatus.BREACHED and 
              not sla_tracking.escalation_sent_at and
              sla_tracking.sla_policy.escalation_enabled):
            escalation_type = (EscalationType.CRITICAL_ESCALATION 
                             if sla_tracking.breach_duration_minutes > 60 
                             else EscalationType.ESCALATION)
            await self.handle_escalation(sla_tracking, escalation_type)
    
    async def _send_escalation_notification(
        self, 
        sla_tracking: WorkflowSlaTracking,
        escalation_type: EscalationType
    ):
        """Send escalation notification"""
        try:
            # Map escalation type to notification priority
            notification_priority = {
                EscalationType.WARNING: NotificationPriority.MEDIUM,
                EscalationType.ESCALATION: NotificationPriority.HIGH,
                EscalationType.CRITICAL_ESCALATION: NotificationPriority.CRITICAL
            }.get(escalation_type, NotificationPriority.MEDIUM)
            
            # Send escalation notification
            await self.notification_service._send_event_notification(
                event_type=EventType.REVIEW_STALLED,
                priority=notification_priority,
                event_data={
                    'sla_tracking_id': sla_tracking.id,
                    'review_id': sla_tracking.review_workflow_id,
                    'escalation_type': escalation_type.value,
                    'priority': sla_tracking.sla_policy.priority.value,
                    'breach_duration_minutes': sla_tracking.breach_duration_minutes,
                    'initial_response_due': sla_tracking.initial_response_due_at.isoformat(),
                    'completion_due': sla_tracking.completion_due_at.isoformat(),
                    'status': sla_tracking.status.value
                }
            )
            
        except Exception as e:
            logger.error("Failed to send escalation notification",
                        tracking_id=sla_tracking.id,
                        escalation_type=escalation_type.value,
                        error=str(e))
    
    async def _handle_auto_reassignment(self, sla_tracking: WorkflowSlaTracking):
        """Handle automatic reassignment of breached reviews"""
        try:
            db = self._get_db_session()
            
            # Get escalation recipients from SLA policy
            escalation_recipients = sla_tracking.sla_policy.escalation_recipients or []
            
            if escalation_recipients:
                # Find a suitable reassignee (simple round-robin for now)
                new_assignee = escalation_recipients[
                    sla_tracking.escalation_count % len(escalation_recipients)
                ]
                
                # Update the review workflow
                workflow = db.query(ReviewWorkflow).filter(
                    ReviewWorkflow.id == sla_tracking.review_workflow_id
                ).first()
                
                if workflow:
                    old_assignee = workflow.assignee_id
                    workflow.assignee_id = new_assignee
                    db.commit()
                    
                    logger.info("Review auto-reassigned due to SLA breach",
                              workflow_id=sla_tracking.review_workflow_id,
                              old_assignee=old_assignee,
                              new_assignee=new_assignee)
        
        except Exception as e:
            logger.error("Failed to handle auto-reassignment",
                        tracking_id=sla_tracking.id,
                        error=str(e))
        finally:
            db.close()


# Background task for SLA monitoring
async def monitor_sla_compliance():
    """Background task to monitor SLA compliance"""
    sla_service = SlaService()
    
    while True:
        try:
            logger.info("Running SLA compliance check")
            breaches = await sla_service.check_sla_breaches()
            
            if breaches:
                logger.info("SLA breaches detected", count=len(breaches))
            
        except Exception as e:
            logger.error("SLA monitoring task failed", error=str(e))
        
        # Wait 5 minutes before next check
        await asyncio.sleep(300)