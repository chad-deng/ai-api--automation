/**
 * Operation Mapper Tests
 * Tests for mapping OpenAPI operations to test scenarios
 */

import { OperationMapper } from '../../../src/generator/mapper/operation-mapper';
import { ParsedOpenAPI, Operation } from '../../../src/types';

describe('OperationMapper', () => {
  let mapper: OperationMapper;
  let mockSpec: ParsedOpenAPI;

  beforeEach(() => {
    mockSpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
            summary: 'Get all users',
            tags: ['users'],
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Bad Request'
              }
            }
          },
          post: {
            operationId: 'createUser',
            summary: 'Create a user',
            tags: ['users'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['name', 'email'],
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' }
                    }
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/users/{id}': {
          get: {
            operationId: 'getUserById',
            summary: 'Get user by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer' }
              }
            ],
            responses: {
              '200': {
                description: 'Success'
              },
              '404': {
                description: 'Not Found'
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      }
    };

    mapper = new OperationMapper(mockSpec);
  });

  describe('Initialization', () => {
    test('should initialize with OpenAPI spec', () => {
      expect(mapper).toBeInstanceOf(OperationMapper);
    });
  });

  describe('Operation Extraction', () => {
    test('should extract all operations from spec', async () => {
      const operations = await mapper.mapAllOperations();
      
      expect(operations).toHaveLength(3);
      expect(operations.map(op => op.operation.operationId)).toEqual([
        'getUsers',
        'createUser', 
        'getUserById'
      ]);
    });
  });

  describe('Single Operation Mapping', () => {
    test('should map a single operation', async () => {
      const operation: Operation = {
        operationId: 'getUsers',
        method: 'get',
        path: '/users',
        summary: 'Get all users',
        tags: ['users'],
        responses: {
          '200': { description: 'Success' }
        }
      };

      const mapped = await mapper.mapOperation(operation);

      expect(mapped.operation).toEqual(operation);
      expect(mapped.testScenarios).toBeDefined();
      expect(mapped.validationRules).toBeDefined();
      expect(mapped.dataRequirements).toBeDefined();
      expect(mapped.dependencies).toBeDefined();
    });
  });

  describe('Test Scenario Generation', () => {
    test('should generate success scenarios', async () => {
      const operations = await mapper.mapAllOperations();
      const getUsersMapping = operations.find(op => op.operation.operationId === 'getUsers');
      
      expect(getUsersMapping).toBeDefined();
      
      const successScenarios = getUsersMapping!.testScenarios.filter(s => s.type === 'success');
      expect(successScenarios.length).toBeGreaterThan(0);
      
      const scenario = successScenarios[0];
      expect(scenario.name).toContain('GET');
      expect(scenario.name).toContain('/users');
      expect(scenario.name).toContain('success');
      expect(scenario.statusCode).toBe(200);
      expect(scenario.priority).toBe('high');
    });

    test('should generate error scenarios', async () => {
      const operations = await mapper.mapAllOperations();
      const getUsersMapping = operations.find(op => op.operation.operationId === 'getUsers');
      
      const errorScenarios = getUsersMapping!.testScenarios.filter(s => s.type === 'error');
      expect(errorScenarios.length).toBeGreaterThan(0);
      
      const scenario = errorScenarios[0];
      expect(scenario.name).toContain('error');
      expect(scenario.statusCode).toBe(400);
      expect(scenario.priority).toBe('medium');
    });

    test('should generate edge case scenarios', async () => {
      const operations = await mapper.mapAllOperations();
      const getUsersMapping = operations.find(op => op.operation.operationId === 'getUsers');
      
      const edgeScenarios = getUsersMapping!.testScenarios.filter(s => s.type === 'edge');
      expect(edgeScenarios.length).toBeGreaterThan(0);
      
      const minimalScenario = edgeScenarios.find(s => s.name.includes('minimal'));
      const maximalScenario = edgeScenarios.find(s => s.name.includes('maximal'));
      
      expect(minimalScenario).toBeDefined();
      expect(maximalScenario).toBeDefined();
      expect(minimalScenario!.priority).toBe('medium');
      expect(maximalScenario!.priority).toBe('low');
    });

    test('should generate security scenarios for authenticated operations', async () => {
      const operations = await mapper.mapAllOperations();
      const getUsersMapping = operations.find(op => op.operation.operationId === 'getUsers');
      
      const securityScenarios = getUsersMapping!.testScenarios.filter(s => s.type === 'security');
      expect(securityScenarios.length).toBeGreaterThan(0);
      
      const noAuthScenario = securityScenarios.find(s => s.name.includes('without authentication'));
      const invalidAuthScenario = securityScenarios.find(s => s.name.includes('invalid authentication'));
      
      expect(noAuthScenario).toBeDefined();
      expect(invalidAuthScenario).toBeDefined();
      expect(noAuthScenario!.statusCode).toBe(401);
      expect(invalidAuthScenario!.statusCode).toBe(401);
    });

    test('should generate performance scenarios', async () => {
      const operations = await mapper.mapAllOperations();
      const getUsersMapping = operations.find(op => op.operation.operationId === 'getUsers');
      
      const performanceScenarios = getUsersMapping!.testScenarios.filter(s => s.type === 'performance');
      expect(performanceScenarios.length).toBeGreaterThan(0);
      
      const scenario = performanceScenarios[0];
      expect(scenario.name).toContain('performance');
      expect(scenario.priority).toBe('low');
    });
  });

  describe('Validation Rules Extraction', () => {
    test('should extract validation rules from operation parameters', async () => {
      const operations = await mapper.mapAllOperations();
      const getUserByIdMapping = operations.find(op => op.operation.operationId === 'getUserById');
      
      expect(getUserByIdMapping).toBeDefined();
      expect(getUserByIdMapping!.validationRules.length).toBeGreaterThan(0);
      
      const rule = getUserByIdMapping!.validationRules[0];
      expect(rule.field).toBe('id');
      expect(rule.type).toBe('type');
      expect(rule.constraint).toBe('integer');
    });

    test('should extract validation rules from request body', async () => {
      const operations = await mapper.mapAllOperations();
      const createUserMapping = operations.find(op => op.operation.operationId === 'createUser');
      
      expect(createUserMapping).toBeDefined();
      expect(createUserMapping!.validationRules.length).toBeGreaterThan(0);
    });
  });

  describe('Data Requirements Extraction', () => {
    test('should extract parameter requirements', async () => {
      const operations = await mapper.mapAllOperations();
      const getUserByIdMapping = operations.find(op => op.operation.operationId === 'getUserById');
      
      expect(getUserByIdMapping).toBeDefined();
      expect(getUserByIdMapping!.dataRequirements.length).toBeGreaterThan(0);
      
      const requirement = getUserByIdMapping!.dataRequirements[0];
      expect(requirement.parameter).toBe('id');
      expect(requirement.location).toBe('path');
      expect(requirement.required).toBe(true);
      expect(requirement.dataType).toBe('integer');
    });

    test('should extract request body requirements', async () => {
      const operations = await mapper.mapAllOperations();
      const createUserMapping = operations.find(op => op.operation.operationId === 'createUser');
      
      expect(createUserMapping).toBeDefined();
      
      const bodyRequirement = createUserMapping!.dataRequirements.find(r => r.location === 'body');
      expect(bodyRequirement).toBeDefined();
      expect(bodyRequirement!.parameter).toBe('body');
      expect(bodyRequirement!.required).toBe(true);
    });
  });

  describe('Assertions Generation', () => {
    test('should generate success assertions', async () => {
      const operations = await mapper.mapAllOperations();
      const getUsersMapping = operations.find(op => op.operation.operationId === 'getUsers');
      
      const successScenario = getUsersMapping!.testScenarios.find(s => s.type === 'success');
      expect(successScenario).toBeDefined();
      expect(successScenario!.assertions.length).toBeGreaterThan(0);
      
      const statusAssertion = successScenario!.assertions.find(a => a.type === 'status');
      expect(statusAssertion).toBeDefined();
      expect(statusAssertion!.expected).toBe(200);
    });

    test('should generate error assertions', async () => {
      const operations = await mapper.mapAllOperations();
      const getUsersMapping = operations.find(op => op.operation.operationId === 'getUsers');
      
      const errorScenario = getUsersMapping!.testScenarios.find(s => s.type === 'error');
      expect(errorScenario).toBeDefined();
      expect(errorScenario!.assertions.length).toBeGreaterThan(0);
      
      const statusAssertion = errorScenario!.assertions.find(a => a.type === 'status');
      expect(statusAssertion).toBeDefined();
      expect(statusAssertion!.expected).toBe(400);
    });
  });

  describe('Public API Methods', () => {
    test('should retrieve mapped operation by ID', async () => {
      await mapper.mapAllOperations();
      
      const mapped = mapper.getMappedOperation('get__users');
      expect(mapped).toBeDefined();
      expect(mapped!.operation.operationId).toBe('getUsers');
    });

    test('should get all mapped operations', async () => {
      await mapper.mapAllOperations();
      
      const allMapped = mapper.getAllMappedOperations();
      expect(allMapped).toHaveLength(3);
    });

    test('should filter test scenarios by type', async () => {
      await mapper.mapAllOperations();
      
      const successScenarios = mapper.getTestScenariosByType('success');
      const errorScenarios = mapper.getTestScenariosByType('error');
      const securityScenarios = mapper.getTestScenariosByType('security');
      
      expect(successScenarios.length).toBeGreaterThan(0);
      expect(errorScenarios.length).toBeGreaterThan(0);
      expect(securityScenarios.length).toBeGreaterThan(0);
      
      expect(successScenarios.every(s => s.type === 'success')).toBe(true);
      expect(errorScenarios.every(s => s.type === 'error')).toBe(true);
      expect(securityScenarios.every(s => s.type === 'security')).toBe(true);
    });

    test('should get high priority scenarios', async () => {
      await mapper.mapAllOperations();
      
      const highPriorityScenarios = mapper.getHighPriorityScenarios();
      expect(highPriorityScenarios.length).toBeGreaterThan(0);
      expect(highPriorityScenarios.every(s => s.priority === 'high')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle operations without responses', async () => {
      const operationWithoutResponses: Operation = {
        operationId: 'testOp',
        method: 'get',
        path: '/test'
      };

      const mapped = await mapper.mapOperation(operationWithoutResponses);
      expect(mapped.testScenarios).toBeDefined();
      expect(mapped.testScenarios.length).toBeGreaterThan(0);
    });

    test('should handle operations without operationId', async () => {
      const operationWithoutId: Operation = {
        method: 'get',
        path: '/test',
        responses: {
          '200': { description: 'Success' }
        }
      };

      const mapped = await mapper.mapOperation(operationWithoutId);
      expect(mapped.testScenarios[0].id).toContain('get__test');
    });

    test('should handle operations without tags', async () => {
      const operationWithoutTags: Operation = {
        operationId: 'testOp',
        method: 'get',
        path: '/test',
        responses: {
          '200': { description: 'Success' }
        }
      };

      const mapped = await mapper.mapOperation(operationWithoutTags);
      expect(mapped.testScenarios[0].tags).toContain('success');
    });

    test('should handle empty spec paths', async () => {
      const emptySpec: ParsedOpenAPI = {
        openapi: '3.0.0',
        info: { title: 'Empty API', version: '1.0.0' },
        paths: {}
      };

      const emptyMapper = new OperationMapper(emptySpec);
      const operations = await emptyMapper.mapAllOperations();
      
      expect(operations).toHaveLength(0);
    });
  });
});