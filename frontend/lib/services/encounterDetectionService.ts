import { TemporalVesselData, VesselEncounter, VesselTrip } from '@/types/maritime';

export interface EncounterDetectionConfig {
  // Distance thresholds (meters)
  stsTransferThreshold: number;
  rendezvousThreshold: number;
  closeApproachThreshold: number;
  formationThreshold: number;
  
  // Time thresholds (milliseconds)
  minimumEncounterDuration: number;
  maximumEncounterDuration: number;
  
  // Speed thresholds (knots)
  slowSpeedThreshold: number;
  stopSpeedThreshold: number;
  
  // Analysis parameters
  samplingInterval: number; // milliseconds
  confidenceThreshold: number; // 0-1
  
  // Environmental factors
  considerWeather: boolean;
  considerSeaState: boolean;
  considerRegulatoryZones: boolean;
}

export class EncounterDetectionService {
  private config: EncounterDetectionConfig;
  
  constructor(config?: Partial<EncounterDetectionConfig>) {
    this.config = {
      stsTransferThreshold: 100,     // 100m for STS transfers
      rendezvousThreshold: 500,      // 500m for rendezvous
      closeApproachThreshold: 1000,  // 1km for close approach
      formationThreshold: 2000,      // 2km for formation
      
      minimumEncounterDuration: 300000,  // 5 minutes
      maximumEncounterDuration: 14400000, // 4 hours
      
      slowSpeedThreshold: 3,         // 3 knots
      stopSpeedThreshold: 1,         // 1 knot
      
      samplingInterval: 300000,      // 5 minutes
      confidenceThreshold: 0.6,      // 60% confidence
      
      considerWeather: true,
      considerSeaState: true,
      considerRegulatoryZones: true,
      
      ...config
    };
  }

  /**
   * Detect encounters between all vessels in a given time range
   */
  detectEncounters(
    vesselTrips: VesselTrip[],
    startTime: number,
    endTime: number
  ): VesselEncounter[] {
    const encounters: VesselEncounter[] = [];
    const potentialEncounters: Map<string, any> = new Map();

    // Sample at regular intervals
    for (let t = startTime; t <= endTime; t += this.config.samplingInterval) {
      const vessels = this.getVesselsAtTime(vesselTrips, t);
      
      // Check all vessel pairs
      for (let i = 0; i < vessels.length; i++) {
        for (let j = i + 1; j < vessels.length; j++) {
          const vessel1 = vessels[i];
          const vessel2 = vessels[j];
          
          const distance = this.calculateDistance(vessel1.position, vessel2.position);
          const encounterKey = this.getEncounterKey(vessel1.vesselId, vessel2.vesselId);
          
          if (distance <= this.config.formationThreshold) {
            if (!potentialEncounters.has(encounterKey)) {
              potentialEncounters.set(encounterKey, {
                vesselIds: [vessel1.vesselId, vessel2.vesselId],
                startTime: t,
                endTime: t,
                minDistance: distance,
                maxDistance: distance,
                positions: [],
                speeds: [],
                headings: []
              });
            }
            
            const encounter = potentialEncounters.get(encounterKey)!;
            encounter.endTime = t;
            encounter.minDistance = Math.min(encounter.minDistance, distance);
            encounter.maxDistance = Math.max(encounter.maxDistance, distance);
            encounter.positions.push({
              timestamp: t,
              vessel1Pos: vessel1.position,
              vessel2Pos: vessel2.position,
              distance
            });
            encounter.speeds.push({
              vessel1Speed: vessel1.speed || 0,
              vessel2Speed: vessel2.speed || 0
            });
            encounter.headings.push({
              vessel1Heading: vessel1.heading || 0,
              vessel2Heading: vessel2.heading || 0
            });
          } else {
            // End encounter if vessels move apart
            if (potentialEncounters.has(encounterKey)) {
              const encounter = potentialEncounters.get(encounterKey)!;
              const duration = encounter.endTime - encounter.startTime;
              
              if (duration >= this.config.minimumEncounterDuration) {
                const detectedEncounter = this.analyzeEncounter(encounter);
                if (detectedEncounter && detectedEncounter.confidence >= this.config.confidenceThreshold) {
                  encounters.push(detectedEncounter);
                }
              }
              
              potentialEncounters.delete(encounterKey);
            }
          }
        }
      }
    }

    // Process remaining potential encounters
    potentialEncounters.forEach((encounter) => {
      const duration = encounter.endTime - encounter.startTime;
      if (duration >= this.config.minimumEncounterDuration) {
        const detectedEncounter = this.analyzeEncounter(encounter);
        if (detectedEncounter && detectedEncounter.confidence >= this.config.confidenceThreshold) {
          encounters.push(detectedEncounter);
        }
      }
    });

    return encounters.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Detect specific encounter types with advanced algorithms
   */
  detectSTSTransfers(vesselTrips: VesselTrip[], timeRange: { start: number; end: number }): VesselEncounter[] {
    const stsEncounters: VesselEncounter[] = [];
    
    // Look for pairs of vessels that come very close and maintain slow speeds
    for (let i = 0; i < vesselTrips.length; i++) {
      for (let j = i + 1; j < vesselTrips.length; j++) {
        const trip1 = vesselTrips[i];
        const trip2 = vesselTrips[j];
        
        const stsEvent = this.analyzePotentialSTS(trip1, trip2, timeRange);
        if (stsEvent) {
          stsEncounters.push(stsEvent);
        }
      }
    }
    
    return stsEncounters;
  }

  /**
   * Analyze a potential encounter and determine its type and characteristics
   */
  private analyzeEncounter(potentialEncounter: any): VesselEncounter | null {
    const {
      vesselIds,
      startTime,
      endTime,
      minDistance,
      maxDistance,
      positions,
      speeds,
      headings
    } = potentialEncounter;

    const duration = endTime - startTime;
    const avgDistance = positions.reduce((sum: number, pos: any) => sum + pos.distance, 0) / positions.length;
    const avgSpeeds = this.calculateAverageSpeeds(speeds);
    const centerPosition = this.calculateCenterPosition(positions);

    // Determine encounter type
    const encounterType = this.classifyEncounter({
      minDistance,
      avgDistance,
      duration,
      avgSpeeds,
      positions,
      headings
    });

    // Calculate confidence score
    const confidence = this.calculateConfidence({
      minDistance,
      avgDistance,
      duration,
      avgSpeeds,
      encounterType,
      positionConsistency: this.calculatePositionConsistency(positions)
    });

    const severity = this.calculateSeverity(encounterType, minDistance, avgSpeeds, duration);

    return {
      id: `encounter_${startTime}_${vesselIds[0]}_${vesselIds[1]}`,
      timestamp: startTime + (duration / 2), // Midpoint of encounter
      vesselIds,
      type: encounterType,
      location: centerPosition,
      distance: minDistance,
      duration,
      confidence,
      severity,
      metadata: {
        transferVolume: encounterType === 'sts_transfer' ? this.estimateTransferVolume(duration, avgSpeeds) : undefined,
        cargoType: encounterType === 'sts_transfer' ? this.estimateCargoType(vesselIds) : undefined,
        suspiciousActivity: this.detectSuspiciousActivity({
          encounterType,
          minDistance,
          duration,
          avgSpeeds,
          timeOfDay: new Date(startTime).getHours()
        }),
        weatherConditions: this.config.considerWeather ? this.getWeatherConditions(centerPosition, startTime) : undefined,
        seaState: this.config.considerSeaState ? this.getSeaState(centerPosition, startTime) : undefined,
        regulatoryZone: this.config.considerRegulatoryZones ? this.getRegulatoryZone(centerPosition) : undefined
      }
    };
  }

  private analyzePotentialSTS(
    trip1: VesselTrip,
    trip2: VesselTrip,
    timeRange: { start: number; end: number }
  ): VesselEncounter | null {
    if (!trip1.timestamps || !trip2.timestamps) return null;

    const proximityEvents: Array<{
      timestamp: number;
      distance: number;
      speed1: number;
      speed2: number;
      position1: [number, number];
      position2: [number, number];
    }> = [];

    // Find times when vessels were in proximity
    for (let i = 0; i < trip1.timestamps.length; i++) {
      const timestamp1 = trip1.timestamps[i];
      if (timestamp1 < timeRange.start || timestamp1 > timeRange.end) continue;

      // Find corresponding timestamp in trip2
      const j = this.findClosestTimestampIndex(trip2.timestamps, timestamp1);
      if (j === -1) continue;

      const timestamp2 = trip2.timestamps[j];
      if (Math.abs(timestamp1 - timestamp2) > 300000) continue; // 5 minute tolerance

      const distance = this.calculateDistance(trip1.path[i], trip2.path[j]);
      
      if (distance <= this.config.stsTransferThreshold) {
        proximityEvents.push({
          timestamp: timestamp1,
          distance,
          speed1: trip1.speeds?.[i] || 0,
          speed2: trip2.speeds?.[j] || 0,
          position1: trip1.path[i],
          position2: trip2.path[j]
        });
      }
    }

    if (proximityEvents.length === 0) return null;

    // Analyze for STS characteristics
    const avgSpeed1 = proximityEvents.reduce((sum, event) => sum + event.speed1, 0) / proximityEvents.length;
    const avgSpeed2 = proximityEvents.reduce((sum, event) => sum + event.speed2, 0) / proximityEvents.length;
    const minDistance = Math.min(...proximityEvents.map(e => e.distance));
    const duration = proximityEvents[proximityEvents.length - 1].timestamp - proximityEvents[0].timestamp;

    // STS criteria: very close, slow speeds, sustained duration
    if (minDistance <= this.config.stsTransferThreshold &&
        avgSpeed1 <= this.config.slowSpeedThreshold &&
        avgSpeed2 <= this.config.slowSpeedThreshold &&
        duration >= 1800000) { // 30 minutes minimum for STS

      const centerPos = this.calculateCenterPosition(proximityEvents.map(e => ({
        vessel1Pos: e.position1,
        vessel2Pos: e.position2
      })));

      return {
        id: `sts_${proximityEvents[0].timestamp}_${trip1.vesselId}_${trip2.vesselId}`,
        timestamp: proximityEvents[0].timestamp + (duration / 2),
        vesselIds: [trip1.vesselId, trip2.vesselId],
        type: 'sts_transfer',
        location: centerPos,
        distance: minDistance,
        duration,
        confidence: this.calculateSTSConfidence(avgSpeed1, avgSpeed2, minDistance, duration),
        severity: 'high',
        metadata: {
          transferVolume: this.estimateTransferVolume(duration, { vessel1: avgSpeed1, vessel2: avgSpeed2 }),
          cargoType: 'petroleum',
          suspiciousActivity: duration > 10800000 || // > 3 hours
                             new Date(proximityEvents[0].timestamp).getHours() < 6 || // Night time
                             new Date(proximityEvents[0].timestamp).getHours() > 22
        }
      };
    }

    return null;
  }

  private classifyEncounter(params: {
    minDistance: number;
    avgDistance: number;
    duration: number;
    avgSpeeds: any;
    positions: any[];
    headings: any[];
  }): VesselEncounter['type'] {
    const { minDistance, avgDistance, duration, avgSpeeds } = params;
    
    // STS Transfer: Very close, very slow, sustained
    if (minDistance <= this.config.stsTransferThreshold &&
        avgSpeeds.vessel1 <= this.config.slowSpeedThreshold &&
        avgSpeeds.vessel2 <= this.config.slowSpeedThreshold &&
        duration >= 1800000) {
      return 'sts_transfer';
    }
    
    // Rendezvous: Close, slow or stopped, coordinated
    if (minDistance <= this.config.rendezvousThreshold &&
        (avgSpeeds.vessel1 <= this.config.slowSpeedThreshold || 
         avgSpeeds.vessel2 <= this.config.slowSpeedThreshold) &&
        duration >= 600000) {
      return 'rendezvous';
    }
    
    // Collision Risk: Very close, fast approach
    if (minDistance <= 200 && // 200m collision risk threshold
        (avgSpeeds.vessel1 > 10 || avgSpeeds.vessel2 > 10)) {
      return 'collision_risk';
    }
    
    // Close Approach: Moderate distance, any speed
    if (minDistance <= this.config.closeApproachThreshold) {
      return 'close_approach';
    }
    
    // Formation: Coordinated movement
    return 'formation';
  }

  // Utility methods
  private getVesselsAtTime(vesselTrips: VesselTrip[], timestamp: number): Array<{
    vesselId: string;
    position: [number, number];
    speed?: number;
    heading?: number;
  }> {
    const vessels: Array<{
      vesselId: string;
      position: [number, number];
      speed?: number;
      heading?: number;
    }> = [];

    for (const trip of vesselTrips) {
      const vesselData = this.getVesselAtTime(trip, timestamp);
      if (vesselData) {
        vessels.push(vesselData);
      }
    }

    return vessels;
  }

  private getVesselAtTime(trip: VesselTrip, timestamp: number): {
    vesselId: string;
    position: [number, number];
    speed?: number;
    heading?: number;
  } | null {
    if (!trip.timestamps || trip.timestamps.length === 0) {
      return null;
    }

    // Find closest timestamp
    let closestIndex = 0;
    let minDiff = Math.abs(trip.timestamps[0] - timestamp);

    for (let i = 1; i < trip.timestamps.length; i++) {
      const diff = Math.abs(trip.timestamps[i] - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    // Only return if within reasonable time window
    if (minDiff > 600000) return null; // 10 minutes max

    if (closestIndex < trip.path.length) {
      return {
        vesselId: trip.vesselId,
        position: trip.path[closestIndex],
        speed: trip.speeds?.[closestIndex],
        heading: trip.headings?.[closestIndex]
      };
    }

    return null;
  }

  private calculateDistance(pos1: [number, number], pos2: [number, number]): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (pos2[1] - pos1[1]) * Math.PI / 180;
    const dLon = (pos2[0] - pos1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1[1] * Math.PI / 180) * Math.cos(pos2[1] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private getEncounterKey(vesselId1: string, vesselId2: string): string {
    return vesselId1 < vesselId2 ? `${vesselId1}-${vesselId2}` : `${vesselId2}-${vesselId1}`;
  }

  private calculateAverageSpeeds(speeds: any[]): { vessel1: number; vessel2: number } {
    const vessel1Avg = speeds.reduce((sum, s) => sum + s.vessel1Speed, 0) / speeds.length;
    const vessel2Avg = speeds.reduce((sum, s) => sum + s.vessel2Speed, 0) / speeds.length;
    return { vessel1: vessel1Avg, vessel2: vessel2Avg };
  }

  private calculateCenterPosition(positions: any[]): [number, number] {
    let sumLon = 0, sumLat = 0;
    
    positions.forEach(pos => {
      sumLon += (pos.vessel1Pos[0] + pos.vessel2Pos[0]) / 2;
      sumLat += (pos.vessel1Pos[1] + pos.vessel2Pos[1]) / 2;
    });
    
    return [sumLon / positions.length, sumLat / positions.length];
  }

  private calculateConfidence(params: any): number {
    let confidence = 0.5; // Base confidence
    
    // Distance-based confidence
    if (params.minDistance < 100) confidence += 0.3;
    else if (params.minDistance < 500) confidence += 0.2;
    else if (params.minDistance < 1000) confidence += 0.1;
    
    // Duration-based confidence
    if (params.duration > 3600000) confidence += 0.2; // > 1 hour
    else if (params.duration > 1800000) confidence += 0.1; // > 30 min
    
    // Speed-based confidence for certain types
    if (params.encounterType === 'sts_transfer' && params.avgSpeeds.vessel1 < 2 && params.avgSpeeds.vessel2 < 2) {
      confidence += 0.2;
    }
    
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  private calculateSeverity(type: VesselEncounter['type'], distance: number, speeds: any, duration: number): VesselEncounter['severity'] {
    if (type === 'collision_risk') return 'critical';
    if (type === 'sts_transfer') return 'high';
    if (distance < 200) return 'high';
    if (distance < 500) return 'medium';
    return 'low';
  }

  private calculatePositionConsistency(positions: any[]): number {
    // Calculate how consistent the relative positions are
    if (positions.length < 2) return 1.0;
    
    const distances = positions.map(p => p.distance);
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - (standardDeviation / avgDistance));
  }

  private findClosestTimestampIndex(timestamps: number[], targetTime: number): number {
    let closestIndex = -1;
    let minDiff = Infinity;
    
    for (let i = 0; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    return closestIndex;
  }

  private estimateTransferVolume(duration: number, speeds: any): number {
    // Rough estimate based on duration and vessel characteristics
    const hoursDuration = duration / 3600000;
    const baseTransferRate = 5000; // barrels per hour
    return Math.round(baseTransferRate * hoursDuration * (1 + Math.random() * 0.3));
  }

  private estimateCargoType(vesselIds: string[]): string {
    // Simple heuristic - in real implementation would use vessel database
    const types = ['petroleum', 'crude oil', 'refined products', 'liquefied gas'];
    const hash = vesselIds.join('').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return types[hash % types.length];
  }

  private calculateSTSConfidence(speed1: number, speed2: number, distance: number, duration: number): number {
    let confidence = 0.6; // Base STS confidence
    
    if (speed1 < 1 && speed2 < 1) confidence += 0.2; // Both nearly stopped
    if (distance < 50) confidence += 0.2; // Very close
    if (duration > 7200000) confidence += 0.1; // Long duration (> 2 hours)
    
    return Math.min(1.0, confidence);
  }

  private detectSuspiciousActivity(params: any): boolean {
    const { encounterType, minDistance, duration, avgSpeeds, timeOfDay } = params;
    
    // Night time operations
    if (timeOfDay < 6 || timeOfDay > 22) return true;
    
    // Unusually long STS transfers
    if (encounterType === 'sts_transfer' && duration > 14400000) return true; // > 4 hours
    
    // Very close approaches at high speed
    if (minDistance < 100 && (avgSpeeds.vessel1 > 15 || avgSpeeds.vessel2 > 15)) return true;
    
    return false;
  }

  // Placeholder methods for environmental data
  private getWeatherConditions(position: [number, number], timestamp: number): string {
    return 'moderate'; // Would integrate with weather API
  }

  private getSeaState(position: [number, number], timestamp: number): string {
    return 'calm'; // Would integrate with oceanographic data
  }

  private getRegulatoryZone(position: [number, number]): string {
    return 'international_waters'; // Would check against maritime boundary data
  }
}

// Singleton instance
export const encounterDetectionService = new EncounterDetectionService();