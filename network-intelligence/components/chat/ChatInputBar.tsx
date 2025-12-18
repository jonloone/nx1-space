'use client'

/**
 * ChatInputBar - Premium Chat-First Interface
 *
 * Fixed-position bottom chat input with glassmorphism styling.
 * Designed for the maritime intelligence platform.
 *
 * Features:
 * - Fixed bottom position
 * - Premium glassmorphism design
 * - Domain-specific suggestions
 * - Quick action buttons
 * - Response preview card
 * - Loading states
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Search, Ship, Route, AlertTriangle, Anchor, X, ChevronUp, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ChatDomain = 'maritime' | 'ground' | 'space' | 'all'

export interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  query: string
}

export interface ChatResponse {
  id: string
  query: string
  summary: string
  type: 'vessels' | 'routes' | 'anomalies' | 'ports' | 'general'
  resultCount?: number
  timestamp: Date
}

export interface ChatInputBarProps {
  onSubmit: (query: string) => void
  onExpand?: () => void
  placeholder?: string
  domain?: ChatDomain
  suggestions?: string[]
  isLoading?: boolean
  lastResponse?: ChatResponse | null
  className?: string
}

// ============================================================================
// Quick Actions by Domain
// ============================================================================

const MARITIME_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'vessels',
    label: 'Vessels',
    icon: Ship,
    query: 'Show all vessels in the area'
  },
  {
    id: 'routes',
    label: 'Routes',
    icon: Route,
    query: 'Analyze shipping routes'
  },
  {
    id: 'anomalies',
    label: 'Anomalies',
    icon: AlertTriangle,
    query: 'Show detected anomalies'
  },
  {
    id: 'ports',
    label: 'Ports',
    icon: Anchor,
    query: 'Port activity analysis'
  }
]

const DEFAULT_SUGGESTIONS: Record<ChatDomain, string[]> = {
  maritime: [
    'Show suspicious vessels in the Kattegat',
    'Find vessels with AIS gaps',
    'Which vessels are loitering?',
    'Analyze port congestion'
  ],
  ground: [
    'Show ground stations with high utilization',
    'Find coverage gaps'
  ],
  space: [
    'Track satellites overhead',
    'Show orbital debris'
  ],
  all: [
    'What intelligence is available?',
    'Show all anomalies'
  ]
}

// ============================================================================
// Component
// ============================================================================

export default function ChatInputBar({
  onSubmit,
  onExpand,
  placeholder,
  domain = 'maritime',
  suggestions: customSuggestions,
  isLoading = false,
  lastResponse,
  className
}: ChatInputBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = customSuggestions || DEFAULT_SUGGESTIONS[domain]
  const quickActions = domain === 'maritime' ? MARITIME_QUICK_ACTIONS : []

  // Keyboard shortcut for focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const activeEl = document.activeElement
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
        if (!isInput) {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || isLoading) return

    onSubmit(query.trim())
    setQuery('')
    setShowSuggestions(false)
  }, [query, isLoading, onSubmit])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onSubmit(suggestion)
    setShowSuggestions(false)
  }, [onSubmit])

  const handleQuickAction = useCallback((action: QuickAction) => {
    onSubmit(action.query)
  }, [onSubmit])

  const defaultPlaceholder = domain === 'maritime'
    ? 'Ask about vessels, routes, anomalies...'
    : 'Ask anything...'

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        className
      )}
    >
      {/* Response Preview Card */}
      <AnimatePresence>
        {lastResponse && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mb-2"
          >
            <div className="glass-stats-card p-4 max-w-xl mx-auto">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">
                    {lastResponse.resultCount !== undefined
                      ? `${lastResponse.resultCount} results`
                      : 'Analysis complete'}
                  </p>
                  <p className="text-sm text-slate-200 line-clamp-2">
                    {lastResponse.summary}
                  </p>
                </div>
                {onExpand && (
                  <button
                    onClick={onExpand}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && isFocused && suggestions.length > 0 && !query && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="mx-4 mb-2"
          >
            <div className="glass-panel-premium rounded-xl p-3 max-w-2xl mx-auto">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 px-1">
                Try asking
              </p>
              <div className="space-y-1">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300
                             hover:bg-slate-700/50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Bar */}
      <div className="glass-chat-bar px-4 py-3">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          {quickActions.length > 0 && !isFocused && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                             glass-button whitespace-nowrap
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              {/* Search Icon */}
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  setIsFocused(true)
                  setShowSuggestions(true)
                }}
                onBlur={() => {
                  // Delay to allow click events on suggestions
                  setTimeout(() => setIsFocused(false), 150)
                }}
                placeholder={placeholder || defaultPlaceholder}
                disabled={isLoading}
                className="w-full h-12 pl-12 pr-24 rounded-xl text-base
                         glass-input-field text-slate-200 placeholder:text-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '16px' }}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Clear Button */}
              {query && !isLoading && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-14 p-1.5 rounded-full hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-2 h-8 w-10 rounded-lg flex items-center justify-center
                         bg-blue-600 hover:bg-blue-500 text-white
                         disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed
                         transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Analyzing...</span>
            </div>
          )}

          {/* Keyboard Hint */}
          {!isFocused && !isLoading && (
            <div className="hidden md:flex items-center justify-center gap-1 mt-2 text-[10px] text-slate-600">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">/</kbd> to focus
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
