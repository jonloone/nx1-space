#!/bin/bash

# TDD-Guard Test Runner
# Ensures all tests are written BEFORE implementation
# Following the TDD-Guard framework requirements

echo "========================================="
echo "   TDD-Guard Test Runner"
echo "   Ground Station Intelligence Platform"
echo "========================================="
echo ""

# Check if TDD-Guard is installed
if ! command -v tdd-guard &> /dev/null; then
    echo "❌ TDD-Guard not found. Installing..."
    npm install -g tdd-guard
fi

echo "📋 Running TDD-Guard checks..."
tdd-guard check

if [ $? -ne 0 ]; then
    echo "❌ TDD-Guard checks failed!"
    echo "   Tests must be written BEFORE implementation."
    exit 1
fi

echo "✅ TDD-Guard checks passed"
echo ""

# Run tests in specific order as per requirements
echo "🧪 Running Critical Tests..."
echo ""

echo "1️⃣ Testing: No Hexagons Remain"
npm run test tests/unit/test_no_hexagons.test.ts

echo ""
echo "2️⃣ Testing: Weight Calibration"
npm run test tests/unit/test_weight_calibration.test.ts

echo ""
echo "3️⃣ Testing: Confidence Scoring"
npm run test tests/unit/test_confidence_scoring.test.ts

echo ""
echo "4️⃣ Testing: Spatial Interpolation (IDW)"
npm run test tests/unit/test_spatial_interpolation.test.ts

echo ""
echo "5️⃣ Testing: Real Data Connections"
npm run test tests/unit/test_data_connections.test.ts

echo ""
echo "6️⃣ Testing: Known Station Validation (>70% accuracy)"
npm run test tests/validation/test_known_stations_validation.test.ts

echo ""
echo "========================================="
echo "📊 Running Full Test Suite with Coverage..."
echo "========================================="
npm run test:coverage

# Check if we met the 70% coverage requirement
coverage_result=$(npm run test:coverage 2>&1 | grep "All files" | awk '{print $4}' | sed 's/%//')

if [ -n "$coverage_result" ]; then
    if (( $(echo "$coverage_result >= 70" | bc -l) )); then
        echo ""
        echo "✅ Coverage requirement met: ${coverage_result}%"
    else
        echo ""
        echo "⚠️  Coverage below 70%: ${coverage_result}%"
    fi
fi

echo ""
echo "========================================="
echo "📈 POC Validation Results"
echo "========================================="

# Check accuracy on known stations
echo "Validating accuracy on 32 known stations..."
npm run test:validation

echo ""
echo "========================================="
echo "✨ TDD Test Run Complete"
echo "========================================="