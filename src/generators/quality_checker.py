"""
Test Quality Checker

Validates generated test files for syntax correctness, logical consistency,
test coverage, and adherence to quality standards.
"""

import ast
import re
import sys
import subprocess
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from pathlib import Path
import tempfile
import structlog

logger = structlog.get_logger()

@dataclass
class QualityIssue:
    """Represents a quality issue found in a test file"""
    severity: str  # 'error', 'warning', 'info'
    category: str  # 'syntax', 'logic', 'coverage', 'style', 'security'
    message: str
    file_path: str
    line_number: Optional[int] = None
    suggestion: Optional[str] = None

@dataclass
class TestQualityReport:
    """Comprehensive quality report for a test file or collection"""
    file_path: str
    total_tests: int
    passed_checks: int
    total_checks: int
    quality_score: float
    issues: List[QualityIssue] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def has_errors(self) -> bool:
        return any(issue.severity == 'error' for issue in self.issues)
    
    @property
    def has_warnings(self) -> bool:
        return any(issue.severity == 'warning' for issue in self.issues)

class TestQualityChecker:
    """
    Comprehensive quality checker for generated test files
    """
    
    def __init__(self):
        self.logger = structlog.get_logger()
        
        # Quality thresholds
        self.min_quality_score = 0.8
        self.max_test_method_length = 50
        self.min_assertion_ratio = 0.3
        self.required_imports = ['pytest', 'httpx']
        self.forbidden_patterns = [
            r'time\.sleep\(',  # No blocking sleeps in tests
            r'print\s*\(',     # No print statements (use logging)
            r'input\s*\(',     # No interactive input
            r'exit\s*\(',      # No explicit exits
        ]
    
    def check_test_file(self, file_path: str) -> TestQualityReport:
        """
        Perform comprehensive quality check on a single test file
        
        Args:
            file_path: Path to the test file
            
        Returns:
            TestQualityReport with detailed analysis
        """
        self.logger.info(f"Checking quality of test file: {file_path}")
        
        report = TestQualityReport(
            file_path=file_path,
            total_tests=0,
            passed_checks=0,
            total_checks=0,
            quality_score=0.0
        )
        
        if not Path(file_path).exists():
            report.issues.append(QualityIssue(
                severity='error',
                category='file',
                message='Test file does not exist',
                file_path=file_path,
                suggestion='Ensure the file path is correct'
            ))
            return report
        
        # Read file content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            report.issues.append(QualityIssue(
                severity='error',
                category='file',
                message=f'Failed to read file: {str(e)}',
                file_path=file_path
            ))
            return report
        
        # Perform various quality checks
        checks = [
            self._check_syntax,
            self._check_imports,
            self._check_test_structure,
            self._check_assertions,
            self._check_forbidden_patterns,
            self._check_async_patterns,
            self._check_error_handling,
            self._check_test_naming,
            self._check_documentation,
            self._check_security_patterns,
            self._check_performance_patterns,
            self._check_test_isolation,
        ]
        
        total_checks = 0
        passed_checks = 0
        
        for check_func in checks:
            try:
                issues, metrics = check_func(content, file_path)
                report.issues.extend(issues)
                report.metrics.update(metrics)
                
                # Count checks and passes
                check_specific_total = metrics.get('checks_performed', 1)
                check_specific_passed = check_specific_total - len([i for i in issues if i.severity == 'error'])
                
                total_checks += check_specific_total
                passed_checks += check_specific_passed
                
            except Exception as e:
                self.logger.warning(f"Quality check failed: {check_func.__name__}: {str(e)}")
                report.issues.append(QualityIssue(
                    severity='warning',
                    category='checker',
                    message=f'Quality check {check_func.__name__} failed: {str(e)}',
                    file_path=file_path
                ))
        
        # Calculate quality score
        report.total_checks = total_checks
        report.passed_checks = passed_checks
        report.quality_score = passed_checks / total_checks if total_checks > 0 else 0.0
        
        # Count total tests
        report.total_tests = report.metrics.get('test_method_count', 0)
        
        self.logger.info(f"Quality check complete. Score: {report.quality_score:.2%}, "
                        f"Issues: {len(report.issues)} ({len([i for i in report.issues if i.severity == 'error'])} errors)")
        
        return report
    
    def _check_syntax(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check Python syntax validity"""
        issues = []
        metrics = {'checks_performed': 1}
        
        try:
            ast.parse(content)
            metrics['syntax_valid'] = True
        except SyntaxError as e:
            issues.append(QualityIssue(
                severity='error',
                category='syntax',
                message=f'Syntax error: {e.msg}',
                file_path=file_path,
                line_number=e.lineno,
                suggestion='Fix syntax error before running tests'
            ))
            metrics['syntax_valid'] = False
        
        return issues, metrics
    
    def _check_imports(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check for required imports and import quality"""
        issues = []
        metrics = {'checks_performed': len(self.required_imports)}
        
        # Check required imports
        missing_imports = []
        for required_import in self.required_imports:
            if f'import {required_import}' not in content and f'from {required_import}' not in content:
                missing_imports.append(required_import)
        
        if missing_imports:
            issues.append(QualityIssue(
                severity='warning',
                category='imports',
                message=f'Missing recommended imports: {", ".join(missing_imports)}',
                file_path=file_path,
                suggestion=f'Add imports: {", ".join(f"import {imp}" for imp in missing_imports)}'
            ))
        
        # Check for unused imports (basic check)
        import_pattern = r'^(?:from\s+\S+\s+)?import\s+(.+)$'
        imports = []
        for line_num, line in enumerate(content.split('\n'), 1):
            match = re.match(import_pattern, line.strip())
            if match:
                import_parts = match.group(1).split(',')
                for part in import_parts:
                    clean_import = part.strip().split(' as ')[0]
                    if clean_import not in content.replace(line, ''):  # Simple unused check
                        issues.append(QualityIssue(
                            severity='info',
                            category='imports',
                            message=f'Potentially unused import: {clean_import}',
                            file_path=file_path,
                            line_number=line_num,
                            suggestion='Remove unused imports'
                        ))
        
        metrics['import_count'] = len(imports)
        return issues, metrics
    
    def _check_test_structure(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check test class and method structure"""
        issues = []
        
        # Count test methods
        test_methods = re.findall(r'^\s*(?:async\s+)?def\s+(test_\w+)', content, re.MULTILINE)
        test_classes = re.findall(r'^\s*class\s+(Test\w+)', content, re.MULTILINE)
        
        metrics = {
            'checks_performed': 3,
            'test_method_count': len(test_methods),
            'test_class_count': len(test_classes)
        }
        
        # Check if file has test methods
        if not test_methods:
            issues.append(QualityIssue(
                severity='error',
                category='structure',
                message='No test methods found',
                file_path=file_path,
                suggestion='Add test methods starting with "test_"'
            ))
        
        # Check if test methods are in classes
        if test_methods and not test_classes:
            issues.append(QualityIssue(
                severity='warning',
                category='structure',
                message='Test methods should be organized in test classes',
                file_path=file_path,
                suggestion='Organize tests in classes starting with "Test"'
            ))
        
        # Check for excessively long test methods
        for method in test_methods:
            method_pattern = rf'def\s+{re.escape(method)}\s*\([^)]*\):.*?(?=^\s*(?:def|class|$))'
            method_match = re.search(method_pattern, content, re.MULTILINE | re.DOTALL)
            if method_match:
                method_lines = method_match.group(0).count('\n')
                if method_lines > self.max_test_method_length:
                    issues.append(QualityIssue(
                        severity='warning',
                        category='structure',
                        message=f'Test method {method} is too long ({method_lines} lines)',
                        file_path=file_path,
                        suggestion=f'Break down large test methods (max {self.max_test_method_length} lines)'
                    ))
        
        return issues, metrics
    
    def _check_assertions(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check assertion patterns and quality"""
        issues = []
        
        # Count assertions
        assertion_patterns = [
            r'assert\s+',
            r'\.assert_',
            r'pytest\.raises',
            r'pytest\.warns'
        ]
        
        total_assertions = 0
        for pattern in assertion_patterns:
            total_assertions += len(re.findall(pattern, content))
        
        # Count test methods for ratio calculation
        test_methods = re.findall(r'def\s+(test_\w+)', content)
        
        metrics = {
            'checks_performed': 2,
            'assertion_count': total_assertions,
            'assertions_per_test': total_assertions / len(test_methods) if test_methods else 0
        }
        
        # Check assertion ratio
        if test_methods:
            assertion_ratio = total_assertions / len(test_methods)
            if assertion_ratio < self.min_assertion_ratio:
                issues.append(QualityIssue(
                    severity='warning',
                    category='assertions',
                    message=f'Low assertion ratio: {assertion_ratio:.1f} per test (min: {self.min_assertion_ratio})',
                    file_path=file_path,
                    suggestion='Add more assertions to validate test behavior'
                ))
        
        # Check for tests without assertions
        for method in test_methods:
            method_pattern = rf'def\s+{re.escape(method)}\s*\([^)]*\):.*?(?=^\s*(?:def|class|$))'
            method_match = re.search(method_pattern, content, re.MULTILINE | re.DOTALL)
            if method_match:
                method_content = method_match.group(0)
                has_assertion = any(re.search(pattern, method_content) for pattern in assertion_patterns)
                if not has_assertion:
                    issues.append(QualityIssue(
                        severity='warning',
                        category='assertions',
                        message=f'Test method {method} has no assertions',
                        file_path=file_path,
                        suggestion='Add assertions to validate test expectations'
                    ))
        
        return issues, metrics
    
    def _check_forbidden_patterns(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check for forbidden patterns that indicate poor test quality"""
        issues = []
        metrics = {'checks_performed': len(self.forbidden_patterns)}
        
        for pattern in self.forbidden_patterns:
            matches = list(re.finditer(pattern, content))
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                issues.append(QualityIssue(
                    severity='warning',
                    category='patterns',
                    message=f'Forbidden pattern found: {pattern}',
                    file_path=file_path,
                    line_number=line_num,
                    suggestion='Replace with appropriate async or testing pattern'
                ))
        
        return issues, metrics
    
    def _check_async_patterns(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check async/await patterns in test methods"""
        issues = []
        
        # Find async test methods
        async_tests = re.findall(r'async\s+def\s+(test_\w+)', content)
        sync_tests = re.findall(r'^(?!.*async)\s*def\s+(test_\w+)', content, re.MULTILINE)
        
        metrics = {
            'checks_performed': 2,
            'async_test_count': len(async_tests),
            'sync_test_count': len(sync_tests)
        }
        
        # Check for missing @pytest.mark.asyncio decorator
        for async_test in async_tests:
            test_pattern = rf'@pytest\.mark\.asyncio\s*\n\s*async\s+def\s+{re.escape(async_test)}'
            if not re.search(test_pattern, content):
                issues.append(QualityIssue(
                    severity='error',
                    category='async',
                    message=f'Async test {async_test} missing @pytest.mark.asyncio decorator',
                    file_path=file_path,
                    suggestion='Add @pytest.mark.asyncio decorator before async test methods'
                ))
        
        # Check for await usage in async tests
        for async_test in async_tests:
            test_pattern = rf'async\s+def\s+{re.escape(async_test)}\s*\([^)]*\):.*?(?=^\s*(?:def|class|$))'
            test_match = re.search(test_pattern, content, re.MULTILINE | re.DOTALL)
            if test_match and 'await' not in test_match.group(0):
                issues.append(QualityIssue(
                    severity='warning',
                    category='async',
                    message=f'Async test {async_test} does not use await',
                    file_path=file_path,
                    suggestion='Use await for async operations or make method synchronous'
                ))
        
        return issues, metrics
    
    def _check_error_handling(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check error handling patterns in tests"""
        issues = []
        
        # Count try-except blocks
        try_blocks = re.findall(r'try\s*:', content)
        except_blocks = re.findall(r'except\s+', content)
        pytest_raises = re.findall(r'pytest\.raises', content)
        
        metrics = {
            'checks_performed': 1,
            'try_block_count': len(try_blocks),
            'except_block_count': len(except_blocks),
            'pytest_raises_count': len(pytest_raises)
        }
        
        # Check for bare except clauses
        bare_except = re.findall(r'except\s*:', content)
        for _ in bare_except:
            issues.append(QualityIssue(
                severity='warning',
                category='error_handling',
                message='Bare except clause found',
                file_path=file_path,
                suggestion='Specify exception types for better error handling'
            ))
        
        return issues, metrics
    
    def _check_test_naming(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check test naming conventions"""
        issues = []
        
        test_methods = re.findall(r'def\s+(test_\w+)', content)
        test_classes = re.findall(r'class\s+(Test\w+)', content)
        
        metrics = {
            'checks_performed': len(test_methods) + len(test_classes),
            'well_named_tests': 0
        }
        
        # Check test method naming
        for method in test_methods:
            # Should be descriptive and not too short
            if len(method) < 10:  # Very short names
                issues.append(QualityIssue(
                    severity='info',
                    category='naming',
                    message=f'Test method {method} has a short name',
                    file_path=file_path,
                    suggestion='Use descriptive test method names that explain what is being tested'
                ))
            else:
                metrics['well_named_tests'] += 1
            
            # Should include action being tested
            action_keywords = ['create', 'update', 'delete', 'get', 'post', 'put', 'patch', 'validation', 'error']
            if not any(keyword in method.lower() for keyword in action_keywords):
                issues.append(QualityIssue(
                    severity='info',
                    category='naming',
                    message=f'Test method {method} should indicate the action being tested',
                    file_path=file_path,
                    suggestion='Include action keywords in test names (create, update, delete, etc.)'
                ))
        
        return issues, metrics
    
    def _check_documentation(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check for documentation and comments"""
        issues = []
        
        # Check for docstrings in test methods
        test_methods = re.findall(r'def\s+(test_\w+)', content)
        documented_tests = 0
        
        for method in test_methods:
            method_pattern = rf'def\s+{re.escape(method)}\s*\([^)]*\):\s*""".*?"""'
            if re.search(method_pattern, content, re.DOTALL):
                documented_tests += 1
            else:
                issues.append(QualityIssue(
                    severity='info',
                    category='documentation',
                    message=f'Test method {method} lacks docstring',
                    file_path=file_path,
                    suggestion='Add docstrings to explain test purpose and expectations'
                ))
        
        metrics = {
            'checks_performed': len(test_methods),
            'documented_test_count': documented_tests,
            'documentation_ratio': documented_tests / len(test_methods) if test_methods else 0
        }
        
        return issues, metrics
    
    def _check_security_patterns(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check for security-related patterns in tests"""
        issues = []
        
        # Look for potential security issues
        security_patterns = [
            (r'password\s*=\s*[\'"](?!.*placeholder|.*test|.*example)[^\'"]+[\'"]', 'hardcoded_password'),
            (r'token\s*=\s*[\'"](?!.*test|.*example)[a-zA-Z0-9+/]{20,}[\'"]', 'hardcoded_token'),
            (r'api_key\s*=\s*[\'"](?!.*test|.*example)[a-zA-Z0-9]{20,}[\'"]', 'hardcoded_api_key'),
            (r'secret\s*=\s*[\'"](?!.*test|.*example)[^\'"]+[\'"]', 'hardcoded_secret'),
        ]
        
        security_issues_found = 0
        for pattern, issue_type in security_patterns:
            matches = list(re.finditer(pattern, content, re.IGNORECASE))
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                issues.append(QualityIssue(
                    severity='warning',
                    category='security',
                    message=f'Potential hardcoded credential: {issue_type}',
                    file_path=file_path,
                    line_number=line_num,
                    suggestion='Use environment variables or test fixtures for credentials'
                ))
                security_issues_found += 1
        
        metrics = {
            'checks_performed': len(security_patterns),
            'security_issues_found': security_issues_found
        }
        
        return issues, metrics
    
    def _check_performance_patterns(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check for performance-related patterns"""
        issues = []
        
        # Check for potential performance issues
        performance_patterns = [
            (r'for\s+\w+\s+in\s+range\s*\(\s*\d{3,}\s*\)', 'large_loop'),
            (r'time\.sleep\s*\(\s*\d+', 'blocking_sleep'),
            (r'\.json\(\s*\)\s*\[\s*[\'"][^\'"]*[\'"]\s*\]', 'inefficient_json_access'),
        ]
        
        for pattern, issue_type in performance_patterns:
            matches = list(re.finditer(pattern, content))
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                issues.append(QualityIssue(
                    severity='info',
                    category='performance',
                    message=f'Potential performance issue: {issue_type}',
                    file_path=file_path,
                    line_number=line_num,
                    suggestion='Consider optimizing for better test performance'
                ))
        
        metrics = {
            'checks_performed': len(performance_patterns),
            'performance_issues': len(issues)
        }
        
        return issues, metrics
    
    def _check_test_isolation(self, content: str, file_path: str) -> Tuple[List[QualityIssue], Dict[str, Any]]:
        """Check for test isolation issues"""
        issues = []
        
        # Look for shared state issues
        isolation_patterns = [
            (r'global\s+\w+', 'global_variable'),
            (r'class\s+\w+:.*?def\s+\w+.*?\w+\s*=\s*[^=]', 'class_variable'),  # Class variables
            (r'@pytest\.fixture\s*\([^)]*scope\s*=\s*[\'"](?:module|session)[\'"]', 'shared_fixture'),
        ]
        
        for pattern, issue_type in isolation_patterns:
            matches = list(re.finditer(pattern, content, re.DOTALL))
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                if issue_type != 'shared_fixture':  # Shared fixtures are warnings, not errors
                    issues.append(QualityIssue(
                        severity='warning',
                        category='isolation',
                        message=f'Potential test isolation issue: {issue_type}',
                        file_path=file_path,
                        line_number=line_num,
                        suggestion='Avoid shared state between tests'
                    ))
        
        metrics = {
            'checks_performed': len(isolation_patterns),
            'isolation_issues': len(issues)
        }
        
        return issues, metrics
    
    def check_test_collection(self, test_files: List[str]) -> List[TestQualityReport]:
        """
        Check quality of multiple test files
        
        Args:
            test_files: List of test file paths
            
        Returns:
            List of TestQualityReport objects
        """
        reports = []
        
        self.logger.info(f"Checking quality of {len(test_files)} test files")
        
        for file_path in test_files:
            report = self.check_test_file(file_path)
            reports.append(report)
        
        return reports
    
    def validate_with_pytest(self, file_path: str) -> Tuple[bool, str]:
        """
        Validate test file with pytest collect-only
        
        Args:
            file_path: Path to test file
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'pytest', '--collect-only', '-q', file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            is_valid = result.returncode == 0
            error_message = result.stderr if not is_valid else ""
            
            return is_valid, error_message
            
        except subprocess.TimeoutExpired:
            return False, "Pytest collection timed out"
        except Exception as e:
            return False, f"Pytest validation failed: {str(e)}"
    
    def generate_quality_summary(self, reports: List[TestQualityReport]) -> Dict[str, Any]:
        """
        Generate a summary of quality across multiple test files
        
        Args:
            reports: List of quality reports
            
        Returns:
            Summary dictionary
        """
        if not reports:
            return {}
        
        total_tests = sum(r.total_tests for r in reports)
        total_issues = sum(len(r.issues) for r in reports)
        error_count = sum(len([i for i in r.issues if i.severity == 'error']) for r in reports)
        warning_count = sum(len([i for i in r.issues if i.severity == 'warning']) for r in reports)
        
        avg_quality_score = sum(r.quality_score for r in reports) / len(reports)
        
        # Quality distribution
        high_quality_files = len([r for r in reports if r.quality_score >= 0.9])
        medium_quality_files = len([r for r in reports if 0.7 <= r.quality_score < 0.9])
        low_quality_files = len([r for r in reports if r.quality_score < 0.7])
        
        return {
            'total_files': len(reports),
            'total_tests': total_tests,
            'average_quality_score': avg_quality_score,
            'total_issues': total_issues,
            'error_count': error_count,
            'warning_count': warning_count,
            'high_quality_files': high_quality_files,
            'medium_quality_files': medium_quality_files,
            'low_quality_files': low_quality_files,
            'files_with_errors': len([r for r in reports if r.has_errors]),
            'files_with_warnings': len([r for r in reports if r.has_warnings]),
            'quality_distribution': {
                'high': high_quality_files,
                'medium': medium_quality_files,
                'low': low_quality_files
            }
        }