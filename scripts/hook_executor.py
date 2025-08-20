#!/usr/bin/env python3
"""
Development Hooks Executor for Claude AI Development Process
Automatically triggers specialized agents at specific development stages
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class StageStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    REVIEW_REQUIRED = "review_required"
    APPROVED = "approved"

@dataclass
class HookExecution:
    stage: str
    agents: List[str]
    purpose: str
    gate_criteria: List[str]
    required_artifacts: List[str]
    status: StageStatus = StageStatus.PENDING

class DevelopmentHookExecutor:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.hooks_config = self._load_hooks_config()
        self.execution_log = []
        
    def _load_hooks_config(self) -> Dict:
        """Load the development hooks configuration"""
        config_path = self.project_root / "scripts" / "development-hooks.json"
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Hooks configuration not found at {config_path}")
    
    def check_stage_completion(self, stage_name: str) -> bool:
        """Check if all required artifacts exist for a stage"""
        stage_config = self.hooks_config["development_hooks"]["stage_hooks"].get(stage_name)
        if not stage_config:
            return False
            
        required_artifacts = stage_config.get("required_artifacts", [])
        for artifact in required_artifacts:
            artifact_path = self.project_root / artifact
            if not artifact_path.exists():
                print(f"❌ Missing required artifact: {artifact}")
                return False
        
        print(f"✅ All required artifacts present for {stage_name}")
        return True
    
    def execute_stage_hooks(self, stage_name: str) -> List[HookExecution]:
        """Execute hooks for a specific stage"""
        stage_config = self.hooks_config["development_hooks"]["stage_hooks"].get(stage_name)
        if not stage_config:
            print(f"⚠️ No hooks configured for stage: {stage_name}")
            return []
        
        if not self.check_stage_completion(stage_name):
            print(f"❌ Stage {stage_name} not ready for review - missing artifacts")
            return []
        
        agents = stage_config["agents"]
        purpose = stage_config["purpose"]
        gate_criteria = stage_config["gate_criteria"]
        required_artifacts = stage_config["required_artifacts"]
        
        print(f"🚀 Executing hooks for {stage_name}")
        print(f"   Purpose: {purpose}")
        print(f"   Agents: {', '.join(agents)}")
        print(f"   Gate Criteria: {', '.join(gate_criteria)}")
        
        executions = []
        for agent in agents:
            execution = HookExecution(
                stage=stage_name,
                agents=[agent],
                purpose=purpose,
                gate_criteria=gate_criteria,
                required_artifacts=required_artifacts,
                status=StageStatus.REVIEW_REQUIRED
            )
            executions.append(execution)
            self._trigger_agent_review(execution)
        
        return executions
    
    def _trigger_agent_review(self, execution: HookExecution):
        """Trigger a specialized agent for review"""
        agent = execution.agents[0]
        print(f"🤖 Triggering {agent} for {execution.stage} review")
        
        # Generate Claude Code Task prompt
        prompt = self._generate_review_prompt(execution)
        
        # In a real implementation, this would call the Claude Code Task tool
        # For now, we'll log the intended action
        print(f"   📝 Review prompt: {prompt[:100]}...")
        
        # Log the execution
        self.execution_log.append({
            "stage": execution.stage,
            "agent": agent,
            "purpose": execution.purpose,
            "timestamp": "2025-08-14T00:00:00Z",  # Would use actual timestamp
            "status": "triggered"
        })
    
    def _generate_review_prompt(self, execution: HookExecution) -> str:
        """Generate a review prompt for the specialized agent"""
        template = self.hooks_config["development_hooks"]["hook_execution"]["prompt_template"]
        
        return template.format(
            stage_name=execution.stage,
            purpose=execution.purpose,
            gate_criteria=", ".join(execution.gate_criteria),
            required_artifacts=", ".join(execution.required_artifacts)
        )
    
    def get_agent_responsibilities(self, agent_name: str) -> Dict:
        """Get the responsibilities for a specific agent"""
        return self.hooks_config["development_hooks"]["agent_responsibilities"].get(agent_name, {})
    
    def generate_stage_report(self, stage_name: str) -> str:
        """Generate a completion report for a stage"""
        stage_config = self.hooks_config["development_hooks"]["stage_hooks"].get(stage_name)
        if not stage_config:
            return f"No configuration found for stage: {stage_name}"
        
        report = f"""
# {stage_name.replace('_', ' ').title()} Completion Report

## Stage Configuration
- **Purpose**: {stage_config['purpose']}
- **Required Agents**: {', '.join(stage_config['agents'])}
- **Gate Criteria**: {', '.join(stage_config['gate_criteria'])}

## Artifact Status
"""
        
        for artifact in stage_config.get("required_artifacts", []):
            artifact_path = self.project_root / artifact
            status = "✅ Present" if artifact_path.exists() else "❌ Missing"
            report += f"- {artifact}: {status}\n"
        
        return report
    
    def list_upcoming_stages(self, current_stage: str) -> List[str]:
        """List the next stages that will require hooks"""
        stages = list(self.hooks_config["development_hooks"]["stage_hooks"].keys())
        try:
            current_index = stages.index(current_stage)
            return stages[current_index + 1:current_index + 4]  # Next 3 stages
        except ValueError:
            return stages[:3]  # First 3 stages if current not found

def main():
    """Main execution function for testing"""
    if len(sys.argv) < 2:
        print("Usage: python hook_executor.py <stage_name>")
        print("Example: python hook_executor.py stage_2_problem_statement")
        return
    
    project_root = Path(__file__).parent.parent
    executor = DevelopmentHookExecutor(str(project_root))
    
    stage_name = sys.argv[1]
    
    print(f"🔍 Checking stage: {stage_name}")
    executions = executor.execute_stage_hooks(stage_name)
    
    if executions:
        print(f"\n📋 Executed {len(executions)} hook(s)")
        for execution in executions:
            print(f"   - {execution.agents[0]}: {execution.purpose}")
    else:
        print("ℹ️ No hooks executed")
    
    # Show upcoming stages
    upcoming = executor.list_upcoming_stages(stage_name)
    if upcoming:
        print(f"\n📅 Upcoming stages with hooks:")
        for stage in upcoming:
            print(f"   - {stage.replace('_', ' ').title()}")

if __name__ == "__main__":
    main()