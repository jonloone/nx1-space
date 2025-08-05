/**
 * TerrainPortal - Performance-optimized 3D terrain viewing
 * Only loads detailed terrain when user selects an area
 */

export interface Portal {
  id: string;
  center: [number, number]; // [lat, lon]
  radius: number; // km
  bounds: [number, number, number, number]; // [west, south, east, north]
  terrain: any | null;
  status: 'loading' | 'ready' | 'error';
  createdAt: number;
  lastAccessed: number;
}

export class TerrainPortal {
  private portals: Map<string, Portal>;
  private activePortalId: string | null;
  private maxPortals: number = 3; // Limit concurrent portals
  private portalTimeout: number = 600000; // 10 minutes

  constructor() {
    this.portals = new Map();
    this.activePortalId = null;
    
    // Cleanup expired portals periodically
    setInterval(() => this.cleanupExpiredPortals(), 60000); // Every minute
  }

  createPortal(lat: number, lon: number, radius: number = 50): string {
    const portalId = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
    
    // Check if portal already exists
    if (this.portals.has(portalId)) {
      const portal = this.portals.get(portalId)!;
      portal.lastAccessed = Date.now();
      this.activatePortal(portalId);
      return portalId;
    }

    // Enforce portal limit
    if (this.portals.size >= this.maxPortals) {
      this.removeOldestPortal();
    }

    // Calculate bounds
    const bounds = this.calculateBounds(lat, lon, radius);

    // Create new portal
    const portal: Portal = {
      id: portalId,
      center: [lat, lon],
      radius,
      bounds,
      terrain: null,
      status: 'loading',
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };

    this.portals.set(portalId, portal);
    this.loadTerrainData(portalId);
    this.activatePortal(portalId);

    return portalId;
  }

  private calculateBounds(lat: number, lon: number, radiusKm: number): [number, number, number, number] {
    // Simple bounds calculation (approximate)
    const latDegPerKm = 1 / 111.32;
    const lonDegPerKm = 1 / (111.32 * Math.cos(lat * Math.PI / 180));
    
    const latDelta = radiusKm * latDegPerKm;
    const lonDelta = radiusKm * lonDegPerKm;
    
    return [
      lon - lonDelta, // west
      lat - latDelta, // south
      lon + lonDelta, // east
      lat + latDelta  // north
    ];
  }

  private async loadTerrainData(portalId: string): Promise<void> {
    const portal = this.portals.get(portalId);
    if (!portal) return;

    try {
      // Simulate terrain data loading
      // In production, this would fetch actual elevation tiles
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock terrain data structure
      portal.terrain = {
        elevationData: this.generateMockElevation(portal.bounds),
        resolution: 30, // meters
        minElevation: 100,
        maxElevation: 2500
      };

      portal.status = 'ready';

      // Calculate additional metrics
      const metrics = this.calculateTerrainMetrics(portal.terrain);
      portal.terrain.metrics = metrics;

    } catch (error) {
      console.error('Failed to load terrain data:', error);
      portal.status = 'error';
    }
  }

  private generateMockElevation(bounds: [number, number, number, number]): number[][] {
    // Generate a simple elevation grid for demonstration
    const resolution = 50; // points
    const grid: number[][] = [];
    
    for (let i = 0; i < resolution; i++) {
      const row: number[] = [];
      for (let j = 0; j < resolution; j++) {
        // Create some interesting terrain with noise
        const x = i / resolution;
        const y = j / resolution;
        const elevation = 
          500 + // base elevation
          300 * Math.sin(x * Math.PI * 2) * Math.cos(y * Math.PI * 2) + // large features
          100 * Math.sin(x * Math.PI * 8) * Math.cos(y * Math.PI * 8) + // small features
          50 * (Math.random() - 0.5); // noise
        
        row.push(Math.max(0, elevation));
      }
      grid.push(row);
    }
    
    return grid;
  }

  private calculateTerrainMetrics(terrainData: any) {
    const { elevationData, minElevation, maxElevation } = terrainData;
    
    // Calculate various metrics for site suitability
    const avgElevation = this.calculateAverage(elevationData);
    const slopeData = this.calculateSlope(elevationData);
    const avgSlope = this.calculateAverage(slopeData);
    
    // Business-relevant scores
    const accessibilityScore = this.calculateAccessibility(avgSlope, avgElevation);
    const stabilityScore = this.calculateStability(slopeData);
    const visibilityScore = this.calculateVisibility(elevationData);
    
    return {
      avgElevation,
      avgSlope,
      accessibilityScore,
      stabilityScore,
      visibilityScore,
      overallSuitability: (accessibilityScore + stabilityScore + visibilityScore) / 3
    };
  }

  private calculateAverage(grid: number[][]): number {
    let sum = 0;
    let count = 0;
    
    for (const row of grid) {
      for (const value of row) {
        sum += value;
        count++;
      }
    }
    
    return sum / count;
  }

  private calculateSlope(elevationGrid: number[][]): number[][] {
    const slopeGrid: number[][] = [];
    const rows = elevationGrid.length;
    const cols = elevationGrid[0].length;
    
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        // Simple slope calculation using neighboring cells
        let maxSlope = 0;
        
        if (i > 0) {
          const slope = Math.abs(elevationGrid[i][j] - elevationGrid[i-1][j]) / 30; // 30m resolution
          maxSlope = Math.max(maxSlope, slope);
        }
        if (j > 0) {
          const slope = Math.abs(elevationGrid[i][j] - elevationGrid[i][j-1]) / 30;
          maxSlope = Math.max(maxSlope, slope);
        }
        
        row.push(maxSlope * 100); // Convert to percentage
      }
      slopeGrid.push(row);
    }
    
    return slopeGrid;
  }

  private calculateAccessibility(avgSlope: number, avgElevation: number): number {
    // Simple scoring: lower slope and moderate elevation = better accessibility
    let score = 100;
    
    // Slope penalty
    if (avgSlope > 15) score -= 30;
    else if (avgSlope > 10) score -= 20;
    else if (avgSlope > 5) score -= 10;
    
    // Elevation considerations
    if (avgElevation > 3000) score -= 20; // High altitude challenges
    else if (avgElevation < 100) score -= 10; // Potential flood risk
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateStability(slopeGrid: number[][]): number {
    // Areas with consistent low slope are more stable
    let highSlopeCount = 0;
    let totalCells = 0;
    
    for (const row of slopeGrid) {
      for (const slope of row) {
        if (slope > 20) highSlopeCount++;
        totalCells++;
      }
    }
    
    const highSlopeRatio = highSlopeCount / totalCells;
    return Math.max(0, 100 - (highSlopeRatio * 100));
  }

  private calculateVisibility(elevationGrid: number[][]): number {
    // Higher relative elevation = better visibility
    const avgElevation = this.calculateAverage(elevationGrid);
    const maxElevation = Math.max(...elevationGrid.flat());
    
    const relativeHeight = (maxElevation - avgElevation) / avgElevation;
    return Math.min(100, relativeHeight * 50 + 50);
  }

  activatePortal(portalId: string): void {
    if (this.portals.has(portalId)) {
      this.activePortalId = portalId;
      const portal = this.portals.get(portalId)!;
      portal.lastAccessed = Date.now();
    }
  }

  deactivatePortal(): void {
    this.activePortalId = null;
  }

  getPortal(portalId: string): Portal | undefined {
    const portal = this.portals.get(portalId);
    if (portal) {
      portal.lastAccessed = Date.now();
    }
    return portal;
  }

  getActivePortal(): Portal | null {
    return this.activePortalId ? this.portals.get(this.activePortalId) || null : null;
  }

  removePortal(portalId: string): void {
    if (this.activePortalId === portalId) {
      this.activePortalId = null;
    }
    this.portals.delete(portalId);
  }

  private removeOldestPortal(): void {
    let oldestPortal: Portal | null = null;
    
    for (const portal of this.portals.values()) {
      if (!oldestPortal || portal.lastAccessed < oldestPortal.lastAccessed) {
        oldestPortal = portal;
      }
    }
    
    if (oldestPortal) {
      this.removePortal(oldestPortal.id);
    }
  }

  private cleanupExpiredPortals(): void {
    const now = Date.now();
    const expiredPortals: string[] = [];
    
    for (const [id, portal] of this.portals) {
      if (now - portal.lastAccessed > this.portalTimeout) {
        expiredPortals.push(id);
      }
    }
    
    for (const id of expiredPortals) {
      this.removePortal(id);
    }
  }

  getPortalCount(): number {
    return this.portals.size;
  }

  getAllPortals(): Portal[] {
    return Array.from(this.portals.values());
  }
}