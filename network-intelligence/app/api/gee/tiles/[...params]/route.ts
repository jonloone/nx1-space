/**
 * Google Earth Engine Tile Service
 * Provides tile URLs for deck.gl TileLayer integration
 * 
 * Route: /api/gee/tiles/{z}/{x}/{y}
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// GEE Datasets configuration
const DATASETS = {
  nightlights: {
    collection: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG',
    band: 'avg_rad',
    min: 0,
    max: 60,
    palette: ['000000', '1a1a2e', '16213e', '0f3460', '533483', 'c060a1', 'f5deb3']
  },
  population: {
    collection: 'WorldPop/GP/100m/pop',
    band: 'population',
    min: 0,
    max: 1000,
    palette: ['000000', '2a2a2a', '444444', '666666', '888888', 'aaaaaa', 'ffffff']
  },
  landcover: {
    collection: 'MODIS/006/MCD12Q1',
    band: 'LC_Type1',
    min: 1,
    max: 17,
    palette: ['05450a', '086a10', '54a708', '78d203', '009900', 'c6b044', 'dcd159', 
              'f1fb6b', 'fbff13', 'b6ff05', '27ff87', 'c24f44', 'a5a5a5', 'ff6d4c', 
              '69fff8', 'f9ffa4', '1c0dff']
  }
}

// Authentication helper
async function getAccessToken() {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GEE_PROJECT_ID,
    private_key_id: process.env.GEE_PRIVATE_KEY_ID,
    private_key: process.env.GEE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GEE_SERVICE_ACCOUNT_EMAIL,
    client_id: process.env.GEE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/earthengine']
  })

  const authClient = await auth.getClient()
  const tokenResponse = await authClient.getAccessToken()
  
  if (!tokenResponse.token) {
    throw new Error('Failed to obtain access token')
  }

  return tokenResponse.token
}

// Generate Earth Engine tile URL
async function generateTileUrl(
  dataset: string,
  z: number,
  x: number,
  y: number
): Promise<string> {
  const config = DATASETS[dataset as keyof typeof DATASETS]
  if (!config) {
    throw new Error(`Unknown dataset: ${dataset}`)
  }

  // Get the latest image from the collection
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 1)

  // Build the Earth Engine expression
  const expression = {
    expression: `
      var collection = ee.ImageCollection('${config.collection}')
        .filterDate('${startDate.toISOString()}', '${endDate.toISOString()}')
        .select('${config.band}');
      var image = collection.median();
      var visualized = image.visualize({
        min: ${config.min},
        max: ${config.max},
        palette: ${JSON.stringify(config.palette)}
      });
      return visualized;
    `
  }

  // Generate the tile URL using Earth Engine's tile service
  const projectId = process.env.GEE_PROJECT_ID
  const baseUrl = `https://earthengine.googleapis.com/v1/projects/${projectId}/maps`
  
  // Create a map ID for the visualization
  const mapId = Buffer.from(JSON.stringify({
    dataset: config.collection,
    band: config.band,
    z, x, y,
    timestamp: Date.now()
  })).toString('base64')

  // Return the tile URL
  return `${baseUrl}/${mapId}/tiles/${z}/${x}/${y}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    // Await params in Next.js 15
    const { params: coordinates } = await params
    // Parse the tile coordinates from the URL
    const [z, x, y] = coordinates.map(Number)
    
    // Get dataset from query params
    const searchParams = request.nextUrl.searchParams
    const dataset = searchParams.get('dataset') || 'nightlights'
    
    // Validate coordinates
    if (isNaN(z) || isNaN(x) || isNaN(y)) {
      return NextResponse.json(
        { error: 'Invalid tile coordinates' },
        { status: 400 }
      )
    }

    // For MVP, return a proxy URL or generate a static tile
    // In production, this would authenticate and return actual GEE tiles
    
    // Option 1: Return a proxy URL to public tile services (for demo)
    if (dataset === 'nightlights') {
      try {
        // Use NASA's Black Marble tiles as a proxy for nightlights
        const nasaUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/${z}/${y}/${x}.png`
        
        // Fetch the tile and return it directly (to avoid CORS issues)
        const response = await fetch(nasaUrl)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*'
            }
          })
        }
      } catch (error) {
        console.log('NASA tiles unavailable, falling back to gradient')
      }
    }
    
    // Option 2: Generate a simple gradient tile for other datasets
    const svg = `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="gradient">
            <stop offset="0%" style="stop-color:#4a00ff;stop-opacity:0.8" />
            <stop offset="50%" style="stop-color:#0099ff;stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:#000033;stop-opacity:0.1" />
          </radialGradient>
        </defs>
        <rect width="256" height="256" fill="url(#gradient)" />
      </svg>
    `
    
    // Return SVG as image
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Error generating tile:', error)
    return NextResponse.json(
      { error: 'Failed to generate tile' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}