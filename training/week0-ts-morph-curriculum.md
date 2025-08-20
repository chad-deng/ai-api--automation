# Week 0: ts-morph & Advanced TDD Training Curriculum

## Training Overview
**Duration**: 5 days intensive training  
**Objective**: Develop team competency in TypeScript AST manipulation using ts-morph library  
**Target**: Close identified capability gap for Hybrid Template+AST approach  

---

## Day 1-2: ts-morph Fundamentals

### Day 1: TypeScript AST Concepts
**Morning (9:00-12:00): AST Theory & Concepts**
```typescript
// Understanding TypeScript Abstract Syntax Trees
interface ASTNode {
  kind: SyntaxKind;
  pos: number;
  end: number;
  flags: NodeFlags;
  parent?: Node;
  getChildren(): Node[];
  getText(): string;
}

// Key AST Node Types for Our Generator
enum CriticalNodeTypes {
  SourceFile = 'SourceFile',
  ImportDeclaration = 'ImportDeclaration', 
  FunctionDeclaration = 'FunctionDeclaration',
  VariableStatement = 'VariableStatement',
  CallExpression = 'CallExpression',
  ObjectLiteralExpression = 'ObjectLiteralExpression'
}
```

**Afternoon (13:00-17:00): ts-morph Basics**
```typescript
// Hands-on Exercise 1: Project Setup
import { Project, ScriptTarget, ModuleKind } from 'ts-morph';

const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    target: ScriptTarget.ES2020,
    module: ModuleKind.CommonJS,
    esModuleInterop: true,
    strict: true
  }
});

// Exercise: Create a simple TypeScript file
const sourceFile = project.createSourceFile('test.ts', '');
sourceFile.addImportDeclaration({
  namedImports: ['describe', 'test', 'expect'],
  moduleSpecifier: '@jest/globals'
});
```

### Day 2: Code Generation Patterns
**Morning (9:00-12:00): Node Creation & Manipulation**
```typescript
// Hands-on Exercise 2: Generate Test Structure
class TestGenerator {
  generateDescribeBlock(apiName: string, tests: TestCase[]) {
    const sourceFile = this.project.createSourceFile(`${apiName}.test.ts`, '');
    
    // Add imports
    sourceFile.addImportDeclarations([
      {
        namedImports: ['describe', 'test', 'expect', 'beforeAll', 'afterAll'],
        moduleSpecifier: '@jest/globals'
      },
      {
        namedImports: ['request'],
        moduleSpecifier: 'supertest'
      }
    ]);

    // Add describe block
    sourceFile.addFunction({
      name: undefined, // Anonymous function
      statements: [
        `describe('${apiName} API Tests', () => {`,
        ...this.generateTestCases(tests),
        '});'
      ]
    });

    return sourceFile.getFullText();
  }
}
```

**Afternoon (13:00-17:00): Advanced Node Operations**
```typescript
// Exercise 3: Complex AST Manipulation
class AdvancedGenerator {
  generateTestCase(endpoint: EndpointInfo): string {
    const testFunction = this.sourceFile.addFunction({
      name: undefined,
      isAsync: true,
      statements: []
    });

    // Add test method call
    testFunction.addStatements([
      `test('${endpoint.operationId} - ${endpoint.method} ${endpoint.path}', async () => {`,
      this.generateTestBody(endpoint),
      '});'
    ]);

    return testFunction.getText();
  }

  private generateTestBody(endpoint: EndpointInfo): string {
    const statements = [];
    
    // Generate request
    statements.push(`const response = await request(app)`);
    statements.push(`.${endpoint.method.toLowerCase()}('${endpoint.path}')`);
    
    // Add authentication if needed
    if (endpoint.requiresAuth) {
      statements.push(`.set('Authorization', \`Bearer \${process.env.API_TOKEN}\`)`);
    }
    
    // Add request body if POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      statements.push(`.send(${this.generateTestData(endpoint.requestSchema)})`);
    }
    
    // Add assertions
    statements.push(`.expect(${endpoint.expectedStatus})`);
    
    return statements.join('\n    ');
  }
}
```

---

## Day 3: Advanced TDD for AST Development

### Morning (9:00-12:00): Testing AST Generation
```typescript
// TDD Approach for AST Generator Testing
describe('AST Generator TDD', () => {
  let generator: ASTGenerator;
  let mockProject: Project;

  beforeEach(() => {
    mockProject = new Project({ useInMemoryFileSystem: true });
    generator = new ASTGenerator(mockProject);
  });

  describe('Import Generation', () => {
    test('should generate correct Jest imports', () => {
      const imports = generator.generateImports(['@jest/globals', 'supertest']);
      const code = imports.map(imp => imp.getText()).join('\n');
      
      expect(code).toContain("import { describe, test, expect } from '@jest/globals'");
      expect(code).toContain("import request from 'supertest'");
    });

    test('should handle duplicate imports gracefully', () => {
      const imports = generator.generateImports(['@jest/globals', '@jest/globals']);
      expect(imports).toHaveLength(1);
    });
  });

  describe('Test Structure Generation', () => {
    test('should create valid describe blocks', () => {
      const describeNode = generator.createDescribeBlock('Users API', []);
      const code = describeNode.getText();
      
      expect(code).toMatch(/describe\s*\(\s*['"]Users API['"]\s*,\s*\(\s*\)\s*=>\s*\{/);
    });

    test('should generate async test functions', () => {
      const testCase = {
        name: 'should get all users',
        method: 'GET',
        path: '/users',
        expectedStatus: 200
      };
      
      const testNode = generator.createTestCase(testCase);
      const code = testNode.getText();
      
      expect(code).toContain('test(');
      expect(code).toContain('async () => {');
      expect(code).toContain('.get(\'/users\')');
      expect(code).toContain('.expect(200)');
    });
  });
});
```

### Afternoon (13:00-17:00): Error Handling & Edge Cases
```typescript
// Exercise 4: Robust AST Generation with Error Handling
class RobustASTGenerator {
  generateWithErrorHandling(spec: OpenAPISpec): GenerationResult {
    const results: GenerationResult = {
      successful: [],
      failed: [],
      warnings: []
    };

    try {
      // Validate input
      this.validateSpecification(spec);
      
      // Generate with error recovery
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        try {
          const testFile = this.generateEndpointTests(path, pathItem);
          results.successful.push(testFile);
        } catch (error) {
          results.failed.push({
            path,
            error: error.message,
            suggestion: this.generateSuggestion(error)
          });
          
          // Continue with next endpoint
          continue;
        }
      }
      
    } catch (criticalError) {
      results.failed.push({
        path: 'global',
        error: criticalError.message,
        suggestion: 'Check OpenAPI specification validity'
      });
    }

    return results;
  }

  private validateSpecification(spec: OpenAPISpec): void {
    if (!spec.openapi) throw new Error('Missing OpenAPI version');
    if (!spec.info) throw new Error('Missing API info section');
    if (!spec.paths) throw new Error('Missing paths section');
  }
}
```

---

## Day 4: Hybrid Architecture Deep Dive

### Morning (9:00-12:00): Template+AST Integration
```typescript
// Exercise 5: Hybrid Template+AST Pattern
class HybridGenerator {
  constructor(private project: Project, private spec: OpenAPISpec) {}

  async generate(outputDir: string): Promise<void> {
    // Step 1: Template-based structure generation
    const templateStructure = this.generateTemplateStructure();
    
    // Step 2: AST enhancement and validation
    const enhancedCode = await this.enhanceWithAST(templateStructure);
    
    // Step 3: Performance validation
    const validatedCode = this.validatePerformance(enhancedCode);
    
    // Step 4: Write files
    await this.writeFiles(outputDir, validatedCode);
  }

  private generateTemplateStructure(): TemplateStructure {
    // Use templates for boilerplate code
    return {
      imports: this.generateImportTemplate(),
      setup: this.generateSetupTemplate(),
      teardown: this.generateTeardownTemplate(),
      testPlaceholders: this.generateTestPlaceholders()
    };
  }

  private async enhanceWithAST(template: TemplateStructure): Promise<string> {
    // Create source file from template
    const sourceFile = this.project.createSourceFile('temp.ts', template.base);
    
    // Use AST for complex logic injection
    const testCases = this.spec.paths;
    for (const [path, pathItem] of Object.entries(testCases)) {
      const testFunction = this.generateTestFunction(path, pathItem);
      sourceFile.addFunction(testFunction);
    }
    
    // Format and return
    return sourceFile.getFullText();
  }
}
```

### Afternoon (13:00-17:00): Performance Optimization & Memory Management
```typescript
// Exercise 6: Performance-Optimized Generation
class PerformanceOptimizedGenerator {
  private memoryUsage = new MemoryMonitor();
  
  async generateLargeAPI(spec: OpenAPISpec): Promise<GenerationResult> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      // Memory-efficient processing
      const results = await this.processInChunks(spec, 50); // 50 endpoints per chunk
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      return {
        ...results,
        performance: {
          duration: endTime - startTime,
          memoryUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
          endpointsPerSecond: Object.keys(spec.paths).length / ((endTime - startTime) / 1000)
        }
      };
      
    } catch (error) {
      this.handlePerformanceError(error);
      throw error;
    }
  }

  private async processInChunks(spec: OpenAPISpec, chunkSize: number): Promise<any> {
    const pathEntries = Object.entries(spec.paths);
    const chunks = this.chunkArray(pathEntries, chunkSize);
    const results = [];

    for (const chunk of chunks) {
      // Process chunk
      const chunkResults = await this.processChunk(chunk);
      results.push(...chunkResults);
      
      // Force garbage collection between chunks if needed
      if (global.gc && results.length % 200 === 0) {
        global.gc();
      }
    }

    return results;
  }
}
```

---

## Day 5: Team Integration and Practice

### Morning (9:00-12:00): Pair Programming Exercises
```typescript
// Exercise 7: Pair Programming - Real API Generation
// Pair 1: Senior + Junior - Generate JSONPlaceholder tests
// Pair 2: Mid + Junior - Generate Stripe API tests
// Pair 3: Senior + Mid - Generate complex nested schema tests

class PairProgrammingExercise {
  // Driver: Write failing test
  // Navigator: Guide implementation strategy
  
  async generateRealWorldAPI(apiName: string): Promise<void> {
    // Test-first approach
    const tests = await this.writeTestsFirst(apiName);
    
    // Implement to pass tests
    const implementation = await this.implementToPassTests(tests);
    
    // Refactor and optimize
    const optimized = await this.refactorAndOptimize(implementation);
    
    // Validate against real API
    const validated = await this.validateAgainstRealAPI(optimized, apiName);
    
    console.log(`✅ ${apiName} generation complete: ${validated.successRate}% tests passing`);
  }
}
```

### Afternoon (13:00-17:00): Integration & Competency Validation
```typescript
// Final Exercise: Complete API Generator Implementation
class CompetencyValidation {
  async validateTeamReadiness(): Promise<CompetencyReport> {
    const challenges = [
      'Generate tests for circular reference API',
      'Handle 10-level deep nested schemas',
      'Process 100-endpoint API under 5 seconds',
      'Maintain 95% TypeScript compilation success',
      'Generate working tests with 60%+ pass rate'
    ];

    const results = await Promise.all(
      challenges.map(challenge => this.executeChallenge(challenge))
    );

    return {
      overallScore: this.calculateScore(results),
      individualResults: results,
      readyForProduction: results.every(r => r.passed),
      recommendations: this.generateRecommendations(results)
    };
  }

  private async executeChallenge(challenge: string): Promise<ChallengeResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.runChallenge(challenge);
      return {
        challenge,
        passed: true,
        duration: Date.now() - startTime,
        score: this.scoreResult(result),
        notes: `Successfully completed: ${result.summary}`
      };
    } catch (error) {
      return {
        challenge,
        passed: false,
        duration: Date.now() - startTime,
        score: 0,
        notes: `Failed: ${error.message}`,
        recommendation: this.getFailureRecommendation(challenge, error)
      };
    }
  }
}
```

---

## Training Deliverables

### Day 1-2 Outputs
- [ ] Basic AST manipulation competency
- [ ] Simple code generation examples  
- [ ] ts-morph library familiarity

### Day 3 Outputs
- [ ] TDD approach for AST development
- [ ] Error handling strategies
- [ ] Testing complex generated code

### Day 4 Outputs
- [ ] Hybrid Template+AST integration
- [ ] Performance optimization techniques
- [ ] Memory management strategies

### Day 5 Outputs
- [ ] Team competency validation results
- [ ] Real-world API generation examples
- [ ] Production readiness assessment

## Success Criteria

### Individual Competency (Each Team Member)
- [ ] Can generate basic TypeScript AST nodes
- [ ] Can create test file structure using ts-morph
- [ ] Can handle errors in AST generation gracefully
- [ ] Can optimize for performance and memory usage
- [ ] Can integrate template and AST approaches

### Team Competency (Collective)
- [ ] Can pair program effectively on AST tasks
- [ ] Can review AST-generated code for quality
- [ ] Can debug ts-morph compilation issues
- [ ] Can maintain hybrid architecture performance
- [ ] Ready to begin Week 1 implementation

## Training Resources

### Documentation
- ts-morph official documentation
- TypeScript AST explorer tools
- Jest testing framework guide
- Performance monitoring tools

### Practice APIs
- JSONPlaceholder (simple)
- Petstore (medium complexity)
- Stripe subset (complex)
- Custom edge case APIs

### Validation Tools
- TypeScript compiler
- ESLint configuration
- Performance benchmarking scripts
- Memory profiling utilities

---

**Training Completion**: Ready to begin Week 1 of Sprint 1 with validated team competency in ts-morph/AST manipulation for Hybrid Template+AST code generation.