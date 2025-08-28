"""
Data Engineer Agent using CrewAI
"""

from .base_agent import BaseCrewAgent
from crewai import Task
from typing import Optional, Dict, Any

class DataEngineerAgent(BaseCrewAgent):
    """Data Engineering specialist agent"""
    
    def __init__(self):
        super().__init__(
            role="Senior Data Engineer",
            goal="Design, build, and optimize data pipelines and ETL processes",
            backstory="""You are an experienced data engineer with 10+ years of expertise in:
            - Building scalable data pipelines
            - ETL/ELT process optimization
            - Data warehouse architecture
            - Real-time streaming systems
            - Data quality and governance
            You excel at creating efficient, reliable data infrastructure that handles 
            billions of records daily. You're proficient with various data technologies 
            and always consider performance, scalability, and maintainability.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.specializations = [
            "pipeline_creation",
            "data_validation",
            "schema_design",
            "performance_optimization",
            "data_transformation"
        ]
    
    def create_pipeline_task(self, requirements: str) -> Task:
        """Create a task for building a data pipeline"""
        return Task(
            description=f"""Design and implement a data pipeline based on these requirements:
            {requirements}
            
            Consider:
            1. Data sources and destinations
            2. Transformation logic
            3. Error handling
            4. Performance optimization
            5. Monitoring and logging
            
            Provide a detailed implementation plan with code examples.""",
            agent=self.agent,
            expected_output="A comprehensive pipeline design with implementation details"
        )
    
    def optimize_pipeline_task(self, pipeline_info: str) -> Task:
        """Create a task for optimizing an existing pipeline"""
        return Task(
            description=f"""Analyze and optimize this data pipeline:
            {pipeline_info}
            
            Focus on:
            1. Performance bottlenecks
            2. Resource utilization
            3. Parallel processing opportunities
            4. Caching strategies
            5. Query optimization
            
            Provide specific optimization recommendations with expected improvements.""",
            agent=self.agent,
            expected_output="Detailed optimization plan with performance metrics"
        )
    
    def validate_data_task(self, data_info: str) -> Task:
        """Create a task for data validation"""
        return Task(
            description=f"""Perform comprehensive data validation for:
            {data_info}
            
            Check for:
            1. Data completeness
            2. Data accuracy
            3. Data consistency
            4. Schema compliance
            5. Business rule violations
            
            Report any issues found and suggest remediation steps.""",
            agent=self.agent,
            expected_output="Data validation report with quality metrics"
        )