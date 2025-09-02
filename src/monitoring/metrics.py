"""
Prometheus metrics collection for QA Review Workflow performance monitoring.

This module implements comprehensive metrics tracking for:
- Review workflow performance (15-minute target compliance)
- Quality metrics collection and analysis
- System performance and capacity monitoring
- Alert threshold detection for bottlenecks
"""

import time
from typing import Dict, Optional, Any
from prometheus_client import (
    Counter, Histogram, Gauge, Summary, CollectorRegistry, 
    generate_latest, CONTENT_TYPE_LATEST
)
import structlog

logger = structlog.get_logger()

# Create custom registry for our metrics
REGISTRY = CollectorRegistry()

# Review Workflow Performance Metrics
REVIEW_TIME_HISTOGRAM = Histogram(
    'review_time_seconds',
    'Time spent reviewing API endpoints',
    ['api_type', 'complexity', 'reviewer_id', 'outcome'],
    buckets=[60, 300, 600, 900, 1200, 1800, 2400, float('inf')],  # 1min to 40min+
    registry=REGISTRY
)

REVIEW_OUTCOME_COUNTER = Counter(
    'review_outcomes_total',
    'Count of review outcomes',
    ['outcome', 'api_type', 'complexity'],
    registry=REGISTRY
)

REVIEW_QUEUE_GAUGE = Gauge(
    'review_queue_size',
    'Number of APIs waiting for review',
    ['priority'],
    registry=REGISTRY
)

# Quality Metrics
QUALITY_SCORE_HISTOGRAM = Histogram(
    'quality_score_distribution',
    'Distribution of quality scores assigned during review',
    ['api_type', 'test_category'],
    buckets=[0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0],
    registry=REGISTRY
)

AUTOMATED_CHECKS_COUNTER = Counter(
    'automated_checks_total',
    'Automated quality check results',
    ['check_type', 'result'],
    registry=REGISTRY
)

# System Performance Metrics
TEST_GENERATION_TIME = Histogram(
    'test_generation_time_seconds',
    'Time to generate tests for API endpoints',
    ['api_type', 'template_type'],
    buckets=[1, 5, 10, 30, 60, 120, 300, float('inf')],
    registry=REGISTRY
)

DATABASE_OPERATION_TIME = Histogram(
    'database_operation_time_seconds',
    'Database operation execution time',
    ['operation', 'table'],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, float('inf')],
    registry=REGISTRY
)

CONCURRENT_REVIEWS_GAUGE = Gauge(
    'concurrent_reviews_active',
    'Number of currently active reviews',
    registry=REGISTRY
)

# Git Integration Metrics
GIT_OPERATIONS_COUNTER = Counter(
    'git_operations_total',
    'Git operations performed',
    ['operation', 'status'],
    registry=REGISTRY
)

GIT_OPERATION_TIME = Histogram(
    'git_operation_time_seconds',
    'Git operation execution time',
    ['operation'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, float('inf')],
    registry=REGISTRY
)

# Cache Performance Metrics
CACHE_OPERATIONS_COUNTER = Counter(
    'cache_operations_total',
    'Cache operations performed',
    ['operation', 'result'],
    registry=REGISTRY
)

CACHE_HIT_RATIO = Gauge(
    'cache_hit_ratio',
    'Cache hit ratio percentage',
    ['cache_type'],
    registry=REGISTRY
)

# Alert Threshold Metrics
REVIEW_TIME_THRESHOLD_VIOLATIONS = Counter(
    'review_time_threshold_violations_total',
    'Number of reviews exceeding time thresholds',
    ['threshold_type', 'api_type'],
    registry=REGISTRY
)

SYSTEM_ERRORS_COUNTER = Counter(
    'system_errors_total',
    'System errors by component',
    ['component', 'error_type'],
    registry=REGISTRY
)


class MetricsCollector:
    """
    Centralized metrics collection for QA Review Workflow system.
    
    Provides context managers and convenience methods for tracking
    performance metrics aligned with QA Lead assessment criteria.
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
        
    def track_review_time(self, api_type: str, complexity: str, reviewer_id: str):
        """Context manager for tracking review time with 15-minute target monitoring."""
        return ReviewTimeTracker(api_type, complexity, reviewer_id)
    
    def record_review_outcome(self, outcome: str, api_type: str, complexity: str, 
                            quality_score: Optional[float] = None):
        """Record the outcome of a review with quality metrics."""
        REVIEW_OUTCOME_COUNTER.labels(
            outcome=outcome,
            api_type=api_type,
            complexity=complexity
        ).inc()
        
        if quality_score is not None:
            QUALITY_SCORE_HISTOGRAM.labels(
                api_type=api_type,
                test_category='overall'
            ).observe(quality_score)
        
        self.logger.info(
            "Review outcome recorded",
            outcome=outcome,
            api_type=api_type,
            complexity=complexity,
            quality_score=quality_score
        )
    
    def update_review_queue(self, priority: str, count: int):
        """Update the review queue size for monitoring bottlenecks."""
        REVIEW_QUEUE_GAUGE.labels(priority=priority).set(count)
    
    def record_automated_check(self, check_type: str, passed: bool, 
                             details: Optional[Dict[str, Any]] = None):
        """Record automated quality check results."""
        result = 'pass' if passed else 'fail'
        AUTOMATED_CHECKS_COUNTER.labels(
            check_type=check_type,
            result=result
        ).inc()
        
        self.logger.info(
            "Automated check completed",
            check_type=check_type,
            result=result,
            details=details
        )
    
    def track_test_generation(self, api_type: str, template_type: str):
        """Context manager for tracking test generation time."""
        return TestGenerationTracker(api_type, template_type)
    
    def track_database_operation(self, operation: str, table: str):
        """Context manager for tracking database operation performance."""
        return DatabaseOperationTracker(operation, table)
    
    def update_concurrent_reviews(self, count: int):
        """Update the count of concurrent active reviews."""
        CONCURRENT_REVIEWS_GAUGE.set(count)
    
    def record_git_operation(self, operation: str, success: bool, duration: float):
        """Record Git operation metrics."""
        status = 'success' if success else 'failure'
        GIT_OPERATIONS_COUNTER.labels(
            operation=operation,
            status=status
        ).inc()
        
        GIT_OPERATION_TIME.labels(operation=operation).observe(duration)
    
    def record_cache_operation(self, operation: str, hit: bool, cache_type: str):
        """Record cache operation metrics."""
        result = 'hit' if hit else 'miss'
        CACHE_OPERATIONS_COUNTER.labels(
            operation=operation,
            result=result
        ).inc()
        
        # Update hit ratio for this cache type
        self._update_cache_hit_ratio(cache_type)
    
    def record_threshold_violation(self, threshold_type: str, api_type: str):
        """Record when review time exceeds defined thresholds."""
        REVIEW_TIME_THRESHOLD_VIOLATIONS.labels(
            threshold_type=threshold_type,
            api_type=api_type
        ).inc()
        
        self.logger.warning(
            "Review time threshold exceeded",
            threshold_type=threshold_type,
            api_type=api_type
        )
    
    def record_system_error(self, component: str, error_type: str, details: str):
        """Record system errors for monitoring and alerting."""
        SYSTEM_ERRORS_COUNTER.labels(
            component=component,
            error_type=error_type
        ).inc()
        
        self.logger.error(
            "System error recorded",
            component=component,
            error_type=error_type,
            details=details
        )
    
    def _update_cache_hit_ratio(self, cache_type: str):
        """Update cache hit ratio gauge based on recent operations."""
        # This would typically calculate from recent metrics
        # For now, we'll update it when cache operations are recorded
        pass
    
    def get_metrics(self) -> str:
        """Return current metrics in Prometheus format."""
        return generate_latest(REGISTRY).decode('utf-8')


class ReviewTimeTracker:
    """Context manager for tracking review time with threshold monitoring."""
    
    def __init__(self, api_type: str, complexity: str, reviewer_id: str):
        self.api_type = api_type
        self.complexity = complexity
        self.reviewer_id = reviewer_id
        self.start_time = None
        self.outcome = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is not None:
            duration = time.time() - self.start_time
            
            # Record the review time
            REVIEW_TIME_HISTOGRAM.labels(
                api_type=self.api_type,
                complexity=self.complexity,
                reviewer_id=self.reviewer_id,
                outcome=self.outcome or 'unknown'
            ).observe(duration)
            
            # Check for threshold violations based on QA Lead assessment
            self._check_time_thresholds(duration)
    
    def set_outcome(self, outcome: str):
        """Set the review outcome (approved, rejected, needs_modification)."""
        self.outcome = outcome
    
    def _check_time_thresholds(self, duration_seconds: float):
        """Check if review time exceeds defined thresholds and record violations."""
        duration_minutes = duration_seconds / 60
        
        # Define thresholds based on QA Lead assessment
        thresholds = {
            'simple_crud': {
                'target': 12,  # minutes
                'warning': 15,
                'critical': 20
            },
            'standard_business': {
                'target': 18,
                'warning': 20,
                'critical': 25
            },
            'complex_integration': {
                'target': 25,
                'warning': 30,
                'critical': 35
            }
        }
        
        # Map complexity to threshold category
        complexity_map = {
            'simple': 'simple_crud',
            'medium': 'standard_business',
            'complex': 'complex_integration'
        }
        
        threshold_category = complexity_map.get(self.complexity, 'standard_business')
        limits = thresholds[threshold_category]
        
        if duration_minutes > limits['critical']:
            REVIEW_TIME_THRESHOLD_VIOLATIONS.labels(
                threshold_type='critical',
                api_type=self.api_type
            ).inc()
        elif duration_minutes > limits['warning']:
            REVIEW_TIME_THRESHOLD_VIOLATIONS.labels(
                threshold_type='warning',
                api_type=self.api_type
            ).inc()
        elif duration_minutes > limits['target']:
            REVIEW_TIME_THRESHOLD_VIOLATIONS.labels(
                threshold_type='target',
                api_type=self.api_type
            ).inc()


class TestGenerationTracker:
    """Context manager for tracking test generation performance."""
    
    def __init__(self, api_type: str, template_type: str):
        self.api_type = api_type
        self.template_type = template_type
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is not None:
            duration = time.time() - self.start_time
            TEST_GENERATION_TIME.labels(
                api_type=self.api_type,
                template_type=self.template_type
            ).observe(duration)


class DatabaseOperationTracker:
    """Context manager for tracking database operation performance."""
    
    def __init__(self, operation: str, table: str):
        self.operation = operation
        self.table = table
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is not None:
            duration = time.time() - self.start_time
            DATABASE_OPERATION_TIME.labels(
                operation=self.operation,
                table=self.table
            ).observe(duration)


# Global metrics collector instance
metrics = MetricsCollector()