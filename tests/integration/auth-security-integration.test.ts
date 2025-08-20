/**
 * Authentication & Security Integration Tests
 * Week 3 Sprint 1: End-to-end testing of authentication and security features
 */

import { CLI } from '../../src/cli';
import { CredentialManager } from '../../src/auth/credential-manager';
import { SecurityValidator } from '../../src/auth/security-validator';
import { AuthProviderFactory } from '../../src/auth/auth-provider';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Authentication & Security Integration', () => {
  let cli: CLI;
  let tempDir: string;
  let specPath: string;

  beforeEach(async () => {
    cli = new CLI();
    tempDir = path.join(os.tmpdir(), 'auth-security-integration-' + Date.now());
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
        }
      },
      paths: {
        '/users': {
          get: {
            security: [{ 'bearerAuth': [] }],
            responses: {
              '200': { 
                description: 'Success',
                headers: {
                  'X-RateLimit-Limit': { description: 'Rate limit' }
                }
              },
              '401': { description: 'Unauthorized' }
            }
          },
          post: {
            security: [{ 'bearerAuth': [] }],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' }
                    }
                  }
                }
              }
            },
            responses: {
              '201': { description: 'Created' },
              '400': { description: 'Bad Request' }
            }
          }
        },
        '/admin/users/{id}': {
          delete: {
            security: [{ 'bearerAuth': [] }],
            parameters: [{
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }],
            responses: {
              '204': { description: 'Deleted' },
              '403': { description: 'Forbidden' },
              '404': { description: 'Not Found' }
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

  describe('CLI Authentication Commands', () => {
    test('should create and manage authentication profiles', async () => {
      // Add a bearer token profile
      const addResult = await cli.run([
        'auth', 'add', 'test-profile',
        '--type', 'bearer',
        '--token', 'test-token-12345',
        '--description', 'Test profile for integration testing'
      ]);

      expect(addResult.success).toBe(true);
      expect(addResult.message).toContain('Profile "test-profile" created');

      // List profiles
      const listResult = await cli.run(['auth', 'list']);
      expect(listResult.success).toBe(true);

      // Set as default
      const defaultResult = await cli.run(['auth', 'default', 'test-profile']);
      expect(defaultResult.success).toBe(true);

      // Test authentication
      const testResult = await cli.run(['auth', 'test', 'test-profile']);
      expect(testResult.success).toBe(true);
    });

    test('should handle OAuth2 profile creation', async () => {
      const result = await cli.run([
        'auth', 'add', 'oauth-profile',
        '--type', 'oauth2',
        '--client-id', 'test-client-id',
        '--client-secret', 'test-client-secret',
        '--token-url', 'https://oauth.example.com/token',
        '--scope', 'read write'
      ]);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Profile "oauth-profile" created');
    });

    test('should validate profile requirements', async () => {
      // Try to create bearer profile without token
      const result = await cli.run([
        'auth', 'add', 'invalid-profile',
        '--type', 'bearer'
        // Missing --token
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Bearer token is required');
    });
  });

  describe('CLI Security Commands', () => {
    test('should validate API security', async () => {
      const result = await cli.run(['security', 'validate', specPath]);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.securityScore).toBeGreaterThan(80); // Should have high score
    });

    test('should validate API security with JSON output', async () => {
      const result = await cli.run(['security', 'validate', specPath, '--json']);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.isSecure).toBe(true);
    });

    test('should generate security test cases', async () => {
      const outputDir = path.join(tempDir, 'security-tests');
      
      const result = await cli.run([
        'security', 'generate-tests', specPath,
        '--output', outputDir,
        '--framework', 'jest'
      ]);

      expect(result.success).toBe(true);
      expect(result.data.filesGenerated).toBeGreaterThan(0);
      expect(result.data.testsGenerated).toBeGreaterThan(0);

      // Check that files were actually created
      const files = await fs.readdir(outputDir);
      expect(files.length).toBeGreaterThan(0);
      expect(files.some(f => f.includes('security-') && f.endsWith('.test.ts'))).toBe(true);
    });

    test('should perform comprehensive security scan', async () => {
      const result = await cli.run(['security', 'scan', specPath]);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.score).toBeGreaterThan(70);
      expect(result.data.testCasesGenerated).toBeGreaterThan(0);
      expect(result.data.summary).toBeDefined();
    });

    test('should filter security scan by severity', async () => {
      const result = await cli.run(['security', 'scan', specPath, '--severity', 'high']);

      expect(result.success).toBe(true);
      expect(result.data.vulnerabilities.every(v => ['high', 'critical'].includes(v.type))).toBe(true);
    });
  });

  describe('Authentication Provider Integration', () => {
    test('should work with different authentication types', async () => {
      // Test Bearer Token
      const bearerProvider = AuthProviderFactory.create({ type: 'bearer' });
      const bearerResult = await bearerProvider.authenticate({ token: 'test-token' });
      expect(bearerResult.success).toBe(true);
      expect(bearerResult.headers.Authorization).toBe('Bearer test-token');

      // Test API Key
      const apiKeyProvider = AuthProviderFactory.create({ 
        type: 'apikey',
        location: 'header',
        name: 'X-API-Key' 
      });
      const apiKeyResult = await apiKeyProvider.authenticate({ apiKey: 'test-key' });
      expect(apiKeyResult.success).toBe(true);
      expect(apiKeyResult.headers['X-API-Key']).toBe('test-key');

      // Test OAuth2
      const oauthProvider = AuthProviderFactory.create({ 
        type: 'oauth2',
        tokenUrl: 'https://oauth.example.com/token'
      });
      const oauthResult = await oauthProvider.authenticate({
        clientId: 'client',
        clientSecret: 'secret'
      });
      expect(oauthResult.success).toBe(true);
      expect(oauthResult.headers.Authorization).toMatch(/^Bearer mock-oauth2-token-\d+$/);
    });
  });

  describe('Security Validator Integration', () => {
    test('should work with credential manager', async () => {
      const validator = new SecurityValidator();
      const credManager = new CredentialManager();

      // Test Bearer token validation
      const bearerValidation = await validator.validateAuthConfig({ type: 'bearer' });
      expect(bearerValidation.isSecure).toBe(true);

      // Test API key in query validation (should flag as insecure)
      const queryKeyValidation = await validator.validateAuthConfig({
        type: 'apikey',
        location: 'query'
      });
      expect(queryKeyValidation.isSecure).toBe(false);
      expect(queryKeyValidation.vulnerabilities.some(v => v.cwe === 'CWE-598')).toBe(true);
    });
  });

  describe('End-to-End Security Workflow', () => {
    test('should complete full security testing workflow', async () => {
      // 1. Create authentication profile
      const authResult = await cli.run([
        'auth', 'add', 'e2e-profile',
        '--type', 'bearer',
        '--token', 'e2e-test-token',
        '--default'
      ]);
      expect(authResult.success).toBe(true);

      // 2. Validate API security
      const validationResult = await cli.run(['security', 'validate', specPath]);
      expect(validationResult.success).toBe(true);

      // 3. Generate security tests
      const testGenResult = await cli.run([
        'security', 'generate-tests', specPath,
        '--output', path.join(tempDir, 'generated-security-tests')
      ]);
      expect(testGenResult.success).toBe(true);

      // 4. Perform comprehensive scan
      const scanResult = await cli.run(['security', 'scan', specPath, '--verbose']);
      expect(scanResult.success).toBe(true);

      // 5. Export authentication profile for backup
      const exportPath = path.join(tempDir, 'auth-backup.json');
      const exportResult = await cli.run(['auth', 'export', exportPath]);
      expect(exportResult.success).toBe(true);

      // Verify exported file exists
      const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(exportExists).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid OpenAPI specifications', async () => {
      const invalidSpecPath = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidSpecPath, '{ invalid json }');

      const result = await cli.run(['security', 'validate', invalidSpecPath]);
      expect(result.success).toBe(false);
    });

    test('should handle non-existent files gracefully', async () => {
      const result = await cli.run(['security', 'validate', '/non/existent/spec.json']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should handle authentication profile conflicts', async () => {
      // Create profile
      const create1 = await cli.run([
        'auth', 'add', 'conflict-test',
        '--type', 'bearer',
        '--token', 'token1'
      ]);
      expect(create1.success).toBe(true);

      // Try to create same profile name (should update)
      const create2 = await cli.run([
        'auth', 'add', 'conflict-test',
        '--type', 'apikey',
        '--api-key', 'key1'
      ]);
      expect(create2.success).toBe(true);

      // Verify profile was updated
      const testResult = await cli.run(['auth', 'test', 'conflict-test']);
      expect(testResult.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle security validation within reasonable time', async () => {
      const startTime = performance.now();
      
      const result = await cli.run(['security', 'validate', specPath]);
      
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle security test generation efficiently', async () => {
      const startTime = performance.now();
      
      const result = await cli.run([
        'security', 'generate-tests', specPath,
        '--output', path.join(tempDir, 'perf-test')
      ]);
      
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});