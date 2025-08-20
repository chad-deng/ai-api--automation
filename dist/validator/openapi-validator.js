"use strict";
/**
 * OpenAPI Validator Implementation
 * Week 1 Sprint 2: Comprehensive OpenAPI specification validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIValidator = void 0;
const openapi_parser_1 = require("../parser/openapi-parser");
class OpenAPIValidator {
    constructor() {
        this.customRules = [];
        this.parser = new openapi_parser_1.OpenAPIParser();
        this.initializeDefaultRules();
    }
    /**
     * Validate OpenAPI specification from file
     */
    async validateFromFile(filePath, options = {}) {
        try {
            // Parse the specification first
            const parsingOptions = {};
            if (options.strict !== undefined) {
                parsingOptions.strict = options.strict;
            }
            if (options.validateRefs !== undefined) {
                parsingOptions.validateRefs = options.validateRefs;
            }
            const parseResult = await this.parser.parseFromFile(filePath, parsingOptions);
            if (!parseResult.success || !parseResult.spec) {
                return {
                    isValid: false,
                    errors: [parseResult.error || 'Failed to parse OpenAPI specification'],
                    warnings: [],
                    score: 0,
                    checks: {
                        schema: false,
                        paths: false,
                        operations: false,
                        responses: false
                    }
                };
            }
            // Perform validation
            return await this.validateSpec(parseResult.spec, options);
        }
        catch (error) {
            return {
                isValid: false,
                errors: [error instanceof Error ? error.message : 'Unknown validation error'],
                warnings: [],
                score: 0,
                checks: {
                    schema: false,
                    paths: false,
                    operations: false,
                    responses: false
                }
            };
        }
    }
    /**
     * Validate parsed OpenAPI specification
     */
    async validateSpec(spec, options = {}) {
        // const _startTime = performance.now();
        const errors = [];
        const warnings = [];
        let score = 100;
        // Track validation checks
        const checks = {
            schema: true,
            paths: true,
            operations: true,
            responses: true
        };
        try {
            // 1. Schema validation
            const schemaResult = await this.validateSchema(spec);
            if (!schemaResult.isValid) {
                checks.schema = false;
                errors.push(...schemaResult.errors.map(e => e.message));
                score -= 25;
            }
            warnings.push(...schemaResult.warnings);
            // 2. Paths validation
            const pathsResult = await this.validatePaths(spec);
            if (!pathsResult.isValid) {
                checks.paths = false;
                errors.push(...pathsResult.errors.map(e => e.message));
                score -= 25;
            }
            warnings.push(...pathsResult.warnings);
            // 3. Operations validation
            const operationsResult = await this.validateOperations(spec);
            if (!operationsResult.isValid) {
                checks.operations = false;
                errors.push(...operationsResult.errors.map(e => e.message));
                score -= 25;
            }
            warnings.push(...operationsResult.warnings);
            // 4. Responses validation
            const responsesResult = await this.validateResponses(spec);
            if (!responsesResult.isValid) {
                checks.responses = false;
                errors.push(...responsesResult.errors.map(e => e.message));
                score -= 25;
            }
            warnings.push(...responsesResult.warnings);
            // 5. Custom rules validation (if provided)
            if (options.customRules || this.customRules.length > 0) {
                const customResult = await this.validateCustomRules(spec, options);
                errors.push(...customResult.errors);
                warnings.push(...customResult.warnings);
                score -= customResult.scoreDeduction;
            }
            // 6. Security validation (if enabled)
            if (options.checkSecurity) {
                const securityResult = await this.validateSecurity(spec);
                errors.push(...securityResult.errors);
                warnings.push(...securityResult.warnings);
                score -= securityResult.scoreDeduction;
            }
            // Calculate final score
            score = Math.max(0, score);
            const isValid = errors.length === 0;
            // const _duration = performance.now() - startTime;
            return {
                isValid,
                errors,
                warnings: options.includeWarnings ? warnings : [],
                score,
                checks,
                details: {
                    pathCount: spec.metadata.totalPaths,
                    operationCount: spec.metadata.totalOperations,
                    schemaCount: spec.metadata.schemas.size,
                    securitySchemesCount: spec.metadata.security.size
                }
            };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [error instanceof Error ? error.message : 'Validation failed'],
                warnings: [],
                score: 0,
                checks
            };
        }
    }
    /**
     * Validate OpenAPI schema structure
     */
    async validateSchema(spec) {
        const errors = [];
        const warnings = [];
        // Required top-level fields
        if (!spec.openapi) {
            errors.push({ field: 'openapi', message: 'Missing required "openapi" field' });
        }
        if (!spec.info) {
            errors.push({ field: 'info', message: 'Missing required "info" section' });
        }
        else {
            if (!spec.info.title) {
                errors.push({ field: 'info.title', message: 'Missing required "title" in info section' });
            }
            if (!spec.info.version) {
                errors.push({ field: 'info.version', message: 'Missing required "version" in info section' });
            }
            if (!spec.info.description) {
                warnings.push('API description is recommended for better documentation');
            }
        }
        // Validate servers
        if (!spec.servers || spec.servers.length === 0) {
            warnings.push('No servers defined - using default localhost');
        }
        else {
            for (const [index, server] of spec.servers.entries()) {
                if (!server.url) {
                    errors.push({ field: `servers[${index}].url`, message: 'Server URL is required' });
                }
                else {
                    try {
                        new URL(server.url.includes('://') ? server.url : `http://${server.url}`);
                    }
                    catch {
                        errors.push({ field: `servers[${index}].url`, message: 'Invalid server URL format' });
                    }
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate paths section
     */
    async validatePaths(spec) {
        const errors = [];
        const warnings = [];
        if (!spec.paths || Object.keys(spec.paths).length === 0) {
            errors.push({ field: 'paths', message: 'API must define at least one path' });
            return { isValid: false, errors, warnings };
        }
        const pathNames = new Set();
        for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
            // Check path format
            if (!pathStr.startsWith('/')) {
                errors.push({ field: `paths.${pathStr}`, message: 'Path must start with forward slash' });
            }
            // Check for duplicate paths (case-insensitive)
            const normalizedPath = pathStr.toLowerCase();
            if (pathNames.has(normalizedPath)) {
                errors.push({ field: `paths.${pathStr}`, message: 'Duplicate path detected (case-insensitive)' });
            }
            pathNames.add(normalizedPath);
            // Validate path parameters
            const pathParams = this.extractPathParameters(pathStr);
            if (pathItem && typeof pathItem === 'object') {
                const pathItemObj = pathItem;
                // Check if path parameters are documented
                for (const param of pathParams) {
                    const isDocumented = pathItemObj.parameters?.some(p => typeof p === 'object' && 'name' in p && p.name === param && p.in === 'path');
                    if (!isDocumented) {
                        warnings.push(`Path parameter {${param}} in ${pathStr} should be documented`);
                    }
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate operations in paths
     */
    async validateOperations(spec) {
        const errors = [];
        const warnings = [];
        const operationIds = new Set();
        if (!spec.paths) {
            return { isValid: true, errors, warnings };
        }
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
        for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
            if (!pathItem || typeof pathItem !== 'object') {
                continue;
            }
            let hasOperations = false;
            for (const method of httpMethods) {
                const operation = pathItem[method];
                if (operation) {
                    hasOperations = true;
                    const operationPrefix = `paths.${pathStr}.${method}`;
                    // Validate operationId uniqueness
                    if (operation.operationId) {
                        if (operationIds.has(operation.operationId)) {
                            errors.push({
                                field: `${operationPrefix}.operationId`,
                                message: `Duplicate operationId: ${operation.operationId}`
                            });
                        }
                        operationIds.add(operation.operationId);
                    }
                    else {
                        warnings.push(`Operation ${method.toUpperCase()} ${pathStr} missing operationId`);
                    }
                    // Validate responses
                    if (!operation.responses || Object.keys(operation.responses).length === 0) {
                        errors.push({
                            field: `${operationPrefix}.responses`,
                            message: 'Operation must define at least one response'
                        });
                    }
                    else {
                        // Check for success response
                        const hasSuccessResponse = Object.keys(operation.responses).some(code => code.startsWith('2') || code === 'default');
                        if (!hasSuccessResponse) {
                            warnings.push(`Operation ${method.toUpperCase()} ${pathStr} missing success response (2xx)`);
                        }
                    }
                    // Validate parameters
                    if (operation.parameters) {
                        const paramNames = new Map();
                        for (const [index, param] of operation.parameters.entries()) {
                            if (typeof param === 'object' && 'name' in param) {
                                if (!param.name) {
                                    errors.push({
                                        field: `${operationPrefix}.parameters[${index}].name`,
                                        message: 'Parameter name is required'
                                    });
                                }
                                // Check for duplicate parameters
                                const location = param.in;
                                if (!paramNames.has(location)) {
                                    paramNames.set(location, new Set());
                                }
                                if (paramNames.get(location).has(param.name)) {
                                    errors.push({
                                        field: `${operationPrefix}.parameters[${index}]`,
                                        message: `Duplicate parameter ${param.name} in ${location}`
                                    });
                                }
                                paramNames.get(location).add(param.name);
                            }
                        }
                    }
                    // Validate tags
                    if (!operation.tags || operation.tags.length === 0) {
                        warnings.push(`Operation ${method.toUpperCase()} ${pathStr} should have tags for organization`);
                    }
                }
            }
            if (!hasOperations) {
                warnings.push(`Path ${pathStr} has no operations`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate response definitions
     */
    async validateResponses(spec) {
        const errors = [];
        const warnings = [];
        if (!spec.paths) {
            return { isValid: true, errors, warnings };
        }
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
        for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
            if (!pathItem || typeof pathItem !== 'object') {
                continue;
            }
            for (const method of httpMethods) {
                const operation = pathItem[method];
                if (!operation || !operation.responses) {
                    continue;
                }
                for (const [statusCode, response] of Object.entries(operation.responses)) {
                    const responsePrefix = `paths.${pathStr}.${method}.responses.${statusCode}`;
                    if (typeof response !== 'object') {
                        continue;
                    }
                    // Validate status code format
                    if (statusCode !== 'default' && !/^\d{3}$/.test(statusCode)) {
                        errors.push({
                            field: responsePrefix,
                            message: `Invalid status code format: ${statusCode}`
                        });
                    }
                    // Validate required description
                    if (!response.description) {
                        errors.push({
                            field: `${responsePrefix}.description`,
                            message: 'Response description is required'
                        });
                    }
                    // Validate content types
                    if (response.content) {
                        for (const [mediaType, mediaTypeObj] of Object.entries(response.content)) {
                            if (!this.isValidMediaType(mediaType)) {
                                warnings.push(`Non-standard media type: ${mediaType} in ${responsePrefix}`);
                            }
                            // Validate schema if present
                            if (mediaTypeObj.schema && typeof mediaTypeObj.schema === 'object') {
                                const schemaErrors = await this.validateSchemaObject(mediaTypeObj.schema, `${responsePrefix}.content.${mediaType}.schema`);
                                errors.push(...schemaErrors);
                            }
                        }
                    }
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate custom rules
     */
    async validateCustomRules(spec, options) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        const allRules = [...this.customRules, ...(options.customRules || [])];
        for (const rule of allRules) {
            try {
                const results = rule.validate(spec);
                for (const result of results) {
                    if (result.severity === 'error') {
                        errors.push(`[${rule.name}] ${result.message}`);
                        scoreDeduction += 5;
                    }
                    else {
                        warnings.push(`[${rule.name}] ${result.message}`);
                    }
                }
            }
            catch (error) {
                warnings.push(`Custom rule "${rule.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return { errors, warnings, scoreDeduction };
    }
    /**
     * Validate security configuration
     */
    async validateSecurity(spec) {
        const errors = [];
        const warnings = [];
        let scoreDeduction = 0;
        // Check if security is defined
        if (!spec.security && !spec.components?.securitySchemes) {
            warnings.push('No security schemes defined - consider adding authentication');
            return { errors, warnings, scoreDeduction };
        }
        // Validate security schemes
        if (spec.components?.securitySchemes) {
            for (const [schemeName, scheme] of Object.entries(spec.components.securitySchemes)) {
                if (!scheme || typeof scheme !== 'object') {
                    errors.push(`Invalid security scheme: ${schemeName}`);
                    scoreDeduction += 5;
                    continue;
                }
                if (!scheme.type) {
                    errors.push(`Security scheme ${schemeName} missing required "type" field`);
                    scoreDeduction += 5;
                }
            }
        }
        return { errors, warnings, scoreDeduction };
    }
    /**
     * Register custom validation rule
     */
    addCustomRule(rule) {
        this.customRules.push(rule);
    }
    /**
     * Helper methods
     */
    extractPathParameters(path) {
        const matches = path.match(/\{([^}]+)\}/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    }
    isValidMediaType(mediaType) {
        const standardTypes = [
            'application/json',
            'application/xml',
            'text/plain',
            'text/html',
            'application/octet-stream',
            'multipart/form-data',
            'application/x-www-form-urlencoded'
        ];
        return standardTypes.includes(mediaType) ||
            mediaType.startsWith('application/') ||
            mediaType.startsWith('text/') ||
            mediaType.startsWith('image/') ||
            mediaType.startsWith('audio/') ||
            mediaType.startsWith('video/');
    }
    async validateSchemaObject(schema, fieldPath) {
        const errors = [];
        // Basic schema validation
        if (schema.type && !['string', 'number', 'integer', 'boolean', 'array', 'object'].includes(schema.type)) {
            errors.push({
                field: fieldPath,
                message: `Invalid schema type: ${schema.type}`
            });
        }
        // Validate array schemas
        if (schema.type === 'array' && !schema.items) {
            errors.push({
                field: fieldPath,
                message: 'Array schema must define items'
            });
        }
        return errors;
    }
    /**
     * Initialize default validation rules
     */
    initializeDefaultRules() {
        // Example: Check for consistent naming
        this.addCustomRule({
            name: 'consistent-case',
            description: 'Check for consistent parameter and property naming',
            severity: 'warning',
            validate: (spec) => {
                const results = [];
                // This is a simplified example - in reality, you'd implement more complex logic
                if (spec.info.title && spec.info.title !== spec.info.title.trim()) {
                    results.push({
                        field: 'info.title',
                        message: 'Title should not have leading/trailing whitespace',
                        severity: 'warning',
                        rule: 'consistent-case'
                    });
                }
                return results;
            }
        });
    }
}
exports.OpenAPIValidator = OpenAPIValidator;
//# sourceMappingURL=openapi-validator.js.map