"use strict";
/**
 * Schema-Based Test Data Generator
 * Week 2 Sprint 1: Realistic and comprehensive test data generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataGenerator = void 0;
class DataGenerator {
    constructor(options = {}) {
        this.generationStack = [];
        this.options = {
            useExamples: true,
            generateEdgeCases: false,
            includeNull: false,
            includeUndefined: false,
            maxStringLength: 100,
            maxArrayItems: 10,
            maxObjectDepth: 5,
            locale: 'en_US',
            ...options
        };
        // Simple seeded random number generator
        const seed = this.options.seed || Date.now();
        this.rng = this.createSeededRandom(seed);
    }
    /**
     * Generate test data from OpenAPI schema
     */
    async generateFromSchema(schema, type = 'valid') {
        const startTime = performance.now();
        this.generationStack = [];
        try {
            const value = await this.generateValue(schema, type);
            const generationTime = performance.now() - startTime;
            return {
                value,
                type,
                metadata: {
                    schema,
                    constraints: this.extractConstraints(schema),
                    generatedFields: [...this.generationStack],
                    generationTime
                }
            };
        }
        catch (error) {
            throw new Error(`Data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate parameter data
     */
    async generateParameterData(parameter, type = 'valid') {
        if (typeof parameter === 'object' && 'schema' in parameter && parameter.schema) {
            const result = await this.generateFromSchema(parameter.schema, type);
            return result.value;
        }
        return null;
    }
    /**
     * Generate request body data
     */
    async generateRequestBodyData(requestBody, contentType = 'application/json', type = 'valid') {
        if (requestBody?.content?.[contentType]?.schema) {
            const result = await this.generateFromSchema(requestBody.content[contentType].schema, type);
            return result.value;
        }
        return null;
    }
    /**
     * Generate batch test data
     */
    async generateBatch(schema, count, types = ['valid']) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const type = types[i % types.length];
            const result = await this.generateFromSchema(schema, type);
            results.push(result);
        }
        return results;
    }
    /**
     * Core value generation logic
     */
    async generateValue(schema, type) {
        // Handle schema references
        if (schema.$ref) {
            // In a real implementation, resolve the reference
            throw new Error('Schema references not yet supported');
        }
        // Check for examples first if enabled
        if (this.options.useExamples && schema.example !== undefined && type === 'valid') {
            return schema.example;
        }
        // Handle schema composition (allOf, oneOf, anyOf)
        if (schema.allOf) {
            return this.generateAllOfValue(schema.allOf, type);
        }
        if (schema.oneOf) {
            return this.generateOneOfValue(schema.oneOf, type);
        }
        if (schema.anyOf) {
            return this.generateAnyOfValue(schema.anyOf, type);
        }
        // Generate based on schema type
        switch (schema.type) {
            case 'string':
                return this.generateStringValue(schema, type);
            case 'number':
                return this.generateNumberValue(schema, type);
            case 'integer':
                return this.generateIntegerValue(schema, type);
            case 'boolean':
                return this.generateBooleanValue(schema, type);
            case 'array':
                return this.generateArrayValue(schema, type);
            case 'object':
                return this.generateObjectValue(schema, type);
            case 'null':
                return null;
            default:
                // Handle schemas without explicit type
                return this.generateUnknownTypeValue(schema, type);
        }
    }
    /**
     * String value generation
     */
    generateStringValue(schema, type) {
        if (type === 'invalid') {
            return this.generateInvalidString(schema);
        }
        // Handle enum values
        if (schema.enum) {
            if (type === 'edge') {
                return schema.enum[0]; // First enum value as edge case
            }
            return schema.enum[Math.floor(this.rng() * schema.enum.length)];
        }
        // Handle format-specific generation
        if (schema.format) {
            return this.generateFormattedString(schema.format, schema, type);
        }
        // Handle patterns
        if (schema.pattern) {
            return this.generatePatternString(schema.pattern, schema, type);
        }
        // Generate based on length constraints
        const minLength = schema.minLength || 0;
        const maxLength = schema.maxLength || this.options.maxStringLength;
        let targetLength;
        switch (type) {
            case 'minimal':
                targetLength = minLength;
                break;
            case 'maximal':
                targetLength = maxLength;
                break;
            case 'edge':
                targetLength = minLength === 0 ? 1 : minLength;
                break;
            default:
                targetLength = Math.floor(this.rng() * (maxLength - minLength + 1)) + minLength;
        }
        return this.generateRandomString(targetLength);
    }
    /**
     * Number value generation
     */
    generateNumberValue(schema, type) {
        if (type === 'invalid') {
            return NaN; // Invalid number
        }
        const min = schema.minimum ?? Number.MIN_SAFE_INTEGER;
        const max = schema.maximum ?? Number.MAX_SAFE_INTEGER;
        const multipleOf = schema.multipleOf;
        let value;
        switch (type) {
            case 'minimal':
                value = min;
                break;
            case 'maximal':
                value = max;
                break;
            case 'edge':
                value = schema.exclusiveMinimum ? min + 0.001 : min;
                break;
            default:
                value = this.rng() * (max - min) + min;
        }
        // Apply multipleOf constraint
        if (multipleOf) {
            value = Math.round(value / multipleOf) * multipleOf;
        }
        return value;
    }
    /**
     * Integer value generation
     */
    generateIntegerValue(schema, type) {
        if (type === 'invalid') {
            return 3.14; // Invalid integer (has decimal)
        }
        const min = schema.minimum ?? Number.MIN_SAFE_INTEGER;
        const max = schema.maximum ?? Number.MAX_SAFE_INTEGER;
        let value;
        switch (type) {
            case 'minimal':
                value = Math.ceil(min);
                break;
            case 'maximal':
                value = Math.floor(max);
                break;
            case 'edge':
                value = schema.exclusiveMinimum ? Math.ceil(min) + 1 : Math.ceil(min);
                break;
            default:
                value = Math.floor(this.rng() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
        }
        return Math.round(value);
    }
    /**
     * Boolean value generation
     */
    generateBooleanValue(schema, type) {
        if (type === 'invalid') {
            return 'not-a-boolean'; // Invalid boolean
        }
        return this.rng() > 0.5;
    }
    /**
     * Array value generation
     */
    async generateArrayValue(schema, type) {
        if (type === 'invalid') {
            return 'not-an-array'; // Invalid array
        }
        const minItems = schema.minItems || 0;
        const maxItems = schema.maxItems || this.options.maxArrayItems;
        let targetLength;
        switch (type) {
            case 'minimal':
                targetLength = minItems;
                break;
            case 'maximal':
                targetLength = maxItems;
                break;
            case 'edge':
                targetLength = minItems === 0 ? 1 : minItems;
                break;
            default:
                targetLength = Math.floor(this.rng() * (maxItems - minItems + 1)) + minItems;
        }
        const items = [];
        const itemSchema = schema.items || { type: 'string' };
        for (let i = 0; i < targetLength; i++) {
            this.generationStack.push(`[${i}]`);
            // @ts-ignore - intentional type comparison for data generation
            const validType = type === 'invalid' ? 'valid' : type;
            const item = await this.generateValue(itemSchema, validType);
            items.push(item);
            this.generationStack.pop();
        }
        // Handle uniqueItems constraint
        if (schema.uniqueItems && items.length > 1) {
            return [...new Set(items.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
        }
        return items;
    }
    /**
     * Object value generation
     */
    async generateObjectValue(schema, type) {
        if (type === 'invalid') {
            return 'not-an-object'; // Invalid object
        }
        // Check for circular references
        if (this.generationStack.length > this.options.maxObjectDepth) {
            return {}; // Prevent infinite recursion
        }
        const obj = {};
        const requiredFields = schema.required || [];
        const properties = schema.properties || {};
        // Generate required properties first
        for (const propertyName of requiredFields) {
            if (properties[propertyName]) {
                this.generationStack.push(`.${propertyName}`);
                // @ts-ignore - intentional type comparison for data generation
                const validType = type === 'invalid' ? 'valid' : type;
                obj[propertyName] = await this.generateValue(properties[propertyName], validType);
                this.generationStack.pop();
            }
        }
        // Generate optional properties based on type
        const optionalProperties = Object.keys(properties).filter(name => !requiredFields.includes(name));
        if (type !== 'minimal') {
            let propertiesToGenerate;
            switch (type) {
                case 'maximal':
                    propertiesToGenerate = optionalProperties;
                    break;
                case 'valid':
                    // For 'valid' type, generate all properties to ensure comprehensive test data
                    propertiesToGenerate = optionalProperties;
                    break;
                case 'edge':
                    // For edge cases, generate all properties
                    propertiesToGenerate = optionalProperties;
                    break;
                default:
                    // For other types, use probabilistic generation
                    propertiesToGenerate = optionalProperties.filter(() => this.rng() > 0.5);
            }
            for (const propertyName of propertiesToGenerate) {
                this.generationStack.push(`.${propertyName}`);
                // @ts-ignore - intentional type comparison for data generation
                const validType = type === 'invalid' ? 'valid' : type;
                obj[propertyName] = await this.generateValue(properties[propertyName], validType);
                this.generationStack.pop();
            }
        }
        // Handle additionalProperties
        if (schema.additionalProperties === true && type === 'maximal') {
            // Add some additional properties
            const additionalCount = Math.floor(this.rng() * 3) + 1;
            for (let i = 0; i < additionalCount; i++) {
                const propName = `additional_${i}`;
                obj[propName] = this.generateRandomString(8);
            }
        }
        return obj;
    }
    /**
     * Helper methods for specific string formats
     */
    generateFormattedString(format, schema, type) {
        switch (format) {
            case 'email':
                return type === 'edge' ? 'a@b.co' : 'user@example.com';
            case 'uri':
            case 'url':
                return type === 'edge' ? 'http://a.b' : 'https://example.com';
            case 'uuid':
                return this.generateUUID();
            case 'date':
                return new Date().toISOString().split('T')[0];
            case 'date-time':
                return new Date().toISOString();
            case 'time':
                return new Date().toTimeString().split(' ')[0];
            case 'ipv4':
                return '192.168.1.1';
            case 'ipv6':
                return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
            case 'hostname':
                return 'example.com';
            case 'password':
                return type === 'minimal' ? 'pass' : 'SecurePassword123!';
            default:
                return this.generateRandomString(schema.maxLength || 20);
        }
    }
    generatePatternString(pattern, schema, type) {
        // Simple pattern handling - in production, use a proper regex generator
        const length = schema.maxLength || 10;
        // Basic patterns
        if (pattern === '^[a-zA-Z]+$') {
            return this.generateRandomString(length, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        }
        if (pattern === '^[0-9]+$') {
            return this.generateRandomString(length, '0123456789');
        }
        // Fallback to basic string
        return this.generateRandomString(length);
    }
    generateInvalidString(schema) {
        // Generate various types of invalid strings
        const invalidTypes = [null, 123, true, [], {}];
        return invalidTypes[Math.floor(this.rng() * invalidTypes.length)];
    }
    generateRandomString(length, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(this.rng() * charset.length));
        }
        return result;
    }
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.floor(this.rng() * 16);
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    /**
     * Schema composition handlers
     */
    async generateAllOfValue(schemas, type) {
        // Merge all schemas and generate a value that satisfies all
        const mergedSchema = this.mergeSchemas(schemas);
        return this.generateValue(mergedSchema, type);
    }
    async generateOneOfValue(schemas, type) {
        // Pick one schema randomly and generate from it
        const selectedSchema = schemas[Math.floor(this.rng() * schemas.length)];
        if (!selectedSchema)
            throw new Error('No schema available in oneOf');
        return this.generateValue(selectedSchema, type);
    }
    async generateAnyOfValue(schemas, type) {
        // Similar to oneOf for now
        const selectedSchema = schemas[Math.floor(this.rng() * schemas.length)];
        if (!selectedSchema)
            throw new Error('No schema available in anyOf');
        return this.generateValue(selectedSchema, type);
    }
    generateUnknownTypeValue(schema, type) {
        // Try to infer type from other properties
        if (schema.properties) {
            return this.generateObjectValue({ ...schema, type: 'object' }, type);
        }
        if (schema.items) {
            return this.generateArrayValue({ ...schema, type: 'array' }, type);
        }
        if (schema.format) {
            return this.generateFormattedString(schema.format, { ...schema, type: 'string' }, type);
        }
        // Default to string
        return this.generateStringValue({ ...schema, type: 'string' }, type);
    }
    /**
     * Utility methods
     */
    mergeSchemas(schemas) {
        // Simple schema merging - in production, handle this more comprehensively
        const merged = { type: 'object' };
        for (const schema of schemas) {
            Object.assign(merged, schema);
        }
        return merged;
    }
    extractConstraints(schema) {
        const constraints = [];
        if (schema.type)
            constraints.push(`type: ${schema.type}`);
        if (schema.format)
            constraints.push(`format: ${schema.format}`);
        if (schema.pattern)
            constraints.push(`pattern: ${schema.pattern}`);
        if (schema.minimum !== undefined)
            constraints.push(`minimum: ${schema.minimum}`);
        if (schema.maximum !== undefined)
            constraints.push(`maximum: ${schema.maximum}`);
        if (schema.minLength !== undefined)
            constraints.push(`minLength: ${schema.minLength}`);
        if (schema.maxLength !== undefined)
            constraints.push(`maxLength: ${schema.maxLength}`);
        if (schema.minItems !== undefined)
            constraints.push(`minItems: ${schema.minItems}`);
        if (schema.maxItems !== undefined)
            constraints.push(`maxItems: ${schema.maxItems}`);
        if (schema.enum)
            constraints.push(`enum: [${schema.enum.join(', ')}]`);
        if (schema.required)
            constraints.push(`required: [${schema.required.join(', ')}]`);
        return constraints;
    }
    createSeededRandom(seed) {
        let state = seed;
        return () => {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }
    /**
     * Public utility methods
     */
    resetSeed(seed) {
        const newSeed = seed || Date.now();
        this.rng = this.createSeededRandom(newSeed);
    }
    updateOptions(options) {
        this.options = { ...this.options, ...options };
    }
    getGenerationStatistics() {
        return {
            maxDepthReached: this.generationStack.length,
            generationStackSize: this.generationStack.length,
            currentOptions: { ...this.options }
        };
    }
}
exports.DataGenerator = DataGenerator;
//# sourceMappingURL=data-generator.js.map