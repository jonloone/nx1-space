# Ground Station Intelligence Network - Validation Suite

## 🚀 Quick Start

Run all validation tests:
```bash
./test_viz/run_tests.sh
```

Or run individual components:

### 1. Interactive Visualization
```bash
streamlit run test_viz/streamlit_graph_viewer.py
```
- Browse the graph interactively
- Filter by investment score and connectivity gap
- Export filtered subgraphs
- View raw data tables

### 2. Validation Suite
```bash
python test_viz/validation_suite.py
```
Checks:
- ✅ Schema structure
- ✅ Node/edge integrity
- ✅ Property completeness
- ✅ Relationship validity
- ✅ Data quality

### 3. Query Performance Tests
```bash
python test_viz/test_queries.py
```
Tests key queries:
- Investment opportunities
- Critical network bridges
- Weather vulnerabilities
- Network statistics
- Geographic distribution

### 4. Pre-Kineviz Checklist
```bash
python test_viz/pre_kineviz_checklist.py
```
Final validation before handoff:
- ✅ All outputs exist
- ✅ File sizes reasonable
- ✅ Documentation complete
- ✅ Sample queries work
- ✅ Dependencies documented

## 📊 Test Reports

After running tests, find reports in `test_viz/`:
- `validation_report_*.json` - Detailed validation results
- `query_performance_report.json` - Query benchmarks
- `handoff_package.json` - Ready-to-send package info

## 🎯 Success Criteria

All tests must pass before sending to Kineviz:
1. **No validation errors** (warnings are OK)
2. **All queries execute** in <1000ms
3. **File sizes** under GraphXR limits
4. **Documentation** complete

## 💡 Troubleshooting

### Pipeline hasn't run
```bash
python pipelines/run_pipeline.py
```

### Missing dependencies
```bash
pip install -r requirements.txt
```

### Visualization won't start
```bash
# Check port 8501 is free
lsof -i :8501
# Kill if needed
kill -9 <PID>
```

## 📤 Ready to Send?

When all tests pass:
1. Review interactive viz one more time
2. Check `test_viz/handoff_package.json` for file list
3. Send to Kineviz:
   - `data/graphxr_export.json`
   - `data/graphxr_export_sample.json`
   - `data/analytics_summary.json`
   - `POC_DELIVERY_SUMMARY.md`

## 🔍 Demo Queries for Kineviz

Share these with the Kineviz team:

1. **Investment Opportunities**
   - Find stations with <40% utilization in regions with >70% connectivity gap
   - Expected: ~10-20 high-value opportunities

2. **Critical Infrastructure**
   - Identify bridge connections worth >$5M annually
   - Expected: ~5-10 critical bridges

3. **Weather Impact**
   - Show stations with >100 hours annual weather downtime
   - Expected: ~20-30 vulnerable stations

Good luck with your demo! 🎉