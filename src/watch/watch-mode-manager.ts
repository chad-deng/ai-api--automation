/**
 * Watch Mode Manager (US-024)
 * Provides file watching capabilities for continuous test generation with incremental updates
 */

import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { TestGenerator, GenerationOptions } from '../generator/test-generator';
import { ConfigurationManager } from '../config/configuration-manager';
import { ErrorHandlingSystem } from '../error/error-handling-system';
import crypto from 'crypto';

export interface WatchConfiguration {
  watchPaths: string[];
  ignorePatterns: string[];
  debounceMs: number;
  incremental: boolean;
  notifyOnChange: boolean;
  autoGenerate: boolean;
  outputDir: string;
  generationOptions: GenerationOptions;
}

export interface WatchedFile {
  path: string;
  lastModified: Date;
  hash: string;
  size: number;
  isProcessing: boolean;
}

export interface ChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  stats?: any;
  timestamp: Date;
}

export interface WatchMetrics {
  filesWatched: number;
  changesDetected: number;
  generationsTriggered: number;
  lastChangeTime?: Date;
  lastGenerationTime?: Date;
  averageGenerationTime: number;
  successfulGenerations: number;
  failedGenerations: number;
}

export interface IncrementalState {
  lastFullGeneration: Date;
  modifiedFiles: Set<string>;
  deletedFiles: Set<string>;
  addedFiles: Set<string>;
  generatedFiles: Map<string, string[]>; // source -> generated files
  checksums: Map<string, string>;
}

export class WatchModeManager extends EventEmitter {
  private watcher?: any;
  private config: WatchConfiguration;
  private generator: TestGenerator;
  private configManager: ConfigurationManager;
  private errorHandler: ErrorHandlingSystem;
  private watchedFiles: Map<string, WatchedFile> = new Map();
  private changeQueue: ChangeEvent[] = [];
  private debounceTimer?: NodeJS.Timeout;
  private metrics: WatchMetrics;
  private incrementalState: IncrementalState;
  private isRunning = false;
  private isGenerating = false;

  constructor(
    config: WatchConfiguration,
    generator: TestGenerator,
    configManager: ConfigurationManager,
    errorHandler: ErrorHandlingSystem
  ) {
    super();
    
    this.config = config;
    this.generator = generator;
    this.configManager = configManager;
    this.errorHandler = errorHandler;
    this.metrics = this.initializeMetrics();
    this.incrementalState = this.initializeIncrementalState();
  }

  /**
   * Start watching files
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.emit('warning', 'Watch mode is already running');
      return;
    }

    try {
      this.isRunning = true;
      
      // Initialize watcher
      await this.initializeWatcher();
      
      // Load initial state
      await this.loadIncrementalState();
      
      // Scan existing files
      await this.performInitialScan();
      
      this.emit('started', {
        watchPaths: this.config.watchPaths,
        filesWatched: this.metrics.filesWatched
      });
      
    } catch (error) {
      this.isRunning = false;
      const errorDetails = await this.errorHandler.handleGenerationError(
        error instanceof Error ? error : new Error(String(error)),
        'watch_start'
      );
      this.emit('error', errorDetails);
      throw error;
    }
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      this.isRunning = false;
      
      // Clear debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = undefined;
      }
      
      // Close watcher
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = undefined;
      }
      
      // Save incremental state
      await this.saveIncrementalState();
      
      this.emit('stopped', { metrics: this.metrics });
      
    } catch (error) {
      const errorDetails = await this.errorHandler.handleGenerationError(
        error instanceof Error ? error : new Error(String(error)),
        'watch_stop'
      );
      this.emit('error', errorDetails);
      throw error;
    }
  }

  /**
   * Pause watching
   */
  pause(): void {
    if (this.watcher) {
      this.watcher.unwatch('*');
      this.emit('paused');
    }
  }

  /**
   * Resume watching
   */
  async resume(): Promise<void> {
    if (this.watcher) {
      await this.initializeWatcher();
      this.emit('resumed');
    }
  }

  /**
   * Trigger manual generation
   */
  async triggerGeneration(force = false): Promise<void> {
    if (this.isGenerating && !force) {
      this.emit('warning', 'Generation already in progress');
      return;
    }

    try {
      this.isGenerating = true;
      const startTime = Date.now();
      
      this.emit('generationStarted', {
        timestamp: new Date(),
        type: force ? 'manual' : 'auto',
        changesCount: this.changeQueue.length
      });

      let result: any;
      
      if (this.config.incremental && !force) {
        result = await this.performIncrementalGeneration();
      } else {
        result = await this.performFullGeneration();
      }
      
      const generationTime = Date.now() - startTime;
      this.updateMetrics('generation_success', generationTime);
      
      this.emit('generationCompleted', {
        timestamp: new Date(),
        duration: generationTime,
        result,
        incremental: this.config.incremental && !force
      });
      
    } catch (error) {
      this.updateMetrics('generation_failure');
      
      const errorDetails = await this.errorHandler.handleGenerationError(
        error instanceof Error ? error : new Error(String(error)),
        'test_generation'
      );
      
      this.emit('generationFailed', { error: errorDetails });
      throw error;
      
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Initialize file watcher
   */
  private async initializeWatcher(): Promise<void> {
    const watchOptions = {
      ignored: this.config.ignorePatterns,
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      cwd: process.cwd(),
      disableGlobbing: false,
      usePolling: false,
      interval: 100,
      binaryInterval: 300,
      alwaysStat: true,
      depth: 99,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    };

    this.watcher = chokidar.watch(this.config.watchPaths, watchOptions);

    // Setup event handlers
    this.watcher
      .on('add', (filePath, stats) => this.handleFileEvent('add', filePath, stats))
      .on('change', (filePath, stats) => this.handleFileEvent('change', filePath, stats))
      .on('unlink', (filePath) => this.handleFileEvent('unlink', filePath))
      .on('addDir', (dirPath, stats) => this.handleFileEvent('addDir', dirPath, stats))
      .on('unlinkDir', (dirPath) => this.handleFileEvent('unlinkDir', dirPath))
      .on('error', (error) => this.handleWatchError(error))
      .on('ready', () => this.emit('watcherReady', { filesWatched: this.metrics.filesWatched }));
  }

  /**
   * Handle file system events
   */
  private async handleFileEvent(
    type: ChangeEvent['type'],
    filePath: string,
    stats?: any
  ): Promise<void> {
    const changeEvent: ChangeEvent = {
      type,
      path: filePath,
      stats,
      timestamp: new Date()
    };

    // Filter relevant files (OpenAPI specs)
    if (!this.isRelevantFile(filePath)) {
      return;
    }

    // Update watched files registry
    await this.updateWatchedFile(filePath, type, stats);
    
    // Add to change queue
    this.changeQueue.push(changeEvent);
    this.metrics.changesDetected++;

    // Update incremental state
    this.updateIncrementalState(changeEvent);

    // Emit change event
    this.emit('fileChanged', changeEvent);

    // Trigger debounced generation if auto-generate is enabled
    if (this.config.autoGenerate) {
      this.debouncedGeneration();
    }

    // Send notifications if enabled
    if (this.config.notifyOnChange) {
      this.sendChangeNotification(changeEvent);
    }
  }

  /**
   * Handle watcher errors
   */
  private async handleWatchError(error: Error): Promise<void> {
    const errorDetails = await this.errorHandler.handleIOError(
      error,
      'watcher',
      'read'
    );
    
    this.emit('watcherError', errorDetails);
  }

  /**
   * Check if file is relevant for watching
   */
  private isRelevantFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const relevantExtensions = ['.json', '.yml', '.yaml'];
    
    // Check extension
    if (!relevantExtensions.includes(ext)) {
      return false;
    }
    
    // Check if it's likely an OpenAPI spec
    const basename = path.basename(filePath).toLowerCase();
    const specKeywords = ['openapi', 'swagger', 'api', 'spec'];
    
    return specKeywords.some(keyword => basename.includes(keyword));
  }

  /**
   * Update watched file registry
   */
  private async updateWatchedFile(
    filePath: string,
    eventType: string,
    stats?: any
  ): Promise<void> {
    const absolutePath = path.resolve(filePath);

    if (eventType === 'unlink' || eventType === 'unlinkDir') {
      this.watchedFiles.delete(absolutePath);
      return;
    }

    if (stats && (eventType === 'add' || eventType === 'change')) {
      let hash = '';
      
      try {
        const content = await fs.readFile(absolutePath, 'utf-8');
        hash = crypto.createHash('sha256').update(content).digest('hex');
      } catch (error) {
        // File might be temporarily unavailable
        hash = `error-${Date.now()}`;
      }

      const watchedFile: WatchedFile = {
        path: absolutePath,
        lastModified: stats.mtime || new Date(),
        hash,
        size: stats.size || 0,
        isProcessing: false
      };

      this.watchedFiles.set(absolutePath, watchedFile);
      
      if (eventType === 'add') {
        this.metrics.filesWatched++;
      }
    }
  }

  /**
   * Update incremental state based on file changes
   */
  private updateIncrementalState(changeEvent: ChangeEvent): void {
    const { type, path: filePath } = changeEvent;
    
    switch (type) {
      case 'add':
        this.incrementalState.addedFiles.add(filePath);
        this.incrementalState.modifiedFiles.delete(filePath);
        this.incrementalState.deletedFiles.delete(filePath);
        break;
        
      case 'change':
        this.incrementalState.modifiedFiles.add(filePath);
        this.incrementalState.addedFiles.delete(filePath);
        this.incrementalState.deletedFiles.delete(filePath);
        break;
        
      case 'unlink':
        this.incrementalState.deletedFiles.add(filePath);
        this.incrementalState.modifiedFiles.delete(filePath);
        this.incrementalState.addedFiles.delete(filePath);
        break;
    }
  }

  /**
   * Debounced generation trigger
   */
  private debouncedGeneration(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (!this.isGenerating && this.changeQueue.length > 0) {
        this.triggerGeneration().catch(error => {
          this.emit('error', error);
        });
      }
    }, this.config.debounceMs);
  }

  /**
   * Perform full generation for all watched files
   */
  private async performFullGeneration(): Promise<any> {
    const specFiles = Array.from(this.watchedFiles.keys())
      .filter(filePath => this.isRelevantFile(filePath));

    this.emit('generationProgress', {
      stage: 'full',
      totalFiles: specFiles.length,
      processedFiles: 0
    });

    const results = [];
    
    for (let i = 0; i < specFiles.length; i++) {
      const specFile = specFiles[i];
      
      try {
        const result = await this.generator.generateFromSpec(
          specFile,
          this.config.generationOptions
        );
        
        results.push({ file: specFile, result });
        
        // Track generated files
        this.incrementalState.generatedFiles.set(specFile, (result.generatedFiles || []).map((f: any) => f.path || f));
        
        this.emit('generationProgress', {
          stage: 'full',
          totalFiles: specFiles.length,
          processedFiles: i + 1,
          currentFile: specFile
        });
        
      } catch (error) {
        this.emit('generationError', {
          file: specFile,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Clear change queue and update state
    this.changeQueue = [];
    this.incrementalState.lastFullGeneration = new Date();
    this.incrementalState.addedFiles.clear();
    this.incrementalState.modifiedFiles.clear();
    this.incrementalState.deletedFiles.clear();

    return { type: 'full', results, filesProcessed: results.length };
  }

  /**
   * Perform incremental generation for changed files only
   */
  private async performIncrementalGeneration(): Promise<any> {
    const changedFiles = new Set([
      ...this.incrementalState.addedFiles,
      ...this.incrementalState.modifiedFiles
    ]);

    const deletedFiles = Array.from(this.incrementalState.deletedFiles);
    
    this.emit('generationProgress', {
      stage: 'incremental',
      totalFiles: changedFiles.size,
      processedFiles: 0,
      deletedFiles: deletedFiles.length
    });

    const results = [];
    let processedCount = 0;

    // Process changed/added files
    for (const filePath of changedFiles) {
      if (!this.isRelevantFile(filePath)) {
        continue;
      }

      try {
        const result = await this.generator.generateFromSpec(
          filePath,
          this.config.generationOptions
        );
        
        results.push({ file: filePath, result });
        
        // Update generated files tracking
        this.incrementalState.generatedFiles.set(filePath, (result.generatedFiles || []).map((f: any) => f.path || f));
        
        processedCount++;
        this.emit('generationProgress', {
          stage: 'incremental',
          totalFiles: changedFiles.size,
          processedFiles: processedCount,
          currentFile: filePath
        });
        
      } catch (error) {
        this.emit('generationError', {
          file: filePath,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Clean up generated files for deleted specs
    await this.cleanupDeletedFiles(deletedFiles);

    // Clear incremental state
    this.changeQueue = [];
    this.incrementalState.addedFiles.clear();
    this.incrementalState.modifiedFiles.clear();
    this.incrementalState.deletedFiles.clear();

    return { 
      type: 'incremental', 
      results, 
      filesProcessed: processedCount,
      filesDeleted: deletedFiles.length 
    };
  }

  /**
   * Clean up generated files for deleted specs
   */
  private async cleanupDeletedFiles(deletedFiles: string[]): Promise<void> {
    for (const deletedFile of deletedFiles) {
      const generatedFiles = this.incrementalState.generatedFiles.get(deletedFile);
      
      if (generatedFiles) {
        for (const generatedFile of generatedFiles) {
          try {
            await fs.unlink(generatedFile);
            this.emit('fileDeleted', { file: generatedFile, source: deletedFile });
          } catch (error) {
            // File might already be deleted, ignore error
          }
        }
        
        this.incrementalState.generatedFiles.delete(deletedFile);
      }
    }
  }

  /**
   * Perform initial scan of watch paths
   */
  private async performInitialScan(): Promise<void> {
    this.emit('scanStarted');
    
    let scannedCount = 0;
    
    for (const watchPath of this.config.watchPaths) {
      try {
        const stats = await fs.stat(watchPath);
        
        if (stats.isDirectory()) {
          scannedCount += await this.scanDirectory(watchPath);
        } else if (stats.isFile() && this.isRelevantFile(watchPath)) {
          await this.updateWatchedFile(watchPath, 'add', stats);
          scannedCount++;
        }
      } catch (error) {
        // Path might not exist, continue with others
      }
    }
    
    this.emit('scanCompleted', { filesScanned: scannedCount });
  }

  /**
   * Recursively scan directory for relevant files
   */
  private async scanDirectory(dirPath: string): Promise<number> {
    let count = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Check ignore patterns
        if (this.config.ignorePatterns.some(pattern => 
          fullPath.includes(pattern.replace('**/', '').replace('*', ''))
        )) {
          continue;
        }
        
        if (entry.isDirectory()) {
          count += await this.scanDirectory(fullPath);
        } else if (entry.isFile() && this.isRelevantFile(fullPath)) {
          const stats = await fs.stat(fullPath);
          await this.updateWatchedFile(fullPath, 'add', stats);
          count++;
        }
      }
    } catch (error) {
      // Directory might not be accessible, continue
    }
    
    return count;
  }

  /**
   * Send change notification
   */
  private sendChangeNotification(changeEvent: ChangeEvent): void {
    // This would integrate with notification services
    // For now, just emit an event
    this.emit('changeNotification', {
      type: changeEvent.type,
      file: path.basename(changeEvent.path),
      path: changeEvent.path,
      timestamp: changeEvent.timestamp
    });
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): WatchMetrics {
    return {
      filesWatched: 0,
      changesDetected: 0,
      generationsTriggered: 0,
      averageGenerationTime: 0,
      successfulGenerations: 0,
      failedGenerations: 0
    };
  }

  /**
   * Initialize incremental state
   */
  private initializeIncrementalState(): IncrementalState {
    return {
      lastFullGeneration: new Date(0),
      modifiedFiles: new Set(),
      deletedFiles: new Set(),
      addedFiles: new Set(),
      generatedFiles: new Map(),
      checksums: new Map()
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(event: string, duration?: number): void {
    switch (event) {
      case 'generation_success':
        this.metrics.successfulGenerations++;
        this.metrics.generationsTriggered++;
        this.metrics.lastGenerationTime = new Date();
        
        if (duration) {
          const totalTime = this.metrics.averageGenerationTime * (this.metrics.successfulGenerations - 1) + duration;
          this.metrics.averageGenerationTime = totalTime / this.metrics.successfulGenerations;
        }
        break;
        
      case 'generation_failure':
        this.metrics.failedGenerations++;
        this.metrics.generationsTriggered++;
        break;
    }
  }

  /**
   * Save incremental state to disk
   */
  private async saveIncrementalState(): Promise<void> {
    const statePath = path.join(this.config.outputDir, '.watch-state.json');
    
    const state = {
      lastFullGeneration: this.incrementalState.lastFullGeneration.toISOString(),
      generatedFiles: Array.from(this.incrementalState.generatedFiles.entries()),
      checksums: Array.from(this.incrementalState.checksums.entries())
    };
    
    try {
      await fs.mkdir(path.dirname(statePath), { recursive: true });
      await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      // State saving is not critical, just log the error
      this.emit('warning', `Failed to save watch state: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Load incremental state from disk
   */
  private async loadIncrementalState(): Promise<void> {
    const statePath = path.join(this.config.outputDir, '.watch-state.json');
    
    try {
      const stateContent = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(stateContent);
      
      this.incrementalState.lastFullGeneration = new Date(state.lastFullGeneration);
      this.incrementalState.generatedFiles = new Map(state.generatedFiles || []);
      this.incrementalState.checksums = new Map(state.checksums || []);
      
      this.emit('stateLoaded', { statePath });
    } catch (error) {
      // State file might not exist, start with fresh state
      this.emit('stateCreated');
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): WatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Get watched files
   */
  getWatchedFiles(): WatchedFile[] {
    return Array.from(this.watchedFiles.values());
  }

  /**
   * Get incremental state
   */
  getIncrementalState(): IncrementalState {
    return {
      ...this.incrementalState,
      modifiedFiles: new Set(this.incrementalState.modifiedFiles),
      deletedFiles: new Set(this.incrementalState.deletedFiles),
      addedFiles: new Set(this.incrementalState.addedFiles),
      generatedFiles: new Map(this.incrementalState.generatedFiles),
      checksums: new Map(this.incrementalState.checksums)
    };
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<WatchConfiguration>): void {
    this.config = { ...this.config, ...config };
    this.emit('configurationUpdated', this.config);
  }

  /**
   * Check if watch mode is running
   */
  isWatchModeRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if generation is in progress
   */
  isGenerationInProgress(): boolean {
    return this.isGenerating;
  }

  /**
   * Get pending changes count
   */
  getPendingChangesCount(): number {
    return this.changeQueue.length;
  }

  /**
   * Clear change queue
   */
  clearChangeQueue(): void {
    this.changeQueue = [];
  }
}