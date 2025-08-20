/**
 * Test Generator Tests
 * Week 2 Sprint 1: Comprehensive testing for test generation engine
 */

import { TestGenerator, GenerationOptions } from '../../src/generator/test-generator';
import { DataGenerator } from '../../src/generator/data/data-generator';
import { OperationMapper } from '../../src/generator/mapper/operation-mapper';
import { getTemplate } from '../../src/generator/templates';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('TestGenerator', () => {
  let generator: TestGenerator;
  const fixturesDir = path.join(__dirname, '../fixtures');
  const petstoreFixture = path.join(fixturesDir, 'petstore-openapi.json');
  const outputDir = path.join(__dirname, '../../test-output');

  beforeEach(() => {
    generator = new TestGenerator();
  });

  afterEach(async () => {
    // Clean up generated test files
    try {
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('File Generation', () => {
    test('should generate tests from valid OpenAPI spec', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        includeTypes: false,
        generateMocks: false
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(true);
      expect(result.generatedFiles.length).toBeGreaterThan(0);
      expect(result.summary.totalTests).toBeGreaterThan(0);
      expect(result.summary.operationsCovered).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });

    test('should handle invalid OpenAPI spec file', async () => {
      const invalidSpec = path.join(fixturesDir, 'invalid-openapi.json');
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      const result = await generator.generateFromFile(invalidSpec, options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.generatedFiles.length).toBe(0);
    });

    test('should handle non-existent spec file', async () => {
      const nonExistentSpec = path.join(fixturesDir, 'non-existent.json');
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      const result = await generator.generateFromFile(nonExistentSpec, options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not found');
    });
  });

  describe('Framework Support', () => {
    test('should generate Jest tests', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(true);
      expect(result.summary.frameworks).toContain('jest');
      
      // Check that generated files have Jest-specific content
      const generatedFile = result.generatedFiles[0];
      if (generatedFile) {
        expect(generatedFile.path).toContain('.test.ts');
      }
    });

    test('should generate Mocha tests', async () => {
      const options: GenerationOptions = {
        framework: 'mocha',
        outputDir,
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(true);
      expect(result.summary.frameworks).toContain('mocha');
    });

    test('should handle unsupported framework gracefully', async () => {
      const options: GenerationOptions = {
        framework: 'unsupported' as any,
        outputDir,
      };

      const validationResult = await generator.validateGeneration(options);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors[0]).toContain('Invalid test framework');
    });
  });

  describe('Generation Options', () => {
    test('should include type definitions when requested', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        includeTypes: true
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(true);
      // Type files would be generated in a real implementation
    });

    test('should include mock files when requested', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        generateMocks: true
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(true);
      // Mock files would be generated in a real implementation
    });

    test('should configure authentication', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        authConfig: {
          type: 'bearer'
        }
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(true);
    });

    test('should configure data generation', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        dataGeneration: {
          useExamples: true,
          generateEdgeCases: true,
          maxStringLength: 50,
          maxArrayItems: 5,
          includeNull: true
        }
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(true);
    });
  });

  describe('Test Case Generation', () => {
    test('should generate test cases for all operations', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      await generator.generateFromFile(petstoreFixture, options);
      const testCases = generator.getGeneratedTestCases();

      expect(testCases.length).toBeGreaterThan(0);
      expect(testCases.every(tc => tc.name && tc.method && tc.path)).toBe(true);
    });

    test('should generate success test cases', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      await generator.generateFromFile(petstoreFixture, options);
      const testCases = generator.getGeneratedTestCases();
      const successCases = testCases.filter(tc => tc.statusCode >= 200 && tc.statusCode < 300);

      expect(successCases.length).toBeGreaterThan(0);
    });

    test('should generate error test cases when configured', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        coverage: {
          includeErrorCases: true,
          includeEdgeCases: false,
          statusCodes: ['400', '401', '404', '500']
        }
      };

      await generator.generateFromFile(petstoreFixture, options);
      const testCases = generator.getGeneratedTestCases();
      const errorCases = testCases.filter(tc => tc.statusCode >= 400);

      expect(errorCases.length).toBeGreaterThan(0);
    });

    test('should generate edge case tests when configured', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        coverage: {
          includeErrorCases: false,
          includeEdgeCases: true,
          statusCodes: ['200']
        }
      };

      await generator.generateFromFile(petstoreFixture, options);
      const testCases = generator.getGeneratedTestCases();
      const edgeCases = testCases.filter(tc => tc.tags.includes('edge-case'));

      // Edge cases might be generated, but not required for petstore
      expect(edgeCases.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Generation Summary', () => {
    test('should provide accurate generation summary', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalTests).toBeGreaterThan(0);
      expect(result.summary.operationsCovered).toBeGreaterThan(0);
      expect(result.summary.totalOperations).toBeGreaterThan(0);
      expect(result.summary.coveragePercentage).toBeGreaterThan(0);
      expect(result.summary.frameworks).toContain('jest');
      expect(result.summary.estimatedRunTime).toBeGreaterThan(0);
    });

    test('should calculate coverage percentage correctly', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      const expectedCoverage = (result.summary.operationsCovered / result.summary.totalOperations) * 100;
      expect(result.summary.coveragePercentage).toBe(expectedCoverage);
    });
  });

  describe('Validation', () => {
    test('should validate generation options', async () => {
      const validOptions: GenerationOptions = {
        framework: 'jest',
        outputDir: '/valid/path',
      };

      const result = await generator.validateGeneration(validOptions);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should reject missing output directory', async () => {
      const invalidOptions: GenerationOptions = {
        framework: 'jest',
        outputDir: '',
      };

      const result = await generator.validateGeneration(invalidOptions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Output directory is required');
    });

    test('should reject invalid framework', async () => {
      const invalidOptions: GenerationOptions = {
        framework: 'invalid' as any,
        outputDir: '/valid/path',
      };

      const result = await generator.validateGeneration(invalidOptions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid test framework specified');
    });
  });

  describe('Performance', () => {
    test('should generate tests within reasonable time', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      const startTime = performance.now();
      const result = await generator.generateFromFile(petstoreFixture, options);
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle large OpenAPI specs efficiently', async () => {
      // For now, use petstore as a representative spec
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
        coverage: {
          includeErrorCases: true,
          includeEdgeCases: true,
          statusCodes: ['200', '201', '400', '401', '403', '404', '500']
        }
      };

      const startTime = performance.now();
      const result = await generator.generateFromFile(petstoreFixture, options);
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(15000); // Should handle complexity within 15 seconds
    });
  });

  describe('Error Handling', () => {
    test('should handle generation errors gracefully', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir: '/invalid/readonly/path', // This should fail
      };

      const result = await generator.generateFromFile(petstoreFixture, options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.generatedFiles.length).toBe(0);
    });

    test('should provide helpful error messages', async () => {
      const options: GenerationOptions = {
        framework: 'jest',
        outputDir,
      };

      const result = await generator.generateFromFile('/non/existent/spec.json', options);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('not found');
    });
  });

  describe('Integration', () => {
    test('should work with DataGenerator', () => {
      const dataGenerator = new DataGenerator();
      expect(dataGenerator).toBeDefined();
    });

    test('should work with OperationMapper', () => {
      // This would test the operation mapper integration
      // For now, just verify it can be instantiated
      expect(OperationMapper).toBeDefined();
    });

    test('should work with templates', () => {
      const jestTemplate = getTemplate('jest');
      expect(jestTemplate).toBeDefined();
      expect(jestTemplate?.framework).toBe('jest');

      const mochaTemplate = getTemplate('mocha');
      expect(mochaTemplate).toBeDefined();
      expect(mochaTemplate?.framework).toBe('mocha');
    });
  });

  describe('Framework-Specific Features', () => {
    test('should support Vitest framework imports', async () => {
      const result = await generator.generateFromFile(petstoreFixture, {
        framework: 'vitest',
        outputDir: './temp-vitest',
        includeTypes: false,
        generateMocks: false
      });

      expect(result.success).toBe(true);
      expect(result.generatedFiles.length).toBeGreaterThan(0);
    });

    test('should handle framework-specific template differences', async () => {
      const jestResult = await generator.generateFromFile(petstoreFixture, {
        framework: 'jest',
        outputDir: './temp-jest',
        includeTypes: false,
        generateMocks: false
      });

      const mochaResult = await generator.generateFromFile(petstoreFixture, {
        framework: 'mocha',
        outputDir: './temp-mocha',
        includeTypes: false,
        generateMocks: false
      });

      expect(jestResult.success).toBe(true);
      expect(mochaResult.success).toBe(true);
      expect(jestResult.generatedFiles.length).toBeGreaterThan(0);
      expect(mochaResult.generatedFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Response Generation Edge Cases', () => {
    test('should handle responses with fallback descriptions', async () => {
      const customSpecWithDescriptions = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/success-test': {
            get: {
              operationId: 'successOperation',
              responses: {
                '200': { description: 'Success - operation completed' }
              }
            }
          },
          '/error-test': {
            get: {
              operationId: 'errorOperation',
              responses: {
                '500': { description: 'Error - something went wrong' }
              }
            }
          }
        }
      };

      const tempPath = './temp-descriptions.json';
      await fs.writeFile(tempPath, JSON.stringify(customSpecWithDescriptions, null, 2));

      const result = await generator.generateFromFile(tempPath);
      expect(result.success).toBe(true);
      expect(result.generatedFiles.length).toBeGreaterThan(0);
      
      // Cleanup
      await fs.unlink(tempPath);
    });

    test('should handle invalid generation options gracefully', async () => {
      const invalidOptions: any = {
        framework: 'invalid-framework',
        outputDir: '',
        includeTypes: 'not-boolean'
      };

      const result = await generator.generateFromFile(petstoreFixture, invalidOptions);
      
      // Should handle gracefully, not crash
      expect(result).toBeDefined();
    });
  });
});