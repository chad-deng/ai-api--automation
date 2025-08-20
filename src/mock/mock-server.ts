/**
 * Mock Server Generator
 * Week 5 Sprint 1: Dynamic mock server creation from OpenAPI specs
 */

import * as http from 'http';
import * as https from 'https';
import * as express from 'express';
import * as cors from 'cors';
import * as compression from 'compression';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ParsedOpenAPI, Operation, Schema, Response } from '../types';
import { OpenAPIParser } from '../parser/openapi-parser';
import { EventEmitter } from 'events';

export interface MockServerConfig {
  port: number;
  host?: string;
  https?: HttpsConfig;
  cors?: CorsConfig;
  responseDelay?: ResponseDelayConfig;
  logging?: LoggingConfig;
  persistence?: PersistenceConfig;
  scenarios?: MockScenario[];
  middleware?: MiddlewareConfig[];
}

export interface HttpsConfig {
  enabled: boolean;
  cert?: string;
  key?: string;
  passphrase?: string;
}

export interface CorsConfig {
  enabled: boolean;
  origin?: string | string[];
  credentials?: boolean;
  methods?: string[];
  headers?: string[];
}

export interface ResponseDelayConfig {
  min: number; // milliseconds
  max: number; // milliseconds
  distribution: 'fixed' | 'random' | 'normal';
}

export interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'combined' | 'common';
  file?: string;
}

export interface PersistenceConfig {
  enabled: boolean;
  type: 'memory' | 'file' | 'redis';
  path?: string;
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
}

export interface MockScenario {
  name: string;
  description?: string;
  active: boolean;
  routes: MockRoute[];
  conditions?: ScenarioCondition[];
}

export interface MockRoute {
  method: string;
  path: string;
  statusCode: number;
  response: any;
  headers?: Record<string, string>;
  delay?: number;
  probability?: number; // 0-1, for flaky responses
  conditions?: RouteCondition[];
}

export interface ScenarioCondition {
  type: 'header' | 'query' | 'body' | 'time' | 'count';
  field?: string;
  operator: 'equals' | 'contains' | 'matches' | 'gt' | 'lt';
  value: any;
}

export interface RouteCondition extends ScenarioCondition {}

export interface MiddlewareConfig {
  name: string;
  path: string;
  options?: any;
}

export interface MockServerInfo {
  url: string;
  port: number;
  host: string;
  https: boolean;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  routes: number;
  scenarios: number;
  uptime: number;
}

export interface RequestLog {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body: any;
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    time: number;
  };
  scenario?: string;
}

export interface MockMetrics {
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: Record<string, number>;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  errorRate: number;
  averageResponseSize: number;
}

export class MockServer extends EventEmitter {
  private app: express.Application;
  private server?: http.Server | https.Server;
  private config: MockServerConfig;
  private spec?: ParsedOpenAPI;
  private routes: Map<string, MockRoute> = new Map();
  private scenarios: Map<string, MockScenario> = new Map();
  private requestLogs: RequestLog[] = [];
  private metrics: MockMetrics;
  private startTime?: number;
  private requestCounter = 0;

  constructor(config: MockServerConfig) {
    super();
    this.config = config;
    this.app = express();
    this.metrics = this.initializeMetrics();
    this.setupMiddleware();
  }

  /**
   * Generate mock server from OpenAPI specification
   */
  async generateFromSpec(specPath: string): Promise<void> {
    const parser = new OpenAPIParser();
    const result = await parser.parseFromFile(specPath, { strict: false });
    
    if (!result.success || !result.spec) {
      throw new Error(`Failed to parse OpenAPI spec: ${result.error}`);
    }

    this.spec = result.spec;
    await this.generateRoutes();
    this.setupRoutes();
    this.setupDefaultHandlers();
  }

  /**
   * Start the mock server
   */
  async start(): Promise<MockServerInfo> {
    return new Promise((resolve, reject) => {
      try {
        this.emit('starting');
        
        const serverCallback = (err?: Error) => {
          if (err) {
            this.emit('error', err);
            reject(err);
          } else {
            this.startTime = Date.now();
            this.emit('started', this.getServerInfo());
            resolve(this.getServerInfo());
          }
        };

        if (this.config.https?.enabled) {
          this.startHttpsServer(serverCallback);
        } else {
          this.startHttpServer(serverCallback);
        }

      } catch (error) {
        this.emit('error', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the mock server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.emit('stopping');
      
      this.server.close((err) => {
        if (err) {
          this.emit('error', err);
          reject(err);
        } else {
          this.server = undefined;
          this.startTime = undefined;
          this.emit('stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Get server information
   */
  getServerInfo(): MockServerInfo {
    const isHttps = this.config.https?.enabled || false;
    const protocol = isHttps ? 'https' : 'http';
    const host = this.config.host || 'localhost';
    
    return {
      url: `${protocol}://${host}:${this.config.port}`,
      port: this.config.port,
      host,
      https: isHttps,
      status: this.getServerStatus(),
      routes: this.routes.size,
      scenarios: this.scenarios.size,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Get server metrics
   */
  getMetrics(): MockMetrics {
    return { ...this.metrics };
  }

  /**
   * Get request logs
   */
  getRequestLogs(limit = 100): RequestLog[] {
    return this.requestLogs.slice(-limit);
  }

  /**
   * Add custom route
   */
  addRoute(route: MockRoute): void {
    const key = `${route.method.toUpperCase()}:${route.path}`;
    this.routes.set(key, route);
    this.setupRoute(route);
    this.emit('routeAdded', route);
  }

  /**
   * Remove route
   */
  removeRoute(method: string, path: string): boolean {
    const key = `${method.toUpperCase()}:${path}`;
    const deleted = this.routes.delete(key);
    if (deleted) {
      this.emit('routeRemoved', { method, path });
    }
    return deleted;
  }

  /**
   * Add scenario
   */
  addScenario(scenario: MockScenario): void {
    this.scenarios.set(scenario.name, scenario);
    
    if (scenario.active) {
      this.activateScenario(scenario.name);
    }
    
    this.emit('scenarioAdded', scenario);
  }

  /**
   * Activate scenario
   */
  activateScenario(scenarioName: string): void {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) return;

    // Deactivate other scenarios
    this.scenarios.forEach((s, name) => {
      if (name !== scenarioName) {
        s.active = false;
      }
    });

    scenario.active = true;
    
    // Setup scenario routes
    scenario.routes.forEach(route => {
      this.addRoute(route);
    });

    this.emit('scenarioActivated', scenarioName);
  }

  /**
   * Deactivate scenario
   */
  deactivateScenario(scenarioName: string): void {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) return;

    scenario.active = false;
    this.emit('scenarioDeactivated', scenarioName);
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Compression
    this.app.use(compression());

    // CORS
    if (this.config.cors?.enabled) {
      const corsOptions: cors.CorsOptions = {
        origin: this.config.cors.origin || true,
        credentials: this.config.cors.credentials || false,
        methods: this.config.cors.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        allowedHeaders: this.config.cors.headers || ['Content-Type', 'Authorization', 'X-Requested-With']
      };
      this.app.use(cors(corsOptions));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    if (this.config.middleware) {
      this.config.middleware.forEach(middleware => {
        // In a real implementation, this would load custom middleware
        this.emit('middlewareLoaded', middleware);
      });
    }

    // Request logging and metrics
    this.app.use((req, res, next) => {
      this.logRequest(req, res, next);
    });
  }

  /**
   * Generate routes from OpenAPI spec
   */
  private async generateRoutes(): Promise<void> {
    if (!this.spec?.paths) return;

    const operations = await new OpenAPIParser().extractOperations(this.spec);

    operations.forEach(({ method, path, operation }) => {
      const mockRoute = this.createMockRoute(method, path, operation);
      this.routes.set(`${method.toUpperCase()}:${path}`, mockRoute);
    });
  }

  /**
   * Create mock route from operation
   */
  private createMockRoute(method: string, path: string, operation: Operation): MockRoute {
    // Find first success response (2xx)
    const successResponse = Object.entries(operation.responses || {})
      .find(([code]) => code.startsWith('2') || code === 'default');

    const [statusCode, response] = successResponse || ['200', { description: 'Success' }];
    
    return {
      method: method.toUpperCase(),
      path: this.convertPathToExpress(path),
      statusCode: parseInt(statusCode) || 200,
      response: this.generateMockResponse(response, operation),
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Server': 'true'
      }
    };
  }

  /**
   * Convert OpenAPI path to Express path
   */
  private convertPathToExpress(path: string): string {
    return path.replace(/\{([^}]+)\}/g, ':$1');
  }

  /**
   * Generate mock response
   */
  private generateMockResponse(response: Response, operation: Operation): any {
    // Check for examples in response
    if (response.content) {
      const jsonContent = response.content['application/json'];
      if (jsonContent?.example) {
        return jsonContent.example;
      }
      if (jsonContent?.examples) {
        const firstExample = Object.values(jsonContent.examples)[0];
        if (firstExample && typeof firstExample === 'object' && 'value' in firstExample) {
          return firstExample.value;
        }
      }
      if (jsonContent?.schema) {
        return this.generateDataFromSchema(jsonContent.schema);
      }
    }

    // Generate response based on operation type
    const method = operation.method?.toLowerCase();
    const hasId = operation.path?.includes('{id}');

    switch (method) {
      case 'get':
        if (hasId) {
          return { id: 1, name: 'Mock Item', status: 'active' };
        } else {
          return [
            { id: 1, name: 'Mock Item 1', status: 'active' },
            { id: 2, name: 'Mock Item 2', status: 'inactive' }
          ];
        }
      case 'post':
        return { id: Math.floor(Math.random() * 1000) + 1, status: 'created' };
      case 'put':
      case 'patch':
        return { id: 1, status: 'updated' };
      case 'delete':
        return { status: 'deleted' };
      default:
        return { message: response.description || 'Success' };
    }
  }

  /**
   * Generate data from schema
   */
  private generateDataFromSchema(schema: Schema): any {
    if (schema.example !== undefined) {
      return schema.example;
    }

    if (!schema.type) {
      if (schema.properties) {
        return this.generateObjectFromProperties(schema.properties);
      }
      return 'mock-value';
    }

    switch (schema.type) {
      case 'string':
        return schema.format === 'email' ? 'test@example.com' : 'mock-string';
      case 'number':
        return 42.5;
      case 'integer':
        return 42;
      case 'boolean':
        return true;
      case 'array':
        const itemSchema = schema.items || { type: 'string' };
        return [
          this.generateDataFromSchema(itemSchema as Schema),
          this.generateDataFromSchema(itemSchema as Schema)
        ];
      case 'object':
        if (schema.properties) {
          return this.generateObjectFromProperties(schema.properties);
        }
        return { mock: 'object' };
      default:
        return null;
    }
  }

  /**
   * Generate object from properties
   */
  private generateObjectFromProperties(properties: Record<string, Schema>): any {
    const obj: any = {};
    
    Object.entries(properties).forEach(([key, propSchema]) => {
      obj[key] = this.generateDataFromSchema(propSchema);
    });

    return obj;
  }

  /**
   * Setup all routes
   */
  private setupRoutes(): void {
    this.routes.forEach(route => {
      this.setupRoute(route);
    });
  }

  /**
   * Setup individual route
   */
  private setupRoute(route: MockRoute): void {
    const method = route.method.toLowerCase() as keyof express.Application;
    
    if (typeof this.app[method] === 'function') {
      (this.app[method] as any)(route.path, async (req: express.Request, res: express.Response) => {
        await this.handleMockRequest(req, res, route);
      });
    }
  }

  /**
   * Handle mock request
   */
  private async handleMockRequest(
    req: express.Request, 
    res: express.Response, 
    route: MockRoute
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Check route conditions
      if (route.conditions && !this.evaluateConditions(route.conditions, req)) {
        res.status(404).json({ error: 'Route condition not met' });
        return;
      }

      // Check probability for flaky responses
      if (route.probability && Math.random() > route.probability) {
        res.status(503).json({ error: 'Service temporarily unavailable' });
        return;
      }

      // Apply response delay
      const delay = this.calculateDelay(route.delay);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Set headers
      if (route.headers) {
        Object.entries(route.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // Send response
      let responseData = route.response;
      
      // Replace path parameters in response
      if (typeof responseData === 'object' && responseData !== null) {
        responseData = this.replacePlaceholders(responseData, req);
      }

      res.status(route.statusCode).json(responseData);

      // Update metrics
      this.updateMetrics(req, res, Date.now() - startTime);

    } catch (error) {
      this.emit('error', error);
      res.status(500).json({ 
        error: 'Mock server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Setup default handlers
   */
  private setupDefaultHandlers(): void {
    // Health check endpoint
    this.app.get('/_mock/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: this.startTime ? Date.now() - this.startTime : 0,
        routes: this.routes.size,
        scenarios: this.scenarios.size,
        version: '1.0.0'
      });
    });

    // Metrics endpoint
    this.app.get('/_mock/metrics', (req, res) => {
      res.json(this.getMetrics());
    });

    // Logs endpoint
    this.app.get('/_mock/logs', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 100;
      res.json(this.getRequestLogs(limit));
    });

    // Scenarios management
    this.app.get('/_mock/scenarios', (req, res) => {
      res.json(Array.from(this.scenarios.values()));
    });

    this.app.post('/_mock/scenarios/:name/activate', (req, res) => {
      this.activateScenario(req.params.name);
      res.json({ status: 'activated', scenario: req.params.name });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `No mock route found for ${req.method} ${req.originalUrl}`,
        availableRoutes: Array.from(this.routes.keys())
      });
    });

    // Error handler
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.emit('error', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
      });
    });
  }

  /**
   * Log request and update metrics
   */
  private logRequest(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const startTime = Date.now();
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;

    // Capture request details
    const logEntry: Partial<RequestLog> = {
      id: requestId,
      timestamp: startTime,
      method: req.method,
      path: req.path,
      query: req.query,
      headers: req.headers as Record<string, string>,
      body: req.body
    };

    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(this: express.Response, chunk?: any) {
      const endTime = Date.now();
      
      const completeLog: RequestLog = {
        ...logEntry as RequestLog,
        response: {
          statusCode: res.statusCode,
          headers: res.getHeaders() as Record<string, string>,
          body: chunk,
          time: endTime - startTime
        }
      };

      // Add to logs
      const server = this.locals?.mockServer as MockServer;
      if (server) {
        server.requestLogs.push(completeLog);
        
        // Keep only last 1000 logs
        if (server.requestLogs.length > 1000) {
          server.requestLogs = server.requestLogs.slice(-1000);
        }

        server.emit('request', completeLog);
      }

      originalEnd.call(this, chunk);
    };

    res.locals.mockServer = this;
    next();
  }

  /**
   * Calculate response delay
   */
  private calculateDelay(routeDelay?: number): number {
    if (routeDelay !== undefined) return routeDelay;
    
    const config = this.config.responseDelay;
    if (!config) return 0;

    switch (config.distribution) {
      case 'fixed':
        return config.min;
      case 'random':
        return Math.random() * (config.max - config.min) + config.min;
      case 'normal':
        // Simple normal distribution approximation
        const mean = (config.min + config.max) / 2;
        const stdDev = (config.max - config.min) / 6;
        return Math.max(0, mean + (Math.random() - 0.5) * 2 * stdDev);
      default:
        return 0;
    }
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: RouteCondition[], req: express.Request): boolean {
    return conditions.every(condition => {
      let actualValue: any;

      switch (condition.type) {
        case 'header':
          actualValue = req.headers[condition.field!];
          break;
        case 'query':
          actualValue = req.query[condition.field!];
          break;
        case 'body':
          actualValue = condition.field ? req.body[condition.field] : req.body;
          break;
        default:
          return true;
      }

      return this.compareValues(actualValue, condition.value, condition.operator);
    });
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'matches':
        return new RegExp(expected).test(String(actual));
      case 'gt':
        return Number(actual) > Number(expected);
      case 'lt':
        return Number(actual) < Number(expected);
      default:
        return false;
    }
  }

  /**
   * Replace placeholders in response with request data
   */
  private replacePlaceholders(response: any, req: express.Request): any {
    const responseStr = JSON.stringify(response);
    let replacedStr = responseStr;

    // Replace path parameters
    Object.entries(req.params).forEach(([key, value]) => {
      replacedStr = replacedStr.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Replace query parameters
    Object.entries(req.query).forEach(([key, value]) => {
      replacedStr = replacedStr.replace(new RegExp(`{{query.${key}}}`, 'g'), String(value));
    });

    return JSON.parse(replacedStr);
  }

  /**
   * Update metrics
   */
  private updateMetrics(req: express.Request, res: express.Response, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.requestsByMethod[req.method] = (this.metrics.requestsByMethod[req.method] || 0) + 1;
    this.metrics.requestsByPath[req.path] = (this.metrics.requestsByPath[req.path] || 0) + 1;

    if (res.statusCode >= 400) {
      // Update error rate calculation would go here
    }

    // Update response times (simplified)
    // In production, would use a proper metrics library
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): MockMetrics {
    return {
      totalRequests: 0,
      requestsByMethod: {},
      requestsByPath: {},
      responseTimeP50: 0,
      responseTimeP95: 0,
      responseTimeP99: 0,
      errorRate: 0,
      averageResponseSize: 0
    };
  }

  /**
   * Start HTTP server
   */
  private startHttpServer(callback: (err?: Error) => void): void {
    this.server = http.createServer(this.app);
    this.server.listen(this.config.port, this.config.host, callback);
  }

  /**
   * Start HTTPS server
   */
  private async startHttpsServer(callback: (err?: Error) => void): Promise<void> {
    const httpsConfig = this.config.https!;
    
    try {
      const options: https.ServerOptions = {};

      if (httpsConfig.cert && httpsConfig.key) {
        options.cert = await fs.readFile(httpsConfig.cert);
        options.key = await fs.readFile(httpsConfig.key);
        
        if (httpsConfig.passphrase) {
          options.passphrase = httpsConfig.passphrase;
        }
      }

      this.server = https.createServer(options, this.app);
      this.server.listen(this.config.port, this.config.host, callback);
      
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Get server status
   */
  private getServerStatus(): MockServerInfo['status'] {
    if (!this.server) return 'stopped';
    return this.server.listening ? 'running' : 'starting';
  }

  /**
   * Export server configuration
   */
  async exportConfiguration(): Promise<any> {
    return {
      config: this.config,
      routes: Array.from(this.routes.values()),
      scenarios: Array.from(this.scenarios.values()),
      spec: this.spec
    };
  }

  /**
   * Import server configuration
   */
  async importConfiguration(config: any): Promise<void> {
    if (config.routes) {
      config.routes.forEach((route: MockRoute) => {
        this.addRoute(route);
      });
    }

    if (config.scenarios) {
      config.scenarios.forEach((scenario: MockScenario) => {
        this.addScenario(scenario);
      });
    }

    this.emit('configurationImported');
  }
}

export default MockServer;