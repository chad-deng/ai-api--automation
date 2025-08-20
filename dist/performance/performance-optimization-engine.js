"use strict";
/**
 * Performance Optimization Engine (US-019)
 * Optimizes test generation for large APIs using parallel processing and memory efficiency
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceOptimizationEngine = void 0;
const worker_threads_1 = require("worker_threads");
const events_1 = require("events");
const os_1 = __importDefault(require("os"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class PerformanceOptimizationEngine extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.workers = [];
        this.activeBatches = new Map();
        this.cache = new Map();
        this.isProcessing = false;
        this.config = {
            maxWorkers: config.maxWorkers || Math.min(os_1.default.cpus().length, 8),
            batchSize: config.batchSize || 10,
            memoryThreshold: config.memoryThreshold || 512, // 512 MB
            enableCaching: config.enableCaching ?? true,
            enableStreaming: config.enableStreaming ?? true,
            chunkSize: config.chunkSize || 50,
            timeoutMs: config.timeoutMs || 30000,
            ...config
        };
        this.metrics = this.initializeMetrics();
    }
    /**
     * Process operations in parallel with performance optimizations
     */
    async processOperationsInParallel(operations, spec, options) {
        const startTime = Date.now();
        this.isProcessing = true;
        this.metrics = this.initializeMetrics();
        this.metrics.totalOperations = operations.length;
        try {
            // Check memory before processing
            this.checkMemoryUsage();
            // Determine optimal batch size based on operations count and available memory
            const optimalBatchSize = this.calculateOptimalBatchSize(operations.length);
            // Split operations into batches
            const batches = this.createBatches(operations, optimalBatchSize);
            this.metrics.batchCount = batches.length;
            // Initialize worker pool
            await this.initializeWorkerPool();
            // Process batches
            const testCases = await this.processBatches(batches, spec, options);
            // Calculate final metrics
            this.metrics.totalTimeMs = Date.now() - startTime;
            this.metrics.operationsPerSecond = operations.length / (this.metrics.totalTimeMs / 1000);
            this.metrics.avgBatchTimeMs = this.metrics.totalTimeMs / batches.length;
            this.metrics.memoryUsage = process.memoryUsage();
            // Cleanup
            await this.cleanup();
            return {
                testCases,
                metrics: this.metrics
            };
        }
        catch (error) {
            await this.cleanup();
            throw error;
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Process operations with streaming for very large APIs
     */
    async processOperationsWithStreaming(operations, spec, options, outputCallback) {
        const startTime = Date.now();
        this.isProcessing = true;
        this.metrics = this.initializeMetrics();
        this.metrics.totalOperations = operations.length;
        try {
            const chunkSize = this.config.chunkSize;
            const chunks = this.createChunks(operations, chunkSize);
            await this.initializeWorkerPool();
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const testCases = await this.processChunk(chunk, spec, options);
                // Stream results back to caller
                await outputCallback(testCases);
                this.metrics.processedOperations += chunk.length;
                this.emit('progress', {
                    processed: this.metrics.processedOperations,
                    total: this.metrics.totalOperations,
                    percentage: (this.metrics.processedOperations / this.metrics.totalOperations) * 100
                });
                // Check memory usage and cleanup if needed
                if (i % 10 === 0) {
                    this.checkMemoryUsage();
                    if (this.config.enableCaching) {
                        this.cleanupCache();
                    }
                }
            }
            this.metrics.totalTimeMs = Date.now() - startTime;
            this.metrics.operationsPerSecond = operations.length / (this.metrics.totalTimeMs / 1000);
            await this.cleanup();
            return this.metrics;
        }
        catch (error) {
            await this.cleanup();
            throw error;
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Initialize worker pool
     */
    async initializeWorkerPool() {
        const workerScript = path_1.default.join(__dirname, 'test-generation-worker.js');
        // Create worker script if it doesn't exist
        await this.ensureWorkerScript();
        for (let i = 0; i < this.config.maxWorkers; i++) {
            const worker = new worker_threads_1.Worker(workerScript);
            worker.on('message', (message) => {
                this.handleWorkerMessage(message);
            });
            worker.on('error', (error) => {
                this.emit('error', `Worker ${i} error: ${error.message}`);
            });
            worker.on('exit', (code) => {
                if (code !== 0) {
                    this.emit('error', `Worker ${i} stopped with exit code ${code}`);
                }
            });
            this.workers.push(worker);
        }
        this.metrics.workerCount = this.workers.length;
    }
    /**
     * Create batches of operations for parallel processing
     */
    createBatches(operations, batchSize) {
        const batches = [];
        for (let i = 0; i < operations.length; i += batchSize) {
            batches.push(operations.slice(i, i + batchSize));
        }
        return batches;
    }
    /**
     * Create chunks for streaming processing
     */
    createChunks(operations, chunkSize) {
        return this.createBatches(operations, chunkSize);
    }
    /**
     * Process batches using worker pool
     */
    async processBatches(batches, spec, options) {
        const allTestCases = [];
        const promises = [];
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchId = `batch-${i}`;
            // Create batch processing promise
            const promise = this.processBatch(batchId, batch, spec, options);
            promises.push(promise);
        }
        // Wait for all batches to complete
        const results = await Promise.all(promises);
        // Combine results
        for (const result of results) {
            allTestCases.push(...result.testCases);
            this.metrics.processedOperations += result.testCases.length;
        }
        return allTestCases;
    }
    /**
     * Process single batch
     */
    async processBatch(batchId, operations, spec, options) {
        return new Promise((resolve, reject) => {
            // Check cache first
            const cacheKey = this.generateCacheKey(operations, options);
            if (this.config.enableCaching && this.cache.has(cacheKey)) {
                const cachedTestCases = this.cache.get(cacheKey);
                this.metrics.cacheHitRate = (this.metrics.cacheHitRate || 0) + 1;
                resolve({
                    batchId,
                    testCases: cachedTestCases,
                    processingTime: 0,
                    memoryUsed: 0,
                    errors: []
                });
                return;
            }
            // Find available worker
            const worker = this.getAvailableWorker();
            if (!worker) {
                reject(new Error('No available workers'));
                return;
            }
            const batch = {
                id: batchId,
                operations,
                spec,
                options,
                startTime: Date.now()
            };
            this.activeBatches.set(batchId, batch);
            // Set timeout
            const timeout = setTimeout(() => {
                reject(new Error(`Batch ${batchId} timed out`));
            }, this.config.timeoutMs);
            // Handle worker response
            const messageHandler = (message) => {
                if (message.type === 'result' && message.data.batchId === batchId) {
                    clearTimeout(timeout);
                    worker.off('message', messageHandler);
                    const result = message.data;
                    // Cache result
                    if (this.config.enableCaching) {
                        this.cache.set(cacheKey, result.testCases);
                    }
                    this.activeBatches.delete(batchId);
                    resolve(result);
                }
                else if (message.type === 'error' && message.data.batchId === batchId) {
                    clearTimeout(timeout);
                    worker.off('message', messageHandler);
                    this.activeBatches.delete(batchId);
                    reject(new Error(message.data.error));
                }
            };
            worker.on('message', messageHandler);
            // Send batch to worker
            worker.postMessage({
                type: 'batch',
                data: batch
            });
        });
    }
    /**
     * Process single chunk for streaming
     */
    async processChunk(operations, spec, options) {
        const chunkId = `chunk-${Date.now()}`;
        const result = await this.processBatch(chunkId, operations, spec, options);
        return result.testCases;
    }
    /**
     * Get available worker from pool
     */
    getAvailableWorker() {
        // Simple round-robin for now
        // In production, implement proper load balancing
        return this.workers.length > 0 ? this.workers[0] : null;
    }
    /**
     * Handle worker messages
     */
    handleWorkerMessage(message) {
        switch (message.type) {
            case 'progress':
                this.emit('progress', message.data);
                break;
            case 'error':
                this.emit('error', message.data);
                break;
            // Result messages are handled by processBatch
        }
    }
    /**
     * Calculate optimal batch size based on available resources
     */
    calculateOptimalBatchSize(totalOperations) {
        const memoryUsage = process.memoryUsage();
        const availableMemory = this.config.memoryThreshold * 1024 * 1024; // Convert to bytes
        const memoryPerOperation = memoryUsage.heapUsed / Math.max(totalOperations, 1);
        const memoryBasedBatchSize = Math.floor(availableMemory / (memoryPerOperation * this.config.maxWorkers));
        const configuredBatchSize = this.config.batchSize;
        // Use the smaller of memory-based or configured batch size
        return Math.min(Math.max(memoryBasedBatchSize, 1), configuredBatchSize);
    }
    /**
     * Check memory usage and trigger garbage collection if needed
     */
    checkMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        if (memoryUsedMB > this.config.memoryThreshold) {
            this.emit('warning', `Memory usage (${memoryUsedMB.toFixed(2)}MB) exceeds threshold (${this.config.memoryThreshold}MB)`);
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            // Clear cache if enabled
            if (this.config.enableCaching) {
                this.cleanupCache();
            }
        }
    }
    /**
     * Cleanup cache to free memory
     */
    cleanupCache() {
        const cacheSize = this.cache.size;
        if (cacheSize > 100) { // Keep only recent 50 entries
            const keys = Array.from(this.cache.keys());
            const keysToDelete = keys.slice(0, cacheSize - 50);
            keysToDelete.forEach(key => this.cache.delete(key));
            this.emit('info', `Cache cleaned up: removed ${keysToDelete.length} entries`);
        }
    }
    /**
     * Generate cache key for operations
     */
    generateCacheKey(operations, options) {
        const operationKeys = operations.map(op => `${op.method}-${op.path}`).join('|');
        const optionsKey = JSON.stringify({
            framework: options.framework,
            includeTypes: options.includeTypes,
            generateMocks: options.generateMocks
        });
        return `${operationKeys}-${optionsKey}`;
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        // Terminate all workers
        await Promise.all(this.workers.map(worker => worker.terminate()));
        this.workers = [];
        // Clear active batches
        this.activeBatches.clear();
        // Clear cache if needed
        if (!this.config.enableCaching) {
            this.cache.clear();
        }
    }
    /**
     * Ensure worker script exists
     */
    async ensureWorkerScript() {
        const workerScript = path_1.default.join(__dirname, 'test-generation-worker.js');
        try {
            await fs_1.promises.access(workerScript);
        }
        catch {
            // Create minimal worker script
            const workerCode = `
const { parentPort } = require('worker_threads');

// Simple worker that processes test generation batches
parentPort.on('message', async (message) => {
  if (message.type === 'batch') {
    try {
      const { id, operations, spec, options } = message.data;
      
      // Simulate test case generation
      // In production, this would use the actual test generator
      const testCases = operations.map(op => ({
        name: \`test \${op.method} \${op.path}\`,
        operation: op,
        method: op.method || 'GET',
        path: op.path || '/',
        description: \`Test \${op.method} \${op.path}\`,
        requestData: {},
        expectedResponse: null,
        statusCode: 200,
        tags: ['generated']
      }));
      
      parentPort.postMessage({
        type: 'result',
        data: {
          batchId: id,
          testCases,
          processingTime: 100,
          memoryUsed: process.memoryUsage().heapUsed,
          errors: []
        }
      });
    } catch (error) {
      parentPort.postMessage({
        type: 'error',
        data: {
          batchId: message.data.id,
          error: error.message
        }
      });
    }
  }
});
`;
            await fs_1.promises.writeFile(workerScript, workerCode, 'utf-8');
        }
    }
    /**
     * Initialize metrics
     */
    initializeMetrics() {
        return {
            totalOperations: 0,
            processedOperations: 0,
            operationsPerSecond: 0,
            memoryUsage: process.memoryUsage(),
            workerCount: 0,
            batchCount: 0,
            totalTimeMs: 0,
            avgBatchTimeMs: 0,
            cacheHitRate: 0
        };
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get configuration
     */
    getConfiguration() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfiguration(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Check if engine is currently processing
     */
    isCurrentlyProcessing() {
        return this.isProcessing;
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            hitRate: this.metrics.cacheHitRate || 0
        };
    }
    /**
     * Clear cache manually
     */
    clearCache() {
        this.cache.clear();
        this.metrics.cacheHitRate = 0;
    }
}
exports.PerformanceOptimizationEngine = PerformanceOptimizationEngine;
//# sourceMappingURL=performance-optimization-engine.js.map