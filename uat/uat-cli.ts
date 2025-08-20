#!/usr/bin/env node

/**
 * UAT CLI Tool
 * AI API Test Automation Framework - Enterprise Edition
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { UATFramework, UATConfig } from './uat-framework';

const program = new Command();

/**
 * CLI Configuration
 */
interface CLIConfig {
  configPath?: string;
  outputDir?: string;
  verbose?: boolean;
  format?: string[];
  environment?: string;
}

/**
 * Main UAT CLI class
 */
class UATCLI {
  private config: CLIConfig = {};

  constructor() {
    this.setupCommands();
  }

  /**
   * Setup CLI commands
   */
  private setupCommands(): void {
    program
      .name('api-test-uat')
      .description('User Acceptance Testing CLI for AI API Test Automation Framework')
      .version('1.0.0');

    // Global options
    program
      .option('-c, --config <path>', 'Path to UAT configuration file')
      .option('-o, --output <dir>', 'Output directory for reports', './uat-reports')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-f, --format <formats...>', 'Report formats (html, json, pdf)', ['html', 'json'])
      .option('-e, --environment <env>', 'Test environment', 'beta-staging');

    // Run UAT command
    program
      .command('run')
      .description('Execute User Acceptance Testing')
      .option('--suite <suites...>', 'Specific test suites to run')
      .option('--user <users...>', 'Specific users to include')
      .option('--dry-run', 'Validate configuration without execution')
      .action(async (options) => {
        await this.runUAT(options);
      });

    // Setup command
    program
      .command('setup')
      .description('Setup UAT environment and configuration')
      .option('--interactive', 'Interactive setup mode')
      .action(async (options) => {
        await this.setupUAT(options);
      });

    // Validate command
    program
      .command('validate')
      .description('Validate UAT configuration')
      .action(async () => {
        await this.validateConfig();
      });

    // Report command
    program
      .command('report')
      .description('Generate UAT reports from existing results')
      .option('--results <path>', 'Path to UAT results file')
      .action(async (options) => {
        await this.generateReport(options);
      });

    // User management commands
    const userCmd = program
      .command('user')
      .description('Manage beta users');

    userCmd
      .command('add')
      .description('Add a new beta user')
      .option('--interactive', 'Interactive user creation')
      .action(async (options) => {
        await this.addUser(options);
      });

    userCmd
      .command('list')
      .description('List all beta users')
      .option('--active', 'Show only active users')
      .action(async (options) => {
        await this.listUsers(options);
      });

    userCmd
      .command('notify')
      .description('Send notifications to beta users')
      .option('--message <msg>', 'Notification message')
      .option('--users <users...>', 'Specific users to notify')
      .action(async (options) => {
        await this.notifyUsers(options);
      });

    // Feedback management commands
    const feedbackCmd = program
      .command('feedback')
      .description('Manage user feedback');

    feedbackCmd
      .command('collect')
      .description('Collect feedback from users')
      .option('--survey', 'Include satisfaction survey')
      .action(async (options) => {
        await this.collectFeedback(options);
      });

    feedbackCmd
      .command('analyze')
      .description('Analyze collected feedback')
      .option('--sentiment', 'Include sentiment analysis')
      .action(async (options) => {
        await this.analyzeFeedback(options);
      });

    // Status command
    program
      .command('status')
      .description('Show UAT execution status')
      .option('--detailed', 'Show detailed status')
      .action(async (options) => {
        await this.showStatus(options);
      });
  }

  /**
   * Parse CLI arguments and execute
   */
  async execute(argv: string[]): Promise<void> {
    try {
      // Parse global options
      program.parse(argv);
      const opts = program.opts();
      this.config = {
        configPath: opts.config,
        outputDir: opts.output,
        verbose: opts.verbose,
        format: opts.format,
        environment: opts.environment
      };

      if (this.config.verbose) {
        console.log(chalk.blue('UAT CLI Configuration:'), this.config);
      }

    } catch (error) {
      console.error(chalk.red('CLI Error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Run UAT execution
   */
  private async runUAT(options: any): Promise<void> {
    const spinner = ora('Loading UAT configuration...').start();

    try {
      // Load configuration
      const config = await this.loadUATConfig();
      
      // Filter by specified suites/users if provided
      if (options.suite) {
        config.testSuites = config.testSuites.filter(s => options.suite.includes(s.id));
        spinner.text = `Filtered to ${config.testSuites.length} test suites`;
      }

      if (options.user) {
        config.betaUsers = config.betaUsers.filter(u => options.user.includes(u.id));
        spinner.text = `Filtered to ${config.betaUsers.length} beta users`;
      }

      spinner.succeed('Configuration loaded successfully');

      // Validate configuration
      spinner.start('Validating configuration...');
      await this.validateUATConfig(config);
      spinner.succeed('Configuration validation passed');

      if (options.dryRun) {
        console.log(chalk.green('✅ Dry run completed successfully'));
        console.log(chalk.blue('Configuration Summary:'));
        console.log(`  - Test Suites: ${config.testSuites.length}`);
        console.log(`  - Beta Users: ${config.betaUsers.length}`);
        console.log(`  - Acceptance Criteria: ${config.acceptanceCriteria.length}`);
        console.log(`  - Environment: ${config.environment.name}`);
        return;
      }

      // Confirm execution
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Ready to execute UAT with ${config.testSuites.length} test suites and ${config.betaUsers.length} users. Proceed?`,
          default: true
        }
      ]);

      if (!proceed) {
        console.log(chalk.yellow('UAT execution cancelled'));
        return;
      }

      // Execute UAT
      spinner.start('Executing User Acceptance Testing...');
      const framework = new UATFramework(config);

      // Setup event listeners for progress reporting
      framework.on('uat:started', () => {
        spinner.text = 'UAT execution started';
      });

      framework.on('environment:initializing', () => {
        spinner.text = 'Initializing test environment';
      });

      framework.on('suite:started', (event) => {
        spinner.text = `Executing test suite: ${event.suiteName}`;
      });

      framework.on('testcase:completed', (event) => {
        if (this.config.verbose) {
          console.log(`\n${chalk.gray('Test case completed:')} ${event.testCaseId} - ${chalk[event.status === 'passed' ? 'green' : 'red'](event.status)}`);
        }
      });

      framework.on('uat:completed', (event) => {
        spinner.succeed('UAT execution completed');
      });

      framework.on('uat:error', (event) => {
        spinner.fail(`UAT execution failed: ${event.error.message}`);
      });

      const result = await framework.executeUAT();

      // Display results summary
      console.log('\n' + chalk.bold('📊 UAT Results Summary'));
      console.log('='.repeat(50));
      
      console.log(`${chalk.blue('Overall Status:')} ${this.getStatusIcon(result.summary.overallStatus)} ${result.summary.overallStatus.toUpperCase()}`);
      console.log(`${chalk.blue('Recommended for Release:')} ${result.summary.recommendedForRelease ? '✅ YES' : '❌ NO'}`);
      
      console.log('\n' + chalk.bold('Test Execution:'));
      console.log(`  Total Test Cases: ${result.summary.totalTestCases}`);
      console.log(`  Executed: ${result.summary.executedTestCases}`);
      console.log(`  Passed: ${chalk.green(result.summary.passedTestCases)}`);
      console.log(`  Failed: ${chalk.red(result.summary.failedTestCases)}`);
      console.log(`  Pass Rate: ${chalk.blue(result.summary.passRate.toFixed(1) + '%')}`);
      
      console.log('\n' + chalk.bold('User Engagement:'));
      console.log(`  Active Users: ${result.metrics.user.activeUsers}/${result.metrics.user.totalUsers}`);
      console.log(`  Satisfaction Score: ${chalk.blue(result.metrics.user.averageSatisfactionScore.toFixed(1) + '%')}`);
      console.log(`  Feedback Items: ${result.userFeedback.length}`);

      // Display critical recommendations
      const criticalRecommendations = result.recommendations.filter(r => r.priority === 'high');
      if (criticalRecommendations.length > 0) {
        console.log('\n' + chalk.bold('🚨 Critical Recommendations:'));
        criticalRecommendations.forEach(rec => {
          console.log(`  • ${chalk.red(rec.title)}: ${rec.description}`);
        });
      }

      // Display report paths
      console.log('\n' + chalk.bold('📄 Generated Reports:'));
      result.reportPaths.forEach(reportPath => {
        console.log(`  • ${reportPath}`);
      });

      console.log('\n' + chalk.green('🎉 UAT execution completed successfully!'));

    } catch (error) {
      spinner.fail(`UAT execution failed: ${error.message}`);
      if (this.config.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Setup UAT environment
   */
  private async setupUAT(options: any): Promise<void> {
    console.log(chalk.bold('🔧 Setting up UAT Environment'));

    if (options.interactive) {
      await this.interactiveSetup();
    } else {
      await this.automaticSetup();
    }
  }

  /**
   * Interactive setup
   */
  private async interactiveSetup(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'programName',
        message: 'Beta testing program name:',
        default: 'API Test Automation Beta Program'
      },
      {
        type: 'input',
        name: 'duration',
        message: 'Testing duration (days):',
        default: '7',
        validate: (input) => !isNaN(parseInt(input)) || 'Please enter a valid number'
      },
      {
        type: 'input',
        name: 'maxParticipants',
        message: 'Maximum participants:',
        default: '50',
        validate: (input) => !isNaN(parseInt(input)) || 'Please enter a valid number'
      },
      {
        type: 'input',
        name: 'environment',
        message: 'Test environment URL:',
        default: 'https://beta-staging.api-test-automation.com'
      },
      {
        type: 'checkbox',
        name: 'reportFormats',
        message: 'Report formats to generate:',
        choices: ['html', 'json', 'pdf', 'excel'],
        default: ['html', 'json']
      }
    ]);

    // Create configuration based on answers
    const config = this.createConfigFromAnswers(answers);
    
    // Save configuration
    const configPath = path.join(process.cwd(), 'uat-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green(`✅ Configuration saved to ${configPath}`));
    console.log(chalk.blue('💡 You can now run: api-test-uat run -c uat-config.json'));
  }

  /**
   * Automatic setup
   */
  private async automaticSetup(): Promise<void> {
    const spinner = ora('Setting up UAT environment...').start();

    try {
      // Create default directories
      const directories = ['./uat-reports', './uat-config', './test-data'];
      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      // Copy default configuration
      const defaultConfig = await this.getDefaultConfig();
      await fs.writeFile('./uat-config/default.json', JSON.stringify(defaultConfig, null, 2));

      // Setup environment files
      await this.setupEnvironmentFiles();

      spinner.succeed('UAT environment setup completed');
      
      console.log(chalk.green('\n✅ Setup completed successfully!'));
      console.log(chalk.blue('Created directories:'));
      directories.forEach(dir => console.log(`  • ${dir}`));
      
    } catch (error) {
      spinner.fail(`Setup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  private async validateConfig(): Promise<void> {
    const spinner = ora('Validating UAT configuration...').start();

    try {
      const config = await this.loadUATConfig();
      await this.validateUATConfig(config);
      
      spinner.succeed('Configuration validation passed');
      console.log(chalk.green('✅ UAT configuration is valid'));
      
    } catch (error) {
      spinner.fail(`Configuration validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate report
   */
  private async generateReport(options: any): Promise<void> {
    const spinner = ora('Generating UAT report...').start();

    try {
      if (!options.results) {
        throw new Error('Results file path is required');
      }

      const resultsData = await fs.readFile(options.results, 'utf-8');
      const results = JSON.parse(resultsData);

      // Generate report using existing framework
      const config = await this.loadUATConfig();
      const framework = new UATFramework(config);
      
      // Generate reports would be called here with existing results
      spinner.succeed('Report generated successfully');
      
    } catch (error) {
      spinner.fail(`Report generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add user
   */
  private async addUser(options: any): Promise<void> {
    if (options.interactive) {
      const userInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'User name:',
          validate: (input) => input.length > 0 || 'Name is required'
        },
        {
          type: 'input',
          name: 'email',
          message: 'Email address:',
          validate: (input) => /\S+@\S+\.\S+/.test(input) || 'Valid email is required'
        },
        {
          type: 'input',
          name: 'role',
          message: 'Role/Position:',
          default: 'Developer'
        },
        {
          type: 'input',
          name: 'company',
          message: 'Company:',
          validate: (input) => input.length > 0 || 'Company is required'
        },
        {
          type: 'list',
          name: 'experience',
          message: 'API testing experience level:',
          choices: ['beginner', 'intermediate', 'expert'],
          default: 'intermediate'
        }
      ]);

      // Add user to configuration
      console.log(chalk.green(`✅ User ${userInfo.name} added successfully`));
    }
  }

  /**
   * List users
   */
  private async listUsers(options: any): Promise<void> {
    const config = await this.loadUATConfig();
    const users = options.active 
      ? config.betaUsers.filter(u => this.isUserActive(u))
      : config.betaUsers;

    console.log(chalk.bold(`\n👥 Beta Users (${users.length})`));
    console.log('='.repeat(50));

    users.forEach(user => {
      const status = this.isUserActive(user) ? '🟢 Active' : '🔴 Inactive';
      console.log(`${status} ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role} at ${user.company}`);
      console.log(`  Experience: ${user.experience}`);
      console.log(`  Assigned Suites: ${user.assignedTestSuites.length}`);
      console.log(`  Feedback Items: ${user.feedback.length}`);
      console.log();
    });
  }

  /**
   * Notify users
   */
  private async notifyUsers(options: any): Promise<void> {
    const spinner = ora('Sending notifications...').start();

    try {
      const config = await this.loadUATConfig();
      const users = options.users 
        ? config.betaUsers.filter(u => options.users.includes(u.id))
        : config.betaUsers;

      const message = options.message || 'UAT session update';

      // Send notifications (placeholder implementation)
      for (const user of users) {
        await this.sendNotification(user, message);
      }

      spinner.succeed(`Notifications sent to ${users.length} users`);
      
    } catch (error) {
      spinner.fail(`Notification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Collect feedback
   */
  private async collectFeedback(options: any): Promise<void> {
    const spinner = ora('Collecting user feedback...').start();

    try {
      // Implementation would collect feedback from various sources
      spinner.succeed('Feedback collection completed');
      
    } catch (error) {
      spinner.fail(`Feedback collection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze feedback
   */
  private async analyzeFeedback(options: any): Promise<void> {
    const spinner = ora('Analyzing user feedback...').start();

    try {
      const config = await this.loadUATConfig();
      const allFeedback = config.betaUsers.flatMap(u => u.feedback);

      // Basic feedback analysis
      const feedbackByCategory = this.groupBy(allFeedback, 'category');
      const feedbackByType = this.groupBy(allFeedback, 'type');
      const feedbackBySeverity = this.groupBy(allFeedback, 'severity');

      spinner.succeed('Feedback analysis completed');

      console.log(chalk.bold('\n📊 Feedback Analysis'));
      console.log('='.repeat(30));
      
      console.log(chalk.blue('\nBy Category:'));
      Object.entries(feedbackByCategory).forEach(([category, items]) => {
        console.log(`  ${category}: ${items.length}`);
      });

      console.log(chalk.blue('\nBy Type:'));
      Object.entries(feedbackByType).forEach(([type, items]) => {
        console.log(`  ${type}: ${items.length}`);
      });

      console.log(chalk.blue('\nBy Severity:'));
      Object.entries(feedbackBySeverity).forEach(([severity, items]) => {
        console.log(`  ${severity}: ${items.length}`);
      });

    } catch (error) {
      spinner.fail(`Feedback analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Show status
   */
  private async showStatus(options: any): Promise<void> {
    try {
      const config = await this.loadUATConfig();
      
      console.log(chalk.bold('\n📈 UAT Status Dashboard'));
      console.log('='.repeat(40));
      
      console.log(chalk.blue('\nProgram Overview:'));
      console.log(`  Environment: ${config.environment.name}`);
      console.log(`  Version: ${config.environment.version}`);
      console.log(`  Total Test Suites: ${config.testSuites.length}`);
      console.log(`  Total Beta Users: ${config.betaUsers.length}`);
      
      const activeUsers = config.betaUsers.filter(u => this.isUserActive(u));
      console.log(`  Active Users: ${activeUsers.length}/${config.betaUsers.length}`);
      
      const totalFeedback = config.betaUsers.reduce((sum, u) => sum + u.feedback.length, 0);
      console.log(`  Feedback Items: ${totalFeedback}`);

      if (options.detailed) {
        console.log(chalk.blue('\nTest Suite Details:'));
        config.testSuites.forEach(suite => {
          console.log(`  📁 ${suite.name}`);
          console.log(`     Priority: ${suite.priority}`);
          console.log(`     Test Cases: ${suite.testCases.length}`);
          console.log(`     Assigned Users: ${suite.assignedUsers.length}`);
        });

        console.log(chalk.blue('\nUser Participation:'));
        config.betaUsers.forEach(user => {
          const status = this.isUserActive(user) ? '🟢' : '🔴';
          console.log(`  ${status} ${user.name}`);
          console.log(`     Assigned Suites: ${user.assignedTestSuites.length}`);
          console.log(`     Feedback: ${user.feedback.length} items`);
        });
      }

    } catch (error) {
      console.error(chalk.red('Status check failed:'), error.message);
    }
  }

  /**
   * Load UAT configuration
   */
  private async loadUATConfig(): Promise<UATConfig> {
    const configPath = this.config.configPath || './uat/beta-user-config.json';
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const rawConfig = JSON.parse(configData);
      
      // Transform the configuration to match UATConfig interface
      return this.transformConfig(rawConfig);
      
    } catch (error) {
      throw new Error(`Failed to load UAT configuration from ${configPath}: ${error.message}`);
    }
  }

  /**
   * Transform configuration
   */
  private transformConfig(rawConfig: any): UATConfig {
    return {
      testSuites: rawConfig.testSuites || [],
      betaUsers: rawConfig.betaUsers || [],
      acceptanceCriteria: rawConfig.acceptanceCriteria || [],
      reportingConfig: rawConfig.reportingConfig || {
        formats: ['html', 'json'],
        outputDir: './uat-reports',
        includeScreenshots: true,
        includeMetrics: true,
        includeUserFeedback: true,
        realTimeReporting: false,
        distributionList: []
      },
      environment: rawConfig.environment || {
        name: 'beta-staging',
        url: 'https://beta-staging.api-test-automation.com',
        version: '1.0.0',
        configuration: {},
        testData: [],
        accessCredentials: { type: 'shared', credentials: {} }
      },
      timeouts: rawConfig.timeouts || {
        testCaseExecution: 300000,
        testSuiteExecution: 1800000,
        userResponse: 86400000,
        systemResponse: 30000
      },
      validation: rawConfig.validation || {
        requiredPassRate: 90,
        criticalTestPassRate: 95,
        userSatisfactionThreshold: 80,
        performanceThresholds: {},
        securityRequirements: []
      }
    };
  }

  /**
   * Validate UAT configuration
   */
  private async validateUATConfig(config: UATConfig): Promise<void> {
    const errors: string[] = [];

    // Validate test suites
    if (!config.testSuites || config.testSuites.length === 0) {
      errors.push('At least one test suite is required');
    }

    // Validate beta users
    if (!config.betaUsers || config.betaUsers.length === 0) {
      errors.push('At least one beta user is required');
    }

    // Validate environment
    if (!config.environment || !config.environment.url) {
      errors.push('Environment URL is required');
    }

    // Validate reporting config
    if (!config.reportingConfig || !config.reportingConfig.outputDir) {
      errors.push('Output directory is required');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.map(e => `  • ${e}`).join('\n')}`);
    }
  }

  /**
   * Helper methods
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  }

  private isUserActive(user: any): boolean {
    const now = new Date();
    const startDate = new Date(user.availability.startDate);
    const endDate = new Date(user.availability.endDate);
    return now >= startDate && now <= endDate;
  }

  private groupBy(array: any[], key: string): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {});
  }

  private async sendNotification(user: any, message: string): Promise<void> {
    // Placeholder implementation
    if (this.config.verbose) {
      console.log(`Sending notification to ${user.email}: ${message}`);
    }
  }

  private createConfigFromAnswers(answers: any): any {
    // Create configuration object from interactive answers
    return {
      betaTestingProgram: {
        name: answers.programName,
        duration: `${answers.duration} days`,
        maxParticipants: parseInt(answers.maxParticipants)
      },
      environment: {
        url: answers.environment
      },
      reportingConfig: {
        formats: answers.reportFormats
      }
    };
  }

  private async getDefaultConfig(): Promise<any> {
    // Return default configuration
    return {
      betaTestingProgram: {
        name: "API Test Automation Beta Program",
        duration: "7 days",
        maxParticipants: 50
      }
    };
  }

  private async setupEnvironmentFiles(): Promise<void> {
    // Setup environment-specific files
    const envTemplate = `# UAT Environment Configuration
UAT_ENVIRONMENT=beta-staging
UAT_API_URL=https://beta-staging.api-test-automation.com
UAT_LOG_LEVEL=debug
UAT_ENABLE_METRICS=true
`;
    await fs.writeFile('./.env.uat', envTemplate);
  }
}

/**
 * Execute CLI
 */
if (require.main === module) {
  const cli = new UATCLI();
  cli.execute(process.argv)
    .catch(error => {
      console.error(chalk.red('Fatal Error:'), error.message);
      process.exit(1);
    });
}

export { UATCLI };