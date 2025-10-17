'use client'

import React from 'react'
import type { NetworkGraphArtifact } from '@/lib/types/chatArtifacts'
import { Card, CardContent } from '@/components/ui/card'

interface NetworkGraphCardProps {
  artifact: NetworkGraphArtifact
}

export default function NetworkGraphCard({ artifact }: NetworkGraphCardProps) {
  const { data } = artifact
  return (
    <Card className="border border-[#E5E5E5] shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-[#171717]">
          🕸️ {data.title}
        </div>
        <div className="text-xs text-[#737373] mt-1">
          {data.nodes.length} nodes | {data.edges.length} connections
        </div>
      </CardContent>
    </Card>
  )
}
