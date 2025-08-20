#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { HybridGenerator } from './hybrid-generator';

const program = new Command();

program
  .name('api-test-gen')
  .version('0.1.0')
  .description('MVP prototype for API test generation')
  .argument('<openapi-file>', 'OpenAPI specification file (JSON or YAML)')
  .option('-o, --output <dir>', 'Output directory', './tests')
  .action(async (file: string, options: { output: string }) => {
    try {
      console.log(chalk.blue('🚀 API Test Generator - Hybrid Template+AST Generation'));
      console.log(chalk.gray(`Processing: ${file}`));
      console.log(chalk.gray(`Output directory: ${options.output}`));
      
      const startTime = Date.now();
      const generator = new HybridGenerator();
      
      await generator.generate(file, options.output);
      
      const duration = Date.now() - startTime;
      console.log(chalk.green(`✅ Generation completed in ${duration}ms`));
      
    } catch (error) {
      console.error(chalk.red('❌ Generation failed:'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();