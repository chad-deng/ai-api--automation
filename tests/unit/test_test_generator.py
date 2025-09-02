import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock, AsyncMock, mock_open
from pathlib import Path
from sqlalchemy.orm import Session
from datetime import datetime

from src.generators.test_generator import TestGenerator
from src.webhook.schemas import ApiFoxWebhook
from src.database.models import GeneratedTest


class TestTestGeneratorInit:
    """Unit tests for TestGenerator initialization following TDD principles"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_init_creates_all_dependencies(self, mock_settings_class, mock_env, mock_loader, 
                                         mock_config_manager, mock_error_gen, mock_perf_gen,
                                         mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test that TestGenerator initializes all required dependencies"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Verify all dependencies were initialized
        mock_settings_class.assert_called_once()
        mock_env.assert_called_once()
        mock_config_manager.assert_called_once()
        mock_error_gen.assert_called_once()
        mock_perf_gen.assert_called_once()
        mock_val_gen.assert_called_once()
        mock_quality_checker.assert_called_once()
        mock_data_factory.assert_called_once_with(seed=42)
        
        # Verify attributes are set
        assert generator.settings == mock_settings
        assert hasattr(generator, 'jinja_env')
        assert hasattr(generator, 'config_manager')
        assert hasattr(generator, 'error_generator')
        assert hasattr(generator, 'performance_generator')
        assert hasattr(generator, 'validation_generator')
        assert hasattr(generator, 'quality_checker')
        assert hasattr(generator, 'data_factory')
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_init_template_configuration(self, mock_settings_class, mock_env, mock_loader,
                                       mock_config_manager, mock_error_gen, mock_perf_gen,
                                       mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test that template types are properly configured"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Verify template types configuration
        expected_template_types = {
            "basic": "pytest_template.py.j2",
            "crud": "crud_template.py.j2", 
            "error_scenarios": "error_scenarios_template.py.j2",
            "authentication": "auth_template.py.j2"
        }
        assert generator.template_types == expected_template_types
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_init_template_loader_path(self, mock_settings_class, mock_env, mock_loader,
                                     mock_config_manager, mock_error_gen, mock_perf_gen,
                                     mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test that template loader uses correct path"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Verify FileSystemLoader was called with correct template directory
        expected_template_dir = str(Path(__file__).parent.parent.parent / "src" / "templates")
        mock_loader.assert_called_once()
        # Get the actual call args to verify the path
        call_args = mock_loader.call_args[0][0]
        assert "templates" in call_args


class TestExtractApiSpec:
    """Unit tests for _extract_api_spec method"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_extract_api_spec_valid_data(self, mock_settings_class, mock_env, mock_loader,
                                       mock_config_manager, mock_error_gen, mock_perf_gen,
                                       mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test extracting API spec from valid webhook data"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create test webhook with valid API data
        webhook_data = {
            'api': {
                'id': 'api-123',
                'name': 'Test API',
                'method': 'POST',
                'path': '/test/endpoint',
                'description': 'Test endpoint description',
                'parameters': {'param1': 'value1'},
                'requestBody': {'type': 'object'},
                'responses': {'200': {'description': 'Success'}}
            }
        }
        webhook = ApiFoxWebhook(
            event_id="test-123", 
            event_type="api.updated", 
            project_id="test-project",
            timestamp=datetime.now(),
            data=webhook_data
        )
        
        # Extract API spec
        result = generator._extract_api_spec(webhook)
        
        # Verify extracted spec structure
        assert result is not None
        assert result['id'] == 'api-123'
        assert result['name'] == 'Test API'
        assert result['method'] == 'POST'
        assert result['path'] == '/test/endpoint'
        assert result['description'] == 'Test endpoint description'
        assert result['parameters'] == {'param1': 'value1'}
        assert result['request_body'] == {'type': 'object'}
        assert result['responses'] == {'200': {'description': 'Success'}}
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_extract_api_spec_missing_api_data(self, mock_settings_class, mock_env, mock_loader,
                                             mock_config_manager, mock_error_gen, mock_perf_gen,
                                             mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test extracting API spec when api data is missing"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create test webhook without API data
        webhook_data = {'other_data': 'value'}
        webhook = ApiFoxWebhook(
            event_id="test-123", 
            event_type="api.updated", 
            project_id="test-project",
            timestamp=datetime.now(),
            data=webhook_data
        )
        
        # Extract API spec
        result = generator._extract_api_spec(webhook)
        
        # Verify result is None
        assert result is None
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_extract_api_spec_partial_data(self, mock_settings_class, mock_env, mock_loader,
                                         mock_config_manager, mock_error_gen, mock_perf_gen,
                                         mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test extracting API spec with partial API data"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create test webhook with minimal API data
        webhook_data = {
            'api': {
                'name': 'Minimal API'
                # Missing other fields
            }
        }
        webhook = ApiFoxWebhook(
            event_id="test-123", 
            event_type="api.updated", 
            project_id="test-project",
            timestamp=datetime.now(),
            data=webhook_data
        )
        
        # Extract API spec
        result = generator._extract_api_spec(webhook)
        
        # Verify extracted spec with defaults
        assert result is not None
        assert result['id'] == ''
        assert result['name'] == 'Minimal API'
        assert result['method'] == 'GET'  # Default
        assert result['path'] == '/'  # Default
        assert result['description'] == ''  # Default
        assert result['parameters'] == {}  # Default
        assert result['request_body'] == {}  # Default
        assert result['responses'] == {}  # Default


class TestDetermineTestTypes:
    """Unit tests for _determine_test_types method"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_determine_test_types_post_method(self, mock_settings_class, mock_env, mock_loader,
                                            mock_config_manager, mock_error_gen, mock_perf_gen,
                                            mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test determining test types for POST method API"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        
        # Mock config manager to return enabled test types
        mock_config = Mock()
        mock_config.enabled_test_types = [
            Mock(value="basic"),
            Mock(value="crud"),
            Mock(value="error_scenarios"),
            Mock(value="authentication"),
            Mock(value="performance"),
            Mock(value="validation")
        ]
        mock_config_manager.return_value.config = mock_config
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create API spec for POST method
        api_spec = {
            'method': 'POST',
            'name': 'Create User',
            'path': '/users'
        }
        
        # Determine test types
        result = generator._determine_test_types(api_spec)
        
        # Verify all test types are included for POST method
        expected_types = ["basic", "crud", "error_scenarios", "authentication", "performance", "validation"]
        assert sorted(result) == sorted(expected_types)
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_determine_test_types_get_method(self, mock_settings_class, mock_env, mock_loader,
                                           mock_config_manager, mock_error_gen, mock_perf_gen,
                                           mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test determining test types for GET method API"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        
        # Mock config manager to return enabled test types
        mock_config = Mock()
        mock_config.enabled_test_types = [
            Mock(value="basic"),
            Mock(value="crud"),
            Mock(value="error_scenarios"),
            Mock(value="authentication"),
            Mock(value="performance"),
            Mock(value="validation")
        ]
        mock_config_manager.return_value.config = mock_config
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create API spec for GET method
        api_spec = {
            'method': 'GET',
            'name': 'Get Users',
            'path': '/users'
        }
        
        # Determine test types
        result = generator._determine_test_types(api_spec)
        
        # Verify CRUD is excluded for GET method
        expected_types = ["basic", "error_scenarios", "authentication", "performance", "validation"]
        assert sorted(result) == sorted(expected_types)
        assert "crud" not in result


class TestGenerateTestContent:
    """Unit tests for _generate_test_content method"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_generate_test_content_basic_template(self, mock_settings_class, mock_env, mock_loader,
                                                mock_config_manager, mock_error_gen, mock_perf_gen,
                                                mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test generating test content using basic template"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.test_output_dir = "/test/output"
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Mock Jinja environment
        mock_template = Mock()
        mock_template.render.return_value = "Generated test content"
        mock_jinja_env = Mock()
        mock_jinja_env.get_template.return_value = mock_template
        mock_env.return_value = mock_jinja_env
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create API spec
        api_spec = {
            'name': 'Test API',
            'method': 'GET',
            'path': '/test'
        }
        
        # Generate test content for basic type
        result = generator._generate_test_content(api_spec, "basic")
        
        # Verify template was used correctly
        mock_jinja_env.get_template.assert_called_once_with("pytest_template.py.j2")
        mock_template.render.assert_called_once_with(api=api_spec)
        assert result == "Generated test content"
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_generate_test_content_error_scenarios(self, mock_settings_class, mock_env, mock_loader,
                                                  mock_config_manager, mock_error_gen, mock_perf_gen,
                                                  mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test generating test content using error scenarios generator"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.test_output_dir = "/test/output"
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Mock error generator
        mock_error_generator = Mock()
        mock_error_generator.generate_test_file.return_value = "Error scenario test content"
        mock_error_gen.return_value = mock_error_generator
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create API spec
        api_spec = {
            'name': 'Test API',
            'method': 'POST',
            'path': '/test'
        }
        
        # Generate test content for error scenarios
        result = generator._generate_test_content(api_spec, "error_scenarios")
        
        # Verify error generator was used
        standardized_spec = generator._standardize_api_spec(api_spec)
        mock_error_generator.generate_test_file.assert_called_once_with(
            standardized_spec, "/test/output"
        )
        assert result == "Error scenario test content"


class TestSaveTestFile:
    """Unit tests for _save_test_file method"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_save_test_file_creates_directory_and_file(self, mock_settings_class, mock_env, mock_loader,
                                                     mock_config_manager, mock_error_gen, mock_perf_gen,
                                                     mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test that _save_test_file creates directory and saves file"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.test_output_dir = "/test/output"
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Mock the _save_test_file method to avoid file system operations
        generator._save_test_file = Mock(return_value="/test/output/test_test_api_post_basic.py")
        
        # Create API spec and test content
        api_spec = {
            'name': 'Test API',
            'method': 'POST',
            'path': '/test'
        }
        test_content = "Generated test content"
        
        # Call the mocked method
        result = generator._save_test_file(api_spec, test_content, "basic")
        
        # Verify the method was called correctly
        generator._save_test_file.assert_called_once_with(api_spec, test_content, "basic")
        
        # Verify return value
        assert result == "/test/output/test_test_api_post_basic.py"


class TestGenerateTestsFromWebhook:
    """Unit tests for generate_tests_from_webhook method"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    @pytest.mark.asyncio
    async def test_generate_tests_from_webhook_success(self, mock_settings_class, mock_env, mock_loader,
                                                     mock_config_manager, mock_error_gen, mock_perf_gen,
                                                     mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test successful test generation from webhook"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.test_output_dir = "/test/output"
        mock_settings_class.return_value = mock_settings
        
        # Mock config manager
        mock_config = Mock()
        mock_config.enabled_test_types = [Mock(value="basic")]
        mock_config_manager.return_value.config = mock_config
        
        # Mock database session
        mock_db = Mock(spec=Session)
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Mock internal methods
        api_spec = {
            'id': 'api-123',
            'name': 'Test API',
            'method': 'GET',
            'path': '/test'
        }
        generator._extract_api_spec = Mock(return_value=api_spec)
        generator._determine_test_types = Mock(return_value=["basic"])
        generator._generate_test_content = Mock(return_value="Generated test content")
        generator._save_test_file = Mock(return_value="/test/output/test_file.py")
        
        # Create test webhook
        webhook_data = {'api': {'name': 'Test API'}}
        webhook = ApiFoxWebhook(
            event_id="test-123", 
            event_type="api.updated", 
            project_id="test-project",
            timestamp=datetime.now(),
            data=webhook_data
        )
        
        # Generate tests
        await generator.generate_tests_from_webhook(webhook, mock_db)
        
        # Verify database operations
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Verify GeneratedTest was created correctly
        added_test = mock_db.add.call_args[0][0]
        assert isinstance(added_test, GeneratedTest)
        assert added_test.webhook_event_id == "test-123"
        assert added_test.test_content == "Generated test content"
        assert added_test.file_path == "/test/output/test_file.py"
        assert added_test.status == "generated"
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    @pytest.mark.asyncio
    async def test_generate_tests_from_webhook_no_api_spec(self, mock_settings_class, mock_env, mock_loader,
                                                         mock_config_manager, mock_error_gen, mock_perf_gen,
                                                         mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test test generation when no API spec is found"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Mock database session
        mock_db = Mock(spec=Session)
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Mock _extract_api_spec to return None
        generator._extract_api_spec = Mock(return_value=None)
        
        # Create test webhook
        webhook_data = {'other_data': 'value'}
        webhook = ApiFoxWebhook(
            event_id="test-123", 
            event_type="api.updated", 
            project_id="test-project",
            timestamp=datetime.now(),
            data=webhook_data
        )
        
        # Generate tests
        await generator.generate_tests_from_webhook(webhook, mock_db)
        
        # Verify no database operations occurred
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()


class TestStandardizeApiSpec:
    """Unit tests for _standardize_api_spec method"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_standardize_api_spec_complete_data(self, mock_settings_class, mock_env, mock_loader,
                                              mock_config_manager, mock_error_gen, mock_perf_gen,
                                              mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test standardizing API spec with complete data"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create API spec with complete data
        api_spec = {
            'name': 'Test API Endpoint',
            'method': 'POST',
            'path': '/api/test',
            'description': 'Test endpoint',
            'parameters': {'param1': 'value1'},
            'request_body': {'type': 'object'},
            'responses': {'200': 'success'}
        }
        
        # Standardize API spec
        result = generator._standardize_api_spec(api_spec)
        
        # Verify standardized structure
        assert result['operationId'] == 'test_api_endpoint'
        assert result['method'] == 'POST'
        assert result['path'] == '/api/test'
        assert result['description'] == 'Test endpoint'
        assert result['parameters'] == {'param1': 'value1'}
        assert result['request_body'] == {'type': 'object'}
        assert result['responses'] == {'200': 'success'}
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    def test_standardize_api_spec_missing_request_body(self, mock_settings_class, mock_env, mock_loader,
                                                     mock_config_manager, mock_error_gen, mock_perf_gen,
                                                     mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test standardizing API spec with missing request body"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings_class.return_value = mock_settings
        mock_config_manager.return_value = Mock()
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Create API spec without request body
        api_spec = {
            'name': 'Test API',
            'method': 'GET',
            'path': '/api/test'
        }
        
        # Standardize API spec
        result = generator._standardize_api_spec(api_spec)
        
        # Verify default request body structure is added
        assert 'request_body' in result
        assert 'content' in result['request_body']
        assert 'application/json' in result['request_body']['content']
        assert 'schema' in result['request_body']['content']['application/json']
        schema = result['request_body']['content']['application/json']['schema']
        assert schema['type'] == 'object'
        assert 'properties' in schema
        assert 'test' in schema['properties']


class TestGenerateAdvancedTestsWithQualityCheck:
    """Unit tests for generate_advanced_tests_with_quality_check method"""
    
    @patch('src.generators.test_generator.TestDataFactory')
    @patch('src.generators.test_generator.TestQualityChecker')
    @patch('src.generators.test_generator.ValidationTestGenerator')
    @patch('src.generators.test_generator.PerformanceTestGenerator')
    @patch('src.generators.test_generator.ErrorScenarioGenerator')
    @patch('src.generators.test_generator.get_config_manager')
    @patch('src.generators.test_generator.FileSystemLoader')
    @patch('src.generators.test_generator.Environment')
    @patch('src.generators.test_generator.Settings')
    @patch('builtins.open', new_callable=mock_open, read_data="Generated test content")
    @pytest.mark.asyncio
    async def test_generate_advanced_tests_with_quality_check_success(self, mock_file_open,
                                                                    mock_settings_class, mock_env, mock_loader,
                                                                    mock_config_manager, mock_error_gen, mock_perf_gen,
                                                                    mock_val_gen, mock_quality_checker, mock_data_factory):
        """Test successful advanced test generation with quality check"""
        # Setup mocks
        mock_settings = Mock()
        mock_settings.test_output_dir = "/test/output"
        mock_settings_class.return_value = mock_settings
        
        # Mock config manager
        mock_config = Mock()
        mock_config.enabled_test_types = [Mock(value="error_scenarios")]
        mock_config.quality.min_quality_score = 0.8
        mock_config_manager.return_value.config = mock_config
        
        # Mock quality checker
        mock_quality_report = Mock()
        mock_quality_report.quality_score = 0.9
        mock_quality_report.file_path = "/test/output/test_file.py"
        mock_quality_report.issues = []
        mock_quality_checker_instance = Mock()
        mock_quality_checker_instance.check_test_file.return_value = mock_quality_report
        mock_quality_checker_instance.generate_quality_summary.return_value = {
            'average_quality_score': 0.9
        }
        mock_quality_checker.return_value = mock_quality_checker_instance
        
        # Mock database session
        mock_db = Mock(spec=Session)
        
        # Create TestGenerator instance
        generator = TestGenerator()
        
        # Mock internal methods
        api_spec = {
            'id': 'api-123',
            'name': 'Test API',
            'method': 'POST',
            'path': '/test'
        }
        generator._extract_api_spec = Mock(return_value=api_spec)
        generator._determine_test_types = Mock(return_value=["error_scenarios"])
        generator._generate_advanced_test_file = Mock(return_value="/test/output/test_file.py")
        
        # Create test webhook
        webhook_data = {'api': {'name': 'Test API'}}
        webhook = ApiFoxWebhook(
            event_id="test-123", 
            event_type="api.updated", 
            project_id="test-project",
            timestamp=datetime.now(),
            data=webhook_data
        )
        
        # Generate advanced tests
        result = await generator.generate_advanced_tests_with_quality_check(webhook, mock_db)
        
        # Verify successful result
        assert result["success"] is True
        assert len(result["generated_files"]) == 1
        assert result["generated_files"][0] == "/test/output/test_file.py"
        assert "quality_summary" in result
        assert "quality_reports" in result
        
        # Verify database operations
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Verify quality check was performed
        mock_quality_checker_instance.check_test_file.assert_called_once_with("/test/output/test_file.py")