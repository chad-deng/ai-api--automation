"""
SLA Event Handlers
Handles events related to SLA tracking and escalation
"""
import asyncio
from datetime import datetime, timezone
from typing import Dict, Optional, Any
import structlog
from sqlalchemy.orm import Session

from src.database.models import (
    ReviewWorkflow, ReviewStatus, SessionLocal
)
from src.review.sla_service import SlaService
from src.notifications.service import NotificationService
from src.notifications.models import EventType, NotificationPriority

logger = structlog.get_logger()


class SlaEventHandler:
    """Event handler for SLA-related events in review workflows"""
    
    def __init__(self):
        self.sla_service = SlaService()
        self.notification_service = NotificationService()
    
    async def handle_review_workflow_created(self, workflow_id: int) -> bool:
        """
        Handle review workflow creation - initialize SLA tracking
        
        Args:
            workflow_id: ID of the newly created review workflow
            
        Returns:
            True if SLA tracking was initialized successfully
        """
        try:
            logger.info("Handling review workflow creation", workflow_id=workflow_id)
            
            # Initialize SLA tracking for the new workflow
            sla_tracking = await self.sla_service.initialize_sla_tracking(workflow_id)
            
            if sla_tracking:
                logger.info("SLA tracking initialized for new workflow",
                           workflow_id=workflow_id,
                           tracking_id=sla_tracking.id,
                           initial_response_due=sla_tracking.initial_response_due_at,
                           completion_due=sla_tracking.completion_due_at)
                return True
            else:
                logger.warning("Failed to initialize SLA tracking",
                             workflow_id=workflow_id)
                return False
                
        except Exception as e:
            logger.error("Error handling workflow creation",
                        workflow_id=workflow_id,
                        error=str(e))
            return False
    
    async def handle_reviewer_assigned(
        self, 
        workflow_id: int, 
        assignee_id: str, 
        assigned_by: Optional[str] = None
    ) -> bool:
        """
        Handle reviewer assignment - update SLA tracking for first response
        
        Args:
            workflow_id: ID of the review workflow
            assignee_id: ID of the assigned reviewer
            assigned_by: ID of who made the assignment
            
        Returns:
            True if SLA tracking was updated successfully
        """
        try:
            logger.info("Handling reviewer assignment",
                       workflow_id=workflow_id,
                       assignee_id=assignee_id,
                       assigned_by=assigned_by)
            
            # Update SLA tracking with first response event
            success = await self.sla_service.update_sla_tracking(
                review_workflow_id=workflow_id,
                event_type="reviewer_assigned",
                event_data={
                    'assignee_id': assignee_id,
                    'assigned_by': assigned_by,
                    'assigned_at': datetime.now(timezone.utc).isoformat()
                }
            )
            
            if success:
                logger.info("SLA tracking updated for reviewer assignment",
                           workflow_id=workflow_id,
                           assignee_id=assignee_id)
            
            return success
            
        except Exception as e:
            logger.error("Error handling reviewer assignment",
                        workflow_id=workflow_id,
                        assignee_id=assignee_id,
                        error=str(e))
            return False
    
    async def handle_first_comment(
        self, 
        workflow_id: int, 
        comment_id: int,
        author_id: str
    ) -> bool:
        """
        Handle first comment on a review - update SLA tracking
        
        Args:
            workflow_id: ID of the review workflow
            comment_id: ID of the comment
            author_id: ID of the comment author
            
        Returns:
            True if SLA tracking was updated successfully
        """
        try:
            logger.info("Handling first comment",
                       workflow_id=workflow_id,
                       comment_id=comment_id,
                       author_id=author_id)
            
            # Update SLA tracking with first response event
            success = await self.sla_service.update_sla_tracking(
                review_workflow_id=workflow_id,
                event_type="first_response",
                event_data={
                    'comment_id': comment_id,
                    'author_id': author_id,
                    'commented_at': datetime.now(timezone.utc).isoformat()
                }
            )
            
            if success:
                logger.info("SLA tracking updated for first comment",
                           workflow_id=workflow_id,
                           comment_id=comment_id,
                           author_id=author_id)
            
            return success
            
        except Exception as e:
            logger.error("Error handling first comment",
                        workflow_id=workflow_id,
                        comment_id=comment_id,
                        error=str(e))
            return False
    
    async def handle_workflow_status_change(
        self, 
        workflow_id: int, 
        old_status: ReviewStatus,
        new_status: ReviewStatus,
        changed_by: Optional[str] = None
    ) -> bool:
        """
        Handle workflow status change - update SLA tracking and handle completion
        
        Args:
            workflow_id: ID of the review workflow
            old_status: Previous status
            new_status: New status
            changed_by: ID of who changed the status
            
        Returns:
            True if SLA tracking was updated successfully
        """
        try:
            logger.info("Handling workflow status change",
                       workflow_id=workflow_id,
                       old_status=old_status.value,
                       new_status=new_status.value,
                       changed_by=changed_by)
            
            # Check if workflow is being completed
            if new_status in [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.CANCELLED]:
                success = await self.sla_service.update_sla_tracking(
                    review_workflow_id=workflow_id,
                    event_type="workflow_completed",
                    event_data={
                        'old_status': old_status.value,
                        'new_status': new_status.value,
                        'changed_by': changed_by,
                        'completed_at': datetime.now(timezone.utc).isoformat()
                    }
                )
                
                if success:
                    logger.info("SLA tracking completed for workflow",
                               workflow_id=workflow_id,
                               final_status=new_status.value)
                
                return success
            
            # For other status changes, just log
            logger.info("Workflow status changed (non-terminal)",
                       workflow_id=workflow_id,
                       old_status=old_status.value,
                       new_status=new_status.value)
            
            return True
            
        except Exception as e:
            logger.error("Error handling workflow status change",
                        workflow_id=workflow_id,
                        old_status=old_status.value,
                        new_status=new_status.value,
                        error=str(e))
            return False
    
    async def handle_sla_breach_warning(self, sla_tracking_id: int) -> bool:
        """
        Handle SLA breach warning - send notifications
        
        Args:
            sla_tracking_id: ID of the SLA tracking record
            
        Returns:
            True if warning was handled successfully
        """
        try:
            logger.info("Handling SLA breach warning", sla_tracking_id=sla_tracking_id)
            
            # The SLA service already handles sending notifications
            # This is an additional hook for custom warning logic
            
            # Could add custom logic here like:
            # - Dashboard updates
            # - Custom integrations
            # - Additional metrics collection
            
            logger.info("SLA breach warning handled", sla_tracking_id=sla_tracking_id)
            return True
            
        except Exception as e:
            logger.error("Error handling SLA breach warning",
                        sla_tracking_id=sla_tracking_id,
                        error=str(e))
            return False
    
    async def handle_sla_breach_escalation(self, sla_tracking_id: int) -> bool:
        """
        Handle SLA breach escalation - send escalation notifications
        
        Args:
            sla_tracking_id: ID of the SLA tracking record
            
        Returns:
            True if escalation was handled successfully
        """
        try:
            logger.info("Handling SLA breach escalation", sla_tracking_id=sla_tracking_id)
            
            # The SLA service already handles escalation logic
            # This is an additional hook for custom escalation actions
            
            # Could add custom logic here like:
            # - Creating incident tickets
            # - Triggering automated workflows
            # - Integration with external systems
            
            logger.info("SLA breach escalation handled", sla_tracking_id=sla_tracking_id)
            return True
            
        except Exception as e:
            logger.error("Error handling SLA breach escalation",
                        sla_tracking_id=sla_tracking_id,
                        error=str(e))
            return False
    
    async def handle_workflow_priority_change(
        self, 
        workflow_id: int, 
        old_priority: str,
        new_priority: str,
        changed_by: Optional[str] = None
    ) -> bool:
        """
        Handle workflow priority change - may need to update SLA tracking
        
        Args:
            workflow_id: ID of the review workflow
            old_priority: Previous priority level
            new_priority: New priority level
            changed_by: ID of who changed the priority
            
        Returns:
            True if handled successfully
        """
        try:
            logger.info("Handling workflow priority change",
                       workflow_id=workflow_id,
                       old_priority=old_priority,
                       new_priority=new_priority,
                       changed_by=changed_by)
            
            # Priority changes might require updating SLA deadlines
            # For now, we'll just log this event
            # In a full implementation, you might:
            # 1. Recalculate SLA deadlines based on new priority
            # 2. Update the SLA policy reference
            # 3. Send notifications about the priority change
            
            logger.info("Priority change logged (SLA deadlines unchanged)",
                       workflow_id=workflow_id,
                       new_priority=new_priority)
            
            return True
            
        except Exception as e:
            logger.error("Error handling workflow priority change",
                        workflow_id=workflow_id,
                        old_priority=old_priority,
                        new_priority=new_priority,
                        error=str(e))
            return False


# Event dispatcher class to route events to appropriate handlers
class SlaEventDispatcher:
    """Dispatcher for routing SLA-related events to appropriate handlers"""
    
    def __init__(self):
        self.handler = SlaEventHandler()
    
    async def dispatch_event(
        self, 
        event_type: str, 
        event_data: Dict[str, Any]
    ) -> bool:
        """
        Dispatch event to appropriate handler
        
        Args:
            event_type: Type of event to dispatch
            event_data: Event-specific data
            
        Returns:
            True if event was handled successfully
        """
        try:
            handlers = {
                'review_workflow_created': self._handle_workflow_created,
                'reviewer_assigned': self._handle_reviewer_assigned,
                'first_comment': self._handle_first_comment,
                'workflow_status_changed': self._handle_status_change,
                'workflow_priority_changed': self._handle_priority_change,
                'sla_breach_warning': self._handle_breach_warning,
                'sla_breach_escalation': self._handle_breach_escalation,
            }
            
            handler_func = handlers.get(event_type)
            if not handler_func:
                logger.warning("No handler found for event type", event_type=event_type)
                return False
            
            return await handler_func(event_data)
            
        except Exception as e:
            logger.error("Error dispatching SLA event",
                        event_type=event_type,
                        error=str(e))
            return False
    
    # Private handler wrapper methods
    
    async def _handle_workflow_created(self, event_data: Dict) -> bool:
        workflow_id = event_data.get('workflow_id')
        if not workflow_id:
            logger.error("Missing workflow_id in event data")
            return False
        
        return await self.handler.handle_review_workflow_created(workflow_id)
    
    async def _handle_reviewer_assigned(self, event_data: Dict) -> bool:
        workflow_id = event_data.get('workflow_id')
        assignee_id = event_data.get('assignee_id')
        assigned_by = event_data.get('assigned_by')
        
        if not workflow_id or not assignee_id:
            logger.error("Missing required fields in reviewer assignment event")
            return False
        
        return await self.handler.handle_reviewer_assigned(
            workflow_id, assignee_id, assigned_by
        )
    
    async def _handle_first_comment(self, event_data: Dict) -> bool:
        workflow_id = event_data.get('workflow_id')
        comment_id = event_data.get('comment_id')
        author_id = event_data.get('author_id')
        
        if not all([workflow_id, comment_id, author_id]):
            logger.error("Missing required fields in first comment event")
            return False
        
        return await self.handler.handle_first_comment(
            workflow_id, comment_id, author_id
        )
    
    async def _handle_status_change(self, event_data: Dict) -> bool:
        workflow_id = event_data.get('workflow_id')
        old_status_str = event_data.get('old_status')
        new_status_str = event_data.get('new_status')
        changed_by = event_data.get('changed_by')
        
        if not all([workflow_id, old_status_str, new_status_str]):
            logger.error("Missing required fields in status change event")
            return False
        
        try:
            old_status = ReviewStatus(old_status_str)
            new_status = ReviewStatus(new_status_str)
        except ValueError as e:
            logger.error("Invalid status values", error=str(e))
            return False
        
        return await self.handler.handle_workflow_status_change(
            workflow_id, old_status, new_status, changed_by
        )
    
    async def _handle_priority_change(self, event_data: Dict) -> bool:
        workflow_id = event_data.get('workflow_id')
        old_priority = event_data.get('old_priority')
        new_priority = event_data.get('new_priority')
        changed_by = event_data.get('changed_by')
        
        if not all([workflow_id, old_priority, new_priority]):
            logger.error("Missing required fields in priority change event")
            return False
        
        return await self.handler.handle_workflow_priority_change(
            workflow_id, old_priority, new_priority, changed_by
        )
    
    async def _handle_breach_warning(self, event_data: Dict) -> bool:
        sla_tracking_id = event_data.get('sla_tracking_id')
        if not sla_tracking_id:
            logger.error("Missing sla_tracking_id in breach warning event")
            return False
        
        return await self.handler.handle_sla_breach_warning(sla_tracking_id)
    
    async def _handle_breach_escalation(self, event_data: Dict) -> bool:
        sla_tracking_id = event_data.get('sla_tracking_id')
        if not sla_tracking_id:
            logger.error("Missing sla_tracking_id in breach escalation event")
            return False
        
        return await self.handler.handle_sla_breach_escalation(sla_tracking_id)


# Singleton instance for easy import
sla_event_dispatcher = SlaEventDispatcher()