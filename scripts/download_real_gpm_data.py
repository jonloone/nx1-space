#!/usr/bin/env python3
"""
Download real NASA GPM precipitation data with Earthdata authentication
"""

import os
import subprocess
import time
from datetime import datetime

def download_real_gpm_data():
    """Download GPM precipitation data with authentication"""
    
    base_url = "https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGM.07"
    output_dir = "data/raw/precipitation"
    os.makedirs(output_dir, exist_ok=True)
    
    # Get current date for limiting downloads
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    downloaded = 0
    failed = 0
    
    print("🌧️  Downloading real NASA GPM precipitation data")
    print("   Using Earthdata authentication")
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
            
            # Construct filename
            filename = f"3B-MO.MS.MRG.3IMERG.{year}{month_str}01-S000000-E235959.{month_str}.V07B.HDF5"
            
            # Full URL
            url = f"{base_url}/{year}/{filename}"
            
            # Output filename
            output_file = os.path.join(output_dir, f"gpm_precip_{year}_{month_str}.hdf5")
            
            # Skip if already exists
            if os.path.exists(output_file) and os.path.getsize(output_file) > 1000000:
                print(f"  ✓ {year}-{month_str} already exists ({os.path.getsize(output_file)/1024/1024:.1f} MB)")
                downloaded += 1
                continue
            
            print(f"  📥 Downloading {year}-{month_str}...", end="", flush=True)
            
            # Download using wget with netrc authentication
            cmd = [
                "wget",
                "--load-cookies", "~/.urs_cookies",
                "--save-cookies", "~/.urs_cookies",
                "--keep-session-cookies",
                "--no-check-certificate",
                "-q",
                "-O", output_file,
                url
            ]
            
            try:
                # First attempt
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                
                # Check if file was downloaded successfully
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000000:
                    size_mb = os.path.getsize(output_file) / 1024 / 1024
                    print(f" ✓ ({size_mb:.1f} MB)")
                    downloaded += 1
                else:
                    # Try with curl as fallback
                    if os.path.exists(output_file):
                        os.remove(output_file)
                    
                    curl_cmd = [
                        "curl",
                        "-n",  # Use .netrc
                        "-c", "~/.urs_cookies",
                        "-b", "~/.urs_cookies",
                        "-L",  # Follow redirects
                        "-f",  # Fail on HTTP errors
                        "-s",  # Silent
                        "-o", output_file,
                        url
                    ]
                    
                    result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=120)
                    
                    if os.path.exists(output_file) and os.path.getsize(output_file) > 1000000:
                        size_mb = os.path.getsize(output_file) / 1024 / 1024
                        print(f" ✓ ({size_mb:.1f} MB via curl)")
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
            time.sleep(2)
    
    print("\n" + "=" * 60)
    print(f"Download summary:")
    print(f"  ✅ Successfully downloaded: {downloaded}")
    print(f"  ❌ Failed: {failed}")
    
    if downloaded > 0:
        print(f"\n✅ Real GPM data downloaded to: {output_dir}")
        
        # List downloaded files
        files = [f for f in os.listdir(output_dir) if f.endswith('.hdf5')]
        if files:
            print(f"\nDownloaded files:")
            for f in sorted(files)[:5]:
                size_mb = os.path.getsize(os.path.join(output_dir, f)) / 1024 / 1024
                print(f"  - {f} ({size_mb:.1f} MB)")
            if len(files) > 5:
                print(f"  ... and {len(files)-5} more files")
    
    return downloaded, failed


if __name__ == "__main__":
    # Download the real data
    downloaded, failed = download_real_gpm_data()
    
    if downloaded > 0:
        print("\n🎉 Successfully downloaded real NASA GPM precipitation data!")
        print("\nNext steps:")
        print("1. Process the HDF5 files to extract precipitation values")
        print("2. Create weather patterns from real data")
        print("3. Integrate into the ground station graph")
    else:
        print("\n❌ Failed to download data. Please check:")
        print("1. Internet connection")
        print("2. Earthdata credentials in .netrc")
        print("3. NASA server availability")