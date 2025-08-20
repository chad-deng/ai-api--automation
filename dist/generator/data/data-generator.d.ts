/**
 * Schema-Based Test Data Generator
 * Week 2 Sprint 1: Realistic and comprehensive test data generation
 */
import { Schema, Parameter } from '../../types';
export interface DataGenerationOptions {
    useExamples: boolean;
    generateEdgeCases: boolean;
    includeNull: boolean;
    includeUndefined: boolean;
    maxStringLength: number;
    maxArrayItems: number;
    maxObjectDepth: number;
    seed?: number;
    locale?: string;
}
export interface DataGenerationResult {
    value: any;
    type: 'valid' | 'invalid' | 'edge' | 'minimal' | 'maximal';
    metadata: DataMetadata;
}
export interface DataMetadata {
    schema: Schema;
    constraints: string[];
    generatedFields: string[];
    generationTime: number;
}
export interface FakerConfig {
    enabled: boolean;
    categories: string[];
    customProviders: Record<string, () => any>;
}
export declare class DataGenerator {
    private options;
    private rng;
    private generationStack;
    constructor(options?: Partial<DataGenerationOptions>);
    /**
     * Generate test data from OpenAPI schema
     */
    generateFromSchema(schema: Schema, type?: 'valid' | 'invalid' | 'edge' | 'minimal' | 'maximal'): Promise<DataGenerationResult>;
    /**
     * Generate parameter data
     */
    generateParameterData(parameter: Parameter, type?: 'valid' | 'invalid' | 'edge'): Promise<any>;
    /**
     * Generate request body data
     */
    generateRequestBodyData(requestBody: any, contentType?: string, type?: 'valid' | 'invalid' | 'edge'): Promise<any>;
    /**
     * Generate batch test data
     */
    generateBatch(schema: Schema, count: number, types?: ('valid' | 'invalid' | 'edge' | 'minimal' | 'maximal')[]): Promise<DataGenerationResult[]>;
    /**
     * Core value generation logic
     */
    private generateValue;
    /**
     * String value generation
     */
    private generateStringValue;
    /**
     * Number value generation
     */
    private generateNumberValue;
    /**
     * Integer value generation
     */
    private generateIntegerValue;
    /**
     * Boolean value generation
     */
    private generateBooleanValue;
    /**
     * Array value generation
     */
    private generateArrayValue;
    /**
     * Object value generation
     */
    private generateObjectValue;
    /**
     * Helper methods for specific string formats
     */
    private generateFormattedString;
    private generatePatternString;
    private generateInvalidString;
    private generateRandomString;
    private generateUUID;
    /**
     * Schema composition handlers
     */
    private generateAllOfValue;
    private generateOneOfValue;
    private generateAnyOfValue;
    private generateUnknownTypeValue;
    /**
     * Utility methods
     */
    private mergeSchemas;
    private extractConstraints;
    private createSeededRandom;
    /**
     * Public utility methods
     */
    resetSeed(seed?: number): void;
    updateOptions(options: Partial<DataGenerationOptions>): void;
    getGenerationStatistics(): {
        maxDepthReached: number;
        generationStackSize: number;
        currentOptions: DataGenerationOptions;
    };
}
//# sourceMappingURL=data-generator.d.ts.map