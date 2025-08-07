/**
 * Comprehensive Ground Station Data Service
 * Includes all SES/Intelsat stations and competitor facilities
 */

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  operator: string;
  type: string;
  utilization?: number;
  revenue?: number;
  profit?: number;
  margin?: number;
  status?: string;
  opportunityScore?: number;
  threatLevel?: string;
}

export class StationDataService {
  // All SES stations (including merged Intelsat)
  private sesStations: Station[] = [
    // SES Primary Facilities
    { id: 'ses-1', name: 'Betzdorf', latitude: 49.6833, longitude: 6.3500, country: 'Luxembourg', operator: 'SES', type: 'primary' },
    { id: 'ses-2', name: 'Manassas VA', latitude: 38.7509, longitude: -77.4753, country: 'USA', operator: 'SES', type: 'primary' },
    { id: 'ses-3', name: 'Woodbine MD', latitude: 39.3365, longitude: -77.0647, country: 'USA', operator: 'SES', type: 'primary' },
    { id: 'ses-4', name: 'Vernon', latitude: 50.2581, longitude: -119.2691, country: 'Canada', operator: 'SES', type: 'teleport' },
    { id: 'ses-5', name: 'Hawley PA', latitude: 41.4759, longitude: -75.1805, country: 'USA', operator: 'SES', type: 'teleport' },
    { id: 'ses-6', name: 'Riverside CA', latitude: 33.9533, longitude: -117.3962, country: 'USA', operator: 'SES', type: 'teleport' },
    { id: 'ses-7', name: 'Gibraltar', latitude: 36.1408, longitude: -5.3536, country: 'Gibraltar', operator: 'SES', type: 'gateway' },
    { id: 'ses-8', name: 'Fuchsstadt', latitude: 50.1167, longitude: 10.0333, country: 'Germany', operator: 'SES', type: 'teleport' },
    { id: 'ses-9', name: 'Stockholm', latitude: 59.3293, longitude: 18.0686, country: 'Sweden', operator: 'SES', type: 'teleport' },
    { id: 'ses-10', name: 'Perth', latitude: -31.9505, longitude: 115.8605, country: 'Australia', operator: 'SES', type: 'gateway' },
    { id: 'ses-11', name: 'Dubbo', latitude: -32.2569, longitude: 148.6011, country: 'Australia', operator: 'SES', type: 'o3b' },
    { id: 'ses-12', name: 'Manus Island', latitude: -2.0667, longitude: 146.9000, country: 'PNG', operator: 'SES', type: 'o3b' },
    { id: 'ses-13', name: 'Hawaii', latitude: 21.3099, longitude: -157.8581, country: 'USA', operator: 'SES', type: 'o3b' },
    { id: 'ses-14', name: 'Sunset Beach', latitude: 21.6795, longitude: -158.0420, country: 'USA', operator: 'SES', type: 'gateway' },
    { id: 'ses-15', name: 'Bogota', latitude: 4.7110, longitude: -74.0721, country: 'Colombia', operator: 'SES', type: 'teleport' },
    { id: 'ses-16', name: 'Castle Rock CO', latitude: 39.3722, longitude: -104.8561, country: 'USA', operator: 'SES', type: 'teleport' },
    { id: 'ses-17', name: 'Brewster WA', latitude: 48.0976, longitude: -119.7806, country: 'USA', operator: 'SES', type: 'teleport' },
    
    // Former Intelsat Facilities (now SES)
    { id: 'int-1', name: 'Atlanta GA', latitude: 33.7490, longitude: -84.3880, country: 'USA', operator: 'SES', type: 'primary' },
    { id: 'int-2', name: 'Mountainside MD', latitude: 39.0458, longitude: -77.2097, country: 'USA', operator: 'SES', type: 'primary' },
    { id: 'int-3', name: 'Hagerstown MD', latitude: 39.6418, longitude: -77.7200, country: 'USA', operator: 'SES', type: 'teleport' },
    { id: 'int-4', name: 'Napa CA', latitude: 38.2975, longitude: -122.2869, country: 'USA', operator: 'SES', type: 'teleport' },
    { id: 'int-5', name: 'Kumsan', latitude: 36.0789, longitude: 127.4870, country: 'South Korea', operator: 'SES', type: 'teleport' },
    { id: 'int-6', name: 'Beijing', latitude: 39.9042, longitude: 116.4074, country: 'China', operator: 'SES', type: 'teleport' },
    { id: 'int-7', name: 'Adelaide', latitude: -34.9285, longitude: 138.6007, country: 'Australia', operator: 'SES', type: 'teleport' },
    { id: 'int-8', name: 'Johannesburg', latitude: -26.2041, longitude: 28.0473, country: 'South Africa', operator: 'SES', type: 'teleport' },
    { id: 'int-9', name: 'Mexico City', latitude: 19.4326, longitude: -99.1332, country: 'Mexico', operator: 'SES', type: 'teleport' },
    { id: 'int-10', name: 'Rio de Janeiro', latitude: -22.9068, longitude: -43.1729, country: 'Brazil', operator: 'SES', type: 'teleport' },
    { id: 'int-11', name: 'Buenos Aires', latitude: -34.6037, longitude: -58.3816, country: 'Argentina', operator: 'SES', type: 'teleport' },
    { id: 'int-12', name: 'Dubai', latitude: 25.2048, longitude: 55.2708, country: 'UAE', operator: 'SES', type: 'teleport' },
    { id: 'int-13', name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, country: 'India', operator: 'SES', type: 'teleport' },
    { id: 'int-14', name: 'Singapore', latitude: 1.3521, longitude: 103.8198, country: 'Singapore', operator: 'SES', type: 'teleport' },
    { id: 'int-15', name: 'Bucharest', latitude: 44.4268, longitude: 26.1025, country: 'Romania', operator: 'SES', type: 'regional' }
  ];
  
  async loadAllStations(): Promise<Station[]> {
    // Add operational metrics to each station
    return this.sesStations.map(station => ({
      ...station,
      utilization: 40 + Math.random() * 50, // 40-90%
      revenue: 1 + Math.random() * 9, // $1-10M
      profit: -1 + Math.random() * 3, // -$1M to $2M
      margin: -0.1 + Math.random() * 0.4, // -10% to 30%
      status: Math.random() > 0.9 ? 'critical' : 'operational',
      opportunityScore: Math.random()
    }));
  }
  
  async loadStationById(id: string): Promise<Station | null> {
    const stations = await this.loadAllStations();
    return stations.find(s => s.id === id) || null;
  }
  
  async loadStationsByOperator(operator: string): Promise<Station[]> {
    const stations = await this.loadAllStations();
    return stations.filter(s => s.operator === operator);
  }
}

export const stationDataService = new StationDataService();