import asyncio
import subprocess
import structlog
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timezone
from src.config.settings import Settings

logger = structlog.get_logger()

@dataclass
class TestResult:
    """Represents the result of a test execution"""
    file_path: str
    status: str  # "passed", "failed", "skipped", "error"
    duration: float
    output: str
    error_output: str
    test_cases: List[Dict[str, Any]]
    timestamp: datetime

@dataclass
class TestExecutionReport:
    """Comprehensive test execution report"""
    total_files: int
    total_tests: int
    passed: int
    failed: int
    skipped: int
    errors: int
    duration: float
    results: List[TestResult]
    timestamp: datetime

class TestRunner:
    """Execute generated tests and collect results"""
    
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or Settings()
    
    async def run_tests(
        self, 
        test_files: List[str], 
        pytest_args: Optional[List[str]] = None
    ) -> TestExecutionReport:
        """
        Execute pytest tests and collect results
        
        Args:
            test_files: List of test file paths to execute
            pytest_args: Additional pytest arguments
        
        Returns:
            TestExecutionReport with comprehensive results
        """
        start_time = datetime.now(timezone.utc)
        results = []
        
        # Default pytest arguments
        base_args = [
            "pytest",
            "--tb=short",
            "--json-report",
            "--json-report-file=/tmp/pytest_report.json",
            "-v"
        ]
        
        if pytest_args:
            base_args.extend(pytest_args)
        
        for test_file in test_files:
            if not Path(test_file).exists():
                logger.warning(f"Test file not found: {test_file}")
                continue
            
            result = await self._run_single_test_file(test_file, base_args)
            results.append(result)
        
        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        
        # Aggregate results
        total_tests = sum(len(r.test_cases) for r in results)
        passed = sum(len([tc for tc in r.test_cases if tc.get('outcome') == 'passed']) for r in results)
        failed = sum(len([tc for tc in r.test_cases if tc.get('outcome') == 'failed']) for r in results)
        skipped = sum(len([tc for tc in r.test_cases if tc.get('outcome') == 'skipped']) for r in results)
        errors = sum(len([tc for tc in r.test_cases if tc.get('outcome') == 'error']) for r in results)
        
        return TestExecutionReport(
            total_files=len(test_files),
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=skipped,
            errors=errors,
            duration=duration,
            results=results,
            timestamp=end_time
        )
    
    async def _run_single_test_file(
        self, 
        test_file: str, 
        base_args: List[str]
    ) -> TestResult:
        """Execute a single test file and collect results"""
        start_time = datetime.now(timezone.utc)
        
        # Prepare command
        cmd = base_args + [test_file]
        
        try:
            # Run pytest asynchronously
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=Path(test_file).parent
            )
            
            stdout, stderr = await process.communicate()
            
            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()
            
            # Parse pytest output
            output = stdout.decode('utf-8')
            error_output = stderr.decode('utf-8')
            
            # Try to parse JSON report if available
            test_cases = self._parse_pytest_output(output)
            
            # Determine overall status
            status = self._determine_test_status(process.returncode, test_cases)
            
            return TestResult(
                file_path=test_file,
                status=status,
                duration=duration,
                output=output,
                error_output=error_output,
                test_cases=test_cases,
                timestamp=end_time
            )
            
        except Exception as e:
            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()
            
            logger.error(f"Failed to execute test file: {test_file}", error=str(e))
            
            return TestResult(
                file_path=test_file,
                status="error",
                duration=duration,
                output="",
                error_output=str(e),
                test_cases=[],
                timestamp=end_time
            )
    
    def _parse_pytest_output(self, output: str) -> List[Dict[str, Any]]:
        """Parse pytest output to extract test case information"""
        test_cases = []
        
        # Simple parsing of pytest verbose output
        lines = output.split('\n')
        for line in lines:
            if '::' in line and ('PASSED' in line or 'FAILED' in line or 'SKIPPED' in line):
                parts = line.split()
                if len(parts) >= 2:
                    test_name = parts[0]
                    outcome = parts[-1].lower()
                    
                    test_cases.append({
                        'test_name': test_name,
                        'outcome': outcome,
                        'line': line.strip()
                    })
        
        return test_cases
    
    def _determine_test_status(self, return_code: int, test_cases: List[Dict[str, Any]]) -> str:
        """Determine overall test status based on return code and test results"""
        if return_code == 0:
            return "passed"
        elif return_code == 5:  # No tests collected
            return "skipped"
        elif any(tc.get('outcome') == 'failed' for tc in test_cases):
            return "failed"
        else:
            return "error"
    
    async def run_syntax_check(self, test_files: List[str]) -> Dict[str, Any]:
        """
        Check syntax validity of generated test files
        
        Args:
            test_files: List of test file paths to check
        
        Returns:
            Dictionary with syntax check results
        """
        results = {
            "valid_files": [],
            "invalid_files": [],
            "total_files": len(test_files)
        }
        
        for test_file in test_files:
            if not Path(test_file).exists():
                results["invalid_files"].append({
                    "file": test_file,
                    "error": "File not found"
                })
                continue
            
            try:
                # Check Python syntax
                with open(test_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                compile(content, test_file, 'exec')
                
                # Check pytest collection
                cmd = ["pytest", "--collect-only", test_file, "-q"]
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0:
                    results["valid_files"].append(test_file)
                else:
                    results["invalid_files"].append({
                        "file": test_file,
                        "error": stderr.decode('utf-8')
                    })
            
            except SyntaxError as e:
                results["invalid_files"].append({
                    "file": test_file,
                    "error": f"Syntax error: {e}"
                })
            except Exception as e:
                results["invalid_files"].append({
                    "file": test_file,
                    "error": f"Error: {e}"
                })
        
        return results
    
    def generate_html_report(self, report: TestExecutionReport, output_file: str):
        """Generate HTML report from test execution results"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Execution Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                .passed { color: green; }
                .failed { color: red; }
                .skipped { color: orange; }
                .error { color: red; font-weight: bold; }
                .test-file { margin: 20px 0; border: 1px solid #ddd; padding: 10px; }
                .test-case { margin: 5px 0; padding: 5px; background: #fafafa; }
                .output { background: #f0f0f0; padding: 10px; font-family: monospace; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <h1>Test Execution Report</h1>
            <div class="summary">
                <h2>Summary</h2>
                <p><strong>Total Files:</strong> {total_files}</p>
                <p><strong>Total Tests:</strong> {total_tests}</p>
                <p class="passed"><strong>Passed:</strong> {passed}</p>
                <p class="failed"><strong>Failed:</strong> {failed}</p>
                <p class="skipped"><strong>Skipped:</strong> {skipped}</p>
                <p class="error"><strong>Errors:</strong> {errors}</p>
                <p><strong>Duration:</strong> {duration:.2f}s</p>
                <p><strong>Timestamp:</strong> {timestamp}</p>
            </div>
            
            <h2>Test Results</h2>
            {test_results}
        </body>
        </html>
        """
        
        test_results_html = ""
        for result in report.results:
            status_class = result.status
            test_results_html += f"""
            <div class="test-file">
                <h3 class="{status_class}">File: {result.file_path}</h3>
                <p><strong>Status:</strong> <span class="{status_class}">{result.status.upper()}</span></p>
                <p><strong>Duration:</strong> {result.duration:.2f}s</p>
                <p><strong>Test Cases:</strong> {len(result.test_cases)}</p>
                
                <h4>Test Cases:</h4>
                {"".join(f'<div class="test-case {tc.get("outcome", "unknown")}">{tc.get("line", tc.get("test_name", "Unknown"))}</div>' for tc in result.test_cases)}
                
                {f'<h4>Output:</h4><div class="output">{result.output}</div>' if result.output else ''}
                {f'<h4>Error Output:</h4><div class="output error">{result.error_output}</div>' if result.error_output else ''}
            </div>
            """
        
        html_content = html_template.format(
            total_files=report.total_files,
            total_tests=report.total_tests,
            passed=report.passed,
            failed=report.failed,
            skipped=report.skipped,
            errors=report.errors,
            duration=report.duration,
            timestamp=report.timestamp.isoformat(),
            test_results=test_results_html
        )
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"HTML report generated: {output_file}")