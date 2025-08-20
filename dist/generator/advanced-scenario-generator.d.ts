/**
 * Advanced Test Scenario Generator (US-017)
 * Generates comprehensive test scenarios beyond basic CRUD operations
 * Including security tests, edge cases, contract validation, and complex workflows
 */
import { Operation, ParsedOpenAPI } from '../types';
import { TestCase, GenerationOptions } from './test-generator';
export interface AdvancedScenario {
    type: 'security' | 'performance' | 'contract' | 'integration' | 'edge-case' | 'business-logic';
    name: string;
    description: string;
    testCases: TestCase[];
    complexity: 'low' | 'medium' | 'high';
    priority: 'critical' | 'high' | 'medium' | 'low';
}
export interface SecurityTestScenario {
    testType: 'injection' | 'authorization' | 'authentication' | 'input-validation' | 'rate-limiting';
    payloads: any[];
    expectedBehavior: 'block' | 'sanitize' | 'error';
}
export interface ContractTestScenario {
    schemaValidation: boolean;
    headerValidation: boolean;
    responseTypeValidation: boolean;
    strictMode: boolean;
}
export interface PerformanceTestScenario {
    loadType: 'stress' | 'spike' | 'volume' | 'endurance';
    concurrency: number;
    duration: number;
    thresholds: {
        responseTime: number;
        throughput: number;
        errorRate: number;
    };
}
export declare class AdvancedScenarioGenerator {
    private readonly securityPayloads;
    /**
     * Generate comprehensive test scenarios for all operations
     */
    generateAdvancedScenarios(operations: Operation[], spec: ParsedOpenAPI, options: GenerationOptions): Promise<AdvancedScenario[]>;
    /**
     * Generate security-focused test scenarios
     */
    private generateSecurityScenarios;
    /**
     * Generate edge case test scenarios
     */
    private generateEdgeCaseScenarios;
    /**
     * Generate contract validation scenarios
     */
    private generateContractScenarios;
    /**
     * Generate business logic test scenarios
     */
    private generateBusinessLogicScenarios;
    /**
     * Generate integration test scenarios
     */
    private generateIntegrationScenarios;
    /**
     * Generate SQL injection test cases
     */
    private generateSqlInjectionTests;
    /**
     * Generate XSS test cases
     */
    private generateXssTests;
    /**
     * Generate authorization test cases
     */
    private generateAuthorizationTests;
    /**
     * Generate input validation test cases
     */
    private generateInputValidationTests;
    /**
     * Generate boundary value test cases
     */
    private generateBoundaryValueTests;
    /**
     * Generate large payload test cases
     */
    private generateLargePayloadTests;
    /**
     * Generate unicode test cases
     */
    private generateUnicodeTests;
    /**
     * Generate null and empty value test cases
     */
    private generateNullEmptyTests;
    /**
     * Generate contract validation test cases
     */
    private generateContractValidationTests;
    /**
     * Generate state transition test cases
     */
    private generateStateTransitionTests;
    /**
     * Generate workflow test cases
     */
    private generateWorkflowTests;
    /**
     * Generate multi-endpoint integration test cases
     */
    private generateMultiEndpointTests;
    /**
     * Helper methods
     */
    private hasStringParameters;
    private requiresAuth;
    private isStatefulOperation;
    private isWorkflowOperation;
    private createMaliciousRequestData;
    private generateValidRequestData;
    private generateInvalidTypeData;
    private generateValidValue;
    private generateInvalidTypeValue;
    private generateBoundaryValues;
    private generateLargePayload;
    private generateWorkflowData;
}
//# sourceMappingURL=advanced-scenario-generator.d.ts.map