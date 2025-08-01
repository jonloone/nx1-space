#!/usr/bin/env python3
"""
Create sample ground station data for testing the pipeline
"""

import pandas as pd
import numpy as np
import json
import os

# Create data/raw directory if it doesn't exist
os.makedirs('data/raw', exist_ok=True)

# Create sample SatNOGS stations
np.random.seed(42)

# Major cities around the world
cities = [
    {'name': 'New York', 'lat': 40.7128, 'lon': -74.0060, 'country': 'US'},
    {'name': 'London', 'lat': 51.5074, 'lon': -0.1278, 'country': 'GB'},
    {'name': 'Tokyo', 'lat': 35.6762, 'lon': 139.6503, 'country': 'JP'},
    {'name': 'Singapore', 'lat': 1.3521, 'lon': 103.8198, 'country': 'SG'},
    {'name': 'Sydney', 'lat': -33.8688, 'lon': 151.2093, 'country': 'AU'},
    {'name': 'Dubai', 'lat': 25.2048, 'lon': 55.2708, 'country': 'AE'},
    {'name': 'São Paulo', 'lat': -23.5505, 'lon': -46.6333, 'country': 'BR'},
    {'name': 'Mumbai', 'lat': 19.0760, 'lon': 72.8777, 'country': 'IN'},
    {'name': 'Paris', 'lat': 48.8566, 'lon': 2.3522, 'country': 'FR'},
    {'name': 'Berlin', 'lat': 52.5200, 'lon': 13.4050, 'country': 'DE'},
]

stations = []
station_id = 1

# Create multiple stations around each city
for city in cities:
    # Main station in city
    stations.append({
        'id': station_id,
        'station_id': station_id,
        'name': f"{city['name']} Main Ground Station",
        'latitude': city['lat'] + np.random.normal(0, 0.1),
        'longitude': city['lon'] + np.random.normal(0, 0.1),
        'altitude': np.random.uniform(10, 200),
        'status': 'Online',
        'created': '2020-01-01',
        'observations': np.random.randint(1000, 50000),
        'country': city['country']
    })
    station_id += 1
    
    # Additional stations nearby
    for i in range(np.random.randint(1, 4)):
        stations.append({
            'id': station_id,
            'station_id': station_id,
            'name': f"{city['name']} Station {i+2}",
            'latitude': city['lat'] + np.random.normal(0, 0.5),
            'longitude': city['lon'] + np.random.normal(0, 0.5),
            'altitude': np.random.uniform(10, 500),
            'status': 'Online' if np.random.random() > 0.1 else 'Testing',
            'created': f"202{np.random.randint(0, 3)}-{np.random.randint(1, 12):02d}-01",
            'observations': np.random.randint(100, 10000),
            'country': city['country']
        })
        station_id += 1

# Add some remote stations
remote_locations = [
    {'name': 'Azores Remote', 'lat': 37.7412, 'lon': -25.6756, 'country': 'PT'},
    {'name': 'Alaska Remote', 'lat': 64.2008, 'lon': -149.4937, 'country': 'US'},
    {'name': 'Madagascar Remote', 'lat': -18.7669, 'lon': 46.8691, 'country': 'MG'},
    {'name': 'Iceland Remote', 'lat': 64.9631, 'lon': -19.0208, 'country': 'IS'},
    {'name': 'Hawaii Remote', 'lat': 19.8968, 'lon': -155.5828, 'country': 'US'},
]

for loc in remote_locations:
    stations.append({
        'id': station_id,
        'station_id': station_id,
        'name': loc['name'],
        'latitude': loc['lat'],
        'longitude': loc['lon'],
        'altitude': np.random.uniform(100, 1000),
        'status': 'Online',
        'created': '2021-06-01',
        'observations': np.random.randint(5000, 20000),
        'country': loc['country']
    })
    station_id += 1

# Save as parquet
stations_df = pd.DataFrame(stations)
stations_df.to_parquet('data/raw/satnogs_stations.parquet')
print(f"Created {len(stations)} ground stations")

# Create sample observations
observations = []
obs_id = 1

for station in stations[:20]:  # Sample observations for first 20 stations
    num_obs = min(100, station['observations'])
    for _ in range(num_obs):
        observations.append({
            'id': obs_id,
            'ground_station': station['id'],
            'start': f"2024-{np.random.randint(1, 12):02d}-{np.random.randint(1, 28):02d}T{np.random.randint(0, 24):02d}:00:00Z",
            'vetted_status': np.random.choice(['good', 'bad', 'unknown'], p=[0.8, 0.1, 0.1]),
            'satellite_name': np.random.choice(['NOAA-15', 'NOAA-18', 'ISS', 'METEOR-M2', 'STARLINK-1234'])
        })
        obs_id += 1

obs_df = pd.DataFrame(observations)
obs_df.to_parquet('data/raw/satnogs_observations.parquet')
print(f"Created {len(observations)} observations")

# Create filtered weather stations
weather_stations = []
ws_id = 1

for city in cities:
    # Create 1-3 weather stations near each city
    for i in range(np.random.randint(1, 4)):
        weather_stations.append({
            'USAF': f"{ws_id:06d}",
            'WBAN': f"{ws_id:05d}",
            'STATION NAME': f"{city['name']} Weather Station {i+1}",
            'CTRY': city['country'],
            'LAT': city['lat'] + np.random.normal(0, 0.2),
            'LON': city['lon'] + np.random.normal(0, 0.2),
            'ELEV(M)': np.random.uniform(10, 200),
            'BEGIN': '20100101',
            'END': '20241231'
        })
        ws_id += 1

weather_df = pd.DataFrame(weather_stations)
weather_df.to_parquet('data/raw/filtered_weather_stations.parquet')
print(f"Created {len(weather_stations)} weather stations")

print("\nSample data created successfully!")
print("Files created:")
print("- data/raw/satnogs_stations.parquet")
print("- data/raw/satnogs_observations.parquet")
print("- data/raw/filtered_weather_stations.parquet")