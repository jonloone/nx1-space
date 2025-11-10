/**
 * OSINT Enrichment Service
 * Enhances POIs and buildings with open-source intelligence metadata
 *
 * Enrichment includes:
 * - Business operating hours
 * - Ownership and registration data
 * - Social media presence indicators
 * - Review/rating data
 * - Suspicious activity flags
 */

export interface BusinessHours {
  weekday: { open: string; close: string }
  weekend: { open: string; close: string }
  is24Hours?: boolean
}

export interface OwnershipData {
  owner_name?: string
  owner_subject_id?: string // Link to investigation subject
  registration_date?: string
  business_type?: 'LLC' | 'Corporation' | 'Sole Proprietorship' | 'Partnership' | 'Shell Company'
  registration_state?: string
}

export interface SocialMediaPresence {
  yelp_rating?: number
  yelp_reviews?: number
  google_rating?: number
  google_reviews?: number
  facebook_checkins?: number
  instagram_posts?: number
  has_website?: boolean
  website_status?: 'active' | 'inactive' | 'none'
}

export interface SuspiciousIndicators {
  flags: string[]
  risk_score: number // 0-100
  notes: string[]
}

export interface OSINTEnrichedPlace {
  place_id: string
  name: string
  category: string
  coordinates: [number, number]

  // OSINT Enrichments
  business_hours?: BusinessHours
  ownership?: OwnershipData
  social_media?: SocialMediaPresence
  suspicious?: SuspiciousIndicators

  // Analysis
  osint_score: number // Overall OSINT completeness (0-100)
  last_updated: string
}

export class OSINTEnrichmentService {
  private enrichedPlaces: Map<string, OSINTEnrichedPlace> = new Map()

  /**
   * Initialize service with demo data
   */
  async initialize(): Promise<void> {
    // Load demo enrichment data
    await this.loadDemoEnrichments()

    console.log(`✅ OSINT Enrichment service initialized with ${this.enrichedPlaces.size} enriched places`)
  }

  /**
   * Load demo enrichment data for NYC investigation scenarios
   */
  private async loadDemoEnrichments(): Promise<void> {
    // Demo enriched places for Citizens360 narrative
    const demoEnrichments: OSINTEnrichedPlace[] = [
      {
        place_id: 'brooklyn_import_export_llc',
        name: 'Brooklyn Import Export LLC',
        category: 'warehouse',
        coordinates: [-73.9442, 40.6782],
        business_hours: {
          weekday: { open: '08:00', close: '17:00' },
          weekend: { open: 'closed', close: 'closed' }
        },
        ownership: {
          owner_name: 'Michael Chen',
          owner_subject_id: 'SUBJECT-2548', // High-risk associate!
          registration_date: '2020-03-15',
          business_type: 'Shell Company',
          registration_state: 'DE'
        },
        social_media: {
          yelp_rating: 0,
          yelp_reviews: 0,
          google_rating: 0,
          google_reviews: 0,
          facebook_checkins: 0,
          has_website: false,
          website_status: 'none'
        },
        suspicious: {
          flags: [
            'No online presence',
            'Shell company registration',
            'Owner is investigation subject',
            'Delaware registration (tax haven)',
            'No reviews despite claimed 5-year operation'
          ],
          risk_score: 95,
          notes: [
            'Possible front operation',
            'No legitimate business activity indicators',
            'Owner has known criminal associations'
          ]
        },
        osint_score: 85,
        last_updated: '2025-11-03T22:00:00Z'
      },
      {
        place_id: 'manhattan_tech_solutions',
        name: 'Manhattan Tech Solutions Inc',
        category: 'office',
        coordinates: [-73.9857, 40.7484],
        business_hours: {
          weekday: { open: '09:00', close: '18:00' },
          weekend: { open: 'closed', close: 'closed' }
        },
        ownership: {
          owner_name: 'Sarah Johnson',
          registration_date: '2018-06-01',
          business_type: 'Corporation',
          registration_state: 'NY'
        },
        social_media: {
          yelp_rating: 4.5,
          yelp_reviews: 127,
          google_rating: 4.7,
          google_reviews: 203,
          facebook_checkins: 45,
          has_website: true,
          website_status: 'active'
        },
        suspicious: {
          flags: [],
          risk_score: 10,
          notes: ['Legitimate business', 'Active online presence']
        },
        osint_score: 95,
        last_updated: '2025-11-03T22:00:00Z'
      },
      {
        place_id: 'queens_cash_exchange',
        name: 'Queens Cash Exchange',
        category: 'financial_service',
        coordinates: [-73.8648, 40.7282],
        business_hours: {
          weekday: { open: '10:00', close: '20:00' },
          weekend: { open: '10:00', close: '18:00' }
        },
        ownership: {
          owner_name: 'Unknown',
          registration_date: '2021-01-10',
          business_type: 'LLC',
          registration_state: 'NY'
        },
        social_media: {
          yelp_rating: 2.1,
          yelp_reviews: 8,
          google_rating: 2.3,
          google_reviews: 12,
          facebook_checkins: 0,
          has_website: false,
          website_status: 'none'
        },
        suspicious: {
          flags: [
            'Cash-only business',
            'Poor online reviews',
            'Ownership obscured',
            'Recent establishment with high cash volume'
          ],
          risk_score: 70,
          notes: [
            'Potential money laundering risk',
            'Monitor for suspicious transactions',
            'Multiple complaints about exchange rates'
          ]
        },
        osint_score: 75,
        last_updated: '2025-11-03T22:00:00Z'
      }
    ]

    demoEnrichments.forEach(place => {
      this.enrichedPlaces.set(place.place_id, place)
    })
  }

  /**
   * Get enriched data for a place
   */
  getEnrichment(placeId: string): OSINTEnrichedPlace | null {
    return this.enrichedPlaces.get(placeId) || null
  }

  /**
   * Check if place is currently open (based on business hours)
   */
  isPlaceOpen(placeId: string, timestamp: Date = new Date()): boolean {
    const place = this.getEnrichment(placeId)
    if (!place?.business_hours) return true // Unknown, assume open

    if (place.business_hours.is24Hours) return true

    const dayOfWeek = timestamp.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const hours = isWeekend ? place.business_hours.weekend : place.business_hours.weekday

    if (hours.open === 'closed') return false

    const currentTime = timestamp.toTimeString().slice(0, 5) // HH:MM format
    return currentTime >= hours.open && currentTime <= hours.close
  }

  /**
   * Generate OSINT intelligence summary for a place
   */
  generateOSINTSummary(placeId: string): string {
    const place = this.getEnrichment(placeId)
    if (!place) return 'No OSINT data available for this location.'

    const { ownership, social_media, suspicious, business_hours } = place

    let summary = `**OSINT INTELLIGENCE SUMMARY**\n\n`
    summary += `**Location:** ${place.name}\n`
    summary += `**Category:** ${place.category}\n\n`

    // Ownership Information
    if (ownership) {
      summary += `**OWNERSHIP DATA:**\n`
      summary += `- Owner: ${ownership.owner_name || 'Unknown'}\n`

      if (ownership.owner_subject_id) {
        summary += `- ⚠️ **CRITICAL**: Owner is investigation subject ${ownership.owner_subject_id}\n`
      }

      summary += `- Business Type: ${ownership.business_type || 'Unknown'}\n`
      summary += `- Registration: ${ownership.registration_date || 'Unknown'} (${ownership.registration_state || 'Unknown'})\n\n`
    }

    // Social Media Presence
    if (social_media) {
      summary += `**ONLINE PRESENCE:**\n`
      summary += `- Yelp: ${social_media.yelp_rating?.toFixed(1) || 'N/A'} stars (${social_media.yelp_reviews || 0} reviews)\n`
      summary += `- Google: ${social_media.google_rating?.toFixed(1) || 'N/A'} stars (${social_media.google_reviews || 0} reviews)\n`
      summary += `- Facebook Check-ins: ${social_media.facebook_checkins || 0}\n`
      summary += `- Website: ${social_media.has_website ? 'Active' : 'None'}\n\n`

      // Flag low online presence
      const totalReviews = (social_media.yelp_reviews || 0) + (social_media.google_reviews || 0)
      if (totalReviews < 10 && !social_media.has_website) {
        summary += `⚠️ **Minimal online presence** - Suspicious for claimed business\n\n`
      }
    }

    // Business Hours
    if (business_hours) {
      summary += `**OPERATING HOURS:**\n`
      if (business_hours.is24Hours) {
        summary += `- 24/7 Operation\n`
      } else {
        summary += `- Weekday: ${business_hours.weekday.open} - ${business_hours.weekday.close}\n`
        summary += `- Weekend: ${business_hours.weekend.open === 'closed' ? 'Closed' : `${business_hours.weekend.open} - ${business_hours.weekend.close}`}\n`
      }
      summary += `\n`
    }

    // Suspicious Indicators
    if (suspicious && suspicious.flags.length > 0) {
      summary += `**⚠️ SUSPICIOUS INDICATORS:**\n`
      suspicious.flags.forEach(flag => {
        summary += `- ${flag}\n`
      })
      summary += `\n**Risk Score:** ${suspicious.risk_score}/100\n\n`

      if (suspicious.notes.length > 0) {
        summary += `**Analysis Notes:**\n`
        suspicious.notes.forEach(note => {
          summary += `- ${note}\n`
        })
      }
    }

    // OSINT Score
    summary += `\n**OSINT Completeness:** ${place.osint_score}/100\n`
    summary += `**Last Updated:** ${new Date(place.last_updated).toLocaleString()}\n`

    return summary
  }

  /**
   * Get all places with suspicious indicators above threshold
   */
  getSuspiciousPlaces(riskThreshold: number = 50): OSINTEnrichedPlace[] {
    const suspicious: OSINTEnrichedPlace[] = []

    this.enrichedPlaces.forEach(place => {
      if (place.suspicious && place.suspicious.risk_score >= riskThreshold) {
        suspicious.push(place)
      }
    })

    // Sort by risk score (highest first)
    return suspicious.sort((a, b) =>
      (b.suspicious?.risk_score || 0) - (a.suspicious?.risk_score || 0)
    )
  }

  /**
   * Get places owned by investigation subjects
   */
  getSubjectOwnedPlaces(): OSINTEnrichedPlace[] {
    const owned: OSINTEnrichedPlace[] = []

    this.enrichedPlaces.forEach(place => {
      if (place.ownership?.owner_subject_id) {
        owned.push(place)
      }
    })

    return owned
  }

  /**
   * Add or update enrichment data
   */
  setEnrichment(place: OSINTEnrichedPlace): void {
    this.enrichedPlaces.set(place.place_id, {
      ...place,
      last_updated: new Date().toISOString()
    })
  }

  /**
   * Get business hours category for time-of-day analysis
   */
  getBusinessHoursCategory(category: string): BusinessHours {
    const hourCategories: Record<string, BusinessHours> = {
      'restaurant': {
        weekday: { open: '11:00', close: '22:00' },
        weekend: { open: '10:00', close: '23:00' }
      },
      'cafe': {
        weekday: { open: '07:00', close: '19:00' },
        weekend: { open: '08:00', close: '20:00' }
      },
      'retail': {
        weekday: { open: '09:00', close: '21:00' },
        weekend: { open: '10:00', close: '20:00' }
      },
      'office': {
        weekday: { open: '08:00', close: '18:00' },
        weekend: { open: 'closed', close: 'closed' }
      },
      'industrial': {
        weekday: { open: '07:00', close: '17:00' },
        weekend: { open: 'closed', close: 'closed' }
      },
      'warehouse': {
        weekday: { open: '08:00', close: '17:00' },
        weekend: { open: 'closed', close: 'closed' }
      },
      'hospital': {
        weekday: { open: '00:00', close: '23:59' },
        weekend: { open: '00:00', close: '23:59' },
        is24Hours: true
      },
      'convenience_store': {
        weekday: { open: '06:00', close: '23:00' },
        weekend: { open: '07:00', close: '22:00' }
      }
    }

    return hourCategories[category] || {
      weekday: { open: '09:00', close: '17:00' },
      weekend: { open: '09:00', close: '17:00' }
    }
  }

  /**
   * Get all enriched places
   */
  getAllEnrichedPlaces(): OSINTEnrichedPlace[] {
    return Array.from(this.enrichedPlaces.values())
  }
}

// Singleton instance
let osintService: OSINTEnrichmentService | null = null

export function getOSINTEnrichmentService(): OSINTEnrichmentService {
  if (!osintService) {
    osintService = new OSINTEnrichmentService()
  }
  return osintService
}
