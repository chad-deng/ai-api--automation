"""
Notification Service
Handles sending notifications via email, Slack, and dashboard updates
"""
import asyncio
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import aiohttp
import structlog
from jinja2 import Template
from sqlalchemy.orm import Session

from src.config.settings import Settings
from src.database.models import SessionLocal
from src.notifications.models import (
    NotificationChannel, NotificationTemplate, Notification,
    NotificationLog, NotificationPreference, NotificationType,
    NotificationStatus, NotificationPriority, EventType
)

logger = structlog.get_logger()


class NotificationService:
    """Service for managing all notification types"""
    
    def __init__(self):
        self.settings = Settings()
    
    async def _get_db_session(self) -> Session:
        """Get database session"""
        if not SessionLocal:
            from src.database.models import init_db
            await init_db()
        return SessionLocal()
    
    async def notify_pr_opened(self, pr_record) -> None:
        """Send notification when PR is opened"""
        await self._send_event_notification(
            event_type=EventType.PR_OPENED,
            priority=NotificationPriority.MEDIUM,
            event_data={
                "pr_number": pr_record.pr_number,
                "pr_title": pr_record.title,
                "pr_url": pr_record.pr_url,
                "author": pr_record.author_id,
                "repository": pr_record.repository.name,
                "source_branch": pr_record.source_branch,
                "target_branch": pr_record.target_branch,
                "review_id": pr_record.review_workflow_id
            }
        )
    
    async def notify_pr_merged(self, pr_record) -> None:
        """Send notification when PR is merged"""
        await self._send_event_notification(
            event_type=EventType.PR_MERGED,
            priority=NotificationPriority.HIGH,
            event_data={
                "pr_number": pr_record.pr_number,
                "pr_title": pr_record.title,
                "pr_url": pr_record.pr_url,
                "author": pr_record.author_id,
                "repository": pr_record.repository.name,
                "merged_at": pr_record.merged_at.isoformat() if pr_record.merged_at else None,
                "review_id": pr_record.review_workflow_id
            }
        )
    
    async def notify_checks_failed(self, pr_record) -> None:
        """Send notification when CI checks fail"""
        await self._send_event_notification(
            event_type=EventType.CHECKS_FAILED,
            priority=NotificationPriority.HIGH,
            event_data={
                "pr_number": pr_record.pr_number,
                "pr_title": pr_record.title,
                "pr_url": pr_record.pr_url,
                "repository": pr_record.repository.name,
                "check_status": pr_record.metadata.get('checks', {}) if pr_record.metadata else {},
                "review_id": pr_record.review_workflow_id
            }
        )
    
    async def notify_workflow_completed(
        self,
        repository_id: int,
        workflow_name: str,
        conclusion: str,
        workflow_url: str
    ) -> None:
        """Send notification when GitHub Actions workflow completes"""
        await self._send_event_notification(
            event_type=EventType.WORKFLOW_COMPLETED,
            priority=NotificationPriority.HIGH if conclusion != "success" else NotificationPriority.MEDIUM,
            event_data={
                "workflow_name": workflow_name,
                "conclusion": conclusion,
                "workflow_url": workflow_url,
                "repository_id": repository_id,
                "status": "success" if conclusion == "success" else "failed"
            }
        )
    
    async def notify_review_approved(self, review_record) -> None:
        """Send notification when review is approved"""
        await self._send_event_notification(
            event_type=EventType.REVIEW_APPROVED,
            priority=NotificationPriority.HIGH,
            event_data={
                "review_id": review_record.id,
                "review_title": review_record.title,
                "test_name": review_record.generated_test.test_name if review_record.generated_test else None,
                "assignee": review_record.assignee_id,
                "reviewer": review_record.reviewer_id,
                "completed_at": review_record.completed_at.isoformat() if review_record.completed_at else None
            }
        )
    
    async def notify_review_rejected(self, review_record, reason: str = None) -> None:
        """Send notification when review is rejected"""
        await self._send_event_notification(
            event_type=EventType.REVIEW_REJECTED,
            priority=NotificationPriority.HIGH,
            event_data={
                "review_id": review_record.id,
                "review_title": review_record.title,
                "test_name": review_record.generated_test.test_name if review_record.generated_test else None,
                "assignee": review_record.assignee_id,
                "reviewer": review_record.reviewer_id,
                "rejection_reason": reason,
                "completed_at": review_record.completed_at.isoformat() if review_record.completed_at else None
            }
        )
    
    async def notify_review_stalled(self, review_record) -> None:
        """Send escalation notification for stalled reviews"""
        await self._send_event_notification(
            event_type=EventType.REVIEW_STALLED,
            priority=NotificationPriority.CRITICAL,
            event_data={
                "review_id": review_record.id,
                "review_title": review_record.title,
                "assignee": review_record.assignee_id,
                "reviewer": review_record.reviewer_id,
                "created_at": review_record.created_at.isoformat(),
                "due_date": review_record.due_date.isoformat() if review_record.due_date else None,
                "days_stalled": (datetime.now(timezone.utc) - review_record.created_at).days
            }
        )
    
    async def notify_conflict_detected(self, repository_id: int, conflicts: List[Dict]) -> None:
        """Send notification when Git conflicts are detected"""
        await self._send_event_notification(
            event_type=EventType.CONFLICT_DETECTED,
            priority=NotificationPriority.HIGH,
            event_data={
                "repository_id": repository_id,
                "conflict_count": len(conflicts),
                "conflicts": conflicts,
                "auto_resolvable": sum(1 for c in conflicts if c.get('auto_resolvable', False))
            }
        )
    
    async def _send_event_notification(
        self,
        event_type: EventType,
        priority: NotificationPriority,
        event_data: Dict[str, Any],
        event_id: Optional[str] = None
    ) -> None:
        """Send notifications for an event to all configured channels"""
        db = await self._get_db_session()
        
        try:
            # Get active channels for this event type
            channels = db.query(NotificationChannel).filter(
                NotificationChannel.is_active == True
            ).all()
            
            notification_tasks = []
            
            for channel in channels:
                # Check if channel handles this event type
                if not self._channel_handles_event(channel, event_type, priority):
                    continue
                
                # Check rate limits
                if not await self._check_rate_limits(channel):
                    logger.warning("Rate limit exceeded for channel",
                                 channel_id=channel.id, channel_name=channel.name)
                    continue
                
                # Create notification
                notification = await self._create_notification(
                    channel, event_type, priority, event_data, event_id
                )
                
                if notification:
                    # Schedule sending
                    task = asyncio.create_task(
                        self._send_notification(notification)
                    )
                    notification_tasks.append(task)
            
            # Wait for all notifications to be sent
            if notification_tasks:
                await asyncio.gather(*notification_tasks, return_exceptions=True)
            
        finally:
            db.close()
    
    def _channel_handles_event(
        self,
        channel: NotificationChannel,
        event_type: EventType,
        priority: NotificationPriority
    ) -> bool:
        """Check if channel should handle this event"""
        # Check event type filter
        if channel.event_types:
            if event_type.value not in channel.event_types:
                return False
        
        # Check priority threshold
        priority_levels = {
            NotificationPriority.LOW: 1,
            NotificationPriority.MEDIUM: 2,
            NotificationPriority.HIGH: 3,
            NotificationPriority.CRITICAL: 4
        }
        
        if priority_levels[priority] < priority_levels[channel.priority_threshold]:
            return False
        
        return True
    
    async def _check_rate_limits(self, channel: NotificationChannel) -> bool:
        """Check if channel has exceeded rate limits"""
        db = await self._get_db_session()
        
        try:
            now = datetime.now(timezone.utc)
            hour_ago = now - timedelta(hours=1)
            day_ago = now - timedelta(days=1)
            
            # Count recent notifications
            hourly_count = db.query(Notification).filter(
                Notification.channel_id == channel.id,
                Notification.created_at >= hour_ago,
                Notification.status.in_([NotificationStatus.SENT, NotificationStatus.PENDING])
            ).count()
            
            daily_count = db.query(Notification).filter(
                Notification.channel_id == channel.id,
                Notification.created_at >= day_ago,
                Notification.status.in_([NotificationStatus.SENT, NotificationStatus.PENDING])
            ).count()
            
            return (hourly_count < channel.rate_limit_per_hour and 
                   daily_count < channel.rate_limit_per_day)
                   
        finally:
            db.close()
    
    async def _create_notification(
        self,
        channel: NotificationChannel,
        event_type: EventType,
        priority: NotificationPriority,
        event_data: Dict[str, Any],
        event_id: Optional[str] = None
    ) -> Optional[Notification]:
        """Create a notification record"""
        db = await self._get_db_session()
        
        try:
            # Get template for this event and notification type
            template = db.query(NotificationTemplate).filter(
                NotificationTemplate.event_type == event_type,
                NotificationTemplate.notification_type == channel.type,
                NotificationTemplate.is_active == True
            ).first()
            
            if not template:
                logger.warning("No template found for event",
                             event_type=event_type.value,
                             notification_type=channel.type.value)
                return None
            
            # Render template
            subject, message = self._render_template(template, event_data)
            
            # Determine recipients
            recipients = self._get_recipients(channel, event_data)
            
            notification = Notification(
                channel_id=channel.id,
                event_type=event_type,
                event_id=event_id,
                priority=priority,
                recipients=recipients,
                subject=subject,
                message=message,
                metadata=event_data
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            return notification
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to create notification",
                        error=str(e), event_type=event_type.value)
            return None
        finally:
            db.close()
    
    def _render_template(
        self,
        template: NotificationTemplate,
        event_data: Dict[str, Any]
    ) -> tuple[str, str]:
        """Render notification template with event data"""
        try:
            # Add common variables
            template_vars = {
                **event_data,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'time': datetime.now(timezone.utc).strftime('%H:%M:%S'),
                'system_name': 'AI API Test Automation'
            }
            
            # Render subject
            subject = ""
            if template.subject_template:
                subject_template = Template(template.subject_template)
                subject = subject_template.render(**template_vars)
            
            # Render body
            body_template = Template(template.body_template)
            message = body_template.render(**template_vars)
            
            return subject, message
            
        except Exception as e:
            logger.error("Template rendering failed", error=str(e))
            return f"Notification: {event_data.get('event_type', 'Unknown Event')}", str(event_data)
    
    def _get_recipients(
        self,
        channel: NotificationChannel,
        event_data: Dict[str, Any]
    ) -> List[str]:
        """Determine recipients for notification"""
        recipients = []
        
        # Base recipients from channel config
        if isinstance(channel.config, dict):
            recipients.extend(channel.config.get('recipients', []))
        
        # Add event-specific recipients
        if 'assignee' in event_data and event_data['assignee']:
            recipients.append(event_data['assignee'])
        
        if 'reviewer' in event_data and event_data['reviewer']:
            recipients.append(event_data['reviewer'])
        
        if 'author' in event_data and event_data['author']:
            recipients.append(event_data['author'])
        
        # Remove duplicates
        return list(set(recipients))
    
    async def _send_notification(self, notification: Notification) -> bool:
        """Send a single notification"""
        db = await self._get_db_session()
        
        try:
            # Update attempts
            notification.attempts += 1
            db.commit()
            
            # Log attempt
            log_entry = NotificationLog(
                notification_id=notification.id,
                attempt_number=notification.attempts,
                status=NotificationStatus.PENDING
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            
            start_time = datetime.now()
            success = False
            error_message = None
            
            try:
                # Send based on channel type
                if notification.channel.type == NotificationType.EMAIL:
                    success = await self._send_email(notification)
                elif notification.channel.type == NotificationType.SLACK:
                    success = await self._send_slack(notification)
                elif notification.channel.type == NotificationType.DASHBOARD:
                    success = await self._send_dashboard_update(notification)
                elif notification.channel.type == NotificationType.WEBHOOK:
                    success = await self._send_webhook(notification)
                
            except Exception as e:
                error_message = str(e)
                logger.error("Notification sending failed",
                           notification_id=notification.id,
                           error=error_message)
            
            # Update notification and log
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            if success:
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.now(timezone.utc)
                log_entry.status = NotificationStatus.SENT
            else:
                notification.error_count += 1
                notification.last_error = error_message
                
                if notification.attempts >= notification.max_attempts:
                    notification.status = NotificationStatus.FAILED
                    notification.failed_at = datetime.now(timezone.utc)
                    log_entry.status = NotificationStatus.FAILED
                else:
                    notification.status = NotificationStatus.RETRY
                    log_entry.status = NotificationStatus.RETRY
            
            log_entry.response_time_ms = response_time
            log_entry.response_message = error_message
            
            db.commit()
            
            return success
            
        except Exception as e:
            db.rollback()
            logger.error("Notification processing failed",
                        notification_id=notification.id,
                        error=str(e))
            return False
        finally:
            db.close()
    
    async def _send_email(self, notification: Notification) -> bool:
        """Send email notification"""
        try:
            config = notification.channel.config
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = config.get('smtp_from', self.settings.smtp_from)
            msg['To'] = ', '.join(notification.recipients)
            msg['Subject'] = notification.subject or "AI API Test Automation Notification"
            
            msg.attach(MIMEText(notification.message, 'html' if '<' in notification.message else 'plain'))
            
            # Send via SMTP
            with smtplib.SMTP(
                config.get('smtp_host', self.settings.smtp_host),
                config.get('smtp_port', self.settings.smtp_port)
            ) as server:
                if config.get('smtp_tls', self.settings.smtp_tls):
                    server.starttls()
                
                if config.get('smtp_username') and config.get('smtp_password'):
                    server.login(
                        config.get('smtp_username', self.settings.smtp_username),
                        config.get('smtp_password', self.settings.smtp_password)
                    )
                
                server.send_message(msg)
            
            logger.info("Email sent successfully",
                       notification_id=notification.id,
                       recipients=notification.recipients)
            return True
            
        except Exception as e:
            logger.error("Email sending failed",
                        notification_id=notification.id,
                        error=str(e))
            return False
    
    async def _send_slack(self, notification: Notification) -> bool:
        """Send Slack notification"""
        try:
            config = notification.channel.config
            webhook_url = config.get('webhook_url')
            
            if not webhook_url:
                raise ValueError("Slack webhook URL not configured")
            
            # Prepare Slack message
            slack_message = {
                "text": notification.subject or "AI API Test Automation",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": notification.message
                        }
                    }
                ]
            }
            
            # Add metadata as fields if available
            if notification.metadata:
                fields = []
                for key, value in notification.metadata.items():
                    if isinstance(value, (str, int, float, bool)):
                        fields.append({
                            "type": "mrkdwn",
                            "text": f"*{key.replace('_', ' ').title()}:* {value}"
                        })
                
                if fields:
                    slack_message["blocks"].append({
                        "type": "section",
                        "fields": fields[:10]  # Slack limit
                    })
            
            # Send to Slack
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=slack_message,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        logger.info("Slack message sent successfully",
                                   notification_id=notification.id)
                        return True
                    else:
                        raise Exception(f"Slack API returned status {response.status}")
        
        except Exception as e:
            logger.error("Slack sending failed",
                        notification_id=notification.id,
                        error=str(e))
            return False
    
    async def _send_dashboard_update(self, notification: Notification) -> bool:
        """Send dashboard notification (websocket broadcast)"""
        try:
            # This would integrate with WebSocket connections
            # For now, we'll just log and mark as sent
            logger.info("Dashboard notification prepared",
                       notification_id=notification.id,
                       event_type=notification.event_type.value)
            
            # In a full implementation, this would:
            # 1. Broadcast to connected WebSocket clients
            # 2. Store in dashboard notification queue
            # 3. Update real-time dashboard components
            
            return True
            
        except Exception as e:
            logger.error("Dashboard notification failed",
                        notification_id=notification.id,
                        error=str(e))
            return False
    
    async def _send_webhook(self, notification: Notification) -> bool:
        """Send webhook notification"""
        try:
            config = notification.channel.config
            webhook_url = config.get('url')
            
            if not webhook_url:
                raise ValueError("Webhook URL not configured")
            
            payload = {
                "event_type": notification.event_type.value,
                "priority": notification.priority.value,
                "timestamp": notification.created_at.isoformat(),
                "subject": notification.subject,
                "message": notification.message,
                "metadata": notification.metadata
            }
            
            headers = config.get('headers', {})
            headers['Content-Type'] = 'application/json'
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if 200 <= response.status < 300:
                        logger.info("Webhook sent successfully",
                                   notification_id=notification.id,
                                   status_code=response.status)
                        return True
                    else:
                        raise Exception(f"Webhook returned status {response.status}")
        
        except Exception as e:
            logger.error("Webhook sending failed",
                        notification_id=notification.id,
                        error=str(e))
            return False
    
    async def process_notification_queue(self) -> None:
        """Process pending notifications (for background task)"""
        db = await self._get_db_session()
        
        try:
            # Get pending notifications
            pending_notifications = db.query(Notification).filter(
                Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.RETRY]),
                Notification.scheduled_at <= datetime.now(timezone.utc),
                Notification.attempts < Notification.max_attempts
            ).limit(100).all()
            
            if not pending_notifications:
                return
            
            logger.info("Processing notification queue",
                       count=len(pending_notifications))
            
            # Process notifications in parallel
            tasks = [
                self._send_notification(notification)
                for notification in pending_notifications
            ]
            
            await asyncio.gather(*tasks, return_exceptions=True)
            
        finally:
            db.close()