/**
 * GERS Query Service
 * Advanced spatial queries and cross-domain analysis
 */

import { 
  GERSQueryOptions, 
  BuildingDensityCell, 
  DomainAnalysis,
  OvertureBuildingFeature 
} from '../types/gers';
import { getGERSDataLoader } from './GERSDataLoader';

export interface OpportunityScore {
  entityId: string;
  location: [number, number];
  overallScore: number;
  domainScores: {
    maritime: number;
    telecom: number;
    logistics: number;
    energy: number;
  };
  factors: Array<{
    factor: string;
    weight: number;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  recommendation: string;
  confidence: number;
}

export interface MaritimeAnalysis {
  portProximity: number;
  vesselDensity: number;
  cargoCapacity: number;
  infrastructureDensity: number;
  utilizationRate: number;
}

export interface TelecomAnalysis {
  populationDensity: number;
  buildingHeight: number;
  coverageGaps: number;
  demandProjection: number;
  competitorProximity: number;
}

export class GERSQueryService {
  private dataLoader = getGERSDataLoader();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.dataLoader.initialize();
    this.initialized = true;
  }

  /**
   * Execute radius-based queries with multiple filters
   */
  async executeRadiusQuery(options: GERSQueryOptions): Promise<{
    buildings: OvertureBuildingFeature[];
    densityCells: BuildingDensityCell[];
    totalCount: number;
    averageConfidence: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const buildings = await this.dataLoader.queryBuildingsInRadius(
      options.center,
      options.radiusKm,
      {
        minConfidence: options.minConfidence,
        buildingClass: options.category
      }
    );

    // Calculate density cells for the query area
    const bounds: [number, number, number, number] = [
      options.center[1] - (options.radiusKm / 111), // west
      options.center[0] - (options.radiusKm / 111), // south
      options.center[1] + (options.radiusKm / 111), // east
      options.center[0] + (options.radiusKm / 111)  // north
    ];

    const densityCells = await this.dataLoader.calculateBuildingDensity(bounds, options.h3Resolution);

    // Calculate average confidence
    const confidenceSum = buildings.reduce((sum, building) => {
      const maxConfidence = building.properties.sources?.reduce((max, s) => 
        Math.max(max, s.confidence || 0), 0) || 0;
      return sum + maxConfidence;
    }, 0);
    const averageConfidence = buildings.length > 0 ? confidenceSum / buildings.length : 0;

    return {
      buildings: buildings.slice(0, options.limit || 1000),
      densityCells,
      totalCount: buildings.length,
      averageConfidence
    };
  }

  /**
   * Calculate building density with aggregations
   */
  async calculateBuildingDensity(
    bounds: [number, number, number, number],
    resolution: number = 9
  ): Promise<{
    cells: BuildingDensityCell[];
    totalBuildings: number;
    averageDensity: number;
    hotspots: BuildingDensityCell[];
  }> {
    const cells = await this.dataLoader.calculateBuildingDensity(bounds, resolution);
    
    const totalBuildings = cells.reduce((sum, cell) => sum + cell.buildingCount, 0);
    const averageDensity = totalBuildings / cells.length;
    
    // Identify hotspots (cells with > 2x average density)
    const hotspots = cells.filter(cell => cell.buildingCount > averageDensity * 2);
    
    return {
      cells,
      totalBuildings,
      averageDensity,
      hotspots
    };
  }

  /**
   * Multi-domain opportunity scoring
   */
  async calculateOpportunityScores(
    center: [number, number],
    radiusKm: number,
    domains: Array<'maritime' | 'telecom' | 'logistics' | 'energy'> = ['maritime', 'telecom']
  ): Promise<OpportunityScore[]> {
    
    const buildings = await this.dataLoader.queryBuildingsInRadius(center, radiusKm);
    const opportunities: OpportunityScore[] = [];

    for (const building of buildings.slice(0, 50)) { // Limit for performance
      const buildingCenter = this.getBuildingCenter(building);
      if (!buildingCenter) continue;

      const domainScores = {
        maritime: 0,
        telecom: 0,
        logistics: 0,
        energy: 0
      };

      const factors: OpportunityScore['factors'] = [];

      // Maritime analysis
      if (domains.includes('maritime')) {
        const maritimeScore = await this.analyzeMaritimeOpportunity(building, buildingCenter);
        domainScores.maritime = maritimeScore.score;
        factors.push(...maritimeScore.factors);
      }

      // Telecom analysis
      if (domains.includes('telecom')) {
        const telecomScore = await this.analyzeTelecomOpportunity(building, buildingCenter);
        domainScores.telecom = telecomScore.score;
        factors.push(...telecomScore.factors);
      }

      // Logistics analysis
      if (domains.includes('logistics')) {
        domainScores.logistics = this.analyzeLogisticsOpportunity(building, buildingCenter);
      }

      // Energy analysis
      if (domains.includes('energy')) {
        domainScores.energy = this.analyzeEnergyOpportunity(building, buildingCenter);
      }

      // Calculate overall score
      const activeScores = domains.map(d => domainScores[d]).filter(s => s > 0);
      const overallScore = activeScores.length > 0 ? 
        activeScores.reduce((sum, score) => sum + score, 0) / activeScores.length : 0;

      // Generate recommendation
      const recommendation = this.generateRecommendation(domainScores, factors);

      opportunities.push({
        entityId: building.id,
        location: buildingCenter,
        overallScore,
        domainScores,
        factors,
        recommendation,
        confidence: this.calculateConfidence(factors)
      });
    }

    // Sort by overall score
    return opportunities.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Maritime opportunity analysis
   */
  private async analyzeMaritimeOpportunity(
    building: OvertureBuildingFeature,
    location: [number, number]
  ): Promise<{
    score: number;
    factors: OpportunityScore['factors'];
  }> {
    const factors: OpportunityScore['factors'] = [];
    let score = 0;

    // Distance to coast (simplified - would use actual coastline data)
    const coastDistance = this.estimateCoastDistance(location);
    if (coastDistance < 10) {
      const proximityScore = Math.max(0, 1 - (coastDistance / 10));
      score += proximityScore * 0.4;
      factors.push({
        factor: 'coastal_proximity',
        weight: 0.4,
        value: proximityScore,
        impact: 'positive'
      });
    }

    // Building suitability for maritime operations
    const height = building.properties.height || 0;
    if (height > 20 && height < 100) {
      const suitabilityScore = 0.8;
      score += suitabilityScore * 0.3;
      factors.push({
        factor: 'building_suitability',
        weight: 0.3,
        value: suitabilityScore,
        impact: 'positive'
      });
    }

    // Port infrastructure proximity (mock data)
    const portProximity = Math.random() * 0.8; // Would use actual port data
    score += portProximity * 0.3;
    factors.push({
      factor: 'port_infrastructure',
      weight: 0.3,
      value: portProximity,
      impact: 'positive'
    });

    return { score: Math.min(1, score), factors };
  }

  /**
   * Telecom opportunity analysis
   */
  private async analyzeTelecomOpportunity(
    building: OvertureBuildingFeature,
    location: [number, number]
  ): Promise<{
    score: number;
    factors: OpportunityScore['factors'];
  }> {
    const factors: OpportunityScore['factors'] = [];
    let score = 0;

    // Building height advantage
    const height = building.properties.height || 0;
    if (height > 50) {
      const heightScore = Math.min(1, height / 200);
      score += heightScore * 0.4;
      factors.push({
        factor: 'tower_height_advantage',
        weight: 0.4,
        value: heightScore,
        impact: 'positive'
      });
    }

    // Population density (estimated from building density)
    const nearbyBuildings = await this.dataLoader.queryBuildingsInRadius(location, 1); // 1km radius
    const densityScore = Math.min(1, nearbyBuildings.length / 100);
    score += densityScore * 0.3;
    factors.push({
      factor: 'population_density',
      weight: 0.3,
      value: densityScore,
      impact: 'positive'
    });

    // Existing coverage gaps (mock analysis)
    const coverageGap = Math.random() * 0.7; // Would analyze actual coverage
    score += coverageGap * 0.3;
    factors.push({
      factor: 'coverage_gap_opportunity',
      weight: 0.3,
      value: coverageGap,
      impact: 'positive'
    });

    return { score: Math.min(1, score), factors };
  }

  private analyzeLogisticsOpportunity(
    building: OvertureBuildingFeature,
    location: [number, number]
  ): number {
    // Simplified logistics scoring
    const buildingClass = building.properties.class;
    if (buildingClass === 'industrial' || buildingClass === 'commercial') {
      return 0.7 + Math.random() * 0.3;
    }
    return Math.random() * 0.5;
  }

  private analyzeEnergyOpportunity(
    building: OvertureBuildingFeature,
    location: [number, number]
  ): number {
    // Simplified energy scoring based on building characteristics
    const height = building.properties.height || 0;
    const area = this.estimateBuildingArea(building);
    
    // Larger buildings have more energy potential
    const sizeScore = Math.min(1, (area * height) / 50000);
    return sizeScore * (0.5 + Math.random() * 0.5);
  }

  private generateRecommendation(
    scores: OpportunityScore['domainScores'],
    factors: OpportunityScore['factors']
  ): string {
    const bestDomain = Object.entries(scores).reduce((best, [domain, score]) => 
      score > best.score ? { domain, score } : best, { domain: '', score: 0 });

    if (bestDomain.score > 0.7) {
      return `High potential for ${bestDomain.domain} applications. ${this.getTopFactor(factors)}`;
    } else if (bestDomain.score > 0.4) {
      return `Moderate ${bestDomain.domain} opportunity. Consider additional analysis.`;
    } else {
      return `Limited opportunity identified. May require infrastructure development.`;
    }
  }

  private getTopFactor(factors: OpportunityScore['factors']): string {
    const topFactor = factors.reduce((best, factor) => 
      (factor.weight * factor.value) > (best.weight * best.value) ? factor : best, 
      factors[0] || { factor: 'unknown', weight: 0, value: 0, impact: 'neutral' as const });
    
    return `Primary driver: ${topFactor.factor.replace('_', ' ')}`;
  }

  private calculateConfidence(factors: OpportunityScore['factors']): number {
    if (factors.length === 0) return 0;
    
    const avgWeight = factors.reduce((sum, f) => sum + f.weight, 0) / factors.length;
    const avgValue = factors.reduce((sum, f) => sum + f.value, 0) / factors.length;
    
    return avgWeight * avgValue;
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

  private estimateCoastDistance(location: [number, number]): number {
    // Simplified coast distance estimation
    // In production, this would use actual coastline data
    const [lat, lng] = location;
    
    // Known coastal cities with rough distances
    const coastalPoints = [
      { lat: 25.7617, lng: -80.1918, name: 'Miami' },
      { lat: 29.7604, lng: -95.3698, name: 'Houston' },
      { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
      { lat: 40.7128, lng: -74.0060, name: 'New York' }
    ];
    
    let minDistance = Infinity;
    for (const point of coastalPoints) {
      const distance = this.calculateDistance([lat, lng], [point.lat, point.lng]);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
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

  private estimateBuildingArea(building: OvertureBuildingFeature): number {
    if (building.geometry.type === 'Polygon') {
      const coords = building.geometry.coordinates[0];
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const width = Math.max(...lngs) - Math.min(...lngs);
      const height = Math.max(...lats) - Math.min(...lats);
      return width * height * 111000 * 111000; // rough m²
    }
    return 0;
  }
}

// Singleton instance
let queryServiceInstance: GERSQueryService | null = null;

export function getGERSQueryService(): GERSQueryService {
  if (!queryServiceInstance) {
    queryServiceInstance = new GERSQueryService();
  }
  return queryServiceInstance;
}