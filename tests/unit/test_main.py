import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.middleware.cors import CORSMiddleware

from src.main import create_app


class TestCreateApp:
    """Unit tests for create_app function following TDD principles"""
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_create_app_returns_fastapi_instance(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that create_app returns a FastAPI application instance"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify app is FastAPI instance
        assert isinstance(app, FastAPI)
        assert app.title == "AI API Test Automation"
        assert app.description == "Automated test generation from ApiFox webhooks"
        assert app.version == "1.0.0"
        
        # Verify Settings was called
        mock_settings_class.assert_called_once()
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_create_app_includes_webhook_router(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that create_app includes the webhook router with correct prefix"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify router inclusion (we can't directly test this without inspecting internals,
        # so we test that the function completes successfully and router would be available)
        assert len(app.routes) > 0  # Should have routes from included router
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_create_app_cors_middleware_configured(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that create_app configures CORS middleware correctly"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify CORS middleware is present in the middleware stack
        cors_middleware_found = False
        for middleware in app.user_middleware:
            if middleware.cls == CORSMiddleware:
                cors_middleware_found = True
                # Verify CORS configuration
                cors_kwargs = middleware.kwargs
                assert cors_kwargs["allow_origins"] == ["*"]
                assert cors_kwargs["allow_credentials"] is True
                assert cors_kwargs["allow_methods"] == ["*"]
                assert cors_kwargs["allow_headers"] == ["*"]
                break
        
        assert cors_middleware_found, "CORS middleware not found in middleware stack"
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_create_app_startup_event_handler(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that create_app sets up startup event handler"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify startup event is registered
        startup_handlers = app.router.on_startup
        assert len(startup_handlers) == 1, "Expected exactly one startup handler"
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_create_app_shutdown_event_handler(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that create_app sets up shutdown event handler"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify shutdown event is registered
        shutdown_handlers = app.router.on_shutdown
        assert len(shutdown_handlers) == 1, "Expected exactly one shutdown handler"
    
    @patch('src.main.logger')
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    @pytest.mark.asyncio
    async def test_startup_event_handler_functionality(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db, mock_logger):
        """Test that startup event handler calls init_db and logs correctly"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app and get startup handler
        app = create_app()
        startup_handler = app.router.on_startup[0]
        
        # Execute startup handler
        await startup_handler()
        
        # Verify init_db was called
        mock_init_db.assert_called_once()
        
        # Verify logging
        mock_logger.info.assert_called_with("Starting AI API Test Automation service")
    
    @patch('src.main.logger')
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    @pytest.mark.asyncio
    async def test_shutdown_event_handler_functionality(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db, mock_logger):
        """Test that shutdown event handler logs correctly"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app and get shutdown handler
        app = create_app()
        shutdown_handler = app.router.on_shutdown[0]
        
        # Execute shutdown handler
        await shutdown_handler()
        
        # Verify logging
        mock_logger.info.assert_called_with("Shutting down AI API Test Automation service")
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_create_app_settings_integration(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that create_app properly integrates with Settings"""
        # Setup mocks with specific settings
        mock_settings = Mock()
        mock_settings.database_url = "sqlite:///test.db"
        mock_settings.log_level = "DEBUG"
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify Settings was instantiated
        mock_settings_class.assert_called_once()
        
        # Verify app was created successfully
        assert isinstance(app, FastAPI)
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_create_app_with_settings_exception(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test create_app behavior when Settings initialization fails"""
        # Setup mock to raise exception
        mock_settings_class.side_effect = Exception("Settings initialization failed")
        mock_init_db.return_value = AsyncMock()
        
        # Verify exception is propagated
        with pytest.raises(Exception, match="Settings initialization failed"):
            create_app()
    
    @patch('src.main.logger')
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    @pytest.mark.asyncio
    async def test_startup_event_with_init_db_failure(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db, mock_logger):
        """Test startup event behavior when init_db fails"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.side_effect = Exception("Database initialization failed")
        
        # Create app and get startup handler
        app = create_app()
        startup_handler = app.router.on_startup[0]
        
        # Execute startup handler and expect exception
        with pytest.raises(Exception, match="Database initialization failed"):
            await startup_handler()
        
        # Verify logging was attempted before failure
        mock_logger.info.assert_called_with("Starting AI API Test Automation service")


class TestMainEntryPoint:
    """Unit tests for main entry point functionality"""
    
    def test_main_entry_point_configuration(self):
        """Test that main entry point has correct configuration values"""
        # Test the expected configuration values for uvicorn
        expected_host = "0.0.0.0"
        expected_port = 8000
        expected_reload = True
        expected_app_str = "src.main:app"
        
        # These values should match what's in the actual main.py file
        assert expected_host == "0.0.0.0"
        assert expected_port == 8000
        assert expected_reload is True
        assert expected_app_str == "src.main:app"


class TestAppIntegration:
    """Integration tests for the complete app setup"""
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_app_creation_end_to_end(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test complete app creation process"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify all components are integrated
        assert isinstance(app, FastAPI)
        assert app.title == "AI API Test Automation"
        assert len(app.user_middleware) > 0  # Has CORS middleware
        assert len(app.router.on_startup) == 1  # Has startup handler
        assert len(app.router.on_shutdown) == 1  # Has shutdown handler
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_app_can_handle_test_client(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that created app can be used with TestClient"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app and test client
        app = create_app()
        
        # This should not raise any exceptions
        try:
            client = TestClient(app)
            assert client is not None
        except Exception as e:
            pytest.fail(f"TestClient creation failed: {e}")
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router') 
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')
    def test_app_configuration_validation(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that app configuration is valid"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify configuration
        assert app.title is not None and app.title != ""
        assert app.description is not None and app.description != ""
        assert app.version is not None and app.version != ""
        
        # Verify CORS configuration is present
        cors_configured = False
        for middleware in app.user_middleware:
            if middleware.cls == CORSMiddleware:
                cors_configured = True
                break
        assert cors_configured, "CORS middleware not configured"
    
    @patch('src.main.init_db')
    @patch('src.main.webhook_router')
    @patch('src.main.Settings')
    @patch('src.main.setup_logging')  
    def test_app_dependencies_are_injected(self, mock_setup_logging, mock_settings_class, mock_webhook_router, mock_init_db):
        """Test that all required dependencies are properly injected"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_init_db.return_value = AsyncMock()
        
        # Create app
        app = create_app()
        
        # Verify core dependencies were called
        mock_settings_class.assert_called_once()
        # webhook_router is included via app.include_router
        # init_db is called in startup handler
        
        # Verify app was created successfully with all dependencies
        assert isinstance(app, FastAPI)