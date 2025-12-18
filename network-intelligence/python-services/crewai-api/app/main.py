"""
FastAPI Server for CrewAI Multi-Agent Intelligence Orchestration

This service provides multi-agent orchestration using CrewAI for complex
intelligence analysis workflows across multiple domains:
- Ground: Buildings, infrastructure, POIs
- Maritime: Ports, vessels, shipping
- Space: Satellites, orbits, ground stations
- Route: Navigation and path analysis
"""
import os
import time
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.models import CrewRequest, CrewResponse, HealthResponse, TaskResult
from app.crews.route_intelligence import RouteIntelligenceCrew
from app.crews.ground_intelligence import GroundIntelligenceCrew
from app.crews.maritime_intelligence import MaritimeIntelligenceCrew
from app.crews.space_intelligence import SpaceIntelligenceCrew
from app.crews.domain_router import get_domain_router, IntelDomain

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="CrewAI Intelligence API",
    description="Multi-agent orchestration for intelligence analysis across Ground, Maritime, and Space domains",
    version="2.0.0"
)

# Configure CORS - Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://137.220.61.218:3000",
        "https://app.mundi.ai",
        os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CrewAI Intelligence API",
        "version": "2.0.0",
        "status": "operational",
        "domains": ["ground", "maritime", "space", "route", "all"]
    }


@app.get("/health")
async def health() -> HealthResponse:
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        crews_available=["route", "ground", "maritime", "space", "auto"]
    )


@app.post("/api/crew")
async def execute_crew(request: CrewRequest) -> CrewResponse:
    """
    Execute a CrewAI workflow based on user query and context

    This endpoint:
    1. Routes the query to the appropriate domain crew using DomainRouter
    2. Executes the crew with specialized agents and data access tools
    3. Returns synthesized intelligence with artifacts and map actions

    Supported crew types:
    - route: Navigation and path analysis
    - ground: Buildings, infrastructure, POIs
    - maritime: Ports, vessels, shipping
    - space: Satellites, orbits, ground stations
    - auto: Automatic detection based on query content

    Example Request:
    {
        "query": "Analyze major seaports in California",
        "context": {
            "map_center": {"lat": 34.0522, "lng": -118.2437},
            "map_zoom": 8,
            "domain": "maritime"
        },
        "crew_type": "maritime",
        "verbose": true
    }
    """
    start_time = time.time()

    try:
        # Get domain router
        router = get_domain_router()

        # Determine which crew to use
        crew_type = request.crew_type or "auto"
        context = request.context or {}

        # Extract explicit domain from context if provided
        explicit_domain = context.get("domain", crew_type if crew_type != "auto" else None)

        print(f"🎯 Routing query: {request.query}")
        print(f"   Crew type: {crew_type}, Explicit domain: {explicit_domain}")

        # Use domain router for intelligent routing
        domain, result = await router.route_query(
            query=request.query,
            context=context,
            explicit_domain=explicit_domain,
            verbose=request.verbose
        )

        # Convert result to API response format
        response = CrewResponse(
            success=result.get("success", True),
            output=result.get("output", ""),
            task_results=result.get("task_results", []),
            artifacts=result.get("artifacts", []),
            actions=result.get("actions", []),
            total_duration_ms=int((time.time() - start_time) * 1000),
            total_tokens=result.get("total_tokens"),
            error=result.get("error")
        )

        print(f"✅ Completed {domain.value} analysis in {response.total_duration_ms}ms")
        return response

    except Exception as e:
        print(f"❌ Crew execution error: {str(e)}")
        return CrewResponse(
            success=False,
            output="",
            task_results=[],
            artifacts=[],
            actions=[],
            total_duration_ms=int((time.time() - start_time) * 1000),
            error=str(e)
        )


@app.post("/api/crew/ground")
async def execute_ground_crew(request: CrewRequest) -> CrewResponse:
    """Execute Ground Intelligence Crew directly"""
    request.crew_type = "ground"
    if request.context is None:
        request.context = {}
    request.context["domain"] = "ground"
    return await execute_crew(request)


@app.post("/api/crew/maritime")
async def execute_maritime_crew(request: CrewRequest) -> CrewResponse:
    """Execute Maritime Intelligence Crew directly"""
    request.crew_type = "maritime"
    if request.context is None:
        request.context = {}
    request.context["domain"] = "maritime"
    return await execute_crew(request)


@app.post("/api/crew/space")
async def execute_space_crew(request: CrewRequest) -> CrewResponse:
    """Execute Space Intelligence Crew directly"""
    request.crew_type = "space"
    if request.context is None:
        request.context = {}
    request.context["domain"] = "space"
    return await execute_crew(request)


def detect_crew_type(query: str) -> str:
    """
    Auto-detect appropriate crew based on query content

    Args:
        query: User's natural language query

    Returns:
        Crew type: 'route', 'site', or 'investigation'
    """
    query_lower = query.lower()

    # Route analysis keywords
    route_keywords = [
        "route", "path", "navigate", "from", "to",
        "drive", "walk", "travel", "journey", "waypoint"
    ]

    # Site assessment keywords
    site_keywords = [
        "analyze", "assess", "evaluate", "site", "location",
        "area", "infrastructure", "building", "facility"
    ]

    # Investigation keywords
    investigation_keywords = [
        "investigate", "research", "intelligence", "comprehensive",
        "full analysis", "deep dive", "investigation"
    ]

    # Check for route analysis
    if any(keyword in query_lower for keyword in route_keywords):
        return "route"

    # Check for investigation
    if any(keyword in query_lower for keyword in investigation_keywords):
        return "investigation"

    # Check for site assessment
    if any(keyword in query_lower for keyword in site_keywords):
        return "site"

    # Default to route for location-based queries
    return "route"


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))

    print(f"""
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║         CrewAI Intelligence API Server                     ║
    ║         Multi-Agent Orchestration for OpIntel              ║
    ║                                                            ║
    ║         Running on: http://localhost:{port}              ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
