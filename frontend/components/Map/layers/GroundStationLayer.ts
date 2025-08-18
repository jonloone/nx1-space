import { CompositeLayer } from '@deck.gl/core';
import { ScatterplotLayer, IconLayer, TextLayer } from '@deck.gl/layers';

// SVG satellite dish icon as data URL
const SATELLITE_ICON = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="white" d="M192 32c0 17.7 14.3 32 32 32c123.7 0 224 100.3 224 224c0 17.7 14.3 32 32 32s32-14.3 32-32C512 128.9 383.1 0 224 0c-17.7 0-32 14.3-32 32zm0 96c0 17.7 14.3 32 32 32c70.7 0 128 57.3 128 128c0 17.7 14.3 32 32 32s32-14.3 32-32c0-106-86-192-192-192c-17.7 0-32 14.3-32 32zM96 144c0-26.5-21.5-48-48-48S0 117.5 0 144V368c0 79.5 64.5 144 144 144s144-64.5 144-144s-64.5-144-144-144H128v96h16c26.5 0 48 21.5 48 48s-21.5 48-48 48s-48-21.5-48-48V144z"/>
</svg>
`)}`;

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, anchorY: 128 }
};

interface GroundStationLayerProps {
  id?: string;
  data: any[];
  pickable?: boolean;
  visible?: boolean;
  opacity?: number;
  viewMode?: 'map';
  onClick?: (info: any) => void;
}

export default class GroundStationLayer extends CompositeLayer<GroundStationLayerProps> {
  static defaultProps = {
    pickable: true,
    visible: true,
    opacity: 1,
    viewMode: 'map'
  };

  renderLayers() {
    const { data, viewMode, pickable, visible, opacity } = this.props;
    
    if (!visible || !data) return [];
    
    const layers = [];
    
    // Layer 1: Scanning radius effect showing utilization
    layers.push(new ScatterplotLayer({
      id: `${this.props.id}-utilization-scan`,
      data,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: d => {
        const utilization = d.utilization || d.current_utilization || 50;
        const baseRadius = 8000;
        return baseRadius * (0.5 + (utilization / 100) * 0.5);
      },
      radiusMinPixels: 20,
      radiusMaxPixels: 100,
      radiusScale: 1,
      getFillColor: d => {
        const utilization = d.utilization || d.current_utilization || 50;
        // Center is transparent, edge has color based on utilization
        if (utilization > 80) return [255, 50, 50, 0]; // Red for high
        if (utilization > 60) return [255, 200, 50, 0]; // Yellow for medium
        return [50, 255, 50, 0]; // Green for low
      },
      getLineColor: d => {
        const utilization = d.utilization || d.current_utilization || 50;
        // Edge color with opacity creating scanning effect
        if (utilization > 80) return [255, 50, 50, 100]; // Red
        if (utilization > 60) return [255, 200, 50, 100]; // Yellow
        return [50, 255, 50, 100]; // Green
      },
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 3,
      opacity: opacity * 0.6,
      parameters: {
        depthTest: false,
        blend: true,
        blendFunc: [770, 1], // GL.SRC_ALPHA, GL.ONE for additive blending
        blendEquation: 32774 // GL.FUNC_ADD
      },
      transitions: {
        getRadius: 1000,
        getLineColor: 500
      }
    }));
    
    // Layer 2: Pulsing effect (secondary ring)
    layers.push(new ScatterplotLayer({
      id: `${this.props.id}-pulse`,
      data,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: d => {
        const utilization = d.utilization || d.current_utilization || 50;
        const baseRadius = 10000;
        // Add time-based pulsing
        const pulse = Math.sin(Date.now() * 0.001) * 0.1 + 1;
        return baseRadius * (0.5 + (utilization / 100) * 0.5) * pulse;
      },
      radiusMinPixels: 25,
      radiusMaxPixels: 120,
      getFillColor: [0, 0, 0, 0], // Transparent center
      getLineColor: d => {
        const utilization = d.utilization || d.current_utilization || 50;
        if (utilization > 80) return [255, 50, 50, 50];
        if (utilization > 60) return [255, 200, 50, 50];
        return [50, 255, 50, 50];
      },
      stroked: true,
      filled: false,
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 2,
      opacity: opacity * 0.3,
      parameters: {
        depthTest: false
      }
    }));
    
    // Layer 3: Central station icon
    layers.push(new ScatterplotLayer({
      id: `${this.props.id}-center`,
      data,
      pickable,
      getPosition: d => [d.longitude, d.latitude],
      getRadius: 800,
      radiusMinPixels: 8,
      radiusMaxPixels: 20,
      getFillColor: d => {
        const utilization = d.utilization || d.current_utilization || 50;
        if (utilization > 80) return [255, 100, 100, 255];
        if (utilization > 60) return [255, 220, 100, 255];
        return [100, 255, 100, 255];
      },
      getLineColor: [255, 255, 255, 255],
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      opacity,
      parameters: {
        depthTest: false
      }
    }));
    
    // Layer 4: Satellite dish icon (using emoji for simplicity)
    layers.push(new TextLayer({
      id: `${this.props.id}-icons`,
      data,
      pickable: false,
      getPosition: d => [d.longitude, d.latitude],
      getText: d => '📡',
      getSize: 20,
      sizeMinPixels: 16,
      sizeMaxPixels: 30,
      getColor: [255, 255, 255, 255],
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      billboard: true,
      opacity,
      parameters: {
        depthTest: false
      }
    }));
    
    // Layer 5: Station labels
    layers.push(new TextLayer({
      id: `${this.props.id}-labels`,
      data,
      pickable: false,
      getPosition: d => [d.longitude, d.latitude],
      getText: d => d.name || d.station_name || d.id,
      getSize: 11,
      sizeMinPixels: 10,
      sizeMaxPixels: 14,
      getColor: [255, 255, 255, 200],
      getPixelOffset: [0, -35],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      billboard: true,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontWeight: 600,
      characterSet: 'auto',
      outlineWidth: 2,
      outlineColor: [0, 0, 0, 100],
      opacity: opacity * 0.9,
      parameters: {
        depthTest: false
      }
    }));
    
    // Layer 6: Capacity indicator bars (optional)
    if (viewMode === 'map') {
      layers.push(new ScatterplotLayer({
        id: `${this.props.id}-capacity`,
        data,
        pickable: false,
        getPosition: d => [d.longitude, d.latitude],
        getRadius: d => {
          const capacity = d.capacity_gbps || 100;
          return Math.sqrt(capacity) * 100;
        },
        radiusMinPixels: 5,
        radiusMaxPixels: 15,
        getFillColor: [100, 150, 255, 100],
        getLineColor: [100, 150, 255, 200],
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1,
        opacity: opacity * 0.5,
        parameters: {
          depthTest: false
        }
      }));
    }
    
    return layers;
  }
}

// Export function for easy use
export function createGroundStationLayer(stations: any[], viewMode: 'map' = 'map', zoom: number = 10) {
  return new GroundStationLayer({
    id: 'ground-stations',
    data: stations,
    pickable: true,
    viewMode,
    // Adjust radius scale based on zoom
    radiusScale: zoom < 8 ? 100000 : zoom < 12 ? 10000 : 1000,
    radiusMinPixels: 10,
    radiusMaxPixels: 50,
    // More detail at higher zoom
    pickable: zoom > 6
  });
}