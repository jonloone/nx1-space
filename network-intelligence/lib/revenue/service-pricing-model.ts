/**
 * Service-Specific Revenue and Pricing Model
 * 
 * Implements methodology paper Section 3: Revenue-Centric Model
 * - Service-specific pricing (broadcast, data, government, mobility)
 * - Dynamic pricing based on demand
 * - Margin and break-even analysis
 * - Profit optimization strategies
 */

export type ServiceType = 'broadcast' | 'data' | 'government' | 'mobility' | 'iot' | 'backhaul';

export interface ServicePricingTier {
  service: ServiceType;
  baseRatePerGbps: number; // USD per Gbps per month
  volumeDiscounts: Array<{
    minGbps: number;
    discountPercentage: number;
  }>;
  peakHourMultiplier: number;
  offPeakMultiplier: number;
  minimumCommitment: number; // Gbps
  slaLevel: 'standard' | 'premium' | 'guaranteed';
  marginPercentage: number; // Gross margin
}

export interface MarketDemandFactors {
  regionDemandIndex: number; // 0-100
  competitionLevel: 'low' | 'medium' | 'high';
  marketMaturity: 'emerging' | 'growing' | 'mature' | 'declining';
  seasonalFactor: number; // Multiplier (e.g., 1.2 for high season)
  economicIndicator: number; // GDP growth rate
}

export interface ServiceContract {
  contractId: string;
  customerId: string;
  service: ServiceType;
  capacityGbps: number;
  contractLengthMonths: number;
  monthlyRate: number;
  slaCommitment: number; // percentage uptime
  penalties: {
    perHourDowntime: number;
    maxMonthlyPenalty: number;
  };
  autoRenewal: boolean;
  escalationRate: number; // Annual percentage increase
}

export interface RevenueAnalysis {
  totalMonthlyRevenue: number;
  revenueByService: Record<ServiceType, number>;
  averageMargin: number;
  breakEvenPoint: number; // Gbps utilization needed
  profitabilityIndex: number; // Revenue per unit cost
  customerLifetimeValue: number;
  churnRisk: 'low' | 'medium' | 'high';
}

export interface ProfitOptimization {
  currentProfit: number;
  optimizedProfit: number;
  recommendations: OptimizationRecommendation[];
  implementationTimeline: string;
  riskAssessment: string;
}

export interface OptimizationRecommendation {
  action: string;
  expectedImpact: number; // USD
  implementationCost: number;
  timeToImplement: number; // days
  confidence: number; // 0-1
}

export class ServicePricingModel {
  private readonly BASE_PRICING: Record<ServiceType, ServicePricingTier> = {
    broadcast: {
      service: 'broadcast',
      baseRatePerGbps: 12000,
      volumeDiscounts: [
        { minGbps: 10, discountPercentage: 5 },
        { minGbps: 50, discountPercentage: 10 },
        { minGbps: 100, discountPercentage: 15 }
      ],
      peakHourMultiplier: 1.3,
      offPeakMultiplier: 0.8,
      minimumCommitment: 5,
      slaLevel: 'premium',
      marginPercentage: 35
    },
    data: {
      service: 'data',
      baseRatePerGbps: 10000,
      volumeDiscounts: [
        { minGbps: 20, discountPercentage: 8 },
        { minGbps: 100, discountPercentage: 12 },
        { minGbps: 200, discountPercentage: 18 }
      ],
      peakHourMultiplier: 1.2,
      offPeakMultiplier: 0.7,
      minimumCommitment: 10,
      slaLevel: 'standard',
      marginPercentage: 30
    },
    government: {
      service: 'government',
      baseRatePerGbps: 18000,
      volumeDiscounts: [
        { minGbps: 5, discountPercentage: 3 },
        { minGbps: 25, discountPercentage: 7 },
        { minGbps: 50, discountPercentage: 10 }
      ],
      peakHourMultiplier: 1.0, // No peak pricing for government
      offPeakMultiplier: 1.0,
      minimumCommitment: 2,
      slaLevel: 'guaranteed',
      marginPercentage: 45
    },
    mobility: {
      service: 'mobility',
      baseRatePerGbps: 15000,
      volumeDiscounts: [
        { minGbps: 15, discountPercentage: 6 },
        { minGbps: 75, discountPercentage: 11 },
        { minGbps: 150, discountPercentage: 16 }
      ],
      peakHourMultiplier: 1.4,
      offPeakMultiplier: 0.6,
      minimumCommitment: 8,
      slaLevel: 'premium',
      marginPercentage: 38
    },
    iot: {
      service: 'iot',
      baseRatePerGbps: 8000,
      volumeDiscounts: [
        { minGbps: 30, discountPercentage: 10 },
        { minGbps: 100, discountPercentage: 20 },
        { minGbps: 300, discountPercentage: 25 }
      ],
      peakHourMultiplier: 1.1,
      offPeakMultiplier: 0.9,
      minimumCommitment: 20,
      slaLevel: 'standard',
      marginPercentage: 25
    },
    backhaul: {
      service: 'backhaul',
      baseRatePerGbps: 9000,
      volumeDiscounts: [
        { minGbps: 50, discountPercentage: 12 },
        { minGbps: 200, discountPercentage: 18 },
        { minGbps: 500, discountPercentage: 22 }
      ],
      peakHourMultiplier: 1.15,
      offPeakMultiplier: 0.85,
      minimumCommitment: 25,
      slaLevel: 'premium',
      marginPercentage: 28
    }
  };
  
  private readonly OPERATIONAL_COSTS = {
    fixedCostPerStation: 150000, // USD per month
    variableCostPerGbps: 3000, // USD per Gbps per month
    maintenanceCostPercentage: 5, // % of revenue
    powerCostPerGbps: 500, // USD per Gbps per month
    staffingCostPerStation: 80000, // USD per month
    insurancePercentage: 2, // % of revenue
  };
  
  /**
   * Calculate dynamic price for a service based on market conditions
   */
  calculateDynamicPrice(
    service: ServiceType,
    capacityGbps: number,
    marketFactors: MarketDemandFactors,
    contractLength: number = 12
  ): {
    monthlyRate: number;
    effectiveRatePerGbps: number;
    discountApplied: number;
    marginExpected: number;
  } {
    const pricing = this.BASE_PRICING[service];
    let rate = pricing.baseRatePerGbps;
    
    // Apply volume discount
    const volumeDiscount = this.getVolumeDiscount(pricing, capacityGbps);
    rate *= (1 - volumeDiscount / 100);
    
    // Apply market demand factor
    const demandMultiplier = this.calculateDemandMultiplier(marketFactors);
    rate *= demandMultiplier;
    
    // Apply contract length discount
    const contractDiscount = this.getContractLengthDiscount(contractLength);
    rate *= (1 - contractDiscount / 100);
    
    // Apply competition adjustment
    const competitionAdjustment = this.getCompetitionAdjustment(marketFactors.competitionLevel);
    rate *= competitionAdjustment;
    
    // Calculate total monthly rate
    const monthlyRate = rate * capacityGbps;
    
    // Calculate expected margin after adjustments
    const costPerGbps = this.calculateCostPerGbps(capacityGbps);
    const marginExpected = ((rate - costPerGbps) / rate) * 100;
    
    return {
      monthlyRate,
      effectiveRatePerGbps: rate,
      discountApplied: ((pricing.baseRatePerGbps - rate) / pricing.baseRatePerGbps) * 100,
      marginExpected
    };
  }
  
  /**
   * Analyze revenue and profitability for a ground station
   */
  analyzeStationRevenue(
    contracts: ServiceContract[],
    stationCapacity: number,
    utilizationRate: number
  ): RevenueAnalysis {
    let totalRevenue = 0;
    const revenueByService: Partial<Record<ServiceType, number>> = {};
    let totalMargin = 0;
    let totalCapacityUsed = 0;
    
    // Calculate revenue by contract
    for (const contract of contracts) {
      totalRevenue += contract.monthlyRate;
      
      if (!revenueByService[contract.service]) {
        revenueByService[contract.service] = 0;
      }
      revenueByService[contract.service]! += contract.monthlyRate;
      
      totalCapacityUsed += contract.capacityGbps;
      
      // Calculate margin for this contract
      const cost = this.calculateServiceCost(contract.service, contract.capacityGbps);
      const margin = ((contract.monthlyRate - cost) / contract.monthlyRate) * 100;
      totalMargin += margin * contract.monthlyRate;
    }
    
    // Calculate average margin
    const averageMargin = totalRevenue > 0 ? totalMargin / totalRevenue : 0;
    
    // Calculate break-even point
    const fixedCosts = this.OPERATIONAL_COSTS.fixedCostPerStation + 
                       this.OPERATIONAL_COSTS.staffingCostPerStation;
    const variableCostPerGbps = this.OPERATIONAL_COSTS.variableCostPerGbps + 
                                this.OPERATIONAL_COSTS.powerCostPerGbps;
    const averageRevenuePerGbps = totalRevenue / totalCapacityUsed;
    const breakEvenPoint = fixedCosts / (averageRevenuePerGbps - variableCostPerGbps);
    
    // Calculate profitability index
    const totalCosts = this.calculateTotalCosts(totalCapacityUsed);
    const profitabilityIndex = totalRevenue / totalCosts;
    
    // Calculate customer lifetime value (simplified)
    const avgContractLength = contracts.reduce((sum, c) => sum + c.contractLengthMonths, 0) / contracts.length;
    const customerLifetimeValue = (totalRevenue / contracts.length) * avgContractLength;
    
    // Assess churn risk
    const churnRisk = this.assessChurnRisk(contracts, averageMargin, utilizationRate);
    
    return {
      totalMonthlyRevenue: totalRevenue,
      revenueByService: revenueByService as Record<ServiceType, number>,
      averageMargin,
      breakEvenPoint,
      profitabilityIndex,
      customerLifetimeValue,
      churnRisk
    };
  }
  
  /**
   * Optimize pricing and service mix for maximum profit
   */
  optimizeForProfit(
    currentContracts: ServiceContract[],
    stationCapacity: number,
    marketFactors: MarketDemandFactors,
    constraints: {
      minMargin?: number;
      maxPriceIncrease?: number;
      protectedContracts?: string[]; // Contract IDs that cannot be changed
    } = {}
  ): ProfitOptimization {
    const currentAnalysis = this.analyzeStationRevenue(
      currentContracts,
      stationCapacity,
      0.75 // Assume 75% utilization
    );
    
    const currentProfit = currentAnalysis.totalMonthlyRevenue * (currentAnalysis.averageMargin / 100);
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze service mix
    const serviceMixOptimization = this.optimizeServiceMix(
      currentContracts,
      stationCapacity,
      marketFactors
    );
    recommendations.push(...serviceMixOptimization);
    
    // Analyze pricing opportunities
    const pricingOptimization = this.identifyPricingOpportunities(
      currentContracts,
      marketFactors,
      constraints
    );
    recommendations.push(...pricingOptimization);
    
    // Analyze capacity expansion
    const capacityOptimization = this.analyzeCapacityExpansion(
      currentContracts,
      stationCapacity,
      marketFactors
    );
    recommendations.push(...capacityOptimization);
    
    // Calculate optimized profit
    const optimizedProfit = currentProfit + 
      recommendations.reduce((sum, rec) => sum + rec.expectedImpact, 0);
    
    return {
      currentProfit,
      optimizedProfit,
      recommendations: recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact).slice(0, 5),
      implementationTimeline: this.generateImplementationTimeline(recommendations),
      riskAssessment: this.assessOptimizationRisk(recommendations, currentAnalysis)
    };
  }
  
  /**
   * Calculate break-even analysis
   */
  calculateBreakEven(
    fixedCosts: number,
    variableCostPerGbps: number,
    revenuePerGbps: number
  ): {
    breakEvenCapacity: number;
    breakEvenUtilization: number;
    marginOfSafety: number;
  } {
    const breakEvenCapacity = fixedCosts / (revenuePerGbps - variableCostPerGbps);
    
    // Assuming typical station capacity of 200 Gbps
    const typicalCapacity = 200;
    const breakEvenUtilization = (breakEvenCapacity / typicalCapacity) * 100;
    
    // Margin of safety (how much sales can drop before losses)
    const currentCapacity = typicalCapacity * 0.75; // Assume 75% utilization
    const marginOfSafety = ((currentCapacity - breakEvenCapacity) / currentCapacity) * 100;
    
    return {
      breakEvenCapacity,
      breakEvenUtilization,
      marginOfSafety
    };
  }
  
  // Private helper methods
  
  private getVolumeDiscount(pricing: ServicePricingTier, capacityGbps: number): number {
    let discount = 0;
    for (const tier of pricing.volumeDiscounts) {
      if (capacityGbps >= tier.minGbps) {
        discount = tier.discountPercentage;
      }
    }
    return discount;
  }
  
  private calculateDemandMultiplier(factors: MarketDemandFactors): number {
    let multiplier = 1.0;
    
    // Regional demand impact
    multiplier *= (0.8 + (factors.regionDemandIndex / 100) * 0.4);
    
    // Market maturity impact
    const maturityMultipliers = {
      emerging: 1.15,
      growing: 1.05,
      mature: 1.0,
      declining: 0.9
    };
    multiplier *= maturityMultipliers[factors.marketMaturity];
    
    // Seasonal factor
    multiplier *= factors.seasonalFactor;
    
    // Economic indicator (GDP growth)
    multiplier *= (1 + factors.economicIndicator / 100);
    
    return multiplier;
  }
  
  private getContractLengthDiscount(months: number): number {
    if (months >= 36) return 12;
    if (months >= 24) return 8;
    if (months >= 12) return 5;
    return 0;
  }
  
  private getCompetitionAdjustment(level: 'low' | 'medium' | 'high'): number {
    const adjustments = {
      low: 1.1,
      medium: 1.0,
      high: 0.9
    };
    return adjustments[level];
  }
  
  private calculateCostPerGbps(capacityGbps: number): number {
    const fixed = (this.OPERATIONAL_COSTS.fixedCostPerStation + 
                  this.OPERATIONAL_COSTS.staffingCostPerStation) / capacityGbps;
    const variable = this.OPERATIONAL_COSTS.variableCostPerGbps + 
                    this.OPERATIONAL_COSTS.powerCostPerGbps;
    return fixed + variable;
  }
  
  private calculateServiceCost(service: ServiceType, capacityGbps: number): number {
    const baseCost = this.calculateCostPerGbps(capacityGbps) * capacityGbps;
    
    // Add service-specific costs
    const serviceCostMultipliers = {
      government: 1.2, // Higher security and compliance costs
      broadcast: 1.1, // Redundancy requirements
      mobility: 1.15, // Dynamic routing costs
      data: 1.0,
      iot: 0.9, // Lower QoS requirements
      backhaul: 0.95
    };
    
    return baseCost * serviceCostMultipliers[service];
  }
  
  private calculateTotalCosts(capacityGbps: number): number {
    const fixed = this.OPERATIONAL_COSTS.fixedCostPerStation + 
                 this.OPERATIONAL_COSTS.staffingCostPerStation;
    const variable = (this.OPERATIONAL_COSTS.variableCostPerGbps + 
                     this.OPERATIONAL_COSTS.powerCostPerGbps) * capacityGbps;
    const maintenance = (fixed + variable) * (this.OPERATIONAL_COSTS.maintenanceCostPercentage / 100);
    const insurance = (fixed + variable) * (this.OPERATIONAL_COSTS.insurancePercentage / 100);
    
    return fixed + variable + maintenance + insurance;
  }
  
  private assessChurnRisk(
    contracts: ServiceContract[],
    averageMargin: number,
    utilizationRate: number
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // Contract length factor
    const avgLength = contracts.reduce((sum, c) => sum + c.contractLengthMonths, 0) / contracts.length;
    if (avgLength < 12) riskScore += 2;
    else if (avgLength < 24) riskScore += 1;
    
    // Margin factor
    if (averageMargin < 20) riskScore += 2;
    else if (averageMargin < 30) riskScore += 1;
    
    // Utilization factor
    if (utilizationRate > 90) riskScore += 1; // Too high, no room for growth
    else if (utilizationRate < 50) riskScore += 2; // Too low, may indicate problems
    
    // Auto-renewal factor
    const autoRenewalRate = contracts.filter(c => c.autoRenewal).length / contracts.length;
    if (autoRenewalRate < 0.5) riskScore += 2;
    else if (autoRenewalRate < 0.75) riskScore += 1;
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }
  
  private optimizeServiceMix(
    contracts: ServiceContract[],
    capacity: number,
    marketFactors: MarketDemandFactors
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze current mix
    const serviceDistribution = this.analyzeServiceDistribution(contracts);
    
    // Recommend high-margin services
    if (serviceDistribution.government < 0.2) {
      recommendations.push({
        action: 'Increase government service contracts by 10%',
        expectedImpact: capacity * 0.1 * 18000 * 0.45, // 10% capacity at gov rates and margin
        implementationCost: 50000,
        timeToImplement: 90,
        confidence: 0.75
      });
    }
    
    // Recommend reducing low-margin services
    if (serviceDistribution.iot > 0.3) {
      recommendations.push({
        action: 'Migrate 15% of IoT capacity to higher-margin services',
        expectedImpact: capacity * 0.15 * (12000 - 8000) * 0.3, // Difference in rates
        implementationCost: 20000,
        timeToImplement: 60,
        confidence: 0.65
      });
    }
    
    return recommendations;
  }
  
  private identifyPricingOpportunities(
    contracts: ServiceContract[],
    marketFactors: MarketDemandFactors,
    constraints: any
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const maxIncrease = constraints.maxPriceIncrease || 10;
    
    // Identify underpriced contracts
    for (const contract of contracts) {
      if (constraints.protectedContracts?.includes(contract.contractId)) continue;
      
      const marketPrice = this.calculateDynamicPrice(
        contract.service,
        contract.capacityGbps,
        marketFactors
      );
      
      const priceDiff = marketPrice.monthlyRate - contract.monthlyRate;
      if (priceDiff > contract.monthlyRate * (maxIncrease / 100)) {
        recommendations.push({
          action: `Renegotiate contract ${contract.contractId} to market rates`,
          expectedImpact: Math.min(priceDiff, contract.monthlyRate * (maxIncrease / 100)),
          implementationCost: 5000,
          timeToImplement: 30,
          confidence: 0.6
        });
      }
    }
    
    return recommendations;
  }
  
  private analyzeCapacityExpansion(
    contracts: ServiceContract[],
    currentCapacity: number,
    marketFactors: MarketDemandFactors
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const usedCapacity = contracts.reduce((sum, c) => sum + c.capacityGbps, 0);
    const utilization = usedCapacity / currentCapacity;
    
    if (utilization > 0.85 && marketFactors.regionDemandIndex > 70) {
      const expansionSize = currentCapacity * 0.25;
      const expectedRevenue = expansionSize * 12000 * 0.9; // Assume 90% fill rate
      const expansionCost = expansionSize * 50000; // Cost per Gbps for expansion
      
      recommendations.push({
        action: `Expand capacity by ${expansionSize} Gbps`,
        expectedImpact: expectedRevenue * 0.35, // Margin
        implementationCost: expansionCost,
        timeToImplement: 180,
        confidence: 0.7
      });
    }
    
    return recommendations;
  }
  
  private analyzeServiceDistribution(contracts: ServiceContract[]): Record<ServiceType, number> {
    const distribution: Partial<Record<ServiceType, number>> = {};
    const totalCapacity = contracts.reduce((sum, c) => sum + c.capacityGbps, 0);
    
    for (const contract of contracts) {
      if (!distribution[contract.service]) {
        distribution[contract.service] = 0;
      }
      distribution[contract.service]! += contract.capacityGbps / totalCapacity;
    }
    
    // Fill in missing services with 0
    const allServices: ServiceType[] = ['broadcast', 'data', 'government', 'mobility', 'iot', 'backhaul'];
    for (const service of allServices) {
      if (!distribution[service]) {
        distribution[service] = 0;
      }
    }
    
    return distribution as Record<ServiceType, number>;
  }
  
  private generateImplementationTimeline(recommendations: OptimizationRecommendation[]): string {
    const sortedByTime = [...recommendations].sort((a, b) => a.timeToImplement - b.timeToImplement);
    const phases = {
      immediate: sortedByTime.filter(r => r.timeToImplement <= 30),
      shortTerm: sortedByTime.filter(r => r.timeToImplement > 30 && r.timeToImplement <= 90),
      mediumTerm: sortedByTime.filter(r => r.timeToImplement > 90 && r.timeToImplement <= 180),
      longTerm: sortedByTime.filter(r => r.timeToImplement > 180)
    };
    
    return `Immediate (30 days): ${phases.immediate.length} actions, ` +
           `Short-term (90 days): ${phases.shortTerm.length} actions, ` +
           `Medium-term (180 days): ${phases.mediumTerm.length} actions, ` +
           `Long-term: ${phases.longTerm.length} actions`;
  }
  
  private assessOptimizationRisk(
    recommendations: OptimizationRecommendation[],
    currentAnalysis: RevenueAnalysis
  ): string {
    const totalImpact = recommendations.reduce((sum, r) => sum + r.expectedImpact, 0);
    const impactPercentage = (totalImpact / currentAnalysis.totalMonthlyRevenue) * 100;
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
    
    if (impactPercentage > 30 && avgConfidence < 0.6) {
      return 'HIGH RISK: Large revenue impact with low confidence. Implement gradually with monitoring.';
    } else if (impactPercentage > 20 || avgConfidence < 0.5) {
      return 'MEDIUM RISK: Significant changes proposed. Consider phased implementation.';
    } else {
      return 'LOW RISK: Conservative optimization with high confidence. Safe to implement.';
    }
  }
}

// Export singleton instance
export const servicePricingModel = new ServicePricingModel();