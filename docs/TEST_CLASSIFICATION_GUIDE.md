# Test Classification and Categorization Guide

## Overview

This guide defines the test classification system for the AI API Test Automation framework. The system uses pytest markers to categorize tests into three primary levels plus additional secondary markers for flexible test execution.

## 🎯 Test Level Classification

### 1. Smoke Tests (`@pytest.mark.smoke`)
**Purpose**: Fast critical path validation  
**Duration**: 2-5 minutes  
**Resource Usage**: Minimal  
**Dependencies**: Mock services preferred  

**Characteristics**:
- Core functionality validation
- Basic authentication checks  
- Essential API endpoint health
- No external service dependencies
- Optimized for CI/CD pipelines

**Examples**:
```python
@pytest.mark.asyncio
@pytest.mark.smoke
@pytest.mark.auth
async def test_authentication_required(self, async_client):
    """Verify endpoint requires authentication"""
    
@pytest.mark.asyncio
@pytest.mark.crud
@pytest.mark.create
@pytest.mark.smoke
async def test_create_resource_success(self, async_client, auth_headers, create_payload):
    """Basic resource creation test"""
```

**Run Command**:
```bash
# Fast validation for commits/PRs
./scripts/run_test_levels.sh smoke
```

### 2. Integration Tests (`@pytest.mark.integration`)
**Purpose**: Real service dependency validation  
**Duration**: 10-30 minutes  
**Resource Usage**: Moderate  
**Dependencies**: Live API endpoints required  

**Characteristics**:
- Full end-to-end workflows
- Real authentication services
- External API integrations
- Database transactions
- Network dependency validation

**Examples**:
```python
@pytest.mark.asyncio
@pytest.mark.auth
@pytest.mark.integration
async def test_valid_authentication_success(self, async_client, valid_token):
    """Test authentication against real service"""
    
@pytest.mark.asyncio
@pytest.mark.integration
async def test_api_idempotency(self, async_client, auth_headers):
    """Verify idempotency with real data persistence"""
```

**Run Command**:
```bash
# Full integration testing
./scripts/run_test_levels.sh integration
```

### 3. Load Tests (`@pytest.mark.load`)
**Purpose**: Performance and concurrency validation  
**Duration**: 30+ minutes  
**Resource Usage**: High  
**Dependencies**: Dedicated test environment recommended  

**Characteristics**:
- High concurrency scenarios
- Performance benchmarking
- Resource exhaustion testing
- Batch operations
- Stress testing patterns

**Examples**:
```python
@pytest.mark.asyncio
@pytest.mark.crud
@pytest.mark.batch
@pytest.mark.load
async def test_batch_create_resources(self, async_client, auth_headers, batch_payloads):
    """Test batch operations under load"""
    
@pytest.mark.asyncio
@pytest.mark.concurrency
@pytest.mark.load
async def test_concurrent_requests(self, async_client):
    """High concurrency stress test"""
```

**Run Command**:
```bash
# Performance and load testing
./scripts/run_test_levels.sh load
```

## 🏷️ Secondary Classification Markers

### Functional Categories
- `@pytest.mark.api_test` - API integration test
- `@pytest.mark.crud_test` - CRUD operation test  
- `@pytest.mark.auth_test` - Authentication test
- `@pytest.mark.error_scenarios` - Error scenario test
- `@pytest.mark.validation` - Data validation test
- `@pytest.mark.boundary` - Boundary testing

### Operational Categories
- `@pytest.mark.concurrency` - Concurrency test
- `@pytest.mark.batch` - Batch operation test
- `@pytest.mark.unit` - Unit test (mock dependencies)
- `@pytest.mark.slow` - Long-running test

### Quality Attributes
- `@pytest.mark.critical` - Critical functionality
- `@pytest.mark.flaky` - Potentially unstable test
- `@pytest.mark.deprecated` - Testing deprecated features

## 🚀 Test Execution Strategies

### 1. Development Workflow
```bash
# Quick validation during development
./scripts/run_test_levels.sh quick
# Runs: smoke + critical tests
```

### 2. Pre-commit Validation  
```bash
# Fast smoke tests before commits
./scripts/run_test_levels.sh smoke
```

### 3. CI/CD Pipeline
```bash
# Full pipeline validation
./scripts/run_test_levels.sh all
# Sequence: smoke → integration → load
```

### 4. Custom Test Selection
```bash
# Run specific combinations
python -m pytest -m "smoke and auth_test"
python -m pytest -m "integration and not flaky"
python -m pytest -m "load or concurrency"
```

## 📊 Test Configuration Matrix

| Level | Duration | Resources | Dependencies | Use Case |
|-------|----------|-----------|--------------|----------|
| Smoke | 2-5 min | Minimal | Mocked | CI/CD, Dev workflow |
| Integration | 10-30 min | Moderate | Live APIs | Release validation |
| Load | 30+ min | High | Test env | Performance testing |

## 🎛️ Environment Configuration

### Test Mode Configuration
Tests automatically adapt based on environment:

```python
# In conftest.py
TEST_MODE = os.getenv("TEST_MODE", "mock")  # mock, integration, load

@pytest_asyncio.fixture(scope="function")
async def async_client(base_url, timeout):
    if TEST_MODE == "integration":
        # Real HTTP client for integration tests
        async with httpx.AsyncClient(base_url=base_url, timeout=timeout) as client:
            yield client
    else:
        # Mock client for smoke tests
        mock_client = create_mock_client()
        yield mock_client
```

### Environment Variables
```bash
# Configuration for different test levels
export TEST_MODE=integration          # mock, integration, load
export TEST_API_BASE_URL=https://api.prod.com
export TEST_AUTH_TOKEN=real_token_here
export TEST_CONCURRENCY_USERS=50     # For load tests
export TEST_TIMEOUT=60                # Request timeout
```

## 📋 Template Integration

### Generated Test Classification
Templates automatically apply appropriate markers based on test type:

```python
# Authentication tests → smoke + integration
@pytest.mark.smoke          # Basic auth check
@pytest.mark.integration    # Real token validation

# CRUD operations → smoke for basic, load for batch  
@pytest.mark.smoke          # Single create/read
@pytest.mark.load           # Batch operations

# Error scenarios → integration (need real error responses)
@pytest.mark.integration    # Real error validation
```

### Template Marker Strategy
1. **Primary marker**: Based on test complexity/duration
2. **Secondary markers**: Based on functionality tested
3. **Attribute markers**: Based on test characteristics

## 🔍 Quality Assurance

### Marker Validation
The quality checker validates marker usage:

```python
def validate_test_markers(test_code: str) -> List[QualityIssue]:
    """Ensure tests have appropriate level markers"""
    issues = []
    
    # Every test should have a level marker
    has_level_marker = any(marker in test_code for marker in 
                          ['@pytest.mark.smoke', '@pytest.mark.integration', '@pytest.mark.load'])
    
    if not has_level_marker:
        issues.append(QualityIssue(
            category='markers',
            message='Test missing level classification marker',
            suggestion='Add @pytest.mark.smoke, @pytest.mark.integration, or @pytest.mark.load'
        ))
    
    return issues
```

### Reporting Integration
Test reports show classification breakdown:

```html
<!-- HTML report includes classification summary -->
<div class="test-classification">
  <h3>Test Execution Summary</h3>
  <ul>
    <li>Smoke Tests: 45 passed, 2 failed (2.5 minutes)</li>
    <li>Integration Tests: 23 passed, 1 failed (18.3 minutes)</li>  
    <li>Load Tests: 8 passed, 0 failed (45.2 minutes)</li>
  </ul>
</div>
```

## 🛠️ Usage Examples

### Development Workflow
```bash
# During feature development
./scripts/run_test_levels.sh smoke

# Before creating PR  
./scripts/run_test_levels.sh quick

# Full validation before merge
./scripts/run_test_levels.sh all
```

### Custom Test Execution
```bash
# Test specific functionality
python -m pytest -m "auth_test and smoke"

# Skip flaky tests in CI
python -m pytest -m "not flaky"

# Critical path validation
python -m pytest -m "critical or smoke"

# Performance testing only
python -m pytest -m "load" --durations=20
```

### Parallel Execution
```bash
# Run levels in parallel (advanced usage)
python -m pytest -m "smoke" --numprocesses=4 &
python -m pytest -m "integration" --numprocesses=2 &
wait
```

## 📈 Benefits

### ✅ Advantages
- **Flexible execution**: Run appropriate tests for context
- **Resource optimization**: Match test level to available resources
- **Clear expectations**: Duration and dependency clarity
- **CI/CD optimization**: Fast feedback loops
- **Quality gates**: Progressive validation levels

### 🎯 Best Practices
1. **Mark every test** with appropriate level
2. **Use combinations** for precise selection
3. **Environment-aware** test configuration
4. **Progressive validation** in pipelines
5. **Document dependencies** clearly

## 🔧 Maintenance

### Adding New Test Levels
1. Update `pytest.ini` markers section
2. Modify `run_test_levels.sh` script
3. Update template marker logic
4. Add documentation examples
5. Update CI/CD configuration

### Marker Migration
When changing marker strategies:
1. Update templates first
2. Regenerate affected tests  
3. Validate marker consistency
4. Update documentation
5. Communicate changes to team

This classification system provides a robust foundation for scalable, maintainable test execution across different contexts and environments.