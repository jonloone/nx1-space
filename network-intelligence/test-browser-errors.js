const puppeteer = require('puppeteer');

async function testBrowserErrors() {
  console.log('🧪 Testing for browser console errors...\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser with appropriate flags
    browser = await puppeteer.launch({
      headless: false, // Run in full browser mode to get real errors
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
      ]
    });
    
    page = await browser.newPage();
    
    // Collect console messages
    const errors = [];
    const warnings = [];
    const logs = [];
    
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        errors.push(text);
        console.log('❌ ERROR:', text.substring(0, 200));
      } else if (type === 'warning') {
        warnings.push(text);
        console.log('⚠️  WARNING:', text.substring(0, 200));
      } else if (type === 'log' && text.includes('Cesium')) {
        logs.push(text);
        console.log('📝 LOG:', text.substring(0, 200));
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.toString());
      console.log('💥 PAGE ERROR:', error.toString().substring(0, 200));
    });
    
    // Navigate to the page
    console.log('🌐 Navigating to http://localhost:3001/enhanced-map...\n');
    await page.goto('http://localhost:3001/enhanced-map', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for Cesium initialization
    const cesiumStatus = await page.evaluate(() => {
      const result = {
        cesiumLoaded: typeof window.Cesium !== 'undefined',
        cesiumBaseUrl: window.CESIUM_BASE_URL,
        hasViewer: false,
        viewerError: null
      };
      
      if (window.debugCesium && window.debugCesium.viewer) {
        result.hasViewer = true;
      }
      
      // Check for viewer div
      const viewerDiv = document.querySelector('.cesium-viewer');
      result.hasViewerDiv = !!viewerDiv;
      
      // Check for canvas
      const canvas = document.querySelector('canvas');
      result.hasCanvas = !!canvas;
      
      return result;
    });
    
    console.log('\n📊 Cesium Status:');
    console.log('   Cesium Loaded:', cesiumStatus.cesiumLoaded);
    console.log('   Base URL:', cesiumStatus.cesiumBaseUrl);
    console.log('   Has Viewer:', cesiumStatus.hasViewer);
    console.log('   Has Viewer Div:', cesiumStatus.hasViewerDiv);
    console.log('   Has Canvas:', cesiumStatus.hasCanvas);
    
    console.log('\n📋 Error Summary:');
    console.log('   Errors:', errors.length);
    console.log('   Warnings:', warnings.length);
    
    if (errors.length > 0) {
      console.log('\n🔴 Errors Found:');
      errors.forEach((error, i) => {
        console.log(`\n${i + 1}. ${error}`);
      });
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/browser-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: test-screenshots/browser-test.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testBrowserErrors().catch(console.error);