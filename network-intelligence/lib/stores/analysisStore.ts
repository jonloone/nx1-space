import { create } from 'zustand'
import type { ChatArtifact } from '@/lib/types/chatArtifacts'

const MAX_EXPANDED_CARDS = 3

export interface ArtifactWithMetadata extends ChatArtifact {
  id: string
  timestamp: Date
  isExpanded: boolean
  isMinimized: boolean
  sourceMessageId?: string
}

interface AnalysisStore {
  artifacts: ArtifactWithMetadata[]
  currentArtifactId: string | null

  // Actions
  pushArtifact: (artifact: ChatArtifact, messageId?: string) => void
  clearArtifacts: () => void
  toggleExpand: (id: string) => void
  expandArtifact: (id: string) => void
  minimizeArtifact: (id: string) => void
  removeArtifact: (id: string) => void
  setCurrentArtifact: (id: string | null) => void
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  artifacts: [],
  currentArtifactId: null,

  pushArtifact: (artifact: ChatArtifact, messageId?: string) => {
    const newArtifact: ArtifactWithMetadata = {
      ...artifact,
      id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isExpanded: true, // New artifacts start expanded
      isMinimized: false, // Not minimized
      sourceMessageId: messageId
    }

    set((state) => {
      // Count currently expanded cards
      const expandedCount = state.artifacts.filter(a => !a.isMinimized && a.isExpanded).length

      let updatedArtifacts = [...state.artifacts]

      // If already at max expanded cards, minimize the oldest expanded card
      if (expandedCount >= MAX_EXPANDED_CARDS) {
        // Find the oldest expanded card (last in array since newest is first)
        const oldestExpandedIndex = updatedArtifacts.findIndex(a => !a.isMinimized && a.isExpanded)

        if (oldestExpandedIndex !== -1) {
          updatedArtifacts[oldestExpandedIndex] = {
            ...updatedArtifacts[oldestExpandedIndex],
            isMinimized: true,
            isExpanded: false
          }
        }
      }

      // Add new artifact to the START of array (newest first, top-left position)
      return {
        artifacts: [newArtifact, ...updatedArtifacts],
        currentArtifactId: newArtifact.id
      }
    })
  },

  clearArtifacts: () => {
    set({ artifacts: [], currentArtifactId: null })
  },

  toggleExpand: (id: string) => {
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === id
          ? { ...artifact, isExpanded: !artifact.isExpanded }
          : artifact
      )
    }))
  },

  expandArtifact: (id: string) => {
    set((state) => {
      // Count currently expanded cards
      const expandedCount = state.artifacts.filter(a => !a.isMinimized && a.isExpanded).length

      let updatedArtifacts = [...state.artifacts]

      // If already at max, minimize the oldest expanded card (excluding the one being expanded)
      if (expandedCount >= MAX_EXPANDED_CARDS) {
        const oldestExpandedIndex = updatedArtifacts.findIndex(a =>
          a.id !== id && !a.isMinimized && a.isExpanded
        )

        if (oldestExpandedIndex !== -1) {
          updatedArtifacts[oldestExpandedIndex] = {
            ...updatedArtifacts[oldestExpandedIndex],
            isMinimized: true,
            isExpanded: false
          }
        }
      }

      // Expand the target artifact
      updatedArtifacts = updatedArtifacts.map(artifact =>
        artifact.id === id
          ? { ...artifact, isExpanded: true, isMinimized: false }
          : artifact
      )

      return {
        artifacts: updatedArtifacts,
        currentArtifactId: id
      }
    })
  },

  minimizeArtifact: (id: string) => {
    set((state) => ({
      artifacts: state.artifacts.map(artifact =>
        artifact.id === id
          ? { ...artifact, isExpanded: false, isMinimized: true }
          : artifact
      )
    }))
  },

  removeArtifact: (id: string) => {
    set((state) => {
      const filtered = state.artifacts.filter(a => a.id !== id)
      const newCurrentId = state.currentArtifactId === id
        ? (filtered.length > 0 ? filtered[filtered.length - 1].id : null)
        : state.currentArtifactId

      return {
        artifacts: filtered,
        currentArtifactId: newCurrentId
      }
    })
  },

  setCurrentArtifact: (id: string | null) => {
    set({ currentArtifactId: id })
  }
}))
