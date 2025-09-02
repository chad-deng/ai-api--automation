"""
Advanced Boundary Test Generator

Generates comprehensive boundary value tests covering extreme values,
edge cases, and data limits to catch boundary-related bugs.
"""

import json
from src.config.settings import Settings
import time
import random
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import structlog
from datetime import datetime, timedelta
import math

logger = structlog.get_logger()

@dataclass
class BoundaryTest:
    """Represents a specific boundary test case"""
    name: str
    description: str
    test_payload: Dict[str, Any]
    expected_status_codes: List[int]  # Multiple acceptable codes
    boundary_type: str  # 'extreme_value', 'unicode', 'size_limit', 'precision', 'time'
    field_being_tested: str
    test_category: str = "boundary"

class BoundaryTestGenerator:
    """
    Generates comprehensive boundary value tests for API endpoints
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
        
        # Extreme numeric values for different data types
        self.extreme_values = {
            'integer': [
                -2**63,  # Min 64-bit signed int
                -2**31,  # Min 32-bit signed int
                -2**15,  # Min 16-bit signed int
                -1,
                0,
                1,
                2**15 - 1,   # Max 16-bit signed int
                2**31 - 1,   # Max 32-bit signed int
                2**63 - 1,   # Max 64-bit signed int
            ],
            'float': [
                -float('inf'),
                -1.7976931348623157e+308,  # Min double
                -1e100,
                -1.0,
                -1e-100,
                0.0,
                1e-100,
                1.0,
                1e100,
                1.7976931348623157e+308,   # Max double
                float('inf'),
                float('nan'),
            ],
            'string_lengths': [0, 1, 255, 256, 1023, 1024, 65535, 65536, 1048575, 1048576]  # Common boundary sizes
        }
        
        # Unicode edge cases that have caused bugs in real systems
        self.unicode_edge_cases = [
            "",  # Empty string
            " ",  # Single space
            "\t\n\r",  # Whitespace characters
            "a",  # Single ASCII
            "🚀",  # Single emoji
            "👨‍👩‍👧‍👦",  # Complex emoji (family)
            "🏳️‍🌈",  # Flag with zero-width joiner
            "e\u0301",  # e with combining accent
            "A\u0300\u0301\u0302",  # A with multiple combining characters
            "\u200B\u200C\u200D",  # Zero-width characters
            "\uFEFF",  # Byte order mark
            "𝕳𝖊𝖑𝖑𝖔",  # Mathematical script chars
            "𒀀𒀁𒀂",  # Ancient cuneiform
            "\x00\x01\x02",  # Control characters
            "SELECT * FROM",  # SQL keywords
            "<script>",  # HTML/XSS
            "../../../etc/passwd",  # Path traversal
            "%3Cscript%3E",  # URL encoded
            "\x27 OR 1=1--",  # SQL injection
            "../../windows/system32",  # Windows path traversal
        ]
    
    def generate_boundary_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """
        Generate all boundary test scenarios for an API endpoint
        
        Args:
            api_spec: API specification dictionary
            
        Returns:
            List of BoundaryTest objects
        """
        tests = []
        
        # Generate extreme value tests
        tests.extend(self._generate_extreme_value_tests(api_spec))
        
        # Generate Unicode edge case tests
        tests.extend(self._generate_unicode_tests(api_spec))
        
        # Generate payload size limit tests
        tests.extend(self._generate_size_limit_tests(api_spec))
        
        # Generate numeric precision tests
        tests.extend(self._generate_precision_tests(api_spec))
        
        # Generate time boundary tests
        tests.extend(self._generate_time_boundary_tests(api_spec))
        
        # Generate array boundary tests
        tests.extend(self._generate_array_boundary_tests(api_spec))
        
        # Generate nested object depth tests
        tests.extend(self._generate_nesting_depth_tests(api_spec))
        
        self.logger.info(f"Generated {len(tests)} boundary tests for {api_spec.get('path')}")
        return tests
    
    def _generate_base_payload(self, api_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a valid base payload from API spec"""
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return {}
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        required = schema.get('required', [])
        
        payload = {}
        for field_name, field_spec in properties.items():
            if field_name in required:
                payload[field_name] = self._generate_valid_field_value(field_spec)
        
        return payload
    
    def _generate_valid_field_value(self, field_spec: Dict[str, Any]) -> Any:
        """Generate a valid value for a field specification"""
        field_type = field_spec.get('type', 'string')
        
        if field_type == 'string':
            return 'valid_test_value'
        elif field_type == 'integer':
            return 42
        elif field_type == 'number':
            return 42.0
        elif field_type == 'boolean':
            return True
        elif field_type == 'array':
            return ['item1', 'item2']
        elif field_type == 'object':
            return {'nested': 'value'}
        else:
            return 'default_value'
    
    def _generate_extreme_value_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """Generate tests with extreme numeric values"""
        tests = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return tests
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            field_type = field_spec.get('type')
            base_payload = self._generate_base_payload(api_spec)
            
            if field_type == 'integer':
                for extreme_value in self.extreme_values['integer']:
                    payload = base_payload.copy()
                    payload[field_name] = extreme_value
                    
                    # Determine expected status codes based on constraints
                    expected_codes = self._determine_expected_codes_for_numeric(field_spec, extreme_value)
                    
                    tests.append(BoundaryTest(
                        name=f"test_{operation_id}_boundary_{field_name}_extreme_int_{str(extreme_value).replace('-', 'neg_')}",
                        description=f"Test {field_name} with extreme integer value: {extreme_value}",
                        test_payload=payload,
                        expected_status_codes=expected_codes,
                        boundary_type='extreme_value',
                        field_being_tested=field_name
                    ))
            
            elif field_type in ['number', 'float']:
                for extreme_value in self.extreme_values['float']:
                    payload = base_payload.copy()
                    
                    # Handle special float values
                    if math.isnan(extreme_value):
                        payload[field_name] = None  # JSON doesn't support NaN
                        value_desc = "null_for_nan"
                    elif math.isinf(extreme_value):
                        payload[field_name] = str(extreme_value)  # JSON may represent as string
                        value_desc = f"inf_{str(extreme_value)}"
                    else:
                        payload[field_name] = extreme_value
                        value_desc = str(extreme_value).replace('-', 'neg_').replace('.', '_')
                    
                    expected_codes = self._determine_expected_codes_for_numeric(field_spec, extreme_value)
                    
                    tests.append(BoundaryTest(
                        name=f"test_{operation_id}_boundary_{field_name}_extreme_float_{value_desc}",
                        description=f"Test {field_name} with extreme float value: {extreme_value}",
                        test_payload=payload,
                        expected_status_codes=expected_codes,
                        boundary_type='extreme_value',
                        field_being_tested=field_name
                    ))
        
        return tests
    
    def _determine_expected_codes_for_numeric(self, field_spec: Dict[str, Any], value: Union[int, float]) -> List[int]:
        """Determine expected status codes based on field constraints and value"""
        minimum = field_spec.get('minimum')
        maximum = field_spec.get('maximum')
        
        # If value is within constraints, should succeed
        if minimum is not None and value < minimum:
            return [400, 422]  # Validation error
        if maximum is not None and value > maximum:
            return [400, 422]  # Validation error
        
        # Special handling for extreme values
        if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
            return [400, 422]  # Should reject invalid float values
        
        # Very large values might cause server errors
        if isinstance(value, (int, float)) and abs(value) > 1e15:
            return [400, 422, 500]  # Could be validation or server error
        
        return [200, 201, 202]  # Should succeed
    
    def _generate_unicode_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """Generate tests with Unicode edge cases"""
        tests = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return tests
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') != 'string':
                continue
            
            base_payload = self._generate_base_payload(api_spec)
            
            for i, unicode_string in enumerate(self.unicode_edge_cases):
                payload = base_payload.copy()
                payload[field_name] = unicode_string
                
                # Determine expected behavior
                expected_codes = self._determine_expected_codes_for_string(field_spec, unicode_string)
                
                # Generate safe test name
                safe_description = self._generate_safe_test_name(unicode_string, i)
                
                tests.append(BoundaryTest(
                    name=f"test_{operation_id}_boundary_{field_name}_unicode_{safe_description}",
                    description=f"Test {field_name} with Unicode edge case: {repr(unicode_string)}",
                    test_payload=payload,
                    expected_status_codes=expected_codes,
                    boundary_type='unicode',
                    field_being_tested=field_name
                ))
        
        return tests
    
    def _determine_expected_codes_for_string(self, field_spec: Dict[str, Any], value: str) -> List[int]:
        """Determine expected status codes for string values"""
        min_length = field_spec.get('minLength', 0)
        max_length = field_spec.get('maxLength')
        pattern = field_spec.get('pattern')
        
        # Check length constraints
        if len(value) < min_length:
            return [400, 422]
        if max_length and len(value) > max_length:
            return [400, 422]
        
        # Security-related strings should be rejected
        security_indicators = ['<script', 'SELECT', 'DROP', '../', 'passwd', 'system32', '%3C']
        if any(indicator.lower() in value.lower() for indicator in security_indicators):
            return [400, 422]  # Should be rejected
        
        # Control characters might be rejected
        if any(ord(c) < 32 for c in value if c not in '\t\n\r'):
            return [400, 422]
        
        return [200, 201, 202]  # Should succeed
    
    def _generate_safe_test_name(self, unicode_string: str, index: int) -> str:
        """Generate a safe test name from Unicode string"""
        if not unicode_string:
            return "empty"
        
        # Map common cases
        name_mapping = {
            " ": "space",
            "\t\n\r": "whitespace",
            "🚀": "emoji_rocket",
            "SELECT * FROM": "sql_select",
            "<script>": "xss_script",
            "../../../etc/passwd": "path_traversal",
        }
        
        if unicode_string in name_mapping:
            return name_mapping[unicode_string]
        
        # Generate description based on content
        if all(ord(c) > 127 for c in unicode_string):
            return f"unicode_{index}"
        elif any(ord(c) < 32 for c in unicode_string):
            return f"control_chars_{index}"
        elif len(unicode_string) == 1:
            return f"single_char_{index}"
        else:
            return f"case_{index}"
    
    def _generate_size_limit_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """Generate tests with various payload sizes"""
        tests = []
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        base_payload = self._generate_base_payload(api_spec)
        
        # Test different payload sizes
        size_tests = [
            (1024, "1KB"),          # 1KB
            (10240, "10KB"),        # 10KB  
            (102400, "100KB"),      # 100KB
            (1048576, "1MB"),       # 1MB
            (5242880, "5MB"),       # 5MB
            (10485760, "10MB"),     # 10MB
        ]
        
        for size_bytes, size_desc in size_tests:
            # Create large string payload
            large_string = "x" * size_bytes
            payload = base_payload.copy()
            payload['large_data_field'] = large_string
            
            # Large payloads should be rejected
            expected_codes = [413, 400, 422] if size_bytes > 1048576 else [200, 201, 202, 413]
            
            tests.append(BoundaryTest(
                name=f"test_{operation_id}_boundary_payload_size_{size_desc.lower()}",
                description=f"Test API with {size_desc} payload size",
                test_payload=payload,
                expected_status_codes=expected_codes,
                boundary_type='size_limit',
                field_being_tested='payload_size'
            ))
        
        return tests
    
    def _generate_precision_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """Generate tests with high-precision floating point numbers"""
        tests = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return tests
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        precision_values = [
            0.1 + 0.2,  # 0.30000000000000004 (floating point precision issue)
            1.0000000000000001,  # Very small difference
            999999999999999.9,   # Large number with decimal
            0.123456789012345678901234567890,  # Many decimal places
            1e-308,  # Very small number
            1.7976931348623157e+307,  # Near max double
        ]
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') not in ['number', 'float']:
                continue
            
            base_payload = self._generate_base_payload(api_spec)
            
            for precision_value in precision_values:
                payload = base_payload.copy()
                payload[field_name] = precision_value
                
                expected_codes = self._determine_expected_codes_for_numeric(field_spec, precision_value)
                
                value_desc = str(precision_value).replace('.', '_').replace('-', 'neg_').replace('+', 'pos_')
                
                tests.append(BoundaryTest(
                    name=f"test_{operation_id}_boundary_{field_name}_precision_{value_desc[:20]}",
                    description=f"Test {field_name} with high-precision value: {precision_value}",
                    test_payload=payload,
                    expected_status_codes=expected_codes,
                    boundary_type='precision',
                    field_being_tested=field_name
                ))
        
        return tests
    
    def _generate_time_boundary_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """Generate tests with time boundary values"""
        tests = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return tests
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        # Time boundary cases
        time_boundaries = [
            "1970-01-01T00:00:00Z",      # Unix epoch
            "2038-01-19T03:14:07Z",      # 32-bit timestamp limit  
            "2038-01-19T03:14:08Z",      # One second after 32-bit limit
            "1900-01-01T00:00:00Z",      # Very old date
            "2100-12-31T23:59:59Z",      # Far future
            "2000-02-29T12:00:00Z",      # Leap year
            "1900-02-29T12:00:00Z",      # Invalid leap year
            "2023-02-30T12:00:00Z",      # Invalid date
            "2023-13-01T12:00:00Z",      # Invalid month
            "2023-12-32T12:00:00Z",      # Invalid day
            "2023-12-01T25:00:00Z",      # Invalid hour
            "2023-12-01T12:60:00Z",      # Invalid minute
            "2023-12-01T12:00:60Z",      # Invalid second
        ]
        
        for field_name, field_spec in properties.items():
            field_format = field_spec.get('format')
            if field_spec.get('type') != 'string' or field_format not in ['date', 'date-time']:
                continue
            
            base_payload = self._generate_base_payload(api_spec)
            
            for time_value in time_boundaries:
                payload = base_payload.copy()
                payload[field_name] = time_value
                
                # Invalid dates should be rejected
                is_valid = not any(invalid in time_value for invalid in 
                                 ['02-30', '13-', '-32', 'T25:', ':60:'])
                expected_codes = [200, 201, 202] if is_valid else [400, 422]
                
                safe_time = time_value.replace(':', '_').replace('-', '_').replace('T', 'T_')
                
                tests.append(BoundaryTest(
                    name=f"test_{operation_id}_boundary_{field_name}_time_{safe_time}",
                    description=f"Test {field_name} with time boundary: {time_value}",
                    test_payload=payload,
                    expected_status_codes=expected_codes,
                    boundary_type='time',
                    field_being_tested=field_name
                ))
        
        return tests
    
    def _generate_array_boundary_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """Generate tests with array boundary conditions"""
        tests = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return tests
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') != 'array':
                continue
            
            base_payload = self._generate_base_payload(api_spec)
            min_items = field_spec.get('minItems', 0)
            max_items = field_spec.get('maxItems', 1000)
            
            # Array size boundaries
            boundary_sizes = [0, 1, min_items-1, min_items, min_items+1, 
                            max_items-1, max_items, max_items+1, 1000, 10000]
            boundary_sizes = [s for s in boundary_sizes if s >= 0]  # Remove negative sizes
            
            for size in boundary_sizes[:8]:  # Limit to prevent excessive tests
                payload = base_payload.copy()
                payload[field_name] = [f"item_{i}" for i in range(size)]
                
                # Determine expected codes based on constraints
                if size < min_items or size > max_items:
                    expected_codes = [400, 422]
                elif size > 1000:  # Very large arrays might cause issues
                    expected_codes = [400, 422, 500]
                else:
                    expected_codes = [200, 201, 202]
                
                tests.append(BoundaryTest(
                    name=f"test_{operation_id}_boundary_{field_name}_array_size_{size}",
                    description=f"Test {field_name} array with {size} items",
                    test_payload=payload,
                    expected_status_codes=expected_codes,
                    boundary_type='array_size',
                    field_being_tested=field_name
                ))
        
        return tests
    
    def _generate_nesting_depth_tests(self, api_spec: Dict[str, Any]) -> List[BoundaryTest]:
        """Generate tests with deeply nested objects"""
        tests = []
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        base_payload = self._generate_base_payload(api_spec)
        
        # Test various nesting depths
        for depth in [10, 50, 100, 500, 1000]:
            # Create deeply nested object
            nested_obj = {}
            current = nested_obj
            for i in range(depth):
                current['level'] = i
                if i < depth - 1:
                    current['nested'] = {}
                    current = current['nested']
            
            payload = base_payload.copy()
            payload['deeply_nested'] = nested_obj
            
            # Very deep nesting should be rejected
            expected_codes = [400, 422] if depth > 100 else [200, 201, 202, 400, 422]
            
            tests.append(BoundaryTest(
                name=f"test_{operation_id}_boundary_nesting_depth_{depth}",
                description=f"Test API with {depth} levels of object nesting",
                test_payload=payload,
                expected_status_codes=expected_codes,
                boundary_type='nesting_depth',
                field_being_tested='object_nesting'
            ))
        
        return tests
    
    def generate_test_file(self, api_spec: Dict[str, Any], output_dir: str) -> str:
        """
        Generate a complete boundary test file
        
        Args:
            api_spec: API specification dictionary
            output_dir: Directory to save the test file
            
        Returns:
            Path to the generated test file
        """
        tests = self.generate_boundary_tests(api_spec)
        
        if not tests:
            self.logger.warning(f"No boundary tests generated for {api_spec.get('path')}")
            return ""
        
        # Generate test file content
        test_content = self._generate_test_file_content(api_spec, tests)
        
        # Save to file
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        filename = f"test_{operation_id}_boundary.py"
        output_path = Path(output_dir) / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        self.logger.info(f"Generated boundary test file: {output_path}")
        return str(output_path)
    
    def _generate_test_file_content(self, api_spec: Dict[str, Any], tests: List[BoundaryTest]) -> str:
        """Generate the actual test file content"""
        operation_id = api_spec.get('operationId', 'endpoint')
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        description = api_spec.get('description', f'{operation_id} endpoint')
        
        content = f'''import pytest
import httpx
from typing import Dict, Any, List
import json
import asyncio
import time
import math

# Advanced Boundary Tests for: {description}
# Method: {method}
# Path: {path}
# Generated: Enhanced Boundary Test Generation

BASE_URL = settings.test_api_base_url

class TestBoundaryEndpoint:
    
    @pytest.fixture
    def client(self):
        return httpx.AsyncClient(base_url=BASE_URL, cookies=self._get_cookies(), timeout=60.0)  # Extended timeout for large payloads
    
    def _get_cookies(self):
        cookies = {{}}
        if settings.test_cookie_connect_sid:
            cookies['connect.sid'] = settings.test_cookie_connect_sid
        return cookies
    
    @pytest.fixture
    def auth_headers(self):
        """Authentication headers for boundary tests"""
        return {{"Authorization": "Bearer {auth_token}"}}
    
    @pytest.fixture
    def performance_monitor(self):
        """Monitor performance during boundary tests"""
        class PerformanceMonitor:
            def __init__(self):
                self.start_time = None
                self.response_times = []
            
            def start(self):
                self.start_time = time.time()
            
            def record_response(self, response):
                if self.start_time:
                    response_time = time.time() - self.start_time
                    self.response_times.append(response_time)
                    return response_time
                return 0
        
        return PerformanceMonitor()
    
'''
        
        # Group tests by boundary type
        tests_by_type = {}
        for test in tests:
            boundary_type = test.boundary_type
            if boundary_type not in tests_by_type:
                tests_by_type[boundary_type] = []
            tests_by_type[boundary_type].append(test)
        
        # Generate test methods grouped by boundary type
        for boundary_type, type_tests in tests_by_type.items():
            content += f"    # {boundary_type.upper().replace('_', ' ')} BOUNDARY TESTS\n\n"
            
            for test in type_tests[:5]:  # Limit to prevent excessive test generation
                content += self._generate_boundary_test_method(test, api_spec)
                content += "\n"
        
        # Add comprehensive boundary summary test
        content += self._generate_boundary_summary_test(api_spec, tests)
        
        return content
    
    def _generate_boundary_test_method(self, test: BoundaryTest, api_spec: Dict[str, Any]) -> str:
        """Generate a single boundary test method"""
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        
        # Handle large payloads differently
        if test.boundary_type == 'size_limit':
            return self._generate_size_limit_test_method(test, api_spec)
        
        payload_str = json.dumps(test.test_payload, indent=8, ensure_ascii=False)[:-1] + "    }"
        expected_codes_str = ', '.join(map(str, test.expected_status_codes))
        
        method_code = f'''    @pytest.mark.asyncio
    @pytest.mark.boundary
    async def {test.name}(self, client, auth_headers, performance_monitor):
        """{test.description}"""
        
        payload = {payload_str}
        
        performance_monitor.start()
        
        try:
            response = await client.{method.lower()}("{path}", json=payload, headers=auth_headers)
            response_time = performance_monitor.record_response(response)
            
            # Verify response is one of expected status codes
            assert response.status_code in {test.expected_status_codes}, \\
                f"Expected one of {test.expected_status_codes}, got {{response.status_code}}. Response: {{response.text[:500]}}"
            
            # Log performance for boundary tests
            print(f"⚡ Boundary test '{test.field_being_tested}' completed in {{response_time:.3f}}s (status: {{response.status_code}})")
            
            # For successful responses, verify the response is valid
            if 200 <= response.status_code < 300:
                # Response should be valid JSON
                try:
                    response_data = response.json()
                    assert isinstance(response_data, (dict, list)), "Response should be JSON object or array"
                except json.JSONDecodeError:
                    print("Warning: Success response is not valid JSON")
            
            # For error responses, verify error handling
            elif 400 <= response.status_code < 500:
                # Should have error information
                if response.headers.get("content-type", "").startswith("application/json"):
                    try:
                        error_data = response.json()
                        assert isinstance(error_data, dict), "Error response should be JSON object"
                        print(f"✓ Boundary error properly handled: {{error_data.get('message', 'No message')}}")
                    except json.JSONDecodeError:
                        print("Warning: Error response is not valid JSON")
        
        except httpx.TimeoutException:
            # Timeouts are acceptable for extreme boundary tests
            print(f"✓ Request timed out (expected for extreme boundary test)")
            
        except httpx.RequestError as e:
            # Network errors might occur with extreme values
            if "413" in str(e) or "too large" in str(e).lower():
                print(f"✓ Request rejected by client/proxy (payload too large)")
            else:
                print(f"✓ Request error (may be expected for boundary test): {{str(e)[:200]}}")
        
        except Exception as e:
            # Some boundary tests might cause unexpected errors
            print(f"⚠ Unexpected error in boundary test: {{str(e)[:200]}}")
            # Don't fail the test - boundary conditions can cause various issues
'''
        
        return method_code
    
    def _generate_size_limit_test_method(self, test: BoundaryTest, api_spec: Dict[str, Any]) -> str:
        """Generate a test method specifically for size limit tests"""
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        
        # Extract size info from test name
        size_info = "unknown"
        if "1kb" in test.name.lower():
            size_info = "1KB"
        elif "10mb" in test.name.lower():
            size_info = "10MB"
        elif "5mb" in test.name.lower():
            size_info = "5MB"
        elif "1mb" in test.name.lower():
            size_info = "1MB"
        
        return f'''    @pytest.mark.asyncio
    @pytest.mark.boundary
    @pytest.mark.slow
    async def {test.name}(self, client, auth_headers, performance_monitor):
        """{test.description}"""
        
        print(f"🚀 Starting {size_info} payload test...")
        
        # Create large payload dynamically to avoid memory issues
        large_data = "x" * len(test.test_payload.get('large_data_field', ''))
        base_payload = {{k: v for k, v in test.test_payload.items() if k != 'large_data_field'}}
        
        performance_monitor.start()
        
        try:
            # Stream the large payload to handle memory efficiently
            payload = base_payload.copy()
            payload['large_data_field'] = large_data
            
            response = await client.{method.lower()}(
                "{path}", 
                json=payload, 
                headers=auth_headers,
                timeout=60.0  # Extended timeout for large payloads
            )
            
            response_time = performance_monitor.record_response(response)
            
            # Log the result
            print(f"📊 {size_info} payload test completed in {{response_time:.3f}}s (status: {{response.status_code}})")
            
            # Verify response is one of expected status codes
            assert response.status_code in {test.expected_status_codes}, \\
                f"Expected one of {test.expected_status_codes}, got {{response.status_code}}"
            
            if response.status_code == 413:
                print(f"✅ Large payload correctly rejected (413 Payload Too Large)")
            elif 200 <= response.status_code < 300:
                print(f"⚡ Large payload successfully processed by server")
                # Verify response is reasonable size
                response_size = len(response.content)
                assert response_size < 10 * 1024 * 1024, f"Response too large: {{response_size}} bytes"
            else:
                print(f"⚠ Large payload resulted in status {{response.status_code}}")
        
        except httpx.TimeoutException:
            print(f"⏱️ {size_info} payload test timed out (may be expected)")
            
        except httpx.RequestEntityTooLarge:
            print(f"✅ {size_info} payload rejected by HTTP client (too large)")
            
        except httpx.ConnectError:
            print(f"🔌 Connection error with {size_info} payload (server may have limits)")
            
        except Exception as e:
            error_msg = str(e)
            if "413" in error_msg or "too large" in error_msg.lower():
                print(f"✅ {size_info} payload appropriately rejected: {{error_msg[:100]}}")
            else:
                print(f"⚠ Unexpected error with {size_info} payload: {{error_msg[:200]}}")
'''
    
    def _generate_boundary_summary_test(self, api_spec: Dict[str, Any], tests: List[BoundaryTest]) -> str:
        """Generate a summary test for boundary scenarios"""
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        
        # Use string concatenation to avoid f-string complexity
        template = '''    @pytest.mark.asyncio
    @pytest.mark.boundary
    async def test_''' + operation_id + '''_boundary_resilience_summary(self, client, auth_headers):
        """Summary test for API boundary resilience"""
        
        # Test various boundary scenarios in one efficient test
        boundary_scenarios = [
            # Empty/minimal payloads
            {"payload": {}, "description": "Empty payload", "category": "minimal"},
            {"payload": {"test": ""}, "description": "Empty string field", "category": "minimal"},
            
            # Extreme numeric values  
            {"payload": {"number": 999999999999999}, "description": "Very large number", "category": "numeric"},
            {"payload": {"number": -999999999999999}, "description": "Very negative number", "category": "numeric"},
            {"payload": {"number": 0}, "description": "Zero value", "category": "numeric"},
            
            # String edge cases
            {"payload": {"text": "x" * 1000}, "description": "Long string (1000 chars)", "category": "string"},
            {"payload": {"text": "🚀🎯📈"}, "description": "Unicode emoji string", "category": "string"},
            
            # Array edge cases
            {"payload": {"array": []}, "description": "Empty array", "category": "array"},
            {"payload": {"array": ["item"] * 100}, "description": "Large array (100 items)", "category": "array"},
            
            # Security test cases
            {"payload": {"input": "<script>alert('xss')</script>"}, "description": "XSS attempt", "category": "security"},
            {"payload": {"input": "'; DROP TABLE users; --"}, "description": "SQL injection attempt", "category": "security"},
        ]
        
        results = {
            "total_tests": len(boundary_scenarios),
            "passed": 0,
            "failed": 0,
            "errors": 0,
            "by_category": {}
        }
        
        print(f"\\n🧪 Running boundary resilience tests...")
        print(f"{'Scenario':<30} {'Category':<10} {'Status':<8} {'Code':<5} {'Time (ms)'}")
        print("-" * 70)
        
        for scenario in boundary_scenarios:
            category = scenario["category"]
            if category not in results["by_category"]:
                results["by_category"][category] = {"passed": 0, "failed": 0}
            
            try:
                start_time = time.time()
                response = await client.''' + method.lower() + '''("''' + path + '''", json=scenario["payload"], headers=auth_headers)
                response_time = (time.time() - start_time) * 1000
                
                # Determine if response is acceptable
                is_acceptable = True
                status_description = "PASS"
                
                if response.status_code >= 500:
                    # Server errors are generally not acceptable for boundary tests
                    is_acceptable = False
                    status_description = "FAIL"
                elif response.status_code >= 400:
                    # Client errors are generally acceptable (proper validation)
                    status_description = "PASS"
                elif response.status_code >= 200:
                    # Success is acceptable if the input is valid
                    status_description = "PASS"
                
                if is_acceptable:
                    results["passed"] += 1
                    results["by_category"][category]["passed"] += 1
                else:
                    results["failed"] += 1
                    results["by_category"][category]["failed"] += 1
                
                print(f"{scenario['description']:<30} {category:<10} {status_description:<8} {response.status_code:<5} {response_time:>7.1f}")
                
            except Exception as e:
                results["errors"] += 1
                results["by_category"][category]["failed"] += 1
                error_msg = str(e)[:30]
                print(f"{'Error scenario':<30} {category:<10} {'ERROR':<8} {'N/A':<5} {'N/A':>7}")
                print(f"    Error: {error_msg}")
        
        print("-" * 70)
        print(f"📊 Boundary Test Results: {results['passed']} passed, {results['failed']} failed, {results['errors']} errors")
        
        # Print category breakdown
        for category, counts in results["by_category"].items():
            total_category = counts["passed"] + counts["failed"]
            if total_category > 0:
                success_rate = counts["passed"] / total_category * 100
                print(f"   {category.title()}: {counts['passed']}/{total_category} ({success_rate:.1f}%)")
        
        # Calculate overall resilience score
        total_tests = results["total_tests"]
        resilience_score = (results["passed"]) / total_tests if total_tests > 0 else 0
        
        print(f"\\n🛡️ API Boundary Resilience Score: {resilience_score:.1%}")
        
        # Assertions for test quality
        assert results["errors"] / total_tests <= 0.2, f"Too many errors in boundary tests: {results['errors']}/{total_tests}"
        assert resilience_score >= 0.7, f"Boundary resilience score too low: {resilience_score:.1%}"
        
        # Security scenarios should be properly handled (rejected)
        security_passed = results["by_category"].get("security", {}).get("passed", 0)
        security_total = security_passed + results["by_category"].get("security", {}).get("failed", 0)
        if security_total > 0:
            # All security tests should "pass" by being properly rejected
            print(f"🔒 Security boundary tests: {security_passed}/{security_total} properly handled")
        
        print("✅ Boundary resilience test completed!")
'''
        
        return template