"use strict";
/**
 * Jest Test Template Implementation
 * Week 2 Sprint 1: Jest-specific test generation template
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JestTemplate = void 0;
const base_template_1 = require("./base-template");
class JestTemplate extends base_template_1.BaseTestTemplate {
    constructor() {
        super(...arguments);
        this.framework = 'jest';
        this.fileExtension = '.test.ts';
    }
    addImports(sourceFile, options) {
        // Jest testing framework imports
        sourceFile.addImportDeclaration({
            namedImports: ['describe', 'it', 'expect', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll'],
            moduleSpecifier: '@jest/globals'
        });
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
        // Mock imports if enabled
        if (options.generateMocks) {
            sourceFile.addImportDeclaration({
                namedImports: ['jest'],
                moduleSpecifier: '@jest/globals'
            });
            sourceFile.addImportDeclaration({
                namedImports: ['MockApiClient'],
                moduleSpecifier: '../mocks/api-client.mock'
            });
        }
    }
    addSetup(sourceFile, options) {
        let setupCode = `
  let apiClient: ApiClient;
  
  beforeAll(() => {
    // Global test setup
  });

  beforeEach(() => {
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

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Global test cleanup
  });
`;
        sourceFile.addStatements(setupCode);
    }
    addTestSuite(sourceFile, suiteName, testCases, options) {
        sourceFile.addStatements(`
describe('${suiteName} API Tests', () => {`);
        this.addSetup(sourceFile, options);
        // Add test cases
        testCases.forEach(testCase => {
            this.addTestCase(sourceFile, testCase, options);
        });
        sourceFile.addStatements('});');
    }
    addTestCase(sourceFile, testCase, options) {
        const testName = this.sanitizeTestName(testCase.name);
        const timeout = testCase.tags.includes('slow') ? 10000 : 5000;
        sourceFile.addStatements(`
  it('${testName}', async () => {
    // ${testCase.description}
${this.generateTestBody(testCase, options)}
  }, ${timeout});
`);
    }
    addTeardown(sourceFile, options) {
        // Jest doesn't require explicit teardown in most cases
        // Global teardown is handled in setup
    }
    generateAssertion(assertion) {
        const { type, actual, expected, message } = assertion;
        const messageStr = message ? `, '${message}'` : '';
        switch (type) {
            case 'equals':
                return `expect(${actual}).toBe(${JSON.stringify(expected)}${messageStr});`;
            case 'contains':
                if (Array.isArray(expected)) {
                    return `expect(${actual}).toEqual(expect.arrayContaining(${JSON.stringify(expected)})${messageStr});`;
                }
                else {
                    return `expect(${actual}).toContain(${JSON.stringify(expected)}${messageStr});`;
                }
            case 'matches':
                return `expect(${actual}).toMatchObject(${JSON.stringify(expected)}${messageStr});`;
            case 'throws':
                return `expect(() => ${actual}).toThrow(${JSON.stringify(expected)}${messageStr});`;
            case 'status':
                return `expect(${actual}).toBe(${expected}${messageStr});`;
            case 'type':
                return `expect(typeof ${actual}).toBe('${expected}'${messageStr});`;
            default:
                return `expect(${actual}).toBeDefined();`;
        }
    }
    generateApiCall(method, path, data) {
        return this.generateApiClientCall(method, path, data);
    }
    generateMockSetup(mockConfig) {
        const { endpoint, method, response, statusCode, delay } = mockConfig;
        let mockCode = `
    // Mock setup for ${method.toUpperCase()} ${endpoint}
    jest.spyOn(apiClient, '${method.toLowerCase()}').mockImplementation(async () => {`;
        if (delay) {
            mockCode += `
      await new Promise(resolve => setTimeout(resolve, ${delay}));`;
        }
        mockCode += `
      return {
        data: ${JSON.stringify(response, null, 8)},
        status: ${statusCode},
        statusText: '${this.getStatusText(statusCode)}',
        headers: {},
        config: {}
      };
    });`;
        return mockCode;
    }
    generateTestBody(testCase, options) {
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
            body += `    expect(response.data.error).toBeDefined();\n`;
        }
        else {
            body += `    expect(response.data).toBeDefined();\n`;
        }
        return body;
    }
    getStatusText(statusCode) {
        const statusMap = {
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
exports.JestTemplate = JestTemplate;
//# sourceMappingURL=jest-template.js.map