/**
 * Core Type Definitions
 * Week 1 Sprint 1: Foundation Types for API Test Generator
 */
export interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
        contact?: {
            name?: string;
            email?: string;
            url?: string;
        };
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    paths: Record<string, PathItem>;
    components?: {
        schemas?: Record<string, Schema>;
        securitySchemes?: Record<string, SecurityScheme>;
        parameters?: Record<string, Parameter>;
        responses?: Record<string, Response>;
    };
    security?: Array<Record<string, string[]>>;
}
export interface PathItem {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    delete?: Operation;
    patch?: Operation;
    head?: Operation;
    options?: Operation;
    trace?: Operation;
    parameters?: Parameter[];
}
export interface Operation {
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: Parameter[];
    method?: string;
    path?: string;
    requestBody?: RequestBody;
    responses: Record<string, Response>;
    security?: Array<Record<string, string[]>>;
}
export interface Parameter {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    schema?: Schema;
    description?: string;
}
export interface RequestBody {
    description?: string;
    required?: boolean;
    content: Record<string, MediaType>;
}
export interface Response {
    description: string;
    content?: Record<string, MediaType>;
    headers?: Record<string, Header>;
}
export interface MediaType {
    schema?: Schema;
    example?: any;
    examples?: Record<string, Example>;
}
export interface Header {
    description?: string;
    schema?: Schema;
}
export interface Example {
    summary?: string;
    description?: string;
    value?: any;
}
export interface Schema {
    type?: string;
    format?: string;
    enum?: any[];
    items?: Schema;
    properties?: Record<string, Schema>;
    required?: string[];
    additionalProperties?: boolean | Schema;
    nullable?: boolean;
    example?: any;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: boolean | number;
    exclusiveMaximum?: boolean | number;
    minLength?: number;
    maxLength?: number;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    multipleOf?: number;
    pattern?: string;
    $ref?: string;
    allOf?: Schema[];
    oneOf?: Schema[];
    anyOf?: Schema[];
    not?: Schema;
}
export interface SecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    description?: string;
    name?: string;
    in?: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
    flows?: {
        implicit?: {
            authorizationUrl: string;
            scopes: Record<string, string>;
        };
        password?: {
            tokenUrl: string;
            scopes: Record<string, string>;
        };
        clientCredentials?: {
            tokenUrl: string;
            scopes: Record<string, string>;
        };
        authorizationCode?: {
            authorizationUrl: string;
            tokenUrl: string;
            scopes: Record<string, string>;
        };
    };
}
export declare enum TestFramework {
    JEST = "jest",
    MOCHA = "mocha",
    VITEST = "vitest",
    JASMINE = "jasmine"
}
export interface GenerationOptions {
    specPath: string;
    outputDir: string;
    framework?: TestFramework;
    verbose?: boolean;
    coverage?: boolean;
    template?: string;
    plugins?: string[];
    config?: string;
    timeout?: number;
    parallel?: boolean;
    watch?: boolean;
    dryRun?: boolean;
}
export interface GenerationResult {
    success: boolean;
    filesGenerated: number;
    testsGenerated: number;
    outputDir: string;
    duration: number;
    framework: TestFramework;
    error?: string;
    details?: string[];
    warnings?: string[];
    performance?: {
        parseTime: number;
        generateTime: number;
        writeTime: number;
        totalMemory: number;
    };
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
    checks: {
        schema: boolean;
        paths: boolean;
        operations: boolean;
        responses: boolean;
    };
    details?: {
        pathCount: number;
        operationCount: number;
        schemaCount: number;
        securitySchemesCount: number;
    };
}
export interface CLICommandOption {
    flags: string;
    description: string;
    defaultValue?: any;
    choices?: string[];
    required?: boolean;
}
export interface CLICommand {
    name: string;
    description: string;
    options: CLICommandOption[];
    action: (args: any, options: any) => Promise<CLIResult>;
    examples?: string[];
}
export interface CLIResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
    suggestion?: string;
    [key: string]: any;
}
export interface Plugin {
    name: string;
    version: string;
    description: string;
    generate(options: GenerationOptions): Promise<GenerationResult>;
    validate(spec: OpenAPISpec): Promise<ValidationResult>;
    beforeGenerate?(options: GenerationOptions): Promise<void>;
    afterGenerate?(result: GenerationResult): Promise<void>;
    configure?(config: PluginConfig): void;
}
export interface PluginConfig {
    enabled: boolean;
    options: Record<string, any>;
}
export interface Config {
    outputDir: string;
    framework: TestFramework;
    verbose: boolean;
    coverage: boolean;
    timeout: number;
    plugins: Record<string, PluginConfig>;
    templates: Record<string, string>;
    presets: Record<string, Partial<GenerationOptions>>;
}
export interface GenerationContext {
    spec: OpenAPISpec;
    options: GenerationOptions;
    config: Config;
    metadata: {
        generatedAt: Date;
        version: string;
        generator: string;
    };
}
export declare class APITestGeneratorError extends Error {
    code: string;
    details?: any;
    constructor(message: string, code: string, details?: any);
}
export declare class ValidationError extends APITestGeneratorError {
    constructor(message: string, details?: any);
}
export declare class GenerationError extends APITestGeneratorError {
    constructor(message: string, details?: any);
}
export declare class ConfigurationError extends APITestGeneratorError {
    constructor(message: string, details?: any);
}
export declare class ParsingError extends APITestGeneratorError {
    constructor(message: string, details?: any);
}
export type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';
export interface EndpointInfo {
    path: string;
    method: HTTPMethod;
    operationId?: string;
    summary?: string;
    description?: string;
    parameters?: Parameter[];
    requestBody?: RequestBody;
    responses: Record<string, Response>;
    tags?: string[];
    security?: Array<Record<string, string[]>>;
}
export interface TestCase {
    name: string;
    endpoint: EndpointInfo;
    testData?: any;
    expectedResponse?: any;
    statusCode: number;
    description?: string;
}
export interface PerformanceMetrics {
    duration: number;
    memoryUsed: number;
    memoryPeak: number;
    endpointsPerSecond: number;
    filesPerSecond: number;
}
export interface Template {
    name: string;
    description: string;
    framework: TestFramework;
    files: TemplateFile[];
}
export interface TemplateFile {
    path: string;
    content: string;
    isTemplate: boolean;
    variables?: Record<string, any>;
}
export interface ParsingOptions {
    strict?: boolean;
    validateRefs?: boolean;
    dereferenceRefs?: boolean;
    allowEmptyPaths?: boolean;
}
export interface ParsingResult {
    success: boolean;
    spec?: ParsedOpenAPI;
    error?: string;
    validation?: {
        isValid: boolean;
        errors: ValidationErrorDetail[];
        warnings: string[];
        score: number;
    };
    metadata: {
        filePath?: string;
        fileSize?: number;
        parseTime: number;
        version?: string;
        title?: string;
    };
}
export interface ParsedOpenAPI extends OpenAPISpec {
    metadata: {
        totalPaths: number;
        totalOperations: number;
        httpMethods: Set<string>;
        tags: Set<string>;
        security: Set<string>;
        schemas: Set<string>;
    };
}
export interface ValidationErrorDetail {
    field: string;
    message: string;
}
//# sourceMappingURL=types.d.ts.map