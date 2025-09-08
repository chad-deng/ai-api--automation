"""
Enhanced OpenAPI Parser

Intelligent OpenAPI schema analysis with advanced endpoint complexity assessment,
parameter type detection, and constraint-based validation rules generation.
"""

import json
import re
from enum import Enum
from typing import Dict, List, Any, Optional, Set, Tuple, Union
from dataclasses import dataclass
from pathlib import Path
import structlog
from urllib.parse import urlparse

logger = structlog.get_logger()


class EndpointComplexity(str, Enum):
    """Endpoint complexity levels for test strategy selection"""
    SIMPLE = "simple"          # Basic CRUD operations, simple parameters
    MODERATE = "moderate"      # Multiple parameters, basic validation
    COMPLEX = "complex"        # Nested objects, complex validation
    ADVANCED = "advanced"      # Multiple endpoints interaction, business logic


class ParameterType(str, Enum):
    """Parameter types with validation requirements"""
    PATH = "path"
    QUERY = "query"
    HEADER = "header"
    COOKIE = "cookie"
    BODY = "body"


class ValidationRule(str, Enum):
    """Validation rule types"""
    REQUIRED = "required"
    TYPE_CHECK = "type_check"
    FORMAT = "format"
    RANGE = "range"
    PATTERN = "pattern"
    ENUM = "enum"
    ARRAY_LENGTH = "array_length"
    OBJECT_PROPERTIES = "object_properties"
    SECURITY = "security"


@dataclass
class ParameterInfo:
    """Parameter information with validation constraints"""
    name: str
    param_type: ParameterType
    data_type: str
    format_type: Optional[str] = None
    required: bool = False
    constraints: Dict[str, Any] = None
    validation_rules: List[ValidationRule] = None
    description: str = ""
    examples: List[Any] = None
    
    def __post_init__(self):
        if self.constraints is None:
            self.constraints = {}
        if self.validation_rules is None:
            self.validation_rules = []
        if self.examples is None:
            self.examples = []


@dataclass
class ResponseInfo:
    """Response information with schema details"""
    status_code: str
    description: str
    content_type: str
    schema: Dict[str, Any]
    examples: List[Any] = None
    headers: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.examples is None:
            self.examples = []
        if self.headers is None:
            self.headers = {}


@dataclass
class SecurityRequirement:
    """Security requirement information"""
    scheme_type: str  # bearer, apiKey, oauth2, etc.
    name: str
    location: str  # header, query, cookie
    scopes: List[str] = None
    
    def __post_init__(self):
        if self.scopes is None:
            self.scopes = []


@dataclass
class EndpointAnalysis:
    """Comprehensive endpoint analysis result"""
    operation_id: str
    method: str
    path: str
    summary: str
    description: str
    complexity: EndpointComplexity
    parameters: List[ParameterInfo]
    request_body: Optional[Dict[str, Any]]
    responses: List[ResponseInfo]
    security: List[SecurityRequirement]
    tags: List[str]
    deprecated: bool = False
    test_strategies: List[str] = None
    validation_requirements: List[ValidationRule] = None
    
    def __post_init__(self):
        if self.test_strategies is None:
            self.test_strategies = []
        if self.validation_requirements is None:
            self.validation_requirements = []


class OpenAPIParser:
    """
    Enhanced OpenAPI parser with intelligent schema analysis
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
        
        # Type mapping for validation
        self.type_mapping = {
            'string': str,
            'integer': int,
            'number': float,
            'boolean': bool,
            'array': list,
            'object': dict
        }
        
        # Format validation patterns
        self.format_patterns = {
            'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'uri': r'^https?://[^\s/$.?#].[^\s]*$',
            'uuid': r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            'date': r'^\d{4}-\d{2}-\d{2}$',
            'date-time': r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$',
            'password': r'^.{8,}$'  # Minimum 8 characters
        }
        
        # Common security vulnerabilities to test
        self.security_test_vectors = [
            'sql_injection', 'xss', 'command_injection', 
            'path_traversal', 'ldap_injection', 'nosql_injection'
        ]
    
    def parse_openapi_spec(self, spec_data: Union[Dict[str, Any], str, Path]) -> Dict[str, Any]:
        """
        Parse OpenAPI specification and return comprehensive analysis
        
        Args:
            spec_data: OpenAPI spec as dict, JSON string, or file path
            
        Returns:
            Dict containing parsed endpoints with analysis
        """
        try:
            # Load spec data if needed
            if isinstance(spec_data, (str, Path)):
                spec_dict = self._load_spec_file(spec_data)
            else:
                spec_dict = spec_data
            
            # Validate OpenAPI format
            if not self._validate_openapi_format(spec_dict):
                raise ValueError("Invalid OpenAPI specification format")
            
            # Extract basic info
            info = {
                'openapi_version': spec_dict.get('openapi', '3.0.0'),
                'title': spec_dict.get('info', {}).get('title', 'Unknown API'),
                'version': spec_dict.get('info', {}).get('version', '1.0.0'),
                'description': spec_dict.get('info', {}).get('description', ''),
                'base_url': self._extract_base_url(spec_dict),
                'security_schemes': self._parse_security_schemes(spec_dict),
                'endpoints': []
            }
            
            # Parse each endpoint
            paths = spec_dict.get('paths', {})
            for path, path_data in paths.items():
                for method, operation_data in path_data.items():
                    if method.upper() not in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']:
                        continue
                    
                    endpoint_analysis = self._analyze_endpoint(
                        path, method, operation_data, spec_dict
                    )
                    info['endpoints'].append(endpoint_analysis)
            
            self.logger.info("OpenAPI spec parsed successfully", 
                           endpoints_found=len(info['endpoints']))
            
            return info
            
        except Exception as e:
            self.logger.error("Failed to parse OpenAPI spec", error=str(e))
            raise
    
    def _load_spec_file(self, file_path: Union[str, Path]) -> Dict[str, Any]:
        """Load OpenAPI spec from file"""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"OpenAPI spec file not found: {path}")
        
        with open(path, 'r', encoding='utf-8') as f:
            if path.suffix.lower() == '.json':
                return json.load(f)
            elif path.suffix.lower() in ['.yaml', '.yml']:
                import yaml
                return yaml.safe_load(f)
            else:
                # Try JSON first, then YAML
                content = f.read()
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    import yaml
                    return yaml.safe_load(content)
    
    def _validate_openapi_format(self, spec: Dict[str, Any]) -> bool:
        """Validate basic OpenAPI format"""
        required_fields = ['openapi', 'info', 'paths']
        return all(field in spec for field in required_fields)
    
    def _extract_base_url(self, spec: Dict[str, Any]) -> str:
        """Extract base URL from servers section"""
        servers = spec.get('servers', [])
        if servers:
            return servers[0].get('url', '')
        return ''
    
    def _parse_security_schemes(self, spec: Dict[str, Any]) -> List[SecurityRequirement]:
        """Parse security schemes from OpenAPI spec"""
        security_schemes = []
        components = spec.get('components', {})
        security_defs = components.get('securitySchemes', {})
        
        for name, scheme_data in security_defs.items():
            scheme_type = scheme_data.get('type', 'unknown')
            location = scheme_data.get('in', 'header')
            
            security_schemes.append(SecurityRequirement(
                scheme_type=scheme_type,
                name=name,
                location=location
            ))
        
        return security_schemes
    
    def _analyze_endpoint(self, path: str, method: str, operation: Dict[str, Any], 
                         spec: Dict[str, Any]) -> EndpointAnalysis:
        """Analyze individual endpoint for complexity and requirements"""
        
        # Basic endpoint info
        operation_id = operation.get('operationId', f"{method}_{path.replace('/', '_').replace('{', '').replace('}', '')}")
        summary = operation.get('summary', f"{method.upper()} {path}")
        description = operation.get('description', '')
        tags = operation.get('tags', [])
        deprecated = operation.get('deprecated', False)
        
        # Parse parameters
        parameters = self._parse_parameters(operation.get('parameters', []), spec)
        
        # Parse request body
        request_body = self._parse_request_body(operation.get('requestBody', {}), spec)
        if request_body:
            # Add body parameters to parameter list
            body_params = self._extract_body_parameters(request_body)
            parameters.extend(body_params)
        
        # Parse responses
        responses = self._parse_responses(operation.get('responses', {}), spec)
        
        # Parse security requirements
        security = self._parse_endpoint_security(operation.get('security', []), spec)
        
        # Determine complexity
        complexity = self._determine_endpoint_complexity(parameters, request_body, responses)
        
        # Generate validation requirements
        validation_requirements = self._generate_validation_requirements(parameters, request_body)
        
        # Suggest test strategies
        test_strategies = self._suggest_test_strategies(method, complexity, parameters, responses)
        
        return EndpointAnalysis(
            operation_id=operation_id,
            method=method.upper(),
            path=path,
            summary=summary,
            description=description,
            complexity=complexity,
            parameters=parameters,
            request_body=request_body,
            responses=responses,
            security=security,
            tags=tags,
            deprecated=deprecated,
            test_strategies=test_strategies,
            validation_requirements=validation_requirements
        )
    
    def _parse_parameters(self, parameters: List[Dict[str, Any]], spec: Dict[str, Any]) -> List[ParameterInfo]:
        """Parse endpoint parameters with validation constraints"""
        parsed_params = []
        
        for param in parameters:
            # Handle parameter references
            if '$ref' in param:
                param = self._resolve_reference(param['$ref'], spec)
            
            param_info = ParameterInfo(
                name=param.get('name', 'unknown'),
                param_type=ParameterType(param.get('in', 'query')),
                data_type=param.get('schema', {}).get('type', 'string'),
                format_type=param.get('schema', {}).get('format'),
                required=param.get('required', False),
                description=param.get('description', ''),
                constraints=self._extract_constraints(param.get('schema', {})),
                validation_rules=self._determine_validation_rules(param.get('schema', {}))
            )
            
            # Add examples if available
            if 'example' in param:
                param_info.examples.append(param['example'])
            elif 'examples' in param:
                param_info.examples.extend(param['examples'].values())
            
            parsed_params.append(param_info)
        
        return parsed_params
    
    def _parse_request_body(self, request_body: Dict[str, Any], spec: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse request body schema"""
        if not request_body:
            return None
        
        # Handle request body references
        if '$ref' in request_body:
            request_body = self._resolve_reference(request_body['$ref'], spec)
        
        content = request_body.get('content', {})
        if not content:
            return None
        
        # Focus on JSON content (most common)
        json_content = content.get('application/json', {})
        if not json_content:
            # Fallback to first available content type
            json_content = next(iter(content.values()), {})
        
        schema = json_content.get('schema', {})
        if '$ref' in schema:
            schema = self._resolve_reference(schema['$ref'], spec)
        
        return {
            'required': request_body.get('required', False),
            'description': request_body.get('description', ''),
            'schema': schema,
            'content_type': 'application/json'
        }
    
    def _extract_body_parameters(self, request_body: Dict[str, Any]) -> List[ParameterInfo]:
        """Extract parameters from request body schema"""
        if not request_body or 'schema' not in request_body:
            return []
        
        schema = request_body['schema']
        parameters = []
        
        if schema.get('type') == 'object':
            properties = schema.get('properties', {})
            required_fields = schema.get('required', [])
            
            for prop_name, prop_schema in properties.items():
                param_info = ParameterInfo(
                    name=prop_name,
                    param_type=ParameterType.BODY,
                    data_type=prop_schema.get('type', 'string'),
                    format_type=prop_schema.get('format'),
                    required=prop_name in required_fields,
                    description=prop_schema.get('description', ''),
                    constraints=self._extract_constraints(prop_schema),
                    validation_rules=self._determine_validation_rules(prop_schema)
                )
                parameters.append(param_info)
        
        return parameters
    
    def _parse_responses(self, responses: Dict[str, Any], spec: Dict[str, Any]) -> List[ResponseInfo]:
        """Parse response definitions"""
        parsed_responses = []
        
        for status_code, response_data in responses.items():
            # Handle response references
            if '$ref' in response_data:
                response_data = self._resolve_reference(response_data['$ref'], spec)
            
            description = response_data.get('description', '')
            content = response_data.get('content', {})
            headers = response_data.get('headers', {})
            
            # Parse content schemas
            for content_type, content_data in content.items():
                schema = content_data.get('schema', {})
                if '$ref' in schema:
                    schema = self._resolve_reference(schema['$ref'], spec)
                
                response_info = ResponseInfo(
                    status_code=status_code,
                    description=description,
                    content_type=content_type,
                    schema=schema,
                    headers=headers
                )
                
                # Add examples if available
                if 'example' in content_data:
                    response_info.examples.append(content_data['example'])
                elif 'examples' in content_data:
                    response_info.examples.extend(content_data['examples'].values())
                
                parsed_responses.append(response_info)
        
        return parsed_responses
    
    def _parse_endpoint_security(self, security: List[Dict[str, Any]], spec: Dict[str, Any]) -> List[SecurityRequirement]:
        """Parse endpoint-specific security requirements"""
        security_reqs = []
        
        for sec_req in security:
            for scheme_name, scopes in sec_req.items():
                # Find scheme definition
                components = spec.get('components', {})
                security_schemes = components.get('securitySchemes', {})
                
                if scheme_name in security_schemes:
                    scheme_data = security_schemes[scheme_name]
                    security_reqs.append(SecurityRequirement(
                        scheme_type=scheme_data.get('type', 'unknown'),
                        name=scheme_name,
                        location=scheme_data.get('in', 'header'),
                        scopes=scopes or []
                    ))
        
        return security_reqs
    
    def _extract_constraints(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Extract validation constraints from schema"""
        constraints = {}
        
        # String constraints
        if 'minLength' in schema:
            constraints['min_length'] = schema['minLength']
        if 'maxLength' in schema:
            constraints['max_length'] = schema['maxLength']
        if 'pattern' in schema:
            constraints['pattern'] = schema['pattern']
        
        # Numeric constraints
        if 'minimum' in schema:
            constraints['minimum'] = schema['minimum']
        if 'maximum' in schema:
            constraints['maximum'] = schema['maximum']
        if 'exclusiveMinimum' in schema:
            constraints['exclusive_minimum'] = schema['exclusiveMinimum']
        if 'exclusiveMaximum' in schema:
            constraints['exclusive_maximum'] = schema['exclusiveMaximum']
        if 'multipleOf' in schema:
            constraints['multiple_of'] = schema['multipleOf']
        
        # Array constraints
        if 'minItems' in schema:
            constraints['min_items'] = schema['minItems']
        if 'maxItems' in schema:
            constraints['max_items'] = schema['maxItems']
        if 'uniqueItems' in schema:
            constraints['unique_items'] = schema['uniqueItems']
        
        # Enum values
        if 'enum' in schema:
            constraints['enum'] = schema['enum']
        
        return constraints
    
    def _determine_validation_rules(self, schema: Dict[str, Any]) -> List[ValidationRule]:
        """Determine validation rules based on schema"""
        rules = []
        
        # Type checking
        if 'type' in schema:
            rules.append(ValidationRule.TYPE_CHECK)
        
        # Format validation
        if 'format' in schema:
            rules.append(ValidationRule.FORMAT)
        
        # Range validation
        if any(key in schema for key in ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum']):
            rules.append(ValidationRule.RANGE)
        
        # Pattern validation
        if 'pattern' in schema:
            rules.append(ValidationRule.PATTERN)
        
        # Enum validation
        if 'enum' in schema:
            rules.append(ValidationRule.ENUM)
        
        # Array length validation
        if schema.get('type') == 'array' and any(key in schema for key in ['minItems', 'maxItems']):
            rules.append(ValidationRule.ARRAY_LENGTH)
        
        # Object properties validation
        if schema.get('type') == 'object' and 'properties' in schema:
            rules.append(ValidationRule.OBJECT_PROPERTIES)
        
        return rules
    
    def _determine_endpoint_complexity(self, parameters: List[ParameterInfo], 
                                     request_body: Optional[Dict[str, Any]], 
                                     responses: List[ResponseInfo]) -> EndpointComplexity:
        """Determine endpoint complexity level"""
        complexity_score = 0
        
        # Parameter complexity
        complexity_score += len(parameters)
        
        # Required parameters add complexity
        required_params = sum(1 for p in parameters if p.required)
        complexity_score += required_params
        
        # Complex parameter types
        complex_types = ['object', 'array']
        complex_params = sum(1 for p in parameters if p.data_type in complex_types)
        complexity_score += complex_params * 2
        
        # Request body complexity
        if request_body:
            schema = request_body.get('schema', {})
            if schema.get('type') == 'object':
                properties = schema.get('properties', {})
                complexity_score += len(properties)
                
                # Nested objects increase complexity
                nested_objects = sum(1 for prop in properties.values() 
                                   if prop.get('type') == 'object')
                complexity_score += nested_objects * 2
        
        # Response complexity
        success_responses = [r for r in responses if r.status_code.startswith('2')]
        if success_responses:
            for response in success_responses:
                schema = response.schema
                if schema.get('type') == 'object':
                    properties = schema.get('properties', {})
                    complexity_score += len(properties) * 0.5
        
        # Determine complexity level
        if complexity_score <= 3:
            return EndpointComplexity.SIMPLE
        elif complexity_score <= 8:
            return EndpointComplexity.MODERATE
        elif complexity_score <= 15:
            return EndpointComplexity.COMPLEX
        else:
            return EndpointComplexity.ADVANCED
    
    def _suggest_test_strategies(self, method: str, complexity: EndpointComplexity,
                               parameters: List[ParameterInfo], 
                               responses: List[ResponseInfo]) -> List[str]:
        """Suggest appropriate test strategies based on endpoint characteristics"""
        strategies = []
        
        # Always include basic tests
        strategies.append('basic_functionality')
        
        # Parameter validation tests
        if parameters:
            strategies.append('parameter_validation')
            
            # Boundary testing for parameters with constraints
            constrained_params = [p for p in parameters if p.constraints]
            if constrained_params:
                strategies.append('boundary_testing')
        
        # Security testing for string parameters (injection attacks)
        string_params = [p for p in parameters if p.data_type == 'string']
        if string_params:
            strategies.append('security_testing')
        
        # Error scenario testing
        strategies.append('error_scenarios')
        
        # Authentication testing if security is required
        # This would be determined from the security requirements
        strategies.append('authentication_testing')
        
        # Method-specific strategies
        if method.upper() in ['POST', 'PUT', 'PATCH']:
            strategies.append('data_validation')
            if complexity in [EndpointComplexity.COMPLEX, EndpointComplexity.ADVANCED]:
                strategies.append('schema_validation')
        
        # Performance testing for complex endpoints
        if complexity in [EndpointComplexity.COMPLEX, EndpointComplexity.ADVANCED]:
            strategies.append('performance_testing')
        
        # Concurrency testing for state-changing operations
        if method.upper() in ['POST', 'PUT', 'PATCH', 'DELETE']:
            strategies.append('concurrency_testing')
        
        return strategies
    
    def _generate_validation_requirements(self, parameters: List[ParameterInfo],
                                        request_body: Optional[Dict[str, Any]]) -> List[ValidationRule]:
        """Generate comprehensive validation requirements"""
        requirements = set()
        
        # Parameter validation requirements
        for param in parameters:
            requirements.update(param.validation_rules)
            
            # Add security validation for string parameters
            if param.data_type == 'string':
                requirements.add(ValidationRule.SECURITY)
        
        # Request body validation requirements
        if request_body:
            schema = request_body.get('schema', {})
            if schema:
                body_rules = self._determine_validation_rules(schema)
                requirements.update(body_rules)
        
        return list(requirements)
    
    def _resolve_reference(self, ref: str, spec: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve $ref references in OpenAPI spec"""
        # Simple reference resolution for #/components/... references
        if ref.startswith('#/'):
            path_parts = ref[2:].split('/')  # Remove #/ prefix
            result = spec
            
            for part in path_parts:
                if isinstance(result, dict) and part in result:
                    result = result[part]
                else:
                    return {}
            
            return result
        
        return {}
    
    def analyze_endpoint_relationships(self, endpoints: List[EndpointAnalysis]) -> Dict[str, List[str]]:
        """
        Analyze relationships between endpoints for integration testing
        
        Returns:
            Dict mapping endpoint IDs to related endpoint IDs
        """
        relationships = {}
        
        for endpoint in endpoints:
            related = []
            
            # Find endpoints with similar paths (CRUD operations)
            base_path = re.sub(r'\{[^}]+\}', '', endpoint.path).rstrip('/')
            
            for other_endpoint in endpoints:
                if other_endpoint.operation_id == endpoint.operation_id:
                    continue
                
                other_base_path = re.sub(r'\{[^}]+\}', '', other_endpoint.path).rstrip('/')
                
                # Same resource, different operations
                if base_path == other_base_path:
                    related.append(other_endpoint.operation_id)
                
                # Parent-child resource relationships
                elif (base_path.startswith(other_base_path) or 
                      other_base_path.startswith(base_path)):
                    related.append(other_endpoint.operation_id)
            
            relationships[endpoint.operation_id] = related
        
        return relationships
    
    def get_test_data_requirements(self, endpoint: EndpointAnalysis) -> Dict[str, Any]:
        """
        Generate test data requirements for an endpoint
        
        Returns:
            Dict containing data generation requirements
        """
        requirements = {
            'valid_data': {},
            'invalid_data': {},
            'boundary_data': {},
            'security_data': {},
        }
        
        # Valid data requirements
        for param in endpoint.parameters:
            requirements['valid_data'][param.name] = {
                'type': param.data_type,
                'format': param.format_type,
                'constraints': param.constraints,
                'required': param.required
            }
        
        # Request body data requirements
        if endpoint.request_body:
            schema = endpoint.request_body.get('schema', {})
            if schema.get('type') == 'object':
                properties = schema.get('properties', {})
                required_fields = schema.get('required', [])
                
                for prop_name, prop_schema in properties.items():
                    requirements['valid_data'][f"body.{prop_name}"] = {
                        'type': prop_schema.get('type', 'string'),
                        'format': prop_schema.get('format'),
                        'constraints': self._extract_constraints(prop_schema),
                        'required': prop_name in required_fields
                    }
        
        return requirements