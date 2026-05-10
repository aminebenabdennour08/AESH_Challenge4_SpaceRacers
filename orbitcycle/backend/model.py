"""
OrbitCycle™ - ML Model Module
Handles model loading and inference for the Flask backend
"""

import os
import numpy as np
import torch
import torch.nn as nn
import logging
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Set device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Try to import sklearn gracefully
try:
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not available. Model loading will be limited.")


# ============================================================================
# Neural Network Architecture (matches training)
# ============================================================================

class SatelliteHealthNN(nn.Module):
    """Neural network for satellite health classification"""
    
    def __init__(self, input_dim: int, num_classes: int = 5):
        super(SatelliteHealthNN, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.3),
            
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(32, num_classes)
        )
    
    def forward(self, x):
        return self.network(x)


# ============================================================================
# Health Score Calculation (from your dataset generation)
# ============================================================================

def calculate_health_score(age_years: float, design_life: float,
                           solar_current: float, battery_voltage: float,
                           temperature: float, memory_errors: int,
                           resets: int) -> float:
    """Calculate health score based on age and degradation"""
    
    age_ratio = age_years / design_life
    
    if age_ratio < 0.4:
        age_score = 100 - age_ratio * 30
    elif age_ratio < 0.7:
        age_score = 88 - (age_ratio - 0.4) * 80
    elif age_ratio < 1.0:
        age_score = 64 - (age_ratio - 0.7) * 90
    elif age_ratio < 1.3:
        age_score = 37 - (age_ratio - 1.0) * 73
    else:
        age_score = 15 - (age_ratio - 1.3) * 25
    
    age_score = max(0, min(100, age_score))
    
    solar_score = max(0, min(100, (solar_current / 20.0) * 100))
    battery_score = max(0, min(100, (battery_voltage / 28.0) * 100))
    
    if temperature < 35:
        temp_score = 100
    elif temperature < 45:
        temp_score = 100 - (temperature - 35) * 8
    else:
        temp_score = max(0, 60 - (temperature - 45) * 6)
    
    error_score = max(0, 100 - min(100, memory_errors / 1000))
    reset_score = max(0, 100 - min(100, resets * 5))
    
    health_score = (
        0.30 * age_score + 0.20 * solar_score + 0.20 * battery_score +
        0.15 * temp_score + 0.08 * error_score + 0.07 * reset_score
    )
    
    return round(max(0, min(100, health_score)), 1)


def assign_label_by_health_score(health_score: float) -> str:
    """Assign health label based on score"""
    if health_score >= 85:
        return 'Healthy'
    elif health_score >= 65:
        return 'Monitor'
    elif health_score >= 40:
        return 'Degrading'
    elif health_score >= 20:
        return 'Critical'
    else:
        return 'Disposal Recommended'


def get_health_label_with_icon(health_score: float) -> Dict:
    """Get health label with icon and CSS class"""
    label = assign_label_by_health_score(health_score)
    
    icons = {
        'Healthy': '✅',
        'Monitor': '📡',
        'Degrading': '⚠️',
        'Critical': '🔴',
        'Disposal Recommended': '💀'
    }
    
    classes = {
        'Healthy': 'label-Healthy',
        'Monitor': 'label-Monitor',
        'Degrading': 'label-Degrading',
        'Critical': 'label-Critical',
        'Disposal Recommended': 'label-Disposal'
    }
    
    return {
        'label': label,
        'icon': icons[label],
        'class': classes[label]
    }


# ============================================================================
# Degradation Factors (from your degradation model)
# ============================================================================

def get_degradation_factors(age_years: float, design_life: float) -> Dict:
    """Calculate degradation factors"""
    age_ratio = age_years / design_life
    
    if age_ratio < 1.0:
        solar_factor = 1.0 - 0.03 * age_years
        voltage_drift = age_ratio * 3
        temp_offset = age_ratio * 15
    else:
        solar_factor = max(0.01, 0.70 - 0.35 * (age_ratio - 1.0))
        voltage_drift = 3.0 + (age_ratio - 1.0) * 8
        temp_offset = 15.0 + (age_ratio - 1.0) * 25
    
    if age_ratio < 0.8:
        battery_factor = 1.0 - 0.04 * age_years
    else:
        battery_factor = max(0.01, 0.68 - 0.45 * (age_ratio - 0.8))
    
    error_mult = min(200, np.exp(3.0 * age_ratio))
    
    if age_ratio < 1.0:
        reset_mult = 1 + 3 * age_ratio
    else:
        reset_mult = 4 + 10 * (age_ratio - 1.0)
    
    return {
        'solar_factor': round(max(0.01, min(1.0, solar_factor)), 3),
        'battery_factor': round(max(0.01, min(1.0, battery_factor)), 3),
        'voltage_drift': round(min(12.0, voltage_drift), 2),
        'temp_offset': round(min(40.0, temp_offset), 2),
        'error_mult': round(min(200, error_mult), 2),
        'reset_mult': round(min(50, reset_mult), 2)
    }


# ============================================================================
# Component Scores Calculation
# ============================================================================

def calculate_component_scores(age_years: float, design_life: float,
                                solar_current: float, battery_voltage: float,
                                temperature: float, memory_errors: int,
                                resets: int) -> Dict:
    """Calculate individual component scores"""
    
    age_ratio = age_years / design_life
    
    if age_ratio < 0.4:
        age_score = 100 - age_ratio * 30
    elif age_ratio < 0.7:
        age_score = 88 - (age_ratio - 0.4) * 80
    elif age_ratio < 1.0:
        age_score = 64 - (age_ratio - 0.7) * 90
    elif age_ratio < 1.3:
        age_score = 37 - (age_ratio - 1.0) * 73
    else:
        age_score = 15 - (age_ratio - 1.3) * 25
    
    age_score = round(max(0, min(100, age_score)), 1)
    
    solar_score = round(max(0, min(100, (solar_current / 20.0) * 100)), 1)
    battery_score = round(max(0, min(100, (battery_voltage / 28.0) * 100)), 1)
    
    if temperature < 35:
        temp_score = 100
    elif temperature < 45:
        temp_score = 100 - (temperature - 35) * 8
    else:
        temp_score = max(0, 60 - (temperature - 45) * 6)
    temp_score = round(max(0, min(100, temp_score)), 1)
    
    error_score = round(max(0, 100 - min(100, memory_errors / 1000)), 1)
    reset_score = round(max(0, 100 - min(100, resets * 5)), 1)
    
    return {
        'age_score': age_score,
        'solar_score': solar_score,
        'battery_score': battery_score,
        'temp_score': temp_score,
        'error_score': error_score,
        'reset_score': reset_score
    }


# ============================================================================
# EOL Calculation
# ============================================================================

def estimate_eol(health_score: float, age_years: float) -> Dict:
    """Estimate End-of-Life year and remaining years"""
    years_left = max(0.5, age_years * (1 - health_score / 100) * 1.5)
    current_year = datetime.now().year
    eol_year = current_year + years_left
    
    if health_score < 40:
        recommendation = 'Immediate EOL planning recommended'
    elif health_score < 65:
        recommendation = 'Monitor closely, prepare EOL plan'
    else:
        recommendation = 'Nominal operations'
    
    return {
        'years_left': round(years_left, 1),
        'eol_year': round(eol_year, 1),
        'recommendation': recommendation
    }


# ============================================================================
# Model Loader (with sklearn fallback)
# ============================================================================

class OrbitCycleModelLoader:
    """Load and manage the trained PyTorch model"""
    
    def __init__(self, model_path: str = 'orbitcycle_model.pth'):
        self.model = None
        self.label_encoder = None
        self.scaler = None
        self.feature_columns = None
        self.input_dim = None
        self.num_classes = None
        self.is_loaded = False
        
        self.load_model(model_path)
    
    def load_model(self, model_path: str):
        """Load the .pth model file"""
        if not os.path.exists(model_path):
            logger.warning(f"Model file not found: {model_path}")
            return
        
        try:
            checkpoint = torch.load(model_path, map_location=device, weights_only=False)
            
            # Extract metadata with fallbacks
            self.label_encoder = checkpoint.get('label_encoder')
            self.scaler = checkpoint.get('scaler')
            self.feature_columns = checkpoint.get('feature_columns')
            self.input_dim = checkpoint.get('input_dim', 14)
            self.num_classes = checkpoint.get('num_classes', 5)
            
            # Build model
            self.model = SatelliteHealthNN(
                input_dim=self.input_dim,
                num_classes=self.num_classes
            ).to(device)
            
            # Load weights
            if 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
            
            self.model.eval()
            self.is_loaded = True
            
            logger.info(f"✅ Model loaded from {model_path}")
            logger.info(f"   Input dimension: {self.input_dim}")
            logger.info(f"   Number of classes: {self.num_classes}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.is_loaded = False
    
    def prepare_features(self, params: Dict) -> Optional[np.ndarray]:
        """Prepare features for model inference"""
        if not self.is_loaded:
            return None
        
        try:
            # Default feature set (7 features) - works without scaler
            features = [
                params.get('ageYears', 4.0) / params.get('designLife', 7.0),
                params.get('solarCurrent', 18.5) / 30.0,
                params.get('batteryVoltage', 27.5) / 35.0,
                params.get('temperature', 22.0) / 60.0,
                min(1.0, params.get('memoryErrors', 0) / 5000.0),
                min(1.0, params.get('resets', 0) / 20.0),
                params.get('altitude', 700) / 40000.0
            ]
            
            features_array = np.array(features, dtype=np.float32).reshape(1, -1)
            
            # Apply scaler if available and sklearn is available
            if self.scaler is not None and SKLEARN_AVAILABLE:
                features_array = self.scaler.transform(features_array)
            elif self.scaler is not None:
                # Manual scaling approximation
                features_array = features_array * 0.5
            
            return features_array
            
        except Exception as e:
            logger.warning(f"Feature preparation failed: {e}")
            return None
    
    def predict(self, params: Dict) -> Optional[Dict]:
        """Run model inference"""
        if not self.is_loaded or self.model is None:
            return None
        
        features = self.prepare_features(params)
        if features is None:
            return None
        
        try:
            with torch.no_grad():
                X_tensor = torch.FloatTensor(features).to(device)
                outputs = self.model(X_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                
                # Get predicted class
                _, predicted = torch.max(outputs, 1)
                class_idx = predicted.cpu().numpy()[0]
                
                # Get confidence
                confidence = float(probabilities[0][class_idx].cpu().numpy())
                
                # Get label
                labels = ['Healthy', 'Monitor', 'Degrading', 'Critical', 'Disposal Recommended']
                label = labels[class_idx] if class_idx < len(labels) else 'Unknown'
                
                # Try to use label encoder if available
                if self.label_encoder is not None and SKLEARN_AVAILABLE:
                    try:
                        label = self.label_encoder.inverse_transform([class_idx])[0]
                    except:
                        pass
                
                # Calculate health score from prediction
                # Map class to approximate health score
                class_to_score = {
                    0: 92,  # Healthy
                    1: 75,  # Monitor
                    2: 52,  # Degrading
                    3: 30,  # Critical
                    4: 15   # Disposal
                }
                estimated_score = class_to_score.get(class_idx, 50)
                
                return {
                    'predicted_class': int(class_idx),
                    'predicted_label': label,
                    'confidence': confidence,
                    'estimated_score': estimated_score,
                    'probabilities': {
                        'Healthy': float(probabilities[0][0].cpu().numpy()),
                        'Monitor': float(probabilities[0][1].cpu().numpy()),
                        'Degrading': float(probabilities[0][2].cpu().numpy()),
                        'Critical': float(probabilities[0][3].cpu().numpy()),
                        'Disposal Recommended': float(probabilities[0][4].cpu().numpy()) if self.num_classes > 4 else 0
                    }
                }
                
        except Exception as e:
            logger.warning(f"Inference failed: {e}")
            return None


# ============================================================================
# Singleton model instance
# ============================================================================

_model_instance = None

def get_model():
    """Get or create the model instance (singleton)"""
    global _model_instance
    if _model_instance is None:
        _model_instance = OrbitCycleModelLoader('orbitcycle_model.pth')
    return _model_instance


# ============================================================================
# Simple test function
# ============================================================================

def test_model():
    """Test the model with sample data"""
    print("=" * 60)
    print("Testing OrbitCycle Model")
    print("=" * 60)
    
    # Test health score calculation
    health = calculate_health_score(
        age_years=4.0,
        design_life=7.0,
        solar_current=18.5,
        battery_voltage=27.5,
        temperature=22.0,
        memory_errors=0,
        resets=0
    )
    print(f"Health Score: {health}%")
    print(f"Label: {assign_label_by_health_score(health)}")
    
    # Test degradation factors
    deg = get_degradation_factors(4.0, 7.0)
    print(f"Degradation Factors: {deg}")
    
    # Test EOL
    eol = estimate_eol(health, 4.0)
    print(f"EOL Estimate: {eol}")
    
    # Try loading model
    model = get_model()
    if model.is_loaded:
        print("✅ Model loaded successfully")
        
        # Test prediction
        test_params = {
            'ageYears': 4.0,
            'designLife': 7.0,
            'solarCurrent': 18.5,
            'batteryVoltage': 27.5,
            'temperature': 22.0,
            'memoryErrors': 0,
            'resets': 0,
            'altitude': 700,
            'orbitType': 'SSO'
        }
        
        prediction = model.predict(test_params)
        if prediction:
            print(f"ML Prediction: {prediction['predicted_label']} (confidence: {prediction['confidence']:.2f})")
    else:
        print("⚠️ No model file found, using heuristic only")
    
    print("=" * 60)


if __name__ == "__main__":
    test_model()