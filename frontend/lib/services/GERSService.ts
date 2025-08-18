/**
 * GERS (Global Entity Reference System) Service
 * Handles entity resolution for Overture Maps features
 * Each feature in Overture tiles has a GERS ID for unique identification
 */

import maplibregl from 'maplibre-gl';
import { getGERSBridgeService } from './GERSBridgeService';

export interface GERSEntity {
  id: string;                    // GERS ID (e.g., "08f2a5b7c9d3e1f6")
  names: string[];               // All name variants
  category: string;              // building, place, address, etc.
  subtype: string;              // restaurant, hospital, airport, etc.
  confidence: number;            // Confidence score for entity matching
  bbox?: number[];              // Bounding box [west, south, east, north]
  height?: number;              // For buildings
  parentId?: string;            // Parent entity GERS ID
  relatedIds?: string[];        // Related entities
}

export class GERSService {
  private gersIndex: Map<string, GERSEntity> = new Map();
  private nameToIds: Map<string, string[]> = new Map();
  private mapRef: maplibregl.Map | null = null;
  private initialized: boolean = false;
  private bridgeService = getGERSBridgeService();
  
  /**
   * Initialize the GERS service by loading indices
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // First try to initialize the bridge service
      await this.bridgeService.initialize();
      console.log('GERS Bridge Service initialized');
      
      // Also try to load processed GERS indices for additional data
      try {
        const [indexResponse, nameResponse] = await Promise.all([
          fetch('/data/gers/gers-index.json'),
          fetch('/data/gers/name-to-id.json')
        ]);
        
        if (indexResponse.ok && nameResponse.ok) {
          const gersData = await indexResponse.json();
          const nameData = await nameResponse.json();
          
          // Build Maps for fast lookup
          Object.entries(gersData).forEach(([id, entity]) => {
            this.gersIndex.set(id, entity as GERSEntity);
          });
          
          Object.entries(nameData).forEach(([name, ids]) => {
            this.nameToIds.set(name, ids as string[]);
          });
          
          console.log(`Additional GERS data loaded: ${this.gersIndex.size} entities, ${this.nameToIds.size} names`);
        }
      } catch (error) {
        console.log('No additional GERS indices found, using bridge service only');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize GERS service:', error);
    }
  }
  
  /**
   * Set map reference to query features
   */
  setMap(map: maplibregl.Map): void {
    this.mapRef = map;
  }
  
  /**
   * Search entities by name
   */
  searchByName(query: string): GERSEntity[] {
    if (!this.initialized) {
      console.warn('GERS service not initialized');
      return [];
    }
    
    const normalized = query.toLowerCase().trim();
    const results: GERSEntity[] = [];
    const seen = new Set<string>();
    
    // First search using the bridge service
    const bridgeResults = this.bridgeService.searchByName(query, 10);
    bridgeResults.forEach(bridgeEntity => {
      if (!seen.has(bridgeEntity.id)) {
        // Convert bridge entity to GERSEntity format
        const entity: GERSEntity = {
          id: bridgeEntity.id,
          names: bridgeEntity.names,
          category: bridgeEntity.type || 'place',
          subtype: bridgeEntity.type || '',
          confidence: 0.9,
          bbox: bridgeEntity.bbox
        };
        results.push(entity);
        seen.add(bridgeEntity.id);
      }
    });
    
    // Then search our local index for additional results
    const exactIds = this.nameToIds.get(normalized) || [];
    exactIds.forEach(id => {
      if (!seen.has(id)) {
        const entity = this.gersIndex.get(id);
        if (entity) {
          results.push(entity);
          seen.add(id);
        }
      }
    });
    
    // Fuzzy match if we need more results
    if (results.length < 10) {
      for (const [name, ids] of this.nameToIds.entries()) {
        if (name.includes(normalized) || normalized.includes(name)) {
          ids.forEach(id => {
            if (!seen.has(id) && results.length < 15) {
              const entity = this.gersIndex.get(id);
              if (entity) {
                results.push(entity);
                seen.add(id);
              }
            }
          });
        }
      }
    }
    
    // Sort by confidence and name match quality
    results.sort((a, b) => {
      // Exact matches first
      const aExact = a.names.some(n => n.toLowerCase() === normalized);
      const bExact = b.names.some(n => n.toLowerCase() === normalized);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by confidence
      return (b.confidence || 0) - (a.confidence || 0);
    });
    
    return results.slice(0, 10); // Return top 10 results
  }
  
  /**
   * Search entities with options
   */
  async searchEntities(query: string, options?: {
    limit?: number;
    includeAlternateNames?: boolean;
    category?: string;
  }): Promise<GERSEntity[]> {
    const limit = options?.limit || 10;
    const results = this.searchByName(query);
    
    // Filter by category if specified
    if (options?.category) {
      return results.filter(e => e.category === options.category).slice(0, limit);
    }
    
    return results.slice(0, limit);
  }
  
  /**
   * Get entity by GERS ID
   */
  getEntityById(gersId: string): GERSEntity | null {
    // First check bridge service
    const bridgeEntity = this.bridgeService.getById(gersId);
    if (bridgeEntity) {
      return {
        id: bridgeEntity.id,
        names: bridgeEntity.names,
        category: bridgeEntity.type || 'place',
        subtype: bridgeEntity.type || '',
        confidence: 0.9,
        bbox: bridgeEntity.bbox
      };
    }
    
    // Then check local index
    return this.gersIndex.get(gersId) || null;
  }
  
  /**
   * Get entity from map feature (clicked or queried)
   */
  getEntityFromMapFeature(feature: any): GERSEntity | null {
    if (!feature || !feature.properties) return null;
    
    // Overture tiles include GERS IDs in properties
    const gersId = feature.properties?.id || 
                   feature.properties?.gers_id || 
                   feature.properties?.['@id'];
    
    if (gersId && this.gersIndex.has(gersId)) {
      return this.gersIndex.get(gersId)!;
    }
    
    // If no GERS ID in index, create a basic entity from feature properties
    if (gersId) {
      return {
        id: gersId,
        names: feature.properties.name ? [feature.properties.name] : [],
        category: feature.sourceLayer || 'unknown',
        subtype: feature.properties.class || feature.properties.type || '',
        confidence: 0.5
      };
    }
    
    return null;
  }
  
  /**
   * Get geometry for GERS entity from map
   */
  async getEntityGeometry(gersId: string): Promise<GeoJSON.Geometry | null> {
    if (!this.mapRef) {
      console.warn('Map reference not set');
      return null;
    }
    
    // Query all Overture layers for features with this GERS ID
    const sources = [
      { source: 'overture-buildings', layer: 'building' },
      { source: 'overture-places', layer: 'place' },
      { source: 'overture-transportation', layer: 'segment' },
      { source: 'overture-base', layers: ['water', 'land'] }
    ];
    
    for (const sourceConfig of sources) {
      try {
        if (sourceConfig.layers) {
          // Multiple layers in one source
          for (const layer of sourceConfig.layers) {
            const features = this.mapRef.querySourceFeatures(sourceConfig.source, {
              sourceLayer: layer,
              filter: ['==', ['get', 'id'], gersId]
            });
            if (features && features.length > 0) {
              return features[0].geometry;
            }
          }
        } else {
          // Single layer
          const features = this.mapRef.querySourceFeatures(sourceConfig.source, {
            sourceLayer: sourceConfig.layer,
            filter: ['==', ['get', 'id'], gersId]
          });
          
          if (features && features.length > 0) {
            return features[0].geometry;
          }
        }
      } catch (e) {
        // Layer might not exist at current zoom
        continue;
      }
    }
    
    // If we have a bbox in the entity, create a polygon
    const entity = this.gersIndex.get(gersId);
    if (entity?.bbox && entity.bbox.length === 4) {
      const [west, south, east, north] = entity.bbox;
      return {
        type: 'Polygon',
        coordinates: [[
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south]
        ]]
      };
    }
    
    return null;
  }
  
  /**
   * Get related entities (e.g., all buildings in a block)
   */
  getRelatedEntities(gersId: string): GERSEntity[] {
    const entity = this.gersIndex.get(gersId);
    if (!entity) return [];
    
    const related: GERSEntity[] = [];
    
    // Get parent
    if (entity.parentId) {
      const parent = this.gersIndex.get(entity.parentId);
      if (parent) related.push(parent);
    }
    
    // Get related
    if (entity.relatedIds) {
      entity.relatedIds.forEach(id => {
        const rel = this.gersIndex.get(id);
        if (rel) related.push(rel);
      });
    }
    
    // Get children (entities that have this as parent)
    for (const [id, ent] of this.gersIndex.entries()) {
      if (ent.parentId === gersId && id !== gersId) {
        related.push(ent);
      }
    }
    
    return related;
  }
  
  /**
   * Find entities near a location
   */
  async findNearbyEntities(
    center: [number, number], 
    radiusKm: number,
    category?: string
  ): Promise<GERSEntity[]> {
    if (!this.mapRef) return [];
    
    const results: GERSEntity[] = [];
    
    // Convert radius to degrees (rough approximation)
    const radiusDeg = radiusKm / 111; // 1 degree ≈ 111 km
    
    // Create bounding box
    const bbox: [number, number, number, number] = [
      center[0] - radiusDeg,
      center[1] - radiusDeg,
      center[0] + radiusDeg,
      center[1] + radiusDeg
    ];
    
    // Search through our index
    for (const entity of this.gersIndex.values()) {
      if (category && entity.category !== category) continue;
      
      if (entity.bbox) {
        // Check if entity bbox intersects with search bbox
        if (entity.bbox[0] <= bbox[2] && 
            entity.bbox[2] >= bbox[0] &&
            entity.bbox[1] <= bbox[3] && 
            entity.bbox[3] >= bbox[1]) {
          results.push(entity);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Zoom map to entity
   */
  async zoomToEntity(gersId: string, padding: number = 50): Promise<void> {
    if (!this.mapRef) {
      console.warn('Map reference not set');
      return;
    }
    
    const entity = this.gersIndex.get(gersId);
    if (!entity) {
      console.warn(`Entity ${gersId} not found`);
      return;
    }
    
    // Use bbox if available
    if (entity.bbox && entity.bbox.length === 4) {
      this.mapRef.fitBounds(entity.bbox as [number, number, number, number], {
        padding
      });
      return;
    }
    
    // Try to get geometry from map
    const geometry = await this.getEntityGeometry(gersId);
    if (geometry) {
      if (geometry.type === 'Point') {
        const coords = (geometry as GeoJSON.Point).coordinates;
        this.mapRef.flyTo({
          center: coords as [number, number],
          zoom: 16
        });
      } else {
        // For polygons, calculate bounds
        // This is simplified - in production use turf.js
        console.log('Zooming to entity geometry');
      }
    }
  }
}

// Singleton instance
let gersServiceInstance: GERSService | null = null;

export function getGERSService(): GERSService {
  if (!gersServiceInstance) {
    gersServiceInstance = new GERSService();
  }
  return gersServiceInstance;
}