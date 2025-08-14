'use client'

import React, { useState, useCallback } from 'react';
import { CesiumGlobe } from '../Globe/CesiumGlobe';
import { CesiumDeckGLOverlay } from '../Globe/CesiumDeckGLOverlay';
import { CesiumZoomControl } from '../Controls/CesiumZoomControl';
import { CesiumLayerControl } from '../Controls/CesiumLayerControl';
import { useGroundStationLayers } from '../layers/GroundStationsCesiumLayer';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { CesiumViewerProvider, useCesiumViewer } from '../../contexts/CesiumViewerContext';
import CesiumErrorBoundary from '../CesiumErrorBoundary';
import * as Cesium from 'cesium';

// Sample ground station data (using real SES/Intelsat locations)
const GROUND_STATIONS = [
  { id: '1', name: 'Manassas, VA', position: [-77.5, 38.5] as [number, number], coverageRadiusKm: 2000, utilization: 75, type: 'gateway' as const },
  { id: '2', name: 'Clarksburg, MD', position: [-77.3, 39.2] as [number, number], coverageRadiusKm: 1800, utilization: 45, type: 'standard' as const },
  { id: '3', name: 'Woodbine, MD', position: [-77.1, 39.3] as [number, number], coverageRadiusKm: 1600, utilization: 82, type: 'standard' as const },
  { id: '4', name: 'Brewster, WA', position: [-119.7, 48.1] as [number, number], coverageRadiusKm: 2200, utilization: 68, type: 'gateway' as const },
  { id: '5', name: 'Paumalu, HI', position: [-158.0, 21.7] as [number, number], coverageRadiusKm: 2500, utilization: 91, type: 'gateway' as const },
  { id: '6', name: 'Napa, CA', position: [-122.3, 38.3] as [number, number], coverageRadiusKm: 1900, utilization: 55, type: 'standard' as const },
  { id: '7', name: 'Atlanta, GA', position: [-84.4, 33.7] as [number, number], coverageRadiusKm: 1700, utilization: 72, type: 'standard' as const },
  { id: '8', name: 'Chicago, IL', position: [-87.6, 41.9] as [number, number], coverageRadiusKm: 1800, utilization: 63, type: 'standard' as const },
];

const CesiumMapInner: React.FC = () => {
  const { viewer, isReady } = useCesiumViewer();
  const [enabledLayers, setEnabledLayers] = useState({
    stations: true,
    coverage: true,
    satellites: false,
    orbits: false,
    maritime: false
  });
  
  // Debug function for coordinate issues
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugCesium = {
        viewer,
        stations: GROUND_STATIONS,
        testCoordinate: (lon: number, lat: number, name: string) => {
          if (!viewer) {
            console.log('Viewer not ready');
            return;
          }
          const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 1000),
            point: {
              pixelSize: 20,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
            },
            label: {
              text: `TEST: ${name}\n[${lon}, ${lat}]`,
              font: '16px sans-serif',
              fillColor: Cesium.Color.YELLOW,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -25)
            }
          });
          
          viewer.scene.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 500000),
            duration: 2
          });
          
          console.log(`Added test marker at [${lon}, ${lat}] - ${name}`);
          return entity;
        },
        logStations: () => {
          console.table(GROUND_STATIONS.map(s => ({
            name: s.name,
            longitude: s.position[0],
            latitude: s.position[1],
            type: s.type
          })));
        }
      };
    }
  }, [viewer]);
  
  // Initialize ground station layers
  const { createDeckLayers } = useGroundStationLayers(viewer, GROUND_STATIONS);
  
  // Handle viewer ready with stability improvements
  const handleViewerReady = useCallback((cesiumViewer: Cesium.Viewer) => {
    if (!cesiumViewer) return;
    
    // Optimize performance - these are safe to call multiple times
    cesiumViewer.scene.requestRenderMode = true;
    cesiumViewer.scene.maximumRenderTimeChange = Infinity;
    cesiumViewer.scene.globe.tileCacheSize = 1000;
    cesiumViewer.scene.globe.maximumScreenSpaceError = 1.5;
    cesiumViewer.shadowMap.size = 2048;
    cesiumViewer.scene.globe.depthTestAgainstTerrain = true;
    cesiumViewer.scene.logarithmicDepthBuffer = true;
    cesiumViewer.scene.farToNearRatio = 1000;
    
    // Wait for initial tiles to load before camera animation
    let initialized = false;
    const initializeCamera = () => {
      if (initialized || cesiumViewer.isDestroyed()) return;
      initialized = true;
      
      try {
        cesiumViewer.scene.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-77.5, 38.5, 2000000), // 2000km altitude
          duration: 3,
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-30), // Less aggressive angle
            roll: 0
          }
        });
      } catch (error) {
        console.warn('Camera initialization failed:', error);
      }
    };
    
    // Listen for tile load completion
    try {
      cesiumViewer.scene.globe.tileLoadProgressEvent.addEventListener((queueLength) => {
        if (queueLength === 0) {
          initializeCamera();
        }
      });
    } catch (error) {
      console.warn('Failed to add tile load listener:', error);
    }
    
    // Fallback initialization after delay
    setTimeout(initializeCamera, 3000);
  }, []);
  
  // Handle layer toggle
  const handleLayerToggle = (layerId: string, enabled: boolean) => {
    setEnabledLayers(prev => ({
      ...prev,
      [layerId]: enabled
    }));
  };
  
  // Create Deck.gl layers based on enabled state
  const deckLayers = React.useMemo(() => {
    const layers = [];
    
    if (enabledLayers.stations || enabledLayers.coverage) {
      layers.push(...createDeckLayers());
    }
    
    return layers;
  }, [enabledLayers, createDeckLayers]);
  
  return (
    <div className="relative w-full h-screen bg-black" suppressHydrationWarning>
      <CesiumGlobe onViewerReady={handleViewerReady}>
        {isReady && (
          <>
            {/* Deck.gl overlay */}
            <CesiumDeckGLOverlay layers={deckLayers} />
            
            {/* UI Controls */}
            <CesiumZoomControl />
            <CesiumLayerControl onLayerToggle={handleLayerToggle} />
            
            {/* Bottom navigation */}
            <BottomNavigation />
            
            {/* Stats bar */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 
                            rounded-full px-4 py-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Stations</span>
                  <span className="text-sm text-white font-medium">{GROUND_STATIONS.length}</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Coverage</span>
                  <span className="text-sm text-white font-medium">Global</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CesiumGlobe>
    </div>
  );
};

// Main component with provider wrapper and error boundary
const CesiumMap: React.FC = () => {
  return (
    <CesiumErrorBoundary>
      <CesiumViewerProvider>
        <CesiumMapInner />
      </CesiumViewerProvider>
    </CesiumErrorBoundary>
  );
};

export default CesiumMap;