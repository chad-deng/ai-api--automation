/**
 * Main Entry Point
 * AI API Test Automation Framework - Enterprise Edition
 */

// Core CLI - MVP Version
import { CLI } from './cli-mvp';
export { CLI };

// Main framework exports - MVP SCOPE ONLY
export { TestGenerator } from './generator/test-generator';
export { OpenAPIParser } from './parser/openapi-parser';
export { OpenAPIValidator } from './validator/openapi-validator';

// Enterprise features - excluded from MVP
// export { AuthManager } from './auth/auth-manager';
// export { ContractValidator } from './validator/contract-validator';
// export { PerformanceTester } from './performance/performance-tester';
// export { PerformanceOptimizer } from './performance/performance-optimizer';
// export { SecurityScanner } from './security/security-scanner';
// export { SystemMonitor } from './monitoring/system-monitor';
// export { IntegrationTestRunner } from './integration/integration-test-runner';
// export { ReportGenerator } from './reporting/report-generator';
// export { MockServer } from './mock/mock-server';

// Type definitions
export * from './types';

// Module exports (commented out for build compatibility)
// export * from './auth';
// export * from './generator';
// export * from './validator';
// export * from './performance';
// export * from './security';
// export * from './monitoring';
// export * from './integration';
// export * from './reporting';
// export * from './mock';

// Version information
export const version = '1.0.0';
export const name = '@yourorg/ai-api-test-automation';

// Default export for CLI usage
export default CLI;