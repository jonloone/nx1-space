#!/usr/bin/env python3
"""
Examine the structure of GPM NetCDF files
"""

import netCDF4 as nc
import numpy as np

# Open a sample file
nc_file = "data/raw/precipitation/3B-MO.MS.MRG.3IMERG.20230101-S000000-E235959.01.V07B.HDF5.nc4"
dataset = nc.Dataset(nc_file, 'r')

print("🔍 Examining GPM NetCDF Structure")
print("=" * 60)
print(f"File: {nc_file}")

# Print dimensions
print("\n📏 Dimensions:")
for dim_name, dim in dataset.dimensions.items():
    print(f"  {dim_name}: {len(dim)}")

# Print variables
print("\n📊 Variables:")
for var_name, var in dataset.variables.items():
    print(f"  {var_name}: {var.dimensions} - shape {var.shape}")
    if hasattr(var, 'units'):
        print(f"    Units: {var.units}")
    if hasattr(var, 'long_name'):
        print(f"    Description: {var.long_name}")
    
    # Show range for coordinate variables
    if var_name in ['lat', 'lon', 'latitude', 'longitude']:
        data = var[:]
        print(f"    Range: [{data.min():.2f}, {data.max():.2f}]")

# Check precipitation variable details
print("\n🌧️  Precipitation Variable Details:")
precip_var_names = ['precipitation', 'precip', 'precipitationCal', 'HQprecipitation']
for var_name in precip_var_names:
    if var_name in dataset.variables:
        var = dataset.variables[var_name]
        print(f"  Found: {var_name}")
        print(f"  Shape: {var.shape}")
        print(f"  Dimensions: {var.dimensions}")
        data = var[:]
        print(f"  Data range: [{np.nanmin(data):.3f}, {np.nanmax(data):.3f}]")
        break

dataset.close()