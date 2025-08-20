# 🔧 Troubleshooting Guide

Common issues, solutions, and debugging techniques for the AI API Test Automation Framework.

## 📋 Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Installation Problems](#installation-problems)
- [Configuration Issues](#configuration-issues)
- [Authentication Problems](#authentication-problems)
- [Test Execution Issues](#test-execution-issues)
- [Performance Problems](#performance-problems)
- [Security Scan Issues](#security-scan-issues)
- [Reporting Problems](#reporting-problems)
- [Network and Connectivity](#network-and-connectivity)
- [Debugging Techniques](#debugging-techniques)
- [Log Analysis](#log-analysis)
- [Support Resources](#support-resources)

## Quick Diagnostics

### Health Check Commands

Run these commands to quickly diagnose issues:

```bash
# Check framework version and status
api-test --version
api-test doctor

# Validate configuration
api-test config validate

# Test environment connectivity
api-test config test --environment staging

# Check authentication
api-test auth test --profile my-auth

# Validate OpenAPI spec
api-test validate --spec api.yml

# Check system resources
api-test system info
```

### System Requirements Check

```bash
# Check Node.js version (required: 18.0.0+)
node --version

# Check npm version (required: 8.0.0+)
npm --version

# Check available memory
node -e "console.log('Memory:', Math.round(process.memoryUsage().heapTotal / 1024 / 1024), 'MB')"

# Check disk space
df -h

# Check network connectivity
curl -I https://httpbin.org/status/200
```

## Common Issues

### Issue: "Command not found: api-test"

**Symptoms:**
```bash
$ api-test --version
command not found: api-test
```

**Solutions:**

1. **Global installation missing:**
```bash
# Install globally
npm install -g @yourorg/ai-api-test-automation

# Or use npx
npx @yourorg/ai-api-test-automation --version
```

2. **PATH issues:**
```bash
# Check npm global path
npm config get prefix

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$(npm config get prefix)/bin:$PATH"
```

3. **Local installation:**
```bash
# Use local installation
./node_modules/.bin/api-test --version

# Or add npm script
npm run api-test -- --version
```

### Issue: "OpenAPI spec parsing failed"

**Symptoms:**
```
Error: Failed to parse OpenAPI spec: Invalid YAML/JSON
```

**Solutions:**

1. **Validate YAML/JSON syntax:**
```bash
# For YAML files
yamllint api.yml

# For JSON files
cat api.json | jq .
```

2. **Check OpenAPI specification validity:**
```bash
# Use online validator
curl -X POST https://validator.swagger.io/validator/debug \
  -H "Content-Type: application/json" \
  -d @api.json

# Use api-test validator
api-test validate --spec api.yml --strict
```

3. **Common spec issues:**
```yaml
# ❌ Missing required fields
openapi: 3.0.0
# Missing info section

# ✅ Correct format
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths: {}
```

### Issue: "Test generation produces no tests"

**Symptoms:**
```
Generated 0 test cases from 10 endpoints
```

**Solutions:**

1. **Check endpoint definitions:**
```bash
# Analyze spec structure
api-test analyze --spec api.yml --verbose
```

2. **Review generation options:**
```bash
# Enable all test types
api-test generate tests \
  --spec api.yml \
  --include-negative \
  --include-boundary \
  --include-performance \
  --verbose
```

3. **Check for missing response schemas:**
```yaml
# ❌ No response schema
responses:
  '200':
    description: Success

# ✅ With schema
responses:
  '200':
    description: Success
    content:
      application/json:
        schema:
          type: object
          properties:
            id:
              type: integer
```

## Installation Problems

### Issue: npm install fails with permission errors

**Symptoms:**
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solutions:**

1. **Use Node Version Manager (recommended):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js
nvm install 18
nvm use 18
npm install -g @yourorg/ai-api-test-automation
```

2. **Configure npm prefix:**
```bash
# Create global directory
mkdir ~/.npm-global

# Configure npm
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

3. **Use npx (no global install):**
```bash
npx @yourorg/ai-api-test-automation --version
```

### Issue: TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module '@types/node'
```

**Solutions:**

1. **Install missing dependencies:**
```bash
npm install --save-dev typescript @types/node
```

2. **Check TypeScript version compatibility:**
```bash
# Check version
npx tsc --version

# Update if needed
npm install --save-dev typescript@latest
```

3. **Verify tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

## Configuration Issues

### Issue: "Configuration file not found"

**Symptoms:**
```
Error: Configuration file not found: api-test.config.js
```

**Solutions:**

1. **Create configuration file:**
```bash
# Generate default configuration
api-test config init

# Or create manually
touch api-test.config.json
```

2. **Specify configuration path:**
```bash
api-test run --config ./path/to/config.yml
```

3. **Check supported formats:**
- `api-test.config.js`
- `api-test.config.ts`
- `api-test.config.json`
- `api-test.config.yml`
- `api-test.config.yaml`

### Issue: "Environment configuration invalid"

**Symptoms:**
```
Error: Environment 'staging' not found in configuration
```

**Solutions:**

1. **List available environments:**
```bash
api-test config list
```

2. **Add environment:**
```bash
api-test config create \
  --name staging \
  --base-url https://api-staging.example.com
```

3. **Validate configuration:**
```bash
api-test config validate --verbose
```

## Authentication Problems

### Issue: "Authentication failed"

**Symptoms:**
```
Error: Authentication failed: 401 Unauthorized
```

**Solutions:**

1. **Test authentication profile:**
```bash
api-test auth test --profile my-oauth --verbose
```

2. **Check token validity:**
```bash
# For JWT tokens
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq

# For OAuth2, check token expiration
api-test auth refresh --profile my-oauth
```

3. **Verify credentials:**
```bash
# Check environment variables
echo $CLIENT_ID
echo $CLIENT_SECRET

# Test OAuth2 flow manually
curl -X POST https://auth.example.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET"
```

### Issue: "OAuth2 token refresh failed"

**Symptoms:**
```
Error: Failed to refresh token: invalid_grant
```

**Solutions:**

1. **Check token expiration:**
```bash
api-test auth status --profile my-oauth
```

2. **Reconfigure authentication:**
```bash
api-test auth configure \
  --name my-oauth \
  --type oauth2 \
  --client-id YOUR_ID \
  --client-secret YOUR_SECRET \
  --token-url https://auth.example.com/oauth/token
```

3. **Manual token refresh:**
```bash
api-test auth refresh --profile my-oauth --force
```

## Test Execution Issues

### Issue: "Tests timeout frequently"

**Symptoms:**
```
Error: Test timeout after 30000ms
```

**Solutions:**

1. **Increase timeout:**
```bash
api-test run --timeout 60000  # 60 seconds
```

2. **Configure per-environment:**
```yaml
environments:
  staging:
    timeout: 60000
```

3. **Optimize test execution:**
```bash
api-test run --parallel 5  # Reduce concurrency
```

### Issue: "High test failure rate"

**Symptoms:**
```
Results: 10 passed, 40 failed, 0 skipped
```

**Solutions:**

1. **Analyze failure patterns:**
```bash
api-test run --verbose --stop-on-failure
```

2. **Check environment health:**
```bash
api-test config test --environment staging
```

3. **Review specific failures:**
```bash
# Generate detailed report
api-test run --format html --include-logs
```

4. **Test individual endpoints:**
```bash
api-test run --filter "GET /users" --verbose
```

### Issue: "Memory errors during test execution"

**Symptoms:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solutions:**

1. **Increase Node.js memory:**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
api-test run
```

2. **Reduce concurrency:**
```bash
api-test run --parallel 2
```

3. **Enable streaming for large datasets:**
```bash
api-test run --stream-results
```

## Performance Problems

### Issue: "Load test fails to reach target concurrency"

**Symptoms:**
```
Warning: Only achieved 50/100 target virtual users
```

**Solutions:**

1. **Check system resources:**
```bash
# Monitor during test
htop
iostat 1
```

2. **Optimize configuration:**
```bash
# Increase file descriptor limits
ulimit -n 65536

# Optimize TCP settings
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65535' >> /etc/sysctl.conf
```

3. **Use distributed testing:**
```yaml
performance:
  distributed:
    enabled: true
    nodes:
      - host: node1.example.com
      - host: node2.example.com
```

### Issue: "Inconsistent performance results"

**Symptoms:**
```
Run 1: 200ms avg, Run 2: 800ms avg
```

**Solutions:**

1. **Increase test duration:**
```bash
api-test performance run --duration 600  # 10 minutes
```

2. **Add warm-up period:**
```yaml
performance:
  warmUp: 60  # 60 seconds
  duration: 300
```

3. **Control external factors:**
```bash
# Test during off-peak hours
api-test performance run --schedule "02:00"
```

## Security Scan Issues

### Issue: "Security scan produces false positives"

**Symptoms:**
```
Found 50 critical vulnerabilities (many false positives)
```

**Solutions:**

1. **Exclude problematic rules:**
```bash
api-test security scan --exclude-rules rule-001,rule-015
```

2. **Configure rule-specific settings:**
```yaml
security:
  rules:
    rule-001:
      enabled: false
      reason: "Not applicable to our API design"
```

3. **Use custom rules:**
```bash
api-test security scan --custom-rules ./security/custom-rules.js
```

### Issue: "Security scan fails with network errors"

**Symptoms:**
```
Error: ECONNREFUSED connecting to target API
```

**Solutions:**

1. **Test connectivity:**
```bash
curl -I https://api.example.com/health
```

2. **Configure proxy settings:**
```yaml
environments:
  staging:
    proxy:
      https: https://proxy.example.com:8080
```

3. **Use static analysis only:**
```bash
api-test security scan --static-only --spec api.yml
```

## Reporting Problems

### Issue: "Report generation fails"

**Symptoms:**
```
Error: Failed to generate HTML report
```

**Solutions:**

1. **Check output directory permissions:**
```bash
ls -la ./reports
chmod 755 ./reports
```

2. **Use alternative format:**
```bash
api-test run --format json  # Try JSON first
```

3. **Generate report separately:**
```bash
api-test report generate \
  --input ./test-results \
  --output ./reports \
  --format html
```

### Issue: "Missing charts in HTML reports"

**Symptoms:**
HTML report loads but charts are empty

**Solutions:**

1. **Enable chart generation:**
```bash
api-test run --format html --include-charts
```

2. **Check JavaScript console:**
Open browser developer tools and check for errors

3. **Use alternative template:**
```bash
api-test report generate --template simple
```

## Network and Connectivity

### Issue: "SSL certificate verification failed"

**Symptoms:**
```
Error: unable to verify the first certificate
```

**Solutions:**

1. **Disable SSL verification (development only):**
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

2. **Add CA certificate:**
```yaml
environments:
  staging:
    ssl:
      ca: /path/to/ca-cert.pem
```

3. **Configure client certificates:**
```yaml
environments:
  staging:
    ssl:
      cert: /path/to/client-cert.pem
      key: /path/to/client-key.pem
```

### Issue: "Proxy configuration not working"

**Symptoms:**
```
Error: ECONNREFUSED (proxy connection failed)
```

**Solutions:**

1. **Test proxy connectivity:**
```bash
curl -x http://proxy.example.com:8080 https://httpbin.org/ip
```

2. **Configure proxy authentication:**
```yaml
environments:
  staging:
    proxy:
      https: https://username:password@proxy.example.com:8080
```

3. **Set proxy bypass:**
```yaml
environments:
  staging:
    proxy:
      bypass:
        - "*.internal.example.com"
        - "localhost"
```

## Debugging Techniques

### Enable Debug Logging

```bash
# Framework debug logs
DEBUG=api-test:* api-test run

# HTTP request/response logging
DEBUG=api-test:http api-test run

# Performance debugging
DEBUG=api-test:performance api-test performance run

# Security scan debugging
DEBUG=api-test:security api-test security scan
```

### Verbose Output

```bash
# Maximum verbosity
api-test run --verbose --log-level debug

# Component-specific verbosity
api-test run --verbose-auth --verbose-generation
```

### Request/Response Inspection

```bash
# Save all HTTP traffic
api-test run --save-requests --output ./debug

# Inspect specific request
api-test debug request --request-id req_123456

# Replay specific request
api-test debug replay --request-file ./debug/requests/req_123456.json
```

### Memory and Performance Profiling

```bash
# Memory profiling
node --inspect api-test run
# Open chrome://inspect in Chrome

# CPU profiling
node --prof api-test performance run
node --prof-process isolate-*.log > profile.txt

# Heap snapshot
node --inspect-brk api-test run
# Use Chrome DevTools Memory tab
```

## Log Analysis

### Log Locations

```bash
# Default log file
cat ./logs/api-test.log

# System logs (if installed globally)
cat /var/log/api-test/api-test.log

# User-specific logs
cat ~/.api-test/logs/api-test.log
```

### Common Log Patterns

**Authentication Issues:**
```
[ERROR] AuthManager: Token refresh failed: invalid_grant
[DEBUG] AuthManager: Using cached token (expires: 2023-10-15T10:30:00Z)
```

**Network Issues:**
```
[ERROR] HttpClient: ECONNREFUSED api.example.com:443
[WARN] HttpClient: Retrying request (attempt 2/3)
```

**Performance Issues:**
```
[WARN] PerformanceTester: High response time detected: 5000ms
[INFO] PerformanceTester: Threshold exceeded: avgResponseTime (800ms > 500ms)
```

### Log Analysis Commands

```bash
# Filter error logs
grep "ERROR" api-test.log

# Count error types
grep "ERROR" api-test.log | cut -d: -f3 | sort | uniq -c

# Performance metrics
grep "responseTime" api-test.log | awk '{print $4}' | sort -n

# Authentication events
grep "Auth" api-test.log | tail -20
```

## Support Resources

### Self-Help Resources

1. **Built-in help:**
```bash
api-test --help
api-test <command> --help
api-test doctor  # Diagnostic tool
```

2. **Documentation:**
- [User Guide](../user-guide/getting-started.md)
- [API Reference](../api/README.md)
- [Configuration Reference](./configuration.md)

3. **Examples:**
- [Quick Start Examples](../../examples/quick-start/)
- [Integration Examples](../../examples/integrations/)

### Community Support

1. **GitHub Issues:**
- Bug reports: [GitHub Issues](https://github.com/yourorg/ai-api-test-automation/issues)
- Feature requests: [GitHub Discussions](https://github.com/yourorg/ai-api-test-automation/discussions)

2. **Stack Overflow:**
- Tag: `ai-api-test-automation`
- Search existing questions before posting

3. **Discord/Slack:**
- Community chat: [Discord Server](https://discord.gg/api-testing)

### Professional Support

1. **Enterprise Support:**
- 24/7 technical support
- Direct access to engineering team
- Custom integrations and consulting
- Contact: enterprise@yourorg.com

2. **Training and Consulting:**
- Best practices workshops
- Custom implementation guidance
- Performance optimization
- Contact: training@yourorg.com

### Reporting Bugs

When reporting bugs, include:

1. **Environment information:**
```bash
api-test doctor > diagnostic-info.txt
```

2. **Minimal reproduction case:**
```bash
# Create minimal test case
api-test reproduce --issue-id 12345
```

3. **Logs and configuration:**
```bash
# Sanitize and include logs
api-test logs --sanitize --since 1h > issue-logs.txt
```

4. **Expected vs actual behavior:**
- What you expected to happen
- What actually happened
- Steps to reproduce

### Getting Help Template

```markdown
## Issue Description
Brief description of the problem

## Environment
- Framework version: X.X.X
- Node.js version: X.X.X
- Operating System: OS and version
- Target API: Brief description

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Configuration
```yaml
# Include relevant configuration (sanitized)
```

## Logs
```
# Include relevant logs (sanitized)
```

## Additional Context
Any other relevant information
```

---

This troubleshooting guide covers the most common issues and their solutions. For issues not covered here, please refer to the support resources or create a detailed bug report.

**Next: [Monitoring & Alerting Guide →](./monitoring.md)**