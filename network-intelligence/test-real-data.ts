/**
 * Test Real Data Connections
 * Verifies all Priority 1 data sources are working
 */

import { celestrakService } from './lib/data/celestrak-service';
import { marineCadastreService } from './lib/data/marine-cadastre-service';
import { naturalEarthService } from './lib/data/natural-earth-service';
import { unifiedDataService } from './lib/data/unified-data-service';

async function testCelesTrak() {
  console.log('\n🛰️  Testing CelesTrak TLE Data...');
  try {
    // Test fetching GEO satellites
    const geoSats = await celestrakService.fetchSatelliteGroup('GEO');
    console.log(`✅ Fetched ${geoSats.length} GEO satellites`);
    
    // Test fetching high-value satellites
    const highValue = await celestrakService.fetchHighValueSatellites();
    console.log(`✅ Fetched ${highValue.length} high-value satellites`);
    
    // Test visibility calculation for New York
    const visible = await celestrakService.getVisibleSatellites(40.7128, -74.0060, 10);
    console.log(`✅ ${visible.length} satellites visible from New York`);
    
    // Show sample satellite
    if (visible.length > 0) {
      const sample = visible[0];
      console.log(`   Sample: ${sample.satellite.satellite_name}`);
      console.log(`   - Elevation: ${sample.elevation.toFixed(1)}°`);
      console.log(`   - Value: ${sample.value}/100`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ CelesTrak test failed:', error);
    return false;
  }
}

async function testMarineCadastre() {
  console.log('\n🚢 Testing Marine Cadastre AIS Data...');
  try {
    // Test fetching AIS data for North Atlantic
    const vessels = await marineCadastreService.fetchAISData(new Date(), 9);
    console.log(`✅ Generated ${vessels.length} vessels for North Atlantic`);
    
    // Test vessel density calculation
    const density = await marineCadastreService.getVesselDensity(
      40.7128, -74.0060, // New York
      50 // 50nm radius
    );
    console.log(`✅ Vessel density near New York:`);
    console.log(`   - Total vessels: ${density.totalVessels}`);
    console.log(`   - Average speed: ${density.avgSpeed.toFixed(1)} knots`);
    console.log(`   - Total value: $${density.totalValue.toLocaleString()}/month`);
    
    // Show vessel type distribution
    if (Object.keys(density.vesselsByType).length > 0) {
      console.log('   Vessel types:');
      Object.entries(density.vesselsByType)
        .slice(0, 3)
        .forEach(([type, count]) => {
          console.log(`   - ${type}: ${count}`);
        });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Marine Cadastre test failed:', error);
    return false;
  }
}

async function testNaturalEarth() {
  console.log('\n🏗️  Testing Natural Earth Ports Data...');
  try {
    // Test loading all ports
    const allPorts = naturalEarthService.getAllPorts();
    console.log(`✅ Loaded ${allPorts.length} ports`);
    
    // Test major ports
    const majorPorts = naturalEarthService.getMajorPorts();
    console.log(`✅ ${majorPorts.length} major ports identified`);
    
    // Test nearest ports to New York
    const nearestToNY = naturalEarthService.getNearestPorts(40.7128, -74.0060, 5);
    console.log(`✅ Nearest ports to New York:`);
    nearestToNY.forEach(port => {
      console.log(`   - ${port.name}, ${port.country} (${port.avgDailyVessels} vessels/day)`);
    });
    
    // Test port opportunity scoring
    const opportunity = naturalEarthService.calculatePortOpportunity(
      40.7128, -74.0060, 500
    );
    console.log(`✅ Port opportunity score for New York area:`);
    console.log(`   - Score: ${opportunity.score}/100`);
    console.log(`   - Nearby ports: ${opportunity.nearbyPorts}`);
    console.log(`   - Vessel capacity: ${opportunity.totalVesselCapacity}`);
    console.log(`   - Major ports: ${opportunity.majorPorts.join(', ')}`);
    
    // Test global statistics
    const stats = naturalEarthService.getGlobalStatistics();
    console.log(`✅ Global statistics:`);
    console.log(`   - Total ports: ${stats.totalPorts}`);
    console.log(`   - Major ports: ${stats.majorPorts}`);
    console.log(`   - Top port: ${stats.topPortsByCapacity[0]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Natural Earth test failed:', error);
    return false;
  }
}

async function testUnifiedData() {
  console.log('\n🌐 Testing Unified Data Service...');
  try {
    // Test locations
    const testLocations = [
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
      { name: 'London', lat: 51.5074, lon: -0.1278 }
    ];
    
    for (const location of testLocations) {
      console.log(`\n📍 Testing ${location.name}...`);
      
      const analysis = await unifiedDataService.fetchLocationData(
        location.lat,
        location.lon,
        500 // 500km radius
      );
      
      console.log(`✅ Analysis complete:`);
      console.log(`   Scores:`);
      console.log(`   - Satellite: ${analysis.scores.satellite}/100`);
      console.log(`   - Maritime: ${analysis.scores.maritime}/100`);
      console.log(`   - Economic: ${analysis.scores.economic}/100`);
      console.log(`   - Overall: ${analysis.scores.overall}/100`);
      console.log(`   - Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      
      console.log(`   Revenue potential:`);
      console.log(`   - Monthly: $${analysis.revenue.monthly.toLocaleString()}`);
      console.log(`   - Annual: $${analysis.revenue.annual.toLocaleString()}`);
      
      console.log(`   Data points: ${analysis.dataPoints.length}`);
      
      if (analysis.insights.length > 0) {
        console.log(`   Insights:`);
        analysis.insights.forEach(insight => {
          console.log(`   - ${insight}`);
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unified data test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('🔬 TESTING REAL DATA CONNECTIONS');
  console.log('========================================');
  
  const results = {
    celestrak: false,
    marineCadastre: false,
    naturalEarth: false,
    unified: false
  };
  
  // Run tests
  results.celestrak = await testCelesTrak();
  results.marineCadastre = await testMarineCadastre();
  results.naturalEarth = await testNaturalEarth();
  results.unified = await testUnifiedData();
  
  // Summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  console.log(`CelesTrak (Satellites):     ${results.celestrak ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Marine Cadastre (AIS):      ${results.marineCadastre ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Natural Earth (Ports):      ${results.naturalEarth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Unified Data Service:       ${results.unified ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPass = Object.values(results).every(r => r);
  console.log('\n' + (allPass ? 
    '🎉 ALL TESTS PASSED! Real data sources are working.' : 
    '⚠️  Some tests failed. Check the errors above.'));
  
  return allPass;
}

// Run if executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runAllTests };