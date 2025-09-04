'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { NavigationControl } from '../Controls/NavigationControl';
import { useMapStore } from '@/lib/store/mapStore';
import { LayerBuilder } from '@/lib/layers/LayerBuilder';
import 'maplibre-gl/dist/maplibre-gl.css';

// CartoDB Dark Matter style - reliable dark theme tiles
const CARTODB_DARK_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© CARTO © OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0a0a0f' }
    },
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      paint: {
        'raster-opacity': 1.0,
        'raster-fade-duration': 200
      }
    }
  ]
};

// Alternative dark style using Stamen Toner (also free)
const STAMEN_DARK_STYLE = {
  version: 8,
  sources: {
    'stamen-toner': {
      type: 'raster',
      tiles: [
        'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© Stamen Design, © OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#000000' }
    },
    {
      id: 'stamen-layer',
      type: 'raster',
      source: 'stamen-toner',
      paint: {
        'raster-opacity': 0.9,
        'raster-invert': 0.9, // Invert colors for dark theme
        'raster-contrast': 0.2
      }
    }
  ]
};

// Create map style - using CartoDB Dark Matter by default
const createMapStyle = () => {
  // Use CartoDB Dark Matter as primary style
  return CARTODB_DARK_STYLE;
};

const INITIAL_VIEW_STATE = {
  longitude: -40,  // Atlantic-centered view to show global network
  latitude: 30,
  zoom: 2.5,
  pitch: 0,
  bearing: 0
};

export const FixedMapView: React.FC = () => {
  console.log('[FixedMapView] Component rendering');
  
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [mapStyle, setMapStyle] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [groundStations, setGroundStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  
  // Store usage - get viewState and updateViewState from the store
  const { domain, layers, selectFeature, viewState: storeViewState, updateViewState } = useMapStore();
  
  // Sync with store viewState changes (from flyTo commands)
  useEffect(() => {
    if (storeViewState && (
      storeViewState.longitude !== viewState.longitude ||
      storeViewState.latitude !== viewState.latitude ||
      storeViewState.zoom !== viewState.zoom
    )) {
      console.log('[FixedMapView] Flying to location from store:', storeViewState);
      setViewState({
        ...storeViewState,
        transitionDuration: 2000,
        transitionInterpolator: new FlyToInterpolator()
      });
    }
  }, [storeViewState.longitude, storeViewState.latitude, storeViewState.zoom]);
  
  // Mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Initialize map style - simplified without PMTiles
  useEffect(() => {
    if (!isMounted) {
      console.log('[FixedMapView] Waiting for client mount...');
      return;
    }
    
    console.log('[FixedMapView] Initializing with CartoDB Dark Matter tiles...');
    
    // Simply create and set the map style
    const style = createMapStyle();
    console.log('[FixedMapView] Map style created');
    setMapStyle(style);
  }, [isMounted]);
  
  // Load ground station data
  useEffect(() => {
    if (!isMounted) return;
    
    const loadGroundStations = async () => {
      try {
        console.log('[FixedMapView] Starting to load ground stations...');
        console.log('[FixedMapView] Current URL:', window.location.href);
        const url = '/data/ses_intelsat_ground_stations.json';
        console.log('[FixedMapView] Fetching from:', url);
        
        const response = await fetch(url);
        console.log('[FixedMapView] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[FixedMapView] Data loaded successfully');
        console.log('[FixedMapView] Data has stations array:', !!data.stations);
        console.log('[FixedMapView] Number of stations:', data.stations?.length);
        
        if (!data.stations || !Array.isArray(data.stations)) {
          throw new Error('Invalid data format: stations array not found');
        }
        
        // Transform the data for deck.gl layers
        const stationsData = data.stations.map((station: any) => ({
          ...station,
          longitude: station.location.longitude,
          latitude: station.location.latitude,
          name: station.name,
          score: station.utilization_metrics.current_utilization / 100,
          utilization: station.utilization_metrics.current_utilization / 100,
          coverage_area_km2: station.utilization_metrics.capacity_gbps * 20, // Approximate coverage based on capacity
          antenna_count: station.technical_specs.antenna_count,
          capacity_gbps: station.utilization_metrics.capacity_gbps,
          operator: station.operator,
          legacy_operator: station.legacy_operator,
          city: station.location.city,
          country: station.location.country
        }));
        
        console.log('[FixedMapView] Transformed stations count:', stationsData.length);
        console.log('[FixedMapView] First 3 stations:', stationsData.slice(0, 3).map(s => ({
          name: s.name,
          lng: s.longitude,
          lat: s.latitude,
          util: s.utilization
        })));
        
        setGroundStations(stationsData);
        console.log(`[FixedMapView] Called setGroundStations with ${stationsData.length} stations`);
      } catch (error) {
        console.error('[FixedMapView] Failed to load ground stations:', error);
        console.log('[FixedMapView] Adding fallback test stations to ensure visibility...');
        
        // Add some test stations to ensure something is visible
        const testStations = [
          {
            name: 'Test Station NYC',
            longitude: -74.0060,
            latitude: 40.7128,
            utilization: 0.8,
            city: 'New York',
            country: 'USA'
          },
          {
            name: 'Test Station London',
            longitude: -0.1276,
            latitude: 51.5074,
            utilization: 0.6,
            city: 'London',
            country: 'UK'
          },
          {
            name: 'Test Station Tokyo',
            longitude: 139.6503,
            latitude: 35.6762,
            utilization: 0.9,
            city: 'Tokyo',
            country: 'Japan'
          }
        ];
        
        setGroundStations(testStations);
        console.log(`[FixedMapView] Loaded ${testStations.length} test stations as fallback`);
        
        // Still try to load the real data
        try {
          console.log('[FixedMapView] Retrying with absolute path...');
          const response = await fetch('/data/ses_intelsat_ground_stations.json');
          const data = await response.json();
          const stationsData = data.stations.map((station: any) => ({
            ...station,
            longitude: station.location.longitude,
            latitude: station.location.latitude,
            name: station.name,
            score: station.utilization_metrics.current_utilization / 100,
            utilization: station.utilization_metrics.current_utilization / 100,
            coverage_area_km2: station.utilization_metrics.capacity_gbps * 20,
            antenna_count: station.technical_specs.antenna_count,
            capacity_gbps: station.utilization_metrics.capacity_gbps,
            operator: station.operator,
            legacy_operator: station.legacy_operator,
            city: station.location.city,
            country: station.location.country
          }));
          setGroundStations(stationsData);
          console.log(`[FixedMapView] Retry successful: loaded ${stationsData.length} real stations`);
        } catch (retryError) {
          console.error('[FixedMapView] Retry also failed, keeping test stations:', retryError);
        }
      }
    };
    
    loadGroundStations();
  }, [isMounted]);
  
  // Create 2D map view
  const mapView = useMemo(() => 
    new DeckMapView({
      id: 'main-map',
      controller: {
        doubleClickZoom: false,
        scrollZoom: {
          speed: 0.01,
          smooth: true
        },
        inertia: true
      }
    }), 
  []);
  
  // Handle view state changes
  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    const constrainedViewState = {
      ...newViewState,
      zoom: Math.max(2, Math.min(22, newViewState.zoom)),
      pitch: Math.max(0, Math.min(60, newViewState.pitch))
    };
    
    setViewState(constrainedViewState);
    // Also update the store so other components know the current view
    updateViewState(constrainedViewState);
  }, [updateViewState]);
  
  // Create ground station layers - simplified to ensure they render
  const groundStationLayers = useMemo(() => {
    const layerList = [];
    
    console.log(`[FixedMapView] Creating layers with ${groundStations.length} stations at`, new Date().toISOString());
    
    if (groundStations.length > 0) {
      console.log('[FixedMapView] Sample stations for layer:', groundStations.slice(0, 3).map(s => ({
        name: s.name,
        longitude: s.longitude,
        latitude: s.latitude,
        utilization: s.utilization
      })));
      
      // Ground station points layer
      layerList.push(new ScatterplotLayer({
        id: 'ground-stations',
        data: groundStations,
        getPosition: (d: any) => {
          const pos = [d.longitude, d.latitude];
          if (!d.longitude || !d.latitude) {
            console.warn('[FixedMapView] Invalid position for station:', d.name, pos);
          }
          return pos;
        },
        getRadius: 300000, // Increased radius to 300km for much better visibility
        getFillColor: (d: any) => {
          const util = d.utilization || 0;
          if (util > 0.85) return [255, 59, 48, 200];     // Red - High utilization
          if (util > 0.75) return [255, 149, 0, 200];     // Orange
          if (util > 0.65) return [255, 204, 0, 200];     // Yellow
          if (util > 0.50) return [52, 199, 89, 200];    // Green - Medium
          return [0, 122, 255, 200];                      // Blue - Low utilization
        },
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 4,
        lineWidthUnits: 'pixels',
        radiusScale: 1,
        radiusMinPixels: 12, // Increased minimum size
        radiusMaxPixels: 200,
        pickable: true,
        autoHighlight: true,
        onHover: (info: any) => {
          if (info.object) {
            console.log('[FixedMapView] Hovering station:', info.object.name);
          }
        },
        onClick: (info: any) => {
          if (info.object) {
            console.log('[FixedMapView] Station clicked:', info.object);
            setSelectedStation(info.object);
            selectFeature(info.object);
          }
        }
      }));
      
      // Station labels layer
      layerList.push(new TextLayer({
        id: 'station-labels',
        data: groundStations,
        getPosition: (d: any) => [d.longitude, d.latitude],
        getText: (d: any) => d.name,
        getSize: 18,
        getColor: [255, 255, 255, 255],
        getPixelOffset: [0, -30], // Position above the circle
        getBackgroundColor: [10, 10, 15, 230],
        backgroundColor: [10, 10, 15, 230],
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: '600',
        sizeScale: 1,
        sizeMinPixels: 14,
        sizeMaxPixels: 28,
        billboard: false,
        pickable: false,
        outlineWidth: 2,
        outlineColor: [0, 0, 0, 255]
      }));
    }
    
    console.log(`[FixedMapView] Returning ${layerList.length} layers`);
    return layerList;
  }, [groundStations, selectFeature]);
  
  // Handle map loaded event
  const handleMapLoad = useCallback((event: any) => {
    console.log('[FixedMapView] Map loaded successfully with CartoDB Dark tiles');
    if (event?.target) {
      const map = event.target;
      mapRef.current = map;
      console.log('[FixedMapView] Map reference set');
      
      // Add tile load monitoring
      map.on('sourcedata', (e: any) => {
        if (e.isSourceLoaded) {
          console.log('[FixedMapView] CartoDB tiles loaded:', e.sourceId);
        }
      });
      
      // Log initial tiles request
      map.on('data', (e: any) => {
        if (e.sourceDataType === 'visibility' && e.isSourceLoaded) {
          console.log('[FixedMapView] CartoDB Dark Matter tiles are now visible');
        }
      });
    }
  }, []);
  
  console.log('[FixedMapView] Rendering, mapStyle:', mapStyle ? 'loaded' : 'not loaded');
  console.log('[FixedMapView] isMounted:', isMounted);
  
  // Show loading state while map style is being loaded
  if (!mapStyle) {
    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ marginBottom: '10px' }}>Loading dark map...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      
      <DeckGL
        ref={mapRef}
        views={mapView}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        layers={groundStationLayers}
        getCursor={({ isDragging, isHovering }) => 
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
        }
        parameters={{
          blend: true,
          blendFunc: ['SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'],
          depthTest: true
        }}
      >
        {mapStyle && (
          <Map
            reuseMaps
            mapStyle={mapStyle}
            mapLib={maplibregl}
            onLoad={handleMapLoad}
            onError={(e: any) => {
              console.error('[FixedMapView] Map tile loading error:', e);
              console.log('[FixedMapView] Attempting to continue despite error...');
            }}
          />
        )}
      </DeckGL>
      
      {/* Navigation Controls */}
      <NavigationControl
        viewState={viewState}
        onNavigate={(target) => {
          setViewState(prev => ({
            ...prev,
            ...target,
            transitionDuration: 1000,
            transitionInterpolator: new FlyToInterpolator()
          }));
        }}
      />
      
      {/* Station Info Panel */}
      {selectedStation && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '350px',
          zIndex: 1000
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
            {selectedStation.name}
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div><strong>Location:</strong> {selectedStation.city}, {selectedStation.country}</div>
            <div><strong>Operator:</strong> {selectedStation.operator}</div>
            <div><strong>Legacy:</strong> {selectedStation.legacy_operator}</div>
            <div><strong>Antennas:</strong> {selectedStation.antenna_count}</div>
            <div><strong>Capacity:</strong> {selectedStation.capacity_gbps} Gbps</div>
            <div><strong>Utilization:</strong> {(selectedStation.utilization * 100).toFixed(0)}%</div>
          </div>
          <button
            onClick={() => {
              setSelectedStation(null);
              selectFeature(null);
            }}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};