#!/usr/bin/env python3
"""
Enhanced Ground Station Opportunity Analyzer
Incorporates weather, terrain, population, maritime traffic, and regulatory data
"""

import json
import requests
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
import time

class EnhancedOpportunityAnalyzer:
    def __init__(self):
        self.weather_api_key = None  # Would need API key for production
        self.grid_resolution = 2.5  # degrees
        self.analysis_grid = []
        
    def generate_analysis_grid(self):
        """Generate global analysis grid with enhanced data"""
        grid = []
        
        for lat in np.arange(-60, 61, self.grid_resolution):
            for lon in np.arange(-180, 181, self.grid_resolution):
                point = {
                    'id': f"{lat}_{lon}",
                    'coordinates': [lon, lat],
                    'latitude': lat,
                    'longitude': lon,
                    
                    # Weather factors
                    'avg_cloud_cover': self.get_cloud_cover_data(lon, lat),
                    'precipitation_mm': self.get_precipitation_data(lon, lat),
                    'wind_speed_ms': self.get_wind_data(lon, lat),
                    'atmospheric_pressure': self.get_pressure_data(lon, lat),
                    
                    # Geographic factors
                    'elevation_m': self.get_elevation_data(lon, lat),
                    'terrain_type': self.get_terrain_type(lon, lat),
                    'coastal_distance_km': self.get_coastal_distance(lon, lat),
                    
                    # Population and economic
                    'population_density': self.get_population_density(lon, lat),
                    'gdp_per_capita': self.get_economic_data(lon, lat),
                    'urbanization_index': self.get_urbanization_index(lon, lat),
                    
                    # Infrastructure
                    'existing_stations_nearby': self.count_nearby_stations(lon, lat),
                    'fiber_connectivity': self.assess_fiber_connectivity(lon, lat),
                    'power_grid_access': self.assess_power_grid(lon, lat),
                    
                    # Traffic patterns
                    'maritime_traffic_density': self.get_maritime_traffic(lon, lat),
                    'aviation_traffic_density': self.get_aviation_traffic(lon, lat),
                    'internet_traffic_demand': self.estimate_internet_demand(lon, lat),
                    
                    # Regulatory
                    'regulatory_complexity': self.assess_regulatory_environment(lon, lat),
                    'licensing_difficulty': self.assess_licensing_difficulty(lon, lat),
                    'political_stability': self.get_political_stability(lon, lat),
                    
                    # Competition
                    'competitor_density': self.assess_competition(lon, lat),
                    'market_saturation': self.calculate_market_saturation(lon, lat),
                    
                    # Calculated scores
                    'weather_score': 0,
                    'infrastructure_score': 0,
                    'demand_score': 0,
                    'competition_score': 0,
                    'regulatory_score': 0,
                    'overall_opportunity_score': 0
                }
                
                grid.append(point)
        
        return grid
    
    def get_cloud_cover_data(self, lon, lat):
        """Get average cloud cover percentage (0-100)"""
        # Simplified model based on geographic patterns
        # Equatorial regions have more cloud cover
        equatorial_factor = 1 - abs(lat) / 90
        oceanic_factor = 1 if self.is_oceanic(lon, lat) else 0.7
        
        base_cloud_cover = 30 + (equatorial_factor * 40) + (oceanic_factor * 20)
        
        # Add some realistic variation
        variation = np.random.normal(0, 10)
        return max(0, min(100, base_cloud_cover + variation))
    
    def get_precipitation_data(self, lon, lat):
        """Get average annual precipitation in mm"""
        # Simplified precipitation model
        if abs(lat) < 23.5:  # Tropics
            if abs(lon - 0) < 20 or abs(lon - 180) < 20:  # Africa/Pacific
                return np.random.normal(1500, 500)  # High precipitation
            else:
                return np.random.normal(1000, 300)
        elif abs(lat) < 35:  # Subtropical
            return np.random.normal(600, 200)
        else:  # Temperate/Polar
            return np.random.normal(400, 150)
    
    def get_wind_data(self, lon, lat):
        """Get average wind speed in m/s"""
        # Higher winds at higher latitudes and coastal areas
        latitude_factor = abs(lat) / 90
        coastal_factor = 1.3 if self.get_coastal_distance(lon, lat) < 100 else 1.0
        
        base_wind = 3 + (latitude_factor * 4) * coastal_factor
        return max(0, base_wind + np.random.normal(0, 1))
    
    def get_pressure_data(self, lon, lat):
        """Get atmospheric pressure (affects satellite communication)"""
        # Pressure varies with elevation and latitude
        elevation = self.get_elevation_data(lon, lat)
        pressure_sea_level = 1013.25  # hPa
        
        # Pressure decreases with elevation (~12 hPa per 100m)
        pressure = pressure_sea_level - (elevation * 0.12)
        
        return pressure + np.random.normal(0, 5)
    
    def get_elevation_data(self, lon, lat):
        """Get elevation in meters (simplified)"""
        # Mountain ranges approximation
        mountain_regions = [
            # Himalayas
            (80, 100, 25, 35, 3000),
            # Andes
            (-80, -60, -30, 10, 2500),
            # Rockies
            (-125, -100, 35, 55, 2000),
            # Alps
            (5, 15, 45, 48, 1500)
        ]
        
        elevation = 200  # Base elevation
        for lon_min, lon_max, lat_min, lat_max, peak_elevation in mountain_regions:
            if lon_min <= lon <= lon_max and lat_min <= lat <= lat_max:
                # Distance from center of mountain range
                center_lon = (lon_min + lon_max) / 2
                center_lat = (lat_min + lat_max) / 2
                distance = np.sqrt((lon - center_lon)**2 + (lat - center_lat)**2)
                
                if distance < 10:  # Within mountain range
                    elevation += peak_elevation * (1 - distance / 10)
        
        return max(0, elevation + np.random.normal(0, 100))
    
    def get_terrain_type(self, lon, lat):
        """Classify terrain type"""
        elevation = self.get_elevation_data(lon, lat)
        
        if elevation > 2000:
            return 'mountain'
        elif elevation > 500:
            return 'hill'
        elif self.is_oceanic(lon, lat):
            return 'oceanic'
        elif abs(lat) < 23.5 and self.get_precipitation_data(lon, lat) > 1200:
            return 'tropical'
        elif self.get_precipitation_data(lon, lat) < 300:
            return 'desert'
        else:
            return 'plain'
    
    def get_coastal_distance(self, lon, lat):
        """Estimate distance to nearest coast in km (simplified)"""
        # Very simplified coastal distance model
        if self.is_oceanic(lon, lat):
            return 0
        
        # Continental interiors are further from coast
        continental_centers = [
            (0, 15),    # Africa
            (-100, 40), # North America
            (100, 45),  # Asia
        ]
        
        min_distance = float('inf')
        for center_lon, center_lat in continental_centers:
            distance = np.sqrt((lon - center_lon)**2 + (lat - center_lat)**2) * 111  # rough km conversion
            min_distance = min(min_distance, distance)
        
        return max(0, min_distance - 500)  # Minimum 500km from center to coast
    
    def is_oceanic(self, lon, lat):
        """Check if point is over ocean (simplified)"""
        # Very basic ocean detection
        if abs(lat) > 70:  # Polar regions
            return True
        
        # Major ocean regions
        pacific = (lon > 120 or lon < -60) and abs(lat) < 60
        atlantic = -60 <= lon <= 20 and abs(lat) < 70
        indian = 20 <= lon <= 120 and lat < 30 and lat > -60
        
        return pacific or atlantic or indian
    
    def get_population_density(self, lon, lat):
        """Enhanced population density calculation"""
        # Major population centers with more realistic data
        population_centers = [
            # [lon, lat, population_millions, radius_deg]
            [0, 51, 9, 3],      # London
            [2, 48, 11, 3],     # Paris
            [-74, 40, 20, 4],   # New York
            [-118, 34, 13, 4],  # Los Angeles  
            [139, 35, 38, 5],   # Tokyo
            [121, 31, 24, 4],   # Shanghai
            [77, 28, 29, 4],    # Delhi
            [72, 19, 20, 3],    # Mumbai
            [116, 39, 21, 4],   # Beijing
            [-46, -23, 12, 3],  # São Paulo
            [151, -33, 5, 2],   # Sydney
            [28, -26, 4, 2],    # Johannesburg
        ]
        
        density = 5  # Base rural density
        
        for center_lon, center_lat, population, radius in population_centers:
            distance = np.sqrt((lon - center_lon)**2 + (lat - center_lat)**2)
            if distance < radius:
                # Population density decreases with distance from center
                city_density = (population * 1000) / (np.pi * radius**2 * 111**2)  # people per km²
                distance_factor = max(0, 1 - (distance / radius))
                density += city_density * distance_factor
        
        return density
    
    def get_economic_data(self, lon, lat):
        """Estimate GDP per capita based on region"""
        # Simplified economic data by major regions
        if -130 <= lon <= -60 and 25 <= lat <= 60:  # North America
            return 45000 + np.random.normal(0, 10000)
        elif -15 <= lon <= 40 and 35 <= lat <= 70:  # Europe
            return 35000 + np.random.normal(0, 8000)
        elif 100 <= lon <= 150 and 20 <= lat <= 45:  # East Asia developed
            return 30000 + np.random.normal(0, 15000)
        elif 60 <= lon <= 150 and -50 <= lat <= 50:  # Asia general
            return 8000 + np.random.normal(0, 5000)
        elif -90 <= lon <= -30 and -60 <= lat <= 15:  # South America
            return 12000 + np.random.normal(0, 6000)
        elif -20 <= lon <= 55 and -35 <= lat <= 40:  # Africa
            return 3000 + np.random.normal(0, 2000)
        else:
            return 15000 + np.random.normal(0, 10000)
    
    def calculate_weather_score(self, point):
        """Calculate weather favorability score (0-100)"""
        # Lower cloud cover is better for satellite communication
        cloud_score = (100 - point['avg_cloud_cover']) * 0.4
        
        # Moderate precipitation is okay, extreme is bad
        precip_score = max(0, 100 - abs(point['precipitation_mm'] - 800) / 20) * 0.2
        
        # Moderate wind speeds are better (too high causes antenna problems)
        wind_score = max(0, 100 - abs(point['wind_speed_ms'] - 5) * 10) * 0.2
        
        # Stable atmospheric pressure
        pressure_score = max(0, 100 - abs(point['atmospheric_pressure'] - 1013) / 2) * 0.2
        
        return cloud_score + precip_score + wind_score + pressure_score
    
    def calculate_infrastructure_score(self, point):
        """Calculate infrastructure readiness score (0-100)"""
        # Elevation affects construction costs
        elevation_score = max(0, 100 - point['elevation_m'] / 50) * 0.3
        
        # Fiber connectivity
        fiber_score = point['fiber_connectivity'] * 30
        
        # Power grid access
        power_score = point['power_grid_access'] * 25
        
        # Coastal access (for cables and logistics)
        coastal_score = max(0, 100 - point['coastal_distance_km'] / 10) * 0.15
        
        return elevation_score + fiber_score + power_score + coastal_score
    
    def calculate_demand_score(self, point):
        """Calculate communication demand score (0-100)"""
        # Population density drives demand
        pop_score = min(100, point['population_density'] / 100) * 0.4
        
        # Economic activity
        gdp_score = min(100, point['gdp_per_capita'] / 500) * 0.2
        
        # Maritime traffic
        maritime_score = point['maritime_traffic_density'] * 20
        
        # Aviation traffic  
        aviation_score = point['aviation_traffic_density'] * 20
        
        return pop_score + gdp_score + maritime_score + aviation_score
    
    def assess_fiber_connectivity(self, lon, lat):
        """Assess fiber optic connectivity (0-1)"""
        # Higher in developed regions and coastal areas
        population = self.get_population_density(lon, lat)
        gdp = self.get_economic_data(lon, lat)
        coastal_distance = self.get_coastal_distance(lon, lat)
        
        fiber_score = min(1, (population / 1000) * 0.3 + (gdp / 50000) * 0.5)
        if coastal_distance < 100:  # Near coast (submarine cables)
            fiber_score += 0.2
        
        return min(1, fiber_score)
    
    def assess_power_grid(self, lon, lat):
        """Assess power grid reliability (0-1)"""
        gdp = self.get_economic_data(lon, lat)
        population = self.get_population_density(lon, lat)
        
        # Higher GDP and population density = better power grid
        return min(1, (gdp / 30000) * 0.6 + min(1, population / 500) * 0.4)
    
    def get_maritime_traffic(self, lon, lat):
        """Estimate maritime traffic density (0-1)"""
        # Major shipping lanes
        shipping_lanes = [
            # [start_lon, start_lat, end_lon, end_lat, traffic_density]
            [-5, 36, 32, 30, 0.9],    # Gibraltar to Suez
            [103, 1, 80, 6, 0.8],     # Singapore Strait
            [-80, 9, -79, 9, 0.7],    # Panama Canal
            [120, 30, -140, 40, 0.6], # Trans-Pacific
            [-70, 40, 0, 50, 0.5],    # Trans-Atlantic
        ]
        
        max_traffic = 0
        for start_lon, start_lat, end_lon, end_lat, density in shipping_lanes:
            # Calculate distance from point to shipping lane
            # Simplified: distance to line segment
            lane_distance = self.point_to_line_distance(lon, lat, start_lon, start_lat, end_lon, end_lat)
            if lane_distance < 5:  # Within 5 degrees of shipping lane
                traffic_influence = density * (1 - lane_distance / 5)
                max_traffic = max(max_traffic, traffic_influence)
        
        return max_traffic
    
    def get_aviation_traffic(self, lon, lat):
        """Estimate aviation traffic density (0-1)"""
        # Higher traffic near major airports and flight corridors
        major_airports = [
            [0, 51, 0.9],     # London
            [-74, 40, 0.9],   # New York
            [139, 35, 0.8],   # Tokyo
            [2, 48, 0.7],     # Paris
            [121, 31, 0.7],   # Shanghai
            [-118, 34, 0.6],  # Los Angeles
        ]
        
        max_traffic = 0
        for airport_lon, airport_lat, density in major_airports:
            distance = np.sqrt((lon - airport_lon)**2 + (lat - airport_lat)**2)
            if distance < 10:  # Within 10 degrees
                traffic = density * (1 - distance / 10)
                max_traffic = max(max_traffic, traffic)
        
        return max_traffic
    
    def point_to_line_distance(self, px, py, x1, y1, x2, y2):
        """Calculate distance from point to line segment"""
        line_length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        if line_length == 0:
            return np.sqrt((px - x1)**2 + (py - y1)**2)
        
        t = max(0, min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / line_length**2))
        projection_x = x1 + t * (x2 - x1)
        projection_y = y1 + t * (y2 - y1)
        
        return np.sqrt((px - projection_x)**2 + (py - projection_y)**2)
    
    def count_nearby_stations(self, lon, lat):
        """Count existing ground stations within 1000km"""
        # This would use actual ground station database
        # For now, simplified estimation
        population = self.get_population_density(lon, lat)
        gdp = self.get_economic_data(lon, lat)
        
        # More stations in developed, populated areas
        return int((population / 1000) * 2 + (gdp / 20000) * 3)
    
    def assess_regulatory_environment(self, lon, lat):
        """Assess regulatory complexity (0-1, higher = more complex)"""
        # Simplified by region
        if -130 <= lon <= -60 and 25 <= lat <= 60:  # North America
            return 0.6  # Moderate regulation
        elif -15 <= lon <= 40 and 35 <= lat <= 70:  # Europe
            return 0.7  # High regulation
        elif 100 <= lon <= 150 and 20 <= lat <= 45:  # East Asia
            return 0.5  # Moderate regulation
        else:
            return 0.4  # Lower regulation
    
    def assess_licensing_difficulty(self, lon, lat):
        """Assess licensing difficulty (0-1, higher = more difficult)"""
        regulatory_complexity = self.assess_regulatory_environment(lon, lat)
        political_stability = self.get_political_stability(lon, lat)
        
        # More difficult in highly regulated, less stable regions
        return regulatory_complexity * 0.7 + (1 - political_stability) * 0.3
    
    def get_political_stability(self, lon, lat):
        """Get political stability index (0-1, higher = more stable)"""
        # Simplified by major regions
        if -130 <= lon <= -60 and 25 <= lat <= 60:  # North America
            return 0.85
        elif -15 <= lon <= 40 and 35 <= lat <= 70:  # Europe
            return 0.90
        elif 100 <= lon <= 150 and 20 <= lat <= 45:  # East Asia developed
            return 0.75
        elif 130 <= lon <= 180 and -50 <= lat <= -10:  # Australia/NZ
            return 0.92
        else:
            return 0.60  # Default for other regions
    
    def assess_competition(self, lon, lat):
        """Assess competitor density (0-1)"""
        existing_stations = self.count_nearby_stations(lon, lat)
        market_size = self.get_population_density(lon, lat) * self.get_economic_data(lon, lat) / 10000
        
        if market_size > 0:
            return min(1, existing_stations / market_size)
        return 0
    
    def calculate_market_saturation(self, lon, lat):
        """Calculate market saturation (0-1)"""
        competition = self.assess_competition(lon, lat)
        demand_potential = self.get_population_density(lon, lat) / 1000
        
        if demand_potential > 0:
            return min(1, competition / demand_potential)
        return 1  # Saturated if no demand
    
    def estimate_internet_demand(self, lon, lat):
        """Estimate internet traffic demand (0-1)"""
        population = self.get_population_density(lon, lat)
        gdp = self.get_economic_data(lon, lat)
        urbanization = self.get_urbanization_index(lon, lat)
        
        # Internet demand correlates with population, wealth, and urbanization
        demand = (population / 2000) * 0.4 + (gdp / 40000) * 0.4 + urbanization * 0.2
        return min(1, demand)
    
    def get_urbanization_index(self, lon, lat):
        """Get urbanization index (0-1)"""
        population = self.get_population_density(lon, lat)
        gdp = self.get_economic_data(lon, lat)
        
        # Higher urbanization in populated, wealthy areas
        return min(1, (population / 1000) * 0.6 + (gdp / 30000) * 0.4)
    
    def calculate_overall_scores(self, grid):
        """Calculate all scores for grid points"""
        for point in grid:
            point['weather_score'] = self.calculate_weather_score(point)
            point['infrastructure_score'] = self.calculate_infrastructure_score(point)
            point['demand_score'] = self.calculate_demand_score(point)
            
            # Competition score (inverse of competition level)
            point['competition_score'] = (1 - point['competitor_density']) * 100
            
            # Regulatory score (inverse of difficulty)
            point['regulatory_score'] = (1 - point['licensing_difficulty']) * 100
            
            # Overall opportunity score (weighted average)
            weights = {
                'weather': 0.20,
                'infrastructure': 0.25, 
                'demand': 0.30,
                'competition': 0.15,
                'regulatory': 0.10
            }
            
            point['overall_opportunity_score'] = (
                point['weather_score'] * weights['weather'] +
                point['infrastructure_score'] * weights['infrastructure'] +
                point['demand_score'] * weights['demand'] +
                point['competition_score'] * weights['competition'] +
                point['regulatory_score'] * weights['regulatory']
            )
        
        return grid
    
    def analyze_opportunities(self):
        """Run complete opportunity analysis"""
        print("=== Enhanced Ground Station Opportunity Analysis ===")
        print("Generating comprehensive analysis grid...")
        
        # Generate grid with all data
        self.analysis_grid = self.generate_analysis_grid()
        print(f"Generated {len(self.analysis_grid)} analysis points")
        
        # Calculate all scores
        print("Calculating opportunity scores...")
        self.analysis_grid = self.calculate_overall_scores(self.analysis_grid)
        
        # Find top opportunities
        top_opportunities = sorted(
            self.analysis_grid, 
            key=lambda x: x['overall_opportunity_score'], 
            reverse=True
        )[:20]
        
        print("\n=== TOP 20 INVESTMENT OPPORTUNITIES ===")
        for i, opp in enumerate(top_opportunities, 1):
            print(f"\n{i}. Location: {opp['longitude']:.1f}, {opp['latitude']:.1f}")
            print(f"   Overall Score: {opp['overall_opportunity_score']:.1f}")
            print(f"   Weather Score: {opp['weather_score']:.1f}")
            print(f"   Infrastructure: {opp['infrastructure_score']:.1f}")
            print(f"   Demand Score: {opp['demand_score']:.1f}")
            print(f"   Competition: {opp['competition_score']:.1f}")
            print(f"   Regulatory: {opp['regulatory_score']:.1f}")
            print(f"   Terrain: {opp['terrain_type']}")
            print(f"   Population Density: {opp['population_density']:.0f}/km²")
            print(f"   Cloud Cover: {opp['avg_cloud_cover']:.1f}%")
        
        return self.analysis_grid
    
    def save_enhanced_data(self, output_file='data/enhanced_opportunities.json'):
        """Save enhanced analysis data"""
        output_path = Path(output_file)
        output_path.parent.mkdir(exist_ok=True)
        
        # Prepare data for JSON serialization
        json_data = {
            'type': 'enhanced_opportunity_analysis',
            'version': '2.0',
            'generated_at': datetime.now().isoformat(),
            'grid_resolution_degrees': self.grid_resolution,
            'total_points': len(self.analysis_grid),
            'analysis_points': self.analysis_grid
        }
        
        with open(output_path, 'w') as f:
            json.dump(json_data, f, indent=2)
        
        print(f"\nSaved enhanced analysis data to {output_path}")
        print(f"Total analysis points: {len(self.analysis_grid)}")
        
        # Also save top opportunities separately
        top_opportunities = sorted(
            self.analysis_grid,
            key=lambda x: x['overall_opportunity_score'],
            reverse=True
        )[:50]
        
        top_data = {
            'type': 'top_opportunities',
            'version': '2.0',
            'generated_at': datetime.now().isoformat(),
            'top_opportunities': top_opportunities
        }
        
        top_file = output_path.parent / 'top_opportunities.json'
        with open(top_file, 'w') as f:
            json.dump(top_data, f, indent=2)
        
        print(f"Saved top 50 opportunities to {top_file}")

def main():
    analyzer = EnhancedOpportunityAnalyzer()
    analysis_data = analyzer.analyze_opportunities()
    analyzer.save_enhanced_data()

if __name__ == "__main__":
    main()