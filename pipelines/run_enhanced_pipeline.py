#!/usr/bin/env python3
"""
Enhanced Ground Station Investment Intelligence Pipeline
Integrates all collected data sources for comprehensive analysis
"""

import sys
import logging
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime
import json

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from pipelines.data_pipeline import DataPipeline
from pipelines.enrichment_pipeline import EnrichmentPipeline
from pipelines.graph_exporter import GraphExporter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EnhancedPipeline:
    """Enhanced pipeline with all new data sources"""
    
    def __init__(self):
        self.data_pipeline = DataPipeline()
        self.enrichment_pipeline = EnrichmentPipeline()
        self.graph_exporter = GraphExporter()
        
    def load_enhanced_data(self):
        """Load all enhanced data sources"""
        logger.info("Loading enhanced data sources...")
        
        # Load base data
        self.data_pipeline.run()
        
        # Load additional data sources
        enhanced_data = {
            'fiber_connectivity': pd.read_parquet('data/raw/fiber_connectivity_index.parquet'),
            'power_reliability': pd.read_parquet('data/raw/power_reliability_scores.parquet'),
            'seismic_risk': pd.read_parquet('data/raw/seismic_risk_zones.parquet'),
            'political_stability': pd.read_parquet('data/raw/political_stability_index.parquet'),
            'rain_fade': pd.read_parquet('data/raw/rain_fade_recommendations.parquet'),
            'spectrum_allocations': pd.read_parquet('data/raw/itu_spectrum_allocations.parquet'),
            'earth_station_regs': pd.read_parquet('data/raw/itu_earth_station_regulations.parquet'),
            'interference_zones': pd.read_parquet('data/raw/itu_interference_zones.parquet'),
            'lease_rates': pd.read_parquet('data/raw/ground_station_lease_rates.parquet'),
            'bandwidth_pricing': pd.read_parquet('data/raw/bandwidth_pricing.parquet'),
            'operator_requirements': pd.read_parquet('data/raw/satellite_operator_requirements.parquet'),
            'equipment_costs': pd.read_parquet('data/raw/ground_station_equipment_costs.parquet'),
            'gcat_satellites': pd.read_parquet('data/raw/gcat_satellites_simplified.parquet'),
            'geo_satellites': pd.read_parquet('data/raw/geosync_satellites_processed.parquet')
        }
        
        logger.info(f"Loaded {len(enhanced_data)} enhanced data sources")
        return enhanced_data
    
    def enhance_ground_stations(self, enhanced_data):
        """Enhance ground station data with all new sources"""
        logger.info("Enhancing ground station data...")
        
        # Get base ground stations
        stations_df = pd.read_sql(
            "SELECT * FROM enriched.ground_stations",
            self.data_pipeline.engine
        )
        
        # Match fiber connectivity
        for idx, station in stations_df.iterrows():
            # Find nearest fiber hub
            station_city = f"{station.get('city', 'Unknown')}, {station.get('country', 'Unknown')}"
            fiber_match = enhanced_data['fiber_connectivity'][
                enhanced_data['fiber_connectivity']['location_key'].str.contains(
                    station.get('country', ''), case=False, na=False
                )
            ]
            
            if len(fiber_match) > 0:
                best_fiber = fiber_match.iloc[0]
                stations_df.loc[idx, 'fiber_score'] = best_fiber['fiber_connectivity_score']
                stations_df.loc[idx, 'has_ix'] = best_fiber['ix_count'] > 0
                stations_df.loc[idx, 'datacenter_nearby'] = best_fiber['datacenter_count'] > 0
            else:
                stations_df.loc[idx, 'fiber_score'] = 0
                stations_df.loc[idx, 'has_ix'] = False
                stations_df.loc[idx, 'datacenter_nearby'] = False
        
        # Match power reliability
        power_match = enhanced_data['power_reliability'][
            enhanced_data['power_reliability']['country'].isin(stations_df['country'].unique())
        ]
        power_dict = dict(zip(power_match['country'], power_match['power_reliability_score']))
        stations_df['power_reliability_score'] = stations_df['country'].map(power_dict).fillna(50)
        
        # Match political stability
        stability_match = enhanced_data['political_stability'][
            enhanced_data['political_stability']['country'].isin(stations_df['country'].unique())
        ]
        stability_dict = dict(zip(stability_match['country'], stability_match['political_stability_score']))
        stations_df['political_stability_score'] = stations_df['country'].map(stability_dict).fillna(50)
        
        # Match seismic risk
        for idx, station in stations_df.iterrows():
            lat, lon = station['latitude'], station['longitude']
            lat_grid = (lat // 10) * 10
            lon_grid = (lon // 10) * 10
            
            seismic = enhanced_data['seismic_risk'][
                (enhanced_data['seismic_risk']['lat_grid'] == lat_grid) &
                (enhanced_data['seismic_risk']['lon_grid'] == lon_grid)
            ]
            
            if len(seismic) > 0:
                stations_df.loc[idx, 'seismic_safety_score'] = seismic.iloc[0]['seismic_safety_score']
            else:
                stations_df.loc[idx, 'seismic_safety_score'] = 80  # Default safe
        
        # Match rain fade risk
        for idx, station in stations_df.iterrows():
            lat, lon = station['latitude'], station['longitude']
            # Find closest rain fade assessment
            rain_fade = enhanced_data['rain_fade']
            if len(rain_fade) > 0:
                distances = np.sqrt(
                    (rain_fade['latitude'] - lat)**2 + 
                    (rain_fade['longitude'] - lon)**2
                )
                closest = rain_fade.iloc[distances.argmin()]
                stations_df.loc[idx, 'rain_fade_risk'] = closest['rain_fade_risk']
                stations_df.loc[idx, 'recommended_band'] = closest['recommended_primary_band']
            else:
                stations_df.loc[idx, 'rain_fade_risk'] = 'medium'
                stations_df.loc[idx, 'recommended_band'] = 'Ku-band'
        
        # Calculate enhanced composite score
        stations_df['enhanced_score'] = (
            stations_df['composite_score'] * 0.3 +  # Original score
            stations_df['fiber_score'] * 0.2 +      # Fiber connectivity
            stations_df['power_reliability_score'] * 0.15 +
            stations_df['political_stability_score'] * 0.15 +
            stations_df['seismic_safety_score'] * 0.1 +
            (100 - stations_df['rain_fade_risk'].map({'low': 0, 'medium': 25, 'high': 50, 'very high': 75}).fillna(25)) * 0.1
        )
        
        # Investment category
        stations_df['investment_category'] = pd.cut(
            stations_df['enhanced_score'],
            bins=[0, 40, 60, 80, 100],
            labels=['avoid', 'consider', 'good', 'excellent']
        )
        
        # Save enhanced stations
        stations_df.to_sql('enhanced_ground_stations', self.data_pipeline.engine, 
                          schema='enriched', if_exists='replace', index=False)
        
        logger.info(f"Enhanced {len(stations_df)} ground stations with comprehensive scoring")
        return stations_df
    
    def create_market_opportunities(self, enhanced_data, stations_df):
        """Create market opportunity analysis"""
        logger.info("Creating market opportunity analysis...")
        
        opportunities = []
        
        # Analyze by country/region
        countries = stations_df.groupby('country').agg({
            'enhanced_score': 'mean',
            'station_id': 'count',
            'fiber_score': 'mean',
            'political_stability_score': 'first'
        }).reset_index()
        
        for _, country in countries.iterrows():
            # Get lease rates for this country
            lease_match = enhanced_data['lease_rates'][
                enhanced_data['lease_rates']['location'].str.contains(
                    country['country'], case=False, na=False
                )
            ]
            
            if len(lease_match) > 0:
                avg_lease = lease_match['annual_lease_usd'].mean()
            else:
                avg_lease = 150000  # Default
            
            # Calculate opportunity score
            opportunity_score = (
                country['enhanced_score'] * 0.4 +
                (100 - avg_lease/5000) * 0.3 +  # Lower cost = better
                country['fiber_score'] * 0.3
            )
            
            opportunities.append({
                'country': country['country'],
                'opportunity_score': opportunity_score,
                'existing_stations': country['station_id'],
                'avg_station_score': country['enhanced_score'],
                'avg_annual_lease': avg_lease,
                'political_stability': country['political_stability_score'],
                'market_maturity': 'mature' if country['station_id'] > 5 else 'emerging'
            })
        
        opportunities_df = pd.DataFrame(opportunities)
        opportunities_df = opportunities_df.sort_values('opportunity_score', ascending=False)
        
        # Save opportunities
        opportunities_df.to_sql('market_opportunities', self.data_pipeline.engine,
                               schema='enriched', if_exists='replace', index=False)
        
        logger.info(f"Identified {len(opportunities_df)} market opportunities")
        return opportunities_df
    
    def export_enhanced_graph(self, stations_df, enhanced_data):
        """Export enhanced graph for Kineviz"""
        logger.info("Exporting enhanced graph...")
        
        # Create nodes
        nodes = []
        
        # Ground station nodes with all attributes
        for _, station in stations_df.iterrows():
            nodes.append({
                'id': f"station_{station['station_id']}",
                'type': 'GroundStation',
                'name': station['name'],
                'latitude': station['latitude'],
                'longitude': station['longitude'],
                'country': station['country'],
                'enhanced_score': round(station['enhanced_score'], 2),
                'investment_category': station['investment_category'],
                'fiber_score': round(station.get('fiber_score', 0), 2),
                'power_reliability': round(station.get('power_reliability_score', 50), 2),
                'political_stability': round(station.get('political_stability_score', 50), 2),
                'seismic_safety': round(station.get('seismic_safety_score', 80), 2),
                'rain_fade_risk': station.get('rain_fade_risk', 'medium'),
                'recommended_band': station.get('recommended_band', 'Ku-band'),
                'has_ix': station.get('has_ix', False),
                'datacenter_nearby': station.get('datacenter_nearby', False)
            })
        
        # Add satellite constellation nodes
        major_constellations = enhanced_data['gcat_satellites'].groupby('operator').agg({
            'catalog_number': 'count',
            'orbit_type': 'first'
        }).reset_index()
        major_constellations = major_constellations[major_constellations['catalog_number'] > 10]
        
        for _, constellation in major_constellations.iterrows():
            nodes.append({
                'id': f"constellation_{constellation['operator'].replace(' ', '_')}",
                'type': 'SatelliteConstellation',
                'name': constellation['operator'],
                'satellite_count': int(constellation['catalog_number']),
                'orbit_type': constellation['orbit_type']
            })
        
        # Add fiber hub nodes
        top_fiber_hubs = enhanced_data['fiber_connectivity'].nlargest(20, 'fiber_connectivity_score')
        
        for _, hub in top_fiber_hubs.iterrows():
            nodes.append({
                'id': f"fiber_hub_{hub['location_key'].replace(' ', '_').replace(',', '')}",
                'type': 'FiberHub',
                'name': hub['location_key'],
                'fiber_score': int(hub['fiber_connectivity_score']),
                'ix_count': int(hub['ix_count']),
                'facility_count': int(hub['facility_count']),
                'datacenter_count': int(hub['datacenter_count']),
                'has_landing_points': hub['landing_points'] > 0
            })
        
        # Create relationships
        edges = []
        
        # Connect stations to nearby fiber hubs
        for _, station in stations_df.iterrows():
            # Find fiber hubs in same country
            country_hubs = top_fiber_hubs[
                top_fiber_hubs['location_key'].str.contains(
                    station['country'], case=False, na=False
                )
            ]
            
            for _, hub in country_hubs.iterrows():
                edges.append({
                    'source': f"station_{station['station_id']}",
                    'target': f"fiber_hub_{hub['location_key'].replace(' ', '_').replace(',', '')}",
                    'type': 'NEAR_FIBER_HUB',
                    'properties': {
                        'distance_estimate': 'same_country'
                    }
                })
        
        # Connect stations to satellite constellations based on capabilities
        for _, station in stations_df.iterrows():
            # LEO capable stations
            if station.get('recommended_band') in ['Ku-band', 'Ka-band']:
                for _, constellation in major_constellations[
                    major_constellations['orbit_type'] == 'LEO'
                ].iterrows():
                    if constellation['catalog_number'] > 100:  # Major LEO
                        edges.append({
                            'source': f"station_{station['station_id']}",
                            'target': f"constellation_{constellation['operator'].replace(' ', '_')}",
                            'type': 'CAN_SERVE',
                            'properties': {
                                'capability': 'LEO_tracking'
                            }
                        })
        
        # Export to GraphXR format
        graph_data = {
            'nodes': nodes,
            'edges': edges,
            'metadata': {
                'generated': datetime.now().isoformat(),
                'total_stations': len(stations_df),
                'total_nodes': len(nodes),
                'total_edges': len(edges),
                'data_sources': list(enhanced_data.keys())
            }
        }
        
        # Save full and sample versions
        with open('data/enhanced_graphxr_export.json', 'w') as f:
            json.dump(graph_data, f, indent=2)
        
        # Create sample for testing
        sample_nodes = nodes[:100]
        sample_edges = [e for e in edges if 
                       e['source'] in [n['id'] for n in sample_nodes] and
                       e['target'] in [n['id'] for n in sample_nodes]]
        
        sample_data = {
            'nodes': sample_nodes,
            'edges': sample_edges,
            'metadata': graph_data['metadata']
        }
        
        with open('data/enhanced_graphxr_sample.json', 'w') as f:
            json.dump(sample_data, f, indent=2)
        
        logger.info(f"Exported enhanced graph with {len(nodes)} nodes and {len(edges)} edges")
        return graph_data
    
    def run(self):
        """Run the enhanced pipeline"""
        logger.info("="*60)
        logger.info("Starting Enhanced Ground Station Intelligence Pipeline")
        logger.info("="*60)
        
        start_time = datetime.now()
        
        try:
            # Load all data
            enhanced_data = self.load_enhanced_data()
            
            # Enhance ground stations
            stations_df = self.enhance_ground_stations(enhanced_data)
            
            # Create market opportunities
            opportunities_df = self.create_market_opportunities(enhanced_data, stations_df)
            
            # Export enhanced graph
            graph_data = self.export_enhanced_graph(stations_df, enhanced_data)
            
            # Generate summary
            summary = {
                'pipeline_run': datetime.now().isoformat(),
                'duration_seconds': (datetime.now() - start_time).total_seconds(),
                'stations_analyzed': len(stations_df),
                'data_sources_integrated': len(enhanced_data),
                'investment_categories': stations_df['investment_category'].value_counts().to_dict(),
                'top_opportunities': opportunities_df.head(10)[
                    ['country', 'opportunity_score', 'market_maturity']
                ].to_dict('records'),
                'graph_statistics': {
                    'nodes': len(graph_data['nodes']),
                    'edges': len(graph_data['edges']),
                    'node_types': pd.DataFrame(graph_data['nodes'])['type'].value_counts().to_dict()
                }
            }
            
            with open('data/enhanced_pipeline_summary.json', 'w') as f:
                json.dump(summary, f, indent=2)
            
            logger.info("="*60)
            logger.info("Enhanced Pipeline completed successfully!")
            logger.info(f"Duration: {summary['duration_seconds']:.1f} seconds")
            logger.info(f"Output files:")
            logger.info("  - data/enhanced_graphxr_export.json")
            logger.info("  - data/enhanced_graphxr_sample.json")
            logger.info("  - data/enhanced_pipeline_summary.json")
            logger.info("="*60)
            
            return True
            
        except Exception as e:
            logger.error(f"Pipeline failed: {str(e)}")
            raise

if __name__ == "__main__":
    pipeline = EnhancedPipeline()
    pipeline.run()