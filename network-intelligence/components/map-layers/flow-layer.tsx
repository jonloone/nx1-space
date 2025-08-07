'use client';

import React from 'react';
import { LineLayer } from '@deck.gl/layers';
import { PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';

interface FlowLayerProps {
  stationData: PrecomputedStationScore[];
  visible: boolean;
}

interface FlowConnection {
  source: [number, number]; // [lng, lat]
  target: [number, number]; // [lng, lat]
  value: number; // Connection strength/volume
  color: [number, number, number, number];
}

export function FlowLayer({ stationData, visible }: FlowLayerProps) {
  
  // Generate flow connections between stations
  const generateFlows = (): FlowConnection[] => {
    const flows: FlowConnection[] = [];
    
    // Create connections between high-performing stations
    const highPerformers = stationData
      .filter(s => s.overallScore >= 80)
      .sort((a, b) => b.overallScore - a.overallScore);
      
    // Connect stations within the same operator network
    const seStations = stationData.filter(s => s.operator === 'SES');
    const intelsatStations = stationData.filter(s => s.operator === 'Intelsat');
    
    // SES network flows (blue theme)
    for (let i = 0; i < seStations.length - 1; i++) {
      for (let j = i + 1; j < seStations.length; j++) {
        const source = seStations[i];
        const target = seStations[j];
        
        // Calculate flow strength based on combined scores and distance
        const distance = calculateDistance(source.coordinates, target.coordinates);
        const avgScore = (source.overallScore + target.overallScore) / 2;
        const flowStrength = Math.max(0, (avgScore / 100) - (distance / 15000)); // Penalize long distances
        
        if (flowStrength > 0.3) { // Only show significant flows
          flows.push({
            source: [source.coordinates[1], source.coordinates[0]], // [lng, lat]
            target: [target.coordinates[1], target.coordinates[0]], // [lng, lat]
            value: flowStrength,
            color: [59, 130, 246, Math.floor(flowStrength * 150)] // Blue with variable alpha
          });
        }
      }
    }
    
    // Intelsat network flows (purple theme)
    for (let i = 0; i < intelsatStations.length - 1; i++) {
      for (let j = i + 1; j < intelsatStations.length; j++) {
        const source = intelsatStations[i];
        const target = intelsatStations[j];
        
        const distance = calculateDistance(source.coordinates, target.coordinates);
        const avgScore = (source.overallScore + target.overallScore) / 2;
        const flowStrength = Math.max(0, (avgScore / 100) - (distance / 15000));
        
        if (flowStrength > 0.3) {
          flows.push({
            source: [source.coordinates[1], source.coordinates[0]],
            target: [target.coordinates[1], target.coordinates[0]],
            value: flowStrength,
            color: [168, 85, 247, Math.floor(flowStrength * 150)] // Purple with variable alpha
          });
        }
      }
    }
    
    // Cross-operator strategic flows (for major hubs)
    const majorHubs = stationData.filter(s => 
      s.type === 'Primary Teleport' && s.overallScore >= 85
    );
    
    for (let i = 0; i < majorHubs.length - 1; i++) {
      for (let j = i + 1; j < majorHubs.length; j++) {
        const source = majorHubs[i];
        const target = majorHubs[j];
        
        // Only connect if different operators (strategic partnerships)
        if (source.operator !== target.operator) {
          const distance = calculateDistance(source.coordinates, target.coordinates);
          const avgScore = (source.overallScore + target.overallScore) / 2;
          const flowStrength = Math.max(0, (avgScore / 100) - (distance / 20000)); // More lenient for hubs
          
          if (flowStrength > 0.4) {
            flows.push({
              source: [source.coordinates[1], source.coordinates[0]],
              target: [target.coordinates[1], target.coordinates[0]],
              value: flowStrength,
              color: [34, 197, 94, Math.floor(flowStrength * 120)] // Green for cross-operator
            });
          }
        }
      }
    }
    
    return flows;
  };
  
  // Calculate great circle distance between two points
  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const [lat1, lng1] = coord1;
    const [lat2, lng2] = coord2;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  if (!visible) return null;
  
  const flows = generateFlows();
  
  return new LineLayer({
    id: 'station-flows',
    data: flows,
    getSourcePosition: (d: FlowConnection) => d.source,
    getTargetPosition: (d: FlowConnection) => d.target,
    getColor: (d: FlowConnection) => d.color,
    getWidth: (d: FlowConnection) => Math.max(1, d.value * 8), // Scale line width by flow strength
    widthMinPixels: 1,
    widthMaxPixels: 12,
    pickable: false,
    autoHighlight: false,
    highlightColor: [255, 255, 255, 100],
    updateTriggers: {
      getWidth: [flows],
      getColor: [flows]
    }
  });
}

// Helper function to create the layer for use in deck.gl
export function createFlowLayer(stationData: PrecomputedStationScore[], visible: boolean = true) {
  const generateFlows = (): FlowConnection[] => {
    const flows: FlowConnection[] = [];
    
    // Create connections between high-performing stations
    const highPerformers = stationData
      .filter(s => s.overallScore >= 80)
      .sort((a, b) => b.overallScore - a.overallScore);
      
    // Connect stations within the same operator network
    const sesStations = stationData.filter(s => s.operator === 'SES');
    const intelsatStations = stationData.filter(s => s.operator === 'Intelsat');
    
    // Calculate great circle distance between two points
    const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
      const [lat1, lng1] = coord1;
      const [lat2, lng2] = coord2;
      
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    // SES network flows (blue theme)
    for (let i = 0; i < sesStations.length - 1; i++) {
      for (let j = i + 1; j < sesStations.length; j++) {
        const source = sesStations[i];
        const target = sesStations[j];
        
        // Calculate flow strength based on combined scores and distance
        const distance = calculateDistance(source.coordinates, target.coordinates);
        const avgScore = (source.overallScore + target.overallScore) / 2;
        const flowStrength = Math.max(0, (avgScore / 100) - (distance / 15000)); // Penalize long distances
        
        if (flowStrength > 0.3) { // Only show significant flows
          flows.push({
            source: [source.coordinates[1], source.coordinates[0]], // [lng, lat]
            target: [target.coordinates[1], target.coordinates[0]], // [lng, lat]
            value: flowStrength,
            color: [59, 130, 246, Math.floor(flowStrength * 150)]
          });
        }
      }
    }
    
    // Intelsat network flows (purple theme)
    for (let i = 0; i < intelsatStations.length - 1; i++) {
      for (let j = i + 1; j < intelsatStations.length; j++) {
        const source = intelsatStations[i];
        const target = intelsatStations[j];
        
        const distance = calculateDistance(source.coordinates, target.coordinates);
        const avgScore = (source.overallScore + target.overallScore) / 2;
        const flowStrength = Math.max(0, (avgScore / 100) - (distance / 15000));
        
        if (flowStrength > 0.3) {
          flows.push({
            source: [source.coordinates[1], source.coordinates[0]],
            target: [target.coordinates[1], target.coordinates[0]],
            value: flowStrength,
            color: [168, 85, 247, Math.floor(flowStrength * 150)]
          });
        }
      }
    }
    
    // Major hub connections
    const majorHubs = stationData.filter(s => 
      s.type === 'Primary Teleport' && s.overallScore >= 85
    );
    
    for (let i = 0; i < majorHubs.length - 1; i++) {
      for (let j = i + 1; j < majorHubs.length; j++) {
        const source = majorHubs[i];
        const target = majorHubs[j];
        
        if (source.operator !== target.operator) {
          const distance = calculateDistance(source.coordinates, target.coordinates);
          const avgScore = (source.overallScore + target.overallScore) / 2;
          const flowStrength = Math.max(0, (avgScore / 100) - (distance / 20000));
          
          if (flowStrength > 0.4) {
            flows.push({
              source: [source.coordinates[1], source.coordinates[0]],
              target: [target.coordinates[1], target.coordinates[0]],
              value: flowStrength,
              color: [34, 197, 94, Math.floor(flowStrength * 120)]
            });
          }
        }
      }
    }
    
    return flows;
  };
  
  const flows = generateFlows();
  
  return new LineLayer({
    id: 'station-flows',
    data: flows,
    visible,
    getSourcePosition: (d: FlowConnection) => d.source,
    getTargetPosition: (d: FlowConnection) => d.target,
    getColor: (d: FlowConnection) => d.color,
    getWidth: (d: FlowConnection) => Math.max(1, d.value * 8),
    widthMinPixels: 1,
    widthMaxPixels: 12,
    pickable: true,
    autoHighlight: false,
    highlightColor: [255, 255, 255, 100],
    updateTriggers: {
      getWidth: [flows],
      getColor: [flows],
      visible: [visible]
    }
  });
}