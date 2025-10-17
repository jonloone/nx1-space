'use client'

import React from 'react'
import type { TimelineArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent } from '@/components/ui/card'

interface TimelineCardProps {
  artifact: TimelineArtifact
}

export default function TimelineCard({ artifact }: TimelineCardProps) {
  const { data } = artifact
  return (
    <Card className="border border-[#E5E5E5] shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-[#171717]">
          📅 {data.title}
        </div>
        <div className="text-xs text-[#737373] mt-1">
          {data.events.length} events
        </div>
      </CardContent>
    </Card>
  )
}
