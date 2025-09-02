"""Add workflow events table for event sourcing

Revision ID: c70aa6ede9d1
Revises: d223e3eba919
Create Date: 2025-09-01 15:57:22.961379

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c70aa6ede9d1'
down_revision: Union[str, Sequence[str], None] = 'd223e3eba919'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create workflow_events table for event sourcing
    op.create_table(
        'workflow_events',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, index=True),
        sa.Column('event_id', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('event_type', sa.String(length=100), nullable=False, index=True),
        sa.Column('aggregate_id', sa.String(length=255), nullable=False, index=True),
        sa.Column('aggregate_type', sa.String(length=50), nullable=False, default='review_workflow'),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('event_data', sa.JSON(), nullable=False),
        sa.Column('event_metadata', sa.JSON(), nullable=True),
        sa.Column('correlation_id', sa.String(length=255), nullable=False, index=True),
        sa.Column('causation_id', sa.String(length=255), nullable=True, index=True),
        sa.Column('user_id', sa.String(length=255), nullable=True, index=True),
        sa.Column('source', sa.String(length=100), nullable=False, default='system'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('processing_status', sa.String(length=50), nullable=False, default='pending'),
        sa.Column('processing_error', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, default=0),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better query performance
    op.create_index('ix_workflow_events_id', 'workflow_events', ['id'])
    op.create_index('ix_workflow_events_event_id', 'workflow_events', ['event_id'])
    op.create_index('ix_workflow_events_event_type', 'workflow_events', ['event_type'])
    op.create_index('ix_workflow_events_aggregate_id', 'workflow_events', ['aggregate_id'])
    op.create_index('ix_workflow_events_correlation_id', 'workflow_events', ['correlation_id'])
    op.create_index('ix_workflow_events_causation_id', 'workflow_events', ['causation_id'])
    op.create_index('ix_workflow_events_user_id', 'workflow_events', ['user_id'])
    
    # Create composite index for event ordering
    op.create_index(
        'ix_workflow_events_aggregate_sequence', 
        'workflow_events', 
        ['aggregate_id', 'sequence_number']
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('ix_workflow_events_aggregate_sequence', table_name='workflow_events')
    op.drop_index('ix_workflow_events_user_id', table_name='workflow_events')
    op.drop_index('ix_workflow_events_causation_id', table_name='workflow_events')
    op.drop_index('ix_workflow_events_correlation_id', table_name='workflow_events')
    op.drop_index('ix_workflow_events_aggregate_id', table_name='workflow_events')
    op.drop_index('ix_workflow_events_event_type', table_name='workflow_events')
    op.drop_index('ix_workflow_events_event_id', table_name='workflow_events')
    op.drop_index('ix_workflow_events_id', table_name='workflow_events')
    
    # Drop table
    op.drop_table('workflow_events')
