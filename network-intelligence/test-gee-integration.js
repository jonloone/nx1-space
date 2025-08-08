/**
 * Test Google Earth Engine Integration
 */

const { geeService } = require('./lib/services/googleEarthEngineService.ts')

async function testGEEIntegration() {
  console.log('🧪 Testing Google Earth Engine Integration')
  console.log('==========================================')
  
  try {
    // Test 1: Connection Test
    console.log('\n1. Testing GEE Connection...')
    const connectionTest = await geeService.testConnection()
    
    console.log(`Status: ${connectionTest.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Message: ${connectionTest.message}`)
    
    if (!connectionTest.success) {
      process.exit(1)
    }
    
    // Test 2: Location Intelligence
    console.log('\n2. Testing Location Intelligence (NYC)...')
    const intelligence = await geeService.getLocationIntelligence(40.7128, -74.0060, 10000)
    
    console.log('✅ Location intelligence data retrieved:')
    console.log(`- Nightlights: ${intelligence.nightlights.success ? 'OK' : 'FAILED'}`)
    console.log(`- Population: ${intelligence.population.success ? 'OK' : 'FAILED'}`) 
    console.log(`- Land Cover: ${intelligence.landcover.success ? 'OK' : 'FAILED'}`)
    console.log(`- Maritime: ${intelligence.maritime.success ? 'OK' : 'FAILED'}`)
    
    // Test 3: Maritime Activity Test
    console.log('\n3. Testing Maritime Activity (North Atlantic)...')
    const maritimeData = await geeService.getMaritimeActivity({
      geometry: { type: 'Point', coordinates: [-40.0, 45.0] },
      scale: 500,
      dataset: 'maritime'
    })
    
    console.log(`Maritime Status: ${maritimeData.success ? '✅ OK' : '❌ FAILED'}`)
    if (maritimeData.success) {
      console.log(`Data points: ${maritimeData.metadata.pixelCount}`)
    }
    
    console.log('\n🎉 Google Earth Engine integration test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testGEEIntegration()