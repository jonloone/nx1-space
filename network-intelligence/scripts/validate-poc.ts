#!/usr/bin/env ts-node

/**
 * POC Validation Script
 * 
 * Runs the complete validation suite to verify:
 * - Empirical weight calibration from known stations
 * - Real orbital mechanics integration
 * - Spatial interpolation accuracy
 * - >70% accuracy on predicting station profitability
 * 
 * Usage: npm run validate-poc
 */

import POCValidationTest from '../lib/testing/poc-validation-test'

async function main() {
  console.log('🚀 Ground Station Intelligence POC Validation')
  console.log('============================================')
  console.log('Target: >70% accuracy on known stations')
  console.log('Method: Empirical calibration + Real orbital mechanics')
  console.log('Approach: Reality-based (NO HEXAGONS)')
  console.log()
  
  try {
    // Initialize validator
    const validator = new POCValidationTest()
    
    // Run full validation suite
    const report = await validator.runFullValidation()
    
    // Save report to file
    const fs = require('fs')
    const reportPath = `./validation-reports/poc-validation-${Date.now()}.json`
    
    // Ensure directory exists
    if (!fs.existsSync('./validation-reports')) {
      fs.mkdirSync('./validation-reports', { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Report saved to: ${reportPath}`)
    
    // Exit with appropriate code
    process.exit(report.passed ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ Validation failed with error:', error)
    process.exit(1)
  }
}

// Run validation
main().catch(console.error)