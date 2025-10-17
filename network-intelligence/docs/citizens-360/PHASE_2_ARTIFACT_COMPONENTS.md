# Phase 2: Create Artifact Components

**Duration**: 2-3 days
**Priority**: High
**Dependencies**: Phase 1 (Chat Message Extension)

## Objectives

1. Build reusable React components for each artifact type
2. Implement consistent design system across all artifacts
3. Add action handlers for artifact buttons
4. Ensure responsive design and accessibility
5. Create storybook stories for each component

## Design System

### Color Palette

```typescript
// Severity Colors
const SEVERITY_COLORS = {
  low: '#10B981',      // Green
  medium: '#F59E0B',   // Amber
  high: '#F59E0B',     // Amber
  critical: '#EF4444'  // Red
}

// Classification Colors
const CLASSIFICATION_COLORS = {
  'person-of-interest': '#F59E0B',  // Orange
  'suspect': '#EF4444',              // Red
  'associate': '#8B5CF6',            // Purple
  'witness': '#3B82F6'               // Blue
}

// Significance Colors
const SIGNIFICANCE_COLORS = {
  routine: '#10B981',     // Green
  suspicious: '#F59E0B',  // Orange
  anomaly: '#EF4444'      // Red
}
```

### Typography

- **Card Title**: `text-lg font-bold text-[#171717]`
- **Section Header**: `text-xs font-semibold text-[#525252]`
- **Body Text**: `text-sm text-[#737373]`
- **Metric Value**: `text-2xl font-bold text-[#171717]`
- **Caption**: `text-xs text-[#A3A3A3]`

### Spacing

- **Card Padding**: `p-4`
- **Section Gap**: `space-y-4`
- **Item Gap**: `space-y-2`
- **Grid Gap**: `gap-3`

## Component 1: Subject Profile Card

**File**: `components/ai/artifacts/SubjectProfileCard.tsx`

### Features

- Subject ID and classification badge
- Risk score with visual indicator (progress bar or gauge)
- Quick stats grid
- Last seen information
- Action buttons (View Timeline, Show Heatmap, Export)

### Implementation

```typescript
'use client'

import React from 'react'
import { Clock, Map, Download, AlertTriangle, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { SubjectProfileArtifact } from '@/lib/types/chatArtifacts'
import { getClassificationColor, getSeverityColor } from '@/lib/utils/artifactHelpers'

interface SubjectProfileCardProps {
  artifact: SubjectProfileArtifact
}

export default function SubjectProfileCard({ artifact }: SubjectProfileCardProps) {
  const { data, actions } = artifact

  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 75) return 'critical'
    if (score >= 50) return 'high'
    if (score >= 25) return 'medium'
    return 'low'
  }

  const riskLevel = getRiskLevel(data.riskScore)
  const riskColor = getSeverityColor(riskLevel)
  const classificationColor = getClassificationColor(data.classification)

  return (
    <Card className="border border-[#E5E5E5] shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#525252]" />
              <h3 className="text-lg font-bold text-[#171717]">
                {data.subjectId}
              </h3>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={`text-xs ${classificationColor} bg-opacity-10`}
              >
                {data.classification.replace(/-/g, ' ').toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-[#E5E5E5] text-[#525252]"
              >
                {data.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#737373] mb-1">Risk Score</div>
            <div className={`text-2xl font-bold ${riskColor.replace('bg-', 'text-')}`}>
              {data.riskScore}/100
            </div>
            <div className="text-xs text-[#A3A3A3] capitalize">{riskLevel}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <Progress value={data.riskScore} className="h-2" />
        </div>

        <Separator className="bg-[#E5E5E5]" />

        {/* Case Information */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-[#737373]">Case Number</div>
          <div className="text-[#171717] font-mono">{data.caseNumber}</div>

          <div className="text-[#737373]">Investigation</div>
          <div className="text-[#171717]">{data.investigation}</div>

          <div className="text-[#737373]">Period</div>
          <div className="text-[#171717]">
            {data.period.start.toLocaleDateString()} - {data.period.end.toLocaleDateString()}
          </div>
        </div>

        <Separator className="bg-[#E5E5E5]" />

        {/* Quick Stats */}
        <div>
          <h4 className="text-xs font-semibold text-[#525252] mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <div className="text-xs text-[#737373] mb-1">Total Locations</div>
              <div className="text-2xl font-bold text-[#171717]">
                {data.stats.totalLocations}
              </div>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <div className="text-xs text-[#737373] mb-1">Anomalies</div>
              <div className="text-2xl font-bold text-[#EF4444]">
                {data.stats.anomalies}
              </div>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <div className="text-xs text-[#737373] mb-1">Suspicious</div>
              <div className="text-2xl font-bold text-[#F59E0B]">
                {data.stats.suspicious}
              </div>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <div className="text-xs text-[#737373] mb-1">Associates</div>
              <div className="text-2xl font-bold text-[#8B5CF6]">
                {data.stats.estimatedAssociates}
              </div>
            </div>
          </div>
        </div>

        {/* Last Seen */}
        {data.lastSeen && (
          <>
            <Separator className="bg-[#E5E5E5]" />
            <div>
              <h4 className="text-xs font-semibold text-[#525252] mb-2">Last Seen</h4>
              <div className="flex items-center gap-2 text-xs">
                <Map className="h-3 w-3 text-[#525252]" />
                <span className="text-[#171717]">{data.lastSeen.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <Clock className="h-3 w-3 text-[#525252]" />
                <span className="text-[#737373]">
                  {data.lastSeen.timestamp.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}

        <Separator className="bg-[#E5E5E5]" />

        {/* Actions */}
        <div className="flex gap-2">
          {actions?.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => action.handler(data)}
              className="flex-1 text-xs"
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Storybook Story

```typescript
// SubjectProfileCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import SubjectProfileCard from './SubjectProfileCard'

const meta: Meta<typeof SubjectProfileCard> = {
  title: 'Artifacts/SubjectProfileCard',
  component: SubjectProfileCard,
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof SubjectProfileCard>

export const PersonOfInterest: Story = {
  args: {
    artifact: {
      type: 'subject-profile',
      data: {
        subjectId: 'SUBJECT-8473',
        caseNumber: 'CT-2024-8473',
        classification: 'person-of-interest',
        riskScore: 72,
        status: 'active',
        investigation: 'Operation Digital Shadow',
        period: {
          start: new Date('2024-01-10'),
          end: new Date('2024-01-13')
        },
        stats: {
          totalLocations: 24,
          anomalies: 3,
          suspicious: 5,
          routine: 16,
          estimatedAssociates: 2
        },
        lastSeen: {
          location: 'Red Hook Warehouse, Brooklyn',
          timestamp: new Date('2024-01-13T02:47:00')
        }
      },
      actions: [
        { id: 'timeline', label: 'View Timeline', icon: '📅' },
        { id: 'heatmap', label: 'Show Heatmap', icon: '🗺️' },
        { id: 'export', label: 'Export', icon: '💾' }
      ]
    }
  }
}

export const HighRiskSuspect: Story = {
  args: {
    artifact: {
      type: 'subject-profile',
      data: {
        subjectId: 'SUSPECT-1134',
        caseNumber: 'CT-2024-1134',
        classification: 'suspect',
        riskScore: 89,
        status: 'active',
        investigation: 'Operation Red Flag',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-14')
        },
        stats: {
          totalLocations: 42,
          anomalies: 12,
          suspicious: 18,
          routine: 12,
          estimatedAssociates: 8
        },
        lastSeen: {
          location: 'Industrial Zone, Queens',
          timestamp: new Date('2024-01-14T23:15:00')
        }
      },
      actions: []
    }
  }
}
```

## Component 2: Timeline Card

**File**: `components/ai/artifacts/TimelineCard.tsx`

### Features

- Vertical timeline with events
- Color-coded event types
- Dwell time indicators
- Expandable event details
- Playback controls

### Key UI Elements

```typescript
// Timeline Event Item
interface TimelineEventProps {
  event: TimelineEvent
  isLast: boolean
}

function TimelineEvent({ event, isLast }: TimelineEventProps) {
  const significanceColor = getSeverityColor(event.significance)

  return (
    <div className="flex gap-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${significanceColor}`} />
        {!isLast && (
          <div className="w-0.5 h-full bg-[#E5E5E5] my-1" />
        )}
      </div>

      {/* Event Content */}
      <div className="flex-1 pb-4">
        <div className="text-xs text-[#525252] mb-1">
          {event.timestamp.toLocaleTimeString()}
        </div>
        <div className="text-sm font-semibold text-[#171717]">
          {event.location.name}
        </div>
        {event.dwellTime && (
          <div className="text-xs text-[#737373] mt-1">
            Dwell: {event.dwellTime} minutes
          </div>
        )}
        {event.notes && (
          <div className="text-xs text-[#737373] mt-1 italic">
            {event.notes}
          </div>
        )}
      </div>
    </div>
  )
}
```

## Component 3: Route Card

**File**: `components/ai/artifacts/RouteCard.tsx`

### Features

- Route summary statistics
- Animated playback slider
- Waypoint list
- Mode indicator (driving/walking/transit)
- Export options

## Component 4: Investigation List Card

**File**: `components/ai/artifacts/InvestigationListCard.tsx`

### Features

- Searchable/filterable table
- Sortable columns
- Risk score indicators
- Click to view profile
- Bulk actions

## Component 5: Intelligence Analysis Card

**File**: `components/ai/artifacts/IntelligenceAnalysisCard.tsx`

### Features

- Executive summary section
- Expandable insight categories
- Confidence indicators
- Priority recommendations
- Export to PDF

## Component 6: Heatmap Summary Card

**File**: `components/ai/artifacts/HeatmapSummaryCard.tsx`

### Features

- Top locations list
- Time-of-day chart
- Cluster statistics
- Heatmap toggle control

## Implementation Timeline

### Day 1
- [ ] Subject Profile Card (4 hours)
- [ ] Timeline Card (4 hours)

### Day 2
- [ ] Route Card (3 hours)
- [ ] Investigation List Card (3 hours)
- [ ] Storybook stories (2 hours)

### Day 3
- [ ] Intelligence Analysis Card (4 hours)
- [ ] Heatmap Summary Card (3 hours)
- [ ] Integration testing (1 hour)

## Success Criteria

- [ ] All 6 artifact components implemented
- [ ] Consistent design system applied
- [ ] All action handlers wired up
- [ ] Responsive on mobile and desktop
- [ ] Storybook stories for each component
- [ ] Accessibility: keyboard navigation, ARIA labels
- [ ] TypeScript: no errors or warnings
- [ ] Visual QA: matches design mockups

## Dependencies

- Phase 1: Chat Message Extension (must be complete)
- shadcn/ui components (Button, Card, Badge, etc.)
- lucide-react icons

## Next Phase

Phase 3: Integrate with Map Actions
