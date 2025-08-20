"use strict";
/**
 * Code Quality Validation Pipeline (US-018)
 * Validates generated code against ESLint, Prettier, and TypeScript compilation standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeQualityValidator = void 0;
const eslint_1 = require("eslint");
const prettier_1 = __importDefault(require("prettier"));
const ts_morph_1 = require("ts-morph");
const fs_1 = require("fs");
class CodeQualityValidator {
    constructor(options = {}) {
        this.options = {
            strictMode: true,
            fixableIssues: true,
            generateReport: true,
            ...options
        };
        // Initialize ESLint with custom or default configuration
        this.eslint = new eslint_1.ESLint({
            overrideConfigFile: true,
            overrideConfig: this.options.eslintConfig || this.getDefaultESLintConfig(),
            fix: this.options.fixableIssues || false
        });
        // Initialize TypeScript project
        this.project = new ts_morph_1.Project({
            compilerOptions: this.options.typescriptConfig || this.getDefaultTypeScriptConfig()
        });
    }
    /**
     * Validate code quality for all generated files
     */
    async validateGeneratedCode(filePaths) {
        const results = await Promise.all([
            this.validateTypeScript(filePaths),
            this.validateESLint(filePaths),
            this.validatePrettier(filePaths)
        ]);
        const [typescript, eslint, prettier] = results;
        const summary = this.calculateSummary(typescript, eslint, prettier, filePaths.length);
        const isValid = typescript.isValid && eslint.isValid && prettier.isValid;
        const result = {
            isValid,
            typescript,
            eslint,
            prettier,
            summary
        };
        if (this.options.generateReport) {
            result.report = this.generateQualityReport(result);
        }
        return result;
    }
    /**
     * Validate TypeScript compilation
     */
    async validateTypeScript(filePaths) {
        const errors = [];
        const warnings = [];
        // Add all files to the project
        for (const filePath of filePaths) {
            try {
                const content = await fs_1.promises.readFile(filePath, 'utf-8');
                this.project.createSourceFile(filePath, content, { overwrite: true });
            }
            catch (error) {
                errors.push({
                    file: filePath,
                    line: 0,
                    column: 0,
                    message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    code: 0,
                    category: 'error'
                });
            }
        }
        // Get diagnostics from TypeScript compiler
        const diagnostics = this.project.getPreEmitDiagnostics();
        for (const diagnostic of diagnostics) {
            const sourceFile = diagnostic.getSourceFile();
            const start = diagnostic.getStart();
            const filePath = sourceFile?.getFilePath() || 'unknown';
            let line = 0;
            let column = 0;
            if (sourceFile && start !== undefined) {
                const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
                line = lineAndColumn.line;
                column = lineAndColumn.column;
            }
            const diagnosticInfo = {
                file: filePath,
                line,
                column,
                message: diagnostic.getMessageText().toString(),
                code: diagnostic.getCode(),
                category: this.getDiagnosticCategory(diagnostic.getCategory())
            };
            if (diagnostic.getCategory() === ts_morph_1.ts.DiagnosticCategory.Error) {
                errors.push(diagnosticInfo);
            }
            else if (diagnostic.getCategory() === ts_morph_1.ts.DiagnosticCategory.Warning) {
                warnings.push(diagnosticInfo);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            diagnosticsCount: diagnostics.length
        };
    }
    /**
     * Validate ESLint rules
     */
    async validateESLint(filePaths) {
        const errors = [];
        const warnings = [];
        let fixableErrorsCount = 0;
        let fixableWarningsCount = 0;
        try {
            const results = await this.eslint.lintFiles(filePaths);
            for (const result of results) {
                for (const message of result.messages) {
                    const errorInfo = {
                        file: result.filePath,
                        line: message.line,
                        column: message.column,
                        message: message.message,
                        ruleId: message.ruleId || 'unknown',
                        severity: message.severity,
                        fixable: Boolean(message.fix)
                    };
                    if (message.severity === 2) { // Error
                        errors.push(errorInfo);
                        if (message.fix)
                            fixableErrorsCount++;
                    }
                    else if (message.severity === 1) { // Warning
                        warnings.push(errorInfo);
                        if (message.fix)
                            fixableWarningsCount++;
                    }
                }
            }
            // Apply fixes if enabled
            if (this.options.fixableIssues && (fixableErrorsCount > 0 || fixableWarningsCount > 0)) {
                await eslint_1.ESLint.outputFixes(results);
            }
        }
        catch (error) {
            errors.push({
                file: 'eslint-config',
                line: 0,
                column: 0,
                message: `ESLint validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                ruleId: 'eslint-error',
                severity: 2,
                fixable: false
            });
        }
        return {
            isValid: errors.length === 0 && (!this.options.strictMode || warnings.length === 0),
            errors,
            warnings,
            fixableErrorsCount,
            fixableWarningsCount
        };
    }
    /**
     * Validate Prettier formatting
     */
    async validatePrettier(filePaths) {
        const needsFormatting = [];
        const formattedFiles = [];
        const prettierConfig = this.options.prettierConfig || this.getDefaultPrettierConfig();
        for (const filePath of filePaths) {
            try {
                const content = await fs_1.promises.readFile(filePath, 'utf-8');
                const isFormatted = await prettier_1.default.check(content, {
                    ...prettierConfig,
                    filepath: filePath
                });
                if (!isFormatted) {
                    needsFormatting.push(filePath);
                    if (this.options.fixableIssues) {
                        const formatted = await prettier_1.default.format(content, {
                            ...prettierConfig,
                            filepath: filePath
                        });
                        await fs_1.promises.writeFile(filePath, formatted, 'utf-8');
                        formattedFiles.push(filePath);
                    }
                }
            }
            catch (error) {
                // If Prettier can't format the file, consider it as needing formatting
                needsFormatting.push(filePath);
            }
        }
        return {
            isValid: needsFormatting.length === 0,
            needsFormatting,
            formattedFiles
        };
    }
    /**
     * Apply automatic fixes to all fixable issues
     */
    async applyFixes(filePaths) {
        const originalFixableOption = this.options.fixableIssues;
        this.options.fixableIssues = true;
        try {
            // ESLint fixes
            const eslintResults = await this.eslint.lintFiles(filePaths);
            await eslint_1.ESLint.outputFixes(eslintResults);
            // Prettier fixes
            for (const filePath of filePaths) {
                try {
                    const content = await fs_1.promises.readFile(filePath, 'utf-8');
                    const formatted = await prettier_1.default.format(content, {
                        ...this.getDefaultPrettierConfig(),
                        filepath: filePath
                    });
                    await fs_1.promises.writeFile(filePath, formatted, 'utf-8');
                }
                catch (error) {
                    // Skip files that can't be formatted
                }
            }
            return {
                typescript: true, // TypeScript issues usually require manual fixes
                eslint: true,
                prettier: true
            };
        }
        finally {
            this.options.fixableIssues = originalFixableOption;
        }
    }
    /**
     * Generate a detailed quality report
     */
    generateQualityReport(result) {
        const { typescript, eslint, prettier, summary } = result;
        let report = '# Code Quality Validation Report\n\n';
        // Overall summary
        report += `## Summary\n`;
        report += `- **Overall Score**: ${summary.overallScore}/100\n`;
        report += `- **Total Files**: ${summary.totalFiles}\n`;
        report += `- **Valid Files**: ${summary.validFiles}\n`;
        report += `- **Files with Errors**: ${summary.filesWithErrors}\n`;
        report += `- **Files with Warnings**: ${summary.filesWithWarnings}\n\n`;
        // TypeScript validation
        report += `## TypeScript Validation\n`;
        report += `- **Status**: ${typescript.isValid ? '✅ PASS' : '❌ FAIL'}\n`;
        report += `- **Errors**: ${typescript.errors.length}\n`;
        report += `- **Warnings**: ${typescript.warnings.length}\n`;
        if (typescript.errors.length > 0) {
            report += `\n### TypeScript Errors\n`;
            typescript.errors.forEach(error => {
                report += `- **${error.file}:${error.line}:${error.column}** - ${error.message} (TS${error.code})\n`;
            });
        }
        // ESLint validation
        report += `\n## ESLint Validation\n`;
        report += `- **Status**: ${eslint.isValid ? '✅ PASS' : '❌ FAIL'}\n`;
        report += `- **Errors**: ${eslint.errors.length} (${eslint.fixableErrorsCount} fixable)\n`;
        report += `- **Warnings**: ${eslint.warnings.length} (${eslint.fixableWarningsCount} fixable)\n`;
        if (eslint.errors.length > 0) {
            report += `\n### ESLint Errors\n`;
            eslint.errors.slice(0, 10).forEach(error => {
                report += `- **${error.file}:${error.line}:${error.column}** - ${error.message} (${error.ruleId})${error.fixable ? ' [FIXABLE]' : ''}\n`;
            });
            if (eslint.errors.length > 10) {
                report += `- ... and ${eslint.errors.length - 10} more errors\n`;
            }
        }
        // Prettier validation
        report += `\n## Prettier Validation\n`;
        report += `- **Status**: ${prettier.isValid ? '✅ PASS' : '❌ FAIL'}\n`;
        report += `- **Files needing formatting**: ${prettier.needsFormatting.length}\n`;
        report += `- **Files auto-formatted**: ${prettier.formattedFiles.length}\n`;
        if (prettier.needsFormatting.length > 0) {
            report += `\n### Files needing formatting\n`;
            prettier.needsFormatting.forEach(file => {
                report += `- ${file}\n`;
            });
        }
        return report;
    }
    /**
     * Calculate quality summary metrics
     */
    calculateSummary(typescript, eslint, prettier, totalFiles) {
        const filesWithErrors = new Set([
            ...typescript.errors.map(e => e.file),
            ...eslint.errors.map(e => e.file),
            ...prettier.needsFormatting
        ]).size;
        const filesWithWarnings = new Set([
            ...typescript.warnings.map(w => w.file),
            ...eslint.warnings.map(w => w.file)
        ]).size;
        const validFiles = totalFiles - filesWithErrors;
        // Calculate overall score (0-100)
        let score = 100;
        // Deduct points for errors (major impact)
        score -= (typescript.errors.length * 10);
        score -= (eslint.errors.length * 5);
        score -= (prettier.needsFormatting.length * 2);
        // Deduct points for warnings (minor impact)
        score -= (typescript.warnings.length * 2);
        score -= (eslint.warnings.length * 1);
        // Ensure score doesn't go below 0
        score = Math.max(0, score);
        return {
            totalFiles,
            validFiles,
            filesWithErrors,
            filesWithWarnings,
            overallScore: score
        };
    }
    /**
     * Get default ESLint configuration
     */
    getDefaultESLintConfig() {
        return {
            parser: '@typescript-eslint/parser',
            plugins: ['@typescript-eslint'],
            extends: [
                'eslint:recommended',
                '@typescript-eslint/recommended'
            ],
            rules: {
                '@typescript-eslint/no-unused-vars': 'error',
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/prefer-const': 'error',
                'prefer-const': 'error',
                'no-var': 'error',
                'no-console': 'warn',
                'no-debugger': 'error',
                'eqeqeq': 'error',
                'curly': 'error'
            },
            env: {
                node: true,
                es2020: true,
                jest: true
            },
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module'
            }
        };
    }
    /**
     * Get default TypeScript configuration
     */
    getDefaultTypeScriptConfig() {
        return {
            target: ts_morph_1.ts.ScriptTarget.ES2020,
            module: ts_morph_1.ts.ModuleKind.ESNext,
            moduleResolution: ts_morph_1.ts.ModuleResolutionKind.NodeJs,
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            declaration: true,
            outDir: 'dist',
            noEmitOnError: true,
            noImplicitAny: true,
            noImplicitReturns: true,
            noUnusedLocals: true,
            noUnusedParameters: true
        };
    }
    /**
     * Get default Prettier configuration
     */
    getDefaultPrettierConfig() {
        return {
            semi: true,
            trailingComma: 'es5',
            singleQuote: true,
            printWidth: 100,
            tabWidth: 2,
            useTabs: false,
            bracketSpacing: true,
            arrowParens: 'avoid',
            endOfLine: 'lf',
            parser: 'typescript'
        };
    }
    /**
     * Convert TypeScript diagnostic category to string
     */
    getDiagnosticCategory(category) {
        switch (category) {
            case ts_morph_1.ts.DiagnosticCategory.Error:
                return 'error';
            case ts_morph_1.ts.DiagnosticCategory.Warning:
                return 'warning';
            case ts_morph_1.ts.DiagnosticCategory.Suggestion:
                return 'suggestion';
            case ts_morph_1.ts.DiagnosticCategory.Message:
                return 'message';
            default:
                return 'error';
        }
    }
    /**
     * Validate single file
     */
    async validateFile(filePath) {
        return this.validateGeneratedCode([filePath]);
    }
    /**
     * Get validation configuration
     */
    getConfiguration() {
        return { ...this.options };
    }
    /**
     * Update validation configuration
     */
    updateConfiguration(options) {
        this.options = { ...this.options, ...options };
        // Reinitialize ESLint if config changed
        if (options.eslintConfig) {
            this.eslint = new eslint_1.ESLint({
                overrideConfigFile: true,
                overrideConfig: options.eslintConfig,
                fix: this.options.fixableIssues || false
            });
        }
        // Reinitialize TypeScript project if config changed
        if (options.typescriptConfig) {
            this.project = new ts_morph_1.Project({
                compilerOptions: options.typescriptConfig
            });
        }
    }
}
exports.CodeQualityValidator = CodeQualityValidator;
//# sourceMappingURL=code-quality-validator.js.map