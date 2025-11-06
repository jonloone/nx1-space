/**
 * Isochrone Analysis Panel
 * Reachability and accessibility intelligence display
 *
 * Features:
 * - Multi-modal comparison
 * - Coverage area visualization
 * - Accessibility scoring
 * - Strategic assessment
 * - Mode rankings
 */

'use client'

import React, { useState } from 'react'
import { X, Map, TrendingUp, Target, Clock, Award, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { IsochroneAnalysisResult } from '@/lib/services/isochroneAnalysisService'

export interface IsochroneAnalysisPanelProps {
  data: IsochroneAnalysisResult
  onClose: () => void
  onShowMode?: (mode: string) => void
}

/**
 * Accessibility level color mapping
 */
function getAccessibilityColor(level: string): { bg: string; border: string; text: string; dot: string } {
  switch (level) {
    case 'excellent':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' }
    case 'good':
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-600' }
    case 'moderate':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-600' }
    case 'poor':
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-600' }
    case 'very_poor':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-600' }
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-600' }
  }
}

/**
 * Mode icon and label
 */
function getModeDisplay(mode: string): { label: string; emoji: string; color: string } {
  switch (mode) {
    case 'driving':
      return { label: 'Driving', emoji: '🚗', color: 'text-blue-600' }
    case 'walking':
      return { label: 'Walking', emoji: '🚶', color: 'text-green-600' }
    case 'cycling':
      return { label: 'Cycling', emoji: '🚴', color: 'text-purple-600' }
    default:
      return { label: 'Unknown', emoji: '🗺️', color: 'text-gray-600' }
  }
}

export default function IsochroneAnalysisPanel({
  data,
  onClose,
  onShowMode
}: IsochroneAnalysisPanelProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const accessibilityColors = getAccessibilityColor(data.accessibility.level)

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-4">
          {/* Accessibility Level Indicator */}
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-1.5 h-1.5 rounded-full', accessibilityColors.dot)} />
            <span className={cn('text-xs font-semibold uppercase tracking-wide', accessibilityColors.text)}>
              {data.accessibility.level.replace('_', ' ')} ACCESSIBILITY
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{data.isochrones.length} Modes Analyzed</span>
          </div>

          {/* Location Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
            Reachability Analysis: {data.location.name || 'Location'}
          </h2>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-3.5 w-3.5" />
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

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-5 space-y-6">
          {/* Overview Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.accessibility.overallScore}
              </div>
              <div className="text-xs text-gray-600 mt-1">Accessibility Score</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.statistics.totalArea.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Area (sq km)</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {data.statistics.averageReachability}
              </div>
              <div className="text-xs text-gray-600 mt-1">Avg Reach (min)</div>
            </div>
          </div>

          {/* Accessibility Assessment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Accessibility Assessment
            </h3>
            <div className={cn('border rounded-lg p-4', accessibilityColors.border, accessibilityColors.bg)}>
              <div className="text-sm text-gray-800 leading-relaxed mb-3">
                {data.intelligence.summary}
              </div>

              {/* Accessibility Factors */}
              {data.accessibility.factors.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-gray-200">
                  {data.accessibility.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className={cn('mt-0.5', accessibilityColors.text)}>•</span>
                      {factor}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mode Comparison */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Transportation Mode Rankings
            </h3>
            <div className="space-y-3">
              {data.comparison.modeRankings.map((ranking) => {
                const modeInfo = getModeDisplay(ranking.mode)
                const isochrone = data.isochrones.find(i => i.mode === ranking.mode)

                return (
                  <div
                    key={ranking.mode}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all cursor-pointer',
                      selectedMode === ranking.mode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => {
                      setSelectedMode(ranking.mode)
                      onShowMode?.(ranking.mode)
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{modeInfo.emoji}</div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {modeInfo.label}
                            {ranking.rank === 1 && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                                #1 BEST
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            Rank #{ranking.rank} • Score: {ranking.score}/100
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coverage Details */}
                    {isochrone && (
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="text-gray-600">Coverage</div>
                          <div className="font-semibold text-gray-900">
                            {isochrone.coverage.area.toFixed(1)} sq km
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Population</div>
                          <div className="font-semibold text-gray-900">
                            ~{(isochrone.coverage.population! / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">POIs</div>
                          <div className="font-semibold text-gray-900">
                            {isochrone.coverage.pointsOfInterest}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Score Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            ranking.score >= 80 ? 'bg-green-600' :
                            ranking.score >= 60 ? 'bg-blue-600' :
                            ranking.score >= 40 ? 'bg-amber-600' :
                            'bg-red-600'
                          )}
                          style={{ width: `${ranking.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mode Scores Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Mode Score Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(data.accessibility.scores).map(([mode, score]) => {
                const modeInfo = getModeDisplay(mode)
                return (
                  <div key={mode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{modeInfo.emoji}</span>
                      <span className="text-sm font-medium text-gray-700">{modeInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-gray-900">{score}/100</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            score >= 70 ? 'bg-green-600' :
                            score >= 50 ? 'bg-amber-600' :
                            'bg-red-600'
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Key Findings */}
          {data.intelligence.keyFindings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Findings</h3>
              <ul className="space-y-2">
                {data.intelligence.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            {data.intelligence.strengths.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Strengths
                </h3>
                <div className="space-y-2">
                  {data.intelligence.strengths.map((strength, idx) => (
                    <div key={idx} className="p-2 bg-green-50 rounded text-xs text-gray-700 border-l-2 border-green-500">
                      {strength}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {data.intelligence.weaknesses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Weaknesses
                </h3>
                <div className="space-y-2">
                  {data.intelligence.weaknesses.map((weakness, idx) => (
                    <div key={idx} className="p-2 bg-orange-50 rounded text-xs text-gray-700 border-l-2 border-orange-500">
                      {weakness}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          {data.intelligence.recommendedActions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {data.intelligence.recommendedActions.map((action, idx) => (
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

          {/* Coverage Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Coverage Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Total Coverage</div>
                <div className="text-lg font-bold text-gray-900">
                  {data.statistics.totalArea.toFixed(1)} sq km
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Coverage Overlap</div>
                <div className="text-lg font-bold text-gray-900">
                  {data.statistics.coverageOverlap}%
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-700">Fastest Mode:</span> {getModeDisplay(data.comparison.fastestMode).emoji} {getModeDisplay(data.comparison.fastestMode).label}
              </div>
              <div>
                <span className="font-medium text-gray-700">Largest Coverage:</span> {getModeDisplay(data.comparison.largestCoverage).emoji} {getModeDisplay(data.comparison.largestCoverage).label}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
