/**
 * Integration Testing Module
 * Week 6 Sprint 1: End-to-end integration testing exports
 */

export { IntegrationTestRunner } from './integration-test-runner';
export { IntegrationConfigManager } from './integration-config';
export { IntegrationCli } from './integration-cli';

export type {
  IntegrationTestConfig,
  TestEnvironment,
  TestSuite,
  TestWorkflow,
  WorkflowStep,
  IntegrationTestResult,
  TestSummary,
  SuiteResult,
  WorkflowResult,
  TestResult,
  TestMetrics,
  TestCoverage
} from './integration-test-runner';

export type {
  IntegrationConfigTemplate
} from './integration-config';

export type {
  IntegrationCliOptions
} from './integration-cli';