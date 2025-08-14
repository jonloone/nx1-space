/**
 * Test ML Model Validation
 * 
 * Validates that ML predictions outperform hardcoded weights
 */

const { mlValidationService } = require('./lib/validation/ml-validation-service');
const { completeGroundStationNetwork } = require('./data/groundStations');

async function testMLValidation() {
  console.log('🚀 Starting ML Model Validation Test...\n');
  
  try {
    // Get ground stations with enriched data
    const stations = completeGroundStationNetwork || [];
    console.log(`📡 Testing with ${stations.length} ground stations\n`);
    
    // Test 1: Validate against profit
    console.log('Test 1: Validating ML predictions against station profitability...');
    const profitValidation = await mlValidationService.validateModel(stations, 'profit');
    
    // Test 2: Validate against revenue
    console.log('\nTest 2: Validating ML predictions against station revenue...');
    const revenueValidation = await mlValidationService.validateModel(stations, 'revenue');
    
    // Test 3: Cross-validation
    console.log('\nTest 3: Performing 5-fold cross-validation...');
    const cvResults = await mlValidationService.crossValidate(stations, 5);
    const avgCVMetrics = {
      rmse: cvResults.reduce((sum, r) => sum + r.rmse, 0) / cvResults.length,
      mae: cvResults.reduce((sum, r) => sum + r.mae, 0) / cvResults.length,
      r2: cvResults.reduce((sum, r) => sum + r.r2, 0) / cvResults.length,
      mape: cvResults.reduce((sum, r) => sum + r.mape, 0) / cvResults.length,
      correlation: cvResults.reduce((sum, r) => sum + r.correlation, 0) / cvResults.length
    };
    
    console.log('\n📊 Cross-Validation Results:');
    console.log(`  Average RMSE: ${avgCVMetrics.rmse.toFixed(2)}`);
    console.log(`  Average MAE: ${avgCVMetrics.mae.toFixed(2)}`);
    console.log(`  Average R²: ${avgCVMetrics.r2.toFixed(3)}`);
    console.log(`  Average MAPE: ${avgCVMetrics.mape.toFixed(1)}%`);
    console.log(`  Average Correlation: ${avgCVMetrics.correlation.toFixed(3)}`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ VALIDATION TEST SUMMARY');
    console.log('='.repeat(60));
    
    // Check if ML outperforms hardcoded
    const mlOutperforms = profitValidation.modelComparison.improvement > 0;
    if (mlOutperforms) {
      console.log(`✅ ML model OUTPERFORMS hardcoded weights by ${profitValidation.modelComparison.improvement.toFixed(1)}%`);
    } else {
      console.log(`⚠️ ML model needs improvement (currently ${Math.abs(profitValidation.modelComparison.improvement).toFixed(1)}% worse)`);
    }
    
    // Check prediction quality
    if (profitValidation.overallMetrics.r2 > 0.5) {
      console.log(`✅ Good predictive power with R² = ${profitValidation.overallMetrics.r2.toFixed(3)}`);
    } else {
      console.log(`⚠️ Moderate predictive power with R² = ${profitValidation.overallMetrics.r2.toFixed(3)}`);
    }
    
    // Feature importance insights
    console.log('\n🎯 Most Important Features:');
    profitValidation.featureAnalysis.slice(0, 3).forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.feature} (${(f.importance * 100).toFixed(1)}% importance)`);
    });
    
    // Station-specific insights
    console.log('\n📍 Best Predicted Stations:');
    const sortedByError = [...profitValidation.perStationErrors].sort((a, b) => a.percentageError - b.percentageError);
    sortedByError.slice(0, 3).forEach(s => {
      console.log(`  ✅ ${s.stationName}: ${s.percentageError.toFixed(1)}% error`);
    });
    
    console.log('\n📍 Needs Improvement:');
    sortedByError.slice(-3).reverse().forEach(s => {
      console.log(`  ⚠️ ${s.stationName}: ${s.percentageError.toFixed(1)}% error`);
    });
    
    // Save validation report
    const fs = require('fs');
    const reportPath = './validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      profitValidation,
      revenueValidation,
      crossValidation: avgCVMetrics,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`\n💾 Full validation report saved to ${reportPath}`);
    
    console.log('\n🎉 ML Validation Test Complete!');
    
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testMLValidation().catch(console.error);