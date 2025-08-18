import { 
  TileLayer,
  H3HexagonLayer,
  ContourLayer
} from '@deck.gl/geo-layers';
import {
  ScatterplotLayer,
  PathLayer,
  PolygonLayer,
  IconLayer,
  TextLayer,
  ColumnLayer,
  LineLayer,
  ArcLayer,
  BitmapLayer
} from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

// MapTiler removed - using Overture Maps instead

export class LayerBuilder {
  static buildBaseLayers(config: any) {
    const layers = [];
    
    // Satellite imagery disabled - using Overture vector tiles instead
    // This reduces WebGL context usage and improves performance
    if (config.satellite && config.viewMode === '3d') {
      // Satellite layer disabled to avoid API key requirement and reduce WebGL load
      if (config.debugMode) {
        console.log('Satellite imagery disabled - using vector basemap only');
      }
    }
    
    return layers;
  }
  
  static buildDataLayers(domain: string, data: any, visibility: Map<string, boolean>) {
    switch (domain) {
      case 'ground-stations':
        return this.buildGroundStationLayers(data, visibility);
      case 'maritime':
        return this.buildMaritimeLayers(data, visibility);
      default:
        return [];
    }
  }
  
  static buildGroundStationLayers(data: any, visibility: Map<string, boolean>) {
    const layers = [];
    
    if (data.stations && visibility.get('stations')) {
      layers.push(new ScatterplotLayer({
        id: 'ground-stations',
        data: data.stations,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getRadius: (d: any) => Math.sqrt(d.coverage_area_km2 || 100) * 1000,
        getFillColor: (d: any) => {
          const score = d.score || 0.5;
          if (score > 0.8) return [0, 255, 0, 200];
          if (score > 0.6) return [255, 255, 0, 200];
          if (score > 0.4) return [255, 140, 0, 200];
          return [255, 0, 0, 200];
        },
        radiusScale: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 30,
        pickable: true,
        autoHighlight: true
      }));
      
      layers.push(new TextLayer({
        id: 'station-labels',
        data: data.stations,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getText: (d: any) => d.name,
        getSize: 12,
        getColor: [255, 255, 255, 255],
        getPixelOffset: [0, -20]
      }));
    }
    
    if (data.footprints && visibility.get('footprints')) {
      layers.push(new PolygonLayer({
        id: 'satellite-footprints',
        data: data.footprints,
        getPolygon: (d: any) => d.footprint_coordinates,
        getFillColor: [0, 100, 255, 30],
        getLineColor: [0, 150, 255, 100],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
        pickable: true
      }));
    }
    
    if (data.coverage && visibility.get('coverage')) {
      layers.push(new ColumnLayer({
        id: 'coverage-columns',
        data: data.coverage,
        getPosition: (d: any) => [d.longitude, d.latitude],
        diskResolution: 12,
        radius: 10000,
        extruded: true,
        getElevation: (d: any) => d.utilization * 50000,
        getFillColor: (d: any) => {
          const util = d.utilization;
          if (util > 0.8) return [255, 0, 0, 200];
          if (util > 0.6) return [255, 140, 0, 200];
          if (util > 0.4) return [255, 255, 0, 200];
          return [0, 255, 0, 200];
        },
        elevationScale: 1,
        pickable: true
      }));
    }
    
    return layers;
  }
  
  static buildMaritimeLayers(data: any, visibility: Map<string, boolean>) {
    const layers = [];
    
    if (data.vessels && visibility.get('vessels')) {
      layers.push(new ScatterplotLayer({
        id: 'vessel-positions',
        data: data.vessels,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getRadius: (d: any) => d.size * 100,
        getFillColor: (d: any) => {
          switch(d.vessel_type) {
            case 'cargo': return [255, 140, 0, 200];
            case 'tanker': return [255, 0, 0, 200];
            case 'passenger': return [0, 255, 0, 200];
            default: return [100, 100, 100, 200];
          }
        },
        radiusScale: 1,
        radiusMinPixels: 2,
        radiusMaxPixels: 10,
        pickable: true
      }));
    }
    
    if (data.density && visibility.get('density')) {
      layers.push(new HeatmapLayer({
        id: 'shipping-density',
        data: data.density,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getWeight: (d: any) => d.count,
        radiusPixels: 30
      }));
    }
    
    if (data.ports && visibility.get('ports')) {
      layers.push(new ColumnLayer({
        id: 'port-activity',
        data: data.ports,
        getPosition: (d: any) => [d.longitude, d.latitude],
        diskResolution: 12,
        radius: 5000,
        extruded: true,
        getElevation: (d: any) => d.activity * 1000,
        getFillColor: [255, 140, 0, 200],
        elevationScale: 100,
        pickable: true
      }));
    }
    
    return layers;
  }
  
  static buildAnalysisLayers(domain: string, dataCache: Map<string, any>, visibility: Map<string, boolean>) {
    const layers = [];
    const data = dataCache.get(domain);
    
    if (!data) return layers;
    
    if (visibility.get('heatmap') && data.stations) {
      layers.push(new HeatmapLayer({
        id: 'analysis-heatmap',
        data: data.stations || data.vessels || [],
        getPosition: (d: any) => [d.longitude, d.latitude],
        getWeight: (d: any) => d.score || d.risk_score || 1,
        radiusPixels: 50
      }));
    }
    
    if (visibility.get('hexagons') && data.stations) {
      layers.push(new H3HexagonLayer({
        id: 'analysis-hexagons',
        data: data.stations || data.vessels || [],
        getHexagon: (d: any) => d.h3Index || 'placeholder',
        getFillColor: (d: any) => [255, 255, 0, 180],
        getElevation: (d: any) => d.count * 100,
        elevationScale: 1,
        extruded: true,
        pickable: true
      }));
    }
    
    return layers;
  }
  
  static buildIntelligenceLayers(domain: string, predictions: any) {
    if (!predictions) return [];
    
    const layers = [];
    
    if (predictions.opportunities) {
      layers.push(new PolygonLayer({
        id: 'opportunity-zones',
        data: predictions.opportunities,
        getPolygon: (d: any) => d.boundary,
        getFillColor: (d: any) => [0, 255, 0, d.score * 100],
        getLineColor: [0, 255, 0, 200],
        getLineWidth: 3,
        lineWidthUnits: 'pixels',
        pickable: true
      }));
    }
    
    if (predictions.anomalies) {
      layers.push(new IconLayer({
        id: 'anomalies',
        data: predictions.anomalies,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getIcon: (d: any) => ({
          url: '/icons/alert.svg',
          width: 128,
          height: 128
        }),
        getSize: (d: any) => 20 + (d.severity * 20),
        getColor: (d: any) => {
          if (d.severity > 0.8) return [255, 0, 0];
          if (d.severity > 0.5) return [255, 140, 0];
          return [255, 255, 0];
        },
        pickable: true
      }));
    }
    
    return layers;
  }
}