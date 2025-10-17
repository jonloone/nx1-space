/**
 * Chat-Map Synchronization Manager
 * Coordinates bidirectional updates between chat artifacts and map visualization
 */

import { useMapStore } from '../stores/mapStore'
import type { ChatArtifact } from '../types/chatArtifacts'

export interface SyncAction {
  type: 'fly-to' | 'show-path' | 'highlight-markers' | 'color-buildings' | 'play-route' | 'toggle-heatmap'
  payload: any
}

export class ChatMapSyncManager {
  private mapStore = useMapStore.getState()

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
        this.showSubjectTimeline(data)
        break
      case 'show-heatmap':
        this.toggleSubjectHeatmap(data)
        break
      case 'export':
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
        await this.playRouteAnimation(data)
        break
    }
  }

  /**
   * Route Actions
   */
  private async handleRouteAction(actionId: string, data: any): Promise<void> {
    switch (actionId) {
      case 'animate-route':
        await this.animateRoutePlayback(data)
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
        console.log('🗺️ Toggle heatmap')
        break
    }
  }

  /**
   * Show subject timeline on map
   */
  private showSubjectTimeline(data: any): void {
    if (data.lastSeen) {
      this.mapStore.flyTo(
        data.lastSeen.coordinates[0],
        data.lastSeen.coordinates[1],
        14
      )
    }
    console.log('📍 Showing timeline on map for subject:', data.subjectId)
  }

  /**
   * Toggle subject heatmap
   */
  private toggleSubjectHeatmap(data: any): void {
    console.log('🗺️ Toggling heatmap for subject:', data.subjectId)
  }

  /**
   * Play route animation
   */
  private async playRouteAnimation(data: any): Promise<void> {
    console.log('▶️ Playing route animation')
    const { events } = data
    if (!events || events.length === 0) return

    const duration = 5000
    const stepDuration = duration / events.length

    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      this.mapStore.flyTo(
        event.location.coordinates[0],
        event.location.coordinates[1],
        16,
        { duration: stepDuration }
      )
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
    if (!path || path.length === 0) return

    const totalSteps = path.length
    const stepDuration = (duration * 1000) / totalSteps

    for (let i = 0; i < path.length; i++) {
      const [lng, lat] = path[i]
      // Update marker position (placeholder)
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
   * Handle map feature selection (map → chat direction)
   */
  onMapFeatureSelected(feature: any): ChatArtifact | null {
    console.log('🗺️ Map feature selected:', feature)

    // Generate appropriate artifact based on feature type
    switch (feature.type) {
      case 'location-stop':
        return this.createLocationDetailsArtifact(feature)
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
        properties: feature.properties,
        visits: feature.properties?.visits || 1,
        totalDwellTime: feature.properties?.dwellTime || 0,
        significance: feature.properties?.significance || 'routine'
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
