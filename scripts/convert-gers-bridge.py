#!/usr/bin/env python3
"""
Convert GERS Bridge Files from Parquet to searchable JSON indices
This will be used when we have actual Overture data
"""

import json
import os
import sys

try:
    import pandas as pd
    import pyarrow.parquet as pq
except ImportError:
    print("Installing required packages...")
    os.system("pip install pandas pyarrow")
    import pandas as pd
    import pyarrow.parquet as pq

def process_gers_bridge():
    """
    Convert GERS bridge files to searchable JSON index
    Bridge files contain: GERS ID ↔ names, categories, relationships
    """
    
    bridge_dir = "/mnt/blockstorage/nx1-space/frontend/public/data/gers/bridge-files"
    output_dir = "/mnt/blockstorage/nx1-space/frontend/public/data/gers"
    
    # Check if we have actual Parquet files
    places_file = os.path.join(bridge_dir, "places-bridge.parquet")
    buildings_file = os.path.join(bridge_dir, "buildings-bridge.parquet")
    
    if not os.path.exists(places_file) or os.path.getsize(places_file) == 0:
        print("No actual Parquet files found. Using sample data.")
        return
    
    print("Processing GERS Bridge Files...")
    
    # Load places bridge file
    places_df = pd.read_parquet(places_file)
    
    # Create searchable index
    gers_index = {}
    name_to_id = {}
    
    for _, row in places_df.iterrows():
        gers_id = row.get('id', '')
        
        # Extract all names (primary and alternates)
        names = []
        if 'names' in row and row['names']:
            if isinstance(row['names'], dict):
                # Handle different name structures
                if 'primary' in row['names']:
                    names.append(row['names']['primary'])
                if 'common' in row['names']:
                    names.extend(row['names']['common'])
            elif isinstance(row['names'], list):
                names = row['names']
            elif isinstance(row['names'], str):
                names = [row['names']]
        
        # Create entity entry
        gers_index[gers_id] = {
            'id': gers_id,
            'names': names,
            'category': row.get('category', ''),
            'subtype': row.get('subtype', ''),
            'confidence': row.get('confidence', 1.0),
            'geometry': row.get('geometry', None)
        }
        
        # Build reverse index for search
        for name in names:
            name_lower = name.lower()
            if name_lower not in name_to_id:
                name_to_id[name_lower] = []
            name_to_id[name_lower].append(gers_id)
    
    # Save as JSON
    with open(os.path.join(output_dir, 'gers-index.json'), 'w') as f:
        json.dump(gers_index, f, indent=2)
    
    with open(os.path.join(output_dir, 'name-to-id.json'), 'w') as f:
        json.dump(name_to_id, f, indent=2)
    
    print(f"Processed {len(gers_index)} GERS entities")
    print(f"Indexed {len(name_to_id)} unique names")

if __name__ == "__main__":
    process_gers_bridge()
