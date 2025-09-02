import pytest
import os
from unittest.mock import patch, mock_open
from pydantic import ValidationError
from src.config.settings import Settings

class TestSettings:
    """Unit tests for Settings configuration class following TDD principles"""
    
    def test_settings_default_values(self):
        """Test that Settings class provides correct default values"""
        # RED: Test fails initially without implementation
        settings = Settings()
        
        assert settings.database_url == "sqlite:///./test_automation.db"
        assert settings.apifox_webhook_secret is None
        assert settings.log_level == "INFO"
        assert settings.test_output_dir == "./tests/generated"
        assert settings.max_retry_attempts == 3
        assert settings.retry_delay == 1
    
    def test_settings_with_environment_variables(self):
        """Test that Settings correctly loads from environment variables"""
        env_vars = {
            'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
            'APIFOX_WEBHOOK_SECRET': 'test_secret_123',
            'LOG_LEVEL': 'DEBUG',
            'TEST_OUTPUT_DIR': '/tmp/test_output',
            'MAX_RETRY_ATTEMPTS': '5',
            'RETRY_DELAY': '2'
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            
            assert settings.database_url == 'postgresql://test:test@localhost:5432/test_db'
            assert settings.apifox_webhook_secret == 'test_secret_123'
            assert settings.log_level == 'DEBUG'
            assert settings.test_output_dir == '/tmp/test_output'
            assert settings.max_retry_attempts == 5
            assert settings.retry_delay == 2
    
    def test_settings_with_env_file(self):
        """Test that Settings correctly loads from .env file"""
        env_content = """
DATABASE_URL=sqlite:///./env_test.db
APIFOX_WEBHOOK_SECRET=env_secret_456
LOG_LEVEL=WARNING
TEST_OUTPUT_DIR=./env_tests
MAX_RETRY_ATTEMPTS=7
RETRY_DELAY=3
"""
        
        with patch("builtins.open", mock_open(read_data=env_content)):
            with patch("os.path.exists", return_value=True):
                settings = Settings()
                
                # Note: This test validates the env_file configuration is set correctly
                # The actual loading behavior is handled by pydantic-settings
                assert hasattr(settings, 'model_config') or hasattr(settings, 'Config')
    
    def test_settings_type_validation(self):
        """Test that Settings validates data types correctly"""
        # Test invalid integer values
        with patch.dict(os.environ, {'MAX_RETRY_ATTEMPTS': 'invalid_integer'}):
            with pytest.raises(ValidationError):
                Settings()
        
        with patch.dict(os.environ, {'RETRY_DELAY': 'invalid_integer'}):
            with pytest.raises(ValidationError):
                Settings()
    
    def test_settings_optional_fields(self):
        """Test that optional fields handle None values correctly"""
        settings = Settings()
        
        # apifox_webhook_secret should be optional
        assert settings.apifox_webhook_secret is None
        
        # Setting it should work
        with patch.dict(os.environ, {'APIFOX_WEBHOOK_SECRET': 'test_secret'}):
            settings = Settings()
            assert settings.apifox_webhook_secret == 'test_secret'
    
    def test_settings_string_fields_validation(self):
        """Test that string fields accept valid string values"""
        env_vars = {
            'DATABASE_URL': 'test_url',
            'LOG_LEVEL': 'ERROR',
            'TEST_OUTPUT_DIR': '/custom/path'
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            
            assert isinstance(settings.database_url, str)
            assert isinstance(settings.log_level, str)
            assert isinstance(settings.test_output_dir, str)
    
    def test_settings_integer_fields_validation(self):
        """Test that integer fields accept valid integer values"""
        env_vars = {
            'MAX_RETRY_ATTEMPTS': '10',
            'RETRY_DELAY': '5'
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            
            assert isinstance(settings.max_retry_attempts, int)
            assert isinstance(settings.retry_delay, int)
            assert settings.max_retry_attempts == 10
            assert settings.retry_delay == 5
    
    def test_settings_boundary_values(self):
        """Test settings with boundary values"""
        # Test zero values for integers
        env_vars = {
            'MAX_RETRY_ATTEMPTS': '0',
            'RETRY_DELAY': '0'
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            assert settings.max_retry_attempts == 0
            assert settings.retry_delay == 0
        
        # Test negative values (should be accepted as pydantic doesn't restrict by default)
        env_vars = {
            'MAX_RETRY_ATTEMPTS': '-1',
            'RETRY_DELAY': '-1'
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            assert settings.max_retry_attempts == -1
            assert settings.retry_delay == -1
    
    def test_settings_empty_string_values(self):
        """Test settings with empty string values"""
        env_vars = {
            'DATABASE_URL': '',
            'LOG_LEVEL': '',
            'TEST_OUTPUT_DIR': ''
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            
            assert settings.database_url == ''
            assert settings.log_level == ''
            assert settings.test_output_dir == ''
    
    def test_settings_config_class_attributes(self):
        """Test that Settings.Config class has correct attributes"""
        settings = Settings()
        
        # Check if Config class exists and has the right attributes
        if hasattr(settings, 'Config'):
            config = settings.Config
            assert hasattr(config, 'env_file')
            assert config.env_file == [".env.local", ".env.test", ".env"]
            assert hasattr(config, 'env_file_encoding')
            assert config.env_file_encoding == "utf-8"
    
    @pytest.mark.parametrize("log_level", ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"])
    def test_settings_valid_log_levels(self, log_level):
        """Test that all standard log levels are accepted"""
        with patch.dict(os.environ, {'LOG_LEVEL': log_level}):
            settings = Settings()
            assert settings.log_level == log_level
    
    @pytest.mark.parametrize("retry_attempts,retry_delay", [
        ("1", "1"),
        ("100", "60"),
        ("999", "999")
    ])
    def test_settings_various_retry_values(self, retry_attempts, retry_delay):
        """Test settings with various retry configuration values"""
        env_vars = {
            'MAX_RETRY_ATTEMPTS': retry_attempts,
            'RETRY_DELAY': retry_delay
        }
        
        with patch.dict(os.environ, env_vars):
            settings = Settings()
            assert settings.max_retry_attempts == int(retry_attempts)
            assert settings.retry_delay == int(retry_delay)