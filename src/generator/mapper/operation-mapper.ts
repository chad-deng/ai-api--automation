/**
 * Operation-to-Test Mapping Engine
 * Week 2 Sprint 1: Comprehensive operation mapping with request/response validation
 */

import {
  Operation,
  ParsedOpenAPI,
  Parameter,
  RequestBody,
  Response,
  Schema,
  PathItem
} from '../../types';

export interface MappedOperation {
  operation: Operation;
  testScenarios: TestScenario[];
  validationRules: ValidationRule[];
  dataRequirements: DataRequirement[];
  dependencies: string[];
}

export interface TestScenario {
  id: string;
  name: string;
  type: 'success' | 'error' | 'edge' | 'security' | 'performance';
  description: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  requestData: RequestDataTemplate;
  expectedResponse: ResponseTemplate;
  statusCode: number;
  assertions: AssertionTemplate[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'format' | 'range' | 'pattern' | 'enum';
  constraint: any;
  errorMessage: string;
}

export interface DataRequirement {
  parameter: string;
  location: 'path' | 'query' | 'header' | 'body';
  dataType: string;
  required: boolean;
  constraints: SchemaConstraints;
  examples: any[];
}

export interface SchemaConstraints {
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
}

export interface RequestDataTemplate {
  pathParams: Record<string, any>;
  queryParams: Record<string, any>;
  headers: Record<string, any>;
  body: any;
}

export interface ResponseTemplate {
  statusCode: number;
  headers: Record<string, any>;
  body: any;
  schema?: Schema;
}

export interface AssertionTemplate {
  type: 'status' | 'body' | 'header' | 'schema' | 'performance';
  target: string;
  operator: 'equals' | 'contains' | 'matches' | 'exists' | 'type' | 'range';
  expected: any;
  message: string;
}

export class OperationMapper {
  private spec: ParsedOpenAPI;
  private mappedOperations: Map<string, MappedOperation> = new Map();

  constructor(spec: ParsedOpenAPI) {
    this.spec = spec;
  }

  /**
   * Map all operations to test scenarios
   */
  async mapAllOperations(): Promise<MappedOperation[]> {
    const operations = await this.extractOperations();
    const mappedOps: MappedOperation[] = [];

    for (const operation of operations) {
      const mapped = await this.mapOperation(operation);
      this.mappedOperations.set(this.getOperationKey(operation), mapped);
      mappedOps.push(mapped);
    }

    return mappedOps;
  }

  /**
   * Map a single operation to test scenarios
   */
  async mapOperation(operation: Operation): Promise<MappedOperation> {
    const testScenarios = await this.generateTestScenarios(operation);
    const validationRules = await this.extractValidationRules(operation);
    const dataRequirements = await this.extractDataRequirements(operation);
    const dependencies = await this.analyzeDependencies(operation);

    return {
      operation,
      testScenarios,
      validationRules,
      dataRequirements,
      dependencies
    };
  }

  /**
   * Generate comprehensive test scenarios for an operation
   */
  private async generateTestScenarios(operation: Operation): Promise<TestScenario[]> {
    const scenarios: TestScenario[] = [];

    // 1. Success scenarios
    scenarios.push(...await this.generateSuccessScenarios(operation));

    // 2. Error scenarios
    scenarios.push(...await this.generateErrorScenarios(operation));

    // 3. Edge case scenarios
    scenarios.push(...await this.generateEdgeScenarios(operation));

    // 4. Security scenarios
    scenarios.push(...await this.generateSecurityScenarios(operation));

    // 5. Performance scenarios
    scenarios.push(...await this.generatePerformanceScenarios(operation));

    return scenarios;
  }

  /**
   * Generate success test scenarios
   */
  private async generateSuccessScenarios(operation: Operation): Promise<TestScenario[]> {
    const scenarios: TestScenario[] = [];
    const successResponses = this.getSuccessResponses(operation);

    for (const [statusCode, response] of successResponses) {
      const requestData = await this.generateValidRequestData(operation);
      const expectedResponse = await this.generateResponseTemplate(response, parseInt(statusCode));

      scenarios.push({
        id: `${operation.operationId || this.getOperationKey(operation)}_success_${statusCode}`,
        name: `${((operation.method || 'GET') || 'GET').toUpperCase()} ${(operation.path || '/unknown') || '/unknown'} success (${statusCode})`,
        type: 'success',
        description: operation.summary || `Successful ${((operation.method || 'GET') || 'GET').toUpperCase()} request to ${(operation.path || '/unknown') || '/unknown'}`,
        priority: 'high',
        tags: ['success', ...(operation.tags || [])],
        requestData,
        expectedResponse,
        statusCode: parseInt(statusCode),
        assertions: await this.generateSuccessAssertions(operation, response, parseInt(statusCode))
      });
    }

    return scenarios;
  }

  /**
   * Generate error test scenarios
   */
  private async generateErrorScenarios(operation: Operation): Promise<TestScenario[]> {
    const scenarios: TestScenario[] = [];
    const errorResponses = this.getErrorResponses(operation);

    for (const [statusCode, response] of errorResponses) {
      const invalidRequestData = await this.generateInvalidRequestData(operation, statusCode);
      const expectedResponse = await this.generateResponseTemplate(response, parseInt(statusCode));

      scenarios.push({
        id: `${operation.operationId || this.getOperationKey(operation)}_error_${statusCode}`,
        name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} error (${statusCode})`,
        type: 'error',
        description: `Error handling for ${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')}`,
        priority: 'medium',
        tags: ['error', ...(operation.tags || [])],
        requestData: invalidRequestData,
        expectedResponse,
        statusCode: parseInt(statusCode),
        assertions: await this.generateErrorAssertions(operation, response, parseInt(statusCode))
      });
    }

    return scenarios;
  }

  /**
   * Generate edge case scenarios
   */
  private async generateEdgeScenarios(operation: Operation): Promise<TestScenario[]> {
    const scenarios: TestScenario[] = [];
    
    // Test with minimal data
    const minimalData = await this.generateMinimalRequestData(operation);
    scenarios.push({
      id: `${operation.operationId || this.getOperationKey(operation)}_edge_minimal`,
      name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} with minimal data`,
      type: 'edge',
      description: `Test with minimal required data`,
      priority: 'medium',
      tags: ['edge', 'minimal', ...(operation.tags || [])],
      requestData: minimalData,
      expectedResponse: await this.getDefaultSuccessResponse(operation),
      statusCode: 200,
      assertions: await this.generateEdgeAssertions(operation, 'minimal')
    });

    // Test with maximum data
    const maximalData = await this.generateMaximalRequestData(operation);
    scenarios.push({
      id: `${operation.operationId || this.getOperationKey(operation)}_edge_maximal`,
      name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} with maximal data`,
      type: 'edge',
      description: `Test with maximum allowed data`,
      priority: 'low',
      tags: ['edge', 'maximal', ...(operation.tags || [])],
      requestData: maximalData,
      expectedResponse: await this.getDefaultSuccessResponse(operation),
      statusCode: 200,
      assertions: await this.generateEdgeAssertions(operation, 'maximal')
    });

    return scenarios;
  }

  /**
   * Generate security test scenarios
   */
  private async generateSecurityScenarios(operation: Operation): Promise<TestScenario[]> {
    const scenarios: TestScenario[] = [];

    // Check if operation requires authentication
    const requiresAuth = this.requiresAuthentication(operation);
    
    if (requiresAuth) {
      // Test without authentication
      scenarios.push({
        id: `${operation.operationId || this.getOperationKey(operation)}_security_noauth`,
        name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} without authentication`,
        type: 'security',
        description: `Test unauthorized access`,
        priority: 'high',
        tags: ['security', 'auth', ...(operation.tags || [])],
        requestData: await this.generateValidRequestData(operation, { excludeAuth: true }),
        expectedResponse: { statusCode: 401, headers: {}, body: { error: 'Unauthorized' } },
        statusCode: 401,
        assertions: await this.generateSecurityAssertions(operation, 'unauthorized')
      });

      // Test with invalid authentication
      scenarios.push({
        id: `${operation.operationId || this.getOperationKey(operation)}_security_invalidauth`,
        name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} with invalid authentication`,
        type: 'security',
        description: `Test with invalid credentials`,
        priority: 'high',
        tags: ['security', 'auth', ...(operation.tags || [])],
        requestData: await this.generateValidRequestData(operation, { invalidAuth: true }),
        expectedResponse: { statusCode: 401, headers: {}, body: { error: 'Invalid credentials' } },
        statusCode: 401,
        assertions: await this.generateSecurityAssertions(operation, 'invalid_auth')
      });
    }

    return scenarios;
  }

  /**
   * Generate performance test scenarios
   */
  private async generatePerformanceScenarios(operation: Operation): Promise<TestScenario[]> {
    const scenarios: TestScenario[] = [];

    // Basic performance test
    scenarios.push({
      id: `${operation.operationId || this.getOperationKey(operation)}_performance_basic`,
      name: `${(operation.method || 'GET').toUpperCase()} ${(operation.path || '/unknown')} performance`,
      type: 'performance',
      description: `Test response time and performance`,
      priority: 'low',
      tags: ['performance', ...(operation.tags || [])],
      requestData: await this.generateValidRequestData(operation),
      expectedResponse: await this.getDefaultSuccessResponse(operation),
      statusCode: 200,
      assertions: await this.generatePerformanceAssertions(operation)
    });

    return scenarios;
  }

  /**
   * Extract validation rules from operation
   */
  private async extractValidationRules(operation: Operation): Promise<ValidationRule[]> {
    const rules: ValidationRule[] = [];

    // Extract parameter validation rules
    if (operation.parameters) {
      for (const param of operation.parameters) {
        if (typeof param === 'object' && 'schema' in param && param.schema) {
          rules.push(...this.extractSchemaValidationRules(param.schema, param.name));
        }
      }
    }

    // Extract request body validation rules
    if (operation.requestBody && typeof operation.requestBody === 'object') {
      const content = operation.requestBody.content;
      if (content && content['application/json']?.schema) {
        rules.push(...this.extractSchemaValidationRules(content['application/json'].schema, 'body'));
      }
    }

    return rules;
  }

  /**
   * Extract data requirements from operation
   */
  private async extractDataRequirements(operation: Operation): Promise<DataRequirement[]> {
    const requirements: DataRequirement[] = [];

    // Extract parameter requirements
    if (operation.parameters) {
      for (const param of operation.parameters) {
        if (typeof param === 'object' && 'name' in param) {
          requirements.push({
            parameter: param.name,
            location: param.in as any,
            dataType: this.getParameterType(param),
            required: param.required || false,
            constraints: this.extractSchemaConstraints(param.schema),
            examples: this.extractExamples(param)
          });
        }
      }
    }

    // Extract request body requirements
    if (operation.requestBody && typeof operation.requestBody === 'object') {
      const content = operation.requestBody.content;
      if (content && content['application/json']?.schema) {
        requirements.push({
          parameter: 'body',
          location: 'body',
          dataType: 'object',
          required: operation.requestBody.required || false,
          constraints: this.extractSchemaConstraints(content['application/json'].schema),
          examples: []
        });
      }
    }

    return requirements;
  }

  /**
   * Helper methods for data generation and analysis
   */
  private async extractOperations(): Promise<Operation[]> {
    const operations: Operation[] = [];
    
    if (!this.spec.paths) return operations;

    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
      
      for (const method of httpMethods) {
        const operation = (pathItem as any)[method];
        if (operation) {
          operations.push({
            ...operation,
            path,
            method
          });
        }
      }
    }

    return operations;
  }

  private getOperationKey(operation: Operation): string {
    const method = (operation.method || 'GET') || 'GET';
    const path = (operation.path || '/unknown') || '/unknown';
    return `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  private getSuccessResponses(operation: Operation): [string, Response][] {
    if (!operation.responses) return [];
    
    return Object.entries(operation.responses)
      .filter(([code]) => code.startsWith('2') || code === 'default')
      .map(([code, response]) => [code, response as Response]);
  }

  private getErrorResponses(operation: Operation): [string, Response][] {
    if (!operation.responses) return [];
    
    return Object.entries(operation.responses)
      .filter(([code]) => code.startsWith('4') || code.startsWith('5'))
      .map(([code, response]) => [code, response as Response]);
  }

  private requiresAuthentication(operation: Operation): boolean {
    // Check if operation has security requirements
    if (operation.security && operation.security.length > 0) {
      return true;
    }
    
    // Check global security requirements
    if (this.spec.security && this.spec.security.length > 0) {
      return true;
    }

    return false;
  }

  private async generateValidRequestData(operation: Operation, options: any = {}): Promise<RequestDataTemplate> {
    // Implementation for generating valid request data
    return {
      pathParams: {},
      queryParams: {},
      headers: {},
      body: null
    };
  }

  private async generateInvalidRequestData(operation: Operation, statusCode: string): Promise<RequestDataTemplate> {
    // Implementation for generating invalid request data based on expected error
    return {
      pathParams: {},
      queryParams: {},
      headers: {},
      body: null
    };
  }

  private async generateMinimalRequestData(operation: Operation): Promise<RequestDataTemplate> {
    // Implementation for generating minimal required data
    return {
      pathParams: {},
      queryParams: {},
      headers: {},
      body: null
    };
  }

  private async generateMaximalRequestData(operation: Operation): Promise<RequestDataTemplate> {
    // Implementation for generating maximal allowed data
    return {
      pathParams: {},
      queryParams: {},
      headers: {},
      body: null
    };
  }

  private async generateResponseTemplate(response: Response, statusCode: number): Promise<ResponseTemplate> {
    return {
      statusCode,
      headers: {},
      body: null
    };
  }

  private async getDefaultSuccessResponse(operation: Operation): Promise<ResponseTemplate> {
    return {
      statusCode: 200,
      headers: {},
      body: null
    };
  }

  private async generateSuccessAssertions(operation: Operation, response: Response, statusCode: number): Promise<AssertionTemplate[]> {
    return [
      {
        type: 'status',
        target: 'response.status',
        operator: 'equals',
        expected: statusCode,
        message: `Should return ${statusCode} status`
      }
    ];
  }

  private async generateErrorAssertions(operation: Operation, response: Response, statusCode: number): Promise<AssertionTemplate[]> {
    return [
      {
        type: 'status',
        target: 'response.status',
        operator: 'equals',
        expected: statusCode,
        message: `Should return ${statusCode} error status`
      }
    ];
  }

  private async generateEdgeAssertions(operation: Operation, type: string): Promise<AssertionTemplate[]> {
    return [
      {
        type: 'status',
        target: 'response.status',
        operator: 'range',
        expected: [200, 299],
        message: `Should handle ${type} data successfully`
      }
    ];
  }

  private async generateSecurityAssertions(operation: Operation, type: string): Promise<AssertionTemplate[]> {
    return [
      {
        type: 'status',
        target: 'response.status',
        operator: 'equals',
        expected: 401,
        message: `Should return 401 for ${type}`
      }
    ];
  }

  private async generatePerformanceAssertions(operation: Operation): Promise<AssertionTemplate[]> {
    return [
      {
        type: 'performance',
        target: 'response.time',
        operator: 'range',
        expected: [0, 5000],
        message: 'Should respond within 5 seconds'
      }
    ];
  }

  private async analyzeDependencies(operation: Operation): Promise<string[]> {
    // Analyze operation dependencies (other operations that must run first)
    return [];
  }

  private extractSchemaValidationRules(schema: Schema, fieldName: string): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    if (schema.type) {
      rules.push({
        field: fieldName,
        type: 'type',
        constraint: schema.type,
        errorMessage: `${fieldName} must be of type ${schema.type}`
      });
    }

    return rules;
  }

  private getParameterType(param: Parameter): string {
    if (typeof param === 'object' && 'schema' in param && param.schema) {
      return param.schema.type || 'unknown';
    }
    return 'unknown';
  }

  private extractSchemaConstraints(schema?: Schema): SchemaConstraints {
    if (!schema) return {};
    
    const constraints: SchemaConstraints = {};
    
    if (schema.minimum !== undefined) constraints.minimum = schema.minimum;
    if (schema.maximum !== undefined) constraints.maximum = schema.maximum;
    if (schema.minLength !== undefined) constraints.minLength = schema.minLength;
    if (schema.maxLength !== undefined) constraints.maxLength = schema.maxLength;
    if (schema.pattern !== undefined) constraints.pattern = schema.pattern;
    if (schema.enum !== undefined) constraints.enum = schema.enum;
    if (schema.format !== undefined) constraints.format = schema.format;
    
    return constraints;
  }

  private extractExamples(param: Parameter): any[] {
    if (typeof param === 'object' && 'example' in param && param.example) {
      return [param.example];
    }
    return [];
  }

  /**
   * Public API methods
   */
  public getMappedOperation(operationId: string): MappedOperation | undefined {
    return this.mappedOperations.get(operationId);
  }

  public getAllMappedOperations(): MappedOperation[] {
    return Array.from(this.mappedOperations.values());
  }

  public getTestScenariosByType(type: TestScenario['type']): TestScenario[] {
    const scenarios: TestScenario[] = [];
    
    for (const mapped of this.mappedOperations.values()) {
      scenarios.push(...mapped.testScenarios.filter(s => s.type === type));
    }
    
    return scenarios;
  }

  public getHighPriorityScenarios(): TestScenario[] {
    const scenarios: TestScenario[] = [];
    
    for (const mapped of this.mappedOperations.values()) {
      scenarios.push(...mapped.testScenarios.filter(s => s.priority === 'high'));
    }
    
    return scenarios;
  }
}