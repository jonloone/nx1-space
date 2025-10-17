'use client'

import React from 'react'
import type { LocationDetailsArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent } from '@/components/ui/card'

interface LocationDetailsCardProps {
  artifact: LocationDetailsArtifact
}

export default function LocationDetailsCard({ artifact }: LocationDetailsCardProps) {
  const { data } = artifact
  return (
    <Card className="border border-[#E5E5E5] shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-[#171717]">
          📍 {data.name}
        </div>
        <div className="text-xs text-[#737373] mt-1">
          {data.visits} visits | {data.totalDwellTime} min total
        </div>
      </CardContent>
    </Card>
  )
}
