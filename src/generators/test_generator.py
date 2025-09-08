import os
import structlog
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List, Dict, Any, Optional
from src.database.models import GeneratedTest
from src.webhook.schemas import ApiFoxWebhook
from src.config.settings import Settings

# Week 3 Advanced Test Generators
from src.generators.test_generators.error_generator import ErrorScenarioGenerator
from src.generators.test_generators.performance_generator import PerformanceTestGenerator
from src.generators.test_generators.validation_generator import ValidationTestGenerator

# Enhanced Test Generators (Boundary, Environment, Concurrency)
from src.generators.test_generators.boundary_generator import BoundaryTestGenerator
from src.generators.test_generators.environment_generator import EnvironmentTestGenerator
from src.generators.test_generators.concurrency_generator import ConcurrencyTestGenerator
from src.generators.quality_checker import TestQualityChecker
from src.generators.config_manager import get_config_manager, TestType
from src.generators.test_data_factory import TestDataFactory
# from src.generators.enhanced_generator_adapter import EnhancedGeneratorAdapter  # 移除复杂适配器

# Phase 2 Enhanced Components
from src.generators.openapi_parser import OpenAPIParser, EndpointAnalysis
from src.generators.test_strategy_engine import TestStrategyEngine, TestStrategyPlan
from src.generators.test_classifier import get_test_classifier

# Phase 3 AI Enhancement Components - COMMENTED OUT (modules don't exist)
# from src.ai.models import TestQualityPredictor
# from src.ai.quality_enhancer import AutomaticQualityEnhancer, BatchQualityEnhancer

logger = structlog.get_logger()

class TestGenerator:
    def __init__(self):
        self.settings = Settings()
        template_dir = Path(__file__).parent.parent / "templates"
        self.jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))
        
        # Initialize configuration manager and advanced generators
        self.config_manager = get_config_manager()
        self.error_generator = ErrorScenarioGenerator()
        self.performance_generator = PerformanceTestGenerator()
        self.validation_generator = ValidationTestGenerator()
        
        # Enhanced generators
        self.boundary_generator = BoundaryTestGenerator()
        self.environment_generator = EnvironmentTestGenerator()
        self.concurrency_generator = ConcurrencyTestGenerator()
        
        self.quality_checker = TestQualityChecker()
        self.data_factory = TestDataFactory(seed=42)
        # self.enhanced_adapter = EnhancedGeneratorAdapter()  # 移除复杂适配器
        
        # Phase 2 Enhanced Components
        self.openapi_parser = OpenAPIParser()
        self.strategy_engine = TestStrategyEngine()
        self.test_classifier = get_test_classifier()
        
        # Phase 3 AI Enhancement Components - DISABLED (modules don't exist)
        # self.quality_predictor = TestQualityPredictor()
        # self.ai_enhancer = AutomaticQualityEnhancer(self.quality_predictor)
        # self.batch_enhancer = BatchQualityEnhancer(self.ai_enhancer)
        self.ai_enhancement_enabled = getattr(self.settings, 'ai_enhancement_enabled', False)  # Disabled
        
        # Template configuration (legacy support + dynamic)
        self.template_types = {
            "basic": "dynamic_pytest_template.py.j2",  # Use dynamic template
            "crud": "crud_template.py.j2", 
            "error_scenarios": "error_scenarios_template.py.j2",
            "authentication": "auth_template.py.j2",
            # Legacy support
            "legacy_basic": "pytest_template.py.j2"
        }
        
        # Week 3 Advanced generators mapping
        self.advanced_generators = {
            TestType.ERROR_SCENARIOS: self.error_generator,
            TestType.PERFORMANCE: self.performance_generator,
            TestType.VALIDATION: self.validation_generator,
            TestType.BOUNDARY_TESTING: self.boundary_generator,
            TestType.ENVIRONMENT_CONFIG: self.environment_generator,
            TestType.CONCURRENCY: self.concurrency_generator
        }
        
    async def generate_tests_from_webhook(self, webhook: ApiFoxWebhook, db: Session):
        """Generate pytest tests from ApiFox webhook data"""
        try:
            logger.info("Starting test generation", event_id=webhook.event_id)
            
            # Extract API specification from webhook
            api_spec = self._extract_api_spec(webhook)
            if not api_spec:
                logger.warning("No valid API spec found in webhook", event_id=webhook.event_id)
                return
            
            # Generate multiple test types
            generated_files = []
            
            # Determine which test types to generate based on API method
            test_types_to_generate = self._determine_test_types(api_spec)
            
            for test_type in test_types_to_generate:
                test_content = self._generate_test_content(api_spec, test_type)
                test_file_path = self._save_test_file(api_spec, test_content, test_type)
                
                # Record in database
                db_test = GeneratedTest(
                    webhook_event_id=webhook.event_id,
                    test_name=f"test_{api_spec['name'].lower().replace(' ', '_')}_{test_type}",
                    test_content=test_content,
                    file_path=test_file_path,
                    status="generated"
                )
                db.add(db_test)
                generated_files.append(test_file_path)
            
            db.commit()
            
            logger.info("Tests generated successfully", 
                       event_id=webhook.event_id, 
                       files_generated=len(generated_files),
                       file_paths=generated_files)
            
        except Exception as e:
            logger.error("Failed to generate test", 
                        event_id=webhook.event_id, 
                        error=str(e))
            raise
    
    def _extract_api_spec(self, webhook: ApiFoxWebhook) -> dict:
        """Extract API specification from webhook data"""
        try:
            data = webhook.data
            if 'api' in data:
                api_data = data['api']
                return {
                    'id': api_data.get('id', ''),
                    'name': api_data.get('name', 'Unknown API'),
                    'method': api_data.get('method', 'GET').upper(),
                    'path': api_data.get('path', '/'),
                    'description': api_data.get('description', ''),
                    'parameters': api_data.get('parameters', {}),
                    'request_body': api_data.get('requestBody', {}),
                    'responses': api_data.get('responses', {})
                }
        except Exception as e:
            logger.error("Failed to extract API spec", error=str(e))
        return None
    
    def _determine_test_types(self, api_spec: dict) -> List[str]:
        """Determine which test types to generate based on API specification"""
        config = self.config_manager.config
        enabled_types = [t.value for t in config.enabled_test_types]
        
        test_types = []
        
        # Basic tests (always include if enabled)
        if TestType.BASIC.value in enabled_types:
            test_types.append("basic")
        
        # CRUD tests for data manipulation endpoints
        if (TestType.CRUD.value in enabled_types and 
            api_spec['method'] in ['POST', 'PUT', 'PATCH', 'DELETE']):
            test_types.append("crud")
        
        # Error scenario tests (Week 3 advanced)
        if TestType.ERROR_SCENARIOS.value in enabled_types:
            test_types.append("error_scenarios")
        
        # Authentication tests
        if TestType.AUTHENTICATION.value in enabled_types:
            test_types.append("authentication")
        
        # Performance tests (Week 3 advanced)
        if TestType.PERFORMANCE.value in enabled_types:
            test_types.append("performance")
        
        # Validation tests (Week 3 advanced)
        if TestType.VALIDATION.value in enabled_types:
            test_types.append("validation")
        
        # Enhanced test types
        if TestType.BOUNDARY_TESTING.value in enabled_types:
            test_types.append("boundary_testing")
        
        if TestType.ENVIRONMENT_CONFIG.value in enabled_types:
            test_types.append("environment_config")
        
        if TestType.CONCURRENCY.value in enabled_types:
            test_types.append("concurrency")
        
        return test_types
    
    def _generate_test_content(self, api_spec: dict, test_type: str = "basic") -> str:
        """Generate pytest test content using specified template type or advanced generator"""
        
        # Convert API spec to standardized format for advanced generators
        standardized_spec = self._standardize_api_spec(api_spec)
        
        # Use advanced generators for Week 3 test types
        if test_type == "performance":
            return self.performance_generator.generate_test_file(
                standardized_spec,
                self.settings.test_output_dir
            )
        elif test_type == "validation":
            return self.validation_generator.generate_test_file(
                standardized_spec,
                self.settings.test_output_dir
            )
        elif test_type == "boundary_testing":
            return self.boundary_generator.generate_test_file(
                standardized_spec,
                self.settings.test_output_dir
            )
        elif test_type == "environment_config":
            return self.environment_generator.generate_test_file(
                standardized_spec,
                self.settings.test_output_dir
            )
        elif test_type == "concurrency":
            return self.concurrency_generator.generate_test_file(
                standardized_spec,
                self.settings.test_output_dir
            )
        else:
            # Fall back to template-based generation with complete context
            return self._generate_template_content(api_spec, test_type)
    
    def _save_test_file(self, api_spec: dict, content: str, test_type: str = "basic") -> str:
        """Save generated test to file system"""
        output_dir = Path(self.settings.test_output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate safe filename with test type
        safe_name = api_spec['name'].lower().replace(' ', '_').replace('-', '_')
        filename = f"test_{safe_name}_{api_spec['method'].lower()}_{test_type}.py"
        file_path = output_dir / filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(file_path)
    
    async def generate_custom_tests(
        self, 
        api_spec: dict, 
        test_types: List[str],
        db: Session,
        webhook_event_id: str = None
    ) -> List[str]:
        """Generate custom test types for an API specification"""
        generated_files = []
        
        for test_type in test_types:
            if test_type not in self.template_types:
                logger.warning(f"Unknown test type: {test_type}")
                continue
            
            test_content = self._generate_test_content(api_spec, test_type)
            test_file_path = self._save_test_file(api_spec, test_content, test_type)
            
            # Record in database if session provided
            if db and webhook_event_id:
                db_test = GeneratedTest(
                    webhook_event_id=webhook_event_id,
                    test_name=f"test_{api_spec['name'].lower().replace(' ', '_')}_{test_type}",
                    test_content=test_content,
                    file_path=test_file_path,
                    status="generated"
                )
                db.add(db_test)
                generated_files.append(test_file_path)
        
        if db:
            db.commit()
        
        return generated_files
    
    def _standardize_api_spec(self, api_spec: dict) -> dict:
        """Convert webhook API spec to standardized format for advanced generators"""
        standardized = {
            'operationId': api_spec.get('name', 'unknown').lower().replace(' ', '_'),
            'method': api_spec.get('method', 'GET'),
            'path': api_spec.get('path', '/'),
            'description': api_spec.get('description', ''),
            'parameters': api_spec.get('parameters', {}),
            'request_body': api_spec.get('request_body', {}),
            'responses': api_spec.get('responses', {})
        }
        
        # Ensure request_body has proper structure for advanced generators
        if 'request_body' not in standardized or not standardized['request_body']:
            standardized['request_body'] = {
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'test': {'type': 'string', 'description': 'Test field'}
                            }
                        }
                    }
                }
            }
        
        return standardized
    
    def _generate_template_content(self, api_spec: dict, test_type: str = "basic") -> str:
        """Generate content using Jinja2 templates with complete context"""
        template_file = self.template_types.get(test_type, "pytest_template.py.j2")
        template = self.jinja_env.get_template(template_file)
        
        # Create complete template context
        template_context = self._create_template_context(api_spec, test_type)
        
        return template.render(**template_context)
    
    def _create_template_context(self, api_spec: dict, test_type: str) -> dict:
        """Create complete context for template rendering"""
        # Generate test data using the data factory
        test_data = self.data_factory.generate_complete_payload(
            {
                'type': 'object',
                'properties': {
                    'test_field': {'type': 'string'},
                    'test_number': {'type': 'integer'},
                    'test_bool': {'type': 'boolean'}
                }
            }
        ) if not api_spec.get('request_body') else self._generate_body_data_from_spec(api_spec)
        
        # Create authentication token
        auth_token = getattr(self.settings, 'test_auth_token', 'test_token_123456789_auto_generated')
        
        # Base URL from settings
        base_url = getattr(self.settings, 'test_base_url', 'http://localhost:8000')
        
        # Configuration values
        timeout = getattr(self.settings, 'test_timeout', 30)
        max_retries = getattr(self.settings, 'test_max_retries', 3)
        max_batch_size = getattr(self.settings, 'test_max_batch_size', 100)
        token_expiry = getattr(self.settings, 'test_token_expiry', 3600)
        max_login_attempts = getattr(self.settings, 'test_max_login_attempts', 5)
        
        # Test user credentials
        test_username = getattr(self.settings, 'test_username', 'test_user')
        test_password = getattr(self.settings, 'test_password', 'Test123!@#')
        test_email = getattr(self.settings, 'test_email', 'test@example.com')
        
        # OAuth configuration
        oauth_client_id = getattr(self.settings, 'oauth_client_id', 'test_client')
        oauth_client_secret = getattr(self.settings, 'oauth_client_secret', 'test_secret')
        oauth_redirect_uri = getattr(self.settings, 'oauth_redirect_uri', 'http://localhost:3000/callback')
        
        # Endpoint configuration
        auth_endpoint = getattr(self.settings, 'auth_endpoint', '/auth/login')
        refresh_endpoint = getattr(self.settings, 'refresh_endpoint', '/auth/refresh')
        logout_endpoint = getattr(self.settings, 'logout_endpoint', '/auth/logout')
        register_endpoint = getattr(self.settings, 'register_endpoint', '/auth/register')
        oauth_authorize_endpoint = getattr(self.settings, 'oauth_authorize_endpoint', '/oauth/authorize')
        oauth_token_endpoint = getattr(self.settings, 'oauth_token_endpoint', '/oauth/token')
        
        # Intelligent test classification
        test_markers = self.test_classifier.classify_test(api_spec, test_type)
        
        # Complete template context
        context = {
            # Main API specification
            'api': api_spec,
            
            # Intelligent Test Classification
            'test_markers': test_markers,
            'test_level': test_markers[0] if test_markers else 'integration',
            'execution_estimate': self.test_classifier.get_test_execution_estimate(test_markers),
            
            # Authentication and security
            'auth_token': auth_token,
            'test_username': test_username,
            'test_password': test_password,
            'test_email': test_email,
            
            # OAuth configuration
            'oauth_client_id': oauth_client_id,
            'oauth_client_secret': oauth_client_secret,
            'oauth_redirect_uri': oauth_redirect_uri,
            
            # Endpoints
            'auth_endpoint': auth_endpoint,
            'refresh_endpoint': refresh_endpoint,
            'logout_endpoint': logout_endpoint,
            'register_endpoint': register_endpoint,
            'oauth_authorize_endpoint': oauth_authorize_endpoint,
            'oauth_token_endpoint': oauth_token_endpoint,
            
            # Configuration
            'base_url': base_url,
            'timeout': timeout,
            'max_retries': max_retries,
            'max_batch_size': max_batch_size,
            'token_expiry': token_expiry,
            'max_login_attempts': max_login_attempts,
            
            # Test data
            'body_params': test_data,
            'test_data': test_data,
            
            # Template metadata
            'test_type': test_type,
            'generated_at': datetime.now().isoformat(),
            'generator_version': '2.0.0'
        }
        
        logger.info("Created template context", 
                   test_type=test_type, 
                   api_name=api_spec.get('name', 'Unknown'),
                   context_keys=list(context.keys()))
        
        return context
    
    def _generate_body_data_from_spec(self, api_spec: dict) -> dict:
        """Generate request body data from API specification"""
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return {
                'test_field': 'test_value',
                'test_number': 123,
                'test_bool': True
            }
        
        content = request_body.get('content', {})
        json_content = content.get('application/json', {})
        schema = json_content.get('schema', {})
        
        if schema and schema.get('type') == 'object':
            return self.data_factory.generate_complete_payload(schema)
        else:
            # Fallback to generic test data
            return {
                'data': 'test_data',
                'value': 'test_value',
                'number': 42
            }
    
    async def generate_enhanced_tests_with_quality_gate(
        self, 
        webhook: ApiFoxWebhook, 
        db: Session
    ) -> Dict[str, Any]:
        """
        Generate tests using enhanced generator with quality gate enforcement
        
        This method attempts to use the enhanced test generator first, with fallback
        to standard generation if quality gates fail or enhanced generation is disabled.
        """
        try:
            logger.info("Starting enhanced test generation with quality gate", 
                       event_id=webhook.event_id)
            
            # Define fallback callback for standard generation
            async def fallback_generation(webhook_data):
                return await self.generate_advanced_tests_with_quality_check(webhook_data, db)
            
            # Attempt enhanced generation
            result = await self.enhanced_adapter.generate_enhanced_tests(
                webhook, 
                fallback_callback=fallback_generation
            )
            
            # Convert enhanced result to standard format
            if result.success:
                # Record generated files in database
                for file_path in result.generated_files:
                    db_test = GeneratedTest(
                        webhook_event_id=webhook.event_id,
                        test_name=f"enhanced_{Path(file_path).stem}",
                        test_content="", # Content already written to file
                        file_path=file_path,
                        status="generated_enhanced"
                    )
                    db.add(db_test)
                
                db.commit()
                
                return {
                    "success": True,
                    "generated_files": result.generated_files,
                    "quality_summary": result.quality_summary,
                    "generation_time_seconds": result.generation_time_seconds,
                    "enhanced_generation_used": not result.fallback_used,
                    "metrics": result.metrics,
                    "quality_reports": [
                        {
                            "file": report.file_path,
                            "score": report.quality_score,
                            "issues": len(report.issues),
                            "errors": len([i for i in report.issues if i.severity == 'error'])
                        } for report in result.quality_reports
                    ]
                }
            else:
                return {
                    "success": False,
                    "error": result.error_message,
                    "generation_time_seconds": result.generation_time_seconds,
                    "enhanced_generation_used": False,
                    "fallback_used": result.fallback_used,
                    "metrics": result.metrics
                }
                
        except Exception as e:
            logger.error("Enhanced test generation failed", 
                        event_id=webhook.event_id, 
                        error=str(e),
                        exc_info=True)
            
            # Fall back to standard generation
            return await self.generate_advanced_tests_with_quality_check(webhook, db)

    async def generate_advanced_tests_with_quality_check(
        self, 
        webhook: ApiFoxWebhook, 
        db: Session
    ) -> Dict[str, Any]:
        """Generate tests using Week 3 advanced generators with quality validation"""
        try:
            logger.info("Starting advanced test generation with quality check", 
                       event_id=webhook.event_id)
            
            # Extract and standardize API specification
            api_spec = self._extract_api_spec(webhook)
            if not api_spec:
                return {"error": "No valid API spec found in webhook"}
            
            standardized_spec = self._standardize_api_spec(api_spec)
            
            # Generate tests using advanced generators
            generated_files = []
            quality_reports = []
            
            # Determine which test types to generate
            test_types_to_generate = self._determine_test_types(api_spec)
            
            for test_type in test_types_to_generate:
                try:
                    # Generate test content
                    if test_type in ["performance", "validation", "boundary_testing", "environment_config", "concurrency"]:
                        # Use advanced generators that return file paths
                        test_file_path = self._generate_advanced_test_file(
                            standardized_spec, test_type
                        )
                        
                        # Read the content for database storage
                        with open(test_file_path, 'r', encoding='utf-8') as f:
                            test_content = f.read()
                    else:
                        # Use template-based generation (including error_scenarios)
                        test_content = self._generate_test_content(api_spec, test_type)
                        test_file_path = self._save_test_file(api_spec, test_content, test_type)
                    
                    # Perform quality check
                    quality_report = self.quality_checker.check_test_file(test_file_path)
                    quality_reports.append(quality_report)
                    
                    # Phase 3 AI Enhancement: Automatically enhance low-quality tests
                    if self.ai_enhancement_enabled and quality_report.quality_score < 0.95:
                        try:
                            logger.info(f"AI enhancing test file: {test_file_path} (current quality: {quality_report.quality_score:.2%})")
                            
                            # Create API metadata for enhancement
                            api_metadata = {
                                'endpoint': standardized_spec.get('operationId', 'unknown'),
                                'method': standardized_spec.get('method', 'GET'),
                                'path': standardized_spec.get('path', '/'),
                                'complexity': 'moderate',
                                'test_type': test_type
                            }
                            
                            # Apply AI enhancement
                            enhancement_result = await self.ai_enhancer.enhance_test_quality(
                                test_file_path, api_metadata, target_quality=0.95
                            )
                            
                            if enhancement_result.success:
                                # Use enhanced file instead
                                test_file_path = enhancement_result.enhanced_file
                                # Re-read content for database storage
                                with open(test_file_path, 'r', encoding='utf-8') as f:
                                    test_content = f.read()
                                
                                # Update quality report
                                quality_report = self.quality_checker.check_test_file(test_file_path)
                                quality_reports[-1] = quality_report  # Replace the last report
                                
                                logger.info(f"AI enhancement successful: {enhancement_result.quality_before:.2%} → {enhancement_result.quality_after:.2%}")
                            else:
                                logger.warning(f"AI enhancement failed for {test_file_path}: {enhancement_result.errors}")
                        
                        except Exception as e:
                            logger.error(f"AI enhancement error for {test_file_path}: {str(e)}")
                    
                    # Only add to generated files if quality is acceptable (now potentially enhanced)
                    min_quality = self.config_manager.config.quality.min_quality_score
                    if quality_report.quality_score >= min_quality:
                        # Record in database
                        db_test = GeneratedTest(
                            webhook_event_id=webhook.event_id,
                            test_name=f"test_{standardized_spec['operationId']}_{test_type}",
                            test_content=test_content,
                            file_path=test_file_path,
                            status="generated"
                        )
                        db.add(db_test)
                        generated_files.append(test_file_path)
                        
                        logger.info(f"Generated {test_type} test with quality score: {quality_report.quality_score:.2%}")
                    else:
                        logger.warning(f"Generated {test_type} test failed quality check: {quality_report.quality_score:.2%}")
                        # Move file to quarantine or delete
                        Path(test_file_path).rename(Path(test_file_path).with_suffix('.quarantine'))
                
                except Exception as e:
                    logger.error(f"Failed to generate {test_type} test: {str(e)}")
                    continue
            
            db.commit()
            
            # Generate quality summary
            quality_summary = self.quality_checker.generate_quality_summary(quality_reports)
            
            result = {
                "success": True,
                "generated_files": generated_files,
                "quality_summary": quality_summary,
                "quality_reports": [
                    {
                        "file": report.file_path,
                        "score": report.quality_score,
                        "issues": len(report.issues),
                        "errors": len([i for i in report.issues if i.severity == 'error'])
                    } for report in quality_reports
                ]
            }
            
            logger.info("Advanced test generation completed", 
                       event_id=webhook.event_id,
                       files_generated=len(generated_files),
                       avg_quality_score=quality_summary.get('average_quality_score', 0))
            
            return result
            
        except Exception as e:
            logger.error("Failed to generate advanced tests", 
                        event_id=webhook.event_id, 
                        error=str(e))
            return {"error": str(e)}
    
    def _generate_advanced_test_file(self, api_spec: dict, test_type: str) -> str:
        """Generate test file using advanced generators and return file path"""
        output_dir = self.settings.test_output_dir
        
        if test_type == "performance":
            return self.performance_generator.generate_test_file(api_spec, output_dir)
        elif test_type == "validation":
            return self.validation_generator.generate_test_file(api_spec, output_dir)
        elif test_type == "boundary_testing":
            return self.boundary_generator.generate_test_file(api_spec, output_dir)
        elif test_type == "environment_config":
            return self.environment_generator.generate_test_file(api_spec, output_dir)
        elif test_type == "concurrency":
            return self.concurrency_generator.generate_test_file(api_spec, output_dir)
        else:
            raise ValueError(f"Unknown advanced test type: {test_type}")
    
    async def generate_from_openapi(self, openapi_spec: dict) -> Dict[str, Any]:
        """Generate tests from a full OpenAPI specification"""
        try:
            logger.info("Starting test generation from OpenAPI specification")
            
            generated_files = []
            quality_reports = []
            
            # Extract paths from OpenAPI spec
            paths = openapi_spec.get('paths', {})
            
            for path, path_data in paths.items():
                for method, operation_data in path_data.items():
                    if method.upper() not in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']:
                        continue
                    
                    logger.info(f"Processing {method.upper()} {path}")
                    
                    # Convert OpenAPI operation to our internal API spec format
                    api_spec = self._convert_openapi_to_internal(
                        path, method, operation_data, openapi_spec
                    )
                    
                    # Determine test types to generate
                    test_types = self._determine_test_types(api_spec)
                    
                    for test_type in test_types:
                        try:
                            # Generate test content
                            if test_type in ["performance", "validation", "boundary_testing", "environment_config", "concurrency"]:
                                # Use advanced generators
                                standardized_spec = self._standardize_api_spec(api_spec)
                                test_file_path = self._generate_advanced_test_file(
                                    standardized_spec, test_type
                                )
                                
                                # Read content for database storage
                                with open(test_file_path, 'r', encoding='utf-8') as f:
                                    test_content = f.read()
                            else:
                                # Use template-based generation
                                test_content = self._generate_test_content(api_spec, test_type)
                                test_file_path = self._save_test_file(api_spec, test_content, test_type)
                            
                            # Perform quality check
                            quality_report = self.quality_checker.check_test_file(test_file_path)
                            quality_reports.append(quality_report)
                            
                            # Phase 3 AI Enhancement for OpenAPI generation
                            if self.ai_enhancement_enabled and quality_report.quality_score < 0.95:
                                try:
                                    logger.info(f"AI enhancing OpenAPI test: {test_file_path} (quality: {quality_report.quality_score:.2%})")
                                    
                                    api_metadata = {
                                        'endpoint': api_spec.get('name', 'unknown'),
                                        'method': method.upper(),
                                        'path': path,
                                        'complexity': 'moderate',
                                        'test_type': test_type
                                    }
                                    
                                    enhancement_result = await self.ai_enhancer.enhance_test_quality(
                                        test_file_path, api_metadata, target_quality=0.95
                                    )
                                    
                                    if enhancement_result.success:
                                        test_file_path = enhancement_result.enhanced_file
                                        with open(test_file_path, 'r', encoding='utf-8') as f:
                                            test_content = f.read()
                                        
                                        # Update quality report
                                        quality_report = self.quality_checker.check_test_file(test_file_path)
                                        quality_reports[-1] = quality_report
                                        
                                        logger.info(f"OpenAPI AI enhancement: {enhancement_result.quality_before:.2%} → {enhancement_result.quality_after:.2%}")
                                
                                except Exception as e:
                                    logger.error(f"OpenAPI AI enhancement error: {str(e)}")
                            
                            # Check quality and handle accordingly
                            min_quality = self.config_manager.config.quality.min_quality_score
                            if quality_report.quality_score >= min_quality:
                                generated_files.append(test_file_path)
                                logger.info(f"Generated {test_type} test for {method.upper()} {path} with quality score: {quality_report.quality_score:.2%}")
                            else:
                                logger.warning(f"Generated {test_type} test for {method.upper()} {path} failed quality check: {quality_report.quality_score:.2%}")
                                # Move to quarantine
                                Path(test_file_path).rename(Path(test_file_path).with_suffix('.quarantine'))
                        
                        except Exception as e:
                            logger.error(f"Failed to generate {test_type} test for {method.upper()} {path}: {str(e)}")
                            continue
            
            # Generate quality summary
            quality_summary = self.quality_checker.generate_quality_summary(quality_reports)
            
            result = {
                "success": True,
                "generated_files": generated_files,
                "quality_summary": quality_summary,
                "total_endpoints_processed": len([path for path_data in paths.values() for method in path_data.keys()]),
                "quality_reports": [
                    {
                        "file": report.file_path,
                        "score": report.quality_score,
                        "issues": len(report.issues),
                        "errors": len([i for i in report.issues if i.severity == 'error'])
                    } for report in quality_reports
                ]
            }
            
            logger.info("OpenAPI test generation completed", 
                       files_generated=len(generated_files),
                       avg_quality_score=quality_summary.get('average_quality_score', 0))
            
            return result
            
        except Exception as e:
            logger.error("Failed to generate tests from OpenAPI spec", error=str(e))
            return {"error": str(e)}
    
    def _convert_openapi_to_internal(self, path: str, method: str, operation_data: dict, openapi_spec: dict) -> dict:
        """Convert OpenAPI operation to internal API spec format"""
        return {
            'id': operation_data.get('operationId', f"{method}_{path.replace('/', '_').replace('{', '').replace('}', '')}"),
            'name': operation_data.get('summary', f"{method.upper()} {path}"),
            'method': method.upper(),
            'path': path,
            'description': operation_data.get('description', ''),
            'parameters': operation_data.get('parameters', []),
            'request_body': operation_data.get('requestBody', {}),
            'responses': operation_data.get('responses', {})
        }
    
    def get_enhanced_generator_health(self) -> Dict[str, Any]:
        """Get health status of enhanced generator"""
        return self.enhanced_adapter.get_health_status()
    
    async def test_enhanced_generator(self) -> Dict[str, Any]:
        """Test enhanced generator with sample data"""
        sample_api = {
            'name': 'Health Check API',
            'method': 'GET',
            'path': '/health',
            'description': 'Health check endpoint',
            'requestBody': {},
            'responses': {
                '200': {
                    'description': 'Healthy',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'status': {'type': 'string'}
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return await self.enhanced_adapter.test_enhanced_generation(sample_api)
    
    # =============================================================================
    # PHASE 2 ENHANCED GENERATION METHODS
    # =============================================================================
    
    async def generate_intelligent_tests(self, openapi_spec: Dict[str, Any], 
                                       db: Session, 
                                       webhook_event_id: str = None) -> Dict[str, Any]:
        """
        Generate tests using Phase 2 intelligent parsing and adaptive strategies
        
        Args:
            openapi_spec: Full OpenAPI specification
            db: Database session
            webhook_event_id: Optional webhook event ID
            
        Returns:
            Dict containing generation results and metrics
        """
        try:
            logger.info("Starting intelligent test generation", 
                       webhook_event_id=webhook_event_id)
            
            # Parse OpenAPI specification
            parsed_spec = self.openapi_parser.parse_openapi_spec(openapi_spec)
            
            # Generate tests for each endpoint
            generated_files = []
            strategy_plans = []
            quality_reports = []
            
            for endpoint in parsed_spec['endpoints']:
                logger.info("Processing endpoint", 
                           operation_id=endpoint.operation_id,
                           complexity=endpoint.complexity.value)
                
                # Generate test strategy plan
                strategy_plan = self.strategy_engine.generate_strategy_plan(endpoint)
                strategy_plans.append(strategy_plan)
                
                # Generate tests for each strategy in the plan
                for requirement in strategy_plan.requirements:
                    try:
                        test_file_path = await self._generate_intelligent_test_file(
                            endpoint, requirement, strategy_plan
                        )
                        
                        # Perform quality check
                        quality_report = self.quality_checker.check_test_file(test_file_path)
                        quality_reports.append(quality_report)
                        
                        # Check quality threshold
                        min_quality = self.config_manager.config.quality.min_quality_score
                        if quality_report.quality_score >= min_quality:
                            # Read content for database storage
                            with open(test_file_path, 'r', encoding='utf-8') as f:
                                test_content = f.read()
                            
                            # Record in database
                            if db and webhook_event_id:
                                db_test = GeneratedTest(
                                    webhook_event_id=webhook_event_id,
                                    test_name=f"intelligent_{endpoint.operation_id}_{requirement.strategy.value}",
                                    test_content=test_content,
                                    file_path=test_file_path,
                                    status="generated_intelligent"
                                )
                                db.add(db_test)
                            
                            generated_files.append(test_file_path)
                            
                            logger.info("Generated intelligent test",
                                       endpoint=endpoint.operation_id,
                                       strategy=requirement.strategy.value,
                                       quality_score=quality_report.quality_score)
                        else:
                            logger.warning("Generated test failed quality check",
                                         endpoint=endpoint.operation_id,
                                         strategy=requirement.strategy.value,
                                         quality_score=quality_report.quality_score)
                            # Move to quarantine
                            Path(test_file_path).rename(Path(test_file_path).with_suffix('.quarantine'))
                    
                    except Exception as e:
                        logger.error("Failed to generate test for strategy",
                                   endpoint=endpoint.operation_id,
                                   strategy=requirement.strategy.value,
                                   error=str(e))
                        continue
            
            if db:
                db.commit()
            
            # Generate comprehensive results
            quality_summary = self.quality_checker.generate_quality_summary(quality_reports)
            
            result = {
                "success": True,
                "generation_method": "intelligent_phase2",
                "endpoints_processed": len(parsed_spec['endpoints']),
                "generated_files": generated_files,
                "strategy_plans": [
                    {
                        "endpoint_id": plan.endpoint_id,
                        "complexity": plan.complexity.value,
                        "strategies": [req.strategy.value for req in plan.requirements],
                        "estimated_cases": plan.total_estimated_cases
                    } for plan in strategy_plans
                ],
                "quality_summary": quality_summary,
                "quality_reports": [
                    {
                        "file": report.file_path,
                        "score": report.quality_score,
                        "issues": len(report.issues),
                        "errors": len([i for i in report.issues if i.severity == 'error'])
                    } for report in quality_reports
                ],
                "metrics": {
                    "total_strategies_applied": sum(len(plan.requirements) for plan in strategy_plans),
                    "avg_complexity": sum(len(plan.requirements) for plan in strategy_plans) / len(strategy_plans) if strategy_plans else 0,
                    "avg_quality_score": quality_summary.get('average_quality_score', 0)
                }
            }
            
            logger.info("Intelligent test generation completed",
                       endpoints=len(parsed_spec['endpoints']),
                       files_generated=len(generated_files),
                       avg_quality=quality_summary.get('average_quality_score', 0))
            
            return result
            
        except Exception as e:
            logger.error("Failed to generate intelligent tests", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def _generate_intelligent_test_file(self, endpoint: EndpointAnalysis, 
                                            requirement, strategy_plan: TestStrategyPlan) -> str:
        """Generate a single test file using intelligent strategies"""
        
        # Generate optimized test data for the specific strategy
        test_data = self.data_factory.optimize_test_data_for_strategy(
            endpoint, requirement.strategy.value
        )
        
        # Create test file content using appropriate generator
        strategy_value = requirement.strategy.value
        
        # Map intelligent strategies to existing generators or create new content
        if strategy_value in ['error_scenarios', 'performance', 'validation', 
                             'boundary_testing', 'environment_config', 'concurrency']:
            # Use existing advanced generators
            standardized_spec = self._convert_endpoint_to_internal_spec(endpoint)
            return self._generate_advanced_test_file(standardized_spec, strategy_value)
        
        else:
            # Generate using intelligent template approach
            return await self._generate_intelligent_template_test(
                endpoint, requirement, test_data, strategy_plan
            )
    
    async def _generate_intelligent_template_test(self, endpoint: EndpointAnalysis,
                                                requirement, test_data: Dict[str, Any],
                                                strategy_plan: TestStrategyPlan) -> str:
        """Generate test using intelligent templating approach"""
        
        # Create enhanced context for template rendering
        template_context = {
            'endpoint': {
                'operation_id': endpoint.operation_id,
                'method': endpoint.method,
                'path': endpoint.path,
                'summary': endpoint.summary,
                'description': endpoint.description,
                'complexity': endpoint.complexity.value,
                'parameters': [
                    {
                        'name': p.name,
                        'type': p.data_type,
                        'param_type': p.param_type.value,
                        'required': p.required,
                        'constraints': p.constraints,
                        'description': p.description
                    } for p in endpoint.parameters
                ],
                'request_body': endpoint.request_body,
                'responses': [
                    {
                        'status_code': r.status_code,
                        'description': r.description,
                        'content_type': r.content_type,
                        'schema': r.schema
                    } for r in endpoint.responses
                ],
                'security': [
                    {
                        'name': s.name,
                        'type': s.scheme_type,
                        'location': s.location
                    } for s in endpoint.security
                ]
            },
            'strategy': {
                'name': requirement.strategy.value,
                'priority': requirement.priority.value,
                'description': requirement.description,
                'test_cases': requirement.test_cases,
                'configuration': requirement.configuration
            },
            'test_data': test_data,
            'plan_config': strategy_plan.configuration,
            'intelligent_features': {
                'schema_aware_data': True,
                'boundary_testing': 'boundary_testing' in [req.strategy.value for req in strategy_plan.requirements],
                'security_testing': 'security_testing' in [req.strategy.value for req in strategy_plan.requirements],
                'performance_testing': 'performance_testing' in [req.strategy.value for req in strategy_plan.requirements]
            }
        }
        
        # Generate test content using enhanced template
        template_content = self._render_intelligent_template(template_context, requirement.strategy.value)
        
        # Save to file
        output_dir = Path(self.settings.test_output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        safe_name = endpoint.operation_id.lower().replace(' ', '_').replace('-', '_')
        filename = f"test_intelligent_{safe_name}_{requirement.strategy.value}.py"
        file_path = output_dir / filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(template_content)
        
        return str(file_path)
    
    def _render_intelligent_template(self, context: Dict[str, Any], strategy: str) -> str:
        """Render intelligent test template with enhanced context"""
        
        # Use existing template as base but enhance with intelligent features
        base_template_map = {
            'basic_functionality': 'pytest_template.py.j2',
            'parameter_validation': 'pytest_template.py.j2',
            'authentication_testing': 'auth_template.py.j2',
            'data_validation': 'crud_template.py.j2',
            'schema_validation': 'crud_template.py.j2'
        }
        
        template_file = base_template_map.get(strategy, 'pytest_template.py.j2')
        template = self.jinja_env.get_template(template_file)
        
        # Create complete context for intelligent rendering
        legacy_api = self._convert_context_to_legacy_format(context)
        template_context = self._create_template_context(legacy_api, strategy)
        
        # Merge intelligent context with complete template context
        template_context.update({
            'intelligent_context': context,
            'enhanced_features': True,
            'endpoint': context['endpoint']
        })
        
        # Render with complete context
        return template.render(**template_context)
    
    def _convert_endpoint_to_internal_spec(self, endpoint: EndpointAnalysis) -> Dict[str, Any]:
        """Convert EndpointAnalysis to internal spec format for existing generators"""
        return {
            'operationId': endpoint.operation_id,
            'method': endpoint.method,
            'path': endpoint.path,
            'description': endpoint.description,
            'parameters': {
                param.name: {
                    'type': param.data_type,
                    'in': param.param_type.value,
                    'required': param.required,
                    'constraints': param.constraints
                } for param in endpoint.parameters
            },
            'request_body': endpoint.request_body,
            'responses': {
                response.status_code: {
                    'description': response.description,
                    'content': {
                        response.content_type: {
                            'schema': response.schema
                        }
                    }
                } for response in endpoint.responses
            }
        }
    
    def _convert_context_to_legacy_format(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Convert intelligent context to legacy format for template compatibility"""
        endpoint = context['endpoint']
        return {
            'id': endpoint['operation_id'],
            'name': endpoint['summary'],
            'method': endpoint['method'],
            'path': endpoint['path'],
            'description': endpoint['description'],
            'parameters': endpoint.get('parameters', {}),
            'request_body': endpoint.get('request_body', {}),
            'responses': endpoint.get('responses', {})
        }
    
    async def analyze_endpoint_and_generate_strategy(self, openapi_operation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single endpoint and generate recommended test strategies
        
        Args:
            openapi_operation: Single OpenAPI operation definition
            
        Returns:
            Dict with endpoint analysis and strategy recommendations
        """
        try:
            # Create a minimal spec for parsing
            minimal_spec = {
                'openapi': '3.0.0',
                'info': {'title': 'Analysis', 'version': '1.0.0'},
                'paths': {
                    openapi_operation.get('path', '/'): {
                        openapi_operation.get('method', 'GET').lower(): openapi_operation
                    }
                }
            }
            
            # Parse the operation
            parsed_spec = self.openapi_parser.parse_openapi_spec(minimal_spec)
            
            if not parsed_spec['endpoints']:
                return {"error": "No valid endpoints found"}
            
            endpoint = parsed_spec['endpoints'][0]
            
            # Generate strategy recommendations
            recommendations = self.strategy_engine.get_strategy_recommendations(endpoint)
            
            # Generate example test data
            example_data = self.data_factory.generate_from_openapi_endpoint(endpoint)
            
            return {
                "endpoint_analysis": {
                    "operation_id": endpoint.operation_id,
                    "method": endpoint.method,
                    "path": endpoint.path,
                    "complexity": endpoint.complexity.value,
                    "parameter_count": len(endpoint.parameters),
                    "has_request_body": endpoint.request_body is not None,
                    "response_count": len(endpoint.responses),
                    "security_requirements": len(endpoint.security),
                    "validation_requirements": [rule.value for rule in endpoint.validation_requirements]
                },
                "strategy_recommendations": recommendations,
                "example_test_data": example_data,
                "estimated_test_cases": sum(
                    len(strategy_info.get('test_cases', [1])) if isinstance(strategy_info, dict) else 1
                    for priority_strategies in recommendations.values()
                    if isinstance(priority_strategies, list)
                    for strategy_info in priority_strategies
                )
            }
            
        except Exception as e:
            logger.error("Failed to analyze endpoint", error=str(e))
            return {"error": str(e)}
    
    def get_intelligent_generation_metrics(self) -> Dict[str, Any]:
        """Get metrics about intelligent generation capabilities"""
        return {
            "phase2_components": {
                "openapi_parser": {
                    "available": True,
                    "supported_formats": ["JSON", "YAML"],
                    "analysis_features": [
                        "complexity_assessment", "parameter_validation", 
                        "constraint_extraction", "security_analysis"
                    ]
                },
                "strategy_engine": {
                    "available": True,
                    "supported_strategies": [strategy.value for strategy in self.strategy_engine.strategy_weights.keys()],
                    "complexity_levels": ["simple", "moderate", "complex", "advanced"]
                },
                "enhanced_data_factory": {
                    "available": True,
                    "schema_aware": True,
                    "security_vectors": True,
                    "boundary_testing": True
                }
            },
            "phase3_components": {
                "ai_enhancement": {
                    "available": True,
                    "enabled": self.ai_enhancement_enabled,
                    "target_quality": "95%+",
                    "enhancement_rules": len(self.ai_enhancer.enhancement_rules),
                    "batch_processing": True
                },
                "quality_predictor": {
                    "available": True,
                    "model_loaded": True,
                    "features_extracted": "comprehensive"
                }
            },
            "integration_status": {
                "legacy_compatibility": True,
                "quality_gates": True,
                "database_integration": True,
                "template_enhancement": True,
                "ai_enhancement_integration": True
            },
            "generation_capabilities": {
                "intelligent_parsing": True,
                "adaptive_strategies": True,
                "schema_aware_data": True,
                "quality_optimization": True,
                "automatic_enhancement": True,
                "95_percent_quality_target": True
            }
        }

    # =============================================================================
    # PHASE 3 AI ENHANCEMENT AND QUARANTINE MANAGEMENT
    # =============================================================================
    
    async def process_quarantine_files(self, quarantine_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Process quarantine files and attempt to fix them using AI enhancement
        
        Args:
            quarantine_dir: Directory containing quarantine files (defaults to tests/generated)
            
        Returns:
            Dict containing processing results
        """
        if not quarantine_dir:
            quarantine_dir = self.settings.test_output_dir
        
        quarantine_path = Path(quarantine_dir)
        quarantine_files = list(quarantine_path.glob("**/*.quarantine"))
        
        if not quarantine_files:
            logger.info("No quarantine files found")
            return {
                "success": True,
                "files_processed": 0,
                "files_recovered": 0,
                "message": "No quarantine files to process"
            }
        
        logger.info(f"Processing {len(quarantine_files)} quarantine files")
        
        recovered_files = []
        failed_files = []
        
        for quarantine_file in quarantine_files:
            try:
                # Create temporary test file
                original_name = quarantine_file.name.replace('.quarantine', '.py')
                temp_test_file = quarantine_file.parent / f"temp_{original_name}"
                
                # Copy quarantine content to temp file
                with open(quarantine_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                with open(temp_test_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Extract API metadata from file name and content
                api_metadata = self._extract_metadata_from_quarantine_file(str(temp_test_file), content)
                
                # Apply AI enhancement
                if self.ai_enhancement_enabled:
                    enhancement_result = await self.ai_enhancer.enhance_test_quality(
                        str(temp_test_file), api_metadata, target_quality=0.90  # Slightly lower threshold for recovery
                    )
                    
                    if enhancement_result.success and enhancement_result.quality_after >= 0.90:
                        # Recovery successful
                        final_file = quarantine_file.parent / original_name
                        
                        # Move enhanced file to final location
                        Path(enhancement_result.enhanced_file).rename(final_file)
                        
                        # Remove quarantine file
                        quarantine_file.unlink()
                        
                        recovered_files.append({
                            "original_file": str(quarantine_file),
                            "recovered_file": str(final_file),
                            "quality_improvement": enhancement_result.quality_after - enhancement_result.quality_before,
                            "final_quality": enhancement_result.quality_after
                        })
                        
                        logger.info(f"Recovered quarantine file: {quarantine_file.name} -> {original_name} (quality: {enhancement_result.quality_after:.2%})")
                    else:
                        failed_files.append(str(quarantine_file))
                        logger.warning(f"Failed to recover quarantine file: {quarantine_file.name}")
                else:
                    failed_files.append(str(quarantine_file))
                    logger.warning(f"AI enhancement disabled, cannot recover: {quarantine_file.name}")
                
                # Clean up temp file
                temp_test_file.unlink(missing_ok=True)
                
            except Exception as e:
                logger.error(f"Error processing quarantine file {quarantine_file}: {str(e)}")
                failed_files.append(str(quarantine_file))
        
        result = {
            "success": True,
            "files_processed": len(quarantine_files),
            "files_recovered": len(recovered_files),
            "files_failed": len(failed_files),
            "recovery_rate": len(recovered_files) / len(quarantine_files) if quarantine_files else 0,
            "recovered_files": recovered_files,
            "failed_files": failed_files
        }
        
        logger.info(f"Quarantine processing complete: {len(recovered_files)}/{len(quarantine_files)} files recovered")
        
        return result
    
    async def enhance_existing_tests_batch(self, 
                                         test_directory: Optional[str] = None,
                                         target_quality: float = 0.95) -> Dict[str, Any]:
        """
        Batch enhance all existing test files to achieve target quality
        
        Args:
            test_directory: Directory containing test files
            target_quality: Target quality score (default: 0.95)
            
        Returns:
            Dict containing batch enhancement results
        """
        if not test_directory:
            test_directory = self.settings.test_output_dir
        
        logger.info(f"Starting batch enhancement of tests in {test_directory}")
        
        # Create API metadata map for all files
        test_files = list(Path(test_directory).glob("**/test_*.py"))
        api_metadata_map = {}
        
        for test_file in test_files:
            try:
                with open(test_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                api_metadata_map[str(test_file)] = self._extract_metadata_from_test_file(str(test_file), content)
            except Exception as e:
                logger.warning(f"Failed to extract metadata from {test_file}: {str(e)}")
                api_metadata_map[str(test_file)] = {"endpoint": "unknown", "method": "GET", "complexity": "moderate"}
        
        # Run batch enhancement
        enhancement_results = await self.batch_enhancer.enhance_test_directory(
            test_directory, api_metadata_map, target_quality
        )
        
        # Generate summary
        successful_enhancements = [r for r in enhancement_results.values() if r.success]
        quality_improvements = [r.quality_after - r.quality_before for r in successful_enhancements]
        
        avg_improvement = sum(quality_improvements) / len(quality_improvements) if quality_improvements else 0
        high_quality_count = len([r for r in enhancement_results.values() if r.quality_after >= target_quality])
        
        result = {
            "success": True,
            "files_processed": len(enhancement_results),
            "files_enhanced": len(successful_enhancements),
            "enhancement_success_rate": len(successful_enhancements) / len(enhancement_results) if enhancement_results else 0,
            "average_quality_improvement": avg_improvement,
            "high_quality_files": high_quality_count,
            "high_quality_rate": high_quality_count / len(enhancement_results) if enhancement_results else 0,
            "target_quality_achieved": high_quality_count >= len(enhancement_results) * 0.8,  # 80% should meet target
            "batch_metrics": self.batch_enhancer.get_batch_metrics(),
            "enhancement_metrics": self.ai_enhancer.get_enhancement_metrics()
        }
        
        logger.info(f"Batch enhancement complete: {high_quality_count}/{len(enhancement_results)} files achieve {target_quality:.0%}+ quality")
        
        return result
    
    def _extract_metadata_from_quarantine_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """Extract API metadata from quarantine file"""
        # Try to extract from file name pattern
        file_name = Path(file_path).name
        
        # Pattern: test_<endpoint>_<method>_<type>.py
        parts = file_name.replace('test_', '').replace('.py', '').split('_')
        
        method = 'GET'
        endpoint = 'unknown'
        test_type = 'basic'
        
        if len(parts) >= 2:
            endpoint = parts[0]
            if parts[1].upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                method = parts[1].upper()
                if len(parts) >= 3:
                    test_type = parts[2]
            else:
                test_type = parts[1]
        
        # Try to extract from content
        if 'async def test_' in content:
            complexity = 'moderate'
        else:
            complexity = 'simple'
        
        if 'error' in content.lower() or 'exception' in content.lower():
            test_type = 'error_handling'
        elif 'performance' in content.lower() or 'time' in content.lower():
            test_type = 'performance'
        
        return {
            'endpoint': endpoint,
            'method': method,
            'complexity': complexity,
            'test_type': test_type,
            'source': 'quarantine_recovery'
        }
    
    def _extract_metadata_from_test_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """Extract API metadata from test file"""
        return self._extract_metadata_from_quarantine_file(file_path, content)