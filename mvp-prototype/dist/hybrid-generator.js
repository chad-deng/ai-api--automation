"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridGenerator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const parser_1 = require("./parser");
const analyzer_1 = require("./analyzer");
const planner_1 = require("./planner");
const ast_generator_1 = require("./ast-generator");
class HybridGenerator {
    constructor() {
        this.parser = new parser_1.MVPParser();
        this.analyzer = new analyzer_1.SimpleAnalyzer();
        this.planner = new planner_1.SimplePlanner();
    }
    async generate(specPath, outputDir) {
        console.log('📋 Parsing OpenAPI specification...');
        const spec = await this.parser.parse(specPath);
        console.log('🔍 Analyzing API structure...');
        const analysis = this.analyzer.analyze(spec);
        console.log(`   Found ${analysis.endpoints.length} endpoints`);
        console.log('📝 Planning test generation...');
        const plan = this.planner.plan(analysis);
        console.log(`   Will generate ${plan.testFiles.length} test files`);
        // Initialize AST generator with the spec
        this.astGenerator = new ast_generator_1.ASTGenerator(spec);
        console.log('⚡ Generating test files using Hybrid Template+AST approach...');
        await this.generateTests(plan, outputDir, spec);
        console.log('📦 Creating package configuration...');
        await this.generatePackageFiles(outputDir, spec.info.title);
    }
    async generateTests(plan, outputDir, spec) {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });
        if (!this.astGenerator) {
            throw new Error('AST generator not initialized');
        }
        // Generate setup file using AST
        const setupContent = this.astGenerator.generateSetupFile(spec.info.title || 'Generated API Tests', plan.hasAuth, plan.hasAuth ? (spec.components?.securitySchemes || {}) : {});
        await fs.writeFile(path.join(outputDir, 'setup.ts'), setupContent);
        // Generate test files using AST
        for (const testFile of plan.testFiles) {
            console.log(`   📄 Generating ${testFile.filename}...`);
            const testContent = this.astGenerator.generateTestFile(testFile.filename.replace('.test.ts', ''), testFile.endpoints, plan.serverUrl, testFile.requiresAuth);
            await fs.writeFile(path.join(outputDir, testFile.filename), testContent);
        }
    }
    async generatePackageFiles(outputDir, projectName) {
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
        await fs.writeFile(path.join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2));
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
        await fs.writeFile(path.join(outputDir, 'jest.config.json'), JSON.stringify(jestConfig, null, 2));
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
        await fs.writeFile(path.join(outputDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
    }
}
exports.HybridGenerator = HybridGenerator;
//# sourceMappingURL=hybrid-generator.js.map