import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from 'styled-components';

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

class GroundStationMap {
  constructor(container, onStationClick, onViewportChange) {
    this.onStationClick = onStationClick;
    this.onViewportChange = onViewportChange;
    
    // Initialize map with ESRI satellite imagery
    this.map = new maplibregl.Map({
      container: container,
      style: this.getBaseStyle(),
      center: [0, 20],
      zoom: 2,
      pitch: 0,
      bearing: 0
    });
    
    // Add navigation controls
    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    // Set up event handlers
    this.map.on('load', () => {
      this.addGroundStations();
      this.addInteractivity();
    });
    
    // Viewport change handler
    this.map.on('moveend', () => {
      if (this.onViewportChange) {
        const bounds = this.map.getBounds();
        this.onViewportChange({
          bounds: [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
          ],
          zoom: this.map.getZoom(),
          center: this.map.getCenter()
        });
      }
    });
  }
  
  getBaseStyle() {
    // MapLibre style with ESRI satellite imagery
    return {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
      },
      layers: [
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };
  }
  
  async addGroundStations() {
    try {
      // Load GeoJSON data
      const response = await fetch('/data/ground_stations.geojson');
      const geojsonData = await response.json();
      
      // Add source
      this.map.addSource('ground-stations', {
        type: 'geojson',
        data: geojsonData
      });
      
      // Add circle layer for stations
      this.map.addLayer({
        id: 'ground-stations-circles',
        type: 'circle',
        source: 'ground-stations',
        paint: {
          // Size based on investment score
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'investment_score'],
            0, 8,
            50, 15,
            100, 25
          ],
          // Color based on investment score
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'investment_score'],
            0, '#ff0000',      // Red for poor
            60, '#ffa500',     // Orange for moderate
            70, '#ffff00',     // Yellow for good
            80, '#00ff00'      // Green for excellent
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1
        }
      });
      
      // Add labels layer
      this.map.addLayer({
        id: 'ground-stations-labels',
        type: 'symbol',
        source: 'ground-stations',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        },
        minzoom: 5  // Only show labels when zoomed in
      });
      
    } catch (error) {
      console.error('Error loading ground stations:', error);
    }
  }
  
  addInteractivity() {
    // Change cursor on hover
    this.map.on('mouseenter', 'ground-stations-circles', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    
    this.map.on('mouseleave', 'ground-stations-circles', () => {
      this.map.getCanvas().style.cursor = '';
    });
    
    // Click handler for popups
    this.map.on('click', 'ground-stations-circles', (e) => {
      const properties = e.features[0].properties;
      
      // Create popup content
      const popupContent = `
        <div style="padding: 10px; max-width: 300px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${properties.name}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #666;">Operator:</td>
              <td style="padding: 4px 0; font-weight: bold;">${properties.operator}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666;">Country:</td>
              <td style="padding: 4px 0;">${properties.country}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666;">Investment Score:</td>
              <td style="padding: 4px 0; font-weight: bold; color: ${this.getScoreColor(properties.investment_score)};">
                ${properties.investment_score.toFixed(1)}/100
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666;">Recommendation:</td>
              <td style="padding: 4px 0; text-transform: capitalize; font-weight: bold;">
                ${properties.investment_recommendation}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666;">Weather Risk:</td>
              <td style="padding: 4px 0;">${properties.weather_risk}</td>
            </tr>
          </table>
          <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">
          <h4 style="margin: 10px 0 5px 0; color: #333;">Technical Specs</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="padding: 2px 0; color: #666;">Antenna:</td>
              <td style="padding: 2px 0;">${properties.antenna_size_m}m</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #666;">G/T:</td>
              <td style="padding: 2px 0;">${properties.g_t_db} dB/K</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #666;">EIRP:</td>
              <td style="padding: 2px 0;">${properties.eirp_dbw} dBW</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #666;">Bands:</td>
              <td style="padding: 2px 0;">${properties.frequency_bands}</td>
            </tr>
          </table>
        </div>
      `;
      
      // Create and show popup
      new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '350px'
      })
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(this.map);
      
      // Notify parent component
      if (this.onStationClick) {
        this.onStationClick(properties);
      }
    });
  }
  
  getScoreColor(score) {
    if (score >= 80) return '#00cc00';
    if (score >= 70) return '#cccc00';
    if (score >= 60) return '#ff9900';
    return '#ff0000';
  }
  
  // Filter methods
  filterByScore(minScore, maxScore) {
    this.map.setFilter('ground-stations-circles', [
      'all',
      ['>=', ['get', 'investment_score'], minScore],
      ['<=', ['get', 'investment_score'], maxScore]
    ]);
    
    this.map.setFilter('ground-stations-labels', [
      'all',
      ['>=', ['get', 'investment_score'], minScore],
      ['<=', ['get', 'investment_score'], maxScore]
    ]);
  }
  
  filterByOperator(operators) {
    if (!operators || operators.length === 0) {
      // Show all if no filter
      this.map.setFilter('ground-stations-circles', null);
      this.map.setFilter('ground-stations-labels', null);
    } else {
      const filter = ['in', ['get', 'operator'], ['literal', operators]];
      this.map.setFilter('ground-stations-circles', filter);
      this.map.setFilter('ground-stations-labels', filter);
    }
  }
  
  // Utility methods
  flyTo(lng, lat, zoom = 8) {
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      duration: 2000
    });
  }
  
  getVisibleStations() {
    const bounds = this.map.getBounds();
    const features = this.map.queryRenderedFeatures({
      layers: ['ground-stations-circles']
    });
    
    return features.map(f => f.properties);
  }
  
  destroy() {
    this.map.remove();
  }
}

// React Component
const GroundStationMapComponent = ({ onStationClick, onViewportChange }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      // Create map instance
      mapInstance.current = new GroundStationMap(
        mapContainer.current,
        onStationClick,
        onViewportChange
      );
      
      // Hide loading after map loads
      mapInstance.current.map.on('load', () => {
        setIsLoading(false);
      });
    }
    
    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [onStationClick, onViewportChange]);
  
  // Expose methods to parent
  useEffect(() => {
    if (mapInstance.current) {
      window.groundStationMap = mapInstance.current;
    }
  }, []);
  
  return (
    <MapContainer>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <LoadingOverlay>
          <div>Loading ground stations...</div>
        </LoadingOverlay>
      )}
    </MapContainer>
  );
};

export default GroundStationMapComponent;