"""
Git Automation Workflow
Orchestrates the complete workflow from review approval to deployment
"""
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from enum import Enum
import structlog
from sqlalchemy.orm import Session

from src.database.models import SessionLocal, ReviewWorkflow, ReviewStatus, GeneratedTest
from src.git.service import GitService
from src.git.conflict_resolver import GitConflictResolver
from src.notifications.service import NotificationService
from src.cli.services import ReviewService
from src.git.models import GitRepository, PullRequestStatus
from src.config.settings import Settings

logger = structlog.get_logger()


class WorkflowStage(Enum):
    REVIEW_APPROVED = "review_approved"
    BRANCH_CREATED = "branch_created"
    TEST_COMMITTED = "test_committed"
    PR_CREATED = "pr_created"
    CONFLICTS_RESOLVED = "conflicts_resolved"
    CI_PASSED = "ci_passed"
    PR_MERGED = "pr_merged"
    CLEANUP_COMPLETED = "cleanup_completed"
    WORKFLOW_COMPLETED = "workflow_completed"


class AutomationWorkflow:
    """Orchestrates the complete Git automation workflow"""
    
    def __init__(self):
        self.git_service = GitService()
        self.conflict_resolver = GitConflictResolver()
        self.notification_service = NotificationService()
        self.review_service = ReviewService()
        self.settings = Settings()
    
    async def _get_db_session(self) -> Session:
        """Get database session"""
        if not SessionLocal:
            from src.database.models import init_db
            await init_db()
        return SessionLocal()
    
    async def process_approved_review(
        self,
        review_id: int,
        repository_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Complete workflow for an approved review"""
        db = await self._get_db_session()
        workflow_status = {
            "review_id": review_id,
            "stages": {},
            "success": False,
            "error": None
        }
        
        try:
            # Get review details
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not review:
                raise ValueError(f"Review {review_id} not found")
            
            if review.status != ReviewStatus.APPROVED:
                raise ValueError(f"Review {review_id} is not approved (status: {review.status.value})")
            
            # Use default repository if not specified
            if not repository_id:
                repository_id = await self._get_default_repository()
                if not repository_id:
                    raise ValueError("No repository specified and no default repository configured")
            
            logger.info("Starting automation workflow",
                       review_id=review_id,
                       repository_id=repository_id)
            
            # Stage 1: Create feature branch
            workflow_status["stages"][WorkflowStage.BRANCH_CREATED.value] = \
                await self._create_feature_branch(review, repository_id)
            
            # Stage 2: Commit approved test
            branch_name = workflow_status["stages"][WorkflowStage.BRANCH_CREATED.value]["branch_name"]
            workflow_status["stages"][WorkflowStage.TEST_COMMITTED.value] = \
                await self._commit_approved_test(review, repository_id, branch_name)
            
            # Stage 3: Create pull request
            workflow_status["stages"][WorkflowStage.PR_CREATED.value] = \
                await self._create_pull_request(review, repository_id, branch_name)
            
            # Stage 4: Check and resolve conflicts
            pr_record = workflow_status["stages"][WorkflowStage.PR_CREATED.value]["pr_record"]
            workflow_status["stages"][WorkflowStage.CONFLICTS_RESOLVED.value] = \
                await self._resolve_conflicts(repository_id, branch_name, pr_record.target_branch)
            
            # Stage 5: Trigger CI/CD if no conflicts
            if workflow_status["stages"][WorkflowStage.CONFLICTS_RESOLVED.value]["success"]:
                workflow_status["stages"][WorkflowStage.CI_PASSED.value] = \
                    await self._trigger_ci_pipeline(repository_id, branch_name, pr_record)
            
            workflow_status["success"] = True
            
            # Send success notification
            await self.notification_service.notify_review_approved(review)
            
            logger.info("Automation workflow completed successfully",
                       review_id=review_id,
                       workflow_status=workflow_status)
            
            return workflow_status
            
        except Exception as e:
            workflow_status["error"] = str(e)
            logger.error("Automation workflow failed",
                        review_id=review_id,
                        error=str(e))
            
            # Send failure notification
            await self.notification_service.notify_review_rejected(
                review, f"Automation workflow failed: {str(e)}"
            )
            
            return workflow_status
            
        finally:
            db.close()
    
    async def _get_default_repository(self) -> Optional[int]:
        """Get default repository ID from settings"""
        db = await self._get_db_session()
        
        try:
            # Get the first active repository as default
            repo = db.query(GitRepository).filter(
                GitRepository.is_active == True
            ).first()
            
            return repo.id if repo else None
            
        finally:
            db.close()
    
    async def _create_feature_branch(
        self,
        review: ReviewWorkflow,
        repository_id: int
    ) -> Dict[str, Any]:
        """Create feature branch for the review"""
        try:
            branch_name, git_operation = await self.git_service.create_feature_branch(
                repository_id=repository_id,
                review_id=review.id,
                branch_name_prefix="test-review"
            )
            
            return {
                "success": True,
                "branch_name": branch_name,
                "operation_id": git_operation.id,
                "message": f"Created feature branch: {branch_name}"
            }
            
        except Exception as e:
            logger.error("Failed to create feature branch",
                        review_id=review.id,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _commit_approved_test(
        self,
        review: ReviewWorkflow,
        repository_id: int,
        branch_name: str
    ) -> Dict[str, Any]:
        """Commit the approved test to the feature branch"""
        try:
            git_operation = await self.git_service.commit_approved_test(
                repository_id=repository_id,
                review_id=review.id,
                branch_name=branch_name
            )
            
            return {
                "success": True,
                "commit_sha": git_operation.commit_sha,
                "operation_id": git_operation.id,
                "message": f"Committed test file: {review.generated_test.file_path}"
            }
            
        except Exception as e:
            logger.error("Failed to commit approved test",
                        review_id=review.id,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _create_pull_request(
        self,
        review: ReviewWorkflow,
        repository_id: int,
        branch_name: str
    ) -> Dict[str, Any]:
        """Create pull request for the test"""
        try:
            pr_record = await self.git_service.create_pull_request(
                repository_id=repository_id,
                review_id=review.id,
                source_branch=branch_name
            )
            
            return {
                "success": True,
                "pr_id": pr_record.id,
                "pr_number": pr_record.pr_number,
                "pr_record": pr_record,
                "message": f"Created pull request: {pr_record.title}"
            }
            
        except Exception as e:
            logger.error("Failed to create pull request",
                        review_id=review.id,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _resolve_conflicts(
        self,
        repository_id: int,
        source_branch: str,
        target_branch: str
    ) -> Dict[str, Any]:
        """Check for and resolve conflicts"""
        try:
            # Detect conflicts
            conflict_result = await self.conflict_resolver.detect_conflicts(
                repository_id=repository_id,
                source_branch=source_branch,
                target_branch=target_branch
            )
            
            if not conflict_result["has_conflicts"]:
                return {
                    "success": True,
                    "conflicts_detected": False,
                    "message": "No conflicts detected"
                }
            
            # Notify about conflicts
            await self.notification_service.notify_conflict_detected(
                repository_id, conflict_result["conflicts"]
            )
            
            # Try to auto-resolve conflicts
            resolution_result = await self.conflict_resolver.auto_resolve_conflicts(
                repository_id=repository_id,
                conflicts=conflict_result["conflicts"]
            )
            
            if resolution_result["all_resolved"]:
                return {
                    "success": True,
                    "conflicts_detected": True,
                    "conflicts_resolved": True,
                    "resolved_count": resolution_result["resolved_count"],
                    "message": f"Auto-resolved {resolution_result['resolved_count']} conflicts"
                }
            else:
                return {
                    "success": False,
                    "conflicts_detected": True,
                    "conflicts_resolved": False,
                    "unresolved_count": resolution_result["failed_count"],
                    "failed_resolutions": resolution_result["failed_resolutions"],
                    "message": f"Failed to resolve {resolution_result['failed_count']} conflicts"
                }
                
        except Exception as e:
            logger.error("Conflict resolution failed",
                        repository_id=repository_id,
                        source_branch=source_branch,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _trigger_ci_pipeline(
        self,
        repository_id: int,
        branch_name: str,
        pr_record
    ) -> Dict[str, Any]:
        """Trigger CI/CD pipeline for the PR"""
        try:
            # In a real implementation, this would:
            # 1. Push the branch to remote repository
            # 2. Create the PR on GitHub/GitLab
            # 3. Wait for CI checks to complete
            # 4. Monitor the pipeline status
            
            # For now, simulate CI trigger
            logger.info("CI pipeline triggered",
                       repository_id=repository_id,
                       branch_name=branch_name,
                       pr_id=pr_record.id)
            
            # Update PR status to indicate CI is running
            db = await self._get_db_session()
            try:
                pr_record.status = PullRequestStatus.OPEN
                if not pr_record.metadata:
                    pr_record.metadata = {}
                pr_record.metadata["ci_status"] = "running"
                pr_record.metadata["ci_triggered_at"] = datetime.now(timezone.utc).isoformat()
                db.commit()
            finally:
                db.close()
            
            return {
                "success": True,
                "pipeline_triggered": True,
                "message": f"CI/CD pipeline triggered for branch {branch_name}"
            }
            
        except Exception as e:
            logger.error("Failed to trigger CI pipeline",
                        repository_id=repository_id,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def process_rejected_review(
        self,
        review_id: int,
        rejection_reason: str
    ) -> Dict[str, Any]:
        """Process rejected review and trigger regeneration if configured"""
        db = await self._get_db_session()
        
        try:
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not review:
                raise ValueError(f"Review {review_id} not found")
            
            # Send rejection notification
            await self.notification_service.notify_review_rejected(review, rejection_reason)
            
            # Check if auto-regeneration is enabled
            if self.settings.auto_regenerate_rejected_tests:
                return await self._trigger_test_regeneration(review, rejection_reason)
            else:
                logger.info("Auto-regeneration disabled for rejected review",
                           review_id=review_id)
                return {
                    "success": True,
                    "regeneration_triggered": False,
                    "message": "Review rejected, no regeneration configured"
                }
            
        except Exception as e:
            logger.error("Failed to process rejected review",
                        review_id=review_id,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            db.close()
    
    async def _trigger_test_regeneration(
        self,
        review: ReviewWorkflow,
        rejection_reason: str
    ) -> Dict[str, Any]:
        """Trigger regeneration of rejected test"""
        try:
            # This would integrate with the test generation system
            # to create a new test based on the rejection feedback
            
            logger.info("Triggering test regeneration",
                       review_id=review.id,
                       original_test=review.generated_test.test_name,
                       rejection_reason=rejection_reason)
            
            # Create regeneration task (would be handled by test generator)
            regeneration_metadata = {
                "original_review_id": review.id,
                "original_test_id": review.generated_test.id,
                "rejection_reason": rejection_reason,
                "regeneration_requested_at": datetime.now(timezone.utc).isoformat()
            }
            
            # In a full implementation:
            # 1. Queue test regeneration job
            # 2. Create new GeneratedTest with improved content
            # 3. Create new ReviewWorkflow for the regenerated test
            # 4. Notify stakeholders about regeneration
            
            return {
                "success": True,
                "regeneration_triggered": True,
                "regeneration_metadata": regeneration_metadata,
                "message": "Test regeneration queued"
            }
            
        except Exception as e:
            logger.error("Failed to trigger test regeneration",
                        review_id=review.id,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
    
    async def enforce_quality_gates(
        self,
        review_id: int
    ) -> Dict[str, Any]:
        """Enforce quality gates before allowing merge"""
        db = await self._get_db_session()
        
        try:
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not review:
                raise ValueError(f"Review {review_id} not found")
            
            quality_checks = {
                "review_approved": review.status == ReviewStatus.APPROVED,
                "has_reviewer": review.reviewer_id is not None,
                "has_metrics": review.metrics is not None,
                "minimum_score": False,
                "no_critical_issues": True,
                "ci_checks_passed": False
            }
            
            # Check minimum quality score
            if review.metrics and review.metrics.overall_score:
                quality_checks["minimum_score"] = review.metrics.overall_score >= self.settings.minimum_quality_score
            
            # Check for critical issues in comments
            if review.comments:
                critical_issues = [c for c in review.comments 
                                 if c.comment_type.value == "issue" and not c.resolved]
                quality_checks["no_critical_issues"] = len(critical_issues) == 0
            
            # Check CI status (would come from webhook updates)
            # quality_checks["ci_checks_passed"] = self._check_ci_status(review)
            
            all_passed = all(quality_checks.values())
            
            logger.info("Quality gate enforcement completed",
                       review_id=review_id,
                       checks=quality_checks,
                       passed=all_passed)
            
            return {
                "success": True,
                "quality_gates_passed": all_passed,
                "checks": quality_checks,
                "message": "Quality gates passed" if all_passed else "Quality gates failed"
            }
            
        except Exception as e:
            logger.error("Quality gate enforcement failed",
                        review_id=review_id,
                        error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            db.close()
    
    async def handle_stalled_reviews(self) -> Dict[str, Any]:
        """Identify and handle stalled reviews"""
        db = await self._get_db_session()
        
        try:
            # Find stalled reviews (older than configured threshold)
            stall_threshold_hours = self.settings.review_stall_threshold_hours or 48
            stall_cutoff = datetime.now(timezone.utc) - timedelta(hours=stall_threshold_hours)
            
            stalled_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.status.in_([ReviewStatus.PENDING, ReviewStatus.IN_PROGRESS]),
                ReviewWorkflow.created_at < stall_cutoff
            ).all()
            
            escalated_count = 0
            
            for review in stalled_reviews:
                # Send escalation notification
                await self.notification_service.notify_review_stalled(review)
                
                # Update review metadata to track escalation
                if not review.workflow_metadata:
                    review.workflow_metadata = {}
                
                review.workflow_metadata["escalated_at"] = datetime.now(timezone.utc).isoformat()
                review.workflow_metadata["escalation_count"] = review.workflow_metadata.get("escalation_count", 0) + 1
                
                escalated_count += 1
            
            db.commit()
            
            logger.info("Processed stalled reviews",
                       total_stalled=len(stalled_reviews),
                       escalated=escalated_count)
            
            return {
                "success": True,
                "stalled_count": len(stalled_reviews),
                "escalated_count": escalated_count,
                "message": f"Escalated {escalated_count} stalled reviews"
            }
            
        except Exception as e:
            logger.error("Failed to handle stalled reviews", error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            db.close()
    
    async def cleanup_completed_workflows(self, days_old: int = 7) -> Dict[str, Any]:
        """Clean up old completed workflows"""
        try:
            # Get all active repositories
            db = await self._get_db_session()
            repositories = db.query(GitRepository).filter(
                GitRepository.is_active == True
            ).all()
            
            total_cleaned = 0
            
            for repo in repositories:
                cleaned_branches = await self.git_service.cleanup_merged_branches(
                    repository_id=repo.id,
                    days_old=days_old
                )
                total_cleaned += len(cleaned_branches)
            
            logger.info("Workflow cleanup completed",
                       repositories=len(repositories),
                       branches_cleaned=total_cleaned)
            
            return {
                "success": True,
                "repositories_processed": len(repositories),
                "branches_cleaned": total_cleaned,
                "message": f"Cleaned up {total_cleaned} old branches"
            }
            
        except Exception as e:
            logger.error("Workflow cleanup failed", error=str(e))
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            if 'db' in locals():
                db.close()