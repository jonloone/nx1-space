/**
 * Land/Water Detection Module for Ground Station Opportunity Analysis
 * Simplified version for POC - uses basic continental boundaries
 */

// Enhanced continental boundaries with comprehensive global coverage
const CONTINENTAL_BOUNDS = {
  northAmerica: [
    { minLat: 15, maxLat: 83, minLon: -168, maxLon: -52 }, // Expanded to include Arctic Canada
    { minLat: 7, maxLat: 20, minLon: -92, maxLon: -77 }, // Central America
    { minLat: 60, maxLat: 83, minLon: -168, maxLon: -120 }, // Alaska and Arctic islands
    { minLat: 24, maxLat: 26, minLon: -82, maxLon: -80 } // Florida Keys
  ],
  southAmerica: [
    { minLat: -56, maxLat: 13, minLon: -82, maxLon: -34 }, // Mainland
    { minLat: -55, maxLat: -51, minLon: -75, maxLon: -53 } // Tierra del Fuego
  ],
  europe: [
    { minLat: 36, maxLat: 81, minLon: -31, maxLon: 67 }, // Expanded for Arctic regions
    { minLat: 50, maxLat: 61, minLon: -8, maxLon: 2 }, // British Isles
    { minLat: 57, maxLat: 71, minLon: 4, maxLon: 31 }, // Scandinavia
    { minLat: 67, maxLat: 81, minLon: 15, maxLon: 67 } // Svalbard and Arctic islands
  ],
  africa: [
    { minLat: -35, maxLat: 37, minLon: -18, maxLon: 52 }, // Mainland
    { minLat: 12, maxLat: 18, minLon: 42, maxLon: 54 } // Horn of Africa extension
  ],
  asia: [
    { minLat: 1, maxLat: 81, minLon: 26, maxLon: 180 }, // Mainland expanded to Arctic
    { minLat: -11, maxLat: 28, minLon: 92, maxLon: 141 }, // Southeast Asia
    { minLat: 45, maxLat: 81, minLon: -180, maxLon: -168 }, // Eastern Siberia (crosses dateline)
    { minLat: 50, maxLat: 66, minLon: 143, maxLon: 180 } // Far Eastern Russia
  ],
  australia: [
    { minLat: -44, maxLat: -10, minLon: 113, maxLon: 154 }, // Australia mainland
    { minLat: -47, maxLat: -34, minLon: 166, maxLon: 179 }, // New Zealand
    { minLat: -55, maxLat: -29, minLon: 37, maxLon: 78 } // Indian Ocean territories
  ]
};

// Comprehensive islands and archipelagos for complete global coverage
const MAJOR_ISLANDS = [
  // Greenland and Arctic
  { name: 'Greenland', minLat: 59, maxLat: 84, minLon: -73, maxLon: -11 },
  { name: 'Svalbard', minLat: 76, maxLat: 81, minLon: 10, maxLon: 33 },
  { name: 'Franz Josef Land', minLat: 79, maxLat: 82, minLon: 44, maxLon: 65 },
  { name: 'Novaya Zemlya', minLat: 70, maxLat: 77, minLon: 52, maxLon: 69 },
  { name: 'Canadian Arctic', minLat: 68, maxLat: 83, minLon: -120, maxLon: -60 },
  
  // Atlantic Islands
  { name: 'Iceland', minLat: 63, maxLat: 67, minLon: -24, maxLon: -13 },
  { name: 'UK', minLat: 50, maxLat: 61, minLon: -8, maxLon: 2 },
  { name: 'Ireland', minLat: 51, maxLat: 56, minLon: -11, maxLon: -5 },
  { name: 'Faroe Islands', minLat: 61, maxLat: 63, minLon: -8, maxLon: -6 },
  { name: 'Azores', minLat: 36, maxLat: 40, minLon: -32, maxLon: -24 },
  { name: 'Canary Islands', minLat: 27, maxLat: 30, minLon: -18, maxLon: -13 },
  { name: 'Cape Verde', minLat: 14, maxLat: 17, minLon: -26, maxLon: -22 },
  { name: 'St. Helena', minLat: -16, maxLat: -15, minLon: -6, maxLon: -5 },
  { name: 'Ascension Island', minLat: -8, maxLat: -7, minLon: -15, maxLon: -14 },
  { name: 'Falkland Islands', minLat: -53, maxLat: -51, minLon: -62, maxLon: -57 },
  { name: 'South Georgia', minLat: -55, maxLat: -53, minLon: -38, maxLon: -35 },
  
  // Caribbean
  { name: 'Cuba', minLat: 19, maxLat: 24, minLon: -85, maxLon: -74 },
  { name: 'Jamaica', minLat: 17, maxLat: 19, minLon: -79, maxLon: -76 },
  { name: 'Haiti/Dominican Rep', minLat: 17, maxLat: 20, minLon: -75, maxLon: -68 },
  { name: 'Puerto Rico', minLat: 17, maxLat: 19, minLon: -68, maxLon: -65 },
  { name: 'Lesser Antilles', minLat: 12, maxLat: 18, minLon: -62, maxLon: -59 },
  { name: 'Trinidad & Tobago', minLat: 10, maxLat: 12, minLon: -62, maxLon: -60 },
  { name: 'Bahamas', minLat: 20, maxLat: 27, minLon: -80, maxLon: -72 },
  
  // Pacific Islands
  { name: 'Hawaiian Islands', minLat: 18, maxLat: 23, minLon: -161, maxLon: -154 },
  { name: 'Aleutian Islands', minLat: 51, maxLat: 55, minLon: -180, maxLon: -165 },
  { name: 'Fiji', minLat: -21, maxLat: -12, minLon: 177, maxLon: -177 },
  { name: 'New Caledonia', minLat: -23, maxLat: -19, minLon: 163, maxLon: 168 },
  { name: 'Vanuatu', minLat: -21, maxLat: -13, minLon: 166, maxLon: 170 },
  { name: 'Solomon Islands', minLat: -12, maxLat: -5, minLon: 155, maxLon: 170 },
  { name: 'Papua New Guinea', minLat: -12, maxLat: -1, minLon: 140, maxLon: 156 },
  { name: 'Marshall Islands', minLat: 4, maxLat: 15, minLon: 160, maxLon: 173 },
  { name: 'Micronesia', minLat: 1, maxLat: 10, minLon: 138, maxLon: 163 },
  { name: 'Palau', minLat: 2, maxLat: 8, minLon: 131, maxLon: 135 },
  { name: 'Guam', minLat: 13, maxLat: 14, minLon: 144, maxLon: 145 },
  { name: 'Samoa', minLat: -15, maxLat: -13, minLon: -173, maxLon: -171 },
  { name: 'Tonga', minLat: -22, maxLat: -15, minLon: -176, maxLon: -173 },
  { name: 'Cook Islands', minLat: -22, maxLat: -8, minLon: -167, maxLon: -157 },
  { name: 'French Polynesia', minLat: -28, maxLat: -7, minLon: -155, maxLon: -134 },
  
  // Asian Islands
  { name: 'Japan', minLat: 30, maxLat: 46, minLon: 129, maxLon: 146 },
  { name: 'Philippines', minLat: 4, maxLat: 21, minLon: 116, maxLon: 127 },
  { name: 'Indonesia', minLat: -11, maxLat: 6, minLon: 95, maxLon: 141 },
  { name: 'Malaysia', minLat: 0, maxLat: 8, minLon: 99, maxLon: 120 },
  { name: 'Taiwan', minLat: 21, maxLat: 26, minLon: 120, maxLon: 122 },
  { name: 'Sri Lanka', minLat: 5, maxLat: 10, minLon: 79, maxLon: 82 },
  { name: 'Maldives', minLat: -1, maxLat: 8, minLon: 72, maxLon: 74 },
  { name: 'Andaman & Nicobar', minLat: 6, maxLat: 14, minLon: 92, maxLon: 94 },
  { name: 'Sakhalin', minLat: 45, maxLat: 55, minLon: 141, maxLon: 145 },
  { name: 'Kuril Islands', minLat: 43, maxLat: 51, minLon: 145, maxLon: 157 },
  
  // Indian Ocean
  { name: 'Madagascar', minLat: -26, maxLat: -11, minLon: 43, maxLon: 51 },
  { name: 'Mauritius', minLat: -21, maxLat: -19, minLon: 57, maxLon: 58 },
  { name: 'Reunion', minLat: -22, maxLat: -20, minLon: 55, maxLon: 56 },
  { name: 'Seychelles', minLat: -5, maxLat: -4, minLon: 55, maxLon: 56 },
  { name: 'Comoros', minLat: -13, maxLat: -11, minLon: 43, maxLon: 45 },
  { name: 'Socotra', minLat: 12, maxLat: 13, minLon: 53, maxLon: 55 },
  
  // Mediterranean
  { name: 'Cyprus', minLat: 34, maxLat: 36, minLon: 32, maxLon: 34 },
  { name: 'Malta', minLat: 35, maxLat: 36, minLon: 14, maxLon: 15 },
  { name: 'Sicily', minLat: 36, maxLat: 38, minLon: 12, maxLon: 16 },
  { name: 'Sardinia', minLat: 38, maxLat: 41, minLon: 8, maxLon: 10 },
  { name: 'Corsica', minLat: 41, maxLat: 43, minLon: 8, maxLon: 10 },
  { name: 'Balearic Islands', minLat: 38, maxLat: 40, minLon: 1, maxLon: 4 },
  { name: 'Crete', minLat: 34, maxLat: 36, minLon: 23, maxLon: 27 },
  
  // Others
  { name: 'Tasmania', minLat: -44, maxLat: -39, minLon: 143, maxLon: 149 },
  { name: 'New Zealand North', minLat: -35, maxLat: -34, minLon: 172, maxLon: 179 },
  { name: 'New Zealand South', minLat: -47, maxLat: -40, minLon: 166, maxLon: 175 }
];

/**
 * Simple land detection using continental bounding boxes
 * Fast but approximate - suitable for POC demonstrations
 */
export function isLandSimple(lat: number, lon: number): boolean {
  // Normalize longitude to -180 to 180 range
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  
  // Check continental boundaries
  for (const continent of Object.values(CONTINENTAL_BOUNDS)) {
    for (const bound of continent) {
      if (lat >= bound.minLat && lat <= bound.maxLat && 
          lon >= bound.minLon && lon <= bound.maxLon) {
        return true;
      }
    }
  }
  
  // Check major islands
  for (const island of MAJOR_ISLANDS) {
    if (lat >= island.minLat && lat <= island.maxLat && 
        lon >= island.minLon && lon <= island.maxLon) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect if a location is in a coastal area
 * Uses a simplified approach based on proximity to continental edges
 */
export function isCoastalArea(lat: number, lon: number): boolean {
  if (!isLandSimple(lat, lon)) return false;
  
  // Check if any nearby point is water (simple coastal detection)
  const checkDistance = 2; // degrees
  const checks = [
    [lat + checkDistance, lon],
    [lat - checkDistance, lon],
    [lat, lon + checkDistance],
    [lat, lon - checkDistance]
  ];
  
  let waterCount = 0;
  for (const [checkLat, checkLon] of checks) {
    if (!isLandSimple(checkLat, checkLon)) {
      waterCount++;
    }
  }
  
  // If at least one direction is water, it's coastal
  return waterCount > 0;
}

/**
 * Calculate land coverage percentage for a bounding box
 */
export function getLandCoverageForBounds(
  minLat: number, 
  maxLat: number, 
  minLon: number, 
  maxLon: number,
  sampleSize: number = 10
): number {
  let landCount = 0;
  let totalCount = 0;
  
  const latStep = (maxLat - minLat) / sampleSize;
  const lonStep = (maxLon - minLon) / sampleSize;
  
  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lon = minLon; lon <= maxLon; lon += lonStep) {
      totalCount++;
      if (isLandSimple(lat, lon)) {
        landCount++;
      }
    }
  }
  
  return totalCount > 0 ? (landCount / totalCount) * 100 : 0;
}

/**
 * Find the nearest land point from a water coordinate
 */
export function findNearestLand(lat: number, lon: number, maxSearchRadius: number = 10): { lat: number, lon: number } | null {
  if (isLandSimple(lat, lon)) {
    return { lat, lon };
  }
  
  // Search in expanding circles
  for (let radius = 1; radius <= maxSearchRadius; radius++) {
    const steps = radius * 8; // More steps for larger radius
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const checkLat = lat + radius * Math.sin(angle);
      const checkLon = lon + radius * Math.cos(angle);
      
      if (isLandSimple(checkLat, checkLon)) {
        return { lat: checkLat, lon: checkLon };
      }
    }
  }
  
  return null;
}

/**
 * Pre-computed grid of land/water for faster lookups
 * This would ideally be loaded from a data file in production
 */
const LAND_GRID_CACHE = new Map<string, boolean>();

/**
 * Get cached land/water status with automatic caching
 */
export function isLandCached(lat: number, lon: number): boolean {
  // Round to nearest degree for caching
  const roundedLat = Math.round(lat);
  const roundedLon = Math.round(lon);
  const key = `${roundedLat},${roundedLon}`;
  
  if (!LAND_GRID_CACHE.has(key)) {
    LAND_GRID_CACHE.set(key, isLandSimple(roundedLat, roundedLon));
  }
  
  return LAND_GRID_CACHE.get(key)!;
}

/**
 * Batch check multiple coordinates for performance
 */
export function batchLandCheck(coordinates: Array<[number, number]>): boolean[] {
  return coordinates.map(([lat, lon]) => isLandCached(lat, lon));
}

/**
 * Export continental bounds for visualization
 */
export function getContinentalBounds() {
  return CONTINENTAL_BOUNDS;
}

/**
 * Export island bounds for visualization
 */
export function getIslandBounds() {
  return MAJOR_ISLANDS;
}