interface GERSEntity {
  id: string;
  names: string[];
  type: string;
  coordinates: [number, number];
  bbox?: [number, number, number, number];
}

interface CachedData {
  version: string;
  timestamp: number;
  nameIndex: [string, string[]][];
  entities: [string, GERSEntity][];
}

interface CacheEntry {
  data: GERSEntity[];
  timestamp: number;
}

// Simple LRU cache implementation
class SimpleCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }> = new Map();
  private maxSize: number;
  private ttl: number;
  
  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  get size(): number {
    return this.cache.size;
  }
}

export class GERSBridgeService {
  private cache: SimpleCache<string, GERSEntity[]>;
  private nameIndex: Map<string, string[]> = new Map();
  private entityCache: Map<string, GERSEntity> = new Map();
  private isInitialized = false;
  
  // Bridge file URLs
  private readonly BRIDGE_URLS = {
    places: 'https://overturemaps-us-west-2.s3.amazonaws.com/release/2024-11-19/gers/places_bridge.parquet',
    buildings: 'https://overturemaps-us-west-2.s3.amazonaws.com/release/2024-11-19/gers/buildings_bridge.parquet',
    addresses: 'https://overturemaps-us-west-2.s3.amazonaws.com/release/2024-11-19/gers/addresses_bridge.parquet'
  };
  
  constructor() {
    // Simple cache for search results
    this.cache = new SimpleCache<string, GERSEntity[]>(
      1000, // Cache up to 1000 queries
      1000 * 60 * 60 * 24 // 24 hour TTL
    );
  }
  
  /**
   * Initialize by loading a subset of bridge data
   * Uses range requests to avoid downloading entire file
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load from localStorage first if available
      const cachedData = this.loadFromLocalStorage();
      if (cachedData) {
        this.nameIndex = new Map(cachedData.nameIndex);
        this.entityCache = new Map(cachedData.entities);
        this.isInitialized = true;
        console.log('Loaded GERS from cache:', this.entityCache.size, 'entities');
        return;
      }
      
      // Otherwise fetch fresh data
      await this.fetchAndCacheBridgeData();
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize GERS:', error);
      // Fall back to mock data
      await this.loadMockData();
      this.isInitialized = true;
    }
  }
  
  /**
   * Fetch bridge data using HTTP range requests for efficiency
   */
  private async fetchAndCacheBridgeData(): Promise<void> {
    console.log('Fetching GERS bridge data...');
    
    try {
      // For POC, we'll use a proxy endpoint that returns JSON
      // In production, you'd parse Parquet directly
      const response = await fetch('/api/gers/places?limit=10000', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch GERS data');
      }
      
      const data = await response.json();
      
      // Process entities
      data.entities.forEach((entity: GERSEntity) => {
        this.entityCache.set(entity.id, entity);
        
        // Build name index
        entity.names.forEach((name: string) => {
          const normalized = name.toLowerCase();
          if (!this.nameIndex.has(normalized)) {
            this.nameIndex.set(normalized, []);
          }
          this.nameIndex.get(normalized)!.push(entity.id);
        });
      });
      
      // Save to localStorage
      this.saveToLocalStorage();
      
      console.log('Cached', this.entityCache.size, 'GERS entities');
    } catch (error) {
      console.error('Error fetching bridge data:', error);
      throw error;
    }
  }
  
  /**
   * Search entities by name
   */
  searchByName(query: string, limit: number = 10): GERSEntity[] {
    const normalized = query.toLowerCase().trim();
    
    // Check cache first
    const cached = this.cache.get(normalized);
    if (cached) return cached;
    
    const results: GERSEntity[] = [];
    const seen = new Set<string>();
    
    // Exact match
    if (this.nameIndex.has(normalized)) {
      const ids = this.nameIndex.get(normalized)!;
      ids.forEach(id => {
        if (!seen.has(id) && results.length < limit) {
          const entity = this.entityCache.get(id);
          if (entity) {
            results.push(entity);
            seen.add(id);
          }
        }
      });
    }
    
    // Partial match
    if (results.length < limit) {
      for (const [name, ids] of this.nameIndex.entries()) {
        if (name.includes(normalized)) {
          ids.forEach(id => {
            if (!seen.has(id) && results.length < limit) {
              const entity = this.entityCache.get(id);
              if (entity) {
                results.push(entity);
                seen.add(id);
              }
            }
          });
        }
      }
    }
    
    // Cache the results
    this.cache.set(normalized, results);
    
    return results;
  }
  
  /**
   * Get entity by GERS ID
   */
  getById(gersId: string): GERSEntity | null {
    return this.entityCache.get(gersId) || null;
  }
  
  /**
   * Save to localStorage for persistence
   */
  private saveToLocalStorage(): void {
    try {
      const data: CachedData = {
        version: '1.0',
        timestamp: Date.now(),
        nameIndex: Array.from(this.nameIndex.entries()),
        entities: Array.from(this.entityCache.entries())
      };
      
      localStorage.setItem('gers_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save GERS to localStorage:', error);
    }
  }
  
  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(): CachedData | null {
    try {
      const stored = localStorage.getItem('gers_cache');
      if (!stored) return null;
      
      const data = JSON.parse(stored) as CachedData;
      
      // Check if cache is still fresh (24 hours)
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('gers_cache');
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to load GERS from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Load mock data as fallback
   */
  private async loadMockData(): Promise<void> {
    const mockData = {
      entities: [
        {
          id: '08f2a5b7c9d3e1f6',
          names: ['Los Angeles', 'LA', 'City of Los Angeles'],
          type: 'locality',
          coordinates: [-118.2437, 34.0522] as [number, number],
          bbox: [-118.668, 33.703, -118.155, 34.337] as [number, number, number, number]
        },
        {
          id: '09a1b2c3d4e5f6g7',
          names: ['New York', 'NYC', 'New York City', 'Big Apple'],
          type: 'locality',
          coordinates: [-74.006, 40.7128] as [number, number],
          bbox: [-74.259, 40.477, -73.700, 40.917] as [number, number, number, number]
        },
        {
          id: '10b2c3d4e5f6g7h8',
          names: ['Lubbock', 'Lubbock, TX', 'Hub City'],
          type: 'locality',
          coordinates: [-101.8552, 33.5779] as [number, number],
          bbox: [-102.0517, 33.4365, -101.6587, 33.7193] as [number, number, number, number]
        },
        {
          id: '11c3d4e5f6g7h8i9',
          names: ['Chicago', 'Chi-Town', 'Windy City', 'Chicago, IL'],
          type: 'locality',
          coordinates: [-87.6298, 41.8781] as [number, number],
          bbox: [-87.940, 41.644, -87.524, 42.023] as [number, number, number, number]
        },
        {
          id: '12d4e5f6g7h8i9j0',
          names: ['Houston', 'Houston, TX', 'Space City'],
          type: 'locality',
          coordinates: [-95.3698, 29.7604] as [number, number],
          bbox: [-95.823, 29.523, -95.014, 30.110] as [number, number, number, number]
        },
        {
          id: '13e5f6g7h8i9j0k1',
          names: ['LAX', 'Los Angeles International Airport'],
          type: 'aerodrome',
          coordinates: [-118.4085, 33.9425] as [number, number]
        },
        {
          id: '14f6g7h8i9j0k1l2',
          names: ['JFK', 'John F. Kennedy International Airport', 'JFK Airport'],
          type: 'aerodrome',
          coordinates: [-73.7781, 40.6413] as [number, number]
        },
        {
          id: '15g7h8i9j0k1l2m3',
          names: ['Port of Los Angeles', 'Los Angeles Harbor', 'LA Port'],
          type: 'port',
          coordinates: [-118.2729, 33.7406] as [number, number]
        },
        {
          id: '16h8i9j0k1l2m3n4',
          names: ['Port of Long Beach', 'Long Beach Harbor'],
          type: 'port',
          coordinates: [-118.2148, 33.7563] as [number, number]
        },
        {
          id: '17i9j0k1l2m3n4o5',
          names: ['San Francisco', 'SF', 'San Francisco, CA', 'The City'],
          type: 'locality',
          coordinates: [-122.4194, 37.7749] as [number, number],
          bbox: [-122.517, 37.708, -122.357, 37.812] as [number, number, number, number]
        }
      ]
    };
    
    mockData.entities.forEach(entity => {
      this.entityCache.set(entity.id, entity);
      entity.names.forEach(name => {
        const normalized = name.toLowerCase();
        if (!this.nameIndex.has(normalized)) {
          this.nameIndex.set(normalized, []);
        }
        this.nameIndex.get(normalized)!.push(entity.id);
      });
    });
    
    // Save mock data to localStorage too
    this.saveToLocalStorage();
    
    console.log('Loaded mock GERS data with', mockData.entities.length, 'entities');
  }
  
  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.nameIndex.clear();
    this.entityCache.clear();
    localStorage.removeItem('gers_cache');
    this.isInitialized = false;
  }
  
  /**
   * Get statistics about the cached data
   */
  getStats(): { entities: number; names: number; cacheSize: number } {
    return {
      entities: this.entityCache.size,
      names: this.nameIndex.size,
      cacheSize: this.cache.size
    };
  }
}

// Singleton instance
let instance: GERSBridgeService | null = null;

export function getGERSBridgeService(): GERSBridgeService {
  if (!instance) {
    instance = new GERSBridgeService();
  }
  return instance;
}