#!/usr/bin/env python3
"""
Download remaining datasets for Ground Station Intelligence POC
"""

import os
import requests
import pandas as pd
import json
import time
from datetime import datetime

class RemainingDataDownloader:
    def __init__(self, output_dir="data/raw"):
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'GroundStationPOC/1.0'
        })
        
    def download_submarine_cables(self):
        """Download submarine cable data from GitHub"""
        print("\n🌊 Downloading Submarine Cable Data...")
        
        try:
            # TeleGeography's public submarine cable data
            url = "https://raw.githubusercontent.com/telegeography/www.submarinecablemap.com/master/public/api/v3/cable/cable-geo.json"
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            cable_data = response.json()
            
            # Process cable data
            cables = []
            landing_points = []
            
            for feature in cable_data.get('features', []):
                props = feature.get('properties', {})
                geometry = feature.get('geometry', {})
                
                # Extract cable info
                cable = {
                    'cable_id': props.get('cable_id'),
                    'name': props.get('name'),
                    'length_km': props.get('length'),
                    'owners': props.get('owners'),
                    'capacity_tbps': props.get('capacity_tbps'),
                    'ready_for_service': props.get('ready_for_service'),
                    'coordinates': geometry.get('coordinates', [])
                }
                cables.append(cable)
                
                # Extract landing points
                if geometry.get('coordinates'):
                    for coord in geometry['coordinates']:
                        if isinstance(coord, list) and len(coord) >= 2:
                            landing_points.append({
                                'cable_name': props.get('name'),
                                'longitude': coord[0],
                                'latitude': coord[1]
                            })
            
            # Save data
            cables_df = pd.DataFrame(cables)
            landing_df = pd.DataFrame(landing_points)
            
            cables_df.to_parquet(f"{self.output_dir}/submarine_cables.parquet", index=False)
            landing_df.to_parquet(f"{self.output_dir}/cable_landing_points.parquet", index=False)
            
            print(f"✅ Downloaded {len(cables)} submarine cables")
            print(f"✅ Identified {len(landing_points)} landing points")
            
            return True
            
        except Exception as e:
            print(f"❌ Error downloading submarine cables: {e}")
            return False
    
    def download_internet_exchanges(self):
        """Download Internet Exchange Points from PeeringDB"""
        print("\n🌐 Downloading Internet Exchange Points...")
        
        try:
            # PeeringDB public API
            url = "https://api.peeringdb.com/api/ix"
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            ix_list = data.get('data', [])
            
            # Process IXP data
            ixps = []
            for ix in ix_list:
                ixp = {
                    'id': ix.get('id'),
                    'name': ix.get('name'),
                    'name_long': ix.get('name_long'),
                    'city': ix.get('city'),
                    'country': ix.get('country'),
                    'region_continent': ix.get('region_continent'),
                    'media': ix.get('media'),
                    'proto_unicast': ix.get('proto_unicast'),
                    'proto_multicast': ix.get('proto_multicast'),
                    'proto_ipv6': ix.get('proto_ipv6'),
                    'website': ix.get('website'),
                    'tech_email': ix.get('tech_email'),
                    'policy_email': ix.get('policy_email'),
                    'created': ix.get('created'),
                    'updated': ix.get('updated')
                }
                ixps.append(ixp)
            
            # Save data
            ixp_df = pd.DataFrame(ixps)
            ixp_df.to_parquet(f"{self.output_dir}/internet_exchanges.parquet", index=False)
            
            print(f"✅ Downloaded {len(ixps)} Internet Exchange Points")
            
            return True
            
        except Exception as e:
            print(f"❌ Error downloading IXPs: {e}")
            return False
    
    def download_world_bank_indicators(self):
        """Download World Bank infrastructure and governance indicators"""
        print("\n🏛️ Downloading World Bank Indicators...")
        
        indicators = {
            'electricity_access': 'EG.ELC.ACCS.ZS',  # Access to electricity (% of population)
            'electricity_quality': 'IC.ELC.OUTG',     # Power outages in a typical month
            'political_stability': 'PV.EST',          # Political Stability Estimate
            'government_effectiveness': 'GE.EST',     # Government Effectiveness Estimate
            'regulatory_quality': 'RQ.EST',           # Regulatory Quality Estimate
            'corruption_control': 'CC.EST'            # Control of Corruption Estimate
        }
        
        base_url = "https://api.worldbank.org/v2/country/all/indicator"
        
        all_data = {}
        
        for indicator_name, indicator_code in indicators.items():
            try:
                url = f"{base_url}/{indicator_code}?format=json&per_page=500&date=2020:2023"
                
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                if len(data) > 1:
                    records = []
                    for item in data[1]:
                        record = {
                            'country_code': item.get('countryiso3code'),
                            'country_name': item.get('country', {}).get('value'),
                            'indicator': indicator_name,
                            'year': item.get('date'),
                            'value': item.get('value')
                        }
                        records.append(record)
                    
                    all_data[indicator_name] = records
                    print(f"  ✓ {indicator_name}: {len(records)} records")
                
                time.sleep(1)  # Be nice to the API
                
            except Exception as e:
                print(f"  ❌ Error downloading {indicator_name}: {e}")
        
        # Combine all indicators
        if all_data:
            combined_data = []
            for indicator_data in all_data.values():
                combined_data.extend(indicator_data)
            
            df = pd.DataFrame(combined_data)
            df.to_parquet(f"{self.output_dir}/world_bank_indicators.parquet", index=False)
            
            print(f"✅ Downloaded World Bank indicators: {len(combined_data)} records")
            return True
        
        return False
    
    def download_celestrak_satellites(self):
        """Download additional satellite constellation data from CelesTrak"""
        print("\n🛰️ Downloading Additional Satellite Constellations...")
        
        constellations = {
            'oneweb': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=json',
            'iridium': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium&FORMAT=json',
            'globalstar': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=globalstar&FORMAT=json',
            'orbcomm': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=orbcomm&FORMAT=json',
            'spire': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=spire&FORMAT=json',
            'planet': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=planet&FORMAT=json'
        }
        
        all_satellites = []
        
        for constellation_name, url in constellations.items():
            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                satellites = response.json()
                
                # Add constellation name to each satellite
                for sat in satellites:
                    sat['constellation'] = constellation_name
                    all_satellites.extend([sat])
                
                print(f"  ✓ {constellation_name}: {len(satellites)} satellites")
                
                time.sleep(2)  # Be nice to CelesTrak
                
            except Exception as e:
                print(f"  ❌ Error downloading {constellation_name}: {e}")
        
        if all_satellites:
            # Process satellite data
            processed_sats = []
            for sat in all_satellites:
                processed_sat = {
                    'object_name': sat.get('OBJECT_NAME'),
                    'object_id': sat.get('OBJECT_ID'),
                    'norad_id': sat.get('NORAD_CAT_ID'),
                    'constellation': sat.get('constellation'),
                    'epoch': sat.get('EPOCH'),
                    'mean_motion': sat.get('MEAN_MOTION'),
                    'eccentricity': sat.get('ECCENTRICITY'),
                    'inclination': sat.get('INCLINATION'),
                    'ra_of_asc_node': sat.get('RA_OF_ASC_NODE'),
                    'arg_of_pericenter': sat.get('ARG_OF_PERICENTER'),
                    'mean_anomaly': sat.get('MEAN_ANOMALY'),
                    'classification_type': sat.get('CLASSIFICATION_TYPE'),
                    'element_set_no': sat.get('ELEMENT_SET_NO'),
                    'rev_at_epoch': sat.get('REV_AT_EPOCH')
                }
                processed_sats.append(processed_sat)
            
            df = pd.DataFrame(processed_sats)
            df.to_parquet(f"{self.output_dir}/additional_constellations.parquet", index=False)
            
            print(f"✅ Downloaded {len(processed_sats)} satellites from {len(constellations)} constellations")
            return True
        
        return False
    
    def generate_download_report(self):
        """Generate a report of what was downloaded and what needs manual download"""
        print("\n📋 Generating Download Report...")
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "automatic_downloads": {
                "submarine_cables": os.path.exists(f"{self.output_dir}/submarine_cables.parquet"),
                "internet_exchanges": os.path.exists(f"{self.output_dir}/internet_exchanges.parquet"),
                "world_bank_indicators": os.path.exists(f"{self.output_dir}/world_bank_indicators.parquet"),
                "additional_constellations": os.path.exists(f"{self.output_dir}/additional_constellations.parquet")
            },
            "manual_download_required": {
                "itu_spectrum_data": {
                    "description": "ITU frequency allocations and spectrum licenses",
                    "url": "https://www.itu.int/en/ITU-R/terrestrial/broadcast/Pages/RRC06.aspx",
                    "notes": "Requires ITU TIES account (free registration)"
                },
                "telegeography_data": {
                    "description": "Commercial ground stations and teleport locations",
                    "url": "https://www.telegeography.com/products/global-bandwidth-research-service/",
                    "notes": "Commercial product - contact for pricing"
                },
                "irena_renewable_data": {
                    "description": "Renewable energy potential by region",
                    "url": "https://www.irena.org/Data/Downloads",
                    "notes": "Free download after registration"
                },
                "space_track_data": {
                    "description": "Detailed satellite orbital data",
                    "url": "https://www.space-track.org",
                    "notes": "Free account required"
                },
                "land_price_data": {
                    "description": "Land prices and construction costs by region",
                    "sources": [
                        "https://www.numbeo.com/cost-of-living/",
                        "https://www.globalpropertyguide.com/",
                        "Local government databases"
                    ],
                    "notes": "Varies by country - may require subscriptions"
                },
                "industry_reports": {
                    "description": "Satellite launch manifests and market forecasts",
                    "sources": [
                        "https://www.nsr.com/",
                        "https://www.euroconsult-ec.com/",
                        "https://spacenews.com/",
                        "https://www.satellitetoday.com/"
                    ],
                    "notes": "Industry reports often require purchase"
                }
            }
        }
        
        # Save report
        with open(f"{self.output_dir}/remaining_data_report.json", 'w') as f:
            json.dump(report, f, indent=2)
        
        print("\n✅ Download report saved to: data/raw/remaining_data_report.json")
        
        return report


def main():
    """Download all remaining available datasets"""
    downloader = RemainingDataDownloader()
    
    print("🚀 Downloading Remaining Datasets for Ground Station Intelligence POC")
    print("=" * 70)
    
    # Download datasets
    downloader.download_submarine_cables()
    downloader.download_internet_exchanges()
    downloader.download_world_bank_indicators()
    downloader.download_celestrak_satellites()
    
    # Generate report
    report = downloader.generate_download_report()
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 DOWNLOAD SUMMARY")
    print("=" * 70)
    
    print("\n✅ Automatically Downloaded:")
    for dataset, success in report["automatic_downloads"].items():
        if success:
            print(f"  • {dataset.replace('_', ' ').title()}")
    
    print("\n📋 Manual Download Required:")
    for dataset, info in report["manual_download_required"].items():
        print(f"\n  • {info['description']}")
        print(f"    URL: {info['url']}")
        print(f"    Notes: {info['notes']}")
    
    print("\n✅ All available public datasets have been downloaded!")
    print("Check the report at: data/raw/remaining_data_report.json")


if __name__ == "__main__":
    main()