/**
 * Authentic Investigation Data Service
 *
 * Generates realistic, story-driven investigation scenarios using:
 * - Vultr LLM for persona and narrative generation
 * - Real NYC landmarks and locations
 * - Valhalla routing for actual street routes
 * - Temporal authenticity (real business hours, commute patterns)
 */

import { VultrLLMService } from './vultrLLMService'
import { generateRoute } from './valhallaRoutingService'
import { getAddressValidationService } from './addressValidationService'
import type { ValidatedAddress } from './addressValidationService'
import type {
  InvestigationDemoData,
  InvestigationSubject,
  LocationStop,
  TrackingPoint
} from '@/lib/demo/investigation-demo-data'

export interface AuthenticScenario {
  title: string
  description: string
  subject: {
    occupation: string
    ageRange: string
    homeNeighborhood: string
    workLocation: string
  }
  locations: AuthenticLocation[]
  suspiciousPatterns: string[]
  narrative: string
}

export interface AuthenticLocation {
  name: string
  address: string
  type: 'residence' | 'workplace' | 'transport' | 'meeting' | 'suspicious' | 'routine'
  coordinates: [number, number] // [lng, lat]
  operatingHours?: string
  notes?: string
  // Optional temporal data for chronological sorting
  day?: number
  time?: string
  dwellMinutes?: number
  significance?: 'routine' | 'suspicious' | 'anomaly'
}

export class AuthenticInvestigationDataService {
  private llm: VultrLLMService
  private addressValidator = getAddressValidationService()

  constructor(llm: VultrLLMService) {
    this.llm = llm
  }

  /**
   * Generate authentic investigation scenario
   */
  async generateScenario(scenarioType: 'tech_worker' | 'financial' | 'retail'): Promise<AuthenticScenario> {
    console.log(`🎬 Generating authentic ${scenarioType} investigation scenario...`)

    const systemPrompt = `You are an investigation scenario designer creating realistic, story-driven surveillance demos.
You have extensive knowledge of NYC geography, neighborhoods, businesses, and patterns.
Generate ONLY authentic NYC locations - real landmarks, neighborhoods, and place types that exist.`

    const userPrompt = this.getScenarioPrompt(scenarioType)

    try {
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

      const scenario = JSON.parse(jsonStr) as AuthenticScenario

      console.log(`✅ Generated scenario: ${scenario.title}`)
      console.log(`   Locations: ${scenario.locations.length}`)
      console.log(`   Suspicious patterns: ${scenario.suspiciousPatterns.length}`)

      // Validate addresses and enhance with real data
      await this.validateAndEnhanceScenario(scenario)

      return scenario
    } catch (error) {
      console.error('❌ Failed to generate scenario:', error)
      return this.getFallbackScenario(scenarioType)
    }
  }

  /**
   * Get scenario generation prompt
   */
  private getScenarioPrompt(scenarioType: string): string {
    const prompts = {
      tech_worker: `Create a 72-hour investigation scenario for a tech worker in NYC.

Subject Profile:
- Occupation: Software engineer at a Manhattan tech company
- Age: 28-35
- Lives in: Brooklyn or Queens
- Works in: Manhattan (Chelsea, Flatiron, or FiDi)

Generate a JSON scenario with:
{
  "title": "Operation [Name]",
  "description": "Brief overview",
  "subject": {
    "occupation": "...",
    "ageRange": "...",
    "homeNeighborhood": "...",
    "workLocation": "..."
  },
  "locations": [
    {
      "name": "Real place name (e.g., 'Hudson Yards Office Building', 'Brooklyn Heights Apartment')",
      "address": "Real NYC address or intersection",
      "type": "residence|workplace|transport|meeting|suspicious|routine",
      "coordinates": [lng, lat] // Actual NYC coordinates
      "operatingHours": "...",
      "notes": "Why this location is significant"
    }
  ],
  "suspiciousPatterns": [
    "Description of anomalous behavior"
  ],
  "narrative": "Coherent 3-paragraph story explaining the investigation"
}

Requirements:
- Day 1: Normal routine (home → work → gym → home)
- Day 2: Some unusual activity (storage facility visit, parking lot meeting)
- Day 3: Critical suspicious activity (late night meeting at warehouse/industrial area)
- Include real NYC landmarks (Empire State Building, Grand Central, Brooklyn Bridge)
- Use actual neighborhood names (Williamsburg, Hell's Kitchen, Red Hook, etc.)
- Realistic coordinates for Manhattan/Brooklyn
- Business hours appropriate to location type`,

      financial: `Create investigation scenario for finance professional...`,
      retail: `Create investigation scenario for retail worker...`
    }

    return prompts[scenarioType] || prompts.tech_worker
  }

  /**
   * Parse time string "HH:MM" to minutes since midnight
   */
  private parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Sort locations chronologically by day and time (if available)
   */
  private sortLocationsChronologically(locations: AuthenticLocation[]): AuthenticLocation[] {
    // Check if temporal data is available
    const hasTemporalData = locations.some(loc => loc.day !== undefined && loc.time !== undefined)

    if (!hasTemporalData) {
      console.log('⚠️  No temporal data found, using array order')
      return [...locations]
    }

    console.log('🔄 Sorting locations chronologically...')

    // Sort by day, then by time
    return [...locations].sort((a, b) => {
      // If day is different, sort by day
      if (a.day !== undefined && b.day !== undefined && a.day !== b.day) {
        return a.day - b.day
      }

      // Same day, sort by time
      if (a.time && b.time) {
        return this.parseTimeToMinutes(a.time) - this.parseTimeToMinutes(b.time)
      }

      // Fallback to original order (stable sort)
      return 0
    })
  }

  /**
   * Convert AuthenticScenario to InvestigationDemoData
   */
  async scenarioToDemo(scenario: AuthenticScenario): Promise<InvestigationDemoData> {
    console.log('🔄 Converting scenario to demo data with real routes...')

    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + 72 * 60 * 60 * 1000)

    // Create subject
    const subject: InvestigationSubject = {
      subjectId: `SUBJECT-${Math.floor(Math.random() * 9000) + 1000}`,
      caseNumber: `CT-2024-${Math.floor(Math.random() * 9000) + 1000}`,
      classification: 'person-of-interest',
      investigation: scenario.title,
      startDate,
      endDate,
      legalAuthorization: 'Federal Warrant (SDNY)'
    }

    // CRITICAL FIX: Sort locations by chronological order (day + time)
    const chronologicalLocations = this.sortLocationsChronologically(scenario.locations)
    console.log(`📅 Processing ${chronologicalLocations.length} locations in chronological order`)

    // Convert locations with realistic timing and routing
    const locationStops: LocationStop[] = []
    const trackingPoints: TrackingPoint[] = []
    const routeSegments: any[] = []

    let currentTime = new Date(startDate)
    let locationId = 1

    for (let i = 0; i < chronologicalLocations.length; i++) {
      const location = chronologicalLocations[i]
      const nextLocation = chronologicalLocations[i + 1]

      // Create location stop
      // Use preserved dwellMinutes and significance if available
      const dwellTime = location.dwellMinutes || this.getDwellTime(location.type)
      const significance = location.significance || this.getSignificance(location.type, location.notes)

      const stop: LocationStop = {
        id: `stop-${locationId++}`,
        name: location.name,
        type: this.mapLocationType(location.type),
        lat: location.coordinates[1],
        lng: location.coordinates[0],
        arrivalTime: new Date(currentTime),
        departureTime: new Date(currentTime.getTime() + dwellTime * 60 * 1000),
        dwellTimeMinutes: dwellTime,
        visitCount: 1,
        significance,
        notes: location.notes
      }

      locationStops.push(stop)

      // Generate route to next location if exists
      if (nextLocation) {
        try {
          console.log(`🗺️ Generating route: ${location.name} → ${nextLocation.name}`)

          const departureTime = new Date(currentTime.getTime() + dwellTime * 60 * 1000)
          const route = await generateRoute(
            [location.coordinates[0], location.coordinates[1]], // from [lng, lat]
            [nextLocation.coordinates[0], nextLocation.coordinates[1]], // to [lng, lat]
            'driving',
            departureTime
          )

          console.log(`✅ Route generated: ${(route.distance / 1000).toFixed(1)} km, ${Math.round(route.duration / 60)} min`)

          // Add tracking points from route
          route.waypoints.forEach(waypoint => {
            trackingPoints.push({
              lat: waypoint.lat,
              lng: waypoint.lng,
              timestamp: waypoint.timestamp,
              speed: 0, // Could calculate from route data
              heading: 0 // Could calculate from path
            })
          })

          // Create route segment
          routeSegments.push({
            path: route.path,
            startTime: departureTime,
            endTime: new Date(departureTime.getTime() + route.duration * 1000),
            mode: 'driving',
            distance: route.distance
          })

          // Update current time based on actual route duration
          currentTime = new Date(departureTime.getTime() + route.duration * 1000)
        } catch (error) {
          console.warn(`⚠️ Failed to generate route, using time estimate:`, error)
          // Fallback: use estimated travel time
          currentTime = new Date(currentTime.getTime() + dwellTime * 60 * 1000 + 30 * 60 * 1000)
        }
      } else {
        // Last location - just add dwell time
        currentTime = new Date(currentTime.getTime() + dwellTime * 60 * 1000)
      }
    }

    return {
      subject,
      locationStops,
      trackingPoints,
      routeSegments
    }
  }

  /**
   * Get realistic dwell time based on location type
   */
  private getDwellTime(type: string): number {
    const dwellTimes = {
      residence: 480, // 8 hours (sleep)
      workplace: 240, // 4 hours
      transport: 15, // 15 minutes
      meeting: 90, // 1.5 hours
      suspicious: 42, // 42 minutes (unusual)
      routine: 45 // 45 minutes
    }
    return dwellTimes[type] || 60
  }

  /**
   * Determine significance based on type and notes
   */
  private getSignificance(type: string, notes?: string): 'routine' | 'suspicious' | 'anomaly' {
    if (type === 'suspicious') return 'anomaly'
    if (notes && (notes.toLowerCase().includes('unusual') || notes.toLowerCase().includes('late night'))) {
      return 'suspicious'
    }
    return 'routine'
  }

  /**
   * Map location type to LocationStop type
   */
  private mapLocationType(type: string): LocationStop['type'] {
    const mapping = {
      residence: 'residence',
      workplace: 'workplace',
      transport: 'transport',
      meeting: 'meeting',
      suspicious: 'meeting',
      routine: 'commercial'
    }
    return mapping[type] || 'unknown'
  }

  /**
   * Fallback scenario if LLM fails
   */
  private getFallbackScenario(type: string): AuthenticScenario {
    return {
      title: 'Operation Digital Shadow',
      description: 'Tech worker with suspicious late-night activity',
      subject: {
        occupation: 'Software Engineer',
        ageRange: '28-35',
        homeNeighborhood: 'Williamsburg, Brooklyn',
        workLocation: 'Chelsea, Manhattan'
      },
      locations: [
        {
          name: 'Williamsburg Apartment Complex',
          address: 'Bedford Avenue, Brooklyn',
          type: 'residence',
          coordinates: [-73.9566, 40.7145],
          notes: 'Subject\'s residence'
        },
        {
          name: 'Chelsea Tech Office',
          address: '8th Avenue, Manhattan',
          type: 'workplace',
          coordinates: [-74.0010, 40.7450],
          operatingHours: '9 AM - 6 PM',
          notes: 'Regular workplace'
        },
        {
          name: 'Red Hook Warehouse',
          address: 'Columbia Street, Brooklyn',
          type: 'suspicious',
          coordinates: [-74.0140, 40.6743],
          notes: '⚠️  Late night meeting at 2:47 AM'
        }
      ],
      suspiciousPatterns: [
        'Late night warehouse visit outside normal hours',
        'Multiple associates detected at industrial site',
        'Pattern deviation from established routine'
      ],
      narrative: 'Subject maintains regular tech worker schedule during Day 1-2. Critical anomaly detected on Night 2/3: 2:47 AM meeting at Red Hook industrial warehouse with multiple unidentified associates. Location analysis suggests possible data exchange or equipment transfer. Recommend immediate warrant for warehouse facility and communications intercept.'
    }
  }

  /**
   * Validate addresses in scenario and enhance with real address data
   */
  private async validateAndEnhanceScenario(scenario: AuthenticScenario): Promise<void> {
    console.log('🔍 Validating addresses in scenario...')

    let validatedCount = 0
    let enhancedCount = 0

    for (const location of scenario.locations) {
      try {
        // Validate address with coordinates
        const result = await this.addressValidator.validateWithCoordinates(
          location.address,
          location.coordinates[1], // lat
          location.coordinates[0], // lng
          200 // 200 meters tolerance
        )

        if (result.valid && result.suggestion) {
          validatedCount++

          // Enhance address with validated data
          if (result.confidence > 0.8) {
            location.address = result.suggestion.address
            enhancedCount++
            console.log(`   ✅ Enhanced: ${location.name} → ${result.suggestion.address}`)
          } else {
            console.log(`   ⚠️  Low confidence (${result.confidence.toFixed(2)}): ${location.name}`)
          }
        } else {
          console.log(`   ❌ Could not validate: ${location.name} at ${location.address}`)

          // Try to suggest correction
          const suggestions = await this.addressValidator.suggestCorrection(location.address)
          if (suggestions.length > 0) {
            console.log(`   💡 Suggestion: ${suggestions[0].address}`)
            // Optionally apply suggestion
            // location.address = suggestions[0].address
            // location.coordinates = [suggestions[0].lng, suggestions[0].lat]
          }
        }
      } catch (error) {
        console.warn(`   ⚠️  Validation error for ${location.name}:`, error)
      }
    }

    console.log(`✅ Address validation complete: ${validatedCount}/${scenario.locations.length} valid, ${enhancedCount} enhanced`)
  }
}

// Singleton instance
let serviceInstance: AuthenticInvestigationDataService | null = null

export function getAuthenticInvestigationDataService(): AuthenticInvestigationDataService {
  if (!serviceInstance) {
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY

    if (!apiKey) {
      throw new Error('VULTR_API_KEY environment variable is not set')
    }

    const llm = new VultrLLMService({
      apiKey,
      baseURL: 'https://api.vultrinference.com/v1',
      model: 'llama2-13b-chat' // Standard Vultr model name
    })

    serviceInstance = new AuthenticInvestigationDataService(llm)
  }

  return serviceInstance
}
