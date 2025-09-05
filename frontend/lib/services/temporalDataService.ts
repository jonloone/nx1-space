/**
 * Temporal Data Service
 * Manages time-based vessel data and historical tracking
 */

interface TemporalVessel {
  id: string;
  positions: Array<{
    lat: number;
    lon: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
    riskScore?: number;
  }>;
  events: Array<{
    type: string;
    timestamp: Date;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface ActivitySnapshot {
  timestamp: Date;
  vesselCount: number;
  totalRisk: number;
  events: number;
  darkVessels: number;
  clusters: number;
}

// Additional interfaces for enhanced timeline functionality
export interface ActivityHeatmapData {
  timestamp: number;
  vesselCount: number;
  encounterCount: number;
  intensity: number; // 0-1 scale
}

export interface VesselEncounter {
  id: string;
  timestamp: number;
  vesselIds: string[];
  type: 'sts_transfer' | 'rendezvous' | 'close_approach' | 'formation';
  location: [number, number];
  distance: number;
  duration: number;
  confidence: number;
  metadata?: {
    transferVolume?: number;
    cargoType?: string;
    suspiciousActivity?: boolean;
  };
}

export class TemporalDataService {
  private historicalData: Map<string, TemporalVessel> = new Map();
  private activityTimeline: ActivitySnapshot[] = [];
  private currentTimeRange: TimeRange;

  constructor() {
    // Initialize with last 30 days
    this.currentTimeRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    };
    
    // Generate initial historical data
    this.generateHistoricalData();
  }

  /**
   * Generate historical vessel data for the demo
   */
  private generateHistoricalData() {
    const vesselCount = 500;
    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;
    
    // Generate vessel tracks for last 30 days
    for (let i = 0; i < vesselCount; i++) {
      const vessel: TemporalVessel = {
        id: `vessel_${i}`,
        positions: [],
        events: []
      };

      // Starting position in South China Sea
      let lat = 3 + Math.random() * 20; // 3°N to 23°N
      let lon = 105 + Math.random() * 15; // 105°E to 120°E
      let heading = Math.random() * 360;
      let speed = 5 + Math.random() * 20; // 5-25 knots
      
      // Generate positions every 6 hours for 30 days
      for (let d = 30; d >= 0; d--) {
        for (let h = 0; h < 24; h += 6) {
          const timestamp = new Date(Date.now() - (d * dayMs) - ((24 - h) * hourMs));
          
          // Update position based on speed and heading
          const distanceNm = speed * 6; // 6 hours of travel
          const distanceDeg = distanceNm / 60;
          
          lat += distanceDeg * Math.cos(heading * Math.PI / 180);
          lon += distanceDeg * Math.sin(heading * Math.PI / 180) / Math.cos(lat * Math.PI / 180);
          
          // Keep within bounds
          lat = Math.max(3, Math.min(23, lat));
          lon = Math.max(105, Math.min(120, lon));
          
          // Randomly adjust heading and speed
          heading = (heading + (Math.random() - 0.5) * 30 + 360) % 360;
          speed = Math.max(0, Math.min(30, speed + (Math.random() - 0.5) * 5));
          
          // Calculate risk score based on behavior
          const riskScore = this.calculateRiskScore(speed, lat, lon, i);
          
          vessel.positions.push({
            lat,
            lon,
            timestamp,
            speed,
            heading,
            riskScore
          });
          
          // Randomly add events
          if (Math.random() < 0.01) {
            vessel.events.push(this.generateEvent(timestamp, riskScore));
          }
        }
      }
      
      this.historicalData.set(vessel.id, vessel);
    }
    
    // Generate activity timeline
    this.generateActivityTimeline();
  }

  /**
   * Calculate risk score based on vessel behavior
   */
  private calculateRiskScore(speed: number, lat: number, lon: number, vesselId: number): number {
    let risk = 20; // Base risk
    
    // Slow speed (potential loitering)
    if (speed < 3) risk += 20;
    
    // Near sensitive areas (Spratly/Paracel)
    if (this.isNearSensitiveArea(lat, lon)) risk += 30;
    
    // Some vessels are inherently suspicious
    if (vesselId % 10 === 0) risk += 25;
    
    // Random anomalies
    if (Math.random() < 0.05) risk += 30;
    
    return Math.min(100, risk);
  }

  /**
   * Check if position is near sensitive areas
   */
  private isNearSensitiveArea(lat: number, lon: number): boolean {
    const sensitiveAreas = [
      { lat: 16.5, lon: 112.0, radius: 2 }, // Paracel Islands
      { lat: 10.0, lon: 114.0, radius: 3 }, // Spratly Islands
      { lat: 15.2, lon: 117.8, radius: 1 }  // Scarborough Shoal
    ];
    
    return sensitiveAreas.some(area => {
      const distance = Math.sqrt(
        Math.pow(lat - area.lat, 2) + 
        Math.pow(lon - area.lon, 2)
      );
      return distance < area.radius;
    });
  }

  /**
   * Generate random event
   */
  private generateEvent(timestamp: Date, riskScore: number) {
    const eventTypes = [
      { type: 'AIS_GAP', description: 'AIS transmission gap detected', severity: 'high' as const },
      { type: 'LOITERING', description: 'Vessel loitering in area', severity: 'medium' as const },
      { type: 'RENDEZVOUS', description: 'Potential rendezvous detected', severity: 'high' as const },
      { type: 'SPEED_CHANGE', description: 'Sudden speed change', severity: 'low' as const },
      { type: 'COURSE_DEVIATION', description: 'Deviation from standard route', severity: 'medium' as const },
      { type: 'DARK_VESSEL', description: 'Dark vessel activity', severity: 'critical' as const }
    ];
    
    const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Higher risk vessels get more severe events
    if (riskScore > 70 && Math.random() < 0.5) {
      event.severity = 'critical';
    }
    
    return {
      ...event,
      timestamp
    };
  }

  /**
   * Generate activity timeline for visualization
   */
  private generateActivityTimeline() {
    const hourMs = 60 * 60 * 1000;
    const now = Date.now();
    
    // Generate hourly snapshots for last 7 days
    for (let h = 168; h >= 0; h--) {
      const timestamp = new Date(now - (h * hourMs));
      
      // Count vessels active at this time
      let vesselCount = 0;
      let totalRisk = 0;
      let eventCount = 0;
      let darkVessels = 0;
      
      this.historicalData.forEach(vessel => {
        const positions = vessel.positions.filter(p => 
          Math.abs(p.timestamp.getTime() - timestamp.getTime()) < hourMs
        );
        
        if (positions.length > 0) {
          vesselCount++;
          totalRisk += positions[0].riskScore || 0;
          
          // Check for dark vessel (no recent AIS)
          const lastPosition = positions[positions.length - 1];
          if (timestamp.getTime() - lastPosition.timestamp.getTime() > 12 * hourMs) {
            darkVessels++;
          }
        }
        
        // Count events in this hour
        eventCount += vessel.events.filter(e =>
          Math.abs(e.timestamp.getTime() - timestamp.getTime()) < hourMs
        ).length;
      });
      
      // Detect clusters (simplified)
      const clusters = Math.floor(vesselCount / 50);
      
      this.activityTimeline.push({
        timestamp,
        vesselCount,
        totalRisk: totalRisk / Math.max(1, vesselCount),
        events: eventCount,
        darkVessels,
        clusters
      });
    }
  }

  /**
   * Get vessels within a time range
   */
  public getVesselsInTimeRange(timeRange: TimeRange): any[] {
    const vessels: any[] = [];
    
    this.historicalData.forEach((vessel, id) => {
      // Find positions within time range
      const positions = vessel.positions.filter(p =>
        p.timestamp >= timeRange.start && p.timestamp <= timeRange.end
      );
      
      if (positions.length > 0) {
        const latestPosition = positions[positions.length - 1];
        vessels.push({
          id,
          lat: latestPosition.lat,
          lon: latestPosition.lon,
          speed: latestPosition.speed,
          heading: latestPosition.heading,
          riskScore: latestPosition.riskScore,
          lastUpdate: latestPosition.timestamp.toISOString(),
          trackHistory: positions.map(p => ({
            lat: p.lat,
            lon: p.lon,
            timestamp: p.timestamp.toISOString()
          }))
        });
      }
    });
    
    return vessels;
  }

  /**
   * Get vessel tracks for a specific time range
   */
  public getVesselTracks(vesselIds: string[], timeRange: TimeRange) {
    const tracks: any[] = [];
    
    vesselIds.forEach(id => {
      const vessel = this.historicalData.get(id);
      if (vessel) {
        const positions = vessel.positions.filter(p =>
          p.timestamp >= timeRange.start && p.timestamp <= timeRange.end
        );
        
        if (positions.length > 1) {
          tracks.push({
            id: `track-${id}`,
            vesselId: id,
            path: positions.map(p => [p.lon, p.lat]),
            timestamps: positions.map(p => p.timestamp.toISOString()),
            riskScores: positions.map(p => p.riskScore || 0)
          });
        }
      }
    });
    
    return tracks;
  }

  /**
   * Get activity timeline data
   */
  public getActivityTimeline(hours: number = 168): ActivitySnapshot[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.activityTimeline.filter(snapshot =>
      snapshot.timestamp.getTime() >= cutoff
    );
  }

  /**
   * Get current statistics
   */
  public getCurrentStats() {
    const latest = this.activityTimeline[this.activityTimeline.length - 1];
    return {
      totalVessels: latest?.vesselCount || 0,
      averageRisk: latest?.totalRisk || 0,
      activeEvents: latest?.events || 0,
      darkVessels: latest?.darkVessels || 0,
      detectedClusters: latest?.clusters || 0
    };
  }

  /**
   * Get vessels at a specific point in time
   */
  public getVesselsAtTime(timestamp: Date): any[] {
    const vessels: any[] = [];
    const hourMs = 60 * 60 * 1000;
    
    this.historicalData.forEach((vessel, id) => {
      // Find closest position to timestamp
      const position = vessel.positions.find(p =>
        Math.abs(p.timestamp.getTime() - timestamp.getTime()) < hourMs
      );
      
      if (position) {
        vessels.push({
          id,
          lat: position.lat,
          lon: position.lon,
          speed: position.speed,
          heading: position.heading,
          riskScore: position.riskScore,
          timestamp: position.timestamp.toISOString()
        });
      }
    });
    
    return vessels;
  }

  /**
   * Update time range
   */
  public setTimeRange(start: Date, end: Date) {
    this.currentTimeRange = { start, end };
  }

  /**
   * Get heatmap data for activity visualization
   */
  public getHeatmapData(timeRange?: TimeRange) {
    const range = timeRange || this.currentTimeRange;
    const vessels = this.getVesselsInTimeRange(range);
    
    return vessels.map(v => ({
      lat: v.lat,
      lon: v.lon,
      weight: 1,
      riskScore: v.riskScore
    }));
  }

  /**
   * Detect encounters between vessels for enhanced timeline
   */
  public detectEncounters(timeRange: TimeRange): VesselEncounter[] {
    const encounters: VesselEncounter[] = [];
    const encounterThreshold = 0.05; // Approx 500m in degrees
    const hourMs = 60 * 60 * 1000;
    
    const start = timeRange.start.getTime();
    const end = timeRange.end.getTime();
    
    // Sample every hour
    for (let t = start; t <= end; t += hourMs) {
      const timestamp = new Date(t);
      const vessels = this.getVesselsAtTime(timestamp);
      
      // Check all vessel pairs
      for (let i = 0; i < vessels.length; i++) {
        for (let j = i + 1; j < vessels.length; j++) {
          const v1 = vessels[i];
          const v2 = vessels[j];
          
          const distance = Math.sqrt(
            Math.pow(v1.lat - v2.lat, 2) + 
            Math.pow(v1.lon - v2.lon, 2)
          );
          
          if (distance <= encounterThreshold) {
            const encounterType = this.classifyEncounter(v1, v2, distance);
            
            encounters.push({
              id: `encounter_${t}_${v1.id}_${v2.id}`,
              timestamp: t,
              vesselIds: [v1.id, v2.id],
              type: encounterType,
              location: [(v1.lat + v2.lat) / 2, (v1.lon + v2.lon) / 2],
              distance: distance * 111000, // Convert to meters (rough)
              duration: hourMs,
              confidence: this.calculateEncounterConfidence(v1, v2, distance),
              metadata: this.generateEncounterMetadata(v1, v2, encounterType)
            });
          }
        }
      }
    }
    
    return encounters;
  }

  /**
   * Classify encounter type based on vessel characteristics
   */
  private classifyEncounter(v1: any, v2: any, distance: number): VesselEncounter['type'] {
    // Very close + slow = likely STS transfer
    if (distance <= 0.01 && (v1.speed < 3 && v2.speed < 3)) {
      return 'sts_transfer';
    }
    
    // Close + similar speed = rendezvous
    if (distance <= 0.02 && Math.abs(v1.speed - v2.speed) < 2) {
      return 'rendezvous';
    }
    
    // Close approach
    if (distance <= 0.03) {
      return 'close_approach';
    }
    
    return 'formation';
  }

  /**
   * Calculate confidence score for encounter
   */
  private calculateEncounterConfidence(v1: any, v2: any, distance: number): number {
    let confidence = 1.0;
    
    // Reduce confidence for distant encounters
    if (distance > 0.03) confidence *= 0.7;
    if (distance > 0.04) confidence *= 0.5;
    
    // Increase confidence for slow vessels (intentional meeting)
    if (v1.speed < 3 && v2.speed < 3) confidence *= 1.2;
    
    // High risk vessels increase confidence
    if (v1.riskScore > 70 || v2.riskScore > 70) confidence *= 1.1;
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }

  /**
   * Generate encounter metadata
   */
  private generateEncounterMetadata(v1: any, v2: any, type: VesselEncounter['type']): VesselEncounter['metadata'] {
    if (type === 'sts_transfer') {
      return {
        transferVolume: Math.round(Math.random() * 50000) + 10000,
        cargoType: 'petroleum',
        suspiciousActivity: v1.riskScore > 70 || v2.riskScore > 70
      };
    }
    
    return {
      suspiciousActivity: (v1.riskScore + v2.riskScore) / 2 > 60
    };
  }

  /**
   * Generate activity heatmap for timeline visualization
   */
  public generateTimelineHeatmap(timeRange: TimeRange, bins: number = 100): ActivityHeatmapData[] {
    const binSize = (timeRange.end.getTime() - timeRange.start.getTime()) / bins;
    const heatmapData: ActivityHeatmapData[] = [];
    
    // Detect encounters first
    const encounters = this.detectEncounters(timeRange);
    
    for (let i = 0; i < bins; i++) {
      const binStart = timeRange.start.getTime() + (i * binSize);
      const binEnd = binStart + binSize;
      
      // Count vessels in this time bin
      const binVessels = this.getVesselsAtTime(new Date(binStart + binSize/2));
      const vesselCount = binVessels.length;
      
      // Count encounters in this time bin
      const binEncounters = encounters.filter(e => 
        e.timestamp >= binStart && e.timestamp < binEnd
      );
      const encounterCount = binEncounters.length;
      
      // Calculate intensity based on activity
      const maxExpectedVessels = 200;
      const maxExpectedEncounters = 20;
      
      const vesselIntensity = Math.min(1, vesselCount / maxExpectedVessels);
      const encounterIntensity = Math.min(1, encounterCount / maxExpectedEncounters);
      const combinedIntensity = Math.max(vesselIntensity, encounterIntensity * 2);
      
      heatmapData.push({
        timestamp: binStart + binSize/2,
        vesselCount,
        encounterCount,
        intensity: combinedIntensity
      });
    }
    
    return heatmapData;
  }
}

// Export singleton instance
export const temporalDataService = new TemporalDataService();