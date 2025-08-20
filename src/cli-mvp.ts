/**
 * Minimal MVP CLI Implementation
 * Focused on core OpenAPI test generation only
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { OpenAPIParser } from './parser/openapi-parser';
import { OpenAPIValidator } from './validator/openapi-validator';
import { TestGenerator } from './generator/test-generator';
import { 
  CLIResult, 
  GenerationOptions as BaseGenerationOptions, 
  GenerationResult as BaseGenerationResult,
  TestFramework,
  ValidationResult
} from './types';
import { GenerationOptions, GenerationResult } from './generator/test-generator';

export class CLI {
  private program: Command;
  private parser: OpenAPIParser;
  private validator: OpenAPIValidator;
  private generator: TestGenerator;

  constructor() {
    this.program = new Command();
    this.program.exitOverride(); // Prevent process.exit() calls during testing
    this.parser = new OpenAPIParser();
    this.validator = new OpenAPIValidator();
    this.generator = new TestGenerator();
    this.setupCommands();
  }

  /**
   * Set up all CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .name('api-test-gen')
      .description('AI API Test Automation Framework - MVP')
      .version('1.0.0');

    // Generate command
    this.program
      .command('generate')
      .alias('gen')
      .description('Generate tests from OpenAPI specification')
      .argument('<spec>', 'Path to OpenAPI specification file')
      .option('-o, --output <dir>', 'Output directory', './tests')
      .option('-f, --framework <framework>', 'Test framework (jest)', 'jest')
      .option('-v, --verbose', 'Verbose output', false)
      .option('--dry-run', 'Show what would be generated without creating files', false)
      .action(async (specPath: string, options: any) => {
        try {
          const result = await this.generateTests({
            specPath,
            outputDir: options.output,
            framework: options.framework as TestFramework,
            verbose: options.verbose,
            dryRun: options.dryRun
          });

          if (result.success) {
            console.log(chalk.green(`✓ Successfully generated ${result.testsGenerated} tests`));
            console.log(chalk.blue(`Output: ${result.outputDir}`));
          } else {
            console.error(chalk.red('✗ Test generation failed'));
            process.exit(1);
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          process.exit(1);
        }
      });

    // Validate command
    this.program
      .command('validate')
      .description('Validate OpenAPI specification')
      .argument('<spec>', 'Path to OpenAPI specification file')
      .option('-v, --verbose', 'Verbose output', false)
      .action(async (specPath: string, options: any) => {
        try {
          const result = await this.validateSpec(specPath, options.verbose);
          
          if (result.isValid) {
            console.log(chalk.green(`✓ Specification is valid (Score: ${result.score}/100)`));
          } else {
            console.log(chalk.yellow(`⚠ Specification has issues (Score: ${result.score}/100)`));
            if (result.errors.length > 0) {
              console.log(chalk.red('Errors:'));
              result.errors.forEach(error => console.log(`  - ${error}`));
            }
            if (result.warnings.length > 0) {
              console.log(chalk.yellow('Warnings:'));
              result.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          process.exit(1);
        }
      });
  }

  /**
   * Generate tests from OpenAPI specification
   */
  private async generateTests(options: BaseGenerationOptions): Promise<BaseGenerationResult> {
    // Parse OpenAPI spec
    const parsingResult = await this.parser.parseFromFile(options.specPath);
    if (!parsingResult.success || !parsingResult.spec) {
      throw new Error(`Failed to parse specification: ${parsingResult.error || 'Unknown parsing error'}`);
    }
    
    // Validate spec
    const validation = await this.validator.validateSpec(parsingResult.spec);
    if (!validation.isValid && validation.errors.length > 0) {
      throw new Error(`Specification validation failed: ${validation.errors.join(', ')}`);
    }

    // Map to TestGenerator options
    const generatorOptions: GenerationOptions = {
      framework: options.framework === 'jest' ? 'jest' : 'jest', // Default to jest for MVP
      outputDir: options.outputDir,
      dryRun: options.dryRun
    };

    // Generate tests using test generator
    const result = await this.generator.generateFromSpec(options.specPath, generatorOptions);
    
    // Map back to base result format
    return {
      success: result.success,
      filesGenerated: result.generatedFiles?.length || 0,
      testsGenerated: result.summary?.totalTests || 0,
      outputDir: options.outputDir,
      duration: 0, // MVP: no duration tracking
      framework: (options.framework || 'jest') as TestFramework
    };
  }

  /**
   * Validate OpenAPI specification
   */
  private async validateSpec(specPath: string, verbose: boolean): Promise<ValidationResult> {
    const parsingResult = await this.parser.parseFromFile(specPath);
    if (!parsingResult.success || !parsingResult.spec) {
      throw new Error(`Failed to parse specification: ${parsingResult.error || 'Unknown parsing error'}`);
    }
    const result = await this.validator.validateSpec(parsingResult.spec, { includeWarnings: verbose });
    return result;
  }

  /**
   * Run CLI with provided arguments
   */
  async run(argv?: string[]): Promise<CLIResult> {
    try {
      await this.program.parseAsync(argv);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown CLI error'
      };
    }
  }
}

// Export default for easy usage
export default CLI;