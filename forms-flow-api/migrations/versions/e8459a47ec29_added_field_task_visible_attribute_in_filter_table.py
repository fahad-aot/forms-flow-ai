"""added field task visible attribute in filter table

Revision ID: e8459a47ec29
Revises: 1b4fa1bb6449
Create Date: 2023-08-24 11:55:11.320949

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8459a47ec29'
down_revision = '1b4fa1bb6449'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('filter', sa.Column('task_visible_attributes', sa.JSON(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('filter', 'task_visible_attributes')
    # ### end Alembic commands ###
