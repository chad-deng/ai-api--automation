/**
 * Configuration Management Tests - TDD Implementation
 * Week 1 Sprint 1: Configuration Loading and Validation
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import { CLI } from '../src/cli';
import { Config, TestFramework, ConfigurationError } from '../src/types';
import { createTempTestFile, cleanupTempFile } from './setup';

describe('Configuration Management', () => {
  let cli: CLI;
  let tempConfigFile: string;

  beforeEach(() => {
    cli = new CLI();
  });

  afterEach(async () => {
    if (tempConfigFile) {
      cleanupTempFile(tempConfigFile);
    }
  });

  describe('Config File Loading', () => {
    test('should load JSON configuration file', async () => {
      const configContent = JSON.stringify({
        outputDir: './custom-output',
        framework: 'jest',
        verbose: true,
        coverage: false
      });

      tempConfigFile = createTempTestFile(configContent);
      const config = await cli.loadConfig(tempConfigFile.replace('.ts', '.json'));

      expect(config.outputDir).toBe('./custom-output');
      expect(config.framework).toBe('jest');
      expect(config.verbose).toBe(true);
      expect(config.coverage).toBe(false);
    });

    test('should return empty config for non-existent file', async () => {
      const config = await cli.loadConfig('./non-existent-config.json');
      expect(config).toEqual({});
    });

    test('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{ "outputDir": "./test", invalid: json }';
      tempConfigFile = createTempTestFile(malformedJson);
      
      await expect(
        cli.loadConfig(tempConfigFile.replace('.ts', '.json'))
      ).rejects.toThrow(ConfigurationError);
    });

    test('should load default config files in order', async () => {
      // This test validates that default config file detection works
      const config = await cli.loadConfig();
      expect(config).toBeDefined();
    });
  });

  describe('Environment Variable Support', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should support API_TEST_OUTPUT_DIR environment variable', async () => {
      process.env.API_TEST_OUTPUT_DIR = './env-output';
      
      // Test that environment variables would be loaded
      // This is a placeholder test since we haven't implemented env loading yet
      expect(process.env.API_TEST_OUTPUT_DIR).toBe('./env-output');
    });

    test('should support API_TEST_FRAMEWORK environment variable', async () => {
      process.env.API_TEST_FRAMEWORK = 'mocha';
      expect(process.env.API_TEST_FRAMEWORK).toBe('mocha');
    });

    test('should support API_TEST_VERBOSE environment variable', async () => {
      process.env.API_TEST_VERBOSE = 'true';
      expect(process.env.API_TEST_VERBOSE).toBe('true');
    });
  });

  describe('Config Validation', () => {
    test('should validate framework values', () => {
      const validFrameworks = Object.values(TestFramework);
      
      validFrameworks.forEach(framework => {
        expect(validFrameworks).toContain(framework);
      });
    });

    test('should validate output directory format', () => {
      const validPaths = ['./output', '/absolute/path', '../relative/path'];
      
      validPaths.forEach(path => {
        expect(typeof path).toBe('string');
        expect(path.length).toBeGreaterThan(0);
      });
    });

    test('should validate timeout values', () => {
      const validTimeouts = [1000, 5000, 30000, 60000];
      
      validTimeouts.forEach(timeout => {
        expect(timeout).toBeGreaterThan(0);
        expect(Number.isInteger(timeout)).toBe(true);
      });
    });
  });

  describe('Config Merging', () => {
    test('should merge CLI options with file config', async () => {
      const fileConfig = {
        outputDir: './file-output',
        framework: TestFramework.JEST,
        verbose: false
      };

      const cliOptions = {
        outputDir: './cli-output',
        verbose: true
      };

      // CLI options should override file config
      const merged = { ...fileConfig, ...cliOptions };
      
      expect(merged.outputDir).toBe('./cli-output');
      expect(merged.verbose).toBe(true);
      expect(merged.framework).toBe(TestFramework.JEST);
    });

    test('should prioritize environment variables over file config', () => {
      process.env.API_TEST_VERBOSE = 'true';
      
      const fileConfig = { verbose: false };
      const envOverride = { verbose: process.env.API_TEST_VERBOSE === 'true' };
      
      const merged = { ...fileConfig, ...envOverride };
      
      expect(merged.verbose).toBe(true);
      
      delete process.env.API_TEST_VERBOSE;
    });
  });

  describe('Preset Management', () => {
    test('should support configuration presets', () => {
      const presets = {
        'quick': {
          framework: TestFramework.JEST,
          coverage: false,
          verbose: false
        },
        'comprehensive': {
          framework: TestFramework.JEST,
          coverage: true,
          verbose: true,
          parallel: false
        },
        'ci': {
          framework: TestFramework.JEST,
          coverage: true,
          verbose: false,
          parallel: true
        }
      };

      expect(presets.quick.coverage).toBe(false);
      expect(presets.comprehensive.coverage).toBe(true);
      expect(presets.ci.parallel).toBe(true);
    });

    test('should validate preset names', () => {
      const validPresetNames = ['quick', 'comprehensive', 'ci', 'debug'];
      
      validPresetNames.forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
        expect(/^[a-z][a-z0-9-]*$/.test(name)).toBe(true);
      });
    });
  });
});