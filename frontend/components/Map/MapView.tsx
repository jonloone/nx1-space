import React, { useState, useMemo, useCallback, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { NavigationControl } from '../Controls/NavigationControl';
import { createDataLayers } from './layers';
import { Protocol } from 'pmtiles';
import { getGERSService } from '@/lib/services/GERSService';
// import { getPMTilesConfig, getMapStyle } from '@/lib/config/mapConfig';
// import { getPMTilesConfig, getMapStyle } from '@/lib/config/mapConfigMinimal';
import { getMapStyle } from '@/lib/config/mapConfigRobust';
import { useMapStore } from '@/lib/store/mapStore';
import { DataService } from '@/lib/services/DataService';
import 'maplibre-gl/dist/maplibre-gl.css';

// Register PMTiles protocol for MapLibre GL (only on client)
const registerPMTilesProtocol = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    console.log('[MapView] Registering PMTiles protocol...');
    const protocol = new Protocol();
    // Check if protocol already registered
    try {
      // Try to remove it first (will throw if not registered)
      maplibregl.removeProtocol("pmtiles");
    } catch (e) {
      // Protocol not registered, which is fine
    }
    
    // Now register it
    maplibregl.addProtocol("pmtiles", protocol.tile);
    console.log('[MapView] PMTiles protocol registered successfully');
    return true;
  } catch (error) {
    console.error('[MapView] Failed to register PMTiles protocol:', error);
    return false;
  }
};

const INITIAL_VIEW_STATE = {
  longitude: -118.2437,  // Los Angeles default
  latitude: 34.0522,
  zoom: 10,
  pitch: 0,
  bearing: 0,
  minZoom: 2,      // Don't allow zooming out to globe level
  maxZoom: 22,     // Allow maximum detail
  minPitch: 0,     // Keep it flat for 2D
  maxPitch: 60     // Allow some tilt for better visualization
};

export const MapView: React.FC = () => {
  console.log('[MapView] Component rendering');
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mapStyle, setMapStyle] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const gersService = useRef(getGERSService());
  
  const { 
    domain,
    dataCache,
    loadData,
    selectFeature,
    layers
  } = useMapStore();
  
  // Ensure we're on the client
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Initialize map style
  React.useEffect(() => {
    if (!isMounted) {
      console.log('[MapView] Waiting for client mount...');
      return;
    }
    
    const initialize = async () => {
      console.log('[MapView] Initializing on client...');
      console.log('[MapView] Window available:', typeof window !== 'undefined');
      console.log('[MapView] Document available:', typeof document !== 'undefined');
      
      try {
        // Register PMTiles protocol first
        const protocolRegistered = registerPMTilesProtocol();
        console.log('[MapView] PMTiles protocol registered:', protocolRegistered);
        
        // Initialize GERS (don't block map if it fails)
        console.log('[MapView] Initializing GERS service...');
        try {
          await gersService.current.initialize();
          console.log('[MapView] GERS service initialized');
        } catch (gersError) {
          console.warn('[MapView] GERS initialization failed, continuing without it:', gersError.message);
        }
        
        // Load map style with intelligent fallback
        console.log('[MapView] Loading map style...');
        const style = await getMapStyle();
        console.log('[MapView] Map style created:', style);
        console.log('[MapView] Style layers:', style.layers.map(l => l.id));
        setMapStyle(style);
      } catch (error: any) {
        console.error('[MapView] Initialization error:', error);
        console.error('[MapView] Error stack:', error.stack);
        console.error('[MapView] Error type:', error.constructor.name);
        setInitError(error.message || 'Failed to initialize map');
        
        // Set a basic style even if there's an error
        // Using OpenStreetMap raster tiles as fallback
        console.log('[MapView] Setting fallback OSM style...');
        setMapStyle({
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
                'raster-opacity': 0.5  // Make it darker to match the theme
              }
            }
          ]
        });
      }
    };
    
    // Add a small delay to ensure everything is loaded
    setTimeout(initialize, 100);
  }, [isMounted]);
  
  // Create 2D map view only
  const mapView = useMemo(() => 
    new DeckMapView({
      id: 'main-map',
      controller: {
        doubleClickZoom: false,  // We'll handle this ourselves
        scrollZoom: {
          speed: 0.01,
          smooth: true
        },
        touchRotate: true,
        keyboard: {
          rotateSpeedX: 2,
          rotateSpeedY: 2,
          moveSpeed: 100,
          zoomSpeed: 2
        },
        inertia: true
      }
    }), 
  []);
  
  // Handle view state changes with smoothing
  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    // Apply constraints
    const constrainedViewState = {
      ...newViewState,
      zoom: Math.max(2, Math.min(22, newViewState.zoom)),
      pitch: Math.max(0, Math.min(60, newViewState.pitch))
    };
    
    setViewState(constrainedViewState);
  }, []);
  
  // Smooth transitions for programmatic changes
  const transitionToView = useCallback((target: Partial<typeof viewState>) => {
    setIsTransitioning(true);
    setViewState(prev => ({
      ...prev,
      ...target,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
      onTransitionEnd: () => setIsTransitioning(false)
    }));
  }, []);
  
  // Listen for navigation events from search
  React.useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const { longitude, latitude, zoom } = event.detail;
      transitionToView({ longitude, latitude, zoom });
    };
    
    window.addEventListener('navigate-to-location', handleNavigate as any);
    return () => window.removeEventListener('navigate-to-location', handleNavigate as any);
  }, [transitionToView]);
  
  // Load data based on current view
  React.useEffect(() => {
    const loadDomainData = async () => {
      console.log('[MapView] Loading data for domain:', domain);
      try {
        const zoom = viewState.zoom;
        let data;
        
        // Determine data detail level based on zoom
        const detailLevel = zoom <= 3 ? 'overview' : 
                           zoom <= 8 ? 'regional' : 
                           zoom <= 14 ? 'detailed' : 'full';
        
        // Calculate bounds for spatial queries
        const getBounds = () => {
          if (zoom <= 6) return undefined; // Load global data
          
          // Progressive bounds based on zoom
          const range = zoom <= 8 ? 40 : 
                       zoom <= 12 ? 20 : 
                       zoom <= 16 ? 10 : 5;
          
          return [
            viewState.longitude - range, 
            viewState.latitude - range,
            viewState.longitude + range, 
            viewState.latitude + range
          ];
        };
        
        switch (domain) {
          case 'ground-stations':
            data = await DataService.loadGroundStationData({
              bounds: getBounds(),
              includePredictions: zoom >= 8,
              includeDetails: zoom >= 12,
              includeTelemetry: zoom >= 14,
              detailLevel
            });
            break;
          case 'maritime':
            data = await DataService.loadMaritimeData({
              bounds: getBounds(),
              realTime: zoom >= 10,
              includePredictions: zoom >= 8,
              includeHistory: zoom >= 14,
              detailLevel
            });
            break;
          default:
            data = await DataService.loadMockData(domain);
        }
        
        // Only update if data has changed significantly
        const existingData = dataCache.get(domain);
        if (!existingData || JSON.stringify(data) !== JSON.stringify(existingData)) {
          console.log('[MapView] Loading new data for domain:', domain, data);
          loadData(domain, data);
        } else {
          console.log('[MapView] Data already exists for domain:', domain);
        }
      } catch (error) {
        console.error('Failed to load domain data:', error);
      }
    };
    
    // Debounce data loading to avoid excessive requests
    const timer = setTimeout(loadDomainData, 300);
    return () => clearTimeout(timer);
  }, [domain, viewState.zoom, viewState.longitude, viewState.latitude, dataCache, loadData]);
  
  // Create layers based on current zoom
  const deckLayers = useMemo(() => {
    const domainData = dataCache.get(domain);
    if (!domainData) return [];
    
    return createDataLayers({
      zoom: viewState.zoom,
      pitch: viewState.pitch,
      domain,
      data: domainData,
      layers,
      dataCache
    });
  }, [viewState.zoom, viewState.pitch, domain, dataCache, layers]);
  
  // Handle map loaded event
  const handleMapLoad = useCallback((event: any) => {
    console.log('[MapView] Map loaded event');
    if (event?.target) {
      const map = event.target;
      mapRef.current = map;
      gersService.current.setMap(map);
      console.log('[MapView] Map reference set in GERS service');
      
      // Add error listeners
      map.on('error', (e: any) => {
        console.error('[MapView] MapLibre error:', e.error);
        console.error('[MapView] Error details:', e);
      });
      
      map.on('styleimagemissing', (e: any) => {
        console.warn('[MapView] Missing image:', e.id);
      });
      
      map.on('sourcedata', (e: any) => {
        if (e.isSourceLoaded) {
          console.log('[MapView] Source loaded:', e.sourceId);
        }
      });
      
      // Debug: Check what sources and layers exist
      console.log('[MapView] Map sources:', Object.keys(map.getStyle().sources));
      console.log('[MapView] Map layers:', map.getStyle().layers.map((l: any) => l.id));
    }
  }, []);
  
  // Handle tooltip with GERS entity information
  const getTooltip = useCallback(({object}: any) => {
    if (!object) return null;
    
    // Try to get GERS entity information
    const gersEntity = object ? gersService.current.getEntityFromMapFeature(object) : null;
    
    // If we have GERS entity, show enhanced tooltip
    if (gersEntity) {
      const namesDisplay = gersEntity.names.length > 0 ? gersEntity.names[0] : 'Unknown';
      const alternateNames = gersEntity.names.slice(1).join(', ');
      
      return {
        html: `
          <div class="p-2">
            <div class="font-bold">${namesDisplay}</div>
            ${alternateNames ? `<div class="text-xs text-gray-400">${alternateNames}</div>` : ''}
            <div class="text-sm mt-1">
              <span class="text-gray-500">Type:</span> ${gersEntity.category}/${gersEntity.subtype}
            </div>
            <div class="text-xs text-gray-600 mt-1">GERS: ${gersEntity.id.substring(0, 8)}...</div>
            ${gersEntity.height ? `<div class="text-sm">Height: ${gersEntity.height}m</div>` : ''}
          </div>
        `,
        style: {
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          borderRadius: '4px',
          border: '1px solid rgba(100,100,255,0.3)',
          maxWidth: '300px'
        }
      };
    }
    
    // Fallback to domain-specific tooltips
    switch (domain) {
      case 'ground-stations':
        return {
          html: `
            <div class="p-2">
              <div class="font-bold">${object.name || 'Ground Station'}</div>
              <div class="text-sm">Score: ${(object.score * 100).toFixed(1)}%</div>
              <div class="text-sm">Utilization: ${(object.utilization * 100).toFixed(1)}%</div>
            </div>
          `,
          style: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.2)'
          }
        };
      
      case 'maritime':
        return {
          html: `
            <div class="p-2">
              <div class="font-bold">${object.vessel_name || 'Vessel'}</div>
              <div class="text-sm">Type: ${object.vessel_type}</div>
              <div class="text-sm">Speed: ${object.speed?.toFixed(1)} knots</div>
            </div>
          `
        };
      
      default:
        return object.name || object.id;
    }
  }, [domain]);
  
  console.log('[MapView] Rendering, mapStyle:', mapStyle ? 'loaded' : 'not loaded');
  console.log('[MapView] DeckGL available:', typeof DeckGL !== 'undefined');
  console.log('[MapView] maplibregl available:', typeof maplibregl !== 'undefined');
  console.log('[MapView] isMounted:', isMounted);
  console.log('[MapView] window available:', typeof window !== 'undefined');
  
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
          background: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          Map Error: {initError}
        </div>
      )}
      
      <DeckGL
        ref={mapRef}
        views={mapView}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        layers={deckLayers}
        getTooltip={getTooltip}
        onClick={({object}: any) => {
          if (object) {
            // Try to get GERS entity information
            const gersEntity = gersService.current.getEntityFromMapFeature(object);
            if (gersEntity) {
              console.log('GERS Entity clicked:', gersEntity);
              
              // Get related entities
              const related = gersService.current.getRelatedEntities(gersEntity.id);
              if (related.length > 0) {
                console.log('Related entities:', related);
              }
              
              // Enhance object with GERS data before selecting
              const enhancedObject = {
                ...object,
                gersId: gersEntity.id,
                gersEntity: gersEntity
              };
              selectFeature(enhancedObject);
            } else {
              selectFeature(object);
            }
          }
        }}
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
              console.error('[MapView] Map error:', e);
              if (e.error) {
                console.error('[MapView] Error details:', e.error.message);
                console.error('[MapView] Error stack:', e.error.stack);
              }
            }}
          />
        )}
      </DeckGL>
      
      {/* Navigation Controls */}
      <NavigationControl
        viewState={viewState}
        onNavigate={transitionToView}
      />
    </div>
  );
};