/**
 * Chat Store
 *
 * Manages conversation state for the chat-first interface
 * - Message history
 * - Query context
 * - Intent results
 * - Loading states
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  intent?: IntentResult
  error?: boolean
}

export interface IntentResult {
  type: 'search' | 'analysis' | 'layer' | 'temporal' | 'action' | 'help' | 'unknown'
  entities: ExtractedEntity[]
  confidence: number
  query: string
}

export interface ExtractedEntity {
  type: 'location' | 'category' | 'time' | 'significance' | 'layer' | 'template'
  value: string
  coordinates?: [number, number] // [lng, lat]
}

export interface ConversationContext {
  viewport: {
    bounds?: [number, number, number, number] // [west, south, east, north]
    center?: [number, number]
    zoom?: number
  }
  enabledLayers: string[]
  selectedFeatures: string[]
  recentQueries: string[]
  lastIntent?: IntentResult
}

interface ChatStore {
  // Messages
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void

  // Loading state
  isLoading: boolean
  setLoading: (loading: boolean) => void

  // Conversation context
  context: ConversationContext
  updateContext: (updates: Partial<ConversationContext>) => void

  // Query handling
  sendQuery: (query: string) => Promise<void>

  // Suggestions
  suggestions: string[]
  setSuggestions: (suggestions: string[]) => void
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        messages: [],
        isLoading: false,
        context: {
          viewport: {},
          enabledLayers: [],
          selectedFeatures: [],
          recentQueries: []
        },
        suggestions: [
          "Show suspicious locations",
          "Explore this neighborhood",
          "What can you do?",
          "Generate a 72-hour scenario"
        ],

        // Add message to history
        addMessage: (message) => {
          const newMessage: ChatMessage = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
          }

          set((state) => ({
            messages: [...state.messages, newMessage]
          }))
        },

        // Clear all messages
        clearMessages: () => {
          set({ messages: [] })
        },

        // Set loading state
        setLoading: (loading) => {
          set({ isLoading: loading })
        },

        // Update conversation context
        updateContext: (updates) => {
          set((state) => ({
            context: {
              ...state.context,
              ...updates
            }
          }))
        },

        // Send query (will be implemented with query handler)
        sendQuery: async (query: string) => {
          const { addMessage, setLoading, updateContext, context } = get()

          // Add user message
          addMessage({
            role: 'user',
            content: query
          })

          // Set loading
          setLoading(true)

          try {
            // Update recent queries
            const recentQueries = [query, ...context.recentQueries.slice(0, 4)]
            updateContext({ recentQueries })

            // Query will be processed by query handler registry
            // This is a placeholder - actual processing happens in components
            // that have access to the query handler registry

          } catch (error) {
            console.error('Query error:', error)
            addMessage({
              role: 'assistant',
              content: 'Sorry, I encountered an error processing your query. Please try again.',
              error: true
            })
          } finally {
            setLoading(false)
          }
        },

        // Set suggestions
        setSuggestions: (suggestions) => {
          set({ suggestions })
        }
      }),
      {
        name: 'citizen360-chat-storage',
        partialize: (state) => ({
          // Only persist messages and recent queries
          messages: state.messages.slice(-50), // Keep last 50 messages
          context: {
            recentQueries: state.context.recentQueries
          }
        })
      }
    ),
    { name: 'ChatStore' }
  )
)

// Helper function to get contextual suggestions based on state
export function getContextualSuggestions(context: ConversationContext): string[] {
  const suggestions: string[] = []

  // Viewport-based suggestions
  if (context.viewport.zoom) {
    if (context.viewport.zoom > 14) {
      suggestions.push("Show buildings", "Find restaurants here")
    } else if (context.viewport.zoom > 10) {
      suggestions.push("Analyze this neighborhood", "Show hospitals")
    } else {
      suggestions.push("Explore this region", "Show major landmarks")
    }
  }

  // Recent query follow-ups
  const lastQuery = context.recentQueries[0]
  if (lastQuery) {
    if (lastQuery.toLowerCase().includes('hospital')) {
      suggestions.push("Which one is closest?", "Show trauma centers only")
    } else if (lastQuery.toLowerCase().includes('suspicious')) {
      suggestions.push("View timeline", "Show full analysis")
    }
  }

  // Layer-based suggestions
  if (context.enabledLayers.length === 0) {
    suggestions.push("What can you show me?")
  }

  return suggestions.slice(0, 4) // Max 4 suggestions
}
