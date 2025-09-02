"""
Quality Gates Implementation for Test Generation
Enterprise-grade quality control and validation system
"""

import os
import ast
import json
import subprocess
import re
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class QualityIssue:
    """Represents a quality issue found in test file"""
    category: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    description: str
    line_number: Optional[int] = None
    recommendation: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class QualityScore:
    """Quality assessment score breakdown"""
    syntax_score: float
    coverage_score: float
    assertion_score: float
    structure_score: float
    maintainability_score: float
    overall_score: float
    grade: str  # EXCELLENT, GOOD, ACCEPTABLE, POOR, UNACCEPTABLE
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ValidationResult:
    """Result of quality validation process"""
    passed: bool
    quality_score: QualityScore
    issues: List[QualityIssue]
    recommendations: List[str]
    processing_time: float
    
    def to_dict(self) -> Dict:
        return {
            'passed': self.passed,
            'quality_score': self.quality_score.to_dict(),
            'issues': [issue.to_dict() for issue in self.issues],
            'recommendations': self.recommendations,
            'processing_time': self.processing_time
        }


class QualityGateEngine:
    """Core engine for quality gate validation"""
    
    # Quality thresholds based on QA Lead requirements
    QUALITY_THRESHOLDS = {
        "EXCELLENT": 90,      # Auto-approve for production
        "GOOD": 75,           # Approve with minor notes  
        "ACCEPTABLE": 60,     # Requires modifications
        "POOR": 40,           # Major improvements needed
        "UNACCEPTABLE": 0     # Reject and regenerate
    }
    
    # Required minimum assertions per test method
    MIN_ASSERTIONS_PER_METHOD = 3
    
    # Required minimum test scenarios per endpoint
    MIN_SCENARIOS_PER_ENDPOINT = 4
    
    def __init__(self):
        self.quality_criteria = self._load_quality_criteria()
    
    def _load_quality_criteria(self) -> Dict:
        """Load comprehensive quality criteria configuration"""
        return {
            "syntax_validation": {
                "weight": 30,
                "checks": [
                    "python_syntax_valid",
                    "imports_resolvable", 
                    "fixtures_accessible",
                    "pytest_collectible"
                ]
            },
            "test_coverage": {
                "weight": 25,
                "checks": [
                    "crud_operations_covered",
                    "error_scenarios_present",
                    "edge_cases_included",
                    "security_scenarios_tested"
                ]
            },
            "assertion_quality": {
                "weight": 20,
                "checks": [
                    "assertion_density_adequate",
                    "status_code_assertions",
                    "response_structure_validation",
                    "business_logic_assertions"
                ]
            },
            "test_structure": {
                "weight": 15,
                "checks": [
                    "naming_convention_followed",
                    "test_organization_proper",
                    "fixture_usage_appropriate",
                    "documentation_present"
                ]
            },
            "maintainability": {
                "weight": 10,
                "checks": [
                    "code_readability",
                    "test_data_management",
                    "error_handling_present",
                    "cleanup_procedures"
                ]
            }
        }
    
    def validate_test_file(self, test_file_path: str) -> ValidationResult:
        """
        Comprehensive quality validation of test file
        """
        start_time = datetime.now()
        
        # Initialize tracking
        issues = []
        scores = {}
        
        try:
            # Stage 1: Critical syntax validation (BLOCKING)
            syntax_result = self._validate_syntax(test_file_path)
            scores['syntax_score'] = syntax_result['score']
            issues.extend(syntax_result['issues'])
            
            # If syntax fails, stop here and quarantine
            if syntax_result['score'] < 30:  # Perfect syntax score is 30
                return ValidationResult(
                    passed=False,
                    quality_score=QualityScore(
                        syntax_score=syntax_result['score'],
                        coverage_score=0,
                        assertion_score=0,
                        structure_score=0,
                        maintainability_score=0,
                        overall_score=syntax_result['score'],
                        grade="UNACCEPTABLE"
                    ),
                    issues=issues,
                    recommendations=["QUARANTINE_AND_REGENERATE: Critical syntax errors"],
                    processing_time=(datetime.now() - start_time).total_seconds()
                )
            
            # Stage 2: Test coverage analysis
            coverage_result = self._validate_test_coverage(test_file_path)
            scores['coverage_score'] = coverage_result['score']
            issues.extend(coverage_result['issues'])
            
            # Stage 3: Assertion quality validation
            assertion_result = self._validate_assertion_quality(test_file_path)
            scores['assertion_score'] = assertion_result['score']
            issues.extend(assertion_result['issues'])
            
            # Stage 4: Test structure validation
            structure_result = self._validate_test_structure(test_file_path)
            scores['structure_score'] = structure_result['score']
            issues.extend(structure_result['issues'])
            
            # Stage 5: Maintainability assessment
            maintainability_result = self._validate_maintainability(test_file_path)
            scores['maintainability_score'] = maintainability_result['score']
            issues.extend(maintainability_result['issues'])
            
            # Calculate overall quality score
            overall_score = self._calculate_overall_score(scores)
            grade = self._determine_grade(overall_score)
            
            quality_score = QualityScore(
                syntax_score=scores['syntax_score'],
                coverage_score=scores['coverage_score'],
                assertion_score=scores['assertion_score'],
                structure_score=scores['structure_score'],
                maintainability_score=scores['maintainability_score'],
                overall_score=overall_score,
                grade=grade
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(issues, overall_score)
            
            return ValidationResult(
                passed=overall_score >= 60,  # Minimum acceptable threshold
                quality_score=quality_score,
                issues=issues,
                recommendations=recommendations,
                processing_time=(datetime.now() - start_time).total_seconds()
            )
            
        except Exception as e:
            logger.error(f"Quality validation failed for {test_file_path}: {e}")
            return ValidationResult(
                passed=False,
                quality_score=QualityScore(0, 0, 0, 0, 0, 0, "UNACCEPTABLE"),
                issues=[QualityIssue("VALIDATION_ERROR", "CRITICAL", f"Validation failed: {e}")],
                recommendations=["MANUAL_REVIEW_REQUIRED"],
                processing_time=(datetime.now() - start_time).total_seconds()
            )
    
    def _validate_syntax(self, test_file_path: str) -> Dict:
        """Stage 1: Critical syntax validation"""
        issues = []
        score = 30  # Start with perfect score
        
        try:
            with open(test_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check 1: Python syntax validation
            try:
                ast.parse(content)
            except SyntaxError as e:
                issues.append(QualityIssue(
                    "SYNTAX_ERROR",
                    "CRITICAL",
                    f"Python syntax error: {e}",
                    line_number=e.lineno,
                    recommendation="Fix syntax error before proceeding"
                ))
                score = 0  # Critical failure
                return {'score': score, 'issues': issues}
            
            # Check 2: Import validation
            import_issues = self._validate_imports(test_file_path, content)
            if import_issues:
                issues.extend(import_issues)
                score -= 5
            
            # Check 3: Pytest collection validation
            collection_result = self._validate_pytest_collection(test_file_path)
            if not collection_result['success']:
                issues.append(QualityIssue(
                    "PYTEST_COLLECTION",
                    "HIGH",
                    collection_result['error'],
                    recommendation="Fix pytest collection issues"
                ))
                score -= 10
            
            # Check 4: Fixture validation
            fixture_issues = self._validate_fixtures(content)
            if fixture_issues:
                issues.extend(fixture_issues)
                score -= 5
                
        except Exception as e:
            issues.append(QualityIssue(
                "SYNTAX_VALIDATION_ERROR",
                "CRITICAL",
                f"Could not validate syntax: {e}",
                recommendation="Manual review required"
            ))
            score = 0
        
        return {'score': max(0, score), 'issues': issues}
    
    def _validate_imports(self, test_file_path: str, content: str) -> List[QualityIssue]:
        """Validate that all imports can be resolved"""
        issues = []
        
        # Extract import statements
        import_lines = [line for line in content.split('\n') if line.strip().startswith(('import ', 'from '))]
        
        for line_num, line in enumerate(content.split('\n'), 1):
            if line.strip().startswith(('import ', 'from ')):
                # Basic import validation
                if 'src.' in line and not os.path.exists('src'):
                    issues.append(QualityIssue(
                        "IMPORT_RESOLUTION",
                        "HIGH",
                        f"Cannot resolve import: {line.strip()}",
                        line_number=line_num,
                        recommendation="Check import path validity"
                    ))
        
        return issues
    
    def _validate_pytest_collection(self, test_file_path: str) -> Dict:
        """Validate that pytest can collect the test file"""
        try:
            result = subprocess.run(
                ['python', '-m', 'pytest', '--collect-only', '-q', test_file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return {'success': True, 'error': None}
            else:
                return {'success': False, 'error': f"Pytest collection failed: {result.stderr}"}
                
        except subprocess.TimeoutExpired:
            return {'success': False, 'error': "Pytest collection timeout"}
        except Exception as e:
            return {'success': False, 'error': f"Pytest collection error: {e}"}
    
    def _validate_fixtures(self, content: str) -> List[QualityIssue]:
        """Validate fixture usage and definitions"""
        issues = []
        
        # Find fixture usage
        fixture_matches = re.findall(r'def test_\w+\([^)]*(\w+)[^)]*\):', content)
        fixture_definitions = re.findall(r'@pytest\.fixture[^\n]*\ndef (\w+)', content)
        
        # Check for undefined fixtures
        for fixture in fixture_matches:
            if fixture not in fixture_definitions and fixture not in ['client', 'db_session', 'test_data']:
                issues.append(QualityIssue(
                    "FIXTURE_UNDEFINED",
                    "MEDIUM",
                    f"Fixture '{fixture}' is used but not defined",
                    recommendation="Define fixture or import from conftest.py"
                ))
        
        return issues
    
    def _validate_test_coverage(self, test_file_path: str) -> Dict:
        """Stage 2: Test coverage validation"""
        issues = []
        score = 25  # Start with perfect coverage score
        
        try:
            with open(test_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Count test methods
            test_methods = re.findall(r'def (test_\w+)', content)
            
            if len(test_methods) < self.MIN_SCENARIOS_PER_ENDPOINT:
                issues.append(QualityIssue(
                    "INSUFFICIENT_COVERAGE",
                    "HIGH",
                    f"Only {len(test_methods)} test methods, minimum {self.MIN_SCENARIOS_PER_ENDPOINT} required",
                    recommendation=f"Add more test scenarios to reach minimum {self.MIN_SCENARIOS_PER_ENDPOINT}"
                ))
                score -= 10
            
            # Check for CRUD operation coverage
            crud_patterns = {
                'create': ['test_create', 'test_post'],
                'read': ['test_get', 'test_read'],
                'update': ['test_put', 'test_update', 'test_patch'],
                'delete': ['test_delete']
            }
            
            missing_crud = []
            for operation, patterns in crud_patterns.items():
                if not any(pattern in content for pattern in patterns):
                    missing_crud.append(operation)
            
            if missing_crud:
                issues.append(QualityIssue(
                    "MISSING_CRUD_COVERAGE",
                    "MEDIUM",
                    f"Missing CRUD operations: {', '.join(missing_crud)}",
                    recommendation="Add test methods for missing CRUD operations"
                ))
                score -= 5 * len(missing_crud)
            
            # Check for error scenario coverage
            error_patterns = ['4', '5', 'error', 'invalid', 'unauthorized']
            error_scenarios = sum(1 for method in test_methods 
                                if any(pattern in method.lower() for pattern in error_patterns))
            
            if error_scenarios < 2:
                issues.append(QualityIssue(
                    "INSUFFICIENT_ERROR_SCENARIOS",
                    "MEDIUM",
                    f"Only {error_scenarios} error scenarios found, minimum 2 required",
                    recommendation="Add more error/edge case test scenarios"
                ))
                score -= 5
            
        except Exception as e:
            issues.append(QualityIssue(
                "COVERAGE_VALIDATION_ERROR",
                "HIGH",
                f"Could not validate coverage: {e}",
                recommendation="Manual review required"
            ))
            score = 0
        
        return {'score': max(0, score), 'issues': issues}
    
    def _validate_assertion_quality(self, test_file_path: str) -> Dict:
        """Stage 3: Assertion quality validation"""
        issues = []
        score = 20  # Start with perfect assertion score
        
        try:
            with open(test_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Count assertions
            assertion_count = content.count('assert ')
            test_methods = len(re.findall(r'def test_\w+', content))
            
            if test_methods == 0:
                return {'score': 0, 'issues': [QualityIssue(
                    "NO_TEST_METHODS",
                    "CRITICAL",
                    "No test methods found",
                    recommendation="Add test methods to file"
                )]}
            
            assertion_density = assertion_count / test_methods
            
            if assertion_density < self.MIN_ASSERTIONS_PER_METHOD:
                issues.append(QualityIssue(
                    "LOW_ASSERTION_DENSITY",
                    "HIGH",
                    f"Assertion density {assertion_density:.1f} below minimum {self.MIN_ASSERTIONS_PER_METHOD}",
                    recommendation=f"Add more assertions to reach minimum {self.MIN_ASSERTIONS_PER_METHOD} per method"
                ))
                score -= 10
            
            # Check for status code assertions
            if 'status_code' not in content:
                issues.append(QualityIssue(
                    "MISSING_STATUS_CODE_ASSERTIONS",
                    "MEDIUM",
                    "No status code assertions found",
                    recommendation="Add HTTP status code validation"
                ))
                score -= 5
            
            # Check for response structure validation
            structure_patterns = ['json()', 'response.data', 'schema']
            if not any(pattern in content for pattern in structure_patterns):
                issues.append(QualityIssue(
                    "MISSING_RESPONSE_VALIDATION",
                    "MEDIUM",
                    "No response structure validation found",
                    recommendation="Add response data structure validation"
                ))
                score -= 5
                
        except Exception as e:
            issues.append(QualityIssue(
                "ASSERTION_VALIDATION_ERROR",
                "HIGH",
                f"Could not validate assertions: {e}",
                recommendation="Manual review required"
            ))
            score = 0
        
        return {'score': max(0, score), 'issues': issues}
    
    def _validate_test_structure(self, test_file_path: str) -> Dict:
        """Stage 4: Test structure validation"""
        issues = []
        score = 15  # Start with perfect structure score
        
        try:
            with open(test_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check naming convention
            file_name = os.path.basename(test_file_path)
            if not re.match(r'test_[a-zA-Z0-9_]+\.py$', file_name):
                issues.append(QualityIssue(
                    "NAMING_CONVENTION",
                    "LOW",
                    "File name doesn't follow test_*.py convention",
                    recommendation="Rename file to follow test_*.py pattern"
                ))
                score -= 2
            
            # Check for class organization
            test_classes = re.findall(r'class (Test\w+):', content)
            if not test_classes and len(re.findall(r'def test_\w+', content)) > 5:
                issues.append(QualityIssue(
                    "TEST_ORGANIZATION",
                    "LOW",
                    "Many test methods without class organization",
                    recommendation="Consider organizing tests into classes"
                ))
                score -= 3
            
            # Check for docstrings
            if '"""' not in content and "'''" not in content:
                issues.append(QualityIssue(
                    "MISSING_DOCUMENTATION",
                    "LOW",
                    "No docstrings found",
                    recommendation="Add docstrings for better documentation"
                ))
                score -= 2
                
        except Exception as e:
            issues.append(QualityIssue(
                "STRUCTURE_VALIDATION_ERROR",
                "MEDIUM",
                f"Could not validate structure: {e}",
                recommendation="Manual review required"
            ))
            score = 0
        
        return {'score': max(0, score), 'issues': issues}
    
    def _validate_maintainability(self, test_file_path: str) -> Dict:
        """Stage 5: Maintainability assessment"""
        issues = []
        score = 10  # Start with perfect maintainability score
        
        try:
            with open(test_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check file size (maintainability indicator)
            if len(content) > 10000:  # 10KB threshold
                issues.append(QualityIssue(
                    "LARGE_FILE_SIZE",
                    "LOW",
                    "Test file is quite large, may be hard to maintain",
                    recommendation="Consider splitting into smaller, focused test files"
                ))
                score -= 2
            
            # Check for hardcoded values
            hardcoded_patterns = [r'"http://[^"]*"', r'"https://[^"]*"', r':\d{4,5}']
            hardcoded_found = any(re.search(pattern, content) for pattern in hardcoded_patterns)
            
            if hardcoded_found:
                issues.append(QualityIssue(
                    "HARDCODED_VALUES",
                    "LOW",
                    "Hardcoded URLs or values found",
                    recommendation="Use configuration or fixtures for URLs and constants"
                ))
                score -= 3
            
            # Check for proper error handling in tests
            if 'try:' in content and 'except:' in content:
                issues.append(QualityIssue(
                    "BROAD_EXCEPTION_HANDLING",
                    "LOW",
                    "Broad exception handling found in tests",
                    recommendation="Use specific exception types or pytest.raises"
                ))
                score -= 2
                
        except Exception as e:
            issues.append(QualityIssue(
                "MAINTAINABILITY_VALIDATION_ERROR",
                "MEDIUM",
                f"Could not validate maintainability: {e}",
                recommendation="Manual review required"
            ))
            score = 0
        
        return {'score': max(0, score), 'issues': issues}
    
    def _calculate_overall_score(self, scores: Dict[str, float]) -> float:
        """Calculate weighted overall quality score"""
        weights = self.quality_criteria
        
        total_score = (
            scores['syntax_score'] * (weights['syntax_validation']['weight'] / 30) +
            scores['coverage_score'] * (weights['test_coverage']['weight'] / 25) +
            scores['assertion_score'] * (weights['assertion_quality']['weight'] / 20) +
            scores['structure_score'] * (weights['test_structure']['weight'] / 15) +
            scores['maintainability_score'] * (weights['maintainability']['weight'] / 10)
        )
        
        return round(total_score, 1)
    
    def _determine_grade(self, score: float) -> str:
        """Determine quality grade based on score"""
        if score >= self.QUALITY_THRESHOLDS["EXCELLENT"]:
            return "EXCELLENT"
        elif score >= self.QUALITY_THRESHOLDS["GOOD"]:
            return "GOOD"
        elif score >= self.QUALITY_THRESHOLDS["ACCEPTABLE"]:
            return "ACCEPTABLE"
        elif score >= self.QUALITY_THRESHOLDS["POOR"]:
            return "POOR"
        else:
            return "UNACCEPTABLE"
    
    def _generate_recommendations(self, issues: List[QualityIssue], overall_score: float) -> List[str]:
        """Generate actionable recommendations based on issues"""
        recommendations = []
        
        # Priority recommendations based on critical issues
        critical_issues = [issue for issue in issues if issue.severity == "CRITICAL"]
        if critical_issues:
            recommendations.append("CRITICAL: Address syntax errors immediately before proceeding")
            return recommendations
        
        # High priority issues
        high_issues = [issue for issue in issues if issue.severity == "HIGH"]
        if high_issues:
            recommendations.append("HIGH PRIORITY: Fix major quality issues before approval")
        
        # Score-based recommendations
        if overall_score < 60:
            recommendations.append("REJECT_AND_REGENERATE: Fundamental quality issues require regeneration")
        elif overall_score < 75:
            recommendations.append("REQUIRES_MODIFICATION: Specific improvements needed before approval")
        elif overall_score < 90:
            recommendations.append("APPROVE_WITH_NOTES: Minor improvements recommended")
        else:
            recommendations.append("AUTO_APPROVE: Excellent quality, ready for production")
        
        # Specific improvement recommendations
        for issue in issues:
            if issue.recommendation and issue.severity in ["HIGH", "MEDIUM"]:
                recommendations.append(f"{issue.severity}: {issue.recommendation}")
        
        return recommendations


# Quality gate validation CLI interface
def validate_test_files(file_patterns: List[str]) -> Dict:
    """Batch validate test files matching patterns"""
    engine = QualityGateEngine()
    results = {}
    
    for pattern in file_patterns:
        files = Path('.').glob(pattern)
        for file_path in files:
            if file_path.name.startswith('test_') and file_path.suffix == '.py':
                result = engine.validate_test_file(str(file_path))
                results[str(file_path)] = result
    
    return results


if __name__ == "__main__":
    # Example usage for testing
    print("QA Quality Gates - Test File Validation")
    print("=" * 50)
    
    # Test with sample files
    test_results = validate_test_files(['tests/generated/test_*.py'])
    
    total_files = len(test_results)
    passed_files = sum(1 for result in test_results.values() if result.passed)
    
    print(f"Validated {total_files} test files")
    print(f"Passed quality gates: {passed_files}/{total_files} ({passed_files/total_files*100:.1f}%)")
    
    # Show summary by grade
    grades = {}
    for result in test_results.values():
        grade = result.quality_score.grade
        grades[grade] = grades.get(grade, 0) + 1
    
    print("\nQuality Grade Distribution:")
    for grade, count in sorted(grades.items()):
        print(f"  {grade}: {count} files")