/**
 * CLI Framework Tests - TDD Implementation
 * Week 1 Sprint 1: Test-First Development
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { CLI } from '../src/cli';
import { PerformanceTimer } from './setup';

describe('CLI Framework', () => {
  let cli: CLI;
  let mockConsole: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    cli = new CLI();
    mockConsole = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    mockConsole.mockRestore();
  });

  describe('Command Registration', () => {
    test('should register generate command', () => {
      const commands = cli.getRegisteredCommands();
      expect(commands).toContain('generate');
    });

    test('should register validate command', () => {
      const commands = cli.getRegisteredCommands();
      expect(commands).toContain('validate');
    });

    test('should register init command', () => {
      const commands = cli.getRegisteredCommands();
      expect(commands).toContain('init');
    });

    test('should show help when no command provided', async () => {
      await cli.run([]);
      expect(mockConsole).toHaveBeenCalledWith(
        expect.stringContaining('Usage: api-test-gen <command>')
      );
    });
  });

  describe('Generate Command', () => {
    test('should require OpenAPI spec file parameter', async () => {
      const result = await cli.run(['generate']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAPI spec file is required');
    });

    test('should accept output directory parameter', async () => {
      const result = await cli.run(['generate', 'spec.yaml', '--output', './tests']);
      expect(result.outputDir).toBe('./tests');
    });

    test('should default output directory to current directory', async () => {
      const result = await cli.run(['generate', 'spec.yaml']);
      expect(result.outputDir).toBe('./');
    });

    test('should validate OpenAPI spec file exists', async () => {
      const result = await cli.run(['generate', 'nonexistent.yaml']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAPI spec file not found');
    });

    test('should support verbose mode', async () => {
      const result = await cli.run(['generate', 'spec.yaml', '--verbose']);
      expect(result.verbose).toBe(true);
    });

    test('should support framework selection', async () => {
      const result = await cli.run(['generate', 'spec.yaml', '--framework', 'jest']);
      expect(result.framework).toBe('jest');
    });
  });

  describe('Validate Command', () => {
    test('should validate OpenAPI specification', async () => {
      const result = await cli.run(['validate', 'spec.yaml']);
      expect(result.command).toBe('validate');
    });

    test('should return validation results', async () => {
      const result = await cli.run(['validate', 'spec.yaml']);
      expect(result).toHaveProperty('validationResults');
    });

    test('should support schema validation only', async () => {
      const result = await cli.run(['validate', 'spec.yaml', '--schema-only']);
      expect(result.schemaOnly).toBe(true);
    });
  });

  describe('Init Command', () => {
    test('should initialize project structure', async () => {
      const result = await cli.run(['init']);
      expect(result.command).toBe('init');
    });

    test('should support template selection', async () => {
      const result = await cli.run(['init', '--template', 'jest-supertest']);
      expect(result.template).toBe('jest-supertest');
    });

    test('should create default configuration', async () => {
      const result = await cli.run(['init']);
      expect(result.configCreated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid commands gracefully', async () => {
      const result = await cli.run(['invalid-command']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
    });

    test('should handle missing required parameters', async () => {
      const result = await cli.run(['generate']);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should provide helpful error messages', async () => {
      const result = await cli.run(['generate', 'nonexistent.yaml']);
      expect(result.error).toContain('not found');
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    test('should start CLI under 100ms', async () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const cli = new CLI();
      const duration = timer.end();
      
      expect(duration).toBeLessThan(100);
    });

    test('should parse commands under 50ms', async () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      await cli.run(['generate', '--help']);
      const duration = timer.end();
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Configuration Management', () => {
    test('should load configuration from file', () => {
      const config = cli.loadConfig('./api-test.config.js');
      expect(config).toBeDefined();
    });

    test('should merge CLI options with config file', async () => {
      const result = await cli.run(['generate', 'spec.yaml', '--config', './test.config.js']);
      expect(result.mergedConfig).toBeDefined();
    });

    test('should support environment variable overrides', () => {
      process.env.API_TEST_OUTPUT_DIR = './custom-output';
      const config = cli.loadConfig();
      expect(config.outputDir).toBe('./custom-output');
      delete process.env.API_TEST_OUTPUT_DIR;
    });
  });

  describe('Plugin System', () => {
    test('should support custom generators', async () => {
      cli.registerPlugin('custom-generator', {
        name: 'Custom Generator',
        generate: jest.fn()
      });
      
      const plugins = cli.getRegisteredPlugins();
      expect(plugins).toHaveProperty('custom-generator');
    });

    test('should validate plugin interfaces', () => {
      expect(() => {
        cli.registerPlugin('invalid', {});
      }).toThrow('Invalid plugin interface');
    });
  });
});

describe('CLI Integration Tests', () => {
  let cli: CLI;

  beforeEach(() => {
    cli = new CLI();
  });

  test('should handle complete generate workflow', async () => {
    // This will use the test fixtures from our existing test-fixtures directory
    const result = await cli.run([
      'generate',
      '../test-fixtures/simple/jsonplaceholder.yaml',
      '--output', './temp-tests',
      '--framework', 'jest',
      '--verbose'
    ]);

    expect(result.success).toBe(true);
    expect(result.filesGenerated).toBeGreaterThan(0);
    expect(result.outputDir).toBe('./temp-tests');
  });

  test('should validate against real OpenAPI specs', async () => {
    const result = await cli.run([
      'validate',
      '../test-fixtures/complex/stripe-subset.yaml'
    ]);

    expect(result.success).toBe(true);
    expect(result.validationResults.isValid).toBe(true);
  });

  test('should handle edge case specifications', async () => {
    const result = await cli.run([
      'validate',
      '../test-fixtures/edge-cases/circular-refs.yaml'
    ]);

    expect(result.success).toBe(true);
    expect(result.validationResults.warnings).toBeDefined();
  });
});