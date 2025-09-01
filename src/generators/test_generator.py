import os
import structlog
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from pathlib import Path
from typing import List, Dict, Any
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
        
        # Template configuration (legacy support)
        self.template_types = {
            "basic": "pytest_template.py.j2",
            "crud": "crud_template.py.j2", 
            "error_scenarios": "error_scenarios_template.py.j2",
            "authentication": "auth_template.py.j2"
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
        if test_type == "error_scenarios":
            return self.error_generator.generate_test_file(
                standardized_spec, 
                self.settings.test_output_dir
            )
        elif test_type == "performance":
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
            # Fall back to template-based generation
            template_file = self.template_types.get(test_type, "pytest_template.py.j2")
            template = self.jinja_env.get_template(template_file)
            return template.render(api=api_spec)
    
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
                    if test_type in ["error_scenarios", "performance", "validation", "boundary_testing", "environment_config", "concurrency"]:
                        # Use advanced generators that return file paths
                        test_file_path = self._generate_advanced_test_file(
                            standardized_spec, test_type
                        )
                        
                        # Read the content for database storage
                        with open(test_file_path, 'r', encoding='utf-8') as f:
                            test_content = f.read()
                    else:
                        # Use template-based generation
                        test_content = self._generate_test_content(api_spec, test_type)
                        test_file_path = self._save_test_file(api_spec, test_content, test_type)
                    
                    # Perform quality check
                    quality_report = self.quality_checker.check_test_file(test_file_path)
                    quality_reports.append(quality_report)
                    
                    # Only add to generated files if quality is acceptable
                    if quality_report.quality_score >= self.config_manager.config.quality.min_quality_score:
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
        
        if test_type == "error_scenarios":
            return self.error_generator.generate_test_file(api_spec, output_dir)
        elif test_type == "performance":
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
                            if test_type in ["error_scenarios", "performance", "validation", "boundary_testing", "environment_config", "concurrency"]:
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
                            
                            # Check quality and handle accordingly
                            if quality_report.quality_score >= self.config_manager.config.quality.min_quality_score:
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