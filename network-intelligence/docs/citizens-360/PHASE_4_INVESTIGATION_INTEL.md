# Phase 4: Connect Investigation Intelligence

**Duration**: 2-3 days
**Priority**: High
**Dependencies**: Phase 1, Phase 2, Phase 3

## Objectives

1. Create investigation command handler for chat queries
2. Wire up AI intelligence generation to artifacts
3. Implement case loading and subject search
4. Connect authentic investigation data generation
5. Build real-time intelligence updates

## Architecture

```
User Query: "Load investigation case CT-2024-8473"
           ↓
    Investigation Command Handler
           ↓
    ├─ Parse command intent
    ├─ Validate case access
    └─ Route to appropriate service
           ↓
    Investigation Loader Service
           ↓
    ├─ Load case data from database
    ├─ Generate AI intelligence analysis
    ├─ Create demo data if needed
    └─ Build artifact collection
           ↓
    Generate Chat Messages with Artifacts
           ↓
    ├─ Subject Profile Artifact
    ├─ Timeline Artifact
    ├─ Intelligence Analysis Artifact
    └─ Heatmap Summary Artifact
           ↓
    Display in Chat + Update Map
```

## Core Components

### 1. Investigation Command Handler

**File**: `lib/services/investigationCommandHandler.ts`

```typescript
/**
 * Investigation Command Handler
 * Processes natural language investigation queries and routes to appropriate services
 */

import { VultrLLMService } from './vultrLLMService'
import { getAuthenticInvestigationDataService } from './authenticInvestigationDataService'
import { getInvestigationIntelligenceService } from './investigationIntelligenceService'
import { getChatMapSyncManager } from './chatMapSyncManager'
import type { ChatMessage } from '@/components/ai/AIChatPanel'
import {
  createSubjectProfileArtifact,
  createTimelineArtifact,
  createIntelligenceAnalysisArtifact,
  createHeatmapSummaryArtifact
} from '@/lib/utils/artifactFactories'

export interface InvestigationQuery {
  type: 'load-case' | 'analyze-subject' | 'show-route' | 'list-subjects' | 'search-location'
  params: {
    caseNumber?: string
    subjectId?: string
    location?: string
    timeRange?: { start: Date; end: Date }
  }
}

export class InvestigationCommandHandler {
  private llm: VultrLLMService
  private authenticDataService = getAuthenticInvestigationDataService()
  private intelligenceService = getInvestigationIntelligenceService()
  private syncManager = getChatMapSyncManager()

  constructor(llm: VultrLLMService) {
    this.llm = llm
  }

  /**
   * Parse natural language query into structured command
   */
  async parseQuery(query: string): Promise<InvestigationQuery | null> {
    const systemPrompt = `You are a command parser for investigation intelligence systems.
Parse user queries into structured commands.

Available commands:
- load-case: Load an investigation case by number
- analyze-subject: Generate AI analysis for a subject
- show-route: Display movement route for time period
- list-subjects: List all subjects in investigation
- search-location: Find locations matching criteria

Return JSON format:
{
  "type": "command-type",
  "params": { /* relevant parameters */ }
}`

    try {
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 500
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to parse query:', error)
      return this.fallbackParse(query)
    }
  }

  /**
   * Fallback query parser using regex
   */
  private fallbackParse(query: string): InvestigationQuery | null {
    const lowerQuery = query.toLowerCase()

    // Load case pattern
    if (lowerQuery.includes('load') && /ct-\d{4}-\d{4}/.test(lowerQuery)) {
      const caseMatch = lowerQuery.match(/ct-\d{4}-\d{4}/)
      return {
        type: 'load-case',
        params: { caseNumber: caseMatch ? caseMatch[0] : undefined }
      }
    }

    // Analyze subject pattern
    if (lowerQuery.includes('analyze') && /subject-\d{4}/.test(lowerQuery)) {
      const subjectMatch = lowerQuery.match(/subject-\d{4}/)
      return {
        type: 'analyze-subject',
        params: { subjectId: subjectMatch ? subjectMatch[0] : undefined }
      }
    }

    // Show route pattern
    if (lowerQuery.includes('route') || lowerQuery.includes('movement')) {
      return { type: 'show-route', params: {} }
    }

    // List subjects pattern
    if (lowerQuery.includes('list') && lowerQuery.includes('subject')) {
      return { type: 'list-subjects', params: {} }
    }

    return null
  }

  /**
   * Execute investigation command
   */
  async executeCommand(command: InvestigationQuery): Promise<ChatMessage[]> {
    console.log('🔍 Executing investigation command:', command.type)

    switch (command.type) {
      case 'load-case':
        return this.handleLoadCase(command.params.caseNumber)

      case 'analyze-subject':
        return this.handleAnalyzeSubject(command.params.subjectId)

      case 'show-route':
        return this.handleShowRoute(command.params)

      case 'list-subjects':
        return this.handleListSubjects()

      case 'search-location':
        return this.handleSearchLocation(command.params.location)

      default:
        return [{
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I couldn\'t understand that command. Try: "Load investigation case CT-2024-8473" or "Analyze subject SUBJECT-8473"',
          timestamp: new Date()
        }]
    }
  }

  /**
   * Handle: Load investigation case
   */
  private async handleLoadCase(caseNumber?: string): Promise<ChatMessage[]> {
    if (!caseNumber) {
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please provide a case number. Format: CT-YYYY-NNNN',
        timestamp: new Date()
      }]
    }

    try {
      // Generate authentic investigation scenario
      const scenario = await this.authenticDataService.generateScenario('tech_worker')
      const demoData = await this.authenticDataService.scenarioToDemo(scenario)

      // Generate AI intelligence
      const intelligence = await this.intelligenceService.generateIntelligence(
        demoData.subject,
        demoData.locationStops,
        demoData.trackingPoints
      )

      // Display investigation on map
      const layerManager = (await import('./investigationMapLayerManager')).getInvestigationMapLayerManager()
      layerManager.displayInvestigation(demoData)

      // Create artifact messages
      const messages: ChatMessage[] = []

      // 1. Subject Profile
      messages.push({
        id: `${Date.now()}-1`,
        role: 'assistant',
        content: `📋 Investigation Case Loaded: ${caseNumber}`,
        timestamp: new Date(),
        artifact: createSubjectProfileArtifact(demoData.subject, intelligence)
      })

      // 2. Intelligence Analysis
      messages.push({
        id: `${Date.now()}-2`,
        role: 'assistant',
        content: intelligence.summary,
        timestamp: new Date(),
        artifact: createIntelligenceAnalysisArtifact(intelligence)
      })

      // 3. Timeline
      messages.push({
        id: `${Date.now()}-3`,
        role: 'assistant',
        content: `📅 Timeline: ${demoData.locationStops.length} locations tracked over ${Math.round((demoData.subject.endDate.getTime() - demoData.subject.startDate.getTime()) / (1000 * 60 * 60))} hours`,
        timestamp: new Date(),
        artifact: createTimelineArtifact(demoData.locationStops, demoData.subject)
      })

      // 4. Heatmap Summary
      messages.push({
        id: `${Date.now()}-4`,
        role: 'assistant',
        content: '🗺️ Location frequency analysis available',
        timestamp: new Date(),
        artifact: createHeatmapSummaryArtifact(demoData.locationStops)
      })

      return messages

    } catch (error) {
      console.error('Failed to load case:', error)
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to load case ${caseNumber}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]
    }
  }

  /**
   * Handle: Analyze subject
   */
  private async handleAnalyzeSubject(subjectId?: string): Promise<ChatMessage[]> {
    if (!subjectId) {
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please provide a subject ID. Format: SUBJECT-NNNN',
        timestamp: new Date()
      }]
    }

    // Load subject data and generate analysis
    // Similar to load-case but focused on single subject

    return [{
      id: Date.now().toString(),
      role: 'assistant',
      content: `🧠 Analyzing subject ${subjectId}...`,
      timestamp: new Date()
    }]
  }

  /**
   * Handle: Show route
   */
  private async handleShowRoute(params: any): Promise<ChatMessage[]> {
    // Generate route artifact from tracking data

    return [{
      id: Date.now().toString(),
      role: 'assistant',
      content: '🚗 Route visualization displayed on map',
      timestamp: new Date()
    }]
  }

  /**
   * Handle: List subjects
   */
  private async handleListSubjects(): Promise<ChatMessage[]> {
    // Generate investigation list artifact

    return [{
      id: Date.now().toString(),
      role: 'assistant',
      content: '👥 Subject list generated',
      timestamp: new Date()
    }]
  }

  /**
   * Handle: Search location
   */
  private async handleSearchLocation(location?: string): Promise<ChatMessage[]> {
    if (!location) {
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please provide a location to search for.',
        timestamp: new Date()
      }]
    }

    return [{
      id: Date.now().toString(),
      role: 'assistant',
      content: `🔍 Searching for locations matching "${location}"...`,
      timestamp: new Date()
    }]
  }

  /**
   * Process chat query (main entry point)
   */
  async processQuery(query: string): Promise<ChatMessage[]> {
    console.log('🤖 Processing investigation query:', query)

    // 1. Parse query
    const command = await this.parseQuery(query)

    if (!command) {
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I couldn\'t understand that query. Try:\n\n• "Load investigation case CT-2024-8473"\n• "Analyze subject SUBJECT-8473"\n• "Show me the route of suspicious activity"\n• "List all subjects"',
        timestamp: new Date()
      }]
    }

    // 2. Execute command
    return this.executeCommand(command)
  }
}

// Singleton instance
let commandHandlerInstance: InvestigationCommandHandler | null = null

export function getInvestigationCommandHandler(): InvestigationCommandHandler {
  if (!commandHandlerInstance) {
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY

    if (!apiKey) {
      throw new Error('VULTR_API_KEY environment variable is not set')
    }

    const llm = new VultrLLMService({
      apiKey,
      baseURL: 'https://api.vultrinference.com/v1',
      model: 'llama2-13b-chat'
    })

    commandHandlerInstance = new InvestigationCommandHandler(llm)
  }

  return commandHandlerInstance
}
```

### 2. Artifact Factory Functions

**File**: `lib/utils/artifactFactories.ts`

```typescript
/**
 * Factory functions to create artifacts from investigation data
 */

import type {
  SubjectProfileArtifact,
  TimelineArtifact,
  IntelligenceAnalysisArtifact,
  HeatmapSummaryArtifact
} from '@/lib/types/chatArtifacts'
import type {
  InvestigationSubject,
  LocationStop
} from '@/lib/demo/investigation-demo-data'
import type { InvestigationIntelligence } from '@/lib/services/investigationIntelligenceService'

export function createSubjectProfileArtifact(
  subject: InvestigationSubject,
  intelligence: InvestigationIntelligence
): SubjectProfileArtifact {
  // Count location types
  const stats = {
    totalLocations: 0,
    anomalies: 0,
    suspicious: 0,
    routine: 0,
    estimatedAssociates: intelligence.networkInference.likelyAssociates
  }

  return {
    type: 'subject-profile',
    data: {
      subjectId: subject.subjectId,
      caseNumber: subject.caseNumber,
      classification: subject.classification,
      riskScore: intelligence.riskScore,
      status: 'active',
      investigation: subject.investigation,
      period: {
        start: subject.startDate,
        end: subject.endDate
      },
      stats
    },
    actions: [
      {
        id: 'view-timeline',
        label: 'View Timeline',
        icon: '📅',
        handler: async (data) => {
          const syncManager = (await import('@/lib/services/chatMapSyncManager')).getChatMapSyncManager()
          syncManager.handleArtifactAction('subject-profile', 'view-timeline', data)
        }
      },
      {
        id: 'show-heatmap',
        label: 'Show Heatmap',
        icon: '🗺️',
        handler: async (data) => {
          const syncManager = (await import('@/lib/services/chatMapSyncManager')).getChatMapSyncManager()
          syncManager.handleArtifactAction('subject-profile', 'show-heatmap', data)
        }
      },
      {
        id: 'export',
        label: 'Export',
        icon: '💾',
        handler: async (data) => {
          const syncManager = (await import('@/lib/services/chatMapSyncManager')).getChatMapSyncManager()
          syncManager.handleArtifactAction('subject-profile', 'export', data)
        }
      }
    ]
  }
}

export function createTimelineArtifact(
  locations: LocationStop[],
  subject: InvestigationSubject
): TimelineArtifact {
  const events = locations.map(loc => ({
    id: loc.id,
    timestamp: loc.arrivalTime,
    location: {
      name: loc.name,
      coordinates: [loc.lng, loc.lat] as [number, number]
    },
    type: 'stop' as const,
    significance: loc.significance,
    dwellTime: loc.dwellTimeMinutes,
    notes: loc.notes
  }))

  return {
    type: 'timeline',
    data: {
      title: `Timeline: ${subject.subjectId}`,
      period: {
        start: subject.startDate,
        end: subject.endDate
      },
      events
    },
    actions: [
      {
        id: 'play-route',
        label: 'Play Route',
        icon: '▶️',
        handler: async (data) => {
          const syncManager = (await import('@/lib/services/chatMapSyncManager')).getChatMapSyncManager()
          syncManager.handleArtifactAction('timeline', 'play-route', data)
        }
      }
    ]
  }
}

export function createIntelligenceAnalysisArtifact(
  intelligence: InvestigationIntelligence
): IntelligenceAnalysisArtifact {
  return {
    type: 'intelligence-analysis',
    data: {
      executiveSummary: intelligence.summary,
      riskScore: intelligence.riskScore,
      behavioralInsights: intelligence.behavioralInsights,
      geographicIntelligence: intelligence.geographicIntelligence,
      networkInference: intelligence.networkInference,
      recommendations: intelligence.recommendations
    },
    actions: [
      {
        id: 'export-pdf',
        label: 'Export PDF',
        icon: '📄',
        handler: async (data) => {
          console.log('Exporting intelligence report as PDF')
        }
      }
    ]
  }
}

export function createHeatmapSummaryArtifact(
  locations: LocationStop[]
): HeatmapSummaryArtifact {
  // Group by time of day
  const timeOfDay = {
    earlyMorning: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
    lateNight: 0
  }

  locations.forEach(loc => {
    const hour = loc.arrivalTime.getHours()
    if (hour >= 5 && hour < 9) timeOfDay.earlyMorning++
    else if (hour >= 9 && hour < 12) timeOfDay.morning++
    else if (hour >= 12 && hour < 17) timeOfDay.afternoon++
    else if (hour >= 17 && hour < 21) timeOfDay.evening++
    else if (hour >= 21) timeOfDay.night++
    else timeOfDay.lateNight++
  })

  // Get top locations
  const topLocations = locations
    .slice()
    .sort((a, b) => (b.visitCount * b.dwellTimeMinutes) - (a.visitCount * a.dwellTimeMinutes))
    .slice(0, 10)
    .map(loc => ({
      name: loc.name,
      coordinates: [loc.lng, loc.lat] as [number, number],
      visits: loc.visitCount,
      totalDwellTime: loc.dwellTimeMinutes,
      significance: loc.significance
    }))

  return {
    type: 'heatmap-summary',
    data: {
      title: 'Location Frequency Analysis',
      period: {
        start: locations[0]?.arrivalTime || new Date(),
        end: locations[locations.length - 1]?.departureTime || new Date()
      },
      topLocations,
      timeOfDayBreakdown: timeOfDay,
      clusters: 3,
      totalVisits: locations.length
    },
    actions: [
      {
        id: 'toggle-heatmap',
        label: 'Toggle Heatmap',
        icon: '🗺️',
        handler: async (data) => {
          const syncManager = (await import('@/lib/services/chatMapSyncManager')).getChatMapSyncManager()
          syncManager.handleArtifactAction('heatmap-summary', 'toggle-heatmap', data)
        }
      }
    ]
  }
}
```

### 3. Integrate with Chat Panel

**File**: `app/operations/page.tsx`

```typescript
import { getInvestigationCommandHandler } from '@/lib/services/investigationCommandHandler'

const handleChatQuery = async (query: string): Promise<ChatMessage> => {
  const lowerQuery = query.toLowerCase()

  // Check if it's an investigation command
  if (
    lowerQuery.includes('load case') ||
    lowerQuery.includes('analyze subject') ||
    lowerQuery.includes('show route') ||
    lowerQuery.includes('list subjects')
  ) {
    const commandHandler = getInvestigationCommandHandler()
    const messages = await commandHandler.processQuery(query)

    // Add all messages to chat
    messages.forEach(msg => addMessageToChat(msg))

    // Return first message as response
    return messages[0]
  }

  // Otherwise, handle as normal map query
  return handleMapQuery(query)
}
```

## Implementation Timeline

### Day 1
- [ ] Create InvestigationCommandHandler (4 hours)
- [ ] Create artifact factory functions (2 hours)
- [ ] Wire up case loading (2 hours)

### Day 2
- [ ] Implement AI intelligence integration (4 hours)
- [ ] Connect authentic data generation (2 hours)
- [ ] Test full flow: query → artifacts → map (2 hours)

### Day 3
- [ ] Add subject analysis command (2 hours)
- [ ] Add list subjects command (2 hours)
- [ ] Bug fixes and polish (4 hours)

## Success Criteria

- [ ] "Load case" command works end-to-end
- [ ] AI intelligence generates and displays correctly
- [ ] Artifacts display in chat with proper formatting
- [ ] Map updates when case is loaded
- [ ] All artifact actions work correctly
- [ ] Error handling for invalid commands
- [ ] TypeScript: no errors

## Dependencies

- Phase 1: Chat Message Extension
- Phase 2: Artifact Components
- Phase 3: Map-Chat Sync
- Authentic Investigation Data Service
- Investigation Intelligence Service
- Vultr LLM API key configured

## Testing

```typescript
// Test investigation command parsing
describe('InvestigationCommandHandler', () => {
  it('should parse load case command', async () => {
    const handler = getInvestigationCommandHandler()
    const command = await handler.parseQuery('Load investigation case CT-2024-8473')
    expect(command?.type).toBe('load-case')
    expect(command?.params.caseNumber).toBe('ct-2024-8473')
  })

  it('should execute load case command', async () => {
    const handler = getInvestigationCommandHandler()
    const messages = await handler.processQuery('Load case CT-2024-8473')
    expect(messages.length).toBeGreaterThan(0)
    expect(messages[0].artifact).toBeDefined()
  })
})
```

## Next Steps

After Phase 4 is complete, the Citizens 360 system will be fully functional with:
- Rich chat artifacts
- Synchronized map visualization
- AI-powered intelligence analysis
- Investigation case management
- Real-time updates

Future enhancements could include:
- Multi-subject comparative analysis
- Predictive behavior modeling
- Real-time surveillance integration
- Mobile app support
