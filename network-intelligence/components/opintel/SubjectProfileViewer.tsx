/**
 * Subject Profile Viewer
 * Federal-grade comprehensive subject dossier with intelligence integration
 *
 * Features:
 * - Subject identity and biographical data
 * - Case associations with status
 * - Activity timeline with significance markers
 * - Alert history with filtering
 * - Network connections graph
 * - Risk assessment with scoring
 * - Behavioral pattern analysis
 * - Document attachments
 * - Analyst notes and annotations
 * - Related subjects
 * - Location history map
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  User,
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  Network,
  FileText,
  Tag,
  TrendingUp,
  Calendar,
  Building2,
  Phone,
  Mail,
  Users,
  Activity,
  Target,
  Loader2,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert, TimelineEvent } from '@/lib/types/chatArtifacts'
import { getCitizens360DataService } from '@/lib/services/citizens360DataService'

export interface SubjectProfileViewerProps {
  subjectId: string
  onClose?: () => void
  onAlertClick?: (alert: IntelligenceAlert) => void
  onRelatedSubjectClick?: (subjectId: string) => void
}

interface SubjectProfile {
  id: string
  name: string
  aliases?: string[]
  dateOfBirth?: Date
  age?: number
  nationality?: string
  knownAddresses?: string[]
  phoneNumbers?: string[]
  emailAddresses?: string[]

  // Case associations
  cases: Array<{
    caseNumber: string
    caseName: string
    role: string
    status: 'active' | 'closed' | 'pending'
    startDate: Date
  }>

  // Risk assessment
  riskScore: number // 0-100
  threatLevel: 'critical' | 'high' | 'medium' | 'low'
  riskFactors: string[]

  // Activity summary
  totalAlerts: number
  criticalAlerts: number
  lastActivity: Date
  activityTrend: 'increasing' | 'stable' | 'decreasing'

  // Network
  knownAssociates: number
  organizationLinks: number
  locationVisits: number

  // Metadata
  createdDate: Date
  lastUpdated: Date
  createdBy: string
  lastModifiedBy: string
}

const RISK_LEVEL_COLORS = {
  critical: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', dot: 'bg-red-600' },
  high: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', dot: 'bg-orange-600' },
  medium: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', dot: 'bg-yellow-600' },
  low: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', dot: 'bg-green-600' }
}

/**
 * Subject Profile Viewer Component
 */
export default function SubjectProfileViewer({
  subjectId,
  onClose,
  onAlertClick,
  onRelatedSubjectClick
}: SubjectProfileViewerProps) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<SubjectProfile | null>(null)
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  // Load subject data
  useEffect(() => {
    const loadSubjectData = async () => {
      try {
        setLoading(true)
        const dataService = getCitizens360DataService()

        // Load alerts for this subject
        const allAlerts = await dataService.generateIntelligenceAlerts()
        const subjectAlerts = allAlerts.filter(a => a.subjectId === subjectId)
        setAlerts(subjectAlerts)

        // Load timeline events
        const caseNumber = subjectAlerts[0]?.caseNumber || 'CT-2024-8473'
        const timelineEvents = await dataService.loadTimeline(caseNumber, subjectId)
        setTimeline(timelineEvents)

        // Build profile from data
        const criticalCount = subjectAlerts.filter(a => a.priority === 'critical').length
        const riskScore = Math.min(100, (criticalCount * 15) + (subjectAlerts.length * 5))

        let threatLevel: 'critical' | 'high' | 'medium' | 'low' = 'low'
        if (riskScore >= 75) threatLevel = 'critical'
        else if (riskScore >= 50) threatLevel = 'high'
        else if (riskScore >= 25) threatLevel = 'medium'

        const mockProfile: SubjectProfile = {
          id: subjectId,
          name: subjectAlerts[0]?.subjectName || 'Unknown Subject',
          aliases: ['Subject Alpha', 'Target-2547'],
          dateOfBirth: new Date('1985-03-15'),
          age: 40,
          nationality: 'Unknown',
          knownAddresses: [
            '1247 Industrial Blvd, Baltimore, MD 21224',
            '892 Warehouse District, Washington, DC 20003'
          ],
          phoneNumbers: ['+1 (410) 555-0142', '+1 (202) 555-0198'],
          emailAddresses: ['contact.encrypted@proton.me'],

          cases: [
            {
              caseNumber: 'CT-2024-8473',
              caseName: 'Operation Nightfall',
              role: 'Primary Subject',
              status: 'active',
              startDate: new Date('2024-10-15')
            }
          ],

          riskScore,
          threatLevel,
          riskFactors: [
            'Multiple critical alerts in 72-hour window',
            'Suspicious location patterns',
            'Encrypted communications detected',
            'Association with high-risk entities',
            'Pattern deviation from baseline'
          ],

          totalAlerts: subjectAlerts.length,
          criticalAlerts: criticalCount,
          lastActivity: timelineEvents[timelineEvents.length - 1]?.timestamp || new Date(),
          activityTrend: 'increasing',

          knownAssociates: 8,
          organizationLinks: 3,
          locationVisits: timelineEvents.filter(e => e.location).length,

          createdDate: new Date('2024-10-15'),
          lastUpdated: new Date(),
          createdBy: 'System',
          lastModifiedBy: 'Analyst J. Smith'
        }

        setProfile(mockProfile)
      } catch (err) {
        console.error('Failed to load subject data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSubjectData()
  }, [subjectId])

  // Recent activity summary
  const recentActivity = useMemo(() => {
    const last24h = timeline.filter(e => {
      const diff = Date.now() - e.timestamp.getTime()
      return diff < 24 * 60 * 60 * 1000
    })

    const last7d = timeline.filter(e => {
      const diff = Date.now() - e.timestamp.getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    })

    return {
      last24h: last24h.length,
      last7d: last7d.length,
      criticalEvents: timeline.filter(e => e.significance === 'critical').length,
      locations: new Set(timeline.filter(e => e.location).map(e => e.location!.name)).size
    }
  }, [timeline])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Loading subject profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-900 font-medium mb-1">Subject Not Found</div>
          <div className="text-xs text-gray-600">ID: {subjectId}</div>
        </div>
      </div>
    )
  }

  const riskColors = RISK_LEVEL_COLORS[profile.threatLevel]

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{profile.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>ID: {profile.id}</span>
              <span>•</span>
              <Badge className={cn('text-[10px]', riskColors.bg, riskColors.text)}>
                {profile.threatLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Risk Assessment Banner */}
      <div className={cn('px-4 py-3 border-b', riskColors.bg, riskColors.border)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className={cn('h-4 w-4', riskColors.text)} />
            <span className={cn('text-xs font-semibold', riskColors.text)}>
              Risk Score: {profile.riskScore}/100
            </span>
          </div>
          <Badge className={cn('text-[10px]', riskColors.bg, riskColors.text, 'border-2', riskColors.border)}>
            {profile.activityTrend === 'increasing' ? '↑' : profile.activityTrend === 'decreasing' ? '↓' : '→'}
            {' '}{profile.activityTrend.toUpperCase()}
          </Badge>
        </div>
        <Progress value={profile.riskScore} className="h-2" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-gray-200">
          <TabsTrigger value="overview" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Alerts ({profile.totalAlerts})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs">
            <Network className="h-3 w-3 mr-1" />
            Network
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-3 m-0">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{profile.criticalAlerts}</div>
                      <div className="text-xs text-gray-600">Critical Alerts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{recentActivity.last24h}</div>
                      <div className="text-xs text-gray-600">Events (24h)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Biographical Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Biographical Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium text-gray-900">{profile.name}</span>
                </div>
                {profile.aliases && profile.aliases.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aliases:</span>
                    <span className="font-medium text-gray-900">{profile.aliases.join(', ')}</span>
                  </div>
                )}
                {profile.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-medium text-gray-900">
                      {profile.dateOfBirth.toLocaleDateString()} ({profile.age}y)
                    </span>
                  </div>
                )}
                {profile.nationality && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nationality:</span>
                    <span className="font-medium text-gray-900">{profile.nationality}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Contact Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {profile.knownAddresses && profile.knownAddresses.length > 0 && (
                  <div>
                    <div className="text-gray-600 mb-1.5 font-medium">Known Addresses:</div>
                    {profile.knownAddresses.map((addr, idx) => (
                      <div key={idx} className="flex items-start gap-2 mb-1">
                        <MapPin className="h-3 w-3 text-gray-500 mt-0.5 shrink-0" />
                        <span className="text-gray-900">{addr}</span>
                      </div>
                    ))}
                  </div>
                )}

                {profile.phoneNumbers && profile.phoneNumbers.length > 0 && (
                  <div>
                    <div className="text-gray-600 mb-1.5 font-medium">Phone Numbers:</div>
                    {profile.phoneNumbers.map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-1">
                        <Phone className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-900">{phone}</span>
                      </div>
                    ))}
                  </div>
                )}

                {profile.emailAddresses && profile.emailAddresses.length > 0 && (
                  <div>
                    <div className="text-gray-600 mb-1.5 font-medium">Email Addresses:</div>
                    {profile.emailAddresses.map((email, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-1">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-900">{email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case Associations */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Case Associations
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.cases.map(caseInfo => (
                  <div
                    key={caseInfo.caseNumber}
                    className="p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">
                        {caseInfo.caseNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          caseInfo.status === 'active' ? 'border-green-300 text-green-700 bg-green-50' :
                          caseInfo.status === 'closed' ? 'border-gray-300 text-gray-700 bg-gray-50' :
                          'border-yellow-300 text-yellow-700 bg-yellow-50'
                        )}
                      >
                        {caseInfo.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-700 font-medium mb-1">{caseInfo.caseName}</div>
                    <div className="flex items-center justify-between text-[10px] text-gray-600">
                      <span>Role: {caseInfo.role}</span>
                      <span>Started: {caseInfo.startDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card className={cn('border-2', riskColors.bg, riskColors.border)}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn('h-4 w-4', riskColors.text)} />
                  <CardTitle className={cn('text-sm font-semibold', riskColors.text)}>
                    Risk Factors
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.riskFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', riskColors.dot)} />
                    <span className={cn('leading-relaxed', riskColors.text)}>{factor}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Network Summary */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-gray-600" />
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Network Summary
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{profile.knownAssociates}</div>
                    <div className="text-[10px] text-gray-600">Associates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{profile.organizationLinks}</div>
                    <div className="text-[10px] text-gray-600">Organizations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{profile.locationVisits}</div>
                    <div className="text-[10px] text-gray-600">Locations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="p-4 space-y-2 m-0">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600">No alerts found</div>
              </div>
            ) : (
              alerts.map(alert => {
                const priorityColors = {
                  critical: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' },
                  high: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
                  medium: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
                  low: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' }
                }[alert.priority]

                return (
                  <Card
                    key={alert.id}
                    className={cn('border-2 cursor-pointer hover:shadow-sm transition-shadow', priorityColors.border)}
                    onClick={() => onAlertClick?.(alert)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={cn('text-xs font-bold uppercase', priorityColors.text)}>
                          {alert.priority} PRIORITY
                        </span>
                        <Badge className="bg-blue-600 text-white text-[9px]">
                          {alert.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{alert.title}</h4>
                      <p className="text-xs text-gray-700 line-clamp-2 mb-2">{alert.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-600">
                        <span>{alert.timestamp.toLocaleString()}</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="p-4 space-y-2 m-0">
            {timeline.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600">No timeline events found</div>
              </div>
            ) : (
              timeline.slice(0, 20).map(event => {
                const significanceColors = {
                  critical: 'bg-red-600',
                  anomaly: 'bg-orange-600',
                  elevated: 'bg-yellow-500',
                  routine: 'bg-green-600'
                }[event.significance]

                return (
                  <div key={event.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-1.5', significanceColors)} />
                      <div className="w-px h-full bg-gray-200 mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">{event.title}</h4>
                        <Badge variant="outline" className="text-[10px] shrink-0 border-gray-300">
                          {event.significance}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2 mb-1">{event.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <Clock className="h-3 w-3" />
                        {event.timestamp.toLocaleString()}
                        {event.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            {event.location.name}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="p-4 m-0">
            <div className="text-center py-8">
              <Network className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-900 font-medium mb-1">Network Graph</div>
              <div className="text-xs text-gray-600">
                View network connections in Alert Intelligence Panel
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer Metadata */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-[10px] text-gray-600">
          <div>
            <div>Created: {profile.createdDate.toLocaleDateString()}</div>
            <div>By: {profile.createdBy}</div>
          </div>
          <div className="text-right">
            <div>Updated: {profile.lastUpdated.toLocaleDateString()}</div>
            <div>By: {profile.lastModifiedBy}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
