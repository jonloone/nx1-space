"""
CrewAI Crews - Multi-Agent Orchestration Workflows

Each crew represents a specialized workflow with multiple coordinated agents:
- RouteIntelligenceCrew: Route analysis and navigation
- GroundIntelligenceCrew: Building, infrastructure, and POI analysis
- MaritimeIntelligenceCrew: Ports, vessels, and shipping analysis
- SpaceIntelligenceCrew: Satellites, orbits, and ground stations
- DomainRouter: Intelligent routing to appropriate crews
"""
from .route_intelligence import RouteIntelligenceCrew
from .ground_intelligence import GroundIntelligenceCrew
from .maritime_intelligence import MaritimeIntelligenceCrew
from .space_intelligence import SpaceIntelligenceCrew
from .domain_router import DomainRouter, IntelDomain, get_domain_router

__all__ = [
    'RouteIntelligenceCrew',
    'GroundIntelligenceCrew',
    'MaritimeIntelligenceCrew',
    'SpaceIntelligenceCrew',
    'DomainRouter',
    'IntelDomain',
    'get_domain_router'
]
