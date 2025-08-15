export class DataService {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  
  static async loadGroundStationData(options: any = {}) {
    // Mock data for testing
    const mockStations = [
      { 
        id: 'GS001', 
        name: 'New York Ground Station',
        latitude: 40.7128, 
        longitude: -74.0060, 
        coverage_area_km2: 500, 
        utilization: 0.7, 
        score: 0.65 
      },
      { 
        id: 'GS002', 
        name: 'London Facility',
        latitude: 51.5074, 
        longitude: -0.1278, 
        coverage_area_km2: 800, 
        utilization: 0.9, 
        score: 0.45 
      },
      { 
        id: 'GS003', 
        name: 'Tokyo Operations',
        latitude: 35.6762, 
        longitude: 139.6503, 
        coverage_area_km2: 600, 
        utilization: 0.3, 
        score: 0.85 
      },
      {
        id: 'GS004',
        name: 'Singapore Hub',
        latitude: 1.3521,
        longitude: 103.8198,
        coverage_area_km2: 400,
        utilization: 0.5,
        score: 0.75
      },
      {
        id: 'GS005',
        name: 'Sydney Station',
        latitude: -33.8688,
        longitude: 151.2093,
        coverage_area_km2: 550,
        utilization: 0.6,
        score: 0.70
      }
    ];
    
    // Generate mock footprints
    const mockFootprints = mockStations.map(station => ({
      id: `FP_${station.id}`,
      footprint_coordinates: this.generateFootprint(
        station.longitude,
        station.latitude,
        Math.sqrt(station.coverage_area_km2) / 10
      )
    }));
    
    // Generate coverage grid
    const coverage = this.generateCoverageGrid(mockStations);
    
    // Mock predictions
    const predictions = options.includePredictions ? {
      opportunities: mockStations
        .filter(s => s.score > 0.7)
        .map(s => ({
          ...s,
          opportunity_score: s.score * (1 - s.utilization),
          boundary: this.generateFootprint(s.longitude, s.latitude, 0.5)
        })),
      scores: mockStations.map(s => ({
        ...s,
        confidence: 0.75 + Math.random() * 0.2
      }))
    } : null;
    
    if (predictions) {
      this.cache.set(`${options.domain || 'ground-stations'}_predictions`, {
        data: predictions,
        timestamp: Date.now()
      });
    }
    
    return {
      stations: mockStations,
      footprints: mockFootprints,
      coverage,
      predictions,
      timestamp: Date.now()
    };
  }
  
  static async loadMaritimeData(options: any = {}) {
    // Mock vessel data
    const mockVessels = [
      {
        id: 'V001',
        vessel_name: 'Pacific Explorer',
        vessel_type: 'cargo',
        latitude: 1.3521 + Math.random() * 2,
        longitude: 103.8198 + Math.random() * 2,
        speed: 15,
        heading: 45,
        risk_score: 0.3,
        size: 3
      },
      {
        id: 'V002',
        vessel_name: 'Atlantic Trader',
        vessel_type: 'tanker',
        latitude: 51.5074 + Math.random() * 2,
        longitude: -0.1278 + Math.random() * 2,
        speed: 12,
        heading: 120,
        risk_score: 0.5,
        size: 4
      },
      {
        id: 'V003',
        vessel_name: 'Star Cruiser',
        vessel_type: 'passenger',
        latitude: 25.7617 + Math.random() * 2,
        longitude: -80.1918 + Math.random() * 2,
        speed: 20,
        heading: 270,
        risk_score: 0.2,
        size: 5
      }
    ];
    
    // Generate more vessels for density
    for (let i = 4; i < 50; i++) {
      mockVessels.push({
        id: `V${i.toString().padStart(3, '0')}`,
        vessel_name: `Vessel ${i}`,
        vessel_type: ['cargo', 'tanker', 'fishing'][i % 3],
        latitude: -90 + Math.random() * 180,
        longitude: -180 + Math.random() * 360,
        speed: 5 + Math.random() * 20,
        heading: Math.random() * 360,
        risk_score: Math.random(),
        size: 1 + Math.random() * 4
      });
    }
    
    // Generate density data
    const density = this.generateDensityData(mockVessels);
    
    // Mock ports
    const ports = [
      { id: 'P1', name: 'Singapore', latitude: 1.3521, longitude: 103.8198, activity: 0.95 },
      { id: 'P2', name: 'Rotterdam', latitude: 51.9225, longitude: 4.47917, activity: 0.85 },
      { id: 'P3', name: 'Shanghai', latitude: 31.2304, longitude: 121.4737, activity: 0.92 }
    ];
    
    return {
      vessels: mockVessels,
      density,
      ports,
      tracks: options.realTime ? [] : null,
      riskZones: null,
      currentTime: Date.now(),
      timestamp: Date.now()
    };
  }
  
  static async loadMockData(domain: string) {
    // Return empty data for other domains
    return {
      entities: [],
      timestamp: Date.now()
    };
  }
  
  private static generateFootprint(lon: number, lat: number, radius: number) {
    const points = [];
    const numPoints = 32;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      points.push([
        lon + radius * Math.cos(angle),
        lat + radius * Math.sin(angle) * 0.8 // Elliptical for realism
      ]);
    }
    
    points.push(points[0]); // Close polygon
    return points;
  }
  
  private static generateCoverageGrid(stations: any[]) {
    const gridPoints = [];
    
    stations.forEach(station => {
      const gridSize = 0.5;
      for (let dlat = -1; dlat <= 1; dlat += gridSize) {
        for (let dlon = -1; dlon <= 1; dlon += gridSize) {
          gridPoints.push({
            longitude: station.longitude + dlon,
            latitude: station.latitude + dlat,
            utilization: station.utilization + (Math.random() - 0.5) * 0.2,
            station_id: station.id
          });
        }
      }
    });
    
    return gridPoints;
  }
  
  private static generateDensityData(vessels: any[]) {
    const gridMap = new Map<string, number>();
    const gridSize = 5; // degrees
    
    vessels.forEach(vessel => {
      const gridLat = Math.floor(vessel.latitude / gridSize) * gridSize;
      const gridLon = Math.floor(vessel.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLon}`;
      
      gridMap.set(key, (gridMap.get(key) || 0) + 1);
    });
    
    return Array.from(gridMap.entries()).map(([key, count]) => {
      const [lat, lon] = key.split(',').map(Number);
      return {
        latitude: lat + gridSize / 2,
        longitude: lon + gridSize / 2,
        count
      };
    });
  }
}