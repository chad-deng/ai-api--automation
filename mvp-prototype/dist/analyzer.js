"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAnalyzer = void 0;
class SimpleAnalyzer {
    analyze(spec) {
        const endpoints = [];
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
exports.SimpleAnalyzer = SimpleAnalyzer;
//# sourceMappingURL=analyzer.js.map