/**
 * Sample Maritime Data for Testing Hotspot Detector
 * 
 * Contains realistic vessel traffic patterns for major shipping routes and ports
 * around the world to demonstrate the maritime hotspot detection algorithm
 */

interface MaritimePoint {
  latitude: number
  longitude: number
  vesselCount: number
  avgSpeed: number
  avgSize: number
}

// Major shipping routes and port areas with realistic vessel concentrations
export const sampleMaritimeData: MaritimePoint[] = [
  // Singapore Strait - Major shipping chokepoint
  { latitude: 1.2966, longitude: 103.8558, vesselCount: 45, avgSpeed: 12.5, avgSize: 85000 },
  { latitude: 1.3521, longitude: 103.8198, vesselCount: 38, avgSpeed: 11.8, avgSize: 92000 },
  { latitude: 1.2897, longitude: 103.8619, vesselCount: 42, avgSpeed: 13.2, avgSize: 78000 },
  { latitude: 1.3045, longitude: 103.8476, vesselCount: 41, avgSpeed: 12.1, avgSize: 89000 },
  { latitude: 1.2754, longitude: 103.8712, vesselCount: 37, avgSpeed: 12.8, avgSize: 81000 },

  // Suez Canal - Critical shipping route
  { latitude: 30.7067, longitude: 32.3439, vesselCount: 35, avgSpeed: 8.5, avgSize: 95000 },
  { latitude: 30.5234, longitude: 32.2634, vesselCount: 32, avgSpeed: 8.2, avgSize: 88000 },
  { latitude: 30.8123, longitude: 32.4156, vesselCount: 29, avgSpeed: 8.7, avgSize: 91000 },
  { latitude: 30.6445, longitude: 32.3098, vesselCount: 33, avgSpeed: 8.3, avgSize: 87000 },

  // Panama Canal - Major shipping bottleneck  
  { latitude: 9.0818, longitude: -79.6816, vesselCount: 28, avgSpeed: 7.5, avgSize: 72000 },
  { latitude: 9.3792, longitude: -79.9009, vesselCount: 25, avgSpeed: 7.8, avgSize: 69000 },
  { latitude: 8.9735, longitude: -79.5647, vesselCount: 31, avgSpeed: 7.2, avgSize: 75000 },

  // English Channel - Dense shipping traffic
  { latitude: 50.9097, longitude: 1.4019, vesselCount: 34, avgSpeed: 15.2, avgSize: 45000 },
  { latitude: 50.7645, longitude: 1.2987, vesselCount: 31, avgSpeed: 14.8, avgSize: 48000 },
  { latitude: 50.8234, longitude: 1.3456, vesselCount: 29, avgSpeed: 15.5, avgSize: 42000 },
  { latitude: 51.0567, longitude: 1.4789, vesselCount: 27, avgSpeed: 15.1, avgSize: 44000 },

  // Strait of Hormuz - Oil shipping chokepoint
  { latitude: 26.5667, longitude: 56.2500, vesselCount: 26, avgSpeed: 10.5, avgSize: 115000 },
  { latitude: 26.5234, longitude: 56.1987, vesselCount: 24, avgSpeed: 10.2, avgSize: 118000 },
  { latitude: 26.6098, longitude: 56.3012, vesselCount: 28, avgSpeed: 10.8, avgSize: 112000 },

  // Gibraltar Strait - Mediterranean entrance
  { latitude: 36.1408, longitude: -5.3536, vesselCount: 23, avgSpeed: 13.5, avgSize: 58000 },
  { latitude: 35.8667, longitude: -5.6833, vesselCount: 21, avgSpeed: 13.2, avgSize: 61000 },
  { latitude: 36.0234, longitude: -5.4567, vesselCount: 25, avgSpeed: 13.8, avgSize: 55000 },

  // Port of Shanghai - World's busiest container port
  { latitude: 31.3547, longitude: 121.3998, vesselCount: 52, avgSpeed: 6.5, avgSize: 67000 },
  { latitude: 31.2987, longitude: 121.4321, vesselCount: 48, avgSpeed: 6.2, avgSize: 71000 },
  { latitude: 31.4123, longitude: 121.3654, vesselCount: 55, avgSpeed: 6.8, avgSize: 64000 },
  { latitude: 31.3234, longitude: 121.4234, vesselCount: 50, avgSpeed: 6.4, avgSize: 68000 },

  // Port of Los Angeles/Long Beach - Major US container complex
  { latitude: 33.7701, longitude: -118.1937, vesselCount: 41, avgSpeed: 8.2, avgSize: 58000 },
  { latitude: 33.7334, longitude: -118.2267, vesselCount: 38, avgSpeed: 7.9, avgSize: 62000 },
  { latitude: 33.8045, longitude: -118.1623, vesselCount: 43, avgSpeed: 8.5, avgSize: 55000 },

  // Rotterdam Port - Europe's largest port
  { latitude: 51.9244, longitude: 4.4777, vesselCount: 36, avgSpeed: 9.1, avgSize: 52000 },
  { latitude: 51.8967, longitude: 4.4234, vesselCount: 34, avgSpeed: 8.8, avgSize: 54000 },
  { latitude: 51.9567, longitude: 4.5123, vesselCount: 39, avgSpeed: 9.4, avgSize: 49000 },

  // North Atlantic shipping lanes - Trans-Atlantic route
  { latitude: 45.2356, longitude: -45.6789, vesselCount: 18, avgSpeed: 16.5, avgSize: 95000 },
  { latitude: 45.5678, longitude: -42.3456, vesselCount: 16, avgSpeed: 16.8, avgSize: 88000 },
  { latitude: 44.8901, longitude: -48.1234, vesselCount: 19, avgSpeed: 16.2, avgSize: 97000 },
  { latitude: 45.1234, longitude: -46.5678, vesselCount: 17, avgSpeed: 16.6, avgSize: 91000 },

  // North Pacific shipping lanes - Trans-Pacific route
  { latitude: 42.3456, longitude: -165.7890, vesselCount: 20, avgSpeed: 18.2, avgSize: 102000 },
  { latitude: 41.7890, longitude: -162.3456, vesselCount: 18, avgSpeed: 18.5, avgSize: 98000 },
  { latitude: 43.1234, longitude: -168.9012, vesselCount: 22, avgSpeed: 17.9, avgSize: 105000 },

  // South China Sea - Major shipping area
  { latitude: 14.5994, longitude: 120.9842, vesselCount: 21, avgSpeed: 14.2, avgSize: 73000 },
  { latitude: 15.2356, longitude: 119.5678, vesselCount: 19, avgSpeed: 14.5, avgSize: 76000 },
  { latitude: 13.9876, longitude: 121.4567, vesselCount: 23, avgSpeed: 13.9, avgSize: 70000 },
  { latitude: 16.7890, longitude: 118.2345, vesselCount: 18, avgSpeed: 14.7, avgSize: 78000 },

  // Persian Gulf - Oil tanker routes
  { latitude: 27.0238, longitude: 51.4213, vesselCount: 15, avgSpeed: 11.5, avgSize: 125000 },
  { latitude: 26.7890, longitude: 52.1234, vesselCount: 17, avgSpeed: 11.2, avgSize: 128000 },
  { latitude: 27.3456, longitude: 50.7890, vesselCount: 14, avgSpeed: 11.8, avgSize: 122000 },

  // Mediterranean shipping lanes
  { latitude: 37.9755, longitude: 23.7348, vesselCount: 16, avgSpeed: 13.8, avgSize: 56000 },
  { latitude: 38.2467, longitude: 21.7348, vesselCount: 14, avgSpeed: 14.1, avgSize: 59000 },
  { latitude: 37.7123, longitude: 25.3456, vesselCount: 18, avgSpeed: 13.5, avgSize: 53000 },

  // Baltic Sea shipping
  { latitude: 59.9139, longitude: 10.7522, vesselCount: 12, avgSpeed: 12.3, avgSize: 35000 },
  { latitude: 59.3293, longitude: 18.0686, vesselCount: 14, avgSpeed: 12.1, avgSize: 37000 },
  { latitude: 55.6761, longitude: 12.5683, vesselCount: 13, avgSpeed: 12.5, avgSize: 33000 },

  // Indian Ocean shipping lanes
  { latitude: -12.2634, longitude: 96.7890, vesselCount: 11, avgSpeed: 15.8, avgSize: 84000 },
  { latitude: -8.7890, longitude: 88.2345, vesselCount: 13, avgSpeed: 15.5, avgSize: 87000 },
  { latitude: -15.1234, longitude: 102.3456, vesselCount: 10, avgSpeed: 16.1, avgSize: 81000 },

  // Cape of Good Hope - Alternative to Suez
  { latitude: -34.3553, longitude: 18.4695, vesselCount: 9, avgSpeed: 14.5, avgSize: 98000 },
  { latitude: -35.1234, longitude: 19.2345, vesselCount: 8, avgSpeed: 14.2, avgSize: 101000 },
  { latitude: -33.7890, longitude: 17.8901, vesselCount: 11, avgSpeed: 14.8, avgSize: 95000 },

  // Lower traffic areas for contrast
  // Central Pacific (sparse)
  { latitude: 10.1234, longitude: -155.7890, vesselCount: 3, avgSpeed: 18.5, avgSize: 89000 },
  { latitude: 5.6789, longitude: -148.2345, vesselCount: 2, avgSpeed: 19.2, avgSize: 92000 },
  
  // Central Atlantic (sparse)
  { latitude: -15.3456, longitude: -25.7890, vesselCount: 4, avgSpeed: 17.1, avgSize: 76000 },
  { latitude: -8.9012, longitude: -18.3456, vesselCount: 3, avgSpeed: 17.8, avgSize: 79000 },
  
  // Southern Ocean (very sparse)
  { latitude: -45.1234, longitude: 78.5678, vesselCount: 1, avgSpeed: 16.5, avgSize: 95000 },
  { latitude: -52.7890, longitude: -67.2345, vesselCount: 1, avgSpeed: 15.9, avgSize: 88000 }
]

/**
 * Generate additional random maritime points around hotspots for testing
 */
export function generateAdditionalMaritimeData(baseData: MaritimePoint[] = sampleMaritimeData): MaritimePoint[] {
  const additionalPoints: MaritimePoint[] = []
  
  // Add some noise around major hotspots to make them more realistic
  const majorHotspots = baseData.filter(point => point.vesselCount > 30)
  
  majorHotspots.forEach(hotspot => {
    // Add 3-5 additional points around each major hotspot
    const numAdditional = 3 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < numAdditional; i++) {
      // Random offset within ~50km radius
      const latOffset = (Math.random() - 0.5) * 0.9 // ~0.45 degrees max
      const lonOffset = (Math.random() - 0.5) * 0.9
      
      const vesselVariation = 0.7 + (Math.random() * 0.6) // 70%-130% of original
      const speedVariation = 0.8 + (Math.random() * 0.4)  // 80%-120% of original
      const sizeVariation = 0.85 + (Math.random() * 0.3)  // 85%-115% of original
      
      additionalPoints.push({
        latitude: hotspot.latitude + latOffset,
        longitude: hotspot.longitude + lonOffset,
        vesselCount: Math.round(hotspot.vesselCount * vesselVariation),
        avgSpeed: hotspot.avgSpeed * speedVariation,
        avgSize: Math.round(hotspot.avgSize * sizeVariation)
      })
    }
  })
  
  return [...baseData, ...additionalPoints]
}

/**
 * Get maritime data for a specific region
 */
export function getMaritimeDataForRegion(
  bounds: { north: number, south: number, east: number, west: number },
  data: MaritimePoint[] = sampleMaritimeData
): MaritimePoint[] {
  return data.filter(point => 
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  )
}

/**
 * Get the top N maritime hotspots by vessel count
 */
export function getTopMaritimeHotspots(n: number = 10, data: MaritimePoint[] = sampleMaritimeData): MaritimePoint[] {
  return [...data]
    .sort((a, b) => b.vesselCount - a.vesselCount)
    .slice(0, n)
}