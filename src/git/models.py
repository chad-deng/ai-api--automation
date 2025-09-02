"""
Git Integration Database Models
Extends the existing database schema with Git operation tracking
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from src.database.models import Base


class GitOperationStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class GitOperationType(enum.Enum):
    BRANCH_CREATE = "branch_create"
    PR_CREATE = "pr_create"
    PR_UPDATE = "pr_update"
    MERGE = "merge"
    BRANCH_DELETE = "branch_delete"
    COMMIT = "commit"
    TAG = "tag"


class PullRequestStatus(enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"
    MERGED = "merged"
    CLOSED = "closed"
    CONFLICT = "conflict"


class GitRepository(Base):
    __tablename__ = "git_repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    remote_url = Column(String(500), nullable=False)
    local_path = Column(String(500), nullable=True)
    default_branch = Column(String(100), default="main", nullable=False)
    webhook_secret = Column(String(255), nullable=True)
    github_token = Column(String(255), nullable=True)  # Encrypted
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    operations = relationship("GitOperation", back_populates="repository")
    pull_requests = relationship("PullRequest", back_populates="repository")


class GitOperation(Base):
    __tablename__ = "git_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("git_repositories.id"), nullable=False, index=True)
    review_workflow_id = Column(Integer, ForeignKey("review_workflows.id"), nullable=True, index=True)
    operation_type = Column(Enum(GitOperationType), nullable=False)
    status = Column(Enum(GitOperationStatus), default=GitOperationStatus.PENDING)
    
    # Git-specific details
    branch_name = Column(String(255), nullable=True)
    commit_sha = Column(String(40), nullable=True)
    pr_number = Column(Integer, nullable=True)
    tag_name = Column(String(100), nullable=True)
    
    # Execution details
    command = Column(Text, nullable=True)
    output = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    execution_time_seconds = Column(Integer, nullable=True)
    
    # Metadata
    operation_metadata = Column(JSON, nullable=True)
    triggered_by = Column(String(255), nullable=True)  # User ID or system
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    repository = relationship("GitRepository", back_populates="operations")
    review_workflow = relationship("ReviewWorkflow")


class PullRequest(Base):
    __tablename__ = "pull_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("git_repositories.id"), nullable=False, index=True)
    review_workflow_id = Column(Integer, ForeignKey("review_workflows.id"), nullable=False, index=True)
    
    # PR identifiers
    pr_number = Column(Integer, nullable=False)
    pr_url = Column(String(500), nullable=True)
    github_id = Column(String(50), nullable=True)  # GitHub PR ID
    
    # PR details
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    source_branch = Column(String(255), nullable=False)
    target_branch = Column(String(255), nullable=False)
    status = Column(Enum(PullRequestStatus), default=PullRequestStatus.DRAFT)
    
    # Author and assignees
    author_id = Column(String(255), nullable=False)
    assignees = Column(JSON, nullable=True)  # List of assignee IDs
    reviewers = Column(JSON, nullable=True)  # List of reviewer IDs
    
    # PR metadata
    labels = Column(JSON, nullable=True)  # List of labels
    milestone = Column(String(255), nullable=True)
    is_draft = Column(Boolean, default=True)
    mergeable = Column(Boolean, nullable=True)
    merge_commit_sha = Column(String(40), nullable=True)
    
    # Statistics
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    changed_files = Column(Integer, default=0)
    commits_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    merged_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Relationships
    repository = relationship("GitRepository", back_populates="pull_requests")
    review_workflow = relationship("ReviewWorkflow")
    commits = relationship("GitCommit", back_populates="pull_request")


class GitCommit(Base):
    __tablename__ = "git_commits"
    
    id = Column(Integer, primary_key=True, index=True)
    pull_request_id = Column(Integer, ForeignKey("pull_requests.id"), nullable=False, index=True)
    
    # Commit details
    sha = Column(String(40), nullable=False, unique=True, index=True)
    message = Column(Text, nullable=False)
    author_name = Column(String(255), nullable=False)
    author_email = Column(String(255), nullable=False)
    author_id = Column(String(255), nullable=True)  # Internal user ID
    
    # File changes
    files_changed = Column(JSON, nullable=True)  # List of changed files
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    
    # Timestamps
    committed_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    pull_request = relationship("PullRequest", back_populates="commits")


class GitWebhookEvent(Base):
    __tablename__ = "git_webhook_events"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("git_repositories.id"), nullable=False, index=True)
    
    # Event details
    event_type = Column(String(100), nullable=False)  # push, pull_request, etc.
    action = Column(String(100), nullable=True)  # opened, closed, merged, etc.
    delivery_id = Column(String(255), unique=True, index=True)
    
    # Source information
    sender_id = Column(String(255), nullable=True)
    sender_login = Column(String(255), nullable=True)
    
    # Related objects
    pr_number = Column(Integer, nullable=True)
    branch_name = Column(String(255), nullable=True)
    commit_sha = Column(String(40), nullable=True)
    
    # Event payload
    payload = Column(JSON, nullable=False)
    headers = Column(JSON, nullable=True)
    
    # Processing status
    processed = Column(Boolean, default=False)
    processing_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    repository = relationship("GitRepository")