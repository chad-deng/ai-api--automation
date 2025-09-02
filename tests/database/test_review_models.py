import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database.models import (
    Base, WebhookEvent, GeneratedTest, ReviewWorkflow, ReviewComment, 
    ReviewMetrics, ReviewStatus, ReviewPriority, CommentType
)


@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    # Use in-memory SQLite for tests
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def sample_webhook_event(db_session):
    """Create a sample webhook event for testing"""
    event = WebhookEvent(
        event_id="test-event-123",
        event_type="api_created",
        project_id="test-project",
        payload={"api": {"name": "Test API"}}
    )
    db_session.add(event)
    db_session.commit()
    return event


@pytest.fixture
def sample_generated_test(db_session, sample_webhook_event):
    """Create a sample generated test for testing"""
    test = GeneratedTest(
        webhook_event_id=sample_webhook_event.event_id,
        test_name="test_api_functionality",
        test_content="def test_api():\n    assert True",
        file_path="/tests/test_api.py"
    )
    db_session.add(test)
    db_session.commit()
    return test


class TestReviewWorkflow:
    """Test cases for ReviewWorkflow model"""
    
    def test_create_review_workflow_basic(self, db_session, sample_generated_test):
        """Test creating a basic review workflow"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Review test for API functionality",
            description="Please review the generated API test"
        )
        
        db_session.add(review)
        db_session.commit()
        
        # Assertions
        assert review.id is not None
        assert review.generated_test_id == sample_generated_test.id
        assert review.title == "Review test for API functionality"
        assert review.status == ReviewStatus.PENDING
        assert review.priority == ReviewPriority.MEDIUM
        assert review.created_at is not None
        assert review.updated_at is not None
        
    def test_review_workflow_relationships(self, db_session, sample_generated_test):
        """Test ReviewWorkflow relationships with GeneratedTest"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        # Test relationship
        assert review.generated_test.id == sample_generated_test.id
        assert len(sample_generated_test.reviews) == 1
        assert sample_generated_test.reviews[0].id == review.id
        
    def test_review_workflow_status_transitions(self, db_session, sample_generated_test):
        """Test review workflow status transitions"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        # Test status transitions
        assert review.status == ReviewStatus.PENDING
        
        review.status = ReviewStatus.IN_PROGRESS
        review.started_at = datetime.now(timezone.utc)
        db_session.commit()
        
        assert review.status == ReviewStatus.IN_PROGRESS
        assert review.started_at is not None
        
        review.status = ReviewStatus.APPROVED
        review.completed_at = datetime.now(timezone.utc)
        db_session.commit()
        
        assert review.status == ReviewStatus.APPROVED
        assert review.completed_at is not None
        
    def test_review_workflow_priority_levels(self, db_session, sample_generated_test):
        """Test different priority levels"""
        priorities = [ReviewPriority.LOW, ReviewPriority.MEDIUM, ReviewPriority.HIGH, ReviewPriority.CRITICAL]
        
        for priority in priorities:
            review = ReviewWorkflow(
                generated_test_id=sample_generated_test.id,
                title=f"Review with {priority.value} priority",
                priority=priority
            )
            db_session.add(review)
        
        db_session.commit()
        
        # Verify all priorities are saved correctly
        reviews = db_session.query(ReviewWorkflow).all()
        saved_priorities = [review.priority for review in reviews]
        
        for priority in priorities:
            assert priority in saved_priorities
            
    def test_review_workflow_metadata(self, db_session, sample_generated_test):
        """Test workflow metadata storage"""
        metadata = {
            "source": "automated",
            "complexity": "high",
            "estimated_duration": 30,
            "tags": ["api", "authentication", "security"]
        }
        
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test with metadata",
            workflow_metadata=metadata
        )
        db_session.add(review)
        db_session.commit()
        
        # Verify metadata is stored correctly
        stored_review = db_session.query(ReviewWorkflow).filter_by(id=review.id).first()
        assert stored_review.workflow_metadata == metadata
        assert stored_review.workflow_metadata["complexity"] == "high"
        assert "api" in stored_review.workflow_metadata["tags"]


class TestReviewComment:
    """Test cases for ReviewComment model"""
    
    def test_create_review_comment_basic(self, db_session, sample_generated_test):
        """Test creating a basic review comment"""
        # First create a review workflow
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        # Create comment
        comment = ReviewComment(
            review_workflow_id=review.id,
            author_id="reviewer-123",
            content="This test looks good, but consider adding edge case validation",
            comment_type=CommentType.SUGGESTION
        )
        db_session.add(comment)
        db_session.commit()
        
        # Assertions
        assert comment.id is not None
        assert comment.review_workflow_id == review.id
        assert comment.author_id == "reviewer-123"
        assert comment.content == "This test looks good, but consider adding edge case validation"
        assert comment.comment_type == CommentType.SUGGESTION
        assert comment.resolved is False
        assert comment.created_at is not None
        
    def test_comment_types(self, db_session, sample_generated_test):
        """Test different comment types"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        comment_types = [
            CommentType.GENERAL, CommentType.ISSUE, 
            CommentType.SUGGESTION, CommentType.QUESTION, CommentType.APPROVAL
        ]
        
        for comment_type in comment_types:
            comment = ReviewComment(
                review_workflow_id=review.id,
                author_id="reviewer-123",
                content=f"This is a {comment_type.value} comment",
                comment_type=comment_type
            )
            db_session.add(comment)
        
        db_session.commit()
        
        # Verify all comment types are saved correctly
        comments = db_session.query(ReviewComment).all()
        saved_types = [comment.comment_type for comment in comments]
        
        for comment_type in comment_types:
            assert comment_type in saved_types
            
    def test_comment_resolution(self, db_session, sample_generated_test):
        """Test comment resolution functionality"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        comment = ReviewComment(
            review_workflow_id=review.id,
            author_id="reviewer-123",
            content="Please fix the assertion in line 15",
            comment_type=CommentType.ISSUE
        )
        db_session.add(comment)
        db_session.commit()
        
        # Initially not resolved
        assert comment.resolved is False
        
        # Resolve the comment
        comment.resolved = True
        db_session.commit()
        
        # Verify resolution
        updated_comment = db_session.query(ReviewComment).filter_by(id=comment.id).first()
        assert updated_comment.resolved is True
        
    def test_comment_file_specific(self, db_session, sample_generated_test):
        """Test file-specific comments with line numbers"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        comment = ReviewComment(
            review_workflow_id=review.id,
            author_id="reviewer-123",
            content="Consider using a more descriptive variable name",
            comment_type=CommentType.SUGGESTION,
            line_number=42,
            file_path="/tests/test_api.py"
        )
        db_session.add(comment)
        db_session.commit()
        
        assert comment.line_number == 42
        assert comment.file_path == "/tests/test_api.py"
        
    def test_comment_relationships(self, db_session, sample_generated_test):
        """Test ReviewComment relationships"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        comment = ReviewComment(
            review_workflow_id=review.id,
            author_id="reviewer-123",
            content="Test comment"
        )
        db_session.add(comment)
        db_session.commit()
        
        # Test relationships
        assert comment.review_workflow.id == review.id
        assert len(review.comments) == 1
        assert review.comments[0].id == comment.id


class TestReviewMetrics:
    """Test cases for ReviewMetrics model"""
    
    def test_create_review_metrics_basic(self, db_session, sample_generated_test):
        """Test creating basic review metrics"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        metrics = ReviewMetrics(
            review_workflow_id=review.id,
            time_to_first_response_minutes=30,
            time_to_completion_minutes=120,
            total_comments=5,
            issues_found=2,
            suggestions_made=3
        )
        db_session.add(metrics)
        db_session.commit()
        
        # Assertions
        assert metrics.id is not None
        assert metrics.review_workflow_id == review.id
        assert metrics.time_to_first_response_minutes == 30
        assert metrics.time_to_completion_minutes == 120
        assert metrics.total_comments == 5
        assert metrics.issues_found == 2
        assert metrics.suggestions_made == 3
        assert metrics.created_at is not None
        
    def test_metrics_scoring_system(self, db_session, sample_generated_test):
        """Test the scoring system for review metrics"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        metrics = ReviewMetrics(
            review_workflow_id=review.id,
            code_quality_score=8,
            test_coverage_score=9,
            performance_score=7,
            security_score=10,
            overall_score=8
        )
        db_session.add(metrics)
        db_session.commit()
        
        # Verify all scores are within valid range (1-10)
        assert 1 <= metrics.code_quality_score <= 10
        assert 1 <= metrics.test_coverage_score <= 10
        assert 1 <= metrics.performance_score <= 10
        assert 1 <= metrics.security_score <= 10
        assert 1 <= metrics.overall_score <= 10
        
    def test_metrics_relationships(self, db_session, sample_generated_test):
        """Test ReviewMetrics relationships"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review"
        )
        db_session.add(review)
        db_session.commit()
        
        metrics = ReviewMetrics(
            review_workflow_id=review.id,
            overall_score=8
        )
        db_session.add(metrics)
        db_session.commit()
        
        # Test one-to-one relationship
        assert metrics.review_workflow.id == review.id
        assert review.metrics.id == metrics.id
        
    def test_metrics_completion_tracking(self, db_session, sample_generated_test):
        """Test tracking review completion metrics"""
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test Review",
            started_at=datetime.now(timezone.utc) - timedelta(hours=2),
            completed_at=datetime.now(timezone.utc)
        )
        db_session.add(review)
        db_session.commit()
        
        # Calculate time metrics
        time_diff = (review.completed_at - review.started_at).total_seconds() / 60
        
        metrics = ReviewMetrics(
            review_workflow_id=review.id,
            time_to_completion_minutes=int(time_diff),
            revisions_requested=1,
            overall_score=9
        )
        db_session.add(metrics)
        db_session.commit()
        
        assert metrics.time_to_completion_minutes == int(time_diff)
        assert metrics.revisions_requested == 1


class TestModelIntegration:
    """Integration tests for all review models working together"""
    
    def test_complete_review_workflow_cycle(self, db_session, sample_generated_test):
        """Test a complete review workflow from creation to completion"""
        # 1. Create review workflow
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Complete API Test Review",
            description="Full review of generated API test",
            reviewer_id="senior-dev-123",
            assignee_id="junior-dev-456",
            priority=ReviewPriority.HIGH,
            due_date=datetime.now(timezone.utc) + timedelta(days=2)
        )
        db_session.add(review)
        db_session.commit()
        
        # 2. Start review
        review.status = ReviewStatus.IN_PROGRESS
        review.started_at = datetime.now(timezone.utc)
        db_session.commit()
        
        # 3. Add comments during review
        comments_data = [
            ("The test structure looks good", CommentType.GENERAL),
            ("Consider adding authentication headers", CommentType.SUGGESTION),
            ("Missing validation for edge cases", CommentType.ISSUE),
            ("What about error handling?", CommentType.QUESTION),
        ]
        
        for content, comment_type in comments_data:
            comment = ReviewComment(
                review_workflow_id=review.id,
                author_id="senior-dev-123",
                content=content,
                comment_type=comment_type
            )
            db_session.add(comment)
        db_session.commit()
        
        # 4. Complete review
        review.status = ReviewStatus.APPROVED
        review.completed_at = datetime.now(timezone.utc)
        db_session.commit()
        
        # 5. Create metrics
        metrics = ReviewMetrics(
            review_workflow_id=review.id,
            time_to_first_response_minutes=15,
            time_to_completion_minutes=90,
            total_comments=4,
            issues_found=1,
            suggestions_made=1,
            code_quality_score=8,
            test_coverage_score=7,
            overall_score=8
        )
        db_session.add(metrics)
        db_session.commit()
        
        # Verify the complete workflow
        completed_review = db_session.query(ReviewWorkflow).filter_by(id=review.id).first()
        assert completed_review.status == ReviewStatus.APPROVED
        assert completed_review.completed_at is not None
        assert len(completed_review.comments) == 4
        assert completed_review.metrics.overall_score == 8
        
        # Verify comment types distribution
        comment_types = [comment.comment_type for comment in completed_review.comments]
        assert CommentType.GENERAL in comment_types
        assert CommentType.SUGGESTION in comment_types
        assert CommentType.ISSUE in comment_types
        assert CommentType.QUESTION in comment_types
        
    def test_cascade_delete_behavior(self, db_session, sample_generated_test):
        """Test that related records are properly deleted when review is deleted"""
        # Create review with comments and metrics
        review = ReviewWorkflow(
            generated_test_id=sample_generated_test.id,
            title="Test for Cascade Delete"
        )
        db_session.add(review)
        db_session.commit()
        
        comment = ReviewComment(
            review_workflow_id=review.id,
            author_id="reviewer-123",
            content="Test comment"
        )
        db_session.add(comment)
        
        metrics = ReviewMetrics(
            review_workflow_id=review.id,
            overall_score=7
        )
        db_session.add(metrics)
        db_session.commit()
        
        # Verify records exist
        assert db_session.query(ReviewComment).filter_by(review_workflow_id=review.id).count() == 1
        assert db_session.query(ReviewMetrics).filter_by(review_workflow_id=review.id).count() == 1
        
        # Delete the review
        db_session.delete(review)
        db_session.commit()
        
        # Verify cascade delete worked
        assert db_session.query(ReviewComment).filter_by(review_workflow_id=review.id).count() == 0
        assert db_session.query(ReviewMetrics).filter_by(review_workflow_id=review.id).count() == 0