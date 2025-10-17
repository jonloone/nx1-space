'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatArtifact } from '@/lib/types/chatArtifacts'
import ArtifactRenderer from './artifacts/ArtifactRenderer'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  artifact?: ChatArtifact // NEW: Support for rich artifacts
  metadata?: {
    entitiesFiltered?: number
    analysisType?: string
    error?: string
  }
}

interface AIChatPanelProps {
  onQuery: (query: string) => Promise<ChatMessage>
  isLoading?: boolean
  placeholder?: string
}

const exampleQueries = [
  "Show all active vehicles",
  "Find vehicles on Market Street",
  "Create 5km buffer around alerts",
  "Show vehicles within 10km of downtown",
  "Highlight all delayed deliveries",
  "What's the average vehicle speed?"
]

export default function AIChatPanel({
  onQuery,
  isLoading = false,
  placeholder = "Ask about your fleet..."
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hi! I'm Kue, your AI GIS assistant. I can help you analyze your fleet. Try asking:\n\n• Show all active vehicles\n• Find vehicles on Market Street\n• Create a 5km buffer around alerts\n• Show idle vehicles near downtown\n• Show all (reset filters)",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    <div className="flex flex-col h-full bg-white border-l border-border shadow-mundi-md">
      {/* Header - Clean, Mundi-inspired */}
      <div className="p-5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-mundi-lg bg-mundi-300 flex items-center justify-center shadow-mundi-sm">
            <Bot className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-base">Kue AI</h3>
            <p className="text-muted-foreground text-sm">Your GIS assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-5" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-9 h-9 rounded-full bg-mundi-200 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-mundi-700" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-mundi-lg p-4 shadow-mundi-sm ${
                  message.role === 'user'
                    ? 'bg-mundi-300/80 text-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {/* Render artifact if present */}
                {message.artifact && (
                  <div className="mt-3">
                    <ArtifactRenderer artifact={message.artifact} />
                  </div>
                )}

                {message.metadata?.entitiesFiltered !== undefined && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    {message.metadata.entitiesFiltered} entities found
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-foreground" />
                </div>
              )}
            </div>
          ))}
          {processing && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-mundi-200 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-mundi-700" />
              </div>
              <div className="bg-muted rounded-mundi-lg p-4 shadow-mundi-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Example Queries */}
      {messages.length === 1 && (
        <div className="px-5 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.slice(0, 3).map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(query)}
                className="text-xs px-3 py-1.5 rounded-mundi-md bg-white hover:bg-mundi-200/50 text-foreground border border-border transition-all hover:shadow-mundi-sm"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-5 border-t border-border bg-muted/30">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={processing}
            className="flex-1 bg-white border-border text-foreground placeholder:text-muted-foreground rounded-mundi-md focus:ring-2 focus:ring-mundi-300 focus:border-mundi-300"
          />
          <Button
            type="submit"
            disabled={!input.trim() || processing}
            size="icon"
            className="bg-mundi-300 hover:bg-mundi-400 text-foreground shadow-mundi-sm hover:shadow-mundi-md transition-all rounded-mundi-md"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
