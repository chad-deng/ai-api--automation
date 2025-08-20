"use strict";
/**
 * Minimal MVP CLI Implementation
 * Focused on core OpenAPI test generation only
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const openapi_parser_1 = require("./parser/openapi-parser");
const openapi_validator_1 = require("./validator/openapi-validator");
const test_generator_1 = require("./generator/test-generator");
class CLI {
    constructor() {
        this.program = new commander_1.Command();
        this.program.exitOverride(); // Prevent process.exit() calls during testing
        this.parser = new openapi_parser_1.OpenAPIParser();
        this.validator = new openapi_validator_1.OpenAPIValidator();
        this.generator = new test_generator_1.TestGenerator();
        this.setupCommands();
    }
    /**
     * Set up all CLI commands and options
     */
    setupCommands() {
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
            .action(async (specPath, options) => {
            try {
                const result = await this.generateTests({
                    specPath,
                    outputDir: options.output,
                    framework: options.framework,
                    verbose: options.verbose,
                    dryRun: options.dryRun
                });
                if (result.success) {
                    console.log(chalk_1.default.green(`✓ Successfully generated ${result.testsGenerated} tests`));
                    console.log(chalk_1.default.blue(`Output: ${result.outputDir}`));
                }
                else {
                    console.error(chalk_1.default.red('✗ Test generation failed'));
                    process.exit(1);
                }
            }
            catch (error) {
                console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
                process.exit(1);
            }
        });
        // Validate command
        this.program
            .command('validate')
            .description('Validate OpenAPI specification')
            .argument('<spec>', 'Path to OpenAPI specification file')
            .option('-v, --verbose', 'Verbose output', false)
            .action(async (specPath, options) => {
            try {
                const result = await this.validateSpec(specPath, options.verbose);
                if (result.isValid) {
                    console.log(chalk_1.default.green(`✓ Specification is valid (Score: ${result.score}/100)`));
                }
                else {
                    console.log(chalk_1.default.yellow(`⚠ Specification has issues (Score: ${result.score}/100)`));
                    if (result.errors.length > 0) {
                        console.log(chalk_1.default.red('Errors:'));
                        result.errors.forEach(error => console.log(`  - ${error}`));
                    }
                    if (result.warnings.length > 0) {
                        console.log(chalk_1.default.yellow('Warnings:'));
                        result.warnings.forEach(warning => console.log(`  - ${warning}`));
                    }
                }
            }
            catch (error) {
                console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
                process.exit(1);
            }
        });
    }
    /**
     * Generate tests from OpenAPI specification
     */
    async generateTests(options) {
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
        const generatorOptions = {
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
            framework: (options.framework || 'jest')
        };
    }
    /**
     * Validate OpenAPI specification
     */
    async validateSpec(specPath, verbose) {
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
    async run(argv) {
        try {
            await this.program.parseAsync(argv);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown CLI error'
            };
        }
    }
}
exports.CLI = CLI;
// Export default for easy usage
exports.default = CLI;
//# sourceMappingURL=cli-mvp.js.map