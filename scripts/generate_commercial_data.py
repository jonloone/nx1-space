#!/usr/bin/env python3
"""
Generate synthetic commercial data for ground station investment decisions
Based on industry best practices and typical market rates
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

def generate_ground_station_lease_rates():
    """Generate realistic ground station lease rates by region"""
    print("💰 Generating Ground Station Lease Rates")
    print("=" * 60)
    
    # Base lease rates influenced by:
    # - Land costs
    # - Power costs
    # - Labor costs
    # - Market maturity
    # - Competition
    
    lease_data = []
    
    # Define markets with typical characteristics
    markets = {
        # Tier 1 - Established teleport markets
        'Ashburn, USA': {'base_rate': 2500, 'market_maturity': 'mature', 'competition': 'high'},
        'London, UK': {'base_rate': 2800, 'market_maturity': 'mature', 'competition': 'high'},
        'Frankfurt, Germany': {'base_rate': 2600, 'market_maturity': 'mature', 'competition': 'high'},
        'Singapore': {'base_rate': 2400, 'market_maturity': 'mature', 'competition': 'high'},
        'Tokyo, Japan': {'base_rate': 3200, 'market_maturity': 'mature', 'competition': 'medium'},
        'Sydney, Australia': {'base_rate': 2200, 'market_maturity': 'mature', 'competition': 'medium'},
        
        # Tier 2 - Growing markets
        'Dubai, UAE': {'base_rate': 1800, 'market_maturity': 'growing', 'competition': 'medium'},
        'Mumbai, India': {'base_rate': 1200, 'market_maturity': 'growing', 'competition': 'high'},
        'São Paulo, Brazil': {'base_rate': 1500, 'market_maturity': 'growing', 'competition': 'medium'},
        'Johannesburg, South Africa': {'base_rate': 1100, 'market_maturity': 'growing', 'competition': 'low'},
        'Mexico City, Mexico': {'base_rate': 1300, 'market_maturity': 'growing', 'competition': 'low'},
        'Jakarta, Indonesia': {'base_rate': 1000, 'market_maturity': 'growing', 'competition': 'medium'},
        
        # Tier 3 - Emerging markets
        'Lagos, Nigeria': {'base_rate': 900, 'market_maturity': 'emerging', 'competition': 'low'},
        'Nairobi, Kenya': {'base_rate': 850, 'market_maturity': 'emerging', 'competition': 'low'},
        'Dhaka, Bangladesh': {'base_rate': 700, 'market_maturity': 'emerging', 'competition': 'low'},
        'Cairo, Egypt': {'base_rate': 800, 'market_maturity': 'emerging', 'competition': 'low'},
        
        # Remote/Strategic locations
        'Reykjavik, Iceland': {'base_rate': 1600, 'market_maturity': 'niche', 'competition': 'low'},
        'Perth, Australia': {'base_rate': 1400, 'market_maturity': 'niche', 'competition': 'low'},
        'Anchorage, USA': {'base_rate': 1700, 'market_maturity': 'niche', 'competition': 'low'},
        'Punta Arenas, Chile': {'base_rate': 1300, 'market_maturity': 'niche', 'competition': 'low'}
    }
    
    # Generate lease rates for different antenna sizes
    antenna_sizes = {
        '3.7m': {'multiplier': 1.0, 'typical_use': 'VSAT, Ka-band'},
        '6.3m': {'multiplier': 1.5, 'typical_use': 'Ku-band, regional'},
        '9.0m': {'multiplier': 2.2, 'typical_use': 'C/Ku-band, broadcast'},
        '13.0m': {'multiplier': 3.5, 'typical_use': 'C-band, high-power'},
        '18.0m': {'multiplier': 5.0, 'typical_use': 'Gateway, TT&C'}
    }
    
    for location, market_info in markets.items():
        for antenna_size, antenna_info in antenna_sizes.items():
            # Calculate monthly lease rate
            base = market_info['base_rate']
            size_mult = antenna_info['multiplier']
            
            # Add variations
            if market_info['competition'] == 'high':
                competition_factor = np.random.uniform(0.8, 0.95)
            elif market_info['competition'] == 'medium':
                competition_factor = np.random.uniform(0.9, 1.1)
            else:
                competition_factor = np.random.uniform(1.0, 1.2)
            
            monthly_rate = base * size_mult * competition_factor
            
            # Additional services pricing
            power_per_kw = np.random.uniform(150, 300) if 'USA' in location or 'Europe' in location else np.random.uniform(100, 200)
            
            lease_data.append({
                'location': location,
                'antenna_size': antenna_size,
                'monthly_lease_usd': round(monthly_rate, 0),
                'annual_lease_usd': round(monthly_rate * 12, 0),
                'power_per_kw_month': round(power_per_kw, 0),
                'rackspace_per_u_month': round(np.random.uniform(20, 50), 0),
                'market_maturity': market_info['market_maturity'],
                'competition_level': market_info['competition'],
                'typical_use': antenna_info['typical_use'],
                'setup_fee_usd': round(monthly_rate * np.random.uniform(1.5, 3), 0),
                'min_contract_months': np.random.choice([12, 24, 36]),
                'fiber_included_mbps': 10 if market_info['market_maturity'] == 'mature' else 5,
                'additional_mbps_cost': round(np.random.uniform(100, 500), 0)
            })
    
    lease_df = pd.DataFrame(lease_data)
    lease_df.to_parquet('data/raw/ground_station_lease_rates.parquet', index=False)
    print(f"✅ Generated lease rates for {len(markets)} markets and {len(antenna_sizes)} antenna sizes")
    
    return lease_df

def generate_bandwidth_pricing():
    """Generate bandwidth pricing by region and capacity"""
    print("\n📡 Generating Bandwidth Pricing Data")
    print("=" * 60)
    
    bandwidth_data = []
    
    # Regional bandwidth costs (USD per Mbps per month)
    # Based on submarine cable proximity, competition, infrastructure
    regions = {
        'North America': {'base_cost': 30, 'volume_discount': 0.7},
        'Western Europe': {'base_cost': 35, 'volume_discount': 0.65},
        'Eastern Europe': {'base_cost': 50, 'volume_discount': 0.75},
        'East Asia': {'base_cost': 40, 'volume_discount': 0.7},
        'Southeast Asia': {'base_cost': 60, 'volume_discount': 0.8},
        'South Asia': {'base_cost': 70, 'volume_discount': 0.85},
        'Middle East': {'base_cost': 80, 'volume_discount': 0.8},
        'Africa': {'base_cost': 120, 'volume_discount': 0.9},
        'South America': {'base_cost': 90, 'volume_discount': 0.85},
        'Oceania': {'base_cost': 45, 'volume_discount': 0.75}
    }
    
    # Capacity tiers
    capacities = [10, 50, 100, 500, 1000, 5000, 10000]  # Mbps
    
    # Connection types
    connection_types = {
        'IP Transit': {'multiplier': 1.0, 'sla': '99.5%'},
        'Protected IP': {'multiplier': 1.5, 'sla': '99.9%'},
        'Premium Blend': {'multiplier': 1.3, 'sla': '99.5%'},
        'Dedicated Wavelength': {'multiplier': 0.6, 'sla': '99.99%'}
    }
    
    for region, pricing in regions.items():
        for capacity in capacities:
            for conn_type, conn_info in connection_types.items():
                # Calculate price with volume discounts
                if capacity <= 100:
                    volume_factor = 1.0
                elif capacity <= 1000:
                    volume_factor = pricing['volume_discount']
                else:
                    volume_factor = pricing['volume_discount'] * 0.8
                
                price_per_mbps = pricing['base_cost'] * conn_info['multiplier'] * volume_factor
                
                # Add market variations
                price_per_mbps *= np.random.uniform(0.8, 1.2)
                
                bandwidth_data.append({
                    'region': region,
                    'capacity_mbps': capacity,
                    'connection_type': conn_type,
                    'price_per_mbps_usd': round(price_per_mbps, 2),
                    'monthly_cost_usd': round(price_per_mbps * capacity, 0),
                    'annual_cost_usd': round(price_per_mbps * capacity * 12, 0),
                    'sla_guarantee': conn_info['sla'],
                    'setup_cost_usd': round(price_per_mbps * capacity * 0.5, 0),
                    'contract_term_months': 36 if capacity >= 1000 else 24,
                    'burst_available': capacity < 1000,
                    'burst_cost_multiplier': 1.5 if capacity < 1000 else 0
                })
    
    bandwidth_df = pd.DataFrame(bandwidth_data)
    bandwidth_df.to_parquet('data/raw/bandwidth_pricing.parquet', index=False)
    print(f"✅ Generated bandwidth pricing for {len(regions)} regions")
    
    return bandwidth_df

def generate_satellite_operator_requirements():
    """Generate typical satellite operator technical and commercial requirements"""
    print("\n🛰️ Generating Satellite Operator Requirements")
    print("=" * 60)
    
    operator_data = []
    
    # Major satellite operators and their typical requirements
    operators = {
        'Intelsat': {
            'type': 'GEO FSS',
            'min_sites': 3,
            'redundancy': 'Full 1+1',
            'typical_antenna': '9.0m-13.0m',
            'bands': ['C-band', 'Ku-band'],
            'anchor_revenue_range': [100000, 500000]
        },
        'SES': {
            'type': 'GEO FSS/HTS',
            'min_sites': 2,
            'redundancy': 'Full 1+1',
            'typical_antenna': '6.3m-9.0m',
            'bands': ['Ku-band', 'Ka-band'],
            'anchor_revenue_range': [80000, 400000]
        },
        'Eutelsat': {
            'type': 'GEO FSS/HTS',
            'min_sites': 2,
            'redundancy': 'Equipment only',
            'typical_antenna': '6.3m-9.0m',
            'bands': ['Ku-band', 'Ka-band'],
            'anchor_revenue_range': [60000, 300000]
        },
        'Telesat': {
            'type': 'GEO/LEO',
            'min_sites': 4,
            'redundancy': 'Full 1+1',
            'typical_antenna': '6.3m-13.0m',
            'bands': ['C-band', 'Ku-band', 'Ka-band'],
            'anchor_revenue_range': [150000, 600000]
        },
        'OneWeb': {
            'type': 'LEO',
            'min_sites': 8,
            'redundancy': 'N+1',
            'typical_antenna': '3.7m-6.3m',
            'bands': ['Ku-band', 'Ka-band'],
            'anchor_revenue_range': [200000, 1000000]
        },
        'SpaceX Starlink': {
            'type': 'LEO',
            'min_sites': 6,
            'redundancy': 'N+1',
            'typical_antenna': '3.7m-6.3m',
            'bands': ['Ku-band', 'Ka-band', 'E-band'],
            'anchor_revenue_range': [300000, 1500000]
        },
        'Amazon Kuiper': {
            'type': 'LEO',
            'min_sites': 10,
            'redundancy': 'Full 1+1',
            'typical_antenna': '3.7m-6.3m',
            'bands': ['Ka-band', 'E-band'],
            'anchor_revenue_range': [250000, 1200000]
        },
        'Viasat': {
            'type': 'GEO HTS',
            'min_sites': 5,
            'redundancy': 'Full 1+1',
            'typical_antenna': '6.3m-9.0m',
            'bands': ['Ka-band'],
            'anchor_revenue_range': [150000, 800000]
        },
        'Regional Operators': {
            'type': 'GEO FSS',
            'min_sites': 1,
            'redundancy': 'Equipment only',
            'typical_antenna': '6.3m-9.0m',
            'bands': ['C-band', 'Ku-band'],
            'anchor_revenue_range': [30000, 150000]
        }
    }
    
    for operator, requirements in operators.items():
        # Generate specific requirements
        operator_data.append({
            'operator_name': operator,
            'satellite_type': requirements['type'],
            'min_gateway_sites': requirements['min_sites'],
            'redundancy_requirement': requirements['redundancy'],
            'typical_antenna_size': requirements['typical_antenna'],
            'frequency_bands': ', '.join(requirements['bands']),
            'min_annual_revenue_usd': requirements['anchor_revenue_range'][0],
            'max_annual_revenue_usd': requirements['anchor_revenue_range'][1],
            'typical_contract_years': 5 if 'LEO' in requirements['type'] else 3,
            'power_requirement_kw': np.random.randint(20, 100),
            'rack_space_required': np.random.randint(10, 42),
            'fiber_requirement_gbps': 10 if 'LEO' in requirements['type'] else 1,
            'latency_requirement_ms': 5 if 'LEO' in requirements['type'] else 50,
            'availability_sla': '99.95%' if 'LEO' in requirements['type'] else '99.5%',
            'geo_diversity_km': 500 if 'LEO' in requirements['type'] else 1000,
            'local_hands_required': True,
            '24x7_noc_required': True if requirements['min_sites'] > 2 else False
        })
    
    operator_df = pd.DataFrame(operator_data)
    operator_df.to_parquet('data/raw/satellite_operator_requirements.parquet', index=False)
    print(f"✅ Generated requirements for {len(operators)} operator types")
    
    return operator_df

def generate_equipment_costs():
    """Generate typical ground station equipment costs"""
    print("\n🔧 Generating Equipment Cost Data")
    print("=" * 60)
    
    equipment_data = []
    
    # Antenna systems
    antennas = {
        '3.7m Ku/Ka': {'cost': 150000, 'install': 25000, 'annual_maint': 5000},
        '6.3m C/Ku': {'cost': 350000, 'install': 50000, 'annual_maint': 10000},
        '9.0m C/Ku/Ka': {'cost': 650000, 'install': 85000, 'annual_maint': 20000},
        '13.0m C/Ku': {'cost': 1200000, 'install': 150000, 'annual_maint': 35000},
        '18.0m Multi-band': {'cost': 2500000, 'install': 300000, 'annual_maint': 60000}
    }
    
    # RF equipment per band
    rf_chains = {
        'C-band': {'hpa_cost': 50000, 'lna_cost': 15000, 'converter_cost': 25000},
        'Ku-band': {'hpa_cost': 35000, 'lna_cost': 10000, 'converter_cost': 20000},
        'Ka-band': {'hpa_cost': 45000, 'lna_cost': 12000, 'converter_cost': 30000},
        'E-band': {'hpa_cost': 80000, 'lna_cost': 25000, 'converter_cost': 50000}
    }
    
    # Modem/baseband equipment
    modems = {
        'Single carrier': {'cost': 25000, 'capacity': '500 Mbps'},
        'Multi-carrier': {'cost': 75000, 'capacity': '2 Gbps'},
        'High-throughput': {'cost': 150000, 'capacity': '10 Gbps'},
        'LEO tracking': {'cost': 200000, 'capacity': '5 Gbps'}
    }
    
    # Supporting infrastructure
    infrastructure = {
        'UPS 50kVA': {'cost': 35000, 'annual_maint': 2000},
        'Generator 500kW': {'cost': 150000, 'annual_maint': 10000},
        'Cooling 50kW': {'cost': 45000, 'annual_maint': 5000},
        'M&C System': {'cost': 50000, 'annual_maint': 10000},
        'Radome 20m': {'cost': 250000, 'annual_maint': 5000}
    }
    
    # Create complete system configurations
    configs = [
        {
            'name': 'Small VSAT Hub',
            'antenna': '3.7m Ku/Ka',
            'bands': ['Ku-band'],
            'modems': 2,
            'modem_type': 'Single carrier',
            'redundancy': 'Cold standby'
        },
        {
            'name': 'Regional Gateway',
            'antenna': '6.3m C/Ku',
            'bands': ['C-band', 'Ku-band'],
            'modems': 4,
            'modem_type': 'Multi-carrier',
            'redundancy': '1+1 Hot standby'
        },
        {
            'name': 'Broadcast Facility',
            'antenna': '9.0m C/Ku/Ka',
            'bands': ['C-band', 'Ku-band'],
            'modems': 6,
            'modem_type': 'Multi-carrier',
            'redundancy': '1+1 Hot standby'
        },
        {
            'name': 'LEO Gateway',
            'antenna': '6.3m C/Ku',
            'bands': ['Ka-band'],
            'modems': 4,
            'modem_type': 'LEO tracking',
            'redundancy': 'N+1'
        },
        {
            'name': 'Major Teleport',
            'antenna': '13.0m C/Ku',
            'bands': ['C-band', 'Ku-band', 'Ka-band'],
            'modems': 10,
            'modem_type': 'High-throughput',
            'redundancy': 'Full 1+1'
        }
    ]
    
    for config in configs:
        # Calculate total system cost
        antenna_cost = antennas[config['antenna']]['cost']
        antenna_install = antennas[config['antenna']]['install']
        antenna_maint = antennas[config['antenna']]['annual_maint']
        
        # RF chain costs
        rf_cost = sum(rf_chains[band]['hpa_cost'] + rf_chains[band]['lna_cost'] + 
                     rf_chains[band]['converter_cost'] for band in config['bands'])
        
        # Redundancy multiplier
        if config['redundancy'] == 'Full 1+1':
            rf_cost *= 2
        elif config['redundancy'] == '1+1 Hot standby':
            rf_cost *= 1.5
        
        # Modem costs
        modem_cost = modems[config['modem_type']]['cost'] * config['modems']
        
        # Infrastructure (scaled by size)
        infra_cost = 150000 if 'Small' in config['name'] else 500000
        
        total_capex = antenna_cost + antenna_install + rf_cost + modem_cost + infra_cost
        total_annual_opex = antenna_maint + (total_capex * 0.05)  # 5% of capex for maintenance
        
        equipment_data.append({
            'configuration_name': config['name'],
            'antenna_system': config['antenna'],
            'frequency_bands': ', '.join(config['bands']),
            'redundancy_level': config['redundancy'],
            'antenna_cost_usd': antenna_cost,
            'installation_cost_usd': antenna_install,
            'rf_chain_cost_usd': round(rf_cost, 0),
            'modem_cost_usd': modem_cost,
            'infrastructure_cost_usd': infra_cost,
            'total_capex_usd': round(total_capex, 0),
            'annual_opex_usd': round(total_annual_opex, 0),
            'typical_build_time_months': 6 if 'Small' in config['name'] else 12,
            'payback_period_years': np.random.uniform(3, 7)
        })
    
    equipment_df = pd.DataFrame(equipment_data)
    equipment_df.to_parquet('data/raw/ground_station_equipment_costs.parquet', index=False)
    print(f"✅ Generated equipment costs for {len(configs)} configurations")
    
    return equipment_df

def create_commercial_summary():
    """Create summary of commercial data for investment decisions"""
    print("\n💼 Creating Commercial Data Summary")
    print("=" * 60)
    
    # Load generated data
    lease_df = pd.read_parquet('data/raw/ground_station_lease_rates.parquet')
    bandwidth_df = pd.read_parquet('data/raw/bandwidth_pricing.parquet')
    operator_df = pd.read_parquet('data/raw/satellite_operator_requirements.parquet')
    equipment_df = pd.read_parquet('data/raw/ground_station_equipment_costs.parquet')
    
    # Key insights
    avg_lease_by_market = lease_df.groupby('market_maturity')['annual_lease_usd'].mean()
    avg_bandwidth_by_region = bandwidth_df[bandwidth_df['capacity_mbps'] == 1000].groupby('region')['price_per_mbps_usd'].mean()
    
    summary = {
        'generation_date': datetime.now().isoformat(),
        'disclaimer': 'SYNTHETIC DATA FOR POC - Based on industry best practices',
        'market_insights': {
            'avg_annual_lease_by_market': {
                'mature': round(avg_lease_by_market.get('mature', 0), 0),
                'growing': round(avg_lease_by_market.get('growing', 0), 0),
                'emerging': round(avg_lease_by_market.get('emerging', 0), 0),
                'niche': round(avg_lease_by_market.get('niche', 0), 0)
            },
            'bandwidth_cost_range_per_mbps': {
                'lowest': round(bandwidth_df['price_per_mbps_usd'].min(), 2),
                'highest': round(bandwidth_df['price_per_mbps_usd'].max(), 2),
                'average': round(bandwidth_df['price_per_mbps_usd'].mean(), 2)
            },
            'typical_anchor_revenue': {
                'GEO_operators': '$100k-500k/year',
                'LEO_operators': '$200k-1.5M/year',
                'Regional_operators': '$30k-150k/year'
            }
        },
        'investment_rules_of_thumb': [
            'Mature markets: Higher lease costs but lower operational risk',
            'Emerging markets: Lower costs but higher regulatory/political risk',
            'LEO constellations require 3-10x more gateway sites than GEO',
            'Typical payback period: 3-7 years depending on anchor tenants',
            'Operating margin target: 40-60% for established facilities',
            'Bandwidth typically represents 30-50% of operating costs'
        ],
        'cost_breakdown_typical': {
            'lease_and_power': '25-35%',
            'bandwidth': '30-50%',
            'staff': '15-25%',
            'maintenance': '5-10%',
            'other': '5-10%'
        },
        'critical_success_factors': [
            'Anchor tenant commitment before build',
            'Fiber diversity (2+ providers)',
            'Local technical support availability',
            'Expansion space for growth',
            'Clean spectrum environment',
            'Political and economic stability'
        ]
    }
    
    with open('data/raw/commercial_data_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n✅ Commercial data generation complete!")
    print("\nKey insights generated:")
    print(f"  - Lease rates for {len(lease_df)} location/antenna combinations")
    print(f"  - Bandwidth pricing for {len(bandwidth_df)} region/capacity combinations")
    print(f"  - Requirements for {len(operator_df)} satellite operator types")
    print(f"  - Equipment costs for {len(equipment_df)} standard configurations")

if __name__ == "__main__":
    # Generate all commercial datasets
    lease_rates = generate_ground_station_lease_rates()
    bandwidth_pricing = generate_bandwidth_pricing()
    operator_requirements = generate_satellite_operator_requirements()
    equipment_costs = generate_equipment_costs()
    
    # Create summary
    create_commercial_summary()
    
    print("\n🎯 Generated commercial data files:")
    print("  - data/raw/ground_station_lease_rates.parquet")
    print("  - data/raw/bandwidth_pricing.parquet")
    print("  - data/raw/satellite_operator_requirements.parquet")
    print("  - data/raw/ground_station_equipment_costs.parquet")
    print("  - data/raw/commercial_data_summary.json")
    print("\n💡 This data enables ROI calculations and investment decision modeling!")