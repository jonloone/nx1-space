"""
Route Analysis Tool - Wrapper for Next.js Route Intelligence API

Performs comprehensive route analysis with multi-INT assessment.
"""
import os
import httpx
from typing import Dict, Any, Optional
from crewai_tools import BaseTool


class RouteAnalysisTool(BaseTool):
    """
    Tool for comprehensive route intelligence analysis

    This tool calls the Next.js route analysis API to perform multi-INT
    assessment including GEOINT, SIGINT, OSINT, IMINT, and temporal analysis.
    """

    name: str = "Route Analysis Tool"
    description: str = """
    Performs comprehensive intelligence-grade route analysis from one location to another.

    Analyzes:
    - GEOINT: Terrain, elevation, natural chokepoints
    - SIGINT: Cellular coverage and dead zones
    - OSINT: Notable locations, infrastructure, points of interest
    - IMINT: Satellite imagery analysis for each waypoint
    - TEMPORAL: Traffic patterns, timing analysis

    Input should be a JSON object with:
    {
        "from_location": "Starting location (name or coordinates)",
        "to_location": "Destination location (name or coordinates)",
        "mode": "transportation mode (driving, walking, cycling)",
        "start_time": "ISO timestamp (optional, defaults to current time)"
    }

    Returns detailed route intelligence with waypoint-by-waypoint analysis.

    Example usage:
    - Input: {"from_location": "Times Square, NYC", "to_location": "Central Park, NYC", "mode": "walking"}
    - Output: Comprehensive route intelligence with multi-INT analysis for each waypoint
    """

    def _run(
        self,
        from_location: str,
        to_location: str,
        mode: str = "driving",
        start_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze a route with multi-INT assessment

        Args:
            from_location: Starting location (name or coordinates)
            to_location: Destination location (name or coordinates)
            mode: Transportation mode (driving, walking, cycling)
            start_time: ISO timestamp for route start (optional)

        Returns:
            Comprehensive route intelligence analysis
        """
        try:
            # Get Next.js app URL from environment
            next_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
            route_url = f"{next_url}/api/intelligence/route"

            # Build request payload
            payload = {
                "from": from_location,
                "to": to_location,
                "mode": mode
            }

            if start_time:
                payload["startTime"] = start_time

            print(f"🛣️ Analyzing route: {from_location} → {to_location} ({mode})")

            # Call route analysis API with extended timeout
            with httpx.Client(timeout=120.0) as client:
                response = client.post(route_url, json=payload)

                if response.status_code != 200:
                    return {
                        "error": f"Route analysis API returned status {response.status_code}",
                        "from": from_location,
                        "to": to_location
                    }

                data = response.json()

                # Return the analysis result
                return {
                    "success": True,
                    "from_location": from_location,
                    "to_location": to_location,
                    "mode": mode,
                    "route_data": data
                }

        except httpx.TimeoutException:
            return {
                "error": "Route analysis timed out (exceeded 120 seconds)",
                "from": from_location,
                "to": to_location
            }
        except Exception as e:
            return {
                "error": f"Route analysis failed: {str(e)}",
                "from": from_location,
                "to": to_location
            }
