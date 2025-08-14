import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ZoomLevel {
  name: string;
  zoom: number;
  pitch: number;
  description: string;
  icon: string;
}

const ZOOM_LEVELS: ZoomLevel[] = [
  { name: 'Space', zoom: 1, pitch: 0, description: 'Full Earth', icon: '🌍' },
  { name: 'Continental', zoom: 3, pitch: 0, description: 'Continents', icon: '🗺️' },
  { name: 'Regional', zoom: 5, pitch: 30, description: 'Countries', icon: '🏳️' },
  { name: 'State', zoom: 7, pitch: 45, description: 'States/Provinces', icon: '📍' },
  { name: 'Local', zoom: 9, pitch: 60, description: 'Cities', icon: '🏙️' },
  { name: 'Terrain', zoom: 11, pitch: 75, description: 'Detailed Terrain', icon: '⛰️' }
];

export const ZoomLevelControl: React.FC<{ map: any }> = ({ map }) => {
  const [currentLevel, setCurrentLevel] = useState(2);
  const [currentZoom, setCurrentZoom] = useState(5);
  
  useEffect(() => {
    if (!map) return;
    
    const updateZoom = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      
      // Find closest zoom level
      let closestLevel = 0;
      let minDiff = Math.abs(zoom - ZOOM_LEVELS[0].zoom);
      
      ZOOM_LEVELS.forEach((level, index) => {
        const diff = Math.abs(zoom - level.zoom);
        if (diff < minDiff) {
          minDiff = diff;
          closestLevel = index;
        }
      });
      
      setCurrentLevel(closestLevel);
    };
    
    map.on('zoom', updateZoom);
    updateZoom();
    
    return () => {
      map.off('zoom', updateZoom);
    };
  }, [map]);
  
  const handleZoomTo = (level: number) => {
    const zoomLevel = ZOOM_LEVELS[level];
    map.flyTo({
      zoom: zoomLevel.zoom,
      pitch: zoomLevel.pitch,
      duration: 1500,
      essential: true
    });
    setCurrentLevel(level);
  };
  
  const handleZoomIn = () => {
    const newLevel = Math.min(currentLevel + 1, ZOOM_LEVELS.length - 1);
    handleZoomTo(newLevel);
  };
  
  const handleZoomOut = () => {
    const newLevel = Math.max(currentLevel - 1, 0);
    handleZoomTo(newLevel);
  };
  
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30">
      <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700 p-2">
        
        {/* Zoom In Button */}
        <button
          onClick={handleZoomIn}
          disabled={currentLevel >= ZOOM_LEVELS.length - 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg
                   bg-gray-800 hover:bg-gray-700 text-white
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all mb-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        {/* Zoom Level Indicator */}
        <div className="relative h-48 w-10 bg-gray-800 rounded-lg mb-1">
          {/* Level markers */}
          {ZOOM_LEVELS.map((level, index) => (
            <div
              key={level.name}
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{ 
                top: `${(index / (ZOOM_LEVELS.length - 1)) * 100}%`,
                transform: 'translateY(-50%)'
              }}
            >
              {/* Tick mark */}
              <div className={`absolute left-0 w-2 h-0.5 bg-gray-600`} />
              
              {/* Level dot */}
              <button
                onClick={() => handleZoomTo(index)}
                className={`relative z-10 w-4 h-4 rounded-full transition-all
                         ${index === currentLevel 
                           ? 'bg-cyan-500 scale-125' 
                           : 'bg-gray-600 hover:bg-gray-500'}`}
              />
              
              {/* Level label on hover */}
              <div className="absolute left-12 whitespace-nowrap opacity-0 hover:opacity-100
                            pointer-events-none transition-opacity">
                <div className="bg-gray-800 px-2 py-1 rounded text-xs text-white">
                  {level.icon} {level.name}
                </div>
              </div>
            </div>
          ))}
          
          {/* Current position slider */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-6 h-2 
                     bg-cyan-500 rounded-full"
            animate={{
              top: `${(currentZoom - ZOOM_LEVELS[0].zoom) / 
                     (ZOOM_LEVELS[ZOOM_LEVELS.length - 1].zoom - ZOOM_LEVELS[0].zoom) * 100}%`
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        
        {/* Zoom Out Button */}
        <button
          onClick={handleZoomOut}
          disabled={currentLevel <= 0}
          className="w-10 h-10 flex items-center justify-center rounded-lg
                   bg-gray-800 hover:bg-gray-700 text-white
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all mb-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        {/* Reset View */}
        <button
          onClick={() => handleZoomTo(2)} // Regional view
          className="w-10 h-10 flex items-center justify-center rounded-lg
                   bg-gray-800 hover:bg-gray-700 text-white transition-all"
          title="Reset View"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
                  strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 13a5 5 0 0 1 7.54.54l3-3a5 5 0 0 1-7.07-7.07l-1.71 1.71" 
                  strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      
      {/* Current Level Display */}
      <div className="mt-2 bg-gray-900/90 backdrop-blur-md rounded-lg px-3 py-2 
                    border border-gray-700">
        <div className="text-xs text-gray-400">View Level</div>
        <div className="text-sm font-medium text-white flex items-center gap-1">
          <span>{ZOOM_LEVELS[currentLevel].icon}</span>
          <span>{ZOOM_LEVELS[currentLevel].name}</span>
        </div>
        <div className="text-xs text-gray-500">
          {ZOOM_LEVELS[currentLevel].description}
        </div>
      </div>
    </div>
  );
};