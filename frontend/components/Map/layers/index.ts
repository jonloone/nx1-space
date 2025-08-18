import { createGroundStationLayer } from './GroundStationLayer';
import { GroundStationIconLayer } from './GroundStationIconLayer';
import { PolygonLayer, ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { LayerBuilder } from '@/lib/layers/LayerBuilder';

interface CreateLayersOptions {
  zoom: number;
  pitch: number;
  domain: string;
  data: any;
  layers: any;
  dataCache: Map<string, any>;
}

export function createDataLayers({ 
  zoom, 
  pitch, 
  domain, 
  data, 
  layers,
  dataCache 
}: CreateLayersOptions) {
  console.log('[createDataLayers] Called with:', { domain, zoom, hasData: !!data });
  const allLayers = [];
  
  // Layer visibility based on zoom level
  const layerVisibility = {
    stations: true, // Always visible
    heatmap: zoom >= 3 && zoom <= 12,
    terrain: zoom >= 8,
    satellite: zoom >= 14,
    labels: zoom >= 5,
    analysis: zoom >= 6,
    predictions: zoom >= 8,
    buildings: zoom >= 14
  };
  
  // Base layers for map view with zoom-based visibility
  const baseLayers = LayerBuilder.buildBaseLayers({
    satellite: layers.base.satellite && layerVisibility.satellite,
    terrain: layers.base.terrain && layerVisibility.terrain,
    labels: layers.base.labels && layerVisibility.labels,
    viewMode: '2d'
  });
  allLayers.push(...baseLayers);
  
  // Ground stations - always visible, style changes with zoom
  if (domain === 'ground-stations' && data && layerVisibility.stations) {
    // DataService returns { stations: [...], footprints: [...], ... }
    const stations = data.stations || data.features || data;
    console.log('[createDataLayers] Creating ground station layer with stations:', stations);
    
    // Use icon layer for higher zoom levels
    if (zoom >= 8) {
      const iconLayer = new GroundStationIconLayer({
        id: 'ground-station-icons',
        data: stations,
        zoom: zoom
      });
      allLayers.push(iconLayer);
      console.log('[createDataLayers] Added ground station icon layer');
    } else {
      // Use basic layer for lower zoom levels
      const stationLayer = createGroundStationLayer(stations, 'map', zoom);
      allLayers.push(stationLayer);
      console.log('[createDataLayers] Added ground station layer');
    }
  }
  
  // Maritime data - visible at mid zoom
  if (domain === 'maritime' && data && zoom >= 6 && zoom <= 14) {
    allLayers.push(new HeatmapLayer({
      id: 'maritime-density',
      data: data,
      getPosition: d => d.position || [d.longitude, d.latitude],
      getWeight: d => d.density || 1,
      radiusPixels: Math.max(10, 50 - zoom * 2)
    }));
  }
  
  // Other data layers
  if (domain !== 'ground-stations' && domain !== 'maritime') {
    const dataLayers = LayerBuilder.buildDataLayers(domain, data, layers.data);
    allLayers.push(...dataLayers);
  }
  
  // Analysis layers (only at mid-zoom)
  if (layerVisibility.analysis) {
    const analysisLayers = LayerBuilder.buildAnalysisLayers(
      domain,
      dataCache,
      layers.analysis
    );
    allLayers.push(...analysisLayers);
  }
  
  // ML prediction layers (only at higher zoom)
  if (layerVisibility.predictions) {
    const predictions = dataCache.get(`${domain}_predictions`);
    if (predictions) {
      const intelligenceLayers = LayerBuilder.buildIntelligenceLayers(domain, predictions);
      allLayers.push(...intelligenceLayers);
    }
  }
  
  // Building analysis - visible at high zoom
  if (layerVisibility.buildings && zoom >= 14) {
    // This would need building data loaded
    const buildingData = dataCache.get('buildings');
    if (buildingData) {
      allLayers.push(new PolygonLayer({
        id: 'buildings',
        data: buildingData,
        getPolygon: d => d.footprint || d.geometry?.coordinates,
        getFillColor: d => [100, 100, 100, 180],
        getLineColor: [255, 255, 255, 50],
        extruded: pitch > 0,
        getElevation: d => d.height || 10,
        pickable: true
      }));
    }
  }
  
  console.log('[createDataLayers] Total layers created:', allLayers.length);
  return allLayers;
}