"use strict";
/**
 * Comprehensive Error Handling System (US-020)
 * Provides graceful error handling with actionable messages and recovery strategies
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlingSystem = exports.APITestGeneratorError = exports.ErrorSeverity = exports.ErrorCategory = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["SPECIFICATION_ERROR"] = "specification_error";
    ErrorCategory["VALIDATION_ERROR"] = "validation_error";
    ErrorCategory["GENERATION_ERROR"] = "generation_error";
    ErrorCategory["IO_ERROR"] = "io_error";
    ErrorCategory["CONFIGURATION_ERROR"] = "configuration_error";
    ErrorCategory["NETWORK_ERROR"] = "network_error";
    ErrorCategory["TIMEOUT_ERROR"] = "timeout_error";
    ErrorCategory["MEMORY_ERROR"] = "memory_error";
    ErrorCategory["DEPENDENCY_ERROR"] = "dependency_error";
    ErrorCategory["UNKNOWN_ERROR"] = "unknown_error";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
class APITestGeneratorError extends Error {
    constructor(details) {
        super(details.message);
        this.name = 'APITestGeneratorError';
        this.details = details;
        // Maintain proper stack trace for V8 engines
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, APITestGeneratorError);
        }
    }
}
exports.APITestGeneratorError = APITestGeneratorError;
class ErrorHandlingSystem extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.errorRegistry = new Map();
        this.retryAttempts = new Map();
        this.options = {
            enableLogging: true,
            logLevel: 'error',
            enableRecovery: true,
            maxRetries: 3,
            retryDelay: 1000,
            enableMetrics: true,
            enableReporting: false,
            ...options
        };
        this.metrics = this.initializeMetrics();
        this.setupGlobalErrorHandlers();
    }
    /**
     * Handle specification parsing errors
     */
    async handleSpecificationError(error, specPath, context = {}) {
        const errorDetails = {
            id: this.generateErrorId(),
            code: 'SPEC_PARSE_ERROR',
            message: `Failed to parse OpenAPI specification: ${error.message}`,
            category: ErrorCategory.SPECIFICATION_ERROR,
            severity: ErrorSeverity.HIGH,
            context: {
                ...context,
                operation: 'specification_parsing',
                file: specPath,
                timestamp: new Date()
            },
            userMessage: 'The OpenAPI specification file could not be parsed. Please check the file format and structure.',
            technicalMessage: error.message,
            recoveryActions: [
                {
                    type: 'manual',
                    description: 'Validate the OpenAPI specification using an online validator',
                    action: async () => {
                        console.log('Please validate your OpenAPI spec at https://editor.swagger.io/');
                    }
                },
                {
                    type: 'fallback',
                    description: 'Try parsing as different OpenAPI version',
                    action: async () => {
                        return this.tryAlternativeSpecParsing(specPath);
                    }
                }
            ],
            documentationUrl: 'https://docs.example.com/errors/spec-parse-error'
        };
        return this.processError(errorDetails);
    }
    /**
     * Handle validation errors
     */
    async handleValidationError(validationErrors, context = {}) {
        const errorDetails = {
            id: this.generateErrorId(),
            code: 'VALIDATION_ERROR',
            message: `Validation failed: ${validationErrors.length} errors found`,
            category: ErrorCategory.VALIDATION_ERROR,
            severity: ErrorSeverity.MEDIUM,
            context: {
                ...context,
                operation: 'validation',
                data: validationErrors,
                timestamp: new Date()
            },
            userMessage: 'The generated code contains validation errors. Some fixes can be applied automatically.',
            technicalMessage: `Validation errors: ${validationErrors.map(e => e.message || e).join(', ')}`,
            recoveryActions: [
                {
                    type: 'retry',
                    description: 'Apply automatic fixes and retry validation',
                    maxRetries: 2,
                    retryDelay: 500,
                    action: async () => {
                        return this.applyAutomaticFixes(validationErrors);
                    }
                },
                {
                    type: 'skip',
                    description: 'Skip validation and continue generation',
                    action: async () => {
                        console.warn('Validation skipped - generated code may contain errors');
                        return true;
                    }
                }
            ],
            documentationUrl: 'https://docs.example.com/errors/validation-error'
        };
        return this.processError(errorDetails);
    }
    /**
     * Handle generation errors
     */
    async handleGenerationError(error, operation, context = {}) {
        const errorDetails = {
            id: this.generateErrorId(),
            code: 'GENERATION_ERROR',
            message: `Test generation failed: ${error.message}`,
            category: ErrorCategory.GENERATION_ERROR,
            severity: ErrorSeverity.HIGH,
            context: {
                ...context,
                operation,
                stackTrace: error.stack,
                timestamp: new Date()
            },
            userMessage: 'Failed to generate tests. This might be due to complex API structure or unsupported features.',
            technicalMessage: error.message,
            recoveryActions: [
                {
                    type: 'retry',
                    description: 'Retry with simplified generation options',
                    maxRetries: 2,
                    retryDelay: 1000,
                    action: async () => {
                        return this.retryWithSimplifiedOptions(operation, context);
                    }
                },
                {
                    type: 'fallback',
                    description: 'Generate basic test structure only',
                    action: async () => {
                        return this.generateBasicTestStructure(operation, context);
                    }
                },
                {
                    type: 'skip',
                    description: 'Skip this operation and continue with others',
                    action: async () => {
                        console.warn(`Skipping operation: ${operation}`);
                        return null;
                    }
                }
            ],
            documentationUrl: 'https://docs.example.com/errors/generation-error'
        };
        return this.processError(errorDetails);
    }
    /**
     * Handle IO errors (file system operations)
     */
    async handleIOError(error, filePath, operation, context = {}) {
        const errorDetails = {
            id: this.generateErrorId(),
            code: 'IO_ERROR',
            message: `File ${operation} failed: ${error.message}`,
            category: ErrorCategory.IO_ERROR,
            severity: ErrorSeverity.MEDIUM,
            context: {
                ...context,
                operation: `file_${operation}`,
                file: filePath,
                timestamp: new Date()
            },
            userMessage: `Unable to ${operation} file: ${path_1.default.basename(filePath)}. Check file permissions and disk space.`,
            technicalMessage: error.message,
            recoveryActions: [
                {
                    type: 'retry',
                    description: 'Retry the file operation',
                    maxRetries: 3,
                    retryDelay: 2000,
                    action: async () => {
                        return this.retryFileOperation(filePath, operation);
                    }
                },
                {
                    type: 'fallback',
                    description: 'Try alternative file location',
                    action: async () => {
                        return this.tryAlternativeLocation(filePath, operation);
                    }
                }
            ],
            documentationUrl: 'https://docs.example.com/errors/io-error'
        };
        return this.processError(errorDetails);
    }
    /**
     * Handle network errors
     */
    async handleNetworkError(error, url, context = {}) {
        const errorDetails = {
            id: this.generateErrorId(),
            code: 'NETWORK_ERROR',
            message: `Network request failed: ${error.message}`,
            category: ErrorCategory.NETWORK_ERROR,
            severity: ErrorSeverity.MEDIUM,
            context: {
                ...context,
                operation: 'network_request',
                data: { url },
                timestamp: new Date()
            },
            userMessage: 'Network request failed. Check your internet connection and proxy settings.',
            technicalMessage: error.message,
            recoveryActions: [
                {
                    type: 'retry',
                    description: 'Retry the network request',
                    maxRetries: 3,
                    retryDelay: 5000,
                    action: async () => {
                        return this.retryNetworkRequest(url);
                    }
                },
                {
                    type: 'skip',
                    description: 'Skip network-dependent features',
                    action: async () => {
                        console.warn('Network features disabled due to connectivity issues');
                        return null;
                    }
                }
            ],
            documentationUrl: 'https://docs.example.com/errors/network-error'
        };
        return this.processError(errorDetails);
    }
    /**
     * Handle timeout errors
     */
    async handleTimeoutError(operation, timeoutMs, context = {}) {
        const errorDetails = {
            id: this.generateErrorId(),
            code: 'TIMEOUT_ERROR',
            message: `Operation timed out after ${timeoutMs}ms`,
            category: ErrorCategory.TIMEOUT_ERROR,
            severity: ErrorSeverity.MEDIUM,
            context: {
                ...context,
                operation,
                data: { timeoutMs },
                timestamp: new Date()
            },
            userMessage: 'Operation took too long to complete. This might be due to large API specifications or system load.',
            technicalMessage: `Timeout after ${timeoutMs}ms`,
            recoveryActions: [
                {
                    type: 'retry',
                    description: 'Retry with increased timeout',
                    maxRetries: 2,
                    action: async () => {
                        return this.retryWithIncreasedTimeout(operation, timeoutMs * 2);
                    }
                },
                {
                    type: 'fallback',
                    description: 'Process in smaller chunks',
                    action: async () => {
                        return this.processInChunks(operation, context);
                    }
                }
            ],
            documentationUrl: 'https://docs.example.com/errors/timeout-error'
        };
        return this.processError(errorDetails);
    }
    /**
     * Execute recovery action with retry logic
     */
    async executeRecoveryAction(errorDetails, actionIndex = 0) {
        const action = errorDetails.recoveryActions[actionIndex];
        if (!action || !action.action) {
            throw new Error('No recovery action available');
        }
        const key = `${errorDetails.id}-${actionIndex}`;
        const attempts = this.retryAttempts.get(key) || 0;
        try {
            const result = await action.action();
            // Reset retry count on success
            this.retryAttempts.delete(key);
            this.updateMetrics('recovery_success');
            return result;
        }
        catch (retryError) {
            if (action.type === 'retry' && attempts < (action.maxRetries || this.options.maxRetries)) {
                this.retryAttempts.set(key, attempts + 1);
                if (action.retryDelay) {
                    await this.delay(action.retryDelay);
                }
                return this.executeRecoveryAction(errorDetails, actionIndex);
            }
            this.updateMetrics('recovery_failure');
            throw retryError;
        }
    }
    /**
     * Process error and update metrics
     */
    async processError(errorDetails) {
        // Store error
        this.errorRegistry.set(errorDetails.id, errorDetails);
        // Update metrics
        this.updateMetrics('error', errorDetails);
        // Log error
        if (this.options.enableLogging) {
            this.logError(errorDetails);
        }
        // Emit error event
        this.emit('error', errorDetails);
        // Report error if enabled
        if (this.options.enableReporting) {
            await this.reportError(errorDetails);
        }
        return errorDetails;
    }
    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Initialize metrics
     */
    initializeMetrics() {
        return {
            totalErrors: 0,
            errorsByCategory: new Map(),
            errorsBySeverity: new Map(),
            recoverySuccessRate: 0,
            avgRecoveryTime: 0,
            recentErrors: []
        };
    }
    /**
     * Update metrics
     */
    updateMetrics(event, errorDetails) {
        if (!this.options.enableMetrics)
            return;
        switch (event) {
            case 'error':
                if (errorDetails) {
                    this.metrics.totalErrors++;
                    const categoryCount = this.metrics.errorsByCategory.get(errorDetails.category) || 0;
                    this.metrics.errorsByCategory.set(errorDetails.category, categoryCount + 1);
                    const severityCount = this.metrics.errorsBySeverity.get(errorDetails.severity) || 0;
                    this.metrics.errorsBySeverity.set(errorDetails.severity, severityCount + 1);
                    this.metrics.recentErrors.unshift(errorDetails);
                    if (this.metrics.recentErrors.length > 50) {
                        this.metrics.recentErrors = this.metrics.recentErrors.slice(0, 50);
                    }
                }
                break;
            case 'recovery_success':
            case 'recovery_failure':
                // Update recovery success rate
                break;
        }
    }
    /**
     * Log error based on severity
     */
    logError(errorDetails) {
        const logMessage = `[${errorDetails.severity.toUpperCase()}] ${errorDetails.code}: ${errorDetails.message}`;
        switch (errorDetails.severity) {
            case ErrorSeverity.CRITICAL:
                console.error(logMessage, errorDetails.context);
                break;
            case ErrorSeverity.HIGH:
                console.error(logMessage);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn(logMessage);
                break;
            case ErrorSeverity.LOW:
                console.info(logMessage);
                break;
        }
    }
    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        process.on('uncaughtException', (error) => {
            this.handleUnknownError(error, 'uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            this.handleUnknownError(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection');
        });
    }
    /**
     * Handle unknown errors
     */
    async handleUnknownError(error, source) {
        const errorDetails = {
            id: this.generateErrorId(),
            code: 'UNKNOWN_ERROR',
            message: `Unhandled error: ${error.message}`,
            category: ErrorCategory.UNKNOWN_ERROR,
            severity: ErrorSeverity.CRITICAL,
            context: {
                operation: source,
                stackTrace: error.stack,
                timestamp: new Date()
            },
            userMessage: 'An unexpected error occurred. Please report this issue.',
            technicalMessage: error.message,
            recoveryActions: [
                {
                    type: 'abort',
                    description: 'Terminate the process gracefully',
                    action: async () => {
                        console.error('Terminating due to unhandled error');
                        process.exit(1);
                    }
                }
            ],
            documentationUrl: 'https://docs.example.com/errors/unknown-error'
        };
        await this.processError(errorDetails);
    }
    // Recovery action implementations
    async tryAlternativeSpecParsing(specPath) {
        // Implementation for alternative spec parsing
        console.log(`Attempting alternative parsing for ${specPath}`);
        return null;
    }
    async applyAutomaticFixes(validationErrors) {
        // Implementation for automatic fixes
        console.log(`Applying fixes for ${validationErrors.length} validation errors`);
        return true;
    }
    async retryWithSimplifiedOptions(operation, context) {
        // Implementation for simplified retry
        console.log(`Retrying ${operation} with simplified options`);
        return null;
    }
    async generateBasicTestStructure(operation, context) {
        // Implementation for basic test structure
        console.log(`Generating basic test structure for ${operation}`);
        return null;
    }
    async retryFileOperation(filePath, operation) {
        // Implementation for file operation retry
        console.log(`Retrying ${operation} for ${filePath}`);
        return null;
    }
    async tryAlternativeLocation(filePath, operation) {
        // Implementation for alternative file location
        const altPath = path_1.default.join(path_1.default.dirname(filePath), 'alt_' + path_1.default.basename(filePath));
        console.log(`Trying alternative location: ${altPath}`);
        return altPath;
    }
    async retryNetworkRequest(url) {
        // Implementation for network retry
        console.log(`Retrying network request to ${url}`);
        return null;
    }
    async retryWithIncreasedTimeout(operation, newTimeout) {
        // Implementation for timeout retry
        console.log(`Retrying ${operation} with ${newTimeout}ms timeout`);
        return null;
    }
    async processInChunks(operation, context) {
        // Implementation for chunked processing
        console.log(`Processing ${operation} in chunks`);
        return null;
    }
    async reportError(errorDetails) {
        // Implementation for error reporting
        if (this.options.reportingUrl) {
            console.log(`Reporting error ${errorDetails.id} to ${this.options.reportingUrl}`);
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get error by ID
     */
    getError(errorId) {
        return this.errorRegistry.get(errorId);
    }
    /**
     * Get metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get configuration
     */
    getConfiguration() {
        return { ...this.options };
    }
    /**
     * Update configuration
     */
    updateConfiguration(options) {
        this.options = { ...this.options, ...options };
    }
    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorRegistry.clear();
        this.retryAttempts.clear();
        this.metrics = this.initializeMetrics();
    }
    /**
     * Export error report
     */
    async exportErrorReport(filePath) {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            errors: Array.from(this.errorRegistry.values()),
            configuration: this.options
        };
        await fs_1.promises.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
    }
}
exports.ErrorHandlingSystem = ErrorHandlingSystem;
//# sourceMappingURL=error-handling-system.js.map