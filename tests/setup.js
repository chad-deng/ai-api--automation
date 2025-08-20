"use strict";
/**
 * Jest Setup - Global test configuration
 * Week 1 Sprint 1: TDD Foundation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTempFile = exports.createTempTestFile = exports.getMemoryUsage = exports.PerformanceTimer = exports.createMockEndpoint = exports.createMockOpenAPISpec = void 0;
// Extend Jest matchers if needed
const globals_1 = require("@jest/globals");
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
// Custom Jest matchers for API test generation
globals_1.expect.extend({
    toBeValidOpenAPISpec(received) {
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
    toHaveValidTypeScript(received) {
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
    toGenerateWorkingTests(received) {
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
const createMockOpenAPISpec = (overrides = {}) => ({
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
exports.createMockOpenAPISpec = createMockOpenAPISpec;
const createMockEndpoint = (overrides = {}) => ({
    path: '/test',
    method: 'GET',
    operationId: 'testOperation',
    expectedStatus: 200,
    ...overrides
});
exports.createMockEndpoint = createMockEndpoint;
// Performance testing utilities
class PerformanceTimer {
    constructor() {
        this.startTime = 0;
    }
    start() {
        this.startTime = performance.now();
    }
    end() {
        return performance.now() - this.startTime;
    }
}
exports.PerformanceTimer = PerformanceTimer;
// Memory usage tracking
const getMemoryUsage = () => process.memoryUsage();
exports.getMemoryUsage = getMemoryUsage;
// File system test utilities
const createTempTestFile = (content) => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.ts`);
    fs.writeFileSync(tempFile, content);
    return tempFile;
};
exports.createTempTestFile = createTempTestFile;
const cleanupTempFile = (filePath) => {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};
exports.cleanupTempFile = cleanupTempFile;
//# sourceMappingURL=setup.js.map