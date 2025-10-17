# Phase 1: Extend Chat Message Format

**Duration**: 1-2 days
**Priority**: High (Foundation for all artifacts)

## Objectives

1. Extend `ChatMessage` interface to support rich artifacts
2. Create type-safe artifact interfaces for each artifact type
3. Update chat rendering logic to display artifacts
4. Ensure backward compatibility with existing chat messages

## Current State

```typescript
// components/ai/AIChatPanel.tsx
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    entitiesFiltered?: number
    analysisType?: string
    error?: string
  }
}
```

## Target State

```typescript
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  artifact?: ChatArtifact // NEW
  metadata?: {
    entitiesFiltered?: number
    analysisType?: string
    error?: string
  }
}

export interface ChatArtifact {
  type: ArtifactType
  data: any
  actions?: ArtifactAction[]
}

export type ArtifactType =
  | 'subject-profile'
  | 'timeline'
  | 'route'
  | 'investigation-list'
  | 'intelligence-analysis'
  | 'heatmap-summary'
  | 'network-graph'
  | 'location-details'

export interface ArtifactAction {
  id: string
  label: string
  icon?: string
  variant?: 'default' | 'outline' | 'destructive'
  handler: (data: any) => void | Promise<void>
}
```

## Detailed Interfaces

### 1. Subject Profile Artifact

```typescript
export interface SubjectProfileArtifact {
  type: 'subject-profile'
  data: {
    subjectId: string
    caseNumber: string
    classification: 'person-of-interest' | 'suspect' | 'associate' | 'witness'
    riskScore: number // 0-100
    status: 'active' | 'inactive' | 'archived'
    investigation: string
    period: {
      start: Date
      end: Date
    }
    stats: {
      totalLocations: number
      anomalies: number
      suspicious: number
      routine: number
      estimatedAssociates: number
    }
    lastSeen?: {
      location: string
      timestamp: Date
    }
  }
  actions: [
    { id: 'view-timeline', label: 'View Timeline', icon: 'Clock' },
    { id: 'show-heatmap', label: 'Show Heatmap', icon: 'Map' },
    { id: 'export', label: 'Export', icon: 'Download' }
  ]
}
```

### 2. Timeline Artifact

```typescript
export interface TimelineArtifact {
  type: 'timeline'
  data: {
    title: string
    period: {
      start: Date
      end: Date
    }
    events: Array<{
      id: string
      timestamp: Date
      location: {
        name: string
        coordinates: [number, number]
      }
      type: 'arrival' | 'departure' | 'stop' | 'meeting' | 'alert'
      significance: 'routine' | 'suspicious' | 'anomaly'
      dwellTime?: number // minutes
      notes?: string
    }>
    summary?: string
  }
  actions: [
    { id: 'play-route', label: 'Play Route', icon: 'Play' },
    { id: 'view-details', label: 'View Details', icon: 'Info' },
    { id: 'flag-alert', label: 'Flag Alert', icon: 'Flag' }
  ]
}
```

### 3. Route Artifact

```typescript
export interface RouteArtifact {
  type: 'route'
  data: {
    title: string
    path: Array<[number, number]> // [lng, lat]
    distance: number // meters
    duration: number // seconds
    mode: 'driving' | 'walking' | 'transit' | 'unknown'
    waypoints: Array<{
      location: string
      timestamp: Date
      dwellTime?: number
      significance?: 'routine' | 'suspicious' | 'anomaly'
    }>
    startTime: Date
    endTime: Date
  }
  actions: [
    { id: 'animate-route', label: 'Animate', icon: 'Play' },
    { id: 'export-gpx', label: 'Export GPX', icon: 'Download' },
    { id: 'street-view', label: 'Street View', icon: 'Eye' }
  ]
}
```

### 4. Investigation List Artifact

```typescript
export interface InvestigationListArtifact {
  type: 'investigation-list'
  data: {
    title: string
    items: Array<{
      id: string
      subjectId: string
      name?: string
      classification: string
      riskScore: number
      status: 'active' | 'inactive'
      lastSeen: {
        location: string
        timestamp: Date
      }
      connection?: string // How they're connected to primary subject
    }>
    sortBy: 'risk' | 'recent' | 'name'
    filterBy?: string[]
  }
  actions: [
    { id: 'export-list', label: 'Export List', icon: 'Download' },
    { id: 'create-watchlist', label: 'Create Watchlist', icon: 'Eye' }
  ]
}
```

### 5. Intelligence Analysis Artifact

```typescript
export interface IntelligenceAnalysisArtifact {
  type: 'intelligence-analysis'
  data: {
    executiveSummary: string
    riskScore: number
    behavioralInsights: Array<{
      type: 'pattern' | 'anomaly' | 'risk' | 'opportunity'
      title: string
      description: string
      confidence: number // 0-100
      severity: 'low' | 'medium' | 'high' | 'critical'
      tags: string[]
    }>
    geographicIntelligence: {
      primaryZone: string
      secondaryZones: string[]
      clusters: Array<{
        name: string
        center: [number, number]
        locations: string[]
        significance: string
      }>
      travelPatterns: string[]
    }
    networkInference: {
      likelyAssociates: number
      meetingLocations: string[]
      suspiciousContacts: string[]
      networkRisk: 'low' | 'medium' | 'high' | 'critical'
      inference: string
    }
    recommendations: Array<{
      priority: 'immediate' | 'high' | 'medium' | 'low'
      action: string
      rationale: string
      resources: string[]
    }>
  }
  actions: [
    { id: 'view-full-report', label: 'View Full Report', icon: 'FileText' },
    { id: 'export-pdf', label: 'Export PDF', icon: 'Download' },
    { id: 'flag-high-priority', label: 'Flag High Priority', icon: 'AlertTriangle' }
  ]
}
```

### 6. Heatmap Summary Artifact

```typescript
export interface HeatmapSummaryArtifact {
  type: 'heatmap-summary'
  data: {
    title: string
    period: {
      start: Date
      end: Date
    }
    topLocations: Array<{
      name: string
      coordinates: [number, number]
      visits: number
      totalDwellTime: number // minutes
      significance: 'routine' | 'suspicious' | 'anomaly'
    }>
    timeOfDayBreakdown: {
      earlyMorning: number // 5-9 AM
      morning: number // 9 AM-12 PM
      afternoon: number // 12-5 PM
      evening: number // 5-9 PM
      night: number // 9 PM-12 AM
      lateNight: number // 12-5 AM
    }
    clusters: number
    totalVisits: number
  }
  actions: [
    { id: 'toggle-heatmap', label: 'Toggle Heatmap', icon: 'Map' },
    { id: 'adjust-radius', label: 'Adjust Radius', icon: 'Circle' },
    { id: 'export-data', label: 'Export Data', icon: 'Download' }
  ]
}
```

## Implementation Steps

### Step 1: Create Type Definitions (30 minutes)

**File**: `lib/types/chatArtifacts.ts`

```typescript
// Create new file with all interfaces above
export * from './chatArtifacts'
```

### Step 2: Update ChatMessage Interface (15 minutes)

**File**: `components/ai/AIChatPanel.tsx`

```typescript
import { ChatArtifact } from '@/lib/types/chatArtifacts'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  artifact?: ChatArtifact // Add this
  metadata?: {
    entitiesFiltered?: number
    analysisType?: string
    error?: string
  }
}
```

### Step 3: Create Artifact Renderer Component (1 hour)

**File**: `components/ai/artifacts/ArtifactRenderer.tsx`

```typescript
'use client'

import React from 'react'
import type { ChatArtifact } from '@/lib/types/chatArtifacts'
import SubjectProfileCard from './SubjectProfileCard'
import TimelineCard from './TimelineCard'
import RouteCard from './RouteCard'
import InvestigationListCard from './InvestigationListCard'
import IntelligenceAnalysisCard from './IntelligenceAnalysisCard'
import HeatmapSummaryCard from './HeatmapSummaryCard'

interface ArtifactRendererProps {
  artifact: ChatArtifact
}

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
    default:
      return null
  }
}
```

### Step 4: Update Chat Panel to Render Artifacts (30 minutes)

**File**: `components/ai/AIChatPanel.tsx`

```typescript
// In the message rendering section
{messages.map((message) => (
  <div key={message.id} className={/* existing classes */}>
    {/* Existing message content */}
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
      {message.content}
    </p>

    {/* NEW: Render artifact if present */}
    {message.artifact && (
      <div className="mt-3">
        <ArtifactRenderer artifact={message.artifact} />
      </div>
    )}

    {/* Existing metadata */}
  </div>
))}
```

### Step 5: Create Helper Functions (30 minutes)

**File**: `lib/utils/artifactHelpers.ts`

```typescript
import type { ChatMessage, ChatArtifact } from '@/lib/types/chatArtifacts'

/**
 * Create a chat message with artifact
 */
export function createMessageWithArtifact(
  content: string,
  artifact: ChatArtifact
): ChatMessage {
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    artifact
  }
}

/**
 * Get artifact icon by type
 */
export function getArtifactIcon(type: string): string {
  const icons = {
    'subject-profile': '👤',
    'timeline': '📅',
    'route': '🚗',
    'investigation-list': '📋',
    'intelligence-analysis': '🧠',
    'heatmap-summary': '🗺️'
  }
  return icons[type] || '📄'
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  const colors = {
    low: 'bg-[#10B981]',
    medium: 'bg-[#F59E0B]',
    high: 'bg-[#F59E0B]',
    critical: 'bg-[#EF4444]'
  }
  return colors[severity] || 'bg-[#A3A3A3]'
}

/**
 * Get classification color
 */
export function getClassificationColor(classification: string): string {
  const colors = {
    'person-of-interest': 'bg-[#F59E0B]',
    'suspect': 'bg-[#EF4444]',
    'associate': 'bg-[#8B5CF6]',
    'witness': 'bg-[#3B82F6]'
  }
  return colors[classification] || 'bg-[#A3A3A3]'
}
```

## Testing Strategy

### Unit Tests

```typescript
// Test artifact type validation
describe('ChatArtifact Types', () => {
  it('should validate subject profile artifact', () => {
    const artifact: SubjectProfileArtifact = {
      type: 'subject-profile',
      data: { /* ... */ },
      actions: []
    }
    expect(artifact.type).toBe('subject-profile')
  })
})
```

### Integration Tests

```typescript
// Test artifact rendering
describe('ArtifactRenderer', () => {
  it('should render subject profile card', () => {
    const artifact = createSubjectProfileArtifact(mockData)
    render(<ArtifactRenderer artifact={artifact} />)
    expect(screen.getByText(/SUBJECT-/)).toBeInTheDocument()
  })
})
```

## Success Criteria

- [ ] All artifact interfaces defined with TypeScript
- [ ] ChatMessage interface extended with artifact field
- [ ] ArtifactRenderer component created
- [ ] Chat panel renders artifacts correctly
- [ ] Helper functions created and tested
- [ ] Backward compatibility maintained (existing messages still work)
- [ ] No TypeScript errors
- [ ] Unit tests pass

## Dependencies

- None (foundation phase)

## Next Phase

Phase 2: Create Artifact Components
