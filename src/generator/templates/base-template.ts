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

export abstract class BaseTestTemplate implements TestTemplate {
  abstract framework: string;
  abstract fileExtension: string;

  // Common utility methods
  protected sanitizeTestName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
  }

  protected formatRequestData(data: any): string {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }
    return JSON.stringify(data, null, 4).replace(/\n/g, '\n    ');
  }

  protected extractPathParams(path: string): string[] {
    const matches = path.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  protected generateApiClientCall(method: string, path: string, data?: any): string {
    const methodLower = method.toLowerCase();
    const pathParams = this.extractPathParams(path);
    
    // Replace path parameters with actual values from data
    let finalPath = path;
    if (data && pathParams.length > 0) {
      pathParams.forEach(param => {
        if (data[param]) {
          finalPath = finalPath.replace(`{${param}}`, `\${${param}}`);
        }
      });
    }

    if (data && ['post', 'put', 'patch'].includes(methodLower)) {
      return `apiClient.${methodLower}(\`${finalPath}\`, requestData)`;
    } else if (data && methodLower === 'get') {
      return `apiClient.${methodLower}(\`${finalPath}\`, { params: requestData })`;
    } else {
      return `apiClient.${methodLower}(\`${finalPath}\`)`;
    }
  }

  // Abstract methods to be implemented by specific templates
  abstract addImports(sourceFile: SourceFile, options: GenerationOptions): void;
  abstract addSetup(sourceFile: SourceFile, options: GenerationOptions): void;
  abstract addTestSuite(sourceFile: SourceFile, suiteName: string, testCases: TestCase[], options: GenerationOptions): void;
  abstract addTestCase(sourceFile: SourceFile, testCase: TestCase, options: GenerationOptions): void;
  abstract addTeardown(sourceFile: SourceFile, options: GenerationOptions): void;
  abstract generateAssertion(assertion: TestAssertion): string;
  abstract generateApiCall(method: string, path: string, data?: any): string;
  abstract generateMockSetup(mockConfig: MockConfiguration): string;
}

export class TemplateRegistry {
  private templates: Map<string, TestTemplate> = new Map();

  register(template: TestTemplate): void {
    this.templates.set(template.framework, template);
  }

  get(framework: string): TestTemplate | undefined {
    return this.templates.get(framework);
  }

  getSupportedFrameworks(): string[] {
    return Array.from(this.templates.keys());
  }

  isSupported(framework: string): boolean {
    return this.templates.has(framework);
  }
}