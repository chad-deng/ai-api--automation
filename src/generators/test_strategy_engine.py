"""
Adaptive Test Strategy Engine

Intelligent test strategy selection based on endpoint characteristics,
complexity analysis, and business logic requirements.
"""

from enum import Enum
from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, field
import structlog
from src.generators.openapi_parser import (
    EndpointAnalysis, EndpointComplexity, ParameterInfo, 
    ParameterType, ValidationRule, SecurityRequirement
)

logger = structlog.get_logger()


class TestStrategy(str, Enum):
    """Available test strategies"""
    BASIC_FUNCTIONALITY = "basic_functionality"
    PARAMETER_VALIDATION = "parameter_validation"
    BOUNDARY_TESTING = "boundary_testing"
    SECURITY_TESTING = "security_testing"
    ERROR_SCENARIOS = "error_scenarios"
    AUTHENTICATION_TESTING = "authentication_testing"
    DATA_VALIDATION = "data_validation"
    SCHEMA_VALIDATION = "schema_validation"
    PERFORMANCE_TESTING = "performance_testing"
    CONCURRENCY_TESTING = "concurrency_testing"
    INTEGRATION_TESTING = "integration_testing"
    STATE_MANAGEMENT = "state_management"
    IDEMPOTENCY_TESTING = "idempotency_testing"
    RATE_LIMITING = "rate_limiting"


class TestPriority(str, Enum):
    """Test priority levels"""
    CRITICAL = "critical"      # Must be tested - core functionality
    HIGH = "high"             # Should be tested - important features
    MEDIUM = "medium"         # Good to test - edge cases
    LOW = "low"              # Optional - nice to have coverage


@dataclass
class TestRequirement:
    """Individual test requirement with configuration"""
    strategy: TestStrategy
    priority: TestPriority
    description: str
    test_cases: List[str] = field(default_factory=list)
    configuration: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[TestStrategy] = field(default_factory=list)
    estimated_cases: int = 1


@dataclass
class TestStrategyPlan:
    """Complete test strategy plan for an endpoint"""
    endpoint_id: str
    complexity: EndpointComplexity
    requirements: List[TestRequirement]
    total_estimated_cases: int
    execution_order: List[TestStrategy]
    configuration: Dict[str, Any] = field(default_factory=dict)


class TestStrategyEngine:
    """
    Intelligent test strategy selection engine
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
        
        # Strategy weight configuration based on endpoint characteristics
        self.strategy_weights = {
            # Always important
            TestStrategy.BASIC_FUNCTIONALITY: 1.0,
            TestStrategy.ERROR_SCENARIOS: 0.9,
            
            # Conditional based on parameters
            TestStrategy.PARAMETER_VALIDATION: 0.8,
            TestStrategy.BOUNDARY_TESTING: 0.7,
            TestStrategy.SECURITY_TESTING: 0.8,
            
            # Authentication dependent
            TestStrategy.AUTHENTICATION_TESTING: 0.9,
            
            # Data operation dependent
            TestStrategy.DATA_VALIDATION: 0.8,
            TestStrategy.SCHEMA_VALIDATION: 0.7,
            
            # Performance and load - DISABLED
            # TestStrategy.PERFORMANCE_TESTING: 0.6,
            # TestStrategy.CONCURRENCY_TESTING: 0.6,
            TestStrategy.RATE_LIMITING: 0.5,
            
            # Advanced scenarios
            TestStrategy.INTEGRATION_TESTING: 0.5,
            TestStrategy.STATE_MANAGEMENT: 0.6,
            TestStrategy.IDEMPOTENCY_TESTING: 0.7,
        }
        
        # Method-specific strategy applicability
        self.method_strategies = {
            'GET': [
                TestStrategy.BASIC_FUNCTIONALITY,
                TestStrategy.PARAMETER_VALIDATION,
                TestStrategy.AUTHENTICATION_TESTING,
                TestStrategy.ERROR_SCENARIOS,
                # TestStrategy.PERFORMANCE_TESTING,  # DISABLED
                TestStrategy.RATE_LIMITING
            ],
            'POST': [
                TestStrategy.BASIC_FUNCTIONALITY,
                TestStrategy.DATA_VALIDATION,
                TestStrategy.SCHEMA_VALIDATION,
                TestStrategy.SECURITY_TESTING,
                TestStrategy.AUTHENTICATION_TESTING,
                TestStrategy.ERROR_SCENARIOS,
                # TestStrategy.CONCURRENCY_TESTING,  # DISABLED
                TestStrategy.STATE_MANAGEMENT
            ],
            'PUT': [
                TestStrategy.BASIC_FUNCTIONALITY,
                TestStrategy.DATA_VALIDATION,
                TestStrategy.SCHEMA_VALIDATION,
                TestStrategy.AUTHENTICATION_TESTING,
                TestStrategy.ERROR_SCENARIOS,
                TestStrategy.IDEMPOTENCY_TESTING,
                TestStrategy.STATE_MANAGEMENT
            ],
            'PATCH': [
                TestStrategy.BASIC_FUNCTIONALITY,
                TestStrategy.DATA_VALIDATION,
                TestStrategy.AUTHENTICATION_TESTING,
                TestStrategy.ERROR_SCENARIOS,
                TestStrategy.STATE_MANAGEMENT
            ],
            'DELETE': [
                TestStrategy.BASIC_FUNCTIONALITY,
                TestStrategy.AUTHENTICATION_TESTING,
                TestStrategy.ERROR_SCENARIOS,
                TestStrategy.IDEMPOTENCY_TESTING,
                TestStrategy.STATE_MANAGEMENT
            ]
        }
        
        # Complexity-based strategy modifiers
        self.complexity_modifiers = {
            EndpointComplexity.SIMPLE: {
                'strategy_limit': 4,
                'priority_boost': {TestStrategy.BASIC_FUNCTIONALITY: 0.2},
                'priority_reduce': {TestStrategy.PERFORMANCE_TESTING: 0.3}
            },
            EndpointComplexity.MODERATE: {
                'strategy_limit': 6,
                'priority_boost': {TestStrategy.PARAMETER_VALIDATION: 0.2},
                'priority_reduce': {}
            },
            EndpointComplexity.COMPLEX: {
                'strategy_limit': 8,
                'priority_boost': {
                    TestStrategy.SCHEMA_VALIDATION: 0.2,
                    TestStrategy.BOUNDARY_TESTING: 0.1
                },
                'priority_reduce': {}
            },
            EndpointComplexity.ADVANCED: {
                'strategy_limit': 10,
                'priority_boost': {
                    TestStrategy.INTEGRATION_TESTING: 0.2,
                    TestStrategy.PERFORMANCE_TESTING: 0.1,
                    TestStrategy.CONCURRENCY_TESTING: 0.1
                },
                'priority_reduce': {}
            }
        }
    
    def generate_strategy_plan(self, endpoint: EndpointAnalysis) -> TestStrategyPlan:
        """
        Generate comprehensive test strategy plan for an endpoint
        
        Args:
            endpoint: Analyzed endpoint information
            
        Returns:
            TestStrategyPlan with selected strategies and configuration
        """
        try:
            self.logger.info("Generating test strategy plan", 
                           endpoint=endpoint.operation_id,
                           complexity=endpoint.complexity.value)
            
            # Get applicable strategies for this endpoint
            applicable_strategies = self._get_applicable_strategies(endpoint)
            
            # Score and rank strategies
            scored_strategies = self._score_strategies(endpoint, applicable_strategies)
            
            # Select final strategies based on complexity limits
            selected_strategies = self._select_strategies(endpoint, scored_strategies)
            
            # Generate test requirements for each strategy
            requirements = self._generate_requirements(endpoint, selected_strategies)
            
            # Determine execution order
            execution_order = self._determine_execution_order(requirements)
            
            # Calculate total estimated test cases
            total_cases = sum(req.estimated_cases for req in requirements)
            
            # Generate configuration
            configuration = self._generate_configuration(endpoint, requirements)
            
            plan = TestStrategyPlan(
                endpoint_id=endpoint.operation_id,
                complexity=endpoint.complexity,
                requirements=requirements,
                total_estimated_cases=total_cases,
                execution_order=execution_order,
                configuration=configuration
            )
            
            self.logger.info("Test strategy plan generated",
                           endpoint=endpoint.operation_id,
                           strategies=len(requirements),
                           estimated_cases=total_cases)
            
            return plan
            
        except Exception as e:
            self.logger.error("Failed to generate strategy plan",
                            endpoint=endpoint.operation_id,
                            error=str(e))
            raise
    
    def _get_applicable_strategies(self, endpoint: EndpointAnalysis) -> Set[TestStrategy]:
        """Get all applicable strategies for the endpoint"""
        applicable = set()
        
        # Method-specific strategies
        method_strategies = self.method_strategies.get(endpoint.method, [])
        applicable.update(method_strategies)
        
        # Parameter-based strategies
        if endpoint.parameters:
            applicable.add(TestStrategy.PARAMETER_VALIDATION)
            
            # Check for parameters with constraints (boundary testing)
            constrained_params = [p for p in endpoint.parameters if p.constraints]
            if constrained_params:
                applicable.add(TestStrategy.BOUNDARY_TESTING)
            
            # Check for string parameters (security testing)
            string_params = [p for p in endpoint.parameters if p.data_type == 'string']
            if string_params:
                applicable.add(TestStrategy.SECURITY_TESTING)
        
        # Request body based strategies
        if endpoint.request_body:
            applicable.add(TestStrategy.DATA_VALIDATION)
            
            schema = endpoint.request_body.get('schema', {})
            if schema.get('type') == 'object' and 'properties' in schema:
                applicable.add(TestStrategy.SCHEMA_VALIDATION)
        
        # Security requirement based strategies
        if endpoint.security:
            applicable.add(TestStrategy.AUTHENTICATION_TESTING)
        
        # Complex endpoint strategies
        if endpoint.complexity in [EndpointComplexity.COMPLEX, EndpointComplexity.ADVANCED]:
            # applicable.add(TestStrategy.PERFORMANCE_TESTING)  # DISABLED
            applicable.add(TestStrategy.INTEGRATION_TESTING)
        
        # State-changing operation strategies
        if endpoint.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # applicable.add(TestStrategy.CONCURRENCY_TESTING)  # DISABLED
            applicable.add(TestStrategy.STATE_MANAGEMENT)
        
        # Idempotent operation strategies
        if endpoint.method in ['GET', 'PUT', 'DELETE']:
            applicable.add(TestStrategy.IDEMPOTENCY_TESTING)
        
        return applicable
    
    def _score_strategies(self, endpoint: EndpointAnalysis, 
                         strategies: Set[TestStrategy]) -> List[Tuple[TestStrategy, float]]:
        """Score strategies based on endpoint characteristics"""
        scored = []
        
        for strategy in strategies:
            base_score = self.strategy_weights.get(strategy, 0.5)
            
            # Apply complexity modifiers
            complexity_config = self.complexity_modifiers[endpoint.complexity]
            boost = complexity_config['priority_boost'].get(strategy, 0)
            reduce = complexity_config['priority_reduce'].get(strategy, 0)
            
            final_score = base_score + boost - reduce
            
            # Ensure score stays within bounds
            final_score = max(0.0, min(1.0, final_score))
            
            scored.append((strategy, final_score))
        
        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)
        
        return scored
    
    def _select_strategies(self, endpoint: EndpointAnalysis, 
                          scored_strategies: List[Tuple[TestStrategy, float]]) -> List[TestStrategy]:
        """Select final strategies based on complexity limits and scores"""
        complexity_config = self.complexity_modifiers[endpoint.complexity]
        strategy_limit = complexity_config['strategy_limit']
        
        # Always include critical strategies
        critical_strategies = [TestStrategy.BASIC_FUNCTIONALITY, TestStrategy.ERROR_SCENARIOS]
        selected = [s for s, _ in scored_strategies if s in critical_strategies]
        
        # Add remaining strategies up to limit
        remaining_slots = strategy_limit - len(selected)
        for strategy, score in scored_strategies:
            if strategy not in selected and len(selected) < strategy_limit:
                # Only add if score is above threshold
                if score >= 0.6:  # Minimum threshold for inclusion
                    selected.append(strategy)
        
        return selected
    
    def _generate_requirements(self, endpoint: EndpointAnalysis, 
                             strategies: List[TestStrategy]) -> List[TestRequirement]:
        """Generate detailed test requirements for each strategy"""
        requirements = []
        
        for strategy in strategies:
            requirement = self._create_requirement(strategy, endpoint)
            requirements.append(requirement)
        
        return requirements
    
    def _create_requirement(self, strategy: TestStrategy, 
                           endpoint: EndpointAnalysis) -> TestRequirement:
        """Create detailed requirement for a specific strategy"""
        
        if strategy == TestStrategy.BASIC_FUNCTIONALITY:
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.CRITICAL,
                description="Test basic endpoint functionality with valid data",
                test_cases=[
                    "test_successful_request",
                    "test_response_structure",
                    "test_response_status_code"
                ],
                estimated_cases=3,
                configuration={
                    'success_status_codes': [200, 201, 204],
                    'validate_response_schema': True
                }
            )
        
        elif strategy == TestStrategy.PARAMETER_VALIDATION:
            test_cases = []
            config = {'parameters': []}
            
            for param in endpoint.parameters:
                test_cases.extend([
                    f"test_{param.name}_required" if param.required else f"test_{param.name}_optional",
                    f"test_{param.name}_type_validation",
                    f"test_{param.name}_format_validation" if param.format_type else None
                ])
                
                config['parameters'].append({
                    'name': param.name,
                    'type': param.data_type,
                    'required': param.required,
                    'constraints': param.constraints
                })
            
            # Remove None values
            test_cases = [tc for tc in test_cases if tc is not None]
            
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.HIGH,
                description="Validate all parameter constraints and requirements",
                test_cases=test_cases,
                estimated_cases=len(test_cases),
                configuration=config
            )
        
        elif strategy == TestStrategy.BOUNDARY_TESTING:
            constrained_params = [p for p in endpoint.parameters if p.constraints]
            test_cases = []
            
            for param in constrained_params:
                constraints = param.constraints
                if 'min_length' in constraints or 'max_length' in constraints:
                    test_cases.extend([
                        f"test_{param.name}_minimum_length",
                        f"test_{param.name}_maximum_length",
                        f"test_{param.name}_below_minimum",
                        f"test_{param.name}_above_maximum"
                    ])
                
                if 'minimum' in constraints or 'maximum' in constraints:
                    test_cases.extend([
                        f"test_{param.name}_minimum_value",
                        f"test_{param.name}_maximum_value",
                        f"test_{param.name}_below_minimum",
                        f"test_{param.name}_above_maximum"
                    ])
            
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.HIGH,
                description="Test boundary values and edge cases",
                test_cases=test_cases,
                estimated_cases=len(test_cases),
                configuration={'boundary_params': constrained_params}
            )
        
        elif strategy == TestStrategy.SECURITY_TESTING:
            string_params = [p for p in endpoint.parameters if p.data_type == 'string']
            test_cases = [
                "test_sql_injection_attempts",
                "test_xss_injection_attempts",
                "test_command_injection_attempts",
                "test_path_traversal_attempts"
            ]
            
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.HIGH,
                description="Test security vulnerabilities and injection attacks",
                test_cases=test_cases,
                estimated_cases=len(test_cases) * len(string_params) if string_params else 4,
                configuration={'string_parameters': [p.name for p in string_params]}
            )
        
        elif strategy == TestStrategy.ERROR_SCENARIOS:
            test_cases = [
                "test_400_bad_request",
                "test_404_not_found",
                "test_500_internal_error"
            ]
            
            if endpoint.security:
                test_cases.extend([
                    "test_401_unauthorized",
                    "test_403_forbidden"
                ])
            
            if endpoint.method in ['POST', 'PUT', 'PATCH']:
                test_cases.extend([
                    "test_415_unsupported_media_type",
                    "test_422_validation_error"
                ])
            
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.CRITICAL,
                description="Test error handling and edge cases",
                test_cases=test_cases,
                estimated_cases=len(test_cases)
            )
        
        elif strategy == TestStrategy.AUTHENTICATION_TESTING:
            test_cases = [
                "test_missing_authentication",
                "test_invalid_token",
                "test_expired_token"
            ]
            
            # Add scope-based tests if applicable
            scoped_security = [s for s in endpoint.security if s.scopes]
            if scoped_security:
                test_cases.extend([
                    "test_insufficient_scope",
                    "test_valid_scope"
                ])
            
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.CRITICAL,
                description="Test authentication and authorization requirements",
                test_cases=test_cases,
                estimated_cases=len(test_cases),
                configuration={'security_schemes': endpoint.security}
            )
        
        elif strategy == TestStrategy.DATA_VALIDATION:
            if not endpoint.request_body:
                return TestRequirement(
                    strategy=strategy,
                    priority=TestPriority.MEDIUM,
                    description="No request body to validate",
                    test_cases=[],
                    estimated_cases=0
                )
            
            schema = endpoint.request_body.get('schema', {})
            test_cases = [
                "test_valid_payload",
                "test_missing_required_fields",
                "test_invalid_data_types",
                "test_additional_properties"
            ]
            
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.HIGH,
                description="Validate request body data and schema compliance",
                test_cases=test_cases,
                estimated_cases=len(test_cases),
                configuration={'request_schema': schema}
            )
        
        elif strategy == TestStrategy.PERFORMANCE_TESTING:
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.MEDIUM,
                description="Test endpoint performance and response times",
                test_cases=[
                    "test_response_time",
                    "test_concurrent_requests",
                    "test_load_capacity"
                ],
                estimated_cases=3,
                configuration={
                    'max_response_time_ms': 1000,
                    'concurrent_requests': 10,
                    'load_test_duration': 30
                }
            )
        
        elif strategy == TestStrategy.CONCURRENCY_TESTING:
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.MEDIUM,
                description="Test concurrent access and race conditions",
                test_cases=[
                    "test_concurrent_modifications",
                    "test_race_condition_handling",
                    "test_data_consistency"
                ],
                estimated_cases=3,
                configuration={
                    'concurrent_users': 5,
                    'test_iterations': 10
                }
            )
        
        elif strategy == TestStrategy.IDEMPOTENCY_TESTING:
            return TestRequirement(
                strategy=strategy,
                priority=TestPriority.HIGH if endpoint.method in ['PUT', 'DELETE'] else TestPriority.MEDIUM,
                description="Test idempotent behavior for safe methods",
                test_cases=[
                    "test_multiple_identical_requests",
                    "test_state_unchanged"
                ],
                estimated_cases=2,
                configuration={'repetition_count': 3}
            )
        
        # Default fallback
        return TestRequirement(
            strategy=strategy,
            priority=TestPriority.MEDIUM,
            description=f"Test {strategy.value}",
            test_cases=[f"test_{strategy.value}"],
            estimated_cases=1
        )
    
    def _determine_execution_order(self, requirements: List[TestRequirement]) -> List[TestStrategy]:
        """Determine optimal execution order for test strategies"""
        
        # Priority-based ordering
        priority_order = {
            TestPriority.CRITICAL: 0,
            TestPriority.HIGH: 1,
            TestPriority.MEDIUM: 2,
            TestPriority.LOW: 3
        }
        
        # Logical execution order preferences
        preferred_order = [
            TestStrategy.BASIC_FUNCTIONALITY,
            TestStrategy.AUTHENTICATION_TESTING,
            TestStrategy.PARAMETER_VALIDATION,
            TestStrategy.DATA_VALIDATION,
            TestStrategy.SCHEMA_VALIDATION,
            TestStrategy.BOUNDARY_TESTING,
            TestStrategy.ERROR_SCENARIOS,
            TestStrategy.SECURITY_TESTING,
            TestStrategy.PERFORMANCE_TESTING,
            TestStrategy.CONCURRENCY_TESTING,
            TestStrategy.IDEMPOTENCY_TESTING,
            TestStrategy.STATE_MANAGEMENT,
            TestStrategy.INTEGRATION_TESTING,
            TestStrategy.RATE_LIMITING
        ]
        
        # Sort requirements by priority first, then by preferred order
        sorted_requirements = sorted(
            requirements,
            key=lambda r: (
                priority_order[r.priority],
                preferred_order.index(r.strategy) if r.strategy in preferred_order else 999
            )
        )
        
        return [req.strategy for req in sorted_requirements]
    
    def _generate_configuration(self, endpoint: EndpointAnalysis, 
                               requirements: List[TestRequirement]) -> Dict[str, Any]:
        """Generate overall configuration for the test plan"""
        return {
            'endpoint': {
                'method': endpoint.method,
                'path': endpoint.path,
                'operation_id': endpoint.operation_id,
                'complexity': endpoint.complexity.value
            },
            'test_data': {
                'generate_realistic_data': True,
                'include_edge_cases': True,
                'security_test_vectors': True
            },
            'execution': {
                'parallel_execution': endpoint.complexity != EndpointComplexity.SIMPLE,
                'retry_on_failure': True,
                'timeout_seconds': 30
            },
            'reporting': {
                'detailed_assertions': True,
                'performance_metrics': TestStrategy.PERFORMANCE_TESTING in [r.strategy for r in requirements],
                'security_findings': TestStrategy.SECURITY_TESTING in [r.strategy for r in requirements]
            }
        }
    
    def optimize_strategy_plan(self, plan: TestStrategyPlan, 
                              constraints: Dict[str, Any] = None) -> TestStrategyPlan:
        """
        Optimize test strategy plan based on constraints
        
        Args:
            plan: Original test strategy plan
            constraints: Optional constraints like time, resources, priority
            
        Returns:
            Optimized test strategy plan
        """
        if not constraints:
            return plan
        
        max_cases = constraints.get('max_test_cases')
        min_priority = constraints.get('min_priority', TestPriority.LOW)
        
        if max_cases and plan.total_estimated_cases > max_cases:
            # Filter by priority and estimated cases
            priority_order = [TestPriority.CRITICAL, TestPriority.HIGH, TestPriority.MEDIUM, TestPriority.LOW]
            min_priority_idx = priority_order.index(TestPriority(min_priority))
            
            filtered_requirements = []
            case_count = 0
            
            for priority in priority_order[:min_priority_idx + 1]:
                priority_requirements = [r for r in plan.requirements if r.priority == priority]
                
                for req in sorted(priority_requirements, key=lambda r: r.estimated_cases):
                    if case_count + req.estimated_cases <= max_cases:
                        filtered_requirements.append(req)
                        case_count += req.estimated_cases
                    else:
                        break
                
                if case_count >= max_cases:
                    break
            
            # Update plan
            plan.requirements = filtered_requirements
            plan.total_estimated_cases = sum(req.estimated_cases for req in filtered_requirements)
            plan.execution_order = self._determine_execution_order(filtered_requirements)
        
        return plan
    
    def get_strategy_recommendations(self, endpoint: EndpointAnalysis) -> Dict[str, Any]:
        """
        Get strategy recommendations with explanations
        
        Returns:
            Dict with recommendations and reasoning
        """
        applicable_strategies = self._get_applicable_strategies(endpoint)
        scored_strategies = self._score_strategies(endpoint, applicable_strategies)
        
        recommendations = {
            'high_priority': [],
            'medium_priority': [],
            'low_priority': [],
            'reasoning': {}
        }
        
        for strategy, score in scored_strategies:
            strategy_info = {
                'strategy': strategy.value,
                'score': score,
                'estimated_cases': self._estimate_cases_for_strategy(strategy, endpoint)
            }
            
            if score >= 0.8:
                recommendations['high_priority'].append(strategy_info)
            elif score >= 0.6:
                recommendations['medium_priority'].append(strategy_info)
            else:
                recommendations['low_priority'].append(strategy_info)
            
            # Add reasoning
            recommendations['reasoning'][strategy.value] = self._get_strategy_reasoning(strategy, endpoint)
        
        return recommendations
    
    def _estimate_cases_for_strategy(self, strategy: TestStrategy, endpoint: EndpointAnalysis) -> int:
        """Estimate number of test cases for a strategy"""
        if strategy == TestStrategy.PARAMETER_VALIDATION:
            return len(endpoint.parameters) * 2  # Type + format validation
        elif strategy == TestStrategy.BOUNDARY_TESTING:
            constrained_params = [p for p in endpoint.parameters if p.constraints]
            return len(constrained_params) * 4  # Min, max, below, above
        elif strategy == TestStrategy.SECURITY_TESTING:
            string_params = [p for p in endpoint.parameters if p.data_type == 'string']
            return len(string_params) * 4  # Different injection types
        else:
            return 3  # Default estimate
    
    def _get_strategy_reasoning(self, strategy: TestStrategy, endpoint: EndpointAnalysis) -> str:
        """Get reasoning for why a strategy is recommended"""
        if strategy == TestStrategy.BASIC_FUNCTIONALITY:
            return "Essential for verifying core endpoint functionality"
        elif strategy == TestStrategy.PARAMETER_VALIDATION:
            param_count = len(endpoint.parameters)
            return f"Endpoint has {param_count} parameters requiring validation"
        elif strategy == TestStrategy.SECURITY_TESTING:
            string_params = [p for p in endpoint.parameters if p.data_type == 'string']
            return f"Endpoint has {len(string_params)} string parameters vulnerable to injection"
        elif strategy == TestStrategy.PERFORMANCE_TESTING:
            return f"Complex endpoint ({endpoint.complexity.value}) may have performance implications"
        elif strategy == TestStrategy.AUTHENTICATION_TESTING:
            return f"Endpoint requires authentication ({len(endpoint.security)} security schemes)"
        else:
            return f"Recommended based on endpoint method ({endpoint.method}) and complexity"