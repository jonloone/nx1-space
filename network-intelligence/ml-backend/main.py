"""
Network Intelligence ML Backend Service

Production-ready FastAPI service for training Random Forest models
with SHAP values for ground station opportunity scoring.

Features:
- Training endpoint for Random Forest Regressor
- Prediction endpoint with SHAP explanations  
- Model persistence and versioning
- Health checks and monitoring
- CORS support for frontend integration
- Robust error handling and logging
"""

import asyncio
import json
import logging
import os
import traceback
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

from data_preprocessing import FeatureEngineer
from models import OpportunityMLModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Network Intelligence ML Backend",
    description="Random Forest + SHAP service for ground station opportunity scoring",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
ml_model: Optional[OpportunityMLModel] = None
feature_engineer = FeatureEngineer()

# Pydantic models for API contracts
class GroundStationData(BaseModel):
    """Ground station data structure matching TypeScript interface"""
    id: str
    name: str
    operator: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    country: Optional[str] = None
    city: Optional[str] = None
    
    # Operational metrics (target variables)
    utilization: float = Field(..., ge=0, le=100)
    revenue: float = Field(..., gt=0)
    profit: float = Field(...)
    margin: float = Field(..., ge=-1, le=1)
    confidence: float = Field(..., ge=0, le=1)
    
    # Technical specifications
    serviceModel: Optional[str] = None
    networkType: Optional[str] = None
    frequencyBands: Optional[List[str]] = None
    antennaCount: Optional[int] = None
    
    # Technical metrics
    satellitesVisible: Optional[int] = None
    avgPassDuration: Optional[float] = None
    dataCapacity: Optional[float] = None
    
    # Strategic analysis
    certifications: Optional[List[str]] = None
    opportunities: Optional[List[str]] = None
    risks: Optional[List[str]] = None
    isActive: bool = True
    
    @validator('profit')
    def profit_must_be_reasonable(cls, v, values):
        """Validate profit is reasonable relative to revenue"""
        if 'revenue' in values and v > values['revenue']:
            logger.warning(f"Profit {v} exceeds revenue {values['revenue']}")
        return v

class TrainingRequest(BaseModel):
    """Request structure for model training"""
    stations: List[GroundStationData]
    target_metric: str = Field(default="profit", description="Target variable to predict")
    model_version: Optional[str] = None
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('target_metric')
    def validate_target_metric(cls, v):
        allowed_targets = ['profit', 'revenue', 'utilization', 'margin']
        if v not in allowed_targets:
            raise ValueError(f"target_metric must be one of {allowed_targets}")
        return v
    
    @validator('stations')
    def validate_stations_count(cls, v):
        if len(v) < 10:
            raise ValueError("Need at least 10 stations for reliable training")
        return v

class PredictionFeatures(BaseModel):
    """Features for opportunity prediction"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    
    # Optional features (will use defaults if missing)
    maritimeDensity: Optional[float] = Field(None, ge=0, le=100)
    gdpPerCapita: Optional[float] = Field(None, gt=0)
    populationDensity: Optional[float] = Field(None, ge=0)
    elevation: Optional[float] = Field(None, ge=-500, le=9000)
    competitorCount: Optional[int] = Field(None, ge=0, le=20)
    infrastructureScore: Optional[float] = Field(None, ge=0, le=1)
    weatherReliability: Optional[float] = Field(None, ge=0, le=1)
    regulatoryScore: Optional[float] = Field(None, ge=0, le=1)

class SHAPExplanation(BaseModel):
    """SHAP explanation for individual predictions"""
    feature: str
    value: float
    shap_value: float
    baseline_value: float
    impact_direction: str = Field(..., regex="^(positive|negative|neutral)$")

class PredictionResponse(BaseModel):
    """Response structure for predictions"""
    prediction: float
    confidence_interval: List[float]  # [lower, upper]
    model_confidence: float = Field(..., ge=0, le=1)
    shap_explanations: List[SHAPExplanation]
    feature_importance_rank: Dict[str, int]
    model_version: str
    prediction_timestamp: datetime

class TrainingResponse(BaseModel):
    """Response structure for training results"""
    model_version: str
    training_metrics: Dict[str, float]
    feature_importance: Dict[str, float]
    cross_validation_scores: List[float]
    model_performance: Dict[str, float]
    shap_baseline_values: Dict[str, float]
    training_timestamp: datetime
    training_duration_seconds: float

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    model_version: Optional[str] = None
    uptime_seconds: float
    memory_usage_mb: float

# Application state
app_start_time = datetime.now()
training_in_progress = False

@app.on_event("startup")
async def startup_event():
    """Initialize the ML service on startup"""
    global ml_model
    
    logger.info("Starting Network Intelligence ML Backend...")
    
    # Initialize ML model
    ml_model = OpportunityMLModel()
    
    # Try to load existing model if available
    model_path = Path("models/latest_model.joblib")
    if model_path.exists():
        try:
            ml_model.load_model(str(model_path))
            logger.info(f"Loaded existing model from {model_path}")
        except Exception as e:
            logger.warning(f"Could not load existing model: {e}")
    
    logger.info("ML Backend service started successfully")

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Network Intelligence ML Backend",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    import psutil
    
    uptime = (datetime.now() - app_start_time).total_seconds()
    memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
    
    return HealthResponse(
        status="healthy",
        model_loaded=ml_model is not None and ml_model.is_trained(),
        model_version=ml_model.model_version if ml_model else None,
        uptime_seconds=uptime,
        memory_usage_mb=round(memory_mb, 2)
    )

@app.post("/train", response_model=TrainingResponse)
async def train_model(
    request: TrainingRequest,
    background_tasks: BackgroundTasks
) -> TrainingResponse:
    """
    Train Random Forest model with ground station data
    
    This endpoint:
    1. Validates and preprocesses station data
    2. Engineers features for ML training
    3. Trains Random Forest Regressor
    4. Calculates SHAP values
    5. Performs cross-validation
    6. Saves trained model
    """
    global ml_model, training_in_progress
    
    if training_in_progress:
        raise HTTPException(
            status_code=409,
            detail="Training already in progress. Please wait."
        )
    
    training_in_progress = True
    start_time = datetime.now()
    
    try:
        logger.info(f"Starting model training with {len(request.stations)} stations")
        
        # Convert Pydantic models to DataFrame
        stations_data = [station.dict() for station in request.stations]
        df = pd.DataFrame(stations_data)
        
        # Feature engineering
        logger.info("Engineering features...")
        X, feature_names = feature_engineer.engineer_features(df)
        
        # Extract target variable
        if request.target_metric not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target metric '{request.target_metric}' not found in data"
            )
        
        y = df[request.target_metric].values
        
        # Validate data quality
        if len(X) != len(y):
            raise HTTPException(
                status_code=400,
                detail="Feature matrix and target vector length mismatch"
            )
        
        if np.isnan(y).sum() > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Target variable contains {np.isnan(y).sum()} null values"
            )
        
        # Train model
        logger.info("Training Random Forest model...")
        training_results = ml_model.train(
            X, y, feature_names,
            target_name=request.target_metric,
            hyperparameters=request.hyperparameters
        )
        
        # Save model asynchronously
        model_version = request.model_version or f"v_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        background_tasks.add_task(
            save_model_background,
            ml_model,
            model_version
        )
        
        training_duration = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Training completed in {training_duration:.2f} seconds")
        
        return TrainingResponse(
            model_version=model_version,
            training_metrics=training_results['metrics'],
            feature_importance=training_results['feature_importance'],
            cross_validation_scores=training_results['cv_scores'],
            model_performance=training_results['performance'],
            shap_baseline_values=training_results['shap_baseline'],
            training_timestamp=start_time,
            training_duration_seconds=training_duration
        )
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Training failed: {str(e)}"
        )
    
    finally:
        training_in_progress = False

@app.post("/predict", response_model=PredictionResponse)
async def predict_opportunity(features: PredictionFeatures) -> PredictionResponse:
    """
    Predict opportunity score with SHAP explanations
    
    This endpoint:
    1. Validates input features
    2. Engineers additional features
    3. Makes Random Forest prediction
    4. Calculates SHAP values for interpretability
    5. Returns prediction with explanations
    """
    if not ml_model or not ml_model.is_trained():
        raise HTTPException(
            status_code=503,
            detail="Model not trained. Please train model first using /train endpoint."
        )
    
    try:
        logger.info(f"Making prediction for location ({features.latitude}, {features.longitude})")
        
        # Convert to feature vector
        feature_dict = features.dict()
        X, feature_names = feature_engineer.prepare_single_prediction(feature_dict)
        
        # Make prediction with SHAP explanations
        result = ml_model.predict_with_explanation(X, feature_names)
        
        # Build SHAP explanations
        shap_explanations = []
        for i, feature_name in enumerate(feature_names):
            shap_val = result['shap_values'][i]
            baseline_val = result['shap_baseline_values'][i]
            
            impact_direction = "neutral"
            if abs(shap_val) > 0.001:  # Small threshold for numerical stability
                impact_direction = "positive" if shap_val > 0 else "negative"
            
            shap_explanations.append(SHAPExplanation(
                feature=feature_name,
                value=X[i],
                shap_value=shap_val,
                baseline_value=baseline_val,
                impact_direction=impact_direction
            ))
        
        # Sort by absolute SHAP value impact
        shap_explanations.sort(key=lambda x: abs(x.shap_value), reverse=True)
        
        # Create feature importance ranking
        feature_importance_rank = {
            name: idx + 1 
            for idx, name in enumerate(
                sorted(feature_names, key=lambda n: result['feature_importance'][n], reverse=True)
            )
        }
        
        return PredictionResponse(
            prediction=result['prediction'],
            confidence_interval=result['confidence_interval'],
            model_confidence=result['model_confidence'],
            shap_explanations=shap_explanations,
            feature_importance_rank=feature_importance_rank,
            model_version=ml_model.model_version,
            prediction_timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

@app.get("/model/info", response_model=Dict[str, Any])
async def get_model_info():
    """Get information about the current trained model"""
    if not ml_model or not ml_model.is_trained():
        raise HTTPException(
            status_code=503,
            detail="No trained model available"
        )
    
    try:
        info = ml_model.get_model_info()
        return info
    except Exception as e:
        logger.error(f"Failed to get model info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model info: {str(e)}"
        )

@app.get("/model/feature-importance", response_model=Dict[str, float])
async def get_feature_importance():
    """Get feature importance from trained model"""
    if not ml_model or not ml_model.is_trained():
        raise HTTPException(
            status_code=503,
            detail="No trained model available"
        )
    
    try:
        return ml_model.get_feature_importance()
    except Exception as e:
        logger.error(f"Failed to get feature importance: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get feature importance: {str(e)}"
        )

@app.delete("/model", response_model=Dict[str, str])
async def reset_model():
    """Reset/clear the current model"""
    global ml_model
    
    try:
        ml_model = OpportunityMLModel()
        logger.info("Model reset successfully")
        return {"status": "success", "message": "Model reset successfully"}
    except Exception as e:
        logger.error(f"Failed to reset model: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset model: {str(e)}"
        )

# Background tasks
async def save_model_background(model: OpportunityMLModel, version: str):
    """Save model in background to avoid blocking response"""
    try:
        models_dir = Path("models")
        models_dir.mkdir(exist_ok=True)
        
        model_path = models_dir / f"model_{version}.joblib"
        model.save_model(str(model_path))
        
        # Also save as latest
        latest_path = models_dir / "latest_model.joblib"
        model.save_model(str(latest_path))
        
        logger.info(f"Model saved to {model_path} and {latest_path}")
    except Exception as e:
        logger.error(f"Failed to save model: {str(e)}")

# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "error_type": "ValueError"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_type": type(exc).__name__}
    )

# Development server configuration
if __name__ == "__main__":
    # Production deployment should use proper WSGI server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Accept connections from any IP
        port=8000,
        reload=True,  # Auto-reload in development
        access_log=True,
        log_level="info"
    )