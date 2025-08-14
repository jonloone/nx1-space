const puppeteer = require('puppeteer');

async function debugPage() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    console.log('Navigating to enhanced-map page...');
    await page.goto('http://localhost:3000/enhanced-map', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/enhanced-map-page.png',
      fullPage: false 
    });
    console.log('Screenshot saved: enhanced-map-page.png');
    
    // Check for canvas
    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    console.log('\nHas canvas:', hasCanvas);
    
    // Check for view indicator
    const hasViewIndicator = await page.evaluate(() => !!document.querySelector('.absolute.top-4.left-4'));
    console.log('Has view indicator:', hasViewIndicator);
    
    // Check page text
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\nPage contains:', bodyText.substring(0, 200));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugPage().catch(console.error);
