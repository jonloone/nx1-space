"""
Comprehensive validation suite for Ground Station Intelligence Network
Ensures data quality and integrity before Kineviz handoff
"""

import json
import pandas as pd
import os
from datetime import datetime
from typing import Dict, List, Tuple, Any
import sys
from colorama import Fore, Style, init

# Initialize colorama for cross-platform colored output
init(autoreset=True)

class GraphValidator:
    """Validates graph data structure and content"""
    
    def __init__(self, export_path: str = "data/graphxr_export.json"):
        self.export_path = export_path
        self.graph_data = None
        self.validation_results = {
            "errors": [],
            "warnings": [],
            "info": []
        }
        
    def load_data(self) -> bool:
        """Load the graph export data"""
        try:
            with open(self.export_path, 'r') as f:
                self.graph_data = json.load(f)
            return True
        except FileNotFoundError:
            self.validation_results["errors"].append(
                f"Export file not found: {self.export_path}"
            )
            return False
        except json.JSONDecodeError as e:
            self.validation_results["errors"].append(
                f"Invalid JSON format: {str(e)}"
            )
            return False
    
    def validate_schema(self) -> bool:
        """Validate the basic schema structure"""
        print(f"\n{Fore.CYAN}🔍 Validating Schema Structure...{Style.RESET_ALL}")
        
        # Check top-level structure
        if not isinstance(self.graph_data, dict):
            self.validation_results["errors"].append(
                "Root must be a JSON object"
            )
            return False
        
        # Check required fields
        required_fields = ['nodes', 'edges']
        for field in required_fields:
            if field not in self.graph_data:
                self.validation_results["errors"].append(
                    f"Missing required field: {field}"
                )
                return False
            
            if not isinstance(self.graph_data[field], list):
                self.validation_results["errors"].append(
                    f"{field} must be an array"
                )
                return False
        
        print(f"{Fore.GREEN}✓ Schema structure valid{Style.RESET_ALL}")
        print(f"  - Nodes: {len(self.graph_data['nodes'])}")
        print(f"  - Edges: {len(self.graph_data['edges'])}")
        
        return True
    
    def validate_nodes(self) -> bool:
        """Validate node structure and properties"""
        print(f"\n{Fore.CYAN}🔍 Validating Nodes...{Style.RESET_ALL}")
        
        node_types = {}
        node_ids = set()
        errors = 0
        
        for i, node in enumerate(self.graph_data['nodes']):
            # Check required fields
            if 'id' not in node:
                self.validation_results["errors"].append(
                    f"Node {i} missing 'id' field"
                )
                errors += 1
                continue
            
            if 'label' not in node:
                self.validation_results["errors"].append(
                    f"Node {node.get('id', i)} missing 'label' field"
                )
                errors += 1
                continue
            
            # Check for duplicate IDs
            if node['id'] in node_ids:
                self.validation_results["errors"].append(
                    f"Duplicate node ID: {node['id']}"
                )
                errors += 1
            node_ids.add(node['id'])
            
            # Track node types
            node_type = node['label']
            node_types[node_type] = node_types.get(node_type, 0) + 1
            
            # Validate properties
            if 'properties' not in node:
                self.validation_results["warnings"].append(
                    f"Node {node['id']} has no properties"
                )
                continue
            
            # Type-specific validation
            self._validate_node_by_type(node)
        
        # Summary
        print(f"{Fore.GREEN if errors == 0 else Fore.RED}✓ Node validation complete{Style.RESET_ALL}")
        for node_type, count in node_types.items():
            print(f"  - {node_type}: {count}")
        
        if errors > 0:
            print(f"{Fore.RED}  ⚠️  Found {errors} node errors{Style.RESET_ALL}")
        
        return errors == 0
    
    def _validate_node_by_type(self, node: Dict[str, Any]):
        """Validate node based on its type"""
        node_type = node['label']
        props = node.get('properties', {})
        
        if node_type == 'GroundStation':
            # Required properties for ground stations
            required_props = ['name', 'latitude', 'longitude', 'investment_score']
            for prop in required_props:
                if prop not in props:
                    self.validation_results["warnings"].append(
                        f"GroundStation {node['id']} missing property: {prop}"
                    )
            
            # Validate ranges
            if 'latitude' in props:
                if not -90 <= props['latitude'] <= 90:
                    self.validation_results["errors"].append(
                        f"Invalid latitude for {node['id']}: {props['latitude']}"
                    )
            
            if 'longitude' in props:
                if not -180 <= props['longitude'] <= 180:
                    self.validation_results["errors"].append(
                        f"Invalid longitude for {node['id']}: {props['longitude']}"
                    )
            
            if 'investment_score' in props:
                if not 0 <= props['investment_score'] <= 100:
                    self.validation_results["warnings"].append(
                        f"Investment score out of range for {node['id']}: {props['investment_score']}"
                    )
        
        elif node_type == 'DemandRegion':
            required_props = ['name', 'connectivity_gap']
            for prop in required_props:
                if prop not in props:
                    self.validation_results["warnings"].append(
                        f"DemandRegion {node['id']} missing property: {prop}"
                    )
    
    def validate_edges(self) -> bool:
        """Validate edge structure and relationships"""
        print(f"\n{Fore.CYAN}🔍 Validating Edges...{Style.RESET_ALL}")
        
        edge_types = {}
        errors = 0
        
        # Get all valid node IDs
        valid_node_ids = {node['id'] for node in self.graph_data['nodes']}
        
        for i, edge in enumerate(self.graph_data['edges']):
            # Check required fields
            required_fields = ['id', 'source', 'target', 'label']
            for field in required_fields:
                if field not in edge:
                    self.validation_results["errors"].append(
                        f"Edge {i} missing '{field}' field"
                    )
                    errors += 1
                    continue
            
            # Validate source and target exist
            if edge['source'] not in valid_node_ids:
                self.validation_results["errors"].append(
                    f"Edge {edge['id']} has invalid source: {edge['source']}"
                )
                errors += 1
            
            if edge['target'] not in valid_node_ids:
                self.validation_results["errors"].append(
                    f"Edge {edge['id']} has invalid target: {edge['target']}"
                )
                errors += 1
            
            # Track edge types
            edge_type = edge['label']
            edge_types[edge_type] = edge_types.get(edge_type, 0) + 1
            
            # Validate edge type combinations
            self._validate_edge_type_combination(edge, valid_node_ids)
        
        # Summary
        print(f"{Fore.GREEN if errors == 0 else Fore.RED}✓ Edge validation complete{Style.RESET_ALL}")
        for edge_type, count in edge_types.items():
            print(f"  - {edge_type}: {count}")
        
        if errors > 0:
            print(f"{Fore.RED}  ⚠️  Found {errors} edge errors{Style.RESET_ALL}")
        
        return errors == 0
    
    def _validate_edge_type_combination(self, edge: Dict[str, Any], valid_node_ids: set):
        """Validate that edge types connect appropriate node types"""
        # Get node type mapping
        node_type_map = {
            node['id']: node['label'] 
            for node in self.graph_data['nodes']
        }
        
        source_type = node_type_map.get(edge['source'])
        target_type = node_type_map.get(edge['target'])
        edge_type = edge['label']
        
        # Define valid combinations
        valid_combinations = {
            'SERVES': ('GroundStation', 'DemandRegion'),
            'AFFECTED_BY': ('GroundStation', 'WeatherPattern'),
            'BRIDGES_WITH': ('GroundStation', 'GroundStation'),
            'COMPETES_WITH': ('GroundStation', 'GroundStation')
        }
        
        if edge_type in valid_combinations:
            expected_source, expected_target = valid_combinations[edge_type]
            if source_type != expected_source or target_type != expected_target:
                self.validation_results["warnings"].append(
                    f"Edge {edge['id']} ({edge_type}) connects "
                    f"{source_type} -> {target_type}, "
                    f"expected {expected_source} -> {expected_target}"
                )
    
    def validate_data_quality(self) -> bool:
        """Check for data quality issues"""
        print(f"\n{Fore.CYAN}🔍 Checking Data Quality...{Style.RESET_ALL}")
        
        # Check for orphaned nodes
        nodes_with_edges = set()
        for edge in self.graph_data['edges']:
            nodes_with_edges.add(edge['source'])
            nodes_with_edges.add(edge['target'])
        
        all_node_ids = {node['id'] for node in self.graph_data['nodes']}
        orphaned_nodes = all_node_ids - nodes_with_edges
        
        if orphaned_nodes:
            self.validation_results["warnings"].append(
                f"Found {len(orphaned_nodes)} orphaned nodes with no connections"
            )
            print(f"{Fore.YELLOW}  ⚠️  {len(orphaned_nodes)} orphaned nodes{Style.RESET_ALL}")
        else:
            print(f"{Fore.GREEN}  ✓ All nodes have connections{Style.RESET_ALL}")
        
        # Check for missing critical properties
        missing_props = 0
        for node in self.graph_data['nodes']:
            if node['label'] == 'GroundStation':
                props = node.get('properties', {})
                if 'investment_score' not in props or props.get('investment_score') is None:
                    missing_props += 1
        
        if missing_props > 0:
            self.validation_results["warnings"].append(
                f"{missing_props} ground stations missing investment scores"
            )
            print(f"{Fore.YELLOW}  ⚠️  {missing_props} stations missing scores{Style.RESET_ALL}")
        else:
            print(f"{Fore.GREEN}  ✓ All critical properties present{Style.RESET_ALL}")
        
        return True
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate a comprehensive validation report"""
        report = {
            "validation_time": datetime.now().isoformat(),
            "file_validated": self.export_path,
            "summary": {
                "total_nodes": len(self.graph_data.get('nodes', [])),
                "total_edges": len(self.graph_data.get('edges', [])),
                "errors": len(self.validation_results["errors"]),
                "warnings": len(self.validation_results["warnings"]),
                "info": len(self.validation_results["info"])
            },
            "details": self.validation_results,
            "status": "PASS" if len(self.validation_results["errors"]) == 0 else "FAIL"
        }
        
        return report
    
    def print_summary(self):
        """Print a summary of validation results"""
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}📊 VALIDATION SUMMARY{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        
        # Errors
        if self.validation_results["errors"]:
            print(f"\n{Fore.RED}❌ ERRORS ({len(self.validation_results['errors'])}):{Style.RESET_ALL}")
            for error in self.validation_results["errors"][:5]:  # Show first 5
                print(f"   - {error}")
            if len(self.validation_results["errors"]) > 5:
                print(f"   ... and {len(self.validation_results['errors']) - 5} more")
        
        # Warnings
        if self.validation_results["warnings"]:
            print(f"\n{Fore.YELLOW}⚠️  WARNINGS ({len(self.validation_results['warnings'])}):{Style.RESET_ALL}")
            for warning in self.validation_results["warnings"][:5]:  # Show first 5
                print(f"   - {warning}")
            if len(self.validation_results["warnings"]) > 5:
                print(f"   ... and {len(self.validation_results['warnings']) - 5} more")
        
        # Final status
        if len(self.validation_results["errors"]) == 0:
            print(f"\n{Fore.GREEN}✅ VALIDATION PASSED{Style.RESET_ALL}")
            print("Graph is ready for Kineviz!")
        else:
            print(f"\n{Fore.RED}❌ VALIDATION FAILED{Style.RESET_ALL}")
            print("Please fix errors before sending to Kineviz")
    
    def run_full_validation(self) -> bool:
        """Run all validation checks"""
        print(f"{Fore.CYAN}Starting validation of {self.export_path}...{Style.RESET_ALL}")
        
        # Load data
        if not self.load_data():
            self.print_summary()
            return False
        
        # Run all validations
        schema_valid = self.validate_schema()
        nodes_valid = self.validate_nodes() if schema_valid else False
        edges_valid = self.validate_edges() if schema_valid else False
        quality_valid = self.validate_data_quality() if schema_valid else False
        
        # Generate and save report
        report = self.generate_report()
        report_path = f"test_viz/validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n{Fore.CYAN}📄 Report saved to: {report_path}{Style.RESET_ALL}")
        
        # Print summary
        self.print_summary()
        
        return len(self.validation_results["errors"]) == 0


def validate_analytics_summary():
    """Validate the analytics summary file"""
    print(f"\n{Fore.CYAN}🔍 Validating Analytics Summary...{Style.RESET_ALL}")
    
    try:
        with open("data/analytics_summary.json", 'r') as f:
            analytics = json.load(f)
        
        required_fields = [
            'total_ground_stations',
            'high_investment_opportunities',
            'critical_coverage_gaps',
            'average_coverage_reliability'
        ]
        
        missing = [field for field in required_fields if field not in analytics]
        
        if missing:
            print(f"{Fore.YELLOW}  ⚠️  Missing fields: {', '.join(missing)}{Style.RESET_ALL}")
            return False
        else:
            print(f"{Fore.GREEN}  ✓ All KPIs present{Style.RESET_ALL}")
            for field in required_fields:
                print(f"    - {field}: {analytics[field]}")
            return True
            
    except FileNotFoundError:
        print(f"{Fore.RED}  ❌ Analytics summary not found{Style.RESET_ALL}")
        return False
    except json.JSONDecodeError:
        print(f"{Fore.RED}  ❌ Invalid JSON in analytics summary{Style.RESET_ALL}")
        return False


def main():
    """Run the complete validation suite"""
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}🚀 GROUND STATION GRAPH VALIDATION SUITE{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    
    # Check if export exists
    if not os.path.exists("data/graphxr_export.json"):
        print(f"\n{Fore.RED}❌ No export found. Please run the pipeline first:{Style.RESET_ALL}")
        print(f"   python pipelines/run_pipeline.py")
        return 1
    
    # Run graph validation
    validator = GraphValidator()
    graph_valid = validator.run_full_validation()
    
    # Validate analytics
    analytics_valid = validate_analytics_summary()
    
    # Final result
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    if graph_valid and analytics_valid:
        print(f"{Fore.GREEN}🎉 ALL VALIDATIONS PASSED!{Style.RESET_ALL}")
        print("Your data is ready for Kineviz GraphXR")
        return 0
    else:
        print(f"{Fore.RED}❌ VALIDATION FAILED{Style.RESET_ALL}")
        print("Please fix the issues above before proceeding")
        return 1


if __name__ == "__main__":
    sys.exit(main())