import pytest
import json
import yaml
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, patch, mock_open
from pydantic import ValidationError

from src.generators.config_manager import (
    ConfigManager,
    TestGenerationConfig,
    TestType,
    Environment,
    TemplateConfig,
    PerformanceConfig,
    ValidationConfig,
    QualityConfig,
    get_config_manager,
    get_config
)


class TestTestGenerationConfig:
    """Unit tests for TestGenerationConfig model"""
    
    def test_config_default_values(self):
        """Test that config creates with proper default values"""
        config = TestGenerationConfig()
        
        assert config.environment == Environment.DEVELOPMENT
        assert config.base_url == "https://api.example.com"
        assert config.api_version == "v1"
        assert config.output_directory == "./tests/generated"
        assert config.file_naming_pattern == "test_{operation_id}_{test_type}.py"
        assert config.overwrite_existing is False
        assert config.create_subdirectories is True
        assert config.template_directory == "./src/templates"
        
        # Check enabled test types default
        expected_types = [
            TestType.BASIC,
            TestType.CRUD,
            TestType.ERROR_SCENARIOS,
            TestType.AUTHENTICATION,
            TestType.VALIDATION,
            TestType.BOUNDARY_TESTING,
            TestType.ENVIRONMENT_CONFIG,
            TestType.CONCURRENCY
        ]
        assert config.enabled_test_types == expected_types
    
    def test_config_validation_valid_base_url(self):
        """Test base URL validation with valid URLs"""
        valid_urls = [
            "https://api.example.com",
            "http://localhost:8000",
            "https://test-api.company.com/v1"
        ]
        
        for url in valid_urls:
            config = TestGenerationConfig(base_url=url)
            assert config.base_url == url
    
    def test_config_validation_invalid_base_url(self):
        """Test base URL validation with invalid URLs"""
        invalid_urls = [
            "api.example.com",
            "ftp://files.example.com",
            "localhost:8000",
            "//api.example.com"
        ]
        
        for url in invalid_urls:
            with pytest.raises(ValidationError) as exc_info:
                TestGenerationConfig(base_url=url)
            assert "Base URL must start with http:// or https://" in str(exc_info.value)
    
    def test_config_validation_empty_test_types(self):
        """Test validation fails when no test types are enabled"""
        with pytest.raises(ValidationError) as exc_info:
            TestGenerationConfig(enabled_test_types=[])
        assert "At least one test type must be enabled" in str(exc_info.value)
    
    def test_config_validation_valid_output_directory(self):
        """Test output directory validation with valid paths"""
        valid_paths = [
            "./tests/generated",
            "/tmp/test_output",
            "~/test_files",
            "tests"
        ]
        
        for path in valid_paths:
            config = TestGenerationConfig(output_directory=path)
            assert config.output_directory == path
    
    def test_config_validation_invalid_output_directory(self):
        """Test output directory validation with invalid paths"""
        # Test with a path that would cause Path().resolve() to fail
        with patch('pathlib.Path.resolve') as mock_resolve:
            mock_resolve.side_effect = Exception("Invalid path")
            
            with pytest.raises(ValidationError) as exc_info:
                TestGenerationConfig(output_directory="/invalid\0path")
            assert "Invalid output directory path" in str(exc_info.value)
    
    def test_config_custom_values(self):
        """Test config creation with custom values"""
        custom_config = TestGenerationConfig(
            environment=Environment.PRODUCTION,
            base_url="https://api.production.com",
            api_version="v2",
            output_directory="/custom/output",
            enabled_test_types=[TestType.BASIC, TestType.PERFORMANCE],
            auth_token_placeholder="Bearer production_token",
            parallel_generation=False,
            max_worker_threads=8
        )
        
        assert custom_config.environment == Environment.PRODUCTION
        assert custom_config.base_url == "https://api.production.com"
        assert custom_config.api_version == "v2"
        assert custom_config.output_directory == "/custom/output"
        assert custom_config.enabled_test_types == [TestType.BASIC, TestType.PERFORMANCE]
        assert custom_config.auth_token_placeholder == "Bearer production_token"
        assert custom_config.parallel_generation is False
        assert custom_config.max_worker_threads == 8
    
    def test_config_nested_objects_creation(self):
        """Test that nested configuration objects are created properly"""
        config = TestGenerationConfig()
        
        # Check performance config
        assert isinstance(config.performance, PerformanceConfig)
        assert config.performance.light_load_users == 5
        assert config.performance.max_response_time_ms == 5000
        
        # Check validation config
        assert isinstance(config.validation, ValidationConfig)
        assert config.validation.check_required_fields is True
        assert config.validation.generate_security_tests is True
        
        # Check quality config
        assert isinstance(config.quality, QualityConfig)
        assert config.quality.min_quality_score == 0.8
        assert len(config.quality.forbidden_patterns) > 0


class TestTemplateConfig:
    """Unit tests for TemplateConfig dataclass"""
    
    def test_template_config_defaults(self):
        """Test TemplateConfig default values"""
        config = TemplateConfig()
        
        assert config.enabled is True
        assert config.template_path is None
        assert config.custom_variables == {}
        assert config.generation_rules == {}
        assert config.quality_thresholds == {}
    
    def test_template_config_custom_values(self):
        """Test TemplateConfig with custom values"""
        custom_vars = {"api_host": "localhost", "timeout": 30}
        rules = {"generate_comments": True, "max_params": 5}
        thresholds = {"min_coverage": 0.9, "max_complexity": 10}
        
        config = TemplateConfig(
            enabled=False,
            template_path="/custom/template.j2",
            custom_variables=custom_vars,
            generation_rules=rules,
            quality_thresholds=thresholds
        )
        
        assert config.enabled is False
        assert config.template_path == "/custom/template.j2"
        assert config.custom_variables == custom_vars
        assert config.generation_rules == rules
        assert config.quality_thresholds == thresholds


class TestPerformanceConfig:
    """Unit tests for PerformanceConfig dataclass"""
    
    def test_performance_config_defaults(self):
        """Test PerformanceConfig default values"""
        config = PerformanceConfig()
        
        assert config.light_load_users == 5
        assert config.light_load_requests == 10
        assert config.normal_load_users == 10
        assert config.normal_load_requests == 20
        assert config.heavy_load_users == 25
        assert config.heavy_load_requests == 50
        assert config.stress_load_users == 50
        assert config.stress_load_requests == 100
        assert config.max_response_time_ms == 5000
        assert config.success_rate_threshold == 0.95
        assert config.ramp_up_duration == 10
        assert config.endurance_duration == 1800
    
    def test_performance_config_custom_values(self):
        """Test PerformanceConfig with custom values"""
        config = PerformanceConfig(
            light_load_users=10,
            normal_load_users=20,
            heavy_load_users=50,
            stress_load_users=100,
            max_response_time_ms=3000,
            success_rate_threshold=0.99,
            endurance_duration=3600
        )
        
        assert config.light_load_users == 10
        assert config.normal_load_users == 20
        assert config.heavy_load_users == 50
        assert config.stress_load_users == 100
        assert config.max_response_time_ms == 3000
        assert config.success_rate_threshold == 0.99
        assert config.endurance_duration == 3600


class TestValidationConfig:
    """Unit tests for ValidationConfig dataclass"""
    
    def test_validation_config_defaults(self):
        """Test ValidationConfig default values"""
        config = ValidationConfig()
        
        assert config.check_required_fields is True
        assert config.check_field_types is True
        assert config.check_string_constraints is True
        assert config.check_numeric_constraints is True
        assert config.check_format_validation is True
        assert config.check_pattern_validation is True
        assert config.check_enum_validation is True
        assert config.check_array_validation is True
        assert config.check_object_validation is True
        assert config.check_additional_properties is True
        assert config.generate_boundary_tests is True
        assert config.generate_security_tests is True
    
    def test_validation_config_custom_values(self):
        """Test ValidationConfig with custom values"""
        config = ValidationConfig(
            check_required_fields=False,
            check_field_types=False,
            generate_boundary_tests=False,
            generate_security_tests=False
        )
        
        assert config.check_required_fields is False
        assert config.check_field_types is False
        assert config.generate_boundary_tests is False
        assert config.generate_security_tests is False


class TestQualityConfig:
    """Unit tests for QualityConfig dataclass"""
    
    def test_quality_config_defaults(self):
        """Test QualityConfig default values"""
        config = QualityConfig()
        
        assert config.min_quality_score == 0.8
        assert config.max_test_method_length == 50
        assert config.min_assertion_ratio == 0.3
        assert config.require_docstrings is True
        assert config.check_async_patterns is True
        assert config.check_security_patterns is True
        assert config.check_performance_patterns is True
        assert config.check_test_isolation is True
        assert len(config.forbidden_patterns) == 4
        assert r'time\.sleep\(' in config.forbidden_patterns
        assert r'print\s*\(' in config.forbidden_patterns
    
    def test_quality_config_custom_values(self):
        """Test QualityConfig with custom values"""
        custom_patterns = [r'debug\s*\(', r'console\.log\s*\(']
        
        config = QualityConfig(
            min_quality_score=0.9,
            max_test_method_length=30,
            min_assertion_ratio=0.5,
            require_docstrings=False,
            forbidden_patterns=custom_patterns
        )
        
        assert config.min_quality_score == 0.9
        assert config.max_test_method_length == 30
        assert config.min_assertion_ratio == 0.5
        assert config.require_docstrings is False
        assert config.forbidden_patterns == custom_patterns


class TestConfigManager:
    """Unit tests for ConfigManager class"""
    
    def test_config_manager_initialization(self):
        """Test ConfigManager initialization"""
        manager = ConfigManager()
        
        assert manager.config_path is None
        assert manager._config is None
        assert isinstance(manager._environment_overrides, dict)
        assert len(manager.default_config_paths) > 0
        assert "./test_generation_config.yaml" in manager.default_config_paths
    
    def test_config_manager_with_custom_path(self):
        """Test ConfigManager initialization with custom config path"""
        custom_path = "/custom/config.yaml"
        manager = ConfigManager(config_path=custom_path)
        
        assert manager.config_path == custom_path
    
    @patch('pathlib.Path.exists')
    def test_config_property_lazy_loading(self, mock_exists):
        """Test that config property loads configuration lazily"""
        mock_exists.return_value = False
        manager = ConfigManager()
        
        # First access should trigger loading
        config = manager.config
        assert isinstance(config, TestGenerationConfig)
        assert manager._config is not None
        
        # Second access should return cached config
        config2 = manager.config
        assert config is config2
    
    @patch('pathlib.Path.exists')
    def test_load_config_with_no_file_returns_default(self, mock_exists):
        """Test load_config returns default config when no file exists"""
        mock_exists.return_value = False
        manager = ConfigManager()
        
        config = manager.load_config()
        
        assert isinstance(config, TestGenerationConfig)
        assert config.environment == Environment.DEVELOPMENT
        assert config.base_url == "https://api.example.com"
    
    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    @patch('yaml.safe_load')
    def test_load_config_from_yaml_file(self, mock_yaml_load, mock_exists, mock_file):
        """Test loading configuration from YAML file"""
        # Setup mock file content
        yaml_config = {
            "environment": "production",
            "base_url": "https://prod-api.example.com",
            "api_version": "v2",
            "enabled_test_types": ["basic", "performance"]
        }
        mock_yaml_load.return_value = yaml_config
        mock_exists.return_value = True
        
        manager = ConfigManager()
        config = manager._load_config_from_file("test_config.yaml")
        
        mock_file.assert_called_once_with(Path("test_config.yaml"), 'r', encoding='utf-8')
        mock_yaml_load.assert_called_once()
        
        assert config.environment == Environment.PRODUCTION
        assert config.base_url == "https://prod-api.example.com"
        assert config.api_version == "v2"
    
    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    @patch('json.load')
    def test_load_config_from_json_file(self, mock_json_load, mock_exists, mock_file):
        """Test loading configuration from JSON file"""
        # Setup mock file content
        json_config = {
            "environment": "staging",
            "base_url": "https://staging-api.example.com",
            "parallel_generation": False,
            "max_worker_threads": 2
        }
        mock_json_load.return_value = json_config
        mock_exists.return_value = True
        
        manager = ConfigManager()
        config = manager._load_config_from_file("test_config.json")
        
        mock_file.assert_called_once_with(Path("test_config.json"), 'r', encoding='utf-8')
        mock_json_load.assert_called_once()
        
        assert config.environment == Environment.STAGING
        assert config.base_url == "https://staging-api.example.com"
        assert config.parallel_generation is False
        assert config.max_worker_threads == 2
    
    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    def test_load_config_invalid_yaml_raises_error(self, mock_exists, mock_file):
        """Test that invalid YAML content raises appropriate error"""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = "invalid: yaml: content: ["
        
        manager = ConfigManager()
        
        with pytest.raises(Exception):  # Should raise YAML parsing error
            manager.load_config("invalid_config.yaml")
    
    @patch('builtins.open', new_callable=mock_open)
    @patch('pathlib.Path.exists')
    @patch('json.load')
    def test_load_config_validation_error_with_invalid_data(self, mock_json_load, mock_exists, mock_file):
        """Test that invalid config data raises validation error"""
        # Invalid config with bad base_url
        invalid_config = {
            "base_url": "invalid-url-format",  # Invalid URL
            "enabled_test_types": []  # Empty list (invalid)
        }
        mock_json_load.return_value = invalid_config
        mock_exists.return_value = True
        
        manager = ConfigManager()
        
        with pytest.raises(ValidationError):
            manager.load_config("invalid_config.json")
    
    @patch('pathlib.Path.exists')
    def test_load_config_searches_default_paths(self, mock_exists):
        """Test that load_config searches through default paths"""
        # Mock that no config files exist, should fall back to default config
        mock_exists.return_value = False
        
        manager = ConfigManager()
        config = manager.load_config()
        
        # Should return default config since we don't actually read the file
        assert isinstance(config, TestGenerationConfig)
    
    def test_manual_config_update_via_dict(self):
        """Test manual configuration update by creating new config from dict"""
        manager = ConfigManager()
        
        # Get initial config
        initial_config = manager.config
        initial_url = initial_config.base_url
        
        # Create new config with updates
        config_dict = initial_config.model_dump()
        config_dict.update({
            "base_url": "https://updated-api.example.com",
            "api_version": "v3", 
            "parallel_generation": False
        })
        updated_config = TestGenerationConfig(**config_dict)
        
        # Manually update for testing
        manager._config = updated_config
        
        assert manager.config.base_url == "https://updated-api.example.com"
        assert manager.config.api_version == "v3"
        assert manager.config.parallel_generation is False
        assert manager.config.base_url != initial_url
    
    def test_get_template_config_returns_config_for_test_type(self):
        """Test get_template_config returns configuration for specific test type"""
        manager = ConfigManager()
        
        # Set up template config
        template_config = TemplateConfig(
            enabled=True,
            template_path="/custom/template.j2",
            custom_variables={"var1": "value1"}
        )
        manager.config.template_configs["basic"] = template_config
        
        result = manager.get_template_config("basic")
        
        assert result == template_config
        assert result.enabled is True
        assert result.template_path == "/custom/template.j2"
    
    def test_get_template_config_returns_default_for_unknown_type(self):
        """Test get_template_config returns default config for unknown test type"""
        manager = ConfigManager()
        
        result = manager.get_template_config("unknown_type")
        
        assert isinstance(result, TemplateConfig)
        assert result.enabled is True
        assert result.template_path is None
    
    def test_is_test_type_enabled_checks_enabled_types(self):
        """Test is_test_type_enabled correctly checks if test type is enabled"""
        manager = ConfigManager()
        manager.config.enabled_test_types = [TestType.BASIC, TestType.CRUD]
        
        assert manager.is_test_type_enabled(TestType.BASIC) is True
        assert manager.is_test_type_enabled(TestType.CRUD) is True
        assert manager.is_test_type_enabled(TestType.PERFORMANCE) is False
        assert manager.is_test_type_enabled("basic") is True
        assert manager.is_test_type_enabled("performance") is False
    
    @patch('builtins.open', new_callable=mock_open)
    @patch('yaml.dump')
    def test_save_config_to_yaml_file(self, mock_yaml_dump, mock_file):
        """Test saving configuration to YAML file"""
        manager = ConfigManager()
        config = manager.config
        
        manager.save_config("output_config.yaml")
        
        mock_file.assert_called_once_with("output_config.yaml", 'w', encoding='utf-8')
        mock_yaml_dump.assert_called_once()
        
        # Verify that the dumped data contains config data
        dumped_data = mock_yaml_dump.call_args[0][0]
        assert "environment" in dumped_data
        assert "base_url" in dumped_data
    
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_save_config_to_json_file(self, mock_json_dump, mock_file):
        """Test saving configuration to JSON file"""
        manager = ConfigManager()
        config = manager.config
        
        manager.save_config("output_config.json", format='json')
        
        mock_file.assert_called_once_with("output_config.json", 'w', encoding='utf-8')
        mock_json_dump.assert_called_once()
        
        # Verify that the dumped data contains config data
        dumped_data = mock_json_dump.call_args[0][0]
        assert "environment" in dumped_data
        assert "base_url" in dumped_data
    
    def test_save_config_invalid_format_raises_error(self):
        """Test that invalid format raises ValueError"""
        manager = ConfigManager()
        
        with pytest.raises(ValueError, match="Unsupported format: xml"):
            manager.save_config("config.xml", format='xml')
    
    def test_create_default_config_method(self):
        """Test _create_default_config method functionality"""
        manager = ConfigManager()
        
        default_config = manager._create_default_config()
        
        assert isinstance(default_config, TestGenerationConfig)
        assert default_config.environment == Environment.DEVELOPMENT
        assert len(default_config.template_configs) > 0
        
        # Check that template configs are created for each test type
        for test_type in TestType:
            assert test_type.value in default_config.template_configs
    
    def test_set_environment_override_simple_key(self):
        """Test setting environment override for simple key"""
        manager = ConfigManager()
        
        manager.set_environment_override("base_url", "https://override.example.com")
        
        assert manager._environment_overrides["base_url"] == "https://override.example.com"
        assert manager._config is None  # Should force reload
    
    def test_set_environment_override_nested_key(self):
        """Test setting environment override for nested key using dot notation"""
        manager = ConfigManager()
        
        manager.set_environment_override("performance.light_load_users", 15)
        
        assert manager._environment_overrides["performance"]["light_load_users"] == 15
        assert manager._config is None  # Should force reload
    
    def test_set_environment_override_deep_nested_key(self):
        """Test setting environment override for deeply nested key"""
        manager = ConfigManager()
        
        manager.set_environment_override("quality.thresholds.min_score", 0.9)
        
        assert manager._environment_overrides["quality"]["thresholds"]["min_score"] == 0.9
    
    def test_deep_merge_method(self):
        """Test _deep_merge method functionality"""
        manager = ConfigManager()
        
        base = {
            "a": 1,
            "b": {"x": 10, "y": 20},
            "c": [1, 2, 3]
        }
        
        override = {
            "b": {"y": 25, "z": 30},
            "d": 4
        }
        
        result = manager._deep_merge(base, override)
        
        assert result["a"] == 1
        assert result["b"]["x"] == 10  # Preserved from base
        assert result["b"]["y"] == 25  # Overridden
        assert result["b"]["z"] == 30  # Added from override
        assert result["c"] == [1, 2, 3]  # Preserved from base
        assert result["d"] == 4  # Added from override
    
    def test_apply_environment_overrides_method(self):
        """Test _apply_environment_overrides method"""
        manager = ConfigManager()
        manager._environment_overrides = {
            "base_url": "https://override.example.com",
            "performance": {"light_load_users": 15}
        }
        
        config_data = {
            "base_url": "https://original.example.com",
            "api_version": "v1",
            "performance": {"light_load_users": 5, "normal_load_users": 10}
        }
        
        result = manager._apply_environment_overrides(config_data)
        
        assert result["base_url"] == "https://override.example.com"
        assert result["api_version"] == "v1"  # Preserved
        assert result["performance"]["light_load_users"] == 15  # Overridden
        assert result["performance"]["normal_load_users"] == 10  # Preserved
    
    def test_get_output_path_without_subdirectories(self):
        """Test get_output_path when create_subdirectories is False"""
        manager = ConfigManager()
        manager.config.create_subdirectories = False
        manager.config.output_directory = "/test/output"
        manager.config.file_naming_pattern = "test_{operation_id}_{test_type}.py"
        
        path = manager.get_output_path("create_user", TestType.BASIC)
        
        expected = Path("/test/output/test_create_user_basic.py")
        assert path == expected
    
    def test_get_output_path_with_subdirectories(self):
        """Test get_output_path when create_subdirectories is True"""
        manager = ConfigManager()
        manager.config.create_subdirectories = True
        manager.config.output_directory = "/test/output"
        manager.config.file_naming_pattern = "test_{operation_id}_{test_type}.py"
        
        path = manager.get_output_path("update_profile", "crud")
        
        expected = Path("/test/output/crud/test_update_profile_crud.py")
        assert path == expected
    
    def test_should_overwrite_file_existing_file_overwrite_enabled(self):
        """Test should_overwrite_file when file exists and overwrite is enabled"""
        manager = ConfigManager()
        # Set up config with overwrite enabled
        config = TestGenerationConfig(overwrite_existing=True)
        manager._config = config
        
        with patch('pathlib.Path.exists', return_value=True):
            test_path = Path("/test/file.py")
            result = manager.should_overwrite_file(test_path)
            
            assert result is True
    
    def test_should_overwrite_file_existing_file_overwrite_disabled(self):
        """Test should_overwrite_file when file exists and overwrite is disabled"""
        manager = ConfigManager()
        # Set up config with overwrite disabled
        config = TestGenerationConfig(overwrite_existing=False)
        manager._config = config
        
        with patch('pathlib.Path.exists', return_value=True):
            test_path = Path("/test/file.py")
            result = manager.should_overwrite_file(test_path)
            
            assert result is False
    
    @patch('pathlib.Path.exists')
    def test_should_overwrite_file_nonexistent_file(self, mock_exists):
        """Test should_overwrite_file when file doesn't exist"""
        mock_exists.return_value = False
        manager = ConfigManager()
        manager.config.overwrite_existing = False
        
        test_path = Path("/test/nonexistent.py")
        result = manager.should_overwrite_file(test_path)
        
        assert result is True
    
    def test_get_environment_config_development(self):
        """Test get_environment_config for development environment"""
        manager = ConfigManager()
        
        env_config = manager.get_environment_config(Environment.DEVELOPMENT)
        
        assert env_config["base_url"] == "https://dev-api.example.com"
        assert env_config["timeout"] == 60
        assert env_config["verify_ssl"] is False
        assert env_config["api_version"] == "v1"  # From base config
    
    def test_get_environment_config_staging(self):
        """Test get_environment_config for staging environment"""
        manager = ConfigManager()
        
        env_config = manager.get_environment_config(Environment.STAGING)
        
        assert env_config["base_url"] == "https://staging-api.example.com"
        assert env_config["timeout"] == 45
        assert env_config["verify_ssl"] is True
    
    def test_get_environment_config_production(self):
        """Test get_environment_config for production environment"""
        manager = ConfigManager()
        
        env_config = manager.get_environment_config(Environment.PRODUCTION)
        
        assert env_config["base_url"] == "https://api.example.com"
        assert env_config["timeout"] == 30
        assert env_config["verify_ssl"] is True
        assert env_config["rate_limit_delay"] == 1
    
    def test_get_environment_config_local(self):
        """Test get_environment_config for local environment"""
        manager = ConfigManager()
        
        env_config = manager.get_environment_config(Environment.LOCAL)
        
        assert env_config["base_url"] == "http://localhost:8000"
        assert env_config["timeout"] == 120
        assert env_config["verify_ssl"] is False
    
    def test_get_environment_config_with_string_environment(self):
        """Test get_environment_config with string environment parameter"""
        manager = ConfigManager()
        
        env_config = manager.get_environment_config("production")
        
        assert env_config["base_url"] == "https://api.example.com"
        assert env_config["rate_limit_delay"] == 1
    
    def test_validate_config_success(self):
        """Test validate_config with valid configuration"""
        with patch('pathlib.Path.exists', return_value=True), \
             patch('pathlib.Path.mkdir'), \
             patch('pathlib.Path.write_text') as mock_write_text, \
             patch('pathlib.Path.unlink') as mock_unlink:
            
            # Create manager with pre-loaded config to avoid file loading
            manager = ConfigManager()
            manager._config = TestGenerationConfig()  # Use default config directly
            
            errors = manager.validate_config()
            
            assert errors == []
            mock_write_text.assert_called_once_with("test")
            mock_unlink.assert_called_once()
    
    @patch('pathlib.Path.exists')
    def test_validate_config_template_directory_missing(self, mock_exists):
        """Test validate_config when template directory doesn't exist"""
        mock_exists.return_value = False
        manager = ConfigManager()
        
        with patch('pathlib.Path.mkdir'), \
             patch('pathlib.Path.write_text'), \
             patch('pathlib.Path.unlink'):
            errors = manager.validate_config()
        
        assert len(errors) == 1
        assert "Template directory does not exist" in errors[0]
    
    def test_validate_config_output_directory_not_writable(self):
        """Test validate_config when output directory is not writable"""
        with patch('pathlib.Path.exists', return_value=True), \
             patch('pathlib.Path.mkdir', side_effect=PermissionError("Permission denied")):
            
            manager = ConfigManager()
            manager._config = TestGenerationConfig()  # Use default config directly
            
            errors = manager.validate_config()
            
            assert len(errors) == 1
            assert "Output directory not writable" in errors[0]
    
    def test_validate_config_invalid_quality_score(self):
        """Test validate_config with invalid quality score"""
        manager = ConfigManager()
        manager.config.quality.min_quality_score = 1.5  # Invalid: > 1
        
        with patch('pathlib.Path.exists', return_value=True), \
             patch('pathlib.Path.mkdir'), \
             patch('pathlib.Path.write_text'), \
             patch('pathlib.Path.unlink'):
            errors = manager.validate_config()
        
        assert len(errors) == 1
        assert "Quality score must be between 0 and 1" in errors[0]
    
    def test_validate_config_invalid_performance_settings(self):
        """Test validate_config with invalid performance settings"""
        manager = ConfigManager()
        manager.config.performance.light_load_users = -5  # Invalid: negative
        
        with patch('pathlib.Path.exists', return_value=True), \
             patch('pathlib.Path.mkdir'), \
             patch('pathlib.Path.write_text'), \
             patch('pathlib.Path.unlink'):
            errors = manager.validate_config()
        
        assert len(errors) == 1
        assert "Performance user counts must be positive" in errors[0]
    
    def test_config_dict_method_compatibility(self):
        """Test configuration dict conversion compatibility"""
        manager = ConfigManager()
        
        # Get initial config values
        initial_config = manager.config
        initial_url = initial_config.base_url
        
        # Create update data
        updates = {
            "base_url": "https://updated-api.example.com",
            "api_version": "v3",
            "parallel_generation": False
        }
        
        # Create new config from dict using model_dump
        config_dict = initial_config.model_dump()
        config_dict.update(updates)
        updated_config = TestGenerationConfig(**config_dict)
        
        # Manually update for testing
        manager._config = updated_config
        
        assert manager.config.base_url == "https://updated-api.example.com"
        assert manager.config.api_version == "v3"
        assert manager.config.parallel_generation is False
        assert manager.config.base_url != initial_url
    
    @patch('builtins.open', new_callable=mock_open)
    @patch('yaml.dump')
    def test_create_example_config(self, mock_yaml_dump, mock_file):
        """Test create_example_config method"""
        manager = ConfigManager()
        
        manager.create_example_config("example.yaml")
        
        mock_file.assert_called_once_with("example.yaml", 'w', encoding='utf-8')
        mock_yaml_dump.assert_called_once()
        
        # Verify that the file write includes header comments
        written_content = ''.join(call.args[0] for call in mock_file().write.call_args_list)
        assert "AI API Test Automation - Configuration File" in written_content


class TestGlobalConfigFunctions:
    """Unit tests for global configuration functions"""
    
    def teardown_method(self):
        """Reset global config manager after each test"""
        # Reset the global instance to ensure test isolation
        import src.generators.config_manager
        src.generators.config_manager._config_manager = None
    
    def test_get_config_manager_returns_instance(self):
        """Test that get_config_manager returns ConfigManager instance"""
        manager = get_config_manager()
        
        assert isinstance(manager, ConfigManager)
        assert hasattr(manager, 'config')
    
    def test_get_config_manager_singleton_behavior(self):
        """Test that get_config_manager returns the same instance"""
        manager1 = get_config_manager()
        manager2 = get_config_manager()
        
        assert manager1 is manager2  # Should be same instance
    
    def test_get_config_manager_creates_default_instance(self):
        """Test get_config_manager creates instance with default constructor"""
        # Reset to ensure we test first call behavior
        import src.generators.config_manager
        src.generators.config_manager._config_manager = None
        
        with patch('src.generators.config_manager.ConfigManager') as mock_manager_class:
            mock_instance = Mock()
            mock_manager_class.return_value = mock_instance
            
            result = get_config_manager()
            
            mock_manager_class.assert_called_once_with()
            assert result == mock_instance
    
    def test_get_config_manager_singleton_persistence(self):
        """Test that get_config_manager maintains singleton across calls"""
        # First call
        manager1 = get_config_manager()
        
        # Second call should return same instance
        manager2 = get_config_manager()
        
        assert manager1 is manager2
    
    def test_get_config_returns_test_generation_config(self):
        """Test that get_config returns TestGenerationConfig instance"""
        config = get_config()
        
        assert isinstance(config, TestGenerationConfig)
        assert config.environment == Environment.DEVELOPMENT
        assert config.base_url == "https://api.example.com"
    
    @patch('src.generators.config_manager.get_config_manager')
    def test_get_config_calls_get_config_manager(self, mock_get_manager):
        """Test that get_config properly calls get_config_manager().config"""
        mock_manager = Mock()
        mock_config = Mock(spec=TestGenerationConfig)
        mock_manager.config = mock_config
        mock_get_manager.return_value = mock_manager
        
        result = get_config()
        
        mock_get_manager.assert_called_once()
        assert result == mock_config


class TestEnumTypes:
    """Unit tests for enum types"""
    
    def test_test_type_enum_values(self):
        """Test TestType enum has expected values"""
        assert TestType.BASIC == "basic"
        assert TestType.CRUD == "crud"
        assert TestType.ERROR_SCENARIOS == "error_scenarios"
        assert TestType.AUTHENTICATION == "authentication"
        assert TestType.PERFORMANCE == "performance"
        assert TestType.VALIDATION == "validation"
    
    def test_environment_enum_values(self):
        """Test Environment enum has expected values"""
        assert Environment.DEVELOPMENT == "development"
        assert Environment.STAGING == "staging"
        assert Environment.PRODUCTION == "production"
        assert Environment.LOCAL == "local"
    
    def test_test_type_enum_iteration(self):
        """Test that TestType enum can be iterated"""
        all_types = list(TestType)
        assert len(all_types) == 10  # Updated to reflect actual TestType count
        assert TestType.BASIC in all_types
        assert TestType.VALIDATION in all_types
    
    def test_environment_enum_iteration(self):
        """Test that Environment enum can be iterated"""
        all_envs = list(Environment)
        assert len(all_envs) == 4
        assert Environment.DEVELOPMENT in all_envs
        assert Environment.PRODUCTION in all_envs