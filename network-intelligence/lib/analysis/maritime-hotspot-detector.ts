/**
 * Maritime Hot Spot Detector using Getis-Ord Gi* Statistics
 * 
 * Identifies statistically significant maritime traffic concentrations
 * Based on spatial autocorrelation analysis from UHI pipeline pattern
 */

interface MaritimePoint {
  latitude: number
  longitude: number
  vesselCount: number
  avgSpeed: number
  avgSize: number
}

interface HotSpot {
  center: [number, number]  // [lon, lat]
  radius: number            // km
  zScore: number           // Statistical significance
  pValue: number          // Probability value
  confidence: number      // Confidence level (0-1)
  vesselDensity: number   // Vessels per sq km
  type: 'hot' | 'cold' | 'neutral'
  temporalTrend: 'growing' | 'stable' | 'declining'
}

interface TemporalPattern {
  hourlyPeaks: number[]    // 24 hours
  weeklyPeaks: number[]    // 7 days
  monthlyTrend: number     // Growth rate
  seasonality: number      // Seasonal variation coefficient
}

export class MaritimeHotSpotDetector {
  private readonly DISTANCE_THRESHOLD = 100 // km for spatial weights
  private readonly Z_SCORE_THRESHOLD = 1.96 // 95% confidence
  private readonly MIN_NEIGHBORS = 3
  
  /**
   * Detect maritime hot spots using Getis-Ord Gi* statistics
   */
  public detectHotSpots(points: MaritimePoint[]): HotSpot[] {
    if (points.length < this.MIN_NEIGHBORS) {
      console.warn('Insufficient points for hot spot analysis')
      return []
    }
    
    // Calculate spatial weights matrix
    const weights = this.calculateSpatialWeights(points)
    
    // Calculate Getis-Ord Gi* for each point
    const giStars = this.calculateGetisOrdGiStar(points, weights)
    
    // Identify significant hot and cold spots
    const hotSpots = this.identifySignificantClusters(points, giStars)
    
    // Add temporal analysis
    const hotspotsWithTrends = this.addTemporalTrends(hotSpots)
    
    return hotspotsWithTrends
  }
  
  /**
   * Calculate spatial weights matrix based on distance
   */
  private calculateSpatialWeights(points: MaritimePoint[]): number[][] {
    const n = points.length
    const weights: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const distance = this.haversineDistance(
            points[i].latitude, points[i].longitude,
            points[j].latitude, points[j].longitude
          )
          
          // Binary weights: 1 if within threshold, 0 otherwise
          // Could also use inverse distance weighting
          if (distance <= this.DISTANCE_THRESHOLD) {
            weights[i][j] = 1
          }
        }
      }
      
      // Row standardize weights
      const rowSum = weights[i].reduce((sum, w) => sum + w, 0)
      if (rowSum > 0) {
        for (let j = 0; j < n; j++) {
          weights[i][j] /= rowSum
        }
      }
    }
    
    return weights
  }
  
  /**
   * Calculate Getis-Ord Gi* statistic for each point
   */
  private calculateGetisOrdGiStar(
    points: MaritimePoint[], 
    weights: number[][]
  ): number[] {
    const n = points.length
    const values = points.map(p => p.vesselCount)
    
    // Calculate global statistics
    const mean = values.reduce((sum, v) => sum + v, 0) / n
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n
    const stdDev = Math.sqrt(variance)
    
    const giStars: number[] = []
    
    for (let i = 0; i < n; i++) {
      // Calculate local sum
      let localSum = 0
      let weightSum = 0
      let weightSquareSum = 0
      
      for (let j = 0; j < n; j++) {
        localSum += weights[i][j] * values[j]
        weightSum += weights[i][j]
        weightSquareSum += Math.pow(weights[i][j], 2)
      }
      
      // Calculate Gi* statistic
      const numerator = localSum - (weightSum * mean)
      const denominator = stdDev * Math.sqrt(
        ((n * weightSquareSum) - Math.pow(weightSum, 2)) / (n - 1)
      )
      
      const giStar = denominator !== 0 ? numerator / denominator : 0
      giStars.push(giStar)
    }
    
    return giStars
  }
  
  /**
   * Identify statistically significant clusters
   */
  private identifySignificantClusters(
    points: MaritimePoint[], 
    giStars: number[]
  ): HotSpot[] {
    const hotSpots: HotSpot[] = []
    const processed = new Set<number>()
    
    // Find hot spots (positive z-scores)
    for (let i = 0; i < points.length; i++) {
      if (processed.has(i)) continue
      
      const zScore = giStars[i]
      const absZ = Math.abs(zScore)
      
      if (absZ >= this.Z_SCORE_THRESHOLD) {
        // Calculate p-value from z-score
        const pValue = this.zScoreToPValue(absZ)
        
        // Find nearby points in same cluster
        const clusterPoints: number[] = [i]
        processed.add(i)
        
        for (let j = 0; j < points.length; j++) {
          if (i !== j && !processed.has(j)) {
            const distance = this.haversineDistance(
              points[i].latitude, points[i].longitude,
              points[j].latitude, points[j].longitude
            )
            
            if (distance <= this.DISTANCE_THRESHOLD && 
                Math.abs(giStars[j]) >= this.Z_SCORE_THRESHOLD &&
                Math.sign(giStars[j]) === Math.sign(zScore)) {
              clusterPoints.push(j)
              processed.add(j)
            }
          }
        }
        
        // Calculate cluster center and properties
        const clusterVessels = clusterPoints.map(idx => points[idx])
        const center = this.calculateClusterCenter(clusterVessels)
        const radius = this.calculateClusterRadius(clusterVessels, center)
        const density = this.calculateVesselDensity(clusterVessels, radius)
        
        hotSpots.push({
          center,
          radius,
          zScore,
          pValue,
          confidence: 1 - pValue,
          vesselDensity: density,
          type: zScore > 0 ? 'hot' : 'cold',
          temporalTrend: 'stable' // Will be updated in temporal analysis
        })
      }
    }
    
    return hotSpots
  }
  
  /**
   * Add temporal trend analysis to hot spots
   */
  private addTemporalTrends(hotSpots: HotSpot[]): HotSpot[] {
    // In production, this would analyze historical data
    // For now, simulate trends based on location characteristics
    
    return hotSpots.map(spot => {
      let trend: 'growing' | 'stable' | 'declining' = 'stable'
      
      // High density spots are likely growing
      if (spot.vesselDensity > 10) {
        trend = 'growing'
      } else if (spot.vesselDensity < 3) {
        trend = 'declining'
      }
      
      // Cold spots are likely declining
      if (spot.type === 'cold') {
        trend = 'declining'
      }
      
      return {
        ...spot,
        temporalTrend: trend
      }
    })
  }
  
  /**
   * Analyze temporal patterns in maritime traffic
   */
  public analyzeTemporalPatterns(
    historicalData: Array<{timestamp: Date, point: MaritimePoint}>
  ): TemporalPattern {
    // Group by hour of day
    const hourlyBins = Array(24).fill(0)
    const weeklyBins = Array(7).fill(0)
    const monthlyValues: number[] = []
    
    historicalData.forEach(record => {
      const hour = record.timestamp.getHours()
      const day = record.timestamp.getDay()
      const month = record.timestamp.getMonth()
      
      hourlyBins[hour] += record.point.vesselCount
      weeklyBins[day] += record.point.vesselCount
      
      if (!monthlyValues[month]) monthlyValues[month] = 0
      monthlyValues[month] += record.point.vesselCount
    })
    
    // Calculate monthly trend (linear regression slope)
    const monthlyTrend = this.calculateTrendSlope(monthlyValues)
    
    // Calculate seasonality coefficient
    const seasonality = this.calculateSeasonality(monthlyValues)
    
    return {
      hourlyPeaks: this.findPeaks(hourlyBins),
      weeklyPeaks: this.findPeaks(weeklyBins),
      monthlyTrend,
      seasonality
    }
  }
  
  /**
   * Calculate cluster center from points
   */
  private calculateClusterCenter(points: MaritimePoint[]): [number, number] {
    const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length
    const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length
    return [avgLon, avgLat]
  }
  
  /**
   * Calculate cluster radius
   */
  private calculateClusterRadius(
    points: MaritimePoint[], 
    center: [number, number]
  ): number {
    const distances = points.map(p => 
      this.haversineDistance(center[1], center[0], p.latitude, p.longitude)
    )
    return Math.max(...distances)
  }
  
  /**
   * Calculate vessel density in cluster
   */
  private calculateVesselDensity(points: MaritimePoint[], radius: number): number {
    const totalVessels = points.reduce((sum, p) => sum + p.vesselCount, 0)
    const area = Math.PI * Math.pow(radius, 2)
    return totalVessels / area
  }
  
  /**
   * Convert z-score to p-value
   */
  private zScoreToPValue(z: number): number {
    // Simplified normal CDF approximation
    const sign = z < 0 ? -1 : 1
    z = Math.abs(z)
    
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911
    
    const t = 1.0 / (1.0 + p * z)
    const t2 = t * t
    const t3 = t2 * t
    const t4 = t3 * t
    const t5 = t4 * t
    
    const y = t * Math.exp(-z * z / 2) * 
              (a1 + a2 * t + a3 * t2 + a4 * t3 + a5 * t4)
    
    return sign === 1 ? y : 1 - y
  }
  
  /**
   * Calculate Haversine distance between two points
   */
  private haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
  
  /**
   * Find peaks in time series data
   */
  private findPeaks(values: number[]): number[] {
    const peaks: number[] = []
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    )
    
    values.forEach((value, index) => {
      if (value > mean + stdDev) {
        peaks.push(index)
      }
    })
    
    return peaks
  }
  
  /**
   * Calculate trend slope using simple linear regression
   */
  private calculateTrendSlope(values: number[]): number {
    const n = values.length
    const x = Array.from({length: n}, (_, i) => i)
    
    const sumX = x.reduce((sum, xi) => sum + xi, 0)
    const sumY = values.reduce((sum, yi) => sum + yi, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return slope
  }
  
  /**
   * Calculate seasonality coefficient
   */
  private calculateSeasonality(monthlyValues: number[]): number {
    const mean = monthlyValues.reduce((sum, v) => sum + v, 0) / monthlyValues.length
    const variance = monthlyValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / monthlyValues.length
    return Math.sqrt(variance) / mean // Coefficient of variation
  }
}

// Export singleton instance
export const maritimeHotSpotDetector = new MaritimeHotSpotDetector()