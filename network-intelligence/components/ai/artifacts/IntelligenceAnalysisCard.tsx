'use client'

import React from 'react'
import type { IntelligenceAnalysisArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent } from '@/components/ui/card'

interface IntelligenceAnalysisCardProps {
  artifact: IntelligenceAnalysisArtifact
}

export default function IntelligenceAnalysisCard({ artifact }: IntelligenceAnalysisCardProps) {
  const { data } = artifact
  return (
    <Card className="border border-[#E5E5E5] shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-[#171717]">
          🧠 Intelligence Analysis
        </div>
        <div className="text-xs text-[#737373] mt-1">
          Risk Score: {data.riskScore}/100
        </div>
        <div className="text-xs text-[#525252] mt-2 leading-relaxed">
          {data.executiveSummary}
        </div>
      </CardContent>
    </Card>
  )
}
