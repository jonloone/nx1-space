/**
 * Competitor Ground Station Data Service
 * Tracks competitor satellite ground stations globally
 */

export interface CompetitorStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  operator: string;
  threatLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  country?: string;
  capabilities?: string[];
}

export class CompetitorDataService {
  private competitorStations: CompetitorStation[] = [
    // AWS Ground Stations
    { id: 'aws-1', name: 'AWS Oregon', latitude: 45.5152, longitude: -122.6784, operator: 'AWS', threatLevel: 'HIGH', country: 'USA' },
    { id: 'aws-2', name: 'AWS Ohio', latitude: 40.0581, longitude: -82.9988, operator: 'AWS', threatLevel: 'HIGH', country: 'USA' },
    { id: 'aws-3', name: 'AWS Ireland', latitude: 53.3498, longitude: -6.2603, operator: 'AWS', threatLevel: 'HIGH', country: 'Ireland' },
    { id: 'aws-4', name: 'AWS Stockholm', latitude: 59.3293, longitude: 18.0686, operator: 'AWS', threatLevel: 'HIGH', country: 'Sweden' },
    { id: 'aws-5', name: 'AWS Frankfurt', latitude: 50.1109, longitude: 8.6821, operator: 'AWS', threatLevel: 'HIGH', country: 'Germany' },
    { id: 'aws-6', name: 'AWS Sydney', latitude: -33.8688, longitude: 151.2093, operator: 'AWS', threatLevel: 'HIGH', country: 'Australia' },
    { id: 'aws-7', name: 'AWS Singapore', latitude: 1.3521, longitude: 103.8198, operator: 'AWS', threatLevel: 'HIGH', country: 'Singapore' },
    { id: 'aws-8', name: 'AWS Seoul', latitude: 37.5665, longitude: 126.9780, operator: 'AWS', threatLevel: 'HIGH', country: 'South Korea' },
    { id: 'aws-9', name: 'AWS Bahrain', latitude: 26.0667, longitude: 50.5577, operator: 'AWS', threatLevel: 'HIGH', country: 'Bahrain' },
    { id: 'aws-10', name: 'AWS Cape Town', latitude: -33.9249, longitude: 18.4241, operator: 'AWS', threatLevel: 'HIGH', country: 'South Africa' },
    
    // Telesat
    { id: 'tel-1', name: 'Allan Park', latitude: 45.0333, longitude: -79.7000, operator: 'Telesat', threatLevel: 'MEDIUM', country: 'Canada' },
    { id: 'tel-2', name: 'Mount Jackson', latitude: 38.7462, longitude: -78.6355, operator: 'Telesat', threatLevel: 'MEDIUM', country: 'USA' },
    { id: 'tel-3', name: 'Saskatoon', latitude: 52.1332, longitude: -106.6700, operator: 'Telesat', threatLevel: 'MEDIUM', country: 'Canada' },
    { id: 'tel-4', name: 'Aussaguel', latitude: 43.5047, longitude: 1.4442, operator: 'Telesat', threatLevel: 'MEDIUM', country: 'France' },
    { id: 'tel-5', name: 'Raisting', latitude: 47.9000, longitude: 11.1167, operator: 'Telesat', threatLevel: 'MEDIUM', country: 'Germany' },
    
    // KSAT (Polar Coverage)
    { id: 'ksat-1', name: 'Svalbard', latitude: 78.2232, longitude: 15.3785, operator: 'KSAT', threatLevel: 'LOW', country: 'Norway' },
    { id: 'ksat-2', name: 'Troll Antarctica', latitude: -72.0117, longitude: 2.5350, operator: 'KSAT', threatLevel: 'LOW', country: 'Antarctica' },
    { id: 'ksat-3', name: 'Hartebeesthoek', latitude: -25.8900, longitude: 27.6850, operator: 'KSAT', threatLevel: 'LOW', country: 'South Africa' },
    { id: 'ksat-4', name: 'Punta Arenas', latitude: -53.1638, longitude: -70.9171, operator: 'KSAT', threatLevel: 'LOW', country: 'Chile' },
    
    // SpaceX Starlink
    { id: 'spx-1', name: 'Fairbanks', latitude: 64.8378, longitude: -147.7164, operator: 'SpaceX', threatLevel: 'LOW', country: 'USA' },
    { id: 'spx-2', name: 'Redmond', latitude: 47.6740, longitude: -122.1215, operator: 'SpaceX', threatLevel: 'LOW', country: 'USA' },
    { id: 'spx-3', name: 'Bude UK', latitude: 50.8303, longitude: -4.5439, operator: 'SpaceX', threatLevel: 'LOW', country: 'UK' },
    { id: 'spx-4', name: 'Buckhorn', latitude: 40.0150, longitude: -105.2705, operator: 'SpaceX', threatLevel: 'LOW', country: 'USA' },
    { id: 'spx-5', name: 'Merrillan', latitude: 44.4472, longitude: -90.8342, operator: 'SpaceX', threatLevel: 'LOW', country: 'USA' },
    
    // Viasat
    { id: 'via-1', name: 'Carlsbad', latitude: 33.1581, longitude: -117.3506, operator: 'Viasat', threatLevel: 'MEDIUM', country: 'USA' },
    { id: 'via-2', name: 'Duluth GA', latitude: 34.0029, longitude: -84.1446, operator: 'Viasat', threatLevel: 'MEDIUM', country: 'USA' },
    { id: 'via-3', name: 'Denver', latitude: 39.7392, longitude: -104.9903, operator: 'Viasat', threatLevel: 'MEDIUM', country: 'USA' },
    
    // Eutelsat
    { id: 'eut-1', name: 'Rambouillet', latitude: 48.6444, longitude: 1.8333, operator: 'Eutelsat', threatLevel: 'MEDIUM', country: 'France' },
    { id: 'eut-2', name: 'Turin', latitude: 45.0703, longitude: 7.6869, operator: 'Eutelsat', threatLevel: 'MEDIUM', country: 'Italy' },
    { id: 'eut-3', name: 'Cagliari', latitude: 39.2238, longitude: 9.1217, operator: 'Eutelsat', threatLevel: 'MEDIUM', country: 'Italy' },
    
    // OneWeb
    { id: 'ow-1', name: 'Fairbanks', latitude: 64.8378, longitude: -147.7164, operator: 'OneWeb', threatLevel: 'MEDIUM', country: 'USA' },
    { id: 'ow-2', name: 'Tromso', latitude: 69.6496, longitude: 18.9560, operator: 'OneWeb', threatLevel: 'MEDIUM', country: 'Norway' },
    { id: 'ow-3', name: 'Seychelles', latitude: -4.6796, longitude: 55.4917, operator: 'OneWeb', threatLevel: 'MEDIUM', country: 'Seychelles' }
  ];
  
  async loadCompetitorStations(): Promise<CompetitorStation[]> {
    return this.competitorStations;
  }
  
  filterByOperator(stations: CompetitorStation[], operators: string[]): CompetitorStation[] {
    if (operators.length === 0) return stations;
    return stations.filter(s => operators.includes(s.operator));
  }
  
  filterByThreatLevel(stations: CompetitorStation[], levels: string[]): CompetitorStation[] {
    if (levels.length === 0) return stations;
    return stations.filter(s => levels.includes(s.threatLevel));
  }
  
  getOperatorStats(): Map<string, number> {
    const stats = new Map<string, number>();
    this.competitorStations.forEach(station => {
      const count = stats.get(station.operator) || 0;
      stats.set(station.operator, count + 1);
    });
    return stats;
  }
  
  getStationsByProximity(lat: number, lng: number, radiusKm: number): CompetitorStation[] {
    return this.competitorStations.filter(station => {
      const distance = this.calculateDistance(lat, lng, station.latitude, station.longitude);
      return distance <= radiusKm;
    });
  }
  
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const competitorDataService = new CompetitorDataService();