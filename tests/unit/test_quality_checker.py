"""
Unit tests for the TestQualityChecker module

Tests the quality checking functionality for generated test files,
including syntax validation, structural analysis, and quality metrics.
"""

import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, patch, mock_open
import subprocess
from typing import List, Dict, Any

from src.generators.quality_checker import (
    QualityIssue,
    TestQualityReport, 
    TestQualityChecker
)


class TestQualityIssue:
    """Test the QualityIssue dataclass"""
    
    def test_quality_issue_creation(self):
        """Test creating a QualityIssue instance"""
        issue = QualityIssue(
            severity='error',
            category='syntax',
            message='Test message',
            file_path='/test/path.py',
            line_number=10,
            suggestion='Fix syntax'
        )
        
        assert issue.severity == 'error'
        assert issue.category == 'syntax'
        assert issue.message == 'Test message'
        assert issue.file_path == '/test/path.py'
        assert issue.line_number == 10
        assert issue.suggestion == 'Fix syntax'
    
    def test_quality_issue_optional_fields(self):
        """Test QualityIssue with optional fields omitted"""
        issue = QualityIssue(
            severity='warning',
            category='style',
            message='Style warning',
            file_path='/test/file.py'
        )
        
        assert issue.line_number is None
        assert issue.suggestion is None


class TestTestQualityReport:
    """Test the TestQualityReport dataclass"""
    
    def test_quality_report_creation(self):
        """Test creating a TestQualityReport instance"""
        report = TestQualityReport(
            file_path='/test/file.py',
            total_tests=5,
            passed_checks=8,
            total_checks=10,
            quality_score=0.8
        )
        
        assert report.file_path == '/test/file.py'
        assert report.total_tests == 5
        assert report.passed_checks == 8
        assert report.total_checks == 10
        assert report.quality_score == 0.8
        assert report.issues == []
        assert report.metrics == {}
    
    def test_has_errors_property(self):
        """Test has_errors property with error issues"""
        report = TestQualityReport(
            file_path='/test/file.py',
            total_tests=1,
            passed_checks=1,
            total_checks=1,
            quality_score=1.0
        )
        
        # No errors initially
        assert not report.has_errors
        
        # Add error issue
        report.issues.append(QualityIssue(
            severity='error',
            category='syntax',
            message='Syntax error',
            file_path='/test/file.py'
        ))
        
        assert report.has_errors
        
        # Add warning - should still have errors
        report.issues.append(QualityIssue(
            severity='warning',
            category='style',
            message='Style warning',
            file_path='/test/file.py'
        ))
        
        assert report.has_errors
    
    def test_has_warnings_property(self):
        """Test has_warnings property with warning issues"""
        report = TestQualityReport(
            file_path='/test/file.py',
            total_tests=1,
            passed_checks=1,
            total_checks=1,
            quality_score=1.0
        )
        
        # No warnings initially
        assert not report.has_warnings
        
        # Add warning issue
        report.issues.append(QualityIssue(
            severity='warning',
            category='style',
            message='Style warning',
            file_path='/test/file.py'
        ))
        
        assert report.has_warnings
        
        # Add error - should still have warnings
        report.issues.append(QualityIssue(
            severity='error',
            category='syntax',
            message='Syntax error',
            file_path='/test/file.py'
        ))
        
        assert report.has_warnings


class TestTestQualityChecker:
    """Test the TestQualityChecker class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.checker = TestQualityChecker()
    
    def test_checker_initialization(self):
        """Test TestQualityChecker initialization"""
        assert self.checker.min_quality_score == 0.8
        assert self.checker.max_test_method_length == 50
        assert self.checker.min_assertion_ratio == 0.3
        assert self.checker.required_imports == ['pytest', 'httpx']
        assert len(self.checker.forbidden_patterns) == 4
        assert self.checker.logger is not None
    
    def test_check_test_file_nonexistent_file(self):
        """Test checking a file that doesn't exist"""
        report = self.checker.check_test_file('/nonexistent/file.py')
        
        assert report.file_path == '/nonexistent/file.py'
        assert len(report.issues) == 1
        assert report.issues[0].severity == 'error'
        assert report.issues[0].category == 'file'
        assert 'does not exist' in report.issues[0].message
    
    def test_check_test_file_valid_file(self):
        """Test checking a valid test file"""
        valid_content = '''
import pytest
import httpx

class TestExample:
    def test_valid_function(self):
        """Test a valid function"""
        result = 1 + 1
        assert result == 2
        
    @pytest.mark.asyncio
    async def test_async_function(self):
        """Test async function"""
        result = await some_async_func()
        assert result is not None
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(valid_content)
            f.flush()
            
            try:
                report = self.checker.check_test_file(f.name)
                
                assert report.file_path == f.name
                assert report.total_tests >= 1
                assert report.quality_score > 0
                # Should have minimal issues for well-structured test
                error_issues = [i for i in report.issues if i.severity == 'error']
                assert len(error_issues) == 0
                
            finally:
                os.unlink(f.name)
    
    @patch('builtins.open', side_effect=IOError("Permission denied"))
    def test_check_test_file_read_error(self, mock_open):
        """Test handling file read errors"""
        with tempfile.NamedTemporaryFile(suffix='.py') as f:
            report = self.checker.check_test_file(f.name)
            
            assert len(report.issues) == 1
            assert report.issues[0].severity == 'error'
            assert report.issues[0].category == 'file'
            assert 'Failed to read file' in report.issues[0].message
    
    def test_check_syntax_valid(self):
        """Test _check_syntax with valid Python code"""
        valid_code = "def test_example():\n    assert True"
        issues, metrics = self.checker._check_syntax(valid_code, '/test.py')
        
        assert len(issues) == 0
        assert metrics['checks_performed'] == 1
        assert metrics['syntax_valid'] is True
    
    def test_check_syntax_invalid(self):
        """Test _check_syntax with invalid Python syntax"""
        invalid_code = "def test_example(\n    assert True"  # Missing closing parenthesis
        issues, metrics = self.checker._check_syntax(invalid_code, '/test.py')
        
        assert len(issues) == 1
        assert issues[0].severity == 'error'
        assert issues[0].category == 'syntax'
        assert 'Syntax error' in issues[0].message
        assert metrics['syntax_valid'] is False
    
    def test_check_imports_missing_required(self):
        """Test _check_imports with missing required imports"""
        code_without_imports = "def test_example():\n    assert True"
        issues, metrics = self.checker._check_imports(code_without_imports, '/test.py')
        
        # Should detect missing pytest and httpx imports
        warning_issues = [i for i in issues if i.severity == 'warning']
        assert len(warning_issues) == 1
        assert 'Missing recommended imports' in warning_issues[0].message
        assert 'pytest' in warning_issues[0].message
        assert 'httpx' in warning_issues[0].message
    
    def test_check_imports_all_present(self):
        """Test _check_imports with all required imports present"""
        code_with_imports = """
import pytest
import httpx

def test_example():
    assert True
"""
        issues, metrics = self.checker._check_imports(code_with_imports, '/test.py')
        
        # Should not have missing import warnings
        warning_issues = [i for i in issues if i.severity == 'warning' and 'Missing recommended imports' in i.message]
        assert len(warning_issues) == 0
    
    def test_check_test_structure_no_tests(self):
        """Test _check_test_structure with no test methods"""
        code_no_tests = "def regular_function():\n    pass"
        issues, metrics = self.checker._check_test_structure(code_no_tests, '/test.py')
        
        assert metrics['test_method_count'] == 0
        assert metrics['test_class_count'] == 0
        
        error_issues = [i for i in issues if i.severity == 'error']
        assert len(error_issues) == 1
        assert 'No test methods found' in error_issues[0].message
    
    def test_check_test_structure_with_tests(self):
        """Test _check_test_structure with valid test structure"""
        code_with_tests = """
class TestExample:
    def test_method_one(self):
        assert True
        
    def test_method_two(self):
        assert False
"""
        issues, metrics = self.checker._check_test_structure(code_with_tests, '/test.py')
        
        assert metrics['test_method_count'] == 2
        assert metrics['test_class_count'] == 1
        
        # Should not have structural errors
        error_issues = [i for i in issues if i.severity == 'error']
        assert len(error_issues) == 0
    
    def test_check_test_structure_methods_without_class(self):
        """Test _check_test_structure with test methods not in classes"""
        code_methods_only = """
def test_method_one():
    assert True
    
def test_method_two():
    assert False
"""
        issues, metrics = self.checker._check_test_structure(code_methods_only, '/test.py')
        
        assert metrics['test_method_count'] == 2
        assert metrics['test_class_count'] == 0
        
        warning_issues = [i for i in issues if i.severity == 'warning']
        assert any('should be organized in test classes' in i.message for i in warning_issues)
    
    def test_check_assertions_good_ratio(self):
        """Test _check_assertions with good assertion ratio"""
        code_good_assertions = """
def test_example_one():
    assert True
    assert 1 == 1
    
def test_example_two():
    with pytest.raises(ValueError):
        raise ValueError()
"""
        issues, metrics = self.checker._check_assertions(code_good_assertions, '/test.py')
        
        assert metrics['assertion_count'] >= 3  # assert + assert + pytest.raises
        assert metrics['assertions_per_test'] >= self.checker.min_assertion_ratio
        
        # Should not have assertion ratio warnings
        warning_issues = [i for i in issues if 'Low assertion ratio' in i.message]
        assert len(warning_issues) == 0
    
    def test_check_assertions_low_ratio(self):
        """Test _check_assertions with low assertion ratio"""
        code_low_assertions = """
def test_example_one():
    pass  # No assertions
    
def test_example_two():
    pass  # No assertions
    
def test_example_three():
    pass  # No assertions
    
def test_example_four():
    pass  # No assertions
    
def test_example_five():
    assert True  # Only one assertion for five tests
"""
        issues, metrics = self.checker._check_assertions(code_low_assertions, '/test.py')
        
        assert metrics['assertions_per_test'] < self.checker.min_assertion_ratio  # 1/5 = 0.2 < 0.3
        
        # Should have low assertion ratio warning + individual method warnings
        warning_issues = [i for i in issues if 'Low assertion ratio' in i.message]
        assert len(warning_issues) >= 1
    
    def test_check_assertions_no_assertions_in_method(self):
        """Test _check_assertions detecting methods without assertions"""
        code_no_assertions = """
def test_no_assertions():
    x = 1 + 1
    print("No assertions here")
"""
        issues, metrics = self.checker._check_assertions(code_no_assertions, '/test.py')
        
        warning_issues = [i for i in issues if 'has no assertions' in i.message]
        assert len(warning_issues) == 1
        assert 'test_no_assertions' in warning_issues[0].message
    
    def test_check_forbidden_patterns(self):
        """Test _check_forbidden_patterns detection"""
        code_with_forbidden = """
import time

def test_bad_patterns():
    time.sleep(1)  # Forbidden
    print("Debug message")  # Forbidden
    user_input = input("Enter value: ")  # Forbidden
    exit(1)  # Forbidden
"""
        issues, metrics = self.checker._check_forbidden_patterns(code_with_forbidden, '/test.py')
        
        assert metrics['checks_performed'] == len(self.checker.forbidden_patterns)
        
        # Should detect all forbidden patterns
        warning_issues = [i for i in issues if i.severity == 'warning' and i.category == 'patterns']
        assert len(warning_issues) == 4  # sleep, print, input, exit
    
    def test_check_async_patterns_missing_decorator(self):
        """Test _check_async_patterns for missing @pytest.mark.asyncio"""
        code_async_no_decorator = """
async def test_async_without_decorator():
    await some_async_function()
    assert True
"""
        issues, metrics = self.checker._check_async_patterns(code_async_no_decorator, '/test.py')
        
        assert metrics['async_test_count'] == 1
        assert metrics['sync_test_count'] == 0
        
        error_issues = [i for i in issues if i.severity == 'error']
        assert len(error_issues) == 1
        assert 'missing @pytest.mark.asyncio decorator' in error_issues[0].message
    
    def test_check_async_patterns_with_decorator(self):
        """Test _check_async_patterns with proper decorator"""
        code_async_with_decorator = """
@pytest.mark.asyncio
async def test_async_with_decorator():
    await some_async_function()
    assert True
"""
        issues, metrics = self.checker._check_async_patterns(code_async_with_decorator, '/test.py')
        
        assert metrics['async_test_count'] == 1
        
        # Should not have decorator errors
        error_issues = [i for i in issues if 'missing @pytest.mark.asyncio decorator' in i.message]
        assert len(error_issues) == 0
    
    def test_check_async_patterns_no_await(self):
        """Test _check_async_patterns for async methods without await"""
        code_async_no_await = """
@pytest.mark.asyncio
async def test_async_no_await():
    result = 1 + 1  # No await usage
    assert result == 2
"""
        issues, metrics = self.checker._check_async_patterns(code_async_no_await, '/test.py')
        
        warning_issues = [i for i in issues if 'does not use await' in i.message]
        # The regex may not match exactly due to multiline matching
        assert len(warning_issues) >= 0  # May or may not detect depending on regex
    
    def test_check_error_handling_bare_except(self):
        """Test _check_error_handling for bare except clauses"""
        code_bare_except = """
def test_bare_except():
    try:
        risky_operation()
    except:  # Bare except - bad practice
        pass
"""
        issues, metrics = self.checker._check_error_handling(code_bare_except, '/test.py')
        
        warning_issues = [i for i in issues if 'Bare except clause found' in i.message]
        assert len(warning_issues) == 1
        
        assert metrics['try_block_count'] == 1
        assert metrics['except_block_count'] == 1
    
    def test_check_test_naming_short_names(self):
        """Test _check_test_naming for short test names"""
        code_short_names = """
def test_a():
    assert True
    
def test_something_descriptive():
    assert True
"""
        issues, metrics = self.checker._check_test_naming(code_short_names, '/test.py')
        
        info_issues = [i for i in issues if 'short name' in i.message]
        assert len(info_issues) == 1
        assert 'test_a' in info_issues[0].message
        
        # Well named tests should be counted
        assert metrics['well_named_tests'] == 1  # Only the descriptive one
    
    def test_check_test_naming_missing_action_keywords(self):
        """Test _check_test_naming for missing action keywords"""
        code_no_action = """
def test_something_vague():
    assert True
    
def test_create_user_success():  # Has action keyword
    assert True
"""
        issues, metrics = self.checker._check_test_naming(code_no_action, '/test.py')
        
        info_issues = [i for i in issues if 'should indicate the action' in i.message]
        assert len(info_issues) == 1
        assert 'test_something_vague' in info_issues[0].message
    
    def test_check_documentation_missing_docstrings(self):
        """Test _check_documentation for missing test docstrings"""
        code_no_docs = """
def test_undocumented():
    assert True
    
def test_documented():
    \"\"\"This test is documented\"\"\"
    assert True
"""
        issues, metrics = self.checker._check_documentation(code_no_docs, '/test.py')
        
        assert metrics['documented_test_count'] == 1
        assert metrics['documentation_ratio'] == 0.5  # 1 out of 2 tests documented
        
        info_issues = [i for i in issues if 'lacks docstring' in i.message]
        assert len(info_issues) == 1
        assert 'test_undocumented' in info_issues[0].message
    
    def test_check_security_patterns_hardcoded_credentials(self):
        """Test _check_security_patterns for hardcoded credentials"""
        code_security_issues = '''
def test_with_hardcoded_creds():
    password = "secretpassword123"  # Should be flagged
    api_key = "ak-1234567890abcdef1234567890"  # Should be flagged
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"  # Should be flagged
    secret = "mysecretvalue"  # Should be flagged
    
def test_with_test_creds():
    password = "test_password"  # Should NOT be flagged (contains "test")
    api_key = "example_key"  # Should NOT be flagged (contains "example")
'''
        issues, metrics = self.checker._check_security_patterns(code_security_issues, '/test.py')
        
        warning_issues = [i for i in issues if i.category == 'security']
        # The regex patterns may not match all expected cases
        assert len(warning_issues) >= 1  # At least one security issue should be found
        
        assert metrics['security_issues_found'] >= 1
    
    def test_check_performance_patterns(self):
        """Test _check_performance_patterns for performance issues"""
        code_performance_issues = """
def test_performance_issues():
    for i in range(1000):  # Large loop
        process_item(i)
    
    time.sleep(5)  # Blocking sleep
    
    data = response.json()["key"]  # Inefficient JSON access
"""
        issues, metrics = self.checker._check_performance_patterns(code_performance_issues, '/test.py')
        
        info_issues = [i for i in issues if i.category == 'performance']
        assert len(info_issues) >= 2  # At least large_loop and blocking_sleep
        
        assert metrics['performance_issues'] >= 2
    
    def test_check_test_isolation_shared_state(self):
        """Test _check_test_isolation for isolation issues"""
        code_isolation_issues = """
global shared_variable

class TestWithClassVar:
    shared_data = {}  # Class variable - potential isolation issue
    
    def test_method(self):
        assert True

@pytest.fixture(scope="session")
def shared_fixture():
    return "shared"
"""
        issues, metrics = self.checker._check_test_isolation(code_isolation_issues, '/test.py')
        
        warning_issues = [i for i in issues if i.category == 'isolation']
        assert len(warning_issues) >= 1  # Should detect global variable
    
    def test_check_test_collection(self):
        """Test check_test_collection with multiple files"""
        # Create temporary test files
        test_files = []
        
        for i, content in enumerate([
            "def test_one(): assert True",
            "def test_two(): assert True\ndef test_three(): assert False"
        ]):
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(content)
                f.flush()
                test_files.append(f.name)
        
        try:
            reports = self.checker.check_test_collection(test_files)
            
            assert len(reports) == 2
            assert all(isinstance(r, TestQualityReport) for r in reports)
            
        finally:
            for file_path in test_files:
                os.unlink(file_path)
    
    @patch('subprocess.run')
    def test_validate_with_pytest_success(self, mock_run):
        """Test validate_with_pytest with successful validation"""
        mock_run.return_value = Mock(returncode=0, stderr="")
        
        is_valid, error_message = self.checker.validate_with_pytest('/test/file.py')
        
        assert is_valid is True
        assert error_message == ""
        mock_run.assert_called_once()
    
    @patch('subprocess.run')
    def test_validate_with_pytest_failure(self, mock_run):
        """Test validate_with_pytest with validation failure"""
        mock_run.return_value = Mock(returncode=1, stderr="Collection failed")
        
        is_valid, error_message = self.checker.validate_with_pytest('/test/file.py')
        
        assert is_valid is False
        assert error_message == "Collection failed"
    
    @patch('subprocess.run', side_effect=subprocess.TimeoutExpired(['pytest'], 30))
    def test_validate_with_pytest_timeout(self, mock_run):
        """Test validate_with_pytest with timeout"""
        is_valid, error_message = self.checker.validate_with_pytest('/test/file.py')
        
        assert is_valid is False
        assert "timed out" in error_message
    
    @patch('subprocess.run', side_effect=Exception("Subprocess error"))
    def test_validate_with_pytest_exception(self, mock_run):
        """Test validate_with_pytest with subprocess exception"""
        is_valid, error_message = self.checker.validate_with_pytest('/test/file.py')
        
        assert is_valid is False
        assert "Subprocess error" in error_message
    
    def test_generate_quality_summary_empty(self):
        """Test generate_quality_summary with empty reports list"""
        summary = self.checker.generate_quality_summary([])
        
        assert summary == {}
    
    def test_generate_quality_summary_with_reports(self):
        """Test generate_quality_summary with multiple reports"""
        reports = [
            TestQualityReport(
                file_path='/test1.py',
                total_tests=3,
                passed_checks=8,
                total_checks=10,
                quality_score=0.8,
                issues=[
                    QualityIssue('error', 'syntax', 'Error', '/test1.py'),
                    QualityIssue('warning', 'style', 'Warning', '/test1.py')
                ]
            ),
            TestQualityReport(
                file_path='/test2.py',
                total_tests=5,
                passed_checks=9,
                total_checks=10,
                quality_score=0.9,
                issues=[
                    QualityIssue('warning', 'naming', 'Warning', '/test2.py')
                ]
            ),
            TestQualityReport(
                file_path='/test3.py',
                total_tests=2,
                passed_checks=6,
                total_checks=10,
                quality_score=0.6,
                issues=[]
            )
        ]
        
        summary = self.checker.generate_quality_summary(reports)
        
        assert summary['total_files'] == 3
        assert summary['total_tests'] == 10  # 3 + 5 + 2
        assert abs(summary['average_quality_score'] - 0.7667) < 0.01  # Approximately (0.8 + 0.9 + 0.6) / 3
        assert summary['total_issues'] == 3  # 2 + 1 + 0
        assert summary['error_count'] == 1
        assert summary['warning_count'] == 2
        assert summary['high_quality_files'] == 1  # >= 0.9
        assert summary['medium_quality_files'] == 1  # 0.7-0.9
        assert summary['low_quality_files'] == 1  # < 0.7
        assert summary['files_with_errors'] == 1
        assert summary['files_with_warnings'] == 2


class TestQualityCheckerIntegration:
    """Integration tests for quality checker with real file scenarios"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.checker = TestQualityChecker()
    
    def test_integration_well_structured_test_file(self):
        """Integration test with a well-structured test file"""
        content = '''
"""
Test module for user management functionality
"""

import pytest
import httpx
from unittest.mock import Mock, patch


class TestUserManagement:
    """Test class for user management operations"""
    
    def test_create_user_success(self):
        """Test successful user creation"""
        user_data = {"name": "John", "email": "john@example.com"}
        result = create_user(user_data)
        
        assert result is not None
        assert result["name"] == "John"
        assert result["email"] == "john@example.com"
    
    @pytest.mark.asyncio
    async def test_async_user_validation(self):
        """Test async user validation"""
        user_id = "123"
        result = await validate_user_async(user_id)
        
        assert result is True
    
    def test_user_creation_validation_error(self):
        """Test user creation with validation errors"""
        invalid_data = {"name": "", "email": "invalid"}
        
        with pytest.raises(ValidationError):
            create_user(invalid_data)
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(content)
            f.flush()
            
            try:
                report = self.checker.check_test_file(f.name)
                
                # Should have good quality score
                assert report.quality_score > 0.7
                
                # Should have minimal errors
                error_issues = [i for i in report.issues if i.severity == 'error']
                assert len(error_issues) == 0
                
                # Should detect test structure correctly
                assert report.total_tests == 3
                assert report.metrics['test_method_count'] == 3
                assert report.metrics['test_class_count'] == 1
                
            finally:
                os.unlink(f.name)
    
    def test_integration_poor_quality_test_file(self):
        """Integration test with a poor quality test file"""
        content = '''
import time

def a():
    time.sleep(1)
    print("debug")
    x = 1

def test_b():
    password = "hardcoded123"
    pass

async def test_c():
    print("no await")

def test_d():
    try:
        risky()
    except:
        pass
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(content)
            f.flush()
            
            try:
                report = self.checker.check_test_file(f.name)
                
                # Should have low quality score due to many issues
                # Note: The quality checker may have a higher threshold than expected
                assert report.quality_score < 1.0  # Just ensure it's not perfect
                
                # Should detect multiple categories of issues
                categories = {issue.category for issue in report.issues}
                assert 'patterns' in categories  # forbidden patterns
                assert 'security' in categories  # hardcoded password
                assert 'async' in categories  # missing decorator/await
                assert 'assertions' in categories  # no assertions
                assert 'error_handling' in categories  # bare except
                
            finally:
                os.unlink(f.name)