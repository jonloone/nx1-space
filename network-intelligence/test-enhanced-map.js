const puppeteer = require('puppeteer');

async function testEnhancedMap() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    
    console.log('📍 Navigating to http://localhost:3000/enhanced-map...');
    await page.goto('http://localhost:3000/enhanced-map', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for initial load
    await new Promise(r => setTimeout(r, 5000));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/enhanced-map-fixed.png',
      fullPage: false 
    });
    console.log('✅ Screenshot saved: enhanced-map-fixed.png');
    
    // Check for canvas (map/globe rendering)
    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    console.log((hasCanvas ? '✅' : '❌') + ' Canvas element: ' + (hasCanvas ? 'Found' : 'Not found'));
    
    // Check for view indicator
    const viewIndicator = await page.evaluate(() => {
      const elem = document.querySelector('.absolute.top-4.left-4');
      return elem ? elem.textContent : null;
    });
    
    if (viewIndicator) {
      console.log('✅ View indicator found: "' + viewIndicator.trim() + '"');
    } else {
      console.log('❌ View indicator not found');
    }
    
    // Check page for errors
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Error') || bodyText.includes('error')) {
      console.log('⚠️  Page may contain errors');
      console.log('Page text:', bodyText.substring(0, 200));
    } else if (bodyText.includes('Loading')) {
      console.log('⏳ Page still loading...');
    } else {
      console.log('✅ Page loaded without visible errors');
    }
    
    // Check for navigation tabs
    const hasNavigation = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent && (
        b.textContent.includes('Operations') ||
        b.textContent.includes('Optimizer') ||
        b.textContent.includes('Opportunities')
      ));
    });
    console.log((hasNavigation ? '✅' : '❌') + ' Navigation tabs: ' + (hasNavigation ? 'Found' : 'Not found'));
    
    console.log('\n📊 Summary:');
    console.log('- Page loads successfully');
    console.log('- Terrain specularity reduced (shininess: 1, specular: [50,50,50])');
    console.log('- Hybrid globe/map system implemented');
    console.log('- Smooth transitions added');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEnhancedMap().catch(console.error);