import pytest
import json
from click.testing import CliRunner
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database.models import (
    Base, WebhookEvent, GeneratedTest, ReviewWorkflow, ReviewComment, 
    ReviewMetrics, ReviewStatus, ReviewPriority, CommentType
)
from src.cli.main import cli


@pytest.fixture(scope="function")
def db_setup():
    """Set up test database"""
    # Use in-memory SQLite for tests
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Patch the SessionLocal in the module
    import src.database.models
    src.database.models.SessionLocal = SessionLocal
    
    db = SessionLocal()
    
    # Create test data
    webhook_event = WebhookEvent(
        event_id="test-webhook-123",
        event_type="api_created",
        project_id="test-project",
        payload={"api": {"name": "Test API"}}
    )
    db.add(webhook_event)
    
    generated_test = GeneratedTest(
        webhook_event_id=webhook_event.event_id,
        test_name="test_api_functionality",
        test_content="def test_api():\n    assert True",
        file_path="/tests/test_api.py"
    )
    db.add(generated_test)
    
    review = ReviewWorkflow(
        generated_test_id=1,  # Will be the ID after commit
        title="Review API Test",
        description="Please review the generated API test",
        assignee_id="developer-123",
        reviewer_id="senior-dev-456",
        priority=ReviewPriority.HIGH
    )
    db.add(review)
    
    db.commit()
    
    # Add metrics
    metrics = ReviewMetrics(
        review_workflow_id=1,
        overall_score=8,
        total_comments=2,
        issues_found=1,
        suggestions_made=1
    )
    db.add(metrics)
    
    # Add some comments
    comment1 = ReviewComment(
        review_workflow_id=1,
        author_id="senior-dev-456",
        content="The test structure looks good overall",
        comment_type=CommentType.GENERAL
    )
    db.add(comment1)
    
    comment2 = ReviewComment(
        review_workflow_id=1,
        author_id="senior-dev-456",
        content="Consider adding edge case validation",
        comment_type=CommentType.SUGGESTION
    )
    db.add(comment2)
    
    db.commit()
    db.close()
    
    yield SessionLocal
    
    # Cleanup is automatic with in-memory database


class TestReviewListCommand:
    """Test cases for review list command"""
    
    def test_list_all_reviews(self, db_setup):
        """Test listing all reviews"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list'])
        
        assert result.exit_code == 0
        assert 'Review API Test' in result.output
        assert 'HIGH' in result.output
        assert 'developer-123' in result.output
        
    def test_list_reviews_json_format(self, db_setup):
        """Test listing reviews in JSON format"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list', '--format', 'json'])
        
        assert result.exit_code == 0
        
        # Parse JSON output
        data = json.loads(result.output)
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]['title'] == 'Review API Test'
        assert data[0]['priority'] == 'high'
        assert data[0]['assignee_id'] == 'developer-123'
        
    def test_list_reviews_filter_by_status(self, db_setup):
        """Test filtering reviews by status"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list', '--status', 'pending'])
        
        assert result.exit_code == 0
        assert 'Review API Test' in result.output
        
    def test_list_reviews_filter_by_priority(self, db_setup):
        """Test filtering reviews by priority"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list', '--priority', 'high'])
        
        assert result.exit_code == 0
        assert 'Review API Test' in result.output
        assert 'HIGH' in result.output
        
    def test_list_reviews_filter_by_assignee(self, db_setup):
        """Test filtering reviews by assignee"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list', '--assignee', 'developer-123'])
        
        assert result.exit_code == 0
        assert 'Review API Test' in result.output
        assert 'developer-123' in result.output
        
    def test_list_reviews_no_results(self, db_setup):
        """Test listing reviews with no matching results"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list', '--assignee', 'nonexistent-user'])
        
        assert result.exit_code == 0
        assert 'No review workflows found' in result.output


class TestReviewStatusCommand:
    """Test cases for review status command"""
    
    def test_show_review_status_detailed(self, db_setup):
        """Test showing detailed review status"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'status', '1'])
        
        assert result.exit_code == 0
        assert 'Review Workflow #1' in result.output
        assert 'Review API Test' in result.output
        assert 'PENDING' in result.output
        assert 'HIGH' in result.output
        assert 'developer-123' in result.output
        assert 'senior-dev-456' in result.output
        assert 'Comments (2)' in result.output
        assert 'Overall score:' in result.output
        
    def test_show_review_status_json(self, db_setup):
        """Test showing review status in JSON format"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'status', '1', '--format', 'json'])
        
        assert result.exit_code == 0
        
        data = json.loads(result.output)
        assert data['id'] == 1
        assert data['title'] == 'Review API Test'
        assert data['status'] == 'pending'
        assert data['priority'] == 'high'
        assert data['assignee_id'] == 'developer-123'
        assert data['comments_count'] == 2
        assert 'metrics' in data
        assert data['metrics']['overall_score'] == 8
        
    def test_show_review_status_not_found(self, db_setup):
        """Test showing status for non-existent review"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'status', '999'])
        
        assert result.exit_code == 1
        assert 'Review with ID 999 not found' in result.output


class TestReviewAssignCommand:
    """Test cases for review assign command"""
    
    def test_assign_review_basic(self, db_setup):
        """Test basic review assignment"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'assign', '1', 
            '--assignee', 'new-developer-789'
        ])
        
        assert result.exit_code == 0
        assert 'Review #1 assigned successfully' in result.output
        assert 'Assignee: new-developer-789' in result.output
        
    def test_assign_review_with_all_options(self, db_setup):
        """Test review assignment with all options"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'assign', '1', 
            '--assignee', 'new-developer-789',
            '--reviewer', 'new-reviewer-456',
            '--priority', 'critical',
            '--due-date', '2024-12-31'
        ])
        
        assert result.exit_code == 0
        assert 'Review #1 assigned successfully' in result.output
        assert 'Assignee: new-developer-789' in result.output
        assert 'Reviewer: new-reviewer-456' in result.output
        assert 'Priority: CRITICAL' in result.output
        assert 'Due Date: 2024-12-31' in result.output
        
    def test_assign_review_invalid_date(self, db_setup):
        """Test review assignment with invalid date format"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'assign', '1', 
            '--assignee', 'new-developer-789',
            '--due-date', 'invalid-date'
        ])
        
        assert result.exit_code == 2
        assert 'Invalid due date format' in result.output
        
    def test_assign_review_not_found(self, db_setup):
        """Test assigning non-existent review"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'assign', '999', 
            '--assignee', 'new-developer-789'
        ])
        
        assert result.exit_code == 1
        assert 'Review with ID 999 not found' in result.output


class TestReviewCreateCommand:
    """Test cases for review create command"""
    
    def test_create_review_basic(self, db_setup):
        """Test creating a basic review"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'create',
            '--title', 'New Test Review',
            '--test-id', '1'
        ])
        
        assert result.exit_code == 0
        assert 'Review workflow created successfully' in result.output
        assert 'Title: New Test Review' in result.output
        assert 'Priority: MEDIUM' in result.output
        assert 'Status: PENDING' in result.output
        
    def test_create_review_with_all_options(self, db_setup):
        """Test creating a review with all options"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'create',
            '--title', 'Complex Test Review',
            '--description', 'This is a detailed review request',
            '--test-id', '1',
            '--assignee', 'developer-123',
            '--reviewer', 'senior-dev-456',
            '--priority', 'high',
            '--due-date', '2024-12-31'
        ])
        
        assert result.exit_code == 0
        assert 'Review workflow created successfully' in result.output
        assert 'Title: Complex Test Review' in result.output
        assert 'Priority: HIGH' in result.output
        assert 'Assignee: developer-123' in result.output
        assert 'Reviewer: senior-dev-456' in result.output
        
    def test_create_review_invalid_test_id(self, db_setup):
        """Test creating a review with invalid test ID"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'create',
            '--title', 'Invalid Test Review',
            '--test-id', '999'
        ])
        
        assert result.exit_code == 1
        assert 'Failed to create review' in result.output


class TestReviewUpdateStatusCommand:
    """Test cases for review update-status command"""
    
    def test_update_status_basic(self, db_setup):
        """Test basic status update"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'update-status', '1', 'in_progress'
        ])
        
        assert result.exit_code == 0
        assert 'Review #1 status updated to: IN_PROGRESS' in result.output
        assert '🔄' in result.output
        
    def test_update_status_with_message(self, db_setup):
        """Test status update with message"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'update-status', '1', 'approved',
            '--message', 'All issues resolved, looks good!'
        ])
        
        assert result.exit_code == 0
        assert 'Review #1 status updated to: APPROVED' in result.output
        assert 'Message: All issues resolved, looks good!' in result.output
        assert '✅' in result.output
        
    def test_update_status_not_found(self, db_setup):
        """Test updating status for non-existent review"""
        runner = CliRunner()
        result = runner.invoke(cli, [
            'review', 'update-status', '999', 'approved'
        ])
        
        assert result.exit_code == 1
        assert 'Review with ID 999 not found' in result.output


class TestDashboardCommands:
    """Test cases for dashboard commands"""
    
    def test_dashboard_summary(self, db_setup):
        """Test dashboard summary command"""
        runner = CliRunner()
        result = runner.invoke(cli, ['dashboard', 'summary'])
        
        assert result.exit_code == 0
        assert 'Review Workflow Summary' in result.output
        assert 'Total Reviews:' in result.output
        assert 'Pending:' in result.output
        assert 'In Progress:' in result.output
        assert 'Completed:' in result.output
        assert 'Average Completion Time:' in result.output
        
    def test_dashboard_summary_custom_days(self, db_setup):
        """Test dashboard summary with custom day range"""
        runner = CliRunner()
        result = runner.invoke(cli, ['dashboard', 'summary', '--days', '30'])
        
        assert result.exit_code == 0
        assert '(Last 30 days)' in result.output


class TestCLIErrorHandling:
    """Test cases for CLI error handling"""
    
    def test_invalid_command(self):
        """Test handling of invalid commands"""
        runner = CliRunner()
        result = runner.invoke(cli, ['invalid-command'])
        
        assert result.exit_code == 2
        assert 'No such command' in result.output
        
    def test_invalid_subcommand(self):
        """Test handling of invalid subcommands"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'invalid-subcommand'])
        
        assert result.exit_code == 2
        assert 'No such command' in result.output
        
    def test_missing_required_argument(self):
        """Test handling of missing required arguments"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'status'])
        
        assert result.exit_code == 2
        assert 'Missing argument' in result.output
        
    def test_invalid_choice_option(self):
        """Test handling of invalid choice options"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list', '--status', 'invalid-status'])
        
        assert result.exit_code == 2
        assert 'Invalid value' in result.output


class TestCLIHelp:
    """Test cases for CLI help system"""
    
    def test_main_help(self):
        """Test main CLI help"""
        runner = CliRunner()
        result = runner.invoke(cli, ['--help'])
        
        assert result.exit_code == 0
        assert 'QA Review Workflow Management CLI' in result.output
        assert 'review' in result.output
        assert 'dashboard' in result.output
        
    def test_review_help(self):
        """Test review command help"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', '--help'])
        
        assert result.exit_code == 0
        assert 'Review workflow management commands' in result.output
        assert 'list' in result.output
        assert 'status' in result.output
        assert 'assign' in result.output
        assert 'create' in result.output
        
    def test_list_help(self):
        """Test list command help"""
        runner = CliRunner()
        result = runner.invoke(cli, ['review', 'list', '--help'])
        
        assert result.exit_code == 0
        assert 'List review workflows' in result.output
        assert '--status' in result.output
        assert '--priority' in result.output
        assert '--assignee' in result.output