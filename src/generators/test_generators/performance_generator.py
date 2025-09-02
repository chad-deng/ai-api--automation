"""
Performance Test Generator

Generates load testing and performance test scenarios using pytest-benchmark
and concurrent request patterns to validate API performance characteristics.
"""

import json
from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from src.config.settings import Settings
import structlog

logger = structlog.get_logger()

@dataclass
class PerformanceTest:
    """Represents a performance test configuration"""
    name: str
    description: str
    test_type: str  # 'load', 'stress', 'spike', 'endurance', 'response_time'
    concurrent_users: int
    requests_per_user: int
    max_response_time_ms: int
    test_payload: Dict[str, Any]
    test_headers: Optional[Dict[str, str]] = None
    ramp_up_duration: int = 5  # seconds
    test_duration: int = 60  # seconds for endurance tests
    success_rate_threshold: float = 0.95  # 95% success rate required

@dataclass
class LoadTestConfig:
    """Configuration for different load test scenarios"""
    light_load: Tuple[int, int] = (5, 10)    # (users, requests_per_user)
    normal_load: Tuple[int, int] = (10, 20)  # (users, requests_per_user)
    heavy_load: Tuple[int, int] = (25, 50)   # (users, requests_per_user)
    stress_load: Tuple[int, int] = (50, 100) # (users, requests_per_user)

class PerformanceTestGenerator:
    """
    Generates comprehensive performance test scenarios for API endpoints
    """
    
    def __init__(self, load_config: Optional[LoadTestConfig] = None):
        self.logger = structlog.get_logger()
        self.load_config = load_config or LoadTestConfig()
    
    def generate_performance_tests(self, api_spec: Dict[str, Any]) -> List[PerformanceTest]:
        """
        Generate all performance test scenarios for an API endpoint
        
        Args:
            api_spec: API specification dictionary
            
        Returns:
            List of PerformanceTest objects
        """
        tests = []
        
        # Response time benchmarks
        tests.extend(self._generate_response_time_tests(api_spec))
        
        # Load testing scenarios
        tests.extend(self._generate_load_tests(api_spec))
        
        # Concurrent user scenarios
        tests.extend(self._generate_concurrency_tests(api_spec))
        
        # Stress testing scenarios
        tests.extend(self._generate_stress_tests(api_spec))
        
        # Spike testing scenarios
        tests.extend(self._generate_spike_tests(api_spec))
        
        # Endurance testing scenarios
        tests.extend(self._generate_endurance_tests(api_spec))
        
        self.logger.info(f"Generated {len(tests)} performance tests for {api_spec.get('path')}")
        return tests
    
    def _generate_response_time_tests(self, api_spec: Dict[str, Any]) -> List[PerformanceTest]:
        """Generate response time benchmark tests"""
        tests = []
        
        # Basic response time test
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_response_time_baseline",
            description="Measure baseline response time for single request",
            test_type="response_time",
            concurrent_users=1,
            requests_per_user=1,
            max_response_time_ms=self._get_max_response_time(api_spec),
            test_payload=self._generate_test_payload(api_spec)
        ))
        
        # Response time under load
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_response_time_under_load",
            description="Measure response time consistency under moderate load",
            test_type="response_time",
            concurrent_users=10,
            requests_per_user=5,
            max_response_time_ms=self._get_max_response_time(api_spec) * 2,  # Allow 2x baseline
            test_payload=self._generate_test_payload(api_spec)
        ))
        
        return tests
    
    def _generate_load_tests(self, api_spec: Dict[str, Any]) -> List[PerformanceTest]:
        """Generate load testing scenarios"""
        tests = []
        
        # Light load test
        users, requests = self.load_config.light_load
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_light_load",
            description=f"Light load test: {users} concurrent users, {requests} requests each",
            test_type="load",
            concurrent_users=users,
            requests_per_user=requests,
            max_response_time_ms=self._get_max_response_time(api_spec) * 3,
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=5
        ))
        
        # Normal load test
        users, requests = self.load_config.normal_load
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_normal_load",
            description=f"Normal load test: {users} concurrent users, {requests} requests each",
            test_type="load",
            concurrent_users=users,
            requests_per_user=requests,
            max_response_time_ms=self._get_max_response_time(api_spec) * 4,
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=10
        ))
        
        # Heavy load test
        users, requests = self.load_config.heavy_load
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_heavy_load",
            description=f"Heavy load test: {users} concurrent users, {requests} requests each",
            test_type="load",
            concurrent_users=users,
            requests_per_user=requests,
            max_response_time_ms=self._get_max_response_time(api_spec) * 5,
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=15,
            success_rate_threshold=0.90  # Allow slightly lower success rate under heavy load
        ))
        
        return tests
    
    def _generate_concurrency_tests(self, api_spec: Dict[str, Any]) -> List[PerformanceTest]:
        """Generate concurrent user tests"""
        tests = []
        
        # Test increasing concurrency levels
        concurrency_levels = [1, 5, 10, 20, 50]
        
        for level in concurrency_levels:
            tests.append(PerformanceTest(
                name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_concurrent_{level}_users",
                description=f"Test with {level} concurrent users making simultaneous requests",
                test_type="concurrency",
                concurrent_users=level,
                requests_per_user=3,
                max_response_time_ms=self._get_max_response_time(api_spec) * (1 + level // 10),
                test_payload=self._generate_test_payload(api_spec),
                ramp_up_duration=0  # Immediate concurrency
            ))
        
        return tests
    
    def _generate_stress_tests(self, api_spec: Dict[str, Any]) -> List[PerformanceTest]:
        """Generate stress testing scenarios"""
        tests = []
        
        # High-load stress test
        users, requests = self.load_config.stress_load
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_stress_test",
            description=f"Stress test: {users} concurrent users, {requests} requests each",
            test_type="stress",
            concurrent_users=users,
            requests_per_user=requests,
            max_response_time_ms=self._get_max_response_time(api_spec) * 10,  # Very lenient for stress
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=30,  # Gradual ramp-up for stress test
            success_rate_threshold=0.80  # Lower success rate acceptable under stress
        ))
        
        # Resource exhaustion test
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_resource_exhaustion",
            description="Test behavior when system resources are exhausted",
            test_type="stress",
            concurrent_users=100,
            requests_per_user=10,
            max_response_time_ms=30000,  # 30 seconds max
            test_payload=self._generate_large_payload(api_spec),
            ramp_up_duration=60,
            success_rate_threshold=0.70  # Expect some failures under extreme stress
        ))
        
        return tests
    
    def _generate_spike_tests(self, api_spec: Dict[str, Any]) -> List[PerformanceTest]:
        """Generate spike testing scenarios"""
        tests = []
        
        # Sudden traffic spike
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_traffic_spike",
            description="Test sudden spike in traffic (0 to high load instantly)",
            test_type="spike",
            concurrent_users=50,
            requests_per_user=10,
            max_response_time_ms=self._get_max_response_time(api_spec) * 8,
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=0,  # Immediate spike
            success_rate_threshold=0.85
        ))
        
        # Repeated spike pattern
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_repeated_spikes",
            description="Test repeated traffic spikes over time",
            test_type="spike",
            concurrent_users=30,
            requests_per_user=20,
            max_response_time_ms=self._get_max_response_time(api_spec) * 6,
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=5,
            test_duration=300,  # 5 minutes of repeated spikes
            success_rate_threshold=0.90
        ))
        
        return tests
    
    def _generate_endurance_tests(self, api_spec: Dict[str, Any]) -> List[PerformanceTest]:
        """Generate endurance testing scenarios"""
        tests = []
        
        # Long-running endurance test
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_endurance",
            description="Long-running test to detect memory leaks and degradation",
            test_type="endurance",
            concurrent_users=10,
            requests_per_user=100,  # Many requests over time
            max_response_time_ms=self._get_max_response_time(api_spec) * 3,
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=30,
            test_duration=1800,  # 30 minutes
            success_rate_threshold=0.95
        ))
        
        # Memory leak detection
        tests.append(PerformanceTest(
            name=f"test_{api_spec.get('operationId', 'endpoint').lower()}_memory_leak_detection",
            description="Test for memory leaks over extended period",
            test_type="endurance",
            concurrent_users=5,
            requests_per_user=200,  # Very many requests
            max_response_time_ms=self._get_max_response_time(api_spec) * 2,
            test_payload=self._generate_test_payload(api_spec),
            ramp_up_duration=60,
            test_duration=3600,  # 1 hour
            success_rate_threshold=0.98
        ))
        
        return tests
    
    def _get_max_response_time(self, api_spec: Dict[str, Any]) -> int:
        """Determine appropriate max response time based on operation type"""
        method = api_spec.get('method', 'GET')
        
        # Different operations have different expected response times
        response_time_map = {
            'GET': 500,    # 500ms for reads
            'POST': 1000,  # 1s for creates
            'PUT': 1000,   # 1s for full updates
            'PATCH': 800,  # 800ms for partial updates
            'DELETE': 600  # 600ms for deletes
        }
        
        return response_time_map.get(method, 1000)
    
    def _generate_test_payload(self, api_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate realistic test payload for the API"""
        request_body = api_spec.get('request_body', {})
        if not request_body:
            return {"test": "performance_data"}
        
        schema = request_body.get('content', {}).get('application/json', {}).get('schema', {})
        properties = schema.get('properties', {})
        
        if not properties:
            return {"test": "performance_data"}
        
        payload = {}
        for prop_name, prop_info in properties.items():
            prop_type = prop_info.get('type', 'string')
            
            if prop_type == 'string':
                payload[prop_name] = f"perf_test_{prop_name}"
            elif prop_type == 'integer':
                payload[prop_name] = 42
            elif prop_type == 'number':
                payload[prop_name] = 42.0
            elif prop_type == 'boolean':
                payload[prop_name] = True
            elif prop_type == 'array':
                payload[prop_name] = ["item1", "item2"]
            elif prop_type == 'object':
                payload[prop_name] = {"nested": "value"}
            else:
                payload[prop_name] = f"test_{prop_name}"
        
        return payload
    
    def _generate_large_payload(self, api_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate large payload for resource exhaustion tests"""
        base_payload = self._generate_test_payload(api_spec)
        
        # Add large data field to test resource limits
        base_payload["large_data"] = "x" * 10000  # 10KB of data
        base_payload["description"] = "Large payload for resource exhaustion testing"
        
        return base_payload
    
    def generate_test_file(self, api_spec: Dict[str, Any], output_dir: str) -> str:
        """
        Generate a complete performance test file
        
        Args:
            api_spec: API specification dictionary
            output_dir: Directory to save the test file
            
        Returns:
            Path to the generated test file
        """
        tests = self.generate_performance_tests(api_spec)
        
        # Generate test file content
        test_content = self._generate_test_file_content(api_spec, tests)
        
        # Save to file
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        filename = f"test_{operation_id}_performance.py"
        output_path = Path(output_dir) / filename
        
        with open(output_path, 'w') as f:
            f.write(test_content)
        
        self.logger.info(f"Generated performance test file: {output_path}")
        return str(output_path)
    
    def _generate_test_file_content(self, api_spec: Dict[str, Any], tests: List[PerformanceTest]) -> str:
        """Generate the actual test file content"""
        operation_id = api_spec.get('operationId', 'endpoint')
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        description = api_spec.get('description', f'{operation_id} endpoint')
        
        content = f'''import pytest
import httpx
import asyncio
import time
import statistics
from typing import Dict, Any, List, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import json

# Performance Tests for: {description}
# Method: {method}
# Path: {path}
# Generated: Week 3 Performance Test Generation

BASE_URL = settings.test_api_base_url

class TestPerformanceEndpoint:
    
    @pytest.fixture
    def client(self):
        return httpx.AsyncClient(
            base_url=BASE_URL,
            timeout=httpx.Timeout(30.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=100, max_connections=200)
        )
    
    @pytest.fixture
    def auth_headers(self):
        \"\"\"Authentication headers for performance tests\"\"\"
        return {"Authorization": "Bearer {auth_token}"}
    
    async def _measure_single_request(self, client: httpx.AsyncClient, 
                                    payload: Dict[str, Any], 
                                    headers: Dict[str, str]) -> Tuple[int, float]:
        \"\"\"Measure a single request and return (status_code, response_time_ms)\"\"\"
        start_time = time.perf_counter()
        
        try:
            response = await client.{method.lower()}("{path}", json=payload, headers=headers)
            end_time = time.perf_counter()
            response_time_ms = (end_time - start_time) * 1000
            return response.status_code, response_time_ms
        except Exception as e:
            end_time = time.perf_counter()
            response_time_ms = (end_time - start_time) * 1000
            # Return error status for failed requests
            return 0, response_time_ms
    
    async def _run_concurrent_requests(self, client: httpx.AsyncClient,
                                     concurrent_users: int,
                                     requests_per_user: int,
                                     payload: Dict[str, Any],
                                     headers: Dict[str, str],
                                     ramp_up_duration: int = 0) -> List[Tuple[int, float]]:
        \"\"\"Run concurrent requests and return list of (status_code, response_time_ms)\"\"\"
        
        async def user_requests(user_id: int):
            # Stagger user start times for ramp-up
            if ramp_up_duration > 0:
                delay = (user_id / concurrent_users) * ramp_up_duration
                await asyncio.sleep(delay)
            
            results = []
            for _ in range(requests_per_user):
                result = await self._measure_single_request(client, payload, headers)
                results.append(result)
            return results
        
        # Create tasks for all users
        tasks = [user_requests(i) for i in range(concurrent_users)]
        
        # Execute all user tasks concurrently
        user_results = await asyncio.gather(*tasks)
        
        # Flatten results
        all_results = []
        for user_result in user_results:
            all_results.extend(user_result)
        
        return all_results
    
    def _analyze_results(self, results: List[Tuple[int, float]], 
                        max_response_time_ms: int,
                        success_rate_threshold: float) -> Dict[str, Any]:
        \"\"\"Analyze performance test results\"\"\"
        total_requests = len(results)
        successful_requests = len([r for r in results if 200 <= r[0] < 400])
        failed_requests = total_requests - successful_requests
        
        success_rate = successful_requests / total_requests if total_requests > 0 else 0
        
        response_times = [r[1] for r in results if r[0] != 0]  # Exclude failed requests
        
        if response_times:
            avg_response_time = statistics.mean(response_times)
            min_response_time = min(response_times)
            max_response_time = max(response_times)
            p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max(response_times)
            p99_response_time = statistics.quantiles(response_times, n=100)[98] if len(response_times) > 100 else max(response_times)
        else:
            avg_response_time = min_response_time = max_response_time = p95_response_time = p99_response_time = 0
        
        return {
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "success_rate": success_rate,
            "avg_response_time_ms": avg_response_time,
            "min_response_time_ms": min_response_time,
            "max_response_time_ms": max_response_time,
            "p95_response_time_ms": p95_response_time,
            "p99_response_time_ms": p99_response_time,
            "success_rate_threshold": success_rate_threshold,
            "max_response_time_threshold": max_response_time_ms,
            "meets_success_criteria": success_rate >= success_rate_threshold,
            "meets_response_time_criteria": p95_response_time <= max_response_time_ms if response_times else False
        }
    
'''
        
        # Generate test methods for each performance test
        for test in tests:
            content += self._generate_performance_test_method(test, api_spec)
            content += "\n"
        
        # Add summary test
        content += self._generate_performance_summary_test(api_spec)
        
        return content
    
    def _generate_performance_test_method(self, test: PerformanceTest, api_spec: Dict[str, Any]) -> str:
        """Generate a single performance test method"""
        payload_str = json.dumps(test.test_payload, indent=8)[:-1] + "    }" if test.test_payload else "{}"
        headers_str = json.dumps(test.test_headers or {}, indent=8)[:-1] + "    }" if test.test_headers else "{}"
        
        method_code = f'''    @pytest.mark.asyncio
    @pytest.mark.performance
    async def {test.name}(self, client, auth_headers):
        \"\"\"{test.description}\"\"\"
        
        # Test configuration
        payload = {payload_str}
        headers = dict(auth_headers, **{headers_str})
        
        concurrent_users = {test.concurrent_users}
        requests_per_user = {test.requests_per_user}
        max_response_time_ms = {test.max_response_time_ms}
        success_rate_threshold = {test.success_rate_threshold}
        ramp_up_duration = {test.ramp_up_duration}
        
        print(f"\\nRunning {concurrent_users} concurrent users, {requests_per_user} requests each")
        print(f"Expected: <{test.success_rate_threshold:.1%} success rate, <{max_response_time_ms}ms response time")
        
        start_time = time.perf_counter()
        
        # Execute the performance test
        results = await self._run_concurrent_requests(
            client, concurrent_users, requests_per_user, 
            payload, headers, ramp_up_duration
        )
        
        end_time = time.perf_counter()
        total_duration = end_time - start_time
        
        # Analyze results
        analysis = self._analyze_results(results, max_response_time_ms, success_rate_threshold)
        
        # Print detailed results
        print(f"\\nPerformance Test Results:")
        print(f"  Total Duration: {total_duration:.2f}s")
        print(f"  Total Requests: {analysis['total_requests']}")
        print(f"  Successful: {analysis['successful_requests']}")
        print(f"  Failed: {analysis['failed_requests']}")
        print(f"  Success Rate: {analysis['success_rate']:.1%}")
        print(f"  Avg Response Time: {analysis['avg_response_time_ms']:.1f}ms")
        print(f"  Min Response Time: {analysis['min_response_time_ms']:.1f}ms")
        print(f"  Max Response Time: {analysis['max_response_time_ms']:.1f}ms")
        print(f"  95th Percentile: {analysis['p95_response_time_ms']:.1f}ms")
        print(f"  99th Percentile: {analysis['p99_response_time_ms']:.1f}ms")
        print(f"  Throughput: {analysis['total_requests'] / total_duration:.1f} req/s")
        
        # Assertions'''
        
        if test.test_type == "stress":
            method_code += '''
        
        # For stress tests, we're more lenient with requirements
        assert analysis['success_rate'] >= success_rate_threshold, \\
            f"Success rate {analysis['success_rate']:.1%} below threshold {success_rate_threshold:.1%}"
        
        # Don't fail stress tests on response time, just log it
        if not analysis['meets_response_time_criteria']:
            print(f"  WARNING: 95th percentile response time {analysis['p95_response_time_ms']:.1f}ms exceeds {max_response_time_ms}ms threshold")'''
        
        elif test.test_type == "endurance":
            method_code += '''
        
        # For endurance tests, focus on consistency and no degradation
        assert analysis['success_rate'] >= success_rate_threshold, \\
            f"Success rate {analysis['success_rate']:.1%} below threshold {success_rate_threshold:.1%}"
        
        # Check that response times are reasonable (allow some degradation)
        assert analysis['p95_response_time_ms'] <= max_response_time_ms, \\
            f"95th percentile response time {analysis['p95_response_time_ms']:.1f}ms exceeds {max_response_time_ms}ms"
        
        # Check for potential memory leaks (response time shouldn't increase dramatically)
        response_times = [r[1] for r in results if 200 <= r[0] < 400]
        if len(response_times) >= 100:
            first_quarter = response_times[:len(response_times)//4]
            last_quarter = response_times[-len(response_times)//4:]
            
            if first_quarter and last_quarter:
                avg_first = statistics.mean(first_quarter)
                avg_last = statistics.mean(last_quarter)
                degradation_ratio = avg_last / avg_first if avg_first > 0 else 1
                
                print(f"  Performance Degradation: {degradation_ratio:.2f}x")
                
                # Allow up to 50% degradation in long-running tests
                assert degradation_ratio <= 1.5, \\
                    f"Performance degraded too much: {degradation_ratio:.2f}x from start to finish"'''
        
        else:
            # Standard performance test assertions
            method_code += '''
        
        # Standard performance assertions
        assert analysis['success_rate'] >= success_rate_threshold, \\
            f"Success rate {analysis['success_rate']:.1%} below threshold {success_rate_threshold:.1%}"
        
        assert analysis['p95_response_time_ms'] <= max_response_time_ms, \\
            f"95th percentile response time {analysis['p95_response_time_ms']:.1f}ms exceeds {max_response_time_ms}ms threshold"
        
        # Additional checks for specific test types'''
            
            if test.test_type == "response_time":
                method_code += '''
        
        # For response time tests, also check average
        assert analysis['avg_response_time_ms'] <= max_response_time_ms * 0.8, \\
            f"Average response time {analysis['avg_response_time_ms']:.1f}ms exceeds 80% of threshold"'''
            
            elif test.test_type == "load":
                method_code += '''
        
        # For load tests, ensure throughput is reasonable
        throughput = analysis['total_requests'] / total_duration
        expected_min_throughput = concurrent_users * 0.5  # At least 0.5 req/s per user
        
        assert throughput >= expected_min_throughput, \\
            f"Throughput {throughput:.1f} req/s below expected minimum {expected_min_throughput:.1f} req/s"'''
        
        return method_code
    
    def _generate_performance_summary_test(self, api_spec: Dict[str, Any]) -> str:
        """Generate a summary test that runs a quick performance check"""
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        return f'''    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_{operation_id}_performance_summary(self, client, auth_headers):
        \"\"\"Quick performance summary test covering key scenarios\"\"\"
        
        payload = {"test": "performance_summary"}
        
        # Test scenarios: (users, requests_per_user, description)
        scenarios = [
            (1, 5, "Baseline"),
            (5, 10, "Light Load"),
            (10, 20, "Normal Load"),
            (20, 10, "High Concurrency")
        ]
        
        results_summary = []
        
        for users, requests, description in scenarios:
            print(f"\\nTesting {description}: {users} users, {requests} requests each")
            
            start_time = time.perf_counter()
            results = await self._run_concurrent_requests(
                client, users, requests, payload, auth_headers, ramp_up_duration=2
            )
            end_time = time.perf_counter()
            
            duration = end_time - start_time
            analysis = self._analyze_results(results, 5000, 0.90)  # 5s max, 90% success
            throughput = len(results) / duration
            
            scenario_result = {
                "scenario": description,
                "users": users,
                "requests": requests,
                "success_rate": analysis['success_rate'],
                "avg_response_time": analysis['avg_response_time_ms'],
                "p95_response_time": analysis['p95_response_time_ms'],
                "throughput": throughput,
                "duration": duration
            }
            
            results_summary.append(scenario_result)
            
            print(f"  Success Rate: {analysis['success_rate']:.1%}")
            print(f"  Avg Response: {analysis['avg_response_time_ms']:.1f}ms")
            print(f"  95th Percentile: {analysis['p95_response_time_ms']:.1f}ms")
            print(f"  Throughput: {throughput:.1f} req/s")
        
        # Print summary comparison
        print(f"\\nPerformance Summary Comparison:")
        print(f"{'Scenario':<15} {'Users':<6} {'Success%':<9} {'Avg(ms)':<8} {'P95(ms)':<8} {'Req/s':<8}")
        print("-" * 60)
        
        for result in results_summary:
            print(f"{result['scenario']:<15} "
                  f"{result['users']:<6} "
                  f"{result['success_rate']:.1%:<8} "
                  f"{result['avg_response_time']:.1f:<8} "
                  f"{result['p95_response_time']:.1f:<8} "
                  f"{result['throughput']:.1f:<8}")
        
        # Basic assertions - at least baseline should work well
        baseline = results_summary[0]  # First scenario is baseline
        assert baseline['success_rate'] >= 0.95, f"Baseline success rate too low: {baseline['success_rate']:.1%}"
        assert baseline['p95_response_time'] <= 2000, f"Baseline P95 response time too high: {baseline['p95_response_time']:.1f}ms"
        
        # Check that performance doesn't degrade too much under load
        high_load = results_summary[-1]  # Last scenario is highest load
        degradation_factor = high_load['p95_response_time'] / baseline['p95_response_time'] if baseline['p95_response_time'] > 0 else 1
        
        print(f"\\nPerformance degradation under load: {degradation_factor:.1f}x")
        
        # Allow up to 10x degradation under high load (very lenient)
        assert degradation_factor <= 10, f"Performance degraded too much under load: {degradation_factor:.1f}x"
        
        print("\\nPerformance summary test completed successfully!")
'''