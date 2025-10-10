import { create } from 'zustand'

/**
 * Data Layer Definition
 */
export interface DataLayer {
  id: string
  name: string
  type: 'overture' | 'ground-station' | 'maritime' | 'hex-grid' | 'custom'
  source: string
  enabled: boolean
  opacity: number
  visible: boolean
  zIndex: number
  filters: LayerFilter[]
  style?: any
  metadata?: {
    description?: string
    lastUpdated?: Date
    dataCount?: number
  }
}

export interface LayerFilter {
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in'
  value: any
}

export interface LayerGroup {
  id: string
  name: string
  layerIds: string[]
  collapsed: boolean
}

interface LayerState {
  // State
  layers: Map<string, DataLayer>
  layerGroups: LayerGroup[]
  activeLayerIds: Set<string>
  selectedLayerId: string | null

  // Layer Actions
  addLayer: (layer: DataLayer) => void
  removeLayer: (id: string) => void
  toggleLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<DataLayer>) => void
  setLayerOpacity: (id: string, opacity: number) => void
  setLayerVisibility: (id: string, visible: boolean) => void
  setLayerZIndex: (id: string, zIndex: number) => void
  selectLayer: (id: string | null) => void

  // Filter Actions
  addFilter: (layerId: string, filter: LayerFilter) => void
  removeFilter: (layerId: string, filterIndex: number) => void
  clearFilters: (layerId: string) => void
  updateFilter: (layerId: string, filterIndex: number, filter: Partial<LayerFilter>) => void

  // Group Actions
  addLayerGroup: (group: LayerGroup) => void
  toggleGroupCollapse: (groupId: string) => void
  addLayerToGroup: (groupId: string, layerId: string) => void
  removeLayerFromGroup: (groupId: string, layerId: string) => void

  // Bulk Actions
  enableAllLayers: () => void
  disableAllLayers: () => void
  resetLayers: () => void

  // Utilities
  getLayer: (id: string) => DataLayer | undefined
  getActiveLayers: () => DataLayer[]
  getLayersByType: (type: DataLayer['type']) => DataLayer[]
  getLayersInGroup: (groupId: string) => DataLayer[]
}

/**
 * Default Layers Configuration
 */
const createDefaultLayers = (): DataLayer[] => [
  {
    id: 'ground-stations',
    name: 'Ground Stations',
    type: 'ground-station',
    source: 'local',
    enabled: true,
    opacity: 1,
    visible: true,
    zIndex: 10,
    filters: [],
    metadata: {
      description: 'SES, Intelsat, and competitor ground stations',
      dataCount: 0
    }
  },
  {
    id: 'hex-coverage',
    name: 'H3 Hexagon Coverage',
    type: 'hex-grid',
    source: 'computed',
    enabled: false,
    opacity: 0.6,
    visible: false,
    zIndex: 5,
    filters: [],
    metadata: {
      description: 'Global hexagonal coverage analysis',
      dataCount: 0
    }
  },
  {
    id: 'maritime-routes',
    name: 'Maritime Routes',
    type: 'maritime',
    source: 'local',
    enabled: false,
    opacity: 0.7,
    visible: false,
    zIndex: 8,
    filters: [],
    metadata: {
      description: 'Major shipping lanes and maritime traffic'
    }
  },
  {
    id: 'overture-buildings',
    name: 'Buildings',
    type: 'overture',
    source: 'overture-maps',
    enabled: false,
    opacity: 0.7,
    visible: false,
    zIndex: 6,
    filters: [],
    metadata: {
      description: 'Building footprints and 3D structures from Overture Maps',
      lastUpdated: new Date()
    }
  },
  {
    id: 'overture-places',
    name: 'Places of Interest',
    type: 'overture',
    source: 'overture-maps',
    enabled: false,
    opacity: 0.8,
    visible: false,
    zIndex: 7,
    filters: [],
    metadata: {
      description: 'Points of interest including restaurants, shops, and services',
      lastUpdated: new Date()
    }
  },
  {
    id: 'overture-transportation',
    name: 'Transportation',
    type: 'overture',
    source: 'overture-maps',
    enabled: false,
    opacity: 0.7,
    visible: false,
    zIndex: 4,
    filters: [],
    metadata: {
      description: 'Road network and transportation infrastructure',
      lastUpdated: new Date()
    }
  }
]

/**
 * Layer Store using Zustand
 */
export const useLayerStore = create<LayerState>((set, get) => ({
  // Initial state
  layers: new Map(createDefaultLayers().map(layer => [layer.id, layer])),
  layerGroups: [
    { id: 'infrastructure', name: 'Infrastructure', layerIds: ['ground-stations'], collapsed: false },
    { id: 'analytics', name: 'Analytics', layerIds: ['hex-coverage'], collapsed: false },
    { id: 'maritime', name: 'Maritime', layerIds: ['maritime-routes'], collapsed: true },
    { id: 'overture', name: 'Overture Maps', layerIds: ['overture-buildings', 'overture-places', 'overture-transportation'], collapsed: false }
  ],
  activeLayerIds: new Set(['ground-stations']),
  selectedLayerId: null,

  // Layer Actions
  addLayer: (layer) => set((state) => {
    const newLayers = new Map(state.layers)
    newLayers.set(layer.id, layer)
    return { layers: newLayers }
  }),

  removeLayer: (id) => set((state) => {
    const newLayers = new Map(state.layers)
    newLayers.delete(id)
    const newActiveIds = new Set(state.activeLayerIds)
    newActiveIds.delete(id)
    return { layers: newLayers, activeLayerIds: newActiveIds }
  }),

  toggleLayer: (id) => set((state) => {
    const layer = state.layers.get(id)
    if (!layer) return state

    const newLayer = { ...layer, enabled: !layer.enabled, visible: !layer.enabled }
    const newLayers = new Map(state.layers)
    newLayers.set(id, newLayer)

    const newActiveIds = new Set(state.activeLayerIds)
    if (newLayer.enabled) {
      newActiveIds.add(id)
    } else {
      newActiveIds.delete(id)
    }

    return { layers: newLayers, activeLayerIds: newActiveIds }
  }),

  updateLayer: (id, updates) => set((state) => {
    const layer = state.layers.get(id)
    if (!layer) return state

    const newLayer = { ...layer, ...updates }
    const newLayers = new Map(state.layers)
    newLayers.set(id, newLayer)

    return { layers: newLayers }
  }),

  setLayerOpacity: (id, opacity) => set((state) => {
    const layer = state.layers.get(id)
    if (!layer) return state

    const newLayer = { ...layer, opacity: Math.max(0, Math.min(1, opacity)) }
    const newLayers = new Map(state.layers)
    newLayers.set(id, newLayer)

    return { layers: newLayers }
  }),

  setLayerVisibility: (id, visible) => set((state) => {
    const layer = state.layers.get(id)
    if (!layer) return state

    const newLayer = { ...layer, visible }
    const newLayers = new Map(state.layers)
    newLayers.set(id, newLayer)

    return { layers: newLayers }
  }),

  setLayerZIndex: (id, zIndex) => set((state) => {
    const layer = state.layers.get(id)
    if (!layer) return state

    const newLayer = { ...layer, zIndex }
    const newLayers = new Map(state.layers)
    newLayers.set(id, newLayer)

    return { layers: newLayers }
  }),

  selectLayer: (id) => set({ selectedLayerId: id }),

  // Filter Actions
  addFilter: (layerId, filter) => set((state) => {
    const layer = state.layers.get(layerId)
    if (!layer) return state

    const newLayer = { ...layer, filters: [...layer.filters, filter] }
    const newLayers = new Map(state.layers)
    newLayers.set(layerId, newLayer)

    return { layers: newLayers }
  }),

  removeFilter: (layerId, filterIndex) => set((state) => {
    const layer = state.layers.get(layerId)
    if (!layer) return state

    const newFilters = layer.filters.filter((_, idx) => idx !== filterIndex)
    const newLayer = { ...layer, filters: newFilters }
    const newLayers = new Map(state.layers)
    newLayers.set(layerId, newLayer)

    return { layers: newLayers }
  }),

  clearFilters: (layerId) => set((state) => {
    const layer = state.layers.get(layerId)
    if (!layer) return state

    const newLayer = { ...layer, filters: [] }
    const newLayers = new Map(state.layers)
    newLayers.set(layerId, newLayer)

    return { layers: newLayers }
  }),

  updateFilter: (layerId, filterIndex, filterUpdate) => set((state) => {
    const layer = state.layers.get(layerId)
    if (!layer || filterIndex >= layer.filters.length) return state

    const newFilters = [...layer.filters]
    newFilters[filterIndex] = { ...newFilters[filterIndex], ...filterUpdate }
    const newLayer = { ...layer, filters: newFilters }
    const newLayers = new Map(state.layers)
    newLayers.set(layerId, newLayer)

    return { layers: newLayers }
  }),

  // Group Actions
  addLayerGroup: (group) => set((state) => ({
    layerGroups: [...state.layerGroups, group]
  })),

  toggleGroupCollapse: (groupId) => set((state) => ({
    layerGroups: state.layerGroups.map(group =>
      group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
    )
  })),

  addLayerToGroup: (groupId, layerId) => set((state) => ({
    layerGroups: state.layerGroups.map(group =>
      group.id === groupId
        ? { ...group, layerIds: [...group.layerIds, layerId] }
        : group
    )
  })),

  removeLayerFromGroup: (groupId, layerId) => set((state) => ({
    layerGroups: state.layerGroups.map(group =>
      group.id === groupId
        ? { ...group, layerIds: group.layerIds.filter(id => id !== layerId) }
        : group
    )
  })),

  // Bulk Actions
  enableAllLayers: () => set((state) => {
    const newLayers = new Map(state.layers)
    const newActiveIds = new Set<string>()

    state.layers.forEach((layer, id) => {
      newLayers.set(id, { ...layer, enabled: true, visible: true })
      newActiveIds.add(id)
    })

    return { layers: newLayers, activeLayerIds: newActiveIds }
  }),

  disableAllLayers: () => set((state) => {
    const newLayers = new Map(state.layers)

    state.layers.forEach((layer, id) => {
      newLayers.set(id, { ...layer, enabled: false, visible: false })
    })

    return { layers: newLayers, activeLayerIds: new Set() }
  }),

  resetLayers: () => {
    const defaultLayers = createDefaultLayers()
    return set({
      layers: new Map(defaultLayers.map(layer => [layer.id, layer])),
      activeLayerIds: new Set(['ground-stations']),
      selectedLayerId: null
    })
  },

  // Utilities
  getLayer: (id) => get().layers.get(id),

  getActiveLayers: () => {
    const { layers, activeLayerIds } = get()
    return Array.from(activeLayerIds)
      .map(id => layers.get(id))
      .filter((layer): layer is DataLayer => layer !== undefined)
      .sort((a, b) => a.zIndex - b.zIndex)
  },

  getLayersByType: (type) => {
    const { layers } = get()
    return Array.from(layers.values()).filter(layer => layer.type === type)
  },

  getLayersInGroup: (groupId) => {
    const { layers, layerGroups } = get()
    const group = layerGroups.find(g => g.id === groupId)
    if (!group) return []

    return group.layerIds
      .map(id => layers.get(id))
      .filter((layer): layer is DataLayer => layer !== undefined)
  }
}))
