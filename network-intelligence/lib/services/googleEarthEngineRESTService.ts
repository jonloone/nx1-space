/**
 * Google Earth Engine REST API Service
 * 
 * Uses the Earth Engine REST API directly instead of the JavaScript client library
 * which is more suitable for server-side Node.js applications
 */

import { google } from 'googleapis'

export interface GEELocation {
  lat: number
  lon: number
  radius?: number
}

export interface GEEDataPoint {
  lat: number
  lon: number
  value: number
  metadata?: any
}

export class GoogleEarthEngineRESTService {
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  
  private credentials = {
    projectId: process.env.GEE_PROJECT_ID || '',
    clientEmail: process.env.GEE_SERVICE_ACCOUNT_EMAIL || '',
    privateKeyId: process.env.GEE_PRIVATE_KEY_ID || '',
    privateKey: process.env.GEE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientId: process.env.GEE_CLIENT_ID || ''
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    console.log('🔐 Refreshing GEE access token...')
    
    const serviceAccountKey = {
      type: 'service_account',
      project_id: this.credentials.projectId,
      private_key_id: this.credentials.privateKeyId,
      private_key: this.credentials.privateKey,
      client_email: this.credentials.clientEmail,
      client_id: this.credentials.clientId,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
    }

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/earthengine']
    })

    const authClient = await auth.getClient()
    const tokenResponse = await authClient.getAccessToken()
    
    if (!tokenResponse.token) {
      throw new Error('Failed to obtain access token')
    }

    this.accessToken = tokenResponse.token
    // Token typically expires in 1 hour, refresh 5 minutes early
    this.tokenExpiry = Date.now() + (55 * 60 * 1000)
    
    console.log('✅ Access token obtained')
    return this.accessToken
  }

  /**
   * Test the connection to Google Earth Engine
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAccessToken()
      
      // Test with a simple Earth Engine REST API call
      const response = await fetch(
        `https://earthengine.googleapis.com/v1/projects/${this.credentials.projectId}/assets`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully connected to Google Earth Engine REST API'
        }
      } else {
        const error = await response.text()
        return {
          success: false,
          message: `Earth Engine API error: ${response.status} - ${error}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get nighttime lights data for a location using Earth Engine REST API
   */
  async getNighttimeLights(location: GEELocation): Promise<GEEDataPoint[]> {
    try {
      const token = await this.getAccessToken()
      
      // Create Earth Engine expression for VIIRS nighttime lights
      const expression = {
        expression: {
          result: '0',
          values: {
            '0': {
              functionInvocationValue: {
                functionName: 'Image.sample',
                arguments: {
                  image: {
                    functionInvocationValue: {
                      functionName: 'ImageCollection.mean',
                      arguments: {
                        collection: {
                          functionInvocationValue: {
                            functionName: 'ImageCollection.select',
                            arguments: {
                              input: {
                                functionInvocationValue: {
                                  functionName: 'ImageCollection.filterDate',
                                  arguments: {
                                    collection: {
                                      functionInvocationValue: {
                                        functionName: 'ImageCollection.load',
                                        arguments: {
                                          id: { constantValue: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG' }
                                        }
                                      }
                                    },
                                    start: { constantValue: '2023-01-01' },
                                    end: { constantValue: '2024-01-01' }
                                  }
                                }
                              },
                              bandSelectors: { constantValue: ['avg_rad'] }
                            }
                          }
                        }
                      }
                    }
                  },
                  region: {
                    functionInvocationValue: {
                      functionName: 'Geometry.Point',
                      arguments: {
                        coordinates: { constantValue: [location.lon, location.lat] }
                      }
                    }
                  },
                  scale: { constantValue: 500 },
                  numPixels: { constantValue: 1 }
                }
              }
            }
          }
        }
      }

      // Make request to Earth Engine REST API
      const response = await fetch(
        `https://earthengine.googleapis.com/v1/projects/${this.credentials.projectId}/value:compute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expression)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Earth Engine API error:', error)
        // Fall back to simulated data if API fails
        return this.getSimulatedNightlights(location)
      }

      const result = await response.json()
      
      // Extract value from Earth Engine response
      const value = result?.result || 0
      
      return [
        {
          lat: location.lat,
          lon: location.lon,
          value: typeof value === 'number' ? value : parseFloat(value),
          metadata: {
            dataset: 'VIIRS DNB (Real)',
            date: new Date().toISOString(),
            unit: 'nanoWatts/cm2/sr',
            source: 'Earth Engine API'
          }
        }
      ]
    } catch (error) {
      console.error('Nighttime lights error:', error)
      // Fall back to simulated data
      return this.getSimulatedNightlights(location)
    }
  }

  /**
   * Fallback simulated nighttime lights data
   */
  private getSimulatedNightlights(location: GEELocation): GEEDataPoint[] {
    const baseIntensity = this.calculateBaseIntensity(location.lat, location.lon)
    return [
      {
        lat: location.lat,
        lon: location.lon,
        value: baseIntensity,
        metadata: {
          dataset: 'VIIRS DNB (Simulated)',
          date: new Date().toISOString(),
          unit: 'nanoWatts/cm2/sr'
        }
      }
    ]
  }

  /**
   * Get population density data for a location using Earth Engine REST API
   */
  async getPopulationDensity(location: GEELocation): Promise<GEEDataPoint[]> {
    try {
      const token = await this.getAccessToken()
      
      // Create Earth Engine expression for WorldPop population density
      const expression = {
        expression: {
          result: '0',
          values: {
            '0': {
              functionInvocationValue: {
                functionName: 'Image.sample',
                arguments: {
                  image: {
                    functionInvocationValue: {
                      functionName: 'Image.load',
                      arguments: {
                        id: { constantValue: 'WorldPop/GP/100m/pop/2020' }
                      }
                    }
                  },
                  region: {
                    functionInvocationValue: {
                      functionName: 'Geometry.Point',
                      arguments: {
                        coordinates: { constantValue: [location.lon, location.lat] }
                      }
                    }
                  },
                  scale: { constantValue: 100 },
                  numPixels: { constantValue: 1 }
                }
              }
            }
          }
        }
      }

      // Make request to Earth Engine REST API
      const response = await fetch(
        `https://earthengine.googleapis.com/v1/projects/${this.credentials.projectId}/value:compute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expression)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Earth Engine API error:', error)
        // Fall back to simulated data if API fails
        return this.getSimulatedPopulation(location)
      }

      const result = await response.json()
      
      // Extract value from Earth Engine response
      const value = result?.result || 0
      
      return [
        {
          lat: location.lat,
          lon: location.lon,
          value: typeof value === 'number' ? value : parseFloat(value),
          metadata: {
            dataset: 'WorldPop (Real)',
            date: '2020',
            unit: 'people/km2',
            source: 'Earth Engine API'
          }
        }
      ]
    } catch (error) {
      console.error('Population density error:', error)
      // Fall back to simulated data
      return this.getSimulatedPopulation(location)
    }
  }

  /**
   * Fallback simulated population data
   */
  private getSimulatedPopulation(location: GEELocation): GEEDataPoint[] {
    const density = this.calculatePopulationDensity(location.lat, location.lon)
    return [
      {
        lat: location.lat,
        lon: location.lon,
        value: density,
        metadata: {
          dataset: 'WorldPop (Simulated)',
          date: '2020',
          unit: 'people/km2'
        }
      }
    ]
  }

  /**
   * Get maritime activity data for a location using Earth Engine REST API
   * Uses nighttime lights over water as a proxy for maritime activity
   */
  async getMaritimeActivity(location: GEELocation): Promise<GEEDataPoint[]> {
    try {
      const token = await this.getAccessToken()
      
      // Create Earth Engine expression for maritime activity
      // This combines VIIRS nighttime lights with water mask
      const expression = {
        expression: {
          result: '0',
          values: {
            '0': {
              functionInvocationValue: {
                functionName: 'Image.sample',
                arguments: {
                  image: {
                    functionInvocationValue: {
                      functionName: 'Image.multiply',
                      arguments: {
                        image1: {
                          functionInvocationValue: {
                            functionName: 'ImageCollection.mean',
                            arguments: {
                              collection: {
                                functionInvocationValue: {
                                  functionName: 'ImageCollection.select',
                                  arguments: {
                                    input: {
                                      functionInvocationValue: {
                                        functionName: 'ImageCollection.filterDate',
                                        arguments: {
                                          collection: {
                                            functionInvocationValue: {
                                              functionName: 'ImageCollection.load',
                                              arguments: {
                                                id: { constantValue: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG' }
                                              }
                                            }
                                          },
                                          start: { constantValue: '2023-01-01' },
                                          end: { constantValue: '2024-01-01' }
                                        }
                                      }
                                    },
                                    bandSelectors: { constantValue: ['avg_rad'] }
                                  }
                                }
                              }
                            }
                          }
                        },
                        image2: {
                          functionInvocationValue: {
                            functionName: 'Image.not',
                            arguments: {
                              value: {
                                functionInvocationValue: {
                                  functionName: 'Image.select',
                                  arguments: {
                                    input: {
                                      functionInvocationValue: {
                                        functionName: 'Image.load',
                                        arguments: {
                                          id: { constantValue: 'MODIS/006/MOD44W/2015_01_01' }
                                        }
                                      }
                                    },
                                    bandSelectors: { constantValue: ['water_mask'] }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  region: {
                    functionInvocationValue: {
                      functionName: 'Geometry.Buffer',
                      arguments: {
                        geometry: {
                          functionInvocationValue: {
                            functionName: 'Geometry.Point',
                            arguments: {
                              coordinates: { constantValue: [location.lon, location.lat] }
                            }
                          }
                        },
                        distance: { constantValue: location.radius || 10000 }
                      }
                    }
                  },
                  scale: { constantValue: 500 },
                  numPixels: { constantValue: 100 }
                }
              }
            }
          }
        }
      }

      // Make request to Earth Engine REST API
      const response = await fetch(
        `https://earthengine.googleapis.com/v1/projects/${this.credentials.projectId}/value:compute`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expression)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Earth Engine API error:', error)
        // Fall back to simulated data if API fails
        return this.getSimulatedMaritimeActivity(location)
      }

      const result = await response.json()
      
      // Extract and process values from Earth Engine response
      const features = result?.features || []
      let avgActivity = 0
      if (features.length > 0) {
        const values = features.map((f: any) => f.properties?.avg_rad || 0)
        avgActivity = values.reduce((a: number, b: number) => a + b, 0) / values.length
      }
      
      return [
        {
          lat: location.lat,
          lon: location.lon,
          value: avgActivity,
          metadata: {
            dataset: 'Maritime Activity (Real)',
            date: new Date().toISOString(),
            unit: 'nighttime_lights_over_water',
            source: 'Earth Engine API',
            sampleSize: features.length
          }
        }
      ]
    } catch (error) {
      console.error('Maritime activity error:', error)
      // Fall back to simulated data
      return this.getSimulatedMaritimeActivity(location)
    }
  }

  /**
   * Fallback simulated maritime activity data
   */
  private getSimulatedMaritimeActivity(location: GEELocation): GEEDataPoint[] {
    const activity = this.calculateMaritimeActivity(location.lat, location.lon)
    return [
      {
        lat: location.lat,
        lon: location.lon,
        value: activity,
        metadata: {
          dataset: 'Maritime Activity (Simulated)',
          date: new Date().toISOString(),
          unit: 'vessel_density'
        }
      }
    ]
  }

  /**
   * Get comprehensive location intelligence
   */
  async getLocationIntelligence(location: GEELocation): Promise<any> {
    try {
      const [nightlights, population, maritime] = await Promise.all([
        this.getNighttimeLights(location),
        this.getPopulationDensity(location),
        this.getMaritimeActivity(location)
      ])

      return {
        location,
        nightlights,
        population,
        maritime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      throw new Error(`Location intelligence error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate base intensity for nighttime lights (simplified)
   */
  private calculateBaseIntensity(lat: number, lon: number): number {
    // Major cities and shipping lanes have higher intensity
    const majorCities = [
      { lat: 40.7128, lon: -74.0060, intensity: 80 }, // NYC
      { lat: 51.5074, lon: -0.1278, intensity: 75 },  // London
      { lat: 35.6762, lon: 139.6503, intensity: 85 }, // Tokyo
      { lat: 1.3521, lon: 103.8198, intensity: 70 },  // Singapore
      { lat: 22.3193, lon: 114.1694, intensity: 75 }  // Hong Kong
    ]

    let maxIntensity = 10 // Base ocean intensity
    
    for (const city of majorCities) {
      const distance = this.calculateDistance(lat, lon, city.lat, city.lon)
      if (distance < 500) { // Within 500km of major city
        const influence = city.intensity * Math.exp(-distance / 200)
        maxIntensity = Math.max(maxIntensity, influence)
      }
    }

    // Add shipping lane intensity
    if (Math.abs(lat - 40) < 10 && lon > -80 && lon < -20) { // North Atlantic
      maxIntensity = Math.max(maxIntensity, 30)
    }

    return maxIntensity
  }

  /**
   * Calculate population density (simplified)
   */
  private calculatePopulationDensity(lat: number, lon: number): number {
    // Coastal areas generally have higher population
    const coastalBonus = Math.abs(lat) < 60 ? 100 : 10
    
    // Major population centers
    const majorCenters = [
      { lat: 40.7128, lon: -74.0060, density: 10000 },  // NYC
      { lat: 51.5074, lon: -0.1278, density: 5500 },    // London
      { lat: 35.6762, lon: 139.6503, density: 6000 },   // Tokyo
      { lat: 1.3521, lon: 103.8198, density: 8000 },    // Singapore
      { lat: 22.3193, lon: 114.1694, density: 7000 }    // Hong Kong
    ]

    let density = coastalBonus
    
    for (const center of majorCenters) {
      const distance = this.calculateDistance(lat, lon, center.lat, center.lon)
      if (distance < 300) {
        const influence = center.density * Math.exp(-distance / 100)
        density = Math.max(density, influence)
      }
    }

    return density
  }

  /**
   * Calculate maritime activity (simplified)
   */
  private calculateMaritimeActivity(lat: number, lon: number): number {
    // Major shipping routes
    let activity = 0
    
    // North Atlantic route
    if (lat > 30 && lat < 60 && lon > -80 && lon < 0) {
      activity = Math.max(activity, 50 + Math.random() * 20)
    }
    
    // Mediterranean
    if (lat > 30 && lat < 45 && lon > -5 && lon < 40) {
      activity = Math.max(activity, 40 + Math.random() * 15)
    }
    
    // Asia-Pacific routes
    if (lat > -10 && lat < 40 && lon > 100 && lon < 150) {
      activity = Math.max(activity, 60 + Math.random() * 25)
    }
    
    // Suez/Red Sea
    if (lat > 10 && lat < 35 && lon > 30 && lon < 45) {
      activity = Math.max(activity, 70 + Math.random() * 20)
    }

    return activity
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

// Export singleton instance
export const geeRESTService = new GoogleEarthEngineRESTService()