/**
 * Jest Setup - Global test configuration
 * Week 1 Sprint 1: TDD Foundation
 */
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidOpenAPISpec(): R;
            toHaveValidTypeScript(): R;
            toGenerateWorkingTests(): R;
        }
    }
}
export declare const createMockOpenAPISpec: (overrides?: any) => any;
export declare const createMockEndpoint: (overrides?: any) => any;
export declare class PerformanceTimer {
    private startTime;
    start(): void;
    end(): number;
}
export declare const getMemoryUsage: () => NodeJS.MemoryUsage;
export declare const createTempTestFile: (content: string) => string;
export declare const cleanupTempFile: (filePath: string) => void;
//# sourceMappingURL=setup.d.ts.map