"""
Machine Learning Models for Network Intelligence

This module implements Random Forest Regressor with SHAP values
for explainable ground station opportunity scoring.

Features:
- Random Forest with hyperparameter optimization
- SHAP (SHapley Additive exPlanations) for interpretability
- Cross-validation and model evaluation
- Model persistence and versioning
- Confidence intervals and uncertainty quantification
"""

import json
import logging
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score
)
from sklearn.model_selection import cross_val_score, GridSearchCV, train_test_split
from sklearn.preprocessing import StandardScaler

# Suppress specific warnings for cleaner output
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning, module='shap')

logger = logging.getLogger(__name__)

class OpportunityMLModel:
    """
    Random Forest Regressor with SHAP explanations for opportunity scoring
    
    This class provides:
    - Robust Random Forest training with hyperparameter tuning
    - SHAP value calculation for model interpretability
    - Confidence intervals and uncertainty quantification
    - Model persistence and version management
    - Cross-validation and performance evaluation
    """
    
    def __init__(self):
        """Initialize the ML model"""
        self.model: Optional[RandomForestRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.shap_explainer: Optional[shap.TreeExplainer] = None
        
        # Model metadata
        self.model_version: str = ""
        self.feature_names: List[str] = []
        self.target_name: str = ""
        self.training_timestamp: Optional[datetime] = None
        self.training_metrics: Dict[str, float] = {}
        self.feature_importance: Dict[str, float] = {}
        self.shap_baseline_values: Dict[str, float] = {}
        
        # Model configuration
        self.default_hyperparameters = {
            'n_estimators': 200,
            'max_depth': 15,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'max_features': 'sqrt',
            'bootstrap': True,
            'random_state': 42,
            'n_jobs': -1  # Use all available cores
        }
    
    def is_trained(self) -> bool:
        """Check if model is trained and ready for predictions"""
        return (
            self.model is not None and 
            self.shap_explainer is not None and
            len(self.feature_names) > 0
        )
    
    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: List[str],
        target_name: str = "profit",
        hyperparameters: Optional[Dict[str, Any]] = None,
        optimize_hyperparameters: bool = True,
        cv_folds: int = 5
    ) -> Dict[str, Any]:
        """
        Train Random Forest model with comprehensive evaluation
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target vector (n_samples,)
            feature_names: Names of features
            target_name: Name of target variable
            hyperparameters: Custom hyperparameters (optional)
            optimize_hyperparameters: Whether to perform grid search
            cv_folds: Number of cross-validation folds
            
        Returns:
            Dictionary with training results and metrics
        """
        logger.info(f"Training Random Forest model with {X.shape[0]} samples, {X.shape[1]} features")
        
        # Store metadata
        self.feature_names = feature_names.copy()
        self.target_name = target_name
        self.training_timestamp = datetime.now()
        
        # Validate inputs
        if X.shape[0] < 10:
            raise ValueError("Need at least 10 samples for reliable training")
        
        if len(feature_names) != X.shape[1]:
            raise ValueError("Number of feature names must match number of features")
        
        if np.isnan(X).sum() > 0:
            logger.warning(f"Feature matrix contains {np.isnan(X).sum()} NaN values")
            # Fill NaN with median values
            for i in range(X.shape[1]):
                col_median = np.nanmedian(X[:, i])
                X[np.isnan(X[:, i]), i] = col_median
        
        # Split data for evaluation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Feature scaling (optional for Random Forest, but can help with SHAP)
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Hyperparameter optimization
        best_params = self.default_hyperparameters.copy()
        if hyperparameters:
            best_params.update(hyperparameters)
        
        if optimize_hyperparameters and X_train.shape[0] >= 50:
            logger.info("Optimizing hyperparameters...")
            best_params = self._optimize_hyperparameters(X_train_scaled, y_train, cv_folds)
        
        # Train final model
        logger.info(f"Training with parameters: {best_params}")
        self.model = RandomForestRegressor(**best_params)
        self.model.fit(X_train_scaled, y_train)
        
        # Initialize SHAP explainer
        logger.info("Initializing SHAP explainer...")
        self.shap_explainer = shap.TreeExplainer(self.model)
        
        # Calculate SHAP baseline values (mean predictions)
        shap_values = self.shap_explainer.shap_values(X_train_scaled)
        baseline_values = np.mean(X_train_scaled, axis=0)
        
        self.shap_baseline_values = {
            feature_names[i]: float(baseline_values[i])
            for i in range(len(feature_names))
        }
        
        # Evaluate model performance
        train_pred = self.model.predict(X_train_scaled)
        test_pred = self.model.predict(X_test_scaled)
        
        # Cross-validation scores
        cv_scores = cross_val_score(
            self.model, X_train_scaled, y_train, 
            cv=cv_folds, scoring='r2', n_jobs=-1
        )
        
        # Feature importance
        importance_scores = self.model.feature_importances_
        self.feature_importance = {
            feature_names[i]: float(importance_scores[i])
            for i in range(len(feature_names))
        }
        
        # Training metrics
        self.training_metrics = {
            'train_r2': float(r2_score(y_train, train_pred)),
            'test_r2': float(r2_score(y_test, test_pred)),
            'train_mse': float(mean_squared_error(y_train, train_pred)),
            'test_mse': float(mean_squared_error(y_test, test_pred)),
            'train_mae': float(mean_absolute_error(y_train, train_pred)),
            'test_mae': float(mean_absolute_error(y_test, test_pred)),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'n_samples': int(X.shape[0]),
            'n_features': int(X.shape[1])
        }
        
        # Model performance summary
        performance = {
            'accuracy': float(r2_score(y_test, test_pred)),
            'rmse': float(np.sqrt(mean_squared_error(y_test, test_pred))),
            'mae': float(mean_absolute_error(y_test, test_pred)),
            'cv_score': float(cv_scores.mean()),
            'overfitting_ratio': float(
                self.training_metrics['train_r2'] / max(self.training_metrics['test_r2'], 0.001)
            )
        }
        
        logger.info(f"Training completed. Test R²: {performance['accuracy']:.3f}")
        logger.info(f"Cross-validation score: {performance['cv_score']:.3f} ± {self.training_metrics['cv_std']:.3f}")
        
        return {
            'metrics': self.training_metrics,
            'feature_importance': self.feature_importance,
            'cv_scores': cv_scores.tolist(),
            'performance': performance,
            'shap_baseline': self.shap_baseline_values,
            'hyperparameters': best_params
        }
    
    def predict_with_explanation(
        self, 
        X: np.ndarray, 
        feature_names: List[str]
    ) -> Dict[str, Any]:
        """
        Make prediction with SHAP explanations and confidence intervals
        
        Args:
            X: Feature vector (single sample)
            feature_names: Names of features
            
        Returns:
            Dictionary with prediction, SHAP values, and confidence information
        """
        if not self.is_trained():
            raise ValueError("Model must be trained before making predictions")
        
        if len(feature_names) != len(self.feature_names):
            raise ValueError(f"Expected {len(self.feature_names)} features, got {len(feature_names)}")
        
        # Ensure X is 2D array
        if X.ndim == 1:
            X = X.reshape(1, -1)
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Make prediction
        prediction = self.model.predict(X_scaled)[0]
        
        # Calculate SHAP values
        shap_values = self.shap_explainer.shap_values(X_scaled)[0]
        
        # Calculate confidence interval using forest variance
        # Get predictions from all trees
        tree_predictions = np.array([
            tree.predict(X_scaled)[0] 
            for tree in self.model.estimators_
        ])
        
        prediction_std = np.std(tree_predictions)
        confidence_interval = [
            float(prediction - 1.96 * prediction_std),  # 95% CI lower
            float(prediction + 1.96 * prediction_std)   # 95% CI upper
        ]
        
        # Model confidence based on tree agreement
        model_confidence = max(0.0, min(1.0, 1.0 - (prediction_std / max(abs(prediction), 1.0))))
        
        # Get baseline values for SHAP explanation
        baseline_values = [
            self.shap_baseline_values.get(name, 0.0) 
            for name in feature_names
        ]
        
        return {
            'prediction': float(prediction),
            'confidence_interval': confidence_interval,
            'model_confidence': float(model_confidence),
            'shap_values': shap_values.tolist(),
            'shap_baseline_values': baseline_values,
            'feature_importance': self.feature_importance,
            'prediction_std': float(prediction_std)
        }
    
    def _optimize_hyperparameters(
        self, 
        X: np.ndarray, 
        y: np.ndarray, 
        cv_folds: int
    ) -> Dict[str, Any]:
        """Optimize hyperparameters using grid search"""
        
        # Define parameter grid based on dataset size
        n_samples = X.shape[0]
        
        if n_samples < 100:
            # Small dataset - conservative parameters
            param_grid = {
                'n_estimators': [50, 100],
                'max_depth': [5, 10, None],
                'min_samples_split': [5, 10],
                'min_samples_leaf': [2, 4],
                'max_features': ['sqrt', 0.5]
            }
        else:
            # Larger dataset - more aggressive parameters
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 15, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4],
                'max_features': ['sqrt', 'log2', 0.5]
            }
        
        # Base model for grid search
        base_model = RandomForestRegressor(
            random_state=42, 
            n_jobs=-1,
            bootstrap=True
        )
        
        # Grid search with cross-validation
        grid_search = GridSearchCV(
            base_model,
            param_grid,
            cv=cv_folds,
            scoring='r2',
            n_jobs=-1,
            verbose=0
        )
        
        grid_search.fit(X, y)
        
        logger.info(f"Best hyperparameter score: {grid_search.best_score_:.3f}")
        
        return grid_search.best_params_
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from trained model"""
        if not self.is_trained():
            raise ValueError("Model must be trained first")
        
        return self.feature_importance.copy()
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive model information"""
        if not self.is_trained():
            raise ValueError("Model must be trained first")
        
        return {
            'model_version': self.model_version,
            'target_name': self.target_name,
            'feature_names': self.feature_names.copy(),
            'n_features': len(self.feature_names),
            'training_timestamp': self.training_timestamp.isoformat() if self.training_timestamp else None,
            'training_metrics': self.training_metrics.copy(),
            'feature_importance': self.feature_importance.copy(),
            'shap_baseline_values': self.shap_baseline_values.copy(),
            'model_type': 'RandomForestRegressor',
            'is_trained': True
        }
    
    def save_model(self, filepath: str) -> None:
        """Save trained model to disk"""
        if not self.is_trained():
            raise ValueError("No trained model to save")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'shap_explainer': self.shap_explainer,
            'model_version': self.model_version,
            'feature_names': self.feature_names,
            'target_name': self.target_name,
            'training_timestamp': self.training_timestamp,
            'training_metrics': self.training_metrics,
            'feature_importance': self.feature_importance,
            'shap_baseline_values': self.shap_baseline_values
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str) -> None:
        """Load trained model from disk"""
        try:
            model_data = joblib.load(filepath)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.shap_explainer = model_data['shap_explainer']
            self.model_version = model_data.get('model_version', 'unknown')
            self.feature_names = model_data['feature_names']
            self.target_name = model_data.get('target_name', 'unknown')
            self.training_timestamp = model_data.get('training_timestamp')
            self.training_metrics = model_data.get('training_metrics', {})
            self.feature_importance = model_data.get('feature_importance', {})
            self.shap_baseline_values = model_data.get('shap_baseline_values', {})
            
            logger.info(f"Model loaded from {filepath}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise ValueError(f"Could not load model from {filepath}: {str(e)}")
    
    def validate_model(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """Validate model on test dataset"""
        if not self.is_trained():
            raise ValueError("Model must be trained first")
        
        X_test_scaled = self.scaler.transform(X_test)
        y_pred = self.model.predict(X_test_scaled)
        
        validation_metrics = {
            'r2_score': float(r2_score(y_test, y_pred)),
            'mse': float(mean_squared_error(y_test, y_pred)),
            'mae': float(mean_absolute_error(y_test, y_pred)),
            'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
            'n_test_samples': int(len(y_test))
        }
        
        logger.info(f"Validation R²: {validation_metrics['r2_score']:.3f}")
        
        return validation_metrics

# Utility functions for model evaluation
def calculate_model_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate comprehensive model evaluation metrics"""
    return {
        'r2_score': float(r2_score(y_true, y_pred)),
        'mse': float(mean_squared_error(y_true, y_pred)),
        'mae': float(mean_absolute_error(y_true, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
        'mape': float(np.mean(np.abs((y_true - y_pred) / np.maximum(np.abs(y_true), 1e-8))) * 100)
    }

def feature_importance_analysis(
    model: RandomForestRegressor, 
    feature_names: List[str]
) -> Dict[str, Any]:
    """Analyze feature importance with additional statistics"""
    importance = model.feature_importances_
    
    # Get importance from each tree for statistical analysis
    tree_importances = np.array([
        tree.feature_importances_ for tree in model.estimators_
    ])
    
    importance_stats = {}
    for i, name in enumerate(feature_names):
        importance_stats[name] = {
            'mean_importance': float(importance[i]),
            'std_importance': float(np.std(tree_importances[:, i])),
            'rank': int(np.argsort(importance)[::-1].tolist().index(i) + 1)
        }
    
    return importance_stats