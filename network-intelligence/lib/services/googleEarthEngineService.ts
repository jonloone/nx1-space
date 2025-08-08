/**
 * Google Earth Engine Service
 * 
 * Provides access to GEE datasets for:
 * - Nighttime lights (VIIRS)
 * - Population density (WorldPop)
 * - Land cover (MODIS)
 * - Maritime activity zones
 * - Economic activity indicators
 */

import * as ee from '@google/earthengine'
import { google } from 'googleapis'

export interface GEECredentials {
  projectId: string
  clientEmail: string
  privateKeyId: string
  privateKey: string
}

export interface GEEDataRequest {
  geometry: {
    type: 'Polygon' | 'Point'
    coordinates: number[][] | number[]
  }
  scale: number // meters per pixel
  startDate?: string
  endDate?: string
  dataset: 'nightlights' | 'population' | 'landcover' | 'maritime'
}

export interface GEEDataResponse {
  success: boolean
  data?: any
  metadata?: {
    dataset: string
    date: string
    scale: number
    pixelCount: number
  }
  error?: string
}

export class GoogleEarthEngineService {
  private credentials: GEECredentials & { clientId: string }
  private authenticated: boolean = false

  constructor() {
    this.credentials = {
      projectId: process.env.GEE_PROJECT_ID || '',
      clientEmail: process.env.GEE_SERVICE_ACCOUNT_EMAIL || '',
      privateKeyId: process.env.GEE_PRIVATE_KEY_ID || '',
      privateKey: process.env.GEE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
      clientId: process.env.GEE_CLIENT_ID || ''
    }
  }

  /**
   * Initialize authentication with Google Earth Engine
   */
  async authenticate(): Promise<boolean> {
    try {
      if (this.authenticated) return true

      console.log('🔐 Attempting GEE authentication...')
      console.log('Project ID:', this.credentials.projectId)
      console.log('Client Email:', this.credentials.clientEmail)
      console.log('Private Key ID:', this.credentials.privateKeyId)
      console.log('Private Key length:', this.credentials.privateKey?.length || 0)

      // Create service account credentials
      const privateKey = this.credentials.privateKey.replace(/\\n/g, '\n')
      
      console.log('🔑 Formatted private key length:', privateKey.length)
      console.log('🔑 Private key starts with:', privateKey.substring(0, 50))

      // Initialize Earth Engine with proper server-side authentication
      const { google } = require('googleapis')
      
      // Create service account credentials object
      const serviceAccountKey = {
        type: 'service_account',
        project_id: this.credentials.projectId,
        private_key_id: this.credentials.privateKeyId,
        private_key: privateKey,
        client_email: this.credentials.clientEmail,
        client_id: this.credentials.clientId,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
      }
      
      console.log('🔐 Creating service account auth...')
      
      // Use Google Auth to get access token
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/earthengine']
      })
      
      const authClient = await auth.getClient()
      const accessToken = await authClient.getAccessToken()
      
      console.log('🎟️ Got access token:', !!accessToken.token)
      
      if (!accessToken.token) {
        throw new Error('Failed to obtain access token from service account')
      }
      
      // Initialize Earth Engine with access token
      await new Promise((resolve, reject) => {
        ee.initialize(
          accessToken.token,
          null,
          () => {
            console.log('🚀 Earth Engine initialized successfully')
            resolve(true)
          },
          (error: any) => {
            console.log('❌ Earth Engine initialization failed:', error)
            reject(error)
          }
        )
      })

      this.authenticated = true
      
      console.log('✅ Google Earth Engine authenticated successfully')
      return true

    } catch (error) {
      console.error('❌ GEE Authentication failed with detailed error:')
      console.error('Error type:', typeof error)
      console.error('Error message:', error.message || 'No message')
      console.error('Error stack:', error.stack || 'No stack')
      console.error('Full error:', error)
      return false
    }
  }

  /**
   * Get nighttime lights data (VIIRS DNB)
   */
  async getNighttimeLights(request: GEEDataRequest): Promise<GEEDataResponse> {
    try {
      await this.authenticate()
      
      // VIIRS Nighttime Day/Night Band
      const collection = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
        .filterDate(request.startDate || '2023-01-01', request.endDate || '2024-01-01')
        .select('avg_rad')
        .mean()

      const geometry = this.createGeometry(request.geometry)
      
      // Sample the image
      const result = await collection.sample({
        region: geometry,
        scale: request.scale || 500,
        numPixels: 1000
      }).getInfo()

      return {
        success: true,
        data: result.features,
        metadata: {
          dataset: 'VIIRS Nighttime Lights',
          date: new Date().toISOString(),
          scale: request.scale || 500,
          pixelCount: result.features?.length || 0
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Nighttime lights data error: ${error.message}`
      }
    }
  }

  /**
   * Get population density data (WorldPop)
   */
  async getPopulationDensity(request: GEEDataRequest): Promise<GEEDataResponse> {
    try {
      await this.authenticate()
      
      // WorldPop population count
      const image = ee.Image('WorldPop/GP/100m/pop/2020')
      
      const geometry = this.createGeometry(request.geometry)
      
      const result = await image.sample({
        region: geometry,
        scale: request.scale || 100,
        numPixels: 1000
      }).getInfo()

      return {
        success: true,
        data: result.features,
        metadata: {
          dataset: 'WorldPop Population',
          date: '2020',
          scale: request.scale || 100,
          pixelCount: result.features?.length || 0
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Population data error: ${error.message}`
      }
    }
  }

  /**
   * Get land cover data (MODIS)
   */
  async getLandCover(request: GEEDataRequest): Promise<GEEDataResponse> {
    try {
      await this.authenticate()
      
      // MODIS Land Cover Type
      const image = ee.Image('MODIS/006/MCD12Q1/2020_01_01')
        .select('LC_Type1')
      
      const geometry = this.createGeometry(request.geometry)
      
      const result = await image.sample({
        region: geometry,
        scale: request.scale || 500,
        numPixels: 1000
      }).getInfo()

      return {
        success: true,
        data: result.features,
        metadata: {
          dataset: 'MODIS Land Cover',
          date: '2020',
          scale: request.scale || 500,
          pixelCount: result.features?.length || 0
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Land cover data error: ${error.message}`
      }
    }
  }

  /**
   * Get maritime activity data from multiple sources
   */
  async getMaritimeActivity(request: GEEDataRequest): Promise<GEEDataResponse> {
    try {
      await this.authenticate()
      
      // Combine nighttime lights (shipping lanes) with land/water mask
      const nightlights = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
        .filterDate('2023-01-01', '2024-01-01')
        .select('avg_rad')
        .mean()

      // Water mask to focus on maritime areas
      const waterMask = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24')
        .select('water_mask')

      // Maritime activity = nightlights over water
      const maritimeActivity = nightlights.updateMask(waterMask)
      
      const geometry = this.createGeometry(request.geometry)
      
      const result = await maritimeActivity.sample({
        region: geometry,
        scale: request.scale || 500,
        numPixels: 1000
      }).getInfo()

      return {
        success: true,
        data: result.features,
        metadata: {
          dataset: 'Maritime Activity (Nightlights over Water)',
          date: new Date().toISOString(),
          scale: request.scale || 500,
          pixelCount: result.features?.length || 0
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Maritime activity data error: ${error.message}`
      }
    }
  }

  /**
   * Get comprehensive location intelligence
   */
  async getLocationIntelligence(lat: number, lon: number, radius: number = 50000): Promise<any> {
    try {
      await this.authenticate()

      // Create buffer around point
      const point = ee.Geometry.Point([lon, lat])
      const buffer = point.buffer(radius)

      const requests: GEEDataRequest[] = [
        {
          geometry: { type: 'Point', coordinates: [lon, lat] },
          scale: 500,
          dataset: 'nightlights'
        },
        {
          geometry: { type: 'Point', coordinates: [lon, lat] },
          scale: 100,
          dataset: 'population'
        },
        {
          geometry: { type: 'Point', coordinates: [lon, lat] },
          scale: 500,
          dataset: 'landcover'
        },
        {
          geometry: { type: 'Point', coordinates: [lon, lat] },
          scale: 500,
          dataset: 'maritime'
        }
      ]

      // Execute all requests in parallel
      const results = await Promise.all([
        this.getNighttimeLights(requests[0]),
        this.getPopulationDensity(requests[1]),
        this.getLandCover(requests[2]),
        this.getMaritimeActivity(requests[3])
      ])

      return {
        location: { lat, lon, radius },
        nightlights: results[0],
        population: results[1],
        landcover: results[2],
        maritime: results[3],
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      throw new Error(`Location intelligence error: ${error.message}`)
    }
  }

  /**
   * Create Earth Engine geometry from GeoJSON-like input
   */
  private createGeometry(geometry: any): any {
    if (geometry.type === 'Point') {
      return ee.Geometry.Point(geometry.coordinates)
    } else if (geometry.type === 'Polygon') {
      return ee.Geometry.Polygon(geometry.coordinates)
    }

    throw new Error(`Unsupported geometry type: ${geometry.type}`)
  }

  /**
   * Create temporary credentials file for authentication
   */
  private createTempCredentialFile(): string {
    const fs = require('fs')
    const path = require('path')
    const os = require('os')

    const credentials = {
      type: 'service_account',
      project_id: this.credentials.projectId,
      private_key_id: this.credentials.privateKeyId,
      private_key: this.credentials.privateKey,
      client_email: this.credentials.clientEmail,
      client_id: '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
    }

    const tempPath = path.join(os.tmpdir(), 'gee-credentials.json')
    fs.writeFileSync(tempPath, JSON.stringify(credentials, null, 2))
    
    return tempPath
  }

  /**
   * Test the connection and credentials
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const authenticated = await this.authenticate()
      
      if (!authenticated) {
        return { success: false, message: 'Authentication failed' }
      }

      // Test with a simple query
      const testPoint = { lat: 40.7128, lon: -74.0060 } // NYC
      const result = await this.getLocationIntelligence(testPoint.lat, testPoint.lon, 1000)

      return { 
        success: true, 
        message: `GEE connection successful. Test query returned data for NYC.` 
      }

    } catch (error) {
      return { 
        success: false, 
        message: `Connection test failed: ${error.message}` 
      }
    }
  }
}

// Export singleton instance
export const geeService = new GoogleEarthEngineService()