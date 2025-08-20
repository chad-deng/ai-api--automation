/**
 * Enhanced Test Generator Tests
 * Week 4 Sprint 1: Test generation with authentication and contract validation
 */

import { TestGenerator, GenerationOptions, GenerationResult } from '../../src/generator/test-generator';
import { CredentialProfile } from '../../src/auth/credential-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Enhanced Test Generator', () => {
  let generator: TestGenerator;
  let tempDir: string;
  let specPath: string;

  beforeEach(async () => {
    generator = new TestGenerator();
    await generator.initializeCredentials();
    
    tempDir = path.join(os.tmpdir(), 'enhanced-test-gen-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create a sample OpenAPI spec for testing
    const sampleSpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      security: [{ 'bearerAuth': [] }],
      components: {
        securitySchemes: {
          'bearerAuth': {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          'User': {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            },
            required: ['id', 'name', 'email']
          },
          'CreateUserRequest': {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              email: { type: 'string', format: 'email' }
            },
            required: ['name', 'email']
          },
          'Error': {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'integer' }
            }
          }
        }
      },
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            tags: ['users'],
            security: [{ 'bearerAuth': [] }],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
              },
              {
                name: 'offset',
                in: 'query',
                schema: { type: 'integer', minimum: 0, default: 0 }
              }
            ],
            responses: {
              '200': {
                description: 'List of users',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { '$ref': '#/components/schemas/User' }
                    }
                  }
                },
                headers: {
                  'X-Total-Count': {
                    description: 'Total number of users',
                    schema: { type: 'integer' }
                  }
                }
              },
              '401': {
                description: 'Unauthorized',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Error' }
                  }
                }
              },
              '500': {
                description: 'Internal server error',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Error' }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create user',
            tags: ['users'],
            security: [{ 'bearerAuth': [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/CreateUserRequest' }
                }
              }
            },
            responses: {
              '201': {
                description: 'User created',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/User' }
                  }
                }
              },
              '400': {
                description: 'Bad request',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Error' }
                  }
                }
              },
              '401': {
                description: 'Unauthorized',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Error' }
                  }
                }
              }
            }
          }
        },
        '/users/{id}': {
          get: {
            summary: 'Get user by ID',
            tags: ['users'],
            security: [{ 'bearerAuth': [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer', minimum: 1 }
              }
            ],
            responses: {
              '200': {
                description: 'User details',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/User' }
                  }
                }
              },
              '404': {
                description: 'User not found',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/Error' }
                  }
                }
              }
            }
          },
          put: {
            summary: 'Update user',
            tags: ['users'],
            security: [{ 'bearerAuth': [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer', minimum: 1 }
              }
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/CreateUserRequest' }
                }
              }
            },
            responses: {
              '200': {
                description: 'User updated',
                content: {
                  'application/json': {
                    schema: { '$ref': '#/components/schemas/User' }
                  }
                }
              },
              '400': { description: 'Bad request' },
              '404': { description: 'User not found' }
            }
          },
          delete: {
            summary: 'Delete user',
            tags: ['users'],
            security: [{ 'bearerAuth': [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer', minimum: 1 }
              }
            ],
            responses: {
              '204': { description: 'User deleted' },
              '404': { description: 'User not found' },
              '403': { description: 'Forbidden - cannot delete user' }
            }
          }
        },
        '/admin/users/{id}/suspend': {
          post: {
            summary: 'Suspend user (admin only)',
            tags: ['admin'],
            security: [{ 'bearerAuth': [] }],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer' }
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      reason: { type: 'string', minLength: 1, maxLength: 500 }
                    },
                    required: ['reason']
                  }
                }
              }
            },
            responses: {
              '200': { description: 'User suspended' },
              '403': { description: 'Insufficient permissions' },
              '404': { description: 'User not found' }
            }
          }
        }
      }
    };

    specPath = path.join(tempDir, 'test-api.json');
    await fs.writeFile(specPath, JSON.stringify(sampleSpec, null, 2));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup error (ignored):', error);
    }
  });

  describe('Basic Test Generation', () => {
    test('should generate basic API tests', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'basic-tests'),
        includeTypes: false,
        generateMocks: false,
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalTests).toBeGreaterThan(0);
      expect(result.summary.operationsCovered).toBe(6); // 6 operations in spec (GET, POST, GET /users/{id}, PUT, DELETE, POST /admin/users/{id}/suspend)
      expect(result.generatedFiles.length).toBeGreaterThan(0);
    });

    test('should generate tests with different frameworks', async () => {
      const frameworks: ('jest' | 'mocha' | 'vitest')[] = ['jest', 'mocha', 'vitest'];

      for (const framework of frameworks) {
        const options: GenerationOptions = {
          framework,
          outputDir: path.join(tempDir, `${framework}-tests`),
          dryRun: true
        };

        const result = await generator.generateFromFile(specPath, options);

        expect(result.success).toBe(true);
        expect(result.summary.frameworks).toContain(framework);
      }
    });

    test('should handle invalid spec file', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'invalid-tests')
      };

      const result = await generator.generateFromFile('/non/existent/spec.json', options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication Integration', () => {
    test('should generate tests with credential profile', async () => {
      const credentialManager = generator.getCredentialManager();
      
      const testProfile: CredentialProfile = {
        name: 'test-bearer-profile',
        type: 'bearer',
        credentials: { token: 'test-token-12345' },
        environment: 'test',
        createdAt: new Date()
      };

      await credentialManager.setProfile(testProfile);

      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'auth-tests'),
        credentialProfile: 'test-bearer-profile',
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalTests).toBeGreaterThan(0);
    });

    test('should handle missing credential profile gracefully', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'auth-tests'),
        credentialProfile: 'non-existent-profile'
      };

      const validation = await generator.validateGeneration(options);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(`Credential profile 'non-existent-profile' not found`);
    });

    test('should generate authentication tests with different auth types', async () => {
      const credentialManager = generator.getCredentialManager();
      
      const authProfiles: CredentialProfile[] = [
        {
          name: 'bearer-profile',
          type: 'bearer',
          credentials: { token: 'bearer-token' },
          environment: 'test',
          createdAt: new Date()
        },
        {
          name: 'apikey-profile', 
          type: 'apikey',
          credentials: { apiKey: 'api-key-123' },
          environment: 'test',
          createdAt: new Date()
        },
        {
          name: 'oauth2-profile',
          type: 'oauth2',
          credentials: { 
            clientId: 'client-123',
            clientSecret: 'secret-456',
            tokenUrl: 'https://oauth.example.com/token'
          },
          environment: 'test',
          createdAt: new Date()
        }
      ];

      for (const profile of authProfiles) {
        await credentialManager.setProfile(profile);

        const options: GenerationOptions = {
          framework: 'jest',
          outputDir: path.join(tempDir, `${profile.type}-tests`),
          credentialProfile: profile.name,
          dryRun: true
        };

        const result = await generator.generateFromFile(specPath, options);

        expect(result.success).toBe(true);
        expect(result.summary.totalTests).toBeGreaterThan(0);
      }
    });
  });

  describe('Security Test Generation', () => {
    test('should generate security test cases', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'security-tests'),
        includeSecurityTests: true,
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      
      const securityTests = generator.getGeneratedSecurityTestCases();
      expect(securityTests.length).toBeGreaterThan(0);
      
      // Should include different types of security tests
      const testTypes = securityTests.map(t => t.testType);
      expect(testTypes).toContain('authentication');
      expect(testTypes).toContain('authorization');
    });

    test('should generate security tests with coverage options', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'coverage-tests'),
        coverage: {
          includeErrorCases: true,
          includeEdgeCases: true,
          includeSecurityTests: true,
          statusCodes: ['200', '201', '400', '401', '403', '404', '500']
        },
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalTests).toBeGreaterThan(10); // Should have many test cases
    });
  });

  describe('Contract Testing', () => {
    test('should generate contract validation tests', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'contract-tests'),
        contractTesting: {
          validateRequests: true,
          validateResponses: true,
          validateHeaders: true,
          strictMode: false
        },
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      
      // Should have generated contract test files
      const contractFiles = result.generatedFiles.filter(f => f.path.includes('contract'));
      expect(contractFiles.length).toBeGreaterThan(0);
    });

    test('should validate contract testing options', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'invalid-contract-tests'),
        contractTesting: {
          validateRequests: false,
          validateResponses: false,
          validateHeaders: false,
          strictMode: false
        }
      };

      const validation = await generator.validateGeneration(options);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Contract testing enabled but no validation options specified');
    });

    test('should generate strict contract tests', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'strict-contract-tests'),
        contractTesting: {
          validateRequests: true,
          validateResponses: true,
          validateHeaders: true,
          strictMode: true
        },
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
    });
  });

  describe('Data Generation', () => {
    test('should generate tests with custom data generation options', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'data-tests'),
        dataGeneration: {
          useExamples: true,
          generateEdgeCases: true,
          maxStringLength: 500,
          maxArrayItems: 5,
          includeNull: true
        },
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalTests).toBeGreaterThan(0);
    });

    test('should generate edge case tests', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'edge-tests'),
        coverage: {
          includeErrorCases: false,
          includeEdgeCases: true,
          includeSecurityTests: false,
          statusCodes: ['200']
        },
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      
      const testCases = generator.getGeneratedTestCases();
      const edgeCases = testCases.filter(tc => tc.tags.includes('edge-case'));
      expect(edgeCases.length).toBeGreaterThan(0);
    });
  });

  describe('Type Definition Generation', () => {
    test('should generate TypeScript type definitions', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'type-tests'),
        includeTypes: true,
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      
      // Note: Type generation is stubbed in the current implementation
      // This test verifies the option is handled correctly
    });
  });

  describe('Mock File Generation', () => {
    test('should generate mock files', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'mock-tests'),
        generateMocks: true,
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      
      // Note: Mock generation is stubbed in the current implementation
      // This test verifies the option is handled correctly
    });
  });

  describe('Comprehensive Integration', () => {
    test('should generate comprehensive test suite with all options', async () => {
      const credentialManager = generator.getCredentialManager();
      
      const testProfile: CredentialProfile = {
        name: 'comprehensive-profile',
        type: 'bearer',
        credentials: { token: 'comprehensive-token' },
        environment: 'test',
        createdAt: new Date()
      };

      await credentialManager.setProfile(testProfile);

      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'comprehensive-tests'),
        includeTypes: true,
        generateMocks: true,
        credentialProfile: 'comprehensive-profile',
        includeSecurityTests: true,
        dataGeneration: {
          useExamples: true,
          generateEdgeCases: true,
          maxStringLength: 1000,
          maxArrayItems: 10,
          includeNull: false
        },
        coverage: {
          includeErrorCases: true,
          includeEdgeCases: true,
          includeSecurityTests: true,
          statusCodes: ['200', '201', '400', '401', '403', '404', '500']
        },
        contractTesting: {
          validateRequests: true,
          validateResponses: true,
          validateHeaders: true,
          strictMode: false
        },
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      expect(result.summary.totalTests).toBeGreaterThan(15); // Should have many test cases
      expect(result.summary.operationsCovered).toBe(6);
      expect(result.summary.coveragePercentage).toBe(100);
      expect(result.generatedFiles.length).toBeGreaterThan(1);
      
      const testFiles = result.generatedFiles.filter(f => f.type === 'test');
      expect(testFiles.length).toBeGreaterThan(0);
      
      // Should have reasonable estimated run time
      expect(result.summary.estimatedRunTime).toBeGreaterThan(0);
      expect(result.summary.estimatedRunTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should provide accurate generation statistics', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'stats-tests'),
        includeSecurityTests: true,
        coverage: {
          includeErrorCases: true,
          includeEdgeCases: true,
          includeSecurityTests: true,
          statusCodes: ['200', '400', '401', '403', '404', '500']
        },
        dryRun: true
      };

      const result = await generator.generateFromFile(specPath, options);

      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTests).toBeGreaterThan(0);
      expect(result.summary.operationsCovered).toBe(6);
      expect(result.summary.totalOperations).toBe(6);
      expect(result.summary.coveragePercentage).toBe(100);
      expect(result.summary.frameworks).toEqual(['jest']);
      expect(typeof result.summary.estimatedRunTime).toBe('number');
      expect(result.summary.estimatedRunTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed OpenAPI spec', async () => {
      const malformedSpecPath = path.join(tempDir, 'malformed.json');
      await fs.writeFile(malformedSpecPath, '{ invalid json }');

      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'error-tests')
      };

      const result = await generator.generateFromFile(malformedSpecPath, options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate generation options', async () => {
      const invalidOptions = {
        framework: 'invalid' as any,
        outputDir: ''
      };

      const validation = await generator.validateGeneration(invalidOptions);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid test framework specified');
      expect(validation.errors).toContain('Output directory is required');
    });

    test('should handle empty OpenAPI spec gracefully', async () => {
      const emptySpec = {
        openapi: '3.0.0',
        info: { title: 'Empty API', version: '1.0.0' },
        paths: {}
      };

      const emptySpecPath = path.join(tempDir, 'empty-spec.json');
      await fs.writeFile(emptySpecPath, JSON.stringify(emptySpec));

      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'empty-tests')
      };

      const result = await generator.generateFromFile(emptySpecPath, options);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No operations found in OpenAPI specification');
    });
  });

  describe('Performance', () => {
    test('should handle large specifications efficiently', async () => {
      // Create a larger spec with many operations
      const largeSpec = {
        openapi: '3.0.0',
        info: { title: 'Large API', version: '1.0.0' },
        security: [{ 'bearerAuth': [] }],
        components: {
          securitySchemes: {
            'bearerAuth': { type: 'http', scheme: 'bearer' }
          }
        },
        paths: {}
      };

      // Add 20 endpoints with multiple operations each
      for (let i = 1; i <= 20; i++) {
        largeSpec.paths[`/resource${i}`] = {
          get: {
            responses: { '200': { description: 'Success' } }
          },
          post: {
            responses: { '201': { description: 'Created' } }
          },
          put: {
            responses: { '200': { description: 'Updated' } }
          },
          delete: {
            responses: { '204': { description: 'Deleted' } }
          }
        };
      }

      const largeSpecPath = path.join(tempDir, 'large-spec.json');
      await fs.writeFile(largeSpecPath, JSON.stringify(largeSpec));

      const startTime = performance.now();

      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: path.join(tempDir, 'large-tests'),
        dryRun: true
      };

      const result = await generator.generateFromFile(largeSpecPath, options);
      
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.summary.totalOperations).toBe(80); // 20 resources × 4 operations
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});