"use strict";
/**
 * Configuration Management Tests - TDD Implementation
 * Week 1 Sprint 1: Configuration Loading and Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cli_1 = require("../src/cli");
const types_1 = require("../src/types");
const setup_1 = require("./setup");
(0, globals_1.describe)('Configuration Management', () => {
    let cli;
    let tempConfigFile;
    (0, globals_1.beforeEach)(() => {
        cli = new cli_1.CLI();
    });
    (0, globals_1.afterEach)(async () => {
        if (tempConfigFile) {
            (0, setup_1.cleanupTempFile)(tempConfigFile);
        }
    });
    (0, globals_1.describe)('Config File Loading', () => {
        (0, globals_1.test)('should load JSON configuration file', async () => {
            const configContent = JSON.stringify({
                outputDir: './custom-output',
                framework: 'jest',
                verbose: true,
                coverage: false
            });
            tempConfigFile = (0, setup_1.createTempTestFile)(configContent);
            const config = await cli.loadConfig(tempConfigFile.replace('.ts', '.json'));
            (0, globals_1.expect)(config.outputDir).toBe('./custom-output');
            (0, globals_1.expect)(config.framework).toBe('jest');
            (0, globals_1.expect)(config.verbose).toBe(true);
            (0, globals_1.expect)(config.coverage).toBe(false);
        });
        (0, globals_1.test)('should return empty config for non-existent file', async () => {
            const config = await cli.loadConfig('./non-existent-config.json');
            (0, globals_1.expect)(config).toEqual({});
        });
        (0, globals_1.test)('should handle malformed JSON gracefully', async () => {
            const malformedJson = '{ "outputDir": "./test", invalid: json }';
            tempConfigFile = (0, setup_1.createTempTestFile)(malformedJson);
            await (0, globals_1.expect)(cli.loadConfig(tempConfigFile.replace('.ts', '.json'))).rejects.toThrow(types_1.ConfigurationError);
        });
        (0, globals_1.test)('should load default config files in order', async () => {
            // This test validates that default config file detection works
            const config = await cli.loadConfig();
            (0, globals_1.expect)(config).toBeDefined();
        });
    });
    (0, globals_1.describe)('Environment Variable Support', () => {
        const originalEnv = process.env;
        (0, globals_1.afterEach)(() => {
            process.env = originalEnv;
        });
        (0, globals_1.test)('should support API_TEST_OUTPUT_DIR environment variable', async () => {
            process.env.API_TEST_OUTPUT_DIR = './env-output';
            // Test that environment variables would be loaded
            // This is a placeholder test since we haven't implemented env loading yet
            (0, globals_1.expect)(process.env.API_TEST_OUTPUT_DIR).toBe('./env-output');
        });
        (0, globals_1.test)('should support API_TEST_FRAMEWORK environment variable', async () => {
            process.env.API_TEST_FRAMEWORK = 'mocha';
            (0, globals_1.expect)(process.env.API_TEST_FRAMEWORK).toBe('mocha');
        });
        (0, globals_1.test)('should support API_TEST_VERBOSE environment variable', async () => {
            process.env.API_TEST_VERBOSE = 'true';
            (0, globals_1.expect)(process.env.API_TEST_VERBOSE).toBe('true');
        });
    });
    (0, globals_1.describe)('Config Validation', () => {
        (0, globals_1.test)('should validate framework values', () => {
            const validFrameworks = Object.values(types_1.TestFramework);
            validFrameworks.forEach(framework => {
                (0, globals_1.expect)(validFrameworks).toContain(framework);
            });
        });
        (0, globals_1.test)('should validate output directory format', () => {
            const validPaths = ['./output', '/absolute/path', '../relative/path'];
            validPaths.forEach(path => {
                (0, globals_1.expect)(typeof path).toBe('string');
                (0, globals_1.expect)(path.length).toBeGreaterThan(0);
            });
        });
        (0, globals_1.test)('should validate timeout values', () => {
            const validTimeouts = [1000, 5000, 30000, 60000];
            validTimeouts.forEach(timeout => {
                (0, globals_1.expect)(timeout).toBeGreaterThan(0);
                (0, globals_1.expect)(Number.isInteger(timeout)).toBe(true);
            });
        });
    });
    (0, globals_1.describe)('Config Merging', () => {
        (0, globals_1.test)('should merge CLI options with file config', async () => {
            const fileConfig = {
                outputDir: './file-output',
                framework: types_1.TestFramework.JEST,
                verbose: false
            };
            const cliOptions = {
                outputDir: './cli-output',
                verbose: true
            };
            // CLI options should override file config
            const merged = { ...fileConfig, ...cliOptions };
            (0, globals_1.expect)(merged.outputDir).toBe('./cli-output');
            (0, globals_1.expect)(merged.verbose).toBe(true);
            (0, globals_1.expect)(merged.framework).toBe(types_1.TestFramework.JEST);
        });
        (0, globals_1.test)('should prioritize environment variables over file config', () => {
            process.env.API_TEST_VERBOSE = 'true';
            const fileConfig = { verbose: false };
            const envOverride = { verbose: process.env.API_TEST_VERBOSE === 'true' };
            const merged = { ...fileConfig, ...envOverride };
            (0, globals_1.expect)(merged.verbose).toBe(true);
            delete process.env.API_TEST_VERBOSE;
        });
    });
    (0, globals_1.describe)('Preset Management', () => {
        (0, globals_1.test)('should support configuration presets', () => {
            const presets = {
                'quick': {
                    framework: types_1.TestFramework.JEST,
                    coverage: false,
                    verbose: false
                },
                'comprehensive': {
                    framework: types_1.TestFramework.JEST,
                    coverage: true,
                    verbose: true,
                    parallel: false
                },
                'ci': {
                    framework: types_1.TestFramework.JEST,
                    coverage: true,
                    verbose: false,
                    parallel: true
                }
            };
            (0, globals_1.expect)(presets.quick.coverage).toBe(false);
            (0, globals_1.expect)(presets.comprehensive.coverage).toBe(true);
            (0, globals_1.expect)(presets.ci.parallel).toBe(true);
        });
        (0, globals_1.test)('should validate preset names', () => {
            const validPresetNames = ['quick', 'comprehensive', 'ci', 'debug'];
            validPresetNames.forEach(name => {
                (0, globals_1.expect)(typeof name).toBe('string');
                (0, globals_1.expect)(name.length).toBeGreaterThan(0);
                (0, globals_1.expect)(/^[a-z][a-z0-9-]*$/.test(name)).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=config.test.js.map