/**
 * Agent Architecture Types and Interfaces
 */

export interface AgentCapability {
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
}

export interface AgentAnalysis {
  agentId: string;
  timestamp: Date;
  confidence: number;
  data: any;
  recommendations: string[];
  warnings: string[];
}

export interface GroundStationAssessment {
  stationId: string;
  capabilities: {
    antennaTypes: string[];
    frequencyBands: string[];
    maxCapacityGbps: number;
    redudancyLevel: number;
  };
  coverage: {
    satelliteVisibility: SatelliteVisibility[];
    optimalElevationRange: [number, number];
    weatherImpactDays: number;
  };
  market: {
    demandEstimate: number;
    competitivePosition: 'dominant' | 'competitive' | 'challenged';
    growthPotential: number;
  };
  technical: {
    terrainImpact: number;
    lineOfSightObstructions: string[];
    interferenceRisk: 'low' | 'medium' | 'high';
  };
}

export interface SatelliteVisibility {
  satelliteName: string;
  operator: 'SES' | 'Intelsat' | 'Other';
  elevationAngle: number;
  azimuthAngle: number;
  visibilityHours: number;
  frequencyBands: string[];
}

export interface TLEData {
  satelliteName: string;
  line1: string;
  line2: string;
  epoch: Date;
}

export interface WeatherPattern {
  location: {
    latitude: number;
    longitude: number;
  };
  precipitation: number;
  cloudCover: number;
  atmosphericAttenuation: number;
  impactOnSignal: number;
}

export interface MarketData {
  region: string;
  population: number;
  gdpPerCapita: number;
  internetPenetration: number;
  demandEstimate: number;
  competitorCount: number;
}

export interface TerrainData {
  elevation: number;
  slope: number;
  obstructions: string[];
  lineOfSightScore: number;
}

export abstract class BaseAgent {
  abstract agentId: string;
  abstract capabilities: AgentCapability[];
  
  abstract analyze(input: any): Promise<AgentAnalysis>;
  
  protected createAnalysis(
    data: any, 
    confidence: number, 
    recommendations: string[] = [], 
    warnings: string[] = []
  ): AgentAnalysis {
    return {
      agentId: this.agentId,
      timestamp: new Date(),
      confidence,
      data,
      recommendations,
      warnings
    };
  }
}

export interface AgentCoordinator {
  executeWorkflow(stationId: string): Promise<GroundStationAssessment>;
  getDomainExpertise(domain: string): BaseAgent[];
  getDataScienceInsights(dataType: string): BaseAgent[];
  getDeveloperSupport(taskType: string): BaseAgent[];
}