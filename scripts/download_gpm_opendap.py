#!/usr/bin/env python3
"""
Download NASA GPM precipitation data using OPeNDAP .dap.nc4 endpoints
"""

import os
import subprocess
import time
from datetime import datetime

def download_gpm_opendap():
    """Download GPM precipitation data using the .dap.nc4 endpoints"""
    
    base_url = "https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07"
    output_dir = "data/raw/precipitation"
    os.makedirs(output_dir, exist_ok=True)
    
    # Get current date for limiting downloads
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    downloaded = 0
    failed = 0
    
    print("🌧️  Downloading NASA GPM precipitation data via OPeNDAP")
    print("=" * 60)
    
    for year in [2023, 2024, 2025]:
        print(f"\n📅 Year {year}:")
        
        for month in range(1, 13):
            # Skip future months
            if year == current_year and month > current_month:
                break
            if year > current_year:
                break
            
            # Format month with leading zero
            month_str = f"{month:02d}"
            
            # Construct filename using NASA's naming convention
            # Add .dap.nc4 for OPeNDAP access
            filename = f"3B-MO.MS.MRG.3IMERG.{year}{month_str}01-S000000-E235959.{month_str}.V07B.HDF5.dap.nc4"
            
            # Full URL
            url = f"{base_url}/{year}/{filename}"
            
            # Output filename
            output_file = os.path.join(output_dir, f"gpm_precip_{year}_{month_str}.nc4")
            
            # Skip if already exists
            if os.path.exists(output_file):
                print(f"  ✓ {year}-{month_str} already exists")
                downloaded += 1
                continue
            
            print(f"  📥 Downloading {year}-{month_str}...", end="", flush=True)
            
            # Download using wget
            cmd = [
                "wget", 
                "--no-check-certificate",
                "-q",
                "-O", output_file,
                url
            ]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                
                # Check if file was downloaded and has content
                if os.path.exists(output_file) and os.path.getsize(output_file) > 10000:
                    print(" ✓")
                    downloaded += 1
                else:
                    print(" ❌")
                    if os.path.exists(output_file):
                        os.remove(output_file)
                    failed += 1
                
            except subprocess.TimeoutExpired:
                print(" ❌ (timeout)")
                if os.path.exists(output_file):
                    os.remove(output_file)
                failed += 1
            except Exception as e:
                print(f" ❌ ({str(e)})")
                if os.path.exists(output_file):
                    os.remove(output_file)
                failed += 1
            
            # Be polite to the server
            time.sleep(1)
    
    print("\n" + "=" * 60)
    print(f"Download summary:")
    print(f"  ✅ Successfully downloaded: {downloaded}")
    print(f"  ❌ Failed: {failed}")
    
    return downloaded, failed


if __name__ == "__main__":
    # Download the data
    downloaded, failed = download_gpm_opendap()
    
    if downloaded > 0:
        print("\n✅ GPM precipitation data downloaded successfully!")
        print(f"   Location: data/raw/precipitation/")
        print("   Format: NetCDF4 (.nc4)")
        print("\nNext steps:")
        print("1. Process the NetCDF files to extract precipitation data")
        print("2. Integrate with ground station weather analysis")
    else:
        print("\n⚠️  No files downloaded. Creating sample data instead...")
        # Import and run the sample data creation
        from download_gpm_correctly import create_sample_precipitation_data
        create_sample_precipitation_data()