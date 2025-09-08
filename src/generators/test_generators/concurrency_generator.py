"""
Simplified Concurrency Test Generator

Generates basic concurrency tests for API endpoints.
"""

import json
from typing import Dict, Any, List
from dataclasses import dataclass
from pathlib import Path
import structlog

logger = structlog.get_logger()

@dataclass
class ConcurrencyTest:
    """Represents a specific concurrency test case"""
    name: str
    description: str
    test_payload: Dict[str, Any]
    concurrent_users: int
    requests_per_user: int
    test_category: str
    expected_behavior: str
    validation_checks: List[str]
    test_duration_seconds: int = 30

class ConcurrencyTestGenerator:
    """
    Generates basic concurrency tests for API endpoints
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def generate_concurrency_tests(self, api_spec: Dict[str, Any]) -> List[ConcurrencyTest]:
        """Generate concurrency test scenarios"""
        tests = []
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        
        # Simple load test
        tests.append(ConcurrencyTest(
            name=f"test_{operation_id}_concurrency_basic",
            description="Basic concurrency test with 5 concurrent users",
            test_payload={"test": "concurrency_basic", "user_id": 1},
            concurrent_users=5,
            requests_per_user=10,
            test_category='load_burst',
            expected_behavior='all_succeed',
            validation_checks=['response_time_reasonable', 'no_data_corruption'],
            test_duration_seconds=30
        ))
        
        self.logger.info(f"Generated {len(tests)} concurrency tests for {api_spec.get('path')}")
        return tests
    
    def generate_test_file(self, api_spec: Dict[str, Any], output_dir: str) -> str:
        """Generate a complete concurrency test file"""
        tests = self.generate_concurrency_tests(api_spec)
        
        if not tests:
            self.logger.warning(f"No concurrency tests generated for {api_spec.get('path')}")
            return ""
        
        # Generate simple test file content
        test_content = self._generate_test_file_content(api_spec, tests)
        
        # Save to file
        operation_id = api_spec.get('operationId', 'endpoint').lower()
        filename = f"test_{operation_id}_concurrency.py"
        output_path = Path(output_dir) / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        self.logger.info(f"Generated concurrency test file: {output_path}")
        return str(output_path)
    
    def _generate_test_file_content(self, api_spec: Dict[str, Any], tests: List[ConcurrencyTest]) -> str:
        """Generate the actual test file content"""
        operation_id = api_spec.get('operationId', 'endpoint')
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        description = api_spec.get('description', f'{operation_id} endpoint')
        
        content = f'''import pytest
import httpx
import asyncio
import time
from typing import Dict, Any
from src.config.settings import Settings

# Basic Concurrency Tests for: {description}
# Method: {method}
# Path: {path}

# Load settings from environment
settings = Settings()
BASE_URL = settings.test_api_base_url

class TestConcurrencyEndpoint:
    
    @pytest.fixture
    def client(self):
        # Create client with cookies from environment
        cookies = {{}}
        if settings.test_cookie_connect_sid:
            cookies['connect.sid'] = settings.test_cookie_connect_sid
        return httpx.AsyncClient(base_url=BASE_URL, cookies=cookies, timeout=60.0)
    
    @pytest.fixture
    def auth_headers(self):
        # Check authentication method - support both token and cookie-based auth
        auth_token = settings.test_auth_token
        
        # If using cookie-based authentication, return empty headers
        if auth_token and auth_token.lower() == "cookie_auth_enabled":
            return {{}}  # Empty headers - authentication via cookies
        
        # Check if we have real tokens, skip if placeholders
        if not auth_token or any(placeholder in auth_token.lower() 
                                for placeholder in ["placeholder", "here", "token_123", "your_", "concurrency_test"]):
            # Check if we have cookies as backup
            if settings.test_cookie_connect_sid:
                return {{}}  # Use cookies instead
            pytest.skip("Real authentication token not configured - skipping concurrency tests")
        
        return {{"Authorization": f"Bearer {{auth_token}}"}}
    
    @pytest.mark.asyncio
    @pytest.mark.concurrency
    async def test_{operation_id}_basic_concurrency(self, client, auth_headers):
        """Basic concurrency test with multiple simultaneous requests"""
        
        concurrent_users = 5
        requests_per_user = 8
        test_payload = {{"test": "concurrency", "timestamp": time.time()}}
        
        print(f"🚀 Starting concurrency test: {{concurrent_users}} users, {{requests_per_user}} requests each")
        
        async def make_request(user_id: int, request_id: int):
            payload = test_payload.copy()
            payload["user_id"] = user_id
            payload["request_id"] = request_id
            
            start_time = time.time()
            try:
                response = await client.{method.lower()}("{path}", json=payload, headers=auth_headers)
                response_time = time.time() - start_time
                return {{
                    "user_id": user_id,
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "response_time": response_time,
                    "success": 200 <= response.status_code < 300
                }}
            except Exception as e:
                return {{
                    "user_id": user_id,
                    "request_id": request_id,
                    "status_code": 0,
                    "response_time": time.time() - start_time,
                    "success": False,
                    "error": str(e)[:100]
                }}
        
        # Create all tasks for concurrent execution
        tasks = []
        for user_id in range(concurrent_users):
            for request_id in range(requests_per_user):
                task = make_request(user_id, request_id)
                tasks.append(task)
        
        # Execute all requests concurrently
        start_time = time.time()
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start_time
        
        # Analyze results
        total_requests = len(results)
        successful_requests = len([r for r in results if r["success"]])
        failed_requests = total_requests - successful_requests
        success_rate = (successful_requests / total_requests) * 100 if total_requests > 0 else 0
        
        avg_response_time = sum(r["response_time"] for r in results) / len(results) if results else 0
        requests_per_second = total_requests / total_time if total_time > 0 else 0
        
        print(f"📊 Concurrency Test Results:")
        print(f"  Total Requests: {{total_requests}}")
        print(f"  Successful: {{successful_requests}}")
        print(f"  Failed: {{failed_requests}}")
        print(f"  Success Rate: {{success_rate:.1f}}%")
        print(f"  Avg Response Time: {{avg_response_time:.3f}}s")
        print(f"  Requests/Second: {{requests_per_second:.1f}}")
        
        # Basic assertions
        assert success_rate >= 70, f"Success rate too low: {{success_rate:.1f}}%"
        assert avg_response_time < 10, f"Average response time too high: {{avg_response_time:.3f}}s"
        assert requests_per_second > 1, f"Throughput too low: {{requests_per_second:.1f}} RPS"
        
        print("✅ Basic concurrency test completed successfully!")
'''
        
        return content