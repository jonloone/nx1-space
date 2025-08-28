"""
SATCOM Operations Expert Agent using CrewAI
Specializes in satellite communications, orbital mechanics, and ground station operations
"""

from crewai import Agent
from typing import Optional, Dict, Any, List, Tuple
import math
import json
from datetime import datetime, timedelta
from .base_agent import BaseCrewAgent

class SATCOMExpertAgent(BaseCrewAgent):
    """Expert agent for satellite communications and ground station operations"""
    
    def __init__(self):
        super().__init__(
            role="Senior SATCOM Operations Expert",
            goal="Provide expert guidance on satellite communications, orbital mechanics, ground station operations, and network planning",
            backstory="""You are a veteran SATCOM operations expert with 20+ years of experience in satellite 
            communications and ground station management. You have expertise in:
            - Orbital mechanics and satellite positioning
            - Link budget calculations and RF engineering
            - Ground station operations and maintenance
            - Frequency coordination and interference management
            - Satellite network design and optimization
            - Rain fade mitigation and atmospheric effects
            - Modulation and coding schemes
            - Regulatory compliance (ITU, FCC)
            You excel at optimizing satellite communications networks for maximum efficiency and reliability.""",
            verbose=True,
            allow_delegation=False,
            tools=[]
        )
        
    def calculate_link_budget(self, 
                            frequency_ghz: float,
                            distance_km: float,
                            tx_power_dbm: float = 30,
                            tx_gain_dbi: float = 45,
                            rx_gain_dbi: float = 35,
                            rain_margin_db: float = 3) -> Dict[str, Any]:
        """Calculate satellite link budget"""
        
        # Free space path loss (FSPL)
        fspl_db = 20 * math.log10(distance_km * 1000) + 20 * math.log10(frequency_ghz * 1e9) + 20 * math.log10(4 * math.pi / 3e8)
        
        # Convert dBm to dBW
        tx_power_dbw = tx_power_dbm - 30
        
        # EIRP (Effective Isotropic Radiated Power)
        eirp_dbw = tx_power_dbw + tx_gain_dbi
        
        # Received power
        rx_power_dbw = eirp_dbw - fspl_db + rx_gain_dbi - rain_margin_db
        rx_power_dbm = rx_power_dbw + 30
        
        # System noise temperature and C/N calculation
        system_temp_k = 290  # Room temperature assumption
        bandwidth_hz = 36e6  # Typical transponder bandwidth
        noise_power_dbw = 10 * math.log10(1.38e-23 * system_temp_k * bandwidth_hz)
        cn_ratio_db = rx_power_dbw - noise_power_dbw
        
        # Eb/N0 calculation (assuming QPSK)
        data_rate_mbps = 50  # Typical data rate
        eb_n0_db = cn_ratio_db - 10 * math.log10(data_rate_mbps * 1e6 / bandwidth_hz)
        
        # Link margin
        required_eb_n0_db = 10  # Typical requirement for BER 10^-6
        link_margin_db = eb_n0_db - required_eb_n0_db
        
        return {
            "frequency_ghz": frequency_ghz,
            "distance_km": distance_km,
            "path_loss_db": round(fspl_db, 2),
            "eirp_dbw": round(eirp_dbw, 2),
            "received_power_dbm": round(rx_power_dbm, 2),
            "cn_ratio_db": round(cn_ratio_db, 2),
            "eb_n0_db": round(eb_n0_db, 2),
            "link_margin_db": round(link_margin_db, 2),
            "link_status": "Good" if link_margin_db > 3 else "Marginal" if link_margin_db > 0 else "Poor",
            "recommendations": self._get_link_recommendations(link_margin_db, frequency_ghz)
        }
    
    def analyze_orbital_coverage(self,
                                satellite_altitude_km: float,
                                satellite_inclination: float,
                                ground_station_lat: float,
                                ground_station_lon: float,
                                min_elevation_angle: float = 10) -> Dict[str, Any]:
        """Analyze satellite orbital coverage for a ground station"""
        
        # Earth radius
        earth_radius_km = 6371
        
        # Calculate orbital period (Kepler's third law)
        orbital_radius_km = earth_radius_km + satellite_altitude_km
        orbital_period_min = 2 * math.pi * math.sqrt((orbital_radius_km ** 3) / (398600.4418))  / 60
        
        # Calculate maximum coverage radius from satellite
        horizon_angle = math.acos(earth_radius_km / orbital_radius_km)
        coverage_radius_km = earth_radius_km * horizon_angle
        
        # Calculate visibility window based on minimum elevation
        min_elev_rad = math.radians(min_elevation_angle)
        max_range_km = earth_radius_km * (math.cos(min_elev_rad) / math.sin(min_elev_rad) - 
                                         1 / math.tan(min_elev_rad + math.asin(earth_radius_km * 
                                         math.sin(min_elev_rad) / orbital_radius_km)))
        
        # Estimate daily passes (simplified)
        daily_passes = int(1440 / orbital_period_min)  # Minutes per day / orbital period
        
        # Visibility duration per pass (simplified estimation)
        visibility_factor = math.cos(math.radians(abs(ground_station_lat - satellite_inclination)))
        avg_visibility_min = orbital_period_min * 0.15 * visibility_factor  # Rough estimation
        
        # Calculate coverage quality
        coverage_quality = "Excellent" if satellite_inclination >= abs(ground_station_lat) else "Good" if abs(satellite_inclination - abs(ground_station_lat)) < 20 else "Limited"
        
        return {
            "satellite": {
                "altitude_km": satellite_altitude_km,
                "inclination_degrees": satellite_inclination,
                "orbital_period_minutes": round(orbital_period_min, 2),
                "coverage_radius_km": round(coverage_radius_km, 2)
            },
            "ground_station": {
                "latitude": ground_station_lat,
                "longitude": ground_station_lon,
                "min_elevation_angle": min_elevation_angle
            },
            "coverage_analysis": {
                "daily_passes": daily_passes,
                "avg_visibility_minutes": round(avg_visibility_min, 2),
                "max_range_km": round(max_range_km, 2),
                "coverage_quality": coverage_quality,
                "total_daily_coverage_minutes": round(daily_passes * avg_visibility_min, 2)
            },
            "recommendations": self._get_coverage_recommendations(coverage_quality, daily_passes)
        }
    
    def frequency_coordination_analysis(self,
                                      center_frequency_mhz: float,
                                      bandwidth_mhz: float,
                                      service_type: str = "FSS") -> Dict[str, Any]:
        """Analyze frequency coordination requirements and potential interference"""
        
        # ITU frequency bands
        band_allocation = self._get_itu_band_allocation(center_frequency_mhz)
        
        # Identify potential interferers
        interferers = self._identify_potential_interferers(center_frequency_mhz, bandwidth_mhz, service_type)
        
        # Regulatory considerations
        regulatory = self._get_regulatory_requirements(center_frequency_mhz, service_type)
        
        return {
            "frequency_analysis": {
                "center_frequency_mhz": center_frequency_mhz,
                "bandwidth_mhz": bandwidth_mhz,
                "service_type": service_type,
                "itu_band": band_allocation["band"],
                "primary_allocation": band_allocation["primary_service"]
            },
            "interference_assessment": {
                "risk_level": interferers["risk_level"],
                "potential_sources": interferers["sources"],
                "mitigation_strategies": interferers["mitigation"]
            },
            "regulatory_compliance": {
                "licensing_required": regulatory["licensing"],
                "coordination_required": regulatory["coordination"],
                "filing_requirements": regulatory["filings"]
            },
            "recommendations": self._get_frequency_recommendations(interferers["risk_level"])
        }
    
    def modulation_coding_optimization(self,
                                      link_margin_db: float,
                                      bandwidth_mhz: float,
                                      required_throughput_mbps: float) -> Dict[str, Any]:
        """Optimize modulation and coding schemes for given link conditions"""
        
        modcod_schemes = [
            {"name": "QPSK 1/2", "spectral_efficiency": 1.0, "required_cn_db": 3.0},
            {"name": "QPSK 3/4", "spectral_efficiency": 1.5, "required_cn_db": 5.5},
            {"name": "8PSK 2/3", "spectral_efficiency": 2.0, "required_cn_db": 8.5},
            {"name": "8PSK 3/4", "spectral_efficiency": 2.25, "required_cn_db": 9.8},
            {"name": "16APSK 2/3", "spectral_efficiency": 2.67, "required_cn_db": 11.0},
            {"name": "16APSK 3/4", "spectral_efficiency": 3.0, "required_cn_db": 12.0},
            {"name": "32APSK 3/4", "spectral_efficiency": 3.75, "required_cn_db": 15.0}
        ]
        
        # Find suitable modcod schemes
        suitable_schemes = []
        for scheme in modcod_schemes:
            achievable_throughput = bandwidth_mhz * scheme["spectral_efficiency"]
            if achievable_throughput >= required_throughput_mbps and link_margin_db >= scheme["required_cn_db"]:
                suitable_schemes.append({
                    **scheme,
                    "achievable_throughput_mbps": round(achievable_throughput, 2),
                    "margin_db": round(link_margin_db - scheme["required_cn_db"], 2)
                })
        
        # Select optimal scheme
        if suitable_schemes:
            optimal = max(suitable_schemes, key=lambda x: x["spectral_efficiency"])
        else:
            optimal = {"name": "None suitable", "recommendation": "Increase power or reduce throughput requirement"}
        
        # ACM recommendation
        acm_benefit = "High" if link_margin_db > 10 else "Medium" if link_margin_db > 5 else "Low"
        
        return {
            "link_conditions": {
                "available_margin_db": link_margin_db,
                "bandwidth_mhz": bandwidth_mhz,
                "required_throughput_mbps": required_throughput_mbps
            },
            "optimal_modcod": optimal,
            "alternative_schemes": suitable_schemes[:3] if len(suitable_schemes) > 1 else [],
            "adaptive_coding": {
                "recommended": acm_benefit != "Low",
                "expected_benefit": acm_benefit,
                "throughput_improvement": f"{20 if acm_benefit == 'High' else 10 if acm_benefit == 'Medium' else 5}%"
            },
            "recommendations": self._get_modcod_recommendations(optimal, link_margin_db)
        }
    
    def ground_station_availability(self,
                                   location: Dict[str, float],
                                   frequency_band: str,
                                   redundancy_type: str = "1+1") -> Dict[str, Any]:
        """Calculate ground station availability and redundancy requirements"""
        
        # Base availability factors
        equipment_availability = 0.999  # 99.9% equipment availability
        power_availability = 0.9999  # 99.99% with UPS and generator
        
        # Weather impact based on frequency band
        weather_impact = {
            "C-band": 0.999,
            "Ku-band": 0.995,
            "Ka-band": 0.99,
            "Q/V-band": 0.98
        }.get(frequency_band, 0.995)
        
        # Calculate single site availability
        single_site_availability = equipment_availability * power_availability * weather_impact
        
        # Redundancy calculations
        redundancy_configs = {
            "None": single_site_availability,
            "1+1": 1 - (1 - single_site_availability) ** 2,
            "2+1": 1 - (1 - single_site_availability) ** 3,
            "Site Diversity": 0.9999  # Assumes uncorrelated sites
        }
        
        total_availability = redundancy_configs.get(redundancy_type, single_site_availability)
        annual_downtime_hours = (1 - total_availability) * 8760
        
        return {
            "location": location,
            "frequency_band": frequency_band,
            "availability_analysis": {
                "single_site": f"{single_site_availability * 100:.3f}%",
                "with_redundancy": f"{total_availability * 100:.4f}%",
                "redundancy_type": redundancy_type,
                "annual_downtime_hours": round(annual_downtime_hours, 2),
                "monthly_downtime_minutes": round(annual_downtime_hours * 60 / 12, 2)
            },
            "contributing_factors": {
                "equipment": f"{equipment_availability * 100:.2f}%",
                "power": f"{power_availability * 100:.2f}%",
                "weather": f"{weather_impact * 100:.2f}%"
            },
            "improvement_options": self._get_availability_improvements(total_availability, frequency_band),
            "cost_benefit": self._calculate_redundancy_cost_benefit(redundancy_type, total_availability)
        }
    
    def interference_mitigation_strategy(self,
                                        interference_type: str,
                                        frequency_mhz: float,
                                        interference_level_db: float) -> Dict[str, Any]:
        """Develop interference mitigation strategies"""
        
        strategies = {
            "adjacent_channel": [
                "Increase channel spacing",
                "Implement sharper filters",
                "Use guard bands",
                "Coordinate with adjacent operators"
            ],
            "co_channel": [
                "Spatial isolation (antenna pointing)",
                "Polarization isolation",
                "Time division coordination",
                "Power control coordination"
            ],
            "terrestrial": [
                "Site shielding",
                "Frequency coordination",
                "Antenna sidelobe suppression",
                "Notch filtering"
            ],
            "rain_scatter": [
                "Site diversity",
                "Uplink power control",
                "Adaptive coding and modulation",
                "Frequency diversity"
            ]
        }
        
        mitigation_techniques = strategies.get(interference_type, ["Consult regulatory authority"])
        
        # Estimate mitigation effectiveness
        effectiveness = {
            "technique": mitigation_techniques[0] if mitigation_techniques else "None",
            "expected_improvement_db": min(interference_level_db * 0.7, 20),
            "implementation_complexity": "High" if interference_level_db > 10 else "Medium" if interference_level_db > 5 else "Low"
        }
        
        return {
            "interference_assessment": {
                "type": interference_type,
                "level_db": interference_level_db,
                "frequency_mhz": frequency_mhz,
                "severity": "Critical" if interference_level_db > 15 else "High" if interference_level_db > 10 else "Medium" if interference_level_db > 5 else "Low"
            },
            "mitigation_strategies": mitigation_techniques,
            "primary_recommendation": effectiveness,
            "regulatory_actions": [
                "File interference complaint if persistent",
                "Request coordination meeting",
                "Document interference patterns"
            ],
            "monitoring_requirements": self._get_monitoring_requirements(interference_type, interference_level_db)
        }
    
    # Helper methods
    def _get_link_recommendations(self, margin_db: float, frequency_ghz: float) -> List[str]:
        """Get link budget improvement recommendations"""
        recommendations = []
        
        if margin_db < 0:
            recommendations.append("CRITICAL: Link margin negative - immediate action required")
            recommendations.append("Increase transmit power or antenna gain")
            recommendations.append("Consider lower frequency band for better propagation")
        elif margin_db < 3:
            recommendations.append("Link margin marginal - monitor closely")
            recommendations.append("Implement uplink power control")
            recommendations.append("Consider site diversity for critical services")
        else:
            recommendations.append("Link margin acceptable")
            if frequency_ghz > 20:
                recommendations.append("Consider adaptive coding for Ka-band and above")
        
        return recommendations
    
    def _get_coverage_recommendations(self, quality: str, passes: int) -> List[str]:
        """Get orbital coverage recommendations"""
        recommendations = []
        
        if quality == "Limited":
            recommendations.append("Consider higher inclination orbit for better coverage")
            recommendations.append("Add additional ground stations for gap filling")
        
        if passes < 4:
            recommendations.append("Limited daily passes - consider MEO or GEO alternatives")
            recommendations.append("Implement store-and-forward for non-real-time data")
        
        return recommendations
    
    def _get_itu_band_allocation(self, frequency_mhz: float) -> Dict[str, str]:
        """Get ITU band allocation for frequency"""
        if 3700 <= frequency_mhz <= 4200:
            return {"band": "C-band", "primary_service": "FSS Downlink"}
        elif 5925 <= frequency_mhz <= 6425:
            return {"band": "C-band", "primary_service": "FSS Uplink"}
        elif 11700 <= frequency_mhz <= 12700:
            return {"band": "Ku-band", "primary_service": "FSS/BSS"}
        elif 14000 <= frequency_mhz <= 14500:
            return {"band": "Ku-band", "primary_service": "FSS Uplink"}
        elif 17700 <= frequency_mhz <= 21200:
            return {"band": "Ka-band", "primary_service": "FSS"}
        else:
            return {"band": "Various", "primary_service": "Check ITU allocation"}
    
    def _identify_potential_interferers(self, frequency_mhz: float, bandwidth_mhz: float, service: str) -> Dict:
        """Identify potential interference sources"""
        risk_level = "Low"
        sources = []
        
        # C-band 5G interference
        if 3700 <= frequency_mhz <= 3980:
            risk_level = "High"
            sources.append("5G terrestrial networks")
        
        # Ku-band rain scatter
        if 10000 <= frequency_mhz <= 15000:
            sources.append("Rain scatter from adjacent satellites")
        
        # Ka-band considerations
        if frequency_mhz > 20000:
            risk_level = "Medium"
            sources.append("Atmospheric absorption")
            sources.append("Adjacent satellite interference")
        
        return {
            "risk_level": risk_level,
            "sources": sources,
            "mitigation": ["Frequency coordination", "Site shielding", "Filtering"]
        }
    
    def _get_regulatory_requirements(self, frequency_mhz: float, service: str) -> Dict:
        """Get regulatory requirements for frequency and service"""
        return {
            "licensing": True,
            "coordination": frequency_mhz < 15000,
            "filings": ["FCC Form 312", "ITU BR filing", "Coordination agreements"]
        }
    
    def _get_frequency_recommendations(self, risk_level: str) -> List[str]:
        """Get frequency coordination recommendations"""
        if risk_level == "High":
            return [
                "Immediate coordination required with existing operators",
                "Consider alternative frequency bands",
                "Implement interference monitoring system"
            ]
        elif risk_level == "Medium":
            return [
                "Standard coordination procedures recommended",
                "Monitor for interference during commissioning",
                "Document baseline RF environment"
            ]
        else:
            return [
                "Standard filing procedures sufficient",
                "Periodic monitoring recommended"
            ]
    
    def _get_modcod_recommendations(self, optimal: Dict, margin_db: float) -> List[str]:
        """Get modulation and coding recommendations"""
        recommendations = []
        
        if "None suitable" in str(optimal.get("name", "")):
            recommendations.append("No suitable ModCod - reduce throughput or improve link budget")
        else:
            recommendations.append(f"Implement {optimal.get('name')} for optimal efficiency")
            if margin_db > 6:
                recommendations.append("Consider ACM for dynamic optimization")
        
        return recommendations
    
    def _get_availability_improvements(self, availability: float, band: str) -> List[str]:
        """Get availability improvement recommendations"""
        improvements = []
        
        if availability < 0.999:
            improvements.append("Add redundant equipment (1+1 or 1:N)")
            if band in ["Ka-band", "Q/V-band"]:
                improvements.append("Implement site diversity for rain fade mitigation")
        
        if availability < 0.9999:
            improvements.append("Upgrade to higher reliability equipment")
            improvements.append("Implement predictive maintenance")
        
        return improvements
    
    def _calculate_redundancy_cost_benefit(self, redundancy_type: str, availability: float) -> Dict:
        """Calculate cost-benefit of redundancy configuration"""
        base_cost = 100  # Normalized
        
        costs = {
            "None": base_cost,
            "1+1": base_cost * 1.8,
            "2+1": base_cost * 2.5,
            "Site Diversity": base_cost * 3.2
        }
        
        return {
            "relative_cost": costs.get(redundancy_type, base_cost),
            "availability_gain": f"{(availability - 0.999) * 100:.3f}%",
            "cost_per_nine": "High" if redundancy_type == "Site Diversity" else "Medium"
        }
    
    def _get_monitoring_requirements(self, interference_type: str, level_db: float) -> Dict:
        """Get interference monitoring requirements"""
        return {
            "monitoring_interval": "Continuous" if level_db > 10 else "Hourly" if level_db > 5 else "Daily",
            "parameters": ["C/I ratio", "BER", "Es/N0", "Spectrum occupancy"],
            "reporting": "Automated alerts" if level_db > 10 else "Daily reports",
            "retention_period": "30 days minimum"
        }
    
    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Execute a SATCOM operations task"""
        try:
            task_lower = task.lower()
            
            if "link budget" in task_lower:
                if context:
                    result = self.calculate_link_budget(
                        context.get("frequency_ghz", 14.25),
                        context.get("distance_km", 36000),
                        context.get("tx_power_dbm", 30),
                        context.get("tx_gain_dbi", 45),
                        context.get("rx_gain_dbi", 35),
                        context.get("rain_margin_db", 3)
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide link parameters (frequency, distance, power, gains)"
            
            elif "orbital coverage" in task_lower or "coverage analysis" in task_lower:
                if context:
                    result = self.analyze_orbital_coverage(
                        context.get("altitude_km", 550),
                        context.get("inclination", 53),
                        context.get("lat", 40),
                        context.get("lon", -74),
                        context.get("min_elevation", 10)
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide orbital parameters and ground station location"
            
            elif "frequency" in task_lower and "coordination" in task_lower:
                if context:
                    result = self.frequency_coordination_analysis(
                        context.get("frequency_mhz", 3750),
                        context.get("bandwidth_mhz", 36),
                        context.get("service_type", "FSS")
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide frequency parameters for coordination analysis"
            
            elif "modulation" in task_lower or "modcod" in task_lower:
                if context:
                    result = self.modulation_coding_optimization(
                        context.get("link_margin_db", 6),
                        context.get("bandwidth_mhz", 36),
                        context.get("throughput_mbps", 100)
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide link margin and throughput requirements"
            
            elif "availability" in task_lower:
                if context:
                    result = self.ground_station_availability(
                        context.get("location", {"lat": 40, "lon": -74}),
                        context.get("frequency_band", "Ku-band"),
                        context.get("redundancy", "1+1")
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide location and redundancy configuration"
            
            elif "interference" in task_lower:
                if context:
                    result = self.interference_mitigation_strategy(
                        context.get("type", "adjacent_channel"),
                        context.get("frequency_mhz", 3750),
                        context.get("level_db", 8)
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide interference type and level"
            
            # For general queries or context-aware responses, use the base LLM execution  
            else:
                # Add SATCOM-specific context
                enhanced_context = context.copy() if context else {}
                enhanced_context.update({
                    "agent_capabilities": [
                        "Link budget calculations and optimization",
                        "Orbital coverage analysis for satellite constellations",
                        "Frequency coordination and interference mitigation", 
                        "Modulation and coding scheme optimization",
                        "Ground station availability assessment",
                        "RF system performance analysis"
                    ],
                    "analysis_types": [
                        "Satellite link performance modeling",
                        "Coverage footprint analysis and optimization",
                        "Spectrum management and coordination",
                        "Signal quality and throughput optimization", 
                        "System reliability and availability studies",
                        "Interference analysis and mitigation strategies"
                    ]
                })
                
                # Use parent class LLM execution for natural language response
                return super().execute(task, enhanced_context)
                
        except Exception as e:
            return f"I apologize for the technical difficulty. As your SATCOM Operations Expert, I specialize in satellite communication systems, link budgets, orbital mechanics, and RF performance optimization. I can help you analyze coverage patterns, optimize signal quality, and resolve interference issues. What specific SATCOM analysis would you like me to perform?"