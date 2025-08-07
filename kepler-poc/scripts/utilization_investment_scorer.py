#!/usr/bin/env python3
"""
Utilization-Based Investment Scoring Framework
Advanced scoring system that integrates commercial utilization patterns with investment analysis
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class UtilizationInvestmentFactors:
    """Container for utilization-based investment factors"""
    capacity_utilization_score: float
    revenue_efficiency_score: float
    bandwidth_demand_score: float
    growth_trajectory_score: float
    market_position_score: float
    operational_efficiency_score: float
    competitive_resilience_score: float
    expansion_potential_score: float

@dataclass
class InvestmentRecommendation:
    """Investment recommendation with detailed rationale"""
    station_id: str
    overall_score: float
    recommendation_tier: str
    investment_priority: str
    confidence_level: str
    key_strengths: List[str]
    risk_factors: List[str]
    action_items: List[str]
    expected_roi_range: Tuple[float, float]
    payback_period_years: float

class UtilizationInvestmentScorer:
    """Advanced investment scoring based on real utilization patterns"""
    
    def __init__(self, data_path: str = '/mnt/blockstorage/nx1-space/kepler-poc/data'):
        self.data_path = Path(data_path)
        self.logger = logging.getLogger(__name__)
        
        # Load utilization analysis results
        self.load_utilization_data()
        
        # Investment scoring parameters
        self.scoring_weights = {
            'capacity_utilization': 0.20,
            'revenue_efficiency': 0.18,
            'bandwidth_demand': 0.15,
            'growth_trajectory': 0.15,
            'market_position': 0.12,
            'operational_efficiency': 0.10,
            'competitive_resilience': 0.05,
            'expansion_potential': 0.05
        }
        
        # Industry benchmarks for scoring
        self.industry_benchmarks = {
            'utilization_excellent': 80.0,
            'utilization_good': 65.0,
            'utilization_poor': 40.0,
            'revenue_efficiency_excellent': 75.0,
            'revenue_efficiency_good': 60.0,
            'revenue_efficiency_poor': 40.0,
            'growth_excellent': 20.0,
            'growth_good': 10.0,
            'growth_poor': 5.0,
            'market_share_dominant': 40.0,
            'market_share_strong': 25.0,
            'market_share_weak': 10.0
        }
    
    def load_utilization_data(self):
        """Load utilization analysis results"""
        try:
            # Try to load existing utilization analysis
            utilization_file = self.data_path / 'enhanced_commercial_utilization_analysis.json'
            
            if utilization_file.exists():
                with open(utilization_file, 'r') as f:
                    self.utilization_data = json.load(f)
                self.logger.info(f"✅ Loaded utilization data for {len(self.utilization_data['station_analyses'])} stations")
            else:
                self.logger.warning("⚠️ No utilization analysis found - will create sample data")
                self.utilization_data = self._create_sample_utilization_data()
                
        except Exception as e:
            self.logger.error(f"❌ Error loading utilization data: {e}")
            self.utilization_data = self._create_sample_utilization_data()
    
    def _create_sample_utilization_data(self) -> Dict[str, Any]:
        """Create sample utilization data for testing"""
        return {
            'analysis_metadata': {
                'stations_analyzed': 0
            },
            'station_analyses': []
        }
    
    def calculate_capacity_utilization_score(self, utilization_data: Dict) -> float:
        """Score based on capacity utilization patterns"""
        
        metrics = utilization_data.get('utilization_metrics', {})
        avg_util = metrics.get('average_utilization_percent', 50.0)
        peak_util = metrics.get('peak_utilization_percent', 60.0)
        trend = metrics.get('capacity_trend', [50] * 12)
        
        # Base utilization score (optimal is 70-85%)
        if 70 <= avg_util <= 85:
            base_score = 100
        elif 60 <= avg_util < 70:
            base_score = 80 + (avg_util - 60) * 2  # Linear increase
        elif 85 < avg_util <= 95:
            base_score = 90 - (avg_util - 85) * 2  # Penalty for over-utilization
        elif avg_util > 95:
            base_score = 50  # High risk of capacity constraints
        else:
            base_score = avg_util * 1.2  # Below 60% gets proportional score
        
        # Peak utilization factor (peak should be manageable)
        peak_factor = 1.0
        if peak_util > 95:
            peak_factor = 0.8  # Penalty for excessive peaks
        elif peak_util < avg_util * 1.2:
            peak_factor = 0.9  # Penalty for flat demand (less flexibility)
        
        # Trend analysis (growth is good, but not too steep)
        if len(trend) >= 2:
            recent_trend = (trend[-1] - trend[0]) / max(1, len(trend) - 1)
            if 0 < recent_trend <= 2:
                trend_factor = 1.1  # Healthy growth
            elif recent_trend > 5:
                trend_factor = 0.9  # Rapid growth may strain capacity
            elif recent_trend < -2:
                trend_factor = 0.8  # Declining utilization is concerning
            else:
                trend_factor = 1.0
        else:
            trend_factor = 1.0
        
        final_score = base_score * peak_factor * trend_factor
        return min(100, max(0, final_score))
    
    def calculate_revenue_efficiency_score(self, utilization_data: Dict) -> float:
        """Score based on revenue generation efficiency"""
        
        metrics = utilization_data.get('utilization_metrics', {})
        revenue_eff = metrics.get('revenue_efficiency_score', 50.0)
        service_mix = metrics.get('service_mix', {})
        bandwidth_demand = metrics.get('bandwidth_demand_gbps', 10.0)
        
        # Base revenue efficiency score
        if revenue_eff >= self.industry_benchmarks['revenue_efficiency_excellent']:
            base_score = 95
        elif revenue_eff >= self.industry_benchmarks['revenue_efficiency_good']:
            base_score = 70 + (revenue_eff - self.industry_benchmarks['revenue_efficiency_good']) * 1.67
        else:
            base_score = revenue_eff * 1.75
        
        # Service mix diversification bonus
        if service_mix:
            service_count = len(service_mix)
            diversification_bonus = min(10, service_count * 1.5)
            
            # Premium service bonus (Government, Mobility)
            premium_services = ['Government', 'Mobility', 'Aeronautical']
            premium_weight = sum(
                service_mix.get(service, {}).get('weight', 0) 
                for service in premium_services
            )
            premium_bonus = min(15, premium_weight * 30)
        else:
            diversification_bonus = 0
            premium_bonus = 0
        
        # Bandwidth monetization efficiency
        if bandwidth_demand > 0:
            # Assume good revenue per Gbps is around $200K annually
            implied_revenue_per_gbps = (revenue_eff / 100) * 300  # Scaled estimate
            if implied_revenue_per_gbps > 250:
                monetization_bonus = 10
            elif implied_revenue_per_gbps > 200:
                monetization_bonus = 5
            else:
                monetization_bonus = 0
        else:
            monetization_bonus = 0
        
        final_score = base_score + diversification_bonus + premium_bonus + monetization_bonus
        return min(100, max(0, final_score))
    
    def calculate_bandwidth_demand_score(self, utilization_data: Dict) -> float:
        """Score based on bandwidth demand patterns and sustainability"""
        
        metrics = utilization_data.get('utilization_metrics', {})
        bandwidth_demand = metrics.get('bandwidth_demand_gbps', 10.0)
        traffic_patterns = metrics.get('traffic_patterns', {})
        station_info = utilization_data.get('station_info', {})
        
        # Normalize bandwidth demand by antenna size for fair comparison
        antenna_size = station_info.get('antenna_size_m', 12.0)
        normalized_demand = bandwidth_demand / antenna_size
        
        # Score based on demand intensity (higher is generally better)
        if normalized_demand >= 2.0:
            demand_score = 95  # Excellent demand
        elif normalized_demand >= 1.5:
            demand_score = 80
        elif normalized_demand >= 1.0:
            demand_score = 65
        elif normalized_demand >= 0.5:
            demand_score = 45
        else:
            demand_score = 25  # Low demand
        
        # Traffic pattern consistency bonus
        pattern_bonus = 0
        if traffic_patterns:
            hourly_values = [v for k, v in traffic_patterns.items() if k.startswith('hour_')]
            if hourly_values:
                # Calculate coefficient of variation (lower is more consistent)
                mean_traffic = np.mean(hourly_values)
                std_traffic = np.std(hourly_values)
                cv = std_traffic / mean_traffic if mean_traffic > 0 else 1
                
                # Moderate variation is good (indicates predictable peaks)
                if 0.3 <= cv <= 0.6:
                    pattern_bonus = 15  # Good predictable variation
                elif cv < 0.3:
                    pattern_bonus = 5   # Too flat (may indicate underutilization)
                else:
                    pattern_bonus = 0   # Too variable (operational challenges)
        
        # Peak demand sustainability check
        peak_hours = metrics.get('peak_hours', [])
        if peak_hours and traffic_patterns:
            peak_traffic_values = [
                traffic_patterns.get(f'hour_{hour:02d}', 50) 
                for hour in peak_hours
            ]
            avg_peak_traffic = np.mean(peak_traffic_values)
            
            # Sustainable peaks (not too extreme)
            if 80 <= avg_peak_traffic <= 95:
                sustainability_bonus = 10
            elif avg_peak_traffic > 95:
                sustainability_bonus = -10  # Unsustainable peaks
            else:
                sustainability_bonus = 5
        else:
            sustainability_bonus = 0
        
        final_score = demand_score + pattern_bonus + sustainability_bonus
        return min(100, max(0, final_score))
    
    def calculate_growth_trajectory_score(self, utilization_data: Dict) -> float:
        """Score based on growth patterns and sustainability"""
        
        metrics = utilization_data.get('utilization_metrics', {})
        growth_rate = metrics.get('growth_rate_percent', 5.0)
        capacity_trend = metrics.get('capacity_trend', [])
        forecast = utilization_data.get('capacity_forecast', {})
        
        # Base growth score
        if growth_rate >= self.industry_benchmarks['growth_excellent']:
            base_score = 95
        elif growth_rate >= self.industry_benchmarks['growth_good']:
            base_score = 70 + (growth_rate - self.industry_benchmarks['growth_good']) * 2.5
        elif growth_rate >= self.industry_benchmarks['growth_poor']:
            base_score = 40 + (growth_rate - self.industry_benchmarks['growth_poor']) * 6
        else:
            base_score = max(0, growth_rate * 8)
        
        # Growth sustainability analysis
        sustainability_factor = 1.0
        if capacity_trend and len(capacity_trend) >= 6:
            # Check if growth is accelerating dangerously
            recent_months = capacity_trend[-6:]
            growth_acceleration = np.polyfit(range(len(recent_months)), recent_months, 1)[0]
            
            if growth_acceleration > 3:  # Too rapid acceleration
                sustainability_factor = 0.8
            elif growth_acceleration < -2:  # Declining trend
                sustainability_factor = 0.7
            else:
                sustainability_factor = 1.1  # Stable growth
        
        # Future capacity planning score
        planning_bonus = 0
        if forecast:
            annual_projections = forecast.get('annual_projections', [])
            if annual_projections:
                # Check if expansion is planned before hitting capacity limits
                for projection in annual_projections:
                    if projection.get('projected_utilization_percent', 0) > 85:
                        if projection.get('expansion_recommended', False):
                            planning_bonus = 10  # Good planning
                        else:
                            planning_bonus = -15  # Poor planning
                        break
        
        final_score = base_score * sustainability_factor + planning_bonus
        return min(100, max(0, final_score))
    
    def calculate_market_position_score(self, utilization_data: Dict) -> float:
        """Score based on competitive market position"""
        
        market_data = utilization_data.get('market_competition', {})
        market_share = market_data.get('market_share_percent', 20.0)
        competitor_count = market_data.get('competitor_count', 5)
        competitive_advantage = market_data.get('competitive_advantage_score', 50.0)
        pricing_efficiency = market_data.get('pricing_efficiency', 60.0)
        
        # Market share score
        if market_share >= self.industry_benchmarks['market_share_dominant']:
            share_score = 95
        elif market_share >= self.industry_benchmarks['market_share_strong']:
            share_score = 75
        elif market_share >= self.industry_benchmarks['market_share_weak']:
            share_score = 50
        else:
            share_score = market_share * 4  # Below 10% gets proportional score
        
        # Competition intensity factor
        if competitor_count <= 2:
            competition_factor = 1.2  # Low competition is good
        elif competitor_count <= 5:
            competition_factor = 1.0  # Moderate competition
        else:
            competition_factor = 0.8  # High competition is challenging
        
        # Competitive advantage multiplier
        advantage_multiplier = 0.8 + (competitive_advantage / 100) * 0.4  # 0.8 to 1.2 range
        
        # Pricing power bonus
        pricing_bonus = max(0, (pricing_efficiency - 60) * 0.3)
        
        final_score = (share_score * competition_factor * advantage_multiplier) + pricing_bonus
        return min(100, max(0, final_score))
    
    def calculate_operational_efficiency_score(self, utilization_data: Dict) -> float:
        """Score based on operational efficiency metrics"""
        
        metrics = utilization_data.get('utilization_metrics', {})
        station_info = utilization_data.get('station_info', {})
        
        # Traffic pattern efficiency
        traffic_patterns = metrics.get('traffic_patterns', {})
        peak_hours = metrics.get('peak_hours', [])
        
        pattern_efficiency = 70  # Default
        if traffic_patterns and peak_hours:
            # Calculate how well traffic aligns with expected peak hours
            peak_traffic_sum = sum(
                traffic_patterns.get(f'hour_{hour:02d}', 0) 
                for hour in peak_hours
            )
            total_traffic = sum(traffic_patterns.values())
            
            if total_traffic > 0:
                peak_concentration = peak_traffic_sum / total_traffic
                # Good efficiency is 40-60% of traffic in peak hours
                if 0.4 <= peak_concentration <= 0.6:
                    pattern_efficiency = 90
                elif 0.3 <= peak_concentration < 0.4 or 0.6 < peak_concentration <= 0.7:
                    pattern_efficiency = 75
                else:
                    pattern_efficiency = 60
        
        # Service diversification efficiency
        service_mix = metrics.get('service_mix', {})
        diversification_score = 70  # Default
        
        if service_mix:
            # Calculate service mix entropy (diversity measure)
            total_weight = sum(s.get('weight', 0) for s in service_mix.values())
            if total_weight > 0:
                entropy = 0
                for service_data in service_mix.values():
                    weight = service_data.get('weight', 0)
                    if weight > 0:
                        p = weight / total_weight
                        entropy -= p * np.log2(p)
                
                # Normalize entropy (max is log2(n) where n is number of services)
                max_entropy = np.log2(len(service_mix))
                normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
                diversification_score = 50 + (normalized_entropy * 50)
        
        # Capacity utilization efficiency
        avg_util = metrics.get('average_utilization_percent', 50.0)
        peak_util = metrics.get('peak_utilization_percent', 60.0)
        
        # Good efficiency is high average with manageable peaks
        util_efficiency = avg_util
        if peak_util > 0:
            peak_ratio = avg_util / peak_util
            if peak_ratio >= 0.8:  # Very flat utilization
                util_efficiency *= 0.9  # Slight penalty
            elif peak_ratio <= 0.5:  # Very peaky utilization
                util_efficiency *= 0.8  # Penalty for inefficient capacity use
        
        # Weighted combination
        final_score = (
            pattern_efficiency * 0.4 +
            diversification_score * 0.3 +
            util_efficiency * 0.3
        )
        
        return min(100, max(0, final_score))
    
    def calculate_competitive_resilience_score(self, utilization_data: Dict) -> float:
        """Score based on resilience to competitive pressure"""
        
        market_data = utilization_data.get('market_competition', {})
        metrics = utilization_data.get('utilization_metrics', {})
        station_info = utilization_data.get('station_info', {})
        
        # Service differentiation as resilience factor
        service_differentiation = market_data.get('service_differentiation', 30.0)
        differentiation_score = min(100, service_differentiation * 2)
        
        # Technology advantage (antenna size relative to market)
        antenna_size = station_info.get('antenna_size_m', 12.0)
        if antenna_size >= 18:
            tech_advantage = 90
        elif antenna_size >= 15:
            tech_advantage = 75
        elif antenna_size >= 12:
            tech_advantage = 60
        else:
            tech_advantage = 40
        
        # Revenue stream diversity
        service_mix = metrics.get('service_mix', {})
        revenue_resilience = 50  # Default
        
        if service_mix:
            # Check for high-value, sticky services
            sticky_services = ['Government', 'Enterprise VSAT', 'Gateway']
            sticky_weight = sum(
                service_mix.get(service, {}).get('weight', 0) 
                for service in sticky_services
            )
            total_weight = sum(s.get('weight', 0) for s in service_mix.values())
            
            if total_weight > 0:
                sticky_ratio = sticky_weight / total_weight
                revenue_resilience = 30 + (sticky_ratio * 70)
        
        # Market position strength
        market_share = market_data.get('market_share_percent', 20.0)
        competitive_advantage = market_data.get('competitive_advantage_score', 50.0)
        
        position_strength = (market_share * 1.5 + competitive_advantage) / 2
        
        # Weighted combination
        final_score = (
            differentiation_score * 0.3 +
            tech_advantage * 0.25 +
            revenue_resilience * 0.25 +
            position_strength * 0.2
        )
        
        return min(100, max(0, final_score))
    
    def calculate_expansion_potential_score(self, utilization_data: Dict) -> float:
        """Score based on potential for capacity expansion and growth"""
        
        forecast = utilization_data.get('capacity_forecast', {})
        metrics = utilization_data.get('utilization_metrics', {})
        station_info = utilization_data.get('station_info', {})
        
        # Current utilization headroom
        avg_util = metrics.get('average_utilization_percent', 50.0)
        utilization_headroom = max(0, 85 - avg_util)  # Room before hitting capacity
        headroom_score = min(100, utilization_headroom * 2.5)
        
        # Growth trajectory support
        growth_rate = metrics.get('growth_rate_percent', 5.0)
        if growth_rate > 15:
            growth_support = 90
        elif growth_rate > 10:
            growth_support = 70
        elif growth_rate > 5:
            growth_support = 50
        else:
            growth_support = 30
        
        # Market expansion potential
        country = station_info.get('country', 'Other')
        market_potential = {
            'United States': 85,
            'China': 80,
            'Germany': 75,
            'United Kingdom': 75,
            'Japan': 70,
            'France': 68,
            'Brazil': 65,
            'India': 75,
            'Singapore': 70,
            'South Korea': 68
        }
        market_score = market_potential.get(country, 50)
        
        # Infrastructure readiness for expansion
        antenna_size = station_info.get('antenna_size_m', 12.0)
        bands = station_info.get('frequency_bands', '')
        
        if antenna_size >= 15 and 'Ka-band' in bands:
            infrastructure_readiness = 90
        elif antenna_size >= 12 and ('Ku-band' in bands or 'Ka-band' in bands):
            infrastructure_readiness = 75
        else:
            infrastructure_readiness = 50
        
        # Forecast-based expansion timing
        timing_score = 70  # Default
        if forecast:
            annual_projections = forecast.get('annual_projections', [])
            expansion_timeline = forecast.get('capacity_expansion_timeline', '')
            
            if 'No immediate expansion' in expansion_timeline:
                timing_score = 90  # Good timing flexibility
            elif 'Year 1' in expansion_timeline or 'Year 2' in expansion_timeline:
                timing_score = 60  # Near-term expansion needed
            elif 'Year 3' in expansion_timeline:
                timing_score = 80  # Good planning horizon
        
        # Weighted combination
        final_score = (
            headroom_score * 0.3 +
            growth_support * 0.25 +
            market_score * 0.2 +
            infrastructure_readiness * 0.15 +
            timing_score * 0.1
        )
        
        return min(100, max(0, final_score))
    
    def calculate_comprehensive_investment_score(self, utilization_data: Dict) -> UtilizationInvestmentFactors:
        """Calculate all investment factors based on utilization analysis"""
        
        # Calculate individual factor scores
        capacity_utilization = self.calculate_capacity_utilization_score(utilization_data)
        revenue_efficiency = self.calculate_revenue_efficiency_score(utilization_data)
        bandwidth_demand = self.calculate_bandwidth_demand_score(utilization_data)
        growth_trajectory = self.calculate_growth_trajectory_score(utilization_data)
        market_position = self.calculate_market_position_score(utilization_data)
        operational_efficiency = self.calculate_operational_efficiency_score(utilization_data)
        competitive_resilience = self.calculate_competitive_resilience_score(utilization_data)
        expansion_potential = self.calculate_expansion_potential_score(utilization_data)
        
        return UtilizationInvestmentFactors(
            capacity_utilization_score=capacity_utilization,
            revenue_efficiency_score=revenue_efficiency,
            bandwidth_demand_score=bandwidth_demand,
            growth_trajectory_score=growth_trajectory,
            market_position_score=market_position,
            operational_efficiency_score=operational_efficiency,
            competitive_resilience_score=competitive_resilience,
            expansion_potential_score=expansion_potential
        )
    
    def generate_investment_recommendation(self, station_data: Dict, factors: UtilizationInvestmentFactors) -> InvestmentRecommendation:
        """Generate detailed investment recommendation"""
        
        station_info = station_data.get('station_info', {})
        station_id = station_info.get('station_id', 'UNKNOWN')
        
        # Calculate weighted overall score
        overall_score = (
            factors.capacity_utilization_score * self.scoring_weights['capacity_utilization'] +
            factors.revenue_efficiency_score * self.scoring_weights['revenue_efficiency'] +
            factors.bandwidth_demand_score * self.scoring_weights['bandwidth_demand'] +
            factors.growth_trajectory_score * self.scoring_weights['growth_trajectory'] +
            factors.market_position_score * self.scoring_weights['market_position'] +
            factors.operational_efficiency_score * self.scoring_weights['operational_efficiency'] +
            factors.competitive_resilience_score * self.scoring_weights['competitive_resilience'] +
            factors.expansion_potential_score * self.scoring_weights['expansion_potential']
        )
        
        # Determine recommendation tier and priority
        if overall_score >= 85:
            tier = "Tier 1 - Exceptional"
            priority = "Highest Priority"
            confidence = "Very High"
            roi_range = (15.0, 25.0)
            payback_years = 3.5
        elif overall_score >= 75:
            tier = "Tier 2 - Excellent"
            priority = "High Priority"
            confidence = "High"
            roi_range = (12.0, 20.0)
            payback_years = 4.0
        elif overall_score >= 65:
            tier = "Tier 3 - Good"
            priority = "Medium Priority"
            confidence = "Medium-High"
            roi_range = (8.0, 15.0)
            payback_years = 5.0
        elif overall_score >= 55:
            tier = "Tier 4 - Moderate"
            priority = "Medium Priority"
            confidence = "Medium"
            roi_range = (5.0, 12.0)
            payback_years = 6.0
        elif overall_score >= 45:
            tier = "Tier 5 - Below Average"
            priority = "Low Priority"
            confidence = "Low-Medium"
            roi_range = (3.0, 8.0)
            payback_years = 8.0
        else:
            tier = "Tier 6 - Poor"
            priority = "Not Recommended"
            confidence = "Low"
            roi_range = (0.0, 5.0)
            payback_years = 12.0
        
        # Identify key strengths
        strengths = []
        factor_scores = {
            'Capacity Utilization': factors.capacity_utilization_score,
            'Revenue Efficiency': factors.revenue_efficiency_score,
            'Bandwidth Demand': factors.bandwidth_demand_score,
            'Growth Trajectory': factors.growth_trajectory_score,
            'Market Position': factors.market_position_score,
            'Operational Efficiency': factors.operational_efficiency_score,
            'Competitive Resilience': factors.competitive_resilience_score,
            'Expansion Potential': factors.expansion_potential_score
        }
        
        for factor, score in factor_scores.items():
            if score >= 80:
                strengths.append(f"Strong {factor} ({score:.1f}/100)")
        
        if not strengths:
            # Find best factors even if not excellent
            best_factors = sorted(factor_scores.items(), key=lambda x: x[1], reverse=True)[:2]
            strengths = [f"{factor} ({score:.1f}/100)" for factor, score in best_factors]
        
        # Identify risk factors
        risks = []
        for factor, score in factor_scores.items():
            if score < 40:
                risks.append(f"Weak {factor} ({score:.1f}/100)")
        
        # Generate action items based on analysis
        actions = []
        
        if factors.capacity_utilization_score < 60:
            actions.append("Improve capacity utilization through demand generation")
        
        if factors.revenue_efficiency_score < 60:
            actions.append("Optimize service mix toward higher-margin offerings")
        
        if factors.growth_trajectory_score < 60:
            actions.append("Develop growth strategy and market expansion plans")
        
        if factors.market_position_score < 60:
            actions.append("Strengthen competitive position and market share")
        
        if factors.competitive_resilience_score < 60:
            actions.append("Enhance service differentiation and customer lock-in")
        
        if not actions:
            actions = ["Continue monitoring performance", "Optimize operational efficiency"]
        
        return InvestmentRecommendation(
            station_id=station_id,
            overall_score=round(overall_score, 1),
            recommendation_tier=tier,
            investment_priority=priority,
            confidence_level=confidence,
            key_strengths=strengths,
            risk_factors=risks,
            action_items=actions,
            expected_roi_range=roi_range,
            payback_period_years=payback_years
        )
    
    def run_comprehensive_scoring(self) -> Dict[str, Any]:
        """Run comprehensive utilization-based investment scoring"""
        
        logger.info("🎯 Starting Utilization-Based Investment Scoring")
        logger.info("=" * 60)
        
        if not self.utilization_data.get('station_analyses'):
            logger.error("❌ No utilization data available for scoring")
            return {}
        
        results = {
            'scoring_metadata': {
                'timestamp': datetime.now().isoformat(),
                'methodology': 'Utilization-Based Investment Scoring v2.0',
                'stations_scored': len(self.utilization_data['station_analyses']),
                'scoring_weights': self.scoring_weights,
                'industry_benchmarks': self.industry_benchmarks
            },
            'station_scores': [],
            'scoring_summary': {},
            'tier_distribution': {},
            'top_recommendations': []
        }
        
        # Score each station
        for station_data in self.utilization_data['station_analyses']:
            try:
                # Calculate investment factors
                factors = self.calculate_comprehensive_investment_score(station_data)
                
                # Generate recommendation
                recommendation = self.generate_investment_recommendation(station_data, factors)
                
                # Compile station score
                station_score = {
                    'station_info': station_data.get('station_info', {}),
                    'factor_scores': {
                        'capacity_utilization': factors.capacity_utilization_score,
                        'revenue_efficiency': factors.revenue_efficiency_score,
                        'bandwidth_demand': factors.bandwidth_demand_score,
                        'growth_trajectory': factors.growth_trajectory_score,
                        'market_position': factors.market_position_score,
                        'operational_efficiency': factors.operational_efficiency_score,
                        'competitive_resilience': factors.competitive_resilience_score,
                        'expansion_potential': factors.expansion_potential_score
                    },
                    'investment_recommendation': {
                        'overall_score': recommendation.overall_score,
                        'tier': recommendation.recommendation_tier,
                        'priority': recommendation.investment_priority,
                        'confidence': recommendation.confidence_level,
                        'strengths': recommendation.key_strengths,
                        'risks': recommendation.risk_factors,
                        'actions': recommendation.action_items,
                        'roi_range': recommendation.expected_roi_range,
                        'payback_years': recommendation.payback_period_years
                    }
                }
                
                results['station_scores'].append(station_score)
                
                station_name = station_data.get('station_info', {}).get('name', 'Unknown')
                logger.info(f"✅ Scored {station_name} - Overall: {recommendation.overall_score:.1f} ({recommendation.recommendation_tier})")
                
            except Exception as e:
                station_id = station_data.get('station_info', {}).get('station_id', 'UNKNOWN')
                logger.error(f"❌ Error scoring station {station_id}: {e}")
        
        # Generate summary statistics
        if results['station_scores']:
            overall_scores = [s['investment_recommendation']['overall_score'] for s in results['station_scores']]
            
            results['scoring_summary'] = {
                'total_stations': len(results['station_scores']),
                'average_score': round(np.mean(overall_scores), 1),
                'median_score': round(np.median(overall_scores), 1),
                'score_std': round(np.std(overall_scores), 1),
                'min_score': round(min(overall_scores), 1),
                'max_score': round(max(overall_scores), 1)
            }
            
            # Tier distribution
            tiers = [s['investment_recommendation']['tier'] for s in results['station_scores']]
            tier_counts = {}
            for tier in tiers:
                tier_counts[tier] = tier_counts.get(tier, 0) + 1
            results['tier_distribution'] = tier_counts
            
            # Top recommendations
            sorted_stations = sorted(
                results['station_scores'], 
                key=lambda x: x['investment_recommendation']['overall_score'], 
                reverse=True
            )
            results['top_recommendations'] = sorted_stations[:10]
        
        logger.info(f"✅ Scoring complete: {len(results['station_scores'])} stations scored")
        logger.info(f"📊 Average score: {results['scoring_summary'].get('average_score', 0):.1f}/100")
        
        return results

def main():
    """Run utilization-based investment scoring analysis"""
    
    print("🎯 Utilization-Based Investment Scoring Framework")
    print("=" * 65)
    print("Advanced scoring system integrating commercial utilization patterns")
    print()
    
    # Initialize scorer
    scorer = UtilizationInvestmentScorer()
    
    # Run comprehensive scoring
    results = scorer.run_comprehensive_scoring()
    
    if not results:
        print("❌ No results generated - check utilization data availability")
        return
    
    # Save results
    output_path = Path('/mnt/blockstorage/nx1-space/kepler-poc/data')
    output_path.mkdir(exist_ok=True)
    
    results_file = output_path / 'utilization_investment_scoring.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    # Create integration dataset
    scoring_data = []
    for station_score in results['station_scores']:
        station_info = station_score['station_info']
        factor_scores = station_score['factor_scores']
        recommendation = station_score['investment_recommendation']
        
        scoring_data.append({
            'station_id': station_info.get('station_id'),
            'name': station_info.get('name'),
            'operator': station_info.get('operator'),
            'country': station_info.get('country'),
            'latitude': station_info.get('coordinates', [0, 0])[1],
            'longitude': station_info.get('coordinates', [0, 0])[0],
            'overall_investment_score': recommendation['overall_score'],
            'investment_tier': recommendation['tier'],
            'investment_priority': recommendation['priority'],
            'confidence_level': recommendation['confidence'],
            'capacity_utilization_score': factor_scores['capacity_utilization'],
            'revenue_efficiency_score': factor_scores['revenue_efficiency'],
            'bandwidth_demand_score': factor_scores['bandwidth_demand'],
            'growth_trajectory_score': factor_scores['growth_trajectory'],
            'market_position_score': factor_scores['market_position'],
            'operational_efficiency_score': factor_scores['operational_efficiency'],
            'competitive_resilience_score': factor_scores['competitive_resilience'],
            'expansion_potential_score': factor_scores['expansion_potential'],
            'expected_roi_min': recommendation['roi_range'][0],
            'expected_roi_max': recommendation['roi_range'][1],
            'payback_years': recommendation['payback_years']
        })
    
    # Save as parquet for integration
    df = pd.DataFrame(scoring_data)
    df.to_parquet(output_path / 'utilization_investment_scores.parquet', index=False)
    
    # Print results summary
    summary = results['scoring_summary']
    print(f"✅ Scoring Analysis Complete!")
    print(f"📊 Stations Analyzed: {summary['total_stations']}")
    print(f"📈 Average Score: {summary['average_score']}/100")
    print(f"📉 Score Range: {summary['min_score']} - {summary['max_score']}")
    print()
    
    print("🏆 Top 5 Investment Opportunities:")
    for i, station in enumerate(results['top_recommendations'][:5], 1):
        info = station['station_info']
        rec = station['investment_recommendation']
        print(f"{i}. {info.get('name', 'Unknown')} ({info.get('operator', 'Unknown')})")
        print(f"   Score: {rec['overall_score']:.1f} | Tier: {rec['tier']}")
        print(f"   ROI: {rec['roi_range'][0]:.1f}-{rec['roi_range'][1]:.1f}% | Payback: {rec['payback_years']:.1f} years")
        print()
    
    print("📊 Investment Tier Distribution:")
    for tier, count in results['tier_distribution'].items():
        percentage = (count / summary['total_stations']) * 100
        print(f"  {tier}: {count} stations ({percentage:.1f}%)")
    
    print(f"\n📁 Results saved to: {results_file}")
    print(f"📄 Integration data: {output_path / 'utilization_investment_scores.parquet'}")

if __name__ == "__main__":
    main()