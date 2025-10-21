'use client'

/**
 * Intelligence Report Component
 *
 * Generates and exports comprehensive intelligence summary reports
 * for investigations. Provides executive summary, timeline, location
 * analysis, pattern detection, and recommendations.
 *
 * Export Formats:
 * - PDF (print view)
 * - JSON (data export)
 * - Print view
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Printer,
  Share2,
  Shield,
  MapPin,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { InvestigationSubject, LocationStop } from '@/lib/demo/investigation-demo-data'

interface IntelligenceReportProps {
  subject: InvestigationSubject
  locations: LocationStop[]
  trackingPointsCount: number
  patternAnalysis: {
    routineLocations: LocationStop[]
    suspiciousLocations: LocationStop[]
    anomalyLocations: LocationStop[]
    keyFindings: string[]
  }
  onClose?: () => void
}

export default function IntelligenceReport({
  subject,
  locations,
  trackingPointsCount,
  patternAnalysis,
  onClose
}: IntelligenceReportProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export using jsPDF or similar
    console.log('Exporting to PDF...')
    alert('PDF export functionality to be implemented')
  }

  const handleExportJSON = () => {
    const reportData = {
      subject,
      locations,
      trackingPointsCount,
      patternAnalysis,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investigation-report-${subject.subjectId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getDuration = () => {
    const durationMs = subject.endDate.getTime() - subject.startDate.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    return `${hours} hours (${Math.floor(hours / 24)} days)`
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Not printed */}
      <div className="print:hidden flex items-center justify-between p-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#525252]" />
          <h3 className="text-sm font-semibold text-[#171717]">Intelligence Report</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
          >
            <Printer className="h-3 w-3 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
          >
            <Download className="h-3 w-3 mr-2" />
            Export JSON
          </Button>
          <Button
            size="sm"
            onClick={handleExportPDF}
            className="bg-[#176BF8] hover:bg-[#0D4DB8] text-white"
          >
            <Download className="h-3 w-3 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div ref={reportRef} className="p-8 max-w-4xl mx-auto space-y-6">
          {/* Report Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#EF4444] rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#171717]">
                    Investigation Intelligence Report
                  </h1>
                  <p className="text-sm text-[#737373]">
                    Generated on {formatDate(new Date())}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs border-[#EF4444] text-[#EF4444]">
                CONFIDENTIAL
              </Badge>
            </div>

            {/* Legal Notice */}
            <Card className="bg-[#FEF3C7] border-[#F59E0B]">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#92400E]">
                    <strong>LEGAL NOTICE:</strong> This report contains information obtained
                    through authorized law enforcement investigation. Unauthorized disclosure is
                    prohibited. {subject.legalAuthorization}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="bg-[#E5E5E5]" />

          {/* Executive Summary */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#171717] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#176BF8]" />
              Executive Summary
            </h2>

            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-[#737373] mb-1">Subject ID</div>
                  <div className="text-sm font-bold text-[#171717] font-mono">
                    {subject.subjectId}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-[#737373] mb-1">Locations</div>
                  <div className="text-sm font-bold text-[#171717]">{locations.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-[#737373] mb-1">Anomalies</div>
                  <div className="text-sm font-bold text-[#EF4444]">
                    {patternAnalysis.anomalyLocations.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="text-xs text-[#737373] mb-1">Duration</div>
                  <div className="text-sm font-bold text-[#171717]">{getDuration()}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#737373]">Case Number:</span>
                  <span className="text-[#171717] font-mono font-semibold">
                    {subject.caseNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#737373]">Investigation:</span>
                  <span className="text-[#171717] font-medium">{subject.investigation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#737373]">Classification:</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {subject.classification.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#737373]">Timeline:</span>
                  <span className="text-[#171717] text-xs">
                    {formatDate(subject.startDate)} — {formatDate(subject.endDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator className="bg-[#E5E5E5]" />

          {/* Key Findings */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#171717] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
              Key Findings
            </h2>

            <div className="space-y-2">
              {patternAnalysis.keyFindings.map((finding, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#EF4444] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-[#171717]">{finding}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="bg-[#E5E5E5]" />

          {/* Location Analysis */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#171717] flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#176BF8]" />
              Location Analysis
            </h2>

            <div className="space-y-3">
              {/* Anomaly Locations */}
              {patternAnalysis.anomalyLocations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#EF4444] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    Critical Anomalies ({patternAnalysis.anomalyLocations.length})
                  </h3>
                  <div className="space-y-2">
                    {patternAnalysis.anomalyLocations.map((loc) => (
                      <Card key={loc.id} className="border-l-4 border-[#EF4444]">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm text-[#171717]">{loc.name}</div>
                              <div className="text-xs text-[#737373] font-mono">
                                {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {loc.type}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-[#737373]">Arrival:</span>
                              <br />
                              <span className="text-[#171717]">
                                {formatDate(loc.arrivalTime)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#737373]">Dwell:</span>
                              <br />
                              <span className="text-[#171717]">{loc.dwellTimeMinutes} min</span>
                            </div>
                            <div>
                              <span className="text-[#737373]">Visits:</span>
                              <br />
                              <span className="text-[#171717]">{loc.visitCount}</span>
                            </div>
                          </div>
                          {loc.notes && (
                            <div className="mt-2 text-xs text-[#EF4444] bg-[#FEE2E2] p-2 rounded">
                              {loc.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspicious Locations */}
              {patternAnalysis.suspiciousLocations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#F59E0B] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    Suspicious Activity ({patternAnalysis.suspiciousLocations.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {patternAnalysis.suspiciousLocations.map((loc) => (
                      <Card key={loc.id} className="border-l-2 border-[#F59E0B]">
                        <CardContent className="p-2">
                          <div className="text-xs font-medium text-[#171717]">{loc.name}</div>
                          <div className="text-[10px] text-[#737373]">{loc.type}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator className="bg-[#E5E5E5]" />

          {/* Recommended Actions */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#171717] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
              Recommended Actions
            </h2>

            <div className="space-y-2">
              {[
                'Continue monitoring subject activity at identified anomaly locations',
                'Request warrant expansion for warehouse facility access',
                'Coordinate with field teams for potential surveillance operations',
                'Analyze associate network for additional persons of interest',
                'Review CCTV footage from identified critical timeframes'
              ].map((action, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                      <span className="text-sm text-[#171717]">{action}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="bg-[#E5E5E5]" />

          {/* Report Footer */}
          <div className="text-xs text-[#737373] space-y-1">
            <p>
              <strong>Classification:</strong> Law Enforcement Sensitive (LES)
            </p>
            <p>
              <strong>Dissemination:</strong> Authorized personnel only. Do not release to public.
            </p>
            <p>
              <strong>Legal Authorization:</strong> {subject.legalAuthorization}
            </p>
            <p>
              <strong>Generated:</strong> {formatDate(new Date())} | <strong>Report ID:</strong>{' '}
              RPT-{subject.subjectId}-{Date.now().toString().slice(-6)}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
