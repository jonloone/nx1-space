/**
 * Enhanced Terrain Portal with Real Elevation Data
 * Loads actual terrain tiles from Mapbox or other elevation providers
 */

import { TerrainLayer } from '@deck.gl/geo-layers';

export interface TerrainTile {
  x: number;
  y: number;
  z: number;
  elevation: ArrayBuffer | null;
  texture: ArrayBuffer | null;
  status: 'loading' | 'loaded' | 'error';
}

export interface EnhancedPortal {
  id: string;
  center: [number, number]; // [longitude, latitude]
  bounds: [number, number, number, number]; // [west, south, east, north]
  zoomLevel: number;
  tiles: Map<string, TerrainTile>;
  terrainLayer: TerrainLayer | null;
  metrics: TerrainMetrics | null;
  status: 'initializing' | 'loading' | 'ready' | 'error';
  createdAt: number;
  lastAccessed: number;
}

export interface TerrainMetrics {
  minElevation: number;
  maxElevation: number;
  avgElevation: number;
  avgSlope: number;
  suitabilityScore: number;
  accessibilityScore: number;
  stabilityScore: number;
  visibilityScore: number;
  constructionCost: number; // Estimated based on terrain
}

export class EnhancedTerrainPortal {
  private portals: Map<string, EnhancedPortal>;
  private activePortalId: string | null;
  private maxPortals: number = 3;
  private tileCache: Map<string, ArrayBuffer>;
  private elevationProvider: string;
  private textureProvider: string;

  constructor() {
    this.portals = new Map();
    this.activePortalId = null;
    this.tileCache = new Map();
    
    // Configure elevation and texture providers
    this.elevationProvider = `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
    this.textureProvider = `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
  }

  /**
   * Create a new terrain portal at the specified location
   */
  async createPortal(longitude: number, latitude: number, radiusKm: number = 50): Promise<string> {
    const portalId = `portal_${longitude.toFixed(4)}_${latitude.toFixed(4)}`;
    
    // Check if portal already exists
    if (this.portals.has(portalId)) {
      this.updatePortalAccess(portalId);
      return portalId;
    }

    // Enforce portal limit
    if (this.portals.size >= this.maxPortals) {
      this.removeOldestPortal();
    }

    // Calculate optimal zoom level based on radius
    const zoomLevel = this.calculateOptimalZoomLevel(radiusKm);
    
    // Calculate bounds
    const bounds = this.calculateBounds(longitude, latitude, radiusKm);

    // Create portal
    const portal: EnhancedPortal = {
      id: portalId,
      center: [longitude, latitude],
      bounds,
      zoomLevel,
      tiles: new Map(),
      terrainLayer: null,
      metrics: null,
      status: 'initializing',
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };

    this.portals.set(portalId, portal);
    this.activePortalId = portalId;

    // Start loading terrain data
    await this.loadPortalTerrain(portalId);

    return portalId;
  }

  /**
   * Calculate optimal zoom level for the given radius
   */
  private calculateOptimalZoomLevel(radiusKm: number): number {
    // Approximate calculation based on typical tile coverage
    if (radiusKm <= 5) return 14;
    if (radiusKm <= 10) return 13;
    if (radiusKm <= 25) return 12;
    if (radiusKm <= 50) return 11;
    if (radiusKm <= 100) return 10;
    return 9;
  }

  /**
   * Calculate geographic bounds
   */
  private calculateBounds(lon: number, lat: number, radiusKm: number): [number, number, number, number] {
    // Earth's radius in km
    const earthRadius = 6371;
    
    // Convert to radians
    const latRad = lat * Math.PI / 180;
    
    // Calculate degree changes
    const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);
    const lonDelta = (radiusKm / earthRadius) * (180 / Math.PI) / Math.cos(latRad);
    
    return [
      lon - lonDelta, // west
      lat - latDelta, // south
      lon + lonDelta, // east
      lat + latDelta  // north
    ];
  }

  /**
   * Load terrain data for a portal
   */
  private async loadPortalTerrain(portalId: string): Promise<void> {
    const portal = this.portals.get(portalId);
    if (!portal) return;

    try {
      portal.status = 'loading';

      // Calculate required tiles
      const tiles = this.calculateRequiredTiles(portal.bounds, portal.zoomLevel);
      
      // Load tiles in parallel
      const tilePromises = tiles.map(tile => this.loadTile(tile, portal));
      await Promise.all(tilePromises);

      // Create terrain layer
      portal.terrainLayer = this.createTerrainLayer(portal);

      // Calculate terrain metrics
      portal.metrics = await this.calculateTerrainMetrics(portal);

      portal.status = 'ready';

    } catch (error) {
      console.error('Failed to load terrain data:', error);
      portal.status = 'error';
    }
  }

  /**
   * Calculate which tiles are needed for the given bounds
   */
  private calculateRequiredTiles(bounds: [number, number, number, number], zoom: number): Array<{x: number, y: number, z: number}> {
    const tiles: Array<{x: number, y: number, z: number}> = [];
    
    // Convert bounds to tile coordinates
    const minTile = this.lonLatToTile(bounds[0], bounds[3], zoom);
    const maxTile = this.lonLatToTile(bounds[2], bounds[1], zoom);
    
    // Collect all tiles in the bounds
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
    
    return tiles;
  }

  /**
   * Convert longitude/latitude to tile coordinates
   */
  private lonLatToTile(lon: number, lat: number, zoom: number): {x: number, y: number} {
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  }

  /**
   * Load a single tile
   */
  private async loadTile(tile: {x: number, y: number, z: number}, portal: EnhancedPortal): Promise<void> {
    const tileKey = `${tile.z}/${tile.x}/${tile.y}`;
    
    // Check cache first
    if (this.tileCache.has(tileKey)) {
      const terrainTile: TerrainTile = {
        ...tile,
        elevation: this.tileCache.get(tileKey)!,
        texture: null,
        status: 'loaded'
      };
      portal.tiles.set(tileKey, terrainTile);
      return;
    }

    // Create tile object
    const terrainTile: TerrainTile = {
      ...tile,
      elevation: null,
      texture: null,
      status: 'loading'
    };
    portal.tiles.set(tileKey, terrainTile);

    try {
      // Load elevation data
      const elevationUrl = this.elevationProvider
        .replace('{z}', tile.z.toString())
        .replace('{x}', tile.x.toString())
        .replace('{y}', tile.y.toString());
      
      const response = await fetch(elevationUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        terrainTile.elevation = buffer;
        terrainTile.status = 'loaded';
        
        // Cache the tile
        this.tileCache.set(tileKey, buffer);
      } else {
        terrainTile.status = 'error';
      }
    } catch (error) {
      console.error(`Failed to load tile ${tileKey}:`, error);
      terrainTile.status = 'error';
    }
  }

  /**
   * Create deck.gl TerrainLayer
   */
  private createTerrainLayer(portal: EnhancedPortal): TerrainLayer {
    return new TerrainLayer({
      id: `terrain-${portal.id}`,
      minZoom: 0,
      maxZoom: 23,
      bounds: portal.bounds,
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      elevationData: this.elevationProvider,
      texture: this.textureProvider,
      meshMaxError: 4.0,
      material: {
        ambient: 0.5,
        diffuse: 1,
        shininess: 8,
        specularColor: [60, 64, 70]
      },
      wireframe: false,
      color: [255, 255, 255]
    });
  }

  /**
   * Calculate terrain metrics from loaded tiles
   */
  private async calculateTerrainMetrics(portal: EnhancedPortal): Promise<TerrainMetrics> {
    const elevations: number[] = [];
    const slopes: number[] = [];
    
    // Process each tile
    for (const tile of portal.tiles.values()) {
      if (tile.status === 'loaded' && tile.elevation) {
        const tileElevations = await this.decodeElevationData(tile.elevation);
        elevations.push(...tileElevations);
        
        const tileSlopes = this.calculateSlopes(tileElevations, 256); // Assuming 256x256 tiles
        slopes.push(...tileSlopes);
      }
    }

    if (elevations.length === 0) {
      return this.getDefaultMetrics();
    }

    // Calculate statistics
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    const avgElevation = elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
    const avgSlope = slopes.reduce((sum, s) => sum + s, 0) / slopes.length;

    // Calculate suitability scores
    const accessibilityScore = this.calculateAccessibilityScore(avgSlope, avgElevation);
    const stabilityScore = this.calculateStabilityScore(slopes);
    const visibilityScore = this.calculateVisibilityScore(minElevation, maxElevation, avgElevation);
    
    const suitabilityScore = (accessibilityScore + stabilityScore + visibilityScore) / 3;
    
    // Estimate construction cost based on terrain difficulty
    const constructionCost = this.estimateConstructionCost(avgSlope, avgElevation, suitabilityScore);

    return {
      minElevation,
      maxElevation,
      avgElevation,
      avgSlope,
      suitabilityScore,
      accessibilityScore,
      stabilityScore,
      visibilityScore,
      constructionCost
    };
  }

  /**
   * Decode elevation data from RGB terrain tiles
   */
  private async decodeElevationData(buffer: ArrayBuffer): Promise<number[]> {
    // Create an image from the buffer
    const blob = new Blob([buffer], { type: 'image/png' });
    const imageBitmap = await createImageBitmap(blob);
    
    // Create canvas to read pixel data
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageBitmap, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const elevations: number[] = [];
    
    // Decode elevation from RGB values using Mapbox terrain-RGB encoding
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Mapbox terrain-RGB formula
      const elevation = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
      elevations.push(elevation);
    }
    
    return elevations;
  }

  /**
   * Calculate slopes from elevation grid
   */
  private calculateSlopes(elevations: number[], gridSize: number): number[] {
    const slopes: number[] = [];
    const cellSize = 30; // Approximate meters per pixel at zoom 14
    
    for (let i = 0; i < elevations.length; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      let maxSlope = 0;
      
      // Check neighboring cells
      if (col > 0) {
        const slope = Math.abs(elevations[i] - elevations[i - 1]) / cellSize;
        maxSlope = Math.max(maxSlope, slope);
      }
      if (row > 0) {
        const slope = Math.abs(elevations[i] - elevations[i - gridSize]) / cellSize;
        maxSlope = Math.max(maxSlope, slope);
      }
      
      // Convert to degrees
      slopes.push(Math.atan(maxSlope) * 180 / Math.PI);
    }
    
    return slopes;
  }

  /**
   * Calculate accessibility score based on terrain
   */
  private calculateAccessibilityScore(avgSlope: number, avgElevation: number): number {
    let score = 100;
    
    // Slope penalties
    if (avgSlope > 30) score -= 40;
    else if (avgSlope > 20) score -= 25;
    else if (avgSlope > 10) score -= 15;
    else if (avgSlope > 5) score -= 5;
    
    // Elevation considerations
    if (avgElevation > 4000) score -= 25; // Very high altitude
    else if (avgElevation > 3000) score -= 15; // High altitude
    else if (avgElevation > 2000) score -= 5; // Moderate altitude
    
    // Sea level considerations
    if (avgElevation < 10) score -= 20; // Flood risk
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate stability score
   */
  private calculateStabilityScore(slopes: number[]): number {
    // Count slopes above thresholds
    const steepCount = slopes.filter(s => s > 30).length;
    const moderateCount = slopes.filter(s => s > 15 && s <= 30).length;
    
    const steepPercentage = (steepCount / slopes.length) * 100;
    const moderatePercentage = (moderateCount / slopes.length) * 100;
    
    let score = 100;
    score -= steepPercentage * 2; // Heavy penalty for steep slopes
    score -= moderatePercentage * 0.5; // Light penalty for moderate slopes
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate visibility score
   */
  private calculateVisibilityScore(minElev: number, maxElev: number, avgElev: number): number {
    const elevationRange = maxElev - minElev;
    const relativeHeight = (maxElev - avgElev) / Math.max(1, avgElev);
    
    // Higher elevation and greater range generally mean better visibility
    let score = 50;
    score += Math.min(30, elevationRange / 10); // Up to 30 points for elevation range
    score += Math.min(20, relativeHeight * 100); // Up to 20 points for relative height
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Estimate construction cost multiplier based on terrain
   */
  private estimateConstructionCost(avgSlope: number, avgElevation: number, suitabilityScore: number): number {
    let baseCost = 1.0;
    
    // Slope multipliers
    if (avgSlope > 30) baseCost *= 2.5;
    else if (avgSlope > 20) baseCost *= 1.8;
    else if (avgSlope > 10) baseCost *= 1.4;
    else if (avgSlope > 5) baseCost *= 1.2;
    
    // Elevation multipliers
    if (avgElevation > 3000) baseCost *= 1.5;
    else if (avgElevation > 2000) baseCost *= 1.3;
    else if (avgElevation > 1000) baseCost *= 1.1;
    
    // Suitability discount
    if (suitabilityScore > 80) baseCost *= 0.9;
    else if (suitabilityScore < 40) baseCost *= 1.3;
    
    return baseCost;
  }

  /**
   * Get default metrics when terrain data is unavailable
   */
  private getDefaultMetrics(): TerrainMetrics {
    return {
      minElevation: 0,
      maxElevation: 100,
      avgElevation: 50,
      avgSlope: 5,
      suitabilityScore: 70,
      accessibilityScore: 80,
      stabilityScore: 85,
      visibilityScore: 60,
      constructionCost: 1.0
    };
  }

  /**
   * Update portal access time
   */
  private updatePortalAccess(portalId: string): void {
    const portal = this.portals.get(portalId);
    if (portal) {
      portal.lastAccessed = Date.now();
      this.activePortalId = portalId;
    }
  }

  /**
   * Remove oldest portal
   */
  private removeOldestPortal(): void {
    let oldestPortal: EnhancedPortal | null = null;
    
    for (const portal of this.portals.values()) {
      if (!oldestPortal || portal.lastAccessed < oldestPortal.lastAccessed) {
        oldestPortal = portal;
      }
    }
    
    if (oldestPortal) {
      this.portals.delete(oldestPortal.id);
      if (this.activePortalId === oldestPortal.id) {
        this.activePortalId = null;
      }
    }
  }

  /**
   * Get portal by ID
   */
  getPortal(portalId: string): EnhancedPortal | undefined {
    return this.portals.get(portalId);
  }

  /**
   * Get active portal
   */
  getActivePortal(): EnhancedPortal | null {
    return this.activePortalId ? this.portals.get(this.activePortalId) || null : null;
  }

  /**
   * Clear all portals
   */
  clearAllPortals(): void {
    this.portals.clear();
    this.activePortalId = null;
  }

  /**
   * Get terrain layer for rendering
   */
  getTerrainLayer(portalId: string): TerrainLayer | null {
    const portal = this.portals.get(portalId);
    return portal?.terrainLayer || null;
  }

  /**
   * Check if portal is ready
   */
  isPortalReady(portalId: string): boolean {
    const portal = this.portals.get(portalId);
    return portal?.status === 'ready';
  }
}