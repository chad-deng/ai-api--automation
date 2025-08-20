import { AnalysisResult, EndpointInfo } from './analyzer';

export interface TestFile {
  filename: string;
  endpoints: EndpointInfo[];
  requiresAuth: boolean;
}

export interface TestPlan {
  testFiles: TestFile[];
  setupFiles: string[];
  serverUrl: string;
  hasAuth: boolean;
}

export class SimplePlanner {
  plan(analysis: AnalysisResult): TestPlan {
    // Group endpoints by path prefix or tag (simplified)
    const groupedEndpoints = this.groupEndpoints(analysis.endpoints);
    
    const testFiles: TestFile[] = [];
    
    for (const [group, endpoints] of Object.entries(groupedEndpoints)) {
      const requiresAuth = endpoints.some(ep => 
        ep.security && ep.security.length > 0
      );
      
      testFiles.push({
        filename: `${group.replace(/[^a-zA-Z0-9]/g, '_')}.test.ts`,
        endpoints,
        requiresAuth
      });
    }
    
    const setupFiles = ['setup.ts'];
    const hasAuth = Object.keys(analysis.authSchemes).length > 0;
    
    return {
      testFiles,
      setupFiles,
      serverUrl: analysis.serverUrl,
      hasAuth
    };
  }
  
  private groupEndpoints(endpoints: EndpointInfo[]): Record<string, EndpointInfo[]> {
    const groups: Record<string, EndpointInfo[]> = {};
    
    for (const endpoint of endpoints) {
      // Simple grouping by first path segment
      const pathParts = endpoint.path.split('/').filter(p => p);
      const group = pathParts[0] || 'root';
      
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(endpoint);
    }
    
    return groups;
  }
}