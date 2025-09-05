'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import { 
  ScatterplotLayer, 
  PathLayer, 
  TextLayer, 
  IconLayer,
  LineLayer
} from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { useMapStore } from '@/lib/store/mapStore';
import { useViewportIntelligence } from '@/hooks/useViewportIntelligence';
// Removed FloatingIntelligencePanel - using MinimalLeftSidebar instead
import { IntelligenceBar } from '@/components/Intelligence/IntelligenceBar';
import { ContextualAnalysisPanel } from '@/components/Intelligence/ContextualAnalysisPanel';
import { TimelineController } from '@/components/Timeline/TimelineController';
import { useTimelineControl } from '@/hooks/useTimelineControl';
import { AnalyticsPanel } from '@/components/Maritime/AnalyticsPanel';
import { EnhancedAnalyticsPanel } from '@/components/Panels/EnhancedAnalyticsPanel';
import { EnhancedChatPanel } from '@/components/Panels/EnhancedChatPanel';
import { createActivityHeatmapLayer, createRiskHeatmapLayer } from '@/components/Layers/HeatmapLayer';
import { createShippingLanesLayer } from '@/components/Map/layers/ShippingLanesLayer';
import { createEncounterEventsLayer, createEncounterPulseLayer } from '@/components/Map/layers/EncounterEventsLayer';
import { createKaggleTripsLayer } from '@/components/Map/layers/VesselTripsLayer';
import { UnifiedLeftSidebar } from '@/components/Layout/UnifiedLeftSidebar';
import { generateEncounterEventsFromKaggle, type EncounterEvent } from '@/components/Maritime/EncounterEvents';
import { temporalDataService } from '@/lib/services/temporalDataService';
import { kaggleAISServiceV2 } from '@/lib/services/kaggleAISServiceV2';
import { VesselData, ClassificationConfig, ActivityHeatmapData, VesselEncounter } from '@/types/maritime';
import 'maplibre-gl/dist/maplibre-gl.css';

// CartoDB Dark Matter style for military theme
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

// Risk color mapping
const getRiskColor = (riskScore: number): [number, number, number, number] => {
  if (riskScore >= 80) return [255, 59, 48, 200];   // Red - Critical
  if (riskScore >= 60) return [255, 149, 0, 200];   // Orange - High
  if (riskScore >= 40) return [255, 204, 0, 200];   // Yellow - Medium
  if (riskScore >= 20) return [52, 199, 89, 200];  // Green - Low
  return [150, 150, 150, 200];                      // Gray - Minimal
};

function ViewportMaritimeMap() {
  const mapRef = useRef<any>(null);
  const { viewState, updateViewState } = useMapStore();
  
  // Local view state
  const [localViewState, setLocalViewState] = useState({
    longitude: 112,
    latitude: 12,
    zoom: 6,
    pitch: 0,
    bearing: 0,
    transitionDuration: 0,
    transitionInterpolator: null as any
  });

  // Layer management
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(
    new Set(['vessel-positions', 'vessel-tracks', 'shipping-lanes', 'encounters', 'fishing-areas'])
  );

  // Map style
  const [mapStyle, setMapStyle] = useState<any>(CARTODB_DARK_STYLE);
  
  // Selected vessel for detail view
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null);

  
  // Heatmap visibility - activity heatmap enabled by default to show common paths
  const [showActivityHeatmap, setShowActivityHeatmap] = useState(true);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(false);
  
  // Time range for temporal analysis
  const [timeRange, setTimeRange] = useState<[Date, Date]>([
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Extended to 7 days for better demo
    new Date()
  ]);

  // Enhanced timeline control
  const timeline = useTimelineControl({
    start: timeRange[0],
    end: timeRange[1]
  });

  // Use viewport-based intelligence loading
  const { intelligenceData, loadingLayers, stats } = useViewportIntelligence(
    localViewState,
    enabledLayers
  );

  // Get viewport bounds for display
  const viewportBounds = useMemo(() => {
    const { longitude, latitude, zoom } = localViewState;
    const latRange = 180 / Math.pow(2, zoom);
    const lonRange = 360 / Math.pow(2, zoom);
    
    return {
      north: latitude + latRange / 2,
      south: latitude - latRange / 2,
      east: longitude + lonRange / 2,
      west: longitude - lonRange / 2
    };
  }, [localViewState]);

  // Handle layer toggle
  const handleLayerToggle = useCallback((layerId: string) => {
    setEnabledLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  // Handle bulk toggle
  const handleBulkToggle = useCallback((sectionId: string, enabled: boolean) => {
    // Implementation for toggling entire sections
    console.log('Bulk toggle:', sectionId, enabled);
  }, []);

  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState: newViewState }: any) => {
    const constrainedViewState = {
      ...newViewState,
      zoom: Math.max(2, Math.min(20, newViewState.zoom)),
      pitch: Math.max(0, Math.min(60, newViewState.pitch))
    };
    
    setLocalViewState(constrainedViewState);
    updateViewState(constrainedViewState);
  }, [updateViewState]);

  // Kaggle AIS data state
  const [kaggleData, setKaggleData] = useState<{
    trips: any[];
    heatmapData: any[];
    timeRange: { start: number; end: number } | null;
    encounters: EncounterEvent[];
  }>({ trips: [], heatmapData: [], timeRange: null, encounters: [] });
  const [isKaggleLoading, setIsKaggleLoading] = useState(false);
  const [useKaggleData, setUseKaggleData] = useState(true); // Use real Kaggle data by default
  
  // Selected items for detail view
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterEvent | null>(null);
  
  // Animation state for trips
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationSpeed = 30; // 30x speed
  
  // Panel state - only one can be open at a time
  type PanelType = 'analytics' | 'chat' | null;
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  
  // Load Kaggle AIS data on mount
  useEffect(() => {
    const loadKaggleData = async () => {
      setIsKaggleLoading(true);
      try {
        await kaggleAISServiceV2.initialize();
        
        const trips = kaggleAISServiceV2.getVesselTrips();
        const heatmapData = kaggleAISServiceV2.getFishingHeatmapData();
        const timeRange = kaggleAISServiceV2.getTimeRange();
        const bounds = kaggleAISServiceV2.getBounds();
        
        // Generate encounter events from trajectories
        const encounters = generateEncounterEventsFromKaggle(trips);
        
        setKaggleData({ trips, heatmapData, timeRange, encounters });
        
        // Set initial time and viewport
        if (timeRange) {
          setCurrentTime(timeRange.start / 1000); // Convert to seconds
        }
        
        // Center map on data bounds (Baltic Sea)
        if (bounds) {
          setLocalViewState(prev => ({
            ...prev,
            longitude: (bounds.east + bounds.west) / 2,
            latitude: (bounds.north + bounds.south) / 2,
            zoom: 7,
            transitionDuration: 1000,
            transitionInterpolator: new FlyToInterpolator()
          }));
        }
        
        console.log('[ViewportMaritimeMap] Loaded optimized Kaggle data:', {
          tripCount: trips.length,
          heatmapPoints: heatmapData.length,
          timeRange: timeRange ? {
            start: new Date(timeRange.start),
            end: new Date(timeRange.end)
          } : null,
          bounds
        });
      } catch (error) {
        console.error('[ViewportMaritimeMap] Error loading Kaggle data:', error);
      } finally {
        setIsKaggleLoading(false);
      }
    };
    
    if (useKaggleData) {
      loadKaggleData();
    }
  }, [useKaggleData]);
  
  // Animation loop for vessel tracks
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setCurrentTime(t => {
        if (kaggleData.timeRange) {
          const newTime = t + animationSpeed;
          // Loop back to start when reaching the end
          if (newTime > kaggleData.timeRange.end / 1000) {
            return kaggleData.timeRange.start / 1000;
          }
          return newTime;
        }
        return t + animationSpeed;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    
    if (isPlaying && enabledLayers.has('vessel-tracks')) {
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, enabledLayers, animationSpeed, kaggleData.timeRange]);
  
  // Create optimized layers based on loaded data with proper visual hierarchy
  const layers = useMemo(() => {
    const layerList = [];
    
    // Layer rendering order (bottom to top):
    // 1. Shipping lanes and fishing areas (background)
    // 2. Ocean heatmap (fishing intensity) 
    // 3. Vessel paths (historical tracks)
    // 4. TripsLayer (animated current positions)
    // 5. Vessel icons (current positions)
    // 6. Encounter events (overlays)
    // 7. Intelligence overlays (clusters, risk areas)
    
    // LAYER 0: Shipping lanes (background layer) using proper LineLayer
    if (enabledLayers.has('shipping-lanes')) {
      layerList.push(createShippingLanesLayer('baltic'));
    }
    
    // Use Kaggle data if available and enabled
    if (useKaggleData && kaggleData.trips.length > 0) {
      // LAYER 1: Ocean heatmap (bottom layer)
      if (showActivityHeatmap && kaggleData.heatmapData.length > 0) {
        layerList.push(new HeatmapLayer({
          id: 'kaggle-fishing-heatmap',
          data: kaggleData.heatmapData,
          getPosition: (d: any) => d.position,
          getWeight: (d: any) => d.weight,
          radiusPixels: 40,
          intensity: 2.0,
          threshold: 0.03,
          colorRange: [
            [26, 152, 80, 0],       // Transparent green (low activity)
            [74, 178, 70, 100],     // Light green  
            [215, 226, 125, 150],   // Yellow
            [253, 141, 60, 200],    // Orange
            [237, 1, 90, 255]       // Pink/magenta (high activity - GFW style)
          ]
        }));
      }
      
      // LAYER 2: Vessel paths (historical tracks - faded)
      if (enabledLayers.has('vessel-tracks')) {
        layerList.push(new PathLayer({
          id: 'kaggle-vessel-paths',
          data: kaggleData.trips,
          getPath: (d: any) => d.path.map((p: number[]) => [p[0], p[1]]),
          getColor: (d: any) => [...d.color.slice(0, 3), 30], // Very faded
          getWidth: 1,
          widthMinPixels: 0.5,
          opacity: 0.5
        }));
        
        // LAYER 3: Animated vessel tracks using proper TripsLayer implementation
        layerList.push(createKaggleTripsLayer(
          kaggleData.trips,
          currentTime,
          1800 // 30 minute trail
        ));
      }
      
      // LAYER 4: Vessel icons at current position
      if (enabledLayers.has('vessel-positions')) {
        const currentPositions = kaggleData.trips.map(trip => {
          // Find position at current time
          const path = trip.path;
          let position = path[0];
          
          for (let i = 0; i < path.length; i++) {
            if (path[i][2] > currentTime) {
              if (i > 0) {
                // Interpolate between points
                const t = (currentTime - path[i-1][2]) / (path[i][2] - path[i-1][2]);
                position = [
                  path[i-1][0] + t * (path[i][0] - path[i-1][0]),
                  path[i-1][1] + t * (path[i][1] - path[i-1][1]),
                  currentTime
                ];
              }
              break;
            }
            position = path[i];
          }
          
          return {
            position: [position[0], position[1]],
            color: trip.color,
            id: trip.vesselId
          };
        });
        
        // Vessel icons with size based on type
        layerList.push(new ScatterplotLayer({
          id: 'kaggle-vessel-positions',
          data: currentPositions,
          getPosition: (d: any) => d.position,
          getFillColor: (d: any) => d.color,
          getLineColor: [255, 255, 255, 200],
          getRadius: 5,
          radiusMinPixels: 4,
          radiusMaxPixels: 10,
          lineWidthMinPixels: 1,
          stroked: true,
          filled: true,
          opacity: 1.0,
          pickable: true,
          autoHighlight: true
        }));
      }
      
      // LAYER 5: Encounter events using proper IconLayer
      if (enabledLayers.has('encounters') && kaggleData.encounters.length > 0) {
        layerList.push(createEncounterEventsLayer(kaggleData.encounters));
        
        // Add pulsing animation for recent encounters
        const pulseLayer = createEncounterPulseLayer(kaggleData.encounters);
        if (pulseLayer) {
          layerList.push(pulseLayer);
        }
      }
    } else if (!intelligenceData) {
      return layerList;
    } else {
      // Original simulated data layers
      // Add heatmap layers first (underneath vessels)
      if (showActivityHeatmap && intelligenceData.vessels.length > 0) {
        const heatmapData = intelligenceData.vessels.map((v: any) => ({
          lat: v.lat,
          lon: v.lon,
          weight: 1,
          riskScore: v.riskScore
        }));
        
        const activityLayer = createActivityHeatmapLayer(heatmapData, {
          visible: true,
          intensity: 2,    // Increased intensity
          radiusPixels: 50  // Slightly smaller radius
        });
        
        if (activityLayer) layerList.push(activityLayer);
      }
    }
    
    if (showRiskHeatmap && intelligenceData.vessels.length > 0) {
      const heatmapData = intelligenceData.vessels.map((v: any) => ({
        lat: v.lat,
        lon: v.lon,
        weight: 1,
        riskScore: v.riskScore
      }));
      
      const riskLayer = createRiskHeatmapLayer(heatmapData, {
        visible: true,
        intensity: 2.5  // Increased for better visibility
      });
      
      if (riskLayer) layerList.push(riskLayer);
    }
    
    // Vessel tracks layer - animated trails using TripsLayer
    if (enabledLayers.has('vessel-tracks') && intelligenceData.vessels.length > 0) {
      // Filter vessels with track history and convert to trips format
      const trips = intelligenceData.vessels
        .filter((v: any) => v.trackHistory && v.trackHistory.length > 1)
        .slice(0, 300) // Limit for performance
        .map((vessel: any) => {
          // Convert track points to [lon, lat, timestamp] format
          const path = vessel.trackHistory.map((point: any) => [
            point.lon,
            point.lat,
            new Date(point.timestamp).getTime() / 1000 // Convert to seconds
          ]);
          
          // Get color based on vessel type and behavior
          let color: number[];
          if (vessel.type === 'fishing') {
            if (vessel.behaviors?.includes('dark_vessel')) {
              color = [255, 0, 0]; // Red for dark vessels
            } else if (vessel.behaviors?.includes('fishing')) {
              color = [0, 200, 255]; // Cyan for active fishing
            } else if (vessel.behaviors?.includes('transshipment')) {
              color = [255, 200, 0]; // Orange for transshipment
            } else {
              color = [100, 150, 255]; // Light blue for transiting fishing vessels
            }
          } else if (vessel.type === 'cargo') {
            color = [150, 150, 150]; // Gray for cargo
          } else {
            color = [200, 200, 200]; // Light gray for others
          }
          
          return {
            vendor: vessel.id,
            path,
            color,
            width: vessel.behaviors?.includes('dark_vessel') ? 3 : 2
          };
        });
      
      if (trips.length > 0) {
        // Get time bounds from all trips
        let minTime = Infinity;
        let maxTime = -Infinity;
        trips.forEach(trip => {
          trip.path.forEach((point: number[]) => {
            minTime = Math.min(minTime, point[2]);
            maxTime = Math.max(maxTime, point[2]);
          });
        });
        
        const loopLength = maxTime - minTime;
        const animationTime = (currentTime % loopLength) + minTime;
        
        layerList.push(new TripsLayer({
          id: 'vessel-tracks',
          data: trips,
          getPath: (d: any) => d.path,
          getTimestamps: (d: any) => d.path.map((p: number[]) => p[2]),
          getColor: (d: any) => d.color,
          opacity: 0.4,
          widthMinPixels: 1,
          widthMaxPixels: 3,
          jointRounded: true,
          capRounded: true,
          trailLength: 600, // 10 minute trail (600 seconds)
          currentTime: animationTime,
          shadowEnabled: false,
          parameters: {
            depthTest: false
          }
        }));
        
        // Also add a PathLayer for permanent trails (no animation)
        const paths = trips.map((trip: any) => ({
          path: trip.path.map((p: number[]) => [p[0], p[1]]),
          color: [...trip.color, 30], // Very transparent
          width: 1
        }));
        
        layerList.push(new PathLayer({
          id: 'vessel-paths',
          data: paths,
          getPath: (d: any) => d.path,
          getColor: (d: any) => d.color,
          getWidth: (d: any) => d.width,
          widthScale: 1,
          widthMinPixels: 0.5,
          widthMaxPixels: 1,
          opacity: 0.3,
          parameters: {
            depthTest: false
          }
        }));
      }
    }
    
    // Vessel positions layer - smaller dots like GFW
    if (enabledLayers.has('vessel-positions') && intelligenceData.vessels.length > 0) {
      layerList.push(new ScatterplotLayer({
        id: 'vessel-positions',
        data: intelligenceData.vessels,
        getPosition: (d: any) => [d.lon, d.lat],
        getRadius: (d: any) => {
          // Much smaller radius for GFW-style dots
          if (localViewState.zoom < 6) return 800;  // Continental zoom
          if (localViewState.zoom < 8) return 600;  // Regional zoom
          if (localViewState.zoom < 10) return 400; // Local zoom
          return 300; // Detail zoom
        },
        radiusScale: 1,
        radiusUnits: 'meters',
        radiusMinPixels: 1.5,  // Much smaller minimum
        radiusMaxPixels: 4,    // Much smaller maximum
        getFillColor: (d: any) => {
          // Type-specific colors for fishing vessels
          if (d.type === 'fishing') {
            // Different colors by fishing subtype if available
            const fishingColors: Record<string, number[]> = {
              'trawler': [100, 149, 237, 200],      // Cornflower blue
              'purse_seiner': [50, 205, 50, 200],   // Lime green
              'longliner': [147, 112, 219, 200],    // Medium purple
              'gillnetter': [255, 140, 0, 200],     // Dark orange
              'squid_jigger': [255, 20, 147, 200],  // Deep pink
              'factory_trawler': [70, 130, 180, 200], // Steel blue
              'default': [0, 191, 255, 200]         // Deep sky blue
            };
            const subtype = (d as any).subtype || 'default';
            return fishingColors[subtype] || fishingColors['default'];
          }
          // Other vessel types
          if (d.type === 'cargo') return [128, 128, 128, 180]; // Gray
          if (d.type === 'tanker') return [105, 105, 105, 180]; // Dim gray
          if (d.type === 'passenger') return [255, 255, 255, 180]; // White
          if (d.type === 'unknown') return [255, 0, 0, 200]; // Red for unknown/suspicious
          // Default to risk-based color
          return getRiskColor(d.riskScore);
        },
        getLineColor: (d: any) => {
          // Add subtle glow for active fishing vessels
          if (d.behaviors?.includes('fishing') || d.behaviors?.includes('setting_gear')) {
            return [255, 255, 255, 80]; // White glow
          }
          return [0, 0, 0, 0]; // No stroke for others
        },
        lineWidthMinPixels: 0.5,
        stroked: true,
        filled: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 0, 200], // Yellow highlight on hover
        onHover: (info: any) => {
          if (info.object) {
            document.body.style.cursor = 'pointer';
          } else {
            document.body.style.cursor = 'default';
          }
        },
        onClick: (info: any) => {
          if (info.object) {
            setSelectedVessel(info.object);
          }
        },
        updateTriggers: {
          getFillColor: [intelligenceData.vessels],
          getRadius: [localViewState.zoom]
        }
      }));
    }
    
    // Vessel names (only at high zoom)
    if (localViewState.zoom >= 10 && intelligenceData.vessels.length > 0) {
      layerList.push(new TextLayer({
        id: 'vessel-labels',
        data: intelligenceData.vessels,
        getPosition: (d: any) => [d.lon, d.lat],
        getText: (d: any) => d.name,
        getSize: 12,
        getColor: [255, 255, 255, 200],
        getPixelOffset: [0, 20],
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: '500',
        backgroundColor: [0, 0, 0, 100],
        backgroundPadding: [4, 6]
      }));
    }
    
    // Signal intelligence layer
    if (enabledLayers.has('ais-signals') && intelligenceData.signals.length > 0) {
      layerList.push(new ScatterplotLayer({
        id: 'signal-positions',
        data: intelligenceData.signals,
        getPosition: (d: any) => [d.lon, d.lat],
        getRadius: 500,
        radiusUnits: 'meters',
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        getFillColor: [0, 255, 136, 100],
        getLineColor: [0, 255, 136, 255],
        lineWidthMinPixels: 1,
        stroked: true,
        filled: true,
        pickable: false,
        opacity: 0.6
      }));
    }
    
    // Correlation lines
    if (intelligenceData.correlations.length > 0) {
      const correlationLines = intelligenceData.correlations.flatMap((corr: any) => {
        return corr.targets.map((target: any) => ({
          source: [corr.source.lon, corr.source.lat],
          target: [target.lon, target.lat],
          confidence: corr.confidence
        }));
      });
      
      layerList.push(new LineLayer({
        id: 'correlation-lines',
        data: correlationLines,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getColor: (d: any) => [255, 255, 0, Math.floor(d.confidence * 150)],
        getWidth: (d: any) => d.confidence * 3,
        opacity: 0.5
      }));
    }
    
    return layerList;
  }, [intelligenceData, enabledLayers, localViewState.zoom, showActivityHeatmap, showRiskHeatmap, currentTime, kaggleData, useKaggleData, selectedEncounter]);

  // Initial viewport setup
  useEffect(() => {
    if (viewState) {
      setLocalViewState(prev => ({
        ...prev,
        longitude: viewState.longitude || prev.longitude,
        latitude: viewState.latitude || prev.latitude,
        zoom: viewState.zoom || prev.zoom
      }));
    }
  }, [viewState]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: 'linear-gradient(to bottom, #0a0a0f, #14141a)' }}>
      
      {/* Main Map */}
      <DeckGL
        ref={mapRef}
        viewState={localViewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        getCursor={({ isDragging, isHovering }: any) => {
          if (isDragging) return 'grabbing';
          if (isHovering) return 'pointer';
          return 'grab';
        }}
        onClick={(info: any) => {
          if (info.object) {
            // Check if it's an encounter event
            if (info.object.id && info.object.id.startsWith('encounter-')) {
              setSelectedEncounter(info.object);
              setSelectedVessel(null);
            } 
            // Check if it's a vessel
            else if (info.object.imo || info.object.id) {
              setSelectedVessel(info.object);
              setSelectedEncounter(null);
            }
          } else {
            // Clear selections when clicking empty space
            setSelectedVessel(null);
            setSelectedEncounter(null);
          }
        }}
      >
        <Map
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing={true}
        />
      </DeckGL>
      
      {/* Unified Left Sidebar with search, layers, analytics, and chat */}
      <UnifiedLeftSidebar
        enabledLayers={enabledLayers}
        onLayerToggle={handleLayerToggle}
        onShowAnalytics={() => {
          // Toggle analytics panel
          setActivePanel(activePanel === 'analytics' ? null : 'analytics');
        }}
        onShowChat={() => {
          // Toggle chat panel
          setActivePanel(activePanel === 'chat' ? null : 'chat');
        }}
        activePanel={activePanel}
        stats={{
          totalVessels: stats?.totalVessels || kaggleData.trips.length || 0,
          highRiskVessels: stats?.highRiskVessels || 0,
          totalEncounters: kaggleData.encounters.length
        }}
      />
      
      {/* Enhanced Analytics Panel (Bottom) */}
      <EnhancedAnalyticsPanel
        isOpen={activePanel === 'analytics'}
        onClose={() => setActivePanel(null)}
      />
      
      {/* Enhanced Chat Panel (Bottom) */}
      <EnhancedChatPanel
        isOpen={activePanel === 'chat'}
        onClose={() => setActivePanel(null)}
      />
      
      {/* Enhanced Timeline Controller */}
      <TimelineController
        startDate={timeline.startDate}
        endDate={timeline.endDate}
        currentTime={timeline.currentTime}
        isPlaying={timeline.isPlaying}
        playbackSpeed={timeline.playbackSpeed}
        onTimeChange={timeline.onTimeChange}
        onPlayToggle={timeline.onPlayToggle}
        onSpeedChange={timeline.onSpeedChange}
        onDateRangeChange={(start, end) => {
          timeline.onDateRangeChange(start, end);
          setTimeRange([start, end]);
        }}
        activityData={timeline.activityData}
      />
      
      {/* Kaggle overlay removed - clean UI */}
    </div>
  );
}

export default ViewportMaritimeMap;