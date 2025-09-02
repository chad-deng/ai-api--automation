import pytest
import asyncio
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from unittest.mock import patch, Mock, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from src.main import create_app
from src.database.models import Base, WebhookEvent, GeneratedTest
from src.webhook.schemas import ApiFoxWebhook
from src.generators.test_generator import TestGenerator
from src.config.settings import Settings


class TestWebhookToTestGenerationIntegration:
    """Integration tests for end-to-end webhook processing to test generation"""
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create temporary directory for test output files"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def test_database(self):
        """Create in-memory test database"""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        TestSession = sessionmaker(bind=engine)
        session = TestSession()
        yield session
        session.close()
    
    @pytest.fixture
    def sample_webhook_data(self):
        """Sample ApiFox webhook data for testing"""
        return {
            "event_id": "evt_123456",
            "event_type": "api_updated",
            "project_id": "proj_test",
            "timestamp": datetime.now(),
            "data": {
                "api": {
                    "id": "api_123",
                    "name": "Create User Profile",
                    "method": "POST",
                    "path": "/api/v1/users/profile",
                    "description": "Create a new user profile",
                    "parameters": {
                        "path": {},
                        "query": {},
                        "header": {"Authorization": "Bearer token"}
                    },
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "email": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "User profile created",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "string"},
                                            "name": {"type": "string"},
                                            "email": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    
    @pytest.fixture
    def test_generator(self, temp_output_dir):
        """Create TestGenerator with mocked settings pointing to temp directory"""
        with patch('src.generators.test_generator.Settings') as mock_settings_class:
            mock_settings = Mock()
            mock_settings.test_output_dir = temp_output_dir
            mock_settings_class.return_value = mock_settings
            
            with patch('src.generators.test_generator.get_config_manager') as mock_config_manager:
                mock_config = Mock()
                mock_config.config.enabled_test_types = [Mock(value='basic'), Mock(value='crud')]
                mock_config_manager.return_value = mock_config
                
                # Mock advanced generators to avoid complex dependencies
                with patch('src.generators.test_generator.ErrorScenarioGenerator'), \
                     patch('src.generators.test_generator.PerformanceTestGenerator'), \
                     patch('src.generators.test_generator.ValidationTestGenerator'), \
                     patch('src.generators.test_generator.TestQualityChecker'), \
                     patch('src.generators.test_generator.TestDataFactory'):
                    
                    generator = TestGenerator()
                    return generator
    
    @pytest.mark.asyncio
    async def test_webhook_to_test_generation_end_to_end(
        self, 
        test_generator, 
        test_database, 
        sample_webhook_data,
        temp_output_dir
    ):
        """Test complete end-to-end workflow from webhook to generated test files"""
        
        # Create webhook object
        webhook = ApiFoxWebhook(**sample_webhook_data)
        
        # Execute the complete workflow
        await test_generator.generate_tests_from_webhook(webhook, test_database)
        
        # Verify database records were created
        db_tests = test_database.query(GeneratedTest).filter_by(
            webhook_event_id=webhook.event_id
        ).all()
        
        assert len(db_tests) >= 1, "At least one test should be generated"
        
        for db_test in db_tests:
            assert db_test.webhook_event_id == webhook.event_id
            assert db_test.test_name.startswith("test_create_user_profile")
            assert db_test.test_content is not None
            assert len(db_test.test_content) > 0
            assert db_test.file_path is not None
            assert db_test.status == "generated"
            
            # Verify test file was created
            test_file_path = Path(db_test.file_path)
            assert test_file_path.exists(), f"Test file should exist at {db_test.file_path}"
            
            # Verify file content
            with open(test_file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()
                assert len(file_content) > 0
                assert file_content == db_test.test_content
    
    @pytest.mark.asyncio
    async def test_webhook_processing_with_invalid_data(
        self, 
        test_generator, 
        test_database, 
        temp_output_dir
    ):
        """Test webhook processing with invalid or missing API data"""
        
        # Create webhook with missing API data
        invalid_webhook_data = {
            "event_id": "evt_invalid",
            "event_type": "api_updated", 
            "project_id": "proj_test",
            "timestamp": datetime.now(),
            "data": {}  # Missing 'api' key
        }
        
        webhook = ApiFoxWebhook(**invalid_webhook_data)
        
        # Should not raise exception, but should not generate tests
        await test_generator.generate_tests_from_webhook(webhook, test_database)
        
        # Verify no database records were created
        db_tests = test_database.query(GeneratedTest).filter_by(
            webhook_event_id=webhook.event_id
        ).all()
        
        assert len(db_tests) == 0, "No tests should be generated for invalid webhook data"
    
    @pytest.mark.asyncio
    async def test_multiple_test_types_generation(
        self, 
        test_generator, 
        test_database, 
        sample_webhook_data,
        temp_output_dir
    ):
        """Test generation of multiple test types for a single API"""
        
        # Mock config to enable multiple test types
        with patch.object(test_generator, '_determine_test_types') as mock_determine:
            mock_determine.return_value = ["basic", "crud", "authentication"]
            
            webhook = ApiFoxWebhook(**sample_webhook_data)
            
            await test_generator.generate_tests_from_webhook(webhook, test_database)
            
            # Verify multiple test files were generated
            db_tests = test_database.query(GeneratedTest).filter_by(
                webhook_event_id=webhook.event_id
            ).all()
            
            assert len(db_tests) == 3, "Should generate 3 different test types"
            
            test_types_generated = set()
            for db_test in db_tests:
                # Extract test type from test name
                test_name_parts = db_test.test_name.split('_')
                test_type = test_name_parts[-1]  # Last part should be test type
                test_types_generated.add(test_type)
                
                # Verify file exists
                assert Path(db_test.file_path).exists()
            
            assert "basic" in test_types_generated
            assert "crud" in test_types_generated  
            assert "authentication" in test_types_generated
    
    @pytest.mark.asyncio
    async def test_api_spec_extraction_and_standardization(
        self,
        test_generator,
        sample_webhook_data
    ):
        """Test API specification extraction and standardization process"""
        
        webhook = ApiFoxWebhook(**sample_webhook_data)
        
        # Test API spec extraction
        api_spec = test_generator._extract_api_spec(webhook)
        
        assert api_spec is not None
        assert api_spec['id'] == "api_123"
        assert api_spec['name'] == "Create User Profile"
        assert api_spec['method'] == "POST"
        assert api_spec['path'] == "/api/v1/users/profile"
        assert api_spec['description'] == "Create a new user profile"
        assert 'parameters' in api_spec
        assert 'request_body' in api_spec
        assert 'responses' in api_spec
        
        # Test standardization
        standardized_spec = test_generator._standardize_api_spec(api_spec)
        
        assert standardized_spec['operationId'] == "create_user_profile"
        assert standardized_spec['method'] == "POST"
        assert standardized_spec['path'] == "/api/v1/users/profile"
        assert 'request_body' in standardized_spec
        assert 'content' in standardized_spec['request_body']
    
    @pytest.mark.asyncio
    async def test_test_type_determination_logic(self, test_generator, sample_webhook_data):
        """Test the logic for determining which test types to generate"""
        
        # Mock config manager to control enabled test types
        with patch.object(test_generator.config_manager, 'config') as mock_config:
            # Test with all types enabled
            mock_config.enabled_test_types = [
                Mock(value='basic'),
                Mock(value='crud'), 
                Mock(value='error_scenarios'),
                Mock(value='authentication'),
                Mock(value='performance'),
                Mock(value='validation')
            ]
            
            api_spec = {
                'method': 'POST',  # Should enable CRUD tests
                'name': 'Create User Profile',
                'path': '/api/v1/users'
            }
            
            test_types = test_generator._determine_test_types(api_spec)
            
            # Should include basic, crud, error_scenarios, authentication, performance, validation
            assert "basic" in test_types
            assert "crud" in test_types  # POST method enables CRUD
            assert "error_scenarios" in test_types
            assert "authentication" in test_types
            assert "performance" in test_types
            assert "validation" in test_types
            
            # Test with GET method (should not include CRUD)
            api_spec['method'] = 'GET'
            test_types = test_generator._determine_test_types(api_spec)
            
            assert "basic" in test_types
            assert "crud" not in test_types  # GET method doesn't enable CRUD
    
    @pytest.mark.asyncio
    async def test_file_naming_and_organization(
        self,
        test_generator,
        test_database,
        sample_webhook_data,
        temp_output_dir
    ):
        """Test that generated files follow proper naming conventions and organization"""
        
        webhook = ApiFoxWebhook(**sample_webhook_data)
        
        with patch.object(test_generator, '_determine_test_types') as mock_determine:
            mock_determine.return_value = ["basic", "crud"]
            
            await test_generator.generate_tests_from_webhook(webhook, test_database)
            
            # Check generated files
            db_tests = test_database.query(GeneratedTest).all()
            
            for db_test in db_tests:
                file_path = Path(db_test.file_path)
                
                # Verify file is in correct output directory
                assert str(file_path).startswith(temp_output_dir)
                
                # Verify filename follows convention: test_{api_name}_{method}_{type}.py
                filename = file_path.name
                assert filename.startswith("test_create_user_profile_post_")
                assert filename.endswith(".py")
                
                # Verify file contains valid Python content
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    assert "import" in content  # Should have import statements
                    assert "def test_" in content  # Should have test functions
    
    @pytest.mark.asyncio
    async def test_database_transaction_integrity(
        self,
        test_generator, 
        test_database,
        sample_webhook_data,
        temp_output_dir
    ):
        """Test that database operations maintain transaction integrity"""
        
        webhook = ApiFoxWebhook(**sample_webhook_data)
        
        # Test successful transaction
        await test_generator.generate_tests_from_webhook(webhook, test_database)
        
        # Verify all records were committed
        db_tests = test_database.query(GeneratedTest).filter_by(
            webhook_event_id=webhook.event_id
        ).all()
        
        assert len(db_tests) > 0
        
        # Test that records persist after session operations
        test_database.expire_all()  # Clear session cache
        
        persisted_tests = test_database.query(GeneratedTest).filter_by(
            webhook_event_id=webhook.event_id
        ).all()
        
        assert len(persisted_tests) == len(db_tests)
        
        for original, persisted in zip(db_tests, persisted_tests):
            assert original.webhook_event_id == persisted.webhook_event_id
            assert original.test_name == persisted.test_name
            assert original.status == persisted.status
    
    @pytest.mark.asyncio
    async def test_error_handling_during_generation(
        self,
        test_generator,
        test_database, 
        sample_webhook_data,
        temp_output_dir
    ):
        """Test error handling during test generation process"""
        
        webhook = ApiFoxWebhook(**sample_webhook_data)
        
        # Mock template rendering to raise an exception
        with patch.object(test_generator, '_generate_test_content') as mock_generate:
            mock_generate.side_effect = Exception("Template rendering failed")
            
            # Should raise the exception
            with pytest.raises(Exception, match="Template rendering failed"):
                await test_generator.generate_tests_from_webhook(webhook, test_database)
            
            # Verify no partial data was committed to database
            db_tests = test_database.query(GeneratedTest).filter_by(
                webhook_event_id=webhook.event_id
            ).all()
            
            assert len(db_tests) == 0, "No records should be committed on error"


class TestAdvancedGenerationWorkflow:
    """Integration tests for advanced test generation workflows"""
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create temporary directory for test output files"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def test_database(self):
        """Create in-memory test database"""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        TestSession = sessionmaker(bind=engine)
        session = TestSession()
        yield session
        session.close()
    
    @pytest.fixture
    def advanced_test_generator(self, temp_output_dir):
        """Create TestGenerator configured for advanced generation"""
        with patch('src.generators.test_generator.Settings') as mock_settings_class:
            mock_settings = Mock()
            mock_settings.test_output_dir = temp_output_dir
            mock_settings_class.return_value = mock_settings
            
            # Mock quality checker and config manager
            with patch('src.generators.test_generator.get_config_manager') as mock_config_manager, \
                 patch('src.generators.test_generator.TestQualityChecker') as mock_quality_checker_class:
                
                # Configure quality checker mock
                mock_quality_checker = Mock()
                mock_quality_report = Mock()
                mock_quality_report.quality_score = 0.95  # High quality score
                mock_quality_report.file_path = "test_file.py"
                mock_quality_report.issues = []
                mock_quality_checker.check_test_file.return_value = mock_quality_report
                mock_quality_checker.generate_quality_summary.return_value = {
                    "average_quality_score": 0.95,
                    "total_files": 1,
                    "files_passed": 1
                }
                mock_quality_checker_class.return_value = mock_quality_checker
                
                # Configure config manager mock
                mock_config = Mock()
                mock_config.config.enabled_test_types = [Mock(value='error_scenarios')]
                mock_config.config.quality.min_quality_score = 0.8
                mock_config_manager.return_value = mock_config
                
                # Mock advanced generators
                with patch('src.generators.test_generator.ErrorScenarioGenerator') as mock_error_gen, \
                     patch('src.generators.test_generator.PerformanceTestGenerator') as mock_perf_gen, \
                     patch('src.generators.test_generator.ValidationTestGenerator') as mock_val_gen, \
                     patch('src.generators.test_generator.TestDataFactory'):
                    
                    # Configure advanced generator mocks
                    mock_error_gen.return_value.generate_test_file.return_value = "# Error scenario test content"
                    mock_perf_gen.return_value.generate_test_file.return_value = "# Performance test content"
                    mock_val_gen.return_value.generate_test_file.return_value = "# Validation test content"
                    
                    generator = TestGenerator()
                    return generator
    
    @pytest.fixture
    def sample_webhook_data(self):
        """Sample webhook data for advanced testing"""
        return {
            "event_id": "evt_advanced_123",
            "event_type": "api_updated",
            "project_id": "proj_advanced",
            "timestamp": datetime.now(),
            "data": {
                "api": {
                    "id": "api_adv_123",
                    "name": "Advanced User API",
                    "method": "POST",
                    "path": "/api/v2/users/advanced",
                    "description": "Advanced user management endpoint",
                    "parameters": {},
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "username": {"type": "string"},
                                        "profile": {"type": "object"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {"description": "Created"},
                        "400": {"description": "Bad Request"},
                        "500": {"description": "Internal Error"}
                    }
                }
            }
        }
    
    @pytest.mark.asyncio
    async def test_advanced_generation_with_quality_check(
        self,
        advanced_test_generator,
        test_database,
        sample_webhook_data,
        temp_output_dir
    ):
        """Test advanced test generation workflow with quality validation"""
        
        webhook = ApiFoxWebhook(**sample_webhook_data)
        
        # Mock the _generate_advanced_test_file to create actual files
        def mock_generate_advanced_test_file(api_spec, test_type):
            test_file_path = Path(temp_output_dir) / f"test_advanced_{test_type}.py"
            test_content = f"# {test_type.title()} test for {api_spec['operationId']}\nimport pytest\n\ndef test_example():\n    assert True"
            with open(test_file_path, 'w', encoding='utf-8') as f:
                f.write(test_content)
            return str(test_file_path)
        
        advanced_test_generator._generate_advanced_test_file = mock_generate_advanced_test_file
        
        # Execute advanced generation workflow
        result = await advanced_test_generator.generate_advanced_tests_with_quality_check(
            webhook, test_database
        )
        
        # Verify successful result
        assert result["success"] is True
        assert len(result["generated_files"]) >= 1
        assert "quality_summary" in result
        assert "quality_reports" in result
        
        # Verify quality metrics
        quality_summary = result["quality_summary"]
        assert quality_summary["average_quality_score"] == 0.95
        
        # Verify database records
        db_tests = test_database.query(GeneratedTest).filter_by(
            webhook_event_id=webhook.event_id
        ).all()
        
        assert len(db_tests) >= 1
        
        for db_test in db_tests:
            assert db_test.webhook_event_id == webhook.event_id
            assert db_test.status == "generated"
            assert Path(db_test.file_path).exists()
    
    @pytest.mark.asyncio 
    async def test_quality_check_failure_handling(
        self,
        advanced_test_generator,
        test_database,
        sample_webhook_data,
        temp_output_dir
    ):
        """Test handling of quality check failures"""
        
        # Configure quality checker to return low quality score
        low_quality_report = Mock()
        low_quality_report.quality_score = 0.5  # Below threshold
        low_quality_report.file_path = "test_file.py"
        low_quality_report.issues = [
            Mock(severity='error', message='Critical issue'),
            Mock(severity='warning', message='Warning issue')
        ]
        
        advanced_test_generator.quality_checker.check_test_file.return_value = low_quality_report
        
        webhook = ApiFoxWebhook(**sample_webhook_data)
        
        # Mock file generation
        def mock_generate_advanced_test_file(api_spec, test_type):
            test_file_path = Path(temp_output_dir) / f"test_low_quality_{test_type}.py"
            test_content = "# Low quality test\npass"
            with open(test_file_path, 'w', encoding='utf-8') as f:
                f.write(test_content)
            return str(test_file_path)
        
        advanced_test_generator._generate_advanced_test_file = mock_generate_advanced_test_file
        
        result = await advanced_test_generator.generate_advanced_tests_with_quality_check(
            webhook, test_database
        )
        
        # Should still succeed but with no generated files due to quality failure
        assert result["success"] is True
        assert len(result["generated_files"]) == 0  # No files should pass quality check
        
        # Verify quality reports show the issues
        quality_reports = result["quality_reports"]
        assert len(quality_reports) >= 1
        
        for report in quality_reports:
            assert report["score"] == 0.5
            assert report["errors"] == 1  # One error severity issue
            assert report["issues"] == 2  # Total issues
        
        # Verify no database records for failed quality checks
        db_tests = test_database.query(GeneratedTest).filter_by(
            webhook_event_id=webhook.event_id
        ).all()
        
        assert len(db_tests) == 0