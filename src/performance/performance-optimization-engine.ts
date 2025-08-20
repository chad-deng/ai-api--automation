/**
 * Performance Optimization Engine (US-019)
 * Optimizes test generation for large APIs using parallel processing and memory efficiency
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import { Operation, ParsedOpenAPI } from '../types';
import { TestCase, GenerationOptions } from '../generator/test-generator';

export interface PerformanceConfig {
  maxWorkers?: number;
  batchSize?: number;
  memoryThreshold?: number; // MB
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

export class PerformanceOptimizationEngine extends EventEmitter {
  private config: PerformanceConfig;
  private workers: Worker[] = [];
  private activeBatches: Map<string, ProcessingBatch> = new Map();
  private cache: Map<string, TestCase[]> = new Map();
  private metrics: PerformanceMetrics;
  private isProcessing = false;

  constructor(config: PerformanceConfig = {}) {
    super();
    
    this.config = {
      maxWorkers: config.maxWorkers || Math.min(os.cpus().length, 8),
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
  async processOperationsInParallel(
    operations: Operation[],
    spec: ParsedOpenAPI,
    options: GenerationOptions
  ): Promise<{ testCases: TestCase[]; metrics: PerformanceMetrics }> {
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

    } catch (error) {
      await this.cleanup();
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process operations with streaming for very large APIs
   */
  async processOperationsWithStreaming(
    operations: Operation[],
    spec: ParsedOpenAPI,
    options: GenerationOptions,
    outputCallback: (testCases: TestCase[]) => Promise<void>
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    this.isProcessing = true;
    this.metrics = this.initializeMetrics();
    this.metrics.totalOperations = operations.length;

    try {
      const chunkSize = this.config.chunkSize!;
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

    } catch (error) {
      await this.cleanup();
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Initialize worker pool
   */
  private async initializeWorkerPool(): Promise<void> {
    const workerScript = path.join(__dirname, 'test-generation-worker.js');
    
    // Create worker script if it doesn't exist
    await this.ensureWorkerScript();

    for (let i = 0; i < this.config.maxWorkers!; i++) {
      const worker = new Worker(workerScript);
      
      worker.on('message', (message: WorkerMessage) => {
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
  private createBatches(operations: Operation[], batchSize: number): Operation[][] {
    const batches: Operation[][] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Create chunks for streaming processing
   */
  private createChunks(operations: Operation[], chunkSize: number): Operation[][] {
    return this.createBatches(operations, chunkSize);
  }

  /**
   * Process batches using worker pool
   */
  private async processBatches(
    batches: Operation[][],
    spec: ParsedOpenAPI,
    options: GenerationOptions
  ): Promise<TestCase[]> {
    const allTestCases: TestCase[] = [];
    const promises: Promise<BatchResult>[] = [];
    
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
  private async processBatch(
    batchId: string,
    operations: Operation[],
    spec: ParsedOpenAPI,
    options: GenerationOptions
  ): Promise<BatchResult> {
    return new Promise((resolve, reject) => {
      // Check cache first
      const cacheKey = this.generateCacheKey(operations, options);
      
      if (this.config.enableCaching && this.cache.has(cacheKey)) {
        const cachedTestCases = this.cache.get(cacheKey)!;
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

      const batch: ProcessingBatch = {
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
      }, this.config.timeoutMs!);

      // Handle worker response
      const messageHandler = (message: WorkerMessage) => {
        if (message.type === 'result' && message.data.batchId === batchId) {
          clearTimeout(timeout);
          worker.off('message', messageHandler);
          
          const result: BatchResult = message.data;
          
          // Cache result
          if (this.config.enableCaching) {
            this.cache.set(cacheKey, result.testCases);
          }
          
          this.activeBatches.delete(batchId);
          resolve(result);
        } else if (message.type === 'error' && message.data.batchId === batchId) {
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
  private async processChunk(
    operations: Operation[],
    spec: ParsedOpenAPI,
    options: GenerationOptions
  ): Promise<TestCase[]> {
    const chunkId = `chunk-${Date.now()}`;
    const result = await this.processBatch(chunkId, operations, spec, options);
    return result.testCases;
  }

  /**
   * Get available worker from pool
   */
  private getAvailableWorker(): Worker | null {
    // Simple round-robin for now
    // In production, implement proper load balancing
    return this.workers.length > 0 ? this.workers[0] : null;
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(message: WorkerMessage): void {
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
  private calculateOptimalBatchSize(totalOperations: number): number {
    const memoryUsage = process.memoryUsage();
    const availableMemory = this.config.memoryThreshold! * 1024 * 1024; // Convert to bytes
    const memoryPerOperation = memoryUsage.heapUsed / Math.max(totalOperations, 1);
    
    const memoryBasedBatchSize = Math.floor(availableMemory / (memoryPerOperation * this.config.maxWorkers!));
    const configuredBatchSize = this.config.batchSize!;
    
    // Use the smaller of memory-based or configured batch size
    return Math.min(Math.max(memoryBasedBatchSize, 1), configuredBatchSize);
  }

  /**
   * Check memory usage and trigger garbage collection if needed
   */
  private checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (memoryUsedMB > this.config.memoryThreshold!) {
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
  private cleanupCache(): void {
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
  private generateCacheKey(operations: Operation[], options: GenerationOptions): string {
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
  private async cleanup(): Promise<void> {
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
  private async ensureWorkerScript(): Promise<void> {
    const workerScript = path.join(__dirname, 'test-generation-worker.js');
    
    try {
      await fs.access(workerScript);
    } catch {
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
      
      await fs.writeFile(workerScript, workerCode, 'utf-8');
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): PerformanceMetrics {
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
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get configuration
   */
  getConfiguration(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if engine is currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: this.metrics.cacheHitRate || 0
    };
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear();
    this.metrics.cacheHitRate = 0;
  }
}