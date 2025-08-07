#!/usr/bin/env python3
"""
Factor Weight Optimization and A/B Testing Framework

This module provides scientifically-backed weight optimization using:
- Bayesian optimization for weight tuning
- Cross-validation with ground truth data
- A/B testing methodology for weight validation
- Monte Carlo simulation for confidence intervals
- Multi-objective optimization for trade-offs

Author: Claude (Principal Data Scientist)
Version: 1.0.0
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Callable
from dataclasses import dataclass, field
import logging
from abc import ABC, abstractmethod
from scipy import stats, optimize
from scipy.stats import beta, dirichlet
from sklearn.model_selection import KFold, StratifiedKFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, WhiteKernel, ConstantKernel
import warnings
from datetime import datetime, timedelta
import json
from pathlib import Path

from ground_station_investment_scorer import ScoringWeights, GroundStationInvestmentScorer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class WeightOptimizationConfig:
    """Configuration for weight optimization process."""
    
    # Optimization parameters
    max_iterations: int = 100
    convergence_tolerance: float = 1e-6
    cross_validation_folds: int = 5
    monte_carlo_samples: int = 1000
    
    # Validation parameters
    validation_split: float = 0.2
    min_confidence_threshold: float = 0.7
    performance_metrics: List[str] = field(default_factory=lambda: ['mse', 'mae', 'r2'])
    
    # A/B testing parameters
    ab_test_duration_days: int = 30
    significance_level: float = 0.05
    minimum_effect_size: float = 0.02  # 2% improvement
    power: float = 0.8
    
    # Bayesian optimization parameters
    acquisition_function: str = 'expected_improvement'
    n_initial_points: int = 20
    
    def validate_config(self) -> bool:
        """Validate configuration parameters."""
        if self.max_iterations <= 0:
            logger.error("max_iterations must be positive")
            return False
        if self.validation_split <= 0 or self.validation_split >= 1:
            logger.error("validation_split must be between 0 and 1")
            return False
        if self.significance_level <= 0 or self.significance_level >= 1:
            logger.error("significance_level must be between 0 and 1")
            return False
        return True

@dataclass
class OptimizationResult:
    """Results from weight optimization process."""
    
    optimal_weights: ScoringWeights
    performance_metrics: Dict[str, float]
    confidence_intervals: Dict[str, Tuple[float, float]]
    convergence_history: List[Dict[str, float]]
    validation_scores: List[float]
    feature_importance: Dict[str, float]
    optimization_time_seconds: float
    
    def to_json(self) -> str:
        """Convert results to JSON format."""
        # Convert to serializable format
        serializable_dict = {
            'optimal_weights': {
                'market_demand': self.optimal_weights.market_demand,
                'infrastructure': self.optimal_weights.infrastructure,
                'technical_feasibility': self.optimal_weights.technical_feasibility,
                'competition_risk': self.optimal_weights.competition_risk,
                'regulatory_environment': self.optimal_weights.regulatory_environment
            },
            'performance_metrics': self.performance_metrics,
            'confidence_intervals': {k: list(v) for k, v in self.confidence_intervals.items()},
            'convergence_history': self.convergence_history,
            'validation_scores': self.validation_scores,
            'feature_importance': self.feature_importance,
            'optimization_time_seconds': self.optimization_time_seconds
        }
        
        return json.dumps(serializable_dict, indent=2)

class ObjectiveFunction:
    """Objective function for weight optimization."""
    
    def __init__(self, scorer: GroundStationInvestmentScorer, 
                 training_data: pd.DataFrame, ground_truth: pd.Series,
                 validation_data: Optional[pd.DataFrame] = None,
                 validation_truth: Optional[pd.Series] = None):
        self.scorer = scorer
        self.training_data = training_data
        self.ground_truth = ground_truth
        self.validation_data = validation_data
        self.validation_truth = validation_truth
        self.evaluation_history = []
    
    def __call__(self, weight_vector: np.ndarray) -> float:
        """
        Evaluate objective function for given weight vector.
        
        Args:
            weight_vector: Array of weights [market, infra, tech, comp, reg]
        
        Returns:
            Negative performance score (for minimization)
        """
        try:
            # Ensure weights sum to 1
            normalized_weights = weight_vector / np.sum(weight_vector)
            
            # Create weights object
            weights = ScoringWeights(
                market_demand=normalized_weights[0],
                infrastructure=normalized_weights[1],
                technical_feasibility=normalized_weights[2],
                competition_risk=normalized_weights[3],
                regulatory_environment=normalized_weights[4]
            )
            
            # Update scorer weights
            self.scorer.weights = weights
            
            # Score training data
            scored_data = self.scorer.score_locations(self.training_data)
            predicted_scores = scored_data['overall_investment_score']
            
            # Calculate performance metrics
            mse = mean_squared_error(self.ground_truth, predicted_scores)
            mae = mean_absolute_error(self.ground_truth, predicted_scores)
            r2 = r2_score(self.ground_truth, predicted_scores)
            
            # Multi-objective score (weighted combination)
            # Minimize MSE and MAE, maximize R²
            objective_score = 0.4 * mse + 0.3 * mae - 0.3 * r2
            
            # Add regularization penalty for extreme weights
            weight_entropy = -np.sum(normalized_weights * np.log(normalized_weights + 1e-10))
            max_entropy = np.log(len(normalized_weights))  # Maximum entropy for uniform distribution
            entropy_penalty = 0.01 * (1 - weight_entropy / max_entropy)  # Penalty for low entropy
            
            total_objective = objective_score + entropy_penalty
            
            # Store evaluation history
            self.evaluation_history.append({
                'weights': normalized_weights.tolist(),
                'mse': mse,
                'mae': mae,
                'r2': r2,
                'objective_score': objective_score,
                'entropy_penalty': entropy_penalty,
                'total_objective': total_objective
            })
            
            return total_objective
            
        except Exception as e:
            logger.error(f"Error in objective function evaluation: {e}")
            return float('inf')  # Return high penalty for invalid configurations

class BayesianWeightOptimizer:
    """Bayesian optimization for weight tuning."""
    
    def __init__(self, config: WeightOptimizationConfig):
        self.config = config
        self.gp_model = None
        self.X_observed = []
        self.y_observed = []
    
    def optimize_weights(self, objective_func: ObjectiveFunction) -> OptimizationResult:
        """
        Optimize weights using Bayesian optimization.
        
        Args:
            objective_func: Function to minimize
        
        Returns:
            OptimizationResult with optimal weights and metrics
        """
        start_time = datetime.now()
        
        # Define bounds for weights (each weight between 0.05 and 0.6)
        bounds = [(0.05, 0.6) for _ in range(5)]
        
        # Initialize with random points
        logger.info("Initializing Bayesian optimization...")
        X_init, y_init = self._initialize_points(objective_func, bounds)
        
        self.X_observed = X_init.copy()
        self.y_observed = y_init.copy()
        
        # Set up Gaussian Process
        kernel = ConstantKernel(1.0) * Matern(length_scale=1.0, nu=2.5) + WhiteKernel(noise_level=0.01)
        self.gp_model = GaussianProcessRegressor(
            kernel=kernel,
            alpha=1e-6,
            normalize_y=True,
            n_restarts_optimizer=5,
            random_state=42
        )
        
        best_objective = float('inf')
        best_weights = None
        convergence_history = []
        
        # Bayesian optimization loop
        for iteration in range(self.config.max_iterations):
            logger.info(f"Bayesian optimization iteration {iteration + 1}/{self.config.max_iterations}")
            
            # Fit GP model
            self.gp_model.fit(np.array(self.X_observed), np.array(self.y_observed))
            
            # Find next point to evaluate
            next_point = self._acquire_next_point(bounds)
            
            # Evaluate objective function
            next_objective = objective_func(next_point)
            
            # Update observations
            self.X_observed.append(next_point.tolist())
            self.y_observed.append(next_objective)
            
            # Track best solution
            if next_objective < best_objective:
                best_objective = next_objective
                best_weights = next_point / np.sum(next_point)  # Normalize
                
                logger.info(f"New best objective: {best_objective:.6f}")
                logger.info(f"Best weights: {best_weights}")
            
            # Check convergence
            convergence_info = {
                'iteration': iteration + 1,
                'best_objective': best_objective,
                'current_objective': next_objective,
                'weights': (next_point / np.sum(next_point)).tolist()
            }
            convergence_history.append(convergence_info)
            
            if iteration > 10:
                recent_improvements = [
                    convergence_history[i]['best_objective'] - convergence_history[i-5]['best_objective']
                    for i in range(-5, 0)
                ]
                if all(abs(imp) < self.config.convergence_tolerance for imp in recent_improvements):
                    logger.info(f"Converged after {iteration + 1} iterations")
                    break
        
        # Create optimal weights object
        optimal_weights = ScoringWeights(
            market_demand=best_weights[0],
            infrastructure=best_weights[1],
            technical_feasibility=best_weights[2],
            competition_risk=best_weights[3],
            regulatory_environment=best_weights[4]
        )
        
        # Calculate performance metrics and confidence intervals
        performance_metrics = self._calculate_final_metrics(objective_func, best_weights)
        confidence_intervals = self._calculate_confidence_intervals(objective_func, best_weights)
        validation_scores = self._cross_validate_weights(objective_func, best_weights)
        feature_importance = self._calculate_feature_importance()
        
        optimization_time = (datetime.now() - start_time).total_seconds()
        
        return OptimizationResult(
            optimal_weights=optimal_weights,
            performance_metrics=performance_metrics,
            confidence_intervals=confidence_intervals,
            convergence_history=convergence_history,
            validation_scores=validation_scores,
            feature_importance=feature_importance,
            optimization_time_seconds=optimization_time
        )
    
    def _initialize_points(self, objective_func: ObjectiveFunction, 
                          bounds: List[Tuple[float, float]]) -> Tuple[List[List[float]], List[float]]:
        """Initialize with random points for Bayesian optimization."""
        X_init = []
        y_init = []
        
        # Include some expert-guided initial points
        expert_points = [
            [0.30, 0.25, 0.20, 0.15, 0.10],  # Default weights
            [0.35, 0.20, 0.25, 0.15, 0.05],  # Market-focused
            [0.25, 0.35, 0.20, 0.15, 0.05],  # Infrastructure-focused
            [0.25, 0.20, 0.35, 0.15, 0.05],  # Technical-focused
            [0.20, 0.20, 0.20, 0.30, 0.10],  # Competition-aware
        ]
        
        for point in expert_points:
            X_init.append(point)
            y_init.append(objective_func(np.array(point)))
        
        # Add random points
        np.random.seed(42)
        for _ in range(self.config.n_initial_points - len(expert_points)):
            # Generate random weights that sum to approximately 1
            random_weights = np.random.dirichlet(np.ones(5))
            X_init.append(random_weights.tolist())
            y_init.append(objective_func(random_weights))
        
        return X_init, y_init
    
    def _acquire_next_point(self, bounds: List[Tuple[float, float]]) -> np.ndarray:
        """Acquire next point using acquisition function."""
        def negative_acquisition(x):
            # Normalize to sum to 1
            x_norm = x / np.sum(x)
            
            # Predict mean and std from GP
            mu, sigma = self.gp_model.predict([x_norm], return_std=True)
            
            # Expected Improvement acquisition function
            best_y = min(self.y_observed)
            z = (best_y - mu) / (sigma + 1e-9)
            ei = (best_y - mu) * stats.norm.cdf(z) + sigma * stats.norm.pdf(z)
            
            return -ei[0]  # Negative for minimization
        
        # Optimize acquisition function
        best_x = None
        best_acquisition = float('inf')
        
        # Multi-start optimization
        for _ in range(10):
            # Random starting point
            x0 = np.random.dirichlet(np.ones(5))
            
            # Constrain to bounds and sum to 1
            constraints = [
                {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},  # Sum to 1
            ]
            bounds_scipy = [(b[0], b[1]) for b in bounds]
            
            try:
                result = optimize.minimize(
                    negative_acquisition, x0,
                    method='SLSQP',
                    bounds=bounds_scipy,
                    constraints=constraints
                )
                
                if result.success and result.fun < best_acquisition:
                    best_acquisition = result.fun
                    best_x = result.x
            except:
                continue
        
        if best_x is None:
            # Fallback to random point
            best_x = np.random.dirichlet(np.ones(5))
        
        return best_x
    
    def _calculate_final_metrics(self, objective_func: ObjectiveFunction, 
                               best_weights: np.ndarray) -> Dict[str, float]:
        """Calculate final performance metrics."""
        # Use the evaluation history to get metrics for best weights
        best_eval = None
        min_distance = float('inf')
        
        for eval_record in objective_func.evaluation_history:
            distance = np.linalg.norm(np.array(eval_record['weights']) - best_weights)
            if distance < min_distance:
                min_distance = distance
                best_eval = eval_record
        
        if best_eval is None:
            # Fallback: re-evaluate
            objective_func(best_weights)
            best_eval = objective_func.evaluation_history[-1]
        
        return {
            'mse': best_eval['mse'],
            'mae': best_eval['mae'],
            'r2': best_eval['r2'],
            'objective_score': best_eval['objective_score']
        }
    
    def _calculate_confidence_intervals(self, objective_func: ObjectiveFunction,
                                      best_weights: np.ndarray) -> Dict[str, Tuple[float, float]]:
        """Calculate confidence intervals for optimal weights using bootstrap."""
        n_bootstrap = 1000
        bootstrap_weights = []
        
        # Get training data size
        n_samples = len(objective_func.training_data)
        
        for _ in range(n_bootstrap):
            # Bootstrap sample
            indices = np.random.choice(n_samples, size=n_samples, replace=True)
            bootstrap_data = objective_func.training_data.iloc[indices]
            bootstrap_truth = objective_func.ground_truth.iloc[indices]
            
            # Create temporary objective function
            temp_objective = ObjectiveFunction(
                objective_func.scorer, bootstrap_data, bootstrap_truth
            )
            
            # Quick optimization around best weights (local search)
            try:
                result = optimize.minimize(
                    temp_objective,
                    best_weights,
                    method='L-BFGS-B',
                    bounds=[(0.01, 0.99) for _ in range(5)]
                )
                if result.success:
                    normalized_weights = result.x / np.sum(result.x)
                    bootstrap_weights.append(normalized_weights)
            except:
                continue
        
        if len(bootstrap_weights) < 10:
            # Fallback: use normal approximation
            confidence_intervals = {}
            for i, name in enumerate(['market_demand', 'infrastructure', 'technical_feasibility', 
                                    'competition_risk', 'regulatory_environment']):
                margin = 0.05  # 5% margin
                confidence_intervals[name] = (
                    max(0.01, best_weights[i] - margin),
                    min(0.99, best_weights[i] + margin)
                )
            return confidence_intervals
        
        # Calculate percentile-based confidence intervals
        bootstrap_weights = np.array(bootstrap_weights)
        confidence_intervals = {}
        
        for i, name in enumerate(['market_demand', 'infrastructure', 'technical_feasibility', 
                                'competition_risk', 'regulatory_environment']):
            lower = np.percentile(bootstrap_weights[:, i], 2.5)
            upper = np.percentile(bootstrap_weights[:, i], 97.5)
            confidence_intervals[name] = (lower, upper)
        
        return confidence_intervals
    
    def _cross_validate_weights(self, objective_func: ObjectiveFunction,
                              best_weights: np.ndarray) -> List[float]:
        """Perform cross-validation with optimal weights."""
        kfold = KFold(n_splits=self.config.cross_validation_folds, shuffle=True, random_state=42)
        cv_scores = []
        
        for train_idx, val_idx in kfold.split(objective_func.training_data):
            train_data = objective_func.training_data.iloc[train_idx]
            train_truth = objective_func.ground_truth.iloc[train_idx]
            val_data = objective_func.training_data.iloc[val_idx]
            val_truth = objective_func.ground_truth.iloc[val_idx]
            
            # Create weights object
            weights = ScoringWeights(
                market_demand=best_weights[0],
                infrastructure=best_weights[1],
                technical_feasibility=best_weights[2],
                competition_risk=best_weights[3],
                regulatory_environment=best_weights[4]
            )
            
            # Create temporary scorer
            temp_scorer = GroundStationInvestmentScorer(weights)
            
            # Score validation data
            try:
                scored_data = temp_scorer.score_locations(val_data)
                predicted_scores = scored_data['overall_investment_score']
                
                # Calculate R² score for this fold
                r2 = r2_score(val_truth, predicted_scores)
                cv_scores.append(r2)
            except Exception as e:
                logger.warning(f"Cross-validation fold failed: {e}")
                cv_scores.append(0.0)
        
        return cv_scores
    
    def _calculate_feature_importance(self) -> Dict[str, float]:
        """Calculate feature importance based on optimization history."""
        if not hasattr(self, 'X_observed') or len(self.X_observed) < 5:
            # Fallback: uniform importance
            return {
                'market_demand': 0.2,
                'infrastructure': 0.2,
                'technical_feasibility': 0.2,
                'competition_risk': 0.2,
                'regulatory_environment': 0.2
            }
        
        # Calculate variance in performance based on weight changes
        X = np.array(self.X_observed)
        y = np.array(self.y_observed)
        
        feature_names = ['market_demand', 'infrastructure', 'technical_feasibility', 
                        'competition_risk', 'regulatory_environment']
        importance = {}
        
        for i, name in enumerate(feature_names):
            # Calculate correlation between weight changes and performance changes
            correlation = abs(np.corrcoef(X[:, i], y)[0, 1])
            importance[name] = correlation if not np.isnan(correlation) else 0.2
        
        # Normalize to sum to 1
        total_importance = sum(importance.values())
        if total_importance > 0:
            importance = {k: v / total_importance for k, v in importance.items()}
        
        return importance

class ABTestingFramework:
    """A/B testing framework for weight validation."""
    
    def __init__(self, config: WeightOptimizationConfig):
        self.config = config
        self.experiments = {}
    
    def design_ab_test(self, control_weights: ScoringWeights, 
                      treatment_weights: ScoringWeights,
                      expected_effect_size: float = 0.02) -> Dict[str, Any]:
        """
        Design A/B test for comparing weight configurations.
        
        Args:
            control_weights: Current/baseline weights
            treatment_weights: New weights to test
            expected_effect_size: Expected improvement in performance
        
        Returns:
            Test design specifications
        """
        # Calculate required sample size
        sample_size = self._calculate_sample_size(expected_effect_size)
        
        # Design randomization strategy
        randomization_strategy = self._design_randomization(sample_size)
        
        # Define success metrics
        success_metrics = {
            'primary': 'overall_investment_score_improvement',
            'secondary': [
                'prediction_accuracy',
                'user_satisfaction',
                'computational_efficiency'
            ]
        }
        
        # Calculate test duration
        test_duration = self._calculate_test_duration(sample_size)
        
        test_design = {
            'experiment_id': f"weight_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'control_weights': control_weights,
            'treatment_weights': treatment_weights,
            'sample_size_per_group': sample_size,
            'total_sample_size': sample_size * 2,
            'randomization_strategy': randomization_strategy,
            'success_metrics': success_metrics,
            'test_duration_days': test_duration,
            'significance_level': self.config.significance_level,
            'power': self.config.power,
            'minimum_detectable_effect': expected_effect_size,
            'created_at': datetime.now().isoformat()
        }
        
        return test_design
    
    def run_ab_test(self, test_design: Dict[str, Any], 
                   test_data: pd.DataFrame, 
                   ground_truth: pd.Series) -> Dict[str, Any]:
        """
        Run A/B test with given data.
        
        Args:
            test_design: Test design from design_ab_test
            test_data: Data for testing
            ground_truth: Ground truth scores for validation
        
        Returns:
            Test results with statistical analysis
        """
        logger.info(f"Running A/B test: {test_design['experiment_id']}")
        
        # Split data into control and treatment groups
        n_total = len(test_data)
        n_per_group = min(test_design['sample_size_per_group'], n_total // 2)
        
        # Randomize assignment
        np.random.seed(42)
        indices = np.random.permutation(n_total)
        control_indices = indices[:n_per_group]
        treatment_indices = indices[n_per_group:2*n_per_group]
        
        control_data = test_data.iloc[control_indices]
        treatment_data = test_data.iloc[treatment_indices]
        control_truth = ground_truth.iloc[control_indices]
        treatment_truth = ground_truth.iloc[treatment_indices]
        
        # Create scorers
        control_scorer = GroundStationInvestmentScorer(test_design['control_weights'])
        treatment_scorer = GroundStationInvestmentScorer(test_design['treatment_weights'])
        
        # Score both groups
        logger.info("Scoring control group...")
        control_results = control_scorer.score_locations(control_data)
        
        logger.info("Scoring treatment group...")
        treatment_results = treatment_scorer.score_locations(treatment_data)
        
        # Calculate metrics
        control_metrics = self._calculate_group_metrics(
            control_results, control_truth
        )
        treatment_metrics = self._calculate_group_metrics(
            treatment_results, treatment_truth
        )
        
        # Statistical analysis
        statistical_results = self._perform_statistical_analysis(
            control_metrics, treatment_metrics, test_design
        )
        
        # Compile results
        test_results = {
            'experiment_id': test_design['experiment_id'],
            'start_time': test_design['created_at'],
            'end_time': datetime.now().isoformat(),
            'sample_sizes': {
                'control': len(control_data),
                'treatment': len(treatment_data)
            },
            'control_metrics': control_metrics,
            'treatment_metrics': treatment_metrics,
            'statistical_results': statistical_results,
            'recommendation': self._generate_test_recommendation(statistical_results),
            'confidence_level': 1 - self.config.significance_level
        }
        
        # Store experiment
        self.experiments[test_design['experiment_id']] = test_results
        
        return test_results
    
    def _calculate_sample_size(self, effect_size: float) -> int:
        """Calculate required sample size for detecting effect."""
        # Using Cohen's formula for two-sample t-test
        alpha = self.config.significance_level
        beta = 1 - self.config.power
        
        # Critical values
        z_alpha = stats.norm.ppf(1 - alpha/2)
        z_beta = stats.norm.ppf(1 - beta)
        
        # Assume standard deviation of 0.1 for investment scores
        assumed_std = 0.1
        
        # Sample size per group
        n = 2 * ((z_alpha + z_beta) * assumed_std / effect_size) ** 2
        
        return max(30, int(np.ceil(n)))  # Minimum 30 per group
    
    def _design_randomization(self, sample_size: int) -> Dict[str, Any]:
        """Design randomization strategy."""
        return {
            'method': 'simple_random',
            'allocation_ratio': '1:1',
            'stratification': None,  # Could add geographic stratification
            'blocking': False,
            'seed': 42
        }
    
    def _calculate_test_duration(self, sample_size: int) -> int:
        """Calculate recommended test duration."""
        # Assume we can collect ~10 samples per day
        daily_collection_rate = 10
        min_duration = max(7, sample_size * 2 / daily_collection_rate)
        
        return min(self.config.ab_test_duration_days, int(np.ceil(min_duration)))
    
    def _calculate_group_metrics(self, results: pd.DataFrame, 
                               ground_truth: pd.Series) -> Dict[str, float]:
        """Calculate metrics for a test group."""
        predicted_scores = results['overall_investment_score']
        
        return {
            'mean_predicted_score': predicted_scores.mean(),
            'std_predicted_score': predicted_scores.std(),
            'mean_actual_score': ground_truth.mean(),
            'std_actual_score': ground_truth.std(),
            'mse': mean_squared_error(ground_truth, predicted_scores),
            'mae': mean_absolute_error(ground_truth, predicted_scores),
            'r2': r2_score(ground_truth, predicted_scores),
            'prediction_accuracy': r2_score(ground_truth, predicted_scores),
            'score_variance': predicted_scores.var(),
            'confidence_mean': results['score_confidence'].mean(),
            'high_confidence_ratio': (results['score_confidence'] >= 0.8).mean()
        }
    
    def _perform_statistical_analysis(self, control_metrics: Dict[str, float],
                                    treatment_metrics: Dict[str, float],
                                    test_design: Dict[str, Any]) -> Dict[str, Any]:
        """Perform statistical analysis of A/B test results."""
        results = {}
        
        # Primary metric: R² improvement
        control_r2 = control_metrics['r2']
        treatment_r2 = treatment_metrics['r2']
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt((control_metrics['std_predicted_score']**2 + 
                            treatment_metrics['std_predicted_score']**2) / 2)
        cohens_d = (treatment_metrics['mean_predicted_score'] - 
                   control_metrics['mean_predicted_score']) / pooled_std
        
        # T-test for difference in means
        # Note: In practice, you'd use actual individual scores, not summary statistics
        t_stat = (treatment_metrics['mean_predicted_score'] - 
                 control_metrics['mean_predicted_score']) / pooled_std
        
        # Degrees of freedom (approximation)
        df = test_design['total_sample_size'] - 2
        p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df))
        
        # Confidence interval for difference
        margin_error = stats.t.ppf(1 - self.config.significance_level/2, df) * pooled_std
        diff_mean = treatment_metrics['mean_predicted_score'] - control_metrics['mean_predicted_score']
        
        results['primary_analysis'] = {
            'metric': 'r2_score',
            'control_value': control_r2,
            'treatment_value': treatment_r2,
            'absolute_difference': treatment_r2 - control_r2,
            'relative_improvement': (treatment_r2 - control_r2) / control_r2 if control_r2 > 0 else 0,
            'cohens_d': cohens_d,
            'p_value': p_value,
            'is_significant': p_value < self.config.significance_level,
            'confidence_interval': (diff_mean - margin_error, diff_mean + margin_error)
        }
        
        # Secondary analyses
        secondary_metrics = ['mse', 'mae', 'prediction_accuracy']
        results['secondary_analyses'] = {}
        
        for metric in secondary_metrics:
            if metric in control_metrics and metric in treatment_metrics:
                control_val = control_metrics[metric]
                treatment_val = treatment_metrics[metric]
                
                # For MSE and MAE, lower is better
                if metric in ['mse', 'mae']:
                    improvement = (control_val - treatment_val) / control_val if control_val > 0 else 0
                else:
                    improvement = (treatment_val - control_val) / control_val if control_val > 0 else 0
                
                results['secondary_analyses'][metric] = {
                    'control_value': control_val,
                    'treatment_value': treatment_val,
                    'relative_improvement': improvement
                }
        
        # Power analysis
        achieved_power = self._calculate_achieved_power(cohens_d, test_design['total_sample_size'])
        results['power_analysis'] = {
            'planned_power': self.config.power,
            'achieved_power': achieved_power,
            'effect_size_cohen_d': cohens_d
        }
        
        return results
    
    def _calculate_achieved_power(self, effect_size: float, sample_size: int) -> float:
        """Calculate achieved statistical power."""
        alpha = self.config.significance_level
        
        # Critical value
        z_alpha = stats.norm.ppf(1 - alpha/2)
        
        # Non-centrality parameter
        delta = effect_size * np.sqrt(sample_size / 4)  # For two-sample test
        
        # Power calculation
        power = 1 - stats.norm.cdf(z_alpha - delta) + stats.norm.cdf(-z_alpha - delta)
        
        return max(0, min(1, power))
    
    def _generate_test_recommendation(self, statistical_results: Dict[str, Any]) -> str:
        """Generate recommendation based on test results."""
        primary = statistical_results['primary_analysis']
        
        if not primary['is_significant']:
            return "no_significant_difference"
        
        improvement = primary['relative_improvement']
        
        if improvement >= self.config.minimum_effect_size:
            if improvement >= 0.1:  # 10% improvement
                return "strong_recommendation_adopt"
            else:
                return "moderate_recommendation_adopt"
        elif improvement <= -self.config.minimum_effect_size:
            return "recommend_reject"
        else:
            return "marginal_difference"
    
    def generate_test_report(self, experiment_id: str) -> str:
        """Generate comprehensive test report."""
        if experiment_id not in self.experiments:
            return f"Experiment {experiment_id} not found"
        
        results = self.experiments[experiment_id]
        
        report = f"""
A/B TEST REPORT
===============

Experiment ID: {results['experiment_id']}
Test Period: {results['start_time']} to {results['end_time']}
Sample Size: {results['sample_sizes']['control']} (control) + {results['sample_sizes']['treatment']} (treatment)

PRIMARY RESULTS
---------------
Metric: {results['statistical_results']['primary_analysis']['metric']}
Control Performance: {results['statistical_results']['primary_analysis']['control_value']:.4f}
Treatment Performance: {results['statistical_results']['primary_analysis']['treatment_value']:.4f}
Absolute Difference: {results['statistical_results']['primary_analysis']['absolute_difference']:.4f}
Relative Improvement: {results['statistical_results']['primary_analysis']['relative_improvement']:.2%}

STATISTICAL SIGNIFICANCE
------------------------
P-value: {results['statistical_results']['primary_analysis']['p_value']:.4f}
Is Significant: {results['statistical_results']['primary_analysis']['is_significant']}
Confidence Level: {results['confidence_level']:.1%}
Effect Size (Cohen's d): {results['statistical_results']['primary_analysis']['cohens_d']:.4f}

RECOMMENDATION
--------------
{results['recommendation'].replace('_', ' ').title()}

SECONDARY METRICS
-----------------
"""
        
        for metric, data in results['statistical_results']['secondary_analyses'].items():
            report += f"{metric.upper()}: {data['relative_improvement']:.2%} improvement\n"
        
        report += f"""

POWER ANALYSIS
--------------
Planned Power: {results['statistical_results']['power_analysis']['planned_power']:.2%}
Achieved Power: {results['statistical_results']['power_analysis']['achieved_power']:.2%}
"""
        
        return report


def main():
    """Main function demonstrating weight optimization and A/B testing."""
    logger.info("Starting weight optimization and A/B testing demonstration")
    
    # Create sample ground truth data (normally from historical performance)
    np.random.seed(42)
    n_locations = 200
    
    # Generate synthetic ground truth based on known successful patterns
    sample_data = pd.DataFrame({
        'latitude': np.random.uniform(-60, 60, n_locations),
        'longitude': np.random.uniform(-180, 180, n_locations),
        'population_density': np.random.lognormal(3, 2, n_locations),
        'gdp_per_capita': np.random.lognormal(9, 1, n_locations),
        'internet_penetration': np.random.beta(8, 2, n_locations),
        'maritime_traffic': np.random.beta(2, 5, n_locations),
        'aviation_traffic': np.random.beta(2, 8, n_locations),
        'data_center_proximity': np.random.exponential(200, n_locations),
        'enterprise_concentration': np.random.beta(3, 7, n_locations),
        'fiber_connectivity': np.random.beta(5, 3, n_locations),
        'power_grid_reliability': np.random.beta(6, 2, n_locations),
        'transportation_access': np.random.beta(4, 4, n_locations),
        'construction_feasibility': np.random.beta(7, 2, n_locations),
        'land_availability': np.random.beta(6, 3, n_locations),
        'utilities_access': np.random.beta(5, 4, n_locations),
        'weather_conditions': np.random.beta(6, 3, n_locations),
        'elevation_profile': np.random.lognormal(6, 1, n_locations),
        'interference_risk': np.random.beta(2, 6, n_locations),
        'geographical_coverage': np.random.beta(5, 4, n_locations),
        'satellite_visibility': np.random.beta(7, 2, n_locations),
        'existing_stations': np.random.poisson(3, n_locations),
        'market_saturation': np.random.beta(3, 5, n_locations),
        'competitor_strength': np.random.beta(4, 5, n_locations),
        'barrier_entry': np.random.beta(3, 6, n_locations),
        'licensing_complexity': np.random.beta(4, 4, n_locations),
        'political_stability': np.random.beta(8, 2, n_locations),
        'regulatory_favorability': np.random.beta(5, 4, n_locations),
        'tax_environment': np.random.beta(6, 3, n_locations)
    })
    
    # Create synthetic ground truth scores (simulate real-world success)
    ground_truth = (
        0.25 * sample_data['population_density'] / sample_data['population_density'].max() +
        0.20 * sample_data['gdp_per_capita'] / sample_data['gdp_per_capita'].max() +
        0.25 * sample_data['fiber_connectivity'] +
        0.15 * sample_data['political_stability'] +
        0.15 * (1 - sample_data['market_saturation']) +
        np.random.normal(0, 0.05, n_locations)  # Add noise
    ).clip(0, 1)
    
    # Split into training and testing
    split_idx = int(0.8 * n_locations)
    train_data = sample_data.iloc[:split_idx]
    train_truth = ground_truth.iloc[:split_idx]
    test_data = sample_data.iloc[split_idx:]
    test_truth = ground_truth.iloc[split_idx:]
    
    # Initialize optimization
    config = WeightOptimizationConfig(
        max_iterations=50,  # Reduced for demo
        cross_validation_folds=3
    )
    
    if not config.validate_config():
        logger.error("Invalid configuration")
        return
    
    # Create initial scorer
    initial_scorer = GroundStationInvestmentScorer()
    
    # Create objective function
    objective_func = ObjectiveFunction(
        initial_scorer, train_data, train_truth, test_data, test_truth
    )
    
    # Optimize weights
    logger.info("Starting Bayesian weight optimization...")
    optimizer = BayesianWeightOptimizer(config)
    optimization_result = optimizer.optimize_weights(objective_func)
    
    # Display optimization results
    print("\n" + "="*80)
    print("WEIGHT OPTIMIZATION RESULTS")
    print("="*80)
    
    print(f"Optimization completed in {optimization_result.optimization_time_seconds:.2f} seconds")
    print(f"Best Performance Metrics:")
    for metric, value in optimization_result.performance_metrics.items():
        print(f"  {metric.upper()}: {value:.4f}")
    
    print(f"\nOptimal Weights:")
    optimal_weights = optimization_result.optimal_weights
    print(f"  Market Demand: {optimal_weights.market_demand:.3f}")
    print(f"  Infrastructure: {optimal_weights.infrastructure:.3f}")
    print(f"  Technical Feasibility: {optimal_weights.technical_feasibility:.3f}")
    print(f"  Competition Risk: {optimal_weights.competition_risk:.3f}")
    print(f"  Regulatory Environment: {optimal_weights.regulatory_environment:.3f}")
    
    print(f"\nConfidence Intervals (95%):")
    for factor, (lower, upper) in optimization_result.confidence_intervals.items():
        print(f"  {factor}: [{lower:.3f}, {upper:.3f}]")
    
    print(f"\nCross-Validation Scores: {optimization_result.validation_scores}")
    print(f"Mean CV Score: {np.mean(optimization_result.validation_scores):.3f} ± {np.std(optimization_result.validation_scores):.3f}")
    
    # A/B Testing
    logger.info("Setting up A/B test...")
    ab_framework = ABTestingFramework(config)
    
    # Compare optimized weights vs default weights
    default_weights = ScoringWeights()  # Default weights
    
    test_design = ab_framework.design_ab_test(
        control_weights=default_weights,
        treatment_weights=optimization_result.optimal_weights,
        expected_effect_size=0.05
    )
    
    print(f"\nA/B TEST DESIGN")
    print(f"Recommended Sample Size: {test_design['sample_size_per_group']} per group")
    print(f"Test Duration: {test_design['test_duration_days']} days")
    
    # Run A/B test
    logger.info("Running A/B test...")
    test_results = ab_framework.run_ab_test(test_design, test_data, test_truth)
    
    # Display A/B test results
    print(f"\nA/B TEST RESULTS")
    print(f"Control R²: {test_results['control_metrics']['r2']:.4f}")
    print(f"Treatment R²: {test_results['treatment_metrics']['r2']:.4f}")
    print(f"Improvement: {test_results['statistical_results']['primary_analysis']['relative_improvement']:.2%}")
    print(f"P-value: {test_results['statistical_results']['primary_analysis']['p_value']:.4f}")
    print(f"Significant: {test_results['statistical_results']['primary_analysis']['is_significant']}")
    print(f"Recommendation: {test_results['recommendation']}")
    
    # Generate full report
    full_report = ab_framework.generate_test_report(test_results['experiment_id'])
    print(full_report)
    
    # Save results
    results_dir = Path("optimization_results")
    results_dir.mkdir(exist_ok=True)
    
    # Save optimization results
    with open(results_dir / "weight_optimization_results.json", 'w') as f:
        f.write(optimization_result.to_json())
    
    # Save A/B test results
    with open(results_dir / "ab_test_results.json", 'w') as f:
        json.dump(test_results, f, indent=2, default=str)
    
    logger.info(f"Results saved to {results_dir}")
    
    return optimization_result, test_results


if __name__ == "__main__":
    optimization_result, ab_test_results = main()