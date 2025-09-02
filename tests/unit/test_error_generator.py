"""
Comprehensive unit tests for error_generator.py module

Test coverage for ErrorScenario dataclass and ErrorScenarioGenerator class
"""

import pytest
import json
from unittest.mock import Mock, patch, mock_open
from dataclasses import asdict
from pathlib import Path

from src.generators.test_generators.error_generator import (
    ErrorScenario,
    ErrorScenarioGenerator
)


class TestErrorScenario:
    """Unit tests for ErrorScenario dataclass"""
    
    def test_error_scenario_initialization(self):
        """Test ErrorScenario initialization with required fields"""
        scenario = ErrorScenario(
            name="test_endpoint_auth_error",
            description="Test authentication error",
            expected_status_code=401,
            test_payload={"field": "value"}
        )
        
        assert scenario.name == "test_endpoint_auth_error"
        assert scenario.description == "Test authentication error"
        assert scenario.expected_status_code == 401
        assert scenario.test_payload == {"field": "value"}
        assert scenario.test_headers is None
        assert scenario.test_params is None
        assert scenario.test_method_override is None
    
    def test_error_scenario_initialization_with_optional_fields(self):
        """Test ErrorScenario initialization with all optional fields"""
        scenario = ErrorScenario(
            name="test_endpoint_validation_error",
            description="Test validation error with headers",
            expected_status_code=400,
            test_payload={"data": "test"},
            test_headers={"Authorization": "Bearer token"},
            test_params={"param1": "value1"},
            test_method_override="POST"
        )
        
        assert scenario.name == "test_endpoint_validation_error"
        assert scenario.description == "Test validation error with headers"
        assert scenario.expected_status_code == 400
        assert scenario.test_payload == {"data": "test"}
        assert scenario.test_headers == {"Authorization": "Bearer token"}
        assert scenario.test_params == {"param1": "value1"}
        assert scenario.test_method_override == "POST"
    
    def test_error_scenario_as_dict(self):
        """Test ErrorScenario conversion to dictionary"""
        scenario = ErrorScenario(
            name="test_scenario",
            description="Test description",
            expected_status_code=422,
            test_payload={"test": True}
        )
        
        scenario_dict = asdict(scenario)
        
        assert scenario_dict["name"] == "test_scenario"
        assert scenario_dict["description"] == "Test description"
        assert scenario_dict["expected_status_code"] == 422
        assert scenario_dict["test_payload"] == {"test": True}
        assert scenario_dict["test_headers"] is None
        assert scenario_dict["test_params"] is None
        assert scenario_dict["test_method_override"] is None


class TestErrorScenarioGenerator:
    """Unit tests for ErrorScenarioGenerator class"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.generator = ErrorScenarioGenerator()
    
    def test_generator_initialization(self):
        """Test ErrorScenarioGenerator initialization"""
        generator = ErrorScenarioGenerator()
        assert hasattr(generator, 'logger')
    
    def test_generate_error_scenarios_basic_endpoint(self):
        """Test generating error scenarios for basic endpoint"""
        api_spec = {
            "path": "/api/users",
            "method": "GET",
            "operationId": "getUsers"
        }
        
        scenarios = self.generator.generate_error_scenarios(api_spec)
        
        assert isinstance(scenarios, list)
        assert len(scenarios) > 0
        
        # Should generate method errors, auth errors, content type errors, etc.
        scenario_names = [s.name for s in scenarios]
        
        # Check for method errors
        method_errors = [name for name in scenario_names if "method_" in name and "not_allowed" in name]
        assert len(method_errors) > 0
        
        # Check for auth errors
        auth_errors = [name for name in scenario_names if any(auth in name for auth in ["missing_auth", "invalid_token", "expired_token"])]
        assert len(auth_errors) > 0
    
    def test_generate_error_scenarios_post_endpoint_with_schema(self):
        """Test generating error scenarios for POST endpoint with request schema"""
        api_spec = {
            "path": "/api/users",
            "method": "POST",
            "operationId": "createUser",
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["name", "email"],
                            "properties": {
                                "name": {"type": "string", "minLength": 2, "maxLength": 50},
                                "email": {"type": "string"},
                                "age": {"type": "integer", "minimum": 0, "maximum": 150}
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator.generate_error_scenarios(api_spec)
        
        assert len(scenarios) > 0
        scenario_names = [s.name for s in scenarios]
        
        # Should have validation errors for required fields
        assert any("missing_name" in name for name in scenario_names)
        assert any("missing_email" in name for name in scenario_names)
        
        # Should have boundary errors for string length and numeric boundaries
        boundary_errors = [name for name in scenario_names if any(bound in name for bound in ["too_long", "too_short", "above_maximum", "below_minimum"])]
        assert len(boundary_errors) > 0
        
        # Should have empty payload error
        assert any("empty_payload" in name for name in scenario_names)
        
        # Should have content type errors for POST method
        content_type_errors = [name for name in scenario_names if "content_type" in name]
        assert len(content_type_errors) > 0
    
    def test_generate_method_errors(self):
        """Test _generate_method_errors method"""
        api_spec = {
            "method": "POST",
            "operationId": "createUser"
        }
        
        scenarios = self.generator._generate_method_errors(api_spec)
        
        assert isinstance(scenarios, list)
        assert len(scenarios) > 0
        
        # Should generate scenarios for methods other than POST
        for scenario in scenarios:
            assert isinstance(scenario, ErrorScenario)
            assert scenario.expected_status_code == 405
            assert "method_" in scenario.name
            assert "not_allowed" in scenario.name
            assert scenario.test_method_override is not None
            assert scenario.test_method_override != "POST"
    
    def test_generate_auth_errors(self):
        """Test _generate_auth_errors method"""
        api_spec = {
            "operationId": "getProfile"
        }
        
        scenarios = self.generator._generate_auth_errors(api_spec)
        
        assert isinstance(scenarios, list)
        assert len(scenarios) > 0
        
        # Check for 401 scenarios
        unauthorized_scenarios = [s for s in scenarios if s.expected_status_code == 401]
        assert len(unauthorized_scenarios) >= 4  # missing_auth, invalid_token, expired_token, malformed_auth_header
        
        # Check for 403 scenarios
        forbidden_scenarios = [s for s in scenarios if s.expected_status_code == 403]
        assert len(forbidden_scenarios) >= 2  # insufficient_permissions, revoked_token
        
        # Verify specific scenarios exist
        scenario_names = [s.name for s in scenarios]
        assert any("missing_auth" in name for name in scenario_names)
        assert any("invalid_token" in name for name in scenario_names)
        assert any("expired_token" in name for name in scenario_names)
        assert any("malformed_auth_header" in name for name in scenario_names)
        assert any("insufficient_permissions" in name for name in scenario_names)
        assert any("revoked_token" in name for name in scenario_names)
    
    def test_generate_validation_errors_with_schema(self):
        """Test _generate_validation_errors with request schema"""
        api_spec = {
            "operationId": "updateProfile",
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["username", "email"],
                            "properties": {
                                "username": {"type": "string"},
                                "email": {"type": "string"},
                                "age": {"type": "integer"},
                                "active": {"type": "boolean"}
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator._generate_validation_errors(api_spec)
        
        assert len(scenarios) > 0
        scenario_names = [s.name for s in scenarios]
        
        # Should have missing required field errors
        assert any("missing_username" in name for name in scenario_names)
        assert any("missing_email" in name for name in scenario_names)
        
        # Should have invalid type errors
        assert any("invalid_username_type" in name for name in scenario_names)
        assert any("invalid_age_type" in name for name in scenario_names)
        
        # Should have empty payload error
        assert any("empty_payload" in name for name in scenario_names)
        
        # Verify scenarios have correct expected status codes
        for scenario in scenarios:
            assert scenario.expected_status_code == 400
    
    def test_generate_validation_errors_no_schema(self):
        """Test _generate_validation_errors without request schema"""
        api_spec = {
            "operationId": "getUsers"
        }
        
        scenarios = self.generator._generate_validation_errors(api_spec)
        
        assert scenarios == []
    
    def test_generate_boundary_errors_string_constraints(self):
        """Test _generate_boundary_errors with string length constraints"""
        api_spec = {
            "operationId": "createPost",
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "title": {
                                    "type": "string",
                                    "minLength": 5,
                                    "maxLength": 100
                                },
                                "content": {
                                    "type": "string",
                                    "maxLength": 1000
                                }
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator._generate_boundary_errors(api_spec)
        
        scenario_names = [s.name for s in scenarios]
        
        # Should have boundary errors for title field
        assert any("title_too_long" in name for name in scenario_names)
        assert any("title_too_short" in name for name in scenario_names)
        
        # Should have boundary error for content field (max length only)
        assert any("content_too_long" in name for name in scenario_names)
        
        # Verify payload structure
        for scenario in scenarios:
            assert scenario.expected_status_code == 400
            assert isinstance(scenario.test_payload, dict)
    
    def test_generate_boundary_errors_numeric_constraints(self):
        """Test _generate_boundary_errors with numeric constraints"""
        api_spec = {
            "operationId": "updateScore",
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "score": {
                                    "type": "integer",
                                    "minimum": 0,
                                    "maximum": 100
                                },
                                "rating": {
                                    "type": "number",
                                    "minimum": 1.0
                                }
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator._generate_boundary_errors(api_spec)
        
        scenario_names = [s.name for s in scenarios]
        
        # Should have boundary errors for score field
        assert any("score_below_minimum" in name for name in scenario_names)
        assert any("score_above_maximum" in name for name in scenario_names)
        
        # Should have boundary error for rating field (minimum only)
        assert any("rating_below_minimum" in name for name in scenario_names)
    
    def test_generate_boundary_errors_no_schema(self):
        """Test _generate_boundary_errors without request schema"""
        api_spec = {
            "operationId": "getUsers"
        }
        
        scenarios = self.generator._generate_boundary_errors(api_spec)
        
        assert scenarios == []
    
    def test_generate_content_type_errors_get_method(self):
        """Test _generate_content_type_errors for GET method"""
        api_spec = {
            "method": "GET",
            "operationId": "getUsers"
        }
        
        scenarios = self.generator._generate_content_type_errors(api_spec)
        
        # Should generate wrong content type scenario
        assert len(scenarios) == 1
        scenario = scenarios[0]
        
        assert "wrong_content_type" in scenario.name
        assert scenario.expected_status_code == 415
        assert scenario.test_headers["Content-Type"] == "text/plain"
    
    def test_generate_content_type_errors_post_method(self):
        """Test _generate_content_type_errors for POST method"""
        api_spec = {
            "method": "POST",
            "operationId": "createUser"
        }
        
        scenarios = self.generator._generate_content_type_errors(api_spec)
        
        # Should generate wrong content type and missing content type scenarios
        assert len(scenarios) == 2
        scenario_names = [s.name for s in scenarios]
        
        assert any("wrong_content_type" in name for name in scenario_names)
        assert any("missing_content_type" in name for name in scenario_names)
        
        # Check specific scenarios
        wrong_ct = next(s for s in scenarios if "wrong_content_type" in s.name)
        assert wrong_ct.expected_status_code == 415
        
        missing_ct = next(s for s in scenarios if "missing_content_type" in s.name)
        assert missing_ct.expected_status_code == 400
        assert missing_ct.test_headers["Content-Type"] == ""
    
    def test_generate_rate_limit_errors(self):
        """Test _generate_rate_limit_errors method"""
        api_spec = {
            "operationId": "searchProducts"
        }
        
        scenarios = self.generator._generate_rate_limit_errors(api_spec)
        
        assert len(scenarios) == 1
        scenario = scenarios[0]
        
        assert "rate_limit_exceeded" in scenario.name
        assert scenario.expected_status_code == 429
        assert scenario.test_payload == {"test": "data"}
    
    def test_generate_server_errors(self):
        """Test _generate_server_errors method"""
        api_spec = {
            "operationId": "uploadFile"
        }
        
        scenarios = self.generator._generate_server_errors(api_spec)
        
        assert len(scenarios) == 1
        scenario = scenarios[0]
        
        assert "payload_too_large" in scenario.name
        assert scenario.expected_status_code == 413
        assert "large_data" in scenario.test_payload
        assert len(scenario.test_payload["large_data"]) == 1000000  # 1MB
    
    def test_get_invalid_type_value(self):
        """Test _get_invalid_type_value method"""
        # Test all supported types
        assert self.generator._get_invalid_type_value("string") == 12345
        assert self.generator._get_invalid_type_value("integer") == "not_a_number"
        assert self.generator._get_invalid_type_value("number") == "not_a_number"
        assert self.generator._get_invalid_type_value("boolean") == "not_a_boolean"
        assert self.generator._get_invalid_type_value("array") == "not_an_array"
        assert self.generator._get_invalid_type_value("object") == "not_an_object"
        
        # Test unsupported type
        assert self.generator._get_invalid_type_value("unknown_type") is None
    
    @patch("builtins.open", new_callable=mock_open)
    def test_generate_test_file(self, mock_file):
        """Test generate_test_file method"""
        api_spec = {
            "operationId": "getUserById",
            "method": "GET",
            "path": "/api/users/{id}",
            "description": "Get user by ID"
        }
        
        output_dir = "/test/output"
        
        # Execute
        result = self.generator.generate_test_file(api_spec, output_dir)
        
        # Verify file was written
        mock_file.assert_called_once()
        
        # Check written content structure
        written_content = mock_file().write.call_args[0][0]
        
        assert "import pytest" in written_content
        assert "import httpx" in written_content
        assert "class Test" in written_content
        assert "ErrorScenarios" in written_content
        assert "BASE_URL" in written_content
        assert "@pytest.fixture" in written_content
        assert "def client(self)" in written_content
        assert "def auth_headers(self)" in written_content
        
        # Should return the expected file path
        assert result == "/test/output/test_getuserbyid_error_scenarios.py"
    
    def test_generate_test_method_get_request(self):
        """Test _generate_test_method for GET request"""
        scenario = ErrorScenario(
            name="test_endpoint_auth_error",
            description="Test authentication error",
            expected_status_code=401,
            test_payload={"data": "test"}
        )
        
        api_spec = {
            "method": "GET",
            "path": "/api/test"
        }
        
        method_code = self.generator._generate_test_method(scenario, api_spec)
        
        assert "@pytest.mark.asyncio" in method_code
        assert "async def test_endpoint_auth_error(self, client):" in method_code
        assert "Test authentication error" in method_code
        assert "await client.get(" in method_code
        assert "/api/test" in method_code
        assert "assert response.status_code == 401" in method_code
    
    def test_generate_test_method_post_request_with_headers(self):
        """Test _generate_test_method for POST request with headers"""
        scenario = ErrorScenario(
            name="test_create_invalid_token",
            description="Test create with invalid token",
            expected_status_code=401,
            test_payload={"name": "test"},
            test_headers={"Authorization": "Bearer invalid"}
        )
        
        api_spec = {
            "method": "POST",
            "path": "/api/users"
        }
        
        method_code = self.generator._generate_test_method(scenario, api_spec)
        
        assert "async def test_create_invalid_token(self, client):" in method_code
        assert "Test create with invalid token" in method_code
        assert "await client.post(" in method_code
        assert "/api/users" in method_code
        assert "json=payload" in method_code
        assert '"Authorization": "Bearer invalid"' in method_code
        assert "assert response.status_code == 401" in method_code
    
    def test_generate_test_method_rate_limit_scenario(self):
        """Test _generate_test_method for rate limiting scenario"""
        scenario = ErrorScenario(
            name="test_api_rate_limit",
            description="Test rate limiting",
            expected_status_code=429,
            test_payload={"data": "test"}
        )
        
        api_spec = {
            "method": "GET",
            "path": "/api/search"
        }
        
        method_code = self.generator._generate_test_method(scenario, api_spec)
        
        assert "For rate limiting, send multiple rapid requests" in method_code
        assert "for i in range(10):" in method_code
        assert "responses.append(resp)" in method_code
        assert "any(r.status_code == 429 for r in responses)" in method_code
    
    def test_generate_test_method_payload_too_large_scenario(self):
        """Test _generate_test_method for payload too large scenario"""
        scenario = ErrorScenario(
            name="test_api_payload_too_large",
            description="Test payload too large",
            expected_status_code=413,
            test_payload={"large_data": "x" * 1000}
        )
        
        api_spec = {
            "method": "POST",
            "path": "/api/upload"
        }
        
        method_code = self.generator._generate_test_method(scenario, api_spec)
        
        assert "Should return 413 Payload Too Large" in method_code
        assert "assert response.status_code in [413, 400, 422]" in method_code
        assert "except httpx.RequestEntityTooLarge:" in method_code
        assert "Network-level errors are acceptable" in method_code
    
    def test_generate_test_method_with_method_override(self):
        """Test _generate_test_method with method override"""
        scenario = ErrorScenario(
            name="test_method_not_allowed",
            description="Test method not allowed",
            expected_status_code=405,
            test_payload={},
            test_method_override="DELETE"
        )
        
        api_spec = {
            "method": "GET",
            "path": "/api/users"
        }
        
        method_code = self.generator._generate_test_method(scenario, api_spec)
        
        assert "await client.delete(" in method_code
        assert "assert response.status_code == 405" in method_code
    
    def test_generate_batch_error_test(self):
        """Test _generate_batch_error_test method"""
        api_spec = {
            "operationId": "createUser",
            "method": "POST",
            "path": "/api/users"
        }
        
        scenarios = [
            ErrorScenario("test1", "desc1", 401, {}),
            ErrorScenario("test2", "desc2", 400, {})
        ]
        
        batch_test = self.generator._generate_batch_error_test(api_spec, scenarios)
        
        assert "@pytest.mark.asyncio" in batch_test
        assert "async def test_createuser_batch_error_scenarios(self, client):" in batch_test
        assert "Batch test multiple error scenarios for efficiency" in batch_test
        assert "error_scenarios = [" in batch_test
        assert "Authentication errors" in batch_test
        assert "Validation errors" in batch_test
        assert "Content type errors" in batch_test
        assert "await client.post(" in batch_test
        assert "/api/users" in batch_test
        assert "success_rate >= 0.7" in batch_test
    
    def test_generate_test_file_content_integration(self):
        """Test _generate_test_file_content integration"""
        api_spec = {
            "operationId": "getUserProfile",
            "method": "GET",
            "path": "/api/profile",
            "description": "Get user profile endpoint"
        }
        
        scenarios = [
            ErrorScenario("test_auth", "Auth test", 401, {"test": "data"}),
            ErrorScenario("test_validation", "Validation test", 400, {})
        ]
        
        content = self.generator._generate_test_file_content(api_spec, scenarios)
        
        # Check header structure
        assert "import pytest" in content
        assert "import httpx" in content
        assert "Advanced Error Scenario Tests for: Get user profile endpoint" in content
        assert "Method: GET" in content
        assert "Path: /api/profile" in content
        assert "Generated: Week 3 Advanced Test Generation" in content
        
        # Check class structure (note: operationId gets lowercased and underscores removed)
        assert "class TestGetuserprofileErrorScenarios:" in content
        assert "@pytest.fixture" in content
        assert "def client(self):" in content
        assert "def auth_headers(self):" in content
        
        # Check that test methods are included
        assert "async def test_auth(self, client):" in content
        assert "async def test_validation(self, client):" in content
        
        # Check batch test method is included
        assert "test_getuserprofile_batch_error_scenarios" in content


class TestErrorScenarioGeneratorEdgeCases:
    """Test edge cases and error handling"""
    
    def setup_method(self):
        self.generator = ErrorScenarioGenerator()
    
    def test_empty_api_spec(self):
        """Test handling of empty API spec"""
        scenarios = self.generator.generate_error_scenarios({})
        
        # Should still generate some basic scenarios
        assert isinstance(scenarios, list)
        assert len(scenarios) > 0
    
    def test_api_spec_with_minimal_fields(self):
        """Test API spec with only minimal required fields"""
        api_spec = {"path": "/test"}
        
        scenarios = self.generator.generate_error_scenarios(api_spec)
        
        assert len(scenarios) > 0
        # Should handle missing operationId gracefully
        for scenario in scenarios:
            assert "endpoint" in scenario.name  # Default operationId
    
    def test_complex_nested_schema(self):
        """Test handling of complex nested schema"""
        api_spec = {
            "operationId": "createComplexObject",
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["user"],
                            "properties": {
                                "user": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "contacts": {
                                            "type": "array",
                                            "items": {"type": "string"}
                                        }
                                    }
                                },
                                "metadata": {
                                    "type": "object"
                                }
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator.generate_error_scenarios(api_spec)
        
        # Should handle nested schema without errors
        assert len(scenarios) > 0
        scenario_names = [s.name for s in scenarios]
        
        # Should have missing required field error
        assert any("missing_user" in name for name in scenario_names)
    
    def test_unsupported_content_type_schema(self):
        """Test handling of unsupported content types in schema"""
        api_spec = {
            "operationId": "uploadFile",
            "request_body": {
                "content": {
                    "multipart/form-data": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "file": {"type": "string", "format": "binary"}
                            }
                        }
                    }
                }
            }
        }
        
        # Should handle gracefully without application/json schema
        scenarios = self.generator.generate_error_scenarios(api_spec)
        
        assert len(scenarios) > 0  # Should still generate other error types
        
        # Validation errors should be empty (no JSON schema)
        validation_scenarios = self.generator._generate_validation_errors(api_spec)
        assert len(validation_scenarios) == 0


class TestErrorScenarioGeneratorCoverage:
    """Tests specifically targeting remaining uncovered code"""
    
    def setup_method(self):
        self.generator = ErrorScenarioGenerator()
    
    def test_all_http_methods_coverage(self):
        """Test all HTTP methods for method errors"""
        for method in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
            api_spec = {"method": method, "operationId": f"test{method}"}
            scenarios = self.generator._generate_method_errors(api_spec)
            
            # Should generate errors for other methods
            assert len(scenarios) > 0
            for scenario in scenarios:
                assert scenario.test_method_override != method
    
    def test_boundary_errors_edge_cases(self):
        """Test boundary error generation edge cases"""
        # Test with minimum = 0
        api_spec = {
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "count": {"type": "integer", "minimum": 0}
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator._generate_boundary_errors(api_spec)
        
        # Should generate below minimum test
        assert any("below_minimum" in s.name for s in scenarios)
        below_min_scenario = next(s for s in scenarios if "below_minimum" in s.name)
        assert below_min_scenario.test_payload["count"] == -1
    
    def test_string_boundary_with_min_length_zero(self):
        """Test string boundary with minLength = 0"""
        api_spec = {
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "optional_text": {
                                    "type": "string",
                                    "minLength": 0,
                                    "maxLength": 10
                                }
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator._generate_boundary_errors(api_spec)
        
        # Should generate max length error, but not min length (since min is 0)
        boundary_names = [s.name for s in scenarios]
        assert any("too_long" in name for name in boundary_names)
        assert not any("too_short" in name for name in boundary_names)
    
    def test_validation_errors_all_field_types(self):
        """Test validation errors for all supported field types"""
        api_spec = {
            "operationId": "testAllTypes",
            "request_body": {
                "content": {
                    "application/json": {
                        "schema": {
                            "properties": {
                                "str_field": {"type": "string"},
                                "int_field": {"type": "integer"},
                                "num_field": {"type": "number"},
                                "bool_field": {"type": "boolean"},
                                "arr_field": {"type": "array"},
                                "obj_field": {"type": "object"},
                                "unknown_field": {"type": "unknown_type"}
                            }
                        }
                    }
                }
            }
        }
        
        scenarios = self.generator._generate_validation_errors(api_spec)
        
        # Should generate invalid type scenarios for known types
        scenario_names = [s.name for s in scenarios]
        assert any("invalid_str_field_type" in name for name in scenario_names)
        assert any("invalid_int_field_type" in name for name in scenario_names)
        assert any("invalid_num_field_type" in name for name in scenario_names)
        assert any("invalid_bool_field_type" in name for name in scenario_names)
        assert any("invalid_arr_field_type" in name for name in scenario_names)
        assert any("invalid_obj_field_type" in name for name in scenario_names)
        
        # Should not generate scenario for unknown type
        assert not any("invalid_unknown_field_type" in name for name in scenario_names)