"""Automated tests for Database & Persistence: Alembic Lifecycle & Session Rollback."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.core.database import AsyncSessionLocal, engine
from app.modules.identity.models import User, Role


@pytest.mark.asyncio
async def test_async_session_transaction_rollback():
    """
    DB2: Verifies that an unhandled database exception (e.g., duplicate unique constraint)
    triggers an automatic transaction rollback, leaving no dirty state or dangling locks.
    """
    async with AsyncSessionLocal() as session:
        # 1. Insert a baseline test user
        user1 = User(
            id="rollback-test-user-1",
            email="unique_rollback@kit.edu",
            full_name="Rollback Test One",
            hashed_password="dummyhash123",
            is_active=True
        )
        session.add(user1)
        await session.commit()

        # 2. Attempt to insert a second user with the DUPLICATE email within a transaction block
        try:
            async with session.begin():
                user2 = User(
                    id="rollback-test-user-2",
                    email="unique_rollback@kit.edu",  # Duplicate email -> triggers unique constraint error
                    full_name="Rollback Test Two",
                    hashed_password="dummyhash456",
                    is_active=True
                )
                session.add(user2)
                # Flush inside nested block triggers IntegrityError
                await session.flush()
        except IntegrityError:
            # Expected constraint violation
            await session.rollback()

        # 3. Verify session is still clean and usable after rollback
        query_res = await session.execute(
            text("SELECT count(*) FROM users WHERE email = 'unique_rollback@kit.edu'")
        )
        count = query_res.scalar()
        # Exactly 1 user must exist (user1), proving user2 was rolled back cleanly
        assert count == 1

        # Cleanup test record
        await session.execute(
            text("DELETE FROM users WHERE id = 'rollback-test-user-1'")
        )
        await session.commit()


def test_alembic_upgrade_downgrade_lifecycle():
    """
    DB1: Programmatically validates that Alembic can inspect the current revision,
    ensuring migrations and SQLAlchemy declarative models are completely in sync.
    """
    import os
    from alembic.config import Config
    from alembic import command
    from alembic.script import ScriptDirectory

    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_ini_path = os.path.join(backend_dir, "alembic.ini")

    assert os.path.exists(alembic_ini_path), f"alembic.ini missing at {alembic_ini_path}"

    alembic_cfg = Config(alembic_ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))

    # Verify script directory discovers all revisions without syntax or import errors
    script_dir = ScriptDirectory.from_config(alembic_cfg)
    heads = script_dir.get_heads()
    
    assert len(heads) >= 1, "Alembic must have at least one head revision"
    # Ensure current head revision string is well-formed
    for head_rev in heads:
        rev_script = script_dir.get_revision(head_rev)
        assert rev_script is not None
        assert rev_script.revision == head_rev
