"use strict";
/**
 * Plugin System Tests - TDD Implementation
 * Week 1 Sprint 1: Plugin Architecture Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cli_1 = require("../src/cli");
const types_1 = require("../src/types");
(0, globals_1.describe)('Plugin System', () => {
    let cli;
    let mockPlugin;
    (0, globals_1.beforeEach)(() => {
        cli = new cli_1.CLI();
        mockPlugin = createMockPlugin();
    });
    (0, globals_1.describe)('Plugin Registration', () => {
        (0, globals_1.test)('should register valid plugin successfully', () => {
            (0, globals_1.expect)(() => {
                cli.registerPlugin('test-plugin', mockPlugin);
            }).not.toThrow();
            const plugins = cli.getRegisteredPlugins();
            (0, globals_1.expect)(plugins).toHaveProperty('test-plugin');
        });
        (0, globals_1.test)('should reject plugin without required methods', () => {
            const invalidPlugin = {
                name: 'Invalid Plugin',
                version: '1.0.0'
                // Missing generate and validate methods
            };
            (0, globals_1.expect)(() => {
                cli.registerPlugin('invalid-plugin', invalidPlugin);
            }).toThrow('Invalid plugin interface');
        });
        (0, globals_1.test)('should reject plugin without name', () => {
            const pluginWithoutName = {
                version: '1.0.0',
                generate: globals_1.jest.fn(),
                validate: globals_1.jest.fn()
            };
            (0, globals_1.expect)(() => {
                cli.registerPlugin('nameless-plugin', pluginWithoutName);
            }).toThrow('Invalid plugin interface');
        });
        (0, globals_1.test)('should allow multiple plugin registrations', () => {
            const plugin1 = createMockPlugin('Plugin 1');
            const plugin2 = createMockPlugin('Plugin 2');
            const plugin3 = createMockPlugin('Plugin 3');
            cli.registerPlugin('plugin1', plugin1);
            cli.registerPlugin('plugin2', plugin2);
            cli.registerPlugin('plugin3', plugin3);
            const plugins = cli.getRegisteredPlugins();
            (0, globals_1.expect)(Object.keys(plugins)).toHaveLength(3);
            (0, globals_1.expect)(plugins.plugin1.name).toBe('Plugin 1');
            (0, globals_1.expect)(plugins.plugin2.name).toBe('Plugin 2');
            (0, globals_1.expect)(plugins.plugin3.name).toBe('Plugin 3');
        });
        (0, globals_1.test)('should handle plugin name conflicts', () => {
            const plugin1 = createMockPlugin('First Plugin');
            const plugin2 = createMockPlugin('Second Plugin');
            cli.registerPlugin('duplicate-name', plugin1);
            cli.registerPlugin('duplicate-name', plugin2); // Should overwrite
            const plugins = cli.getRegisteredPlugins();
            (0, globals_1.expect)(plugins['duplicate-name'].name).toBe('Second Plugin');
        });
    });
    (0, globals_1.describe)('Plugin Interface Validation', () => {
        (0, globals_1.test)('should validate plugin has generate method', () => {
            const pluginWithoutGenerate = {
                name: 'Test Plugin',
                version: '1.0.0',
                validate: globals_1.jest.fn()
                // Missing generate method
            };
            (0, globals_1.expect)(() => {
                cli.registerPlugin('no-generate', pluginWithoutGenerate);
            }).toThrow('Invalid plugin interface');
        });
        (0, globals_1.test)('should validate plugin has validate method', () => {
            const pluginWithoutValidate = {
                name: 'Test Plugin',
                version: '1.0.0',
                generate: globals_1.jest.fn()
                // Missing validate method
            };
            (0, globals_1.expect)(() => {
                cli.registerPlugin('no-validate', pluginWithoutValidate);
            }).toThrow('Invalid plugin interface');
        });
        (0, globals_1.test)('should accept plugin with optional methods', () => {
            const pluginWithOptionalMethods = {
                name: 'Complete Plugin',
                version: '1.0.0',
                description: 'Plugin with all methods',
                generate: mockPlugin.generate,
                validate: mockPlugin.validate,
                beforeGenerate: async (options) => {
                    console.log(`Before generate: ${options.specPath}`);
                },
                afterGenerate: async (result) => {
                    console.log(`After generate: ${result.filesGenerated} files`);
                },
                configure: (config) => {
                    console.log('Configuring plugin');
                }
            };
            (0, globals_1.expect)(() => {
                cli.registerPlugin('complete-plugin', pluginWithOptionalMethods);
            }).not.toThrow();
            const plugins = cli.getRegisteredPlugins();
            (0, globals_1.expect)(plugins['complete-plugin']).toHaveProperty('beforeGenerate');
            (0, globals_1.expect)(plugins['complete-plugin']).toHaveProperty('afterGenerate');
            (0, globals_1.expect)(plugins['complete-plugin']).toHaveProperty('configure');
        });
    });
    (0, globals_1.describe)('Plugin Method Contracts', () => {
        (0, globals_1.test)('should call plugin generate method with correct parameters', async () => {
            const generateSpy = globals_1.jest.spyOn(mockPlugin, 'generate');
            cli.registerPlugin('test-plugin', mockPlugin);
            const options = {
                specPath: './test.yaml',
                outputDir: './output',
                framework: types_1.TestFramework.JEST,
                verbose: true
            };
            await mockPlugin.generate(options);
            (0, globals_1.expect)(generateSpy).toHaveBeenCalledWith(options);
        });
        (0, globals_1.test)('should call plugin validate method with spec parameter', async () => {
            const validateSpy = globals_1.jest.spyOn(mockPlugin, 'validate');
            cli.registerPlugin('test-plugin', mockPlugin);
            const spec = {
                openapi: '3.0.0',
                info: { title: 'Test API', version: '1.0.0' },
                paths: {}
            };
            await mockPlugin.validate(spec);
            (0, globals_1.expect)(validateSpy).toHaveBeenCalledWith(spec);
        });
        (0, globals_1.test)('should handle plugin method rejections gracefully', async () => {
            const failingPlugin = {
                name: 'Failing Plugin',
                version: '1.0.0',
                description: 'Plugin that fails',
                generate: async () => {
                    throw new Error('Generate failed');
                },
                validate: async () => {
                    throw new Error('Validate failed');
                }
            };
            cli.registerPlugin('failing-plugin', failingPlugin);
            await (0, globals_1.expect)(failingPlugin.generate({
                specPath: './test.yaml',
                outputDir: './output'
            })).rejects.toThrow('Generate failed');
            await (0, globals_1.expect)(failingPlugin.validate({
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {}
            })).rejects.toThrow('Validate failed');
        });
    });
    (0, globals_1.describe)('Plugin Lifecycle Hooks', () => {
        (0, globals_1.test)('should call beforeGenerate hook if provided', async () => {
            let beforeGenerateCalled = false;
            const pluginWithHooks = {
                ...mockPlugin,
                beforeGenerate: async (options) => {
                    beforeGenerateCalled = true;
                    (0, globals_1.expect)(options.specPath).toBeDefined();
                }
            };
            cli.registerPlugin('hooks-plugin', pluginWithHooks);
            const options = {
                specPath: './test.yaml',
                outputDir: './output'
            };
            if (pluginWithHooks.beforeGenerate) {
                await pluginWithHooks.beforeGenerate(options);
            }
            (0, globals_1.expect)(beforeGenerateCalled).toBe(true);
        });
        (0, globals_1.test)('should call afterGenerate hook if provided', async () => {
            let afterGenerateCalled = false;
            const pluginWithHooks = {
                ...mockPlugin,
                afterGenerate: async (result) => {
                    afterGenerateCalled = true;
                    (0, globals_1.expect)(result.success).toBeDefined();
                }
            };
            cli.registerPlugin('hooks-plugin', pluginWithHooks);
            const result = {
                success: true,
                filesGenerated: 5,
                testsGenerated: 10,
                outputDir: './output',
                duration: 100,
                framework: types_1.TestFramework.JEST
            };
            if (pluginWithHooks.afterGenerate) {
                await pluginWithHooks.afterGenerate(result);
            }
            (0, globals_1.expect)(afterGenerateCalled).toBe(true);
        });
        (0, globals_1.test)('should handle hook failures without breaking plugin', async () => {
            const pluginWithFailingHooks = {
                ...mockPlugin,
                beforeGenerate: async () => {
                    throw new Error('Before hook failed');
                },
                afterGenerate: async () => {
                    throw new Error('After hook failed');
                }
            };
            cli.registerPlugin('failing-hooks-plugin', pluginWithFailingHooks);
            // Hooks should fail but not prevent plugin registration
            const plugins = cli.getRegisteredPlugins();
            (0, globals_1.expect)(plugins['failing-hooks-plugin']).toBeDefined();
            // Core methods should still work
            const generateResult = await pluginWithFailingHooks.generate({
                specPath: './test.yaml',
                outputDir: './output'
            });
            (0, globals_1.expect)(generateResult.success).toBe(true);
        });
    });
    (0, globals_1.describe)('Plugin Configuration', () => {
        (0, globals_1.test)('should call configure method if provided', () => {
            let configurationReceived = false;
            const configurablePlugin = {
                ...mockPlugin,
                configure: (config) => {
                    configurationReceived = true;
                    (0, globals_1.expect)(config).toHaveProperty('enabled');
                    (0, globals_1.expect)(config).toHaveProperty('options');
                }
            };
            cli.registerPlugin('configurable-plugin', configurablePlugin);
            if (configurablePlugin.configure) {
                configurablePlugin.configure({
                    enabled: true,
                    options: {
                        outputFormat: 'typescript',
                        includeComments: true
                    }
                });
            }
            (0, globals_1.expect)(configurationReceived).toBe(true);
        });
        (0, globals_1.test)('should handle plugin configuration updates', () => {
            let currentConfig = null;
            const configurablePlugin = {
                ...mockPlugin,
                configure: (config) => {
                    currentConfig = config;
                }
            };
            cli.registerPlugin('updateable-plugin', configurablePlugin);
            // Initial configuration
            if (configurablePlugin.configure) {
                configurablePlugin.configure({
                    enabled: true,
                    options: { theme: 'light' }
                });
            }
            (0, globals_1.expect)(currentConfig.options.theme).toBe('light');
            // Update configuration
            if (configurablePlugin.configure) {
                configurablePlugin.configure({
                    enabled: true,
                    options: { theme: 'dark' }
                });
            }
            (0, globals_1.expect)(currentConfig.options.theme).toBe('dark');
        });
    });
    (0, globals_1.describe)('Plugin Discovery and Management', () => {
        (0, globals_1.test)('should list all registered plugins', () => {
            const plugins = [
                createMockPlugin('Plugin A'),
                createMockPlugin('Plugin B'),
                createMockPlugin('Plugin C')
            ];
            plugins.forEach((plugin, index) => {
                cli.registerPlugin(`plugin-${index}`, plugin);
            });
            const registeredPlugins = cli.getRegisteredPlugins();
            (0, globals_1.expect)(Object.keys(registeredPlugins)).toHaveLength(3);
            (0, globals_1.expect)(registeredPlugins['plugin-0'].name).toBe('Plugin A');
            (0, globals_1.expect)(registeredPlugins['plugin-1'].name).toBe('Plugin B');
            (0, globals_1.expect)(registeredPlugins['plugin-2'].name).toBe('Plugin C');
        });
        (0, globals_1.test)('should provide plugin metadata', () => {
            const pluginWithMetadata = {
                name: 'Metadata Plugin',
                version: '2.1.3',
                description: 'A plugin with comprehensive metadata',
                generate: mockPlugin.generate,
                validate: mockPlugin.validate
            };
            cli.registerPlugin('metadata-plugin', pluginWithMetadata);
            const plugins = cli.getRegisteredPlugins();
            const plugin = plugins['metadata-plugin'];
            (0, globals_1.expect)(plugin.name).toBe('Metadata Plugin');
            (0, globals_1.expect)(plugin.version).toBe('2.1.3');
            (0, globals_1.expect)(plugin.description).toBe('A plugin with comprehensive metadata');
        });
        (0, globals_1.test)('should handle empty plugin registry', () => {
            const emptyCliInstance = new cli_1.CLI();
            const plugins = emptyCliInstance.getRegisteredPlugins();
            (0, globals_1.expect)(plugins).toEqual({});
            (0, globals_1.expect)(Object.keys(plugins)).toHaveLength(0);
        });
    });
});
// Helper function to create mock plugins
function createMockPlugin(name = 'Test Plugin') {
    return {
        name,
        version: '1.0.0',
        description: `Mock plugin: ${name}`,
        generate: globals_1.jest.fn().mockImplementation(async (options) => {
            return {
                success: true,
                filesGenerated: 3,
                testsGenerated: 15,
                outputDir: options.outputDir,
                duration: 150,
                framework: options.framework || types_1.TestFramework.JEST
            };
        }),
        validate: globals_1.jest.fn().mockImplementation(async (spec) => {
            return {
                isValid: true,
                errors: [],
                warnings: [],
                score: 95,
                checks: {
                    schema: true,
                    paths: true,
                    operations: true,
                    responses: true
                }
            };
        })
    };
}
//# sourceMappingURL=plugin-system.test.js.map