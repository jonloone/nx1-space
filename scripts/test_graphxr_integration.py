#!/usr/bin/env python3
"""
GraphXR Integration Testing & Validation
Comprehensive test suite to ensure pipeline produces GraphXR-ready data
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime
import math
from collections import defaultdict, Counter
import argparse
import sys
from pathlib import Path

class GraphXRValidator:
    """Graph Visualization QA Engineer for GraphXR validation"""
    
    def __init__(self, export_file='data/transparent_graphxr_export.json'):
        self.export_file = export_file
        self.data = None
        self.nodes = []
        self.edges = []
        self.node_ids = set()
        self.test_results = {}
        self.warnings = []
        
    def load_export(self):
        """Load the GraphXR export file"""
        try:
            with open(self.export_file, 'r') as f:
                self.data = json.load(f)
            self.nodes = self.data.get('nodes', [])
            self.edges = self.data.get('edges', [])
            self.node_ids = {node['id'] for node in self.nodes}
            return True
        except Exception as e:
            print(f"❌ Failed to load export: {e}")
            return False
    
    # ============== SCHEMA VALIDATION ==============
    
    def test_node_schema_compliance(self):
        """Ensure all nodes meet GraphXR requirements"""
        issues = []
        
        # Check unique IDs
        ids = [node.get('id') for node in self.nodes]
        if len(ids) != len(set(ids)):
            duplicates = [id for id, count in Counter(ids).items() if count > 1]
            issues.append(f"Duplicate node IDs found: {duplicates}")
        
        # Check required fields
        for i, node in enumerate(self.nodes):
            if 'id' not in node:
                issues.append(f"Node {i} missing 'id' field")
            elif not isinstance(node['id'], str):
                issues.append(f"Node {node.get('id', i)} has non-string ID")
            
            if 'label' not in node:
                issues.append(f"Node {node.get('id', i)} missing 'label' field")
            
            if 'properties' not in node:
                issues.append(f"Node {node.get('id', i)} missing 'properties' field")
            elif not isinstance(node['properties'], dict):
                issues.append(f"Node {node.get('id', i)} has non-dict properties")
        
        # Check coordinate format for geographic nodes
        geo_labels = ['GroundStation', 'CommercialGroundStation']
        for node in self.nodes:
            if node.get('label') in geo_labels:
                props = node.get('properties', {})
                if 'latitude' not in props or 'longitude' not in props:
                    issues.append(f"Geographic node {node.get('id')} missing coordinates")
                else:
                    lat = props.get('latitude')
                    lon = props.get('longitude')
                    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
                        issues.append(f"Node {node.get('id')} has non-numeric coordinates")
        
        return {
            'passed': len(issues) == 0,
            'message': 'All nodes follow schema' if not issues else f"{len(issues)} schema issues",
            'issues': issues,
            'fix': 'Ensure all nodes have string IDs, labels, and dict properties'
        }
    
    def test_edge_schema_compliance(self):
        """Ensure all edges meet GraphXR requirements"""
        issues = []
        
        # Check required fields
        for i, edge in enumerate(self.edges):
            if 'source' not in edge:
                issues.append(f"Edge {i} missing 'source' field")
            elif edge['source'] not in self.node_ids:
                issues.append(f"Edge source '{edge['source']}' not found in nodes")
            
            if 'target' not in edge:
                issues.append(f"Edge {i} missing 'target' field")
            elif edge['target'] not in self.node_ids:
                issues.append(f"Edge target '{edge['target']}' not found in nodes")
            
            if 'type' not in edge and 'label' not in edge:
                issues.append(f"Edge {i} missing 'type' or 'label' field")
            
            # Check for self-loops
            if edge.get('source') == edge.get('target'):
                self.warnings.append(f"Self-loop detected: {edge.get('source')}")
        
        # Check edge ID uniqueness if present
        edge_ids = [edge.get('id') for edge in self.edges if 'id' in edge]
        if edge_ids and len(edge_ids) != len(set(edge_ids)):
            issues.append("Duplicate edge IDs found")
        
        return {
            'passed': len(issues) == 0,
            'message': 'All edges valid' if not issues else f"{len(issues)} edge issues",
            'issues': issues,
            'fix': 'Ensure all edge sources/targets exist and have type/label'
        }
    
    # ============== DATA QUALITY TESTS ==============
    
    def test_data_completeness(self):
        """Ensure sufficient data for meaningful visualization"""
        metrics = {
            'node_count': len(self.nodes),
            'edge_count': len(self.edges),
            'node_types': Counter(node.get('label') for node in self.nodes),
            'edge_types': Counter(edge.get('type', edge.get('label')) for edge in self.edges)
        }
        
        issues = []
        
        # Check node counts
        if metrics['node_count'] < 10:
            issues.append(f"Too few nodes ({metrics['node_count']}) for meaningful visualization")
        elif metrics['node_count'] > 10000:
            issues.append(f"Too many nodes ({metrics['node_count']}) may slow GraphXR")
        
        # Check edge counts
        if metrics['edge_count'] < 10:
            issues.append(f"Too few edges ({metrics['edge_count']}) for meaningful connections")
        elif metrics['edge_count'] > 50000:
            issues.append(f"Too many edges ({metrics['edge_count']}) may overwhelm GraphXR")
        
        # Check property completeness
        total_props = 0
        null_props = 0
        for node in self.nodes:
            for key, value in node.get('properties', {}).items():
                total_props += 1
                if value is None or value == '' or value == 'null':
                    null_props += 1
        
        if total_props > 0:
            completeness = (total_props - null_props) / total_props
            if completeness < 0.8:
                issues.append(f"Low property completeness: {completeness:.1%}")
        
        return {
            'passed': len(issues) == 0,
            'message': f"{metrics['node_count']} nodes, {metrics['edge_count']} edges",
            'metrics': metrics,
            'issues': issues,
            'fix': 'Adjust node/edge counts for optimal GraphXR performance'
        }
    
    def test_geographic_data(self):
        """Ensure coordinates are valid for GraphXR geo mode"""
        issues = []
        geo_nodes = []
        
        geo_labels = ['GroundStation', 'CommercialGroundStation']
        for node in self.nodes:
            if node.get('label') in geo_labels:
                props = node.get('properties', {})
                lat = props.get('latitude')
                lon = props.get('longitude')
                geo_nodes.append((node.get('id'), lat, lon))
                
                # Validate coordinates
                if lat is not None and lon is not None:
                    if not (-90 <= lat <= 90):
                        issues.append(f"Node {node.get('id')} has invalid latitude: {lat}")
                    if not (-180 <= lon <= 180):
                        issues.append(f"Node {node.get('id')} has invalid longitude: {lon}")
                    
                    # Check for null island
                    if lat == 0 and lon == 0:
                        self.warnings.append(f"Node {node.get('id')} at null island (0,0)")
                    
                    # Check precision
                    if '.' in str(lat) and len(str(lat).split('.')[-1]) > 6:
                        self.warnings.append(f"Node {node.get('id')} has excessive coordinate precision")
        
        # Check geographic distribution
        if geo_nodes:
            lats = [lat for _, lat, _ in geo_nodes if lat is not None]
            lons = [lon for _, _, lon in geo_nodes if lon is not None]
            
            if lats and max(lats) - min(lats) < 1:
                self.warnings.append("All nodes clustered in small geographic area")
        
        return {
            'passed': len(issues) == 0,
            'message': f"Validated {len(geo_nodes)} geographic nodes",
            'issues': issues,
            'warnings': self.warnings,
            'fix': 'Ensure all coordinates are valid lat/lon values'
        }
    
    # ============== PERFORMANCE TESTING ==============
    
    def test_graph_performance(self):
        """Ensure graph won't overwhelm GraphXR"""
        node_count = len(self.nodes)
        edge_count = len(self.edges)
        
        # Calculate metrics
        edge_node_ratio = edge_count / node_count if node_count > 0 else 0
        
        # Count properties
        max_props = 0
        total_string_length = 0
        for node in self.nodes:
            props = node.get('properties', {})
            max_props = max(max_props, len(props))
            for value in props.values():
                if isinstance(value, str):
                    total_string_length += len(value)
        
        # File size check
        json_size = len(json.dumps(self.data))
        
        issues = []
        recommendations = []
        
        # Check limits
        if node_count > 5000:
            issues.append(f"High node count ({node_count}) may impact performance")
            recommendations.append("Consider filtering to most relevant nodes")
        
        if edge_count > 25000:
            issues.append(f"High edge count ({edge_count}) may slow interactions")
            recommendations.append("Consider edge aggregation or filtering")
        
        if max_props > 50:
            self.warnings.append(f"Node with {max_props} properties may clutter UI")
            recommendations.append("Reduce properties to essential attributes")
        
        if json_size > 50_000_000:
            issues.append(f"Large file size: {json_size/1e6:.1f}MB")
            recommendations.append("Reduce data size for faster loading")
        
        # Optimal ranges
        optimal = node_count >= 50 and node_count <= 2000 and edge_count <= 10000
        
        return {
            'passed': len(issues) == 0,
            'message': f"{node_count} nodes, {edge_count} edges ({json_size/1e6:.1f}MB)",
            'metrics': {
                'node_count': node_count,
                'edge_count': edge_count,
                'edge_node_ratio': round(edge_node_ratio, 2),
                'file_size_mb': round(json_size/1e6, 1),
                'max_properties': max_props,
                'optimal_range': optimal
            },
            'issues': issues,
            'recommendations': recommendations,
            'fix': 'Optimize counts for GraphXR performance (500-2000 nodes ideal)'
        }
    
    def test_visual_layout(self):
        """Ensure data will create meaningful visual clusters"""
        # Build adjacency list
        graph = defaultdict(set)
        for edge in self.edges:
            source = edge.get('source')
            target = edge.get('target')
            if source and target:
                graph[source].add(target)
                graph[target].add(source)
        
        # Find connected components
        visited = set()
        components = []
        
        def dfs(node, component):
            visited.add(node)
            component.add(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    dfs(neighbor, component)
        
        for node_id in self.node_ids:
            if node_id not in visited:
                component = set()
                dfs(node_id, component)
                components.append(component)
        
        # Calculate degree distribution
        degrees = {node: len(neighbors) for node, neighbors in graph.items()}
        max_degree = max(degrees.values()) if degrees else 0
        avg_degree = sum(degrees.values()) / len(degrees) if degrees else 0
        
        # Check for issues
        issues = []
        
        if len(components) > 1:
            largest = max(len(c) for c in components)
            issues.append(f"Graph has {len(components)} disconnected components")
            if largest < len(self.nodes) * 0.8:
                issues.append("No dominant connected component")
        
        if max_degree > len(self.nodes) / 3:
            issues.append(f"Super-hub with degree {max_degree} will dominate layout")
        
        # Geographic clustering for geo nodes
        geo_labels = ['GroundStation', 'CommercialGroundStation']
        geo_nodes = [n for n in self.nodes if n.get('label') in geo_labels]
        
        if geo_nodes:
            # Simple clustering by region
            regions = defaultdict(int)
            for node in geo_nodes:
                lat = node.get('properties', {}).get('latitude', 0)
                if -30 <= lat <= 30:
                    regions['equatorial'] += 1
                elif lat > 30:
                    regions['northern'] += 1
                else:
                    regions['southern'] += 1
            
            if max(regions.values()) > len(geo_nodes) * 0.8:
                self.warnings.append("Geographic nodes heavily concentrated in one region")
        
        return {
            'passed': len(issues) == 0,
            'message': f"{len(components)} component(s), max degree {max_degree}",
            'metrics': {
                'connected_components': len(components),
                'max_degree': max_degree,
                'avg_degree': round(avg_degree, 1),
                'geographic_distribution': dict(regions) if geo_nodes else None
            },
            'issues': issues,
            'fix': 'Ensure graph is connected and avoid super-hubs'
        }
    
    # ============== FORMAT VALIDATION ==============
    
    def test_graphxr_json_format(self):
        """Validate exact format GraphXR expects"""
        issues = []
        
        # Top-level structure
        if not isinstance(self.data, dict):
            issues.append("Export is not a JSON object")
            return {'passed': False, 'message': 'Invalid JSON structure', 'issues': issues}
        
        if 'nodes' not in self.data:
            issues.append("Missing 'nodes' array")
        elif not isinstance(self.data['nodes'], list):
            issues.append("'nodes' must be an array")
        
        if 'edges' not in self.data:
            issues.append("Missing 'edges' array")
        elif not isinstance(self.data['edges'], list):
            issues.append("'edges' must be an array")
        
        # Check for GraphXR-specific formatting
        for node in self.nodes:
            if not isinstance(node.get('properties'), dict):
                issues.append(f"Node {node.get('id')} properties must be object")
        
        return {
            'passed': len(issues) == 0,
            'message': 'Valid GraphXR JSON' if not issues else f"{len(issues)} format issues",
            'issues': issues,
            'fix': 'Ensure top-level nodes/edges arrays with proper structure'
        }
    
    def test_property_types(self):
        """Ensure property types work in GraphXR"""
        type_issues = []
        self.warnings = []
        
        for node in self.nodes:
            props = node.get('properties', {})
            for key, value in props.items():
                # Check for problematic types
                if isinstance(value, float) and math.isnan(value):
                    type_issues.append(f"Node {node.get('id')} has NaN in {key}")
                
                # Check for nested objects (GraphXR flattens these)
                if isinstance(value, dict):
                    self.warnings.append(f"Nested object in {node.get('id')}.{key} will be flattened")
                
                # Check for very long strings
                if isinstance(value, str) and len(value) > 1000:
                    self.warnings.append(f"Long string in {node.get('id')}.{key}: {len(value)} chars")
                
                # Check for special characters in keys
                if not key.replace('_', '').replace('-', '').isalnum():
                    self.warnings.append(f"Property key '{key}' has special characters")
        
        return {
            'passed': len(type_issues) == 0,
            'message': 'All properties compatible' if not type_issues else f"{len(type_issues)} type issues",
            'issues': type_issues,
            'warnings': self.warnings,
            'fix': 'Remove NaN values and avoid nested objects'
        }
    
    # ============== GRAPHXR GOTCHAS ==============
    
    def test_graphxr_gotchas(self):
        """Test for known GraphXR issues"""
        gotchas_found = []
        
        # Duplicate IDs
        node_ids = [n.get('id') for n in self.nodes]
        if len(node_ids) != len(set(node_ids)):
            gotchas_found.append("Duplicate node IDs detected - GraphXR will drop duplicates")
        
        # Null coordinates
        geo_labels = ['GroundStation', 'CommercialGroundStation']
        for node in self.nodes:
            if node.get('label') in geo_labels:
                props = node.get('properties', {})
                if props.get('latitude') is None or props.get('longitude') is None:
                    gotchas_found.append(f"Null coordinates in {node.get('id')} will break geo mode")
        
        # Orphan edges
        for edge in self.edges:
            if edge.get('source') not in self.node_ids or edge.get('target') not in self.node_ids:
                gotchas_found.append("Orphan edges detected - will crash import")
                break
        
        # Special characters in IDs
        for node in self.nodes:
            node_id = str(node.get('id', ''))
            if ' ' in node_id or any(c in node_id for c in ['/', '\\', '?', '#', '&']):
                gotchas_found.append(f"Special characters in ID '{node_id}' may cause issues")
        
        return {
            'passed': len(gotchas_found) == 0,
            'message': 'No known gotchas' if not gotchas_found else f"{len(gotchas_found)} gotchas found",
            'issues': gotchas_found,
            'fix': 'Address GraphXR-specific issues before import'
        }
    
    # ============== MAIN TEST RUNNER ==============
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🧪 GRAPHXR INTEGRATION TEST SUITE")
        print("=" * 50)
        
        if not self.load_export():
            return False
        
        # Stage 1: Schema Validation
        print("\n📋 Stage 1: Schema Validation...")
        self.test_results['node_schema'] = self.test_node_schema_compliance()
        self.test_results['edge_schema'] = self.test_edge_schema_compliance()
        
        # Stage 2: Data Quality
        print("\n📊 Stage 2: Data Quality Tests...")
        self.test_results['completeness'] = self.test_data_completeness()
        self.test_results['geographic'] = self.test_geographic_data()
        
        # Stage 3: Performance
        print("\n⚡ Stage 3: Performance Testing...")
        self.test_results['performance'] = self.test_graph_performance()
        self.test_results['visual_layout'] = self.test_visual_layout()
        
        # Stage 4: Format & Compatibility
        print("\n🎨 Stage 4: GraphXR Compatibility...")
        self.test_results['json_format'] = self.test_graphxr_json_format()
        self.test_results['property_types'] = self.test_property_types()
        self.test_results['gotchas'] = self.test_graphxr_gotchas()
        
        # Generate report
        self.generate_report()
        
        # Return overall pass/fail
        passed_count = sum(1 for r in self.test_results.values() if r['passed'])
        return passed_count == len(self.test_results)
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 50)
        print("📋 TEST REPORT")
        print("=" * 50)
        
        passed_count = 0
        failed_count = 0
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result['passed'] else "❌ FAIL"
            print(f"{status} {test_name}: {result['message']}")
            
            if result['passed']:
                passed_count += 1
            else:
                failed_count += 1
        
        # Summary metrics
        print(f"\n🎯 Overall: {passed_count}/{len(self.test_results)} tests passed")
        
        # Performance metrics
        perf = self.test_results.get('performance', {}).get('metrics', {})
        if perf:
            print(f"\n📏 Graph Metrics:")
            print(f"  - Nodes: {perf.get('node_count', 0)} {'✅' if perf.get('optimal_range', False) else '⚠️'}")
            print(f"  - Edges: {perf.get('edge_count', 0)}")
            print(f"  - File size: {perf.get('file_size_mb', 0)}MB")
            print(f"  - Edge/Node ratio: {perf.get('edge_node_ratio', 0)}")
        
        # Issues to fix
        if failed_count > 0:
            print("\n⚠️  ISSUES TO FIX BEFORE GRAPHXR:")
            for test_name, result in self.test_results.items():
                if not result['passed']:
                    print(f"\n  {test_name}:")
                    if 'issues' in result:
                        for issue in result['issues'][:3]:  # Show first 3 issues
                            print(f"    - {issue}")
                    print(f"    Fix: {result.get('fix', 'See issues above')}")
        
        # Warnings
        all_warnings = []
        for result in self.test_results.values():
            if 'warnings' in result:
                all_warnings.extend(result['warnings'])
        
        if all_warnings:
            print(f"\n⚠️  WARNINGS ({len(all_warnings)}):")
            for warning in all_warnings[:5]:  # Show first 5 warnings
                print(f"  - {warning}")
        
        # Ready status
        if passed_count == len(self.test_results):
            print("\n✅ Export ready for Kineviz GraphXR! 🚀")
            print(f"📦 File: {self.export_file}")
        else:
            print("\n❌ Fix issues before importing to GraphXR")
    
    def generate_preview(self):
        """Generate a preview of what GraphXR will show"""
        print("\n" + "=" * 50)
        print("🎨 GRAPHXR PREVIEW")
        print("=" * 50)
        
        # Node type distribution
        node_types = Counter(node.get('label') for node in self.nodes)
        print("\n📊 Node Types:")
        for node_type, count in node_types.most_common():
            print(f"  - {node_type}: {count}")
        
        # Edge type distribution
        edge_types = Counter(edge.get('type', edge.get('label')) for edge in self.edges)
        print("\n🔗 Edge Types:")
        for edge_type, count in edge_types.most_common():
            print(f"  - {edge_type}: {count}")
        
        # Sample nodes
        print("\n📍 Sample Nodes:")
        for node in self.nodes[:3]:
            print(f"  - {node.get('id')} ({node.get('label')})")
            props = node.get('properties', {})
            for key, value in list(props.items())[:3]:
                print(f"    • {key}: {value}")

def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(description='GraphXR Integration Testing')
    parser.add_argument('--file', default='data/transparent_graphxr_export.json',
                       help='GraphXR export file to test')
    parser.add_argument('--schema-only', action='store_true',
                       help='Run only schema tests')
    parser.add_argument('--performance-only', action='store_true',
                       help='Run only performance tests')
    parser.add_argument('--quick-check', action='store_true',
                       help='Run quick validation only')
    parser.add_argument('--generate-preview', action='store_true',
                       help='Generate preview of GraphXR visualization')
    
    args = parser.parse_args()
    
    # Check if file exists
    if not Path(args.file).exists():
        print(f"❌ File not found: {args.file}")
        sys.exit(1)
    
    validator = GraphXRValidator(args.file)
    
    if args.generate_preview:
        validator.load_export()
        validator.generate_preview()
    elif args.quick_check:
        validator.load_export()
        result = validator.test_graphxr_json_format()
        print("✅ Valid GraphXR format" if result['passed'] else "❌ Invalid format")
    else:
        success = validator.run_all_tests()
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()