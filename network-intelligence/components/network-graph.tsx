"use client";

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import * as graphMetrics from 'graphology-metrics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NetworkGraphProps {
  onSelectNode: (node: any) => void;
}

export function NetworkGraph({ onSelectNode }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graph] = useState(() => new Graph());

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG groups
    const svg = d3.select(svgRef.current);
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom);

    // Build network graph
    buildNetworkGraph(graph);

    // Apply force layout
    const positions = forceAtlas2(graph, {
      iterations: 50,
      settings: {
        gravity: 1,
        scalingRatio: 10,
        barnesHutOptimize: true
      }
    });

    // Create D3 data structures
    const nodes = graph.nodes().map(node => ({
      id: node,
      ...graph.getNodeAttributes(node),
      ...positions[node]
    }));

    const links = graph.edges().map(edge => ({
      source: graph.source(edge),
      target: graph.target(edge),
      ...graph.getEdgeAttributes(edge)
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => getEdgeColor(d))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.capacity || 1));

    // Draw nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => getNodeSize(d))
      .attr("fill", (d: any) => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .call(drag(simulation) as any);

    // Add labels
    const label = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: any) => d.name || d.id)
      .attr("font-size", 12)
      .attr("dx", 15)
      .attr("dy", 4)
      .attr("fill", "currentColor");

    // Add tooltips
    node.on("mouseover", function(event, d) {
      d3.select(this).attr("stroke-width", 4);
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke-width", 2);
    })
    .on("click", (event, d) => {
      onSelectNode(d);
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    // Drag behavior
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [graph, onSelectNode]);

  return (
    <div className="relative h-full">
      <svg ref={svgRef} className="w-full h-full bg-background" />
      
      {/* Floating metrics */}
      <Card className="absolute top-20 left-4 p-4 w-64">
        <h3 className="font-semibold mb-2">Network Metrics</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Nodes</span>
            <Badge variant="secondary">{graph.order}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Edges</span>
            <Badge variant="secondary">{graph.size}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Density</span>
            <Badge variant="secondary">{(graphMetrics.graph.density(graph) * 100).toFixed(1)}%</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Helper functions
function getNodeColor(node: any) {
  const colorMap: Record<string, string> = {
    ground_station: "#ff7700",
    satellite: "#00aaff",
    cable_landing: "#00ff88",
    data_center: "#ff00ff"
  };
  return colorMap[node.type] || "#888";
}

function getNodeSize(node: any) {
  return Math.sqrt(node.capacity || 50) * 2 + 5;
}

function getEdgeColor(edge: any) {
  const utilization = edge.utilization || 0;
  if (utilization > 0.8) return "#ff4444";
  if (utilization > 0.6) return "#ffaa00";
  return "#44ff44";
}

function buildNetworkGraph(graph: Graph) {
  // Clear existing graph
  graph.clear();
  
  // Add ground stations from our real data
  const stations = [
    { id: 'gs1', name: 'Madrid Teleport', type: 'ground_station', capacity: 100, lat: 40.4168, lng: -3.7038 },
    { id: 'gs2', name: 'Frankfurt Teleport', type: 'ground_station', capacity: 150, lat: 50.1109, lng: 8.6821 },
    { id: 'gs3', name: 'Brewster Teleport', type: 'ground_station', capacity: 120, lat: 48.1067, lng: -119.6828 },
    { id: 'gs4', name: 'Fuchsstadt Teleport', type: 'ground_station', capacity: 130, lat: 50.1167, lng: 9.9333 },
    { id: 'gs5', name: 'Riverside Teleport', type: 'ground_station', capacity: 110, lat: 33.9533, lng: -117.3961 },
  ];

  // Add satellites
  const satellites = [
    { id: 'sat1', name: 'SES-17', type: 'satellite', capacity: 200 },
    { id: 'sat2', name: 'Intelsat-35e', type: 'satellite', capacity: 180 },
  ];

  // Add nodes to graph
  stations.forEach(station => {
    graph.addNode(station.id, station);
  });

  satellites.forEach(satellite => {
    graph.addNode(satellite.id, satellite);
  });

  // Add edges (connections)
  graph.addEdge('gs1', 'gs2', { capacity: 50, utilization: 0.7 });
  graph.addEdge('gs1', 'sat1', { capacity: 80, utilization: 0.85 });
  graph.addEdge('gs2', 'sat1', { capacity: 75, utilization: 0.6 });
  graph.addEdge('gs3', 'sat2', { capacity: 60, utilization: 0.4 });
  graph.addEdge('gs4', 'gs2', { capacity: 40, utilization: 0.5 });
  graph.addEdge('gs5', 'sat2', { capacity: 55, utilization: 0.75 });
}