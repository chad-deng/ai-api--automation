/**
 * Jest Test Template Implementation
 * Week 2 Sprint 1: Jest-specific test generation template
 */
import { SourceFile } from 'ts-morph';
import { BaseTestTemplate, TestAssertion, MockConfiguration } from './base-template';
import { TestCase, GenerationOptions } from '../test-generator';
export declare class JestTemplate extends BaseTestTemplate {
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
    private generateTestBody;
    private getStatusText;
}
//# sourceMappingURL=jest-template.d.ts.map