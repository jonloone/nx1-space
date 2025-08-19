/**
 * Enhanced GERS Data Loader
 * Loads Overture Maps data with H3 spatial indexing and building footprints
 */

import { 
  OvertureBuildingFeature, 
  H3SpatialIndex, 
  GERSBridgeEntry,
  BuildingDensityCell,
  ChangeDetectionResult
} from '../types/gers';

// Mock H3 implementation for now - in production use h3-js library
const h3Mock = {
  geoToH3: (lat: number, lng: number, res: number): string => {
    // Simple grid-based mock - replace with actual H3
    const latCell = Math.floor((lat + 90) * Math.pow(2, res) / 180);
    const lngCell = Math.floor((lng + 180) * Math.pow(2, res) / 360);
    return `${res}_${latCell}_${lngCell}`;
  },
  h3ToGeo: (h3Index: string): [number, number] => {
    const [res, latCell, lngCell] = h3Index.split('_').map(Number);
    const lat = (latCell * 180 / Math.pow(2, res)) - 90;
    const lng = (lngCell * 360 / Math.pow(2, res)) - 180;
    return [lat, lng];
  },
  kRing: (h3Index: string, k: number): string[] => {
    // Simple mock - return surrounding cells
    const [res, latCell, lngCell] = h3Index.split('_').map(Number);
    const result = [h3Index];
    for (let i = -k; i <= k; i++) {
      for (let j = -k; j <= k; j++) {
        if (i !== 0 || j !== 0) {
          result.push(`${res}_${latCell + i}_${lngCell + j}`);
        }
      }
    }
    return result;
  }
};

export class GERSDataLoader {
  private spatialIndex: H3SpatialIndex;
  private buildingCache: Map<string, OvertureBuildingFeature> = new Map();
  private densityCache: Map<string, BuildingDensityCell> = new Map();
  private initialized: boolean = false;
  private lastSnapshot: string = '';

  constructor() {
    this.spatialIndex = {
      resolution: 9, // ~0.1km2 resolution
      index: new Map()
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing GERS Data Loader...');
      
      // Load initial building data from Overture Maps
      await this.loadOvertureBuildings();
      
      // Build H3 spatial index
      await this.buildSpatialIndex();
      
      this.initialized = true;
      console.log('GERS Data Loader initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GERS Data Loader:', error);
      throw error;
    }
  }

  private async loadOvertureBuildings(): Promise<void> {
    try {
      // In production, this would fetch from Overture S3 parquet files
      // For now, we'll simulate with sample building data
      const sampleBuildings = await this.generateSampleBuildingData();
      
      sampleBuildings.forEach(building => {
        this.buildingCache.set(building.id, building);
      });

      console.log(`Loaded ${sampleBuildings.length} building features`);
    } catch (error) {
      console.error('Error loading Overture buildings:', error);
      throw error;
    }
  }

  private async generateSampleBuildingData(): Promise<OvertureBuildingFeature[]> {
    // Generate sample building data for major cities
    const cities = [
      { name: 'Miami', lat: 25.7617, lng: -80.1918, count: 1000 },
      { name: 'Houston', lat: 29.7604, lng: -95.3698, count: 800 },
      { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, count: 1200 },
      { name: 'New York', lat: 40.7128, lng: -74.0060, count: 1500 }
    ];

    const buildings: OvertureBuildingFeature[] = [];
    let idCounter = 1;

    for (const city of cities) {
      for (let i = 0; i < city.count; i++) {
        // Random position around city center
        const latOffset = (Math.random() - 0.5) * 0.1; // ~5km radius
        const lngOffset = (Math.random() - 0.5) * 0.1;
        
        const building: OvertureBuildingFeature = {
          id: `building_${idCounter++}`,
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [city.lng + lngOffset, city.lat + latOffset],
              [city.lng + lngOffset + 0.001, city.lat + latOffset],
              [city.lng + lngOffset + 0.001, city.lat + latOffset + 0.001],
              [city.lng + lngOffset, city.lat + latOffset + 0.001],
              [city.lng + lngOffset, city.lat + latOffset]
            ]]
          },
          properties: {
            height: Math.floor(Math.random() * 200) + 10, // 10-210m
            numFloors: Math.floor(Math.random() * 50) + 1,
            class: ['residential', 'commercial', 'office', 'industrial'][Math.floor(Math.random() * 4)],
            names: {
              primary: `${city.name} Building ${i + 1}`
            },
            sources: [{
              dataset: 'overture-maps',
              confidence: 0.8 + Math.random() * 0.2
            }],
            updateTime: new Date().toISOString()
          }
        };

        buildings.push(building);
      }
    }

    return buildings;
  }

  private async buildSpatialIndex(): Promise<void> {
    console.log('Building H3 spatial index...');
    
    for (const [id, building] of this.buildingCache.entries()) {
      if (building.geometry.type === 'Polygon') {
        // Get center point of polygon
        const coords = building.geometry.coordinates[0];
        const centerLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
        const centerLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
        
        // Get H3 index for this location
        const h3Index = h3Mock.geoToH3(centerLat, centerLng, this.spatialIndex.resolution);
        
        // Add to spatial index
        if (!this.spatialIndex.index.has(h3Index)) {
          this.spatialIndex.index.set(h3Index, []);
        }
        this.spatialIndex.index.get(h3Index)!.push(id);
      }
    }

    console.log(`Built spatial index with ${this.spatialIndex.index.size} cells`);
  }

  /**
   * Query buildings within radius using H3 spatial index
   */
  async queryBuildingsInRadius(
    center: [number, number], 
    radiusKm: number,
    options?: {
      minConfidence?: number;
      buildingClass?: string[];
      minHeight?: number;
      maxHeight?: number;
    }
  ): Promise<OvertureBuildingFeature[]> {
    const [lat, lng] = center;
    const centerH3 = h3Mock.geoToH3(lat, lng, this.spatialIndex.resolution);
    
    // Determine k-ring size based on radius
    // Each H3 cell at resolution 9 is ~0.1km2, so approximate k
    const k = Math.ceil(radiusKm / 0.3); // rough approximation
    
    const searchCells = h3Mock.kRing(centerH3, k);
    const candidateIds = new Set<string>();
    
    // Collect all building IDs in search area
    searchCells.forEach(cellId => {
      const buildingIds = this.spatialIndex.index.get(cellId);
      if (buildingIds) {
        buildingIds.forEach(id => candidateIds.add(id));
      }
    });
    
    // Filter results
    const results: OvertureBuildingFeature[] = [];
    
    for (const buildingId of candidateIds) {
      const building = this.buildingCache.get(buildingId);
      if (!building) continue;
      
      // Apply filters
      if (options?.minConfidence && building.properties.sources) {
        const maxConfidence = Math.max(...building.properties.sources.map(s => s.confidence || 0));
        if (maxConfidence < options.minConfidence) continue;
      }
      
      if (options?.buildingClass && building.properties.class) {
        if (!options.buildingClass.includes(building.properties.class)) continue;
      }
      
      if (options?.minHeight && building.properties.height) {
        if (building.properties.height < options.minHeight) continue;
      }
      
      if (options?.maxHeight && building.properties.height) {
        if (building.properties.height > options.maxHeight) continue;
      }
      
      // Additional distance check (more precise than H3 cell)
      const buildingCenter = this.getBuildingCenter(building);
      if (buildingCenter) {
        const distance = this.calculateDistance(center, buildingCenter);
        if (distance <= radiusKm) {
          results.push(building);
        }
      }
    }
    
    return results;
  }

  /**
   * Calculate building density for H3 cells
   */
  async calculateBuildingDensity(
    bounds: [number, number, number, number], // [west, south, east, north]
    resolution?: number
  ): Promise<BuildingDensityCell[]> {
    const res = resolution || this.spatialIndex.resolution;
    const densityCells: Map<string, BuildingDensityCell> = new Map();
    
    // Iterate through all buildings in bounds
    for (const [buildingId, building] of this.buildingCache.entries()) {
      const center = this.getBuildingCenter(building);
      if (!center) continue;
      
      const [lat, lng] = center;
      
      // Check if building is within bounds
      if (lng >= bounds[0] && lng <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]) {
        const h3Index = h3Mock.geoToH3(lat, lng, res);
        
        if (!densityCells.has(h3Index)) {
          const cellCenter = h3Mock.h3ToGeo(h3Index);
          densityCells.set(h3Index, {
            h3Index,
            buildingCount: 0,
            totalArea: 0,
            averageHeight: 0,
            dominantType: '',
            confidence: 0,
            center: cellCenter
          });
        }
        
        const cell = densityCells.get(h3Index)!;
        cell.buildingCount++;
        cell.totalArea += this.estimateBuildingArea(building);
        cell.averageHeight = (cell.averageHeight * (cell.buildingCount - 1) + (building.properties.height || 0)) / cell.buildingCount;
        
        // Update confidence
        const buildingConfidence = building.properties.sources?.reduce((max, s) => 
          Math.max(max, s.confidence || 0), 0) || 0;
        cell.confidence = Math.max(cell.confidence, buildingConfidence);
      }
    }
    
    // Determine dominant building type for each cell
    for (const cell of densityCells.values()) {
      // This would analyze building types in the cell - simplified here
      cell.dominantType = 'mixed';
    }
    
    return Array.from(densityCells.values());
  }

  /**
   * Detect changes between GERS snapshots
   */
  async detectChanges(
    previousSnapshot: string,
    currentSnapshot: string
  ): Promise<ChangeDetectionResult[]> {
    const changes: ChangeDetectionResult[] = [];
    
    // This would compare two snapshots - simplified implementation
    // In production, this would use DuckDB to compare parquet files
    
    const mockChanges: ChangeDetectionResult[] = [
      {
        entityId: 'building_123',
        changeType: 'added',
        timestamp: new Date().toISOString(),
        confidence: 0.95,
        newValue: { height: 50, class: 'commercial' },
        source: 'overture-maps-monthly'
      },
      {
        entityId: 'building_456',
        changeType: 'modified',
        timestamp: new Date().toISOString(),
        confidence: 0.88,
        oldValue: { height: 30 },
        newValue: { height: 35 },
        source: 'overture-maps-monthly'
      }
    ];
    
    return mockChanges;
  }

  /**
   * Get building statistics
   */
  async getBuildingStats(): Promise<{
    totalBuildings: number;
    byClass: Record<string, number>;
    byHeight: Record<string, number>;
    averageHeight: number;
    totalArea: number;
  }> {
    const stats = {
      totalBuildings: this.buildingCache.size,
      byClass: {} as Record<string, number>,
      byHeight: {} as Record<string, number>,
      averageHeight: 0,
      totalArea: 0
    };
    
    let totalHeight = 0;
    
    for (const building of this.buildingCache.values()) {
      // Count by class
      const buildingClass = building.properties.class || 'unknown';
      stats.byClass[buildingClass] = (stats.byClass[buildingClass] || 0) + 1;
      
      // Count by height ranges
      const height = building.properties.height || 0;
      totalHeight += height;
      
      const heightRange = height < 20 ? 'low' : height < 100 ? 'mid' : 'high';
      stats.byHeight[heightRange] = (stats.byHeight[heightRange] || 0) + 1;
      
      // Estimate area
      stats.totalArea += this.estimateBuildingArea(building);
    }
    
    stats.averageHeight = totalHeight / stats.totalBuildings;
    
    return stats;
  }

  private getBuildingCenter(building: OvertureBuildingFeature): [number, number] | null {
    if (building.geometry.type === 'Polygon') {
      const coords = building.geometry.coordinates[0];
      const centerLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
      const centerLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
      return [centerLat, centerLng];
    }
    return null;
  }

  private estimateBuildingArea(building: OvertureBuildingFeature): number {
    // Simplified area calculation - in production use proper geometric calculation
    if (building.geometry.type === 'Polygon') {
      const coords = building.geometry.coordinates[0];
      // Simple bounding box area estimate
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const width = Math.max(...lngs) - Math.min(...lngs);
      const height = Math.max(...lats) - Math.min(...lats);
      return width * height * 111000 * 111000; // rough m²
    }
    return 0;
  }

  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(point2[0] - point1[0]);
    const dLon = this.deg2rad(point2[1] - point1[1]);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1[0])) * Math.cos(this.deg2rad(point2[0])) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Singleton instance
let dataLoaderInstance: GERSDataLoader | null = null;

export function getGERSDataLoader(): GERSDataLoader {
  if (!dataLoaderInstance) {
    dataLoaderInstance = new GERSDataLoader();
  }
  return dataLoaderInstance;
}