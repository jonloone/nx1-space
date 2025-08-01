#!/usr/bin/env python3
"""
Process IRENA renewable energy investment data for ground station site selection
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

def process_irena_data():
    """Process IRENA renewable energy investments for power reliability assessment"""
    print("⚡ Processing IRENA Renewable Energy Investment Data")
    print("=" * 60)
    
    # Read data
    df = pd.read_csv("data/raw/irena_renewable_energy.csv", skiprows=2, encoding='latin1')
    
    # Clean column names
    df.columns = ['country', 'technology', 'year', 'investment_millions_usd']
    
    # Convert investment values
    df['investment_value'] = pd.to_numeric(
        df['investment_millions_usd'].replace('-', np.nan), 
        errors='coerce'
    )
    
    print(f"Total records: {len(df)}")
    print(f"Countries: {df['country'].nunique()}")
    
    # Focus on grid-scale renewable technologies
    grid_technologies = [
        'On-grid solar photovoltaic',
        'Onshore wind energy', 
        'Offshore wind energy',
        'Renewable hydropower',
        'Geothermal energy',
        'Transmission and distribution',
        'Multiple renewables'
    ]
    
    # Filter for relevant technologies
    df_grid = df[df['technology'].isin(grid_technologies)].copy()
    
    # Aggregate by country and year
    country_yearly = df_grid.groupby(['country', 'year'])['investment_value'].sum().reset_index()
    
    # Calculate 3-year average (2021-2023)
    country_avg = country_yearly.groupby('country')['investment_value'].agg([
        'mean', 'sum', 'count'
    ]).reset_index()
    
    # Filter countries with significant investments
    country_avg = country_avg[country_avg['sum'] > 50]  # >$50M total over 3 years
    
    # Create power reliability score (0-100)
    # Based on renewable investment as proxy for grid modernization
    max_investment = country_avg['mean'].max()
    country_avg['power_reliability_score'] = (
        (country_avg['mean'] / max_investment * 50) +  # 50 points for investment scale
        (country_avg['count'] / 3 * 30) +  # 30 points for consistency
        20  # Base score
    ).clip(0, 100)
    
    # Rename columns
    country_avg.columns = [
        'country', 'avg_annual_investment', 'total_investment', 
        'years_with_data', 'power_reliability_score'
    ]
    
    # Sort by score
    country_avg = country_avg.sort_values('power_reliability_score', ascending=False)
    
    print(f"\nCountries with significant renewable grid investments: {len(country_avg)}")
    print("\nTop 20 countries by power reliability score:")
    for _, row in country_avg.head(20).iterrows():
        print(f"  {row['country']:<30} Score: {row['power_reliability_score']:>5.1f} "
              f"(${row['avg_annual_investment']:>8,.0f}M avg/year)")
    
    # Save processed data
    output_path = "data/raw/power_reliability_scores.parquet"
    country_avg.to_parquet(output_path, index=False)
    print(f"\n✅ Saved power reliability scores to: {output_path}")
    
    # Create summary for integration
    summary = {
        "processing_date": datetime.now().isoformat(),
        "source": "IRENA Public Renewable Energy Investment Database",
        "countries_analyzed": len(country_avg),
        "total_global_investment": float(df_grid['investment_value'].sum()),
        "years_covered": sorted(df['year'].unique().tolist()),
        "top_10_reliable_power": country_avg.head(10)[['country', 'power_reliability_score']].to_dict('records'),
        "ground_station_implications": [
            "Higher scores indicate better power grid reliability",
            "Renewable investments reduce operational costs",
            "Grid modernization supports 24/7 operations",
            "Environmental sustainability for site permits"
        ]
    }
    
    with open("data/raw/power_reliability_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("✅ Created power reliability summary")
    
    return country_avg

def create_ground_station_power_assessment(reliability_df):
    """Create ground station specific power assessment"""
    print("\n🏭 Ground Station Power Infrastructure Assessment")
    print("-" * 50)
    
    # Categories for ground station suitability
    reliability_df['power_category'] = pd.cut(
        reliability_df['power_reliability_score'],
        bins=[0, 40, 60, 80, 100],
        labels=['poor', 'moderate', 'good', 'excellent']
    )
    
    # Count by category
    category_counts = reliability_df['power_category'].value_counts()
    print("\nCountries by power infrastructure category:")
    for cat, count in category_counts.items():
        print(f"  {cat}: {count} countries")
    
    # Regional analysis
    region_mapping = {
        'India': 'Asia',
        'China': 'Asia',
        'Brazil': 'South America',
        'United States': 'North America',
        'Germany': 'Europe',
        'Spain': 'Europe',
        'France': 'Europe',
        'South Africa': 'Africa',
        'Egypt': 'Africa',
        'Australia': 'Oceania'
    }
    
    # Recommendations
    print("\n💡 Key Findings for Ground Station Investment:")
    print("1. Countries with 'excellent' power scores are ideal for primary stations")
    print("2. 'Good' score countries suitable for backup/diversity sites")
    print("3. Consider on-site renewable generation in 'moderate' score countries")
    print("4. Avoid 'poor' score countries unless strategic location critical")

if __name__ == "__main__":
    # Process the data
    reliability_scores = process_irena_data()
    
    # Create ground station assessment
    create_ground_station_power_assessment(reliability_scores)
    
    print("\n✅ IRENA data processing complete!")
    print("Ready to integrate power reliability into investment analysis")