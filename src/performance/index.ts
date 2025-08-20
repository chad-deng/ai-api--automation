// Performance optimization module exports

export { PerformanceOptimizer } from './performance-optimizer';
export { PerformanceCLI } from './performance-cli';

export type {
  PerformanceOptimizerConfig,
  PerformanceMetrics,
  OptimizationStrategy,
  OptimizationRecommendation,
  OptimizationResult,
  PerformanceOptimizationReport
} from './performance-optimizer';

// Re-export from existing performance module
export { PerformanceTester } from './performance-tester';
export { PerformanceTestConfig } from './performance-config';

export type {
  LoadTestConfig,
  StressTestConfig,
  PerformanceResult,
  PerformanceMetrics as PerformanceTestMetrics,
  LoadTestScenario,
  LoadTestRequest,
  PerformanceSummary,
  ThresholdResult
} from './performance-tester';