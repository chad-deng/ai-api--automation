"use strict";
/**
 * Base Template System for Test Generation
 * Week 2 Sprint 1: Extensible template system for different test frameworks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRegistry = exports.BaseTestTemplate = void 0;
class BaseTestTemplate {
    // Common utility methods
    sanitizeTestName(name) {
        return name
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim();
    }
    formatRequestData(data) {
        if (!data || Object.keys(data).length === 0) {
            return '';
        }
        return JSON.stringify(data, null, 4).replace(/\n/g, '\n    ');
    }
    extractPathParams(path) {
        const matches = path.match(/\{([^}]+)\}/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    }
    generateApiClientCall(method, path, data) {
        const methodLower = method.toLowerCase();
        const pathParams = this.extractPathParams(path);
        // Replace path parameters with actual values from data
        let finalPath = path;
        if (data && pathParams.length > 0) {
            pathParams.forEach(param => {
                if (data[param]) {
                    finalPath = finalPath.replace(`{${param}}`, `\${${param}}`);
                }
            });
        }
        if (data && ['post', 'put', 'patch'].includes(methodLower)) {
            return `apiClient.${methodLower}(\`${finalPath}\`, requestData)`;
        }
        else if (data && methodLower === 'get') {
            return `apiClient.${methodLower}(\`${finalPath}\`, { params: requestData })`;
        }
        else {
            return `apiClient.${methodLower}(\`${finalPath}\`)`;
        }
    }
}
exports.BaseTestTemplate = BaseTestTemplate;
class TemplateRegistry {
    constructor() {
        this.templates = new Map();
    }
    register(template) {
        this.templates.set(template.framework, template);
    }
    get(framework) {
        return this.templates.get(framework);
    }
    getSupportedFrameworks() {
        return Array.from(this.templates.keys());
    }
    isSupported(framework) {
        return this.templates.has(framework);
    }
}
exports.TemplateRegistry = TemplateRegistry;
//# sourceMappingURL=base-template.js.map