/**
 * Security Validator
 * Week 3 Sprint 1: Security testing and validation for API endpoints
 */
import { ParsedOpenAPI } from '../types';
import { AuthConfiguration } from '../generator/test-generator';
export interface SecurityValidationResult {
    isSecure: boolean;
    vulnerabilities: SecurityVulnerability[];
    recommendations: string[];
    securityScore: number;
}
export interface SecurityVulnerability {
    type: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    description: string;
    endpoint?: string;
    recommendation: string;
    cwe?: string;
}
export interface SecurityTestCase {
    name: string;
    description: string;
    endpoint: string;
    method: string;
    testType: 'authentication' | 'authorization' | 'injection' | 'disclosure' | 'rate-limit';
    payload?: any;
    expectedStatus: number;
    authBypass?: boolean;
}
export declare class SecurityValidator {
    private parser;
    constructor();
    /**
     * Validate API security configuration
     */
    validateApiSecurity(spec: ParsedOpenAPI): Promise<SecurityValidationResult>;
    /**
     * Generate security test cases
     */
    generateSecurityTests(spec: ParsedOpenAPI): Promise<SecurityTestCase[]>;
    /**
     * Validate authentication configuration
     */
    validateAuthConfig(config: AuthConfiguration): Promise<SecurityValidationResult>;
    private validateGlobalSecurity;
    private validateEndpointSecurity;
    private validateSecuritySchemes;
    private validateCommonIssues;
    private generateAuthenticationTests;
    private generateAuthorizationTests;
    private generateInjectionTests;
    private generateDisclosureTests;
    private validateBearerConfig;
    private validateApiKeyConfig;
    private validateOAuth2Config;
    private validateBasicAuthConfig;
    private validateOAuth2Flows;
    private isInsecureScheme;
    private isSensitiveOperation;
    private mightExposeSensitiveData;
    private calculateSecurityScore;
}
//# sourceMappingURL=security-validator.d.ts.map