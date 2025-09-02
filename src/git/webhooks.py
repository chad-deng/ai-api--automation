"""
Git Webhook Handlers
Processes Git webhook events for CI/CD pipeline integration
"""
import hashlib
import hmac
import json
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, Request
import structlog

from src.database.models import SessionLocal
from src.git.models import GitRepository, GitWebhookEvent, PullRequestStatus
from src.git.service import GitService
from src.notifications.service import NotificationService

logger = structlog.get_logger()


class GitWebhookHandler:
    """Handles Git webhook events from GitHub/GitLab"""
    
    def __init__(self):
        self.git_service = GitService()
        self.notification_service = NotificationService()
    
    async def _get_db_session(self):
        """Get database session"""
        if not SessionLocal:
            from src.database.models import init_db
            await init_db()
        return SessionLocal()
    
    def _verify_github_signature(self, payload: bytes, signature: str, secret: str) -> bool:
        """Verify GitHub webhook signature"""
        if not signature.startswith('sha256='):
            return False
        
        expected_signature = 'sha256=' + hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    
    async def process_github_webhook(
        self,
        request: Request,
        repository_id: int,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process GitHub webhook event"""
        db = await self._get_db_session()
        
        try:
            # Get repository for webhook verification
            repository = db.query(GitRepository).filter(
                GitRepository.id == repository_id
            ).first()
            
            if not repository:
                raise HTTPException(status_code=404, detail="Repository not found")
            
            # Verify webhook signature if secret is configured
            if repository.webhook_secret:
                signature = request.headers.get('x-hub-signature-256', '')
                body = await request.body()
                
                if not self._verify_github_signature(body, signature, repository.webhook_secret):
                    raise HTTPException(status_code=401, detail="Invalid signature")
            
            # Extract event information
            event_type = request.headers.get('x-github-event', 'unknown')
            delivery_id = request.headers.get('x-github-delivery', '')
            
            # Create webhook event record
            webhook_event = GitWebhookEvent(
                repository_id=repository_id,
                event_type=event_type,
                action=payload.get('action', ''),
                delivery_id=delivery_id,
                sender_id=payload.get('sender', {}).get('id', ''),
                sender_login=payload.get('sender', {}).get('login', ''),
                payload=payload,
                headers=dict(request.headers)
            )
            
            db.add(webhook_event)
            db.commit()
            db.refresh(webhook_event)
            
            # Process the event based on type
            result = await self._process_webhook_event(webhook_event, payload)
            
            # Mark as processed
            webhook_event.processed = True
            webhook_event.processed_at = datetime.now(timezone.utc)
            db.commit()
            
            logger.info("Processed GitHub webhook",
                       event_type=event_type,
                       action=payload.get('action', ''),
                       repository_id=repository_id)
            
            return result
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to process GitHub webhook",
                        error=str(e), repository_id=repository_id)
            
            if 'webhook_event' in locals():
                webhook_event.processing_error = str(e)
                db.commit()
            
            raise
        finally:
            db.close()
    
    async def _process_webhook_event(
        self,
        webhook_event: GitWebhookEvent,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process specific webhook event types"""
        event_type = webhook_event.event_type
        action = webhook_event.action
        
        if event_type == 'pull_request':
            return await self._handle_pull_request_event(webhook_event, payload)
        elif event_type == 'push':
            return await self._handle_push_event(webhook_event, payload)
        elif event_type == 'check_run' or event_type == 'check_suite':
            return await self._handle_check_event(webhook_event, payload)
        elif event_type == 'workflow_run':
            return await self._handle_workflow_run_event(webhook_event, payload)
        else:
            logger.info("Unhandled webhook event type",
                       event_type=event_type, action=action)
            return {"status": "ignored", "event_type": event_type}
    
    async def _handle_pull_request_event(
        self,
        webhook_event: GitWebhookEvent,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle pull request webhook events"""
        action = webhook_event.action
        pr_data = payload.get('pull_request', {})
        pr_number = pr_data.get('number')
        
        db = await self._get_db_session()
        
        try:
            # Find our PR record
            from src.git.models import PullRequest
            pr_record = db.query(PullRequest).filter(
                PullRequest.repository_id == webhook_event.repository_id,
                PullRequest.pr_number == pr_number
            ).first()
            
            if not pr_record:
                logger.warning("PR record not found for webhook",
                             pr_number=pr_number,
                             repository_id=webhook_event.repository_id)
                return {"status": "pr_not_found", "pr_number": pr_number}
            
            # Update PR status based on action
            status_mapping = {
                'opened': PullRequestStatus.OPEN,
                'closed': PullRequestStatus.MERGED if pr_data.get('merged') else PullRequestStatus.CLOSED,
                'merged': PullRequestStatus.MERGED,
                'synchronize': None,  # Don't change status, just update data
                'ready_for_review': PullRequestStatus.OPEN
            }
            
            if action in status_mapping and status_mapping[action]:
                pr_record.status = status_mapping[action]
            
            # Update PR data
            pr_record.title = pr_data.get('title', pr_record.title)
            pr_record.description = pr_data.get('body', pr_record.description)
            pr_record.is_draft = pr_data.get('draft', pr_record.is_draft)
            pr_record.mergeable = pr_data.get('mergeable', pr_record.mergeable)
            pr_record.updated_at = datetime.now(timezone.utc)
            
            if pr_data.get('merged_at'):
                pr_record.merged_at = datetime.fromisoformat(
                    pr_data['merged_at'].replace('Z', '+00:00')
                )
            
            if pr_data.get('closed_at'):
                pr_record.closed_at = datetime.fromisoformat(
                    pr_data['closed_at'].replace('Z', '+00:00')
                )
            
            # Update merge commit SHA
            if pr_data.get('merge_commit_sha'):
                pr_record.merge_commit_sha = pr_data['merge_commit_sha']
            
            db.commit()
            
            # Send notifications based on action
            if action == 'opened':
                await self.notification_service.notify_pr_opened(pr_record)
            elif action == 'merged':
                await self.notification_service.notify_pr_merged(pr_record)
                # Trigger post-merge actions
                await self._handle_pr_merged(pr_record)
            
            logger.info("Updated PR from webhook",
                       pr_number=pr_number,
                       action=action,
                       status=pr_record.status.value)
            
            return {
                "status": "processed",
                "action": action,
                "pr_number": pr_number,
                "pr_status": pr_record.status.value
            }
            
        finally:
            db.close()
    
    async def _handle_push_event(
        self,
        webhook_event: GitWebhookEvent,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle push webhook events"""
        ref = payload.get('ref', '')
        branch = ref.replace('refs/heads/', '') if ref.startswith('refs/heads/') else ref
        commits = payload.get('commits', [])
        
        # Check if this is a push to a branch we're tracking
        if branch.startswith('test-review/'):
            # Extract review ID from branch name
            try:
                review_id = int(branch.split('/')[1].split('-')[0])
                
                # Update commit information
                for commit_data in commits:
                    await self._record_commit_from_webhook(
                        webhook_event.repository_id,
                        review_id,
                        commit_data
                    )
                
                logger.info("Processed push to tracked branch",
                           branch=branch, review_id=review_id,
                           commit_count=len(commits))
                
            except (ValueError, IndexError):
                logger.warning("Could not parse review ID from branch", branch=branch)
        
        return {
            "status": "processed",
            "branch": branch,
            "commit_count": len(commits)
        }
    
    async def _handle_check_event(
        self,
        webhook_event: GitWebhookEvent,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle check run/suite events for CI/CD status"""
        check_run = payload.get('check_run') or payload.get('check_suite', {})
        status = check_run.get('status', '')
        conclusion = check_run.get('conclusion', '')
        
        # Find related PR
        pull_requests = check_run.get('pull_requests', [])
        
        for pr_data in pull_requests:
            pr_number = pr_data.get('number')
            if pr_number:
                await self._update_pr_check_status(
                    webhook_event.repository_id,
                    pr_number,
                    status,
                    conclusion
                )
        
        return {
            "status": "processed",
            "check_status": status,
            "conclusion": conclusion,
            "pr_count": len(pull_requests)
        }
    
    async def _handle_workflow_run_event(
        self,
        webhook_event: GitWebhookEvent,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle GitHub Actions workflow run events"""
        workflow_run = payload.get('workflow_run', {})
        status = workflow_run.get('status', '')
        conclusion = workflow_run.get('conclusion', '')
        
        # Send notification for workflow completion
        if status == 'completed':
            await self.notification_service.notify_workflow_completed(
                webhook_event.repository_id,
                workflow_run.get('name', ''),
                conclusion,
                workflow_run.get('html_url', '')
            )
        
        return {
            "status": "processed",
            "workflow_status": status,
            "conclusion": conclusion
        }
    
    async def _handle_pr_merged(self, pr_record):
        """Handle post-merge actions"""
        # Mark review as completed if not already
        from src.cli.services import ReviewService
        review_service = ReviewService()
        
        await review_service.update_review_status(
            pr_record.review_workflow_id,
            ReviewStatus.APPROVED,
            "Pull request merged successfully"
        )
        
        # Schedule branch cleanup
        await self.git_service.cleanup_merged_branches(
            pr_record.repository_id,
            days_old=0  # Cleanup immediately after merge
        )
        
        logger.info("Processed PR merge actions",
                   pr_id=pr_record.id,
                   review_id=pr_record.review_workflow_id)
    
    async def _record_commit_from_webhook(
        self,
        repository_id: int,
        review_id: int,
        commit_data: Dict[str, Any]
    ) -> None:
        """Record commit information from webhook"""
        db = await self._get_db_session()
        
        try:
            from src.git.models import PullRequest, GitCommit
            
            # Find the PR for this review
            pr_record = db.query(PullRequest).filter(
                PullRequest.repository_id == repository_id,
                PullRequest.review_workflow_id == review_id
            ).first()
            
            if not pr_record:
                return
            
            # Check if commit already recorded
            existing_commit = db.query(GitCommit).filter(
                GitCommit.sha == commit_data.get('id', '')
            ).first()
            
            if existing_commit:
                return
            
            # Create commit record
            commit_record = GitCommit(
                pull_request_id=pr_record.id,
                sha=commit_data.get('id', ''),
                message=commit_data.get('message', ''),
                author_name=commit_data.get('author', {}).get('name', ''),
                author_email=commit_data.get('author', {}).get('email', ''),
                committed_at=datetime.fromisoformat(
                    commit_data.get('timestamp', '').replace('Z', '+00:00')
                ) if commit_data.get('timestamp') else datetime.now(timezone.utc),
                additions=len(commit_data.get('added', [])),
                deletions=len(commit_data.get('removed', [])),
                files_changed=commit_data.get('added', []) + 
                            commit_data.get('removed', []) + 
                            commit_data.get('modified', [])
            )
            
            db.add(commit_record)
            db.commit()
            
        finally:
            db.close()
    
    async def _update_pr_check_status(
        self,
        repository_id: int,
        pr_number: int,
        status: str,
        conclusion: str
    ) -> None:
        """Update PR check status"""
        db = await self._get_db_session()
        
        try:
            from src.git.models import PullRequest
            
            pr_record = db.query(PullRequest).filter(
                PullRequest.repository_id == repository_id,
                PullRequest.pr_number == pr_number
            ).first()
            
            if not pr_record:
                return
            
            # Update PR metadata with check status
            if not pr_record.metadata:
                pr_record.metadata = {}
            
            if 'checks' not in pr_record.metadata:
                pr_record.metadata['checks'] = {}
            
            pr_record.metadata['checks']['status'] = status
            pr_record.metadata['checks']['conclusion'] = conclusion
            pr_record.metadata['checks']['updated_at'] = datetime.now(timezone.utc).isoformat()
            
            # Update mergeable status based on checks
            if conclusion == 'success':
                pr_record.mergeable = True
            elif conclusion in ['failure', 'cancelled', 'timed_out']:
                pr_record.mergeable = False
            
            db.commit()
            
            # Send notification if checks failed
            if conclusion in ['failure', 'cancelled', 'timed_out']:
                await self.notification_service.notify_checks_failed(pr_record)
            
        finally:
            db.close()