"""add_sla_tracking_system

Revision ID: 4a8b9c5d6e7f
Revises: c70aa6ede9d1
Create Date: 2025-09-01 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '4a8b9c5d6e7f'
down_revision: Union[str, Sequence[str], None] = 'c70aa6ede9d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add SLA tracking system tables."""
    
    # Create workflow_sla_policies table
    op.create_table(
        'workflow_sla_policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='reviewpriority'), nullable=False),
        sa.Column('initial_response_minutes', sa.Integer(), nullable=False),
        sa.Column('completion_minutes', sa.Integer(), nullable=False),
        sa.Column('warning_threshold_percent', sa.Integer(), nullable=True),
        sa.Column('escalation_threshold_percent', sa.Integer(), nullable=True),
        sa.Column('escalation_enabled', sa.Boolean(), nullable=True),
        sa.Column('auto_reassign_enabled', sa.Boolean(), nullable=True),
        sa.Column('escalation_recipients', sqlite.JSON(), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('priority')
    )
    op.create_index(op.f('ix_workflow_sla_policies_id'), 'workflow_sla_policies', ['id'], unique=False)
    op.create_index(op.f('ix_workflow_sla_policies_priority'), 'workflow_sla_policies', ['priority'], unique=True)
    
    # Create workflow_sla_tracking table
    op.create_table(
        'workflow_sla_tracking',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('review_workflow_id', sa.Integer(), nullable=False),
        sa.Column('sla_policy_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('ON_TRACK', 'AT_RISK', 'BREACHED', 'ESCALATED', name='slastatus'), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('first_response_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('initial_response_due_at', sa.DateTime(), nullable=False),
        sa.Column('completion_due_at', sa.DateTime(), nullable=False),
        sa.Column('initial_response_breached', sa.Boolean(), nullable=True),
        sa.Column('completion_breached', sa.Boolean(), nullable=True),
        sa.Column('breach_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('warning_sent_at', sa.DateTime(), nullable=True),
        sa.Column('escalation_sent_at', sa.DateTime(), nullable=True),
        sa.Column('escalation_count', sa.Integer(), nullable=True),
        sa.Column('last_escalation_type', sa.Enum('WARNING', 'ESCALATION', 'CRITICAL_ESCALATION', name='escalationtype'), nullable=True),
        sa.Column('time_to_first_response_minutes', sa.Integer(), nullable=True),
        sa.Column('time_to_completion_minutes', sa.Integer(), nullable=True),
        sa.Column('sla_compliance_score', sa.Integer(), nullable=True),
        sa.Column('tracking_metadata', sqlite.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['review_workflow_id'], ['review_workflows.id'], ),
        sa.ForeignKeyConstraint(['sla_policy_id'], ['workflow_sla_policies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflow_sla_tracking_id'), 'workflow_sla_tracking', ['id'], unique=False)
    op.create_index(op.f('ix_workflow_sla_tracking_review_workflow_id'), 'workflow_sla_tracking', ['review_workflow_id'], unique=False)
    op.create_index(op.f('ix_workflow_sla_tracking_sla_policy_id'), 'workflow_sla_tracking', ['sla_policy_id'], unique=False)
    
    # Insert default SLA policies
    op.execute("""
        INSERT INTO workflow_sla_policies (priority, initial_response_minutes, completion_minutes, 
                                          warning_threshold_percent, escalation_threshold_percent,
                                          escalation_enabled, auto_reassign_enabled, is_active, created_at)
        VALUES 
            ('CRITICAL', 30, 180, 75, 100, 1, 0, 1, datetime('now')),
            ('HIGH', 60, 480, 75, 100, 1, 0, 1, datetime('now')),
            ('MEDIUM', 240, 1440, 75, 100, 1, 0, 1, datetime('now')),
            ('LOW', 480, 2880, 75, 100, 0, 0, 1, datetime('now'))
    """)


def downgrade() -> None:
    """Remove SLA tracking system tables."""
    op.drop_index(op.f('ix_workflow_sla_tracking_sla_policy_id'), table_name='workflow_sla_tracking')
    op.drop_index(op.f('ix_workflow_sla_tracking_review_workflow_id'), table_name='workflow_sla_tracking')
    op.drop_index(op.f('ix_workflow_sla_tracking_id'), table_name='workflow_sla_tracking')
    op.drop_table('workflow_sla_tracking')
    op.drop_index(op.f('ix_workflow_sla_policies_priority'), table_name='workflow_sla_policies')
    op.drop_index(op.f('ix_workflow_sla_policies_id'), table_name='workflow_sla_policies')
    op.drop_table('workflow_sla_policies')