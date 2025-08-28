"""
Business Intelligence Agent using CrewAI
Specializes in market analysis, revenue optimization, and strategic planning for satellite operations
"""

from crewai import Agent
from typing import Optional, Dict, Any, List, Tuple
import math
import json
from datetime import datetime, timedelta
from .base_agent import BaseCrewAgent

class BusinessIntelligenceAgent(BaseCrewAgent):
    """Expert agent for business intelligence and strategic analysis"""
    
    def __init__(self):
        super().__init__(
            role="Senior Business Intelligence Analyst",
            goal="Provide strategic business insights, revenue optimization, and market analysis for satellite ground station operations",
            backstory="""You are a seasoned business intelligence analyst with 18+ years of experience in 
            telecommunications and satellite industry. You have expertise in:
            - Market analysis and competitive intelligence
            - Revenue optimization and pricing strategies
            - Customer segmentation and behavior analysis
            - Financial modeling and forecasting
            - Strategic planning and investment analysis
            - Risk assessment and mitigation
            - Partnership and M&A evaluation
            - Industry trends and emerging markets
            You excel at translating complex technical data into actionable business insights.""",
            verbose=True,
            allow_delegation=False,
            tools=[]
        )
        
    def market_analysis(self, 
                       region: str,
                       market_size_usd_millions: float,
                       competitors: List[Dict],
                       growth_rate: float = 0.08) -> Dict[str, Any]:
        """Perform comprehensive market analysis for a region"""
        
        # Market sizing
        current_year = datetime.now().year
        market_forecast = []
        for year_offset in range(5):
            year = current_year + year_offset
            size = market_size_usd_millions * ((1 + growth_rate) ** year_offset)
            market_forecast.append({
                "year": year,
                "market_size_millions": round(size, 2),
                "growth_from_base": f"{((size / market_size_usd_millions) - 1) * 100:.1f}%"
            })
        
        # Competitive analysis
        total_competitor_capacity = sum(c.get("capacity_gbps", 0) for c in competitors)
        market_shares = []
        for comp in competitors:
            capacity = comp.get("capacity_gbps", 0)
            share = (capacity / total_competitor_capacity * 100) if total_competitor_capacity > 0 else 0
            market_shares.append({
                "company": comp["name"],
                "market_share": round(share, 2),
                "capacity_gbps": capacity,
                "strengths": comp.get("strengths", []),
                "weaknesses": comp.get("weaknesses", [])
            })
        
        # Market opportunity assessment
        tam = market_size_usd_millions  # Total Addressable Market
        sam = tam * 0.3  # Serviceable Addressable Market (30% assumption)
        som = sam * 0.1  # Serviceable Obtainable Market (10% of SAM)
        
        # Strategic positioning
        market_position = self._determine_market_position(market_shares)
        
        return {
            "region": region,
            "market_overview": {
                "current_size_millions": market_size_usd_millions,
                "annual_growth_rate": f"{growth_rate * 100:.1f}%",
                "5_year_forecast": market_forecast
            },
            "competitive_landscape": {
                "total_competitors": len(competitors),
                "market_concentration": self._calculate_market_concentration(market_shares),
                "competitor_analysis": market_shares[:5]  # Top 5 competitors
            },
            "market_opportunity": {
                "tam_millions": round(tam, 2),
                "sam_millions": round(sam, 2),
                "som_millions": round(som, 2),
                "penetration_strategy": self._recommend_penetration_strategy(market_position)
            },
            "strategic_recommendations": self._get_market_recommendations(market_position, growth_rate),
            "risk_factors": self._identify_market_risks(region, competitors)
        }
    
    def revenue_optimization(self,
                           current_revenue: Dict[str, float],
                           utilization_rates: Dict[str, float],
                           pricing_model: str = "usage_based") -> Dict[str, Any]:
        """Analyze and optimize revenue streams"""
        
        total_revenue = sum(current_revenue.values())
        avg_utilization = sum(utilization_rates.values()) / len(utilization_rates) if utilization_rates else 0
        
        # Revenue per utilized capacity
        revenue_efficiency = total_revenue / avg_utilization if avg_utilization > 0 else 0
        
        # Identify optimization opportunities
        opportunities = []
        
        # Underutilized high-margin services
        for service, revenue in current_revenue.items():
            if service in utilization_rates:
                util = utilization_rates[service]
                margin = revenue / total_revenue * 100 if total_revenue > 0 else 0
                
                if util < 60 and margin > 15:
                    opportunities.append({
                        "service": service,
                        "opportunity": "Underutilized high-margin service",
                        "current_utilization": round(util, 2),
                        "revenue_share": round(margin, 2),
                        "potential_increase": round(revenue * 0.4, 2),
                        "strategy": "Targeted marketing and sales focus"
                    })
                elif util > 90:
                    opportunities.append({
                        "service": service,
                        "opportunity": "Capacity-constrained service",
                        "current_utilization": round(util, 2),
                        "revenue_share": round(margin, 2),
                        "potential_increase": round(revenue * 0.15, 2),
                        "strategy": "Premium pricing for peak capacity"
                    })
        
        # Pricing optimization
        pricing_recommendations = self._optimize_pricing(current_revenue, utilization_rates, pricing_model)
        
        # Customer segment analysis
        segment_analysis = self._analyze_customer_segments(current_revenue)
        
        # Revenue forecast with optimization
        optimized_forecast = self._forecast_optimized_revenue(current_revenue, opportunities)
        
        return {
            "current_performance": {
                "total_revenue": round(total_revenue, 2),
                "average_utilization": round(avg_utilization, 2),
                "revenue_efficiency": round(revenue_efficiency, 2)
            },
            "optimization_opportunities": opportunities,
            "pricing_strategy": pricing_recommendations,
            "customer_segments": segment_analysis,
            "revenue_forecast": optimized_forecast,
            "implementation_roadmap": self._create_revenue_roadmap(opportunities),
            "expected_improvement": {
                "revenue_increase": f"{15 + len(opportunities) * 3}%",
                "timeline": "6-12 months",
                "confidence": "High" if avg_utilization < 70 else "Medium"
            }
        }
    
    def customer_lifetime_value(self,
                               customer_data: Dict[str, Any],
                               churn_rate: float = 0.1,
                               discount_rate: float = 0.1) -> Dict[str, Any]:
        """Calculate and analyze customer lifetime value"""
        
        # Basic CLV calculation
        avg_revenue_per_user = customer_data.get("arpu", 10000)
        gross_margin = customer_data.get("gross_margin", 0.6)
        customer_lifespan_years = 1 / churn_rate if churn_rate > 0 else 10
        
        # Simple CLV
        simple_clv = avg_revenue_per_user * gross_margin * customer_lifespan_years
        
        # Discounted CLV
        discounted_clv = 0
        for year in range(int(customer_lifespan_years)):
            yearly_value = avg_revenue_per_user * gross_margin * ((1 - churn_rate) ** year)
            discounted_value = yearly_value / ((1 + discount_rate) ** year)
            discounted_clv += discounted_value
        
        # Segment analysis
        segments = {
            "enterprise": {
                "clv_multiplier": 2.5,
                "churn_rate": churn_rate * 0.5,
                "growth_potential": "High"
            },
            "government": {
                "clv_multiplier": 3.0,
                "churn_rate": churn_rate * 0.3,
                "growth_potential": "Stable"
            },
            "commercial": {
                "clv_multiplier": 1.0,
                "churn_rate": churn_rate,
                "growth_potential": "Medium"
            }
        }
        
        segment_clvs = {}
        for segment, params in segments.items():
            segment_clvs[segment] = {
                "clv": round(simple_clv * params["clv_multiplier"], 2),
                "churn_rate": round(params["churn_rate"] * 100, 2),
                "retention_rate": round((1 - params["churn_rate"]) * 100, 2),
                "growth_potential": params["growth_potential"]
            }
        
        # CAC to CLV ratio
        customer_acquisition_cost = customer_data.get("cac", 5000)
        cac_to_clv = customer_acquisition_cost / simple_clv if simple_clv > 0 else float('inf')
        
        return {
            "clv_analysis": {
                "simple_clv": round(simple_clv, 2),
                "discounted_clv": round(discounted_clv, 2),
                "customer_lifespan_years": round(customer_lifespan_years, 2),
                "payback_period_months": round(customer_acquisition_cost / (avg_revenue_per_user * gross_margin / 12), 2)
            },
            "segment_analysis": segment_clvs,
            "metrics": {
                "arpu": avg_revenue_per_user,
                "cac": customer_acquisition_cost,
                "cac_to_clv_ratio": round(cac_to_clv, 2),
                "ltv_cac_ratio": round(1 / cac_to_clv, 2) if cac_to_clv > 0 else 0,
                "health_score": "Excellent" if cac_to_clv < 0.33 else "Good" if cac_to_clv < 0.5 else "Poor"
            },
            "retention_strategies": self._recommend_retention_strategies(churn_rate),
            "acquisition_strategies": self._recommend_acquisition_strategies(cac_to_clv)
        }
    
    def investment_analysis(self,
                          investment_amount: float,
                          investment_type: str,
                          expected_returns: List[float],
                          risk_factors: Optional[Dict] = None) -> Dict[str, Any]:
        """Analyze investment opportunities and ROI"""
        
        # NPV calculation
        discount_rate = 0.12  # 12% discount rate
        npv = -investment_amount
        for year, cash_flow in enumerate(expected_returns, 1):
            npv += cash_flow / ((1 + discount_rate) ** year)
        
        # IRR calculation (simplified)
        irr = self._calculate_irr([-investment_amount] + expected_returns)
        
        # Payback period
        cumulative_cash = 0
        payback_period = None
        for year, cash_flow in enumerate(expected_returns, 1):
            cumulative_cash += cash_flow
            if cumulative_cash >= investment_amount and payback_period is None:
                payback_period = year
        
        # Risk assessment
        risk_score = 0
        if risk_factors:
            risk_weights = {
                "market_risk": 0.3,
                "technical_risk": 0.3,
                "regulatory_risk": 0.2,
                "operational_risk": 0.2
            }
            for risk_type, weight in risk_weights.items():
                risk_score += risk_factors.get(risk_type, 5) * weight
        
        risk_adjusted_return = irr - (risk_score / 100)
        
        # Investment recommendation
        if npv > 0 and irr > discount_rate and payback_period and payback_period <= 3:
            recommendation = "Strongly Recommended"
        elif npv > 0 and irr > discount_rate:
            recommendation = "Recommended"
        elif npv > 0:
            recommendation = "Marginal - Consider alternatives"
        else:
            recommendation = "Not Recommended"
        
        # Scenario analysis
        scenarios = self._perform_scenario_analysis(investment_amount, expected_returns)
        
        return {
            "investment_summary": {
                "amount": investment_amount,
                "type": investment_type,
                "expected_returns": expected_returns,
                "total_expected_return": sum(expected_returns)
            },
            "financial_metrics": {
                "npv": round(npv, 2),
                "irr": f"{irr:.1%}" if irr else "N/A",
                "payback_period_years": payback_period,
                "roi": f"{(sum(expected_returns) / investment_amount - 1) * 100:.1f}%",
                "risk_adjusted_return": f"{risk_adjusted_return:.1%}"
            },
            "risk_assessment": {
                "overall_risk_score": round(risk_score, 2),
                "risk_level": "High" if risk_score > 7 else "Medium" if risk_score > 4 else "Low",
                "key_risks": self._identify_investment_risks(investment_type, risk_factors)
            },
            "scenario_analysis": scenarios,
            "recommendation": recommendation,
            "strategic_value": self._assess_strategic_value(investment_type)
        }
    
    def partnership_evaluation(self,
                             partner_profile: Dict[str, Any],
                             synergy_areas: List[str],
                             financial_terms: Dict[str, float]) -> Dict[str, Any]:
        """Evaluate potential partnerships and strategic alliances"""
        
        # Partner scoring
        partner_score = 0
        scoring_criteria = {
            "market_presence": partner_profile.get("market_share", 0) * 2,
            "technical_capability": partner_profile.get("tech_score", 5) * 1.5,
            "financial_strength": partner_profile.get("financial_rating", 5) * 1.5,
            "cultural_fit": partner_profile.get("culture_score", 5),
            "strategic_alignment": len(synergy_areas) * 2
        }
        
        for criterion, score in scoring_criteria.items():
            partner_score += score
        
        partner_score = min(100, partner_score * 2)  # Normalize to 100
        
        # Synergy valuation
        synergy_value = 0
        synergy_details = []
        for area in synergy_areas:
            value = self._calculate_synergy_value(area, partner_profile)
            synergy_value += value
            synergy_details.append({
                "area": area,
                "estimated_value": value,
                "realization_timeline": "6-12 months",
                "probability": "High" if partner_score > 70 else "Medium"
            })
        
        # Deal structure analysis
        revenue_share = financial_terms.get("revenue_share", 0.5)
        investment_required = financial_terms.get("investment", 0)
        expected_annual_value = financial_terms.get("expected_value", 1000000)
        
        # Financial projection
        partnership_npv = self._calculate_partnership_npv(
            investment_required,
            expected_annual_value,
            revenue_share,
            5  # 5-year horizon
        )
        
        # Risk-reward analysis
        risks = self._identify_partnership_risks(partner_profile)
        rewards = self._identify_partnership_rewards(synergy_areas, partner_profile)
        
        return {
            "partner_assessment": {
                "company": partner_profile.get("name", "Partner"),
                "overall_score": round(partner_score, 2),
                "rating": "Excellent" if partner_score > 80 else "Good" if partner_score > 60 else "Fair" if partner_score > 40 else "Poor",
                "key_strengths": partner_profile.get("strengths", []),
                "concerns": partner_profile.get("weaknesses", [])
            },
            "synergy_analysis": {
                "total_synergy_value": round(synergy_value, 2),
                "synergy_areas": synergy_details,
                "realization_confidence": "High" if partner_score > 70 else "Medium" if partner_score > 50 else "Low"
            },
            "financial_analysis": {
                "deal_structure": {
                    "revenue_share": f"{revenue_share * 100:.0f}%",
                    "initial_investment": investment_required,
                    "expected_annual_value": expected_annual_value
                },
                "projected_npv": round(partnership_npv, 2),
                "breakeven_months": round(investment_required / (expected_annual_value * revenue_share / 12), 2) if expected_annual_value > 0 else "N/A"
            },
            "risk_reward": {
                "key_risks": risks,
                "key_rewards": rewards,
                "risk_mitigation": self._recommend_risk_mitigation(risks)
            },
            "recommendation": self._make_partnership_recommendation(partner_score, partnership_npv, risks),
            "negotiation_priorities": self._identify_negotiation_priorities(financial_terms, partner_profile)
        }
    
    def pricing_strategy_analysis(self,
                                 costs: Dict[str, float],
                                 competitor_pricing: List[Dict],
                                 market_position: str = "challenger") -> Dict[str, Any]:
        """Analyze and recommend pricing strategies"""
        
        # Cost analysis
        total_costs = sum(costs.values())
        fixed_costs = costs.get("fixed", total_costs * 0.6)
        variable_costs = costs.get("variable", total_costs * 0.4)
        
        # Competitor pricing analysis
        avg_competitor_price = sum(c.get("price", 0) for c in competitor_pricing) / len(competitor_pricing) if competitor_pricing else 0
        min_competitor_price = min(c.get("price", 0) for c in competitor_pricing) if competitor_pricing else 0
        max_competitor_price = max(c.get("price", 0) for c in competitor_pricing) if competitor_pricing else 0
        
        # Pricing strategies based on market position
        strategies = {
            "leader": {
                "strategy": "Premium Pricing",
                "target_price": max_competitor_price * 1.1,
                "margin": 0.4,
                "rationale": "Market leader can command premium"
            },
            "challenger": {
                "strategy": "Competitive Pricing",
                "target_price": avg_competitor_price * 0.95,
                "margin": 0.25,
                "rationale": "Slightly undercut to gain market share"
            },
            "niche": {
                "strategy": "Value-Based Pricing",
                "target_price": avg_competitor_price * 1.2,
                "margin": 0.35,
                "rationale": "Premium for specialized services"
            },
            "new_entrant": {
                "strategy": "Penetration Pricing",
                "target_price": min_competitor_price * 0.9,
                "margin": 0.15,
                "rationale": "Aggressive pricing to establish presence"
            }
        }
        
        selected_strategy = strategies.get(market_position, strategies["challenger"])
        
        # Price elasticity estimation
        elasticity = -1.5 if market_position == "new_entrant" else -1.0 if market_position == "challenger" else -0.5
        
        # Revenue optimization curve
        price_points = []
        for multiplier in [0.8, 0.9, 1.0, 1.1, 1.2]:
            price = selected_strategy["target_price"] * multiplier
            volume_change = (1 + elasticity * (multiplier - 1))
            revenue = price * volume_change
            margin = (price - variable_costs) / price if price > 0 else 0
            
            price_points.append({
                "price": round(price, 2),
                "relative_to_target": f"{multiplier * 100:.0f}%",
                "expected_volume_change": f"{(volume_change - 1) * 100:.1f}%",
                "revenue_index": round(revenue, 2),
                "margin": f"{margin * 100:.1f}%"
            })
        
        # Bundle pricing options
        bundles = self._create_bundle_options(costs, selected_strategy["target_price"])
        
        return {
            "market_analysis": {
                "average_competitor_price": round(avg_competitor_price, 2),
                "price_range": f"${min_competitor_price:.2f} - ${max_competitor_price:.2f}",
                "market_position": market_position
            },
            "recommended_strategy": selected_strategy,
            "price_sensitivity": {
                "elasticity": elasticity,
                "sensitivity_level": "High" if abs(elasticity) > 1.5 else "Medium" if abs(elasticity) > 0.8 else "Low",
                "optimal_price_points": price_points
            },
            "pricing_models": {
                "usage_based": self._design_usage_pricing(costs, selected_strategy["margin"]),
                "tiered": self._design_tiered_pricing(selected_strategy["target_price"]),
                "bundle": bundles
            },
            "implementation": {
                "rollout_plan": self._create_pricing_rollout(),
                "monitoring_metrics": ["Conversion rate", "ARPU", "Churn rate", "Market share"],
                "adjustment_triggers": ["Volume change > 20%", "Margin < 20%", "Competitor price change > 10%"]
            }
        }
    
    # Helper methods
    def _determine_market_position(self, market_shares: List[Dict]) -> str:
        """Determine market position based on competitive landscape"""
        if not market_shares:
            return "new_entrant"
        
        top_share = max(m["market_share"] for m in market_shares)
        if top_share < 20:
            return "fragmented"
        elif len([m for m in market_shares if m["market_share"] > 15]) > 3:
            return "competitive"
        else:
            return "consolidated"
    
    def _calculate_market_concentration(self, shares: List[Dict]) -> str:
        """Calculate market concentration (HHI)"""
        hhi = sum((s["market_share"] ** 2) for s in shares)
        if hhi < 1500:
            return "Low concentration"
        elif hhi < 2500:
            return "Moderate concentration"
        else:
            return "High concentration"
    
    def _recommend_penetration_strategy(self, position: str) -> str:
        """Recommend market penetration strategy"""
        strategies = {
            "fragmented": "Aggressive expansion - consolidation opportunity",
            "competitive": "Differentiation focus - unique value proposition",
            "consolidated": "Niche targeting - specialized services",
            "new_entrant": "Partnership strategy - leverage existing players"
        }
        return strategies.get(position, "Balanced growth strategy")
    
    def _get_market_recommendations(self, position: str, growth: float) -> List[str]:
        """Get strategic market recommendations"""
        recommendations = []
        
        if growth > 0.1:
            recommendations.append("High growth market - prioritize capacity expansion")
        
        if position == "fragmented":
            recommendations.append("Consider acquisitions to consolidate market position")
        elif position == "competitive":
            recommendations.append("Focus on service differentiation and customer retention")
        
        recommendations.append("Develop strategic partnerships for market access")
        recommendations.append("Invest in next-generation technology for competitive advantage")
        
        return recommendations
    
    def _identify_market_risks(self, region: str, competitors: List[Dict]) -> List[str]:
        """Identify market risks"""
        risks = []
        
        if len(competitors) > 10:
            risks.append("High competition may pressure margins")
        
        if "emerging" in region.lower():
            risks.append("Regulatory uncertainty in emerging markets")
        
        risks.append("Technology disruption from LEO constellations")
        risks.append("Economic downturn impact on enterprise spending")
        
        return risks
    
    def _optimize_pricing(self, revenue: Dict, utilization: Dict, model: str) -> Dict:
        """Optimize pricing based on utilization and revenue"""
        return {
            "current_model": model,
            "recommended_changes": [
                "Implement dynamic pricing for peak hours",
                "Volume discounts for high-utilization customers",
                "Premium tier for guaranteed capacity"
            ],
            "expected_revenue_impact": "+12-18%",
            "implementation_complexity": "Medium"
        }
    
    def _analyze_customer_segments(self, revenue: Dict) -> List[Dict]:
        """Analyze customer segments"""
        return [
            {
                "segment": "Enterprise",
                "revenue_share": "45%",
                "growth_rate": "12%",
                "churn_rate": "5%",
                "focus": "Retention and upsell"
            },
            {
                "segment": "Government",
                "revenue_share": "30%",
                "growth_rate": "8%",
                "churn_rate": "3%",
                "focus": "Long-term contracts"
            },
            {
                "segment": "Commercial",
                "revenue_share": "25%",
                "growth_rate": "15%",
                "churn_rate": "12%",
                "focus": "Acquisition and onboarding"
            }
        ]
    
    def _forecast_optimized_revenue(self, current: Dict, opportunities: List[Dict]) -> List[Dict]:
        """Forecast revenue with optimization"""
        base_revenue = sum(current.values())
        growth_rate = 0.1 + len(opportunities) * 0.02
        
        forecast = []
        for quarter in range(1, 5):
            revenue = base_revenue * (1 + growth_rate * quarter / 4)
            forecast.append({
                "quarter": f"Q{quarter}",
                "revenue": round(revenue, 2),
                "growth": f"{growth_rate * quarter / 4 * 100:.1f}%"
            })
        
        return forecast
    
    def _create_revenue_roadmap(self, opportunities: List[Dict]) -> List[Dict]:
        """Create revenue optimization roadmap"""
        return [
            {
                "phase": "Quick Wins",
                "timeline": "0-3 months",
                "actions": ["Price optimization", "Upsell campaigns"],
                "expected_impact": "+5-8%"
            },
            {
                "phase": "Growth Initiatives",
                "timeline": "3-6 months",
                "actions": ["New service launches", "Market expansion"],
                "expected_impact": "+8-12%"
            },
            {
                "phase": "Transformation",
                "timeline": "6-12 months",
                "actions": ["Platform modernization", "Strategic partnerships"],
                "expected_impact": "+10-15%"
            }
        ]
    
    def _recommend_retention_strategies(self, churn_rate: float) -> List[str]:
        """Recommend customer retention strategies"""
        strategies = []
        
        if churn_rate > 0.15:
            strategies.append("URGENT: Implement customer success program")
            strategies.append("Conduct churn analysis and exit interviews")
        
        strategies.append("Develop loyalty program with usage incentives")
        strategies.append("Proactive monitoring and issue resolution")
        strategies.append("Regular business reviews with key accounts")
        
        return strategies
    
    def _recommend_acquisition_strategies(self, cac_ratio: float) -> List[str]:
        """Recommend customer acquisition strategies"""
        strategies = []
        
        if cac_ratio > 0.5:
            strategies.append("Optimize acquisition channels for efficiency")
            strategies.append("Focus on referral programs")
        
        strategies.append("Content marketing and thought leadership")
        strategies.append("Strategic partnerships for customer access")
        strategies.append("Free trial or freemium offerings")
        
        return strategies
    
    def _calculate_irr(self, cash_flows: List[float]) -> float:
        """Calculate Internal Rate of Return"""
        # Simplified IRR calculation using Newton's method
        rate = 0.1
        tolerance = 0.0001
        max_iterations = 100
        
        for _ in range(max_iterations):
            npv = sum(cf / ((1 + rate) ** i) for i, cf in enumerate(cash_flows))
            if abs(npv) < tolerance:
                return rate
            
            # Derivative
            dnpv = sum(-i * cf / ((1 + rate) ** (i + 1)) for i, cf in enumerate(cash_flows))
            rate = rate - npv / dnpv if dnpv != 0 else rate
            
            if rate < -0.99:  # Prevent going below -100%
                return None
        
        return rate if abs(rate) < 10 else None
    
    def _perform_scenario_analysis(self, investment: float, returns: List[float]) -> Dict:
        """Perform scenario analysis on investment"""
        base_case = sum(returns)
        
        return {
            "pessimistic": {
                "returns": round(base_case * 0.6, 2),
                "probability": "20%",
                "npv": round(base_case * 0.6 - investment, 2)
            },
            "base": {
                "returns": round(base_case, 2),
                "probability": "60%",
                "npv": round(base_case - investment, 2)
            },
            "optimistic": {
                "returns": round(base_case * 1.5, 2),
                "probability": "20%",
                "npv": round(base_case * 1.5 - investment, 2)
            }
        }
    
    def _identify_investment_risks(self, inv_type: str, risk_factors: Optional[Dict]) -> List[str]:
        """Identify investment risks"""
        risks = []
        
        if "technology" in inv_type.lower():
            risks.append("Technology obsolescence risk")
        if "expansion" in inv_type.lower():
            risks.append("Market demand uncertainty")
        if risk_factors and risk_factors.get("regulatory_risk", 0) > 5:
            risks.append("Regulatory compliance challenges")
        
        return risks
    
    def _assess_strategic_value(self, inv_type: str) -> str:
        """Assess strategic value of investment"""
        if "innovation" in inv_type.lower() or "technology" in inv_type.lower():
            return "High - Competitive differentiation"
        elif "expansion" in inv_type.lower():
            return "Medium - Market growth opportunity"
        else:
            return "Standard - Operational improvement"
    
    def _calculate_synergy_value(self, area: str, partner: Dict) -> float:
        """Calculate value of specific synergy area"""
        base_values = {
            "technology": 500000,
            "market_access": 750000,
            "cost_reduction": 300000,
            "capability": 400000
        }
        
        for key in base_values:
            if key in area.lower():
                return base_values[key] * (1 + partner.get("synergy_multiplier", 0))
        
        return 250000  # Default value
    
    def _calculate_partnership_npv(self, investment: float, annual_value: float, 
                                  share: float, years: int) -> float:
        """Calculate partnership NPV"""
        discount_rate = 0.12
        npv = -investment
        
        for year in range(1, years + 1):
            npv += (annual_value * share) / ((1 + discount_rate) ** year)
        
        return npv
    
    def _identify_partnership_risks(self, partner: Dict) -> List[str]:
        """Identify partnership risks"""
        risks = []
        
        if partner.get("financial_rating", 5) < 3:
            risks.append("Partner financial stability concern")
        if partner.get("culture_score", 5) < 3:
            risks.append("Cultural misalignment risk")
        
        risks.append("Integration complexity")
        risks.append("IP and confidentiality concerns")
        
        return risks
    
    def _identify_partnership_rewards(self, synergies: List[str], partner: Dict) -> List[str]:
        """Identify partnership rewards"""
        rewards = []
        
        if "technology" in str(synergies):
            rewards.append("Access to advanced technology")
        if "market" in str(synergies):
            rewards.append("Expanded market reach")
        if partner.get("market_share", 0) > 20:
            rewards.append("Industry leadership positioning")
        
        rewards.append("Risk sharing and resource optimization")
        
        return rewards
    
    def _recommend_risk_mitigation(self, risks: List[str]) -> List[str]:
        """Recommend risk mitigation strategies"""
        mitigations = []
        
        for risk in risks:
            if "financial" in risk.lower():
                mitigations.append("Implement financial guarantees or escrow")
            elif "cultural" in risk.lower():
                mitigations.append("Establish clear governance and communication")
            elif "integration" in risk.lower():
                mitigations.append("Phase implementation with clear milestones")
        
        return mitigations
    
    def _make_partnership_recommendation(self, score: float, npv: float, risks: List[str]) -> str:
        """Make partnership recommendation"""
        if score > 70 and npv > 0 and len(risks) < 3:
            return "Strongly Recommend - Proceed with partnership"
        elif score > 50 and npv > 0:
            return "Recommend - Proceed with risk mitigation"
        elif score > 50:
            return "Conditional - Renegotiate financial terms"
        else:
            return "Not Recommended - Seek alternatives"
    
    def _identify_negotiation_priorities(self, terms: Dict, partner: Dict) -> List[str]:
        """Identify negotiation priorities"""
        priorities = []
        
        if terms.get("revenue_share", 0.5) < 0.4:
            priorities.append("Improve revenue share terms")
        if terms.get("investment", 0) > 1000000:
            priorities.append("Reduce initial investment requirement")
        if partner.get("market_share", 0) > 30:
            priorities.append("Secure exclusivity in key markets")
        
        priorities.append("Define clear performance metrics and exit clauses")
        
        return priorities
    
    def _design_usage_pricing(self, costs: Dict, target_margin: float) -> Dict:
        """Design usage-based pricing model"""
        return {
            "model": "Pay-per-use",
            "base_rate": round(sum(costs.values()) * (1 + target_margin) / 1000, 2),
            "volume_tiers": [
                {"range": "0-100 GB", "rate_per_gb": 10},
                {"range": "100-500 GB", "rate_per_gb": 8},
                {"range": "500+ GB", "rate_per_gb": 6}
            ],
            "burst_pricing": "2x base rate for peak hours"
        }
    
    def _design_tiered_pricing(self, base_price: float) -> Dict:
        """Design tiered pricing model"""
        return {
            "model": "Tiered subscription",
            "tiers": [
                {"name": "Basic", "price": round(base_price * 0.7, 2), "features": "Standard SLA, 100GB"},
                {"name": "Professional", "price": round(base_price, 2), "features": "Priority support, 500GB"},
                {"name": "Enterprise", "price": round(base_price * 1.5, 2), "features": "24/7 support, Unlimited"}
            ]
        }
    
    def _create_bundle_options(self, costs: Dict, target_price: float) -> List[Dict]:
        """Create bundle pricing options"""
        return [
            {
                "bundle": "Starter Pack",
                "price": round(target_price * 0.8, 2),
                "savings": "20%",
                "includes": ["Basic connectivity", "Standard support"]
            },
            {
                "bundle": "Growth Pack",
                "price": round(target_price * 1.5, 2),
                "savings": "25%",
                "includes": ["Premium connectivity", "Priority support", "Analytics"]
            }
        ]
    
    def _create_pricing_rollout(self) -> List[Dict]:
        """Create pricing rollout plan"""
        return [
            {"phase": "Pilot", "timeline": "Month 1", "action": "Test with 10% of new customers"},
            {"phase": "Expansion", "timeline": "Month 2-3", "action": "Roll out to 50% of base"},
            {"phase": "Full Deployment", "timeline": "Month 4", "action": "Complete migration"}
        ]
    
    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Execute a business intelligence task with natural language understanding"""
        try:
            # First check if this is a specific analysis request that can use our detailed methods
            task_lower = task.lower()
            
            # For specific analysis requests, provide detailed results
            if "market analysis" in task_lower and context and all(key in context for key in ["region", "market_size"]):
                result = self.market_analysis(
                    context.get("region", "North America"),
                    context.get("market_size", 1000),
                    context.get("competitors", []),
                    context.get("growth_rate", 0.08)
                )
                # Convert to natural language summary
                return f"Based on the market analysis for {context['region']}, I see a ${result['market_overview']['current_size_millions']}M market growing at {result['market_overview']['annual_growth_rate']} annually. The competitive landscape shows {result['competitive_landscape']['total_competitors']} competitors with {result['competitive_landscape']['market_concentration'].lower()}. Key opportunity: {result['market_opportunity']['penetration_strategy']}"
            
            elif "revenue optimization" in task_lower and context and "current_revenue" in context:
                result = self.revenue_optimization(
                    context.get("current_revenue", {}),
                    context.get("utilization_rates", {}),
                    context.get("pricing_model", "usage_based")
                )
                return f"Revenue optimization analysis shows current performance at ${result['current_performance']['total_revenue']} with {result['current_performance']['average_utilization']}% utilization. I've identified {len(result['optimization_opportunities'])} optimization opportunities that could increase revenue by {result['expected_improvement']['revenue_increase']} over {result['expected_improvement']['timeline']}."
            
            # For general queries or context-aware responses, use the base LLM execution
            else:
                # Add business intelligence specific context
                enhanced_context = context.copy() if context else {}
                enhanced_context.update({
                    "agent_capabilities": [
                        "Market analysis and competitive intelligence",
                        "Revenue optimization and pricing strategies", 
                        "Customer lifetime value analysis",
                        "Investment analysis and ROI calculations",
                        "Partnership evaluation and strategic planning",
                        "Business opportunity assessment"
                    ],
                    "analysis_types": [
                        "Market sizing and growth projections",
                        "Competitive landscape analysis", 
                        "Revenue stream optimization",
                        "Customer segmentation and retention",
                        "Financial modeling and forecasting",
                        "Strategic partnership evaluation"
                    ]
                })
                
                # Use parent class LLM execution for natural language response
                return super().execute(task, enhanced_context)
                
        except Exception as e:
            return f"I apologize, but I encountered an issue while analyzing your request. As your Business Intelligence analyst, I'm here to help with market analysis, revenue optimization, customer insights, and strategic planning. Could you please rephrase your question or let me know what specific business analysis you'd like me to perform?"