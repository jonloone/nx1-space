"""
FastAPI Server for CrewAI Multi-Agent Intelligence Orchestration

This service provides multi-agent orchestration using CrewAI for complex
intelligence analysis workflows including route analysis, site assessment,
and comprehensive multi-INT investigations.
"""
import os
import time
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.models import CrewRequest, CrewResponse, HealthResponse, TaskResult
from app.crews.route_intelligence import RouteIntelligenceCrew

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="CrewAI Intelligence API",
    description="Multi-agent orchestration for intelligence analysis",
    version="1.0.0"
)

# Configure CORS - Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
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
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health() -> HealthResponse:
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        crews_available=["route", "site", "investigation", "auto"]
    )


@app.post("/api/crew")
async def execute_crew(request: CrewRequest) -> CrewResponse:
    """
    Execute a CrewAI workflow based on user query and context

    This endpoint:
    1. Analyzes the query and context to determine the appropriate crew
    2. Executes the crew with specialized agents
    3. Returns synthesized intelligence with artifacts and map actions

    Example Request:
    {
        "query": "Analyze route from Times Square to Central Park",
        "context": {
            "map_center": {"lat": 40.7580, "lng": -73.9855},
            "map_zoom": 13,
            "selected_location": "Times Square, NYC"
        },
        "crew_type": "route",
        "verbose": true
    }
    """
    start_time = time.time()

    try:
        # Determine which crew to use
        crew_type = request.crew_type or "auto"

        if crew_type == "auto":
            # Auto-detect crew based on query
            crew_type = detect_crew_type(request.query)

        print(f"🎯 Executing {crew_type} crew for query: {request.query}")

        # Route to appropriate crew
        if crew_type == "route":
            crew = RouteIntelligenceCrew(
                query=request.query,
                context=request.context or {},
                verbose=request.verbose
            )
            result = await crew.execute()

            # Convert CrewAI result to API response format
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

            return response

        elif crew_type == "site":
            # TODO: Implement Site Intelligence Crew
            raise HTTPException(
                status_code=501,
                detail="Site Intelligence crew not yet implemented"
            )

        elif crew_type == "investigation":
            # TODO: Implement Full Investigation Crew
            raise HTTPException(
                status_code=501,
                detail="Investigation crew not yet implemented"
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown crew type: {crew_type}"
            )

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
