/**
 * Natural Earth Ports Data Service
 * Major world ports data - NO AUTH REQUIRED
 * 
 * Priority 1 Data Source for MVP Demo
 * Static data loaded from JSON file
 */

import portsData from './natural-earth-ports.json';

export interface Port {
  name: string;
  country: string;
  continent: string;
  rank: number; // 1 = major, 2 = secondary, 3 = minor
  coordinates: [number, number]; // [longitude, latitude]
}

export interface PortWithMetrics extends Port {
  vesselCapacity: number;
  avgDailyVessels: number;
  cargoVolume: number; // Million TEUs per year
  connectivity: number; // 0-100 score
  satelliteDemand: number; // GB/month
}

/**
 * Natural Earth Ports Service
 */
export class NaturalEarthService {
  private ports: Port[] = [];
  private portsWithMetrics: Map<string, PortWithMetrics> = new Map();
  
  constructor() {
    this.loadPorts();
    this.enrichPortData();
  }
  
  /**
   * Load ports from JSON data
   */
  private loadPorts(): void {
    this.ports = portsData.features.map(feature => ({
      name: feature.properties.name,
      country: feature.properties.country,
      continent: feature.properties.continent,
      rank: feature.properties.rank,
      coordinates: feature.geometry.coordinates as [number, number]
    }));
    
    console.log(`Loaded ${this.ports.length} ports from Natural Earth data`);
  }
  
  /**
   * Enrich port data with operational metrics
   */
  private enrichPortData(): void {
    this.ports.forEach(port => {
      const metrics = this.calculatePortMetrics(port);
      this.portsWithMetrics.set(port.name, {
        ...port,
        ...metrics
      });
    });
  }
  
  /**
   * Calculate operational metrics for a port
   */
  private calculatePortMetrics(port: Port): {
    vesselCapacity: number;
    avgDailyVessels: number;
    cargoVolume: number;
    connectivity: number;
    satelliteDemand: number;
  } {
    // Base metrics on port rank and known major ports
    const majorPorts = ['Singapore', 'Shanghai', 'Rotterdam', 'Antwerp', 'Hamburg', 
                       'Los Angeles', 'Long Beach', 'New York', 'Hong Kong', 'Busan'];
    
    const isMajor = majorPorts.includes(port.name);
    const baseCapacity = port.rank === 1 ? 500 : port.rank === 2 ? 200 : 50;
    const baseVessels = port.rank === 1 ? 150 : port.rank === 2 ? 60 : 15;
    const baseCargo = port.rank === 1 ? 20 : port.rank === 2 ? 5 : 1;
    
    // Adjust for known major ports
    const multiplier = isMajor ? 2.5 : 1.0;
    
    // Regional adjustments
    const regionMultiplier = this.getRegionalMultiplier(port.continent);
    
    return {
      vesselCapacity: Math.floor(baseCapacity * multiplier * regionMultiplier),
      avgDailyVessels: Math.floor(baseVessels * multiplier * regionMultiplier),
      cargoVolume: baseCargo * multiplier * regionMultiplier,
      connectivity: this.calculateConnectivity(port, isMajor),
      satelliteDemand: this.calculateSatelliteDemand(baseVessels * multiplier)
    };
  }
  
  /**
   * Get regional multiplier for port activity
   */
  private getRegionalMultiplier(continent: string): number {
    const multipliers: Record<string, number> = {
      'Asia': 1.5,
      'Europe': 1.3,
      'North America': 1.2,
      'South America': 0.8,
      'Africa': 0.7,
      'Oceania': 0.9
    };
    return multipliers[continent] || 1.0;
  }
  
  /**
   * Calculate connectivity score
   */
  private calculateConnectivity(port: Port, isMajor: boolean): number {
    let score = port.rank === 1 ? 70 : port.rank === 2 ? 50 : 30;
    
    // Major ports get bonus
    if (isMajor) score += 20;
    
    // Strategic locations get bonus
    const strategic = ['Singapore', 'Panama City', 'Suez', 'Gibraltar', 'Dubai'];
    if (strategic.includes(port.name)) score += 10;
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate satellite bandwidth demand
   */
  private calculateSatelliteDemand(avgVessels: number): number {
    // Each vessel needs ~500GB/month on average
    // Port operations need additional bandwidth
    const vesselDemand = avgVessels * 500;
    const portOperations = avgVessels * 100; // Port ops bandwidth
    
    return vesselDemand + portOperations;
  }
  
  /**
   * Get all ports
   */
  getAllPorts(): Port[] {
    return this.ports;
  }
  
  /**
   * Get ports with full metrics
   */
  getPortsWithMetrics(): PortWithMetrics[] {
    return Array.from(this.portsWithMetrics.values());
  }
  
  /**
   * Get ports by region
   */
  getPortsByRegion(continent: string): PortWithMetrics[] {
    return Array.from(this.portsWithMetrics.values())
      .filter(port => port.continent === continent);
  }
  
  /**
   * Get ports by country
   */
  getPortsByCountry(country: string): PortWithMetrics[] {
    return Array.from(this.portsWithMetrics.values())
      .filter(port => port.country === country);
  }
  
  /**
   * Get major ports (rank 1)
   */
  getMajorPorts(): PortWithMetrics[] {
    return Array.from(this.portsWithMetrics.values())
      .filter(port => port.rank === 1);
  }
  
  /**
   * Find nearest ports to a location
   */
  getNearestPorts(lat: number, lon: number, count: number = 5): PortWithMetrics[] {
    const portsWithDistance = Array.from(this.portsWithMetrics.values())
      .map(port => ({
        port,
        distance: this.calculateDistance(lat, lon, port.coordinates[1], port.coordinates[0])
      }))
      .sort((a, b) => a.distance - b.distance);
    
    return portsWithDistance.slice(0, count).map(item => item.port);
  }
  
  /**
   * Get ports within radius
   */
  getPortsWithinRadius(lat: number, lon: number, radiusKm: number): PortWithMetrics[] {
    return Array.from(this.portsWithMetrics.values())
      .filter(port => {
        const distance = this.calculateDistance(lat, lon, port.coordinates[1], port.coordinates[0]);
        return distance <= radiusKm;
      });
  }
  
  /**
   * Calculate shipping lane density between ports
   */
  getShippingLaneDensity(port1: string, port2: string): {
    estimatedVesselsPerDay: number;
    transitTime: number; // days
    distance: number; // km
  } | null {
    const p1 = this.portsWithMetrics.get(port1);
    const p2 = this.portsWithMetrics.get(port2);
    
    if (!p1 || !p2) return null;
    
    const distance = this.calculateDistance(
      p1.coordinates[1], p1.coordinates[0],
      p2.coordinates[1], p2.coordinates[0]
    );
    
    // Estimate based on port connectivity and distance
    const connectivityFactor = (p1.connectivity + p2.connectivity) / 200;
    const distanceFactor = Math.max(0.1, 1 - (distance / 20000)); // Decay over 20,000km
    
    const estimatedVesselsPerDay = Math.floor(
      connectivityFactor * distanceFactor * 50 // Base of 50 vessels/day for perfect route
    );
    
    // Transit time at average 20 knots
    const transitTime = Math.ceil(distance / (20 * 1.852 * 24)); // knots to km/h * 24h
    
    return {
      estimatedVesselsPerDay,
      transitTime,
      distance
    };
  }
  
  /**
   * Get port by name
   */
  getPort(name: string): PortWithMetrics | undefined {
    return this.portsWithMetrics.get(name);
  }
  
  /**
   * Calculate ground station opportunity score for a location based on nearby ports
   */
  calculatePortOpportunity(lat: number, lon: number, radiusKm: number = 500): {
    score: number; // 0-100
    nearbyPorts: number;
    totalVesselCapacity: number;
    totalSatelliteDemand: number; // GB/month
    majorPorts: string[];
  } {
    const nearbyPorts = this.getPortsWithinRadius(lat, lon, radiusKm);
    
    if (nearbyPorts.length === 0) {
      return {
        score: 0,
        nearbyPorts: 0,
        totalVesselCapacity: 0,
        totalSatelliteDemand: 0,
        majorPorts: []
      };
    }
    
    let totalCapacity = 0;
    let totalDemand = 0;
    let connectivitySum = 0;
    const majorPortNames: string[] = [];
    
    nearbyPorts.forEach(port => {
      const distance = this.calculateDistance(lat, lon, port.coordinates[1], port.coordinates[0]);
      const distanceWeight = 1 - (distance / radiusKm); // Linear decay
      
      totalCapacity += port.vesselCapacity * distanceWeight;
      totalDemand += port.satelliteDemand * distanceWeight;
      connectivitySum += port.connectivity * distanceWeight;
      
      if (port.rank === 1) {
        majorPortNames.push(port.name);
      }
    });
    
    // Calculate score based on multiple factors
    const capacityScore = Math.min(100, (totalCapacity / 1000) * 100);
    const demandScore = Math.min(100, (totalDemand / 100000) * 100);
    const connectivityScore = connectivitySum / nearbyPorts.length;
    const densityScore = Math.min(100, nearbyPorts.length * 10);
    
    const score = (
      capacityScore * 0.3 +
      demandScore * 0.3 +
      connectivityScore * 0.2 +
      densityScore * 0.2
    );
    
    return {
      score: Math.round(score),
      nearbyPorts: nearbyPorts.length,
      totalVesselCapacity: Math.round(totalCapacity),
      totalSatelliteDemand: Math.round(totalDemand),
      majorPorts: majorPortNames
    };
  }
  
  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Get global statistics
   */
  getGlobalStatistics(): {
    totalPorts: number;
    majorPorts: number;
    continentDistribution: Record<string, number>;
    totalVesselCapacity: number;
    totalSatelliteDemand: number; // GB/month
    topPortsByCapacity: string[];
  } {
    const ports = Array.from(this.portsWithMetrics.values());
    
    const continentDistribution: Record<string, number> = {};
    let totalCapacity = 0;
    let totalDemand = 0;
    
    ports.forEach(port => {
      continentDistribution[port.continent] = (continentDistribution[port.continent] || 0) + 1;
      totalCapacity += port.vesselCapacity;
      totalDemand += port.satelliteDemand;
    });
    
    const topPorts = ports
      .sort((a, b) => b.vesselCapacity - a.vesselCapacity)
      .slice(0, 10)
      .map(p => p.name);
    
    return {
      totalPorts: ports.length,
      majorPorts: ports.filter(p => p.rank === 1).length,
      continentDistribution,
      totalVesselCapacity: totalCapacity,
      totalSatelliteDemand: totalDemand,
      topPortsByCapacity: topPorts
    };
  }
}

// Export singleton instance
export const naturalEarthService = new NaturalEarthService();