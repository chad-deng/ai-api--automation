"use strict";
/**
 * Parser Performance Tests
 * Week 1 Sprint 2: Performance benchmarks for OpenAPI parsing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const openapi_parser_1 = require("../../src/parser/openapi-parser");
const openapi_validator_1 = require("../../src/validator/openapi-validator");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
describe('Parser Performance', () => {
    let parser;
    let validator;
    const fixturesDir = path.join(__dirname, '../fixtures');
    const petstoreFixture = path.join(fixturesDir, 'petstore-openapi.json');
    beforeEach(() => {
        parser = new openapi_parser_1.OpenAPIParser();
        validator = new openapi_validator_1.OpenAPIValidator();
    });
    describe('Parsing Performance', () => {
        test('should parse petstore spec within time limit', async () => {
            const startTime = performance.now();
            const result = await parser.parseFromFile(petstoreFixture);
            const duration = performance.now() - startTime;
            expect(result.success).toBe(true);
            expect(duration).toBeLessThan(500); // Should parse in under 500ms
        });
        test('should validate petstore spec within time limit', async () => {
            const startTime = performance.now();
            const result = await validator.validateFromFile(petstoreFixture);
            const duration = performance.now() - startTime;
            expect(result.isValid).toBe(true);
            expect(duration).toBeLessThan(1000); // Should validate in under 1s
        });
        test('should handle multiple parallel parsing operations', async () => {
            const startTime = performance.now();
            const operations = Array(10).fill(null).map(() => parser.parseFromFile(petstoreFixture));
            const results = await Promise.all(operations);
            const duration = performance.now() - startTime;
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
            expect(duration).toBeLessThan(2000); // All 10 should complete in under 2s
        });
        test('should maintain performance with repeated parsing', async () => {
            const durations = [];
            // Parse the same file 5 times
            for (let i = 0; i < 5; i++) {
                const startTime = performance.now();
                const result = await parser.parseFromFile(petstoreFixture);
                const duration = performance.now() - startTime;
                expect(result.success).toBe(true);
                durations.push(duration);
            }
            // Each parse should be within time limit
            durations.forEach(duration => {
                expect(duration).toBeLessThan(500);
            });
            // Performance should not degrade significantly
            const firstDuration = durations[0];
            const lastDuration = durations[durations.length - 1];
            expect(lastDuration).toBeLessThan(firstDuration * 2); // No more than 2x slower
        });
    });
    describe('Large Specification Performance', () => {
        let largeSpec;
        let largeSpecPath;
        beforeAll(async () => {
            // Generate a large OpenAPI specification for testing
            largeSpecPath = path.join(fixturesDir, 'large-spec.json');
            largeSpec = await generateLargeOpenAPISpec();
            await fs.writeFile(largeSpecPath, largeSpec);
        });
        afterAll(async () => {
            // Clean up
            await fs.unlink(largeSpecPath).catch(() => { });
        });
        test('should parse large spec within time limit', async () => {
            const startTime = performance.now();
            const result = await parser.parseFromFile(largeSpecPath);
            const duration = performance.now() - startTime;
            expect(result.success).toBe(true);
            expect(result.spec?.metadata.totalOperations).toBeGreaterThan(100);
            expect(duration).toBeLessThan(2000); // Should parse large spec in under 2s
        });
        test('should validate large spec within time limit', async () => {
            const startTime = performance.now();
            const result = await validator.validateFromFile(largeSpecPath);
            const duration = performance.now() - startTime;
            expect(result.isValid).toBe(true);
            expect(duration).toBeLessThan(5000); // Should validate large spec in under 5s
        });
        test('should extract operations from large spec efficiently', async () => {
            const parseResult = await parser.parseFromFile(largeSpecPath);
            expect(parseResult.success).toBe(true);
            const startTime = performance.now();
            const operations = await parser.extractOperations(parseResult.spec);
            const duration = performance.now() - startTime;
            expect(operations.length).toBeGreaterThan(100);
            expect(duration).toBeLessThan(500); // Should extract in under 500ms
        });
    });
    describe('Memory Usage', () => {
        test('should not leak memory during repeated operations', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            // Perform 50 parse operations
            for (let i = 0; i < 50; i++) {
                const result = await parser.parseFromFile(petstoreFixture);
                expect(result.success).toBe(true);
            }
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryGrowth = finalMemory - initialMemory;
            // Memory growth should be reasonable (less than 50MB)
            expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
        });
        test('should report memory usage in results', async () => {
            const result = await parser.parseFromFile(petstoreFixture);
            expect(result.success).toBe(true);
            expect(result.metadata.fileSize).toBeGreaterThan(0);
        });
    });
    describe('Performance Metrics', () => {
        test('should provide consistent timing measurements', async () => {
            const results = [];
            for (let i = 0; i < 10; i++) {
                const result = await parser.parseFromFile(petstoreFixture);
                expect(result.success).toBe(true);
                results.push(result.metadata.parseTime);
            }
            // All measurements should be positive
            results.forEach(time => {
                expect(time).toBeGreaterThan(0);
            });
            // Calculate variance to ensure consistency
            const average = results.reduce((sum, time) => sum + time, 0) / results.length;
            const variance = results.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / results.length;
            const standardDeviation = Math.sqrt(variance);
            // Standard deviation should be reasonable (less than 50% of average)
            expect(standardDeviation).toBeLessThan(average * 0.5);
        });
        test('should scale linearly with spec size', async () => {
            const smallSpecTime = await measureParsingTime(generateSmallSpec());
            const mediumSpecTime = await measureParsingTime(generateMediumSpec());
            // Medium spec should not be dramatically slower than small spec
            expect(mediumSpecTime).toBeLessThan(smallSpecTime * 5);
        });
    });
    // Helper functions
    async function measureParsingTime(spec) {
        const tempFile = path.join(fixturesDir, `temp-${Date.now()}.json`);
        await fs.writeFile(tempFile, spec);
        try {
            const startTime = performance.now();
            const result = await parser.parseFromFile(tempFile);
            const duration = performance.now() - startTime;
            expect(result.success).toBe(true);
            return duration;
        }
        finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    }
    function generateSmallSpec() {
        return JSON.stringify({
            openapi: '3.0.0',
            info: { title: 'Small API', version: '1.0.0' },
            paths: {
                '/test': {
                    get: {
                        operationId: 'getTest',
                        responses: {
                            '200': { description: 'Success' }
                        }
                    }
                }
            }
        });
    }
    function generateMediumSpec() {
        const paths = {};
        // Generate 20 paths with 2-3 operations each
        for (let i = 0; i < 20; i++) {
            paths[`/resource${i}`] = {
                get: {
                    operationId: `getResource${i}`,
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': { description: 'Success' },
                        '404': { description: 'Not found' }
                    }
                },
                post: {
                    operationId: `createResource${i}`,
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { name: { type: 'string' } } }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Created' }
                    }
                }
            };
        }
        return JSON.stringify({
            openapi: '3.0.0',
            info: { title: 'Medium API', version: '1.0.0' },
            paths
        });
    }
    async function generateLargeOpenAPISpec() {
        const paths = {};
        // Generate 100 paths with 3-4 operations each (~300-400 operations total)
        for (let i = 0; i < 100; i++) {
            const resourceName = `resource${i}`;
            paths[`/${resourceName}`] = {
                get: {
                    operationId: `get${resourceName}`,
                    summary: `Get ${resourceName}`,
                    tags: [`${resourceName}-tag`],
                    parameters: [
                        { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100 } },
                        { name: 'offset', in: 'query', schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Success',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: `#/components/schemas/${resourceName}` }
                                    }
                                }
                            }
                        },
                        '400': { description: 'Bad request' },
                        '500': { description: 'Internal server error' }
                    }
                },
                post: {
                    operationId: `create${resourceName}`,
                    summary: `Create ${resourceName}`,
                    tags: [`${resourceName}-tag`],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: `#/components/schemas/${resourceName}Input` }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Created',
                            content: {
                                'application/json': {
                                    schema: { $ref: `#/components/schemas/${resourceName}` }
                                }
                            }
                        },
                        '400': { description: 'Bad request' },
                        '409': { description: 'Conflict' }
                    }
                }
            };
            paths[`/${resourceName}/{id}`] = {
                get: {
                    operationId: `get${resourceName}ById`,
                    summary: `Get ${resourceName} by ID`,
                    tags: [`${resourceName}-tag`],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Success',
                            content: {
                                'application/json': {
                                    schema: { $ref: `#/components/schemas/${resourceName}` }
                                }
                            }
                        },
                        '404': { description: 'Not found' }
                    }
                },
                put: {
                    operationId: `update${resourceName}`,
                    summary: `Update ${resourceName}`,
                    tags: [`${resourceName}-tag`],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: `#/components/schemas/${resourceName}Input` }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Updated',
                            content: {
                                'application/json': {
                                    schema: { $ref: `#/components/schemas/${resourceName}` }
                                }
                            }
                        },
                        '404': { description: 'Not found' }
                    }
                },
                delete: {
                    operationId: `delete${resourceName}`,
                    summary: `Delete ${resourceName}`,
                    tags: [`${resourceName}-tag`],
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '204': { description: 'Deleted' },
                        '404': { description: 'Not found' }
                    }
                }
            };
        }
        // Generate schemas
        const schemas = {};
        for (let i = 0; i < 100; i++) {
            const resourceName = `resource${i}`;
            schemas[resourceName] = {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
                    metadata: { type: 'object', additionalProperties: true }
                },
                required: ['name']
            };
            schemas[`${resourceName}Input`] = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
                    metadata: { type: 'object', additionalProperties: true }
                },
                required: ['name']
            };
        }
        return JSON.stringify({
            openapi: '3.0.3',
            info: {
                title: 'Large Test API',
                description: 'A large API specification for performance testing',
                version: '1.0.0'
            },
            servers: [
                { url: 'https://api.example.com/v1' }
            ],
            paths,
            components: {
                schemas,
                securitySchemes: {
                    apiKey: {
                        type: 'apiKey',
                        name: 'X-API-Key',
                        in: 'header'
                    },
                    oauth2: {
                        type: 'oauth2',
                        flows: {
                            clientCredentials: {
                                tokenUrl: 'https://api.example.com/oauth/token',
                                scopes: {
                                    'read': 'Read access',
                                    'write': 'Write access'
                                }
                            }
                        }
                    }
                }
            },
            security: [
                { apiKey: [] },
                { oauth2: ['read', 'write'] }
            ]
        }, null, 2);
    }
});
//# sourceMappingURL=parser-performance.test.js.map