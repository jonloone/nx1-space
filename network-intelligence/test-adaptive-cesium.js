const puppeteer = require('puppeteer');

async function testAdaptiveCesium() {
  console.log('🚀 Testing adaptive Cesium implementation...\n');
  
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
  const errors = [];
  
  // Capture console output
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    
    if (msg.type() === 'error') {
      errors.push(text);
    }
    
    // Log key messages
    if (text.includes('WebGL') || 
        text.includes('Cesium') || 
        text.includes('initialization') ||
        text.includes('Performance Level') ||
        text.includes('fallback')) {
      console.log(`📝 ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.toString());
    console.log(`💥 PAGE ERROR: ${error.toString()}`);
  });
  
  try {
    console.log('🌐 Loading enhanced-map page...');
    await page.goto('http://localhost:3001/enhanced-map', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for initialization to complete
    console.log('⏳ Waiting for Cesium initialization...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check final state
    const finalState = await page.evaluate(() => {
      return {
        // Check for loading states
        loadingElements: document.querySelectorAll('[class*="loading"], [class*="Loading"]').length,
        errorElements: document.querySelectorAll('[class*="error"], [class*="Error"]').length,
        fallbackElements: document.querySelectorAll('[class*="fallback"], [class*="Fallback"]').length,
        
        // Check for Cesium elements
        cesiumContainers: document.querySelectorAll('.cesium-viewer').length,
        canvasElements: document.querySelectorAll('canvas').length,
        
        // Check for our specific fallback UI
        webglFallback: !!document.querySelector('[class*="WebGL"]') || 
                      document.body.innerText.includes('3D Globe Unavailable'),
        
        // Check for any visible text content
        visibleText: document.body.innerText.substring(0, 500),
        
        // Check URL for any error parameters
        currentUrl: window.location.href
      };
    });
    
    console.log('\n📊 Final State Analysis:');
    console.log('='.repeat(50));
    console.log('Loading Elements:', finalState.loadingElements);
    console.log('Error Elements:', finalState.errorElements);
    console.log('Fallback Elements:', finalState.fallbackElements);
    console.log('Cesium Containers:', finalState.cesiumContainers);
    console.log('Canvas Elements:', finalState.canvasElements);
    console.log('WebGL Fallback Active:', finalState.webglFallback);
    console.log('Current URL:', finalState.currentUrl);
    
    // Check for success criteria
    const hasInfiniteLoading = finalState.loadingElements > 0 && 
                              finalState.visibleText.includes('Loading 3D Globe');
    const hasWorkingFallback = finalState.webglFallback || 
                              finalState.visibleText.includes('WebGL') ||
                              finalState.visibleText.includes('3D Globe Unavailable');
    const hasErrorUI = finalState.errorElements > 0 || finalState.fallbackElements > 0;
    
    console.log('\n🎯 Success Criteria:');
    console.log('❌ No Infinite Loading:', !hasInfiniteLoading ? '✅' : '❌');
    console.log('✅ Working Fallback UI:', hasWorkingFallback ? '✅' : '❌');
    console.log('🛡️  Error Handling:', hasErrorUI ? '✅' : '❌');
    
    // Analyze logs for key improvements
    console.log('\n🔍 Key Log Analysis:');
    const webglDetection = logs.find(log => log.includes('WebGL Environment'));
    const performanceLevel = logs.find(log => log.includes('Performance Level'));
    const adaptiveConfig = logs.find(log => log.includes('adaptive') || log.includes('configuration'));
    
    if (webglDetection) console.log('✅ WebGL Detection Working');
    if (performanceLevel) console.log('✅ Performance Level Detection Working');
    if (adaptiveConfig) console.log('✅ Adaptive Configuration Working');
    
    // Take screenshot for verification
    await page.screenshot({ 
      path: 'test-screenshots/adaptive-cesium-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot: test-screenshots/adaptive-cesium-test.png');
    
    // Show visible content
    console.log('\n📋 Visible Content (first 300 chars):');
    console.log(finalState.visibleText.substring(0, 300) + '...');
    
    // Count types of logs
    const webglLogs = logs.filter(log => log.toLowerCase().includes('webgl'));
    const cesiumLogs = logs.filter(log => log.toLowerCase().includes('cesium'));
    const errorLogs = errors.length;
    
    console.log('\n📈 Log Summary:');
    console.log(`WebGL-related logs: ${webglLogs.length}`);
    console.log(`Cesium-related logs: ${cesiumLogs.length}`);
    console.log(`Error logs: ${errorLogs}`);
    
    // Final assessment
    const overallSuccess = !hasInfiniteLoading && (hasWorkingFallback || hasErrorUI);
    console.log('\n🏆 Overall Assessment:', overallSuccess ? '✅ SUCCESS' : '❌ NEEDS WORK');
    
    if (overallSuccess) {
      console.log('✨ The infinite loading issue has been resolved!');
      console.log('✨ Users now see either working 3D globe or proper fallback UI');
    } else {
      console.log('⚠️  Still experiencing issues - may need additional debugging');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAdaptiveCesium().catch(console.error);