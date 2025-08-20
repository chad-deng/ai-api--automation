import * as fs from 'fs/promises';
import * as path from 'path';
import { MVPParser } from './parser';
import { SimpleAnalyzer } from './analyzer';
import { SimplePlanner, TestPlan } from './planner';
import { ASTGenerator } from './ast-generator';

export class HybridGenerator {
  private parser = new MVPParser();
  private analyzer = new SimpleAnalyzer();
  private planner = new SimplePlanner();
  private astGenerator?: ASTGenerator;
  
  async generate(specPath: string, outputDir: string): Promise<void> {
    console.log('📋 Parsing OpenAPI specification...');
    const spec = await this.parser.parse(specPath);
    
    console.log('🔍 Analyzing API structure...');
    const analysis = this.analyzer.analyze(spec);
    console.log(`   Found ${analysis.endpoints.length} endpoints`);
    
    console.log('📝 Planning test generation...');
    const plan = this.planner.plan(analysis);
    console.log(`   Will generate ${plan.testFiles.length} test files`);
    
    // Initialize AST generator with the spec
    this.astGenerator = new ASTGenerator(spec);
    
    console.log('⚡ Generating test files using Hybrid Template+AST approach...');
    await this.generateTests(plan, outputDir, spec);
    
    console.log('📦 Creating package configuration...');
    await this.generatePackageFiles(outputDir, spec.info.title);
  }
  
  private async generateTests(plan: TestPlan, outputDir: string, spec: any): Promise<void> {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    if (!this.astGenerator) {
      throw new Error('AST generator not initialized');
    }
    
    // Generate setup file using AST
    const setupContent = this.astGenerator.generateSetupFile(
      spec.info.title || 'Generated API Tests',
      plan.hasAuth,
      plan.hasAuth ? (spec.components?.securitySchemes || {}) : {}
    );
    
    await fs.writeFile(path.join(outputDir, 'setup.ts'), setupContent);
    
    // Generate test files using AST
    for (const testFile of plan.testFiles) {
      console.log(`   📄 Generating ${testFile.filename}...`);
      
      const testContent = this.astGenerator.generateTestFile(
        testFile.filename.replace('.test.ts', ''),
        testFile.endpoints,
        plan.serverUrl,
        testFile.requiresAuth
      );
      
      await fs.writeFile(path.join(outputDir, testFile.filename), testContent);
    }
  }
  
  private async generatePackageFiles(outputDir: string, projectName: string): Promise<void> {
    const packageJson = {
      name: `${projectName.toLowerCase().replace(/\s+/g, '-')}-tests`,
      version: '1.0.0',
      description: `Generated API tests for ${projectName}`,
      scripts: {
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage'
      },
      dependencies: {
        'supertest': '^6.3.3'
      },
      devDependencies: {
        '@types/supertest': '^2.0.12',
        '@types/jest': '^29.5.3',
        'jest': '^29.6.2',
        'typescript': '^5.1.6',
        'ts-jest': '^29.1.1',
        '@types/node': '^20.5.0'
      }
    };
    
    await fs.writeFile(
      path.join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    const jestConfig = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>'],
      testMatch: ['**/*.test.ts'],
      collectCoverageFrom: [
        '**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**'
      ],
      setupFilesAfterEnv: ['<rootDir>/setup.ts']
    };
    
    await fs.writeFile(
      path.join(outputDir, 'jest.config.json'),
      JSON.stringify(jestConfig, null, 2)
    );
    
    // Add TypeScript config for the generated tests
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        types: ['jest', 'node', 'supertest']
      },
      include: ['**/*.ts'],
      exclude: ['node_modules', 'dist']
    };
    
    await fs.writeFile(
      path.join(outputDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }
}