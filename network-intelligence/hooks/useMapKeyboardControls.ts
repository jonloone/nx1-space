import { useEffect } from 'react';

export const useMapKeyboardControls = (map: any) => {
  useEffect(() => {
    if (!map) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default browser behavior
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      const step = e.shiftKey ? 10 : 5; // Larger steps with shift
      
      switch(e.key) {
        // Pan controls
        case 'ArrowUp':
          map.panBy([0, -50], { duration: 100 });
          break;
        case 'ArrowDown':
          map.panBy([0, 50], { duration: 100 });
          break;
        case 'ArrowLeft':
          map.panBy([-50, 0], { duration: 100 });
          break;
        case 'ArrowRight':
          map.panBy([50, 0], { duration: 100 });
          break;
          
        // Zoom controls
        case '+':
        case '=':
          map.zoomIn({ duration: 200 });
          break;
        case '-':
        case '_':
          map.zoomOut({ duration: 200 });
          break;
          
        // Rotation controls
        case 'a':
        case 'A':
          map.setBearing(map.getBearing() - step);
          break;
        case 'd':
        case 'D':
          map.setBearing(map.getBearing() + step);
          break;
          
        // Pitch controls
        case 'w':
        case 'W':
          map.setPitch(Math.min(85, map.getPitch() + step));
          break;
        case 's':
        case 'S':
          map.setPitch(Math.max(0, map.getPitch() - step));
          break;
          
        // Reset view
        case 'r':
        case 'R':
          map.flyTo({
            center: [-77.5, 38.5],
            zoom: 7,
            pitch: 45,
            bearing: 0,
            duration: 1000
          });
          break;
          
        // Number keys for zoom levels
        case '1':
          map.flyTo({ zoom: 3, duration: 500 }); // Continental
          break;
        case '2':
          map.flyTo({ zoom: 5, duration: 500 }); // Regional
          break;
        case '3':
          map.flyTo({ zoom: 7, duration: 500 }); // State
          break;
        case '4':
          map.flyTo({ zoom: 9, duration: 500 }); // Local
          break;
        case '5':
          map.flyTo({ zoom: 11, duration: 500 }); // Terrain
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [map]);
};