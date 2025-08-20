/**
 * Security Scanner
 * Week 6 Sprint 1: Comprehensive security scanning and vulnerability assessment
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { ParsedOpenAPI, Operation } from '../types';
import { OpenAPIParser } from '../parser/openapi-parser';

export interface SecurityScanConfig {
  specPath?: string;
  baseURL?: string;
  authProfile?: string;
  scanTypes: SecurityScanType[];
  outputDir: string;
  format: 'json' | 'html' | 'sarif' | 'xml';
  severity: SecuritySeverity[];
  excludeRules?: string[];
  customRules?: SecurityRule[];
  thresholds?: SecurityThresholds;
}

export type SecurityScanType = 
  | 'owasp-top-10'
  | 'injection'
  | 'authentication'
  | 'authorization'
  | 'data-exposure'
  | 'security-misconfiguration'
  | 'vulnerable-components'
  | 'insufficient-logging'
  | 'cors'
  | 'ssl-tls'
  | 'rate-limiting'
  | 'input-validation';

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: SecuritySeverity;
  category: SecurityScanType;
  pattern?: RegExp;
  check: (context: SecurityCheckContext) => Promise<SecurityFinding[]>;
}

export interface SecurityCheckContext {
  operation: Operation;
  endpoint: string;
  method: string;
  spec: ParsedOpenAPI;
  response?: any;
  headers?: Record<string, string>;
}

export interface SecurityFinding {
  ruleId: string;
  severity: SecuritySeverity;
  title: string;
  description: string;
  location: SecurityLocation;
  evidence?: any;
  remediation: string;
  cwe?: string;
  cvss?: SecurityCVSS;
}

export interface SecurityLocation {
  endpoint: string;
  method: string;
  parameter?: string;
  line?: number;
  column?: number;
}

export interface SecurityCVSS {
  score: number;
  vector: string;
  attackVector: 'network' | 'adjacent' | 'local' | 'physical';
  attackComplexity: 'low' | 'high';
  privilegesRequired: 'none' | 'low' | 'high';
  userInteraction: 'none' | 'required';
  scope: 'unchanged' | 'changed';
  confidentialityImpact: 'none' | 'low' | 'high';
  integrityImpact: 'none' | 'low' | 'high';
  availabilityImpact: 'none' | 'low' | 'high';
}

export interface SecurityThresholds {
  maxCritical: number;
  maxHigh: number;
  maxMedium: number;
  maxTotal: number;
  failOnCritical: boolean;
  failOnHigh: boolean;
}

export interface SecurityScanResult {
  summary: SecuritySummary;
  findings: SecurityFinding[];
  coverage: SecurityCoverage;
  thresholdResults: ThresholdResult[];
  scanTime: number;
  metadata: SecurityMetadata;
}

export interface SecuritySummary {
  totalFindings: number;
  findingsBySeverity: Record<SecuritySeverity, number>;
  findingsByCategory: Record<SecurityScanType, number>;
  riskScore: number;
  complianceScore: number;
}

export interface SecurityCoverage {
  endpointsCovered: number;
  totalEndpoints: number;
  coveragePercentage: number;
  rulesCovered: string[];
  rulesSkipped: string[];
}

export interface ThresholdResult {
  threshold: string;
  expected: number;
  actual: number;
  passed: boolean;
  message: string;
}

export interface SecurityMetadata {
  scanId: string;
  timestamp: number;
  duration: number;
  scanner: string;
  version: string;
  configuration: SecurityScanConfig;
}

export class SecurityScanner extends EventEmitter {
  private rules: Map<string, SecurityRule> = new Map();
  private findings: SecurityFinding[] = [];
  private scanId: string;

  constructor() {
    super();
    this.scanId = crypto.randomUUID();
    this.loadDefaultRules();
  }

  /**
   * Run security scan
   */
  async runScan(config: SecurityScanConfig): Promise<SecurityScanResult> {
    const startTime = Date.now();
    this.emit('scanStarted', { scanId: this.scanId, config });

    try {
      // Clear previous findings
      this.findings = [];

      // Load OpenAPI spec if provided
      let spec: ParsedOpenAPI | undefined;
      if (config.specPath) {
        spec = await this.loadSpec(config.specPath);
      }

      // Run security checks
      await this.runSecurityChecks(config, spec);

      // Generate results
      const result = this.generateScanResult(config, startTime, spec);

      // Save results
      await this.saveResults(result, config);

      this.emit('scanCompleted', result);
      return result;

    } catch (error) {
      this.emit('scanError', error);
      throw error;
    }
  }

  /**
   * Load OpenAPI specification
   */
  private async loadSpec(specPath: string): Promise<ParsedOpenAPI> {
    const parser = new OpenAPIParser();
    const result = await parser.parseFromFile(specPath, { strict: false });
    
    if (!result.success || !result.spec) {
      throw new Error(`Failed to parse OpenAPI spec: ${result.error}`);
    }

    return result.spec;
  }

  /**
   * Run security checks based on configuration
   */
  private async runSecurityChecks(config: SecurityScanConfig, spec?: ParsedOpenAPI): Promise<void> {
    // Filter rules based on scan types
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => config.scanTypes.includes(rule.category))
      .filter(rule => !config.excludeRules?.includes(rule.id))
      .filter(rule => config.severity.includes(rule.severity));

    // Add custom rules
    if (config.customRules) {
      applicableRules.push(...config.customRules);
    }

    this.emit('checksStarted', { ruleCount: applicableRules.length });

    // Run checks on OpenAPI spec
    if (spec) {
      await this.runSpecChecks(applicableRules, config, spec);
    }

    // Run runtime checks if base URL provided
    if (config.baseURL) {
      await this.runRuntimeChecks(applicableRules, config, spec);
    }

    this.emit('checksCompleted', { findingsCount: this.findings.length });
  }

  /**
   * Run security checks on OpenAPI specification
   */
  private async runSpecChecks(
    rules: SecurityRule[],
    config: SecurityScanConfig,
    spec: ParsedOpenAPI
  ): Promise<void> {
    if (!spec.paths) return;

    const operations = await new OpenAPIParser().extractOperations(spec);

    for (const { method, path, operation } of operations) {
      const context: SecurityCheckContext = {
        operation,
        endpoint: path,
        method,
        spec
      };

      for (const rule of rules) {
        try {
          const findings = await rule.check(context);
          this.findings.push(...findings);
          this.emit('findingDetected', { rule: rule.id, findings: findings.length });
        } catch (error) {
          this.emit('ruleError', { rule: rule.id, error });
        }
      }
    }
  }

  /**
   * Run runtime security checks
   */
  private async runRuntimeChecks(
    rules: SecurityRule[],
    config: SecurityScanConfig,
    spec?: ParsedOpenAPI
  ): Promise<void> {
    // Runtime checks would involve making actual HTTP requests
    // This is a simplified implementation
    this.emit('runtimeChecksStarted');

    // Example: SSL/TLS checks
    if (config.scanTypes.includes('ssl-tls')) {
      await this.checkSSLTLS(config.baseURL!);
    }

    // Example: CORS checks
    if (config.scanTypes.includes('cors')) {
      await this.checkCORS(config.baseURL!);
    }

    this.emit('runtimeChecksCompleted');
  }

  /**
   * Check SSL/TLS configuration
   */
  private async checkSSLTLS(baseURL: string): Promise<void> {
    const url = new URL(baseURL);
    
    if (url.protocol !== 'https:') {
      this.findings.push({
        ruleId: 'ssl-tls-001',
        severity: 'high',
        title: 'Insecure Protocol Used',
        description: 'API is using HTTP instead of HTTPS',
        location: { endpoint: baseURL, method: 'ANY' },
        remediation: 'Configure the API to use HTTPS with proper SSL/TLS certificates',
        cwe: 'CWE-319'
      });
    }
  }

  /**
   * Check CORS configuration
   */
  private async checkCORS(baseURL: string): Promise<void> {
    try {
      // This would make an actual OPTIONS request in a real implementation
      // For now, we'll create a placeholder finding
      this.findings.push({
        ruleId: 'cors-001',
        severity: 'info',
        title: 'CORS Configuration Check',
        description: 'CORS headers should be properly configured',
        location: { endpoint: baseURL, method: 'OPTIONS' },
        remediation: 'Ensure CORS headers are properly configured to restrict cross-origin requests'
      });
    } catch (error) {
      // Handle request errors
    }
  }

  /**
   * Generate scan result
   */
  private generateScanResult(
    config: SecurityScanConfig,
    startTime: number,
    spec?: ParsedOpenAPI
  ): SecurityScanResult {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate summary
    const summary = this.calculateSummary();
    
    // Calculate coverage
    const coverage = this.calculateCoverage(spec);
    
    // Check thresholds
    const thresholdResults = this.checkThresholds(config.thresholds, summary);

    return {
      summary,
      findings: this.findings,
      coverage,
      thresholdResults,
      scanTime: duration,
      metadata: {
        scanId: this.scanId,
        timestamp: startTime,
        duration,
        scanner: 'API Security Scanner',
        version: '1.0.0',
        configuration: config
      }
    };
  }

  /**
   * Calculate security summary
   */
  private calculateSummary(): SecuritySummary {
    const findingsBySeverity: Record<SecuritySeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    const findingsByCategory: Record<SecurityScanType, number> = {
      'owasp-top-10': 0,
      'injection': 0,
      'authentication': 0,
      'authorization': 0,
      'data-exposure': 0,
      'security-misconfiguration': 0,
      'vulnerable-components': 0,
      'insufficient-logging': 0,
      'cors': 0,
      'ssl-tls': 0,
      'rate-limiting': 0,
      'input-validation': 0
    };

    this.findings.forEach(finding => {
      findingsBySeverity[finding.severity]++;
      const rule = this.rules.get(finding.ruleId);
      if (rule) {
        findingsByCategory[rule.category]++;
      }
    });

    // Calculate risk score (weighted by severity)
    const riskScore = (
      findingsBySeverity.critical * 10 +
      findingsBySeverity.high * 7 +
      findingsBySeverity.medium * 4 +
      findingsBySeverity.low * 2 +
      findingsBySeverity.info * 1
    );

    // Calculate compliance score (inverse of risk)
    const maxPossibleRisk = this.findings.length * 10;
    const complianceScore = maxPossibleRisk > 0 ? 
      Math.max(0, 100 - (riskScore / maxPossibleRisk * 100)) : 100;

    return {
      totalFindings: this.findings.length,
      findingsBySeverity,
      findingsByCategory,
      riskScore,
      complianceScore
    };
  }

  /**
   * Calculate security coverage
   */
  private calculateCoverage(spec?: ParsedOpenAPI): SecurityCoverage {
    let totalEndpoints = 0;
    let endpointsCovered = 0;

    if (spec?.paths) {
      // Count total endpoints
      Object.values(spec.paths).forEach(pathItem => {
        if (pathItem) {
          ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].forEach(method => {
            if (pathItem[method]) totalEndpoints++;
          });
        }
      });

      // Count covered endpoints (simplified - based on findings)
      const coveredEndpoints = new Set(
        this.findings.map(f => `${f.location.method}:${f.location.endpoint}`)
      );
      endpointsCovered = coveredEndpoints.size;
    }

    const coveragePercentage = totalEndpoints > 0 ? 
      (endpointsCovered / totalEndpoints) * 100 : 0;

    return {
      endpointsCovered,
      totalEndpoints,
      coveragePercentage,
      rulesCovered: Array.from(new Set(this.findings.map(f => f.ruleId))),
      rulesSkipped: []
    };
  }

  /**
   * Check security thresholds
   */
  private checkThresholds(
    thresholds?: SecurityThresholds,
    summary?: SecuritySummary
  ): ThresholdResult[] {
    if (!thresholds || !summary) return [];

    const results: ThresholdResult[] = [];

    // Check critical findings
    results.push({
      threshold: 'maxCritical',
      expected: thresholds.maxCritical,
      actual: summary.findingsBySeverity.critical,
      passed: summary.findingsBySeverity.critical <= thresholds.maxCritical,
      message: `Critical findings: ${summary.findingsBySeverity.critical} (max: ${thresholds.maxCritical})`
    });

    // Check high findings
    results.push({
      threshold: 'maxHigh',
      expected: thresholds.maxHigh,
      actual: summary.findingsBySeverity.high,
      passed: summary.findingsBySeverity.high <= thresholds.maxHigh,
      message: `High findings: ${summary.findingsBySeverity.high} (max: ${thresholds.maxHigh})`
    });

    // Check medium findings
    results.push({
      threshold: 'maxMedium',
      expected: thresholds.maxMedium,
      actual: summary.findingsBySeverity.medium,
      passed: summary.findingsBySeverity.medium <= thresholds.maxMedium,
      message: `Medium findings: ${summary.findingsBySeverity.medium} (max: ${thresholds.maxMedium})`
    });

    // Check total findings
    results.push({
      threshold: 'maxTotal',
      expected: thresholds.maxTotal,
      actual: summary.totalFindings,
      passed: summary.totalFindings <= thresholds.maxTotal,
      message: `Total findings: ${summary.totalFindings} (max: ${thresholds.maxTotal})`
    });

    return results;
  }

  /**
   * Save scan results
   */
  private async saveResults(result: SecurityScanResult, config: SecurityScanConfig): Promise<void> {
    await fs.mkdir(config.outputDir, { recursive: true });

    const filename = `security-scan-${this.scanId}.${config.format}`;
    const filepath = path.join(config.outputDir, filename);

    let content: string;

    switch (config.format) {
      case 'json':
        content = JSON.stringify(result, null, 2);
        break;
      case 'html':
        content = this.generateHTMLReport(result);
        break;
      case 'sarif':
        content = this.generateSARIFReport(result);
        break;
      case 'xml':
        content = this.generateXMLReport(result);
        break;
      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    await fs.writeFile(filepath, content);
    this.emit('reportSaved', { filepath, format: config.format });
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(result: SecurityScanResult): string {
    const { summary, findings, metadata } = result;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Security Scan Report - ${metadata.scanId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #388e3c; }
        .info { color: #1976d2; }
        .findings { margin-top: 30px; }
        .finding { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .finding-header { font-weight: bold; margin-bottom: 10px; }
        .finding-description { margin: 10px 0; }
        .finding-remediation { background: #f9f9f9; padding: 10px; border-radius: 3px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Scan Report</h1>
        <p><strong>Scan ID:</strong> ${metadata.scanId}</p>
        <p><strong>Timestamp:</strong> ${new Date(metadata.timestamp).toISOString()}</p>
        <p><strong>Duration:</strong> ${(metadata.duration / 1000).toFixed(2)}s</p>
        <p><strong>Risk Score:</strong> ${summary.riskScore}</p>
        <p><strong>Compliance Score:</strong> ${summary.complianceScore.toFixed(1)}%</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Findings</h3>
            <div style="font-size: 2em; font-weight: bold;">${summary.totalFindings}</div>
        </div>
        <div class="metric">
            <h3>Critical</h3>
            <div class="critical" style="font-size: 2em; font-weight: bold;">${summary.findingsBySeverity.critical}</div>
        </div>
        <div class="metric">
            <h3>High</h3>
            <div class="high" style="font-size: 2em; font-weight: bold;">${summary.findingsBySeverity.high}</div>
        </div>
        <div class="metric">
            <h3>Medium</h3>
            <div class="medium" style="font-size: 2em; font-weight: bold;">${summary.findingsBySeverity.medium}</div>
        </div>
        <div class="metric">
            <h3>Low</h3>
            <div class="low" style="font-size: 2em; font-weight: bold;">${summary.findingsBySeverity.low}</div>
        </div>
    </div>

    <div class="findings">
        <h2>Security Findings</h2>
        ${findings.map(finding => `
        <div class="finding">
            <div class="finding-header ${finding.severity}">
                [${finding.severity.toUpperCase()}] ${finding.title}
            </div>
            <div><strong>Rule ID:</strong> ${finding.ruleId}</div>
            <div><strong>Location:</strong> ${finding.location.method} ${finding.location.endpoint}</div>
            ${finding.cwe ? `<div><strong>CWE:</strong> ${finding.cwe}</div>` : ''}
            <div class="finding-description">${finding.description}</div>
            <div class="finding-remediation">
                <strong>Remediation:</strong> ${finding.remediation}
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generate SARIF report
   */
  private generateSARIFReport(result: SecurityScanResult): string {
    const sarif = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [{
        tool: {
          driver: {
            name: 'API Security Scanner',
            version: '1.0.0',
            informationUri: 'https://example.com/security-scanner'
          }
        },
        results: result.findings.map(finding => ({
          ruleId: finding.ruleId,
          level: this.severityToSarifLevel(finding.severity),
          message: { text: finding.description },
          locations: [{
            physicalLocation: {
              artifactLocation: {
                uri: finding.location.endpoint
              }
            }
          }]
        }))
      }]
    };

    return JSON.stringify(sarif, null, 2);
  }

  /**
   * Generate XML report
   */
  private generateXMLReport(result: SecurityScanResult): string {
    const { summary, findings, metadata } = result;

    return `<?xml version="1.0" encoding="UTF-8"?>
<securityScanReport>
    <metadata>
        <scanId>${metadata.scanId}</scanId>
        <timestamp>${metadata.timestamp}</timestamp>
        <duration>${metadata.duration}</duration>
        <scanner>${metadata.scanner}</scanner>
    </metadata>
    <summary>
        <totalFindings>${summary.totalFindings}</totalFindings>
        <riskScore>${summary.riskScore}</riskScore>
        <complianceScore>${summary.complianceScore}</complianceScore>
        <findingsBySeverity>
            <critical>${summary.findingsBySeverity.critical}</critical>
            <high>${summary.findingsBySeverity.high}</high>
            <medium>${summary.findingsBySeverity.medium}</medium>
            <low>${summary.findingsBySeverity.low}</low>
            <info>${summary.findingsBySeverity.info}</info>
        </findingsBySeverity>
    </summary>
    <findings>
        ${findings.map(finding => `
        <finding>
            <ruleId>${finding.ruleId}</ruleId>
            <severity>${finding.severity}</severity>
            <title><![CDATA[${finding.title}]]></title>
            <description><![CDATA[${finding.description}]]></description>
            <location>
                <endpoint>${finding.location.endpoint}</endpoint>
                <method>${finding.location.method}</method>
            </location>
            <remediation><![CDATA[${finding.remediation}]]></remediation>
            ${finding.cwe ? `<cwe>${finding.cwe}</cwe>` : ''}
        </finding>
        `).join('')}
    </findings>
</securityScanReport>`;
  }

  /**
   * Convert severity to SARIF level
   */
  private severityToSarifLevel(severity: SecuritySeverity): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      case 'info':
        return 'note';
      default:
        return 'note';
    }
  }

  /**
   * Load default security rules
   */
  private loadDefaultRules(): void {
    // OWASP Top 10 rules
    this.addRule({
      id: 'owasp-a01-001',
      name: 'Missing Authentication',
      description: 'Endpoint lacks proper authentication mechanisms',
      severity: 'high',
      category: 'authentication',
      check: async (context) => {
        const findings: SecurityFinding[] = [];
        
        if (!context.operation.security || context.operation.security.length === 0) {
          findings.push({
            ruleId: 'owasp-a01-001',
            severity: 'high',
            title: 'Missing Authentication',
            description: 'This endpoint does not require authentication',
            location: {
              endpoint: context.endpoint,
              method: context.method
            },
            remediation: 'Add appropriate authentication requirements to this endpoint',
            cwe: 'CWE-306'
          });
        }
        
        return findings;
      }
    });

    this.addRule({
      id: 'owasp-a03-001',
      name: 'Sensitive Data in URL',
      description: 'Potential sensitive data exposed in URL parameters',
      severity: 'medium',
      category: 'data-exposure',
      check: async (context) => {
        const findings: SecurityFinding[] = [];
        const sensitivePatterns = /password|secret|token|key|api[_-]?key|auth/i;
        
        if (context.operation.parameters) {
          context.operation.parameters.forEach((param: any) => {
            if (param.in === 'query' && sensitivePatterns.test(param.name)) {
              findings.push({
                ruleId: 'owasp-a03-001',
                severity: 'medium',
                title: 'Sensitive Data in URL',
                description: `Parameter '${param.name}' may contain sensitive data`,
                location: {
                  endpoint: context.endpoint,
                  method: context.method,
                  parameter: param.name
                },
                remediation: 'Move sensitive parameters to request headers or body',
                cwe: 'CWE-200'
              });
            }
          });
        }
        
        return findings;
      }
    });

    this.addRule({
      id: 'owasp-a05-001',
      name: 'Security Misconfiguration',
      description: 'Potential security misconfiguration detected',
      severity: 'medium',
      category: 'security-misconfiguration',
      check: async (context) => {
        const findings: SecurityFinding[] = [];
        
        // Check for overly permissive responses
        if (context.operation.responses) {
          Object.entries(context.operation.responses).forEach(([code, response]: [string, any]) => {
            if (response.headers && response.headers['Access-Control-Allow-Origin'] === '*') {
              findings.push({
                ruleId: 'owasp-a05-001',
                severity: 'medium',
                title: 'Overly Permissive CORS',
                description: 'CORS policy allows all origins (*)',
                location: {
                  endpoint: context.endpoint,
                  method: context.method
                },
                remediation: 'Restrict CORS to specific origins instead of using wildcard',
                cwe: 'CWE-942'
              });
            }
          });
        }
        
        return findings;
      }
    });

    // Input validation rules
    this.addRule({
      id: 'input-validation-001',
      name: 'Missing Input Validation',
      description: 'Request body lacks proper validation schema',
      severity: 'medium',
      category: 'input-validation',
      check: async (context) => {
        const findings: SecurityFinding[] = [];
        
        if (['post', 'put', 'patch'].includes(context.method.toLowerCase())) {
          const requestBody = context.operation.requestBody;
          if (!requestBody || !requestBody.content) {
            findings.push({
              ruleId: 'input-validation-001',
              severity: 'medium',
              title: 'Missing Input Validation',
              description: 'Endpoint accepts request body without validation schema',
              location: {
                endpoint: context.endpoint,
                method: context.method
              },
              remediation: 'Add JSON schema validation for request body',
              cwe: 'CWE-20'
            });
          }
        }
        
        return findings;
      }
    });
  }

  /**
   * Add security rule
   */
  addRule(rule: SecurityRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove security rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get all rules
   */
  getRules(): SecurityRule[] {
    return Array.from(this.rules.values());
  }
}

export default SecurityScanner;