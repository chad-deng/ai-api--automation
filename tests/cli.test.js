"use strict";
/**
 * CLI Framework Tests - TDD Implementation
 * Week 1 Sprint 1: Test-First Development
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cli_1 = require("../src/cli");
const setup_1 = require("./setup");
(0, globals_1.describe)('CLI Framework', () => {
    let cli;
    let mockConsole;
    (0, globals_1.beforeEach)(() => {
        cli = new cli_1.CLI();
        mockConsole = globals_1.jest.spyOn(console, 'log').mockImplementation();
    });
    afterEach(() => {
        mockConsole.mockRestore();
    });
    (0, globals_1.describe)('Command Registration', () => {
        (0, globals_1.test)('should register generate command', () => {
            const commands = cli.getRegisteredCommands();
            (0, globals_1.expect)(commands).toContain('generate');
        });
        (0, globals_1.test)('should register validate command', () => {
            const commands = cli.getRegisteredCommands();
            (0, globals_1.expect)(commands).toContain('validate');
        });
        (0, globals_1.test)('should register init command', () => {
            const commands = cli.getRegisteredCommands();
            (0, globals_1.expect)(commands).toContain('init');
        });
        (0, globals_1.test)('should show help when no command provided', async () => {
            await cli.run([]);
            (0, globals_1.expect)(mockConsole).toHaveBeenCalledWith(globals_1.expect.stringContaining('Usage: api-test-gen <command>'));
        });
    });
    (0, globals_1.describe)('Generate Command', () => {
        (0, globals_1.test)('should require OpenAPI spec file parameter', async () => {
            const result = await cli.run(['generate']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('OpenAPI spec file is required');
        });
        (0, globals_1.test)('should accept output directory parameter', async () => {
            const result = await cli.run(['generate', 'spec.yaml', '--output', './tests']);
            (0, globals_1.expect)(result.outputDir).toBe('./tests');
        });
        (0, globals_1.test)('should default output directory to current directory', async () => {
            const result = await cli.run(['generate', 'spec.yaml']);
            (0, globals_1.expect)(result.outputDir).toBe('./');
        });
        (0, globals_1.test)('should validate OpenAPI spec file exists', async () => {
            const result = await cli.run(['generate', 'nonexistent.yaml']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('OpenAPI spec file not found');
        });
        (0, globals_1.test)('should support verbose mode', async () => {
            const result = await cli.run(['generate', 'spec.yaml', '--verbose']);
            (0, globals_1.expect)(result.verbose).toBe(true);
        });
        (0, globals_1.test)('should support framework selection', async () => {
            const result = await cli.run(['generate', 'spec.yaml', '--framework', 'jest']);
            (0, globals_1.expect)(result.framework).toBe('jest');
        });
    });
    (0, globals_1.describe)('Validate Command', () => {
        (0, globals_1.test)('should validate OpenAPI specification', async () => {
            const result = await cli.run(['validate', 'spec.yaml']);
            (0, globals_1.expect)(result.command).toBe('validate');
        });
        (0, globals_1.test)('should return validation results', async () => {
            const result = await cli.run(['validate', 'spec.yaml']);
            (0, globals_1.expect)(result).toHaveProperty('validationResults');
        });
        (0, globals_1.test)('should support schema validation only', async () => {
            const result = await cli.run(['validate', 'spec.yaml', '--schema-only']);
            (0, globals_1.expect)(result.schemaOnly).toBe(true);
        });
    });
    (0, globals_1.describe)('Init Command', () => {
        (0, globals_1.test)('should initialize project structure', async () => {
            const result = await cli.run(['init']);
            (0, globals_1.expect)(result.command).toBe('init');
        });
        (0, globals_1.test)('should support template selection', async () => {
            const result = await cli.run(['init', '--template', 'jest-supertest']);
            (0, globals_1.expect)(result.template).toBe('jest-supertest');
        });
        (0, globals_1.test)('should create default configuration', async () => {
            const result = await cli.run(['init']);
            (0, globals_1.expect)(result.configCreated).toBe(true);
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.test)('should handle invalid commands gracefully', async () => {
            const result = await cli.run(['invalid-command']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Unknown command');
        });
        (0, globals_1.test)('should handle missing required parameters', async () => {
            const result = await cli.run(['generate']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toBeDefined();
        });
        (0, globals_1.test)('should provide helpful error messages', async () => {
            const result = await cli.run(['generate', 'nonexistent.yaml']);
            (0, globals_1.expect)(result.error).toContain('not found');
            (0, globals_1.expect)(result.suggestion).toBeDefined();
        });
    });
    (0, globals_1.describe)('Performance Requirements', () => {
        (0, globals_1.test)('should start CLI under 100ms', async () => {
            const timer = new setup_1.PerformanceTimer();
            timer.start();
            const cli = new cli_1.CLI();
            const duration = timer.end();
            (0, globals_1.expect)(duration).toBeLessThan(100);
        });
        (0, globals_1.test)('should parse commands under 50ms', async () => {
            const timer = new setup_1.PerformanceTimer();
            timer.start();
            await cli.run(['generate', '--help']);
            const duration = timer.end();
            (0, globals_1.expect)(duration).toBeLessThan(50);
        });
    });
    (0, globals_1.describe)('Configuration Management', () => {
        (0, globals_1.test)('should load configuration from file', () => {
            const config = cli.loadConfig('./api-test.config.js');
            (0, globals_1.expect)(config).toBeDefined();
        });
        (0, globals_1.test)('should merge CLI options with config file', async () => {
            const result = await cli.run(['generate', 'spec.yaml', '--config', './test.config.js']);
            (0, globals_1.expect)(result.mergedConfig).toBeDefined();
        });
        (0, globals_1.test)('should support environment variable overrides', () => {
            process.env.API_TEST_OUTPUT_DIR = './custom-output';
            const config = cli.loadConfig();
            (0, globals_1.expect)(config.outputDir).toBe('./custom-output');
            delete process.env.API_TEST_OUTPUT_DIR;
        });
    });
    (0, globals_1.describe)('Plugin System', () => {
        (0, globals_1.test)('should support custom generators', async () => {
            cli.registerPlugin('custom-generator', {
                name: 'Custom Generator',
                generate: globals_1.jest.fn()
            });
            const plugins = cli.getRegisteredPlugins();
            (0, globals_1.expect)(plugins).toHaveProperty('custom-generator');
        });
        (0, globals_1.test)('should validate plugin interfaces', () => {
            (0, globals_1.expect)(() => {
                cli.registerPlugin('invalid', {});
            }).toThrow('Invalid plugin interface');
        });
    });
});
(0, globals_1.describe)('CLI Integration Tests', () => {
    let cli;
    (0, globals_1.beforeEach)(() => {
        cli = new cli_1.CLI();
    });
    (0, globals_1.test)('should handle complete generate workflow', async () => {
        // This will use the test fixtures from our existing test-fixtures directory
        const result = await cli.run([
            'generate',
            '../test-fixtures/simple/jsonplaceholder.yaml',
            '--output', './temp-tests',
            '--framework', 'jest',
            '--verbose'
        ]);
        (0, globals_1.expect)(result.success).toBe(true);
        (0, globals_1.expect)(result.filesGenerated).toBeGreaterThan(0);
        (0, globals_1.expect)(result.outputDir).toBe('./temp-tests');
    });
    (0, globals_1.test)('should validate against real OpenAPI specs', async () => {
        const result = await cli.run([
            'validate',
            '../test-fixtures/complex/stripe-subset.yaml'
        ]);
        (0, globals_1.expect)(result.success).toBe(true);
        (0, globals_1.expect)(result.validationResults.isValid).toBe(true);
    });
    (0, globals_1.test)('should handle edge case specifications', async () => {
        const result = await cli.run([
            'validate',
            '../test-fixtures/edge-cases/circular-refs.yaml'
        ]);
        (0, globals_1.expect)(result.success).toBe(true);
        (0, globals_1.expect)(result.validationResults.warnings).toBeDefined();
    });
});
//# sourceMappingURL=cli.test.js.map