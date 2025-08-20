import { OpenAPISpec } from './parser';

export interface TestDataConfig {
  useRealistic: boolean;
  includeBoundaryValues: boolean;
  generateInvalidData: boolean;
}

export class SchemaAwareDataGenerator {
  private spec: OpenAPISpec;
  
  constructor(spec: OpenAPISpec) {
    this.spec = spec;
  }
  
  generateTestData(schemaRef: string | any, config: TestDataConfig = { useRealistic: true, includeBoundaryValues: false, generateInvalidData: false }): any {
    if (typeof schemaRef === 'string' && schemaRef.startsWith('#/')) {
      // Resolve schema reference
      const refPath = schemaRef.replace('#/', '').split('/');
      let schema = this.spec as any;
      
      for (const part of refPath) {
        schema = schema[part];
        if (!schema) {
          return this.generateFallbackData();
        }
      }
      
      return this.generateFromSchema(schema, config);
    } else if (typeof schemaRef === 'object') {
      return this.generateFromSchema(schemaRef, config);
    }
    
    return this.generateFallbackData();
  }
  
  private generateFromSchema(schema: any, config: TestDataConfig): any {
    if (!schema || !schema.type) {
      return this.generateFallbackData();
    }
    
    switch (schema.type) {
      case 'object':
        return this.generateObjectData(schema, config);
      case 'array':
        return this.generateArrayData(schema, config);
      case 'string':
        return this.generateStringData(schema, config);
      case 'integer':
      case 'number':
        return this.generateNumberData(schema, config);
      case 'boolean':
        return this.generateBooleanData(schema, config);
      default:
        return this.generateFallbackData();
    }
  }
  
  private generateObjectData(schema: any, config: TestDataConfig): any {
    const result: any = {};
    
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties as any)) {
        // Always include required properties, sometimes include optional ones
        const isRequired = schema.required?.includes(key);
        const shouldInclude = isRequired || Math.random() > 0.3;
        
        if (shouldInclude) {
          result[key] = this.generateFromSchema(propSchema, config);
        }
      }
    }
    
    return result;
  }
  
  private generateArrayData(schema: any, config: TestDataConfig): any[] {
    const minItems = schema.minItems || 1;
    const maxItems = schema.maxItems || 3;
    const length = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
    
    const result = [];
    for (let i = 0; i < length; i++) {
      if (schema.items) {
        result.push(this.generateFromSchema(schema.items, config));
      }
    }
    
    return result;
  }
  
  private generateStringData(schema: any, config: TestDataConfig): string {
    // Handle string formats
    if (schema.format) {
      switch (schema.format) {
        case 'email':
          return 'test@example.com';
        case 'uri':
        case 'url':
          return 'https://example.com';
        case 'uuid':
          return '12345678-1234-1234-1234-123456789012';
        case 'date':
          return '2023-12-25';
        case 'date-time':
          return '2023-12-25T10:30:00Z';
        case 'password':
          return 'SecurePass123!';
      }
    }
    
    // Handle enums
    if (schema.enum) {
      const randomIndex = Math.floor(Math.random() * schema.enum.length);
      return schema.enum[randomIndex];
    }
    
    // Handle string constraints
    const minLength = schema.minLength || 1;
    const maxLength = schema.maxLength || 50;
    
    // Generate realistic strings based on property names
    if (schema.example) {
      return schema.example;
    }
    
    // Default string patterns
    const patterns = [
      'Test String',
      'Sample Data',
      'Generated Value',
      'API Test Data'
    ];
    
    let result = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Adjust length if needed
    if (result.length < minLength) {
      result = result.padEnd(minLength, ' Extra');
    }
    if (result.length > maxLength) {
      result = result.substring(0, maxLength);
    }
    
    return result;
  }
  
  private generateNumberData(schema: any, config: TestDataConfig): number {
    const minimum = schema.minimum || 0;
    const maximum = schema.maximum || 1000;
    
    if (config.includeBoundaryValues && Math.random() < 0.3) {
      // Return boundary values occasionally
      return Math.random() < 0.5 ? minimum : maximum;
    }
    
    const isInteger = schema.type === 'integer';
    const value = Math.random() * (maximum - minimum) + minimum;
    
    return isInteger ? Math.floor(value) : Math.round(value * 100) / 100;
  }
  
  private generateBooleanData(schema: any, config: TestDataConfig): boolean {
    return Math.random() < 0.5;
  }
  
  private generateFallbackData(): any {
    // Fallback when schema parsing fails
    return {
      id: Math.floor(Math.random() * 1000),
      name: 'Generated Test Data',
      status: 'active',
      createdAt: new Date().toISOString()
    };
  }
  
  generateInvalidTestData(schemaRef: string | any): any {
    // Generate data that violates schema constraints for negative testing
    if (typeof schemaRef === 'string' && schemaRef.startsWith('#/')) {
      const refPath = schemaRef.replace('#/', '').split('/');
      let schema = this.spec as any;
      
      for (const part of refPath) {
        schema = schema[part];
        if (!schema) {
          return null;
        }
      }
      
      return this.generateInvalidFromSchema(schema);
    } else if (typeof schemaRef === 'object') {
      return this.generateInvalidFromSchema(schemaRef);
    }
    
    return null;
  }
  
  private generateInvalidFromSchema(schema: any): any {
    if (!schema || !schema.type) {
      return null;
    }
    
    switch (schema.type) {
      case 'object':
        // Missing required fields
        return {};
      case 'string':
        if (schema.minLength) {
          return ''; // Too short
        }
        if (schema.format === 'email') {
          return 'invalid-email'; // Invalid format
        }
        return null;
      case 'integer':
      case 'number':
        if (schema.minimum !== undefined) {
          return schema.minimum - 1; // Below minimum
        }
        return 'not-a-number';
      case 'boolean':
        return 'not-a-boolean';
      default:
        return null;
    }
  }
}