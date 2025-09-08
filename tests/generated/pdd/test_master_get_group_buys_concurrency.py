import pytest
import httpx
import asyncio
import time
from typing import Dict, Any
from src.config.settings import Settings

# Basic Concurrency Tests for: Get all group buys for master management
# Method: GET
# Path: /master/group-buys

# Load settings from environment
settings = Settings()
BASE_URL = settings.test_api_base_url

class TestConcurrencyEndpoint:
    
    @pytest.fixture
    def client(self):
        # Create client with cookies from environment
        cookies = {}
        if settings.test_cookie_connect_sid:
            cookies['connect.sid'] = settings.test_cookie_connect_sid
        return httpx.AsyncClient(base_url=BASE_URL, cookies=cookies, timeout=60.0)
    
    @pytest.fixture
    def auth_headers(self):
        # Check if we have real tokens, skip if placeholders
        auth_token = settings.test_auth_token
        if not auth_token or any(placeholder in auth_token.lower() 
                                for placeholder in ["placeholder", "here", "token_123", "your_", "concurrency_test"]):
            pytest.skip("Real authentication token not configured - skipping concurrency tests")
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.mark.asyncio
    @pytest.mark.concurrency
    async def test_master_get_group_buys_basic_concurrency(self, client, auth_headers):
        """Basic concurrency test with multiple simultaneous requests"""
        
        concurrent_users = 5
        requests_per_user = 8
        test_payload = {"test": "concurrency", "timestamp": time.time()}
        
        print(f"🚀 Starting concurrency test: {concurrent_users} users, {requests_per_user} requests each")
        
        async def make_request(user_id: int, request_id: int):
            payload = test_payload.copy()
            payload["user_id"] = user_id
            payload["request_id"] = request_id
            
            start_time = time.time()
            try:
                response = await client.get("/master/group-buys", json=payload, headers=auth_headers)
                response_time = time.time() - start_time
                return {
                    "user_id": user_id,
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "response_time": response_time,
                    "success": 200 <= response.status_code < 300
                }
            except Exception as e:
                return {
                    "user_id": user_id,
                    "request_id": request_id,
                    "status_code": 0,
                    "response_time": time.time() - start_time,
                    "success": False,
                    "error": str(e)[:100]
                }
        
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
        print(f"  Total Requests: {total_requests}")
        print(f"  Successful: {successful_requests}")
        print(f"  Failed: {failed_requests}")
        print(f"  Success Rate: {success_rate:.1f}%")
        print(f"  Avg Response Time: {avg_response_time:.3f}s")
        print(f"  Requests/Second: {requests_per_second:.1f}")
        
        # Basic assertions
        assert success_rate >= 70, f"Success rate too low: {success_rate:.1f}%"
        assert avg_response_time < 10, f"Average response time too high: {avg_response_time:.3f}s"
        assert requests_per_second > 1, f"Throughput too low: {requests_per_second:.1f} RPS"
        
        print("✅ Basic concurrency test completed successfully!")
