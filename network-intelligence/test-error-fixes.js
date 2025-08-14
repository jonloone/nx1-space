#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testErrorFixes() {
  console.log('🧪 Testing Console Error Fixes...\n');
  
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
  
  // Capture all console output
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      
      if (text.includes('hydration') || text.includes('hydrated')) {
        hydrationErrors++;
      }
      
      if (text.includes('Cesium') || text.includes('_cesiumWidget')) {
        cesiumErrors++;
      }
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.toString());
  });
  
  try {
    console.log('🌐 Loading enhanced-map page...');
    await page.goto('http://localhost:3001/enhanced-map', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/error-fixes-test.png',
      fullPage: true 
    });
    
    console.log('📊 Test Results:');
    console.log('===============');
    console.log(`Total Errors: ${errors.length}`);
    console.log(`Total Warnings: ${warnings.length}`);
    console.log(`Hydration Errors: ${hydrationErrors}`);
    console.log(`Cesium Errors: ${cesiumErrors}`);
    
    if (errors.length === 0) {
      console.log('\n✅ SUCCESS: No console errors detected!');
    } else {
      console.log('\n❌ ERRORS FOUND:');
      errors.slice(0, 5).forEach((error, i) => {
        console.log(`${i + 1}. ${error.substring(0, 200)}...`);
      });
      
      if (errors.length > 5) {
        console.log(`... and ${errors.length - 5} more errors`);
      }
    }
    
    // Specific fixes verification
    console.log('\n🔍 Fix Verification:');
    console.log('====================');
    
    const fixResults = {
      hydrationMismatch: hydrationErrors === 0 ? '✅ Fixed' : `❌ ${hydrationErrors} remaining`,
      cesiumDestruction: cesiumErrors === 0 ? '✅ Fixed' : `❌ ${cesiumErrors} remaining`,
      containerIssues: !errors.some(e => e.includes('container is required')) ? '✅ Fixed' : '❌ Still present',
      deckGLOverlay: !errors.some(e => e.includes('_cesiumWidget is undefined')) ? '✅ Fixed' : '❌ Still present'
    };
    
    console.log(`Hydration Mismatch: ${fixResults.hydrationMismatch}`);
    console.log(`Cesium Destruction: ${fixResults.cesiumDestruction}`);
    console.log(`Container Issues: ${fixResults.containerIssues}`);
    console.log(`DeckGL Overlay: ${fixResults.deckGLOverlay}`);
    
    // Summary
    const allFixed = Object.values(fixResults).every(result => result.includes('✅'));
    console.log(`\n${allFixed ? '🎉' : '⚠️'} Overall Status: ${allFixed ? 'All fixes successful!' : 'Some issues remain'}`);
    
    console.log('\n📸 Screenshot saved: test-screenshots/error-fixes-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testErrorFixes().catch(console.error);