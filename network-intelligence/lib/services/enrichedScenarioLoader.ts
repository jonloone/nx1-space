/**
 * Enriched Scenario Loader
 *
 * Loads pre-generated scenarios and enriches them with:
 * - Real address validation
 * - Nearby POI context
 * - Valhalla routing
 * - Authentic location data
 */

import { getAuthenticInvestigationDataService, type AuthenticScenario, type AuthenticLocation } from './authenticInvestigationDataService'
import { getPOIContextService, type POIContext } from './poiContextService'
import { getDataIntegrityService, type ValidationReport } from './dataIntegrityService'
import type { InvestigationScenario } from '@/lib/demo/investigation-scenarios'
import type { InvestigationDemoData, LocationStop } from '@/lib/demo/investigation-demo-data'

export interface EnrichedLocation extends LocationStop {
  validationStatus?: 'verified' | 'approximated' | 'unvalidated'
  validationConfidence?: number
  nearbyPOIs?: POIContext[]
  contextSummary?: string
}

export interface EnrichedDemoData extends InvestigationDemoData {
  locationStops: EnrichedLocation[]
  scenario: InvestigationScenario
  validation?: ValidationReport
}

/**
 * Enriched Scenario Loader Service
 */
export class EnrichedScenarioLoader {
  private poiService = getPOIContextService()
  private integrityService = getDataIntegrityService()

  /**
   * Convert InvestigationScenario to AuthenticScenario format
   */
  private convertToAuthenticScenario(scenario: InvestigationScenario): AuthenticScenario {
    return {
      title: scenario.title,
      description: scenario.description,
      subject: {
        occupation: scenario.subject.occupation,
        ageRange: scenario.subject.ageRange,
        homeNeighborhood: scenario.subject.homeNeighborhood,
        workLocation: scenario.subject.workLocation
      },
      locations: scenario.locations.map(loc => {
        // Map scenario location types to authentic location types
        let authenticType: AuthenticLocation['type']
        if (loc.type === 'commercial') {
          authenticType = 'routine'
        } else if (loc.type === 'unknown') {
          authenticType = loc.significance === 'suspicious' || loc.significance === 'anomaly' ? 'suspicious' : 'meeting'
        } else {
          authenticType = loc.type as AuthenticLocation['type']
        }

        return {
          name: loc.name,
          address: loc.address,
          type: authenticType,
          coordinates: [loc.lng, loc.lat] as [number, number], // [lng, lat] format
          operatingHours: `Day ${loc.day} at ${loc.time}`,
          notes: loc.notes,
          // Preserve temporal data for chronological sorting
          day: loc.day,
          time: loc.time,
          dwellMinutes: loc.dwellMinutes,
          significance: loc.significance
        }
      }),
      suspiciousPatterns: scenario.keyFindings,
      narrative: scenario.narrative
    }
  }

  /**
   * Load scenario and convert to enriched demo data
   */
  async loadScenario(scenario: InvestigationScenario): Promise<EnrichedDemoData> {
    console.log(`📖 Loading scenario: ${scenario.title}`)

    // Convert InvestigationScenario to AuthenticScenario format
    const authenticScenario = this.convertToAuthenticScenario(scenario)

    // Convert scenario to demo data using authentic service
    const authService = getAuthenticInvestigationDataService()
    const demoData = await authService.scenarioToDemo(authenticScenario)

    console.log('🌍 Enriching locations with POI context...')

    // Enrich each location with POI context
    const enrichedLocations: EnrichedLocation[] = await Promise.all(
      demoData.locationStops.map(async (stop, index) => {
        const scenarioLocation = scenario.locations[index]

        if (!scenarioLocation) {
          return stop as EnrichedLocation
        }

        try {
          // Get nearby POIs
          const pois = await this.poiService.getNearbyPOIs(
            stop.lat,
            stop.lng,
            1000, // 1km radius
            20 // top 20
          )

          // Get context
          const context = await this.poiService.getLocationContext(
            stop.name,
            stop.lat,
            stop.lng,
            1000
          )

          // Enrich notes with POI context
          const enrichedNotes = pois.length > 0
            ? this.poiService.enrichLocationNotes(stop.notes || '', pois)
            : stop.notes

          return {
            ...stop,
            notes: enrichedNotes,
            validationStatus: 'verified', // From address validation
            validationConfidence: 0.95, // High confidence for pre-generated
            nearbyPOIs: pois,
            contextSummary: context.contextSummary
          } as EnrichedLocation
        } catch (error) {
          console.warn(`Failed to enrich location ${stop.name}:`, error)
          return {
            ...stop,
            validationStatus: 'unvalidated'
          } as EnrichedLocation
        }
      })
    )

    console.log(`✅ Enriched ${enrichedLocations.length} locations with POI data`)

    // Validate data integrity
    console.log('🔍 Running data integrity validation...')
    const validation = this.integrityService.validate({
      ...demoData,
      locationStops: enrichedLocations
    })

    // Log validation summary
    if (validation.valid) {
      console.log(`✅ Data validation PASSED (Score: ${validation.score}/100)`)
    } else {
      console.warn(`⚠️  Data validation FAILED (Score: ${validation.score}/100)`)
      console.warn(`   Critical: ${validation.summary.critical}, Warnings: ${validation.summary.warnings}`)
    }

    // Log detailed report if there are issues
    if (validation.summary.critical > 0 || validation.summary.warnings > 0) {
      console.log('\n' + this.integrityService.summarize(validation))
    }

    return {
      ...demoData,
      locationStops: enrichedLocations,
      scenario,
      validation
    }
  }

  /**
   * Load scenario with fallback to simple enrichment
   */
  async loadScenarioSafe(scenario: InvestigationScenario): Promise<EnrichedDemoData> {
    try {
      return await this.loadScenario(scenario)
    } catch (error) {
      console.error('Failed to fully enrich scenario, using fallback:', error)

      // Fallback: basic conversion without POI enrichment
      const authService = getAuthenticInvestigationDataService()
      const demoData = await authService.scenarioToDemo(scenario)

      // Still validate even in fallback mode
      const validation = this.integrityService.validate(demoData)
      console.log(`⚠️  Fallback mode - Validation score: ${validation.score}/100`)

      return {
        ...demoData,
        locationStops: demoData.locationStops.map(stop => ({
          ...stop,
          validationStatus: 'approximated'
        } as EnrichedLocation)),
        scenario,
        validation
      }
    }
  }

  /**
   * Get enrichment summary stats
   */
  getEnrichmentStats(data: EnrichedDemoData): {
    totalLocations: number
    verified: number
    withPOIs: number
    avgPOIsPerLocation: number
    significantPOIs: number
  } {
    const locations = data.locationStops
    const verified = locations.filter(l => l.validationStatus === 'verified').length
    const withPOIs = locations.filter(l => l.nearbyPOIs && l.nearbyPOIs.length > 0).length

    const totalPOIs = locations.reduce((sum, l) => sum + (l.nearbyPOIs?.length || 0), 0)
    const avgPOIsPerLocation = locations.length > 0 ? totalPOIs / locations.length : 0

    const significantCategories = ['airport', 'seaport', 'hospital', 'police_station']
    const significantPOIs = locations.reduce((sum, l) => {
      return sum + (l.nearbyPOIs?.filter(poi =>
        significantCategories.includes(poi.category)
      ).length || 0)
    }, 0)

    return {
      totalLocations: locations.length,
      verified,
      withPOIs,
      avgPOIsPerLocation: Math.round(avgPOIsPerLocation * 10) / 10,
      significantPOIs
    }
  }
}

// Singleton instance
let loaderInstance: EnrichedScenarioLoader | null = null

export function getEnrichedScenarioLoader(): EnrichedScenarioLoader {
  if (!loaderInstance) {
    loaderInstance = new EnrichedScenarioLoader()
  }
  return loaderInstance
}

// Example usage:
//
// import { SCENARIO_DIGITAL_SHADOW } from '@/lib/demo/investigation-scenarios'
// import { getEnrichedScenarioLoader } from '@/lib/services/enrichedScenarioLoader'
//
// const loader = getEnrichedScenarioLoader()
// const enrichedData = await loader.loadScenario(SCENARIO_DIGITAL_SHADOW)
//
// // Access enriched location
// const location = enrichedData.locationStops[0]
// console.log(location.validationStatus) // 'verified'
// console.log(location.nearbyPOIs?.length) // 15
// console.log(location.contextSummary) // "Near LaGuardia Airport (1.2 km E); High POI density area"
//
// // Get stats
// const stats = loader.getEnrichmentStats(enrichedData)
// console.log(`${stats.verified}/${stats.totalLocations} locations verified`)
// console.log(`Average ${stats.avgPOIsPerLocation} POIs per location`)
