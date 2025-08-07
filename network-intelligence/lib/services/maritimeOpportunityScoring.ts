/**
 * Maritime Opportunity Scoring Service
 * Integrates maritime factors into hexagon opportunity scoring
 */

import * as h3 from 'h3-js';
import { maritimeCoverageService } from './maritimeCoverage';
import { GLOBAL_SHIPPING_LANES } from '../data/shippingLanes';
import { MARITIME_COMPETITORS } from '../data/maritimeCompetitors';
import { maritimeDataService } from '../data/maritimeDataSources';

interface MaritimeOpportunity {
  type: 'SHIPPING_LANE_GAP' | 'OFFSHORE_CLUSTER' | 'PORT_EXPANSION' | 'MARITIME_ENTRY' | 'MARITIME_EXPANSION';
  location: [number, number];
  priority: 'CRITICAL' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  revenue_potential: number;
  investment_required: number;
  roi_months: number;
  details: any;
}

interface MaritimeScore {
  overall: number;
  maritime: number;
  terrestrial: number;
  type: string;
  details: {
    vessels_per_day: number;
    nearest_lane_km: number;
    nearest_port_km: number;
    offshore_platforms: number;
    competition_level: number;
    revenue_opportunity: number;
  };
}

export class MaritimeOpportunityScoring {
  // Major global ports for reference
  private readonly MAJOR_PORTS = [
    { name: 'Singapore', coords: [1.29, 103.85], daily_vessels: 450 },
    { name: 'Shanghai', coords: [31.23, 121.47], daily_vessels: 380 },
    { name: 'Rotterdam', coords: [51.95, 4.14], daily_vessels: 320 },
    { name: 'Hong Kong', coords: [22.30, 114.17], daily_vessels: 280 },
    { name: 'Dubai', coords: [25.07, 55.08], daily_vessels: 240 },
    { name: 'Los Angeles', coords: [33.74, -118.26], daily_vessels: 220 },
    { name: 'Hamburg', coords: [53.55, 9.93], daily_vessels: 210 },
    { name: 'Antwerp', coords: [51.23, 4.42], daily_vessels: 200 },
    { name: 'New York', coords: [40.70, -74.00], daily_vessels: 180 },
    { name: 'Tokyo', coords: [35.65, 139.75], daily_vessels: 170 }
  ];

  // Offshore energy regions
  private readonly OFFSHORE_REGIONS = [
    { name: 'North Sea', center: [57, 2], platforms: 184, value: 'VERY_HIGH' },
    { name: 'Gulf of Mexico', center: [27, -91], platforms: 3500, value: 'VERY_HIGH' },
    { name: 'Persian Gulf', center: [27, 51], platforms: 700, value: 'HIGH' },
    { name: 'South China Sea', center: [12, 112], platforms: 200, value: 'HIGH' },
    { name: 'Campos Basin', center: [-22, -40], platforms: 50, value: 'MEDIUM' },
    { name: 'West Africa', center: [4, 5], platforms: 150, value: 'HIGH' },
    { name: 'Northwest Australia', center: [-20, 115], platforms: 80, value: 'HIGH' }
  ];

  /**
   * Score hexagon with maritime factors
   */
  scoreHexagonWithMaritime(
    h3Index: string,
    terrestrialScore: { overall: number; type: string }
  ): MaritimeScore {
    const [lat, lon] = h3.cellToLatLng(h3Index);
    
    // Check distance to coast
    const distanceToCoast = this.getDistanceToCoast(lat, lon);
    
    if (distanceToCoast < 100) { // Within 100km of coast
      // Calculate maritime metrics
      const shippingDensity = this.getShippingDensity(lat, lon);
      const nearestLane = this.getNearestShippingLane(lat, lon);
      const nearestPort = this.getNearestPort(lat, lon);
      const offshoreActivity = this.getOffshoreActivity(lat, lon);
      const maritimeCompetition = this.getMaritimeCompetition(lat, lon);
      
      // Calculate maritime score components
      const densityScore = Math.min(shippingDensity / 100, 1) * 0.25;
      const laneScore = Math.max(0, 1 - (nearestLane.distance / 500)) * 0.20;
      const portScore = Math.max(0, 1 - (nearestPort.distance / 300)) * 0.15;
      const offshoreScore = Math.min(offshoreActivity / 50, 1) * 0.20;
      const competitionScore = (1 - maritimeCompetition) * 0.20;
      
      const maritimeScore = 
        densityScore + 
        laneScore + 
        portScore + 
        offshoreScore + 
        competitionScore;
      
      // Determine opportunity type
      let opportunityType = terrestrialScore.type;
      
      if (maritimeScore > 0.7 && maritimeCompetition < 0.3) {
        opportunityType = 'MARITIME_EXPANSION';
      } else if (maritimeScore > 0.5 && maritimeCompetition < 0.5) {
        opportunityType = 'MARITIME_ENTRY';
      } else if (offshoreActivity > 20 && maritimeCompetition < 0.4) {
        opportunityType = 'OFFSHORE_CLUSTER';
      } else if (nearestPort.distance < 50 && maritimeCompetition < 0.4) {
        opportunityType = 'PORT_EXPANSION';
      }
      
      // Calculate revenue opportunity
      const revenueOpportunity = this.calculateMaritimeRevenue({
        shipping_density: shippingDensity,
        lane_proximity: nearestLane.distance,
        port_proximity: nearestPort.distance,
        offshore_activity: offshoreActivity,
        maritime_competition: maritimeCompetition
      });
      
      // Combine scores (weight maritime higher for coastal areas)
      const combinedScore = terrestrialScore.overall * 0.4 + maritimeScore * 0.6;
      
      return {
        overall: Math.min(combinedScore * 100, 100),
        maritime: maritimeScore * 100,
        terrestrial: terrestrialScore.overall,
        type: opportunityType,
        details: {
          vessels_per_day: shippingDensity,
          nearest_lane_km: nearestLane.distance,
          nearest_port_km: nearestPort.distance,
          offshore_platforms: offshoreActivity,
          competition_level: maritimeCompetition,
          revenue_opportunity: revenueOpportunity
        }
      };
    }
    
    // No maritime component for inland locations
    return {
      overall: terrestrialScore.overall,
      maritime: 0,
      terrestrial: terrestrialScore.overall,
      type: terrestrialScore.type,
      details: {
        vessels_per_day: 0,
        nearest_lane_km: 999,
        nearest_port_km: 999,
        offshore_platforms: 0,
        competition_level: 0,
        revenue_opportunity: 0
      }
    };
  }

  /**
   * Find specific maritime opportunities
   */
  findMaritimeOpportunities(): MaritimeOpportunity[] {
    const opportunities: MaritimeOpportunity[] = [];
    
    // 1. Identify underserved shipping lanes
    GLOBAL_SHIPPING_LANES.forEach(lane => {
      const coverage = this.calculateLaneCoverage(lane);
      
      if (coverage.percent < 50) {
        // Find optimal location for new ground station
        const gapLocations = this.findCoverageGaps(lane);
        
        gapLocations.forEach(location => {
          opportunities.push({
            type: 'SHIPPING_LANE_GAP',
            location: location,
            priority: lane.value.valueTier === 'premium' ? 'CRITICAL' : 'HIGH',
            revenue_potential: lane.traffic.dailyVesselCount.average * 5000 * 365, // Annual revenue
            investment_required: 15000000, // $15M for new station
            roi_months: this.calculateROI(
              15000000,
              lane.traffic.dailyVesselCount.average * 5000 * 30
            ),
            details: {
              lane_name: lane.name,
              vessels_per_day: lane.traffic.dailyVesselCount.average,
              coverage_gap_km: coverage.gap_length,
              cargo_value: lane.value.annualCargoValue,
              strategic_importance: lane.value.strategicImportance
            }
          });
        });
      }
    });
    
    // 2. Identify offshore clusters without coverage
    this.OFFSHORE_REGIONS.forEach(region => {
      const nearbyStation = this.findNearestGroundStation(region.center);
      
      if (nearbyStation.distance > 500) {
        // Find optimal coastal location
        const coastalPoint = this.findNearestCoastalPoint(region.center);
        
        opportunities.push({
          type: 'OFFSHORE_CLUSTER',
          location: coastalPoint,
          priority: 'VERY_HIGH',
          revenue_potential: region.platforms * 30000 * 12, // $30k/platform/month
          investment_required: 20000000, // $20M for offshore-capable station
          roi_months: this.calculateROI(
            20000000,
            region.platforms * 30000
          ),
          details: {
            region_name: region.name,
            platform_count: region.platforms,
            distance_to_platforms: this.calculateDistance(coastalPoint, region.center),
            energy_sector_value: region.value
          }
        });
      }
    });
    
    // 3. Identify port expansion opportunities
    this.MAJOR_PORTS.forEach(port => {
      const coverage = this.getPortCoverage(port.coords);
      const competition = this.getMaritimeCompetition(port.coords[0], port.coords[1]);
      
      if (coverage < 0.3 && competition < 0.5) {
        opportunities.push({
          type: 'PORT_EXPANSION',
          location: port.coords as [number, number],
          priority: port.daily_vessels > 250 ? 'HIGH' : 'MEDIUM',
          revenue_potential: port.daily_vessels * 3000 * 365,
          investment_required: 10000000, // $10M for port-area station
          roi_months: this.calculateROI(
            10000000,
            port.daily_vessels * 3000 * 30
          ),
          details: {
            port_name: port.name,
            daily_vessels: port.daily_vessels,
            current_coverage: coverage,
            competition_level: competition,
            market_share_potential: (1 - competition) * 0.3
          }
        });
      }
    });
    
    // 4. Identify maritime entry opportunities
    const maritimeGaps = this.findMaritimeGaps();
    maritimeGaps.forEach(gap => {
      opportunities.push({
        type: 'MARITIME_ENTRY',
        location: gap.location,
        priority: gap.strategic_value,
        revenue_potential: gap.estimated_revenue,
        investment_required: gap.investment,
        roi_months: this.calculateROI(gap.investment, gap.monthly_revenue),
        details: gap.details
      });
    });
    
    // Sort by ROI
    opportunities.sort((a, b) => a.roi_months - b.roi_months);
    
    return opportunities;
  }

  /**
   * Calculate maritime revenue potential
   */
  private calculateMaritimeRevenue(metrics: any): number {
    // Base revenue calculations
    const vesselRevenue = metrics.shipping_density * 5000; // $5k per vessel/month
    const laneRevenue = Math.max(0, 10000 * (1 - metrics.lane_proximity / 500));
    const portRevenue = Math.max(0, 8000 * (1 - metrics.port_proximity / 300));
    const offshoreRevenue = metrics.offshore_activity * 30000; // $30k per platform
    
    // Competition adjustment
    const competitionFactor = 1 - (metrics.maritime_competition * 0.5);
    
    // Monthly revenue potential
    const monthlyRevenue = (
      vesselRevenue + 
      laneRevenue + 
      portRevenue + 
      offshoreRevenue
    ) * competitionFactor;
    
    return monthlyRevenue * 12; // Annual revenue
  }

  /**
   * Get shipping density at location
   */
  private getShippingDensity(lat: number, lon: number): number {
    // Use vessel density data
    const gridCell = maritimeDataService.getGridCell(lat, lon);
    
    if (gridCell) {
      return gridCell.metrics.avg_daily_vessels;
    }
    
    // Estimate based on proximity to lanes
    let density = 0;
    GLOBAL_SHIPPING_LANES.forEach(lane => {
      const distance = this.getDistanceToLane([lat, lon], lane.waypoints.map(wp => [wp.latitude, wp.longitude]));
      if (distance < 100) {
        density += lane.traffic.dailyVesselCount.average * 0.5;
      } else if (distance < 300) {
        density += lane.traffic.dailyVesselCount.average * 0.2;
      }
    });
    
    return density;
  }

  /**
   * Get nearest shipping lane
   */
  private getNearestShippingLane(lat: number, lon: number): { lane: any; distance: number } {
    let nearest = { lane: null as any, distance: Infinity };
    
    GLOBAL_SHIPPING_LANES.forEach(lane => {
      const distance = this.getDistanceToLane([lat, lon], lane.waypoints.map(wp => [wp.latitude, wp.longitude]));
      if (distance < nearest.distance) {
        nearest = { lane, distance };
      }
    });
    
    return nearest;
  }

  /**
   * Get nearest major port
   */
  private getNearestPort(lat: number, lon: number): { port: any; distance: number } {
    let nearest = { port: null as any, distance: Infinity };
    
    this.MAJOR_PORTS.forEach(port => {
      const distance = this.calculateDistance([lat, lon], port.coords);
      if (distance < nearest.distance) {
        nearest = { port, distance };
      }
    });
    
    return nearest;
  }

  /**
   * Get offshore activity level
   */
  private getOffshoreActivity(lat: number, lon: number): number {
    let activity = 0;
    
    this.OFFSHORE_REGIONS.forEach(region => {
      const distance = this.calculateDistance([lat, lon], region.center);
      if (distance < 300) {
        const distanceFactor = 1 - (distance / 300);
        activity += region.platforms * distanceFactor;
      }
    });
    
    return activity;
  }

  /**
   * Get maritime competition level
   */
  private getMaritimeCompetition(lat: number, lon: number): number {
    let competitionScore = 0;
    
    // Check proximity to maritime competitors
    MARITIME_COMPETITORS.forEach(competitor => {
      competitor.infrastructure.teleports.forEach(teleport => {
        const distance = this.calculateDistance([lat, lon], teleport.coordinates);
        
        if (distance < teleport.coverage.radiusKm) {
          const strength = 1 - (distance / teleport.coverage.radiusKm);
          const threatMultiplier = 
            competitor.competitiveAnalysis.threatLevel === 'critical' ? 1.0 :
            competitor.competitiveAnalysis.threatLevel === 'high' ? 0.7 :
            competitor.competitiveAnalysis.threatLevel === 'medium' ? 0.4 : 0.2;
          
          competitionScore += strength * threatMultiplier;
        }
      });
    });
    
    return Math.min(competitionScore, 1);
  }

  /**
   * Utility functions
   */
  private calculateDistance(coord1: number[], coord2: number[]): number {
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
  
  private getDistanceToCoast(lat: number, lon: number): number {
    // Simplified coast distance calculation
    // In production, use actual coastline data
    
    // Check if over water (simplified)
    if (this.isOverWater(lat, lon)) {
      return 0; // Already at sea
    }
    
    // Estimate distance to nearest coast
    // This is a simplified approximation
    const coastalRegions = [
      { lat: 40.7, lon: -74.0 },   // US East Coast
      { lat: 34.0, lon: -118.2 },  // US West Coast
      { lat: 51.5, lon: 0.1 },     // UK
      { lat: 1.3, lon: 103.8 },    // Singapore
      { lat: -33.9, lon: 18.4 }    // South Africa
    ];
    
    let minDistance = Infinity;
    coastalRegions.forEach(coast => {
      const dist = this.calculateDistance([lat, lon], [coast.lat, coast.lon]);
      minDistance = Math.min(minDistance, dist);
    });
    
    return minDistance;
  }
  
  private isOverWater(lat: number, lon: number): boolean {
    // Simplified water detection
    // In production, use actual land/water mask
    
    // Major ocean areas (very simplified)
    if (lat < -60 || lat > 80) return true; // Polar regions
    if (lon > -40 && lon < -10 && lat > 30 && lat < 60) return true; // North Atlantic
    if (lon > 140 && lon < 180 && lat > -40 && lat < 40) return true; // West Pacific
    
    return false;
  }
  
  private getDistanceToLane(point: number[], waypoints: number[][]): number {
    let minDistance = Infinity;
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segmentDist = this.pointToSegmentDistance(
        point,
        waypoints[i],
        waypoints[i + 1]
      );
      minDistance = Math.min(minDistance, segmentDist);
    }
    
    return minDistance;
  }
  
  private pointToSegmentDistance(
    point: number[],
    start: number[],
    end: number[]
  ): number {
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
    
    return this.calculateDistance(point, [xx, yy]);
  }
  
  private calculateLaneCoverage(lane: any): { percent: number; gap_length: number } {
    // Simplified coverage calculation
    // In production, use actual ground station coverage data
    const coveredSegments = 0.67; // Assume 67% coverage for demo
    const totalLength = lane.waypoints.length * 100; // Approximate km
    
    return {
      percent: coveredSegments * 100,
      gap_length: totalLength * (1 - coveredSegments)
    };
  }
  
  private findCoverageGaps(lane: any): Array<[number, number]> {
    // Find locations along lane without coverage
    const gaps: Array<[number, number]> = [];
    
    // Sample points along the lane
    for (let i = 0; i < lane.waypoints.length - 1; i += 3) {
      const point = lane.waypoints[i];
      // Check if covered (simplified)
      if (Math.random() > 0.67) { // 33% are gaps
        gaps.push([point[1], point[0]]); // [lat, lon]
      }
    }
    
    return gaps;
  }
  
  private findNearestGroundStation(center: number[]): { station: any; distance: number } {
    // In production, check actual ground station database
    return { 
      station: null, 
      distance: 600 // Assume no station within 600km for demo
    };
  }
  
  private findNearestCoastalPoint(center: number[]): [number, number] {
    // Find nearest coastal point for offshore region
    // Simplified - in production use actual coastline data
    const [lat, lon] = center;
    
    // Approximate coastal points
    if (lon > -100 && lon < -80) return [lat, -95]; // Gulf of Mexico
    if (lon > -10 && lon < 10) return [lat, 0];     // North Sea
    if (lon > 40 && lon < 60) return [lat, 50];     // Persian Gulf
    
    return [lat, lon + 10]; // Default: move 10 degrees east
  }
  
  private getPortCoverage(coords: number[]): number {
    // Check ground station coverage at port
    // Simplified - return random value for demo
    return Math.random() * 0.5; // 0-50% coverage
  }
  
  private findMaritimeGaps(): any[] {
    // Additional maritime opportunity identification
    return [
      {
        location: [10, -15] as [number, number], // West Africa gap
        strategic_value: 'HIGH' as const,
        estimated_revenue: 8000000,
        investment: 12000000,
        monthly_revenue: 200000,
        details: {
          region: 'West Africa Shipping Corridor',
          opportunity: 'Underserved tanker route'
        }
      },
      {
        location: [-20, 40] as [number, number], // South Indian Ocean
        strategic_value: 'MEDIUM' as const,
        estimated_revenue: 5000000,
        investment: 10000000,
        monthly_revenue: 150000,
        details: {
          region: 'Indian Ocean Transit',
          opportunity: 'Asia-Africa trade route'
        }
      }
    ];
  }
  
  private calculateROI(investment: number, monthlyRevenue: number): number {
    // Calculate months to ROI
    return Math.round(investment / monthlyRevenue);
  }
}

// Export singleton instance
export const maritimeOpportunityScoringService = new MaritimeOpportunityScoring();