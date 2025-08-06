/**
 * SATOPS_Expert - Satellite Operations Domain Expert
 * 
 * Validates ground station capabilities against SES/Intelsat fleet requirements
 * Understands teleport vs. gateway vs. regional facility differences
 * Provides accurate capacity estimates based on antenna types
 */

import { BaseAgent, AgentCapability, AgentAnalysis, GroundStationAssessment } from '../types';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

export interface StationCapabilityAssessment {
  stationType: 'teleport' | 'gateway' | 'regional';
  capacityRating: 'excellent' | 'good' | 'adequate' | 'limited';
  fleetCompatibility: {
    sesCompatibility: number; // 0-100
    intelsatCompatibility: number; // 0-100
    supportedServices: string[];
  };
  technicalRecommendations: string[];
  upgradeOpportunities: {
    investment: number;
    capacityIncrease: number;
    timelineMonths: number;
  }[];
}

export class SATOPSExpert extends BaseAgent {
  agentId = 'SATOPS_Expert';
  
  capabilities: AgentCapability[] = [
    {
      name: 'Station Capability Validation',
      description: 'Validates ground station technical capabilities against fleet requirements',
      inputTypes: ['GroundStationAnalytics'],
      outputTypes: ['StationCapabilityAssessment']
    },
    {
      name: 'Fleet Compatibility Analysis',
      description: 'Analyzes compatibility with SES and Intelsat satellite fleets',
      inputTypes: ['TechnicalSpecs', 'FrequencyBands'],
      outputTypes: ['FleetCompatibility']
    },
    {
      name: 'Capacity Optimization',
      description: 'Provides capacity estimates and optimization recommendations',
      inputTypes: ['AntennaConfiguration', 'ServiceRequirements'],
      outputTypes: ['CapacityEstimate']
    }
  ];

  async analyze(station: GroundStationAnalytics): Promise<AgentAnalysis> {
    const assessment = await this.assessStationCapabilities(station);
    const confidence = this.calculateConfidence(station);
    const recommendations = this.generateRecommendations(assessment);
    const warnings = this.identifyWarnings(assessment);

    return this.createAnalysis(assessment, confidence, recommendations, warnings);
  }

  private async assessStationCapabilities(station: GroundStationAnalytics): Promise<StationCapabilityAssessment> {
    // Determine station type based on specifications
    const stationType = this.classifyStationType(station);
    
    // Assess capacity rating
    const capacityRating = this.assessCapacityRating(station);
    
    // Analyze fleet compatibility
    const fleetCompatibility = this.analyzeFleetCompatibility(station);
    
    // Generate technical recommendations
    const technicalRecommendations = this.generateTechnicalRecommendations(station);
    
    // Identify upgrade opportunities
    const upgradeOpportunities = this.identifyUpgradeOpportunities(station);

    return {
      stationType,
      capacityRating,
      fleetCompatibility,
      technicalRecommendations,
      upgradeOpportunities
    };
  }

  private classifyStationType(station: GroundStationAnalytics): 'teleport' | 'gateway' | 'regional' {
    const { primary_antenna_size_m, secondary_antennas, services_supported } = station.technical_specs;
    const { total_capacity_gbps } = station.capacity_metrics;

    // Teleport: Large facilities with multiple antennas and high capacity
    if (primary_antenna_size_m >= 15 && secondary_antennas >= 3 && total_capacity_gbps >= 150) {
      return 'teleport';
    }

    // Gateway: Medium facilities with good capacity and multiple services
    if (primary_antenna_size_m >= 11 && total_capacity_gbps >= 100 && services_supported.length >= 4) {
      return 'gateway';
    }

    // Regional: Smaller facilities serving local markets
    return 'regional';
  }

  private assessCapacityRating(station: GroundStationAnalytics): 'excellent' | 'good' | 'adequate' | 'limited' {
    const { total_capacity_gbps, capacity_efficiency } = station.capacity_metrics;
    const { current_utilization } = station.utilization_metrics;
    
    // Calculate overall capacity score
    const capacityScore = (total_capacity_gbps / 200) * 0.4 + 
                         (capacity_efficiency / 100) * 0.3 + 
                         ((100 - current_utilization) / 100) * 0.3;

    if (capacityScore >= 0.8) return 'excellent';
    if (capacityScore >= 0.6) return 'good';
    if (capacityScore >= 0.4) return 'adequate';
    return 'limited';
  }

  private analyzeFleetCompatibility(station: GroundStationAnalytics): {
    sesCompatibility: number;
    intelsatCompatibility: number;
    supportedServices: string[];
  } {
    const { frequency_bands, services_supported, g_t_ratio_db, eirp_dbw } = station.technical_specs;
    
    // SES fleet typically requires Ku/Ka band capabilities and high G/T ratios
    let sesCompatibility = 0;
    if (frequency_bands.includes('Ku-band')) sesCompatibility += 30;
    if (frequency_bands.includes('Ka-band')) sesCompatibility += 25;
    if (frequency_bands.includes('C-band')) sesCompatibility += 15;
    if (g_t_ratio_db >= 40) sesCompatibility += 20;
    if (eirp_dbw >= 55) sesCompatibility += 10;

    // Intelsat fleet has broader frequency requirements but emphasizes C-band
    let intelsatCompatibility = 0;
    if (frequency_bands.includes('C-band')) intelsatCompatibility += 35;
    if (frequency_bands.includes('Ku-band')) intelsatCompatibility += 25;
    if (frequency_bands.includes('Ka-band')) intelsatCompatibility += 15;
    if (g_t_ratio_db >= 35) intelsatCompatibility += 15;
    if (eirp_dbw >= 50) intelsatCompatibility += 10;

    // Supported services analysis
    const supportedServices = this.mapServicesToFleetCapabilities(services_supported);

    return {
      sesCompatibility: Math.min(sesCompatibility, 100),
      intelsatCompatibility: Math.min(intelsatCompatibility, 100),
      supportedServices
    };
  }

  private mapServicesToFleetCapabilities(services: string[]): string[] {
    const serviceMap: { [key: string]: string } = {
      'DTH': 'Direct-to-Home Broadcasting',
      'Enterprise': 'Corporate VSAT Networks',
      'Government': 'Military/Government Communications',
      'HTS': 'High Throughput Satellite Services',
      'Maritime': 'Maritime Communications',
      'Broadcast': 'TV/Radio Broadcasting',
      'CDN': 'Content Delivery Networks'
    };

    return services.map(service => serviceMap[service] || service);
  }

  private generateTechnicalRecommendations(station: GroundStationAnalytics): string[] {
    const recommendations: string[] = [];
    const { primary_antenna_size_m, g_t_ratio_db, eirp_dbw } = station.technical_specs;
    const { capacity_efficiency, redundancy_level } = station.capacity_metrics;

    // Antenna size recommendations
    if (primary_antenna_size_m < 13) {
      recommendations.push('Consider upgrading to larger primary antenna (13m+) for improved signal quality');
    }

    // G/T ratio improvements
    if (g_t_ratio_db < 40) {
      recommendations.push('Improve G/T ratio through antenna upgrade or LNB enhancement');
    }

    // EIRP enhancements
    if (eirp_dbw < 52) {
      recommendations.push('Increase EIRP through high-power amplifier upgrade');
    }

    // Efficiency improvements
    if (capacity_efficiency < 85) {
      recommendations.push('Optimize bandwidth allocation and implement traffic shaping');
    }

    // Redundancy improvements
    if (redundancy_level < 90) {
      recommendations.push('Enhance redundancy with backup systems and diverse routing');
    }

    return recommendations;
  }

  private identifyUpgradeOpportunities(station: GroundStationAnalytics): {
    investment: number;
    capacityIncrease: number;
    timelineMonths: number;
  }[] {
    const opportunities = [];
    const currentCapacity = station.capacity_metrics.total_capacity_gbps;

    // Antenna upgrade opportunity
    if (station.technical_specs.primary_antenna_size_m < 15) {
      opportunities.push({
        investment: 2500000,
        capacityIncrease: Math.round(currentCapacity * 0.4),
        timelineMonths: 8
      });
    }

    // HTS upgrade opportunity
    if (!station.technical_specs.services_supported.includes('HTS')) {
      opportunities.push({
        investment: 1500000,
        capacityIncrease: Math.round(currentCapacity * 0.6),
        timelineMonths: 6
      });
    }

    // Ka-band addition
    if (!station.technical_specs.frequency_bands.includes('Ka-band')) {
      opportunities.push({
        investment: 3000000,
        capacityIncrease: Math.round(currentCapacity * 0.8),
        timelineMonths: 12
      });
    }

    return opportunities;
  }

  private calculateConfidence(station: GroundStationAnalytics): number {
    // Base confidence on data completeness and quality
    let confidence = 0.7; // Base confidence

    // Increase confidence based on data quality indicators
    if (station.technical_specs.g_t_ratio_db > 0) confidence += 0.1;
    if (station.capacity_metrics.capacity_efficiency > 0) confidence += 0.1;
    if (station.utilization_metrics.monthly_utilization_history.length >= 5) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private generateRecommendations(assessment: StationCapabilityAssessment): string[] {
    const recommendations = [...assessment.technicalRecommendations];

    // Add strategic recommendations based on assessment
    if (assessment.capacityRating === 'limited') {
      recommendations.push('Priority investment required to maintain competitive position');
    }

    if (assessment.fleetCompatibility.sesCompatibility < 70 && assessment.fleetCompatibility.intelsatCompatibility < 70) {
      recommendations.push('Critical: Upgrade required for fleet compatibility');
    }

    if (assessment.upgradeOpportunities.length > 0) {
      const bestOpportunity = assessment.upgradeOpportunities[0];
      recommendations.push(`Consider ${bestOpportunity.capacityIncrease}Gbps capacity upgrade for $${(bestOpportunity.investment / 1000000).toFixed(1)}M`);
    }

    return recommendations;
  }

  private identifyWarnings(assessment: StationCapabilityAssessment): string[] {
    const warnings: string[] = [];

    if (assessment.capacityRating === 'limited') {
      warnings.push('Station capacity may not meet future demand requirements');
    }

    if (assessment.fleetCompatibility.sesCompatibility < 50) {
      warnings.push('Limited compatibility with SES satellite fleet');
    }

    if (assessment.fleetCompatibility.intelsatCompatibility < 50) {
      warnings.push('Limited compatibility with Intelsat satellite fleet');
    }

    return warnings;
  }
}