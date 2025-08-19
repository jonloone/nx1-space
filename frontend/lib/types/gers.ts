/**
 * GERS (Global Entity Reference System) Types
 * Types for Overture Maps entity resolution and bridge files
 */

export interface GERSBridgeEntry {
  id: string;                    // GERS ID
  names: {
    primary: string;             // Primary display name
    common?: string[];           // Common name variants
    official?: string[];         // Official names
    alt?: string[];             // Alternative names
    short?: string[];           // Short names/abbreviations
  };
  class: string;                // Primary classification
  subtype?: string;             // Subtype classification
  categories?: string[];        // Additional categories
  level?: number;               // Level of confidence/importance
  updateTime: string;           // ISO timestamp of last update
  version?: string;             // Version identifier
  sources?: {
    name: string;
    dataset?: string;
    recordId?: string;
    trust?: number;
  }[];
  geometry?: {
    bbox?: [number, number, number, number]; // [west, south, east, north]
    center?: [number, number];               // [lon, lat]
  };
  addresses?: {
    freeform?: string;
    locality?: string;
    region?: string;
    country?: string;
    postcode?: string;
  }[];
  brand?: {
    names?: {
      primary?: string;
      common?: string[];
    };
    wikidata?: string;
  };
  connectors?: {
    id: string;
    provider: string;
  }[];
}

export interface GERSSearchResult {
  entity: GERSBridgeEntry;
  score: number;               // Relevance score
  matchType: 'exact' | 'prefix' | 'fuzzy' | 'partial';
  matchedName?: string;        // Which name variant matched
}

export interface GERSCacheEntry {
  data: GERSBridgeEntry[];
  timestamp: number;
  version?: string;
}

export interface GERSIndexStats {
  totalEntities: number;
  byClass: Record<string, number>;
  bySubtype: Record<string, number>;
  lastUpdated: number;
  cacheSize: number;
}

export interface OvertureBuildingFeature {
  id: string;
  geometry: GeoJSON.Geometry;
  properties: {
    height?: number;
    level?: number;
    numFloors?: number;
    class?: string;
    names?: {
      primary?: string;
      common?: string[];
    };
    addresses?: Array<{
      freeform?: string;
      locality?: string;
      region?: string;
      country?: string;
      postcode?: string;
    }>;
    sources?: Array<{
      property?: string;
      dataset?: string;
      recordId?: string;
      confidence?: number;
    }>;
    updateTime?: string;
  };
}

export interface H3SpatialIndex {
  resolution: number;
  index: Map<string, string[]>; // H3 hex -> entity IDs
}

export interface GERSQueryOptions {
  center: [number, number];
  radiusKm: number;
  category?: string[];
  minConfidence?: number;
  limit?: number;
  includeBuildings?: boolean;
  includePlaces?: boolean;
  h3Resolution?: number;
}

export interface BuildingDensityCell {
  h3Index: string;
  buildingCount: number;
  totalArea: number;
  averageHeight: number;
  dominantType: string;
  confidence: number;
  center: [number, number];
}

export interface ChangeDetectionResult {
  entityId: string;
  changeType: 'added' | 'modified' | 'removed';
  timestamp: string;
  confidence: number;
  oldValue?: any;
  newValue?: any;
  source: string;
}

export interface DomainAnalysis {
  domain: 'maritime' | 'telecom' | 'logistics' | 'energy';
  entityId: string;
  metrics: Record<string, number>;
  opportunity: {
    score: number;
    factors: string[];
    recommendation: string;
  };
}