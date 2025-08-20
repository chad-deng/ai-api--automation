"use strict";
/**
 * Security Validator
 * Week 3 Sprint 1: Security testing and validation for API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidator = void 0;
const openapi_parser_1 = require("../parser/openapi-parser");
class SecurityValidator {
    constructor() {
        this.parser = new openapi_parser_1.OpenAPIParser();
    }
    /**
     * Validate API security configuration
     */
    async validateApiSecurity(spec) {
        const vulnerabilities = [];
        const recommendations = [];
        // Check global security configuration
        await this.validateGlobalSecurity(spec, vulnerabilities, recommendations);
        // Check endpoint-level security
        await this.validateEndpointSecurity(spec, vulnerabilities, recommendations);
        // Check security schemes
        await this.validateSecuritySchemes(spec, vulnerabilities, recommendations);
        // Check for common security issues
        await this.validateCommonIssues(spec, vulnerabilities, recommendations);
        const securityScore = this.calculateSecurityScore(vulnerabilities);
        return {
            isSecure: securityScore >= 70 && vulnerabilities.filter(v => v.type === 'critical').length === 0,
            vulnerabilities,
            recommendations,
            securityScore
        };
    }
    /**
     * Generate security test cases
     */
    async generateSecurityTests(spec) {
        const testCases = [];
        const operations = await this.parser.extractOperations(spec);
        for (const { operation, method, path } of operations) {
            // Authentication tests
            testCases.push(...await this.generateAuthenticationTests(operation, method, path));
            // Authorization tests
            testCases.push(...await this.generateAuthorizationTests(operation, method, path));
            // Injection tests
            testCases.push(...await this.generateInjectionTests(operation, method, path));
            // Information disclosure tests
            testCases.push(...await this.generateDisclosureTests(operation, method, path));
        }
        return testCases;
    }
    /**
     * Validate authentication configuration
     */
    async validateAuthConfig(config) {
        const vulnerabilities = [];
        const recommendations = [];
        switch (config.type) {
            case 'bearer':
                this.validateBearerConfig(config, vulnerabilities, recommendations);
                break;
            case 'apikey':
                this.validateApiKeyConfig(config, vulnerabilities, recommendations);
                break;
            case 'oauth2':
                this.validateOAuth2Config(config, vulnerabilities, recommendations);
                break;
            case 'basic':
                this.validateBasicAuthConfig(config, vulnerabilities, recommendations);
                break;
        }
        return {
            isSecure: vulnerabilities.filter(v => ['critical', 'high'].includes(v.type)).length === 0,
            vulnerabilities,
            recommendations,
            securityScore: this.calculateSecurityScore(vulnerabilities)
        };
    }
    async validateGlobalSecurity(spec, vulnerabilities, _recommendations) {
        // Check if global security is defined
        if (!spec.security || spec.security.length === 0) {
            vulnerabilities.push({
                type: 'high',
                category: 'Authentication',
                description: 'No global security requirements defined',
                recommendation: 'Define global security requirements to protect all endpoints by default',
                cwe: 'CWE-306'
            });
        }
        // Check for insecure schemes in security requirements
        if (spec.security) {
            for (const requirement of spec.security) {
                for (const [schemeName] of Object.entries(requirement)) {
                    const scheme = spec.components?.securitySchemes?.[schemeName];
                    if (scheme && this.isInsecureScheme(scheme)) {
                        vulnerabilities.push({
                            type: 'medium',
                            category: 'Authentication',
                            description: `Potentially insecure authentication scheme: ${schemeName}`,
                            recommendation: 'Consider using more secure authentication methods like OAuth2 or JWT',
                            cwe: 'CWE-326'
                        });
                    }
                }
            }
        }
    }
    async validateEndpointSecurity(spec, vulnerabilities, _recommendations) {
        const operations = await this.parser.extractOperations(spec);
        for (const { operation, method, path } of operations) {
            // Check if sensitive operations have proper security
            if (this.isSensitiveOperation(method, path) && !operation.security) {
                vulnerabilities.push({
                    type: 'high',
                    category: 'Authorization',
                    description: `Sensitive endpoint lacks security requirements: ${method.toUpperCase()} ${path}`,
                    endpoint: `${method.toUpperCase()} ${path}`,
                    recommendation: 'Add security requirements to sensitive endpoints',
                    cwe: 'CWE-862'
                });
            }
            // Check for endpoints that might expose sensitive data
            if (this.mightExposeSensitiveData(operation, path)) {
                vulnerabilities.push({
                    type: 'medium',
                    category: 'Information Disclosure',
                    description: `Endpoint might expose sensitive information: ${method.toUpperCase()} ${path}`,
                    endpoint: `${method.toUpperCase()} ${path}`,
                    recommendation: 'Review response data and ensure sensitive information is properly protected',
                    cwe: 'CWE-200'
                });
            }
        }
    }
    async validateSecuritySchemes(spec, vulnerabilities, _recommendations) {
        const schemes = spec.components?.securitySchemes;
        if (!schemes || Object.keys(schemes).length === 0) {
            vulnerabilities.push({
                type: 'high',
                category: 'Authentication',
                description: 'No security schemes defined',
                recommendation: 'Define appropriate security schemes for your API',
                cwe: 'CWE-306'
            });
            return;
        }
        for (const [name, scheme] of Object.entries(schemes)) {
            if (typeof scheme === 'object') {
                // Check for HTTP Basic Auth
                if (scheme.type === 'http' && scheme.scheme === 'basic') {
                    vulnerabilities.push({
                        type: 'medium',
                        category: 'Authentication',
                        description: `Basic Auth scheme detected: ${name}`,
                        recommendation: 'Consider using more secure authentication methods like OAuth2 or JWT',
                        cwe: 'CWE-522'
                    });
                }
                // Check for API keys in URLs
                if (scheme.type === 'apiKey' && scheme.in === 'query') {
                    vulnerabilities.push({
                        type: 'high',
                        category: 'Authentication',
                        description: `API key in query parameter: ${name}`,
                        recommendation: 'Move API keys to headers to prevent exposure in logs',
                        cwe: 'CWE-598'
                    });
                }
                // Check OAuth2 flow security
                if (scheme.type === 'oauth2' && scheme.flows) {
                    this.validateOAuth2Flows(scheme.flows, name, vulnerabilities);
                }
            }
        }
    }
    async validateCommonIssues(spec, vulnerabilities, _recommendations) {
        // Check for HTTPS enforcement
        if (spec.servers) {
            for (const server of spec.servers) {
                if (server.url.startsWith('http://')) {
                    vulnerabilities.push({
                        type: 'high',
                        category: 'Transport Security',
                        description: `Insecure HTTP server URL: ${server.url}`,
                        recommendation: 'Use HTTPS for all API communications',
                        cwe: 'CWE-319'
                    });
                }
            }
        }
        // Check for missing rate limiting indicators
        const operations = await this.parser.extractOperations(spec);
        const hasRateLimitHeaders = operations.some(({ operation }) => operation.responses && Object.values(operation.responses).some(response => typeof response === 'object' && response.headers &&
            Object.keys(response.headers).some(header => header.toLowerCase().includes('rate') || header.toLowerCase().includes('limit'))));
        if (!hasRateLimitHeaders) {
            vulnerabilities.push({
                type: 'medium',
                category: 'Rate Limiting',
                description: 'No rate limiting headers detected in API responses',
                recommendation: 'Implement and document rate limiting to prevent abuse',
                cwe: 'CWE-770'
            });
        }
    }
    async generateAuthenticationTests(operation, method, path) {
        const tests = [];
        // Test without authentication
        tests.push({
            name: `${method.toUpperCase()} ${path} without authentication`,
            description: 'Verify endpoint properly rejects unauthenticated requests',
            endpoint: path,
            method: method.toUpperCase(),
            testType: 'authentication',
            expectedStatus: 401,
            authBypass: true
        });
        // Test with invalid token
        tests.push({
            name: `${method.toUpperCase()} ${path} with invalid token`,
            description: 'Verify endpoint properly rejects invalid authentication tokens',
            endpoint: path,
            method: method.toUpperCase(),
            testType: 'authentication',
            payload: { invalidToken: 'invalid-token-12345' },
            expectedStatus: 401
        });
        // Test with expired token (if applicable)
        tests.push({
            name: `${method.toUpperCase()} ${path} with expired token`,
            description: 'Verify endpoint properly rejects expired authentication tokens',
            endpoint: path,
            method: method.toUpperCase(),
            testType: 'authentication',
            payload: { expiredToken: 'expired-token-12345' },
            expectedStatus: 401
        });
        return tests;
    }
    async generateAuthorizationTests(operation, method, path) {
        const tests = [];
        // Test with insufficient permissions
        tests.push({
            name: `${method.toUpperCase()} ${path} with insufficient permissions`,
            description: 'Verify endpoint properly enforces authorization',
            endpoint: path,
            method: method.toUpperCase(),
            testType: 'authorization',
            payload: { limitedPermissions: true },
            expectedStatus: 403
        });
        return tests;
    }
    async generateInjectionTests(operation, method, path) {
        const tests = [];
        // SQL injection tests for parameters
        if (operation.parameters) {
            tests.push({
                name: `${method.toUpperCase()} ${path} SQL injection test`,
                description: 'Test for SQL injection vulnerabilities in parameters',
                endpoint: path,
                method: method.toUpperCase(),
                testType: 'injection',
                payload: { sqlInjection: "'; DROP TABLE users; --" },
                expectedStatus: 400
            });
        }
        // XSS tests for string inputs
        tests.push({
            name: `${method.toUpperCase()} ${path} XSS test`,
            description: 'Test for Cross-Site Scripting vulnerabilities',
            endpoint: path,
            method: method.toUpperCase(),
            testType: 'injection',
            payload: { xssPayload: '<script>alert("xss")</script>' },
            expectedStatus: 400
        });
        return tests;
    }
    async generateDisclosureTests(operation, method, path) {
        const tests = [];
        // Test for information disclosure in error responses
        tests.push({
            name: `${method.toUpperCase()} ${path} error disclosure test`,
            description: 'Verify error responses do not leak sensitive information',
            endpoint: path,
            method: method.toUpperCase(),
            testType: 'disclosure',
            payload: { triggerError: true },
            expectedStatus: 500
        });
        return tests;
    }
    validateBearerConfig(_config, _vulnerabilities, recommendations) {
        recommendations.push('Ensure bearer tokens are properly validated and have appropriate expiration times');
    }
    validateApiKeyConfig(config, vulnerabilities, _recommendations) {
        if (config.location === 'query') {
            vulnerabilities.push({
                type: 'high',
                category: 'Authentication',
                description: 'API key configured to be sent in query parameters',
                recommendation: 'Move API keys to headers to prevent exposure in logs and URLs',
                cwe: 'CWE-598'
            });
        }
    }
    validateOAuth2Config(config, vulnerabilities, recommendations) {
        if (config.tokenUrl && !config.tokenUrl.startsWith('https://')) {
            vulnerabilities.push({
                type: 'critical',
                category: 'Transport Security',
                description: 'OAuth2 token URL is not using HTTPS',
                recommendation: 'Ensure all OAuth2 endpoints use HTTPS',
                cwe: 'CWE-319'
            });
        }
        recommendations.push('Implement proper token validation, refresh mechanisms, and scope enforcement');
    }
    validateBasicAuthConfig(_config, vulnerabilities, _recommendations) {
        vulnerabilities.push({
            type: 'medium',
            category: 'Authentication',
            description: 'Basic Authentication is configured',
            recommendation: 'Consider upgrading to more secure authentication methods like OAuth2',
            cwe: 'CWE-522'
        });
    }
    validateOAuth2Flows(flows, schemeName, vulnerabilities) {
        if (flows.implicit) {
            vulnerabilities.push({
                type: 'medium',
                category: 'Authentication',
                description: `OAuth2 implicit flow detected in scheme: ${schemeName}`,
                recommendation: 'Consider using authorization code flow with PKCE instead of implicit flow',
                cwe: 'CWE-601'
            });
        }
    }
    isInsecureScheme(scheme) {
        if (typeof scheme === 'object') {
            return scheme.type === 'http' && scheme.scheme === 'basic';
        }
        return false;
    }
    isSensitiveOperation(method, path) {
        const sensitivePatterns = [
            /\/(users?|accounts?|profiles?)/i,
            /\/(admin|management|settings)/i,
            /\/(delete|remove)/i,
            /\/(password|credentials|tokens?)/i
        ];
        const sensitiveMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        return sensitiveMethods.includes(method.toUpperCase()) ||
            sensitivePatterns.some(pattern => pattern.test(path));
    }
    mightExposeSensitiveData(operation, path) {
        const sensitiveDataPatterns = [
            /\/(users?|accounts?|profiles?)/i,
            /\/(personal|private|confidential)/i,
            /\/(internal|debug|logs?)/i
        ];
        return sensitiveDataPatterns.some(pattern => pattern.test(path));
    }
    calculateSecurityScore(vulnerabilities) {
        let score = 100;
        for (const vuln of vulnerabilities) {
            switch (vuln.type) {
                case 'critical':
                    score -= 25;
                    break;
                case 'high':
                    score -= 15;
                    break;
                case 'medium':
                    score -= 8;
                    break;
                case 'low':
                    score -= 3;
                    break;
                case 'info':
                    score -= 1;
                    break;
            }
        }
        return Math.max(0, score);
    }
}
exports.SecurityValidator = SecurityValidator;
//# sourceMappingURL=security-validator.js.map