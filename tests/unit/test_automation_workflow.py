"""
Unit tests for Git Automation Workflow
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone

from src.git.automation import AutomationWorkflow, WorkflowStage
from src.database.models import ReviewWorkflow, ReviewStatus, GeneratedTest
from src.git.models import GitRepository, PullRequestStatus


@pytest.fixture
def automation_workflow():
    """Create AutomationWorkflow instance for testing"""
    workflow = AutomationWorkflow()
    # Mock the services to avoid initialization issues
    workflow.git_service = Mock()
    workflow.conflict_resolver = Mock()
    workflow.notification_service = Mock()
    workflow.review_service = Mock()
    return workflow


@pytest.fixture
def mock_review():
    """Mock approved review workflow"""
    review = Mock(spec=ReviewWorkflow)
    review.id = 1
    review.title = "Test Review"
    review.description = "Test description"
    review.status = ReviewStatus.APPROVED
    review.assignee_id = "test-user"
    review.reviewer_id = "test-reviewer"
    
    # Mock generated test
    generated_test = Mock(spec=GeneratedTest)
    generated_test.id = 1
    generated_test.test_name = "test_example_api"
    generated_test.file_path = "tests/test_example_api.py"
    generated_test.test_content = "def test_example():\n    assert True"
    
    review.generated_test = generated_test
    return review


@pytest.fixture
def mock_pr_record():
    """Mock pull request record"""
    pr = Mock()
    pr.id = 1
    pr.pr_number = 123
    pr.title = "Add automated test: test_example_api"
    pr.target_branch = "main"
    pr.status = PullRequestStatus.OPEN
    return pr


class TestAutomationWorkflow:
    """Test AutomationWorkflow functionality"""
    
    @pytest.mark.asyncio
    async def test_process_approved_review_success(self, automation_workflow, mock_review):
        """Test successful processing of approved review"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db, \
             patch.object(automation_workflow, '_get_default_repository') as mock_default_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            mock_default_repo.return_value = 1
            
            # Mock successful workflow stages
            automation_workflow.git_service.create_feature_branch = AsyncMock(
                return_value=("test-branch", Mock(id=1))
            )
            automation_workflow.git_service.commit_approved_test = AsyncMock(
                return_value=Mock(id=2, commit_sha="abc123")
            )
            automation_workflow.git_service.create_pull_request = AsyncMock(
                return_value=Mock(id=1, pr_number=123, target_branch="main")
            )
            automation_workflow.conflict_resolver.detect_conflicts = AsyncMock(
                return_value={"has_conflicts": False, "merge_possible": True}
            )
            automation_workflow.notification_service.notify_review_approved = AsyncMock()
            
            # Execute
            result = await automation_workflow.process_approved_review(review_id=1)
            
            # Verify success
            assert result["success"] is True
            assert result["review_id"] == 1
            assert WorkflowStage.BRANCH_CREATED.value in result["stages"]
            assert WorkflowStage.TEST_COMMITTED.value in result["stages"]
            assert WorkflowStage.PR_CREATED.value in result["stages"]
            assert WorkflowStage.CONFLICTS_RESOLVED.value in result["stages"]
            
            # Verify notifications
            automation_workflow.notification_service.notify_review_approved.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_process_approved_review_not_approved(self, automation_workflow):
        """Test processing review that is not approved"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            # Mock review with wrong status
            mock_review = Mock()
            mock_review.id = 1
            mock_review.status = ReviewStatus.PENDING
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            
            # Execute
            result = await automation_workflow.process_approved_review(review_id=1)
            
            # Verify failure
            assert result["success"] is False
            assert "not approved" in result["error"]
    
    @pytest.mark.asyncio
    async def test_process_approved_review_with_conflicts(self, automation_workflow, mock_review, mock_pr_record):
        """Test processing review with merge conflicts"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db, \
             patch.object(automation_workflow, '_get_default_repository') as mock_default_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            mock_default_repo.return_value = 1
            
            # Mock successful initial stages
            automation_workflow.git_service.create_feature_branch = AsyncMock(
                return_value=("test-branch", Mock(id=1))
            )
            automation_workflow.git_service.commit_approved_test = AsyncMock(
                return_value=Mock(id=2, commit_sha="abc123")
            )
            automation_workflow.git_service.create_pull_request = AsyncMock(
                return_value=mock_pr_record
            )
            
            # Mock conflicts detected
            conflicts = [{"file_path": "test.py", "conflict_type": "content", "auto_resolvable": False}]
            automation_workflow.conflict_resolver.detect_conflicts = AsyncMock(
                return_value={"has_conflicts": True, "conflicts": conflicts}
            )
            automation_workflow.conflict_resolver.auto_resolve_conflicts = AsyncMock(
                return_value={"all_resolved": False, "failed_count": 1, "failed_resolutions": conflicts}
            )
            automation_workflow.notification_service.notify_conflict_detected = AsyncMock()
            automation_workflow.notification_service.notify_review_approved = AsyncMock()
            
            # Execute
            result = await automation_workflow.process_approved_review(review_id=1)
            
            # Verify partial success (conflicts not resolved)
            assert result["success"] is True  # Workflow completed, but with unresolved conflicts
            conflicts_stage = result["stages"][WorkflowStage.CONFLICTS_RESOLVED.value]
            assert conflicts_stage["success"] is False
            assert conflicts_stage["conflicts_detected"] is True
            assert conflicts_stage["conflicts_resolved"] is False
            
            # Verify conflict notification
            automation_workflow.notification_service.notify_conflict_detected.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_feature_branch_stage(self, automation_workflow, mock_review):
        """Test creating feature branch stage"""
        # Mock successful branch creation
        automation_workflow.git_service.create_feature_branch = AsyncMock(
            return_value=("test-review/1-test", Mock(id=1))
        )
        
        # Execute
        result = await automation_workflow._create_feature_branch(mock_review, 1)
        
        # Verify result
        assert result["success"] is True
        assert result["branch_name"] == "test-review/1-test"
        assert result["operation_id"] == 1
        assert "Created feature branch" in result["message"]
    
    @pytest.mark.asyncio
    async def test_commit_approved_test_stage(self, automation_workflow, mock_review):
        """Test committing approved test stage"""
        # Mock successful commit
        automation_workflow.git_service.commit_approved_test = AsyncMock(
            return_value=Mock(id=2, commit_sha="abc123")
        )
        
        # Execute
        result = await automation_workflow._commit_approved_test(
            mock_review, 1, "test-branch"
        )
        
        # Verify result
        assert result["success"] is True
        assert result["commit_sha"] == "abc123"
        assert result["operation_id"] == 2
        assert mock_review.generated_test.file_path in result["message"]
    
    @pytest.mark.asyncio
    async def test_create_pull_request_stage(self, automation_workflow, mock_review, mock_pr_record):
        """Test creating pull request stage"""
        # Mock successful PR creation
        automation_workflow.git_service.create_pull_request = AsyncMock(
            return_value=mock_pr_record
        )
        
        # Execute
        result = await automation_workflow._create_pull_request(
            mock_review, 1, "test-branch"
        )
        
        # Verify result
        assert result["success"] is True
        assert result["pr_id"] == 1
        assert result["pr_number"] == 123
        assert result["pr_record"] == mock_pr_record
    
    @pytest.mark.asyncio
    async def test_resolve_conflicts_no_conflicts(self, automation_workflow):
        """Test conflict resolution when no conflicts exist"""
        # Mock no conflicts detected
        automation_workflow.conflict_resolver.detect_conflicts = AsyncMock(
            return_value={"has_conflicts": False, "merge_possible": True}
        )
        
        # Execute
        result = await automation_workflow._resolve_conflicts(1, "source", "target")
        
        # Verify result
        assert result["success"] is True
        assert result["conflicts_detected"] is False
        assert "No conflicts detected" in result["message"]
    
    @pytest.mark.asyncio
    async def test_resolve_conflicts_auto_resolved(self, automation_workflow):
        """Test automatic conflict resolution"""
        # Mock conflicts detected and resolved
        conflicts = [{"file_path": "test.py", "auto_resolvable": True}]
        automation_workflow.conflict_resolver.detect_conflicts = AsyncMock(
            return_value={"has_conflicts": True, "conflicts": conflicts}
        )
        automation_workflow.conflict_resolver.auto_resolve_conflicts = AsyncMock(
            return_value={"all_resolved": True, "resolved_count": 1}
        )
        automation_workflow.notification_service.notify_conflict_detected = AsyncMock()
        
        # Execute
        result = await automation_workflow._resolve_conflicts(1, "source", "target")
        
        # Verify result
        assert result["success"] is True
        assert result["conflicts_detected"] is True
        assert result["conflicts_resolved"] is True
        assert result["resolved_count"] == 1
    
    @pytest.mark.asyncio
    async def test_trigger_ci_pipeline(self, automation_workflow, mock_pr_record):
        """Test triggering CI/CD pipeline"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            # Execute
            result = await automation_workflow._trigger_ci_pipeline(
                1, "test-branch", mock_pr_record
            )
            
            # Verify result
            assert result["success"] is True
            assert result["pipeline_triggered"] is True
            assert "CI/CD pipeline triggered" in result["message"]
            
            # Verify PR metadata updated
            assert mock_pr_record.metadata["ci_status"] == "running"
            assert "ci_triggered_at" in mock_pr_record.metadata
    
    @pytest.mark.asyncio
    async def test_process_rejected_review(self, automation_workflow):
        """Test processing rejected review"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db, \
             patch.object(automation_workflow, '_trigger_test_regeneration') as mock_regen:
            
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            # Mock rejected review
            mock_review = Mock()
            mock_review.id = 1
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            
            # Mock regeneration enabled
            automation_workflow.settings.auto_regenerate_rejected_tests = True
            mock_regen.return_value = {
                "success": True,
                "regeneration_triggered": True,
                "message": "Test regeneration queued"
            }
            
            automation_workflow.notification_service.notify_review_rejected = AsyncMock()
            
            # Execute
            result = await automation_workflow.process_rejected_review(
                review_id=1,
                rejection_reason="Test quality issues"
            )
            
            # Verify result
            assert result["success"] is True
            assert result["regeneration_triggered"] is True
            
            # Verify notifications
            automation_workflow.notification_service.notify_review_rejected.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_enforce_quality_gates(self, automation_workflow, mock_review):
        """Test quality gate enforcement"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            
            # Mock review metrics
            mock_metrics = Mock()
            mock_metrics.overall_score = 8
            mock_review.metrics = mock_metrics
            mock_review.comments = []
            
            # Mock settings
            automation_workflow.settings.minimum_quality_score = 7
            
            # Execute
            result = await automation_workflow.enforce_quality_gates(review_id=1)
            
            # Verify result
            assert result["success"] is True
            assert result["quality_gates_passed"] is True
            
            checks = result["checks"]
            assert checks["review_approved"] is True
            assert checks["has_reviewer"] is True
            assert checks["minimum_score"] is True
    
    @pytest.mark.asyncio
    async def test_handle_stalled_reviews(self, automation_workflow):
        """Test handling stalled reviews"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            # Mock stalled review
            mock_stalled_review = Mock()
            mock_stalled_review.id = 1
            mock_stalled_review.workflow_metadata = {}
            mock_session.query.return_value.filter.return_value.all.return_value = [mock_stalled_review]
            
            # Mock settings
            automation_workflow.settings.review_stall_threshold_hours = 48
            
            automation_workflow.notification_service.notify_review_stalled = AsyncMock()
            
            # Execute
            result = await automation_workflow.handle_stalled_reviews()
            
            # Verify result
            assert result["success"] is True
            assert result["stalled_count"] == 1
            assert result["escalated_count"] == 1
            
            # Verify escalation metadata
            assert "escalated_at" in mock_stalled_review.workflow_metadata
            assert mock_stalled_review.workflow_metadata["escalation_count"] == 1
            
            # Verify notification
            automation_workflow.notification_service.notify_review_stalled.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cleanup_completed_workflows(self, automation_workflow):
        """Test cleaning up completed workflows"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            # Mock repositories
            mock_repo = Mock(spec=GitRepository)
            mock_repo.id = 1
            mock_session.query.return_value.filter.return_value.all.return_value = [mock_repo]
            
            # Mock cleanup
            automation_workflow.git_service.cleanup_merged_branches = AsyncMock(
                return_value=["branch1", "branch2"]
            )
            
            # Execute
            result = await automation_workflow.cleanup_completed_workflows(days_old=7)
            
            # Verify result
            assert result["success"] is True
            assert result["repositories_processed"] == 1
            assert result["branches_cleaned"] == 2


class TestAutomationWorkflowErrorHandling:
    """Test error handling in AutomationWorkflow"""
    
    @pytest.mark.asyncio
    async def test_review_not_found(self, automation_workflow):
        """Test handling when review is not found"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_session.query.return_value.filter.return_value.first.return_value = None
            
            result = await automation_workflow.process_approved_review(review_id=999)
            
            assert result["success"] is False
            assert "Review 999 not found" in result["error"]
    
    @pytest.mark.asyncio
    async def test_workflow_stage_failure(self, automation_workflow, mock_review):
        """Test handling workflow stage failures"""
        with patch.object(automation_workflow, '_get_db_session') as mock_db, \
             patch.object(automation_workflow, '_get_default_repository') as mock_default_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            mock_default_repo.return_value = 1
            
            # Make branch creation fail
            automation_workflow.git_service.create_feature_branch = AsyncMock(
                side_effect=Exception("Git operation failed")
            )
            automation_workflow.notification_service.notify_review_rejected = AsyncMock()
            
            # Execute
            result = await automation_workflow.process_approved_review(review_id=1)
            
            # Verify failure handling
            assert result["success"] is False
            assert "Git operation failed" in result["error"]
            
            # Verify failure notification
            automation_workflow.notification_service.notify_review_rejected.assert_called_once()