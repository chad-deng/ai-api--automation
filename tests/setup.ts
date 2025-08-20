/**
 * Jest Setup - Global test configuration
 * Week 1 Sprint 1: TDD Foundation
 */

// Extend Jest matchers if needed
import { expect } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console noise during tests unless explicitly testing console output
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidOpenAPISpec(): R;
      toHaveValidTypeScript(): R;
      toGenerateWorkingTests(): R;
    }
  }
}

// Custom Jest matchers for API test generation
expect.extend({
  toBeValidOpenAPISpec(received: any) {
    const pass = received && 
                 received.openapi && 
                 received.info && 
                 received.paths;
    
    return {
      message: () => pass 
        ? `Expected ${JSON.stringify(received)} not to be a valid OpenAPI spec`
        : `Expected ${JSON.stringify(received)} to be a valid OpenAPI spec`,
      pass,
    };
  },

  toHaveValidTypeScript(received: string) {
    // Basic TypeScript validation
    const hasImports = received.includes('import');
    const hasFunctions = received.includes('function') || received.includes('=>');
    const hasTypes = received.includes(': ') || received.includes('<') || received.includes('interface');
    
    const pass = hasImports && (hasFunctions || hasTypes);
    
    return {
      message: () => pass 
        ? `Expected code not to have valid TypeScript structure`
        : `Expected code to have valid TypeScript structure (imports, functions, types)`,
      pass,
    };
  },

  toGenerateWorkingTests(received: string) {
    // Validate generated test structure
    const hasDescribe = received.includes('describe(');
    const hasTest = received.includes('test(') || received.includes('it(');
    const hasExpect = received.includes('expect(');
    const hasAsync = received.includes('async');
    
    const pass = hasDescribe && hasTest && hasExpect && hasAsync;
    
    return {
      message: () => pass 
        ? `Expected code not to generate working test structure`
        : `Expected code to generate working test structure (describe, test, expect, async)`,
      pass,
    };
  },
});

// Test data factories
export const createMockOpenAPISpec = (overrides: any = {}) => ({
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {
    '/users': {
      get: {
        operationId: 'getUsers',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  ...overrides
});

export const createMockEndpoint = (overrides: any = {}) => ({
  path: '/test',
  method: 'GET',
  operationId: 'testOperation',
  expectedStatus: 200,
  ...overrides
});

// Performance testing utilities
export class PerformanceTimer {
  private startTime: number = 0;
  
  start(): void {
    this.startTime = performance.now();
  }
  
  end(): number {
    return performance.now() - this.startTime;
  }
}

// Memory usage tracking
export const getMemoryUsage = (): NodeJS.MemoryUsage => process.memoryUsage();

// File system test utilities
export const createTempTestFile = (content: string): string => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.ts`);
  fs.writeFileSync(tempFile, content);
  return tempFile;
};

export const cleanupTempFile = (filePath: string): void => {
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};