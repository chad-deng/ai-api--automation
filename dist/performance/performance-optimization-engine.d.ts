/**
 * Performance Optimization Engine (US-019)
 * Optimizes test generation for large APIs using parallel processing and memory efficiency
 */
import { EventEmitter } from 'events';
import { Operation, ParsedOpenAPI } from '../types';
import { TestCase, GenerationOptions } from '../generator/test-generator';
export interface PerformanceConfig {
    maxWorkers?: number;
    batchSize?: number;
    memoryThreshold?: number;
    enableCaching?: boolean;
    enableStreaming?: boolean;
    chunkSize?: number;
    timeoutMs?: number;
}
export interface PerformanceMetrics {
    totalOperations: number;
    processedOperations: number;
    operationsPerSecond: number;
    memoryUsage: NodeJS.MemoryUsage;
    workerCount: number;
    batchCount: number;
    totalTimeMs: number;
    avgBatchTimeMs: number;
    cacheHitRate?: number;
}
export interface ProcessingBatch {
    id: string;
    operations: Operation[];
    spec: ParsedOpenAPI;
    options: GenerationOptions;
    startTime: number;
}
export interface BatchResult {
    batchId: string;
    testCases: TestCase[];
    processingTime: number;
    memoryUsed: number;
    errors: string[];
}
export interface WorkerMessage {
    type: 'batch' | 'result' | 'error' | 'progress';
    data: any;
}
export declare class PerformanceOptimizationEngine extends EventEmitter {
    private config;
    private workers;
    private activeBatches;
    private cache;
    private metrics;
    private isProcessing;
    constructor(config?: PerformanceConfig);
    /**
     * Process operations in parallel with performance optimizations
     */
    processOperationsInParallel(operations: Operation[], spec: ParsedOpenAPI, options: GenerationOptions): Promise<{
        testCases: TestCase[];
        metrics: PerformanceMetrics;
    }>;
    /**
     * Process operations with streaming for very large APIs
     */
    processOperationsWithStreaming(operations: Operation[], spec: ParsedOpenAPI, options: GenerationOptions, outputCallback: (testCases: TestCase[]) => Promise<void>): Promise<PerformanceMetrics>;
    /**
     * Initialize worker pool
     */
    private initializeWorkerPool;
    /**
     * Create batches of operations for parallel processing
     */
    private createBatches;
    /**
     * Create chunks for streaming processing
     */
    private createChunks;
    /**
     * Process batches using worker pool
     */
    private processBatches;
    /**
     * Process single batch
     */
    private processBatch;
    /**
     * Process single chunk for streaming
     */
    private processChunk;
    /**
     * Get available worker from pool
     */
    private getAvailableWorker;
    /**
     * Handle worker messages
     */
    private handleWorkerMessage;
    /**
     * Calculate optimal batch size based on available resources
     */
    private calculateOptimalBatchSize;
    /**
     * Check memory usage and trigger garbage collection if needed
     */
    private checkMemoryUsage;
    /**
     * Cleanup cache to free memory
     */
    private cleanupCache;
    /**
     * Generate cache key for operations
     */
    private generateCacheKey;
    /**
     * Cleanup resources
     */
    private cleanup;
    /**
     * Ensure worker script exists
     */
    private ensureWorkerScript;
    /**
     * Initialize metrics
     */
    private initializeMetrics;
    /**
     * Get current metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get configuration
     */
    getConfiguration(): PerformanceConfig;
    /**
     * Update configuration
     */
    updateConfiguration(config: Partial<PerformanceConfig>): void;
    /**
     * Check if engine is currently processing
     */
    isCurrentlyProcessing(): boolean;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
    };
    /**
     * Clear cache manually
     */
    clearCache(): void;
}
//# sourceMappingURL=performance-optimization-engine.d.ts.map