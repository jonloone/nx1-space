/**
 * Real-World Ground Station Opportunity Scorer
 * 
 * Integrates multi-agent analysis with real SES and Intelsat ground station data
 * Provides comprehensive opportunity scoring based on:
 * - Operational utilization patterns
 * - Financial performance metrics
 * - Market intelligence analysis
 * - Technical capability assessment
 * - Geographic and competitive positioning
 */

import { AgentCoordinator, WorkflowResult } from '@/lib/agents/coordinator';
import { GroundStationAnalytics } from '@/lib/types/ground-station';
import { 
  RealGroundStation, 
  SES_GROUND_STATIONS, 
  INTELSAT_GROUND_STATIONS,
  GroundStationEnrichmentService 
} from '@/lib/data/real-ground-stations';

// Import new integrated modules for enhanced scoring
import { calculateEnhancedBusinessMetrics } from '@/lib/business-intelligence';
import { industryValidator } from '@/lib/validation/industry-benchmarks';
import { antennaConstraints } from '@/lib/operational/antenna-constraints';
import { interferenceCalculator } from '@/lib/interference/interference-calculator';
import { servicePricingModel } from '@/lib/revenue/service-pricing-model';

export interface OpportunityScore {
  stationId: string;
  stationName: string;
  operator: 'SES' | 'Intelsat';
  location: {
    country: string;
    coordinates: [number, number];
  };
  
  // Core Scoring Components
  utilizationScore: number;      // 0-100: Current utilization efficiency
  profitabilityScore: number;    // 0-100: Financial performance
  marketOpportunityScore: number; // 0-100: Growth and expansion potential
  technicalCapabilityScore: number; // 0-100: Infrastructure quality
  
  // Composite Scores
  overallOpportunityScore: number; // 0-100: Weighted composite
  investmentPriority: 'critical' | 'high' | 'medium' | 'low';
  
  // Opportunity Categories
  opportunityTypes: {
    expansion: { score: number; reasoning: string };
    optimization: { score: number; reasoning: string };
    newMarkets: { score: number; reasoning: string };
    costReduction: { score: number; reasoning: string };
  };
  
  // Agent Analysis Results
  agentInsights: {
    domainExpertise: string[];    // Key operational insights
    dataScience: string[];        // Predictive and analytical insights
    marketIntelligence: string[]; // Market positioning insights
    technicalAssessment: string[]; // Infrastructure recommendations
  };
  
  // Risk Assessment
  riskFactors: {
    operational: string[];
    financial: string[];
    competitive: string[];
    regulatory: string[];
  };
  
  // Action Items
  recommendedActions: {
    immediate: string[];   // <3 months
    shortTerm: string[];   // 3-12 months
    longTerm: string[];    // 1-3 years
  };
  
  // Enhanced Methodology Compliance
  methodologyCompliance: {
    overallCompliance: number;        // 0-100: Compliance with methodology paper
    operationalConstraints: number;   // 0-100: Slew time, acquisition modeling
    revenueModeling: number;         // 0-100: Service-specific pricing
    interferenceAnalysis: number;     // 0-100: C/I ratio, ASI modeling
    validationFramework: number;     // 0-100: Industry benchmark compliance
  };
  
  // Enhanced Business Metrics
  enhancedMetrics: {
    operationalEfficiency: number;    // Actual vs theoretical capacity
    revenueOptimization: number;     // Service-specific vs base pricing
    interferenceImpact: number;      // Capacity lost to interference
    benchmarkCompliance: number;    // Industry standard compliance
  };
  
  // Confidence and Data Quality
  analysisConfidence: number; // 0-100: Overall confidence in analysis
  dataQuality: number;       // 0-100: Quality of underlying data
  validationScore: number;   // 0-100: Industry benchmark validation score
  lastUpdated: Date;
}

export interface OpportunityDashboard {
  totalStationsAnalyzed: number;
  averageOpportunityScore: number;
  
  // Performance Tiers
  highOpportunityStations: OpportunityScore[];   // >75 overall score
  mediumOpportunityStations: OpportunityScore[]; // 50-75 overall score
  lowOpportunityStations: OpportunityScore[];    // <50 overall score
  
  // Operator Comparison
  sesPerformance: {
    averageScore: number;
    topStations: OpportunityScore[];
    keyOpportunities: string[];
  };
  intelsatPerformance: {
    averageScore: number;
    topStations: OpportunityScore[];
    keyOpportunities: string[];
  };
  
  // Geographic Analysis
  regionalInsights: {
    region: string;
    stationCount: number;
    averageScore: number;
    topOpportunities: string[];
  }[];
  
  // Market Intelligence Summary
  marketTrends: {
    emergingMarkets: string[];
    saturatedMarkets: string[];
    competitiveThreats: string[];
    technologyOpportunities: string[];
  };
  
  // Investment Recommendations
  portfolioOptimization: {
    expandCapacity: OpportunityScore[];
    optimizeOperations: OpportunityScore[];
    enterNewMarkets: OpportunityScore[];
    divest: OpportunityScore[];
  };
}

export class RealWorldOpportunityScorer {
  private agentCoordinator: AgentCoordinator;
  private enrichmentService: GroundStationEnrichmentService;
  
  constructor() {
    this.agentCoordinator = new AgentCoordinator();
    this.enrichmentService = new GroundStationEnrichmentService();
  }

  /**
   * Analyze all real ground stations and generate opportunity scores
   */
  async analyzeAllStations(): Promise<OpportunityDashboard> {
    console.log('🚀 Starting comprehensive real-world ground station opportunity analysis');
    
    // Get all real ground stations
    const allRealStations = [...SES_GROUND_STATIONS, ...INTELSAT_GROUND_STATIONS];
    
    // Convert to analytics format and analyze
    const opportunityScores: OpportunityScore[] = [];
    
    for (const realStation of allRealStations) {
      try {
        const analyticsData = this.enrichmentService.enrichGroundStation(realStation);
        const opportunityScore = await this.scoreStation(analyticsData);
        opportunityScores.push(opportunityScore);
        
        console.log(`✅ Analyzed ${realStation.name} (${realStation.operator}): ${opportunityScore.overallOpportunityScore.toFixed(1)}/100`);
      } catch (error) {
        console.error(`❌ Error analyzing ${realStation.name}:`, error);
      }
    }
    
    // Generate comprehensive dashboard
    const dashboard = this.generateDashboard(opportunityScores);
    
    console.log(`📊 Analysis complete: ${dashboard.totalStationsAnalyzed} stations analyzed`);
    console.log(`🎯 Average opportunity score: ${dashboard.averageOpportunityScore.toFixed(1)}/100`);
    console.log(`🔥 High-opportunity stations: ${dashboard.highOpportunityStations.length}`);
    
    return dashboard;
  }

  /**
   * Analyze a specific ground station for opportunities
   */
  async analyzeStation(stationName: string): Promise<OpportunityScore | null> {
    const realStation = [...SES_GROUND_STATIONS, ...INTELSAT_GROUND_STATIONS]
      .find(station => station.name.toLowerCase() === stationName.toLowerCase());
    
    if (!realStation) {
      console.error(`Station "${stationName}" not found in real station database`);
      return null;
    }
    
    const analyticsData = this.enrichmentService.enrichGroundStation(realStation);
    return await this.scoreStation(analyticsData);
  }

  /**
   * Score a single ground station using enhanced methodology-compliant analysis
   */
  private async scoreStation(station: GroundStationAnalytics): Promise<OpportunityScore> {
    console.log(`🔍 Analyzing ${station.name} with enhanced methodology-compliant system...`);
    
    // Step 1: Calculate enhanced business metrics with operational constraints and interference
    const enhancedMetrics = calculateEnhancedBusinessMetrics(station);
    
    // Step 2: Validate against industry benchmarks
    const validationReport = industryValidator.validateStation({
      stationId: station.station_id,
      stationName: station.name,
      utilization: station.utilization_metrics.current_utilization,
      profitMargin: station.business_metrics.profit_margin,
      revenuePerGbps: station.business_metrics.revenue_per_gbps,
      slaCompliance: station.business_metrics.sla_compliance_rate,
      annualROI: station.roi_metrics.annual_roi_percentage,
      capacityEfficiency: station.capacity_metrics.capacity_efficiency,
      operationalCostRatio: (station.business_metrics.operational_cost_monthly / station.business_metrics.monthly_revenue) * 100,
      churnRate: station.business_metrics.churn_rate,
      interferenceImpact: enhancedMetrics.interferenceImpact.capacityReduction,
      slewTimeEfficiency: enhancedMetrics.operationalConstraints.utilizationEfficiency * 100
    });
    
    // Step 3: Execute multi-agent analysis (optional for additional insights)
    const workflowResult = await this.agentCoordinator.executeComprehensiveAnalysis(station);
    
    // Step 4: Calculate enhanced scoring components using integrated models
    const utilizationScore = this.calculateEnhancedUtilizationScore(station, enhancedMetrics);
    const profitabilityScore = this.calculateEnhancedProfitabilityScore(station, enhancedMetrics);
    const marketOpportunityScore = this.calculateMarketOpportunityScore(station, workflowResult);
    const technicalCapabilityScore = this.calculateTechnicalCapabilityScore(station, workflowResult);
    
    // Step 5: Calculate methodology compliance scores
    const methodologyCompliance = this.calculateMethodologyCompliance(station, enhancedMetrics, validationReport);
    
    // Step 6: Calculate composite score with methodology compliance weighting
    const overallOpportunityScore = this.calculateEnhancedOverallScore(
      utilizationScore,
      profitabilityScore,
      marketOpportunityScore,
      technicalCapabilityScore,
      methodologyCompliance.overallCompliance
    );
    
    // Determine investment priority
    const investmentPriority = this.determineInvestmentPriority(overallOpportunityScore);
    
    // Generate opportunity categories
    const opportunityTypes = this.generateOpportunityTypes(station, workflowResult);
    
    // Extract agent insights
    const agentInsights = this.extractAgentInsights(workflowResult);
    
    // Assess risk factors
    const riskFactors = this.assessRiskFactors(station, workflowResult);
    
    // Generate action items
    const recommendedActions = this.generateRecommendedActions(station, workflowResult, overallOpportunityScore);

    return {
      stationId: station.station_id,
      stationName: station.name,
      operator: station.operator as 'SES' | 'Intelsat',
      location: {
        country: station.location.country,
        coordinates: [station.location.longitude, station.location.latitude]
      },
      
      // Core Scores
      utilizationScore,
      profitabilityScore,
      marketOpportunityScore,
      technicalCapabilityScore,
      
      // Composite Score
      overallOpportunityScore,
      investmentPriority,
      
      // Detailed Analysis
      opportunityTypes,
      agentInsights,
      riskFactors,
      recommendedActions,
      
      // Enhanced Methodology Compliance
      methodologyCompliance,
      
      // Enhanced Business Metrics
      enhancedMetrics: {
        operationalEfficiency: enhancedMetrics.operationalConstraints.utilizationEfficiency * 100,
        revenueOptimization: ((enhancedMetrics as any).revenue_optimization_potential / enhancedMetrics.monthly_revenue) * 100,
        interferenceImpact: enhancedMetrics.interferenceImpact.capacityReduction,
        benchmarkCompliance: validationReport.benchmarkCompliance
      },
      
      // Quality Metrics
      analysisConfidence: Math.min(100, workflowResult.confidenceScore * 100 + methodologyCompliance.overallCompliance * 0.2),
      dataQuality: workflowResult.executionMetrics.dataQuality,
      validationScore: validationReport.overallConfidence,
      lastUpdated: new Date()
    };
  }

  private calculateUtilizationScore(station: GroundStationAnalytics, workflowResult: WorkflowResult): number {
    const utilization = station.utilization_metrics.current_utilization;
    const peak = station.utilization_metrics.peak_utilization;
    const efficiency = station.capacity_metrics.capacity_efficiency;
    
    // Sweet spot is 70-80% utilization - high enough for efficiency, low enough for growth
    let utilizationScore = 0;
    
    if (utilization < 40) {
      // Underutilized - opportunity for improvement
      utilizationScore = 30 + (utilization / 40) * 20; // 30-50 range
    } else if (utilization <= 80) {
      // Optimal range - higher scores for better utilization
      utilizationScore = 50 + ((utilization - 40) / 40) * 40; // 50-90 range
    } else {
      // Over-utilized - expansion opportunity but with risk
      utilizationScore = 90 - ((utilization - 80) / 20) * 15; // 90-75 range
    }
    
    // Adjust based on efficiency
    utilizationScore = utilizationScore * (efficiency / 100);
    
    return Math.max(0, Math.min(100, utilizationScore));
  }

  private calculateProfitabilityScore(station: GroundStationAnalytics, workflowResult: WorkflowResult): number {
    const profitMargin = station.business_metrics.profit_margin;
    const revenueGrowth = station.business_metrics.revenue_growth_rate;
    const roi = station.roi_metrics.annual_roi_percentage;
    
    // Base score from profit margin
    let profitabilityScore = Math.min(60, profitMargin * 2); // Cap at 60 for 30% margin
    
    // Growth bonus
    profitabilityScore += Math.min(20, revenueGrowth); // Up to 20 points for growth
    
    // ROI bonus
    profitabilityScore += Math.min(20, roi * 0.5); // Up to 20 points for ROI
    
    return Math.max(0, Math.min(100, profitabilityScore));
  }

  private calculateMarketOpportunityScore(station: GroundStationAnalytics, workflowResult: WorkflowResult): number {
    const marketReport = workflowResult.agentReports['Market_Intelligence'];
    
    if (!marketReport?.data) {
      return 50; // Default score if no market data
    }
    
    const marketData = marketReport.data;
    let marketScore = 0;
    
    // Market size factor (0-25 points)
    if (marketData.marketProfile?.marketSize === 'very-large') marketScore += 25;
    else if (marketData.marketProfile?.marketSize === 'large') marketScore += 20;
    else if (marketData.marketProfile?.marketSize === 'medium') marketScore += 15;
    else marketScore += 10;
    
    // Growth potential (0-25 points)
    const growthPotential = marketData.demandAnalysis?.growthPotential || 0;
    marketScore += Math.min(25, growthPotential * 0.25);
    
    // Competitive position (0-25 points)
    const marketPosition = marketData.competitiveAnalysis?.marketPosition;
    if (marketPosition === 'dominant') marketScore += 25;
    else if (marketPosition === 'competitive') marketScore += 20;
    else if (marketPosition === 'challenged') marketScore += 10;
    else marketScore += 15; // emerging has potential
    
    // Underserved opportunities (0-25 points)
    const serviceGaps = marketData.underservedAnalysis?.serviceGaps?.length || 0;
    marketScore += Math.min(25, serviceGaps * 5);
    
    return Math.max(0, Math.min(100, marketScore));
  }

  private calculateTechnicalCapabilityScore(station: GroundStationAnalytics, workflowResult: WorkflowResult): number {
    const capacity = station.capacity_metrics.total_capacity_gbps;
    const redundancy = station.capacity_metrics.redundancy_level;
    const frequencyBands = station.technical_specs.frequency_bands.length;
    const services = station.technical_specs.services_supported.length;
    
    let technicalScore = 0;
    
    // Capacity scoring (0-30 points)
    technicalScore += Math.min(30, capacity / 10); // 1 point per 10 Gbps, cap at 300 Gbps
    
    // Redundancy scoring (0-25 points)
    technicalScore += Math.min(25, redundancy * 0.25);
    
    // Frequency diversity (0-25 points)
    technicalScore += Math.min(25, frequencyBands * 8); // Up to 3+ bands
    
    // Service diversity (0-20 points)
    technicalScore += Math.min(20, services * 3); // Up to 6+ services
    
    return Math.max(0, Math.min(100, technicalScore));
  }

  /**
   * Enhanced utilization scoring considering operational constraints
   */
  private calculateEnhancedUtilizationScore(
    station: GroundStationAnalytics, 
    enhancedMetrics: any
  ): number {
    const theoreticalUtilization = station.utilization_metrics.current_utilization;
    const actualUtilization = theoreticalUtilization * enhancedMetrics.operationalConstraints.utilizationEfficiency;
    const efficiency = enhancedMetrics.operationalConstraints.utilizationEfficiency;
    
    // Base score on actual utilization with efficiency bonus
    let score = 0;
    
    if (actualUtilization < 40) {
      score = 30 + (actualUtilization / 40) * 20; // 30-50 range
    } else if (actualUtilization <= 80) {
      score = 50 + ((actualUtilization - 40) / 40) * 40; // 50-90 range
    } else {
      score = 90 - ((actualUtilization - 80) / 20) * 15; // 90-75 range
    }
    
    // Efficiency bonus/penalty
    const efficiencyBonus = (efficiency - 0.8) * 50; // +/-10 points for 0.8-1.0 range
    score += efficiencyBonus;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Enhanced profitability scoring with revenue optimization potential
   */
  private calculateEnhancedProfitabilityScore(
    station: GroundStationAnalytics,
    enhancedMetrics: any
  ): number {
    const currentMargin = station.business_metrics.profit_margin;
    const revenueOptimization = (enhancedMetrics as any).revenue_optimization_potential || 0;
    const optimizationPotential = enhancedMetrics.optimizationPotential.marginImprovement;
    
    // Base score from current profitability
    let score = Math.min(60, currentMargin * 2);
    
    // Revenue optimization potential bonus
    const optimizationBonus = Math.min(25, optimizationPotential * 0.5);
    score += optimizationBonus;
    
    // Interference impact penalty
    const interferencePenalty = enhancedMetrics.interferenceImpact.capacityReduction * 0.5;
    score -= interferencePenalty;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate methodology compliance scoring
   */
  private calculateMethodologyCompliance(
    station: GroundStationAnalytics,
    enhancedMetrics: any,
    validationReport: any
  ): {
    overallCompliance: number;
    operationalConstraints: number;
    revenueModeling: number;
    interferenceAnalysis: number;
    validationFramework: number;
  } {
    // Operational Constraints Compliance (0-100)
    const hasConstraints = enhancedMetrics.operationalConstraints ? 100 : 0;
    const constraintsAccuracy = enhancedMetrics.operationalConstraints.utilizationEfficiency > 0 ? 100 : 50;
    const operationalConstraints = (hasConstraints + constraintsAccuracy) / 2;

    // Revenue Modeling Compliance (0-100) 
    const hasServicePricing = (enhancedMetrics as any).revenue_optimization_potential > 0 ? 100 : 0;
    const hasDynamicPricing = hasServicePricing; // Simplified for now
    const revenueModeling = (hasServicePricing + hasDynamicPricing) / 2;

    // Interference Analysis Compliance (0-100)
    const hasInterferenceData = enhancedMetrics.interferenceImpact ? 100 : 0;
    const hasCtoIRatio = enhancedMetrics.interferenceImpact.cToIRatio ? 100 : 50;
    const interferenceAnalysis = (hasInterferenceData + hasCtoIRatio) / 2;

    // Validation Framework Compliance (0-100)
    const hasBenchmarks = validationReport.overallConfidence > 0 ? 100 : 0;
    const hasValidation = validationReport.validationResults.length > 0 ? 100 : 0;
    const validationFramework = (hasBenchmarks + hasValidation) / 2;

    // Overall Compliance
    const overallCompliance = (
      operationalConstraints * 0.30 +
      revenueModeling * 0.25 +
      interferenceAnalysis * 0.25 +
      validationFramework * 0.20
    );

    return {
      overallCompliance,
      operationalConstraints,
      revenueModeling,
      interferenceAnalysis,
      validationFramework
    };
  }

  /**
   * Enhanced overall scoring with methodology compliance weighting
   */
  private calculateEnhancedOverallScore(
    utilizationScore: number,
    profitabilityScore: number,
    marketOpportunityScore: number,
    technicalCapabilityScore: number,
    methodologyCompliance: number
  ): number {
    // Base weighted score (same as before)
    const baseScore = (
      utilizationScore * 0.20 +
      profitabilityScore * 0.35 +
      marketOpportunityScore * 0.30 +
      technicalCapabilityScore * 0.15
    );

    // Methodology compliance bonus (up to 10% bonus for full compliance)
    const complianceBonus = (methodologyCompliance / 100) * 10;
    
    return Math.min(100, baseScore + complianceBonus);
  }

  private calculateOverallScore(
    utilizationScore: number,
    profitabilityScore: number,
    marketOpportunityScore: number,
    technicalCapabilityScore: number
  ): number {
    // Weighted scoring - profitability and market opportunity are most important
    const weights = {
      utilization: 0.20,
      profitability: 0.35,
      marketOpportunity: 0.30,
      technicalCapability: 0.15
    };
    
    return (
      utilizationScore * weights.utilization +
      profitabilityScore * weights.profitability +
      marketOpportunityScore * weights.marketOpportunity +
      technicalCapabilityScore * weights.technicalCapability
    );
  }

  private determineInvestmentPriority(overallScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (overallScore >= 80) return 'critical';
    if (overallScore >= 65) return 'high';
    if (overallScore >= 45) return 'medium';
    return 'low';
  }

  private generateOpportunityTypes(station: GroundStationAnalytics, workflowResult: WorkflowResult): {
    expansion: { score: number; reasoning: string };
    optimization: { score: number; reasoning: string };
    newMarkets: { score: number; reasoning: string };
    costReduction: { score: number; reasoning: string };
  } {
    const utilization = station.utilization_metrics.current_utilization;
    const profitMargin = station.business_metrics.profit_margin;
    const marketData = workflowResult.agentReports['Market_Intelligence']?.data;
    
    return {
      expansion: {
        score: utilization > 75 ? 90 : utilization > 50 ? 60 : 30,
        reasoning: utilization > 75 
          ? 'High utilization indicates strong demand for capacity expansion'
          : utilization > 50 
            ? 'Moderate utilization suggests potential for targeted expansion'
            : 'Low utilization indicates limited expansion opportunity'
      },
      optimization: {
        score: profitMargin < 25 ? 80 : profitMargin < 40 ? 50 : 20,
        reasoning: profitMargin < 25
          ? 'Low profit margin indicates significant optimization opportunities'
          : profitMargin < 40
            ? 'Moderate margin suggests room for operational improvements'
            : 'High margin indicates well-optimized operations'
      },
      newMarkets: {
        score: marketData?.underservedAnalysis?.serviceGaps?.length > 2 ? 85 : 
               marketData?.underservedAnalysis?.serviceGaps?.length > 0 ? 60 : 40,
        reasoning: marketData?.underservedAnalysis?.serviceGaps?.length > 2
          ? 'Multiple underserved market segments present significant opportunity'
          : marketData?.underservedAnalysis?.serviceGaps?.length > 0
            ? 'Some market gaps identified for targeted expansion'
            : 'Limited new market opportunities in current region'
      },
      costReduction: {
        score: station.business_metrics.operational_cost_monthly / station.business_metrics.monthly_revenue > 0.4 ? 75 : 40,
        reasoning: station.business_metrics.operational_cost_monthly / station.business_metrics.monthly_revenue > 0.4
          ? 'High operational cost ratio indicates significant cost reduction potential'
          : 'Operational costs appear well-managed relative to revenue'
      }
    };
  }

  private extractAgentInsights(workflowResult: WorkflowResult): {
    domainExpertise: string[];
    dataScience: string[];
    marketIntelligence: string[];
    technicalAssessment: string[];
  } {
    return {
      domainExpertise: [
        ...(workflowResult.agentReports['SATOPS_Expert']?.recommendations || []),
        ...(workflowResult.agentReports['Fleet_Analyst']?.recommendations || [])
      ].slice(0, 3),
      dataScience: [
        ...(workflowResult.agentReports['Analytics_Engineer']?.recommendations || [])
      ].slice(0, 3),
      marketIntelligence: [
        ...(workflowResult.agentReports['Market_Intelligence']?.recommendations || [])
      ].slice(0, 3),
      technicalAssessment: [
        ...(workflowResult.agentReports['Visualization_Developer']?.recommendations || []),
        ...(workflowResult.agentReports['Data_Integration_Developer']?.recommendations || [])
      ].slice(0, 3)
    };
  }

  private assessRiskFactors(station: GroundStationAnalytics, workflowResult: WorkflowResult): {
    operational: string[];
    financial: string[];
    competitive: string[];
    regulatory: string[];
  } {
    const warnings = workflowResult.riskFactors;
    
    // Categorize warnings
    return {
      operational: warnings.filter(w => 
        w.includes('utilization') || w.includes('capacity') || w.includes('weather') || w.includes('redundancy')
      ),
      financial: warnings.filter(w => 
        w.includes('margin') || w.includes('cost') || w.includes('revenue') || w.includes('ROI')
      ),
      competitive: warnings.filter(w => 
        w.includes('competition') || w.includes('market share') || w.includes('competitor')
      ),
      regulatory: warnings.filter(w => 
        w.includes('regulatory') || w.includes('compliance') || w.includes('license')
      )
    };
  }

  private generateRecommendedActions(
    station: GroundStationAnalytics, 
    workflowResult: WorkflowResult,
    overallScore: number
  ): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const recommendations = workflowResult.consolidatedRecommendations;
    
    // Categorize by urgency based on overall score and specific conditions
    return {
      immediate: recommendations.filter(r => 
        r.includes('critical') || r.includes('immediate') || overallScore < 40
      ).slice(0, 3),
      shortTerm: recommendations.filter(r => 
        r.includes('optimize') || r.includes('improve') || r.includes('enhance')
      ).slice(0, 4),
      longTerm: recommendations.filter(r => 
        r.includes('expand') || r.includes('invest') || r.includes('develop')
      ).slice(0, 3)
    };
  }

  private generateDashboard(scores: OpportunityScore[]): OpportunityDashboard {
    const totalStations = scores.length;
    const averageOpportunityScore = scores.reduce((sum, score) => sum + score.overallOpportunityScore, 0) / totalStations;
    
    // Performance tiers
    const highOpportunityStations = scores.filter(s => s.overallOpportunityScore >= 75);
    const mediumOpportunityStations = scores.filter(s => s.overallOpportunityScore >= 50 && s.overallOpportunityScore < 75);
    const lowOpportunityStations = scores.filter(s => s.overallOpportunityScore < 50);
    
    // Operator comparison
    const sesStations = scores.filter(s => s.operator === 'SES');
    const intelsatStations = scores.filter(s => s.operator === 'Intelsat');
    
    const sesPerformance = {
      averageScore: sesStations.reduce((sum, s) => sum + s.overallOpportunityScore, 0) / sesStations.length,
      topStations: sesStations.sort((a, b) => b.overallOpportunityScore - a.overallOpportunityScore).slice(0, 3),
      keyOpportunities: this.extractTopOpportunities(sesStations)
    };
    
    const intelsatPerformance = {
      averageScore: intelsatStations.reduce((sum, s) => sum + s.overallOpportunityScore, 0) / intelsatStations.length,
      topStations: intelsatStations.sort((a, b) => b.overallOpportunityScore - a.overallOpportunityScore).slice(0, 3),
      keyOpportunities: this.extractTopOpportunities(intelsatStations)
    };
    
    return {
      totalStationsAnalyzed: totalStations,
      averageOpportunityScore,
      
      highOpportunityStations,
      mediumOpportunityStations,
      lowOpportunityStations,
      
      sesPerformance,
      intelsatPerformance,
      
      regionalInsights: this.generateRegionalInsights(scores),
      marketTrends: this.generateMarketTrends(scores),
      portfolioOptimization: this.generatePortfolioOptimization(scores)
    };
  }

  private extractTopOpportunities(stations: OpportunityScore[]): string[] {
    const allOpportunities = stations.flatMap(s => [
      ...s.agentInsights.marketIntelligence,
      ...s.recommendedActions.immediate,
      ...s.recommendedActions.shortTerm
    ]);
    
    // Count frequency and return top opportunities
    const opportunityCount = new Map<string, number>();
    allOpportunities.forEach(opp => {
      opportunityCount.set(opp, (opportunityCount.get(opp) || 0) + 1);
    });
    
    return Array.from(opportunityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([opp]) => opp);
  }

  private generateRegionalInsights(scores: OpportunityScore[]): {
    region: string;
    stationCount: number;
    averageScore: number;
    topOpportunities: string[];
  }[] {
    const regionMap = new Map<string, OpportunityScore[]>();
    
    scores.forEach(score => {
      const region = score.location.country;
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(score);
    });
    
    return Array.from(regionMap.entries()).map(([region, regionScores]) => ({
      region,
      stationCount: regionScores.length,
      averageScore: regionScores.reduce((sum, s) => sum + s.overallOpportunityScore, 0) / regionScores.length,
      topOpportunities: this.extractTopOpportunities(regionScores).slice(0, 3)
    }));
  }

  private generateMarketTrends(scores: OpportunityScore[]): {
    emergingMarkets: string[];
    saturatedMarkets: string[];
    competitiveThreats: string[];
    technologyOpportunities: string[];
  } {
    // Analyze patterns across all stations
    const highGrowthMarkets = scores
      .filter(s => s.marketOpportunityScore > 70)
      .map(s => s.location.country);
    
    const saturatedMarkets = scores
      .filter(s => s.utilizationScore > 85 && s.marketOpportunityScore < 50)
      .map(s => s.location.country);
    
    return {
      emergingMarkets: [...new Set(highGrowthMarkets)],
      saturatedMarkets: [...new Set(saturatedMarkets)],
      competitiveThreats: ['5G terrestrial networks', 'LEO constellations', 'Fiber expansion'],
      technologyOpportunities: ['Software-defined satellites', 'Edge computing', 'AI-driven operations']
    };
  }

  private generatePortfolioOptimization(scores: OpportunityScore[]): {
    expandCapacity: OpportunityScore[];
    optimizeOperations: OpportunityScore[];
    enterNewMarkets: OpportunityScore[];
    divest: OpportunityScore[];
  } {
    return {
      expandCapacity: scores
        .filter(s => s.opportunityTypes.expansion.score > 70)
        .sort((a, b) => b.opportunityTypes.expansion.score - a.opportunityTypes.expansion.score)
        .slice(0, 5),
      optimizeOperations: scores
        .filter(s => s.opportunityTypes.optimization.score > 60)
        .sort((a, b) => b.opportunityTypes.optimization.score - a.opportunityTypes.optimization.score)
        .slice(0, 5),
      enterNewMarkets: scores
        .filter(s => s.opportunityTypes.newMarkets.score > 65)
        .sort((a, b) => b.opportunityTypes.newMarkets.score - a.opportunityTypes.newMarkets.score)
        .slice(0, 5),
      divest: scores
        .filter(s => s.overallOpportunityScore < 30 && s.investmentPriority === 'low')
        .sort((a, b) => a.overallOpportunityScore - b.overallOpportunityScore)
        .slice(0, 3)
    };
  }
}