/**
 * Address Validation Service
 *
 * Validates investigation scenario addresses against Overture Maps data
 * Ensures all scenario locations use real NYC addresses
 */

export interface ValidationResult {
  valid: boolean
  confidence: number
  suggestion?: ValidatedAddress
  error?: string
}

export interface ValidatedAddress {
  id: string
  address: string
  number: string
  street: string
  postcode: string
  unit: string
  lat: number
  lng: number
  score: number // 0-1 match score
}

/**
 * Address Validation Service
 */
export class AddressValidationService {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? '' : 'http://localhost:3000')
  }

  /**
   * Validate a full address string
   * Example: "515 W 52nd St, New York, NY 10019"
   */
  async validateAddress(address: string): Promise<ValidationResult> {
    try {
      // Parse address components
      const parsed = this.parseAddress(address)

      if (!parsed.street) {
        return {
          valid: false,
          confidence: 0,
          error: 'Could not parse street name from address'
        }
      }

      // Query address database
      const url = new URL(`${this.baseUrl}/api/query/addresses`)
      url.searchParams.set('street', parsed.street)
      if (parsed.number) {
        url.searchParams.set('number', parsed.number)
      }
      if (parsed.postcode) {
        url.searchParams.set('postcode', parsed.postcode)
      }
      url.searchParams.set('limit', '10')

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.results.length === 0) {
        return {
          valid: false,
          confidence: 0,
          error: 'Address not found in database'
        }
      }

      // Score matches
      const scored = data.results.map((addr: any) => ({
        ...addr,
        score: this.scoreMatch(parsed, addr)
      }))

      // Sort by score
      scored.sort((a: any, b: any) => b.score - a.score)
      const best = scored[0]

      return {
        valid: best.score > 0.7,
        confidence: best.score,
        suggestion: best
      }
    } catch (error) {
      return {
        valid: false,
        confidence: 0,
        error: String(error)
      }
    }
  }

  /**
   * Validate address with specific lat/lng coordinates
   * Checks if address exists near the given coordinates
   */
  async validateWithCoordinates(
    address: string,
    lat: number,
    lng: number,
    maxDistanceMeters: number = 100
  ): Promise<ValidationResult> {
    try {
      const parsed = this.parseAddress(address)

      if (!parsed.street) {
        return {
          valid: false,
          confidence: 0,
          error: 'Could not parse street name'
        }
      }

      // Create small bounds around point
      const latDelta = (maxDistanceMeters / 1000) / 111 // ~111 km per degree
      const lngDelta = (maxDistanceMeters / 1000) / (111 * Math.cos(lat * Math.PI / 180))

      const bounds = `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`

      const url = new URL(`${this.baseUrl}/api/query/addresses`)
      url.searchParams.set('street', parsed.street)
      if (parsed.number) {
        url.searchParams.set('number', parsed.number)
      }
      url.searchParams.set('bounds', bounds)
      url.searchParams.set('limit', '5')

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.results.length === 0) {
        return {
          valid: false,
          confidence: 0,
          error: `No addresses found near ${lat},${lng}`
        }
      }

      // Score matches including distance
      const scored = data.results.map((addr: any) => {
        const distance = this.calculateDistance(lat, lng, addr.lat, addr.lng)
        const proximityScore = Math.max(0, 1 - distance / maxDistanceMeters)
        const matchScore = this.scoreMatch(parsed, addr)

        return {
          ...addr,
          distance,
          score: (matchScore * 0.7 + proximityScore * 0.3) // Weight match higher than proximity
        }
      })

      scored.sort((a: any, b: any) => b.score - a.score)
      const best = scored[0]

      return {
        valid: best.score > 0.6,
        confidence: best.score,
        suggestion: best
      }
    } catch (error) {
      return {
        valid: false,
        confidence: 0,
        error: String(error)
      }
    }
  }

  /**
   * Batch validate multiple addresses
   */
  async validateBatch(addresses: string[]): Promise<ValidationResult[]> {
    return Promise.all(addresses.map(addr => this.validateAddress(addr)))
  }

  /**
   * Suggest corrections for invalid address
   */
  async suggestCorrection(address: string): Promise<ValidatedAddress[]> {
    try {
      const parsed = this.parseAddress(address)

      if (!parsed.street) {
        return []
      }

      // Query with fuzzy matching (just street name)
      const url = new URL(`${this.baseUrl}/api/query/addresses`)
      url.searchParams.set('street', parsed.street)
      url.searchParams.set('limit', '20')

      const response = await fetch(url.toString())
      if (!response.ok) {
        return []
      }

      const data = await response.json()

      // Score and return top suggestions
      const scored = data.results.map((addr: any) => ({
        ...addr,
        score: this.scoreMatch(parsed, addr)
      }))

      scored.sort((a: any, b: any) => b.score - a.score)
      return scored.slice(0, 5)
    } catch (error) {
      console.error('Error suggesting corrections:', error)
      return []
    }
  }

  /**
   * Parse address string into components
   */
  private parseAddress(address: string): {
    number: string | null
    street: string | null
    postcode: string | null
  } {
    // Simple regex-based parsing
    const numberMatch = address.match(/^\d+/)
    const postcodeMatch = address.match(/\b\d{5}\b/)

    // Extract street (everything between number and postcode/city)
    let street = address
    if (numberMatch) {
      street = street.replace(numberMatch[0], '').trim()
    }
    if (postcodeMatch) {
      street = street.substring(0, street.indexOf(postcodeMatch[0])).trim()
    }

    // Remove common suffixes
    street = street.replace(/,?\s+(New York|NY|Manhattan|Brooklyn|Queens|Bronx|Staten Island).*/i, '')

    return {
      number: numberMatch ? numberMatch[0] : null,
      street: street.trim() || null,
      postcode: postcodeMatch ? postcodeMatch[0] : null
    }
  }

  /**
   * Score how well an address matches parsed components
   */
  private scoreMatch(parsed: any, address: any): number {
    let score = 0
    let weights = 0

    // Street name match (most important)
    if (parsed.street && address.street) {
      const similarity = this.stringSimilarity(
        parsed.street.toLowerCase(),
        address.street.toLowerCase()
      )
      score += similarity * 0.6
      weights += 0.6
    }

    // Number match
    if (parsed.number && address.number) {
      score += (parsed.number === address.number ? 1 : 0) * 0.3
      weights += 0.3
    } else if (parsed.number || address.number) {
      // Penalize if one has number and other doesn't
      weights += 0.3
    }

    // Postcode match
    if (parsed.postcode && address.postcode) {
      score += (parsed.postcode === address.postcode ? 1 : 0) * 0.1
      weights += 0.1
    } else if (parsed.postcode || address.postcode) {
      weights += 0.1
    }

    return weights > 0 ? score / weights : 0
  }

  /**
   * Simple string similarity (Jaccard coefficient)
   */
  private stringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/))
    const words2 = new Set(str2.split(/\s+/))

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * Calculate distance between two points (meters)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }
}

// Singleton instance
let validationServiceInstance: AddressValidationService | null = null

export function getAddressValidationService(baseUrl?: string): AddressValidationService {
  if (!validationServiceInstance) {
    validationServiceInstance = new AddressValidationService(baseUrl)
  }
  return validationServiceInstance
}

// Example usage:
//
// const validator = getAddressValidationService()
//
// // Validate address
// const result = await validator.validateAddress('515 W 52nd St, New York, NY 10019')
// if (result.valid) {
//   console.log('Address is valid!', result.suggestion)
// }
//
// // Validate with coordinates
// const coordResult = await validator.validateWithCoordinates(
//   '515 W 52nd St',
//   40.7661,
//   -73.9912
// )
//
// // Get suggestions
// const suggestions = await validator.suggestCorrection('515 West 52 Street')
