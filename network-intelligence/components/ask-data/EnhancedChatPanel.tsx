'use client'

/**
 * EnhancedChatPanel - 480px Full-Height Chat Interface
 *
 * Replaces AskDataSidebar with enhanced capabilities:
 * - Full-height left panel (480px)
 * - NexusOne branding
 * - Domain selector tabs
 * - Chat message history with inline results
 * - Smart response routing (inline vs panel)
 * - Glassmorphism dark theme styling
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Code,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Globe,
  Anchor,
  Satellite,
  Layers,
  User,
  Bot,
  Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NexusOneLogo from '@/components/branding/NexusOneLogo'
import InlineChatResult from './InlineChatResult'
import { usePanelStore, type DocumentPanelMode } from '@/lib/stores/panelStore'
import {
  routeResponse,
  type RoutedChatResponse
} from '@/lib/services/responseRouterService'
import {
  getChatQueryService,
  type ChatQueryResponse,
  type QueryResult,
  type IntelDomain
} from '@/lib/services/chatQueryService'

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sql?: string
  domain?: IntelDomain
  isLoading?: boolean
  results?: QueryResult
  displayMode?: 'inline' | 'document-panel' | 'bottom-panel'
}

interface EnhancedChatPanelProps {
  onOpenDocumentPanel?: (mode: DocumentPanelMode, data: any) => void
  onOpenBottomPanel?: (results: QueryResult) => void
  onDomainChange?: (domain: IntelDomain) => void
  onShowOnMap?: (row: any) => void
  className?: string
}

// ============================================================================
// Domain Configuration
// ============================================================================

const domainConfig: Record<IntelDomain, { icon: typeof Globe; label: string; color: string }> = {
  ground: { icon: Globe, label: 'Ground', color: 'text-green-400' },
  maritime: { icon: Anchor, label: 'Maritime', color: 'text-blue-400' },
  space: { icon: Satellite, label: 'Space', color: 'text-purple-400' },
  all: { icon: Layers, label: 'All', color: 'text-gray-300' }
}

const domainExamples: Record<IntelDomain, string[]> = {
  ground: [
    'Show airports at highest altitude in the US',
    'Find hospitals within 50km of NYC'
  ],
  maritime: [
    'Show suspicious vessels in the Kattegat',
    'Find vessels with AIS gaps near Gothenburg',
    'Detect vessel rendezvous events',
    'Which vessels are loitering outside Aarhus?'
  ],
  space: [
    'Display active satellites over Europe',
    'Show ground station coverage areas'
  ],
  all: [
    'Analyze infrastructure near coordinates',
    'Find strategic locations in region'
  ]
}

// ============================================================================
// Component
// ============================================================================

export default function EnhancedChatPanel({
  onOpenDocumentPanel,
  onOpenBottomPanel,
  onDomainChange,
  onShowOnMap,
  className
}: EnhancedChatPanelProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSQL, setShowSQL] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeDomain, setActiveDomain] = useState<IntelDomain>('all')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const { openDocumentPanel, closeDocumentPanel } = usePanelStore()

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Handle domain change
  const handleDomainChange = useCallback((domain: IntelDomain) => {
    setActiveDomain(domain)
    onDomainChange?.(domain)
  }, [onDomainChange])

  // Handle query submission
  const handleSubmit = useCallback(async () => {
    if (!query.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
      domain: activeDomain
    }

    // Add user message and loading assistant message
    const loadingMessage: ChatMessage = {
      id: `msg-${Date.now()}-loading`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setQuery('')
    setIsLoading(true)
    setError(null)

    try {
      // Process query through service
      const chatService = getChatQueryService()
      const response = await chatService.processQuery(query, activeDomain)

      // Route the response to determine display mode
      const routedResponse = routeResponse(response)

      // Create assistant message with results
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: response.naturalLanguageResponse,
        timestamp: new Date(),
        sql: response.sql,
        domain: response.domain,
        results: response.results || undefined,
        displayMode: routedResponse.displayMode
      }

      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage))

      // Handle display mode routing
      if (routedResponse.displayMode === 'document-panel' && response.results) {
        // Open document panel
        const panelMode = routedResponse.documentPanelMode || 'compact-table'
        if (onOpenDocumentPanel) {
          onOpenDocumentPanel(panelMode, {
            ...response.results,
            naturalLanguageResponse: response.naturalLanguageResponse,
            agentInsights: response.agentInsights
          })
        } else {
          openDocumentPanel(panelMode, {
            ...response.results,
            naturalLanguageResponse: response.naturalLanguageResponse,
            agentInsights: response.agentInsights
          })
        }
      } else if (routedResponse.displayMode === 'bottom-panel' && response.results) {
        // Open bottom panel for large tables
        onOpenBottomPanel?.(response.results)
      }
      // 'inline' mode: results are shown in the chat message itself

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
      setMessages(prev => prev.filter(m => !m.isLoading))
    } finally {
      setIsLoading(false)
    }
  }, [query, isLoading, activeDomain, onOpenDocumentPanel, onOpenBottomPanel, openDocumentPanel])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  // Handle example click
  const handleExampleClick = useCallback((example: string) => {
    setQuery(example)
    textareaRef.current?.focus()
  }, [])

  // Handle expand to panel
  const handleExpandToPanel = useCallback((message: ChatMessage) => {
    if (message.results) {
      if (onOpenDocumentPanel) {
        onOpenDocumentPanel('compact-table', message.results)
      } else {
        openDocumentPanel('compact-table', message.results)
      }
    }
  }, [onOpenDocumentPanel, openDocumentPanel])

  // Handle expand to bottom
  const handleExpandToBottom = useCallback((message: ChatMessage) => {
    if (message.results) {
      onOpenBottomPanel?.(message.results)
    }
  }, [onOpenBottomPanel])

  return (
    <div className={cn(
      'h-full flex flex-col bg-gray-950 text-gray-100 chat-panel-enhanced',
      className
    )}>
      {/* Header with NexusOne Logo */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-800">
        <NexusOneLogo variant="light" width={140} height={24} />
      </div>

      {/* Domain Selector Tabs */}
      <div className="flex-shrink-0 border-b border-gray-800">
        <div className="flex">
          {(Object.keys(domainConfig) as IntelDomain[]).map((domain) => {
            const config = domainConfig[domain]
            const Icon = config.icon
            const isActive = activeDomain === domain

            return (
              <button
                key={domain}
                onClick={() => handleDomainChange(domain)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5',
                  'text-xs font-medium transition-all',
                  isActive
                    ? 'bg-gray-800/50 border-b-2 border-blue-500 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive && config.color)} />
                <span>{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          // Empty state with examples
          <div className="p-5 space-y-5">
            <div className="text-center py-10">
              <Sparkles className="w-10 h-10 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-base text-gray-400 mb-1">Ask questions about your data</p>
              <p className="text-sm text-gray-600">
                Domain: <span className={domainConfig[activeDomain].color}>
                  {domainConfig[activeDomain].label}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Try an example
              </label>
              <div className="space-y-2">
                {domainExamples[activeDomain].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className={cn(
                      'w-full text-left px-4 py-3 text-sm rounded-xl',
                      'bg-gray-900/50 text-gray-400 border border-gray-800',
                      'hover:bg-gray-800 hover:text-gray-200 hover:border-gray-700',
                      'transition-colors'
                    )}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="p-5 space-y-5">
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
                  'max-w-[90%] flex flex-col',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  <div
                    className={cn(
                      'rounded-xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                    )}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-400">Analyzing...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {/* SQL Toggle for assistant messages */}
                        {message.sql && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <button
                              onClick={() => setShowSQL(showSQL === message.id ? null : message.id)}
                              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300"
                            >
                              <Code className="w-3 h-3" />
                              <span>SQL</span>
                              {showSQL === message.id ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            <AnimatePresence>
                              {showSQL === message.id && (
                                <motion.pre
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2 p-3 rounded-lg bg-gray-900 text-xs text-green-400 overflow-x-auto"
                                >
                                  {message.sql}
                                </motion.pre>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Inline Results (for small datasets) */}
                  {message.role === 'assistant' &&
                   message.results &&
                   message.displayMode === 'inline' &&
                   message.results.data.length > 0 && (
                    <InlineChatResult
                      results={message.results}
                      onShowOnMap={onShowOnMap}
                      onExpandToPanel={() => handleExpandToPanel(message)}
                      onRowClick={onShowOnMap}
                      className="w-full mt-2"
                    />
                  )}

                  {/* Document Panel Indicator */}
                  {message.role === 'assistant' &&
                   message.results &&
                   message.displayMode === 'document-panel' && (
                    <button
                      onClick={() => handleExpandToPanel(message)}
                      className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg
                                 bg-slate-800/50 text-xs text-slate-400
                                 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View {message.results.data.length} results in panel</span>
                    </button>
                  )}

                  {/* Bottom Panel Indicator */}
                  {message.role === 'assistant' &&
                   message.results &&
                   message.displayMode === 'bottom-panel' && (
                    <button
                      onClick={() => handleExpandToBottom(message)}
                      className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg
                                 bg-slate-800/50 text-xs text-slate-400
                                 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View all {message.results.data.length} results in table</span>
                    </button>
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

        {/* Error Display */}
        {error && (
          <div className="mx-5 mb-4 p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-5 border-t border-gray-800">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${domainConfig[activeDomain].label.toLowerCase()} data...`}
            rows={3}
            className={cn(
              'w-full px-4 py-3 pr-14 rounded-xl resize-none',
              'bg-gray-900 border border-gray-700',
              'text-gray-100 placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
              'transition-all text-sm'
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
