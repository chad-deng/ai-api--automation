"""
Enhanced Input Validation Test Generator

Generates comprehensive input validation tests covering all schema constraints,
edge cases, boundary values, and data format validation.
"""

import json
from src.config.settings import Settings
import re
from typing import Dict, Any, List, Optional, Union, Set
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime, date
import structlog

logger = structlog.get_logger()

@dataclass
class ValidationTest:
    """Represents a specific validation test case"""
    name: str
    description: str
    test_payload: Dict[str, Any]
    expected_status_code: int
    field_being_tested: str
    validation_type: str  # 'required', 'type', 'format', 'length', 'range', 'pattern', 'enum'
    expected_error_message: Optional[str] = None

class ValidationTestGenerator:
    """
    Generates comprehensive input validation tests based on JSON Schema
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def generate_validation_tests(self, api_spec: Dict[str, Any]) -> List[ValidationTest]:
        """
        Generate all validation test scenarios for an API endpoint
        
        Args:
            api_spec: API specification dictionary
            
        Returns:
            List of ValidationTest objects
        """
        tests = []
        
        request_body = api_spec.get('request_body', {})
        if not request_body:
            self.logger.info(f"No request body schema found for {api_spec.get('path')}")
            return tests
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        if not schema:
            self.logger.info(f"No JSON schema found for {api_spec.get('path')}")
            return tests
        
        # Generate tests for required fields
        tests.extend(self._generate_required_field_tests(api_spec, schema))
        
        # Generate tests for field types
        tests.extend(self._generate_type_validation_tests(api_spec, schema))
        
        # Generate tests for string constraints
        tests.extend(self._generate_string_validation_tests(api_spec, schema))
        
        # Generate tests for numeric constraints
        tests.extend(self._generate_numeric_validation_tests(api_spec, schema))
        
        # Generate tests for format validation
        tests.extend(self._generate_format_validation_tests(api_spec, schema))
        
        # Generate tests for pattern validation
        tests.extend(self._generate_pattern_validation_tests(api_spec, schema))
        
        # Generate tests for enum validation
        tests.extend(self._generate_enum_validation_tests(api_spec, schema))
        
        # Generate tests for array validation
        tests.extend(self._generate_array_validation_tests(api_spec, schema))
        
        # Generate tests for object validation
        tests.extend(self._generate_object_validation_tests(api_spec, schema))
        
        # Generate tests for additional properties
        tests.extend(self._generate_additional_properties_tests(api_spec, schema))
        
        self.logger.info(f"Generated {len(tests)} validation tests for {api_spec.get('path')}")
        return tests
    
    def _generate_base_payload(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a valid base payload from schema"""
        properties = schema.get('properties', {})
        required = schema.get('required', [])
        
        payload = {}
        for field_name, field_spec in properties.items():
            if field_name in required:
                payload[field_name] = self._generate_valid_value(field_spec)
        
        return payload
    
    def _generate_valid_value(self, field_spec: Dict[str, Any]) -> Any:
        """Generate a valid value for a field specification"""
        field_type = field_spec.get('type', 'string')
        field_format = field_spec.get('format')
        
        if field_type == 'string':
            if field_format == 'email':
                return 'test@example.com'
            elif field_format == 'date':
                return '2023-12-01'
            elif field_format == 'date-time':
                return '2023-12-01T10:00:00Z'
            elif field_format == 'uri':
                return 'https://example.com'
            elif field_format == 'uuid':
                return '12345678-1234-5678-9012-123456789012'
            else:
                min_length = field_spec.get('minLength', 1)
                return 'test_' + 'x' * max(0, min_length - 5)
        
        elif field_type == 'integer':
            minimum = field_spec.get('minimum', 1)
            maximum = field_spec.get('maximum', 100)
            return max(minimum, min(maximum, 42))
        
        elif field_type == 'number':
            minimum = field_spec.get('minimum', 1.0)
            maximum = field_spec.get('maximum', 100.0)
            return max(minimum, min(maximum, 42.0))
        
        elif field_type == 'boolean':
            return True
        
        elif field_type == 'array':
            items_spec = field_spec.get('items', {'type': 'string'})
            min_items = field_spec.get('minItems', 1)
            return [self._generate_valid_value(items_spec) for _ in range(min_items)]
        
        elif field_type == 'object':
            return {'nested': 'value'}
        
        # Handle enum
        if 'enum' in field_spec:
            return field_spec['enum'][0]
        
        return 'test_value'
    
    def _generate_required_field_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for required field validation"""
        tests = []
        required_fields = schema.get('required', [])
        
        if not required_fields:
            return tests
        
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        # Test missing each required field individually
        for field in required_fields:
            base_payload = self._generate_base_payload(schema)
            
            # Remove the required field
            if field in base_payload:
                del base_payload[field]
            
            tests.append(ValidationTest(
                name=f"test_{operation_id}_validation_missing_{field}",
                description=f"Test validation when required field '{field}' is missing",
                test_payload=base_payload,
                expected_status_code=400,
                field_being_tested=field,
                validation_type='required',
                expected_error_message=f"Field '{field}' is required"
            ))
        
        # Test completely empty payload
        if required_fields:
            tests.append(ValidationTest(
                name=f"test_{operation_id}_validation_empty_payload",
                description="Test validation with completely empty payload",
                test_payload={},
                expected_status_code=400,
                field_being_tested='*',
                validation_type='required',
                expected_error_message="Required fields missing"
            ))
        
        # Test null values for required fields
        for field in required_fields:
            base_payload = self._generate_base_payload(schema)
            base_payload[field] = None
            
            tests.append(ValidationTest(
                name=f"test_{operation_id}_validation_null_{field}",
                description=f"Test validation when required field '{field}' is null",
                test_payload=base_payload,
                expected_status_code=400,
                field_being_tested=field,
                validation_type='required',
                expected_error_message=f"Field '{field}' cannot be null"
            ))
        
        return tests
    
    def _generate_type_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for type validation"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        type_invalid_values = {
            'string': [123, True, [], {}],
            'integer': ['not_a_number', 3.14, True, [], {}],
            'number': ['not_a_number', True, [], {}],
            'boolean': ['not_a_boolean', 123, [], {}],
            'array': ['not_an_array', 123, True, {}],
            'object': ['not_an_object', 123, True, []]
        }
        
        for field_name, field_spec in properties.items():
            field_type = field_spec.get('type')
            if not field_type:
                continue
            
            invalid_values = type_invalid_values.get(field_type, [])
            
            for invalid_value in invalid_values:
                base_payload = self._generate_base_payload(schema)
                base_payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_invalid_type_{type(invalid_value).__name__}",
                    description=f"Test validation when '{field_name}' has invalid type {type(invalid_value).__name__}",
                    test_payload=base_payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='type',
                    expected_error_message=f"Field '{field_name}' must be of type {field_type}"
                ))
        
        return tests
    
    def _generate_string_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for string constraints"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') != 'string':
                continue
            
            base_payload = self._generate_base_payload(schema)
            
            # Test minLength constraint
            min_length = field_spec.get('minLength')
            if min_length is not None and min_length > 0:
                short_value = 'x' * max(0, min_length - 1)
                payload = base_payload.copy()
                payload[field_name] = short_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_too_short",
                    description=f"Test validation when '{field_name}' is too short (min: {min_length})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='length',
                    expected_error_message=f"Field '{field_name}' must be at least {min_length} characters"
                ))
            
            # Test maxLength constraint
            max_length = field_spec.get('maxLength')
            if max_length is not None:
                long_value = 'x' * (max_length + 1)
                payload = base_payload.copy()
                payload[field_name] = long_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_too_long",
                    description=f"Test validation when '{field_name}' is too long (max: {max_length})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='length',
                    expected_error_message=f"Field '{field_name}' must be at most {max_length} characters"
                ))
            
            # Test empty string (if not allowed)
            if min_length and min_length > 0:
                payload = base_payload.copy()
                payload[field_name] = ''
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_empty_string",
                    description=f"Test validation when '{field_name}' is empty string",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='length',
                    expected_error_message=f"Field '{field_name}' cannot be empty"
                ))
        
        return tests
    
    def _generate_numeric_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for numeric constraints"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            field_type = field_spec.get('type')
            if field_type not in ['integer', 'number']:
                continue
            
            base_payload = self._generate_base_payload(schema)
            
            # Test minimum constraint
            minimum = field_spec.get('minimum')
            if minimum is not None:
                invalid_value = minimum - 1
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_below_minimum",
                    description=f"Test validation when '{field_name}' is below minimum ({minimum})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='range',
                    expected_error_message=f"Field '{field_name}' must be at least {minimum}"
                ))
            
            # Test maximum constraint
            maximum = field_spec.get('maximum')
            if maximum is not None:
                invalid_value = maximum + 1
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_above_maximum",
                    description=f"Test validation when '{field_name}' is above maximum ({maximum})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='range',
                    expected_error_message=f"Field '{field_name}' must be at most {maximum}"
                ))
            
            # Test exclusiveMinimum
            exclusive_min = field_spec.get('exclusiveMinimum')
            if exclusive_min is not None:
                invalid_value = exclusive_min
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_equal_exclusive_minimum",
                    description=f"Test validation when '{field_name}' equals exclusive minimum ({exclusive_min})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='range',
                    expected_error_message=f"Field '{field_name}' must be greater than {exclusive_min}"
                ))
            
            # Test exclusiveMaximum
            exclusive_max = field_spec.get('exclusiveMaximum')
            if exclusive_max is not None:
                invalid_value = exclusive_max
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_equal_exclusive_maximum",
                    description=f"Test validation when '{field_name}' equals exclusive maximum ({exclusive_max})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='range',
                    expected_error_message=f"Field '{field_name}' must be less than {exclusive_max}"
                ))
            
            # Test multipleOf constraint
            multiple_of = field_spec.get('multipleOf')
            if multiple_of is not None:
                invalid_value = multiple_of * 2.5 if field_type == 'number' else multiple_of * 2 + 1
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_not_multiple_of_{multiple_of}",
                    description=f"Test validation when '{field_name}' is not a multiple of {multiple_of}",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='range',
                    expected_error_message=f"Field '{field_name}' must be a multiple of {multiple_of}"
                ))
        
        return tests
    
    def _generate_format_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for format validation"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        format_invalid_values = {
            'email': ['invalid-email', 'test@', '@example.com', 'test.example.com', 'test@.com'],
            'date': ['invalid-date', '2023-13-01', '2023-02-30', '23-12-01', '2023/12/01'],
            'date-time': ['invalid-datetime', '2023-12-01', '2023-12-01T25:00:00Z', '2023-12-01T12:60:00Z'],
            'uri': ['invalid-uri', 'not a url', 'ftp://', 'http://'],
            'uuid': ['invalid-uuid', '12345', 'not-a-uuid-format', '12345678-1234-1234-1234']
        }
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') != 'string':
                continue
            
            field_format = field_spec.get('format')
            if not field_format or field_format not in format_invalid_values:
                continue
            
            base_payload = self._generate_base_payload(schema)
            invalid_values = format_invalid_values[field_format]
            
            for invalid_value in invalid_values:
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_invalid_{field_format}_{invalid_value.replace('/', '_').replace(':', '_').replace('@', '_at_')[:20]}",
                    description=f"Test validation when '{field_name}' has invalid {field_format} format",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='format',
                    expected_error_message=f"Field '{field_name}' must be a valid {field_format}"
                ))
        
        return tests
    
    def _generate_pattern_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for regex pattern validation"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        # Common patterns and their invalid examples
        pattern_invalid_examples = {
            r'^[a-zA-Z]+$': ['123', 'test123', 'test-name', 'test_name', ''],
            r'^[0-9]+$': ['abc', '123abc', 'test', ''],
            r'^[a-zA-Z0-9]+$': ['test-name', 'test_name', 'test@name', ''],
            r'^[a-zA-Z0-9_-]+$': ['test@name', 'test name', 'test.name', ''],
            r'^\d{4}-\d{2}-\d{2}$': ['2023/12/01', '12-01-2023', '2023-1-1', 'invalid'],
        }
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') != 'string':
                continue
            
            pattern = field_spec.get('pattern')
            if not pattern:
                continue
            
            base_payload = self._generate_base_payload(schema)
            
            # Use predefined invalid examples if available
            invalid_values = pattern_invalid_examples.get(pattern, [])
            
            # Generate some generic invalid examples
            if not invalid_values:
                invalid_values = [
                    'invalid',
                    '123!@#',
                    'test spaces',
                    'UPPERCASE',
                    'lowercase',
                    'Mixed123',
                    'special@#$',
                    ''
                ]
            
            # Test each invalid value
            for invalid_value in invalid_values[:3]:  # Limit to 3 examples per pattern
                # Verify it actually doesn't match the pattern
                try:
                    if re.match(pattern, invalid_value):
                        continue  # Skip if it actually matches
                except re.error:
                    continue  # Skip if pattern is invalid
                
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_pattern_mismatch_{invalid_value.replace(' ', '_').replace('@', '_at_').replace('#', '_hash_')[:15]}",
                    description=f"Test validation when '{field_name}' doesn't match required pattern",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='pattern',
                    expected_error_message=f"Field '{field_name}' must match the required pattern"
                ))
        
        return tests
    
    def _generate_enum_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for enum validation"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            enum_values = field_spec.get('enum')
            if not enum_values:
                continue
            
            base_payload = self._generate_base_payload(schema)
            
            # Test invalid enum values
            invalid_enum_values = [
                'invalid_enum_value',
                'NOT_IN_ENUM',
                'wrong_choice',
                123,  # Wrong type
                None  # Null value
            ]
            
            for invalid_value in invalid_enum_values:
                # Skip if the invalid value is actually in the enum
                if invalid_value in enum_values:
                    continue
                
                payload = base_payload.copy()
                payload[field_name] = invalid_value
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_invalid_enum_{str(invalid_value).replace(' ', '_')[:20]}",
                    description=f"Test validation when '{field_name}' has invalid enum value",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='enum',
                    expected_error_message=f"Field '{field_name}' must be one of: {', '.join(map(str, enum_values))}"
                ))
        
        return tests
    
    def _generate_array_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for array validation"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') != 'array':
                continue
            
            base_payload = self._generate_base_payload(schema)
            
            # Test minItems constraint
            min_items = field_spec.get('minItems')
            if min_items is not None and min_items > 0:
                short_array = ['item'] * max(0, min_items - 1)
                payload = base_payload.copy()
                payload[field_name] = short_array
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_too_few_items",
                    description=f"Test validation when '{field_name}' has too few items (min: {min_items})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='length',
                    expected_error_message=f"Field '{field_name}' must have at least {min_items} items"
                ))
            
            # Test maxItems constraint
            max_items = field_spec.get('maxItems')
            if max_items is not None:
                long_array = ['item'] * (max_items + 1)
                payload = base_payload.copy()
                payload[field_name] = long_array
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_too_many_items",
                    description=f"Test validation when '{field_name}' has too many items (max: {max_items})",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='length',
                    expected_error_message=f"Field '{field_name}' must have at most {max_items} items"
                ))
            
            # Test uniqueItems constraint
            if field_spec.get('uniqueItems', False):
                duplicate_array = ['item1', 'item2', 'item1']  # Has duplicate
                payload = base_payload.copy()
                payload[field_name] = duplicate_array
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_duplicate_items",
                    description=f"Test validation when '{field_name}' has duplicate items",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='uniqueness',
                    expected_error_message=f"Field '{field_name}' must have unique items"
                ))
            
            # Test items validation
            items_spec = field_spec.get('items')
            if items_spec and isinstance(items_spec, dict):
                # Test invalid item types
                item_type = items_spec.get('type', 'string')
                
                if item_type == 'string':
                    invalid_array = ['valid', 123, 'also_valid']  # Has invalid number
                elif item_type == 'integer':
                    invalid_array = [1, 'invalid', 3]  # Has invalid string
                else:
                    invalid_array = ['mixed', 123, True]  # Mixed types
                
                payload = base_payload.copy()
                payload[field_name] = invalid_array
                
                tests.append(ValidationTest(
                    name=f"test_{operation_id}_validation_{field_name}_invalid_item_types",
                    description=f"Test validation when '{field_name}' contains invalid item types",
                    test_payload=payload,
                    expected_status_code=400,
                    field_being_tested=field_name,
                    validation_type='type',
                    expected_error_message=f"Field '{field_name}' items must be of type {item_type}"
                ))
        
        return tests
    
    def _generate_object_validation_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for nested object validation"""
        tests = []
        properties = schema.get('properties', {})
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        for field_name, field_spec in properties.items():
            if field_spec.get('type') != 'object':
                continue
            
            base_payload = self._generate_base_payload(schema)
            
            # Test required properties in nested object
            nested_properties = field_spec.get('properties', {})
            nested_required = field_spec.get('required', [])
            
            if nested_required:
                # Missing required nested property
                valid_nested = {prop: 'value' for prop in nested_properties.keys()}
                for required_prop in nested_required:
                    if required_prop in valid_nested:
                        del valid_nested[required_prop]
                    
                    payload = base_payload.copy()
                    payload[field_name] = valid_nested
                    
                    tests.append(ValidationTest(
                        name=f"test_{operation_id}_validation_{field_name}_missing_{required_prop}",
                        description=f"Test validation when nested object '{field_name}' is missing required property '{required_prop}'",
                        test_payload=payload,
                        expected_status_code=400,
                        field_being_tested=f"{field_name}.{required_prop}",
                        validation_type='required',
                        expected_error_message=f"Property '{required_prop}' is required in '{field_name}'"
                    ))
                    
                    # Restore the property for next iteration
                    valid_nested[required_prop] = 'value'
        
        return tests
    
    def _generate_additional_properties_tests(self, api_spec: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationTest]:
        """Generate tests for additionalProperties validation"""
        tests = []
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        # Test additionalProperties: false
        if schema.get('additionalProperties') is False:
            base_payload = self._generate_base_payload(schema)
            properties = schema.get('properties', {})
            
            # Add a property not defined in schema
            forbidden_properties = [
                'extra_field',
                'unknown_property',
                'additional_data',
                'not_allowed'
            ]
            
            for forbidden_prop in forbidden_properties:
                if forbidden_prop not in properties:  # Make sure it's actually not allowed
                    payload = base_payload.copy()
                    payload[forbidden_prop] = 'not_allowed_value'
                    
                    tests.append(ValidationTest(
                        name=f"test_{operation_id}_validation_additional_property_{forbidden_prop}",
                        description=f"Test validation when additional property '{forbidden_prop}' is provided",
                        test_payload=payload,
                        expected_status_code=400,
                        field_being_tested=forbidden_prop,
                        validation_type='additional_properties',
                        expected_error_message=f"Additional property '{forbidden_prop}' is not allowed"
                    ))
                    break  # Only test one additional property
        
        return tests
    
    def generate_test_file(self, api_spec: Dict[str, Any], output_dir: str) -> str:
        """
        Generate a complete validation test file
        
        Args:
            api_spec: API specification dictionary
            output_dir: Directory to save the test file
            
        Returns:
            Path to the generated test file
        """
        tests = self.generate_validation_tests(api_spec)
        
        if not tests:
            self.logger.warning(f"No validation tests generated for {api_spec.get('path')}")
            return ""
        
        # Generate test file content
        test_content = self._generate_test_file_content(api_spec, tests)
        
        # Save to file
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        filename = f"test_{operation_id}_validation.py"
        output_path = Path(output_dir) / filename
        
        with open(output_path, 'w') as f:
            f.write(test_content)
        
        self.logger.info(f"Generated validation test file: {output_path}")
        return str(output_path)
    
    def _generate_test_file_content(self, api_spec: Dict[str, Any], tests: List[ValidationTest]) -> str:
        """Generate the actual test file content"""
        operation_id = api_spec.get('operationId', 'endpoint')
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        description = api_spec.get('description', f'{operation_id} endpoint')
        
        content = f'''import pytest
import httpx
from typing import Dict, Any, List
import json

# Enhanced Input Validation Tests for: {description}
# Method: {method}
# Path: {path}
# Generated: Week 3 Enhanced Validation Test Generation

BASE_URL = settings.test_api_base_url

class TestValidationEndpoint:
    
    @pytest.fixture
    def client(self):
        return httpx.AsyncClient(base_url=BASE_URL, cookies=self._get_cookies(), timeout=30.0)
    
    def _get_cookies(self):
        cookies = {{}}
        if settings.test_cookie_connect_sid:
            cookies['connect.sid'] = settings.test_cookie_connect_sid
        return cookies
    
    @pytest.fixture
    def auth_headers(self):
        \"\"\"Authentication headers for validation tests\"\"\"
        return {{"Authorization": "Bearer <auth_token>"}}
    
'''
        
        # Group tests by validation type
        tests_by_type = {}
        for test in tests:
            validation_type = test.validation_type
            if validation_type not in tests_by_type:
                tests_by_type[validation_type] = []
            tests_by_type[validation_type].append(test)
        
        # Generate test methods grouped by validation type
        for validation_type, type_tests in tests_by_type.items():
            content += f"    # {validation_type.upper()} VALIDATION TESTS\\n\\n"
            
            for test in type_tests:
                content += self._generate_validation_test_method(test, api_spec)
                content += "\n"
        
        # Add comprehensive validation summary test
        content += self._generate_validation_summary_test(api_spec, tests)
        
        return content
    
    def _generate_validation_test_method(self, test: ValidationTest, api_spec: Dict[str, Any]) -> str:
        """Generate a single validation test method"""
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        
        payload_str = json.dumps(test.test_payload, indent=8)[:-1] + "    }" if test.test_payload else "{}"
        
        method_code = f"""    @pytest.mark.asyncio
    @pytest.mark.validation
    async def {test.name}(self, client, auth_headers):
        \"\"\"{test.description}\"\"\"
        
        payload = {payload_str}
        
        response = await client.{method.lower()}("{path}", json=payload, headers=auth_headers)
        
        # Verify validation error response
        assert response.status_code == {test.expected_status_code}, \\
            f"Expected {test.expected_status_code}, got " + "{response.status_code}. Response: {response.text}"
        
        # Verify response is JSON (most validation errors return JSON)
        content_type = response.headers.get("content-type", "")
        if "json" in content_type.lower():
            try:
                error_data = response.json()
                assert isinstance(error_data, dict), "Validation error response should be a JSON object"
                
                # Check for common error fields
                error_fields = ["error", "message", "errors", "detail", "details"]
                has_error_info = any(field in error_data for field in error_fields)
                assert has_error_info, f"Error response should contain error information. Got: " + "{error_data}"
                
"""
        
        # Add specific validation for expected error message if provided
        if test.expected_error_message:
            method_code += f"""                # Check if expected error message is present (case-insensitive)
                response_text = response.text.lower()
                expected_keywords = ["{test.field_being_tested.lower()}", "{test.validation_type.lower()}"]
                
                # At least one keyword should be present in the error response
                has_relevant_error = any(keyword in response_text for keyword in expected_keywords)
                if not has_relevant_error:
                    print(f"Warning: Error message might not be specific enough. Response: " + "{response.text}")
"""
        
        method_code += """            except json.JSONDecodeError:
                # Some APIs might return non-JSON validation errors
                pass
        
        print(f"✓ Validation correctly rejected invalid input for field '{test.field_being_tested}'")
"""
        
        return method_code
    
    def _generate_validation_summary_test(self, api_spec: Dict[str, Any], tests: List[ValidationTest]) -> str:
        """Generate a summary test that validates multiple scenarios efficiently"""
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        
        return f"""    @pytest.mark.asyncio
    @pytest.mark.validation
    async def test_{operation_id}_validation_summary(self, client, auth_headers):
        \"\"\"Summary test for common validation scenarios\"\"\"
        
        # Common validation test cases
        validation_scenarios = [
            # Empty payload (should fail if any required fields)
            {{"payload": {{}}, "description": "Empty payload", "should_fail": True}},
            
            # All fields as wrong types
            {{"payload": {{"string_field": 123, "number_field": "not_a_number", "boolean_field": "not_boolean"}}, 
              "description": "Wrong field types", "should_fail": True}},
            
            # Extremely long strings
            {{"payload": {{"name": "x" * 1000, "description": "y" * 2000}}, 
              "description": "Oversized strings", "should_fail": True}},
            
            # Null values
            {{"payload": {{"name": None, "description": None}}, 
              "description": "Null values", "should_fail": True}},
            
            # SQL injection attempts (should be safely rejected)
            {{"payload": {{"name": "'; DROP TABLE users; --", "description": "1' OR '1'='1"}}, 
              "description": "SQL injection attempt", "should_fail": True}},
            
            # XSS attempts (should be safely rejected)
            {{"payload": {{"name": "<script>alert('xss')</script>", "description": "<img src=x onerror=alert(1)>"}}, 
              "description": "XSS injection attempt", "should_fail": True}},
        ]
        
        results = []
        
        for scenario in validation_scenarios:
            try:
                response = await client.{method.lower()}("{path}", json=scenario["payload"], headers=auth_headers)
                
                # Analyze the response
                is_error = response.status_code >= 400
                result = {{
                    "scenario": scenario["description"],
                    "status_code": response.status_code,
                    "expected_to_fail": scenario["should_fail"],
                    "actually_failed": is_error,
                    "correct_behavior": (scenario["should_fail"] and is_error) or (not scenario["should_fail"] and not is_error)
                }}
                
                results.append(result)
                
            except Exception as e:
                # Network errors or client-side validation
                results.append({{
                    "scenario": scenario["description"],
                    "status_code": 0,
                    "expected_to_fail": scenario["should_fail"],
                    "actually_failed": True,
                    "correct_behavior": scenario["should_fail"],
                    "error": str(e)
                }})
        
        # Analyze overall validation behavior
        total_scenarios = len(results)
        correct_behaviors = sum(1 for r in results if r["correct_behavior"])
        validation_score = correct_behaviors / total_scenarios if total_scenarios > 0 else 0
        
        print(f"\\nValidation Summary Results:")
        print(f"{'Scenario':<25} {'Expected':<10} {'Actual':<10} {'Status':<6} {'Correct'}")
        print("-" * 70)
        
        for result in results:
            expected = "FAIL" if result["expected_to_fail"] else "PASS"
            actual = "FAIL" if result["actually_failed"] else "PASS"
            correct = "✓" if result["correct_behavior"] else "✗"
            status = result["status_code"] if result["status_code"] != 0 else "ERR"
            
            print(f"{result['scenario']:<25} {expected:<10} {actual:<10} {status:<6} {correct}")
        
        print(f"\\nValidation Score: {validation_score:.1%} ({correct_behaviors}/{total_scenarios})")
        
        # At least 80% of validation scenarios should behave correctly
        assert validation_score >= 0.8, f"Validation behavior score too low: {validation_score:.1%}"
        
        # Security injection tests should always fail (be rejected)
        security_tests = [r for r in results if "injection" in r["scenario"].lower()]
        for security_test in security_tests:
            assert security_test["actually_failed"], \\
                f"Security test '{{security_test['scenario']}}' should have been rejected (status: {{security_test['status_code']}})"
        
        print("✓ Validation summary test completed successfully!")
"""