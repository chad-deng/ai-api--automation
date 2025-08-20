/**
 * OpenAPI Parser Implementation
 * Week 1 Sprint 2: AST-based OpenAPI specification parser
 */
import { OpenAPISpec, Operation, ParsedOpenAPI, ParsingOptions, ParsingResult, PathItem, ValidationErrorDetail } from '../types';
export declare class OpenAPIParser {
    private project;
    private readonly supportedVersions;
    constructor();
    /**
     * Parse OpenAPI specification from file
     */
    parseFromFile(filePath: string, options?: ParsingOptions): Promise<ParsingResult>;
    /**
     * Parse OpenAPI specification from string content
     */
    parseContent(content: string, filePath?: string): Promise<OpenAPISpec>;
    /**
     * Validate OpenAPI specification structure
     */
    validateSpec(spec: OpenAPISpec): Promise<{
        isValid: boolean;
        errors: ValidationErrorDetail[];
        warnings: string[];
        score: number;
    }>;
    /**
     * Enrich specification with computed metadata
     */
    enrichSpecification(spec: OpenAPISpec, _options: ParsingOptions): Promise<ParsedOpenAPI>;
    /**
     * Extract operations from paths for test generation
     */
    extractOperations(spec: ParsedOpenAPI): Promise<Array<{
        path: string;
        method: string;
        operation: Operation;
        pathItem: PathItem;
    }>>;
    /**
     * Get server URLs from specification
     */
    getServerUrls(spec: OpenAPISpec): string[];
    /**
     * Private helper methods
     */
    private fileExists;
    private isJsonContent;
    private isYamlContent;
    private validatePathItem;
    private validateOperation;
    private validateComponents;
    private validateSecurity;
}
//# sourceMappingURL=openapi-parser.d.ts.map