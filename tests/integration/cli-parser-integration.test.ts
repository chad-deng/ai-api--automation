/**
 * CLI Parser Integration Tests
 * Week 1 Sprint 2: Test CLI commands with real parsing and validation
 */

import { CLI } from '../../src/cli';
import * as path from 'path';

describe('CLI Parser Integration', () => {
  let cli: CLI;
  const fixturesDir = path.join(__dirname, '../fixtures');
  const petstoreFixture = path.join(fixturesDir, 'petstore-openapi.json');
  const invalidFixture = path.join(fixturesDir, 'invalid-openapi.json');

  beforeEach(() => {
    cli = new CLI();
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Generate Command with Parser', () => {
    test('should successfully parse OpenAPI spec for generation', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--verbose']);

      expect(result.success).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('📖 Parsing OpenAPI specification...')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Found 4 operations in 3 paths')
      );
    });

    test('should show parsed API information', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--verbose']);

      expect(result.success).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('HTTP methods: PUT, POST, GET')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Extracted 4 operations for test generation')
      );
    });

    test('should handle parsing errors gracefully', async () => {
      const nonExistentFile = path.join(fixturesDir, 'non-existent.json');
      const result = await cli.run(['generate', nonExistentFile]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should parse with different output directories', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--output', './custom-output']);

      expect(result.success).toBe(true);
      expect(result.data.outputDir).toBe('./custom-output');
    });

    test('should handle different test frameworks', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--framework', 'mocha']);

      expect(result.success).toBe(true);
      expect(result.data.framework).toBe('mocha');
    });

    test('should provide detailed generation results', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--verbose']);

      expect(result.success).toBe(true);
      expect(result.data.testsGenerated).toBe(4); // Number of operations
      expect(result.data.details).toEqual([
        'Parsed OpenAPI v3.0.3',
        'Found 4 testable operations',
        'API: Swagger Petstore - OpenAPI 3.0 v1.0.11'
      ]);
    });
  });

  describe('Validate Command with Validator', () => {
    test('should successfully validate valid OpenAPI spec', async () => {
      const result = await cli.run(['validate', petstoreFixture, '--verbose']);

      expect(result.success).toBe(true);
      expect(result.validationResults.isValid).toBe(true);
      expect(result.validationResults.score).toBeGreaterThan(90);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔍 Parsing OpenAPI specification...')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ OpenAPI specification is valid!')
      );
    });

    test('should detect validation errors in invalid spec', async () => {
      const result = await cli.run(['validate', invalidFixture]);

      expect(result.success).toBe(true);
      expect(result.validationResults.isValid).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ OpenAPI specification has issues:')
      );
    });

    test('should support schema-only validation', async () => {
      const result = await cli.run(['validate', petstoreFixture, '--schema-only']);

      expect(result.success).toBe(true);
      expect(result.schemaOnly).toBe(true);
    });

    test('should provide detailed validation results', async () => {
      const result = await cli.run(['validate', petstoreFixture, '--verbose']);

      expect(result.success).toBe(true);
      expect(result.validationResults.checks.schema).toBe(true);
      expect(result.validationResults.checks.paths).toBe(true);
      expect(result.validationResults.checks.operations).toBe(true);
      expect(result.validationResults.checks.responses).toBe(true);
      expect(result.validationResults.details?.pathCount).toBe(3);
      expect(result.validationResults.details?.operationCount).toBe(4);
    });

    test('should handle file not found errors', async () => {
      const result = await cli.run(['validate', '/non/existent/file.json']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should show validation score', async () => {
      const result = await cli.run(['validate', petstoreFixture]);

      expect(result.success).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Score:')
      );
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle malformed JSON files', async () => {
      const malformedFile = path.join(fixturesDir, 'malformed.json');
      
      // Create malformed JSON file
      const fs = require('fs');
      fs.writeFileSync(malformedFile, '{ "openapi": "3.0.0", invalid }');

      try {
        const result = await cli.run(['validate', malformedFile]);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('parse');
      } finally {
        // Clean up
        fs.unlinkSync(malformedFile);
      }
    });

    test('should provide helpful error suggestions', async () => {
      const result = await cli.run(['generate', '/non/existent/spec.json']);

      expect(result.success).toBe(false);
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('Please ensure the file exists');
    });

    test('should handle unsupported OpenAPI versions', async () => {
      const unsupportedFile = path.join(fixturesDir, 'unsupported-version.json');
      
      const fs = require('fs');
      fs.writeFileSync(unsupportedFile, JSON.stringify({
        openapi: '2.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {}
      }));

      try {
        const result = await cli.run(['validate', unsupportedFile]);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Unsupported OpenAPI version');
      } finally {
        fs.unlinkSync(unsupportedFile);
      }
    });
  });

  describe('Performance Integration', () => {
    test('should complete parsing and validation within time limits', async () => {
      const startTime = performance.now();
      
      const [generateResult, validateResult] = await Promise.all([
        cli.run(['generate', petstoreFixture]),
        cli.run(['validate', petstoreFixture])
      ]);

      const totalDuration = performance.now() - startTime;

      expect(generateResult.success).toBe(true);
      expect(validateResult.success).toBe(true);
      expect(totalDuration).toBeLessThan(2000); // Both operations should complete in under 2s
    });

    test('should report performance metrics', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--verbose']);

      expect(result.success).toBe(true);
      expect(result.data.duration).toBeGreaterThan(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Duration:')
      );
    });
  });

  describe('Configuration Integration', () => {
    test('should handle timeout configuration', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--timeout', '60000']);

      expect(result.success).toBe(true);
      // The timeout option should be passed to the generation options
    });

    test('should handle parallel execution option', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--parallel']);

      expect(result.success).toBe(true);
      // The parallel option should be passed through
    });

    test('should handle dry-run mode', async () => {
      const result = await cli.run(['generate', petstoreFixture, '--dry-run']);

      expect(result.success).toBe(true);
      // In dry-run mode, no files should be generated
      expect(result.data.filesGenerated).toBe(0);
    });
  });

  describe('Output Formatting Integration', () => {
    test('should format generation output correctly', async () => {
      const result = await cli.run(['generate', petstoreFixture]);

      expect(result.success).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Generation completed successfully!')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Tests created: 4')
      );
    });

    test('should format validation output correctly', async () => {
      const result = await cli.run(['validate', petstoreFixture]);

      expect(result.success).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ OpenAPI specification is valid!')
      );
    });

    test('should format error output correctly', async () => {
      const result = await cli.run(['validate', invalidFixture]);

      expect(result.success).toBe(true); // Command succeeds
      expect(result.validationResults.isValid).toBe(false); // But validation fails
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('❌ OpenAPI specification has issues:')
      );
    });
  });
});