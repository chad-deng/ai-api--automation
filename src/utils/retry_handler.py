import asyncio
import structlog
from typing import Any, Callable, Optional
from functools import wraps
from tenacity import (
    retry, 
    stop_after_attempt, 
    wait_exponential, 
    retry_if_exception_type,
    before_sleep_log
)
from src.config.settings import Settings

logger = structlog.get_logger()

class RetryHandler:
    """Handle retry logic for webhook processing with exponential backoff"""
    
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or Settings()
    
    def with_retry(
        self, 
        max_attempts: Optional[int] = None,
        wait_min: float = 1.0,
        wait_max: float = 60.0,
        multiplier: float = 2.0,
        exception_types: tuple = (Exception,)
    ):
        """
        Decorator to add retry logic to functions
        
        Args:
            max_attempts: Maximum number of retry attempts
            wait_min: Minimum wait time between retries (seconds)
            wait_max: Maximum wait time between retries (seconds) 
            multiplier: Exponential backoff multiplier
            exception_types: Tuple of exception types to retry on
        """
        max_attempts = max_attempts or self.settings.max_retry_attempts
        
        def decorator(func: Callable) -> Callable:
            @retry(
                stop=stop_after_attempt(max_attempts),
                wait=wait_exponential(
                    multiplier=multiplier, 
                    min=wait_min, 
                    max=wait_max
                ),
                retry=retry_if_exception_type(exception_types),
                before_sleep=before_sleep_log(logger, "WARNING"),
                reraise=True
            )
            @wraps(func)
            async def wrapper(*args, **kwargs):
                return await func(*args, **kwargs)
            
            return wrapper
        return decorator

class CircuitBreaker:
    """Simple circuit breaker pattern for webhook failures"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        
        if self.state == "OPEN":
            if asyncio.get_event_loop().time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
                logger.info("Circuit breaker transitioning to HALF_OPEN")
            else:
                raise Exception("Circuit breaker is OPEN - too many failures")
        
        try:
            result = await func(*args, **kwargs)
            
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("Circuit breaker transitioning to CLOSED")
            
            return result
            
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = asyncio.get_event_loop().time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(f"Circuit breaker transitioning to OPEN after {self.failure_count} failures")
            
            raise e

class DeadLetterQueue:
    """Handle permanently failed webhook events"""
    
    def __init__(self):
        self.failed_events = []
    
    async def add_failed_event(self, event_data: dict, error: str):
        """Add a permanently failed event to the dead letter queue"""
        failed_event = {
            "event_data": event_data,
            "error": error,
            "timestamp": asyncio.get_event_loop().time(),
            "retry_count": event_data.get("retry_count", 0)
        }
        
        self.failed_events.append(failed_event)
        logger.error("Event added to dead letter queue", 
                    event_id=event_data.get("event_id"),
                    error=error)
    
    async def get_failed_events(self) -> list:
        """Retrieve all failed events from the dead letter queue"""
        return self.failed_events.copy()
    
    async def clear_failed_events(self):
        """Clear all failed events from the dead letter queue"""
        count = len(self.failed_events)
        self.failed_events.clear()
        logger.info(f"Cleared {count} events from dead letter queue")