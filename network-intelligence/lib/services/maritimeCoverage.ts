/**
 * Maritime Coverage Analysis Service
 * Calculates ground station coverage over shipping lanes and maritime areas
 */

import { PrecomputedStationScore } from '../data/precomputed-opportunity-scores';
import { GLOBAL_SHIPPING_LANES } from '../data/shippingLanes';

interface MaritimeCoverageMetrics {
  area_sq_km: number;
  shipping_lanes_covered: string[];
  vessels_in_footprint: number;
  revenue_potential: number;
  coverage_quality: 'excellent' | 'good' | 'fair' | 'poor';
  o3b_capable: boolean;
}

interface SatelliteBand {
  name: 'C' | 'Ku' | 'Ka' | 'L';
  max_range_km: number;
  rain_fade_margin_db: number;
  min_elevation_deg: number;
  maritime_performance: number; // 0-1 scale
}

export class MaritimeCoverageAnalysis {
  // Maritime-specific satellite band characteristics
  private readonly MARITIME_BANDS: Record<string, SatelliteBand> = {
    C: {
      name: 'C',
      max_range_km: 5000,
      rain_fade_margin_db: 1,
      min_elevation_deg: 5,
      maritime_performance: 0.95 // Excellent for maritime
    },
    Ku: {
      name: 'Ku',
      max_range_km: 4000,
      rain_fade_margin_db: 3,
      min_elevation_deg: 10,
      maritime_performance: 0.80 // Good, but rain fade issues
    },
    Ka: {
      name: 'Ka',
      max_range_km: 3000,
      rain_fade_margin_db: 5,
      min_elevation_deg: 15,
      maritime_performance: 0.65 // High capacity but weather sensitive
    },
    L: {
      name: 'L',
      max_range_km: 6000,
      rain_fade_margin_db: 0.5,
      min_elevation_deg: 3,
      maritime_performance: 0.70 // Low bandwidth but reliable
    }
  };

  // O3b MEO constellation advantages for maritime
  private readonly O3B_ADVANTAGES = {
    latency_ms: 150, // vs 600ms for GEO
    throughput_multiplier: 4, // vs GEO
    coverage_belt: [-45, 45], // Latitude range
    beams_per_satellite: 12,
    min_elevation: 20, // degrees
    ideal_for_maritime: true,
    premium_factor: 1.5 // 50% price premium
  };

  /**
   * Calculate maritime coverage for a ground station
   */
  calculateStationMaritimeCoverage(
    station: PrecomputedStationScore
  ): MaritimeCoverageMetrics {
    // Determine available frequency bands
    const availableBands = this.getStationBands(station);
    
    // Calculate coverage footprint
    const footprint = this.calculateMaritimeFootprint(
      station.coordinates,
      availableBands
    );
    
    // Check shipping lane coverage
    const lanesInRange = this.calculateLaneCoverage(
      station.coordinates,
      footprint.radius_km
    );
    
    // Estimate vessels in footprint
    const vesselCount = this.estimateVesselsInFootprint(
      station.coordinates,
      footprint.radius_km
    );
    
    // Check O3b capability
    const o3bCapable = this.isO3bCapable(station);
    
    // Calculate revenue potential
    const revenuePotential = this.calculateMaritimeRevenue(
      vesselCount,
      lanesInRange,
      o3bCapable
    );
    
    // Determine coverage quality
    const quality = this.assessCoverageQuality(
      footprint,
      lanesInRange,
      vesselCount
    );
    
    return {
      area_sq_km: Math.PI * Math.pow(footprint.radius_km, 2),
      shipping_lanes_covered: lanesInRange.map(l => l.id),
      vessels_in_footprint: vesselCount,
      revenue_potential: revenuePotential,
      coverage_quality: quality,
      o3b_capable: o3bCapable
    };
  }

  /**
   * Calculate O3b MEO coverage capabilities
   */
  calculateO3bMaritimeCoverage(station: PrecomputedStationScore) {
    // Check if station can serve as O3b gateway
    const hasKaBand = this.hasCapability(station, 'Ka-band');
    const hasO3bTracking = this.hasCapability(station, 'MEO-tracking');
    const inCoverageBelt = Math.abs(station.coordinates[0]) <= 45;
    
    if (hasKaBand && hasO3bTracking && inCoverageBelt) {
      // Calculate O3b coverage area
      const coverage = {
        can_serve_o3b: true,
        maritime_advantage: 'HIGH',
        coverage_area_sq_km: Math.PI * Math.pow(2500, 2), // ~2500km radius
        latency_advantage_ms: 450, // 600ms GEO - 150ms MEO
        throughput_advantage: '4x GEO capacity',
        premium_service_potential: true,
        estimated_premium: this.O3B_ADVANTAGES.premium_factor,
        target_vessels: [
          'Cruise ships (low latency for passengers)',
          'Offshore platforms (high bandwidth)',
          'Research vessels (data transfer)',
          'Luxury yachts (premium connectivity)'
        ],
        revenue_uplift: 0.5 // 50% revenue increase
      };
      
      return coverage;
    }
    
    return {
      can_serve_o3b: false,
      maritime_advantage: 'NONE',
      reason: !hasKaBand ? 'No Ka-band capability' :
              !hasO3bTracking ? 'No MEO tracking capability' :
              'Outside O3b coverage belt'
    };
  }

  /**
   * Calculate maritime footprint based on frequency bands
   */
  private calculateMaritimeFootprint(
    coordinates: [number, number],
    bands: SatelliteBand[]
  ) {
    // Use best performing band for maritime
    const bestBand = bands.reduce((best, band) => 
      band.maritime_performance > best.maritime_performance ? band : best
    );
    
    // Adjust range for maritime conditions
    const effectiveRange = bestBand.max_range_km * 0.85; // 15% reduction for ship motion
    
    // Calculate coverage polygon (simplified as circle)
    const footprint = {
      center: coordinates,
      radius_km: effectiveRange,
      band: bestBand.name,
      quality_factor: bestBand.maritime_performance,
      weather_resilience: 1 - (bestBand.rain_fade_margin_db / 10)
    };
    
    return footprint;
  }

  /**
   * Calculate which shipping lanes are covered
   */
  private calculateLaneCoverage(
    stationCoords: [number, number],
    coverageRadius: number
  ) {
    const coveredLanes: any[] = [];
    
    GLOBAL_SHIPPING_LANES.forEach(lane => {
      // Check if any lane waypoint is within coverage
      const waypointsInRange = lane.waypoints.filter(waypoint => {
        const distance = this.haversineDistance(
          stationCoords,
          [waypoint.longitude, waypoint.latitude] as [number, number]
        );
        return distance <= coverageRadius;
      });
      
      if (waypointsInRange.length > 0) {
        const coveragePercent = (waypointsInRange.length / lane.waypoints.length) * 100;
        coveredLanes.push({
          ...lane,
          id: lane.laneId,
          coverage_percent: coveragePercent,
          waypoints_covered: waypointsInRange.length
        });
      }
    });
    
    return coveredLanes;
  }

  /**
   * Estimate number of vessels in coverage area
   */
  private estimateVesselsInFootprint(
    coordinates: [number, number],
    radius: number
  ): number {
    // Base vessel density by region (vessels per 1000 sq km)
    const densityByRegion = this.getRegionalVesselDensity(coordinates);
    
    // Calculate area
    const area = Math.PI * Math.pow(radius, 2);
    
    // Estimate vessels
    const baseVessels = (area / 1000) * densityByRegion;
    
    // Adjust for proximity to shipping lanes
    const laneProximityMultiplier = this.getLaneProximityMultiplier(coordinates);
    
    return Math.round(baseVessels * laneProximityMultiplier);
  }

  /**
   * Get regional vessel density
   */
  private getRegionalVesselDensity(coords: [number, number]): number {
    const [lat, lon] = coords;
    
    // High-density regions
    if (this.isNearRegion(coords, [1.3, 103.8], 500)) return 15; // Singapore Strait
    if (this.isNearRegion(coords, [32.5, 30], 300)) return 12; // Suez Canal
    if (this.isNearRegion(coords, [21.3, 39.8], 300)) return 10; // Red Sea
    if (this.isNearRegion(coords, [35, 20], 500)) return 8; // Mediterranean
    if (this.isNearRegion(coords, [50, 0], 300)) return 8; // English Channel
    if (this.isNearRegion(coords, [25, 55], 400)) return 7; // Persian Gulf
    
    // Medium-density regions
    if (Math.abs(lat) < 60 && Math.abs(lon) < 180) {
      if (this.isNearCoast(coords)) return 4;
      return 2; // Open ocean
    }
    
    // Low-density regions
    return 0.5;
  }

  /**
   * Calculate lane proximity multiplier
   */
  private getLaneProximityMultiplier(coords: [number, number]): number {
    let multiplier = 1.0;
    
    GLOBAL_SHIPPING_LANES.forEach(lane => {
      const distanceToLane = this.getDistanceToLane(coords, lane.waypoints.map(wp => [wp.latitude, wp.longitude]));
      if (distanceToLane < 100) {
        multiplier += 1.0;
      } else if (distanceToLane < 300) {
        multiplier += 0.5;
      } else if (distanceToLane < 500) {
        multiplier += 0.2;
      }
    });
    
    return Math.min(multiplier, 3.0); // Cap at 3x
  }

  /**
   * Calculate maritime revenue potential
   */
  private calculateMaritimeRevenue(
    vesselCount: number,
    lanesInRange: any[],
    o3bCapable: boolean
  ): number {
    // Base revenue per vessel per month
    const baseRevenuePerVessel = 5000; // $5,000/month average
    
    // Lane premium for high-value routes
    let lanePremium = 1.0;
    lanesInRange.forEach(lane => {
      if (lane.value.valueTier === 'premium') lanePremium += 0.3;
      else if (lane.value.valueTier === 'high') lanePremium += 0.15;
    });
    
    // O3b premium for low-latency services
    const o3bMultiplier = o3bCapable ? this.O3B_ADVANTAGES.premium_factor : 1.0;
    
    // Calculate monthly revenue
    const monthlyRevenue = vesselCount * baseRevenuePerVessel * lanePremium * o3bMultiplier;
    
    // Return annual revenue
    return monthlyRevenue * 12;
  }

  /**
   * Assess coverage quality based on metrics
   */
  private assessCoverageQuality(
    footprint: any,
    lanesInRange: any[],
    vesselCount: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;
    
    // Footprint size score
    if (footprint.radius_km > 4000) score += 30;
    else if (footprint.radius_km > 3000) score += 20;
    else if (footprint.radius_km > 2000) score += 10;
    
    // Lane coverage score
    if (lanesInRange.length > 3) score += 30;
    else if (lanesInRange.length > 1) score += 20;
    else if (lanesInRange.length > 0) score += 10;
    
    // Vessel count score
    if (vesselCount > 100) score += 30;
    else if (vesselCount > 50) score += 20;
    else if (vesselCount > 20) score += 10;
    
    // Weather resilience score
    if (footprint.weather_resilience > 0.8) score += 10;
    else if (footprint.weather_resilience > 0.6) score += 5;
    
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Utility functions
   */
  private haversineDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const R = 6371; // Earth radius in km
    const lat1 = coord1[0] * Math.PI / 180;
    const lat2 = coord2[0] * Math.PI / 180;
    const deltaLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const deltaLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
  
  private isNearRegion(
    coords: [number, number],
    region: [number, number],
    radius: number
  ): boolean {
    return this.haversineDistance(coords, region) < radius;
  }
  
  private isNearCoast(coords: [number, number]): boolean {
    // Simplified coast detection
    const [lat, lon] = coords;
    
    // Check major coastal regions
    if (Math.abs(lat) > 70) return false; // Too far north/south
    
    // Atlantic coasts
    if (lon > -100 && lon < -60 && lat > 20 && lat < 50) return true;
    if (lon > -30 && lon < 20 && lat > 30 && lat < 70) return true;
    
    // Pacific coasts
    if (lon > 100 && lon < 160 && lat > -40 && lat < 40) return true;
    if (lon > -130 && lon < -100 && lat > 20 && lat < 60) return true;
    
    // Indian Ocean
    if (lon > 40 && lon < 100 && lat > -40 && lat < 30) return true;
    
    return false;
  }
  
  private getDistanceToLane(
    point: [number, number],
    waypoints: number[][]
  ): number {
    let minDistance = Infinity;
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = this.pointToSegmentDistance(
        point,
        waypoints[i] as [number, number],
        waypoints[i + 1] as [number, number]
      );
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }
  
  private pointToSegmentDistance(
    point: [number, number],
    start: [number, number],
    end: [number, number]
  ): number {
    // Calculate distance from point to line segment
    const A = point[0] - start[0];
    const B = point[1] - start[1];
    const C = end[0] - start[0];
    const D = end[1] - start[1];
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) param = dot / len_sq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = start[0];
      yy = start[1];
    } else if (param > 1) {
      xx = end[0];
      yy = end[1];
    } else {
      xx = start[0] + param * C;
      yy = start[1] + param * D;
    }
    
    return this.haversineDistance(point, [xx, yy]);
  }
  
  private getStationBands(station: PrecomputedStationScore): SatelliteBand[] {
    const bands: SatelliteBand[] = [];
    
    // Determine bands based on station capabilities (simplified)
    if (station.utilization > 0) {
      bands.push(this.MARITIME_BANDS.C);
      bands.push(this.MARITIME_BANDS.Ku);
    }
    
    // High-value stations likely have Ka-band
    if (station.monthlyRevenue > 5000000) {
      bands.push(this.MARITIME_BANDS.Ka);
    }
    
    return bands.length > 0 ? bands : [this.MARITIME_BANDS.C];
  }
  
  private hasCapability(station: PrecomputedStationScore, capability: string): boolean {
    // Check based on station characteristics
    if (capability === 'Ka-band') {
      return station.monthlyRevenue > 5000000;
    }
    if (capability === 'MEO-tracking') {
      return station.operator === 'SES' && station.overallScore > 70;
    }
    return false;
  }

  /**
   * Check if station is O3b capable
   */
  private isO3bCapable(station: any): boolean {
    // O3b capability requires equatorial ground stations with specific capabilities
    const lat = station.coordinates[0];
    
    // O3b satellites operate in equatorial orbit, so stations should be within ±45 degrees
    if (Math.abs(lat) > 45) {
      return false;
    }
    
    // Check if SES operator (they own O3b constellation)
    if (station.operator === 'SES') {
      return station.overallScore > 65;
    }
    
    // Other operators might have O3b partnerships
    return station.overallScore > 80;
  }
}

// Export singleton instance
export const maritimeCoverageService = new MaritimeCoverageAnalysis();