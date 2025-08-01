# Ground Station Investment Intelligence POC

## Overview
This POC demonstrates ground station investment intelligence through data fusion and graph visualization. It combines multiple data sources to identify investment opportunities in satellite ground station infrastructure.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Download Data
```bash
python scripts/download_all_data.py
```

This downloads:
- SatNOGS ground station data
- Weather station information
- Population density grids
- Economic indicators
- Satellite constellation data

### 3. Run Full Pipeline
```bash
python pipelines/run_pipeline.py
```

This will:
1. Load raw data into DuckDB
2. Perform entity resolution and matching
3. Calculate intelligence metrics and investment scores
4. Generate graph data for visualization
5. Export in GraphXR-compatible format

## Output Files

After running the pipeline, you'll find:

- `data/graphxr_export.json` - Full graph data for GraphXR
- `data/graphxr_export_sample.json` - Smaller sample for testing
- `data/analytics_summary.json` - Summary statistics and top opportunities
- `data/ground_stations.db` - DuckDB database with all processed data

## Key Insights Generated

1. **Investment Opportunities**: Stations with high strategic value but low utilization
2. **Network Bridges**: Critical stations connecting regions
3. **Weather Vulnerabilities**: Stations at risk from weather patterns
4. **Competition Analysis**: Areas with overlapping coverage

## GraphXR Import Instructions

1. Open GraphXR
2. Import `data/graphxr_export.json`
3. Enable geographic view for location-based visualization
4. Apply node sizing based on `investment_score`
5. Color nodes by `investment_priority`

## Node Types

- **GroundStation**: Satellite ground stations with investment metrics
- **DemandRegion**: Geographic areas with connectivity demand
- **WeatherPattern**: Weather systems affecting station reliability

## Relationship Types

- **SERVES**: Station provides coverage to region
- **COMPETES_WITH**: Stations with overlapping coverage
- **BRIDGES_WITH**: Critical network connections
- **AFFECTED_BY**: Weather impact on stations

## Example Queries

Find underutilized high-value stations:
```
Stations with investment_score > 70 AND utilization_rate < 40
```

Identify critical network bridges:
```
Stations with is_network_bridge = true AND bridge_value_usd > 5000000
```

## Troubleshooting

If data download fails:
- Check internet connection
- Some APIs may rate limit - wait and retry
- Synthetic data will be generated for missing sources

## Next Steps

1. Integrate real-time satellite pass data
2. Add competitive intelligence from commercial operators
3. Include regulatory and spectrum data
4. Enhance weather impact models