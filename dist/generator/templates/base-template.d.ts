/**
 * Base Template System for Test Generation
 * Week 2 Sprint 1: Extensible template system for different test frameworks
 */
import { SourceFile } from 'ts-morph';
import { TestCase, GenerationOptions } from '../test-generator';
export interface TestTemplate {
    framework: string;
    fileExtension: string;
    addImports(sourceFile: SourceFile, options: GenerationOptions): void;
    addSetup(sourceFile: SourceFile, options: GenerationOptions): void;
    addTestSuite(sourceFile: SourceFile, suiteName: string, testCases: TestCase[], options: GenerationOptions): void;
    addTestCase(sourceFile: SourceFile, testCase: TestCase, options: GenerationOptions): void;
    addTeardown(sourceFile: SourceFile, options: GenerationOptions): void;
    generateAssertion(assertion: TestAssertion): string;
    generateApiCall(method: string, path: string, data?: any): string;
    generateMockSetup(mockConfig: MockConfiguration): string;
}
export interface TestAssertion {
    type: 'equals' | 'contains' | 'matches' | 'throws' | 'status' | 'type';
    actual: string;
    expected: any;
    message?: string;
}
export interface MockConfiguration {
    endpoint: string;
    method: string;
    response: any;
    statusCode: number;
    delay?: number;
}
export declare abstract class BaseTestTemplate implements TestTemplate {
    abstract framework: string;
    abstract fileExtension: string;
    protected sanitizeTestName(name: string): string;
    protected formatRequestData(data: any): string;
    protected extractPathParams(path: string): string[];
    protected generateApiClientCall(method: string, path: string, data?: any): string;
    abstract addImports(sourceFile: SourceFile, options: GenerationOptions): void;
    abstract addSetup(sourceFile: SourceFile, options: GenerationOptions): void;
    abstract addTestSuite(sourceFile: SourceFile, suiteName: string, testCases: TestCase[], options: GenerationOptions): void;
    abstract addTestCase(sourceFile: SourceFile, testCase: TestCase, options: GenerationOptions): void;
    abstract addTeardown(sourceFile: SourceFile, options: GenerationOptions): void;
    abstract generateAssertion(assertion: TestAssertion): string;
    abstract generateApiCall(method: string, path: string, data?: any): string;
    abstract generateMockSetup(mockConfig: MockConfiguration): string;
}
export declare class TemplateRegistry {
    private templates;
    register(template: TestTemplate): void;
    get(framework: string): TestTemplate | undefined;
    getSupportedFrameworks(): string[];
    isSupported(framework: string): boolean;
}
//# sourceMappingURL=base-template.d.ts.map