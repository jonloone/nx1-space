/**
 * Places Cache Service
 * IndexedDB-based persistence layer for Overture Places
 *
 * Features:
 * - Persist up to 50K places locally
 * - Spatial indexing via quadkeys
 * - Category indexing for fast filtering
 * - LRU eviction when cache limit reached
 * - Survives page reloads
 */

import type { GERSPlace } from './gersDemoService'
import type { ViewportBounds } from '../stores/mapStore'
import { toQuadkey, quadkeyToTile } from '../utils/spatialGrid'

const DB_NAME = 'overture-places-cache'
const DB_VERSION = 1
const STORE_NAME = 'places'
const MAX_CACHE_SIZE = 50000 // Maximum number of places to cache
const CACHE_ZOOM_LEVEL = 12 // Quadkey zoom level for spatial indexing

export interface CachedPlace extends GERSPlace {
  quadkey: string // Spatial index
  cachedAt: number // Timestamp for LRU
}

export interface CacheStats {
  totalPlaces: number
  categoryCounts: Map<string, number>
  oldestCacheTime: number
  newestCacheTime: number
  estimatedSizeKB: number
}

export class PlacesCache {
  private db: IDBDatabase | null = null
  private initialized = false

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.initialized = true
        console.log('✅ Places cache initialized (IndexedDB)')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create places store
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'gersId' })

        // Create indexes
        store.createIndex('quadkey', 'quadkey', { unique: false })
        store.createIndex('category', 'categories', { unique: false, multiEntry: true })
        store.createIndex('cachedAt', 'cachedAt', { unique: false })

        console.log('🗄️ Created IndexedDB schema for places cache')
      }
    })
  }

  /**
   * Save places to cache
   * Automatically manages cache size via LRU eviction
   */
  async savePlaces(places: GERSPlace[]): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const now = Date.now()

    // Convert places to cached format with spatial indexing
    const cachedPlaces: CachedPlace[] = places.map(place => {
      const [lon, lat] = place.location.coordinates
      const quadkey = toQuadkey(lat, lon, CACHE_ZOOM_LEVEL)

      return {
        ...place,
        quadkey,
        cachedAt: now
      }
    })

    // Save each place
    const savePromises = cachedPlaces.map(
      place =>
        new Promise<void>((resolve, reject) => {
          const request = store.put(place)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
    )

    await Promise.all(savePromises)

    // Check cache size and evict old entries if needed
    await this.enforCacheSizeLimit()
  }

  /**
   * Get places within viewport bounds
   * Uses spatial indexing for fast queries
   */
  async getPlacesByBounds(bounds: ViewportBounds): Promise<GERSPlace[]> {
    if (!this.db) {
      await this.initialize()
    }

    // Calculate quadkeys for viewport coverage
    const quadkeys = this.getQuadkeysForBounds(bounds)

    const transaction = this.db!.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('quadkey')

    const places: GERSPlace[] = []

    // Query each quadkey
    for (const quadkey of quadkeys) {
      const request = index.getAll(IDBKeyRange.only(quadkey))

      const quadkeyPlaces = await new Promise<CachedPlace[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as CachedPlace[])
        request.onerror = () => reject(request.error)
      })

      // Filter to exact bounds
      const filteredPlaces = quadkeyPlaces.filter(place => {
        const [lon, lat] = place.location.coordinates
        return (
          lon >= bounds.west &&
          lon <= bounds.east &&
          lat >= bounds.south &&
          lat <= bounds.north
        )
      })

      places.push(...filteredPlaces)
    }

    console.log(`📦 Cache hit: ${places.length} places from IndexedDB`)
    return places
  }

  /**
   * Get places by category
   */
  async getPlacesByCategory(category: string): Promise<GERSPlace[]> {
    if (!this.db) {
      await this.initialize()
    }

    const transaction = this.db!.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('category')

    const request = index.getAll(IDBKeyRange.only(category))

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as GERSPlace[])
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.db) {
      await this.initialize()
    }

    const transaction = this.db!.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    // Get total count
    const countRequest = store.count()
    const totalPlaces = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result)
      countRequest.onerror = () => reject(countRequest.error)
    })

    // Get all places for detailed stats
    const allRequest = store.getAll()
    const allPlaces = await new Promise<CachedPlace[]>((resolve, reject) => {
      allRequest.onsuccess = () => resolve(allRequest.result as CachedPlace[])
      allRequest.onerror = () => reject(allRequest.error)
    })

    // Calculate category counts
    const categoryCounts = new Map<string, number>()
    let oldestCacheTime = Date.now()
    let newestCacheTime = 0

    allPlaces.forEach(place => {
      place.categories.forEach(cat => {
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
      })

      if (place.cachedAt < oldestCacheTime) {
        oldestCacheTime = place.cachedAt
      }
      if (place.cachedAt > newestCacheTime) {
        newestCacheTime = place.cachedAt
      }
    })

    // Estimate size (rough approximation)
    const avgPlaceSize = 500 // bytes per place
    const estimatedSizeKB = Math.round((totalPlaces * avgPlaceSize) / 1024)

    return {
      totalPlaces,
      categoryCounts,
      oldestCacheTime,
      newestCacheTime,
      estimatedSizeKB
    }
  }

  /**
   * Clear old places to enforce cache size limit (LRU eviction)
   */
  private async enforCacheSizeLimit(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // Get current count
    const countRequest = store.count()
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result)
      countRequest.onerror = () => reject(countRequest.error)
    })

    if (count <= MAX_CACHE_SIZE) {
      return // Under limit
    }

    // Get all places sorted by cache time (oldest first)
    const index = store.index('cachedAt')
    const getAllRequest = index.getAll()

    const places = await new Promise<CachedPlace[]>((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result as CachedPlace[])
      getAllRequest.onerror = () => reject(getAllRequest.error)
    })

    // Sort by cachedAt (oldest first)
    places.sort((a, b) => a.cachedAt - b.cachedAt)

    // Delete oldest places to get under limit
    const toDelete = places.slice(0, count - MAX_CACHE_SIZE)
    const deleteTransaction = this.db.transaction([STORE_NAME], 'readwrite')
    const deleteStore = deleteTransaction.objectStore(STORE_NAME)

    await Promise.all(
      toDelete.map(
        place =>
          new Promise<void>((resolve, reject) => {
            const request = deleteStore.delete(place.gersId)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
      )
    )

    console.log(`🧹 Evicted ${toDelete.length} old places from cache (LRU)`)
  }

  /**
   * Clear all cached places
   */
  async clearCache(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => {
        console.log('🗑️ Cache cleared')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get quadkeys that cover the viewport bounds
   */
  private getQuadkeysForBounds(bounds: ViewportBounds): string[] {
    const quadkeys = new Set<string>()

    // Sample points across the viewport
    const lngStep = (bounds.east - bounds.west) / 4
    const latStep = (bounds.north - bounds.south) / 4

    for (let lng = bounds.west; lng <= bounds.east; lng += lngStep) {
      for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
        const quadkey = toQuadkey(lat, lng, CACHE_ZOOM_LEVEL)
        quadkeys.add(quadkey)
      }
    }

    return Array.from(quadkeys)
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initialized = false
    }
  }
}

// Singleton instance
let cacheInstance: PlacesCache | null = null

export function getPlacesCache(): PlacesCache {
  if (!cacheInstance) {
    cacheInstance = new PlacesCache()
  }
  return cacheInstance
}
