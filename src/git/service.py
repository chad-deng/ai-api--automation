"""
Git Integration Service
Core service for managing Git operations in the test automation workflow
"""
import os
import git
import subprocess
import re
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
from pathlib import Path
import structlog
from sqlalchemy.orm import Session

from src.config.settings import Settings
from src.database.models import SessionLocal, ReviewWorkflow, ReviewStatus
from src.git.models import (
    GitRepository, GitOperation, PullRequest, GitCommit,
    GitOperationType, GitOperationStatus, PullRequestStatus
)
from src.utils.error_handling import handle_service_error

logger = structlog.get_logger()


class GitService:
    """Core Git operations service"""
    
    def __init__(self):
        self.settings = Settings()
        self._ensure_git_config()
    
    def _ensure_git_config(self):
        """Ensure Git is properly configured"""
        try:
            # Set global Git config for automated commits
            subprocess.run([
                'git', 'config', '--global', 'user.name', 
                self.settings.git_author_name or 'AI Test Automation'
            ], check=True, capture_output=True)
            
            subprocess.run([
                'git', 'config', '--global', 'user.email',
                self.settings.git_author_email or 'automation@company.com'
            ], check=True, capture_output=True)
            
            logger.info("Git configuration ensured")
            
        except subprocess.CalledProcessError as e:
            logger.warning("Failed to set Git config", error=str(e))
    
    async def _get_db_session(self) -> Session:
        """Get database session"""
        if not SessionLocal:
            from src.database.models import init_db
            await init_db()
        return SessionLocal()
    
    async def create_repository_entry(
        self,
        name: str,
        remote_url: str,
        local_path: Optional[str] = None,
        default_branch: str = "main",
        github_token: Optional[str] = None
    ) -> GitRepository:
        """Create a new repository entry in the database"""
        db = await self._get_db_session()
        
        try:
            repo = GitRepository(
                name=name,
                remote_url=remote_url,
                local_path=local_path,
                default_branch=default_branch,
                github_token=github_token
            )
            
            db.add(repo)
            db.commit()
            db.refresh(repo)
            
            logger.info("Created repository entry", name=name, remote_url=remote_url)
            return repo
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to create repository entry", error=str(e))
            raise
        finally:
            db.close()
    
    async def get_repository(self, repo_id: int) -> Optional[GitRepository]:
        """Get repository by ID"""
        db = await self._get_db_session()
        
        try:
            repo = db.query(GitRepository).filter(GitRepository.id == repo_id).first()
            return repo
        finally:
            db.close()
    
    def _get_repo_instance(self, repo_path: str) -> git.Repo:
        """Get GitPython repository instance"""
        try:
            if not os.path.exists(repo_path):
                raise ValueError(f"Repository path does not exist: {repo_path}")
            
            repo = git.Repo(repo_path)
            if repo.bare:
                raise ValueError(f"Repository is bare: {repo_path}")
            
            return repo
            
        except git.InvalidGitRepositoryError:
            raise ValueError(f"Invalid Git repository: {repo_path}")
    
    def _sanitize_branch_name(self, name: str) -> str:
        """Sanitize branch name to follow Git conventions"""
        # Remove/replace invalid characters
        sanitized = re.sub(r'[^a-zA-Z0-9\-_/]', '-', name)
        # Remove multiple consecutive dashes
        sanitized = re.sub(r'-+', '-', sanitized)
        # Remove leading/trailing dashes
        sanitized = sanitized.strip('-')
        # Limit length
        return sanitized[:100].lower()
    
    async def create_feature_branch(
        self,
        repository_id: int,
        review_id: int,
        branch_name_prefix: str = "test-review"
    ) -> Tuple[str, GitOperation]:
        """Create a feature branch for an approved test review"""
        db = await self._get_db_session()
        
        try:
            # Get repository and review
            repo_entry = await self.get_repository(repository_id)
            if not repo_entry or not repo_entry.local_path:
                raise ValueError(f"Repository {repository_id} not found or no local path")
            
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            if not review:
                raise ValueError(f"Review {review_id} not found")
            
            # Create branch name
            sanitized_title = self._sanitize_branch_name(review.title)
            branch_name = f"{branch_name_prefix}/{review_id}-{sanitized_title}"
            
            # Create Git operation record
            git_op = GitOperation(
                repository_id=repository_id,
                review_workflow_id=review_id,
                operation_type=GitOperationType.BRANCH_CREATE,
                status=GitOperationStatus.IN_PROGRESS,
                branch_name=branch_name,
                triggered_by="system"
            )
            db.add(git_op)
            db.commit()
            db.refresh(git_op)
            
            git_op.started_at = datetime.now(timezone.utc)
            
            try:
                # Perform Git operations
                repo = self._get_repo_instance(repo_entry.local_path)
                
                # Ensure we're on default branch and up-to-date
                repo.git.checkout(repo_entry.default_branch)
                repo.git.pull()
                
                # Create and checkout new branch
                new_branch = repo.create_head(branch_name)
                new_branch.checkout()
                
                # Update operation record
                git_op.status = GitOperationStatus.COMPLETED
                git_op.completed_at = datetime.now(timezone.utc)
                git_op.output = f"Successfully created branch: {branch_name}"
                
                db.commit()
                
                logger.info("Created feature branch", 
                           branch_name=branch_name, 
                           review_id=review_id)
                
                return branch_name, git_op
                
            except Exception as git_error:
                git_op.status = GitOperationStatus.FAILED
                git_op.error_message = str(git_error)
                git_op.completed_at = datetime.now(timezone.utc)
                db.commit()
                raise
                
        except Exception as e:
            db.rollback()
            logger.error("Failed to create feature branch", 
                        error=str(e), review_id=review_id)
            raise
        finally:
            db.close()
    
    async def commit_approved_test(
        self,
        repository_id: int,
        review_id: int,
        branch_name: str,
        commit_message: Optional[str] = None
    ) -> GitOperation:
        """Commit approved test to the feature branch"""
        db = await self._get_db_session()
        
        try:
            # Get repository and review
            repo_entry = await self.get_repository(repository_id)
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not repo_entry or not review or not review.generated_test:
                raise ValueError("Missing required data for commit operation")
            
            # Create commit message if not provided
            if not commit_message:
                commit_message = self._generate_commit_message(review)
            
            # Create Git operation record
            git_op = GitOperation(
                repository_id=repository_id,
                review_workflow_id=review_id,
                operation_type=GitOperationType.COMMIT,
                status=GitOperationStatus.IN_PROGRESS,
                branch_name=branch_name,
                triggered_by="system"
            )
            db.add(git_op)
            db.commit()
            db.refresh(git_op)
            
            git_op.started_at = datetime.now(timezone.utc)
            
            try:
                repo = self._get_repo_instance(repo_entry.local_path)
                
                # Ensure we're on the correct branch
                repo.git.checkout(branch_name)
                
                # Write test file
                test_file_path = os.path.join(
                    repo_entry.local_path,
                    review.generated_test.file_path
                )
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(test_file_path), exist_ok=True)
                
                # Write test content
                with open(test_file_path, 'w') as f:
                    f.write(review.generated_test.test_content)
                
                # Stage and commit
                repo.git.add(test_file_path)
                commit = repo.index.commit(commit_message)
                
                # Update operation record
                git_op.status = GitOperationStatus.COMPLETED
                git_op.commit_sha = commit.hexsha
                git_op.completed_at = datetime.now(timezone.utc)
                git_op.output = f"Committed test file: {review.generated_test.file_path}"
                
                db.commit()
                
                logger.info("Committed approved test",
                           commit_sha=commit.hexsha,
                           branch_name=branch_name,
                           review_id=review_id)
                
                return git_op
                
            except Exception as git_error:
                git_op.status = GitOperationStatus.FAILED
                git_op.error_message = str(git_error)
                git_op.completed_at = datetime.now(timezone.utc)
                db.commit()
                raise
                
        except Exception as e:
            db.rollback()
            logger.error("Failed to commit approved test",
                        error=str(e), review_id=review_id)
            raise
        finally:
            db.close()
    
    def _generate_commit_message(self, review: ReviewWorkflow) -> str:
        """Generate standardized commit message"""
        # Follow conventional commit format
        test_name = review.generated_test.test_name
        
        commit_msg = f"test: add {test_name}\n\n"
        commit_msg += f"- Generated test for review #{review.id}\n"
        commit_msg += f"- Test file: {review.generated_test.file_path}\n"
        
        if review.description:
            commit_msg += f"- Description: {review.description}\n"
        
        commit_msg += f"- Status: {review.status.value}\n"
        commit_msg += f"- Priority: {review.priority.value}\n"
        
        if review.assignee_id:
            commit_msg += f"- Assignee: {review.assignee_id}\n"
        
        if review.reviewer_id:
            commit_msg += f"- Reviewer: {review.reviewer_id}\n"
        
        # Add review metrics if available
        if review.metrics:
            commit_msg += f"- Review completion time: {review.metrics.time_to_completion_minutes}min\n"
            if review.metrics.overall_score:
                commit_msg += f"- Quality score: {review.metrics.overall_score}/10\n"
        
        return commit_msg
    
    async def create_pull_request(
        self,
        repository_id: int,
        review_id: int,
        source_branch: str,
        target_branch: Optional[str] = None,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> PullRequest:
        """Create a pull request for the test"""
        db = await self._get_db_session()
        
        try:
            repo_entry = await self.get_repository(repository_id)
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not repo_entry or not review:
                raise ValueError("Missing required data for PR creation")
            
            target_branch = target_branch or repo_entry.default_branch
            
            # Generate PR title and description
            if not title:
                title = f"Add automated test: {review.generated_test.test_name}"
            
            if not description:
                description = self._generate_pr_description(review)
            
            # Create PR record
            pr = PullRequest(
                repository_id=repository_id,
                review_workflow_id=review_id,
                pr_number=0,  # Will be updated when created on remote
                title=title,
                description=description,
                source_branch=source_branch,
                target_branch=target_branch,
                status=PullRequestStatus.DRAFT,
                author_id="automation-system",
                is_draft=True
            )
            
            db.add(pr)
            db.commit()
            db.refresh(pr)
            
            # Create Git operation for PR creation
            git_op = GitOperation(
                repository_id=repository_id,
                review_workflow_id=review_id,
                operation_type=GitOperationType.PR_CREATE,
                status=GitOperationStatus.COMPLETED,
                branch_name=source_branch,
                pr_number=pr.id,  # Internal PR ID
                triggered_by="system",
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc)
            )
            
            db.add(git_op)
            db.commit()
            
            logger.info("Created pull request record",
                       pr_id=pr.id,
                       source_branch=source_branch,
                       target_branch=target_branch,
                       review_id=review_id)
            
            return pr
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to create pull request",
                        error=str(e), review_id=review_id)
            raise
        finally:
            db.close()
    
    def _generate_pr_description(self, review: ReviewWorkflow) -> str:
        """Generate PR description with review metadata"""
        description = f"""## Automated Test Addition

### Review Details
- **Review ID**: #{review.id}
- **Test Name**: {review.generated_test.test_name}
- **File Path**: {review.generated_test.file_path}
- **Status**: {review.status.value}
- **Priority**: {review.priority.value}

### Description
{review.description or 'No description provided'}

### Test Details
- **Generated At**: {review.generated_test.created_at.strftime('%Y-%m-%d %H:%M:%S')}
- **Webhook Event**: {review.generated_test.webhook_event_id}

### Review Process
- **Created**: {review.created_at.strftime('%Y-%m-%d %H:%M:%S')}
- **Updated**: {review.updated_at.strftime('%Y-%m-%d %H:%M:%S')}
"""

        if review.assignee_id:
            description += f"- **Assignee**: {review.assignee_id}\n"
        
        if review.reviewer_id:
            description += f"- **Reviewer**: {review.reviewer_id}\n"
        
        if review.started_at:
            description += f"- **Started**: {review.started_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
        
        if review.completed_at:
            description += f"- **Completed**: {review.completed_at.strftime('%Y-%m-%d %H:%M:%S')}\n"

        # Add metrics if available
        if review.metrics:
            description += f"\n### Quality Metrics\n"
            if review.metrics.time_to_completion_minutes:
                description += f"- **Review Time**: {review.metrics.time_to_completion_minutes} minutes\n"
            if review.metrics.total_comments:
                description += f"- **Total Comments**: {review.metrics.total_comments}\n"
            if review.metrics.issues_found:
                description += f"- **Issues Found**: {review.metrics.issues_found}\n"
            if review.metrics.suggestions_made:
                description += f"- **Suggestions Made**: {review.metrics.suggestions_made}\n"
            if review.metrics.overall_score:
                description += f"- **Quality Score**: {review.metrics.overall_score}/10\n"

        # Add comments summary
        if review.comments:
            description += f"\n### Review Comments ({len(review.comments)})\n"
            for comment in review.comments[-5:]:  # Last 5 comments
                description += f"- **{comment.comment_type.value.title()}** by {comment.author_id}: {comment.content[:100]}{'...' if len(comment.content) > 100 else ''}\n"

        description += f"\n---\n*This PR was generated automatically by the AI API Test Automation system.*"
        
        return description
    
    async def get_git_operations(
        self,
        repository_id: Optional[int] = None,
        review_id: Optional[int] = None,
        operation_type: Optional[GitOperationType] = None,
        status: Optional[GitOperationStatus] = None,
        limit: int = 50
    ) -> List[GitOperation]:
        """Get Git operations with filtering"""
        db = await self._get_db_session()
        
        try:
            query = db.query(GitOperation)
            
            if repository_id:
                query = query.filter(GitOperation.repository_id == repository_id)
            
            if review_id:
                query = query.filter(GitOperation.review_workflow_id == review_id)
            
            if operation_type:
                query = query.filter(GitOperation.operation_type == operation_type)
            
            if status:
                query = query.filter(GitOperation.status == status)
            
            operations = query.order_by(
                GitOperation.created_at.desc()
            ).limit(limit).all()
            
            return operations
            
        finally:
            db.close()
    
    async def cleanup_merged_branches(
        self,
        repository_id: int,
        days_old: int = 7
    ) -> List[str]:
        """Clean up merged branches older than specified days"""
        db = await self._get_db_session()
        cleaned_branches = []
        
        try:
            repo_entry = await self.get_repository(repository_id)
            if not repo_entry or not repo_entry.local_path:
                return cleaned_branches
            
            repo = self._get_repo_instance(repo_entry.local_path)
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
            
            # Get merged PRs older than cutoff
            merged_prs = db.query(PullRequest).filter(
                PullRequest.repository_id == repository_id,
                PullRequest.status == PullRequestStatus.MERGED,
                PullRequest.merged_at < cutoff_date
            ).all()
            
            for pr in merged_prs:
                try:
                    # Check if branch exists
                    if pr.source_branch in [b.name for b in repo.branches]:
                        repo.git.branch('-d', pr.source_branch)
                        cleaned_branches.append(pr.source_branch)
                        
                        # Log the operation
                        git_op = GitOperation(
                            repository_id=repository_id,
                            review_workflow_id=pr.review_workflow_id,
                            operation_type=GitOperationType.BRANCH_DELETE,
                            status=GitOperationStatus.COMPLETED,
                            branch_name=pr.source_branch,
                            triggered_by="system-cleanup",
                            started_at=datetime.now(timezone.utc),
                            completed_at=datetime.now(timezone.utc),
                            output=f"Cleaned up merged branch: {pr.source_branch}"
                        )
                        db.add(git_op)
                        
                except Exception as e:
                    logger.warning("Failed to delete branch",
                                 branch=pr.source_branch, error=str(e))
            
            db.commit()
            
            if cleaned_branches:
                logger.info("Cleaned up merged branches",
                           count=len(cleaned_branches),
                           branches=cleaned_branches)
            
            return cleaned_branches
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to cleanup branches", error=str(e))
            raise
        finally:
            db.close()