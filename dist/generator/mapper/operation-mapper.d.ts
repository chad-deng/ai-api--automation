/**
 * Operation-to-Test Mapping Engine
 * Week 2 Sprint 1: Comprehensive operation mapping with request/response validation
 */
import { Operation, ParsedOpenAPI, Schema } from '../../types';
export interface MappedOperation {
    operation: Operation;
    testScenarios: TestScenario[];
    validationRules: ValidationRule[];
    dataRequirements: DataRequirement[];
    dependencies: string[];
}
export interface TestScenario {
    id: string;
    name: string;
    type: 'success' | 'error' | 'edge' | 'security' | 'performance';
    description: string;
    priority: 'high' | 'medium' | 'low';
    tags: string[];
    requestData: RequestDataTemplate;
    expectedResponse: ResponseTemplate;
    statusCode: number;
    assertions: AssertionTemplate[];
}
export interface ValidationRule {
    field: string;
    type: 'required' | 'type' | 'format' | 'range' | 'pattern' | 'enum';
    constraint: any;
    errorMessage: string;
}
export interface DataRequirement {
    parameter: string;
    location: 'path' | 'query' | 'header' | 'body';
    dataType: string;
    required: boolean;
    constraints: SchemaConstraints;
    examples: any[];
}
export interface SchemaConstraints {
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
    format?: string;
}
export interface RequestDataTemplate {
    pathParams: Record<string, any>;
    queryParams: Record<string, any>;
    headers: Record<string, any>;
    body: any;
}
export interface ResponseTemplate {
    statusCode: number;
    headers: Record<string, any>;
    body: any;
    schema?: Schema;
}
export interface AssertionTemplate {
    type: 'status' | 'body' | 'header' | 'schema' | 'performance';
    target: string;
    operator: 'equals' | 'contains' | 'matches' | 'exists' | 'type' | 'range';
    expected: any;
    message: string;
}
export declare class OperationMapper {
    private spec;
    private mappedOperations;
    constructor(spec: ParsedOpenAPI);
    /**
     * Map all operations to test scenarios
     */
    mapAllOperations(): Promise<MappedOperation[]>;
    /**
     * Map a single operation to test scenarios
     */
    mapOperation(operation: Operation): Promise<MappedOperation>;
    /**
     * Generate comprehensive test scenarios for an operation
     */
    private generateTestScenarios;
    /**
     * Generate success test scenarios
     */
    private generateSuccessScenarios;
    /**
     * Generate error test scenarios
     */
    private generateErrorScenarios;
    /**
     * Generate edge case scenarios
     */
    private generateEdgeScenarios;
    /**
     * Generate security test scenarios
     */
    private generateSecurityScenarios;
    /**
     * Generate performance test scenarios
     */
    private generatePerformanceScenarios;
    /**
     * Extract validation rules from operation
     */
    private extractValidationRules;
    /**
     * Extract data requirements from operation
     */
    private extractDataRequirements;
    /**
     * Helper methods for data generation and analysis
     */
    private extractOperations;
    private getOperationKey;
    private getSuccessResponses;
    private getErrorResponses;
    private requiresAuthentication;
    private generateValidRequestData;
    private generateInvalidRequestData;
    private generateMinimalRequestData;
    private generateMaximalRequestData;
    private generateResponseTemplate;
    private getDefaultSuccessResponse;
    private generateSuccessAssertions;
    private generateErrorAssertions;
    private generateEdgeAssertions;
    private generateSecurityAssertions;
    private generatePerformanceAssertions;
    private analyzeDependencies;
    private extractSchemaValidationRules;
    private getParameterType;
    private extractSchemaConstraints;
    private extractExamples;
    /**
     * Public API methods
     */
    getMappedOperation(operationId: string): MappedOperation | undefined;
    getAllMappedOperations(): MappedOperation[];
    getTestScenariosByType(type: TestScenario['type']): TestScenario[];
    getHighPriorityScenarios(): TestScenario[];
}
//# sourceMappingURL=operation-mapper.d.ts.map