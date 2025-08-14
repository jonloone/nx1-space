'use client'

import React from 'react';
import * as Cesium from 'cesium';
import { useSafeViewer } from '../../contexts/CesiumViewerContext';

export const CesiumZoomControl: React.FC = () => {
  const { viewer, isReady, safeAccess } = useSafeViewer();
  const [altitude, setAltitude] = React.useState(5000000);
  const [sceneMode, setSceneMode] = React.useState<'3D' | '2D'>('3D');
  
  React.useEffect(() => {
    if (!isReady || !viewer) return;
    
    const updateAltitude = () => {
      const height = safeAccess(v => v.camera.positionCartographic.height);
      if (height !== null) {
        setAltitude(height);
      }
    };
    
    // Safe event listener attachment
    try {
      viewer.camera.changed.addEventListener(updateAltitude);
      updateAltitude(); // Initial update
    } catch (error) {
      console.warn('Failed to attach camera listener:', error);
      return;
    }
    
    return () => {
      try {
        if (viewer && !viewer.isDestroyed() && viewer.camera) {
          viewer.camera.changed.removeEventListener(updateAltitude);
        }
      } catch (error) {
        console.warn('Failed to remove camera listener:', error);
      }
    };
  }, [viewer, isReady, safeAccess]);
  
  const zoomIn = () => {
    safeAccess(v => {
      v.camera.zoomIn(altitude * 0.3);
      return true;
    });
  };
  
  const zoomOut = () => {
    safeAccess(v => {
      v.camera.zoomOut(altitude * 0.3);
      return true;
    });
  };
  
  const resetView = () => {
    safeAccess(v => {
      v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-77.5, 38.5, 5000000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-45),
          roll: 0
        }
      });
      return true;
    });
  };
  
  const toggleSceneMode = () => {
    const success = safeAccess(v => {
      if (sceneMode === '3D') {
        v.scene.mode = Cesium.SceneMode.SCENE2D;
        return '2D';
      } else {
        v.scene.mode = Cesium.SceneMode.SCENE3D;
        return '3D';
      }
    });
    
    if (success) {
      setSceneMode(success);
    }
  };
  
  const formatAltitude = (height: number): string => {
    if (height > 1000000) {
      return `${(height / 1000000).toFixed(1)}M km`;
    } else if (height > 1000) {
      return `${(height / 1000).toFixed(0)} km`;
    }
    return `${height.toFixed(0)} m`;
  };
  
  // Don't render if viewer isn't ready
  if (!isReady) {
    return null;
  }

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-1">
        <button
          onClick={zoomIn}
          className="w-10 h-10 flex items-center justify-center text-white/70 
                   hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Zoom in"
        >
          <i className="fas fa-plus text-sm"></i>
        </button>
        
        <div className="w-10 h-8 flex items-center justify-center">
          <span className="text-[10px] text-white/60 text-center">
            {formatAltitude(altitude)}
          </span>
        </div>
        
        <button
          onClick={zoomOut}
          className="w-10 h-10 flex items-center justify-center text-white/70 
                   hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Zoom out"
        >
          <i className="fas fa-minus text-sm"></i>
        </button>
        
        <div className="w-full h-px bg-white/10 my-1" />
        
        <button
          onClick={resetView}
          className="w-10 h-10 flex items-center justify-center text-white/70 
                   hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Reset view"
        >
          <i className="fas fa-home text-sm"></i>
        </button>
        
        <button
          onClick={toggleSceneMode}
          className="w-10 h-10 flex items-center justify-center text-white/70 
                   hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="Toggle 2D/3D"
        >
          {sceneMode === '3D' ? 
            <i className="fas fa-globe text-sm"></i> : 
            <i className="fas fa-map text-sm"></i>
          }
        </button>
      </div>
    </div>
  );
};