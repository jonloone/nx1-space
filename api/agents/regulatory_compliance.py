"""
Regulatory Compliance Agent using CrewAI
Specializes in FCC, ITU regulations, and compliance for satellite operations
"""

from crewai import Agent
from typing import Optional, Dict, Any, List
import json
from datetime import datetime, timedelta
from .base_agent import BaseCrewAgent

class RegulatoryComplianceAgent(BaseCrewAgent):
    """Expert agent for regulatory compliance and licensing"""
    
    def __init__(self):
        super().__init__(
            role="Senior Regulatory Compliance Expert",
            goal="Ensure compliance with FCC, ITU, and international regulations for satellite ground station operations",
            backstory="""You are a seasoned regulatory compliance expert with 20+ years of experience in 
            telecommunications and satellite licensing. You have expertise in:
            - FCC licensing and compliance (Part 25, Part 5)
            - ITU Radio Regulations and coordination
            - International frequency coordination
            - Earth station licensing procedures
            - Spectrum management and interference analysis
            - ITAR and export control compliance
            - Environmental impact assessments (NEPA)
            - Cross-border data transfer regulations
            You excel at navigating complex regulatory frameworks and ensuring operational compliance.""",
            verbose=True,
            allow_delegation=False,
            tools=[]
        )
        
    def licensing_requirements_analysis(self,
                                      station_type: str,
                                      location: Dict[str, Any],
                                      frequency_bands: List[str],
                                      service_type: str = "FSS") -> Dict[str, Any]:
        """Analyze licensing requirements for a ground station"""
        
        # Determine jurisdiction
        country = location.get("country", "USA")
        
        # Base licensing requirements
        requirements = {
            "jurisdiction": country,
            "station_type": station_type,
            "service_type": service_type,
            "licenses_required": [],
            "regulatory_bodies": [],
            "timeline_estimate": "",
            "cost_estimate": 0,
            "complexity": "Medium"
        }
        
        # USA/FCC requirements
        if country == "USA":
            requirements["regulatory_bodies"] = ["FCC", "NTIA (if government)", "FAA (height study)"]
            
            if station_type == "gateway":
                requirements["licenses_required"].extend([
                    "FCC Form 312 - Earth Station License",
                    "Frequency Coordination Report",
                    "FAA Obstruction Evaluation",
                    "Environmental Assessment (if required)"
                ])
                requirements["timeline_estimate"] = "6-9 months"
                requirements["cost_estimate"] = 25000
                requirements["complexity"] = "High"
                
            elif station_type == "user_terminal":
                requirements["licenses_required"].extend([
                    "Blanket Earth Station License",
                    "Type approval for equipment"
                ])
                requirements["timeline_estimate"] = "3-4 months"
                requirements["cost_estimate"] = 5000
                requirements["complexity"] = "Low"
        
        # Frequency-specific requirements
        band_requirements = self._analyze_band_requirements(frequency_bands)
        
        # International coordination needs
        coordination = self._assess_coordination_requirements(location, frequency_bands)
        
        # Compliance checklist
        checklist = self._generate_compliance_checklist(station_type, service_type)
        
        return {
            "licensing_overview": requirements,
            "frequency_requirements": band_requirements,
            "coordination_requirements": coordination,
            "compliance_checklist": checklist,
            "filing_procedures": self._get_filing_procedures(requirements),
            "recommendations": self._get_licensing_recommendations(requirements, coordination)
        }
    
    def compliance_audit(self,
                        current_licenses: List[Dict],
                        operations: Dict[str, Any],
                        last_audit_date: Optional[str] = None) -> Dict[str, Any]:
        """Perform comprehensive compliance audit"""
        
        audit_results = {
            "audit_date": datetime.now().isoformat(),
            "overall_status": "Compliant",
            "findings": [],
            "risks": [],
            "required_actions": []
        }
        
        # License validity check
        for license in current_licenses:
            expiry = license.get("expiry_date")
            if expiry:
                days_to_expiry = (datetime.fromisoformat(expiry) - datetime.now()).days
                if days_to_expiry < 0:
                    audit_results["findings"].append({
                        "severity": "Critical",
                        "issue": f"License {license['number']} expired",
                        "action": "Immediate renewal required"
                    })
                    audit_results["overall_status"] = "Non-Compliant"
                elif days_to_expiry < 90:
                    audit_results["findings"].append({
                        "severity": "High",
                        "issue": f"License {license['number']} expires in {days_to_expiry} days",
                        "action": "Initiate renewal process"
                    })
        
        # Operational compliance check
        operational_compliance = self._check_operational_compliance(operations)
        audit_results["findings"].extend(operational_compliance)
        
        # Technical compliance
        technical_compliance = self._check_technical_compliance(operations)
        audit_results["findings"].extend(technical_compliance)
        
        # Risk assessment
        audit_results["risks"] = self._assess_compliance_risks(audit_results["findings"])
        
        # Generate action plan
        audit_results["required_actions"] = self._generate_action_plan(audit_results["findings"])
        
        # Compliance score
        audit_results["compliance_score"] = self._calculate_compliance_score(audit_results["findings"])
        
        return audit_results
    
    def spectrum_coordination(self,
                            frequency: float,
                            bandwidth: float,
                            location: Dict[str, float],
                            existing_operators: List[Dict]) -> Dict[str, Any]:
        """Perform spectrum coordination analysis"""
        
        coordination_result = {
            "frequency_mhz": frequency,
            "bandwidth_mhz": bandwidth,
            "coordination_required": False,
            "affected_operators": [],
            "interference_analysis": {},
            "mitigation_measures": []
        }
        
        # Check coordination triggers
        if frequency < 15000:  # C and Ku band typically require coordination
            coordination_result["coordination_required"] = True
        
        # Identify affected operators
        for operator in existing_operators:
            op_freq = operator.get("frequency", 0)
            op_bw = operator.get("bandwidth", 0)
            
            # Check frequency overlap or adjacency
            if abs(op_freq - frequency) < (bandwidth + op_bw) / 2:
                distance = self._calculate_distance(location, operator.get("location", {}))
                
                affected = {
                    "operator": operator["name"],
                    "frequency_separation_mhz": abs(op_freq - frequency),
                    "distance_km": distance,
                    "interference_potential": "High" if distance < 100 else "Medium" if distance < 500 else "Low"
                }
                coordination_result["affected_operators"].append(affected)
        
        # Interference analysis
        coordination_result["interference_analysis"] = self._perform_interference_analysis(
            frequency, bandwidth, coordination_result["affected_operators"]
        )
        
        # Mitigation measures
        if coordination_result["affected_operators"]:
            coordination_result["mitigation_measures"] = [
                "Implement frequency offset",
                "Use orthogonal polarization",
                "Antenna pattern optimization",
                "Power flux density limits",
                "Time-based coordination"
            ]
        
        # Coordination process
        coordination_result["coordination_process"] = self._outline_coordination_process(
            coordination_result["affected_operators"]
        )
        
        return coordination_result
    
    def itar_compliance_check(self,
                             equipment_list: List[Dict],
                             data_types: List[str],
                             international_partners: List[str]) -> Dict[str, Any]:
        """Check ITAR and export control compliance"""
        
        compliance_check = {
            "itar_applicable": False,
            "ear_applicable": False,
            "controlled_items": [],
            "licensing_required": [],
            "restrictions": [],
            "compliance_status": "Compliant"
        }
        
        # Check equipment for USML items
        for equipment in equipment_list:
            category = equipment.get("category", "")
            if any(controlled in category.lower() for controlled in ["military", "defense", "crypto"]):
                compliance_check["itar_applicable"] = True
                compliance_check["controlled_items"].append({
                    "item": equipment["name"],
                    "classification": "USML Category XI",
                    "license_required": True
                })
        
        # Check data types
        for data_type in data_types:
            if any(sensitive in data_type.lower() for sensitive in ["military", "intelligence", "classified"]):
                compliance_check["restrictions"].append(f"Restricted data type: {data_type}")
                compliance_check["compliance_status"] = "Review Required"
        
        # Check international partners
        embargoed_countries = ["Iran", "North Korea", "Syria", "Cuba"]
        for partner in international_partners:
            if any(country in partner for country in embargoed_countries):
                compliance_check["restrictions"].append(f"Embargoed country: {partner}")
                compliance_check["compliance_status"] = "Non-Compliant"
            elif partner not in ["Canada", "UK", "Australia", "Japan"]:
                compliance_check["licensing_required"].append(f"Export license for {partner}")
        
        # Generate compliance requirements
        compliance_check["requirements"] = self._generate_export_requirements(compliance_check)
        
        # Recommendations
        compliance_check["recommendations"] = self._get_export_compliance_recommendations(compliance_check)
        
        return compliance_check
    
    def environmental_compliance(self,
                                site_details: Dict[str, Any],
                                antenna_specifications: Dict[str, Any]) -> Dict[str, Any]:
        """Assess environmental compliance requirements (NEPA, etc.)"""
        
        assessment = {
            "nepa_required": False,
            "environmental_impact": "Low",
            "permits_required": [],
            "studies_required": [],
            "timeline": "2-3 months",
            "estimated_cost": 5000
        }
        
        # Check NEPA triggers
        if site_details.get("federal_land", False):
            assessment["nepa_required"] = True
            assessment["studies_required"].append("Environmental Assessment (EA)")
            assessment["timeline"] = "6-9 months"
            assessment["estimated_cost"] = 25000
        
        # RF exposure compliance
        antenna_power = antenna_specifications.get("power_watts", 0)
        if antenna_power > 1000:
            assessment["studies_required"].append("RF Exposure Study (OET-65)")
            assessment["permits_required"].append("RF Safety Certification")
        
        # Local permits
        antenna_height = antenna_specifications.get("height_meters", 0)
        if antenna_height > 60:
            assessment["permits_required"].extend([
                "FAA Obstruction Evaluation",
                "Local zoning permit",
                "Building permit"
            ])
            assessment["timeline"] = "4-6 months"
        
        # Wildlife and habitat
        if site_details.get("near_protected_area", False):
            assessment["studies_required"].append("Wildlife Impact Study")
            assessment["environmental_impact"] = "Medium"
        
        # Mitigation measures
        assessment["mitigation_measures"] = self._recommend_environmental_mitigation(assessment)
        
        return assessment
    
    def data_privacy_compliance(self,
                               data_types: List[str],
                               jurisdictions: List[str],
                               cross_border_transfers: bool = False) -> Dict[str, Any]:
        """Assess data privacy and protection compliance"""
        
        compliance_requirements = {
            "applicable_regulations": [],
            "requirements": [],
            "controls_needed": [],
            "compliance_gaps": [],
            "risk_level": "Low"
        }
        
        # Check jurisdictions for applicable laws
        if "EU" in jurisdictions or any("Europe" in j for j in jurisdictions):
            compliance_requirements["applicable_regulations"].append("GDPR")
            compliance_requirements["requirements"].extend([
                "Data Protection Officer appointment",
                "Privacy Impact Assessment",
                "Data processing agreements",
                "Consent mechanisms"
            ])
        
        if "California" in jurisdictions or "USA" in jurisdictions:
            compliance_requirements["applicable_regulations"].append("CCPA")
            compliance_requirements["requirements"].extend([
                "Privacy policy updates",
                "Opt-out mechanisms",
                "Data inventory"
            ])
        
        # Cross-border transfer requirements
        if cross_border_transfers:
            compliance_requirements["requirements"].extend([
                "Standard Contractual Clauses (SCCs)",
                "Transfer impact assessment",
                "Adequacy determination review"
            ])
            compliance_requirements["risk_level"] = "Medium"
        
        # Data type specific requirements
        for data_type in data_types:
            if "personal" in data_type.lower() or "pii" in data_type.lower():
                compliance_requirements["controls_needed"].extend([
                    "Encryption at rest and in transit",
                    "Access controls and authentication",
                    "Data retention policies",
                    "Breach notification procedures"
                ])
                compliance_requirements["risk_level"] = "High"
        
        # Generate compliance roadmap
        compliance_requirements["implementation_roadmap"] = self._create_privacy_roadmap(compliance_requirements)
        
        return compliance_requirements
    
    def filing_assistance(self,
                         filing_type: str,
                         station_details: Dict[str, Any]) -> Dict[str, Any]:
        """Provide assistance with regulatory filings"""
        
        filing_guide = {
            "filing_type": filing_type,
            "forms_required": [],
            "supporting_documents": [],
            "fees": 0,
            "processing_time": "",
            "step_by_step_guide": [],
            "common_mistakes": []
        }
        
        if filing_type == "FCC_earth_station":
            filing_guide["forms_required"] = ["FCC Form 312", "Schedule B"]
            filing_guide["supporting_documents"] = [
                "Frequency coordination report",
                "Radiation hazard study",
                "FAA determination",
                "Site drawings and maps"
            ]
            filing_guide["fees"] = 9480  # Current FCC fee
            filing_guide["processing_time"] = "60-180 days"
            
            filing_guide["step_by_step_guide"] = [
                "1. Create IBFS account at fcc.gov",
                "2. Complete frequency coordination",
                "3. Prepare technical exhibits",
                "4. Complete Form 312 Main Form",
                "5. Complete Schedule B technical details",
                "6. Upload supporting documents",
                "7. Pay filing fee",
                "8. Submit and monitor for acceptance",
                "9. Respond to any FCC inquiries",
                "10. Receive grant or denial"
            ]
            
            filing_guide["common_mistakes"] = [
                "Incomplete frequency coordination",
                "Missing radiation hazard analysis",
                "Incorrect antenna gain patterns",
                "Mismatched coordinates formats"
            ]
        
        # Generate filing checklist
        filing_guide["prefiling_checklist"] = self._generate_filing_checklist(filing_type, station_details)
        
        # Tips and recommendations
        filing_guide["tips"] = self._get_filing_tips(filing_type)
        
        return filing_guide
    
    # Helper methods
    def _analyze_band_requirements(self, bands: List[str]) -> Dict[str, Any]:
        """Analyze frequency band specific requirements"""
        requirements = {}
        
        for band in bands:
            if "C-band" in band:
                requirements[band] = {
                    "coordination": "Required with terrestrial services",
                    "special_conditions": "5G interference mitigation may be required",
                    "power_limits": "EIRP density limits apply"
                }
            elif "Ka-band" in band:
                requirements[band] = {
                    "coordination": "Simplified for FSS",
                    "special_conditions": "Rain fade mitigation plans required",
                    "power_limits": "Standard FSS limits"
                }
            elif "Ku-band" in band:
                requirements[band] = {
                    "coordination": "Required with adjacent satellites",
                    "special_conditions": "Two-degree spacing compliance",
                    "power_limits": "Off-axis EIRP limits"
                }
        
        return requirements
    
    def _assess_coordination_requirements(self, location: Dict, bands: List[str]) -> Dict[str, Any]:
        """Assess coordination requirements based on location and bands"""
        coordination = {
            "domestic": [],
            "international": [],
            "timeline": "3-6 months"
        }
        
        # Check for border proximity (simplified)
        lat = location.get("latitude", 0)
        lon = location.get("longitude", 0)
        
        # US-Canada border
        if 48 < lat < 50 and -125 < lon < -65:
            coordination["international"].append("Canada coordination required")
        
        # US-Mexico border
        if 25 < lat < 33 and -120 < lon < -95:
            coordination["international"].append("Mexico coordination required")
        
        # Domestic coordination
        for band in bands:
            if "C-band" in band or "Ku-band" in band:
                coordination["domestic"].append(f"Coordination required for {band}")
        
        return coordination
    
    def _generate_compliance_checklist(self, station_type: str, service: str) -> List[Dict]:
        """Generate compliance checklist"""
        checklist = [
            {"item": "Station license current", "required": True, "status": "Pending"},
            {"item": "Frequency coordination completed", "required": True, "status": "Pending"},
            {"item": "Equipment type approved", "required": True, "status": "Pending"},
            {"item": "RF exposure compliance", "required": True, "status": "Pending"},
            {"item": "Site access secured", "required": True, "status": "Pending"},
            {"item": "Insurance coverage adequate", "required": True, "status": "Pending"},
            {"item": "Emergency procedures documented", "required": True, "status": "Pending"},
            {"item": "Operator certifications current", "required": False, "status": "Pending"}
        ]
        
        if station_type == "gateway":
            checklist.extend([
                {"item": "24/7 monitoring capability", "required": True, "status": "Pending"},
                {"item": "Redundant power systems", "required": True, "status": "Pending"}
            ])
        
        return checklist
    
    def _get_filing_procedures(self, requirements: Dict) -> List[str]:
        """Get filing procedures based on requirements"""
        procedures = []
        
        for license in requirements.get("licenses_required", []):
            if "Form 312" in license:
                procedures.append("File via FCC IBFS system")
            elif "Blanket" in license:
                procedures.append("File blanket license application")
        
        procedures.append("Monitor application status")
        procedures.append("Respond to any requests for information")
        
        return procedures
    
    def _get_licensing_recommendations(self, requirements: Dict, coordination: Dict) -> List[str]:
        """Get licensing recommendations"""
        recommendations = []
        
        if requirements["complexity"] == "High":
            recommendations.append("Consider hiring regulatory consultant")
            recommendations.append("Begin frequency coordination immediately")
        
        if coordination.get("international"):
            recommendations.append("Initiate international coordination early")
        
        recommendations.append("Maintain compliance calendar for renewals")
        recommendations.append("Document all technical parameters carefully")
        
        return recommendations
    
    def _check_operational_compliance(self, operations: Dict) -> List[Dict]:
        """Check operational compliance"""
        findings = []
        
        # Check power levels
        if operations.get("power_level", 0) > operations.get("authorized_power", 1000):
            findings.append({
                "severity": "High",
                "issue": "Operating above authorized power level",
                "action": "Reduce power immediately"
            })
        
        # Check operating hours
        if operations.get("24_7_operation", False) and not operations.get("24_7_authorized", True):
            findings.append({
                "severity": "Medium",
                "issue": "Operating outside authorized hours",
                "action": "Modify operations or amend license"
            })
        
        return findings
    
    def _check_technical_compliance(self, operations: Dict) -> List[Dict]:
        """Check technical compliance"""
        findings = []
        
        # Check emission limits
        if operations.get("out_of_band_emissions", 0) > -25:  # dBc
            findings.append({
                "severity": "High",
                "issue": "Out-of-band emissions exceed limits",
                "action": "Adjust filters or reduce power"
            })
        
        # Check frequency tolerance
        if operations.get("frequency_offset", 0) > 0.001:  # 1 kHz
            findings.append({
                "severity": "Medium",
                "issue": "Frequency offset exceeds tolerance",
                "action": "Calibrate frequency reference"
            })
        
        return findings
    
    def _assess_compliance_risks(self, findings: List[Dict]) -> List[Dict]:
        """Assess compliance risks based on findings"""
        risks = []
        
        critical_count = sum(1 for f in findings if f["severity"] == "Critical")
        high_count = sum(1 for f in findings if f["severity"] == "High")
        
        if critical_count > 0:
            risks.append({
                "risk": "License revocation",
                "probability": "High",
                "impact": "Severe"
            })
        
        if high_count > 2:
            risks.append({
                "risk": "Regulatory enforcement action",
                "probability": "Medium",
                "impact": "High"
            })
        
        risks.append({
            "risk": "Financial penalties",
            "probability": "Low" if len(findings) < 3 else "Medium",
            "impact": "Medium"
        })
        
        return risks
    
    def _generate_action_plan(self, findings: List[Dict]) -> List[Dict]:
        """Generate action plan from findings"""
        action_plan = []
        
        # Sort by severity
        for severity in ["Critical", "High", "Medium", "Low"]:
            for finding in findings:
                if finding["severity"] == severity:
                    action_plan.append({
                        "priority": severity,
                        "action": finding["action"],
                        "timeline": "Immediate" if severity == "Critical" else "30 days" if severity == "High" else "60 days"
                    })
        
        return action_plan
    
    def _calculate_compliance_score(self, findings: List[Dict]) -> float:
        """Calculate overall compliance score"""
        if not findings:
            return 100.0
        
        severity_weights = {"Critical": 25, "High": 15, "Medium": 5, "Low": 2}
        total_deductions = sum(severity_weights.get(f["severity"], 0) for f in findings)
        
        return max(0, 100 - total_deductions)
    
    def _calculate_distance(self, loc1: Dict, loc2: Dict) -> float:
        """Calculate distance between two locations (simplified)"""
        import math
        
        lat1, lon1 = loc1.get("latitude", 0), loc1.get("longitude", 0)
        lat2, lon2 = loc2.get("latitude", 0), loc2.get("longitude", 0)
        
        # Simplified distance calculation
        lat_diff = abs(lat2 - lat1)
        lon_diff = abs(lon2 - lon1)
        
        return math.sqrt(lat_diff**2 + lon_diff**2) * 111  # Rough km conversion
    
    def _perform_interference_analysis(self, freq: float, bw: float, operators: List[Dict]) -> Dict:
        """Perform interference analysis"""
        return {
            "c_i_ratio": "Acceptable" if len(operators) < 3 else "Review required",
            "aggregate_interference": f"{len(operators) * 3} dB",
            "mitigation_required": len(operators) > 2
        }
    
    def _outline_coordination_process(self, operators: List[Dict]) -> List[str]:
        """Outline coordination process"""
        process = []
        
        if operators:
            process.extend([
                "1. Prepare technical showing",
                "2. Submit to affected operators",
                "3. 30-day response period",
                "4. Negotiate interference mitigation",
                "5. Document agreements",
                "6. File with FCC"
            ])
        else:
            process.append("No coordination required")
        
        return process
    
    def _generate_export_requirements(self, check: Dict) -> List[str]:
        """Generate export control requirements"""
        requirements = []
        
        if check["itar_applicable"]:
            requirements.extend([
                "Register with DDTC",
                "Obtain export licenses",
                "Implement Technology Control Plan",
                "Train personnel on ITAR"
            ])
        
        if check["ear_applicable"]:
            requirements.extend([
                "Classify items under EAR",
                "Check license requirements",
                "Screen all parties"
            ])
        
        return requirements
    
    def _get_export_compliance_recommendations(self, check: Dict) -> List[str]:
        """Get export compliance recommendations"""
        recommendations = []
        
        if check["compliance_status"] == "Non-Compliant":
            recommendations.append("URGENT: Cease non-compliant activities immediately")
            recommendations.append("Consult export control attorney")
        
        recommendations.extend([
            "Implement compliance management system",
            "Regular training for technical staff",
            "Maintain detailed records"
        ])
        
        return recommendations
    
    def _recommend_environmental_mitigation(self, assessment: Dict) -> List[str]:
        """Recommend environmental mitigation measures"""
        measures = []
        
        if assessment["environmental_impact"] in ["Medium", "High"]:
            measures.extend([
                "Minimize ground disturbance",
                "Implement erosion control",
                "Schedule construction outside nesting season"
            ])
        
        if "RF Exposure Study" in assessment.get("studies_required", []):
            measures.append("Install RF warning signs and barriers")
        
        return measures
    
    def _create_privacy_roadmap(self, requirements: Dict) -> List[Dict]:
        """Create privacy compliance roadmap"""
        return [
            {
                "phase": "Assessment",
                "timeline": "Month 1",
                "activities": ["Data inventory", "Gap analysis", "Risk assessment"]
            },
            {
                "phase": "Implementation",
                "timeline": "Months 2-3",
                "activities": ["Policy updates", "Technical controls", "Training"]
            },
            {
                "phase": "Validation",
                "timeline": "Month 4",
                "activities": ["Testing", "Audit", "Certification"]
            }
        ]
    
    def _generate_filing_checklist(self, filing_type: str, details: Dict) -> List[str]:
        """Generate pre-filing checklist"""
        return [
            "Technical parameters finalized",
            "Coordination completed",
            "Supporting documents prepared",
            "Fee payment ready",
            "Legal review completed"
        ]
    
    def _get_filing_tips(self, filing_type: str) -> List[str]:
        """Get filing tips"""
        return [
            "File early to account for processing delays",
            "Double-check all technical parameters",
            "Maintain copies of all submissions",
            "Monitor email for FCC correspondence",
            "Consider expedited processing if time-critical"
        ]
    
    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Execute a regulatory compliance task"""
        try:
            task_lower = task.lower()
            
            if "licensing" in task_lower or "license" in task_lower:
                if context:
                    result = self.licensing_requirements_analysis(
                        context.get("station_type", "gateway"),
                        context.get("location", {"country": "USA"}),
                        context.get("frequency_bands", ["Ku-band"]),
                        context.get("service_type", "FSS")
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide station details for licensing analysis"
            
            elif "audit" in task_lower:
                if context:
                    result = self.compliance_audit(
                        context.get("licenses", []),
                        context.get("operations", {}),
                        context.get("last_audit")
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide current licenses and operations data"
            
            elif "spectrum" in task_lower or "coordination" in task_lower:
                if context:
                    result = self.spectrum_coordination(
                        context.get("frequency", 14250),
                        context.get("bandwidth", 36),
                        context.get("location", {}),
                        context.get("existing_operators", [])
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide frequency and location details"
            
            elif "itar" in task_lower or "export" in task_lower:
                if context:
                    result = self.itar_compliance_check(
                        context.get("equipment", []),
                        context.get("data_types", []),
                        context.get("partners", [])
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide equipment and partner details"
            
            elif "environmental" in task_lower or "nepa" in task_lower:
                if context:
                    result = self.environmental_compliance(
                        context.get("site_details", {}),
                        context.get("antenna_specs", {})
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide site and antenna details"
            
            elif "privacy" in task_lower or "gdpr" in task_lower:
                if context:
                    result = self.data_privacy_compliance(
                        context.get("data_types", []),
                        context.get("jurisdictions", ["USA"]),
                        context.get("cross_border", False)
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide data handling details"
            
            elif "filing" in task_lower:
                if context:
                    result = self.filing_assistance(
                        context.get("filing_type", "FCC_earth_station"),
                        context.get("station_details", {})
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide filing type and station details"
            
            # For general queries or context-aware responses, use the base LLM execution  
            else:
                # Add regulatory compliance-specific context
                enhanced_context = context.copy() if context else {}
                enhanced_context.update({
                    "agent_capabilities": [
                        "FCC and ITU licensing requirements analysis",
                        "Spectrum coordination and frequency planning",
                        "ITAR and export control compliance", 
                        "Environmental and safety assessments",
                        "Regulatory filing preparation and submission",
                        "Compliance audits and monitoring"
                    ],
                    "analysis_types": [
                        "Licensing requirements and application processes",
                        "Frequency coordination and interference analysis",
                        "Regulatory compliance gap assessments",
                        "International treaty and agreement compliance", 
                        "Environmental impact and zoning compliance",
                        "Operational compliance monitoring and reporting"
                    ]
                })
                
                # Use parent class LLM execution for natural language response
                return super().execute(task, enhanced_context)
                
        except Exception as e:
            return f"I apologize for the technical difficulty. As your Regulatory Compliance specialist, I help ensure your ground station operations meet all FCC, ITU, and international requirements. I can assist with licensing, spectrum coordination, ITAR compliance, and regulatory filings. What specific compliance matter can I help you with?"