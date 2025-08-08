/**
 * Confidence and Uncertainty Visualization System
 * 
 * Provides comprehensive uncertainty visualization for all spatial analyses:
 * - Confidence intervals and uncertainty bands
 * - Data quality indicators
 * - Interpolation reliability metrics
 * - Model validation results
 * - Visual uncertainty encoding through color, transparency, and patterns
 */

import React, { useMemo, useState, useEffect } from 'react';
import { ScatterplotLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { ScoringPoint, ScoringGrid } from '@/lib/scoring/reality-based-spatial-scoring';
import { getRealityBasedSpatialScorer } from '@/lib/scoring/reality-based-spatial-scoring';

export interface ConfidenceVisualizationProps {
  /** Whether the confidence visualization is visible */
  visible: boolean;
  /** The scoring grid data */
  scoringGrid: ScoringGrid | null;
  /** Visualization mode for confidence */
  mode: 'overlay' | 'standalone' | 'detailed';
  /** Confidence threshold for filtering */
  confidenceThreshold: number;
  /** Whether to show uncertainty bands */
  showUncertaintyBands: boolean;
  /** Whether to show validation indicators */
  showValidation: boolean;
  /** Callback when confidence area is clicked */
  onConfidenceClick?: (point: ScoringPoint, confidence: number) => void;
}

interface ValidationResult {
  station: string;
  predicted: number;
  actual: number;
  error: number;
  confidence: number;
  coordinates: [number, number];
}

interface ConfidenceMetrics {
  averageConfidence: number;
  confidenceRange: { min: number; max: number };
  highConfidenceArea: number; // km²
  lowConfidenceArea: number;  // km²
  validationAccuracy: number;
  uncertaintyLevel: 'low' | 'medium' | 'high';
}

/**
 * Hook to get confidence metrics from scoring data
 */
function useConfidenceMetrics(scoringGrid: ScoringGrid | null): ConfidenceMetrics | null {
  return useMemo(() => {
    if (!scoringGrid || scoringGrid.points.length === 0) {
      return null;
    }

    const confidences = scoringGrid.points.map(p => p.confidence);
    const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const confidenceRange = {
      min: Math.min(...confidences),
      max: Math.max(...confidences)
    };

    // Calculate coverage areas (rough approximation)
    const cellArea = scoringGrid.resolution * scoringGrid.resolution * 12100; // km² per degree²
    const highConfidencePoints = scoringGrid.points.filter(p => p.confidence > 0.7).length;
    const lowConfidencePoints = scoringGrid.points.filter(p => p.confidence < 0.4).length;

    const highConfidenceArea = highConfidencePoints * cellArea;
    const lowConfidenceArea = lowConfidencePoints * cellArea;

    // Determine overall uncertainty level
    let uncertaintyLevel: 'low' | 'medium' | 'high' = 'medium';
    if (averageConfidence > 0.8) uncertaintyLevel = 'low';
    else if (averageConfidence < 0.5) uncertaintyLevel = 'high';

    return {
      averageConfidence,
      confidenceRange,
      highConfidenceArea,
      lowConfidenceArea,
      validationAccuracy: scoringGrid.metadata.validationAccuracy || 0,
      uncertaintyLevel
    };
  }, [scoringGrid]);
}

/**
 * Create confidence overlay layer
 */
function createConfidenceOverlay(
  scoringGrid: ScoringGrid,
  confidenceThreshold: number,
  onConfidenceClick?: ConfidenceVisualizationProps['onConfidenceClick']
) {
  const confidenceData = scoringGrid.points.map(point => ({
    position: [point.longitude, point.latitude],
    confidence: point.confidence,
    score: point.score,
    point,
    // Visual properties based on confidence
    radius: 15000 + (point.confidence * 35000), // 15-50km radius
    color: getConfidenceColor(point.confidence),
    elevation: point.confidence * 5000 // 0-5km elevation for 3D effect
  }));

  return new ScatterplotLayer({
    id: 'confidence-overlay',
    data: confidenceData,
    getPosition: (d: any) => d.position,
    getRadius: (d: any) => d.radius,
    getFillColor: (d: any) => d.color,
    getLineColor: [255, 255, 255, 100],
    getLineWidth: 500,
    stroked: true,
    filled: true,
    pickable: true,
    radiusUnits: 'meters',
    lineWidthUnits: 'meters',
    onClick: ({ object }) => {
      if (object && onConfidenceClick) {
        onConfidenceClick(object.point, object.confidence);
      }
    },
    updateTriggers: {
      getFillColor: confidenceThreshold
    }
  });
}

/**
 * Create uncertainty bands visualization
 */
function createUncertaintyBands(scoringGrid: ScoringGrid) {
  // Group points by uncertainty levels and create bands
  const uncertaintyBands = [
    { threshold: 0.8, color: [0, 255, 0, 40], label: 'High Confidence' },
    { threshold: 0.6, color: [255, 255, 0, 60], label: 'Medium Confidence' },
    { threshold: 0.4, color: [255, 165, 0, 80], label: 'Low Confidence' },
    { threshold: 0.0, color: [255, 0, 0, 100], label: 'Very Low Confidence' }
  ];

  const layers = uncertaintyBands.map((band, index) => {
    const nextThreshold = uncertaintyBands[index + 1]?.threshold || 0;
    
    const bandPoints = scoringGrid.points.filter(point => 
      point.confidence <= band.threshold && point.confidence > nextThreshold
    );

    if (bandPoints.length === 0) return null;

    return new ScatterplotLayer({
      id: `uncertainty-band-${index}`,
      data: bandPoints.map(point => ({
        position: [point.longitude, point.latitude],
        confidence: point.confidence
      })),
      getPosition: (d: any) => d.position,
      getRadius: 25000, // 25km radius
      getFillColor: band.color,
      getLineColor: [255, 255, 255, 50],
      getLineWidth: 1000,
      stroked: true,
      filled: true,
      pickable: false,
      radiusUnits: 'meters',
      lineWidthUnits: 'meters'
    });
  }).filter(layer => layer !== null);

  return layers;
}

/**
 * Create validation indicators for known stations
 */
function createValidationIndicators(validationResults: ValidationResult[]) {
  const validationData = validationResults.map(result => ({
    position: result.coordinates,
    error: result.error,
    confidence: result.confidence,
    accuracy: 100 - Math.min(result.error, 100),
    result
  }));

  return new ScatterplotLayer({
    id: 'validation-indicators',
    data: validationData,
    getPosition: (d: any) => d.position,
    getRadius: 8000, // 8km radius
    getFillColor: (d: any) => getValidationColor(d.accuracy),
    getLineColor: [255, 255, 255, 200],
    getLineWidth: 1500,
    stroked: true,
    filled: true,
    pickable: true,
    radiusUnits: 'meters',
    lineWidthUnits: 'meters'
  });
}

/**
 * Create confidence contour lines
 */
function createConfidenceContours(scoringGrid: ScoringGrid) {
  // Generate contour lines at different confidence levels
  const confidenceContours = [0.3, 0.5, 0.7, 0.9];
  
  return confidenceContours.map(confidenceLevel => {
    const contourPoints = scoringGrid.points
      .filter(point => Math.abs(point.confidence - confidenceLevel) < 0.05)
      .map(point => ({
        position: [point.longitude, point.latitude],
        confidence: point.confidence
      }));

    if (contourPoints.length < 3) return null;

    // Create path data for contour lines (simplified)
    const pathData = [{
      path: contourPoints.map(p => p.position),
      confidence: confidenceLevel
    }];

    return new PathLayer({
      id: `confidence-contour-${confidenceLevel}`,
      data: pathData,
      getPath: (d: any) => d.path,
      getColor: getConfidenceColor(confidenceLevel),
      getWidth: 2000, // 2km width
      widthUnits: 'meters',
      pickable: false
    });
  }).filter(layer => layer !== null);
}

/**
 * Create interpolation quality visualization
 */
function createInterpolationQuality(scoringGrid: ScoringGrid) {
  const interpolationData = scoringGrid.points.map(point => {
    const sourceStationCount = point.interpolationMetadata.sourceStations;
    const averageDistance = point.interpolationMetadata.averageDistance;
    
    // Quality decreases with distance and increases with more source stations
    const quality = Math.min(1, sourceStationCount / 5) * Math.max(0, 1 - averageDistance / 2000);
    
    return {
      position: [point.longitude, point.latitude],
      quality,
      sourceCount: sourceStationCount,
      distance: averageDistance,
      point
    };
  });

  return new HeatmapLayer({
    id: 'interpolation-quality',
    data: interpolationData,
    getPosition: (d: any) => d.position,
    getWeight: (d: any) => d.quality,
    radiusPixels: 40,
    intensity: 1,
    threshold: 0.05,
    colorRange: [
      [255, 0, 0, 100],     // Poor quality - red
      [255, 165, 0, 120],   // Low quality - orange
      [255, 255, 0, 140],   // Medium quality - yellow
      [173, 255, 47, 160],  // Good quality - yellow-green
      [0, 255, 0, 180]      // Excellent quality - green
    ]
  });
}

/**
 * Get color based on confidence level
 */
function getConfidenceColor(confidence: number): [number, number, number, number] {
  // Green (high confidence) to red (low confidence) gradient
  if (confidence > 0.8) {
    return [0, 255, 0, 150]; // Green
  } else if (confidence > 0.6) {
    return [173, 255, 47, 130]; // Yellow-green
  } else if (confidence > 0.4) {
    return [255, 255, 0, 110]; // Yellow
  } else if (confidence > 0.2) {
    return [255, 165, 0, 90]; // Orange
  } else {
    return [255, 0, 0, 70]; // Red
  }
}

/**
 * Get color based on validation accuracy
 */
function getValidationColor(accuracy: number): [number, number, number, number] {
  if (accuracy > 90) {
    return [0, 255, 0, 200]; // Bright green - excellent
  } else if (accuracy > 75) {
    return [173, 255, 47, 180]; // Yellow-green - good
  } else if (accuracy > 60) {
    return [255, 255, 0, 160]; // Yellow - moderate
  } else if (accuracy > 45) {
    return [255, 165, 0, 140]; // Orange - poor
  } else {
    return [255, 0, 0, 120]; // Red - very poor
  }
}

/**
 * Main confidence visualization component
 */
export function ConfidenceVisualization({
  visible,
  scoringGrid,
  mode = 'overlay',
  confidenceThreshold,
  showUncertaintyBands,
  showValidation,
  onConfidenceClick
}: ConfidenceVisualizationProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const confidenceMetrics = useConfidenceMetrics(scoringGrid);

  // Load validation results
  useEffect(() => {
    const loadValidation = async () => {
      try {
        const scorer = getRealityBasedSpatialScorer();
        const validation = await scorer.validateScoring();
        
        const results: ValidationResult[] = validation.stationResults.map(result => ({
          station: result.station,
          predicted: result.predicted,
          actual: result.actual,
          error: result.error,
          confidence: result.confidence,
          coordinates: [0, 0] // Would need actual coordinates
        }));
        
        setValidationResults(results);
      } catch (error) {
        console.warn('Failed to load validation results:', error);
        setValidationResults([]);
      }
    };

    if (showValidation && scoringGrid) {
      loadValidation();
    }
  }, [showValidation, scoringGrid]);

  const layers = useMemo(() => {
    if (!visible || !scoringGrid) {
      return [];
    }

    const layerComponents = [];

    // Base confidence overlay (always shown)
    layerComponents.push(createConfidenceOverlay(scoringGrid, confidenceThreshold, onConfidenceClick));

    if (mode === 'detailed') {
      // Add all detailed visualization components
      layerComponents.push(createInterpolationQuality(scoringGrid));
      layerComponents.push(...createConfidenceContours(scoringGrid));
      
      if (showUncertaintyBands) {
        layerComponents.push(...createUncertaintyBands(scoringGrid));
      }
      
      if (showValidation && validationResults.length > 0) {
        layerComponents.push(createValidationIndicators(validationResults));
      }
    } else if (mode === 'standalone') {
      // Show only confidence-related layers
      if (showUncertaintyBands) {
        layerComponents.push(...createUncertaintyBands(scoringGrid));
      }
    }

    return layerComponents;
  }, [
    visible,
    scoringGrid,
    mode,
    confidenceThreshold,
    showUncertaintyBands,
    showValidation,
    validationResults,
    onConfidenceClick
  ]);

  // Log confidence metrics
  useEffect(() => {
    if (confidenceMetrics && visible) {
      console.log('📊 Confidence metrics:', {
        averageConfidence: confidenceMetrics.averageConfidence.toFixed(3),
        uncertaintyLevel: confidenceMetrics.uncertaintyLevel,
        highConfidenceArea: `${Math.round(confidenceMetrics.highConfidenceArea)} km²`,
        validationAccuracy: `${confidenceMetrics.validationAccuracy.toFixed(1)}%`
      });
    }
  }, [confidenceMetrics, visible]);

  return layers;
}

/**
 * Confidence legend component
 */
export function ConfidenceLegend({ confidenceMetrics }: { confidenceMetrics: ConfidenceMetrics | null }) {
  if (!confidenceMetrics) return null;

  return (
    <div className="confidence-legend bg-black bg-opacity-80 text-white p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Confidence Analysis</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Average Confidence:</span>
          <span className="font-mono">{(confidenceMetrics.averageConfidence * 100).toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between">
          <span>Uncertainty Level:</span>
          <span className={`font-bold capitalize ${
            confidenceMetrics.uncertaintyLevel === 'low' ? 'text-green-400' :
            confidenceMetrics.uncertaintyLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {confidenceMetrics.uncertaintyLevel}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>High Confidence Area:</span>
          <span className="font-mono">{Math.round(confidenceMetrics.highConfidenceArea)} km²</span>
        </div>
        
        <div className="flex justify-between">
          <span>Validation Accuracy:</span>
          <span className="font-mono">{confidenceMetrics.validationAccuracy.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="font-bold mb-2">Confidence Scale</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>High (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span>Medium (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Low (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Very Low (0-40%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfidenceVisualization;