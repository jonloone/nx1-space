'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { useMapStore } from '@/lib/store/mapStore';
import { NavigationControl } from '../Controls/NavigationControl';
import { BuildingAnalysisPanel } from '../Panels/BuildingAnalysisPanel';
import { getGERSBuildingLayerManager } from './layers/GERSBuildingLayer';
import { OvertureBuildingFeature } from '@/lib/types/gers';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export function EnhancedGeoCoreMap() {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -80.1918, // Start with Miami for building demo
    latitude: 25.7617,
    zoom: 10,
    pitch: 0,
    bearing: 0
  });
  
  const [stations, setStations] = useState([]);
  const [gersLayers, setGersLayers] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState<OvertureBuildingFeature | null>(null);
  
  const { 
    selectFeature, 
    layers,
    toggleGERSLayer,
    setGERSConfidenceFilter 
  } = useMapStore();

  // Load ground station data
  useEffect(() => {
    fetch('/data/ses_intelsat_ground_stations.json')
      .then(response => response.json())
      .then(data => {
        const transformedStations = data.stations.map((station) => ({
          id: station.station_id,
          name: station.name,
          longitude: station.location.longitude,
          latitude: station.location.latitude,
          city: station.location.city,
          country: station.location.country,
          region: station.location.region,
          operator: station.operator,
          antenna_count: station.technical_specs.antenna_count,
          capacity_gbps: station.utilization_metrics.capacity_gbps,
          utilization: station.utilization_metrics.current_utilization / 100,
          score: (station.utilization_metrics.current_utilization / 100) * 0.5 + 
                 (station.technical_specs.antenna_count / 100) * 0.5,
          type: 'station'
        }));
        setStations(transformedStations);
      })
      .catch(error => {
        console.error('Failed to load ground station data:', error);
      });
  }, []);

  // Load GERS layers based on viewport and settings
  const loadGERSLayers = useCallback(async (vs: ViewState) => {
    if (!layers.gers.enabled) {
      setGersLayers([]);
      return;
    }

    try {
      const gersLayerManager = getGERSBuildingLayerManager();
      
      // Calculate bounds from viewport
      const bounds: [number, number, number, number] = [
        vs.longitude - (0.1 * Math.pow(2, 10 - vs.zoom)), // west
        vs.latitude - (0.1 * Math.pow(2, 10 - vs.zoom)),  // south
        vs.longitude + (0.1 * Math.pow(2, 10 - vs.zoom)), // east
        vs.latitude + (0.1 * Math.pow(2, 10 - vs.zoom))   // north
      ];

      const newLayers = await gersLayerManager.getLayers(vs.zoom, bounds, {
        showBuildings: layers.gers.buildings && vs.zoom >= 14,
        showDensity: layers.gers.density && vs.zoom >= 8,
        confidenceFilter: layers.gers.confidenceFilter
      });

      setGersLayers(newLayers);
    } catch (error) {
      console.error('Error loading GERS layers:', error);
    }
  }, [layers.gers]);

  // Update GERS layers when viewport changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadGERSLayers(viewState);
    }, 500); // Debounce viewport changes

    return () => clearTimeout(timeoutId);
  }, [viewState, loadGERSLayers]);

  // Handle building click
  const handleBuildingClick = useCallback((info: any) => {
    if (info.object && info.layer?.id?.includes('gers-building')) {
      setSelectedBuilding(info.object);
      selectFeature({
        ...info.object,
        type: 'building',
        clickPosition: info.coordinate
      });
    } else if (info.object && info.object.type === 'station') {
      selectFeature(info.object);
      setSelectedBuilding(null);
    }
  }, [selectFeature]);

  // Create station layers
  const stationLayers = useMemo(() => [
    new ScatterplotLayer({
      id: 'stations-glow',
      data: stations,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: d => 80000 + (d.utilization * 40000),
      getFillColor: d => {
        const util = d.utilization;
        if (util > 0.8) return [0, 255, 100, 60];
        if (util > 0.6) return [255, 255, 0, 60];
        if (util > 0.4) return [255, 140, 0, 60];
        return [255, 50, 50, 60];
      },
      radiusMinPixels: 15,
      radiusMaxPixels: 50,
      pickable: false,
      visible: viewState.zoom < 12
    }),
    new ScatterplotLayer({
      id: 'stations-core',
      data: stations,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: 40000,
      getFillColor: d => {
        const util = d.utilization;
        if (util > 0.8) return [100, 255, 150, 200];
        if (util > 0.6) return [255, 255, 100, 200];
        if (util > 0.4) return [255, 180, 50, 200];
        return [255, 100, 100, 200];
      },
      radiusMinPixels: 6,
      radiusMaxPixels: 20,
      pickable: true,
      autoHighlight: true,
      onClick: handleBuildingClick
    }),
    new TextLayer({
      id: 'station-labels',
      data: stations,
      getPosition: d => [d.longitude, d.latitude],
      getText: d => d.name,
      getSize: viewState.zoom > 6 ? 13 : 11,
      getColor: [255, 255, 255, 255],
      getPixelOffset: [0, -25],
      fontFamily: 'Arial',
      fontWeight: 700,
      visible: viewState.zoom > 4
    }),
    new TextLayer({
      id: 'utilization-labels',
      data: stations,
      getPosition: d => [d.longitude, d.latitude],
      getText: d => Math.round(d.utilization * 100) + '%',
      getSize: 11,
      getColor: d => {
        const util = d.utilization;
        if (util > 0.8) return [100, 255, 150, 255];
        if (util > 0.6) return [255, 255, 100, 255];
        if (util > 0.4) return [255, 180, 50, 255];
        return [255, 100, 100, 255];
      },
      getPixelOffset: [0, 12],
      fontFamily: 'Arial',
      fontWeight: 600,
      visible: viewState.zoom > 6
    })
  ], [stations, viewState.zoom, handleBuildingClick]);

  // Combine all layers
  const allLayers = useMemo(() => [
    ...stationLayers,
    ...gersLayers
  ], [stationLayers, gersLayers]);

  const mapStyle = {
    version: 8,
    sources: {
      'carto': {
        type: 'raster',
        tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#0a0a0f' }
      },
      {
        id: 'carto',
        type: 'raster',
        source: 'carto'
      }
    ]
  };

  const navigationHandler = (target: Partial<ViewState>) => {
    setViewState(prev => ({
      ...prev,
      ...target
    }));
  };

  const viewStateHandler = (e: any) => {
    setViewState(e.viewState);
  };

  // Handle navigation events from search
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { longitude, latitude, zoom } = event.detail;
      setViewState(prev => ({
        ...prev,
        longitude,
        latitude,
        zoom: zoom || 12
      }));
    };

    window.addEventListener('navigate-to-location', handleNavigate as any);
    return () => {
      window.removeEventListener('navigate-to-location', handleNavigate as any);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={viewStateHandler}
        controller={true}
        layers={allLayers}
        onClick={handleBuildingClick}
        getCursor={({isDragging, isHovering}) => {
          if (isDragging) return 'grabbing';
          if (isHovering) return 'pointer';
          return 'grab';
        }}
      >
        <Map
          mapStyle={mapStyle}
          mapLib={maplibregl}
        />
      </DeckGL>
      
      <NavigationControl
        viewState={viewState}
        onNavigate={navigationHandler}
      />

      {/* GERS Layer Controls */}
      {layers.gers.enabled && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          minWidth: '200px'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            GERS Building Analysis
          </div>
          
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={layers.gers.buildings}
              onChange={() => toggleGERSLayer('buildings')}
              style={{ marginRight: '8px' }}
            />
            Building Footprints (Zoom ≥14)
          </label>
          
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={layers.gers.density}
              onChange={() => toggleGERSLayer('density')}
              style={{ marginRight: '8px' }}
            />
            Density Heatmap (Zoom ≥8)
          </label>
          
          <div style={{ marginTop: '10px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Confidence Filter: {Math.round(layers.gers.confidenceFilter * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layers.gers.confidenceFilter}
              onChange={(e) => setGERSConfidenceFilter(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#ccc',
            borderTop: '1px solid #333',
            paddingTop: '8px'
          }}>
            Current zoom: {viewState.zoom.toFixed(1)}<br />
            GERS layers: {gersLayers.length}<br />
            {selectedBuilding && (
              <>Building: {selectedBuilding.properties.names?.primary || selectedBuilding.id}</>
            )}
          </div>
        </div>
      )}

      {/* GERS Toggle Button */}
      <button
        onClick={() => toggleGERSLayer('enabled')}
        style={{
          position: 'absolute',
          top: '20px',
          right: layers.gers.enabled ? '240px' : '20px',
          background: layers.gers.enabled ? '#0070f3' : 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
      >
        {layers.gers.enabled ? 'Hide GERS' : 'Show GERS'}
      </button>

      {/* Building Analysis Panel */}
      <BuildingAnalysisPanel
        building={selectedBuilding}
        visible={!!selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
      />
    </div>
  );
}