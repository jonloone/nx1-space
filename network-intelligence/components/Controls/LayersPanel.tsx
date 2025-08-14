import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Layer {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  category: 'data' | 'analysis';
}

interface LayersPanelProps {
  onLayerToggle: (layerId: string) => void;
  onTerrainToggle: (enabled: boolean) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ 
  onLayerToggle, 
  onTerrainToggle 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [layers, setLayers] = useState<Layer[]>([
    // Data layers
    { id: 'stations', name: 'Ground Stations', icon: 'fa-satellite-dish', enabled: true, category: 'data' },
    { id: 'coverage', name: 'Coverage', icon: 'fa-signal', enabled: true, category: 'data' },
    { id: 'satellites', name: 'Satellites', icon: 'fa-satellite', enabled: false, category: 'data' },
    { id: 'connections', name: 'Network Links', icon: 'fa-link', enabled: false, category: 'data' },
    
    // Analysis layers
    { id: 'utilization', name: 'Utilization', icon: 'fa-chart-line', enabled: true, category: 'analysis' },
    { id: 'opportunities', name: 'Opportunities', icon: 'fa-lightbulb', enabled: false, category: 'analysis' },
    { id: 'maritime', name: 'Maritime', icon: 'fa-ship', enabled: false, category: 'analysis' },
    { id: 'datacenter', name: 'Data Centers', icon: 'fa-server', enabled: false, category: 'analysis' },
    { id: 'telecom', name: 'Telecom', icon: 'fa-tower-cell', enabled: false, category: 'analysis' },
    { id: 'financial', name: 'Financial', icon: 'fa-dollar-sign', enabled: false, category: 'analysis' }
  ]);
  
  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
    onLayerToggle(layerId);
  };
  
  const handleTerrainToggle = () => {
    setTerrainEnabled(!terrainEnabled);
    onTerrainToggle(!terrainEnabled);
  };
  
  const activeLayerCount = layers.filter(l => l.enabled).length;
  
  return (
    <>
      {/* Collapsed Button */}
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
      
      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-4 top-20 z-30 w-64 bg-black/80 backdrop-blur-xl 
                     border border-white/10 rounded-xl"
          >
            {/* Header */}
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
            
            {/* 3D Terrain Toggle */}
            <div className="p-3 border-b border-white/10">
              <button
                onClick={handleTerrainToggle}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                         transition-all ${terrainEnabled 
                           ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                           : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                aria-label="Toggle 3D terrain"
              >
                <span className="flex items-center gap-2 text-sm">
                  <i className="fas fa-mountain"></i>
                  <span>3D Terrain</span>
                </span>
                <div className={`w-8 h-4 rounded-full transition-all
                              ${terrainEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-all mt-0.5
                                ${terrainEnabled ? 'ml-4' : 'ml-0.5'}`} />
                </div>
              </button>
            </div>
            
            {/* Layer List */}
            <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
              {/* Data Layers */}
              <div>
                <div className="text-xs text-gray-400 mb-2">Data</div>
                <div className="space-y-1">
                  {layers.filter(l => l.category === 'data').map(layer => (
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
              </div>
              
              {/* Analysis Layers */}
              <div>
                <div className="text-xs text-gray-400 mb-2">Analysis</div>
                <div className="space-y-1">
                  {layers.filter(l => l.category === 'analysis').map(layer => (
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};