#!/usr/bin/env python3
"""
Enhance the GraphXR export with all collected data sources
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def enhance_graph_export():
    """Enhance the existing GraphXR export with new data sources"""
    logger.info("Enhancing GraphXR export with comprehensive data...")
    
    # Load existing graph
    with open('data/graphxr_export.json', 'r') as f:
        graph_data = json.load(f)
    
    # Load enhanced data sources
    try:
        fiber_connectivity = pd.read_parquet('data/raw/fiber_connectivity_index.parquet')
        power_reliability = pd.read_parquet('data/raw/power_reliability_scores.parquet')
        political_stability = pd.read_parquet('data/raw/political_stability_index.parquet')
        rain_fade = pd.read_parquet('data/raw/rain_fade_recommendations.parquet')
        spectrum_data = pd.read_parquet('data/raw/itu_spectrum_allocations.parquet')
        lease_rates = pd.read_parquet('data/raw/ground_station_lease_rates.parquet')
        gcat_satellites = pd.read_parquet('data/raw/gcat_satellites_simplified.parquet')
        geo_satellites = pd.read_parquet('data/raw/geosync_satellites_processed.parquet')
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        return
    
    # Enhance ground station nodes
    enhanced_nodes = []
    
    for node in graph_data['nodes']:
        if node.get('label') == 'GroundStation':
            # Extract country from node data or infer from name
            props = node.get('properties', {})
            country = props.get('country', '')
            
            # If no country, try to infer from name
            if not country:
                name = props.get('name', '')
                if 'New York' in name or 'USA' in name:
                    country = 'USA'
                elif 'London' in name or 'UK' in name:
                    country = 'UK'
                elif 'Singapore' in name:
                    country = 'Singapore'
                elif 'São Paulo' in name or 'Brazil' in name:
                    country = 'Brazil'
                elif 'Tokyo' in name or 'Japan' in name:
                    country = 'Japan'
                elif 'Mumbai' in name or 'India' in name:
                    country = 'India'
                elif 'Sydney' in name or 'Australia' in name:
                    country = 'Australia'
                elif 'Berlin' in name or 'Germany' in name:
                    country = 'Germany'
                elif 'Paris' in name or 'France' in name:
                    country = 'France'
                elif 'Dubai' in name or 'UAE' in name:
                    country = 'UAE'
                else:
                    country = 'Unknown'
            
            lat = props.get('latitude', 0)
            lon = props.get('longitude', 0)
            
            # Add fiber connectivity score
            fiber_match = fiber_connectivity[
                fiber_connectivity['country'].str.contains(country, case=False, na=False)
            ]
            if len(fiber_match) > 0:
                node['properties']['fiber_score'] = int(fiber_match.iloc[0]['fiber_connectivity_score'])
                node['properties']['has_ix'] = bool(fiber_match.iloc[0]['ix_count'] > 0)
            else:
                node['properties']['fiber_score'] = 0
                node['properties']['has_ix'] = False
            
            # Add power reliability
            power_match = power_reliability[power_reliability['country'] == country]
            if len(power_match) > 0:
                node['properties']['power_reliability_score'] = float(power_match.iloc[0]['power_reliability_score'])
            else:
                node['properties']['power_reliability_score'] = 50.0
            
            # Add political stability
            stability_match = political_stability[political_stability['country'] == country]
            if len(stability_match) > 0:
                node['properties']['political_stability_score'] = float(stability_match.iloc[0]['political_stability_score'])
                node['properties']['political_risk'] = stability_match.iloc[0]['political_risk']
            else:
                node['properties']['political_stability_score'] = 50.0
                node['properties']['political_risk'] = 'medium'
            
            # Add rain fade risk
            if len(rain_fade) > 0:
                # Find closest location
                distances = np.sqrt((rain_fade['latitude'] - lat)**2 + (rain_fade['longitude'] - lon)**2)
                closest_idx = distances.argmin()
                closest_rain = rain_fade.iloc[closest_idx]
                node['properties']['rain_fade_risk'] = closest_rain['rain_fade_risk']
                node['properties']['recommended_band'] = closest_rain['recommended_primary_band']
            else:
                node['properties']['rain_fade_risk'] = 'medium'
                node['properties']['recommended_band'] = 'Ku-band'
            
            # Add spectrum availability
            spectrum_match = spectrum_data[
                (spectrum_data['country_code'] == country) & 
                (spectrum_data['band_name'] == node['properties'].get('recommended_band', 'Ku-band'))
            ]
            if len(spectrum_match) > 0:
                node['properties']['spectrum_available'] = spectrum_match.iloc[0]['availability'] == 'available'
                node['properties']['regulatory_complexity'] = spectrum_match.iloc[0]['regulatory_complexity']
            else:
                node['properties']['spectrum_available'] = True
                node['properties']['regulatory_complexity'] = 'medium'
            
            # Calculate enhanced investment score
            base_score = node['properties'].get('composite_score', 50)
            enhanced_score = (
                base_score * 0.3 +
                node['properties']['fiber_score'] * 0.2 +
                node['properties']['power_reliability_score'] * 0.15 +
                node['properties']['political_stability_score'] * 0.15 +
                (100 if node['properties']['spectrum_available'] else 50) * 0.1 +
                (100 - {'low': 0, 'medium': 25, 'high': 50, 'very high': 75}[node['properties']['rain_fade_risk']]) * 0.1
            )
            node['properties']['enhanced_investment_score'] = round(enhanced_score, 2)
            
            # Investment category
            if enhanced_score >= 80:
                node['properties']['investment_recommendation'] = 'excellent'
            elif enhanced_score >= 65:
                node['properties']['investment_recommendation'] = 'good'
            elif enhanced_score >= 50:
                node['properties']['investment_recommendation'] = 'moderate'
            else:
                node['properties']['investment_recommendation'] = 'poor'
        
        enhanced_nodes.append(node)
    
    # Add satellite constellation nodes
    logger.info("Adding satellite constellation nodes...")
    
    # Major constellations
    major_constellations = gcat_satellites[gcat_satellites['constellation'].notna()].groupby('constellation').agg({
        'gcat_id': 'count',
        'orbit_type': 'first'
    }).reset_index()
    major_constellations = major_constellations[major_constellations['gcat_id'] >= 50]
    
    for _, const in major_constellations.iterrows():
        enhanced_nodes.append({
            'id': f"constellation_{const['constellation'].replace(' ', '_').replace('-', '_')}",
            'label': 'SatelliteConstellation',
            'properties': {
                'name': const['constellation'],
                'satellite_count': int(const['gcat_id']),
                'orbit_type': const['orbit_type'],
                'avg_altitude_km': 550 if const['orbit_type'] == 'LEO' else 20200 if const['orbit_type'] == 'MEO' else 35786,
                'constellation_type': 'mega' if const['gcat_id'] > 1000 else 'large'
            }
        })
    
    # Add major GEO operators
    geo_operators = geo_satellites['COUNTRY'].value_counts().head(10)
    for country, count in geo_operators.items():
        enhanced_nodes.append({
            'id': f"geo_operator_{country.replace(' ', '_')}",
            'label': 'GEOOperator',
            'properties': {
                'country': country,
                'satellite_count': int(count),
                'coverage_type': 'regional' if count < 20 else 'global'
            }
        })
    
    # Add fiber hub nodes
    logger.info("Adding fiber infrastructure nodes...")
    
    top_fiber_hubs = fiber_connectivity.nlargest(15, 'fiber_connectivity_score')
    for _, hub in top_fiber_hubs.iterrows():
        enhanced_nodes.append({
            'id': f"fiber_hub_{hub['location_key'].replace(' ', '_').replace(',', '').replace('.', '')}",
            'label': 'FiberHub',
            'properties': {
                'name': hub['location_key'],
                'city': hub['city'],
                'country': hub['country'],
                'fiber_score': int(hub['fiber_connectivity_score']),
                'ix_count': int(hub['ix_count']),
                'facility_count': int(hub['facility_count']),
                'datacenter_count': int(hub['datacenter_count']),
                'connectivity_class': 'tier1' if hub['fiber_connectivity_score'] > 400 else 'tier2'
            }
        })
    
    # Create new relationships
    enhanced_edges = []
    
    # Copy existing edges and ensure they have type field
    for edge in graph_data['edges']:
        if 'relationship' in edge:
            edge['type'] = edge['relationship']
        elif 'label' in edge:
            edge['type'] = edge['label']
        elif not edge.get('type'):
            # Infer type from context
            edge['type'] = 'RELATES_TO'
        enhanced_edges.append(edge)
    
    # Connect ground stations to fiber hubs
    for node in enhanced_nodes:
        if node.get('label') == 'GroundStation':
            station_country = node['properties'].get('country', '')
            
            # Find fiber hubs in same country
            for hub_node in enhanced_nodes:
                if hub_node.get('label') == 'FiberHub' and hub_node['properties'].get('country', '') == station_country:
                    enhanced_edges.append({
                        'source': node['id'],
                        'target': hub_node['id'],
                        'type': 'CONNECTS_TO_FIBER',
                        'properties': {
                            'connection_quality': 'excellent' if hub_node['properties']['fiber_score'] > 300 else 'good'
                        }
                    })
    
    # Connect ground stations to satellite constellations
    for node in enhanced_nodes:
        if node.get('label') == 'GroundStation':
            band = node['properties'].get('recommended_band', 'Ku-band')
            
            # LEO constellations need Ku/Ka band
            if 'Ku' in band or 'Ka' in band:
                for const_node in enhanced_nodes:
                    if const_node.get('label') == 'SatelliteConstellation' and const_node['properties']['orbit_type'] == 'LEO':
                        enhanced_edges.append({
                            'source': node['id'],
                            'target': const_node['id'],
                            'type': 'CAN_SUPPORT',
                            'properties': {
                                'band_compatibility': band,
                                'tracking_required': True
                            }
                        })
    
    # Create enhanced export
    enhanced_graph = {
        'nodes': enhanced_nodes,
        'edges': enhanced_edges,
        'metadata': {
            'generated': datetime.now().isoformat(),
            'version': '2.0_enhanced',
            'total_nodes': len(enhanced_nodes),
            'total_edges': len(enhanced_edges),
            'node_types': {},
            'enhancements': [
                'fiber_connectivity',
                'power_reliability',
                'political_stability',
                'rain_fade_analysis',
                'spectrum_availability',
                'satellite_constellations',
                'investment_scoring'
            ]
        }
    }
    
    # Count node types
    for node in enhanced_nodes:
        node_type = node.get('label', 'Unknown')
        enhanced_graph['metadata']['node_types'][node_type] = enhanced_graph['metadata']['node_types'].get(node_type, 0) + 1
    
    # Save enhanced graph
    with open('data/enhanced_graphxr_export.json', 'w') as f:
        json.dump(enhanced_graph, f, indent=2)
    
    # Create analysis summary
    ground_stations = [n for n in enhanced_nodes if n.get('label') == 'GroundStation']
    
    summary = {
        'enhancement_date': datetime.now().isoformat(),
        'statistics': {
            'total_nodes': len(enhanced_nodes),
            'total_edges': len(enhanced_edges),
            'ground_stations': len(ground_stations),
            'satellite_constellations': len([n for n in enhanced_nodes if n.get('label') == 'SatelliteConstellation']),
            'fiber_hubs': len([n for n in enhanced_nodes if n.get('label') == 'FiberHub']),
            'geo_operators': len([n for n in enhanced_nodes if n.get('label') == 'GEOOperator'])
        },
        'investment_distribution': {},
        'top_investment_sites': [],
        'risk_analysis': {
            'political_risk': {'low': 0, 'medium': 0, 'high': 0, 'very_high': 0},
            'rain_fade_risk': {'low': 0, 'medium': 0, 'high': 0, 'very_high': 0}
        }
    }
    
    # Analyze investment recommendations
    for station in ground_stations:
        rec = station['properties'].get('investment_recommendation', 'unknown')
        summary['investment_distribution'][rec] = summary['investment_distribution'].get(rec, 0) + 1
        
        # Track risks
        pol_risk = station['properties'].get('political_risk', 'medium')
        rain_risk = station['properties'].get('rain_fade_risk', 'medium')
        
        if pol_risk in summary['risk_analysis']['political_risk']:
            summary['risk_analysis']['political_risk'][pol_risk] += 1
        if rain_risk in summary['risk_analysis']['rain_fade_risk']:
            summary['risk_analysis']['rain_fade_risk'][rain_risk] += 1
    
    # Get top investment sites
    sorted_stations = sorted(ground_stations, 
                           key=lambda x: x['properties'].get('enhanced_investment_score', 0), 
                           reverse=True)
    
    for station in sorted_stations[:10]:
        summary['top_investment_sites'].append({
            'name': station['properties'].get('name', 'Unknown'),
            'score': station['properties'].get('enhanced_investment_score', 0),
            'recommendation': station['properties'].get('investment_recommendation', 'unknown'),
            'country': station['properties'].get('country', 'Unknown'),
            'fiber_score': station['properties'].get('fiber_score', 0),
            'political_stability': station['properties'].get('political_stability_score', 0)
        })
    
    with open('data/enhancement_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    logger.info(f"✅ Enhanced graph exported with {len(enhanced_nodes)} nodes and {len(enhanced_edges)} edges")
    logger.info("Files created:")
    logger.info("  - data/enhanced_graphxr_export.json")
    logger.info("  - data/enhancement_summary.json")
    
    return enhanced_graph

if __name__ == "__main__":
    enhance_graph_export()