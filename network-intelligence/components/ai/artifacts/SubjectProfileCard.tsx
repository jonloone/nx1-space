'use client'

import React from 'react'
import type { SubjectProfileArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { User, MapPin, AlertTriangle, Calendar, FileText } from 'lucide-react'
import {
  formatRiskScore,
  getClassificationColor,
  formatRelativeTime
} from '@/lib/utils/artifactHelpers'

interface SubjectProfileCardProps {
  artifact: SubjectProfileArtifact
}

/**
 * Subject Profile Card - Complete Investigation Dossier
 *
 * Displays:
 * - Subject identification and classification
 * - Risk score with visual indicator
 * - Location statistics (total, anomalies, suspicious, routine)
 * - Investigation details (case number, timeframe, status)
 * - Quick actions (View Timeline, Show Heatmap, Export)
 */
export default function SubjectProfileCard({ artifact }: SubjectProfileCardProps) {
  const { data, actions = [] } = artifact
  const riskData = formatRiskScore(data.riskScore)

  return (
    <Card className="border border-border shadow-mundi-sm hover:shadow-mundi-md transition-all">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-mundi-200 flex items-center justify-center">
              <User className="w-6 h-6 text-mundi-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{data.subjectId}</h3>
              <p className="text-xs text-muted-foreground">Case: {data.caseNumber}</p>
            </div>
          </div>

          {/* Classification Badge */}
          <Badge className={`${getClassificationColor(data.classification)} text-xs`}>
            {data.classification.replace('-', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Risk Score Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Risk Assessment</span>
            <Badge className={`${riskData.color} text-xs`}>
              {riskData.label}
            </Badge>
          </div>
          <div className="space-y-1">
            <Progress
              value={data.riskScore}
              className="h-2"
            />
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Score: {data.riskScore}/100</span>
              <span className="text-xs text-muted-foreground">
                {riskData.level === 'critical' && '⚠️ Immediate Action Required'}
                {riskData.level === 'high' && '⚡ Priority Monitoring'}
                {riskData.level === 'medium' && '👁️ Active Surveillance'}
                {riskData.level === 'low' && '✓ Routine Watch'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Locations */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-mundi-600" />
              <span className="text-xs font-medium text-foreground">Locations</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{data.stats.totalLocations}</div>
          </div>

          {/* Anomalies */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              <span className="text-xs font-medium text-foreground">Anomalies</span>
            </div>
            <div className="text-2xl font-bold text-[#EF4444]">{data.stats.anomalies}</div>
          </div>

          {/* Suspicious Activity */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">Suspicious</span>
            </div>
            <div className="text-xl font-semibold text-[#F59E0B]">{data.stats.suspicious}</div>
          </div>

          {/* Routine Activity */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">Routine</span>
            </div>
            <div className="text-xl font-semibold text-[#10B981]">{data.stats.routine}</div>
          </div>
        </div>

        {/* Investigation Details */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Investigation:</span>
            <span className="font-medium text-foreground">{data.investigation}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={data.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {data.status.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Period:</span>
            <span className="text-foreground">
              {data.period.start.toLocaleDateString()} - {data.period.end.toLocaleDateString()}
            </span>
          </div>

          {data.stats.estimatedAssociates > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Network:</span>
              <span className="font-medium text-[#F59E0B]">
                {data.stats.estimatedAssociates} suspected associate{data.stats.estimatedAssociates > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {data.lastSeen && (
            <div className="p-2 mt-2 rounded-lg bg-mundi-100 border border-mundi-300">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3 h-3 text-mundi-700" />
                <span className="font-medium text-mundi-900">Last Seen:</span>
              </div>
              <div className="text-xs text-mundi-800 mt-1 ml-5">
                {data.lastSeen.location}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 ml-5">
                {formatRelativeTime(data.lastSeen.timestamp)}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex gap-2 pt-2">
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
