/**
 * Plugin System Tests - TDD Implementation
 * Week 1 Sprint 1: Plugin Architecture Validation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { CLI } from '../src/cli';
import { Plugin, GenerationOptions, GenerationResult, ValidationResult, TestFramework } from '../src/types';

describe('Plugin System', () => {
  let cli: CLI;
  let mockPlugin: Plugin;

  beforeEach(() => {
    cli = new CLI();
    mockPlugin = createMockPlugin();
  });

  describe('Plugin Registration', () => {
    test('should register valid plugin successfully', () => {
      expect(() => {
        cli.registerPlugin('test-plugin', mockPlugin);
      }).not.toThrow();

      const plugins = cli.getRegisteredPlugins();
      expect(plugins).toHaveProperty('test-plugin');
    });

    test('should reject plugin without required methods', () => {
      const invalidPlugin = {
        name: 'Invalid Plugin',
        version: '1.0.0'
        // Missing generate and validate methods
      };

      expect(() => {
        cli.registerPlugin('invalid-plugin', invalidPlugin);
      }).toThrow('Invalid plugin interface');
    });

    test('should reject plugin without name', () => {
      const pluginWithoutName = {
        version: '1.0.0',
        generate: jest.fn(),
        validate: jest.fn()
      };

      expect(() => {
        cli.registerPlugin('nameless-plugin', pluginWithoutName);
      }).toThrow('Invalid plugin interface');
    });

    test('should allow multiple plugin registrations', () => {
      const plugin1 = createMockPlugin('Plugin 1');
      const plugin2 = createMockPlugin('Plugin 2');
      const plugin3 = createMockPlugin('Plugin 3');

      cli.registerPlugin('plugin1', plugin1);
      cli.registerPlugin('plugin2', plugin2);
      cli.registerPlugin('plugin3', plugin3);

      const plugins = cli.getRegisteredPlugins();
      expect(Object.keys(plugins)).toHaveLength(3);
      expect(plugins.plugin1.name).toBe('Plugin 1');
      expect(plugins.plugin2.name).toBe('Plugin 2');
      expect(plugins.plugin3.name).toBe('Plugin 3');
    });

    test('should handle plugin name conflicts', () => {
      const plugin1 = createMockPlugin('First Plugin');
      const plugin2 = createMockPlugin('Second Plugin');

      cli.registerPlugin('duplicate-name', plugin1);
      cli.registerPlugin('duplicate-name', plugin2); // Should overwrite

      const plugins = cli.getRegisteredPlugins();
      expect(plugins['duplicate-name'].name).toBe('Second Plugin');
    });
  });

  describe('Plugin Interface Validation', () => {
    test('should validate plugin has generate method', () => {
      const pluginWithoutGenerate = {
        name: 'Test Plugin',
        version: '1.0.0',
        validate: jest.fn()
        // Missing generate method
      };

      expect(() => {
        cli.registerPlugin('no-generate', pluginWithoutGenerate);
      }).toThrow('Invalid plugin interface');
    });

    test('should validate plugin has validate method', () => {
      const pluginWithoutValidate = {
        name: 'Test Plugin',
        version: '1.0.0',
        generate: jest.fn()
        // Missing validate method
      };

      expect(() => {
        cli.registerPlugin('no-validate', pluginWithoutValidate);
      }).toThrow('Invalid plugin interface');
    });

    test('should accept plugin with optional methods', () => {
      const pluginWithOptionalMethods: Plugin = {
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

      expect(() => {
        cli.registerPlugin('complete-plugin', pluginWithOptionalMethods);
      }).not.toThrow();

      const plugins = cli.getRegisteredPlugins();
      expect(plugins['complete-plugin']).toHaveProperty('beforeGenerate');
      expect(plugins['complete-plugin']).toHaveProperty('afterGenerate');
      expect(plugins['complete-plugin']).toHaveProperty('configure');
    });
  });

  describe('Plugin Method Contracts', () => {
    test('should call plugin generate method with correct parameters', async () => {
      const generateSpy = jest.spyOn(mockPlugin, 'generate');
      cli.registerPlugin('test-plugin', mockPlugin);

      const options: GenerationOptions = {
        specPath: './test.yaml',
        outputDir: './output',
        framework: TestFramework.JEST,
        verbose: true
      };

      await mockPlugin.generate(options);

      expect(generateSpy).toHaveBeenCalledWith(options);
    });

    test('should call plugin validate method with spec parameter', async () => {
      const validateSpy = jest.spyOn(mockPlugin, 'validate');
      cli.registerPlugin('test-plugin', mockPlugin);

      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      };

      await mockPlugin.validate(spec);

      expect(validateSpy).toHaveBeenCalledWith(spec);
    });

    test('should handle plugin method rejections gracefully', async () => {
      const failingPlugin: Plugin = {
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

      await expect(failingPlugin.generate({
        specPath: './test.yaml',
        outputDir: './output'
      })).rejects.toThrow('Generate failed');

      await expect(failingPlugin.validate({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      })).rejects.toThrow('Validate failed');
    });
  });

  describe('Plugin Lifecycle Hooks', () => {
    test('should call beforeGenerate hook if provided', async () => {
      let beforeGenerateCalled = false;
      const pluginWithHooks: Plugin = {
        ...mockPlugin,
        beforeGenerate: async (options) => {
          beforeGenerateCalled = true;
          expect(options.specPath).toBeDefined();
        }
      };

      cli.registerPlugin('hooks-plugin', pluginWithHooks);

      const options: GenerationOptions = {
        specPath: './test.yaml',
        outputDir: './output'
      };

      if (pluginWithHooks.beforeGenerate) {
        await pluginWithHooks.beforeGenerate(options);
      }

      expect(beforeGenerateCalled).toBe(true);
    });

    test('should call afterGenerate hook if provided', async () => {
      let afterGenerateCalled = false;
      const pluginWithHooks: Plugin = {
        ...mockPlugin,
        afterGenerate: async (result) => {
          afterGenerateCalled = true;
          expect(result.success).toBeDefined();
        }
      };

      cli.registerPlugin('hooks-plugin', pluginWithHooks);

      const result: GenerationResult = {
        success: true,
        filesGenerated: 5,
        testsGenerated: 10,
        outputDir: './output',
        duration: 100,
        framework: TestFramework.JEST
      };

      if (pluginWithHooks.afterGenerate) {
        await pluginWithHooks.afterGenerate(result);
      }

      expect(afterGenerateCalled).toBe(true);
    });

    test('should handle hook failures without breaking plugin', async () => {
      const pluginWithFailingHooks: Plugin = {
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
      expect(plugins['failing-hooks-plugin']).toBeDefined();

      // Core methods should still work
      const generateResult = await pluginWithFailingHooks.generate({
        specPath: './test.yaml',
        outputDir: './output'
      });
      expect(generateResult.success).toBe(true);
    });
  });

  describe('Plugin Configuration', () => {
    test('should call configure method if provided', () => {
      let configurationReceived = false;
      const configurablePlugin: Plugin = {
        ...mockPlugin,
        configure: (config) => {
          configurationReceived = true;
          expect(config).toHaveProperty('enabled');
          expect(config).toHaveProperty('options');
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

      expect(configurationReceived).toBe(true);
    });

    test('should handle plugin configuration updates', () => {
      let currentConfig: any = null;
      
      const configurablePlugin: Plugin = {
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
      expect(currentConfig.options.theme).toBe('light');

      // Update configuration
      if (configurablePlugin.configure) {
        configurablePlugin.configure({
          enabled: true,
          options: { theme: 'dark' }
        });
      }
      expect(currentConfig.options.theme).toBe('dark');
    });
  });

  describe('Plugin Discovery and Management', () => {
    test('should list all registered plugins', () => {
      const plugins = [
        createMockPlugin('Plugin A'),
        createMockPlugin('Plugin B'),
        createMockPlugin('Plugin C')
      ];

      plugins.forEach((plugin, index) => {
        cli.registerPlugin(`plugin-${index}`, plugin);
      });

      const registeredPlugins = cli.getRegisteredPlugins();
      
      expect(Object.keys(registeredPlugins)).toHaveLength(3);
      expect(registeredPlugins['plugin-0'].name).toBe('Plugin A');
      expect(registeredPlugins['plugin-1'].name).toBe('Plugin B');
      expect(registeredPlugins['plugin-2'].name).toBe('Plugin C');
    });

    test('should provide plugin metadata', () => {
      const pluginWithMetadata: Plugin = {
        name: 'Metadata Plugin',
        version: '2.1.3',
        description: 'A plugin with comprehensive metadata',
        generate: mockPlugin.generate,
        validate: mockPlugin.validate
      };

      cli.registerPlugin('metadata-plugin', pluginWithMetadata);
      
      const plugins = cli.getRegisteredPlugins();
      const plugin = plugins['metadata-plugin'];
      
      expect(plugin.name).toBe('Metadata Plugin');
      expect(plugin.version).toBe('2.1.3');
      expect(plugin.description).toBe('A plugin with comprehensive metadata');
    });

    test('should handle empty plugin registry', () => {
      const emptyCliInstance = new CLI();
      const plugins = emptyCliInstance.getRegisteredPlugins();
      
      expect(plugins).toEqual({});
      expect(Object.keys(plugins)).toHaveLength(0);
    });
  });
});

// Helper function to create mock plugins
function createMockPlugin(name: string = 'Test Plugin'): Plugin {
  return {
    name,
    version: '1.0.0',
    description: `Mock plugin: ${name}`,
    
    generate: jest.fn().mockImplementation(async (options: GenerationOptions): Promise<GenerationResult> => {
      return {
        success: true,
        filesGenerated: 3,
        testsGenerated: 15,
        outputDir: options.outputDir,
        duration: 150,
        framework: options.framework || TestFramework.JEST
      };
    }),
    
    validate: jest.fn().mockImplementation(async (spec): Promise<ValidationResult> => {
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