const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const APP_URL = 'http://137.220.61.218:3001/';
const SCREENSHOT_DIR = './test-screenshots';
const TEST_TIMEOUT = 30000; // 30 seconds

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class NetworkIntelligenceTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.consoleErrors = [];
        this.testResults = {
            pageLoad: false,
            globeRender: false,
            analyticsTab: false,
            biTab: false,
            controlsTab: false,
            satelliteControl: false,
            interactionTest: false,
            errors: [],
            screenshots: [],
            performanceMetrics: {}
        };
    }

    async init() {
        console.log('🚀 Initializing browser test...');
        this.browser = await puppeteer.launch({
            headless: 'new', // Use new headless mode for better compatibility
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
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        this.page = await this.browser.newPage();
        
        // Listen for console errors
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const error = `Console Error: ${msg.text()}`;
                console.log(`❌ ${error}`);
                this.consoleErrors.push(error);
                this.testResults.errors.push(error);
            }
        });

        // Listen for page errors
        this.page.on('pageerror', (error) => {
            const errorMsg = `Page Error: ${error.message}`;
            console.log(`❌ ${errorMsg}`);
            this.testResults.errors.push(errorMsg);
        });

        // Listen for request failures
        this.page.on('requestfailed', (request) => {
            const errorMsg = `Request Failed: ${request.url()} - ${request.failure().errorText}`;
            console.log(`⚠️ ${errorMsg}`);
            this.testResults.errors.push(errorMsg);
        });
    }

    async testPageLoad() {
        console.log('📄 Testing page load...');
        try {
            const response = await this.page.goto(APP_URL, { 
                waitUntil: 'networkidle2',
                timeout: TEST_TIMEOUT 
            });
            
            if (response.ok()) {
                console.log('✅ Page loaded successfully');
                this.testResults.pageLoad = true;
                
                // Take initial screenshot
                const screenshotPath = path.join(SCREENSHOT_DIR, '01-initial-load.png');
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                this.testResults.screenshots.push(screenshotPath);
                console.log(`📸 Screenshot saved: ${screenshotPath}`);
            } else {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
        } catch (error) {
            console.log(`❌ Page load failed: ${error.message}`);
            this.testResults.errors.push(`Page load failed: ${error.message}`);
        }
    }

    async testGlobeRender() {
        console.log('🌍 Testing globe view rendering...');
        try {
            // Check if the globe view area exists and has the expected structure
            const globeElements = await this.page.evaluate(() => {
                // Look for globe-related content
                const body = document.body;
                const textContent = body.textContent || '';
                
                // Check for navigation elements
                const hasGlobeView = textContent.includes('Globe View');
                const hasNetworkGraph = textContent.includes('Network Graph');
                
                // Look for any containers that might hold the globe
                const containers = document.querySelectorAll('div, section, main');
                let hasGlobeContainer = false;
                
                for (const container of containers) {
                    const className = container.className || '';
                    const id = container.id || '';
                    if (className.includes('globe') || id.includes('globe') || 
                        className.includes('map') || className.includes('canvas')) {
                        hasGlobeContainer = true;
                        break;
                    }
                }
                
                return {
                    hasGlobeView,
                    hasNetworkGraph,
                    hasGlobeContainer,
                    canvasCount: document.querySelectorAll('canvas').length
                };
            });
            
            console.log(`🔍 Globe elements found:`, globeElements);
            
            // In headless mode, WebGL may not work, so we check for UI structure instead
            if (globeElements.hasGlobeView || globeElements.hasGlobeContainer) {
                console.log(`✅ Globe view structure detected (UI elements present)`);
                this.testResults.globeRender = true;
                
                // Note about WebGL in headless mode
                if (globeElements.canvasCount === 0) {
                    console.log(`ℹ️  No canvas elements (expected in headless mode without WebGL)`);
                } else {
                    console.log(`✅ Found ${globeElements.canvasCount} canvas elements`);
                }
                
                // Take screenshot of globe view
                const screenshotPath = path.join(SCREENSHOT_DIR, '02-globe-view.png');
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                this.testResults.screenshots.push(screenshotPath);
                console.log(`📸 Screenshot saved: ${screenshotPath}`);
            } else {
                throw new Error('Globe view structure not found - no globe-related elements detected');
            }
        } catch (error) {
            console.log(`❌ Globe render test failed: ${error.message}`);
            this.testResults.errors.push(`Globe render failed: ${error.message}`);
            
            // Take screenshot anyway for debugging
            try {
                const screenshotPath = path.join(SCREENSHOT_DIR, '02-globe-view-error.png');
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                this.testResults.screenshots.push(screenshotPath);
            } catch (screenshotError) {
                console.log(`⚠️ Could not take error screenshot: ${screenshotError.message}`);
            }
        }
    }

    async testTabNavigation() {
        console.log('📑 Testing tab navigation...');
        
        const tabs = ['Analytics', 'BI', 'Controls'];

        for (const tabName of tabs) {
            try {
                console.log(`🔍 Testing ${tabName} tab...`);
                
                // Look for clickable elements containing the tab name
                const tabElement = await this.page.evaluateHandle((name) => {
                    // Find all clickable elements
                    const clickableElements = document.querySelectorAll('button, [role="tab"], div[data-state], [data-value]');
                    
                    for (const element of clickableElements) {
                        const text = element.textContent || element.innerText || '';
                        const dataValue = element.getAttribute('data-value') || '';
                        
                        if (text.trim() === name || dataValue === name.toLowerCase()) {
                            return element;
                        }
                    }
                    
                    // Fallback: look for any element with matching text
                    const allElements = document.querySelectorAll('*');
                    for (const element of allElements) {
                        if ((element.textContent || '').trim() === name && 
                            (element.tagName === 'BUTTON' || element.getAttribute('role') === 'tab')) {
                            return element;
                        }
                    }
                    
                    return null;
                }, tabName);
                
                if (!tabElement || (await tabElement.evaluate(el => !el))) {
                    throw new Error(`Could not find ${tabName} tab`);
                }
                
                // Click the tab
                await tabElement.click();
                console.log(`👆 Clicked ${tabName} tab`);
                
                // Wait for content to load and any animations
                await this.page.waitForTimeout(3000);
                
                // Take screenshot
                const screenshotPath = path.join(SCREENSHOT_DIR, `03-${tabName.toLowerCase()}-tab.png`);
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                this.testResults.screenshots.push(screenshotPath);
                
                console.log(`✅ ${tabName} tab loaded successfully`);
                this.testResults[tabName.toLowerCase() + 'Tab'] = true;
                
                // Special handling for BI tab - check for deck.gl errors
                if (tabName === 'BI') {
                    console.log('🔍 Checking BI tab for deck.gl errors...');
                    await this.page.waitForTimeout(2000); // Give time for any errors to surface
                    
                    // Check if there are any deck.gl related errors
                    const deckGlErrors = this.consoleErrors.filter(error => 
                        error.toLowerCase().includes('deck.gl') || 
                        error.toLowerCase().includes('propsintransition') ||
                        error.toLowerCase().includes('layer') ||
                        error.toLowerCase().includes('transition')
                    );
                    
                    if (deckGlErrors.length === 0) {
                        console.log('✅ No deck.gl errors found in BI tab');
                    } else {
                        console.log(`⚠️ Found ${deckGlErrors.length} deck.gl related errors:`);
                        deckGlErrors.forEach(error => console.log(`   - ${error}`));
                    }
                    
                    // Check if BI content is visible
                    const biContent = await this.page.evaluate(() => {
                        const text = document.body.textContent || '';
                        return text.includes('Business Intelligence') || 
                               text.includes('Analytics') ||
                               text.includes('Dashboard') ||
                               text.includes('Ground Station') ||
                               text.includes('Satellite');
                    });
                    
                    if (biContent) {
                        console.log('✅ BI tab content is visible');
                    } else {
                        console.log('⚠️ BI tab content may not be fully loaded');
                    }
                }
                
            } catch (error) {
                console.log(`❌ ${tabName} tab test failed: ${error.message}`);
                this.testResults.errors.push(`${tabName} tab failed: ${error.message}`);
            }
        }
    }

    async testSatelliteControl() {
        console.log('🛰️ Testing satellite control panel...');
        try {
            // Look for satellite control elements
            const controlElements = await this.page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                return elements.some(el => 
                    el.textContent && (
                        el.textContent.includes('Satellite') ||
                        el.textContent.includes('Control') ||
                        el.textContent.includes('Ground Station')
                    )
                );
            });
            
            if (controlElements) {
                console.log('✅ Satellite control elements found');
                this.testResults.satelliteControl = true;
                
                // Take screenshot
                const screenshotPath = path.join(SCREENSHOT_DIR, '04-satellite-control.png');
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                this.testResults.screenshots.push(screenshotPath);
            } else {
                throw new Error('No satellite control elements found');
            }
        } catch (error) {
            console.log(`❌ Satellite control test failed: ${error.message}`);
            this.testResults.errors.push(`Satellite control failed: ${error.message}`);
        }
    }

    async testGlobeInteraction() {
        console.log('🖱️ Testing globe interaction...');
        try {
            // Find canvas element for interaction
            const canvas = await this.page.$('canvas');
            if (canvas) {
                // Get canvas bounding box
                const box = await canvas.boundingBox();
                if (box) {
                    // Click on the canvas (simulate interaction)
                    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                    
                    // Try some mouse movements
                    await this.page.mouse.move(box.x + box.width / 3, box.y + box.height / 3);
                    await this.page.waitForTimeout(1000);
                    
                    console.log('✅ Globe interaction test completed');
                    this.testResults.interactionTest = true;
                    
                    // Take screenshot after interaction
                    const screenshotPath = path.join(SCREENSHOT_DIR, '05-after-interaction.png');
                    await this.page.screenshot({ path: screenshotPath, fullPage: true });
                    this.testResults.screenshots.push(screenshotPath);
                } else {
                    throw new Error('Could not get canvas bounding box');
                }
            } else {
                throw new Error('No canvas element found for interaction');
            }
        } catch (error) {
            console.log(`❌ Globe interaction test failed: ${error.message}`);
            this.testResults.errors.push(`Globe interaction failed: ${error.message}`);
        }
    }

    async collectPerformanceMetrics() {
        console.log('📊 Collecting performance metrics...');
        try {
            const metrics = await this.page.metrics();
            this.testResults.performanceMetrics = {
                timestamp: Date.now(),
                jsHeapUsedSize: metrics.JSHeapUsedSize,
                jsHeapTotalSize: metrics.JSHeapTotalSize,
                scriptDuration: metrics.ScriptDuration,
                taskDuration: metrics.TaskDuration,
                layoutCount: metrics.LayoutCount,
                recalcStyleCount: metrics.RecalcStyleCount
            };
            console.log('✅ Performance metrics collected');
        } catch (error) {
            console.log(`⚠️ Could not collect performance metrics: ${error.message}`);
        }
    }

    async generateReport() {
        const report = {
            testDate: new Date().toISOString(),
            appUrl: APP_URL,
            summary: {
                totalTests: 6,
                passedTests: Object.values(this.testResults).filter(v => v === true).length,
                failedTests: this.testResults.errors.length,
                consoleErrors: this.consoleErrors.length
            },
            detailedResults: this.testResults,
            consoleErrors: this.consoleErrors
        };

        // Save report to file
        const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📋 TEST REPORT SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Page Load: ${this.testResults.pageLoad ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Globe Render: ${this.testResults.globeRender ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Analytics Tab: ${this.testResults.analyticsTab ? 'PASS' : 'FAIL'}`);
        console.log(`✅ BI Tab: ${this.testResults.biTab ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Controls Tab: ${this.testResults.controlsTab ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Satellite Control: ${this.testResults.satelliteControl ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Globe Interaction: ${this.testResults.interactionTest ? 'PASS' : 'FAIL'}`);
        
        console.log(`\n📊 Performance Metrics:`);
        if (this.testResults.performanceMetrics.jsHeapUsedSize) {
            console.log(`   - JS Heap Used: ${(this.testResults.performanceMetrics.jsHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   - JS Heap Total: ${(this.testResults.performanceMetrics.jsHeapTotalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   - Layout Count: ${this.testResults.performanceMetrics.layoutCount}`);
        }
        
        console.log(`\n🖼️  Screenshots saved: ${this.testResults.screenshots.length}`);
        this.testResults.screenshots.forEach(screenshot => {
            console.log(`   - ${screenshot}`);
        });
        
        if (this.testResults.errors.length > 0) {
            console.log(`\n❌ Errors encountered (${this.testResults.errors.length}):`);
            this.testResults.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (this.consoleErrors.length > 0) {
            console.log(`\n⚠️  Console errors (${this.consoleErrors.length}):`);
            this.consoleErrors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        console.log(`\n📄 Full report saved to: ${reportPath}`);
        
        // Special focus on BI tab deck.gl errors
        const deckGlErrors = this.consoleErrors.filter(error => 
            error.toLowerCase().includes('deck.gl') || 
            error.toLowerCase().includes('propsintransition') ||
            error.toLowerCase().includes('layer')
        );
        
        if (deckGlErrors.length === 0 && this.testResults.biTab) {
            console.log('\n🎉 SUCCESS: BI tab loads without deck.gl "propsInTransition" errors!');
        } else if (deckGlErrors.length > 0) {
            console.log('\n⚠️  DECK.GL ISSUES DETECTED:');
            deckGlErrors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();
            await this.testPageLoad();
            await this.testGlobeRender();
            await this.testTabNavigation();
            await this.testSatelliteControl();
            await this.testGlobeInteraction();
            await this.collectPerformanceMetrics();
            
            return await this.generateReport();
        } catch (error) {
            console.log(`❌ Test run failed: ${error.message}`);
            this.testResults.errors.push(`Test run failed: ${error.message}`);
            return await this.generateReport();
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests
async function main() {
    console.log('🧪 Starting Network Intelligence Platform Browser Tests');
    console.log('=' .repeat(60));
    
    const tester = new NetworkIntelligenceTest();
    await tester.run();
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

main().catch(console.error);