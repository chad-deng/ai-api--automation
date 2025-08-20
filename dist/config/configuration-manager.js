"use strict";
/**
 * Configuration Management System (US-022)
 * Manages configuration files, environment overrides, and runtime settings
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const events_1 = require("events");
class ConfigurationManager extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            configPath: options.configPath || this.getDefaultConfigPath(),
            environmentPrefix: options.environmentPrefix || 'API_TEST_GEN',
            allowOverrides: options.allowOverrides ?? true,
            validateConfig: options.validateConfig ?? true,
            autoSave: options.autoSave ?? false,
            watchConfig: options.watchConfig ?? false,
            ...options
        };
        this.configPath = this.options.configPath;
        this.environmentPrefix = this.options.environmentPrefix;
        this.config = this.getDefaultConfig();
    }
    /**
     * Initialize configuration manager
     */
    async initialize() {
        try {
            // Load configuration from file
            await this.loadConfig();
            // Apply environment overrides
            if (this.options.allowOverrides) {
                this.applyEnvironmentOverrides();
            }
            // Validate configuration
            if (this.options.validateConfig) {
                this.validateConfig();
            }
            // Setup config watching
            if (this.options.watchConfig) {
                this.setupConfigWatcher();
            }
            this.emit('initialized', this.config);
        }
        catch (error) {
            this.emit('error', `Failed to initialize configuration: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    /**
     * Load configuration from file
     */
    async loadConfig() {
        try {
            const configExists = await this.fileExists(this.configPath);
            if (configExists) {
                const configContent = await fs_1.promises.readFile(this.configPath, 'utf-8');
                const fileConfig = JSON.parse(configContent);
                // Merge with default configuration
                this.config = this.mergeConfigs(this.getDefaultConfig(), fileConfig);
                this.emit('configLoaded', { path: this.configPath, config: this.config });
            }
            else {
                // Create default configuration file
                await this.saveConfig();
                this.emit('configCreated', { path: this.configPath, config: this.config });
            }
        }
        catch (error) {
            this.emit('error', `Failed to load configuration: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    /**
     * Save configuration to file
     */
    async saveConfig() {
        try {
            const configDir = path_1.default.dirname(this.configPath);
            // Ensure config directory exists
            await fs_1.promises.mkdir(configDir, { recursive: true });
            // Save configuration
            const configContent = JSON.stringify(this.config, null, 2);
            await fs_1.promises.writeFile(this.configPath, configContent, 'utf-8');
            this.emit('configSaved', { path: this.configPath, config: this.config });
        }
        catch (error) {
            this.emit('error', `Failed to save configuration: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    /**
     * Get configuration value by path
     */
    get(keyPath) {
        return this.getNestedValue(this.config, keyPath);
    }
    /**
     * Set configuration value by path
     */
    async set(keyPath, value) {
        this.setNestedValue(this.config, keyPath, value);
        if (this.options.autoSave) {
            await this.saveConfig();
        }
        this.emit('configChanged', { keyPath, value, config: this.config });
    }
    /**
     * Update multiple configuration values
     */
    async update(updates) {
        this.config = this.mergeConfigs(this.config, updates);
        if (this.options.autoSave) {
            await this.saveConfig();
        }
        this.emit('configUpdated', { updates, config: this.config });
    }
    /**
     * Reset configuration to defaults
     */
    async resetToDefaults() {
        this.config = this.getDefaultConfig();
        if (this.options.autoSave) {
            await this.saveConfig();
        }
        this.emit('configReset', { config: this.config });
    }
    /**
     * Apply environment variable overrides
     */
    applyEnvironmentOverrides() {
        const envVars = process.env;
        const prefix = `${this.environmentPrefix}_`;
        const envOverrides = {};
        for (const [key, value] of Object.entries(envVars)) {
            if (key.startsWith(prefix)) {
                const configKey = key.substring(prefix.length).toLowerCase();
                const configPath = configKey.replace(/_/g, '.');
                // Convert string values to appropriate types
                const convertedValue = this.convertEnvironmentValue(value);
                this.setNestedValue(envOverrides, configPath, convertedValue);
            }
        }
        if (Object.keys(envOverrides).length > 0) {
            this.config = this.mergeConfigs(this.config, envOverrides);
            this.emit('environmentOverridesApplied', envOverrides);
        }
    }
    /**
     * Convert environment string values to appropriate types
     */
    convertEnvironmentValue(value) {
        // Boolean values
        if (value.toLowerCase() === 'true')
            return true;
        if (value.toLowerCase() === 'false')
            return false;
        // Number values
        if (/^\d+$/.test(value))
            return parseInt(value, 10);
        if (/^\d+\.\d+$/.test(value))
            return parseFloat(value);
        // JSON values
        if ((value.startsWith('{') && value.endsWith('}')) ||
            (value.startsWith('[') && value.endsWith(']'))) {
            try {
                return JSON.parse(value);
            }
            catch {
                // Return as string if JSON parsing fails
            }
        }
        // Array values (comma-separated)
        if (value.includes(',')) {
            return value.split(',').map(v => v.trim());
        }
        return value;
    }
    /**
     * Validate configuration structure and values
     */
    validateConfig() {
        const errors = [];
        // Validate required fields
        if (!this.config.generation?.outputDir) {
            errors.push('generation.outputDir is required');
        }
        if (!this.config.generation?.framework) {
            errors.push('generation.framework is required');
        }
        // Validate framework values
        const validFrameworks = ['jest', 'mocha', 'vitest'];
        if (!validFrameworks.includes(this.config.generation?.framework)) {
            errors.push(`generation.framework must be one of: ${validFrameworks.join(', ')}`);
        }
        // Validate auth settings
        if (this.config.auth?.oauth2 && !this.config.auth.oauth2.tokenUrl) {
            errors.push('auth.oauth2.tokenUrl is required when using OAuth2');
        }
        // Validate paths
        if (this.config.quality?.eslintConfig && !path_1.default.isAbsolute(this.config.quality.eslintConfig)) {
            this.config.quality.eslintConfig = path_1.default.resolve(process.cwd(), this.config.quality.eslintConfig);
        }
        if (errors.length > 0) {
            const error = new Error(`Configuration validation failed:\n${errors.join('\n')}`);
            this.emit('error', error.message);
            throw error;
        }
    }
    /**
     * Setup configuration file watcher
     */
    setupConfigWatcher() {
        const fs = require('fs');
        if (this.configWatcher) {
            this.configWatcher.close();
        }
        try {
            this.configWatcher = fs.watchFile(this.configPath, { interval: 1000 }, async () => {
                try {
                    await this.loadConfig();
                    if (this.options.allowOverrides) {
                        this.applyEnvironmentOverrides();
                    }
                    if (this.options.validateConfig) {
                        this.validateConfig();
                    }
                    this.emit('configReloaded', { path: this.configPath, config: this.config });
                }
                catch (error) {
                    this.emit('error', `Failed to reload configuration: ${error instanceof Error ? error.message : error}`);
                }
            });
        }
        catch (error) {
            this.emit('error', `Failed to setup config watcher: ${error instanceof Error ? error.message : error}`);
        }
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            generation: {
                framework: 'jest',
                outputDir: './generated-tests',
                includeTypes: true,
                generateMocks: true,
                includeExamples: true,
                strictMode: false,
                asyncMode: true,
                maxConcurrency: 4
            },
            quality: {
                enableLinting: true,
                enableFormatting: true,
                enableTypeChecking: true,
                strictValidation: false,
                autoFix: true
            },
            performance: {
                enableOptimization: true,
                enableCaching: true,
                maxWorkers: Math.min(os_1.default.cpus().length, 8),
                batchSize: 10,
                memoryThreshold: 512,
                enableStreaming: true,
                chunkSize: 50,
                timeoutMs: 30000
            },
            auth: {
                defaultType: 'none'
            },
            watch: {
                enabled: false,
                watchPaths: ['./api-specs/**/*.{yml,yaml,json}'],
                ignorePatterns: ['node_modules/**', 'dist/**', '.git/**'],
                debounceMs: 1000,
                incremental: true,
                notifyOnChange: true
            },
            errorHandling: {
                enableRecovery: true,
                maxRetries: 3,
                retryDelay: 1000,
                enableReporting: false,
                logLevel: 'error',
                enableMetrics: true
            },
            cli: {
                verboseOutput: false,
                colorOutput: true,
                progressIndicators: true,
                confirmActions: false,
                defaultCommand: 'generate'
            },
            integration: {
                ci: false,
                githubActions: false,
                dockerized: false,
                notifications: {}
            }
        };
    }
    /**
     * Get default configuration file path
     */
    getDefaultConfigPath() {
        // Try different locations in order of preference
        const locations = [
            path_1.default.join(process.cwd(), '.api-test-gen.json'),
            path_1.default.join(process.cwd(), 'api-test-gen.config.json'),
            path_1.default.join(os_1.default.homedir(), '.config', 'api-test-gen', 'config.json'),
            path_1.default.join(os_1.default.homedir(), '.api-test-gen.json')
        ];
        return locations[0]; // Use first location as default
    }
    /**
     * Deep merge two configuration objects
     */
    mergeConfigs(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.mergeConfigs(result[key] || {}, source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }
    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    /**
     * Set nested value in object using dot notation
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
    /**
     * Export configuration to file
     */
    async exportConfig(filePath) {
        const configContent = JSON.stringify(this.config, null, 2);
        await fs_1.promises.writeFile(filePath, configContent, 'utf-8');
        this.emit('configExported', { path: filePath, config: this.config });
    }
    /**
     * Import configuration from file
     */
    async importConfig(filePath) {
        try {
            const configContent = await fs_1.promises.readFile(filePath, 'utf-8');
            const importedConfig = JSON.parse(configContent);
            this.config = this.mergeConfigs(this.getDefaultConfig(), importedConfig);
            if (this.options.validateConfig) {
                this.validateConfig();
            }
            if (this.options.autoSave) {
                await this.saveConfig();
            }
            this.emit('configImported', { path: filePath, config: this.config });
        }
        catch (error) {
            this.emit('error', `Failed to import configuration: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.configWatcher) {
            const fs = require('fs');
            fs.unwatchFile(this.configPath);
            this.configWatcher = undefined;
        }
        this.removeAllListeners();
    }
    /**
     * Generate configuration schema
     */
    generateSchema() {
        return {
            type: 'object',
            properties: {
                generation: {
                    type: 'object',
                    properties: {
                        framework: { type: 'string', enum: ['jest', 'mocha', 'vitest'] },
                        outputDir: { type: 'string' },
                        includeTypes: { type: 'boolean' },
                        generateMocks: { type: 'boolean' },
                        includeExamples: { type: 'boolean' },
                        strictMode: { type: 'boolean' },
                        asyncMode: { type: 'boolean' },
                        maxConcurrency: { type: 'number', minimum: 1 }
                    },
                    required: ['framework', 'outputDir']
                },
                // Add other schema definitions...
            },
            required: ['generation']
        };
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=configuration-manager.js.map