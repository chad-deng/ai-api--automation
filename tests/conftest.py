"""
Global pytest configuration for generated API tests
"""
import pytest
import httpx
import os
from typing import Dict, Any, Optional
from pathlib import Path

# Load environment variables from .env.local (priority) or .env.test
def load_test_env():
    # Try .env.local first (real environment)
    env_files = [Path(".env.local"), Path(".env.test")]
    
    for env_file in env_files:
        if env_file.exists():
            print(f"📋 Loading environment from {env_file}")
            try:
                from dotenv import load_dotenv
                load_dotenv(env_file)
                break
            except ImportError:
                # dotenv not available, load manually
                with open(env_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            os.environ[key] = value
                break

# Load environment on import
load_test_env()

# Test Configuration
TEST_CONFIG = {
    "BASE_URL": os.getenv("TEST_API_BASE_URL", "https://api.example.com"),
    "TIMEOUT": int(os.getenv("TEST_TIMEOUT", "30")),
    "AUTH_TOKEN": os.getenv("TEST_AUTH_TOKEN", "test_token_here"),
    "RETRY_COUNT": int(os.getenv("TEST_RETRY_COUNT", "3")),
}


@pytest.fixture(scope="session")
def base_url():
    """Base URL for all API tests"""
    return TEST_CONFIG["BASE_URL"]


@pytest.fixture(scope="session") 
def timeout():
    """Request timeout for all API tests"""
    return TEST_CONFIG["TIMEOUT"]


@pytest.fixture
async def async_client(base_url, timeout):
    """Async HTTP client for API testing with cookie authentication"""
    
    # Cookie-based authentication (user needs to provide working cookies)
    cookies = {}
    
    # Check for cookie-based auth from environment
    cookie_vars = [
        ("_HPVN", "TEST_COOKIE_HPVN"), 
        ("perm_tid", "TEST_COOKIE_PERM_TID"),
        ("connect.sid", "TEST_COOKIE_CONNECT_SID"),
        ("_fbp", "TEST_COOKIE_FBP"),
        ("initialTrafficSource", "TEST_COOKIE_INITIAL_TRAFFIC_SOURCE"),
        ("_hjSession_3023053", "TEST_COOKIE_HJ_SESSION"),
        ("_hjSessionUser_3023053", "TEST_COOKIE_HJ_SESSION_USER")
    ]
    
    for cookie_name, env_var in cookie_vars:
        value = os.getenv(env_var)
        if value:
            cookies[cookie_name] = value
    
    # Add browser-like headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': f'{base_url}/',
        'X-Requested-With': 'XMLHttpRequest'
    }
    
    client = httpx.AsyncClient(
        base_url=base_url,
        timeout=timeout,
        follow_redirects=True,
        cookies=cookies,
        headers=headers
    )
    try:
        yield client
    finally:
        await client.aclose()


@pytest.fixture
def auth_headers():
    """Authentication headers for API requests"""
    return {
        "valid": {"Authorization": f"Bearer {TEST_CONFIG['AUTH_TOKEN']}"},
        "invalid": {"Authorization": "Bearer invalid_token_12345"},
        "expired": {"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDk0NTkyMDB9.expired"},
        "malformed": {"Authorization": "InvalidFormat token"},
        "limited": {"Authorization": "Bearer limited_scope_token"},
        "revoked": {"Authorization": "Bearer revoked_token_here"},
        "none": {}
    }


@pytest.fixture
def content_headers():
    """Common content headers for API requests"""
    return {
        "json": {"Content-Type": "application/json; charset=utf-8"},
        "form": {"Content-Type": "application/x-www-form-urlencoded"},
        "multipart": {"Content-Type": "multipart/form-data"},
        "xml": {"Content-Type": "application/xml"},
        "text": {"Content-Type": "text/plain"}
    }


@pytest.fixture
def test_data_factory():
    """Factory for generating test data"""
    import random
    import string
    from datetime import datetime, timedelta
    
    def _generate_random_string(length=10):
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))
    
    def _generate_email():
        return f"test_{_generate_random_string(8)}@example.com"
    
    def _generate_phone():
        return f"+60{random.randint(100000000, 999999999)}"
    
    def _generate_date(days_offset=0):
        return (datetime.now() + timedelta(days=days_offset)).isoformat() + "Z"
    
    def _generate_campaign_ids(count=1):
        return [_generate_random_string(24) for _ in range(count)]
    
    return {
        "string": _generate_random_string,
        "email": _generate_email,
        "phone": _generate_phone,
        "date": _generate_date,
        "campaign_ids": _generate_campaign_ids
    }


@pytest.fixture
def api_response_validator():
    """Validator for API responses"""
    def _validate_response(response: httpx.Response, expected_status: int = 200):
        """Validate basic response structure"""
        assert response.status_code == expected_status, \
            f"Expected status {expected_status}, got {response.status_code}. Response: {response.text}"
        
        # Validate response has content-type header
        assert "content-type" in response.headers, "Response missing Content-Type header"
        
        # If JSON response, validate structure
        if "application/json" in response.headers.get("content-type", ""):
            try:
                json_data = response.json()
                return json_data
            except Exception as e:
                pytest.fail(f"Invalid JSON response: {e}")
        
        return response.text
    
    def _validate_error_response(response: httpx.Response, expected_status: int):
        """Validate error response structure"""
        assert response.status_code == expected_status, \
            f"Expected error status {expected_status}, got {response.status_code}"
        
        # Check if response has error information
        if "application/json" in response.headers.get("content-type", ""):
            error_data = response.json()
            # Common error response fields
            if isinstance(error_data, dict):
                assert any(key in error_data for key in ['error', 'message', 'code', 'detail']), \
                    f"Error response missing standard error fields: {error_data}"
    
    return {
        "validate_response": _validate_response,
        "validate_error": _validate_error_response
    }


@pytest.fixture(autouse=True)
def log_test_info(request):
    """Automatically log test information"""
    print(f"\n🧪 Running test: {request.node.name}")
    yield
    print(f"✅ Completed test: {request.node.name}")


# Pytest hooks for better test output
def pytest_configure(config):
    """Configure pytest with custom settings"""
    config.addinivalue_line("markers", "api_test: API integration test")
    config.addinivalue_line("markers", "crud_test: CRUD operation test") 
    config.addinivalue_line("markers", "auth_test: Authentication test")


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers"""
    for item in items:
        # Add markers based on test file names
        if "crud" in item.nodeid:
            item.add_marker(pytest.mark.crud_test)
        if "auth" in item.nodeid:
            item.add_marker(pytest.mark.auth_test)
        if "error" in item.nodeid:
            item.add_marker(pytest.mark.error_scenarios)
        if "concurrency" in item.nodeid:
            item.add_marker(pytest.mark.concurrency)
        if "boundary" in item.nodeid:
            item.add_marker(pytest.mark.boundary)
        if "validation" in item.nodeid:
            item.add_marker(pytest.mark.validation)
        
        # Mark all generated tests as API tests
        if "tests/generated" in item.nodeid:
            item.add_marker(pytest.mark.api_test)