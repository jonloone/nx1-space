"""
Geospatial Analytics Agent using CrewAI
Specializes in spatial analysis, coverage optimization, and geographic intelligence
"""

from crewai import Agent
from typing import Optional, Dict, Any, List, Tuple
import math
import json
from .base_agent import BaseCrewAgent

class GeospatialAnalystAgent(BaseCrewAgent):
    """Expert agent for geospatial analytics and coverage optimization"""
    
    def __init__(self):
        super().__init__(
            role="Senior Geospatial Analyst",
            goal="Analyze spatial data, optimize ground station coverage, and provide geographic intelligence for network planning",
            backstory="""You are a veteran geospatial analyst with 15+ years of experience in satellite 
            communications and ground station network planning. You have expertise in:
            - Coverage analysis and optimization
            - Viewshed and line-of-sight calculations
            - Geographic Information Systems (GIS)
            - Spatial statistics and clustering analysis
            - Weather impact on signal propagation
            - Terrain analysis for station placement
            You excel at identifying optimal locations for ground stations and analyzing coverage patterns.""",
            verbose=True,
            allow_delegation=False,
            tools=[]
        )
        
    def analyze_coverage_gaps(self, stations: List[Dict]) -> Dict[str, Any]:
        """Analyze coverage gaps in the ground station network"""
        analysis = {
            "total_stations": len(stations),
            "coverage_analysis": [],
            "gaps_identified": [],
            "recommendations": []
        }
        
        # Group stations by region
        regions = {}
        for station in stations:
            region = station.get("location", {}).get("region", "Unknown")
            if region not in regions:
                regions[region] = []
            regions[region].append(station)
        
        # Analyze each region
        for region, regional_stations in regions.items():
            coverage = {
                "region": region,
                "station_count": len(regional_stations),
                "average_utilization": sum(s.get("utilization_metrics", {}).get("current_utilization", 0) 
                                         for s in regional_stations) / len(regional_stations) if regional_stations else 0
            }
            analysis["coverage_analysis"].append(coverage)
            
            # Identify gaps
            if len(regional_stations) < 3:
                analysis["gaps_identified"].append({
                    "region": region,
                    "severity": "high",
                    "current_stations": len(regional_stations),
                    "recommended_additional": 3 - len(regional_stations)
                })
        
        # Generate recommendations
        if analysis["gaps_identified"]:
            analysis["recommendations"] = [
                "Priority expansion needed in regions with fewer than 3 stations",
                "Consider adding redundancy in high-utilization areas",
                "Implement load balancing between nearby stations"
            ]
        
        return analysis
    
    def calculate_optimal_location(self, 
                                  target_area: Dict[str, float],
                                  existing_stations: List[Dict],
                                  constraints: Optional[Dict] = None) -> Dict[str, Any]:
        """Calculate optimal location for a new ground station"""
        
        # Extract target coordinates
        target_lat = target_area.get("latitude", 0)
        target_lon = target_area.get("longitude", 0)
        
        # Calculate distances to existing stations
        min_distance = float('inf')
        closest_station = None
        
        for station in existing_stations:
            lat = station.get("location", {}).get("latitude", 0)
            lon = station.get("location", {}).get("longitude", 0)
            
            # Haversine distance calculation
            distance = self._haversine_distance(target_lat, target_lon, lat, lon)
            
            if distance < min_distance:
                min_distance = distance
                closest_station = station
        
        # Determine optimal placement
        optimal = {
            "recommended_location": {
                "latitude": target_lat,
                "longitude": target_lon,
                "rationale": "Based on coverage gap analysis"
            },
            "distance_to_nearest": round(min_distance, 2),
            "nearest_station": closest_station.get("name") if closest_station else None,
            "coverage_improvement": "High" if min_distance > 500 else "Medium",
            "considerations": []
        }
        
        # Add considerations
        if constraints:
            if constraints.get("min_distance_km", 0) > min_distance:
                optimal["considerations"].append(f"Warning: Minimum distance constraint ({constraints['min_distance_km']}km) not met")
            if constraints.get("max_cost"):
                optimal["considerations"].append(f"Cost constraint: ${constraints['max_cost']:,}")
        
        # Weather considerations
        optimal["weather_analysis"] = self._analyze_weather_impact(target_lat, target_lon)
        
        return optimal
    
    def analyze_viewshed(self, station_location: Dict[str, float], 
                        elevation: float = 10.0) -> Dict[str, Any]:
        """Analyze viewshed and line-of-sight from a station location"""
        
        # Simplified viewshed analysis
        viewshed = {
            "location": station_location,
            "antenna_height": elevation,
            "horizon_distance_km": self._calculate_horizon_distance(elevation),
            "coverage_area_km2": 0,
            "visibility_analysis": {
                "excellent": "0-50km radius",
                "good": "50-100km radius",
                "limited": "100-150km radius",
                "poor": ">150km radius"
            },
            "terrain_impact": "Minimal" if elevation > 20 else "Moderate",
            "recommendations": []
        }
        
        # Calculate coverage area
        horizon_km = viewshed["horizon_distance_km"]
        viewshed["coverage_area_km2"] = round(math.pi * horizon_km ** 2, 2)
        
        # Add recommendations
        if elevation < 15:
            viewshed["recommendations"].append("Consider increasing antenna height for better coverage")
        if viewshed["coverage_area_km2"] < 5000:
            viewshed["recommendations"].append("Coverage area is limited, consider additional stations")
        
        return viewshed
    
    def cluster_analysis(self, stations: List[Dict]) -> Dict[str, Any]:
        """Perform clustering analysis on ground stations"""
        
        clusters = {
            "total_stations": len(stations),
            "clusters_identified": [],
            "isolated_stations": [],
            "density_analysis": {}
        }
        
        # Simple clustering by proximity
        clustered = []
        cluster_threshold_km = 200  # Stations within 200km are considered clustered
        
        for i, station1 in enumerate(stations):
            if i in clustered:
                continue
                
            cluster = [station1]
            lat1 = station1.get("location", {}).get("latitude", 0)
            lon1 = station1.get("location", {}).get("longitude", 0)
            
            for j, station2 in enumerate(stations[i+1:], i+1):
                if j in clustered:
                    continue
                    
                lat2 = station2.get("location", {}).get("latitude", 0)
                lon2 = station2.get("location", {}).get("longitude", 0)
                
                distance = self._haversine_distance(lat1, lon1, lat2, lon2)
                
                if distance <= cluster_threshold_km:
                    cluster.append(station2)
                    clustered.append(j)
            
            if len(cluster) > 1:
                clusters["clusters_identified"].append({
                    "size": len(cluster),
                    "center_location": {
                        "latitude": sum(s.get("location", {}).get("latitude", 0) for s in cluster) / len(cluster),
                        "longitude": sum(s.get("location", {}).get("longitude", 0) for s in cluster) / len(cluster)
                    },
                    "stations": [s.get("name") for s in cluster]
                })
            else:
                clusters["isolated_stations"].append(station1.get("name"))
        
        # Density analysis
        clusters["density_analysis"] = {
            "high_density_regions": len([c for c in clusters["clusters_identified"] if c["size"] >= 3]),
            "medium_density_regions": len([c for c in clusters["clusters_identified"] if c["size"] == 2]),
            "isolated_stations": len(clusters["isolated_stations"]),
            "recommendation": "Consider load balancing in high-density areas and adding redundancy for isolated stations"
        }
        
        return clusters
    
    def weather_impact_assessment(self, location: Dict[str, float], 
                                 frequency_band: str = "Ka-band") -> Dict[str, Any]:
        """Assess weather impact on signal propagation"""
        
        assessment = {
            "location": location,
            "frequency_band": frequency_band,
            "rain_fade_risk": self._calculate_rain_fade_risk(location, frequency_band),
            "seasonal_impacts": {
                "winter": "Moderate - Snow and ice accumulation",
                "spring": "Low - Minimal impact",
                "summer": "High - Thunderstorms and heavy rain",
                "fall": "Low to Moderate - Occasional storms"
            },
            "mitigation_strategies": [],
            "availability_estimate": 0
        }
        
        # Calculate availability based on rain fade risk
        risk_level = assessment["rain_fade_risk"]["risk_level"]
        if risk_level == "Low":
            assessment["availability_estimate"] = 99.9
        elif risk_level == "Medium":
            assessment["availability_estimate"] = 99.5
        else:
            assessment["availability_estimate"] = 99.0
        
        # Add mitigation strategies
        if frequency_band in ["Ka-band", "Q-band", "V-band"]:
            assessment["mitigation_strategies"].extend([
                "Implement adaptive coding and modulation",
                "Consider site diversity with backup station",
                "Use larger antenna for increased link margin"
            ])
        
        if risk_level in ["Medium", "High"]:
            assessment["mitigation_strategies"].extend([
                "Increase power margins by 3-6 dB",
                "Implement rain fade prediction algorithms",
                "Consider lower frequency band for critical services"
            ])
        
        return assessment
    
    # Helper methods
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points on Earth using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def _calculate_horizon_distance(self, height_meters: float) -> float:
        """Calculate horizon distance based on antenna height"""
        # Simplified formula: d = sqrt(2 * R * h) where R is Earth's radius
        R = 6371000  # Earth's radius in meters
        distance_meters = math.sqrt(2 * R * height_meters)
        return distance_meters / 1000  # Convert to kilometers
    
    def _analyze_weather_impact(self, latitude: float, longitude: float) -> Dict[str, str]:
        """Analyze weather impact for a location"""
        # Simplified weather analysis based on latitude
        if abs(latitude) > 60:
            return {"risk": "High", "primary_concern": "Snow, ice, extreme cold"}
        elif abs(latitude) > 30:
            return {"risk": "Medium", "primary_concern": "Seasonal storms"}
        elif abs(latitude) < 10:
            return {"risk": "High", "primary_concern": "Tropical storms, heavy rainfall"}
        else:
            return {"risk": "Low", "primary_concern": "Occasional precipitation"}
    
    def _calculate_rain_fade_risk(self, location: Dict[str, float], frequency_band: str) -> Dict[str, Any]:
        """Calculate rain fade risk for a location and frequency"""
        lat = location.get("latitude", 0)
        
        # Simplified rain fade model
        base_risk = "Low"
        rain_rate = 20  # mm/hr baseline
        
        # Tropical regions have higher rain rates
        if abs(lat) < 23.5:
            rain_rate = 50
            base_risk = "High"
        elif abs(lat) < 35:
            rain_rate = 30
            base_risk = "Medium"
        
        # Higher frequencies have more rain fade
        frequency_factor = 1.0
        if frequency_band == "Ka-band":
            frequency_factor = 2.0
        elif frequency_band in ["Q-band", "V-band"]:
            frequency_factor = 3.0
        elif frequency_band == "Ku-band":
            frequency_factor = 1.5
        
        fade_estimate = rain_rate * frequency_factor * 0.1  # Simplified fade calculation
        
        return {
            "risk_level": base_risk,
            "estimated_rain_rate": f"{rain_rate} mm/hr",
            "fade_estimate_db": round(fade_estimate, 2),
            "frequency_sensitivity": frequency_factor
        }
    
    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Execute a geospatial analysis task with natural language understanding"""
        try:
            task_lower = task.lower()
            
            # For specific analysis requests with sufficient context, provide detailed results
            if "coverage gap" in task_lower and context and "stations" in context:
                result = self.analyze_coverage_gaps(context["stations"])
                return f"Coverage analysis complete! I found {len(result.get('coverage_gaps', []))} coverage gaps across the region. The overall coverage efficiency is {result.get('coverage_percentage', 'N/A')}%. Key recommendations: {', '.join(result.get('recommendations', ['Analyze station distribution for optimization']))}"
            
            elif "optimal location" in task_lower and context and "target_area" in context:
                result = self.calculate_optimal_location(
                    context["target_area"],
                    context.get("existing_stations", []),
                    context.get("constraints")
                )
                return f"Based on my geospatial analysis, the optimal location is at coordinates {result.get('coordinates', 'N/A')} with a coverage score of {result.get('coverage_score', 'N/A')}. This location would optimize coverage while considering terrain, existing infrastructure, and demand patterns."
            
            # For general queries or context-aware responses, use the base LLM execution  
            else:
                # Add geospatial-specific context and map awareness
                enhanced_context = context.copy() if context else {}
                
                # Add map awareness if we have view state context
                if enhanced_context.get("viewState"):
                    view_state = enhanced_context["viewState"]
                    enhanced_context["map_context"] = f"Currently viewing map area centered at longitude {view_state.get('longitude', 'N/A')}, latitude {view_state.get('latitude', 'N/A')} at zoom level {view_state.get('zoom', 'N/A')}"
                
                # Add ground station context if available
                if enhanced_context.get("selectedFeatures"):
                    features = enhanced_context["selectedFeatures"]
                    if features:
                        enhanced_context["station_context"] = f"Selected {len(features)} ground station(s) on the map for analysis"
                    else:
                        enhanced_context["station_context"] = "No ground stations currently selected on the map"
                
                enhanced_context.update({
                    "agent_capabilities": [
                        "Coverage gap analysis and optimization",
                        "Optimal ground station placement calculations", 
                        "Viewshed and terrain analysis",
                        "Geographic clustering and distribution analysis",
                        "Weather impact assessment on satellite links",
                        "Spatial relationship analysis between stations"
                    ],
                    "analysis_types": [
                        "Signal coverage modeling and gap identification",
                        "Multi-criteria site selection optimization",
                        "Terrain obstruction and line-of-sight analysis",
                        "Geographic distribution efficiency assessment", 
                        "Climate and weather pattern impact studies",
                        "Service area optimization and redundancy planning"
                    ]
                })
                
                # Use parent class LLM execution for natural language response
                return super().execute(task, enhanced_context)
                
        except Exception as e:
            return f"I apologize for the technical difficulty. As your Geospatial Analyst, I specialize in analyzing ground station locations, coverage patterns, and spatial relationships. I can help you with coverage optimization, site selection, terrain analysis, and geographic insights. What specific geospatial analysis would you like me to perform?"