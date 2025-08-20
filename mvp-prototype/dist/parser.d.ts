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
    servers?: Array<{
        url: string;
        description?: string;
    }>;
}
export declare class MVPParser {
    parse(filePath: string): Promise<OpenAPISpec>;
}
