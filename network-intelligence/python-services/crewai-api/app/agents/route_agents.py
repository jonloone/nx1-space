"""
Route Analysis Agents

Specialized agents for route intelligence analysis.
"""
import os
from crewai import Agent
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic


def get_llm(model_name: str = None):
    """
    Get LLM instance based on configuration

    Supports Anthropic Claude, OpenAI, and Vultr models
    """
    model = model_name or os.getenv("DEFAULT_LLM_MODEL", "anthropic/claude-3-5-sonnet-20241022")

    if "anthropic" in model or "claude" in model:
        return ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.3
        )
    elif "openai" in model or "gpt" in model:
        return ChatOpenAI(
            model="gpt-4o",
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.3
        )
    elif "vultr" in model:
        # Use OpenAI-compatible API with Vultr
        return ChatOpenAI(
            base_url="https://api.vultrinference.com/v1",
            api_key=os.getenv("VULTR_API_KEY"),
            model="deepseek-r1-distill-llama-70b",
            temperature=0.3
        )
    else:
        # Default to Anthropic
        return ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.3
        )


def create_route_analyst(tools: list) -> Agent:
    """
    Route Intelligence Analyst

    Coordinates route analysis workflow, interprets results,
    and synthesizes intelligence reports.
    """
    return Agent(
        role="Route Intelligence Analyst",
        goal="Coordinate comprehensive route analysis and synthesize actionable intelligence for operational planning",
        backstory="""You are a senior intelligence analyst specializing in route analysis
        and movement planning. You have extensive experience in:
        - Analyzing transportation routes for operational security
        - Identifying risks, opportunities, and key waypoints
        - Coordinating input from GEOINT, SIGINT, OSINT, and temporal analysts
        - Producing clear, actionable intelligence reports for decision-makers

        Your reports are known for their clarity, attention to detail, and practical
        recommendations. You understand that operators need precise, concise intelligence
        to make rapid decisions in the field.""",
        tools=tools,
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_geoint_specialist() -> Agent:
    """
    GEOINT Specialist

    Analyzes geographic and terrain data from route analysis results.
    """
    return Agent(
        role="GEOINT Specialist",
        goal="Analyze terrain, elevation, and geographic features to identify tactical advantages and obstacles",
        backstory="""You are a GEOINT (Geospatial Intelligence) specialist with military
        intelligence experience. Your expertise includes:
        - Terrain analysis and elevation profiling
        - Identifying natural chokepoints and observation positions
        - Assessing trafficability and movement corridors
        - Analyzing geographic features for operational significance

        You understand how terrain influences operations and can quickly identify
        tactically significant features from elevation data, satellite imagery,
        and geographic context.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_temporal_analyst() -> Agent:
    """
    Temporal Intelligence Analyst

    Analyzes timing, traffic patterns, and temporal factors.
    """
    return Agent(
        role="Temporal Intelligence Analyst",
        goal="Analyze timing patterns, traffic flow, and temporal factors affecting route viability",
        backstory="""You are a temporal intelligence analyst specializing in pattern analysis
        and timing optimization. Your expertise includes:
        - Traffic pattern analysis and prediction
        - Timing optimization for operational security
        - Identifying peak and off-peak movement windows
        - Analyzing temporal vulnerabilities and opportunities

        You understand that timing is often as critical as the route itself, and you
        excel at identifying optimal windows for movement while considering traffic,
        visibility, and activity patterns.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )


def create_osint_specialist() -> Agent:
    """
    OSINT Specialist

    Analyzes open-source intelligence from route waypoints.
    """
    return Agent(
        role="OSINT Specialist",
        goal="Analyze open-source intelligence to identify points of interest, infrastructure, and contextual factors",
        backstory="""You are an OSINT (Open-Source Intelligence) analyst with expertise in
        analyzing publicly available information. Your skills include:
        - Identifying notable locations and infrastructure along routes
        - Analyzing points of interest for operational significance
        - Assessing commercial, government, and public facilities
        - Understanding urban infrastructure and activity patterns

        You excel at connecting disparate pieces of open-source information to build
        a comprehensive picture of the operational environment.""",
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )
