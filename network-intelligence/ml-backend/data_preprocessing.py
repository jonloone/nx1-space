"""
Data Preprocessing and Feature Engineering for Network Intelligence

This module handles feature engineering from ground station data,
transforming raw station attributes into ML-ready features.

Features:
- Geographic feature engineering (distance calculations, spatial clustering)
- Market and economic indicators
- Technical capability scoring
- Competitive analysis features
- Data validation and cleaning
"""

import logging
import warnings
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from geopy.distance import geodesic
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder, MinMaxScaler

warnings.filterwarnings('ignore', category=RuntimeWarning)
logger = logging.getLogger(__name__)

class FeatureEngineer:
    """
    Feature engineering pipeline for ground station opportunity scoring
    
    Transforms raw station data into ML-ready features including:
    - Geographic and spatial features
    - Market and economic indicators  
    - Technical capability metrics
    - Competitive landscape analysis
    - Risk and opportunity factors
    """
    
    def __init__(self):
        """Initialize feature engineering pipeline"""
        self.scaler = MinMaxScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: List[str] = []
        
        # Default baseline values for missing features
        self.baseline_values = {
            'maritimeDensity': 45.0,
            'gdpPerCapita': 35000.0,
            'populationDensity': 150.0,
            'elevation': 100.0,
            'competitorCount': 3.0,
            'infrastructureScore': 0.6,
            'weatherReliability': 0.75,
            'regulatoryScore': 0.7
        }
    
    def engineer_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """
        Main feature engineering pipeline for training data
        
        Args:
            df: DataFrame with ground station data
            
        Returns:
            Tuple of (feature_matrix, feature_names)
        """
        logger.info(f"Engineering features for {len(df)} stations")
        
        # Create working copy
        data = df.copy()
        
        # Validate required columns
        required_cols = ['latitude', 'longitude', 'revenue', 'profit', 'utilization']
        missing_cols = [col for col in required_cols if col not in data.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
        
        features = []
        feature_names = []
        
        # 1. Geographic Features
        geo_features, geo_names = self._create_geographic_features(data)
        features.append(geo_features)
        feature_names.extend(geo_names)
        
        # 2. Market and Economic Features
        market_features, market_names = self._create_market_features(data)
        features.append(market_features)
        feature_names.extend(market_names)
        
        # 3. Technical Capability Features
        tech_features, tech_names = self._create_technical_features(data)
        features.append(tech_features)
        feature_names.extend(tech_names)
        
        # 4. Competitive Analysis Features
        comp_features, comp_names = self._create_competitive_features(data)
        features.append(comp_features)
        feature_names.extend(comp_names)
        
        # 5. Risk and Opportunity Features
        risk_features, risk_names = self._create_risk_features(data)
        features.append(risk_features)
        feature_names.extend(risk_names)
        
        # 6. External Data Features (simulated for now)
        ext_features, ext_names = self._create_external_features(data)
        features.append(ext_features)
        feature_names.extend(ext_names)
        
        # Combine all features
        X = np.hstack(features)
        
        # Handle any remaining NaN values
        X = self._handle_missing_values(X, feature_names)
        
        # Store feature names for later use
        self.feature_names = feature_names.copy()
        
        logger.info(f"Created {X.shape[1]} features for {X.shape[0]} samples")
        
        return X, feature_names
    
    def prepare_single_prediction(self, feature_dict: Dict[str, Any]) -> Tuple[np.ndarray, List[str]]:
        """
        Prepare features for single prediction
        
        Args:
            feature_dict: Dictionary with feature values
            
        Returns:
            Tuple of (feature_vector, feature_names)
        """
        # Create single-row DataFrame
        df = pd.DataFrame([feature_dict])
        
        # Use training feature engineering but handle missing features
        try:
            X, feature_names = self.engineer_features(df)
            return X[0], feature_names
        except Exception as e:
            logger.warning(f"Full feature engineering failed, using simplified: {e}")
            return self._create_simplified_features(feature_dict)
    
    def _create_geographic_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Create geographic and spatial features"""
        features = []
        feature_names = []
        
        # Basic coordinates (normalized)
        lat_norm = (df['latitude'] + 90) / 180  # Normalize to [0, 1]
        lon_norm = (df['longitude'] + 180) / 360
        features.extend([lat_norm.values, lon_norm.values])
        feature_names.extend(['latitude_norm', 'longitude_norm'])
        
        # Distance from equator (affects satellite visibility)
        equator_distance = np.abs(df['latitude'].values)
        features.append(equator_distance)
        feature_names.append('equator_distance')
        
        # Hemisphere indicators
        northern_hemisphere = (df['latitude'] > 0).astype(int).values
        eastern_hemisphere = (df['longitude'] > 0).astype(int).values
        features.extend([northern_hemisphere, eastern_hemisphere])
        feature_names.extend(['northern_hemisphere', 'eastern_hemisphere'])
        
        # Major shipping lane proximity (simplified)
        shipping_proximity = self._calculate_shipping_proximity(df)
        features.append(shipping_proximity)
        feature_names.append('shipping_proximity')
        
        # Population center proximity (simplified)
        major_cities = [
            (40.7128, -74.0060),  # NYC
            (51.5074, -0.1278),   # London
            (35.6762, 139.6503),  # Tokyo
            (1.3521, 103.8198),   # Singapore
            (-33.8688, 151.2093), # Sydney
        ]
        
        city_proximity = np.zeros(len(df))
        for i, (lat, lon) in enumerate(zip(df['latitude'], df['longitude'])):
            min_distance = min([
                geodesic((lat, lon), city).kilometers 
                for city in major_cities
            ])
            city_proximity[i] = max(0, 1 - min_distance / 10000)  # Normalize to [0, 1]
        
        features.append(city_proximity)
        feature_names.append('major_city_proximity')
        
        return np.column_stack(features), feature_names
    
    def _create_market_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Create market and economic features"""
        features = []
        feature_names = []
        
        # Revenue metrics
        if 'revenue' in df.columns:
            revenue_norm = self.scaler.fit_transform(df[['revenue']]).flatten()
            features.append(revenue_norm)
            feature_names.append('revenue_normalized')
        
        # Profit metrics
        if 'profit' in df.columns:
            profit_norm = self.scaler.fit_transform(df[['profit']]).flatten()
            features.append(profit_norm)
            feature_names.append('profit_normalized')
        
        # Profit margin
        if 'margin' in df.columns:
            margin_clipped = np.clip(df['margin'].values, -1, 1)
            features.append(margin_clipped)
            feature_names.append('profit_margin')
        elif 'profit' in df.columns and 'revenue' in df.columns:
            calculated_margin = df['profit'] / np.maximum(df['revenue'], 1)
            margin_clipped = np.clip(calculated_margin.values, -1, 1)
            features.append(margin_clipped)
            feature_names.append('calculated_margin')
        
        # Utilization metrics
        if 'utilization' in df.columns:
            utilization_norm = df['utilization'].values / 100.0  # Convert to [0, 1]
            features.append(utilization_norm)
            feature_names.append('utilization_rate')
        
        # Market size indicator (based on GDP per capita if available)
        gdp_indicator = np.full(len(df), self.baseline_values['gdpPerCapita'])
        if 'gdpPerCapita' in df.columns:
            gdp_indicator = df['gdpPerCapita'].fillna(self.baseline_values['gdpPerCapita']).values
        
        # Normalize GDP to reasonable scale
        gdp_normalized = np.log1p(gdp_indicator) / np.log1p(100000)  # Log-normalize
        features.append(gdp_normalized)
        feature_names.append('gdp_indicator_log')
        
        # Market category based on revenue size
        if 'revenue' in df.columns:
            revenue_values = df['revenue'].values
            market_size = np.zeros(len(df))
            market_size[revenue_values < 30] = 0  # Small
            market_size[(revenue_values >= 30) & (revenue_values < 50)] = 1  # Medium
            market_size[revenue_values >= 50] = 2  # Large
            features.append(market_size)
            feature_names.append('market_size_category')
        
        return np.column_stack(features), feature_names
    
    def _create_technical_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Create technical capability features"""
        features = []
        feature_names = []
        
        # Satellite visibility metrics
        if 'satellitesVisible' in df.columns:
            sat_vis_norm = df['satellitesVisible'].fillna(15).values / 25.0  # Normalize
            features.append(sat_vis_norm)
            feature_names.append('satellite_visibility')
        
        # Pass duration (for LEO/MEO coverage)
        if 'avgPassDuration' in df.columns:
            pass_duration_norm = df['avgPassDuration'].fillna(40).values / 60.0  # Normalize
            features.append(pass_duration_norm)
            feature_names.append('avg_pass_duration')
        
        # Data capacity
        if 'dataCapacity' in df.columns:
            capacity_log = np.log1p(df['dataCapacity'].fillna(100).values) / np.log1p(200)
            features.append(capacity_log)
            feature_names.append('data_capacity_log')
        
        # Antenna count (if available)
        if 'antennaCount' in df.columns:
            antenna_norm = df['antennaCount'].fillna(3).values / 10.0  # Normalize
            features.append(antenna_norm)
            feature_names.append('antenna_count_norm')
        
        # Service model encoding
        if 'serviceModel' in df.columns:
            service_encoded = self._encode_categorical(df['serviceModel'], 'serviceModel')
            features.append(service_encoded)
            feature_names.append('service_model_encoded')
        
        # Network type encoding  
        if 'networkType' in df.columns:
            network_encoded = self._encode_categorical(df['networkType'], 'networkType')
            features.append(network_encoded)
            feature_names.append('network_type_encoded')
        
        # Frequency band diversity (count of bands)
        if 'frequencyBands' in df.columns:
            band_count = df['frequencyBands'].apply(
                lambda x: len(x) if isinstance(x, list) else 0
            ).values.astype(float)
            band_norm = band_count / 5.0  # Normalize assuming max 5 bands
            features.append(band_norm)
            feature_names.append('frequency_band_count')
        
        # Elevation impact (higher = potentially worse for operations)
        elevation_values = np.full(len(df), self.baseline_values['elevation'])
        if 'elevation' in df.columns:
            elevation_values = df['elevation'].fillna(self.baseline_values['elevation']).values
        
        elevation_factor = 1.0 - (elevation_values / 3000.0)  # Normalize and invert
        elevation_factor = np.clip(elevation_factor, 0, 1)
        features.append(elevation_factor)
        feature_names.append('elevation_advantage')
        
        return np.column_stack(features), feature_names
    
    def _create_competitive_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Create competitive landscape features"""
        features = []
        feature_names = []
        
        # Operator market share (simplified)
        if 'operator' in df.columns:
            operator_counts = df['operator'].value_counts()
            market_share = df['operator'].map(lambda x: operator_counts[x] / len(df)).values
            features.append(market_share)
            feature_names.append('operator_market_share')
        
        # SES vs competitor indicator
        if 'operator' in df.columns:
            ses_indicator = (df['operator'] == 'SES').astype(int).values
            features.append(ses_indicator)
            feature_names.append('ses_operator')
        
        # Competitive density (stations per region)
        competitive_density = self._calculate_competitive_density(df)
        features.append(competitive_density)
        feature_names.append('competitive_density')
        
        # Performance relative to operator average
        if 'revenue' in df.columns and 'operator' in df.columns:
            operator_avg_revenue = df.groupby('operator')['revenue'].transform('mean')
            relative_performance = df['revenue'] / operator_avg_revenue
            relative_performance = np.clip(relative_performance.fillna(1.0).values, 0, 3)
            features.append(relative_performance)
            feature_names.append('relative_revenue_performance')
        
        # Country diversity advantage
        if 'country' in df.columns:
            country_encoded = self._encode_categorical(df['country'], 'country')
            features.append(country_encoded)
            feature_names.append('country_encoded')
        
        return np.column_stack(features), feature_names
    
    def _create_risk_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Create risk and opportunity assessment features"""
        features = []
        feature_names = []
        
        # Weather reliability
        weather_score = np.full(len(df), self.baseline_values['weatherReliability'])
        if 'weatherReliability' in df.columns:
            weather_score = df['weatherReliability'].fillna(self.baseline_values['weatherReliability']).values
        features.append(weather_score)
        feature_names.append('weather_reliability')
        
        # Regulatory environment
        regulatory_score = np.full(len(df), self.baseline_values['regulatoryScore'])
        if 'regulatoryScore' in df.columns:
            regulatory_score = df['regulatoryScore'].fillna(self.baseline_values['regulatoryScore']).values
        features.append(regulatory_score)
        feature_names.append('regulatory_environment')
        
        # Infrastructure quality
        infra_score = np.full(len(df), self.baseline_values['infrastructureScore'])
        if 'infrastructureScore' in df.columns:
            infra_score = df['infrastructureScore'].fillna(self.baseline_values['infrastructureScore']).values
        features.append(infra_score)
        feature_names.append('infrastructure_quality')
        
        # Risk indicators from opportunities/risks lists
        if 'risks' in df.columns:
            risk_count = df['risks'].apply(
                lambda x: len(x) if isinstance(x, list) else 0
            ).values.astype(float)
            risk_score = 1.0 - (risk_count / 10.0)  # Invert and normalize
            risk_score = np.clip(risk_score, 0, 1)
            features.append(risk_score)
            feature_names.append('risk_score_inverted')
        
        if 'opportunities' in df.columns:
            opp_count = df['opportunities'].apply(
                lambda x: len(x) if isinstance(x, list) else 0
            ).values.astype(float)
            opp_score = opp_count / 10.0  # Normalize
            opp_score = np.clip(opp_score, 0, 1)
            features.append(opp_score)
            feature_names.append('opportunity_count_score')
        
        # Confidence in data
        if 'confidence' in df.columns:
            confidence_values = df['confidence'].fillna(0.7).values
            features.append(confidence_values)
            feature_names.append('data_confidence')
        
        return np.column_stack(features), feature_names
    
    def _create_external_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """Create features from external data sources (simulated)"""
        features = []
        feature_names = []
        
        # Maritime traffic density (simulated based on location)
        maritime_density = self._simulate_maritime_density(df)
        features.append(maritime_density)
        feature_names.append('maritime_density')
        
        # Population density (simulated)
        pop_density = self._simulate_population_density(df)
        features.append(pop_density)
        feature_names.append('population_density')
        
        # Economic indicators (simulated)
        economic_score = self._simulate_economic_indicators(df)
        features.append(economic_score)
        feature_names.append('economic_indicator')
        
        return np.column_stack(features), feature_names
    
    def _calculate_shipping_proximity(self, df: pd.DataFrame) -> np.ndarray:
        """Calculate proximity to major shipping lanes"""
        # Major shipping lanes (simplified)
        shipping_lanes = [
            [(40, -70), (50, -10)],   # North Atlantic
            [(30, -10), (35, 40)],    # Mediterranean
            [(0, 100), (20, 120)],    # Southeast Asia
            [(35, 140), (50, 180)],   # North Pacific
        ]
        
        proximity_scores = np.zeros(len(df))
        
        for i, (lat, lon) in enumerate(zip(df['latitude'], df['longitude'])):
            min_distance = float('inf')
            
            for lane in shipping_lanes:
                # Simplified distance to shipping lane
                for point in lane:
                    distance = geodesic((lat, lon), point).kilometers
                    min_distance = min(min_distance, distance)
            
            # Convert to proximity score (closer = higher score)
            proximity_scores[i] = max(0, 1 - min_distance / 5000)
        
        return proximity_scores
    
    def _calculate_competitive_density(self, df: pd.DataFrame) -> np.ndarray:
        """Calculate competitive density around each station"""
        density_scores = np.zeros(len(df))
        
        for i, (lat1, lon1) in enumerate(zip(df['latitude'], df['longitude'])):
            nearby_count = 0
            
            for j, (lat2, lon2) in enumerate(zip(df['latitude'], df['longitude'])):
                if i != j:
                    distance = geodesic((lat1, lon1), (lat2, lon2)).kilometers
                    if distance < 1000:  # Within 1000km
                        nearby_count += 1
            
            # Normalize competitive density
            density_scores[i] = min(nearby_count / 10.0, 1.0)
        
        return density_scores
    
    def _simulate_maritime_density(self, df: pd.DataFrame) -> np.ndarray:
        """Simulate maritime traffic density based on location"""
        # Higher density near major ports and shipping lanes
        density = np.zeros(len(df))
        
        for i, (lat, lon) in enumerate(zip(df['latitude'], df['longitude'])):
            # Higher density near equator and major sea routes
            equator_factor = 1 - abs(lat) / 90
            
            # Higher density near coastlines (simplified)
            coastal_factor = 0.5  # Assume moderate coastal proximity
            
            # Combine factors
            density[i] = (equator_factor * 0.6 + coastal_factor * 0.4) * 100
        
        return np.clip(density, 0, 100)
    
    def _simulate_population_density(self, df: pd.DataFrame) -> np.ndarray:
        """Simulate population density based on location"""
        # Higher in northern hemisphere, near major cities
        density = np.zeros(len(df))
        
        for i, (lat, lon) in enumerate(zip(df['latitude'], df['longitude'])):
            # Northern hemisphere bias
            hemisphere_factor = 1 if lat > 0 else 0.3
            
            # Temperate zone preference
            temperate_factor = max(0, 1 - abs(abs(lat) - 45) / 45)
            
            density[i] = (hemisphere_factor * 0.7 + temperate_factor * 0.3) * 500
        
        return np.clip(density, 10, 2000)
    
    def _simulate_economic_indicators(self, df: pd.DataFrame) -> np.ndarray:
        """Simulate economic indicators based on location and operator"""
        scores = np.full(len(df), 0.5)  # Default moderate score
        
        # Higher scores for developed regions
        for i, (lat, lon) in enumerate(zip(df['latitude'], df['longitude'])):
            if 'operator' in df.columns:
                operator = df.iloc[i]['operator']
                if operator == 'SES':
                    scores[i] = 0.8  # SES typically in developed markets
                elif operator in ['Viasat', 'SpaceX']:
                    scores[i] = 0.7  # US-based operators
                else:
                    scores[i] = 0.6  # Other operators
        
        return scores
    
    def _encode_categorical(self, series: pd.Series, column_name: str) -> np.ndarray:
        """Encode categorical variable"""
        if column_name not in self.label_encoders:
            self.label_encoders[column_name] = LabelEncoder()
        
        # Handle missing values
        series_filled = series.fillna('unknown')
        
        try:
            encoded = self.label_encoders[column_name].fit_transform(series_filled)
        except ValueError:
            # Handle new categories during prediction
            known_classes = self.label_encoders[column_name].classes_
            series_filtered = series_filled.apply(
                lambda x: x if x in known_classes else 'unknown'
            )
            encoded = self.label_encoders[column_name].transform(series_filtered)
        
        # Normalize to [0, 1]
        max_val = max(encoded.max(), 1)
        return encoded.astype(float) / max_val
    
    def _handle_missing_values(self, X: np.ndarray, feature_names: List[str]) -> np.ndarray:
        """Handle any remaining missing values in feature matrix"""
        if np.isnan(X).sum() > 0:
            logger.warning(f"Found {np.isnan(X).sum()} NaN values in feature matrix")
            
            # Fill NaN with column medians
            for i in range(X.shape[1]):
                col_data = X[:, i]
                if np.isnan(col_data).sum() > 0:
                    median_val = np.nanmedian(col_data)
                    if np.isnan(median_val):
                        median_val = 0.0  # Fallback
                    X[np.isnan(col_data), i] = median_val
        
        return X
    
    def _create_simplified_features(self, feature_dict: Dict[str, Any]) -> Tuple[np.ndarray, List[str]]:
        """Create simplified feature set for prediction when full engineering fails"""
        features = []
        feature_names = []
        
        # Basic geographic features
        lat = feature_dict.get('latitude', 0.0)
        lon = feature_dict.get('longitude', 0.0)
        features.extend([(lat + 90) / 180, (lon + 180) / 360])
        feature_names.extend(['latitude_norm', 'longitude_norm'])
        
        # External features with defaults
        maritime = feature_dict.get('maritimeDensity', self.baseline_values['maritimeDensity']) / 100
        gdp = np.log1p(feature_dict.get('gdpPerCapita', self.baseline_values['gdpPerCapita'])) / np.log1p(100000)
        pop = feature_dict.get('populationDensity', self.baseline_values['populationDensity']) / 1000
        elev = 1.0 - (feature_dict.get('elevation', self.baseline_values['elevation']) / 3000)
        comp = 1.0 - (feature_dict.get('competitorCount', self.baseline_values['competitorCount']) / 10)
        infra = feature_dict.get('infrastructureScore', self.baseline_values['infrastructureScore'])
        weather = feature_dict.get('weatherReliability', self.baseline_values['weatherReliability'])
        reg = feature_dict.get('regulatoryScore', self.baseline_values['regulatoryScore'])
        
        features.extend([maritime, gdp, pop, elev, comp, infra, weather, reg])
        feature_names.extend([
            'maritime_density', 'gdp_log', 'population_density', 'elevation_advantage',
            'competition_advantage', 'infrastructure_score', 'weather_reliability', 'regulatory_score'
        ])
        
        X = np.array(features, dtype=float)
        X = np.clip(X, 0, 1)  # Ensure all values in [0, 1]
        
        return X, feature_names