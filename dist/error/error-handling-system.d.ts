/**
 * Comprehensive Error Handling System (US-020)
 * Provides graceful error handling with actionable messages and recovery strategies
 */
import { EventEmitter } from 'events';
export declare enum ErrorCategory {
    SPECIFICATION_ERROR = "specification_error",
    VALIDATION_ERROR = "validation_error",
    GENERATION_ERROR = "generation_error",
    IO_ERROR = "io_error",
    CONFIGURATION_ERROR = "configuration_error",
    NETWORK_ERROR = "network_error",
    TIMEOUT_ERROR = "timeout_error",
    MEMORY_ERROR = "memory_error",
    DEPENDENCY_ERROR = "dependency_error",
    UNKNOWN_ERROR = "unknown_error"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ErrorContext {
    operation?: string;
    file?: string;
    line?: number;
    column?: number;
    data?: any;
    stackTrace?: string;
    timestamp: Date;
    requestId?: string;
}
export interface RecoveryAction {
    type: 'retry' | 'skip' | 'fallback' | 'manual' | 'abort';
    description: string;
    action?: () => Promise<any>;
    maxRetries?: number;
    retryDelay?: number;
}
export interface ErrorDetails {
    id: string;
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    context: ErrorContext;
    userMessage: string;
    technicalMessage: string;
    recoveryActions: RecoveryAction[];
    relatedErrors?: string[];
    documentationUrl?: string;
}
export interface ErrorHandlingOptions {
    enableLogging?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    enableRecovery?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    enableMetrics?: boolean;
    enableReporting?: boolean;
    reportingUrl?: string;
}
export interface ErrorMetrics {
    totalErrors: number;
    errorsByCategory: Map<ErrorCategory, number>;
    errorsBySeverity: Map<ErrorSeverity, number>;
    recoverySuccessRate: number;
    avgRecoveryTime: number;
    recentErrors: ErrorDetails[];
}
export declare class APITestGeneratorError extends Error {
    readonly details: ErrorDetails;
    constructor(details: ErrorDetails);
}
export declare class ErrorHandlingSystem extends EventEmitter {
    private options;
    private metrics;
    private errorRegistry;
    private retryAttempts;
    constructor(options?: ErrorHandlingOptions);
    /**
     * Handle specification parsing errors
     */
    handleSpecificationError(error: Error, specPath: string, context?: Partial<ErrorContext>): Promise<ErrorDetails>;
    /**
     * Handle validation errors
     */
    handleValidationError(validationErrors: any[], context?: Partial<ErrorContext>): Promise<ErrorDetails>;
    /**
     * Handle generation errors
     */
    handleGenerationError(error: Error, operation: string, context?: Partial<ErrorContext>): Promise<ErrorDetails>;
    /**
     * Handle IO errors (file system operations)
     */
    handleIOError(error: Error, filePath: string, operation: 'read' | 'write' | 'delete', context?: Partial<ErrorContext>): Promise<ErrorDetails>;
    /**
     * Handle network errors
     */
    handleNetworkError(error: Error, url: string, context?: Partial<ErrorContext>): Promise<ErrorDetails>;
    /**
     * Handle timeout errors
     */
    handleTimeoutError(operation: string, timeoutMs: number, context?: Partial<ErrorContext>): Promise<ErrorDetails>;
    /**
     * Execute recovery action with retry logic
     */
    executeRecoveryAction(errorDetails: ErrorDetails, actionIndex?: number): Promise<any>;
    /**
     * Process error and update metrics
     */
    private processError;
    /**
     * Generate unique error ID
     */
    private generateErrorId;
    /**
     * Initialize metrics
     */
    private initializeMetrics;
    /**
     * Update metrics
     */
    private updateMetrics;
    /**
     * Log error based on severity
     */
    private logError;
    /**
     * Setup global error handlers
     */
    private setupGlobalErrorHandlers;
    /**
     * Handle unknown errors
     */
    private handleUnknownError;
    private tryAlternativeSpecParsing;
    private applyAutomaticFixes;
    private retryWithSimplifiedOptions;
    private generateBasicTestStructure;
    private retryFileOperation;
    private tryAlternativeLocation;
    private retryNetworkRequest;
    private retryWithIncreasedTimeout;
    private processInChunks;
    private reportError;
    private delay;
    /**
     * Get error by ID
     */
    getError(errorId: string): ErrorDetails | undefined;
    /**
     * Get metrics
     */
    getMetrics(): ErrorMetrics;
    /**
     * Get configuration
     */
    getConfiguration(): ErrorHandlingOptions;
    /**
     * Update configuration
     */
    updateConfiguration(options: Partial<ErrorHandlingOptions>): void;
    /**
     * Clear error history
     */
    clearErrorHistory(): void;
    /**
     * Export error report
     */
    exportErrorReport(filePath: string): Promise<void>;
}
//# sourceMappingURL=error-handling-system.d.ts.map