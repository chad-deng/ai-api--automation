"""
Advanced Error Scenario Test Generator

Generates comprehensive error scenario tests covering all HTTP error codes,
boundary conditions, and edge cases based on API specifications.
"""

import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pathlib import Path
from src.config.settings import Settings
import structlog

logger = structlog.get_logger()

@dataclass
class ErrorScenario:
    """Represents a specific error scenario to test"""
    name: str
    description: str
    expected_status_code: int
    test_payload: Dict[str, Any]
    test_headers: Optional[Dict[str, str]] = None
    test_params: Optional[Dict[str, str]] = None
    test_method_override: Optional[str] = None

class ErrorScenarioGenerator:
    """
    Generates comprehensive error scenario tests for API endpoints
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def generate_error_scenarios(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """
        Generate all error scenarios for an API endpoint
        
        Args:
            api_spec: API specification dictionary
            
        Returns:
            List of ErrorScenario objects
        """
        scenarios = []
        
        # Add HTTP method-specific scenarios
        scenarios.extend(self._generate_method_errors(api_spec))
        
        # Add authentication/authorization errors
        scenarios.extend(self._generate_auth_errors(api_spec))
        
        # Add validation errors based on schema
        scenarios.extend(self._generate_validation_errors(api_spec))
        
        # Add boundary value errors
        scenarios.extend(self._generate_boundary_errors(api_spec))
        
        # Add content type errors
        scenarios.extend(self._generate_content_type_errors(api_spec))
        
        # Add rate limiting scenarios
        scenarios.extend(self._generate_rate_limit_errors(api_spec))
        
        # Add server error scenarios
        scenarios.extend(self._generate_server_errors(api_spec))
        
        self.logger.info(f"Generated {len(scenarios)} error scenarios for {api_spec.get('path')}")
        return scenarios
    
    def _generate_method_errors(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """Generate method not allowed errors"""
        scenarios = []
        
        allowed_method = api_spec.get('method', 'GET')
        forbidden_methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
        forbidden_methods = [m for m in forbidden_methods if m != allowed_method]
        
        for method in forbidden_methods[:3]:  # Test first 3 forbidden methods
            scenarios.append(ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_method_{method.lower()}_not_allowed",
                description=f"Test {method} method returns 405 Method Not Allowed",
                expected_status_code=405,
                test_payload={},
                test_method_override=method
            ))
        
        return scenarios
    
    def _generate_auth_errors(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """Generate authentication and authorization error scenarios"""
        scenarios = []
        
        # 401 Unauthorized scenarios
        scenarios.extend([
            ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_missing_auth",
                description="Test request without authentication returns 401",
                expected_status_code=401,
                test_payload={"test": "data"}
            ),
            ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_invalid_token",
                description="Test request with invalid token returns 401",
                expected_status_code=401,
                test_payload={"test": "data"},
                test_headers={"Authorization": "Bearer invalid_token_placeholder"}
            ),
            ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_expired_token",
                description="Test request with expired token returns 401",
                expected_status_code=401,
                test_payload={"test": "data"},
                test_headers={"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDk0NTkyMDB9.expired"}
            ),
            ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_malformed_auth_header",
                description="Test request with malformed Authorization header returns 401",
                expected_status_code=401,
                test_payload={"test": "data"},
                test_headers={"Authorization": "InvalidFormat token"}
            )
        ])
        
        # 403 Forbidden scenarios
        scenarios.extend([
            ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_insufficient_permissions",
                description="Test request with insufficient permissions returns 403",
                expected_status_code=403,
                test_payload={"test": "data"},
                test_headers={"Authorization": "Bearer {settings.test_limited_token or 'limited_placeholder'}"}
            ),
            ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_revoked_token",
                description="Test request with revoked token returns 403",
                expected_status_code=403,
                test_payload={"test": "data"},
                test_headers={"Authorization": "Bearer {settings.test_revoked_token or 'revoked_placeholder'}"}
            )
        ])
        
        return scenarios
    
    def _generate_validation_errors(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """Generate validation error scenarios based on request schema"""
        scenarios = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return scenarios
            
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        required_fields = schema.get('required', [])
        
        # Missing required fields
        for field in required_fields:
            invalid_payload = {k: f"test_{k}" for k in properties.keys() if k != field}
            scenarios.append(ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_missing_{field}",
                description=f"Test request missing required field '{field}' returns 400",
                expected_status_code=400,
                test_payload=invalid_payload
            ))
        
        # Invalid field types
        for field_name, field_spec in properties.items():
            field_type = field_spec.get('type', 'string')
            invalid_value = self._get_invalid_type_value(field_type)
            
            if invalid_value is not None:
                valid_payload = {k: f"test_{k}" for k in properties.keys()}
                valid_payload[field_name] = invalid_value
                
                scenarios.append(ErrorScenario(
                    name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_invalid_{field_name}_type",
                    description=f"Test request with invalid {field_name} type returns 400",
                    expected_status_code=400,
                    test_payload=valid_payload
                ))
        
        # Empty payload when fields are required
        if required_fields:
            scenarios.append(ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_empty_payload",
                description="Test request with empty payload returns 400",
                expected_status_code=400,
                test_payload={}
            ))
        
        return scenarios
    
    def _generate_boundary_errors(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """Generate boundary value error scenarios"""
        scenarios = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return scenarios
            
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        
        for field_name, field_spec in properties.items():
            field_type = field_spec.get('type', 'string')
            
            # String length boundaries
            if field_type == 'string':
                max_length = field_spec.get('maxLength')
                min_length = field_spec.get('minLength', 0)
                
                if max_length:
                    # Test string too long
                    valid_payload = {k: f"test_{k}" for k in properties.keys()}
                    valid_payload[field_name] = "x" * (max_length + 1)
                    
                    scenarios.append(ErrorScenario(
                        name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_{field_name}_too_long",
                        description=f"Test {field_name} exceeding max length returns 400",
                        expected_status_code=400,
                        test_payload=valid_payload
                    ))
                
                if min_length > 0:
                    # Test string too short
                    valid_payload = {k: f"test_{k}" for k in properties.keys()}
                    valid_payload[field_name] = "x" * max(0, min_length - 1)
                    
                    scenarios.append(ErrorScenario(
                        name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_{field_name}_too_short",
                        description=f"Test {field_name} below min length returns 400",
                        expected_status_code=400,
                        test_payload=valid_payload
                    ))
            
            # Numeric boundaries
            elif field_type in ['integer', 'number']:
                minimum = field_spec.get('minimum')
                maximum = field_spec.get('maximum')
                
                if minimum is not None:
                    # Test value below minimum
                    valid_payload = {k: f"test_{k}" for k in properties.keys()}
                    valid_payload[field_name] = minimum - 1
                    
                    scenarios.append(ErrorScenario(
                        name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_{field_name}_below_minimum",
                        description=f"Test {field_name} below minimum returns 400",
                        expected_status_code=400,
                        test_payload=valid_payload
                    ))
                
                if maximum is not None:
                    # Test value above maximum
                    valid_payload = {k: f"test_{k}" for k in properties.keys()}
                    valid_payload[field_name] = maximum + 1
                    
                    scenarios.append(ErrorScenario(
                        name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_{field_name}_above_maximum",
                        description=f"Test {field_name} above maximum returns 400",
                        expected_status_code=400,
                        test_payload=valid_payload
                    ))
        
        return scenarios
    
    def _generate_content_type_errors(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """Generate content type error scenarios"""
        scenarios = []
        
        # Wrong Content-Type header
        scenarios.append(ErrorScenario(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_wrong_content_type",
            description="Test request with wrong Content-Type returns 415",
            expected_status_code=415,
            test_payload={"test": "data"},
            test_headers={"Content-Type": "text/plain"}
        ))
        
        # Missing Content-Type for POST/PUT/PATCH
        if api_spec.get('method') in ['POST', 'PUT', 'PATCH']:
            scenarios.append(ErrorScenario(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_missing_content_type",
                description="Test request without Content-Type returns 400",
                expected_status_code=400,
                test_payload={"test": "data"},
                test_headers={"Content-Type": ""}
            ))
        
        return scenarios
    
    def _generate_rate_limit_errors(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """Generate rate limiting error scenarios"""
        scenarios = []
        
        # Rate limiting test (429 Too Many Requests)
        scenarios.append(ErrorScenario(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_rate_limit_exceeded",
            description="Test rapid requests trigger rate limiting (429)",
            expected_status_code=429,
            test_payload={"test": "data"}
        ))
        
        return scenarios
    
    def _generate_server_errors(self, api_spec: Dict[str, Any]) -> List[ErrorScenario]:
        """Generate server error scenarios"""
        scenarios = []
        
        # Test with oversized payload (413 Payload Too Large)
        scenarios.append(ErrorScenario(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_payload_too_large",
            description="Test oversized payload returns 413",
            expected_status_code=413,
            test_payload={"large_data": "x" * 1000000}  # 1MB of data
        ))
        
        return scenarios
    
    def _get_invalid_type_value(self, field_type: str) -> Any:
        """Get an invalid value for a given field type"""
        type_invalid_values = {
            'string': 12345,  # number instead of string
            'integer': "not_a_number",  # string instead of integer
            'number': "not_a_number",  # string instead of number
            'boolean': "not_a_boolean",  # string instead of boolean
            'array': "not_an_array",  # string instead of array
            'object': "not_an_object"  # string instead of object
        }
        
        return type_invalid_values.get(field_type)
    
    def generate_test_file(self, api_spec: Dict[str, Any], output_dir: str) -> str:
        """
        Generate a complete error scenario test file
        
        Args:
            api_spec: API specification dictionary
            output_dir: Directory to save the test file
            
        Returns:
            Path to the generated test file
        """
        scenarios = self.generate_error_scenarios(api_spec)
        
        # Generate test file content
        test_content = self._generate_test_file_content(api_spec, scenarios)
        
        # Save to file
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        filename = f"test_{operation_id}_error_scenarios.py"
        output_path = Path(output_dir) / filename
        
        with open(output_path, 'w') as f:
            f.write(test_content)
        
        self.logger.info(f"Generated error scenario test file: {output_path}")

        return str(output_path)
    
    def _generate_test_file_content(self, api_spec, scenarios):
        """Generate the actual test file content"""
        operation_id = api_spec.get('operationId', 'endpoint')
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        description = api_spec.get('description', f'{operation_id} endpoint')
        
        content = f"""import pytest
import httpx
from typing import Dict, Any, Optional
import json
import asyncio
from src.config.settings import Settings

# Advanced Error Scenario Tests for: {description}
# Method: {method}
# Path: {path}
# Generated: Week 3 Advanced Test Generation

# Load settings from environment
settings = Settings()
BASE_URL = settings.test_api_base_url

class TestErrorScenariosEndpoint:
    
    @pytest.fixture
    def client(self):
        cookies = {{}}
        if settings.test_cookie_connect_sid:
            cookies['connect.sid'] = settings.test_cookie_connect_sid
        return httpx.AsyncClient(base_url=BASE_URL, cookies=cookies, timeout=30.0)
    
    @pytest.fixture
    def auth_headers(self):
        return {{
            "valid": {{"Authorization": f"Bearer {{settings.test_auth_token}}"}},
            "invalid": {{"Authorization": "Bearer invalid_token_placeholder"}},
        }}

"""
        
        # Generate test methods for each scenario  
        for scenario in scenarios:
            content += self._generate_test_method(scenario, api_spec)
            content += "\n"
        
        return content
    
    def _generate_test_method(self, scenario, api_spec):
        """Generate a single test method"""
        method = scenario.test_method_override or api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        
        return f"""    @pytest.mark.asyncio
    async def {scenario.name}(self, client):
        {scenario.description}
        headers = {{}}
        if hasattr(scenario, 'test_headers') and scenario.test_headers:
            headers.update(scenario.test_headers)
            
        response = await client.{method.lower()}("{path}", headers=headers)
        assert response.status_code == {scenario.expected_status_code}
"""
    
    def _generate_batch_error_test(self, api_spec, scenarios):
        """Generate batch error test"""
        return ""
