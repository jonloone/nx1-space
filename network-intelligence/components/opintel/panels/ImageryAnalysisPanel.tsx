/**
 * Imagery Analysis Panel
 * Satellite intelligence analysis display
 *
 * Features:
 * - Change detection results
 * - Activity analysis timeline
 * - Object detection summary
 * - Intelligence assessment
 * - Temporal statistics
 */

'use client'

import React, { useState } from 'react'
import { X, Satellite, Activity, AlertTriangle, TrendingUp, Clock, ChevronDown, ChevronRight, Eye, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChangeDetectionResult, ActivityAnalysis, ObjectDetectionResult } from '@/lib/services/imageryAnalysisService'

export interface ImageryAnalysisPanelProps {
  data: {
    type: 'change-detection' | 'activity-analysis' | 'object-detection'
    changeDetection?: ChangeDetectionResult
    activityAnalysis?: ActivityAnalysis
    objectDetection?: ObjectDetectionResult
  }
  onClose: () => void
  onViewChange?: (change: any) => void
  onViewObject?: (object: any) => void
}

/**
 * Change type color mapping
 */
function getChangeTypeColor(type: string): { bg: string; text: string; dot: string } {
  switch (type) {
    case 'construction':
      return { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-600' }
    case 'demolition':
      return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-600' }
    case 'vegetation_loss':
      return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-600' }
    case 'vegetation_gain':
      return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-600' }
    case 'infrastructure':
      return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-600' }
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-600' }
  }
}

/**
 * Activity level color mapping
 */
function getActivityLevelColor(level: string): { bg: string; border: string; text: string; dot: string } {
  switch (level) {
    case 'very_high':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-600' }
    case 'high':
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-600' }
    case 'medium':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-600' }
    case 'low':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' }
    case 'none':
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' }
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-600' }
  }
}

export default function ImageryAnalysisPanel({
  data,
  onClose,
  onViewChange,
  onViewObject
}: ImageryAnalysisPanelProps) {
  const [showAllChanges, setShowAllChanges] = useState(false)
  const [showAllIndicators, setShowAllIndicators] = useState(false)

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-4">
          {/* Type Badge */}
          <div className="flex items-center gap-3 mb-3">
            <Satellite className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {data.type.replace('-', ' ')}
            </span>
            {data.activityAnalysis && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <div className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full', getActivityLevelColor(data.activityAnalysis.activityLevel).dot)} />
                  <span className={cn('text-xs font-semibold uppercase', getActivityLevelColor(data.activityAnalysis.activityLevel).text)}>
                    {data.activityAnalysis.activityLevel.replace('_', ' ')} ACTIVITY
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
            {data.type === 'change-detection' && 'Change Detection Analysis'}
            {data.type === 'activity-analysis' && `Activity Analysis: ${data.activityAnalysis?.location.name || 'Location'}`}
            {data.type === 'object-detection' && 'Object Detection Results'}
          </h2>

          {/* Subtitle */}
          {data.changeDetection && (
            <div className="text-sm text-gray-600">
              {new Date(data.changeDetection.beforeImage.acquisitionDate).toLocaleDateString()} → {new Date(data.changeDetection.afterImage.acquisitionDate).toLocaleDateString()}
            </div>
          )}
          {data.activityAnalysis && (
            <div className="text-sm text-gray-600">
              {new Date(data.activityAnalysis.timeRange.start).toLocaleDateString()} - {new Date(data.activityAnalysis.timeRange.end).toLocaleDateString()}
            </div>
          )}
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

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-5 space-y-6">
          {/* Change Detection View */}
          {data.type === 'change-detection' && data.changeDetection && (
            <ChangeDetectionView
              result={data.changeDetection}
              showAllChanges={showAllChanges}
              setShowAllChanges={setShowAllChanges}
              onViewChange={onViewChange}
            />
          )}

          {/* Activity Analysis View */}
          {data.type === 'activity-analysis' && data.activityAnalysis && (
            <ActivityAnalysisView
              analysis={data.activityAnalysis}
              showAllIndicators={showAllIndicators}
              setShowAllIndicators={setShowAllIndicators}
            />
          )}

          {/* Object Detection View */}
          {data.type === 'object-detection' && data.objectDetection && (
            <ObjectDetectionView
              result={data.objectDetection}
              onViewObject={onViewObject}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * Change Detection View Component
 */
function ChangeDetectionView({
  result,
  showAllChanges,
  setShowAllChanges,
  onViewChange
}: {
  result: ChangeDetectionResult
  showAllChanges: boolean
  setShowAllChanges: (show: boolean) => void
  onViewChange?: (change: any) => void
}) {
  const significantChanges = result.changes.filter(c => c.confidence >= 70)
  const displayedChanges = showAllChanges ? result.changes : significantChanges.slice(0, 5)

  return (
    <>
      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {result.summary.totalChanges}
          </div>
          <div className="text-xs text-gray-600 mt-1">Total Changes</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {result.summary.significantChanges}
          </div>
          <div className="text-xs text-gray-600 mt-1">High Confidence</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {result.statistics.averageConfidence.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Avg Confidence</div>
        </div>
      </div>

      {/* Change Type Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Change Types</h3>
        <div className="space-y-2">
          {Object.entries(result.summary.changeTypes).map(([type, count]) => {
            const colors = getChangeTypeColor(type)
            const percentage = (count / result.summary.totalChanges) * 100
            return (
              <div key={type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
                    <span className="text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', colors.dot)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detected Changes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Detected Changes ({significantChanges.length})
          </h3>
          {result.changes.length > 5 && (
            <button
              onClick={() => setShowAllChanges(!showAllChanges)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showAllChanges ? 'Show less' : `Show all ${result.changes.length}`}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {displayedChanges.map((change) => {
            const colors = getChangeTypeColor(change.type)
            return (
              <div
                key={change.id}
                className={cn('p-3 rounded-lg border-l-2', colors.bg)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className={cn('text-xs font-semibold uppercase mb-1', colors.text)}>
                      {change.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-600">
                      Confidence: {change.confidence.toFixed(1)}% • Magnitude: {change.magnitude.toFixed(0)}
                    </div>
                  </div>
                  {onViewChange && (
                    <button
                      onClick={() => onViewChange(change)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700">{change.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

/**
 * Activity Analysis View Component
 */
function ActivityAnalysisView({
  analysis,
  showAllIndicators,
  setShowAllIndicators
}: {
  analysis: ActivityAnalysis
  showAllIndicators: boolean
  setShowAllIndicators: (show: boolean) => void
}) {
  const colors = getActivityLevelColor(analysis.activityLevel)
  const displayedIndicators = showAllIndicators ? analysis.indicators : analysis.indicators.slice(0, 5)

  return (
    <>
      {/* Activity Score */}
      <div className={cn('border rounded-lg p-4', colors.border, colors.bg)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className={cn('text-xs font-semibold uppercase mb-1', colors.text)}>
              Activity Score
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {analysis.activityScore}
              <span className="text-lg text-gray-500">/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-1">Change Frequency</div>
            <div className="text-2xl font-bold text-gray-900">
              {analysis.changeFrequency.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">per month</div>
          </div>
        </div>
      </div>

      {/* Intelligence Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Intelligence Assessment
        </h3>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-800 leading-relaxed">
            {analysis.intelligence.summary}
          </p>
        </div>
      </div>

      {/* Key Findings */}
      {analysis.intelligence.keyFindings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Findings</h3>
          <ul className="space-y-2">
            {analysis.intelligence.keyFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-600 mt-0.5">•</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Indicators */}
      {analysis.intelligence.riskIndicators.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Risk Indicators
          </h3>
          <div className="space-y-2">
            {analysis.intelligence.riskIndicators.map((indicator, idx) => (
              <div key={idx} className="p-3 bg-orange-50 rounded-lg border-l-2 border-orange-500">
                <p className="text-sm text-gray-800">{indicator}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Indicators Timeline */}
      {analysis.indicators.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activity Indicators ({analysis.indicators.length})
            </h3>
            {analysis.indicators.length > 5 && (
              <button
                onClick={() => setShowAllIndicators(!showAllIndicators)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showAllIndicators ? 'Show less' : `Show all ${analysis.indicators.length}`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {displayedIndicators.map((indicator, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-900 capitalize">
                    {indicator.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(indicator.detectedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{indicator.description}</p>
                <div className="text-xs text-gray-600 mt-1">
                  Confidence: {indicator.confidence.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {analysis.intelligence.recommendedActions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recommended Actions
          </h3>
          <div className="space-y-2">
            {analysis.intelligence.recommendedActions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-500">
                <div className="text-blue-600 font-semibold text-xs mt-0.5">ACTION</div>
                <p className="text-sm text-gray-800 leading-relaxed flex-1">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Object Detection View Component
 */
function ObjectDetectionView({
  result,
  onViewObject
}: {
  result: ObjectDetectionResult
  onViewObject?: (object: any) => void
}) {
  return (
    <>
      {/* Summary */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-3xl font-bold text-gray-900">{result.summary.totalObjects}</div>
        <div className="text-sm text-gray-600 mt-1">Objects Detected</div>
      </div>

      {/* Object Type Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Object Types</h3>
        <div className="space-y-3">
          {Object.entries(result.summary.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
              <span className="text-sm font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Object List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Detected Objects</h3>
        <div className="space-y-2">
          {result.objects.slice(0, 10).map((object, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900 capitalize">{object.type}</span>
                {onViewObject && (
                  <button
                    onClick={() => onViewObject(object)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-600">
                Confidence: {object.confidence.toFixed(1)}% • Size: {object.size.width.toFixed(0)}m × {object.size.height.toFixed(0)}m
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
