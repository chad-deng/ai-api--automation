import { AnalysisResult, EndpointInfo } from './analyzer';
export interface TestFile {
    filename: string;
    endpoints: EndpointInfo[];
    requiresAuth: boolean;
}
export interface TestPlan {
    testFiles: TestFile[];
    setupFiles: string[];
    serverUrl: string;
    hasAuth: boolean;
}
export declare class SimplePlanner {
    plan(analysis: AnalysisResult): TestPlan;
    private groupEndpoints;
}
