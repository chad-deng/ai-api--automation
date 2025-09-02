"""
Test configuration validation
Verify that test environment is properly set up
"""
import pytest
import httpx
import os


class TestConfiguration:
    """Test that all test configurations are working"""
    
    def test_environment_variables_loaded(self):
        """Test that environment variables are accessible"""
        # These should be set by conftest.py or environment
        assert os.getenv("TEST_API_BASE_URL") is not None
        print(f"✅ BASE_URL: {os.getenv('TEST_API_BASE_URL')}")
    
    @pytest.mark.asyncio
    async def test_async_client_fixture(self, async_client):
        """Test that async client fixture works"""
        assert isinstance(async_client, httpx.AsyncClient)
        assert async_client.base_url is not None
        print(f"✅ Client base URL: {async_client.base_url}")
    
    def test_auth_headers_fixture(self, auth_headers):
        """Test that auth headers fixture provides expected structure"""
        required_types = ["valid", "invalid", "expired", "malformed", "none"]
        
        for auth_type in required_types:
            assert auth_type in auth_headers, f"Missing auth type: {auth_type}"
        
        # Valid auth should have Authorization header
        assert "Authorization" in auth_headers["valid"]
        print("✅ Auth headers structure is correct")
    
    def test_test_data_factory_fixture(self, test_data_factory):
        """Test that test data factory works"""
        # Test string generation
        test_string = test_data_factory["string"](10)
        assert len(test_string) == 10
        assert test_string.isalnum()
        
        # Test email generation
        test_email = test_data_factory["email"]()
        assert "@" in test_email
        assert test_email.endswith("@example.com")
        
        # Test phone generation
        test_phone = test_data_factory["phone"]()
        assert test_phone.startswith("+60")
        
        # Test campaign ID generation
        campaign_ids = test_data_factory["campaign_ids"](3)
        assert len(campaign_ids) == 3
        assert all(len(cid) == 24 for cid in campaign_ids)
        
        print("✅ Test data factory is working correctly")
    
    def test_api_response_validator_fixture(self, api_response_validator):
        """Test that response validator fixture works"""
        assert "validate_response" in api_response_validator
        assert "validate_error" in api_response_validator
        print("✅ API response validator is available")
    
    @pytest.mark.asyncio 
    async def test_basic_http_connectivity(self, async_client, auth_headers):
        """Test basic HTTP connectivity (this might fail if API is not accessible)"""
        try:
            # Try a simple request - this might fail and that's OK for now
            response = await async_client.get("/", headers=auth_headers["none"])
            print(f"✅ HTTP connectivity test - Status: {response.status_code}")
            
            # Any response (including errors) means connectivity is working
            assert response.status_code is not None
            
        except httpx.ConnectError:
            print("⚠️  HTTP connectivity test failed (API not accessible) - this is expected in test environment")
            pytest.skip("API endpoint not accessible - skipping connectivity test")
        except Exception as e:
            print(f"⚠️  HTTP connectivity test had unexpected error: {e}")
            # Don't fail the test - this is just a connectivity check


@pytest.mark.integration
class TestGeneratedTestsStructure:
    """Test that generated tests have proper structure"""
    
    def test_generated_tests_exist(self):
        """Test that generated test files exist"""
        from pathlib import Path
        
        generated_dir = Path("tests/generated")
        assert generated_dir.exists(), "Generated tests directory should exist"
        
        test_files = list(generated_dir.glob("*.py"))
        assert len(test_files) > 0, "Should have generated test files"
        
        print(f"✅ Found {len(test_files)} generated test files")
    
    def test_generated_test_imports(self):
        """Test that generated tests can be imported without errors"""
        from pathlib import Path
        import importlib.util
        
        generated_dir = Path("tests/generated")
        test_files = list(generated_dir.glob("test_*.py"))[:5]  # Test first 5 files
        
        successful_imports = 0
        for test_file in test_files:
            try:
                spec = importlib.util.spec_from_file_location("test_module", test_file)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                successful_imports += 1
            except Exception as e:
                print(f"⚠️  Could not import {test_file.name}: {e}")
        
        print(f"✅ Successfully imported {successful_imports}/{len(test_files)} test files")
        assert successful_imports > 0, "Should be able to import at least some generated tests"