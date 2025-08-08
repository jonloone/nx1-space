/**
 * Advanced Competitive Landscape Analysis and Threat Modeling
 * 
 * This module provides sophisticated analysis of competitive threats in satellite ground station markets:
 * - Multi-dimensional threat modeling with competitive intelligence
 * - Market share analysis and positioning assessment
 * - Technology disruption risk evaluation
 * - Competitive gap identification and opportunity mapping
 * - Strategic response recommendation engine
 * - Real-time competitive monitoring and alerting
 */

import { ALL_COMPETITOR_STATIONS, CompetitorStation, analyzeCompetitorLandscape } from '@/lib/data/competitorStations';
import { PrecomputedStationScore, ALL_PRECOMPUTED_SCORES } from '@/lib/data/precomputed-opportunity-scores';
import { CompetitiveAnalysisResult } from './conditional-opportunity-scorer';

export interface ThreatModel {
  overallThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatScore: number; // 0-100, higher = more threatening
  threats: {
    immediate: ThreatAssessment[];
    emerging: ThreatAssessment[];
    strategic: ThreatAssessment[];
  };
  marketDynamics: {
    concentration: number; // Market concentration ratio
    competitiveIntensity: number; // Porter's five forces score
    barrierHeight: number; // Entry barrier assessment
    substituteThreat: number; // Substitution risk
  };
}

export interface ThreatAssessment {
  source: string;
  type: 'DIRECT' | 'INDIRECT' | 'DISRUPTIVE' | 'SUBSTITUTE';
  severity: number; // 0-100
  probability: number; // 0-100
  timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  description: string;
  impactAreas: string[];
  mitigationStrategies: string[];
  earlyWarningSignals: string[];
}

export interface MarketPosition {
  currentPosition: 'LEADER' | 'CHALLENGER' | 'FOLLOWER' | 'NICHE';
  marketShare: number; // Estimated percentage
  shareOfVoice: number; // Brand/marketing presence
  customerLoyalty: number; // 0-100
  pricePosition: 'PREMIUM' | 'COMPETITIVE' | 'VALUE' | 'LOW_COST';
  serviceQuality: number; // 0-100
  innovationIndex: number; // 0-100
}

export interface CompetitiveGap {
  gapType: 'TECHNOLOGY' | 'COVERAGE' | 'PRICING' | 'SERVICE' | 'MARKET_ACCESS' | 'BRAND';
  severity: 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'CRITICAL';
  description: string;
  competitorAdvantage: string[];
  marketImpact: number; // Revenue impact in $
  closingDifficulty: number; // 0-100, higher = harder to close
  strategicImportance: number; // 0-100
  timeToClose: number; // Months
  investmentRequired: number; // $
  successProbability: number; // 0-100
}

export interface CompetitiveDynamics {
  rivalryIntensity: number; // 0-100
  threatOfNewEntrants: number; // 0-100
  bargainingPowerOfSuppliers: number; // 0-100
  bargainingPowerOfBuyers: number; // 0-100
  threatOfSubstitutes: number; // 0-100
  portersFiveForces: number; // Composite score
}

export interface StrategicRecommendation {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'DEFEND' | 'ATTACK' | 'PARTNER' | 'DIFFERENTIATE' | 'EXIT';
  action: string;
  rationale: string;
  expectedOutcome: string;
  resourceRequirement: string;
  timeline: string;
  successMetrics: string[];
  riskFactors: string[];
}

/**
 * Advanced Competitive Analysis Engine
 */
export class CompetitiveAnalyzer {
  private competitorDatabase: CompetitorStation[] = [];
  private benchmarkStations: PrecomputedStationScore[] = [];
  private threatModelCache: Map<string, ThreatModel> = new Map();
  
  constructor() {
    this.competitorDatabase = ALL_COMPETITOR_STATIONS;
    this.benchmarkStations = ALL_PRECOMPUTED_SCORES;
  }
  
  /**
   * Perform comprehensive competitive analysis for a location
   */
  async analyzeCompetitiveLandscape(
    lat: number,
    lon: number,
    analysisRadius: number = 1000
  ): Promise<CompetitiveAnalysisResult> {
    // Identify local competitors
    const localCompetitors = this.identifyLocalCompetitors(lat, lon, analysisRadius);
    
    // Assess competitive density
    const competitorDensity = this.calculateCompetitorDensity(localCompetitors, analysisRadius);
    
    // Perform threat modeling
    const threatModel = await this.buildThreatModel(lat, lon, localCompetitors);
    
    // Analyze market positioning
    const marketPosition = this.analyzeMarketPosition(lat, lon, localCompetitors);
    
    // Identify competitive gaps
    const competitiveGaps = this.identifyCompetitiveGaps(localCompetitors, marketPosition);
    
    // Assess market saturation
    const marketSaturation = this.assessMarketSaturation(lat, lon, localCompetitors);
    
    // Determine overall threat level
    const threatLevel = this.determineThreatLevel(threatModel, competitorDensity, marketSaturation);
    
    // Identify dominant competitors
    const dominantCompetitors = this.identifyDominantCompetitors(localCompetitors, lat, lon);
    
    return {
      competitorDensity,
      threatLevel,
      dominantCompetitors,
      competitiveGaps,
      marketSaturation
    };
  }
  
  /**
   * Build comprehensive threat model
   */
  private async buildThreatModel(
    lat: number,
    lon: number,
    localCompetitors: CompetitorStation[]
  ): Promise<ThreatModel> {
    const cacheKey = `${Math.round(lat * 10)},${Math.round(lon * 10)}`;
    const cached = this.threatModelCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Assess immediate threats
    const immediateThreats = await this.assessImmediateThreats(localCompetitors, lat, lon);
    
    // Identify emerging threats
    const emergingThreats = await this.identifyEmergingThreats(lat, lon);
    
    // Analyze strategic threats
    const strategicThreats = await this.analyzeStrategicThreats(lat, lon);
    
    // Calculate market dynamics
    const marketDynamics = this.calculateMarketDynamics(localCompetitors, lat, lon);
    
    // Overall threat scoring
    const threatScore = this.calculateOverallThreatScore({
      immediate: immediateThreats,
      emerging: emergingThreats,
      strategic: strategicThreats
    }, marketDynamics);
    
    const overallThreatLevel = this.categorizeThreatLevel(threatScore);
    
    const threatModel: ThreatModel = {
      overallThreatLevel,
      threatScore,
      threats: {
        immediate: immediateThreats,
        emerging: emergingThreats,
        strategic: strategicThreats
      },
      marketDynamics
    };
    
    this.threatModelCache.set(cacheKey, threatModel);
    return threatModel;
  }
  
  /**
   * Assess immediate competitive threats
   */
  private async assessImmediateThreats(
    competitors: CompetitorStation[],
    lat: number,
    lon: number
  ): Promise<ThreatAssessment[]> {
    const threats: ThreatAssessment[] = [];
    
    // Direct competition from existing stations
    const directCompetitors = competitors.filter(c => 
      this.calculateDistance(lat, lon, c.coordinates[0], c.coordinates[1]) < 100
    );
    
    for (const competitor of directCompetitors) {
      const distance = this.calculateDistance(lat, lon, competitor.coordinates[0], competitor.coordinates[1]);
      const threatSeverity = Math.max(0, 100 - distance); // Closer = more threatening
      
      threats.push({
        source: `${competitor.operator} - ${competitor.stationName}`,
        type: 'DIRECT',
        severity: threatSeverity,
        probability: 90, // Existing stations are definite threats
        timeframe: 'IMMEDIATE',
        description: `Established competitor within ${Math.round(distance)}km`,
        impactAreas: ['Market share', 'Pricing pressure', 'Customer acquisition'],
        mitigationStrategies: [
          'Service differentiation',
          'Premium positioning',
          'Niche market focus'
        ],
        earlyWarningSignals: [
          'Capacity expansion announcements',
          'Price changes',
          'New service launches'
        ]
      });
    }
    
    // AWS Ground Station threat
    const awsStations = competitors.filter(c => c.operator === 'AWS Ground Station');
    if (awsStations.length > 0) {
      const nearestAws = awsStations.reduce((nearest, station) => {
        const distance = this.calculateDistance(lat, lon, station.coordinates[0], station.coordinates[1]);
        return distance < nearest.distance ? { station, distance } : nearest;
      }, { station: awsStations[0], distance: Infinity });
      
      if (nearestAws.distance < 2000) { // Within 2000km
        threats.push({
          source: 'AWS Ground Station',
          type: 'DISRUPTIVE',
          severity: 85,
          probability: 95,
          timeframe: 'IMMEDIATE',
          description: 'Cloud-native ground station services with pay-as-you-go pricing',
          impactAreas: [
            'Traditional pricing models',
            'Customer acquisition',
            'Service integration expectations'
          ],
          mitigationStrategies: [
            'Develop cloud integration capabilities',
            'Offer hybrid solutions',
            'Focus on specialized services'
          ],
          earlyWarningSignals: [
            'New AWS regions opening',
            'Service price reductions',
            'Partnership announcements'
          ]
        });
      }
    }
    
    // LEO constellation threat (Starlink, etc.)
    const leoCompetitors = competitors.filter(c => 
      c.operator === 'SpaceX Starlink' || 
      c.operator === 'OneWeb' || 
      c.operator === 'Amazon Kuiper'
    );
    
    if (leoCompetitors.length > 0) {
      threats.push({
        source: 'LEO Constellations',
        type: 'DISRUPTIVE',
        severity: 70,
        probability: 80,
        timeframe: 'SHORT_TERM',
        description: 'Low-latency LEO satellite services disrupting traditional GEO services',
        impactAreas: ['Latency-sensitive applications', 'Enterprise services', 'Government contracts'],
        mitigationStrategies: [
          'Emphasize GEO advantages (coverage, stability)',
          'Develop LEO integration capabilities',
          'Focus on broadcast and high-throughput applications'
        ],
        earlyWarningSignals: [
          'LEO constellation launch schedules',
          'Ground station deployment announcements',
          'Service pricing announcements'
        ]
      });
    }
    
    return threats;
  }
  
  /**
   * Identify emerging competitive threats
   */
  private async identifyEmergingThreats(lat: number, lon: number): Promise<ThreatAssessment[]> {
    const threats: ThreatAssessment[] = [];
    
    // 5G terrestrial networks
    threats.push({
      source: '5G Terrestrial Networks',
      type: 'SUBSTITUTE',
      severity: 60,
      probability: 85,
      timeframe: 'MEDIUM_TERM',
      description: 'Ultra-fast terrestrial networks reducing satellite communication needs',
      impactAreas: ['Urban markets', 'Enterprise connectivity', 'IoT applications'],
      mitigationStrategies: [
        'Focus on remote/rural markets',
        'Develop 5G backhaul services',
        'Emphasize global coverage advantages'
      ],
      earlyWarningSignals: [
        '5G infrastructure deployment',
        'Fiber network expansion',
        'Edge computing rollouts'
      ]
    });
    
    // New satellite constellations
    threats.push({
      source: 'Next-Gen Satellite Constellations',
      type: 'DISRUPTIVE',
      severity: 55,
      probability: 70,
      timeframe: 'LONG_TERM',
      description: 'Advanced satellite technologies with improved capabilities',
      impactAreas: ['Technology leadership', 'Service quality', 'Cost structure'],
      mitigationStrategies: [
        'Technology partnership strategies',
        'Continuous innovation investment',
        'Service differentiation'
      ],
      earlyWarningSignals: [
        'New constellation announcements',
        'Technology patent filings',
        'Launch schedule updates'
      ]
    });
    
    // Software-defined satellites
    threats.push({
      source: 'Software-Defined Satellites',
      type: 'DISRUPTIVE',
      severity: 50,
      probability: 75,
      timeframe: 'LONG_TERM',
      description: 'Flexible, reconfigurable satellites changing ground station requirements',
      impactAreas: ['Infrastructure investments', 'Service flexibility', 'Operational model'],
      mitigationStrategies: [
        'Invest in software-defined ground systems',
        'Develop flexible service platforms',
        'Partner with satellite operators'
      ],
      earlyWarningSignals: [
        'Software-defined satellite launches',
        'Ground system technology updates',
        'Industry partnership announcements'
      ]
    });
    
    return threats;
  }
  
  /**
   * Analyze strategic level threats
   */
  private async analyzeStrategicThreats(lat: number, lon: number): Promise<ThreatAssessment[]> {
    const threats: ThreatAssessment[] = [];
    
    // Vertical integration by satellite operators
    threats.push({
      source: 'Satellite Operator Integration',
      type: 'STRATEGIC',
      severity: 45,
      probability: 60,
      timeframe: 'LONG_TERM',
      description: 'Satellite operators building their own ground station networks',
      impactAreas: ['Customer relationships', 'Service contracts', 'Market access'],
      mitigationStrategies: [
        'Become preferred partner',
        'Offer specialized services',
        'Build unique capabilities'
      ],
      earlyWarningSignals: [
        'Ground station acquisition announcements',
        'Vertical integration strategies',
        'Direct customer marketing'
      ]
    });
    
    // Regulatory changes
    threats.push({
      source: 'Regulatory Disruption',
      type: 'STRATEGIC',
      severity: 40,
      probability: 50,
      timeframe: 'MEDIUM_TERM',
      description: 'Changes in frequency allocation, licensing, or international regulations',
      impactAreas: ['Operating licenses', 'Frequency access', 'International operations'],
      mitigationStrategies: [
        'Active regulatory engagement',
        'Compliance excellence',
        'Geographic diversification'
      ],
      earlyWarningSignals: [
        'ITU policy discussions',
        'National frequency reallocation',
        'International treaty changes'
      ]
    });
    
    return threats;
  }
  
  /**
   * Calculate market dynamics using Porter's Five Forces
   */
  private calculateMarketDynamics(
    competitors: CompetitorStation[],
    lat: number,
    lon: number
  ): ThreatModel['marketDynamics'] {
    // Market concentration (HHI approximation)
    const marketShares = this.estimateMarketShares(competitors, lat, lon);
    const concentration = marketShares.reduce((hhi, share) => hhi + Math.pow(share, 2), 0);
    
    // Competitive intensity based on competitor density
    const competitiveIntensity = Math.min(100, competitors.length * 10);
    
    // Entry barriers assessment
    const barrierHeight = this.assessEntryBarriers(lat, lon);
    
    // Substitute threat level
    const substituteThreat = this.assessSubstituteThreat(lat, lon);
    
    return {
      concentration,
      competitiveIntensity,
      barrierHeight,
      substituteThreat
    };
  }
  
  /**
   * Identify local competitors within radius
   */
  private identifyLocalCompetitors(
    lat: number,
    lon: number,
    radius: number
  ): CompetitorStation[] {
    return this.competitorDatabase.filter(competitor => {
      const distance = this.calculateDistance(
        lat,
        lon,
        competitor.coordinates[0],
        competitor.coordinates[1]
      );
      return distance <= radius;
    });
  }
  
  /**
   * Calculate competitor density score
   */
  private calculateCompetitorDensity(
    competitors: CompetitorStation[],
    radius: number
  ): number {
    // Area-adjusted competitor density
    const area = Math.PI * Math.pow(radius, 2); // km²
    const density = competitors.length / (area / 1000000); // competitors per 1M km²
    
    // Scale to 0-100
    return Math.min(100, density * 10);
  }
  
  /**
   * Determine overall threat level
   */
  private determineThreatLevel(
    threatModel: ThreatModel,
    competitorDensity: number,
    marketSaturation: any
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const combinedScore = (
      threatModel.threatScore * 0.5 +
      competitorDensity * 0.3 +
      marketSaturation.level * 0.2
    );
    
    if (combinedScore >= 80) return 'CRITICAL';
    if (combinedScore >= 65) return 'HIGH';
    if (combinedScore >= 40) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Identify dominant competitors
   */
  private identifyDominantCompetitors(
    competitors: CompetitorStation[],
    lat: number,
    lon: number
  ): Array<{
    competitor: CompetitorStation;
    threatScore: number;
    marketOverlap: number;
  }> {
    return competitors
      .map(competitor => {
        const distance = this.calculateDistance(
          lat,
          lon,
          competitor.coordinates[0],
          competitor.coordinates[1]
        );
        
        // Threat scoring based on distance, capability, and market position
        let threatScore = Math.max(0, 100 - distance / 10); // Distance factor
        
        // Operator-specific adjustments
        if (competitor.operator === 'AWS Ground Station') threatScore += 20;
        if (competitor.operator === 'SpaceX Starlink') threatScore += 15;
        if (competitor.marketPosition?.threatLevel === 'Critical') threatScore += 10;
        
        const marketOverlap = this.calculateMarketOverlap(competitor, lat, lon);
        
        return {
          competitor,
          threatScore: Math.min(100, threatScore),
          marketOverlap
        };
      })
      .filter(item => item.threatScore > 30)
      .sort((a, b) => b.threatScore - a.threatScore)
      .slice(0, 5); // Top 5 threats
  }
  
  /**
   * Identify competitive gaps and opportunities
   */
  private identifyCompetitiveGaps(
    competitors: CompetitorStation[],
    marketPosition: any
  ): CompetitiveGap[] {
    const gaps: CompetitiveGap[] = [];
    
    // Technology gap analysis
    const awsPresent = competitors.some(c => c.operator === 'AWS Ground Station');
    if (!awsPresent) {
      gaps.push({
        gapType: 'TECHNOLOGY',
        severity: 'SIGNIFICANT',
        description: 'No cloud-native ground station services in market',
        competitorAdvantage: ['Pay-as-you-go pricing', 'API integration', 'Scalability'],
        marketImpact: 2000000,
        closingDifficulty: 75,
        strategicImportance: 85,
        timeToClose: 18,
        investmentRequired: 15000000,
        successProbability: 70
      });
    }
    
    // Coverage gap analysis
    const polarCompetitors = competitors.filter(c => 
      Math.abs(c.coordinates[0]) > 60
    );
    if (polarCompetitors.length === 0) {
      gaps.push({
        gapType: 'COVERAGE',
        severity: 'MODERATE',
        description: 'Limited polar/high-latitude coverage',
        competitorAdvantage: ['Specialized satellite tracking', 'Polar orbit access'],
        marketImpact: 800000,
        closingDifficulty: 60,
        strategicImportance: 65,
        timeToClose: 12,
        investmentRequired: 5000000,
        successProbability: 80
      });
    }
    
    // Service gap analysis
    const mobilityServices = competitors.filter(c => 
      c.services?.includes('Mobility') || c.services?.includes('Maritime')
    );
    if (mobilityServices.length < 2) {
      gaps.push({
        gapType: 'SERVICE',
        severity: 'MODERATE',
        description: 'Limited maritime/mobility service specialization',
        competitorAdvantage: ['Specialized terminals', 'Maritime expertise'],
        marketImpact: 1200000,
        closingDifficulty: 50,
        strategicImportance: 70,
        timeToClose: 15,
        investmentRequired: 8000000,
        successProbability: 75
      });
    }
    
    return gaps;
  }
  
  /**
   * Assess market saturation level
   */
  private assessMarketSaturation(
    lat: number,
    lon: number,
    competitors: CompetitorStation[]
  ): {
    level: number;
    entryBarriers: string[];
    differentiationOpportunity: number;
  } {
    const population = this.estimatePopulation(lat, lon);
    const economicActivity = this.estimateEconomicActivity(lat, lon);
    const competitorCount = competitors.length;
    
    // Rough saturation calculation
    const marketCapacity = (population / 1000000) * economicActivity / 10;
    const saturationLevel = Math.min(100, (competitorCount / marketCapacity) * 100);
    
    const entryBarriers = [];
    if (saturationLevel > 70) entryBarriers.push('High competition');
    if (competitors.some(c => c.operator === 'AWS Ground Station')) {
      entryBarriers.push('Cloud disruption');
    }
    if (competitors.length > 5) entryBarriers.push('Established players');
    
    const differentiationOpportunity = Math.max(0, 100 - saturationLevel);
    
    return {
      level: saturationLevel,
      entryBarriers,
      differentiationOpportunity
    };
  }
  
  // Helper methods
  
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
  
  private calculateOverallThreatScore(
    threats: {
      immediate: ThreatAssessment[];
      emerging: ThreatAssessment[];
      strategic: ThreatAssessment[];
    },
    marketDynamics: ThreatModel['marketDynamics']
  ): number {
    const immediateScore = this.calculateThreatCategoryScore(threats.immediate);
    const emergingScore = this.calculateThreatCategoryScore(threats.emerging);
    const strategicScore = this.calculateThreatCategoryScore(threats.strategic);
    
    const threatScore = (
      immediateScore * 0.5 +
      emergingScore * 0.3 +
      strategicScore * 0.2
    );
    
    const marketScore = (
      marketDynamics.concentration * 0.25 +
      marketDynamics.competitiveIntensity * 0.35 +
      (100 - marketDynamics.barrierHeight) * 0.2 +
      marketDynamics.substituteThreat * 0.2
    );
    
    return Math.round((threatScore + marketScore) / 2);
  }
  
  private calculateThreatCategoryScore(threats: ThreatAssessment[]): number {
    if (threats.length === 0) return 0;
    
    return threats.reduce((total, threat) => {
      return total + (threat.severity * threat.probability / 100);
    }, 0) / threats.length;
  }
  
  private categorizeThreatLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    return 'LOW';
  }
  
  private estimateMarketShares(
    competitors: CompetitorStation[],
    lat: number,
    lon: number
  ): number[] {
    // Simplified market share estimation
    const totalCompetitors = competitors.length;
    if (totalCompetitors === 0) return [];
    
    const baseShare = 100 / totalCompetitors;
    return competitors.map((competitor, index) => {
      // Adjust based on operator size/influence
      let adjustment = 1;
      if (competitor.operator === 'AWS Ground Station') adjustment = 1.5;
      if (competitor.operator === 'SpaceX Starlink') adjustment = 1.3;
      if (competitor.operator === 'SES' || competitor.operator === 'Intelsat') adjustment = 1.2;
      
      return baseShare * adjustment;
    });
  }
  
  private assessEntryBarriers(lat: number, lon: number): number {
    let barriers = 30; // Base barrier level
    
    // Regulatory barriers
    const country = this.estimateCountry(lat, lon);
    const regulatoryComplexity = this.getRegulationComplexity(country);
    barriers += regulatoryComplexity * 20;
    
    // Capital requirements
    barriers += 25; // High capital requirements for ground stations
    
    // Technology barriers
    barriers += 15; // Technical expertise required
    
    return Math.min(100, barriers);
  }
  
  private assessSubstituteThreat(lat: number, lon: number): number {
    let threat = 20; // Base substitute threat
    
    // Fiber availability (urban areas)
    const populationDensity = this.estimatePopulationDensity(lat, lon);
    if (populationDensity > 1000) threat += 30; // High fiber threat in urban areas
    
    // 5G availability
    const economicDevelopment = this.estimateEconomicActivity(lat, lon);
    if (economicDevelopment > 0.7) threat += 20; // High 5G threat in developed areas
    
    // LEO constellation coverage
    threat += 15; // Growing LEO threat everywhere
    
    return Math.min(100, threat);
  }
  
  private analyzeMarketPosition(
    lat: number,
    lon: number,
    competitors: CompetitorStation[]
  ): any {
    // Simplified market position analysis
    return {
      competitorCount: competitors.length,
      marketLeader: competitors.length > 0 ? competitors[0].operator : null,
      marketMaturity: competitors.length > 3 ? 'mature' : 'developing'
    };
  }
  
  private calculateMarketOverlap(
    competitor: CompetitorStation,
    lat: number,
    lon: number
  ): number {
    const distance = this.calculateDistance(
      lat,
      lon,
      competitor.coordinates[0],
      competitor.coordinates[1]
    );
    
    // Market overlap based on distance (simplified)
    if (distance < 100) return 90; // High overlap
    if (distance < 500) return 60; // Medium overlap
    if (distance < 1000) return 30; // Low overlap
    return 10; // Minimal overlap
  }
  
  private estimatePopulation(lat: number, lon: number): number {
    // Simplified population estimation based on location
    const urbanCenters = [
      { lat: 40.7128, lon: -74.0060, pop: 8000000 }, // New York
      { lat: 51.5074, lon: -0.1278, pop: 9000000 },  // London
      { lat: 35.6762, lon: 139.6503, pop: 14000000 }, // Tokyo
    ];
    
    let nearestPop = 100000; // Default rural population
    let minDistance = Infinity;
    
    for (const center of urbanCenters) {
      const distance = this.calculateDistance(lat, lon, center.lat, center.lon);
      if (distance < minDistance) {
        minDistance = distance;
        // Population decreases with distance
        nearestPop = center.pop * Math.exp(-distance / 500);
      }
    }
    
    return nearestPop;
  }
  
  private estimateEconomicActivity(lat: number, lon: number): number {
    // Simplified economic activity index (0-1)
    const developedRegions = [
      { lat: 40, lon: -100, size: 50, activity: 0.9 }, // North America
      { lat: 52, lon: 10, size: 30, activity: 0.8 },  // Europe
      { lat: 35, lon: 135, size: 20, activity: 0.85 }  // Japan
    ];
    
    let activity = 0.3; // Base activity level
    
    for (const region of developedRegions) {
      const distance = this.calculateDistance(lat, lon, region.lat, region.lon);
      if (distance < region.size * 111) { // Degrees to km approximation
        activity = Math.max(activity, region.activity * Math.exp(-distance / (region.size * 111)));
      }
    }
    
    return activity;
  }
  
  private estimatePopulationDensity(lat: number, lon: number): number {
    // People per km²
    const population = this.estimatePopulation(lat, lon);
    const area = 1000; // Assume 1000 km² area
    return population / area;
  }
  
  private estimateCountry(lat: number, lon: number): string {
    // Simplified country estimation
    if (lat >= 25 && lat <= 49 && lon >= -125 && lon <= -66) return 'USA';
    if (lat >= 50 && lat <= 60 && lon >= -8 && lon <= 2) return 'UK';
    if (lat >= 47 && lat <= 55 && lon >= 6 && lon <= 15) return 'Germany';
    return 'Other';
  }
  
  private getRegulationComplexity(country: string): number {
    const complexity = {
      'USA': 0.7,
      'UK': 0.5,
      'Germany': 0.6,
      'China': 0.9,
      'Other': 0.6
    };
    return complexity[country as keyof typeof complexity] || 0.6;
  }
  
  /**
   * Generate strategic recommendations based on competitive analysis
   */
  async generateStrategicRecommendations(
    analysis: CompetitiveAnalysisResult,
    lat: number,
    lon: number
  ): Promise<StrategicRecommendation[]> {
    const recommendations: StrategicRecommendation[] = [];
    
    // High threat level recommendations
    if (analysis.threatLevel === 'CRITICAL' || analysis.threatLevel === 'HIGH') {
      recommendations.push({
        priority: 'URGENT',
        category: 'DEFEND',
        action: 'Implement defensive strategy with service differentiation',
        rationale: 'High competitive pressure requires immediate market defense',
        expectedOutcome: 'Maintain market position and customer base',
        resourceRequirement: 'High - significant investment in competitive response',
        timeline: '3-6 months',
        successMetrics: ['Market share retention', 'Customer churn reduction', 'Price stability'],
        riskFactors: ['Escalating competition', 'Price war risk', 'Resource strain']
      });
    }
    
    // Gap-based recommendations
    for (const gap of analysis.competitiveGaps) {
      if (gap.strategicImportance > 70) {
        recommendations.push({
          priority: gap.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
          category: 'ATTACK',
          action: `Close ${gap.gapType.toLowerCase()} gap: ${gap.description}`,
          rationale: `High strategic importance gap with ${gap.successProbability}% success probability`,
          expectedOutcome: `Gain competitive advantage in ${gap.gapType.toLowerCase()}`,
          resourceRequirement: `$${(gap.investmentRequired / 1000000).toFixed(1)}M investment`,
          timeline: `${gap.timeToClose} months`,
          successMetrics: [`${gap.gapType} capability deployment`, 'Market response measurement'],
          riskFactors: [`${100 - gap.successProbability}% failure risk`, 'Competitive response']
        });
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Get competitive analysis summary statistics
   */
  getAnalysisMetrics(): {
    totalCompetitors: number;
    threatModelsCached: number;
    averageThreatLevel: number;
    competitiveCoverage: number;
  } {
    const threatLevels = Array.from(this.threatModelCache.values())
      .map(model => model.threatScore);
    
    return {
      totalCompetitors: this.competitorDatabase.length,
      threatModelsCached: this.threatModelCache.size,
      averageThreatLevel: threatLevels.length > 0 ? 
        threatLevels.reduce((sum, level) => sum + level, 0) / threatLevels.length : 0,
      competitiveCoverage: Math.min(100, this.threatModelCache.size / 100) // Percentage of global coverage
    };
  }
}

// Export singleton instance
export const competitiveAnalyzer = new CompetitiveAnalyzer();