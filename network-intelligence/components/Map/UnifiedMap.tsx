'use client'

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SimpleZoomControl } from '../Controls/SimpleZoomControl';
import { LayersPanel } from '../Controls/LayersPanel';
import { BottomNavigation } from '../navigation/BottomNavigation';

const UnifiedMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Single unified map - satellite with optional 3D terrain
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          // Terrain elevation
          terrain: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15
          },
          // Satellite base map
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 19
          }
        },
        layers: [
          {
            id: 'satellite-base',
            type: 'raster',
            source: 'satellite'
          }
        ]
      },
      center: [-77.5, 38.5],
      zoom: 7,
      pitch: 45,
      bearing: 0,
      antialias: true
    });
    
    map.current.on('load', () => {
      // Add 3D terrain by default
      if (terrainEnabled) {
        map.current!.setTerrain({
          source: 'terrain',
          exaggeration: 1.5
        });
      }
      
      // Add atmosphere
      map.current!.setFog({
        color: '#c0c0d0',
        'horizon-blend': 0.05
      });
      
      setMapLoaded(true);
    });
    
    return () => map.current?.remove();
  }, []);
  
  // Handle terrain toggle
  const handleTerrainToggle = (enabled: boolean) => {
    if (!map.current) return;
    
    if (enabled) {
      map.current.setTerrain({
        source: 'terrain',
        exaggeration: 1.5
      });
      map.current.setPitch(45);
    } else {
      map.current.setTerrain(null);
      map.current.setPitch(0);
    }
    setTerrainEnabled(enabled);
  };
  
  // Handle layer toggle
  const handleLayerToggle = (layerId: string) => {
    // Update deck.gl layers or map layers based on layerId
    console.log('Toggle layer:', layerId);
  };
  
  return (
    <div className="relative w-full h-screen bg-black">
      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Simple Zoom Controls - Left */}
      {mapLoaded && (
        <SimpleZoomControl map={map.current} />
      )}
      
      {/* Layers Panel - Right */}
      <LayersPanel 
        onLayerToggle={handleLayerToggle}
        onTerrainToggle={handleTerrainToggle}
      />
      
      {/* Main Navigation - Bottom */}
      <BottomNavigation />
      
      {/* Quick Stats - Top */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 
                      rounded-full px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Stations</span>
            <span className="text-sm text-white font-medium">32</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Utilization</span>
            <span className="text-sm text-white font-medium">68%</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Revenue</span>
            <span className="text-sm text-white font-medium">$93M</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMap;