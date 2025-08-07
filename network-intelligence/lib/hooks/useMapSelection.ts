import { create } from 'zustand'

export interface Station {
  id: string
  name: string
  location: string
  coordinates: [number, number]
  utilization: number
  revenue: number
  margin: number
  status: 'active' | 'idle' | 'maintenance'
  services: Array<{ type: string; percentage: number }>
  utilizationHistory: number[]
  utilizationTrend: number
}

export interface Hexagon {
  h3Index: string
  coordinates: [number, number]
  score: number
  revenue: number
  landCoverage: number
  riskLevel: string
}

export interface Satellite {
  id: string
  name: string
  type: string
  orbit: string
  coverage: number
  capacity: number
  status: 'active' | 'idle' | 'offline'
}

interface MapSelectionState {
  selectedStation: Station | null
  selectedHexagon: Hexagon | null
  selectedSatellite: Satellite | null
  hoveredItem: any | null
  viewContext: {
    view: 'stations' | 'satellites'
    filter: string
  }
  // Actions
  selectStation: (station: Station) => void
  selectHexagon: (hexagon: Hexagon) => void
  selectSatellite: (satellite: Satellite) => void
  clearSelection: () => void
  setHoveredItem: (item: any) => void
  setViewContext: (context: { view: 'stations' | 'satellites'; filter: string }) => void
}

export const useMapSelection = create<MapSelectionState>((set) => ({
  selectedStation: null,
  selectedHexagon: null,
  selectedSatellite: null,
  hoveredItem: null,
  viewContext: {
    view: 'stations',
    filter: 'utilization'
  },
  
  selectStation: (station: Station) => set({ 
    selectedStation: station,
    selectedHexagon: null,
    selectedSatellite: null
  }),
  
  selectHexagon: (hexagon: Hexagon) => set({ 
    selectedHexagon: hexagon,
    selectedStation: null,
    selectedSatellite: null
  }),
  
  selectSatellite: (satellite: Satellite) => set({ 
    selectedSatellite: satellite,
    selectedStation: null,
    selectedHexagon: null
  }),
  
  clearSelection: () => set({
    selectedStation: null,
    selectedHexagon: null,
    selectedSatellite: null
  }),
  
  setHoveredItem: (item: any) => set({ hoveredItem: item }),
  
  setViewContext: (context: { view: 'stations' | 'satellites'; filter: string }) => set({ viewContext: context })
}))