/**
 * H3 Hexagon Integration for Conditional Opportunity Scoring
 * 
 * This module integrates the sophisticated opportunity scoring system with the H3 grid system
 * to provide real-time, high-performance opportunity analysis across 10,000+ hexagons.
 * 
 * Key Features:
 * - Conditional activation only in "opportunities" mode
 * - Progressive enhancement with multiple scoring levels
 * - Intelligent caching with spatial indexing
 * - Batch processing for high-performance analysis
 * - Integration with existing H3 infrastructure
 */

import { latLngToCell, cellToLatLng, cellToBoundary, cellArea } from 'h3-js';
import { H3HexagonOpportunity } from '@/lib/services/h3GridService';
import { conditionalOpportunityScorer, ConditionalOpportunityScore } from './conditional-opportunity-scorer';

export interface EnhancedH3OpportunityScore extends H3HexagonOpportunity {
  // Enhanced scoring from conditional scorer
  conditionalScore?: ConditionalOpportunityScore;
  
  // Progressive enhancement levels
  scoringLevel: 'BASIC' | 'ENHANCED' | 'COMPREHENSIVE';
  
  // Performance metrics
  computationTime: number;
  lastScored: Date;
  
  // Confidence metrics
  overallConfidence: number;
  dataQuality: number;
  
  // Business intelligence
  investmentRecommendation: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'AVOID';
  riskAdjustedScore: number;
  
  // Opportunity classification
  opportunityType: 'EXPANSION' | 'GROWTH' | 'OPTIMIZATION' | 'DEFENSIVE' | 'EXPLORATION';
  priorityRanking: number; // 1-1000 ranking
}

export interface ScoringPerformanceMetrics {
  totalHexagonsScored: number;
  averageComputationTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // hexagons per second
  memoryUsage: number; // MB
  lastUpdate: Date;
}

export interface OpportunityModeConfig {
  enabled: boolean;
  scoringLevel: 'BASIC' | 'ENHANCED' | 'COMPREHENSIVE';
  maxHexagons: number;
  cacheDuration: number; // minutes
  progressiveEnhancement: boolean;
  realTimeUpdates: boolean;
  batchSize: number;
  priorityThreshold: number; // Only score hexagons above this threshold
}

/**
 * H3 Opportunity Integration Manager
 * Manages the conditional scoring system integration with H3 grid
 */
export class H3OpportunityIntegration {
  private opportunityMode: OpportunityModeConfig = {
    enabled: false,
    scoringLevel: 'ENHANCED',
    maxHexagons: 10000,
    cacheDuration: 30,
    progressiveEnhancement: true,
    realTimeUpdates: false,
    batchSize: 100,
    priorityThreshold: 40
  };
  
  private spatialIndex: Map<string, EnhancedH3OpportunityScore> = new Map();
  private scoringQueue: Set<string> = new Set();
  private performanceMetrics: ScoringPerformanceMetrics = {
    totalHexagonsScored: 0,
    averageComputationTime: 0,
    cacheHitRate: 0.0,
    errorRate: 0.0,
    throughput: 0,
    memoryUsage: 0,
    lastUpdate: new Date()
  };
  
  /**
   * Activate opportunities mode with configuration
   */
  activateOpportunitiesMode(config?: Partial<OpportunityModeConfig>): void {
    this.opportunityMode = { ...this.opportunityMode, ...config, enabled: true };
    conditionalOpportunityScorer.activateOpportunitiesMode();
    
    console.log('🚀 Opportunities mode activated with configuration:', this.opportunityMode);
  }
  
  /**
   * Deactivate opportunities mode and clear cache
   */
  deactivateOpportunitiesMode(): void {
    this.opportunityMode.enabled = false;
    conditionalOpportunityScorer.deactivateOpportunitiesMode();
    this.clearCache();
    
    console.log('🛑 Opportunities mode deactivated');
  }
  
  /**
   * Score a single H3 hexagon with enhanced opportunity analysis
   */
  async scoreHexagon(
    h3Index: string,
    existingData?: Partial<H3HexagonOpportunity>
  ): Promise<EnhancedH3OpportunityScore | null> {
    if (!this.opportunityMode.enabled) {
      return null;
    }
    
    const startTime = Date.now();
    
    // Check spatial cache first
    const cached = this.getSpatialCacheEntry(h3Index);
    if (cached && this.isCacheValid(cached)) {
      this.updateMetrics('cache_hit', Date.now() - startTime);
      return cached;
    }
    
    try {
      // Get basic H3 properties
      const [lat, lon] = cellToLatLng(h3Index);
      const resolution = h3Index.length - 2; // Approximate resolution from string length
      const boundary = cellToBoundary(h3Index);
      const areaKm2 = cellArea(h3Index, 'km2');
      
      // Create base opportunity object
      const baseOpportunity: H3HexagonOpportunity = existingData ? {
        ...existingData,
        hexagon: h3Index,
        h3Index,
        resolution,
        centerLat: lat,
        centerLon: lon,
        coordinates: [lon, lat],
        boundary,
        areaKm2
      } as H3HexagonOpportunity : this.createBaseOpportunity(h3Index, lat, lon, resolution, boundary, areaKm2);
      
      // Conditional scoring based on mode configuration
      let conditionalScore: ConditionalOpportunityScore | undefined;
      let scoringLevel: 'BASIC' | 'ENHANCED' | 'COMPREHENSIVE' = 'BASIC';
      
      if (this.shouldEnhanceScoring(baseOpportunity)) {
        conditionalScore = await conditionalOpportunityScorer.scoreHexagon(h3Index, existingData);
        scoringLevel = conditionalScore ? this.opportunityMode.scoringLevel : 'BASIC';
      }
      
      const computationTime = Date.now() - startTime;
      
      // Create enhanced opportunity score
      const enhancedScore: EnhancedH3OpportunityScore = {
        ...baseOpportunity,
        conditionalScore,
        scoringLevel,
        computationTime,
        lastScored: new Date(),
        overallConfidence: this.calculateOverallConfidence(baseOpportunity, conditionalScore),
        dataQuality: this.assessDataQuality(baseOpportunity, conditionalScore),
        investmentRecommendation: this.determineInvestmentRecommendation(baseOpportunity, conditionalScore),
        riskAdjustedScore: this.calculateRiskAdjustedScore(baseOpportunity, conditionalScore),
        opportunityType: this.classifyOpportunityType(baseOpportunity, conditionalScore),
        priorityRanking: 0 // Will be set during batch ranking
      };
      
      // Cache the result
      this.setSpatialCacheEntry(h3Index, enhancedScore);
      
      // Update metrics
      this.updateMetrics('success', computationTime);
      
      return enhancedScore;
      
    } catch (error) {
      console.error(`Error scoring hexagon ${h3Index}:`, error);
      this.updateMetrics('error', Date.now() - startTime);
      return null;
    }
  }
  
  /**
   * Score multiple hexagons in batch with optimized performance
   */
  async scoreHexagonBatch(
    hexagons: Array<{ h3Index: string; data?: Partial<H3HexagonOpportunity> }>,
    progressCallback?: (progress: number, total: number) => void
  ): Promise<EnhancedH3OpportunityScore[]> {
    if (!this.opportunityMode.enabled) {
      return [];
    }
    
    console.log(`📊 Starting batch scoring of ${hexagons.length} hexagons...`);
    const startTime = Date.now();
    
    const results: EnhancedH3OpportunityScore[] = [];
    const batchSize = this.opportunityMode.batchSize;
    
    // Filter hexagons that need scoring (not in cache or cache expired)
    const hexagonsToScore = hexagons.filter(hex => {
      const cached = this.getSpatialCacheEntry(hex.h3Index);
      return !cached || !this.isCacheValid(cached);
    });
    
    console.log(`🎯 ${hexagonsToScore.length} hexagons need scoring (${hexagons.length - hexagonsToScore.length} from cache)`);
    
    // Process in batches
    for (let i = 0; i < hexagonsToScore.length; i += batchSize) {
      const batch = hexagonsToScore.slice(i, i + batchSize);
      
      // Parallel processing within batch
      const batchPromises = batch.map(hex => this.scoreHexagon(hex.h3Index, hex.data));
      const batchResults = await Promise.all(batchPromises);
      
      // Add successful results
      for (const result of batchResults) {
        if (result) {
          results.push(result);
        }
      }
      
      // Progress callback
      if (progressCallback) {
        const progress = Math.min(i + batchSize, hexagonsToScore.length);
        progressCallback(progress, hexagonsToScore.length);
      }
      
      // Brief pause to prevent overwhelming the system
      if (i + batchSize < hexagonsToScore.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Add cached results
    for (const hex of hexagons) {
      if (!hexagonsToScore.some(h => h.h3Index === hex.h3Index)) {
        const cached = this.getSpatialCacheEntry(hex.h3Index);
        if (cached) {
          results.push(cached);
        }
      }
    }
    
    // Rank results by priority
    const rankedResults = this.rankOpportunities(results);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Batch scoring completed: ${results.length} hexagons in ${totalTime}ms`);
    console.log(`📈 Performance: ${(results.length / (totalTime / 1000)).toFixed(1)} hexagons/second`);
    
    this.performanceMetrics.throughput = results.length / (totalTime / 1000);
    
    return rankedResults;
  }
  
  /**
   * Get top opportunities within a geographic region
   */
  async getTopOpportunities(
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    limit: number = 50,
    minScore?: number
  ): Promise<EnhancedH3OpportunityScore[]> {
    if (!this.opportunityMode.enabled) {
      return [];
    }
    
    // Generate H3 hexagons in the region
    const resolution = 6; // Good balance of precision and performance
    const hexagons: Array<{ h3Index: string }> = [];
    
    // Generate hex grid around center point
    const latStep = 0.1; // Approximate step for resolution 6
    const lonStep = 0.1;
    const latRange = radiusKm / 111; // Rough conversion km to degrees
    const lonRange = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));
    
    for (let lat = centerLat - latRange; lat <= centerLat + latRange; lat += latStep) {
      for (let lon = centerLon - lonRange; lon <= centerLon + lonRange; lon += lonStep) {
        // Check if point is within radius
        const distance = this.calculateDistance(centerLat, centerLon, lat, lon);
        if (distance <= radiusKm) {
          const h3Index = latLngToCell(lat, lon, resolution);
          hexagons.push({ h3Index });
        }
      }
    }
    
    console.log(`🎯 Analyzing ${hexagons.length} hexagons within ${radiusKm}km of [${centerLat}, ${centerLon}]`);
    
    // Score the hexagons
    const scoredHexagons = await this.scoreHexagonBatch(hexagons);
    
    // Filter and sort
    let filteredHexagons = scoredHexagons;
    if (minScore !== undefined) {
      filteredHexagons = scoredHexagons.filter(hex => hex.overallScore >= minScore);
    }
    
    return filteredHexagons
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }
  
  /**
   * Clear spatial cache
   */
  clearCache(): void {
    this.spatialIndex.clear();
    this.scoringQueue.clear();
    console.log('🧹 Spatial cache cleared');
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): ScoringPerformanceMetrics {
    this.performanceMetrics.memoryUsage = this.calculateMemoryUsage();
    this.performanceMetrics.lastUpdate = new Date();
    return { ...this.performanceMetrics };
  }
  
  /**
   * Get opportunity mode configuration
   */
  getOpportunityModeConfig(): OpportunityModeConfig {
    return { ...this.opportunityMode };
  }
  
  // Private helper methods
  
  private createBaseOpportunity(
    h3Index: string,
    lat: number,
    lon: number,
    resolution: number,
    boundary: Array<[number, number]>,
    areaKm2: number
  ): H3HexagonOpportunity {
    // Create a basic opportunity object for scoring
    return {
      hexagon: h3Index,
      h3Index,
      resolution,
      centerLat: lat,
      centerLon: lon,
      coordinates: [lon, lat],
      boundary,
      areaKm2,
      landCoverage: 85, // Default assumption
      isCoastal: false, // Will be determined by analysis
      terrainSuitability: 70,
      overallScore: 50, // Placeholder
      score: 50,
      marketScore: 50,
      competitionScore: 50,
      weatherScore: 70,
      coverageScore: 60,
      accessibilityScore: 60,
      nearestCompetitor: { station: null, distanceKm: 1000 },
      competitorCount5km: 0,
      competitorCount25km: 0,
      competitorCount100km: 0,
      country: null,
      region: lat > 23.5 ? 'Northern' : lat < -23.5 ? 'Southern' : 'Equatorial',
      populationDensityCategory: 'rural',
      estimatedInvestment: 5000000,
      projectedAnnualRevenue: 2000000,
      revenue: 2000000,
      estimatedROI: 25,
      paybackYears: 4,
      riskLevel: 'medium',
      riskFactors: [],
      specialFactors: [],
      buildingComplexity: 'medium',
      regulatoryComplexity: 'medium'
    };
  }
  
  private shouldEnhanceScoring(opportunity: H3HexagonOpportunity): boolean {
    // Only enhance scoring for promising locations
    if (!this.opportunityMode.progressiveEnhancement) {
      return true; // Always enhance if not using progressive enhancement
    }
    
    // Basic filtering criteria
    if (opportunity.landCoverage < 50) return false; // Not suitable for ground stations
    if (opportunity.overallScore < this.opportunityMode.priorityThreshold) return false;
    
    return true;
  }
  
  private calculateOverallConfidence(
    base: H3HexagonOpportunity,
    conditional?: ConditionalOpportunityScore
  ): number {
    if (conditional?.validation) {
      return conditional.validation.confidence;
    }
    
    // Basic confidence calculation
    return Math.max(0.6, 0.9 - (base.riskLevel === 'high' ? 0.2 : 0.1));
  }
  
  private assessDataQuality(
    base: H3HexagonOpportunity,
    conditional?: ConditionalOpportunityScore
  ): number {
    if (conditional) {
      // Calculate based on completeness of analysis
      let quality = 0.7; // Base quality
      
      if (conditional.analysis.proximityAnalysis.nearbyStations.length > 0) quality += 0.1;
      if (conditional.analysis.competitiveAnalysis.dominantCompetitors.length > 0) quality += 0.1;
      if (conditional.analysis.marketAnalysis.demographicFactors.populationDensity > 0) quality += 0.1;
      
      return Math.min(1.0, quality);
    }
    
    return 0.6; // Basic data quality
  }
  
  private determineInvestmentRecommendation(
    base: H3HexagonOpportunity,
    conditional?: ConditionalOpportunityScore
  ): 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'AVOID' {
    const score = conditional?.overallScore.value || base.overallScore;
    
    if (score >= 85) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'MODERATE';
    if (score >= 40) return 'POOR';
    return 'AVOID';
  }
  
  private calculateRiskAdjustedScore(
    base: H3HexagonOpportunity,
    conditional?: ConditionalOpportunityScore
  ): number {
    const baseScore = conditional?.overallScore.value || base.overallScore;
    
    if (conditional?.riskAssessmentScore) {
      // Use sophisticated risk adjustment
      const riskFactor = conditional.riskAssessmentScore.value / 100;
      return Math.round(baseScore * riskFactor);
    }
    
    // Simple risk adjustment
    const riskMultiplier = {
      'low': 1.0,
      'medium': 0.9,
      'high': 0.8,
      'very_high': 0.6
    }[base.riskLevel] || 0.9;
    
    return Math.round(baseScore * riskMultiplier);
  }
  
  private classifyOpportunityType(
    base: H3HexagonOpportunity,
    conditional?: ConditionalOpportunityScore
  ): 'EXPANSION' | 'GROWTH' | 'OPTIMIZATION' | 'DEFENSIVE' | 'EXPLORATION' {
    if (conditional) {
      return conditional.opportunityClassification;
    }
    
    const score = base.overallScore;
    if (score >= 80) return 'EXPANSION';
    if (score >= 65) return 'GROWTH';
    if (score >= 50) return 'OPTIMIZATION';
    if (score >= 35) return 'DEFENSIVE';
    return 'EXPLORATION';
  }
  
  private rankOpportunities(opportunities: EnhancedH3OpportunityScore[]): EnhancedH3OpportunityScore[] {
    return opportunities
      .sort((a, b) => {
        // Primary sort by overall score
        if (b.overallScore !== a.overallScore) {
          return b.overallScore - a.overallScore;
        }
        
        // Secondary sort by confidence
        if (b.overallConfidence !== a.overallConfidence) {
          return b.overallConfidence - a.overallConfidence;
        }
        
        // Tertiary sort by risk-adjusted score
        return b.riskAdjustedScore - a.riskAdjustedScore;
      })
      .map((opportunity, index) => ({
        ...opportunity,
        priorityRanking: index + 1
      }));
  }
  
  private getSpatialCacheEntry(h3Index: string): EnhancedH3OpportunityScore | undefined {
    return this.spatialIndex.get(h3Index);
  }
  
  private setSpatialCacheEntry(h3Index: string, score: EnhancedH3OpportunityScore): void {
    // Implement LRU cache if needed
    if (this.spatialIndex.size > this.opportunityMode.maxHexagons) {
      // Remove oldest entries
      const entries = Array.from(this.spatialIndex.entries());
      entries.sort((a, b) => a[1].lastScored.getTime() - b[1].lastScored.getTime());
      
      for (let i = 0; i < Math.floor(this.opportunityMode.maxHexagons * 0.1); i++) {
        this.spatialIndex.delete(entries[i][0]);
      }
    }
    
    this.spatialIndex.set(h3Index, score);
  }
  
  private isCacheValid(entry: EnhancedH3OpportunityScore): boolean {
    const ageMinutes = (Date.now() - entry.lastScored.getTime()) / (1000 * 60);
    return ageMinutes < this.opportunityMode.cacheDuration;
  }
  
  private updateMetrics(type: 'success' | 'error' | 'cache_hit', computationTime: number): void {
    this.performanceMetrics.totalHexagonsScored++;
    
    if (type === 'success') {
      // Update average computation time
      const total = this.performanceMetrics.totalHexagonsScored;
      this.performanceMetrics.averageComputationTime = 
        (this.performanceMetrics.averageComputationTime * (total - 1) + computationTime) / total;
    } else if (type === 'error') {
      this.performanceMetrics.errorRate = 
        (this.performanceMetrics.errorRate * (this.performanceMetrics.totalHexagonsScored - 1) + 1) / 
        this.performanceMetrics.totalHexagonsScored;
    } else if (type === 'cache_hit') {
      const total = this.performanceMetrics.totalHexagonsScored;
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (total - 1) + 1) / total;
    }
  }
  
  private calculateMemoryUsage(): number {
    // Rough memory calculation
    const avgEntrySize = 2000; // bytes per entry (rough estimate)
    return (this.spatialIndex.size * avgEntrySize) / (1024 * 1024); // MB
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Export singleton instance
export const h3OpportunityIntegration = new H3OpportunityIntegration();