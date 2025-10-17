/**
 * Overture Places Category Configuration
 * Hierarchical organization of place categories with display properties
 *
 * Categories are organized into logical groups for better UX
 * Each category has icons, colors, and zoom thresholds
 */

export interface CategoryConfig {
  id: string
  name: string
  icon: string // Emoji icon
  color: string // Hex color
  minZoom: number // Minimum zoom to show this category
  priority: number // Rendering priority (higher = render first)
  enabled: boolean // Default enabled state
}

export interface CategoryGroup {
  id: string
  name: string
  icon: string
  color: string
  categories: string[] // Category IDs in this group
  collapsible: boolean
  defaultExpanded: boolean
}

/**
 * All place categories with their display properties
 */
export const PLACE_CATEGORIES: Record<string, CategoryConfig> = {
  // Transportation
  airport: {
    id: 'airport',
    name: 'Airports',
    icon: '✈️',
    color: '#176BF8',
    minZoom: 4,
    priority: 100,
    enabled: true
  },
  seaport: {
    id: 'seaport',
    name: 'Seaports',
    icon: '⚓',
    color: '#0EA5E9',
    minZoom: 6,
    priority: 90,
    enabled: true
  },
  train_station: {
    id: 'train_station',
    name: 'Train Stations',
    icon: '🚆',
    color: '#0EA5E9',
    minZoom: 10,
    priority: 70,
    enabled: true
  },
  bus_station: {
    id: 'bus_station',
    name: 'Bus Stations',
    icon: '🚌',
    color: '#0EA5E9',
    minZoom: 11,
    priority: 60,
    enabled: true
  },
  ferry_terminal: {
    id: 'ferry_terminal',
    name: 'Ferry Terminals',
    icon: '⛴️',
    color: '#0EA5E9',
    minZoom: 11,
    priority: 60,
    enabled: true
  },

  // Healthcare
  hospital: {
    id: 'hospital',
    name: 'Hospitals',
    icon: '🏥',
    color: '#EF4444',
    minZoom: 8,
    priority: 95,
    enabled: true
  },
  clinic: {
    id: 'clinic',
    name: 'Clinics',
    icon: '⚕️',
    color: '#EF4444',
    minZoom: 12,
    priority: 70,
    enabled: true
  },
  emergency_room: {
    id: 'emergency_room',
    name: 'Emergency Rooms',
    icon: '🚑',
    color: '#DC2626',
    minZoom: 10,
    priority: 90,
    enabled: true
  },
  pharmacy: {
    id: 'pharmacy',
    name: 'Pharmacies',
    icon: '💊',
    color: '#F87171',
    minZoom: 13,
    priority: 50,
    enabled: false
  },
  dentist: {
    id: 'dentist',
    name: 'Dentists',
    icon: '🦷',
    color: '#F87171',
    minZoom: 13,
    priority: 40,
    enabled: false
  },

  // Education
  university: {
    id: 'university',
    name: 'Universities',
    icon: '🎓',
    color: '#8B5CF6',
    minZoom: 9,
    priority: 85,
    enabled: true
  },
  college: {
    id: 'college',
    name: 'Colleges',
    icon: '🏛️',
    color: '#8B5CF6',
    minZoom: 10,
    priority: 75,
    enabled: true
  },
  school: {
    id: 'school',
    name: 'Schools',
    icon: '🏫',
    color: '#A78BFA',
    minZoom: 12,
    priority: 60,
    enabled: false
  },
  library: {
    id: 'library',
    name: 'Libraries',
    icon: '📚',
    color: '#A78BFA',
    minZoom: 12,
    priority: 60,
    enabled: true
  },

  // Recreation & Culture
  museum: {
    id: 'museum',
    name: 'Museums',
    icon: '🏛️',
    color: '#F59E0B',
    minZoom: 11,
    priority: 75,
    enabled: true
  },
  theater: {
    id: 'theater',
    name: 'Theaters',
    icon: '🎭',
    color: '#F59E0B',
    minZoom: 12,
    priority: 65,
    enabled: true
  },
  stadium: {
    id: 'stadium',
    name: 'Stadiums',
    icon: '🏟️',
    color: '#F59E0B',
    minZoom: 9,
    priority: 80,
    enabled: true
  },
  arena: {
    id: 'arena',
    name: 'Arenas',
    icon: '🏀',
    color: '#FBBF24',
    minZoom: 10,
    priority: 75,
    enabled: true
  },
  park: {
    id: 'park',
    name: 'Parks',
    icon: '🌳',
    color: '#10B981',
    minZoom: 11,
    priority: 60,
    enabled: true
  },
  national_park: {
    id: 'national_park',
    name: 'National Parks',
    icon: '🏞️',
    color: '#059669',
    minZoom: 6,
    priority: 90,
    enabled: true
  },
  nature_reserve: {
    id: 'nature_reserve',
    name: 'Nature Reserves',
    icon: '🌲',
    color: '#10B981',
    minZoom: 9,
    priority: 70,
    enabled: true
  },
  zoo: {
    id: 'zoo',
    name: 'Zoos',
    icon: '🦁',
    color: '#10B981',
    minZoom: 11,
    priority: 70,
    enabled: true
  },
  aquarium: {
    id: 'aquarium',
    name: 'Aquariums',
    icon: '🐠',
    color: '#14B8A6',
    minZoom: 11,
    priority: 70,
    enabled: true
  },
  botanical_garden: {
    id: 'botanical_garden',
    name: 'Botanical Gardens',
    icon: '🌺',
    color: '#10B981',
    minZoom: 12,
    priority: 60,
    enabled: false
  },
  art_gallery: {
    id: 'art_gallery',
    name: 'Art Galleries',
    icon: '🎨',
    color: '#F59E0B',
    minZoom: 12,
    priority: 60,
    enabled: false
  },

  // Food & Drink
  restaurant: {
    id: 'restaurant',
    name: 'Restaurants',
    icon: '🍽️',
    color: '#EC4899',
    minZoom: 14,
    priority: 50,
    enabled: false
  },
  cafe: {
    id: 'cafe',
    name: 'Cafés',
    icon: '☕',
    color: '#EC4899',
    minZoom: 14,
    priority: 45,
    enabled: false
  },
  bar: {
    id: 'bar',
    name: 'Bars',
    icon: '🍺',
    color: '#F43F5E',
    minZoom: 14,
    priority: 40,
    enabled: false
  },
  fast_food: {
    id: 'fast_food',
    name: 'Fast Food',
    icon: '🍔',
    color: '#F472B6',
    minZoom: 14,
    priority: 35,
    enabled: false
  },

  // Accommodation
  hotel: {
    id: 'hotel',
    name: 'Hotels',
    icon: '🏨',
    color: '#6366F1',
    minZoom: 12,
    priority: 65,
    enabled: true
  },
  motel: {
    id: 'motel',
    name: 'Motels',
    icon: '🛏️',
    color: '#818CF8',
    minZoom: 13,
    priority: 55,
    enabled: false
  },
  resort: {
    id: 'resort',
    name: 'Resorts',
    icon: '🏖️',
    color: '#6366F1',
    minZoom: 11,
    priority: 70,
    enabled: true
  },
  hostel: {
    id: 'hostel',
    name: 'Hostels',
    icon: '🏠',
    color: '#818CF8',
    minZoom: 13,
    priority: 50,
    enabled: false
  },
  campground: {
    id: 'campground',
    name: 'Campgrounds',
    icon: '⛺',
    color: '#10B981',
    minZoom: 12,
    priority: 60,
    enabled: false
  },

  // Shopping
  mall: {
    id: 'mall',
    name: 'Shopping Malls',
    icon: '🛍️',
    color: '#8B5CF6',
    minZoom: 12,
    priority: 65,
    enabled: false
  },
  supermarket: {
    id: 'supermarket',
    name: 'Supermarkets',
    icon: '🛒',
    color: '#A78BFA',
    minZoom: 13,
    priority: 50,
    enabled: false
  },
  market: {
    id: 'market',
    name: 'Markets',
    icon: '🏪',
    color: '#A78BFA',
    minZoom: 13,
    priority: 50,
    enabled: false
  },

  // Services
  bank: {
    id: 'bank',
    name: 'Banks',
    icon: '🏦',
    color: '#14B8A6',
    minZoom: 13,
    priority: 60,
    enabled: false
  },
  post_office: {
    id: 'post_office',
    name: 'Post Offices',
    icon: '📮',
    color: '#14B8A6',
    minZoom: 13,
    priority: 55,
    enabled: false
  },
  police: {
    id: 'police',
    name: 'Police Stations',
    icon: '👮',
    color: '#3B82F6',
    minZoom: 12,
    priority: 70,
    enabled: true
  },
  fire_station: {
    id: 'fire_station',
    name: 'Fire Stations',
    icon: '🚒',
    color: '#EF4444',
    minZoom: 12,
    priority: 70,
    enabled: true
  },
  government: {
    id: 'government',
    name: 'Government Buildings',
    icon: '🏛️',
    color: '#64748B',
    minZoom: 11,
    priority: 70,
    enabled: true
  },

  // Marine
  marina: {
    id: 'marina',
    name: 'Marinas',
    icon: '⚓',
    color: '#0EA5E9',
    minZoom: 12,
    priority: 60,
    enabled: false
  }
}

/**
 * Category groups for organized display in UI
 */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚗',
    color: '#0EA5E9',
    categories: ['airport', 'seaport', 'train_station', 'bus_station', 'ferry_terminal'],
    collapsible: true,
    defaultExpanded: true
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    color: '#EF4444',
    categories: ['hospital', 'clinic', 'emergency_room', 'pharmacy', 'dentist'],
    collapsible: true,
    defaultExpanded: true
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    color: '#8B5CF6',
    categories: ['university', 'college', 'school', 'library'],
    collapsible: true,
    defaultExpanded: true
  },
  {
    id: 'recreation',
    name: 'Recreation & Culture',
    icon: '🎭',
    color: '#F59E0B',
    categories: [
      'museum',
      'theater',
      'stadium',
      'arena',
      'park',
      'national_park',
      'nature_reserve',
      'zoo',
      'aquarium',
      'botanical_garden',
      'art_gallery'
    ],
    collapsible: true,
    defaultExpanded: true
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍽️',
    color: '#EC4899',
    categories: ['restaurant', 'cafe', 'bar', 'fast_food'],
    collapsible: true,
    defaultExpanded: false
  },
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: '🏨',
    color: '#6366F1',
    categories: ['hotel', 'motel', 'resort', 'hostel', 'campground'],
    collapsible: true,
    defaultExpanded: false
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#8B5CF6',
    categories: ['mall', 'supermarket', 'market'],
    collapsible: true,
    defaultExpanded: false
  },
  {
    id: 'services',
    name: 'Services',
    icon: '🏦',
    color: '#14B8A6',
    categories: ['bank', 'post_office', 'police', 'fire_station', 'government'],
    collapsible: true,
    defaultExpanded: false
  },
  {
    id: 'marine',
    name: 'Marine',
    icon: '⚓',
    color: '#0EA5E9',
    categories: ['marina'],
    collapsible: true,
    defaultExpanded: false
  }
]

/**
 * Get all enabled categories
 */
export function getEnabledCategories(): CategoryConfig[] {
  return Object.values(PLACE_CATEGORIES).filter(cat => cat.enabled)
}

/**
 * Get categories by minimum zoom level
 */
export function getCategoriesForZoom(zoom: number): CategoryConfig[] {
  return Object.values(PLACE_CATEGORIES).filter(cat => cat.enabled && cat.minZoom <= zoom)
}

/**
 * Get category configuration by ID
 */
export function getCategoryConfig(categoryId: string): CategoryConfig | undefined {
  return PLACE_CATEGORIES[categoryId]
}

/**
 * Get category group by ID
 */
export function getCategoryGroup(groupId: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find(group => group.id === groupId)
}

/**
 * Get all categories in a group
 */
export function getCategoriesInGroup(groupId: string): CategoryConfig[] {
  const group = getCategoryGroup(groupId)
  if (!group) return []

  return group.categories
    .map(catId => PLACE_CATEGORIES[catId])
    .filter(Boolean)
}
