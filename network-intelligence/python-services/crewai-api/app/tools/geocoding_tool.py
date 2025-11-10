"""
Geocoding Tool - Wrapper for Next.js Geocoding API

Converts location names to coordinates using the geocoding service.
"""
import os
import httpx
from typing import Dict, Any, Optional
from crewai_tools import BaseTool


class GeocodingTool(BaseTool):
    """
    Tool for geocoding location names to coordinates

    This tool calls the Next.js geocoding API to convert location names
    (e.g., "Times Square, NYC") to lat/lng coordinates.
    """

    name: str = "Geocoding Tool"
    description: str = """
    Converts location names to geographic coordinates (latitude/longitude).

    Input should be a location name or address (e.g., "Central Park, NYC" or "Los Angeles").
    Returns coordinates, formatted address, and place details.

    Example usage:
    - Input: "Times Square, NYC"
    - Output: {"lat": 40.758, "lng": -73.9855, "formatted_address": "Times Square, Manhattan, NY"}
    """

    def _run(self, location: str) -> Dict[str, Any]:
        """
        Geocode a location name to coordinates

        Args:
            location: Location name or address

        Returns:
            Dictionary with coordinates and place details
        """
        try:
            # Get Next.js app URL from environment
            next_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
            geocoding_url = f"{next_url}/api/geocoding"

            # Call geocoding API
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    geocoding_url,
                    json={"query": location}
                )

                if response.status_code != 200:
                    return {
                        "error": f"Geocoding API returned status {response.status_code}",
                        "location": location
                    }

                data = response.json()

                # Extract coordinates from response
                if data.get("results") and len(data["results"]) > 0:
                    result = data["results"][0]
                    return {
                        "success": True,
                        "location": location,
                        "lat": result.get("lat"),
                        "lng": result.get("lng"),
                        "formatted_address": result.get("formatted_address"),
                        "place_name": result.get("place_name"),
                        "bbox": result.get("bbox")
                    }
                else:
                    return {
                        "error": "No geocoding results found",
                        "location": location
                    }

        except Exception as e:
            return {
                "error": f"Geocoding failed: {str(e)}",
                "location": location
            }
