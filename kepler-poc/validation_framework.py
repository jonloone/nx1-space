#!/usr/bin/env python3
"""
Validation Framework for Ground Station Investment Scoring

This module provides comprehensive validation methodologies including:
- Validation against existing successful ground station locations
- Backtesting framework for historical performance analysis
- Expert validation processes and feedback integration
- Success metrics definition and tracking
- Cross-validation and holdout testing strategies
- Performance benchmarking against industry standards

Author: Claude (Principal Data Scientist)
Version: 1.0.0
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Callable, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
import logging
from abc import ABC, abstractmethod
from sklearn.model_selection import KFold, StratifiedKFold, TimeSeriesSplit
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    precision_score, recall_score, f1_score, roc_auc_score,
    classification_report, confusion_matrix
)
from scipy import stats
from scipy.spatial.distance import cdist
import json
import warnings
from collections import defaultdict
import matplotlib.pyplot as plt
import seaborn as sns

from ground_station_investment_scorer import GroundStationInvestmentScorer, ScoringWeights

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ValidationMetrics:
    """Comprehensive validation metrics."""
    
    # Regression metrics (for continuous scores)
    mse: float = 0.0
    rmse: float = 0.0
    mae: float = 0.0
    r2: float = 0.0
    mape: float = 0.0  # Mean Absolute Percentage Error
    
    # Classification metrics (for investment recommendations)
    accuracy: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1: float = 0.0
    auc_roc: float = 0.0
    
    # Business metrics
    top_k_accuracy: Dict[int, float] = field(default_factory=dict)  # Top-K accuracy
    ndcg: float = 0.0  # Normalized Discounted Cumulative Gain
    investment_success_rate: float = 0.0
    false_positive_cost: float = 0.0
    false_negative_cost: float = 0.0
    
    # Statistical metrics
    correlation_with_ground_truth: float = 0.0
    spearman_correlation: float = 0.0
    kendall_tau: float = 0.0
    
    # Confidence metrics
    prediction_interval_coverage: float = 0.0
    calibration_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'regression_metrics': {
                'mse': self.mse,
                'rmse': self.rmse,
                'mae': self.mae,
                'r2': self.r2,
                'mape': self.mape
            },
            'classification_metrics': {
                'accuracy': self.accuracy,
                'precision': self.precision,
                'recall': self.recall,
                'f1': self.f1,
                'auc_roc': self.auc_roc
            },
            'business_metrics': {
                'top_k_accuracy': self.top_k_accuracy,
                'ndcg': self.ndcg,
                'investment_success_rate': self.investment_success_rate,
                'false_positive_cost': self.false_positive_cost,
                'false_negative_cost': self.false_negative_cost
            },
            'statistical_metrics': {
                'correlation_with_ground_truth': self.correlation_with_ground_truth,
                'spearman_correlation': self.spearman_correlation,
                'kendall_tau': self.kendall_tau
            },
            'confidence_metrics': {
                'prediction_interval_coverage': self.prediction_interval_coverage,
                'calibration_score': self.calibration_score
            }
        }

@dataclass
class BacktestResult:
    """Results from backtesting analysis."""
    
    period_start: datetime
    period_end: datetime
    total_predictions: int
    successful_predictions: int
    failed_predictions: int
    success_rate: float
    
    # Financial metrics
    total_investment_simulated: float = 0.0
    total_return_simulated: float = 0.0
    roi: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    
    # Performance over time
    monthly_performance: Dict[str, float] = field(default_factory=dict)
    cumulative_returns: List[float] = field(default_factory=list)
    
    # Risk metrics
    value_at_risk_95: float = 0.0
    expected_shortfall: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'period': {
                'start': self.period_start.isoformat(),
                'end': self.period_end.isoformat()
            },
            'prediction_metrics': {
                'total_predictions': self.total_predictions,
                'successful_predictions': self.successful_predictions,
                'failed_predictions': self.failed_predictions,
                'success_rate': self.success_rate
            },
            'financial_metrics': {
                'total_investment_simulated': self.total_investment_simulated,
                'total_return_simulated': self.total_return_simulated,
                'roi': self.roi,
                'sharpe_ratio': self.sharpe_ratio,
                'max_drawdown': self.max_drawdown
            },
            'risk_metrics': {
                'value_at_risk_95': self.value_at_risk_95,
                'expected_shortfall': self.expected_shortfall
            },
            'performance_over_time': {
                'monthly_performance': self.monthly_performance,
                'cumulative_returns': self.cumulative_returns
            }
        }

class GroundTruthValidator:
    """Validates scoring system against known successful ground stations."""
    
    def __init__(self, successful_stations_data: pd.DataFrame):
        """
        Initialize with data on successful ground station investments.
        
        Args:
            successful_stations_data: DataFrame with columns:
                - latitude, longitude: Location
                - investment_date: When investment was made
                - success_score: Actual success score (0-1)
                - roi: Return on investment
                - operational_status: Current status
        """
        self.successful_stations = successful_stations_data
        self.validation_results = {}
        
        # Validate input data
        required_columns = ['latitude', 'longitude', 'investment_date', 'success_score']
        missing_columns = [col for col in required_columns if col not in successful_stations_data.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        logger.info(f"Initialized with {len(successful_stations_data)} ground truth stations")
    
    def validate_against_ground_truth(self, scorer: GroundStationInvestmentScorer,
                                    test_data: pd.DataFrame) -> ValidationMetrics:
        """
        Validate scorer against ground truth successful stations.
        
        Args:
            scorer: The scoring system to validate
            test_data: Data for the ground truth locations
        
        Returns:
            Comprehensive validation metrics
        """
        logger.info("Validating against ground truth successful stations...")
        
        # Score the test locations
        scored_results = scorer.score_locations(test_data)
        
        # Extract predictions and ground truth
        predicted_scores = scored_results['overall_investment_score'].values
        ground_truth_scores = self.successful_stations['success_score'].values
        
        # Ensure same length
        min_length = min(len(predicted_scores), len(ground_truth_scores))
        predicted_scores = predicted_scores[:min_length]
        ground_truth_scores = ground_truth_scores[:min_length]
        
        # Calculate regression metrics
        mse = mean_squared_error(ground_truth_scores, predicted_scores)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(ground_truth_scores, predicted_scores)
        r2 = r2_score(ground_truth_scores, predicted_scores)
        
        # MAPE (handle division by zero)
        mape = np.mean(np.abs((ground_truth_scores - predicted_scores) / 
                             np.maximum(ground_truth_scores, 1e-10))) * 100
        
        # Statistical correlations
        pearson_corr = np.corrcoef(predicted_scores, ground_truth_scores)[0, 1]
        spearman_corr = stats.spearmanr(predicted_scores, ground_truth_scores)[0]
        kendall_tau = stats.kendalltau(predicted_scores, ground_truth_scores)[0]
        
        # Convert to binary classification for business metrics
        # Define success threshold
        success_threshold = 0.7
        predicted_binary = (predicted_scores >= success_threshold).astype(int)
        ground_truth_binary = (ground_truth_scores >= success_threshold).astype(int)
        
        # Classification metrics
        if len(np.unique(ground_truth_binary)) > 1:  # Avoid errors with single class
            accuracy = np.mean(predicted_binary == ground_truth_binary)
            precision = precision_score(ground_truth_binary, predicted_binary, zero_division=0)
            recall = recall_score(ground_truth_binary, predicted_binary, zero_division=0)
            f1 = f1_score(ground_truth_binary, predicted_binary, zero_division=0)
            
            try:
                auc_roc = roc_auc_score(ground_truth_binary, predicted_scores)
            except ValueError:
                auc_roc = 0.5  # Random performance if single class
        else:
            accuracy = precision = recall = f1 = auc_roc = 0.0
        
        # Top-K accuracy
        top_k_accuracy = self._calculate_top_k_accuracy(
            predicted_scores, ground_truth_scores, k_values=[5, 10, 20]
        )
        
        # NDCG (Normalized Discounted Cumulative Gain)
        ndcg = self._calculate_ndcg(predicted_scores, ground_truth_scores)
        
        # Business success rate
        investment_success_rate = self._calculate_investment_success_rate(
            predicted_scores, ground_truth_scores, success_threshold
        )
        
        # Prediction interval coverage (simplified)
        if 'score_lower_bound' in scored_results.columns and 'score_upper_bound' in scored_results.columns:
            coverage = np.mean(
                (ground_truth_scores >= scored_results['score_lower_bound'].values[:min_length]) &
                (ground_truth_scores <= scored_results['score_upper_bound'].values[:min_length])
            )
        else:
            coverage = 0.0
        
        # Calibration score (how well confidence matches actual accuracy)
        calibration_score = self._calculate_calibration_score(
            predicted_scores, ground_truth_scores, 
            scored_results.get('score_confidence', pd.Series([0.5] * len(predicted_scores)))
        )
        
        metrics = ValidationMetrics(
            mse=mse, rmse=rmse, mae=mae, r2=r2, mape=mape,
            accuracy=accuracy, precision=precision, recall=recall, f1=f1, auc_roc=auc_roc,
            top_k_accuracy=top_k_accuracy, ndcg=ndcg,
            investment_success_rate=investment_success_rate,
            correlation_with_ground_truth=pearson_corr,
            spearman_correlation=spearman_corr,
            kendall_tau=kendall_tau,
            prediction_interval_coverage=coverage,
            calibration_score=calibration_score
        )
        
        self.validation_results['ground_truth'] = metrics
        
        logger.info(f"Ground truth validation completed. R² = {r2:.3f}, Success Rate = {investment_success_rate:.3f}")
        return metrics
    
    def _calculate_top_k_accuracy(self, predicted_scores: np.ndarray, 
                                ground_truth_scores: np.ndarray,
                                k_values: List[int]) -> Dict[int, float]:
        """Calculate Top-K accuracy for different K values."""
        top_k_accuracy = {}
        
        # Sort by predicted scores (descending)
        sorted_indices = np.argsort(predicted_scores)[::-1]
        sorted_ground_truth = ground_truth_scores[sorted_indices]
        
        # Define success threshold
        success_threshold = np.percentile(ground_truth_scores, 70)  # Top 30% are successes
        
        for k in k_values:
            if k <= len(sorted_ground_truth):
                top_k_ground_truth = sorted_ground_truth[:k]
                success_count = np.sum(top_k_ground_truth >= success_threshold)
                top_k_accuracy[k] = success_count / k
            else:
                top_k_accuracy[k] = 0.0
        
        return top_k_accuracy
    
    def _calculate_ndcg(self, predicted_scores: np.ndarray, 
                       ground_truth_scores: np.ndarray, k: int = 20) -> float:
        """Calculate Normalized Discounted Cumulative Gain."""
        # Sort by predicted scores
        predicted_order = np.argsort(predicted_scores)[::-1]
        ground_truth_sorted = ground_truth_scores[predicted_order][:k]
        
        # Calculate DCG
        dcg = 0.0
        for i, relevance in enumerate(ground_truth_sorted):
            dcg += relevance / np.log2(i + 2)
        
        # Calculate IDCG (ideal DCG)
        ideal_order = np.argsort(ground_truth_scores)[::-1]
        ideal_relevances = ground_truth_scores[ideal_order][:k]
        
        idcg = 0.0
        for i, relevance in enumerate(ideal_relevances):
            idcg += relevance / np.log2(i + 2)
        
        return dcg / idcg if idcg > 0 else 0.0
    
    def _calculate_investment_success_rate(self, predicted_scores: np.ndarray,
                                         ground_truth_scores: np.ndarray,
                                         threshold: float) -> float:
        """Calculate the success rate of investment recommendations."""
        # Recommend top 20% of predicted scores
        recommendation_threshold = np.percentile(predicted_scores, 80)
        recommended_indices = predicted_scores >= recommendation_threshold
        
        if np.sum(recommended_indices) == 0:
            return 0.0
        
        recommended_ground_truth = ground_truth_scores[recommended_indices]
        success_count = np.sum(recommended_ground_truth >= threshold)
        
        return success_count / len(recommended_ground_truth)
    
    def _calculate_calibration_score(self, predicted_scores: np.ndarray,
                                   ground_truth_scores: np.ndarray,
                                   confidence_scores: pd.Series) -> float:
        """Calculate calibration score (how well confidence matches accuracy)."""
        if len(confidence_scores) != len(predicted_scores):
            return 0.5  # Default neutral calibration
        
        # Bin predictions by confidence level
        n_bins = 10
        bin_boundaries = np.linspace(0, 1, n_bins + 1)
        
        calibration_errors = []
        
        for i in range(n_bins):
            bin_mask = ((confidence_scores >= bin_boundaries[i]) & 
                       (confidence_scores < bin_boundaries[i + 1]))
            
            if np.sum(bin_mask) == 0:
                continue
            
            bin_confidence = np.mean(confidence_scores[bin_mask])
            bin_accuracy = np.mean(np.abs(predicted_scores[bin_mask] - ground_truth_scores[bin_mask]) < 0.1)
            
            calibration_errors.append(abs(bin_confidence - bin_accuracy))
        
        return 1 - np.mean(calibration_errors) if calibration_errors else 0.5

class BacktestingFramework:
    """Framework for backtesting scorer performance over historical periods."""
    
    def __init__(self, historical_data: pd.DataFrame, investment_outcomes: pd.DataFrame):
        """
        Initialize backtesting framework.
        
        Args:
            historical_data: Historical factor data with 'date' column
            investment_outcomes: Actual investment outcomes with success metrics
        """
        self.historical_data = historical_data
        self.investment_outcomes = investment_outcomes
        self.backtest_results = {}
        
        # Validate data
        if 'date' not in historical_data.columns:
            raise ValueError("Historical data must have 'date' column")
        
        # Convert dates
        self.historical_data['date'] = pd.to_datetime(self.historical_data['date'])
        if 'investment_date' in investment_outcomes.columns:
            self.investment_outcomes['investment_date'] = pd.to_datetime(
                self.investment_outcomes['investment_date']
            )
        
        logger.info(f"Initialized backtesting with {len(historical_data)} historical records")
    
    def run_time_series_backtest(self, scorer: GroundStationInvestmentScorer,
                                lookback_months: int = 12,
                                prediction_horizon_months: int = 6,
                                min_observations: int = 50) -> Dict[str, BacktestResult]:
        """
        Run time series backtesting with rolling windows.
        
        Args:
            scorer: Scoring system to test
            lookback_months: Months of historical data to use for each prediction
            prediction_horizon_months: Months ahead to predict
            min_observations: Minimum observations needed for prediction
        
        Returns:
            Dictionary of backtest results by time period
        """
        logger.info("Running time series backtesting...")
        
        results = {}
        
        # Get date range
        start_date = self.historical_data['date'].min()
        end_date = self.historical_data['date'].max()
        
        # Create rolling windows
        current_date = start_date + timedelta(days=lookback_months * 30)
        
        while current_date <= end_date - timedelta(days=prediction_horizon_months * 30):
            # Define training period
            train_start = current_date - timedelta(days=lookback_months * 30)
            train_end = current_date
            
            # Define prediction period
            pred_start = current_date
            pred_end = current_date + timedelta(days=prediction_horizon_months * 30)
            
            # Get training data
            train_data = self.historical_data[
                (self.historical_data['date'] >= train_start) & 
                (self.historical_data['date'] < train_end)
            ]
            
            if len(train_data) < min_observations:
                current_date += timedelta(days=30)  # Move forward by 1 month
                continue
            
            # Get actual outcomes for prediction period
            actual_outcomes = self.investment_outcomes[
                (self.investment_outcomes['investment_date'] >= pred_start) &
                (self.investment_outcomes['investment_date'] < pred_end)
            ]
            
            if len(actual_outcomes) == 0:
                current_date += timedelta(days=30)
                continue
            
            # Run backtest for this period
            period_key = f"{train_end.strftime('%Y-%m')}_{pred_end.strftime('%Y-%m')}"
            
            try:
                backtest_result = self._run_single_backtest(
                    scorer, train_data, actual_outcomes, pred_start, pred_end
                )
                results[period_key] = backtest_result
                
                logger.info(f"Completed backtest for period {period_key}: "
                           f"Success rate = {backtest_result.success_rate:.3f}")
            
            except Exception as e:
                logger.warning(f"Backtest failed for period {period_key}: {e}")
            
            current_date += timedelta(days=30)  # Move forward by 1 month
        
        self.backtest_results.update(results)
        return results
    
    def _run_single_backtest(self, scorer: GroundStationInvestmentScorer,
                           train_data: pd.DataFrame, actual_outcomes: pd.DataFrame,
                           pred_start: datetime, pred_end: datetime) -> BacktestResult:
        """Run backtest for a single time period."""
        
        # Score the training data locations
        scored_results = scorer.score_locations(train_data)
        
        # Simulate investment decisions based on scores
        investment_threshold = np.percentile(scored_results['overall_investment_score'], 80)
        recommended_investments = scored_results[
            scored_results['overall_investment_score'] >= investment_threshold
        ]
        
        # Match recommendations with actual outcomes
        successful_predictions = 0
        failed_predictions = 0
        total_investment = 0
        total_return = 0
        
        # Simulate investment outcomes
        for _, recommendation in recommended_investments.iterrows():
            # Find matching actual outcome (simplified matching by proximity)
            if 'latitude' in recommendation.index and 'longitude' in recommendation.index:
                matches = self._find_nearby_outcomes(
                    recommendation['latitude'], recommendation['longitude'],
                    actual_outcomes, max_distance_km=50
                )
                
                if len(matches) > 0:
                    # Use the closest match
                    closest_match = matches.iloc[0]
                    
                    # Simulate investment
                    investment_amount = 1000000  # $1M per station
                    total_investment += investment_amount
                    
                    # Get actual ROI
                    actual_roi = closest_match.get('roi', 0.0)
                    actual_return = investment_amount * (1 + actual_roi)
                    total_return += actual_return
                    
                    # Determine success (ROI > 15% is considered successful)
                    if actual_roi > 0.15:
                        successful_predictions += 1
                    else:
                        failed_predictions += 1
                else:
                    # No matching outcome - assume neutral result
                    failed_predictions += 1
                    total_investment += 1000000
                    total_return += 1000000  # Break-even
        
        total_predictions = successful_predictions + failed_predictions
        success_rate = successful_predictions / total_predictions if total_predictions > 0 else 0
        
        # Calculate financial metrics
        roi = (total_return - total_investment) / total_investment if total_investment > 0 else 0
        
        # Calculate risk metrics (simplified)
        returns = []
        if len(recommended_investments) > 0:
            for _, rec in recommended_investments.iterrows():
                matches = self._find_nearby_outcomes(
                    rec.get('latitude', 0), rec.get('longitude', 0),
                    actual_outcomes, max_distance_km=50
                )
                if len(matches) > 0:
                    returns.append(matches.iloc[0].get('roi', 0.0))
                else:
                    returns.append(0.0)
        
        var_95 = np.percentile(returns, 5) if returns else 0.0
        expected_shortfall = np.mean([r for r in returns if r <= var_95]) if returns else 0.0
        
        return BacktestResult(
            period_start=pred_start,
            period_end=pred_end,
            total_predictions=total_predictions,
            successful_predictions=successful_predictions,
            failed_predictions=failed_predictions,
            success_rate=success_rate,
            total_investment_simulated=total_investment,
            total_return_simulated=total_return,
            roi=roi,
            value_at_risk_95=var_95,
            expected_shortfall=expected_shortfall
        )
    
    def _find_nearby_outcomes(self, lat: float, lon: float, 
                            outcomes: pd.DataFrame, max_distance_km: float = 50) -> pd.DataFrame:
        """Find investment outcomes near a given location."""
        if len(outcomes) == 0 or 'latitude' not in outcomes.columns:
            return pd.DataFrame()
        
        # Calculate distances
        def haversine_distance(lat1, lon1, lat2, lon2):
            R = 6371  # Earth's radius in km
            dlat = np.radians(lat2 - lat1)
            dlon = np.radians(lon2 - lon1)
            a = (np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * 
                 np.cos(np.radians(lat2)) * np.sin(dlon/2)**2)
            return 2 * R * np.arcsin(np.sqrt(a))
        
        distances = outcomes.apply(
            lambda row: haversine_distance(lat, lon, row['latitude'], row['longitude']),
            axis=1
        )
        
        nearby_outcomes = outcomes[distances <= max_distance_km].copy()
        nearby_outcomes['distance_km'] = distances[distances <= max_distance_km]
        
        return nearby_outcomes.sort_values('distance_km')
    
    def calculate_overall_backtest_performance(self) -> Dict[str, Any]:
        """Calculate overall performance across all backtest periods."""
        if not self.backtest_results:
            return {}
        
        results = list(self.backtest_results.values())
        
        # Aggregate metrics
        total_predictions = sum(r.total_predictions for r in results)
        total_successful = sum(r.successful_predictions for r in results)
        total_investment = sum(r.total_investment_simulated for r in results)
        total_return = sum(r.total_return_simulated for r in results)
        
        success_rates = [r.success_rate for r in results if r.total_predictions > 0]
        rois = [r.roi for r in results if r.total_investment_simulated > 0]
        
        return {
            'overall_success_rate': total_successful / total_predictions if total_predictions > 0 else 0,
            'overall_roi': (total_return - total_investment) / total_investment if total_investment > 0 else 0,
            'average_period_success_rate': np.mean(success_rates) if success_rates else 0,
            'success_rate_std': np.std(success_rates) if success_rates else 0,
            'average_period_roi': np.mean(rois) if rois else 0,
            'roi_std': np.std(rois) if rois else 0,
            'total_periods_tested': len(results),
            'total_predictions_made': total_predictions,
            'sharpe_ratio': np.mean(rois) / np.std(rois) if rois and np.std(rois) > 0 else 0
        }

class ExpertValidationFramework:
    """Framework for incorporating expert validation and feedback."""
    
    def __init__(self):
        self.expert_feedback = []
        self.expert_weights = {}
        self.consensus_scores = {}
    
    def collect_expert_feedback(self, expert_id: str, location_scores: Dict[str, Dict[str, float]],
                              expertise_areas: List[str], confidence_level: float = 0.8):
        """
        Collect expert feedback on location scores.
        
        Args:
            expert_id: Unique identifier for the expert
            location_scores: Dictionary of location -> factor -> score
            expertise_areas: Areas of expertise (e.g., ['technical', 'regulatory'])
            confidence_level: Expert's confidence in their assessments
        """
        feedback_entry = {
            'expert_id': expert_id,
            'timestamp': datetime.now(),
            'location_scores': location_scores,
            'expertise_areas': expertise_areas,
            'confidence_level': confidence_level
        }
        
        self.expert_feedback.append(feedback_entry)
        
        # Update expert weights based on expertise and confidence
        self.expert_weights[expert_id] = {
            'expertise_areas': expertise_areas,
            'confidence_level': confidence_level,
            'feedback_count': len([f for f in self.expert_feedback if f['expert_id'] == expert_id])
        }
        
        logger.info(f"Collected feedback from expert {expert_id} on {len(location_scores)} locations")
    
    def calculate_expert_consensus(self, location_id: str) -> Dict[str, float]:
        """Calculate expert consensus for a specific location."""
        relevant_feedback = [
            f for f in self.expert_feedback 
            if location_id in f['location_scores']
        ]
        
        if not relevant_feedback:
            return {}
        
        # Weight expert opinions by confidence and expertise
        weighted_scores = defaultdict(list)
        total_weights = defaultdict(float)
        
        for feedback in relevant_feedback:
            expert_id = feedback['expert_id']
            confidence = feedback['confidence_level']
            location_score = feedback['location_scores'][location_id]
            
            # Weight based on confidence and feedback history
            feedback_count = self.expert_weights[expert_id]['feedback_count']
            weight = confidence * min(1.0, feedback_count / 10)  # Cap experience weight
            
            for factor, score in location_score.items():
                weighted_scores[factor].append(score * weight)
                total_weights[factor] += weight
        
        # Calculate weighted averages
        consensus = {}
        for factor in weighted_scores:
            if total_weights[factor] > 0:
                consensus[factor] = sum(weighted_scores[factor]) / total_weights[factor]
        
        self.consensus_scores[location_id] = consensus
        return consensus
    
    def validate_against_expert_consensus(self, scorer: GroundStationInvestmentScorer,
                                        test_locations: pd.DataFrame) -> ValidationMetrics:
        """Validate scorer against expert consensus."""
        if not self.expert_feedback:
            logger.warning("No expert feedback available for validation")
            return ValidationMetrics()
        
        # Score locations with the system
        scored_results = scorer.score_locations(test_locations)
        
        # Compare with expert consensus
        system_scores = []
        expert_scores = []
        
        for idx, row in test_locations.iterrows():
            location_id = f"{row.get('latitude', idx)}_{row.get('longitude', idx)}"
            
            if location_id in self.consensus_scores:
                system_score = scored_results.iloc[idx]['overall_investment_score']
                expert_consensus = self.consensus_scores[location_id].get('overall_score', 0.5)
                
                system_scores.append(system_score)
                expert_scores.append(expert_consensus)
        
        if len(system_scores) == 0:
            logger.warning("No matching locations found for expert validation")
            return ValidationMetrics()
        
        # Calculate validation metrics
        system_scores = np.array(system_scores)
        expert_scores = np.array(expert_scores)
        
        mse = mean_squared_error(expert_scores, system_scores)
        mae = mean_absolute_error(expert_scores, system_scores)
        r2 = r2_score(expert_scores, system_scores)
        correlation = np.corrcoef(system_scores, expert_scores)[0, 1]
        
        metrics = ValidationMetrics(
            mse=mse,
            rmse=np.sqrt(mse),
            mae=mae,
            r2=r2,
            correlation_with_ground_truth=correlation
        )
        
        logger.info(f"Expert validation completed. Correlation = {correlation:.3f}")
        return metrics

class CrossValidationFramework:
    """Framework for comprehensive cross-validation strategies."""
    
    def __init__(self, n_folds: int = 5, random_state: int = 42):
        self.n_folds = n_folds
        self.random_state = random_state
        self.cv_results = {}
    
    def geographic_cross_validation(self, scorer: GroundStationInvestmentScorer,
                                  data: pd.DataFrame, ground_truth: pd.Series,
                                  geographic_splits: int = 4) -> Dict[str, ValidationMetrics]:
        """
        Perform geographic cross-validation to test spatial generalization.
        
        Args:
            scorer: Scoring system to validate
            data: Input data with latitude/longitude
            ground_truth: True scores/outcomes
            geographic_splits: Number of geographic regions to create
        
        Returns:
            Validation metrics for each geographic fold
        """
        logger.info("Running geographic cross-validation...")
        
        if 'latitude' not in data.columns or 'longitude' not in data.columns:
            raise ValueError("Data must contain latitude and longitude columns")
        
        # Create geographic splits based on lat/lon clustering
        from sklearn.cluster import KMeans
        
        coords = data[['latitude', 'longitude']].values
        kmeans = KMeans(n_clusters=geographic_splits, random_state=self.random_state)
        geo_labels = kmeans.fit_predict(coords)
        
        results = {}
        
        for fold in range(geographic_splits):
            test_mask = geo_labels == fold
            train_mask = ~test_mask
            
            if np.sum(test_mask) == 0 or np.sum(train_mask) == 0:
                continue
            
            train_data = data[train_mask]
            test_data = data[test_mask]
            train_truth = ground_truth[train_mask]
            test_truth = ground_truth[test_mask]
            
            # Train/fit scorer on training data (simplified - scorer doesn't need training)
            # Score test data
            test_results = scorer.score_locations(test_data)
            predicted_scores = test_results['overall_investment_score'].values
            
            # Calculate metrics
            metrics = self._calculate_validation_metrics(predicted_scores, test_truth.values)
            results[f'geo_fold_{fold}'] = metrics
            
            logger.info(f"Geographic fold {fold}: R² = {metrics.r2:.3f}")
        
        self.cv_results['geographic'] = results
        return results
    
    def temporal_cross_validation(self, scorer: GroundStationInvestmentScorer,
                                data: pd.DataFrame, ground_truth: pd.Series,
                                date_column: str = 'date') -> Dict[str, ValidationMetrics]:
        """
        Perform temporal cross-validation for time-series data.
        
        Args:
            scorer: Scoring system to validate
            data: Input data with date column
            ground_truth: True scores/outcomes
            date_column: Name of date column
        
        Returns:
            Validation metrics for each temporal fold
        """
        logger.info("Running temporal cross-validation...")
        
        if date_column not in data.columns:
            raise ValueError(f"Data must contain {date_column} column")
        
        # Sort by date
        data_sorted = data.sort_values(date_column)
        ground_truth_sorted = ground_truth.loc[data_sorted.index]
        
        # Use TimeSeriesSplit
        tscv = TimeSeriesSplit(n_splits=self.n_folds)
        results = {}
        
        for fold, (train_idx, test_idx) in enumerate(tscv.split(data_sorted)):
            train_data = data_sorted.iloc[train_idx]
            test_data = data_sorted.iloc[test_idx]
            train_truth = ground_truth_sorted.iloc[train_idx]
            test_truth = ground_truth_sorted.iloc[test_idx]
            
            # Score test data
            test_results = scorer.score_locations(test_data)
            predicted_scores = test_results['overall_investment_score'].values
            
            # Calculate metrics
            metrics = self._calculate_validation_metrics(predicted_scores, test_truth.values)
            results[f'temporal_fold_{fold}'] = metrics
            
            logger.info(f"Temporal fold {fold}: R² = {metrics.r2:.3f}")
        
        self.cv_results['temporal'] = results
        return results
    
    def stratified_cross_validation(self, scorer: GroundStationInvestmentScorer,
                                  data: pd.DataFrame, ground_truth: pd.Series,
                                  stratify_column: str) -> Dict[str, ValidationMetrics]:
        """
        Perform stratified cross-validation based on a categorical variable.
        
        Args:
            scorer: Scoring system to validate
            data: Input data
            ground_truth: True scores/outcomes
            stratify_column: Column to stratify on (e.g., 'country', 'region')
        
        Returns:
            Validation metrics for each stratified fold
        """
        logger.info("Running stratified cross-validation...")
        
        if stratify_column not in data.columns:
            raise ValueError(f"Data must contain {stratify_column} column")
        
        # Convert ground truth to binary for stratification
        ground_truth_binary = (ground_truth > ground_truth.median()).astype(int)
        
        skf = StratifiedKFold(n_splits=self.n_folds, shuffle=True, random_state=self.random_state)
        results = {}
        
        for fold, (train_idx, test_idx) in enumerate(skf.split(data, ground_truth_binary)):
            train_data = data.iloc[train_idx]
            test_data = data.iloc[test_idx]
            train_truth = ground_truth.iloc[train_idx]
            test_truth = ground_truth.iloc[test_idx]
            
            # Score test data
            test_results = scorer.score_locations(test_data)
            predicted_scores = test_results['overall_investment_score'].values
            
            # Calculate metrics
            metrics = self._calculate_validation_metrics(predicted_scores, test_truth.values)
            results[f'stratified_fold_{fold}'] = metrics
            
            logger.info(f"Stratified fold {fold}: R² = {metrics.r2:.3f}")
        
        self.cv_results['stratified'] = results
        return results
    
    def _calculate_validation_metrics(self, predicted: np.ndarray, 
                                    actual: np.ndarray) -> ValidationMetrics:
        """Calculate comprehensive validation metrics."""
        # Ensure same length
        min_length = min(len(predicted), len(actual))
        predicted = predicted[:min_length]
        actual = actual[:min_length]
        
        # Regression metrics
        mse = mean_squared_error(actual, predicted)
        mae = mean_absolute_error(actual, predicted)
        r2 = r2_score(actual, predicted)
        
        # Statistical correlations
        correlation = np.corrcoef(predicted, actual)[0, 1] if len(predicted) > 1 else 0
        spearman_corr = stats.spearmanr(predicted, actual)[0] if len(predicted) > 1 else 0
        
        # Binary classification metrics
        threshold = np.median(actual)
        predicted_binary = (predicted >= threshold).astype(int)
        actual_binary = (actual >= threshold).astype(int)
        
        if len(np.unique(actual_binary)) > 1:
            accuracy = np.mean(predicted_binary == actual_binary)
            precision = precision_score(actual_binary, predicted_binary, zero_division=0)
            recall = recall_score(actual_binary, predicted_binary, zero_division=0)
            f1 = f1_score(actual_binary, predicted_binary, zero_division=0)
        else:
            accuracy = precision = recall = f1 = 0.0
        
        return ValidationMetrics(
            mse=mse, rmse=np.sqrt(mse), mae=mae, r2=r2,
            accuracy=accuracy, precision=precision, recall=recall, f1=f1,
            correlation_with_ground_truth=correlation,
            spearman_correlation=spearman_corr
        )
    
    def summarize_cv_results(self) -> Dict[str, Any]:
        """Summarize cross-validation results across all methods."""
        summary = {}
        
        for cv_method, results in self.cv_results.items():
            if not results:
                continue
            
            # Extract metrics from all folds
            r2_scores = [metrics.r2 for metrics in results.values()]
            mse_scores = [metrics.mse for metrics in results.values()]
            mae_scores = [metrics.mae for metrics in results.values()]
            
            summary[cv_method] = {
                'mean_r2': np.mean(r2_scores),
                'std_r2': np.std(r2_scores),
                'mean_mse': np.mean(mse_scores),
                'std_mse': np.std(mse_scores),
                'mean_mae': np.mean(mae_scores),
                'std_mae': np.std(mae_scores),
                'n_folds': len(results)
            }
        
        return summary

def create_sample_ground_truth_data(n_stations: int = 100) -> pd.DataFrame:
    """Create sample ground truth data for validation testing."""
    np.random.seed(42)
    
    # Generate realistic ground station data
    data = {
        'latitude': np.random.uniform(-60, 60, n_stations),
        'longitude': np.random.uniform(-180, 180, n_stations),
        'investment_date': pd.date_range('2015-01-01', '2023-12-31', periods=n_stations),
        'success_score': np.random.beta(6, 4, n_stations),  # Skewed towards success
        'roi': np.random.normal(0.2, 0.15, n_stations),  # 20% average ROI
        'operational_status': np.random.choice(['active', 'inactive'], n_stations, p=[0.8, 0.2])
    }
    
    # Ensure ROI aligns with success score
    for i in range(n_stations):
        if data['success_score'][i] > 0.7:
            data['roi'][i] = max(data['roi'][i], 0.1)  # Ensure positive ROI for successful stations
        elif data['success_score'][i] < 0.3:
            data['roi'][i] = min(data['roi'][i], 0.05)  # Lower ROI for unsuccessful stations
    
    return pd.DataFrame(data)

def main():
    """Main function demonstrating the validation framework."""
    logger.info("Starting Validation Framework Demonstration")
    
    # Create sample data
    from ground_station_investment_scorer import create_sample_data
    
    sample_data = create_sample_data(n_locations=200)
    ground_truth_data = create_sample_ground_truth_data(n_stations=200)
    
    # Create scorer
    scorer = GroundStationInvestmentScorer()
    
    # 1. Ground Truth Validation
    logger.info("=== Ground Truth Validation ===")
    ground_truth_validator = GroundTruthValidator(ground_truth_data)
    
    # Use sample data for validation (in practice, would be data for the same locations as ground truth)
    gt_metrics = ground_truth_validator.validate_against_ground_truth(scorer, sample_data[:100])
    
    print(f"Ground Truth Validation Results:")
    print(f"  R² Score: {gt_metrics.r2:.3f}")
    print(f"  RMSE: {gt_metrics.rmse:.3f}")
    print(f"  Investment Success Rate: {gt_metrics.investment_success_rate:.3f}")
    print(f"  Top-5 Accuracy: {gt_metrics.top_k_accuracy.get(5, 0):.3f}")
    
    # 2. Backtesting
    logger.info("\n=== Backtesting Analysis ===")
    
    # Create historical data with dates
    historical_data = sample_data.copy()
    historical_data['date'] = pd.date_range('2018-01-01', '2023-12-31', periods=len(sample_data))
    
    backtest_framework = BacktestingFramework(historical_data, ground_truth_data)
    backtest_results = backtest_framework.run_time_series_backtest(
        scorer, lookback_months=12, prediction_horizon_months=6
    )
    
    if backtest_results:
        overall_performance = backtest_framework.calculate_overall_backtest_performance()
        print(f"Backtesting Results:")
        print(f"  Overall Success Rate: {overall_performance.get('overall_success_rate', 0):.3f}")
        print(f"  Overall ROI: {overall_performance.get('overall_roi', 0):.3f}")
        print(f"  Periods Tested: {overall_performance.get('total_periods_tested', 0)}")
        print(f"  Sharpe Ratio: {overall_performance.get('sharpe_ratio', 0):.3f}")
    
    # 3. Expert Validation
    logger.info("\n=== Expert Validation ===")
    expert_framework = ExpertValidationFramework()
    
    # Simulate expert feedback
    for i in range(3):  # 3 experts
        expert_scores = {}
        for j in range(10):  # 10 locations each
            location_id = f"{sample_data.iloc[j]['latitude']}_{sample_data.iloc[j]['longitude']}"
            expert_scores[location_id] = {
                'overall_score': np.random.beta(5, 3),  # Expert opinion
                'infrastructure_score': np.random.beta(6, 4),
                'market_demand_score': np.random.beta(4, 6)
            }
        
        expert_framework.collect_expert_feedback(
            expert_id=f"expert_{i+1}",
            location_scores=expert_scores,
            expertise_areas=['technical', 'market'] if i % 2 == 0 else ['regulatory', 'financial'],
            confidence_level=0.7 + 0.1 * i
        )
    
    expert_metrics = expert_framework.validate_against_expert_consensus(scorer, sample_data[:10])
    print(f"Expert Validation Results:")
    print(f"  Correlation with Expert Consensus: {expert_metrics.correlation_with_ground_truth:.3f}")
    print(f"  RMSE vs Expert Scores: {expert_metrics.rmse:.3f}")
    
    # 4. Cross-Validation
    logger.info("\n=== Cross-Validation Analysis ===")
    cv_framework = CrossValidationFramework(n_folds=5)
    
    # Use ground truth success scores as target
    ground_truth_series = pd.Series(ground_truth_data['success_score'].values[:len(sample_data)])
    
    # Geographic CV
    geo_results = cv_framework.geographic_cross_validation(
        scorer, sample_data, ground_truth_series, geographic_splits=4
    )
    
    # Stratified CV (if country column exists)
    if 'country' in sample_data.columns:
        stratified_results = cv_framework.stratified_cross_validation(
            scorer, sample_data, ground_truth_series, 'country'
        )
    
    # Summarize CV results
    cv_summary = cv_framework.summarize_cv_results()
    
    print(f"Cross-Validation Summary:")
    for method, results in cv_summary.items():
        print(f"  {method.title()}:")
        print(f"    Mean R²: {results['mean_r2']:.3f} ± {results['std_r2']:.3f}")
        print(f"    Mean RMSE: {np.sqrt(results['mean_mse']):.3f} ± {np.sqrt(results['std_mse']):.3f}")
    
    # 5. Overall Validation Summary
    print(f"\n" + "="*80)
    print("OVERALL VALIDATION SUMMARY")
    print("="*80)
    
    validation_summary = {
        'ground_truth_validation': {
            'r2_score': gt_metrics.r2,
            'success_rate': gt_metrics.investment_success_rate,
            'top_k_accuracy': gt_metrics.top_k_accuracy
        },
        'backtesting_performance': overall_performance if backtest_results else {},
        'expert_validation': {
            'correlation': expert_metrics.correlation_with_ground_truth,
            'rmse': expert_metrics.rmse
        },
        'cross_validation': cv_summary
    }
    
    # Save validation results
    results_dir = Path("validation_results")
    results_dir.mkdir(exist_ok=True)
    
    with open(results_dir / "validation_summary.json", 'w') as f:
        json.dump(validation_summary, f, indent=2, default=str)
    
    logger.info(f"Validation results saved to {results_dir}")
    
    return validation_summary

if __name__ == "__main__":
    validation_summary = main()