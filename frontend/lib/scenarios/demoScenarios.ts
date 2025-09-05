import { DemoNarrative, VesselTrip, VesselEncounter, TimelineRange } from '@/types/maritime';

/**
 * Maritime Intelligence Demo Scenarios for DoD Presentations
 */

// Scenario 1: South China Sea STS Transfer Operation
export const southChinaSeaSTS: DemoNarrative = {
  id: 'scs_sts_demo',
  name: 'South China Sea STS Transfer Analysis',
  description: 'Detection and analysis of a suspicious ship-to-ship transfer operation involving sanctioned vessels in international waters.',
  duration: 25, // minutes
  
  timeRange: {
    start: new Date('2024-03-15T14:00:00Z'),
    end: new Date('2024-03-16T02:00:00Z')
  },
  
  initialView: {
    center: [114.5, 16.8], // South China Sea
    zoom: 8
  },
  
  steps: [
    {
      id: 'overview',
      title: 'Regional Maritime Overview',
      description: 'Initial surveillance of South China Sea shipping traffic',
      action: 'PAN',
      target: { position: [114.5, 16.8] },
      duration: 45,
      narration: 'Our maritime intelligence platform monitors over 200 vessels daily in the South China Sea. Today we detected anomalous behavior patterns suggesting coordinated operations between multiple vessels.'
    },
    {
      id: 'anomaly_detection',
      title: 'Anomaly Detection Alert',
      description: 'AI system flags suspicious vessel convergence',
      action: 'ALERT',
      duration: 30,
      narration: 'At 1423 hours, our AI-powered anomaly detection system identified two tankers deviating from standard shipping lanes and reducing speed in international waters.'
    },
    {
      id: 'vessel_tracking',
      title: 'Vessel Identification',
      description: 'Track and identify the suspicious vessels',
      action: 'SELECT',
      target: { vesselId: 'vessel_tanker_001' },
      duration: 60,
      narration: 'Vessel Alpha: MT SHADOW TRADER, IMO 9234567, flagged under Liberian registry. This vessel has been on our watch list due to previous sanctions violations.'
    },
    {
      id: 'sts_detection',
      title: 'STS Transfer Detection',
      description: 'Vessels maintain close proximity for extended period',
      action: 'ZOOM',
      target: { position: [114.2, 16.5] },
      duration: 90,
      narration: 'Both vessels maintained speeds below 2 knots within 80 meters of each other for over 3 hours - classic indicators of ship-to-ship transfer operations.'
    },
    {
      id: 'intelligence_analysis',
      title: 'Intelligence Assessment',
      description: 'Generate comprehensive intelligence report',
      action: 'ANALYZE',
      duration: 75,
      narration: 'Analysis indicates probable transfer of approximately 25,000 barrels of crude oil, potentially circumventing sanctions on Iranian petroleum exports.'
    }
  ],
  
  keyEvents: [
    {
      timestamp: new Date('2024-03-15T14:23:00Z').getTime(),
      type: 'suspicious_activity',
      title: 'Course Deviation Detected',
      description: 'MT SHADOW TRADER deviates from declared shipping lane',
      location: [114.8, 17.2],
      involvedVessels: ['vessel_tanker_001'],
      significance: 'medium'
    },
    {
      timestamp: new Date('2024-03-15T15:45:00Z').getTime(),
      type: 'rendezvous',
      title: 'Vessel Convergence',
      description: 'Two tankers approach within 500 meters',
      location: [114.2, 16.5],
      involvedVessels: ['vessel_tanker_001', 'vessel_tanker_002'],
      significance: 'high'
    },
    {
      timestamp: new Date('2024-03-15T16:00:00Z').getTime(),
      type: 'sts_transfer',
      title: 'STS Transfer Operation',
      description: 'Vessels maintain close formation with minimal speed',
      location: [114.2, 16.5],
      involvedVessels: ['vessel_tanker_001', 'vessel_tanker_002'],
      significance: 'critical'
    },
    {
      timestamp: new Date('2024-03-15T19:30:00Z').getTime(),
      type: 'vessel_departure',
      title: 'Operation Completion',
      description: 'Vessels separate and resume normal transit speeds',
      location: [114.2, 16.5],
      involvedVessels: ['vessel_tanker_001', 'vessel_tanker_002'],
      significance: 'high'
    }
  ],
  
  narrativeSegments: [
    {
      id: 'intro',
      timestamp: new Date('2024-03-15T14:00:00Z').getTime(),
      title: 'Maritime Domain Awareness',
      content: 'The South China Sea represents one of the world\'s most critical shipping lanes, handling over $3.4 trillion in annual trade. Our intelligence platform provides real-time monitoring and analysis of vessel movements, enabling early detection of sanctions evasion, illegal fishing, and other illicit maritime activities.',
      mediaType: 'text',
      duration: 60000,
      autoAdvance: true
    },
    {
      id: 'detection',
      timestamp: new Date('2024-03-15T15:45:00Z').getTime(),
      title: 'AI-Powered Threat Detection',
      content: 'Machine learning algorithms analyze vessel behavior patterns, speed changes, and route deviations to identify potential threats. The system processes over 100,000 AIS messages hourly and correlates data from multiple intelligence sources.',
      mediaType: 'chart',
      duration: 90000,
      autoAdvance: false
    },
    {
      id: 'analysis',
      timestamp: new Date('2024-03-15T19:30:00Z').getTime(),
      title: 'Intelligence Product Generation',
      content: 'Automated analysis generates actionable intelligence reports including vessel profiles, transfer volume estimates, regulatory violations, and recommended interdiction strategies. Reports are distributed to relevant agencies within 15 minutes of event detection.',
      mediaType: 'vessel_detail',
      duration: 120000,
      autoAdvance: false
    }
  ],
  
  focusVessels: ['vessel_tanker_001', 'vessel_tanker_002']
};

// Scenario 2: Baltic Sea Dark Fleet Operations
export const balticSeaDarkFleet: DemoNarrative = {
  id: 'baltic_dark_fleet',
  name: 'Baltic Sea Dark Fleet Investigation',
  description: 'Tracking shadow fleet vessels using alternative identification methods when AIS is disabled.',
  duration: 20,
  
  timeRange: {
    start: new Date('2024-02-10T08:00:00Z'),
    end: new Date('2024-02-11T20:00:00Z')
  },
  
  initialView: {
    center: [19.5, 58.5], // Baltic Sea
    zoom: 6
  },
  
  steps: [
    {
      id: 'ais_gap_detection',
      title: 'AIS Gap Analysis',
      description: 'Identify vessels with suspicious AIS transmission patterns',
      action: 'FILTER',
      duration: 60,
      narration: 'Multiple vessels showing extended AIS gaps while transiting sensitive areas near Kaliningrad and Finnish territorial waters.'
    },
    {
      id: 'satellite_correlation',
      title: 'Multi-Source Intelligence Fusion',
      description: 'Correlate AIS data with satellite imagery and radar',
      action: 'ANALYZE',
      duration: 90,
      narration: 'By fusing AIS data with synthetic aperture radar and optical satellite imagery, we can track vessels even when they disable their transponders.'
    },
    {
      id: 'pattern_analysis',
      title: 'Behavioral Pattern Recognition',
      description: 'Analyze coordinated movement patterns',
      action: 'SELECT',
      target: { area: { north: 60.5, south: 56.0, east: 21.0, west: 18.0 } },
      duration: 75,
      narration: 'Seven vessels showing coordinated behavior consistent with shadow fleet operations - synchronized route changes and simultaneous AIS blackouts.'
    }
  ],
  
  keyEvents: [
    {
      timestamp: new Date('2024-02-10T12:30:00Z').getTime(),
      type: 'ais_gap',
      title: 'AIS Transmission Ceases',
      description: 'Tanker MT BALTIC SHADOW disables AIS transponder',
      location: [20.2, 58.8],
      involvedVessels: ['vessel_tanker_003'],
      significance: 'high'
    },
    {
      timestamp: new Date('2024-02-10T18:00:00Z').getTime(),
      type: 'suspicious_activity',
      title: 'Coordinated Movement Pattern',
      description: 'Multiple vessels change course simultaneously',
      location: [19.8, 58.2],
      involvedVessels: ['vessel_tanker_003', 'vessel_tanker_004', 'vessel_bulk_001'],
      significance: 'critical'
    }
  ],
  
  narrativeSegments: [
    {
      id: 'dark_fleet_intro',
      timestamp: new Date('2024-02-10T08:00:00Z').getTime(),
      title: 'Shadow Fleet Operations',
      content: 'Russia\'s shadow fleet consists of aging tankers used to circumvent oil sanctions. These vessels often disable AIS transponders, use false documentation, and operate through complex ownership structures to obscure their activities.',
      mediaType: 'text',
      duration: 90000
    },
    {
      id: 'detection_methods',
      timestamp: new Date('2024-02-10T12:30:00Z').getTime(),
      title: 'Advanced Detection Techniques',
      content: 'Our platform employs machine learning to identify shadow fleet vessels through behavioral analysis, satellite imagery correlation, and network analysis of vessel ownership and management structures.',
      mediaType: 'map_view',
      duration: 120000
    }
  ],
  
  focusVessels: ['vessel_tanker_003', 'vessel_tanker_004', 'vessel_bulk_001']
};

// Scenario 3: Persian Gulf Surveillance Network
export const persianGulfSurveillance: DemoNarrative = {
  id: 'persian_gulf_surveillance',
  name: 'Persian Gulf Maritime Surveillance',
  description: 'Monitoring high-value military and commercial assets in the strategic Strait of Hormuz.',
  duration: 18,
  
  timeRange: {
    start: new Date('2024-04-20T06:00:00Z'),
    end: new Date('2024-04-20T18:00:00Z')
  },
  
  initialView: {
    center: [56.5, 26.5], // Persian Gulf
    zoom: 7
  },
  
  steps: [
    {
      id: 'strait_monitoring',
      title: 'Strait of Hormuz Transit Analysis',
      description: 'Monitor critical energy infrastructure and shipping',
      action: 'PAN',
      target: { position: [56.2, 26.1] },
      duration: 45,
      narration: 'The Strait of Hormuz handles 21% of global petroleum liquids transit. Our system monitors over 50 transits daily including LNG carriers, crude oil tankers, and naval vessels.'
    },
    {
      id: 'threat_assessment',
      title: 'Maritime Threat Assessment',
      description: 'Identify potential threats to commercial shipping',
      action: 'ANALYZE',
      duration: 90,
      narration: 'Real-time threat assessment combining vessel tracking, intelligence reports, and predictive modeling to identify potential maritime security incidents.'
    }
  ],
  
  keyEvents: [
    {
      timestamp: new Date('2024-04-20T09:15:00Z').getTime(),
      type: 'suspicious_activity',
      title: 'Unusual Naval Activity',
      description: 'Multiple fast attack craft converging near shipping lanes',
      location: [56.1, 26.0],
      involvedVessels: ['naval_vessel_001', 'naval_vessel_002'],
      significance: 'critical'
    }
  ],
  
  narrativeSegments: [
    {
      id: 'strategic_importance',
      timestamp: new Date('2024-04-20T06:00:00Z').getTime(),
      title: 'Strategic Maritime Chokepoint',
      content: 'The Strait of Hormuz is the world\'s most important oil transit chokepoint. Disruption could affect global energy markets and require U.S. naval intervention to maintain freedom of navigation.',
      mediaType: 'text',
      duration: 75000
    }
  ],
  
  focusVessels: ['lng_carrier_001', 'crude_tanker_005', 'naval_vessel_001']
};

// Scenario 4: Illegal Fishing Detection
export const illegalFishingDetection: DemoNarrative = {
  id: 'illegal_fishing_detection',
  name: 'IUU Fishing Fleet Detection',
  description: 'Identifying and tracking illegal, unreported, and unregulated (IUU) fishing operations.',
  duration: 15,
  
  timeRange: {
    start: new Date('2024-05-12T20:00:00Z'),
    end: new Date('2024-05-13T08:00:00Z')
  },
  
  initialView: {
    center: [125.0, 35.0], // East China Sea
    zoom: 6
  },
  
  steps: [
    {
      id: 'fishing_fleet_detection',
      title: 'Dark Fishing Fleet Identification',
      description: 'Detect fishing vessels operating with disabled AIS',
      action: 'FILTER',
      duration: 60,
      narration: 'Satellite analysis reveals over 300 fishing vessels operating in protected waters with disabled or spoofed AIS transponders.'
    },
    {
      id: 'eez_violations',
      title: 'EEZ Violation Analysis',
      description: 'Identify vessels fishing in prohibited waters',
      action: 'SELECT',
      target: { area: { north: 38.0, south: 32.0, east: 128.0, west: 122.0 } },
      duration: 90,
      narration: 'Multiple fishing vessels detected within South Korean Exclusive Economic Zone without proper permits, indicating coordinated IUU fishing operations.'
    }
  ],
  
  keyEvents: [
    {
      timestamp: new Date('2024-05-12T22:30:00Z').getTime(),
      type: 'suspicious_activity',
      title: 'EEZ Intrusion Detected',
      description: 'Large fishing fleet crosses into protected waters',
      location: [126.5, 35.8],
      involvedVessels: ['fishing_vessel_001', 'fishing_vessel_002', 'fishing_vessel_003'],
      significance: 'high'
    }
  ],
  
  narrativeSegments: [
    {
      id: 'iuu_fishing_impact',
      timestamp: new Date('2024-05-12T20:00:00Z').getTime(),
      title: 'IUU Fishing Global Impact',
      content: 'Illegal fishing costs the global economy $23 billion annually and threatens marine ecosystems. China\'s distant-water fishing fleet operates over 17,000 vessels worldwide, many engaging in IUU activities.',
      mediaType: 'text',
      duration: 90000
    }
  ],
  
  focusVessels: ['fishing_vessel_001', 'fishing_vessel_002', 'fishing_vessel_003']
};

// Demo Scenario Manager
export class DemoScenarioManager {
  private scenarios: Map<string, DemoNarrative>;
  private currentScenario: DemoNarrative | null = null;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private stepStartTime: number = 0;

  constructor() {
    this.scenarios = new Map([
      [southChinaSeaSTS.id, southChinaSeaSTS],
      [balticSeaDarkFleet.id, balticSeaDarkFleet],
      [persianGulfSurveillance.id, persianGulfSurveillance],
      [illegalFishingDetection.id, illegalFishingDetection]
    ]);
  }

  getScenarios(): DemoNarrative[] {
    return Array.from(this.scenarios.values());
  }

  getScenario(id: string): DemoNarrative | null {
    return this.scenarios.get(id) || null;
  }

  loadScenario(id: string): boolean {
    const scenario = this.scenarios.get(id);
    if (scenario) {
      this.currentScenario = scenario;
      this.currentStep = 0;
      this.isPlaying = false;
      return true;
    }
    return false;
  }

  getCurrentScenario(): DemoNarrative | null {
    return this.currentScenario;
  }

  getCurrentStep(): any {
    if (!this.currentScenario || this.currentStep >= this.currentScenario.steps.length) {
      return null;
    }
    return this.currentScenario.steps[this.currentStep];
  }

  nextStep(): boolean {
    if (this.currentScenario && this.currentStep < this.currentScenario.steps.length - 1) {
      this.currentStep++;
      this.stepStartTime = Date.now();
      return true;
    }
    return false;
  }

  previousStep(): boolean {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.stepStartTime = Date.now();
      return true;
    }
    return false;
  }

  jumpToStep(stepIndex: number): boolean {
    if (this.currentScenario && stepIndex >= 0 && stepIndex < this.currentScenario.steps.length) {
      this.currentStep = stepIndex;
      this.stepStartTime = Date.now();
      return true;
    }
    return false;
  }

  play(): void {
    this.isPlaying = true;
    this.stepStartTime = Date.now();
  }

  pause(): void {
    this.isPlaying = false;
  }

  isScenarioPlaying(): boolean {
    return this.isPlaying;
  }

  getProgress(): { step: number; totalSteps: number; stepProgress: number } {
    if (!this.currentScenario) {
      return { step: 0, totalSteps: 0, stepProgress: 0 };
    }

    const currentStepData = this.getCurrentStep();
    const stepProgress = currentStepData ? 
      Math.min(1, (Date.now() - this.stepStartTime) / (currentStepData.duration * 1000)) : 0;

    return {
      step: this.currentStep + 1,
      totalSteps: this.currentScenario.steps.length,
      stepProgress
    };
  }

  // Generate vessel trip data for scenarios
  generateScenarioVesselTrips(scenario: DemoNarrative): VesselTrip[] {
    const trips: VesselTrip[] = [];

    scenario.focusVessels.forEach((vesselId, index) => {
      const path = this.generateVesselPath(scenario, vesselId);
      const timestamps = this.generateTimestamps(scenario.timeRange, path.length);
      
      trips.push({
        id: `trip_${vesselId}`,
        vesselId,
        path,
        timestamps,
        speeds: this.generateSpeeds(path.length, scenario),
        headings: this.generateHeadings(path),
        riskScores: this.generateRiskScores(path.length, vesselId),
        encounters: this.getVesselEncounters(scenario, vesselId)
      });
    });

    return trips;
  }

  private generateVesselPath(scenario: DemoNarrative, vesselId: string): [number, number][] {
    const path: [number, number][] = [];
    const centerLon = scenario.initialView.center[0];
    const centerLat = scenario.initialView.center[1];
    
    // Generate path based on scenario and vessel ID
    const pathLength = 50; // Number of points
    const radius = 0.5; // Degrees
    
    for (let i = 0; i < pathLength; i++) {
      const angle = (i / pathLength) * 2 * Math.PI;
      const distance = radius * (0.5 + 0.5 * Math.sin(i * 0.1));
      
      path.push([
        centerLon + Math.cos(angle) * distance,
        centerLat + Math.sin(angle) * distance
      ]);
    }
    
    return path;
  }

  private generateTimestamps(timeRange: TimelineRange, pathLength: number): number[] {
    const start = timeRange.start.getTime();
    const end = timeRange.end.getTime();
    const interval = (end - start) / (pathLength - 1);
    
    return Array.from({ length: pathLength }, (_, i) => start + i * interval);
  }

  private generateSpeeds(pathLength: number, scenario: DemoNarrative): number[] {
    return Array.from({ length: pathLength }, (_, i) => {
      // Lower speeds during encounters
      const baseSpeed = 12 + Math.random() * 8;
      return scenario.keyEvents.some(event => 
        event.type === 'sts_transfer' || event.type === 'rendezvous'
      ) && i > pathLength * 0.3 && i < pathLength * 0.7 ? 
        Math.random() * 3 : baseSpeed;
    });
  }

  private generateHeadings(path: [number, number][]): number[] {
    const headings: number[] = [];
    
    for (let i = 0; i < path.length; i++) {
      if (i === 0) {
        headings.push(Math.random() * 360);
      } else {
        const prevPoint = path[i - 1];
        const currPoint = path[i];
        const heading = Math.atan2(
          currPoint[0] - prevPoint[0],
          currPoint[1] - prevPoint[1]
        ) * (180 / Math.PI);
        headings.push((heading + 360) % 360);
      }
    }
    
    return headings;
  }

  private generateRiskScores(pathLength: number, vesselId: string): number[] {
    const baseRisk = vesselId.includes('tanker') ? 60 : 40;
    return Array.from({ length: pathLength }, () => 
      Math.max(0, Math.min(100, baseRisk + (Math.random() - 0.5) * 30))
    );
  }

  private getVesselEncounters(scenario: DemoNarrative, vesselId: string): VesselEncounter[] {
    return scenario.keyEvents
      .filter(event => event.involvedVessels.includes(vesselId))
      .map(event => ({
        id: `encounter_${event.timestamp}_${vesselId}`,
        timestamp: event.timestamp,
        vesselIds: event.involvedVessels,
        type: this.mapEventTypeToEncounterType(event.type),
        location: event.location,
        distance: 100,
        duration: 3600000,
        confidence: 0.85,
        severity: event.significance as VesselEncounter['severity'],
        metadata: {
          suspiciousActivity: event.significance === 'critical'
        }
      }));
  }

  private mapEventTypeToEncounterType(eventType: string): VesselEncounter['type'] {
    switch (eventType) {
      case 'sts_transfer': return 'sts_transfer';
      case 'rendezvous': return 'rendezvous';
      case 'suspicious_activity': return 'close_approach';
      default: return 'formation';
    }
  }
}

// Export singleton instance
export const demoScenarioManager = new DemoScenarioManager();