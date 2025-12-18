"""
Maritime Intelligence Crew

Multi-agent workflow for comprehensive maritime domain analysis
including ports, vessels, shipping lanes, and maritime infrastructure.
"""
import json
from typing import Dict, Any, List
from crewai import Crew, Task
from crewai.process import Process

from app.agents.route_agents import get_llm


def create_port_analyst():
    """
    Port & Harbor Analyst

    Analyzes port infrastructure, capacity, and operations.
    """
    from crewai import Agent
    return Agent(
        role="Port & Harbor Analyst",
        goal="Analyze port infrastructure, capacity metrics, and operational characteristics for maritime intelligence",
        backstory="""You are a maritime infrastructure specialist with expertise in:
        - Port facility assessment (berths, cranes, storage)
        - Cargo handling capacity analysis (TEU, tonnage)
        - Port connectivity and hinterland access
        - Vessel accommodation capabilities
        - Fuel bunkering and ship services

        Your analysis helps operators understand port capabilities, identify
        bottlenecks, and assess maritime infrastructure readiness.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_vessel_tracker():
    """
    Vessel Tracking Analyst

    Analyzes vessel movements, AIS data, and shipping patterns.
    """
    from crewai import Agent
    return Agent(
        role="Vessel Tracking Analyst",
        goal="Track and analyze vessel movements, shipping patterns, and maritime traffic for operational awareness",
        backstory="""You are a maritime traffic specialist with expertise in:
        - AIS data analysis and interpretation
        - Vessel classification and identification
        - Shipping route pattern analysis
        - Anomaly detection in vessel behavior
        - Flag state and ownership research

        Your tracking capabilities provide real-time maritime domain awareness
        and help identify patterns of interest in vessel movements.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_logistics_analyst():
    """
    Maritime Logistics Analyst

    Analyzes shipping lanes, trade routes, and logistics networks.
    """
    from crewai import Agent
    return Agent(
        role="Maritime Logistics Analyst",
        goal="Analyze shipping lanes, trade routes, and maritime logistics networks for supply chain intelligence",
        backstory="""You are a maritime logistics expert specializing in:
        - Global shipping lane analysis
        - Trade route optimization and chokepoints
        - Container shipping network patterns
        - Supply chain vulnerability assessment
        - Maritime corridor security analysis

        Your insights help understand global trade flows, identify critical
        maritime chokepoints, and assess logistics network resilience.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


class MaritimeIntelligenceCrew:
    """
    Maritime Intelligence Crew

    Orchestrates multi-agent maritime analysis workflow:
    1. Port Analyst: Infrastructure and capacity analysis
    2. Vessel Tracker: AIS and traffic pattern analysis
    3. Logistics Analyst: Shipping lanes and trade routes
    """

    def __init__(self, query: str, context: Dict[str, Any], verbose: bool = False):
        self.query = query
        self.context = context
        self.verbose = verbose

        # Initialize agents
        self.port_analyst = create_port_analyst()
        self.vessel_tracker = create_vessel_tracker()
        self.logistics_analyst = create_logistics_analyst()

    async def execute(self) -> Dict[str, Any]:
        """
        Execute the Maritime Intelligence crew workflow
        """
        try:
            print(f"\n{'='*80}")
            print(f"⚓ MARITIME INTELLIGENCE CREW STARTING")
            print(f"{'='*80}")
            print(f"Query: {self.query}")
            print(f"Context: {json.dumps(self.context, indent=2)}")
            print(f"{'='*80}\n")

            # Task 1: Port Infrastructure Analysis
            task_ports = Task(
                description=f"""
                Analyze port and maritime infrastructure for the query: "{self.query}"

                Focus on:
                - Port facilities, berths, and capacity
                - Cargo handling capabilities (containers, bulk, tankers)
                - Ship services and bunkering availability
                - Connectivity to road/rail networks

                Context: {json.dumps(self.context)}

                Provide a detailed port infrastructure assessment.
                """,
                expected_output="Port infrastructure analysis with capacity metrics",
                agent=self.port_analyst
            )

            # Task 2: Vessel Traffic Analysis
            task_vessels = Task(
                description=f"""
                Analyze vessel traffic and shipping patterns for: "{self.query}"

                Focus on:
                - Active vessels in the area of interest
                - Traffic density and patterns
                - Vessel types and flag states
                - Notable movement patterns or anomalies

                Provide vessel traffic intelligence.
                """,
                expected_output="Vessel traffic analysis with pattern identification",
                agent=self.vessel_tracker,
                context=[task_ports]
            )

            # Task 3: Logistics & Trade Route Analysis
            task_logistics = Task(
                description=f"""
                Analyze shipping lanes and logistics networks for: "{self.query}"

                Focus on:
                - Primary shipping routes to/from ports
                - Trade lane utilization and volumes
                - Strategic chokepoints and vulnerabilities
                - Regional logistics connectivity

                Provide logistics and trade route intelligence.
                """,
                expected_output="Shipping lane and logistics network analysis",
                agent=self.logistics_analyst,
                context=[task_ports, task_vessels]
            )

            # Task 4: Final Synthesis
            task_synthesis = Task(
                description=f"""
                Synthesize all maritime intelligence into a comprehensive report.

                Original query: {self.query}

                Combine insights from:
                - Port infrastructure analysis
                - Vessel traffic patterns
                - Logistics and trade routes

                Format:
                ## MARITIME INTELLIGENCE REPORT

                ### EXECUTIVE SUMMARY
                [2-3 sentence overview of maritime situation]

                ### PORT INFRASTRUCTURE
                [Key port capabilities and facilities]

                ### VESSEL TRAFFIC
                [Current traffic patterns and notable vessels]

                ### LOGISTICS ASSESSMENT
                [Shipping lanes and supply chain considerations]

                ### MARITIME RECOMMENDATIONS
                [2-3 actionable recommendations]
                """,
                expected_output="Comprehensive maritime intelligence report",
                agent=self.port_analyst,
                context=[task_ports, task_vessels, task_logistics]
            )

            # Create and execute crew
            crew = Crew(
                agents=[
                    self.port_analyst,
                    self.vessel_tracker,
                    self.logistics_analyst
                ],
                tasks=[
                    task_ports,
                    task_vessels,
                    task_logistics,
                    task_synthesis
                ],
                process=Process.sequential,
                verbose=self.verbose
            )

            result = crew.kickoff()

            print(f"\n{'='*80}")
            print(f"✅ MARITIME INTELLIGENCE CREW COMPLETED")
            print(f"{'='*80}\n")

            return {
                "success": True,
                "output": str(result),
                "task_results": [],
                "artifacts": self._extract_artifacts(),
                "actions": self._extract_actions()
            }

        except Exception as e:
            print(f"❌ Maritime Intelligence crew error: {str(e)}")
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
                "type": "maritime-analysis",
                "title": f"Maritime Intelligence: {self.query[:50]}",
                "data": {
                    "domain": "maritime",
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
                "zoom": self.context.get("map_zoom", 10)
            })

        # Add layer toggle for maritime data
        actions.append({
            "type": "toggleLayer",
            "layer": "maritime-traffic",
            "enabled": True
        })

        return actions
