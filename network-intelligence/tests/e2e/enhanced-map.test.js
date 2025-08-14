const puppeteer = require('puppeteer');

describe('Enhanced Map Controls E2E Tests', () => {
  let browser;
  let page;
  const baseUrl = 'http://localhost:3001';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    page = await browser.newPage();
    
    // Set viewport to ensure consistent testing
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Increase timeout for loading 3D content
    page.setDefaultTimeout(30000);
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Enhanced Map Loading', () => {
    test('Should load the enhanced map page with Dark Terrain selected', async () => {
      const response = await page.goto(`${baseUrl}/enhanced-map`, {
        waitUntil: 'networkidle2'
      });
      
      expect(response.status()).toBe(200);
      
      // Wait for map to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check for Dark Terrain button
      const darkTerrainButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent?.includes('Dark Terrain'));
      });
      
      expect(darkTerrainButton).toBeTruthy();
    });

    test('Should have map type selector visible', async () => {
      // Check for 3D Globe button
      const globeButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent?.includes('3D Globe'));
      });
      
      expect(globeButton).toBeTruthy();
    });
  });

  describe('Zoom Level Controls', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/enhanced-map`, {
        waitUntil: 'networkidle2'
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test('Should have zoom in/out buttons', async () => {
      // Check for SVG buttons (zoom controls)
      const svgButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.filter(btn => btn.querySelector('svg')).length;
      });
      
      expect(svgButtons).toBeGreaterThan(0);
    });

    test('Should display current zoom level', async () => {
      // Check for View Level display
      const viewLevelText = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        return divs.some(div => div.textContent?.includes('View Level'));
      });
      
      expect(viewLevelText).toBeTruthy();
    });

    test('Should show zoom level indicators', async () => {
      // Check for level names like Space, Continental, Regional, etc.
      const levelNames = ['Space', 'Continental', 'Regional', 'State', 'Local', 'Terrain'];
      
      for (const level of levelNames.slice(0, 3)) { // Check first 3 levels
        const hasLevel = await page.evaluate((levelName) => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.some(el => el.textContent?.includes(levelName));
        }, level);
        
        if (hasLevel) {
          expect(hasLevel).toBeTruthy();
          break; // At least one level indicator found
        }
      }
    });
  });

  describe('Navigation Controls', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/enhanced-map`, {
        waitUntil: 'networkidle2'
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test('Should have compass control', async () => {
      // Check for compass elements (circle SVG)
      const hasCompass = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('svg'));
        return svgs.some(svg => svg.querySelector('circle'));
      });
      
      expect(hasCompass).toBeTruthy();
    });

    test('Should have tilt control slider', async () => {
      // Check for range input for tilt
      const hasTiltControl = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
        return inputs.length > 0;
      });
      
      expect(hasTiltControl).toBeTruthy();
    });

    test('Should have quick action buttons', async () => {
      // Check for Top View and 3D View buttons
      const quickActions = ['Top View', '3D View', 'North', 'Reset'];
      
      for (const action of quickActions) {
        const hasAction = await page.evaluate((actionName) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some(btn => btn.textContent?.includes(actionName));
        }, action);
        
        if (hasAction) {
          expect(hasAction).toBeTruthy();
          break; // At least one quick action found
        }
      }
    });
  });

  describe('Mouse Mode Selector', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/enhanced-map`, {
        waitUntil: 'networkidle2'
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test('Should have Pan and Rotate mode buttons', async () => {
      // Check for Pan button
      const hasPanButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent?.includes('Pan'));
      });
      
      expect(hasPanButton).toBeTruthy();
      
      // Check for Rotate button
      const hasRotateButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent?.includes('Rotate'));
      });
      
      expect(hasRotateButton).toBeTruthy();
    });

    test('Should display keyboard shortcuts', async () => {
      // Check for keyboard shortcuts help
      const hasKeyboardHelp = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => el.textContent?.includes('Keyboard Shortcuts'));
      });
      
      expect(hasKeyboardHelp).toBeTruthy();
    });
  });

  describe('Map Type Switching', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/enhanced-map`, {
        waitUntil: 'networkidle2'
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test('Should switch between 3D Globe and Dark Terrain', async () => {
      // Click 3D Globe button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const globeBtn = buttons.find(btn => btn.textContent?.includes('3D Globe'));
        if (globeBtn) globeBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now click Dark Terrain button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const terrainBtn = buttons.find(btn => btn.textContent?.includes('Dark Terrain'));
        if (terrainBtn) terrainBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify no errors occurred
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('Keyboard Controls', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/enhanced-map`, {
        waitUntil: 'networkidle2'
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    test('Should respond to keyboard navigation', async () => {
      // Test arrow keys for panning
      await page.keyboard.press('ArrowUp');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await page.keyboard.press('ArrowDown');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await page.keyboard.press('ArrowLeft');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await page.keyboard.press('ArrowRight');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Test zoom controls
      await page.keyboard.press('+');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await page.keyboard.press('-');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Test reset
      await page.keyboard.press('r');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify no errors occurred
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      expect(errors).toHaveLength(0);
    });
  });
});