#!/usr/bin/env python3
"""
Simple BI-Level Ground Station Analysis
Focuses on WHERE to look deeper, not WHETHER to build
Uses real Intelsat/SES locations for credible analysis
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
from geopy.distance import geodesic
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def simple_investment_analysis():
    """Simple but powerful BI analysis using real commercial data"""
    
    logger.info("💼 BI-Level Ground Station Investment Analysis")
    logger.info("=" * 60)
    
    # Load commercial stations
    try:
        stations_df = pd.read_parquet('data/raw/commercial_ground_stations.parquet')
        logger.info(f"✅ Loaded {len(stations_df)} commercial ground stations")
    except Exception as e:
        logger.error(f"❌ Failed to load commercial stations: {e}")
        return False
    
    # Simple scoring for each station
    enhanced_stations = []
    
    for _, station in stations_df.iterrows():
        try:
            # Calculate simple scores
            scores = calculate_simple_scores(station, stations_df)
            
            # Add to enhanced data
            enhanced_station = {
                'station_id': station['station_id'],
                'name': station['name'],
                'operator': station['operator'],
                'latitude': station['latitude'],
                'longitude': station['longitude'],
                'country': station['country'],
                'region': station.get('region', 'Unknown'),
                
                # Technical specs (realistic)
                'primary_antenna_size_m': station['primary_antenna_size_m'],
                'estimated_g_t_db': station['estimated_g_t_db'],
                'estimated_eirp_dbw': station['estimated_eirp_dbw'],
                'frequency_bands': station['frequency_bands'] if isinstance(station['frequency_bands'], str) else ', '.join(station['frequency_bands']),
                'services_supported': station['services_supported'] if isinstance(station['services_supported'], str) else ', '.join(station['services_supported']),
                
                # Investment scores
                'market_opportunity_score': scores['market_opportunity'],
                'strategic_location_score': scores['strategic_location'],
                'competition_score': scores['competition'],
                'infrastructure_score': scores['infrastructure'],
                'overall_investment_score': scores['overall_score'],
                'investment_recommendation': scores['recommendation'],
                'confidence_level': scores['confidence'],
                'investment_rationale': scores['rationale']
            }
            
            enhanced_stations.append(enhanced_station)
            
        except Exception as e:
            logger.warning(f"⚠️ Error analyzing {station['name']}: {e}")
    
    # Convert to DataFrame
    results_df = pd.DataFrame(enhanced_stations)
    
    # Save results
    results_df.to_parquet('data/commercial_bi_analysis.parquet', index=False)
    results_df.to_csv('data/commercial_bi_analysis.csv', index=False)
    
    # Generate insights
    insights = generate_bi_insights(results_df)
    
    # Create summary
    summary = {
        'analysis_date': datetime.now().isoformat(),
        'methodology': 'BI-Level Investment Opportunity Analysis',
        'focus': 'WHERE to look deeper for ground station opportunities',
        'data_source': 'Real Intelsat/SES commercial ground station locations',
        'total_stations': len(results_df),
        'score_distribution': {
            'excellent': len(results_df[results_df['overall_investment_score'] >= 80]),
            'good': len(results_df[(results_df['overall_investment_score'] >= 70) & (results_df['overall_investment_score'] < 80)]),
            'moderate': len(results_df[(results_df['overall_investment_score'] >= 60) & (results_df['overall_investment_score'] < 70)]),
            'poor': len(results_df[results_df['overall_investment_score'] < 60])
        },
        'insights': insights,
        'top_opportunities': results_df.nlargest(5, 'overall_investment_score')[
            ['name', 'operator', 'country', 'overall_investment_score', 'investment_recommendation']
        ].to_dict('records')
    }
    
    with open('data/commercial_bi_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Log key results
    logger.info(f"\n📊 BI Analysis Results:")
    logger.info(f"Total Facilities Analyzed: {len(results_df)}")
    logger.info(f"Investment Distribution:")
    for category, count in summary['score_distribution'].items():
        pct = count/len(results_df)*100
        logger.info(f"  {category.title()}: {count} facilities ({pct:.1f}%)")
    
    logger.info(f"\n🎯 Top Investment Opportunities:")
    for i, opp in enumerate(summary['top_opportunities'], 1):
        logger.info(f"  {i}. {opp['name']} ({opp['operator']}) - Score: {opp['overall_investment_score']:.1f}")
    
    logger.info(f"\n💡 Key BI Insights:")
    for insight in insights[:3]:  # Top 3 insights
        logger.info(f"  • {insight}")
    
    logger.info(f"\n✅ Files created:")
    logger.info(f"  - data/commercial_bi_analysis.parquet")
    logger.info(f"  - data/commercial_bi_analysis.csv")
    logger.info(f"  - data/commercial_bi_summary.json")
    
    return True

def calculate_simple_scores(station, all_stations):
    """Calculate simple but realistic investment scores"""
    
    operator = station['operator']
    country = station['country']
    lat = station['latitude']
    lon = station['longitude']
    
    # Market Opportunity (40% weight)
    market_scores = {
        'United States': 85,    # Largest satellite market
        'Germany': 78,          # European hub
        'United Kingdom': 75,   # Maritime + finance
        'China': 82,            # Growth market
        'Japan': 70,            # Mature market
        'Singapore': 88,        # Asia-Pacific gateway
        'Australia': 65,        # Regional coverage
        'South Korea': 72,      # Technology hub
        'France': 68,           # European market
        'Brazil': 75,           # South American hub
        'Luxembourg': 60,       # Small but strategic
    }
    market_opportunity = market_scores.get(country, 50)
    
    # Strategic Location (30% weight)
    strategic_location = 50  # Base score
    
    # Major satellite gateway bonuses
    if country == 'Singapore':
        strategic_location += 25  # Asia-Pacific chokepoint
    elif country == 'United States':
        strategic_location += 20  # Global connectivity
    elif country in ['Germany', 'United Kingdom']:
        strategic_location += 15  # European hubs
    
    # Equatorial bonus for GEO coverage
    if abs(lat) < 30:
        strategic_location += 10
    
    # Competition Analysis (15% weight)
    competition_score = calculate_competition_density(station, all_stations)
    
    # Infrastructure (15% weight)
    infrastructure_ratings = {
        'United States': 85, 'Germany': 90, 'United Kingdom': 88,
        'Singapore': 95, 'Japan': 92, 'South Korea': 90,
        'Australia': 82, 'France': 85, 'China': 70,
        'Brazil': 65, 'Luxembourg': 88
    }
    infrastructure_score = infrastructure_ratings.get(country, 60)
    
    # Calculate overall score
    overall_score = (
        market_opportunity * 0.40 +
        strategic_location * 0.30 +
        competition_score * 0.15 +
        infrastructure_score * 0.15
    )
    
    # Generate recommendation
    if overall_score >= 80:
        recommendation = 'excellent'
        confidence = 'high'
        rationale = 'Strong market opportunity with strategic advantages'
    elif overall_score >= 70:
        recommendation = 'good'
        confidence = 'high'
        rationale = 'Good fundamentals, worth detailed analysis'
    elif overall_score >= 60:
        recommendation = 'moderate'
        confidence = 'medium'
        rationale = 'Mixed factors, requires careful evaluation'
    else:
        recommendation = 'poor'
        confidence = 'medium'
        rationale = 'Limited opportunity under current conditions'
    
    return {
        'market_opportunity': round(market_opportunity, 1),
        'strategic_location': round(strategic_location, 1),
        'competition': round(competition_score, 1),
        'infrastructure': round(infrastructure_score, 1),
        'overall_score': round(overall_score, 1),
        'recommendation': recommendation,
        'confidence': confidence,
        'rationale': rationale
    }

def calculate_competition_density(station, all_stations):
    """Calculate competition within 500km radius"""
    
    competitors = 0
    station_lat = station['latitude']
    station_lon = station['longitude']
    
    for _, competitor in all_stations.iterrows():
        if competitor['station_id'] == station['station_id']:
            continue
        
        try:
            distance = geodesic(
                (station_lat, station_lon),
                (competitor['latitude'], competitor['longitude'])
            ).kilometers
            
            if distance <= 500:  # 500km competition radius
                competitors += 1
        except:
            continue
    
    # Convert to 0-100 scale (fewer competitors = higher score)
    if competitors == 0:
        return 90  # Low competition
    elif competitors <= 2:
        return 75  # Some competition
    elif competitors <= 5:
        return 60  # Moderate competition
    else:
        return 40  # High competition

def generate_bi_insights(results_df):
    """Generate business intelligence insights"""
    
    insights = []
    
    # Market concentration
    operator_distribution = results_df['operator'].value_counts()
    top_operator = operator_distribution.index[0]
    top_operator_pct = operator_distribution.iloc[0] / len(results_df) * 100
    insights.append(f"{top_operator} operates {top_operator_pct:.0f}% of analyzed facilities, indicating market concentration")
    
    # Geographic distribution
    country_scores = results_df.groupby('country')['overall_investment_score'].mean().round(1)
    best_country = country_scores.idxmax()
    best_score = country_scores.max()
    insights.append(f"{best_country} shows highest average investment potential ({best_score:.1f}/100)")
    
    # Investment opportunities
    excellent_count = len(results_df[results_df['investment_recommendation'] == 'excellent'])
    good_count = len(results_df[results_df['investment_recommendation'] == 'good'])
    total_good_plus = excellent_count + good_count
    insights.append(f"{total_good_plus} of {len(results_df)} facilities show strong investment potential")
    
    # Technical capabilities
    large_antenna_count = len(results_df[results_df['primary_antenna_size_m'] >= 13.0])
    insights.append(f"{large_antenna_count} facilities have large antennas (≥13m), indicating high-capacity operations")
    
    # Competition analysis
    low_competition = len(results_df[results_df['competition_score'] >= 75])
    insights.append(f"{low_competition} locations have low competitive pressure, suggesting expansion opportunities")
    
    # Infrastructure advantage
    high_infrastructure = len(results_df[results_df['infrastructure_score'] >= 85])
    insights.append(f"{high_infrastructure} facilities benefit from excellent infrastructure, reducing operational risk")
    
    return insights

if __name__ == "__main__":
    success = simple_investment_analysis()
    if success:
        logger.info("\n🎉 BI analysis complete! Ready for business intelligence visualization.")
        logger.info("Focus: WHERE to look deeper for ground station opportunities")
    else:
        logger.error("\n❌ Analysis failed. Check data files and try again.")