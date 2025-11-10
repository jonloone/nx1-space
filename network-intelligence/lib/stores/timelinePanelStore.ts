/**
 * Timeline Panel Store
 *
 * Manages UI state for the bottom timeline popup panel
 * Separate from timelineStore.ts which handles temporal playback controls
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface TimelineEvent {
  id: string
  timestamp: Date | string
  location: {
    name: string
    lat?: number
    lon?: number
    coordinates?: [number, number]
    type?: string
  }
  description?: string
  activity?: string
  significance?: 'routine' | 'suspicious' | 'anomaly'
  dwellTime?: number
  metadata?: Record<string, any>
}

interface TimelinePanelState {
  // UI State
  isOpen: boolean
  isMinimized: boolean

  // Timeline Data
  events: TimelineEvent[]
  subjectName: string | null
  subjectId: string | null
  title: string | null

  // Selection State
  selectedEventId: string | null
  selectedLocationId: string | null

  // Actions
  openTimeline: (
    events: TimelineEvent[],
    subjectName: string,
    subjectId?: string,
    title?: string
  ) => void
  closeTimeline: () => void
  toggleMinimize: () => void
  setEvents: (events: TimelineEvent[]) => void
  clearTimeline: () => void
  selectEvent: (eventId: string | null, locationId?: string | null) => void
}

export const useTimelinePanelStore = create<TimelinePanelState>()(
  devtools(
    (set) => ({
      // Initial State
      isOpen: false,
      isMinimized: false,
      events: [],
      subjectName: null,
      subjectId: null,
      title: null,
      selectedEventId: null,
      selectedLocationId: null,

      // Open timeline with data
      openTimeline: (events, subjectName, subjectId, title) => {
        set({
          isOpen: true,
          isMinimized: false,
          events,
          subjectName,
          subjectId: subjectId || null,
          title: title || `Timeline: ${subjectName}`
        })
      },

      // Close timeline panel
      closeTimeline: () => {
        set({
          isOpen: false,
          isMinimized: false
        })
      },

      // Toggle minimize state (keeps panel open but collapses to title bar)
      toggleMinimize: () => {
        set((state) => ({
          isMinimized: !state.isMinimized
        }))
      },

      // Update events without changing open state
      setEvents: (events) => {
        set({ events })
      },

      // Clear all timeline data
      clearTimeline: () => {
        set({
          events: [],
          subjectName: null,
          subjectId: null,
          title: null,
          selectedEventId: null,
          selectedLocationId: null
        })
      },

      // Select an event and optionally its location
      selectEvent: (eventId, locationId) => {
        set({
          selectedEventId: eventId,
          selectedLocationId: locationId || null
        })
      }
    }),
    { name: 'timeline-panel-store' }
  )
)
