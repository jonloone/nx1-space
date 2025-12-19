'use client'

/**
 * MaritimeChatPanel - Full-height chat interface for maritime intelligence
 *
 * Features:
 * - NexusOne branding header
 * - Message history with user/assistant styling
 * - Natural language query input
 * - Query preview showing interpretation
 * - Quick action chips for common queries
 * - Inline result summaries
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Send,
  Loader2,
  Ship,
  AlertTriangle,
  Anchor,
  Route,
  BarChart3,
  User,
  Bot,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NexusOneLogo from '@/components/branding/NexusOneLogo'
import type { ChatMessage, MaritimeQueryResult } from '@/app/maritime-intel/page'

// ============================================================================
// Types
// ============================================================================

interface MaritimeChatPanelProps {
  messages: ChatMessage[]
  onSubmit: (query: string) => void
  selectedFeature?: any
  className?: string
}

// ============================================================================
// Quick Actions
// ============================================================================

const quickActions = [
  { icon: Ship, label: 'All Vessels', query: 'Show all vessels in the region' },
  { icon: AlertTriangle, label: 'Anomalies', query: 'Find all anomalies' },
  { icon: Anchor, label: 'Ports', query: 'Show port activity' },
  { icon: BarChart3, label: 'Statistics', query: 'Show vessel type breakdown' },
]

const exampleQueries = [
  'Show all cargo vessels',
  'Find dark vessel anomalies (AIS gaps)',
  'Which vessels are moving faster than 15 knots?',
  'Show ship-to-ship rendezvous events',
  'Port activity at Gothenburg',
  'Find loitering vessels outside ports',
]

// ============================================================================
// Component
// ============================================================================

export default function MaritimeChatPanel({
  messages,
  onSubmit,
  selectedFeature,
  className
}: MaritimeChatPanelProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Check if loading
  useEffect(() => {
    setIsLoading(messages.some(m => m.isLoading))
  }, [messages])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!query.trim() || isLoading) return
    onSubmit(query.trim())
    setQuery('')
  }, [query, isLoading, onSubmit])

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  // Handle quick action click
  const handleQuickAction = useCallback((actionQuery: string) => {
    onSubmit(actionQuery)
  }, [onSubmit])

  // Handle example click
  const handleExampleClick = useCallback((example: string) => {
    setQuery(example)
    textareaRef.current?.focus()
  }, [])

  return (
    <div className={cn(
      'h-full flex flex-col bg-gray-950 text-gray-100',
      className
    )}>
      {/* Header with Logo */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-800">
        <NexusOneLogo variant="light" width={140} height={24} />
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs text-gray-500">Maritime Intelligence</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800/50">
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.query)}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'text-xs font-medium transition-all',
                'bg-gray-800/50 text-gray-400 border border-gray-700/50',
                'hover:bg-gray-800 hover:text-gray-200 hover:border-gray-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          // Empty state with examples
          <div className="p-5 space-y-6">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-lg text-gray-300 mb-2">Ask about AIS data</p>
              <p className="text-sm text-gray-500">
                Explore vessels, detect anomalies, analyze patterns
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Try an example
              </label>
              <div className="space-y-2">
                {exampleQueries.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className={cn(
                      'w-full text-left px-4 py-3 text-sm rounded-xl',
                      'bg-gray-900/50 text-gray-400 border border-gray-800',
                      'hover:bg-gray-800 hover:text-gray-200 hover:border-gray-700',
                      'transition-colors flex items-center justify-between group'
                    )}
                  >
                    <span>{example}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="p-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                )}

                <div className={cn(
                  'max-w-[85%] flex flex-col',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  {/* Message bubble */}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                    )}
                  >
                    {message.isLoading ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          <span className="text-sm text-gray-400">Processing...</span>
                        </div>
                        {message.queryPreview && (
                          <p className="text-xs text-gray-500 italic">
                            {message.queryPreview}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Query preview (for completed messages) */}
                  {message.role === 'assistant' && !message.isLoading && message.queryPreview && (
                    <div className="mt-1.5 px-3 py-1 rounded-lg bg-gray-800/50 text-xs text-gray-500">
                      {message.queryPreview.replace('...', '')}
                    </div>
                  )}

                  {/* Result summary badge */}
                  {message.result && message.result.data.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <div className="px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700/50">
                        {message.result.data.length} results
                      </div>
                      <span className="text-gray-600">|</span>
                      <span>{message.result.type}</span>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Feature Info */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 px-4 py-3 border-t border-gray-800 bg-gray-900/50"
          >
            <div className="text-xs text-gray-500 mb-1">Selected</div>
            <div className="text-sm font-medium text-white">
              {selectedFeature.name || selectedFeature.vessel || selectedFeature.mmsi || 'Unknown'}
            </div>
            {selectedFeature.type && (
              <div className="text-xs text-gray-400 mt-0.5">
                {selectedFeature.type}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about vessels, anomalies, routes..."
            rows={2}
            disabled={isLoading}
            className={cn(
              'w-full px-4 py-3 pr-14 rounded-xl resize-none',
              'bg-gray-900 border border-gray-700',
              'text-gray-100 placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
              'transition-all text-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            size="icon"
            className={cn(
              'absolute right-3 bottom-3 h-9 w-9',
              'bg-blue-600 hover:bg-blue-500',
              'disabled:bg-gray-700 disabled:text-gray-500'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
