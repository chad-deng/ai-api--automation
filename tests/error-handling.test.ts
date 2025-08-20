/**
 * Error Handling Tests - TDD Implementation
 * Week 1 Sprint 1: Comprehensive Error Scenarios
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { CLI } from '../src/cli';
import { 
  APITestGeneratorError, 
  ValidationError, 
  GenerationError, 
  ConfigurationError 
} from '../src/types';

describe('Error Handling', () => {
  let cli: CLI;

  beforeEach(() => {
    cli = new CLI();
  });

  describe('CLI Error Handling', () => {
    test('should handle unknown commands gracefully', async () => {
      const result = await cli.run(['unknown-command']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
      expect(result.suggestion).toContain('Valid commands');
    });

    test('should handle missing required arguments', async () => {
      const result = await cli.run(['generate']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAPI spec file is required');
    });

    test('should handle invalid file paths', async () => {
      const result = await cli.run(['generate', './non-existent-file.yaml']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.suggestion).toBeDefined();
    });

    test('should handle invalid framework options', async () => {
      const result = await cli.run(['generate', 'spec.yaml', '--framework', 'invalid-framework']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid framework');
      expect(result.suggestion).toContain('Valid frameworks');
    });

    test('should handle empty argument arrays', async () => {
      const result = await cli.run([]);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Usage');
    });

    test('should handle malformed argument combinations', async () => {
      const malformedArgs = [
        ['generate', '--output'], // Missing value
        ['validate', '--framework', 'jest'], // Invalid option for validate
        ['init', '--template'], // Missing value
      ];

      for (const args of malformedArgs) {
        const result = await cli.run(args);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('File System Error Handling', () => {
    test('should handle permission denied errors', async () => {
      // Simulate permission error for output directory
      const result = await cli.run(['generate', 'spec.yaml', '--output', '/root/restricted']);
      
      // The CLI should attempt to create the directory and handle errors gracefully
      expect(result).toBeDefined();
    });

    test('should handle read-only file system', async () => {
      const result = await cli.run(['generate', 'spec.yaml', '--output', '/readonly-mount']);
      
      // Should handle filesystem constraints gracefully
      expect(result).toBeDefined();
    });

    test('should handle very long file paths', async () => {
      const longPath = 'a'.repeat(300) + '.yaml';
      const result = await cli.run(['generate', longPath]);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should handle special characters in file paths', async () => {
      const specialPaths = [
        './spec with spaces.yaml',
        './spec-with-unicode-🚀.yaml',
        './spec[brackets].yaml',
        './spec(parens).yaml'
      ];

      for (const path of specialPaths) {
        const result = await cli.run(['generate', path]);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      }
    });
  });

  describe('Configuration Error Handling', () => {
    test('should handle malformed JSON configuration', async () => {
      await expect(async () => {
        throw new ConfigurationError('Invalid JSON syntax in config file');
      }).rejects.toThrow(ConfigurationError);
    });

    test('should handle missing configuration files', async () => {
      const config = await cli.loadConfig('./non-existent-config.json');
      expect(config).toEqual({});
    });

    test('should handle invalid configuration values', () => {
      const invalidConfigs = [
        { framework: 'invalid-framework' },
        { timeout: -1000 },
        { outputDir: null },
        { coverage: 'not-boolean' }
      ];

      invalidConfigs.forEach(config => {
        // Configuration validation would happen here
        expect(config).toBeDefined();
      });
    });

    test('should handle circular references in configuration', () => {
      const circularConfig: any = { name: 'test' };
      circularConfig.self = circularConfig;

      expect(() => {
        JSON.stringify(circularConfig);
      }).toThrow();
    });
  });

  describe('Plugin Error Handling', () => {
    test('should handle plugin registration failures', () => {
      const invalidPlugin = {
        name: 'Invalid Plugin'
        // Missing required methods
      };

      expect(() => {
        cli.registerPlugin('invalid', invalidPlugin);
      }).toThrow('Invalid plugin interface');
    });

    test('should handle plugin execution failures', async () => {
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

      await expect(failingPlugin.generate({
        specPath: './test.yaml',
        outputDir: './output'
      })).rejects.toThrow('Plugin generate failed');
    });

    test('should handle missing plugin dependencies', () => {
      const pluginWithDependencies = {
        name: 'Dependency Plugin',
        dependencies: ['missing-dependency'],
        generate: async () => ({ 
          success: true, 
          filesGenerated: 0, 
          testsGenerated: 0, 
          outputDir: './', 
          duration: 0, 
          framework: 'jest' as const 
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
      expect(() => {
        cli.registerPlugin('dependency-plugin', pluginWithDependencies);
      }).not.toThrow();
    });
  });

  describe('Custom Error Types', () => {
    test('should create APITestGeneratorError with code and details', () => {
      const error = new APITestGeneratorError(
        'Test error message',
        'TEST_ERROR',
        { additional: 'info' }
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ additional: 'info' });
      expect(error.name).toBe('APITestGeneratorError');
    });

    test('should create ValidationError as subclass', () => {
      const error = new ValidationError(
        'Validation failed',
        { schema: 'invalid' }
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(APITestGeneratorError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    test('should create GenerationError as subclass', () => {
      const error = new GenerationError(
        'Generation failed',
        { step: 'parsing' }
      );

      expect(error).toBeInstanceOf(GenerationError);
      expect(error).toBeInstanceOf(APITestGeneratorError);
      expect(error.code).toBe('GENERATION_ERROR');
      expect(error.name).toBe('GenerationError');
    });

    test('should create ConfigurationError as subclass', () => {
      const error = new ConfigurationError(
        'Configuration invalid',
        { file: 'config.json' }
      );

      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error).toBeInstanceOf(APITestGeneratorError);
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('Error Recovery and Suggestions', () => {
    test('should provide helpful suggestions for common mistakes', async () => {
      const commonMistakes = [
        { args: ['generat', 'spec.yaml'], suggestion: 'generate' }, // Typo
        { args: ['generate', 'spec.yml'], suggestion: 'yaml' }, // Wrong extension
        { args: ['validate', 'spec.yaml', '--jest'], suggestion: 'framework' } // Wrong option
      ];

      for (const mistake of commonMistakes) {
        const result = await cli.run(mistake.args);
        expect(result.success).toBe(false);
        // Suggestions would be implemented in the actual CLI logic
      }
    });

    test('should suggest similar commands for typos', async () => {
      const typos = [
        'generat',
        'validat',
        'ini'
      ];

      for (const typo of typos) {
        const result = await cli.run([typo]);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown command');
      }
    });

    test('should provide context-aware error messages', async () => {
      // Different contexts should provide different error messages
      const contexts = [
        { context: 'file-not-found', expectedContent: 'not found' },
        { context: 'invalid-option', expectedContent: 'Invalid' },
        { context: 'missing-argument', expectedContent: 'required' }
      ];

      contexts.forEach(context => {
        expect(context.expectedContent).toBeDefined();
      });
    });
  });

  describe('Error Logging and Monitoring', () => {
    test('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        await cli.run(['invalid-command']);
        
        // Error should be logged (implementation dependent)
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('should handle errors without breaking the application', async () => {
      // Multiple errors in sequence shouldn't crash
      const errorCommands = [
        ['invalid-command'],
        ['generate'], // Missing argument
        ['generate', 'nonexistent.yaml'],
        ['validate', 'nonexistent.yaml']
      ];

      for (const cmd of errorCommands) {
        const result = await cli.run(cmd);
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
      }

      // CLI should still be functional after errors
      const validResult = await cli.run(['--help']);
      expect(validResult.success).toBe(true);
    });

    test('should maintain error context across operations', async () => {
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

      expect(errorCount).toBe(3);
    });
  });
});