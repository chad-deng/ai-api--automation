# Test Generator Fixture Standards

## 🚨 Critical Fixture Guidelines

### **NEVER** define `async_client` fixtures in templates

All test templates should use the global `async_client` fixture from `tests/conftest.py`. Templates should NOT define their own async_client fixtures.

### **Correct Template Pattern:**

```python
class TestSomeAPI:
    """Test class that uses global async_client fixture"""
    
    # ❌ WRONG - Never do this in templates
    # @pytest.fixture(scope="class")
    # async def async_client(self):
    #     ...
    
    # ✅ CORRECT - Just use the global fixture
    @pytest.mark.asyncio
    async def test_something(self, async_client):
        """Test that uses the global async_client fixture"""
        response = await async_client.get("/api/endpoint")
        assert response.status_code == 200
```

## **Why This Matters**

### **Problem:** Template-defined fixtures cause runtime errors
- `@pytest.fixture` with `async def` creates async generators
- Tests expect direct `AsyncClient` instances
- Results in `'async_generator' object has no attribute 'post'` errors

### **Solution:** Use centralized fixture management
- One canonical `async_client` fixture in `conftest.py`
- Automatic mock/integration mode switching
- Consistent behavior across all tests

## **Fixture Architecture**

### **conftest.py - Central Fixture Hub**
```python
@pytest_asyncio.fixture(scope="function")
async def async_client(base_url, timeout):
    """Smart async HTTP client with mock/integration mode"""
    if TEST_MODE == "integration":
        # Real HTTP client
        async with httpx.AsyncClient(...) as client:
            yield client
    else:
        # Mock client with smart responses
        mock_client = create_mock_client()
        yield mock_client
```

### **Templates - No Client Fixtures**
```python
class TestAPITemplate:
    """Template that relies on global fixtures"""
    
    # ✅ CORRECT - Define supporting fixtures only
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Authentication headers"""
        return {"Authorization": "Bearer token"}
    
    @pytest.fixture(scope="function") 
    def test_data(self):
        """Test data factory"""
        return {"name": "test"}
    
    # ✅ CORRECT - Use global async_client
    @pytest.mark.asyncio
    async def test_endpoint(self, async_client, auth_headers):
        response = await async_client.post("/api", headers=auth_headers)
        assert response.status_code == 200
```

## **Generator Code Standards**

### **Template Rendering - Check for Fixture Issues**
```python
def generate_test(self, template_name: str, context: dict) -> str:
    """Generate test with fixture validation"""
    template = self.jinja_env.get_template(template_name)
    test_code = template.render(context)
    
    # ✅ Validate no conflicting fixtures
    if "@pytest.fixture" in test_code and "async def async_client" in test_code:
        logger.warning("Template contains async_client fixture - removing")
        test_code = self._remove_client_fixture(test_code)
    
    return test_code
```

### **Quality Checker Integration**
```python
def check_fixture_conflicts(self, test_code: str) -> List[QualityIssue]:
    """Check for fixture definition conflicts"""
    issues = []
    
    # Check for async_client fixture definitions
    if re.search(r'@pytest\.fixture.*\n.*async def async_client', test_code):
        issues.append(QualityIssue(
            category='fixture',
            message='Template defines async_client fixture - should use global fixture',
            suggestion='Remove async_client fixture definition, use global fixture'
        ))
    
    return issues
```

## **Migration Strategy**

### **For Existing Generated Tests:**
1. **Check for problems:**
   ```bash
   grep -r "@pytest.fixture.*async_client" tests/generated/
   ```

2. **Fix problematic tests:**
   ```bash
   # Remove fixture definitions
   sed -i '' '/@pytest.fixture.*async_client/,/yield client/d' tests/generated/**/*.py
   ```

3. **Verify fixes:**
   ```bash
   python -m pytest tests/generated/ -x -v
   ```

### **For New Test Generation:**
1. **Update all templates** to remove async_client fixtures
2. **Add quality checks** to prevent fixture conflicts  
3. **Test template changes** before deployment

## **Testing the Fix**

### **Verification Commands:**
```bash
# 1. Check no fixture conflicts in templates
grep -r "@pytest.fixture.*async.*client" src/templates/
# Should return no results

# 2. Run a simple generated test
python -m pytest tests/generated/ -k "authentication" --tb=short -v

# 3. Check mock mode works
export TEST_API_BASE_URL="https://api.example.com"
python -m pytest tests/generated/ -x --tb=line
```

## **Future Prevention**

### **Template Development Checklist:**
- [ ] No `async_client` fixture definitions
- [ ] Uses global fixtures only
- [ ] Proper `@pytest.mark.asyncio` decorators
- [ ] No `self` parameters in fixtures
- [ ] Correct fixture scopes

### **Code Review Requirements:**
- [ ] Template changes reviewed for fixture conflicts
- [ ] Quality checker passes all tests
- [ ] Integration with mock/real API modes works
- [ ] Generated tests run without errors

### **Automated Validation:**
```python
# Add to CI pipeline
def validate_templates():
    """Ensure templates follow fixture standards"""
    for template_file in glob("src/templates/**/*.j2"):
        content = Path(template_file).read_text()
        assert "async def async_client" not in content, \
            f"Template {template_file} defines forbidden fixture"
```

## **Summary**

✅ **DO:**
- Use global `async_client` fixture from conftest.py
- Define supporting fixtures (auth_headers, test_data, etc.)
- Use `@pytest.mark.asyncio` for async tests
- Keep fixture definitions simple and focused

❌ **DON'T:**
- Define `async_client` fixtures in templates
- Mix `@pytest.fixture` with `async def` incorrectly  
- Use `self` parameters in fixture functions
- Create duplicate fixture definitions

This approach ensures **consistent, maintainable, and error-free** test generation across all templates and generators.