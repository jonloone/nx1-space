'use client'

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ZoomLevelControl } from '../Controls/ZoomLevelControl';
import { ImprovedNavigationControl } from '../Controls/NavigationControl';
import { useMapKeyboardControls } from '../../hooks/useMapKeyboardControls';

// Mouse interaction mode selector
const MouseModeSelector: React.FC<{ map: any }> = ({ map }) => {
  const [mode, setMode] = useState<'pan' | 'rotate'>('pan');
  
  const setInteractionMode = (newMode: 'pan' | 'rotate') => {
    if (!map) return;
    
    if (newMode === 'pan') {
      map.dragRotate.disable();
      map.dragPan.enable();
    } else {
      map.dragPan.disable();
      map.dragRotate.enable();
    }
    setMode(newMode);
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="bg-gray-900/90 backdrop-blur-md rounded-lg p-2 
                    border border-gray-700 flex gap-1">
        <button
          onClick={() => setInteractionMode('pan')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center
                   ${mode === 'pan' 
                     ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-600/50' 
                     : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 9l7-7 7 7M5 15l7 7 7-7" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="ml-1">Pan</span>
        </button>
        <button
          onClick={() => setInteractionMode('rotate')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center
                   ${mode === 'rotate' 
                     ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-600/50' 
                     : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" 
                  strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="ml-1">Rotate</span>
        </button>
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="mt-2 bg-gray-900/90 backdrop-blur-md rounded-lg p-2 
                    border border-gray-700 text-xs text-gray-400">
        <div className="font-semibold text-gray-300 mb-1">Keyboard Shortcuts</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div>↑↓←→ Pan</div>
          <div>+/- Zoom</div>
          <div>W/S Tilt</div>
          <div>A/D Rotate</div>
          <div>1-5 Levels</div>
          <div>R Reset</div>
        </div>
      </div>
    </div>
  );
};

const EnhancedMapLibre3D: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Use keyboard controls hook
  useMapKeyboardControls(map.current);
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Create map with BETTER CONTROLS
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          // Terrain elevation data
          terrain: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15
          },
          // DARK satellite imagery (desaturated for dark mode feel)
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19
          },
          // Dark overlay for satellite
          darkOverlay: {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [
          // Satellite base with dark filter
          {
            id: 'satellite-dark',
            type: 'raster',
            source: 'satellite',
            paint: {
              'raster-brightness-min': 0,
              'raster-brightness-max': 0.4,  // Darken satellite imagery
              'raster-contrast': 0.3,         // Increase contrast
              'raster-saturation': -0.5       // Desaturate for dark theme
            }
          },
          // Hillshade for 3D effect
          {
            id: 'hillshade',
            type: 'hillshade',
            source: 'terrain',
            paint: {
              'hillshade-exaggeration': 0.5,
              'hillshade-shadow-color': '#000000',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': '#1a365d',
              'hillshade-illumination-direction': 335,
              'hillshade-illumination-anchor': 'viewport'
            }
          },
          // Dark labels overlay
          {
            id: 'dark-labels',
            type: 'raster',
            source: 'darkOverlay',
            paint: {
              'raster-opacity': 0.8
            }
          }
        ]
      },
      center: [-77.5, 38.5],
      zoom: 7,
      pitch: 45,
      bearing: 0,
      antialias: true,
      // IMPORTANT: Better interaction settings
      dragRotate: true,
      touchZoomRotate: true,
      doubleClickZoom: true,
      keyboard: true,
      // Reduced sensitivity
      dragPan: {
        inertia: 10,
        deceleration: 3000
      },
      touchPitch: {
        inertia: 10
      }
    });
    
    // Configure better controls
    map.current.on('load', () => {
      // Add 3D terrain
      map.current!.setTerrain({
        source: 'terrain',
        exaggeration: 1.5
      });
      
      // Dark atmosphere
      map.current!.setFog({
        color: '#0a0f1b',
        'high-color': '#050a15',
        'horizon-blend': 0.1,
        'space-color': '#000000',
        'star-intensity': 0.9
      });
      
      // Disable default controls to add custom ones
      map.current!.scrollZoom.setWheelZoomRate(1 / 450); // Slower zoom
      map.current!.scrollZoom.setZoomRate(1 / 100);      // Slower trackpad
      
      // Better rotation settings
      map.current!.dragRotate.setInertia(20);
      map.current!.touchZoomRotate.setInertia(10);
      
      setMapLoaded(true);
    });
    
    return () => map.current?.remove();
  }, []);
  
  return (
    <div className="relative w-full h-full bg-black">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Enhanced Controls */}
      {mapLoaded && map.current && (
        <>
          {/* Zoom Level Control */}
          <ZoomLevelControl map={map.current} />
          
          {/* Navigation Control */}
          <ImprovedNavigationControl map={map.current} />
          
          {/* Mouse Mode Selector */}
          <MouseModeSelector map={map.current} />
        </>
      )}
    </div>
  );
};

export default EnhancedMapLibre3D;