# Hyper-Focused MVP: OpenAPI → TypeScript/Jest

## Why Gemini is Absolutely Right

**Complete agreement.** The corrected MVP plan is far superior for these reasons:

### ✅ **Ecosystem Alignment**
- Team already uses TypeScript/Node.js
- No Python/pytest context switching
- Direct integration with existing `package.json` workflows
- Native CI/CD pipeline support

### ✅ **Zero Friction Adoption**
- Developers stay in familiar TypeScript environment
- Generated tests look like code they already write
- Easy to debug, modify, and maintain generated tests
- Lower learning curve = higher adoption

### ✅ **Implementation Efficiency**
- Tool written in TypeScript generates TypeScript
- Shared utilities and type definitions
- Single build/deployment pipeline
- Team expertise applies to both tool and output

## Refined MVP Scope

### What We're Building (4 weeks)
```
┌─────────────────────────────────────────────┐
│              api-test-gen CLI               │
│              (TypeScript)                   │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ OpenAPI     │  │ Jest/TypeScript         │ │
│  │ Parser      │→ │ Test Generator          │ │
│  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Single Target
- **Input**: OpenAPI 3.0/3.1 specs only
- **Output**: TypeScript Jest tests with supertest
- **Focus**: Solve the 3 core challenges perfectly

### Strictly Excluded from MVP
- ❌ GraphQL support (v1.1)
- ❌ gRPC support (v1.2)
- ❌ Python/pytest output (v1.1)
- ❌ Multiple output formats
- ❌ Plugin architecture

## Core Implementation

### 1. CLI Tool (TypeScript)
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { generateTests } from './generator';
import chalk from 'chalk';

const program = new Command();

program
  .name('api-test-gen')
  .description('Generate TypeScript Jest tests from OpenAPI specs')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate tests from OpenAPI specification')
  .argument('<spec>', 'OpenAPI specification file')
  .option('-o, --output <dir>', 'Output directory', './tests')
  .option('-c, --config <file>', 'Configuration file')
  .action(async (spec, options) => {
    try {
      const result = await generateTests(spec, options);
      console.log(chalk.green(`✅ Generated ${result.testCount} tests in ${result.duration}ms`));
      console.log(chalk.blue(`📁 Output: ${result.outputPath}`));
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow(`⚠️  ${result.warnings.length} warnings:`));
        result.warnings.forEach(w => console.log(chalk.yellow(`   • ${w}`)));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Generation failed: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
```

### 2. Test Generation (Core Logic)
```typescript
// src/generator.ts
import { OpenAPIV3 } from 'openapi-types';
import { parseOpenAPI } from './parser';
import { DataGenerator } from './data-generator';
import { TestBuilder } from './test-builder';

export interface GenerationResult {
  testCount: number;
  outputPath: string;
  duration: number;
  warnings: string[];
}

export async function generateTests(
  specPath: string, 
  options: GenerationOptions
): Promise<GenerationResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  // Parse OpenAPI spec
  const spec = await parseOpenAPI(specPath);
  
  // Generate test data
  const dataGenerator = new DataGenerator();
  const testBuilder = new TestBuilder(options);
  
  const testSuites: TestSuite[] = [];
  
  // Process each path/operation
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;
      
      try {
        // Generate test data for this operation
        const testData = dataGenerator.generateForOperation(operation as OpenAPIV3.OperationObject);
        
        // Build test cases
        const testCases = testBuilder.buildTestCases(path, method, operation, testData);
        
        testSuites.push({
          path,
          method, 
          testCases
        });
        
      } catch (error) {
        warnings.push(`Skipped ${method.toUpperCase()} ${path}: ${error.message}`);
      }
    }
  }
  
  // Generate TypeScript test files
  const outputPath = await writeTestFiles(testSuites, options.output);
  
  return {
    testCount: testSuites.reduce((sum, suite) => sum + suite.testCases.length, 0),
    outputPath,
    duration: Date.now() - startTime,
    warnings
  };
}
```

### 3. Data Generation (Solving Challenge #1)
```typescript
// src/data-generator.ts
import { OpenAPIV3 } from 'openapi-types';
import { faker } from '@faker-js/faker';

export class DataGenerator {
  generateForOperation(operation: OpenAPIV3.OperationObject): TestDataSet {
    const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
    
    if (!requestBody) {
      return { valid: null, invalid: [] };
    }
    
    const jsonContent = requestBody.content?.['application/json'];
    if (!jsonContent) {
      return { valid: null, invalid: [] };
    }
    
    // Strategy 1: Use example if available (highest priority)
    if (jsonContent.example) {
      return {
        valid: jsonContent.example,
        invalid: this.generateInvalidVariants(jsonContent.example, jsonContent.schema)
      };
    }
    
    // Strategy 2: Use examples if available
    if (jsonContent.examples) {
      const firstExample = Object.values(jsonContent.examples)[0];
      const exampleValue = 'value' in firstExample ? firstExample.value : firstExample;
      return {
        valid: exampleValue,
        invalid: this.generateInvalidVariants(exampleValue, jsonContent.schema)
      };
    }
    
    // Strategy 3: Generate from schema
    if (jsonContent.schema) {
      const validData = this.generateFromSchema(jsonContent.schema as OpenAPIV3.SchemaObject);
      return {
        valid: validData,
        invalid: this.generateInvalidVariants(validData, jsonContent.schema)
      };
    }
    
    return { valid: null, invalid: [] };
  }
  
  private generateFromSchema(schema: OpenAPIV3.SchemaObject): any {
    switch (schema.type) {
      case 'object':
        return this.generateObject(schema);
      case 'string':
        return this.generateString(schema);
      case 'integer':
        return this.generateInteger(schema);
      case 'number':
        return this.generateNumber(schema);
      case 'boolean':
        return schema.default ?? true;
      case 'array':
        return this.generateArray(schema);
      default:
        return null;
    }
  }
  
  private generateString(schema: OpenAPIV3.SchemaObject): string {
    // Use format-aware generation
    switch (schema.format) {
      case 'email': return faker.internet.email();
      case 'date': return faker.date.recent().toISOString().split('T')[0];
      case 'date-time': return faker.date.recent().toISOString();
      case 'uri': return faker.internet.url();
      case 'uuid': return faker.string.uuid();
      default:
        if (schema.enum) return schema.enum[0];
        return schema.default || faker.lorem.word();
    }
  }
  
  private generateObject(schema: OpenAPIV3.SchemaObject): any {
    const obj: any = {};
    
    // Generate required properties
    for (const propName of schema.required || []) {
      const propSchema = schema.properties?.[propName] as OpenAPIV3.SchemaObject;
      if (propSchema) {
        obj[propName] = this.generateFromSchema(propSchema);
      }
    }
    
    return obj;
  }
  
  private generateInvalidVariants(validData: any, schema: any): any[] {
    const variants = [];
    
    if (typeof validData === 'object' && validData !== null) {
      // Missing required field variant
      const requiredFields = schema?.required || [];
      if (requiredFields.length > 0) {
        const invalidData = { ...validData };
        delete invalidData[requiredFields[0]];
        variants.push({
          data: invalidData,
          description: `Missing required field: ${requiredFields[0]}`,
          expectedStatus: 400
        });
      }
      
      // Wrong type variant
      const firstKey = Object.keys(validData)[0];
      if (firstKey && typeof validData[firstKey] === 'string') {
        variants.push({
          data: { ...validData, [firstKey]: 12345 },
          description: `Wrong type for field: ${firstKey}`,
          expectedStatus: 400
        });
      }
    }
    
    return variants;
  }
}
```

### 4. Generated Test Output
```typescript
// Generated: tests/users.test.ts
import request from 'supertest';
import { app } from '../src/app'; // User configures this

describe('Users API', () => {
  const authHeaders = {
    Authorization: `Bearer ${process.env.API_TOKEN || 'test-token'}`
  };

  describe('GET /users', () => {
    it('should return list of users', async () => {
      const response = await request(app)
        .get('/users')
        .set(authHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/users')
        .set(authHeaders)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = {
        email: 'john.doe@example.com',
        age: 30
        // name is missing
      };

      await request(app)
        .post('/users')
        .set(authHeaders)
        .send(invalidData)
        .expect(400);
    });
  });
});
```

## Implementation Timeline (4 weeks)

### Week 1: Foundation
- TypeScript CLI with Commander.js
- OpenAPI parser using existing libraries
- Basic test file generation

### Week 2: Data Generation
- Example-based data generation
- Schema-based fallback generation
- Invalid data variant generation

### Week 3: Auth + Error Handling
- Environment variable auth injection
- Graceful error handling for broken specs
- TODO test generation for skipped endpoints

### Week 4: Polish + Testing
- End-to-end testing with real OpenAPI specs
- Documentation and examples
- NPM package preparation

## No Disagreements, But Identifying Challenges

### Challenge Points

#### 1. **Supertest vs Axios Decision**
```typescript
// Option A: Supertest (testing Express apps)
const response = await request(app).get('/users');

// Option B: Axios (testing external APIs)  
const response = await axios.get('http://localhost:3000/users');
```
**Decision**: Start with Axios for external API testing (more common use case)

#### 2. **App Import Configuration**
Generated tests need to know how to import the app:
```typescript
// This needs to be configurable
import { app } from '../src/app';
```
**Solution**: Configuration file specifies app import path

#### 3. **Type Definitions for Responses**
Should we generate TypeScript interfaces for API responses?
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}
```
**MVP Decision**: Skip interface generation (v1.1 feature)

#### 4. **Test Environment Setup**
Generated tests assume certain environment setup:
- Express app available
- Database in test state
- Environment variables set

**Solution**: Generate README with setup instructions

## Configuration Example
```yaml
# api-test-gen.config.yml
app_import: "../src/app"          # How to import Express app
base_url: "http://localhost:3000" # For external API testing
client_type: "supertest"          # supertest | axios
auth:
  type: "bearer"
  token_env: "API_TOKEN"
output:
  directory: "./tests"
  file_naming: "kebab-case"       # users.test.ts vs user.test.ts
```

## Success Metrics (Week 4)
- ✅ Generate working Jest tests from Petstore OpenAPI spec
- ✅ Tests run and pass against live API
- ✅ Handle 10+ real-world OpenAPI specs
- ✅ 90%+ developer satisfaction in beta testing

**This hyper-focused approach dramatically increases our chances of success by solving one problem exceptionally well.**

---

**Ready to build this focused MVP and validate core value before expanding scope.**