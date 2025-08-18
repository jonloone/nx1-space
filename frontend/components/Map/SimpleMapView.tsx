'use client';

import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export const SimpleMapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      setStatus('Creating map instance...');
      
      // Create a simple map with OSM tiles
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: { 'background-color': '#0a0a0f' }
            },
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              paint: {
                'raster-opacity': 0.7
              }
            }
          ]
        },
        center: [-118.2437, 34.0522], // Los Angeles
        zoom: 10
      });

      map.current.on('load', () => {
        setStatus('Map loaded successfully!');
        console.log('[SimpleMapView] Map loaded');
      });

      map.current.on('error', (e) => {
        console.error('[SimpleMapView] Map error:', e);
        setError(`Map error: ${e.error.message}`);
      });

    } catch (err: any) {
      console.error('[SimpleMapView] Failed to create map:', err);
      setError(`Failed to create map: ${err.message}`);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }} 
      />
      
      {/* Status overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <div>Status: {status}</div>
        {error && <div style={{ color: '#ff6b6b', marginTop: '5px' }}>{error}</div>}
      </div>
    </div>
  );
};