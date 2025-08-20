"use strict";
/**
 * Core Type Definitions
 * Week 1 Sprint 1: Foundation Types for API Test Generator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsingError = exports.ConfigurationError = exports.GenerationError = exports.ValidationError = exports.APITestGeneratorError = exports.TestFramework = void 0;
// Test Framework Enumeration
var TestFramework;
(function (TestFramework) {
    TestFramework["JEST"] = "jest";
    TestFramework["MOCHA"] = "mocha";
    TestFramework["VITEST"] = "vitest";
    TestFramework["JASMINE"] = "jasmine";
})(TestFramework || (exports.TestFramework = TestFramework = {}));
// Error Types
class APITestGeneratorError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'APITestGeneratorError';
    }
}
exports.APITestGeneratorError = APITestGeneratorError;
class ValidationError extends APITestGeneratorError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class GenerationError extends APITestGeneratorError {
    constructor(message, details) {
        super(message, 'GENERATION_ERROR', details);
        this.name = 'GenerationError';
    }
}
exports.GenerationError = GenerationError;
class ConfigurationError extends APITestGeneratorError {
    constructor(message, details) {
        super(message, 'CONFIGURATION_ERROR', details);
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
class ParsingError extends APITestGeneratorError {
    constructor(message, details) {
        super(message, 'PARSING_ERROR', details);
        this.name = 'ParsingError';
    }
}
exports.ParsingError = ParsingError;
//# sourceMappingURL=types.js.map