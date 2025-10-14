'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  ChevronRight,
  RefreshCw,
  X,
  Lightbulb
} from 'lucide-react'
import { getInsightsService, type Insight, type StationMetrics } from '@/lib/services/insightsGenerationService'

interface AutomatedInsightsPanelProps {
  stations: StationMetrics[]
  onInsightClick?: (insight: Insight) => void
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
}

const impactColors = {
  critical: 'from-red-500 to-rose-600',
  high: 'from-orange-500 to-amber-600',
  medium: 'from-yellow-500 to-orange-500',
  low: 'from-blue-500 to-cyan-500'
}

const typeIcons = {
  opportunity: Target,
  risk: AlertTriangle,
  trend: TrendingUp,
  anomaly: Zap,
  recommendation: Lightbulb
}

const typeColors = {
  opportunity: 'text-green-400',
  risk: 'text-red-400',
  trend: 'text-blue-400',
  anomaly: 'text-yellow-400',
  recommendation: 'text-purple-400'
}

export default function AutomatedInsightsPanel({
  stations,
  onInsightClick,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: AutomatedInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [filter, setFilter] = useState<Insight['type'] | 'all'>('all')

  const insightsService = useMemo(() => getInsightsService(), [])

  // Generate insights
  const generateInsights = async () => {
    if (stations.length === 0) return

    setLoading(true)
    try {
      const newInsights = await insightsService.generateInsights(stations)
      setInsights(newInsights)
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial generation
  useEffect(() => {
    generateInsights()
  }, [stations])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(generateInsights, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, stations])

  // Filter insights
  const filteredInsights = useMemo(() => {
    if (filter === 'all') return insights
    return insights.filter(i => i.type === filter)
  }, [insights, filter])

  // Group insights by impact
  const groupedInsights = useMemo(() => {
    const groups: Record<string, Insight[]> = {
      critical: [],
      high: [],
      medium: [],
      low: []
    }
    filteredInsights.forEach(insight => {
      groups[insight.impact].push(insight)
    })
    return groups
  }, [filteredInsights])

  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight)
    onInsightClick?.(insight)
  }

  return (
    <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">AI Insights</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {insights.length} insights
            </span>
            <button
              onClick={generateInsights}
              disabled={loading}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: 'All', count: insights.length },
            { value: 'opportunity', label: 'Opportunities', count: insights.filter(i => i.type === 'opportunity').length },
            { value: 'risk', label: 'Risks', count: insights.filter(i => i.type === 'risk').length },
            { value: 'trend', label: 'Trends', count: insights.filter(i => i.type === 'trend').length },
            { value: 'recommendation', label: 'Recommendations', count: insights.filter(i => i.type === 'recommendation').length }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.value
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="max-h-[500px] overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="text-gray-400 text-sm">Generating insights...</span>
            </div>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
            No insights available
          </div>
        ) : (
          <div className="space-y-4">
            {/* Critical insights */}
            {groupedInsights.critical.length > 0 && (
              <InsightGroup
                title="Critical"
                insights={groupedInsights.critical}
                onInsightClick={handleInsightClick}
              />
            )}

            {/* High priority insights */}
            {groupedInsights.high.length > 0 && (
              <InsightGroup
                title="High Priority"
                insights={groupedInsights.high}
                onInsightClick={handleInsightClick}
              />
            )}

            {/* Medium priority insights */}
            {groupedInsights.medium.length > 0 && (
              <InsightGroup
                title="Medium Priority"
                insights={groupedInsights.medium}
                onInsightClick={handleInsightClick}
              />
            )}

            {/* Low priority insights */}
            {groupedInsights.low.length > 0 && (
              <InsightGroup
                title="Low Priority"
                insights={groupedInsights.low}
                onInsightClick={handleInsightClick}
              />
            )}
          </div>
        )}
      </div>

      {/* Selected Insight Detail */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(typeIcons[selectedInsight.type], {
                    className: `w-6 h-6 ${typeColors[selectedInsight.type]}`
                  })}
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {selectedInsight.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${impactColors[selectedInsight.impact]} text-white font-medium`}>
                        {selectedInsight.impact.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        Priority: {selectedInsight.priority}/10
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                  <p className="text-white leading-relaxed">{selectedInsight.description}</p>
                </div>

                {selectedInsight.suggestedAction && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Suggested Action
                    </h4>
                    <p className="text-white text-sm">{selectedInsight.suggestedAction}</p>
                  </div>
                )}

                {selectedInsight.data && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Data</h4>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(selectedInsight.data, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Generated: {selectedInsight.timestamp.toLocaleString()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Insight Group Component
function InsightGroup({
  title,
  insights,
  onInsightClick
}: {
  title: string
  insights: Insight[]
  onInsightClick: (insight: Insight) => void
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2">
        {title}
      </h4>
      {insights.map((insight, index) => {
        const Icon = typeIcons[insight.type]
        return (
          <motion.button
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onInsightClick(insight)}
            className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 hover:border-white/10 group"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${impactColors[insight.impact]}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-white font-medium text-sm group-hover:text-purple-400 transition-colors">
                    {insight.title}
                  </h5>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                </div>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                  {insight.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    insight.actionable ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {insight.actionable ? 'Actionable' : 'Informational'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Priority: {insight.priority}/10
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
