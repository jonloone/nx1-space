'use client'

/**
 * AnalysisReportView - AI Analysis Summary Display
 *
 * Shows structured analysis reports with:
 * - Executive summary
 * - Key findings
 * - Risk indicators
 * - Recommendations
 * - Agent insights (from CrewAI)
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Target,
  Bot,
  BarChart3,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalysisReportType } from '@/lib/services/responseRouterService'

// ============================================================================
// Types
// ============================================================================

export interface Risk {
  level: 'high' | 'medium' | 'low'
  title?: string
  description: string
}

export interface Finding {
  type?: 'insight' | 'observation' | 'warning'
  content: string
}

export interface AnalysisReportData {
  title?: string
  summary?: string
  naturalLanguageResponse?: string
  findings?: (string | Finding)[]
  risks?: Risk[]
  recommendations?: string[]
  agentInsights?: string[]
  metrics?: { label: string; value: string | number }[]
  confidence?: number
  reportType?: AnalysisReportType
}

export interface AnalysisReportViewProps {
  data: AnalysisReportData
  onViewDetails?: (section: string) => void
  onShowOnMap?: () => void
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export default function AnalysisReportView({
  data,
  onViewDetails,
  onShowOnMap,
  className
}: AnalysisReportViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']))

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const hasFindings = data.findings && data.findings.length > 0
  const hasRisks = data.risks && data.risks.length > 0
  const hasRecommendations = data.recommendations && data.recommendations.length > 0
  const hasAgentInsights = data.agentInsights && data.agentInsights.length > 0
  const hasMetrics = data.metrics && data.metrics.length > 0

  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            {data.title || 'Analysis Report'}
          </h3>
          {data.confidence !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">Confidence:</span>
              <ConfidenceBar value={data.confidence} />
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {(data.summary || data.naturalLanguageResponse) && (
        <CollapsibleSection
          title="Summary"
          icon={FileText}
          isExpanded={expandedSections.has('summary')}
          onToggle={() => toggleSection('summary')}
        >
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {data.summary || data.naturalLanguageResponse}
          </p>
        </CollapsibleSection>
      )}

      {/* Key Metrics */}
      {hasMetrics && (
        <div className="grid grid-cols-2 gap-3">
          {data.metrics!.map((metric, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-xs uppercase tracking-wide">{metric.label}</span>
              </div>
              <p className="text-lg font-semibold text-slate-200">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Key Findings */}
      {hasFindings && (
        <CollapsibleSection
          title="Key Findings"
          icon={Target}
          count={data.findings!.length}
          isExpanded={expandedSections.has('findings')}
          onToggle={() => toggleSection('findings')}
        >
          <div className="space-y-2">
            {data.findings!.map((finding, i) => {
              const content = typeof finding === 'string' ? finding : finding.content
              const type = typeof finding === 'string' ? 'insight' : (finding.type || 'insight')

              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 p-3 rounded-lg',
                    type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50'
                  )}
                >
                  {type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm text-slate-300">{content}</p>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Risk Indicators */}
      {hasRisks && (
        <CollapsibleSection
          title="Risk Indicators"
          icon={AlertTriangle}
          count={data.risks!.length}
          isExpanded={expandedSections.has('risks')}
          onToggle={() => toggleSection('risks')}
          accentColor="amber"
        >
          <div className="space-y-2">
            {data.risks!.map((risk, i) => (
              <RiskCard key={i} risk={risk} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Recommendations */}
      {hasRecommendations && (
        <CollapsibleSection
          title="Recommendations"
          icon={Lightbulb}
          count={data.recommendations!.length}
          isExpanded={expandedSections.has('recommendations')}
          onToggle={() => toggleSection('recommendations')}
          accentColor="emerald"
        >
          <div className="space-y-2">
            {data.recommendations!.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Agent Insights */}
      {hasAgentInsights && (
        <CollapsibleSection
          title="Agent Insights"
          icon={Bot}
          count={data.agentInsights!.length}
          isExpanded={expandedSections.has('agents')}
          onToggle={() => toggleSection('agents')}
          accentColor="blue"
        >
          <div className="space-y-2">
            {data.agentInsights!.map((insight, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-800/50 border-l-2 border-blue-500">
                <p className="text-sm text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Actions */}
      {onShowOnMap && (
        <div className="pt-4 border-t border-slate-700/50">
          <button
            onClick={onShowOnMap}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       bg-blue-600 hover:bg-blue-500 text-white
                       transition-colors text-sm font-medium"
          >
            <MapPin className="w-4 h-4" />
            Show on Map
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Collapsible Section
// ============================================================================

interface CollapsibleSectionProps {
  title: string
  icon: typeof FileText
  count?: number
  isExpanded: boolean
  onToggle: () => void
  accentColor?: 'purple' | 'amber' | 'emerald' | 'blue'
  children: React.ReactNode
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  isExpanded,
  onToggle,
  accentColor = 'purple',
  children
}: CollapsibleSectionProps) {
  const colorClasses = {
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400'
  }

  return (
    <div className="rounded-xl bg-slate-800/30 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', colorClasses[accentColor])} />
          <span className="text-sm font-medium text-slate-200">{title}</span>
          {count !== undefined && (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-slate-700/50 text-slate-400">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-500 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// Risk Card
// ============================================================================

function RiskCard({ risk }: { risk: Risk }) {
  const levelColors = {
    high: 'bg-red-500/10 border-red-500/30 text-red-400',
    medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    low: 'bg-green-500/10 border-green-500/30 text-green-400'
  }

  const levelLabels = {
    high: 'High Risk',
    medium: 'Medium Risk',
    low: 'Low Risk'
  }

  return (
    <div className={cn('p-3 rounded-lg border', levelColors[risk.level])}>
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {levelLabels[risk.level]}
        </span>
      </div>
      {risk.title && (
        <p className="text-sm font-medium text-slate-200 mb-1">{risk.title}</p>
      )}
      <p className="text-sm text-slate-300">{risk.description}</p>
    </div>
  )
}

// ============================================================================
// Confidence Bar
// ============================================================================

function ConfidenceBar({ value }: { value: number }) {
  const percentage = Math.round(value * 100)
  const color = percentage >= 80 ? 'bg-emerald-500' :
                percentage >= 60 ? 'bg-blue-500' :
                percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{percentage}%</span>
    </div>
  )
}
