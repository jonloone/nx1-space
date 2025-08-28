"""
Monitor Agent using CrewAI
"""

from .base_agent import BaseCrewAgent
from crewai import Task
from typing import Optional, Dict, Any

class MonitorAgent(BaseCrewAgent):
    """System monitoring and observability specialist agent"""
    
    def __init__(self):
        super().__init__(
            role="Senior DevOps/SRE Engineer",
            goal="Monitor system health, detect anomalies, and ensure optimal performance",
            backstory="""You are a seasoned Site Reliability Engineer with expertise in:
            - System monitoring and observability
            - Performance metrics analysis
            - Anomaly detection
            - Alert configuration
            - Incident response
            - Capacity planning
            You've managed large-scale distributed systems and have a keen eye for 
            detecting issues before they become critical. You're proficient with various 
            monitoring tools and always prioritize system reliability and uptime.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.specializations = [
            "health_monitoring",
            "anomaly_detection",
            "alert_configuration",
            "performance_analysis",
            "capacity_planning"
        ]
    
    def check_health_task(self, system_info: str) -> Task:
        """Create a task for system health check"""
        return Task(
            description=f"""Perform a comprehensive health check for:
            {system_info}
            
            Analyze:
            1. System metrics (CPU, Memory, Disk, Network)
            2. Service availability
            3. Response times
            4. Error rates
            5. Resource utilization trends
            
            Provide health status and any concerns.""",
            agent=self.agent,
            expected_output="System health report with metrics and recommendations"
        )
    
    def detect_anomalies_task(self, metrics_data: str) -> Task:
        """Create a task for anomaly detection"""
        return Task(
            description=f"""Analyze metrics for anomaly detection:
            {metrics_data}
            
            Look for:
            1. Unusual patterns or spikes
            2. Deviations from baseline
            3. Correlating events
            4. Early warning signs
            5. Potential cascading failures
            
            Report any anomalies with severity levels.""",
            agent=self.agent,
            expected_output="Anomaly detection report with severity classifications"
        )
    
    def configure_alerts_task(self, requirements: str) -> Task:
        """Create a task for alert configuration"""
        return Task(
            description=f"""Design alert configuration based on:
            {requirements}
            
            Define:
            1. Alert thresholds
            2. Notification channels
            3. Escalation policies
            4. Alert grouping/suppression
            5. Recovery conditions
            
            Provide complete alert configuration with justifications.""",
            agent=self.agent,
            expected_output="Alert configuration plan with thresholds and policies"
        )
    
    def capacity_planning_task(self, usage_data: str) -> Task:
        """Create a task for capacity planning"""
        return Task(
            description=f"""Perform capacity planning analysis:
            {usage_data}
            
            Evaluate:
            1. Current resource utilization
            2. Growth trends
            3. Peak load patterns
            4. Scaling requirements
            5. Cost optimization opportunities
            
            Provide capacity recommendations for next 3-6 months.""",
            agent=self.agent,
            expected_output="Capacity planning report with scaling recommendations"
        )