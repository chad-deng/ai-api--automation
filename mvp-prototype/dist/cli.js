#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const hybrid_generator_1 = require("./hybrid-generator");
const program = new commander_1.Command();
program
    .name('api-test-gen')
    .version('0.1.0')
    .description('MVP prototype for API test generation')
    .argument('<openapi-file>', 'OpenAPI specification file (JSON or YAML)')
    .option('-o, --output <dir>', 'Output directory', './tests')
    .action(async (file, options) => {
    try {
        console.log(chalk_1.default.blue('🚀 API Test Generator - Hybrid Template+AST Generation'));
        console.log(chalk_1.default.gray(`Processing: ${file}`));
        console.log(chalk_1.default.gray(`Output directory: ${options.output}`));
        const startTime = Date.now();
        const generator = new hybrid_generator_1.HybridGenerator();
        await generator.generate(file, options.output);
        const duration = Date.now() - startTime;
        console.log(chalk_1.default.green(`✅ Generation completed in ${duration}ms`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Generation failed:'));
        console.error(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map