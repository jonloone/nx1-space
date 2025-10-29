import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type PanelDetent = 'collapsed' | 'medium' | 'expanded' | 'hidden'

export type PanelContentType =
  | 'search-results'
  | 'poi-context'
  | 'intelligence-analysis'
  | 'timeline'
  | 'document'
  | 'help'

export interface PanelContent {
  type: PanelContentType
  data: any
  title?: string
  subtitle?: string
}

// Right panel modes for alert visualization
export type RightPanelMode = 'alert' | 'cluster' | null

export const DETENT_CONFIG = {
  collapsed: 0.20,  // 20% viewport height
  medium: 0.50,     // 50% viewport height
  expanded: 0.85,   // 85% viewport height
  hidden: 0         // Hidden
}

interface PanelState {
  // Bottom panel state
  isOpen: boolean
  detent: PanelDetent
  content: PanelContent | null
  isDragging: boolean
  currentHeight: number

  // Bottom panel actions
  openPanel: (content: PanelContent, detent?: PanelDetent) => void
  closePanel: () => void
  setDetent: (detent: PanelDetent) => void
  setDragging: (dragging: boolean) => void
  setCurrentHeight: (height: number) => void
  updateContent: (content: PanelContent) => void
  getDetentHeight: (detent: PanelDetent) => number

  // Right panel state
  rightPanelMode: RightPanelMode
  rightPanelData: any

  // Right panel actions
  setRightPanelMode: (mode: RightPanelMode) => void
  setRightPanelData: (data: any) => void
  openRightPanel: (mode: RightPanelMode, data?: any) => void
  closeRightPanel: () => void
}

export const usePanelStore = create<PanelState>()(
  devtools(
    (set, get) => ({
      // Bottom panel state
      isOpen: false,
      detent: 'hidden',
      content: null,
      isDragging: false,
      currentHeight: 0,

      // Bottom panel actions
      openPanel: (content, detent = 'collapsed') => {
        set({
          isOpen: true,
          detent,
          content,
          currentHeight: get().getDetentHeight(detent)
        })
      },

      closePanel: () => {
        set({ isOpen: false, detent: 'hidden', content: null, currentHeight: 0 })
      },

      setDetent: (detent) => {
        set({ detent, currentHeight: get().getDetentHeight(detent) })
      },

      setDragging: (dragging) => {
        set({ isDragging: dragging })
      },

      setCurrentHeight: (height) => {
        set({ currentHeight: height })
      },

      updateContent: (content) => {
        set({ content })
      },

      getDetentHeight: (detent) => {
        if (typeof window === 'undefined') return 0
        const vh = window.innerHeight
        return vh * DETENT_CONFIG[detent]
      },

      // Right panel state
      rightPanelMode: null,
      rightPanelData: null,

      // Right panel actions
      setRightPanelMode: (mode) => {
        set({ rightPanelMode: mode })
      },

      setRightPanelData: (data) => {
        set({ rightPanelData: data })
      },

      openRightPanel: (mode, data) => {
        set({ rightPanelMode: mode, rightPanelData: data || null })
      },

      closeRightPanel: () => {
        set({ rightPanelMode: null, rightPanelData: null })
      }
    }),
    { name: 'PanelStore' }
  )
)

// Helper function to get closest detent based on current height
export function getClosestDetent(height: number): PanelDetent {
  if (typeof window === 'undefined') return 'hidden'

  const vh = window.innerHeight
  const percentage = height / vh

  const distances = {
    hidden: Math.abs(percentage - DETENT_CONFIG.hidden),
    collapsed: Math.abs(percentage - DETENT_CONFIG.collapsed),
    medium: Math.abs(percentage - DETENT_CONFIG.medium),
    expanded: Math.abs(percentage - DETENT_CONFIG.expanded)
  }

  const closest = Object.entries(distances).reduce((prev, curr) =>
    curr[1] < prev[1] ? curr : prev
  )

  return closest[0] as PanelDetent
}

// Helper function to determine target detent based on velocity and direction
export function getDetentFromVelocity(
  currentHeight: number,
  velocityY: number,
  directionY: number
): PanelDetent {
  if (typeof window === 'undefined') return 'hidden'

  const vh = window.innerHeight
  const VELOCITY_THRESHOLD = 0.5

  // Fast fling down - close or collapse
  if (velocityY > VELOCITY_THRESHOLD && directionY > 0) {
    return currentHeight < vh * 0.35 ? 'hidden' : 'collapsed'
  }

  // Fast fling up - expand
  if (velocityY < -VELOCITY_THRESHOLD && directionY < 0) {
    return currentHeight < vh * 0.35 ? 'medium' : 'expanded'
  }

  // Slow release - snap to closest detent
  return getClosestDetent(currentHeight)
}
