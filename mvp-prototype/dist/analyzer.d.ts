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
export declare class SimpleAnalyzer {
    analyze(spec: OpenAPISpec): AnalysisResult;
}
