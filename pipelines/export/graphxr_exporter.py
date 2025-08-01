"""
GraphXR Export Module for Ground Station Intelligence
Generates graph data in GraphXR-compatible format
"""

import json
import duckdb
import pandas as pd
import numpy as np
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class GraphXRExporter:
    def __init__(self, conn=None):
        self.conn = conn or duckdb.connect('data/ground_stations.db')
        self.nodes = []
        self.edges = []
        self.node_id_map = {}
        
    def generate_ground_station_nodes(self):
        """Generate ground station nodes with all properties"""
        logger.info("Generating ground station nodes...")
        
        query = """
        SELECT 
            s.station_id,
            s.name,
            s.latitude,
            s.longitude,
            s.altitude,
            s.status,
            s.created,
            s.observations,
            i.utilization_score,
            i.reliability_score,
            i.weather_score,
            i.demand_score,
            i.competition_score,
            i.composite_score,
            i.investment_priority,
            u.avg_hourly_obs,
            u.overall_success_rate,
            nb.connected_regions,
            nb.bridge_value_usd
        FROM raw.satnogs_stations s
        LEFT JOIN enriched.investment_scores i ON s.station_id = i.station_id
        LEFT JOIN enriched.station_utilization_patterns u ON s.station_id = CAST(u.ground_station AS INTEGER)
        LEFT JOIN enriched.network_bridges nb ON s.station_id = nb.station_id
        WHERE s.status = 'Online'
        """
        
        stations = self.conn.execute(query).df()
        
        for _, station in stations.iterrows():
            node_id = str(uuid.uuid4())
            self.node_id_map[f"station_{station['station_id']}"] = node_id
            
            # Determine operator type based on characteristics
            if station['observations'] > 10000:
                operator_type = 'commercial'
            elif station['observations'] > 1000:
                operator_type = 'semi_commercial'
            else:
                operator_type = 'community'
            
            node = {
                "id": node_id,
                "label": "GroundStation",
                "properties": {
                    "station_id": str(station['station_id']),
                    "name": station['name'] or f"Station {station['station_id']}",
                    "latitude": float(station['latitude']) if pd.notna(station['latitude']) else 0.0,
                    "longitude": float(station['longitude']) if pd.notna(station['longitude']) else 0.0,
                    "altitude": float(station['altitude']) if pd.notna(station['altitude']) else 0.0,
                    "status": station['status'],
                    "operator_type": operator_type,
                    "created_date": str(station['created']) if pd.notna(station['created']) else "",
                    "total_observations": int(station['observations']) if pd.notna(station['observations']) else 0,
                    
                    # Investment metrics
                    "investment_score": float(station['composite_score']) if pd.notna(station['composite_score']) else 50.0,
                    "investment_priority": station['investment_priority'] if pd.notna(station['investment_priority']) else 'medium_priority',
                    "utilization_score": float(station['utilization_score']) if pd.notna(station['utilization_score']) else 50.0,
                    "reliability_score": float(station['reliability_score']) if pd.notna(station['reliability_score']) else 75.0,
                    "weather_score": float(station['weather_score']) if pd.notna(station['weather_score']) else 80.0,
                    "demand_score": float(station['demand_score']) if pd.notna(station['demand_score']) else 50.0,
                    "competition_score": float(station['competition_score']) if pd.notna(station['competition_score']) else 75.0,
                    
                    # Operational metrics
                    "avg_hourly_observations": float(station['avg_hourly_obs']) if pd.notna(station['avg_hourly_obs']) else 1.0,
                    "success_rate": float(station['overall_success_rate']) if pd.notna(station['overall_success_rate']) else 0.8,
                    "utilization_rate": min(100.0, float(station['avg_hourly_obs']) * 4.17) if pd.notna(station['avg_hourly_obs']) else 30.0,
                    
                    # Network value
                    "is_network_bridge": bool(pd.notna(station['connected_regions']) and station['connected_regions'] > 1),
                    "connected_regions": int(station['connected_regions']) if pd.notna(station['connected_regions']) else 0,
                    "bridge_value_usd": float(station['bridge_value_usd']) if pd.notna(station['bridge_value_usd']) else 0.0,
                    
                    # Display properties
                    "node_size": float(station['composite_score']) / 10 if pd.notna(station['composite_score']) else 5.0,
                    "node_color": self._get_priority_color(station['investment_priority'])
                }
            }
            
            self.nodes.append(node)
        
        logger.info(f"Generated {len(self.nodes)} ground station nodes")
    
    def generate_demand_region_nodes(self):
        """Generate demand region nodes"""
        logger.info("Generating demand region nodes...")
        
        # Get regions with enriched data
        query = """
        WITH region_stats AS (
            SELECT 
                r.region_id,
                r.name,
                r.center_lat,
                r.center_lon,
                r.population_density,
                COUNT(DISTINCT sl.station_id) as serving_stations,
                AVG(sl.distance_km) as avg_station_distance,
                MIN(sl.distance_km) as nearest_station_km
            FROM processed.demand_regions r
            LEFT JOIN processed.station_region_links sl ON r.region_id = sl.region_id
            GROUP BY r.region_id, r.name, r.center_lat, r.center_lon, r.population_density
        )
        SELECT 
            rs.*,
            -- Calculate connectivity gap (0-100)
            CASE 
                WHEN serving_stations = 0 THEN 100
                WHEN serving_stations = 1 AND nearest_station_km > 300 THEN 80
                WHEN serving_stations = 1 THEN 60
                WHEN serving_stations = 2 THEN 40
                ELSE 20
            END as connectivity_gap
        FROM region_stats rs
        """
        
        regions = self.conn.execute(query).df()
        
        for _, region in regions.iterrows():
            node_id = str(uuid.uuid4())
            self.node_id_map[f"region_{region['region_id']}"] = node_id
            
            # Estimate demand characteristics
            if 'singapore' in region['name'].lower() or 'tokyo' in region['name'].lower():
                enterprise_demand = 90
                maritime_score = 95
            elif 'new york' in region['name'].lower() or 'london' in region['name'].lower():
                enterprise_demand = 85
                maritime_score = 70
            elif 'mumbai' in region['name'].lower() or 'dubai' in region['name'].lower():
                enterprise_demand = 75
                maritime_score = 80
            else:
                enterprise_demand = 50
                maritime_score = 40
            
            node = {
                "id": node_id,
                "label": "DemandRegion",
                "properties": {
                    "region_id": region['region_id'],
                    "name": region['name'],
                    "center_lat": float(region['center_lat']),
                    "center_lon": float(region['center_lon']),
                    "population_density": float(region['population_density']) if pd.notna(region['population_density']) else 100.0,
                    "connectivity_gap": float(region['connectivity_gap']),
                    "serving_stations": int(region['serving_stations']),
                    "nearest_station_km": float(region['nearest_station_km']) if pd.notna(region['nearest_station_km']) else 1000.0,
                    "enterprise_demand_score": enterprise_demand,
                    "maritime_traffic_score": maritime_score,
                    "growth_potential": min(100, region['connectivity_gap'] * 0.7 + 30),
                    
                    # Display properties
                    "node_size": max(5.0, float(region['connectivity_gap']) / 10),
                    "node_color": self._get_demand_color(region['connectivity_gap'])
                }
            }
            
            self.nodes.append(node)
        
        logger.info(f"Generated {len(regions)} demand region nodes")
    
    def generate_weather_pattern_nodes(self):
        """Generate weather pattern nodes"""
        logger.info("Generating weather pattern nodes...")
        
        # Create synthetic weather patterns for POC
        weather_patterns = [
            {
                "pattern_id": "monsoon_asia",
                "name": "Asian Monsoon System",
                "pattern_type": "monsoon",
                "affected_region": "South and Southeast Asia",
                "severity": 8.5,
                "annual_frequency": 120,
                "seasonal_months": [6, 7, 8, 9],
                "impact_on_ku_band": 0.65,
                "impact_on_ka_band": 0.45
            },
            {
                "pattern_id": "atlantic_hurricanes",
                "name": "Atlantic Hurricane Belt",
                "pattern_type": "tropical_cyclone",
                "affected_region": "Caribbean and Eastern US",
                "severity": 9.0,
                "annual_frequency": 15,
                "seasonal_months": [8, 9, 10],
                "impact_on_ku_band": 0.80,
                "impact_on_ka_band": 0.60
            },
            {
                "pattern_id": "european_storms",
                "name": "North Atlantic Storm Track",
                "pattern_type": "extratropical_cyclone",
                "affected_region": "Northern Europe",
                "severity": 6.5,
                "annual_frequency": 30,
                "seasonal_months": [10, 11, 12, 1, 2],
                "impact_on_ku_band": 0.55,
                "impact_on_ka_band": 0.40
            }
        ]
        
        for pattern in weather_patterns:
            node_id = str(uuid.uuid4())
            self.node_id_map[f"weather_{pattern['pattern_id']}"] = node_id
            
            node = {
                "id": node_id,
                "label": "WeatherPattern",
                "properties": {
                    "pattern_id": pattern['pattern_id'],
                    "name": pattern['name'],
                    "pattern_type": pattern['pattern_type'],
                    "affected_region": pattern['affected_region'],
                    "severity": pattern['severity'],
                    "annual_frequency": pattern['annual_frequency'],
                    "seasonal_months": pattern['seasonal_months'],
                    "impact_on_ku_band": pattern['impact_on_ku_band'],
                    "impact_on_ka_band": pattern['impact_on_ka_band'],
                    
                    # Display properties
                    "node_size": pattern['severity'],
                    "node_color": "#FF6B6B"  # Red for weather hazards
                }
            }
            
            self.nodes.append(node)
        
        logger.info(f"Generated {len(weather_patterns)} weather pattern nodes")
    
    def generate_relationships(self):
        """Generate all relationship types"""
        logger.info("Generating relationships...")
        
        self._generate_serves_relationships()
        self._generate_competition_relationships()
        self._generate_bridge_relationships()
        self._generate_weather_relationships()
        
        logger.info(f"Generated total of {len(self.edges)} relationships")
    
    def _generate_serves_relationships(self):
        """Generate SERVES relationships between stations and regions"""
        
        serves_data = self.conn.execute("""
            SELECT 
                station_id,
                region_id,
                distance_km,
                coverage_quality,
                latency_ms
            FROM processed.station_region_links
            WHERE distance_km < 500  -- Only strong coverage for GraphXR
        """).df()
        
        for _, link in serves_data.iterrows():
            station_node_id = self.node_id_map.get(f"station_{link['station_id']}")
            region_node_id = self.node_id_map.get(f"region_{link['region_id']}")
            
            if station_node_id and region_node_id:
                edge = {
                    "id": str(uuid.uuid4()),
                    "source": station_node_id,
                    "target": region_node_id,
                    "label": "SERVES",
                    "properties": {
                        "coverage_quality": link['coverage_quality'],
                        "distance_km": float(link['distance_km']),
                        "latency_ms": float(link['latency_ms']),
                        "capacity_gbps": 10.0 if link['coverage_quality'] == 'excellent' else 5.0,
                        "edge_weight": 1.0 - (link['distance_km'] / 500.0),
                        "edge_color": self._get_coverage_color(link['coverage_quality'])
                    }
                }
                self.edges.append(edge)
    
    def _generate_competition_relationships(self):
        """Generate COMPETES_WITH relationships"""
        
        competition_data = self.conn.execute("""
            SELECT 
                station1_id,
                station2_id,
                distance_km,
                competition_level
            FROM processed.station_competition
            WHERE competition_level = 'high_competition'
            AND distance_km < 100
        """).df()
        
        for _, comp in competition_data.iterrows():
            station1_node_id = self.node_id_map.get(f"station_{comp['station1_id']}")
            station2_node_id = self.node_id_map.get(f"station_{comp['station2_id']}")
            
            if station1_node_id and station2_node_id:
                edge = {
                    "id": str(uuid.uuid4()),
                    "source": station1_node_id,
                    "target": station2_node_id,
                    "label": "COMPETES_WITH",
                    "properties": {
                        "distance_km": float(comp['distance_km']),
                        "competition_intensity": "high",
                        "market_overlap_pct": max(0, 100 - comp['distance_km']),
                        "edge_color": "#FFA500",  # Orange for competition
                        "edge_style": "dashed"
                    }
                }
                self.edges.append(edge)
    
    def _generate_bridge_relationships(self):
        """Generate BRIDGES_WITH relationships for network connections"""
        
        # Find potential bridge pairs
        bridge_query = """
        WITH bridge_pairs AS (
            SELECT 
                nb1.station_id as station1_id,
                nb2.station_id as station2_id,
                nb1.bridge_value_usd + nb2.bridge_value_usd as combined_value
            FROM enriched.network_bridges nb1
            CROSS JOIN enriched.network_bridges nb2
            WHERE nb1.station_id < nb2.station_id
            AND nb1.connected_regions > 1
            AND nb2.connected_regions > 1
        ),
        top_bridges AS (
            SELECT * FROM bridge_pairs
            ORDER BY combined_value DESC
            LIMIT 20
        )
        SELECT 
            station1_id,
            station2_id,
            combined_value,
            s1.latitude as lat1,
            s1.longitude as lon1,
            s2.latitude as lat2,
            s2.longitude as lon2
        FROM top_bridges
        JOIN raw.satnogs_stations s1 ON station1_id = s1.station_id
        JOIN raw.satnogs_stations s2 ON station2_id = s2.station_id
        """
        
        bridges = self.conn.execute(bridge_query).df()
        
        for _, bridge in bridges.iterrows():
            station1_node_id = self.node_id_map.get(f"station_{bridge['station1_id']}")
            station2_node_id = self.node_id_map.get(f"station_{bridge['station2_id']}")
            
            if station1_node_id and station2_node_id:
                # Calculate approximate distance
                lat_diff = bridge['lat1'] - bridge['lat2']
                lon_diff = bridge['lon1'] - bridge['lon2']
                approx_distance = np.sqrt(lat_diff**2 + lon_diff**2) * 111
                
                edge = {
                    "id": str(uuid.uuid4()),
                    "source": station1_node_id,
                    "target": station2_node_id,
                    "label": "BRIDGES_WITH",
                    "properties": {
                        "bridge_type": "network",
                        "value_usd_annual": float(bridge['combined_value']),
                        "criticality_score": min(100, bridge['combined_value'] / 100000),
                        "distance_km": float(approx_distance),
                        "edge_color": "#4ECDC4",  # Teal for bridges
                        "edge_weight": 2.0  # Thicker lines for important bridges
                    }
                }
                self.edges.append(edge)
    
    def _generate_weather_relationships(self):
        """Generate AFFECTED_BY relationships to weather patterns"""
        
        # Simple geographic assignment for POC
        weather_assignments = {
            "monsoon_asia": {"min_lat": -10, "max_lat": 30, "min_lon": 60, "max_lon": 150},
            "atlantic_hurricanes": {"min_lat": 10, "max_lat": 45, "min_lon": -100, "max_lon": -50},
            "european_storms": {"min_lat": 45, "max_lat": 70, "min_lon": -20, "max_lon": 40}
        }
        
        stations = self.conn.execute("""
            SELECT station_id, latitude, longitude
            FROM raw.satnogs_stations
            WHERE status = 'Online'
        """).df()
        
        for pattern_id, bounds in weather_assignments.items():
            affected_stations = stations[
                (stations['latitude'] >= bounds['min_lat']) &
                (stations['latitude'] <= bounds['max_lat']) &
                (stations['longitude'] >= bounds['min_lon']) &
                (stations['longitude'] <= bounds['max_lon'])
            ]
            
            weather_node_id = self.node_id_map.get(f"weather_{pattern_id}")
            
            for _, station in affected_stations.iterrows():
                station_node_id = self.node_id_map.get(f"station_{station['station_id']}")
                
                if station_node_id and weather_node_id:
                    # Calculate impact based on location within bounds
                    lat_factor = 1 - abs(station['latitude'] - (bounds['min_lat'] + bounds['max_lat'])/2) / ((bounds['max_lat'] - bounds['min_lat'])/2)
                    
                    edge = {
                        "id": str(uuid.uuid4()),
                        "source": station_node_id,
                        "target": weather_node_id,
                        "label": "AFFECTED_BY",
                        "properties": {
                            "impact_severity": round(lat_factor * 8, 1),
                            "annual_downtime_hours": int(lat_factor * 300),
                            "mitigation_cost_usd": int(lat_factor * 500000),
                            "requires_redundancy": lat_factor > 0.7,
                            "edge_color": "#FF6B6B",  # Red for weather impact
                            "edge_style": "dotted"
                        }
                    }
                    self.edges.append(edge)
    
    def _get_priority_color(self, priority):
        """Get color based on investment priority"""
        colors = {
            'high_priority': '#2ECC71',  # Green
            'medium_priority': '#F39C12',  # Orange
            'low_priority': '#E74C3C'  # Red
        }
        return colors.get(priority, '#95A5A6')  # Default gray
    
    def _get_demand_color(self, connectivity_gap):
        """Get color based on connectivity gap"""
        if connectivity_gap > 80:
            return '#E74C3C'  # Red - high gap
        elif connectivity_gap > 50:
            return '#F39C12'  # Orange - medium gap
        else:
            return '#2ECC71'  # Green - low gap
    
    def _get_coverage_color(self, quality):
        """Get color based on coverage quality"""
        colors = {
            'excellent': '#2ECC71',  # Green
            'good': '#3498DB',  # Blue
            'fair': '#F39C12',  # Orange
            'poor': '#E74C3C'  # Red
        }
        return colors.get(quality, '#95A5A6')
    
    def export_to_graphxr(self, output_file="data/graphxr_export.json"):
        """Export the complete graph in GraphXR format"""
        
        graph_data = {
            "metadata": {
                "title": "Ground Station Investment Intelligence",
                "description": "Network graph showing ground station infrastructure, demand regions, and investment opportunities",
                "created": datetime.now().isoformat(),
                "node_count": len(self.nodes),
                "edge_count": len(self.edges),
                "schema_version": "1.0"
            },
            "nodes": self.nodes,
            "edges": self.edges,
            "layout": {
                "type": "geo",
                "lat_property": "latitude",
                "lon_property": "longitude"
            },
            "display": {
                "node_size_property": "node_size",
                "node_color_property": "node_color",
                "edge_weight_property": "edge_weight",
                "edge_color_property": "edge_color"
            }
        }
        
        with open(output_file, 'w') as f:
            json.dump(graph_data, f, indent=2)
        
        logger.info(f"Exported graph to {output_file}")
        
        # Also create a smaller sample for testing
        sample_data = {
            "metadata": graph_data["metadata"],
            "nodes": self.nodes[:50],  # First 50 nodes
            "edges": [e for e in self.edges if e['source'] in [n['id'] for n in self.nodes[:50]] and e['target'] in [n['id'] for n in self.nodes[:50]]],
            "layout": graph_data["layout"],
            "display": graph_data["display"]
        }
        
        sample_file = output_file.replace('.json', '_sample.json')
        with open(sample_file, 'w') as f:
            json.dump(sample_data, f, indent=2)
        
        logger.info(f"Exported sample graph to {sample_file}")
        
        return graph_data