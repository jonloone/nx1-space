/**
 * Intelligence Alert Panel
 * Federal-grade alert details with advanced visualizations
 *
 * Features:
 * - Overview: Priority distribution chart (visx)
 * - Timeline: Temporal activity visualization (visx)
 * - Network: Subject connection graph (graphology)
 * - Analysis: Related events table (TanStack)
 */

'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import ReactMarkdown from 'react-markdown'

export interface IntelligenceAlertPanelProps {
  alert: IntelligenceAlert
  relatedAlerts?: IntelligenceAlert[]
  onClose: () => void
  onAlertClick?: (alertId: string) => void
  onSubjectClick?: (subjectId: string) => void
}

/**
 * Priority color mapping (federal standard)
 */
export function getPriorityColor(priority: string): {
  bg: string
  border: string
  text: string
  dot: string
} {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-600'
      }
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-600'
      }
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-600'
      }
    case 'low':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-600'
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        dot: 'bg-gray-600'
      }
  }
}

/**
 * Confidence badge styling
 */
export function getConfidenceBadge(confidence: string): {
  color: string
  label: string
} {
  switch (confidence) {
    case 'confirmed':
      return { color: 'bg-green-100 text-green-800 border-green-300', label: 'CONFIRMED' }
    case 'high':
      return { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'HIGH CONFIDENCE' }
    case 'medium':
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'MEDIUM CONFIDENCE' }
    case 'low':
      return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'LOW CONFIDENCE' }
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'UNKNOWN' }
  }
}

export default function IntelligenceAlertPanel({
  alert,
  relatedAlerts = [],
  onClose,
  onAlertClick,
  onSubjectClick
}: IntelligenceAlertPanelProps) {
  const priorityColors = getPriorityColor(alert.priority)

  // Calculate relative time
  const getRelativeTime = (timestamp: Date) => {
    const now = Date.now()
    const diff = now - timestamp.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Minimal Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-4">
          {/* Priority indicator */}
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-1.5 h-1.5 rounded-full', priorityColors.dot)} />
            <span className={cn('text-xs font-semibold uppercase tracking-wide', priorityColors.text)}>
              {alert.priority}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{alert.caseName}</span>
          </div>

          {/* Alert Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
            {alert.title}
          </h2>

          {/* Subject • Location • Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => onSubjectClick?.(alert.subjectId)}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {alert.subjectName}
            </button>
            {alert.location && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{alert.location.name}</span>
              </>
            )}
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">{getRelativeTime(alert.timestamp)}</span>
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
          {/* Alert Description */}
          {alert.description && (
            <div className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed">
              <ReactMarkdown>
                {alert.description}
              </ReactMarkdown>
            </div>
          )}

          {/* Intelligence Assessment Table */}
          {alert.analysis && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Assessment</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-200">
                    {/* Event Details */}
                    <tr>
                      <td className="px-4 py-3 font-semibold text-gray-700 bg-gray-50 w-40">Event</td>
                      <td className="px-4 py-3 text-gray-900">
                        <div className="space-y-1">
                          <div><span className="text-gray-600">Location:</span> {alert.location?.name || 'Unknown'}</div>
                          <div><span className="text-gray-600">Time:</span> {new Date(alert.timestamp).toLocaleString()}</div>
                        </div>
                      </td>
                    </tr>

                    {/* Temporal Analysis */}
                    {alert.analysis.temporal && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-purple-700 bg-purple-50">Temporal Analysis</td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="space-y-1.5">
                            <div><span className="text-gray-600">Time of Day:</span> {alert.analysis.temporal.timeOfDay.replace(/_/g, ' ')}</div>
                            {alert.analysis.temporal.trafficLevel && (
                              <div><span className="text-gray-600">Traffic Level:</span> {alert.analysis.temporal.trafficLevel.replace(/_/g, ' ')}</div>
                            )}
                            {alert.analysis.temporal.pedestrianDensity && (
                              <div><span className="text-gray-600">Pedestrian Density:</span> {alert.analysis.temporal.pedestrianDensity.replace(/_/g, ' ')}</div>
                            )}
                            {alert.analysis.temporal.anomalyDetected && (
                              <div className="text-red-600 font-semibold mt-2">
                                ⚠️ ANOMALY DETECTED
                                {alert.analysis.temporal.anomalyReasons && alert.analysis.temporal.anomalyReasons.length > 0 && (
                                  <ul className="list-disc list-inside mt-1 text-sm font-normal">
                                    {alert.analysis.temporal.anomalyReasons.map((reason, idx) => (
                                      <li key={idx}>{reason}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* GEOINT */}
                    {alert.analysis.geoint && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-green-700 bg-green-50">GEOINT</td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="space-y-1.5">
                            {alert.analysis.geoint.buildingType && (
                              <div><span className="text-gray-600">Building Type:</span> {alert.analysis.geoint.buildingType}</div>
                            )}
                            {alert.analysis.geoint.landUseZone && (
                              <div><span className="text-gray-600">Land Use Zone:</span> {alert.analysis.geoint.landUseZone}</div>
                            )}
                            <div><span className="text-gray-600">Address:</span> {alert.analysis.geoint.addressVerified ? '✓ Verified' : '✗ Unverified'}</div>
                            {alert.analysis.geoint.contextualNotes && alert.analysis.geoint.contextualNotes.length > 0 && (
                              <ul className="list-disc list-inside text-gray-600 italic mt-1">
                                {alert.analysis.geoint.contextualNotes.map((note, idx) => (
                                  <li key={idx}>{note}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* SIGINT */}
                    {alert.analysis.sigint && alert.analysis.sigint.nearbyCellTowers > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-blue-700 bg-blue-50">SIGINT</td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="space-y-1.5">
                            <div><span className="text-gray-600">Cell Tower:</span> {alert.analysis.sigint.strongestTower?.operator || 'Unknown'}</div>
                            {alert.analysis.sigint.strongestTower && (
                              <>
                                <div><span className="text-gray-600">Operator:</span> {alert.analysis.sigint.strongestTower.operator} ({alert.analysis.sigint.strongestTower.radioType})</div>
                                <div><span className="text-gray-600">Distance:</span> {alert.analysis.sigint.strongestTower.distanceMeters}m</div>
                              </>
                            )}
                            {alert.analysis.sigint.estimatedSignalStrength && (
                              <div><span className="text-gray-600">Signal Strength:</span> {alert.analysis.sigint.estimatedSignalStrength}%</div>
                            )}
                            <div className="text-gray-600 italic">Subject's device would ping tower {alert.analysis.sigint.strongestTower?.operator}. Signal strength: {alert.analysis.sigint.estimatedSignalStrength ? `${alert.analysis.sigint.estimatedSignalStrength}%` : 'unknown'}.</div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* OSINT */}
                    {alert.analysis.osint?.businessData && (
                      <tr>
                        <td className="px-4 py-3 font-semibold text-amber-700 bg-amber-50">OSINT</td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="space-y-1.5">
                            <div className="font-medium">{alert.analysis.osint.businessData.name}</div>
                            {alert.analysis.osint.businessData.owner && (
                              <div><span className="text-gray-600">Owner:</span> {alert.analysis.osint.businessData.owner}</div>
                            )}
                            {alert.analysis.osint.businessData.status && (
                              <div><span className="text-gray-600">Status:</span> {alert.analysis.osint.businessData.status.toUpperCase()}</div>
                            )}
                            {alert.analysis.osint.businessData.operatingHours && (
                              <div><span className="text-gray-600">Operating Hours:</span> {alert.analysis.osint.businessData.operatingHours}</div>
                            )}
                            {alert.analysis.osint.businessData.ownership?.owner_subject_id && (
                              <div className="text-red-600 font-semibold mt-2">
                                ⚠️ CRITICAL: Owner is {alert.analysis.osint.businessData.ownership.owner_subject_id} (investigation subject)
                              </div>
                            )}
                            {alert.analysis.osint.businessData.suspicious && (
                              <div className="mt-2">
                                <span className="text-gray-600">Risk Score:</span> <span className="text-red-600 font-semibold">{alert.analysis.osint.businessData.suspicious.risk_score}/100</span>
                                {alert.analysis.osint.businessData.suspicious.flags.length > 0 && (
                                  <div className="text-gray-600 mt-1">Suspicious Indicators: {alert.analysis.osint.businessData.suspicious.flags.join(', ')}</div>
                                )}
                              </div>
                            )}
                            {alert.analysis.osint.socialMediaPresence && (
                              <div><span className="text-gray-600">Online Presence:</span> {alert.analysis.osint.socialMediaPresence.level}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Key Intelligence - Combined Risks & Actions */}
          {alert.analysis && (alert.analysis.riskIndicators?.length > 0 || alert.analysis.recommendedActions?.length > 0) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Intelligence</h3>
              <div className="space-y-2">
                {/* Risks */}
                {alert.analysis.riskIndicators?.map((risk, idx) => (
                  <div
                    key={`risk-${idx}`}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border-l-2 border-red-500"
                  >
                    <div className="text-red-600 font-semibold text-xs mt-0.5">RISK</div>
                    <p className="text-sm text-gray-800 leading-relaxed flex-1">{risk}</p>
                  </div>
                ))}

                {/* Actions */}
                {alert.analysis.recommendedActions?.map((action, idx) => (
                  <div
                    key={`action-${idx}`}
                    className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-2 border-green-500"
                  >
                    <div className="text-green-600 font-semibold text-xs mt-0.5">ACTION</div>
                    <p className="text-sm text-gray-800 leading-relaxed flex-1">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Case Info & Confidence */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>Case {alert.caseNumber}</div>
              <div className="flex items-center gap-4">
                {alert.analysis && (
                  <div>Analysis: {alert.analysis.confidenceScore}%</div>
                )}
                <div className="capitalize">Confidence: {alert.confidence}</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
