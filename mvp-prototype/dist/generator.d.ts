export declare class MVPGenerator {
    private parser;
    private analyzer;
    private planner;
    generate(specPath: string, outputDir: string): Promise<void>;
    private generateTests;
    private loadTemplate;
    private getExpectedStatus;
    private generateTestData;
    private generatePackageFiles;
}
