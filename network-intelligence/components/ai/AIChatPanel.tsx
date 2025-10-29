'use client'

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { ArrowUp, Loader2, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatArtifact } from '@/lib/types/chatArtifacts'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  artifact?: ChatArtifact // Support for rich artifacts
  mapAction?: MapAction // Support for map interactions
  metadata?: {
    entitiesFiltered?: number
    analysisType?: string
    error?: string
  }
}

export interface MapAction {
  type: 'flyTo' | 'addMarkers' | 'addLayer' | 'clearMarkers'
  coordinates?: [number, number]
  zoom?: number
  pitch?: number
  bearing?: number
  markers?: Array<{
    id: string
    coordinates: [number, number]
    properties?: Record<string, any>
  }>
  markerStyle?: string
  layerId?: string
  layerData?: any
}

interface AIChatPanelProps {
  onQuery: (query: string) => Promise<ChatMessage>
  isLoading?: boolean
  placeholder?: string
}

// Exposed ref API for programmatic control
export interface AIChatPanelRef {
  injectMessage: (message: ChatMessage) => void
  collapse: () => void
  expand: () => void
}

const exampleQueries = [
  "Show me active alerts for Marcus Rahman",
  "What are the critical alerts in the past 24 hours?",
  "Analyze patterns for subject ID 1138",
  "Show me all behavioral anomalies in Manhattan",
  "Review timeline for Operation Nightfall",
  "Find related alerts near LaGuardia Airport"
]

const AIChatPanel = forwardRef<AIChatPanelRef, AIChatPanelProps>(function AIChatPanel({
  onQuery,
  isLoading = false,
  placeholder = "Ask about investigations, search locations, or analyze patterns..."
}, ref) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Expose injectMessage method via ref
  useImperativeHandle(ref, () => ({
    injectMessage: (message: ChatMessage) => {
      setMessages((prev) => [...prev, message])
    }
  }), [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || processing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setProcessing(true)

    try {
      const response = await onQuery(input.trim())
      setMessages((prev) => [...prev, response])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) }
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setProcessing(false)
    }
  }

  const handleExampleClick = (query: string) => {
    setInput(query)
  }

  return (
    <div className="flex flex-col h-full bg-white shadow-sm">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-mundi-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-mundi-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {message.metadata?.entitiesFiltered !== undefined && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    {message.metadata.entitiesFiltered} entities found
                  </p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-700" />
                </div>
              )}
            </div>
          ))}
          {processing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-mundi-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-900">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={processing}
            className="flex-1 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-mundi-500 focus:border-mundi-500 focus:bg-white transition-colors"
          />
          <Button
            type="submit"
            disabled={!input.trim() || processing}
            size="icon"
            className="w-8 h-8 bg-mundi-500 hover:bg-mundi-600 text-white shadow-sm hover:shadow-md transition-all rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
})

export default AIChatPanel
