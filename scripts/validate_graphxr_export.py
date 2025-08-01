#!/usr/bin/env python3
"""
Validate GraphXR export for Kineviz compatibility
"""

import json
import pandas as pd
from datetime import datetime

def validate_graphxr_export():
    """Validate the enhanced GraphXR export"""
    print("🔍 Validating Enhanced GraphXR Export for Kineviz")
    print("=" * 60)
    
    # Load the export
    try:
        with open('data/enhanced_graphxr_export.json', 'r') as f:
            graph_data = json.load(f)
        print("✅ Successfully loaded enhanced GraphXR export")
    except Exception as e:
        print(f"❌ Error loading export: {e}")
        return False
    
    # Validate structure
    if 'nodes' not in graph_data or 'edges' not in graph_data:
        print("❌ Missing required 'nodes' or 'edges' keys")
        return False
    
    print(f"\n📊 Graph Statistics:")
    print(f"  - Total nodes: {len(graph_data['nodes'])}")
    print(f"  - Total edges: {len(graph_data['edges'])}")
    
    # Validate nodes
    print("\n🔍 Validating Nodes:")
    node_types = {}
    node_ids = set()
    invalid_nodes = []
    
    for node in graph_data['nodes']:
        # Check required fields
        if 'id' not in node:
            invalid_nodes.append("Missing 'id' field")
            continue
        if 'label' not in node:
            invalid_nodes.append(f"Node {node['id']} missing 'label' field")
            continue
        if 'properties' not in node:
            invalid_nodes.append(f"Node {node['id']} missing 'properties' field")
            continue
        
        # Track node types
        node_type = node['label']
        node_types[node_type] = node_types.get(node_type, 0) + 1
        
        # Check for duplicate IDs
        if node['id'] in node_ids:
            invalid_nodes.append(f"Duplicate node ID: {node['id']}")
        node_ids.add(node['id'])
    
    if invalid_nodes:
        print(f"❌ Found {len(invalid_nodes)} invalid nodes:")
        for error in invalid_nodes[:5]:
            print(f"   - {error}")
    else:
        print("✅ All nodes are valid")
    
    print("\n📊 Node Types:")
    for node_type, count in sorted(node_types.items()):
        print(f"  - {node_type}: {count}")
    
    # Validate edges
    print("\n🔍 Validating Edges:")
    edge_types = {}
    invalid_edges = []
    
    for edge in graph_data['edges']:
        # Check required fields
        if 'source' not in edge:
            invalid_edges.append("Missing 'source' field")
            continue
        if 'target' not in edge:
            invalid_edges.append("Missing 'target' field")
            continue
        if 'type' not in edge:
            invalid_edges.append(f"Edge {edge.get('source')}->{edge.get('target')} missing 'type' field")
            continue
        
        # Check if source/target nodes exist
        if edge['source'] not in node_ids:
            invalid_edges.append(f"Source node '{edge['source']}' does not exist")
        if edge['target'] not in node_ids:
            invalid_edges.append(f"Target node '{edge['target']}' does not exist")
        
        # Track edge types
        edge_type = edge['type']
        edge_types[edge_type] = edge_types.get(edge_type, 0) + 1
    
    if invalid_edges:
        print(f"❌ Found {len(invalid_edges)} invalid edges:")
        for error in invalid_edges[:5]:
            print(f"   - {error}")
    else:
        print("✅ All edges are valid")
    
    print("\n📊 Edge Types:")
    for edge_type, count in sorted(edge_types.items()):
        print(f"  - {edge_type}: {count}")
    
    # Validate data quality
    print("\n🔍 Validating Data Quality:")
    
    # Check ground stations
    ground_stations = [n for n in graph_data['nodes'] if n['label'] == 'GroundStation']
    print(f"\n📡 Ground Stations: {len(ground_stations)}")
    
    missing_scores = []
    for station in ground_stations:
        props = station['properties']
        required_props = ['latitude', 'longitude', 'enhanced_investment_score']
        for prop in required_props:
            if prop not in props:
                missing_scores.append(f"Station {props.get('name', 'Unknown')} missing {prop}")
    
    if missing_scores:
        print(f"⚠️  Some ground stations missing properties:")
        for msg in missing_scores[:5]:
            print(f"   - {msg}")
    else:
        print("✅ All ground stations have required properties")
    
    # Create Kineviz-ready summary
    print("\n📄 Creating Kineviz Import Summary...")
    
    summary = {
        "validation_date": datetime.now().isoformat(),
        "graph_valid": len(invalid_nodes) == 0 and len(invalid_edges) == 0,
        "statistics": {
            "total_nodes": len(graph_data['nodes']),
            "total_edges": len(graph_data['edges']),
            "node_types": node_types,
            "edge_types": edge_types
        },
        "ground_station_analysis": {
            "total": len(ground_stations),
            "with_investment_scores": len([s for s in ground_stations if 'enhanced_investment_score' in s['properties']]),
            "investment_categories": {}
        },
        "kineviz_ready": True,
        "import_instructions": [
            "1. Open Kineviz GraphXR",
            "2. Create new project or open existing",
            "3. Use Import > JSON",
            "4. Upload enhanced_graphxr_export.json",
            "5. Apply layout (Force, Geo, or Hierarchical)",
            "6. Style nodes by type and investment score",
            "7. Filter by investment_recommendation for opportunities"
        ]
    }
    
    # Count investment categories
    for station in ground_stations:
        rec = station['properties'].get('investment_recommendation', 'unknown')
        summary['ground_station_analysis']['investment_categories'][rec] = \
            summary['ground_station_analysis']['investment_categories'].get(rec, 0) + 1
    
    with open('data/kineviz_validation_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n✅ Validation complete!")
    print(f"   Summary saved to: data/kineviz_validation_summary.json")
    
    # Final recommendations
    print("\n🎯 Kineviz Visualization Recommendations:")
    print("1. Use GEO layout for ground stations (lat/lon properties)")
    print("2. Size nodes by 'enhanced_investment_score'")
    print("3. Color nodes by 'investment_recommendation'")
    print("4. Show edge labels for relationship types")
    print("5. Create filters for:")
    print("   - Investment categories (excellent/good/moderate/poor)")
    print("   - Node types (GroundStation/SatelliteConstellation/FiberHub)")
    print("   - Risk levels (political_risk, rain_fade_risk)")
    
    return summary['graph_valid']

if __name__ == "__main__":
    is_valid = validate_graphxr_export()
    
    if is_valid:
        print("\n✅ GraphXR export is valid and ready for Kineviz!")
    else:
        print("\n❌ GraphXR export has issues that need to be fixed")