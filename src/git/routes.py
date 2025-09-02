"""
Git Integration FastAPI Routes
Web interface for Git operations and automation workflows
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import structlog

from src.database.models import get_db, ReviewWorkflow, ReviewStatus
from src.git.models import GitRepository, GitOperation, PullRequest, GitOperationStatus
from src.git.service import GitService
from src.git.automation import AutomationWorkflow
from src.git.conflict_resolver import GitConflictResolver
from src.git.webhooks import GitWebhookHandler
from src.notifications.service import NotificationService
from src.auth.session import get_current_user_optional

logger = structlog.get_logger()
git_router = APIRouter(prefix="/git", tags=["git"])

# Initialize services
git_service = GitService()
automation_workflow = AutomationWorkflow()
conflict_resolver = GitConflictResolver()
webhook_handler = GitWebhookHandler()
notification_service = NotificationService()

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="src/templates")

# Repository management routes
@git_router.get("/repositories", response_class=HTMLResponse)
async def list_repositories(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """List all Git repositories"""
    try:
        repositories = db.query(GitRepository).order_by(
            GitRepository.created_at.desc()
        ).all()
        
        return templates.TemplateResponse("git/repositories.html", {
            "request": request,
            "user": current_user,
            "repositories": repositories
        })
        
    except Exception as e:
        logger.error("Failed to list repositories", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load repositories")

@git_router.get("/repositories/{repository_id}", response_class=HTMLResponse)
async def repository_detail(
    request: Request,
    repository_id: int,
    db: Session = Depends(get_db)
):
    """Repository detail view with operations"""
    try:
        repository = db.query(GitRepository).filter(
            GitRepository.id == repository_id
        ).first()
        
        if not repository:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        # Get recent operations
        recent_operations = await git_service.get_git_operations(
            repository_id=repository_id,
            limit=20
        )
        
        # Get active pull requests
        active_prs = db.query(PullRequest).filter(
            PullRequest.repository_id == repository_id,
            PullRequest.status.in_(['open', 'draft'])
        ).order_by(PullRequest.created_at.desc()).all()
        
        return templates.TemplateResponse("git/repository_detail.html", {
            "request": request,
            "repository": repository,
            "recent_operations": recent_operations,
            "active_prs": active_prs
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to load repository details",
                    repository_id=repository_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load repository")

# Automation workflow routes
@git_router.post("/reviews/{review_id}/automate")
async def trigger_automation_workflow(
    review_id: int,
    repository_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """Trigger automation workflow for an approved review"""
    try:
        # Verify review exists and is approved
        review = db.query(ReviewWorkflow).filter(
            ReviewWorkflow.id == review_id
        ).first()
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        if review.status != ReviewStatus.APPROVED:
            raise HTTPException(
                status_code=400,
                detail=f"Review must be approved (current status: {review.status.value})"
            )
        
        # Trigger workflow
        result = await automation_workflow.process_approved_review(
            review_id=review_id,
            repository_id=repository_id
        )
        
        if result["success"]:
            return RedirectResponse(
                url=f"/reviews/{review_id}?automation=success",
                status_code=303
            )
        else:
            return RedirectResponse(
                url=f"/reviews/{review_id}?automation=failed&error={result.get('error', 'Unknown error')}",
                status_code=303
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to trigger automation workflow",
                    review_id=review_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@git_router.get("/api/reviews/{review_id}/automation-status")
async def get_automation_status(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get automation workflow status for a review"""
    try:
        # Get Git operations for this review
        operations = await git_service.get_git_operations(review_id=review_id)
        
        # Get associated pull requests
        prs = db.query(PullRequest).filter(
            PullRequest.review_workflow_id == review_id
        ).all()
        
        # Determine current stage
        current_stage = "not_started"
        if operations:
            if any(op.operation_type.value == "pr_create" for op in operations):
                current_stage = "pr_created"
            elif any(op.operation_type.value == "commit" for op in operations):
                current_stage = "committed"
            elif any(op.operation_type.value == "branch_create" for op in operations):
                current_stage = "branch_created"
        
        return {
            "review_id": review_id,
            "current_stage": current_stage,
            "operations": [
                {
                    "id": op.id,
                    "type": op.operation_type.value,
                    "status": op.status.value,
                    "created_at": op.created_at.isoformat(),
                    "completed_at": op.completed_at.isoformat() if op.completed_at else None,
                    "branch_name": op.branch_name,
                    "commit_sha": op.commit_sha,
                    "error_message": op.error_message
                }
                for op in operations
            ],
            "pull_requests": [
                {
                    "id": pr.id,
                    "pr_number": pr.pr_number,
                    "title": pr.title,
                    "status": pr.status.value,
                    "pr_url": pr.pr_url,
                    "created_at": pr.created_at.isoformat()
                }
                for pr in prs
            ]
        }
        
    except Exception as e:
        logger.error("Failed to get automation status",
                    review_id=review_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Conflict resolution routes
@git_router.get("/conflicts/{repository_id}")
async def detect_conflicts(
    repository_id: int,
    source_branch: str = Query(...),
    target_branch: str = Query("main"),
    db: Session = Depends(get_db)
):
    """Detect conflicts between branches"""
    try:
        conflicts = await conflict_resolver.detect_conflicts(
            repository_id=repository_id,
            source_branch=source_branch,
            target_branch=target_branch
        )
        
        return conflicts
        
    except Exception as e:
        logger.error("Conflict detection failed",
                    repository_id=repository_id,
                    source_branch=source_branch,
                    target_branch=target_branch,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@git_router.post("/conflicts/{repository_id}/resolve")
async def resolve_conflicts(
    repository_id: int,
    conflicts: List[Dict[str, Any]],
    resolution_strategy: str = "smart",
    db: Session = Depends(get_db)
):
    """Auto-resolve conflicts"""
    try:
        result = await conflict_resolver.auto_resolve_conflicts(
            repository_id=repository_id,
            conflicts=conflicts,
            resolution_strategy=resolution_strategy
        )
        
        return result
        
    except Exception as e:
        logger.error("Conflict resolution failed",
                    repository_id=repository_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Pull request management routes
@git_router.get("/pull-requests", response_class=HTMLResponse)
async def list_pull_requests(
    request: Request,
    repository_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List pull requests with filtering"""
    try:
        query = db.query(PullRequest)
        
        if repository_id:
            query = query.filter(PullRequest.repository_id == repository_id)
        
        if status:
            query = query.filter(PullRequest.status == status)
        
        pull_requests = query.order_by(
            PullRequest.created_at.desc()
        ).limit(50).all()
        
        repositories = db.query(GitRepository).all()
        
        return templates.TemplateResponse("git/pull_requests.html", {
            "request": request,
            "pull_requests": pull_requests,
            "repositories": repositories,
            "filters": {"repository_id": repository_id, "status": status}
        })
        
    except Exception as e:
        logger.error("Failed to list pull requests", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load pull requests")

@git_router.get("/pull-requests/{pr_id}", response_class=HTMLResponse)
async def pull_request_detail(
    request: Request,
    pr_id: int,
    db: Session = Depends(get_db)
):
    """Pull request detail view"""
    try:
        pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
        
        if not pr:
            raise HTTPException(status_code=404, detail="Pull request not found")
        
        # Get related Git operations
        operations = await git_service.get_git_operations(
            repository_id=pr.repository_id,
            review_id=pr.review_workflow_id
        )
        
        return templates.TemplateResponse("git/pull_request_detail.html", {
            "request": request,
            "pull_request": pr,
            "operations": operations
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to load pull request details",
                    pr_id=pr_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load pull request")

# Webhook endpoints
@git_router.post("/webhooks/github/{repository_id}")
async def github_webhook(
    request: Request,
    repository_id: int,
    db: Session = Depends(get_db)
):
    """GitHub webhook endpoint"""
    try:
        # Parse webhook payload
        payload = await request.json()
        
        # Process webhook
        result = await webhook_handler.process_github_webhook(
            request=request,
            repository_id=repository_id,
            payload=payload
        )
        
        return result
        
    except Exception as e:
        logger.error("GitHub webhook processing failed",
                    repository_id=repository_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Operations monitoring
@git_router.get("/operations", response_class=HTMLResponse)
async def list_git_operations(
    request: Request,
    repository_id: Optional[int] = Query(None),
    operation_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """List Git operations with filtering"""
    try:
        from src.git.models import GitOperationType, GitOperationStatus
        
        # Parse enum values
        op_type = None
        if operation_type:
            try:
                op_type = GitOperationType(operation_type)
            except ValueError:
                pass
        
        op_status = None
        if status:
            try:
                op_status = GitOperationStatus(status)
            except ValueError:
                pass
        
        operations = await git_service.get_git_operations(
            repository_id=repository_id,
            operation_type=op_type,
            status=op_status,
            limit=limit
        )
        
        repositories = db.query(GitRepository).all()
        
        return templates.TemplateResponse("git/operations.html", {
            "request": request,
            "operations": operations,
            "repositories": repositories,
            "filters": {
                "repository_id": repository_id,
                "operation_type": operation_type,
                "status": status
            },
            "operation_types": [t.value for t in GitOperationType],
            "operation_statuses": [s.value for s in GitOperationStatus]
        })
        
    except Exception as e:
        logger.error("Failed to list Git operations", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load operations")

# Quality gates and enforcement
@git_router.post("/reviews/{review_id}/quality-gates")
async def enforce_quality_gates(
    review_id: int,
    db: Session = Depends(get_db)
):
    """Enforce quality gates for a review"""
    try:
        result = await automation_workflow.enforce_quality_gates(review_id)
        return result
        
    except Exception as e:
        logger.error("Quality gate enforcement failed",
                    review_id=review_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Bulk operations
@git_router.post("/reviews/bulk/automate")
async def bulk_automate_reviews(
    review_ids: List[int],
    repository_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Trigger automation for multiple approved reviews"""
    try:
        results = []
        
        for review_id in review_ids:
            try:
                result = await automation_workflow.process_approved_review(
                    review_id=review_id,
                    repository_id=repository_id
                )
                results.append({
                    "review_id": review_id,
                    "success": result["success"],
                    "error": result.get("error")
                })
            except Exception as e:
                results.append({
                    "review_id": review_id,
                    "success": False,
                    "error": str(e)
                })
        
        success_count = sum(1 for r in results if r["success"])
        
        return {
            "total": len(review_ids),
            "success_count": success_count,
            "failed_count": len(review_ids) - success_count,
            "results": results
        }
        
    except Exception as e:
        logger.error("Bulk automation failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Cleanup operations
@git_router.post("/cleanup/branches")
async def cleanup_old_branches(
    repository_id: Optional[int] = None,
    days_old: int = 7,
    db: Session = Depends(get_db)
):
    """Clean up old merged branches"""
    try:
        if repository_id:
            # Clean up specific repository
            cleaned_branches = await git_service.cleanup_merged_branches(
                repository_id=repository_id,
                days_old=days_old
            )
            return {
                "repository_id": repository_id,
                "branches_cleaned": len(cleaned_branches),
                "cleaned_branches": cleaned_branches
            }
        else:
            # Clean up all repositories
            result = await automation_workflow.cleanup_completed_workflows(days_old)
            return result
        
    except Exception as e:
        logger.error("Branch cleanup failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard and monitoring
@git_router.get("/dashboard", response_class=HTMLResponse)
async def git_dashboard(
    request: Request,
    db: Session = Depends(get_db)
):
    """Git operations dashboard"""
    try:
        # Get dashboard statistics
        stats = await _get_git_dashboard_stats(db)
        
        return templates.TemplateResponse("git/dashboard.html", {
            "request": request,
            "stats": stats
        })
        
    except Exception as e:
        logger.error("Failed to load Git dashboard", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load dashboard")

@git_router.get("/api/dashboard/stats")
async def get_git_dashboard_stats(db: Session = Depends(get_db)):
    """Get Git dashboard statistics"""
    try:
        stats = await _get_git_dashboard_stats(db)
        return stats
        
    except Exception as e:
        logger.error("Failed to get Git dashboard stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

async def _get_git_dashboard_stats(db: Session) -> Dict[str, Any]:
    """Calculate Git dashboard statistics"""
    # Get recent operations count
    from datetime import timedelta
    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    total_operations = db.query(GitOperation).count()
    recent_operations = db.query(GitOperation).filter(
        GitOperation.created_at >= recent_cutoff
    ).count()
    
    # Get operation status counts
    pending_operations = db.query(GitOperation).filter(
        GitOperation.status == GitOperationStatus.PENDING
    ).count()
    
    failed_operations = db.query(GitOperation).filter(
        GitOperation.status == GitOperationStatus.FAILED
    ).count()
    
    # Get PR statistics
    total_prs = db.query(PullRequest).count()
    open_prs = db.query(PullRequest).filter(
        PullRequest.status.in_(['open', 'draft'])
    ).count()
    
    merged_prs = db.query(PullRequest).filter(
        PullRequest.status == 'merged'
    ).count()
    
    # Get repository counts
    total_repositories = db.query(GitRepository).count()
    active_repositories = db.query(GitRepository).filter(
        GitRepository.is_active == True
    ).count()
    
    return {
        "operations": {
            "total": total_operations,
            "recent": recent_operations,
            "pending": pending_operations,
            "failed": failed_operations
        },
        "pull_requests": {
            "total": total_prs,
            "open": open_prs,
            "merged": merged_prs
        },
        "repositories": {
            "total": total_repositories,
            "active": active_repositories
        }
    }