import { OpenAPISpec } from './parser';
export interface TestDataConfig {
    useRealistic: boolean;
    includeBoundaryValues: boolean;
    generateInvalidData: boolean;
}
export declare class SchemaAwareDataGenerator {
    private spec;
    constructor(spec: OpenAPISpec);
    generateTestData(schemaRef: string | any, config?: TestDataConfig): any;
    private generateFromSchema;
    private generateObjectData;
    private generateArrayData;
    private generateStringData;
    private generateNumberData;
    private generateBooleanData;
    private generateFallbackData;
    generateInvalidTestData(schemaRef: string | any): any;
    private generateInvalidFromSchema;
}
