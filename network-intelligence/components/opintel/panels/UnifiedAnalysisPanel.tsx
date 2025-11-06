/**
 * Unified Analysis Panel
 * Multi-layer intelligence display with tabbed interface
 *
 * Features:
 * - Integrated intelligence summary
 * - Tabbed interface for different analysis types
 * - Cross-layer correlation display
 * - Overall risk assessment
 * - Unified action recommendations
 */

'use client'

import React, { useState } from 'react'
import { X, Layers, Route, Satellite, Target, TrendingUp, Shield, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { MultiLayerAnalysisResult } from '@/lib/services/multiLayerAnalysisService'

// Import individual panels
import RouteAnalysisPanel from './RouteAnalysisPanel'
import ImageryAnalysisPanel from './ImageryAnalysisPanel'
import IsochroneAnalysisPanel from './IsochroneAnalysisPanel'

export interface UnifiedAnalysisPanelProps {
  data: MultiLayerAnalysisResult
  onClose: () => void
}

type TabType = 'overview' | 'route' | 'imagery' | 'isochrone'

/**
 * Risk level color mapping
 */
function getRiskLevelColor(level: string): { bg: string; border: string; text: string; dot: string } {
  switch (level) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-600' }
    case 'high':
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-600' }
    case 'medium':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-600' }
    case 'low':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' }
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-600' }
  }
}

export default function UnifiedAnalysisPanel({
  data,
  onClose
}: UnifiedAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const riskColors = getRiskLevelColor(data.integration.riskLevel)

  // Available tabs based on data
  const availableTabs: Array<{ id: TabType; label: string; icon: React.ReactNode; available: boolean }> = [
    { id: 'overview', label: 'Overview', icon: <Layers className="h-4 w-4" />, available: true },
    { id: 'route', label: 'Route', icon: <Route className="h-4 w-4" />, available: !!data.route },
    { id: 'imagery', label: 'Imagery', icon: <Satellite className="h-4 w-4" />, available: !!data.imagery },
    { id: 'isochrone', label: 'Reachability', icon: <Target className="h-4 w-4" />, available: !!data.isochrone }
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-4">
          {/* Risk Level Indicator */}
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-1.5 h-1.5 rounded-full', riskColors.dot)} />
            <span className={cn('text-xs font-semibold uppercase tracking-wide', riskColors.text)}>
              {data.integration.riskLevel} RISK
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              {data.metadata.analysisTypes.length} Layer Analysis
            </span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
            Integrated Intelligence: {data.location.name || 'Location'}
          </h2>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Confidence: {data.metadata.confidenceScore}%</span>
            </div>
            <span>•</span>
            <span>{new Date(data.timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 rounded-full hover:bg-gray-100"
        >
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-100">
        <div className="flex px-6">
          {availableTabs.filter(tab => tab.available).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1">
        {activeTab === 'overview' && (
          <OverviewTab data={data} riskColors={riskColors} />
        )}
        {activeTab === 'route' && data.route && (
          <div className="p-6">
            <RouteAnalysisPanel
              data={data.route}
              onClose={() => {}} // No-op, handled by unified panel
            />
          </div>
        )}
        {activeTab === 'imagery' && data.imagery && (
          <div className="p-6">
            {data.imagery.changeDetection && (
              <ImageryAnalysisPanel
                data={{
                  type: 'change-detection',
                  changeDetection: data.imagery.changeDetection
                }}
                onClose={() => {}}
              />
            )}
            {data.imagery.activityAnalysis && !data.imagery.changeDetection && (
              <ImageryAnalysisPanel
                data={{
                  type: 'activity-analysis',
                  activityAnalysis: data.imagery.activityAnalysis
                }}
                onClose={() => {}}
              />
            )}
          </div>
        )}
        {activeTab === 'isochrone' && data.isochrone && (
          <div className="p-6">
            <IsochroneAnalysisPanel
              data={data.isochrone}
              onClose={() => {}}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

/**
 * Overview Tab Component
 */
function OverviewTab({
  data,
  riskColors
}: {
  data: MultiLayerAnalysisResult
  riskColors: ReturnType<typeof getRiskLevelColor>
}) {
  return (
    <div className="px-6 py-5 space-y-6">
      {/* Integrated Intelligence Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Integrated Intelligence Assessment
        </h3>
        <div className={cn('border rounded-lg p-4', riskColors.border, riskColors.bg)}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className={cn('text-xs font-semibold uppercase mb-1', riskColors.text)}>
                Overall Risk Score
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {data.integration.overallRiskScore}
                <span className="text-lg text-gray-500">/100</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-1">Confidence</div>
              <div className="text-2xl font-bold text-gray-900">
                {data.metadata.confidenceScore}%
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-800 leading-relaxed">
              {data.integration.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Layers Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Analysis Layers</h3>
        <div className="grid grid-cols-1 gap-3">
          {data.route && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Route className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Route Analysis</span>
              </div>
              <div className="text-sm text-gray-700">
                {data.route.mode} route • {(data.route.route.distance / 1000).toFixed(1)}km • Risk: {data.route.riskAssessment.riskLevel}
              </div>
            </div>
          )}

          {data.imagery && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Satellite className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-900">Satellite Imagery</span>
              </div>
              <div className="text-sm text-gray-700">
                {data.imagery.recentImages.length} images analyzed
                {data.imagery.changeDetection && ` • ${data.imagery.changeDetection.summary.totalChanges} changes`}
                {data.imagery.activityAnalysis && ` • Activity: ${data.imagery.activityAnalysis.activityLevel}`}
              </div>
            </div>
          )}

          {data.isochrone && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Reachability Analysis</span>
              </div>
              <div className="text-sm text-gray-700">
                {data.isochrone.isochrones.length} modes • Accessibility: {data.isochrone.accessibility.level}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Findings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Findings</h3>
        <ul className="space-y-2">
          {data.integration.keyFindings.map((finding, idx) => (
            <li key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-blue-600 mt-0.5 font-bold">•</span>
              <span className="text-sm text-gray-700">{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cross-Layer Correlations */}
      {data.integration.correlations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Cross-Layer Correlations
          </h3>
          <div className="space-y-2">
            {data.integration.correlations.map((correlation, idx) => (
              <div
                key={idx}
                className="p-3 bg-orange-50 rounded-lg border-l-2 border-orange-500"
              >
                <p className="text-sm text-gray-800">{correlation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {data.integration.recommendedActions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recommended Actions
          </h3>
          <div className="space-y-2">
            {data.integration.recommendedActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-500"
              >
                <div className="text-blue-600 font-semibold text-xs mt-0.5">ACTION</div>
                <p className="text-sm text-gray-800 leading-relaxed flex-1">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Sources</h3>
        <div className="flex flex-wrap gap-2">
          {data.metadata.dataSourcesUsed.map((source, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
            >
              {source}
            </span>
          ))}
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-semibold text-gray-700">Analysis Types:</span>
            <div className="mt-1">
              {data.metadata.analysisTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
            </div>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Generated:</span>
            <div className="mt-1">{new Date(data.timestamp).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
