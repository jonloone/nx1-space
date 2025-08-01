"""
Interactive Graph Visualization for Ground Station Intelligence Network
Run with: streamlit run test_viz/streamlit_graph_viewer.py
"""

import streamlit as st
from pyvis.network import Network
import json
import pandas as pd
import os
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(
    page_title="Ground Station Graph Viewer", 
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🛰️ Ground Station Investment Intelligence - Graph Preview")
st.markdown("### Interactive visualization for pre-Kineviz validation")

@st.cache_data
def load_graph_data():
    """Load the GraphXR export data"""
    export_path = "data/graphxr_export.json"
    sample_path = "data/graphxr_export_sample.json"
    
    # Try full export first, fall back to sample
    if os.path.exists(export_path):
        with open(export_path, 'r') as f:
            return json.load(f)
    elif os.path.exists(sample_path):
        st.warning("Using sample data. Run full pipeline for complete dataset.")
        with open(sample_path, 'r') as f:
            return json.load(f)
    else:
        st.error("No graph data found. Please run the pipeline first.")
        return None

@st.cache_data
def load_analytics_summary():
    """Load analytics summary"""
    if os.path.exists("data/analytics_summary.json"):
        with open("data/analytics_summary.json", 'r') as f:
            return json.load(f)
    return None

def create_network_viz(graph_data, filters):
    """Create PyVis network visualization"""
    net = Network(
        height="600px", 
        width="100%", 
        bgcolor="#1e1e1e", 
        font_color="white",
        notebook=False,
        directed=True
    )
    
    # Configure physics
    net.barnes_hut(
        gravity=-5000,
        central_gravity=0.3,
        spring_length=200,
        spring_strength=0.05,
        damping=0.2
    )
    
    # Track node types for statistics
    node_counts = {"GroundStation": 0, "DemandRegion": 0, "WeatherPattern": 0}
    edge_counts = {}
    
    # Add nodes
    for node in graph_data['nodes']:
        # Apply filters
        node_props = node.get('properties', {})
        
        # Filter by investment score
        if node['label'] == 'GroundStation':
            if node_props.get('investment_score', 0) < filters['min_investment_score']:
                continue
            node_counts['GroundStation'] += 1
            
            # Style ground stations
            color = '#4A90E2' if node_props.get('operator_type') == 'commercial' else '#2ECC71'
            size = max(10, node_props.get('investment_score', 50) / 2)
            shape = 'dot'
            
        elif node['label'] == 'DemandRegion':
            if node_props.get('connectivity_gap', 0) < filters['min_connectivity_gap']:
                continue
            node_counts['DemandRegion'] += 1
            
            # Style demand regions
            color = '#E74C3C'
            size = max(10, node_props.get('connectivity_gap', 50) / 2)
            shape = 'square'
            
        elif node['label'] == 'WeatherPattern':
            if not filters['show_weather']:
                continue
            node_counts['WeatherPattern'] += 1
            
            # Style weather patterns
            color = '#F39C12'
            size = 20
            shape = 'triangle'
        
        # Create hover text
        hover_text = f"<b>{node['label']}</b><br>"
        hover_text += f"ID: {node['id']}<br>"
        for key, value in node_props.items():
            if isinstance(value, (int, float)):
                hover_text += f"{key}: {value:.2f}<br>"
            else:
                hover_text += f"{key}: {value}<br>"
        
        # Add node to network
        net.add_node(
            node['id'],
            label=node_props.get('name', node['id']),
            title=hover_text,
            color=color,
            size=size,
            shape=shape
        )
    
    # Add edges
    for edge in graph_data['edges']:
        # Only add edge if both nodes exist in our filtered set
        if edge['source'] in net.nodes and edge['target'] in net.nodes:
            edge_type = edge['label']
            edge_counts[edge_type] = edge_counts.get(edge_type, 0) + 1
            
            # Style edges by type
            edge_colors = {
                'SERVES': '#3498DB',
                'AFFECTED_BY': '#E67E22',
                'BRIDGES_WITH': '#9B59B6',
                'COMPETES_WITH': '#E74C3C'
            }
            
            net.add_edge(
                edge['source'],
                edge['target'],
                title=edge['label'],
                color=edge_colors.get(edge['label'], '#95A5A6'),
                width=2 if edge['label'] in ['SERVES', 'BRIDGES_WITH'] else 1
            )
    
    return net, node_counts, edge_counts

# Sidebar controls
st.sidebar.header("🎛️ Visualization Controls")

# Filters
st.sidebar.subheader("Node Filters")
min_investment = st.sidebar.slider(
    "Min Investment Score", 
    0, 100, 30,
    help="Filter ground stations by minimum investment score"
)
min_connectivity = st.sidebar.slider(
    "Min Connectivity Gap", 
    0, 100, 20,
    help="Filter demand regions by minimum connectivity gap"
)
show_weather = st.sidebar.checkbox(
    "Show Weather Patterns", 
    value=False,
    help="Include weather pattern nodes in visualization"
)

filters = {
    'min_investment_score': min_investment,
    'min_connectivity_gap': min_connectivity,
    'show_weather': show_weather
}

# Load data
graph_data = load_graph_data()
analytics = load_analytics_summary()

if graph_data:
    # Display KPIs
    if analytics:
        st.markdown("### 📊 Key Performance Indicators")
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Total Ground Stations",
                analytics['total_ground_stations'],
                help="Number of ground stations in the network"
            )
        
        with col2:
            st.metric(
                "High Investment Opportunities",
                analytics['high_investment_opportunities'],
                help="Stations with investment score > 70"
            )
        
        with col3:
            st.metric(
                "Critical Coverage Gaps",
                analytics['critical_coverage_gaps'],
                help="Regions with connectivity gap > 80"
            )
        
        with col4:
            st.metric(
                "Average Coverage Reliability",
                f"{analytics['average_coverage_reliability']:.1f}%",
                help="Mean reliability across all stations"
            )
    
    # Create and display network
    st.markdown("### 🌐 Interactive Network Graph")
    
    with st.spinner("Rendering network visualization..."):
        net, node_counts, edge_counts = create_network_viz(graph_data, filters)
        
        # Save and display
        net.save_graph("test_viz/graph.html")
        
        # Add custom CSS to the HTML
        with open("test_viz/graph.html", 'r') as f:
            html_content = f.read()
        
        # Inject custom styling
        custom_css = """
        <style>
        #mynetwork {
            border: 2px solid #333;
            border-radius: 10px;
        }
        </style>
        """
        html_content = html_content.replace('</head>', f'{custom_css}</head>')
        
        # Display
        st.components.v1.html(html_content, height=650)
    
    # Display statistics
    st.markdown("### 📈 Graph Statistics")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**Node Counts**")
        node_df = pd.DataFrame(
            list(node_counts.items()), 
            columns=['Node Type', 'Count']
        )
        fig = px.bar(
            node_df, 
            x='Node Type', 
            y='Count',
            color='Node Type',
            color_discrete_map={
                'GroundStation': '#4A90E2',
                'DemandRegion': '#E74C3C',
                'WeatherPattern': '#F39C12'
            }
        )
        fig.update_layout(
            showlegend=False,
            height=300,
            margin=dict(t=20, b=20, l=20, r=20)
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.markdown("**Edge Counts**")
        edge_df = pd.DataFrame(
            list(edge_counts.items()), 
            columns=['Edge Type', 'Count']
        )
        fig = px.bar(
            edge_df, 
            x='Edge Type', 
            y='Count',
            color='Edge Type',
            color_discrete_map={
                'SERVES': '#3498DB',
                'AFFECTED_BY': '#E67E22',
                'BRIDGES_WITH': '#9B59B6',
                'COMPETES_WITH': '#E74C3C'
            }
        )
        fig.update_layout(
            showlegend=False,
            height=300,
            margin=dict(t=20, b=20, l=20, r=20)
        )
        st.plotly_chart(fig, use_container_width=True)
    
    # Data tables
    with st.expander("📋 View Raw Data"):
        tab1, tab2 = st.tabs(["Nodes", "Edges"])
        
        with tab1:
            # Convert nodes to dataframe
            node_records = []
            for node in graph_data['nodes']:
                record = {
                    'ID': node['id'],
                    'Type': node['label'],
                    **node.get('properties', {})
                }
                node_records.append(record)
            
            nodes_df = pd.DataFrame(node_records)
            st.dataframe(
                nodes_df,
                use_container_width=True,
                height=400
            )
            
            # Download button
            csv = nodes_df.to_csv(index=False)
            st.download_button(
                label="Download Nodes CSV",
                data=csv,
                file_name=f"graph_nodes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
        
        with tab2:
            # Convert edges to dataframe
            edge_records = []
            for edge in graph_data['edges']:
                record = {
                    'ID': edge['id'],
                    'Source': edge['source'],
                    'Target': edge['target'],
                    'Type': edge['label'],
                    **edge.get('properties', {})
                }
                edge_records.append(record)
            
            edges_df = pd.DataFrame(edge_records)
            st.dataframe(
                edges_df,
                use_container_width=True,
                height=400
            )
            
            # Download button
            csv = edges_df.to_csv(index=False)
            st.download_button(
                label="Download Edges CSV",
                data=csv,
                file_name=f"graph_edges_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
    
    # Export options
    st.markdown("### 💾 Export Options")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🔄 Refresh Data", type="primary"):
            st.cache_data.clear()
            st.rerun()
    
    with col2:
        # Download filtered graph
        filtered_graph = {
            'nodes': [n for n in graph_data['nodes'] if n['id'] in net.nodes],
            'edges': [e for e in graph_data['edges'] 
                     if e['source'] in net.nodes and e['target'] in net.nodes]
        }
        
        st.download_button(
            label="📥 Download Filtered Graph",
            data=json.dumps(filtered_graph, indent=2),
            file_name=f"filtered_graph_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            mime="application/json"
        )
    
    with col3:
        st.download_button(
            label="📊 Download Full Export",
            data=json.dumps(graph_data, indent=2),
            file_name=f"full_graph_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            mime="application/json"
        )

else:
    st.error("❌ No graph data available. Please run the pipeline first:")
    st.code("python pipelines/run_pipeline.py", language="bash")

# Footer
st.markdown("---")
st.markdown(
    "**Validation Tool** | Created for pre-Kineviz testing | "
    f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
)