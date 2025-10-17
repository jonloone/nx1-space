# Phase 3: Integrate with Map Actions

**Duration**: 2-3 days
**Priority**: High
**Dependencies**: Phase 1 (Chat Message Extension), Phase 2 (Artifact Components)

## Objectives

1. Create bidirectional synchronization between chat artifacts and map visualization
2. Wire up artifact action buttons to trigger map updates
3. Implement map feature selection that creates chat artifacts
4. Build route playback system synced with timeline
5. Create heatmap toggle integration

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Synchronization Manager                   │
├────────────────────┬───────────────────────────────────────┤
│                    │                                        │
│  Chat Artifacts    │         Map Visualization             │
│                    │                                        │
│  User clicks       │         Map updates:                  │
│  "View Timeline"   ├────────→ • Fly to location           │
│                    │         • Show movement path          │
│                    │         • Highlight markers           │
│                    │         • Color buildings             │
│                    │                                        │
│  Chat updates:     │         User clicks                   │
│  • Add artifact    ←────────┤ map feature                  │
│  • Scroll to       │                                        │
│  • Highlight       │                                        │
│                    │                                        │
└────────────────────┴───────────────────────────────────────┘
```

## Core Services

### 1. Synchronization Manager

**File**: `lib/services/chatMapSyncManager.ts`

```typescript
/**
 * Chat-Map Synchronization Manager
 * Coordinates bidirectional updates between chat artifacts and map visualization
 */

import { useMapStore } from '../stores/mapStore'
import type { ChatArtifact } from '../types/chatArtifacts'
import { getMapActionHandler } from './mapActionHandler'

export interface SyncAction {
  type: 'fly-to' | 'show-path' | 'highlight-markers' | 'color-buildings' | 'play-route' | 'toggle-heatmap'
  payload: any
}

export class ChatMapSyncManager {
  private mapStore = useMapStore.getState()
  private mapActionHandler = getMapActionHandler()

  /**
   * Handle artifact action click
   * Translates artifact actions into map operations
   */
  async handleArtifactAction(
    artifactType: string,
    actionId: string,
    data: any
  ): Promise<void> {
    console.log(`🔄 Syncing artifact action: ${artifactType}.${actionId}`)

    switch (artifactType) {
      case 'subject-profile':
        return this.handleSubjectProfileAction(actionId, data)

      case 'timeline':
        return this.handleTimelineAction(actionId, data)

      case 'route':
        return this.handleRouteAction(actionId, data)

      case 'investigation-list':
        return this.handleInvestigationListAction(actionId, data)

      case 'intelligence-analysis':
        return this.handleIntelligenceAnalysisAction(actionId, data)

      case 'heatmap-summary':
        return this.handleHeatmapSummaryAction(actionId, data)

      default:
        console.warn(`Unknown artifact type: ${artifactType}`)
    }
  }

  /**
   * Subject Profile Actions
   */
  private async handleSubjectProfileAction(actionId: string, data: any): Promise<void> {
    switch (actionId) {
      case 'view-timeline':
        // Generate and display timeline on map
        this.showSubjectTimeline(data)
        break

      case 'show-heatmap':
        // Toggle frequency heatmap for subject
        this.toggleSubjectHeatmap(data)
        break

      case 'export':
        // Export subject data
        this.exportSubjectData(data)
        break
    }
  }

  /**
   * Timeline Actions
   */
  private async handleTimelineAction(actionId: string, data: any): Promise<void> {
    switch (actionId) {
      case 'play-route':
        // Animate movement along timeline
        await this.playRouteAnimation(data)
        break

      case 'view-details':
        // Zoom to specific timeline event
        this.viewEventDetails(data)
        break

      case 'flag-alert':
        // Create alert for timeline event
        this.flagTimelineAlert(data)
        break
    }
  }

  /**
   * Route Actions
   */
  private async handleRouteAction(actionId: string, data: any): Promise<void> {
    switch (actionId) {
      case 'animate-route':
        // Animate route with moving marker
        await this.animateRoutePlayback(data)
        break

      case 'export-gpx':
        // Export route as GPX file
        this.exportRouteGPX(data)
        break

      case 'street-view':
        // Open Street View at route location
        this.openStreetView(data)
        break
    }
  }

  /**
   * Investigation List Actions
   */
  private async handleInvestigationListAction(actionId: string, data: any): Promise<void> {
    switch (actionId) {
      case 'view-profile':
        // Load subject profile and show on map
        await this.loadSubjectProfile(data.subjectId)
        break

      case 'track':
        // Start real-time tracking
        this.startTracking(data.subjectId)
        break

      case 'export-list':
        // Export list as CSV
        this.exportList(data)
        break
    }
  }

  /**
   * Heatmap Summary Actions
   */
  private async handleHeatmapSummaryAction(actionId: string, data: any): Promise<void> {
    switch (actionId) {
      case 'toggle-heatmap':
        // Toggle heatmap layer visibility
        this.mapStore.toggleLayer('frequency-heatmap')
        break

      case 'adjust-radius':
        // Open radius adjustment UI
        this.showRadiusControl(data)
        break

      case 'export-data':
        // Export heatmap data as JSON
        this.exportHeatmapData(data)
        break
    }
  }

  /**
   * Show subject timeline on map
   */
  private showSubjectTimeline(data: any): void {
    // 1. Fly to primary zone
    if (data.lastSeen) {
      this.mapStore.flyTo(
        data.lastSeen.coordinates[0],
        data.lastSeen.coordinates[1],
        14
      )
    }

    // 2. Fetch and display movement path
    // This would call investigation data service to get full timeline
    console.log('📍 Showing timeline on map for subject:', data.subjectId)
  }

  /**
   * Toggle subject heatmap
   */
  private toggleSubjectHeatmap(data: any): void {
    const heatmapVisible = this.mapStore.getLayerVisibility('frequency-heatmap')

    if (heatmapVisible) {
      this.mapStore.hideLayer('frequency-heatmap')
    } else {
      // Load heatmap data for subject and show layer
      this.mapStore.showLayer('frequency-heatmap')
      console.log('🗺️ Showing heatmap for subject:', data.subjectId)
    }
  }

  /**
   * Play route animation
   */
  private async playRouteAnimation(data: any): Promise<void> {
    console.log('▶️ Playing route animation')

    const { events } = data
    const duration = 5000 // 5 seconds total animation
    const stepDuration = duration / events.length

    for (let i = 0; i < events.length; i++) {
      const event = events[i]

      // Fly to each event location
      this.mapStore.flyTo(
        event.location.coordinates[0],
        event.location.coordinates[1],
        16,
        { duration: stepDuration }
      )

      // Highlight current event marker
      this.mapStore.selectFeature({
        id: event.id,
        type: 'location-stop',
        name: event.location.name,
        coordinates: event.location.coordinates,
        properties: event
      })

      // Wait before next step
      await new Promise(resolve => setTimeout(resolve, stepDuration))
    }

    console.log('✅ Route animation complete')
  }

  /**
   * Animate route with moving marker
   */
  private async animateRoutePlayback(data: any): Promise<void> {
    console.log('🎬 Animating route playback')

    const { path, duration } = data
    const totalSteps = path.length
    const stepDuration = (duration * 1000) / totalSteps

    for (let i = 0; i < path.length; i++) {
      const [lng, lat] = path[i]

      // Update marker position
      // This would use a custom moving marker layer

      await new Promise(resolve => setTimeout(resolve, stepDuration))
    }

    console.log('✅ Route playback complete')
  }

  /**
   * Export subject data
   */
  private exportSubjectData(data: any): void {
    const exportData = {
      subjectId: data.subjectId,
      caseNumber: data.caseNumber,
      classification: data.classification,
      riskScore: data.riskScore,
      stats: data.stats,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subject-${data.subjectId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    console.log('💾 Exported subject data:', data.subjectId)
  }

  /**
   * Export route as GPX
   */
  private exportRouteGPX(data: any): void {
    const gpx = this.generateGPX(data)
    const blob = new Blob([gpx], { type: 'application/gpx+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `route-${Date.now()}.gpx`
    a.click()
    URL.revokeObjectURL(url)

    console.log('💾 Exported route as GPX')
  }

  /**
   * Generate GPX XML from route data
   */
  private generateGPX(data: any): string {
    const { path, waypoints } = data

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Network Intelligence">
  <metadata>
    <name>Investigation Route</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>Subject Route</name>
    <trkseg>`

    path.forEach(([lng, lat]: [number, number]) => {
      gpx += `
      <trkpt lat="${lat}" lon="${lng}"></trkpt>`
    })

    gpx += `
    </trkseg>
  </trk>
</gpx>`

    return gpx
  }

  /**
   * Handle map feature selection (map → chat direction)
   */
  onMapFeatureSelected(feature: any): ChatArtifact | null {
    console.log('🗺️ Map feature selected:', feature)

    // Generate appropriate artifact based on feature type
    switch (feature.type) {
      case 'location-stop':
        return this.createLocationDetailsArtifact(feature)

      case 'subject-marker':
        return this.createSubjectProfileArtifact(feature)

      case 'route-segment':
        return this.createRouteArtifact(feature)

      default:
        return null
    }
  }

  /**
   * Create location details artifact from map feature
   */
  private createLocationDetailsArtifact(feature: any): ChatArtifact {
    return {
      type: 'location-details',
      data: {
        name: feature.name,
        coordinates: feature.coordinates,
        properties: feature.properties
      },
      actions: [
        {
          id: 'view-nearby',
          label: 'View Nearby',
          handler: () => this.viewNearbyLocations(feature)
        },
        {
          id: 'create-buffer',
          label: 'Create Buffer',
          handler: () => this.createLocationBuffer(feature)
        }
      ]
    }
  }

  private createSubjectProfileArtifact(feature: any): ChatArtifact {
    // Would fetch full subject data from investigation service
    return {
      type: 'subject-profile',
      data: {
        /* subject data */
      },
      actions: []
    }
  }

  private createRouteArtifact(feature: any): ChatArtifact {
    return {
      type: 'route',
      data: {
        /* route data */
      },
      actions: []
    }
  }
}

// Singleton instance
let syncManagerInstance: ChatMapSyncManager | null = null

export function getChatMapSyncManager(): ChatMapSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new ChatMapSyncManager()
  }
  return syncManagerInstance
}
```

### 2. Map Layer Manager for Investigation

**File**: `lib/services/investigationMapLayerManager.ts`

```typescript
/**
 * Investigation Map Layer Manager
 * Manages map layers specific to investigation visualization
 */

import { MapboxOverlay } from '@deck.gl/mapbox'
import { PathLayer, ScatterplotLayer, HeatmapLayer } from '@deck.gl/layers'
import type { InvestigationDemoData } from '@/lib/demo/investigation-demo-data'

export class InvestigationMapLayerManager {
  private overlay: MapboxOverlay | null = null

  /**
   * Initialize with map overlay
   */
  initialize(overlay: MapboxOverlay): void {
    this.overlay = overlay
  }

  /**
   * Display investigation data on map
   */
  displayInvestigation(data: InvestigationDemoData): void {
    if (!this.overlay) return

    const layers = [
      this.createMovementPathLayer(data),
      this.createLocationMarkersLayer(data),
      this.createFrequencyHeatmapLayer(data)
    ]

    this.overlay.setProps({ layers })
  }

  /**
   * Create movement path layer
   */
  private createMovementPathLayer(data: InvestigationDemoData): PathLayer {
    return new PathLayer({
      id: 'investigation-movement-path',
      data: data.routeSegments,
      getPath: (d: any) => d.path,
      getColor: [239, 68, 68], // Red
      getWidth: 3,
      widthMinPixels: 2,
      widthMaxPixels: 8,
      opacity: 0.9,
      pickable: true,
      onHover: (info) => this.handlePathHover(info)
    })
  }

  /**
   * Create location markers layer
   */
  private createLocationMarkersLayer(data: InvestigationDemoData): ScatterplotLayer {
    return new ScatterplotLayer({
      id: 'investigation-location-markers',
      data: data.locationStops,
      getPosition: (d: any) => [d.lng, d.lat],
      getFillColor: (d: any) => this.getSignificanceColor(d.significance),
      getRadius: (d: any) => Math.log(d.dwellTimeMinutes + 1) * 50,
      radiusMinPixels: 5,
      radiusMaxPixels: 30,
      pickable: true,
      onClick: (info) => this.handleMarkerClick(info)
    })
  }

  /**
   * Create frequency heatmap layer
   */
  private createFrequencyHeatmapLayer(data: InvestigationDemoData): HeatmapLayer {
    return new HeatmapLayer({
      id: 'investigation-heatmap',
      data: data.locationStops,
      getPosition: (d: any) => [d.lng, d.lat],
      getWeight: (d: any) => d.visitCount * d.dwellTimeMinutes,
      radiusPixels: 60,
      intensity: 1,
      threshold: 0.05,
      visible: false // Hidden by default
    })
  }

  /**
   * Get color based on significance
   */
  private getSignificanceColor(significance: string): [number, number, number] {
    const colors = {
      routine: [16, 185, 129],      // Green
      suspicious: [245, 158, 11],    // Orange
      anomaly: [239, 68, 68]         // Red
    }
    return colors[significance] || [163, 163, 163]
  }

  private handlePathHover(info: any): void {
    // Show tooltip
  }

  private handleMarkerClick(info: any): void {
    // Emit event for artifact creation
  }
}

// Singleton
let layerManagerInstance: InvestigationMapLayerManager | null = null

export function getInvestigationMapLayerManager(): InvestigationMapLayerManager {
  if (!layerManagerInstance) {
    layerManagerInstance = new InvestigationMapLayerManager()
  }
  return layerManagerInstance
}
```

## Integration Points

### 1. Wire Artifact Actions

**File**: `components/ai/artifacts/SubjectProfileCard.tsx` (example)

```typescript
import { getChatMapSyncManager } from '@/lib/services/chatMapSyncManager'

export default function SubjectProfileCard({ artifact }: SubjectProfileCardProps) {
  const syncManager = getChatMapSyncManager()

  const handleAction = async (actionId: string) => {
    await syncManager.handleArtifactAction(
      artifact.type,
      actionId,
      artifact.data
    )
  }

  return (
    <Card>
      {/* ... */}
      <Button onClick={() => handleAction('view-timeline')}>
        View Timeline
      </Button>
    </Card>
  )
}
```

### 2. Handle Map Feature Selection

**File**: `app/operations/page.tsx`

```typescript
const handleMapFeatureClick = (feature: any) => {
  const syncManager = getChatMapSyncManager()
  const artifact = syncManager.onMapFeatureSelected(feature)

  if (artifact) {
    // Add artifact message to chat
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Selected: ${feature.name}`,
      timestamp: new Date(),
      artifact
    }

    addChatMessage(message)
  }
}
```

## Implementation Timeline

### Day 1
- [ ] Create ChatMapSyncManager service (4 hours)
- [ ] Wire up subject profile actions (2 hours)
- [ ] Test bidirectional sync (2 hours)

### Day 2
- [ ] Create InvestigationMapLayerManager (3 hours)
- [ ] Implement route animation (3 hours)
- [ ] Wire up timeline actions (2 hours)

### Day 3
- [ ] Implement map → chat direction (3 hours)
- [ ] Add heatmap toggle integration (2 hours)
- [ ] Integration testing and bug fixes (3 hours)

## Success Criteria

- [ ] All artifact actions trigger map updates
- [ ] Map feature clicks create chat artifacts
- [ ] Route playback animates smoothly
- [ ] Heatmap toggles work correctly
- [ ] Sync is responsive (<100ms delay)
- [ ] No memory leaks from event listeners
- [ ] Error handling for failed syncs

## Dependencies

- Phase 1: Chat Message Extension
- Phase 2: Artifact Components
- Deck.gl overlay initialized
- mapStore properly configured

## Next Phase

Phase 4: Connect Investigation Intelligence
