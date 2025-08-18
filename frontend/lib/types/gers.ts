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