/**
 * Land/Water Detection Module for Ground Station Opportunity Analysis
 * Simplified version for POC - uses basic continental boundaries
 */
// Simplified continental boundaries for land detection
const CONTINENTAL_BOUNDS = {
    northAmerica: [
        { minLat: 15, maxLat: 72, minLon: -168, maxLon: -52 },
        { minLat: 7, maxLat: 20, minLon: -92, maxLon: -77 } // Central America
    ],
    southAmerica: [
        { minLat: -56, maxLat: 13, minLon: -82, maxLon: -34 }
    ],
    europe: [
        { minLat: 36, maxLat: 71, minLon: -10, maxLon: 40 }
    ],
    africa: [
        { minLat: -35, maxLat: 37, minLon: -18, maxLon: 52 }
    ],
    asia: [
        { minLat: 1, maxLat: 77, minLon: 26, maxLon: 180 },
        { minLat: -10, maxLat: 25, minLon: 95, maxLon: 141 } // Southeast Asia
    ],
    australia: [
        { minLat: -44, maxLat: -10, minLon: 113, maxLon: 154 },
        { minLat: -47, maxLat: -34, minLon: 166, maxLon: 179 } // New Zealand
    ]
};
// Major islands and archipelagos
const MAJOR_ISLANDS = [
    { name: 'Greenland', minLat: 59, maxLat: 84, minLon: -73, maxLon: -11 },
    { name: 'Madagascar', minLat: -26, maxLat: -12, minLon: 43, maxLon: 51 },
    { name: 'Japan', minLat: 30, maxLat: 46, minLon: 129, maxLon: 146 },
    { name: 'Philippines', minLat: 5, maxLat: 20, minLon: 117, maxLon: 127 },
    { name: 'Indonesia', minLat: -11, maxLat: 6, minLon: 95, maxLon: 141 },
    { name: 'UK', minLat: 50, maxLat: 61, minLon: -8, maxLon: 2 },
    { name: 'Iceland', minLat: 63, maxLat: 67, minLon: -24, maxLon: -13 },
    { name: 'Cuba', minLat: 20, maxLat: 23, minLon: -85, maxLon: -74 },
    { name: 'Sri Lanka', minLat: 6, maxLat: 10, minLon: 79, maxLon: 82 }
];
/**
 * Simple land detection using continental bounding boxes
 * Fast but approximate - suitable for POC demonstrations
 */
export function isLandSimple(lat, lon) {
    // Normalize longitude to -180 to 180 range
    while (lon > 180)
        lon -= 360;
    while (lon < -180)
        lon += 360;
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
export function isCoastalArea(lat, lon) {
    if (!isLandSimple(lat, lon))
        return false;
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
export function getLandCoverageForBounds(minLat, maxLat, minLon, maxLon, sampleSize = 10) {
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
export function findNearestLand(lat, lon, maxSearchRadius = 10) {
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
const LAND_GRID_CACHE = new Map();
/**
 * Get cached land/water status with automatic caching
 */
export function isLandCached(lat, lon) {
    // Round to nearest degree for caching
    const roundedLat = Math.round(lat);
    const roundedLon = Math.round(lon);
    const key = `${roundedLat},${roundedLon}`;
    if (!LAND_GRID_CACHE.has(key)) {
        LAND_GRID_CACHE.set(key, isLandSimple(roundedLat, roundedLon));
    }
    return LAND_GRID_CACHE.get(key);
}
/**
 * Batch check multiple coordinates for performance
 */
export function batchLandCheck(coordinates) {
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
