#!/usr/bin/env python3
"""
Competitive Market Analysis Using Actual Utilization Data
Advanced competitive intelligence system analyzing real market dynamics and utilization patterns
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
import logging
from geopy.distance import geodesic
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import warnings

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MarketCluster:
    """Market cluster analysis results"""
    cluster_id: str
    stations: List[str]
    geographic_center: Tuple[float, float]
    market_characteristics: Dict[str, Any]
    competition_intensity: float
    utilization_patterns: Dict[str, float]
    revenue_potential: float
    dominant_players: List[str]

@dataclass
class CompetitorProfile:
    """Detailed competitor profile"""
    operator: str
    station_count: int
    market_presence: Dict[str, int]  # Country: station count
    total_capacity_gbps: float
    average_utilization: float
    revenue_efficiency: float
    competitive_strengths: List[str]
    market_strategy: str
    threat_level: str

@dataclass
class MarketOpportunity:
    """Market opportunity analysis"""
    opportunity_id: str
    market_region: str
    opportunity_type: str  # underserved, consolidation, premium_services, etc.
    market_size_estimate: float
    competition_level: str
    entry_barriers: List[str]
    success_probability: float
    investment_requirement: float
    expected_payback_years: float

class CompetitiveMarketAnalyzer:
    """Advanced competitive market analysis using real utilization data"""
    
    def __init__(self, data_path: str = '/mnt/blockstorage/nx1-space/kepler-poc/data'):
        self.data_path = Path(data_path)
        self.logger = logging.getLogger(__name__)
        
        # Load utilization and scoring data
        self.load_analysis_data()
        
        # Market analysis parameters
        self.market_radius_km = 1000  # Extended market radius for competition analysis
        self.cluster_params = {
            'eps': 8.0,  # DBSCAN clustering parameter (degrees)
            'min_samples': 2,  # Minimum stations per cluster
            'metric': 'haversine'
        }
        
        # Industry intelligence data
        self.operator_intelligence = self._initialize_operator_intelligence()
        self.service_market_data = self._initialize_service_markets()
        
    def load_analysis_data(self):
        """Load utilization and investment scoring data"""
        try:
            # Load utilization analysis
            util_file = self.data_path / 'enhanced_commercial_utilization_analysis.json'
            if util_file.exists():
                with open(util_file, 'r') as f:
                    self.utilization_data = json.load(f)
                self.logger.info(f"✅ Loaded utilization data for {len(self.utilization_data['station_analyses'])} stations")
            else:
                self.logger.warning("⚠️ No utilization analysis found")
                self.utilization_data = {'station_analyses': []}
            
            # Load investment scoring
            score_file = self.data_path / 'utilization_investment_scoring.json'
            if score_file.exists():
                with open(score_file, 'r') as f:
                    self.scoring_data = json.load(f)
                self.logger.info(f"✅ Loaded investment scores for {len(self.scoring_data['station_scores'])} stations")
            else:
                self.logger.warning("⚠️ No investment scoring found")
                self.scoring_data = {'station_scores': []}
                
        except Exception as e:
            self.logger.error(f"❌ Error loading analysis data: {e}")
            self.utilization_data = {'station_analyses': []}
            self.scoring_data = {'station_scores': []}
    
    def _initialize_operator_intelligence(self) -> Dict[str, Dict]:
        """Initialize operator intelligence profiles"""
        return {
            'Intelsat': {
                'market_position': 'Global Leader',
                'key_strengths': ['Global Coverage', 'Government Contracts', 'Established Infrastructure'],
                'market_strategy': 'Premium Services & Government Focus',
                'financial_strength': 'Strong',
                'technology_focus': ['C-band', 'Ku-band', 'Ka-band'],
                'geographic_focus': 'Global',
                'growth_strategy': 'Consolidation & Efficiency',
                'threat_assessment': 'High - Market Leader'
            },
            'SES': {
                'market_position': 'European Leader',
                'key_strengths': ['European Market', 'Broadcasting', 'DTH Leadership'],
                'market_strategy': 'Broadcasting & European Market Dominance',
                'financial_strength': 'Strong',
                'technology_focus': ['Ku-band', 'Ka-band', 'O3b MEO'],
                'geographic_focus': 'Europe & Emerging Markets',
                'growth_strategy': 'Innovation & MEO Networks',
                'threat_assessment': 'High - Strong Regional Player'
            },
            'Viasat': {
                'market_position': 'Broadband Innovator',
                'key_strengths': ['Ka-band Technology', 'Broadband Services', 'Innovation'],
                'market_strategy': 'High-Capacity Broadband & Mobility',
                'financial_strength': 'Growing',
                'technology_focus': ['Ka-band', 'HTS'],
                'geographic_focus': 'Americas & Selected Markets',
                'growth_strategy': 'Capacity Expansion & New Markets',
                'threat_assessment': 'Medium-High - Technology Leader'
            },
            'Eutelsat': {
                'market_position': 'European Challenger',
                'key_strengths': ['European Broadcasting', 'Government Services'],
                'market_strategy': 'Broadcasting & Government Focus',
                'financial_strength': 'Stable',
                'technology_focus': ['C-band', 'Ku-band'],
                'geographic_focus': 'Europe & Africa',
                'growth_strategy': 'Selective Expansion',
                'threat_assessment': 'Medium - Regional Focus'
            },
            'Singtel': {
                'market_position': 'Asia-Pacific Hub',
                'key_strengths': ['Regional Connectivity', 'Enterprise Services'],
                'market_strategy': 'Regional Connectivity Hub',
                'financial_strength': 'Stable',
                'technology_focus': ['C-band', 'Ku-band'],
                'geographic_focus': 'Asia-Pacific',
                'growth_strategy': 'Regional Expansion',
                'threat_assessment': 'Medium - Regional Player'
            }
        }
    
    def _initialize_service_markets(self) -> Dict[str, Dict]:
        """Initialize service market intelligence"""
        return {
            'Broadcasting': {
                'market_size_billion': 15.2,
                'growth_rate': 0.02,
                'competition_level': 'High',
                'key_players': ['SES', 'Eutelsat', 'Intelsat'],
                'barriers_to_entry': ['High Capital Requirements', 'Established Relationships'],
                'profitability': 'Medium'
            },
            'Enterprise VSAT': {
                'market_size_billion': 8.7,
                'growth_rate': 0.15,
                'competition_level': 'Medium-High',
                'key_players': ['Intelsat', 'SES', 'Viasat'],
                'barriers_to_entry': ['Technical Complexity', 'Service Network'],
                'profitability': 'High'
            },
            'Government': {
                'market_size_billion': 6.3,
                'growth_rate': 0.08,
                'competition_level': 'Medium',
                'key_players': ['Intelsat', 'Viasat'],
                'barriers_to_entry': ['Security Clearances', 'Compliance Requirements'],
                'profitability': 'Very High'
            },
            'Mobility': {
                'market_size_billion': 4.1,
                'growth_rate': 0.35,
                'competition_level': 'High',
                'key_players': ['Viasat', 'Intelsat', 'Inmarsat'],
                'barriers_to_entry': ['Technology Requirements', 'Terminal Ecosystem'],
                'profitability': 'Very High'
            },
            'HTS': {
                'market_size_billion': 3.8,
                'growth_rate': 0.25,
                'competition_level': 'Medium',
                'key_players': ['Viasat', 'SES', 'Intelsat'],
                'barriers_to_entry': ['Advanced Technology', 'High Investment'],
                'profitability': 'Medium'
            }
        }
    
    def analyze_market_clusters(self) -> List[MarketCluster]:
        """Identify and analyze market clusters using geographic and utilization data"""
        
        if not self.utilization_data['station_analyses']:
            return []
        
        # Prepare data for clustering
        stations_data = []
        for station in self.utilization_data['station_analyses']:
            station_info = station['station_info']
            utilization = station['utilization_metrics']
            
            stations_data.append({
                'station_id': station_info['station_id'],
                'name': station_info['name'],
                'operator': station_info['operator'],
                'country': station_info['country'],
                'latitude': station_info['coordinates'][1],
                'longitude': station_info['coordinates'][0],
                'utilization': utilization['average_utilization_percent'],
                'revenue_efficiency': utilization['revenue_efficiency_score'],
                'bandwidth_demand': utilization['bandwidth_demand_gbps'],
                'growth_rate': utilization['growth_rate_percent']
            })
        
        stations_df = pd.DataFrame(stations_data)
        
        # Geographic clustering using DBSCAN
        coords = stations_df[['latitude', 'longitude']].values
        coords_rad = np.radians(coords)  # Convert to radians for haversine
        
        clustering = DBSCAN(
            eps=self.cluster_params['eps'] / 6371.0,  # Convert km to radians
            min_samples=self.cluster_params['min_samples'],
            metric='haversine'
        ).fit(coords_rad)
        
        stations_df['cluster'] = clustering.labels_
        
        # Analyze each cluster
        clusters = []
        unique_clusters = [c for c in stations_df['cluster'].unique() if c != -1]  # Exclude noise
        
        for cluster_id in unique_clusters:
            cluster_stations = stations_df[stations_df['cluster'] == cluster_id]
            
            # Geographic center
            center_lat = cluster_stations['latitude'].mean()
            center_lon = cluster_stations['longitude'].mean()
            
            # Market characteristics
            operators = cluster_stations['operator'].value_counts().to_dict()
            countries = cluster_stations['country'].value_counts().to_dict()
            
            # Competition intensity (normalized by number of operators)
            unique_operators = len(cluster_stations['operator'].unique())
            station_count = len(cluster_stations)
            competition_intensity = min(100, (unique_operators / station_count) * 150)
            
            # Utilization patterns
            utilization_patterns = {
                'average_utilization': cluster_stations['utilization'].mean(),
                'utilization_std': cluster_stations['utilization'].std(),
                'average_revenue_efficiency': cluster_stations['revenue_efficiency'].mean(),
                'total_bandwidth_demand': cluster_stations['bandwidth_demand'].sum(),
                'average_growth_rate': cluster_stations['growth_rate'].mean()
            }
            
            # Revenue potential (based on utilization and market size)
            base_revenue_potential = utilization_patterns['total_bandwidth_demand'] * 200  # $200K per Gbps annually
            market_adjustment = 1.0
            
            # Adjust for country markets
            for country, count in countries.items():
                country_multipliers = {
                    'United States': 1.2,
                    'Germany': 1.1,
                    'United Kingdom': 1.1,
                    'Japan': 1.05,
                    'Singapore': 1.15,
                    'France': 1.0,
                    'Brazil': 0.8,
                    'South Africa': 0.6
                }
                weight = count / station_count
                market_adjustment += (country_multipliers.get(country, 0.9) - 1.0) * weight
            
            revenue_potential = base_revenue_potential * market_adjustment
            
            # Dominant players
            dominant_players = [op for op, count in operators.items() if count >= 2 or count / station_count >= 0.4]
            
            cluster = MarketCluster(
                cluster_id=f"CLUSTER_{cluster_id:03d}",
                stations=cluster_stations['station_id'].tolist(),
                geographic_center=(center_lat, center_lon),
                market_characteristics={
                    'station_count': station_count,
                    'operators': operators,
                    'countries': countries,
                    'operator_diversity': unique_operators,
                    'market_maturity': 'High' if station_count >= 4 else 'Medium' if station_count >= 2 else 'Low'
                },
                competition_intensity=competition_intensity,
                utilization_patterns=utilization_patterns,
                revenue_potential=revenue_potential,
                dominant_players=dominant_players
            )
            
            clusters.append(cluster)
        
        # Sort by revenue potential
        clusters.sort(key=lambda x: x.revenue_potential, reverse=True)
        
        return clusters
    
    def analyze_competitor_profiles(self) -> List[CompetitorProfile]:
        """Analyze detailed competitor profiles based on utilization data"""
        
        if not self.utilization_data['station_analyses']:
            return []
        
        # Aggregate data by operator
        operator_data = {}
        
        for station in self.utilization_data['station_analyses']:
            station_info = station['station_info']
            utilization = station['utilization_metrics']
            operator = station_info['operator']
            
            if operator not in operator_data:
                operator_data[operator] = {
                    'stations': [],
                    'countries': {},
                    'total_bandwidth': 0,
                    'utilizations': [],
                    'revenue_efficiencies': [],
                    'antenna_sizes': [],
                    'services': set()
                }
            
            data = operator_data[operator]
            data['stations'].append(station_info['station_id'])
            
            country = station_info['country']
            data['countries'][country] = data['countries'].get(country, 0) + 1
            
            data['total_bandwidth'] += utilization['bandwidth_demand_gbps']
            data['utilizations'].append(utilization['average_utilization_percent'])
            data['revenue_efficiencies'].append(utilization['revenue_efficiency_score'])
            data['antenna_sizes'].append(station_info.get('antenna_size_m', 12.0))
            
            # Parse services
            services = station_info.get('services', '').split(', ')
            data['services'].update(services)
        
        # Create competitor profiles
        profiles = []
        
        for operator, data in operator_data.items():
            # Calculate averages
            avg_utilization = np.mean(data['utilizations'])
            avg_revenue_efficiency = np.mean(data['revenue_efficiencies'])
            avg_antenna_size = np.mean(data['antenna_sizes'])
            
            # Determine competitive strengths
            strengths = []
            
            # Geographic diversification
            if len(data['countries']) >= 3:
                strengths.append('Geographic Diversification')
            
            # Technology advantage
            if avg_antenna_size >= 15:
                strengths.append('Large-Scale Infrastructure')
            
            # Market efficiency
            if avg_revenue_efficiency >= 70:
                strengths.append('High Revenue Efficiency')
            
            # Utilization optimization
            if avg_utilization >= 70:
                strengths.append('Optimal Capacity Utilization')
            
            # Service diversity
            if len(data['services']) >= 5:
                strengths.append('Service Portfolio Diversity')
            
            # Add operator-specific intelligence
            intel = self.operator_intelligence.get(operator, {})
            if intel:
                strengths.extend(intel.get('key_strengths', []))
            
            # Determine market strategy
            market_strategy = intel.get('market_strategy', 'Regional Focus')
            
            # Assess threat level
            threat_factors = []
            if len(data['stations']) >= 3:
                threat_factors.append('Scale')
            if avg_revenue_efficiency >= 70:
                threat_factors.append('Efficiency')
            if len(data['countries']) >= 2:
                threat_factors.append('Geographic Reach')
            
            if len(threat_factors) >= 3:
                threat_level = 'High'
            elif len(threat_factors) >= 2:
                threat_level = 'Medium-High'
            elif len(threat_factors) >= 1:
                threat_level = 'Medium'
            else:
                threat_level = 'Low'
            
            profile = CompetitorProfile(
                operator=operator,
                station_count=len(data['stations']),
                market_presence=data['countries'],
                total_capacity_gbps=round(data['total_bandwidth'], 1),
                average_utilization=round(avg_utilization, 1),
                revenue_efficiency=round(avg_revenue_efficiency, 1),
                competitive_strengths=list(set(strengths)),  # Remove duplicates
                market_strategy=market_strategy,
                threat_level=threat_level
            )
            
            profiles.append(profile)
        
        # Sort by threat level and capacity
        threat_order = {'High': 4, 'Medium-High': 3, 'Medium': 2, 'Low': 1}
        profiles.sort(key=lambda x: (threat_order.get(x.threat_level, 0), x.total_capacity_gbps), reverse=True)
        
        return profiles
    
    def identify_market_opportunities(self, clusters: List[MarketCluster], profiles: List[CompetitorProfile]) -> List[MarketOpportunity]:
        """Identify market opportunities based on competitive analysis"""
        
        opportunities = []
        opportunity_counter = 1
        
        # Analyze each cluster for opportunities
        for cluster in clusters:
            # Underserved market opportunity
            if cluster.competition_intensity < 50 and cluster.utilization_patterns['average_utilization'] < 70:
                opportunity = MarketOpportunity(
                    opportunity_id=f"OPP_{opportunity_counter:03d}",
                    market_region=f"Cluster {cluster.cluster_id}",
                    opportunity_type="Underserved Market",
                    market_size_estimate=cluster.revenue_potential * 0.3,  # Potential uplift
                    competition_level="Low" if cluster.competition_intensity < 30 else "Medium",
                    entry_barriers=["Geographic Positioning", "Local Partnerships"],
                    success_probability=0.75 if cluster.competition_intensity < 30 else 0.6,
                    investment_requirement=cluster.market_characteristics['station_count'] * 50,  # $50M per competing station
                    expected_payback_years=4.0 if cluster.competition_intensity < 30 else 5.5
                )
                opportunities.append(opportunity)
                opportunity_counter += 1
            
            # Market consolidation opportunity
            if len(cluster.dominant_players) == 0 and cluster.market_characteristics['station_count'] >= 3:
                opportunity = MarketOpportunity(
                    opportunity_id=f"OPP_{opportunity_counter:03d}",
                    market_region=f"Cluster {cluster.cluster_id}",
                    opportunity_type="Market Consolidation",
                    market_size_estimate=cluster.revenue_potential * 0.6,
                    competition_level="Medium-High",
                    entry_barriers=["Acquisition Capital", "Regulatory Approval", "Integration Complexity"],
                    success_probability=0.65,
                    investment_requirement=cluster.revenue_potential * 2.5,  # 2.5x revenue multiple
                    expected_payback_years=6.0
                )
                opportunities.append(opportunity)
                opportunity_counter += 1
            
            # Premium services opportunity
            if cluster.utilization_patterns['average_revenue_efficiency'] < 60:
                opportunity = MarketOpportunity(
                    opportunity_id=f"OPP_{opportunity_counter:03d}",
                    market_region=f"Cluster {cluster.cluster_id}",
                    opportunity_type="Premium Services Expansion",
                    market_size_estimate=cluster.revenue_potential * 0.4,
                    competition_level="Medium",
                    entry_barriers=["Service Development", "Customer Acquisition", "Technical Capabilities"],
                    success_probability=0.70,
                    investment_requirement=cluster.market_characteristics['station_count'] * 25,  # $25M per station upgrade
                    expected_payback_years=3.5
                )
                opportunities.append(opportunity)
                opportunity_counter += 1
        
        # Analyze service market opportunities
        service_markets = self.service_market_data
        
        for service, market_data in service_markets.items():
            if market_data['growth_rate'] > 0.15:  # High growth services
                # Find clusters with low representation of this service
                suitable_clusters = []
                for cluster in clusters[:5]:  # Top revenue clusters only
                    # Check if service is underrepresented
                    cluster_stations = []
                    for station_id in cluster.stations:
                        for station in self.utilization_data['station_analyses']:
                            if station['station_info']['station_id'] == station_id:
                                cluster_stations.append(station)
                                break
                    
                    service_representation = 0
                    for station in cluster_stations:
                        if service in station['station_info'].get('services', ''):
                            service_representation += 1
                    
                    service_ratio = service_representation / len(cluster_stations) if cluster_stations else 0
                    
                    if service_ratio < 0.5:  # Service is underrepresented
                        suitable_clusters.append((cluster, service_ratio))
                
                if suitable_clusters:
                    best_cluster = min(suitable_clusters, key=lambda x: x[1])[0]  # Least represented
                    
                    opportunity = MarketOpportunity(
                        opportunity_id=f"OPP_{opportunity_counter:03d}",
                        market_region=f"Cluster {best_cluster.cluster_id}",
                        opportunity_type=f"{service} Service Expansion",
                        market_size_estimate=market_data['market_size_billion'] * 100 * 0.1,  # 10% market share target
                        competition_level=market_data['competition_level'],
                        entry_barriers=market_data['barriers_to_entry'],
                        success_probability=0.6 if market_data['competition_level'] == 'High' else 0.75,
                        investment_requirement=market_data['market_size_billion'] * 10,  # Investment proportional to market
                        expected_payback_years=4.0 if market_data['profitability'] == 'Very High' else 5.5
                    )
                    opportunities.append(opportunity)
                    opportunity_counter += 1
        
        # Sort opportunities by success probability and market size
        opportunities.sort(key=lambda x: x.success_probability * x.market_size_estimate, reverse=True)
        
        return opportunities[:15]  # Return top 15 opportunities
    
    def generate_competitive_intelligence_report(self) -> Dict[str, Any]:
        """Generate comprehensive competitive intelligence report"""
        
        logger.info("🔍 Generating Competitive Market Intelligence Report")
        logger.info("=" * 60)
        
        # Analyze market clusters
        clusters = self.analyze_market_clusters()
        logger.info(f"✅ Identified {len(clusters)} market clusters")
        
        # Analyze competitor profiles
        profiles = self.analyze_competitor_profiles()
        logger.info(f"✅ Analyzed {len(profiles)} competitor profiles")
        
        # Identify market opportunities
        opportunities = self.identify_market_opportunities(clusters, profiles)
        logger.info(f"✅ Identified {len(opportunities)} market opportunities")
        
        # Compile comprehensive report
        report = {
            'report_metadata': {
                'generated_timestamp': datetime.now().isoformat(),
                'methodology': 'Competitive Market Analysis v2.0',
                'data_sources': [
                    'Commercial Utilization Analysis',
                    'Investment Scoring Framework',
                    'Industry Intelligence Database',
                    'Geographic Clustering Analysis'
                ],
                'analysis_scope': {
                    'stations_analyzed': len(self.utilization_data.get('station_analyses', [])),
                    'clusters_identified': len(clusters),
                    'competitors_profiled': len(profiles),
                    'opportunities_identified': len(opportunities)
                }
            },
            'market_clusters': [
                {
                    'cluster_id': cluster.cluster_id,
                    'geographic_center': cluster.geographic_center,
                    'station_count': cluster.market_characteristics['station_count'],
                    'operators': cluster.market_characteristics['operators'],
                    'countries': cluster.market_characteristics['countries'],
                    'competition_intensity': round(cluster.competition_intensity, 1),
                    'revenue_potential_millions': round(cluster.revenue_potential / 1000000, 1),
                    'average_utilization': round(cluster.utilization_patterns['average_utilization'], 1),
                    'dominant_players': cluster.dominant_players,
                    'market_maturity': cluster.market_characteristics['market_maturity']
                } for cluster in clusters
            ],
            'competitor_profiles': [
                {
                    'operator': profile.operator,
                    'station_count': profile.station_count,
                    'market_presence': profile.market_presence,
                    'total_capacity_gbps': profile.total_capacity_gbps,
                    'average_utilization': profile.average_utilization,
                    'revenue_efficiency': profile.revenue_efficiency,
                    'competitive_strengths': profile.competitive_strengths,
                    'market_strategy': profile.market_strategy,
                    'threat_level': profile.threat_level
                } for profile in profiles
            ],
            'market_opportunities': [
                {
                    'opportunity_id': opp.opportunity_id,
                    'market_region': opp.market_region,
                    'opportunity_type': opp.opportunity_type,
                    'market_size_millions': round(opp.market_size_estimate / 1000000, 1),
                    'competition_level': opp.competition_level,
                    'entry_barriers': opp.entry_barriers,
                    'success_probability': round(opp.success_probability, 2),
                    'investment_requirement_millions': round(opp.investment_requirement / 1000000, 1),
                    'payback_years': opp.expected_payback_years
                } for opp in opportunities
            ],
            'market_intelligence': {
                'total_market_revenue_estimate': sum(c.revenue_potential for c in clusters) / 1000000,
                'market_concentration': {
                    'top_3_operators_share': self._calculate_market_concentration(profiles, 3),
                    'hhi_index': self._calculate_hhi_index(profiles)
                },
                'growth_sectors': [
                    service for service, data in self.service_market_data.items()
                    if data['growth_rate'] > 0.15
                ],
                'competitive_dynamics': self._assess_competitive_dynamics(profiles),
                'market_trends': self._identify_market_trends(clusters, profiles)
            },
            'strategic_recommendations': self._generate_strategic_recommendations(clusters, profiles, opportunities)
        }
        
        return report
    
    def _calculate_market_concentration(self, profiles: List[CompetitorProfile], top_n: int) -> float:
        """Calculate market concentration ratio"""
        total_capacity = sum(p.total_capacity_gbps for p in profiles)
        if total_capacity == 0:
            return 0
        
        sorted_profiles = sorted(profiles, key=lambda x: x.total_capacity_gbps, reverse=True)
        top_capacity = sum(p.total_capacity_gbps for p in sorted_profiles[:top_n])
        
        return round((top_capacity / total_capacity) * 100, 1)
    
    def _calculate_hhi_index(self, profiles: List[CompetitorProfile]) -> float:
        """Calculate Herfindahl-Hirschman Index"""
        total_capacity = sum(p.total_capacity_gbps for p in profiles)
        if total_capacity == 0:
            return 0
        
        hhi = sum((p.total_capacity_gbps / total_capacity * 100) ** 2 for p in profiles)
        return round(hhi, 1)
    
    def _assess_competitive_dynamics(self, profiles: List[CompetitorProfile]) -> Dict[str, str]:
        """Assess overall competitive dynamics"""
        
        high_threat_count = sum(1 for p in profiles if p.threat_level == 'High')
        total_competitors = len(profiles)
        
        if high_threat_count >= 3:
            intensity = "Very High"
        elif high_threat_count >= 2:
            intensity = "High"  
        elif total_competitors >= 4:
            intensity = "Medium-High"
        else:
            intensity = "Medium"
        
        # Assess market stability
        avg_utilization = np.mean([p.average_utilization for p in profiles])
        avg_efficiency = np.mean([p.revenue_efficiency for p in profiles])
        
        if avg_utilization > 70 and avg_efficiency > 60:
            stability = "Stable - Mature Market"
        elif avg_utilization < 50 or avg_efficiency < 50:
            stability = "Unstable - Market Challenges"
        else:
            stability = "Transitional - Mixed Performance"
        
        return {
            'competition_intensity': intensity,
            'market_stability': stability,
            'consolidation_pressure': "High" if total_competitors > 6 else "Medium"
        }
    
    def _identify_market_trends(self, clusters: List[MarketCluster], profiles: List[CompetitorProfile]) -> List[str]:
        """Identify key market trends"""
        
        trends = []
        
        # Utilization trends
        avg_cluster_utilization = np.mean([c.utilization_patterns['average_utilization'] for c in clusters])
        if avg_cluster_utilization > 75:
            trends.append("High capacity utilization indicates strong market demand")
        elif avg_cluster_utilization < 55:
            trends.append("Low utilization suggests market overcapacity or weak demand")
        
        # Geographic concentration
        total_stations = sum(c.market_characteristics['station_count'] for c in clusters)
        if len(clusters) > 0:
            avg_cluster_size = total_stations / len(clusters)
            if avg_cluster_size > 4:
                trends.append("Market shows geographic concentration in major hubs")
            else:
                trends.append("Market is geographically distributed")
        
        # Competition trends
        high_competition_clusters = sum(1 for c in clusters if c.competition_intensity > 70)
        if high_competition_clusters > len(clusters) * 0.5:
            trends.append("Intense competition in most market clusters")
        
        # Revenue efficiency trends
        high_efficiency_operators = sum(1 for p in profiles if p.revenue_efficiency > 70)
        if high_efficiency_operators > len(profiles) * 0.6:
            trends.append("Market demonstrates strong revenue optimization")
        
        # Technology trends
        service_trends = []
        for cluster in clusters[:3]:  # Top clusters
            if cluster.utilization_patterns['average_growth_rate'] > 15:
                service_trends.append("High growth in premium services")
                break
        
        trends.extend(service_trends)
        
        return trends
    
    def _generate_strategic_recommendations(self, clusters: List[MarketCluster], 
                                          profiles: List[CompetitorProfile], 
                                          opportunities: List[MarketOpportunity]) -> List[str]:
        """Generate strategic recommendations"""
        
        recommendations = []
        
        # Market entry recommendations
        underserved_opps = [o for o in opportunities if o.opportunity_type == "Underserved Market"]
        if underserved_opps:
            best_underserved = max(underserved_opps, key=lambda x: x.success_probability)
            recommendations.append(f"Priority market entry: {best_underserved.market_region} - {best_underserved.success_probability:.0%} success probability")
        
        # Service expansion recommendations
        premium_opps = [o for o in opportunities if "Premium Services" in o.opportunity_type]
        if premium_opps:
            recommendations.append("Focus on premium service expansion to improve revenue efficiency")
        
        # Competitive positioning
        high_threat_competitors = [p for p in profiles if p.threat_level == 'High']
        if high_threat_competitors:
            recommendations.append(f"Monitor competitive threats from {', '.join(p.operator for p in high_threat_competitors[:2])}")
        
        # Market consolidation
        consolidation_opps = [o for o in opportunities if o.opportunity_type == "Market Consolidation"]
        if consolidation_opps:
            recommendations.append("Consider strategic acquisitions in fragmented markets")
        
        # Technology investment
        avg_utilization = np.mean([c.utilization_patterns['average_utilization'] for c in clusters])
        if avg_utilization > 80:
            recommendations.append("Invest in capacity expansion to meet growing demand")
        
        # Geographic diversification
        country_concentration = {}
        for cluster in clusters:
            for country in cluster.market_characteristics['countries']:
                country_concentration[country] = country_concentration.get(country, 0) + 1
        
        if len(country_concentration) < 5:
            recommendations.append("Expand geographic diversification to reduce market risk")
        
        return recommendations

def main():
    """Run competitive market analysis"""
    
    print("🔍 Competitive Market Analysis Using Actual Utilization Data")
    print("=" * 70)
    print("Advanced competitive intelligence and market opportunity analysis")
    print()
    
    # Initialize analyzer
    analyzer = CompetitiveMarketAnalyzer()
    
    # Generate comprehensive intelligence report
    report = analyzer.generate_competitive_intelligence_report()
    
    if not report['report_metadata']['analysis_scope']['stations_analyzed']:
        print("❌ No utilization data available for competitive analysis")
        return
    
    # Save report
    output_path = Path('/mnt/blockstorage/nx1-space/kepler-poc/data')
    output_path.mkdir(exist_ok=True)
    
    report_file = output_path / 'competitive_market_intelligence.json'
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    # Print executive summary
    metadata = report['report_metadata']
    intelligence = report['market_intelligence']
    
    print(f"✅ Competitive Analysis Complete!")
    print(f"📊 Analysis Scope:")
    print(f"  • {metadata['analysis_scope']['stations_analyzed']} stations analyzed")
    print(f"  • {metadata['analysis_scope']['clusters_identified']} market clusters identified")
    print(f"  • {metadata['analysis_scope']['competitors_profiled']} competitors profiled")
    print(f"  • {metadata['analysis_scope']['opportunities_identified']} opportunities identified")
    print()
    
    print(f"💰 Market Intelligence:")
    print(f"  • Total Market Value: ${intelligence['total_market_revenue_estimate']:.1f}M")
    print(f"  • Top 3 Market Share: {intelligence['market_concentration']['top_3_operators_share']:.1f}%")
    print(f"  • Market Concentration (HHI): {intelligence['market_concentration']['hhi_index']:.0f}")
    print()
    
    print("🏆 Top 5 Market Opportunities:")
    for i, opp in enumerate(report['market_opportunities'][:5], 1):
        print(f"{i}. {opp['opportunity_type']} - {opp['market_region']}")
        print(f"   Market Size: ${opp['market_size_millions']:.1f}M | Success Probability: {opp['success_probability']:.0%}")
        print(f"   Investment: ${opp['investment_requirement_millions']:.1f}M | Payback: {opp['payback_years']:.1f} years")
    
    print("\n🎯 Strategic Recommendations:")
    for i, rec in enumerate(report['strategic_recommendations'], 1):
        print(f"{i}. {rec}")
    
    print(f"\n📁 Full report saved to: {report_file}")

if __name__ == "__main__":
    main()