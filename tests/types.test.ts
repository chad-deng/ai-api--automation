/**
 * Type Definitions Tests - TDD Implementation
 * Week 1 Sprint 1: Interface Validation
 */

import { describe, test, expect } from '@jest/globals';
import { 
  OpenAPISpec, 
  GenerationOptions, 
  GenerationResult,
  ValidationResult,
  CLICommand,
  Plugin,
  TestFramework
} from '../src/types';

describe('Core Type Definitions', () => {
  describe('OpenAPISpec Interface', () => {
    test('should have required OpenAPI 3.0 properties', () => {
      const validSpec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {}
      };

      expect(validSpec.openapi).toBe('3.0.0');
      expect(validSpec.info).toBeDefined();
      expect(validSpec.paths).toBeDefined();
    });

    test('should support optional server definitions', () => {
      const specWithServers: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        servers: [
          { url: 'https://api.example.com' }
        ]
      };

      expect(specWithServers.servers).toHaveLength(1);
      expect(specWithServers.servers![0].url).toBe('https://api.example.com');
    });

    test('should support components and security definitions', () => {
      const complexSpec: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {},
          securitySchemes: {}
        },
        security: []
      };

      expect(complexSpec.components).toBeDefined();
      expect(complexSpec.security).toBeDefined();
    });
  });

  describe('GenerationOptions Interface', () => {
    test('should have default values for optional properties', () => {
      const options: GenerationOptions = {
        specPath: './spec.yaml',
        outputDir: './tests'
      };

      expect(options.specPath).toBeDefined();
      expect(options.outputDir).toBeDefined();
    });

    test('should support all test framework options', () => {
      const jestOptions: GenerationOptions = {
        specPath: './spec.yaml',
        outputDir: './tests',
        framework: TestFramework.JEST,
        verbose: true,
        coverage: true
      };

      expect(jestOptions.framework).toBe(TestFramework.JEST);
    });

    test('should validate framework enum values', () => {
      const validFrameworks = Object.values(TestFramework);
      
      expect(validFrameworks).toContain(TestFramework.JEST);
      expect(validFrameworks).toContain(TestFramework.MOCHA);
      expect(validFrameworks).toContain(TestFramework.VITEST);
    });
  });

  describe('GenerationResult Interface', () => {
    test('should track generation success and metrics', () => {
      const result: GenerationResult = {
        success: true,
        filesGenerated: 5,
        testsGenerated: 25,
        outputDir: './tests',
        duration: 150,
        framework: TestFramework.JEST
      };

      expect(result.success).toBe(true);
      expect(result.filesGenerated).toBeGreaterThan(0);
      expect(result.testsGenerated).toBeGreaterThan(0);
    });

    test('should include error details on failure', () => {
      const failureResult: GenerationResult = {
        success: false,
        filesGenerated: 0,
        testsGenerated: 0,
        outputDir: './tests',
        duration: 50,
        framework: TestFramework.JEST,
        error: 'Invalid OpenAPI specification',
        details: ['Missing required paths section']
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBeDefined();
      expect(failureResult.details).toHaveLength(1);
    });
  });

  describe('ValidationResult Interface', () => {
    test('should provide comprehensive validation feedback', () => {
      const result: ValidationResult = {
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

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(90);
      expect(result.checks.schema).toBe(true);
    });

    test('should handle validation failures with detailed errors', () => {
      const failureResult: ValidationResult = {
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

      expect(failureResult.isValid).toBe(false);
      expect(failureResult.errors).toHaveLength(2);
      expect(failureResult.score).toBeLessThan(50);
    });
  });

  describe('CLICommand Interface', () => {
    test('should define command structure with options', () => {
      const generateCommand: CLICommand = {
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

      expect(generateCommand.name).toBe('generate');
      expect(generateCommand.options).toHaveLength(2);
      expect(generateCommand.action).toBeDefined();
    });
  });

  describe('Plugin Interface', () => {
    test('should define plugin contract with required methods', () => {
      const mockPlugin: Plugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin for validation',
        generate: async () => ({
          success: true,
          filesGenerated: 1,
          testsGenerated: 5,
          outputDir: './tests',
          duration: 100,
          framework: TestFramework.JEST
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

      expect(mockPlugin.name).toBeDefined();
      expect(mockPlugin.generate).toBeDefined();
      expect(mockPlugin.validate).toBeDefined();
    });

    test('should support optional plugin hooks', () => {
      const pluginWithHooks: Plugin = {
        name: 'Advanced Plugin',
        version: '1.0.0',
        description: 'Plugin with lifecycle hooks',
        generate: async () => ({
          success: true,
          filesGenerated: 0,
          testsGenerated: 0,
          outputDir: './',
          duration: 0,
          framework: TestFramework.JEST
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

      expect(pluginWithHooks.beforeGenerate).toBeDefined();
      expect(pluginWithHooks.afterGenerate).toBeDefined();
    });
  });

  describe('Type Safety Validation', () => {
    test('should enforce required properties at compile time', () => {
      // This test validates TypeScript compilation - if it compiles, types are correct
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Required Test',
          version: '1.0.0'
        },
        paths: {}
      };

      // TypeScript should enforce these properties exist
      expect(spec.openapi).toBeTruthy();
      expect(spec.info.title).toBeTruthy();
      expect(spec.info.version).toBeTruthy();
      expect(spec.paths).toBeDefined();
    });

    test('should allow optional properties to be undefined', () => {
      const minimalOptions: GenerationOptions = {
        specPath: './test.yaml',
        outputDir: './output'
        // All other properties should be optional
      };

      expect(minimalOptions.framework).toBeUndefined();
      expect(minimalOptions.verbose).toBeUndefined();
      expect(minimalOptions.coverage).toBeUndefined();
    });
  });
});