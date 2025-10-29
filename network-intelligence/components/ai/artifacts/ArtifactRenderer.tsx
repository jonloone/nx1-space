'use client'

import React from 'react'
import type { ChatArtifact } from '@/lib/types/chatArtifacts'
import SubjectProfileCard from './SubjectProfileCard'
import TimelineCard from './TimelineCard'
import RouteCard from './RouteCard'
import InvestigationListCard from './InvestigationListCard'
import IntelligenceAnalysisCard from './IntelligenceAnalysisCard'
import HeatmapSummaryCard from './HeatmapSummaryCard'
import NetworkGraphCard from './NetworkGraphCard'
import LocationDetailsCard from './LocationDetailsCard'
import { IntelligenceAlertArtifact } from './IntelligenceAlertArtifact'

interface ArtifactRendererProps {
  artifact: ChatArtifact
}

/**
 * Artifact Renderer
 * Routes to the appropriate artifact component based on type
 */
export default function ArtifactRenderer({ artifact }: ArtifactRendererProps) {
  switch (artifact.type) {
    case 'subject-profile':
      return <SubjectProfileCard artifact={artifact} />

    case 'timeline':
      return <TimelineCard artifact={artifact} />

    case 'route':
      return <RouteCard artifact={artifact} />

    case 'investigation-list':
      return <InvestigationListCard artifact={artifact} />

    case 'intelligence-analysis':
      return <IntelligenceAnalysisCard artifact={artifact} />

    case 'heatmap-summary':
      return <HeatmapSummaryCard artifact={artifact} />

    case 'network-graph':
      return <NetworkGraphCard artifact={artifact} />

    case 'location-details':
      return <LocationDetailsCard artifact={artifact} />

    case 'intelligence-alert':
      return <IntelligenceAlertArtifact alert={artifact.data} />

    default:
      // Unknown artifact type
      console.warn('Unknown artifact type:', (artifact as any).type)
      return null
  }
}
