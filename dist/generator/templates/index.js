"use strict";
/**
 * Template System Export Module
 * Week 2 Sprint 1: Centralized template management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateRegistry = exports.MochaTemplate = exports.JestTemplate = exports.TemplateRegistry = exports.BaseTestTemplate = void 0;
exports.getTemplate = getTemplate;
exports.getSupportedFrameworks = getSupportedFrameworks;
exports.isFrameworkSupported = isFrameworkSupported;
var base_template_1 = require("./base-template");
Object.defineProperty(exports, "BaseTestTemplate", { enumerable: true, get: function () { return base_template_1.BaseTestTemplate; } });
Object.defineProperty(exports, "TemplateRegistry", { enumerable: true, get: function () { return base_template_1.TemplateRegistry; } });
var jest_template_1 = require("./jest-template");
Object.defineProperty(exports, "JestTemplate", { enumerable: true, get: function () { return jest_template_1.JestTemplate; } });
var mocha_template_1 = require("./mocha-template");
Object.defineProperty(exports, "MochaTemplate", { enumerable: true, get: function () { return mocha_template_1.MochaTemplate; } });
// Create and export configured template registry
const base_template_2 = require("./base-template");
const jest_template_2 = require("./jest-template");
const mocha_template_2 = require("./mocha-template");
exports.templateRegistry = new base_template_2.TemplateRegistry();
// Register available templates
exports.templateRegistry.register(new jest_template_2.JestTemplate());
exports.templateRegistry.register(new mocha_template_2.MochaTemplate());
function getTemplate(framework) {
    return exports.templateRegistry.get(framework);
}
function getSupportedFrameworks() {
    return exports.templateRegistry.getSupportedFrameworks();
}
function isFrameworkSupported(framework) {
    return exports.templateRegistry.isSupported(framework);
}
//# sourceMappingURL=index.js.map