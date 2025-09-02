"""
Review Workflow FastAPI Routes
Web interface for managing code review workflows
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Form, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
import structlog

from src.database.models import (
    get_db, ReviewWorkflow, ReviewComment, ReviewMetrics, GeneratedTest,
    ReviewStatus, ReviewPriority, CommentType
)
from src.review.schemas import (
    ReviewWorkflowCreate, ReviewWorkflowUpdate, ReviewCommentCreate,
    ReviewWorkflowResponse, ReviewDashboardStats
)
from src.cli.services import ReviewService
from src.auth.session import get_current_user_optional
from src.utils.syntax_highlighting import syntax_highlighter

logger = structlog.get_logger()
review_router = APIRouter(prefix="/reviews", tags=["reviews"])

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="src/templates")

# Dashboard and listing routes
@review_router.get("/", response_class=HTMLResponse, name="review_dashboard")
async def review_dashboard(
    request: Request,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """Review dashboard - main page showing all reviews"""
    try:
        service = ReviewService()
        
        # Get filtered reviews
        status_filter = ReviewStatus(status) if status else None
        priority_filter = ReviewPriority(priority) if priority else None
        
        reviews = await service.list_reviews_with_db(
            db=db,
            status=status_filter,
            priority=priority_filter,
            assignee_id=assignee,
            limit=limit
        )
        
        # Get dashboard statistics  
        stats = await service.get_dashboard_stats_with_db(db=db, days=7)
        
        return templates.TemplateResponse("review_dashboard.html", {
            "request": request,
            "user": current_user,
            "reviews": reviews,
            "stats": stats,
            "filters": {
                "status": status,
                "priority": priority,
                "assignee": assignee
            },
            "review_statuses": [s.value for s in ReviewStatus],
            "review_priorities": [p.value for p in ReviewPriority],
            "page": page,
            "limit": limit
        })
        
    except Exception as e:
        logger.error("Failed to load review dashboard", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load dashboard")

@review_router.get("/api/list", response_model=List[ReviewWorkflowResponse])
async def list_reviews_api(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee: Optional[str] = Query(None),
    reviewer: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    """API endpoint to list reviews with filtering"""
    try:
        service = ReviewService()
        
        status_filter = ReviewStatus(status) if status else None
        priority_filter = ReviewPriority(priority) if priority else None
        
        reviews = await service.list_reviews(
            status=status_filter,
            priority=priority_filter,
            assignee_id=assignee,
            reviewer_id=reviewer,
            limit=limit
        )
        
        return reviews
        
    except Exception as e:
        logger.error("Failed to list reviews via API", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Individual review routes
@review_router.get("/{review_id}", response_class=HTMLResponse, name="review_detail")
async def review_detail(
    request: Request,
    review_id: int,
    db: Session = Depends(get_db)
):
    """Detailed view of a specific review workflow"""
    try:
        service = ReviewService()
        review = await service.get_review_details(review_id)
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return templates.TemplateResponse("review_detail.html", {
            "request": request,
            "review": review,
            "review_statuses": [s.value for s in ReviewStatus],
            "review_priorities": [p.value for p in ReviewPriority],
            "comment_types": [c.value for c in CommentType]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to load review details", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail="Failed to load review")

@review_router.get("/api/{review_id}", response_model=ReviewWorkflowResponse)
async def get_review_api(review_id: int, db: Session = Depends(get_db)):
    """API endpoint to get specific review details"""
    try:
        service = ReviewService()
        review = await service.get_review_details(review_id)
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
            
        return review
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get review via API", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail=str(e))

# Review creation and editing
@review_router.get("/create", response_class=HTMLResponse, name="review_create_form")
async def review_create_form(
    request: Request,
    test_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Form to create a new review workflow"""
    try:
        # Get available generated tests
        generated_tests = db.query(GeneratedTest).order_by(
            GeneratedTest.created_at.desc()
        ).limit(50).all()
        
        return templates.TemplateResponse("review_create.html", {
            "request": request,
            "generated_tests": generated_tests,
            "selected_test_id": test_id,
            "review_priorities": [p.value for p in ReviewPriority]
        })
        
    except Exception as e:
        logger.error("Failed to load review creation form", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load form")

@review_router.post("/create", response_class=HTMLResponse)
async def create_review(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    generated_test_id: int = Form(...),
    assignee_id: Optional[str] = Form(None),
    reviewer_id: Optional[str] = Form(None),
    priority: str = Form("medium"),
    due_date: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Create a new review workflow"""
    try:
        service = ReviewService()
        
        # Parse due date if provided
        due_date_obj = None
        if due_date:
            try:
                due_date_obj = datetime.fromisoformat(due_date).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid due date format")
        
        new_review = await service.create_review(
            title=title,
            description=description,
            generated_test_id=generated_test_id,
            assignee_id=assignee_id if assignee_id else None,
            reviewer_id=reviewer_id if reviewer_id else None,
            priority=ReviewPriority(priority),
            due_date=due_date_obj
        )
        
        logger.info("Created review via web interface", 
                   review_id=new_review.id, title=title)
        
        return RedirectResponse(
            url=f"/reviews/{new_review.id}", 
            status_code=303
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create review", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create review")

@review_router.post("/api/create", response_model=ReviewWorkflowResponse)
async def create_review_api(
    review_data: ReviewWorkflowCreate,
    db: Session = Depends(get_db)
):
    """API endpoint to create a new review workflow"""
    try:
        service = ReviewService()
        
        new_review = await service.create_review(
            title=review_data.title,
            description=review_data.description,
            generated_test_id=review_data.generated_test_id,
            assignee_id=review_data.assignee_id,
            reviewer_id=review_data.reviewer_id,
            priority=review_data.priority,
            due_date=review_data.due_date
        )
        
        return new_review
        
    except Exception as e:
        logger.error("Failed to create review via API", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Review status and assignment updates
@review_router.post("/{review_id}/assign")
async def assign_review(
    review_id: int,
    assignee_id: Optional[str] = Form(None),
    reviewer_id: Optional[str] = Form(None),
    priority: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Assign review to team members"""
    try:
        service = ReviewService()
        
        # Parse due date if provided
        due_date_obj = None
        if due_date:
            try:
                due_date_obj = datetime.fromisoformat(due_date).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid due date format")
        
        priority_obj = ReviewPriority(priority) if priority else None
        
        updated_review = await service.assign_review(
            review_id=review_id,
            assignee_id=assignee_id if assignee_id else None,
            reviewer_id=reviewer_id if reviewer_id else None,
            priority=priority_obj,
            due_date=due_date_obj
        )
        
        if not updated_review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return RedirectResponse(
            url=f"/reviews/{review_id}",
            status_code=303
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to assign review", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail="Failed to assign review")

@review_router.post("/{review_id}/status")
async def update_review_status(
    review_id: int,
    status: str = Form(...),
    message: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Update review status"""
    try:
        service = ReviewService()
        
        updated_review = await service.update_review_status(
            review_id=review_id,
            new_status=ReviewStatus(status),
            message=message
        )
        
        if not updated_review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return RedirectResponse(
            url=f"/reviews/{review_id}",
            status_code=303
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update review status", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail="Failed to update status")

# Comment management
@review_router.post("/{review_id}/comments")
async def add_comment(
    review_id: int,
    content: str = Form(...),
    comment_type: str = Form("general"),
    author_id: str = Form(...),
    line_number: Optional[int] = Form(None),
    file_path: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Add a comment to a review workflow"""
    try:
        service = ReviewService()
        
        comment = await service.add_comment(
            review_id=review_id,
            author_id=author_id,
            content=content,
            comment_type=CommentType(comment_type),
            line_number=line_number,
            file_path=file_path
        )
        
        if not comment:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return RedirectResponse(
            url=f"/reviews/{review_id}",
            status_code=303
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to add comment", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail="Failed to add comment")

@review_router.post("/api/{review_id}/comments", response_model=dict)
async def add_comment_api(
    review_id: int,
    comment_data: ReviewCommentCreate,
    db: Session = Depends(get_db)
):
    """API endpoint to add a comment"""
    try:
        service = ReviewService()
        
        comment = await service.add_comment(
            review_id=review_id,
            author_id=comment_data.author_id,
            content=comment_data.content,
            comment_type=comment_data.comment_type,
            line_number=comment_data.line_number,
            file_path=comment_data.file_path
        )
        
        if not comment:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return {
            "id": comment.id,
            "content": comment.content,
            "comment_type": comment.comment_type.value,
            "author_id": comment.author_id,
            "created_at": comment.created_at.isoformat(),
            "resolved": comment.resolved
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to add comment via API", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard statistics
@review_router.get("/api/dashboard/stats", response_model=ReviewDashboardStats)
async def get_dashboard_stats(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    try:
        service = ReviewService()
        stats = await service.get_dashboard_stats(days=days)
        
        return ReviewDashboardStats(**stats)
        
    except Exception as e:
        logger.error("Failed to get dashboard stats", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# HTMX partial views for dynamic updates
@review_router.get("/{review_id}/comments-partial", response_class=HTMLResponse)
async def get_comments_partial(
    request: Request,
    review_id: int,
    db: Session = Depends(get_db)
):
    """Get comments section for HTMX updates"""
    try:
        service = ReviewService()
        review = await service.get_review_details(review_id)
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return templates.TemplateResponse("partials/comments_section.html", {
            "request": request,
            "review": review,
            "comment_types": [c.value for c in CommentType]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get comments partial", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail="Failed to load comments")

@review_router.get("/dashboard-stats-partial", response_class=HTMLResponse)
async def get_dashboard_stats_partial(
    request: Request,
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get dashboard stats for HTMX updates"""
    try:
        service = ReviewService()
        stats = await service.get_dashboard_stats(days=days)
        
        return templates.TemplateResponse("partials/dashboard_stats.html", {
            "request": request,
            "stats": stats,
            "days": days
        })
        
    except Exception as e:
        logger.error("Failed to get dashboard stats partial", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load stats")

# Search functionality
@review_router.get("/api/search")
async def search_reviews(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    """Search reviews by title or description"""
    try:
        service = ReviewService()
        reviews = await service.search_reviews(query=q, limit=limit)
        
        return {
            "query": q,
            "results": [
                {
                    "id": review.id,
                    "title": review.title,
                    "description": review.description,
                    "status": review.status.value,
                    "priority": review.priority.value,
                    "created_at": review.created_at.isoformat()
                }
                for review in reviews
            ],
            "count": len(reviews)
        }
        
    except Exception as e:
        logger.error("Failed to search reviews", error=str(e), query=q)
        raise HTTPException(status_code=500, detail="Search failed")

# File viewing and syntax highlighting routes
@review_router.get("/{review_id}/files/{file_id}", response_class=HTMLResponse)
async def view_test_file(
    request: Request,
    review_id: int,
    file_id: str,
    db: Session = Depends(get_db)
):
    """View a test file with syntax highlighting"""
    try:
        service = ReviewService()
        review = await service.get_review_details(review_id)
        
        if not review or not review.generated_test:
            raise HTTPException(status_code=404, detail="Review or test file not found")
        
        # Get file content
        file_content = review.generated_test.test_content
        file_path = review.generated_test.file_path
        
        # Apply syntax highlighting
        highlighted = syntax_highlighter.highlight_code(
            content=file_content,
            file_path=file_path,
            language="python"
        )
        
        return templates.TemplateResponse("file_viewer.html", {
            "request": request,
            "review": review,
            "file_content": highlighted["html"],
            "file_css": highlighted["css"],
            "file_path": file_path,
            "language": highlighted["language"],
            "file_extension": highlighted["file_extension"]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to view test file", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail="Failed to view file")

@review_router.get("/api/{review_id}/files/{file_id}/highlighted")
async def get_highlighted_file_content(
    review_id: int,
    file_id: str,
    language: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """API endpoint to get highlighted file content"""
    try:
        service = ReviewService()
        review = await service.get_review_details(review_id)
        
        if not review or not review.generated_test:
            raise HTTPException(status_code=404, detail="Review or test file not found")
        
        # Get file content
        file_content = review.generated_test.test_content
        file_path = review.generated_test.file_path
        
        # Apply syntax highlighting
        highlighted = syntax_highlighter.highlight_code(
            content=file_content,
            file_path=file_path,
            language=language or "python"
        )
        
        return {
            "html": highlighted["html"],
            "css": highlighted["css"],
            "language": highlighted["language"],
            "file_path": file_path,
            "file_extension": highlighted["file_extension"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get highlighted content", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail=str(e))

@review_router.get("/{review_id}/diff", response_class=HTMLResponse)
async def view_diff(
    request: Request,
    review_id: int,
    old_content: Optional[str] = Query(None),
    new_content: Optional[str] = Query(None),
    view_type: str = Query("side-by-side", regex="^(unified|side-by-side)$"),
    db: Session = Depends(get_db)
):
    """View diff between file versions"""
    try:
        service = ReviewService()
        review = await service.get_review_details(review_id)
        
        if not review or not review.generated_test:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # For now, use the test content as new_content and empty as old_content
        # In a full implementation, this would compare against previous versions
        old_content = old_content or ""
        new_content = new_content or review.generated_test.test_content
        file_path = review.generated_test.file_path
        
        # Generate diff view
        if view_type == "side-by-side":
            diff_result = syntax_highlighter.highlight_side_by_side(
                old_content=old_content,
                new_content=new_content,
                file_path=file_path
            )
        else:
            diff_result = syntax_highlighter.highlight_diff(
                old_content=old_content,
                new_content=new_content,
                file_path=file_path
            )
        
        return templates.TemplateResponse("diff_viewer.html", {
            "request": request,
            "review": review,
            "diff_html": diff_result["html"],
            "diff_css": diff_result["css"],
            "view_type": view_type,
            "file_path": file_path,
            "language": diff_result["language"]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to view diff", error=str(e), review_id=review_id)
        raise HTTPException(status_code=500, detail="Failed to view diff")

# Bulk operations endpoints
@review_router.post("/bulk/assign")
async def bulk_assign_reviews(
    review_ids: List[int],
    assignee_id: Optional[str] = Form(None),
    reviewer_id: Optional[str] = Form(None),
    priority: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Bulk assign multiple reviews"""
    try:
        service = ReviewService()
        
        priority_obj = ReviewPriority(priority) if priority else None
        results = []
        
        for review_id in review_ids:
            try:
                updated_review = await service.assign_review(
                    review_id=review_id,
                    assignee_id=assignee_id,
                    reviewer_id=reviewer_id,
                    priority=priority_obj
                )
                if updated_review:
                    results.append({"review_id": review_id, "status": "success"})
                else:
                    results.append({"review_id": review_id, "status": "not_found"})
            except Exception as e:
                results.append({"review_id": review_id, "status": "error", "error": str(e)})
        
        success_count = sum(1 for r in results if r["status"] == "success")
        logger.info("Bulk assignment completed", 
                   total=len(review_ids), success=success_count)
        
        return {
            "total": len(review_ids),
            "success": success_count,
            "results": results
        }
        
    except Exception as e:
        logger.error("Failed bulk assignment", error=str(e))
        raise HTTPException(status_code=500, detail="Bulk assignment failed")

@review_router.post("/bulk/status")
async def bulk_update_status(
    review_ids: List[int],
    status: str = Form(...),
    message: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Bulk update status for multiple reviews"""
    try:
        service = ReviewService()
        new_status = ReviewStatus(status)
        results = []
        
        for review_id in review_ids:
            try:
                updated_review = await service.update_review_status(
                    review_id=review_id,
                    new_status=new_status,
                    message=message
                )
                if updated_review:
                    results.append({"review_id": review_id, "status": "success"})
                else:
                    results.append({"review_id": review_id, "status": "not_found"})
            except Exception as e:
                results.append({"review_id": review_id, "status": "error", "error": str(e)})
        
        success_count = sum(1 for r in results if r["status"] == "success")
        logger.info("Bulk status update completed",
                   total=len(review_ids), success=success_count, new_status=status)
        
        return {
            "total": len(review_ids),
            "success": success_count,
            "results": results
        }
        
    except Exception as e:
        logger.error("Failed bulk status update", error=str(e))
        raise HTTPException(status_code=500, detail="Bulk status update failed")