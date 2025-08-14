const puppeteer = require('puppeteer');

async function testCesiumAssets() {
  console.log('🔍 Testing Cesium asset availability...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console output
  page.on('console', msg => {
    console.log(`[Browser] ${msg.text()}`);
  });
  
  try {
    // Test the debug page
    console.log('📍 Loading debug page...');
    await page.goto('http://localhost:3001/debug-cesium.html', {
      waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get test results
    const results = await page.evaluate(() => {
      const tests = [];
      document.querySelectorAll('.test').forEach(el => {
        tests.push({
          text: el.textContent,
          type: el.className.replace('test ', '')
        });
      });
      return tests;
    });
    
    console.log('\n📊 Test Results:');
    results.forEach(result => {
      const icon = result.type === 'pass' ? '✅' : 
                   result.type === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.text}`);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/cesium-debug.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: test-screenshots/cesium-debug.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testCesiumAssets().catch(console.error);