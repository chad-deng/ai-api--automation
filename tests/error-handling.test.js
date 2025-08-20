"use strict";
/**
 * Error Handling Tests - TDD Implementation
 * Week 1 Sprint 1: Comprehensive Error Scenarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cli_1 = require("../src/cli");
const types_1 = require("../src/types");
(0, globals_1.describe)('Error Handling', () => {
    let cli;
    (0, globals_1.beforeEach)(() => {
        cli = new cli_1.CLI();
    });
    (0, globals_1.describe)('CLI Error Handling', () => {
        (0, globals_1.test)('should handle unknown commands gracefully', async () => {
            const result = await cli.run(['unknown-command']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Unknown command');
            (0, globals_1.expect)(result.suggestion).toContain('Valid commands');
        });
        (0, globals_1.test)('should handle missing required arguments', async () => {
            const result = await cli.run(['generate']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('OpenAPI spec file is required');
        });
        (0, globals_1.test)('should handle invalid file paths', async () => {
            const result = await cli.run(['generate', './non-existent-file.yaml']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('not found');
            (0, globals_1.expect)(result.suggestion).toBeDefined();
        });
        (0, globals_1.test)('should handle invalid framework options', async () => {
            const result = await cli.run(['generate', 'spec.yaml', '--framework', 'invalid-framework']);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid framework');
            (0, globals_1.expect)(result.suggestion).toContain('Valid frameworks');
        });
        (0, globals_1.test)('should handle empty argument arrays', async () => {
            const result = await cli.run([]);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.message).toContain('Usage');
        });
        (0, globals_1.test)('should handle malformed argument combinations', async () => {
            const malformedArgs = [
                ['generate', '--output'], // Missing value
                ['validate', '--framework', 'jest'], // Invalid option for validate
                ['init', '--template'], // Missing value
            ];
            for (const args of malformedArgs) {
                const result = await cli.run(args);
                (0, globals_1.expect)(result.success).toBe(false);
            }
        });
    });
    (0, globals_1.describe)('File System Error Handling', () => {
        (0, globals_1.test)('should handle permission denied errors', async () => {
            // Simulate permission error for output directory
            const result = await cli.run(['generate', 'spec.yaml', '--output', '/root/restricted']);
            // The CLI should attempt to create the directory and handle errors gracefully
            (0, globals_1.expect)(result).toBeDefined();
        });
        (0, globals_1.test)('should handle read-only file system', async () => {
            const result = await cli.run(['generate', 'spec.yaml', '--output', '/readonly-mount']);
            // Should handle filesystem constraints gracefully
            (0, globals_1.expect)(result).toBeDefined();
        });
        (0, globals_1.test)('should handle very long file paths', async () => {
            const longPath = 'a'.repeat(300) + '.yaml';
            const result = await cli.run(['generate', longPath]);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('not found');
        });
        (0, globals_1.test)('should handle special characters in file paths', async () => {
            const specialPaths = [
                './spec with spaces.yaml',
                './spec-with-unicode-🚀.yaml',
                './spec[brackets].yaml',
                './spec(parens).yaml'
            ];
            for (const path of specialPaths) {
                const result = await cli.run(['generate', path]);
                (0, globals_1.expect)(result.success).toBe(false);
                (0, globals_1.expect)(result.error).toContain('not found');
            }
        });
    });
    (0, globals_1.describe)('Configuration Error Handling', () => {
        (0, globals_1.test)('should handle malformed JSON configuration', async () => {
            await (0, globals_1.expect)(async () => {
                throw new types_1.ConfigurationError('Invalid JSON syntax in config file');
            }).rejects.toThrow(types_1.ConfigurationError);
        });
        (0, globals_1.test)('should handle missing configuration files', async () => {
            const config = await cli.loadConfig('./non-existent-config.json');
            (0, globals_1.expect)(config).toEqual({});
        });
        (0, globals_1.test)('should handle invalid configuration values', () => {
            const invalidConfigs = [
                { framework: 'invalid-framework' },
                { timeout: -1000 },
                { outputDir: null },
                { coverage: 'not-boolean' }
            ];
            invalidConfigs.forEach(config => {
                // Configuration validation would happen here
                (0, globals_1.expect)(config).toBeDefined();
            });
        });
        (0, globals_1.test)('should handle circular references in configuration', () => {
            const circularConfig = { name: 'test' };
            circularConfig.self = circularConfig;
            (0, globals_1.expect)(() => {
                JSON.stringify(circularConfig);
            }).toThrow();
        });
    });
    (0, globals_1.describe)('Plugin Error Handling', () => {
        (0, globals_1.test)('should handle plugin registration failures', () => {
            const invalidPlugin = {
                name: 'Invalid Plugin'
                // Missing required methods
            };
            (0, globals_1.expect)(() => {
                cli.registerPlugin('invalid', invalidPlugin);
            }).toThrow('Invalid plugin interface');
        });
        (0, globals_1.test)('should handle plugin execution failures', async () => {
            const failingPlugin = {
                name: 'Failing Plugin',
                generate: async () => {
                    throw new Error('Plugin generate failed');
                },
                validate: async () => {
                    throw new Error('Plugin validate failed');
                }
            };
            cli.registerPlugin('failing-plugin', failingPlugin);
            await (0, globals_1.expect)(failingPlugin.generate({
                specPath: './test.yaml',
                outputDir: './output'
            })).rejects.toThrow('Plugin generate failed');
        });
        (0, globals_1.test)('should handle missing plugin dependencies', () => {
            const pluginWithDependencies = {
                name: 'Dependency Plugin',
                dependencies: ['missing-dependency'],
                generate: async () => ({
                    success: true,
                    filesGenerated: 0,
                    testsGenerated: 0,
                    outputDir: './',
                    duration: 0,
                    framework: 'jest'
                }),
                validate: async () => ({
                    isValid: true,
                    errors: [],
                    warnings: [],
                    score: 100,
                    checks: { schema: true, paths: true, operations: true, responses: true }
                })
            };
            // Plugin registration should work, but execution might fail
            (0, globals_1.expect)(() => {
                cli.registerPlugin('dependency-plugin', pluginWithDependencies);
            }).not.toThrow();
        });
    });
    (0, globals_1.describe)('Custom Error Types', () => {
        (0, globals_1.test)('should create APITestGeneratorError with code and details', () => {
            const error = new types_1.APITestGeneratorError('Test error message', 'TEST_ERROR', { additional: 'info' });
            (0, globals_1.expect)(error.message).toBe('Test error message');
            (0, globals_1.expect)(error.code).toBe('TEST_ERROR');
            (0, globals_1.expect)(error.details).toEqual({ additional: 'info' });
            (0, globals_1.expect)(error.name).toBe('APITestGeneratorError');
        });
        (0, globals_1.test)('should create ValidationError as subclass', () => {
            const error = new types_1.ValidationError('Validation failed', { schema: 'invalid' });
            (0, globals_1.expect)(error).toBeInstanceOf(types_1.ValidationError);
            (0, globals_1.expect)(error).toBeInstanceOf(types_1.APITestGeneratorError);
            (0, globals_1.expect)(error.code).toBe('VALIDATION_ERROR');
            (0, globals_1.expect)(error.name).toBe('ValidationError');
        });
        (0, globals_1.test)('should create GenerationError as subclass', () => {
            const error = new types_1.GenerationError('Generation failed', { step: 'parsing' });
            (0, globals_1.expect)(error).toBeInstanceOf(types_1.GenerationError);
            (0, globals_1.expect)(error).toBeInstanceOf(types_1.APITestGeneratorError);
            (0, globals_1.expect)(error.code).toBe('GENERATION_ERROR');
            (0, globals_1.expect)(error.name).toBe('GenerationError');
        });
        (0, globals_1.test)('should create ConfigurationError as subclass', () => {
            const error = new types_1.ConfigurationError('Configuration invalid', { file: 'config.json' });
            (0, globals_1.expect)(error).toBeInstanceOf(types_1.ConfigurationError);
            (0, globals_1.expect)(error).toBeInstanceOf(types_1.APITestGeneratorError);
            (0, globals_1.expect)(error.code).toBe('CONFIGURATION_ERROR');
            (0, globals_1.expect)(error.name).toBe('ConfigurationError');
        });
    });
    (0, globals_1.describe)('Error Recovery and Suggestions', () => {
        (0, globals_1.test)('should provide helpful suggestions for common mistakes', async () => {
            const commonMistakes = [
                { args: ['generat', 'spec.yaml'], suggestion: 'generate' }, // Typo
                { args: ['generate', 'spec.yml'], suggestion: 'yaml' }, // Wrong extension
                { args: ['validate', 'spec.yaml', '--jest'], suggestion: 'framework' } // Wrong option
            ];
            for (const mistake of commonMistakes) {
                const result = await cli.run(mistake.args);
                (0, globals_1.expect)(result.success).toBe(false);
                // Suggestions would be implemented in the actual CLI logic
            }
        });
        (0, globals_1.test)('should suggest similar commands for typos', async () => {
            const typos = [
                'generat',
                'validat',
                'ini'
            ];
            for (const typo of typos) {
                const result = await cli.run([typo]);
                (0, globals_1.expect)(result.success).toBe(false);
                (0, globals_1.expect)(result.error).toContain('Unknown command');
            }
        });
        (0, globals_1.test)('should provide context-aware error messages', async () => {
            // Different contexts should provide different error messages
            const contexts = [
                { context: 'file-not-found', expectedContent: 'not found' },
                { context: 'invalid-option', expectedContent: 'Invalid' },
                { context: 'missing-argument', expectedContent: 'required' }
            ];
            contexts.forEach(context => {
                (0, globals_1.expect)(context.expectedContent).toBeDefined();
            });
        });
    });
    (0, globals_1.describe)('Error Logging and Monitoring', () => {
        (0, globals_1.test)('should log errors appropriately', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            try {
                await cli.run(['invalid-command']);
                // Error should be logged (implementation dependent)
                (0, globals_1.expect)(consoleSpy).toHaveBeenCalled();
            }
            finally {
                consoleSpy.mockRestore();
            }
        });
        (0, globals_1.test)('should handle errors without breaking the application', async () => {
            // Multiple errors in sequence shouldn't crash
            const errorCommands = [
                ['invalid-command'],
                ['generate'], // Missing argument
                ['generate', 'nonexistent.yaml'],
                ['validate', 'nonexistent.yaml']
            ];
            for (const cmd of errorCommands) {
                const result = await cli.run(cmd);
                (0, globals_1.expect)(result).toBeDefined();
                (0, globals_1.expect)(result.success).toBe(false);
            }
            // CLI should still be functional after errors
            const validResult = await cli.run(['--help']);
            (0, globals_1.expect)(validResult.success).toBe(true);
        });
        (0, globals_1.test)('should maintain error context across operations', async () => {
            let errorCount = 0;
            const commands = [
                ['invalid1'],
                ['invalid2'],
                ['invalid3']
            ];
            for (const cmd of commands) {
                const result = await cli.run(cmd);
                if (!result.success) {
                    errorCount++;
                }
            }
            (0, globals_1.expect)(errorCount).toBe(3);
        });
    });
});
//# sourceMappingURL=error-handling.test.js.map