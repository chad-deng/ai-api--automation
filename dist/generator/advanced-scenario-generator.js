"use strict";
/**
 * Advanced Test Scenario Generator (US-017)
 * Generates comprehensive test scenarios beyond basic CRUD operations
 * Including security tests, edge cases, contract validation, and complex workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedScenarioGenerator = void 0;
class AdvancedScenarioGenerator {
    constructor() {
        this.securityPayloads = {
            sqlInjection: [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "admin'/*",
                "' UNION SELECT * FROM users --"
            ],
            xssPayloads: [
                "<script>alert('xss')</script>",
                "javascript:alert(1)",
                "<img src=x onerror=alert(1)>",
                "';alert(String.fromCharCode(88,83,83));//'"
            ],
            pathTraversal: [
                "../../../etc/passwd",
                "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
                "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
            ],
            commandInjection: [
                "; ls -la",
                "| whoami",
                "&& cat /etc/passwd",
                "`id`"
            ]
        };
    }
    /**
     * Generate comprehensive test scenarios for all operations
     */
    async generateAdvancedScenarios(operations, spec, options) {
        const scenarios = [];
        for (const operation of operations) {
            // Generate security test scenarios
            if (options.coverage?.includeSecurityTests) {
                scenarios.push(...await this.generateSecurityScenarios(operation, spec, options));
            }
            // Generate edge case scenarios
            if (options.coverage?.includeEdgeCases) {
                scenarios.push(...await this.generateEdgeCaseScenarios(operation, spec, options));
            }
            // Generate contract validation scenarios
            if (options.contractTesting) {
                scenarios.push(...await this.generateContractScenarios(operation, spec, options));
            }
            // Generate business logic scenarios
            scenarios.push(...await this.generateBusinessLogicScenarios(operation, spec, options));
            // Generate integration test scenarios
            scenarios.push(...await this.generateIntegrationScenarios(operation, spec, options));
        }
        return scenarios;
    }
    /**
     * Generate security-focused test scenarios
     */
    async generateSecurityScenarios(operation, spec, options) {
        const scenarios = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        // SQL Injection Tests
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            scenarios.push({
                type: 'security',
                name: `SQL Injection Protection - ${method} ${path}`,
                description: 'Test SQL injection attack prevention',
                complexity: 'high',
                priority: 'critical',
                testCases: this.generateSqlInjectionTests(operation, options)
            });
        }
        // XSS Protection Tests
        if (this.hasStringParameters(operation)) {
            scenarios.push({
                type: 'security',
                name: `XSS Protection - ${method} ${path}`,
                description: 'Test Cross-Site Scripting attack prevention',
                complexity: 'medium',
                priority: 'high',
                testCases: this.generateXssTests(operation, options)
            });
        }
        // Authorization Tests
        if (this.requiresAuth(operation, spec)) {
            scenarios.push({
                type: 'security',
                name: `Authorization Tests - ${method} ${path}`,
                description: 'Test proper authorization controls',
                complexity: 'medium',
                priority: 'critical',
                testCases: this.generateAuthorizationTests(operation, options)
            });
        }
        // Input Validation Tests
        scenarios.push({
            type: 'security',
            name: `Input Validation - ${method} ${path}`,
            description: 'Test comprehensive input validation',
            complexity: 'medium',
            priority: 'high',
            testCases: this.generateInputValidationTests(operation, options)
        });
        return scenarios;
    }
    /**
     * Generate edge case test scenarios
     */
    async generateEdgeCaseScenarios(operation, spec, options) {
        const scenarios = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        // Boundary Value Tests
        scenarios.push({
            type: 'edge-case',
            name: `Boundary Value Tests - ${method} ${path}`,
            description: 'Test boundary values for all parameters',
            complexity: 'medium',
            priority: 'medium',
            testCases: this.generateBoundaryValueTests(operation, options)
        });
        // Large Payload Tests
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            scenarios.push({
                type: 'edge-case',
                name: `Large Payload Tests - ${method} ${path}`,
                description: 'Test with very large request payloads',
                complexity: 'low',
                priority: 'medium',
                testCases: this.generateLargePayloadTests(operation, options)
            });
        }
        // Unicode and Special Character Tests
        scenarios.push({
            type: 'edge-case',
            name: `Unicode and Special Characters - ${method} ${path}`,
            description: 'Test with unicode and special characters',
            complexity: 'low',
            priority: 'low',
            testCases: this.generateUnicodeTests(operation, options)
        });
        // Null and Empty Value Tests
        scenarios.push({
            type: 'edge-case',
            name: `Null and Empty Values - ${method} ${path}`,
            description: 'Test with null, undefined, and empty values',
            complexity: 'low',
            priority: 'medium',
            testCases: this.generateNullEmptyTests(operation, options)
        });
        return scenarios;
    }
    /**
     * Generate contract validation scenarios
     */
    async generateContractScenarios(operation, spec, options) {
        const scenarios = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        scenarios.push({
            type: 'contract',
            name: `OpenAPI Contract Validation - ${method} ${path}`,
            description: 'Validate API responses against OpenAPI schema',
            complexity: 'medium',
            priority: 'high',
            testCases: this.generateContractValidationTests(operation, spec, options)
        });
        return scenarios;
    }
    /**
     * Generate business logic test scenarios
     */
    async generateBusinessLogicScenarios(operation, spec, options) {
        const scenarios = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        // State Transition Tests
        if (this.isStatefulOperation(operation)) {
            scenarios.push({
                type: 'business-logic',
                name: `State Transition Tests - ${method} ${path}`,
                description: 'Test valid and invalid state transitions',
                complexity: 'high',
                priority: 'high',
                testCases: this.generateStateTransitionTests(operation, options)
            });
        }
        // Workflow Tests
        if (this.isWorkflowOperation(operation)) {
            scenarios.push({
                type: 'business-logic',
                name: `Workflow Tests - ${method} ${path}`,
                description: 'Test complete business workflows',
                complexity: 'high',
                priority: 'medium',
                testCases: this.generateWorkflowTests(operation, options)
            });
        }
        return scenarios;
    }
    /**
     * Generate integration test scenarios
     */
    async generateIntegrationScenarios(operation, spec, options) {
        const scenarios = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        // Multi-endpoint Integration Tests
        scenarios.push({
            type: 'integration',
            name: `Multi-endpoint Integration - ${method} ${path}`,
            description: 'Test interactions between multiple endpoints',
            complexity: 'high',
            priority: 'medium',
            testCases: this.generateMultiEndpointTests(operation, spec, options)
        });
        return scenarios;
    }
    /**
     * Generate SQL injection test cases
     */
    generateSqlInjectionTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        this.securityPayloads.sqlInjection.forEach((payload, index) => {
            testCases.push({
                name: `should prevent SQL injection attack ${index + 1}`,
                operation,
                method,
                path,
                description: `Test SQL injection prevention with payload: ${payload}`,
                requestData: this.createMaliciousRequestData(operation, 'sql_injection', payload),
                expectedResponse: { error: 'Bad Request', message: 'Invalid input' },
                statusCode: 400,
                tags: ['security', 'sql-injection']
            });
        });
        return testCases;
    }
    /**
     * Generate XSS test cases
     */
    generateXssTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        this.securityPayloads.xssPayloads.forEach((payload, index) => {
            testCases.push({
                name: `should prevent XSS attack ${index + 1}`,
                operation,
                method,
                path,
                description: `Test XSS prevention with payload: ${payload}`,
                requestData: this.createMaliciousRequestData(operation, 'xss', payload),
                expectedResponse: { error: 'Bad Request', message: 'Invalid input' },
                statusCode: 400,
                tags: ['security', 'xss']
            });
        });
        return testCases;
    }
    /**
     * Generate authorization test cases
     */
    generateAuthorizationTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        // Test without authentication
        testCases.push({
            name: 'should reject unauthenticated requests',
            operation,
            method,
            path,
            description: 'Test that endpoint requires authentication',
            requestData: this.generateValidRequestData(operation),
            expectedResponse: { error: 'Unauthorized', message: 'Authentication required' },
            statusCode: 401,
            tags: ['security', 'authentication']
        });
        // Test with invalid token
        testCases.push({
            name: 'should reject invalid authentication token',
            operation,
            method,
            path,
            description: 'Test with invalid authentication token',
            requestData: this.generateValidRequestData(operation),
            expectedResponse: { error: 'Unauthorized', message: 'Invalid token' },
            statusCode: 401,
            tags: ['security', 'authentication']
        });
        // Test with expired token
        testCases.push({
            name: 'should reject expired authentication token',
            operation,
            method,
            path,
            description: 'Test with expired authentication token',
            requestData: this.generateValidRequestData(operation),
            expectedResponse: { error: 'Unauthorized', message: 'Token expired' },
            statusCode: 401,
            tags: ['security', 'authentication']
        });
        return testCases;
    }
    /**
     * Generate input validation test cases
     */
    generateInputValidationTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        // Test missing required parameters
        testCases.push({
            name: 'should validate required parameters',
            operation,
            method,
            path,
            description: 'Test validation of required parameters',
            requestData: {},
            expectedResponse: { error: 'Bad Request', message: 'Missing required parameters' },
            statusCode: 400,
            tags: ['validation', 'required-params']
        });
        // Test invalid data types
        testCases.push({
            name: 'should validate parameter data types',
            operation,
            method,
            path,
            description: 'Test validation of parameter data types',
            requestData: this.generateInvalidTypeData(operation),
            expectedResponse: { error: 'Bad Request', message: 'Invalid data type' },
            statusCode: 400,
            tags: ['validation', 'data-types']
        });
        return testCases;
    }
    /**
     * Generate boundary value test cases
     */
    generateBoundaryValueTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        if (operation.parameters) {
            operation.parameters.forEach(param => {
                if (typeof param === 'object' && 'schema' in param && param.schema) {
                    const boundaryValues = this.generateBoundaryValues(param.schema);
                    boundaryValues.forEach(value => {
                        testCases.push({
                            name: `should handle boundary value for ${param.name}: ${value}`,
                            operation,
                            method,
                            path,
                            description: `Test boundary value ${value} for parameter ${param.name}`,
                            requestData: { [param.name]: value },
                            expectedResponse: null,
                            statusCode: 200,
                            tags: ['edge-case', 'boundary-values']
                        });
                    });
                }
            });
        }
        return testCases;
    }
    /**
     * Generate large payload test cases
     */
    generateLargePayloadTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        const largePayload = this.generateLargePayload();
        testCases.push({
            name: 'should handle large request payload',
            operation,
            method,
            path,
            description: 'Test with very large request payload',
            requestData: largePayload,
            expectedResponse: null,
            statusCode: 413, // Payload Too Large
            tags: ['edge-case', 'large-payload']
        });
        return testCases;
    }
    /**
     * Generate unicode test cases
     */
    generateUnicodeTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        const unicodeData = {
            emoji: '🚀🎉💡',
            chinese: '你好世界',
            arabic: 'مرحبا بالعالم',
            russian: 'Привет мир',
            japanese: 'こんにちは世界'
        };
        testCases.push({
            name: 'should handle unicode characters',
            operation,
            method,
            path,
            description: 'Test with unicode characters in request data',
            requestData: unicodeData,
            expectedResponse: null,
            statusCode: 200,
            tags: ['edge-case', 'unicode']
        });
        return testCases;
    }
    /**
     * Generate null and empty value test cases
     */
    generateNullEmptyTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        const nullEmptyData = {
            nullValue: null,
            undefinedValue: undefined,
            emptyString: '',
            emptyArray: [],
            emptyObject: {}
        };
        testCases.push({
            name: 'should handle null and empty values',
            operation,
            method,
            path,
            description: 'Test with null, undefined, and empty values',
            requestData: nullEmptyData,
            expectedResponse: null,
            statusCode: 400,
            tags: ['edge-case', 'null-empty']
        });
        return testCases;
    }
    /**
     * Generate contract validation test cases
     */
    generateContractValidationTests(operation, spec, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        testCases.push({
            name: 'should validate response schema',
            operation,
            method,
            path,
            description: 'Validate API response against OpenAPI schema',
            requestData: this.generateValidRequestData(operation),
            expectedResponse: null,
            statusCode: 200,
            tags: ['contract', 'schema-validation']
        });
        return testCases;
    }
    /**
     * Generate state transition test cases
     */
    generateStateTransitionTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        // Example state transitions for a typical resource
        const stateTransitions = [
            { from: 'draft', to: 'published', valid: true },
            { from: 'published', to: 'archived', valid: true },
            { from: 'archived', to: 'draft', valid: false }
        ];
        stateTransitions.forEach(transition => {
            testCases.push({
                name: `should ${transition.valid ? 'allow' : 'reject'} transition from ${transition.from} to ${transition.to}`,
                operation,
                method,
                path,
                description: `Test state transition from ${transition.from} to ${transition.to}`,
                requestData: { status: transition.to, currentStatus: transition.from },
                expectedResponse: null,
                statusCode: transition.valid ? 200 : 400,
                tags: ['business-logic', 'state-transition']
            });
        });
        return testCases;
    }
    /**
     * Generate workflow test cases
     */
    generateWorkflowTests(operation, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        testCases.push({
            name: 'should execute complete workflow',
            operation,
            method,
            path,
            description: 'Test complete business workflow execution',
            requestData: this.generateWorkflowData(operation),
            expectedResponse: null,
            statusCode: 200,
            tags: ['business-logic', 'workflow']
        });
        return testCases;
    }
    /**
     * Generate multi-endpoint integration test cases
     */
    generateMultiEndpointTests(operation, spec, options) {
        const testCases = [];
        const method = (operation.method || 'GET').toUpperCase();
        const path = operation.path || '/unknown';
        testCases.push({
            name: 'should integrate with related endpoints',
            operation,
            method,
            path,
            description: 'Test integration between multiple related endpoints',
            requestData: this.generateValidRequestData(operation),
            expectedResponse: null,
            statusCode: 200,
            tags: ['integration', 'multi-endpoint']
        });
        return testCases;
    }
    /**
     * Helper methods
     */
    hasStringParameters(operation) {
        return operation.parameters?.some(param => typeof param === 'object' && 'schema' in param &&
            param.schema?.type === 'string') || false;
    }
    requiresAuth(operation, spec) {
        return Boolean(operation.security || spec.security);
    }
    isStatefulOperation(operation) {
        return ['POST', 'PUT', 'PATCH'].includes((operation.method || '').toUpperCase());
    }
    isWorkflowOperation(operation) {
        const path = operation.path || '';
        return path.includes('workflow') || path.includes('process') || path.includes('submit');
    }
    createMaliciousRequestData(operation, attackType, payload) {
        const data = this.generateValidRequestData(operation);
        // Inject malicious payload into string fields
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'string') {
                data[key] = payload;
            }
        });
        return data;
    }
    generateValidRequestData(operation) {
        const data = {};
        if (operation.parameters) {
            operation.parameters.forEach(param => {
                if (typeof param === 'object' && 'schema' in param && param.schema) {
                    data[param.name] = this.generateValidValue(param.schema);
                }
            });
        }
        return data;
    }
    generateInvalidTypeData(operation) {
        const data = {};
        if (operation.parameters) {
            operation.parameters.forEach(param => {
                if (typeof param === 'object' && 'schema' in param && param.schema) {
                    data[param.name] = this.generateInvalidTypeValue(param.schema);
                }
            });
        }
        return data;
    }
    generateValidValue(schema) {
        switch (schema.type) {
            case 'string':
                return 'test-value';
            case 'number':
                return 42;
            case 'integer':
                return 42;
            case 'boolean':
                return true;
            case 'array':
                return ['test'];
            case 'object':
                return { test: 'value' };
            default:
                return 'test';
        }
    }
    generateInvalidTypeValue(schema) {
        switch (schema.type) {
            case 'string':
                return 123; // Number instead of string
            case 'number':
                return 'not-a-number'; // String instead of number
            case 'integer':
                return 'not-an-integer'; // String instead of integer
            case 'boolean':
                return 'not-a-boolean'; // String instead of boolean
            case 'array':
                return 'not-an-array'; // String instead of array
            case 'object':
                return 'not-an-object'; // String instead of object
            default:
                return null;
        }
    }
    generateBoundaryValues(schema) {
        const values = [];
        if (schema.type === 'string') {
            if (schema.minLength !== undefined) {
                values.push('x'.repeat(schema.minLength));
                values.push('x'.repeat(Math.max(0, schema.minLength - 1)));
            }
            if (schema.maxLength !== undefined) {
                values.push('x'.repeat(schema.maxLength));
                values.push('x'.repeat(schema.maxLength + 1));
            }
        }
        else if (schema.type === 'number' || schema.type === 'integer') {
            if (schema.minimum !== undefined) {
                values.push(schema.minimum);
                values.push(schema.minimum - 1);
            }
            if (schema.maximum !== undefined) {
                values.push(schema.maximum);
                values.push(schema.maximum + 1);
            }
        }
        return values;
    }
    generateLargePayload() {
        return {
            largeString: 'x'.repeat(1000000), // 1MB string
            largeArray: Array(10000).fill('test'),
            nestedObject: {
                level1: {
                    level2: {
                        level3: {
                            data: 'x'.repeat(100000)
                        }
                    }
                }
            }
        };
    }
    generateWorkflowData(operation) {
        return {
            workflowId: 'wf-123',
            steps: [
                { id: 1, name: 'validation', status: 'completed' },
                { id: 2, name: 'processing', status: 'in-progress' },
                { id: 3, name: 'approval', status: 'pending' }
            ],
            metadata: {
                initiatedBy: 'user123',
                timestamp: new Date().toISOString()
            }
        };
    }
}
exports.AdvancedScenarioGenerator = AdvancedScenarioGenerator;
//# sourceMappingURL=advanced-scenario-generator.js.map