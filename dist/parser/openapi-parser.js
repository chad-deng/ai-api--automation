"use strict";
/**
 * OpenAPI Parser Implementation
 * Week 1 Sprint 2: AST-based OpenAPI specification parser
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
exports.OpenAPIParser = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ts_morph_1 = require("ts-morph");
const yaml = __importStar(require("js-yaml"));
const types_1 = require("../types");
class OpenAPIParser {
    constructor() {
        this.supportedVersions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'];
        this.project = new ts_morph_1.Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                target: 1, // ES5
                module: 1, // CommonJS
                strict: true
            }
        });
    }
    /**
     * Parse OpenAPI specification from file
     */
    async parseFromFile(filePath, options = {}) {
        const startTime = performance.now();
        try {
            // Validate file exists
            const exists = await this.fileExists(filePath);
            if (!exists) {
                throw new types_1.ParsingError(`OpenAPI spec file not found: ${filePath}`);
            }
            // Read and parse content
            const content = await fs.readFile(filePath, 'utf-8');
            const spec = await this.parseContent(content, filePath);
            // Validate and enrich specification
            const validationResult = await this.validateSpec(spec);
            const parsedSpec = await this.enrichSpecification(spec, options);
            const duration = performance.now() - startTime;
            return {
                success: true,
                spec: parsedSpec,
                validation: validationResult,
                metadata: {
                    filePath,
                    fileSize: content.length,
                    parseTime: Math.max(1, Math.round(duration)), // Ensure at least 1ms
                    version: spec.openapi,
                    title: spec.info?.title || 'Untitled API'
                }
            };
        }
        catch (error) {
            const duration = performance.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown parsing error',
                metadata: {
                    filePath,
                    parseTime: Math.max(1, Math.round(duration)), // Ensure at least 1ms
                    version: 'unknown'
                }
            };
        }
    }
    /**
     * Parse OpenAPI specification from string content
     */
    async parseContent(content, filePath) {
        try {
            let spec;
            // Determine file type and parse accordingly
            const extension = filePath ? path.extname(filePath).toLowerCase() : '';
            if (extension === '.json' || this.isJsonContent(content)) {
                spec = JSON.parse(content);
            }
            else if (extension === '.yaml' || extension === '.yml' || this.isYamlContent(content)) {
                spec = yaml.load(content);
            }
            else {
                // Try JSON first, then YAML
                try {
                    spec = JSON.parse(content);
                }
                catch {
                    spec = yaml.load(content);
                }
            }
            // Basic structure validation
            if (!spec || typeof spec !== 'object') {
                throw new types_1.ParsingError('Invalid OpenAPI specification: not a valid object');
            }
            if (!spec.openapi) {
                throw new types_1.ParsingError('Invalid OpenAPI specification: missing "openapi" field');
            }
            if (!this.supportedVersions.includes(spec.openapi)) {
                throw new types_1.ParsingError(`Unsupported OpenAPI version: ${spec.openapi}. Supported: ${this.supportedVersions.join(', ')}`);
            }
            return spec;
        }
        catch (error) {
            if (error instanceof types_1.ParsingError) {
                throw error;
            }
            throw new types_1.ParsingError(`Failed to parse OpenAPI specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate OpenAPI specification structure
     */
    async validateSpec(spec) {
        const errors = [];
        const warnings = [];
        let score = 100;
        // Required fields validation
        if (!spec.info) {
            errors.push({ field: 'info', message: 'Missing required "info" section' });
            score -= 20;
        }
        else {
            if (!spec.info.title) {
                errors.push({ field: 'info.title', message: 'Missing required "title" in info section' });
                score -= 5;
            }
            if (!spec.info.version) {
                errors.push({ field: 'info.version', message: 'Missing required "version" in info section' });
                score -= 5;
            }
        }
        if (!spec.paths || Object.keys(spec.paths).length === 0) {
            errors.push({ field: 'paths', message: 'Missing or empty "paths" section' });
            score -= 30;
        }
        // Path validation
        if (spec.paths) {
            for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
                if (!pathStr.startsWith('/')) {
                    errors.push({ field: `paths.${pathStr}`, message: 'Path must start with forward slash' });
                    score -= 2;
                }
                if (pathItem && typeof pathItem === 'object') {
                    await this.validatePathItem(pathStr, pathItem, errors, warnings);
                }
            }
        }
        // Components validation
        if (spec.components) {
            await this.validateComponents(spec.components, errors, warnings);
        }
        // Security validation
        if (spec.security) {
            await this.validateSecurity(spec.security, spec.components?.securitySchemes, errors, warnings);
        }
        // Calculate final score
        score = Math.max(0, score);
        const isValid = errors.length === 0;
        return {
            isValid,
            errors,
            warnings,
            score
        };
    }
    /**
     * Enrich specification with computed metadata
     */
    async enrichSpecification(spec, _options) {
        const enriched = {
            ...spec,
            metadata: {
                totalPaths: 0,
                totalOperations: 0,
                httpMethods: new Set(),
                tags: new Set(),
                security: new Set(),
                schemas: new Set()
            }
        };
        // Count paths and operations
        if (spec.paths) {
            enriched.metadata.totalPaths = Object.keys(spec.paths).length;
            for (const pathItem of Object.values(spec.paths)) {
                if (pathItem && typeof pathItem === 'object') {
                    const operations = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
                    for (const method of operations) {
                        if (pathItem[method]) {
                            enriched.metadata.totalOperations++;
                            enriched.metadata.httpMethods.add(method.toUpperCase());
                            const operation = pathItem[method];
                            if (operation.tags) {
                                operation.tags.forEach(tag => enriched.metadata.tags.add(tag));
                            }
                        }
                    }
                }
            }
        }
        // Extract security schemes
        if (spec.components?.securitySchemes) {
            Object.keys(spec.components.securitySchemes).forEach(scheme => {
                enriched.metadata.security.add(scheme);
            });
        }
        // Extract schema names
        if (spec.components?.schemas) {
            Object.keys(spec.components.schemas).forEach(schema => {
                enriched.metadata.schemas.add(schema);
            });
        }
        return enriched;
    }
    /**
     * Extract operations from paths for test generation
     */
    async extractOperations(spec) {
        const operations = [];
        if (!spec.paths) {
            return operations;
        }
        for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
            if (!pathItem || typeof pathItem !== 'object') {
                continue;
            }
            const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
            for (const method of httpMethods) {
                const operation = pathItem[method];
                if (operation) {
                    operations.push({
                        path: pathStr,
                        method: method.toUpperCase(),
                        operation,
                        pathItem: pathItem
                    });
                }
            }
        }
        return operations;
    }
    /**
     * Get server URLs from specification
     */
    getServerUrls(spec) {
        if (!spec.servers || spec.servers.length === 0) {
            return ['http://localhost'];
        }
        return spec.servers.map(server => server.url);
    }
    /**
     * Private helper methods
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    isJsonContent(content) {
        const trimmed = content.trim();
        return trimmed.startsWith('{') && trimmed.endsWith('}');
    }
    isYamlContent(content) {
        return content.includes('openapi:') || content.includes('swagger:');
    }
    async validatePathItem(pathStr, pathItem, errors, warnings) {
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
        let hasOperations = false;
        for (const method of httpMethods) {
            const operation = pathItem[method];
            if (operation) {
                hasOperations = true;
                await this.validateOperation(pathStr, method, operation, errors, warnings);
            }
        }
        if (!hasOperations) {
            warnings.push(`Path ${pathStr} has no operations`);
        }
    }
    async validateOperation(pathStr, method, operation, errors, warnings) {
        const operationId = `${method.toUpperCase()} ${pathStr}`;
        if (!operation.responses || Object.keys(operation.responses).length === 0) {
            errors.push({
                field: `paths.${pathStr}.${method}.responses`,
                message: 'Operation must have at least one response'
            });
        }
        if (!operation.summary && !operation.description) {
            warnings.push(`Operation ${operationId} missing summary and description`);
        }
        // Validate parameters
        if (operation.parameters) {
            for (const [index, param] of operation.parameters.entries()) {
                if (typeof param === 'object' && 'name' in param) {
                    if (!param.name) {
                        errors.push({
                            field: `paths.${pathStr}.${method}.parameters[${index}].name`,
                            message: 'Parameter name is required'
                        });
                    }
                }
            }
        }
    }
    async validateComponents(components, errors, _warnings) {
        // Validate schemas
        if (components.schemas) {
            for (const [schemaName, schema] of Object.entries(components.schemas)) {
                if (!schema || typeof schema !== 'object') {
                    errors.push({
                        field: `components.schemas.${schemaName}`,
                        message: 'Schema must be an object'
                    });
                }
            }
        }
        // Validate security schemes
        if (components.securitySchemes) {
            for (const [schemeName, scheme] of Object.entries(components.securitySchemes)) {
                if (!scheme || typeof scheme !== 'object' || !scheme.type) {
                    errors.push({
                        field: `components.securitySchemes.${schemeName}`,
                        message: 'Security scheme must have a type'
                    });
                }
            }
        }
    }
    async validateSecurity(security, securitySchemes, errors, _warnings) {
        if (!securitySchemes) {
            errors.push({
                field: 'security',
                message: 'Security requirements defined but no security schemes found in components'
            });
            return;
        }
        for (const [index, requirement] of security.entries()) {
            if (!requirement || typeof requirement !== 'object') {
                errors.push({
                    field: `security[${index}]`,
                    message: 'Security requirement must be an object'
                });
                continue;
            }
            for (const schemeName of Object.keys(requirement)) {
                if (!securitySchemes[schemeName]) {
                    errors.push({
                        field: `security[${index}].${schemeName}`,
                        message: `Security scheme "${schemeName}" not found in components.securitySchemes`
                    });
                }
            }
        }
    }
}
exports.OpenAPIParser = OpenAPIParser;
//# sourceMappingURL=openapi-parser.js.map