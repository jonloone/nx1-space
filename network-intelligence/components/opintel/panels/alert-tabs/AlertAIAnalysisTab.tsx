/**
 * Alert AI Analysis Tab
 * Real-time AI-powered intelligence analysis with Vultr LLM
 *
 * Displays:
 * - Executive summary
 * - Risk assessment with visual indicators
 * - Pattern analysis
 * - Geospatial context
 * - Actionable recommendations
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Brain, AlertTriangle, TrendingUp, MapPin, Target, RefreshCw, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import type { AlertAnalysisResult } from '@/lib/services/alertAnalysisService'

export interface AlertAIAnalysisTabProps {
  alert: IntelligenceAlert
  allAlerts?: IntelligenceAlert[]
  onAlertClick?: (alertId: string) => void
}

/**
 * Alert AI Analysis Tab Component
 */
export function AlertAIAnalysisTab({ alert, allAlerts = [], onAlertClick }: AlertAIAnalysisTabProps) {
  const [analysis, setAnalysis] = useState<AlertAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Version tracking: v3.1 - 3-Unit Cognitive Load Design (IC Standards Compliant)
  console.log('🎨 AlertAIAnalysisTab v3.1 - 3-Unit Cognitive Load Design')

  /**
   * Fetch AI analysis from API
   */
  const fetchAnalysis = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching AI analysis for alert ${alert.id}`)

      const response = await fetch('/api/analyze-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          allAlerts,
          forceRefresh
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result: AlertAnalysisResult = await response.json()

      // Deserialize generatedAt timestamp (JSON serialization converts Date to string)
      const resultWithDates = {
        ...result,
        generatedAt: new Date(result.generatedAt)
      }

      setAnalysis(resultWithDates)
      console.log(`AI analysis received (cached: ${result.cached})`)

    } catch (err) {
      console.error('Failed to fetch AI analysis:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate analysis')
    } finally {
      setLoading(false)
    }
  }

  // Load analysis on mount
  useEffect(() => {
    fetchAnalysis()
  }, [alert.id])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Brain className="h-4 w-4 animate-pulse" />
          <span>Analyzing intelligence data with AI...</span>
        </div>

        {/* Loading skeletons */}
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-900 mb-1">Analysis Failed</div>
              <div className="text-sm text-red-700 mb-3">{error}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAnalysis(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  const { threatLevel } = analysis.riskAssessment
  const threatColors = {
    low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', progress: 'bg-blue-600' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', progress: 'bg-yellow-600' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', progress: 'bg-orange-600' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', progress: 'bg-red-600' }
  }
  const colors = threatColors[threatLevel]

  return (
    <div className="space-y-6">
      {/* Executive Summary - Single cognitive unit */}
      <div className="space-y-2">
        <p className="text-sm text-[#171717] dark:text-gray-100 leading-relaxed font-medium">
          {analysis.executiveSummary}
        </p>

        <div className="text-xs text-[#525252] dark:text-gray-400">
          {analysis.confidence}% confidence • {analysis.riskAssessment.escalationProbability}% escalation risk • {analysis.riskAssessment.timeframe}
        </div>
      </div>

      {/* Next Steps - Action-oriented, top 2-3 only */}
      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <h4 className="text-xs font-bold text-[#171717] dark:text-gray-100 uppercase tracking-wider">
          NEXT STEPS
        </h4>
        {analysis.recommendations
          .filter(rec => rec.priority === 'immediate' || rec.priority === 'high')
          .slice(0, 3)
          .map((rec, i) => (
            <div
              key={i}
              className="p-3 bg-[#F5F5F5] dark:bg-gray-800/50 rounded-lg border border-[#E5E5E5] dark:border-gray-700"
            >
              <div className="flex items-start gap-2 mb-1">
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase shrink-0 border-[#E5E5E5] text-[#525252]"
                >
                  {rec.priority}
                </Badge>
                <div className="text-sm font-medium text-[#171717] dark:text-gray-200 flex-1">
                  {rec.action}
                </div>
              </div>
              <div className="text-xs text-[#525252] dark:text-gray-400 pl-0">
                {rec.rationale}
              </div>
            </div>
          ))}
      </div>

      {/* Supporting Context - Collapsible */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full justify-between text-xs text-[#525252] dark:text-gray-400 hover:text-[#171717] dark:hover:text-gray-100"
        >
          <span>Supporting Context</span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showDetails && (
          <div className="mt-4 space-y-6">
            {/* Context Summary */}
            <div className="text-xs text-[#525252] dark:text-gray-400 space-y-1">
              <div>• Generated {analysis.generatedAt.toLocaleTimeString()}{analysis.cached && ' (cached)'}</div>
              <div>• {analysis.riskAssessment.factors.length} risk factors identified</div>
              <div>• {analysis.patternAnalysis.relatedAlerts.length} related alerts in pattern analysis</div>
              <div>• {analysis.recommendations.length} total recommendations provided</div>
            </div>
            {/* Risk Factors - Simplified */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#171717] dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Risk Factors
              </h4>
              <div className="space-y-1.5 pl-5">
                {analysis.riskAssessment.factors.map((factor, i) => (
                  <div key={i} className="text-xs text-[#525252] dark:text-gray-400 flex items-start gap-2">
                    <span className="text-[#737373]">•</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Analysis - Simplified */}
            {(analysis.patternAnalysis.temporalPatterns.length > 0 ||
              analysis.patternAnalysis.spatialPatterns.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#171717] dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Pattern Analysis
                </h4>
                <div className="space-y-1.5 pl-5">
                  {analysis.patternAnalysis.temporalPatterns.map((pattern, i) => (
                    <div key={i} className="text-xs text-[#525252] dark:text-gray-400 flex items-start gap-2">
                      <span className="text-[#737373]">•</span>
                      <span>{pattern}</span>
                    </div>
                  ))}
                  {analysis.patternAnalysis.spatialPatterns.map((pattern, i) => (
                    <div key={i} className="text-xs text-[#525252] dark:text-gray-400 flex items-start gap-2">
                      <span className="text-[#737373]">•</span>
                      <span>{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Geospatial Context - Simplified */}
            {(analysis.geospatialContext.nearbyInfrastructure.length > 0 ||
              analysis.geospatialContext.tacticalConsiderations.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#171717] dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Geospatial Context
                </h4>
                <div className="space-y-1.5 pl-5">
                  {analysis.geospatialContext.nearbyInfrastructure.map((infra, i) => (
                    <div key={i} className="text-xs text-[#525252] dark:text-gray-400 flex items-start gap-2">
                      <span className="text-[#737373]">•</span>
                      <span>{infra}</span>
                    </div>
                  ))}
                  {analysis.geospatialContext.tacticalConsiderations.map((consideration, i) => (
                    <div key={i} className="text-xs text-[#525252] dark:text-gray-400 flex items-start gap-2">
                      <span className="text-[#737373]">•</span>
                      <span>{consideration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Alerts */}
            {analysis.patternAnalysis.relatedAlerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#171717] dark:text-gray-300 uppercase tracking-wide">
                  Related Alerts
                </h4>
                <div className="space-y-2">
                  {analysis.patternAnalysis.relatedAlerts.map((related, i) => (
                    <div
                      key={i}
                      className="p-2 bg-[#F5F5F5] dark:bg-gray-800/50 rounded text-xs cursor-pointer hover:bg-[#E5E5E5] dark:hover:bg-gray-800 transition-colors border border-[#E5E5E5] dark:border-gray-700"
                      onClick={() => onAlertClick?.(related.id)}
                    >
                      <div className="font-medium text-[#171717] dark:text-gray-100 mb-0.5">{related.title}</div>
                      <div className="text-[#525252] dark:text-gray-400">{related.similarity}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
