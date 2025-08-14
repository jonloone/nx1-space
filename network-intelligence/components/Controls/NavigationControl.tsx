import React, { useRef, useState } from 'react';

export const ImprovedNavigationControl: React.FC<{ map: any }> = ({ map }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startBearing = useRef(0);
  const startPitch = useRef(0);
  
  // Compass/Rotation Control
  const handleRotateStart = (e: React.MouseEvent) => {
    if (!map) return;
    setIsRotating(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startBearing.current = map.getBearing();
    e.preventDefault();
  };
  
  const handleRotateMove = (e: MouseEvent) => {
    if (!isRotating || !map) return;
    
    const deltaX = e.clientX - startPos.current.x;
    // Reduced sensitivity (0.3 instead of 1.0)
    const newBearing = startBearing.current - deltaX * 0.3;
    
    map.setBearing(newBearing);
  };
  
  const handleRotateEnd = () => {
    setIsRotating(false);
  };
  
  // Tilt Control
  const handleTiltChange = (value: number) => {
    if (!map) return;
    map.setPitch(value);
  };
  
  // Reset controls
  const resetView = () => {
    if (!map) return;
    map.flyTo({
      bearing: 0,
      pitch: 0,
      duration: 1000
    });
  };
  
  React.useEffect(() => {
    if (isRotating) {
      document.addEventListener('mousemove', handleRotateMove);
      document.addEventListener('mouseup', handleRotateEnd);
      return () => {
        document.removeEventListener('mousemove', handleRotateMove);
        document.removeEventListener('mouseup', handleRotateEnd);
      };
    }
  }, [isRotating]);
  
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30">
      <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700 p-3">
        
        {/* Compass */}
        <div className="relative w-24 h-24 mb-3">
          <div
            className="absolute inset-0 rounded-full bg-gray-800 border-2 border-gray-700
                     cursor-grab active:cursor-grabbing"
            onMouseDown={handleRotateStart}
          >
            {/* North indicator */}
            <div
              className="absolute top-1 left-1/2 -translate-x-1/2 text-red-500 font-bold text-sm"
              style={{
                transform: `translateX(-50%) rotate(${map?.getBearing() || 0}deg)`
              }}
            >
              N
            </div>
            
            {/* Compass rose */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="1"/>
              <line x1="50" y1="5" x2="50" y2="15" stroke="#fff" strokeWidth="2"
                    transform={`rotate(${map?.getBearing() || 0} 50 50)`}/>
              <line x1="50" y1="85" x2="50" y2="95" stroke="#6b7280" strokeWidth="1"
                    transform={`rotate(${map?.getBearing() || 0} 50 50)`}/>
              <line x1="5" y1="50" x2="15" y2="50" stroke="#6b7280" strokeWidth="1"
                    transform={`rotate(${map?.getBearing() || 0} 50 50)`}/>
              <line x1="85" y1="50" x2="95" y2="50" stroke="#6b7280" strokeWidth="1"
                    transform={`rotate(${map?.getBearing() || 0} 50 50)`}/>
            </svg>
          </div>
          
          {/* Center reset button */}
          <button
            onClick={resetView}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600
                     flex items-center justify-center text-white transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        {/* Tilt Control */}
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Tilt</div>
          <input
            type="range"
            min="0"
            max="85"
            value={map?.getPitch() || 0}
            onChange={(e) => handleTiltChange(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2D</span>
            <span>{Math.round(map?.getPitch() || 0)}°</span>
            <span>3D</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => map?.flyTo({ pitch: 0, duration: 500 })}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded
                     text-white transition-all"
          >
            Top View
          </button>
          <button
            onClick={() => map?.flyTo({ pitch: 60, duration: 500 })}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded
                     text-white transition-all"
          >
            3D View
          </button>
          <button
            onClick={() => map?.flyTo({ bearing: 0, duration: 500 })}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded
                     text-white transition-all"
          >
            North
          </button>
          <button
            onClick={resetView}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded
                     text-white transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};