
import sys
sys.path.append('ml-backend')
from models import OpportunityMLModel
import numpy as np

# Create sample training data
np.random.seed(42)
X = np.random.rand(20, 10)  # 20 samples, 10 features
y = np.random.rand(20) * 50 + 25  # Target values between 25-75
feature_names = [f'feature_{i}' for i in range(10)]

# Test model training
model = OpportunityMLModel()
try:
    results = model.train(X, y, feature_names)
    print(f"SUCCESS: Model trained with R² = {results['performance']['accuracy']:.3f}")
    
    # Test prediction
    X_test = np.random.rand(1, 10)
    pred_result = model.predict_with_explanation(X_test, feature_names)
    print(f"SUCCESS: Prediction = {pred_result['prediction']:.2f}")
    print("ML model test passed")
except Exception as e:
    print(f"ERROR: {str(e)}")
    exit(1)
