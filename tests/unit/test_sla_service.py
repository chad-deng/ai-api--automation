"""
Unit tests for SLA Service
"""
import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.orm import Session

from src.database.models import (
    ReviewWorkflow, WorkflowSlaPolicy, WorkflowSlaTracking,
    ReviewPriority, ReviewStatus, SlaStatus, EscalationType
)
from src.review.sla_service import SlaService


class TestSlaService:
    """Test cases for SLA Service functionality"""
    
    @pytest.fixture
    def sla_service(self):
        """Create SLA service instance for testing"""
        return SlaService()
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        session = MagicMock(spec=Session)
        return session
    
    @pytest.fixture
    def sample_sla_policy(self):
        """Sample SLA policy for testing"""
        return WorkflowSlaPolicy(
            id=1,
            priority=ReviewPriority.HIGH,
            initial_response_minutes=60,
            completion_minutes=480,
            warning_threshold_percent=75,
            escalation_threshold_percent=100,
            escalation_enabled=True,
            auto_reassign_enabled=False,
            is_active=True
        )
    
    @pytest.fixture
    def sample_review_workflow(self):
        """Sample review workflow for testing"""
        return ReviewWorkflow(
            id=1,
            generated_test_id=1,
            title="Test Review",
            priority=ReviewPriority.HIGH,
            status=ReviewStatus.PENDING,
            created_at=datetime.now(timezone.utc)
        )

    @pytest.mark.asyncio
    async def test_initialize_sla_tracking(self, sla_service, mock_db_session, sample_review_workflow, sample_sla_policy):
        """Test SLA tracking initialization"""
        # Mock database operations
        with patch.object(sla_service, '_get_db_session', return_value=mock_db_session):
            mock_db_session.query.return_value.filter.return_value.first.side_effect = [
                sample_review_workflow,  # First call for workflow
                None,  # Second call for existing tracking (should be None)
                sample_sla_policy  # Third call for SLA policy
            ]
            
            # Mock the SLA tracking creation
            mock_sla_tracking = WorkflowSlaTracking(
                id=1,
                review_workflow_id=1,
                sla_policy_id=1,
                status=SlaStatus.ON_TRACK,
                started_at=sample_review_workflow.created_at,
                initial_response_due_at=sample_review_workflow.created_at + timedelta(minutes=60),
                completion_due_at=sample_review_workflow.created_at + timedelta(minutes=480)
            )
            
            mock_db_session.add.return_value = None
            mock_db_session.commit.return_value = None
            mock_db_session.refresh.return_value = None
            
            # Execute test
            result = await sla_service.initialize_sla_tracking(1)
            
            # Verify calls
            assert mock_db_session.add.called
            assert mock_db_session.commit.called
    
    @pytest.mark.asyncio
    async def test_update_sla_tracking_first_response(self, sla_service, mock_db_session):
        """Test SLA tracking update for first response"""
        # Create mock SLA tracking
        mock_sla_tracking = MagicMock()
        mock_sla_tracking.first_response_at = None
        mock_sla_tracking.started_at = datetime.now(timezone.utc) - timedelta(minutes=30)
        
        with patch.object(sla_service, '_get_db_session', return_value=mock_db_session):
            with patch.object(sla_service, '_update_sla_status') as mock_update_status:
                with patch.object(sla_service, '_check_and_handle_breaches') as mock_check_breaches:
                    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_sla_tracking
                    
                    # Execute test
                    result = await sla_service.update_sla_tracking(1, "first_response")
                    
                    # Verify SLA tracking was updated
                    assert result is True
                    assert mock_sla_tracking.first_response_at is not None
                    assert mock_sla_tracking.time_to_first_response_minutes == 30
                    
                    # Verify database operations
                    mock_db_session.commit.assert_called_once()
                    mock_update_status.assert_called_once()
                    mock_check_breaches.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_sla_tracking_completion(self, sla_service, mock_db_session):
        """Test SLA tracking update for workflow completion"""
        # Create mock SLA tracking
        mock_sla_tracking = MagicMock()
        mock_sla_tracking.completed_at = None
        mock_sla_tracking.started_at = datetime.now(timezone.utc) - timedelta(hours=2)
        
        with patch.object(sla_service, '_get_db_session', return_value=mock_db_session):
            with patch.object(sla_service, '_update_sla_status') as mock_update_status:
                with patch.object(sla_service, '_check_and_handle_breaches') as mock_check_breaches:
                    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_sla_tracking
                    
                    # Execute test
                    result = await sla_service.update_sla_tracking(1, "workflow_completed")
                    
                    # Verify SLA tracking was updated
                    assert result is True
                    assert mock_sla_tracking.completed_at is not None
                    assert mock_sla_tracking.time_to_completion_minutes == 120
                    
                    # Verify database operations
                    mock_db_session.commit.assert_called_once()
                    mock_update_status.assert_called_once()
                    mock_check_breaches.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_escalation(self, sla_service):
        """Test SLA escalation handling"""
        # Create mock SLA tracking
        mock_sla_tracking = MagicMock()
        mock_sla_tracking.id = 1
        mock_sla_tracking.escalation_count = 0
        mock_sla_tracking.sla_policy = MagicMock()
        mock_sla_tracking.sla_policy.auto_reassign_enabled = False
        
        with patch.object(sla_service, '_send_escalation_notification') as mock_send_notification:
            with patch.object(sla_service, '_handle_auto_reassignment') as mock_auto_reassign:
                # Execute test
                result = await sla_service.handle_escalation(mock_sla_tracking, EscalationType.WARNING)
                
                # Verify escalation was handled
                assert result is True
                assert mock_sla_tracking.escalation_count == 1
                assert mock_sla_tracking.last_escalation_type == EscalationType.WARNING
                assert mock_sla_tracking.warning_sent_at is not None
                
                # Verify notification was sent
                mock_send_notification.assert_called_once_with(mock_sla_tracking, EscalationType.WARNING)
                
                # Verify auto-reassignment was not called (disabled)
                mock_auto_reassign.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_sla_metrics(self, sla_service, mock_db_session):
        """Test SLA metrics calculation"""
        # Create mock tracking records
        mock_tracking_records = [
            MagicMock(
                status=SlaStatus.ON_TRACK,
                completed_at=datetime.now(timezone.utc),
                time_to_first_response_minutes=30,
                time_to_completion_minutes=120,
                escalation_count=0
            ),
            MagicMock(
                status=SlaStatus.BREACHED,
                completed_at=None,
                time_to_first_response_minutes=90,
                time_to_completion_minutes=None,
                escalation_count=1
            ),
            MagicMock(
                status=SlaStatus.AT_RISK,
                completed_at=None,
                time_to_first_response_minutes=45,
                time_to_completion_minutes=None,
                escalation_count=0
            )
        ]
        
        with patch.object(sla_service, '_get_db_session', return_value=mock_db_session):
            mock_db_session.query.return_value.filter.return_value.all.return_value = mock_tracking_records
            
            # Execute test
            metrics = await sla_service.get_sla_metrics(days=30)
            
            # Verify metrics calculation
            assert metrics['total_workflows'] == 3
            assert metrics['completed_workflows'] == 1
            assert metrics['sla_compliance_rate'] == 33.33333333333333  # 1 out of 3 on track
            assert metrics['avg_response_time_minutes'] == 55.0  # (30 + 90 + 45) / 3
            assert metrics['avg_completion_time_minutes'] == 120.0  # Only 1 completed
            assert metrics['breach_count'] == 1
            assert metrics['at_risk_count'] == 1
            assert metrics['escalation_count'] == 1
    
    @pytest.mark.asyncio
    async def test_check_sla_breaches(self, sla_service, mock_db_session):
        """Test SLA breach detection"""
        # Create mock active tracking with different statuses
        current_time = datetime.now(timezone.utc)
        
        mock_tracking_1 = MagicMock()
        mock_tracking_1.id = 1
        mock_tracking_1.review_workflow_id = 1
        mock_tracking_1.status = SlaStatus.ON_TRACK
        mock_tracking_1.sla_policy = MagicMock()
        mock_tracking_1.sla_policy.priority = ReviewPriority.HIGH
        mock_tracking_1.initial_response_due_at = current_time - timedelta(hours=1)
        mock_tracking_1.completion_due_at = current_time + timedelta(hours=6)
        mock_tracking_1.breach_duration_minutes = 0
        
        mock_active_tracking = [mock_tracking_1]
        
        # Mock the review workflow query
        mock_review_workflow = MagicMock()
        mock_review_workflow.status = ReviewStatus.IN_PROGRESS
        
        with patch.object(sla_service, '_get_db_session', return_value=mock_db_session):
            with patch.object(sla_service, '_update_sla_status') as mock_update_status:
                with patch.object(sla_service, '_check_and_handle_breaches') as mock_check_breaches:
                    mock_db_session.query.return_value.join.return_value.filter.return_value.limit.return_value.all.return_value = mock_active_tracking
                    
                    # Mock status change
                    def mock_status_update(tracking, time):
                        tracking.status = SlaStatus.BREACHED
                    
                    mock_update_status.side_effect = mock_status_update
                    
                    # Execute test
                    breaches = await sla_service.check_sla_breaches()
                    
                    # Verify breach detection
                    assert len(breaches) == 1
                    assert breaches[0]['workflow_id'] == 1
                    assert breaches[0]['old_status'] == SlaStatus.ON_TRACK.value
                    assert breaches[0]['new_status'] == SlaStatus.BREACHED.value
                    
                    # Verify database operations
                    mock_db_session.commit.assert_called_once()
                    mock_update_status.assert_called_once()
                    mock_check_breaches.assert_called_once()

    def test_sla_status_enum_values(self):
        """Test SLA status enum has expected values"""
        assert SlaStatus.ON_TRACK.value == "on_track"
        assert SlaStatus.AT_RISK.value == "at_risk"
        assert SlaStatus.BREACHED.value == "breached"
        assert SlaStatus.ESCALATED.value == "escalated"
    
    def test_escalation_type_enum_values(self):
        """Test escalation type enum has expected values"""
        assert EscalationType.WARNING.value == "warning"
        assert EscalationType.ESCALATION.value == "escalation"
        assert EscalationType.CRITICAL_ESCALATION.value == "critical_escalation"


@pytest.mark.asyncio
async def test_sla_service_integration():
    """Integration test for SLA service workflow"""
    sla_service = SlaService()
    
    # Test that service can be instantiated
    assert sla_service is not None
    assert hasattr(sla_service, 'initialize_sla_tracking')
    assert hasattr(sla_service, 'update_sla_tracking')
    assert hasattr(sla_service, 'check_sla_breaches')
    assert hasattr(sla_service, 'handle_escalation')
    assert hasattr(sla_service, 'get_sla_metrics')


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])