"""
Test Data Factory

Generates realistic, diverse test data for API testing based on schema specifications,
including support for various data types, formats, constraints, and relationships.
"""

import random
import string
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Union, Callable, Set
from dataclasses import dataclass
from enum import Enum
import json
import re
import structlog

logger = structlog.get_logger()

class DataCategory(str, Enum):
    """Categories of test data"""
    VALID = "valid"
    INVALID = "invalid" 
    BOUNDARY = "boundary"
    EDGE_CASE = "edge_case"
    REALISTIC = "realistic"
    SECURITY = "security"

@dataclass
class TestDataVariant:
    """Represents a variant of test data"""
    category: DataCategory
    value: Any
    description: str
    should_pass_validation: bool

class TestDataFactory:
    """
    Factory for generating realistic and comprehensive test data
    """
    
    def __init__(self, seed: Optional[int] = None):
        self.logger = structlog.get_logger()
        if seed is not None:
            random.seed(seed)
        
        # Common test data patterns
        self.email_domains = [
            "example.com", "test.com", "gmail.com", "yahoo.com", 
            "hotmail.com", "domain.org", "company.co.uk"
        ]
        
        self.first_names = [
            "John", "Jane", "Michael", "Sarah", "David", "Emily",
            "Robert", "Lisa", "James", "Maria", "William", "Jennifer",
            "Christopher", "Jessica", "Daniel", "Ashley", "Matthew", "Amanda"
        ]
        
        self.last_names = [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
            "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
            "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore"
        ]
        
        self.company_names = [
            "Acme Corp", "Global Industries", "Tech Solutions", "Innovation Labs",
            "Digital Systems", "Future Enterprises", "Smart Technologies", "Elite Services"
        ]
        
        self.street_names = [
            "Main St", "Oak Ave", "Park Blvd", "First St", "Second Ave",
            "Elm St", "Maple Dr", "Cedar Ln", "Pine St", "Washington Ave"
        ]
        
        self.cities = [
            "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
            "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"
        ]
        
        self.countries = [
            "United States", "Canada", "United Kingdom", "Germany", "France",
            "Japan", "Australia", "Brazil", "India", "China"
        ]
    
    def generate_for_schema(self, schema: Dict[str, Any], 
                          category: DataCategory = DataCategory.VALID,
                          field_name: Optional[str] = None) -> Any:
        """
        Generate test data based on JSON Schema
        
        Args:
            schema: JSON Schema specification
            category: Category of test data to generate
            field_name: Optional field name for context-aware generation
            
        Returns:
            Generated test data
        """
        field_type = schema.get('type', 'string')
        field_format = schema.get('format')
        
        # Handle different data categories
        if category == DataCategory.INVALID:
            return self._generate_invalid_data(schema, field_name)
        elif category == DataCategory.BOUNDARY:
            return self._generate_boundary_data(schema, field_name)
        elif category == DataCategory.EDGE_CASE:
            return self._generate_edge_case_data(schema, field_name)
        elif category == DataCategory.SECURITY:
            return self._generate_security_test_data(schema, field_name)
        else:
            # Generate valid/realistic data
            return self._generate_valid_data(schema, field_name)
    
    def _generate_valid_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> Any:
        """Generate valid data based on schema"""
        field_type = schema.get('type', 'string')
        field_format = schema.get('format')
        
        # Handle enum first
        if 'enum' in schema:
            return random.choice(schema['enum'])
        
        # Generate based on type
        if field_type == 'string':
            return self._generate_string_data(schema, field_name)
        elif field_type == 'integer':
            return self._generate_integer_data(schema, field_name)
        elif field_type == 'number':
            return self._generate_number_data(schema, field_name)
        elif field_type == 'boolean':
            return random.choice([True, False])
        elif field_type == 'array':
            return self._generate_array_data(schema, field_name)
        elif field_type == 'object':
            return self._generate_object_data(schema, field_name)
        else:
            return self._generate_string_data(schema, field_name)
    
    def _generate_string_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> str:
        """Generate string data based on schema and field name context"""
        field_format = schema.get('format')
        min_length = schema.get('minLength', 1)
        max_length = schema.get('maxLength', 100)
        pattern = schema.get('pattern')
        
        # Format-specific generation
        if field_format == 'email':
            return self._generate_email()
        elif field_format == 'date':
            return self._generate_date_string()
        elif field_format == 'date-time':
            return self._generate_datetime_string()
        elif field_format == 'uri':
            return self._generate_uri()
        elif field_format == 'uuid':
            return str(uuid.uuid4())
        elif field_format == 'password':
            return self._generate_password(max(min_length, 8), min(max_length, 50))
        
        # Pattern-specific generation
        if pattern:
            return self._generate_pattern_string(pattern, min_length, max_length)
        
        # Context-aware generation based on field name
        if field_name:
            field_lower = field_name.lower()
            
            if 'email' in field_lower:
                return self._generate_email()
            elif 'name' in field_lower and 'first' in field_lower:
                return random.choice(self.first_names)
            elif 'name' in field_lower and 'last' in field_lower:
                return random.choice(self.last_names)
            elif 'name' in field_lower:
                return f"{random.choice(self.first_names)} {random.choice(self.last_names)}"
            elif 'company' in field_lower or 'organization' in field_lower:
                return random.choice(self.company_names)
            elif 'phone' in field_lower:
                return self._generate_phone_number()
            elif 'address' in field_lower:
                return self._generate_address()
            elif 'city' in field_lower:
                return random.choice(self.cities)
            elif 'country' in field_lower:
                return random.choice(self.countries)
            elif 'description' in field_lower or 'comment' in field_lower:
                return self._generate_description(min_length, max_length)
            elif 'title' in field_lower:
                return self._generate_title(min_length, max_length)
            elif 'username' in field_lower or 'user_name' in field_lower:
                return self._generate_username()
            elif 'id' in field_lower:
                return self._generate_id_string()
        
        # Default string generation
        return self._generate_generic_string(min_length, max_length)
    
    def _generate_integer_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> int:
        """Generate integer data based on schema"""
        minimum = schema.get('minimum', 1)
        maximum = schema.get('maximum', 1000)
        multiple_of = schema.get('multipleOf')
        
        # Context-aware generation
        if field_name:
            field_lower = field_name.lower()
            
            if 'age' in field_lower:
                return random.randint(18, 100)
            elif 'year' in field_lower:
                return random.randint(2020, 2030)
            elif 'month' in field_lower:
                return random.randint(1, 12)
            elif 'day' in field_lower:
                return random.randint(1, 28)  # Safe for all months
            elif 'hour' in field_lower:
                return random.randint(0, 23)
            elif 'minute' in field_lower or 'second' in field_lower:
                return random.randint(0, 59)
            elif 'port' in field_lower:
                return random.randint(1024, 65535)
            elif 'count' in field_lower or 'quantity' in field_lower:
                return random.randint(1, 100)
            elif 'id' in field_lower:
                return random.randint(1, 999999)
        
        # Generate within constraints
        value = random.randint(minimum, maximum)
        
        if multiple_of:
            value = (value // multiple_of) * multiple_of
            if value < minimum:
                value += multiple_of
        
        return value
    
    def _generate_number_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> float:
        """Generate number (float) data based on schema"""
        minimum = schema.get('minimum', 0.0)
        maximum = schema.get('maximum', 1000.0)
        multiple_of = schema.get('multipleOf')
        
        # Context-aware generation
        if field_name:
            field_lower = field_name.lower()
            
            if 'price' in field_lower or 'cost' in field_lower or 'amount' in field_lower:
                return round(random.uniform(1.0, 999.99), 2)
            elif 'rate' in field_lower or 'percentage' in field_lower:
                return round(random.uniform(0.0, 100.0), 2)
            elif 'weight' in field_lower:
                return round(random.uniform(0.1, 500.0), 1)
            elif 'temperature' in field_lower:
                return round(random.uniform(-40.0, 50.0), 1)
            elif 'coordinate' in field_lower or 'latitude' in field_lower:
                return round(random.uniform(-90.0, 90.0), 6)
            elif 'longitude' in field_lower:
                return round(random.uniform(-180.0, 180.0), 6)
        
        value = random.uniform(minimum, maximum)
        
        if multiple_of:
            value = round(value / multiple_of) * multiple_of
        
        return round(value, 2)
    
    def _generate_array_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> List[Any]:
        """Generate array data based on schema"""
        min_items = schema.get('minItems', 1)
        max_items = schema.get('maxItems', 5)
        items_schema = schema.get('items', {'type': 'string'})
        unique_items = schema.get('uniqueItems', False)
        
        item_count = random.randint(min_items, max_items)
        items = []
        
        for _ in range(item_count):
            item = self.generate_for_schema(items_schema, DataCategory.VALID, field_name)
            
            if unique_items and item in items:
                # Generate a different item for uniqueness
                attempts = 0
                while item in items and attempts < 10:
                    item = self.generate_for_schema(items_schema, DataCategory.VALID, field_name)
                    attempts += 1
            
            items.append(item)
        
        return items
    
    def _generate_object_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> Dict[str, Any]:
        """Generate object data based on schema"""
        properties = schema.get('properties', {})
        required = schema.get('required', [])
        
        obj = {}
        
        # Generate required properties
        for prop_name in required:
            if prop_name in properties:
                obj[prop_name] = self.generate_for_schema(properties[prop_name], DataCategory.VALID, prop_name)
        
        # Generate some optional properties
        optional_props = [p for p in properties.keys() if p not in required]
        if optional_props:
            num_optional = random.randint(0, min(len(optional_props), 3))
            selected_optional = random.sample(optional_props, num_optional)
            
            for prop_name in selected_optional:
                obj[prop_name] = self.generate_for_schema(properties[prop_name], DataCategory.VALID, prop_name)
        
        return obj
    
    def _generate_invalid_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> Any:
        """Generate invalid data based on schema"""
        field_type = schema.get('type', 'string')
        
        # Type mismatches
        if field_type == 'string':
            return random.choice([123, True, [], {}])
        elif field_type == 'integer':
            return random.choice(['not_a_number', 3.14, True, [], {}])
        elif field_type == 'number':
            return random.choice(['not_a_number', True, [], {}])
        elif field_type == 'boolean':
            return random.choice(['not_a_boolean', 123, [], {}])
        elif field_type == 'array':
            return random.choice(['not_an_array', 123, True, {}])
        elif field_type == 'object':
            return random.choice(['not_an_object', 123, True, []])
        else:
            return None
    
    def _generate_boundary_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> Any:
        """Generate boundary value data"""
        field_type = schema.get('type', 'string')
        
        if field_type == 'string':
            min_length = schema.get('minLength')
            max_length = schema.get('maxLength')
            
            if min_length is not None and max_length is not None:
                # Return boundary values
                return random.choice([
                    'x' * min_length,  # Minimum length
                    'x' * max_length,  # Maximum length
                    'x' * (min_length - 1) if min_length > 0 else '',  # Below minimum
                    'x' * (max_length + 1)  # Above maximum
                ])
            elif min_length is not None:
                return 'x' * min_length
            elif max_length is not None:
                return 'x' * max_length
        
        elif field_type in ['integer', 'number']:
            minimum = schema.get('minimum')
            maximum = schema.get('maximum')
            
            if minimum is not None and maximum is not None:
                return random.choice([minimum, maximum, minimum - 1, maximum + 1])
            elif minimum is not None:
                return random.choice([minimum, minimum - 1])
            elif maximum is not None:
                return random.choice([maximum, maximum + 1])
        
        # Fall back to valid data
        return self._generate_valid_data(schema, field_name)
    
    def _generate_edge_case_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> Any:
        """Generate edge case data"""
        field_type = schema.get('type', 'string')
        
        edge_cases = {
            'string': ['', ' ', '  ', '\n', '\t', '\r\n', '\\', '/', '"', "'", 
                      '<script>alert("xss")</script>', '"; DROP TABLE users; --',
                      '🚀🌟💫', 'null', 'undefined', 'true', 'false'],
            'integer': [0, -1, 1, 2147483647, -2147483648],  # 32-bit limits
            'number': [0.0, -1.0, 1.0, float('inf'), -float('inf'), float('nan')],
            'boolean': [None, 0, 1, 'true', 'false'],
            'array': [[], None],
            'object': [{}, None]
        }
        
        return random.choice(edge_cases.get(field_type, [None]))
    
    def _generate_security_test_data(self, schema: Dict[str, Any], field_name: Optional[str] = None) -> Any:
        """Generate security-focused test data"""
        security_payloads = [
            # SQL Injection
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--",
            
            # XSS
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert(1)>",
            "javascript:alert('xss')",
            "<svg onload=alert('xss')>",
            
            # Command Injection
            "; cat /etc/passwd",
            "| whoami",
            "&& rm -rf /",
            "`id`",
            
            # Path Traversal
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "....//....//....//etc/passwd",
            
            # LDAP Injection
            "*)(&",
            "*)(uid=*",
            "admin)(&(password=*))",
            
            # NoSQL Injection
            "'; return db.users.find(); var dummy='",
            "$ne",
            "'; return true; var dummy='",
        ]
        
        return random.choice(security_payloads)
    
    # Helper methods for specific data types
    
    def _generate_email(self) -> str:
        """Generate a realistic email address"""
        username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=random.randint(3, 12)))
        domain = random.choice(self.email_domains)
        return f"{username}@{domain}"
    
    def _generate_date_string(self) -> str:
        """Generate a date string in ISO format"""
        start_date = date(2020, 1, 1)
        end_date = date(2030, 12, 31)
        random_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
        return random_date.isoformat()
    
    def _generate_datetime_string(self) -> str:
        """Generate a datetime string in ISO format"""
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2030, 12, 31)
        random_datetime = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
        return random_datetime.isoformat() + 'Z'
    
    def _generate_uri(self) -> str:
        """Generate a realistic URI"""
        schemes = ['https', 'http']
        domains = ['example.com', 'test.org', 'api.service.com', 'website.net']
        paths = ['', '/api/v1/users', '/documents/file.pdf', '/images/photo.jpg']
        
        scheme = random.choice(schemes)
        domain = random.choice(domains)
        path = random.choice(paths)
        
        return f"{scheme}://{domain}{path}"
    
    def _generate_password(self, min_length: int = 8, max_length: int = 20) -> str:
        """Generate a realistic password"""
        length = random.randint(min_length, max_length)
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(random.choices(characters, k=length))
        
        # Ensure it has at least one of each type
        if length >= 4:
            password = (random.choice(string.ascii_lowercase) +
                       random.choice(string.ascii_uppercase) +
                       random.choice(string.digits) +
                       random.choice("!@#$%^&*") +
                       password[4:])
        
        return password
    
    def _generate_phone_number(self) -> str:
        """Generate a realistic phone number"""
        formats = [
            "+1-{}-{}-{}",
            "({}) {}-{}",
            "{}.{}.{}",
            "{}-{}-{}"
        ]
        
        format_str = random.choice(formats)
        area_code = random.randint(200, 999)
        exchange = random.randint(200, 999)
        number = random.randint(1000, 9999)
        
        return format_str.format(area_code, exchange, number)
    
    def _generate_address(self) -> str:
        """Generate a realistic address"""
        number = random.randint(1, 9999)
        street = random.choice(self.street_names)
        return f"{number} {street}"
    
    def _generate_description(self, min_length: int = 10, max_length: int = 200) -> str:
        """Generate a realistic description"""
        words = [
            "Lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
            "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
            "magna", "aliqua", "Ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
            "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
            "commodo", "consequat", "Duis", "aute", "irure", "dolor", "in", "reprehenderit"
        ]
        
        description = ""
        while len(description) < min_length:
            word = random.choice(words)
            if len(description + word + " ") <= max_length:
                description += word + " "
            else:
                break
        
        return description.strip()
    
    def _generate_title(self, min_length: int = 5, max_length: int = 100) -> str:
        """Generate a realistic title"""
        adjectives = ["Amazing", "Incredible", "Fantastic", "Great", "Excellent", "Outstanding"]
        nouns = ["Product", "Service", "Solution", "System", "Platform", "Application"]
        
        title = f"{random.choice(adjectives)} {random.choice(nouns)}"
        
        if len(title) < min_length:
            title += f" for {random.choice(['Businesses', 'Enterprises', 'Teams', 'Users'])}"
        
        return title[:max_length]
    
    def _generate_username(self) -> str:
        """Generate a realistic username"""
        patterns = [
            lambda: random.choice(self.first_names).lower() + str(random.randint(1, 999)),
            lambda: random.choice(self.first_names).lower() + random.choice(self.last_names).lower(),
            lambda: ''.join(random.choices(string.ascii_lowercase, k=random.randint(3, 12))),
            lambda: random.choice(self.first_names).lower() + "_" + random.choice(self.last_names).lower()
        ]
        
        return random.choice(patterns)()
    
    def _generate_id_string(self) -> str:
        """Generate a realistic ID string"""
        formats = [
            lambda: str(uuid.uuid4()),
            lambda: ''.join(random.choices(string.ascii_uppercase + string.digits, k=8)),
            lambda: 'ID' + str(random.randint(100000, 999999)),
            lambda: ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
        ]
        
        return random.choice(formats)()
    
    def _generate_generic_string(self, min_length: int, max_length: int) -> str:
        """Generate a generic string within length constraints"""
        if max_length < min_length:
            max_length = min_length + 10
        
        length = random.randint(min_length, max_length)
        
        if length <= 0:
            return ""
        
        # Mix of different string types
        string_types = [
            lambda l: ''.join(random.choices(string.ascii_letters, k=l)),
            lambda l: ''.join(random.choices(string.ascii_letters + string.digits, k=l)),
            lambda l: ''.join(random.choices(string.ascii_letters + string.digits + ' ', k=l)).strip(),
        ]
        
        return random.choice(string_types)(length)
    
    def _generate_pattern_string(self, pattern: str, min_length: int, max_length: int) -> str:
        """Generate string matching a regex pattern (basic implementation)"""
        # This is a simplified pattern matcher for common cases
        # In a full implementation, you'd want to use a library like `rstr`
        
        common_patterns = {
            r'^[a-zA-Z]+$': lambda: ''.join(random.choices(string.ascii_letters, k=random.randint(min_length, max_length))),
            r'^[0-9]+$': lambda: ''.join(random.choices(string.digits, k=random.randint(min_length, max_length))),
            r'^[a-zA-Z0-9]+$': lambda: ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(min_length, max_length))),
            r'^[a-zA-Z0-9_-]+$': lambda: ''.join(random.choices(string.ascii_letters + string.digits + '_-', k=random.randint(min_length, max_length))),
            r'^\d{4}-\d{2}-\d{2}$': lambda: f"{random.randint(2020, 2030)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        }
        
        if pattern in common_patterns:
            return common_patterns[pattern]()
        else:
            # Fallback to generic string
            return self._generate_generic_string(min_length, max_length)
    
    def generate_test_data_variants(self, schema: Dict[str, Any], 
                                  field_name: Optional[str] = None) -> List[TestDataVariant]:
        """
        Generate multiple variants of test data for comprehensive testing
        
        Args:
            schema: JSON Schema specification
            field_name: Optional field name for context
            
        Returns:
            List of test data variants
        """
        variants = []
        
        # Generate valid data variants
        for _ in range(3):  # Multiple valid variants
            value = self.generate_for_schema(schema, DataCategory.VALID, field_name)
            variants.append(TestDataVariant(
                category=DataCategory.VALID,
                value=value,
                description=f"Valid {schema.get('type', 'value')}",
                should_pass_validation=True
            ))
        
        # Generate realistic data
        realistic_value = self.generate_for_schema(schema, DataCategory.REALISTIC, field_name)
        variants.append(TestDataVariant(
            category=DataCategory.REALISTIC,
            value=realistic_value,
            description=f"Realistic {schema.get('type', 'value')}",
            should_pass_validation=True
        ))
        
        # Generate boundary data
        boundary_value = self.generate_for_schema(schema, DataCategory.BOUNDARY, field_name)
        variants.append(TestDataVariant(
            category=DataCategory.BOUNDARY,
            value=boundary_value,
            description=f"Boundary {schema.get('type', 'value')}",
            should_pass_validation=False  # Might not pass depending on constraints
        ))
        
        # Generate invalid data
        invalid_value = self.generate_for_schema(schema, DataCategory.INVALID, field_name)
        variants.append(TestDataVariant(
            category=DataCategory.INVALID,
            value=invalid_value,
            description=f"Invalid {schema.get('type', 'value')} (wrong type)",
            should_pass_validation=False
        ))
        
        # Generate edge case data
        edge_case_value = self.generate_for_schema(schema, DataCategory.EDGE_CASE, field_name)
        variants.append(TestDataVariant(
            category=DataCategory.EDGE_CASE,
            value=edge_case_value,
            description=f"Edge case {schema.get('type', 'value')}",
            should_pass_validation=False
        ))
        
        # Generate security test data for string fields
        if schema.get('type') == 'string':
            security_value = self.generate_for_schema(schema, DataCategory.SECURITY, field_name)
            variants.append(TestDataVariant(
                category=DataCategory.SECURITY,
                value=security_value,
                description="Security test payload",
                should_pass_validation=False
            ))
        
        return variants
    
    def generate_complete_payload(self, schema: Dict[str, Any], 
                                category: DataCategory = DataCategory.VALID) -> Dict[str, Any]:
        """
        Generate a complete payload based on object schema
        
        Args:
            schema: Object schema with properties
            category: Category of data to generate
            
        Returns:
            Complete payload dictionary
        """
        if schema.get('type') != 'object':
            raise ValueError("Schema must be of type 'object'")
        
        properties = schema.get('properties', {})
        required = schema.get('required', [])
        
        payload = {}
        
        # Generate all required fields
        for field_name in required:
            if field_name in properties:
                payload[field_name] = self.generate_for_schema(
                    properties[field_name], category, field_name
                )
        
        # Generate some optional fields for realistic payloads
        if category in [DataCategory.VALID, DataCategory.REALISTIC]:
            optional_fields = [f for f in properties.keys() if f not in required]
            if optional_fields:
                num_optional = random.randint(0, min(len(optional_fields), 3))
                selected_optional = random.sample(optional_fields, num_optional)
                
                for field_name in selected_optional:
                    payload[field_name] = self.generate_for_schema(
                        properties[field_name], category, field_name
                    )
        
        return payload
    
    # =============================================================================
    # PHASE 2 ENHANCEMENTS: OpenAPI Schema-Aware Generation
    # =============================================================================
    
    def generate_from_openapi_parameter(self, parameter_info, category: DataCategory = DataCategory.VALID) -> Any:
        """
        Generate test data from OpenAPI parameter information
        
        Args:
            parameter_info: ParameterInfo object from OpenAPI parser
            category: Category of test data to generate
            
        Returns:
            Generated test data value
        """
        from src.generators.openapi_parser import ParameterInfo, ParameterType
        
        if not isinstance(parameter_info, ParameterInfo):
            raise ValueError("parameter_info must be a ParameterInfo instance")
        
        # Create schema from parameter info
        schema = {
            'type': parameter_info.data_type,
            'format': parameter_info.format_type
        }
        
        # Add constraints to schema
        if parameter_info.constraints:
            schema.update(parameter_info.constraints)
        
        # Use existing generation logic
        return self.generate_for_schema(schema, category, parameter_info.name)
    
    def generate_from_openapi_endpoint(self, endpoint_analysis, category: DataCategory = DataCategory.VALID) -> Dict[str, Any]:
        """
        Generate complete test data for an OpenAPI endpoint
        
        Args:
            endpoint_analysis: EndpointAnalysis object from OpenAPI parser
            category: Category of test data to generate
            
        Returns:
            Dict containing all parameter data for the endpoint
        """
        from src.generators.openapi_parser import EndpointAnalysis, ParameterType
        
        if not isinstance(endpoint_analysis, EndpointAnalysis):
            raise ValueError("endpoint_analysis must be an EndpointAnalysis instance")
        
        test_data = {
            'path_params': {},
            'query_params': {},
            'header_params': {},
            'cookie_params': {},
            'body_data': None
        }
        
        # Generate parameter data
        for param in endpoint_analysis.parameters:
            value = self.generate_from_openapi_parameter(param, category)
            
            if param.param_type == ParameterType.PATH:
                test_data['path_params'][param.name] = value
            elif param.param_type == ParameterType.QUERY:
                test_data['query_params'][param.name] = value
            elif param.param_type == ParameterType.HEADER:
                test_data['header_params'][param.name] = value
            elif param.param_type == ParameterType.COOKIE:
                test_data['cookie_params'][param.name] = value
            elif param.param_type == ParameterType.BODY:
                if test_data['body_data'] is None:
                    test_data['body_data'] = {}
                test_data['body_data'][param.name] = value
        
        # Generate request body data if schema exists
        if endpoint_analysis.request_body:
            schema = endpoint_analysis.request_body.get('schema', {})
            if schema:
                if test_data['body_data'] is None:
                    test_data['body_data'] = self.generate_for_schema(schema, category)
                else:
                    # Merge with existing body data
                    generated_body = self.generate_for_schema(schema, category)
                    if isinstance(generated_body, dict):
                        test_data['body_data'].update(generated_body)
        
        return test_data
    
    def generate_realistic_dataset(self, endpoint_analysis, dataset_size: int = 10) -> List[Dict[str, Any]]:
        """
        Generate a realistic dataset for endpoint testing
        
        Args:
            endpoint_analysis: EndpointAnalysis object from OpenAPI parser
            dataset_size: Number of data variants to generate
            
        Returns:
            List of test data dictionaries
        """
        dataset = []
        
        categories = [
            DataCategory.VALID,
            DataCategory.REALISTIC,
            DataCategory.BOUNDARY,
            DataCategory.INVALID,
            DataCategory.EDGE_CASE,
            DataCategory.SECURITY
        ]
        
        # Generate multiple valid/realistic examples
        for i in range(max(1, dataset_size // 2)):
            category = random.choice([DataCategory.VALID, DataCategory.REALISTIC])
            data = self.generate_from_openapi_endpoint(endpoint_analysis, category)
            data['_data_category'] = category.value
            data['_variant_id'] = i
            dataset.append(data)
        
        # Generate edge cases and invalid data
        remaining_size = dataset_size - len(dataset)
        edge_categories = [DataCategory.BOUNDARY, DataCategory.INVALID, DataCategory.EDGE_CASE, DataCategory.SECURITY]
        
        for i in range(remaining_size):
            category = random.choice(edge_categories)
            try:
                data = self.generate_from_openapi_endpoint(endpoint_analysis, category)
                data['_data_category'] = category.value
                data['_variant_id'] = len(dataset) + i
                dataset.append(data)
            except Exception as e:
                # Log but continue if generation fails
                self.logger.warning("Failed to generate test data variant", 
                                  category=category.value, error=str(e))
        
        return dataset
    
    def generate_boundary_test_data(self, parameter_info) -> List[TestDataVariant]:
        """
        Generate comprehensive boundary test data for a parameter
        
        Args:
            parameter_info: ParameterInfo object from OpenAPI parser
            
        Returns:
            List of boundary test data variants
        """
        from src.generators.openapi_parser import ParameterInfo
        
        if not isinstance(parameter_info, ParameterInfo):
            raise ValueError("parameter_info must be a ParameterInfo instance")
        
        variants = []
        constraints = parameter_info.constraints
        
        # String length boundaries
        if parameter_info.data_type == 'string':
            min_len = constraints.get('min_length', 0)
            max_len = constraints.get('max_length', 100)
            
            if min_len is not None:
                # Minimum length
                variants.append(TestDataVariant(
                    category=DataCategory.BOUNDARY,
                    value='x' * min_len if min_len > 0 else '',
                    description=f"Minimum length ({min_len})",
                    should_pass_validation=True
                ))
                
                # Below minimum (if possible)
                if min_len > 0:
                    variants.append(TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value='x' * (min_len - 1),
                        description=f"Below minimum length ({min_len - 1})",
                        should_pass_validation=False
                    ))
            
            if max_len is not None:
                # Maximum length
                variants.append(TestDataVariant(
                    category=DataCategory.BOUNDARY,
                    value='x' * max_len,
                    description=f"Maximum length ({max_len})",
                    should_pass_validation=True
                ))
                
                # Above maximum
                variants.append(TestDataVariant(
                    category=DataCategory.BOUNDARY,
                    value='x' * (max_len + 1),
                    description=f"Above maximum length ({max_len + 1})",
                    should_pass_validation=False
                ))
        
        # Numeric value boundaries
        elif parameter_info.data_type in ['integer', 'number']:
            minimum = constraints.get('minimum')
            maximum = constraints.get('maximum')
            exclusive_min = constraints.get('exclusive_minimum')
            exclusive_max = constraints.get('exclusive_maximum')
            
            if minimum is not None:
                variants.extend([
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=minimum,
                        description=f"Minimum value ({minimum})",
                        should_pass_validation=True
                    ),
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=minimum - 1,
                        description=f"Below minimum ({minimum - 1})",
                        should_pass_validation=False
                    )
                ])
            
            if maximum is not None:
                variants.extend([
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=maximum,
                        description=f"Maximum value ({maximum})",
                        should_pass_validation=True
                    ),
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=maximum + 1,
                        description=f"Above maximum ({maximum + 1})",
                        should_pass_validation=False
                    )
                ])
            
            if exclusive_min is not None:
                variants.extend([
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=exclusive_min + 0.001 if parameter_info.data_type == 'number' else exclusive_min + 1,
                        description=f"Just above exclusive minimum",
                        should_pass_validation=True
                    ),
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=exclusive_min,
                        description=f"At exclusive minimum ({exclusive_min})",
                        should_pass_validation=False
                    )
                ])
            
            if exclusive_max is not None:
                variants.extend([
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=exclusive_max - 0.001 if parameter_info.data_type == 'number' else exclusive_max - 1,
                        description=f"Just below exclusive maximum",
                        should_pass_validation=True
                    ),
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=exclusive_max,
                        description=f"At exclusive maximum ({exclusive_max})",
                        should_pass_validation=False
                    )
                ])
        
        # Array length boundaries
        elif parameter_info.data_type == 'array':
            min_items = constraints.get('min_items', 0)
            max_items = constraints.get('max_items', 10)
            
            if min_items is not None:
                variants.extend([
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=['item'] * min_items,
                        description=f"Minimum items ({min_items})",
                        should_pass_validation=True
                    ),
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=['item'] * max(0, min_items - 1),
                        description=f"Below minimum items ({max(0, min_items - 1)})",
                        should_pass_validation=False if min_items > 0 else True
                    )
                ])
            
            if max_items is not None:
                variants.extend([
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=['item'] * max_items,
                        description=f"Maximum items ({max_items})",
                        should_pass_validation=True
                    ),
                    TestDataVariant(
                        category=DataCategory.BOUNDARY,
                        value=['item'] * (max_items + 1),
                        description=f"Above maximum items ({max_items + 1})",
                        should_pass_validation=False
                    )
                ])
        
        return variants
    
    def generate_security_test_vectors(self, parameter_info) -> List[TestDataVariant]:
        """
        Generate security test vectors for a parameter
        
        Args:
            parameter_info: ParameterInfo object from OpenAPI parser
            
        Returns:
            List of security test data variants
        """
        from src.generators.openapi_parser import ParameterInfo
        
        if not isinstance(parameter_info, ParameterInfo):
            raise ValueError("parameter_info must be a ParameterInfo instance")
        
        variants = []
        
        # Only generate security vectors for string parameters
        if parameter_info.data_type != 'string':
            return variants
        
        # SQL Injection vectors
        sql_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--",
            "1' OR 1=1#"
        ]
        
        for payload in sql_payloads:
            variants.append(TestDataVariant(
                category=DataCategory.SECURITY,
                value=payload,
                description=f"SQL injection: {payload[:20]}...",
                should_pass_validation=False
            ))
        
        # XSS vectors
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert(1)>",
            "javascript:alert('xss')",
            "<svg onload=alert('xss')>",
            "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>"
        ]
        
        for payload in xss_payloads:
            variants.append(TestDataVariant(
                category=DataCategory.SECURITY,
                value=payload,
                description=f"XSS injection: {payload[:20]}...",
                should_pass_validation=False
            ))
        
        # Command Injection vectors
        cmd_payloads = [
            "; cat /etc/passwd",
            "| whoami",
            "&& rm -rf /",
            "`id`",
            "$(id)"
        ]
        
        for payload in cmd_payloads:
            variants.append(TestDataVariant(
                category=DataCategory.SECURITY,
                value=payload,
                description=f"Command injection: {payload[:20]}...",
                should_pass_validation=False
            ))
        
        # Path Traversal vectors
        path_payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "....//....//....//etc/passwd",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2f%65%74%63%2f%70%61%73%73%77%64"
        ]
        
        for payload in path_payloads:
            variants.append(TestDataVariant(
                category=DataCategory.SECURITY,
                value=payload,
                description=f"Path traversal: {payload[:20]}...",
                should_pass_validation=False
            ))
        
        # LDAP Injection vectors
        ldap_payloads = [
            "*)(&",
            "*)(uid=*",
            "admin)(&(password=*))"
        ]
        
        for payload in ldap_payloads:
            variants.append(TestDataVariant(
                category=DataCategory.SECURITY,
                value=payload,
                description=f"LDAP injection: {payload[:20]}...",
                should_pass_validation=False
            ))
        
        # Format string vulnerabilities
        format_payloads = [
            "%x%x%x%x",
            "%s%s%s%s",
            "%n%n%n%n"
        ]
        
        for payload in format_payloads:
            variants.append(TestDataVariant(
                category=DataCategory.SECURITY,
                value=payload,
                description=f"Format string: {payload}",
                should_pass_validation=False
            ))
        
        return variants
    
    def generate_comprehensive_test_suite(self, endpoint_analysis) -> Dict[str, List[TestDataVariant]]:
        """
        Generate a comprehensive test suite for an endpoint
        
        Args:
            endpoint_analysis: EndpointAnalysis object from OpenAPI parser
            
        Returns:
            Dict mapping parameter names to their test data variants
        """
        from src.generators.openapi_parser import EndpointAnalysis, ParameterType
        
        if not isinstance(endpoint_analysis, EndpointAnalysis):
            raise ValueError("endpoint_analysis must be an EndpointAnalysis instance")
        
        test_suite = {}
        
        # Generate test data for each parameter
        for param in endpoint_analysis.parameters:
            param_variants = []
            
            # Generate valid variants (multiple)
            for _ in range(3):
                value = self.generate_from_openapi_parameter(param, DataCategory.VALID)
                param_variants.append(TestDataVariant(
                    category=DataCategory.VALID,
                    value=value,
                    description=f"Valid {param.data_type} value",
                    should_pass_validation=True
                ))
            
            # Generate realistic variant
            realistic_value = self.generate_from_openapi_parameter(param, DataCategory.REALISTIC)
            param_variants.append(TestDataVariant(
                category=DataCategory.REALISTIC,
                value=realistic_value,
                description=f"Realistic {param.data_type} value",
                should_pass_validation=True
            ))
            
            # Generate boundary variants if constraints exist
            if param.constraints:
                param_variants.extend(self.generate_boundary_test_data(param))
            
            # Generate invalid type variants
            invalid_value = self.generate_from_openapi_parameter(param, DataCategory.INVALID)
            param_variants.append(TestDataVariant(
                category=DataCategory.INVALID,
                value=invalid_value,
                description=f"Invalid {param.data_type} type",
                should_pass_validation=False
            ))
            
            # Generate edge case variants
            edge_value = self.generate_from_openapi_parameter(param, DataCategory.EDGE_CASE)
            param_variants.append(TestDataVariant(
                category=DataCategory.EDGE_CASE,
                value=edge_value,
                description=f"Edge case {param.data_type} value",
                should_pass_validation=False
            ))
            
            # Generate security variants for string parameters
            if param.data_type == 'string':
                security_variants = self.generate_security_test_vectors(param)
                param_variants.extend(security_variants[:5])  # Limit to 5 security variants per parameter
            
            test_suite[param.name] = param_variants
        
        # Generate request body test variants if applicable
        if endpoint_analysis.request_body:
            schema = endpoint_analysis.request_body.get('schema', {})
            if schema:
                body_variants = self.generate_test_data_variants(schema, 'request_body')
                test_suite['request_body'] = body_variants
        
        return test_suite
    
    def optimize_test_data_for_strategy(self, endpoint_analysis, test_strategy: str) -> Dict[str, Any]:
        """
        Generate optimized test data for a specific test strategy
        
        Args:
            endpoint_analysis: EndpointAnalysis object from OpenAPI parser
            test_strategy: Specific test strategy (e.g., 'boundary_testing', 'security_testing')
            
        Returns:
            Optimized test data for the strategy
        """
        strategy_mapping = {
            'basic_functionality': DataCategory.VALID,
            'parameter_validation': DataCategory.VALID,
            'boundary_testing': DataCategory.BOUNDARY,
            'security_testing': DataCategory.SECURITY,
            'error_scenarios': DataCategory.INVALID,
            'data_validation': DataCategory.REALISTIC,
            'performance_testing': DataCategory.REALISTIC
        }
        
        category = strategy_mapping.get(test_strategy, DataCategory.VALID)
        
        # Generate base test data
        test_data = self.generate_from_openapi_endpoint(endpoint_analysis, category)
        
        # Strategy-specific optimizations
        if test_strategy == 'boundary_testing':
            # Focus on parameters with constraints
            for param in endpoint_analysis.parameters:
                if param.constraints:
                    boundary_variants = self.generate_boundary_test_data(param)
                    if boundary_variants:
                        # Use the first boundary variant
                        test_data[f"{param.param_type.value}_params"][param.name] = boundary_variants[0].value
        
        elif test_strategy == 'security_testing':
            # Apply security payloads to string parameters
            for param in endpoint_analysis.parameters:
                if param.data_type == 'string':
                    security_variants = self.generate_security_test_vectors(param)
                    if security_variants:
                        test_data[f"{param.param_type.value}_params"][param.name] = security_variants[0].value
        
        elif test_strategy == 'performance_testing':
            # Generate larger datasets for performance testing
            if test_data.get('body_data') and isinstance(test_data['body_data'], dict):
                # Add more data for performance testing
                for key, value in test_data['body_data'].items():
                    if isinstance(value, str):
                        test_data['body_data'][key] = value * 10  # Make strings longer
                    elif isinstance(value, list):
                        test_data['body_data'][key] = value * 50  # Make arrays larger
        
        test_data['_strategy'] = test_strategy
        test_data['_category'] = category.value
        
        return test_data