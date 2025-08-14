#!/usr/bin/env node

/**
 * ML Pipeline Validation Test
 * 
 * Tests the core ML components without requiring the full FastAPI service
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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

function info(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

function step(message) {
    log(`\n🔄 ${message}`, colors.cyan);
}

// Test results
let testResults = {
    passed: 0,
    failed: 0,
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

// Test ML backend files exist
function testFilesExist() {
    step('Testing ML backend files...');
    
    const requiredFiles = [
        './ml-backend/main.py',
        './ml-backend/models.py', 
        './ml-backend/data_preprocessing.py',
        './ml-backend/requirements.txt',
        './ml-backend/train_ground_stations.py'
    ];
    
    let allFilesExist = true;
    
    for (const filePath of requiredFiles) {
        if (fs.existsSync(filePath)) {
            info(`Found: ${filePath}`);
        } else {
            error(`Missing: ${filePath}`);
            allFilesExist = false;
        }
    }
    
    recordTest('ML Backend Files', allFilesExist);
    return allFilesExist;
}

// Test Python environment
function testPythonEnvironment() {
    step('Testing Python environment...');
    
    try {
        // Check if virtual environment exists
        const venvPath = './ml-backend/venv';
        if (!fs.existsSync(venvPath)) {
            recordTest('Python Environment', false, 'Virtual environment not found');
            return false;
        }
        
        // Check if main packages are installed
        const pythonPath = './ml-backend/venv/bin/python';
        const result = execSync(`${pythonPath} -c "import fastapi, scikit_learn, shap, pandas, numpy; print('All packages imported successfully')"`, {
            encoding: 'utf8',
            cwd: process.cwd()
        });
        
        if (result.includes('successfully')) {
            recordTest('Python Environment', true, 'All required packages available');
            return true;
        } else {
            recordTest('Python Environment', false, 'Package import failed');
            return false;
        }
        
    } catch (error) {
        recordTest('Python Environment', false, error.message);
        return false;
    }
}

// Test data preprocessing
function testDataPreprocessing() {
    step('Testing data preprocessing...');
    
    try {
        const pythonPath = './ml-backend/venv/bin/python';
        const testScript = `
import sys
sys.path.append('ml-backend')
from data_preprocessing import FeatureEngineer
import pandas as pd
import numpy as np

# Create sample data
sample_data = pd.DataFrame({
    'latitude': [40.7, 51.5, 35.7],
    'longitude': [-74.0, -0.1, 139.7],
    'revenue': [50.0, 45.0, 60.0],
    'profit': [10.0, 8.0, 15.0],
    'utilization': [85, 78, 92],
    'operator': ['SES', 'SES', 'TestCorp']
})

# Test feature engineering
fe = FeatureEngineer()
try:
    X, feature_names = fe.engineer_features(sample_data)
    print(f"SUCCESS: Created {X.shape[1]} features for {X.shape[0]} samples")
    print(f"Feature names: {len(feature_names)}")
    print("Data preprocessing test passed")
except Exception as e:
    print(f"ERROR: {str(e)}")
    exit(1)
`;
        
        fs.writeFileSync('./test_preprocessing.py', testScript);
        const result = execSync(`${pythonPath} test_preprocessing.py`, {
            encoding: 'utf8',
            cwd: process.cwd()
        });
        
        fs.unlinkSync('./test_preprocessing.py'); // Clean up
        
        if (result.includes('SUCCESS')) {
            recordTest('Data Preprocessing', true, result.split('\n')[0].replace('SUCCESS: ', ''));
            return true;
        } else {
            recordTest('Data Preprocessing', false, 'Feature engineering failed');
            return false;
        }
        
    } catch (error) {
        recordTest('Data Preprocessing', false, error.message);
        return false;
    }
}

// Test ML model
function testMLModel() {
    step('Testing ML model...');
    
    try {
        const pythonPath = './ml-backend/venv/bin/python';
        const testScript = `
import sys
sys.path.append('ml-backend')
from models import OpportunityMLModel
import numpy as np

# Create sample training data
np.random.seed(42)
X = np.random.rand(20, 10)  # 20 samples, 10 features
y = np.random.rand(20) * 50 + 25  # Target values between 25-75
feature_names = [f'feature_{i}' for i in range(10)]

# Test model training
model = OpportunityMLModel()
try:
    results = model.train(X, y, feature_names)
    print(f"SUCCESS: Model trained with R² = {results['performance']['accuracy']:.3f}")
    
    # Test prediction
    X_test = np.random.rand(1, 10)
    pred_result = model.predict_with_explanation(X_test, feature_names)
    print(f"SUCCESS: Prediction = {pred_result['prediction']:.2f}")
    print("ML model test passed")
except Exception as e:
    print(f"ERROR: {str(e)}")
    exit(1)
`;
        
        fs.writeFileSync('./test_model.py', testScript);
        const result = execSync(`${pythonPath} test_model.py`, {
            encoding: 'utf8',
            cwd: process.cwd(),
            timeout: 30000 // 30 second timeout
        });
        
        fs.unlinkSync('./test_model.py'); // Clean up
        
        if (result.includes('SUCCESS')) {
            const lines = result.split('\n').filter(line => line.includes('SUCCESS'));
            recordTest('ML Model', true, lines[0].replace('SUCCESS: ', ''));
            return true;
        } else {
            recordTest('ML Model', false, 'Model training/prediction failed');
            return false;
        }
        
    } catch (error) {
        recordTest('ML Model', false, error.message.includes('timeout') ? 'Training timeout' : error.message);
        return false;
    }
}

// Test TypeScript integration
function testTypeScriptIntegration() {
    step('Testing TypeScript integration...');
    
    try {
        // Check if client exists
        const clientPath = './lib/services/ml-training-client.ts';
        if (!fs.existsSync(clientPath)) {
            recordTest('TypeScript Integration', false, 'Client file not found');
            return false;
        }
        
        // Check if it compiles
        execSync(`npx tsc --noEmit ${clientPath}`, { stdio: 'pipe' });
        
        // Check if updated ML scorer exists
        const scorerPath = './lib/scoring/ml-opportunity-scorer.ts';
        if (!fs.existsSync(scorerPath)) {
            recordTest('TypeScript Integration', false, 'ML scorer not found');
            return false;
        }
        
        execSync(`npx tsc --noEmit ${scorerPath}`, { stdio: 'pipe' });
        
        recordTest('TypeScript Integration', true, 'Client and scorer compile successfully');
        return true;
        
    } catch (error) {
        recordTest('TypeScript Integration', false, 'TypeScript compilation failed');
        return false;
    }
}

// Test sample training data creation
function testSampleDataCreation() {
    step('Testing sample data creation...');
    
    try {
        const pythonPath = './ml-backend/venv/bin/python';
        const testScript = `
import sys
sys.path.append('ml-backend')
from train_ground_stations import create_sample_data, validate_station_data

# Create sample data
sample_stations = create_sample_data()
print(f"Created {len(sample_stations)} sample stations")

# Validate data
valid_stations = validate_station_data(sample_stations)
print(f"Validated {len(valid_stations)} stations")

if len(valid_stations) >= 10:
    print("SUCCESS: Sufficient training data created")
else:
    print(f"ERROR: Only {len(valid_stations)} valid stations, need at least 10")
    exit(1)
`;
        
        fs.writeFileSync('./test_sample_data.py', testScript);
        const result = execSync(`${pythonPath} test_sample_data.py`, {
            encoding: 'utf8',
            cwd: process.cwd()
        });
        
        fs.unlinkSync('./test_sample_data.py'); // Clean up
        
        if (result.includes('SUCCESS')) {
            recordTest('Sample Data Creation', true, result.split('\n').find(line => line.includes('Created')));
            return true;
        } else {
            recordTest('Sample Data Creation', false, 'Sample data creation failed');
            return false;
        }
        
    } catch (error) {
        recordTest('Sample Data Creation', false, error.message);
        return false;
    }
}

// Generate report
function generateReport() {
    step('Generating test report...');
    
    const totalTests = testResults.passed + testResults.failed;
    const passRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;
    
    log('\n' + '='.repeat(60), colors.bright);
    log('ML PIPELINE VALIDATION REPORT', colors.bright);
    log('='.repeat(60), colors.bright);
    
    log(`\nTotal Tests: ${totalTests}`);
    success(`Passed: ${testResults.passed}`);
    if (testResults.failed > 0) error(`Failed: ${testResults.failed}`);
    log(`Pass Rate: ${passRate}%`);
    
    log('\nDetailed Results:', colors.bright);
    testResults.details.forEach(({ testName, passed, message }) => {
        const status = passed ? '✅' : '❌';
        const detail = message ? ` - ${message}` : '';
        log(`${status} ${testName}${detail}`);
    });
    
    // Save report
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: totalTests,
            passed: testResults.passed,
            failed: testResults.failed,
            passRate: parseFloat(passRate)
        },
        details: testResults.details
    };
    
    const reportPath = './test-screenshots/ml-pipeline-test-report.json';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    info(`Report saved to ${reportPath}`);
    
    if (testResults.failed === 0) {
        success('\n🎉 All ML pipeline tests passed!');
        log('\nNext steps:');
        log('1. Start the ML service: cd ml-backend && ./start_service.sh');
        log('2. Train a model with real data');
        log('3. Test predictions via API');
    } else {
        error('\n💥 Some tests failed. Check the details above.');
    }
    
    log('\n' + '='.repeat(60), colors.bright);
    
    return testResults.failed === 0;
}

// Main execution
async function main() {
    log('🔬 ML Pipeline Validation Tests\n', colors.bright);
    
    try {
        // Run tests
        testFilesExist();
        testPythonEnvironment();
        testSampleDataCreation();
        testDataPreprocessing();
        testMLModel();
        testTypeScriptIntegration();
        
        // Generate report
        const allTestsPassed = generateReport();
        
        process.exit(allTestsPassed ? 0 : 1);
        
    } catch (error) {
        error(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Run tests
main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});