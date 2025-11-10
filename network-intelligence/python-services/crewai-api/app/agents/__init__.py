"""
CrewAI Agents - Specialized Intelligence Analysts

Each agent has a specific domain expertise (GEOINT, SIGINT, OSINT, etc.)
and uses tools to gather and analyze intelligence.
"""
from .route_agents import create_route_analyst, create_geoint_specialist, create_temporal_analyst

__all__ = [
    'create_route_analyst',
    'create_geoint_specialist',
    'create_temporal_analyst'
]
