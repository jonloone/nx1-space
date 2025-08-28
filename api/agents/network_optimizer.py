"""
Network Optimization Agent using CrewAI
Specializes in network capacity planning, traffic routing, and performance optimization
"""

from crewai import Agent
from typing import Optional, Dict, Any, List, Tuple
import math
import json
import random
from .base_agent import BaseCrewAgent

class NetworkOptimizerAgent(BaseCrewAgent):
    """Expert agent for network optimization and capacity planning"""
    
    def __init__(self):
        super().__init__(
            role="Senior Network Optimization Engineer",
            goal="Optimize satellite ground station networks for maximum efficiency, capacity utilization, and cost-effectiveness",
            backstory="""You are a seasoned network optimization engineer with 15+ years of experience in 
            telecommunications and satellite network design. You have expertise in:
            - Network capacity planning and traffic engineering
            - Load balancing and resource allocation
            - Routing optimization and path selection
            - Quality of Service (QoS) management
            - Network topology design
            - Cost optimization strategies
            - Performance monitoring and tuning
            - Predictive capacity planning
            You excel at designing efficient networks that maximize throughput while minimizing costs.""",
            verbose=True,
            allow_delegation=False,
            tools=[]
        )
        
    def optimize_network_topology(self, stations: List[Dict], 
                                 traffic_matrix: Optional[Dict] = None) -> Dict[str, Any]:
        """Optimize network topology for efficiency and redundancy"""
        
        n_stations = len(stations)
        
        # Create traffic matrix if not provided
        if not traffic_matrix:
            traffic_matrix = self._generate_traffic_matrix(stations)
        
        # Calculate current network metrics
        current_metrics = self._calculate_network_metrics(stations, traffic_matrix)
        
        # Identify critical paths
        critical_paths = self._identify_critical_paths(stations, traffic_matrix)
        
        # Optimize topology
        optimization = {
            "current_topology": {
                "total_stations": n_stations,
                "average_utilization": current_metrics["avg_utilization"],
                "max_utilization": current_metrics["max_utilization"],
                "network_efficiency": current_metrics["efficiency"]
            },
            "recommended_changes": [],
            "critical_paths": critical_paths,
            "redundancy_analysis": {},
            "cost_benefit": {}
        }
        
        # Identify overloaded stations
        overloaded = [s for s in stations if s.get("utilization_metrics", {}).get("current_utilization", 0) > 80]
        if overloaded:
            optimization["recommended_changes"].append({
                "type": "capacity_expansion",
                "stations": [s["name"] for s in overloaded],
                "reason": "Utilization exceeds 80%",
                "priority": "High"
            })
        
        # Identify underutilized stations
        underutilized = [s for s in stations if s.get("utilization_metrics", {}).get("current_utilization", 0) < 30]
        if underutilized:
            optimization["recommended_changes"].append({
                "type": "traffic_redistribution",
                "stations": [s["name"] for s in underutilized],
                "reason": "Utilization below 30%",
                "priority": "Medium"
            })
        
        # Redundancy analysis
        optimization["redundancy_analysis"] = self._analyze_redundancy(stations, critical_paths)
        
        # Cost-benefit analysis
        optimization["cost_benefit"] = self._calculate_optimization_roi(optimization["recommended_changes"])
        
        return optimization
    
    def capacity_planning_analysis(self, 
                                  current_demand: Dict[str, float],
                                  growth_rate: float = 0.15,
                                  planning_horizon_years: int = 3) -> Dict[str, Any]:
        """Perform capacity planning analysis with growth projections"""
        
        analysis = {
            "current_state": {
                "total_demand_gbps": sum(current_demand.values()),
                "peak_demand_gbps": max(current_demand.values()),
                "stations": len(current_demand)
            },
            "projections": [],
            "capacity_requirements": [],
            "investment_timeline": []
        }
        
        # Calculate projections
        for year in range(1, planning_horizon_years + 1):
            growth_factor = (1 + growth_rate) ** year
            projected_demand = {k: v * growth_factor for k, v in current_demand.items()}
            
            projection = {
                "year": year,
                "total_demand_gbps": round(sum(projected_demand.values()), 2),
                "peak_demand_gbps": round(max(projected_demand.values()), 2),
                "growth_from_baseline": f"{(growth_factor - 1) * 100:.1f}%"
            }
            analysis["projections"].append(projection)
            
            # Capacity requirements
            required_capacity = sum(projected_demand.values()) * 1.3  # 30% headroom
            analysis["capacity_requirements"].append({
                "year": year,
                "required_capacity_gbps": round(required_capacity, 2),
                "additional_capacity_needed": round(required_capacity - sum(current_demand.values()), 2)
            })
            
            # Investment timeline
            if year == 1:
                investment = "Immediate: Upgrade existing infrastructure"
            elif year == 2:
                investment = "Mid-term: Add redundant capacity"
            else:
                investment = "Long-term: New station deployment"
            
            analysis["investment_timeline"].append({
                "year": year,
                "recommendation": investment,
                "estimated_cost_multiplier": 1 + (year * 0.5)
            })
        
        # Add recommendations
        analysis["recommendations"] = self._get_capacity_recommendations(growth_rate, analysis["projections"])
        
        return analysis
    
    def load_balancing_optimization(self, 
                                   stations: List[Dict],
                                   traffic_load: Dict[str, float]) -> Dict[str, Any]:
        """Optimize load balancing across stations"""
        
        # Calculate current load distribution
        total_load = sum(traffic_load.values())
        total_capacity = sum(s.get("capacity_metrics", {}).get("total_capacity_gbps", 10) for s in stations)
        
        # Current state analysis
        current_state = {
            "total_load_gbps": round(total_load, 2),
            "total_capacity_gbps": round(total_capacity, 2),
            "utilization_percentage": round((total_load / total_capacity) * 100, 2),
            "load_distribution": self._calculate_load_distribution(stations, traffic_load)
        }
        
        # Optimize load distribution
        optimized_distribution = self._optimize_load_distribution(stations, traffic_load)
        
        # Calculate improvements
        improvements = {
            "balanced_utilization": optimized_distribution["avg_utilization"],
            "peak_reduction": f"{current_state['load_distribution']['std_deviation'] - optimized_distribution['std_deviation']:.1f}%",
            "efficiency_gain": f"{optimized_distribution['efficiency_score'] - current_state['load_distribution']['efficiency']:.1f}%"
        }
        
        # Migration plan
        migration_plan = self._create_migration_plan(current_state, optimized_distribution)
        
        return {
            "current_state": current_state,
            "optimized_state": optimized_distribution,
            "improvements": improvements,
            "migration_plan": migration_plan,
            "implementation_priority": self._prioritize_migrations(migration_plan)
        }
    
    def routing_optimization(self, 
                           source: Dict[str, float],
                           destination: Dict[str, float],
                           intermediate_nodes: List[Dict],
                           constraints: Optional[Dict] = None) -> Dict[str, Any]:
        """Optimize routing paths between source and destination"""
        
        # Calculate all possible paths
        all_paths = self._find_all_paths(source, destination, intermediate_nodes)
        
        # Evaluate paths based on multiple criteria
        evaluated_paths = []
        for path in all_paths[:10]:  # Limit to top 10 paths
            evaluation = {
                "path": path["nodes"],
                "total_distance_km": path["distance"],
                "latency_ms": path["distance"] / 200,  # Approximate speed of light in fiber
                "hop_count": len(path["nodes"]) - 1,
                "reliability_score": self._calculate_path_reliability(path),
                "cost_index": self._calculate_path_cost(path),
                "congestion_risk": self._assess_congestion_risk(path)
            }
            evaluated_paths.append(evaluation)
        
        # Select optimal paths
        primary_path = min(evaluated_paths, key=lambda x: x["latency_ms"])
        backup_paths = sorted([p for p in evaluated_paths if p != primary_path], 
                            key=lambda x: x["reliability_score"], reverse=True)[:2]
        
        return {
            "routing_analysis": {
                "source": source,
                "destination": destination,
                "total_paths_analyzed": len(all_paths),
                "constraints_applied": constraints or "None"
            },
            "optimal_routes": {
                "primary": primary_path,
                "backup": backup_paths
            },
            "performance_metrics": {
                "expected_latency_ms": primary_path["latency_ms"],
                "reliability_percentage": primary_path["reliability_score"] * 100,
                "path_diversity_score": self._calculate_diversity_score(primary_path, backup_paths)
            },
            "recommendations": self._get_routing_recommendations(primary_path, backup_paths)
        }
    
    def qos_optimization(self, 
                        traffic_classes: Dict[str, Dict],
                        available_bandwidth_gbps: float) -> Dict[str, Any]:
        """Optimize Quality of Service parameters for different traffic classes"""
        
        # Define QoS priorities
        qos_priorities = {
            "real_time": {"priority": 1, "latency_req_ms": 50, "jitter_req_ms": 5},
            "mission_critical": {"priority": 2, "latency_req_ms": 100, "jitter_req_ms": 20},
            "business": {"priority": 3, "latency_req_ms": 200, "jitter_req_ms": 50},
            "bulk": {"priority": 4, "latency_req_ms": 1000, "jitter_req_ms": 200}
        }
        
        # Allocate bandwidth based on priorities
        bandwidth_allocation = {}
        remaining_bandwidth = available_bandwidth_gbps
        
        for traffic_class, requirements in sorted(traffic_classes.items(), 
                                                 key=lambda x: qos_priorities.get(x[0], {}).get("priority", 999)):
            requested = requirements.get("bandwidth_gbps", 0)
            allocated = min(requested, remaining_bandwidth * 0.4)  # Max 40% per class initially
            bandwidth_allocation[traffic_class] = {
                "allocated_gbps": round(allocated, 2),
                "requested_gbps": requested,
                "satisfaction_rate": round((allocated / requested * 100) if requested > 0 else 100, 2)
            }
            remaining_bandwidth -= allocated
        
        # Distribute remaining bandwidth
        if remaining_bandwidth > 0:
            for traffic_class in bandwidth_allocation:
                if bandwidth_allocation[traffic_class]["satisfaction_rate"] < 100:
                    additional = min(remaining_bandwidth * 0.5, 
                                   bandwidth_allocation[traffic_class]["requested_gbps"] - 
                                   bandwidth_allocation[traffic_class]["allocated_gbps"])
                    bandwidth_allocation[traffic_class]["allocated_gbps"] += additional
                    remaining_bandwidth -= additional
        
        # Calculate QoS metrics
        qos_metrics = {
            "total_allocated_gbps": sum(b["allocated_gbps"] for b in bandwidth_allocation.values()),
            "utilization_percentage": round((sum(b["allocated_gbps"] for b in bandwidth_allocation.values()) / 
                                           available_bandwidth_gbps) * 100, 2),
            "average_satisfaction": round(sum(b["satisfaction_rate"] for b in bandwidth_allocation.values()) / 
                                        len(bandwidth_allocation), 2)
        }
        
        # Generate QoS policy
        qos_policy = self._generate_qos_policy(bandwidth_allocation, qos_priorities)
        
        return {
            "bandwidth_allocation": bandwidth_allocation,
            "qos_metrics": qos_metrics,
            "qos_policy": qos_policy,
            "recommendations": self._get_qos_recommendations(qos_metrics, bandwidth_allocation)
        }
    
    def cost_optimization_analysis(self, 
                                  network_costs: Dict[str, float],
                                  utilization_data: Dict[str, float],
                                  optimization_target: str = "balanced") -> Dict[str, Any]:
        """Analyze and optimize network costs"""
        
        total_cost = sum(network_costs.values())
        avg_utilization = sum(utilization_data.values()) / len(utilization_data) if utilization_data else 0
        
        # Cost efficiency analysis
        cost_per_utilized_percent = total_cost / avg_utilization if avg_utilization > 0 else float('inf')
        
        # Identify cost optimization opportunities
        opportunities = []
        
        # Underutilized expensive resources
        for resource, cost in network_costs.items():
            if resource in utilization_data:
                util = utilization_data[resource]
                if util < 50 and cost > total_cost * 0.1:
                    opportunities.append({
                        "type": "underutilized_expensive",
                        "resource": resource,
                        "current_cost": cost,
                        "utilization": util,
                        "potential_savings": cost * 0.3,
                        "action": "Downsize or redistribute load"
                    })
        
        # Overutilized resources
        for resource, util in utilization_data.items():
            if util > 90:
                opportunities.append({
                    "type": "overutilized",
                    "resource": resource,
                    "utilization": util,
                    "risk": "High - potential service degradation",
                    "action": "Upgrade capacity or load balance"
                })
        
        # Optimization strategies based on target
        strategies = {
            "aggressive": self._aggressive_cost_optimization(network_costs, utilization_data),
            "balanced": self._balanced_cost_optimization(network_costs, utilization_data),
            "conservative": self._conservative_cost_optimization(network_costs, utilization_data)
        }
        
        selected_strategy = strategies.get(optimization_target, strategies["balanced"])
        
        return {
            "current_state": {
                "total_monthly_cost": round(total_cost, 2),
                "average_utilization": round(avg_utilization, 2),
                "cost_efficiency": round(cost_per_utilized_percent, 2)
            },
            "optimization_opportunities": opportunities,
            "recommended_strategy": selected_strategy,
            "projected_savings": {
                "monthly": round(selected_strategy["savings"], 2),
                "annual": round(selected_strategy["savings"] * 12, 2),
                "percentage": round((selected_strategy["savings"] / total_cost) * 100, 2)
            },
            "implementation_plan": selected_strategy["implementation"],
            "risk_assessment": selected_strategy["risk"]
        }
    
    # Helper methods
    def _generate_traffic_matrix(self, stations: List[Dict]) -> Dict:
        """Generate a traffic matrix between stations"""
        matrix = {}
        for i, source in enumerate(stations):
            for j, dest in enumerate(stations):
                if i != j:
                    # Simulate traffic based on station capacities
                    traffic = random.uniform(0.1, 2.0)  # Gbps
                    matrix[f"{source['name']}->{dest['name']}"] = traffic
        return matrix
    
    def _calculate_network_metrics(self, stations: List[Dict], traffic: Dict) -> Dict:
        """Calculate network performance metrics"""
        utilizations = [s.get("utilization_metrics", {}).get("current_utilization", 50) for s in stations]
        return {
            "avg_utilization": sum(utilizations) / len(utilizations) if utilizations else 0,
            "max_utilization": max(utilizations) if utilizations else 0,
            "efficiency": 100 - (max(utilizations) - min(utilizations)) if utilizations else 0
        }
    
    def _identify_critical_paths(self, stations: List[Dict], traffic: Dict) -> List[Dict]:
        """Identify critical network paths"""
        critical = []
        for path, load in sorted(traffic.items(), key=lambda x: x[1], reverse=True)[:5]:
            critical.append({
                "path": path,
                "traffic_gbps": round(load, 2),
                "criticality": "High" if load > 1.5 else "Medium"
            })
        return critical
    
    def _analyze_redundancy(self, stations: List[Dict], critical_paths: List[Dict]) -> Dict:
        """Analyze network redundancy"""
        single_points = []
        for station in stations:
            connections = sum(1 for path in critical_paths if station["name"] in path.get("path", ""))
            if connections > 3:
                single_points.append(station["name"])
        
        return {
            "redundancy_level": "Good" if len(single_points) == 0 else "Poor" if len(single_points) > 2 else "Fair",
            "single_points_of_failure": single_points,
            "recommendation": "Add backup paths for critical nodes" if single_points else "Redundancy adequate"
        }
    
    def _calculate_optimization_roi(self, changes: List[Dict]) -> Dict:
        """Calculate ROI for optimization changes"""
        total_cost = sum(100 * (1 if c["priority"] == "High" else 0.5) for c in changes)
        expected_benefit = total_cost * 2.5  # Assume 2.5x return
        
        return {
            "estimated_cost": total_cost,
            "expected_benefit": expected_benefit,
            "roi_percentage": ((expected_benefit - total_cost) / total_cost * 100) if total_cost > 0 else 0,
            "payback_months": 6 if total_cost > 0 else 0
        }
    
    def _get_capacity_recommendations(self, growth_rate: float, projections: List[Dict]) -> List[str]:
        """Get capacity planning recommendations"""
        recommendations = []
        
        if growth_rate > 0.2:
            recommendations.append("High growth rate detected - consider aggressive capacity expansion")
            recommendations.append("Implement auto-scaling capabilities")
        elif growth_rate > 0.1:
            recommendations.append("Moderate growth - plan phased capacity additions")
            recommendations.append("Focus on efficiency improvements before expansion")
        else:
            recommendations.append("Low growth - optimize existing capacity utilization")
        
        if projections[-1]["total_demand_gbps"] > projections[0]["total_demand_gbps"] * 2:
            recommendations.append("Demand doubling within planning horizon - start procurement process")
        
        return recommendations
    
    def _calculate_load_distribution(self, stations: List[Dict], traffic: Dict) -> Dict:
        """Calculate load distribution metrics"""
        loads = list(traffic.values())
        avg_load = sum(loads) / len(loads) if loads else 0
        variance = sum((l - avg_load) ** 2 for l in loads) / len(loads) if loads else 0
        
        return {
            "average_load": round(avg_load, 2),
            "std_deviation": round(math.sqrt(variance), 2),
            "efficiency": round(100 - (math.sqrt(variance) / avg_load * 100) if avg_load > 0 else 0, 2)
        }
    
    def _optimize_load_distribution(self, stations: List[Dict], traffic: Dict) -> Dict:
        """Optimize load distribution across stations"""
        # Simplified load balancing algorithm
        total_capacity = sum(s.get("capacity_metrics", {}).get("total_capacity_gbps", 10) for s in stations)
        total_load = sum(traffic.values())
        target_utilization = (total_load / total_capacity) * 100
        
        optimized = {
            "avg_utilization": round(target_utilization, 2),
            "std_deviation": 5.0,  # Target low deviation
            "efficiency_score": 85.0,  # Target efficiency
            "distribution": {}
        }
        
        # Distribute load proportionally to capacity
        for station in stations:
            capacity = station.get("capacity_metrics", {}).get("total_capacity_gbps", 10)
            allocated_load = (capacity / total_capacity) * total_load
            optimized["distribution"][station["name"]] = round(allocated_load, 2)
        
        return optimized
    
    def _create_migration_plan(self, current: Dict, optimized: Dict) -> List[Dict]:
        """Create traffic migration plan"""
        return [
            {
                "phase": 1,
                "action": "Identify and classify traffic flows",
                "duration": "1 week",
                "risk": "Low"
            },
            {
                "phase": 2,
                "action": "Configure load balancing policies",
                "duration": "2 weeks",
                "risk": "Medium"
            },
            {
                "phase": 3,
                "action": "Gradual traffic migration (20% increments)",
                "duration": "4 weeks",
                "risk": "Medium"
            },
            {
                "phase": 4,
                "action": "Monitor and fine-tune",
                "duration": "2 weeks",
                "risk": "Low"
            }
        ]
    
    def _prioritize_migrations(self, plan: List[Dict]) -> List[str]:
        """Prioritize migration actions"""
        return [
            "Start with non-critical traffic",
            "Migrate during maintenance windows",
            "Maintain rollback capability",
            "Monitor performance continuously"
        ]
    
    def _find_all_paths(self, source: Dict, dest: Dict, nodes: List[Dict]) -> List[Dict]:
        """Find all possible paths between source and destination"""
        # Simplified pathfinding - in reality would use graph algorithms
        paths = []
        
        # Direct path
        direct_distance = self._calculate_distance(source, dest)
        paths.append({
            "nodes": [source.get("name", "Source"), dest.get("name", "Dest")],
            "distance": direct_distance
        })
        
        # Paths through intermediate nodes
        for node in nodes[:5]:  # Limit for simplicity
            dist1 = self._calculate_distance(source, {"latitude": node.get("location", {}).get("latitude", 0),
                                                     "longitude": node.get("location", {}).get("longitude", 0)})
            dist2 = self._calculate_distance({"latitude": node.get("location", {}).get("latitude", 0),
                                             "longitude": node.get("location", {}).get("longitude", 0)}, dest)
            paths.append({
                "nodes": [source.get("name", "Source"), node["name"], dest.get("name", "Dest")],
                "distance": dist1 + dist2
            })
        
        return sorted(paths, key=lambda x: x["distance"])
    
    def _calculate_distance(self, point1: Dict, point2: Dict) -> float:
        """Calculate distance between two points"""
        # Simplified distance calculation
        lat_diff = abs(point1.get("latitude", 0) - point2.get("latitude", 0))
        lon_diff = abs(point1.get("longitude", 0) - point2.get("longitude", 0))
        return math.sqrt(lat_diff**2 + lon_diff**2) * 111  # Rough km conversion
    
    def _calculate_path_reliability(self, path: Dict) -> float:
        """Calculate path reliability score"""
        # Base reliability decreases with hop count
        base_reliability = 0.99 ** (len(path["nodes"]) - 1)
        return round(base_reliability, 3)
    
    def _calculate_path_cost(self, path: Dict) -> float:
        """Calculate path cost index"""
        # Cost increases with distance and hop count
        return round(path["distance"] * 0.01 + len(path["nodes"]) * 10, 2)
    
    def _assess_congestion_risk(self, path: Dict) -> str:
        """Assess congestion risk for path"""
        hop_count = len(path["nodes"]) - 1
        if hop_count <= 1:
            return "Low"
        elif hop_count <= 3:
            return "Medium"
        else:
            return "High"
    
    def _calculate_diversity_score(self, primary: Dict, backups: List[Dict]) -> float:
        """Calculate path diversity score"""
        if not backups:
            return 0.0
        
        # Check node overlap
        primary_nodes = set(primary["path"])
        diversity_scores = []
        
        for backup in backups:
            backup_nodes = set(backup["path"])
            overlap = len(primary_nodes.intersection(backup_nodes)) - 2  # Exclude source/dest
            diversity = 1 - (overlap / len(primary_nodes)) if len(primary_nodes) > 2 else 1
            diversity_scores.append(diversity)
        
        return round(sum(diversity_scores) / len(diversity_scores) * 100, 2)
    
    def _get_routing_recommendations(self, primary: Dict, backups: List[Dict]) -> List[str]:
        """Get routing recommendations"""
        recommendations = []
        
        if primary["latency_ms"] > 100:
            recommendations.append("Consider closer intermediate nodes to reduce latency")
        
        if primary["reliability_score"] < 0.95:
            recommendations.append("Primary path reliability below target - implement fast failover")
        
        if not backups:
            recommendations.append("No backup paths available - critical vulnerability")
        
        return recommendations
    
    def _generate_qos_policy(self, allocation: Dict, priorities: Dict) -> Dict:
        """Generate QoS policy configuration"""
        return {
            "traffic_shaping": {
                class_name: {
                    "guaranteed_bandwidth_gbps": alloc["allocated_gbps"],
                    "burst_size_mb": alloc["allocated_gbps"] * 100,
                    "priority": priorities.get(class_name, {}).get("priority", 5)
                }
                for class_name, alloc in allocation.items()
            },
            "queuing_strategy": "Weighted Fair Queuing (WFQ)",
            "congestion_management": "Random Early Detection (RED)"
        }
    
    def _get_qos_recommendations(self, metrics: Dict, allocation: Dict) -> List[str]:
        """Get QoS recommendations"""
        recommendations = []
        
        if metrics["average_satisfaction"] < 80:
            recommendations.append("Consider bandwidth upgrade - satisfaction below target")
        
        if metrics["utilization_percentage"] > 90:
            recommendations.append("Network near capacity - implement admission control")
        
        # Check for starved classes
        for class_name, alloc in allocation.items():
            if alloc["satisfaction_rate"] < 50:
                recommendations.append(f"Critical: {class_name} traffic severely underprovisioned")
        
        return recommendations
    
    def _aggressive_cost_optimization(self, costs: Dict, utilization: Dict) -> Dict:
        """Aggressive cost optimization strategy"""
        return {
            "approach": "Aggressive - Maximize savings",
            "savings": sum(costs.values()) * 0.3,
            "implementation": [
                "Immediate downsizing of underutilized resources",
                "Consolidation of redundant services",
                "Renegotiate vendor contracts",
                "Implement strict capacity limits"
            ],
            "risk": "High - Potential service impact during peak loads"
        }
    
    def _balanced_cost_optimization(self, costs: Dict, utilization: Dict) -> Dict:
        """Balanced cost optimization strategy"""
        return {
            "approach": "Balanced - Optimize cost and performance",
            "savings": sum(costs.values()) * 0.15,
            "implementation": [
                "Gradual right-sizing over 3 months",
                "Implement auto-scaling",
                "Optimize reserved capacity",
                "Review and adjust monthly"
            ],
            "risk": "Medium - Minimal service impact expected"
        }
    
    def _conservative_cost_optimization(self, costs: Dict, utilization: Dict) -> Dict:
        """Conservative cost optimization strategy"""
        return {
            "approach": "Conservative - Maintain service quality",
            "savings": sum(costs.values()) * 0.05,
            "implementation": [
                "Focus on efficiency improvements",
                "Maintain current capacity",
                "Optimize only clearly underutilized resources",
                "Extensive testing before changes"
            ],
            "risk": "Low - No service impact"
        }
    
    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Execute a network optimization task"""
        try:
            task_lower = task.lower()
            
            if "topology" in task_lower:
                if context and "stations" in context:
                    result = self.optimize_network_topology(
                        context["stations"],
                        context.get("traffic_matrix")
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide station data for topology optimization"
            
            elif "capacity" in task_lower and "planning" in task_lower:
                if context and "current_demand" in context:
                    result = self.capacity_planning_analysis(
                        context["current_demand"],
                        context.get("growth_rate", 0.15),
                        context.get("planning_horizon", 3)
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide current demand data for capacity planning"
            
            elif "load" in task_lower and "balanc" in task_lower:
                if context and "stations" in context:
                    result = self.load_balancing_optimization(
                        context["stations"],
                        context.get("traffic_load", {})
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide station and traffic data for load balancing"
            
            elif "routing" in task_lower:
                if context and all(k in context for k in ["source", "destination"]):
                    result = self.routing_optimization(
                        context["source"],
                        context["destination"],
                        context.get("intermediate_nodes", []),
                        context.get("constraints")
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide source and destination for routing optimization"
            
            elif "qos" in task_lower or "quality" in task_lower:
                if context and "traffic_classes" in context:
                    result = self.qos_optimization(
                        context["traffic_classes"],
                        context.get("bandwidth_gbps", 10)
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide traffic classes for QoS optimization"
            
            elif "cost" in task_lower:
                if context and "network_costs" in context:
                    result = self.cost_optimization_analysis(
                        context["network_costs"],
                        context.get("utilization_data", {}),
                        context.get("optimization_target", "balanced")
                    )
                    return json.dumps(result, indent=2)
                else:
                    return "Please provide cost data for optimization analysis"
            
            # For general queries or context-aware responses, use the base LLM execution  
            else:
                # Add network optimization-specific context
                enhanced_context = context.copy() if context else {}
                enhanced_context.update({
                    "agent_capabilities": [
                        "Network topology optimization and design",
                        "Capacity planning and bandwidth allocation",
                        "Load balancing and traffic engineering", 
                        "Quality of Service (QoS) optimization",
                        "Cost optimization and resource utilization",
                        "Performance monitoring and bottleneck analysis"
                    ],
                    "analysis_types": [
                        "Network architecture design and optimization",
                        "Traffic flow analysis and capacity modeling",
                        "Resource allocation and utilization studies",
                        "Performance tuning and optimization strategies", 
                        "Cost-benefit analysis for network investments",
                        "Service level agreement (SLA) compliance analysis"
                    ]
                })
                
                # Use parent class LLM execution for natural language response
                return super().execute(task, enhanced_context)
                
        except Exception as e:
            return f"I apologize for the technical difficulty. As your Network Optimizer, I specialize in designing efficient network topologies, optimizing capacity and performance, and ensuring cost-effective resource utilization. I can help you with traffic analysis, bandwidth planning, and performance optimization. What specific network optimization would you like me to analyze?"