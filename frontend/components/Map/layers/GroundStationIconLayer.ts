import { CompositeLayer } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';

// Font Awesome unicode characters
const FA_ICONS = {
  satellite: '\uf7bf',      // satellite icon
  satelliteDish: '\uf7c0',  // satellite-dish icon
  tower: '\uf519',          // broadcast-tower icon
  signal: '\uf012',         // signal icon
  wifi: '\uf1eb'            // wifi icon
};

interface GroundStationData {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  operator?: string;
  type?: string;
  category?: string;
  utilization: number;
  coverage_area_km2?: number;
  score?: number;
  status?: string;
}

export class GroundStationIconLayer extends CompositeLayer<{
  data: GroundStationData[];
  zoom: number;
}> {
  renderLayers() {
    const { data, zoom } = this.props;
    
    return [
      // Utilization rings (scanning effect)
      new ScatterplotLayer({
        id: 'station-utilization',
        data,
        getPosition: d => [d.longitude, d.latitude],
        getRadius: d => {
          // Scale radius based on utilization and zoom
          const baseRadius = zoom < 8 ? 50000 : zoom < 12 ? 10000 : 2000;
          return baseRadius * (0.5 + (d.utilization / 100) * 0.5);
        },
        radiusMinPixels: 15,
        radiusMaxPixels: 60,
        getFillColor: [0, 0, 0, 0], // Transparent center
        getLineColor: d => {
          // Edge color based on score
          const score = d.score || 0.5;
          if (score > 0.8) return [0, 255, 0, 120];
          if (score > 0.6) return [255, 255, 0, 120];
          if (score > 0.4) return [255, 165, 0, 120];
          return [255, 0, 0, 120];
        },
        stroked: true,
        filled: false,
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 4,
        parameters: {
          depthTest: false
        }
      }),
      
      // Font Awesome Icons as Text
      new TextLayer({
        id: 'station-fa-icons',
        data,
        getPosition: d => [d.longitude, d.latitude],
        getText: d => {
          // Choose icon based on operator, coverage area, or other attributes
          if (d.operator?.toLowerCase().includes('teleport') || d.coverage_area_km2 > 2000) {
            return FA_ICONS.satelliteDish;
          } else if (d.operator?.toLowerCase().includes('gateway') || d.name?.toLowerCase().includes('gateway')) {
            return FA_ICONS.tower;
          } else if (d.coverage_area_km2 < 500) {
            return FA_ICONS.wifi;
          } else if (d.name?.toLowerCase().includes('relay')) {
            return FA_ICONS.signal;
          }
          return FA_ICONS.satellite;
        },
        getSize: zoom < 8 ? 16 : zoom < 12 ? 20 : 24,
        sizeMinPixels: 14,
        sizeMaxPixels: 30,
        getColor: [255, 255, 255, 255],
        fontFamily: '"Font Awesome 6 Free", "Font Awesome 5 Free"', // Support both versions
        fontWeight: 900, // Solid icons
        characterSet: 'auto',
        billboard: false,
        pickable: true,
        getPixelOffset: [0, 0]
      }),
      
      // Station status indicator (small colored dot)
      new ScatterplotLayer({
        id: 'station-status',
        data,
        getPosition: d => [d.longitude, d.latitude],
        getRadius: 300, // Small fixed size
        radiusMinPixels: 3,
        radiusMaxPixels: 5,
        getFillColor: d => {
          // Status color based on utilization
          if (d.utilization > 0.9) return [255, 0, 0, 255]; // High utilization - red
          if (d.utilization > 0.7) return [255, 255, 0, 255]; // Medium utilization - yellow
          if (d.utilization > 0.3) return [0, 255, 0, 255]; // Good utilization - green
          return [128, 128, 128, 255]; // Low utilization - gray
        },
        getLineColor: [0, 0, 0, 255],
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1,
        getPixelOffset: [10, -10], // Offset to top-right of icon
        parameters: {
          depthTest: false
        }
      }),
      
      // Station names (only at higher zoom)
      zoom > 6 && new TextLayer({
        id: 'station-labels',
        data,
        getPosition: d => [d.longitude, d.latitude],
        getText: d => d.name,
        getSize: 11,
        getColor: [255, 255, 255, 200],
        getPixelOffset: [0, -35],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom',
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontWeight: 500,
        characterSet: 'auto',
        outlineWidth: 2,
        outlineColor: [0, 0, 0, 100],
        billboard: false
      })
    ].filter(Boolean);
  }
}