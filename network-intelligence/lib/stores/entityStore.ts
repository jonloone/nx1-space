import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { SpatialEntity, EntityType, EntityStatus } from '@/lib/models/SpatialEntity'

interface EntityState {
  // Entities
  entities: Map<string, SpatialEntity>
  setEntities: (entities: SpatialEntity[]) => void
  addEntity: (entity: SpatialEntity) => void
  removeEntity: (id: string) => void
  updateEntity: (id: string, updates: Partial<SpatialEntity>) => void
  clearEntities: () => void

  // Bulk operations
  addEntities: (entities: SpatialEntity[]) => void
  removeEntities: (ids: string[]) => void
  updateEntities: (updates: Array<{ id: string; entity: Partial<SpatialEntity> }>) => void

  // Filters
  selectedEntityIds: Set<string>
  selectEntity: (id: string) => void
  deselectEntity: (id: string) => void
  toggleEntitySelection: (id: string) => void
  clearSelection: () => void
  selectMultiple: (ids: string[]) => void

  // Type filters
  visibleEntityTypes: Set<EntityType>
  toggleEntityType: (type: EntityType) => void
  showEntityType: (type: EntityType) => void
  hideEntityType: (type: EntityType) => void
  showAllTypes: () => void

  // Status filters
  visibleStatuses: Set<EntityStatus>
  toggleStatus: (status: EntityStatus) => void
  showStatus: (status: EntityStatus) => void
  hideStatus: (status: EntityStatus) => void
  showAllStatuses: () => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Getters
  getEntity: (id: string) => SpatialEntity | undefined
  getEntitiesByType: (type: EntityType) => SpatialEntity[]
  getEntitiesByStatus: (status: EntityStatus) => SpatialEntity[]
  getVisibleEntities: () => SpatialEntity[]
  getSelectedEntities: () => SpatialEntity[]
  getEntityCount: () => number
}

export const useEntityStore = create<EntityState>()(
  devtools(
    (set, get) => ({
      // Entities
      entities: new Map(),

      setEntities: (entities) =>
        set({
          entities: new Map(entities.map((e) => [e.id, e]))
        }),

      addEntity: (entity) =>
        set((state) => {
          const newEntities = new Map(state.entities)
          newEntities.set(entity.id, entity)
          return { entities: newEntities }
        }),

      removeEntity: (id) =>
        set((state) => {
          const newEntities = new Map(state.entities)
          newEntities.delete(id)
          const newSelectedIds = new Set(state.selectedEntityIds)
          newSelectedIds.delete(id)
          return {
            entities: newEntities,
            selectedEntityIds: newSelectedIds
          }
        }),

      updateEntity: (id, updates) =>
        set((state) => {
          const entity = state.entities.get(id)
          if (!entity) return state

          const newEntity = { ...entity, ...updates }
          const newEntities = new Map(state.entities)
          newEntities.set(id, newEntity)
          return { entities: newEntities }
        }),

      clearEntities: () =>
        set({
          entities: new Map(),
          selectedEntityIds: new Set()
        }),

      // Bulk operations
      addEntities: (entities) =>
        set((state) => {
          const newEntities = new Map(state.entities)
          entities.forEach((e) => newEntities.set(e.id, e))
          return { entities: newEntities }
        }),

      removeEntities: (ids) =>
        set((state) => {
          const newEntities = new Map(state.entities)
          const newSelectedIds = new Set(state.selectedEntityIds)
          ids.forEach((id) => {
            newEntities.delete(id)
            newSelectedIds.delete(id)
          })
          return {
            entities: newEntities,
            selectedEntityIds: newSelectedIds
          }
        }),

      updateEntities: (updates) =>
        set((state) => {
          const newEntities = new Map(state.entities)
          updates.forEach(({ id, entity: updates }) => {
            const entity = newEntities.get(id)
            if (entity) {
              newEntities.set(id, { ...entity, ...updates })
            }
          })
          return { entities: newEntities }
        }),

      // Selection
      selectedEntityIds: new Set(),

      selectEntity: (id) =>
        set((state) => ({
          selectedEntityIds: new Set(state.selectedEntityIds).add(id)
        })),

      deselectEntity: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedEntityIds)
          newSelectedIds.delete(id)
          return { selectedEntityIds: newSelectedIds }
        }),

      toggleEntitySelection: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedEntityIds)
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id)
          } else {
            newSelectedIds.add(id)
          }
          return { selectedEntityIds: newSelectedIds }
        }),

      clearSelection: () => set({ selectedEntityIds: new Set() }),

      selectMultiple: (ids) =>
        set({ selectedEntityIds: new Set(ids) }),

      // Type filters
      visibleEntityTypes: new Set([
        'vehicle',
        'vessel',
        'aircraft',
        'satellite',
        'ground-station',
        'personnel',
        'sensor',
        'zone',
        'route',
        'waypoint'
      ]),

      toggleEntityType: (type) =>
        set((state) => {
          const newTypes = new Set(state.visibleEntityTypes)
          if (newTypes.has(type)) {
            newTypes.delete(type)
          } else {
            newTypes.add(type)
          }
          return { visibleEntityTypes: newTypes }
        }),

      showEntityType: (type) =>
        set((state) => ({
          visibleEntityTypes: new Set(state.visibleEntityTypes).add(type)
        })),

      hideEntityType: (type) =>
        set((state) => {
          const newTypes = new Set(state.visibleEntityTypes)
          newTypes.delete(type)
          return { visibleEntityTypes: newTypes }
        }),

      showAllTypes: () =>
        set({
          visibleEntityTypes: new Set([
            'vehicle',
            'vessel',
            'aircraft',
            'satellite',
            'ground-station',
            'personnel',
            'sensor',
            'zone',
            'route',
            'waypoint',
            'custom'
          ])
        }),

      // Status filters
      visibleStatuses: new Set([
        'active',
        'inactive',
        'idle',
        'maintenance',
        'offline',
        'alert',
        'warning',
        'critical',
        'unknown'
      ]),

      toggleStatus: (status) =>
        set((state) => {
          const newStatuses = new Set(state.visibleStatuses)
          if (newStatuses.has(status)) {
            newStatuses.delete(status)
          } else {
            newStatuses.add(status)
          }
          return { visibleStatuses: newStatuses }
        }),

      showStatus: (status) =>
        set((state) => ({
          visibleStatuses: new Set(state.visibleStatuses).add(status)
        })),

      hideStatus: (status) =>
        set((state) => {
          const newStatuses = new Set(state.visibleStatuses)
          newStatuses.delete(status)
          return { visibleStatuses: newStatuses }
        }),

      showAllStatuses: () =>
        set({
          visibleStatuses: new Set([
            'active',
            'inactive',
            'idle',
            'maintenance',
            'offline',
            'alert',
            'warning',
            'critical',
            'unknown'
          ])
        }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Getters
      getEntity: (id) => {
        return get().entities.get(id)
      },

      getEntitiesByType: (type) => {
        return Array.from(get().entities.values()).filter((e) => e.type === type)
      },

      getEntitiesByStatus: (status) => {
        return Array.from(get().entities.values()).filter((e) => e.status === status)
      },

      getVisibleEntities: () => {
        const { entities, visibleEntityTypes, visibleStatuses, searchQuery } = get()

        return Array.from(entities.values()).filter((entity) => {
          // Type filter
          if (!visibleEntityTypes.has(entity.type)) return false

          // Status filter
          if (!visibleStatuses.has(entity.status)) return false

          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchesName = entity.name.toLowerCase().includes(query)
            const matchesId = entity.id.toLowerCase().includes(query)
            const matchesTags = entity.tags?.some((tag) =>
              tag.toLowerCase().includes(query)
            )
            if (!matchesName && !matchesId && !matchesTags) return false
          }

          return true
        })
      },

      getSelectedEntities: () => {
        const { entities, selectedEntityIds } = get()
        return Array.from(selectedEntityIds)
          .map((id) => entities.get(id))
          .filter((e): e is SpatialEntity => e !== undefined)
      },

      getEntityCount: () => {
        return get().entities.size
      }
    }),
    { name: 'EntityStore' }
  )
)
