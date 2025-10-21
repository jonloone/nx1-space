'use client'

/**
 * Investigation Chat Component
 *
 * AI-powered chat interface for investigation queries
 * Triggers map actions and provides intelligence insights
 */

import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatMessage, AgentAction, AgentResponse } from '@/lib/agents/investigationAgent'
import type { InvestigationDemoData } from '@/lib/demo/investigation-demo-data'

interface InvestigationChatProps {
  investigationData: InvestigationDemoData
  onAction?: (action: AgentAction) => void
}

export default function InvestigationChat({
  investigationData,
  onAction
}: InvestigationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Load suggested questions on mount
  useEffect(() => {
    loadSuggestions()
  }, [])

  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `🔍 **Investigation Assistant Active**

I'm here to help you analyze ${investigationData.subject.caseNumber}. I can answer questions about:

• Subject's movements and patterns
• Suspicious locations and anomalies
• Timeline reconstruction
• Intelligence analysis and recommendations

Ask me anything about the investigation, or try one of the suggested questions below.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSuggestions() {
    try {
      const response = await fetch('/api/investigation/chat')
      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  async function sendMessage(message: string) {
    if (!message.trim() || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send to API
      const response = await fetch('/api/investigation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          conversationHistory: messages,
          context: {
            subject: investigationData.subject,
            locations: investigationData.locationStops,
            timeline: {
              start: investigationData.subject.startDate.toISOString(),
              end: investigationData.subject.endDate.toISOString()
            },
            scenario: (investigationData as any).scenario
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const agentResponse: AgentResponse = await response.json()

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: agentResponse.message,
        timestamp: new Date(),
        actions: agentResponse.actions
      }

      setMessages(prev => [...prev, assistantMessage])

      // Trigger actions
      if (agentResponse.actions && onAction) {
        agentResponse.actions.forEach(action => {
          console.log('🎬 Executing action:', action.type, action.params)
          onAction(action)
        })
      }
    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ I apologize, but I encountered an error processing your query. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSuggestionClick(suggestion: string) {
    sendMessage(suggestion)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E5E5E5]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
          <h3 className="font-semibold text-sm text-[#171717]">Investigation Assistant</h3>
        </div>
        <p className="text-[10px] text-[#737373] mt-1">
          {investigationData.subject.caseNumber} • AI-Powered Analysis
        </p>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-[#176BF8] text-white'
                    : 'bg-[#F5F5F5] text-[#171717]'
                }`}
              >
                {message.role === 'assistant' && message.content.startsWith('🔍') ? (
                  // Welcome message with markdown-like formatting
                  <div className="text-xs space-y-2">
                    {message.content.split('\n\n').map((paragraph, i) => (
                      <div key={i}>
                        {paragraph.split('\n').map((line, j) => {
                          if (line.startsWith('•')) {
                            return (
                              <div key={j} className="ml-2 text-[11px] text-[#525252]">
                                {line}
                              </div>
                            )
                          }
                          if (line.includes('**')) {
                            const parts = line.split('**')
                            return (
                              <div key={j} className="font-semibold">
                                {parts.map((part, k) => k % 2 === 1 ? <strong key={k}>{part}</strong> : part)}
                              </div>
                            )
                          }
                          return <div key={j}>{line}</div>
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs whitespace-pre-wrap">{message.content}</div>
                )}

                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#E5E5E5]/30">
                    <div className="text-[10px] text-[#737373]">
                      {message.actions.map((action, i) => (
                        <div key={i}>🎬 {action.type}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[9px] mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-[#A3A3A3]'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#F5F5F5] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-[#737373]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#737373] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#737373] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#737373] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Analyzing...
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      {messages.length <= 1 && suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-[#E5E5E5] bg-[#FAFAFA]">
          <div className="text-[10px] text-[#737373] mb-2">Suggested questions:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-[10px] px-2 py-1 bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] rounded text-[#525252] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#E5E5E5]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the investigation..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176BF8] focus:border-transparent disabled:bg-[#F5F5F5] disabled:text-[#A3A3A3]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-[#176BF8] hover:bg-[#1557c7] disabled:bg-[#E5E5E5] disabled:text-[#A3A3A3] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
