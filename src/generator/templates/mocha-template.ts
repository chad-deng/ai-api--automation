/**
 * Mocha Test Template Implementation
 * Week 2 Sprint 1: Mocha-specific test generation template
 */

import { SourceFile } from 'ts-morph';
import { BaseTestTemplate, TestAssertion, MockConfiguration } from './base-template';
import { TestCase, GenerationOptions } from '../test-generator';

export class MochaTemplate extends BaseTestTemplate {
  framework = 'mocha';
  fileExtension = '.test.ts';

  addImports(sourceFile: SourceFile, options: GenerationOptions): void {
    // Mocha testing framework imports
    sourceFile.addImportDeclaration({
      namedImports: ['describe', 'it', 'beforeEach', 'afterEach', 'before', 'after'],
      moduleSpecifier: 'mocha'
    });

    // Chai assertion library
    sourceFile.addImportDeclaration({
      namedImports: ['expect'],
      moduleSpecifier: 'chai'
    });

    // Sinon for mocking (if mocks enabled)
    if (options.generateMocks) {
      sourceFile.addImportDeclaration({
        namedImports: ['sinon'],
        moduleSpecifier: 'sinon'
      });
    }

    // API client import
    sourceFile.addImportDeclaration({
      namedImports: ['ApiClient'],
      moduleSpecifier: '../helpers/api-client'
    });

    // Type imports if enabled
    if (options.includeTypes) {
      sourceFile.addImportDeclaration({
        namedImports: ['ApiResponse', 'RequestConfig'],
        moduleSpecifier: '../types/api-types'
      });
    }
  }

  addSetup(sourceFile: SourceFile, options: GenerationOptions): void {
    let setupCode = `
  let apiClient: ApiClient;
  
  before(function() {
    // Global test setup
    this.timeout(10000);
  });

  beforeEach(function() {
    this.timeout(5000);
    apiClient = new ApiClient({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      timeout: 5000`;

    // Add authentication setup if configured
    if (options.authConfig) {
      switch (options.authConfig.type) {
        case 'bearer':
          setupCode += `,
      headers: {
        'Authorization': \`Bearer \${process.env.API_TOKEN || 'test-token'}\`
      }`;
          break;
        case 'apikey':
          const headerName = options.authConfig.name || 'X-API-Key';
          setupCode += `,
      headers: {
        '${headerName}': process.env.API_KEY || 'test-api-key'
      }`;
          break;
      }
    }

    setupCode += `
    });
  });

  afterEach(function() {
    // Cleanup after each test`;
    
    if (options.generateMocks) {
      setupCode += `
    sinon.restore();`;
    }
    
    setupCode += `
  });

  after(function() {
    // Global test cleanup
  });
`;

    sourceFile.addStatements(setupCode);
  }

  addTestSuite(sourceFile: SourceFile, suiteName: string, testCases: TestCase[], options: GenerationOptions): void {
    sourceFile.addStatements(`
describe('${suiteName} API Tests', function() {`);

    this.addSetup(sourceFile, options);

    // Add test cases
    testCases.forEach(testCase => {
      this.addTestCase(sourceFile, testCase, options);
    });

    sourceFile.addStatements('});');
  }

  addTestCase(sourceFile: SourceFile, testCase: TestCase, options: GenerationOptions): void {
    const testName = this.sanitizeTestName(testCase.name);
    const timeout = testCase.tags.includes('slow') ? 10000 : 5000;
    
    sourceFile.addStatements(`
  it('${testName}', async function() {
    this.timeout(${timeout});
    // ${testCase.description}
${this.generateTestBody(testCase, options)}
  });
`);
  }

  addTeardown(sourceFile: SourceFile, options: GenerationOptions): void {
    // Mocha teardown is handled in setup method
  }

  generateAssertion(assertion: TestAssertion): string {
    const { type, actual, expected, message } = assertion;
    const messageStr = message ? `, '${message}'` : '';

    switch (type) {
      case 'equals':
        return `expect(${actual}).to.equal(${JSON.stringify(expected)}${messageStr});`;
      case 'contains':
        if (Array.isArray(expected)) {
          return `expect(${actual}).to.include.members(${JSON.stringify(expected)}${messageStr});`;
        } else {
          return `expect(${actual}).to.include(${JSON.stringify(expected)}${messageStr});`;
        }
      case 'matches':
        return `expect(${actual}).to.deep.include(${JSON.stringify(expected)}${messageStr});`;
      case 'throws':
        return `expect(() => ${actual}).to.throw(${JSON.stringify(expected)}${messageStr});`;
      case 'status':
        return `expect(${actual}).to.equal(${expected}${messageStr});`;
      case 'type':
        return `expect(${actual}).to.be.a('${expected}'${messageStr});`;
      default:
        return `expect(${actual}).to.exist;`;
    }
  }

  generateApiCall(method: string, path: string, data?: any): string {
    return this.generateApiClientCall(method, path, data);
  }

  generateMockSetup(mockConfig: MockConfiguration): string {
    const { endpoint, method, response, statusCode, delay } = mockConfig;
    
    let mockCode = `
    // Mock setup for ${method.toUpperCase()} ${endpoint}
    const stub = sinon.stub(apiClient, '${method.toLowerCase()}');`;
    
    if (delay) {
      mockCode += `
    stub.callsFake(async () => {
      await new Promise(resolve => setTimeout(resolve, ${delay}));
      return {
        data: ${JSON.stringify(response, null, 8)},
        status: ${statusCode},
        statusText: '${this.getStatusText(statusCode)}',
        headers: {},
        config: {}
      };
    });`;
    } else {
      mockCode += `
    stub.resolves({
      data: ${JSON.stringify(response, null, 8)},
      status: ${statusCode},
      statusText: '${this.getStatusText(statusCode)}',
      headers: {},
      config: {}
    });`;
    }

    return mockCode;
  }

  private generateTestBody(testCase: TestCase, options: GenerationOptions): string {
    const { method, path, requestData, expectedResponse, statusCode } = testCase;
    let body = '';

    // Add request data setup
    if (requestData && Object.keys(requestData).length > 0) {
      body += `    const requestData = ${this.formatRequestData(requestData)};\n\n`;
    }

    // Add mock setup if enabled
    if (options.generateMocks && expectedResponse) {
      body += this.generateMockSetup({
        endpoint: path,
        method,
        response: expectedResponse,
        statusCode
      });
      body += '\n\n';
    }

    // Add API call
    const apiCall = this.generateApiCall(method, path, requestData);
    body += `    const response = await ${apiCall};\n\n`;

    // Add assertions
    body += `    ${this.generateAssertion({ type: 'status', actual: 'response.status', expected: statusCode })}\n`;
    
    if (expectedResponse) {
      body += `    ${this.generateAssertion({ 
        type: 'matches', 
        actual: 'response.data', 
        expected: expectedResponse 
      })}\n`;
    }

    // Add additional assertions based on test case type
    if (testCase.tags.includes('error')) {
      body += `    expect(response.data.error).to.exist;\n`;
    } else {
      body += `    expect(response.data).to.exist;\n`;
    }

    return body;
  }

  private getStatusText(statusCode: number): string {
    const statusMap: { [key: number]: string } = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error'
    };
    return statusMap[statusCode] || 'Unknown';
  }
}