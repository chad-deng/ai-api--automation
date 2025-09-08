#!/usr/bin/env python3
"""
Test Summary Report Generator
Generates a comprehensive test summary from JUnit XML reports
"""

import os
import glob
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
import json

def parse_junit_xml(xml_file):
    """Parse JUnit XML file and extract test results"""
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        # Get testsuite info
        testsuite = root if root.tag == 'testsuite' else root.find('testsuite')
        if testsuite is None:
            return None
            
        results = {
            'file': os.path.basename(xml_file),
            'timestamp': testsuite.get('timestamp', ''),
            'tests': int(testsuite.get('tests', 0)),
            'failures': int(testsuite.get('failures', 0)),
            'errors': int(testsuite.get('errors', 0)),
            'skipped': int(testsuite.get('skipped', 0)),
            'time': float(testsuite.get('time', 0)),
            'testcases': []
        }
        
        # Parse individual test cases
        for testcase in testsuite.findall('testcase'):
            case_info = {
                'name': testcase.get('name'),
                'classname': testcase.get('classname'),
                'time': float(testcase.get('time', 0)),
                'status': 'passed'
            }
            
            if testcase.find('failure') is not None:
                case_info['status'] = 'failed'
                case_info['failure'] = testcase.find('failure').text
            elif testcase.find('error') is not None:
                case_info['status'] = 'error' 
                case_info['error'] = testcase.find('error').text
            elif testcase.find('skipped') is not None:
                case_info['status'] = 'skipped'
                
            results['testcases'].append(case_info)
            
        return results
        
    except Exception as e:
        print(f"Error parsing {xml_file}: {e}")
        return None

def generate_html_summary(all_results, output_file):
    """Generate HTML summary report"""
    
    # Calculate totals
    total_tests = sum(r['tests'] for r in all_results)
    total_failures = sum(r['failures'] for r in all_results)
    total_errors = sum(r['errors'] for r in all_results)
    total_skipped = sum(r['skipped'] for r in all_results)
    total_passed = total_tests - total_failures - total_errors - total_skipped
    total_time = sum(r['time'] for r in all_results)
    
    success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI API Test Automation - Summary Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .header {{ background: #f0f8ff; padding: 20px; border-radius: 8px; }}
            .summary {{ display: flex; gap: 20px; margin: 20px 0; }}
            .metric {{ background: white; border: 2px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; min-width: 120px; }}
            .passed {{ border-color: #4CAF50; color: #4CAF50; }}
            .failed {{ border-color: #f44336; color: #f44336; }}
            .error {{ border-color: #ff9800; color: #ff9800; }}
            .skipped {{ border-color: #9e9e9e; color: #9e9e9e; }}
            .total {{ border-color: #2196F3; color: #2196F3; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: #f2f2f2; }}
            .status-passed {{ color: #4CAF50; font-weight: bold; }}
            .status-failed {{ color: #f44336; font-weight: bold; }}
            .status-error {{ color: #ff9800; font-weight: bold; }}
            .status-skipped {{ color: #9e9e9e; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🧪 AI API Test Automation - Summary Report</h1>
            <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>Success Rate: <strong>{success_rate:.1f}%</strong></p>
        </div>
        
        <div class="summary">
            <div class="metric total">
                <h3>{total_tests}</h3>
                <p>Total Tests</p>
            </div>
            <div class="metric passed">
                <h3>{total_passed}</h3>
                <p>Passed</p>
            </div>
            <div class="metric failed">
                <h3>{total_failures}</h3>
                <p>Failed</p>
            </div>
            <div class="metric error">
                <h3>{total_errors}</h3>
                <p>Errors</p>
            </div>
            <div class="metric skipped">
                <h3>{total_skipped}</h3>
                <p>Skipped</p>
            </div>
            <div class="metric total">
                <h3>{total_time:.2f}s</h3>
                <p>Total Time</p>
            </div>
        </div>
        
        <h2>📊 Test Results by Report</h2>
        <table>
            <tr>
                <th>Report File</th>
                <th>Tests</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Errors</th>
                <th>Skipped</th>
                <th>Time</th>
                <th>Success Rate</th>
            </tr>
    """
    
    for result in all_results:
        passed = result['tests'] - result['failures'] - result['errors'] - result['skipped']
        rate = (passed / result['tests'] * 100) if result['tests'] > 0 else 0
        
        html_content += f"""
            <tr>
                <td>{result['file']}</td>
                <td>{result['tests']}</td>
                <td class="status-passed">{passed}</td>
                <td class="status-failed">{result['failures']}</td>
                <td class="status-error">{result['errors']}</td>
                <td class="status-skipped">{result['skipped']}</td>
                <td>{result['time']:.2f}s</td>
                <td>{rate:.1f}%</td>
            </tr>
        """
    
    html_content += """
        </table>
        
        <h2>📋 Recent Test Cases</h2>
        <table>
            <tr>
                <th>Test Case</th>
                <th>Class</th>
                <th>Status</th>
                <th>Time</th>
            </tr>
    """
    
    # Show recent test cases from latest report
    if all_results:
        latest_result = max(all_results, key=lambda x: x.get('timestamp', ''))
        for testcase in latest_result['testcases'][:20]:  # Show first 20
            html_content += f"""
                <tr>
                    <td>{testcase['name']}</td>
                    <td>{testcase['classname']}</td>
                    <td class="status-{testcase['status']}">{testcase['status'].title()}</td>
                    <td>{testcase['time']:.3f}s</td>
                </tr>
            """
    
    html_content += """
        </table>
    </body>
    </html>
    """
    
    with open(output_file, 'w') as f:
        f.write(html_content)

def main():
    """Main function to generate summary report"""
    reports_dir = Path("reports")
    
    if not reports_dir.exists():
        print("❌ No reports directory found. Run tests first.")
        return
    
    # Find all JUnit XML files
    xml_files = list(reports_dir.glob("*junit_report_*.xml"))
    
    if not xml_files:
        print("❌ No JUnit XML reports found. Run tests with reporting enabled.")
        return
    
    print(f"📊 Found {len(xml_files)} test reports")
    
    all_results = []
    for xml_file in xml_files:
        result = parse_junit_xml(xml_file)
        if result:
            all_results.append(result)
    
    if not all_results:
        print("❌ No valid test results found.")
        return
    
    # Generate summary report
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    summary_file = reports_dir / f"summary_report_{timestamp}.html"
    
    generate_html_summary(all_results, summary_file)
    
    print(f"✅ Summary report generated: {summary_file}")
    print(f"🌐 Open with: open {summary_file}")
    
    # Also save as latest
    latest_file = reports_dir / "latest_summary.html"
    generate_html_summary(all_results, latest_file)
    print(f"📋 Latest summary: {latest_file}")

if __name__ == "__main__":
    main()