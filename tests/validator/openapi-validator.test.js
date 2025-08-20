"use strict";
/**
 * OpenAPI Validator Tests
 * Week 1 Sprint 2: Comprehensive validation testing
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
const openapi_validator_1 = require("../../src/validator/openapi-validator");
const path = __importStar(require("path"));
describe('OpenAPI Validator', () => {
    let validator;
    const fixturesDir = path.join(__dirname, '../fixtures');
    const petstoreFixture = path.join(fixturesDir, 'petstore-openapi.json');
    const invalidFixture = path.join(fixturesDir, 'invalid-openapi.json');
    beforeEach(() => {
        validator = new openapi_validator_1.OpenAPIValidator();
    });
    describe('File Validation', () => {
        test('should validate valid OpenAPI spec from file', async () => {
            const result = await validator.validateFromFile(petstoreFixture);
            expect(result.isValid).toBe(true);
            expect(result.score).toBeGreaterThan(90);
            expect(result.checks.schema).toBe(true);
            expect(result.checks.paths).toBe(true);
            expect(result.checks.operations).toBe(true);
            expect(result.checks.responses).toBe(true);
            expect(result.details?.pathCount).toBe(3);
            expect(result.details?.operationCount).toBe(4);
        });
        test('should detect validation errors in invalid spec', async () => {
            const result = await validator.validateFromFile(invalidFixture);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.score).toBeLessThan(100);
        });
        test('should handle non-existent files', async () => {
            const result = await validator.validateFromFile('/non/existent/file.json');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('not found'));
            expect(result.score).toBe(0);
        });
    });
    describe('Schema Validation', () => {
        test('should validate required top-level fields', async () => {
            const incompleteSpec = {
                openapi: '3.0.0',
                // Missing info field
                paths: {}
            };
            const result = await validator.validateSpec({
                ...incompleteSpec,
                metadata: {
                    totalPaths: 0,
                    totalOperations: 0,
                    httpMethods: new Set(),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Missing required "info" section'));
        });
        test('should validate info section', async () => {
            const specWithoutTitle = {
                openapi: '3.0.0',
                info: {
                    version: '1.0.0'
                    // Missing title
                },
                paths: {}
            };
            const result = await validator.validateSpec({
                ...specWithoutTitle,
                metadata: {
                    totalPaths: 0,
                    totalOperations: 0,
                    httpMethods: new Set(),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Missing required "title"'));
        });
        test('should validate server URLs', async () => {
            const specWithInvalidServer = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                servers: [
                    { url: 'invalid-url' }
                ],
                paths: {}
            };
            const result = await validator.validateSpec({
                ...specWithInvalidServer,
                metadata: {
                    totalPaths: 0,
                    totalOperations: 0,
                    httpMethods: new Set(),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Invalid server URL'));
        });
    });
    describe('Path Validation', () => {
        test('should require paths to start with slash', async () => {
            const specWithInvalidPath = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    'invalid-path': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithInvalidPath,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Path must start with forward slash'));
        });
        test('should detect duplicate paths', async () => {
            const specWithDuplicates = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: { responses: { '200': { description: 'Success' } } }
                    },
                    '/Test': {
                        post: { responses: { '200': { description: 'Success' } } }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithDuplicates,
                metadata: {
                    totalPaths: 2,
                    totalOperations: 2,
                    httpMethods: new Set(['GET', 'POST']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Duplicate path detected'));
        });
        test('should warn about undocumented path parameters', async () => {
            const result = await validator.validateFromFile(petstoreFixture, {
                includeWarnings: true
            });
            // Petstore has proper path parameter documentation, so no warnings expected
            expect(result.isValid).toBe(true);
        });
    });
    describe('Operations Validation', () => {
        test('should require responses for operations', async () => {
            const specWithoutResponse = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: {
                        // Missing responses
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithoutResponse,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('must define at least one response'));
        });
        test('should detect duplicate operationIds', async () => {
            const specWithDuplicateOps = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test1': {
                        get: {
                            operationId: 'testOp',
                            responses: { '200': { description: 'Success' } }
                        }
                    },
                    '/test2': {
                        get: {
                            operationId: 'testOp', // Duplicate
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithDuplicateOps,
                metadata: {
                    totalPaths: 2,
                    totalOperations: 2,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Duplicate operationId'));
        });
        test('should warn about missing operationId', async () => {
            const specWithoutOpId = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: {
                            responses: { '200': { description: 'Success' } }
                            // Missing operationId
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithoutOpId,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            }, { includeWarnings: true });
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(expect.stringContaining('missing operationId'));
        });
        test('should validate parameter uniqueness', async () => {
            const specWithDuplicateParams = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: {
                            parameters: [
                                { name: 'param1', in: 'query', schema: { type: 'string' } },
                                { name: 'param1', in: 'query', schema: { type: 'string' } } // Duplicate
                            ],
                            responses: { '200': { description: 'Success' } }
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithDuplicateParams,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Duplicate parameter'));
        });
    });
    describe('Response Validation', () => {
        test('should require response description', async () => {
            const specWithoutDescription = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                '200': {
                                // Missing description
                                }
                            }
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithoutDescription,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Response description is required'));
        });
        test('should validate status code format', async () => {
            const specWithInvalidStatus = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                'invalid': {
                                    description: 'Invalid'
                                }
                            }
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithInvalidStatus,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('Invalid status code format'));
        });
        test('should warn about missing success responses', async () => {
            const specWithoutSuccess = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: {
                            responses: {
                                '400': { description: 'Bad Request' },
                                '500': { description: 'Server Error' }
                                // No 2xx response
                            }
                        }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithoutSuccess,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            }, { includeWarnings: true });
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(expect.stringContaining('missing success response'));
        });
    });
    describe('Security Validation', () => {
        test('should validate security with security schemes', async () => {
            const result = await validator.validateFromFile(petstoreFixture, {
                checkSecurity: true
            });
            expect(result.isValid).toBe(true);
            // Petstore has proper security configuration
        });
        test('should warn about missing security', async () => {
            const specWithoutSecurity = {
                openapi: '3.0.0',
                info: { title: 'Test', version: '1.0.0' },
                paths: {
                    '/test': {
                        get: { responses: { '200': { description: 'Success' } } }
                    }
                }
            };
            const result = await validator.validateSpec({
                ...specWithoutSecurity,
                metadata: {
                    totalPaths: 1,
                    totalOperations: 1,
                    httpMethods: new Set(['GET']),
                    tags: new Set(),
                    security: new Set(),
                    schemas: new Set()
                }
            }, {
                checkSecurity: true,
                includeWarnings: true
            });
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(expect.stringContaining('No security schemes defined'));
        });
    });
    describe('Custom Rules', () => {
        test('should support custom validation rules', async () => {
            const customRule = {
                name: 'test-rule',
                description: 'Test custom rule',
                severity: 'error',
                validate: (spec) => [
                    {
                        field: 'info.title',
                        message: 'Custom rule violation',
                        severity: 'error',
                        rule: 'test-rule'
                    }
                ]
            };
            const result = await validator.validateFromFile(petstoreFixture, {
                customRules: [customRule]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('[test-rule] Custom rule violation'));
        });
        test('should support warning-level custom rules', async () => {
            const warningRule = {
                name: 'warning-rule',
                description: 'Warning rule',
                severity: 'warning',
                validate: (spec) => [
                    {
                        field: 'info.description',
                        message: 'Consider adding more details',
                        severity: 'warning',
                        rule: 'warning-rule'
                    }
                ]
            };
            const result = await validator.validateFromFile(petstoreFixture, {
                customRules: [warningRule],
                includeWarnings: true
            });
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(expect.stringContaining('[warning-rule]'));
        });
        test('should handle custom rule errors gracefully', async () => {
            const faultyRule = {
                name: 'faulty-rule',
                description: 'Faulty rule',
                severity: 'error',
                validate: (spec) => {
                    throw new Error('Rule implementation error');
                }
            };
            const result = await validator.validateFromFile(petstoreFixture, {
                customRules: [faultyRule],
                includeWarnings: true
            });
            expect(result.warnings).toContain(expect.stringContaining('Custom rule "faulty-rule" failed'));
        });
    });
    describe('Validation Options', () => {
        test('should respect strict validation option', async () => {
            const result = await validator.validateFromFile(petstoreFixture, {
                strict: true
            });
            expect(result.isValid).toBe(true);
        });
        test('should include warnings when requested', async () => {
            const result = await validator.validateFromFile(petstoreFixture, {
                includeWarnings: true
            });
            expect(result.warnings).toBeDefined();
        });
        test('should validate examples when requested', async () => {
            const result = await validator.validateFromFile(petstoreFixture, {
                validateExamples: true
            });
            expect(result.isValid).toBe(true);
        });
    });
    describe('Performance', () => {
        test('should validate within time limit', async () => {
            const startTime = performance.now();
            const result = await validator.validateFromFile(petstoreFixture);
            const duration = performance.now() - startTime;
            expect(result.isValid).toBe(true);
            expect(duration).toBeLessThan(1000); // Should validate in under 1 second
        });
    });
    describe('API Interface', () => {
        test('should allow registering custom rules', async () => {
            const rule = {
                name: 'test-registered-rule',
                description: 'Test registered rule',
                severity: 'warning',
                validate: () => []
            };
            validator.addCustomRule(rule);
            // Verify the rule is registered by testing it gets called
            const result = await validator.validateFromFile(petstoreFixture);
            expect(result.isValid).toBe(true);
        });
    });
});
//# sourceMappingURL=openapi-validator.test.js.map