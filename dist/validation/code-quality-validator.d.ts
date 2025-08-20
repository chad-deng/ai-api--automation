/**
 * Code Quality Validation Pipeline (US-018)
 * Validates generated code against ESLint, Prettier, and TypeScript compilation standards
 */
import { ESLint } from 'eslint';
import prettier from 'prettier';
import { ts } from 'ts-morph';
export interface CodeQualityOptions {
    eslintConfig?: ESLint.ConfigData;
    prettierConfig?: prettier.Config;
    typescriptConfig?: ts.CompilerOptions;
    strictMode?: boolean;
    fixableIssues?: boolean;
    generateReport?: boolean;
}
export interface QualityValidationResult {
    isValid: boolean;
    typescript: TypeScriptValidationResult;
    eslint: ESLintValidationResult;
    prettier: PrettierValidationResult;
    summary: QualitySummary;
    report?: string;
}
export interface TypeScriptValidationResult {
    isValid: boolean;
    errors: TypeScriptError[];
    warnings: TypeScriptWarning[];
    diagnosticsCount: number;
}
export interface ESLintValidationResult {
    isValid: boolean;
    errors: ESLintError[];
    warnings: ESLintWarning[];
    fixableErrorsCount: number;
    fixableWarningsCount: number;
}
export interface PrettierValidationResult {
    isValid: boolean;
    needsFormatting: string[];
    formattedFiles: string[];
}
export interface QualitySummary {
    totalFiles: number;
    validFiles: number;
    filesWithErrors: number;
    filesWithWarnings: number;
    overallScore: number;
}
export interface TypeScriptError {
    file: string;
    line: number;
    column: number;
    message: string;
    code: number;
    category: 'error' | 'warning' | 'suggestion' | 'message';
}
export interface TypeScriptWarning {
    file: string;
    line: number;
    column: number;
    message: string;
    code: number;
}
export interface ESLintError {
    file: string;
    line: number;
    column: number;
    message: string;
    ruleId: string;
    severity: number;
    fixable: boolean;
}
export interface ESLintWarning {
    file: string;
    line: number;
    column: number;
    message: string;
    ruleId: string;
    severity: number;
    fixable: boolean;
}
export declare class CodeQualityValidator {
    private eslint;
    private project;
    private options;
    constructor(options?: CodeQualityOptions);
    /**
     * Validate code quality for all generated files
     */
    validateGeneratedCode(filePaths: string[]): Promise<QualityValidationResult>;
    /**
     * Validate TypeScript compilation
     */
    validateTypeScript(filePaths: string[]): Promise<TypeScriptValidationResult>;
    /**
     * Validate ESLint rules
     */
    validateESLint(filePaths: string[]): Promise<ESLintValidationResult>;
    /**
     * Validate Prettier formatting
     */
    validatePrettier(filePaths: string[]): Promise<PrettierValidationResult>;
    /**
     * Apply automatic fixes to all fixable issues
     */
    applyFixes(filePaths: string[]): Promise<{
        typescript: boolean;
        eslint: boolean;
        prettier: boolean;
    }>;
    /**
     * Generate a detailed quality report
     */
    private generateQualityReport;
    /**
     * Calculate quality summary metrics
     */
    private calculateSummary;
    /**
     * Get default ESLint configuration
     */
    private getDefaultESLintConfig;
    /**
     * Get default TypeScript configuration
     */
    private getDefaultTypeScriptConfig;
    /**
     * Get default Prettier configuration
     */
    private getDefaultPrettierConfig;
    /**
     * Convert TypeScript diagnostic category to string
     */
    private getDiagnosticCategory;
    /**
     * Validate single file
     */
    validateFile(filePath: string): Promise<QualityValidationResult>;
    /**
     * Get validation configuration
     */
    getConfiguration(): CodeQualityOptions;
    /**
     * Update validation configuration
     */
    updateConfiguration(options: Partial<CodeQualityOptions>): void;
}
//# sourceMappingURL=code-quality-validator.d.ts.map