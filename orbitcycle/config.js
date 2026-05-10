// OrbitCycle Configuration
const CONFIG = {
    // Model settings
    USE_BACKEND: false,  // Set to true if running Flask backend
    BACKEND_URL: 'http://localhost:5000/predict',
    
    // Feature weights (must match Python model)
    WEIGHTS: {
        AGE: 30,
        SOLAR: 20,
        BATTERY: 20,
        TEMPERATURE: 15,
        MEMORY_ERRORS: 8,
        RESETS: 7
    },
    
    // Nominal values for score calculation
    NOMINAL: {
        SOLAR_CURRENT: 20.0,      // Amps
        BATTERY_VOLTAGE: 28.0,    // Volts
        TEMPERATURE: 25,           // Celsius
        DESIGN_LIFE_LEO: 7,       // Years
        DESIGN_LIFE_GEO: 15,       // Years
        DESIGN_LIFE_MEO: 12,       // Years
        DESIGN_LIFE_HEO: 8         // Years
    },
    
    // Thresholds for health labels
    THRESHOLDS: {
        HEALTHY: 85,
        MONITOR: 65,
        DEGRADING: 40,
        CRITICAL: 20
    },
    
    // UI settings
    UI: {
        REFRESH_INTERVAL: 5000,    // ms
        ANIMATION_DURATION: 800,   // ms
        MAX_HISTORY_ITEMS: 100
    },
    
    // Orbit type display names
    ORBIT_TYPES: {
        LEO: { name: 'Low Earth Orbit', altitude: '400-1500 km', period: '90-120 min' },
        SSO: { name: 'Sun-Synchronous', altitude: '500-800 km', period: '90-100 min' },
        MEO: { name: 'Medium Earth Orbit', altitude: '5000-20000 km', period: '2-12 hours' },
        GEO: { name: 'Geostationary', altitude: '35786 km', period: '24 hours' },
        HEO: { name: 'Highly Elliptical', altitude: '500-39000 km', period: '12 hours' }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}