import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';

export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  servers?: Array<{ url: string; description?: string }>;
}

export class MVPParser {
  async parse(filePath: string): Promise<OpenAPISpec> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Basic size validation
      if (content.length > 10_000_000) {
        throw new Error('File too large (>10MB)');
      }
      
      let spec: any;
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.json') {
        spec = JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        spec = yaml.load(content);
      } else {
        throw new Error('Unsupported file format. Use .json, .yaml, or .yml');
      }
      
      // Basic OpenAPI validation
      if (!spec.openapi && !spec.swagger) {
        throw new Error('Not a valid OpenAPI/Swagger specification');
      }
      
      if (!spec.paths) {
        throw new Error('OpenAPI specification must contain paths');
      }
      
      return spec as OpenAPISpec;
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse OpenAPI spec: ${error.message}`);
      }
      throw error;
    }
  }
}