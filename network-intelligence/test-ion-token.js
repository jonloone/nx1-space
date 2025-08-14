const puppeteer = require('puppeteer');

async function testIonToken() {
  console.log('🔑 Testing Cesium Ion Token Configuration...\n');
  
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
  
  const networkRequests = [];
  const ionRequests = [];
  const tokenUsages = [];
  
  // Monitor network requests
  page.on('request', request => {
    const url = request.url();
    
    // Track all Cesium Ion API requests
    if (url.includes('api.cesium.com') || url.includes('assets.ion.cesium.com')) {
      ionRequests.push({
        url: url,
        method: request.method(),
        headers: request.headers()
      });
    }
    
    // Check for token in URL
    if (url.includes('access_token=')) {
      const tokenMatch = url.match(/access_token=([^&]+)/);
      if (tokenMatch) {
        tokenUsages.push({
          url: url.substring(0, 100) + '...',
          token: tokenMatch[1].substring(0, 20) + '...'
        });
      }
    }
  });
  
  // Monitor responses
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('api.cesium.com') || url.includes('assets.ion.cesium.com')) {
      networkRequests.push({
        url: url.substring(0, 100) + '...',
        status: status,
        statusText: response.statusText()
      });
    }
  });
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Ion') || text.includes('token') || text.includes('403') || text.includes('401')) {
      console.log(`📝 ${msg.type().toUpperCase()}: ${text}`);
    }
  });
  
  try {
    console.log('🌐 Loading page...');
    await page.goto('http://localhost:3001/enhanced-map', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for any Ion requests to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if token is configured in the page
    const tokenInfo = await page.evaluate(() => {
      return {
        hasToken: typeof window.Cesium !== 'undefined' && !!window.Cesium.Ion.defaultAccessToken,
        tokenLength: typeof window.Cesium !== 'undefined' && window.Cesium.Ion.defaultAccessToken ? 
                     window.Cesium.Ion.defaultAccessToken.length : 0,
        tokenPrefix: typeof window.Cesium !== 'undefined' && window.Cesium.Ion.defaultAccessToken ? 
                     window.Cesium.Ion.defaultAccessToken.substring(0, 20) + '...' : null,
        cesiumLoaded: typeof window.Cesium !== 'undefined',
        envToken: typeof process !== 'undefined' && process.env ? 
                  !!process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN : false
      };
    });
    
    console.log('\n📊 Token Configuration:');
    console.log('='.repeat(50));
    console.log('Cesium Loaded:', tokenInfo.cesiumLoaded ? '✅' : '❌');
    console.log('Token Configured:', tokenInfo.hasToken ? '✅' : '❌');
    console.log('Token Length:', tokenInfo.tokenLength);
    console.log('Token Preview:', tokenInfo.tokenPrefix || 'N/A');
    
    console.log('\n🌐 Cesium Ion API Requests:');
    console.log('='.repeat(50));
    if (ionRequests.length === 0) {
      console.log('⚠️  No Ion API requests detected');
    } else {
      ionRequests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.method} ${req.url.substring(0, 80)}...`);
      });
    }
    
    console.log('\n📡 Network Responses:');
    console.log('='.repeat(50));
    if (networkRequests.length === 0) {
      console.log('⚠️  No Ion API responses detected');
    } else {
      networkRequests.forEach((resp, i) => {
        const icon = resp.status === 200 ? '✅' : 
                    resp.status === 403 ? '🔒' : 
                    resp.status === 401 ? '🔑' : '❌';
        console.log(`${icon} ${resp.status} ${resp.statusText} - ${resp.url}`);
      });
    }
    
    console.log('\n🔐 Token Usage in Requests:');
    console.log('='.repeat(50));
    if (tokenUsages.length === 0) {
      console.log('⚠️  No token usage in URLs detected');
    } else {
      tokenUsages.forEach((usage, i) => {
        console.log(`${i + 1}. Token used: ${usage.token}`);
        console.log(`   URL: ${usage.url}`);
      });
    }
    
    // Check the actual token from environment
    console.log('\n🔍 Environment Check:');
    console.log('='.repeat(50));
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const tokenMatch = envContent.match(/NEXT_PUBLIC_CESIUM_ION_TOKEN=(.+)/);
      if (tokenMatch) {
        console.log('✅ Token found in .env.local');
        console.log('Token starts with:', tokenMatch[1].substring(0, 30) + '...');
        console.log('Token length:', tokenMatch[1].length);
        
        // Verify it's the token user provided
        const expectedTokenStart = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
        if (tokenMatch[1].startsWith(expectedTokenStart)) {
          console.log('✅ Token matches the one provided by user');
        } else {
          console.log('⚠️  Token doesn\'t match expected format');
        }
      } else {
        console.log('❌ Token not found in .env.local');
      }
    } else {
      console.log('❌ .env.local file not found');
    }
    
    // Analysis
    console.log('\n🎯 Analysis:');
    console.log('='.repeat(50));
    
    const has403Errors = networkRequests.some(r => r.status === 403);
    const has401Errors = networkRequests.some(r => r.status === 401);
    const hasSuccessfulRequests = networkRequests.some(r => r.status === 200);
    
    if (tokenInfo.hasToken && !has403Errors && !has401Errors) {
      console.log('✅ Token is properly configured and working');
    } else if (tokenInfo.hasToken && has403Errors) {
      console.log('⚠️  Token is configured but getting 403 errors - token may be invalid or expired');
    } else if (tokenInfo.hasToken && has401Errors) {
      console.log('⚠️  Token is configured but getting 401 errors - authentication failing');
    } else if (!tokenInfo.hasToken) {
      console.log('❌ Token is not being set in Cesium.Ion.defaultAccessToken');
    }
    
    if (ionRequests.length === 0 && networkRequests.length === 0) {
      console.log('ℹ️  No Ion API requests made - app may be using fallback providers');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-screenshots/ion-token-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: test-screenshots/ion-token-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testIonToken().catch(console.error);