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
exports.MVPGenerator = void 0;
const Handlebars = __importStar(require("handlebars"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const parser_1 = require("./parser");
const analyzer_1 = require("./analyzer");
const planner_1 = require("./planner");
class MVPGenerator {
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
        console.log('⚡ Generating test files...');
        await this.generateTests(plan, outputDir);
        console.log('📦 Creating package configuration...');
        await this.generatePackageFiles(outputDir, spec.info.title);
    }
    async generateTests(plan, outputDir) {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });
        // Load templates
        const testTemplate = await this.loadTemplate('jest-test.hbs');
        const setupTemplate = await this.loadTemplate('setup.hbs');
        // Generate setup file
        const setupContent = setupTemplate({
            projectName: 'Generated API Tests',
            hasAuth: plan.hasAuth,
            apiKey: true // Simplified for prototype
        });
        await fs.writeFile(path.join(outputDir, 'setup.ts'), setupContent);
        // Generate test files
        for (const testFile of plan.testFiles) {
            const testContent = testTemplate({
                groupName: testFile.filename.replace('.test.ts', ''),
                serverUrl: plan.serverUrl,
                hasAuth: testFile.requiresAuth,
                endpoints: testFile.endpoints.map(ep => ({
                    ...ep,
                    method_lower: ep.method.toLowerCase(),
                    path_processed: ep.path.replace(/{([^}]+)}/g, ':$1'), // Simple param handling
                    expectedStatus: this.getExpectedStatus(ep.method, ep.responses),
                    hasBody: ['POST', 'PUT', 'PATCH'].includes(ep.method),
                    hasSchema: Object.keys(ep.responses).some(status => status.startsWith('2') && ep.responses[status].content),
                    hasErrorCases: true,
                    testData: this.generateTestData(ep)
                }))
            });
            await fs.writeFile(path.join(outputDir, testFile.filename), testContent);
        }
    }
    async loadTemplate(templateName) {
        const templatePath = path.join(__dirname, '..', 'templates', templateName);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        return Handlebars.compile(templateContent);
    }
    getExpectedStatus(method, responses) {
        // Find the first 2xx response
        for (const status of Object.keys(responses)) {
            if (status.startsWith('2')) {
                return parseInt(status);
            }
        }
        // Default expected statuses by method
        switch (method) {
            case 'GET': return 200;
            case 'POST': return 201;
            case 'PUT': return 200;
            case 'DELETE': return 204;
            case 'PATCH': return 200;
            default: return 200;
        }
    }
    generateTestData(endpoint) {
        // Simplified test data generation
        if (!endpoint.requestBody) {
            return 'null';
        }
        // Return a simple test object
        return JSON.stringify({
            id: 1,
            name: 'Test Item',
            email: 'test@example.com',
            status: 'active'
        }, null, 2);
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
                'supertest': '^6.3.3',
                '@types/supertest': '^2.0.12'
            },
            devDependencies: {
                'jest': '^29.6.2',
                '@types/jest': '^29.5.3',
                'typescript': '^5.1.6',
                'ts-jest': '^29.1.1'
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
            ]
        };
        await fs.writeFile(path.join(outputDir, 'jest.config.json'), JSON.stringify(jestConfig, null, 2));
    }
}
exports.MVPGenerator = MVPGenerator;
//# sourceMappingURL=generator.js.map