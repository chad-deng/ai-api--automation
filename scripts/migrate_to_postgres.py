#!/usr/bin/env python3
"""
Database Migration Script: SQLite to PostgreSQL
Migrates existing SQLite data to PostgreSQL for production deployment.
"""

import os
import sys
import asyncio
import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

import asyncpg
import structlog
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent / "src"))
from src.config.settings import Settings
from src.database.models import Base, WebhookEvent, GeneratedTest

logger = structlog.get_logger()

class DatabaseMigrator:
    """Handles migration from SQLite to PostgreSQL."""
    
    def __init__(self, sqlite_path: str, postgres_url: str):
        self.sqlite_path = sqlite_path
        self.postgres_url = postgres_url
        self.dry_run = False
        
    async def migrate(self, dry_run: bool = False) -> bool:
        """
        Execute the migration process.
        
        Args:
            dry_run: If True, only validate migration without executing
            
        Returns:
            True if migration successful, False otherwise
        """
        self.dry_run = dry_run
        
        try:
            logger.info("Starting database migration", 
                       sqlite_path=self.sqlite_path, 
                       postgres_url=self.postgres_url.split('@')[1] if '@' in self.postgres_url else self.postgres_url,
                       dry_run=dry_run)
            
            # Step 1: Validate source database
            if not await self._validate_sqlite():
                return False
                
            # Step 2: Prepare target database
            if not await self._prepare_postgres():
                return False
                
            # Step 3: Migrate data
            if not dry_run:
                if not await self._migrate_data():
                    return False
                    
                # Step 4: Validate migration
                if not await self._validate_migration():
                    return False
                    
            logger.info("Database migration completed successfully")
            return True
            
        except Exception as e:
            logger.error("Migration failed", error=str(e), exc_info=True)
            return False
    
    async def _validate_sqlite(self) -> bool:
        """Validate SQLite database exists and is accessible."""
        try:
            if not os.path.exists(self.sqlite_path):
                logger.error("SQLite database not found", path=self.sqlite_path)
                return False
                
            conn = sqlite3.connect(self.sqlite_path)
            cursor = conn.cursor()
            
            # Check if required tables exist
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            required_tables = ['webhook_events', 'generated_tests']
            missing_tables = [table for table in required_tables if table not in tables]
            
            if missing_tables:
                logger.warning("Missing tables in SQLite database", missing_tables=missing_tables)
            
            # Get record counts
            webhook_count = cursor.execute("SELECT COUNT(*) FROM webhook_events").fetchone()[0]
            test_count = cursor.execute("SELECT COUNT(*) FROM generated_tests").fetchone()[0]
            
            logger.info("SQLite database validated", 
                       webhook_events=webhook_count, 
                       generated_tests=test_count)
            
            conn.close()
            return True
            
        except Exception as e:
            logger.error("SQLite validation failed", error=str(e))
            return False
    
    async def _prepare_postgres(self) -> bool:
        """Prepare PostgreSQL database with schema."""
        try:
            # Create engine and tables
            engine = create_engine(self.postgres_url)
            
            if not self.dry_run:
                # Create all tables
                Base.metadata.create_all(bind=engine)
                logger.info("PostgreSQL schema created")
            else:
                logger.info("Dry run: PostgreSQL schema would be created")
                
            return True
            
        except Exception as e:
            logger.error("PostgreSQL preparation failed", error=str(e))
            return False
    
    async def _migrate_data(self) -> bool:
        """Migrate data from SQLite to PostgreSQL."""
        try:
            # Connect to both databases
            sqlite_conn = sqlite3.connect(self.sqlite_path)
            sqlite_conn.row_factory = sqlite3.Row
            
            pg_conn = await asyncpg.connect(self.postgres_url)
            
            # Migrate webhook_events
            await self._migrate_webhook_events(sqlite_conn, pg_conn)
            
            # Migrate generated_tests
            await self._migrate_generated_tests(sqlite_conn, pg_conn)
            
            await pg_conn.close()
            sqlite_conn.close()
            
            return True
            
        except Exception as e:
            logger.error("Data migration failed", error=str(e))
            return False
    
    async def _migrate_webhook_events(self, sqlite_conn: sqlite3.Connection, pg_conn):
        """Migrate webhook_events table."""
        cursor = sqlite_conn.cursor()
        cursor.execute("SELECT * FROM webhook_events")
        
        records = cursor.fetchall()
        logger.info("Migrating webhook events", count=len(records))
        
        for record in records:
            await pg_conn.execute("""
                INSERT INTO webhook_events 
                (id, event_id, event_type, project_id, payload, processed, created_at, processed_at, processing_metadata, error_message)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (event_id) DO NOTHING
            """, 
            record['id'], record['event_id'], record['event_type'], 
            record['project_id'], json.dumps(json.loads(record['payload'])) if record['payload'] else None,
            record['processed'], record['created_at'], record['processed_at'],
            json.dumps(json.loads(record['processing_metadata'])) if record['processing_metadata'] else None,
            record['error_message'])
    
    async def _migrate_generated_tests(self, sqlite_conn: sqlite3.Connection, pg_conn):
        """Migrate generated_tests table."""
        cursor = sqlite_conn.cursor()
        cursor.execute("SELECT * FROM generated_tests")
        
        records = cursor.fetchall()
        logger.info("Migrating generated tests", count=len(records))
        
        for record in records:
            await pg_conn.execute("""
                INSERT INTO generated_tests 
                (id, webhook_event_id, test_name, test_content, file_path, status, created_at, last_run_at, last_run_result)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING
            """, 
            record['id'], record['webhook_event_id'], record['test_name'],
            record['test_content'], record['file_path'], record['status'],
            record['created_at'], record['last_run_at'], record['last_run_result'])
    
    async def _validate_migration(self) -> bool:
        """Validate migration by comparing record counts."""
        try:
            # Count records in SQLite
            sqlite_conn = sqlite3.connect(self.sqlite_path)
            cursor = sqlite_conn.cursor()
            
            sqlite_webhooks = cursor.execute("SELECT COUNT(*) FROM webhook_events").fetchone()[0]
            sqlite_tests = cursor.execute("SELECT COUNT(*) FROM generated_tests").fetchone()[0]
            
            sqlite_conn.close()
            
            # Count records in PostgreSQL
            pg_conn = await asyncpg.connect(self.postgres_url)
            
            pg_webhooks = await pg_conn.fetchval("SELECT COUNT(*) FROM webhook_events")
            pg_tests = await pg_conn.fetchval("SELECT COUNT(*) FROM generated_tests")
            
            await pg_conn.close()
            
            # Compare counts
            webhook_match = sqlite_webhooks == pg_webhooks
            test_match = sqlite_tests == pg_tests
            
            logger.info("Migration validation results",
                       webhook_events_sqlite=sqlite_webhooks,
                       webhook_events_postgres=pg_webhooks,
                       webhook_events_match=webhook_match,
                       generated_tests_sqlite=sqlite_tests,
                       generated_tests_postgres=pg_tests,
                       generated_tests_match=test_match)
            
            return webhook_match and test_match
            
        except Exception as e:
            logger.error("Migration validation failed", error=str(e))
            return False

async def main():
    """Main migration function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate SQLite database to PostgreSQL')
    parser.add_argument('--dry-run', action='store_true', help='Validate migration without executing')
    parser.add_argument('--sqlite-path', default='test_automation.db', help='SQLite database path')
    parser.add_argument('--postgres-url', help='PostgreSQL connection URL')
    
    args = parser.parse_args()
    
    # Get settings
    settings = Settings()
    
    # Use provided URLs or settings
    sqlite_path = args.sqlite_path
    postgres_url = args.postgres_url or settings.database_url
    
    # Ensure we're migrating TO PostgreSQL
    if 'postgresql' not in postgres_url and 'postgres' not in postgres_url:
        logger.error("Target database must be PostgreSQL", url=postgres_url)
        sys.exit(1)
    
    migrator = DatabaseMigrator(sqlite_path, postgres_url)
    success = await migrator.migrate(dry_run=args.dry_run)
    
    if success:
        logger.info("Migration completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())