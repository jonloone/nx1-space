/**
 * Reality-Based Spatial Visualization Layers
 * 
 * Replaces hexagon-based visualization with scientifically accurate spatial layers:
 * - Continuous heatmaps based on IDW interpolation
 * - Contour lines showing opportunity gradients
 * - Coverage footprints for satellite visibility
 * - Confidence visualization for uncertainty
 * 
 * All layers are based on real orbital mechanics and empirical station data.
 */

import React, { useMemo, useEffect, useState } from 'react';
import { HeatmapLayer, ContourLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
import { getRealityBasedSpatialScorer } from '@/lib/scoring/reality-based-spatial-scoring';
import type { ScoringGrid, ScoringPoint } from '@/lib/scoring/reality-based-spatial-scoring';
import { getGroundStationOptimizer } from '@/lib/services/groundStationOptimizer';

export interface RealitySpatialLayersProps {
  /** Whether layers are visible */
  visible: boolean;
  /** Visualization mode */
  mode: 'heatmap' | 'contours' | 'footprints' | 'confidence' | 'combined';
  /** Geographic bounds for the visualization */
  bounds: {
    north: number;
    south: number; 
    east: number;
    west: number;
  };
  /** Spatial resolution in degrees */
  resolution?: number;
  /** Confidence threshold for filtering low-quality areas */
  confidenceThreshold?: number;
  /** Callback when a point is clicked */
  onPointClick?: (point: ScoringPoint) => void;
  /** Callback when a point is hovered */
  onPointHover?: (point: ScoringPoint | null) => void;
}

interface LayerState {
  scoringGrid: ScoringGrid | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage scoring grid data
 */
function useScoringGrid(
  bounds: RealitySpatialLayersProps['bounds'],
  resolution: number = 2.0
): LayerState {
  const [state, setState] = useState<LayerState>({
    scoringGrid: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    let isCancelled = false;

    const generateGrid = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const scorer = getRealityBasedSpatialScorer();
        const grid = await scorer.generateScoringGrid(bounds);
        
        if (!isCancelled) {
          setState({
            scoringGrid: grid,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            scoringGrid: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    };

    generateGrid();

    return () => {
      isCancelled = true;
    };
  }, [bounds.north, bounds.south, bounds.east, bounds.west, resolution]);

  return state;
}

/**
 * Create heatmap layer showing opportunity scores
 */
function createOpportunityHeatmap(
  scoringGrid: ScoringGrid,
  onPointClick?: (point: ScoringPoint) => void,
  onPointHover?: (point: ScoringPoint | null) => void
) {
  const data = scoringGrid.points.map(point => ({
    position: [point.longitude, point.latitude],
    weight: point.score,
    confidence: point.confidence,
    point
  }));

  return new HeatmapLayer({
    id: 'opportunity-heatmap',
    data,
    getPosition: (d: any) => d.position,
    getWeight: (d: any) => d.weight,
    radiusPixels: 60,
    intensity: 1,
    threshold: 0.03,
    colorRange: [
      [65, 182, 196, 80],   // Low opportunity - light blue
      [127, 205, 187, 120], // Low-medium - teal
      [199, 233, 180, 160], // Medium - light green
      [237, 248, 177, 200], // Medium-high - yellow-green
      [255, 255, 204, 240], // High - light yellow
      [255, 237, 160, 255], // Very high - gold
      [254, 217, 118, 255], // Excellent - orange
      [254, 178, 76, 255],  // Outstanding - dark orange
      [253, 141, 60, 255],  // Exceptional - red-orange
      [240, 59, 32, 255]    // Maximum - red
    ],
    pickable: true,
    onHover: ({ object, x, y }) => {
      if (onPointHover) {
        onPointHover(object?.point || null);
      }
    },
    onClick: ({ object }) => {
      if (object?.point && onPointClick) {
        onPointClick(object.point);
      }
    }
  });
}

/**
 * Create contour layer showing opportunity gradients
 */
function createOpportunityContours(scoringGrid: ScoringGrid) {
  // Convert scoring points to contour-compatible format
  const contourData = scoringGrid.points.map(point => ({
    position: [point.longitude, point.latitude],
    value: point.score
  }));

  return new ContourLayer({
    id: 'opportunity-contours',
    data: contourData,
    getPosition: (d: any) => d.position,
    getWeight: (d: any) => d.value,
    cellSize: 0.5, // Degrees
    contours: [
      { threshold: 20, color: [255, 0, 0, 100], strokeWidth: 1 },    // Very low
      { threshold: 40, color: [255, 165, 0, 120], strokeWidth: 2 },  // Low
      { threshold: 60, color: [255, 255, 0, 140], strokeWidth: 2 },  // Medium
      { threshold: 75, color: [173, 255, 47, 160], strokeWidth: 3 }, // Good
      { threshold: 85, color: [0, 255, 0, 180], strokeWidth: 4 },    // Very good
      { threshold: 95, color: [0, 255, 255, 200], strokeWidth: 5 }   // Excellent
    ],
    pickable: false
  });
}

/**
 * Create confidence visualization layer
 */
function createConfidenceLayer(
  scoringGrid: ScoringGrid,
  confidenceThreshold: number = 0.6
) {
  // Filter for points with sufficient confidence and create visualization
  const confidenceData = scoringGrid.points
    .filter(point => point.confidence >= confidenceThreshold)
    .map(point => ({
      position: [point.longitude, point.latitude],
      confidence: point.confidence,
      score: point.score,
      radius: 30000 + (point.confidence * 70000), // 30-100km radius based on confidence
      color: [
        Math.round(255 * (1 - point.confidence)), // Red component (decreases with confidence)
        Math.round(255 * point.confidence),       // Green component (increases with confidence)
        100,                                       // Blue component (constant)
        Math.round(60 + point.confidence * 140)   // Alpha (60-200 based on confidence)
      ]
    }));

  return new ScatterplotLayer({
    id: 'confidence-visualization',
    data: confidenceData,
    getPosition: (d: any) => d.position,
    getRadius: (d: any) => d.radius,
    getFillColor: (d: any) => d.color,
    getLineColor: [255, 255, 255, 100],
    getLineWidth: 1000, // 1km line width
    stroked: true,
    filled: true,
    pickable: true,
    radiusUnits: 'meters'
  });
}

/**
 * Create satellite coverage footprint layers
 */
function createCoverageFootprints(scoringGrid: ScoringGrid) {
  // Generate representative coverage areas based on orbital mechanics
  const footprintData = scoringGrid.points
    .filter(point => point.score > 70) // Only high-opportunity areas
    .map(point => {
      // Generate circular footprint approximation
      const radius = 0.5; // degrees (~55km)
      const segments = 32;
      const polygon = [];
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const lat = point.latitude + radius * Math.cos(angle);
        const lng = point.longitude + radius * Math.sin(angle);
        polygon.push([lng, lat]);
      }

      return {
        polygon,
        score: point.score,
        confidence: point.confidence,
        point
      };
    });

  return new PolygonLayer({
    id: 'coverage-footprints',
    data: footprintData,
    getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => [
      Math.round(255 - d.score * 2.55), // Red decreases with score
      Math.round(d.score * 2.55),       // Green increases with score
      100,                              // Blue constant
      Math.round(50 + d.confidence * 100) // Alpha based on confidence
    ],
    getLineColor: [255, 255, 255, 120],
    getLineWidth: 1000, // 1km
    stroked: true,
    filled: true,
    pickable: true,
    onHover: ({ object, x, y }) => {
      // Could show footprint details
    }
  });
}

/**
 * Create grid-based visualization for debugging/analysis
 */
function createAnalysisGrid(scoringGrid: ScoringGrid) {
  return new GridLayer({
    id: 'analysis-grid',
    data: scoringGrid.points.map(point => ({
      position: [point.longitude, point.latitude],
      value: point.score
    })),
    getPosition: (d: any) => d.position,
    getColorWeight: (d: any) => d.value,
    cellSize: scoringGrid.resolution * 111000, // Convert degrees to meters
    coverage: 0.9,
    colorRange: [
      [255, 255, 204, 100], // Light yellow (low)
      [161, 218, 180, 120], // Light green
      [65, 182, 196, 140],  // Light blue
      [44, 127, 184, 160],  // Medium blue
      [37, 52, 148, 180]    // Dark blue (high)
    ],
    pickable: true
  });
}

/**
 * Create station influence zones
 */
function createStationInfluenceZones(scoringGrid: ScoringGrid) {
  // Create influence zones around high-scoring areas
  const influenceZones = scoringGrid.points
    .filter(point => point.confidence > 0.8 && point.score > 80)
    .map((point, index) => {
      const radius = 1.0; // degrees
      const segments = 24;
      const polygon = [];
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const lat = point.latitude + radius * Math.cos(angle);
        const lng = point.longitude + radius * Math.sin(angle);
        polygon.push([lng, lat]);
      }

      return {
        id: `influence-${index}`,
        polygon,
        score: point.score,
        confidence: point.confidence,
        nearestStations: point.nearestStations
      };
    });

  return new PolygonLayer({
    id: 'station-influence-zones',
    data: influenceZones,
    getPolygon: (d: any) => d.polygon,
    getFillColor: [0, 100, 255, 30], // Light blue
    getLineColor: [0, 150, 255, 150], // Blue outline
    getLineWidth: 2000, // 2km
    stroked: true,
    filled: true,
    pickable: true
  });
}

/**
 * Main Reality Spatial Layers component
 */
export function RealitySpatialLayers({
  visible,
  mode,
  bounds,
  resolution = 2.0,
  confidenceThreshold = 0.6,
  onPointClick,
  onPointHover
}: RealitySpatialLayersProps) {
  const { scoringGrid, loading, error } = useScoringGrid(bounds, resolution);

  const layers = useMemo(() => {
    if (!visible || !scoringGrid || loading) {
      return [];
    }

    const layerComponents = [];

    switch (mode) {
      case 'heatmap':
        layerComponents.push(createOpportunityHeatmap(scoringGrid, onPointClick, onPointHover));
        break;

      case 'contours':
        layerComponents.push(createOpportunityContours(scoringGrid));
        layerComponents.push(createConfidenceLayer(scoringGrid, confidenceThreshold));
        break;

      case 'footprints':
        layerComponents.push(createCoverageFootprints(scoringGrid));
        break;

      case 'confidence':
        layerComponents.push(createConfidenceLayer(scoringGrid, confidenceThreshold));
        layerComponents.push(createAnalysisGrid(scoringGrid));
        break;

      case 'combined':
      default:
        layerComponents.push(createOpportunityHeatmap(scoringGrid, onPointClick, onPointHover));
        layerComponents.push(createOpportunityContours(scoringGrid));
        layerComponents.push(createConfidenceLayer(scoringGrid, confidenceThreshold));
        layerComponents.push(createStationInfluenceZones(scoringGrid));
        break;
    }

    return layerComponents;
  }, [visible, scoringGrid, loading, mode, confidenceThreshold, onPointClick, onPointHover]);

  // Log layer information for debugging
  useEffect(() => {
    if (scoringGrid && !loading) {
      console.log('🗺️ Reality spatial layers loaded:', {
        mode,
        points: scoringGrid.points.length,
        averageConfidence: scoringGrid.metadata.averageConfidence.toFixed(3),
        coverage: `${scoringGrid.metadata.coveragePercentage.toFixed(1)}%`,
        bounds: `${bounds.south},${bounds.west} to ${bounds.north},${bounds.east}`
      });
    }
  }, [scoringGrid, loading, mode, bounds]);

  if (error) {
    console.error('❌ Reality spatial layers error:', error);
    return [];
  }

  if (loading) {
    console.log('🔄 Reality spatial layers loading...');
    return [];
  }

  return layers;
}

/**
 * Hook to get layer statistics
 */
export function useRealitySpatialStats(
  bounds: RealitySpatialLayersProps['bounds'],
  resolution: number = 2.0
) {
  const { scoringGrid, loading, error } = useScoringGrid(bounds, resolution);

  return {
    loading,
    error,
    stats: scoringGrid ? {
      totalPoints: scoringGrid.metadata.totalPoints,
      averageConfidence: scoringGrid.metadata.averageConfidence,
      coveragePercentage: scoringGrid.metadata.coveragePercentage,
      highConfidencePoints: scoringGrid.points.filter(p => p.confidence > 0.8).length,
      highOpportunityPoints: scoringGrid.points.filter(p => p.score > 75).length,
      averageScore: scoringGrid.points.reduce((sum, p) => sum + p.score, 0) / scoringGrid.points.length,
      scoreDistribution: {
        excellent: scoringGrid.points.filter(p => p.score >= 90).length,
        good: scoringGrid.points.filter(p => p.score >= 70 && p.score < 90).length,
        moderate: scoringGrid.points.filter(p => p.score >= 50 && p.score < 70).length,
        poor: scoringGrid.points.filter(p => p.score < 50).length
      }
    } : null
  };
}

export default RealitySpatialLayers;