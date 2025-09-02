"""Rename metadata column to event_metadata in workflow_events

Revision ID: 33041c5cbcd4
Revises: 4a8b9c5d6e7f
Create Date: 2025-09-01 16:02:32.379431

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33041c5cbcd4'
down_revision: Union[str, Sequence[str], None] = '4a8b9c5d6e7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename metadata column to event_metadata to avoid SQLAlchemy conflict
    op.alter_column('workflow_events', 'metadata', new_column_name='event_metadata')


def downgrade() -> None:
    """Downgrade schema."""
    # Rename event_metadata column back to metadata
    op.alter_column('workflow_events', 'event_metadata', new_column_name='metadata')
