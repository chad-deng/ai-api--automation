import { OpenAPISpec } from './parser';

export interface EndpointInfo {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, any>;
  security?: any[];
}

export interface AnalysisResult {
  endpoints: EndpointInfo[];
  schemas: Record<string, any>;
  authSchemes: Record<string, any>;
  serverUrl: string;
}

export class SimpleAnalyzer {
  analyze(spec: OpenAPISpec): AnalysisResult {
    const endpoints: EndpointInfo[] = [];
    
    // Extract endpoints
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
      
      for (const method of methods) {
        const operation = pathItem[method];
        if (operation) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: operation.operationId,
            summary: operation.summary,
            parameters: operation.parameters || [],
            requestBody: operation.requestBody,
            responses: operation.responses || {},
            security: operation.security
          });
        }
      }
    }
    
    // Extract schemas
    const schemas = spec.components?.schemas || {};
    
    // Extract auth schemes
    const authSchemes = spec.components?.securitySchemes || {};
    
    // Get server URL
    const serverUrl = spec.servers?.[0]?.url || 'http://localhost:3000';
    
    return {
      endpoints,
      schemas,
      authSchemes,
      serverUrl
    };
  }
}