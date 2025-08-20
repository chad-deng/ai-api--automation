/**
 * Minimal MVP CLI Implementation
 * Focused on core OpenAPI test generation only
 */
import { CLIResult } from './types';
export declare class CLI {
    private program;
    private parser;
    private validator;
    private generator;
    constructor();
    /**
     * Set up all CLI commands and options
     */
    private setupCommands;
    /**
     * Generate tests from OpenAPI specification
     */
    private generateTests;
    /**
     * Validate OpenAPI specification
     */
    private validateSpec;
    /**
     * Run CLI with provided arguments
     */
    run(argv?: string[]): Promise<CLIResult>;
}
export default CLI;
//# sourceMappingURL=cli-mvp.d.ts.map