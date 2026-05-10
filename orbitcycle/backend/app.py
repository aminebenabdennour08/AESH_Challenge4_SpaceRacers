"""
OrbitCycle™ — Flask Intelligence Server
Run: python app.py
"""

import os
import sys
import logging
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, render_template_string
from flask_cors import CORS

# Add parent directory to path to find model.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import from model.py
try:
    from model import (
        calculate_health_score,
        get_health_label_with_icon,
        get_degradation_factors,
        calculate_component_scores,
        estimate_eol,
        get_model
    )
    print("✅ model.py imported successfully")
except ImportError as e:
    print(f"⚠️ Could not import from model.py: {e}")
    # Fallback functions if model.py not found
    def calculate_health_score(age_years, design_life, solar_current, battery_voltage, 
                               temperature, memory_errors, resets):
        age_ratio = age_years / design_life
        if age_ratio < 0.4:
            age_score = 100 - age_ratio * 30
        elif age_ratio < 0.7:
            age_score = 88 - (age_ratio - 0.4) * 80
        elif age_ratio < 1.0:
            age_score = 64 - (age_ratio - 0.7) * 90
        else:
            age_score = 37 - (age_ratio - 1.0) * 73
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
        health_score = (0.30 * age_score + 0.20 * solar_score + 0.20 * battery_score +
                        0.15 * temp_score + 0.08 * error_score + 0.07 * reset_score)
        return round(max(0, min(100, health_score)), 1)
    
    def get_health_label_with_icon(health_score):
        if health_score >= 85:
            return {'label': 'Healthy', 'class': 'label-Healthy', 'icon': '✅'}
        elif health_score >= 65:
            return {'label': 'Monitor', 'class': 'label-Monitor', 'icon': '📡'}
        elif health_score >= 40:
            return {'label': 'Degrading', 'class': 'label-Degrading', 'icon': '⚠️'}
        elif health_score >= 20:
            return {'label': 'Critical', 'class': 'label-Critical', 'icon': '🔴'}
        else:
            return {'label': 'Disposal Recommended', 'class': 'label-Disposal', 'icon': '💀'}
    
    def get_degradation_factors(age_years, design_life):
        age_ratio = age_years / design_life
        if age_ratio < 1.0:
            solar_factor = max(0.01, 1.0 - 0.03 * age_years)
            voltage_drift = age_ratio * 3
            temp_offset = age_ratio * 15
        else:
            solar_factor = max(0.01, 0.70 - 0.35 * (age_ratio - 1.0))
            voltage_drift = 3.0 + (age_ratio - 1.0) * 8
            temp_offset = 15.0 + (age_ratio - 1.0) * 25
        if age_ratio < 0.8:
            battery_factor = max(0.01, 1.0 - 0.04 * age_years)
        else:
            battery_factor = max(0.01, 0.68 - 0.45 * (age_ratio - 0.8))
        return {
            'solar_factor': round(solar_factor, 3),
            'battery_factor': round(battery_factor, 3),
            'voltage_drift': round(voltage_drift, 2),
            'temp_offset': round(temp_offset, 2)
        }
    
    def calculate_component_scores(age_years, design_life, solar_current, battery_voltage, temperature, memory_errors, resets):
        age_ratio = age_years / design_life
        if age_ratio < 0.4:
            age_score = 100 - age_ratio * 30
        elif age_ratio < 0.7:
            age_score = 88 - (age_ratio - 0.4) * 80
        elif age_ratio < 1.0:
            age_score = 64 - (age_ratio - 0.7) * 90
        else:
            age_score = 37 - (age_ratio - 1.0) * 73
        return {
            'age_score': round(max(0, min(100, age_score)), 1),
            'solar_score': round(max(0, min(100, (solar_current / 20.0) * 100)), 1),
            'battery_score': round(max(0, min(100, (battery_voltage / 28.0) * 100)), 1),
            'temp_score': round(max(0, min(100, 100 - max(0, temperature - 35) * 8)), 1),
            'error_score': round(max(0, 100 - min(100, memory_errors / 1000)), 1),
            'reset_score': round(max(0, 100 - min(100, resets * 5)), 1)
        }
    
    def estimate_eol(health_score, age_years):
        years_left = max(0.5, age_years * (1 - health_score / 100) * 1.5)
        current_year = datetime.now().year
        if health_score < 40:
            recommendation = 'Immediate EOL planning recommended'
        elif health_score < 65:
            recommendation = 'Monitor closely, prepare EOL plan'
        else:
            recommendation = 'Nominal operations'
        return {'years_left': round(years_left, 1), 'eol_year': round(current_year + years_left, 1), 'recommendation': recommendation}
    
    def get_model():
        class DummyModel:
            is_loaded = False
        return DummyModel()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)

app = Flask(__name__, 
            static_folder=PARENT_DIR,
            static_url_path='')
CORS(app)


# ============================================================
# Routes - Serve static files
# ============================================================

@app.route('/')
def index():
    """Serve main HTML file"""
    index_path = os.path.join(PARENT_DIR, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(PARENT_DIR, 'index.html')
    else:
        # Fallback to embedded HTML if file not found
        return render_template_string(get_embedded_html())


@app.route('/index.html')
def serve_index():
    return send_from_directory(PARENT_DIR, 'index.html')


@app.route('/css/<path:filename>')
def serve_css(filename):
    css_path = os.path.join(PARENT_DIR, 'css', filename)
    if os.path.exists(css_path):
        return send_from_directory(os.path.join(PARENT_DIR, 'css'), filename)
    return '', 404


@app.route('/js/<path:filename>')
def serve_js(filename):
    js_path = os.path.join(PARENT_DIR, 'js', filename)
    if os.path.exists(js_path):
        return send_from_directory(os.path.join(PARENT_DIR, 'js'), filename)
    return '', 404


@app.route('/js/core/<path:filename>')
def serve_js_core(filename):
    return send_from_directory(os.path.join(PARENT_DIR, 'js', 'core'), filename)


@app.route('/js/ui/<path:filename>')
def serve_js_ui(filename):
    return send_from_directory(os.path.join(PARENT_DIR, 'js', 'ui'), filename)


@app.route('/js/components/<path:filename>')
def serve_js_components(filename):
    return send_from_directory(os.path.join(PARENT_DIR, 'js', 'components'), filename)


@app.route('/config.js')
def serve_config():
    return send_from_directory(PARENT_DIR, 'config.js')


# ============================================================
# API Routes
# ============================================================

@app.route('/api/predict', methods=['POST'])
def predict():
    """Health prediction endpoint"""
    data = request.json
    
    params = {
        'ageYears': data.get('ageYears', 4.0),
        'designLife': data.get('designLife', 7),
        'solarCurrent': data.get('solarCurrent', 18.5),
        'batteryVoltage': data.get('batteryVoltage', 27.5),
        'temperature': data.get('temperature', 22),
        'memoryErrors': data.get('memoryErrors', 0),
        'resets': data.get('resets', 0),
        'orbitType': data.get('orbitType', 'SSO'),
        'altitude': data.get('altitude', 700),
        'name': data.get('name', 'Custom Satellite')
    }
    
    # Calculate using imported functions
    health_score = calculate_health_score(
        age_years=params['ageYears'],
        design_life=params['designLife'],
        solar_current=params['solarCurrent'],
        battery_voltage=params['batteryVoltage'],
        temperature=params['temperature'],
        memory_errors=params['memoryErrors'],
        resets=params['resets']
    )
    
    label_info = get_health_label_with_icon(health_score)
    component_scores = calculate_component_scores(
        age_years=params['ageYears'],
        design_life=params['designLife'],
        solar_current=params['solarCurrent'],
        battery_voltage=params['batteryVoltage'],
        temperature=params['temperature'],
        memory_errors=params['memoryErrors'],
        resets=params['resets']
    )
    degradation = get_degradation_factors(params['ageYears'], params['designLife'])
    eol = estimate_eol(health_score, params['ageYears'])
    
    response = {
        'health_score': health_score,
        'health_label': label_info['label'],
        'health_icon': label_info['icon'],
        'health_class': label_info['class'],
        'component_scores': component_scores,
        'degradation_factors': {
            'solar_factor': degradation['solar_factor'],
            'battery_factor': degradation['battery_factor'],
            'voltage_drift': degradation['voltage_drift'],
            'temp_offset': degradation['temp_offset']
        },
        'eol': eol
    }
    
    # Try ML model
    ml_model = get_model()
    if ml_model and hasattr(ml_model, 'is_loaded') and ml_model.is_loaded:
        try:
            ml_prediction = ml_model.predict(params)
            if ml_prediction:
                response['ml_prediction'] = ml_prediction
        except Exception as e:
            logger.warning(f"ML prediction failed: {e}")
    
    return jsonify(response)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'operational',
        'timestamp': datetime.now().isoformat()
    })


# ============================================================
# Embedded HTML Fallback
# ============================================================

def get_embedded_html():
    """Return embedded HTML if index.html not found"""
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>OrbitCycle™</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui; background: #0a0e1a; color: #e8edf5; padding: 40px; text-align: center; }
        h1 { background: linear-gradient(135deg, #00d4ff, #7c3aed); -webkit-background-clip: text; background-clip: text; color: transparent; margin-bottom: 20px; }
        .error { background: #1a2332; border: 1px solid #1f2937; border-radius: 16px; padding: 40px; max-width: 600px; margin: 40px auto; }
        code { background: #1f2937; padding: 4px 8px; border-radius: 8px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="error">
        <h1>🛰️ OrbitCycle™ API Server</h1>
        <p style="margin-bottom: 20px;">The backend server is running!</p>
        <p style="color: #9ca3af;">📡 API endpoint: <code>/api/predict</code></p>
        <p style="color: #9ca3af;">🔧 Health check: <code>/api/health</code></p>
        <hr style="margin: 20px; border-color: #1f2937;">
        <p style="font-size: 14px;">⚠️ index.html not found in parent directory.</p>
        <p style="font-size: 12px; color: #6b7280;">Make sure index.html is in the folder above backend/</p>
    </div>
</body>
</html>
    '''


# ============================================================
# Main entry point
# ============================================================

if __name__ == '__main__':
    print("=" * 70)
    print("🛰️  OrbitCycle™ Server Starting...")
    print("=" * 70)
    print(f"📍 Server: http://localhost:5000")
    print(f"📡 API: http://localhost:5000/api/predict")
    print(f"🔧 Health: http://localhost:5000/api/health")
    print("=" * 70)
    print(f"📁 Looking for index.html in: {PARENT_DIR}")
    
    # Check if index.html exists
    index_path = os.path.join(PARENT_DIR, 'index.html')
    if os.path.exists(index_path):
        print(f"✅ index.html found at: {index_path}")
    else:
        print(f"⚠️ index.html not found at: {index_path}")
        print(f"   Create index.html in: {PARENT_DIR}")
    
    print("=" * 70)
    app.run(host='0.0.0.0', port=5000, debug=True)