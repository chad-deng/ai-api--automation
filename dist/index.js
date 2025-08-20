"use strict";
/**
 * Main Entry Point
 * AI API Test Automation Framework - Enterprise Edition
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = exports.version = exports.OpenAPIValidator = exports.OpenAPIParser = exports.TestGenerator = exports.CLI = void 0;
// Core CLI - MVP Version
const cli_mvp_1 = require("./cli-mvp");
Object.defineProperty(exports, "CLI", { enumerable: true, get: function () { return cli_mvp_1.CLI; } });
// Main framework exports - MVP SCOPE ONLY
var test_generator_1 = require("./generator/test-generator");
Object.defineProperty(exports, "TestGenerator", { enumerable: true, get: function () { return test_generator_1.TestGenerator; } });
var openapi_parser_1 = require("./parser/openapi-parser");
Object.defineProperty(exports, "OpenAPIParser", { enumerable: true, get: function () { return openapi_parser_1.OpenAPIParser; } });
var openapi_validator_1 = require("./validator/openapi-validator");
Object.defineProperty(exports, "OpenAPIValidator", { enumerable: true, get: function () { return openapi_validator_1.OpenAPIValidator; } });
// Enterprise features - excluded from MVP
// export { AuthManager } from './auth/auth-manager';
// export { ContractValidator } from './validator/contract-validator';
// export { PerformanceTester } from './performance/performance-tester';
// export { PerformanceOptimizer } from './performance/performance-optimizer';
// export { SecurityScanner } from './security/security-scanner';
// export { SystemMonitor } from './monitoring/system-monitor';
// export { IntegrationTestRunner } from './integration/integration-test-runner';
// export { ReportGenerator } from './reporting/report-generator';
// export { MockServer } from './mock/mock-server';
// Type definitions
__exportStar(require("./types"), exports);
// Module exports (commented out for build compatibility)
// export * from './auth';
// export * from './generator';
// export * from './validator';
// export * from './performance';
// export * from './security';
// export * from './monitoring';
// export * from './integration';
// export * from './reporting';
// export * from './mock';
// Version information
exports.version = '1.0.0';
exports.name = '@yourorg/ai-api-test-automation';
// Default export for CLI usage
exports.default = cli_mvp_1.CLI;
//# sourceMappingURL=index.js.map