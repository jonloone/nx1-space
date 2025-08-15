'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { MapView, OrbitView } from '@deck.gl/core';
import { useMapStore } from '@/lib/store/mapStore';
import { LayerBuilder } from '@/lib/layers/LayerBuilder';
import { DataService } from '@/lib/services/DataService';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function GeoCoreMap() {
  const { 
    viewMode, 
    viewState, 
    layers, 
    domain,
    updateViewState,
    selectFeature,
    dataCache,
    loadData
  } = useMapStore();
  
  const [mapLayers, setMapLayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load domain data
  useEffect(() => {
    const loadDomainData = async () => {
      setIsLoading(true);
      try {
        let data;
        switch (domain) {
          case 'ground-stations':
            data = await DataService.loadGroundStationData({
              bounds: viewState.zoom > 5 ? 
                [viewState.longitude - 20, viewState.latitude - 20, 
                 viewState.longitude + 20, viewState.latitude + 20] : undefined,
              includePredictions: true
            });
            break;
          case 'maritime':
            data = await DataService.loadMaritimeData({
              bounds: viewState.zoom > 5 ?
                [viewState.longitude - 20, viewState.latitude - 20,
                 viewState.longitude + 20, viewState.latitude + 20] : undefined,
              realTime: true,
              includePredictions: true
            });
            break;
          default:
            data = await DataService.loadMockData(domain);
        }
        
        loadData(domain, data);
      } catch (error) {
        console.error('Failed to load domain data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDomainData();
  }, [domain, viewState.zoom]);

  // Build layers
  useEffect(() => {
    const domainData = dataCache.get(domain);
    if (!domainData) return;
    
    const allLayers = [];
    
    // Base layers
    const baseLayers = LayerBuilder.buildBaseLayers({
      satellite: layers.base.satellite,
      terrain: layers.base.terrain && viewMode === '3d',
      labels: layers.base.labels,
      viewMode
    });
    allLayers.push(...baseLayers);
    
    // Data layers
    const dataLayers = LayerBuilder.buildDataLayers(domain, domainData, layers.data);
    allLayers.push(...dataLayers);
    
    // Analysis layers
    const analysisLayers = LayerBuilder.buildAnalysisLayers(
      domain,
      dataCache,
      layers.analysis
    );
    allLayers.push(...analysisLayers);
    
    // ML prediction layers
    const predictions = dataCache.get(`${domain}_predictions`);
    if (predictions) {
      const intelligenceLayers = LayerBuilder.buildIntelligenceLayers(domain, predictions);
      allLayers.push(...intelligenceLayers);
    }
    
    setMapLayers(allLayers);
  }, [layers, domain, viewMode, dataCache]);

  // Get view configuration
  const getView = useCallback(() => {
    switch (viewMode) {
      case '3d':
      case 'orbit':
        return new OrbitView({ 
          id: 'orbit-view',
          orbitAxis: 'Y',
          fov: 50,
          minZoom: 0,
          maxZoom: 20
        });
      case '2d':
      default:
        return new MapView({ id: 'map-view' });
    }
  }, [viewMode]);

  // Handle tooltip
  const getTooltip = useCallback(({object}: any) => {
    if (!object) return null;
    
    switch (domain) {
      case 'ground-stations':
        return {
          html: `
            <div class="p-2">
              <div class="font-bold">${object.name || 'Ground Station'}</div>
              <div class="text-sm">Score: ${(object.score * 100).toFixed(1)}%</div>
              <div class="text-sm">Utilization: ${(object.utilization * 100).toFixed(1)}%</div>
            </div>
          `,
          style: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.2)'
          }
        };
      
      case 'maritime':
        return {
          html: `
            <div class="p-2">
              <div class="font-bold">${object.vessel_name || 'Vessel'}</div>
              <div class="text-sm">Type: ${object.vessel_type}</div>
              <div class="text-sm">Speed: ${object.speed?.toFixed(1)} knots</div>
            </div>
          `
        };
      
      default:
        return object.name || object.id;
    }
  }, [domain]);

  return (
    <div className="relative w-full h-full">
      <DeckGL
        views={getView()}
        viewState={viewState}
        onViewStateChange={({viewState}: any) => updateViewState(viewState)}
        controller={true}
        layers={mapLayers}
        getTooltip={getTooltip}
        onClick={({object}: any) => {
          if (object) selectFeature(object);
        }}
        parameters={{
          clearColor: [0.08, 0.08, 0.12, 1],
          antialias: true
        }}
      >
        {(viewMode === '2d' || viewMode === '3d' || viewMode === 'orbit') && (
          <Map
            mapStyle={MAP_STYLE}
            attributionControl={false}
          />
        )}
      </DeckGL>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 px-3 py-2 glass rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm">Loading data...</span>
        </div>
      )}
    </div>
  );
}