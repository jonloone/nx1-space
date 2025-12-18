'use client'

/**
 * Ask Data Sidebar
 * Natural language query interface for data exploration
 * Features:
 * - NexusOne branding
 * - Conversational chat history
 * - Domain selector (Ground/Maritime/Space/All)
 * - Real-time AI-powered query processing
 */

import React, { useState, useRef, useEffect } from 'react'
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
  Bot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NexusOneLogo from '@/components/branding/NexusOneLogo'

// Domain types for multi-domain intelligence
export type IntelDomain = 'ground' | 'maritime' | 'space' | 'all'

interface QueryResult {
  sql: string
  data: any[]
  columns: string[]
  executionTime?: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sql?: string
  domain?: IntelDomain
  isLoading?: boolean
}

interface AskDataSidebarProps {
  onQuerySubmit?: (query: string, domain: IntelDomain) => Promise<QueryResult | null>
  onResultsReceived?: (results: QueryResult) => void
  onDomainChange?: (domain: IntelDomain) => void
  className?: string
}

// Domain configuration
const domainConfig: Record<IntelDomain, { icon: typeof Globe; label: string; color: string }> = {
  ground: { icon: Globe, label: 'Ground', color: 'text-green-400' },
  maritime: { icon: Anchor, label: 'Maritime', color: 'text-blue-400' },
  space: { icon: Satellite, label: 'Space', color: 'text-purple-400' },
  all: { icon: Layers, label: 'All', color: 'text-gray-300' }
}

export default function AskDataSidebar({
  onQuerySubmit,
  onResultsReceived,
  onDomainChange,
  className
}: AskDataSidebarProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSQL, setShowSQL] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDomain, setActiveDomain] = useState<IntelDomain>('all')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Example queries per domain
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

  const handleDomainChange = (domain: IntelDomain) => {
    setActiveDomain(domain)
    onDomainChange?.(domain)
  }

  const handleSubmit = async () => {
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
      // Generate SQL from natural language query
      const mockSQL = generateMockSQL(query, activeDomain)

      // Execute query if handler provided
      let results: QueryResult | null = null
      if (onQuerySubmit) {
        results = await onQuerySubmit(query, activeDomain)
      } else {
        // Demo mode - generate mock results
        results = generateMockResults(query, activeDomain)
      }

      // Replace loading message with actual response
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: generateAssistantResponse(query, results, activeDomain),
        timestamp: new Date(),
        sql: mockSQL,
        domain: activeDomain
      }

      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage))

      if (results) {
        onResultsReceived?.(results)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
      // Remove loading message on error
      setMessages(prev => prev.filter(m => !m.isLoading))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
    textareaRef.current?.focus()
  }

  return (
    <div className={cn(
      'h-full flex flex-col bg-gray-950 text-gray-100',
      className
    )}>
      {/* Header with NexusOne Logo */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-800">
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
          <div className="p-4 space-y-4">
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-gray-500 mb-1">Ask questions about your data</p>
              <p className="text-xs text-gray-600">
                Domain: <span className={domainConfig[activeDomain].color}>
                  {domainConfig[activeDomain].label}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Try an example
              </label>
              <div className="space-y-1.5">
                {domainExamples[activeDomain].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-lg',
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
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2',
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
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                          <button
                            onClick={() => setShowSQL(!showSQL)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300"
                          >
                            <Code className="w-3 h-3" />
                            <span>SQL</span>
                            {showSQL ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          <AnimatePresence>
                            {showSQL && (
                              <motion.pre
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 p-2 rounded bg-gray-900 text-xs text-green-400 overflow-x-auto"
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

                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${domainConfig[activeDomain].label.toLowerCase()} data...`}
            rows={2}
            className={cn(
              'w-full px-3 py-2.5 pr-12 rounded-lg resize-none',
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
              'absolute right-2 bottom-2 h-8 w-8',
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

// Generate assistant response based on results
function generateAssistantResponse(query: string, results: QueryResult | null, domain: IntelDomain): string {
  if (!results || results.data.length === 0) {
    return `I couldn't find any ${domain === 'all' ? '' : domain + ' '}data matching your query. Try refining your search or selecting a different domain.`
  }

  const count = results.data.length
  const domainLabel = domain === 'all' ? 'locations' : `${domain} entities`

  return `Found **${count} ${domainLabel}** matching your query. The results have been displayed on the map and in the data panel below. Click any row to zoom to that location.`
}

// Helper: Generate mock SQL from natural language (for demo)
function generateMockSQL(query: string, domain: IntelDomain): string {
  const lowerQuery = query.toLowerCase()

  // Domain-specific table prefixes
  const tablePrefix = domain === 'all' ? '' : `${domain}_`

  if (lowerQuery.includes('airport') || (domain === 'ground' && lowerQuery.includes('altitude'))) {
    return `SELECT
  id,
  type,
  name,
  latitude,
  longitude,
  elevation
FROM ${tablePrefix}airports
WHERE country = 'US'
ORDER BY elevation DESC
LIMIT 10;`
  }

  if (lowerQuery.includes('hospital')) {
    return `SELECT
  id,
  name,
  address,
  latitude,
  longitude,
  ST_Distance(
    location::geography,
    ST_MakePoint(-74.006, 40.7128)::geography
  ) / 1000 as distance_km
FROM ${tablePrefix}hospitals
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(-74.006, 40.7128)::geography,
  50000
)
ORDER BY distance_km;`
  }

  if (domain === 'maritime' || lowerQuery.includes('seaport') || lowerQuery.includes('port') || lowerQuery.includes('shipping')) {
    return `SELECT
  id,
  name,
  port_type,
  cargo_volume_teu,
  latitude,
  longitude
FROM maritime_ports
WHERE port_type IN ('container', 'bulk', 'ro-ro')
ORDER BY cargo_volume_teu DESC
LIMIT 20;`
  }

  if (domain === 'space' || lowerQuery.includes('satellite') || lowerQuery.includes('ground station')) {
    return `SELECT
  norad_id,
  name,
  orbit_type,
  altitude_km,
  inclination_deg,
  latitude,
  longitude
FROM space_objects
WHERE object_type = 'satellite'
  AND status = 'active'
ORDER BY altitude_km ASC
LIMIT 20;`
  }

  if (lowerQuery.includes('building')) {
    return `SELECT
  id,
  name,
  class,
  height,
  address,
  latitude,
  longitude
FROM ${tablePrefix}buildings
WHERE class = 'commercial'
ORDER BY height DESC
LIMIT 20;`
  }

  // Default generic query
  return `SELECT
  id,
  name,
  type,
  latitude,
  longitude
FROM ${tablePrefix}places
WHERE name ILIKE '%${query.split(' ').slice(0, 3).join('%')}%'
LIMIT 20;`
}

// Helper: Generate mock results (for demo)
function generateMockResults(query: string, domain: IntelDomain): QueryResult {
  const lowerQuery = query.toLowerCase()

  // Ground domain or airport query
  if (lowerQuery.includes('airport') || (domain === 'ground' && lowerQuery.includes('altitude'))) {
    return {
      sql: generateMockSQL(query, domain),
      columns: ['ID', 'TYPE', 'NAME', 'ELEVATION', 'LATITUDE', 'LONGITUDE'],
      data: [
        { id: 12243, type: 'large_airport', name: 'Denver International Airport', elevation: 5431, lat: 39.8561, lng: -104.6737 },
        { id: 18945, type: 'medium_airport', name: 'Telluride Regional Airport', elevation: 9070, lat: 37.9538, lng: -107.9084 },
        { id: 19856, type: 'small_airport', name: 'Leadville Lake County Airport', elevation: 9927, lat: 39.2203, lng: -106.3167 },
        { id: 16032, type: 'medium_airport', name: 'Aspen/Pitkin County Airport', elevation: 7820, lat: 39.2232, lng: -106.8688 },
        { id: 15827, type: 'medium_airport', name: 'Eagle County Regional Airport', elevation: 6548, lat: 39.6426, lng: -106.9176 },
        { id: 19743, type: 'medium_airport', name: 'Flagstaff Pulliam Airport', elevation: 7014, lat: 35.1403, lng: -111.6691 },
        { id: 15837, type: 'medium_airport', name: 'Santa Fe Municipal Airport', elevation: 6348, lat: 35.6171, lng: -106.0894 },
        { id: 19858, type: 'small_airport', name: 'Alamosa San Luis Valley Regional', elevation: 7539, lat: 37.4350, lng: -105.8667 },
      ],
      executionTime: 127
    }
  }

  // Maritime domain
  if (domain === 'maritime' || lowerQuery.includes('seaport') || lowerQuery.includes('port') || lowerQuery.includes('shipping')) {
    return {
      sql: generateMockSQL(query, domain),
      columns: ['ID', 'NAME', 'PORT_TYPE', 'CARGO_TEU', 'LATITUDE', 'LONGITUDE'],
      data: [
        { id: 1, name: 'Port of Los Angeles', port_type: 'container', cargo_teu: 9213000, lat: 33.7406, lng: -118.2712 },
        { id: 2, name: 'Port of Long Beach', port_type: 'container', cargo_teu: 8091000, lat: 33.7540, lng: -118.2166 },
        { id: 3, name: 'Port of New York/New Jersey', port_type: 'container', cargo_teu: 7619000, lat: 40.6698, lng: -74.0446 },
        { id: 4, name: 'Port of Savannah', port_type: 'container', cargo_teu: 5763000, lat: 32.1280, lng: -81.1403 },
        { id: 5, name: 'Port of Houston', port_type: 'bulk', cargo_teu: 3712000, lat: 29.7355, lng: -95.0185 },
        { id: 6, name: 'Port of Seattle', port_type: 'container', cargo_teu: 3458000, lat: 47.5795, lng: -122.3526 },
      ],
      executionTime: 89
    }
  }

  // Space domain
  if (domain === 'space' || lowerQuery.includes('satellite') || lowerQuery.includes('ground station')) {
    return {
      sql: generateMockSQL(query, domain),
      columns: ['NORAD_ID', 'NAME', 'ORBIT_TYPE', 'ALTITUDE_KM', 'LATITUDE', 'LONGITUDE'],
      data: [
        { norad_id: 25544, name: 'ISS (ZARYA)', orbit_type: 'LEO', altitude_km: 420, lat: 51.6435, lng: -0.0014 },
        { norad_id: 48274, name: 'STARLINK-2305', orbit_type: 'LEO', altitude_km: 550, lat: 53.1235, lng: 6.7892 },
        { norad_id: 43013, name: 'NOAA 20', orbit_type: 'SSO', altitude_km: 824, lat: -23.5505, lng: -46.6333 },
        { norad_id: 29155, name: 'GOES 13', orbit_type: 'GEO', altitude_km: 35786, lat: 0.0, lng: -75.0 },
        { norad_id: 41866, name: 'SENTINEL-2A', orbit_type: 'SSO', altitude_km: 786, lat: 48.8566, lng: 2.3522 },
        { norad_id: 44713, name: 'STARLINK-1007', orbit_type: 'LEO', altitude_km: 550, lat: 35.6762, lng: 139.6503 },
      ],
      executionTime: 156
    }
  }

  // Default mock data
  return {
    sql: generateMockSQL(query, domain),
    columns: ['ID', 'NAME', 'TYPE', 'LATITUDE', 'LONGITUDE'],
    data: [
      { id: 1, name: 'Strategic Location Alpha', type: 'infrastructure', lat: 40.7128, lng: -74.006 },
      { id: 2, name: 'Strategic Location Beta', type: 'infrastructure', lat: 40.7580, lng: -73.9855 },
      { id: 3, name: 'Strategic Location Gamma', type: 'commercial', lat: 40.7484, lng: -73.9857 },
    ],
    executionTime: 45
  }
}
