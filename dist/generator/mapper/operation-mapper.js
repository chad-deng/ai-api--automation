"use strict";
/**
 * Operation-to-Test Mapping Engine
 * Week 2 Sprint 1: Comprehensive operation mapping with request/response validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationMapper = void 0;
class OperationMapper {
    constructor(spec) {
        this.mappedOperations = new Map();
        this.spec = spec;
    }
    /**
     * Map all operations to test scenarios
     */
    async mapAllOperations() {
        const operations = await this.extractOperations();
        const mappedOps = [];
        for (const operation of operations) {
            const mapped = await this.mapOperation(operation);
            this.mappedOperations.set(this.getOperationKey(operation), mapped);
            mappedOps.push(mapped);
        }
        return mappedOps;
    }
    /**
     * Map a single operation to test scenarios
     */
    async mapOperation(operation) {
        const testScenarios = await this.generateTestScenarios(operation);
        const validationRules = await this.extractValidationRules(operation);
        const dataRequirements = await this.extractDataRequirements(operation);
        const dependencies = await this.analyzeDependencies(operation);
        return {
            operation,
            testScenarios,
            validationRules,
            dataRequirements,
            dependencies
        };
    }
    /**
     * Generate comprehensive test scenarios for an operation
     */
    async generateTestScenarios(operation) {
        const scenarios = [];
        // 1. Success scenarios
        scenarios.push(...await this.generateSuccessScenarios(operation));
        // 2. Error scenarios
        scenarios.push(...await this.generateErrorScenarios(operation));
        // 3. Edge case scenarios
        scenarios.push(...await this.generateEdgeScenarios(operation));
        // 4. Security scenarios
        scenarios.push(...await this.generateSecurityScenarios(operation));
        // 5. Performance scenarios
        scenarios.push(...await this.generatePerformanceScenarios(operation));
        return scenarios;
    }
    /**
     * Generate success test scenarios
     */
    async generateSuccessScenarios(operation) {
        const scenarios = [];
        const successResponses = this.getSuccessResponses(operation);
        for (const [statusCode, response] of successResponses) {
            const requestData = await this.generateValidRequestData(operation);
            const expectedResponse = await this.generateResponseTemplate(response, parseInt(statusCode));
            scenarios.push({
                id: `${operation.operationId || this.getOperationKey(operation)}_success_${statusCode}`,
                name: `${((operation.method || 'GET') || 'GET').toUpperCase()} ${(operation.path || '/unknown') || '/unknown'} success (${statusCode})`,
                type: 'success',
                description: operation.summary || `Successful ${((operation.method || 'GET') || 'GET').toUpperCase()} request to ${(operation.path || '/unknown') || '/unknown'}`,
                priority: 'high',
                tags: ['success', ...(operation.tags || [])],
                requestData,
                expectedResponse,
                statusCode: parseInt(statusCode),
                assertions: await this.generateSuccessAssertions(operation, response, parseInt(statusCode))
            });
        }
        return scenarios;
    }
    /**
     * Generate error test scenarios
     */
    async generateErrorScenarios(operation) {
        const scenarios = [];
        const errorResponses = this.getErrorResponses(operation);
        for (const [statusCode, response] of errorResponses) {
            const invalidRequestData = await this.generateInvalidRequestData(operation, statusCode);
            const expectedResponse = await this.generateResponseTemplate(response, parseInt(statusCode));
            scenarios.push({
                id: `${operation.operationId || this.getOperationKey(operation)}_error_${statusCode}`,
                name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} error (${statusCode})`,
                type: 'error',
                description: `Error handling for ${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')}`,
                priority: 'medium',
                tags: ['error', ...(operation.tags || [])],
                requestData: invalidRequestData,
                expectedResponse,
                statusCode: parseInt(statusCode),
                assertions: await this.generateErrorAssertions(operation, response, parseInt(statusCode))
            });
        }
        return scenarios;
    }
    /**
     * Generate edge case scenarios
     */
    async generateEdgeScenarios(operation) {
        const scenarios = [];
        // Test with minimal data
        const minimalData = await this.generateMinimalRequestData(operation);
        scenarios.push({
            id: `${operation.operationId || this.getOperationKey(operation)}_edge_minimal`,
            name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} with minimal data`,
            type: 'edge',
            description: `Test with minimal required data`,
            priority: 'medium',
            tags: ['edge', 'minimal', ...(operation.tags || [])],
            requestData: minimalData,
            expectedResponse: await this.getDefaultSuccessResponse(operation),
            statusCode: 200,
            assertions: await this.generateEdgeAssertions(operation, 'minimal')
        });
        // Test with maximum data
        const maximalData = await this.generateMaximalRequestData(operation);
        scenarios.push({
            id: `${operation.operationId || this.getOperationKey(operation)}_edge_maximal`,
            name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} with maximal data`,
            type: 'edge',
            description: `Test with maximum allowed data`,
            priority: 'low',
            tags: ['edge', 'maximal', ...(operation.tags || [])],
            requestData: maximalData,
            expectedResponse: await this.getDefaultSuccessResponse(operation),
            statusCode: 200,
            assertions: await this.generateEdgeAssertions(operation, 'maximal')
        });
        return scenarios;
    }
    /**
     * Generate security test scenarios
     */
    async generateSecurityScenarios(operation) {
        const scenarios = [];
        // Check if operation requires authentication
        const requiresAuth = this.requiresAuthentication(operation);
        if (requiresAuth) {
            // Test without authentication
            scenarios.push({
                id: `${operation.operationId || this.getOperationKey(operation)}_security_noauth`,
                name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} without authentication`,
                type: 'security',
                description: `Test unauthorized access`,
                priority: 'high',
                tags: ['security', 'auth', ...(operation.tags || [])],
                requestData: await this.generateValidRequestData(operation, { excludeAuth: true }),
                expectedResponse: { statusCode: 401, headers: {}, body: { error: 'Unauthorized' } },
                statusCode: 401,
                assertions: await this.generateSecurityAssertions(operation, 'unauthorized')
            });
            // Test with invalid authentication
            scenarios.push({
                id: `${operation.operationId || this.getOperationKey(operation)}_security_invalidauth`,
                name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} with invalid authentication`,
                type: 'security',
                description: `Test with invalid credentials`,
                priority: 'high',
                tags: ['security', 'auth', ...(operation.tags || [])],
                requestData: await this.generateValidRequestData(operation, { invalidAuth: true }),
                expectedResponse: { statusCode: 401, headers: {}, body: { error: 'Invalid credentials' } },
                statusCode: 401,
                assertions: await this.generateSecurityAssertions(operation, 'invalid_auth')
            });
        }
        return scenarios;
    }
    /**
     * Generate performance test scenarios
     */
    async generatePerformanceScenarios(operation) {
        const scenarios = [];
        // Basic performance test
        scenarios.push({
            id: `${operation.operationId || this.getOperationKey(operation)}_performance_basic`,
            name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} performance`,
            type: 'performance',
            description: `Test response time and performance`,
            priority: 'low',
            tags: ['performance', ...(operation.tags || [])],
            requestData: await this.generateValidRequestData(operation),
            expectedResponse: await this.getDefaultSuccessResponse(operation),
            statusCode: 200,
            assertions: await this.generatePerformanceAssertions(operation)
        });
        return scenarios;
    }
    /**
     * Extract validation rules from operation
     */
    async extractValidationRules(operation) {
        const rules = [];
        // Extract parameter validation rules
        if (operation.parameters) {
            for (const param of operation.parameters) {
                if (typeof param === 'object' && 'schema' in param && param.schema) {
                    rules.push(...this.extractSchemaValidationRules(param.schema, param.name));
                }
            }
        }
        // Extract request body validation rules
        if (operation.requestBody && typeof operation.requestBody === 'object') {
            const content = operation.requestBody.content;
            if (content && content['application/json']?.schema) {
                rules.push(...this.extractSchemaValidationRules(content['application/json'].schema, 'body'));
            }
        }
        return rules;
    }
    /**
     * Extract data requirements from operation
     */
    async extractDataRequirements(operation) {
        const requirements = [];
        // Extract parameter requirements
        if (operation.parameters) {
            for (const param of operation.parameters) {
                if (typeof param === 'object' && 'name' in param) {
                    requirements.push({
                        parameter: param.name,
                        location: param.in,
                        dataType: this.getParameterType(param),
                        required: param.required || false,
                        constraints: this.extractSchemaConstraints(param.schema),
                        examples: this.extractExamples(param)
                    });
                }
            }
        }
        // Extract request body requirements
        if (operation.requestBody && typeof operation.requestBody === 'object') {
            const content = operation.requestBody.content;
            if (content && content['application/json']?.schema) {
                requirements.push({
                    parameter: 'body',
                    location: 'body',
                    dataType: 'object',
                    required: operation.requestBody.required || false,
                    constraints: this.extractSchemaConstraints(content['application/json'].schema),
                    examples: []
                });
            }
        }
        return requirements;
    }
    /**
     * Helper methods for data generation and analysis
     */
    async extractOperations() {
        const operations = [];
        if (!this.spec.paths)
            return operations;
        for (const [path, pathItem] of Object.entries(this.spec.paths)) {
            if (!pathItem || typeof pathItem !== 'object')
                continue;
            const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
            for (const method of httpMethods) {
                const operation = pathItem[method];
                if (operation) {
                    operations.push({
                        ...operation,
                        path,
                        method
                    });
                }
            }
        }
        return operations;
    }
    getOperationKey(operation) {
        const method = (operation.method || 'GET') || 'GET';
        const path = (operation.path || '/unknown') || '/unknown';
        return `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    getSuccessResponses(operation) {
        if (!operation.responses)
            return [];
        return Object.entries(operation.responses)
            .filter(([code]) => code.startsWith('2') || code === 'default')
            .map(([code, response]) => [code, response]);
    }
    getErrorResponses(operation) {
        if (!operation.responses)
            return [];
        return Object.entries(operation.responses)
            .filter(([code]) => code.startsWith('4') || code.startsWith('5'))
            .map(([code, response]) => [code, response]);
    }
    requiresAuthentication(operation) {
        // Check if operation has security requirements
        if (operation.security && operation.security.length > 0) {
            return true;
        }
        // Check global security requirements
        if (this.spec.security && this.spec.security.length > 0) {
            return true;
        }
        return false;
    }
    async generateValidRequestData(operation, options = {}) {
        // Implementation for generating valid request data
        return {
            pathParams: {},
            queryParams: {},
            headers: {},
            body: null
        };
    }
    async generateInvalidRequestData(operation, statusCode) {
        // Implementation for generating invalid request data based on expected error
        return {
            pathParams: {},
            queryParams: {},
            headers: {},
            body: null
        };
    }
    async generateMinimalRequestData(operation) {
        // Implementation for generating minimal required data
        return {
            pathParams: {},
            queryParams: {},
            headers: {},
            body: null
        };
    }
    async generateMaximalRequestData(operation) {
        // Implementation for generating maximal allowed data
        return {
            pathParams: {},
            queryParams: {},
            headers: {},
            body: null
        };
    }
    async generateResponseTemplate(response, statusCode) {
        return {
            statusCode,
            headers: {},
            body: null
        };
    }
    async getDefaultSuccessResponse(operation) {
        return {
            statusCode: 200,
            headers: {},
            body: null
        };
    }
    async generateSuccessAssertions(operation, response, statusCode) {
        return [
            {
                type: 'status',
                target: 'response.status',
                operator: 'equals',
                expected: statusCode,
                message: `Should return ${statusCode} status`
            }
        ];
    }
    async generateErrorAssertions(operation, response, statusCode) {
        return [
            {
                type: 'status',
                target: 'response.status',
                operator: 'equals',
                expected: statusCode,
                message: `Should return ${statusCode} error status`
            }
        ];
    }
    async generateEdgeAssertions(operation, type) {
        return [
            {
                type: 'status',
                target: 'response.status',
                operator: 'range',
                expected: [200, 299],
                message: `Should handle ${type} data successfully`
            }
        ];
    }
    async generateSecurityAssertions(operation, type) {
        return [
            {
                type: 'status',
                target: 'response.status',
                operator: 'equals',
                expected: 401,
                message: `Should return 401 for ${type}`
            }
        ];
    }
    async generatePerformanceAssertions(operation) {
        return [
            {
                type: 'performance',
                target: 'response.time',
                operator: 'range',
                expected: [0, 5000],
                message: 'Should respond within 5 seconds'
            }
        ];
    }
    async analyzeDependencies(operation) {
        // Analyze operation dependencies (other operations that must run first)
        return [];
    }
    extractSchemaValidationRules(schema, fieldName) {
        const rules = [];
        if (schema.type) {
            rules.push({
                field: fieldName,
                type: 'type',
                constraint: schema.type,
                errorMessage: `${fieldName} must be of type ${schema.type}`
            });
        }
        return rules;
    }
    getParameterType(param) {
        if (typeof param === 'object' && 'schema' in param && param.schema) {
            return param.schema.type || 'unknown';
        }
        return 'unknown';
    }
    extractSchemaConstraints(schema) {
        if (!schema)
            return {};
        const constraints = {};
        if (schema.minimum !== undefined)
            constraints.minimum = schema.minimum;
        if (schema.maximum !== undefined)
            constraints.maximum = schema.maximum;
        if (schema.minLength !== undefined)
            constraints.minLength = schema.minLength;
        if (schema.maxLength !== undefined)
            constraints.maxLength = schema.maxLength;
        if (schema.pattern !== undefined)
            constraints.pattern = schema.pattern;
        if (schema.enum !== undefined)
            constraints.enum = schema.enum;
        if (schema.format !== undefined)
            constraints.format = schema.format;
        return constraints;
    }
    extractExamples(param) {
        if (typeof param === 'object' && 'example' in param && param.example) {
            return [param.example];
        }
        return [];
    }
    /**
     * Public API methods
     */
    getMappedOperation(operationId) {
        return this.mappedOperations.get(operationId);
    }
    getAllMappedOperations() {
        return Array.from(this.mappedOperations.values());
    }
    getTestScenariosByType(type) {
        const scenarios = [];
        for (const mapped of this.mappedOperations.values()) {
            scenarios.push(...mapped.testScenarios.filter(s => s.type === type));
        }
        return scenarios;
    }
    getHighPriorityScenarios() {
        const scenarios = [];
        for (const mapped of this.mappedOperations.values()) {
            scenarios.push(...mapped.testScenarios.filter(s => s.priority === 'high'));
        }
        return scenarios;
    }
}
exports.OperationMapper = OperationMapper;
//# sourceMappingURL=operation-mapper.js.map