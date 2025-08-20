/**
 * OpenAPI Validator Implementation
 * Week 1 Sprint 2: Comprehensive OpenAPI specification validation
 */
import { OpenAPISpec, ParsedOpenAPI, ValidationResult } from '../types';
export interface ValidationOptions {
    strict?: boolean;
    includeWarnings?: boolean;
    validateExamples?: boolean;
    checkSecurity?: boolean;
    validateRefs?: boolean;
    customRules?: ValidationRule[];
}
export interface ValidationRule {
    name: string;
    description: string;
    severity: 'error' | 'warning';
    validate: (spec: OpenAPISpec) => ValidationRuleResult[];
}
export interface ValidationRuleResult {
    field: string;
    message: string;
    severity: 'error' | 'warning';
    rule: string;
}
export declare class OpenAPIValidator {
    private parser;
    private customRules;
    constructor();
    /**
     * Validate OpenAPI specification from file
     */
    validateFromFile(filePath: string, options?: ValidationOptions): Promise<ValidationResult>;
    /**
     * Validate parsed OpenAPI specification
     */
    validateSpec(spec: ParsedOpenAPI, options?: ValidationOptions): Promise<ValidationResult>;
    /**
     * Validate OpenAPI schema structure
     */
    private validateSchema;
    /**
     * Validate paths section
     */
    private validatePaths;
    /**
     * Validate operations in paths
     */
    private validateOperations;
    /**
     * Validate response definitions
     */
    private validateResponses;
    /**
     * Validate custom rules
     */
    private validateCustomRules;
    /**
     * Validate security configuration
     */
    private validateSecurity;
    /**
     * Register custom validation rule
     */
    addCustomRule(rule: ValidationRule): void;
    /**
     * Helper methods
     */
    private extractPathParameters;
    private isValidMediaType;
    private validateSchemaObject;
    /**
     * Initialize default validation rules
     */
    private initializeDefaultRules;
}
//# sourceMappingURL=openapi-validator.d.ts.map