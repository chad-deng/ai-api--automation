import { EndpointInfo } from './analyzer';
import { OpenAPISpec } from './parser';
export declare class ASTGenerator {
    private project;
    private dataGenerator;
    constructor(spec: OpenAPISpec);
    generateTestFile(filename: string, endpoints: EndpointInfo[], serverUrl: string, hasAuth: boolean): string;
    private addImports;
    private generateEndpointTest;
    private generatePositiveTest;
    private generateNegativeTests;
    private processPathForTesting;
    private generateTestValueForParameter;
    private generateTestDataForEndpoint;
    private getExpectedStatus;
    generateSetupFile(projectName: string, hasAuth: boolean, authSchemes: Record<string, any>): string;
}
