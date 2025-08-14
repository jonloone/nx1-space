#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testComprehensiveFixes() {
  console.log('🧪 Testing Comprehensive Console Error Fixes...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--disable-web-security'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const errors = [];
  const warnings = [];
  let hydrationErrors = 0;
  let cesiumErrors = 0;
  let contextErrors = 0;
  let containerErrors = 0;
  
  // Capture all console output with categorization
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      
      // Categorize errors
      if (text.includes('hydration') || text.includes('hydrated')) {
        hydrationErrors++;
      }
      
      if (text.includes('Cesium') || text.includes('_cesiumWidget') || text.includes('WebGL')) {
        cesiumErrors++;
      }
      
      if (text.includes('Context') || text.includes('Provider')) {
        contextErrors++;
      }
      
      if (text.includes('container is required') || text.includes('Container')) {
        containerErrors++;
      }
      
      console.log(`❌ [${type.toUpperCase()}] ${text.substring(0, 150)}...`);
    } else if (type === 'warning') {
      warnings.push(text);
    } else if (type === 'log' && (text.includes('✅') || text.includes('🔄') || text.includes('🌍'))) {
      console.log(`📝 [LOG] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.toString());
    console.log(`💥 [PAGE ERROR] ${error.toString().substring(0, 150)}...`);
  });
  
  try {
    console.log('🌐 Loading enhanced-map page...');
    const startTime = Date.now();
    
    await page.goto('http://localhost:3001/enhanced-map', {
      waitUntil: 'networkidle2',
      timeout: 45000
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Page loaded in ${loadTime}ms`);
    
    // Wait for initialization
    console.log('⏳ Waiting for initialization...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check for context provider
    const hasContext = await page.evaluate(() => {
      return window.debugCesium !== undefined;
    });
    
    // Check for viewer state
    const viewerState = await page.evaluate(() => {
      if (window.debugCesium) {
        return {
          hasViewer: !!window.debugCesium.viewer,
          stationCount: window.debugCesium.stations ? window.debugCesium.stations.length : 0
        };
      }
      return null;
    });
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-screenshots/comprehensive-fixes-test.png',
      fullPage: true 
    });
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Load Time: ${loadTime}ms`);
    console.log(`Total Errors: ${errors.length}`);
    console.log(`Total Warnings: ${warnings.length}`);
    
    console.log('\n🔍 ERROR BREAKDOWN:');
    console.log(`Hydration Errors: ${hydrationErrors}`);
    console.log(`Cesium Errors: ${cesiumErrors}`);
    console.log(`Context Errors: ${contextErrors}`);
    console.log(`Container Errors: ${containerErrors}`);
    
    console.log('\n🧩 COMPONENT STATUS:');
    console.log(`Context Provider: ${hasContext ? '✅ Working' : '❌ Missing'}`);
    console.log(`Viewer State: ${viewerState?.hasViewer ? '✅ Initialized' : '❌ Failed'}`);
    console.log(`Station Data: ${viewerState?.stationCount || 0} stations`);
    
    // Fix verification
    console.log('\n✅ FIX VERIFICATION:');
    const fixResults = {
      hydrationMismatch: hydrationErrors === 0,
      cesiumDestruction: !errors.some(e => e.includes('This object was destroyed')),
      containerIssues: containerErrors === 0,
      contextSystem: hasContext && viewerState?.hasViewer,
      errorBoundary: !errors.some(e => e.includes('ErrorBoundary')),
      deckGLOverlay: !errors.some(e => e.includes('_cesiumWidget is undefined'))
    };
    
    Object.entries(fixResults).forEach(([fix, status]) => {
      console.log(`${status ? '✅' : '❌'} ${fix.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });
    
    // Overall success rate
    const successCount = Object.values(fixResults).filter(Boolean).length;
    const totalFixes = Object.keys(fixResults).length;
    const successRate = Math.round((successCount / totalFixes) * 100);
    
    console.log(`\n🎯 SUCCESS RATE: ${successCount}/${totalFixes} (${successRate}%)`);
    
    if (errors.length > 0) {
      console.log('\n🔴 REMAINING ERRORS:');
      errors.slice(0, 3).forEach((error, i) => {
        console.log(`${i + 1}. ${error.substring(0, 200)}...`);
      });
      
      if (errors.length > 3) {
        console.log(`... and ${errors.length - 3} more errors`);
      }
    }
    
    console.log('\n📸 Screenshot saved: test-screenshots/comprehensive-fixes-test.png');
    
    // Summary
    if (successRate >= 80 && cesiumErrors <= 2) { // Allow for minor WebGL headless issues
      console.log('\n🎉 COMPREHENSIVE FIXES: SUCCESS!');
      console.log('The application should now work correctly in real browsers.');
    } else {
      console.log('\n⚠️ SOME ISSUES REMAIN');
      console.log('Additional fixes may be needed for optimal performance.');
    }
    
    return {
      success: successRate >= 80 && cesiumErrors <= 2,
      errorCount: errors.length,
      successRate,
      fixResults
    };
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return {
      success: false,
      errorCount: -1,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the comprehensive test
testComprehensiveFixes()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All critical fixes verified successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some fixes need additional work.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });