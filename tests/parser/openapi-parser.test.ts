/**
 * OpenAPI Parser Tests
 * Week 1 Sprint 2: Comprehensive parser testing with real OpenAPI specs
 */

import { OpenAPIParser } from '../../src/parser/openapi-parser';
import { ParsingError, OpenAPISpec } from '../../src/types';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('OpenAPI Parser', () => {
  let parser: OpenAPIParser;
  const fixturesDir = path.join(__dirname, '../fixtures');
  const petstoreFixture = path.join(fixturesDir, 'petstore-openapi.json');
  const invalidFixture = path.join(fixturesDir, 'invalid-openapi.json');

  beforeEach(() => {
    parser = new OpenAPIParser();
  });

  describe('File Parsing', () => {
    test('should successfully parse valid OpenAPI JSON file', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.spec).toBeDefined();
      expect(result.metadata.parseTime).toBeGreaterThan(0);
      expect(result.metadata.version).toBe('3.0.3');
      expect(result.metadata.title).toBe('Swagger Petstore - OpenAPI 3.0');
    });

    test('should fail for non-existent file', async () => {
      const result = await parser.parseFromFile('/non/existent/file.json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should parse and validate spec structure', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.spec?.openapi).toBe('3.0.3');
      expect(result.spec?.info.title).toBe('Swagger Petstore - OpenAPI 3.0');
      expect(result.spec?.paths).toBeDefined();
      expect(Object.keys(result.spec?.paths || {})).toHaveLength(3);
    });

    test('should detect invalid OpenAPI spec', async () => {
      const result = await parser.parseFromFile(invalidFixture);

      expect(result.success).toBe(true); // Parsing succeeds
      expect(result.validation?.isValid).toBe(false); // But validation fails
      expect(result.validation?.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('version') })
      );
    });
  });

  describe('Content Parsing', () => {
    test('should parse JSON content', async () => {
      const jsonContent = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      });

      const spec = await parser.parseContent(jsonContent, 'test.json');

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Test API');
    });

    test('should parse YAML content', async () => {
      const yamlContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
      `;

      const spec = await parser.parseContent(yamlContent, 'test.yaml');

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Test API');
    });

    test('should detect invalid JSON', async () => {
      const invalidJson = '{ "openapi": "3.0.0", invalid }';

      await expect(parser.parseContent(invalidJson, 'test.json'))
        .rejects.toThrow(ParsingError);
    });

    test('should reject unsupported OpenAPI version', async () => {
      const unsupportedVersion = JSON.stringify({
        openapi: '2.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      });

      await expect(parser.parseContent(unsupportedVersion))
        .rejects.toThrow('Unsupported OpenAPI version');
    });

    test('should handle missing required fields', async () => {
      const missingFields = JSON.stringify({
        openapi: '3.0.0'
        // Missing info and paths
      });

      await expect(parser.parseContent(missingFields))
        .rejects.toThrow(ParsingError);
    });
  });

  describe('Specification Enrichment', () => {
    test('should calculate metadata correctly', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.spec?.metadata.totalPaths).toBe(3);
      expect(result.spec?.metadata.totalOperations).toBe(4);
      expect(result.spec?.metadata.httpMethods.has('GET')).toBe(true);
      expect(result.spec?.metadata.httpMethods.has('POST')).toBe(true);
      expect(result.spec?.metadata.httpMethods.has('PUT')).toBe(true);
    });

    test('should extract tags correctly', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.spec?.metadata.tags.has('pet')).toBe(true);
      expect(result.spec?.metadata.tags.size).toBeGreaterThan(0);
    });

    test('should identify security schemes', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.spec?.metadata.security.has('petstore_auth')).toBe(true);
      expect(result.spec?.metadata.security.has('api_key')).toBe(true);
    });

    test('should extract schema names', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.spec?.metadata.schemas.has('Pet')).toBe(true);
      expect(result.spec?.metadata.schemas.has('User')).toBe(true);
      expect(result.spec?.metadata.schemas.has('Order')).toBe(true);
    });
  });

  describe('Operations Extraction', () => {
    test('should extract all operations', async () => {
      const result = await parser.parseFromFile(petstoreFixture);
      expect(result.success).toBe(true);

      const operations = await parser.extractOperations(result.spec!);

      expect(operations).toHaveLength(4);
      expect(operations.map(op => `${op.method} ${op.path}`)).toEqual([
        'PUT /pet',
        'POST /pet', 
        'GET /pet/findByStatus',
        'GET /pet/{petId}'
      ]);
    });

    test('should include operation details', async () => {
      const result = await parser.parseFromFile(petstoreFixture);
      expect(result.success).toBe(true);

      const operations = await parser.extractOperations(result.spec!);
      const getPetById = operations.find(op => op.operation.operationId === 'getPetById');

      expect(getPetById).toBeDefined();
      expect(getPetById?.method).toBe('GET');
      expect(getPetById?.path).toBe('/pet/{petId}');
      expect(getPetById?.operation.summary).toBe('Find pet by ID');
      expect(getPetById?.operation.parameters).toHaveLength(1);
    });

    test('should handle specs with no paths', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Empty', version: '1.0.0' },
        paths: {},
        metadata: {
          totalPaths: 0,
          totalOperations: 0,
          httpMethods: new Set(),
          tags: new Set(),
          security: new Set(),
          schemas: new Set()
        }
      };

      const operations = await parser.extractOperations(spec);
      expect(operations).toHaveLength(0);
    });
  });

  describe('Server URL Extraction', () => {
    test('should extract server URLs', async () => {
      const result = await parser.parseFromFile(petstoreFixture);
      expect(result.success).toBe(true);

      const urls = parser.getServerUrls(result.spec!);
      
      expect(urls).toContain('https://petstore3.swagger.io/api/v3');
    });

    test('should return localhost for specs without servers', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'No Servers', version: '1.0.0' },
        paths: {}
      };

      const urls = parser.getServerUrls(spec);
      expect(urls).toEqual(['http://localhost']);
    });

    test('should handle empty servers array', async () => {
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Empty Servers', version: '1.0.0' },
        paths: {},
        servers: []
      };

      const urls = parser.getServerUrls(spec);
      expect(urls).toEqual(['http://localhost']);
    });
  });

  describe('Validation Integration', () => {
    test('should include validation results in parsing result', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.validation?.isValid).toBe(true);
      expect(result.validation?.score).toBeGreaterThan(80);
    });

    test('should detect validation errors', async () => {
      const result = await parser.parseFromFile(invalidFixture);

      expect(result.success).toBe(true);
      expect(result.validation?.isValid).toBe(false);
      expect(result.validation?.errors).toHaveLength(1); // Missing version
    });

    test('should include warnings in validation', async () => {
      // Create a spec that will trigger warnings
      const specWithWarnings = {
        openapi: '3.0.0',
        info: { 
          title: 'Test API', 
          version: '1.0.0'
          // Missing description - should trigger warning
        },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': { description: 'Success' }
              }
              // Missing operationId, summary - should trigger warnings
            }
          }
        }
      };

      const tempFile = path.join(fixturesDir, 'temp-warnings.json');
      await fs.writeFile(tempFile, JSON.stringify(specWithWarnings));

      try {
        const result = await parser.parseFromFile(tempFile);
        
        expect(result.success).toBe(true);
        expect(result.validation?.warnings).toBeDefined();
        expect(result.validation?.warnings.length).toBeGreaterThan(0);
      } finally {
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });

  describe('Performance', () => {
    test('should parse large spec within time limit', async () => {
      const startTime = performance.now();
      const result = await parser.parseFromFile(petstoreFixture);
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Should parse in under 500ms
    });

    test('should include performance metrics', async () => {
      const result = await parser.parseFromFile(petstoreFixture);

      expect(result.success).toBe(true);
      expect(result.metadata.parseTime).toBeGreaterThan(0);
      expect(result.metadata.parseTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{ "openapi": "3.0.0", "info": { "title": }';
      
      await expect(parser.parseContent(malformedJson))
        .rejects.toThrow(ParsingError);
    });

    test('should handle file system errors', async () => {
      const result = await parser.parseFromFile('/root/restricted-file.json');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should provide helpful error messages', async () => {
      const invalidSpec = JSON.stringify({
        swagger: '2.0', // Wrong field name
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      });

      await expect(parser.parseContent(invalidSpec))
        .rejects.toThrow('Missing required "openapi" field');
    });
  });
});