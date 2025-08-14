'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Deck } from '@deck.gl/core';
import * as Cesium from 'cesium';
import { useSafeViewer } from '../../contexts/CesiumViewerContext';

interface CesiumDeckGLOverlayProps {
  layers: any[];
}

export const CesiumDeckGLOverlay: React.FC<CesiumDeckGLOverlayProps> = ({ 
  layers 
}) => {
  const { viewer, isReady, safeAccess } = useSafeViewer();
  const deckCanvasRef = useRef<HTMLCanvasElement>(null);
  const deckRef = useRef<Deck | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0
  });

  // Convert Cesium camera to Deck.gl view state
  const syncCameraWithDeck = () => {
    const camera = safeAccess(v => v.camera);
    if (!camera) return;
    const cartographic = camera.positionCartographic;
    
    // Get camera position
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;
    
    // Convert height to zoom level (approximate)
    const zoom = Math.max(0, Math.min(24, 
      Math.log2(40000000 / height)
    ));
    
    // Get camera orientation
    const pitch = Cesium.Math.toDegrees(camera.pitch) + 90;
    const bearing = Cesium.Math.toDegrees(camera.heading);
    
    setViewState({
      longitude,
      latitude,
      zoom,
      pitch,
      bearing
    });
  };

  // Initialize Deck.gl
  useEffect(() => {
    if (!deckCanvasRef.current || !isReady || !viewer) return;

    deckRef.current = new Deck({
      canvas: deckCanvasRef.current,
      width: '100%',
      height: '100%',
      controller: false, // Let Cesium control the camera
      
      viewState,
      
      onWebGLInitialized: (gl) => {
        // Ensure transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      },
      
      layers
    });

    // Sync camera on Cesium camera change
    try {
      viewer.camera.changed.addEventListener(syncCameraWithDeck);
      viewer.camera.moveEnd.addEventListener(syncCameraWithDeck);
      
      // Initial sync
      syncCameraWithDeck();
    } catch (error) {
      console.warn('Failed to setup camera sync:', error);
    }

    return () => {
      try {
        if (viewer && viewer.camera && !viewer.isDestroyed()) {
          viewer.camera.changed.removeEventListener(syncCameraWithDeck);
          viewer.camera.moveEnd.removeEventListener(syncCameraWithDeck);
        }
      } catch (error) {
        console.warn('Failed to cleanup camera sync:', error);
      }
      deckRef.current?.finalize();
    };
  }, [viewer, isReady]);

  // Update Deck.gl when view state changes
  useEffect(() => {
    if (deckRef.current) {
      deckRef.current.setProps({ viewState });
    }
  }, [viewState]);

  // Update layers
  useEffect(() => {
    if (deckRef.current) {
      deckRef.current.setProps({ layers });
    }
  }, [layers]);

  // Don't render until viewer is ready
  if (!isReady) {
    return null;
  }

  return (
    <canvas
      ref={deckCanvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Let Cesium handle interactions
        zIndex: 10
      }}
    />
  );
};