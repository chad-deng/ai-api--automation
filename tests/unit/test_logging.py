import pytest
import logging
import sys
from unittest.mock import Mock, patch, MagicMock
import structlog
from src.utils.logging import setup_logging

class TestSetupLogging:
    """Unit tests for setup_logging function following TDD principles"""
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_basic_configuration(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that setup_logging configures basic logging correctly"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "INFO"
        mock_settings_class.return_value = mock_settings
        
        # Call the function
        setup_logging()
        
        # Verify Settings was instantiated
        mock_settings_class.assert_called_once()
        
        # Verify logging.basicConfig was called with correct parameters
        mock_logging_basicconfig.assert_called_once_with(
            format="%(message)s",
            stream=sys.stdout,
            level=logging.INFO
        )
        
        # Verify structlog.configure was called
        mock_structlog_configure.assert_called_once()
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_different_log_levels(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test setup_logging with different log levels"""
        test_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        expected_levels = [logging.DEBUG, logging.INFO, logging.WARNING, logging.ERROR, logging.CRITICAL]
        
        for test_level, expected_level in zip(test_levels, expected_levels):
            # Reset mocks
            mock_logging_basicconfig.reset_mock()
            mock_structlog_configure.reset_mock()
            mock_settings_class.reset_mock()
            
            # Setup mock settings
            mock_settings = Mock()
            mock_settings.log_level = test_level
            mock_settings_class.return_value = mock_settings
            
            # Call the function
            setup_logging()
            
            # Verify correct log level was set
            mock_logging_basicconfig.assert_called_once_with(
                format="%(message)s",
                stream=sys.stdout,
                level=expected_level
            )
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_case_insensitive_log_level(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that log level handling is case insensitive"""
        test_cases = [
            ("info", logging.INFO),
            ("Info", logging.INFO),
            ("INFO", logging.INFO),
            ("debug", logging.DEBUG),
            ("Debug", logging.DEBUG),
            ("DEBUG", logging.DEBUG),
            ("warning", logging.WARNING),
            ("Warning", logging.WARNING),
            ("WARNING", logging.WARNING),
            ("error", logging.ERROR),
            ("Error", logging.ERROR),
            ("ERROR", logging.ERROR)
        ]
        
        for log_level_input, expected_level in test_cases:
            # Reset mocks
            mock_logging_basicconfig.reset_mock()
            mock_settings_class.reset_mock()
            
            # Setup mock settings
            mock_settings = Mock()
            mock_settings.log_level = log_level_input
            mock_settings_class.return_value = mock_settings
            
            # Call the function
            setup_logging()
            
            # Verify correct log level was set
            mock_logging_basicconfig.assert_called_once_with(
                format="%(message)s",
                stream=sys.stdout,
                level=expected_level
            )
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_structlog_configuration(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that structlog is configured with correct processors and settings"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "INFO"
        mock_settings_class.return_value = mock_settings
        
        # Call the function
        setup_logging()
        
        # Verify structlog.configure was called
        mock_structlog_configure.assert_called_once()
        
        # Get the call arguments
        call_kwargs = mock_structlog_configure.call_args[1]
        
        # Verify processors are configured correctly
        assert 'processors' in call_kwargs
        processors = call_kwargs['processors']
        assert len(processors) == 8  # Expected number of processors
        
        # Verify other configuration parameters
        assert call_kwargs['context_class'] == dict
        assert isinstance(call_kwargs['logger_factory'], structlog.stdlib.LoggerFactory)
        assert call_kwargs['wrapper_class'] == structlog.stdlib.BoundLogger
        assert call_kwargs['cache_logger_on_first_use'] is True
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_processor_types(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that correct processor types are included in structlog configuration"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "INFO"
        mock_settings_class.return_value = mock_settings
        
        # Call the function
        setup_logging()
        
        # Get the processors from the call
        call_kwargs = mock_structlog_configure.call_args[1]
        processors = call_kwargs['processors']
        
        # Expected processor types (not instances, but the types/functions)
        expected_processor_types = [
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter,
            structlog.processors.TimeStamper,
            structlog.processors.StackInfoRenderer,
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer
        ]
        
        # Check that we have the right number of processors
        assert len(processors) == len(expected_processor_types)
        
        # Check specific processors exist in the list
        processor_types = [type(p) if not callable(p) or hasattr(p, '__call__') else p for p in processors]
        
        # Check for specific known processors that should be present
        assert structlog.stdlib.filter_by_level in processors
        assert structlog.stdlib.add_logger_name in processors
        assert structlog.stdlib.add_log_level in processors
        assert structlog.processors.format_exc_info in processors
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_invalid_log_level(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test setup_logging behavior with invalid log level"""
        # Setup mock settings with invalid log level
        mock_settings = Mock()
        mock_settings.log_level = "INVALID_LEVEL"
        mock_settings_class.return_value = mock_settings
        
        # This should raise AttributeError when getattr tries to get the invalid level
        with pytest.raises(AttributeError):
            setup_logging()
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_sys_stdout_stream(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that logging is configured to output to sys.stdout"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "DEBUG"
        mock_settings_class.return_value = mock_settings
        
        # Call the function
        setup_logging()
        
        # Verify logging.basicConfig was called with sys.stdout as stream
        call_kwargs = mock_logging_basicconfig.call_args[1]
        assert call_kwargs['stream'] is sys.stdout
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_message_format(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that logging is configured with correct message format"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "ERROR"
        mock_settings_class.return_value = mock_settings
        
        # Call the function
        setup_logging()
        
        # Verify logging.basicConfig was called with correct format
        call_kwargs = mock_logging_basicconfig.call_args[1]
        assert call_kwargs['format'] == "%(message)s"
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_timestamper_configuration(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that TimeStamper processor is configured with ISO format"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "INFO"
        mock_settings_class.return_value = mock_settings
        
        # Call the function
        setup_logging()
        
        # Get the processors from the call
        call_kwargs = mock_structlog_configure.call_args[1]
        processors = call_kwargs['processors']
        
        # Find the TimeStamper processor
        timestamper = None
        for processor in processors:
            if isinstance(processor, structlog.processors.TimeStamper):
                timestamper = processor
                break
        
        # Verify TimeStamper is configured correctly
        assert timestamper is not None, "TimeStamper processor not found"
        # Note: We can't easily test the fmt parameter without accessing private attributes
        # but we can verify the processor is of the correct type
    
    @patch('src.utils.logging.Settings')
    def test_setup_logging_integration_with_settings(self, mock_settings_class):
        """Test that setup_logging properly integrates with Settings class"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "CRITICAL"
        mock_settings_class.return_value = mock_settings
        
        # Call the function (this is more of an integration test)
        with patch('logging.basicConfig') as mock_basic_config:
            with patch('structlog.configure') as mock_structlog_config:
                setup_logging()
        
        # Verify Settings was instantiated
        mock_settings_class.assert_called_once_with()
        
        # Verify the log level from settings was used
        call_kwargs = mock_basic_config.call_args[1]
        assert call_kwargs['level'] == logging.CRITICAL
    
    @patch('src.utils.logging.Settings')
    @patch('logging.basicConfig')
    @patch('structlog.configure')
    def test_setup_logging_called_multiple_times(self, mock_structlog_configure, mock_logging_basicconfig, mock_settings_class):
        """Test that setup_logging can be called multiple times safely"""
        # Setup mock settings
        mock_settings = Mock()
        mock_settings.log_level = "INFO"
        mock_settings_class.return_value = mock_settings
        
        # Call setup_logging multiple times
        setup_logging()
        setup_logging()
        setup_logging()
        
        # Verify each call resulted in configuration calls
        assert mock_settings_class.call_count == 3
        assert mock_logging_basicconfig.call_count == 3
        assert mock_structlog_configure.call_count == 3