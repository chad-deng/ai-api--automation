# Pytest Test Generation Templates & Patterns

*Phase 4: Solution Design - Test Template Specifications*  
*Date: 2025-08-21*

---

## 🧪 Test Generation Template Architecture

### 1. Template Engine Structure

```python
class TemplateEngine:
    def __init__(self):
        self.jinja_env = Environment(
            loader=FileSystemLoader('templates/'),
            autoescape=select_autoescape(['html', 'xml'])
        )
        self.template_registry = {
            'crud': 'crud_operations.py.jinja2',
            'validation': 'input_validation.py.jinja2', 
            'error': 'error_scenarios.py.jinja2',
            'performance': 'performance_tests.py.jinja2',
            'security': 'security_tests.py.jinja2'
        }
        
    def generate_test_file(self, template_type: str, context: Dict) -> str:
        template = self.jinja_env.get_template(self.template_registry[template_type])
        return template.render(**context)
```

### 2. Template Context Data Model

```python
@dataclass
class TestTemplateContext:
    # API Specification Data
    api_info: ApiInfo
    endpoint: EndpointInfo
    operations: List[OperationInfo]
    schemas: Dict[str, SchemaInfo]
    
    # Test Generation Settings
    test_config: TestConfig
    fixtures: List[FixtureInfo]
    test_data: TestDataSet
    
    # QA Review Metadata
    generation_metadata: GenerationMetadata
    review_requirements: List[str]

@dataclass 
class EndpointInfo:
    path: str                    # "/users/{id}"
    resource_name: str          # "users"
    path_parameters: List[str]  # ["id"]
    base_url_variable: str      # "api_base_url"

@dataclass
class OperationInfo:
    method: str                 # "GET", "POST", "PUT", "DELETE"
    operation_id: str          # "getUserById"
    summary: str               # Human readable description
    request_schema: Optional[str]  # Schema name if request body
    response_schemas: Dict[int, str]  # {200: "User", 404: "Error"}
    parameters: List[ParameterInfo]
    security_requirements: List[str]
```

---

## 📝 Core Template Patterns

### 1. CRUD Operations Template

**File**: `templates/crud_operations.py.jinja2`

```python
"""
Auto-generated CRUD tests for {{ endpoint.path }}
Generated: {{ generation_metadata.timestamp }}
ApiFox Project: {{ api_info.title }} v{{ api_info.version }}

⚠️  QA REVIEW REQUIRED
{% for requirement in review_requirements %}
- {{ requirement }}
{% endfor %}
"""

import pytest
import requests
from typing import Dict, Any
from {{ test_config.client_module }} import APIClient
{% if test_config.auth_required %}
from {{ test_config.auth_module }} import get_auth_headers
{% endif %}

class Test{{ endpoint.resource_name|title }}CRUD:
    """CRUD operation tests for {{ endpoint.path }}"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """API client fixture with base configuration"""
        return APIClient(
            base_url="{{ test_config.base_url }}",
            timeout={{ test_config.timeout }}
        )
    
    {% if test_config.auth_required %}
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Authentication headers for API requests"""
        return get_auth_headers()
    {% endif %}
    
    {% for fixture in fixtures %}
    @pytest.fixture
    def {{ fixture.name }}(self):
        """{{ fixture.description }}"""
        return {{ fixture.data | tojson }}
    {% endfor %}

    {% for operation in operations if operation.method == 'POST' %}
    def test_create_{{ endpoint.resource_name }}_success(self, api_client{% if test_config.auth_required %}, auth_headers{% endif %}):
        """Test successful {{ endpoint.resource_name }} creation"""
        # Arrange
        test_data = {{ test_data.valid_create_data | tojson }}
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if test_config.auth_required %},
            headers=auth_headers{% endif %},
            json=test_data
        )
        
        # Assert
        assert response.status_code == {{ operation.success_status_code }}
        {% if operation.response_schema %}
        response_data = response.json()
        assert "{{ operation.response_schema.id_field }}" in response_data
        {% for field, value in test_data.items() %}
        assert response_data["{{ field }}"] == "{{ value }}"
        {% endfor %}
        {% endif %}
        
        # QA REVIEW: Verify response contains all expected fields
        # QA REVIEW: Add business-specific validation assertions
    
    def test_create_{{ endpoint.resource_name }}_validation_error(self, api_client{% if test_config.auth_required %}, auth_headers{% endif %}):
        """Test {{ endpoint.resource_name }} creation with invalid data"""
        # Arrange
        invalid_data = {{ test_data.invalid_create_data | tojson }}
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if test_config.auth_required %},
            headers=auth_headers{% endif %},
            json=invalid_data
        )
        
        # Assert
        assert response.status_code == 400
        response_data = response.json()
        assert "error" in response_data or "message" in response_data
        
        # QA REVIEW: Verify specific validation error messages
        # QA REVIEW: Test all required field combinations
    {% endfor %}

    {% for operation in operations if operation.method == 'GET' %}
    def test_get_{{ endpoint.resource_name }}_success(self, api_client{% if test_config.auth_required %}, auth_headers{% endif %}):
        """Test successful {{ endpoint.resource_name }} retrieval"""
        # Arrange
        {% if endpoint.path_parameters %}
        {{ endpoint.path_parameters[0] }} = {{ test_data.valid_id }}
        {% endif %}
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if endpoint.path_parameters %}.format({{ endpoint.path_parameters[0] }}={{ endpoint.path_parameters[0] }}){% endif %}{% if test_config.auth_required %},
            headers=auth_headers{% endif %}
        )
        
        # Assert
        assert response.status_code == {{ operation.success_status_code }}
        {% if operation.response_schema %}
        response_data = response.json()
        assert isinstance(response_data, {% if operation.returns_list %}list{% else %}dict{% endif %})
        
        {% if not operation.returns_list %}
        assert "{{ operation.response_schema.id_field }}" in response_data
        {% endif %}
        {% endif %}
        
        # QA REVIEW: Verify response data structure
        # QA REVIEW: Add performance assertions for large datasets
        
    def test_get_{{ endpoint.resource_name }}_not_found(self, api_client{% if test_config.auth_required %}, auth_headers{% endif %}):
        """Test {{ endpoint.resource_name }} retrieval with non-existent ID"""
        # Arrange
        {% if endpoint.path_parameters %}
        {{ endpoint.path_parameters[0] }} = {{ test_data.invalid_id }}
        {% endif %}
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if endpoint.path_parameters %}.format({{ endpoint.path_parameters[0] }}={{ endpoint.path_parameters[0] }}){% endif %}{% if test_config.auth_required %},
            headers=auth_headers{% endif %}
        )
        
        # Assert
        assert response.status_code == 404
        
        # QA REVIEW: Verify error message format
        # QA REVIEW: Test edge cases for ID format validation
    {% endfor %}

    {% for operation in operations if operation.method == 'PUT' %}
    def test_update_{{ endpoint.resource_name }}_success(self, api_client{% if test_config.auth_required %}, auth_headers{% endif %}):
        """Test successful {{ endpoint.resource_name }} update"""
        # Arrange
        {% if endpoint.path_parameters %}
        {{ endpoint.path_parameters[0] }} = {{ test_data.valid_id }}
        {% endif %}
        update_data = {{ test_data.valid_update_data | tojson }}
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if endpoint.path_parameters %}.format({{ endpoint.path_parameters[0] }}={{ endpoint.path_parameters[0] }}){% endif %}{% if test_config.auth_required %},
            headers=auth_headers{% endif %},
            json=update_data
        )
        
        # Assert
        assert response.status_code == {{ operation.success_status_code }}
        {% if operation.response_schema %}
        response_data = response.json()
        {% for field, value in test_data.valid_update_data.items() %}
        assert response_data["{{ field }}"] == "{{ value }}"
        {% endfor %}
        {% endif %}
        
        # QA REVIEW: Verify partial update scenarios
        # QA REVIEW: Test optimistic locking if applicable
    {% endfor %}

    {% for operation in operations if operation.method == 'DELETE' %}
    def test_delete_{{ endpoint.resource_name }}_success(self, api_client{% if test_config.auth_required %}, auth_headers{% endif %}):
        """Test successful {{ endpoint.resource_name }} deletion"""
        # Arrange
        {% if endpoint.path_parameters %}
        {{ endpoint.path_parameters[0] }} = {{ test_data.valid_id }}
        {% endif %}
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if endpoint.path_parameters %}.format({{ endpoint.path_parameters[0] }}={{ endpoint.path_parameters[0] }}){% endif %}{% if test_config.auth_required %},
            headers=auth_headers{% endif %}
        )
        
        # Assert
        assert response.status_code in [200, 202, 204]
        
        # Verify deletion by attempting to retrieve
        get_response = api_client.get(
            "{{ endpoint.path }}"{% if endpoint.path_parameters %}.format({{ endpoint.path_parameters[0] }}={{ endpoint.path_parameters[0] }}){% endif %}{% if test_config.auth_required %},
            headers=auth_headers{% endif %}
        )
        assert get_response.status_code == 404
        
        # QA REVIEW: Test cascade deletion behavior
        # QA REVIEW: Verify soft vs hard delete implementation
    {% endfor %}

# QA REVIEW CHECKLIST:
# □ Test data covers realistic business scenarios
# □ Error messages are user-friendly and specific
# □ Performance assertions are appropriate for expected load
# □ Security considerations are addressed
# □ Integration with other API endpoints is tested
# □ Database state is properly managed between tests
```

### 2. Input Validation Template

**File**: `templates/input_validation.py.jinja2`

```python
"""
Input validation tests for {{ endpoint.path }}
Generated: {{ generation_metadata.timestamp }}

⚠️  QA REVIEW REQUIRED - Validation Rules
{% for schema_name, schema in schemas.items() %}
Schema: {{ schema_name }}
{% for field, rules in schema.validation_rules.items() %}
- {{ field }}: {{ rules }}
{% endfor %}
{% endfor %}
"""

import pytest
from {{ test_config.client_module }} import APIClient

class Test{{ endpoint.resource_name|title }}Validation:
    """Input validation tests for {{ endpoint.path }}"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient(base_url="{{ test_config.base_url }}")
    
    {% for operation in operations if operation.request_schema %}
    {% set schema = schemas[operation.request_schema] %}
    
    # {{ operation.method }} {{ endpoint.path }} Validation Tests
    
    {% for field in schema.required_fields %}
    def test_{{ operation.method.lower() }}_missing_required_{{ field }}(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} fails when {{ field }} is missing"""
        # Arrange
        invalid_data = {{ test_data.valid_request_data | tojson }}
        del invalid_data["{{ field }}"]
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}",
            json=invalid_data
        )
        
        # Assert
        assert response.status_code == 400
        error_data = response.json()
        assert "{{ field }}" in str(error_data).lower()
        
        # QA REVIEW: Verify error message mentions specific field
    {% endfor %}
    
    {% for field, validation_rule in schema.validation_rules.items() %}
    def test_{{ operation.method.lower() }}_invalid_{{ field }}_format(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} validates {{ field }} format"""
        # Arrange
        test_cases = {{ validation_rule.invalid_values | tojson }}
        
        for invalid_value in test_cases:
            invalid_data = {{ test_data.valid_request_data | tojson }}
            invalid_data["{{ field }}"] = invalid_value
            
            # Act
            response = api_client.{{ operation.method.lower() }}(
                "{{ endpoint.path }}",
                json=invalid_data
            )
            
            # Assert
            assert response.status_code == 400, f"Failed for {{ field }}={invalid_value}"
            
        # QA REVIEW: Add business-specific validation rules
        # QA REVIEW: Test boundary conditions for {{ field }}
    {% endfor %}
    
    {% if schema.string_length_validations %}
    @pytest.mark.parametrize("field,min_length,max_length", [
        {% for field, limits in schema.string_length_validations.items() %}
        ("{{ field }}", {{ limits.min }}, {{ limits.max }}),
        {% endfor %}
    ])
    def test_{{ operation.method.lower() }}_string_length_validation(self, api_client, field, min_length, max_length):
        """Test string length validation for {{ operation.method }} {{ endpoint.path }}"""
        # Test too short
        short_data = {{ test_data.valid_request_data | tojson }}
        short_data[field] = "x" * (min_length - 1) if min_length > 0 else ""
        
        response = api_client.{{ operation.method.lower() }}("{{ endpoint.path }}", json=short_data)
        assert response.status_code == 400, f"Should reject too short {field}"
        
        # Test too long
        long_data = {{ test_data.valid_request_data | tojson }}
        long_data[field] = "x" * (max_length + 1)
        
        response = api_client.{{ operation.method.lower() }}("{{ endpoint.path }}", json=long_data)
        assert response.status_code == 400, f"Should reject too long {field}"
        
        # Test valid length
        valid_data = {{ test_data.valid_request_data | tojson }}
        valid_data[field] = "x" * min_length
        
        response = api_client.{{ operation.method.lower() }}("{{ endpoint.path }}", json=valid_data)
        assert response.status_code in [200, 201, 202], f"Should accept valid {field} length"
    {% endif %}
    {% endfor %}

# QA REVIEW CHECKLIST:
# □ All business validation rules are covered
# □ Edge cases and boundary conditions are tested
# □ Error messages are clear and actionable
# □ Validation performance is acceptable
# □ Security implications of validation bypasses are considered
```

### 3. Error Scenarios Template

**File**: `templates/error_scenarios.py.jinja2`

```python
"""
Error scenario tests for {{ endpoint.path }}
Generated: {{ generation_metadata.timestamp }}

⚠️  QA REVIEW REQUIRED - Error Handling
Review expected error responses and business rules
"""

import pytest
from {{ test_config.client_module }} import APIClient

class Test{{ endpoint.resource_name|title }}ErrorScenarios:
    """Error scenario tests for {{ endpoint.path }}"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient(base_url="{{ test_config.base_url }}")
    
    {% for operation in operations %}
    # {{ operation.method }} {{ endpoint.path }} Error Scenarios
    
    def test_{{ operation.method.lower() }}_unauthorized_access(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} requires authentication"""
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if operation.request_schema %},
            json={{ test_data.valid_request_data | tojson }}{% endif %}
        )
        
        # Assert
        assert response.status_code == 401
        
        # QA REVIEW: Verify authentication error response format
    
    {% if test_config.supports_rate_limiting %}
    def test_{{ operation.method.lower() }}_rate_limit_exceeded(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} rate limiting"""
        # Act - Make requests rapidly to trigger rate limit
        responses = []
        for i in range({{ test_config.rate_limit_threshold + 5 }}):
            response = api_client.{{ operation.method.lower() }}(
                "{{ endpoint.path }}"{% if operation.request_schema %},
                json={{ test_data.valid_request_data | tojson }}{% endif %}
            )
            responses.append(response)
        
        # Assert - At least one response should be rate limited
        rate_limited = [r for r in responses if r.status_code == 429]
        assert len(rate_limited) > 0, "Rate limiting should be triggered"
        
        # QA REVIEW: Verify rate limit headers are present
        # QA REVIEW: Test rate limit reset behavior
    {% endif %}
    
    def test_{{ operation.method.lower() }}_server_error_handling(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} server error response"""
        # Arrange - Use data that might cause server error
        problematic_data = {{ test_data.server_error_trigger_data | tojson }}
        
        # Act
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if operation.request_schema %},
            json=problematic_data{% endif %}
        )
        
        # Assert
        if response.status_code == 500:
            # Verify error response structure
            assert response.headers.get('content-type') == 'application/json'
            error_data = response.json()
            assert 'error' in error_data or 'message' in error_data
        
        # QA REVIEW: Define what should trigger server errors
        # QA REVIEW: Verify error logging and monitoring
    
    {% if endpoint.path_parameters %}
    def test_{{ operation.method.lower() }}_invalid_path_parameter(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} with invalid path parameters"""
        # Test invalid parameter formats
        invalid_params = {{ test_data.invalid_path_parameters | tojson }}
        
        for invalid_param in invalid_params:
            # Act
            invalid_path = "{{ endpoint.path }}".format({{ endpoint.path_parameters[0] }}=invalid_param)
            response = api_client.{{ operation.method.lower() }}(invalid_path)
            
            # Assert
            assert response.status_code in [400, 404], f"Invalid param {invalid_param} should be rejected"
            
        # QA REVIEW: Verify parameter validation error messages
    {% endif %}
    
    {% if operation.method in ['POST', 'PUT', 'PATCH'] %}
    def test_{{ operation.method.lower() }}_malformed_json(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} with malformed JSON"""
        # Act - Send malformed JSON
        response = api_client.request(
            "{{ operation.method }}",
            "{{ endpoint.path }}",
            data="{ invalid json }",
            headers={"Content-Type": "application/json"}
        )
        
        # Assert
        assert response.status_code == 400
        
        # QA REVIEW: Verify JSON parsing error handling
    
    def test_{{ operation.method.lower() }}_content_type_mismatch(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} with wrong content type"""
        # Act - Send JSON data with wrong content type
        response = api_client.request(
            "{{ operation.method }}",
            "{{ endpoint.path }}",
            data={{ test_data.valid_request_data | tojson | string }},
            headers={"Content-Type": "text/plain"}
        )
        
        # Assert
        assert response.status_code == 415  # Unsupported Media Type
        
        # QA REVIEW: Verify content type validation
    {% endif %}
    {% endfor %}
    
    def test_method_not_allowed(self, api_client):
        """Test unsupported HTTP methods on {{ endpoint.path }}"""
        unsupported_methods = {{ test_data.unsupported_methods | tojson }}
        
        for method in unsupported_methods:
            # Act
            response = api_client.request(method, "{{ endpoint.path }}")
            
            # Assert
            assert response.status_code == 405  # Method Not Allowed
            assert 'Allow' in response.headers
            
        # QA REVIEW: Verify allowed methods in response headers

# QA REVIEW CHECKLIST:
# □ All error scenarios reflect real-world conditions
# □ Error responses include helpful debugging information
# □ Security error responses don't leak sensitive information
# □ Error handling doesn't introduce vulnerabilities
# □ Monitoring and alerting implications are considered
```

### 4. Performance Test Template

**File**: `templates/performance_tests.py.jinja2`

```python
"""
Performance tests for {{ endpoint.path }}
Generated: {{ generation_metadata.timestamp }}

⚠️  QA REVIEW REQUIRED - Performance Targets
Define acceptable response times and throughput limits
"""

import pytest
import time
import concurrent.futures
from {{ test_config.client_module }} import APIClient

class Test{{ endpoint.resource_name|title }}Performance:
    """Performance tests for {{ endpoint.path }}"""
    
    @pytest.fixture
    def api_client(self):
        return APIClient(base_url="{{ test_config.base_url }}")
    
    {% for operation in operations %}
    @pytest.mark.performance
    def test_{{ operation.method.lower() }}_response_time(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} response time"""
        # Arrange
        {% if operation.request_schema %}
        test_data = {{ test_data.valid_request_data | tojson }}
        {% endif %}
        
        # Act - Measure response time
        start_time = time.time()
        response = api_client.{{ operation.method.lower() }}(
            "{{ endpoint.path }}"{% if operation.request_schema %},
            json=test_data{% endif %}
        )
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Assert
        assert response.status_code in [200, 201, 202]
        assert response_time < {{ test_config.max_response_time }}, f"Response time {response_time:.3f}s exceeds limit"
        
        # QA REVIEW: Define acceptable response time for {{ operation.method }} operations
        
    @pytest.mark.performance  
    def test_{{ operation.method.lower() }}_concurrent_requests(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} under concurrent load"""
        # Arrange
        concurrent_requests = {{ test_config.concurrent_request_count }}
        {% if operation.request_schema %}
        test_data = {{ test_data.valid_request_data | tojson }}
        {% endif %}
        
        def make_request():
            return api_client.{{ operation.method.lower() }}(
                "{{ endpoint.path }}"{% if operation.request_schema %},
                json=test_data{% endif %}
            )
        
        # Act - Make concurrent requests
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
            futures = [executor.submit(make_request) for _ in range(concurrent_requests)]
            responses = [future.result() for future in concurrent.futures.as_completed(futures)]
        end_time = time.time()
        
        total_time = end_time - start_time
        successful_responses = [r for r in responses if r.status_code in [200, 201, 202]]
        
        # Assert
        success_rate = len(successful_responses) / len(responses)
        assert success_rate >= {{ test_config.min_success_rate }}, f"Success rate {success_rate:.2%} below threshold"
        
        throughput = len(responses) / total_time
        assert throughput >= {{ test_config.min_throughput }}, f"Throughput {throughput:.2f} req/s below minimum"
        
        # QA REVIEW: Define acceptable concurrency limits
        # QA REVIEW: Test database connection pool limits
        
    {% if operation.method == 'GET' %}
    @pytest.mark.performance
    def test_{{ operation.method.lower() }}_large_dataset_performance(self, api_client):
        """Test {{ operation.method }} {{ endpoint.path }} with large datasets"""
        # Test different page sizes or result set sizes
        test_cases = [
            {"limit": 10, "max_time": 0.5},
            {"limit": 100, "max_time": 2.0},
            {"limit": 1000, "max_time": 5.0}
        ]
        
        for test_case in test_cases:
            # Act
            start_time = time.time()
            response = api_client.get(
                "{{ endpoint.path }}",
                params={"limit": test_case["limit"]}
            )
            end_time = time.time()
            
            response_time = end_time - start_time
            
            # Assert
            assert response.status_code == 200
            assert response_time < test_case["max_time"], f"Large dataset query too slow: {response_time:.3f}s"
            
            # Verify response size is reasonable
            if response.headers.get('content-length'):
                content_size = int(response.headers['content-length'])
                assert content_size < {{ test_config.max_response_size }}, f"Response too large: {content_size} bytes"
        
        # QA REVIEW: Define pagination and result set limits
    {% endif %}
    {% endfor %}
    
    @pytest.mark.performance
    def test_endpoint_under_sustained_load(self, api_client):
        """Test {{ endpoint.path }} under sustained load"""
        # Arrange
        duration_seconds = {{ test_config.load_test_duration }}
        requests_per_second = {{ test_config.target_rps }}
        
        start_time = time.time()
        end_time = start_time + duration_seconds
        
        successful_requests = 0
        failed_requests = 0
        response_times = []
        
        # Act - Sustained load test
        while time.time() < end_time:
            request_start = time.time()
            
            try:
                response = api_client.get("{{ endpoint.path }}")
                request_time = time.time() - request_start
                response_times.append(request_time)
                
                if response.status_code in [200, 201, 202]:
                    successful_requests += 1
                else:
                    failed_requests += 1
                    
            except Exception as e:
                failed_requests += 1
                
            # Rate limiting
            elapsed = time.time() - request_start
            sleep_time = (1.0 / requests_per_second) - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
        
        # Assert
        total_requests = successful_requests + failed_requests
        success_rate = successful_requests / total_requests if total_requests > 0 else 0
        
        assert success_rate >= {{ test_config.min_success_rate }}, f"Sustained load success rate: {success_rate:.2%}"
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            assert avg_response_time < {{ test_config.max_avg_response_time }}, f"Average response time under load: {avg_response_time:.3f}s"
        
        # QA REVIEW: Define sustained load performance criteria
        # QA REVIEW: Monitor resource utilization during load tests

# QA REVIEW CHECKLIST:
# □ Performance targets are realistic and business-driven
# □ Test scenarios reflect actual usage patterns  
# □ Resource utilization is monitored during tests
# □ Performance regression detection is in place
# □ Scalability bottlenecks are identified
```

---

## 🔧 Template Configuration System

### 1. Template Selection Logic

```python
class TemplateSelector:
    def select_templates(self, api_spec: OpenAPISpec) -> List[str]:
        """Select appropriate templates based on API characteristics"""
        templates = ["crud"]  # Always include CRUD
        
        # Add validation templates if request schemas exist
        if any(op.request_body for op in api_spec.operations):
            templates.append("validation")
            
        # Add error templates for complex APIs
        if len(api_spec.paths) > 3:
            templates.append("error")
            
        # Add performance templates for high-traffic endpoints
        if api_spec.has_performance_requirements:
            templates.append("performance")
            
        # Add security templates if authentication required
        if api_spec.security_requirements:
            templates.append("security")
            
        return templates
```

### 2. Custom Template Extensions

```python
# QA Team Custom Templates
custom_templates = {
    "business_logic": "templates/custom/business_logic_tests.py.jinja2",
    "integration": "templates/custom/integration_tests.py.jinja2", 
    "regression": "templates/custom/regression_tests.py.jinja2"
}

# Template Inheritance System
class CustomTemplateEngine(TemplateEngine):
    def __init__(self, custom_template_dir: str):
        super().__init__()
        # Add custom template directory to loader path
        self.jinja_env.loader = ChoiceLoader([
            FileSystemLoader(custom_template_dir),  # Custom templates first
            FileSystemLoader('templates/')          # Default templates
        ])
```

---

## 📋 QA Review Integration Patterns

### 1. Review Markers in Generated Tests

```python
# Generated test files include QA review markers
"""
QA REVIEW SECTIONS:
1. Test Data Validation (Line 45-67)
2. Business Logic Assertions (Line 89-102) 
3. Error Message Verification (Line 123-134)
4. Performance Thresholds (Line 156-167)

CUSTOMIZATION POINTS:
- Add business-specific validation in test_create_user_success()
- Define rate limiting thresholds in test_concurrent_requests()
- Specify acceptable error messages in validation tests
"""

# Inline QA review comments
# QA REVIEW: Verify this assertion matches business requirements
assert response.json()["status"] == "active"

# QA REVIEW REQUIRED: Define acceptable response time for this operation
assert response_time < 2.0  # TODO: Replace with business requirement
```

### 2. Test Customization Framework

```python
class TestCustomizer:
    def apply_qa_customizations(self, test_file_path: str, customizations: Dict):
        """Apply QA team customizations to generated tests"""
        
        # Replace TODO markers with actual values
        content = self.read_file(test_file_path)
        
        for marker, replacement in customizations.items():
            content = content.replace(f"# TODO: {marker}", replacement)
            
        # Add custom assertions
        for test_method, custom_assertions in customizations.get("assertions", {}).items():
            content = self.inject_assertions(content, test_method, custom_assertions)
            
        self.write_file(test_file_path, content)
```

---

**Test Generation Templates Complete** ✅  
**Next Phase 4 Deliverable**: Design QA review workflow and integration points