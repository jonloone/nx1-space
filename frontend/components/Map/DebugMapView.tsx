'use client';

import React, { useEffect, useState } from 'react';

export const DebugMapView: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({
    mounted: false,
    windowAvailable: false,
    deckGLAvailable: false,
    maplibreAvailable: false,
    pmtilesAvailable: false,
    errors: []
  });

  useEffect(() => {
    const info: any = {
      mounted: true,
      windowAvailable: typeof window !== 'undefined',
      deckGLAvailable: false,
      maplibreAvailable: false,
      pmtilesAvailable: false,
      errors: []
    };

    // Check for dependencies
    try {
      // Check if window is available
      if (typeof window !== 'undefined') {
        info.windowObject = {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          location: window.location.href
        };
      }

      // Check for DeckGL
      import('@deck.gl/react').then(() => {
        info.deckGLAvailable = true;
        setDebugInfo({...info});
      }).catch(e => {
        info.errors.push(`DeckGL import error: ${e.message}`);
        setDebugInfo({...info});
      });

      // Check for MapLibre
      import('maplibre-gl').then(() => {
        info.maplibreAvailable = true;
        setDebugInfo({...info});
      }).catch(e => {
        info.errors.push(`MapLibre import error: ${e.message}`);
        setDebugInfo({...info});
      });

      // Check for PMTiles
      import('pmtiles').then(() => {
        info.pmtilesAvailable = true;
        setDebugInfo({...info});
      }).catch(e => {
        info.errors.push(`PMTiles import error: ${e.message}`);
        setDebugInfo({...info});
      });

      setDebugInfo(info);
    } catch (error: any) {
      info.errors.push(`Setup error: ${error.message}`);
      setDebugInfo(info);
    }

    // Test simple map initialization
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        import('maplibre-gl').then((maplibregl) => {
          try {
            const testDiv = document.createElement('div');
            testDiv.style.width = '100px';
            testDiv.style.height = '100px';
            testDiv.style.position = 'absolute';
            testDiv.style.visibility = 'hidden';
            document.body.appendChild(testDiv);

            const map = new maplibregl.Map({
              container: testDiv,
              style: {
                version: 8,
                sources: {},
                layers: [{
                  id: 'background',
                  type: 'background',
                  paint: { 'background-color': '#000' }
                }]
              }
            });

            map.on('load', () => {
              setDebugInfo(prev => ({
                ...prev,
                mapInitSuccess: true
              }));
              map.remove();
              document.body.removeChild(testDiv);
            });

            map.on('error', (e) => {
              setDebugInfo(prev => ({
                ...prev,
                errors: [...prev.errors, `Map init error: ${e.error.message}`]
              }));
              document.body.removeChild(testDiv);
            });
          } catch (e: any) {
            setDebugInfo(prev => ({
              ...prev,
              errors: [...prev.errors, `Map creation error: ${e.message}`]
            }));
          }
        });
      }
    }, 1000);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '400px',
      zIndex: 10000,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Map Debug Info</h3>
      <pre style={{ margin: 0 }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};