'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
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
      content: "👋 Hi! I can help you analyze your fleet. Try asking:\n\n• Show all active vehicles\n• Find vehicles on Market Street\n• Create a 5km buffer around alerts\n• Show idle vehicles near downtown\n• Show all (reset filters)",
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
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm border-l border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
            <p className="text-white/60 text-xs">Natural language fleet queries</p>
          </div>
        </div>
      </div>

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
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500/20 text-white'
                    : 'bg-white/5 text-white/90'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.metadata?.entitiesFiltered !== undefined && (
                  <p className="text-xs text-white/60 mt-1">
                    {message.metadata.entitiesFiltered} entities found
                  </p>
                )}
                <p className="text-xs text-white/40 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}
          {processing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/60">
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
        <div className="px-4 py-2 border-t border-white/10">
          <p className="text-xs text-white/60 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.slice(0, 3).map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(query)}
                className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={processing}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <Button
            type="submit"
            disabled={!input.trim() || processing}
            size="icon"
            className="bg-purple-500 hover:bg-purple-600"
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
