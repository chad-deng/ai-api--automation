"""
Integration tests for Git Integration
"""
import pytest
import tempfile
import shutil
import os
import git
from unittest.mock import patch, Mock
from datetime import datetime, timezone

from src.git.service import GitService
from src.git.automation import AutomationWorkflow
from src.git.conflict_resolver import GitConflictResolver
from src.database.models import ReviewWorkflow, GeneratedTest, ReviewStatus, ReviewPriority
from src.git.models import GitRepository


@pytest.fixture
def temp_git_repo():
    """Create a temporary Git repository for testing"""
    temp_dir = tempfile.mkdtemp()
    
    # Initialize Git repository
    repo = git.Repo.init(temp_dir)
    
    # Configure Git
    repo.config_writer().set_value("user", "name", "Test User").release()
    repo.config_writer().set_value("user", "email", "test@example.com").release()
    
    # Create initial commit
    readme_path = os.path.join(temp_dir, "README.md")
    with open(readme_path, "w") as f:
        f.write("# Test Repository\n")
    
    repo.git.add("README.md")
    repo.index.commit("Initial commit")
    
    yield temp_dir, repo
    
    shutil.rmtree(temp_dir)


@pytest.fixture
def real_repo_entry(temp_git_repo):
    """Create a real repository entry for testing"""
    temp_dir, repo = temp_git_repo
    
    repo_entry = GitRepository(
        id=1,
        name="test-repo",
        remote_url="https://github.com/test/repo.git",
        local_path=temp_dir,
        default_branch="main"
    )
    
    return repo_entry


@pytest.fixture
def sample_review():
    """Create a sample review for testing"""
    generated_test = GeneratedTest(
        id=1,
        webhook_event_id="webhook-123",
        test_name="test_user_registration",
        test_content='''
import pytest
import requests

def test_user_registration():
    """Test user registration endpoint"""
    payload = {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    }
    
    response = requests.post("/api/users/register", json=payload)
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"
''',
        file_path="tests/test_user_registration.py",
        created_at=datetime.now(timezone.utc)
    )
    
    review = ReviewWorkflow(
        id=1,
        generated_test_id=1,
        title="Test User Registration API",
        description="Automated test for user registration endpoint",
        status=ReviewStatus.APPROVED,
        priority=ReviewPriority.HIGH,
        assignee_id="developer1",
        reviewer_id="reviewer1",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    # Link the objects
    review.generated_test = generated_test
    
    return review


class TestGitIntegration:
    """Integration tests for Git operations"""
    
    def test_git_repository_operations(self, temp_git_repo):
        """Test basic Git repository operations"""
        temp_dir, repo = temp_git_repo
        
        # Verify repository is initialized
        assert repo.bare is False
        assert repo.heads.master or repo.heads.main
        
        # Test creating a new branch
        test_branch = repo.create_head("test-branch")
        test_branch.checkout()
        
        # Create and commit a test file
        test_file_path = os.path.join(temp_dir, "test_file.py")
        with open(test_file_path, "w") as f:
            f.write("def test_example():\n    assert True\n")
        
        repo.git.add("test_file.py")
        commit = repo.index.commit("Add test file")
        
        # Verify commit
        assert commit.hexsha
        assert "Add test file" in commit.message
        assert "test_file.py" in repo.git.diff("HEAD~1", name_only=True)
    
    @pytest.mark.asyncio
    async def test_full_workflow_integration(self, temp_git_repo, sample_review):
        """Test complete Git workflow integration"""
        temp_dir, repo = temp_git_repo
        
        with patch('src.git.service.GitService._get_db_session') as mock_db_session:
            # Mock database operations
            mock_session = Mock()
            mock_db_session.return_value = mock_session
            
            # Mock repository retrieval
            repo_entry = GitRepository(
                id=1,
                name="test-repo",
                local_path=temp_dir,
                default_branch="master"  # Use master as it's what git.Repo.init creates
            )
            
            git_service = GitService()
            
            with patch.object(git_service, 'get_repository') as mock_get_repo, \
                 patch.object(mock_session, 'query') as mock_query:
                
                mock_get_repo.return_value = repo_entry
                mock_query.return_value.filter.return_value.first.return_value = sample_review
                
                # Test 1: Create feature branch
                branch_name, git_op = await git_service.create_feature_branch(
                    repository_id=1,
                    review_id=1
                )
                
                # Verify branch was created
                assert branch_name.startswith("test-review/1-")
                assert branch_name in [b.name for b in repo.branches]
                
                # Test 2: Commit test file
                with patch('os.makedirs'), \
                     patch('builtins.open', create=True) as mock_open:
                    
                    mock_file = Mock()
                    mock_open.return_value.__enter__.return_value = mock_file
                    
                    git_op = await git_service.commit_approved_test(
                        repository_id=1,
                        review_id=1,
                        branch_name=branch_name
                    )
                    
                    # Verify file was "written" and commit attempted
                    mock_file.write.assert_called_with(sample_review.generated_test.test_content)
    
    @pytest.mark.asyncio
    async def test_conflict_detection_integration(self, temp_git_repo):
        """Test conflict detection with real Git repository"""
        temp_dir, repo = temp_git_repo
        
        # Create conflicting changes on two branches
        
        # Create master branch content
        test_file_path = os.path.join(temp_dir, "test_file.py")
        with open(test_file_path, "w") as f:
            f.write("def test_function():\n    # Original implementation\n    assert True\n")
        
        repo.git.add("test_file.py")
        repo.index.commit("Add original test file")
        
        # Create feature branch with changes
        feature_branch = repo.create_head("feature-branch")
        feature_branch.checkout()
        
        with open(test_file_path, "w") as f:
            f.write("def test_function():\n    # Feature branch implementation\n    assert False\n")
        
        repo.git.add("test_file.py")
        repo.index.commit("Modify test file in feature branch")
        
        # Switch back to master and make conflicting changes
        repo.git.checkout("master")
        
        with open(test_file_path, "w") as f:
            f.write("def test_function():\n    # Master branch implementation\n    assert None\n")
        
        repo.git.add("test_file.py")
        repo.index.commit("Modify test file in master")
        
        # Now test conflict detection
        conflict_resolver = GitConflictResolver()
        
        with patch.object(conflict_resolver.git_service, 'get_repository') as mock_get_repo, \
             patch.object(conflict_resolver, '_get_db_session') as mock_db_session:
            
            mock_session = Mock()
            mock_db_session.return_value = mock_session
            
            repo_entry = GitRepository(
                id=1,
                name="test-repo",
                local_path=temp_dir,
                default_branch="master"
            )
            mock_get_repo.return_value = repo_entry
            
            # Test conflict detection
            conflicts = await conflict_resolver.detect_conflicts(
                repository_id=1,
                source_branch="feature-branch",
                target_branch="master"
            )
            
            # Verify conflicts were detected
            assert conflicts["has_conflicts"] is True
            assert len(conflicts["conflicts"]) > 0
            
            # Check conflict details
            conflict = conflicts["conflicts"][0]
            assert conflict["file_path"] == "test_file.py"
            assert conflict["conflict_type"] in ["content", "both_modified"]
    
    def test_branch_naming_conventions(self):
        """Test branch naming conventions and sanitization"""
        git_service = GitService()
        
        test_cases = [
            ("Simple Test", "simple-test"),
            ("Test/With@Special#Characters!", "test-with-special-characters"),
            ("Test---Multiple---Dashes", "test-multiple-dashes"),
            ("Test with UPPERCASE and numbers 123", "test-with-uppercase-and-numbers-123"),
            ("VeryLongTestNameThatExceedsTheNormalLengthLimitForBranchNamesAndShouldBeTruncated" * 2, None),  # Should be truncated
        ]
        
        for input_name, expected in test_cases:
            result = git_service._sanitize_branch_name(input_name)
            
            if expected:
                assert result == expected
            
            # Verify result follows Git branch naming rules
            assert len(result) <= 100
            assert not result.startswith('-')
            assert not result.endswith('-')
            assert '--' not in result
            assert result.islower()
    
    @pytest.mark.asyncio
    async def test_pr_description_generation(self, sample_review):
        """Test PR description generation with real review data"""
        git_service = GitService()
        
        # Add some metrics to the review
        from src.database.models import ReviewMetrics, CommentType, ReviewComment
        
        metrics = Mock()
        metrics.time_to_completion_minutes = 120
        metrics.total_comments = 3
        metrics.issues_found = 1
        metrics.suggestions_made = 2
        metrics.overall_score = 8
        sample_review.metrics = metrics
        
        # Add some comments
        comments = [
            Mock(
                comment_type=CommentType.ISSUE,
                author_id="reviewer1",
                content="Missing error handling for invalid input"
            ),
            Mock(
                comment_type=CommentType.SUGGESTION,
                author_id="reviewer1",
                content="Consider adding more test cases for edge conditions"
            ),
            Mock(
                comment_type=CommentType.APPROVAL,
                author_id="reviewer1",
                content="Code looks good after changes"
            )
        ]
        sample_review.comments = comments
        
        # Generate PR description
        description = git_service._generate_pr_description(sample_review)
        
        # Verify description content
        assert "## Automated Test Addition" in description
        assert f"Review ID**: #{sample_review.id}" in description
        assert sample_review.generated_test.test_name in description
        assert sample_review.generated_test.file_path in description
        assert sample_review.status.value in description
        assert sample_review.priority.value in description
        assert sample_review.assignee_id in description
        assert sample_review.reviewer_id in description
        
        # Verify metrics section
        assert "## Quality Metrics" in description
        assert "Review Time**: 120 minutes" in description
        assert "Total Comments**: 3" in description
        assert "Issues Found**: 1" in description
        assert "Suggestions Made**: 2" in description
        assert "Quality Score**: 8/10" in description
        
        # Verify comments section
        assert "## Review Comments (3)" in description
        assert "Missing error handling" in description
        assert "Consider adding more test cases" in description
        assert "Code looks good" in description
        
        # Verify footer
        assert "AI API Test Automation system" in description
    
    @pytest.mark.asyncio
    async def test_commit_message_generation(self, sample_review):
        """Test commit message generation with real review data"""
        git_service = GitService()
        
        # Add metrics to review
        metrics = Mock()
        metrics.time_to_completion_minutes = 90
        metrics.overall_score = 9
        sample_review.metrics = metrics
        
        # Generate commit message
        commit_msg = git_service._generate_commit_message(sample_review)
        
        # Verify conventional commit format
        assert commit_msg.startswith("test: add test_user_registration")
        
        # Verify review information
        assert f"Generated test for review #{sample_review.id}" in commit_msg
        assert f"Test file: {sample_review.generated_test.file_path}" in commit_msg
        assert f"Description: {sample_review.description}" in commit_msg
        assert f"Status: {sample_review.status.value}" in commit_msg
        assert f"Priority: {sample_review.priority.value}" in commit_msg
        assert f"Assignee: {sample_review.assignee_id}" in commit_msg
        assert f"Reviewer: {sample_review.reviewer_id}" in commit_msg
        
        # Verify metrics information
        assert "Review completion time: 90min" in commit_msg
        assert "Quality score: 9/10" in commit_msg
        
        # Verify commit message structure (should have proper line breaks)
        lines = commit_msg.split('\n')
        assert len(lines) > 3  # Header, blank line, and content
        assert lines[1] == ""  # Blank line after header


class TestGitErrorScenarios:
    """Test error scenarios in Git integration"""
    
    @pytest.mark.asyncio
    async def test_invalid_repository_path(self):
        """Test handling invalid repository path"""
        git_service = GitService()
        
        with pytest.raises(ValueError, match="Repository path does not exist"):
            git_service._get_repo_instance("/nonexistent/path")
    
    @pytest.mark.asyncio
    async def test_git_operation_failure_recovery(self, temp_git_repo, sample_review):
        """Test recovery from Git operation failures"""
        temp_dir, repo = temp_git_repo
        
        git_service = GitService()
        
        with patch.object(git_service, '_get_db_session') as mock_db_session, \
             patch.object(git_service, 'get_repository') as mock_get_repo:
            
            mock_session = Mock()
            mock_db_session.return_value = mock_session
            
            # Create repository entry with invalid path
            repo_entry = GitRepository(
                id=1,
                name="test-repo",
                local_path="/invalid/path",
                default_branch="main"
            )
            mock_get_repo.return_value = repo_entry
            mock_session.query.return_value.filter.return_value.first.return_value = sample_review
            
            # Attempt to create branch - should fail
            with pytest.raises(ValueError):
                await git_service.create_feature_branch(
                    repository_id=1,
                    review_id=1
                )
            
            # Verify error was recorded in database
            # (In real implementation, this would create a failed GitOperation record)
    
    def test_conflict_marker_parsing(self):
        """Test parsing of Git conflict markers"""
        conflict_resolver = GitConflictResolver()
        
        conflict_content = """
def test_function():
<<<<<<< HEAD
    # Current branch implementation
    return "current"
=======
    # Incoming branch implementation  
    return "incoming"
>>>>>>> feature-branch
"""
        
        sections = conflict_resolver._parse_conflict_markers(conflict_content)
        
        assert len(sections) == 1
        section = sections[0]
        
        assert "current branch implementation" in section["current_content"]
        assert "incoming branch implementation" in section["incoming_content"]
        assert section["current_branch"] == "HEAD"
        assert section["incoming_branch"] == "feature-branch"
    
    def test_auto_resolvable_conflict_detection(self):
        """Test detection of auto-resolvable conflicts"""
        conflict_resolver = GitConflictResolver()
        
        # Simple conflict - one side empty
        simple_conflict = """
def test_function():
<<<<<<< HEAD
    # Only current has content
    return "current"
=======
>>>>>>> feature-branch
"""
        
        assert conflict_resolver._is_auto_resolvable(simple_conflict) is True
        
        # Complex conflict - both sides have content
        complex_conflict = """
def test_function():
<<<<<<< HEAD
    # Current implementation
    return calculate_current()
=======
    # Different implementation
    return calculate_different()
>>>>>>> feature-branch
"""
        
        # This would require more sophisticated analysis
        # For now, complex conflicts are not auto-resolvable
        assert conflict_resolver._is_auto_resolvable(complex_conflict) is False