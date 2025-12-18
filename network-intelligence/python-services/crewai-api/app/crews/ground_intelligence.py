"""
Ground Intelligence Crew

Multi-agent workflow for comprehensive ground-based geospatial analysis
including buildings, infrastructure, POIs, and land-use analysis.
"""
import json
from typing import Dict, Any, List
from crewai import Crew, Task
from crewai.process import Process

from app.agents.route_agents import get_llm


def create_building_analyst():
    """
    Building & Infrastructure Analyst

    Analyzes 3D buildings, infrastructure, and structural data.
    """
    from crewai import Agent
    return Agent(
        role="Building & Infrastructure Analyst",
        goal="Analyze building data, infrastructure patterns, and structural characteristics for operational intelligence",
        backstory="""You are an infrastructure intelligence specialist with expertise in:
        - 3D building analysis and height profiling
        - Infrastructure pattern recognition
        - Urban density and development assessment
        - Critical infrastructure identification
        - Construction type and age analysis

        Your analysis helps operators understand the built environment, identify
        key facilities, and assess infrastructure vulnerabilities.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_poi_specialist():
    """
    POI (Points of Interest) Specialist

    Analyzes places, addresses, and business locations.
    """
    from crewai import Agent
    return Agent(
        role="POI Specialist",
        goal="Identify and analyze points of interest, businesses, and address data for comprehensive area assessment",
        backstory="""You are a POI intelligence analyst specializing in:
        - Business and commercial establishment analysis
        - Address validation and geocoding expertise
        - Neighborhood characterization
        - Service coverage assessment (hospitals, schools, emergency services)
        - Retail and commercial pattern analysis

        Your insights help operators understand the human geography of an area,
        identify key facilities, and assess community characteristics.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_osint_analyst():
    """
    Ground OSINT Analyst

    Analyzes open-source intelligence for ground-based operations.
    """
    from crewai import Agent
    return Agent(
        role="Ground OSINT Analyst",
        goal="Gather and analyze open-source intelligence about ground locations, businesses, and infrastructure",
        backstory="""You are an OSINT specialist focused on ground-based intelligence:
        - Social media and review analysis for locations
        - Ownership and corporate structure research
        - Historical land use and development patterns
        - Event and activity pattern detection
        - Public records and permit analysis

        Your research provides contextual depth to geospatial analysis,
        revealing patterns and connections not visible in mapping data alone.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


class GroundIntelligenceCrew:
    """
    Ground Intelligence Crew

    Orchestrates multi-agent ground analysis workflow:
    1. Building Analyst: Infrastructure and structural analysis
    2. POI Specialist: Places, businesses, and addresses
    3. OSINT Analyst: Open-source intelligence gathering
    """

    def __init__(self, query: str, context: Dict[str, Any], verbose: bool = False):
        self.query = query
        self.context = context
        self.verbose = verbose

        # Initialize agents
        self.building_analyst = create_building_analyst()
        self.poi_specialist = create_poi_specialist()
        self.osint_analyst = create_osint_analyst()

    async def execute(self) -> Dict[str, Any]:
        """
        Execute the Ground Intelligence crew workflow
        """
        try:
            print(f"\n{'='*80}")
            print(f"🏗️ GROUND INTELLIGENCE CREW STARTING")
            print(f"{'='*80}")
            print(f"Query: {self.query}")
            print(f"Context: {json.dumps(self.context, indent=2)}")
            print(f"{'='*80}\n")

            # Task 1: Building & Infrastructure Analysis
            task_buildings = Task(
                description=f"""
                Analyze building and infrastructure data for the query: "{self.query}"

                Focus on:
                - Building types, heights, and footprints
                - Infrastructure patterns (roads, utilities, transit)
                - Urban density and land use
                - Critical facilities identification

                Context: {json.dumps(self.context)}

                Provide a concise infrastructure assessment.
                """,
                expected_output="Infrastructure and building analysis report",
                agent=self.building_analyst
            )

            # Task 2: POI Analysis
            task_pois = Task(
                description=f"""
                Analyze points of interest for the query: "{self.query}"

                Focus on:
                - Key businesses and commercial establishments
                - Public facilities (hospitals, schools, government)
                - Transportation hubs and access points
                - Service coverage and gaps

                Provide actionable POI intelligence.
                """,
                expected_output="POI analysis with key locations identified",
                agent=self.poi_specialist,
                context=[task_buildings]
            )

            # Task 3: OSINT Enhancement
            task_osint = Task(
                description=f"""
                Enhance the analysis with open-source intelligence.

                Focus on:
                - Notable public information about identified locations
                - Historical context and development patterns
                - Community characteristics and demographics
                - Any relevant news or public records

                Add contextual depth to the infrastructure and POI analysis.
                """,
                expected_output="OSINT-enhanced analysis with additional context",
                agent=self.osint_analyst,
                context=[task_buildings, task_pois]
            )

            # Task 4: Final Synthesis
            task_synthesis = Task(
                description=f"""
                Synthesize all ground intelligence into a final report.

                Original query: {self.query}

                Combine insights from:
                - Building and infrastructure analysis
                - POI identification and assessment
                - OSINT contextual information

                Format:
                ## GROUND INTELLIGENCE REPORT

                ### EXECUTIVE SUMMARY
                [2-3 sentence overview]

                ### INFRASTRUCTURE ASSESSMENT
                [Key building and infrastructure findings]

                ### POI ANALYSIS
                [Notable locations and facilities]

                ### OSINT CONTEXT
                [Relevant open-source intelligence]

                ### RECOMMENDATIONS
                [2-3 actionable recommendations]
                """,
                expected_output="Comprehensive ground intelligence report",
                agent=self.poi_specialist,
                context=[task_buildings, task_pois, task_osint]
            )

            # Create and execute crew
            crew = Crew(
                agents=[
                    self.building_analyst,
                    self.poi_specialist,
                    self.osint_analyst
                ],
                tasks=[
                    task_buildings,
                    task_pois,
                    task_osint,
                    task_synthesis
                ],
                process=Process.sequential,
                verbose=self.verbose
            )

            result = crew.kickoff()

            print(f"\n{'='*80}")
            print(f"✅ GROUND INTELLIGENCE CREW COMPLETED")
            print(f"{'='*80}\n")

            return {
                "success": True,
                "output": str(result),
                "task_results": [],
                "artifacts": self._extract_artifacts(),
                "actions": self._extract_actions()
            }

        except Exception as e:
            print(f"❌ Ground Intelligence crew error: {str(e)}")
            return {
                "success": False,
                "output": "",
                "task_results": [],
                "artifacts": [],
                "actions": [],
                "error": str(e)
            }

    def _extract_artifacts(self) -> List[Dict[str, Any]]:
        """Extract artifacts from analysis"""
        return [
            {
                "type": "ground-analysis",
                "title": f"Ground Intelligence: {self.query[:50]}",
                "data": {
                    "domain": "ground",
                    "query": self.query
                }
            }
        ]

    def _extract_actions(self) -> List[Dict[str, Any]]:
        """Extract map actions"""
        actions = []

        # If context has coordinates, add flyTo action
        if self.context.get("map_center"):
            actions.append({
                "type": "flyTo",
                "lat": self.context["map_center"].get("lat"),
                "lng": self.context["map_center"].get("lng"),
                "zoom": self.context.get("map_zoom", 14)
            })

        return actions
