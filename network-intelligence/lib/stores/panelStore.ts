import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type PanelMode = 'feature' | 'alert' | 'layer' | 'analysis' | null

interface PanelState {
  // Left sidebar
  isLeftSidebarOpen: boolean
  setLeftSidebarOpen: (open: boolean) => void
  toggleLeftSidebar: () => void
  leftSidebarTab: 'data' | 'layers' | 'live'
  setLeftSidebarTab: (tab: 'data' | 'layers' | 'live') => void

  // Right panel
  isRightPanelOpen: boolean
  setRightPanelOpen: (open: boolean) => void
  toggleRightPanel: () => void
  rightPanelMode: PanelMode
  setRightPanelMode: (mode: PanelMode) => void
  rightPanelData: any
  setRightPanelData: (data: any) => void
  openRightPanel: (mode: PanelMode, data: any) => void
  closeRightPanel: () => void

  // Timeline
  isTimelineExpanded: boolean
  setTimelineExpanded: (expanded: boolean) => void
  toggleTimeline: () => void

  // Actions
  closeAllPanels: () => void
  resetPanels: () => void
}

export const usePanelStore = create<PanelState>()(
  devtools(
    (set) => ({
      // Left sidebar
      isLeftSidebarOpen: true,
      setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
      toggleLeftSidebar: () =>
        set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
      leftSidebarTab: 'data',
      setLeftSidebarTab: (tab) => set({ leftSidebarTab: tab }),

      // Right panel
      isRightPanelOpen: false,
      setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
      toggleRightPanel: () =>
        set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
      rightPanelMode: null,
      setRightPanelMode: (mode) => set({ rightPanelMode: mode }),
      rightPanelData: null,
      setRightPanelData: (data) => set({ rightPanelData: data }),
      openRightPanel: (mode, data) =>
        set({
          isRightPanelOpen: true,
          rightPanelMode: mode,
          rightPanelData: data
        }),
      closeRightPanel: () =>
        set({
          isRightPanelOpen: false,
          rightPanelMode: null,
          rightPanelData: null
        }),

      // Timeline
      isTimelineExpanded: false,
      setTimelineExpanded: (expanded) => set({ isTimelineExpanded: expanded }),
      toggleTimeline: () =>
        set((state) => ({ isTimelineExpanded: !state.isTimelineExpanded })),

      // Actions
      closeAllPanels: () =>
        set({
          isLeftSidebarOpen: false,
          isRightPanelOpen: false,
          isTimelineExpanded: false
        }),

      resetPanels: () =>
        set({
          isLeftSidebarOpen: true,
          isRightPanelOpen: false,
          rightPanelMode: null,
          rightPanelData: null,
          isTimelineExpanded: false,
          leftSidebarTab: 'data'
        })
    }),
    { name: 'PanelStore' }
  )
)
