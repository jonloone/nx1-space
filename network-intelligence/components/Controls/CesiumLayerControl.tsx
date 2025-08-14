'use client'

import React, { useState } from 'react';
import * as Cesium from 'cesium';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafeViewer } from '../../contexts/CesiumViewerContext';

interface CesiumLayerControlProps {
  onLayerToggle: (layerId: string, enabled: boolean) => void;
}

export const CesiumLayerControl: React.FC<CesiumLayerControlProps> = ({ 
  onLayerToggle 
}) => {
  const { viewer, isReady, safeAccess } = useSafeViewer();
  const [isOpen, setIsOpen] = useState(false);
  const [layers, setLayers] = useState([
    { id: 'terrain', name: '3D Terrain', icon: 'fa-mountain', enabled: true },
    { id: 'atmosphere', name: 'Atmosphere', icon: 'fa-cloud', enabled: true },
    { id: 'lighting', name: 'Sun Lighting', icon: 'fa-sun', enabled: false },
    { id: 'stations', name: 'Ground Stations', icon: 'fa-satellite-dish', enabled: true },
    { id: 'coverage', name: 'Coverage Areas', icon: 'fa-signal', enabled: true },
    { id: 'satellites', name: 'Satellites', icon: 'fa-satellite', enabled: false },
    { id: 'orbits', name: 'Orbital Paths', icon: 'fa-globe', enabled: false },
    { id: 'maritime', name: 'Maritime Traffic', icon: 'fa-ship', enabled: false }
  ]);
  
  const toggleLayer = (layerId: string) => {
    if (!isReady) return;
    
    setLayers(prev => {
      const newLayers = prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, enabled: !layer.enabled }
          : layer
      );
      
      const layer = newLayers.find(l => l.id === layerId);
      if (layer) {
        // Handle Cesium-specific layers
        switch (layerId) {
          case 'terrain':
            safeAccess(v => {
              if (layer.enabled) {
                v.terrainProvider = Cesium.Terrain.fromWorldTerrain();
              } else {
                v.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
              }
              return true;
            });
            break;
            
          case 'atmosphere':
            safeAccess(v => {
              v.scene.skyAtmosphere.show = layer.enabled;
              v.scene.globe.showGroundAtmosphere = layer.enabled;
              return true;
            });
            break;
            
          case 'lighting':
            safeAccess(v => {
              v.scene.globe.enableLighting = layer.enabled;
              return true;
            });
            break;
        }
        
        // Notify parent for Deck.gl layers
        onLayerToggle(layerId, layer.enabled);
      }
      
      return newLayers;
    });
  };
  
  const activeLayerCount = layers.filter(l => l.enabled).length;
  
  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-20 z-30 w-10 h-10 bg-black/80 backdrop-blur-xl 
                   border border-white/10 rounded-lg flex items-center justify-center 
                   text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Open layers panel"
        >
          <i className="fas fa-layer-group"></i>
          {activeLayerCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] 
                          rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {activeLayerCount}
            </div>
          )}
        </button>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-4 top-20 z-30 w-64 bg-black/80 backdrop-blur-xl 
                     border border-white/10 rounded-xl"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-white text-sm font-medium">Layers</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Close layers panel"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            
            <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto">
              {layers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg
                           text-sm transition-all ${layer.enabled 
                             ? 'bg-white/10 text-white' 
                             : 'text-gray-400 hover:bg-white/5'}`}
                  aria-label={`Toggle ${layer.name}`}
                >
                  <span className="flex items-center gap-2">
                    <i className={`fas ${layer.icon} text-xs w-4`}></i>
                    <span className="text-xs">{layer.name}</span>
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 transition-all
                                ${layer.enabled 
                                  ? 'bg-blue-500 border-blue-500' 
                                  : 'border-gray-600'}`}>
                    {layer.enabled && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};