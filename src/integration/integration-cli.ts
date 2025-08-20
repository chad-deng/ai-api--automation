/**
 * Integration Test CLI
 * Week 6 Sprint 1: Command-line interface for integration testing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { IntegrationTestRunner, IntegrationTestConfig } from './integration-test-runner';
import { IntegrationConfigManager } from './integration-config';

export interface IntegrationCliOptions {
  config?: string;
  template?: string;
  spec: string;
  output: string;
  environment?: string[];
  suite?: string[];
  workflow?: string[];
  parallel?: number;
  timeout?: number;
  format?: string[];
  verbose?: boolean;
  cleanup?: boolean;
  monitoring?: boolean;
  dryRun?: boolean;
}

export class IntegrationCli {
  private configManager: IntegrationConfigManager;

  constructor() {
    this.configManager = new IntegrationConfigManager();
  }

  /**
   * Run integration tests
   */
  async run(options: IntegrationCliOptions): Promise<void> {
    try {
      console.log('🚀 Starting API Integration Test Suite');
      
      // Load or generate configuration
      const config = await this.loadConfiguration(options);
      
      if (options.verbose) {
        console.log('📋 Configuration:');
        console.log(JSON.stringify(config, null, 2));
      }

      if (options.dryRun) {
        console.log('🔍 Dry run mode - configuration validated successfully');
        this.printTestPlan(config);
        return;
      }

      // Create test runner
      const runner = new IntegrationTestRunner(config);
      
      // Setup event listeners
      this.setupEventListeners(runner, options.verbose || false);

      // Run tests
      const results = await runner.run();

      // Print results
      this.printResults(results);

      // Exit with appropriate code
      const hasFailures = results.summary.failed > 0 || 
                         results.suites.some(s => s.status === 'failed') ||
                         results.workflows.some(w => w.status === 'failed');
      
      if (hasFailures) {
        console.log('❌ Integration tests failed');
        process.exit(1);
      } else {
        console.log('✅ All integration tests passed');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Integration test execution failed:');
      console.error(error instanceof Error ? error.message : error);
      
      if (options.verbose && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      
      process.exit(1);
    }
  }

  /**
   * Generate configuration file
   */
  async generateConfig(options: {
    template?: string;
    spec: string;
    output: string;
    configFile: string;
    format?: 'json' | 'yaml';
    comprehensive?: boolean;
  }): Promise<void> {
    try {
      console.log(`📝 Generating integration test configuration`);

      let config: IntegrationTestConfig;

      if (options.template) {
        // Use template
        const overrides = {
          specPath: options.spec,
          outputDir: options.output
        };
        config = this.configManager.generateFromTemplate(options.template, overrides);
        console.log(`📋 Using template: ${options.template}`);
      } else {
        // Generate comprehensive configuration
        config = this.configManager.createComprehensiveConfig({
          specPath: options.spec,
          outputDir: options.output,
          baseURL: 'http://localhost:3000',
          includePerformance: options.comprehensive,
          includeSecurity: options.comprehensive,
          includeWorkflows: options.comprehensive
        });
        console.log('📋 Generated comprehensive configuration');
      }

      // Save configuration
      await this.configManager.saveConfig(config, options.configFile);
      console.log(`✅ Configuration saved to: ${options.configFile}`);

      // Print summary
      console.log(`\n📊 Configuration Summary:`);
      console.log(`   Environments: ${config.environments.length}`);
      console.log(`   Test Suites: ${config.testSuites.length}`);
      console.log(`   Workflows: ${config.workflows.length}`);
      console.log(`   Parallelism: ${config.parallelism}`);
      console.log(`   Timeout: ${config.timeout / 1000}s`);

    } catch (error) {
      console.error('💥 Configuration generation failed:');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * List available templates
   */
  listTemplates(): void {
    console.log('📋 Available Integration Test Templates:\n');
    
    const templates = this.configManager.getTemplates();
    
    templates.forEach(template => {
      console.log(`🔹 ${template.name}`);
      console.log(`   ${template.description}`);
      
      if (template.config.testSuites) {
        const suites = template.config.testSuites.map(s => s.type).join(', ');
        console.log(`   Test Types: ${suites}`);
      }
      
      console.log('');
    });
  }

  /**
   * Validate configuration file
   */
  async validateConfig(configPath: string, verbose = false): Promise<void> {
    try {
      console.log(`🔍 Validating configuration: ${configPath}`);
      
      const config = await this.configManager.loadConfig(configPath);
      
      // Basic validation
      const issues: string[] = [];
      
      if (config.environments.length === 0) {
        issues.push('No environments defined');
      }
      
      if (config.testSuites.length === 0) {
        issues.push('No test suites defined');
      }

      // Check spec file exists
      try {
        await fs.access(config.specPath);
      } catch {
        issues.push(`OpenAPI spec file not found: ${config.specPath}`);
      }

      // Check suite dependencies
      const suiteNames = new Set(config.testSuites.map(s => s.name));
      config.testSuites.forEach(suite => {
        suite.dependencies.forEach(dep => {
          if (!suiteNames.has(dep)) {
            issues.push(`Suite "${suite.name}" depends on unknown suite "${dep}"`);
          }
        });
      });

      if (issues.length > 0) {
        console.log('❌ Configuration validation failed:\n');
        issues.forEach(issue => console.log(`   • ${issue}`));
        process.exit(1);
      } else {
        console.log('✅ Configuration is valid');
        
        if (verbose) {
          this.printConfigSummary(config);
        }
      }

    } catch (error) {
      console.error('💥 Configuration validation failed:');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Load configuration based on CLI options
   */
  private async loadConfiguration(options: IntegrationCliOptions): Promise<IntegrationTestConfig> {
    let config: IntegrationTestConfig;

    if (options.config) {
      // Load from file
      config = await this.configManager.loadConfig(options.config);
      console.log(`📋 Loaded configuration from: ${options.config}`);
    } else if (options.template) {
      // Generate from template
      const overrides = {
        specPath: options.spec,
        outputDir: options.output
      };
      config = this.configManager.generateFromTemplate(options.template, overrides);
      console.log(`📋 Using template: ${options.template}`);
    } else {
      // Generate default configuration
      config = this.configManager.createComprehensiveConfig({
        specPath: options.spec,
        outputDir: options.output,
        baseURL: 'http://localhost:3000',
        includePerformance: true,
        includeSecurity: true,
        includeWorkflows: true
      });
      console.log('📋 Using default comprehensive configuration');
    }

    // Apply CLI overrides
    if (options.parallel !== undefined) {
      config.parallelism = options.parallel;
    }
    
    if (options.timeout !== undefined) {
      config.timeout = options.timeout * 1000; // Convert to milliseconds
    }
    
    if (options.format) {
      config.reportFormats = options.format as any;
    }
    
    if (options.cleanup !== undefined) {
      config.cleanup = options.cleanup;
    }
    
    if (options.monitoring !== undefined) {
      config.monitoring = options.monitoring;
    }

    // Filter environments
    if (options.environment && options.environment.length > 0) {
      config.environments = config.environments.filter(env => 
        options.environment!.includes(env.name)
      );
    }

    // Filter test suites
    if (options.suite && options.suite.length > 0) {
      config.testSuites = config.testSuites.filter(suite => 
        options.suite!.includes(suite.name) || options.suite!.includes(suite.type)
      );
    }

    // Filter workflows
    if (options.workflow && options.workflow.length > 0) {
      config.workflows = config.workflows.filter(workflow => 
        options.workflow!.includes(workflow.name)
      );
    }

    return config;
  }

  /**
   * Setup event listeners for test runner
   */
  private setupEventListeners(runner: IntegrationTestRunner, verbose: boolean): void {
    runner.on('testRunStarted', (data) => {
      console.log('🏁 Integration test run started');
    });

    runner.on('initialization', (message) => {
      if (verbose) console.log(`🔧 ${message}`);
    });

    runner.on('setup', (message) => {
      if (verbose) console.log(`⚙️  ${message}`);
    });

    runner.on('suiteStarted', (data) => {
      console.log(`🧪 Running ${data.type} suite: ${data.suite}`);
    });

    runner.on('suiteCompleted', (result) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`${status} ${result.name} completed in ${duration}s (${result.tests.length} tests)`);
    });

    runner.on('suiteError', (data) => {
      console.log(`💥 Suite ${data.suite} failed: ${data.error.message}`);
    });

    runner.on('workflowStarted', (data) => {
      console.log(`🔄 Running workflow: ${data.workflow}`);
    });

    runner.on('workflowCompleted', (result) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`${status} Workflow ${result.name} completed in ${duration}s`);
    });

    runner.on('workflowError', (data) => {
      console.log(`💥 Workflow ${data.workflow} failed: ${data.error.message}`);
    });

    runner.on('testSuites', (message) => {
      if (verbose) console.log(`📊 ${message}`);
    });

    runner.on('workflows', (message) => {
      if (verbose) console.log(`🔄 ${message}`);
    });

    runner.on('cleanup', (message) => {
      if (verbose) console.log(`🧹 ${message}`);
    });

    runner.on('testRunCompleted', (results) => {
      console.log('\n🏁 Integration test run completed');
    });

    runner.on('testRunError', (error) => {
      console.error('💥 Test run error:', error.message);
    });
  }

  /**
   * Print test plan (for dry run)
   */
  private printTestPlan(config: IntegrationTestConfig): void {
    console.log('\n📋 Test Execution Plan:\n');

    console.log('🌍 Environments:');
    config.environments.forEach(env => {
      console.log(`   • ${env.name}: ${env.baseURL}`);
      if (env.mockServer?.enabled) {
        console.log(`     Mock Server: localhost:${env.mockServer.port}`);
      }
    });

    console.log('\n🧪 Test Suites:');
    config.testSuites.forEach(suite => {
      const status = suite.enabled ? '✅' : '❌';
      const parallel = suite.parallel ? ' (parallel)' : ' (sequential)';
      console.log(`   ${status} ${suite.name} (${suite.type})${parallel}`);
      
      if (suite.dependencies.length > 0) {
        console.log(`     Dependencies: ${suite.dependencies.join(', ')}`);
      }
    });

    if (config.workflows.length > 0) {
      console.log('\n🔄 Workflows:');
      config.workflows.forEach(workflow => {
        console.log(`   • ${workflow.name}: ${workflow.steps.length} steps`);
        console.log(`     Environments: ${workflow.environments.join(', ')}`);
      });
    }

    console.log(`\n⚙️  Configuration:`);
    console.log(`   Parallelism: ${config.parallelism}`);
    console.log(`   Timeout: ${config.timeout / 1000}s`);
    console.log(`   Monitoring: ${config.monitoring ? 'enabled' : 'disabled'}`);
    console.log(`   Cleanup: ${config.cleanup ? 'enabled' : 'disabled'}`);
    console.log(`   Report Formats: ${config.reportFormats.join(', ')}`);
  }

  /**
   * Print test results
   */
  private printResults(results: any): void {
    console.log('\n📊 Integration Test Results:\n');

    // Summary
    const { summary } = results;
    console.log('📈 Summary:');
    console.log(`   Total Tests: ${summary.total}`);
    console.log(`   Passed: ${summary.passed} ✅`);
    console.log(`   Failed: ${summary.failed} ❌`);
    console.log(`   Skipped: ${summary.skipped} ⏭️`);
    console.log(`   Test Suites: ${summary.suites}`);
    console.log(`   Workflows: ${summary.workflows}`);

    // Coverage
    console.log('\n📊 Coverage:');
    console.log(`   Endpoints: ${summary.coverage.endpoints.covered}/${summary.coverage.endpoints.total} (${summary.coverage.endpoints.percentage.toFixed(1)}%)`);
    console.log(`   Operations: ${summary.coverage.operations.covered}/${summary.coverage.operations.total} (${summary.coverage.operations.percentage.toFixed(1)}%)`);
    console.log(`   Status Codes: ${summary.coverage.statusCodes.covered}/${summary.coverage.statusCodes.total} (${summary.coverage.statusCodes.percentage.toFixed(1)}%)`);

    // Suite Results
    if (results.suites.length > 0) {
      console.log('\n🧪 Suite Results:');
      results.suites.forEach((suite: any) => {
        const status = suite.status === 'passed' ? '✅' : 
                      suite.status === 'failed' ? '❌' : 
                      suite.status === 'skipped' ? '⏭️' : '⚠️';
        const duration = (suite.duration / 1000).toFixed(2);
        console.log(`   ${status} ${suite.name} (${suite.type}) - ${duration}s`);
        
        if (suite.tests.length > 0) {
          const passed = suite.tests.filter((t: any) => t.status === 'passed').length;
          const failed = suite.tests.filter((t: any) => t.status === 'failed').length;
          console.log(`     Tests: ${passed} passed, ${failed} failed`);
        }

        if (suite.errors.length > 0) {
          console.log(`     Errors: ${suite.errors.length}`);
          suite.errors.forEach((error: any) => {
            console.log(`       • ${error.message}`);
          });
        }
      });
    }

    // Workflow Results
    if (results.workflows.length > 0) {
      console.log('\n🔄 Workflow Results:');
      results.workflows.forEach((workflow: any) => {
        const status = workflow.status === 'passed' ? '✅' : '❌';
        const duration = (workflow.duration / 1000).toFixed(2);
        console.log(`   ${status} ${workflow.name} - ${duration}s`);
        
        if (workflow.steps.length > 0) {
          workflow.steps.forEach((step: any) => {
            const stepStatus = step.status === 'passed' ? '✅' : 
                              step.status === 'failed' ? '❌' : '⏭️';
            console.log(`     ${stepStatus} ${step.name} (${step.type})`);
          });
        }
      });
    }

    // Performance Metrics
    if (results.metrics?.performance) {
      const perf = results.metrics.performance;
      console.log('\n⚡ Performance Metrics:');
      console.log(`   Total Requests: ${perf.totalRequests}`);
      console.log(`   Average Response Time: ${perf.averageResponseTime}ms`);
      console.log(`   Throughput: ${perf.throughput} req/s`);
      console.log(`   Error Rate: ${perf.errorRate}%`);
      console.log(`   P95 Response Time: ${perf.p95ResponseTime}ms`);
    }

    // Security Metrics
    if (results.metrics?.security) {
      const sec = results.metrics.security;
      console.log('\n🔒 Security Metrics:');
      console.log(`   Vulnerabilities: ${sec.vulnerabilities}`);
      console.log(`   Critical Issues: ${sec.criticalIssues}`);
      console.log(`   High Issues: ${sec.highIssues}`);
      console.log(`   Compliance Score: ${sec.complianceScore}%`);
    }

    // Duration
    const totalDuration = (results.duration / 1000).toFixed(2);
    console.log(`\n⏱️  Total Duration: ${totalDuration}s`);

    // Artifacts
    if (results.artifacts.length > 0) {
      console.log(`\n📁 Generated Artifacts:`);
      results.artifacts.forEach((artifact: any) => {
        console.log(`   • ${artifact.name} (${artifact.type}) - ${artifact.path}`);
      });
    }
  }

  /**
   * Print configuration summary
   */
  private printConfigSummary(config: IntegrationTestConfig): void {
    console.log('\n📋 Configuration Summary:\n');

    console.log(`OpenAPI Spec: ${config.specPath}`);
    console.log(`Output Directory: ${config.outputDir}`);
    console.log(`Parallelism: ${config.parallelism}`);
    console.log(`Timeout: ${config.timeout / 1000}s`);
    console.log(`Monitoring: ${config.monitoring ? 'enabled' : 'disabled'}`);
    console.log(`Cleanup: ${config.cleanup ? 'enabled' : 'disabled'}`);

    console.log(`\nEnvironments (${config.environments.length}):`);
    config.environments.forEach(env => {
      console.log(`   • ${env.name}: ${env.baseURL}`);
    });

    console.log(`\nTest Suites (${config.testSuites.length}):`);
    config.testSuites.forEach(suite => {
      const status = suite.enabled ? 'enabled' : 'disabled';
      console.log(`   • ${suite.name} (${suite.type}) - ${status}`);
    });

    if (config.workflows.length > 0) {
      console.log(`\nWorkflows (${config.workflows.length}):`);
      config.workflows.forEach(workflow => {
        console.log(`   • ${workflow.name}: ${workflow.steps.length} steps`);
      });
    }
  }
}

export default IntegrationCli;