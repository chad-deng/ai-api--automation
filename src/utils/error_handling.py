import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from functools import wraps
from typing import Callable, Any

logger = structlog.get_logger()

class RetryableError(Exception):
    """Base class for errors that should trigger retries"""
    pass

class WebhookProcessingError(RetryableError):
    """Error during webhook processing that can be retried"""
    pass

class TestGenerationError(Exception):
    """Error during test generation - usually not retryable"""
    pass

class NotFoundError(Exception):
    """Error when a requested resource is not found"""
    pass

class ValidationError(Exception):
    """Error when data validation fails"""
    pass

class BusinessLogicError(Exception):
    """Error when business logic constraints are violated"""
    pass

def with_retry(
    max_attempts: int = 3,
    min_wait: int = 1,
    max_wait: int = 10
):
    """Decorator to add retry logic to functions"""
    def decorator(func: Callable) -> Callable:
        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            retry=retry_if_exception_type(RetryableError),
            reraise=True
        )
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.error("Function execution failed", 
                           function=func.__name__, 
                           error=str(e),
                           attempt_number=async_wrapper.retry.statistics.get("attempt_number", 1))
                raise
        
        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            retry=retry_if_exception_type(RetryableError),
            reraise=True
        )
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.error("Function execution failed", 
                           function=func.__name__, 
                           error=str(e),
                           attempt_number=sync_wrapper.retry.statistics.get("attempt_number", 1))
                raise
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def log_and_handle_error(error: Exception, context: dict = None) -> None:
    """Centralized error logging with context"""
    context = context or {}
    logger.error(
        "Error occurred",
        error_type=type(error).__name__,
        error_message=str(error),
        **context
    )

def handle_service_error(func: Callable) -> Callable:
    """Decorator to handle service-level errors consistently"""
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            log_and_handle_error(e, {"service_function": func.__name__})
            raise
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            log_and_handle_error(e, {"service_function": func.__name__})
            raise
    
    # Return appropriate wrapper based on function type
    import asyncio
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper