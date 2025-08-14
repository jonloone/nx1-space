import React from 'react';

interface ZoomControlProps {
  map: any;
}

export const SimpleZoomControl: React.FC<ZoomControlProps> = ({ map }) => {
  const [zoom, setZoom] = React.useState(7);
  
  React.useEffect(() => {
    if (!map) return;
    
    const handleZoom = () => setZoom(Math.round(map.getZoom()));
    map.on('zoom', handleZoom);
    
    return () => {
      map.off('zoom', handleZoom);
    };
  }, [map]);
  
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-1">
        {/* Zoom In */}
        <button
          onClick={() => map?.zoomIn()}
          className="w-10 h-10 flex items-center justify-center text-white/70 
                   hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Zoom in"
        >
          <i className="fas fa-plus text-sm"></i>
        </button>
        
        {/* Zoom Level Display */}
        <div className="w-10 h-8 flex items-center justify-center text-white/60 text-xs font-medium">
          {zoom}
        </div>
        
        {/* Zoom Out */}
        <button
          onClick={() => map?.zoomOut()}
          className="w-10 h-10 flex items-center justify-center text-white/70 
                   hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Zoom out"
        >
          <i className="fas fa-minus text-sm"></i>
        </button>
        
        <div className="w-full h-px bg-white/10 my-1" />
        
        {/* Reset */}
        <button
          onClick={() => map?.flyTo({ center: [-77.5, 38.5], zoom: 7, pitch: 45, bearing: 0 })}
          className="w-10 h-10 flex items-center justify-center text-white/70 
                   hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Reset view"
        >
          <i className="fas fa-home text-sm"></i>
        </button>
      </div>
    </div>
  );
};