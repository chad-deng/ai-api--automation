/**
 * Day 4: Hybrid Template+AST Integration - Comprehensive Exercise
 * Training Week 0 - Hybrid Architecture Deep Dive
 */

import { Project, ScriptTarget, ModuleKind, SourceFile } from 'ts-morph';

/**
 * Hybrid Generator - The core pattern for our API test generator
 * Combines template-based structure with AST-enhanced logic
 */
export class HybridTestGenerator {
  private project: Project;
  private spec: any; // OpenAPI specification

  constructor(spec: any) {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.CommonJS,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true
      }
    });
    this.spec = spec;
  }

  /**
   * HYBRID APPROACH: Generate test file using Template+AST combination
   */
  async generateTestFile(apiName: string, endpoints: EndpointInfo[]): Promise<string> {
    // STEP 1: Template-based base structure
    const templateStructure = this.generateTemplateBase(apiName);
    
    // STEP 2: Create source file from template
    const sourceFile = this.project.createSourceFile(`${apiName}.test.ts`, templateStructure);
    
    // STEP 3: AST enhancement for dynamic content
    await this.enhanceWithAST(sourceFile, endpoints);
    
    // STEP 4: Validate and format
    const finalCode = this.validateAndFormat(sourceFile);
    
    return finalCode;
  }

  /**
   * TEMPLATE PHASE: Generate consistent base structure
   */
  private generateTemplateBase(apiName: string): string {
    return `
// Generated Test File: ${apiName}
// Template+AST Hybrid Generation
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';

describe('${apiName} API Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup authentication if needed
    if (process.env.API_TOKEN) {
      authToken = process.env.API_TOKEN;
    }
  });

  afterAll(async () => {
    // Cleanup after tests
  });

  // Test cases will be injected here via AST
  // PLACEHOLDER_TEST_CASES
});
`;
  }

  /**
   * AST PHASE: Inject dynamic test logic based on OpenAPI spec
   */
  private async enhanceWithAST(sourceFile: SourceFile, endpoints: EndpointInfo[]): Promise<void> {
    // Find the describe block
    const describeCall = sourceFile.getDescendantsOfKind('CallExpression')
      .find(call => call.getExpression().getText() === 'describe');

    if (!describeCall) throw new Error('Could not find describe block');

    // Get the callback function (second argument of describe)
    const callback = describeCall.getArguments()[1];
    if (!callback || callback.getKind() !== 'ArrowFunction') {
      throw new Error('Invalid describe callback structure');
    }

    const callbackBody = callback.asKindOrThrow('ArrowFunction').getBody();
    if (callbackBody.getKind() !== 'Block') {
      throw new Error('Expected block statement in describe callback');
    }

    const blockStatement = callbackBody.asKindOrThrow('Block');

    // Generate test cases for each endpoint using AST
    for (const endpoint of endpoints) {
      const testFunction = this.generateEndpointTest(endpoint);
      
      // Insert before the closing brace
      blockStatement.addStatements([testFunction]);
    }
  }

  /**
   * AST-GENERATED: Individual test case based on endpoint specification
   */
  private generateEndpointTest(endpoint: EndpointInfo): string {
    const testName = this.generateTestName(endpoint);
    const testBody = this.generateTestBody(endpoint);

    return `
  test('${testName}', async () => {
${testBody}
  });`;
  }

  /**
   * Generate meaningful test names from endpoint info
   */
  private generateTestName(endpoint: EndpointInfo): string {
    const operation = endpoint.operationId || `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return `${operation} - should ${this.getExpectedBehavior(endpoint)}`;
  }

  /**
   * Generate expected behavior description
   */
  private getExpectedBehavior(endpoint: EndpointInfo): string {
    const statusCode = endpoint.expectedStatus || 200;
    const method = endpoint.method.toUpperCase();
    
    const behaviors = {
      200: 'return success response',
      201: 'create resource successfully',
      204: 'delete resource successfully',
      400: 'handle invalid request',
      401: 'require authentication',
      404: 'handle not found',
      500: 'handle server error'
    };

    return behaviors[statusCode] || `respond with ${statusCode}`;
  }

  /**
   * AST-GENERATED: Test body with dynamic request building
   */
  private generateTestBody(endpoint: EndpointInfo): string {
    const lines = [];
    
    // Generate test data if needed
    if (endpoint.requestSchema) {
      const testData = this.generateTestData(endpoint.requestSchema);
      lines.push(`    const testData = ${JSON.stringify(testData, null, 4)};`);
    }

    // Build request chain
    lines.push(`    const response = await request(app)`);
    lines.push(`      .${endpoint.method.toLowerCase()}('${endpoint.path}')`);

    // Add authentication
    if (endpoint.requiresAuth) {
      lines.push(`      .set('Authorization', \`Bearer \${authToken}\`)`);
    }

    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestSchema) {
      lines.push(`      .send(testData)`);
    }

    // Add query parameters
    if (endpoint.queryParams && endpoint.queryParams.length > 0) {
      endpoint.queryParams.forEach(param => {
        const value = this.generateParamValue(param);
        lines.push(`      .query({ ${param.name}: ${value} })`);
      });
    }

    // Add expectations
    lines.push(`      .expect(${endpoint.expectedStatus || 200});`);

    // Add response validation
    if (endpoint.responseSchema) {
      lines.push(``);
      lines.push(`    // Validate response structure`);
      const validations = this.generateResponseValidation(endpoint.responseSchema);
      lines.push(...validations);
    }

    return lines.join('\n');
  }

  /**
   * Schema-aware test data generation
   */
  private generateTestData(schema: any): any {
    if (!schema || !schema.properties) return {};

    const testData = {};
    for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
      const prop = propertySchema as any;
      testData[propertyName] = this.generateValueForType(prop);
    }

    return testData;
  }

  /**
   * Generate values based on schema types
   */
  private generateValueForType(schema: any): any {
    switch (schema.type) {
      case 'string':
        if (schema.format === 'email') return 'test@example.com';
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
        if (schema.enum) return schema.enum[0];
        return schema.example || 'test_string';
        
      case 'integer':
      case 'number':
        return schema.example || schema.minimum || 42;
        
      case 'boolean':
        return schema.example !== undefined ? schema.example : true;
        
      case 'array':
        if (schema.items) {
          return [this.generateValueForType(schema.items)];
        }
        return [];
        
      case 'object':
        if (schema.properties) {
          return this.generateTestData(schema);
        }
        return {};
        
      default:
        return null;
    }
  }

  /**
   * Generate query parameter values
   */
  private generateParamValue(param: any): string {
    const value = this.generateValueForType(param.schema || param);
    return typeof value === 'string' ? `'${value}'` : String(value);
  }

  /**
   * Generate response validation assertions
   */
  private generateResponseValidation(responseSchema: any): string[] {
    const validations = [];

    if (responseSchema.type === 'object' && responseSchema.properties) {
      Object.keys(responseSchema.properties).forEach(property => {
        validations.push(`    expect(response.body).toHaveProperty('${property}');`);
      });
    }

    if (responseSchema.type === 'array') {
      validations.push(`    expect(Array.isArray(response.body)).toBe(true);`);
      if (responseSchema.items && responseSchema.items.properties) {
        validations.push(`    if (response.body.length > 0) {`);
        Object.keys(responseSchema.items.properties).forEach(property => {
          validations.push(`      expect(response.body[0]).toHaveProperty('${property}');`);
        });
        validations.push(`    }`);
      }
    }

    return validations;
  }

  /**
   * Final validation and formatting
   */
  private validateAndFormat(sourceFile: SourceFile): string {
    // Check for compilation errors
    const diagnostics = this.project.getPreEmitDiagnostics();
    if (diagnostics.length > 0) {
      console.warn('TypeScript compilation warnings:', diagnostics.map(d => d.getMessageText()));
    }

    // Get formatted text
    let formattedText = sourceFile.getFullText();

    // Remove placeholder comments
    formattedText = formattedText.replace(/\s*\/\/ PLACEHOLDER_TEST_CASES\s*/, '');

    return formattedText;
  }
}

/**
 * Performance monitoring for large API processing
 */
export class PerformanceMonitor {
  private startTime: number;
  private startMemory: NodeJS.MemoryUsage;

  start(): void {
    this.startTime = performance.now();
    this.startMemory = process.memoryUsage();
  }

  end(): PerformanceMetrics {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    return {
      duration: endTime - this.startTime,
      memoryUsed: (endMemory.heapUsed - this.startMemory.heapUsed) / 1024 / 1024, // MB
      memoryPeak: endMemory.heapUsed / 1024 / 1024 // MB
    };
  }
}

/**
 * Comprehensive training exercise - Generate tests for JSONPlaceholder API
 */
export class Day4TrainingExercise {
  async runCompleteExample(): Promise<ExerciseResult> {
    const monitor = new PerformanceMonitor();
    monitor.start();

    try {
      // Mock JSONPlaceholder OpenAPI spec
      const spec = {
        info: { title: 'JSONPlaceholder API' },
        paths: {
          '/posts': {
            get: { operationId: 'getAllPosts' },
            post: { operationId: 'createPost' }
          },
          '/posts/{id}': {
            get: { operationId: 'getPost' },
            put: { operationId: 'updatePost' },
            delete: { operationId: 'deletePost' }
          }
        }
      };

      // Define endpoints for testing
      const endpoints: EndpointInfo[] = [
        {
          path: '/posts',
          method: 'GET',
          operationId: 'getAllPosts',
          expectedStatus: 200,
          queryParams: [
            { name: 'userId', schema: { type: 'integer' } },
            { name: '_limit', schema: { type: 'integer', minimum: 1, maximum: 100 } }
          ]
        },
        {
          path: '/posts',
          method: 'POST',
          operationId: 'createPost',
          expectedStatus: 201,
          requestSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', example: 'New Post' },
              body: { type: 'string', example: 'Post content here' },
              userId: { type: 'integer', example: 1 }
            }
          },
          requiresAuth: false
        },
        {
          path: '/posts/1',
          method: 'GET',
          operationId: 'getPost',
          expectedStatus: 200,
          responseSchema: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              title: { type: 'string' },
              body: { type: 'string' },
              userId: { type: 'integer' }
            }
          }
        }
      ];

      // Generate test file using hybrid approach
      const generator = new HybridTestGenerator(spec);
      const generatedTest = await generator.generateTestFile('JSONPlaceholder', endpoints);

      const metrics = monitor.end();

      return {
        success: true,
        generatedCode: generatedTest,
        performance: metrics,
        endpointCount: endpoints.length,
        linesGenerated: generatedTest.split('\n').length
      };

    } catch (error) {
      const metrics = monitor.end();
      return {
        success: false,
        error: error.message,
        performance: metrics,
        endpointCount: 0,
        linesGenerated: 0
      };
    }
  }

  /**
   * Validate that generated code meets quality standards
   */
  validateGeneratedCode(code: string): ValidationResult {
    const validations = {
      hasImports: code.includes('import'),
      hasDescribe: code.includes('describe('),
      hasTests: code.includes('test('),
      hasAsync: code.includes('async'),
      hasRequest: code.includes('request(app)'),
      hasExpectations: code.includes('.expect('),
      hasAuth: code.includes('Authorization'),
      isValidTypeScript: !code.includes('undefined') || code.includes('// AST')
    };

    const passed = Object.values(validations).filter(v => v).length;
    const total = Object.keys(validations).length;

    return {
      score: passed / total,
      validations,
      passed: passed === total,
      issues: Object.entries(validations)
        .filter(([_, valid]) => !valid)
        .map(([check, _]) => `Missing: ${check}`)
    };
  }
}

// Type definitions
export interface EndpointInfo {
  path: string;
  method: string;
  operationId?: string;
  expectedStatus?: number;
  requestSchema?: any;
  responseSchema?: any;
  queryParams?: Array<{ name: string; schema: any }>;
  requiresAuth?: boolean;
}

export interface PerformanceMetrics {
  duration: number; // milliseconds
  memoryUsed: number; // MB
  memoryPeak: number; // MB
}

export interface ExerciseResult {
  success: boolean;
  generatedCode?: string;
  error?: string;
  performance: PerformanceMetrics;
  endpointCount: number;
  linesGenerated: number;
}

export interface ValidationResult {
  score: number; // 0-1
  validations: Record<string, boolean>;
  passed: boolean;
  issues: string[];
}

/**
 * Execute Day 4 training and validation
 */
export async function executeDay4Training(): Promise<boolean> {
  console.log('🚀 Starting Day 4: Hybrid Template+AST Integration Training');

  const exercise = new Day4TrainingExercise();
  const result = await exercise.runCompleteExample();

  console.log('📊 Training Results:');
  console.log(`- Success: ${result.success}`);
  console.log(`- Duration: ${result.performance.duration.toFixed(2)}ms`);
  console.log(`- Memory Used: ${result.performance.memoryUsed.toFixed(2)}MB`);
  console.log(`- Endpoints Processed: ${result.endpointCount}`);
  console.log(`- Lines Generated: ${result.linesGenerated}`);

  if (result.success && result.generatedCode) {
    const validation = exercise.validateGeneratedCode(result.generatedCode);
    console.log(`- Code Quality Score: ${(validation.score * 100).toFixed(1)}%`);
    
    if (validation.issues.length > 0) {
      console.log('⚠️  Issues found:', validation.issues);
    }

    // Show sample of generated code
    console.log('\n📝 Generated Code Sample:');
    console.log(result.generatedCode.split('\n').slice(0, 20).join('\n') + '\n...');

    return validation.passed && result.performance.duration < 1000; // < 1 second
  }

  if (!result.success) {
    console.error('❌ Training failed:', result.error);
  }

  return false;
}