"""
Intelligent Test Classification System

Dynamically determines appropriate test level markers based on:
- API characteristics (method, complexity, dependencies)
- Test type (auth, crud, performance, etc.)
- Resource requirements
- Execution time estimates
"""

from typing import Dict, List, Any, Optional
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class TestLevel(Enum):
    """Primary test classification levels"""
    SMOKE = "smoke"          # Fast critical path validation (2-5 min)
    INTEGRATION = "integration"  # Real service dependencies (10-30 min)
    LOAD = "load"           # Performance/concurrency tests (30+ min)


class TestClassifier:
    """Intelligent test classification system"""
    
    def __init__(self):
        # API complexity scoring weights
        self.complexity_weights = {
            'path_parameters': 0.1,
            'query_parameters': 0.05,
            'request_body_properties': 0.1,
            'response_properties': 0.05,
            'auth_required': 0.2,
            'nested_objects': 0.15,
            'array_properties': 0.1
        }
        
        # Method-based base classifications
        self.method_base_levels = {
            'GET': TestLevel.SMOKE,      # Read operations are usually fast
            'POST': TestLevel.INTEGRATION,  # Create operations need validation
            'PUT': TestLevel.INTEGRATION,   # Update operations need validation  
            'DELETE': TestLevel.INTEGRATION, # Delete operations need validation
            'PATCH': TestLevel.INTEGRATION   # Partial updates need validation
        }
        
        # Test type classifications
        self.test_type_classifications = {
            # Core functionality tests
            'basic': self._classify_basic_test,
            'crud': self._classify_crud_test,
            'authentication': self._classify_auth_test,
            'error_scenarios': self._classify_error_test,
            
            # Performance/load tests
            'concurrency': lambda *args: [TestLevel.LOAD.value, 'concurrency', 'slow'],
            'performance': lambda *args: [TestLevel.LOAD.value, 'performance', 'slow'],
            'boundary': self._classify_boundary_test,
            'validation': self._classify_validation_test,
            
            # Specialized tests
            'batch': lambda *args: [TestLevel.LOAD.value, 'batch', 'slow'],
            'environment': self._classify_environment_test,
        }
    
    def classify_test(self, api_spec: Dict[str, Any], test_type: str, 
                     specific_test_name: Optional[str] = None) -> List[str]:
        """
        Classify a test and return appropriate pytest markers
        
        Args:
            api_spec: API specification dictionary
            test_type: Type of test (basic, auth, crud, etc.)
            specific_test_name: Specific test method name for granular classification
            
        Returns:
            List of pytest marker strings (e.g., ['smoke', 'api_test', 'critical'])
        """
        try:
            # Get base classification from test type
            classifier_func = self.test_type_classifications.get(
                test_type, 
                self._classify_default_test
            )
            
            markers = classifier_func(api_spec, specific_test_name)
            
            # Add common markers based on API characteristics
            markers.extend(self._get_common_markers(api_spec, test_type))
            
            # Remove duplicates while preserving order
            unique_markers = []
            seen = set()
            for marker in markers:
                if marker not in seen:
                    unique_markers.append(marker)
                    seen.add(marker)
            
            logger.info(
                "Test classified",
                api_path=api_spec.get('path', 'unknown'),
                method=api_spec.get('method', 'unknown'),
                test_type=test_type,
                markers=unique_markers
            )
            
            return unique_markers
            
        except Exception as e:
            logger.warning(
                "Test classification failed, using defaults",
                error=str(e),
                test_type=test_type
            )
            return [TestLevel.INTEGRATION.value, 'api_test']
    
    def _classify_basic_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Classify basic API functionality tests"""
        method = api_spec.get('method', 'GET').upper()
        
        # GET requests for basic tests are typically smoke tests
        if method == 'GET':
            return [TestLevel.SMOKE.value, 'api_test']
        
        # Simple POST/PUT/DELETE without complex payloads -> smoke
        if self._is_simple_api(api_spec):
            return [TestLevel.SMOKE.value, 'api_test']
        
        # Complex operations -> integration
        return [TestLevel.INTEGRATION.value, 'api_test']
    
    def _classify_auth_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Classify authentication/authorization tests"""
        markers = [TestLevel.INTEGRATION.value, 'auth_test', 'auth']
        
        # Basic auth requirement checks can be smoke tests
        if test_name and 'required' in test_name.lower():
            markers[0] = TestLevel.SMOKE.value
        
        # Role-based access control tests are integration
        if test_name and any(term in test_name.lower() for term in ['rbac', 'role', 'permission']):
            markers.extend(['rbac', 'critical'])
        
        # Token lifecycle tests are integration
        if test_name and any(term in test_name.lower() for term in ['token', 'refresh', 'revoke']):
            markers.extend(['token'])
        
        return markers
    
    def _classify_crud_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Classify CRUD operation tests"""
        method = api_spec.get('method', 'GET').upper()
        
        # Determine base level by operation complexity
        if method == 'GET' and self._is_simple_api(api_spec):
            level = TestLevel.SMOKE.value
        else:
            level = TestLevel.INTEGRATION.value
        
        markers = [level, 'crud_test', 'crud']
        
        # Add operation-specific markers
        operation_markers = {
            'POST': ['create'],
            'GET': ['read'], 
            'PUT': ['update'],
            'PATCH': ['update'],
            'DELETE': ['delete']
        }
        
        if method in operation_markers:
            markers.extend(operation_markers[method])
        
        # Batch operations are load tests
        if test_name and 'batch' in test_name.lower():
            markers[0] = TestLevel.LOAD.value
            markers.extend(['batch', 'slow'])
        
        return markers
    
    def _classify_error_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Classify error scenario tests"""
        # Error tests typically need real service responses
        markers = [TestLevel.INTEGRATION.value, 'error_scenarios', 'error_handling']
        
        # Simple validation errors can be smoke tests
        if test_name and any(term in test_name.lower() for term in ['validation', 'invalid_input', 'missing_field']):
            markers[0] = TestLevel.SMOKE.value
            markers.append('validation')
        
        return markers
    
    def _classify_boundary_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Classify boundary testing"""
        return [TestLevel.INTEGRATION.value, 'boundary', 'validation']
    
    def _classify_validation_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Classify data validation tests"""
        return [TestLevel.SMOKE.value, 'validation', 'api_test']
    
    def _classify_environment_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Classify environment configuration tests"""
        return [TestLevel.INTEGRATION.value, 'environment', 'config']
    
    def _classify_default_test(self, api_spec: Dict[str, Any], test_name: Optional[str] = None) -> List[str]:
        """Default classification for unknown test types"""
        method = api_spec.get('method', 'GET').upper()
        base_level = self.method_base_levels.get(method, TestLevel.INTEGRATION)
        return [base_level.value, 'api_test']
    
    def _is_simple_api(self, api_spec: Dict[str, Any]) -> bool:
        """Determine if an API is simple based on complexity scoring"""
        complexity_score = self._calculate_complexity_score(api_spec)
        return complexity_score < 0.3  # Threshold for "simple"
    
    def _calculate_complexity_score(self, api_spec: Dict[str, Any]) -> float:
        """Calculate API complexity score (0.0 to 1.0+)"""
        score = 0.0
        
        # Count path parameters
        path = api_spec.get('path', '')
        path_params = path.count('{')
        score += path_params * self.complexity_weights['path_parameters']
        
        # Count query parameters (if specified)
        query_params = len(api_spec.get('query_params', {}))
        score += query_params * self.complexity_weights['query_parameters']
        
        # Request body complexity
        request_body = api_spec.get('request_body', {})
        if request_body:
            score += self.complexity_weights['auth_required']
            
            # Count properties in request body
            content = request_body.get('content', {})
            json_content = content.get('application/json', {})
            schema = json_content.get('schema', {})
            properties = schema.get('properties', {})
            
            score += len(properties) * self.complexity_weights['request_body_properties']
            
            # Check for nested objects and arrays
            for prop_details in properties.values():
                if prop_details.get('type') == 'object':
                    score += self.complexity_weights['nested_objects']
                elif prop_details.get('type') == 'array':
                    score += self.complexity_weights['array_properties']
        
        # Response complexity
        responses = api_spec.get('responses', {})
        success_responses = [r for code, r in responses.items() if str(code).startswith('2')]
        for response in success_responses:
            content = response.get('content', {})
            json_content = content.get('application/json', {})
            schema = json_content.get('schema', {})
            properties = schema.get('properties', {})
            score += len(properties) * self.complexity_weights['response_properties']
        
        # Authentication requirement
        if api_spec.get('security') or 'auth' in api_spec.get('tags', []):
            score += self.complexity_weights['auth_required']
        
        return score
    
    def _get_common_markers(self, api_spec: Dict[str, Any], test_type: str) -> List[str]:
        """Get common markers based on API characteristics"""
        markers = []
        
        # Critical endpoints (health checks, auth, core business logic)
        path = api_spec.get('path', '').lower()
        if any(term in path for term in ['health', 'auth', 'login', 'critical']):
            markers.append('critical')
        
        # Deprecated endpoints
        if api_spec.get('deprecated'):
            markers.append('deprecated')
        
        # Method-specific markers
        method = api_spec.get('method', 'GET').upper()
        if method != 'GET':  # Non-GET methods typically modify state
            markers.append('api_test')
        
        return markers
    
    def get_test_execution_estimate(self, markers: List[str]) -> Dict[str, Any]:
        """Get execution time and resource estimates based on markers"""
        if TestLevel.SMOKE.value in markers:
            return {
                'estimated_duration': '2-5 seconds',
                'resource_usage': 'minimal',
                'dependencies': 'mocked services preferred'
            }
        elif TestLevel.LOAD.value in markers:
            return {
                'estimated_duration': '30+ seconds',
                'resource_usage': 'high',
                'dependencies': 'dedicated test environment recommended'
            }
        else:  # Integration
            return {
                'estimated_duration': '5-30 seconds',
                'resource_usage': 'moderate', 
                'dependencies': 'live API endpoints required'
            }


# Singleton instance
_test_classifier = None

def get_test_classifier() -> TestClassifier:
    """Get singleton test classifier instance"""
    global _test_classifier
    if _test_classifier is None:
        _test_classifier = TestClassifier()
    return _test_classifier