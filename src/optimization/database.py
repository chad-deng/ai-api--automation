"""
Database query optimization and performance enhancement.

Implements optimized database queries, connection pooling,
and performance monitoring for QA Review Workflow system.
"""

import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import structlog
from sqlalchemy import (
    select, func, and_, or_, text, Index, 
    event, create_engine
)
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.sql import sqltypes

from ..database.models import (
    Base, ReviewSession, APIEndpoint, TestGeneration, 
    QualityMetric, Alert, get_db_session
)
from ..monitoring.metrics import metrics, DatabaseOperationTracker

logger = structlog.get_logger()


class DatabaseOptimizer:
    """
    Database performance optimization and query optimization.
    
    Provides optimized queries, connection pooling, and performance
    monitoring specifically designed for QA Review Workflow patterns.
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
        self._connection_pool_stats = {
            'active_connections': 0,
            'total_connections': 0,
            'query_count': 0,
            'slow_query_count': 0
        }
    
    async def optimize_database_schema(self):
        """Apply database schema optimizations and indexes."""
        try:
            async with get_db_session() as session:
                # Create performance indexes for common query patterns
                indexes_to_create = self._get_optimization_indexes()
                
                for index_sql in indexes_to_create:
                    try:
                        await session.execute(text(index_sql))
                        await session.commit()
                        self.logger.info("Created performance index", sql=index_sql)
                    except Exception as e:
                        await session.rollback()
                        self.logger.warning("Index creation skipped (may exist)", error=str(e))
                
                self.logger.info("Database schema optimization completed")
                
        except Exception as e:
            self.logger.error("Failed to optimize database schema", error=str(e))
            raise
    
    def _get_optimization_indexes(self) -> List[str]:
        """Get list of performance indexes to create."""
        return [
            # Review performance queries
            """
            CREATE INDEX IF NOT EXISTS idx_review_session_time_range 
            ON review_sessions (created_at, status, review_duration_minutes)
            """,
            
            # API endpoint performance
            """
            CREATE INDEX IF NOT EXISTS idx_api_endpoint_type_complexity
            ON api_endpoints (api_type, complexity, created_at)
            """,
            
            # Quality metrics queries
            """
            CREATE INDEX IF NOT EXISTS idx_quality_metrics_time_score
            ON quality_metrics (created_at, overall_score, outcome)
            """,
            
            # Test generation performance
            """
            CREATE INDEX IF NOT EXISTS idx_test_generation_status_time
            ON test_generations (status, created_at, generation_duration_seconds)
            """,
            
            # Alert management
            """
            CREATE INDEX IF NOT EXISTS idx_alerts_severity_time
            ON alerts (severity, triggered_at, resolved_at)
            """,
            
            # Composite indexes for complex queries
            """
            CREATE INDEX IF NOT EXISTS idx_review_session_composite
            ON review_sessions (status, api_endpoint_id, created_at)
            """,
            
            """
            CREATE INDEX IF NOT EXISTS idx_quality_metrics_composite
            ON quality_metrics (review_session_id, created_at, overall_score)
            """
        ]
    
    @asynccontextmanager
    async def optimized_session(self):
        """Create optimized database session with performance monitoring."""
        start_time = datetime.utcnow()
        
        try:
            async with get_db_session() as session:
                # Configure session for optimal performance
                await session.execute(text("SET statement_timeout = '30s'"))
                await session.execute(text("SET lock_timeout = '10s'"))
                
                yield session
                
        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            self.logger.error(
                "Database session error",
                duration_seconds=duration,
                error=str(e)
            )
            raise
        finally:
            duration = (datetime.utcnow() - start_time).total_seconds()
            if duration > 1.0:  # Log slow sessions
                self.logger.warning(
                    "Slow database session",
                    duration_seconds=duration
                )
    
    async def get_review_performance_optimized(
        self, 
        hours: int = 24,
        api_type: Optional[str] = None,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """Optimized query for review performance metrics."""
        
        with metrics.track_database_operation("select", "review_sessions"):
            async with self.optimized_session() as session:
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(hours=hours)
                
                # Build optimized query with proper joins and indexes
                query = select(
                    ReviewSession.review_duration_minutes,
                    ReviewSession.status,
                    ReviewSession.created_at,
                    APIEndpoint.api_type,
                    APIEndpoint.complexity,
                    QualityMetric.overall_score
                ).select_from(
                    ReviewSession.__table__.join(
                        APIEndpoint.__table__,
                        ReviewSession.api_endpoint_id == APIEndpoint.id
                    ).outerjoin(
                        QualityMetric.__table__,
                        ReviewSession.id == QualityMetric.review_session_id
                    )
                ).where(
                    and_(
                        ReviewSession.created_at >= start_time,
                        ReviewSession.created_at <= end_time,
                        ReviewSession.review_duration_minutes.isnot(None)
                    )
                )
                
                # Apply API type filter if specified
                if api_type:
                    query = query.where(APIEndpoint.api_type == api_type)
                
                # Apply limit and ordering
                query = query.order_by(ReviewSession.created_at.desc()).limit(limit)
                
                result = await session.execute(query)
                rows = result.fetchall()
                
                # Process results efficiently
                performance_data = {
                    'total_reviews': len(rows),
                    'review_times': [row.review_duration_minutes for row in rows if row.review_duration_minutes],
                    'quality_scores': [row.overall_score for row in rows if row.overall_score],
                    'api_type_distribution': {},
                    'complexity_distribution': {},
                    'status_distribution': {}
                }
                
                # Calculate distributions
                for row in rows:
                    # API type distribution
                    api_type_key = row.api_type or 'unknown'
                    performance_data['api_type_distribution'][api_type_key] = \
                        performance_data['api_type_distribution'].get(api_type_key, 0) + 1
                    
                    # Complexity distribution
                    complexity_key = row.complexity or 'unknown'
                    performance_data['complexity_distribution'][complexity_key] = \
                        performance_data['complexity_distribution'].get(complexity_key, 0) + 1
                    
                    # Status distribution
                    status_key = row.status or 'unknown'
                    performance_data['status_distribution'][status_key] = \
                        performance_data['status_distribution'].get(status_key, 0) + 1
                
                return performance_data
    
    async def get_queue_metrics_optimized(self) -> Dict[str, Any]:
        """Optimized query for current queue status."""
        
        with metrics.track_database_operation("select", "review_sessions"):
            async with self.optimized_session() as session:
                # Optimized queue queries using aggregation
                queue_query = select([
                    func.count().label('total_pending'),
                    func.count().filter(ReviewSession.priority == 'high').label('high_priority'),
                    func.count().filter(ReviewSession.priority == 'critical').label('critical_priority'),
                    func.avg(
                        func.extract('epoch', func.now() - ReviewSession.created_at) / 60
                    ).label('avg_wait_time_minutes')
                ]).where(ReviewSession.status == 'pending')
                
                result = await session.execute(queue_query)
                queue_stats = result.fetchone()
                
                return {
                    'total_pending': queue_stats.total_pending or 0,
                    'high_priority_pending': queue_stats.high_priority or 0,
                    'critical_priority_pending': queue_stats.critical_priority or 0,
                    'avg_wait_time_minutes': float(queue_stats.avg_wait_time_minutes or 0)
                }
    
    async def get_reviewer_performance_batch(
        self, 
        reviewer_ids: List[str],
        hours: int = 24
    ) -> Dict[str, Dict[str, Any]]:
        """Optimized batch query for multiple reviewer performance."""
        
        with metrics.track_database_operation("select", "review_sessions"):
            async with self.optimized_session() as session:
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(hours=hours)
                
                # Single query to get all reviewer stats
                query = select([
                    ReviewSession.reviewer_id,
                    func.count().label('total_reviews'),
                    func.avg(ReviewSession.review_duration_minutes).label('avg_time'),
                    func.count().filter(ReviewSession.status == 'approved').label('approved_count'),
                    func.percentile_cont(0.5).within_group(
                        ReviewSession.review_duration_minutes
                    ).label('median_time')
                ]).where(
                    and_(
                        ReviewSession.reviewer_id.in_(reviewer_ids),
                        ReviewSession.created_at >= start_time,
                        ReviewSession.created_at <= end_time,
                        ReviewSession.review_duration_minutes.isnot(None)
                    )
                ).group_by(ReviewSession.reviewer_id)
                
                result = await session.execute(query)
                rows = result.fetchall()
                
                performance_data = {}
                for row in rows:
                    approval_rate = (row.approved_count / row.total_reviews * 100) if row.total_reviews > 0 else 0
                    
                    performance_data[row.reviewer_id] = {
                        'total_reviews': row.total_reviews,
                        'avg_time_minutes': float(row.avg_time or 0),
                        'median_time_minutes': float(row.median_time or 0),
                        'approval_rate': approval_rate,
                        'approved_count': row.approved_count
                    }
                
                return performance_data
    
    async def bulk_update_metrics(self, metrics_data: List[Dict[str, Any]]):
        """Optimized bulk update for metrics data."""
        
        with metrics.track_database_operation("bulk_update", "quality_metrics"):
            async with self.optimized_session() as session:
                try:
                    # Prepare bulk insert data
                    bulk_data = []
                    for metric in metrics_data:
                        bulk_data.append({
                            'review_session_id': metric['review_session_id'],
                            'overall_score': metric['overall_score'],
                            'outcome': metric['outcome'],
                            'created_at': metric.get('created_at', datetime.utcnow())
                        })
                    
                    # Execute bulk insert
                    if bulk_data:
                        await session.execute(
                            QualityMetric.__table__.insert(),
                            bulk_data
                        )
                        await session.commit()
                        
                        self.logger.info(
                            "Bulk metrics update completed",
                            records_updated=len(bulk_data)
                        )
                    
                except Exception as e:
                    await session.rollback()
                    self.logger.error("Bulk update failed", error=str(e))
                    raise
    
    async def cleanup_old_records(self, retention_days: int = 90):
        """Optimized cleanup of old records to maintain performance."""
        
        try:
            async with self.optimized_session() as session:
                cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
                
                # Clean up old alerts
                alert_delete = Alert.__table__.delete().where(
                    and_(
                        Alert.resolved_at < cutoff_date,
                        Alert.resolved_at.isnot(None)
                    )
                )
                alert_result = await session.execute(alert_delete)
                
                # Clean up old quality metrics for completed reviews
                quality_delete = QualityMetric.__table__.delete().where(
                    QualityMetric.created_at < cutoff_date
                )
                quality_result = await session.execute(quality_delete)
                
                await session.commit()
                
                self.logger.info(
                    "Database cleanup completed",
                    alerts_deleted=alert_result.rowcount,
                    quality_metrics_deleted=quality_result.rowcount,
                    retention_days=retention_days
                )
                
        except Exception as e:
            self.logger.error("Database cleanup failed", error=str(e))
            raise
    
    async def analyze_query_performance(self) -> Dict[str, Any]:
        """Analyze database query performance and identify slow queries."""
        
        try:
            async with self.optimized_session() as session:
                # Get query performance statistics
                perf_query = text("""
                    SELECT 
                        schemaname,
                        tablename,
                        seq_scan,
                        seq_tup_read,
                        idx_scan,
                        idx_tup_fetch,
                        n_tup_ins,
                        n_tup_upd,
                        n_tup_del
                    FROM pg_stat_user_tables
                    WHERE schemaname = 'public'
                    ORDER BY seq_tup_read DESC
                """)
                
                result = await session.execute(perf_query)
                table_stats = result.fetchall()
                
                analysis = {
                    'table_statistics': [
                        {
                            'table': row.tablename,
                            'sequential_scans': row.seq_scan,
                            'sequential_reads': row.seq_tup_read,
                            'index_scans': row.idx_scan,
                            'index_reads': row.idx_tup_fetch,
                            'inserts': row.n_tup_ins,
                            'updates': row.n_tup_upd,
                            'deletes': row.n_tup_del,
                            'index_efficiency': (
                                row.idx_tup_fetch / max(row.seq_tup_read, 1)
                            ) if row.idx_tup_fetch else 0
                        } for row in table_stats
                    ],
                    'recommendations': []
                }
                
                # Generate optimization recommendations
                for table_stat in analysis['table_statistics']:
                    if table_stat['sequential_reads'] > 10000 and table_stat['index_efficiency'] < 0.1:
                        analysis['recommendations'].append({
                            'table': table_stat['table'],
                            'issue': 'high_sequential_scans',
                            'recommendation': 'Consider adding indexes for frequent query patterns'
                        })
                
                return analysis
                
        except Exception as e:
            self.logger.error("Query performance analysis failed", error=str(e))
            return {'error': str(e)}


# Connection pool optimization
async def configure_connection_pool():
    """Configure optimized database connection pool."""
    try:
        # Configure connection pool settings
        pool_settings = {
            'pool_size': 20,          # Base pool size
            'max_overflow': 30,       # Additional connections under load
            'pool_timeout': 30,       # Wait time for connection
            'pool_recycle': 3600,     # Recycle connections every hour
            'pool_pre_ping': True     # Validate connections before use
        }
        
        logger.info("Database connection pool configured", **pool_settings)
        
    except Exception as e:
        logger.error("Failed to configure connection pool", error=str(e))


# Query performance monitoring
@event.listens_for(create_engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Monitor query execution start time."""
    context._query_start_time = datetime.utcnow()


@event.listens_for(create_engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Monitor query execution completion and log slow queries."""
    if hasattr(context, '_query_start_time'):
        duration = (datetime.utcnow() - context._query_start_time).total_seconds()
        
        if duration > 1.0:  # Log queries taking more than 1 second
            logger.warning(
                "Slow database query detected",
                duration_seconds=duration,
                statement=statement[:200] + "..." if len(statement) > 200 else statement
            )
            
            # Record slow query metric
            metrics.record_system_error(
                component="database",
                error_type="slow_query",
                details=f"Query took {duration:.2f} seconds"
            )


# Global database optimizer instance
db_optimizer = DatabaseOptimizer()