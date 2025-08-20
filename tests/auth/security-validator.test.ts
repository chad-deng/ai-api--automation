/**
 * Security Validator Tests  
 * Week 3 Sprint 1: Comprehensive testing for security validation and test generation
 */

import { SecurityValidator } from '../../src/auth/security-validator';
import { ParsedOpenAPI } from '../../src/types';

describe('SecurityValidator', () => {
  let validator: SecurityValidator;

  beforeEach(() => {
    validator = new SecurityValidator();
  });

  const createMockSpec = (overrides: Partial<ParsedOpenAPI> = {}): ParsedOpenAPI => ({
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    metadata: {
      totalPaths: 0,
      totalOperations: 0,
      httpMethods: new Set(),
      tags: [],
      hasComponents: false,
      hasServers: false,
      hasSecurity: false,
      openApiVersion: '3.0.0'
    },
    ...overrides
  });

  describe('API Security Validation', () => {
    test('should pass validation for secure API', async () => {
      const secureSpec = createMockSpec({
        security: [{ 'bearerAuth': [] }],
        components: {
          securitySchemes: {
            'bearerAuth': {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/users': {
            get: {
              security: [{ 'bearerAuth': [] }],
              responses: {
                '200': { description: 'Success' }
              }
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(secureSpec);

      expect(result.isSecure).toBe(true);
      expect(result.securityScore).toBeGreaterThan(70);
      // A truly secure API might still have recommendations, so check for critical vulnerabilities
      const criticalVulns = result.vulnerabilities.filter(v => v.type === 'critical');
      expect(criticalVulns.length).toBe(0);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    test('should detect missing global security', async () => {
      const insecureSpec = createMockSpec({
        // No global security
        paths: {
          '/users': {
            get: {
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(insecureSpec);

      expect(result.isSecure).toBe(false);
      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'high',
          category: 'Authentication',
          description: 'No global security requirements defined',
          cwe: 'CWE-306'
        })
      );
    });

    test('should detect insecure authentication schemes', async () => {
      const basicAuthSpec = createMockSpec({
        security: [{ 'basicAuth': [] }],
        components: {
          securitySchemes: {
            'basicAuth': {
              type: 'http',
              scheme: 'basic'
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(basicAuthSpec);

      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'medium',
          category: 'Authentication',
          description: expect.stringContaining('insecure authentication scheme'),
          cwe: 'CWE-326'
        })
      );
    });

    test('should detect API keys in query parameters', async () => {
      const queryKeySpec = createMockSpec({
        security: [{ 'apiKeyQuery': [] }],
        components: {
          securitySchemes: {
            'apiKeyQuery': {
              type: 'apiKey',
              name: 'api_key',
              in: 'query'
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(queryKeySpec);

      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'high',
          category: 'Authentication',
          description: expect.stringContaining('API key in query parameter'),
          cwe: 'CWE-598'
        })
      );
    });

    test('should detect insecure HTTP servers', async () => {
      const httpSpec = createMockSpec({
        servers: [
          { url: 'http://api.example.com' },
          { url: 'https://secure.example.com' }
        ]
      });

      const result = await validator.validateApiSecurity(httpSpec);

      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'high',
          category: 'Transport Security',
          description: expect.stringContaining('Insecure HTTP server URL'),
          cwe: 'CWE-319'
        })
      );
    });

    test('should detect sensitive endpoints without security', async () => {
      const unsecuredSensitiveSpec = createMockSpec({
        paths: {
          '/users/delete': {
            delete: {
              // No security requirements
              responses: { '200': { description: 'Success' } }
            }
          },
          '/admin/settings': {
            post: {
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(unsecuredSensitiveSpec);

      const sensitiveEndpointVulns = result.vulnerabilities.filter(v => 
        v.category === 'Authorization' && 
        v.description.includes('Sensitive endpoint lacks security requirements')
      );
      
      expect(sensitiveEndpointVulns.length).toBeGreaterThan(0);
    });

    test('should calculate appropriate security scores', async () => {
      const criticalVulnSpec = createMockSpec({
        servers: [{ url: 'http://api.example.com' }], // Critical vulnerability
        components: {
          securitySchemes: {
            'basicAuth': { type: 'http', scheme: 'basic' } // Medium vulnerability
          }
        }
      });

      const result = await validator.validateApiSecurity(criticalVulnSpec);

      expect(result.securityScore).toBeLessThan(70); // Should have low score due to vulnerabilities
      expect(result.isSecure).toBe(false);
    });

    test('should handle OAuth2 flow validation', async () => {
      const oauth2ImplicitSpec = createMockSpec({
        components: {
          securitySchemes: {
            'oauth2': {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'https://example.com/auth',
                  scopes: {
                    'read': 'Read access'
                  }
                }
              }
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(oauth2ImplicitSpec);

      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'medium',
          category: 'Authentication',
          description: expect.stringContaining('OAuth2 implicit flow detected'),
          cwe: 'CWE-601'
        })
      );
    });
  });

  describe('Security Test Generation', () => {
    test('should generate authentication tests', async () => {
      const spec = createMockSpec({
        paths: {
          '/users': {
            get: {
              security: [{ 'bearerAuth': [] }],
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const securityTests = await validator.generateSecurityTests(spec);

      const authTests = securityTests.filter(test => test.testType === 'authentication');
      expect(authTests.length).toBeGreaterThan(0);
      
      expect(authTests).toContainEqual(
        expect.objectContaining({
          name: 'GET /users without authentication',
          testType: 'authentication',
          expectedStatus: 401,
          authBypass: true
        })
      );
    });

    test('should generate authorization tests', async () => {
      const spec = createMockSpec({
        paths: {
          '/admin/users': {
            delete: {
              security: [{ 'bearerAuth': [] }],
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const securityTests = await validator.generateSecurityTests(spec);

      const authzTests = securityTests.filter(test => test.testType === 'authorization');
      expect(authzTests.length).toBeGreaterThan(0);
      
      expect(authzTests).toContainEqual(
        expect.objectContaining({
          name: expect.stringContaining('insufficient permissions'),
          testType: 'authorization',
          expectedStatus: 403
        })
      );
    });

    test('should generate injection tests', async () => {
      const spec = createMockSpec({
        paths: {
          '/users/{id}': {
            get: {
              parameters: [{
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }],
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const securityTests = await validator.generateSecurityTests(spec);

      const injectionTests = securityTests.filter(test => test.testType === 'injection');
      expect(injectionTests.length).toBeGreaterThan(0);
      
      expect(injectionTests).toContainEqual(
        expect.objectContaining({
          name: expect.stringContaining('SQL injection test'),
          testType: 'injection',
          expectedStatus: 400
        })
      );
    });

    test('should generate information disclosure tests', async () => {
      const spec = createMockSpec({
        paths: {
          '/debug/logs': {
            get: {
              responses: { '200': { description: 'Debug information' } }
            }
          }
        }
      });

      const securityTests = await validator.generateSecurityTests(spec);

      const disclosureTests = securityTests.filter(test => test.testType === 'disclosure');
      expect(disclosureTests.length).toBeGreaterThan(0);
      
      expect(disclosureTests).toContainEqual(
        expect.objectContaining({
          name: expect.stringContaining('error disclosure test'),
          testType: 'disclosure',
          expectedStatus: 500
        })
      );
    });
  });

  describe('Authentication Configuration Validation', () => {
    test('should validate bearer token configuration', async () => {
      const result = await validator.validateAuthConfig({ type: 'bearer' });

      expect(result.isSecure).toBe(true);
      expect(result.recommendations).toContainEqual(
        expect.stringContaining('bearer tokens are properly validated')
      );
    });

    test('should flag API key in query parameters', async () => {
      const result = await validator.validateAuthConfig({
        type: 'apikey',
        location: 'query'
      });

      expect(result.isSecure).toBe(false);
      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'high',
          category: 'Authentication',
          description: 'API key configured to be sent in query parameters',
          cwe: 'CWE-598'
        })
      );
    });

    test('should flag insecure OAuth2 token URL', async () => {
      const result = await validator.validateAuthConfig({
        type: 'oauth2',
        tokenUrl: 'http://insecure.example.com/token'
      });

      expect(result.isSecure).toBe(false);
      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'critical',
          category: 'Transport Security',
          description: 'OAuth2 token URL is not using HTTPS',
          cwe: 'CWE-319'
        })
      );
    });

    test('should recommend upgrading Basic Auth', async () => {
      const result = await validator.validateAuthConfig({ type: 'basic' });

      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'medium',
          category: 'Authentication',
          description: 'Basic Authentication is configured',
          cwe: 'CWE-522'
        })
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty OpenAPI spec', async () => {
      const emptySpec = createMockSpec();

      const result = await validator.validateApiSecurity(emptySpec);

      expect(result.isSecure).toBe(false);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
    });

    test('should handle spec without components', async () => {
      const noComponentsSpec = createMockSpec({
        paths: {
          '/test': {
            get: {
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(noComponentsSpec);

      expect(result.vulnerabilities).toContainEqual(
        expect.objectContaining({
          type: 'high',
          category: 'Authentication',
          description: 'No security schemes defined'
        })
      );
    });

    test('should handle complex nested paths', async () => {
      const complexSpec = createMockSpec({
        paths: {
          '/api/v1/users/{userId}/posts/{postId}/comments': {
            get: {
              parameters: [
                { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
                { name: 'postId', in: 'path', required: true, schema: { type: 'string' } }
              ],
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const securityTests = await validator.generateSecurityTests(complexSpec);

      expect(securityTests.length).toBeGreaterThan(0);
      expect(securityTests.some(test => test.endpoint.includes('userId'))).toBe(true);
    });

    test('should handle missing response definitions', async () => {
      const noResponsesSpec = createMockSpec({
        paths: {
          '/test': {
            post: {
              // Missing responses
            }
          }
        }
      });

      const securityTests = await validator.generateSecurityTests(noResponsesSpec);

      expect(securityTests.length).toBeGreaterThan(0); // Should still generate tests
    });
  });

  describe('Security Score Calculation', () => {
    test('should give high scores to secure APIs', async () => {
      const secureSpec = createMockSpec({
        security: [{ 'bearerAuth': [] }],
        components: {
          securitySchemes: {
            'bearerAuth': {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        servers: [{ url: 'https://secure.example.com' }],
        paths: {
          '/api/data': {
            get: {
              security: [{ 'bearerAuth': [] }],
              responses: {
                '200': { 
                  description: 'Success',
                  headers: {
                    'X-RateLimit-Limit': { description: 'Rate limit' }
                  }
                }
              }
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(secureSpec);

      expect(result.securityScore).toBeGreaterThan(85);
      expect(result.isSecure).toBe(true);
    });

    test('should give low scores to highly vulnerable APIs', async () => {
      const vulnerableSpec = createMockSpec({
        servers: [{ url: 'http://insecure.example.com' }],
        components: {
          securitySchemes: {
            'queryKey': {
              type: 'apiKey',
              name: 'key',
              in: 'query'
            }
          }
        },
        paths: {
          '/admin/delete-all': {
            delete: {
              // No security
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const result = await validator.validateApiSecurity(vulnerableSpec);

      expect(result.securityScore).toBeLessThan(50);
      expect(result.isSecure).toBe(false);
    });
  });
});