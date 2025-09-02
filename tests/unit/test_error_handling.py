import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock
from tenacity import RetryError
from src.utils.error_handling import (
    RetryableError,
    WebhookProcessingError,
    TestGenerationError,
    with_retry,
    log_and_handle_error
)

class TestErrorClasses:
    """Unit tests for custom exception classes"""
    
    def test_retryable_error_inheritance(self):
        """Test that RetryableError inherits from Exception"""
        error = RetryableError("test error")
        assert isinstance(error, Exception)
        assert str(error) == "test error"
    
    def test_webhook_processing_error_inheritance(self):
        """Test that WebhookProcessingError inherits from RetryableError"""
        error = WebhookProcessingError("webhook error")
        assert isinstance(error, RetryableError)
        assert isinstance(error, Exception)
        assert str(error) == "webhook error"
    
    def test_test_generation_error_inheritance(self):
        """Test that TestGenerationError inherits from Exception but not RetryableError"""
        error = TestGenerationError("generation error")
        assert isinstance(error, Exception)
        assert not isinstance(error, RetryableError)
        assert str(error) == "generation error"

class TestWithRetryDecorator:
    """Unit tests for with_retry decorator"""
    
    def test_sync_function_success_no_retry(self):
        """Test that successful sync function executes without retry"""
        @with_retry(max_attempts=3)
        def successful_function(value):
            return value * 2
        
        result = successful_function(5)
        assert result == 10
    
    def test_sync_function_retryable_error_with_retry(self):
        """Test that sync function retries on RetryableError"""
        call_count = 0
        
        @with_retry(max_attempts=3)
        def failing_function():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise WebhookProcessingError("Retryable error")
            return "success"
        
        result = failing_function()
        assert result == "success"
        assert call_count == 3
    
    def test_sync_function_non_retryable_error_no_retry(self):
        """Test that sync function doesn't retry on non-retryable errors"""
        call_count = 0
        
        @with_retry(max_attempts=3)
        def failing_function():
            nonlocal call_count
            call_count += 1
            raise ValueError("Non-retryable error")
        
        with pytest.raises(ValueError, match="Non-retryable error"):
            failing_function()
        
        assert call_count == 1  # Only called once, no retries
    
    @pytest.mark.asyncio
    async def test_async_function_success_no_retry(self):
        """Test that successful async function executes without retry"""
        @with_retry(max_attempts=3)
        async def successful_async_function(value):
            return value * 3
        
        result = await successful_async_function(4)
        assert result == 12
    
    @pytest.mark.asyncio
    async def test_async_function_retryable_error_with_retry(self):
        """Test that async function retries on RetryableError"""
        call_count = 0
        
        @with_retry(max_attempts=3)
        async def failing_async_function():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise WebhookProcessingError("Async retryable error")
            return "async success"
        
        result = await failing_async_function()
        assert result == "async success"
        assert call_count == 2
    
    @pytest.mark.asyncio
    async def test_async_function_non_retryable_error_no_retry(self):
        """Test that async function doesn't retry on non-retryable errors"""
        call_count = 0
        
        @with_retry(max_attempts=3)
        async def failing_async_function():
            nonlocal call_count
            call_count += 1
            raise TestGenerationError("Non-retryable async error")
        
        with pytest.raises(TestGenerationError, match="Non-retryable async error"):
            await failing_async_function()
        
        assert call_count == 1  # Only called once, no retries
    
    def test_sync_function_max_retries_exceeded(self):
        """Test that sync function stops after max attempts"""
        call_count = 0
        
        @with_retry(max_attempts=2)
        def always_failing_function():
            nonlocal call_count
            call_count += 1
            raise RetryableError("Always fails")
        
        # The actual exception that gets raised is the original exception, not RetryError
        with pytest.raises(RetryableError):
            always_failing_function()
        
        assert call_count == 2  # Called exactly max_attempts times
    
    @pytest.mark.asyncio
    async def test_async_function_max_retries_exceeded(self):
        """Test that async function stops after max attempts"""
        call_count = 0
        
        @with_retry(max_attempts=2)
        async def always_failing_async_function():
            nonlocal call_count
            call_count += 1
            raise RetryableError("Always fails async")
        
        # The actual exception that gets raised is the original exception, not RetryError
        with pytest.raises(RetryableError):
            await always_failing_async_function()
        
        assert call_count == 2  # Called exactly max_attempts times
    
    def test_with_retry_custom_parameters(self):
        """Test with_retry decorator with custom parameters"""
        call_count = 0
        
        @with_retry(max_attempts=5, min_wait=2, max_wait=20)
        def custom_retry_function():
            nonlocal call_count
            call_count += 1
            if call_count < 4:
                raise WebhookProcessingError("Custom retry test")
            return "custom success"
        
        result = custom_retry_function()
        assert result == "custom success"
        assert call_count == 4
    
    @patch('src.utils.error_handling.logger')
    def test_sync_function_logging_on_error(self, mock_logger):
        """Test that sync function logs errors appropriately"""
        @with_retry(max_attempts=2)
        def function_with_error():
            raise ValueError("Test error for logging")
        
        with pytest.raises(ValueError):
            function_with_error()
        
        # Verify logger.error was called
        assert mock_logger.error.called
        call_args = mock_logger.error.call_args[1]
        assert "Function execution failed" in mock_logger.error.call_args[0]
        assert call_args['function'] == 'function_with_error'
        assert 'Test error for logging' in call_args['error']
    
    @patch('src.utils.error_handling.logger')
    @pytest.mark.asyncio
    async def test_async_function_logging_on_error(self, mock_logger):
        """Test that async function logs errors appropriately"""
        @with_retry(max_attempts=2)
        async def async_function_with_error():
            raise ValueError("Async test error for logging")
        
        with pytest.raises(ValueError):
            await async_function_with_error()
        
        # Verify logger.error was called
        assert mock_logger.error.called
        call_args = mock_logger.error.call_args[1]
        assert "Function execution failed" in mock_logger.error.call_args[0]
        assert call_args['function'] == 'async_function_with_error'
        assert 'Async test error for logging' in call_args['error']
    
    def test_decorator_preserves_function_metadata(self):
        """Test that decorator preserves original function metadata"""
        @with_retry(max_attempts=2)
        def documented_function(param1, param2="default"):
            """This is a documented function"""
            return param1 + param2
        
        assert documented_function.__name__ == 'documented_function'
        assert "documented function" in documented_function.__doc__
    
    @pytest.mark.asyncio
    async def test_async_decorator_preserves_function_metadata(self):
        """Test that async decorator preserves original function metadata"""
        @with_retry(max_attempts=2)
        async def documented_async_function(param1, param2="default"):
            """This is a documented async function"""
            return param1 + param2
        
        assert documented_async_function.__name__ == 'documented_async_function'
        assert "documented async function" in documented_async_function.__doc__

class TestLogAndHandleError:
    """Unit tests for log_and_handle_error function"""
    
    @patch('src.utils.error_handling.logger')
    def test_log_and_handle_error_basic(self, mock_logger):
        """Test basic error logging functionality"""
        error = ValueError("Test error")
        log_and_handle_error(error)
        
        # Verify logger.error was called with correct parameters
        mock_logger.error.assert_called_once_with(
            "Error occurred",
            error_type="ValueError",
            error_message="Test error"
        )
    
    @patch('src.utils.error_handling.logger')
    def test_log_and_handle_error_with_context(self, mock_logger):
        """Test error logging with additional context"""
        error = WebhookProcessingError("Webhook failed")
        context = {
            "webhook_id": "12345",
            "event_type": "api_created",
            "project_id": "test_project"
        }
        
        log_and_handle_error(error, context)
        
        # Verify logger.error was called with context
        mock_logger.error.assert_called_once_with(
            "Error occurred",
            error_type="WebhookProcessingError",
            error_message="Webhook failed",
            webhook_id="12345",
            event_type="api_created",
            project_id="test_project"
        )
    
    @patch('src.utils.error_handling.logger')
    def test_log_and_handle_error_with_none_context(self, mock_logger):
        """Test error logging when context is None"""
        error = TestGenerationError("Generation failed")
        log_and_handle_error(error, None)
        
        # Verify logger.error was called without additional context
        mock_logger.error.assert_called_once_with(
            "Error occurred",
            error_type="TestGenerationError",
            error_message="Generation failed"
        )
    
    @patch('src.utils.error_handling.logger')
    def test_log_and_handle_error_with_empty_context(self, mock_logger):
        """Test error logging with empty context dictionary"""
        error = RuntimeError("Runtime issue")
        log_and_handle_error(error, {})
        
        # Verify logger.error was called without additional context
        mock_logger.error.assert_called_once_with(
            "Error occurred",
            error_type="RuntimeError",
            error_message="Runtime issue"
        )
    
    @patch('src.utils.error_handling.logger')
    def test_log_and_handle_error_with_complex_error_message(self, mock_logger):
        """Test error logging with complex error messages"""
        error = Exception("Multi-line\nerror message\nwith special chars: @#$%")
        context = {"component": "test_module", "line": 42}
        
        log_and_handle_error(error, context)
        
        # Verify logger.error was called correctly
        mock_logger.error.assert_called_once_with(
            "Error occurred",
            error_type="Exception",
            error_message="Multi-line\nerror message\nwith special chars: @#$%",
            component="test_module",
            line=42
        )
    
    @patch('src.utils.error_handling.logger')
    def test_log_and_handle_error_different_exception_types(self, mock_logger):
        """Test error logging with different exception types"""
        exceptions = [
            (ValueError("value error"), "ValueError"),
            (TypeError("type error"), "TypeError"),
            (KeyError("key error"), "KeyError"),
            (AttributeError("attribute error"), "AttributeError"),
            (RuntimeError("runtime error"), "RuntimeError")
        ]
        
        for error, expected_type in exceptions:
            mock_logger.reset_mock()
            log_and_handle_error(error)
            
            mock_logger.error.assert_called_once_with(
                "Error occurred",
                error_type=expected_type,
                error_message=str(error)
            )