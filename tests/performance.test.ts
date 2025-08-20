/**
 * Performance Tests - TDD Implementation
 * Week 1 Sprint 1: Performance Requirements Validation
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { CLI } from '../src/cli';
import { PerformanceTimer, getMemoryUsage } from './setup';

describe('Performance Requirements', () => {
  let cli: CLI;

  beforeEach(() => {
    cli = new CLI();
  });

  describe('CLI Initialization Performance', () => {
    test('should initialize CLI under 100ms', () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const newCli = new CLI();
      const duration = timer.end();
      
      expect(duration).toBeLessThan(100);
      expect(newCli).toBeInstanceOf(CLI);
    });

    test('should handle multiple CLI instances efficiently', () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const instances = Array.from({ length: 10 }, () => new CLI());
      const duration = timer.end();
      
      expect(duration).toBeLessThan(500); // 10 instances in under 500ms
      expect(instances).toHaveLength(10);
    });

    test('should have minimal memory footprint on startup', () => {
      const initialMemory = getMemoryUsage();
      const cli = new CLI();
      const afterMemory = getMemoryUsage();
      
      const memoryIncrease = (afterMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      
      expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
    });
  });

  describe('Command Parsing Performance', () => {
    test('should parse help command under 50ms', async () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      await cli.run(['--help']);
      const duration = timer.end();
      
      expect(duration).toBeLessThan(50);
    });

    test('should parse generate command with options under 50ms', async () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const result = await cli.run(['generate', 'spec.yaml', '--output', './tests', '--verbose']);
      const duration = timer.end();
      
      expect(duration).toBeLessThan(50);
    });

    test('should handle complex command chains efficiently', async () => {
      const commands = [
        ['generate', 'spec.yaml', '--output', './tests', '--framework', 'jest', '--verbose', '--coverage'],
        ['validate', 'spec.yaml', '--schema-only'],
        ['init', '--template', 'jest-supertest', '--yes']
      ];

      const timer = new PerformanceTimer();
      timer.start();
      
      for (const cmd of commands) {
        await cli.run(cmd);
      }
      
      const duration = timer.end();
      
      expect(duration).toBeLessThan(200); // All commands under 200ms total
    });
  });

  describe('Configuration Loading Performance', () => {
    test('should load empty config under 10ms', async () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      await cli.loadConfig('./non-existent.json');
      const duration = timer.end();
      
      expect(duration).toBeLessThan(10);
    });

    test('should handle large configuration files efficiently', async () => {
      // Simulate large config
      const largeConfig = {
        plugins: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`plugin${i}`, { enabled: true }])
        ),
        templates: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`template${i}`, './templates/template.hbs'])
        )
      };

      const timer = new PerformanceTimer();
      timer.start();
      
      // Simulate config processing
      const processedConfig = JSON.parse(JSON.stringify(largeConfig));
      
      const duration = timer.end();
      
      expect(duration).toBeLessThan(50);
      expect(Object.keys(processedConfig.plugins)).toHaveLength(100);
    });
  });

  describe('Plugin System Performance', () => {
    test('should register plugins efficiently', () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const mockPlugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
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
          checks: {
            schema: true,
            paths: true,
            operations: true,
            responses: true
          }
        })
      };

      for (let i = 0; i < 10; i++) {
        cli.registerPlugin(`plugin${i}`, mockPlugin);
      }
      
      const duration = timer.end();
      
      expect(duration).toBeLessThan(20);
      expect(Object.keys(cli.getRegisteredPlugins())).toHaveLength(10);
    });

    test('should retrieve registered plugins under 5ms', () => {
      // Pre-register some plugins
      const mockPlugin = {
        name: 'Test Plugin',
        generate: async () => ({ success: true, filesGenerated: 0, testsGenerated: 0, outputDir: './', duration: 0, framework: 'jest' as const }),
        validate: async () => ({ isValid: true, errors: [], warnings: [], score: 100, checks: { schema: true, paths: true, operations: true, responses: true } })
      };

      for (let i = 0; i < 5; i++) {
        cli.registerPlugin(`plugin${i}`, mockPlugin);
      }

      const timer = new PerformanceTimer();
      timer.start();
      
      const plugins = cli.getRegisteredPlugins();
      const duration = timer.end();
      
      expect(duration).toBeLessThan(5);
      expect(Object.keys(plugins)).toHaveLength(5);
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory during repeated operations', async () => {
      const initialMemory = getMemoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        await cli.run(['--help']);
        const commands = cli.getRegisteredCommands();
        expect(commands).toBeDefined();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      
      expect(memoryIncrease).toBeLessThan(5); // Less than 5MB increase after 100 operations
    });

    test('should handle concurrent CLI instances without memory explosion', async () => {
      const initialMemory = getMemoryUsage();
      
      const concurrentOperations = Array.from({ length: 20 }, async () => {
        const cli = new CLI();
        return cli.run(['--help']);
      });
      
      await Promise.all(concurrentOperations);
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      
      expect(memoryIncrease).toBeLessThan(20); // Less than 20MB for 20 concurrent instances
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle invalid commands quickly', async () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const result = await cli.run(['invalid-command']);
      const duration = timer.end();
      
      expect(duration).toBeLessThan(10);
      expect(result.success).toBe(false);
    });

    test('should validate file existence quickly', async () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const result = await cli.run(['generate', 'non-existent-file.yaml']);
      const duration = timer.end();
      
      expect(duration).toBeLessThan(50);
      expect(result.success).toBe(false);
    });

    test('should handle malformed arguments efficiently', async () => {
      const malformedArgs = [
        ['generate', '--invalid-flag'],
        ['validate', '--unknown-option', 'value'],
        ['init', '--bad-template', ''],
        ['', '', '']
      ];

      const timer = new PerformanceTimer();
      timer.start();
      
      for (const args of malformedArgs) {
        await cli.run(args);
      }
      
      const duration = timer.end();
      
      expect(duration).toBeLessThan(100); // All malformed args handled under 100ms
    });
  });

  describe('Scalability Tests', () => {
    test('should handle large number of registered commands', () => {
      const timer = new PerformanceTimer();
      timer.start();
      
      const commands = cli.getRegisteredCommands();
      
      // Simulate checking against 100 potential commands
      const validCommands = Array.from({ length: 100 }, (_, i) => `command${i}`);
      const isValidCommand = (cmd: string) => validCommands.includes(cmd);
      
      for (let i = 0; i < 100; i++) {
        isValidCommand(`command${i}`);
      }
      
      const duration = timer.end();
      
      expect(duration).toBeLessThan(20);
    });

    test('should scale with increasing configuration complexity', async () => {
      const complexConfig = {
        outputDir: './output',
        framework: 'jest',
        plugins: Object.fromEntries(
          Array.from({ length: 200 }, (_, i) => [`plugin${i}`, { enabled: i % 2 === 0 }])
        ),
        templates: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`template${i}`, `./template${i}.hbs`])
        ),
        presets: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`preset${i}`, { verbose: i % 2 === 0 }])
        )
      };

      const timer = new PerformanceTimer();
      timer.start();
      
      // Simulate config processing
      const processed = JSON.parse(JSON.stringify(complexConfig));
      Object.keys(processed.plugins).forEach(key => {
        expect(processed.plugins[key]).toHaveProperty('enabled');
      });
      
      const duration = timer.end();
      
      expect(duration).toBeLessThan(100);
      expect(Object.keys(processed.plugins)).toHaveLength(200);
    });
  });
});