'use client'

import React from 'react'
import type { RouteArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent } from '@/components/ui/card'

interface RouteCardProps {
  artifact: RouteArtifact
}

export default function RouteCard({ artifact }: RouteCardProps) {
  const { data } = artifact
  return (
    <Card className="border border-[#E5E5E5] shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-[#171717]">
          🚗 {data.title}
        </div>
        <div className="text-xs text-[#737373] mt-1">
          {(data.distance / 1000).toFixed(1)} km | {Math.round(data.duration / 60)} min
        </div>
      </CardContent>
    </Card>
  )
}
