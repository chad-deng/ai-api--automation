/**
 * CI/CD Pipeline Integrator
 * Week 5 Sprint 1: CI/CD integration utilities and pipeline management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface PipelineConfig {
  platform: 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci';
  projectPath: string;
  environments: Environment[];
  triggers: PipelineTrigger[];
  notifications: NotificationConfig[];
  artifacts: ArtifactConfig;
  thresholds: QualityGates;
}

export interface Environment {
  name: string;
  url: string;
  authProfile: string;
  secrets: string[];
  variables: Record<string, string>;
  deploymentGate: boolean;
}

export interface PipelineTrigger {
  type: 'push' | 'pr' | 'schedule' | 'manual' | 'webhook';
  branches?: string[];
  schedule?: string; // cron expression
  conditions?: TriggerCondition[];
}

export interface TriggerCondition {
  path: string;
  action: 'changed' | 'added' | 'deleted';
}

export interface NotificationConfig {
  type: 'slack' | 'email' | 'teams' | 'discord';
  webhook?: string;
  channels?: string[];
  conditions: ('success' | 'failure' | 'always' | 'threshold_breach')[];
}

export interface ArtifactConfig {
  retention: number; // days
  reports: string[];
  testResults: string[];
  coverage: string[];
}

export interface QualityGates {
  coverage: {
    minimum: number;
    delta: number; // percentage change threshold
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  security: {
    maxHighVulnerabilities: number;
    maxMediumVulnerabilities: number;
  };
  functional: {
    minPassRate: number;
    maxFailures: number;
  };
}

export interface PipelineTemplate {
  platform: string;
  template: string;
  variables: Record<string, any>;
}

export class PipelineIntegrator {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.loadPipelineTemplates();
  }

  /**
   * Generate CI/CD pipeline configuration
   */
  async generatePipeline(config: PipelineConfig): Promise<string> {
    switch (config.platform) {
      case 'github':
        return this.generateGitHubActions(config);
      case 'gitlab':
        return this.generateGitLabCI(config);
      case 'jenkins':
        return this.generateJenkinsfile(config);
      case 'azure':
        return this.generateAzurePipelines(config);
      case 'circleci':
        return this.generateCircleCI(config);
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  /**
   * Generate GitHub Actions workflow
   */
  private async generateGitHubActions(config: PipelineConfig): Promise<string> {
    const workflow = {
      name: 'API Test Automation',
      on: this.generateGitHubTriggers(config.triggers),
      env: {
        NODE_VERSION: '18',
        ARTIFACT_RETENTION: config.artifacts.retention
      },
      jobs: this.generateGitHubJobs(config)
    };

    return yaml.dump(workflow, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Generate GitLab CI configuration
   */
  private async generateGitLabCI(config: PipelineConfig): Promise<string> {
    const pipeline = {
      image: 'node:18',
      stages: ['validate', 'test', 'performance', 'security', 'report'],
      variables: this.generateGitLabVariables(config),
      ...this.generateGitLabJobs(config)
    };

    return yaml.dump(pipeline, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Generate Jenkinsfile
   */
  private async generateJenkinsfile(config: PipelineConfig): Promise<string> {
    return this.templates.get('jenkinsfile')
      ?.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        // Simple template replacement
        const value = this.getConfigValue(config, key);
        return value !== undefined ? String(value) : match;
      }) || '';
  }

  /**
   * Generate Azure Pipelines YAML
   */
  private async generateAzurePipelines(config: PipelineConfig): Promise<string> {
    const pipeline = {
      trigger: this.generateAzureTriggers(config.triggers),
      pool: {
        vmImage: 'ubuntu-latest'
      },
      variables: this.generateAzureVariables(config),
      stages: this.generateAzureStages(config)
    };

    return yaml.dump(pipeline, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Generate CircleCI configuration
   */
  private async generateCircleCI(config: PipelineConfig): Promise<string> {
    const pipeline = {
      version: 2.1,
      orbs: {
        node: 'circleci/node@5.0.0'
      },
      workflows: {
        'api-test-workflow': {
          jobs: this.generateCircleCIJobs(config)
        }
      },
      jobs: this.generateCircleCIJobDefinitions(config)
    };

    return yaml.dump(pipeline, { 
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Setup pipeline in project
   */
  async setupPipeline(config: PipelineConfig): Promise<void> {
    const pipelineContent = await this.generatePipeline(config);
    let outputPath: string;

    switch (config.platform) {
      case 'github':
        outputPath = path.join(config.projectPath, '.github/workflows/api-test.yml');
        break;
      case 'gitlab':
        outputPath = path.join(config.projectPath, '.gitlab-ci.yml');
        break;
      case 'jenkins':
        outputPath = path.join(config.projectPath, 'Jenkinsfile');
        break;
      case 'azure':
        outputPath = path.join(config.projectPath, 'azure-pipelines.yml');
        break;
      case 'circleci':
        outputPath = path.join(config.projectPath, '.circleci/config.yml');
        break;
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write pipeline configuration
    await fs.writeFile(outputPath, pipelineContent);

    // Create additional configuration files
    await this.createAdditionalFiles(config);
  }

  /**
   * Generate GitHub triggers
   */
  private generateGitHubTriggers(triggers: PipelineTrigger[]): any {
    const on: any = {};

    triggers.forEach(trigger => {
      switch (trigger.type) {
        case 'push':
          on.push = {
            branches: trigger.branches || ['main', 'develop']
          };
          break;
        case 'pr':
          on.pull_request = {
            branches: trigger.branches || ['main']
          };
          break;
        case 'schedule':
          on.schedule = [{
            cron: trigger.schedule || '0 2 * * *'
          }];
          break;
        case 'manual':
          on.workflow_dispatch = {
            inputs: this.generateWorkflowInputs()
          };
          break;
      }
    });

    return on;
  }

  /**
   * Generate workflow inputs for manual triggers
   */
  private generateWorkflowInputs(): any {
    return {
      test_environment: {
        description: 'Environment to test against',
        required: true,
        default: 'staging',
        type: 'choice',
        options: ['staging', 'production', 'development']
      },
      performance_test: {
        description: 'Run performance tests',
        required: false,
        default: false,
        type: 'boolean'
      },
      security_test: {
        description: 'Run security tests',
        required: false,
        default: true,
        type: 'boolean'
      }
    };
  }

  /**
   * Generate GitHub Jobs
   */
  private generateGitHubJobs(config: PipelineConfig): any {
    const jobs: any = {};

    // Static analysis job
    jobs['static-analysis'] = {
      name: 'Static Analysis',
      'runs-on': 'ubuntu-latest',
      steps: [
        { name: 'Checkout code', uses: 'actions/checkout@v4' },
        { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '${{ env.NODE_VERSION }}', cache: 'npm' } },
        { name: 'Install dependencies', run: 'npm ci' },
        { name: 'Run linter', run: 'npm run lint' },
        { name: 'Run type checker', run: 'npm run typecheck' }
      ]
    };

    // Unit tests job
    jobs['unit-tests'] = {
      name: 'Unit Tests',
      'runs-on': 'ubuntu-latest',
      steps: [
        { name: 'Checkout code', uses: 'actions/checkout@v4' },
        { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '${{ env.NODE_VERSION }}', cache: 'npm' } },
        { name: 'Install dependencies', run: 'npm ci' },
        { name: 'Run unit tests', run: 'npm test -- --coverage --ci' },
        { 
          name: 'Upload coverage reports', 
          uses: 'codecov/codecov-action@v3',
          with: { file: './coverage/lcov.info', flags: 'unit-tests' }
        }
      ]
    };

    // Functional tests job for each environment
    config.environments.forEach(env => {
      jobs[`functional-tests-${env.name}`] = {
        name: `Functional Tests - ${env.name}`,
        'runs-on': 'ubuntu-latest',
        environment: env.name,
        needs: ['unit-tests'],
        steps: this.generateFunctionalTestSteps(env)
      };
    });

    // Performance tests job
    if (config.thresholds.performance) {
      jobs['performance-tests'] = {
        name: 'Performance Tests',
        'runs-on': 'ubuntu-latest',
        needs: Object.keys(jobs).filter(key => key.startsWith('functional-tests')),
        steps: this.generatePerformanceTestSteps(config)
      };
    }

    // Security tests job
    if (config.thresholds.security) {
      jobs['security-tests'] = {
        name: 'Security Tests',
        'runs-on': 'ubuntu-latest',
        needs: ['unit-tests'],
        steps: this.generateSecurityTestSteps(config)
      };
    }

    // Report generation job
    jobs['generate-reports'] = {
      name: 'Generate Reports',
      'runs-on': 'ubuntu-latest',
      needs: Object.keys(jobs),
      if: 'always()',
      steps: this.generateReportSteps(config)
    };

    return jobs;
  }

  /**
   * Generate functional test steps
   */
  private generateFunctionalTestSteps(env: Environment): any[] {
    return [
      { name: 'Checkout code', uses: 'actions/checkout@v4' },
      { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '${{ env.NODE_VERSION }}', cache: 'npm' } },
      { name: 'Install dependencies', run: 'npm ci' },
      {
        name: 'Configure environment',
        run: `echo "API_BASE_URL=${env.url}" >> $GITHUB_ENV\necho "AUTH_PROFILE=${env.authProfile}" >> $GITHUB_ENV`
      },
      {
        name: 'Configure authentication',
        env: env.secrets.reduce((acc, secret) => {
          acc[secret] = `\${{ secrets.${secret} }}`;
          return acc;
        }, {} as Record<string, string>),
        run: `npm run cli -- auth configure --name "${env.authProfile}" --environment "${env.name}"`
      },
      { name: 'Run functional tests', run: 'npm test -- tests/functional/ --ci' }
    ];
  }

  /**
   * Generate performance test steps
   */
  private generatePerformanceTestSteps(config: PipelineConfig): any[] {
    return [
      { name: 'Checkout code', uses: 'actions/checkout@v4' },
      { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '${{ env.NODE_VERSION }}', cache: 'npm' } },
      { name: 'Install dependencies', run: 'npm ci' },
      {
        name: 'Run performance tests',
        run: `npm run cli -- performance run \\
  --concurrency 10 \\
  --duration 300 \\
  --output reports/performance \\
  --format html \\
  --thresholds-file performance-thresholds.json`
      },
      {
        name: 'Check performance thresholds',
        run: this.generateThresholdCheckScript(config.thresholds.performance)
      }
    ];
  }

  /**
   * Generate security test steps
   */
  private generateSecurityTestSteps(config: PipelineConfig): any[] {
    return [
      { name: 'Checkout code', uses: 'actions/checkout@v4' },
      { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '${{ env.NODE_VERSION }}', cache: 'npm' } },
      { name: 'Install dependencies', run: 'npm ci' },
      {
        name: 'Run security tests',
        run: `npm run cli -- security scan \\
  --output reports/security \\
  --format json \\
  --severity-threshold medium`
      },
      {
        name: 'Check security thresholds',
        run: this.generateSecurityCheckScript(config.thresholds.security)
      }
    ];
  }

  /**
   * Generate report generation steps
   */
  private generateReportSteps(config: PipelineConfig): any[] {
    return [
      { name: 'Checkout code', uses: 'actions/checkout@v4' },
      { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '${{ env.NODE_VERSION }}', cache: 'npm' } },
      { name: 'Install dependencies', run: 'npm ci' },
      { name: 'Download all test artifacts', uses: 'actions/download-artifact@v3', with: { path: 'artifacts/' } },
      {
        name: 'Generate comprehensive report',
        run: `npm run cli -- report generate \\
  --input artifacts/ \\
  --output reports/final \\
  --format html \\
  --include-charts \\
  --title "API Test Results"`
      },
      {
        name: 'Upload final reports',
        uses: 'actions/upload-artifact@v3',
        if: 'always()',
        with: {
          name: `final-test-reports-\${{ github.run_id }}`,
          path: 'reports/final/',
          'retention-days': config.artifacts.retention
        }
      }
    ];
  }

  /**
   * Generate threshold check script
   */
  private generateThresholdCheckScript(thresholds: any): string {
    return `if [ -f "reports/performance/results.json" ]; then
  FAILED_THRESHOLDS=$(jq '.thresholdResults[] | select(.passed == false) | .name' reports/performance/results.json | wc -l)
  if [ "$FAILED_THRESHOLDS" -gt 0 ]; then
    echo "::error::$FAILED_THRESHOLDS performance thresholds failed"
    exit 1
  fi
fi`;
  }

  /**
   * Generate security check script
   */
  private generateSecurityCheckScript(thresholds: any): string {
    return `if [ -f "reports/security/results.json" ]; then
  HIGH_VULNS=$(jq '.vulnerabilities[] | select(.severity == "high")' reports/security/results.json | jq -s length)
  MEDIUM_VULNS=$(jq '.vulnerabilities[] | select(.severity == "medium")' reports/security/results.json | jq -s length)
  
  if [ "$HIGH_VULNS" -gt ${thresholds.maxHighVulnerabilities} ]; then
    echo "::error::Found $HIGH_VULNS high severity vulnerabilities (threshold: ${thresholds.maxHighVulnerabilities})"
    exit 1
  elif [ "$MEDIUM_VULNS" -gt ${thresholds.maxMediumVulnerabilities} ]; then
    echo "::warning::Found $MEDIUM_VULNS medium severity vulnerabilities (threshold: ${thresholds.maxMediumVulnerabilities})"
  fi
fi`;
  }

  /**
   * Create additional configuration files
   */
  private async createAdditionalFiles(config: PipelineConfig): Promise<void> {
    const projectPath = config.projectPath;

    // Create performance thresholds file
    const thresholdsPath = path.join(projectPath, 'performance-thresholds.json');
    const thresholdsContent = JSON.stringify({
      staging: config.thresholds.performance,
      production: { 
        ...config.thresholds.performance,
        avgResponseTime: config.thresholds.performance.responseTime * 0.6,
        errorRate: config.thresholds.performance.errorRate * 0.5
      }
    }, null, 2);
    await fs.writeFile(thresholdsPath, thresholdsContent);

    // Create environment configuration
    const envConfigPath = path.join(projectPath, 'environments.json');
    const envContent = JSON.stringify(config.environments, null, 2);
    await fs.writeFile(envConfigPath, envContent);
  }

  /**
   * Load pipeline templates
   */
  private loadPipelineTemplates(): void {
    // Jenkinsfile template
    this.templates.set('jenkinsfile', `
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        ARTIFACT_RETENTION = '{{artifactRetention}}'
    }
    
    stages {
        stage('Setup') {
            steps {
                checkout scm
                sh 'npm ci'
            }
        }
        
        stage('Static Analysis') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'npm run typecheck'
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'npm test -- --coverage --ci'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'junit.xml'
                    publishCoverageGoBbertura coberturaReportFile: 'coverage/cobertura-coverage.xml'
                }
            }
        }
        
        stage('Functional Tests') {
            parallel {
                {{#environments}}
                stage('{{name}}') {
                    environment {
                        API_BASE_URL = '{{url}}'
                        AUTH_PROFILE = '{{authProfile}}'
                    }
                    steps {
                        sh 'npm run cli -- auth configure --name "{{authProfile}}" --environment "{{name}}"'
                        sh 'npm test -- tests/functional/ --ci'
                    }
                }
                {{/environments}}
            }
        }
        
        stage('Performance Tests') {
            when {
                anyOf {
                    branch 'main'
                    expression { params.PERFORMANCE_TEST == true }
                }
            }
            steps {
                sh '''
                    npm run cli -- performance run \\
                        --concurrency 10 \\
                        --duration 300 \\
                        --output reports/performance \\
                        --format html \\
                        --thresholds-file performance-thresholds.json
                '''
            }
        }
        
        stage('Security Tests') {
            steps {
                sh '''
                    npm run cli -- security scan \\
                        --output reports/security \\
                        --format json \\
                        --severity-threshold medium
                '''
            }
        }
        
        stage('Generate Reports') {
            steps {
                sh '''
                    npm run cli -- report generate \\
                        --input artifacts/ \\
                        --output reports/final \\
                        --format html \\
                        --include-charts \\
                        --title "API Test Results"
                '''
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports/final',
                        reportFiles: 'test-report.html',
                        reportName: 'API Test Report'
                    ])
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'reports/**/*', fingerprint: true
        }
        failure {
            // Send notifications on failure
        }
        success {
            // Send notifications on success
        }
    }
}
    `);
  }

  /**
   * Helper methods for other platforms (GitLab, Azure, CircleCI)
   */
  private generateGitLabVariables(config: PipelineConfig): Record<string, any> {
    return {
      NODE_VERSION: '18',
      ARTIFACT_RETENTION: config.artifacts.retention.toString()
    };
  }

  private generateGitLabJobs(config: PipelineConfig): any {
    // GitLab CI job generation implementation
    return {};
  }

  private generateAzureTriggers(triggers: PipelineTrigger[]): any {
    // Azure Pipelines trigger generation
    return {};
  }

  private generateAzureVariables(config: PipelineConfig): Record<string, any> {
    return {};
  }

  private generateAzureStages(config: PipelineConfig): any[] {
    return [];
  }

  private generateCircleCIJobs(config: PipelineConfig): any[] {
    return [];
  }

  private generateCircleCIJobDefinitions(config: PipelineConfig): any {
    return {};
  }

  private getConfigValue(config: PipelineConfig, key: string): any {
    // Simple config value extraction
    const keys = key.split('.');
    let value: any = config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
}

export default PipelineIntegrator;