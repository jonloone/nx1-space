/**
 * Extract Real NYC POIs from Overture Maps PMTiles
 *
 * Queries self-hosted PMTiles for NYC-area places and extracts:
 * - Residences (apartment buildings)
 * - Workplaces (offices, commercial)
 * - Transport hubs (airports, stations)
 * - Meeting locations (hotels, restaurants, cafes)
 * - Suspicious locations (warehouses, storage, industrial)
 *
 * Output: data/nyc-real-pois.json
 */

import { PMTiles } from 'pmtiles'
import * as fs from 'fs'
import * as path from 'path'

// NYC bounds (roughly Manhattan + surrounding boroughs)
const NYC_BOUNDS = {
  minLat: 40.4774, // Southern Brooklyn
  maxLat: 40.9176, // Northern Bronx
  minLng: -74.2591, // Western Staten Island
  maxLng: -73.7004  // Eastern Queens
}

interface OverturePlace {
  id: string
  name: string
  category: string
  latitude: number
  longitude: number
  confidence: number
  address?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  website?: string
}

interface InvestigationPOI {
  id: string
  name: string
  category: string
  investigationType: 'residence' | 'workplace' | 'transport' | 'meeting' | 'suspicious' | 'routine'
  coordinates: [number, number] // [lng, lat]
  address: string
  confidence: number
  metadata: {
    source: 'overture_maps'
    extractedAt: string
  }
}

/**
 * Map Overture categories to investigation types
 */
function categorizeForInvestigation(category: string): InvestigationPOI['investigationType'] | null {
  const categoryMap: Record<string, InvestigationPOI['investigationType']> = {
    // Residences
    'residential_building': 'residence',
    'apartment_building': 'residence',
    'house': 'residence',

    // Workplaces
    'office': 'workplace',
    'office_building': 'workplace',
    'coworking_space': 'workplace',
    'business': 'workplace',

    // Transport
    'airport': 'transport',
    'train_station': 'transport',
    'subway_station': 'transport',
    'bus_station': 'transport',
    'ferry_terminal': 'transport',

    // Meeting locations
    'hotel': 'meeting',
    'restaurant': 'meeting',
    'cafe': 'meeting',
    'bar': 'meeting',
    'lounge': 'meeting',

    // Suspicious locations
    'warehouse': 'suspicious',
    'storage_facility': 'suspicious',
    'industrial_building': 'suspicious',
    'pier': 'suspicious',
    'dock': 'suspicious',
    'port': 'suspicious',
    'parking_garage': 'suspicious',

    // Routine locations
    'gym': 'routine',
    'fitness_center': 'routine',
    'supermarket': 'routine',
    'grocery_store': 'routine',
    'bank': 'routine',
    'atm': 'routine'
  }

  return categoryMap[category] || null
}

/**
 * Extract NYC POIs from PMTiles
 */
async function extractNYCPOIs() {
  console.log('🔍 Extracting real NYC POIs from Overture Maps PMTiles...')

  const pmtilesPath = path.join(process.cwd(), 'public', 'tiles', 'places-global.pmtiles')

  if (!fs.existsSync(pmtilesPath)) {
    console.error('❌ PMTiles file not found:', pmtilesPath)
    process.exit(1)
  }

  console.log('📂 Loading PMTiles:', pmtilesPath)

  try {
    // NOTE: PMTiles is designed for web/HTTP access
    // For Node.js file access, we need to use the file:// protocol or create a custom source
    // For now, we'll extract from the NDJSON file as a quick solution

    console.log('⚠️  Note: PMTiles library is optimized for HTTP access')
    console.log('📝 Falling back to NDJSON extraction method...')

    return await extractFromNDJSON()

  } catch (error) {
    console.error('❌ Failed to load PMTiles:', error)
    throw error
  }
}

/**
 * Extract from NDJSON file (fallback method)
 */
async function extractFromNDJSON(): Promise<InvestigationPOI[]> {
  console.log('📂 Reading places-features.ndjson...')

  const ndjsonPath = path.join(process.cwd(), 'places-features.ndjson')

  if (!fs.existsSync(ndjsonPath)) {
    console.error('❌ NDJSON file not found:', ndjsonPath)
    throw new Error('No data source available')
  }

  const content = fs.readFileSync(ndjsonPath, 'utf-8')
  const lines = content.trim().split('\n')

  console.log(`📊 Processing ${lines.length} places...`)

  const nycPOIs: InvestigationPOI[] = []
  const categoryCounts: Record<string, number> = {}

  for (const line of lines) {
    try {
      const data = JSON.parse(line)
      const feature = data.feature

      if (!feature || !feature.properties) continue

      const props = feature.properties
      const coords = feature.geometry?.coordinates

      if (!coords || coords.length !== 2) continue

      const [lng, lat] = coords

      // Filter for NYC bounds
      if (
        lat >= NYC_BOUNDS.minLat &&
        lat <= NYC_BOUNDS.maxLat &&
        lng >= NYC_BOUNDS.minLng &&
        lng <= NYC_BOUNDS.maxLng
      ) {
        const investigationType = categorizeForInvestigation(props.category)

        if (!investigationType) continue // Skip irrelevant categories

        const poi: InvestigationPOI = {
          id: props.id,
          name: props.name || 'Unknown Location',
          category: props.category,
          investigationType,
          coordinates: [lng, lat],
          address: props.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          confidence: props.confidence || 0.5,
          metadata: {
            source: 'overture_maps',
            extractedAt: new Date().toISOString()
          }
        }

        nycPOIs.push(poi)

        // Track category distribution
        categoryCounts[investigationType] = (categoryCounts[investigationType] || 0) + 1
      }
    } catch (error) {
      // Skip invalid lines
      continue
    }
  }

  console.log('\n📊 Extraction Summary:')
  console.log(`   Total NYC POIs extracted: ${nycPOIs.length}`)
  console.log('\n   By Investigation Type:')
  Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`)
    })

  return nycPOIs
}

/**
 * Save POIs to JSON file
 */
function savePOIs(pois: InvestigationPOI[]) {
  const dataDir = path.join(process.cwd(), 'data')

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const outputPath = path.join(dataDir, 'nyc-real-pois.json')

  const output = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalPOIs: pois.length,
      bounds: NYC_BOUNDS,
      source: 'overture_maps_pmtiles',
      categories: Array.from(new Set(pois.map(p => p.investigationType)))
    },
    pois: pois
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))

  console.log(`\n✅ Saved ${pois.length} NYC POIs to: ${outputPath}`)
}

/**
 * Main execution
 */
async function main() {
  try {
    const pois = await extractNYCPOIs()

    if (pois.length === 0) {
      console.error('❌ No NYC POIs found in dataset')
      process.exit(1)
    }

    savePOIs(pois)

    console.log('\n✅ Extraction complete!')
    console.log('   Next step: Use these POIs to generate investigation scenarios')

  } catch (error) {
    console.error('❌ Extraction failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { extractNYCPOIs, InvestigationPOI }
