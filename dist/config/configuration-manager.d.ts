/**
 * Configuration Management System (US-022)
 * Manages configuration files, environment overrides, and runtime settings
 */
import { EventEmitter } from 'events';
export interface APITestConfig {
    generation: {
        framework: 'jest' | 'mocha' | 'vitest';
        outputDir: string;
        includeTypes: boolean;
        generateMocks: boolean;
        includeExamples: boolean;
        strictMode: boolean;
        asyncMode: boolean;
        maxConcurrency: number;
    };
    quality: {
        enableLinting: boolean;
        enableFormatting: boolean;
        enableTypeChecking: boolean;
        eslintConfig?: string;
        prettierConfig?: string;
        tsConfigPath?: string;
        strictValidation: boolean;
        autoFix: boolean;
    };
    performance: {
        enableOptimization: boolean;
        enableCaching: boolean;
        maxWorkers: number;
        batchSize: number;
        memoryThreshold: number;
        enableStreaming: boolean;
        chunkSize: number;
        timeoutMs: number;
    };
    auth: {
        defaultType: 'none' | 'bearer' | 'apikey' | 'oauth2' | 'basic' | 'custom';
        bearerToken?: string;
        apiKey?: {
            key: string;
            location: 'header' | 'query' | 'cookie';
            name: string;
        };
        oauth2?: {
            clientId: string;
            clientSecret?: string;
            tokenUrl: string;
            scope?: string[];
        };
        basic?: {
            username: string;
            password: string;
        };
        customHeaders?: Record<string, string>;
        requestInterceptor?: string;
    };
    watch: {
        enabled: boolean;
        watchPaths: string[];
        ignorePatterns: string[];
        debounceMs: number;
        incremental: boolean;
        notifyOnChange: boolean;
    };
    errorHandling: {
        enableRecovery: boolean;
        maxRetries: number;
        retryDelay: number;
        enableReporting: boolean;
        reportingUrl?: string;
        logLevel: 'debug' | 'info' | 'warn' | 'error';
        enableMetrics: boolean;
    };
    cli: {
        verboseOutput: boolean;
        colorOutput: boolean;
        progressIndicators: boolean;
        confirmActions: boolean;
        defaultCommand: string;
    };
    integration: {
        ci: boolean;
        githubActions: boolean;
        dockerized: boolean;
        notifications: {
            slack?: {
                webhookUrl: string;
                channel: string;
            };
            email?: {
                smtp: string;
                from: string;
                to: string[];
            };
        };
    };
}
export interface ConfigurationOptions {
    configPath?: string;
    environmentPrefix?: string;
    allowOverrides?: boolean;
    validateConfig?: boolean;
    autoSave?: boolean;
    watchConfig?: boolean;
}
export declare class ConfigurationManager extends EventEmitter {
    private config;
    private configPath;
    private options;
    private configWatcher?;
    private environmentPrefix;
    constructor(options?: ConfigurationOptions);
    /**
     * Initialize configuration manager
     */
    initialize(): Promise<void>;
    /**
     * Load configuration from file
     */
    loadConfig(): Promise<void>;
    /**
     * Save configuration to file
     */
    saveConfig(): Promise<void>;
    /**
     * Get configuration value by path
     */
    get<T = any>(keyPath: string): T | undefined;
    /**
     * Set configuration value by path
     */
    set(keyPath: string, value: any): Promise<void>;
    /**
     * Update multiple configuration values
     */
    update(updates: Partial<APITestConfig>): Promise<void>;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): Promise<void>;
    /**
     * Apply environment variable overrides
     */
    private applyEnvironmentOverrides;
    /**
     * Convert environment string values to appropriate types
     */
    private convertEnvironmentValue;
    /**
     * Validate configuration structure and values
     */
    private validateConfig;
    /**
     * Setup configuration file watcher
     */
    private setupConfigWatcher;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Get default configuration file path
     */
    private getDefaultConfigPath;
    /**
     * Deep merge two configuration objects
     */
    private mergeConfigs;
    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue;
    /**
     * Set nested value in object using dot notation
     */
    private setNestedValue;
    /**
     * Check if file exists
     */
    private fileExists;
    /**
     * Get current configuration
     */
    getConfig(): APITestConfig;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
    /**
     * Export configuration to file
     */
    exportConfig(filePath: string): Promise<void>;
    /**
     * Import configuration from file
     */
    importConfig(filePath: string): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    /**
     * Generate configuration schema
     */
    generateSchema(): any;
}
//# sourceMappingURL=configuration-manager.d.ts.map