# 🚀 Getting Started

Welcome to the AI API Test Automation Framework! This guide will help you get up and running quickly with intelligent API testing.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [First Test Run](#first-test-run)
- [Core Concepts](#core-concepts)
- [Basic Workflows](#basic-workflows)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 8.0.0 or higher (comes with Node.js)
- **OpenAPI Specification** file (v3.0+) for your API

### Recommended
- **Git** for version control
- **Docker** for containerized testing environments
- **VS Code** with TypeScript extensions for development

### System Requirements
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space for framework and test artifacts
- **Network**: Internet access for dependency installation and API testing

## Installation

### Option 1: Quick Installation (Recommended)

```bash
# Create a new project directory
mkdir my-api-tests && cd my-api-tests

# Install the framework globally
npm install -g @yourorg/ai-api-test-automation

# Initialize a new project
api-test init
```

### Option 2: Local Project Installation

```bash
# Create and navigate to project directory
mkdir my-api-tests && cd my-api-tests

# Initialize npm project
npm init -y

# Install the framework as a dependency
npm install @yourorg/ai-api-test-automation

# Install development dependencies
npm install --save-dev typescript @types/node
```

### Option 3: Development Installation

```bash
# Clone the repository
git clone https://github.com/yourorg/ai-api-test-automation.git
cd ai-api-test-automation

# Install dependencies
npm install

# Build the project
npm run build

# Link for global usage
npm link
```

## First Test Run

Let's run your first API test in under 5 minutes!

### Step 1: Prepare Your OpenAPI Spec

If you don't have an OpenAPI spec yet, you can use our sample:

```bash
# Download sample Petstore API spec
curl -o petstore.yml https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml
```

### Step 2: Generate Tests

```bash
# Generate comprehensive test suite
api-test generate tests \
  --spec petstore.yml \
  --output ./tests \
  --include-negative \
  --include-performance
```

**Expected Output:**
```
🚀 AI API Test Generator
📋 Parsing OpenAPI specification...
✅ Parsed 3 endpoints, 8 operations
🧪 Generating functional tests...
✅ Generated 24 functional test cases
🔄 Generating negative tests...
✅ Generated 12 negative test cases
⚡ Generating performance tests...
✅ Generated 3 performance test scenarios
📁 Tests saved to: ./tests
```

### Step 3: Configure Environment

```bash
# Create environment configuration
api-test config create \
  --name staging \
  --base-url https://petstore.swagger.io/v2 \
  --auth-type none
```

### Step 4: Run Tests

```bash
# Run functional tests
api-test run functional \
  --environment staging \
  --output ./results \
  --format html
```

**Expected Output:**
```
🏁 Starting functional test execution
🌍 Environment: staging (https://petstore.swagger.io/v2)
🧪 Running 36 test cases...

✅ GET /pet/findByStatus - 200 OK (156ms)
✅ POST /pet - 200 OK (243ms)
✅ GET /pet/{petId} - 200 OK (98ms)
❌ DELETE /pet/{petId} - 405 Method Not Allowed (67ms)

📊 Results: 32 passed, 4 failed, 0 skipped
📈 Coverage: 85% endpoints, 92% operations
📁 Report: ./results/test-report.html
```

### Step 5: View Results

```bash
# Open the HTML report
open ./results/test-report.html
```

🎉 **Congratulations!** You've successfully run your first API test suite!

## Core Concepts

Understanding these key concepts will help you use the framework effectively:

### 1. **OpenAPI-Driven Testing**

The framework uses your OpenAPI specification as the source of truth:

```yaml
# openapi.yml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get all users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

From this spec, the framework automatically:
- Generates test cases for each endpoint
- Validates response schemas
- Creates negative test scenarios
- Generates mock data

### 2. **Test Types**

The framework supports multiple test types:

#### **Functional Tests**
- Verify API endpoints work as expected
- Validate request/response schemas
- Test positive and negative scenarios

#### **Contract Tests**
- Ensure API implementation matches OpenAPI spec
- Validate schema compliance
- Check required vs optional fields

#### **Performance Tests**
- Load testing with configurable concurrency
- Response time measurements
- Throughput analysis

#### **Security Tests**
- OWASP Top 10 vulnerability scanning
- Authentication bypass testing
- Input validation checks

### 3. **Environments**

Manage multiple testing environments:

```bash
# Staging environment
api-test config create \
  --name staging \
  --base-url https://api-staging.mycompany.com \
  --auth-profile staging-auth

# Production environment  
api-test config create \
  --name production \
  --base-url https://api.mycompany.com \
  --auth-profile prod-auth
```

### 4. **Authentication**

Support for various authentication methods:

```bash
# OAuth2 Bearer Token
api-test auth configure \
  --name my-oauth \
  --type oauth2 \
  --token-url https://auth.mycompany.com/oauth/token \
  --client-id YOUR_CLIENT_ID

# API Key
api-test auth configure \
  --name my-api-key \
  --type api-key \
  --header-name X-API-Key \
  --key YOUR_API_KEY

# JWT Token
api-test auth configure \
  --name my-jwt \
  --type jwt \
  --token YOUR_JWT_TOKEN
```

## Basic Workflows

Here are common workflows to get you productive quickly:

### Workflow 1: Daily API Validation

```bash
# 1. Generate fresh tests
api-test generate tests --spec api.yml --output tests/

# 2. Run smoke tests (quick validation)
api-test run smoke --environment staging

# 3. Run full functional tests
api-test run functional --environment staging --parallel

# 4. Generate report
api-test report generate --input results/ --format html
```

### Workflow 2: Performance Baseline

```bash
# 1. Run baseline performance test
api-test performance run \
  --environment staging \
  --concurrency 5 \
  --duration 60 \
  --output baseline/

# 2. Run load test
api-test performance run \
  --environment staging \
  --concurrency 20 \
  --duration 300 \
  --output load-test/

# 3. Compare results
api-test performance compare \
  --baseline baseline/ \
  --current load-test/ \
  --format html
```

### Workflow 3: Security Assessment

```bash
# 1. Run comprehensive security scan
api-test security scan \
  --spec api.yml \
  --environment staging \
  --scan-types owasp-top-10,authentication,authorization \
  --severity critical,high,medium

# 2. Generate security report
api-test security report \
  --input security-results/ \
  --format sarif \
  --output security-report.sarif
```

### Workflow 4: CI/CD Integration

```bash
# 1. Generate CI/CD pipeline
api-test cicd generate \
  --platform github-actions \
  --environments staging,production \
  --output .github/workflows/

# 2. Validate pipeline configuration
api-test cicd validate \
  --file .github/workflows/api-tests.yml

# 3. Test locally
api-test cicd run \
  --environment staging \
  --timeout 300
```

## Next Steps

Now that you're up and running, explore these advanced features:

### 📚 **Learn More**
- [**Test Generation Guide**](./test-generation.md) - Advanced test creation techniques
- [**Authentication Setup**](./authentication.md) - Detailed auth configuration
- [**Performance Testing**](./performance-testing.md) - Comprehensive load testing
- [**Security Scanning**](./security-scanning.md) - Vulnerability assessment

### 🔧 **Customize Your Setup**
- [**Configuration Reference**](../operations/configuration.md) - All configuration options
- [**Plugin Development**](../developer/plugins.md) - Create custom extensions
- [**Integration Patterns**](../../examples/integrations/) - Real-world examples

### 🚀 **Production Ready**
- [**CI/CD Integration**](../operations/cicd.md) - Automate your testing
- [**Monitoring & Alerting**](../operations/monitoring.md) - Production monitoring
- [**Troubleshooting**](../operations/troubleshooting.md) - Common issues and solutions

### 💡 **Best Practices**
- Keep your OpenAPI spec up-to-date
- Use environment-specific configurations
- Implement gradual performance testing
- Monitor test execution metrics
- Regularly update security scans

### 🆘 **Getting Help**

If you encounter any issues:

1. **Check the logs**: `api-test logs --level debug`
2. **Validate your spec**: `api-test validate --spec api.yml`
3. **Check environment**: `api-test config test --environment staging`
4. **Review documentation**: [docs.example.com](https://docs.example.com)
5. **Ask for help**: [GitHub Issues](https://github.com/yourorg/ai-api-test-automation/issues)

### 🎯 **Quick Commands Reference**

```bash
# Test Generation
api-test generate tests --spec api.yml
api-test generate negative --spec api.yml
api-test generate performance --spec api.yml

# Test Execution
api-test run functional --environment staging
api-test run performance --concurrency 10
api-test run security --scan-types owasp-top-10

# Configuration
api-test config create --name env-name
api-test auth configure --name auth-name
api-test validate --spec api.yml

# Reporting
api-test report generate --format html
api-test report compare --baseline old/ --current new/
api-test logs --level info

# CI/CD
api-test cicd generate --platform github-actions
api-test cicd validate --file pipeline.yml
```

Ready to dive deeper? Choose your next area of focus from the guides above!

---

**Next: [Test Generation Guide →](./test-generation.md)**