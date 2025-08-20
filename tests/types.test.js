"use strict";
/**
 * Type Definitions Tests - TDD Implementation
 * Week 1 Sprint 1: Interface Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const types_1 = require("../src/types");
(0, globals_1.describe)('Core Type Definitions', () => {
    (0, globals_1.describe)('OpenAPISpec Interface', () => {
        (0, globals_1.test)('should have required OpenAPI 3.0 properties', () => {
            const validSpec = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0'
                },
                paths: {}
            };
            (0, globals_1.expect)(validSpec.openapi).toBe('3.0.0');
            (0, globals_1.expect)(validSpec.info).toBeDefined();
            (0, globals_1.expect)(validSpec.paths).toBeDefined();
        });
        (0, globals_1.test)('should support optional server definitions', () => {
            const specWithServers = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {},
                servers: [
                    { url: 'https://api.example.com' }
                ]
            };
            (0, globals_1.expect)(specWithServers.servers).toHaveLength(1);
            (0, globals_1.expect)(specWithServers.servers[0].url).toBe('https://api.example.com');
        });
        (0, globals_1.test)('should support components and security definitions', () => {
            const complexSpec = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {},
                components: {
                    schemas: {},
                    securitySchemes: {}
                },
                security: []
            };
            (0, globals_1.expect)(complexSpec.components).toBeDefined();
            (0, globals_1.expect)(complexSpec.security).toBeDefined();
        });
    });
    (0, globals_1.describe)('GenerationOptions Interface', () => {
        (0, globals_1.test)('should have default values for optional properties', () => {
            const options = {
                specPath: './spec.yaml',
                outputDir: './tests'
            };
            (0, globals_1.expect)(options.specPath).toBeDefined();
            (0, globals_1.expect)(options.outputDir).toBeDefined();
        });
        (0, globals_1.test)('should support all test framework options', () => {
            const jestOptions = {
                specPath: './spec.yaml',
                outputDir: './tests',
                framework: types_1.TestFramework.JEST,
                verbose: true,
                coverage: true
            };
            (0, globals_1.expect)(jestOptions.framework).toBe(types_1.TestFramework.JEST);
        });
        (0, globals_1.test)('should validate framework enum values', () => {
            const validFrameworks = Object.values(types_1.TestFramework);
            (0, globals_1.expect)(validFrameworks).toContain(types_1.TestFramework.JEST);
            (0, globals_1.expect)(validFrameworks).toContain(types_1.TestFramework.MOCHA);
            (0, globals_1.expect)(validFrameworks).toContain(types_1.TestFramework.VITEST);
        });
    });
    (0, globals_1.describe)('GenerationResult Interface', () => {
        (0, globals_1.test)('should track generation success and metrics', () => {
            const result = {
                success: true,
                filesGenerated: 5,
                testsGenerated: 25,
                outputDir: './tests',
                duration: 150,
                framework: types_1.TestFramework.JEST
            };
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.filesGenerated).toBeGreaterThan(0);
            (0, globals_1.expect)(result.testsGenerated).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should include error details on failure', () => {
            const failureResult = {
                success: false,
                filesGenerated: 0,
                testsGenerated: 0,
                outputDir: './tests',
                duration: 50,
                framework: types_1.TestFramework.JEST,
                error: 'Invalid OpenAPI specification',
                details: ['Missing required paths section']
            };
            (0, globals_1.expect)(failureResult.success).toBe(false);
            (0, globals_1.expect)(failureResult.error).toBeDefined();
            (0, globals_1.expect)(failureResult.details).toHaveLength(1);
        });
    });
    (0, globals_1.describe)('ValidationResult Interface', () => {
        (0, globals_1.test)('should provide comprehensive validation feedback', () => {
            const result = {
                isValid: true,
                errors: [],
                warnings: ['Optional server definition missing'],
                score: 95,
                checks: {
                    schema: true,
                    paths: true,
                    operations: true,
                    responses: true
                }
            };
            (0, globals_1.expect)(result.isValid).toBe(true);
            (0, globals_1.expect)(result.score).toBeGreaterThan(90);
            (0, globals_1.expect)(result.checks.schema).toBe(true);
        });
        (0, globals_1.test)('should handle validation failures with detailed errors', () => {
            const failureResult = {
                isValid: false,
                errors: [
                    'Missing required openapi version',
                    'Invalid path parameter syntax'
                ],
                warnings: [],
                score: 45,
                checks: {
                    schema: false,
                    paths: false,
                    operations: true,
                    responses: true
                }
            };
            (0, globals_1.expect)(failureResult.isValid).toBe(false);
            (0, globals_1.expect)(failureResult.errors).toHaveLength(2);
            (0, globals_1.expect)(failureResult.score).toBeLessThan(50);
        });
    });
    (0, globals_1.describe)('CLICommand Interface', () => {
        (0, globals_1.test)('should define command structure with options', () => {
            const generateCommand = {
                name: 'generate',
                description: 'Generate API tests from OpenAPI specification',
                options: [
                    {
                        flags: '-o, --output <dir>',
                        description: 'Output directory for generated tests',
                        defaultValue: './'
                    },
                    {
                        flags: '-f, --framework <framework>',
                        description: 'Test framework (jest, mocha, vitest)',
                        defaultValue: 'jest'
                    }
                ],
                action: async () => ({ success: true })
            };
            (0, globals_1.expect)(generateCommand.name).toBe('generate');
            (0, globals_1.expect)(generateCommand.options).toHaveLength(2);
            (0, globals_1.expect)(generateCommand.action).toBeDefined();
        });
    });
    (0, globals_1.describe)('Plugin Interface', () => {
        (0, globals_1.test)('should define plugin contract with required methods', () => {
            const mockPlugin = {
                name: 'Test Plugin',
                version: '1.0.0',
                description: 'Test plugin for validation',
                generate: async () => ({
                    success: true,
                    filesGenerated: 1,
                    testsGenerated: 5,
                    outputDir: './tests',
                    duration: 100,
                    framework: types_1.TestFramework.JEST
                }),
                validate: async () => ({
                    isValid: true,
                    errors: [],
                    warnings: [],
                    score: 100,
                    checks: {
                        schema: true,
                        paths: true,
                        operations: true,
                        responses: true
                    }
                })
            };
            (0, globals_1.expect)(mockPlugin.name).toBeDefined();
            (0, globals_1.expect)(mockPlugin.generate).toBeDefined();
            (0, globals_1.expect)(mockPlugin.validate).toBeDefined();
        });
        (0, globals_1.test)('should support optional plugin hooks', () => {
            const pluginWithHooks = {
                name: 'Advanced Plugin',
                version: '1.0.0',
                description: 'Plugin with lifecycle hooks',
                generate: async () => ({
                    success: true,
                    filesGenerated: 0,
                    testsGenerated: 0,
                    outputDir: './',
                    duration: 0,
                    framework: types_1.TestFramework.JEST
                }),
                validate: async () => ({
                    isValid: true,
                    errors: [],
                    warnings: [],
                    score: 100,
                    checks: {
                        schema: true,
                        paths: true,
                        operations: true,
                        responses: true
                    }
                }),
                beforeGenerate: async (options) => {
                    console.log(`Before generate: ${options.specPath}`);
                },
                afterGenerate: async (result) => {
                    console.log(`After generate: ${result.filesGenerated} files`);
                }
            };
            (0, globals_1.expect)(pluginWithHooks.beforeGenerate).toBeDefined();
            (0, globals_1.expect)(pluginWithHooks.afterGenerate).toBeDefined();
        });
    });
    (0, globals_1.describe)('Type Safety Validation', () => {
        (0, globals_1.test)('should enforce required properties at compile time', () => {
            // This test validates TypeScript compilation - if it compiles, types are correct
            const spec = {
                openapi: '3.0.0',
                info: {
                    title: 'Required Test',
                    version: '1.0.0'
                },
                paths: {}
            };
            // TypeScript should enforce these properties exist
            (0, globals_1.expect)(spec.openapi).toBeTruthy();
            (0, globals_1.expect)(spec.info.title).toBeTruthy();
            (0, globals_1.expect)(spec.info.version).toBeTruthy();
            (0, globals_1.expect)(spec.paths).toBeDefined();
        });
        (0, globals_1.test)('should allow optional properties to be undefined', () => {
            const minimalOptions = {
                specPath: './test.yaml',
                outputDir: './output'
                // All other properties should be optional
            };
            (0, globals_1.expect)(minimalOptions.framework).toBeUndefined();
            (0, globals_1.expect)(minimalOptions.verbose).toBeUndefined();
            (0, globals_1.expect)(minimalOptions.coverage).toBeUndefined();
        });
    });
});
//# sourceMappingURL=types.test.js.map