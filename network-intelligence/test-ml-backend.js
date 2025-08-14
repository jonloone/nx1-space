#!/usr/bin/env node

/**
 * Comprehensive ML Backend Testing Script
 * 
 * Tests the Python ML backend service end-to-end including:
 * - Service health check
 * - Model training with ground station data
 * - Prediction with SHAP explanations
 * - Feature importance analysis
 * - TypeScript client integration
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Test configuration
const ML_SERVICE_URL = 'http://localhost:8000';
const ML_SERVICE_TIMEOUT = 30000;
const PYTHON_ENV = 'venv'; // Virtual environment name

// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, colors.green);
}

function error(message) {
    log(`❌ ${message}`, colors.red);
}

function warning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

function step(message) {
    log(`\n🔄 ${message}`, colors.cyan);
}

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
};

function recordTest(testName, passed, message = '') {
    if (passed) {
        testResults.passed++;
        success(`${testName}: PASSED ${message}`);
    } else {
        testResults.failed++;
        error(`${testName}: FAILED ${message}`);
    }
    testResults.details.push({ testName, passed, message });
}

// HTTP request helper
async function makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ML_SERVICE_TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Test ML service health
async function testServiceHealth() {
    step('Testing ML service health...');
    
    try {
        const response = await makeRequest(`${ML_SERVICE_URL}/health`);
        
        if (response.ok) {
            const health = await response.json();
            recordTest('Service Health', true, `Status: ${health.status}`);
            info(`Model loaded: ${health.model_loaded}`);
            info(`Uptime: ${health.uptime_seconds.toFixed(1)}s`);
            info(`Memory: ${health.memory_usage_mb.toFixed(1)}MB`);
            return true;
        } else {
            recordTest('Service Health', false, `HTTP ${response.status}`);
            return false;
        }
    } catch (error) {
        recordTest('Service Health', false, error.message);
        return false;
    }
}

// Load ground station data for testing
function loadGroundStationData() {
    step('Loading ground station data...');
    
    const dataFiles = [
        './data/groundStations.ts',
        '../data/groundStations.ts',
        './data/ground_stations.json'
    ];
    
    for (const filePath of dataFiles) {
        try {
            if (fs.existsSync(filePath)) {
                info(`Found data file: ${filePath}`);
                
                if (filePath.endsWith('.json')) {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    success(`Loaded ${data.length} stations from JSON`);
                    return data;
                } else if (filePath.endsWith('.ts')) {
                    // For TypeScript files, use the training script to parse
                    info('TypeScript data file found, will use training script');
                    return null; // Will use training script
                }
            }
        } catch (error) {
            warning(`Failed to load ${filePath}: ${error.message}`);
        }
    }
    
    // Create sample data for testing
    warning('Using sample data for testing');
    return createSampleStationData();
}

function createSampleStationData() {
    return [
        {
            id: 'ses-betzdorf',
            name: 'Betzdorf, Luxembourg',
            operator: 'SES',
            latitude: 49.6755,
            longitude: 6.2663,
            country: 'Luxembourg',
            utilization: 92,
            revenue: 56.5,
            profit: 19.8,
            margin: 0.35,
            confidence: 0.95,
            satellitesVisible: 18,
            avgPassDuration: 45,
            dataCapacity: 180,
            isActive: true
        },
        {
            id: 'ses-princeton',
            name: 'Princeton, NJ',
            operator: 'SES',
            latitude: 40.3573,
            longitude: -74.6672,
            country: 'United States',
            utilization: 87,
            revenue: 52.5,
            profit: 15.8,
            margin: 0.30,
            confidence: 0.92,
            satellitesVisible: 18,
            avgPassDuration: 43,
            dataCapacity: 180,
            isActive: true
        },
        {
            id: 'viasat-san-diego',
            name: 'San Diego, CA',
            operator: 'Viasat',
            latitude: 32.7157,
            longitude: -117.1611,
            country: 'United States',
            utilization: 77,
            revenue: 41.5,
            profit: 8.3,
            margin: 0.20,
            confidence: 0.82,
            satellitesVisible: 15,
            avgPassDuration: 42,
            dataCapacity: 110,
            isActive: true
        },
        // Add more stations to reach minimum training requirement
        ...Array.from({ length: 12 }, (_, i) => ({
            id: `test-station-${i}`,
            name: `Test Station ${i}`,
            operator: i % 2 === 0 ? 'SES' : 'TestCorp',
            latitude: 40 + (i % 10) * 2,
            longitude: -100 + (i % 10) * 5,
            country: 'Test Country',
            utilization: 70 + (i % 30),
            revenue: 35 + (i % 20),
            profit: 5 + (i % 15),
            margin: 0.15 + (i % 20) * 0.01,
            confidence: 0.7 + (i % 3) * 0.1,
            satellitesVisible: 12 + (i % 8),
            avgPassDuration: 35 + (i % 15),
            dataCapacity: 80 + (i % 100),
            isActive: true
        }))
    ];
}

// Test model training
async function testModelTraining(stations) {
    step('Testing model training...');
    
    if (!stations || stations.length < 10) {
        recordTest('Model Training', false, 'Insufficient training data');
        return false;
    }
    
    const trainingRequest = {
        stations: stations,
        target_metric: 'profit',
        model_version: `test_${Date.now()}`
    };
    
    try {
        info(`Training with ${stations.length} stations...`);
        
        const response = await makeRequest(`${ML_SERVICE_URL}/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trainingRequest)
        });
        
        if (response.ok) {
            const result = await response.json();
            recordTest('Model Training', true, `Version: ${result.model_version}`);
            
            info(`Training duration: ${result.training_duration_seconds.toFixed(2)}s`);
            info(`Model performance: R² = ${result.model_performance.accuracy?.toFixed(3)}`);
            info(`Cross-validation: ${result.cross_validation_scores.map(s => s.toFixed(3)).join(', ')}`);
            
            // Display top features
            const topFeatures = Object.entries(result.feature_importance)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
            
            info('Top 5 features:');
            topFeatures.forEach(([feature, importance]) => {
                info(`  ${feature}: ${importance.toFixed(4)}`);
            });
            
            return result;
        } else {
            const errorText = await response.text();
            recordTest('Model Training', false, `HTTP ${response.status}: ${errorText}`);
            return false;
        }
    } catch (error) {
        recordTest('Model Training', false, error.message);
        return false;
    }
}

// Test prediction with SHAP explanations
async function testPrediction() {
    step('Testing prediction with SHAP explanations...');
    
    const predictionRequest = {
        latitude: 40.7128,
        longitude: -74.0060,
        maritimeDensity: 75,
        gdpPerCapita: 65000,
        populationDensity: 500,
        elevation: 50,
        competitorCount: 2,
        infrastructureScore: 0.9,
        weatherReliability: 0.8,
        regulatoryScore: 0.85
    };
    
    try {
        const response = await makeRequest(`${ML_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(predictionRequest)
        });
        
        if (response.ok) {
            const result = await response.json();
            recordTest('Prediction', true, `Score: ${result.prediction.toFixed(2)}`);
            
            info(`Prediction: ${result.prediction.toFixed(2)}`);
            info(`Confidence: ${(result.model_confidence * 100).toFixed(1)}%`);
            info(`Confidence interval: [${result.confidence_interval[0].toFixed(2)}, ${result.confidence_interval[1].toFixed(2)}]`);
            
            // Display SHAP explanations
            info('Top SHAP explanations:');
            result.shap_explanations.slice(0, 5).forEach(exp => {
                const impact = exp.shap_value > 0 ? '+' : '';
                info(`  ${exp.feature}: ${impact}${exp.shap_value.toFixed(4)} (${exp.impact_direction})`);
            });
            
            return result;
        } else {
            const errorText = await response.text();
            recordTest('Prediction', false, `HTTP ${response.status}: ${errorText}`);
            return false;
        }
    } catch (error) {
        recordTest('Prediction', false, error.message);
        return false;
    }
}

// Test model info endpoint
async function testModelInfo() {
    step('Testing model info endpoint...');
    
    try {
        const response = await makeRequest(`${ML_SERVICE_URL}/model/info`);
        
        if (response.ok) {
            const info = await response.json();
            recordTest('Model Info', true, `Features: ${info.n_features}`);
            
            info(`Model version: ${info.model_version}`);
            info(`Target: ${info.target_name}`);
            info(`Features: ${info.n_features}`);
            info(`Training time: ${info.training_timestamp}`);
            
            return info;
        } else {
            recordTest('Model Info', false, `HTTP ${response.status}`);
            return false;
        }
    } catch (error) {
        recordTest('Model Info', false, error.message);
        return false;
    }
}

// Test feature importance endpoint
async function testFeatureImportance() {
    step('Testing feature importance endpoint...');
    
    try {
        const response = await makeRequest(`${ML_SERVICE_URL}/model/feature-importance`);
        
        if (response.ok) {
            const importance = await response.json();
            recordTest('Feature Importance', true, `${Object.keys(importance).length} features`);
            
            // Display top features
            const sortedFeatures = Object.entries(importance)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8);
            
            info('Feature importance ranking:');
            sortedFeatures.forEach(([feature, imp], index) => {
                info(`  ${index + 1}. ${feature}: ${imp.toFixed(4)}`);
            });
            
            return importance;
        } else {
            recordTest('Feature Importance', false, `HTTP ${response.status}`);
            return false;
        }
    } catch (error) {
        recordTest('Feature Importance', false, error.message);
        return false;
    }
}

// Test batch predictions
async function testBatchPredictions() {
    step('Testing batch predictions...');
    
    const locations = [
        { lat: 51.5074, lon: -0.1278 }, // London
        { lat: 35.6762, lon: 139.6503 }, // Tokyo
        { lat: 1.3521, lon: 103.8198 }, // Singapore
    ];
    
    let successCount = 0;
    
    for (const [index, location] of locations.entries()) {
        try {
            const response = await makeRequest(`${ML_SERVICE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: location.lat,
                    longitude: location.lon
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                info(`Location ${index + 1}: Score ${result.prediction.toFixed(2)}, Confidence ${(result.model_confidence * 100).toFixed(1)}%`);
                successCount++;
            }
        } catch (error) {
            warning(`Failed to predict for location ${index + 1}: ${error.message}`);
        }
    }
    
    const passed = successCount === locations.length;
    recordTest('Batch Predictions', passed, `${successCount}/${locations.length} successful`);
    return passed;
}

// Test TypeScript client integration
async function testTypeScriptClient() {
    step('Testing TypeScript client integration...');
    
    try {
        // Check if the TypeScript client file exists and compiles
        const clientPath = './lib/services/ml-training-client.ts';
        
        if (!fs.existsSync(clientPath)) {
            recordTest('TypeScript Client', false, 'Client file not found');
            return false;
        }
        
        // Try to compile the TypeScript file
        try {
            execSync(`npx tsc --noEmit ${clientPath}`, { stdio: 'pipe' });
            recordTest('TypeScript Client', true, 'Client compiles successfully');
        } catch (error) {
            recordTest('TypeScript Client', false, 'Compilation failed');
            return false;
        }
        
        // Test basic client functionality (if possible)
        success('TypeScript client is ready for integration');
        return true;
        
    } catch (error) {
        recordTest('TypeScript Client', false, error.message);
        return false;
    }
}

// Setup Python environment and dependencies
async function setupPythonEnvironment() {
    step('Setting up Python environment...');
    
    try {
        const mlBackendDir = './ml-backend';
        
        if (!fs.existsSync(mlBackendDir)) {
            error('ml-backend directory not found');
            return false;
        }
        
        // Check if virtual environment exists
        const venvPath = path.join(mlBackendDir, PYTHON_ENV);
        if (!fs.existsSync(venvPath)) {
            info('Creating Python virtual environment...');
            execSync(`cd ${mlBackendDir} && python3 -m venv ${PYTHON_ENV}`, { stdio: 'inherit' });
        }
        
        // Install dependencies
        info('Installing Python dependencies...');
        const pipInstall = process.platform === 'win32' 
            ? `${venvPath}\\Scripts\\pip install -r requirements.txt`
            : `${venvPath}/bin/pip install -r requirements.txt`;
            
        execSync(`cd ${mlBackendDir} && ${pipInstall}`, { stdio: 'inherit' });
        
        success('Python environment ready');
        return true;
        
    } catch (error) {
        error(`Failed to setup Python environment: ${error.message}`);
        return false;
    }
}

// Start ML service
async function startMLService() {
    step('Starting ML backend service...');
    
    return new Promise((resolve) => {
        const mlBackendDir = './ml-backend';
        const pythonPath = process.platform === 'win32' 
            ? path.join(mlBackendDir, PYTHON_ENV, 'Scripts', 'python')
            : path.join(mlBackendDir, PYTHON_ENV, 'bin', 'python');
        
        const service = spawn(pythonPath, ['main.py'], {
            cwd: mlBackendDir,
            stdio: 'pipe'
        });
        
        let serviceReady = false;
        
        service.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Uvicorn running')) {
                serviceReady = true;
                success('ML service started successfully');
                resolve({ service, ready: true });
            }
        });
        
        service.stderr.on('data', (data) => {
            const output = data.toString();
            if (!serviceReady && (output.includes('ERROR') || output.includes('ImportError'))) {
                error(`Service startup error: ${output}`);
                resolve({ service, ready: false });
            }
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            if (!serviceReady) {
                warning('Service startup timeout');
                resolve({ service, ready: false });
            }
        }, 30000);
    });
}

// Check if service is already running
async function isServiceRunning() {
    try {
        const response = await makeRequest(`${ML_SERVICE_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Generate test report
function generateTestReport() {
    step('Generating test report...');
    
    const totalTests = testResults.passed + testResults.failed + testResults.skipped;
    const passRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
    
    log('\n' + '='.repeat(60), colors.bright);
    log('ML BACKEND TEST REPORT', colors.bright);
    log('='.repeat(60), colors.bright);
    
    log(`\nTotal Tests: ${totalTests}`);
    success(`Passed: ${testResults.passed}`);
    if (testResults.failed > 0) error(`Failed: ${testResults.failed}`);
    if (testResults.skipped > 0) warning(`Skipped: ${testResults.skipped}`);
    log(`Pass Rate: ${passRate}%`);
    
    if (testResults.details.length > 0) {
        log('\nDetailed Results:', colors.bright);
        testResults.details.forEach(({ testName, passed, message }) => {
            const status = passed ? '✅' : '❌';
            const detail = message ? ` - ${message}` : '';
            log(`${status} ${testName}${detail}`);
        });
    }
    
    // Save report to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: totalTests,
            passed: testResults.passed,
            failed: testResults.failed,
            skipped: testResults.skipped,
            passRate: parseFloat(passRate)
        },
        details: testResults.details
    };
    
    const reportPath = './test-screenshots/ml-backend-test-report.json';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    info(`Test report saved to ${reportPath}`);
    
    log('\n' + '='.repeat(60), colors.bright);
    
    return testResults.failed === 0;
}

// Main test execution
async function main() {
    log('🚀 Starting ML Backend Comprehensive Tests\n', colors.bright);
    
    try {
        // Check if service is already running
        const serviceAlreadyRunning = await isServiceRunning();
        let mlService = null;
        
        if (!serviceAlreadyRunning) {
            // Setup Python environment
            const envReady = await setupPythonEnvironment();
            if (!envReady) {
                error('Failed to setup Python environment');
                process.exit(1);
            }
            
            // Start ML service
            const { service, ready } = await startMLService();
            mlService = service;
            
            if (!ready) {
                error('Failed to start ML service');
                if (mlService) mlService.kill();
                process.exit(1);
            }
            
            // Wait a bit for service to fully initialize
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            success('ML service already running');
        }
        
        // Run tests
        try {
            // Basic health check
            const healthOk = await testServiceHealth();
            if (!healthOk) {
                warning('Service not healthy, some tests may fail');
            }
            
            // Load data and run training tests
            const stationData = loadGroundStationData();
            if (stationData) {
                await testModelTraining(stationData);
                
                // Only run these tests if training was successful
                await testPrediction();
                await testModelInfo();
                await testFeatureImportance();
                await testBatchPredictions();
            } else {
                recordTest('Data Loading', false, 'No station data available');
            }
            
            // Test TypeScript client
            await testTypeScriptClient();
            
        } finally {
            // Cleanup
            if (mlService && !serviceAlreadyRunning) {
                info('Stopping ML service...');
                mlService.kill();
            }
        }
        
        // Generate final report
        const allTestsPassed = generateTestReport();
        
        if (allTestsPassed) {
            success('\n🎉 All tests passed! ML backend is ready for production.');
            process.exit(0);
        } else {
            error('\n💥 Some tests failed. Check the report above for details.');
            process.exit(1);
        }
        
    } catch (error) {
        error(`Test execution failed: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Handle interruption
process.on('SIGINT', () => {
    warning('\nTest interrupted by user');
    process.exit(1);
});

// Run tests
main().catch(error => {
    error(`Unexpected error: ${error.message}`);
    process.exit(1);
});