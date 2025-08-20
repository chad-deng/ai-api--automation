/**
 * Template System Export Module
 * Week 2 Sprint 1: Centralized template management
 */
export { BaseTestTemplate, TemplateRegistry } from './base-template';
export { JestTemplate } from './jest-template';
export { MochaTemplate } from './mocha-template';
export type { TestTemplate, TestAssertion, MockConfiguration } from './base-template';
import { TemplateRegistry } from './base-template';
export declare const templateRegistry: TemplateRegistry;
export declare function getTemplate(framework: string): import("./base-template").TestTemplate;
export declare function getSupportedFrameworks(): string[];
export declare function isFrameworkSupported(framework: string): boolean;
//# sourceMappingURL=index.d.ts.map