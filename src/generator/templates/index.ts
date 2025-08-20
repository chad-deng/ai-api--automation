/**
 * Template System Export Module
 * Week 2 Sprint 1: Centralized template management
 */

export { BaseTestTemplate, TemplateRegistry } from './base-template';
export { JestTemplate } from './jest-template';
export { MochaTemplate } from './mocha-template';

export type { TestTemplate, TestAssertion, MockConfiguration } from './base-template';

// Create and export configured template registry
import { TemplateRegistry } from './base-template';
import { JestTemplate } from './jest-template';
import { MochaTemplate } from './mocha-template';

export const templateRegistry = new TemplateRegistry();

// Register available templates
templateRegistry.register(new JestTemplate());
templateRegistry.register(new MochaTemplate());

export function getTemplate(framework: string) {
  return templateRegistry.get(framework);
}

export function getSupportedFrameworks() {
  return templateRegistry.getSupportedFrameworks();
}

export function isFrameworkSupported(framework: string) {
  return templateRegistry.isSupported(framework);
}