#!/usr/bin/env python3
"""
Append the missing methods to error_generator.py
"""

content_to_append = '''
        return str(output_path)
    
    def _generate_test_file_content(self, api_spec, scenarios):
        """Generate the actual test file content"""
        operation_id = api_spec.get('operationId', 'endpoint')
        method = api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        description = api_spec.get('description', f'{operation_id} endpoint')
        
        content = f"""import pytest
import httpx
from typing import Dict, Any, Optional
import json
import asyncio
from src.config.settings import Settings

# Advanced Error Scenario Tests for: {description}
# Method: {method}
# Path: {path}
# Generated: Week 3 Advanced Test Generation

# Load settings from environment
settings = Settings()
BASE_URL = settings.test_api_base_url

class Test{operation_id.title().replace('_', '')}ErrorScenarios:
    
    @pytest.fixture
    def client(self):
        cookies = {{}}
        if settings.test_cookie_connect_sid:
            cookies['connect.sid'] = settings.test_cookie_connect_sid
        return httpx.AsyncClient(base_url=BASE_URL, cookies=cookies, timeout=30.0)
    
    @pytest.fixture
    def auth_headers(self):
        return {{
            "valid": {{"Authorization": f"Bearer {{settings.test_auth_token}}"}},
            "invalid": {{"Authorization": "Bearer invalid_token_placeholder"}},
        }}

"""
        
        # Generate test methods for each scenario  
        for scenario in scenarios:
            content += self._generate_test_method(scenario, api_spec)
            content += "\\n"
        
        return content
    
    def _generate_test_method(self, scenario, api_spec):
        """Generate a single test method"""
        method = scenario.test_method_override or api_spec.get('method', 'GET')
        path = api_spec.get('path', '/api/endpoint')
        
        return f"""    @pytest.mark.asyncio
    async def {scenario.name}(self, client):
        ''''{scenario.description}''''
        headers = {{}}
        if hasattr(scenario, 'test_headers') and scenario.test_headers:
            headers.update(scenario.test_headers)
            
        response = await client.{method.lower()}("{path}", headers=headers)
        assert response.status_code == {scenario.expected_status_code}
"""
    
    def _generate_batch_error_test(self, api_spec, scenarios):
        """Generate batch error test"""
        return ""
'''

# Read current file
with open('src/generators/test_generators/error_generator.py', 'r') as f:
    current_content = f.read()

# Remove the incomplete last line and add proper ending
if not current_content.endswith('\n'):
    current_content = current_content.rstrip()

# Write the corrected content
with open('src/generators/test_generators/error_generator.py', 'w') as f:
    f.write(current_content + content_to_append)

print("✅ Added missing methods to error_generator.py")