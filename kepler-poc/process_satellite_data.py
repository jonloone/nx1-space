#!/usr/bin/env python3
"""
Process satellite data from UCS Satellite Database
Filter for SES and Intelsat satellites and prepare for visualization
"""

import json
import pandas as pd
from pathlib import Path

def load_satellite_data(file_path):
    """
    Load and parse the UCS Satellite Database
    Expected format: tab-delimited text file
    """
    try:
        # Try different encodings
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                df = pd.read_csv(file_path, sep='\t', encoding=encoding)
                print(f"Successfully loaded data with {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
        
        print(f"Loaded {len(df)} satellites from database")
        return df
    except Exception as e:
        print(f"Error loading satellite data: {e}")
        return None

def filter_ses_intelsat(df):
    """
    Filter for SES and Intelsat satellites
    """
    # Common column names variations
    operator_columns = ['Operator/Owner', 'Operator', 'Owner', 'Country of Operator/Owner']
    
    operator_col = None
    for col in operator_columns:
        if col in df.columns:
            operator_col = col
            break
    
    if not operator_col:
        print("Could not find operator column")
        print("Available columns:", df.columns.tolist())
        return pd.DataFrame()
    
    # Filter for SES and Intelsat
    mask = df[operator_col].str.contains('SES|Intelsat', case=False, na=False)
    filtered_df = df[mask].copy()
    
    print(f"Found {len(filtered_df)} SES/Intelsat satellites")
    
    # Group by operator
    operator_counts = filtered_df[operator_col].value_counts()
    print("\nSatellites by operator:")
    for operator, count in operator_counts.items():
        print(f"  {operator}: {count}")
    
    return filtered_df

def process_satellite_data(df):
    """
    Extract relevant fields and process for visualization
    """
    processed_satellites = []
    
    # Column mapping (handle variations)
    column_map = {
        'name': ['Name of Satellite', 'Satellite Name', 'Name'],
        'operator': ['Operator/Owner', 'Operator', 'Owner'],
        'orbit_class': ['Class of Orbit', 'Orbit Class', 'Type of Orbit'],
        'longitude': ['Longitude of GEO (degrees)', 'Longitude', 'Longitude of GEO'],
        'apogee': ['Apogee (km)', 'Apogee', 'Apogee (Kilometers)'],
        'perigee': ['Perigee (km)', 'Perigee', 'Perigee (Kilometers)'],
        'inclination': ['Inclination (degrees)', 'Inclination', 'Inclination (Degrees)'],
        'purpose': ['Purpose', 'Users', 'Purpose/Users'],
        'launch_date': ['Date of Launch', 'Launch Date', 'Launch']
    }
    
    # Find actual column names
    actual_columns = {}
    for field, possibilities in column_map.items():
        for col in possibilities:
            if col in df.columns:
                actual_columns[field] = col
                break
    
    print("\nColumn mapping:")
    for field, col in actual_columns.items():
        print(f"  {field}: {col}")
    
    # Process each satellite
    for idx, row in df.iterrows():
        try:
            satellite = {
                'id': f"sat_{idx}",
                'name': str(row.get(actual_columns.get('name', ''), 'Unknown')),
                'operator': str(row.get(actual_columns.get('operator', ''), 'Unknown')),
                'orbit_class': str(row.get(actual_columns.get('orbit_class', ''), 'Unknown')),
                'purpose': str(row.get(actual_columns.get('purpose', ''), 'Unknown')),
                'launch_date': str(row.get(actual_columns.get('launch_date', ''), 'Unknown'))
            }
            
            # Parse numeric fields
            if 'longitude' in actual_columns:
                try:
                    lon_str = str(row[actual_columns['longitude']])
                    # Handle various formats (e.g., "105.5 E", "-105.5", "105.5W")
                    lon_str = lon_str.replace('°', '').strip()
                    if 'E' in lon_str:
                        satellite['longitude'] = float(lon_str.replace('E', '').strip())
                    elif 'W' in lon_str:
                        satellite['longitude'] = -float(lon_str.replace('W', '').strip())
                    else:
                        satellite['longitude'] = float(lon_str)
                except:
                    satellite['longitude'] = None
            
            for field in ['apogee', 'perigee', 'inclination']:
                if field in actual_columns:
                    try:
                        satellite[field] = float(row[actual_columns[field]])
                    except:
                        satellite[field] = None
            
            # Determine if it's a GEO satellite
            if satellite['orbit_class'] and 'GEO' in satellite['orbit_class'].upper():
                satellite['is_geo'] = True
                # GEO satellites should have altitude around 35,786 km
                if satellite.get('apogee') and satellite.get('perigee'):
                    avg_altitude = (satellite['apogee'] + satellite['perigee']) / 2
                    satellite['altitude'] = avg_altitude
                else:
                    satellite['altitude'] = 35786  # Standard GEO altitude
            else:
                satellite['is_geo'] = False
                satellite['altitude'] = None
            
            # Determine operator type for coloring
            if 'SES' in satellite['operator'].upper():
                satellite['operator_type'] = 'SES'
                satellite['color'] = [0, 170, 255]  # Blue
            else:
                satellite['operator_type'] = 'Intelsat'
                satellite['color'] = [255, 119, 0]  # Orange
            
            processed_satellites.append(satellite)
            
        except Exception as e:
            print(f"Error processing satellite {idx}: {e}")
    
    # Filter for GEO satellites with valid positions
    geo_satellites = [
        sat for sat in processed_satellites 
        if sat['is_geo'] and sat.get('longitude') is not None
    ]
    
    print(f"\nProcessed {len(geo_satellites)} GEO satellites with valid positions")
    
    # Summary statistics
    ses_count = sum(1 for sat in geo_satellites if sat['operator_type'] == 'SES')
    intelsat_count = len(geo_satellites) - ses_count
    
    print(f"  SES: {ses_count}")
    print(f"  Intelsat: {intelsat_count}")
    
    return geo_satellites

def calculate_satellite_footprints(satellites):
    """
    Calculate approximate coverage footprints for GEO satellites
    """
    import math
    
    footprints = []
    
    for sat in satellites:
        if sat.get('longitude') is None:
            continue
        
        # GEO satellite coverage calculation
        # Approximate coverage radius based on elevation angle
        # Typical minimum elevation angle: 5-10 degrees
        earth_radius = 6371  # km
        sat_altitude = sat.get('altitude', 35786)  # km
        min_elevation = 5  # degrees
        
        # Calculate coverage radius
        angle = math.acos(
            earth_radius / (earth_radius + sat_altitude) * 
            math.cos(math.radians(90 - min_elevation))
        )
        coverage_radius_deg = math.degrees(angle)
        
        # Create footprint polygon (simplified circle)
        num_points = 36
        footprint_coords = []
        for i in range(num_points + 1):
            angle = (i / num_points) * 2 * math.pi
            lat = coverage_radius_deg * math.sin(angle)
            lon = sat['longitude'] + coverage_radius_deg * math.cos(angle) / math.cos(math.radians(lat))
            
            # Clamp latitude to valid range
            lat = max(-85, min(85, lat))
            
            footprint_coords.append([lon, lat])
        
        footprints.append({
            'id': sat['id'] + '_footprint',
            'satellite_id': sat['id'],
            'satellite_name': sat['name'],
            'operator': sat['operator'],
            'operator_type': sat['operator_type'],
            'center': [sat['longitude'], 0],
            'footprint': footprint_coords,
            'coverage_radius': coverage_radius_deg
        })
    
    return footprints

def save_processed_data(satellites, footprints, output_dir='data'):
    """
    Save processed satellite data in JSON format
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # Save satellite positions
    satellites_file = output_dir / 'geo_satellites.json'
    with open(satellites_file, 'w') as f:
        json.dump({
            'type': 'satellite_data',
            'version': '1.0',
            'satellites': satellites,
            'count': len(satellites)
        }, f, indent=2)
    
    print(f"\nSaved {len(satellites)} satellites to {satellites_file}")
    
    # Save footprints
    footprints_file = output_dir / 'satellite_footprints.json'
    with open(footprints_file, 'w') as f:
        json.dump({
            'type': 'footprint_data',
            'version': '1.0',
            'footprints': footprints,
            'count': len(footprints)
        }, f, indent=2)
    
    print(f"Saved {len(footprints)} footprints to {footprints_file}")

def main():
    """
    Main processing function
    """
    # Input file path (update this to your actual file location)
    input_file = 'UCS-Satellite-Database.txt'
    
    print("=== Satellite Data Processor ===")
    print(f"Processing: {input_file}")
    
    # Check if file exists
    if not Path(input_file).exists():
        print(f"\nError: File '{input_file}' not found!")
        print("Please download the UCS Satellite Database from:")
        print("https://www.ucsusa.org/resources/satellite-database")
        return
    
    # Load data
    df = load_satellite_data(input_file)
    if df is None:
        return
    
    # Filter for SES/Intelsat
    filtered_df = filter_ses_intelsat(df)
    if filtered_df.empty:
        return
    
    # Process satellite data
    satellites = process_satellite_data(filtered_df)
    
    # Calculate footprints
    footprints = calculate_satellite_footprints(satellites)
    
    # Save results
    save_processed_data(satellites, footprints)
    
    print("\n=== Processing Complete ===")

if __name__ == "__main__":
    main()