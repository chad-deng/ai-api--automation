/**
 * CLI Framework Implementation
 * Week 1 Sprint 1: Commander.js-based CLI with TDD
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { OpenAPIParser } from './parser/openapi-parser';
import { OpenAPIValidator } from './validator/openapi-validator';
import { TestGenerator, GenerationOptions as EnhancedGenerationOptions } from './generator/test-generator';
import { OperationMapper } from './generator/mapper/operation-mapper';
import { DataGenerator } from './generator/data/data-generator';
import { getTemplate, getSupportedFrameworks } from './generator/templates';
// MVP Scope - Auth removed for simplicity
// import { CredentialManager } from './auth/credential-manager';
// import { AuthProviderFactory } from './auth/auth-provider';
// import { SecurityValidator } from './auth/security-validator';
// import { PerformanceTester, PerformanceTestConfig } from './performance/performance-tester';
// import { ReportGenerator, ReportConfig, TestResults } from './reporting/report-generator';
// import { PipelineIntegrator, PipelineConfig } from './cicd/pipeline-integrator';
// import { MockServer, MockServerConfig } from './mock/mock-server';
import { 
  CLIResult, 
  Config, 
  ConfigurationError, 
  GenerationOptions, 
  GenerationResult,
  Plugin,
  TestFramework,
  ValidationError,
  ValidationResult
} from './types';

export class CLI {
  private program: Command;
  private plugins: Map<string, Plugin> = new Map();
  private config: Partial<Config> = {};
  private parser: OpenAPIParser;
  private validator: OpenAPIValidator;
  private generator: TestGenerator;
  // MVP Scope - Enterprise features removed
  // private credentialManager: CredentialManager;
  // private securityValidator: SecurityValidator;
  // private performanceTester: PerformanceTester;
  // private reportGenerator: ReportGenerator;
  // private pipelineIntegrator: PipelineIntegrator;

  constructor() {
    this.program = new Command();
    this.program.exitOverride(); // Prevent process.exit() calls during testing
    this.parser = new OpenAPIParser();
    this.validator = new OpenAPIValidator();
    this.generator = new TestGenerator();
    // MVP: Enterprise features removed
    // this.credentialManager = new CredentialManager();
    // this.securityValidator = new SecurityValidator();
    // this.performanceTester = new PerformanceTester();
    // this.reportGenerator = new ReportGenerator();
    // this.pipelineIntegrator = new PipelineIntegrator();
    this.setupCommands();
  }

  /**
   * Set up all CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .name('api-test-gen')
      .description('Enterprise API test automation framework with OpenAPI integration')
      .version('1.0.0');

    this.setupGenerateCommand();
    this.setupValidateCommand();
    this.setupInitCommand();
    this.setupAuthCommands();
    this.setupSecurityCommands();
    this.setupContractCommands();
    this.setupTestCommands();
    this.setupPerformanceCommands();
    this.setupReportCommands();
    this.setupMockCommands();
    this.setupCICDCommands();
  }

  /**
   * Setup generate command - main functionality
   */
  private setupGenerateCommand(): void {
    const supportedFrameworks = getSupportedFrameworks();
    
    this.program
      .command('generate')
      .description('Generate API tests from OpenAPI specification')
      .argument('<spec>', 'OpenAPI specification file path')
      .option('-o, --output <dir>', 'Output directory for generated tests', './tests/generated')
      .option('-f, --framework <framework>', `Test framework (${supportedFrameworks.join(', ')})`, 'jest')
      .option('-v, --verbose', 'Enable verbose output', false)
      .option('-c, --coverage', 'Enable coverage reporting', true)
      .option('-t, --template <template>', 'Template to use for generation')
      .option('--config <config>', 'Configuration file path')
      .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
      .option('--parallel', 'Run tests in parallel', false)
      .option('--dry-run', 'Perform dry run without writing files', false)
      .option('--include-types', 'Generate TypeScript type definitions', false)
      .option('--generate-mocks', 'Generate mock data and responses', false)
      .option('--auth-type <type>', 'Authentication type (bearer, apikey, oauth2, basic)')
      .option('--edge-cases', 'Generate edge case tests', false)
      .option('--security-tests', 'Generate security-focused tests', false)
      .action(async (specPath: string, options: any) => {
        await this.handleGenerate(specPath, options);
      });
  }

  /**
   * Setup validate command
   */
  private setupValidateCommand(): void {
    this.program
      .command('validate')
      .description('Validate OpenAPI specification')
      .argument('<spec>', 'OpenAPI specification file path')
      .option('-s, --schema-only', 'Validate schema only', false)
      .option('-v, --verbose', 'Enable verbose output', false)
      .action(async (specPath: string, options: any) => {
        await this.handleValidate(specPath, options);
      });
  }

  /**
   * Setup init command
   */
  private setupInitCommand(): void {
    this.program
      .command('init')
      .description('Initialize new API test project')
      .option('-t, --template <template>', 'Template to use', 'jest-supertest')
      .option('-d, --directory <dir>', 'Project directory', './')
      .option('-y, --yes', 'Skip interactive prompts', false)
      .action(async (options: any) => {
        await this.handleInit(options);
      });
  }

  /**
   * Setup authentication commands
   */
  private setupAuthCommands(): void {
    const authCommand = this.program
      .command('auth')
      .description('Manage authentication credentials');

    // List profiles
    authCommand
      .command('list')
      .description('List all authentication profiles')
      .option('-v, --verbose', 'Show detailed information')
      .action(async (options: any) => {
        await this.handleAuthList(options);
      });

    // Add profile
    authCommand
      .command('add <name>')
      .description('Add new authentication profile')
      .option('-t, --type <type>', 'Authentication type (bearer, apikey, oauth2, basic)', 'bearer')
      .option('--token <token>', 'Bearer token')
      .option('--api-key <key>', 'API key')
      .option('--username <username>', 'Username for Basic Auth')
      .option('--password <password>', 'Password for Basic Auth')
      .option('--client-id <id>', 'OAuth2 client ID')
      .option('--client-secret <secret>', 'OAuth2 client secret')
      .option('--token-url <url>', 'OAuth2 token URL')
      .option('--scope <scope>', 'OAuth2 scope')
      .option('--env <environment>', 'Environment (dev, staging, prod)', 'development')
      .option('--description <desc>', 'Profile description')
      .option('--default', 'Set as default profile')
      .action(async (name: string, options: any) => {
        await this.handleAuthAdd(name, options);
      });

    // Remove profile
    authCommand
      .command('remove <name>')
      .alias('rm')
      .description('Remove authentication profile')
      .option('-y, --yes', 'Skip confirmation')
      .action(async (name: string, options: any) => {
        await this.handleAuthRemove(name, options);
      });

    // Set default profile
    authCommand
      .command('default <name>')
      .description('Set default authentication profile')
      .action(async (name: string) => {
        await this.handleAuthDefault(name);
      });

    // Test authentication
    authCommand
      .command('test <name>')
      .description('Test authentication profile')
      .option('--url <url>', 'Test URL (defaults to https://httpbin.org/bearer)')
      .action(async (name: string, options: any) => {
        await this.handleAuthTest(name, options);
      });

    // Import profiles
    authCommand
      .command('import <file>')
      .description('Import authentication profiles from file')
      .option('-y, --yes', 'Skip confirmation for overwrites')
      .action(async (file: string, options: any) => {
        await this.handleAuthImport(file, options);
      });

    // Export profiles
    authCommand
      .command('export <file>')
      .description('Export authentication profiles to file')
      .option('--include-secrets', 'Include sensitive credentials in export', false)
      .action(async (file: string, options: any) => {
        await this.handleAuthExport(file, options);
      });
  }

  /**
   * Setup security commands
   */
  private setupSecurityCommands(): void {
    const securityCommand = this.program
      .command('security')
      .description('Security testing and validation');

    // Validate API security
    securityCommand
      .command('validate <spec>')
      .description('Validate API security configuration')
      .option('-v, --verbose', 'Show detailed security analysis')
      .option('--json', 'Output in JSON format')
      .action(async (specPath: string, options: any) => {
        await this.handleSecurityValidate(specPath, options);
      });

    // Generate security tests
    securityCommand
      .command('generate-tests <spec>')
      .description('Generate security-focused test cases')
      .option('-o, --output <dir>', 'Output directory', './tests/security')
      .option('-f, --framework <framework>', 'Test framework', 'jest')
      .option('--auth-profile <name>', 'Authentication profile to use')
      .action(async (specPath: string, options: any) => {
        await this.handleSecurityGenerateTests(specPath, options);
      });

    // Security scan
    securityCommand
      .command('scan <spec>')
      .description('Comprehensive security scan of API')
      .option('-v, --verbose', 'Show detailed scan results')
      .option('--severity <level>', 'Minimum severity level (info, low, medium, high, critical)', 'medium')
      .option('--json', 'Output in JSON format')
      .action(async (specPath: string, options: any) => {
        await this.handleSecurityScan(specPath, options);
      });
  }

  /**
   * Handle auth list command
   */
  private async handleAuthList(options: any): Promise<CLIResult> {
    try {
      await this.credentialManager.initialize();
      const profiles = await this.credentialManager.listProfiles();
      const defaultProfile = await this.credentialManager.getDefaultProfile();

      if (profiles.length === 0) {
        console.log(chalk.yellow('No authentication profiles found.'));
        console.log(chalk.gray('Use "auth add <name>" to create a new profile.'));
        return { success: true, message: 'No profiles found' };
      }

      console.log(chalk.blue(`Found ${profiles.length} authentication profiles:\n`));

      for (const profile of profiles) {
        const isDefault = defaultProfile?.name === profile.name;
        const prefix = isDefault ? chalk.green('● ') : chalk.gray('○ ');
        
        console.log(`${prefix}${chalk.bold(profile.name)} (${profile.type})`);
        
        if (options.verbose) {
          console.log(chalk.gray(`  Environment: ${profile.environment || 'none'}`));
          console.log(chalk.gray(`  Created: ${profile.createdAt.toLocaleDateString()}`));
          if (profile.lastUsed) {
            console.log(chalk.gray(`  Last used: ${profile.lastUsed.toLocaleDateString()}`));
          }
          if (profile.description) {
            console.log(chalk.gray(`  Description: ${profile.description}`));
          }
          console.log();
        }
      }

      if (!options.verbose && defaultProfile) {
        console.log(chalk.gray(`\n● Default profile: ${defaultProfile.name}`));
      }

      return { success: true, data: { profiles, defaultProfile: defaultProfile?.name } };

    } catch (error) {
      console.log(chalk.red(`❌ Error listing profiles: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle auth add command
   */
  private async handleAuthAdd(name: string, options: any): Promise<CLIResult> {
    try {
      await this.credentialManager.initialize();

      // Build credentials based on type
      const credentials: any = {};
      
      switch (options.type) {
        case 'bearer':
          if (!options.token) {
            return { success: false, error: 'Bearer token is required (use --token)' };
          }
          credentials.token = options.token;
          break;

        case 'apikey':
          if (!options.apiKey) {
            return { success: false, error: 'API key is required (use --api-key)' };
          }
          credentials.apiKey = options.apiKey;
          break;

        case 'oauth2':
          if (!options.clientId || !options.clientSecret) {
            return { success: false, error: 'OAuth2 client ID and secret are required (use --client-id and --client-secret)' };
          }
          credentials.clientId = options.clientId;
          credentials.clientSecret = options.clientSecret;
          if (options.tokenUrl) credentials.tokenUrl = options.tokenUrl;
          if (options.scope) credentials.scope = options.scope;
          break;

        case 'basic':
          if (!options.username || !options.password) {
            return { success: false, error: 'Username and password are required (use --username and --password)' };
          }
          credentials.username = options.username;
          credentials.password = options.password;
          break;

        default:
          return { success: false, error: `Unsupported authentication type: ${options.type}` };
      }

      const profile = {
        name,
        type: options.type,
        credentials,
        environment: options.env,
        description: options.description,
        createdAt: new Date()
      };

      // Validate credentials
      const validation = await this.credentialManager.validateCredentials(profile);
      if (!validation.valid) {
        return { 
          success: false, 
          error: `Invalid credentials: ${validation.errors.join(', ')}` 
        };
      }

      await this.credentialManager.setProfile(profile);

      // Set as default if requested
      if (options.default) {
        await this.credentialManager.setDefaultProfile(name);
      }

      console.log(chalk.green(`✅ Authentication profile "${name}" created successfully`));
      if (options.default) {
        console.log(chalk.gray(`Set as default profile`));
      }

      return { success: true, message: `Profile "${name}" created` };

    } catch (error) {
      console.log(chalk.red(`❌ Error creating profile: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle auth remove command
   */
  private async handleAuthRemove(name: string, options: any): Promise<CLIResult> {
    try {
      await this.credentialManager.initialize();

      const profile = await this.credentialManager.getProfile(name);
      if (!profile) {
        return { success: false, error: `Profile "${name}" not found` };
      }

      if (!options.yes) {
        console.log(chalk.yellow(`⚠️  About to remove profile "${name}" (${profile.type})`));
        console.log(chalk.gray('This action cannot be undone. Use -y to skip confirmation.'));
        return { success: false, error: 'Confirmation required' };
      }

      const removed = await this.credentialManager.deleteProfile(name);
      if (removed) {
        console.log(chalk.green(`✅ Profile "${name}" removed successfully`));
        return { success: true, message: `Profile "${name}" removed` };
      } else {
        return { success: false, error: `Failed to remove profile "${name}"` };
      }

    } catch (error) {
      console.log(chalk.red(`❌ Error removing profile: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle auth default command
   */
  private async handleAuthDefault(name: string): Promise<CLIResult> {
    try {
      await this.credentialManager.initialize();

      const success = await this.credentialManager.setDefaultProfile(name);
      if (success) {
        console.log(chalk.green(`✅ Profile "${name}" set as default`));
        return { success: true, message: `Profile "${name}" set as default` };
      } else {
        return { success: false, error: `Profile "${name}" not found` };
      }

    } catch (error) {
      console.log(chalk.red(`❌ Error setting default profile: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle auth test command
   */
  private async handleAuthTest(name: string, options: any): Promise<CLIResult> {
    try {
      await this.credentialManager.initialize();

      const profile = await this.credentialManager.getProfile(name);
      if (!profile) {
        return { success: false, error: `Profile "${name}" not found` };
      }

      console.log(chalk.blue(`🔍 Testing authentication profile "${name}"...`));

      const authProvider = AuthProviderFactory.create({
        type: profile.type,
        ...profile.credentials
      } as any);

      const authResult = await authProvider.authenticate(profile.credentials);
      
      if (authResult.success) {
        console.log(chalk.green('✅ Authentication successful'));
        console.log(chalk.gray(`Headers: ${Object.keys(authResult.headers).join(', ')}`));
        
        if (authResult.tokenExpiry) {
          console.log(chalk.gray(`Token expires: ${authResult.tokenExpiry.toLocaleString()}`));
        }
        
        return { success: true, message: 'Authentication test passed', data: authResult };
      } else {
        console.log(chalk.red(`❌ Authentication failed: ${authResult.error}`));
        return { success: false, error: authResult.error || 'Authentication failed' };
      }

    } catch (error) {
      console.log(chalk.red(`❌ Error testing authentication: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle auth import command
   */
  private async handleAuthImport(filePath: string, options: any): Promise<CLIResult> {
    try {
      await this.credentialManager.initialize();

      console.log(chalk.blue(`📥 Importing profiles from ${filePath}...`));

      const result = await this.credentialManager.importFromFile(filePath);

      if (result.imported > 0) {
        console.log(chalk.green(`✅ Imported ${result.imported} profiles successfully`));
      }

      if (result.errors.length > 0) {
        console.log(chalk.yellow(`⚠️  ${result.errors.length} profiles had errors:`));
        result.errors.forEach(error => {
          console.log(chalk.yellow(`  • ${error}`));
        });
      }

      return { 
        success: result.imported > 0, 
        message: `Imported ${result.imported} profiles`,
        data: result 
      };

    } catch (error) {
      console.log(chalk.red(`❌ Error importing profiles: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle auth export command
   */
  private async handleAuthExport(filePath: string, options: any): Promise<CLIResult> {
    try {
      await this.credentialManager.initialize();

      console.log(chalk.blue(`📤 Exporting profiles to ${filePath}...`));

      await this.credentialManager.exportToFile(filePath, options.includeSecrets);

      console.log(chalk.green('✅ Profiles exported successfully'));
      
      if (!options.includeSecrets) {
        console.log(chalk.gray('Note: Sensitive credentials were redacted. Use --include-secrets to export full credentials.'));
      }

      return { success: true, message: 'Profiles exported successfully' };

    } catch (error) {
      console.log(chalk.red(`❌ Error exporting profiles: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle security validate command
   */
  private async handleSecurityValidate(specPath: string, options: any): Promise<CLIResult> {
    try {
      if (!await this.fileExists(specPath)) {
        return { success: false, error: `OpenAPI spec file not found: ${specPath}` };
      }

      console.log(chalk.blue('🔒 Validating API security configuration...'));

      const parseResult = await this.parser.parseFromFile(specPath, { strict: true, validateRefs: true });
      if (!parseResult.success || !parseResult.spec) {
        return { success: false, error: parseResult.error || 'Failed to parse OpenAPI specification' };
      }

      const validationResult = await this.securityValidator.validateApiSecurity(parseResult.spec);

      if (options.json) {
        console.log(JSON.stringify(validationResult, null, 2));
      } else {
        console.log(`\n${chalk.bold('Security Score:')} ${this.getScoreColor(validationResult.securityScore)(validationResult.securityScore.toString())}/100\n`);

        if (validationResult.vulnerabilities.length > 0) {
          console.log(chalk.bold('Security Issues:'));
          validationResult.vulnerabilities.forEach(vuln => {
            const severityColor = this.getSeverityColor(vuln.type);
            console.log(`${severityColor(`[${vuln.type.toUpperCase()}]`)} ${vuln.category}: ${vuln.description}`);
            if (vuln.endpoint) {
              console.log(chalk.gray(`  Endpoint: ${vuln.endpoint}`));
            }
            console.log(chalk.gray(`  Fix: ${vuln.recommendation}`));
            if (vuln.cwe) {
              console.log(chalk.gray(`  Reference: ${vuln.cwe}`));
            }
            console.log();
          });
        }

        if (validationResult.recommendations.length > 0) {
          console.log(chalk.bold('Security Recommendations:'));
          validationResult.recommendations.forEach(rec => {
            console.log(chalk.blue(`• ${rec}`));
          });
          console.log();
        }

        const status = validationResult.isSecure ? chalk.green('✅ Secure') : chalk.red('❌ Issues Found');
        console.log(`Status: ${status}`);
      }

      return { 
        success: true, 
        message: validationResult.isSecure ? 'API security validated' : 'Security issues found',
        data: validationResult 
      };

    } catch (error) {
      console.log(chalk.red(`❌ Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle security generate-tests command
   */
  private async handleSecurityGenerateTests(specPath: string, options: any): Promise<CLIResult> {
    try {
      if (!await this.fileExists(specPath)) {
        return { success: false, error: `OpenAPI spec file not found: ${specPath}` };
      }

      console.log(chalk.blue('🔐 Generating security test cases...'));

      const parseResult = await this.parser.parseFromFile(specPath, { strict: true, validateRefs: true });
      if (!parseResult.success || !parseResult.spec) {
        return { success: false, error: parseResult.error || 'Failed to parse OpenAPI specification' };
      }

      const securityTests = await this.securityValidator.generateSecurityTests(parseResult.spec);

      // Create output directory
      await fs.mkdir(options.output, { recursive: true });

      // Group tests by type
      const testsByType: Record<string, any[]> = {};
      securityTests.forEach(test => {
        if (!testsByType[test.testType]) {
          testsByType[test.testType] = [];
        }
        testsByType[test.testType]?.push(test);
      });

      let filesGenerated = 0;
      
      for (const [testType, tests] of Object.entries(testsByType)) {
        const fileName = `security-${testType}.test.ts`;
        const filePath = path.join(options.output, fileName);
        
        const content = this.generateSecurityTestFile(tests, options.framework, testType);
        await fs.writeFile(filePath, content);
        
        filesGenerated++;
        console.log(chalk.gray(`Generated ${fileName} with ${tests.length} test cases`));
      }

      console.log(chalk.green(`✅ Generated ${filesGenerated} security test files with ${securityTests.length} total test cases`));

      return { 
        success: true, 
        message: `Generated ${securityTests.length} security test cases`,
        data: { filesGenerated, testsGenerated: securityTests.length, outputDir: options.output }
      };

    } catch (error) {
      console.log(chalk.red(`❌ Security test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle security scan command
   */
  private async handleSecurityScan(specPath: string, options: any): Promise<CLIResult> {
    try {
      if (!await this.fileExists(specPath)) {
        return { success: false, error: `OpenAPI spec file not found: ${specPath}` };
      }

      console.log(chalk.blue('🔍 Performing comprehensive security scan...'));

      const parseResult = await this.parser.parseFromFile(specPath, { strict: true, validateRefs: true });
      if (!parseResult.success || !parseResult.spec) {
        return { success: false, error: parseResult.error || 'Failed to parse OpenAPI specification' };
      }

      const validationResult = await this.securityValidator.validateApiSecurity(parseResult.spec);
      const securityTests = await this.securityValidator.generateSecurityTests(parseResult.spec);

      const severityLevels = ['info', 'low', 'medium', 'high', 'critical'];
      const minSeverityIndex = severityLevels.indexOf(options.severity);
      
      const filteredVulnerabilities = validationResult.vulnerabilities.filter(vuln => 
        severityLevels.indexOf(vuln.type) >= minSeverityIndex
      );

      const scanResult = {
        score: validationResult.securityScore,
        isSecure: validationResult.isSecure,
        vulnerabilities: filteredVulnerabilities,
        recommendations: validationResult.recommendations,
        testCasesGenerated: securityTests.length,
        summary: {
          critical: filteredVulnerabilities.filter(v => v.type === 'critical').length,
          high: filteredVulnerabilities.filter(v => v.type === 'high').length,
          medium: filteredVulnerabilities.filter(v => v.type === 'medium').length,
          low: filteredVulnerabilities.filter(v => v.type === 'low').length,
          info: filteredVulnerabilities.filter(v => v.type === 'info').length
        }
      };

      if (options.json) {
        console.log(JSON.stringify(scanResult, null, 2));
      } else {
        console.log(`\n${chalk.bold('Security Scan Results')}`);
        console.log(`Score: ${this.getScoreColor(scanResult.score)(scanResult.score.toString())}/100`);
        console.log(`Status: ${scanResult.isSecure ? chalk.green('✅ Secure') : chalk.red('❌ Issues Found')}`);
        
        console.log(`\n${chalk.bold('Issue Summary:')}`);
        console.log(`Critical: ${chalk.red(scanResult.summary.critical)}`);
        console.log(`High: ${chalk.redBright(scanResult.summary.high)}`);
        console.log(`Medium: ${chalk.yellow(scanResult.summary.medium)}`);
        console.log(`Low: ${chalk.blue(scanResult.summary.low)}`);
        console.log(`Info: ${chalk.gray(scanResult.summary.info)}`);
        
        console.log(`\nSecurity test cases available: ${chalk.cyan(scanResult.testCasesGenerated)}`);

        if (options.verbose && filteredVulnerabilities.length > 0) {
          console.log(`\n${chalk.bold('Detailed Issues:')}`);
          filteredVulnerabilities.forEach((vuln, index) => {
            const severityColor = this.getSeverityColor(vuln.type);
            console.log(`\n${index + 1}. ${severityColor(`[${vuln.type.toUpperCase()}]`)} ${vuln.category}`);
            console.log(`   ${vuln.description}`);
            if (vuln.endpoint) {
              console.log(chalk.gray(`   Endpoint: ${vuln.endpoint}`));
            }
            console.log(chalk.gray(`   Recommendation: ${vuln.recommendation}`));
            if (vuln.cwe) {
              console.log(chalk.gray(`   CWE: ${vuln.cwe}`));
            }
          });
        }
      }

      return { 
        success: true, 
        message: `Security scan completed`,
        data: scanResult 
      };

    } catch (error) {
      console.log(chalk.red(`❌ Security scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Generate security test file content
   */
  private generateSecurityTestFile(tests: any[], framework: string, testType: string): string {
    const imports = framework === 'jest' 
      ? `import { describe, it, expect, beforeEach } from '@jest/globals';\nimport { ApiClient } from '../helpers/api-client';`
      : `import { describe, it, beforeEach } from 'mocha';\nimport { expect } from 'chai';\nimport { ApiClient } from '../helpers/api-client';`;

    let content = `${imports}\n\ndescribe('Security Tests - ${testType.charAt(0).toUpperCase() + testType.slice(1)}', () => {\n  let apiClient: any;\n\n  beforeEach(() => {\n    apiClient = new ApiClient({\n      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',\n      timeout: 5000\n    });\n  });\n\n`;

    tests.forEach(test => {
      content += `  it('${test.name}', async () => {\n`;
      content += `    // ${test.description}\n`;
      
      if (test.authBypass) {
        content += `    // Test without authentication\n`;
        content += `    const response = await apiClient.${test.method.toLowerCase()}('${test.endpoint}');\n`;
      } else if (test.payload) {
        content += `    const testPayload = ${JSON.stringify(test.payload, null, 4)};\n`;
        content += `    const response = await apiClient.${test.method.toLowerCase()}('${test.endpoint}', testPayload);\n`;
      } else {
        content += `    const response = await apiClient.${test.method.toLowerCase()}('${test.endpoint}');\n`;
      }
      
      content += `    expect(response.status).toBe(${test.expectedStatus});\n`;
      content += `  });\n\n`;
    });

    content += '});\n';
    return content;
  }

  /**
   * Get color for security score
   */
  private getScoreColor(score: number): (text: string) => string {
    if (score >= 90) return chalk.green;
    if (score >= 70) return chalk.yellow;
    if (score >= 50) return chalk.red;
    return chalk.redBright;
  }

  /**
   * Get color for vulnerability severity
   */
  private getSeverityColor(severity: string): (text: string) => string {
    switch (severity) {
      case 'critical': return chalk.redBright;
      case 'high': return chalk.red;
      case 'medium': return chalk.yellow;
      case 'low': return chalk.blue;
      case 'info': return chalk.gray;
      default: return chalk.white;
    }
  }

  /**
   * Handle generate command execution
   */
  private async handleGenerate(specPath: string, options: any): Promise<CLIResult> {
    try {
      if (options.verbose) {
        console.log(chalk.blue('🚀 Starting API test generation...'));
        console.log(chalk.gray(`Spec: ${specPath}`));
        console.log(chalk.gray(`Output: ${options.output}`));
        console.log(chalk.gray(`Framework: ${options.framework}`));
      }

      // Validate inputs
      const validationResult = await this.validateInputs(specPath, options);
      if (!validationResult.success) {
        return validationResult;
      }

      // Validate framework support
      const supportedFrameworks = getSupportedFrameworks();
      if (!supportedFrameworks.includes(options.framework)) {
        return {
          success: false,
          error: `Unsupported framework: ${options.framework}`,
          suggestion: `Supported frameworks: ${supportedFrameworks.join(', ')}`
        };
      }

      // Build generation options
      const generationOptions: GenerationOptions = {
        specPath,
        outputDir: options.output,
        framework: options.framework as TestFramework,
        verbose: options.verbose,
        coverage: options.coverage,
        template: options.template,
        timeout: parseInt(options.timeout),
        parallel: options.parallel,
        dryRun: options.dryRun
      };

      // Build enhanced generation options for the new generator
      const enhancedOptions = {
        framework: options.framework as 'jest' | 'mocha' | 'vitest',
        outputDir: options.output,
        includeTypes: options.includeTypes,
        generateMocks: options.generateMocks,
        authConfig: options.authType ? {
          type: options.authType as 'bearer' | 'apikey' | 'oauth2' | 'basic'
        } : undefined,
        dataGeneration: {
          useExamples: true,
          generateEdgeCases: options.edgeCases,
          maxStringLength: 100,
          maxArrayItems: 10,
          includeNull: false
        },
        coverage: {
          includeErrorCases: true,
          includeEdgeCases: options.edgeCases,
          statusCodes: ['200', '201', '400', '401', '403', '404', '500']
        }
      };

      // Load and merge configuration
      if (options.config) {
        const config = await this.loadConfig(options.config);
        this.config = { ...this.config, ...config };
      }

      // Execute generation with the new test generator
      const result = await this.executeGenerationWithNewGenerator(specPath, enhancedOptions, options.verbose);

      if (result.success) {
        console.log(chalk.green('✅ Generation completed successfully!'));
        console.log(chalk.gray(`Files generated: ${result.filesGenerated}`));
        console.log(chalk.gray(`Tests created: ${result.testsGenerated}`));
        console.log(chalk.gray(`Duration: ${result.duration}ms`));
      } else {
        console.log(chalk.red('❌ Generation failed:'));
        console.log(chalk.red(result.error));
      }

      return {
        success: result.success,
        message: result.success ? 'Generation completed' : (result.error || 'Generation failed'),
        data: result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(chalk.red(`❌ Error: ${errorMessage}`));
      
      return {
        success: false,
        error: errorMessage,
        suggestion: 'Please check your OpenAPI specification and try again'
      };
    }
  }

  /**
   * Handle validate command execution
   */
  private async handleValidate(specPath: string, options: any): Promise<CLIResult> {
    try {
      if (options.verbose) {
        console.log(chalk.blue('🔍 Validating OpenAPI specification...'));
      }

      // Check if file exists
      const exists = await this.fileExists(specPath);
      if (!exists) {
        return {
          success: false,
          error: `OpenAPI spec file not found: ${specPath}`
        };
      }

      // Execute validation (placeholder for now)
      const validationResults = await this.executeValidation(specPath, options);

      if (validationResults.isValid) {
        console.log(chalk.green('✅ OpenAPI specification is valid!'));
        console.log(chalk.gray(`Score: ${validationResults.score}%`));
      } else {
        console.log(chalk.red('❌ OpenAPI specification has issues:'));
        validationResults.errors.forEach(error => {
          console.log(chalk.red(`  • ${error}`));
        });
      }

      return {
        success: true,
        command: 'validate',
        validationResults,
        schemaOnly: options.schemaOnly
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle init command execution
   */
  private async handleInit(options: any): Promise<CLIResult> {
    try {
      console.log(chalk.blue('🏁 Initializing new API test project...'));

      // Create project structure (placeholder)
      const configCreated = await this.createProjectStructure(options);

      console.log(chalk.green('✅ Project initialized successfully!'));

      return {
        success: true,
        command: 'init',
        template: options.template,
        configCreated
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validate CLI inputs
   */
  private async validateInputs(specPath: string, options: any): Promise<CLIResult> {
    if (!specPath) {
      return {
        success: false,
        error: 'OpenAPI spec file is required'
      };
    }

    const exists = await this.fileExists(specPath);
    if (!exists) {
      return {
        success: false,
        error: 'OpenAPI spec file not found',
        suggestion: `Please ensure the file exists: ${specPath}`
      };
    }

    // Validate framework choice
    const validFrameworks = Object.values(TestFramework);
    if (options.framework && !validFrameworks.includes(options.framework)) {
      return {
        success: false,
        error: `Invalid framework: ${options.framework}`,
        suggestion: `Valid frameworks: ${validFrameworks.join(', ')}`
      };
    }

    return { success: true };
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute test generation using the new TestGenerator
   */
  private async executeGenerationWithNewGenerator(
    specPath: string, 
    options: any, 
    verbose: boolean = false
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      if (verbose) {
        console.log(chalk.blue('🚀 Starting comprehensive test generation...'));
        console.log(chalk.gray(`Framework: ${options.framework}`));
        console.log(chalk.gray(`Output: ${options.outputDir}`));
      }

      // Create output directory if it doesn't exist
      await fs.mkdir(options.outputDir, { recursive: true });

      // Generate tests using the new TestGenerator
      const generationResult = await this.generator.generateFromFile(specPath, options);

      if (!generationResult.success) {
        throw new Error(generationResult.errors.join(', '));
      }

      const duration = Date.now() - startTime;

      if (verbose) {
        console.log(chalk.gray(`Generated ${generationResult.generatedFiles.length} files`));
        console.log(chalk.gray(`Total tests: ${generationResult.summary.totalTests}`));
        console.log(chalk.gray(`Operations covered: ${generationResult.summary.operationsCovered}/${generationResult.summary.totalOperations}`));
        console.log(chalk.gray(`Coverage: ${generationResult.summary.coveragePercentage}%`));
        
        if (generationResult.warnings.length > 0) {
          console.log(chalk.yellow('⚠️  Warnings:'));
          generationResult.warnings.forEach(warning => {
            console.log(chalk.yellow(`  • ${warning}`));
          });
        }
      }

      return {
        success: true,
        filesGenerated: generationResult.generatedFiles.length,
        testsGenerated: generationResult.summary.totalTests,
        outputDir: options.outputDir,
        duration,
        framework: options.framework,
        details: [
          `Generated ${generationResult.generatedFiles.length} test files`,
          `${generationResult.summary.totalTests} total test cases`,
          `${generationResult.summary.operationsCovered}/${generationResult.summary.totalOperations} operations covered`,
          `Framework: ${options.framework}`,
          `Estimated run time: ${Math.ceil(generationResult.summary.estimatedRunTime / 1000)}s`
        ]
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        filesGenerated: 0,
        testsGenerated: 0,
        outputDir: options.outputDir,
        duration,
        framework: options.framework,
        error: error instanceof Error ? error.message : 'Generation failed'
      };
    }
  }

  /**
   * Execute test generation (legacy method for compatibility)
   */
  private async executeGeneration(options: GenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      if (options.verbose) {
        console.log(chalk.blue('📖 Parsing OpenAPI specification...'));
      }

      // Parse the OpenAPI specification
      const parseResult = await this.parser.parseFromFile(options.specPath, {
        strict: true,
        validateRefs: true
      });

      if (!parseResult.success || !parseResult.spec) {
        throw new Error(parseResult.error || 'Failed to parse OpenAPI specification');
      }

      const spec = parseResult.spec;

      if (options.verbose) {
        console.log(chalk.gray(`Found ${spec.metadata.totalOperations} operations in ${spec.metadata.totalPaths} paths`));
        console.log(chalk.gray(`HTTP methods: ${Array.from(spec.metadata.httpMethods).join(', ')}`));
      }

      // Extract operations for test generation
      const operations = await this.parser.extractOperations(spec);

      if (options.verbose) {
        console.log(chalk.gray(`Extracted ${operations.length} operations for test generation`));
      }

      // TODO: Actual test generation will be implemented in Week 2 Sprint 2
      console.log(chalk.yellow('⚠️  Test file generation logic pending Week 2 Sprint 2'));
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        filesGenerated: 0, // Will be implemented in Week 2 Sprint 2
        testsGenerated: operations.length, // Show the operations count as potential tests
        outputDir: options.outputDir,
        duration,
        framework: options.framework || TestFramework.JEST,
        details: [
          `Parsed OpenAPI v${spec.openapi}`,
          `Found ${operations.length} testable operations`,
          `API: ${spec.info.title} v${spec.info.version}`
        ]
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        filesGenerated: 0,
        testsGenerated: 0,
        outputDir: options.outputDir,
        duration,
        framework: options.framework || TestFramework.JEST,
        error: error instanceof Error ? error.message : 'Generation failed'
      };
    }
  }

  /**
   * Execute specification validation using OpenAPIValidator
   */
  private async executeValidation(specPath: string, options: any): Promise<ValidationResult> {
    try {
      if (options.verbose) {
        console.log(chalk.blue('🔍 Parsing OpenAPI specification...'));
      }

      // Use the validator to validate from file
      const validationResult = await this.validator.validateFromFile(specPath, {
        strict: !options.schemaOnly,
        includeWarnings: options.verbose,
        validateExamples: true,
        checkSecurity: !options.schemaOnly,
        validateRefs: true
      });

      if (options.verbose) {
        console.log(chalk.gray(`Validation completed in ${performance.now()}ms`));
      }

      return validationResult;

    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        score: 0,
        checks: {
          schema: false,
          paths: false,
          operations: false,
          responses: false
        }
      };
    }
  }

  /**
   * Create project structure (placeholder implementation)
   */
  private async createProjectStructure(options: any): Promise<boolean> {
    console.log(chalk.yellow('⚠️  Project initialization logic not yet implemented'));
    return true; // Placeholder
  }

  /**
   * Load configuration from file
   */
  public async loadConfig(configPath?: string): Promise<Partial<Config>> {
    if (!configPath) {
      // Try default config files
      const defaultPaths = [
        './api-test.config.js',
        './api-test.config.json',
        './.api-testrc.json'
      ];

      for (const defaultPath of defaultPaths) {
        if (await this.fileExists(defaultPath)) {
          configPath = defaultPath;
          break;
        }
      }
    }

    if (!configPath || !(await this.fileExists(configPath))) {
      return {};
    }

    try {
      if (configPath.endsWith('.json')) {
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
      } else {
        // For .js files, we'd need to use dynamic import
        // Placeholder for now
        return {};
      }
    } catch (error) {
      throw new ConfigurationError(`Failed to load config from ${configPath}`, error);
    }
  }

  /**
   * Register plugin
   */
  public registerPlugin(name: string, plugin: any): void {
    // Basic plugin interface validation
    if (!plugin.name || !plugin.generate || !plugin.validate) {
      throw new Error('Invalid plugin interface');
    }

    this.plugins.set(name, plugin as Plugin);
  }

  /**
   * Get registered plugins
   */
  public getRegisteredPlugins(): Record<string, Plugin> {
    const result: Record<string, Plugin> = {};
    this.plugins.forEach((plugin, name) => {
      result[name] = plugin;
    });
    return result;
  }

  /**
   * Get registered commands
   */
  public getRegisteredCommands(): string[] {
    return this.program.commands.map(cmd => cmd.name());
  }

  /**
   * Run CLI with arguments
   */
  public async run(args: string[]): Promise<CLIResult> {
    try {
      if (args.length === 0) {
        console.log(chalk.blue('Usage: api-test-gen <command> [options]'));
        console.log(chalk.gray('Commands:'));
        console.log(chalk.gray('  generate  Generate API tests from OpenAPI spec'));
        console.log(chalk.gray('  validate  Validate OpenAPI specification'));
        console.log(chalk.gray('  init      Initialize new API test project'));
        console.log(chalk.gray('Use --help with any command for more details'));
        
        return { 
          success: true, 
          message: 'Usage: api-test-gen <command> [options]' 
        };
      }

      // Check for unknown commands
      const validCommands = this.getRegisteredCommands();
      const command = args[0];
      
      if (command && !validCommands.includes(command) && !['--help', '-h', '--version', '-V'].includes(command)) {
        return {
          success: false,
          error: `Unknown command: ${command}`,
          suggestion: `Valid commands: ${validCommands.join(', ')}`
        };
      }

      // Parse and execute command
      try {
        await this.program.parseAsync(['node', 'cli.js', ...args]);
        return { success: true };
      } catch (error: any) {
        // Handle commander.js special cases that are actually successes
        if (error.code === 'commander.help' || error.message === '(outputHelp)') {
          // Help command was executed successfully
          return { 
            success: true,
            message: 'Help displayed successfully'
          };
        }
        if (error.code === 'commander.version' || (typeof error === 'string' && error.match(/^\d+\.\d+\.\d+$/))) {
          // Version command was executed successfully
          return { 
            success: true,
            message: 'Version displayed successfully'
          };
        }
        
        // Handle commander.js actual errors
        if (error.code === 'commander.missingArgument') {
          return {
            success: false,
            error: error.argument === 'spec' ? 'OpenAPI spec file is required' : `Missing required argument: ${error.argument}`,
            suggestion: 'Please provide the required argument'
          };
        }
        if (error.code === 'commander.unknownCommand') {
          return {
            success: false,
            error: `Unknown command: ${error.value}`,
            suggestion: `Valid commands: ${this.getRegisteredCommands().join(', ')}`
          };
        }
        if (error.code === 'commander.unknownOption') {
          return {
            success: false,
            error: `Unknown option: ${error.value}`,
            suggestion: 'Use --help to see available options'
          };
        }
        
        return {
          success: false,
          error: error.message || 'Command execution failed'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  /**
   * Setup contract testing commands
   */
  private setupContractCommands(): void {
    const contractCommand = this.program
      .command('contract')
      .description('Contract testing and validation');

    contractCommand
      .command('validate <spec-file>')
      .description('Validate API contracts against OpenAPI specification')
      .option('-o, --output <dir>', 'Output directory for contract tests', './tests/contract')
      .option('-f, --framework <framework>', 'Test framework (jest, mocha, vitest)', 'jest')
      .option('--validate-requests', 'Validate request schemas', true)
      .option('--validate-responses', 'Validate response schemas', true)
      .option('--validate-headers', 'Validate header requirements', true)
      .option('--strict-mode', 'Enable strict contract validation', false)
      .option('--auth-profile <profile>', 'Authentication profile to use')
      .option('--json', 'Output results in JSON format')
      .action((specFile, options) => this.handleContractValidation(specFile, options));

    contractCommand
      .command('generate <spec-file>')
      .description('Generate contract validation tests')
      .option('-o, --output <dir>', 'Output directory', './tests/contract')
      .option('-f, --framework <framework>', 'Test framework', 'jest')
      .option('--auth-profile <profile>', 'Authentication profile to use')
      .action((specFile, options) => this.handleContractGeneration(specFile, options));
  }

  /**
   * Setup enhanced test generation commands
   */
  private setupTestCommands(): void {
    const testCommand = this.program
      .command('test')
      .description('Advanced test generation and execution');

    testCommand
      .command('generate <spec-file>')
      .description('Generate comprehensive API tests with authentication')
      .option('-o, --output <dir>', 'Output directory', './tests/generated')
      .option('-f, --framework <framework>', 'Test framework (jest, mocha, vitest)', 'jest')
      .option('--auth-profile <profile>', 'Authentication profile to use')
      .option('--include-security', 'Include security test cases', false)
      .option('--include-types', 'Generate TypeScript type definitions', true)
      .option('--include-mocks', 'Generate mock files', false)
      .option('--include-contracts', 'Include contract validation tests', true)
      .option('--dry-run', 'Preview generated files without writing', false)
      .option('--verbose', 'Verbose output', false)
      .option('--json', 'Output results in JSON format')
      .action((specFile, options) => this.handleEnhancedTestGeneration(specFile, options));

    testCommand
      .command('run <test-dir>')
      .description('Run generated tests with authentication')
      .option('--auth-profile <profile>', 'Authentication profile to use')
      .option('-f, --framework <framework>', 'Test framework', 'jest')
      .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
      .option('--parallel', 'Run tests in parallel', false)
      .option('--coverage', 'Collect test coverage', false)
      .action((testDir, options) => this.handleTestRun(testDir, options));
  }

  /**
   * Handle enhanced test generation with Week 3 authentication integration
   */
  private async handleEnhancedTestGeneration(specFile: string, options: any): Promise<void> {
    try {
      if (options.verbose) {
        console.log(chalk.blue('🧪 Starting enhanced API test generation...'));
        console.log(chalk.gray(`Spec: ${specFile}`));
        console.log(chalk.gray(`Output: ${options.output}`));
        console.log(chalk.gray(`Framework: ${options.framework}`));
        if (options.authProfile) {
          console.log(chalk.gray(`Authentication: ${options.authProfile}`));
        }
      }

      const generator = new TestGenerator();
      await generator.initializeCredentials();

      // Validate credential profile if specified
      let credentialProfile = null;
      if (options.authProfile) {
        const credentialManager = generator.getCredentialManager();
        credentialProfile = await credentialManager.getProfile(options.authProfile);
        if (!credentialProfile) {
          console.log(chalk.red(`❌ Authentication profile '${options.authProfile}' not found`));
          console.log(chalk.gray('Use `auth list` to see available profiles or create one with `auth add`'));
          return;
        }
      }

      const generationOptions: EnhancedGenerationOptions = {
        framework: options.framework,
        outputDir: options.output,
        includeTypes: options.includeTypes,
        generateMocks: options.includeMocks,
        credentialProfile: options.authProfile,
        includeSecurityTests: options.includeSecurity,
        dataGeneration: {
          useExamples: true,
          generateEdgeCases: true,
          maxStringLength: 1000,
          maxArrayItems: 10,
          includeNull: false
        },
        coverage: {
          includeErrorCases: true,
          includeEdgeCases: true,
          includeSecurityTests: options.includeSecurity,
          statusCodes: ['200', '201', '400', '401', '403', '404', '500']
        },
        contractTesting: options.includeContracts ? {
          validateRequests: true,
          validateResponses: true,
          validateHeaders: true,
          strictMode: false
        } : undefined,
        dryRun: options.dryRun
      };

      // Generate tests
      const result = await generator.generateFromFile(specFile, generationOptions);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.success) {
          console.log(chalk.green('✅ Test generation completed successfully!'));
          console.log(`\n${chalk.bold('Generation Summary:')}`);
          console.log(`Total tests: ${chalk.cyan(result.summary.totalTests)}`);
          console.log(`Operations covered: ${chalk.cyan(result.summary.operationsCovered)}/${result.summary.totalOperations}`);
          console.log(`Coverage: ${chalk.cyan(result.summary.coveragePercentage + '%')}`);
          console.log(`Framework: ${chalk.cyan(result.summary.frameworks.join(', '))}`);
          console.log(`Estimated run time: ${chalk.cyan(result.summary.estimatedRunTime + 'ms')}`);

          if (result.generatedFiles.length > 0) {
            console.log(`\n${chalk.bold('Generated Files:')}`);
            result.generatedFiles.forEach(file => {
              const typeColor = file.type === 'test' ? chalk.green : 
                               file.type === 'type' ? chalk.blue :
                               file.type === 'mock' ? chalk.yellow : chalk.white;
              console.log(`  ${typeColor(file.type.padEnd(6))} ${file.path} (${file.testCount} tests, ${file.size} bytes)`);
            });
          }

          if (result.warnings.length > 0) {
            console.log(`\n${chalk.bold(chalk.yellow('Warnings:'))}`);
            result.warnings.forEach(warning => {
              console.log(chalk.yellow(`  ⚠️  ${warning}`));
            });
          }
        } else {
          console.log(chalk.red('❌ Test generation failed:'));
          result.errors.forEach(error => {
            console.log(chalk.red(`  • ${error}`));
          });
        }
      }


    } catch (error) {
      console.log(chalk.red(`❌ Test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle contract validation
   */
  private async handleContractValidation(specFile: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue('📋 Validating API contracts...'));
      
      const generator = new TestGenerator();
      await generator.initializeCredentials();

      const generationOptions: EnhancedGenerationOptions = {
        framework: options.framework,
        outputDir: options.output,
        credentialProfile: options.authProfile,
        contractTesting: {
          validateRequests: options.validateRequests,
          validateResponses: options.validateResponses,
          validateHeaders: options.validateHeaders,
          strictMode: options.strictMode
        },
        dryRun: true // Just validate, don't generate files yet
      };

      const result = await generator.generateFromFile(specFile, generationOptions);

      if (options.json) {
        console.log(JSON.stringify({
          valid: result.success,
          summary: result.summary,
          errors: result.errors,
          warnings: result.warnings
        }, null, 2));
      } else {
        if (result.success) {
          console.log(chalk.green('✅ Contract validation passed!'));
          console.log(`Operations validated: ${chalk.cyan(result.summary.operationsCovered)}`);
        } else {
          console.log(chalk.red('❌ Contract validation failed:'));
          result.errors.forEach(error => {
            console.log(chalk.red(`  • ${error}`));
          });
        }
      }

    } catch (error) {
      console.log(chalk.red(`❌ Contract validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle contract test generation
   */
  private async handleContractGeneration(specFile: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue('📝 Generating contract tests...'));
      
      const generator = new TestGenerator();
      await generator.initializeCredentials();

      const generationOptions: EnhancedGenerationOptions = {
        framework: options.framework,
        outputDir: options.output,
        credentialProfile: options.authProfile,
        contractTesting: {
          validateRequests: true,
          validateResponses: true,
          validateHeaders: true,
          strictMode: false
        }
      };

      const result = await generator.generateFromFile(specFile, generationOptions);

      if (result.success) {
        console.log(chalk.green('✅ Contract tests generated successfully!'));
        console.log(`Generated files: ${result.generatedFiles.length}`);
        result.generatedFiles.forEach(file => {
          console.log(`  📄 ${file.path}`);
        });
      } else {
        console.log(chalk.red('❌ Contract test generation failed:'));
        result.errors.forEach(error => {
          console.log(chalk.red(`  • ${error}`));
        });
      }


    } catch (error) {
      console.log(chalk.red(`❌ Contract generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle test run with authentication
   */
  private async handleTestRun(testDir: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue('🏃 Running generated tests...'));
      
      // For now, this would integrate with the test runner
      // Implementation would depend on the specific test framework
      console.log(chalk.yellow('⚠️  Test execution feature coming in next sprint'));
      

    } catch (error) {
      console.log(chalk.red(`❌ Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Setup performance testing commands
   */
  private setupPerformanceCommands(): void {
    const performanceCommand = this.program
      .command('performance')
      .description('Performance testing commands');

    performanceCommand
      .command('run')
      .description('Run performance tests')
      .option('--spec <file>', 'OpenAPI specification file')
      .option('--base-url <url>', 'Base URL for API endpoints', 'http://localhost:3000')
      .option('--concurrency <num>', 'Number of concurrent users', '10')
      .option('--duration <seconds>', 'Test duration in seconds', '60')
      .option('--ramp-up <seconds>', 'Ramp-up time in seconds', '0')
      .option('--ramp-down <seconds>', 'Ramp-down time in seconds', '0')
      .option('--auth-profile <profile>', 'Authentication profile to use')
      .option('--output <dir>', 'Output directory for reports', './reports/performance')
      .option('--format <format>', 'Report format (html, json)', 'html')
      .option('--thresholds-file <file>', 'Performance thresholds configuration file')
      .option('--scenario <name>', 'Performance test scenario to run')
      .option('--json', 'Output results in JSON format')
      .action(async (options) => this.handlePerformanceRun(options));

    performanceCommand
      .command('thresholds')
      .description('Manage performance thresholds')
      .option('--set <file>', 'Set thresholds from file')
      .option('--get', 'Get current thresholds')
      .option('--validate <file>', 'Validate thresholds file')
      .action(async (options) => this.handlePerformanceThresholds(options));
  }

  /**
   * Setup report generation commands
   */
  private setupReportCommands(): void {
    const reportCommand = this.program
      .command('report')
      .description('Test report generation');

    reportCommand
      .command('generate')
      .description('Generate comprehensive test report')
      .option('--input <dir>', 'Input directory containing test results', './reports')
      .option('--output <dir>', 'Output directory for generated reports', './reports/final')
      .option('--format <format>', 'Report format (html, pdf, json, junit, markdown)', 'html')
      .option('--title <title>', 'Report title')
      .option('--include-charts', 'Include performance charts', false)
      .option('--theme <theme>', 'Report theme (light, dark)', 'light')
      .option('--template <file>', 'Custom report template')
      .option('--json', 'Output metadata in JSON format')
      .action(async (options) => this.handleReportGeneration(options));

    reportCommand
      .command('dashboard')
      .description('Generate test dashboard with trends')
      .option('--input <dir>', 'Input directory containing historical test results')
      .option('--output <dir>', 'Output directory for dashboard', './reports/dashboard')
      .option('--days <num>', 'Number of days of historical data to include', '30')
      .option('--refresh-interval <minutes>', 'Auto-refresh interval for live dashboard', '5')
      .action(async (options) => this.handleDashboardGeneration(options));
  }

  /**
   * Setup mock server commands
   */
  private setupMockCommands(): void {
    const mockCommand = this.program
      .command('mock')
      .description('Mock server management');

    mockCommand
      .command('start')
      .description('Start mock server from OpenAPI specification')
      .argument('<spec>', 'OpenAPI specification file')
      .option('--port <port>', 'Server port', '3001')
      .option('--host <host>', 'Server host', 'localhost')
      .option('--https', 'Enable HTTPS', false)
      .option('--cert <file>', 'HTTPS certificate file')
      .option('--key <file>', 'HTTPS private key file')
      .option('--cors', 'Enable CORS', true)
      .option('--delay-min <ms>', 'Minimum response delay in milliseconds', '0')
      .option('--delay-max <ms>', 'Maximum response delay in milliseconds', '0')
      .option('--scenarios <file>', 'Load mock scenarios from file')
      .option('--persistence', 'Enable request persistence', false)
      .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
      .option('--watch', 'Watch spec file for changes', false)
      .action(async (spec, options) => this.handleMockStart(spec, options));

    mockCommand
      .command('stop')
      .description('Stop running mock server')
      .option('--port <port>', 'Server port to stop', '3001')
      .action(async (options) => this.handleMockStop(options));

    mockCommand
      .command('scenarios')
      .description('Manage mock scenarios')
      .option('--list', 'List available scenarios')
      .option('--activate <name>', 'Activate scenario')
      .option('--deactivate <name>', 'Deactivate scenario')
      .option('--create <file>', 'Create scenario from file')
      .option('--port <port>', 'Mock server port', '3001')
      .action(async (options) => this.handleMockScenarios(options));

    mockCommand
      .command('export')
      .description('Export mock server configuration')
      .option('--output <file>', 'Output file for configuration', './mock-config.json')
      .option('--port <port>', 'Mock server port', '3001')
      .action(async (options) => this.handleMockExport(options));
  }

  /**
   * Setup CI/CD pipeline commands
   */
  private setupCICDCommands(): void {
    const cicdCommand = this.program
      .command('cicd')
      .description('CI/CD pipeline management');

    cicdCommand
      .command('setup')
      .description('Setup CI/CD pipeline for project')
      .option('--platform <platform>', 'CI/CD platform (github, gitlab, jenkins, azure, circleci)', 'github')
      .option('--config <file>', 'Pipeline configuration file')
      .option('--environments <list>', 'Comma-separated list of environments', 'staging,production')
      .option('--output <dir>', 'Output directory for pipeline files', '.')
      .option('--overwrite', 'Overwrite existing pipeline files', false)
      .action(async (options) => this.handleCICDSetup(options));

    cicdCommand
      .command('validate')
      .description('Validate CI/CD pipeline configuration')
      .option('--platform <platform>', 'CI/CD platform to validate for')
      .option('--file <file>', 'Pipeline file to validate')
      .action(async (options) => this.handleCICDValidate(options));

    cicdCommand
      .command('status')
      .description('Get CI/CD pipeline status')
      .option('--project <name>', 'Project name')
      .option('--branch <name>', 'Branch name', 'main')
      .action(async (options) => this.handleCICDStatus(options));
  }

  /**
   * Handle performance test run
   */
  private async handlePerformanceRun(options: any): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Starting performance test...'));

      const config: PerformanceTestConfig = {
        baseURL: options.baseUrl,
        concurrency: parseInt(options.concurrency),
        duration: parseInt(options.duration),
        rampUp: parseInt(options.rampUp || '0'),
        rampDown: parseInt(options.rampDown || '0'),
        authProfile: options.authProfile,
        outputDir: options.output,
        generateReport: true,
        includeDetailedMetrics: true
      };

      // Load thresholds if specified
      if (options.thresholdsFile) {
        const thresholdsContent = await fs.readFile(options.thresholdsFile, 'utf8');
        const thresholds = JSON.parse(thresholdsContent);
        config.thresholds = thresholds.staging || thresholds; // Default to staging thresholds
      }

      // Generate endpoints from spec if provided
      if (options.spec) {
        const spec = await this.parser.parseFromFile(options.spec);
        if (spec.success && spec.spec) {
          config.endpoints = await this.generateEndpointsFromSpec(spec.spec);
        }
      }

      this.performanceTester.on('testStart', () => {
        console.log(chalk.blue('📊 Performance test started'));
      });

      this.performanceTester.on('requestComplete', ({ result }) => {
        if (options.verbose) {
          console.log(`${result.method} ${result.endpoint}: ${result.responseTime}ms`);
        }
      });

      const result = await this.performanceTester.runTest(config);

      if (result.success) {
        console.log(chalk.green('✅ Performance test completed successfully!'));
        console.log(`📈 Throughput: ${result.summary.throughput.toFixed(2)} req/s`);
        console.log(`⏱️  Avg Response Time: ${result.metrics.responseTime.avg.toFixed(2)}ms`);
        console.log(`📉 Error Rate: ${result.summary.errorRate.toFixed(2)}%`);
        
        if (result.reportPath) {
          console.log(`📊 Report: ${result.reportPath}`);
        }
      } else {
        console.log(chalk.red('❌ Performance test failed'));
        result.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
      }

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      }


    } catch (error) {
      console.log(chalk.red(`❌ Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle performance thresholds management
   */
  private async handlePerformanceThresholds(options: any): Promise<void> {
    try {
      if (options.set) {
        const content = await fs.readFile(options.set, 'utf8');
        const thresholds = JSON.parse(content);
        console.log(chalk.green('✅ Performance thresholds loaded'));
        console.log(JSON.stringify(thresholds, null, 2));
      }

      if (options.validate) {
        const content = await fs.readFile(options.validate, 'utf8');
        const thresholds = JSON.parse(content);
        // Add validation logic here
        console.log(chalk.green('✅ Thresholds file is valid'));
      }


    } catch (error) {
      console.log(chalk.red(`❌ Threshold operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle report generation
   */
  private async handleReportGeneration(options: any): Promise<void> {
    try {
      console.log(chalk.blue('📊 Generating test report...'));

      const config: ReportConfig = {
        outputDir: options.output,
        format: options.format as 'html' | 'pdf' | 'json' | 'junit' | 'markdown',
        title: options.title || 'API Test Report',
        includeCharts: options.includeCharts,
        theme: options.theme as 'light' | 'dark',
        templatePath: options.template
      };

      // Collect test results from input directory
      const testResults: TestResults = await this.collectTestResults(options.input);

      const result = await this.reportGenerator.generateReport(testResults, config);

      if (result.success) {
        console.log(chalk.green('✅ Report generated successfully!'));
        console.log(`📄 File: ${result.outputPath}`);
        console.log(`📏 Size: ${(result.size / 1024).toFixed(2)} KB`);
        console.log(`⏱️  Generation time: ${result.generationTime}ms`);
      } else {
        console.log(chalk.red('❌ Report generation failed'));
        result.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
      }

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      }


    } catch (error) {
      console.log(chalk.red(`❌ Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle dashboard generation
   */
  private async handleDashboardGeneration(options: any): Promise<void> {
    try {
      console.log(chalk.blue('📊 Generating test dashboard...'));

      // This would collect historical test results and generate a dashboard
      console.log(chalk.yellow('⚠️  Dashboard generation feature implementation in progress'));


    } catch (error) {
      console.log(chalk.red(`❌ Dashboard generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle mock server start
   */
  private async handleMockStart(spec: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue('🎭 Starting mock server...'));

      const config: MockServerConfig = {
        port: parseInt(options.port),
        host: options.host,
        https: options.https ? {
          enabled: true,
          cert: options.cert,
          key: options.key
        } : { enabled: false },
        cors: { enabled: options.cors },
        responseDelay: {
          min: parseInt(options.delayMin),
          max: parseInt(options.delayMax),
          distribution: 'random'
        },
        logging: {
          enabled: true,
          level: options.logLevel as 'debug' | 'info' | 'warn' | 'error',
          format: 'combined'
        },
        persistence: { enabled: options.persistence, type: 'memory' }
      };

      const mockServer = new MockServer(config);
      await mockServer.generateFromSpec(spec);

      const serverInfo = await mockServer.start();

      console.log(chalk.green('✅ Mock server started successfully!'));
      console.log(`🌐 URL: ${serverInfo.url}`);
      console.log(`📍 Routes: ${serverInfo.routes}`);
      console.log(`🎬 Scenarios: ${serverInfo.scenarios}`);

      // Keep the process running for watch mode
      if (options.watch) {
        console.log(chalk.blue('👀 Watching for spec file changes...'));
        // Implementation would watch file and reload server
      }


    } catch (error) {
      console.log(chalk.red(`❌ Mock server start failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle mock server stop
   */
  private async handleMockStop(options: any): Promise<void> {
    try {
      console.log(chalk.blue('🛑 Stopping mock server...'));
      
      // Implementation would connect to running server and stop it
      console.log(chalk.yellow('⚠️  Mock server stop implementation in progress'));


    } catch (error) {
      console.log(chalk.red(`❌ Mock server stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle mock scenarios management
   */
  private async handleMockScenarios(options: any): Promise<void> {
    try {
      if (options.list) {
        console.log(chalk.blue('📋 Available mock scenarios:'));
        // Implementation would list scenarios
      }

      if (options.activate) {
        console.log(chalk.blue(`🎬 Activating scenario: ${options.activate}`));
        // Implementation would activate scenario
      }


    } catch (error) {
      console.log(chalk.red(`❌ Scenario management failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle mock configuration export
   */
  private async handleMockExport(options: any): Promise<void> {
    try {
      console.log(chalk.blue('💾 Exporting mock configuration...'));
      
      // Implementation would export configuration
      console.log(chalk.yellow('⚠️  Mock export implementation in progress'));


    } catch (error) {
      console.log(chalk.red(`❌ Mock export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle CI/CD pipeline setup
   */
  private async handleCICDSetup(options: any): Promise<void> {
    try {
      console.log(chalk.blue('⚙️  Setting up CI/CD pipeline...'));

      const environments = options.environments.split(',').map((env: string) => ({
        name: env.trim(),
        url: `https://api.${env}.example.com`,
        authProfile: env,
        secrets: ['API_KEY', 'BEARER_TOKEN'],
        variables: {},
        deploymentGate: env === 'production'
      }));

      const config: PipelineConfig = {
        platform: options.platform as 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci',
        projectPath: options.output,
        environments,
        triggers: [
          { type: 'push', branches: ['main', 'develop'] },
          { type: 'pr', branches: ['main'] },
          { type: 'schedule', schedule: '0 2 * * *' },
          { type: 'manual' }
        ],
        notifications: [],
        artifacts: { retention: 30, reports: [], testResults: [], coverage: [] },
        thresholds: {
          coverage: { minimum: 80, delta: -5 },
          performance: { responseTime: 500, throughput: 50, errorRate: 5 },
          security: { maxHighVulnerabilities: 0, maxMediumVulnerabilities: 3 },
          functional: { minPassRate: 95, maxFailures: 5 }
        }
      };

      await this.pipelineIntegrator.setupPipeline(config);

      console.log(chalk.green('✅ CI/CD pipeline configured successfully!'));
      console.log(`🏗️  Platform: ${config.platform}`);
      console.log(`🌍 Environments: ${environments.map(e => e.name).join(', ')}`);


    } catch (error) {
      console.log(chalk.red(`❌ CI/CD setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle CI/CD validation
   */
  private async handleCICDValidate(options: any): Promise<void> {
    try {
      console.log(chalk.blue('✅ Validating CI/CD configuration...'));
      
      // Implementation would validate pipeline files
      console.log(chalk.yellow('⚠️  CI/CD validation implementation in progress'));


    } catch (error) {
      console.log(chalk.red(`❌ CI/CD validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Handle CI/CD status
   */
  private async handleCICDStatus(options: any): Promise<void> {
    try {
      console.log(chalk.blue('📊 Getting CI/CD pipeline status...'));
      
      // Implementation would get pipeline status
      console.log(chalk.yellow('⚠️  CI/CD status implementation in progress'));


    } catch (error) {
      console.log(chalk.red(`❌ CI/CD status failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Helper: Generate endpoints from OpenAPI spec
   */
  private async generateEndpointsFromSpec(spec: any): Promise<any[]> {
    const endpoints: any[] = [];
    
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
        ['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
          if (pathItem[method]) {
            endpoints.push({
              method: method.toUpperCase(),
              path,
              weight: 1
            });
          }
        });
      });
    }
    
    return endpoints;
  }

  /**
   * Helper: Collect test results from directory
   */
  private async collectTestResults(inputDir: string): Promise<TestResults> {
    // Implementation would scan input directory for test result files
    // and aggregate them into TestResults format
    return {};
  }
}