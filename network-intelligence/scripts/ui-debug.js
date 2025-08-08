const puppeteer = require('puppeteer');

async function debugUIOverlaps() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🔍 Loading unified-v2 page...');
    await page.goto('http://localhost:3002/unified-v2', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for components to render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get all component positions
    const componentPositions = await page.evaluate(() => {
      const components = {
        demoControls: null,
        keyInsights: null,
        floatingInsights: null,
        verificationResults: null,
        operatorFilter: null,
        bottomNav: null
      };

      // Demo Control Panel
      const demoPanel = document.querySelector('.absolute.top-4.right-4.z-20');
      if (demoPanel) {
        const rect = demoPanel.getBoundingClientRect();
        components.demoControls = {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          zIndex: window.getComputedStyle(demoPanel).zIndex
        };
      }

      // Key Insights / Floating Insights (left side)
      const insights = document.querySelector('.absolute.left-4');
      if (insights) {
        const rect = insights.getBoundingClientRect();
        components.floatingInsights = {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          zIndex: window.getComputedStyle(insights).zIndex
        };
      }

      // Verification Results
      const verification = document.querySelector('.absolute.top-4.right-80');
      if (verification) {
        const rect = verification.getBoundingClientRect();
        components.verificationResults = {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          zIndex: window.getComputedStyle(verification).zIndex
        };
      }

      // Station Insights (right side)
      const stationInsights = document.querySelector('.absolute.right-4.top-20');
      if (stationInsights) {
        const rect = stationInsights.getBoundingClientRect();
        components.keyInsights = {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          zIndex: window.getComputedStyle(stationInsights).zIndex
        };
      }

      // Check for any other absolute positioned elements
      const allAbsolute = document.querySelectorAll('[class*="absolute"]');
      const otherComponents = [];
      allAbsolute.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          otherComponents.push({
            className: el.className,
            position: {
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height
            }
          });
        }
      });

      return { components, otherComponents };
    });

    console.log('\n📊 Component Analysis:');
    console.log('=====================\n');

    // Analyze overlaps
    const overlaps = [];
    const { components, otherComponents } = componentPositions;

    // Check if demo controls and key insights overlap
    if (components.demoControls && components.keyInsights) {
      const dc = components.demoControls;
      const ki = components.keyInsights;
      
      if (!(dc.right < ki.left || dc.left > ki.right || dc.bottom < ki.top || dc.top > ki.bottom)) {
        overlaps.push({
          component1: 'Demo Controls',
          component2: 'Key Insights',
          details: `Demo Controls (${dc.left}, ${dc.top}) overlaps with Key Insights (${ki.left}, ${ki.top})`
        });
      }
    }

    // Check verification results vs demo controls
    if (components.demoControls && components.verificationResults) {
      const dc = components.demoControls;
      const vr = components.verificationResults;
      
      if (!(dc.right < vr.left || dc.left > vr.right || dc.bottom < vr.top || dc.top > vr.bottom)) {
        overlaps.push({
          component1: 'Demo Controls',
          component2: 'Verification Results',
          details: `Demo Controls overlaps with Verification Results`
        });
      }
    }

    // Print component positions
    console.log('Component Positions:');
    Object.entries(components).forEach(([name, pos]) => {
      if (pos) {
        console.log(`\n${name}:`);
        console.log(`  Position: top=${pos.top}px, left=${pos.left}px, right=${pos.right}px`);
        console.log(`  Size: ${pos.width}x${pos.height}px`);
        console.log(`  Z-Index: ${pos.zIndex}`);
      }
    });

    // Print overlaps
    if (overlaps.length > 0) {
      console.log('\n⚠️  OVERLAPS DETECTED:');
      overlaps.forEach(overlap => {
        console.log(`  - ${overlap.component1} overlaps with ${overlap.component2}`);
        console.log(`    ${overlap.details}`);
      });
    } else {
      console.log('\n✅ No overlaps detected');
    }

    // Take screenshot for visual inspection
    await page.screenshot({ 
      path: '/tmp/ui-debug-screenshot.png',
      fullPage: false 
    });
    console.log('\n📸 Screenshot saved to /tmp/ui-debug-screenshot.png');

    // Get computed styles for problematic elements
    const styles = await page.evaluate(() => {
      const getStyles = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          top: computed.top,
          right: computed.right,
          bottom: computed.bottom,
          left: computed.left,
          zIndex: computed.zIndex,
          width: computed.width,
          height: computed.height
        };
      };

      return {
        demoControls: getStyles('.absolute.top-4.right-4'),
        floatingInsights: getStyles('.absolute.left-4'),
        verificationResults: getStyles('.absolute.top-4.right-80')
      };
    });

    console.log('\n📐 Computed Styles:');
    console.log(JSON.stringify(styles, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugUIOverlaps();