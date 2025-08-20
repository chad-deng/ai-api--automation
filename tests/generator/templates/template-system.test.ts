/**
 * Template System Tests
 * Week 2 Sprint 1: Comprehensive testing for test generation templates
 */

import { TemplateRegistry, BaseTestTemplate, TestAssertion, MockConfiguration } from '../../../src/generator/templates/base-template';
import { JestTemplate } from '../../../src/generator/templates/jest-template';
import { MochaTemplate } from '../../../src/generator/templates/mocha-template';
import { getTemplate, getSupportedFrameworks, templateRegistry } from '../../../src/generator/templates';
import { TestCase, GenerationOptions } from '../../../src/generator/test-generator';
import { Project } from 'ts-morph';

describe('Template System', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 95, // ES2020
        strict: true
      }
    });
  });

  describe('Template Registry', () => {
    test('should register and retrieve templates', () => {
      const registry = new TemplateRegistry();
      const testTemplate = new JestTemplate();
      
      registry.register(testTemplate);
      
      const retrieved = registry.get('jest');
      expect(retrieved).toBe(testTemplate);
    });

    test('should list supported frameworks', () => {
      const registry = new TemplateRegistry();
      registry.register(new JestTemplate());
      registry.register(new MochaTemplate());
      
      const frameworks = registry.getSupportedFrameworks();
      expect(frameworks).toContain('jest');
      expect(frameworks).toContain('mocha');
    });

    test('should check framework support', () => {
      const registry = new TemplateRegistry();
      registry.register(new JestTemplate());
      
      expect(registry.isSupported('jest')).toBe(true);
      expect(registry.isSupported('unsupported')).toBe(false);
    });
  });

  describe('Global Template Access', () => {
    test('should provide global template access', () => {
      const jestTemplate = getTemplate('jest');
      expect(jestTemplate).toBeDefined();
      expect(jestTemplate?.framework).toBe('jest');
      
      const mochaTemplate = getTemplate('mocha');
      expect(mochaTemplate).toBeDefined();
      expect(mochaTemplate?.framework).toBe('mocha');
    });

    test('should list globally supported frameworks', () => {
      const frameworks = getSupportedFrameworks();
      expect(frameworks).toContain('jest');
      expect(frameworks).toContain('mocha');
    });

    test('should return undefined for unsupported frameworks', () => {
      const unsupported = getTemplate('unsupported');
      expect(unsupported).toBeUndefined();
    });
  });

  describe('Jest Template', () => {
    let template: JestTemplate;
    let sourceFile: any;

    beforeEach(() => {
      template = new JestTemplate();
      sourceFile = project.createSourceFile('test.ts', '');
    });

    test('should have correct framework and extension', () => {
      expect(template.framework).toBe('jest');
      expect(template.fileExtension).toBe('.test.ts');
    });

    test('should add Jest imports', () => {
      const options: GenerationOptions = { framework: 'jest', outputDir: './test' };
      
      template.addImports(sourceFile, options);
      
      const imports = sourceFile.getImportDeclarations();
      expect(imports.length).toBeGreaterThan(0);
      
      const jestImport = imports.find((imp: any) => 
        imp.getModuleSpecifierValue() === '@jest/globals'
      );
      expect(jestImport).toBeDefined();
    });

    test('should add type imports when enabled', () => {
      const options: GenerationOptions = { 
        framework: 'jest', 
        outputDir: './test',
        includeTypes: true 
      };
      
      template.addImports(sourceFile, options);
      
      const imports = sourceFile.getImportDeclarations();
      const typeImport = imports.find((imp: any) => 
        imp.getModuleSpecifierValue() === '../types/api-types'
      );
      expect(typeImport).toBeDefined();
    });

    test('should add mock imports when enabled', () => {
      const options: GenerationOptions = { 
        framework: 'jest', 
        outputDir: './test',
        generateMocks: true 
      };
      
      template.addImports(sourceFile, options);
      
      const imports = sourceFile.getImportDeclarations();
      const mockImport = imports.find((imp: any) => 
        imp.getModuleSpecifierValue() === '../mocks/api-client.mock'
      );
      expect(mockImport).toBeDefined();
    });

    test('should generate proper assertions', () => {
      const assertions: TestAssertion[] = [
        { type: 'equals', actual: 'response.status', expected: 200 },
        { type: 'contains', actual: 'response.data', expected: ['item1', 'item2'] },
        { type: 'matches', actual: 'response.data', expected: { id: 1 } },
        { type: 'throws', actual: 'invalidFunction()', expected: 'Error' },
        { type: 'type', actual: 'response.data', expected: 'object' }
      ];

      assertions.forEach(assertion => {
        const result = template.generateAssertion(assertion);
        
        expect(result).toContain('expect(');
        expect(result).toContain(assertion.actual);
        
        switch (assertion.type) {
          case 'equals':
            expect(result).toContain('.toBe(');
            break;
          case 'contains':
            expect(result).toContain('.toEqual(expect.arrayContaining(');
            break;
          case 'matches':
            expect(result).toContain('.toMatchObject(');
            break;
          case 'throws':
            expect(result).toContain('.toThrow(');
            break;
          case 'type':
            expect(result).toContain('.toBe(');
            break;
        }
      });
    });

    test('should generate API calls', () => {
      const getCall = template.generateApiCall('GET', '/users');
      expect(getCall).toContain('apiClient.get');
      
      const postCall = template.generateApiCall('POST', '/users', { name: 'test' });
      expect(postCall).toContain('apiClient.post');
      expect(postCall).toContain('requestData');
    });

    test('should generate mock setup', () => {
      const mockConfig: MockConfiguration = {
        endpoint: '/users',
        method: 'GET',
        response: { users: [] },
        statusCode: 200,
        delay: 100
      };
      
      const mockCode = template.generateMockSetup(mockConfig);
      
      expect(mockCode).toContain('jest.spyOn');
      expect(mockCode).toContain('mockImplementation');
      expect(mockCode).toContain('setTimeout');
      expect(mockCode).toContain(mockConfig.statusCode.toString());
    });

    test('should add test suite structure', () => {
      const testCases: TestCase[] = [{
        name: 'should get users',
        operation: {} as any,
        method: 'GET',
        path: '/users',
        description: 'Test getting users',
        statusCode: 200,
        tags: ['users']
      }];
      
      const options: GenerationOptions = { framework: 'jest', outputDir: './test' };
      
      template.addTestSuite(sourceFile, 'Users', testCases, options);
      
      const content = sourceFile.getFullText();
      expect(content).toContain('describe(\'Users API Tests\'');
      expect(content).toContain('beforeEach');
      expect(content).toContain('afterEach');
    });
  });

  describe('Mocha Template', () => {
    let template: MochaTemplate;
    let sourceFile: any;

    beforeEach(() => {
      template = new MochaTemplate();
      sourceFile = project.createSourceFile('test.ts', '');
    });

    test('should have correct framework and extension', () => {
      expect(template.framework).toBe('mocha');
      expect(template.fileExtension).toBe('.test.ts');
    });

    test('should add Mocha imports', () => {
      const options: GenerationOptions = { framework: 'mocha', outputDir: './test' };
      
      template.addImports(sourceFile, options);
      
      const imports = sourceFile.getImportDeclarations();
      
      const mochaImport = imports.find((imp: any) => 
        imp.getModuleSpecifierValue() === 'mocha'
      );
      expect(mochaImport).toBeDefined();
      
      const chaiImport = imports.find((imp: any) => 
        imp.getModuleSpecifierValue() === 'chai'
      );
      expect(chaiImport).toBeDefined();
    });

    test('should add Sinon imports when mocks enabled', () => {
      const options: GenerationOptions = { 
        framework: 'mocha', 
        outputDir: './test',
        generateMocks: true 
      };
      
      template.addImports(sourceFile, options);
      
      const imports = sourceFile.getImportDeclarations();
      const sinonImport = imports.find((imp: any) => 
        imp.getModuleSpecifierValue() === 'sinon'
      );
      expect(sinonImport).toBeDefined();
    });

    test('should generate Chai-style assertions', () => {
      const assertions: TestAssertion[] = [
        { type: 'equals', actual: 'response.status', expected: 200 },
        { type: 'contains', actual: 'response.data', expected: 'test' },
        { type: 'type', actual: 'response.data', expected: 'object' }
      ];

      assertions.forEach(assertion => {
        const result = template.generateAssertion(assertion);
        
        expect(result).toContain('expect(');
        expect(result).toContain(assertion.actual);
        
        switch (assertion.type) {
          case 'equals':
            expect(result).toContain('.to.equal(');
            break;
          case 'contains':
            expect(result).toContain('.to.include(');
            break;
          case 'type':
            expect(result).toContain('.to.be.a(');
            break;
        }
      });
    });

    test('should generate Sinon mock setup', () => {
      const mockConfig: MockConfiguration = {
        endpoint: '/users',
        method: 'GET',
        response: { users: [] },
        statusCode: 200
      };
      
      const mockCode = template.generateMockSetup(mockConfig);
      
      expect(mockCode).toContain('sinon.stub');
      expect(mockCode).toContain('resolves');
      expect(mockCode).toContain(mockConfig.statusCode.toString());
    });

    test('should add test suite with Mocha hooks', () => {
      const testCases: TestCase[] = [{
        name: 'should get users',
        operation: {} as any,
        method: 'GET',
        path: '/users',
        description: 'Test getting users',
        statusCode: 200,
        tags: ['users']
      }];
      
      const options: GenerationOptions = { framework: 'mocha', outputDir: './test' };
      
      template.addTestSuite(sourceFile, 'Users', testCases, options);
      
      const content = sourceFile.getFullText();
      expect(content).toContain('describe(\'Users API Tests\'');
      expect(content).toContain('before(');
      expect(content).toContain('beforeEach(');
      expect(content).toContain('afterEach(');
      expect(content).toContain('after(');
    });
  });

  describe('Base Template Utilities', () => {
    let template: JestTemplate;

    beforeEach(() => {
      template = new JestTemplate();
    });

    test('should sanitize test names', () => {
      const sanitized = (template as any).sanitizeTestName('should test @#$% API endpoint!');
      expect(sanitized).toBe('should test  API endpoint');
      expect(sanitized).not.toContain('@');
      expect(sanitized).not.toContain('#');
      expect(sanitized).not.toContain('$');
      expect(sanitized).not.toContain('%');
      expect(sanitized).not.toContain('!');
    });

    test('should format request data', () => {
      const data = { name: 'test', age: 30 };
      const formatted = (template as any).formatRequestData(data);
      
      expect(formatted).toContain('{\n');
      expect(formatted).toContain('"name": "test"');
      expect(formatted).toContain('"age": 30');
    });

    test('should extract path parameters', () => {
      const path = '/users/{userId}/posts/{postId}';
      const params = (template as any).extractPathParams(path);
      
      expect(params).toEqual(['userId', 'postId']);
    });

    test('should generate API client calls with path params', () => {
      const call = (template as any).generateApiClientCall('GET', '/users/{userId}', { userId: 123 });
      expect(call).toContain('${userId}');
    });
  });

  describe('Template Integration', () => {
    test('should work with real test case data', () => {
      const template = new JestTemplate();
      const sourceFile = project.createSourceFile('integration-test.ts', '');
      
      const testCase: TestCase = {
        name: 'should create new user',
        operation: {
          operationId: 'createUser',
          summary: 'Create a new user',
          method: 'POST',
          path: '/users'
        } as any,
        method: 'POST',
        path: '/users',
        description: 'Create a new user account',
        requestData: { pathParams: {}, queryParams: {}, headers: {}, body: { name: 'John', email: 'john@example.com' } },
        expectedResponse: { statusCode: 201, headers: {}, body: { id: 1, name: 'John', email: 'john@example.com' } },
        statusCode: 201,
        tags: ['users', 'creation']
      };
      
      const options: GenerationOptions = { framework: 'jest', outputDir: './test' };
      
      template.addImports(sourceFile, options);
      template.addTestSuite(sourceFile, 'Users', [testCase], options);
      
      const content = sourceFile.getFullText();
      
      expect(content).toContain('import');
      expect(content).toContain('describe');
      expect(content).toContain('it(');
      expect(content).toContain('should create new user');
      expect(content).toContain('expect(');
    });

    test('should handle authentication configuration', () => {
      const template = new JestTemplate();
      const sourceFile = project.createSourceFile('auth-test.ts', '');
      
      const options: GenerationOptions = { 
        framework: 'jest', 
        outputDir: './test',
        authConfig: {
          type: 'bearer'
        }
      };
      
      template.addImports(sourceFile, options);
      template.addSetup(sourceFile, options);
      
      const content = sourceFile.getFullText();
      expect(content).toContain('Authorization');
      expect(content).toContain('Bearer');
    });

    test('should handle different status codes', () => {
      const template = new JestTemplate();
      
      const statusCodes = [200, 201, 400, 401, 404, 500];
      
      statusCodes.forEach(code => {
        const assertion = template.generateAssertion({
          type: 'status',
          actual: 'response.status',
          expected: code
        });
        
        expect(assertion).toContain(`toBe(${code})`);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing template gracefully', () => {
      const template = getTemplate('nonexistent');
      expect(template).toBeUndefined();
    });

    test('should handle empty test cases', () => {
      const template = new JestTemplate();
      const sourceFile = project.createSourceFile('empty-test.ts', '');
      const options: GenerationOptions = { framework: 'jest', outputDir: './test' };
      
      template.addTestSuite(sourceFile, 'Empty', [], options);
      
      const content = sourceFile.getFullText();
      expect(content).toContain('describe');
      // Should not break with empty test cases
    });

    test('should handle malformed assertion data', () => {
      const template = new JestTemplate();
      
      const assertion: TestAssertion = {
        type: 'equals',
        actual: '',
        expected: undefined
      };
      
      const result = template.generateAssertion(assertion);
      expect(result).toContain('expect(');
      // Should not throw
    });
  });
});