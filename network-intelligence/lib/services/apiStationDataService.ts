/**
 * API-based Station Data Service
 * 
 * Replaces direct data access with API calls through the unified integration service
 */

import { unifiedDataIntegration, type Station, type DataMetadata } from './unifiedDataIntegration'

export interface StationWithMetadata {
  data: Station[]
  metadata: DataMetadata
}

export class APIStationDataService {
  /**
   * Load all stations from API
   */
  async loadAllStations(forceRefresh = false): Promise<Station[]> {
    try {
      const result = await unifiedDataIntegration.getStations(forceRefresh)
      return result.data
    } catch (error) {
      console.error('Error loading stations via API:', error)
      return []
    }
  }

  /**
   * Load all stations with metadata
   */
  async loadAllStationsWithMetadata(forceRefresh = false): Promise<StationWithMetadata> {
    try {
      return await unifiedDataIntegration.getStations(forceRefresh)
    } catch (error) {
      console.error('Error loading stations with metadata:', error)
      return {
        data: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
          confidence: 0,
          freshness: 0
        }
      }
    }
  }

  /**
   * Load station by ID
   */
  async loadStationById(id: string, forceRefresh = false): Promise<Station | null> {
    try {
      const result = await unifiedDataIntegration.getStations(forceRefresh)
      return result.data.find(station => station.id === id) || null
    } catch (error) {
      console.error(`Error loading station ${id} via API:`, error)
      return null
    }
  }

  /**
   * Load stations by operator
   */
  async loadStationsByOperator(operator: string, forceRefresh = false): Promise<Station[]> {
    try {
      const result = await unifiedDataIntegration.getStations(forceRefresh)
      return result.data.filter(station => station.operator === operator)
    } catch (error) {
      console.error(`Error loading stations for operator ${operator}:`, error)
      return []
    }
  }

  /**
   * Get station analysis
   */
  async getStationAnalysis(stationId: string, forceRefresh = false): Promise<any> {
    try {
      const result = await unifiedDataIntegration.getAnalysis(
        'station',
        { stationId },
        forceRefresh
      )
      return result.data
    } catch (error) {
      console.error(`Error getting analysis for station ${stationId}:`, error)
      return null
    }
  }

  /**
   * Get real-time station metrics
   */
  async getRealTimeStationMetrics(bounds?: [number, number, number, number]): Promise<any> {
    try {
      const result = await unifiedDataIntegration.getRealTimeData('stations', { bounds })
      return result.data
    } catch (error) {
      console.error('Error getting real-time station metrics:', error)
      return null
    }
  }

  /**
   * Get station performance trends
   */
  async getStationPerformanceTrends(stationId: string): Promise<any> {
    try {
      // This would be a specific endpoint for trends data
      // For now, we'll use the real-time metrics
      const result = await unifiedDataIntegration.getRealTimeData('metrics')
      
      // Filter and process for specific station if needed
      return {
        stationId,
        trends: result.data?.trends || {},
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error getting trends for station ${stationId}:`, error)
      return null
    }
  }

  /**
   * Batch load multiple stations with analysis
   */
  async batchLoadStationsWithAnalysis(
    stationIds: string[],
    includeCompetitive = true,
    bounds?: [number, number, number, number]
  ): Promise<Record<string, any>> {
    try {
      const requests = [
        { type: 'stations' as const, options: {} },
        { type: 'analysis' as const, options: { type: 'competitive', options: { bounds } } }
      ]

      if (includeCompetitive) {
        requests.push({
          type: 'analysis' as const,
          options: { type: 'opportunity', options: { bounds } }
        })
      }

      const results = await unifiedDataIntegration.batchFetch(requests)

      const stationsData = results['stations_0']?.data || []
      const competitiveAnalysis = results['analysis_1']?.data || {}
      const opportunityAnalysis = results['analysis_2']?.data || {}

      const batchResults: Record<string, any> = {}

      stationIds.forEach(stationId => {
        const station = stationsData.find((s: Station) => s.id === stationId)
        if (station) {
          batchResults[stationId] = {
            station,
            competitive: competitiveAnalysis,
            opportunity: opportunityAnalysis,
            metadata: {
              loadedAt: new Date().toISOString(),
              sources: Object.keys(results)
            }
          }
        }
      })

      return batchResults
    } catch (error) {
      console.error('Error in batch station analysis:', error)
      return {}
    }
  }

  /**
   * Search stations by criteria
   */
  async searchStations(criteria: {
    operator?: string
    status?: string
    minOpportunityScore?: number
    maxUtilization?: number
    bounds?: [number, number, number, number]
  }): Promise<Station[]> {
    try {
      const result = await unifiedDataIntegration.getStations()
      let stations = result.data

      // Apply filters
      if (criteria.operator) {
        stations = stations.filter(s => s.operator === criteria.operator)
      }

      if (criteria.status) {
        stations = stations.filter(s => s.status === criteria.status)
      }

      if (criteria.minOpportunityScore !== undefined) {
        stations = stations.filter(s => (s.opportunityScore || 0) >= criteria.minOpportunityScore!)
      }

      if (criteria.maxUtilization !== undefined) {
        stations = stations.filter(s => (s.utilization || 0) <= criteria.maxUtilization!)
      }

      if (criteria.bounds) {
        const [minLng, minLat, maxLng, maxLat] = criteria.bounds
        stations = stations.filter(station => {
          const [lng, lat] = station.coordinates
          return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
        })
      }

      return stations
    } catch (error) {
      console.error('Error searching stations:', error)
      return []
    }
  }

  /**
   * Get station alerts
   */
  async getStationAlerts(stationId?: string): Promise<any[]> {
    try {
      const result = await unifiedDataIntegration.getRealTimeData('alerts')
      const allAlerts = result.data?.alerts || []

      if (stationId) {
        return allAlerts.filter((alert: any) => 
          alert.affected_stations?.includes(stationId) ||
          alert.location?.name?.toLowerCase().includes(stationId.toLowerCase())
        )
      }

      return allAlerts
    } catch (error) {
      console.error('Error getting station alerts:', error)
      return []
    }
  }

  /**
   * Clear station data cache
   */
  clearCache() {
    unifiedDataIntegration.clearCache('stations')
  }

  /**
   * Get cache and error status
   */
  getStatus() {
    return {
      cache: unifiedDataIntegration.getCacheStatus(),
      errors: unifiedDataIntegration.getErrorHistory().filter(e => 
        e.endpoint.includes('stations')
      )
    }
  }
}

// Export singleton instance
export const apiStationDataService = new APIStationDataService()
export default apiStationDataService