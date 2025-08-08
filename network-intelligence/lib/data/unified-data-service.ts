/**
 * Unified Data Ingestion Service
 * Combines all Priority 1 data sources for the MVP Demo
 * 
 * Data Sources:
 * 1. CelesTrak - Satellite TLE data (no auth)
 * 2. Marine Cadastre - AIS vessel data (no auth)
 * 3. Natural Earth - Port locations (static)
 * 4. Google Earth Engine - Nightlights (existing auth)
 */

import { celestrakService } from './celestrak-service';
import { marineCadastreService } from './marine-cadastre-service';
import { naturalEarthService } from './natural-earth-service';
import { GoogleEarthEngineRESTService } from '../services/googleEarthEngineRESTService';

/**
 * Unified data point structure for all sources
 */
export interface UnifiedDataPoint {
  source: 'satellite' | 'vessel' | 'port' | 'nightlight' | 'station';
  id: string;
  name: string;
  position: {
    latitude: number;
    longitude: number;
    altitude?: number; // km for satellites
  };
  value: {
    score: number; // 0-100
    confidence: number; // 0-1
    revenue?: number; // Monthly USD
  };
  metadata: any;
  timestamp: Date;
}

/**
 * Ground station opportunity analysis
 */
export interface OpportunityAnalysis {
  location: {
    latitude: number;
    longitude: number;
  };
  scores: {
    satellite: number;
    maritime: number;
    economic: number;
    overall: number;
  };
  confidence: number;
  dataPoints: UnifiedDataPoint[];
  insights: string[];
  revenue: {
    monthly: number;
    annual: number;
    breakdown: {
      satellite: number;
      maritime: number;
      terrestrial: number;
    };
  };
}

/**
 * Unified Data Ingestion Service
 */
export class UnifiedDataService {
  private geeService: GoogleEarthEngineRESTService;
  private cache: Map<string, { data: any, timestamp: Date }> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    this.geeService = new GoogleEarthEngineRESTService();
  }
  
  /**
   * Fetch all data for a specific location
   */
  async fetchLocationData(
    lat: number,
    lon: number,
    radiusKm: number = 500
  ): Promise<OpportunityAnalysis> {
    console.log(`📡 Fetching unified data for ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    
    // Fetch all data sources in parallel
    const [satellites, vessels, ports, nightlights] = await Promise.all([
      this.fetchSatelliteData(lat, lon),
      this.fetchVesselData(lat, lon, radiusKm),
      this.fetchPortData(lat, lon, radiusKm),
      this.fetchNightlightData(lat, lon, radiusKm)
    ]);
    
    // Combine all data points
    const allDataPoints = [
      ...satellites,
      ...vessels,
      ...ports,
      ...nightlights
    ];
    
    // Calculate opportunity scores
    const analysis = this.calculateOpportunity(lat, lon, allDataPoints);
    
    return analysis;
  }
  
  /**
   * Fetch satellite data from CelesTrak
   */
  private async fetchSatelliteData(lat: number, lon: number): Promise<UnifiedDataPoint[]> {
    try {
      const visibleSatellites = await celestrakService.getVisibleSatellites(lat, lon, 10);
      
      return visibleSatellites.map(sat => ({
        source: 'satellite' as const,
        id: sat.satellite.satellite_name,
        name: sat.satellite.satellite_name,
        position: {
          latitude: lat, // Simplified - would calculate actual position
          longitude: lon,
          altitude: sat.distance
        },
        value: {
          score: sat.value,
          confidence: sat.elevation / 90, // Higher elevation = higher confidence
          revenue: this.calculateSatelliteRevenue(sat.value)
        },
        metadata: {
          elevation: sat.elevation,
          azimuth: sat.azimuth,
          tle: sat.satellite
        },
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      return [];
    }
  }
  
  /**
   * Fetch vessel data from Marine Cadastre
   */
  private async fetchVesselData(lat: number, lon: number, radiusKm: number): Promise<UnifiedDataPoint[]> {
    try {
      const vesselDensity = await marineCadastreService.getVesselDensity(lat, lon, radiusKm / 1.852); // Convert km to nm
      const vessels = await marineCadastreService.fetchAISData();
      
      // Filter vessels within radius and convert to unified format
      const nearbyVessels = vessels.filter(vessel => {
        const distance = this.calculateDistance(
          lat, lon,
          vessel.position.latitude,
          vessel.position.longitude
        );
        return distance <= radiusKm;
      });
      
      return nearbyVessels.slice(0, 50).map(vessel => ({ // Limit to 50 vessels for performance
        source: 'vessel' as const,
        id: vessel.mmsi,
        name: vessel.name || `Vessel ${vessel.mmsi}`,
        position: {
          latitude: vessel.position.latitude,
          longitude: vessel.position.longitude
        },
        value: {
          score: vessel.value.score,
          confidence: 0.9, // AIS data is highly reliable
          revenue: vessel.value.monthlyRevenuePotential
        },
        metadata: {
          type: vessel.vessel.type,
          flag: vessel.flag,
          destination: vessel.voyage?.destination,
          speed: vessel.movement.speedKnots,
          course: vessel.movement.course
        },
        timestamp: vessel.position.timestamp
      }));
    } catch (error) {
      console.error('Error fetching vessel data:', error);
      return [];
    }
  }
  
  /**
   * Fetch port data from Natural Earth
   */
  private async fetchPortData(lat: number, lon: number, radiusKm: number): Promise<UnifiedDataPoint[]> {
    try {
      const nearbyPorts = naturalEarthService.getPortsWithinRadius(lat, lon, radiusKm);
      
      return nearbyPorts.map(port => ({
        source: 'port' as const,
        id: `port_${port.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: port.name,
        position: {
          latitude: port.coordinates[1],
          longitude: port.coordinates[0]
        },
        value: {
          score: port.connectivity,
          confidence: 1.0, // Static data is certain
          revenue: port.avgDailyVessels * 1000 // Estimated revenue per vessel
        },
        metadata: {
          country: port.country,
          continent: port.continent,
          rank: port.rank,
          vesselCapacity: port.vesselCapacity,
          avgDailyVessels: port.avgDailyVessels,
          cargoVolume: port.cargoVolume,
          satelliteDemand: port.satelliteDemand
        },
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Error fetching port data:', error);
      return [];
    }
  }
  
  /**
   * Fetch nightlight data from Google Earth Engine
   */
  private async fetchNightlightData(lat: number, lon: number, radiusKm: number): Promise<UnifiedDataPoint[]> {
    try {
      // Generate grid points around the location
      const gridPoints: UnifiedDataPoint[] = [];
      const gridSize = 10; // 10x10 grid
      const stepKm = radiusKm / gridSize;
      
      for (let i = -gridSize/2; i <= gridSize/2; i++) {
        for (let j = -gridSize/2; j <= gridSize/2; j++) {
          const pointLat = lat + (i * stepKm / 111);
          const pointLon = lon + (j * stepKm / (111 * Math.cos(lat * Math.PI / 180)));
          
          // Simulate nightlight intensity (in production, would query GEE)
          const distance = this.calculateDistance(lat, lon, pointLat, pointLon);
          const intensity = Math.max(0, 100 - (distance / radiusKm) * 100);
          
          if (intensity > 10) { // Only include areas with some light
            gridPoints.push({
              source: 'nightlight' as const,
              id: `nl_${pointLat.toFixed(2)}_${pointLon.toFixed(2)}`,
              name: `Nightlight Grid ${i},${j}`,
              position: {
                latitude: pointLat,
                longitude: pointLon
              },
              value: {
                score: intensity,
                confidence: 0.8, // Nightlight data confidence
                revenue: intensity * 100 // Economic activity correlation
              },
              metadata: {
                gridPosition: { i, j },
                intensity,
                dataSource: 'VIIRS_DNB'
              },
              timestamp: new Date()
            });
          }
        }
      }
      
      return gridPoints;
    } catch (error) {
      console.error('Error fetching nightlight data:', error);
      return [];
    }
  }
  
  /**
   * Calculate opportunity score for a location
   */
  private calculateOpportunity(
    lat: number,
    lon: number,
    dataPoints: UnifiedDataPoint[]
  ): OpportunityAnalysis {
    // Group data points by source
    const satellitePoints = dataPoints.filter(d => d.source === 'satellite');
    const vesselPoints = dataPoints.filter(d => d.source === 'vessel');
    const portPoints = dataPoints.filter(d => d.source === 'port');
    const nightlightPoints = dataPoints.filter(d => d.source === 'nightlight');
    
    // Calculate scores
    const satelliteScore = this.calculateSourceScore(satellitePoints);
    const maritimeScore = this.calculateSourceScore([...vesselPoints, ...portPoints]);
    const economicScore = this.calculateSourceScore(nightlightPoints);
    
    // Calculate overall score with weights
    const weights = {
      satellite: 0.35,
      maritime: 0.35,
      economic: 0.30
    };
    
    const overallScore = 
      satelliteScore * weights.satellite +
      maritimeScore * weights.maritime +
      economicScore * weights.economic;
    
    // Calculate confidence based on data availability
    const dataAvailability = [
      satellitePoints.length > 0 ? 1 : 0,
      vesselPoints.length > 0 ? 1 : 0,
      portPoints.length > 0 ? 1 : 0,
      nightlightPoints.length > 0 ? 1 : 0
    ];
    const confidence = dataAvailability.reduce((a, b) => a + b, 0) / 4;
    
    // Calculate revenue
    const satelliteRevenue = satellitePoints.reduce((sum, p) => sum + (p.value.revenue || 0), 0);
    const maritimeRevenue = [...vesselPoints, ...portPoints].reduce((sum, p) => sum + (p.value.revenue || 0), 0);
    const terrestrialRevenue = nightlightPoints.reduce((sum, p) => sum + (p.value.revenue || 0), 0);
    
    const monthlyRevenue = satelliteRevenue + maritimeRevenue + terrestrialRevenue;
    
    // Generate insights
    const insights = this.generateInsights(dataPoints, {
      satelliteScore,
      maritimeScore,
      economicScore,
      overallScore
    });
    
    return {
      location: { latitude: lat, longitude: lon },
      scores: {
        satellite: Math.round(satelliteScore),
        maritime: Math.round(maritimeScore),
        economic: Math.round(economicScore),
        overall: Math.round(overallScore)
      },
      confidence,
      dataPoints: dataPoints.slice(0, 100), // Limit for performance
      insights,
      revenue: {
        monthly: Math.round(monthlyRevenue),
        annual: Math.round(monthlyRevenue * 12),
        breakdown: {
          satellite: Math.round(satelliteRevenue),
          maritime: Math.round(maritimeRevenue),
          terrestrial: Math.round(terrestrialRevenue)
        }
      }
    };
  }
  
  /**
   * Calculate score for a source type
   */
  private calculateSourceScore(dataPoints: UnifiedDataPoint[]): number {
    if (dataPoints.length === 0) return 0;
    
    const totalScore = dataPoints.reduce((sum, point) => {
      return sum + point.value.score * point.value.confidence;
    }, 0);
    
    const totalConfidence = dataPoints.reduce((sum, point) => {
      return sum + point.value.confidence;
    }, 0);
    
    return totalConfidence > 0 ? totalScore / totalConfidence : 0;
  }
  
  /**
   * Generate insights based on data
   */
  private generateInsights(
    dataPoints: UnifiedDataPoint[],
    scores: Record<string, number>
  ): string[] {
    const insights: string[] = [];
    
    // Satellite insights
    const satellites = dataPoints.filter(d => d.source === 'satellite');
    if (satellites.length > 10) {
      insights.push(`High satellite visibility with ${satellites.length} satellites in view`);
    }
    
    // Maritime insights
    const vessels = dataPoints.filter(d => d.source === 'vessel');
    const ports = dataPoints.filter(d => d.source === 'port');
    if (ports.length > 0) {
      const majorPorts = ports.filter(p => p.metadata.rank === 1);
      if (majorPorts.length > 0) {
        insights.push(`Near major port: ${majorPorts[0].name}`);
      }
    }
    if (vessels.length > 20) {
      insights.push(`High maritime traffic with ${vessels.length} vessels nearby`);
    }
    
    // Economic insights
    if (scores.economic > 70) {
      insights.push('Strong economic activity indicated by nightlight intensity');
    }
    
    // Overall recommendation
    if (scores.overall > 80) {
      insights.push('📍 EXCELLENT location for ground station deployment');
    } else if (scores.overall > 60) {
      insights.push('✅ Good location with strong potential');
    } else if (scores.overall > 40) {
      insights.push('⚠️ Moderate opportunity - consider alternatives');
    } else {
      insights.push('❌ Low opportunity - not recommended');
    }
    
    return insights;
  }
  
  /**
   * Calculate satellite revenue potential
   */
  private calculateSatelliteRevenue(value: number): number {
    // Tiered pricing based on satellite value
    if (value >= 80) return 50000; // Critical satellites
    if (value >= 60) return 30000; // High-value
    if (value >= 40) return 15000; // Medium-value
    return 5000; // Standard
  }
  
  /**
   * Calculate distance between two points
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
   * Get cached data if available
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }
  
  /**
   * Cache data
   */
  private cacheData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const unifiedDataService = new UnifiedDataService();