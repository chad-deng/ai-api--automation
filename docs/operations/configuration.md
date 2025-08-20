# ⚙️ Configuration Reference

Comprehensive reference for all configuration options in the AI API Test Automation Framework.

## 📋 Table of Contents

- [Configuration Files](#configuration-files)
- [Global Configuration](#global-configuration)
- [Environment Configuration](#environment-configuration)
- [Test Configuration](#test-configuration)
- [Authentication Configuration](#authentication-configuration)
- [Performance Configuration](#performance-configuration)
- [Security Configuration](#security-configuration)
- [Monitoring Configuration](#monitoring-configuration)
- [Reporting Configuration](#reporting-configuration)
- [Integration Configuration](#integration-configuration)
- [Environment Variables](#environment-variables)
- [CLI Options](#cli-options)

## Configuration Files

The framework supports multiple configuration file formats and locations.

### File Formats

#### JSON Configuration
```json
{
  "global": {
    "logLevel": "info",
    "timeout": 30000,
    "retries": 3
  },
  "environments": {
    "staging": {
      "baseURL": "https://api-staging.example.com",
      "timeout": 15000
    }
  }
}
```

#### YAML Configuration
```yaml
global:
  logLevel: info
  timeout: 30000
  retries: 3

environments:
  staging:
    baseURL: https://api-staging.example.com
    timeout: 15000
```

#### TypeScript Configuration
```typescript
import { Configuration } from '@yourorg/ai-api-test-automation';

const config: Configuration = {
  global: {
    logLevel: 'info',
    timeout: 30000,
    retries: 3
  },
  environments: {
    staging: {
      baseURL: 'https://api-staging.example.com',
      timeout: 15000
    }
  }
};

export default config;
```

### Configuration Hierarchy

The framework loads configuration from multiple sources in order of precedence:

1. **CLI Arguments** (highest priority)
2. **Environment Variables**
3. **Project Configuration** (`api-test.config.{js,ts,json,yml}`)
4. **User Configuration** (`~/.api-test/config.{json,yml}`)
5. **Global Configuration** (`/etc/api-test/config.{json,yml}`)
6. **Default Values** (lowest priority)

### Loading Configuration

```bash
# Specify configuration file
api-test run --config ./custom-config.yml

# Use default configuration search
api-test run  # Searches for api-test.config.*

# Override specific values
api-test run --environment staging --timeout 60
```

## Global Configuration

Controls framework-wide behavior and defaults.

### Schema

```typescript
interface GlobalConfig {
  // Logging configuration
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  logFile?: string;
  logFormat?: 'json' | 'text' | 'structured';
  
  // Default timeouts and retries
  timeout?: number;                    // Request timeout in milliseconds
  retries?: number;                    // Number of retry attempts
  retryDelay?: number;                // Delay between retries in milliseconds
  
  // Concurrency and performance
  maxConcurrency?: number;            // Maximum concurrent operations
  rateLimit?: number;                 // Requests per second limit
  
  // Output and artifacts
  outputDir?: string;                 // Default output directory
  artifactRetention?: number;         // Days to retain artifacts
  
  // Plugin configuration
  plugins?: PluginConfig[];
  
  // Feature flags
  features?: {
    enableCaching?: boolean;
    enableMetrics?: boolean;
    enableTracing?: boolean;
  };
}
```

### Example

```yaml
global:
  # Logging
  logLevel: info
  logFile: ./logs/api-test.log
  logFormat: structured
  
  # Timeouts and retries
  timeout: 30000
  retries: 3
  retryDelay: 1000
  
  # Performance
  maxConcurrency: 10
  rateLimit: 100
  
  # Output
  outputDir: ./test-results
  artifactRetention: 30
  
  # Features
  features:
    enableCaching: true
    enableMetrics: true
    enableTracing: false
  
  # Plugins
  plugins:
    - name: custom-reporter
      enabled: true
      config:
        format: custom
        endpoint: https://reports.example.com
```

## Environment Configuration

Defines target environments for testing.

### Schema

```typescript
interface EnvironmentConfig {
  name: string;                       // Environment name
  baseURL: string;                    // API base URL
  description?: string;               // Environment description
  
  // Request configuration
  timeout?: number;                   // Request timeout override
  retries?: number;                   // Retry attempts override
  headers?: Record<string, string>;   // Default headers
  
  // Authentication
  authProfile?: string;               // Auth profile to use
  
  // Environment variables
  variables?: Record<string, string>;
  
  // SSL/TLS configuration
  ssl?: {
    verify?: boolean;                 // Verify SSL certificates
    cert?: string;                    // Client certificate
    key?: string;                     // Client private key
    ca?: string;                      // CA certificate
  };
  
  // Proxy configuration
  proxy?: {
    http?: string;                    // HTTP proxy
    https?: string;                   // HTTPS proxy
    bypass?: string[];                // Bypass patterns
  };
  
  // Mock server configuration
  mockServer?: {
    enabled: boolean;
    port: number;
    scenarios?: string[];
  };
  
  // Health check configuration
  healthCheck?: {
    endpoint: string;
    method?: string;
    expectedStatus?: number;
    timeout?: number;
  };
}
```

### Example

```yaml
environments:
  development:
    name: development
    description: Local development environment
    baseURL: http://localhost:3000
    timeout: 10000
    variables:
      API_VERSION: v1
      DEBUG: "true"
    mockServer:
      enabled: true
      port: 3001
      scenarios:
        - default
        - error-responses

  staging:
    name: staging
    description: Staging environment for integration testing
    baseURL: https://api-staging.example.com
    authProfile: staging-oauth
    timeout: 30000
    headers:
      X-Environment: staging
      X-Client-Version: "1.0.0"
    variables:
      API_VERSION: v1
      RATE_LIMIT: "1000"
    ssl:
      verify: true
    healthCheck:
      endpoint: /health
      expectedStatus: 200
      timeout: 5000

  production:
    name: production
    description: Production environment
    baseURL: https://api.example.com
    authProfile: prod-oauth
    timeout: 15000
    headers:
      X-Environment: production
    variables:
      API_VERSION: v1
    ssl:
      verify: true
    proxy:
      https: https://corporate-proxy.example.com:8080
      bypass:
        - "*.internal.example.com"
    healthCheck:
      endpoint: /health
      expectedStatus: 200
      timeout: 3000
```

## Test Configuration

Controls test generation and execution behavior.

### Schema

```typescript
interface TestConfig {
  // Generation options
  generation?: {
    includeNegative?: boolean;         // Generate negative test cases
    includeBoundary?: boolean;         // Generate boundary value tests
    includePerformance?: boolean;      // Generate performance tests
    maxTestsPerEndpoint?: number;      // Limit tests per endpoint
    dataStrategy?: 'minimal' | 'realistic' | 'comprehensive';
    templates?: string[];              // Test templates to use
  };
  
  // Execution options
  execution?: {
    parallel?: boolean;                // Enable parallel execution
    concurrency?: number;              // Number of parallel workers
    timeout?: number;                  // Test timeout
    retries?: number;                  // Retry failed tests
    stopOnFailure?: boolean;           // Stop on first failure
    randomOrder?: boolean;             // Randomize test order
  };
  
  // Filtering options
  filters?: {
    tags?: string[];                   // Include tests with tags
    excludeTags?: string[];            // Exclude tests with tags
    paths?: string[];                  // Include specific paths
    excludePaths?: string[];           // Exclude specific paths
    methods?: string[];                // Include specific HTTP methods
  };
  
  // Validation options
  validation?: {
    strict?: boolean;                  // Strict schema validation
    validateExamples?: boolean;        // Validate OpenAPI examples
    validateSecurity?: boolean;        // Validate security requirements
    allowAdditionalProperties?: boolean;
  };
}
```

### Example

```yaml
test:
  generation:
    includeNegative: true
    includeBoundary: true
    includePerformance: false
    maxTestsPerEndpoint: 10
    dataStrategy: realistic
    templates:
      - functional
      - edge-cases

  execution:
    parallel: true
    concurrency: 5
    timeout: 30000
    retries: 2
    stopOnFailure: false
    randomOrder: false

  filters:
    tags:
      - smoke
      - regression
    excludeTags:
      - experimental
    methods:
      - GET
      - POST
      - PUT

  validation:
    strict: true
    validateExamples: true
    validateSecurity: true
    allowAdditionalProperties: false
```

## Authentication Configuration

Defines authentication profiles for different environments.

### Schema

```typescript
interface AuthConfig {
  profiles: Record<string, AuthProfile>;
  defaultProfile?: string;
}

interface AuthProfile {
  name: string;
  type: 'oauth2' | 'jwt' | 'api-key' | 'basic' | 'custom';
  
  // OAuth2 configuration
  oauth2?: {
    clientId: string;
    clientSecret?: string;           // Can be env var reference
    tokenUrl: string;
    scope?: string;
    grantType?: 'client_credentials' | 'authorization_code' | 'password';
    
    // Authorization code flow
    authUrl?: string;
    redirectUri?: string;
    
    // Password flow
    username?: string;
    password?: string;               // Can be env var reference
    
    // Token refresh
    refreshToken?: string;
    refreshUrl?: string;
  };
  
  // JWT configuration
  jwt?: {
    token: string;                   // Can be env var reference
    header?: string;                 // Header name (default: Authorization)
    prefix?: string;                 // Token prefix (default: Bearer)
  };
  
  // API Key configuration
  apiKey?: {
    key: string;                     // Can be env var reference
    location: 'header' | 'query' | 'cookie';
    name: string;                    // Header/query/cookie name
  };
  
  // Basic authentication
  basic?: {
    username: string;
    password: string;                // Can be env var reference
  };
  
  // Custom authentication
  custom?: {
    headers?: Record<string, string>;
    beforeRequest?: string;          // Script to run before request
    afterResponse?: string;          // Script to run after response
  };
}
```

### Example

```yaml
auth:
  defaultProfile: staging-oauth
  
  profiles:
    staging-oauth:
      name: staging-oauth
      type: oauth2
      oauth2:
        clientId: staging-client-id
        clientSecret: ${STAGING_CLIENT_SECRET}
        tokenUrl: https://auth-staging.example.com/oauth/token
        scope: "api:read api:write"
        grantType: client_credentials

    prod-oauth:
      name: prod-oauth
      type: oauth2
      oauth2:
        clientId: prod-client-id
        clientSecret: ${PROD_CLIENT_SECRET}
        tokenUrl: https://auth.example.com/oauth/token
        scope: "api:read api:write"
        grantType: client_credentials

    api-key-auth:
      name: api-key-auth
      type: api-key
      apiKey:
        key: ${API_KEY}
        location: header
        name: X-API-Key

    jwt-auth:
      name: jwt-auth
      type: jwt
      jwt:
        token: ${JWT_TOKEN}
        header: Authorization
        prefix: Bearer

    basic-auth:
      name: basic-auth
      type: basic
      basic:
        username: test-user
        password: ${TEST_PASSWORD}

    custom-auth:
      name: custom-auth
      type: custom
      custom:
        headers:
          X-Custom-Auth: ${CUSTOM_TOKEN}
          X-Client-ID: ${CLIENT_ID}
```

## Performance Configuration

Controls performance testing behavior.

### Schema

```typescript
interface PerformanceConfig {
  // Load testing configuration
  loadTesting?: {
    concurrency?: number;            // Number of virtual users
    duration?: number;               // Test duration in seconds
    rampUp?: number;                 // Ramp-up time in seconds
    rampDown?: number;               // Ramp-down time in seconds
    
    // Scenarios
    scenarios?: LoadTestScenario[];
    
    // Thresholds
    thresholds?: {
      avgResponseTime?: number;      // Average response time (ms)
      p95ResponseTime?: number;      // 95th percentile response time (ms)
      p99ResponseTime?: number;      // 99th percentile response time (ms)
      errorRate?: number;            // Error rate percentage
      minThroughput?: number;        // Minimum requests per second
    };
  };
  
  // Stress testing configuration
  stressTesting?: {
    startConcurrency?: number;       // Starting number of users
    maxConcurrency?: number;         // Maximum number of users
    stepSize?: number;               // User increment per step
    stepDuration?: number;           // Duration of each step (seconds)
    
    // Breaking point criteria
    breakingPoint?: {
      errorRate?: number;            // Error rate threshold
      responseTime?: number;         // Response time threshold
      throughput?: number;           // Throughput threshold
    };
  };
  
  // Monitoring during tests
  monitoring?: {
    enabled?: boolean;
    interval?: number;               // Metrics collection interval (ms)
    metrics?: string[];              // Metrics to collect
  };
}

interface LoadTestScenario {
  name: string;
  weight: number;                    // Percentage of traffic
  requests: LoadTestRequest[];
}

interface LoadTestRequest {
  method: string;
  path: string;
  weight: number;                    // Percentage within scenario
  headers?: Record<string, string>;
  body?: any;
  think_time?: number;               // Delay before request (ms)
}
```

### Example

```yaml
performance:
  loadTesting:
    concurrency: 50
    duration: 300
    rampUp: 30
    rampDown: 30
    
    scenarios:
      - name: User Registration Flow
        weight: 30
        requests:
          - method: POST
            path: /users/register
            weight: 100
            think_time: 1000
      
      - name: API Browse Flow
        weight: 70
        requests:
          - method: GET
            path: /users
            weight: 60
            think_time: 500
          - method: GET
            path: /users/{id}
            weight: 30
            think_time: 300
          - method: PUT
            path: /users/{id}
            weight: 10
            think_time: 1000
    
    thresholds:
      avgResponseTime: 500
      p95ResponseTime: 1000
      p99ResponseTime: 2000
      errorRate: 1
      minThroughput: 100

  stressTesting:
    startConcurrency: 1
    maxConcurrency: 200
    stepSize: 10
    stepDuration: 60
    
    breakingPoint:
      errorRate: 5
      responseTime: 5000
      throughput: 50

  monitoring:
    enabled: true
    interval: 5000
    metrics:
      - cpu
      - memory
      - network
      - response_time
      - error_rate
```

## Security Configuration

Controls security scanning and validation.

### Schema

```typescript
interface SecurityConfig {
  // Scan configuration
  scanning?: {
    scanTypes?: SecurityScanType[];
    severity?: SecuritySeverity[];
    excludeRules?: string[];
    customRules?: string[];          // Path to custom rules
    
    // Thresholds
    thresholds?: {
      maxCritical?: number;
      maxHigh?: number;
      maxMedium?: number;
      maxTotal?: number;
      failOnCritical?: boolean;
      failOnHigh?: boolean;
    };
  };
  
  // Runtime security testing
  runtime?: {
    enabled?: boolean;
    authBypass?: boolean;            // Test auth bypass
    injectionTests?: boolean;        // Test injection attacks
    rateLimitTests?: boolean;        // Test rate limiting
    corsTests?: boolean;             // Test CORS configuration
  };
  
  // SSL/TLS configuration
  ssl?: {
    validateCertificates?: boolean;
    minTlsVersion?: string;          // Minimum TLS version
    allowedCiphers?: string[];       // Allowed cipher suites
  };
  
  // Compliance checking
  compliance?: {
    standards?: string[];            // OWASP, ISO27001, etc.
    frameworks?: string[];           // NIST, CIS, etc.
  };
}

type SecurityScanType = 
  | 'owasp-top-10'
  | 'injection'
  | 'authentication'
  | 'authorization'
  | 'data-exposure'
  | 'security-misconfiguration'
  | 'vulnerable-components'
  | 'insufficient-logging'
  | 'cors'
  | 'ssl-tls'
  | 'rate-limiting'
  | 'input-validation';

type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
```

### Example

```yaml
security:
  scanning:
    scanTypes:
      - owasp-top-10
      - authentication
      - authorization
      - data-exposure
      - input-validation
    
    severity:
      - critical
      - high
      - medium
      - low
    
    excludeRules:
      - rule-001  # False positive rule
      - rule-015  # Not applicable to our API
    
    customRules:
      - ./security/custom-rules.js
    
    thresholds:
      maxCritical: 0
      maxHigh: 2
      maxMedium: 5
      maxTotal: 20
      failOnCritical: true
      failOnHigh: false

  runtime:
    enabled: true
    authBypass: true
    injectionTests: true
    rateLimitTests: true
    corsTests: true

  ssl:
    validateCertificates: true
    minTlsVersion: "1.2"
    allowedCiphers:
      - "ECDHE-RSA-AES256-GCM-SHA384"
      - "ECDHE-RSA-AES128-GCM-SHA256"

  compliance:
    standards:
      - OWASP
      - ISO27001
    frameworks:
      - NIST
      - CIS
```

## Monitoring Configuration

Controls system monitoring and alerting.

### Schema

```typescript
interface MonitoringConfig {
  // Metrics collection
  metrics?: {
    enabled?: boolean;
    interval?: number;               // Collection interval (ms)
    retention?: number;              // Retention period (days)
    
    // Storage configuration
    storage?: {
      type?: 'memory' | 'file' | 'database';
      path?: string;
      maxSize?: number;              // Maximum storage size (bytes)
      compression?: boolean;
    };
  };
  
  // Alerting configuration
  alerting?: {
    enabled?: boolean;
    
    // Thresholds
    thresholds?: {
      cpu?: { warning: number; critical: number };
      memory?: { warning: number; critical: number };
      disk?: { warning: number; critical: number };
      errorRate?: { warning: number; critical: number };
      responseTime?: { warning: number; critical: number };
    };
    
    // Notification channels
    notifications?: NotificationConfig[];
  };
  
  // Health checking
  healthChecks?: {
    enabled?: boolean;
    interval?: number;               // Check interval (ms)
    timeout?: number;                // Check timeout (ms)
    
    // Custom health checks
    checks?: HealthCheckConfig[];
  };
  
  // Logging configuration
  logging?: {
    level?: 'error' | 'warn' | 'info' | 'debug';
    format?: 'json' | 'text' | 'structured';
    destinations?: LogDestination[];
  };
}

interface NotificationConfig {
  type: 'webhook' | 'email' | 'slack' | 'teams';
  endpoint: string;
  threshold: 'warning' | 'critical';
  enabled: boolean;
  config?: any;                      // Channel-specific configuration
}

interface HealthCheckConfig {
  name: string;
  type: 'http' | 'tcp' | 'custom';
  config: any;                       // Check-specific configuration
  interval?: number;
  timeout?: number;
}

interface LogDestination {
  type: 'file' | 'console' | 'syslog' | 'elasticsearch';
  config: any;                       // Destination-specific configuration
}
```

### Example

```yaml
monitoring:
  metrics:
    enabled: true
    interval: 5000
    retention: 30
    
    storage:
      type: file
      path: ./monitoring/metrics.json
      maxSize: 104857600  # 100MB
      compression: true

  alerting:
    enabled: true
    
    thresholds:
      cpu:
        warning: 70
        critical: 90
      memory:
        warning: 80
        critical: 95
      disk:
        warning: 85
        critical: 95
      errorRate:
        warning: 5
        critical: 10
      responseTime:
        warning: 1000
        critical: 5000
    
    notifications:
      - type: slack
        endpoint: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
        threshold: warning
        enabled: true
        config:
          channel: "#alerts"
          username: "API Test Bot"
      
      - type: email
        endpoint: alerts@example.com
        threshold: critical
        enabled: true
        config:
          smtp:
            host: smtp.example.com
            port: 587
            secure: true

  healthChecks:
    enabled: true
    interval: 30000
    timeout: 5000
    
    checks:
      - name: Database Connection
        type: custom
        config:
          script: ./health-checks/database.js
        interval: 60000
      
      - name: External API
        type: http
        config:
          url: https://api.example.com/health
          method: GET
          expectedStatus: 200

  logging:
    level: info
    format: structured
    destinations:
      - type: file
        config:
          path: ./logs/monitoring.log
          maxSize: 52428800  # 50MB
          rotation: daily
      
      - type: console
        config:
          colorize: true
```

## Reporting Configuration

Controls test reporting and output.

### Schema

```typescript
interface ReportingConfig {
  // Output configuration
  output?: {
    formats?: ReportFormat[];
    directory?: string;
    filename?: string;               // Template: {timestamp}-{type}-report
    
    // Report customization
    title?: string;
    description?: string;
    includeCharts?: boolean;
    includeMetrics?: boolean;
    includeLogs?: boolean;
    
    // Template configuration
    template?: string;               // Built-in or custom template
    customTemplate?: string;         // Path to custom template
  };
  
  // Report generation
  generation?: {
    parallel?: boolean;              // Generate reports in parallel
    incremental?: boolean;           // Generate incremental reports
    
    // Content options
    includePassedTests?: boolean;
    includeSkippedTests?: boolean;
    includeSystemInfo?: boolean;
    includeEnvironmentInfo?: boolean;
  };
  
  // Report distribution
  distribution?: {
    enabled?: boolean;
    
    // Upload destinations
    destinations?: ReportDestination[];
    
    // Notifications
    notifications?: ReportNotification[];
  };
  
  // Retention policy
  retention?: {
    keepReports?: number;            // Number of reports to keep
    archiveAfter?: number;           // Days before archiving
    deleteAfter?: number;            // Days before deletion
  };
}

type ReportFormat = 'html' | 'json' | 'junit' | 'markdown' | 'pdf' | 'csv';

interface ReportDestination {
  type: 'file' | 's3' | 'azure' | 'gcs' | 'ftp' | 'http';
  config: any;                       // Destination-specific configuration
}

interface ReportNotification {
  type: 'email' | 'slack' | 'teams' | 'webhook';
  trigger: 'always' | 'failure' | 'success' | 'threshold';
  config: any;                       // Notification-specific configuration
}
```

### Example

```yaml
reporting:
  output:
    formats:
      - html
      - json
      - junit
    directory: ./reports
    filename: "{timestamp}-{environment}-{type}-report"
    
    title: "API Test Results"
    description: "Automated API testing results for {environment}"
    includeCharts: true
    includeMetrics: true
    includeLogs: false
    
    template: comprehensive

  generation:
    parallel: true
    incremental: false
    
    includePassedTests: true
    includeSkippedTests: true
    includeSystemInfo: true
    includeEnvironmentInfo: true

  distribution:
    enabled: true
    
    destinations:
      - type: s3
        config:
          bucket: api-test-reports
          region: us-east-1
          prefix: "reports/{environment}/"
          
      - type: http
        config:
          url: https://reports.example.com/api/upload
          method: POST
          headers:
            Authorization: "Bearer ${REPORTS_API_TOKEN}"
    
    notifications:
      - type: slack
        trigger: failure
        config:
          webhook: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
          channel: "#test-results"
          message: "API tests failed in {environment}. Report: {report_url}"
      
      - type: email
        trigger: always
        config:
          to:
            - team@example.com
            - qa@example.com
          subject: "API Test Results - {environment}"
          template: email-report.html

  retention:
    keepReports: 50
    archiveAfter: 30
    deleteAfter: 90
```

## Integration Configuration

Controls CI/CD and external integrations.

### Schema

```typescript
interface IntegrationConfig {
  // CI/CD platform configuration
  cicd?: {
    platform?: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops' | 'circleci';
    
    // Pipeline configuration
    pipeline?: {
      triggers?: TriggerConfig[];
      environments?: string[];
      stages?: StageConfig[];
      parallelization?: boolean;
    };
    
    // Quality gates
    qualityGates?: {
      coverage?: { minimum: number; delta: number };
      performance?: { maxRegression: number };
      security?: { maxCritical: number; maxHigh: number };
    };
  };
  
  // External tools
  tools?: {
    // Test management
    testRail?: TestRailConfig;
    xray?: XrayConfig;
    
    // Monitoring
    datadog?: DatadogConfig;
    newRelic?: NewRelicConfig;
    
    // Security
    sonarQube?: SonarQubeConfig;
    veracode?: VeracodeConfig;
  };
  
  // Webhooks
  webhooks?: {
    enabled?: boolean;
    endpoints?: WebhookEndpoint[];
  };
}

interface TriggerConfig {
  type: 'push' | 'pull_request' | 'schedule' | 'manual';
  branches?: string[];
  schedule?: string;                 // Cron expression
  conditions?: any[];
}

interface StageConfig {
  name: string;
  type: 'test' | 'security' | 'performance' | 'deploy';
  config: any;
  dependencies?: string[];
  parallel?: boolean;
}

interface WebhookEndpoint {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
}
```

### Example

```yaml
integration:
  cicd:
    platform: github-actions
    
    pipeline:
      triggers:
        - type: push
          branches:
            - main
            - develop
        - type: pull_request
          branches:
            - main
        - type: schedule
          schedule: "0 2 * * *"  # Daily at 2 AM
      
      environments:
        - staging
        - production
      
      stages:
        - name: functional-tests
          type: test
          config:
            testTypes:
              - functional
              - contract
          parallel: true
        
        - name: security-scan
          type: security
          config:
            scanTypes:
              - owasp-top-10
              - authentication
          dependencies:
            - functional-tests
        
        - name: performance-tests
          type: performance
          config:
            concurrency: 20
            duration: 300
          dependencies:
            - functional-tests
    
    qualityGates:
      coverage:
        minimum: 80
        delta: -5
      performance:
        maxRegression: 10
      security:
        maxCritical: 0
        maxHigh: 2

  tools:
    sonarQube:
      enabled: true
      serverUrl: https://sonar.example.com
      projectKey: api-test-automation
      token: ${SONAR_TOKEN}
    
    datadog:
      enabled: true
      apiKey: ${DATADOG_API_KEY}
      site: datadoghq.com
      tags:
        - "environment:{environment}"
        - "team:api-testing"

  webhooks:
    enabled: true
    endpoints:
      - url: https://api.example.com/webhooks/test-results
        events:
          - test.completed
          - test.failed
        secret: ${WEBHOOK_SECRET}
        headers:
          X-Source: api-test-automation
```

## Environment Variables

The framework supports environment variable substitution in configuration files.

### Variable Syntax

```yaml
# Direct reference
auth:
  token: ${API_TOKEN}

# Default value
auth:
  token: ${API_TOKEN:-default-token}

# Required variable (fails if not set)
auth:
  token: ${API_TOKEN:?API_TOKEN is required}
```

### Standard Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_TEST_CONFIG` | Path to configuration file | `./api-test.config.*` |
| `API_TEST_LOG_LEVEL` | Logging level | `info` |
| `API_TEST_OUTPUT_DIR` | Output directory | `./test-results` |
| `API_TEST_TIMEOUT` | Default timeout (ms) | `30000` |
| `API_TEST_RETRIES` | Default retry count | `3` |
| `API_TEST_CONCURRENCY` | Default concurrency | `10` |

### Authentication Variables

| Variable | Description |
|----------|-------------|
| `API_TOKEN` | API authentication token |
| `CLIENT_ID` | OAuth2 client ID |
| `CLIENT_SECRET` | OAuth2 client secret |
| `JWT_TOKEN` | JWT authentication token |
| `API_KEY` | API key for authentication |
| `USERNAME` | Basic auth username |
| `PASSWORD` | Basic auth password |

### Integration Variables

| Variable | Description |
|----------|-------------|
| `SONAR_TOKEN` | SonarQube authentication token |
| `DATADOG_API_KEY` | Datadog API key |
| `SLACK_WEBHOOK` | Slack webhook URL |
| `REPORTS_API_TOKEN` | Reports API authentication token |

## CLI Options

All configuration options can be overridden via CLI arguments.

### Global Options

```bash
--config <file>                     # Configuration file path
--log-level <level>                 # Logging level
--timeout <ms>                      # Request timeout
--retries <count>                   # Retry attempts
--output-dir <directory>            # Output directory
--verbose                           # Enable verbose logging
--quiet                             # Suppress output
--dry-run                           # Validate without execution
```

### Test Options

```bash
--environment <name>                # Target environment
--parallel <count>                  # Parallel execution
--include-negative                  # Include negative tests
--include-boundary                  # Include boundary tests
--stop-on-failure                   # Stop on first failure
--filter <pattern>                  # Filter tests by pattern
--tags <tags>                       # Include specific tags
--exclude-tags <tags>               # Exclude specific tags
```

### Performance Options

```bash
--concurrency <count>               # Number of virtual users
--duration <seconds>                # Test duration
--ramp-up <seconds>                 # Ramp-up time
--threshold-response-time <ms>      # Response time threshold
--threshold-error-rate <%>          # Error rate threshold
```

### Security Options

```bash
--scan-types <types>                # Security scan types
--severity <levels>                 # Severity levels to include
--exclude-rules <rules>             # Rules to exclude
--fail-on-critical                  # Fail on critical findings
```

### Output Options

```bash
--format <formats>                  # Report formats
--title <title>                     # Report title
--include-charts                    # Include charts in reports
--template <name>                   # Report template
```

---

This configuration reference provides complete control over the framework's behavior. Use the hierarchical configuration system to set defaults globally and override them per environment or execution.

**Next: [CI/CD Integration Guide →](./cicd.md)**