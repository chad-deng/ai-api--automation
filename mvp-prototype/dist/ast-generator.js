"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTGenerator = void 0;
const ts_morph_1 = require("ts-morph");
const data_generator_1 = require("./data-generator");
class ASTGenerator {
    constructor(spec) {
        this.project = new ts_morph_1.Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                target: ts_morph_1.ScriptTarget.ES2020,
                module: ts_morph_1.ModuleKind.CommonJS,
                esModuleInterop: true,
                strict: true,
                skipLibCheck: true
            }
        });
        this.dataGenerator = new data_generator_1.SchemaAwareDataGenerator(spec);
    }
    generateTestFile(filename, endpoints, serverUrl, hasAuth) {
        const sourceFile = this.project.createSourceFile(`${filename}.ts`, '', { overwrite: true });
        // Add imports
        this.addImports(sourceFile, hasAuth);
        // Add constants
        sourceFile.addVariableStatement({
            declarationKind: ts_morph_1.VariableDeclarationKind.Const,
            declarations: [{
                    name: 'baseURL',
                    initializer: `'${serverUrl}'`
                }]
        });
        // Add main describe block
        sourceFile.addStatements(writer => {
            writer.writeLine(`describe('${filename.replace('.test', '')} API Tests', () => {`);
            if (hasAuth) {
                writer.indent(() => {
                    writer.writeLine('let authHeaders: Record<string, string>;');
                    writer.blankLine();
                    writer.writeLine('beforeAll(async () => {');
                    writer.indent(() => {
                        writer.writeLine('authHeaders = await setupAuth();');
                    });
                    writer.writeLine('});');
                    writer.blankLine();
                });
            }
            // Generate endpoint tests
            endpoints.forEach(endpoint => {
                this.generateEndpointTest(writer, endpoint, hasAuth);
            });
            writer.writeLine('});');
        });
        return sourceFile.getFullText();
    }
    addImports(sourceFile, hasAuth) {
        sourceFile.addImportDeclaration({
            moduleSpecifier: 'supertest',
            defaultImport: 'request'
        });
        if (hasAuth) {
            sourceFile.addImportDeclaration({
                moduleSpecifier: './setup',
                namedImports: ['setupAuth']
            });
        }
    }
    generateEndpointTest(writer, endpoint, hasAuth) {
        const method = endpoint.method.toLowerCase();
        const path = endpoint.path;
        const displayPath = path.replace(/{([^}]+)}/g, '{$1}'); // Keep readable format
        const testPath = this.processPathForTesting(path, endpoint.parameters);
        writer.indent(() => {
            writer.writeLine(`describe('${endpoint.method} ${displayPath}', () => {`);
            writer.indent(() => {
                // Generate positive test case
                this.generatePositiveTest(writer, endpoint, method, testPath, hasAuth);
                writer.blankLine();
                // Generate negative test cases
                this.generateNegativeTests(writer, endpoint, method, testPath, hasAuth);
            });
            writer.writeLine('});');
        });
    }
    generatePositiveTest(writer, endpoint, method, testPath, hasAuth) {
        const expectedStatus = this.getExpectedStatus(endpoint.method, endpoint.responses);
        const hasBody = ['post', 'put', 'patch'].includes(method);
        const testData = hasBody ? this.generateTestDataForEndpoint(endpoint) : null;
        writer.writeLine(`it('should return ${expectedStatus} for valid request', async () => {`);
        writer.indent(() => {
            writer.write('const response = await request(baseURL)');
            writer.writeLine(`.${method}('${testPath}')`);
            // Add auth headers if needed
            if (hasAuth) {
                writer.writeLine('.set(authHeaders)');
            }
            // Add request body if needed
            if (testData) {
                writer.writeLine(`.send(${JSON.stringify(testData, null, 2)})`);
            }
            writer.writeLine(';');
            writer.blankLine();
            // Add assertions
            writer.writeLine(`expect(response.status).toBe(${expectedStatus});`);
            // Add response validation if 2xx response has content
            const successResponse = Object.keys(endpoint.responses).find(status => status.startsWith('2'));
            if (successResponse && endpoint.responses[successResponse]?.content) {
                writer.writeLine('expect(response.body).toBeDefined();');
                writer.writeLine('// TODO: Add detailed response schema validation');
            }
        });
        writer.writeLine('});');
    }
    generateNegativeTests(writer, endpoint, method, testPath, hasAuth) {
        const hasBody = ['post', 'put', 'patch'].includes(method);
        // Test with invalid/empty data
        if (hasBody) {
            writer.writeLine(`it('should handle invalid request data appropriately', async () => {`);
            writer.indent(() => {
                writer.writeLine('const response = await request(baseURL)');
                writer.writeLine(`.${method}('${testPath}')`);
                if (hasAuth) {
                    writer.writeLine('.set(authHeaders)');
                }
                writer.writeLine('.send({}) // Empty/invalid data');
                writer.writeLine(';');
                writer.blankLine();
                writer.writeLine('expect([400, 401, 422, 500]).toContain(response.status);');
            });
            writer.writeLine('});');
        }
        // Test without auth if auth is required
        if (hasAuth && endpoint.security && endpoint.security.length > 0) {
            writer.blankLine();
            writer.writeLine(`it('should return 401 without authentication', async () => {`);
            writer.indent(() => {
                writer.writeLine('const response = await request(baseURL)');
                writer.writeLine(`.${method}('${testPath}')`);
                if (hasBody) {
                    const testData = this.generateTestDataForEndpoint(endpoint);
                    if (testData) {
                        writer.writeLine(`.send(${JSON.stringify(testData, null, 2)})`);
                    }
                }
                writer.writeLine(';');
                writer.blankLine();
                writer.writeLine('expect(response.status).toBe(401);');
            });
            writer.writeLine('});');
        }
    }
    processPathForTesting(path, parameters) {
        // Replace path parameters with actual test values
        let processedPath = path;
        if (parameters) {
            parameters.forEach(param => {
                if (param.in === 'path') {
                    const testValue = this.generateTestValueForParameter(param);
                    processedPath = processedPath.replace(`{${param.name}}`, String(testValue));
                }
            });
        }
        return processedPath;
    }
    generateTestValueForParameter(param) {
        if (param.schema) {
            return this.dataGenerator.generateTestData(param.schema, { useRealistic: true, includeBoundaryValues: false, generateInvalidData: false });
        }
        // Fallback based on parameter type
        switch (param.schema?.type || 'string') {
            case 'integer':
                return 123;
            case 'string':
                return 'test-id';
            default:
                return 'test-value';
        }
    }
    generateTestDataForEndpoint(endpoint) {
        if (!endpoint.requestBody?.content) {
            return null;
        }
        // Get the first content type (usually application/json)
        const contentTypes = Object.keys(endpoint.requestBody.content);
        const firstContentType = contentTypes[0];
        const schema = endpoint.requestBody.content[firstContentType]?.schema;
        if (schema) {
            return this.dataGenerator.generateTestData(schema, {
                useRealistic: true,
                includeBoundaryValues: false,
                generateInvalidData: false
            });
        }
        return null;
    }
    getExpectedStatus(method, responses) {
        // Find the first 2xx response
        for (const status of Object.keys(responses)) {
            if (status.startsWith('2')) {
                return parseInt(status);
            }
        }
        // Default expected statuses by method
        switch (method.toUpperCase()) {
            case 'GET': return 200;
            case 'POST': return 201;
            case 'PUT': return 200;
            case 'DELETE': return 204;
            case 'PATCH': return 200;
            default: return 200;
        }
    }
    generateSetupFile(projectName, hasAuth, authSchemes) {
        const sourceFile = this.project.createSourceFile('setup.ts', '', { overwrite: true });
        if (hasAuth) {
            // Add setup auth function
            sourceFile.addFunction({
                isExported: true,
                isAsync: true,
                name: 'setupAuth',
                returnType: 'Promise<Record<string, string>>',
                statements: writer => {
                    writer.writeLine('// Configure authentication based on your API requirements');
                    writer.writeLine('// Customize based on your auth scheme');
                    writer.blankLine();
                    // Generate auth setup based on detected schemes
                    const hasApiKey = Object.values(authSchemes).some((scheme) => scheme.type === 'apiKey');
                    const hasBearer = Object.values(authSchemes).some((scheme) => scheme.type === 'http' && scheme.scheme === 'bearer');
                    const hasBasic = Object.values(authSchemes).some((scheme) => scheme.type === 'http' && scheme.scheme === 'basic');
                    if (hasBearer || hasApiKey) {
                        writer.writeLine('return {');
                        writer.indent(() => {
                            writer.writeLine("'Authorization': `Bearer ${process.env.API_KEY || 'test-api-key'}`,");
                            writer.writeLine("'Content-Type': 'application/json'");
                        });
                        writer.writeLine('};');
                    }
                    else if (hasBasic) {
                        writer.writeLine("const credentials = Buffer.from(`${process.env.API_USER || 'test'}:${process.env.API_PASS || 'test'}`).toString('base64');");
                        writer.writeLine('return {');
                        writer.indent(() => {
                            writer.writeLine("'Authorization': `Basic ${credentials}`,");
                            writer.writeLine("'Content-Type': 'application/json'");
                        });
                        writer.writeLine('};');
                    }
                    else {
                        writer.writeLine('return {');
                        writer.indent(() => {
                            writer.writeLine("'Content-Type': 'application/json'");
                        });
                        writer.writeLine('};');
                    }
                }
            });
        }
        // Add global setup/teardown
        sourceFile.addStatements(writer => {
            writer.writeLine('beforeAll(async () => {');
            writer.indent(() => {
                writer.writeLine("console.log('🧪 Setting up test environment');");
                writer.writeLine('// Add any global setup logic here');
            });
            writer.writeLine('});');
            writer.blankLine();
            writer.writeLine('afterAll(async () => {');
            writer.indent(() => {
                writer.writeLine("console.log('🧹 Cleaning up test environment');");
                writer.writeLine('// Add any global cleanup logic here');
            });
            writer.writeLine('});');
        });
        return sourceFile.getFullText();
    }
}
exports.ASTGenerator = ASTGenerator;
//# sourceMappingURL=ast-generator.js.map