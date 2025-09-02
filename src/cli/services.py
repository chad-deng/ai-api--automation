"""
Review Service - Business logic for review workflow operations
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
import structlog

from src.database.models import (
    get_db, ReviewWorkflow, ReviewComment, ReviewMetrics, GeneratedTest,
    ReviewStatus, ReviewPriority, CommentType, SessionLocal
)
from src.config.settings import Settings
from src.review.sla_events import sla_event_dispatcher

logger = structlog.get_logger()

class ReviewService:
    """Service class for managing review workflows"""
    
    def __init__(self):
        self.settings = Settings()
        
    def _get_db_session(self) -> Session:
        """Get database session"""
        return SessionLocal()
    
    async def list_reviews_with_db(
        self,
        db: Session,
        status: Optional[ReviewStatus] = None,
        priority: Optional[ReviewPriority] = None,
        assignee_id: Optional[str] = None,
        reviewer_id: Optional[str] = None,
        limit: int = 20
    ) -> List[ReviewWorkflow]:
        """List review workflows with optional filtering using provided DB session"""
        try:
            from sqlalchemy.orm import joinedload
            from sqlalchemy import desc
            
            query = db.query(ReviewWorkflow).options(
                joinedload(ReviewWorkflow.generated_test),
                joinedload(ReviewWorkflow.comments),
                joinedload(ReviewWorkflow.metrics)
            )
            
            # Apply filters
            if status:
                query = query.filter(ReviewWorkflow.status == status)
                
            if priority:
                query = query.filter(ReviewWorkflow.priority == priority)
                
            if assignee_id:
                query = query.filter(ReviewWorkflow.assignee_id == assignee_id)
                
            if reviewer_id:
                query = query.filter(ReviewWorkflow.reviewer_id == reviewer_id)
            
            # Order by created date (newest first) and limit
            query = query.order_by(desc(ReviewWorkflow.created_at)).limit(limit)
            
            reviews = query.all()
            logger.info("Listed reviews", count=len(reviews), filters={
                'status': status.value if status else None,
                'priority': priority.value if priority else None,
                'assignee_id': assignee_id,
                'reviewer_id': reviewer_id
            })
            
            return reviews
            
        except Exception as e:
            logger.error("Failed to list reviews", error=str(e))
            raise
        
    async def list_reviews(
        self, 
        status: Optional[ReviewStatus] = None,
        priority: Optional[ReviewPriority] = None,
        assignee_id: Optional[str] = None,
        reviewer_id: Optional[str] = None,
        limit: int = 20
    ) -> List[ReviewWorkflow]:
        """List review workflows with optional filtering"""
        db = self._get_db_session()
        
        try:
            query = db.query(ReviewWorkflow).options(
                joinedload(ReviewWorkflow.generated_test),
                joinedload(ReviewWorkflow.comments),
                joinedload(ReviewWorkflow.metrics),
                joinedload(ReviewWorkflow.sla_tracking)
            )
            
            # Apply filters
            if status:
                query = query.filter(ReviewWorkflow.status == status)
                
            if priority:
                query = query.filter(ReviewWorkflow.priority == priority)
                
            if assignee_id:
                query = query.filter(ReviewWorkflow.assignee_id == assignee_id)
                
            if reviewer_id:
                query = query.filter(ReviewWorkflow.reviewer_id == reviewer_id)
            
            # Order by created date (newest first) and limit
            query = query.order_by(desc(ReviewWorkflow.created_at)).limit(limit)
            
            reviews = query.all()
            logger.info("Listed reviews", count=len(reviews), filters={
                'status': status.value if status else None,
                'priority': priority.value if priority else None,
                'assignee_id': assignee_id,
                'reviewer_id': reviewer_id
            })
            
            return reviews
            
        except Exception as e:
            logger.error("Failed to list reviews", error=str(e))
            raise
        finally:
            db.close()
    
    async def get_review_details(self, review_id: int) -> Optional[ReviewWorkflow]:
        """Get detailed information about a specific review"""
        db = self._get_db_session()
        
        try:
            review = db.query(ReviewWorkflow).options(
                joinedload(ReviewWorkflow.generated_test),
                joinedload(ReviewWorkflow.comments),
                joinedload(ReviewWorkflow.metrics),
                joinedload(ReviewWorkflow.sla_tracking)
            ).filter(ReviewWorkflow.id == review_id).first()
            
            if review:
                logger.info("Retrieved review details", review_id=review_id, title=review.title)
            else:
                logger.warning("Review not found", review_id=review_id)
                
            return review
            
        except Exception as e:
            logger.error("Failed to get review details", error=str(e), review_id=review_id)
            raise
        finally:
            db.close()
    
    async def create_review(
        self,
        title: str,
        generated_test_id: int,
        description: Optional[str] = None,
        assignee_id: Optional[str] = None,
        reviewer_id: Optional[str] = None,
        priority: ReviewPriority = ReviewPriority.MEDIUM,
        due_date: Optional[datetime] = None,
        workflow_metadata: Optional[Dict[str, Any]] = None
    ) -> ReviewWorkflow:
        """Create a new review workflow"""
        db = self._get_db_session()
        
        try:
            # Verify the generated test exists
            generated_test = db.query(GeneratedTest).filter(
                GeneratedTest.id == generated_test_id
            ).first()
            
            if not generated_test:
                raise ValueError(f"Generated test with ID {generated_test_id} not found")
            
            # Create the review workflow
            review = ReviewWorkflow(
                generated_test_id=generated_test_id,
                title=title,
                description=description,
                assignee_id=assignee_id,
                reviewer_id=reviewer_id,
                priority=priority,
                due_date=due_date,
                workflow_metadata=workflow_metadata or {}
            )
            
            db.add(review)
            db.commit()
            
            # Initialize metrics
            metrics = ReviewMetrics(review_workflow_id=review.id)
            db.add(metrics)
            db.commit()
            
            # Refresh to get relationships
            db.refresh(review)
            
            logger.info("Created review workflow", 
                       review_id=review.id, title=title, 
                       generated_test_id=generated_test_id)
            
            # Initialize SLA tracking
            await sla_event_dispatcher.dispatch_event(
                'review_workflow_created',
                {'workflow_id': review.id}
            )
            
            return review
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to create review", error=str(e), title=title)
            raise
        finally:
            db.close()
    
    async def assign_review(
        self,
        review_id: int,
        assignee_id: Optional[str] = None,
        reviewer_id: Optional[str] = None,
        priority: Optional[ReviewPriority] = None,
        due_date: Optional[datetime] = None
    ) -> Optional[ReviewWorkflow]:
        """Assign a review to team members"""
        db = self._get_db_session()
        
        try:
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not review:
                return None
            
            # Update assignment fields
            if assignee_id is not None:
                review.assignee_id = assignee_id
                
            if reviewer_id is not None:
                review.reviewer_id = reviewer_id
                
            if priority is not None:
                review.priority = priority
                
            if due_date is not None:
                review.due_date = due_date
            
            # Update the updated_at timestamp
            review.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(review)
            
            logger.info("Assigned review", review_id=review_id, 
                       assignee_id=assignee_id, reviewer_id=reviewer_id)
            
            # Dispatch SLA event for reviewer assignment (first response trigger)
            if assignee_id is not None:
                await sla_event_dispatcher.dispatch_event(
                    'reviewer_assigned',
                    {
                        'workflow_id': review_id,
                        'assignee_id': assignee_id,
                        'assigned_by': None  # Could be passed as parameter if needed
                    }
                )
            
            return review
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to assign review", error=str(e), review_id=review_id)
            raise
        finally:
            db.close()
    
    async def update_review_status(
        self,
        review_id: int,
        new_status: ReviewStatus,
        message: Optional[str] = None
    ) -> Optional[ReviewWorkflow]:
        """Update the status of a review workflow"""
        db = self._get_db_session()
        
        try:
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not review:
                return None
            
            old_status = review.status
            review.status = new_status
            review.updated_at = datetime.now(timezone.utc)
            
            # Update timestamps based on status
            if new_status == ReviewStatus.IN_PROGRESS and old_status == ReviewStatus.PENDING:
                review.started_at = datetime.now(timezone.utc)
                
            if new_status in [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.CANCELLED]:
                if not review.completed_at:
                    review.completed_at = datetime.now(timezone.utc)
            
            # Add a comment if message provided
            if message:
                comment = ReviewComment(
                    review_workflow_id=review_id,
                    author_id="system",
                    content=f"Status changed from {old_status.value} to {new_status.value}: {message}",
                    comment_type=CommentType.GENERAL
                )
                db.add(comment)
            
            # Update metrics if completing
            if review.completed_at and review.metrics:
                if review.started_at:
                    completion_time = (review.completed_at - review.started_at).total_seconds() / 60
                    review.metrics.time_to_completion_minutes = int(completion_time)
                
                # Update comment counts
                review.metrics.total_comments = len(review.comments)
                review.metrics.issues_found = len([c for c in review.comments if c.comment_type == CommentType.ISSUE])
                review.metrics.suggestions_made = len([c for c in review.comments if c.comment_type == CommentType.SUGGESTION])
            
            db.commit()
            db.refresh(review)
            
            logger.info("Updated review status", 
                       review_id=review_id, 
                       old_status=old_status.value, 
                       new_status=new_status.value)
            
            # Dispatch SLA event for status change
            await sla_event_dispatcher.dispatch_event(
                'workflow_status_changed',
                {
                    'workflow_id': review_id,
                    'old_status': old_status.value,
                    'new_status': new_status.value,
                    'changed_by': 'system'  # Could be passed as parameter if needed
                }
            )
            
            return review
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to update review status", error=str(e), review_id=review_id)
            raise
        finally:
            db.close()
    
    async def add_comment(
        self,
        review_id: int,
        author_id: str,
        content: str,
        comment_type: CommentType = CommentType.GENERAL,
        line_number: Optional[int] = None,
        file_path: Optional[str] = None
    ) -> Optional[ReviewComment]:
        """Add a comment to a review workflow"""
        db = self._get_db_session()
        
        try:
            # Verify review exists
            review = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.id == review_id
            ).first()
            
            if not review:
                return None
            
            comment = ReviewComment(
                review_workflow_id=review_id,
                author_id=author_id,
                content=content,
                comment_type=comment_type,
                line_number=line_number,
                file_path=file_path
            )
            
            db.add(comment)
            
            # Update review's updated_at timestamp
            review.updated_at = datetime.now(timezone.utc)
            
            # Update metrics
            if review.metrics:
                review.metrics.total_comments = len(review.comments) + 1
                if comment_type == CommentType.ISSUE:
                    review.metrics.issues_found = (review.metrics.issues_found or 0) + 1
                elif comment_type == CommentType.SUGGESTION:
                    review.metrics.suggestions_made = (review.metrics.suggestions_made or 0) + 1
            
            db.commit()
            db.refresh(comment)
            
            logger.info("Added comment to review", 
                       review_id=review_id, 
                       author_id=author_id,
                       comment_type=comment_type.value)
            
            # Check if this is the first comment (for SLA first response tracking)
            comment_count = len(review.comments)
            if comment_count == 1:  # This was the first comment
                await sla_event_dispatcher.dispatch_event(
                    'first_comment',
                    {
                        'workflow_id': review_id,
                        'comment_id': comment.id,
                        'author_id': author_id
                    }
                )
            
            return comment
            
        except Exception as e:
            db.rollback()
            logger.error("Failed to add comment", error=str(e), review_id=review_id)
            raise
        finally:
            db.close()
    
    async def get_dashboard_stats_with_db(self, db: Session, days: int = 7) -> Dict[str, Any]:
        """Get dashboard statistics for review workflows using provided DB session"""
        try:
            from datetime import timedelta
            
            # Date range for filtering
            since_date = datetime.now(timezone.utc) - timedelta(days=days)
            now = datetime.now(timezone.utc)
            
            # Basic counts - simplified to avoid complex queries for now
            total_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.created_at >= since_date
            ).count()
            
            pending_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.status == ReviewStatus.PENDING
            ).count()
            
            in_progress_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.status == ReviewStatus.IN_PROGRESS
            ).count()
            
            approved_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.status == ReviewStatus.APPROVED
            ).count()
            
            # Return simplified stats
            stats = {
                "total_reviews": total_reviews,
                "pending_reviews": pending_reviews,
                "in_progress_reviews": in_progress_reviews,
                "approved_reviews": approved_reviews,
                "completion_rate": round((approved_reviews / max(total_reviews, 1)) * 100, 1),
                "period_days": days
            }
            
            logger.info("Generated dashboard stats", stats=stats)
            return stats
            
        except Exception as e:
            logger.error("Failed to get dashboard stats", error=str(e))
            # Return default stats on error
            return {
                "total_reviews": 0,
                "pending_reviews": 0,
                "in_progress_reviews": 0,
                "approved_reviews": 0,
                "completion_rate": 0.0,
                "period_days": days
            }

    async def get_dashboard_stats(self, days: int = 7) -> Dict[str, Any]:
        """Get dashboard statistics for review workflows"""
        db = self._get_db_session()
        
        try:
            # Date range for filtering
            since_date = datetime.now(timezone.utc) - timedelta(days=days)
            now = datetime.now(timezone.utc)
            
            # Basic counts
            total_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.created_at >= since_date
            ).count()
            
            pending_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.status == ReviewStatus.PENDING
            ).count()
            
            in_progress_reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.status == ReviewStatus.IN_PROGRESS
            ).count()
            
            completed_reviews = db.query(ReviewWorkflow).filter(
                and_(
                    ReviewWorkflow.completed_at.isnot(None),
                    ReviewWorkflow.completed_at >= since_date
                )
            ).count()
            
            # Overdue reviews
            overdue_reviews = db.query(ReviewWorkflow).filter(
                and_(
                    ReviewWorkflow.due_date < now,
                    ReviewWorkflow.status.in_([ReviewStatus.PENDING, ReviewStatus.IN_PROGRESS])
                )
            ).count()
            
            # High priority pending
            high_priority_pending = db.query(ReviewWorkflow).filter(
                and_(
                    ReviewWorkflow.priority.in_([ReviewPriority.HIGH, ReviewPriority.CRITICAL]),
                    ReviewWorkflow.status.in_([ReviewStatus.PENDING, ReviewStatus.IN_PROGRESS])
                )
            ).count()
            
            # Average completion time
            completed_reviews_with_time = db.query(ReviewMetrics).filter(
                and_(
                    ReviewMetrics.time_to_completion_minutes.isnot(None),
                    ReviewMetrics.created_at >= since_date
                )
            ).all()
            
            avg_completion_time_hours = 0
            if completed_reviews_with_time:
                total_minutes = sum([m.time_to_completion_minutes for m in completed_reviews_with_time])
                avg_completion_time_hours = total_minutes / len(completed_reviews_with_time) / 60
            
            stats = {
                'total_reviews': total_reviews,
                'pending_reviews': pending_reviews,
                'in_progress_reviews': in_progress_reviews,
                'completed_reviews': completed_reviews,
                'overdue_reviews': overdue_reviews,
                'high_priority_pending': high_priority_pending,
                'avg_completion_time_hours': avg_completion_time_hours,
                'date_range_days': days
            }
            
            logger.info("Generated dashboard stats", stats=stats)
            return stats
            
        except Exception as e:
            logger.error("Failed to get dashboard stats", error=str(e))
            raise
        finally:
            db.close()
    
    async def get_reviews_by_test_id(self, test_id: int) -> List[ReviewWorkflow]:
        """Get all review workflows for a specific generated test"""
        db = self._get_db_session()
        
        try:
            reviews = db.query(ReviewWorkflow).filter(
                ReviewWorkflow.generated_test_id == test_id
            ).order_by(desc(ReviewWorkflow.created_at)).all()
            
            return reviews
            
        except Exception as e:
            logger.error("Failed to get reviews by test ID", error=str(e), test_id=test_id)
            raise
        finally:
            db.close()
    
    async def search_reviews(self, query: str, limit: int = 20) -> List[ReviewWorkflow]:
        """Search reviews by title or description"""
        db = self._get_db_session()
        
        try:
            reviews = db.query(ReviewWorkflow).filter(
                or_(
                    ReviewWorkflow.title.contains(query),
                    ReviewWorkflow.description.contains(query)
                )
            ).order_by(desc(ReviewWorkflow.created_at)).limit(limit).all()
            
            logger.info("Search completed", query=query, results=len(reviews))
            return reviews
            
        except Exception as e:
            logger.error("Failed to search reviews", error=str(e), query=query)
            raise
        finally:
            db.close()