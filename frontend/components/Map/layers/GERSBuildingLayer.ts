/**
 * GERS Building Layer for Deck.gl
 * Renders building footprints with level-of-detail optimization
 */

import { PolygonLayer, BitmapLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { Layer, PickingInfo } from '@deck.gl/core';
import { OvertureBuildingFeature, BuildingDensityCell } from '../../../lib/types/gers';
import { getGERSDataLoader } from '../../../lib/services/GERSDataLoader';
import { getGERSQueryService } from '../../../lib/services/GERSQueryService';

export interface GERSBuildingLayerProps {
  id: string;
  data: OvertureBuildingFeature[];
  visible?: boolean;
  opacity?: number;
  filled?: boolean;
  stroked?: boolean;
  wireframe?: boolean;
  lineWidthMinPixels?: number;
  lineWidthMaxPixels?: number;
  getHeight?: (building: OvertureBuildingFeature) => number;
  getFillColor?: (building: OvertureBuildingFeature) => [number, number, number, number];
  getLineColor?: (building: OvertureBuildingFeature) => [number, number, number, number];
  onHover?: (info: PickingInfo, event: any) => void;
  onClick?: (info: PickingInfo, event: any) => void;
  pickable?: boolean;
  autoHighlight?: boolean;
  highlightColor?: [number, number, number, number];
  // Level-of-detail props
  minZoom?: number;
  maxZoom?: number;
  aggregationLevel?: 'building' | 'block' | 'district';
  confidenceFilter?: number;
}

export interface GERSDensityLayerProps {
  id: string;
  data: BuildingDensityCell[];
  visible?: boolean;
  opacity?: number;
  radiusScale?: number;
  colorRange?: Array<[number, number, number]>;
  coverage?: number;
  upperPercentile?: number;
  getHexagon?: (cell: BuildingDensityCell) => string;
  getValue?: (cell: BuildingDensityCell) => number;
}

/**
 * Building footprints layer with detailed polygons
 */
export function createGERSBuildingLayer(props: GERSBuildingLayerProps): PolygonLayer<OvertureBuildingFeature> {
  return new PolygonLayer<OvertureBuildingFeature>({
    id: props.id,
    data: props.data,
    visible: props.visible ?? true,
    opacity: props.opacity ?? 0.8,
    filled: props.filled ?? true,
    stroked: props.stroked ?? true,
    wireframe: props.wireframe ?? false,
    lineWidthMinPixels: props.lineWidthMinPixels ?? 1,
    lineWidthMaxPixels: props.lineWidthMaxPixels ?? 3,
    pickable: props.pickable ?? true,
    autoHighlight: props.autoHighlight ?? true,
    highlightColor: props.highlightColor ?? [255, 255, 255, 100],

    // Data accessors
    getPolygon: (building: OvertureBuildingFeature) => {
      if (building.geometry.type === 'Polygon') {
        return building.geometry.coordinates[0];
      }
      return [];
    },

    getElevation: props.getHeight || ((building: OvertureBuildingFeature) => {
      return building.properties.height || 10;
    }),

    getFillColor: props.getFillColor || ((building: OvertureBuildingFeature) => {
      return getBuildingColor(building);
    }),

    getLineColor: props.getLineColor || ((building: OvertureBuildingFeature) => {
      return [200, 200, 200, 255];
    }),

    // Event handlers
    onHover: props.onHover,
    onClick: props.onClick,

    // Filters
    filterRange: props.confidenceFilter ? [props.confidenceFilter, 1] : undefined,
    getFilterValue: props.confidenceFilter ? (building: OvertureBuildingFeature) => {
      const confidence = building.properties.sources?.reduce((max, s) => 
        Math.max(max, s.confidence || 0), 0) || 0;
      return confidence;
    } : undefined,

    // Performance optimizations
    updateTriggers: {
      getFillColor: [props.aggregationLevel, props.confidenceFilter],
      getElevation: [props.aggregationLevel],
      getFilterValue: [props.confidenceFilter]
    },

    // Level-of-detail
    modelMatrix: undefined, // Could be used for large-scale transformations
    
    // Extensions for better performance
    extensions: []
  });
}

/**
 * Density heatmap layer using H3 hexagons
 */
export function createGERSDensityLayer(props: GERSDensityLayerProps): H3HexagonLayer<BuildingDensityCell> {
  return new H3HexagonLayer<BuildingDensityCell>({
    id: props.id,
    data: props.data,
    visible: props.visible ?? true,
    opacity: props.opacity ?? 0.6,
    radiusScale: props.radiusScale ?? 1,
    colorRange: props.colorRange ?? [
      [255, 255, 178], // Light yellow
      [254, 204, 92],  // Yellow-orange
      [253, 141, 60],  // Orange
      [240, 59, 32],   // Red-orange
      [189, 0, 38]     // Dark red
    ],
    coverage: props.coverage ?? 0.9,
    upperPercentile: props.upperPercentile ?? 95,

    // Data accessors
    getHexagon: props.getHexagon || ((cell: BuildingDensityCell) => cell.h3Index),
    getValue: props.getValue || ((cell: BuildingDensityCell) => cell.buildingCount),

    pickable: true,
    autoHighlight: true,

    updateTriggers: {
      getValue: [props.id]
    }
  });
}

/**
 * Get color based on building characteristics
 */
function getBuildingColor(building: OvertureBuildingFeature): [number, number, number, number] {
  const buildingClass = building.properties.class;
  const height = building.properties.height || 0;
  const confidence = building.properties.sources?.reduce((max, s) => 
    Math.max(max, s.confidence || 0), 0) || 0.5;

  // Base color by building type
  let baseColor: [number, number, number] = [150, 150, 150]; // Default gray
  
  switch (buildingClass) {
    case 'residential':
      baseColor = [100, 149, 237]; // Cornflower blue
      break;
    case 'commercial':
      baseColor = [255, 165, 0]; // Orange
      break;
    case 'office':
      baseColor = [70, 130, 180]; // Steel blue
      break;
    case 'industrial':
      baseColor = [188, 143, 143]; // Rosy brown
      break;
    case 'institutional':
      baseColor = [144, 238, 144]; // Light green
      break;
    case 'educational':
      baseColor = [221, 160, 221]; // Plum
      break;
    default:
      baseColor = [169, 169, 169]; // Dark gray
  }

  // Adjust color based on height
  const heightFactor = Math.min(1, height / 200); // Normalize to 200m max
  const adjustedColor: [number, number, number] = [
    Math.floor(baseColor[0] * (0.5 + heightFactor * 0.5)),
    Math.floor(baseColor[1] * (0.5 + heightFactor * 0.5)),
    Math.floor(baseColor[2] * (0.5 + heightFactor * 0.5))
  ];

  // Adjust alpha based on confidence
  const alpha = Math.floor(255 * (0.3 + confidence * 0.7));

  return [adjustedColor[0], adjustedColor[1], adjustedColor[2], alpha];
}

/**
 * Level-of-detail layer manager
 */
export class GERSBuildingLayerManager {
  private dataLoader = getGERSDataLoader();
  private queryService = getGERSQueryService();
  private currentZoom: number = 10;
  private currentBounds: [number, number, number, number] = [-180, -90, 180, 90];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.dataLoader.initialize();
    await this.queryService.initialize();
    this.initialized = true;
  }

  /**
   * Get appropriate layers based on zoom level and viewport
   */
  async getLayers(
    zoom: number,
    bounds: [number, number, number, number],
    options?: {
      showBuildings?: boolean;
      showDensity?: boolean;
      confidenceFilter?: number;
    }
  ): Promise<Layer[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.currentZoom = zoom;
    this.currentBounds = bounds;

    const layers: Layer[] = [];

    // High zoom: show individual buildings
    if (zoom >= 14 && (options?.showBuildings ?? true)) {
      const buildings = await this.getBuildingsInBounds(bounds, options?.confidenceFilter);
      
      if (buildings.length > 0) {
        layers.push(createGERSBuildingLayer({
          id: 'gers-buildings-detailed',
          data: buildings,
          confidenceFilter: options?.confidenceFilter,
          aggregationLevel: 'building'
        }));
      }
    }
    
    // Medium zoom: show building density
    else if (zoom >= 10 && (options?.showDensity ?? true)) {
      const densityData = await this.getDensityData(bounds, 9); // H3 resolution 9
      
      if (densityData.length > 0) {
        layers.push(createGERSDensityLayer({
          id: 'gers-density-h3',
          data: densityData
        }));
      }
    }
    
    // Low zoom: show aggregated density
    else if (zoom >= 6 && (options?.showDensity ?? true)) {
      const densityData = await this.getDensityData(bounds, 7); // Lower H3 resolution
      
      if (densityData.length > 0) {
        layers.push(createGERSDensityLayer({
          id: 'gers-density-aggregated',
          data: densityData,
          radiusScale: 2,
          opacity: 0.4
        }));
      }
    }

    return layers;
  }

  private async getBuildingsInBounds(
    bounds: [number, number, number, number],
    confidenceFilter?: number
  ): Promise<OvertureBuildingFeature[]> {
    // Calculate center and radius from bounds
    const centerLat = (bounds[1] + bounds[3]) / 2;
    const centerLng = (bounds[0] + bounds[2]) / 2;
    const radiusKm = this.boundsToRadius(bounds);

    return await this.dataLoader.queryBuildingsInRadius(
      [centerLat, centerLng],
      radiusKm,
      {
        minConfidence: confidenceFilter
      }
    );
  }

  private async getDensityData(
    bounds: [number, number, number, number],
    resolution: number
  ): Promise<BuildingDensityCell[]> {
    return await this.dataLoader.calculateBuildingDensity(bounds, resolution);
  }

  private boundsToRadius(bounds: [number, number, number, number]): number {
    // Calculate diagonal distance of bounds rectangle
    const [west, south, east, north] = bounds;
    const R = 6371; // Earth's radius in km
    
    const dLat = this.deg2rad(north - south);
    const dLon = this.deg2rad(east - west);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(south)) * Math.cos(this.deg2rad(north)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c / 2; // Half diagonal as radius
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Singleton layer manager
let layerManagerInstance: GERSBuildingLayerManager | null = null;

export function getGERSBuildingLayerManager(): GERSBuildingLayerManager {
  if (!layerManagerInstance) {
    layerManagerInstance = new GERSBuildingLayerManager();
  }
  return layerManagerInstance;
}