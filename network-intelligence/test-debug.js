const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const APP_URL = 'http://137.220.61.218:3001/';
const SCREENSHOT_DIR = './test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function debugApplication() {
    console.log('🔍 Starting detailed debug analysis...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
        ],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    // Capture all console messages
    const consoleMessages = [];
    page.on('console', (msg) => {
        const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
        console.log(message);
        consoleMessages.push(message);
    });

    // Capture page errors
    const pageErrors = [];
    page.on('pageerror', (error) => {
        const errorMsg = `PAGE ERROR: ${error.message}`;
        console.log(errorMsg);
        pageErrors.push(errorMsg);
    });

    // Capture request failures
    const requestFailures = [];
    page.on('requestfailed', (request) => {
        const errorMsg = `REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`;
        console.log(errorMsg);
        requestFailures.push(errorMsg);
    });

    try {
        console.log(`📄 Loading ${APP_URL}...`);
        const response = await page.goto(APP_URL, { 
            waitUntil: 'networkidle0',
            timeout: 60000 
        });
        
        console.log(`📊 Response status: ${response.status()}`);
        console.log(`📊 Response headers:`, response.headers());
        
        // Wait for any initial JS to execute
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Take screenshot of initial state
        await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, 'debug-initial.png'), 
            fullPage: true 
        });
        
        // Get page content analysis
        const pageAnalysis = await page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;
            
            return {
                title: document.title,
                url: window.location.href,
                bodyText: body.textContent ? body.textContent.substring(0, 500) : 'No body text',
                hasReactRoot: !!document.querySelector('#__next, [data-reactroot], #root'),
                scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline').slice(0, 10),
                stylesheets: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href),
                divCount: document.querySelectorAll('div').length,
                bodyClasses: body.className,
                metaTags: Array.from(document.querySelectorAll('meta')).map(m => ({
                    name: m.name,
                    content: m.content,
                    property: m.property
                })).slice(0, 10),
                hasErrorMessage: body.textContent && body.textContent.includes('error'),
                hasNextJsError: body.textContent && body.textContent.includes('Application error'),
                visibleButtons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t),
                visibleText: body.textContent ? body.textContent.trim().substring(0, 1000) : ''
            };
        });
        
        console.log('\n📋 PAGE ANALYSIS:');
        console.log('================');
        console.log(`Title: ${pageAnalysis.title}`);
        console.log(`URL: ${pageAnalysis.url}`);
        console.log(`Has React Root: ${pageAnalysis.hasReactRoot}`);
        console.log(`Div Count: ${pageAnalysis.divCount}`);
        console.log(`Body Classes: ${pageAnalysis.bodyClasses}`);
        console.log(`Has Error Message: ${pageAnalysis.hasErrorMessage}`);
        console.log(`Has Next.js Error: ${pageAnalysis.hasNextJsError}`);
        console.log('Visible Buttons:', pageAnalysis.visibleButtons);
        console.log('\nVisible Text Preview:');
        console.log(pageAnalysis.visibleText);
        
        // Try to wait for the app to fully load by looking for specific elements
        console.log('\n🔍 Waiting for application elements...');
        
        try {
            // Wait for either the main app content or an error state
            await Promise.race([
                page.waitForSelector('button', { timeout: 10000 }),
                page.waitForSelector('[data-testid]', { timeout: 10000 }),
                page.waitForSelector('.error, .loading', { timeout: 10000 })
            ]);
            
            // Take another screenshot after waiting
            await page.screenshot({ 
                path: path.join(SCREENSHOT_DIR, 'debug-after-wait.png'), 
                fullPage: true 
            });
            
        } catch (waitError) {
            console.log(`⚠️ Wait timeout: ${waitError.message}`);
        }
        
        // Final analysis
        const finalAnalysis = await page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            const clickableElements = allElements.filter(el => 
                el.tagName === 'BUTTON' || 
                el.getAttribute('role') === 'tab' ||
                el.onclick ||
                el.style.cursor === 'pointer'
            );
            
            return {
                totalElements: allElements.length,
                clickableElements: clickableElements.map(el => ({
                    tag: el.tagName,
                    text: el.textContent?.trim().substring(0, 50),
                    role: el.getAttribute('role'),
                    id: el.id,
                    className: el.className
                })).slice(0, 20),
                hasAnalyticsText: document.body.textContent && document.body.textContent.includes('Analytics'),
                hasBIText: document.body.textContent && document.body.textContent.includes('BI'),
                hasControlsText: document.body.textContent && document.body.textContent.includes('Controls')
            };
        });
        
        console.log('\n📊 FINAL ANALYSIS:');
        console.log('==================');
        console.log(`Total Elements: ${finalAnalysis.totalElements}`);
        console.log(`Has Analytics Text: ${finalAnalysis.hasAnalyticsText}`);
        console.log(`Has BI Text: ${finalAnalysis.hasBIText}`);
        console.log(`Has Controls Text: ${finalAnalysis.hasControlsText}`);
        console.log('\nClickable Elements:');
        finalAnalysis.clickableElements.forEach((el, i) => {
            console.log(`  ${i + 1}. ${el.tag} - "${el.text}" (role: ${el.role}, class: ${el.className})`);
        });
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            url: APP_URL,
            pageAnalysis,
            finalAnalysis,
            consoleMessages,
            pageErrors,
            requestFailures
        };
        
        fs.writeFileSync(
            path.join(SCREENSHOT_DIR, 'debug-report.json'), 
            JSON.stringify(report, null, 2)
        );
        
        console.log(`\n📄 Debug report saved to: ${path.join(SCREENSHOT_DIR, 'debug-report.json')}`);
        
    } catch (error) {
        console.log(`❌ Debug failed: ${error.message}`);
        
        // Take error screenshot
        try {
            await page.screenshot({ 
                path: path.join(SCREENSHOT_DIR, 'debug-error.png'), 
                fullPage: true 
            });
        } catch (screenshotError) {
            console.log(`⚠️ Could not take error screenshot: ${screenshotError.message}`);
        }
    }
    
    await browser.close();
}

// Run debug
debugApplication().catch(console.error);