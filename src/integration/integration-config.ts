/**
 * Integration Test Configuration
 * Week 6 Sprint 1: Configuration management for integration testing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { IntegrationTestConfig, TestSuite, TestWorkflow, TestEnvironment } from './integration-test-runner';

export interface IntegrationConfigTemplate {
  name: string;
  description: string;
  config: Partial<IntegrationTestConfig>;
}

export class IntegrationConfigManager {
  private templates: Map<string, IntegrationConfigTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Load configuration from file
   */
  async loadConfig(configPath: string): Promise<IntegrationTestConfig> {
    const content = await fs.readFile(configPath, 'utf-8');
    const ext = path.extname(configPath).toLowerCase();

    let configData: any;
    
    switch (ext) {
      case '.json':
        configData = JSON.parse(content);
        break;
      case '.yml':
      case '.yaml':
        configData = yaml.load(content);
        break;
      default:
        throw new Error(`Unsupported config format: ${ext}`);
    }

    return this.validateAndNormalizeConfig(configData);
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: IntegrationTestConfig, outputPath: string): Promise<void> {
    const ext = path.extname(outputPath).toLowerCase();
    let content: string;

    switch (ext) {
      case '.json':
        content = JSON.stringify(config, null, 2);
        break;
      case '.yml':
      case '.yaml':
        content = yaml.dump(config, { indent: 2, lineWidth: 120 });
        break;
      default:
        throw new Error(`Unsupported output format: ${ext}`);
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);
  }

  /**
   * Generate configuration from template
   */
  generateFromTemplate(templateName: string, overrides: Partial<IntegrationTestConfig> = {}): IntegrationTestConfig {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const config = this.mergeConfigs(template.config, overrides);
    return this.validateAndNormalizeConfig(config);
  }

  /**
   * Create comprehensive integration test configuration
   */
  createComprehensiveConfig(options: {
    specPath: string;
    outputDir: string;
    baseURL: string;
    includePerformance?: boolean;
    includeSecurity?: boolean;
    includeWorkflows?: boolean;
  }): IntegrationTestConfig {
    const environments: TestEnvironment[] = [
      {
        name: 'staging',
        baseURL: options.baseURL,
        authProfile: 'staging-auth',
        variables: {
          ENV: 'staging',
          LOG_LEVEL: 'info'
        },
        mockServer: {
          enabled: true,
          port: 3001,
          scenarios: ['default', 'error-responses']
        }
      },
      {
        name: 'production',
        baseURL: options.baseURL.replace('staging', 'prod'),
        authProfile: 'prod-auth',
        variables: {
          ENV: 'production',
          LOG_LEVEL: 'warn'
        }
      }
    ];

    const testSuites: TestSuite[] = [
      {
        name: 'Functional Tests',
        type: 'functional',
        enabled: true,
        config: {
          includeNegative: true,
          includeBoundary: true,
          timeout: 30000
        },
        dependencies: [],
        retries: 2,
        parallel: true
      },
      {
        name: 'Contract Validation',
        type: 'contract',
        enabled: true,
        config: {
          strict: true,
          validateExamples: true,
          validateSecurity: true
        },
        dependencies: [],
        retries: 1,
        parallel: true
      },
      {
        name: 'Integration Tests',
        type: 'integration',
        enabled: true,
        config: {
          testComponentIntegration: true,
          testWorkflowIntegration: true
        },
        dependencies: ['Functional Tests', 'Contract Validation'],
        retries: 1,
        parallel: false
      }
    ];

    if (options.includePerformance) {
      testSuites.push({
        name: 'Performance Tests',
        type: 'performance',
        enabled: true,
        config: {
          concurrency: 10,
          duration: 60,
          thresholds: {
            avgResponseTime: 1000,
            p95ResponseTime: 2000,
            errorRate: 5,
            minThroughput: 10
          }
        },
        dependencies: ['Functional Tests'],
        retries: 1,
        parallel: false
      });
    }

    if (options.includeSecurity) {
      testSuites.push({
        name: 'Security Scan',
        type: 'security',
        enabled: true,
        config: {
          scanTypes: ['owasp-top-10', 'authentication', 'authorization'],
          severity: ['critical', 'high', 'medium'],
          thresholds: {
            maxCritical: 0,
            maxHigh: 2,
            maxMedium: 5
          }
        },
        dependencies: [],
        retries: 1,
        parallel: true
      });
    }

    const workflows: TestWorkflow[] = [];

    if (options.includeWorkflows) {
      workflows.push(
        this.createSmokeTestWorkflow(),
        this.createFullRegressionWorkflow(),
        this.createPerformanceValidationWorkflow()
      );
    }

    return {
      specPath: options.specPath,
      outputDir: options.outputDir,
      environments,
      testSuites,
      workflows,
      parallelism: 4,
      timeout: 300000, // 5 minutes
      cleanup: true,
      monitoring: true,
      reportFormats: ['html', 'json', 'junit']
    };
  }

  /**
   * Create smoke test workflow
   */
  private createSmokeTestWorkflow(): TestWorkflow {
    return {
      name: 'Smoke Test',
      description: 'Quick validation of core functionality',
      steps: [
        {
          type: 'setup',
          name: 'Initialize Environment',
          config: { environment: 'staging' }
        },
        {
          type: 'auth',
          name: 'Configure Authentication',
          config: { profile: 'staging-auth' }
        },
        {
          type: 'generate',
          name: 'Generate Basic Tests',
          config: { 
            includeOnly: ['GET', 'POST'],
            maxEndpoints: 5
          }
        },
        {
          type: 'validate',
          name: 'Quick Contract Validation',
          config: { strict: false }
        },
        {
          type: 'cleanup',
          name: 'Cleanup Resources',
          config: {}
        }
      ],
      environments: ['staging'],
      conditions: []
    };
  }

  /**
   * Create full regression workflow
   */
  private createFullRegressionWorkflow(): TestWorkflow {
    return {
      name: 'Full Regression',
      description: 'Comprehensive testing across all environments',
      steps: [
        {
          type: 'setup',
          name: 'Setup Test Environment',
          config: { 
            environments: ['staging', 'production'],
            mockServers: true
          }
        },
        {
          type: 'auth',
          name: 'Configure All Auth Profiles',
          config: { 
            profiles: ['staging-auth', 'prod-auth']
          }
        },
        {
          type: 'generate',
          name: 'Generate Comprehensive Tests',
          config: {
            includeNegative: true,
            includeBoundary: true,
            includePerformance: true
          }
        },
        {
          type: 'validate',
          name: 'Full Contract Validation',
          config: { 
            strict: true,
            validateExamples: true,
            validateSecurity: true
          }
        },
        {
          type: 'performance',
          name: 'Performance Testing',
          config: {
            concurrency: 10,
            duration: 300
          },
          continueOnFailure: true
        },
        {
          type: 'security',
          name: 'Security Scanning',
          config: {
            scanTypes: ['owasp-top-10', 'authentication', 'authorization']
          },
          continueOnFailure: true
        },
        {
          type: 'cleanup',
          name: 'Cleanup All Resources',
          config: {}
        }
      ],
      environments: ['staging', 'production'],
      conditions: [
        {
          type: 'environment',
          condition: 'production',
          value: { skipOnFailure: true }
        }
      ]
    };
  }

  /**
   * Create performance validation workflow
   */
  private createPerformanceValidationWorkflow(): TestWorkflow {
    return {
      name: 'Performance Validation',
      description: 'Focused performance testing and validation',
      steps: [
        {
          type: 'setup',
          name: 'Setup Performance Environment',
          config: { 
            environment: 'staging',
            optimizeForPerformance: true
          }
        },
        {
          type: 'auth',
          name: 'Configure Performance Auth',
          config: { profile: 'perf-auth' }
        },
        {
          type: 'performance',
          name: 'Baseline Performance Test',
          config: {
            concurrency: 5,
            duration: 60,
            rampUp: 10
          }
        },
        {
          type: 'performance',
          name: 'Load Test',
          config: {
            concurrency: 20,
            duration: 300,
            rampUp: 30
          }
        },
        {
          type: 'performance',
          name: 'Stress Test',
          config: {
            concurrency: 50,
            duration: 180,
            rampUp: 60
          },
          continueOnFailure: true
        },
        {
          type: 'cleanup',
          name: 'Performance Cleanup',
          config: {}
        }
      ],
      environments: ['staging'],
      conditions: [
        {
          type: 'suite',
          condition: 'performance-enabled',
          value: true
        }
      ]
    };
  }

  /**
   * Validate and normalize configuration
   */
  private validateAndNormalizeConfig(config: any): IntegrationTestConfig {
    // Required fields validation
    if (!config.specPath) {
      throw new Error('specPath is required');
    }
    if (!config.outputDir) {
      throw new Error('outputDir is required');
    }

    // Set defaults
    const normalized: IntegrationTestConfig = {
      specPath: config.specPath,
      outputDir: config.outputDir,
      environments: config.environments || [],
      testSuites: config.testSuites || [],
      workflows: config.workflows || [],
      parallelism: config.parallelism || 4,
      timeout: config.timeout || 300000,
      cleanup: config.cleanup !== false,
      monitoring: config.monitoring !== false,
      reportFormats: config.reportFormats || ['html', 'json']
    };

    // Validate environments
    normalized.environments.forEach((env, index) => {
      if (!env.name) {
        throw new Error(`Environment ${index} missing name`);
      }
      if (!env.baseURL) {
        throw new Error(`Environment ${env.name} missing baseURL`);
      }
      env.variables = env.variables || {};
    });

    // Validate test suites
    normalized.testSuites.forEach((suite, index) => {
      if (!suite.name) {
        throw new Error(`Test suite ${index} missing name`);
      }
      if (!suite.type) {
        throw new Error(`Test suite ${suite.name} missing type`);
      }
      suite.enabled = suite.enabled !== false;
      suite.dependencies = suite.dependencies || [];
      suite.retries = suite.retries || 0;
      suite.parallel = suite.parallel !== false;
      suite.config = suite.config || {};
    });

    // Validate workflows
    normalized.workflows.forEach((workflow, index) => {
      if (!workflow.name) {
        throw new Error(`Workflow ${index} missing name`);
      }
      if (!workflow.steps || workflow.steps.length === 0) {
        throw new Error(`Workflow ${workflow.name} has no steps`);
      }
      workflow.environments = workflow.environments || [];
      workflow.conditions = workflow.conditions || [];

      workflow.steps.forEach((step, stepIndex) => {
        if (!step.type) {
          throw new Error(`Step ${stepIndex} in workflow ${workflow.name} missing type`);
        }
        if (!step.name) {
          throw new Error(`Step ${stepIndex} in workflow ${workflow.name} missing name`);
        }
        step.config = step.config || {};
        step.retries = step.retries || 0;
        step.continueOnFailure = step.continueOnFailure || false;
      });
    });

    return normalized;
  }

  /**
   * Merge configurations
   */
  private mergeConfigs(base: any, override: any): any {
    const merged = { ...base };

    Object.keys(override).forEach(key => {
      if (override[key] !== undefined) {
        if (Array.isArray(override[key])) {
          merged[key] = [...(override[key] || [])];
        } else if (typeof override[key] === 'object' && override[key] !== null) {
          merged[key] = this.mergeConfigs(merged[key] || {}, override[key]);
        } else {
          merged[key] = override[key];
        }
      }
    });

    return merged;
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // Basic template
    this.templates.set('basic', {
      name: 'Basic Integration Test',
      description: 'Simple integration test with functional and contract validation',
      config: {
        parallelism: 2,
        timeout: 180000,
        cleanup: true,
        monitoring: false,
        reportFormats: ['html', 'json'],
        testSuites: [
          {
            name: 'Basic Functional Tests',
            type: 'functional',
            enabled: true,
            config: { includeNegative: false, timeout: 30000 },
            dependencies: [],
            retries: 1,
            parallel: true
          },
          {
            name: 'Contract Validation',
            type: 'contract',
            enabled: true,
            config: { strict: false },
            dependencies: [],
            retries: 1,
            parallel: true
          }
        ],
        workflows: []
      }
    });

    // Comprehensive template
    this.templates.set('comprehensive', {
      name: 'Comprehensive Integration Test',
      description: 'Full integration test suite with all components',
      config: {
        parallelism: 4,
        timeout: 600000,
        cleanup: true,
        monitoring: true,
        reportFormats: ['html', 'json', 'junit'],
        testSuites: [
          {
            name: 'Functional Tests',
            type: 'functional',
            enabled: true,
            config: { includeNegative: true, includeBoundary: true },
            dependencies: [],
            retries: 2,
            parallel: true
          },
          {
            name: 'Contract Validation',
            type: 'contract',
            enabled: true,
            config: { strict: true, validateExamples: true },
            dependencies: [],
            retries: 1,
            parallel: true
          },
          {
            name: 'Performance Tests',
            type: 'performance',
            enabled: true,
            config: { concurrency: 10, duration: 60 },
            dependencies: ['Functional Tests'],
            retries: 1,
            parallel: false
          },
          {
            name: 'Security Scan',
            type: 'security',
            enabled: true,
            config: { scanTypes: ['owasp-top-10'] },
            dependencies: [],
            retries: 1,
            parallel: true
          },
          {
            name: 'Integration Tests',
            type: 'integration',
            enabled: true,
            config: {},
            dependencies: ['Functional Tests', 'Contract Validation'],
            retries: 1,
            parallel: false
          }
        ]
      }
    });

    // Performance-focused template
    this.templates.set('performance', {
      name: 'Performance-Focused Integration Test',
      description: 'Integration test optimized for performance validation',
      config: {
        parallelism: 2,
        timeout: 900000,
        cleanup: true,
        monitoring: true,
        reportFormats: ['html', 'json'],
        testSuites: [
          {
            name: 'Performance Validation',
            type: 'performance',
            enabled: true,
            config: {
              concurrency: 20,
              duration: 300,
              thresholds: {
                avgResponseTime: 500,
                p95ResponseTime: 1000,
                errorRate: 2
              }
            },
            dependencies: [],
            retries: 2,
            parallel: false
          }
        ]
      }
    });

    // Security-focused template
    this.templates.set('security', {
      name: 'Security-Focused Integration Test',
      description: 'Integration test focused on security validation',
      config: {
        parallelism: 2,
        timeout: 600000,
        cleanup: true,
        monitoring: true,
        reportFormats: ['html', 'json', 'sarif'],
        testSuites: [
          {
            name: 'Security Comprehensive Scan',
            type: 'security',
            enabled: true,
            config: {
              scanTypes: ['owasp-top-10', 'authentication', 'authorization', 'data-exposure'],
              severity: ['critical', 'high', 'medium', 'low'],
              thresholds: {
                maxCritical: 0,
                maxHigh: 1,
                maxMedium: 3
              }
            },
            dependencies: [],
            retries: 1,
            parallel: false
          }
        ]
      }
    });
  }

  /**
   * Get available templates
   */
  getTemplates(): IntegrationConfigTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): IntegrationConfigTemplate | undefined {
    return this.templates.get(name);
  }
}

export default IntegrationConfigManager;