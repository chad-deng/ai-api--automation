"""
Git Conflict Detection and Resolution
Handles merge conflicts and provides resolution strategies
"""
import os
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from pathlib import Path
import structlog
import git

from src.git.service import GitService
from src.git.models import GitOperation, GitOperationType, GitOperationStatus
from src.database.models import SessionLocal

logger = structlog.get_logger()


class ConflictType:
    CONTENT = "content"
    BINARY = "binary"
    RENAME = "rename"
    DELETE_MODIFY = "delete_modify"
    BOTH_ADDED = "both_added"
    BOTH_MODIFIED = "both_modified"


class ConflictResolution:
    ACCEPT_CURRENT = "accept_current"
    ACCEPT_INCOMING = "accept_incoming"
    MANUAL = "manual"
    AUTO_MERGE = "auto_merge"
    SKIP = "skip"


class GitConflictResolver:
    """Handles Git merge conflicts for automated test integration"""
    
    def __init__(self):
        self.git_service = GitService()
    
    async def _get_db_session(self):
        """Get database session"""
        if not SessionLocal:
            from src.database.models import init_db
            await init_db()
        return SessionLocal()
    
    async def detect_conflicts(
        self,
        repository_id: int,
        source_branch: str,
        target_branch: str
    ) -> Dict[str, Any]:
        """Detect potential conflicts before merge"""
        db = await self._get_db_session()
        
        try:
            repo_entry = await self.git_service.get_repository(repository_id)
            if not repo_entry or not repo_entry.local_path:
                raise ValueError("Repository not found or no local path")
            
            repo = self.git_service._get_repo_instance(repo_entry.local_path)
            
            # Create conflict detection operation
            operation = GitOperation(
                repository_id=repository_id,
                operation_type=GitOperationType.MERGE,
                status=GitOperationStatus.IN_PROGRESS,
                branch_name=source_branch,
                triggered_by="conflict-detection",
                started_at=datetime.now(timezone.utc),
                metadata={"target_branch": target_branch}
            )
            db.add(operation)
            db.commit()
            db.refresh(operation)
            
            try:
                # Ensure we're on target branch
                repo.git.checkout(target_branch)
                repo.git.pull()
                
                # Try a test merge to detect conflicts
                conflicts = self._perform_test_merge(repo, source_branch, target_branch)
                
                operation.status = GitOperationStatus.COMPLETED
                operation.completed_at = datetime.now(timezone.utc)
                operation.metadata.update({"conflicts": conflicts})
                
                if conflicts:
                    operation.output = f"Detected {len(conflicts)} potential conflicts"
                else:
                    operation.output = "No conflicts detected"
                
                db.commit()
                
                logger.info("Conflict detection completed",
                           repository_id=repository_id,
                           source_branch=source_branch,
                           target_branch=target_branch,
                           conflicts_count=len(conflicts))
                
                return {
                    "has_conflicts": len(conflicts) > 0,
                    "conflicts": conflicts,
                    "merge_possible": len(conflicts) == 0,
                    "operation_id": operation.id
                }
                
            except Exception as e:
                operation.status = GitOperationStatus.FAILED
                operation.error_message = str(e)
                operation.completed_at = datetime.now(timezone.utc)
                db.commit()
                raise
                
        finally:
            db.close()
    
    def _perform_test_merge(
        self,
        repo: git.Repo,
        source_branch: str,
        target_branch: str
    ) -> List[Dict[str, Any]]:
        """Perform a test merge to detect conflicts"""
        conflicts = []
        
        try:
            # Create a temporary branch for testing
            test_branch = f"conflict-test-{int(datetime.now().timestamp())}"
            repo.git.checkout('-b', test_branch, target_branch)
            
            try:
                # Attempt merge
                repo.git.merge(source_branch, '--no-commit', '--no-ff')
                
                # Check for conflicts
                if repo.index.unmerged_blobs():
                    for file_path in repo.index.unmerged_blobs():
                        conflict_info = self._analyze_conflict(repo, file_path)
                        conflicts.append(conflict_info)
                
            except git.exc.GitCommandError as e:
                # Parse Git error output for conflict information
                if "CONFLICT" in str(e):
                    conflicts.extend(self._parse_conflict_output(str(e)))
            
            finally:
                # Clean up test branch
                repo.git.merge('--abort', ignore_errors=True)
                repo.git.checkout(target_branch)
                repo.git.branch('-D', test_branch, ignore_errors=True)
        
        except Exception as e:
            logger.error("Test merge failed", error=str(e))
            # Fallback to diff-based conflict detection
            conflicts = self._detect_conflicts_via_diff(repo, source_branch, target_branch)
        
        return conflicts
    
    def _analyze_conflict(self, repo: git.Repo, file_path: str) -> Dict[str, Any]:
        """Analyze a specific file conflict"""
        try:
            # Get file content with conflict markers
            file_full_path = os.path.join(repo.working_dir, file_path)
            with open(file_full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Parse conflict markers
            conflict_sections = self._parse_conflict_markers(content)
            
            return {
                "file_path": file_path,
                "conflict_type": self._determine_conflict_type(content),
                "conflict_sections": conflict_sections,
                "resolution_strategy": self._suggest_resolution_strategy(file_path, content),
                "auto_resolvable": self._is_auto_resolvable(content),
                "lines_affected": len([l for l in content.split('\n') if any(marker in l for marker in ['<<<<<<<', '=======', '>>>>>>>'])])
            }
            
        except Exception as e:
            logger.error("Failed to analyze conflict", file_path=file_path, error=str(e))
            return {
                "file_path": file_path,
                "conflict_type": ConflictType.CONTENT,
                "error": str(e),
                "auto_resolvable": False
            }
    
    def _parse_conflict_markers(self, content: str) -> List[Dict[str, str]]:
        """Parse Git conflict markers in file content"""
        sections = []
        lines = content.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            if line.startswith('<<<<<<<'):
                # Start of conflict section
                current_section = []
                separator_index = None
                end_index = None
                
                # Find the separator and end
                for j in range(i + 1, len(lines)):
                    if lines[j].strip() == '=======':
                        separator_index = j
                    elif lines[j].strip().startswith('>>>>>>>'):
                        end_index = j
                        break
                
                if separator_index and end_index:
                    sections.append({
                        "current_content": '\n'.join(lines[i+1:separator_index]),
                        "incoming_content": '\n'.join(lines[separator_index+1:end_index]),
                        "current_branch": line.split(' ')[-1] if ' ' in line else "HEAD",
                        "incoming_branch": lines[end_index].split(' ')[-1] if ' ' in lines[end_index] else "unknown",
                        "start_line": i + 1,
                        "end_line": end_index + 1
                    })
                    
                    i = end_index + 1
                else:
                    i += 1
            else:
                i += 1
        
        return sections
    
    def _determine_conflict_type(self, content: str) -> str:
        """Determine the type of conflict"""
        if '<<<<<<<' in content and '=======' in content and '>>>>>>>' in content:
            return ConflictType.CONTENT
        elif 'both added' in content.lower():
            return ConflictType.BOTH_ADDED
        elif 'both modified' in content.lower():
            return ConflictType.BOTH_MODIFIED
        elif 'deleted by' in content.lower():
            return ConflictType.DELETE_MODIFY
        else:
            return ConflictType.CONTENT
    
    def _suggest_resolution_strategy(self, file_path: str, content: str) -> str:
        """Suggest resolution strategy based on file type and conflict"""
        file_ext = Path(file_path).suffix.lower()
        
        # For test files, prefer incoming changes (new tests)
        if any(pattern in file_path.lower() for pattern in ['test_', 'tests/', '_test.py']):
            return ConflictResolution.ACCEPT_INCOMING
        
        # For configuration files, be more cautious
        if file_ext in ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg']:
            return ConflictResolution.MANUAL
        
        # For binary files, manual resolution required
        if file_ext in ['.jpg', '.png', '.gif', '.pdf', '.zip', '.tar', '.gz']:
            return ConflictResolution.MANUAL
        
        # Check if conflict is simple (non-overlapping changes)
        if self._is_simple_conflict(content):
            return ConflictResolution.AUTO_MERGE
        
        return ConflictResolution.MANUAL
    
    def _is_auto_resolvable(self, content: str) -> bool:
        """Check if conflict can be automatically resolved"""
        conflict_sections = self._parse_conflict_markers(content)
        
        for section in conflict_sections:
            current = section.get('current_content', '').strip()
            incoming = section.get('incoming_content', '').strip()
            
            # If one side is empty, can be auto-resolved
            if not current or not incoming:
                continue
            
            # If changes are in different parts of the file, potentially auto-resolvable
            if not self._changes_overlap(current, incoming):
                continue
            
            # Otherwise, needs manual resolution
            return False
        
        return True
    
    def _is_simple_conflict(self, content: str) -> bool:
        """Check if this is a simple, non-overlapping conflict"""
        return self._is_auto_resolvable(content)
    
    def _changes_overlap(self, current: str, incoming: str) -> bool:
        """Check if changes overlap significantly"""
        current_lines = set(current.split('\n'))
        incoming_lines = set(incoming.split('\n'))
        
        # If there's significant overlap in modified lines, consider it overlapping
        overlap = current_lines.intersection(incoming_lines)
        
        return len(overlap) > min(len(current_lines), len(incoming_lines)) * 0.5
    
    def _detect_conflicts_via_diff(
        self,
        repo: git.Repo,
        source_branch: str,
        target_branch: str
    ) -> List[Dict[str, Any]]:
        """Fallback conflict detection using diff analysis"""
        conflicts = []
        
        try:
            # Get diff between branches
            diff = repo.git.diff(target_branch, source_branch, '--name-only').split('\n')
            
            for file_path in diff:
                if file_path.strip():
                    conflicts.append({
                        "file_path": file_path,
                        "conflict_type": ConflictType.CONTENT,
                        "resolution_strategy": self._suggest_resolution_strategy(file_path, ""),
                        "auto_resolvable": False,
                        "detected_via": "diff_analysis"
                    })
        
        except Exception as e:
            logger.error("Diff-based conflict detection failed", error=str(e))
        
        return conflicts
    
    def _parse_conflict_output(self, error_output: str) -> List[Dict[str, Any]]:
        """Parse Git command error output for conflict information"""
        conflicts = []
        lines = error_output.split('\n')
        
        for line in lines:
            if 'CONFLICT' in line:
                # Parse different conflict types
                if 'content' in line.lower():
                    match = re.search(r'CONFLICT \(content\): Merge conflict in (.+)', line)
                    if match:
                        conflicts.append({
                            "file_path": match.group(1),
                            "conflict_type": ConflictType.CONTENT,
                            "resolution_strategy": ConflictResolution.MANUAL,
                            "auto_resolvable": False
                        })
                        
                elif 'rename/delete' in line.lower():
                    match = re.search(r'CONFLICT \(rename/delete\): (.+)', line)
                    if match:
                        conflicts.append({
                            "file_path": match.group(1),
                            "conflict_type": ConflictType.DELETE_MODIFY,
                            "resolution_strategy": ConflictResolution.MANUAL,
                            "auto_resolvable": False
                        })
        
        return conflicts
    
    async def auto_resolve_conflicts(
        self,
        repository_id: int,
        conflicts: List[Dict[str, Any]],
        resolution_strategy: str = "smart"
    ) -> Dict[str, Any]:
        """Attempt to automatically resolve conflicts"""
        db = await self._get_db_session()
        
        try:
            repo_entry = await self.git_service.get_repository(repository_id)
            if not repo_entry or not repo_entry.local_path:
                raise ValueError("Repository not found")
            
            repo = self.git_service._get_repo_instance(repo_entry.local_path)
            
            resolved_count = 0
            failed_resolutions = []
            
            for conflict in conflicts:
                file_path = conflict.get('file_path', '')
                
                try:
                    if conflict.get('auto_resolvable', False):
                        success = await self._resolve_single_conflict(
                            repo, file_path, conflict, resolution_strategy
                        )
                        
                        if success:
                            resolved_count += 1
                        else:
                            failed_resolutions.append(conflict)
                    else:
                        failed_resolutions.append(conflict)
                        
                except Exception as e:
                    logger.error("Failed to resolve conflict",
                               file_path=file_path, error=str(e))
                    failed_resolutions.append({**conflict, "resolution_error": str(e)})
            
            return {
                "resolved_count": resolved_count,
                "failed_count": len(failed_resolutions),
                "failed_resolutions": failed_resolutions,
                "all_resolved": len(failed_resolutions) == 0
            }
            
        finally:
            db.close()
    
    async def _resolve_single_conflict(
        self,
        repo: git.Repo,
        file_path: str,
        conflict: Dict[str, Any],
        strategy: str
    ) -> bool:
        """Resolve a single file conflict"""
        try:
            file_full_path = os.path.join(repo.working_dir, file_path)
            
            if not os.path.exists(file_full_path):
                return False
            
            with open(file_full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Apply resolution strategy
            resolved_content = self._apply_resolution_strategy(
                content, conflict, strategy
            )
            
            if resolved_content != content:
                with open(file_full_path, 'w', encoding='utf-8') as f:
                    f.write(resolved_content)
                
                # Stage the resolved file
                repo.git.add(file_path)
                
                logger.info("Resolved conflict", file_path=file_path, strategy=strategy)
                return True
            
            return False
            
        except Exception as e:
            logger.error("Failed to resolve single conflict",
                        file_path=file_path, error=str(e))
            return False
    
    def _apply_resolution_strategy(
        self,
        content: str,
        conflict: Dict[str, Any],
        strategy: str
    ) -> str:
        """Apply resolution strategy to file content"""
        if not any(marker in content for marker in ['<<<<<<<', '=======', '>>>>>>>']):
            return content
        
        lines = content.split('\n')
        resolved_lines = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            if line.strip().startswith('<<<<<<<'):
                # Find conflict section boundaries
                separator_idx = None
                end_idx = None
                
                for j in range(i + 1, len(lines)):
                    if lines[j].strip() == '=======':
                        separator_idx = j
                    elif lines[j].strip().startswith('>>>>>>>'):
                        end_idx = j
                        break
                
                if separator_idx is not None and end_idx is not None:
                    current_section = lines[i+1:separator_idx]
                    incoming_section = lines[separator_idx+1:end_idx]
                    
                    # Apply strategy
                    if strategy == ConflictResolution.ACCEPT_CURRENT:
                        resolved_lines.extend(current_section)
                    elif strategy == ConflictResolution.ACCEPT_INCOMING:
                        resolved_lines.extend(incoming_section)
                    elif strategy == ConflictResolution.AUTO_MERGE:
                        # Simple merge: combine non-overlapping changes
                        resolved_lines.extend(current_section)
                        resolved_lines.extend(incoming_section)
                    else:
                        # Keep conflict markers for manual resolution
                        resolved_lines.extend(lines[i:end_idx+1])
                    
                    i = end_idx + 1
                else:
                    resolved_lines.append(line)
                    i += 1
            else:
                resolved_lines.append(line)
                i += 1
        
        return '\n'.join(resolved_lines)