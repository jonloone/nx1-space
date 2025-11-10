"""
Route Intelligence Crew

Multi-agent workflow for comprehensive route analysis with GEOINT, OSINT,
SIGINT, IMINT, and temporal intelligence fusion.
"""
import re
import json
from typing import Dict, Any, List
from crewai import Crew, Task
from crewai.process import Process

from app.agents.route_agents import (
    create_route_analyst,
    create_geoint_specialist,
    create_temporal_analyst,
    create_osint_specialist
)
from app.tools.route_analysis_tool import RouteAnalysisTool
from app.tools.geocoding_tool import GeocodingTool


class RouteIntelligenceCrew:
    """
    Route Intelligence Crew

    Orchestrates multi-agent route analysis workflow:
    1. Route Analyst: Coordinates analysis and geocodes locations
    2. GEOINT Specialist: Analyzes terrain and geography
    3. Temporal Analyst: Analyzes timing and traffic patterns
    4. OSINT Specialist: Identifies points of interest
    5. Route Analyst: Synthesizes final intelligence report
    """

    def __init__(self, query: str, context: Dict[str, Any], verbose: bool = False):
        self.query = query
        self.context = context
        self.verbose = verbose

        # Initialize tools
        self.route_tool = RouteAnalysisTool()
        self.geocoding_tool = GeocodingTool()

        # Parse locations from query
        self.from_location, self.to_location = self._parse_locations()

        # Initialize agents
        self.route_analyst = create_route_analyst(
            tools=[self.route_tool, self.geocoding_tool]
        )
        self.geoint_specialist = create_geoint_specialist()
        self.temporal_analyst = create_temporal_analyst()
        self.osint_specialist = create_osint_specialist()

    def _parse_locations(self) -> tuple[str, str]:
        """
        Parse from/to locations from query

        Returns:
            Tuple of (from_location, to_location)
        """
        query_lower = self.query.lower()

        # Try to extract "from X to Y" pattern
        from_to_match = re.search(
            r'from\s+([^to]+?)\s+to\s+([^,.?!]+)',
            query_lower,
            re.IGNORECASE
        )

        if from_to_match:
            return (
                from_to_match.group(1).strip(),
                from_to_match.group(2).strip()
            )

        # Check context for selected location
        if self.context.get("selected_location"):
            # If we have a destination in the query, use selected as origin
            to_match = re.search(r'to\s+([^,.?!]+)', query_lower)
            if to_match:
                return (
                    self.context["selected_location"],
                    to_match.group(1).strip()
                )

        # Default: extract two location names from query
        # This is a fallback - may not work for all queries
        return ("unknown", "unknown")

    async def execute(self) -> Dict[str, Any]:
        """
        Execute the Route Intelligence crew workflow

        Returns:
            Dictionary with intelligence report and artifacts
        """
        try:
            print(f"\n{'='*80}")
            print(f"🚀 ROUTE INTELLIGENCE CREW STARTING")
            print(f"{'='*80}")
            print(f"Query: {self.query}")
            print(f"From: {self.from_location}")
            print(f"To: {self.to_location}")
            print(f"{'='*80}\n")

            # Task 1: Execute Route Analysis
            task_route_analysis = Task(
                description=f"""
                Execute comprehensive route analysis from '{self.from_location}' to '{self.to_location}'.

                Steps:
                1. Use the Geocoding Tool to convert location names to coordinates if needed
                2. Use the Route Analysis Tool to get comprehensive route intelligence
                3. Extract the route data including waypoints, distance, duration, and multi-INT analysis

                Query context: {self.query}

                Return the complete route analysis data.
                """,
                expected_output="Complete route analysis with waypoints and multi-INT data",
                agent=self.route_analyst
            )

            # Task 2: GEOINT Analysis
            task_geoint = Task(
                description="""
                Analyze the GEOINT (Geospatial Intelligence) aspects of the route.

                Focus on:
                - Terrain analysis: Elevation changes, slopes, natural obstacles
                - Geographic features: Rivers, parks, urban density, infrastructure
                - Tactical considerations: Chokepoints, observation positions, cover/concealment
                - Trafficability: How terrain affects movement

                Using the route analysis data from the previous task, provide a detailed
                GEOINT assessment highlighting tactically significant features.
                """,
                expected_output="Detailed GEOINT assessment with tactical considerations",
                agent=self.geoint_specialist,
                context=[task_route_analysis]
            )

            # Task 3: Temporal Analysis
            task_temporal = Task(
                description="""
                Analyze the temporal (timing) aspects of the route.

                Focus on:
                - Traffic patterns: Current and predicted traffic along the route
                - Timing recommendations: Optimal departure times
                - Duration analysis: Expected travel time under different conditions
                - Temporal vulnerabilities: High-traffic periods to avoid

                Using the route analysis data, provide temporal intelligence for optimal
                movement planning.
                """,
                expected_output="Temporal intelligence with timing recommendations",
                agent=self.temporal_analyst,
                context=[task_route_analysis]
            )

            # Task 4: OSINT Analysis
            task_osint = Task(
                description="""
                Analyze the OSINT (Open-Source Intelligence) aspects of the route.

                Focus on:
                - Points of interest: Notable locations along the route
                - Infrastructure: Critical infrastructure, facilities, services
                - Activity patterns: Commercial areas, residential zones, institutional facilities
                - Contextual factors: Neighborhood characteristics, safety considerations

                Using the route analysis data, identify and assess significant points
                of interest and infrastructure along the route.
                """,
                expected_output="OSINT analysis of route waypoints and infrastructure",
                agent=self.osint_specialist,
                context=[task_route_analysis]
            )

            # Task 5: Synthesize Final Report
            task_final_report = Task(
                description=f"""
                Synthesize all intelligence inputs into a comprehensive, actionable route intelligence report.

                Integrate analysis from:
                - Route analysis data (waypoints, distance, duration)
                - GEOINT assessment (terrain, geography, tactical features)
                - Temporal analysis (timing, traffic, optimal windows)
                - OSINT assessment (infrastructure, points of interest)

                Original query: {self.query}

                Your final report should be:
                1. CONCISE: 3-5 paragraphs maximum
                2. ACTIONABLE: Clear recommendations for operators
                3. STRUCTURED: Organized by key intelligence categories
                4. PRACTICAL: Focus on operationally relevant details

                Format the report as follows:

                ## ROUTE INTELLIGENCE REPORT
                **Route:** [from] → [to]
                **Distance:** [X km] | **Duration:** [X min] | **Mode:** [mode]

                ### EXECUTIVE SUMMARY
                [1-2 sentence overview of route viability and key considerations]

                ### GEOINT ASSESSMENT
                [Key terrain and geographic factors]

                ### TEMPORAL ANALYSIS
                [Timing and traffic considerations]

                ### OSINT HIGHLIGHTS
                [Notable infrastructure and points of interest]

                ### RECOMMENDATIONS
                [2-3 actionable recommendations for movement planning]
                """,
                expected_output="Comprehensive route intelligence report",
                agent=self.route_analyst,
                context=[task_route_analysis, task_geoint, task_temporal, task_osint]
            )

            # Create crew with sequential process
            crew = Crew(
                agents=[
                    self.route_analyst,
                    self.geoint_specialist,
                    self.temporal_analyst,
                    self.osint_specialist
                ],
                tasks=[
                    task_route_analysis,
                    task_geoint,
                    task_temporal,
                    task_osint,
                    task_final_report
                ],
                process=Process.sequential,
                verbose=self.verbose
            )

            # Execute crew
            result = crew.kickoff()

            print(f"\n{'='*80}")
            print(f"✅ ROUTE INTELLIGENCE CREW COMPLETED")
            print(f"{'='*80}\n")

            # Extract final output
            final_output = str(result)

            # Parse artifacts and actions from the route analysis
            artifacts = self._extract_artifacts(task_route_analysis)
            actions = self._extract_actions()

            return {
                "success": True,
                "output": final_output,
                "task_results": [],  # CrewAI doesn't expose individual task results easily
                "artifacts": artifacts,
                "actions": actions,
                "total_tokens": None  # Would need to track this manually
            }

        except Exception as e:
            print(f"❌ Crew execution error: {str(e)}")
            return {
                "success": False,
                "output": "",
                "task_results": [],
                "artifacts": [],
                "actions": [],
                "error": str(e)
            }

    def _extract_artifacts(self, route_task: Task) -> List[Dict[str, Any]]:
        """
        Extract chat artifacts from route analysis

        Args:
            route_task: The route analysis task

        Returns:
            List of artifact dictionaries
        """
        # This would extract route-analysis artifact from the task output
        # For now, return a basic structure
        return [
            {
                "type": "route-analysis",
                "title": f"Route: {self.from_location} → {self.to_location}",
                "data": {
                    "from": self.from_location,
                    "to": self.to_location,
                    "mode": "driving"  # Would extract from analysis
                }
            }
        ]

    def _extract_actions(self) -> List[Dict[str, Any]]:
        """
        Extract map actions for the frontend

        Returns:
            List of action dictionaries
        """
        return [
            {
                "type": "flyTo",
                "location": self.from_location
            },
            {
                "type": "drawRoute",
                "from": self.from_location,
                "to": self.to_location
            }
        ]
