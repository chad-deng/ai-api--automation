/**
 * OpenAPI Test Generation Engine
 * Week 2 Sprint 1: Core test generation with AST-based code generation
 */
import { SecurityTestCase } from '../auth/security-validator';
import { CredentialManager, CredentialProfile } from '../auth/credential-manager';
import { AdvancedScenario } from './advanced-scenario-generator';
import { CodeQualityValidator, QualityValidationResult } from '../validation/code-quality-validator';
import { PerformanceOptimizationEngine, PerformanceMetrics } from '../performance/performance-optimization-engine';
import { ErrorHandlingSystem } from '../error/error-handling-system';
import { ConfigurationManager } from '../config/configuration-manager';
import { EnterpriseAuthManager } from '../auth/enterprise-auth-manager';
import { Operation } from '../types';
export interface GenerationOptions {
    framework: 'jest' | 'mocha' | 'vitest';
    outputDir: string;
    includeTypes?: boolean;
    generateMocks?: boolean;
    authConfig?: AuthConfiguration;
    credentialProfile?: string;
    includeSecurityTests?: boolean;
    dataGeneration?: DataGenerationConfig;
    coverage?: CoverageConfig;
    contractTesting?: ContractTestingConfig;
    codeQuality?: CodeQualityConfig;
    performance?: PerformanceOptimizationConfig;
    dryRun?: boolean;
}
export interface AuthConfiguration {
    type: 'bearer' | 'apikey' | 'oauth2' | 'basic';
    location?: 'header' | 'query' | 'cookie';
    name?: string;
    tokenUrl?: string;
}
export interface DataGenerationConfig {
    useExamples: boolean;
    generateEdgeCases: boolean;
    maxStringLength: number;
    maxArrayItems: number;
    includeNull: boolean;
}
export interface CoverageConfig {
    includeErrorCases: boolean;
    includeEdgeCases: boolean;
    includeSecurityTests: boolean;
    statusCodes: string[];
}
export interface ContractTestingConfig {
    validateRequests: boolean;
    validateResponses: boolean;
    validateHeaders: boolean;
    strictMode: boolean;
}
export interface CodeQualityConfig {
    validateOnGeneration: boolean;
    autoFix: boolean;
    strictMode: boolean;
    eslintConfig?: any;
    prettierConfig?: any;
    typescriptConfig?: any;
    generateReport: boolean;
}
export interface PerformanceOptimizationConfig {
    enableParallelProcessing: boolean;
    maxWorkers?: number;
    batchSize?: number;
    memoryThreshold?: number;
    enableCaching?: boolean;
    enableStreaming?: boolean;
    streamingCallback?: (testCases: TestCase[]) => Promise<void>;
}
export interface GenerationResult {
    success: boolean;
    generatedFiles: GeneratedFile[];
    summary: GenerationSummary;
    errors: string[];
    warnings: string[];
    qualityValidation?: any;
    performanceMetrics?: PerformanceMetrics;
}
export interface GeneratedFile {
    path: string;
    type: 'test' | 'type' | 'mock' | 'helper';
    size: number;
    testCount: number;
}
export interface GenerationSummary {
    totalTests: number;
    operationsCovered: number;
    totalOperations: number;
    coveragePercentage: number;
    frameworks: string[];
    estimatedRunTime: number;
}
export interface TestCase {
    name: string;
    operation: Operation;
    method: string;
    path: string;
    description: string;
    requestData?: any;
    expectedResponse?: any;
    statusCode: number;
    tags: string[];
}
export declare class TestGenerator {
    private project;
    private parser;
    private validator;
    private securityValidator;
    private credentialManager;
    private advancedScenarioGenerator;
    private codeQualityValidator;
    private performanceEngine;
    private errorHandler;
    private configManager;
    private authManager;
    private generatedTestCases;
    private securityTestCases;
    private advancedScenarios;
    constructor(configManager?: ConfigurationManager);
    /**
     * Enhanced generation method using all new features (US-016 through US-024)
     */
    generateFromSpec(specPath: string, options: GenerationOptions): Promise<GenerationResult & {
        metrics?: PerformanceMetrics;
        qualityReport?: QualityValidationResult;
    }>;
    /**
     * Generate tests from OpenAPI specification file (legacy method)
     */
    generateFromFile(specPath: string, options: GenerationOptions): Promise<GenerationResult>;
    /**
     * Generate test cases from operations
     */
    private generateTestCases;
    /**
     * Generate success test cases for an operation
     */
    private generateSuccessTestCases;
    /**
     * Generate error test cases for an operation
     */
    private generateErrorTestCases;
    /**
     * Generate edge case tests for an operation
     */
    private generateEdgeTestCases;
    /**
     * Generate test files using AST manipulation
     */
    private generateTestFiles;
    /**
     * Generate test file content using AST
     */
    private generateTestFileContent;
    /**
     * Convert security tests to regular test cases
     */
    private convertSecurityTestsToTestCases;
    /**
     * Generate contract testing files
     */
    private generateContractTests;
    /**
     * Add contract test imports
     */
    private addContractTestImports;
    /**
     * Generate contract test content
     */
    private generateContractTestContent;
    /**
     * Add response schema validation tests
     */
    private addResponseSchemaTests;
    /**
     * Add request schema validation tests
     */
    private addRequestSchemaTests;
    /**
     * Add header validation tests
     */
    private addHeaderValidationTests;
    /**
     * Count contract tests
     */
    private countContractTests;
    /**
     * Add test framework-specific imports
     */
    private addTestFrameworkImports;
    /**
     * Add API client imports
     */
    private addApiClientImports;
    /**
     * Add individual test case to source file
     */
    private addTestCase;
    /**
     * Generate test body content
     */
    private generateTestBody;
    /**
     * Generate API call code
     */
    private generateApiCall;
    /**
     * Helper methods for data generation
     */
    private generateRequestData;
    private generateInvalidRequestData;
    private generateEdgeRequestData;
    private generateResponseData;
    private generateValueFromSchema;
    private generateStringValue;
    private generateNumberValue;
    private generateIntegerValue;
    private generateArrayValue;
    private generateObjectValue;
    private generateObjectFromProperties;
    private generateEdgeValueFromSchema;
    private groupTestCasesByTag;
    private generateTypeDefinitions;
    private generateMockFiles;
    private createEmptySummary;
    /**
     * Public API methods
     */
    getGeneratedTestCases(): TestCase[];
    getGeneratedSecurityTestCases(): SecurityTestCase[];
    getGeneratedAdvancedScenarios(): AdvancedScenario[];
    generateWithAuthentication(specPath: string, options: GenerationOptions, credentialProfile?: CredentialProfile): Promise<GenerationResult>;
    validateGeneration(options: GenerationOptions): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    initializeCredentials(): Promise<void>;
    getCredentialManager(): CredentialManager;
    getPerformanceEngine(): PerformanceOptimizationEngine;
    getPerformanceMetrics(): PerformanceMetrics;
    /**
     * Helper methods for enhanced generation
     */
    private generateTestCasesStandard;
    private generateTypeScriptCode;
    private groupTestCasesByOperation;
    private calculateSummary;
    /**
     * Get enhanced managers for external use
     */
    getErrorHandler(): ErrorHandlingSystem;
    getConfigManager(): ConfigurationManager;
    getAuthManager(): EnterpriseAuthManager;
    getCodeQualityValidator(): CodeQualityValidator;
    validateCodeQuality(filePaths: string[]): Promise<QualityValidationResult>;
}
//# sourceMappingURL=test-generator.d.ts.map