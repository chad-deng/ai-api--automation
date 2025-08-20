/**
 * Day 1: ts-morph Fundamentals - Hands-on Exercises
 * Training Week 0 - Critical Skills Development
 */

import { Project, ScriptTarget, ModuleKind, SourceFile } from 'ts-morph';

/**
 * Exercise 1: Project Setup and Basic File Creation
 * Learning objective: Initialize ts-morph project and create source files
 */
export class Exercise1_ProjectSetup {
  private project: Project;

  constructor() {
    // Initialize ts-morph project with our standard configuration
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.CommonJS,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        declaration: true
      }
    });
  }

  /**
   * Create a basic test file structure
   */
  createBasicTestFile(): string {
    const sourceFile = this.project.createSourceFile('basic-test.ts', '');
    
    // Add import statements
    sourceFile.addImportDeclaration({
      namedImports: ['describe', 'test', 'expect', 'beforeAll', 'afterAll'],
      moduleSpecifier: '@jest/globals'
    });

    sourceFile.addImportDeclaration({
      namedImports: ['request'],
      moduleSpecifier: 'supertest'
    });

    // Add basic test structure
    sourceFile.addStatements([
      `// Generated API Test File`,
      `// Created with ts-morph AST manipulation`,
      ``,
      `describe('API Tests', () => {`,
      `  test('should be a valid test structure', () => {`,
      `    expect(true).toBe(true);`,
      `  });`,
      `});`
    ]);

    return sourceFile.getFullText();
  }

  /**
   * Validate generated TypeScript compiles correctly
   */
  validateCompilation(): boolean {
    try {
      const diagnostics = this.project.getPreEmitDiagnostics();
      return diagnostics.length === 0;
    } catch (error) {
      console.error('Compilation failed:', error);
      return false;
    }
  }
}

/**
 * Exercise 2: Import Declaration Management
 * Learning objective: Dynamically manage import statements
 */
export class Exercise2_ImportManagement {
  private project: Project;

  constructor() {
    this.project = new Project({ useInMemoryFileSystem: true });
  }

  /**
   * Generate imports based on required dependencies
   */
  generateImports(dependencies: string[]): SourceFile {
    const sourceFile = this.project.createSourceFile('imports-test.ts', '');

    // Define import mappings
    const importMap = {
      jest: {
        namedImports: ['describe', 'test', 'expect', 'beforeAll', 'afterAll'],
        moduleSpecifier: '@jest/globals'
      },
      supertest: {
        defaultImport: 'request',
        moduleSpecifier: 'supertest'
      },
      axios: {
        defaultImport: 'axios',
        moduleSpecifier: 'axios'
      }
    };

    // Add imports based on dependencies
    dependencies.forEach(dep => {
      if (importMap[dep]) {
        sourceFile.addImportDeclaration(importMap[dep]);
      }
    });

    return sourceFile;
  }

  /**
   * Demonstrate advanced import manipulation
   */
  advancedImportExample(): string {
    const sourceFile = this.project.createSourceFile('advanced-imports.ts', '');

    // Add multiple import types
    sourceFile.addImportDeclarations([
      {
        // Named imports
        namedImports: ['OpenAPIV3'],
        moduleSpecifier: 'openapi-types'
      },
      {
        // Default import with alias
        defaultImport: 'express',
        moduleSpecifier: 'express'
      },
      {
        // Namespace import
        namespaceImport: 'fs',
        moduleSpecifier: 'fs/promises'
      },
      {
        // Mixed import
        defaultImport: 'yaml',
        namedImports: ['parseDocument'],
        moduleSpecifier: 'yaml'
      }
    ]);

    return sourceFile.getFullText();
  }
}

/**
 * Exercise 3: Function and Class Generation
 * Learning objective: Create complex TypeScript structures
 */
export class Exercise3_StructureGeneration {
  private project: Project;

  constructor() {
    this.project = new Project({ useInMemoryFileSystem: true });
  }

  /**
   * Generate a test class with methods
   */
  generateTestClass(): string {
    const sourceFile = this.project.createSourceFile('test-class.ts', '');

    // Add class with constructor and methods
    sourceFile.addClass({
      name: 'APITestGenerator',
      constructors: [{
        parameters: [
          { name: 'baseUrl', type: 'string' },
          { name: 'timeout', type: 'number', initializer: '5000' }
        ],
        statements: [
          'this.baseUrl = baseUrl;',
          'this.timeout = timeout;'
        ]
      }],
      properties: [
        { name: 'baseUrl', type: 'string', scope: 'private', isReadonly: true },
        { name: 'timeout', type: 'number', scope: 'private', isReadonly: true }
      ],
      methods: [
        {
          name: 'generateGetTest',
          parameters: [
            { name: 'path', type: 'string' },
            { name: 'expectedStatus', type: 'number', initializer: '200' }
          ],
          returnType: 'string',
          statements: [
            'return `test("GET ${path}", async () => {',
            '  const response = await request(app)',
            '    .get("${path}")',
            '    .expect(${expectedStatus});',
            '});`;'
          ]
        }
      ]
    });

    return sourceFile.getFullText();
  }

  /**
   * Generate async function with complex logic
   */
  generateAsyncFunction(): string {
    const sourceFile = this.project.createSourceFile('async-function.ts', '');

    sourceFile.addFunction({
      name: 'generateAPITests',
      isAsync: true,
      parameters: [
        { name: 'spec', type: 'OpenAPIV3.Document' },
        { name: 'outputDir', type: 'string' }
      ],
      returnType: 'Promise<GenerationResult>',
      statements: [
        '// Initialize generation result',
        'const result: GenerationResult = {',
        '  successful: [],',
        '  failed: [],',
        '  totalTime: 0',
        '};',
        '',
        'const startTime = Date.now();',
        '',
        'try {',
        '  // Process each path in the OpenAPI spec',
        '  for (const [path, pathItem] of Object.entries(spec.paths || {})) {',
        '    try {',
        '      const testFile = await this.generatePathTests(path, pathItem);',
        '      result.successful.push(testFile);',
        '    } catch (error) {',
        '      result.failed.push({',
        '        path,',
        '        error: error.message',
        '      });',
        '    }',
        '  }',
        '} finally {',
        '  result.totalTime = Date.now() - startTime;',
        '}',
        '',
        'return result;'
      ]
    });

    return sourceFile.getFullText();
  }
}

/**
 * Exercise 4: AST Node Manipulation
 * Learning objective: Understand and manipulate AST nodes directly
 */
export class Exercise4_NodeManipulation {
  private project: Project;

  constructor() {
    this.project = new Project({ useInMemoryFileSystem: true });
  }

  /**
   * Demonstrate node traversal and manipulation
   */
  manipulateExistingCode(): string {
    // Start with existing code
    const sourceFile = this.project.createSourceFile('existing-code.ts', `
      function oldFunction() {
        console.log("Old implementation");
      }
      
      const config = {
        timeout: 1000,
        retries: 3
      };
    `);

    // Find and modify function
    const functionDeclaration = sourceFile.getFunction('oldFunction');
    if (functionDeclaration) {
      functionDeclaration.setBodyText(`
        console.log("Updated implementation");
        return "success";
      `);
      functionDeclaration.setReturnType('string');
    }

    // Find and modify object literal
    const variableStatement = sourceFile.getVariableStatement('config');
    if (variableStatement) {
      const configDeclaration = variableStatement.getDeclarations()[0];
      const initializer = configDeclaration.getInitializer();
      if (initializer && initializer.getKind() === 'ObjectLiteralExpression') {
        // Add new property
        initializer.asKindOrThrow('ObjectLiteralExpression').addPropertyAssignment({
          name: 'maxRetries',
          initializer: '5'
        });
      }
    }

    return sourceFile.getFullText();
  }

  /**
   * Generate complex object literals dynamically
   */
  generateComplexObject(properties: Record<string, any>): string {
    const sourceFile = this.project.createSourceFile('complex-object.ts', '');

    // Build object properties dynamically
    const objectProperties = Object.entries(properties).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      } else if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value, null, 2)}`;
      } else {
        return `${key}: ${value}`;
      }
    });

    sourceFile.addVariableStatement({
      declarationKind: 'const',
      declarations: [{
        name: 'generatedConfig',
        initializer: `{\n  ${objectProperties.join(',\n  ')}\n}`
      }]
    });

    return sourceFile.getFullText();
  }
}

/**
 * Training Validation Tests
 * These tests validate that the exercises work correctly
 */
export class TrainingValidation {
  static validateDay1Exercises(): boolean {
    const results = {
      exercise1: false,
      exercise2: false,
      exercise3: false,
      exercise4: false
    };

    try {
      // Test Exercise 1
      const ex1 = new Exercise1_ProjectSetup();
      const basicTest = ex1.createBasicTestFile();
      results.exercise1 = basicTest.includes('describe') && 
                         basicTest.includes('import') && 
                         ex1.validateCompilation();

      // Test Exercise 2
      const ex2 = new Exercise2_ImportManagement();
      const importsFile = ex2.generateImports(['jest', 'supertest']);
      results.exercise2 = importsFile.getImportDeclarations().length > 0;

      // Test Exercise 3
      const ex3 = new Exercise3_StructureGeneration();
      const classCode = ex3.generateTestClass();
      const functionCode = ex3.generateAsyncFunction();
      results.exercise3 = classCode.includes('class APITestGenerator') && 
                         functionCode.includes('async function');

      // Test Exercise 4
      const ex4 = new Exercise4_NodeManipulation();
      const manipulated = ex4.manipulateExistingCode();
      const complexObj = ex4.generateComplexObject({ timeout: 5000, debug: true });
      results.exercise4 = manipulated.includes('Updated implementation') && 
                         complexObj.includes('generatedConfig');

      console.log('Day 1 Training Validation Results:', results);
      return Object.values(results).every(r => r === true);

    } catch (error) {
      console.error('Day 1 validation failed:', error);
      return false;
    }
  }
}

// Export interfaces for type safety
export interface GenerationResult {
  successful: string[];
  failed: Array<{ path: string; error: string }>;
  totalTime: number;
}

export interface TrainingProgress {
  day: number;
  exercisesCompleted: number;
  competencyLevel: 'beginner' | 'intermediate' | 'advanced';
  readyForNextDay: boolean;
}