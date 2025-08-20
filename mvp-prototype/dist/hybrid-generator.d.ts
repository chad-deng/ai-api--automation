export declare class HybridGenerator {
    private parser;
    private analyzer;
    private planner;
    private astGenerator?;
    generate(specPath: string, outputDir: string): Promise<void>;
    private generateTests;
    private generatePackageFiles;
}
