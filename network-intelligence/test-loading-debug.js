const puppeteer = require('puppeteer');

async function testLoadingDebug() {
  console.log('🔍 Testing loading debug with enhanced logging...\n');
  
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
  
  const logs = [];
  
  // Capture all console output
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.push({ type, text, timestamp: Date.now() });
    console.log(`[${type.toUpperCase()}] ${text}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.toString()}`);
  });
  
  try {
    console.log('🌐 Loading page with debug logging...');
    
    await page.goto('http://localhost:3001/enhanced-map', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait longer to see what happens
    console.log('⏳ Waiting 15 seconds to observe initialization...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check current state
    const finalState = await page.evaluate(() => {
      return {
        hasDebugCesium: typeof window.debugCesium !== 'undefined',
        hasCesium: typeof window.Cesium !== 'undefined',
        cesiumBaseUrl: window.CESIUM_BASE_URL,
        loadingElements: document.querySelectorAll('[class*="loading"], [class*="Loading"]').length,
        errorElements: document.querySelectorAll('[class*="error"], [class*="Error"]').length,
        canvasElements: document.querySelectorAll('canvas').length,
        cesiumContainers: document.querySelectorAll('.cesium-viewer').length
      };
    });
    
    console.log('\n📊 Final State Analysis:');
    console.log('Debug Cesium:', finalState.hasDebugCesium);
    console.log('Cesium Library:', finalState.hasCesium);
    console.log('Base URL:', finalState.cesiumBaseUrl);
    console.log('Loading Elements:', finalState.loadingElements);
    console.log('Error Elements:', finalState.errorElements);
    console.log('Canvas Elements:', finalState.canvasElements);
    console.log('Cesium Containers:', finalState.cesiumContainers);
    
    // Analyze logs for patterns
    console.log('\n📋 Log Analysis:');
    const stateTransitions = logs.filter(log => log.text.includes('Cesium viewer state:'));
    const errors = logs.filter(log => log.type === 'error');
    const warnings = logs.filter(log => log.type === 'warning');
    
    console.log('State Transitions:', stateTransitions.length);
    stateTransitions.forEach(log => console.log(`  - ${log.text}`));
    
    console.log('Errors:', errors.length);
    errors.forEach(log => console.log(`  - ${log.text.substring(0, 100)}...`));
    
    console.log('Warnings:', warnings.length);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/loading-debug-detailed.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot: test-screenshots/loading-debug-detailed.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testLoadingDebug().catch(console.error);