const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration - testing both local and remote
const TEST_URLS = [
    { name: 'Local Development', url: 'http://localhost:3000/' },
    { name: 'Remote Production', url: 'http://137.220.61.218:3001/' }
];
const SCREENSHOT_DIR = './test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class ComprehensiveNetworkIntelligenceTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
    }

    async init() {
        console.log('🚀 Initializing comprehensive browser test...');
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--disable-extensions',
                '--ignore-certificate-errors',
                '--allow-running-insecure-content'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });
    }

    async testApplication(testConfig) {
        console.log(`\n🔍 Testing ${testConfig.name}: ${testConfig.url}`);
        console.log('='.repeat(60));
        
        const page = await this.browser.newPage();
        const result = {
            name: testConfig.name,
            url: testConfig.url,
            success: false,
            pageLoad: false,
            uiElements: false,
            tabsFound: [],
            tabsWorking: [],
            errors: [],
            screenshots: [],
            consoleErrors: [],
            performanceMetrics: null
        };

        // Listen for console errors
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const error = msg.text();
                console.log(`❌ Console Error: ${error}`);
                result.consoleErrors.push(error);
            }
        });

        // Listen for page errors
        page.on('pageerror', (error) => {
            const errorMsg = error.message;
            console.log(`❌ Page Error: ${errorMsg}`);
            result.errors.push(`Page Error: ${errorMsg}`);
        });

        try {
            // Load the page
            console.log('📄 Loading page...');
            const response = await page.goto(testConfig.url, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });

            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }

            result.pageLoad = true;
            console.log('✅ Page loaded successfully');

            // Wait for initial rendering
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Take initial screenshot
            const initialScreenshot = path.join(SCREENSHOT_DIR, `${testConfig.name.toLowerCase().replace(/\s+/g, '-')}-01-initial.png`);
            await page.screenshot({ path: initialScreenshot, fullPage: true });
            result.screenshots.push(initialScreenshot);
            console.log(`📸 Screenshot: ${initialScreenshot}`);

            // Check for application error
            const hasError = await page.evaluate(() => {
                const text = document.body.textContent || '';
                return text.includes('Application error') || text.includes('client-side exception');
            });

            if (hasError) {
                console.log('⚠️ Application error detected on page');
                result.errors.push('Application error detected');
            } else {
                console.log('✅ No application errors detected');
            }

            // Wait for React/Next.js to hydrate
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Check UI elements
            const uiAnalysis = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(t => t);
                const tabs = Array.from(document.querySelectorAll('[role="tab"], [data-value]')).map(tab => ({
                    text: tab.textContent?.trim(),
                    dataValue: tab.getAttribute('data-value'),
                    role: tab.getAttribute('role')
                }));
                
                // Look for any clickable elements that might be tabs
                const potentialTabs = Array.from(document.querySelectorAll('*')).filter(el => {
                    const text = el.textContent?.trim();
                    return text && (text === 'Analytics' || text === 'BI' || text === 'Controls') &&
                           (el.tagName === 'BUTTON' || el.getAttribute('role') === 'tab' || el.onclick);
                });

                return {
                    buttons,
                    tabs,
                    potentialTabs: potentialTabs.map(el => ({
                        tag: el.tagName,
                        text: el.textContent?.trim(),
                        className: el.className,
                        role: el.getAttribute('role'),
                        onClick: !!el.onclick
                    })),
                    hasGlobeText: document.body.textContent?.includes('Globe View') || false,
                    hasNetworkText: document.body.textContent?.includes('Network Graph') || false,
                    hasAnalyticsText: document.body.textContent?.includes('Analytics') || false,
                    hasBIText: document.body.textContent?.includes('BI') || false,
                    hasControlsText: document.body.textContent?.includes('Controls') || false,
                    totalElements: document.querySelectorAll('*').length
                };
            });

            console.log('🔍 UI Analysis:');
            console.log(`   - Total Elements: ${uiAnalysis.totalElements}`);
            console.log(`   - Buttons Found: ${uiAnalysis.buttons.length} (${uiAnalysis.buttons.join(', ')})`);
            console.log(`   - Potential Tabs: ${uiAnalysis.potentialTabs.length}`);
            console.log(`   - Has Globe Text: ${uiAnalysis.hasGlobeText}`);
            console.log(`   - Has Analytics Text: ${uiAnalysis.hasAnalyticsText}`);
            console.log(`   - Has BI Text: ${uiAnalysis.hasBIText}`);
            console.log(`   - Has Controls Text: ${uiAnalysis.hasControlsText}`);

            if (uiAnalysis.totalElements > 10 && (uiAnalysis.buttons.length > 0 || uiAnalysis.potentialTabs.length > 0)) {
                result.uiElements = true;
                console.log('✅ UI elements detected');
            }

            // Try to find and test tabs
            const tabNames = ['Analytics', 'BI', 'Controls'];
            for (const tabName of tabNames) {
                try {
                    console.log(`🔍 Looking for ${tabName} tab...`);
                    
                    const tabFound = await page.evaluate((name) => {
                        const elements = Array.from(document.querySelectorAll('*'));
                        for (const el of elements) {
                            const text = el.textContent?.trim();
                            if (text === name && (
                                el.tagName === 'BUTTON' || 
                                el.getAttribute('role') === 'tab' ||
                                el.getAttribute('data-value') === name.toLowerCase() ||
                                el.onclick ||
                                el.style.cursor === 'pointer'
                            )) {
                                return true;
                            }
                        }
                        return false;
                    }, tabName);

                    if (tabFound) {
                        result.tabsFound.push(tabName);
                        console.log(`✅ Found ${tabName} tab`);

                        // Try to click the tab
                        try {
                            await page.evaluate((name) => {
                                const elements = Array.from(document.querySelectorAll('*'));
                                for (const el of elements) {
                                    const text = el.textContent?.trim();
                                    if (text === name && (
                                        el.tagName === 'BUTTON' || 
                                        el.getAttribute('role') === 'tab' ||
                                        el.getAttribute('data-value') === name.toLowerCase() ||
                                        el.onclick
                                    )) {
                                        el.click();
                                        return true;
                                    }
                                }
                                return false;
                            }, tabName);

                            // Wait for tab content to load
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            // Take screenshot of tab
                            const tabScreenshot = path.join(SCREENSHOT_DIR, 
                                `${testConfig.name.toLowerCase().replace(/\s+/g, '-')}-02-${tabName.toLowerCase()}-tab.png`);
                            await page.screenshot({ path: tabScreenshot, fullPage: true });
                            result.screenshots.push(tabScreenshot);

                            result.tabsWorking.push(tabName);
                            console.log(`✅ ${tabName} tab clicked successfully`);

                            // Special check for BI tab and deck.gl errors
                            if (tabName === 'BI') {
                                await new Promise(resolve => setTimeout(resolve, 3000));
                                const deckGlErrors = result.consoleErrors.filter(error => 
                                    error.toLowerCase().includes('deck.gl') || 
                                    error.toLowerCase().includes('propsintransition') ||
                                    error.toLowerCase().includes('layer')
                                );

                                if (deckGlErrors.length === 0) {
                                    console.log('✅ No deck.gl errors found in BI tab');
                                } else {
                                    console.log(`⚠️ Found ${deckGlErrors.length} deck.gl related errors`);
                                }
                            }

                        } catch (clickError) {
                            console.log(`⚠️ Could not click ${tabName} tab: ${clickError.message}`);
                        }
                    } else {
                        console.log(`❌ ${tabName} tab not found`);
                    }
                } catch (tabError) {
                    console.log(`❌ Error testing ${tabName} tab: ${tabError.message}`);
                    result.errors.push(`${tabName} tab error: ${tabError.message}`);
                }
            }

            // Collect performance metrics
            try {
                result.performanceMetrics = await page.metrics();
                console.log('✅ Performance metrics collected');
            } catch (metricsError) {
                console.log(`⚠️ Could not collect metrics: ${metricsError.message}`);
            }

            // Final screenshot
            const finalScreenshot = path.join(SCREENSHOT_DIR, 
                `${testConfig.name.toLowerCase().replace(/\s+/g, '-')}-03-final.png`);
            await page.screenshot({ path: finalScreenshot, fullPage: true });
            result.screenshots.push(finalScreenshot);

            // Determine overall success
            result.success = result.pageLoad && result.uiElements && result.tabsFound.length > 0;

        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
            result.errors.push(`Test failed: ${error.message}`);
            
            // Take error screenshot
            try {
                const errorScreenshot = path.join(SCREENSHOT_DIR, 
                    `${testConfig.name.toLowerCase().replace(/\s+/g, '-')}-error.png`);
                await page.screenshot({ path: errorScreenshot, fullPage: true });
                result.screenshots.push(errorScreenshot);
            } catch (screenshotError) {
                console.log(`⚠️ Could not take error screenshot`);
            }
        }

        await page.close();
        return result;
    }

    async runAllTests() {
        await this.init();

        for (const testConfig of TEST_URLS) {
            const result = await this.testApplication(testConfig);
            this.results.push(result);
        }

        await this.generateReport();
        await this.browser.close();
    }

    async generateReport() {
        console.log('\n📋 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(60));

        for (const result of this.results) {
            console.log(`\n🌐 ${result.name} (${result.url})`);
            console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Page Load: ${result.pageLoad ? '✅' : '❌'}`);
            console.log(`   UI Elements: ${result.uiElements ? '✅' : '❌'}`);
            console.log(`   Tabs Found: ${result.tabsFound.join(', ') || 'None'}`);
            console.log(`   Tabs Working: ${result.tabsWorking.join(', ') || 'None'}`);
            console.log(`   Console Errors: ${result.consoleErrors.length}`);
            console.log(`   Other Errors: ${result.errors.length}`);
            console.log(`   Screenshots: ${result.screenshots.length}`);

            if (result.performanceMetrics) {
                console.log(`   JS Heap Used: ${(result.performanceMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
            }

            // Check for deck.gl specific issues
            const deckGlErrors = result.consoleErrors.filter(error => 
                error.toLowerCase().includes('deck.gl') || 
                error.toLowerCase().includes('propsintransition')
            );

            if (result.tabsWorking.includes('BI')) {
                if (deckGlErrors.length === 0) {
                    console.log('   🎉 BI Tab: Working without deck.gl errors!');
                } else {
                    console.log(`   ⚠️ BI Tab: ${deckGlErrors.length} deck.gl errors found`);
                }
            }
        }

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.results.length,
                successfulTests: this.results.filter(r => r.success).length,
                failedTests: this.results.filter(r => !r.success).length
            },
            results: this.results
        };

        const reportPath = path.join(SCREENSHOT_DIR, 'comprehensive-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

        // Summary for deck.gl fix verification
        const biTabResults = this.results.filter(r => r.tabsWorking.includes('BI'));
        if (biTabResults.length > 0) {
            console.log('\n🎯 DECK.GL FIX VERIFICATION:');
            console.log('==========================');
            biTabResults.forEach(result => {
                const deckGlErrors = result.consoleErrors.filter(error => 
                    error.toLowerCase().includes('deck.gl') || 
                    error.toLowerCase().includes('propsintransition')
                );
                console.log(`${result.name}: ${deckGlErrors.length === 0 ? '✅ NO DECK.GL ERRORS' : `❌ ${deckGlErrors.length} DECK.GL ERRORS`}`);
            });
        }

        return report;
    }
}

// Run the comprehensive tests
async function main() {
    console.log('🧪 Starting Comprehensive Network Intelligence Platform Tests');
    console.log('Testing both local development and remote production environments');
    console.log('=' .repeat(80));
    
    const tester = new ComprehensiveNetworkIntelligenceTest();
    await tester.runAllTests();
}

main().catch(console.error);