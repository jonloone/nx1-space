'use client'

import React from 'react'
import type { SubjectProfileArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent } from '@/components/ui/card'

interface SubjectProfileCardProps {
  artifact: SubjectProfileArtifact
}

/**
 * Subject Profile Card (Placeholder - will be fully implemented in Phase 2)
 */
export default function SubjectProfileCard({ artifact }: SubjectProfileCardProps) {
  const { data } = artifact

  return (
    <Card className="border border-[#E5E5E5] shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-[#171717]">
          👤 Subject Profile: {data.subjectId}
        </div>
        <div className="text-xs text-[#737373] mt-1">
          Risk Score: {data.riskScore}/100 | {data.classification}
        </div>
        <div className="text-xs text-[#A3A3A3] mt-2">
          Phase 2: Full implementation coming soon
        </div>
      </CardContent>
    </Card>
  )
}
