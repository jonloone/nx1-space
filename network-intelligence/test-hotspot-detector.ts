/**
 * Simple test to verify the maritime hotspot detector works
 */

import { MaritimeHotSpotDetector } from './lib/analysis/maritime-hotspot-detector'
import { sampleMaritimeData } from './data/sampleMaritimeData'

console.log('Testing Maritime Hotspot Detector...\n')

// Test with sample data subset for faster testing
const testData = sampleMaritimeData.slice(0, 20)

console.log('Test data points:', testData.length)

try {
  const detector = new MaritimeHotSpotDetector()
  console.log('Detector created successfully')
  
  const hotspots = detector.detectHotSpots(testData)
  console.log('Hotspots detected:', hotspots.length)
  
  hotspots.forEach((hotspot, index) => {
    console.log(`\nHotspot ${index + 1}:`)
    console.log(`  Type: ${hotspot.type}`)
    console.log(`  Z-score: ${hotspot.zScore.toFixed(2)}`)
    console.log(`  Confidence: ${(hotspot.confidence * 100).toFixed(1)}%`)
    console.log(`  Center: [${hotspot.center[0].toFixed(3)}, ${hotspot.center[1].toFixed(3)}]`)
    console.log(`  Radius: ${hotspot.radius.toFixed(1)} km`)
    console.log(`  Trend: ${hotspot.temporalTrend}`)
    console.log(`  Vessel Density: ${hotspot.vesselDensity.toFixed(2)} ships/km²`)
  })
  
  console.log('\n✅ Maritime hotspot detector test completed successfully!')
  
} catch (error) {
  console.error('❌ Error testing detector:', error)
}