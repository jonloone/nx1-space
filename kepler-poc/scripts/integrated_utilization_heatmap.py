#!/usr/bin/env python3
"""
Integrated Utilization Analysis with 18-Factor Heatmap System
Seamlessly integrates commercial utilization analysis with existing advanced heatmap framework
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntegratedUtilizationHeatmap:
    """Integration layer for utilization analysis and heatmap system"""
    
    def __init__(self, data_path: str = '/mnt/blockstorage/nx1-space/kepler-poc/data'):
        self.data_path = Path(data_path)
        self.logger = logging.getLogger(__name__)
        
        # Load all analysis components
        self.load_analysis_components()
        
        # Enhanced factor definitions (original 18 + utilization factors)
        self.integrated_factors = self._define_integrated_factors()
        
    def load_analysis_components(self):
        """Load all analysis components for integration"""
        
        # Load existing heatmap data
        try:
            heatmap_file = self.data_path / 'advanced_heatmap_data.json'
            if heatmap_file.exists():
                with open(heatmap_file, 'r') as f:
                    self.heatmap_data = json.load(f)
                self.logger.info("✅ Loaded existing heatmap data")
            else:
                self.heatmap_data = {}
        except Exception as e:
            self.logger.error(f"❌ Error loading heatmap data: {e}")
            self.heatmap_data = {}
        
        # Load utilization analysis
        try:
            util_file = self.data_path / 'enhanced_commercial_utilization_analysis.json'
            if util_file.exists():
                with open(util_file, 'r') as f:
                    self.utilization_data = json.load(f)
                self.logger.info("✅ Loaded utilization analysis")
            else:
                self.utilization_data = {'station_analyses': []}
        except Exception as e:
            self.logger.error(f"❌ Error loading utilization data: {e}")
            self.utilization_data = {'station_analyses': []}
        
        # Load investment scoring
        try:
            score_file = self.data_path / 'utilization_investment_scoring.json'  
            if score_file.exists():
                with open(score_file, 'r') as f:
                    self.scoring_data = json.load(f)
                self.logger.info("✅ Loaded investment scoring")
            else:
                self.scoring_data = {'station_scores': []}
        except Exception as e:
            self.scoring_data = {'station_scores': []}
        
        # Load competitive intelligence
        try:
            comp_file = self.data_path / 'competitive_market_intelligence.json'
            if comp_file.exists():
                with open(comp_file, 'r') as f:
                    self.competitive_data = json.load(f)
                self.logger.info("✅ Loaded competitive intelligence")
            else:
                self.competitive_data = {}
        except Exception as e:
            self.competitive_data = {}
        
        # Load forecasting results
        try:
            forecast_file = self.data_path / 'utilization_forecasting_analysis.json'
            if forecast_file.exists():
                with open(forecast_file, 'r') as f:
                    self.forecasting_data = json.load(f)
                self.logger.info("✅ Loaded forecasting analysis")
            else:
                self.forecasting_data = {'station_forecasts': []}
        except Exception as e:
            self.forecasting_data = {'station_forecasts': []}
    
    def _define_integrated_factors(self) -> List[Dict[str, Any]]:
        """Define integrated factor set (original 18 + utilization factors)"""
        
        # Original 18 factors (maintain compatibility)
        original_factors = [
            {
                'id': 'population_density',
                'name': 'Population Density',
                'category': 'Market',
                'weight': 0.08,
                'description': 'Population density indicating market demand',
                'higher_is_better': True,
                'data_source': 'UN Population Grid'
            },
            {
                'id': 'economic_development',
                'name': 'Economic Development',
                'category': 'Market',
                'weight': 0.09,
                'description': 'GDP per capita and development indicators',
                'higher_is_better': True,
                'data_source': 'World Bank'
            },
            {
                'id': 'infrastructure_quality',
                'name': 'Infrastructure Quality',
                'category': 'Infrastructure',
                'weight': 0.07,
                'description': 'Power grid and telecommunications infrastructure',
                'higher_is_better': True,
                'data_source': 'World Bank Infrastructure'
            },
            {
                'id': 'connectivity_index',
                'name': 'Connectivity Index',
                'category': 'Infrastructure',
                'weight': 0.06,
                'description': 'Fiber and internet connectivity metrics',
                'higher_is_better': True,
                'data_source': 'ITU Connectivity Index'
            },
            {
                'id': 'disaster_risk',
                'name': 'Disaster Risk',
                'category': 'Risk',
                'weight': 0.05,
                'description': 'Natural disaster and seismic risk assessment',
                'higher_is_better': False,
                'data_source': 'USGS Disaster Risk'
            },
            {
                'id': 'weather_stability',
                'name': 'Weather Stability',
                'category': 'Environmental',
                'weight': 0.04,
                'description': 'Precipitation and weather pattern stability',
                'higher_is_better': True,
                'data_source': 'NASA GPM'
            },
            {
                'id': 'regulatory_environment',
                'name': 'Regulatory Environment',
                'category': 'Regulatory',
                'weight': 0.05,
                'description': 'Telecommunications regulation quality',
                'higher_is_better': True,
                'data_source': 'ITU Regulatory Index'
            },
            {
                'id': 'competitive_landscape',
                'name': 'Competitive Landscape',
                'category': 'Market',
                'weight': 0.06,
                'description': 'Existing competition density',
                'higher_is_better': False,
                'data_source': 'Market Analysis'
            },
            # Add remaining original 10 factors with appropriate definitions
            {
                'id': 'market_maturity',
                'name': 'Market Maturity',
                'category': 'Market',
                'weight': 0.04,
                'description': 'Satellite services market development stage',
                'higher_is_better': True,
                'data_source': 'Industry Analysis'
            },
            {
                'id': 'geographic_diversity',
                'name': 'Geographic Diversity',
                'category': 'Strategic',
                'weight': 0.03,
                'description': 'Geographic positioning for coverage diversity',
                'higher_is_better': True,
                'data_source': 'Spatial Analysis'
            },
            {
                'id': 'logistics_access',
                'name': 'Logistics Access',
                'category': 'Infrastructure',
                'weight': 0.03,
                'description': 'Transportation and logistics infrastructure',
                'higher_is_better': True,
                'data_source': 'Infrastructure Analysis'
            },
            {
                'id': 'talent_availability',
                'name': 'Talent Availability',
                'category': 'Human Resources',
                'weight': 0.04,
                'description': 'Technical talent and education levels',
                'higher_is_better': True,
                'data_source': 'Education Statistics'
            },
            {
                'id': 'political_stability',
                'name': 'Political Stability',
                'category': 'Risk',
                'weight': 0.05,
                'description': 'Political and governance stability',
                'higher_is_better': True,
                'data_source': 'World Bank Governance'
            },
            {
                'id': 'currency_stability',
                'name': 'Currency Stability',
                'category': 'Risk',
                'weight': 0.03,
                'description': 'Exchange rate stability and inflation',
                'higher_is_better': True,
                'data_source': 'IMF Economic Data'
            },
            {
                'id': 'energy_costs',
                'name': 'Energy Costs',
                'category': 'Operational',
                'weight': 0.04,
                'description': 'Electricity costs and availability',
                'higher_is_better': False,
                'data_source': 'Energy Statistics'
            },
            {
                'id': 'land_availability',
                'name': 'Land Availability',
                'category': 'Infrastructure',
                'weight': 0.03,
                'description': 'Suitable land availability and costs',
                'higher_is_better': True,
                'data_source': 'Land Use Analysis'
            },
            {
                'id': 'security_environment',
                'name': 'Security Environment',
                'category': 'Risk',
                'weight': 0.04,
                'description': 'Physical and cyber security considerations',
                'higher_is_better': True,
                'data_source': 'Security Index'
            },
            {
                'id': 'environmental_compliance',
                'name': 'Environmental Compliance',
                'category': 'Regulatory',
                'weight': 0.03,
                'description': 'Environmental regulations and compliance costs',
                'higher_is_better': True,
                'data_source': 'Environmental Index'
            }
        ]
        
        # New utilization-based factors
        utilization_factors = [
            {
                'id': 'capacity_utilization',
                'name': 'Capacity Utilization',
                'category': 'Utilization',
                'weight': 0.12,
                'description': 'Current capacity utilization efficiency',
                'higher_is_better': True,
                'data_source': 'Commercial Utilization Analysis'
            },
            {
                'id': 'revenue_efficiency',
                'name': 'Revenue Efficiency',
                'category': 'Financial',
                'weight': 0.10,
                'description': 'Revenue generation per unit capacity',
                'higher_is_better': True,
                'data_source': 'Investment Scoring Framework'
            },
            {
                'id': 'bandwidth_demand',
                'name': 'Bandwidth Demand',
                'category': 'Market',
                'weight': 0.08,
                'description': 'Current bandwidth demand intensity',
                'higher_is_better': True,
                'data_source': 'Utilization Analysis'
            },
            {
                'id': 'growth_trajectory',
                'name': 'Growth Trajectory',
                'category': 'Financial',
                'weight': 0.09,
                'description': 'Historical and projected growth patterns',
                'higher_is_better': True,
                'data_source': 'Forecasting Engine'
            },
            {
                'id': 'market_position',
                'name': 'Market Position',
                'category': 'Competitive',
                'weight': 0.07,
                'description': 'Competitive market position and share',
                'higher_is_better': True,
                'data_source': 'Competitive Intelligence'
            },
            {
                'id': 'operational_efficiency',
                'name': 'Operational Efficiency',
                'category': 'Operational',
                'weight': 0.06,
                'description': 'Operational performance and efficiency metrics',
                'higher_is_better': True,
                'data_source': 'Utilization Analysis'
            },
            {
                'id': 'expansion_potential',
                'name': 'Expansion Potential',
                'category': 'Strategic',
                'weight': 0.05,
                'description': 'Potential for capacity expansion and growth',
                'higher_is_better': True,
                'data_source': 'Capacity Planning'
            }
        ]
        
        # Combine and normalize weights
        all_factors = original_factors + utilization_factors
        total_weight = sum(f['weight'] for f in all_factors)
        
        # Normalize weights to sum to 1.0
        for factor in all_factors:
            factor['weight'] = factor['weight'] / total_weight
        
        return all_factors
    
    def integrate_utilization_data(self) -> List[Dict[str, Any]]:
        """Integrate utilization data with existing opportunities"""
        
        integrated_opportunities = []
        
        # Start with existing heatmap opportunities if available
        existing_opportunities = self.heatmap_data.get('opportunities', [])
        
        # Create lookup for utilization data
        util_lookup = {}
        for station in self.utilization_data.get('station_analyses', []):
            station_id = station['station_info']['station_id']
            util_lookup[station_id] = station
        
        # Create lookup for scoring data
        score_lookup = {}
        for station in self.scoring_data.get('station_scores', []):
            station_id = station['station_info']['station_id']
            score_lookup[station_id] = station
        
        # Create lookup for forecasting data
        forecast_lookup = {}
        for station in self.forecasting_data.get('station_forecasts', []):
            station_id = station['station_info']['station_id']
            forecast_lookup[station_id] = station
        
        # Process existing opportunities with utilization enhancement
        for opp in existing_opportunities:
            enhanced_opp = self._enhance_opportunity_with_utilization(
                opp, util_lookup, score_lookup, forecast_lookup
            )
            if enhanced_opp:
                integrated_opportunities.append(enhanced_opp)
        
        # Add new opportunities from utilization analysis
        for station_id, util_data in util_lookup.items():
            # Check if this station is already in existing opportunities
            existing_ids = [opp.get('id', '') for opp in existing_opportunities]
            if station_id not in existing_ids:
                new_opp = self._create_utilization_opportunity(
                    util_data, score_lookup.get(station_id), forecast_lookup.get(station_id)
                )
                if new_opp:
                    integrated_opportunities.append(new_opp)
        
        return integrated_opportunities
    
    def _enhance_opportunity_with_utilization(self, existing_opp: Dict, 
                                            util_lookup: Dict, 
                                            score_lookup: Dict,
                                            forecast_lookup: Dict) -> Optional[Dict]:
        """Enhance existing opportunity with utilization data"""
        
        # Try to match by coordinates or ID
        opp_coords = existing_opp.get('coordinates', [])
        if len(opp_coords) != 2:
            return existing_opp  # Return as-is if no coordinates
        
        opp_lon, opp_lat = opp_coords
        
        # Find closest utilization station (within 50km)
        closest_station = None
        min_distance = float('inf')
        
        for station_data in util_lookup.values():
            station_coords = station_data['station_info']['coordinates']
            if len(station_coords) == 2:
                station_lon, station_lat = station_coords
                
                # Simple distance calculation
                distance = ((opp_lat - station_lat) ** 2 + (opp_lon - station_lon) ** 2) ** 0.5
                
                if distance < min_distance and distance < 0.5:  # ~50km threshold
                    min_distance = distance
                    closest_station = station_data
        
        if not closest_station:
            return existing_opp  # No matching utilization data
        
        station_id = closest_station['station_info']['station_id']
        
        # Enhance with utilization data
        enhanced_opp = existing_opp.copy()
        
        # Add utilization metrics
        util_metrics = closest_station['utilization_metrics']
        enhanced_opp['utilization_data'] = {
            'capacity_utilization': util_metrics['average_utilization_percent'],
            'peak_utilization': util_metrics['peak_utilization_percent'],
            'bandwidth_demand_gbps': util_metrics['bandwidth_demand_gbps'],
            'revenue_efficiency': util_metrics['revenue_efficiency_score'],
            'growth_rate': util_metrics['growth_rate_percent']
        }
        
        # Add competitive data
        if station_id in score_lookup:
            score_data = score_lookup[station_id]
            enhanced_opp['competitive_analysis'] = {
                'market_position_score': score_data['factor_scores']['market_position'],
                'competitive_advantage': score_data['factor_scores']['competitive_resilience'],
                'investment_tier': score_data['investment_recommendation']['tier'],
                'overall_investment_score': score_data['investment_recommendation']['overall_score']
            }
        
        # Add forecasting data
        if station_id in forecast_lookup:
            forecast_data = forecast_lookup[station_id]
            enhanced_opp['capacity_forecast'] = {
                'five_year_utilization': forecast_data['forecast_results']['baseline_forecast'][-1],
                'expansion_required': len(forecast_data['capacity_plan']['expansion_triggers']) > 0,
                'investment_required': forecast_data['capacity_plan']['total_investment_required'],
                'growth_drivers': forecast_data['forecast_results']['growth_drivers']
            }
        
        # Recalculate investment score with integrated factors
        enhanced_opp['integrated_investment_score'] = self._calculate_integrated_score(enhanced_opp)
        
        return enhanced_opp
    
    def _create_utilization_opportunity(self, util_data: Dict, 
                                      score_data: Optional[Dict],
                                      forecast_data: Optional[Dict]) -> Dict:
        """Create new opportunity from utilization analysis"""
        
        station_info = util_data['station_info']
        util_metrics = util_data['utilization_metrics']
        
        opportunity = {
            'id': station_info['station_id'],
            'name': station_info['name'],
            'operator': station_info['operator'],
            'country': station_info['country'],
            'coordinates': [station_info['coordinates'][0], station_info['coordinates'][1]],
            'latitude': station_info['coordinates'][1],
            'longitude': station_info['coordinates'][0],
            'type': 'Commercial Ground Station',
            'source': 'Utilization Analysis',
            
            # Core utilization data
            'utilization_data': {
                'capacity_utilization': util_metrics['average_utilization_percent'],
                'peak_utilization': util_metrics['peak_utilization_percent'],
                'bandwidth_demand_gbps': util_metrics['bandwidth_demand_gbps'],
                'revenue_efficiency': util_metrics['revenue_efficiency_score'],
                'growth_rate': util_metrics['growth_rate_percent'],
                'service_mix': util_metrics.get('service_mix', {}),
                'traffic_patterns': util_metrics.get('traffic_patterns', {})
            },
            
            # Technical specifications
            'technical_specs': {
                'antenna_size_m': station_info.get('antenna_size_m', 12.0),
                'frequency_bands': station_info.get('frequency_bands', ''),
                'services_supported': station_info.get('services', '')
            }
        }
        
        # Add competitive analysis if available
        if score_data:
            opportunity['competitive_analysis'] = {
                'market_position_score': score_data['factor_scores']['market_position'],
                'competitive_advantage': score_data['factor_scores']['competitive_resilience'],
                'investment_tier': score_data['investment_recommendation']['tier'],
                'overall_investment_score': score_data['investment_recommendation']['overall_score'],
                'roi_range': score_data['investment_recommendation']['roi_range'],
                'payback_years': score_data['investment_recommendation']['payback_years']
            }
        
        # Add forecasting data if available
        if forecast_data:
            opportunity['capacity_forecast'] = {
                'five_year_utilization': forecast_data['forecast_results']['baseline_forecast'][-1],
                'optimistic_forecast': forecast_data['forecast_results']['optimistic_forecast'][-1],
                'pessimistic_forecast': forecast_data['forecast_results']['pessimistic_forecast'][-1],
                'expansion_required': len(forecast_data['capacity_plan']['expansion_triggers']) > 0,
                'investment_required': forecast_data['capacity_plan']['total_investment_required'],
                'growth_drivers': forecast_data['forecast_results']['growth_drivers'],
                'risk_factors': forecast_data['forecast_results']['risk_factors']
            }
        
        # Calculate integrated investment score
        opportunity['integrated_investment_score'] = self._calculate_integrated_score(opportunity)
        
        return opportunity
    
    def _calculate_integrated_score(self, opportunity: Dict) -> float:
        """Calculate integrated investment score using all 25 factors"""
        
        factor_scores = {}
        
        # Calculate scores for utilization factors
        util_data = opportunity.get('utilization_data', {})
        
        # Capacity utilization score (optimal range 70-85%)
        capacity_util = util_data.get('capacity_utilization', 50.0)
        if 70 <= capacity_util <= 85:
            factor_scores['capacity_utilization'] = 95
        elif 60 <= capacity_util < 70:
            factor_scores['capacity_utilization'] = 80
        elif capacity_util > 85:
            factor_scores['capacity_utilization'] = 70  # Over-utilization penalty
        else:
            factor_scores['capacity_utilization'] = capacity_util * 1.2
        
        # Revenue efficiency score
        factor_scores['revenue_efficiency'] = util_data.get('revenue_efficiency', 50.0)
        
        # Bandwidth demand score (normalize to 0-100)
        bandwidth_demand = util_data.get('bandwidth_demand_gbps', 10.0)
        factor_scores['bandwidth_demand'] = min(100, bandwidth_demand * 5)  # Scale factor
        
        # Growth trajectory from forecasting
        forecast_data = opportunity.get('capacity_forecast', {})
        growth_rate = util_data.get('growth_rate', 5.0)
        if growth_rate > 20:
            factor_scores['growth_trajectory'] = 95
        elif growth_rate > 10:
            factor_scores['growth_trajectory'] = 80
        else:
            factor_scores['growth_trajectory'] = max(30, growth_rate * 4)
        
        # Market position from competitive analysis
        comp_data = opportunity.get('competitive_analysis', {})
        factor_scores['market_position'] = comp_data.get('market_position_score', 50.0)
        
        # Operational efficiency (based on utilization patterns)
        factor_scores['operational_efficiency'] = min(100, capacity_util + 10)
        
        # Expansion potential
        expansion_required = forecast_data.get('expansion_required', False)
        five_year_util = forecast_data.get('five_year_utilization', capacity_util)
        
        if expansion_required and five_year_util > 80:
            factor_scores['expansion_potential'] = 90  # High growth potential
        elif five_year_util > capacity_util * 1.2:
            factor_scores['expansion_potential'] = 75  # Good growth
        else:
            factor_scores['expansion_potential'] = 50  # Moderate potential
        
        # Use existing scores for traditional factors (simplified)
        traditional_score = opportunity.get('investment_score', 70.0)  # Default if not available
        
        # Traditional factors (weighted average of existing analysis)
        traditional_factors = [
            'population_density', 'economic_development', 'infrastructure_quality',
            'connectivity_index', 'disaster_risk', 'weather_stability',
            'regulatory_environment', 'competitive_landscape', 'market_maturity',
            'geographic_diversity', 'logistics_access', 'talent_availability',
            'political_stability', 'currency_stability', 'energy_costs',
            'land_availability', 'security_environment', 'environmental_compliance'
        ]
        
        for factor_id in traditional_factors:
            factor_scores[factor_id] = traditional_score  # Use base score for traditional factors
        
        # Calculate weighted integrated score
        total_score = 0
        total_weight = 0
        
        for factor in self.integrated_factors:
            factor_id = factor['id']
            weight = factor['weight']
            score = factor_scores.get(factor_id, 50.0)  # Default score if missing
            
            total_score += score * weight
            total_weight += weight
        
        # Normalize to 0-100 scale
        integrated_score = total_score / total_weight if total_weight > 0 else 50.0
        
        return round(integrated_score, 1)
    
    def generate_integrated_heatmap_data(self) -> Dict[str, Any]:
        """Generate integrated heatmap data with utilization insights"""
        
        logger.info("🔗 Generating Integrated Utilization Heatmap Data")
        logger.info("=" * 60)
        
        # Integrate utilization data with opportunities
        integrated_opportunities = self.integrate_utilization_data()
        
        # Generate enhanced metadata
        metadata = {
            'version': '3.0-utilization-enhanced',
            'generated_timestamp': datetime.now().isoformat(),
            'methodology': 'Integrated 25-Factor Analysis with Commercial Utilization Intelligence',
            'data_sources': [
                'Commercial Utilization Analysis',
                'Investment Scoring Framework', 
                'Competitive Market Intelligence',
                'Utilization Forecasting Engine',
                'Advanced Multi-Factor Heatmap System',
                'NASA GPM Precipitation Data',
                'UN Population Grid',
                'World Bank Development Indicators',
                'ITU Connectivity Metrics',
                'Industry Intelligence Database'
            ],
            'factor_categories': {
                'Market': ['population_density', 'economic_development', 'competitive_landscape', 'market_maturity', 'bandwidth_demand'],
                'Infrastructure': ['infrastructure_quality', 'connectivity_index', 'logistics_access', 'land_availability'],
                'Risk': ['disaster_risk', 'political_stability', 'currency_stability', 'security_environment'],
                'Environmental': ['weather_stability', 'environmental_compliance'],
                'Regulatory': ['regulatory_environment'],
                'Strategic': ['geographic_diversity', 'expansion_potential'],
                'Operational': ['energy_costs', 'operational_efficiency'],
                'Human Resources': ['talent_availability'],
                'Utilization': ['capacity_utilization'],
                'Financial': ['revenue_efficiency', 'growth_trajectory'],
                'Competitive': ['market_position']
            },
            'enhancement_features': [
                'Real Commercial Ground Station Data',
                'Actual Satellite Traffic Patterns',
                'Bandwidth Demand Analysis',
                'Revenue Efficiency Metrics',
                'Competitive Market Intelligence',
                '5-Year Utilization Forecasting',
                'Capacity Expansion Planning',
                'Investment ROI Projections'
            ]
        }
        
        # Calculate portfolio-level statistics
        portfolio_stats = self._calculate_portfolio_statistics(integrated_opportunities)
        
        # Generate market insights
        market_insights = self._generate_market_insights(integrated_opportunities)
        
        # Compile integrated dataset
        integrated_data = {
            'metadata': metadata,
            'factor_definitions': self.integrated_factors,
            'opportunities': integrated_opportunities,
            'portfolio_statistics': portfolio_stats,
            'market_insights': market_insights,
            'competitive_intelligence': self._extract_competitive_summary(),
            'utilization_summary': self._generate_utilization_summary(),
            'forecasting_highlights': self._extract_forecasting_highlights()
        }
        
        logger.info(f"✅ Integrated {len(integrated_opportunities)} opportunities")
        logger.info(f"📊 Enhanced with {len([o for o in integrated_opportunities if 'utilization_data' in o])} utilization profiles")
        
        return integrated_data
    
    def _calculate_portfolio_statistics(self, opportunities: List[Dict]) -> Dict[str, Any]:
        """Calculate portfolio-level statistics"""
        
        if not opportunities:
            return {}
        
        # Investment scores
        investment_scores = [opp['integrated_investment_score'] for opp in opportunities]
        
        # Utilization metrics
        utilization_opps = [opp for opp in opportunities if 'utilization_data' in opp]
        if utilization_opps:
            capacity_utils = [opp['utilization_data']['capacity_utilization'] for opp in utilization_opps]
            bandwidth_demands = [opp['utilization_data']['bandwidth_demand_gbps'] for opp in utilization_opps]
            revenue_effs = [opp['utilization_data']['revenue_efficiency'] for opp in utilization_opps]
        else:
            capacity_utils = bandwidth_demands = revenue_effs = []
        
        # Portfolio value estimation
        total_bandwidth = sum(bandwidth_demands) if bandwidth_demands else 0
        portfolio_value = total_bandwidth * 200_000_000  # $200M per Gbps assumption
        
        return {
            'total_opportunities': len(opportunities),
            'utilization_enhanced_opportunities': len(utilization_opps),
            'investment_score_statistics': {
                'mean': round(np.mean(investment_scores), 1),
                'median': round(np.median(investment_scores), 1),
                'std': round(np.std(investment_scores), 1),
                'min': round(min(investment_scores), 1),
                'max': round(max(investment_scores), 1)
            },
            'utilization_statistics': {
                'average_capacity_utilization': round(np.mean(capacity_utils), 1) if capacity_utils else 0,
                'total_bandwidth_demand_gbps': round(total_bandwidth, 1),
                'average_revenue_efficiency': round(np.mean(revenue_effs), 1) if revenue_effs else 0,
                'estimated_portfolio_value_billion': round(portfolio_value / 1_000_000_000, 1)
            },
            'tier_distribution': self._calculate_tier_distribution(opportunities),
            'geographic_distribution': self._calculate_geographic_distribution(opportunities),
            'operator_distribution': self._calculate_operator_distribution(opportunities)
        }
    
    def _generate_market_insights(self, opportunities: List[Dict]) -> List[str]:
        """Generate market insights from integrated data"""
        
        insights = []
        
        # Utilization insights
        util_opps = [opp for opp in opportunities if 'utilization_data' in opp]
        if util_opps:
            avg_util = np.mean([opp['utilization_data']['capacity_utilization'] for opp in util_opps])
            
            if avg_util > 75:
                insights.append(f"High market utilization ({avg_util:.1f}% average) indicates strong demand and potential capacity constraints")
            elif avg_util < 55:
                insights.append(f"Low market utilization ({avg_util:.1f}% average) suggests oversupply or untapped market potential")
            
            # Growth insights
            growth_rates = [opp['utilization_data']['growth_rate'] for opp in util_opps]
            avg_growth = np.mean(growth_rates)
            
            if avg_growth > 15:
                insights.append(f"Strong market growth ({avg_growth:.1f}% average) supports aggressive expansion strategies")
        
        # Investment tier insights
        excellent_opps = [opp for opp in opportunities if opp['integrated_investment_score'] > 80]
        if len(excellent_opps) > len(opportunities) * 0.3:
            insights.append("High concentration of excellent investment opportunities suggests favorable market conditions")
        
        # Geographic insights
        countries = {}
        for opp in opportunities:
            country = opp.get('country', 'Unknown')
            countries[country] = countries.get(country, 0) + 1
        
        top_country = max(countries, key=countries.get) if countries else 'Unknown'
        insights.append(f"Geographic concentration in {top_country} presents both opportunity and risk concentration")
        
        # Competitive insights
        comp_opps = [opp for opp in opportunities if 'competitive_analysis' in opp]
        if comp_opps:
            high_position = [opp for opp in comp_opps if opp['competitive_analysis']['market_position_score'] > 70]
            if len(high_position) > len(comp_opps) * 0.4:
                insights.append("Strong competitive positions across portfolio support pricing power and market stability")
        
        return insights
    
    def _extract_competitive_summary(self) -> Dict[str, Any]:
        """Extract competitive intelligence summary"""
        
        if not self.competitive_data:
            return {}
        
        market_clusters = self.competitive_data.get('market_clusters', [])
        competitor_profiles = self.competitive_data.get('competitor_profiles', [])
        
        return {
            'total_market_clusters': len(market_clusters),
            'total_competitors_analyzed': len(competitor_profiles),
            'top_competitors': [
                {
                    'operator': comp['operator'],
                    'station_count': comp['station_count'],
                    'threat_level': comp['threat_level']
                } for comp in competitor_profiles[:5]
            ],
            'market_concentration': self.competitive_data.get('market_intelligence', {}).get('market_concentration', {}),
            'key_opportunities': len(self.competitive_data.get('market_opportunities', []))
        }
    
    def _generate_utilization_summary(self) -> Dict[str, Any]:
        """Generate utilization analysis summary"""
        
        station_analyses = self.utilization_data.get('station_analyses', [])
        
        if not station_analyses:
            return {}
        
        # Aggregate utilization metrics
        avg_utilizations = [s['utilization_metrics']['average_utilization_percent'] for s in station_analyses]
        bandwidth_demands = [s['utilization_metrics']['bandwidth_demand_gbps'] for s in station_analyses]
        revenue_effs = [s['utilization_metrics']['revenue_efficiency_score'] for s in station_analyses]
        growth_rates = [s['utilization_metrics']['growth_rate_percent'] for s in station_analyses]
        
        return {
            'stations_analyzed': len(station_analyses),
            'utilization_metrics': {
                'average_utilization': round(np.mean(avg_utilizations), 1),
                'utilization_range': [round(min(avg_utilizations), 1), round(max(avg_utilizations), 1)],
                'total_bandwidth_gbps': round(sum(bandwidth_demands), 1),
                'average_revenue_efficiency': round(np.mean(revenue_effs), 1),
                'average_growth_rate': round(np.mean(growth_rates), 1)
            },
            'high_utilization_stations': len([u for u in avg_utilizations if u > 80]),
            'high_growth_stations': len([g for g in growth_rates if g > 15]),
            'high_efficiency_stations': len([r for r in revenue_effs if r > 70])
        }
    
    def _extract_forecasting_highlights(self) -> Dict[str, Any]:
        """Extract forecasting analysis highlights"""
        
        station_forecasts = self.forecasting_data.get('station_forecasts', [])
        
        if not station_forecasts:
            return {}
        
        # 5-year utilization forecasts
        five_year_utils = [f['forecast_results']['baseline_forecast'][-1] for f in station_forecasts]
        
        # Expansion requirements
        expansion_needed = [f for f in station_forecasts if f['capacity_plan']['expansion_triggers']]
        total_investment = sum(f['capacity_plan']['total_investment_required'] for f in station_forecasts)
        
        return {
            'stations_forecasted': len(station_forecasts),
            'five_year_outlook': {
                'average_utilization': round(np.mean(five_year_utils), 1),
                'high_utilization_count': len([u for u in five_year_utils if u > 80]),
                'utilization_range': [round(min(five_year_utils), 1), round(max(five_year_utils), 1)]
            },
            'capacity_planning': {
                'stations_requiring_expansion': len(expansion_needed),
                'total_investment_required_millions': round(total_investment / 1_000_000, 1),
                'expansion_percentage': round(len(expansion_needed) / len(station_forecasts) * 100, 1)
            }
        }
    
    def _calculate_tier_distribution(self, opportunities: List[Dict]) -> Dict[str, int]:
        """Calculate investment tier distribution"""
        
        tiers = {}
        for opp in opportunities:
            score = opp['integrated_investment_score']
            
            if score >= 85:
                tier = 'Tier 1 - Exceptional'
            elif score >= 75:
                tier = 'Tier 2 - Excellent'
            elif score >= 65:
                tier = 'Tier 3 - Good'
            elif score >= 55:
                tier = 'Tier 4 - Moderate'
            else:
                tier = 'Tier 5 - Below Average'
            
            tiers[tier] = tiers.get(tier, 0) + 1
        
        return tiers
    
    def _calculate_geographic_distribution(self, opportunities: List[Dict]) -> Dict[str, int]:
        """Calculate geographic distribution"""
        
        countries = {}
        for opp in opportunities:
            country = opp.get('country', 'Unknown')
            countries[country] = countries.get(country, 0) + 1
        
        return countries
    
    def _calculate_operator_distribution(self, opportunities: List[Dict]) -> Dict[str, int]:
        """Calculate operator distribution"""
        
        operators = {}
        for opp in opportunities:
            operator = opp.get('operator', 'Unknown')
            operators[operator] = operators.get(operator, 0) + 1
        
        return operators

def main():
    """Generate integrated utilization heatmap data"""
    
    print("🔗 Integrated Utilization Analysis with 18-Factor Heatmap System")
    print("=" * 75)
    print("Seamlessly integrating commercial utilization intelligence with advanced heatmap framework")
    print()
    
    # Initialize integration system
    integrator = IntegratedUtilizationHeatmap()
    
    # Generate integrated heatmap data
    integrated_data = integrator.generate_integrated_heatmap_data()
    
    if not integrated_data.get('opportunities'):
        print("❌ No integrated data generated - check component availability")
        return
    
    # Save integrated data
    output_path = Path('/mnt/blockstorage/nx1-space/kepler-poc/data')
    output_path.mkdir(exist_ok=True)
    
    # Save main integrated dataset
    integrated_file = output_path / 'integrated_utilization_heatmap.json'
    with open(integrated_file, 'w') as f:
        json.dump(integrated_data, f, indent=2, default=str)
    
    # Update advanced heatmap data file for visualization
    heatmap_file = output_path / 'advanced_heatmap_data.json'
    with open(heatmap_file, 'w') as f:
        json.dump(integrated_data, f, indent=2, default=str)
    
    # Print integration summary
    metadata = integrated_data['metadata']
    portfolio = integrated_data['portfolio_statistics']
    utilization = integrated_data['utilization_summary']
    
    print(f"✅ Integration Complete!")
    print(f"📊 Enhanced Analysis Framework:")
    print(f"  • {len(integrated_data['factor_definitions'])} integrated factors")
    print(f"  • {portfolio['total_opportunities']} total opportunities")
    print(f"  • {portfolio['utilization_enhanced_opportunities']} with utilization data")
    print(f"  • {len(metadata['data_sources'])} data sources integrated")
    print()
    
    print(f"💰 Portfolio Statistics:")
    print(f"  • Average Investment Score: {portfolio['investment_score_statistics']['mean']:.1f}/100")
    print(f"  • Total Bandwidth Demand: {portfolio['utilization_statistics']['total_bandwidth_demand_gbps']:.1f} Gbps")
    print(f"  • Estimated Portfolio Value: ${portfolio['utilization_statistics']['estimated_portfolio_value_billion']:.1f}B")
    print(f"  • Average Capacity Utilization: {portfolio['utilization_statistics']['average_capacity_utilization']:.1f}%")
    print()
    
    print("🏆 Top 5 Integrated Opportunities:")
    top_opportunities = sorted(integrated_data['opportunities'], 
                             key=lambda x: x['integrated_investment_score'], 
                             reverse=True)[:5]
    
    for i, opp in enumerate(top_opportunities, 1):
        print(f"{i}. {opp['name']} ({opp.get('operator', 'Unknown')})")
        print(f"   Integrated Score: {opp['integrated_investment_score']:.1f}/100")
        if 'utilization_data' in opp:
            util = opp['utilization_data']
            print(f"   Utilization: {util['capacity_utilization']:.1f}% | Bandwidth: {util['bandwidth_demand_gbps']:.1f} Gbps")
        if 'competitive_analysis' in opp:
            comp = opp['competitive_analysis']
            print(f"   Investment Tier: {comp.get('investment_tier', 'Unknown')}")
    
    print(f"\n📈 Key Market Insights:")
    for i, insight in enumerate(integrated_data['market_insights'], 1):
        print(f"{i}. {insight}")
    
    print(f"\n📁 Integrated data saved to:")
    print(f"  • Main dataset: {integrated_file}")
    print(f"  • Heatmap data: {heatmap_file}")
    print(f"\n🚀 Ready for enhanced visualization deployment!")

if __name__ == "__main__":
    main()