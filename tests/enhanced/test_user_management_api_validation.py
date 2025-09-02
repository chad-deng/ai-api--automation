"""
Validation-focused tests for User Management API
"""

import pytest
import httpx
from typing import Dict, Any
import os

BASE_URL = os.getenv('TEST_API_BASE_URL', 'http://localhost:8000')
AUTH_TOKEN = os.getenv('TEST_AUTH_TOKEN')

class UserManagementApiValidationTests:
    """Validation-specific test suite"""
    
    @pytest.fixture
    async def client(self):
        async with httpx.AsyncClient(base_url=BASE_URL) as client:
            yield client
    
    @pytest.fixture
    def auth_headers(self):
        if not AUTH_TOKEN:
            pytest.skip("AUTH_TOKEN not set")
        return {"Authorization": f"Bearer {AUTH_TOKEN}"}


