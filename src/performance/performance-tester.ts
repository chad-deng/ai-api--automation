/**
 * Performance Testing Module
 * Week 5 Sprint 1: Load testing and performance validation capabilities
 */

import { EventEmitter } from 'events';
import { ApiClient, AuthConfig } from '../generator/helpers/api-client';
import { CredentialManager } from '../auth/credential-manager';
import { ParsedOpenAPI, Operation } from '../types';

export interface PerformanceTestConfig {
  // Load testing configuration
  concurrency: number; // Number of concurrent users
  duration: number; // Test duration in seconds
  rampUp?: number; // Ramp-up time in seconds
  rampDown?: number; // Ramp-down time in seconds
  
  // Request configuration
  baseURL: string;
  endpoints?: EndpointConfig[];
  authProfile?: string;
  
  // Thresholds
  thresholds?: PerformanceThresholds;
  
  // Test scenario
  scenario?: TestScenario;
  
  // Reporting
  outputDir?: string;
  includeDetailedMetrics?: boolean;
  generateReport?: boolean;
}

export interface EndpointConfig {
  method: string;
  path: string;
  weight?: number; // Relative frequency (default: 1)
  data?: any; // Request payload
  params?: Record<string, any>; // Query parameters
}

export interface PerformanceThresholds {
  avgResponseTime?: number; // ms
  maxResponseTime?: number; // ms
  errorRate?: number; // percentage (0-100)
  throughput?: number; // requests per second
  p95ResponseTime?: number; // ms
  p99ResponseTime?: number; // ms
}

export interface TestScenario {
  name: string;
  description?: string;
  steps: ScenarioStep[];
}

export interface ScenarioStep {
  name: string;
  method: string;
  path: string;
  data?: any;
  params?: Record<string, any>;
  delay?: number; // Delay after this step in ms
  validation?: StepValidation;
}

export interface StepValidation {
  statusCode?: number;
  responseTime?: number;
  responseContains?: string;
}

export interface PerformanceResult {
  success: boolean;
  summary: PerformanceSummary;
  metrics: PerformanceMetrics;
  thresholdResults: ThresholdResult[];
  errors: string[];
  reportPath?: string;
}

export interface PerformanceSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duration: number; // actual test duration in seconds
  throughput: number; // requests per second
  errorRate: number; // percentage
}

export interface PerformanceMetrics {
  responseTime: ResponseTimeMetrics;
  throughput: ThroughputMetrics;
  errors: ErrorMetrics;
  timestamps: number[]; // Request timestamps
}

export interface ResponseTimeMetrics {
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
  distribution: ResponseTimeDistribution;
}

export interface ResponseTimeDistribution {
  '< 100ms': number;
  '100-500ms': number;
  '500ms-1s': number;
  '1-2s': number;
  '2-5s': number;
  '> 5s': number;
}

export interface ThroughputMetrics {
  avg: number;
  max: number;
  min: number;
  timeline: ThroughputPoint[];
}

export interface ThroughputPoint {
  timestamp: number;
  rps: number; // requests per second
}

export interface ErrorMetrics {
  byStatusCode: Record<number, number>;
  byType: Record<string, number>;
  timeline: ErrorPoint[];
}

export interface ErrorPoint {
  timestamp: number;
  count: number;
  type: string;
}

export interface ThresholdResult {
  name: string;
  threshold: number;
  actual: number;
  passed: boolean;
  description: string;
}

export interface RequestResult {
  startTime: number;
  endTime: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  endpoint: string;
  method: string;
}

export class PerformanceTester extends EventEmitter {
  private credentialManager: CredentialManager;
  private apiClient?: ApiClient;
  private results: RequestResult[] = [];
  private startTime?: number;
  private endTime?: number;

  constructor() {
    super();
    this.credentialManager = new CredentialManager();
  }

  /**
   * Run performance test
   */
  async runTest(config: PerformanceTestConfig): Promise<PerformanceResult> {
    try {
      this.emit('testStart', config);
      
      // Initialize authentication
      await this.initializeAuth(config);
      
      // Validate configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          summary: this.createEmptySummary(),
          metrics: this.createEmptyMetrics(),
          thresholdResults: [],
          errors: validation.errors
        };
      }

      // Clear previous results
      this.results = [];
      this.startTime = Date.now();

      // Run the performance test
      if (config.scenario) {
        await this.runScenarioTest(config);
      } else {
        await this.runLoadTest(config);
      }

      this.endTime = Date.now();

      // Calculate metrics and results
      const metrics = this.calculateMetrics();
      const summary = this.calculateSummary(config);
      const thresholdResults = this.evaluateThresholds(config.thresholds, metrics, summary);

      const result: PerformanceResult = {
        success: thresholdResults.every(tr => tr.passed),
        summary,
        metrics,
        thresholdResults,
        errors: []
      };

      // Generate report if requested
      if (config.generateReport && config.outputDir) {
        result.reportPath = await this.generateReport(result, config);
      }

      this.emit('testComplete', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('testError', error);
      
      return {
        success: false,
        summary: this.createEmptySummary(),
        metrics: this.createEmptyMetrics(),
        thresholdResults: [],
        errors: [errorMessage]
      };
    }
  }

  /**
   * Run load test with concurrent requests
   */
  private async runLoadTest(config: PerformanceTestConfig): Promise<void> {
    const { concurrency, duration, rampUp = 0, rampDown = 0 } = config;
    const endpoints = config.endpoints || [{ method: 'GET', path: '/' }];
    
    const totalDuration = duration + rampUp + rampDown;
    const endTime = Date.now() + (totalDuration * 1000);
    
    // Create worker promises for concurrent execution
    const workers: Promise<void>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      const workerDelay = rampUp > 0 ? (i * (rampUp * 1000)) / concurrency : 0;
      workers.push(this.createWorker(i, endpoints, endTime, workerDelay, config));
    }

    // Wait for all workers to complete
    await Promise.all(workers);
  }

  /**
   * Run scenario-based test
   */
  private async runScenarioTest(config: PerformanceTestConfig): Promise<void> {
    if (!config.scenario) return;

    const { concurrency, duration } = config;
    const endTime = Date.now() + (duration * 1000);
    
    const workers: Promise<void>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      workers.push(this.runScenarioWorker(config.scenario, endTime, i));
    }

    await Promise.all(workers);
  }

  /**
   * Create a worker for load testing
   */
  private async createWorker(
    workerId: number, 
    endpoints: EndpointConfig[], 
    endTime: number, 
    delay: number,
    config: PerformanceTestConfig
  ): Promise<void> {
    // Initial delay for ramp-up
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    while (Date.now() < endTime) {
      // Select endpoint based on weight
      const endpoint = this.selectEndpoint(endpoints);
      await this.executeRequest(endpoint, workerId, config);
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Run scenario worker
   */
  private async runScenarioWorker(scenario: TestScenario, endTime: number, workerId: number): Promise<void> {
    let iterationCount = 0;
    
    while (Date.now() < endTime) {
      this.emit('scenarioStart', { workerId, scenario: scenario.name, iteration: iterationCount });
      
      for (const step of scenario.steps) {
        if (Date.now() >= endTime) break;
        
        const endpoint: EndpointConfig = {
          method: step.method,
          path: step.path,
          data: step.data,
          params: step.params
        };

        const result = await this.executeRequest(endpoint, workerId, { baseURL: '' });
        
        // Validate step if validation is defined
        if (step.validation) {
          this.validateStep(step, result);
        }
        
        // Apply step delay
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }
      
      iterationCount++;
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest(
    endpoint: EndpointConfig, 
    workerId: number, 
    config: PerformanceTestConfig
  ): Promise<RequestResult> {
    const startTime = Date.now();
    
    try {
      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      let response;
      const method = endpoint.method.toLowerCase();

      switch (method) {
        case 'get':
          response = await this.apiClient.get(endpoint.path, { params: endpoint.params });
          break;
        case 'post':
          response = await this.apiClient.post(endpoint.path, endpoint.data, { params: endpoint.params });
          break;
        case 'put':
          response = await this.apiClient.put(endpoint.path, endpoint.data, { params: endpoint.params });
          break;
        case 'patch':
          response = await this.apiClient.patch(endpoint.path, endpoint.data, { params: endpoint.params });
          break;
        case 'delete':
          response = await this.apiClient.delete(endpoint.path, { params: endpoint.params });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${endpoint.method}`);
      }

      const endTime = Date.now();
      const result: RequestResult = {
        startTime,
        endTime,
        responseTime: endTime - startTime,
        statusCode: response.status,
        success: response.status >= 200 && response.status < 400,
        endpoint: endpoint.path,
        method: endpoint.method.toUpperCase()
      };

      this.results.push(result);
      this.emit('requestComplete', { workerId, result });
      
      return result;

    } catch (error) {
      const endTime = Date.now();
      const result: RequestResult = {
        startTime,
        endTime,
        responseTime: endTime - startTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: endpoint.path,
        method: endpoint.method.toUpperCase()
      };

      this.results.push(result);
      this.emit('requestError', { workerId, result, error });
      
      return result;
    }
  }

  /**
   * Select endpoint based on weight
   */
  private selectEndpoint(endpoints: EndpointConfig[]): EndpointConfig {
    const totalWeight = endpoints.reduce((sum, ep) => sum + (ep.weight || 1), 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const endpoint of endpoints) {
      currentWeight += endpoint.weight || 1;
      if (random <= currentWeight) {
        return endpoint;
      }
    }
    
    return endpoints[0];
  }

  /**
   * Validate scenario step
   */
  private validateStep(step: ScenarioStep, result: RequestResult): void {
    if (!step.validation) return;

    const { statusCode, responseTime } = step.validation;
    
    if (statusCode && result.statusCode !== statusCode) {
      this.emit('stepValidationFailed', {
        step: step.name,
        expected: statusCode,
        actual: result.statusCode
      });
    }
    
    if (responseTime && result.responseTime > responseTime) {
      this.emit('stepValidationFailed', {
        step: step.name,
        expected: `< ${responseTime}ms`,
        actual: `${result.responseTime}ms`
      });
    }
  }

  /**
   * Initialize authentication
   */
  private async initializeAuth(config: PerformanceTestConfig): Promise<void> {
    await this.credentialManager.initialize();
    
    let authConfig: AuthConfig | undefined;
    
    if (config.authProfile) {
      const profile = await this.credentialManager.getProfile(config.authProfile);
      if (profile) {
        authConfig = {
          type: profile.type,
          token: profile.credentials.token,
          apiKey: profile.credentials.apiKey,
          username: profile.credentials.username,
          password: profile.credentials.password
        };
      }
    }

    this.apiClient = new ApiClient({
      baseURL: config.baseURL,
      timeout: 30000, // Longer timeout for performance tests
      auth: authConfig
    });
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: PerformanceTestConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.baseURL) {
      errors.push('Base URL is required');
    }

    if (config.concurrency <= 0) {
      errors.push('Concurrency must be greater than 0');
    }

    if (config.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (config.scenario && (!config.scenario.steps || config.scenario.steps.length === 0)) {
      errors.push('Scenario must have at least one step');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(): PerformanceMetrics {
    if (this.results.length === 0) {
      return this.createEmptyMetrics();
    }

    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    const successfulResults = this.results.filter(r => r.success);

    // Response time metrics
    const responseTime: ResponseTimeMetrics = {
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      avg: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      median: this.calculatePercentile(responseTimes, 50),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99),
      distribution: this.calculateResponseTimeDistribution(responseTimes)
    };

    // Throughput metrics
    const throughput = this.calculateThroughputMetrics();

    // Error metrics
    const errors = this.calculateErrorMetrics();

    return {
      responseTime,
      throughput,
      errors,
      timestamps: this.results.map(r => r.startTime)
    };
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  /**
   * Calculate response time distribution
   */
  private calculateResponseTimeDistribution(responseTimes: number[]): ResponseTimeDistribution {
    const distribution: ResponseTimeDistribution = {
      '< 100ms': 0,
      '100-500ms': 0,
      '500ms-1s': 0,
      '1-2s': 0,
      '2-5s': 0,
      '> 5s': 0
    };

    responseTimes.forEach(rt => {
      if (rt < 100) distribution['< 100ms']++;
      else if (rt < 500) distribution['100-500ms']++;
      else if (rt < 1000) distribution['500ms-1s']++;
      else if (rt < 2000) distribution['1-2s']++;
      else if (rt < 5000) distribution['2-5s']++;
      else distribution['> 5s']++;
    });

    return distribution;
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughputMetrics(): ThroughputMetrics {
    if (!this.startTime || !this.endTime || this.results.length === 0) {
      return { avg: 0, max: 0, min: 0, timeline: [] };
    }

    const duration = (this.endTime - this.startTime) / 1000; // seconds
    const avgThroughput = this.results.length / duration;

    // Calculate throughput over time (1-second intervals)
    const timeline: ThroughputPoint[] = [];
    const interval = 1000; // 1 second
    
    for (let t = this.startTime; t < this.endTime; t += interval) {
      const requestsInInterval = this.results.filter(r => 
        r.startTime >= t && r.startTime < t + interval
      ).length;
      
      timeline.push({
        timestamp: t,
        rps: requestsInInterval
      });
    }

    const throughputValues = timeline.map(t => t.rps);

    return {
      avg: avgThroughput,
      max: Math.max(...throughputValues, 0),
      min: Math.min(...throughputValues, 0),
      timeline
    };
  }

  /**
   * Calculate error metrics
   */
  private calculateErrorMetrics(): ErrorMetrics {
    const byStatusCode: Record<number, number> = {};
    const byType: Record<string, number> = {};
    const timeline: ErrorPoint[] = [];

    // Group errors by status code and type
    this.results.forEach(result => {
      if (!result.success) {
        byStatusCode[result.statusCode] = (byStatusCode[result.statusCode] || 0) + 1;
        
        const errorType = result.error || `HTTP ${result.statusCode}`;
        byType[errorType] = (byType[errorType] || 0) + 1;
      }
    });

    // Calculate error timeline (1-second intervals)
    if (this.startTime && this.endTime) {
      const interval = 1000;
      for (let t = this.startTime; t < this.endTime; t += interval) {
        const errorsInInterval = this.results.filter(r => 
          !r.success && r.startTime >= t && r.startTime < t + interval
        ).length;
        
        if (errorsInInterval > 0) {
          timeline.push({
            timestamp: t,
            count: errorsInInterval,
            type: 'general'
          });
        }
      }
    }

    return { byStatusCode, byType, timeline };
  }

  /**
   * Calculate performance summary
   */
  private calculateSummary(config: PerformanceTestConfig): PerformanceSummary {
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const actualDuration = this.startTime && this.endTime 
      ? (this.endTime - this.startTime) / 1000 
      : config.duration;
    
    const throughput = totalRequests / actualDuration;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      duration: actualDuration,
      throughput,
      errorRate
    };
  }

  /**
   * Evaluate thresholds
   */
  private evaluateThresholds(
    thresholds: PerformanceThresholds | undefined,
    metrics: PerformanceMetrics,
    summary: PerformanceSummary
  ): ThresholdResult[] {
    if (!thresholds) return [];

    const results: ThresholdResult[] = [];

    if (thresholds.avgResponseTime !== undefined) {
      results.push({
        name: 'Average Response Time',
        threshold: thresholds.avgResponseTime,
        actual: metrics.responseTime.avg,
        passed: metrics.responseTime.avg <= thresholds.avgResponseTime,
        description: `Average response time should be ≤ ${thresholds.avgResponseTime}ms`
      });
    }

    if (thresholds.maxResponseTime !== undefined) {
      results.push({
        name: 'Maximum Response Time',
        threshold: thresholds.maxResponseTime,
        actual: metrics.responseTime.max,
        passed: metrics.responseTime.max <= thresholds.maxResponseTime,
        description: `Maximum response time should be ≤ ${thresholds.maxResponseTime}ms`
      });
    }

    if (thresholds.p95ResponseTime !== undefined) {
      results.push({
        name: '95th Percentile Response Time',
        threshold: thresholds.p95ResponseTime,
        actual: metrics.responseTime.p95,
        passed: metrics.responseTime.p95 <= thresholds.p95ResponseTime,
        description: `95th percentile response time should be ≤ ${thresholds.p95ResponseTime}ms`
      });
    }

    if (thresholds.p99ResponseTime !== undefined) {
      results.push({
        name: '99th Percentile Response Time',
        threshold: thresholds.p99ResponseTime,
        actual: metrics.responseTime.p99,
        passed: metrics.responseTime.p99 <= thresholds.p99ResponseTime,
        description: `99th percentile response time should be ≤ ${thresholds.p99ResponseTime}ms`
      });
    }

    if (thresholds.errorRate !== undefined) {
      results.push({
        name: 'Error Rate',
        threshold: thresholds.errorRate,
        actual: summary.errorRate,
        passed: summary.errorRate <= thresholds.errorRate,
        description: `Error rate should be ≤ ${thresholds.errorRate}%`
      });
    }

    if (thresholds.throughput !== undefined) {
      results.push({
        name: 'Throughput',
        threshold: thresholds.throughput,
        actual: summary.throughput,
        passed: summary.throughput >= thresholds.throughput,
        description: `Throughput should be ≥ ${thresholds.throughput} requests/second`
      });
    }

    return results;
  }

  /**
   * Generate performance report
   */
  private async generateReport(result: PerformanceResult, config: PerformanceTestConfig): Promise<string> {
    // This would generate an HTML report - placeholder for now
    const reportPath = `${config.outputDir}/performance-report-${Date.now()}.html`;
    
    // In a real implementation, this would generate a comprehensive HTML report
    // with charts, graphs, and detailed metrics
    this.emit('reportGenerated', { path: reportPath });
    
    return reportPath;
  }

  /**
   * Helper methods
   */
  private createEmptySummary(): PerformanceSummary {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      duration: 0,
      throughput: 0,
      errorRate: 0
    };
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      responseTime: {
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        p95: 0,
        p99: 0,
        distribution: {
          '< 100ms': 0,
          '100-500ms': 0,
          '500ms-1s': 0,
          '1-2s': 0,
          '2-5s': 0,
          '> 5s': 0
        }
      },
      throughput: {
        avg: 0,
        max: 0,
        min: 0,
        timeline: []
      },
      errors: {
        byStatusCode: {},
        byType: {},
        timeline: []
      },
      timestamps: []
    };
  }

  /**
   * Create performance test from OpenAPI specification
   */
  async createTestFromSpec(spec: ParsedOpenAPI, config: Partial<PerformanceTestConfig>): Promise<PerformanceTestConfig> {
    const endpoints: EndpointConfig[] = [];
    
    // Extract endpoints from OpenAPI spec
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        if (pathItem && typeof pathItem === 'object') {
          ['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
            if (pathItem[method]) {
              endpoints.push({
                method: method.toUpperCase(),
                path,
                weight: 1
              });
            }
          });
        }
      });
    }

    return {
      concurrency: 10,
      duration: 60,
      baseURL: spec.servers?.[0]?.url || 'http://localhost:3000',
      endpoints,
      generateReport: true,
      includeDetailedMetrics: true,
      ...config
    };
  }
}