# 📚 API Reference

Complete reference documentation for the AI API Test Automation Framework APIs and interfaces.

## 📋 Table of Contents

- [Core Modules](#core-modules)
- [Authentication](#authentication)
- [Test Generation](#test-generation)
- [Validation](#validation)
- [Performance Testing](#performance-testing)
- [Security Scanning](#security-scanning)
- [Monitoring](#monitoring)
- [Reporting](#reporting)
- [Types & Interfaces](#types--interfaces)

## Core Modules

### CLI Interface

The main command-line interface for interacting with the framework.

#### `api-test generate`

Generate test suites from OpenAPI specifications.

```bash
api-test generate <type> [options]
```

**Types:**
- `tests` - Generate comprehensive test suite
- `functional` - Generate functional tests only
- `negative` - Generate negative test cases
- `performance` - Generate performance test scenarios
- `security` - Generate security test cases

**Options:**
```bash
--spec <file>           OpenAPI specification file (required)
--output <directory>    Output directory for generated tests
--include-negative      Include negative test cases
--include-boundary      Include boundary value testing
--include-performance   Include performance test scenarios
--format <format>       Output format (typescript, javascript, yaml)
--template <name>       Test template to use
--config <file>         Configuration file
--verbose              Enable verbose logging
```

**Examples:**
```bash
# Generate comprehensive test suite
api-test generate tests --spec api.yml --output ./tests --include-negative

# Generate only functional tests
api-test generate functional --spec api.yml --output ./functional-tests

# Generate performance tests with custom template
api-test generate performance \
  --spec api.yml \
  --output ./perf-tests \
  --template load-testing
```

#### `api-test run`

Execute test suites.

```bash
api-test run <type> [options]
```

**Types:**
- `functional` - Run functional tests
- `contract` - Run contract validation tests
- `performance` - Run performance tests
- `security` - Run security scans
- `integration` - Run integration tests
- `smoke` - Run smoke tests
- `all` - Run all test types

**Options:**
```bash
--environment <name>    Target environment
--config <file>         Test configuration file
--parallel <number>     Number of parallel workers
--timeout <seconds>     Test timeout in seconds
--output <directory>    Results output directory
--format <format>       Report format (html, json, junit, markdown)
--verbose              Enable verbose logging
--dry-run              Validate configuration without execution
--filter <pattern>      Filter tests by pattern
--retry <number>        Number of retry attempts for failed tests
```

**Examples:**
```bash
# Run functional tests in staging
api-test run functional --environment staging --parallel 4

# Run performance tests with custom timeout
api-test run performance \
  --environment production \
  --timeout 600 \
  --output ./perf-results

# Run all tests with HTML report
api-test run all \
  --environment staging \
  --format html \
  --output ./complete-results
```

#### `api-test config`

Manage environment and authentication configurations.

```bash
api-test config <command> [options]
```

**Commands:**
- `create` - Create new configuration
- `update` - Update existing configuration
- `delete` - Delete configuration
- `list` - List all configurations
- `test` - Test configuration connectivity
- `export` - Export configuration
- `import` - Import configuration

**Options:**
```bash
--name <name>           Configuration name
--base-url <url>        API base URL
--auth-profile <name>   Authentication profile
--timeout <seconds>     Request timeout
--retry <number>        Retry attempts
--headers <json>        Default headers
--variables <json>      Environment variables
```

**Examples:**
```bash
# Create staging environment
api-test config create \
  --name staging \
  --base-url https://api-staging.example.com \
  --auth-profile staging-auth \
  --timeout 30

# Test environment connectivity
api-test config test --name staging

# List all environments
api-test config list
```

#### `api-test auth`

Configure authentication methods.

```bash
api-test auth <command> [options]
```

**Commands:**
- `configure` - Configure authentication
- `test` - Test authentication
- `refresh` - Refresh tokens
- `list` - List auth profiles
- `delete` - Delete auth profile

**Options:**
```bash
--name <name>           Auth profile name
--type <type>           Auth type (oauth2, jwt, api-key, basic)
--token <token>         Bearer token
--client-id <id>        OAuth2 client ID
--client-secret <secret> OAuth2 client secret
--token-url <url>       OAuth2 token endpoint
--scope <scope>         OAuth2 scope
--header-name <name>    API key header name
--username <username>   Basic auth username
--password <password>   Basic auth password
```

**Examples:**
```bash
# Configure OAuth2
api-test auth configure \
  --name prod-oauth \
  --type oauth2 \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_SECRET \
  --token-url https://auth.example.com/oauth/token

# Configure API key
api-test auth configure \
  --name api-key-auth \
  --type api-key \
  --header-name X-API-Key \
  --token YOUR_API_KEY

# Test authentication
api-test auth test --name prod-oauth
```

## Authentication

### AuthManager Class

Manages authentication profiles and token handling.

```typescript
import { AuthManager } from '@yourorg/ai-api-test-automation';

const authManager = new AuthManager({
  configPath: './auth-config.json',
  profiles: {},
  defaultProfile: 'default'
});
```

#### Methods

##### `configure(profile: AuthProfile): Promise<void>`

Configure an authentication profile.

```typescript
await authManager.configure({
  name: 'my-oauth',
  type: 'oauth2',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tokenUrl: 'https://auth.example.com/oauth/token',
  scope: 'api:read api:write'
});
```

##### `authenticate(profileName: string): Promise<AuthToken>`

Authenticate using a profile and return tokens.

```typescript
const token = await authManager.authenticate('my-oauth');
console.log('Access token:', token.accessToken);
```

##### `getHeaders(profileName: string): Promise<Record<string, string>>`

Get authentication headers for API requests.

```typescript
const headers = await authManager.getHeaders('my-oauth');
// Returns: { 'Authorization': 'Bearer access_token' }
```

## Test Generation

### TestGenerator Class

Generates test cases from OpenAPI specifications.

```typescript
import { TestGenerator } from '@yourorg/ai-api-test-automation';

const generator = new TestGenerator();
```

#### Methods

##### `generateTestSuite(spec: ParsedOpenAPI, options: GenerationOptions): Promise<TestSuite>`

Generate a complete test suite.

```typescript
const testSuite = await generator.generateTestSuite(spec, {
  includeNegative: true,
  includeBoundary: true,
  includePerformance: false,
  maxTestsPerEndpoint: 10,
  authProfiles: ['staging-auth'],
  environments: ['staging']
});
```

##### `generateTestCase(operation: Operation, options: TestCaseOptions): Promise<TestCase>`

Generate a single test case for an operation.

```typescript
const testCase = await generator.generateTestCase(operation, {
  includeNegative: true,
  includeBoundary: true,
  dataGenerationStrategy: 'realistic'
});
```

##### `generateDataFromSchema(schema: Schema, options: DataGenerationOptions): any`

Generate test data from a JSON schema.

```typescript
const testData = generator.generateDataFromSchema(schema, {
  strategy: 'realistic',
  includeOptional: true,
  generateArrays: true,
  maxDepth: 3
});
```

## Validation

### ContractValidator Class

Validates API responses against OpenAPI contracts.

```typescript
import { ContractValidator } from '@yourorg/ai-api-test-automation';

const validator = new ContractValidator();
```

#### Methods

##### `validateContract(spec: ParsedOpenAPI, options: ValidationOptions): Promise<ValidationResult>`

Validate entire OpenAPI contract.

```typescript
const result = await validator.validateContract(spec, {
  strict: true,
  validateExamples: true,
  validateSecurity: true,
  allowAdditionalProperties: false
});

if (!result.valid) {
  console.log('Validation errors:', result.errors);
}
```

##### `validateResponse(response: ApiResponse, schema: Schema, options: ResponseValidationOptions): ValidationResult`

Validate API response against schema.

```typescript
const validationResult = validator.validateResponse(
  {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: { id: 1, name: 'John' }
  },
  responseSchema,
  { strict: true }
);
```

## Performance Testing

### PerformanceTester Class

Execute load and performance tests.

```typescript
import { PerformanceTester } from '@yourorg/ai-api-test-automation';

const perfTester = new PerformanceTester({
  concurrency: 10,
  duration: 60,
  rampUp: 10,
  outputDir: './perf-results',
  format: 'json'
});
```

#### Methods

##### `runLoadTest(config: LoadTestConfig): Promise<PerformanceResult>`

Execute load testing.

```typescript
const result = await perfTester.runLoadTest({
  baseURL: 'https://api.example.com',
  scenarios: [
    {
      name: 'User Journey',
      weight: 100,
      requests: [
        { method: 'GET', path: '/users', weight: 60 },
        { method: 'POST', path: '/users', weight: 40 }
      ]
    }
  ],
  thresholds: {
    avgResponseTime: 500,
    p95ResponseTime: 1000,
    errorRate: 1,
    minThroughput: 100
  }
});

console.log('Average response time:', result.metrics.avgResponseTime);
console.log('Throughput:', result.metrics.throughput);
```

##### `runStressTest(config: StressTestConfig): Promise<PerformanceResult>`

Execute stress testing to find breaking points.

```typescript
const stressResult = await perfTester.runStressTest({
  baseURL: 'https://api.example.com',
  startConcurrency: 1,
  maxConcurrency: 100,
  stepSize: 10,
  stepDuration: 30,
  breakingPointCriteria: {
    errorRate: 5,
    responseTime: 5000
  }
});
```

## Security Scanning

### SecurityScanner Class

Perform security vulnerability scans.

```typescript
import { SecurityScanner } from '@yourorg/ai-api-test-automation';

const scanner = new SecurityScanner();
```

#### Methods

##### `runScan(config: SecurityScanConfig): Promise<SecurityScanResult>`

Execute comprehensive security scan.

```typescript
const scanResult = await scanner.runScan({
  specPath: './api.yml',
  baseURL: 'https://api.example.com',
  scanTypes: ['owasp-top-10', 'authentication', 'authorization'],
  outputDir: './security-results',
  format: 'sarif',
  severity: ['critical', 'high', 'medium'],
  thresholds: {
    maxCritical: 0,
    maxHigh: 2,
    maxMedium: 5,
    failOnCritical: true
  }
});

console.log('Vulnerabilities found:', scanResult.summary.totalFindings);
console.log('Risk score:', scanResult.summary.riskScore);
```

##### `addRule(rule: SecurityRule): void`

Add custom security rule.

```typescript
scanner.addRule({
  id: 'custom-rule-001',
  name: 'Custom Validation Rule',
  description: 'Check for custom security requirement',
  severity: 'medium',
  category: 'input-validation',
  check: async (context) => {
    // Custom validation logic
    return findings;
  }
});
```

## Monitoring

### SystemMonitor Class

Monitor system performance and health.

```typescript
import { SystemMonitor } from '@yourorg/ai-api-test-automation';

const monitor = new SystemMonitor({
  metricsInterval: 5000,
  alertThresholds: {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    errorRate: { warning: 5, critical: 10 }
  },
  storage: { type: 'file', path: './monitoring.json' },
  notifications: [
    {
      type: 'webhook',
      endpoint: 'https://hooks.slack.com/your-webhook',
      threshold: 'critical',
      enabled: true
    }
  ],
  retentionPeriod: 7,
  enableRealTimeMonitoring: true
});
```

#### Methods

##### `start(): Promise<void>`

Start monitoring.

```typescript
await monitor.start();
console.log('Monitoring started');
```

##### `recordError(error: Partial<ErrorEvent>): void`

Record error event.

```typescript
monitor.recordError({
  severity: 'error',
  type: 'ApiError',
  message: 'API request failed',
  source: 'functional-test',
  context: { endpoint: '/users', method: 'GET' }
});
```

##### `getHealthStatus(): Promise<HealthStatus>`

Get current system health.

```typescript
const health = await monitor.getHealthStatus();
console.log('System status:', health.status);
console.log('Health score:', health.overall.score);
```

## Reporting

### ReportGenerator Class

Generate comprehensive test reports.

```typescript
import { ReportGenerator } from '@yourorg/ai-api-test-automation';

const reporter = new ReportGenerator();
```

#### Methods

##### `generateReport(data: ReportData, options: ReportOptions): Promise<void>`

Generate test report.

```typescript
await reporter.generateReport(
  {
    summary: testSummary,
    testResults: results,
    metrics: performanceMetrics,
    coverage: coverageData
  },
  {
    format: 'html',
    outputPath: './reports/test-report.html',
    title: 'API Test Results',
    includeCharts: true,
    template: 'comprehensive'
  }
);
```

##### `compareReports(baseline: ReportData, current: ReportData, options: ComparisonOptions): Promise<ComparisonReport>`

Compare test results between runs.

```typescript
const comparison = await reporter.compareReports(
  baselineData,
  currentData,
  {
    includePerformance: true,
    includeCoverage: true,
    thresholds: {
      performanceRegression: 10, // 10% regression threshold
      coverageDecrease: 5        // 5% coverage decrease threshold
    }
  }
);
```

## Types & Interfaces

### Core Types

#### `ParsedOpenAPI`

Represents a parsed OpenAPI specification.

```typescript
interface ParsedOpenAPI {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, PathItem>;
  components?: OpenAPIComponents;
  security?: SecurityRequirement[];
  tags?: OpenAPITag[];
}
```

#### `TestCase`

Represents a single test case.

```typescript
interface TestCase {
  id: string;
  name: string;
  description: string;
  operation: Operation;
  steps: TestStep[];
  expectedResults: ExpectedResult[];
  tags: string[];
  metadata: TestMetadata;
}
```

#### `TestStep`

Represents a step in a test case.

```typescript
interface TestStep {
  id: string;
  name: string;
  type: 'request' | 'validation' | 'setup' | 'cleanup';
  action: TestAction;
  expectedResponse?: ResponseExpectation;
  timeout?: number;
  retries?: number;
}
```

#### `PerformanceResult`

Performance test results.

```typescript
interface PerformanceResult {
  summary: PerformanceSummary;
  metrics: PerformanceMetrics;
  thresholds: ThresholdResult[];
  scenarios: ScenarioResult[];
  rawData: RawPerformanceData;
  passed: boolean;
}
```

#### `SecurityScanResult`

Security scan results.

```typescript
interface SecurityScanResult {
  summary: SecuritySummary;
  findings: SecurityFinding[];
  coverage: SecurityCoverage;
  thresholdResults: ThresholdResult[];
  scanTime: number;
  metadata: SecurityMetadata;
}
```

### Configuration Types

#### `AuthProfile`

Authentication profile configuration.

```typescript
interface AuthProfile {
  name: string;
  type: 'oauth2' | 'jwt' | 'api-key' | 'basic' | 'custom';
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  scope?: string;
  token?: string;
  headerName?: string;
  username?: string;
  password?: string;
  customHeaders?: Record<string, string>;
}
```

#### `TestEnvironment`

Environment configuration.

```typescript
interface TestEnvironment {
  name: string;
  baseURL: string;
  authProfile?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  variables?: Record<string, string>;
  mockServer?: MockServerConfig;
}
```

#### `GenerationOptions`

Test generation options.

```typescript
interface GenerationOptions {
  includeNegative?: boolean;
  includeBoundary?: boolean;
  includePerformance?: boolean;
  maxTestsPerEndpoint?: number;
  authProfiles?: string[];
  environments?: string[];
  outputFormat?: 'typescript' | 'javascript' | 'yaml' | 'json';
  template?: string;
  customRules?: GenerationRule[];
}
```

### Utility Types

#### `ApiResponse`

API response structure.

```typescript
interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  size: number;
}
```

#### `ValidationResult`

Validation result structure.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}
```

#### `ThresholdResult`

Threshold validation result.

```typescript
interface ThresholdResult {
  name: string;
  expected: number;
  actual: number;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}
```

---

For more detailed API documentation with examples, see the specific module documentation:

- [Authentication API](./auth.md)
- [Test Generation API](./generation.md)
- [Validation API](./validation.md)
- [Performance API](./performance.md)
- [Security API](./security.md)
- [Monitoring API](./monitoring.md)
- [Reporting API](./reporting.md)