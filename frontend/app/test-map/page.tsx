'use client';

import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';

export default function TestMapPage() {
  const [groundStations, setGroundStations] = useState<any[]>([]);
  const [viewState, setViewState] = useState({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 4,
    pitch: 0,
    bearing: 0
  });

  useEffect(() => {
    // Load ground stations
    fetch('/data/ses_intelsat_ground_stations.json')
      .then(res => res.json())
      .then(data => {
        const stations = data.stations.map((s: any) => ({
          name: s.name,
          longitude: s.location.longitude,
          latitude: s.location.latitude,
          utilization: s.utilization_metrics.current_utilization / 100
        }));
        console.log('Loaded stations:', stations.length);
        console.log('Sample:', stations.slice(0, 3));
        setGroundStations(stations);
      })
      .catch(err => console.error('Error loading stations:', err));
  }, []);

  const layers = [
    new ScatterplotLayer({
      id: 'ground-stations',
      data: groundStations,
      getPosition: (d: any) => [d.longitude, d.latitude],
      getRadius: 50000,
      getFillColor: (d: any) => {
        const util = d.utilization || 0;
        if (util > 0.8) return [255, 0, 0, 200];
        if (util > 0.6) return [255, 255, 0, 200];
        return [0, 255, 0, 200];
      },
      radiusMinPixels: 5,
      radiusMaxPixels: 30,
      pickable: true
    }),
    new TextLayer({
      id: 'station-labels',
      data: groundStations,
      getPosition: (d: any) => [d.longitude, d.latitude],
      getText: (d: any) => d.name,
      getSize: 14,
      getColor: [255, 255, 255, 255],
      getPixelOffset: [0, -20]
    })
  ];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        layers={layers}
        controller={true}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        />
      </DeckGL>
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '10px',
        borderRadius: '5px'
      }}>
        <h3>Test Map</h3>
        <p>Stations loaded: {groundStations.length}</p>
        <p>View: [{viewState.longitude.toFixed(2)}, {viewState.latitude.toFixed(2)}] @ {viewState.zoom.toFixed(1)}</p>
      </div>
    </div>
  );
}