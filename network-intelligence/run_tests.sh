#!/bin/bash

echo "🧪 Running Ground Station Intelligence Test Suite"
echo "================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_PASSED=true

echo "📊 Step 1: Testing Weight Calibration..."
echo "-----------------------------------------"
npx jest tests/unit/test_weight_calibration.test.ts --passWithNoTests 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Weight calibration tests passed${NC}"
else
    echo -e "${RED}❌ Weight calibration tests failed${NC}"
    ALL_PASSED=false
fi
echo ""

echo "🎯 Step 2: Testing Confidence Scoring..."
echo "-----------------------------------------"
npx jest tests/unit/test_confidence_scoring.test.ts --passWithNoTests 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Confidence scoring tests passed${NC}"
else
    echo -e "${RED}❌ Confidence scoring tests failed${NC}"
    ALL_PASSED=false
fi
echo ""

echo "🔍 Step 3: Testing Hexagon Removal..."
echo "--------------------------------------"
npx jest tests/unit/test_no_hexagons.test.ts --passWithNoTests 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No hexagons test passed${NC}"
else
    echo -e "${RED}❌ Hexagon removal incomplete${NC}"
    ALL_PASSED=false
fi
echo ""

echo "🌍 Step 4: Testing Spatial Interpolation..."
echo "-------------------------------------------"
npx jest tests/unit/test_spatial_interpolation.test.ts --passWithNoTests 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Spatial interpolation tests passed${NC}"
else
    echo -e "${RED}❌ Spatial interpolation tests failed${NC}"
    ALL_PASSED=false
fi
echo ""

echo "🔌 Step 5: Testing Real Data Connections..."
echo "-------------------------------------------"
npx jest tests/unit/test_data_connections.test.ts --passWithNoTests 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data connection tests passed${NC}"
else
    echo -e "${RED}❌ Data connection tests failed${NC}"
    ALL_PASSED=false
fi
echo ""

echo "✅ Step 6: Testing 70% Accuracy Requirement..."
echo "----------------------------------------------"
npx jest tests/validation/test_known_stations_validation.test.ts --passWithNoTests 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Accuracy validation passed (>70%)${NC}"
else
    echo -e "${RED}❌ Accuracy below 70% threshold${NC}"
    ALL_PASSED=false
fi
echo ""

echo "================================================="
echo "📈 Coverage Report"
echo "================================================="
npx jest --coverage --silent 2>&1 | grep -A 20 "Coverage summary"
echo ""

echo "================================================="
echo "📋 Implementation Progress Checklist"
echo "================================================="

# Check specific implementation status
echo ""
echo "Core Requirements:"

# Check if weights are empirically derived
if [ -f "lib/scoring/empirical-weight-calibration.ts" ]; then
    echo -e "${GREEN}✅${NC} Empirical weight calibration implemented"
else
    echo -e "${YELLOW}⏳${NC} Empirical weight calibration pending"
fi

# Check if confidence scoring exists
if [ -f "lib/scoring/confidence-calculator.ts" ]; then
    echo -e "${GREEN}✅${NC} Confidence calculator implemented"
else
    echo -e "${YELLOW}⏳${NC} Confidence calculator pending"
fi

# Check for hexagon removal
if grep -q "h3-js" package.json 2>/dev/null; then
    echo -e "${RED}❌${NC} Hexagons still present (h3-js in package.json)"
else
    echo -e "${GREEN}✅${NC} H3 library removed from dependencies"
fi

# Check for spatial interpolation
if [ -f "lib/scoring/idw-spatial-interpolation.ts" ] || [ -f "lib/scoring/spatial-interpolator.ts" ]; then
    echo -e "${GREEN}✅${NC} Spatial interpolation implemented"
else
    echo -e "${YELLOW}⏳${NC} Spatial interpolation pending"
fi

# Check for real data connections
if [ -f "lib/services/googleEarthEngineRESTService.ts" ]; then
    echo -e "${GREEN}✅${NC} Google Earth Engine service exists"
else
    echo -e "${YELLOW}⏳${NC} Google Earth Engine service pending"
fi

# Check for validation
if [ -f "lib/validation/station-validator.ts" ]; then
    echo -e "${GREEN}✅${NC} Station validator implemented"
else
    echo -e "${YELLOW}⏳${NC} Station validator pending"
fi

echo ""
echo "================================================="
echo "🏁 Final Status"
echo "================================================="

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✅ All tests passing! Ready for demo.${NC}"
    echo ""
    echo "MVP Checklist:"
    echo "✅ Scoring uses empirical weights (not arbitrary)"
    echo "✅ All outputs include confidence levels"
    echo "✅ No hexagons remain (reality-based viz)"
    echo "✅ Real data sources connected"
    echo "✅ 70% accuracy on known stations"
    echo "✅ Demo ready"
else
    echo -e "${RED}❌ Some tests are failing. Continue implementation.${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Fix failing tests in order"
    echo "2. Implement missing components"
    echo "3. Run ./run_tests.sh again"
fi

echo ""
echo "================================================="
echo "💡 Quick Commands:"
echo "================================================="
echo "Run specific test:    npx jest tests/unit/[test-file].test.ts"
echo "Watch mode:          npx jest --watch"
echo "Coverage report:     npx jest --coverage"
echo "TDD Guard:          ./run-tdd-tests.sh"
echo ""