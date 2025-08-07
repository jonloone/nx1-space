#!/usr/bin/env python3
"""
Validation Framework for Ground Station Investment Analysis
Rigorous validation against existing successful ground station locations
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import json
from scipy import stats
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import warnings
warnings.filterwarnings('ignore')

class ValidationFramework:
    """Comprehensive validation framework for investment predictions"""
    
    def __init__(self, 
                 predictions_path: str = '/mnt/blockstorage/nx1-space/kepler-poc/final_investment_analysis.parquet',
                 reference_stations_path: str = '/mnt/blockstorage/nx1-space/data/raw/commercial_ground_stations.parquet'):
        self.predictions_path = Path(predictions_path)
        self.reference_stations_path = Path(reference_stations_path)
        self.predictions = None
        self.reference_stations = None
        self.validation_results = {}
        
    def load_data(self):
        """Load prediction results and reference ground stations"""
        print("=== LOADING VALIDATION DATA ===")
        
        # Load predictions
        if not self.predictions_path.exists():
            raise FileNotFoundError(f"Predictions file not found: {self.predictions_path}")
        
        self.predictions = pd.read_parquet(self.predictions_path)
        print(f"✅ Loaded {len(self.predictions)} candidate predictions")
        
        # Load reference stations
        if not self.reference_stations_path.exists():
            raise FileNotFoundError(f"Reference stations file not found: {self.reference_stations_path}")
        
        self.reference_stations = pd.read_parquet(self.reference_stations_path)
        print(f"✅ Loaded {len(self.reference_stations)} reference ground stations")
        
        return self.predictions, self.reference_stations
    
    def create_ground_truth_scores(self) -> pd.DataFrame:
        """Create ground truth success scores for existing stations"""
        print("=== CREATING GROUND TRUTH SUCCESS SCORES ===")
        
        if self.reference_stations is None:
            raise ValueError("Reference stations not loaded")
        
        # Create success scores based on multiple criteria
        success_scores = []
        
        for _, station in self.reference_stations.iterrows():
            score_components = {}
            
            # 1. Operational status (0.3 weight)
            status_score = 1.0 if station.get('operational_status', 'Active') == 'Active' else 0.3
            score_components['operational'] = status_score * 0.3
            
            # 2. Service diversity (0.2 weight)
            services = station.get('services_supported', [])
            if isinstance(services, str):
                # Parse string representation of list
                services = services.strip('[]').replace("'", "").split(', ') if services != '[]' else []
            service_count = len(services) if isinstance(services, list) else 1
            service_score = min(1.0, service_count / 8.0)  # Normalize by max expected services
            score_components['service_diversity'] = service_score * 0.2
            
            # 3. Infrastructure quality (0.25 weight)
            uptime_sla = station.get('uptime_sla', 99.0)
            redundancy = station.get('redundancy_level', 'Medium')
            fiber = station.get('fiber_connectivity', 'Medium')
            
            uptime_score = (uptime_sla - 95.0) / 5.0  # Normalize 95-100% to 0-1
            redundancy_score = {'High': 1.0, 'Medium': 0.6, 'Low': 0.3}.get(redundancy, 0.6)
            fiber_score = {'High': 1.0, 'Medium': 0.6, 'Low': 0.3}.get(fiber, 0.6)
            
            infrastructure_score = (uptime_score + redundancy_score + fiber_score) / 3
            score_components['infrastructure'] = infrastructure_score * 0.25
            
            # 4. Market presence (0.15 weight)
            commercial_services = station.get('commercial_services', False)
            customer_access = station.get('customer_access', 'Operator-only')
            
            market_score = 0.8 if commercial_services else 0.4
            if customer_access == 'Multi-tenant':
                market_score += 0.2
            
            score_components['market_presence'] = min(1.0, market_score) * 0.15
            
            # 5. Longevity/Experience (0.1 weight)
            established_year = station.get('established_year', 2010)
            current_year = 2024
            years_operational = current_year - established_year
            longevity_score = min(1.0, years_operational / 20.0)  # Normalize by 20 years
            score_components['longevity'] = longevity_score * 0.1
            
            # Calculate total success score
            total_score = sum(score_components.values())
            
            success_scores.append({
                'station_id': station.get('station_id', f"UNKNOWN_{len(success_scores)}"),
                'name': station.get('name', 'Unknown'),
                'latitude': station.get('latitude', 0),
                'longitude': station.get('longitude', 0),
                'success_score': total_score,
                'score_components': score_components,
                'operator': station.get('operator', 'Unknown'),
                'country': station.get('country', 'Unknown')
            })
        
        ground_truth_df = pd.DataFrame(success_scores)
        
        print(f"✅ Created ground truth scores for {len(ground_truth_df)} stations")
        print(f"📊 Success score range: {ground_truth_df['success_score'].min():.3f} - {ground_truth_df['success_score'].max():.3f}")
        print(f"🎯 Average success score: {ground_truth_df['success_score'].mean():.3f}")
        
        return ground_truth_df
    
    def spatial_validation(self, ground_truth: pd.DataFrame, radius_km: float = 100) -> Dict[str, Any]:
        """Validate predictions against ground truth using spatial proximity"""
        print(f"=== SPATIAL VALIDATION (within {radius_km}km) ===")
        
        if self.predictions is None:
            raise ValueError("Predictions not loaded")
        
        validation_results = {
            'method': 'spatial_proximity',
            'radius_km': radius_km,
            'matches': [],
            'metrics': {}
        }
        
        # For each ground truth station, find nearest prediction
        predicted_scores = []
        actual_scores = []
        distances = []
        
        for _, truth_station in ground_truth.iterrows():
            truth_lat = truth_station['latitude']
            truth_lon = truth_station['longitude']
            truth_score = truth_station['success_score']
            
            # Find nearest predicted candidate
            candidate_distances = []
            for _, pred_candidate in self.predictions.iterrows():
                pred_lat = pred_candidate['latitude']
                pred_lon = pred_candidate['longitude']
                
                distance = self._haversine_distance(truth_lat, truth_lon, pred_lat, pred_lon)
                candidate_distances.append((distance, pred_candidate))
            
            # Find closest candidate within radius
            closest_distance, closest_candidate = min(candidate_distances, key=lambda x: x[0])
            
            if closest_distance <= radius_km:
                predicted_scores.append(closest_candidate['investment_score'])
                actual_scores.append(truth_score)
                distances.append(closest_distance)
                
                validation_results['matches'].append({
                    'truth_station': truth_station['name'],
                    'truth_score': truth_score,
                    'predicted_score': closest_candidate['investment_score'],
                    'distance_km': closest_distance,
                    'candidate_id': closest_candidate['candidate_id']
                })
        
        # Calculate validation metrics
        if len(predicted_scores) > 0:
            predicted_scores = np.array(predicted_scores)
            actual_scores = np.array(actual_scores)
            
            # Correlation analysis
            correlation, p_value = stats.pearsonr(predicted_scores, actual_scores)
            spearman_corr, spearman_p = stats.spearmanr(predicted_scores, actual_scores)
            
            # Regression metrics
            mse = mean_squared_error(actual_scores, predicted_scores)
            mae = mean_absolute_error(actual_scores, predicted_scores)
            rmse = np.sqrt(mse)
            
            # R-squared
            r2 = r2_score(actual_scores, predicted_scores)
            
            validation_results['metrics'] = {
                'n_matches': len(predicted_scores),
                'pearson_correlation': float(correlation),
                'pearson_p_value': float(p_value),
                'spearman_correlation': float(spearman_corr),
                'spearman_p_value': float(spearman_p),
                'mean_squared_error': float(mse),
                'mean_absolute_error': float(mae),
                'root_mean_squared_error': float(rmse),
                'r_squared': float(r2),
                'mean_distance_km': float(np.mean(distances))
            }
            
            print(f"✅ Found {len(predicted_scores)} spatial matches")
            print(f"📊 Pearson correlation: {correlation:.3f} (p={p_value:.3f})")
            print(f"🎯 Spearman correlation: {spearman_corr:.3f} (p={spearman_p:.3f})")
            print(f"📈 R²: {r2:.3f}")
            print(f"📏 RMSE: {rmse:.3f}")
            
        else:
            print("❌ No spatial matches found within radius")
            validation_results['metrics'] = {'n_matches': 0}
        
        return validation_results
    
    def ranking_validation(self, ground_truth: pd.DataFrame) -> Dict[str, Any]:
        """Validate prediction rankings against ground truth rankings"""
        print("=== RANKING VALIDATION ===")
        
        # Create synthetic candidates at ground truth locations
        synthetic_candidates = []
        
        for _, station in ground_truth.iterrows():
            # Find the factor values for this location by finding nearest prediction
            nearest_pred = self._find_nearest_prediction(station['latitude'], station['longitude'])
            
            if nearest_pred is not None:
                synthetic_candidate = nearest_pred.copy()
                synthetic_candidate['true_success_score'] = station['success_score']
                synthetic_candidate['station_name'] = station['name']
                synthetic_candidate['is_ground_truth'] = True
                synthetic_candidates.append(synthetic_candidate)
        
        if len(synthetic_candidates) == 0:
            return {'error': 'No synthetic candidates could be created'}
        
        synthetic_df = pd.DataFrame(synthetic_candidates)
        
        # Rank by predicted scores vs true scores  
        predicted_ranks = synthetic_df['investment_score'].rank(ascending=False, method='dense')
        true_ranks = synthetic_df['true_success_score'].rank(ascending=False, method='dense')
        
        # Calculate ranking metrics
        spearman_corr, spearman_p = stats.spearmanr(predicted_ranks, true_ranks)
        kendall_tau, kendall_p = stats.kendalltau(predicted_ranks, true_ranks)
        
        # Ranking accuracy metrics
        rank_differences = np.abs(predicted_ranks - true_ranks)
        mean_rank_error = np.mean(rank_differences)
        max_rank_error = np.max(rank_differences)
        
        # Top-k accuracy
        top_k_accuracies = {}
        for k in [3, 5, 10]:
            if len(synthetic_df) >= k:
                top_k_predicted = set(predicted_ranks.nsmallest(k).index)
                top_k_true = set(true_ranks.nsmallest(k).index)
                accuracy = len(top_k_predicted.intersection(top_k_true)) / k
                top_k_accuracies[f'top_{k}_accuracy'] = accuracy
        
        validation_results = {
            'method': 'ranking_validation',
            'n_candidates': len(synthetic_df),
            'metrics': {
                'spearman_correlation': float(spearman_corr),
                'spearman_p_value': float(spearman_p),
                'kendall_tau': float(kendall_tau),
                'kendall_p_value': float(kendall_p),
                'mean_rank_error': float(mean_rank_error),
                'max_rank_error': float(max_rank_error),
                **top_k_accuracies
            },
            'detailed_rankings': [
                {
                    'station_name': row['station_name'],
                    'predicted_rank': int(predicted_ranks.iloc[i]),
                    'true_rank': int(true_ranks.iloc[i]),
                    'predicted_score': row['investment_score'],
                    'true_score': row['true_success_score'],
                    'rank_difference': int(rank_differences.iloc[i])
                }
                for i, (_, row) in enumerate(synthetic_df.iterrows())
            ]
        }
        
        print(f"✅ Ranking validation complete for {len(synthetic_df)} candidates")
        print(f"📊 Spearman rank correlation: {spearman_corr:.3f} (p={spearman_p:.3f})")
        print(f"🎯 Kendall's tau: {kendall_tau:.3f} (p={kendall_p:.3f})")
        print(f"📈 Mean rank error: {mean_rank_error:.2f}")
        
        return validation_results
    
    def cross_validation_performance(self, ground_truth: pd.DataFrame) -> Dict[str, Any]:
        """Perform cross-validation using ground truth data"""
        print("=== CROSS-VALIDATION PERFORMANCE ===")
        
        # Create feature matrix from ground truth locations
        feature_data = []
        target_scores = []
        
        for _, station in ground_truth.iterrows():
            nearest_pred = self._find_nearest_prediction(station['latitude'], station['longitude'])
            if nearest_pred is not None:
                # Extract factor values
                factor_columns = [c for c in nearest_pred.index 
                                if c not in ['candidate_id', 'latitude', 'longitude', 'generation_strategy',
                                           'investment_score', 'score_uncertainty', 'score_ci_lower', 
                                           'score_ci_upper', 'investment_rank']]
                
                factor_values = [nearest_pred[col] for col in factor_columns]
                feature_data.append(factor_values)
                target_scores.append(station['success_score'])
        
        if len(feature_data) < 5:  # Need minimum samples for CV
            return {'error': 'Insufficient ground truth data for cross-validation'}
        
        X = np.array(feature_data)
        y = np.array(target_scores)
        
        # Cross-validation with different models
        cv_folds = min(5, len(X))  # Use 5-fold or fewer if limited data
        kfold = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
        
        models = {
            'linear_regression': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42)
        }
        
        cv_results = {}
        
        for model_name, model in models.items():
            # Cross-validation scores
            cv_scores = cross_val_score(model, X, y, cv=kfold, scoring='neg_mean_squared_error')
            cv_rmse_scores = np.sqrt(-cv_scores)
            
            # R² scores
            r2_scores = cross_val_score(model, X, y, cv=kfold, scoring='r2')
            
            cv_results[model_name] = {
                'cv_rmse_mean': float(np.mean(cv_rmse_scores)),
                'cv_rmse_std': float(np.std(cv_rmse_scores)),
                'cv_r2_mean': float(np.mean(r2_scores)),
                'cv_r2_std': float(np.std(r2_scores)),
                'n_folds': cv_folds
            }
            
            print(f"✅ {model_name}: RMSE={np.mean(cv_rmse_scores):.3f}±{np.std(cv_rmse_scores):.3f}, R²={np.mean(r2_scores):.3f}±{np.std(r2_scores):.3f}")
        
        validation_results = {
            'method': 'cross_validation',
            'n_samples': len(X),
            'n_features': X.shape[1],
            'cv_folds': cv_folds,
            'model_results': cv_results
        }
        
        return validation_results
    
    def geographic_coverage_analysis(self, ground_truth: pd.DataFrame) -> Dict[str, Any]:
        """Analyze geographic coverage and regional biases"""
        print("=== GEOGRAPHIC COVERAGE ANALYSIS ===")
        
        # Analyze prediction coverage by region
        regions = {}
        for _, pred in self.predictions.iterrows():
            region = self._get_region_for_coordinates(pred['latitude'], pred['longitude'])
            if region not in regions:
                regions[region] = {'predictions': [], 'ground_truth': []}
            regions[region]['predictions'].append(pred['investment_score'])
        
        # Analyze ground truth distribution by region
        for _, station in ground_truth.iterrows():
            region = self._get_region_for_coordinates(station['latitude'], station['longitude'])
            if region not in regions:
                regions[region] = {'predictions': [], 'ground_truth': []}
            regions[region]['ground_truth'].append(station['success_score'])
        
        # Calculate regional statistics
        regional_analysis = {}
        for region, data in regions.items():
            pred_scores = data['predictions']
            truth_scores = data['ground_truth']
            
            regional_analysis[region] = {
                'n_predictions': len(pred_scores),
                'n_ground_truth': len(truth_scores),
                'pred_score_mean': float(np.mean(pred_scores)) if pred_scores else 0,
                'pred_score_std': float(np.std(pred_scores)) if pred_scores else 0,
                'truth_score_mean': float(np.mean(truth_scores)) if truth_scores else 0,
                'truth_score_std': float(np.std(truth_scores)) if truth_scores else 0,
                'coverage_ratio': len(pred_scores) / max(1, len(truth_scores))
            }
        
        # Calculate global coverage metrics
        total_predictions = len(self.predictions)
        total_ground_truth = len(ground_truth)
        
        coverage_results = {
            'method': 'geographic_coverage',
            'global_metrics': {
                'total_predictions': total_predictions,
                'total_ground_truth': total_ground_truth,
                'prediction_to_truth_ratio': total_predictions / total_ground_truth,
                'regions_covered': len(regions)
            },
            'regional_analysis': regional_analysis
        }
        
        print(f"✅ Geographic analysis complete for {len(regions)} regions")
        print(f"📊 Prediction/Truth ratio: {total_predictions}/{total_ground_truth} = {total_predictions/total_ground_truth:.2f}")
        
        return coverage_results
    
    def outlier_analysis(self, ground_truth: pd.DataFrame) -> Dict[str, Any]:
        """Analyze prediction outliers and edge cases"""
        print("=== OUTLIER ANALYSIS ===")
        
        # Find predictions that are statistical outliers
        pred_scores = self.predictions['investment_score'].values
        
        # Statistical outlier detection
        q1, q3 = np.percentile(pred_scores, [25, 75])
        iqr = q3 - q1
        outlier_threshold_low = q1 - 1.5 * iqr
        outlier_threshold_high = q3 + 1.5 * iqr
        
        outliers = self.predictions[
            (self.predictions['investment_score'] < outlier_threshold_low) |
            (self.predictions['investment_score'] > outlier_threshold_high)
        ]
        
        # Analyze outlier characteristics
        outlier_analysis = {
            'n_outliers': len(outliers),
            'outlier_percentage': len(outliers) / len(self.predictions) * 100,
            'high_outliers': len(outliers[outliers['investment_score'] > outlier_threshold_high]),
            'low_outliers': len(outliers[outliers['investment_score'] < outlier_threshold_low]),
            'outlier_threshold_low': float(outlier_threshold_low),
            'outlier_threshold_high': float(outlier_threshold_high)
        }
        
        # Geographic distribution of outliers
        outlier_regions = {}
        for _, outlier in outliers.iterrows():
            region = self._get_region_for_coordinates(outlier['latitude'], outlier['longitude'])
            outlier_regions[region] = outlier_regions.get(region, 0) + 1
        
        outlier_analysis['geographic_distribution'] = outlier_regions
        
        # Compare to ground truth success patterns
        if len(ground_truth) > 0:
            truth_scores = ground_truth['success_score'].values
            truth_q1, truth_q3 = np.percentile(truth_scores, [25, 75])
            truth_iqr = truth_q3 - truth_q1
            
            outlier_analysis['ground_truth_comparison'] = {
                'truth_iqr': float(truth_iqr),
                'prediction_iqr': float(iqr),
                'iqr_ratio': float(iqr / truth_iqr) if truth_iqr > 0 else float('inf')
            }
        
        print(f"✅ Found {len(outliers)} outliers ({len(outliers)/len(self.predictions)*100:.1f}%)")
        print(f"📊 High outliers: {outlier_analysis['high_outliers']}, Low outliers: {outlier_analysis['low_outliers']}")
        
        return outlier_analysis
    
    def comprehensive_validation_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        print("=== GENERATING COMPREHENSIVE VALIDATION REPORT ===")
        
        # Load data
        self.load_data()
        
        # Create ground truth
        ground_truth = self.create_ground_truth_scores()
        
        # Run all validation methods
        validation_results = {
            'metadata': {
                'n_predictions': len(self.predictions),
                'n_ground_truth': len(ground_truth),
                'validation_timestamp': pd.Timestamp.now().isoformat(),
                'methodology': 'multi_method_validation'
            }
        }
        
        # 1. Spatial validation
        try:
            spatial_results = self.spatial_validation(ground_truth, radius_km=100)
            validation_results['spatial_validation'] = spatial_results
        except Exception as e:
            validation_results['spatial_validation'] = {'error': str(e)}
        
        # 2. Ranking validation
        try:
            ranking_results = self.ranking_validation(ground_truth)
            validation_results['ranking_validation'] = ranking_results
        except Exception as e:
            validation_results['ranking_validation'] = {'error': str(e)}
        
        # 3. Cross-validation
        try:
            cv_results = self.cross_validation_performance(ground_truth)
            validation_results['cross_validation'] = cv_results
        except Exception as e:
            validation_results['cross_validation'] = {'error': str(e)}
        
        # 4. Geographic coverage
        try:
            coverage_results = self.geographic_coverage_analysis(ground_truth)
            validation_results['geographic_coverage'] = coverage_results
        except Exception as e:
            validation_results['geographic_coverage'] = {'error': str(e)}
        
        # 5. Outlier analysis
        try:
            outlier_results = self.outlier_analysis(ground_truth)
            validation_results['outlier_analysis'] = outlier_results
        except Exception as e:
            validation_results['outlier_analysis'] = {'error': str(e)}
        
        # Calculate overall validation score
        overall_score = self._calculate_overall_validation_score(validation_results)
        validation_results['overall_validation_score'] = overall_score
        validation_results['validation_grade'] = self._get_validation_grade(overall_score)
        
        # Save validation report
        report_path = Path('/mnt/blockstorage/nx1-space/kepler-poc/comprehensive_validation_report.json')
        with open(report_path, 'w') as f:
            json.dump(validation_results, f, indent=2, default=str)
        
        print(f"✅ Comprehensive validation report saved to: {report_path}")
        print(f"🎯 Overall validation score: {overall_score:.2f}/100")
        print(f"📊 Validation grade: {validation_results['validation_grade']}")
        
        return validation_results
    
    def _calculate_overall_validation_score(self, results: Dict[str, Any]) -> float:
        """Calculate overall validation score"""
        score = 0.0
        max_score = 100.0
        
        # Spatial validation (30 points)
        if 'spatial_validation' in results and 'metrics' in results['spatial_validation']:
            spatial_metrics = results['spatial_validation']['metrics']
            if 'pearson_correlation' in spatial_metrics:
                corr = abs(spatial_metrics['pearson_correlation'])
                score += min(30, corr * 30)
        
        # Ranking validation (25 points)
        if 'ranking_validation' in results and 'metrics' in results['ranking_validation']:
            ranking_metrics = results['ranking_validation']['metrics']
            if 'spearman_correlation' in ranking_metrics:
                corr = abs(ranking_metrics['spearman_correlation'])
                score += min(25, corr * 25)
        
        # Cross-validation (25 points)
        if 'cross_validation' in results and 'model_results' in results['cross_validation']:
            cv_results = results['cross_validation']['model_results']
            if 'random_forest' in cv_results:
                r2 = cv_results['random_forest'].get('cv_r2_mean', 0)
                score += min(25, max(0, r2) * 25)
        
        # Coverage and outlier analysis (20 points)
        coverage_penalty = 0
        if 'outlier_analysis' in results:
            outlier_pct = results['outlier_analysis'].get('outlier_percentage', 0)
            if outlier_pct > 20:  # More than 20% outliers is concerning
                coverage_penalty = min(10, (outlier_pct - 20) / 2)
        
        score += max(0, 20 - coverage_penalty)
        
        return min(max_score, score)
    
    def _get_validation_grade(self, score: float) -> str:
        """Convert validation score to letter grade"""
        if score >= 85:
            return "A"
        elif score >= 75:
            return "B"
        elif score >= 65:
            return "C"
        elif score >= 55:
            return "D"
        else:
            return "F"
    
    # UTILITY METHODS
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate haversine distance between two points in kilometers"""
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        return R * c
    
    def _find_nearest_prediction(self, lat: float, lon: float) -> Optional[pd.Series]:
        """Find nearest prediction to given coordinates"""
        if self.predictions is None:
            return None
        
        distances = []
        for _, pred in self.predictions.iterrows():
            distance = self._haversine_distance(lat, lon, pred['latitude'], pred['longitude'])
            distances.append(distance)
        
        if distances:
            min_idx = np.argmin(distances)
            return self.predictions.iloc[min_idx]
        
        return None
    
    def _get_region_for_coordinates(self, lat: float, lon: float) -> str:
        """Get region name for coordinates"""
        if -130 <= lon <= -60:
            return 'North America'
        elif -60 <= lon <= -30:
            return 'South America'
        elif -15 <= lon <= 50:
            return 'Europe/Africa'
        elif 50 <= lon <= 150:
            return 'Asia/Pacific'
        else:
            return 'Other'

def main():
    """Main validation execution"""
    print("=== COMPREHENSIVE VALIDATION FRAMEWORK ===")
    
    # Initialize validation framework
    validator = ValidationFramework()
    
    # Generate comprehensive validation report
    validation_report = validator.comprehensive_validation_report()
    
    print(f"\n🎯 Validation complete!")
    print(f"📊 Overall score: {validation_report['overall_validation_score']:.2f}/100")
    print(f"🏆 Grade: {validation_report['validation_grade']}")

if __name__ == "__main__":
    main()