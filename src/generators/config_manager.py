"""
Advanced Configuration Manager

Manages flexible configuration for test generation, including template selection,
environment-specific settings, quality thresholds, and customization options.
"""

import json
import yaml
from typing import Dict, Any, List, Optional, Union, Set
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum
import structlog
from pydantic import BaseModel, validator, Field

logger = structlog.get_logger()

class TestType(str, Enum):
    """Supported test types"""
    BASIC = "basic"
    CRUD = "crud"
    ERROR_SCENARIOS = "error_scenarios"
    AUTHENTICATION = "authentication"
    PERFORMANCE = "performance"
    VALIDATION = "validation"
    BOUNDARY_TESTING = "boundary_testing"
    ENVIRONMENT_CONFIG = "environment_config"
    CONCURRENCY = "concurrency"
    DATA_INTEGRITY = "data_integrity"

class Environment(str, Enum):
    """Target environments"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    LOCAL = "local"

@dataclass
class TemplateConfig:
    """Configuration for a specific template type"""
    enabled: bool = True
    template_path: Optional[str] = None
    custom_variables: Dict[str, Any] = field(default_factory=dict)
    generation_rules: Dict[str, Any] = field(default_factory=dict)
    quality_thresholds: Dict[str, float] = field(default_factory=dict)

@dataclass 
class PerformanceConfig:
    """Performance testing configuration"""
    light_load_users: int = 5
    light_load_requests: int = 10
    normal_load_users: int = 10
    normal_load_requests: int = 20
    heavy_load_users: int = 25
    heavy_load_requests: int = 50
    stress_load_users: int = 50
    stress_load_requests: int = 100
    max_response_time_ms: int = 5000
    success_rate_threshold: float = 0.95
    ramp_up_duration: int = 10
    endurance_duration: int = 1800  # 30 minutes

@dataclass
class ValidationConfig:
    """Validation testing configuration"""
    check_required_fields: bool = True
    check_field_types: bool = True
    check_string_constraints: bool = True
    check_numeric_constraints: bool = True
    check_format_validation: bool = True
    check_pattern_validation: bool = True
    check_enum_validation: bool = True
    check_array_validation: bool = True
    check_object_validation: bool = True
    check_additional_properties: bool = True
    generate_boundary_tests: bool = True
    generate_security_tests: bool = True

@dataclass
class BoundaryTestingConfig:
    """Advanced boundary testing configuration"""
    test_extreme_values: bool = True
    test_unicode_edge_cases: bool = True
    test_payload_size_limits: bool = True
    test_numeric_precision: bool = True
    test_time_boundaries: bool = True
    test_concurrent_boundaries: bool = True
    max_payload_size_mb: int = 10
    unicode_test_strings: List[str] = field(default_factory=lambda: [
        "🚀🎯📈💾🔥⚡🎉🛠️🌟🎪",  # Emojis
        "测试中文字符串",           # Chinese
        "тест русский текст",      # Cyrillic  
        "اختبار النص العربي",       # Arabic
        "בדיקת טקסט בעברית",        # Hebrew
        "テストの日本語テキスト",      # Japanese
    ])
    boundary_multipliers: List[float] = field(default_factory=lambda: [0.5, 0.9, 1.0, 1.1, 2.0, 10.0])

@dataclass
class EnvironmentConfig:
    """Environment configuration testing"""
    test_environment_variables: bool = True
    test_config_overrides: bool = True
    test_database_connectivity: bool = True
    test_external_dependencies: bool = True
    test_ssl_configurations: bool = True
    environments_to_test: List[str] = field(default_factory=lambda: ["development", "staging", "production"])
    required_env_vars: List[str] = field(default_factory=lambda: ["API_KEY", "DATABASE_URL", "JWT_SECRET"])
    config_files_to_test: List[str] = field(default_factory=lambda: ["config.yaml", "config.json", ".env"])

@dataclass 
class ConcurrencyConfig:
    """Concurrency testing configuration"""
    test_race_conditions: bool = True
    test_concurrent_modifications: bool = True
    test_resource_locking: bool = True
    test_deadlock_scenarios: bool = True
    concurrent_users: int = 10
    concurrent_requests_per_user: int = 5
    race_condition_iterations: int = 50
    timeout_seconds: int = 30

@dataclass
class QualityConfig:
    """Quality checking configuration"""
    min_quality_score: float = 0.8
    max_test_method_length: int = 50
    min_assertion_ratio: float = 0.3
    require_docstrings: bool = True
    check_async_patterns: bool = True
    check_security_patterns: bool = True
    check_performance_patterns: bool = True
    check_test_isolation: bool = True
    forbidden_patterns: List[str] = field(default_factory=lambda: [
        r'time\.sleep\(',
        r'print\s*\(',
        r'input\s*\(',
        r'exit\s*\(',
    ])

class TestGenerationConfig(BaseModel):
    """Main configuration for test generation"""
    
    # Environment settings
    environment: Environment = Environment.DEVELOPMENT
    base_url: str = "https://api.example.com"
    api_version: str = "v1"
    
    # Output settings
    output_directory: str = "./tests/generated"
    file_naming_pattern: str = "test_{operation_id}_{test_type}.py"
    overwrite_existing: bool = False
    create_subdirectories: bool = True
    
    # Template settings
    template_directory: str = "./src/templates"
    enabled_test_types: List[TestType] = Field(default_factory=lambda: [
        TestType.BASIC,
        TestType.CRUD,
        TestType.ERROR_SCENARIOS,
        TestType.AUTHENTICATION,
        TestType.VALIDATION,
        TestType.BOUNDARY_TESTING,
        TestType.ENVIRONMENT_CONFIG,
        TestType.CONCURRENCY
    ])
    
    # Template configurations
    template_configs: Dict[str, TemplateConfig] = Field(default_factory=dict)
    
    # Component configurations
    performance: PerformanceConfig = Field(default_factory=PerformanceConfig)
    validation: ValidationConfig = Field(default_factory=ValidationConfig)
    quality: QualityConfig = Field(default_factory=QualityConfig)
    boundary_testing: BoundaryTestingConfig = Field(default_factory=BoundaryTestingConfig)
    environment_config: EnvironmentConfig = Field(default_factory=EnvironmentConfig)
    concurrency: ConcurrencyConfig = Field(default_factory=ConcurrencyConfig)
    
    # Authentication settings
    auth_token_placeholder: str = "Bearer test_token_here"
    api_key_placeholder: str = "test_api_key_here"
    basic_auth_placeholder: str = "test_username:test_password"
    
    # Test data settings
    generate_realistic_data: bool = True
    use_faker_for_data: bool = True
    test_data_seed: Optional[int] = 42  # For reproducible test data
    
    # Advanced settings
    parallel_generation: bool = True
    max_worker_threads: int = 4
    enable_caching: bool = True
    cache_duration_hours: int = 24
    
    # Customization hooks
    custom_generators: Dict[str, str] = Field(default_factory=dict)  # test_type -> generator_class_path
    custom_validators: Dict[str, str] = Field(default_factory=dict)  # validation_type -> validator_class_path
    
    @validator('enabled_test_types')
    def validate_test_types(cls, v):
        if not v:
            raise ValueError("At least one test type must be enabled")
        return v
    
    @validator('base_url')
    def validate_base_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError("Base URL must start with http:// or https://")
        return v
    
    @validator('output_directory')
    def validate_output_directory(cls, v):
        # Ensure directory path is valid
        try:
            Path(v).resolve()
        except Exception:
            raise ValueError("Invalid output directory path")
        return v

class ConfigManager:
    """
    Advanced configuration manager for test generation system
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.logger = structlog.get_logger()
        self.config_path = config_path
        self._config: Optional[TestGenerationConfig] = None
        self._environment_overrides: Dict[str, Any] = {}
        
        # Default config file locations to search
        self.default_config_paths = [
            "./test_generation_config.yaml",
            "./test_generation_config.yml",
            "./test_generation_config.json",
            "./config/test_generation.yaml",
            "./config/test_generation.yml",
            "./config/test_generation.json",
        ]
    
    @property
    def config(self) -> TestGenerationConfig:
        """Get current configuration, loading if necessary"""
        if self._config is None:
            self._config = self.load_config()
        return self._config
    
    def load_config(self, config_path: Optional[str] = None) -> TestGenerationConfig:
        """
        Load configuration from file or create default
        
        Args:
            config_path: Optional path to config file
            
        Returns:
            Loaded configuration
        """
        config_file = config_path or self.config_path
        
        # If no specific path provided, search for default config files
        if not config_file:
            for default_path in self.default_config_paths:
                if Path(default_path).exists():
                    config_file = default_path
                    break
        
        if config_file and Path(config_file).exists():
            self.logger.info(f"Loading configuration from {config_file}")
            return self._load_config_from_file(config_file)
        else:
            self.logger.info("No configuration file found, using defaults")
            return self._create_default_config()
    
    def _load_config_from_file(self, config_path: str) -> TestGenerationConfig:
        """Load configuration from YAML or JSON file"""
        config_file = Path(config_path)
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                if config_file.suffix.lower() in ['.yaml', '.yml']:
                    config_data = yaml.safe_load(f)
                elif config_file.suffix.lower() == '.json':
                    config_data = json.load(f)
                else:
                    raise ValueError(f"Unsupported config file format: {config_file.suffix}")
            
            # Apply environment overrides
            config_data = self._apply_environment_overrides(config_data)
            
            # Convert template_configs from dict to TemplateConfig objects
            if 'template_configs' in config_data:
                template_configs = {}
                for test_type, config_dict in config_data['template_configs'].items():
                    template_configs[test_type] = TemplateConfig(**config_dict)
                config_data['template_configs'] = template_configs
            
            # Convert component configs
            if 'performance' in config_data:
                config_data['performance'] = PerformanceConfig(**config_data['performance'])
            if 'validation' in config_data:
                config_data['validation'] = ValidationConfig(**config_data['validation'])
            if 'quality' in config_data:
                config_data['quality'] = QualityConfig(**config_data['quality'])
            if 'boundary_testing' in config_data:
                config_data['boundary_testing'] = BoundaryTestingConfig(**config_data['boundary_testing'])
            if 'environment_config' in config_data:
                config_data['environment_config'] = EnvironmentConfig(**config_data['environment_config'])
            if 'concurrency' in config_data:
                config_data['concurrency'] = ConcurrencyConfig(**config_data['concurrency'])
            
            return TestGenerationConfig(**config_data)
            
        except Exception as e:
            self.logger.error(f"Failed to load configuration from {config_path}: {str(e)}")
            raise
    
    def _create_default_config(self) -> TestGenerationConfig:
        """Create default configuration"""
        config = TestGenerationConfig()
        
        # Set up default template configurations
        for test_type in TestType:
            config.template_configs[test_type.value] = TemplateConfig(
                enabled=test_type in config.enabled_test_types,
                custom_variables={
                    "timeout": 30,
                    "retry_count": 3,
                    "base_url_placeholder": config.base_url
                }
            )
        
        return config
    
    def _apply_environment_overrides(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply environment-specific overrides"""
        if self._environment_overrides:
            # Deep merge environment overrides
            config_data = self._deep_merge(config_data, self._environment_overrides)
        
        return config_data
    
    def _deep_merge(self, base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge two dictionaries"""
        result = base.copy()
        
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def save_config(self, config_path: Optional[str] = None, format: str = 'yaml') -> None:
        """
        Save current configuration to file
        
        Args:
            config_path: Path to save config file
            format: File format ('yaml' or 'json')
        """
        if not config_path:
            config_path = self.config_path or f"test_generation_config.{format}"
        
        config_dict = self.config.model_dump()
        
        # Convert dataclass objects to dictionaries for template_configs
        if 'template_configs' in config_dict:
            template_configs = {}
            for test_type, template_config in config_dict['template_configs'].items():
                if isinstance(template_config, TemplateConfig):
                    template_configs[test_type] = asdict(template_config)
                else:
                    template_configs[test_type] = template_config
            config_dict['template_configs'] = template_configs
        
        with open(config_path, 'w', encoding='utf-8') as f:
            if format.lower() == 'yaml':
                yaml.dump(config_dict, f, default_flow_style=False, indent=2, sort_keys=True)
            elif format.lower() == 'json':
                json.dump(config_dict, f, indent=2, sort_keys=True)
            else:
                raise ValueError(f"Unsupported format: {format}")
        
        self.logger.info(f"Configuration saved to {config_path}")
    
    def set_environment_override(self, key: str, value: Any) -> None:
        """
        Set an environment-specific override
        
        Args:
            key: Configuration key (supports dot notation)
            value: Override value
        """
        keys = key.split('.')
        current = self._environment_overrides
        
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        
        current[keys[-1]] = value
        
        # Force config reload on next access
        self._config = None
    
    def get_template_config(self, test_type: Union[str, TestType]) -> TemplateConfig:
        """
        Get template configuration for a specific test type
        
        Args:
            test_type: Test type
            
        Returns:
            Template configuration
        """
        test_type_str = test_type.value if isinstance(test_type, TestType) else test_type
        
        return self.config.template_configs.get(test_type_str, TemplateConfig())
    
    def is_test_type_enabled(self, test_type: Union[str, TestType]) -> bool:
        """
        Check if a test type is enabled
        
        Args:
            test_type: Test type to check
            
        Returns:
            True if enabled
        """
        if isinstance(test_type, str):
            test_type = TestType(test_type)
        
        return test_type in self.config.enabled_test_types
    
    def get_output_path(self, operation_id: str, test_type: Union[str, TestType]) -> Path:
        """
        Get the full output path for a generated test file
        
        Args:
            operation_id: API operation ID
            test_type: Type of test
            
        Returns:
            Full path for the test file
        """
        test_type_str = test_type.value if isinstance(test_type, TestType) else test_type
        
        filename = self.config.file_naming_pattern.format(
            operation_id=operation_id,
            test_type=test_type_str
        )
        
        output_dir = Path(self.config.output_directory)
        
        if self.config.create_subdirectories:
            output_dir = output_dir / test_type_str
        
        return output_dir / filename
    
    def should_overwrite_file(self, file_path: Path) -> bool:
        """
        Check if an existing file should be overwritten
        
        Args:
            file_path: Path to check
            
        Returns:
            True if file should be overwritten
        """
        if not file_path.exists():
            return True
        
        return self.config.overwrite_existing
    
    def get_environment_config(self, environment: Union[str, Environment]) -> Dict[str, Any]:
        """
        Get environment-specific configuration
        
        Args:
            environment: Target environment
            
        Returns:
            Environment-specific settings
        """
        env = Environment(environment) if isinstance(environment, str) else environment
        
        # Base configuration for all environments
        env_config = {
            'base_url': self.config.base_url,
            'api_version': self.config.api_version,
            'timeout': 30,
            'retry_count': 3
        }
        
        # Environment-specific overrides
        if env == Environment.DEVELOPMENT:
            env_config.update({
                'base_url': 'https://dev-api.example.com',
                'timeout': 60,
                'verify_ssl': False
            })
        elif env == Environment.STAGING:
            env_config.update({
                'base_url': 'https://staging-api.example.com',
                'timeout': 45,
                'verify_ssl': True
            })
        elif env == Environment.PRODUCTION:
            env_config.update({
                'base_url': 'https://api.example.com',
                'timeout': 30,
                'verify_ssl': True,
                'rate_limit_delay': 1
            })
        elif env == Environment.LOCAL:
            env_config.update({
                'base_url': 'http://localhost:8000',
                'timeout': 120,
                'verify_ssl': False
            })
        
        return env_config
    
    def validate_config(self) -> List[str]:
        """
        Validate current configuration
        
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        try:
            # Pydantic validation happens automatically, but we can add custom checks
            config = self.config
            
            # Check output directory is writable
            output_dir = Path(config.output_directory)
            try:
                output_dir.mkdir(parents=True, exist_ok=True)
                test_file = output_dir / ".write_test"
                test_file.write_text("test")
                test_file.unlink()
            except Exception as e:
                errors.append(f"Output directory not writable: {str(e)}")
            
            # Check template directory exists if specified
            template_dir = Path(config.template_directory)
            if not template_dir.exists():
                errors.append(f"Template directory does not exist: {template_dir}")
            
            # Validate quality thresholds
            if config.quality.min_quality_score < 0 or config.quality.min_quality_score > 1:
                errors.append("Quality score must be between 0 and 1")
            
            # Validate performance settings
            if config.performance.light_load_users <= 0:
                errors.append("Performance user counts must be positive")
            
        except Exception as e:
            errors.append(f"Configuration validation error: {str(e)}")
        
        return errors
    
    def create_example_config(self, output_path: str = "example_config.yaml") -> None:
        """
        Create an example configuration file with all options documented
        
        Args:
            output_path: Path to save the example config
        """
        example_config = {
            "# Test Generation Configuration": None,
            "# This file contains all available configuration options": None,
            "": None,
            
            "environment": "development",
            "base_url": "https://api.example.com",
            "api_version": "v1",
            
            "# Output Settings": None,
            "output_directory": "./tests/generated",
            "file_naming_pattern": "test_{operation_id}_{test_type}.py",
            "overwrite_existing": False,
            "create_subdirectories": True,
            
            "# Template Settings": None,
            "template_directory": "./src/templates",
            "enabled_test_types": ["basic", "crud", "error_scenarios", "authentication"],
            
            "# Performance Testing Configuration": None,
            "performance": {
                "light_load_users": 5,
                "light_load_requests": 10,
                "normal_load_users": 10,
                "normal_load_requests": 20,
                "heavy_load_users": 25,
                "heavy_load_requests": 50,
                "stress_load_users": 50,
                "stress_load_requests": 100,
                "max_response_time_ms": 5000,
                "success_rate_threshold": 0.95,
                "ramp_up_duration": 10,
                "endurance_duration": 1800
            },
            
            "# Validation Testing Configuration": None,
            "validation": {
                "check_required_fields": True,
                "check_field_types": True,
                "check_string_constraints": True,
                "check_numeric_constraints": True,
                "check_format_validation": True,
                "generate_boundary_tests": True,
                "generate_security_tests": True
            },
            
            "# Quality Checking Configuration": None,
            "quality": {
                "min_quality_score": 0.8,
                "max_test_method_length": 50,
                "min_assertion_ratio": 0.3,
                "require_docstrings": True,
                "check_async_patterns": True,
                "check_security_patterns": True
            },
            
            "# Authentication Settings": None,
            "auth_token_placeholder": "Bearer test_token_here",
            "api_key_placeholder": "test_api_key_here",
            "basic_auth_placeholder": "test_username:test_password",
            
            "# Test Data Settings": None,
            "generate_realistic_data": True,
            "use_faker_for_data": True,
            "test_data_seed": 42,
            
            "# Advanced Settings": None,
            "parallel_generation": True,
            "max_worker_threads": 4,
            "enable_caching": True,
            "cache_duration_hours": 24
        }
        
        # Filter out comment keys and save
        clean_config = {k: v for k, v in example_config.items() if not k.startswith('#') and k != ''}
        
        with open(output_path, 'w', encoding='utf-8') as f:
            # Write with comments
            f.write("# AI API Test Automation - Configuration File\n")
            f.write("# This file contains all available configuration options\n\n")
            
            yaml.dump(clean_config, f, default_flow_style=False, indent=2, sort_keys=False)
        
        self.logger.info(f"Example configuration saved to {output_path}")

# Global configuration instance
_config_manager: Optional[ConfigManager] = None

def get_config_manager() -> ConfigManager:
    """Get global configuration manager instance"""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager

def get_config() -> TestGenerationConfig:
    """Get current configuration"""
    return get_config_manager().config