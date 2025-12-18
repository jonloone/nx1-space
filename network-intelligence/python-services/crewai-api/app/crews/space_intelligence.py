"""
Space Intelligence Crew

Multi-agent workflow for comprehensive space domain analysis
including satellites, orbital mechanics, and ground station coverage.
"""
import json
from typing import Dict, Any, List
from crewai import Crew, Task
from crewai.process import Process

from app.agents.route_agents import get_llm


def create_imagery_analyst():
    """
    Satellite Imagery Analyst

    Analyzes satellite imagery, coverage, and change detection.
    """
    from crewai import Agent
    return Agent(
        role="Satellite Imagery Analyst",
        goal="Analyze satellite imagery capabilities, coverage patterns, and change detection for operational intelligence",
        backstory="""You are a satellite imagery specialist with expertise in:
        - Earth observation satellite capabilities
        - Imagery resolution and spectral analysis
        - Coverage patterns and revisit rates
        - Change detection methodologies
        - SAR, optical, and multispectral analysis

        Your analysis helps operators understand imagery availability, plan
        collection requirements, and detect changes in areas of interest.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_orbital_analyst():
    """
    Orbital Mechanics Analyst

    Analyzes satellite orbits, passes, and coverage calculations.
    """
    from crewai import Agent
    return Agent(
        role="Orbital Mechanics Analyst",
        goal="Analyze satellite orbits, predict passes, and calculate coverage windows for operational planning",
        backstory="""You are an orbital mechanics specialist with expertise in:
        - TLE data analysis and orbit determination
        - Pass prediction and visibility calculations
        - Coverage window optimization
        - Orbital element interpretation (LEO, MEO, GEO)
        - Satellite constellation analysis

        Your calculations help operators plan satellite access windows,
        optimize ground station scheduling, and predict coverage gaps.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_ground_station_analyst():
    """
    Ground Station Analyst

    Analyzes ground station networks and communication links.
    """
    from crewai import Agent
    return Agent(
        role="Ground Station Analyst",
        goal="Analyze ground station networks, coverage, and communication link budgets for satellite operations",
        backstory="""You are a ground station operations specialist with expertise in:
        - Ground station network assessment
        - Antenna capabilities and frequency allocation
        - Link budget analysis and margin calculations
        - Coverage overlap and handoff optimization
        - Station utilization and capacity planning

        Your insights help optimize satellite communications, plan ground
        station investments, and ensure reliable space-to-ground links.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


class SpaceIntelligenceCrew:
    """
    Space Intelligence Crew

    Orchestrates multi-agent space domain analysis workflow:
    1. Imagery Analyst: Satellite imagery and coverage
    2. Orbital Analyst: Orbital mechanics and pass predictions
    3. Ground Station Analyst: Communication links and networks
    """

    def __init__(self, query: str, context: Dict[str, Any], verbose: bool = False):
        self.query = query
        self.context = context
        self.verbose = verbose

        # Initialize agents
        self.imagery_analyst = create_imagery_analyst()
        self.orbital_analyst = create_orbital_analyst()
        self.ground_station_analyst = create_ground_station_analyst()

    async def execute(self) -> Dict[str, Any]:
        """
        Execute the Space Intelligence crew workflow
        """
        try:
            print(f"\n{'='*80}")
            print(f"🛰️ SPACE INTELLIGENCE CREW STARTING")
            print(f"{'='*80}")
            print(f"Query: {self.query}")
            print(f"Context: {json.dumps(self.context, indent=2)}")
            print(f"{'='*80}\n")

            # Task 1: Satellite Imagery Assessment
            task_imagery = Task(
                description=f"""
                Analyze satellite imagery capabilities for the query: "{self.query}"

                Focus on:
                - Available imagery satellites (optical, SAR, multispectral)
                - Resolution capabilities and coverage
                - Current and planned collection opportunities
                - Historical imagery availability

                Context: {json.dumps(self.context)}

                Provide an imagery collection assessment.
                """,
                expected_output="Satellite imagery capability assessment",
                agent=self.imagery_analyst
            )

            # Task 2: Orbital Analysis
            task_orbital = Task(
                description=f"""
                Analyze orbital mechanics and satellite passes for: "{self.query}"

                Focus on:
                - Satellites relevant to the area of interest
                - Pass predictions and visibility windows
                - Orbital characteristics (altitude, inclination)
                - Coverage frequency and gaps

                Provide orbital analysis and pass predictions.
                """,
                expected_output="Orbital mechanics analysis with pass predictions",
                agent=self.orbital_analyst,
                context=[task_imagery]
            )

            # Task 3: Ground Station Analysis
            task_ground_stations = Task(
                description=f"""
                Analyze ground station coverage for: "{self.query}"

                Focus on:
                - Ground stations with visibility to relevant satellites
                - Communication link capabilities
                - Coverage overlap and potential handoffs
                - Station utilization and availability

                Provide ground station network assessment.
                """,
                expected_output="Ground station coverage and link analysis",
                agent=self.ground_station_analyst,
                context=[task_imagery, task_orbital]
            )

            # Task 4: Final Synthesis
            task_synthesis = Task(
                description=f"""
                Synthesize all space domain intelligence into a comprehensive report.

                Original query: {self.query}

                Combine insights from:
                - Satellite imagery capabilities
                - Orbital mechanics analysis
                - Ground station network assessment

                Format:
                ## SPACE INTELLIGENCE REPORT

                ### EXECUTIVE SUMMARY
                [2-3 sentence overview of space domain situation]

                ### IMAGERY CAPABILITIES
                [Available satellites and collection opportunities]

                ### ORBITAL ANALYSIS
                [Relevant satellites, orbits, and pass predictions]

                ### GROUND INFRASTRUCTURE
                [Station coverage and communication links]

                ### SPACE DOMAIN RECOMMENDATIONS
                [2-3 actionable recommendations for space operations]
                """,
                expected_output="Comprehensive space intelligence report",
                agent=self.orbital_analyst,
                context=[task_imagery, task_orbital, task_ground_stations]
            )

            # Create and execute crew
            crew = Crew(
                agents=[
                    self.imagery_analyst,
                    self.orbital_analyst,
                    self.ground_station_analyst
                ],
                tasks=[
                    task_imagery,
                    task_orbital,
                    task_ground_stations,
                    task_synthesis
                ],
                process=Process.sequential,
                verbose=self.verbose
            )

            result = crew.kickoff()

            print(f"\n{'='*80}")
            print(f"✅ SPACE INTELLIGENCE CREW COMPLETED")
            print(f"{'='*80}\n")

            return {
                "success": True,
                "output": str(result),
                "task_results": [],
                "artifacts": self._extract_artifacts(),
                "actions": self._extract_actions()
            }

        except Exception as e:
            print(f"❌ Space Intelligence crew error: {str(e)}")
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
                "type": "space-analysis",
                "title": f"Space Intelligence: {self.query[:50]}",
                "data": {
                    "domain": "space",
                    "query": self.query
                }
            }
        ]

    def _extract_actions(self) -> List[Dict[str, Any]]:
        """Extract map actions"""
        actions = []

        # If context has coordinates, add flyTo action with higher zoom
        if self.context.get("map_center"):
            actions.append({
                "type": "flyTo",
                "lat": self.context["map_center"].get("lat"),
                "lng": self.context["map_center"].get("lng"),
                "zoom": self.context.get("map_zoom", 6)  # Wider view for space
            })

        # Add satellite layer toggle
        actions.append({
            "type": "toggleLayer",
            "layer": "satellite-tracks",
            "enabled": True
        })

        return actions
