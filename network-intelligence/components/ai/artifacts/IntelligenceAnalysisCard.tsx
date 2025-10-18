'use client'

import React from 'react'
import type { IntelligenceAnalysisArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Brain, MapPin, Users, AlertCircle, Target, FileDown } from 'lucide-react'
import {
  getSeverityColor,
  getPriorityColor,
  formatRiskScore
} from '@/lib/utils/artifactHelpers'

interface IntelligenceAnalysisCardProps {
  artifact: IntelligenceAnalysisArtifact
}

/**
 * Intelligence Analysis Card - AI-Generated Insights
 *
 * Displays:
 * - Executive summary with risk score
 * - Behavioral insights with confidence and severity
 * - Geographic intelligence (zones, clusters, patterns)
 * - Network inference (associates, contacts, risk)
 * - Actionable recommendations with priority
 */
export default function IntelligenceAnalysisCard({ artifact }: IntelligenceAnalysisCardProps) {
  const { data, actions = [] } = artifact
  const riskData = formatRiskScore(data.riskScore)

  return (
    <Card className="border border-border shadow-mundi-sm hover:shadow-mundi-md transition-all">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Intelligence Analysis</h3>
              <p className="text-xs text-muted-foreground">AI-Generated Insights</p>
            </div>
          </div>

          {/* Risk Badge */}
          <Badge className={`${riskData.color} text-xs`}>
            Risk: {data.riskScore}/100
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Executive Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileDown className="w-3 h-3" />
            Executive Summary
          </h4>
          <p className="text-xs text-foreground leading-relaxed">
            {data.executiveSummary}
          </p>
        </div>

        {/* Behavioral Insights */}
        {data.behavioralInsights.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">Behavioral Insights</h4>
            <div className="space-y-2">
              {data.behavioralInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border bg-background"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{insight.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>

                    <Badge className={`${getSeverityColor(insight.severity)} text-xs ml-2`}>
                      {insight.severity.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium text-foreground">{insight.confidence}%</span>
                    </div>
                    <Progress value={insight.confidence} className="h-1.5" />
                  </div>

                  {/* Tags */}
                  {insight.tags && insight.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {insight.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geographic Intelligence */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-blue-700" />
            Geographic Intelligence
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Zone:</span>
              <span className="font-medium text-foreground">{data.geographicIntelligence.primaryZone}</span>
            </div>

            {data.geographicIntelligence.secondaryZones.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Secondary Zones:</span>
                <span className="font-medium text-foreground">
                  {data.geographicIntelligence.secondaryZones.length} area{data.geographicIntelligence.secondaryZones.length > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {data.geographicIntelligence.travelPatterns.length > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <span className="text-muted-foreground block mb-1">Patterns:</span>
                {data.geographicIntelligence.travelPatterns.map((pattern, i) => (
                  <div key={i} className="text-foreground text-xs">• {pattern}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Network Inference */}
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="w-3 h-3 text-orange-700" />
            Network Analysis
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Likely Associates:</span>
              <span className="font-semibold text-orange-700">{data.networkInference.likelyAssociates}</span>
            </div>

            {data.networkInference.meetingLocations.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">Meeting Locations:</span>
                {data.networkInference.meetingLocations.map((loc, i) => (
                  <Badge key={i} variant="outline" className="mr-1 text-xs">
                    {loc}
                  </Badge>
                ))}
              </div>
            )}

            {data.networkInference.suspiciousContacts.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">Suspicious Contacts:</span>
                {data.networkInference.suspiciousContacts.map((contact, i) => (
                  <div key={i} className="text-orange-800 text-xs">• {contact}</div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-orange-200">
              <span className="text-muted-foreground">Network Risk:</span>
              <Badge className={`${getSeverityColor(data.networkInference.networkRisk)} text-xs`}>
                {data.networkInference.networkRisk.toUpperCase()}
              </Badge>
            </div>

            {data.networkInference.inference && (
              <p className="text-foreground text-xs mt-2 p-2 rounded bg-white">
                {data.networkInference.inference}
              </p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
              <Target className="w-3 h-3" />
              Recommended Actions
            </h4>
            <div className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border bg-background"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{rec.action}</span>
                    <Badge className={`${getPriorityColor(rec.priority)} text-xs ml-2`}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">{rec.rationale}</p>

                  {rec.resources.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {rec.resources.map((resource, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => action.handler(data)}
              >
                {action.icon} {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
