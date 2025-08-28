"""
Remediation Agent using CrewAI
"""

from .base_agent import BaseCrewAgent
from crewai import Task
from typing import Optional, Dict, Any

class RemediationAgent(BaseCrewAgent):
    """Error diagnosis and remediation specialist agent"""
    
    def __init__(self):
        super().__init__(
            role="Senior Site Reliability Engineer",
            goal="Diagnose issues, implement fixes, and prevent future problems",
            backstory="""You are an experienced SRE with expertise in:
            - Root cause analysis
            - Incident response and resolution
            - Automated remediation
            - Disaster recovery
            - System resilience
            - Post-mortem analysis
            You've handled critical production incidents and excel at quickly diagnosing 
            problems and implementing effective fixes. You focus on both immediate 
            resolution and long-term prevention through automation and improved practices.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.specializations = [
            "error_diagnosis",
            "auto_fix",
            "rollback_procedures",
            "disaster_recovery",
            "preventive_measures"
        ]
    
    def diagnose_error_task(self, error_info: str) -> Task:
        """Create a task for error diagnosis"""
        return Task(
            description=f"""Diagnose the following error:
            {error_info}
            
            Analyze:
            1. Error symptoms and manifestation
            2. Root cause identification
            3. Affected components
            4. Impact assessment
            5. Timeline of events
            
            Provide detailed diagnosis with confidence level.""",
            agent=self.agent,
            expected_output="Root cause analysis with detailed diagnosis"
        )
    
    def fix_issue_task(self, issue_info: str) -> Task:
        """Create a task for implementing fixes"""
        return Task(
            description=f"""Implement fix for issue:
            {issue_info}
            
            Provide:
            1. Step-by-step fix procedure
            2. Required commands/configurations
            3. Validation steps
            4. Rollback plan if fix fails
            5. Success criteria
            
            Include risk assessment and approval requirements.""",
            agent=self.agent,
            expected_output="Detailed fix implementation plan with validation steps"
        )
    
    def create_runbook_task(self, scenario: str) -> Task:
        """Create a task for runbook creation"""
        return Task(
            description=f"""Create operational runbook for:
            {scenario}
            
            Include:
            1. Prerequisites and dependencies
            2. Step-by-step procedures
            3. Decision trees for different scenarios
            4. Escalation procedures
            5. Recovery verification steps
            
            Make it clear and actionable for on-call engineers.""",
            agent=self.agent,
            expected_output="Complete runbook with clear procedures"
        )
    
    def disaster_recovery_task(self, disaster_scenario: str) -> Task:
        """Create a task for disaster recovery planning"""
        return Task(
            description=f"""Plan disaster recovery for:
            {disaster_scenario}
            
            Design:
            1. Recovery objectives (RTO/RPO)
            2. Backup and restore procedures
            3. Failover mechanisms
            4. Data integrity checks
            5. Communication plan
            
            Provide complete DR plan with timelines.""",
            agent=self.agent,
            expected_output="Disaster recovery plan with procedures and timelines"
        )
    
    def preventive_measures_task(self, incident_info: str) -> Task:
        """Create a task for preventive measures"""
        return Task(
            description=f"""Recommend preventive measures based on:
            {incident_info}
            
            Suggest:
            1. System hardening steps
            2. Monitoring improvements
            3. Automated safeguards
            4. Process improvements
            5. Training requirements
            
            Prioritize by impact and implementation effort.""",
            agent=self.agent,
            expected_output="Preventive measures plan with prioritization"
        )