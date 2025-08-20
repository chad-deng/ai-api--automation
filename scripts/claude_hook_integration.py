#!/usr/bin/env python3
"""
Claude Code Integration for Development Hooks
Provides functions to trigger specialized agents using Claude's Task tool
"""

import json
from pathlib import Path
from typing import Dict, List, Optional

class ClaudeHookIntegration:
    """Integration layer between development hooks and Claude Code Task tool"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.hooks_config = self._load_hooks_config()
    
    def _load_hooks_config(self) -> Dict:
        """Load the development hooks configuration"""
        config_path = self.project_root / "scripts" / "development-hooks.json"
        with open(config_path, 'r') as f:
            return json.load(f)
    
    def generate_task_calls(self, stage_name: str) -> List[Dict]:
        """Generate Task tool calls for a specific stage"""
        stage_config = self.hooks_config["development_hooks"]["stage_hooks"].get(stage_name)
        if not stage_config:
            return []
        
        task_calls = []
        for agent in stage_config["agents"]:
            task_call = {
                "tool": "Task",
                "parameters": {
                    "subagent_type": agent,
                    "description": f"Review {stage_name} completion",
                    "prompt": self._generate_agent_prompt(stage_name, agent, stage_config)
                }
            }
            task_calls.append(task_call)
        
        return task_calls
    
    def _generate_agent_prompt(self, stage_name: str, agent: str, stage_config: Dict) -> str:
        """Generate a detailed prompt for a specific agent"""
        agent_responsibilities = self.hooks_config["development_hooks"]["agent_responsibilities"].get(agent, {})
        
        prompt = f"""Review the completion of {stage_name.replace('_', ' ').title()} for this API test automation project.

**Review Focus**: {stage_config['purpose']}

**Your Responsibilities as {agent}**:
- Focus Areas: {', '.join(agent_responsibilities.get('focus', []))}
- Key Artifacts to Review: {', '.join(agent_responsibilities.get('artifacts_reviewed', []))}

**Gate Criteria to Validate**:
{chr(10).join(f"- {criterion}" for criterion in stage_config['gate_criteria'])}

**Required Artifacts** (verify these exist and are complete):
{chr(10).join(f"- {artifact}" for artifact in stage_config.get('required_artifacts', []))}

**API-Focused Project Context**:
This is an API test automation framework project. Please prioritize:
- API contract validation and testing strategies
- Integration testing approaches over visual testing
- Performance testing capabilities
- CI/CD pipeline integration for API testing

Please provide:
1. Validation status for each gate criteria (✅ Pass / ❌ Fail / ⚠️ Needs Attention)
2. Specific recommendations for any issues found
3. Approval status for proceeding to the next stage
4. Any additional considerations for the API testing context

Return your review in a structured format with clear approval/rejection decision."""
        
        return prompt
    
    def get_stage_status_check_prompt(self, stage_name: str) -> str:
        """Generate a prompt to check if a stage is ready for hooks"""
        stage_config = self.hooks_config["development_hooks"]["stage_hooks"].get(stage_name)
        if not stage_config:
            return f"No configuration found for stage: {stage_name}"
        
        return f"""Check if {stage_name.replace('_', ' ').title()} is ready for agent review.

**Required Artifacts to Verify**:
{chr(10).join(f"- {artifact}" for artifact in stage_config.get('required_artifacts', []))}

Please verify:
1. All required artifacts exist and are complete
2. Gate criteria are ready for evaluation:
   {chr(10).join(f"   - {criterion}" for criterion in stage_config['gate_criteria'])}
3. Any blockers or missing dependencies

Return: READY or NOT_READY with explanation."""

    def format_hook_execution_report(self, stage_name: str, agent_results: List[Dict]) -> str:
        """Format the results of hook execution into a readable report"""
        report = f"""
# {stage_name.replace('_', ' ').title()} Review Report

## Review Summary
**Stage**: {stage_name}
**Date**: 2025-08-14
**Agents Consulted**: {len(agent_results)}

## Agent Reviews

"""
        
        for i, result in enumerate(agent_results, 1):
            agent = result.get('agent', f'Agent {i}')
            status = result.get('status', 'Unknown')
            recommendations = result.get('recommendations', 'No recommendations provided')
            
            report += f"""### {agent}
**Status**: {status}
**Recommendations**: {recommendations}

"""
        
        # Determine overall stage status
        all_approved = all(result.get('approved', False) for result in agent_results)
        overall_status = "✅ APPROVED - Ready for next stage" if all_approved else "❌ NEEDS WORK - Address issues before proceeding"
        
        report += f"""
## Overall Stage Status
{overall_status}

## Next Steps
"""
        
        if all_approved:
            report += "- Proceed to next development stage\n- Update project status\n- Begin next stage planning"
        else:
            report += "- Address all agent recommendations\n- Re-run hooks after fixes\n- Schedule follow-up review"
        
        return report

# Utility functions for Claude Code integration
def trigger_stage_hooks(stage_name: str, project_root: str = None) -> str:
    """Main function to trigger hooks for a stage - call this from Claude Code"""
    if not project_root:
        project_root = "/Users/chad/Documents/ai-api-test-automation"
    
    integration = ClaudeHookIntegration(project_root)
    task_calls = integration.generate_task_calls(stage_name)
    
    if not task_calls:
        return f"No hooks configured for stage: {stage_name}"
    
    # Return information about what Task calls should be made
    summary = f"Ready to trigger {len(task_calls)} agent reviews for {stage_name}:\n"
    for call in task_calls:
        agent = call['parameters']['subagent_type']
        summary += f"- {agent}: {call['parameters']['description']}\n"
    
    return summary

def get_agent_prompt(stage_name: str, agent: str, project_root: str = None) -> str:
    """Get the specific prompt for an agent review"""
    if not project_root:
        project_root = "/Users/chad/Documents/ai-api-test-automation"
    
    integration = ClaudeHookIntegration(project_root)
    stage_config = integration.hooks_config["development_hooks"]["stage_hooks"].get(stage_name)
    
    if not stage_config:
        return f"No configuration found for stage: {stage_name}"
    
    return integration._generate_agent_prompt(stage_name, agent, stage_config)