'use client'

import React from 'react'
import {
  AlertTriangle,
  TrendingUp,
  MapPin,
  Users,
  ChevronRight,
  Zap,
  CheckCircle2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PanelHeader, PanelSection } from './BottomSheet'
import { usePanelStore } from '@/lib/stores/panelStore'

interface BehavioralInsight {
  type: 'pattern' | 'anomaly' | 'risk' | 'opportunity'
  title: string
  description: string
  confidence: number // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
}

interface IntelligencePanelData {
  riskScore: number // 0-100
  insights: BehavioralInsight[]
  locationCount?: number
  suspiciousCount?: number
}

export default function IntelligencePanel() {
  const { content, setDetent } = usePanelStore()

  if (!content || content.type !== 'intelligence-analysis') {
    return <div className="p-6 text-muted-foreground">No intelligence data</div>
  }

  const data = content.data as IntelligencePanelData

  // Sort insights by severity
  const sortedInsights = [...data.insights].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return (
    <>
      <PanelHeader
        title="Intelligence Analysis"
        subtitle={data.locationCount ? `Based on ${data.locationCount} locations` : undefined}
      />

      {/* Risk Score */}
      <PanelSection>
        <RiskScoreGauge score={data.riskScore} />
      </PanelSection>

      {/* Insights */}
      <PanelSection title="Key Insights">
        <div className="space-y-3">
          {sortedInsights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}
        </div>
      </PanelSection>

      {/* Actions */}
      <PanelSection>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setDetent('expanded')}
          >
            <span>View Full Report</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full">
            Export Analysis
          </Button>
        </div>
      </PanelSection>
    </>
  )
}

function RiskScoreGauge({ score }: { score: number }) {
  // Determine risk level and color
  const getRiskLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score >= 80) return { level: 'Critical', color: 'text-red-500', bgColor: 'bg-red-500' }
    if (score >= 60) return { level: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500' }
    if (score >= 40) return { level: 'Medium', color: 'text-amber-500', bgColor: 'bg-amber-500' }
    return { level: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500' }
  }

  const { level, color, bgColor } = getRiskLevel(score)

  return (
    <div className="relative">
      {/* Gauge Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Risk Score</h3>
        <div className={`text-2xl font-bold ${color}`}>
          {score}/100
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${bgColor} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Risk Level Badge */}
      <div className="flex justify-end mt-2">
        <Badge variant={score >= 60 ? 'destructive' : 'secondary'}>
          {level} Risk
        </Badge>
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: BehavioralInsight }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/5'
      case 'high':
        return 'border-orange-500/50 bg-orange-500/5'
      case 'medium':
        return 'border-amber-500/50 bg-amber-500/5'
      default:
        return 'border-blue-500/50 bg-blue-500/5'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" />
      case 'risk':
        return <Zap className="h-4 w-4" />
      case 'pattern':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <CheckCircle2 className="h-4 w-4" />
    }
  }

  const getIconColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500'
      case 'high':
        return 'text-orange-500'
      case 'medium':
        return 'text-amber-500'
      default:
        return 'text-blue-500'
    }
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${getSeverityColor(insight.severity)}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${getIconColor(insight.severity)}`}>
          {getIcon(insight.type)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title & Severity */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground">{insight.title}</h4>
            <Badge
              variant="outline"
              className="uppercase text-xs"
            >
              {insight.severity}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-3">
            {/* Confidence */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${insight.confidence}%` }}
                  />
                </div>
              </div>
              <span>{insight.confidence}% confidence</span>
            </div>
          </div>

          {/* Tags */}
          {insight.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {insight.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
