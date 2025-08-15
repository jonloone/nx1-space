'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';

export function LayersPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['base']));
  const { layers, toggleLayer, domain } = useMapStore();
  
  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };
  
  const getDomainLayers = () => {
    switch (domain) {
      case 'ground-stations':
        return [
          { id: 'stations', name: 'Ground Stations' },
          { id: 'footprints', name: 'Satellite Footprints' },
          { id: 'coverage', name: 'Coverage Analysis' },
        ];
      case 'maritime':
        return [
          { id: 'vessels', name: 'Vessels' },
          { id: 'density', name: 'Traffic Density' },
          { id: 'tracks', name: 'Vessel Tracks' },
          { id: 'ports', name: 'Ports' },
          { id: 'risk', name: 'Risk Zones' },
        ];
      default:
        return [];
    }
  };
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 glass rounded-lg flex items-center justify-center
                   hover:bg-white/10 transition-all"
      >
        <Layers className="w-5 h-5 text-white/70" />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-12 right-0 w-72 glass rounded-lg overflow-hidden"
          >
            <div className="p-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Layers</h3>
            </div>
            
            <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
              {/* Base Layers */}
              <div>
                <button
                  onClick={() => toggleGroup('base')}
                  className="w-full flex items-center gap-2 py-1 text-sm text-white/70 hover:text-white"
                >
                  {expandedGroups.has('base') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  Base Map
                </button>
                {expandedGroups.has('base') && (
                  <div className="ml-6 mt-2 space-y-2">
                    <LayerToggle
                      name="Satellite"
                      enabled={layers.base.satellite}
                      onToggle={() => toggleLayer('base', 'satellite')}
                    />
                    <LayerToggle
                      name="Terrain"
                      enabled={layers.base.terrain}
                      onToggle={() => toggleLayer('base', 'terrain')}
                    />
                    <LayerToggle
                      name="Labels"
                      enabled={layers.base.labels}
                      onToggle={() => toggleLayer('base', 'labels')}
                    />
                  </div>
                )}
              </div>
              
              {/* Domain Layers */}
              <div>
                <button
                  onClick={() => toggleGroup('data')}
                  className="w-full flex items-center gap-2 py-1 text-sm text-white/70 hover:text-white"
                >
                  {expandedGroups.has('data') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  Data Layers
                </button>
                {expandedGroups.has('data') && (
                  <div className="ml-6 mt-2 space-y-2">
                    {getDomainLayers().map(layer => (
                      <LayerToggle
                        key={layer.id}
                        name={layer.name}
                        enabled={layers.data.get(layer.id) || false}
                        onToggle={() => toggleLayer('data', layer.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Analysis Layers */}
              <div>
                <button
                  onClick={() => toggleGroup('analysis')}
                  className="w-full flex items-center gap-2 py-1 text-sm text-white/70 hover:text-white"
                >
                  {expandedGroups.has('analysis') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  Analysis
                </button>
                {expandedGroups.has('analysis') && (
                  <div className="ml-6 mt-2 space-y-2">
                    <LayerToggle
                      name="Heatmap"
                      enabled={layers.analysis.get('heatmap') || false}
                      onToggle={() => toggleLayer('analysis', 'heatmap')}
                    />
                    <LayerToggle
                      name="Clusters"
                      enabled={layers.analysis.get('clusters') || false}
                      onToggle={() => toggleLayer('analysis', 'clusters')}
                    />
                    <LayerToggle
                      name="Hexagons"
                      enabled={layers.analysis.get('hexagons') || false}
                      onToggle={() => toggleLayer('analysis', 'hexagons')}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LayerToggle({ name, enabled, onToggle }: { 
  name: string; 
  enabled: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-1.5 px-2 rounded
                 hover:bg-white/5 transition-colors group"
    >
      <span className={`text-sm ${enabled ? 'text-white' : 'text-white/50'}`}>
        {name}
      </span>
      {enabled ? (
        <Eye className="w-4 h-4 text-geo-blue" />
      ) : (
        <EyeOff className="w-4 h-4 text-white/30" />
      )}
    </button>
  );
}