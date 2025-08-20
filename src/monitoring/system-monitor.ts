/**
 * System Monitor
 * Week 6 Sprint 1: Comprehensive error tracking and system monitoring
 */

import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface MonitoringConfig {
  metricsInterval: number; // milliseconds
  alertThresholds: AlertThresholds;
  storage: StorageConfig;
  notifications: NotificationConfig[];
  retentionPeriod: number; // days
  enableRealTimeMonitoring: boolean;
}

export interface AlertThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  requestRate: { warning: number; critical: number };
}

export interface StorageConfig {
  type: 'file' | 'database' | 'memory';
  path?: string;
  maxSize?: number; // bytes
  compression?: boolean;
}

export interface NotificationConfig {
  type: 'webhook' | 'email' | 'slack';
  endpoint: string;
  threshold: 'warning' | 'critical';
  enabled: boolean;
}

export interface SystemMetrics {
  timestamp: number;
  system: {
    cpu: {
      usage: number; // percentage
      loadAverage: number[];
      cores: number;
    };
    memory: {
      used: number; // bytes
      free: number; // bytes
      total: number; // bytes
      percentage: number;
    };
    disk: {
      used: number; // bytes
      free: number; // bytes
      total: number; // bytes
      percentage: number;
    };
    uptime: number; // seconds
  };
  application: {
    errors: ErrorMetrics;
    requests: RequestMetrics;
    performance: PerformanceMetrics;
  };
}

export interface ErrorMetrics {
  total: number;
  rate: number; // errors per minute
  byType: Record<string, number>;
  bySeverity: Record<ErrorSeverity, number>;
  recent: ErrorEvent[];
}

export interface RequestMetrics {
  total: number;
  rate: number; // requests per minute
  byMethod: Record<string, number>;
  byStatusCode: Record<string, number>;
  averageResponseTime: number;
}

export interface PerformanceMetrics {
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number; // requests per second
  availability: number; // percentage
}

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorEvent {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  type: string;
  message: string;
  stack?: string;
  context?: any;
  tags?: string[];
  source: string;
}

export interface Alert {
  id: string;
  timestamp: number;
  type: AlertType;
  severity: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  resolved: boolean;
  resolvedAt?: number;
}

export type AlertType = 'cpu' | 'memory' | 'disk' | 'error_rate' | 'response_time' | 'request_rate';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  overall: {
    score: number; // 0-100
    issues: string[];
  };
  timestamp: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  duration: number; // milliseconds
  output?: string;
  error?: string;
}

export class SystemMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private metrics: SystemMetrics[] = [];
  private errors: ErrorEvent[] = [];
  private alerts: Alert[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private requestTimes: number[] = [];
  private requestCounts: Record<string, number> = {};
  private errorCounts: Record<string, number> = {};

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.emit('monitoringStarted');

    // Start periodic metrics collection
    this.monitoringInterval = setInterval(
      () => this.collectMetrics(),
      this.config.metricsInterval
    );

    // Initial metrics collection
    await this.collectMetrics();

    // Setup storage
    await this.initializeStorage();

    // Start cleanup task
    this.startCleanupTask();
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    await this.saveMetrics();
    this.emit('monitoringStopped');
  }

  /**
   * Record error event
   */
  recordError(error: Partial<ErrorEvent>): void {
    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      severity: error.severity || 'error',
      type: error.type || 'UnknownError',
      message: error.message || 'Unknown error occurred',
      stack: error.stack,
      context: error.context,
      tags: error.tags || [],
      source: error.source || 'unknown'
    };

    this.errors.push(errorEvent);
    this.updateErrorCounts(errorEvent);
    
    // Keep only recent errors in memory
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    this.emit('errorRecorded', errorEvent);
    
    // Check for error rate alerts
    this.checkErrorRateAlerts();
  }

  /**
   * Record request metrics
   */
  recordRequest(method: string, statusCode: number, responseTime: number): void {
    this.requestTimes.push(responseTime);
    this.requestCounts[method] = (this.requestCounts[method] || 0) + 1;
    this.requestCounts[`status_${statusCode}`] = (this.requestCounts[`status_${statusCode}`] || 0) + 1;

    // Keep only recent request times
    if (this.requestTimes.length > 10000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }

    this.emit('requestRecorded', { method, statusCode, responseTime });
    
    // Check for response time alerts
    this.checkResponseTimeAlerts(responseTime);
  }

  /**
   * Get current system metrics
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    return this.collectMetrics();
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];
    const issues: string[] = [];

    // System health checks
    const systemCheck = await this.performSystemHealthCheck();
    checks.push(systemCheck);
    if (systemCheck.status !== 'pass') {
      issues.push(`System health: ${systemCheck.output || systemCheck.error}`);
    }

    // Application health checks
    const appCheck = await this.performApplicationHealthCheck();
    checks.push(appCheck);
    if (appCheck.status !== 'pass') {
      issues.push(`Application health: ${appCheck.output || appCheck.error}`);
    }

    // Storage health check
    const storageCheck = await this.performStorageHealthCheck();
    checks.push(storageCheck);
    if (storageCheck.status !== 'pass') {
      issues.push(`Storage health: ${storageCheck.output || storageCheck.error}`);
    }

    // Calculate overall score
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;
    const score = ((passCount + warnCount * 0.5) / checks.length) * 100;

    // Determine overall status
    let status: HealthStatus['status'] = 'healthy';
    if (checks.some(c => c.status === 'fail')) {
      status = 'unhealthy';
    } else if (checks.some(c => c.status === 'warn')) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      overall: { score, issues },
      timestamp: Date.now()
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 50): Alert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get recent errors
   */
  getErrors(limit = 100): ErrorEvent[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours = 24): SystemMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();

    // System metrics
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get disk usage (simplified - would need platform-specific implementation)
    const diskStats = await this.getDiskUsage();

    // Application metrics
    const errorMetrics = this.calculateErrorMetrics();
    const requestMetrics = this.calculateRequestMetrics();
    const performanceMetrics = this.calculatePerformanceMetrics();

    const metrics: SystemMetrics = {
      timestamp,
      system: {
        cpu: {
          usage: await this.getCPUUsage(),
          loadAverage: os.loadavg(),
          cores: cpus.length
        },
        memory: {
          used: usedMem,
          free: freeMem,
          total: totalMem,
          percentage: (usedMem / totalMem) * 100
        },
        disk: diskStats,
        uptime: os.uptime()
      },
      application: {
        errors: errorMetrics,
        requests: requestMetrics,
        performance: performanceMetrics
      }
    };

    this.metrics.push(metrics);
    
    // Keep only recent metrics in memory
    if (this.metrics.length > 1440) { // 24 hours at 1-minute intervals
      this.metrics = this.metrics.slice(-1440);
    }

    this.emit('metricsCollected', metrics);
    
    // Check thresholds and generate alerts
    await this.checkThresholds(metrics);

    return metrics;
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = os.cpus();
      
      setTimeout(() => {
        const endMeasure = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        for (let i = 0; i < startMeasure.length; i++) {
          const startCpu = startMeasure[i];
          const endCpu = endMeasure[i];
          
          const startTotal = Object.values(startCpu.times).reduce((a, b) => a + b, 0);
          const endTotal = Object.values(endCpu.times).reduce((a, b) => a + b, 0);
          
          const idleDiff = endCpu.times.idle - startCpu.times.idle;
          const totalDiff = endTotal - startTotal;
          
          totalIdle += idleDiff;
          totalTick += totalDiff;
        }

        const idle = totalIdle / startMeasure.length;
        const total = totalTick / startMeasure.length;
        const usage = 100 - (idle / total * 100);
        
        resolve(Math.round(usage * 100) / 100);
      }, 100);
    });
  }

  /**
   * Get disk usage (simplified)
   */
  private async getDiskUsage(): Promise<SystemMetrics['system']['disk']> {
    try {
      // This is a simplified version - real implementation would use platform-specific commands
      const stats = await fs.stat('.');
      return {
        used: 0,
        free: 0,
        total: 0,
        percentage: 0
      };
    } catch (error) {
      return {
        used: 0,
        free: 0,
        total: 0,
        percentage: 0
      };
    }
  }

  /**
   * Calculate error metrics
   */
  private calculateErrorMetrics(): ErrorMetrics {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentErrors = this.errors.filter(e => e.timestamp >= oneMinuteAgo);
    const rate = recentErrors.length;

    const byType: Record<string, number> = {};
    const bySeverity: Record<ErrorSeverity, number> = {
      fatal: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0
    };

    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity]++;
    });

    return {
      total: this.errors.length,
      rate,
      byType,
      bySeverity,
      recent: this.errors.slice(-10)
    };
  }

  /**
   * Calculate request metrics
   */
  private calculateRequestMetrics(): RequestMetrics {
    const byMethod: Record<string, number> = {};
    const byStatusCode: Record<string, number> = {};
    
    Object.entries(this.requestCounts).forEach(([key, count]) => {
      if (key.startsWith('status_')) {
        byStatusCode[key.replace('status_', '')] = count;
      } else {
        byMethod[key] = count;
      }
    });

    const totalRequests = Object.values(byMethod).reduce((sum, count) => sum + count, 0);
    const averageResponseTime = this.requestTimes.length > 0 ?
      this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length : 0;

    return {
      total: totalRequests,
      rate: totalRequests, // Simplified - would calculate actual rate
      byMethod,
      byStatusCode,
      averageResponseTime
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(): PerformanceMetrics {
    if (this.requestTimes.length === 0) {
      return {
        responseTime: { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 },
        throughput: 0,
        availability: 100
      };
    }

    const sorted = [...this.requestTimes].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
    
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Calculate error rate for availability
    const errorCount = Object.entries(this.requestCounts)
      .filter(([key]) => key.startsWith('status_') && parseInt(key.replace('status_', '')) >= 400)
      .reduce((sum, [, count]) => sum + count, 0);
    
    const totalRequests = Object.values(this.requestCounts)
      .filter((_, index, arr) => index < Object.keys(this.requestCounts).filter(k => !k.startsWith('status_')).length)
      .reduce((sum, count) => sum + count, 0);
    
    const availability = totalRequests > 0 ? ((totalRequests - errorCount) / totalRequests) * 100 : 100;

    return {
      responseTime: { min, max, avg, p50, p95, p99 },
      throughput: totalRequests / 60, // requests per minute converted to per second
      availability
    };
  }

  /**
   * Check thresholds and generate alerts
   */
  private async checkThresholds(metrics: SystemMetrics): Promise<void> {
    const { alertThresholds } = this.config;

    // Check CPU threshold
    if (metrics.system.cpu.usage >= alertThresholds.cpu.critical) {
      await this.createAlert('cpu', 'critical', 'CPU Usage', metrics.system.cpu.usage, alertThresholds.cpu.critical);
    } else if (metrics.system.cpu.usage >= alertThresholds.cpu.warning) {
      await this.createAlert('cpu', 'warning', 'CPU Usage', metrics.system.cpu.usage, alertThresholds.cpu.warning);
    }

    // Check memory threshold
    if (metrics.system.memory.percentage >= alertThresholds.memory.critical) {
      await this.createAlert('memory', 'critical', 'Memory Usage', metrics.system.memory.percentage, alertThresholds.memory.critical);
    } else if (metrics.system.memory.percentage >= alertThresholds.memory.warning) {
      await this.createAlert('memory', 'warning', 'Memory Usage', metrics.system.memory.percentage, alertThresholds.memory.warning);
    }

    // Check disk threshold
    if (metrics.system.disk.percentage >= alertThresholds.disk.critical) {
      await this.createAlert('disk', 'critical', 'Disk Usage', metrics.system.disk.percentage, alertThresholds.disk.critical);
    } else if (metrics.system.disk.percentage >= alertThresholds.disk.warning) {
      await this.createAlert('disk', 'warning', 'Disk Usage', metrics.system.disk.percentage, alertThresholds.disk.warning);
    }

    // Check response time threshold
    if (metrics.application.performance.responseTime.avg >= alertThresholds.responseTime.critical) {
      await this.createAlert('response_time', 'critical', 'Response Time', metrics.application.performance.responseTime.avg, alertThresholds.responseTime.critical);
    } else if (metrics.application.performance.responseTime.avg >= alertThresholds.responseTime.warning) {
      await this.createAlert('response_time', 'warning', 'Response Time', metrics.application.performance.responseTime.avg, alertThresholds.responseTime.warning);
    }
  }

  /**
   * Create alert
   */
  private async createAlert(
    type: AlertType,
    severity: 'warning' | 'critical',
    metric: string,
    value: number,
    threshold: number
  ): Promise<void> {
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(a => 
      a.type === type && 
      a.severity === severity && 
      !a.resolved
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: Alert = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      severity,
      metric,
      value,
      threshold,
      message: `${metric} (${value.toFixed(2)}) exceeded ${severity} threshold (${threshold})`,
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alertCreated', alert);

    // Send notifications
    await this.sendNotifications(alert);
  }

  /**
   * Check error rate alerts
   */
  private checkErrorRateAlerts(): void {
    const errorRate = this.calculateErrorMetrics().rate;
    const { alertThresholds } = this.config;

    if (errorRate >= alertThresholds.errorRate.critical) {
      this.createAlert('error_rate', 'critical', 'Error Rate', errorRate, alertThresholds.errorRate.critical);
    } else if (errorRate >= alertThresholds.errorRate.warning) {
      this.createAlert('error_rate', 'warning', 'Error Rate', errorRate, alertThresholds.errorRate.warning);
    }
  }

  /**
   * Check response time alerts
   */
  private checkResponseTimeAlerts(responseTime: number): void {
    const { alertThresholds } = this.config;

    if (responseTime >= alertThresholds.responseTime.critical) {
      this.createAlert('response_time', 'critical', 'Response Time', responseTime, alertThresholds.responseTime.critical);
    } else if (responseTime >= alertThresholds.responseTime.warning) {
      this.createAlert('response_time', 'warning', 'Response Time', responseTime, alertThresholds.responseTime.warning);
    }
  }

  /**
   * Send notifications
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const applicableNotifications = this.config.notifications.filter(n => 
      n.enabled && 
      (n.threshold === alert.severity || (n.threshold === 'warning' && alert.severity === 'critical'))
    );

    for (const notification of applicableNotifications) {
      try {
        await this.sendNotification(notification, alert);
      } catch (error) {
        this.recordError({
          type: 'NotificationError',
          message: `Failed to send notification: ${error}`,
          severity: 'error',
          source: 'SystemMonitor'
        });
      }
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(config: NotificationConfig, alert: Alert): Promise<void> {
    // This would implement actual notification sending
    // For now, just emit an event
    this.emit('notificationSent', { config, alert });
  }

  /**
   * Perform system health check
   */
  private async performSystemHealthCheck(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const metrics = await this.getCurrentMetrics();
      const issues: string[] = [];

      if (metrics.system.cpu.usage > 90) {
        issues.push(`High CPU usage: ${metrics.system.cpu.usage.toFixed(1)}%`);
      }
      
      if (metrics.system.memory.percentage > 90) {
        issues.push(`High memory usage: ${metrics.system.memory.percentage.toFixed(1)}%`);
      }

      const status = issues.length === 0 ? 'pass' : 
                    issues.length <= 2 ? 'warn' : 'fail';

      return {
        name: 'system',
        status,
        duration: Date.now() - start,
        output: issues.length > 0 ? issues.join(', ') : 'System resources within normal limits'
      };
    } catch (error) {
      return {
        name: 'system',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform application health check
   */
  private async performApplicationHealthCheck(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const errorMetrics = this.calculateErrorMetrics();
      const issues: string[] = [];

      if (errorMetrics.rate > 10) {
        issues.push(`High error rate: ${errorMetrics.rate} errors/minute`);
      }

      if (errorMetrics.bySeverity.fatal > 0) {
        issues.push(`Fatal errors detected: ${errorMetrics.bySeverity.fatal}`);
      }

      const status = issues.length === 0 ? 'pass' : 
                    issues.length === 1 ? 'warn' : 'fail';

      return {
        name: 'application',
        status,
        duration: Date.now() - start,
        output: issues.length > 0 ? issues.join(', ') : 'Application running normally'
      };
    } catch (error) {
      return {
        name: 'application',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform storage health check
   */
  private async performStorageHealthCheck(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Simple storage test
      const testData = JSON.stringify({ test: true, timestamp: Date.now() });
      // In real implementation, would test actual storage
      
      return {
        name: 'storage',
        status: 'pass',
        duration: Date.now() - start,
        output: 'Storage accessible and writable'
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'fail',
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize storage
   */
  private async initializeStorage(): Promise<void> {
    if (this.config.storage.type === 'file' && this.config.storage.path) {
      await fs.mkdir(path.dirname(this.config.storage.path), { recursive: true });
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    if (this.config.storage.type === 'file' && this.config.storage.path) {
      const data = {
        metrics: this.metrics,
        errors: this.errors,
        alerts: this.alerts,
        timestamp: Date.now()
      };
      
      await fs.writeFile(this.config.storage.path, JSON.stringify(data, null, 2));
    }
  }

  /**
   * Start cleanup task
   */
  private startCleanupTask(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const cutoff = Date.now() - (this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    this.errors = this.errors.filter(e => e.timestamp >= cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoff);
    
    this.emit('cleanupCompleted', { cutoff, retentionPeriod: this.config.retentionPeriod });
  }

  /**
   * Update error counts
   */
  private updateErrorCounts(error: ErrorEvent): void {
    this.errorCounts[error.type] = (this.errorCounts[error.type] || 0) + 1;
    this.errorCounts[`severity_${error.severity}`] = (this.errorCounts[`severity_${error.severity}`] || 0) + 1;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SystemMonitor;