/**
 * GERs Demo Service
 * Simulates Overture Maps Global Entity Reference System for prototype demo
 * Focuses on Maritime, Logistics, and Defense/Intel use cases
 *
 * Level of Detail (LoD) Organization:
 * - Landmark: Notable monuments and points of interest
 * - Place: Buildings, facilities, and specific venues
 * - City: Cities and municipalities
 * - State: States, provinces, and regions
 * - Country: Countries and nations
 */

export type LevelOfDetail = 'landmark' | 'place' | 'city' | 'state' | 'country'

export interface GERSPlace {
  gersId: string
  name: string
  categories: string[]
  levelOfDetail: LevelOfDetail
  location: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
  }
  contact?: {
    phone?: string
    website?: string
  }
  properties?: {
    [key: string]: any
  }
  distance?: number // meters (calculated)
  bearing?: number // degrees (calculated)
}

/**
 * Level of Detail configuration with Phosphor Icons
 * Icons: MapPin, Buildings, City, MapTrifold, Globe
 */
export const LOD_CONFIG = {
  landmark: {
    label: 'Landmarks',
    description: 'Notable monuments and points of interest',
    icon: 'MapPin',
    color: '#EF4444',
    zoom: 17
  },
  place: {
    label: 'Places',
    description: 'Buildings, facilities, and specific venues',
    icon: 'Buildings',
    color: '#176BF8',
    zoom: 15
  },
  city: {
    label: 'Cities',
    description: 'Cities and municipalities',
    icon: 'City',
    color: '#10B981',
    zoom: 12
  },
  state: {
    label: 'States',
    description: 'States, provinces, and regions',
    icon: 'MapTrifold',
    color: '#F59E0B',
    zoom: 7
  },
  country: {
    label: 'Countries',
    description: 'Countries and nations',
    icon: 'Globe',
    color: '#8B5CF6',
    zoom: 5
  }
}

export interface GERSSearchQuery {
  categories?: string[]
  near?: [number, number]
  radius?: number // meters
  text?: string
  limit?: number
  levelOfDetail?: LevelOfDetail[] // Filter by LoD
}

export interface IndustryScenario {
  id: string
  name: string
  description: string
  categories: string[]
  icon: string
  color: string
}

/**
 * Demo data: Real-world places for each industry scenario
 */
const DEMO_PLACES: GERSPlace[] = [
  // === MARITIME ===
  // Port of Los Angeles
  {
    gersId: 'gers_port_la_main',
    name: 'Port of Los Angeles - Main Gate',
    categories: ['port', 'marine_terminal', 'cargo_facility'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2683, 33.7401] },
    address: { street: '425 S Palos Verdes St', city: 'San Pedro', state: 'CA', country: 'USA' },
    properties: {
      berths: 43,
      annualTEU: 9500000,
      operatingHours: '24/7',
      facilityType: 'Container Terminal'
    }
  },
  {
    gersId: 'gers_port_la_fuel',
    name: 'Marine Fuel Depot - Port of LA',
    categories: ['fuel_dock', 'marine_services'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2723, 33.7421] },
    properties: {
      fuelTypes: ['MGO', 'HFO', 'VLSFO'],
      availability: '24/7',
      capacity: 50000
    }
  },
  {
    gersId: 'gers_la_customs',
    name: 'U.S. Customs and Border Protection - LA',
    categories: ['customs_office', 'government', 'port_authority'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2656, 33.7389] },
    properties: {
      hours: 'Mon-Fri 08:00-17:00',
      services: ['cargo_inspection', 'documentation', 'clearance']
    }
  },
  {
    gersId: 'gers_la_ship_repair',
    name: 'Pacific Marine Center',
    categories: ['ship_repair', 'marine_services', 'dry_dock'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2745, 33.7452] },
    properties: {
      dryDockCapacity: 50000,
      services: ['hull_repair', 'engine_overhaul', 'welding'],
      emergency: true
    }
  },

  // Port of Long Beach
  {
    gersId: 'gers_port_lb_main',
    name: 'Port of Long Beach',
    categories: ['port', 'marine_terminal', 'cargo_facility'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2158, 33.7547] },
    properties: {
      berths: 80,
      annualTEU: 8100000,
      operatingHours: '24/7'
    }
  },

  // === LOGISTICS ===
  // Warehouses
  {
    gersId: 'gers_amazon_ontario',
    name: 'Amazon Fulfillment Center ONT9',
    categories: ['warehouse', 'logistics_facility', 'distribution_center'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-117.5880, 34.0631] },
    address: { street: '24208 San Michele Rd', city: 'Moreno Valley', state: 'CA', country: 'USA' },
    properties: {
      size_sqft: 855000,
      loadingDocks: 143,
      parkingSpaces: 450,
      operatingHours: '24/7',
      capabilities: ['same_day_delivery', 'heavy_items', 'refrigerated']
    }
  },
  {
    gersId: 'gers_fedex_lax',
    name: 'FedEx Ground Hub - LAX',
    categories: ['warehouse', 'logistics_facility', 'sorting_facility'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.3912, 33.9441] },
    properties: {
      size_sqft: 450000,
      sortingCapacity: 35000,
      operatingHours: '24/7'
    }
  },

  // Delivery Stops - Commercial
  {
    gersId: 'gers_walmart_lb',
    name: 'Walmart Supercenter',
    categories: ['supermarket', 'retail', 'delivery_stop'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.1245, 33.7989] },
    properties: {
      receivingHours: '06:00-22:00',
      loadingDock: true,
      parking: 'large_vehicles',
      deliveryNotes: 'Use dock 3 for grocery deliveries'
    }
  },
  {
    gersId: 'gers_target_la',
    name: 'Target Store',
    categories: ['retail', 'delivery_stop'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2912, 34.0489] },
    properties: {
      receivingHours: '07:00-20:00',
      loadingDock: true,
      parking: 'limited'
    }
  },

  // Restaurants (driver amenities)
  {
    gersId: 'gers_in_n_out_lb',
    name: 'In-N-Out Burger',
    categories: ['restaurant', 'fast_food', 'driver_amenity'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.1523, 33.8245] },
    properties: {
      hours: '10:30-01:00',
      truckParking: true,
      restrooms: true
    }
  },
  {
    gersId: 'gers_pilot_travel',
    name: 'Pilot Travel Center',
    categories: ['gas_station', 'truck_stop', 'driver_amenity'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-117.9234, 33.9567] },
    properties: {
      hours: '24/7',
      truckParking: 50,
      showers: true,
      restaurant: true,
      fuelTypes: ['diesel', 'gasoline', 'DEF']
    }
  },

  // === DEFENSE / INTELLIGENCE ===
  // Critical Infrastructure
  {
    gersId: 'gers_hospital_cedars',
    name: 'Cedars-Sinai Medical Center',
    categories: ['hospital', 'emergency_room', 'critical_infrastructure'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.3765, 34.0754] },
    address: { street: '8700 Beverly Blvd', city: 'Los Angeles', state: 'CA', country: 'USA' },
    properties: {
      traumaLevel: 1,
      emergencyRoom: true,
      beds: 886,
      specialties: ['cardiology', 'neurology', 'oncology'],
      availability: '24/7'
    }
  },
  {
    gersId: 'gers_ucla_medical',
    name: 'UCLA Medical Center',
    categories: ['hospital', 'emergency_room', 'critical_infrastructure'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.4452, 34.0689] },
    properties: {
      traumaLevel: 1,
      emergencyRoom: true,
      beds: 466
    }
  },

  // Government Facilities
  {
    gersId: 'gers_lapd_central',
    name: 'LAPD Central Division',
    categories: ['police_station', 'emergency_services', 'government'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2467, 34.0442] },
    properties: {
      availability: '24/7',
      emergencyResponse: true,
      jurisdiction: 'Downtown LA'
    }
  },
  {
    gersId: 'gers_lafd_station1',
    name: 'LAFD Fire Station 1',
    categories: ['fire_station', 'emergency_services', 'critical_infrastructure'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2389, 34.0512] },
    properties: {
      availability: '24/7',
      capabilities: ['fire', 'medical', 'hazmat']
    }
  },

  // Utilities
  {
    gersId: 'gers_power_station_scattergood',
    name: 'Scattergood Generating Station',
    categories: ['power_station', 'critical_infrastructure', 'utilities'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.4567, 33.9312] },
    properties: {
      capacity_mw: 800,
      type: 'natural_gas',
      operator: 'LADWP',
      criticality: 'high'
    }
  },

  // Communications
  {
    gersId: 'gers_telecom_tower_dtla',
    name: 'AT&T Network Hub - Downtown LA',
    categories: ['telecom_facility', 'critical_infrastructure', 'communications'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2534, 34.0489] },
    properties: {
      type: 'fiber_hub',
      coverage: 'metro_area',
      criticality: 'high'
    }
  },

  // Border Crossings (Landmark)
  {
    gersId: 'gers_border_san_ysidro',
    name: 'San Ysidro Port of Entry',
    categories: ['border_crossing', 'customs_office', 'critical_infrastructure'],
    levelOfDetail: 'landmark',
    location: { type: 'Point', coordinates: [-117.0382, 32.5423] },
    properties: {
      type: 'land_border',
      country: 'Mexico',
      vehicleLanes: 26,
      pedestrianLanes: 20,
      operatingHours: '24/7'
    }
  },

  // Schools (Landmark)
  {
    gersId: 'gers_school_ucla',
    name: 'UCLA Campus',
    categories: ['university', 'public_gathering', 'educational'],
    levelOfDetail: 'landmark',
    location: { type: 'Point', coordinates: [-118.4452, 34.0689] },
    properties: {
      enrollment: 45000,
      type: 'university',
      hours: '24/7'
    }
  },

  // Airports (Landmark)
  {
    gersId: 'gers_lax',
    name: 'Los Angeles International Airport',
    categories: ['airport', 'transportation_hub', 'critical_infrastructure'],
    levelOfDetail: 'landmark',
    location: { type: 'Point', coordinates: [-118.4085, 33.9416] },
    properties: {
      iataCode: 'LAX',
      terminals: 9,
      annualPassengers: 88000000,
      operatingHours: '24/7'
    }
  },

  // More gas stations for logistics
  {
    gersId: 'gers_shell_carson',
    name: 'Shell Gas Station',
    categories: ['gas_station', 'fuel', 'driver_amenity'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.2534, 33.8345] },
    properties: {
      hours: '24/7',
      fuelTypes: ['gasoline', 'diesel'],
      conveniences: ['restroom', 'atm', 'convenience_store']
    }
  },
  {
    gersId: 'gers_chevron_lb',
    name: 'Chevron Gas Station',
    categories: ['gas_station', 'fuel', 'driver_amenity'],
    levelOfDetail: 'place',
    location: { type: 'Point', coordinates: [-118.1789, 33.7823] },
    properties: {
      hours: '05:00-23:00',
      fuelTypes: ['gasoline', 'diesel']
    }
  },

  // === GEOGRAPHIC PLACES ===
  // Cities
  {
    gersId: 'gers_city_la',
    name: 'Los Angeles',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
    address: { city: 'Los Angeles', state: 'CA', country: 'USA' },
    properties: {
      population: 3900000,
      area_sqmi: 503,
      founded: 1781
    }
  },
  {
    gersId: 'gers_city_long_beach',
    name: 'Long Beach',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-118.1937, 33.7701] },
    address: { city: 'Long Beach', state: 'CA', country: 'USA' },
    properties: {
      population: 470000,
      area_sqmi: 65
    }
  },
  {
    gersId: 'gers_city_san_pedro',
    name: 'San Pedro',
    categories: ['city', 'neighborhood'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-118.2923, 33.7361] },
    address: { city: 'San Pedro', state: 'CA', country: 'USA' },
    properties: {
      population: 81000,
      district: 'Los Angeles'
    }
  },
  {
    gersId: 'gers_city_houston',
    name: 'Houston',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-95.3698, 29.7604] },
    address: { city: 'Houston', state: 'TX', country: 'USA' },
    properties: {
      population: 2300000,
      area_sqmi: 671,
      founded: 1836
    }
  },
  {
    gersId: 'gers_city_new_york',
    name: 'New York',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-74.0060, 40.7128] },
    address: { city: 'New York', state: 'NY', country: 'USA' },
    properties: {
      population: 8300000,
      area_sqmi: 302,
      founded: 1624
    }
  },
  {
    gersId: 'gers_city_chicago',
    name: 'Chicago',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-87.6298, 41.8781] },
    address: { city: 'Chicago', state: 'IL', country: 'USA' },
    properties: {
      population: 2700000,
      area_sqmi: 234,
      founded: 1837
    }
  },
  {
    gersId: 'gers_city_miami',
    name: 'Miami',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-80.1918, 25.7617] },
    address: { city: 'Miami', state: 'FL', country: 'USA' },
    properties: {
      population: 470000,
      area_sqmi: 56,
      founded: 1896
    }
  },
  {
    gersId: 'gers_city_seattle',
    name: 'Seattle',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-122.3321, 47.6062] },
    address: { city: 'Seattle', state: 'WA', country: 'USA' },
    properties: {
      population: 750000,
      area_sqmi: 142,
      founded: 1851
    }
  },
  {
    gersId: 'gers_city_san_francisco',
    name: 'San Francisco',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
    address: { city: 'San Francisco', state: 'CA', country: 'USA' },
    properties: {
      population: 875000,
      area_sqmi: 47,
      founded: 1776
    }
  },
  {
    gersId: 'gers_city_denver',
    name: 'Denver',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-104.9903, 39.7392] },
    address: { city: 'Denver', state: 'CO', country: 'USA' },
    properties: {
      population: 715000,
      area_sqmi: 155,
      founded: 1858
    }
  },
  {
    gersId: 'gers_city_washington_dc',
    name: 'Washington, D.C.',
    categories: ['city', 'capital'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-77.0369, 38.9072] },
    address: { city: 'Washington', state: 'DC', country: 'USA' },
    properties: {
      population: 700000,
      area_sqmi: 68,
      founded: 1790
    }
  },
  {
    gersId: 'gers_city_boston',
    name: 'Boston',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-71.0589, 42.3601] },
    address: { city: 'Boston', state: 'MA', country: 'USA' },
    properties: {
      population: 675000,
      area_sqmi: 90,
      founded: 1630
    }
  },
  {
    gersId: 'gers_city_atlanta',
    name: 'Atlanta',
    categories: ['city', 'municipality'],
    levelOfDetail: 'city',
    location: { type: 'Point', coordinates: [-84.3880, 33.7490] },
    address: { city: 'Atlanta', state: 'GA', country: 'USA' },
    properties: {
      population: 500000,
      area_sqmi: 134,
      founded: 1837
    }
  },

  // State
  {
    gersId: 'gers_state_california',
    name: 'California',
    categories: ['state', 'region'],
    levelOfDetail: 'state',
    location: { type: 'Point', coordinates: [-119.4179, 36.7783] },
    address: { state: 'CA', country: 'USA' },
    properties: {
      population: 39000000,
      area_sqmi: 163696,
      capital: 'Sacramento'
    }
  },

  // Country
  {
    gersId: 'gers_country_usa',
    name: 'United States',
    categories: ['country', 'nation'],
    levelOfDetail: 'country',
    location: { type: 'Point', coordinates: [-98.5795, 39.8283] },
    address: { country: 'USA' },
    properties: {
      population: 331000000,
      area_sqmi: 3797000,
      capital: 'Washington, D.C.'
    }
  }
]

/**
 * Industry scenarios for demo
 */
export const INDUSTRY_SCENARIOS: Record<string, IndustryScenario> = {
  maritime: {
    id: 'maritime',
    name: 'Maritime Operations',
    description: 'Port facilities, fuel docks, customs, and marine services',
    categories: ['port', 'marine_terminal', 'fuel_dock', 'customs_office', 'ship_repair', 'marine_services'],
    icon: 'Ship',
    color: '#3b82f6'
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics & Delivery',
    description: 'Warehouses, delivery stops, truck stops, and driver amenities',
    categories: ['warehouse', 'logistics_facility', 'delivery_stop', 'truck_stop', 'gas_station', 'restaurant', 'driver_amenity'],
    icon: 'Truck',
    color: '#10b981'
  },
  defense: {
    id: 'defense',
    name: 'Defense & Intelligence',
    description: 'Critical infrastructure, emergency services, and strategic facilities',
    categories: ['hospital', 'emergency_room', 'police_station', 'fire_station', 'power_station', 'telecom_facility', 'border_crossing', 'airport', 'critical_infrastructure'],
    icon: 'Shield',
    color: '#ef4444'
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lon1, lat1] = point1
  const [lon2, lat2] = point2
  const R = 6371000 // Earth's radius in meters

  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate bearing between two points
 */
function calculateBearing(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lon1, lat1] = point1
  const [lon2, lat2] = point2

  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const θ = Math.atan2(y, x)
  return ((θ * 180) / Math.PI + 360) % 360
}

/**
 * GERs Demo Service
 */
export class GERSDemoService {
  private places: GERSPlace[] = DEMO_PLACES

  /**
   * Search for places matching query
   */
  async search(query: GERSSearchQuery): Promise<GERSPlace[]> {
    let results = [...this.places]

    // Filter by Level of Detail
    if (query.levelOfDetail && query.levelOfDetail.length > 0) {
      results = results.filter((place) =>
        query.levelOfDetail!.includes(place.levelOfDetail)
      )
    }

    // Filter by categories
    if (query.categories && query.categories.length > 0) {
      results = results.filter((place) =>
        place.categories.some((cat) => query.categories!.includes(cat))
      )
    }

    // Filter by text
    if (query.text) {
      const searchText = query.text.toLowerCase()
      results = results.filter(
        (place) =>
          place.name.toLowerCase().includes(searchText) ||
          place.categories.some((cat) => cat.toLowerCase().includes(searchText))
      )
    }

    // Filter by proximity
    if (query.near && query.radius) {
      results = results
        .map((place) => ({
          ...place,
          distance: calculateDistance(query.near!, place.location.coordinates),
          bearing: calculateBearing(query.near!, place.location.coordinates)
        }))
        .filter((place) => place.distance! <= query.radius!)
        .sort((a, b) => a.distance! - b.distance!)
    }

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit)
    }

    return results
  }

  /**
   * Search by industry scenario
   */
  async searchByScenario(
    scenario: 'maritime' | 'logistics' | 'defense',
    near?: [number, number],
    radius: number = 50000 // 50km default
  ): Promise<GERSPlace[]> {
    const config = INDUSTRY_SCENARIOS[scenario]
    return this.search({
      categories: config.categories,
      near,
      radius,
      limit: 50
    })
  }

  /**
   * Get place by GERs ID
   */
  async getById(gersId: string): Promise<GERSPlace | null> {
    return this.places.find((p) => p.gersId === gersId) || null
  }

  /**
   * Get nearby places for contextual enrichment
   */
  async getNearbyContext(
    point: [number, number],
    radius: number = 5000 // 5km default
  ): Promise<{
    maritime: GERSPlace[]
    logistics: GERSPlace[]
    defense: GERSPlace[]
    all: GERSPlace[]
  }> {
    const allResults = await this.search({ near: point, radius, limit: 100 })

    return {
      maritime: allResults.filter((p) =>
        p.categories.some((cat) =>
          INDUSTRY_SCENARIOS.maritime.categories.includes(cat)
        )
      ),
      logistics: allResults.filter((p) =>
        p.categories.some((cat) =>
          INDUSTRY_SCENARIOS.logistics.categories.includes(cat)
        )
      ),
      defense: allResults.filter((p) =>
        p.categories.some((cat) =>
          INDUSTRY_SCENARIOS.defense.categories.includes(cat)
        )
      ),
      all: allResults
    }
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      port: '⚓',
      marine_terminal: '🚢',
      fuel_dock: '⛽',
      customs_office: '🏛️',
      ship_repair: '🔧',
      warehouse: '📦',
      logistics_facility: '🏭',
      delivery_stop: '📍',
      truck_stop: '🚛',
      gas_station: '⛽',
      restaurant: '🍔',
      hospital: '🏥',
      emergency_room: '🚨',
      police_station: '👮',
      fire_station: '🚒',
      power_station: '⚡',
      telecom_facility: '📡',
      border_crossing: '🛂',
      airport: '✈️',
      critical_infrastructure: '🏗️',
      city: '🏙️',
      municipality: '🏙️',
      capital: '⭐',
      state: '🗺️',
      region: '🗺️',
      country: '🌍',
      nation: '🌍'
    }
    return iconMap[category] || '📍'
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`
    } else {
      return `${Math.round(meters / 1000)}km`
    }
  }

  /**
   * Format bearing for display
   */
  formatBearing(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }
}

// Singleton instance
let serviceInstance: GERSDemoService | null = null

export function getGERSDemoService(): GERSDemoService {
  if (!serviceInstance) {
    serviceInstance = new GERSDemoService()
  }
  return serviceInstance
}
