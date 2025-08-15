import { create } from 'zustand';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface LayerState {
  base: {
    satellite: boolean;
    terrain: boolean;
    labels: boolean;
  };
  data: Map<string, boolean>;
  analysis: Map<string, boolean>;
}

interface MapState {
  viewMode: '2d' | '3d' | 'orbit';
  viewState: ViewState;
  domain: 'ground-stations' | 'maritime' | 'defense' | 'telco' | 'supply-chain' | 'risk';
  layers: LayerState;
  dataCache: Map<string, any>;
  selectedFeatures: any[];
  
  setViewMode: (mode: '2d' | '3d' | 'orbit') => void;
  updateViewState: (viewState: Partial<ViewState>) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  setDomain: (domain: MapState['domain']) => void;
  toggleLayer: (category: 'base' | 'data' | 'analysis', layerId: string) => void;
  loadData: (key: string, data: any) => void;
  selectFeature: (feature: any) => void;
  clearSelection: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  viewMode: '3d',
  viewState: {
    longitude: -40,
    latitude: 30,
    zoom: 2,
    pitch: 0,
    bearing: 0
  },
  
  domain: 'ground-stations',
  
  layers: {
    base: {
      satellite: true,
      terrain: false,
      labels: true
    },
    data: new Map([
      ['stations', true],
      ['footprints', true],
      ['vessels', true],
      ['density', true]
    ]),
    analysis: new Map([
      ['heatmap', false],
      ['clusters', false],
      ['hexagons', false]
    ])
  },
  
  dataCache: new Map(),
  selectedFeatures: [],
  
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },
  
  updateViewState: (viewState) => {
    set(state => ({
      viewState: { ...state.viewState, ...viewState }
    }));
  },
  
  flyTo: (lng, lat, zoom = 8) => {
    set({
      viewState: {
        ...get().viewState,
        longitude: lng,
        latitude: lat,
        zoom
      }
    });
  },
  
  setDomain: (domain) => {
    set({ domain, selectedFeatures: [] });
  },
  
  toggleLayer: (category, layerId) => {
    const layers = { ...get().layers };
    
    if (category === 'base') {
      layers.base[layerId as keyof typeof layers.base] = 
        !layers.base[layerId as keyof typeof layers.base];
    } else {
      const categoryMap = layers[category];
      categoryMap.set(layerId, !categoryMap.get(layerId));
    }
    
    set({ layers });
  },
  
  loadData: (key, data) => {
    const cache = new Map(get().dataCache);
    cache.set(key, data);
    set({ dataCache: cache });
  },
  
  selectFeature: (feature) => {
    set({ selectedFeatures: [feature] });
  },
  
  clearSelection: () => {
    set({ selectedFeatures: [] });
  }
}));