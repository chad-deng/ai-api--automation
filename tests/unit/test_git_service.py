"""
Unit tests for Git Integration Service
"""
import pytest
import tempfile
import shutil
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone

from src.git.service import GitService
from src.git.models import GitRepository, GitOperation, PullRequest
from src.database.models import ReviewWorkflow, GeneratedTest, ReviewStatus, ReviewPriority


@pytest.fixture
def git_service():
    """Create GitService instance for testing"""
    return GitService()


@pytest.fixture
def temp_repo_dir():
    """Create temporary directory for test repository"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def mock_repo_entry():
    """Mock repository entry"""
    repo = Mock(spec=GitRepository)
    repo.id = 1
    repo.name = "test-repo"
    repo.local_path = "/tmp/test-repo"
    repo.default_branch = "main"
    return repo


@pytest.fixture
def mock_review():
    """Mock review workflow"""
    review = Mock(spec=ReviewWorkflow)
    review.id = 1
    review.title = "Test Review"
    review.description = "Test description"
    review.status = ReviewStatus.APPROVED
    review.priority = ReviewPriority.HIGH
    review.assignee_id = "test-user"
    review.reviewer_id = "test-reviewer"
    review.created_at = datetime.now(timezone.utc)
    review.updated_at = datetime.now(timezone.utc)
    
    # Mock generated test
    generated_test = Mock(spec=GeneratedTest)
    generated_test.id = 1
    generated_test.test_name = "test_example_api"
    generated_test.file_path = "tests/test_example_api.py"
    generated_test.test_content = "def test_example():\n    assert True"
    generated_test.created_at = datetime.now(timezone.utc)
    
    review.generated_test = generated_test
    return review


class TestGitService:
    """Test GitService functionality"""
    
    @pytest.mark.asyncio
    async def test_create_repository_entry(self, git_service):
        """Test creating repository entry"""
        with patch.object(git_service, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            repo = await git_service.create_repository_entry(
                name="test-repo",
                remote_url="https://github.com/test/repo.git",
                local_path="/tmp/test-repo"
            )
            
            # Verify database operations
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
            mock_session.refresh.assert_called_once()
            mock_session.close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_repository(self, git_service):
        """Test getting repository by ID"""
        with patch.object(git_service, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            # Mock query result
            mock_session.query.return_value.filter.return_value.first.return_value = mock_repo_entry
            
            repo = await git_service.get_repository(1)
            
            assert repo == mock_repo_entry
            mock_session.close.assert_called_once()
    
    def test_sanitize_branch_name(self, git_service):
        """Test branch name sanitization"""
        # Test normal case
        result = git_service._sanitize_branch_name("Test Review Title")
        assert result == "test-review-title"
        
        # Test with special characters
        result = git_service._sanitize_branch_name("Test/Review@Title!#$")
        assert result == "test-review-title"
        
        # Test with multiple dashes
        result = git_service._sanitize_branch_name("Test---Review---Title")
        assert result == "test-review-title"
        
        # Test length limit
        long_name = "a" * 150
        result = git_service._sanitize_branch_name(long_name)
        assert len(result) <= 100
    
    @pytest.mark.asyncio
    @patch('src.git.service.git.Repo')
    async def test_create_feature_branch(self, mock_git_repo, git_service, mock_repo_entry, mock_review):
        """Test creating feature branch"""
        with patch.object(git_service, '_get_db_session') as mock_db, \
             patch.object(git_service, 'get_repository') as mock_get_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_get_repo.return_value = mock_repo_entry
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            
            # Mock Git repository
            mock_repo_instance = Mock()
            mock_git_repo.return_value = mock_repo_instance
            mock_branch = Mock()
            mock_repo_instance.create_head.return_value = mock_branch
            
            # Execute
            branch_name, git_op = await git_service.create_feature_branch(
                repository_id=1,
                review_id=1
            )
            
            # Verify branch name format
            assert branch_name.startswith("test-review/1-")
            assert "test-review" in branch_name.lower()
            
            # Verify Git operations
            mock_repo_instance.git.checkout.assert_called()
            mock_repo_instance.git.pull.assert_called()
            mock_repo_instance.create_head.assert_called_with(branch_name)
            mock_branch.checkout.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('src.git.service.git.Repo')
    @patch('builtins.open')
    @patch('os.makedirs')
    async def test_commit_approved_test(self, mock_makedirs, mock_open, mock_git_repo, 
                                      git_service, mock_repo_entry, mock_review):
        """Test committing approved test"""
        with patch.object(git_service, '_get_db_session') as mock_db, \
             patch.object(git_service, 'get_repository') as mock_get_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_get_repo.return_value = mock_repo_entry
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            
            # Mock Git repository
            mock_repo_instance = Mock()
            mock_git_repo.return_value = mock_repo_instance
            mock_commit = Mock()
            mock_commit.hexsha = "abc123"
            mock_repo_instance.index.commit.return_value = mock_commit
            
            # Mock file operations
            mock_file = Mock()
            mock_open.return_value.__enter__.return_value = mock_file
            
            # Execute
            git_op = await git_service.commit_approved_test(
                repository_id=1,
                review_id=1,
                branch_name="test-review/1-test"
            )
            
            # Verify file operations
            mock_makedirs.assert_called_once()
            mock_open.assert_called_once()
            mock_file.write.assert_called_with(mock_review.generated_test.test_content)
            
            # Verify Git operations
            mock_repo_instance.git.checkout.assert_called_with("test-review/1-test")
            mock_repo_instance.git.add.assert_called()
            mock_repo_instance.index.commit.assert_called()
    
    def test_generate_commit_message(self, git_service, mock_review):
        """Test commit message generation"""
        commit_msg = git_service._generate_commit_message(mock_review)
        
        # Verify message format
        assert commit_msg.startswith("test: add test_example_api")
        assert f"review #{mock_review.id}" in commit_msg
        assert mock_review.generated_test.file_path in commit_msg
        assert mock_review.status.value in commit_msg
        assert mock_review.priority.value in commit_msg
        assert mock_review.assignee_id in commit_msg
        assert mock_review.reviewer_id in commit_msg
    
    @pytest.mark.asyncio
    async def test_create_pull_request(self, git_service, mock_repo_entry, mock_review):
        """Test creating pull request"""
        with patch.object(git_service, '_get_db_session') as mock_db, \
             patch.object(git_service, 'get_repository') as mock_get_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_get_repo.return_value = mock_repo_entry
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            
            # Execute
            pr = await git_service.create_pull_request(
                repository_id=1,
                review_id=1,
                source_branch="test-review/1-test"
            )
            
            # Verify PR creation
            mock_session.add.assert_called()
            mock_session.commit.assert_called()
    
    def test_generate_pr_description(self, git_service, mock_review):
        """Test PR description generation"""
        description = git_service._generate_pr_description(mock_review)
        
        # Verify description content
        assert "## Automated Test Addition" in description
        assert f"Review ID**: #{mock_review.id}" in description
        assert mock_review.generated_test.test_name in description
        assert mock_review.generated_test.file_path in description
        assert mock_review.status.value in description
        assert mock_review.priority.value in description
        assert mock_review.assignee_id in description
        assert mock_review.reviewer_id in description
        assert "AI API Test Automation system" in description
    
    @pytest.mark.asyncio
    async def test_get_git_operations(self, git_service):
        """Test getting Git operations with filtering"""
        with patch.object(git_service, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            
            # Mock query chain
            mock_query = Mock()
            mock_session.query.return_value = mock_query
            mock_query.order_by.return_value.limit.return_value.all.return_value = []
            
            # Execute
            operations = await git_service.get_git_operations(
                repository_id=1,
                limit=10
            )
            
            # Verify query
            mock_session.query.assert_called()
            mock_query.order_by.assert_called()
            mock_query.limit.assert_called_with(10)
    
    @pytest.mark.asyncio
    @patch('src.git.service.git.Repo')
    async def test_cleanup_merged_branches(self, mock_git_repo, git_service, mock_repo_entry):
        """Test cleaning up merged branches"""
        with patch.object(git_service, '_get_db_session') as mock_db, \
             patch.object(git_service, 'get_repository') as mock_get_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_get_repo.return_value = mock_repo_entry
            
            # Mock merged PRs
            mock_pr = Mock(spec=PullRequest)
            mock_pr.source_branch = "test-review/1-old"
            mock_pr.review_workflow_id = 1
            mock_session.query.return_value.filter.return_value.all.return_value = [mock_pr]
            
            # Mock Git repository
            mock_repo_instance = Mock()
            mock_git_repo.return_value = mock_repo_instance
            mock_branch = Mock()
            mock_branch.name = "test-review/1-old"
            mock_repo_instance.branches = [mock_branch]
            
            # Execute
            cleaned_branches = await git_service.cleanup_merged_branches(
                repository_id=1,
                days_old=7
            )
            
            # Verify cleanup
            assert "test-review/1-old" in cleaned_branches
            mock_repo_instance.git.branch.assert_called_with('-d', 'test-review/1-old')


class TestGitServiceErrorHandling:
    """Test error handling in GitService"""
    
    @pytest.mark.asyncio
    async def test_repository_not_found(self, git_service):
        """Test handling when repository is not found"""
        with patch.object(git_service, '_get_db_session') as mock_db:
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_session.query.return_value.filter.return_value.first.return_value = None
            
            repo = await git_service.get_repository(999)
            assert repo is None
    
    @pytest.mark.asyncio
    async def test_create_branch_invalid_repo(self, git_service):
        """Test creating branch with invalid repository"""
        with patch.object(git_service, 'get_repository') as mock_get_repo:
            mock_get_repo.return_value = None
            
            with pytest.raises(ValueError, match="Repository .* not found"):
                await git_service.create_feature_branch(
                    repository_id=999,
                    review_id=1
                )
    
    @pytest.mark.asyncio
    @patch('src.git.service.git.Repo')
    async def test_git_operation_failure(self, mock_git_repo, git_service, mock_repo_entry, mock_review):
        """Test handling Git operation failures"""
        with patch.object(git_service, '_get_db_session') as mock_db, \
             patch.object(git_service, 'get_repository') as mock_get_repo:
            
            # Setup mocks
            mock_session = Mock()
            mock_db.return_value = mock_session
            mock_get_repo.return_value = mock_repo_entry
            mock_session.query.return_value.filter.return_value.first.return_value = mock_review
            
            # Make Git operation fail
            mock_git_repo.side_effect = Exception("Git error")
            
            with pytest.raises(Exception, match="Git error"):
                await git_service.create_feature_branch(
                    repository_id=1,
                    review_id=1
                )