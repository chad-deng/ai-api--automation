"""
Quarantine Manager for Test File Quality Recovery
Handles quarantined files and systematic quality improvement
"""

import os
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import logging

from .quality_gates import QualityGateEngine, QualityIssue, ValidationResult

logger = logging.getLogger(__name__)


@dataclass
class QuarantineMetadata:
    """Metadata for quarantined test file"""
    original_path: str
    quarantine_timestamp: str
    quarantine_reason: str
    quality_issues: List[Dict]
    api_endpoint: str
    generation_config: Dict
    recovery_attempts: int
    priority_level: str
    last_recovery_attempt: Optional[str] = None
    recovery_notes: List[str] = None
    
    def __post_init__(self):
        if self.recovery_notes is None:
            self.recovery_notes = []
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'QuarantineMetadata':
        return cls(**data)


@dataclass  
class RecoveryStrategy:
    """Strategy for recovering quarantined files"""
    strategy_type: str
    priority: str
    auto_recovery: bool
    max_attempts: int
    recovery_actions: List[str]
    estimated_success_rate: float
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class RecoveryResult:
    """Result of recovery attempt"""
    success: bool
    new_quality_score: Optional[float]
    issues_resolved: List[str]
    remaining_issues: List[str]
    recovery_actions_taken: List[str]
    recommendations: List[str]
    
    def to_dict(self) -> Dict:
        return asdict(self)


class QuarantineManager:
    """Manages quarantined test files and recovery workflows"""
    
    def __init__(self, quarantine_dir: str = "qa-review/quarantine"):
        self.quarantine_dir = Path(quarantine_dir)
        self.quality_engine = QualityGateEngine()
        
        # Create quarantine directory structure
        self._ensure_quarantine_structure()
        
        # Recovery strategies configuration
        self.recovery_strategies = self._load_recovery_strategies()
    
    def _ensure_quarantine_structure(self):
        """Create quarantine directory structure"""
        directories = [
            self.quarantine_dir,
            self.quarantine_dir / "high_priority",
            self.quarantine_dir / "medium_priority", 
            self.quarantine_dir / "low_priority",
            self.quarantine_dir / "metadata",
            self.quarantine_dir / "recovered",
            self.quarantine_dir / "failed_recovery"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def _load_recovery_strategies(self) -> Dict[str, RecoveryStrategy]:
        """Load recovery strategies for different issue types"""
        return {
            "SYNTAX_ERRORS": RecoveryStrategy(
                strategy_type="template_regeneration",
                priority="critical",
                auto_recovery=True,
                max_attempts=3,
                recovery_actions=[
                    "Regenerate using improved template",
                    "Fix common syntax patterns",
                    "Validate imports and dependencies",
                    "Ensure pytest compatibility"
                ],
                estimated_success_rate=0.85
            ),
            
            "LOW_ASSERTION_DENSITY": RecoveryStrategy(
                strategy_type="assertion_enhancement", 
                priority="high",
                auto_recovery=True,
                max_attempts=2,
                recovery_actions=[
                    "Add status code assertions",
                    "Include response structure validation",
                    "Add business logic assertions",
                    "Insert error condition checks"
                ],
                estimated_success_rate=0.75
            ),
            
            "SCENARIO_COVERAGE_GAP": RecoveryStrategy(
                strategy_type="scenario_augmentation",
                priority="high", 
                auto_recovery=True,
                max_attempts=2,
                recovery_actions=[
                    "Generate missing CRUD operations",
                    "Add error scenario tests",
                    "Include edge case testing",
                    "Add authentication scenarios"
                ],
                estimated_success_rate=0.70
            ),
            
            "STRUCTURAL_ISSUES": RecoveryStrategy(
                strategy_type="template_improvement",
                priority="medium",
                auto_recovery=False,
                max_attempts=1,
                recovery_actions=[
                    "Improve test organization",
                    "Fix naming conventions", 
                    "Add proper documentation",
                    "Optimize test structure"
                ],
                estimated_success_rate=0.60
            ),
            
            "IMPORT_RESOLUTION": RecoveryStrategy(
                strategy_type="dependency_fixing",
                priority="high",
                auto_recovery=True,
                max_attempts=2,
                recovery_actions=[
                    "Fix import paths",
                    "Add missing dependencies",
                    "Update package references",
                    "Validate fixture imports"
                ],
                estimated_success_rate=0.80
            )
        }
    
    def quarantine_file(self, test_file_path: str, validation_result: ValidationResult) -> Dict:
        """
        Quarantine a test file with quality issues
        """
        try:
            # Determine quarantine reason and priority
            quarantine_reason = self._determine_quarantine_reason(validation_result)
            priority_level = self._assess_priority_level(validation_result)
            
            # Create quarantine metadata
            metadata = QuarantineMetadata(
                original_path=test_file_path,
                quarantine_timestamp=datetime.utcnow().isoformat(),
                quarantine_reason=quarantine_reason,
                quality_issues=[issue.to_dict() for issue in validation_result.issues],
                api_endpoint=self._extract_api_endpoint(test_file_path),
                generation_config=self._get_generation_config(test_file_path),
                recovery_attempts=0,
                priority_level=priority_level
            )
            
            # Move file to appropriate quarantine directory
            quarantine_subdir = self.quarantine_dir / f"{priority_level}_priority"
            file_name = Path(test_file_path).name
            quarantine_path = quarantine_subdir / file_name
            
            # Move the file
            shutil.move(test_file_path, quarantine_path)
            
            # Save metadata
            metadata_path = self.quarantine_dir / "metadata" / f"{file_name}.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata.to_dict(), f, indent=2)
            
            # Log quarantine event
            logger.warning(
                "Test file quarantined",
                file=test_file_path,
                reason=quarantine_reason,
                priority=priority_level,
                issues_count=len(validation_result.issues)
            )
            
            # Schedule auto-recovery if applicable
            auto_recovery_scheduled = self._should_auto_recover(validation_result)
            if auto_recovery_scheduled:
                self._schedule_recovery_attempt(quarantine_path, metadata)
            
            return {
                "quarantined": True,
                "quarantine_path": str(quarantine_path),
                "metadata_path": str(metadata_path),
                "priority_level": priority_level,
                "auto_recovery_scheduled": auto_recovery_scheduled
            }
            
        except Exception as e:
            logger.error(f"Failed to quarantine file {test_file_path}: {e}")
            return {"quarantined": False, "error": str(e)}
    
    def _determine_quarantine_reason(self, validation_result: ValidationResult) -> str:
        """Determine primary reason for quarantine"""
        critical_issues = [issue for issue in validation_result.issues if issue.severity == "CRITICAL"]
        if critical_issues:
            return critical_issues[0].category
        
        high_issues = [issue for issue in validation_result.issues if issue.severity == "HIGH"]
        if high_issues:
            return high_issues[0].category
            
        return "QUALITY_BELOW_THRESHOLD"
    
    def _assess_priority_level(self, validation_result: ValidationResult) -> str:
        """Assess priority level for quarantined file"""
        critical_count = len([issue for issue in validation_result.issues if issue.severity == "CRITICAL"])
        high_count = len([issue for issue in validation_result.issues if issue.severity == "HIGH"])
        
        if critical_count > 0:
            return "high"
        elif high_count > 2:
            return "high" 
        elif high_count > 0:
            return "medium"
        else:
            return "low"
    
    def _extract_api_endpoint(self, test_file_path: str) -> str:
        """Extract API endpoint from test file name"""
        file_name = Path(test_file_path).stem
        # Convert test file name to API endpoint
        if file_name.startswith('test_'):
            endpoint = file_name[5:].replace('_', '/')
            return f"/{endpoint}"
        return "unknown"
    
    def _get_generation_config(self, test_file_path: str) -> Dict:
        """Get generation configuration for the test file"""
        # This would normally load from generation metadata
        return {
            "template_used": "unknown",
            "generation_timestamp": "unknown",
            "api_spec_version": "unknown"
        }
    
    def _should_auto_recover(self, validation_result: ValidationResult) -> bool:
        """Determine if file should be scheduled for auto-recovery"""
        critical_issues = [issue for issue in validation_result.issues if issue.severity == "CRITICAL"]
        
        # Auto-recover if issues are recoverable
        recoverable_categories = ["SYNTAX_ERROR", "LOW_ASSERTION_DENSITY", "SCENARIO_COVERAGE_GAP", "IMPORT_RESOLUTION"]
        
        return any(issue.category in recoverable_categories for issue in critical_issues)
    
    def _schedule_recovery_attempt(self, quarantine_path: Path, metadata: QuarantineMetadata):
        """Schedule recovery attempt for quarantined file"""
        # This would normally integrate with task scheduler
        logger.info(f"Auto-recovery scheduled for {quarantine_path}")
    
    def process_quarantined_files(self) -> Dict:
        """
        Batch process quarantined files for recovery
        """
        results = {
            "processed": 0,
            "recovered": 0,
            "failed": 0,
            "skipped": 0,
            "details": []
        }
        
        # Process files by priority
        for priority in ["high", "medium", "low"]:
            priority_dir = self.quarantine_dir / f"{priority}_priority"
            if not priority_dir.exists():
                continue
                
            for quarantine_file in priority_dir.glob("test_*.py"):
                try:
                    recovery_result = self._attempt_recovery(quarantine_file)
                    results["details"].append(recovery_result)
                    results["processed"] += 1
                    
                    if recovery_result["success"]:
                        results["recovered"] += 1
                    else:
                        results["failed"] += 1
                        
                except Exception as e:
                    logger.error(f"Recovery failed for {quarantine_file}: {e}")
                    results["failed"] += 1
        
        # Generate summary report
        self._generate_recovery_report(results)
        
        return results
    
    def _attempt_recovery(self, quarantine_file: Path) -> Dict:
        """
        Attempt to recover a quarantined file
        """
        file_name = quarantine_file.name
        metadata_path = self.quarantine_dir / "metadata" / f"{file_name}.json"
        
        try:
            # Load metadata
            with open(metadata_path, 'r') as f:
                metadata_dict = json.load(f)
            metadata = QuarantineMetadata.from_dict(metadata_dict)
            
            # Check if max recovery attempts reached
            if metadata.recovery_attempts >= 3:
                return {
                    "file": str(quarantine_file),
                    "success": False,
                    "reason": "Max recovery attempts reached",
                    "action": "manual_review_required"
                }
            
            # Determine recovery strategy
            strategy = self._determine_recovery_strategy(metadata)
            
            # Execute recovery
            recovery_result = self._execute_recovery(quarantine_file, strategy, metadata)
            
            # Update metadata
            metadata.recovery_attempts += 1
            metadata.last_recovery_attempt = datetime.utcnow().isoformat()
            metadata.recovery_notes.append(f"Recovery attempt {metadata.recovery_attempts}: {recovery_result['result']}")
            
            # Save updated metadata
            with open(metadata_path, 'w') as f:
                json.dump(metadata.to_dict(), f, indent=2)
            
            return recovery_result
            
        except Exception as e:
            logger.error(f"Recovery attempt failed for {quarantine_file}: {e}")
            return {
                "file": str(quarantine_file),
                "success": False,
                "reason": f"Recovery error: {e}",
                "action": "manual_review_required"
            }
    
    def _determine_recovery_strategy(self, metadata: QuarantineMetadata) -> RecoveryStrategy:
        """Determine appropriate recovery strategy"""
        primary_issue = metadata.quarantine_reason
        
        # Map issue types to recovery strategies
        if primary_issue in self.recovery_strategies:
            return self.recovery_strategies[primary_issue]
        else:
            # Default strategy for unknown issues
            return RecoveryStrategy(
                strategy_type="manual_review",
                priority="low",
                auto_recovery=False,
                max_attempts=1,
                recovery_actions=["Manual review and correction required"],
                estimated_success_rate=0.30
            )
    
    def _execute_recovery(self, quarantine_file: Path, strategy: RecoveryStrategy, metadata: QuarantineMetadata) -> Dict:
        """
        Execute recovery strategy for quarantined file
        """
        try:
            if strategy.strategy_type == "template_regeneration":
                return self._recover_via_regeneration(quarantine_file, metadata)
            elif strategy.strategy_type == "assertion_enhancement":
                return self._recover_via_assertion_enhancement(quarantine_file, metadata)
            elif strategy.strategy_type == "scenario_augmentation":
                return self._recover_via_scenario_augmentation(quarantine_file, metadata)
            elif strategy.strategy_type == "dependency_fixing":
                return self._recover_via_dependency_fixing(quarantine_file, metadata)
            else:
                return {
                    "file": str(quarantine_file),
                    "success": False,
                    "result": "Unsupported recovery strategy",
                    "action": "manual_review_required"
                }
                
        except Exception as e:
            return {
                "file": str(quarantine_file),
                "success": False,
                "result": f"Recovery execution failed: {e}",
                "action": "manual_review_required"
            }
    
    def _recover_via_regeneration(self, quarantine_file: Path, metadata: QuarantineMetadata) -> Dict:
        """Recover by regenerating the test file with improved templates"""
        try:
            # This would normally trigger test regeneration with enhanced templates
            logger.info(f"Regenerating test file: {quarantine_file}")
            
            # For now, simulate recovery by fixing common syntax issues
            with open(quarantine_file, 'r') as f:
                content = f.read()
            
            # Apply common syntax fixes
            fixed_content = self._apply_syntax_fixes(content)
            
            # Write back the fixed content
            with open(quarantine_file, 'w') as f:
                f.write(fixed_content)
            
            # Validate the fixed file
            validation_result = self.quality_engine.validate_test_file(str(quarantine_file))
            
            if validation_result.quality_score.overall_score >= 60:
                # Move to recovered directory
                recovered_path = self.quarantine_dir / "recovered" / quarantine_file.name
                shutil.move(quarantine_file, recovered_path)
                
                return {
                    "file": str(quarantine_file),
                    "success": True,
                    "result": f"Regeneration successful, quality score: {validation_result.quality_score.overall_score}",
                    "new_path": str(recovered_path),
                    "quality_score": validation_result.quality_score.overall_score
                }
            else:
                return {
                    "file": str(quarantine_file),
                    "success": False,
                    "result": f"Regeneration insufficient, quality score: {validation_result.quality_score.overall_score}",
                    "quality_score": validation_result.quality_score.overall_score
                }
                
        except Exception as e:
            return {
                "file": str(quarantine_file),
                "success": False,
                "result": f"Regeneration failed: {e}",
                "action": "manual_review_required"
            }
    
    def _apply_syntax_fixes(self, content: str) -> str:
        """Apply common syntax fixes to test content"""
        # Common syntax fixes
        fixes = [
            # Fix common import issues
            ("from src.", "from src."),
            # Fix assertion patterns
            ("assert ==", "assert"),
            # Fix common pytest patterns
            ("def test_", "def test_"),
        ]
        
        fixed_content = content
        for old, new in fixes:
            fixed_content = fixed_content.replace(old, new)
        
        return fixed_content
    
    def _recover_via_assertion_enhancement(self, quarantine_file: Path, metadata: QuarantineMetadata) -> Dict:
        """Recover by enhancing assertions in test file"""
        # Implementation would add missing assertions
        return {"file": str(quarantine_file), "success": False, "result": "Not implemented"}
    
    def _recover_via_scenario_augmentation(self, quarantine_file: Path, metadata: QuarantineMetadata) -> Dict:
        """Recover by adding missing test scenarios"""
        # Implementation would add missing test scenarios
        return {"file": str(quarantine_file), "success": False, "result": "Not implemented"}
    
    def _recover_via_dependency_fixing(self, quarantine_file: Path, metadata: QuarantineMetadata) -> Dict:
        """Recover by fixing import and dependency issues"""
        # Implementation would fix import paths
        return {"file": str(quarantine_file), "success": False, "result": "Not implemented"}
    
    def _generate_recovery_report(self, results: Dict):
        """Generate recovery processing report"""
        report_path = self.quarantine_dir / f"recovery_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_processed": results["processed"],
                "successful_recoveries": results["recovered"],
                "failed_recoveries": results["failed"],
                "success_rate": results["recovered"] / max(results["processed"], 1) * 100
            },
            "details": results["details"]
        }
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Recovery report generated: {report_path}")
    
    def get_quarantine_stats(self) -> Dict:
        """Get current quarantine statistics"""
        stats = {
            "total_quarantined": 0,
            "by_priority": {"high": 0, "medium": 0, "low": 0},
            "by_issue_type": {},
            "recovery_stats": {"recovered": 0, "failed": 0}
        }
        
        # Count quarantined files
        for priority in ["high", "medium", "low"]:
            priority_dir = self.quarantine_dir / f"{priority}_priority"
            if priority_dir.exists():
                count = len(list(priority_dir.glob("test_*.py")))
                stats["by_priority"][priority] = count
                stats["total_quarantined"] += count
        
        # Count recovered files
        recovered_dir = self.quarantine_dir / "recovered"
        if recovered_dir.exists():
            stats["recovery_stats"]["recovered"] = len(list(recovered_dir.glob("test_*.py")))
        
        # Count failed recovery files  
        failed_dir = self.quarantine_dir / "failed_recovery"
        if failed_dir.exists():
            stats["recovery_stats"]["failed"] = len(list(failed_dir.glob("test_*.py")))
        
        return stats


# CLI interface for quarantine management
def main():
    """CLI interface for quarantine management"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Quarantine Manager CLI")
    parser.add_argument("--process", action="store_true", help="Process quarantined files")
    parser.add_argument("--stats", action="store_true", help="Show quarantine statistics")
    parser.add_argument("--quarantine-dir", default="qa-review/quarantine", help="Quarantine directory")
    
    args = parser.parse_args()
    
    manager = QuarantineManager(args.quarantine_dir)
    
    if args.stats:
        stats = manager.get_quarantine_stats()
        print("Quarantine Statistics:")
        print(f"Total quarantined: {stats['total_quarantined']}")
        print(f"High priority: {stats['by_priority']['high']}")
        print(f"Medium priority: {stats['by_priority']['medium']}")
        print(f"Low priority: {stats['by_priority']['low']}")
        print(f"Recovered: {stats['recovery_stats']['recovered']}")
        print(f"Failed recovery: {stats['recovery_stats']['failed']}")
    
    if args.process:
        print("Processing quarantined files...")
        results = manager.process_quarantined_files()
        print(f"Processed: {results['processed']}")
        print(f"Recovered: {results['recovered']}")
        print(f"Failed: {results['failed']}")


if __name__ == "__main__":
    main()