#!/bin/bash
# Comprehensive test suite runner

echo "🚀 Ground Station Intelligence Network - Test Suite"
echo "=================================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  No virtual environment found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run the pipeline first if no export exists
if [ ! -f "data/graphxr_export.json" ]; then
    echo "📊 Running pipeline to generate data..."
    python pipelines/run_pipeline.py
    if [ $? -ne 0 ]; then
        echo "❌ Pipeline failed. Please fix errors before testing."
        exit 1
    fi
fi

echo ""
echo "1️⃣  Running Validation Suite..."
echo "--------------------------------"
python test_viz/validation_suite.py
VALIDATION_STATUS=$?

echo ""
echo "2️⃣  Running Query Performance Tests..."
echo "--------------------------------------"
python test_viz/test_queries.py
QUERY_STATUS=$?

echo ""
echo "3️⃣  Running Pre-Kineviz Checklist..."
echo "-------------------------------------"
python test_viz/pre_kineviz_checklist.py
CHECKLIST_STATUS=$?

echo ""
echo "=================================================="
echo "📊 TEST SUMMARY"
echo "=================================================="

if [ $VALIDATION_STATUS -eq 0 ]; then
    echo "✅ Validation Suite: PASSED"
else
    echo "❌ Validation Suite: FAILED"
fi

if [ $QUERY_STATUS -eq 0 ]; then
    echo "✅ Query Tests: PASSED"
else
    echo "❌ Query Tests: FAILED"
fi

if [ $CHECKLIST_STATUS -eq 0 ]; then
    echo "✅ Pre-Kineviz Checklist: PASSED"
else
    echo "❌ Pre-Kineviz Checklist: FAILED"
fi

echo ""

# Check overall status
if [ $VALIDATION_STATUS -eq 0 ] && [ $QUERY_STATUS -eq 0 ] && [ $CHECKLIST_STATUS -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED! Ready for Kineviz."
    echo ""
    echo "Next steps:"
    echo "1. Review interactive visualization:"
    echo "   streamlit run test_viz/streamlit_graph_viewer.py"
    echo ""
    echo "2. Review test reports in test_viz/"
    echo ""
    echo "3. Send these files to Kineviz:"
    echo "   - data/graphxr_export.json"
    echo "   - data/graphxr_export_sample.json"
    echo "   - data/analytics_summary.json"
    echo "   - POC_DELIVERY_SUMMARY.md"
    exit 0
else
    echo "❌ SOME TESTS FAILED. Please review and fix issues."
    exit 1
fi