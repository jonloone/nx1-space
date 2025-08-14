# Network Intelligence ML Backend

Production-ready Python ML service for ground station opportunity scoring using Random Forest models with SHAP explanations.

## Overview

This service provides:
- **Random Forest Regressor** training for opportunity scoring
- **SHAP values** for explainable AI predictions
- **Feature engineering** from ground station data
- **RESTful API** with comprehensive endpoints
- **TypeScript client** for frontend integration

## Quick Start

### 1. Setup Environment

```bash
# Start the ML service
./start_service.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 2. Train a Model

```bash
# Using the training script
./venv/bin/python train_ground_stations.py

# Or via API
curl -X POST "http://localhost:8000/train" \
  -H "Content-Type: application/json" \
  -d @sample_training_data.json
```

### 3. Make Predictions

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "maritimeDensity": 75,
    "gdpPerCapita": 65000
  }'
```

## API Endpoints

### Health Check
- `GET /health` - Service health and model status

### Model Training
- `POST /train` - Train Random Forest model with ground station data
- `GET /model/info` - Get current model information
- `GET /model/feature-importance` - Get feature importance rankings
- `DELETE /model` - Reset/clear current model

### Predictions
- `POST /predict` - Get prediction with SHAP explanations

## Features

### Machine Learning
- **Random Forest Regressor** with hyperparameter optimization
- **Cross-validation** for model evaluation
- **SHAP values** for prediction explanations
- **Confidence intervals** using ensemble variance
- **Feature importance** ranking

### Data Engineering
- **Geographic features**: Distance calculations, spatial clustering
- **Market indicators**: GDP, population density, economic scores
- **Technical metrics**: Satellite visibility, capacity, elevation
- **Competitive analysis**: Market share, density analysis
- **Risk assessment**: Weather, regulatory, infrastructure scores

### Production Features
- **Health monitoring** with memory and uptime tracking
- **Error handling** with detailed error responses
- **CORS support** for frontend integration
- **Model persistence** with versioning
- **Background tasks** for non-blocking operations

## TypeScript Integration

The service integrates with the frontend through a TypeScript client:

```typescript
import { mlClient } from '@/lib/services/ml-training-client'

// Train model
const result = await mlClient.trainWithGroundStations(stations)

// Get prediction
const prediction = await mlClient.predictOpportunity(lat, lon, features)
```

## File Structure

```
ml-backend/
├── main.py                     # FastAPI application
├── models.py                   # ML models with SHAP
├── data_preprocessing.py       # Feature engineering
├── train_ground_stations.py    # Training script
├── start_service.sh           # Service startup script
├── requirements.txt           # Dependencies
└── venv/                      # Virtual environment
```

## Example Usage

### Training with Ground Station Data

```python
from models import OpportunityMLModel
from data_preprocessing import FeatureEngineer
import pandas as pd

# Load your ground station data
df = pd.read_json('ground_stations.json')

# Engineer features
feature_engineer = FeatureEngineer()
X, feature_names = feature_engineer.engineer_features(df)
y = df['profit'].values

# Train model
model = OpportunityMLModel()
results = model.train(X, y, feature_names, target_name='profit')

print(f"Model R² score: {results['performance']['accuracy']:.3f}")
```

### Getting Predictions with SHAP

```python
# Make prediction
prediction = model.predict_with_explanation(
    X_new, feature_names
)

print(f"Prediction: {prediction['prediction']:.2f}")
print("Top SHAP explanations:")
for shap_val in prediction['shap_values'][:5]:
    print(f"  {shap_val['feature']}: {shap_val['impact']:.4f}")
```

## Model Performance

The service provides comprehensive metrics:
- **R² Score**: Model accuracy (target >0.8)
- **Cross-validation**: 5-fold CV with confidence intervals
- **Feature importance**: Ranked by Random Forest importance
- **SHAP values**: Individual prediction explanations
- **Confidence intervals**: Using ensemble variance

## Production Deployment

### Using Docker (Recommended)

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```bash
# Optional configuration
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8000
ML_LOG_LEVEL=info
ML_WORKERS=1
```

### Health Monitoring

The service provides detailed health metrics:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "ground_stations_20241214_143022",
  "uptime_seconds": 1337.5,
  "memory_usage_mb": 245.7
}
```

## Testing

Run the comprehensive test suite:

```bash
# Full API testing (requires service to be running)
node ../test-ml-backend.js

# Core pipeline testing
node ../test-ml-pipeline.js
```

## Integration with Frontend

The ML backend integrates seamlessly with the Network Intelligence frontend:

1. **Opportunity Scoring**: Real-time predictions for map locations
2. **Model Training**: Automatic retraining with new ground station data
3. **SHAP Explanations**: Interpretable AI for business decisions
4. **Feature Importance**: Understanding key factors for opportunities

## Architecture

```
Frontend (TypeScript) 
    ↓ HTTP/JSON
ML Backend (Python FastAPI)
    ↓
Random Forest + SHAP
    ↓ 
Feature Engineering
    ↓
Ground Station Data
```

## Dependencies

- **FastAPI**: High-performance web framework
- **scikit-learn**: Machine learning library
- **SHAP**: Explainable AI library
- **pandas/numpy**: Data processing
- **uvicorn**: ASGI server
- **geopy**: Geographic calculations

## License

Part of the Network Intelligence platform. See main project LICENSE.