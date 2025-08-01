#!/usr/bin/env python3
"""
Download relevant datasets from Kaggle for Ground Station Intelligence POC
Note: Requires Kaggle API credentials (~/.kaggle/kaggle.json)
"""

import os
import subprocess
import pandas as pd
import json
from datetime import datetime

class KaggleDataDownloader:
    def __init__(self, output_dir="data/raw/kaggle"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
    def check_kaggle_setup(self):
        """Check if Kaggle API is properly configured"""
        kaggle_json = os.path.expanduser("~/.kaggle/kaggle.json")
        if not os.path.exists(kaggle_json):
            print("❌ Kaggle API not configured!")
            print("\nTo set up Kaggle API:")
            print("1. Go to https://www.kaggle.com/account")
            print("2. Click 'Create New API Token'")
            print("3. Save kaggle.json to ~/.kaggle/")
            print("4. Run: chmod 600 ~/.kaggle/kaggle.json")
            return False
        return True
    
    def download_dataset(self, dataset_name, description):
        """Download a dataset from Kaggle"""
        print(f"\n📥 Downloading: {description}")
        print(f"   Dataset: {dataset_name}")
        
        try:
            # Download to output directory
            cmd = [
                "kaggle", "datasets", "download",
                "-d", dataset_name,
                "-p", self.output_dir,
                "--unzip"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"   ✅ Successfully downloaded")
                return True
            else:
                print(f"   ❌ Error: {result.stderr}")
                return False
                
        except FileNotFoundError:
            print("   ❌ Kaggle CLI not found. Install with: pip install kaggle")
            return False
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return False
    
    def download_recommended_datasets(self):
        """Download recommended datasets for the POC"""
        
        datasets = [
            {
                "name": "mexwell/ucs-satellite-database",
                "description": "UCS Satellite Database (7,560 satellites, Oct 2024)",
                "files_expected": ["UCS-Satellite-Database-5-1-2024.xlsx", "UCS-Satellite-Database 5-1-2024.xlsx"]
            },
            {
                "name": "sujaykapadnis/every-known-satellite-orbiting-earth",
                "description": "Every known satellite orbiting Earth (6,718 satellites)",
                "files_expected": ["UCS-Satellite-Database-5-1-2023.xlsx"]
            },
            {
                "name": "kandhalkhandeka/satellites-and-debris-in-earths-orbit",
                "description": "Satellites and debris in Earth's orbit",
                "files_expected": ["Space_Corrected.csv"]
            },
            {
                "name": "benguthrie/inorbit-satellite-image-datasets",
                "description": "In-orbit satellite proximity operations data",
                "files_expected": []
            },
            {
                "name": "navins7/telecommunications",
                "description": "Telecommunications infrastructure data",
                "files_expected": []
            }
        ]
        
        successful = 0
        failed = 0
        
        for dataset in datasets:
            if self.download_dataset(dataset["name"], dataset["description"]):
                successful += 1
            else:
                failed += 1
        
        return successful, failed
    
    def process_downloaded_data(self):
        """Process and consolidate downloaded Kaggle data"""
        print("\n📊 Processing downloaded Kaggle data...")
        
        processed_files = []
        
        # Look for satellite databases
        excel_files = [f for f in os.listdir(self.output_dir) if f.endswith('.xlsx')]
        csv_files = [f for f in os.listdir(self.output_dir) if f.endswith('.csv')]
        
        # Process UCS Satellite Database if found
        ucs_files = [f for f in excel_files if 'UCS' in f and 'Satellite' in f]
        if ucs_files:
            latest_ucs = sorted(ucs_files)[-1]  # Get the most recent
            print(f"\n✅ Found UCS Satellite Database: {latest_ucs}")
            
            try:
                # Read and process
                df = pd.read_excel(os.path.join(self.output_dir, latest_ucs))
                
                # Extract key information
                satellite_summary = {
                    'total_satellites': len(df),
                    'by_country': df['Country of Operator/Owner'].value_counts().head(10).to_dict() if 'Country of Operator/Owner' in df.columns else {},
                    'by_purpose': df['Purpose'].value_counts().head(10).to_dict() if 'Purpose' in df.columns else {},
                    'by_orbit': df['Class of Orbit'].value_counts().to_dict() if 'Class of Orbit' in df.columns else {},
                    'file': latest_ucs,
                    'processed_date': datetime.now().isoformat()
                }
                
                # Save summary
                with open(os.path.join(self.output_dir, 'satellite_database_summary.json'), 'w') as f:
                    json.dump(satellite_summary, f, indent=2)
                
                processed_files.append(latest_ucs)
                print(f"   Total satellites: {satellite_summary['total_satellites']}")
                
            except Exception as e:
                print(f"   ❌ Error processing UCS database: {e}")
        
        # Process space debris data if found
        if 'Space_Corrected.csv' in csv_files:
            print(f"\n✅ Found Space Debris Database")
            try:
                df = pd.read_csv(os.path.join(self.output_dir, 'Space_Corrected.csv'))
                print(f"   Total objects: {len(df)}")
                processed_files.append('Space_Corrected.csv')
            except Exception as e:
                print(f"   ❌ Error processing space debris: {e}")
        
        return processed_files


def main():
    """Main function to download Kaggle data"""
    print("🚀 Kaggle Data Downloader for Ground Station Intelligence POC")
    print("=" * 60)
    
    downloader = KaggleDataDownloader()
    
    # Check if Kaggle is set up
    if not downloader.check_kaggle_setup():
        print("\n📋 Manual Download Instructions:")
        print("\nYou can manually download these datasets from Kaggle:")
        print("\n1. UCS Satellite Database (Most Recent)")
        print("   https://www.kaggle.com/datasets/mexwell/ucs-satellite-database")
        print("\n2. Satellites and Debris in Orbit")
        print("   https://www.kaggle.com/datasets/kandhalkhandeka/satellites-and-debris-in-earths-orbit")
        print("\n3. Telecommunications Infrastructure")
        print("   https://www.kaggle.com/datasets/navins7/telecommunications")
        
        print("\nAfter downloading, place files in: data/raw/kaggle/")
        return
    
    # Try to install kaggle if not present
    try:
        import kaggle
    except ImportError:
        print("Installing Kaggle API...")
        subprocess.check_call(['pip', 'install', 'kaggle'])
    
    # Download datasets
    print("\n📥 Downloading recommended Kaggle datasets...")
    successful, failed = downloader.download_recommended_datasets()
    
    # Process downloaded data
    if successful > 0:
        processed = downloader.process_downloaded_data()
        
        print("\n" + "=" * 60)
        print("📊 KAGGLE DOWNLOAD SUMMARY")
        print("=" * 60)
        print(f"✅ Successfully downloaded: {successful} datasets")
        print(f"❌ Failed: {failed} datasets")
        print(f"📁 Processed files: {len(processed)}")
        print(f"\nData location: {downloader.output_dir}")
    else:
        print("\n❌ No datasets were successfully downloaded")
        print("Please check your Kaggle API credentials and try again")


if __name__ == "__main__":
    main()