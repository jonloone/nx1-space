"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getFallbackAnalyticsData } from '@/lib/data-loader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GroundStationPopup } from '@/components/ground-station-popup';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

export default function SimplePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [stations, setStations] = useState<GroundStationAnalytics[]>([]);
  const [mode, setMode] = useState<'utilization' | 'profit' | 'opportunity'>('utilization');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedStation, setSelectedStation] = useState<GroundStationAnalytics | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Load data
  useEffect(() => {
    const data = getFallbackAnalyticsData();
    console.log('Loaded stations:', data.length);
    setStations(data);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#0a0a0a' }
          },
          {
            id: 'carto-base-layer',
            type: 'raster',
            source: 'carto-dark',
            paint: { 'raster-opacity': 0.6 }
          }
        ]
      },
      center: [0, 20],
      zoom: 2,
      pitch: 0,
      maxZoom: 18
    });

    mapRef.current = map;

    map.on('load', () => {
      updateLayers();
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layers when data or mode changes
  useEffect(() => {
    if (mapRef.current && stations.length > 0) {
      updateLayers();
    }
  }, [stations, mode, showHeatmap]);

  const updateLayers = () => {
    if (!mapRef.current || stations.length === 0) return;

    // Remove existing deck.gl overlay
    const existingOverlay = (mapRef.current as any)._deckOverlay;
    if (existingOverlay) {
      mapRef.current.removeControl(existingOverlay);
    }

    // Create station data points
    const stationPoints = stations.map(station => ({
      position: [station.location.longitude, station.location.latitude],
      utilization: station.utilization_metrics.current_utilization,
      profit: station.business_metrics.profit_margin,
      revenue: station.business_metrics.monthly_revenue,
      name: station.name
    }));

    console.log('Creating layers with', stationPoints.length, 'points');

    const layers = [];

    // Heatmap layer
    if (showHeatmap) {
      const heatmapLayer = new HeatmapLayer({
        id: 'heatmap',
        data: stationPoints,
        getPosition: (d: any) => d.position,
        getWeight: (d: any) => {
          if (mode === 'utilization') return d.utilization;
          if (mode === 'profit') return d.profit;
          return d.revenue / 10000; // Normalize revenue
        },
        radiusPixels: 100,
        intensity: 2,
        threshold: 0.05,
        colorRange: [
          [59, 130, 246, 100],   // Blue
          [34, 197, 94, 120],    // Green  
          [234, 179, 8, 140],    // Yellow
          [239, 68, 68, 160],    // Red
        ]
      });
      layers.push(heatmapLayer);
    }

    // Station dots
    const stationLayer = new ScatterplotLayer({
      id: 'stations',
      data: stationPoints,
      getPosition: (d: any) => d.position,
      getRadius: 50000,
      getFillColor: (d: any) => {
        if (mode === 'utilization') {
          const util = d.utilization;
          if (util > 85) return [239, 68, 68, 200]; // Red
          if (util > 70) return [234, 179, 8, 200]; // Yellow
          if (util > 40) return [34, 197, 94, 200]; // Green
          return [59, 130, 246, 200]; // Blue
        } else if (mode === 'profit') {
          const profit = d.profit;
          if (profit > 70) return [147, 51, 234, 200]; // Purple
          if (profit > 50) return [59, 130, 246, 200]; // Blue
          if (profit > 30) return [34, 197, 94, 200]; // Green
          return [239, 68, 68, 200]; // Red
        } else {
          // Revenue-based coloring
          const revenue = d.revenue;
          if (revenue > 2000000) return [147, 51, 234, 200]; // Purple
          if (revenue > 1500000) return [59, 130, 246, 200]; // Blue
          if (revenue > 1000000) return [34, 197, 94, 200]; // Green
          return [234, 179, 8, 200]; // Yellow
        }
      },
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 2,
      stroked: true,
      filled: true,
      pickable: true,
      radiusUnits: 'meters',
      radiusMinPixels: 10,
      radiusMaxPixels: 30,
      onClick: (info: any) => {
        if (info.object) {
          console.log('Station clicked:', info.object.name);
          // Find the full station data by name
          const station = stations.find(s => s.name === info.object.name);
          if (station) {
            setSelectedStation(station);
            setIsPopupOpen(true);
          }
        }
      }
    });
    layers.push(stationLayer);

    // Create deck.gl overlay
    const overlay = new MapboxOverlay({
      interleaved: true,
      layers
    });

    mapRef.current.addControl(overlay);
    (mapRef.current as any)._deckOverlay = overlay;
  };

  return (
    <div className="h-screen w-screen relative bg-gray-900">
      {/* Full Screen Map */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Controls */}
      <Card className="absolute top-4 left-4 z-40 bg-black/90 backdrop-blur-sm border-white/20 text-white p-4">
        <h2 className="text-lg font-bold mb-4">Network Intelligence</h2>
        
        {/* Analysis Mode */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Analysis Mode</label>
          <div className="space-y-1">
            <Button
              onClick={() => setMode('utilization')}
              variant={mode === 'utilization' ? 'default' : 'outline'}
              size="sm"
              className="w-full justify-start"
            >
              Utilization Analysis
            </Button>
            <Button
              onClick={() => setMode('profit')}
              variant={mode === 'profit' ? 'default' : 'outline'}
              size="sm"
              className="w-full justify-start"
            >
              Profit Analysis
            </Button>
            <Button
              onClick={() => setMode('opportunity')}
              variant={mode === 'opportunity' ? 'default' : 'outline'}
              size="sm"
              className="w-full justify-start"
            >
              Revenue Analysis
            </Button>
          </div>
        </div>

        {/* Heatmap Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Visualization</label>
          <Button
            onClick={() => setShowHeatmap(!showHeatmap)}
            variant={showHeatmap ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-start"
          >
            {showHeatmap ? 'Hide' : 'Show'} Heatmap
          </Button>
        </div>
      </Card>

      {/* Station Counter */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
        {stations.length} Ground Stations Loaded
      </div>

      {/* Legend */}
      <Card className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm border-white/20 text-white p-3">
        <h3 className="font-medium mb-2 text-sm">Legend</h3>
        <div className="space-y-1 text-xs">
          {mode === 'utilization' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Low (0-40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Good (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>High (70-85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Critical (&gt;85%)</span>
              </div>
            </>
          )}
          {mode === 'profit' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Low (&lt;30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Good (30-50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>High (50-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Excellent (&gt;70%)</span>
              </div>
            </>
          )}
          {mode === 'opportunity' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>$0-1M</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>$1-1.5M</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>$1.5-2M</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>&gt;$2M</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Ground Station Deep Dive Popup */}
      <GroundStationPopup 
        station={selectedStation}
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelectedStation(null);
        }}
      />
    </div>
  );
}