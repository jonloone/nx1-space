'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { NavigationControl } from '../Controls/NavigationControl';
import { useMapStore } from '@/lib/store/mapStore';
import 'maplibre-gl/dist/maplibre-gl.css';

// Simplified PMTiles registration that handles errors gracefully
const registerPMTilesProtocol = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    console.log('[FixedMapView] Registering PMTiles protocol...');
    const protocol = new Protocol();
    
    // Remove existing protocol if present
    try {
      maplibregl.removeProtocol("pmtiles");
    } catch (e) {
      // Protocol not registered, which is fine
    }
    
    // Register new protocol
    maplibregl.addProtocol("pmtiles", protocol.tile);
    console.log('[FixedMapView] PMTiles protocol registered successfully');
    return true;
  } catch (error) {
    console.error('[FixedMapView] Failed to register PMTiles protocol:', error);
    return false;
  }
};

// Simple fallback map style using OSM
const FALLBACK_STYLE = {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0a0a0f' }
    },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-opacity': 0.7
      }
    }
  ]
};

// Try to create a PMTiles style, fall back to OSM
const createMapStyle = () => {
  try {
    // Use reliable PMTiles source
    const pmtilesUrl = 'https://data.source.coop/smartmaps/overture-2024-07-22/overture.pmtiles';
    
    return {
      version: 8,
      glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
      sources: {
        'overture': {
          type: 'vector',
          url: `pmtiles://${pmtilesUrl}`,
          attribution: 'Overture Maps Foundation'
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#0a0a0f'
          }
        },
        {
          id: 'water',
          type: 'fill',
          source: 'overture',
          'source-layer': 'water',
          paint: {
            'fill-color': '#1a2332'
          }
        },
        {
          id: 'land',
          type: 'fill',
          source: 'overture',
          'source-layer': 'land', 
          paint: {
            'fill-color': '#21262d'
          }
        },
        {
          id: 'transportation',
          type: 'line',
          source: 'overture',
          'source-layer': 'transportation',
          paint: {
            'line-color': '#3d4450',
            'line-width': 1
          }
        }
      ]
    };
  } catch (error) {
    console.error('[FixedMapView] Failed to create PMTiles style:', error);
    return FALLBACK_STYLE;
  }
};

const INITIAL_VIEW_STATE = {
  longitude: -118.2437,  // Los Angeles default
  latitude: 34.0522,
  zoom: 10,
  pitch: 0,
  bearing: 0
};

export const FixedMapView: React.FC = () => {
  console.log('[FixedMapView] Component rendering');
  
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [mapStyle, setMapStyle] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Simplified store usage - no complex data loading
  const { domain } = useMapStore();
  
  // Mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Initialize map style
  useEffect(() => {
    if (!isMounted) {
      console.log('[FixedMapView] Waiting for client mount...');
      return;
    }
    
    const initialize = async () => {
      console.log('[FixedMapView] Initializing on client...');
      console.log('[FixedMapView] Window available:', typeof window !== 'undefined');
      console.log('[FixedMapView] Document available:', typeof document !== 'undefined');
      
      try {
        // Register PMTiles protocol
        const protocolRegistered = registerPMTilesProtocol();
        console.log('[FixedMapView] PMTiles protocol registered:', protocolRegistered);
        
        // Create map style
        const style = createMapStyle();
        console.log('[FixedMapView] Map style created');
        setMapStyle(style);
        
      } catch (error: any) {
        console.error('[FixedMapView] Initialization error:', error);
        setInitError(error.message || 'Failed to initialize map');
        
        // Always set fallback style
        console.log('[FixedMapView] Setting fallback OSM style...');
        setMapStyle(FALLBACK_STYLE);
      }
    };
    
    // Small delay to ensure everything is loaded
    const timer = setTimeout(initialize, 200);
    return () => clearTimeout(timer);
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
  }, []);
  
  // Handle map loaded event
  const handleMapLoad = useCallback((event: any) => {
    console.log('[FixedMapView] Map loaded event');
    if (event?.target) {
      const map = event.target;
      mapRef.current = map;
      console.log('[FixedMapView] Map reference set');
      
      // Add error listeners
      map.on('error', (e: any) => {
        console.error('[FixedMapView] MapLibre error:', e.error);
        // Don't crash on map errors, just log them
      });
      
      map.on('sourcedata', (e: any) => {
        if (e.isSourceLoaded) {
          console.log('[FixedMapView] Source loaded:', e.sourceId);
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
          <div style={{ marginBottom: '10px' }}>Loading map...</div>
          {initError && (
            <div style={{ color: '#ff6b6b', fontSize: '12px' }}>
              Error: {initError}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Error Display */}
      {initError && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 165, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          Using fallback tiles: {initError}
        </div>
      )}
      
      <DeckGL
        ref={mapRef}
        views={mapView}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        layers={[]} // Start with no layers for simplicity
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
              console.error('[FixedMapView] Map error:', e);
              // Don't crash on errors, just log them
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
    </div>
  );
};