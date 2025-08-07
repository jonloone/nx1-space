#!/usr/bin/env python3
"""
Utilization Forecasting and Capacity Planning Engine
Advanced forecasting system for commercial ground station capacity planning and demand prediction
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
import logging
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ForecastResult:
    """Container for forecast results"""
    station_id: str
    forecast_horizon_years: int
    baseline_forecast: List[float]
    optimistic_forecast: List[float] 
    pessimistic_forecast: List[float]
    confidence_intervals: List[Tuple[float, float]]
    seasonal_patterns: Dict[str, float]
    growth_drivers: List[str]
    risk_factors: List[str]
    forecast_accuracy_score: float

@dataclass
class CapacityPlan:
    """Capacity expansion plan"""
    station_id: str
    current_utilization: float
    expansion_triggers: List[Dict[str, Any]]
    recommended_expansions: List[Dict[str, Any]]
    investment_timeline: Dict[str, float]
    total_investment_required: float
    roi_projections: List[float]
    payback_analysis: Dict[str, float]

@dataclass
class MarketForecast:
    """Market-level forecast"""
    market_region: str
    demand_forecast: List[float]
    supply_forecast: List[float]
    utilization_forecast: List[float]
    pricing_forecast: List[float]
    market_opportunities: List[str]
    competitive_threats: List[str]

class UtilizationForecastingEngine:
    """Advanced forecasting engine for utilization and capacity planning"""
    
    def __init__(self, data_path: str = '/mnt/blockstorage/nx1-space/kepler-poc/data'):
        self.data_path = Path(data_path)
        self.logger = logging.getLogger(__name__)
        
        # Load historical data
        self.load_analysis_data()
        
        # Forecasting parameters
        self.forecast_horizon = 5  # Years
        self.confidence_level = 0.95
        self.seasonal_cycles = 12  # Monthly cycles
        
        # Industry growth assumptions
        self.industry_growth_rates = {
            'Broadcasting': 0.02,     # Mature, slow growth
            'Enterprise VSAT': 0.15,  # Strong growth
            'Government': 0.08,       # Steady growth
            'HTS': 0.25,             # High growth
            'Mobility': 0.35,        # Explosive growth
            'Gateway': 0.12,         # Moderate growth
            'DTH': 0.01,             # Declining
            'Teleport Services': 0.10 # Steady growth
        }
        
        # Market saturation curves
        self.saturation_curves = {
            'mature_markets': 0.85,    # US, Europe, Japan
            'growth_markets': 0.75,    # Brazil, India, SE Asia
            'emerging_markets': 0.60   # Africa, smaller economies
        }
        
        # External factors
        self.external_factors = self._initialize_external_factors()
    
    def load_analysis_data(self):
        """Load utilization and competitive analysis data"""
        try:
            # Load utilization analysis
            util_file = self.data_path / 'enhanced_commercial_utilization_analysis.json'
            if util_file.exists():
                with open(util_file, 'r') as f:
                    self.utilization_data = json.load(f)
                self.logger.info(f"✅ Loaded utilization data for forecasting")
            else:
                self.utilization_data = {'station_analyses': []}
            
            # Load competitive intelligence
            comp_file = self.data_path / 'competitive_market_intelligence.json'
            if comp_file.exists():
                with open(comp_file, 'r') as f:
                    self.competitive_data = json.load(f)
                self.logger.info(f"✅ Loaded competitive intelligence")
            else:
                self.competitive_data = {}
                
        except Exception as e:
            self.logger.error(f"❌ Error loading data for forecasting: {e}")
            self.utilization_data = {'station_analyses': []}
            self.competitive_data = {}
    
    def _initialize_external_factors(self) -> Dict[str, Any]:
        """Initialize external market factors affecting forecasts"""
        return {
            'satellite_technology_trends': {
                'hts_adoption_rate': 0.20,  # 20% annual increase
                'ka_band_migration': 0.15,  # 15% annual migration
                'sdn_adoption': 0.25,       # Software-defined networking
                'edge_computing': 0.30      # Edge/cloud integration
            },
            'market_drivers': {
                'remote_work_growth': 0.18,     # Post-pandemic trends
                'iot_connectivity': 0.40,       # IoT growth
                '5g_backhaul': 0.25,           # 5G infrastructure
                'streaming_demand': 0.12,       # Video streaming
                'emergency_services': 0.08      # Disaster recovery
            },
            'economic_factors': {
                'gdp_correlation': 0.6,         # Correlation with GDP growth
                'inflation_impact': -0.3,       # Negative impact of inflation
                'capex_cycles': 0.15,          # Capital expenditure cycles
                'regulatory_changes': 0.05      # Regulatory impact
            },
            'competitive_factors': {
                'new_entrants': -0.1,          # LEO constellation impact
                'pricing_pressure': -0.08,      # Competitive pricing
                'service_innovation': 0.12,     # Innovation premium
                'consolidation': 0.05          # Market consolidation
            }
        }
    
    def generate_baseline_forecast(self, station_data: Dict) -> ForecastResult:
        """Generate baseline utilization forecast for a station"""
        
        station_info = station_data['station_info']
        utilization = station_data['utilization_metrics']
        
        station_id = station_info['station_id']
        current_utilization = utilization['average_utilization_percent']
        growth_rate = utilization['growth_rate_percent'] / 100
        capacity_trend = utilization.get('capacity_trend', [current_utilization] * 12)
        service_mix = utilization.get('service_mix', {})
        
        # Analyze historical trend if available
        if len(capacity_trend) >= 6:
            # Fit polynomial trend
            x = np.array(range(len(capacity_trend)))
            y = np.array(capacity_trend)
            
            # Try linear and polynomial fits
            linear_model = LinearRegression()
            linear_model.fit(x.reshape(-1, 1), y)
            
            poly_features = PolynomialFeatures(degree=2)
            x_poly = poly_features.fit_transform(x.reshape(-1, 1))
            poly_model = LinearRegression()
            poly_model.fit(x_poly, y)
            
            # Choose better model based on trend consistency
            linear_pred = linear_model.predict(x.reshape(-1, 1))
            poly_pred = poly_model.predict(x_poly)
            
            linear_error = mean_absolute_error(y, linear_pred)
            poly_error = mean_absolute_error(y, poly_pred)
            
            if poly_error < linear_error * 0.9:  # Polynomial significantly better
                trend_model = 'polynomial'
                forecast_accuracy = max(0.5, 1 - (poly_error / np.mean(y)))
            else:
                trend_model = 'linear'
                forecast_accuracy = max(0.5, 1 - (linear_error / np.mean(y)))
        else:
            trend_model = 'growth_rate'
            forecast_accuracy = 0.7  # Default accuracy for growth rate method
        
        # Generate forecasts for each year
        forecast_years = self.forecast_horizon
        baseline_forecast = []
        optimistic_forecast = []
        pessimistic_forecast = []
        confidence_intervals = []
        
        for year in range(1, forecast_years + 1):
            # Baseline forecast
            if trend_model == 'polynomial' and len(capacity_trend) >= 6:
                # Extrapolate polynomial trend
                future_x = len(capacity_trend) + (year * 12) - 1  # Monthly extrapolation
                future_x_poly = poly_features.transform([[future_x]])
                base_forecast = poly_model.predict(future_x_poly)[0]
            elif trend_model == 'linear' and len(capacity_trend) >= 6:
                # Extrapolate linear trend
                future_x = len(capacity_trend) + (year * 12) - 1
                base_forecast = linear_model.predict([[future_x]])[0]
            else:
                # Growth rate based forecast
                base_forecast = current_utilization * ((1 + growth_rate) ** year)
            
            # Apply service mix evolution
            service_growth_adjustment = self._calculate_service_mix_growth(service_mix, year)
            base_forecast *= service_growth_adjustment
            
            # Apply external factors
            external_adjustment = self._calculate_external_factors_impact(station_info, year)
            base_forecast *= external_adjustment
            
            # Apply market saturation
            country = station_info.get('country', 'Other')
            saturation_limit = self._get_market_saturation_limit(country)
            base_forecast = min(base_forecast, saturation_limit)
            
            baseline_forecast.append(base_forecast)
            
            # Optimistic scenario (20% higher growth)
            optimistic = min(base_forecast * 1.2, saturation_limit * 1.1)
            optimistic_forecast.append(optimistic)
            
            # Pessimistic scenario (30% lower growth, external shocks)
            pessimistic = max(base_forecast * 0.7, current_utilization * 0.8)
            pessimistic_forecast.append(pessimistic)
            
            # Confidence intervals (based on forecast accuracy)
            error_margin = (100 - forecast_accuracy * 100) * 0.5  # Convert to percentage
            ci_lower = max(0, base_forecast - error_margin)
            ci_upper = min(100, base_forecast + error_margin)
            confidence_intervals.append((ci_lower, ci_upper))
        
        # Identify seasonal patterns
        seasonal_patterns = self._analyze_seasonal_patterns(capacity_trend)
        
        # Identify growth drivers and risk factors
        growth_drivers = self._identify_growth_drivers(service_mix, station_info)
        risk_factors = self._identify_risk_factors(station_data)
        
        return ForecastResult(
            station_id=station_id,
            forecast_horizon_years=forecast_years,
            baseline_forecast=baseline_forecast,
            optimistic_forecast=optimistic_forecast,
            pessimistic_forecast=pessimistic_forecast,
            confidence_intervals=confidence_intervals,
            seasonal_patterns=seasonal_patterns,
            growth_drivers=growth_drivers,
            risk_factors=risk_factors,
            forecast_accuracy_score=forecast_accuracy
        )
    
    def _calculate_service_mix_growth(self, service_mix: Dict, year: int) -> float:
        """Calculate growth adjustment based on service mix evolution"""
        
        if not service_mix:
            return 1.0  # No adjustment if no service mix data
        
        total_weight = sum(s.get('weight', 0) for s in service_mix.values())
        if total_weight == 0:
            return 1.0
        
        weighted_growth = 0
        for service, data in service_mix.items():
            weight = data.get('weight', 0) / total_weight
            service_growth = self.industry_growth_rates.get(service, 0.08)
            
            # Apply technology evolution multiplier
            if service in ['HTS', 'Mobility']:
                # High-growth services get technology boost
                tech_multiplier = 1 + (0.05 * year)  # 5% annual tech improvement
            elif service in ['Broadcasting', 'DTH']:
                # Mature services face technology headwinds
                tech_multiplier = 1 - (0.02 * year)  # 2% annual decline
            else:
                tech_multiplier = 1.0
            
            adjusted_growth = service_growth * tech_multiplier
            weighted_growth += weight * adjusted_growth
        
        # Compound over years
        return (1 + weighted_growth) ** year
    
    def _calculate_external_factors_impact(self, station_info: Dict, year: int) -> float:
        """Calculate impact of external factors on utilization"""
        
        country = station_info.get('country', 'Other')
        operator = station_info.get('operator', 'Other')
        
        # Base external impact
        external_impact = 1.0
        
        # Technology trends impact
        tech_factors = self.external_factors['satellite_technology_trends']
        for factor, rate in tech_factors.items():
            # Technology adoption follows S-curve
            adoption_progress = 1 - np.exp(-rate * year)
            if factor in ['hts_adoption_rate', 'sdn_adoption']:
                external_impact *= (1 + adoption_progress * 0.15)  # 15% max boost
        
        # Market drivers impact
        market_factors = self.external_factors['market_drivers']
        for factor, rate in market_factors.items():
            driver_impact = (1 + rate) ** year
            if factor == 'remote_work_growth':
                # Remote work benefits some services more
                external_impact *= (1 + (driver_impact - 1) * 0.1)
            elif factor == 'iot_connectivity':
                external_impact *= (1 + (driver_impact - 1) * 0.05)
        
        # Economic factors
        econ_factors = self.external_factors['economic_factors']
        # Assume moderate economic growth with some volatility
        gdp_growth = 0.025 + np.random.normal(0, 0.01)  # 2.5% +/- 1%
        external_impact *= (1 + gdp_growth * econ_factors['gdp_correlation'])
        
        # Operator-specific factors
        operator_advantages = {
            'Intelsat': 1.02,    # Slight advantage due to scale
            'SES': 1.015,        # European market strength
            'Viasat': 1.03,      # Technology leadership
            'Eutelsat': 1.0,     # Neutral
        }
        external_impact *= operator_advantages.get(operator, 0.98)  # Others slightly disadvantaged
        
        # Regional factors
        regional_multipliers = {
            'United States': 1.01,
            'Germany': 1.005,
            'United Kingdom': 1.005,
            'Japan': 1.0,
            'Singapore': 1.015,
            'Brazil': 1.02,      # Emerging market growth
            'South Africa': 1.01
        }
        external_impact *= regional_multipliers.get(country, 0.995)
        
        return external_impact
    
    def _get_market_saturation_limit(self, country: str) -> float:
        """Get market saturation limit based on country maturity"""
        
        mature_markets = ['United States', 'Germany', 'United Kingdom', 'Japan', 'France']
        growth_markets = ['Brazil', 'India', 'Singapore', 'South Korea']
        
        if country in mature_markets:
            return self.saturation_curves['mature_markets'] * 100
        elif country in growth_markets:
            return self.saturation_curves['growth_markets'] * 100
        else:
            return self.saturation_curves['emerging_markets'] * 100
    
    def _analyze_seasonal_patterns(self, capacity_trend: List[float]) -> Dict[str, float]:
        """Analyze seasonal patterns in capacity utilization"""
        
        if len(capacity_trend) < 12:
            return {'seasonality_strength': 0.0}
        
        # Calculate monthly averages (assuming monthly data)
        monthly_avg = {}
        for i, value in enumerate(capacity_trend):
            month = i % 12
            if month not in monthly_avg:
                monthly_avg[month] = []
            monthly_avg[month].append(value)
        
        # Calculate seasonality metrics
        monthly_means = {month: np.mean(values) for month, values in monthly_avg.items()}
        overall_mean = np.mean(capacity_trend)
        
        # Seasonal variation
        seasonal_variation = np.std(list(monthly_means.values())) / overall_mean if overall_mean > 0 else 0
        
        # Peak and trough months
        peak_month = max(monthly_means, key=monthly_means.get)
        trough_month = min(monthly_means, key=monthly_means.get)
        
        return {
            'seasonality_strength': round(seasonal_variation, 3),
            'peak_month': peak_month,
            'trough_month': trough_month,
            'peak_value': round(monthly_means[peak_month], 1),
            'trough_value': round(monthly_means[trough_month], 1)
        }
    
    def _identify_growth_drivers(self, service_mix: Dict, station_info: Dict) -> List[str]:
        """Identify key growth drivers for the station"""
        
        drivers = []
        
        # Service-based drivers
        for service, data in service_mix.items():
            growth_rate = self.industry_growth_rates.get(service, 0.05)
            weight = data.get('weight', 0)
            
            if growth_rate > 0.15 and weight > 0.1:  # High growth, significant weight
                drivers.append(f"{service} market expansion ({growth_rate:.0%} growth)")
        
        # Geographic drivers
        country = station_info.get('country', 'Other')
        if country in ['Brazil', 'India', 'Singapore']:
            drivers.append(f"{country} emerging market growth")
        
        # Technology drivers
        frequency_bands = station_info.get('frequency_bands', '')
        if 'Ka-band' in frequency_bands:
            drivers.append("Ka-band technology advantage")
        if 'HTS' in str(service_mix):
            drivers.append("HTS capacity efficiency gains")
        
        # Operator drivers
        operator = station_info.get('operator', '')
        if operator in ['Viasat', 'SpaceX']:
            drivers.append("Innovative operator growth strategy")
        
        return drivers if drivers else ["General satellite market growth"]
    
    def _identify_risk_factors(self, station_data: Dict) -> List[str]:
        """Identify risk factors that could impact forecasts"""
        
        risks = []
        
        station_info = station_data['station_info']
        utilization = station_data['utilization_metrics']
        market_data = station_data.get('market_competition', {})
        
        # Utilization risks
        current_util = utilization['average_utilization_percent']
        if current_util > 80:
            risks.append("High utilization - capacity constraints risk")
        elif current_util < 40:
            risks.append("Low utilization - demand weakness risk")
        
        # Competition risks
        competitor_count = market_data.get('competitor_count', 0)
        if competitor_count > 5:
            risks.append("High competitive intensity")
        
        competitive_advantage = market_data.get('competitive_advantage_score', 50)
        if competitive_advantage < 40:
            risks.append("Weak competitive position")
        
        # Technology risks
        frequency_bands = station_info.get('frequency_bands', '')
        if 'C-band' in frequency_bands and 'Ka-band' not in frequency_bands:
            risks.append("Legacy technology exposure")
        
        # Market risks
        country = station_info.get('country', 'Other')
        if country in ['Brazil', 'South Africa']:
            risks.append("Emerging market economic volatility")
        
        # Service mix risks
        service_mix = utilization.get('service_mix', {})
        if 'Broadcasting' in service_mix or 'DTH' in service_mix:
            for service, data in service_mix.items():
                if service in ['Broadcasting', 'DTH'] and data.get('weight', 0) > 0.3:
                    risks.append("Exposure to declining broadcast market")
                    break
        
        # External risks
        risks.append("LEO constellation competition")
        risks.append("Economic recession impact")
        
        return risks
    
    def generate_capacity_plan(self, forecast: ForecastResult, station_data: Dict) -> CapacityPlan:
        """Generate capacity expansion plan based on forecast"""
        
        station_id = forecast.station_id
        current_utilization = station_data['utilization_metrics']['average_utilization_percent']
        
        # Define expansion triggers
        triggers = []
        for year, util in enumerate(forecast.baseline_forecast, 1):
            if util > 80:
                triggers.append({
                    'year': year,
                    'trigger_utilization': util,
                    'trigger_type': 'Capacity Constraint',
                    'urgency': 'High' if util > 90 else 'Medium'
                })
        
        # Recommended expansions
        expansions = []
        total_investment = 0
        
        for trigger in triggers:
            year = trigger['year']
            # Calculate required expansion
            current_capacity = 100  # Assume 100% is current capacity
            required_capacity = forecast.baseline_forecast[year - 1] / 0.75  # Target 75% utilization
            expansion_percentage = (required_capacity - current_capacity) / current_capacity
            
            # Estimate expansion cost
            base_expansion_cost = 50_000_000  # $50M base expansion
            expansion_cost = base_expansion_cost * expansion_percentage
            
            expansion = {
                'year': year,
                'expansion_type': 'Antenna/Capacity Upgrade',
                'expansion_percentage': round(expansion_percentage * 100, 1),
                'estimated_cost': expansion_cost,
                'justification': f"Utilization reaching {trigger['trigger_utilization']:.1f}%"
            }
            expansions.append(expansion)
            total_investment += expansion_cost
        
        # Investment timeline
        timeline = {}
        for expansion in expansions:
            timeline[f"Year {expansion['year']}"] = expansion['estimated_cost']
        
        # ROI projections
        roi_projections = []
        for year in range(1, forecast.forecast_horizon_years + 1):
            # Estimate revenue increase from expansion
            baseline_revenue = 100_000_000  # $100M baseline revenue
            utilization_factor = forecast.baseline_forecast[year - 1] / current_utilization
            projected_revenue = baseline_revenue * utilization_factor
            
            # Calculate ROI
            if total_investment > 0:
                roi = ((projected_revenue - baseline_revenue) / total_investment) * 100
            else:
                roi = 0
            
            roi_projections.append(roi)
        
        # Payback analysis
        payback_years = 0
        cumulative_return = 0
        for year, roi in enumerate(roi_projections, 1):
            annual_return = total_investment * (roi / 100)
            cumulative_return += annual_return
            if cumulative_return >= total_investment and payback_years == 0:
                payback_years = year
        
        payback_analysis = {
            'simple_payback_years': payback_years if payback_years > 0 else forecast.forecast_horizon_years,
            'total_investment': total_investment,
            'projected_5_year_return': cumulative_return,
            'net_present_value': cumulative_return - total_investment
        }
        
        return CapacityPlan(
            station_id=station_id,
            current_utilization=current_utilization,
            expansion_triggers=triggers,
            recommended_expansions=expansions,
            investment_timeline=timeline,
            total_investment_required=total_investment,
            roi_projections=roi_projections,
            payback_analysis=payback_analysis
        )
    
    def generate_market_forecast(self, region: str = 'Global') -> MarketForecast:
        """Generate market-level forecast for a region"""
        
        # Aggregate station data by region/market
        market_stations = []
        if self.utilization_data.get('station_analyses'):
            for station in self.utilization_data['station_analyses']:
                if region == 'Global' or station['station_info'].get('country') == region:
                    market_stations.append(station)
        
        if not market_stations:
            # Return empty forecast if no data
            return MarketForecast(
                market_region=region,
                demand_forecast=[],
                supply_forecast=[],
                utilization_forecast=[],
                pricing_forecast=[],
                market_opportunities=[],
                competitive_threats=[]
            )
        
        # Aggregate current metrics
        total_bandwidth = sum(s['utilization_metrics']['bandwidth_demand_gbps'] for s in market_stations)
        avg_utilization = np.mean([s['utilization_metrics']['average_utilization_percent'] for s in market_stations])
        avg_growth = np.mean([s['utilization_metrics']['growth_rate_percent'] for s in market_stations])
        
        # Generate market forecasts
        years = self.forecast_horizon
        demand_forecast = []
        supply_forecast = []
        utilization_forecast = []
        pricing_forecast = []
        
        for year in range(1, years + 1):
            # Demand growth (based on service mix and external factors)
            demand_growth = (avg_growth / 100) * year
            external_boost = 0.05 * year  # 5% annual external demand boost
            total_demand_growth = demand_growth + external_boost
            
            projected_demand = total_bandwidth * (1 + total_demand_growth)
            demand_forecast.append(projected_demand)
            
            # Supply growth (more conservative)
            supply_growth = demand_growth * 0.8  # Supply lags demand
            projected_supply = total_bandwidth * (1 + supply_growth)
            supply_forecast.append(projected_supply)
            
            # Utilization forecast
            if projected_supply > 0:
                projected_utilization = min(95, (projected_demand / projected_supply) * avg_utilization)
            else:
                projected_utilization = avg_utilization
            utilization_forecast.append(projected_utilization)
            
            # Pricing forecast (based on supply/demand balance)
            supply_demand_ratio = projected_supply / projected_demand if projected_demand > 0 else 1
            base_price = 100  # Index base
            
            if supply_demand_ratio < 1.1:  # Tight market
                price_premium = 1 + (1.1 - supply_demand_ratio) * 2
            else:  # Oversupply
                price_premium = max(0.8, 1 - (supply_demand_ratio - 1.1) * 0.5)
            
            pricing_forecast.append(base_price * price_premium)
        
        # Market opportunities and threats
        opportunities = []
        threats = []
        
        # Analyze utilization trends
        if utilization_forecast[-1] > 80:
            opportunities.append("High demand creates expansion opportunities")
        elif utilization_forecast[-1] < 60:
            threats.append("Market oversupply may pressure pricing")
        
        # Technology opportunities
        if region in ['United States', 'Singapore', 'Germany']:
            opportunities.append("Advanced technology adoption potential")
        
        # Competitive threats
        if len(market_stations) > 5:
            threats.append("High market competition intensity")
        
        # External threats
        threats.append("LEO constellation market disruption")
        
        return MarketForecast(
            market_region=region,
            demand_forecast=demand_forecast,
            supply_forecast=supply_forecast,
            utilization_forecast=utilization_forecast,
            pricing_forecast=pricing_forecast,
            market_opportunities=opportunities,
            competitive_threats=threats
        )
    
    def run_comprehensive_forecasting(self) -> Dict[str, Any]:
        """Run comprehensive forecasting analysis"""
        
        logger.info("📈 Starting Comprehensive Utilization Forecasting")
        logger.info("=" * 60)
        
        if not self.utilization_data.get('station_analyses'):
            logger.error("❌ No utilization data available for forecasting")
            return {}
        
        results = {
            'forecasting_metadata': {
                'timestamp': datetime.now().isoformat(),
                'methodology': 'Advanced Utilization Forecasting v2.0',
                'forecast_horizon_years': self.forecast_horizon,
                'confidence_level': self.confidence_level,
                'stations_forecasted': len(self.utilization_data['station_analyses'])
            },
            'station_forecasts': [],
            'capacity_plans': [],
            'market_forecasts': [],
            'forecasting_summary': {}
        }
        
        # Generate forecasts for each station
        for station_data in self.utilization_data['station_analyses']:
            try:
                # Generate forecast
                forecast = self.generate_baseline_forecast(station_data)
                
                # Generate capacity plan
                capacity_plan = self.generate_capacity_plan(forecast, station_data)
                
                # Compile station forecast
                station_forecast = {
                    'station_info': station_data['station_info'],
                    'forecast_results': {
                        'baseline_forecast': forecast.baseline_forecast,
                        'optimistic_forecast': forecast.optimistic_forecast,
                        'pessimistic_forecast': forecast.pessimistic_forecast,
                        'confidence_intervals': forecast.confidence_intervals,
                        'seasonal_patterns': forecast.seasonal_patterns,
                        'growth_drivers': forecast.growth_drivers,
                        'risk_factors': forecast.risk_factors,
                        'forecast_accuracy': forecast.forecast_accuracy_score
                    },
                    'capacity_plan': {
                        'expansion_triggers': capacity_plan.expansion_triggers,
                        'recommended_expansions': capacity_plan.recommended_expansions,
                        'investment_timeline': capacity_plan.investment_timeline,
                        'total_investment_required': capacity_plan.total_investment_required,
                        'roi_projections': capacity_plan.roi_projections,
                        'payback_analysis': capacity_plan.payback_analysis
                    }
                }
                
                results['station_forecasts'].append(station_forecast)
                
                station_name = station_data['station_info']['name']
                logger.info(f"✅ Forecasted {station_name} - 5yr growth: {forecast.baseline_forecast[-1]:.1f}%")
                
            except Exception as e:
                station_id = station_data['station_info']['station_id']
                logger.error(f"❌ Error forecasting station {station_id}: {e}")
        
        # Generate market-level forecasts
        countries = set(s['station_info']['country'] for s in self.utilization_data['station_analyses'])
        for country in list(countries)[:5]:  # Top 5 countries
            try:
                market_forecast = self.generate_market_forecast(country)
                
                market_data = {
                    'market_region': market_forecast.market_region,
                    'demand_forecast': market_forecast.demand_forecast,
                    'supply_forecast': market_forecast.supply_forecast,
                    'utilization_forecast': market_forecast.utilization_forecast,
                    'pricing_forecast': market_forecast.pricing_forecast,
                    'market_opportunities': market_forecast.market_opportunities,
                    'competitive_threats': market_forecast.competitive_threats
                }
                
                results['market_forecasts'].append(market_data)
                
            except Exception as e:
                logger.error(f"❌ Error forecasting market {country}: {e}")
        
        # Generate summary
        if results['station_forecasts']:
            baseline_forecasts = [f['forecast_results']['baseline_forecast'][-1] for f in results['station_forecasts']]
            total_investment = sum(f['capacity_plan']['total_investment_required'] for f in results['station_forecasts'])
            
            results['forecasting_summary'] = {
                'total_stations': len(results['station_forecasts']),
                'average_5_year_utilization': round(np.mean(baseline_forecasts), 1),
                'utilization_range': [round(min(baseline_forecasts), 1), round(max(baseline_forecasts), 1)],
                'stations_requiring_expansion': sum(1 for f in results['station_forecasts'] if f['capacity_plan']['expansion_triggers']),
                'total_industry_investment_required': total_investment,
                'high_growth_stations': len([f for f in results['station_forecasts'] if f['forecast_results']['baseline_forecast'][-1] > 80]),
                'average_forecast_accuracy': round(np.mean([f['forecast_results']['forecast_accuracy'] for f in results['station_forecasts']]), 2)
            }
        
        logger.info(f"✅ Forecasting complete: {len(results['station_forecasts'])} stations forecasted")
        
        return results

def main():
    """Run utilization forecasting and capacity planning"""
    
    print("📈 Utilization Forecasting and Capacity Planning Engine")
    print("=" * 65)
    print("Advanced forecasting for commercial ground station capacity planning")
    print()
    
    # Initialize forecasting engine
    engine = UtilizationForecastingEngine()
    
    # Run comprehensive forecasting
    results = engine.run_comprehensive_forecasting()
    
    if not results:
        print("❌ No forecasting results generated - check data availability")
        return
    
    # Save results
    output_path = Path('/mnt/blockstorage/nx1-space/kepler-poc/data')
    output_path.mkdir(exist_ok=True)
    
    results_file = output_path / 'utilization_forecasting_analysis.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    # Create summary dataset
    forecast_data = []
    for station_forecast in results['station_forecasts']:
        station_info = station_forecast['station_info']
        forecast_results = station_forecast['forecast_results']
        capacity_plan = station_forecast['capacity_plan']
        
        forecast_data.append({
            'station_id': station_info['station_id'],
            'name': station_info['name'],
            'operator': station_info['operator'],
            'country': station_info['country'],
            'baseline_5_year_utilization': forecast_results['baseline_forecast'][-1],
            'optimistic_5_year_utilization': forecast_results['optimistic_forecast'][-1],
            'pessimistic_5_year_utilization': forecast_results['pessimistic_forecast'][-1],
            'forecast_accuracy': forecast_results['forecast_accuracy'],
            'expansion_required': len(capacity_plan['expansion_triggers']) > 0,
            'total_investment_required': capacity_plan['total_investment_required'],
            'payback_years': capacity_plan['payback_analysis']['simple_payback_years'],
            'growth_drivers_count': len(forecast_results['growth_drivers']),
            'risk_factors_count': len(forecast_results['risk_factors'])
        })
    
    # Save forecast summary
    df = pd.DataFrame(forecast_data)
    df.to_parquet(output_path / 'utilization_forecasts.parquet', index=False)
    
    # Print results
    summary = results['forecasting_summary']
    print(f"✅ Forecasting Analysis Complete!")
    print(f"📊 Stations Forecasted: {summary['total_stations']}")
    print(f"📈 Average 5-Year Utilization: {summary['average_5_year_utilization']:.1f}%")
    print(f"📉 Utilization Range: {summary['utilization_range'][0]:.1f}% - {summary['utilization_range'][1]:.1f}%")
    print(f"🏗️ Stations Requiring Expansion: {summary['stations_requiring_expansion']}")
    print(f"💰 Total Investment Required: ${summary['total_industry_investment_required']/1_000_000:.1f}M")
    print()
    
    print("🚀 High-Growth Stations (>80% utilization by Year 5):")
    high_growth = [f for f in results['station_forecasts'] 
                   if f['forecast_results']['baseline_forecast'][-1] > 80][:5]
    
    for i, station in enumerate(high_growth, 1):
        info = station['station_info']
        forecast = station['forecast_results']
        print(f"{i}. {info['name']} ({info['operator']})")
        print(f"   5-Year Utilization: {forecast['baseline_forecast'][-1]:.1f}%")
        print(f"   Key Drivers: {', '.join(forecast['growth_drivers'][:2])}")
    
    if results['market_forecasts']:
        print(f"\n🌍 Market Forecasts Generated: {len(results['market_forecasts'])} regions")
    
    print(f"\n📁 Full results saved to: {results_file}")
    print(f"📄 Summary data: {output_path / 'utilization_forecasts.parquet'}")

if __name__ == "__main__":
    main()