/**
 * Simple test to verify the maritime hotspot detector works
 */

// Import the data and detector (using require for Node.js)
const detector = require('./lib/analysis/maritime-hotspot-detector.ts');
const sampleData = require('./data/sampleMaritimeData.ts');

console.log('Testing Maritime Hotspot Detector...\n');

// Test data
const testData = [
  // Singapore Strait cluster (should create hot spot)
  { latitude: 1.2966, longitude: 103.8558, vesselCount: 45, avgSpeed: 12.5, avgSize: 85000 },
  { latitude: 1.3521, longitude: 103.8198, vesselCount: 38, avgSpeed: 11.8, avgSize: 92000 },
  { latitude: 1.2897, longitude: 103.8619, vesselCount: 42, avgSpeed: 13.2, avgSize: 78000 },
  
  // Isolated points (should not create hot spots)
  { latitude: 10.0, longitude: 120.0, vesselCount: 5, avgSpeed: 15.0, avgSize: 50000 },
  { latitude: 45.0, longitude: -50.0, vesselCount: 3, avgSpeed: 18.0, avgSize: 60000 },
];

console.log('Test data points:', testData.length);
console.log('Sample data points:', sampleData.sampleMaritimeData ? sampleData.sampleMaritimeData.length : 'not loaded');

// Try to create detector instance and test
try {
  const detectorInstance = new detector.MaritimeHotSpotDetector();
  console.log('Detector created successfully');
  
  const hotspots = detectorInstance.detectHotSpots(testData);
  console.log('Hotspots detected:', hotspots.length);
  
  hotspots.forEach((hotspot, index) => {
    console.log(`\nHotspot ${index + 1}:`);
    console.log(`  Type: ${hotspot.type}`);
    console.log(`  Z-score: ${hotspot.zScore.toFixed(2)}`);
    console.log(`  Confidence: ${(hotspot.confidence * 100).toFixed(1)}%`);
    console.log(`  Center: [${hotspot.center[0].toFixed(3)}, ${hotspot.center[1].toFixed(3)}]`);
    console.log(`  Radius: ${hotspot.radius.toFixed(1)} km`);
    console.log(`  Trend: ${hotspot.temporalTrend}`);
  });
  
} catch (error) {
  console.error('Error testing detector:', error.message);
  console.error('Stack:', error.stack);
}