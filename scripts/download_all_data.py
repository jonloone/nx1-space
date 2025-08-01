#!/usr/bin/env python3
"""
Ground Station Intelligence POC - Master Data Download Script
Downloads all required data sources for the ground station investment analysis
"""

import os
import requests
import pandas as pd
import time
from datetime import datetime, timedelta
import json
import zipfile
import tarfile
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GroundStationDataDownloader:
    def __init__(self, output_dir="data/raw"):
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'GroundStationPOC/1.0'
        })
        
    def download_satnogs_data(self):
        """Download SatNOGS ground stations and observations"""
        logger.info("Downloading SatNOGS data...")
        
        # Stations
        stations = []
        url = "https://network.satnogs.org/api/stations/"
        
        while url:
            try:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                data = response.json()
                if isinstance(data, dict):
                    stations.extend(data.get('results', []))
                    url = data.get('next')
                elif isinstance(data, list):
                    stations.extend(data)
                    url = None  # No pagination for list response
                time.sleep(0.5)  # Be nice to the API
            except Exception as e:
                logger.error(f"Error fetching SatNOGS stations: {e}")
                break
            
        # Save stations
        if stations:
            pd.DataFrame(stations).to_parquet(
                f"{self.output_dir}/satnogs_stations.parquet"
            )
            logger.info(f"Downloaded {len(stations)} stations")
        
        # Get observations for top 100 stations (POC limit)
        top_stations = sorted(
            stations, 
            key=lambda x: x.get('observations', 0), 
            reverse=True
        )[:100]
        
        observations = []
        for station in top_stations[:10]:  # Limit to 10 for POC
            try:
                url = f"https://network.satnogs.org/api/observations/?ground_station={station['id']}&vetted_status=good&limit=100"
                response = self.session.get(url, timeout=30)
                if response.status_code == 200:
                    obs_data = response.json()
                    observations.extend(obs_data.get('results', []))
                time.sleep(0.5)
            except Exception as e:
                logger.error(f"Error fetching observations for station {station['id']}: {e}")
                
        if observations:
            pd.DataFrame(observations).to_parquet(
                f"{self.output_dir}/satnogs_observations.parquet"
            )
            logger.info(f"Downloaded {len(observations)} observations")
        
    def download_weather_data(self):
        """Download NOAA weather station data"""
        logger.info("Downloading weather data...")
        
        try:
            # Station metadata
            url = "https://www.ncei.noaa.gov/data/global-hourly/doc/isd-history.csv"
            response = self.session.get(url, timeout=60)
            response.raise_for_status()
            
            with open(f"{self.output_dir}/weather_stations.csv", 'wb') as f:
                f.write(response.content)
                
            # Parse and filter to relevant countries
            stations_df = pd.read_csv(f"{self.output_dir}/weather_stations.csv")
            
            # Filter to countries with significant satellite infrastructure
            target_countries = ['US', 'GB', 'FR', 'DE', 'JP', 'AU', 'SG', 'BR', 'IN', 'AE']
            filtered = stations_df[stations_df['CTRY'].isin(target_countries)]
            
            filtered.to_parquet(f"{self.output_dir}/filtered_weather_stations.parquet")
            logger.info(f"Filtered to {len(filtered)} weather stations")
        except Exception as e:
            logger.error(f"Error downloading weather data: {e}")
        
    def download_population_data(self):
        """Download population density grid (simplified for POC)"""
        logger.info("Creating population data...")
        
        # For POC, create synthetic grid around major cities
        major_cities = pd.DataFrame([
            {'city': 'New York', 'lat': 40.7128, 'lon': -74.0060, 'population': 8.3e6},
            {'city': 'London', 'lat': 51.5074, 'lon': -0.1278, 'population': 9.0e6},
            {'city': 'Tokyo', 'lat': 35.6762, 'lon': 139.6503, 'population': 13.5e6},
            {'city': 'Singapore', 'lat': 1.3521, 'lon': 103.8198, 'population': 5.7e6},
            {'city': 'São Paulo', 'lat': -23.5505, 'lon': -46.6333, 'population': 12.3e6},
            {'city': 'Mumbai', 'lat': 19.0760, 'lon': 72.8777, 'population': 20.4e6},
            {'city': 'Sydney', 'lat': -33.8688, 'lon': 151.2093, 'population': 5.3e6},
            {'city': 'Dubai', 'lat': 25.2048, 'lon': 55.2708, 'population': 3.3e6},
            {'city': 'Lagos', 'lat': 6.5244, 'lon': 3.3792, 'population': 14.8e6},
            {'city': 'Mexico City', 'lat': 19.4326, 'lon': -99.1332, 'population': 21.6e6}
        ])
        
        # Create grid cells around cities
        grid_cells = []
        for _, city in major_cities.iterrows():
            for lat_offset in [-1, 0, 1]:
                for lon_offset in [-1, 0, 1]:
                    grid_cells.append({
                        'grid_id': f"{city['city']}_{lat_offset}_{lon_offset}",
                        'center_lat': city['lat'] + lat_offset,
                        'center_lon': city['lon'] + lon_offset,
                        'population_density': city['population'] / (9 * 111 * 111),  # per km²
                        'urban_area': city['city']
                    })
                    
        pd.DataFrame(grid_cells).to_parquet(
            f"{self.output_dir}/population_grid.parquet"
        )
        logger.info(f"Created {len(grid_cells)} population grid cells")
        
    def download_economic_data(self):
        """Download World Bank economic indicators"""
        logger.info("Downloading economic data...")
        
        indicators = {
            'NY.GDP.PCAP.CD': 'gdp_per_capita',
            'IT.NET.USER.ZS': 'internet_users_pct',
            'SP.POP.GROW': 'population_growth_rate'
        }
        
        base_url = "https://api.worldbank.org/v2/country/all/indicator"
        
        economic_data = []
        for indicator_code, indicator_name in indicators.items():
            try:
                url = f"{base_url}/{indicator_code}?format=json&per_page=500&date=2023"
                response = self.session.get(url, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    if len(data) > 1:
                        for record in data[1]:
                            if record.get('value') is not None:
                                economic_data.append({
                                    'country_code': record['country']['id'],
                                    'country_name': record['country']['value'],
                                    'indicator': indicator_name,
                                    'value': record['value'],
                                    'year': record['date']
                                })
            except Exception as e:
                logger.error(f"Error downloading {indicator_name}: {e}")
                        
        if economic_data:
            pd.DataFrame(economic_data).to_parquet(
                f"{self.output_dir}/economic_indicators.parquet"
            )
            logger.info(f"Downloaded {len(economic_data)} economic indicators")
        
    def download_satellite_data(self):
        """Download current satellite constellation data"""
        logger.info("Downloading satellite data...")
        
        try:
            # Active satellites from Celestrak
            url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json"
            response = self.session.get(url, timeout=60)
            
            if response.status_code == 200:
                satellites = response.json()
                
                # Parse and categorize
                satellite_df = pd.DataFrame(satellites)
                
                # Categorize by orbit
                satellite_df['orbit_type'] = satellite_df.apply(
                    lambda x: self._classify_orbit(x.get('MEAN_MOTION', 0)), 
                    axis=1
                )
                
                satellite_df.to_parquet(
                    f"{self.output_dir}/active_satellites.parquet"
                )
                logger.info(f"Downloaded {len(satellites)} active satellites")
        except Exception as e:
            logger.error(f"Error downloading active satellites: {e}")
            
        try:
            # Starlink constellation specifically
            url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json"
            response = self.session.get(url, timeout=60)
            
            if response.status_code == 200:
                starlink = response.json()
                pd.DataFrame(starlink).to_parquet(
                    f"{self.output_dir}/starlink_constellation.parquet"
                )
                logger.info(f"Downloaded {len(starlink)} Starlink satellites")
        except Exception as e:
            logger.error(f"Error downloading Starlink data: {e}")
            
    def _classify_orbit(self, mean_motion):
        """Classify orbit type based on mean motion"""
        if mean_motion > 14.0:
            return 'LEO'
        elif mean_motion > 2.0:
            return 'MEO'
        else:
            return 'GEO'
            
    def download_all(self):
        """Download all data sources"""
        os.makedirs(self.output_dir, exist_ok=True)
        
        logger.info("Starting comprehensive data download...")
        start_time = datetime.now()
        
        self.download_satnogs_data()
        self.download_weather_data()
        self.download_population_data()
        self.download_economic_data()
        self.download_satellite_data()
        
        elapsed = datetime.now() - start_time
        logger.info(f"\nDownload complete in {elapsed.total_seconds():.1f} seconds")
        
        # Create metadata file
        metadata = {
            'download_date': datetime.now().isoformat(),
            'data_sources': {
                'satnogs': 'https://network.satnogs.org/api/',
                'weather': 'https://www.ncei.noaa.gov/',
                'population': 'synthetic based on major cities',
                'economic': 'https://api.worldbank.org/',
                'satellites': 'https://celestrak.org/'
            },
            'files_created': [f for f in os.listdir(self.output_dir) if f.endswith(('.parquet', '.csv', '.json'))]
        }
        
        with open(f"{self.output_dir}/download_metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
            
        logger.info(f"Created metadata file with {len(metadata['files_created'])} files")

if __name__ == "__main__":
    downloader = GroundStationDataDownloader()
    downloader.download_all()