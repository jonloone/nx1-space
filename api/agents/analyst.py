"""
Data Analyst Agent using CrewAI
"""

from .base_agent import BaseCrewAgent
from crewai import Task
from typing import Optional, Dict, Any

class AnalystAgent(BaseCrewAgent):
    """Data analysis and insights specialist agent"""
    
    def __init__(self):
        super().__init__(
            role="Senior Data Analyst",
            goal="Analyze data, discover patterns, and provide actionable insights",
            backstory="""You are an expert data analyst with deep expertise in:
            - Statistical analysis and modeling
            - Data profiling and quality assessment
            - Pattern recognition and anomaly detection
            - Business intelligence and reporting
            - Data lineage and impact analysis
            - Predictive analytics
            You have a strong background in statistics and machine learning, with the 
            ability to translate complex data into clear, actionable insights for 
            business stakeholders. You excel at finding hidden patterns and correlations.""",
            verbose=True,
            allow_delegation=False
        )
        
        self.specializations = [
            "data_profiling",
            "lineage_tracing",
            "impact_analysis",
            "pattern_discovery",
            "statistical_analysis",
            "quality_assessment"
        ]
    
    def profile_data_task(self, dataset_info: str) -> Task:
        """Create a task for data profiling"""
        return Task(
            description=f"""Perform comprehensive data profiling for:
            {dataset_info}
            
            Analyze:
            1. Data distribution and statistics
            2. Data quality metrics (completeness, accuracy, consistency)
            3. Data patterns and relationships
            4. Outliers and anomalies
            5. Data types and formats
            
            Provide detailed profiling report with visualizations.""",
            agent=self.agent,
            expected_output="Comprehensive data profile with quality metrics"
        )
    
    def trace_lineage_task(self, entity_info: str) -> Task:
        """Create a task for data lineage tracing"""
        return Task(
            description=f"""Trace complete data lineage for:
            {entity_info}
            
            Identify:
            1. Data sources and origins
            2. Transformation steps
            3. Intermediate datasets
            4. Downstream dependencies
            5. Impact on reports/dashboards
            
            Create lineage diagram with all dependencies.""",
            agent=self.agent,
            expected_output="Data lineage map with upstream and downstream dependencies"
        )
    
    def impact_analysis_task(self, change_info: str) -> Task:
        """Create a task for impact analysis"""
        return Task(
            description=f"""Perform impact analysis for proposed change:
            {change_info}
            
            Assess:
            1. Affected data pipelines
            2. Impacted reports and dashboards
            3. Downstream system dependencies
            4. Risk assessment and severity
            5. Mitigation strategies
            
            Provide risk-scored impact assessment.""",
            agent=self.agent,
            expected_output="Impact analysis report with risk scores and mitigation plan"
        )
    
    def discover_patterns_task(self, data_info: str) -> Task:
        """Create a task for pattern discovery"""
        return Task(
            description=f"""Discover patterns and insights in:
            {data_info}
            
            Look for:
            1. Temporal patterns and seasonality
            2. Correlations between variables
            3. Clustering and segmentation opportunities
            4. Trend analysis
            5. Predictive indicators
            
            Provide actionable insights and recommendations.""",
            agent=self.agent,
            expected_output="Pattern analysis report with actionable insights"
        )
    
    def statistical_analysis_task(self, analysis_request: str) -> Task:
        """Create a task for statistical analysis"""
        return Task(
            description=f"""Perform statistical analysis:
            {analysis_request}
            
            Include:
            1. Descriptive statistics
            2. Hypothesis testing
            3. Correlation analysis
            4. Regression modeling if applicable
            5. Confidence intervals and significance tests
            
            Provide statistical report with interpretations.""",
            agent=self.agent,
            expected_output="Statistical analysis report with interpretations and visualizations"
        )