'use client'

/**
 * Citizen360 Intelligence Panel
 *
 * AI-powered comprehensive subject profile with behavioral insights,
 * geographic intelligence, network analysis, and actionable recommendations.
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Brain,
  TrendingUp,
  MapPin,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Zap,
  Shield
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { InvestigationSubject } from '@/lib/demo/investigation-demo-data'
import type { InvestigationIntelligence } from '@/lib/services/investigationIntelligenceService'

interface SubjectProfileProps {
  subject: InvestigationSubject
  stats?: {
    locationsVisited: number
    alertsTriggered: number
    daysTracked: number
    lastUpdate: string
  }
  intelligence?: InvestigationIntelligence
  onClose?: () => void
}

export default function SubjectProfile({
  subject,
  stats,
  intelligence,
  onClose
}: SubjectProfileProps) {
  const defaultStats = stats || {
    locationsVisited: 0,
    alertsTriggered: 0,
    daysTracked: 0,
    lastUpdate: 'Unknown'
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'suspect':
        return {
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#EF4444]',
          border: 'border-[#EF4444]',
          dot: 'bg-[#EF4444]'
        }
      case 'person-of-interest':
        return {
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#F59E0B]',
          border: 'border-[#F59E0B]',
          dot: 'bg-[#F59E0B]'
        }
      case 'associate':
        return {
          bg: 'bg-[#EDE9FE]',
          text: 'text-[#8B5CF6]',
          border: 'border-[#8B5CF6]',
          dot: 'bg-[#8B5CF6]'
        }
      default:
        return {
          bg: 'bg-[#F5F5F5]',
          text: 'text-[#525252]',
          border: 'border-[#E5E5E5]',
          dot: 'bg-[#A3A3A3]'
        }
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 75) return { bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', level: 'CRITICAL' }
    if (score >= 60) return { bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', level: 'HIGH' }
    if (score >= 40) return { bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', level: 'MEDIUM' }
    return { bg: 'bg-[#10B981]', text: 'text-[#10B981]', level: 'LOW' }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />
      case 'high':
        return <TrendingUp className="h-3.5 w-3.5 text-[#F59E0B]" />
      case 'medium':
        return <Activity className="h-3.5 w-3.5 text-[#3B82F6]" />
      default:
        return <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
    }
  }

  const classificationColors = getClassificationColor(subject.classification)
  const riskScore = intelligence?.riskScore || 0
  const riskColor = getRiskColor(riskScore)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 text-xs"
    >
      {/* Subject Identity Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
          classificationColors.bg
        )}>
          <User className={cn('h-6 w-6', classificationColors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-[#171717] truncate">
              {subject.subjectId}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] capitalize flex-shrink-0',
                classificationColors.border,
                classificationColors.text
              )}
            >
              {subject.classification.replace('-', ' ')}
            </Badge>
          </div>
          <div className="text-[10px] text-[#737373] truncate">
            {subject.caseNumber} • {subject.investigation}
          </div>
        </div>
      </div>

      {/* AI Intelligence Summary */}
      {intelligence && (
        <Card className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border-[#3B82F6]">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-[#3B82F6] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-[#1E3A8A] mb-1.5">
                  AI Intelligence Summary
                </div>
                <div className="text-[10px] text-[#1E40AF] leading-relaxed">
                  {intelligence.summary}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Score Gauge */}
      {intelligence && (
        <Card className="bg-white border border-[#E5E5E5]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-[#525252]" />
                <span className="text-[10px] font-semibold text-[#171717]">
                  Risk Assessment
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold',
                  riskColor.text,
                  riskColor.text.replace('text-', 'border-')
                )}
              >
                {riskColor.level}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#737373]">Score</span>
                <span className={cn('font-bold', riskColor.text)}>
                  {riskScore}/100
                </span>
              </div>
              <Progress
                value={riskScore}
                className={cn('h-2', riskColor.bg)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-white border border-[#E5E5E5]">
          <CardContent className="p-2">
            <div className="flex flex-col items-center text-center">
              <MapPin className="h-3.5 w-3.5 text-[#A3A3A3] mb-1" />
              <div className="text-base font-bold text-[#171717]">
                {defaultStats.locationsVisited}
              </div>
              <div className="text-[9px] text-[#737373]">Locations</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E5E5E5]">
          <CardContent className="p-2">
            <div className="flex flex-col items-center text-center">
              <Zap className="h-3.5 w-3.5 text-[#F59E0B] mb-1" />
              <div className="text-base font-bold text-[#171717]">
                {defaultStats.alertsTriggered}
              </div>
              <div className="text-[9px] text-[#737373]">Alerts</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E5E5E5]">
          <CardContent className="p-2">
            <div className="flex flex-col items-center text-center">
              <Clock className="h-3.5 w-3.5 text-[#A3A3A3] mb-1" />
              <div className="text-base font-bold text-[#171717]">
                {defaultStats.daysTracked}d
              </div>
              <div className="text-[9px] text-[#737373]">Tracked</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Behavioral Insights */}
      {intelligence && intelligence.behavioralInsights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Brain className="h-3.5 w-3.5 text-[#525252]" />
            <span className="text-[10px] font-semibold text-[#171717]">
              Behavioral Insights
            </span>
          </div>
          <div className="space-y-1.5">
            {intelligence.behavioralInsights.slice(0, 3).map((insight, idx) => (
              <Card key={idx} className="bg-white border border-[#E5E5E5]">
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(insight.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-[#171717] mb-0.5">
                        {insight.title}
                      </div>
                      <div className="text-[9px] text-[#737373] leading-relaxed mb-1">
                        {insight.description}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {insight.tags.slice(0, 3).map((tag, tagIdx) => (
                          <Badge
                            key={tagIdx}
                            variant="outline"
                            className="text-[8px] px-1.5 py-0 h-4 border-[#E5E5E5] text-[#737373]"
                          >
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-[8px] text-[#A3A3A3] ml-auto">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Geographic Intelligence */}
      {intelligence && (
        <Card className="bg-white border border-[#E5E5E5]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3.5 w-3.5 text-[#525252]" />
              <span className="text-[10px] font-semibold text-[#171717]">
                Geographic Intelligence
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-[#737373]">Primary Zone</span>
                <span className="text-[10px] font-medium text-[#171717] text-right max-w-[60%]">
                  {intelligence.geographicIntelligence.primaryZone}
                </span>
              </div>
              {intelligence.geographicIntelligence.clusters.length > 0 && (
                <div>
                  <div className="text-[9px] text-[#737373] mb-1">Activity Clusters</div>
                  <div className="space-y-1">
                    {intelligence.geographicIntelligence.clusters.slice(0, 2).map((cluster, idx) => (
                      <div key={idx} className="text-[9px] bg-[#F5F5F5] rounded p-1.5">
                        <div className="font-medium text-[#171717]">{cluster.name}</div>
                        <div className="text-[#737373]">{cluster.significance}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Context */}
      {intelligence && (
        <Card className="bg-white border border-[#E5E5E5]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3.5 w-3.5 text-[#525252]" />
              <span className="text-[10px] font-semibold text-[#171717]">
                Network Analysis
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#737373]">Est. Associates</span>
                <span className="text-[10px] font-bold text-[#171717]">
                  {intelligence.networkInference.likelyAssociates}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#737373]">Network Risk</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] capitalize',
                    intelligence.networkInference.networkRisk === 'critical' && 'border-[#EF4444] text-[#EF4444]',
                    intelligence.networkInference.networkRisk === 'high' && 'border-[#F59E0B] text-[#F59E0B]',
                    intelligence.networkInference.networkRisk === 'medium' && 'border-[#3B82F6] text-[#3B82F6]',
                    intelligence.networkInference.networkRisk === 'low' && 'border-[#10B981] text-[#10B981]'
                  )}
                >
                  {intelligence.networkInference.networkRisk}
                </Badge>
              </div>
              <div className="text-[9px] text-[#737373] leading-relaxed pt-1 border-t border-[#E5E5E5]">
                {intelligence.networkInference.inference}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations */}
      {intelligence && intelligence.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Target className="h-3.5 w-3.5 text-[#525252]" />
            <span className="text-[10px] font-semibold text-[#171717]">
              Recommendations
            </span>
          </div>
          <div className="space-y-1.5">
            {intelligence.recommendations.slice(0, 2).map((rec, idx) => (
              <Card key={idx} className={cn(
                'border',
                rec.priority === 'immediate' && 'bg-[#FEE2E2] border-[#EF4444]',
                rec.priority === 'high' && 'bg-[#FEF3C7] border-[#F59E0B]',
                rec.priority !== 'immediate' && rec.priority !== 'high' && 'bg-white border-[#E5E5E5]'
              )}>
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    <Shield className={cn(
                      'h-3.5 w-3.5 mt-0.5 flex-shrink-0',
                      rec.priority === 'immediate' && 'text-[#EF4444]',
                      rec.priority === 'high' && 'text-[#F59E0B]',
                      rec.priority !== 'immediate' && rec.priority !== 'high' && 'text-[#525252]'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[8px] px-1.5 py-0 h-4 uppercase',
                            rec.priority === 'immediate' && 'border-[#EF4444] text-[#EF4444]',
                            rec.priority === 'high' && 'border-[#F59E0B] text-[#F59E0B]',
                            rec.priority !== 'immediate' && rec.priority !== 'high' && 'border-[#A3A3A3] text-[#A3A3A3]'
                          )}
                        >
                          {rec.priority}
                        </Badge>
                        <span className="text-[10px] font-semibold text-[#171717]">
                          {rec.action}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#737373] leading-relaxed">
                        {rec.rationale}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Status Footer */}
      <Card className="bg-white border border-[#E5E5E5]">
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-[#10B981]" />
              <span className="text-[9px] font-medium text-[#171717]">Live Monitoring</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[9px] text-[#737373]">{defaultStats.lastUpdate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
