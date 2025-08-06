/**
 * Agent Coordination System
 * 
 * Orchestrates multi-agent workflows for ground station analysis
 * Manages agent communication and data flow
 * Provides unified interface for complex analysis tasks
 */

import { BaseAgent, AgentAnalysis, GroundStationAssessment, AgentCoordinator as IAgentCoordinator } from './types';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

// Domain Agents
import { SATOPSExpert } from './domain/satops-expert';
import { FleetAnalyst } from './domain/fleet-analyst';

// Data Science Agents
import { AnalyticsEngineer } from './data-science/analytics-engineer';
import { MarketIntelligence } from './data-science/market-intelligence';

// Developer Agents
import { DataIntegrationDeveloper } from './developer/data-integration-developer';
import { VisualizationDeveloper } from './developer/visualization-developer';

export interface WorkflowResult {
  stationId: string;
  timestamp: Date;
  overallAssessment: GroundStationAssessment;
  agentReports: { [agentId: string]: AgentAnalysis };
  consolidatedRecommendations: string[];
  riskFactors: string[];
  confidenceScore: number;
  executionMetrics: {
    totalExecutionTime: number;
    agentExecutionTimes: { [agentId: string]: number };
    dataQuality: number;
    analysisDepth: number;
  };
}

export class AgentCoordinator implements IAgentCoordinator {
  private domainAgents: { [key: string]: BaseAgent };
  private dataScienceAgents: { [key: string]: BaseAgent };
  private developerAgents: { [key: string]: BaseAgent };

  constructor() {
    // Initialize Domain Agents
    this.domainAgents = {
      'SATOPS_Expert': new SATOPSExpert(),
      'Fleet_Analyst': new FleetAnalyst()
    };

    // Initialize Data Science Agents
    this.dataScienceAgents = {
      'Analytics_Engineer': new AnalyticsEngineer(),
      'Market_Intelligence': new MarketIntelligence()
    };

    // Initialize Developer Agents
    this.developerAgents = {
      'Data_Integration_Developer': new DataIntegrationDeveloper(),
      'Visualization_Developer': new VisualizationDeveloper()
    };
  }

  /**
   * Execute comprehensive ground station analysis workflow
   */
  async executeWorkflow(stationId: string): Promise<GroundStationAssessment> {
    // This is a simplified version - full implementation would load actual station data
    const station = this.mockGetStationData(stationId);
    const workflowResult = await this.executeComprehensiveAnalysis(station);
    return workflowResult.overallAssessment;
  }

  /**
   * Execute comprehensive multi-agent analysis
   */
  async executeComprehensiveAnalysis(station: GroundStationAnalytics): Promise<WorkflowResult> {
    const startTime = Date.now();
    const agentReports: { [agentId: string]: AgentAnalysis } = {};
    const agentExecutionTimes: { [agentId: string]: number } = {};

    console.log(`🚀 Starting comprehensive analysis for ${station.name}`);

    // Phase 1: Data Integration and Validation
    console.log('📊 Phase 1: Data Integration and Validation');
    const dataIntegrationStart = Date.now();
    const dataIntegrationReport = await this.developerAgents['Data_Integration_Developer'].analyze(station);
    agentReports['Data_Integration_Developer'] = dataIntegrationReport;
    agentExecutionTimes['Data_Integration_Developer'] = Date.now() - dataIntegrationStart;

    // Phase 2: Domain Expert Analysis (Parallel execution)
    console.log('🛰️ Phase 2: Domain Expert Analysis');
    const domainAnalysisPromises = Object.entries(this.domainAgents).map(async ([agentId, agent]) => {
      const agentStart = Date.now();
      const analysis = await agent.analyze(station);
      agentExecutionTimes[agentId] = Date.now() - agentStart;
      return { agentId, analysis };
    });

    const domainResults = await Promise.all(domainAnalysisPromises);
    domainResults.forEach(({ agentId, analysis }) => {
      agentReports[agentId] = analysis;
    });

    // Phase 3: Data Science Analysis (Parallel execution)
    console.log('🔬 Phase 3: Data Science Analysis');
    const dataSciencePromises = Object.entries(this.dataScienceAgents).map(async ([agentId, agent]) => {
      const agentStart = Date.now();
      const analysis = await agent.analyze(station);
      agentExecutionTimes[agentId] = Date.now() - agentStart;
      return { agentId, analysis };
    });

    const dataScienceResults = await Promise.all(dataSciencePromises);
    dataScienceResults.forEach(({ agentId, analysis }) => {
      agentReports[agentId] = analysis;
    });

    // Phase 4: Visualization Development
    console.log('📈 Phase 4: Visualization Development');
    const visualizationStart = Date.now();
    const visualizationReport = await this.developerAgents['Visualization_Developer'].analyze(station);
    agentReports['Visualization_Developer'] = visualizationReport;
    agentExecutionTimes['Visualization_Developer'] = Date.now() - visualizationStart;

    // Phase 5: Consolidate Results
    console.log('🎯 Phase 5: Consolidating Results');
    const overallAssessment = this.consolidateAnalysis(station, agentReports);
    const consolidatedRecommendations = this.consolidateRecommendations(agentReports);
    const riskFactors = this.consolidateRiskFactors(agentReports);
    const confidenceScore = this.calculateOverallConfidence(agentReports);

    const totalExecutionTime = Date.now() - startTime;

    const workflowResult: WorkflowResult = {
      stationId: station.station_id,
      timestamp: new Date(),
      overallAssessment,
      agentReports,
      consolidatedRecommendations,
      riskFactors,
      confidenceScore,
      executionMetrics: {
        totalExecutionTime,
        agentExecutionTimes,
        dataQuality: this.calculateDataQuality(agentReports),
        analysisDepth: this.calculateAnalysisDepth(agentReports)
      }
    };

    console.log(`✅ Analysis complete in ${totalExecutionTime}ms with ${confidenceScore.toFixed(2)} confidence`);
    return workflowResult;
  }

  /**
   * Consolidate individual agent analyses into overall assessment
   */
  private consolidateAnalysis(
    station: GroundStationAnalytics, 
    agentReports: { [agentId: string]: AgentAnalysis }
  ): GroundStationAssessment {
    const satopsReport = agentReports['SATOPS_Expert'];
    const fleetReport = agentReports['Fleet_Analyst'];
    const analyticsReport = agentReports['Analytics_Engineer'];
    const marketReport = agentReports['Market_Intelligence'];

    // Extract key insights from each agent
    const stationCapabilities = satopsReport?.data || {};
    const fleetInsights = fleetReport?.data || {};
    const analyticsInsights = analyticsReport?.data || {};
    const marketInsights = marketReport?.data || {};

    // Consolidate into unified assessment
    const assessment: GroundStationAssessment = {
      stationId: station.station_id,
      capabilities: {
        antennaTypes: station.technical_specs.frequency_bands,
        frequencyBands: station.technical_specs.frequency_bands,
        maxCapacityGbps: station.capacity_metrics.total_capacity_gbps,
        redudancyLevel: station.capacity_metrics.redundancy_level
      },
      coverage: {
        satelliteVisibility: fleetInsights.fleetBreakdown?.ses?.satellites || [],
        optimalElevationRange: [15, 75] as [number, number],
        weatherImpactDays: station.coverage_metrics.weather_impact_days_per_year
      },
      market: {
        demandEstimate: marketInsights.demandAnalysis?.currentDemand || 50,
        competitivePosition: marketInsights.competitiveAnalysis?.marketPosition || 'competitive',
        growthPotential: marketInsights.demandAnalysis?.growthPotential || 25
      },
      technical: {
        terrainImpact: analyticsInsights.terrainAnalysis?.lineOfSightScore || 85,
        lineOfSightObstructions: station.coverage_metrics.line_of_sight_obstructions,
        interferenceRisk: this.assessInterferenceRisk(station)
      }
    };

    return assessment;
  }

  /**
   * Consolidate recommendations from all agents
   */
  private consolidateRecommendations(agentReports: { [agentId: string]: AgentAnalysis }): string[] {
    const allRecommendations: string[] = [];
    
    Object.values(agentReports).forEach(report => {
      if (report.recommendations) {
        allRecommendations.push(...report.recommendations);
      }
    });

    // Prioritize and deduplicate recommendations
    const prioritizedRecommendations = this.prioritizeRecommendations(allRecommendations);
    return prioritizedRecommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Consolidate risk factors from all agents
   */
  private consolidateRiskFactors(agentReports: { [agentId: string]: AgentAnalysis }): string[] {
    const allWarnings: string[] = [];
    
    Object.values(agentReports).forEach(report => {
      if (report.warnings) {
        allWarnings.push(...report.warnings);
      }
    });

    // Remove duplicates and prioritize by severity
    const uniqueWarnings = Array.from(new Set(allWarnings));
    return uniqueWarnings.slice(0, 8); // Top 8 risk factors
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(agentReports: { [agentId: string]: AgentAnalysis }): number {
    const confidenceScores = Object.values(agentReports).map(report => report.confidence);
    const weights = {
      'SATOPS_Expert': 0.25,
      'Fleet_Analyst': 0.25,
      'Analytics_Engineer': 0.20,
      'Market_Intelligence': 0.15,
      'Data_Integration_Developer': 0.10,
      'Visualization_Developer': 0.05
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(agentReports).forEach(([agentId, report]) => {
      const weight = weights[agentId as keyof typeof weights] || 0.1;
      weightedSum += report.confidence * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQuality(agentReports: { [agentId: string]: AgentAnalysis }): number {
    const dataIntegrationReport = agentReports['Data_Integration_Developer'];
    if (dataIntegrationReport?.data?.qualityMetrics) {
      const metrics = dataIntegrationReport.data.qualityMetrics;
      return (metrics.completeness + metrics.accuracy + metrics.consistency + 
              metrics.timeliness + metrics.validity) / 5;
    }
    return 75; // Default reasonable quality score
  }

  /**
   * Calculate analysis depth score
   */
  private calculateAnalysisDepth(agentReports: { [agentId: string]: AgentAnalysis }): number {
    const reportCount = Object.keys(agentReports).length;
    const avgRecommendationsPerAgent = Object.values(agentReports)
      .reduce((sum, report) => sum + (report.recommendations?.length || 0), 0) / reportCount;
    
    // Depth score based on number of agents and recommendations
    const depthScore = (reportCount / 6) * 0.6 + (avgRecommendationsPerAgent / 5) * 0.4;
    return Math.min(100, depthScore * 100);
  }

  /**
   * Prioritize recommendations based on impact and feasibility
   */
  private prioritizeRecommendations(recommendations: string[]): string[] {
    // Simple prioritization based on keywords
    const highPriorityKeywords = ['critical', 'immediate', 'urgent', 'high', 'investment'];
    const mediumPriorityKeywords = ['improve', 'optimize', 'enhance', 'consider'];
    
    const categorized = recommendations.map(rec => {
      let priority = 3; // Low priority default
      
      if (highPriorityKeywords.some(keyword => rec.toLowerCase().includes(keyword))) {
        priority = 1; // High priority
      } else if (mediumPriorityKeywords.some(keyword => rec.toLowerCase().includes(keyword))) {
        priority = 2; // Medium priority
      }
      
      return { recommendation: rec, priority };
    });

    // Sort by priority and remove duplicates
    const sorted = categorized
      .sort((a, b) => a.priority - b.priority)
      .map(item => item.recommendation);
    
    return Array.from(new Set(sorted));
  }

  /**
   * Assess interference risk based on location and technical specs
   */
  private assessInterferenceRisk(station: GroundStationAnalytics): 'low' | 'medium' | 'high' {
    const interferenceZones = station.coverage_metrics.interference_zones?.length || 0;
    const urbanLocation = station.location.country === 'USA' || 
                         station.location.country === 'Germany' ||
                         station.location.country === 'Japan';
    
    if (interferenceZones > 2 || (urbanLocation && station.technical_specs.frequency_bands.includes('Ka-band'))) {
      return 'high';
    } else if (interferenceZones > 0 || urbanLocation) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get domain expertise agents for specific domain
   */
  getDomainExpertise(domain: string): BaseAgent[] {
    switch (domain.toLowerCase()) {
      case 'satellite':
      case 'satops':
        return [this.domainAgents['SATOPS_Expert'], this.domainAgents['Fleet_Analyst']];
      case 'operations':
        return [this.domainAgents['SATOPS_Expert']];
      case 'fleet':
        return [this.domainAgents['Fleet_Analyst']];
      default:
        return Object.values(this.domainAgents);
    }
  }

  /**
   * Get data science agents for specific data type
   */
  getDataScienceInsights(dataType: string): BaseAgent[] {
    switch (dataType.toLowerCase()) {
      case 'analytics':
      case 'data':
        return [this.dataScienceAgents['Analytics_Engineer']];
      case 'market':
      case 'business':
        return [this.dataScienceAgents['Market_Intelligence']];
      default:
        return Object.values(this.dataScienceAgents);
    }
  }

  /**
   * Get developer agents for specific task type
   */
  getDeveloperSupport(taskType: string): BaseAgent[] {
    switch (taskType.toLowerCase()) {
      case 'integration':
      case 'data':
        return [this.developerAgents['Data_Integration_Developer']];
      case 'visualization':
      case 'ui':
        return [this.developerAgents['Visualization_Developer']];
      default:
        return Object.values(this.developerAgents);
    }
  }

  /**
   * Execute targeted analysis with specific agents
   */
  async executeTargetedAnalysis(
    station: GroundStationAnalytics, 
    agentTypes: string[]
  ): Promise<{ [agentId: string]: AgentAnalysis }> {
    const selectedAgents: { [key: string]: BaseAgent } = {};
    
    // Select agents based on types
    agentTypes.forEach(type => {
      switch (type.toLowerCase()) {
        case 'domain':
          Object.assign(selectedAgents, this.domainAgents);
          break;
        case 'datascience':
          Object.assign(selectedAgents, this.dataScienceAgents);
          break;
        case 'developer':
          Object.assign(selectedAgents, this.developerAgents);
          break;
        default:
          // Try to find specific agent
          const allAgents = { ...this.domainAgents, ...this.dataScienceAgents, ...this.developerAgents };
          if (allAgents[type]) {
            selectedAgents[type] = allAgents[type];
          }
      }
    });

    // Execute analysis with selected agents
    const results: { [agentId: string]: AgentAnalysis } = {};
    const analysisPromises = Object.entries(selectedAgents).map(async ([agentId, agent]) => {
      const analysis = await agent.analyze(station);
      return { agentId, analysis };
    });

    const analysisResults = await Promise.all(analysisPromises);
    analysisResults.forEach(({ agentId, analysis }) => {
      results[agentId] = analysis;
    });

    return results;
  }

  /**
   * Mock method to get station data - in production this would load from database
   */
  private mockGetStationData(stationId: string): GroundStationAnalytics {
    // This is a placeholder - in the real implementation, this would load actual station data
    return {
      station_id: stationId,
      name: 'Mock Station',
      operator: 'SES',
      location: {
        latitude: 40.0,
        longitude: -75.0,
        country: 'USA',
        region: 'Northern',
        timezone: 'EST'
      },
      technical_specs: {
        primary_antenna_size_m: 13,
        secondary_antennas: 2,
        frequency_bands: ['C-band', 'Ku-band', 'Ka-band'],
        g_t_ratio_db: 40.5,
        eirp_dbw: 54.0,
        services_supported: ['DTH', 'Enterprise', 'Government']
      },
      utilization_metrics: {
        current_utilization: 75,
        peak_utilization: 90,
        average_utilization: 70,
        utilization_trend: 'stable',
        peak_hours: ['14:00', '20:00'],
        low_utilization_hours: ['04:00'],
        monthly_utilization_history: [
          { month: '2024-01', utilization: 70 },
          { month: '2024-02', utilization: 72 },
          { month: '2024-03', utilization: 75 },
          { month: '2024-04', utilization: 73 },
          { month: '2024-05', utilization: 75 }
        ]
      },
      capacity_metrics: {
        total_capacity_gbps: 150,
        available_capacity_gbps: 37.5,
        used_capacity_gbps: 112.5,
        capacity_efficiency: 85,
        bandwidth_by_service: [
          { service: 'DTH', allocated_gbps: 60, utilization_percentage: 80 },
          { service: 'Enterprise', allocated_gbps: 60, utilization_percentage: 75 },
          { service: 'Government', allocated_gbps: 30, utilization_percentage: 70 }
        ],
        redundancy_level: 90,
        upgrade_potential_gbps: 50
      },
      coverage_metrics: {
        coverage_area_km2: 8000000,
        satellite_visibility_count: 12,
        elevation_angles: { min: 5, max: 90, optimal_range: [15, 75] },
        interference_zones: [],
        weather_impact_days_per_year: 15,
        line_of_sight_obstructions: []
      },
      business_metrics: {
        monthly_revenue: 1800000,
        revenue_per_gbps: 12000,
        revenue_per_antenna: 600000,
        operational_cost_monthly: 540000,
        maintenance_cost_monthly: 60000,
        profit_margin: 66.7,
        customer_count: 900,
        average_contract_value: 2000,
        contract_duration_avg_months: 24,
        churn_rate: 5,
        revenue_growth_rate: 15,
        cost_per_gb_transferred: 0.012,
        sla_compliance_rate: 99.5
      },
      roi_metrics: {
        initial_investment: 7500000,
        annual_roi_percentage: 28.8,
        payback_period_months: 42,
        net_present_value: 9500000,
        internal_rate_of_return: 32.5,
        break_even_point_months: 38,
        expansion_investment_required: 3000000,
        expansion_roi_projection: 31.2
      },
      growth_opportunities: [],
      health_score: 88,
      investment_recommendation: 'excellent',
      last_updated: new Date().toISOString()
    } as GroundStationAnalytics;
  }
}