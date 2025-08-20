/**
 * Test Report Generator
 * Week 5 Sprint 1: Comprehensive test result reporting with HTML/PDF output
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { GenerationResult, TestCase } from '../generator/test-generator';
import { PerformanceResult, PerformanceMetrics } from '../performance/performance-tester';

export interface ReportConfig {
  outputDir: string;
  format: 'html' | 'pdf' | 'json' | 'junit' | 'markdown';
  title?: string;
  includeDetails?: boolean;
  includeCharts?: boolean;
  theme?: 'light' | 'dark';
  customCSS?: string;
  templatePath?: string;
}

export interface TestResults {
  generation?: GenerationResult;
  performance?: PerformanceResult;
  functional?: FunctionalTestResults;
  contract?: ContractTestResults;
  security?: SecurityTestResults;
}

export interface FunctionalTestResults {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
  };
  suites: TestSuite[];
  coverage?: CoverageReport;
}

export interface TestSuite {
  name: string;
  duration: number;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: string;
}

export interface CoverageReport {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  files: FileCoverage[];
}

export interface FileCoverage {
  path: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface ContractTestResults {
  summary: {
    totalContracts: number;
    validContracts: number;
    invalidContracts: number;
  };
  violations: ContractViolation[];
}

export interface ContractViolation {
  endpoint: string;
  method: string;
  type: 'request' | 'response' | 'header';
  expected: any;
  actual: any;
  description: string;
}

export interface SecurityTestResults {
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  vulnerabilities: SecurityVulnerability[];
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  endpoint: string;
  method: string;
  evidence: string;
  recommendation: string;
}

export interface ReportResult {
  success: boolean;
  outputPath: string;
  format: string;
  size: number;
  generationTime: number;
  errors: string[];
}

export class ReportGenerator {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(results: TestResults, config: ReportConfig): Promise<ReportResult> {
    const startTime = Date.now();

    try {
      // Ensure output directory exists
      await fs.mkdir(config.outputDir, { recursive: true });

      let outputPath: string;
      let reportContent: string;

      switch (config.format) {
        case 'html':
          reportContent = await this.generateHTMLReport(results, config);
          outputPath = path.join(config.outputDir, 'test-report.html');
          break;
        case 'pdf':
          reportContent = await this.generatePDFReport(results, config);
          outputPath = path.join(config.outputDir, 'test-report.pdf');
          break;
        case 'json':
          reportContent = await this.generateJSONReport(results, config);
          outputPath = path.join(config.outputDir, 'test-report.json');
          break;
        case 'junit':
          reportContent = await this.generateJUnitReport(results, config);
          outputPath = path.join(config.outputDir, 'junit-report.xml');
          break;
        case 'markdown':
          reportContent = await this.generateMarkdownReport(results, config);
          outputPath = path.join(config.outputDir, 'test-report.md');
          break;
        default:
          throw new Error(`Unsupported report format: ${config.format}`);
      }

      // Write report to file
      await fs.writeFile(outputPath, reportContent, 'utf8');
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const generationTime = Date.now() - startTime;

      return {
        success: true,
        outputPath,
        format: config.format,
        size: stats.size,
        generationTime,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        outputPath: '',
        format: config.format,
        size: 0,
        generationTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(results: TestResults, config: ReportConfig): Promise<string> {
    const template = await this.getTemplate('html');
    const title = config.title || 'API Test Report';
    
    const reportData = {
      title,
      timestamp: new Date().toISOString(),
      summary: this.generateSummarySection(results),
      performance: this.generatePerformanceSection(results.performance),
      functional: this.generateFunctionalSection(results.functional),
      contract: this.generateContractSection(results.contract),
      security: this.generateSecuritySection(results.security),
      generation: this.generateGenerationSection(results.generation),
      charts: config.includeCharts ? this.generateChartData(results) : null,
      theme: config.theme || 'light',
      customCSS: config.customCSS || ''
    };

    return this.renderTemplate(template, reportData);
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(results: TestResults, config: ReportConfig): Promise<string> {
    // For now, generate HTML and note that PDF would require additional conversion
    // In production, this would use libraries like Puppeteer or similar
    const htmlContent = await this.generateHTMLReport(results, config);
    
    // Placeholder - in production would convert HTML to PDF
    return `<!-- PDF Report Placeholder -->\n${htmlContent}`;
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(results: TestResults, config: ReportConfig): Promise<string> {
    const reportData = {
      metadata: {
        title: config.title || 'API Test Report',
        timestamp: new Date().toISOString(),
        format: 'json',
        version: '1.0.0'
      },
      summary: this.calculateOverallSummary(results),
      results: {
        generation: results.generation,
        performance: results.performance,
        functional: results.functional,
        contract: results.contract,
        security: results.security
      }
    };

    return JSON.stringify(reportData, null, 2);
  }

  /**
   * Generate JUnit XML report
   */
  private async generateJUnitReport(results: TestResults, config: ReportConfig): Promise<string> {
    const summary = this.calculateOverallSummary(results);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuites name="${config.title || 'API Tests'}" `;
    xml += `tests="${summary.totalTests}" `;
    xml += `failures="${summary.failures}" `;
    xml += `errors="${summary.errors}" `;
    xml += `time="${summary.duration}">\n`;

    // Add functional test suites
    if (results.functional?.suites) {
      for (const suite of results.functional.suites) {
        xml += `  <testsuite name="${suite.name}" `;
        xml += `tests="${suite.tests.length}" `;
        xml += `failures="${suite.failed}" `;
        xml += `errors="0" `;
        xml += `time="${suite.duration}">\n`;

        for (const test of suite.tests) {
          xml += `    <testcase name="${test.name}" time="${test.duration}"`;
          if (test.status === 'failed') {
            xml += `>\n      <failure message="${test.error || 'Test failed'}">${test.details || ''}</failure>\n    </testcase>\n`;
          } else if (test.status === 'skipped') {
            xml += `>\n      <skipped/>\n    </testcase>\n`;
          } else {
            xml += `/>\n`;
          }
        }

        xml += `  </testsuite>\n`;
      }
    }

    // Add performance test suite
    if (results.performance) {
      xml += `  <testsuite name="Performance Tests" tests="1" failures="${results.performance.success ? 0 : 1}" errors="0" time="${results.performance.summary.duration}">\n`;
      xml += `    <testcase name="Performance Test" time="${results.performance.summary.duration}"`;
      if (!results.performance.success) {
        xml += `>\n      <failure message="Performance thresholds not met">${results.performance.errors.join(', ')}</failure>\n    </testcase>\n`;
      } else {
        xml += `/>\n`;
      }
      xml += `  </testsuite>\n`;
    }

    xml += `</testsuites>`;
    return xml;
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(results: TestResults, config: ReportConfig): Promise<string> {
    const title = config.title || 'API Test Report';
    const timestamp = new Date().toLocaleString();
    const summary = this.calculateOverallSummary(results);

    let markdown = `# ${title}\n\n`;
    markdown += `**Generated:** ${timestamp}\n\n`;

    // Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${summary.totalTests} |\n`;
    markdown += `| Passed | ${summary.passed} |\n`;
    markdown += `| Failed | ${summary.failures} |\n`;
    markdown += `| Success Rate | ${summary.successRate.toFixed(2)}% |\n`;
    markdown += `| Duration | ${summary.duration.toFixed(2)}s |\n\n`;

    // Performance Results
    if (results.performance) {
      markdown += `## Performance Results\n\n`;
      const perf = results.performance;
      markdown += `| Metric | Value |\n`;
      markdown += `|--------|-------|\n`;
      markdown += `| Throughput | ${perf.summary.throughput.toFixed(2)} req/s |\n`;
      markdown += `| Avg Response Time | ${perf.metrics.responseTime.avg.toFixed(2)}ms |\n`;
      markdown += `| 95th Percentile | ${perf.metrics.responseTime.p95.toFixed(2)}ms |\n`;
      markdown += `| Error Rate | ${perf.summary.errorRate.toFixed(2)}% |\n\n`;

      // Threshold Results
      if (perf.thresholdResults.length > 0) {
        markdown += `### Performance Thresholds\n\n`;
        markdown += `| Threshold | Expected | Actual | Status |\n`;
        markdown += `|-----------|----------|--------|--------|\n`;
        
        for (const threshold of perf.thresholdResults) {
          const status = threshold.passed ? '✅ PASS' : '❌ FAIL';
          markdown += `| ${threshold.name} | ${threshold.threshold} | ${threshold.actual.toFixed(2)} | ${status} |\n`;
        }
        markdown += `\n`;
      }
    }

    // Functional Test Results
    if (results.functional) {
      markdown += `## Functional Test Results\n\n`;
      const func = results.functional;
      
      for (const suite of func.suites) {
        markdown += `### ${suite.name}\n\n`;
        markdown += `- **Passed:** ${suite.passed}\n`;
        markdown += `- **Failed:** ${suite.failed}\n`;
        markdown += `- **Skipped:** ${suite.skipped}\n`;
        markdown += `- **Duration:** ${suite.duration.toFixed(2)}s\n\n`;

        if (suite.tests.some(t => t.status === 'failed')) {
          markdown += `#### Failed Tests\n\n`;
          const failedTests = suite.tests.filter(t => t.status === 'failed');
          for (const test of failedTests) {
            markdown += `- **${test.name}**: ${test.error}\n`;
          }
          markdown += `\n`;
        }
      }
    }

    // Security Results
    if (results.security && results.security.vulnerabilities.length > 0) {
      markdown += `## Security Vulnerabilities\n\n`;
      
      const highVulns = results.security.vulnerabilities.filter(v => v.severity === 'high');
      const mediumVulns = results.security.vulnerabilities.filter(v => v.severity === 'medium');
      const lowVulns = results.security.vulnerabilities.filter(v => v.severity === 'low');

      if (highVulns.length > 0) {
        markdown += `### 🔴 High Severity\n\n`;
        for (const vuln of highVulns) {
          markdown += `#### ${vuln.title}\n`;
          markdown += `- **Endpoint:** \`${vuln.method} ${vuln.endpoint}\`\n`;
          markdown += `- **Description:** ${vuln.description}\n`;
          markdown += `- **Recommendation:** ${vuln.recommendation}\n\n`;
        }
      }

      if (mediumVulns.length > 0) {
        markdown += `### 🟡 Medium Severity\n\n`;
        for (const vuln of mediumVulns) {
          markdown += `#### ${vuln.title}\n`;
          markdown += `- **Endpoint:** \`${vuln.method} ${vuln.endpoint}\`\n`;
          markdown += `- **Description:** ${vuln.description}\n\n`;
        }
      }

      if (lowVulns.length > 0) {
        markdown += `### 🟢 Low Severity\n\n`;
        for (const vuln of lowVulns) {
          markdown += `- **${vuln.title}** (\`${vuln.method} ${vuln.endpoint}\`): ${vuln.description}\n`;
        }
        markdown += `\n`;
      }
    }

    // Generation Results
    if (results.generation) {
      markdown += `## Test Generation Summary\n\n`;
      const gen = results.generation;
      markdown += `- **Generated Tests:** ${gen.summary.totalTests}\n`;
      markdown += `- **Operations Covered:** ${gen.summary.operationsCovered}/${gen.summary.totalOperations}\n`;
      markdown += `- **Coverage:** ${gen.summary.coveragePercentage}%\n`;
      markdown += `- **Frameworks:** ${gen.summary.frameworks.join(', ')}\n`;
      markdown += `- **Generated Files:** ${gen.generatedFiles.length}\n\n`;
    }

    return markdown;
  }

  /**
   * Generate summary section
   */
  private generateSummarySection(results: TestResults): any {
    const summary = this.calculateOverallSummary(results);
    
    return {
      totalTests: summary.totalTests,
      passed: summary.passed,
      failed: summary.failures,
      skipped: summary.skipped,
      successRate: summary.successRate,
      duration: summary.duration,
      status: summary.successRate >= 90 ? 'success' : summary.successRate >= 70 ? 'warning' : 'danger'
    };
  }

  /**
   * Generate performance section
   */
  private generatePerformanceSection(performance?: PerformanceResult): any {
    if (!performance) return null;

    return {
      summary: performance.summary,
      metrics: {
        avgResponseTime: performance.metrics.responseTime.avg,
        p95ResponseTime: performance.metrics.responseTime.p95,
        p99ResponseTime: performance.metrics.responseTime.p99,
        throughput: performance.summary.throughput,
        errorRate: performance.summary.errorRate
      },
      thresholds: performance.thresholdResults,
      distribution: performance.metrics.responseTime.distribution
    };
  }

  /**
   * Generate functional section
   */
  private generateFunctionalSection(functional?: FunctionalTestResults): any {
    if (!functional) return null;

    return {
      summary: functional.summary,
      suites: functional.suites.map(suite => ({
        name: suite.name,
        duration: suite.duration,
        passed: suite.passed,
        failed: suite.failed,
        skipped: suite.skipped,
        failedTests: suite.tests.filter(t => t.status === 'failed')
      })),
      coverage: functional.coverage
    };
  }

  /**
   * Generate contract section
   */
  private generateContractSection(contract?: ContractTestResults): any {
    if (!contract) return null;

    return {
      summary: contract.summary,
      violations: contract.violations
    };
  }

  /**
   * Generate security section
   */
  private generateSecuritySection(security?: SecurityTestResults): any {
    if (!security) return null;

    const groupedVulns = {
      high: security.vulnerabilities.filter(v => v.severity === 'high'),
      medium: security.vulnerabilities.filter(v => v.severity === 'medium'),
      low: security.vulnerabilities.filter(v => v.severity === 'low')
    };

    return {
      summary: security.summary,
      vulnerabilities: groupedVulns
    };
  }

  /**
   * Generate generation section
   */
  private generateGenerationSection(generation?: GenerationResult): any {
    if (!generation) return null;

    return {
      success: generation.success,
      summary: generation.summary,
      generatedFiles: generation.generatedFiles,
      errors: generation.errors,
      warnings: generation.warnings
    };
  }

  /**
   * Generate chart data
   */
  private generateChartData(results: TestResults): any {
    const charts: any = {};

    // Performance timeline chart
    if (results.performance) {
      charts.performanceTimeline = {
        type: 'line',
        data: results.performance.metrics.throughput.timeline.map(point => ({
          x: point.timestamp,
          y: point.rps
        })),
        options: {
          title: 'Throughput Over Time',
          xAxisLabel: 'Time',
          yAxisLabel: 'Requests per Second'
        }
      };

      // Response time distribution chart
      charts.responseTimeDistribution = {
        type: 'bar',
        data: Object.entries(results.performance.metrics.responseTime.distribution).map(([range, count]) => ({
          label: range,
          value: count
        })),
        options: {
          title: 'Response Time Distribution',
          xAxisLabel: 'Response Time Range',
          yAxisLabel: 'Number of Requests'
        }
      };
    }

    // Test results pie chart
    if (results.functional) {
      const summary = results.functional.summary;
      charts.testResults = {
        type: 'pie',
        data: [
          { label: 'Passed', value: summary.passedTests, color: '#28a745' },
          { label: 'Failed', value: summary.failedTests, color: '#dc3545' },
          { label: 'Skipped', value: summary.skippedTests, color: '#ffc107' }
        ],
        options: {
          title: 'Test Results Distribution'
        }
      };
    }

    return charts;
  }

  /**
   * Calculate overall summary
   */
  private calculateOverallSummary(results: TestResults): any {
    let totalTests = 0;
    let passed = 0;
    let failures = 0;
    let skipped = 0;
    let errors = 0;
    let duration = 0;

    // Add generation results
    if (results.generation) {
      totalTests += results.generation.summary.totalTests;
      if (results.generation.success) {
        passed += results.generation.summary.totalTests;
      } else {
        failures += results.generation.errors.length;
      }
    }

    // Add functional results
    if (results.functional) {
      totalTests += results.functional.summary.totalTests;
      passed += results.functional.summary.passedTests;
      failures += results.functional.summary.failedTests;
      skipped += results.functional.summary.skippedTests;
      duration += results.functional.summary.duration;
    }

    // Add performance results
    if (results.performance) {
      totalTests += 1; // Performance test counts as one test
      if (results.performance.success) {
        passed += 1;
      } else {
        failures += 1;
      }
      duration = Math.max(duration, results.performance.summary.duration);
    }

    // Add contract results
    if (results.contract) {
      totalTests += results.contract.summary.totalContracts;
      passed += results.contract.summary.validContracts;
      failures += results.contract.summary.invalidContracts;
    }

    // Add security results
    if (results.security) {
      totalTests += results.security.summary.totalChecks;
      passed += results.security.summary.passedChecks;
      failures += results.security.summary.failedChecks;
    }

    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;

    return {
      totalTests,
      passed,
      failures,
      errors,
      skipped,
      successRate,
      duration
    };
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // HTML template
    this.templates.set('html', `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { background: white; margin-bottom: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-success { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-danger { color: #dc3545; }
        .performance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .chart-container { height: 300px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .vulnerability { padding: 15px; margin: 10px 0; border-left: 4px solid; border-radius: 4px; }
        .vulnerability.high { border-color: #dc3545; background-color: #f8d7da; }
        .vulnerability.medium { border-color: #ffc107; background-color: #fff3cd; }
        .vulnerability.low { border-color: #28a745; background-color: #d4edda; }
        {{customCSS}}
    </style>
</head>
<body>
    <div class="header">
        <h1>{{title}}</h1>
        <p>Generated on {{timestamp}}</p>
    </div>

    {{#summary}}
    <div class="summary">
        <div class="summary-card">
            <div class="metric-value status-{{status}}">{{totalTests}}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="summary-card">
            <div class="metric-value status-success">{{passed}}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="summary-card">
            <div class="metric-value status-danger">{{failed}}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="summary-card">
            <div class="metric-value">{{successRate}}%</div>
            <div class="metric-label">Success Rate</div>
        </div>
    </div>
    {{/summary}}

    {{#performance}}
    <div class="section">
        <h2>Performance Results</h2>
        <div class="performance-grid">
            <div class="summary-card">
                <div class="metric-value">{{metrics.avgResponseTime}}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="summary-card">
                <div class="metric-value">{{metrics.throughput}}</div>
                <div class="metric-label">Requests/sec</div>
            </div>
            <div class="summary-card">
                <div class="metric-value">{{metrics.errorRate}}%</div>
                <div class="metric-label">Error Rate</div>
            </div>
        </div>
    </div>
    {{/performance}}

    {{#charts}}
    <div class="section">
        <h2>Performance Charts</h2>
        <div class="chart-container">
            <!-- Charts would be rendered here with a charting library -->
            <p>Charts require JavaScript charting library integration</p>
        </div>
    </div>
    {{/charts}}

</body>
</html>
    `);
  }

  /**
   * Get template
   */
  private async getTemplate(type: string): Promise<string> {
    return this.templates.get(type) || '';
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: any): string {
    // Simple template rendering - in production would use a proper template engine
    let rendered = template;
    
    // Replace simple placeholders
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });

    // Handle sections (very basic implementation)
    rendered = rendered.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, key, content) => {
      if (data[key]) {
        return content;
      }
      return '';
    });

    return rendered;
  }

  /**
   * Generate dashboard report with multiple test runs
   */
  async generateDashboard(testRuns: TestResults[], config: ReportConfig): Promise<ReportResult> {
    // This would generate a comprehensive dashboard showing trends over time
    // For now, just generate a summary report
    
    const latestResults = testRuns[testRuns.length - 1];
    return this.generateReport(latestResults, config);
  }
}

export default ReportGenerator;