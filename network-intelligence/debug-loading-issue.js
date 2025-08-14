const puppeteer = require('puppeteer');

async function debugLoadingIssue() {
  console.log('🔍 Debugging infinite loading issue...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new', // Must use headless in server environment
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--disable-web-security',
      '--window-size=1920,1080'
    ]
  });
  
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  
  // Capture all console output
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.push({ type, text });
    
    if (type === 'error') {
      errors.push(text);
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'log' || type === 'warn') {
      console.log(`📝 ${type.toUpperCase()}: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.toString());
    console.log(`💥 PAGE ERROR: ${error.toString()}`);
  });
  
  try {
    console.log('🌐 Loading page...');
    await page.goto('http://localhost:3001/enhanced-map', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait a bit and check the state
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what's in the page
    const pageState = await page.evaluate(() => {
      const result = {
        hasDebugCesium: typeof window.debugCesium !== 'undefined',
        hasCesium: typeof window.Cesium !== 'undefined',
        cesiumBaseUrl: window.CESIUM_BASE_URL,
        containers: []
      };
      
      // Check for container elements
      const containers = document.querySelectorAll('[class*="cesium"], [id*="cesium"], canvas');
      containers.forEach(el => {
        result.containers.push({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          hasChildren: el.children.length > 0
        });
      });
      
      // Check loading states
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"]');
      result.loadingElements = loadingElements.length;
      
      // Check for error messages
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
      result.errorElements = errorElements.length;
      
      return result;
    });
    
    console.log('\n📊 Page State Analysis:');
    console.log('='.repeat(40));
    console.log('Debug Cesium Available:', pageState.hasDebugCesium);
    console.log('Cesium Library Loaded:', pageState.hasCesium);
    console.log('Cesium Base URL:', pageState.cesiumBaseUrl);
    console.log('Container Elements:', pageState.containers.length);
    console.log('Loading Elements:', pageState.loadingElements);
    console.log('Error Elements:', pageState.errorElements);
    
    console.log('\nContainer Details:');
    pageState.containers.forEach((container, i) => {
      console.log(`  ${i + 1}. ${container.tagName} class="${container.className}" id="${container.id}"`);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/loading-debug.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: test-screenshots/loading-debug.png');
    
    // Check network requests
    const failedRequests = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('cesium') || entry.name.includes('Cesium'))
        .map(entry => ({
          url: entry.name,
          status: entry.transferSize === 0 ? 'Failed' : 'OK',
          size: entry.transferSize
        }));
    });
    
    console.log('\n🌐 Cesium Resource Loading:');
    failedRequests.forEach(req => {
      console.log(`  ${req.status === 'OK' ? '✅' : '❌'} ${req.url.split('/').pop()} (${req.size} bytes)`);
    });
    
    console.log('\n🔴 Error Summary:');
    if (errors.length === 0) {
      console.log('No errors detected');
    } else {
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugLoadingIssue().catch(console.error);