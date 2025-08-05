const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const APP_URL = 'http://localhost:3000/';
const SCREENSHOT_DIR = './test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function manualVerificationTest() {
    console.log('🔍 Manual Verification Test for Network Intelligence Platform');
    console.log('='.repeat(70));
    
    console.log('📋 Testing Strategy:');
    console.log('   - Since WebGL is not available in headless mode, we will:');
    console.log('   - 1. Test page loading and basic structure');
    console.log('   - 2. Simulate the WebGL error scenario');
    console.log('   - 3. Verify error handling and graceful degradation');
    console.log('   - 4. Test UI components that don\'t require WebGL');
    console.log('   - 5. Create comprehensive report for manual browser testing');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--disable-extensions',
            '--ignore-certificate-errors'
        ],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Capture detailed console information
    const allMessages = [];
    page.on('console', (msg) => {
        const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
        allMessages.push(message);
        if (msg.type() === 'error') {
            console.log(`❌ ${message}`);
        }
    });

    const pageErrors = [];
    page.on('pageerror', (error) => {
        const errorMsg = `PAGE ERROR: ${error.message}`;
        pageErrors.push(errorMsg);
        console.log(`❌ ${errorMsg}`);
    });

    try {
        console.log('\n🌐 Loading application...');
        const response = await page.goto(APP_URL, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        console.log(`📊 HTTP Status: ${response.status()}`);
        
        // Wait for page to attempt loading
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Take screenshot of current state
        await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, 'manual-verification-state.png'), 
            fullPage: true 
        });

        // Analyze the page state
        const pageState = await page.evaluate(() => {
            const body = document.body;
            const text = body.textContent || '';
            
            return {
                hasRuntimeError: text.includes('Runtime Error') || text.includes('Unhandled Runtime Error'),
                hasWebGLError: text.includes('WebGL') || text.includes('webglcontextcreationerror'),
                hasApplicationError: text.includes('Application error'),
                pageTitle: document.title,
                bodyTextLength: text.length,
                bodyTextPreview: text.substring(0, 500),
                hasNextJSContent: text.includes('__next_f') || text.includes('Next.js'),
                visibleElementsCount: document.querySelectorAll('*').length,
                hasTabElements: !!document.querySelector('[role="tab"], [data-value]'),
                tabButtonsVisible: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t && (t.includes('Analytics') || t.includes('BI') || t.includes('Controls'))),
                errorDetails: {
                    hasError: text.includes('error'),
                    errorType: text.includes('WebGL') ? 'WebGL' : 
                              text.includes('Runtime Error') ? 'Runtime' :
                              text.includes('Application error') ? 'Application' : 'Unknown'
                }
            };
        });

        console.log('\n📊 Page Analysis:');
        console.log(`   Title: "${pageState.pageTitle}"`);
        console.log(`   Elements Count: ${pageState.visibleElementsCount}`);
        console.log(`   Text Length: ${pageState.bodyTextLength} characters`);
        console.log(`   Has Runtime Error: ${pageState.hasRuntimeError}`);
        console.log(`   Has WebGL Error: ${pageState.hasWebGLError}`);
        console.log(`   Has Application Error: ${pageState.hasApplicationError}`);
        console.log(`   Has Tab Elements: ${pageState.hasTabElements}`);
        console.log(`   Tab Buttons Found: ${JSON.stringify(pageState.tabButtonsVisible)}`);
        console.log(`   Error Type: ${pageState.errorDetails.errorType}`);

        // Check WebGL specific errors in console
        const webglErrors = allMessages.filter(msg => 
            msg.toLowerCase().includes('webgl') || 
            msg.toLowerCase().includes('deck.gl') ||
            msg.toLowerCase().includes('propsintransition')
        );

        console.log(`\n🔍 WebGL/Deck.gl Related Messages: ${webglErrors.length}`);
        webglErrors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });

        // Generate verification report
        const verificationReport = {
            timestamp: new Date().toISOString(),
            testEnvironment: 'Headless Browser (No WebGL Support)',
            applicationUrl: APP_URL,
            pageState,
            allMessages: allMessages.slice(0, 50), // Limit to prevent huge logs
            pageErrors,
            webglErrors,
            testResults: {
                pageLoads: response.ok(),
                handlesWebGLError: pageState.hasWebGLError && pageState.visibleElementsCount > 10,
                showsErrorPage: pageState.hasRuntimeError || pageState.hasApplicationError,
                gracefulDegradation: pageState.visibleElementsCount > 50 && !pageState.hasRuntimeError
            },
            recommendations: []
        };

        // Generate recommendations
        if (pageState.hasWebGLError) {
            verificationReport.recommendations.push({
                type: 'WebGL Error Handling',
                message: 'Application encounters WebGL errors in headless environments. Consider adding WebGL availability detection and fallback UI.',
                priority: 'High'
            });
        }

        if (pageState.tabButtonsVisible.length === 0) {
            verificationReport.recommendations.push({
                type: 'Tab Navigation',
                message: 'Tab buttons (Analytics, BI, Controls) are not visible. This may be due to the WebGL error preventing proper React hydration.',
                priority: 'High'
            });
        }

        if (pageState.visibleElementsCount < 50) {
            verificationReport.recommendations.push({
                type: 'Component Loading',
                message: 'Low element count suggests components may not be loading properly. Check for JavaScript errors preventing component rendering.',
                priority: 'High'
            });
        }

        // Save report
        const reportPath = path.join(SCREENSHOT_DIR, 'manual-verification-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));

        console.log('\n📋 VERIFICATION SUMMARY:');
        console.log('='.repeat(50));
        console.log(`✅ Page Loads: ${verificationReport.testResults.pageLoads}`);
        console.log(`⚠️  Handles WebGL Error: ${verificationReport.testResults.handlesWebGLError}`);
        console.log(`⚠️  Shows Error Page: ${verificationReport.testResults.showsErrorPage}`);
        console.log(`⚠️  Graceful Degradation: ${verificationReport.testResults.gracefulDegradation}`);

        console.log('\n🎯 MANUAL TESTING INSTRUCTIONS:');
        console.log('='.repeat(50));
        console.log('To properly verify the deck.gl fix, please test manually with:');
        console.log('');
        console.log('1. Open a browser with WebGL support (Chrome, Firefox, Safari)');
        console.log(`2. Navigate to: ${APP_URL}`);
        console.log('3. Verify the following:');
        console.log('   ✓ Page loads without "Runtime Error" messages');
        console.log('   ✓ Globe view renders (may show WebGL context error in console but should not crash)');
        console.log('   ✓ Analytics, BI, and Controls tabs are visible and clickable');
        console.log('   ✓ BI tab loads without deck.gl "propsInTransition" errors');
        console.log('   ✓ Tab switching works smoothly');
        console.log('   ✓ Business Intelligence dashboard displays data');
        console.log('   ✓ No JavaScript crashes when clicking between tabs');
        console.log('');
        console.log('4. Check browser console for:');
        console.log('   ❌ Should NOT see: "propsInTransition" errors');
        console.log('   ❌ Should NOT see: React component crashes');
        console.log('   ❌ Should NOT see: "Unhandled Runtime Error"');
        console.log('   ✅ OK to see: WebGL context creation warnings');

        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        console.log(`📸 Screenshot saved to: ${path.join(SCREENSHOT_DIR, 'manual-verification-state.png')}`);

        // Specific deck.gl fix verification
        console.log('\n🔧 DECK.GL FIX VERIFICATION:');
        console.log('='.repeat(50));
        
        if (webglErrors.some(err => err.includes('propsInTransition'))) {
            console.log('❌ FOUND deck.gl "propsInTransition" errors - fix may not be complete');
        } else {
            console.log('✅ No "propsInTransition" errors detected in this test environment');
        }
        
        console.log('\nNote: This headless test cannot fully verify WebGL rendering.');
        console.log('The WebGL context error is expected in headless mode.');
        console.log('Manual browser testing is required for complete verification.');

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        
        try {
            await page.screenshot({ 
                path: path.join(SCREENSHOT_DIR, 'manual-verification-error.png'), 
                fullPage: true 
            });
        } catch (screenshotError) {
            console.log(`⚠️ Could not take error screenshot`);
        }
    }

    await browser.close();
}

manualVerificationTest().catch(console.error);