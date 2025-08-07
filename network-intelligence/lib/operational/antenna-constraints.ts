/**
 * Antenna Operational Constraints Module
 * 
 * Implements methodology paper Section 3.2: Operational Constraints
 * - Antenna slew time calculations
 * - Acquisition and reconfiguration overhead
 * - Schedule conflict detection
 * - Capacity impact assessment
 */

export interface AntennaSpecification {
  antennaId: string;
  stationId: string;
  diameter: number; // meters
  
  // Mechanical constraints
  azimuthSlewRate: number; // degrees/second
  elevationSlewRate: number; // degrees/second
  maxAzimuth: number; // degrees
  minAzimuth: number; // degrees
  maxElevation: number; // degrees (typically 90)
  minElevation: number; // degrees (typically 5-10)
  
  // Operational timing
  acquisitionTime: number; // seconds to acquire and lock signal
  reconfigurationTime: number; // seconds to change frequency/polarization
  stabilizationTime: number; // seconds for mechanical stabilization
  
  // Performance characteristics
  trackingAccuracy: number; // degrees
  pointingAccuracy: number; // degrees
}

export interface SatellitePass {
  satelliteId: string;
  startTime: Date;
  endTime: Date;
  maxElevation: number;
  startAzimuth: number;
  endAzimuth: number;
  priority: number; // 1-10 scale
  service: 'broadcast' | 'data' | 'government' | 'mobility';
}

export interface ScheduleConflict {
  pass1: SatellitePass;
  pass2: SatellitePass;
  conflictType: 'overlap' | 'insufficient_slew_time' | 'maintenance_window';
  resolutionOptions: ConflictResolution[];
}

export interface ConflictResolution {
  option: string;
  impactOnCapacity: number; // percentage
  impactOnRevenue: number; // dollars
  feasibility: number; // 0-1 probability
}

export class AntennaConstraintsCalculator {
  private readonly TYPICAL_SLEW_RATES = {
    small: { azimuth: 3.0, elevation: 2.0 }, // <5m diameter
    medium: { azimuth: 2.0, elevation: 1.5 }, // 5-10m diameter
    large: { azimuth: 1.0, elevation: 0.75 }, // 10-15m diameter
    vlarge: { azimuth: 0.5, elevation: 0.4 } // >15m diameter
  };
  
  private readonly TYPICAL_TIMING = {
    acquisition: 30, // seconds
    reconfiguration: 45, // seconds
    stabilization: 10 // seconds
  };
  
  /**
   * Calculate transition time between two satellite positions
   */
  calculateTransitionTime(
    antenna: AntennaSpecification,
    fromAz: number,
    fromEl: number,
    toAz: number,
    toEl: number,
    includeAcquisition: boolean = true
  ): number {
    // Calculate angular distances
    let azimuthDelta = Math.abs(toAz - fromAz);
    
    // Handle azimuth wrap-around (shortest path)
    if (azimuthDelta > 180) {
      azimuthDelta = 360 - azimuthDelta;
    }
    
    const elevationDelta = Math.abs(toEl - fromEl);
    
    // Calculate slew times for each axis
    const azimuthSlewTime = azimuthDelta / antenna.azimuthSlewRate;
    const elevationSlewTime = elevationDelta / antenna.elevationSlewRate;
    
    // Maximum time (axes move simultaneously)
    const slewTime = Math.max(azimuthSlewTime, elevationSlewTime);
    
    // Add operational overheads
    let totalTime = slewTime + antenna.stabilizationTime;
    
    if (includeAcquisition) {
      totalTime += antenna.acquisitionTime;
    }
    
    return totalTime;
  }
  
  /**
   * Detect scheduling conflicts considering slew time
   */
  detectScheduleConflicts(
    antenna: AntennaSpecification,
    passes: SatellitePass[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const sortedPasses = [...passes].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
    
    for (let i = 0; i < sortedPasses.length - 1; i++) {
      const currentPass = sortedPasses[i];
      const nextPass = sortedPasses[i + 1];
      
      // Calculate required transition time
      const transitionTime = this.calculateTransitionTime(
        antenna,
        currentPass.endAzimuth,
        0, // Assume parking at horizon after pass
        nextPass.startAzimuth,
        10, // Minimum elevation for next pass
        true
      );
      
      // Time available between passes
      const gapTime = (nextPass.startTime.getTime() - currentPass.endTime.getTime()) / 1000;
      
      if (gapTime < transitionTime) {
        conflicts.push({
          pass1: currentPass,
          pass2: nextPass,
          conflictType: 'insufficient_slew_time',
          resolutionOptions: this.generateResolutionOptions(
            antenna,
            currentPass,
            nextPass,
            transitionTime - gapTime
          )
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Calculate capacity impact due to slew time constraints
   */
  calculateCapacityImpact(
    antenna: AntennaSpecification,
    scheduledPasses: SatellitePass[],
    totalAvailableTime: number // seconds
  ): {
    theoreticalCapacity: number;
    actualCapacity: number;
    capacityLoss: number;
    slewTimeOverhead: number;
    utilizationEfficiency: number;
  } {
    let totalPassTime = 0;
    let totalSlewTime = 0;
    let totalAcquisitionTime = 0;
    
    const sortedPasses = [...scheduledPasses].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
    
    for (let i = 0; i < sortedPasses.length; i++) {
      const pass = sortedPasses[i];
      totalPassTime += (pass.endTime.getTime() - pass.startTime.getTime()) / 1000;
      
      // Add acquisition time for each pass
      totalAcquisitionTime += antenna.acquisitionTime;
      
      // Add slew time to next pass
      if (i < sortedPasses.length - 1) {
        const nextPass = sortedPasses[i + 1];
        const slewTime = this.calculateTransitionTime(
          antenna,
          pass.endAzimuth,
          0,
          nextPass.startAzimuth,
          10,
          false // Don't double-count acquisition
        );
        totalSlewTime += slewTime;
      }
    }
    
    const totalOverhead = totalSlewTime + totalAcquisitionTime;
    const theoreticalCapacity = totalPassTime / totalAvailableTime;
    const actualCapacity = (totalPassTime - totalOverhead) / totalAvailableTime;
    const capacityLoss = theoreticalCapacity - actualCapacity;
    
    return {
      theoreticalCapacity: theoreticalCapacity * 100,
      actualCapacity: actualCapacity * 100,
      capacityLoss: capacityLoss * 100,
      slewTimeOverhead: (totalOverhead / totalAvailableTime) * 100,
      utilizationEfficiency: actualCapacity / theoreticalCapacity
    };
  }
  
  /**
   * Optimize schedule to minimize slew time impact
   */
  optimizeSchedule(
    antenna: AntennaSpecification,
    availablePasses: SatellitePass[],
    constraints: {
      minPassDuration?: number;
      maxPasses?: number;
      priorityThreshold?: number;
    } = {}
  ): {
    optimizedSchedule: SatellitePass[];
    capacityGain: number;
    revenueImpact: number;
  } {
    // Simple greedy optimization - can be replaced with more sophisticated algorithms
    const schedule: SatellitePass[] = [];
    const remaining = [...availablePasses].filter(p => {
      const duration = (p.endTime.getTime() - p.startTime.getTime()) / 1000;
      return duration >= (constraints.minPassDuration || 300); // Min 5 minutes
    });
    
    // Sort by priority and duration
    remaining.sort((a, b) => {
      const scoreA = a.priority * ((a.endTime.getTime() - a.startTime.getTime()) / 1000);
      const scoreB = b.priority * ((b.endTime.getTime() - b.startTime.getTime()) / 1000);
      return scoreB - scoreA;
    });
    
    // Build schedule considering slew time
    for (const pass of remaining) {
      if (constraints.maxPasses && schedule.length >= constraints.maxPasses) break;
      if (constraints.priorityThreshold && pass.priority < constraints.priorityThreshold) continue;
      
      // Check if pass can be added without conflicts
      const conflicts = this.detectScheduleConflicts(antenna, [...schedule, pass]);
      if (conflicts.length === 0) {
        schedule.push(pass);
      }
    }
    
    // Calculate improvement
    const originalCapacity = this.calculateCapacityImpact(
      antenna,
      availablePasses.slice(0, schedule.length),
      24 * 3600
    );
    
    const optimizedCapacity = this.calculateCapacityImpact(
      antenna,
      schedule,
      24 * 3600
    );
    
    return {
      optimizedSchedule: schedule,
      capacityGain: optimizedCapacity.actualCapacity - originalCapacity.actualCapacity,
      revenueImpact: this.estimateRevenueImpact(schedule, availablePasses)
    };
  }
  
  /**
   * Generate antenna specifications from diameter
   */
  generateAntennaSpec(
    stationId: string,
    diameter: number,
    antennaId: string = 'primary'
  ): AntennaSpecification {
    let slewRates;
    
    if (diameter < 5) {
      slewRates = this.TYPICAL_SLEW_RATES.small;
    } else if (diameter < 10) {
      slewRates = this.TYPICAL_SLEW_RATES.medium;
    } else if (diameter < 15) {
      slewRates = this.TYPICAL_SLEW_RATES.large;
    } else {
      slewRates = this.TYPICAL_SLEW_RATES.vlarge;
    }
    
    return {
      antennaId,
      stationId,
      diameter,
      azimuthSlewRate: slewRates.azimuth,
      elevationSlewRate: slewRates.elevation,
      maxAzimuth: 360,
      minAzimuth: 0,
      maxElevation: 90,
      minElevation: 5,
      acquisitionTime: this.TYPICAL_TIMING.acquisition,
      reconfigurationTime: this.TYPICAL_TIMING.reconfiguration,
      stabilizationTime: this.TYPICAL_TIMING.stabilization,
      trackingAccuracy: 0.1,
      pointingAccuracy: 0.05
    };
  }
  
  /**
   * Generate conflict resolution options
   */
  private generateResolutionOptions(
    antenna: AntennaSpecification,
    pass1: SatellitePass,
    pass2: SatellitePass,
    shortfall: number
  ): ConflictResolution[] {
    const options: ConflictResolution[] = [];
    
    // Option 1: Shorten first pass
    const pass1Duration = (pass1.endTime.getTime() - pass1.startTime.getTime()) / 1000;
    if (pass1Duration > shortfall + 300) { // Keep at least 5 minutes
      options.push({
        option: `Shorten ${pass1.satelliteId} pass by ${Math.ceil(shortfall)}s`,
        impactOnCapacity: (shortfall / pass1Duration) * 100,
        impactOnRevenue: this.estimateRevenuePerSecond(pass1.service) * shortfall,
        feasibility: 0.9
      });
    }
    
    // Option 2: Delay second pass
    options.push({
      option: `Delay ${pass2.satelliteId} acquisition by ${Math.ceil(shortfall)}s`,
      impactOnCapacity: (shortfall / ((pass2.endTime.getTime() - pass2.startTime.getTime()) / 1000)) * 100,
      impactOnRevenue: this.estimateRevenuePerSecond(pass2.service) * shortfall,
      feasibility: 0.85
    });
    
    // Option 3: Skip lower priority pass
    if (pass1.priority < pass2.priority) {
      options.push({
        option: `Skip ${pass1.satelliteId} pass (priority ${pass1.priority})`,
        impactOnCapacity: 100,
        impactOnRevenue: this.estimatePassRevenue(pass1),
        feasibility: 0.7
      });
    } else {
      options.push({
        option: `Skip ${pass2.satelliteId} pass (priority ${pass2.priority})`,
        impactOnCapacity: 100,
        impactOnRevenue: this.estimatePassRevenue(pass2),
        feasibility: 0.7
      });
    }
    
    return options.sort((a, b) => a.impactOnRevenue - b.impactOnRevenue);
  }
  
  /**
   * Estimate revenue per second for different services
   */
  private estimateRevenuePerSecond(service: string): number {
    const revenuePerHour = {
      government: 5000,
      broadcast: 3000,
      data: 2000,
      mobility: 4000
    };
    
    return (revenuePerHour[service as keyof typeof revenuePerHour] || 2000) / 3600;
  }
  
  /**
   * Estimate total revenue for a pass
   */
  private estimatePassRevenue(pass: SatellitePass): number {
    const duration = (pass.endTime.getTime() - pass.startTime.getTime()) / 1000;
    return this.estimateRevenuePerSecond(pass.service) * duration * pass.priority / 5;
  }
  
  /**
   * Estimate revenue impact of schedule changes
   */
  private estimateRevenueImpact(
    optimized: SatellitePass[],
    original: SatellitePass[]
  ): number {
    const optimizedRevenue = optimized.reduce((sum, pass) => 
      sum + this.estimatePassRevenue(pass), 0
    );
    
    const originalRevenue = original.slice(0, optimized.length).reduce((sum, pass) => 
      sum + this.estimatePassRevenue(pass), 0
    );
    
    return optimizedRevenue - originalRevenue;
  }
}

// Export singleton instance for easy use
export const antennaConstraints = new AntennaConstraintsCalculator();