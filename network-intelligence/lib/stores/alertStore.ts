import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Alert {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'delivery' | 'vehicle' | 'route' | 'system' | 'weather' | 'security'
  timestamp: string
  description: string
  affectedEntities: string[]
  recommendations?: string[]
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  location?: {
    longitude: number
    latitude: number
  }
  metadata?: Record<string, any>
}

interface AlertState {
  // Alerts
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  removeAlert: (alertId: string) => void
  updateAlert: (alertId: string, updates: Partial<Alert>) => void

  // Alert status
  acknowledgeAlert: (alertId: string) => void
  resolveAlert: (alertId: string) => void
  dismissAlert: (alertId: string) => void

  // Filters
  selectedSeverity: Alert['severity'] | 'all'
  setSelectedSeverity: (severity: Alert['severity'] | 'all') => void
  selectedType: Alert['type'] | 'all'
  setSelectedType: (type: Alert['type'] | 'all') => void
  selectedStatus: Alert['status'] | 'all'
  setSelectedStatus: (status: Alert['status'] | 'all') => void

  // Getters
  getAlert: (alertId: string) => Alert | undefined
  getActiveAlerts: () => Alert[]
  getFilteredAlerts: () => Alert[]
  getAlertCount: () => number
  getActiveAlertCount: () => number
}

export const useAlertStore = create<AlertState>()(
  devtools(
    (set, get) => ({
      // Alerts
      alerts: [],
      setAlerts: (alerts) => set({ alerts }),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [alert, ...state.alerts]
        })),

      removeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId)
        })),

      updateAlert: (alertId, updates) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, ...updates } : a
          )
        })),

      // Alert status
      acknowledgeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, status: 'acknowledged' as const } : a
          )
        })),

      resolveAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, status: 'resolved' as const } : a
          )
        })),

      dismissAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, status: 'dismissed' as const } : a
          )
        })),

      // Filters
      selectedSeverity: 'all',
      setSelectedSeverity: (severity) => set({ selectedSeverity: severity }),
      selectedType: 'all',
      setSelectedType: (type) => set({ selectedType: type }),
      selectedStatus: 'all',
      setSelectedStatus: (status) => set({ selectedStatus: status }),

      // Getters
      getAlert: (alertId) => {
        return get().alerts.find((a) => a.id === alertId)
      },

      getActiveAlerts: () => {
        return get().alerts.filter((a) => a.status === 'active')
      },

      getFilteredAlerts: () => {
        const { alerts, selectedSeverity, selectedType, selectedStatus } = get()

        return alerts.filter((alert) => {
          const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity
          const matchesType = selectedType === 'all' || alert.type === selectedType
          const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus

          return matchesSeverity && matchesType && matchesStatus
        })
      },

      getAlertCount: () => {
        return get().alerts.length
      },

      getActiveAlertCount: () => {
        return get().alerts.filter((a) => a.status === 'active').length
      }
    }),
    { name: 'AlertStore' }
  )
)
