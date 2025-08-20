/**
 * Data Generator Tests
 * Week 2 Sprint 1: Comprehensive testing for schema-based data generation
 */

import { DataGenerator, DataGenerationOptions } from '../../../src/generator/data/data-generator';
import { Schema } from '../../../src/types';

describe('DataGenerator', () => {
  let generator: DataGenerator;

  beforeEach(() => {
    generator = new DataGenerator({
      useExamples: true,
      generateEdgeCases: true,
      maxStringLength: 50,
      maxArrayItems: 5,
      seed: 12345 // Fixed seed for reproducible tests
    });
  });

  describe('Basic Data Generation', () => {
    test('should generate string values', async () => {
      const schema: Schema = { type: 'string' };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('string');
      expect(result.type).toBe('valid');
    });

    test('should generate number values', async () => {
      const schema: Schema = { type: 'number' };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('number');
      expect(result.type).toBe('valid');
    });

    test('should generate integer values', async () => {
      const schema: Schema = { type: 'integer' };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('number');
      expect(Number.isInteger(result.value)).toBe(true);
      expect(result.type).toBe('valid');
    });

    test('should generate boolean values', async () => {
      const schema: Schema = { type: 'boolean' };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('boolean');
      expect(result.type).toBe('valid');
    });

    test('should generate array values', async () => {
      const schema: Schema = { 
        type: 'array',
        items: { type: 'string' }
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBeDefined();
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.type).toBe('valid');
    });

    test('should generate object values', async () => {
      const schema: Schema = { 
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' }
        }
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('object');
      expect(result.value).not.toBeNull();
      expect(result.type).toBe('valid');
    });
  });

  describe('Schema Constraints', () => {
    test('should respect string length constraints', async () => {
      const schema: Schema = { 
        type: 'string',
        minLength: 5,
        maxLength: 10
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value.length).toBeGreaterThanOrEqual(5);
      expect(result.value.length).toBeLessThanOrEqual(10);
    });

    test('should respect number range constraints', async () => {
      const schema: Schema = { 
        type: 'number',
        minimum: 10,
        maximum: 100
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBeGreaterThanOrEqual(10);
      expect(result.value).toBeLessThanOrEqual(100);
    });

    test('should respect array size constraints', async () => {
      const schema: Schema = { 
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 4
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value.length).toBeGreaterThanOrEqual(2);
      expect(result.value.length).toBeLessThanOrEqual(4);
    });

    test('should handle enum values', async () => {
      const enumValues = ['red', 'green', 'blue'];
      const schema: Schema = { 
        type: 'string',
        enum: enumValues
      };
      const result = await generator.generateFromSchema(schema);

      expect(enumValues).toContain(result.value);
    });

    test('should handle pattern constraints', async () => {
      const schema: Schema = { 
        type: 'string',
        pattern: '^[a-zA-Z]+$',
        maxLength: 20
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toMatch(/^[a-zA-Z]+$/);
    });
  });

  describe('Format-Specific Generation', () => {
    test('should generate email format', async () => {
      const schema: Schema = { 
        type: 'string',
        format: 'email'
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toContain('@');
      expect(result.value).toMatch(/\w+@\w+\.\w+/);
    });

    test('should generate URI format', async () => {
      const schema: Schema = { 
        type: 'string',
        format: 'uri'
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toMatch(/^https?:\/\//);
    });

    test('should generate UUID format', async () => {
      const schema: Schema = { 
        type: 'string',
        format: 'uuid'
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should generate date format', async () => {
      const schema: Schema = { 
        type: 'string',
        format: 'date'
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should generate date-time format', async () => {
      const schema: Schema = { 
        type: 'string',
        format: 'date-time'
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Edge Case Generation', () => {
    test('should generate minimal values', async () => {
      const schema: Schema = { 
        type: 'string',
        minLength: 3,
        maxLength: 10
      };
      const result = await generator.generateFromSchema(schema, 'minimal');

      expect(result.value.length).toBe(3);
      expect(result.type).toBe('minimal');
    });

    test('should generate maximal values', async () => {
      const schema: Schema = { 
        type: 'string',
        minLength: 3,
        maxLength: 10
      };
      const result = await generator.generateFromSchema(schema, 'maximal');

      expect(result.value.length).toBe(10);
      expect(result.type).toBe('maximal');
    });

    test('should generate edge case values', async () => {
      const schema: Schema = { 
        type: 'number',
        minimum: 10,
        maximum: 100
      };
      const result = await generator.generateFromSchema(schema, 'edge');

      expect(result.value).toBe(10); // Edge case should be at boundary
      expect(result.type).toBe('edge');
    });

    test('should generate invalid values', async () => {
      const schema: Schema = { type: 'string' };
      const result = await generator.generateFromSchema(schema, 'invalid');

      expect(typeof result.value).not.toBe('string');
      expect(result.type).toBe('invalid');
    });
  });

  describe('Complex Schema Handling', () => {
    test('should handle nested objects', async () => {
      const schema: Schema = { 
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              contact: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        }
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value.user).toBeDefined();
      expect(result.value.user.name).toBeDefined();
      expect(result.value.user.contact).toBeDefined();
      expect(result.value.user.contact.email).toContain('@');
    });

    test('should handle required fields', async () => {
      const schema: Schema = { 
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          optional: { type: 'string' }
        }
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.value.name).toBeDefined();
      expect(result.value.email).toBeDefined();
      // optional field may or may not be present
    });

    test('should handle array of objects', async () => {
      const schema: Schema = { 
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        },
        minItems: 2,
        maxItems: 3
      };
      const result = await generator.generateFromSchema(schema);

      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value.length).toBeGreaterThanOrEqual(2);
      expect(result.value.length).toBeLessThanOrEqual(3);
      result.value.forEach((item: any) => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
      });
    });
  });

  describe('Batch Generation', () => {
    test('should generate multiple values', async () => {
      const schema: Schema = { type: 'string' };
      const results = await generator.generateBatch(schema, 5);

      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(typeof result.value).toBe('string');
        expect(result.type).toBe('valid');
      });
    });

    test('should generate mixed types in batch', async () => {
      const schema: Schema = { type: 'string' };
      const results = await generator.generateBatch(schema, 6, ['valid', 'invalid', 'edge']);

      expect(results.length).toBe(6);
      expect(results.filter(r => r.type === 'valid').length).toBe(2);
      expect(results.filter(r => r.type === 'invalid').length).toBe(2);
      expect(results.filter(r => r.type === 'edge').length).toBe(2);
    });
  });

  describe('Parameter Data Generation', () => {
    test('should generate parameter data', async () => {
      const parameter = {
        name: 'userId',
        in: 'path' as const,
        required: true,
        schema: { type: 'integer' as const }
      };

      const value = await generator.generateParameterData(parameter);

      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
    });

    test('should generate request body data', async () => {
      const requestBody = {
        content: {
          'application/json': {
            schema: {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const },
                age: { type: 'integer' as const }
              }
            }
          }
        }
      };

      const value = await generator.generateRequestBodyData(requestBody);

      expect(typeof value).toBe('object');
      expect(value).not.toBeNull();
    });
  });

  describe('Configuration and Options', () => {
    test('should respect generation options', () => {
      const options: DataGenerationOptions = {
        useExamples: false,
        generateEdgeCases: true,
        maxStringLength: 100,
        maxArrayItems: 20,
        includeNull: true,
        includeUndefined: true,
        maxObjectDepth: 10,
        seed: 54321
      };

      const customGenerator = new DataGenerator(options);
      const stats = customGenerator.getGenerationStatistics();

      expect(stats.currentOptions.maxStringLength).toBe(100);
      expect(stats.currentOptions.maxArrayItems).toBe(20);
      expect(stats.currentOptions.includeNull).toBe(true);
    });

    test('should use examples when available and enabled', async () => {
      const exampleValue = 'example-value';
      const schema: Schema = { 
        type: 'string',
        example: exampleValue
      };

      const generator = new DataGenerator({ useExamples: true });
      const result = await generator.generateFromSchema(schema);

      expect(result.value).toBe(exampleValue);
    });

    test('should ignore examples when disabled', async () => {
      const exampleValue = 'example-value';
      const schema: Schema = { 
        type: 'string',
        example: exampleValue
      };

      const generator = new DataGenerator({ useExamples: false });
      const result = await generator.generateFromSchema(schema);

      expect(result.value).not.toBe(exampleValue);
      expect(typeof result.value).toBe('string');
    });
  });

  describe('Metadata and Statistics', () => {
    test('should provide generation metadata', async () => {
      const schema: Schema = { 
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' }
        }
      };
      const result = await generator.generateFromSchema(schema);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.schema).toEqual(schema);
      expect(result.metadata.generationTime).toBeGreaterThan(0);
      expect(result.metadata.constraints).toBeDefined();
      expect(result.metadata.generatedFields).toBeDefined();
    });

    test('should track generation statistics', () => {
      const stats = generator.getGenerationStatistics();

      expect(stats.currentOptions).toBeDefined();
      expect(stats.generationStackSize).toBeDefined();
      expect(stats.maxDepthReached).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid schema gracefully', async () => {
      const invalidSchema = { type: 'invalid-type' } as any;
      
      // Should not throw, but might generate unknown type
      const result = await generator.generateFromSchema(invalidSchema);
      expect(result).toBeDefined();
    });

    test('should handle missing schema properties', async () => {
      const incompleteSchema = {} as Schema;
      
      const result = await generator.generateFromSchema(incompleteSchema);
      expect(result).toBeDefined();
    });

    test('should prevent infinite recursion', async () => {
      // Create a deeply nested schema that could cause recursion issues
      let deepSchema: Schema = { type: 'string' };
      
      for (let i = 0; i < 20; i++) {
        deepSchema = {
          type: 'object',
          properties: {
            nested: deepSchema
          }
        };
      }

      // Should complete without stack overflow
      const result = await generator.generateFromSchema(deepSchema);
      expect(result).toBeDefined();
    });
  });

  describe('Seed and Reproducibility', () => {
    test('should produce consistent results with same seed', async () => {
      const schema: Schema = { type: 'string', maxLength: 10 };
      
      const generator1 = new DataGenerator({ seed: 12345 });
      const generator2 = new DataGenerator({ seed: 12345 });
      
      const result1 = await generator1.generateFromSchema(schema);
      const result2 = await generator2.generateFromSchema(schema);
      
      expect(result1.value).toBe(result2.value);
    });

    test('should allow seed reset', async () => {
      const schema: Schema = { type: 'string' };
      
      const result1 = await generator.generateFromSchema(schema);
      generator.resetSeed(12345);
      const result2 = await generator.generateFromSchema(schema);
      generator.resetSeed(12345);
      const result3 = await generator.generateFromSchema(schema);
      
      expect(result2.value).toBe(result3.value);
    });
  });

  describe('Advanced Error Handling', () => {
    test('should handle data generation failures gracefully', async () => {
      // Force an error by mocking a failing method
      const badGenerator = new DataGenerator({ seed: 12345 });
      jest.spyOn(badGenerator as any, 'generateStringValue').mockImplementation(() => {
        throw new Error('Forced generation error');
      });
      
      const schema: Schema = { type: 'string' };
      await expect(badGenerator.generateFromSchema(schema)).rejects.toThrow('Data generation failed: Forced generation error');
    });

    test('should handle parameter with no schema', async () => {
      const parameterWithoutSchema: any = { name: 'test', in: 'query' };
      
      const result = await generator.generateParameterData(parameterWithoutSchema);
      expect(result).toBeNull();
    });

    test('should handle request body with no content', async () => {
      const requestBodyWithoutContent: any = { description: 'Empty request body' };
      
      const result = await generator.generateRequestBodyData(requestBodyWithoutContent);
      expect(result).toBeNull();
    });

    test('should handle request body with no schema for content type', async () => {
      const requestBodyWithoutSchema: any = {
        content: {
          'application/json': {
            example: { test: 'value' }
          }
        }
      };
      
      const result = await generator.generateRequestBodyData(requestBodyWithoutSchema);
      expect(result).toBeNull();
    });

    test('should handle missing content type in request body', async () => {
      const requestBody: any = {
        content: {
          'application/xml': {
            schema: { type: 'string' }
          }
        }
      };
      
      const result = await generator.generateRequestBodyData(requestBody, 'application/json');
      expect(result).toBeNull();
    });
  });

  describe('Additional Schema Coverage', () => {
    test('should handle schema with oneOf', async () => {
      const schema: Schema = {
        oneOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      };
      
      const result = await generator.generateFromSchema(schema);
      expect(result.value).toBeDefined();
      expect(['string', 'number']).toContain(typeof result.value);
    });

    test('should handle schema with allOf', async () => {
      const schema: Schema = {
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } } },
          { type: 'object', properties: { age: { type: 'number' } } }
        ]
      };
      
      const result = await generator.generateFromSchema(schema);
      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('object');
    });

    test('should handle schema with anyOf', async () => {
      const schema: Schema = {
        anyOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      };
      
      const result = await generator.generateFromSchema(schema);
      expect(result.value).toBeDefined();
      expect(['string', 'number']).toContain(typeof result.value);
    });

    test('should handle schema with multipleOf constraint', async () => {
      const schema: Schema = {
        type: 'number',
        multipleOf: 5,
        minimum: 10,
        maximum: 30
      };
      
      const result = await generator.generateFromSchema(schema);
      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('number');
      expect(result.value % 5).toBe(0);
      expect(result.value).toBeGreaterThanOrEqual(10);
      expect(result.value).toBeLessThanOrEqual(30);
    });

    test('should handle uniqueItems constraint in arrays', async () => {
      const schema: Schema = {
        type: 'array',
        items: { type: 'integer', minimum: 1, maximum: 5 },
        uniqueItems: true,
        minItems: 3
      };
      
      const result = await generator.generateFromSchema(schema);
      expect(result.value).toBeDefined();
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value.length).toBeGreaterThanOrEqual(3);
      
      // Check uniqueness
      const unique = [...new Set(result.value)];
      expect(unique.length).toBe(result.value.length);
    });

    test('should handle exclusiveMinimum and exclusiveMaximum', async () => {
      const schema: Schema = {
        type: 'number',
        exclusiveMinimum: 0,
        exclusiveMaximum: 10,
        minimum: 1,
        maximum: 9
      };
      
      const result = await generator.generateFromSchema(schema);
      expect(result.value).toBeDefined();
      expect(typeof result.value).toBe('number');
      expect(result.value).toBeGreaterThanOrEqual(1);
      expect(result.value).toBeLessThanOrEqual(9);
    });
  });
});