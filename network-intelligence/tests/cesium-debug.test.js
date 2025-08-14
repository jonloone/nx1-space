const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://137.220.61.218:3001';
const SCREENSHOT_DIR = path.join(__dirname, '../test-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

describe('CesiumJS Globe Debug Tests', () => {
  let browser;
  let page;
  let consoleMessages = [];
  let errors = [];

  beforeAll(async () => {
    console.log('🚀 Starting Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode that supports WebGL
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--use-gl=swiftshader', // Use software WebGL renderer
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--enable-webgl',
        '--enable-webgl2',
        '--ignore-gpu-blocklist'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    consoleMessages = [];
    errors = [];

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      
      if (type === 'error') {
        errors.push(text);
        console.log('❌ Console Error:', text);
      } else if (type === 'warning') {
        console.log('⚠️ Console Warning:', text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(error.toString());
      console.log('💥 Page Error:', error.toString());
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      const failure = request.failure();
      if (failure) {
        errors.push(`Request failed: ${request.url()} - ${failure.errorText}`);
        console.log('🔴 Request Failed:', request.url(), failure.errorText);
      }
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Enhanced Map page loads without console errors', async () => {
    console.log('\n📍 Testing: /enhanced-map');
    
    try {
      // Navigate to page
      const response = await page.goto(`${BASE_URL}/enhanced-map`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Check response status
      expect(response.status()).toBe(200);
      console.log('✅ Page loaded with status:', response.status());

      // Take initial screenshot
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '01-initial-load.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 01-initial-load.png');

      // Wait for Cesium to initialize
      console.log('⏳ Waiting for Cesium to initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if Cesium viewer exists
      const hasCesium = await page.evaluate(() => {
        return typeof window.Cesium !== 'undefined';
      });
      console.log('🌍 Cesium loaded:', hasCesium);

      // Take screenshot after Cesium loads
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '02-cesium-loaded.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 02-cesium-loaded.png');

      // Check for viewer initialization
      const viewerInfo = await page.evaluate(() => {
        if (window.debugCesium && window.debugCesium.viewer) {
          const viewer = window.debugCesium.viewer;
          return {
            exists: true,
            hasScene: !!viewer.scene,
            hasCamera: !!viewer.camera,
            hasEntities: viewer.entities.values.length
          };
        }
        return { exists: false };
      });
      console.log('🔍 Viewer info:', viewerInfo);

      // Get ground station info
      const stationInfo = await page.evaluate(() => {
        if (window.debugCesium && window.debugCesium.stations) {
          return {
            count: window.debugCesium.stations.length,
            sample: window.debugCesium.stations.slice(0, 3).map(s => ({
              name: s.name,
              position: s.position
            }))
          };
        }
        return null;
      });
      console.log('📍 Station info:', stationInfo);

      // Report errors
      console.log('\n📊 Console Error Summary:');
      if (errors.length === 0) {
        console.log('✅ No console errors detected!');
      } else {
        console.log(`❌ Found ${errors.length} errors:`);
        errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }

      // Check for specific Cesium errors
      const cesiumErrors = errors.filter(e => 
        e.includes('Cesium') || 
        e.includes('WebGL') || 
        e.includes('CESIUM_BASE_URL')
      );
      
      if (cesiumErrors.length > 0) {
        console.log('\n🔴 Cesium-specific errors detected:');
        cesiumErrors.forEach(e => console.log(`   - ${e}`));
      }

      // Expect no errors
      expect(errors.length).toBe(0);

    } catch (error) {
      console.error('❌ Test failed:', error);
      
      // Take error screenshot
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'error-state.png'),
        fullPage: true 
      });
      
      throw error;
    }
  }, 60000);

  test('Globe view renders without errors', async () => {
    console.log('\n📍 Testing: Globe View Rendering');
    
    try {
      await page.goto(`${BASE_URL}/enhanced-map`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for Cesium initialization
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for WebGL context
      const webglInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          return {
            hasCanvas: true,
            hasWebGL: !!gl,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
          };
        }
        return { hasCanvas: false };
      });
      console.log('🎨 WebGL info:', webglInfo);

      // Test coordinate system
      const coordinateTest = await page.evaluate(() => {
        if (window.debugCesium && window.debugCesium.testCoordinate) {
          // Test Washington DC coordinates
          window.debugCesium.testCoordinate(-77.0369, 38.9072, 'Washington DC');
          return true;
        }
        return false;
      });
      console.log('🗺️ Coordinate test executed:', coordinateTest);

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot of coordinate test
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, '03-coordinate-test.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved: 03-coordinate-test.png');

      // Check for rendering errors
      const renderingErrors = errors.filter(e => 
        e.includes('WebGL') || 
        e.includes('render') || 
        e.includes('GL_')
      );

      if (renderingErrors.length > 0) {
        console.log('🔴 Rendering errors detected:');
        renderingErrors.forEach(e => console.log(`   - ${e}`));
      }

      expect(renderingErrors.length).toBe(0);

    } catch (error) {
      console.error('❌ Globe view test failed:', error);
      throw error;
    }
  }, 60000);

  test('Check for specific common Cesium issues', async () => {
    console.log('\n📍 Testing: Common Cesium Issues');
    
    await page.goto(`${BASE_URL}/enhanced-map`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check for common issues
    const diagnostics = await page.evaluate(() => {
      const issues = [];

      // Check CESIUM_BASE_URL
      if (typeof window.CESIUM_BASE_URL === 'undefined') {
        issues.push('CESIUM_BASE_URL not defined');
      } else {
        console.log('CESIUM_BASE_URL:', window.CESIUM_BASE_URL);
      }

      // Check Cesium object
      if (typeof window.Cesium === 'undefined') {
        issues.push('Cesium not loaded');
      }

      // Check for Ion token
      if (window.Cesium && !window.Cesium.Ion.defaultAccessToken) {
        issues.push('Cesium Ion token not set');
      }

      // Check for viewer
      const viewerDiv = document.querySelector('.cesium-viewer');
      if (!viewerDiv) {
        issues.push('No Cesium viewer div found');
      }

      // Check for WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (!gl) {
        issues.push('WebGL not supported');
      }

      return {
        issues,
        hasCesium: typeof window.Cesium !== 'undefined',
        hasViewer: !!viewerDiv,
        hasWebGL: !!gl,
        cesiumBaseUrl: window.CESIUM_BASE_URL
      };
    });

    console.log('🔍 Diagnostics:', diagnostics);

    if (diagnostics.issues.length > 0) {
      console.log('⚠️ Issues found:');
      diagnostics.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Log all console messages for debugging
    console.log('\n📋 All Console Messages:');
    consoleMessages.forEach(msg => {
      if (msg.type === 'error' || msg.type === 'warning') {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      }
    });

    expect(diagnostics.issues.length).toBe(0);
  }, 60000);
});

// Run the tests
if (require.main === module) {
  const { exec } = require('child_process');
  
  console.log('🧪 Running CesiumJS Debug Tests...\n');
  
  exec('npx jest --config jest.e2e.config.js tests/cesium-debug.test.js --verbose', (error, stdout, stderr) => {
    console.log(stdout);
    if (stderr) console.error(stderr);
    if (error) {
      console.error('Test execution failed:', error);
      process.exit(1);
    }
  });
}