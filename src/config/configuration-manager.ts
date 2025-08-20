/**
 * Configuration Management System (US-022)
 * Manages configuration files, environment overrides, and runtime settings
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

export interface APITestConfig {
  // Generation settings
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

  // Quality settings
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

  // Performance settings
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

  // Authentication settings
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
    requestInterceptor?: string; // Path to custom request interceptor
  };

  // Watch mode settings
  watch: {
    enabled: boolean;
    watchPaths: string[];
    ignorePatterns: string[];
    debounceMs: number;
    incremental: boolean;
    notifyOnChange: boolean;
  };

  // Error handling settings
  errorHandling: {
    enableRecovery: boolean;
    maxRetries: number;
    retryDelay: number;
    enableReporting: boolean;
    reportingUrl?: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
  };

  // CLI settings
  cli: {
    verboseOutput: boolean;
    colorOutput: boolean;
    progressIndicators: boolean;
    confirmActions: boolean;
    defaultCommand: string;
  };

  // Integration settings
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

export class ConfigurationManager extends EventEmitter {
  private config: APITestConfig;
  private configPath: string;
  private options: ConfigurationOptions;
  private configWatcher?: any;
  private environmentPrefix: string;

  constructor(options: ConfigurationOptions = {}) {
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

    this.configPath = this.options.configPath!;
    this.environmentPrefix = this.options.environmentPrefix!;
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize configuration manager
   */
  async initialize(): Promise<void> {
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
    } catch (error) {
      this.emit('error', `Failed to initialize configuration: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<void> {
    try {
      const configExists = await this.fileExists(this.configPath);
      
      if (configExists) {
        const configContent = await fs.readFile(this.configPath, 'utf-8');
        const fileConfig = JSON.parse(configContent);
        
        // Merge with default configuration
        this.config = this.mergeConfigs(this.getDefaultConfig(), fileConfig);
        
        this.emit('configLoaded', { path: this.configPath, config: this.config });
      } else {
        // Create default configuration file
        await this.saveConfig();
        this.emit('configCreated', { path: this.configPath, config: this.config });
      }
    } catch (error) {
      this.emit('error', `Failed to load configuration: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      
      // Ensure config directory exists
      await fs.mkdir(configDir, { recursive: true });
      
      // Save configuration
      const configContent = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configPath, configContent, 'utf-8');
      
      this.emit('configSaved', { path: this.configPath, config: this.config });
    } catch (error) {
      this.emit('error', `Failed to save configuration: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Get configuration value by path
   */
  get<T = any>(keyPath: string): T | undefined {
    return this.getNestedValue(this.config, keyPath);
  }

  /**
   * Set configuration value by path
   */
  async set(keyPath: string, value: any): Promise<void> {
    this.setNestedValue(this.config, keyPath, value);
    
    if (this.options.autoSave) {
      await this.saveConfig();
    }
    
    this.emit('configChanged', { keyPath, value, config: this.config });
  }

  /**
   * Update multiple configuration values
   */
  async update(updates: Partial<APITestConfig>): Promise<void> {
    this.config = this.mergeConfigs(this.config, updates);
    
    if (this.options.autoSave) {
      await this.saveConfig();
    }
    
    this.emit('configUpdated', { updates, config: this.config });
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.config = this.getDefaultConfig();
    
    if (this.options.autoSave) {
      await this.saveConfig();
    }
    
    this.emit('configReset', { config: this.config });
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(): void {
    const envVars = process.env;
    const prefix = `${this.environmentPrefix}_`;
    
    const envOverrides: any = {};
    
    for (const [key, value] of Object.entries(envVars)) {
      if (key.startsWith(prefix)) {
        const configKey = key.substring(prefix.length).toLowerCase();
        const configPath = configKey.replace(/_/g, '.');
        
        // Convert string values to appropriate types
        const convertedValue = this.convertEnvironmentValue(value!);
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
  private convertEnvironmentValue(value: string): any {
    // Boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Number values
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // JSON values
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
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
  private validateConfig(): void {
    const errors: string[] = [];
    
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
    if (this.config.quality?.eslintConfig && !path.isAbsolute(this.config.quality.eslintConfig)) {
      this.config.quality.eslintConfig = path.resolve(process.cwd(), this.config.quality.eslintConfig);
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
  private setupConfigWatcher(): void {
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
        } catch (error) {
          this.emit('error', `Failed to reload configuration: ${error instanceof Error ? error.message : error}`);
        }
      });
    } catch (error) {
      this.emit('error', `Failed to setup config watcher: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): APITestConfig {
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
        maxWorkers: Math.min(os.cpus().length, 8),
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
  private getDefaultConfigPath(): string {
    // Try different locations in order of preference
    const locations = [
      path.join(process.cwd(), '.api-test-gen.json'),
      path.join(process.cwd(), 'api-test-gen.config.json'),
      path.join(os.homedir(), '.config', 'api-test-gen', 'config.json'),
      path.join(os.homedir(), '.api-test-gen.json')
    ];
    
    return locations[0]; // Use first location as default
  }

  /**
   * Deep merge two configuration objects
   */
  private mergeConfigs(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.mergeConfigs(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
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
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): APITestConfig {
    return { ...this.config };
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Export configuration to file
   */
  async exportConfig(filePath: string): Promise<void> {
    const configContent = JSON.stringify(this.config, null, 2);
    await fs.writeFile(filePath, configContent, 'utf-8');
    this.emit('configExported', { path: filePath, config: this.config });
  }

  /**
   * Import configuration from file
   */
  async importConfig(filePath: string): Promise<void> {
    try {
      const configContent = await fs.readFile(filePath, 'utf-8');
      const importedConfig = JSON.parse(configContent);
      
      this.config = this.mergeConfigs(this.getDefaultConfig(), importedConfig);
      
      if (this.options.validateConfig) {
        this.validateConfig();
      }
      
      if (this.options.autoSave) {
        await this.saveConfig();
      }
      
      this.emit('configImported', { path: filePath, config: this.config });
    } catch (error) {
      this.emit('error', `Failed to import configuration: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
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
  generateSchema(): any {
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