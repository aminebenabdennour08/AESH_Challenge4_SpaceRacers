// Main Prediction Engine
const Predictor = (function() {
    // Private methods
    function validateParams(params) {
        const required = ['ageYears', 'designLife', 'solarCurrent', 'batteryVoltage', 'temperature', 'memoryErrors', 'resets'];
        for (const prop of required) {
            if (params[prop] === undefined || isNaN(params[prop])) {
                console.warn(`Missing or invalid parameter: ${prop}`);
                return false;
            }
        }
        return true;
    }

    function normalizeValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // Public API
    return {
        /**
         * Predict satellite health based on telemetry parameters
         * @param {Object} params - Telemetry parameters
         * @returns {Object} Prediction results including health score, labels, and degradation factors
         */
        predict(params) {
            // Validate inputs
            if (!validateParams(params)) {
                throw new Error('Invalid parameters for prediction');
            }

            // Calculate health score using HealthCalculator
            const healthResult = HealthCalculator.calculate(params);
            const healthLabel = HealthCalculator.getHealthLabel(healthResult.health_score);
            
            // Get degradation factors
            const degFactors = DegradationModel.calculate(params.ageYears, params.designLife);
            
            // Get EOL estimate
            const eolEstimate = DegradationModel.estimateEOL(healthResult.health_score, params.ageYears);
            
            // Build and return prediction object
            return {
                // Core health metrics
                health_score: healthResult.health_score,
                health_label: healthLabel.label,
                health_icon: healthLabel.icon,
                health_class: healthLabel.class,
                
                // Component scores breakdown
                component_scores: {
                    age_score: healthResult.age_score,
                    solar_score: healthResult.solar_score,
                    battery_score: healthResult.battery_score,
                    temp_score: healthResult.temp_score,
                    error_score: healthResult.error_score,
                    reset_score: healthResult.reset_score,
                    age_ratio: healthResult.age_ratio
                },
                
                // Degradation factors
                degradation_factors: degFactors,
                
                // End-of-life estimates
                eol: eolEstimate,
                
                // Metadata
                timestamp: Date.now(),
                confidence: calculateConfidence(healthResult.health_score, params)
            };
        },

        /**
         * Generate unique reference ID based on parameter signature
         * @param {Object} params - Telemetry parameters
         * @returns {string} Unique 8-character hex reference ID
         */
        generateReferenceId(params) {
            // Create a unique string from key parameters
            const str = `${params.orbitType || 'SSO'}|${(params.ageYears || 0).toFixed(1)}|${params.designLife || 7}|${params.altitude || 700}|${(params.solarCurrent || 0).toFixed(1)}|${(params.batteryVoltage || 0).toFixed(1)}|${params.temperature || 0}|${params.memoryErrors || 0}|${params.resets || 0}`;
            
            // Simple hash function
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            
            // Return 8-character hex string
            return Math.abs(hash).toString(16).substring(0, 8).padStart(8, '0');
        },

        /**
         * Batch predict for multiple parameter sets
         * @param {Array} paramsArray - Array of parameter objects
         * @returns {Array} Array of prediction results
         */
        batchPredict(paramsArray) {
            if (!Array.isArray(paramsArray)) {
                throw new Error('batchPredict expects an array of parameters');
            }
            
            return paramsArray.map(params => this.predict(params));
        },

        /**
         * Compare two predictions and return differences
         * @param {Object} pred1 - First prediction
         * @param {Object} pred2 - Second prediction
         * @returns {Object} Comparison results
         */
        comparePredictions(pred1, pred2) {
            return {
                health_score_diff: (pred1.health_score - pred2.health_score).toFixed(1),
                label_change: `${pred1.health_label} → ${pred2.health_label}`,
                eol_diff: (parseFloat(pred1.eol.years_left) - parseFloat(pred2.eol.years_left)).toFixed(1),
                component_diffs: {
                    age: (pred1.component_scores.age_score - pred2.component_scores.age_score).toFixed(1),
                    solar: (pred1.component_scores.solar_score - pred2.component_scores.solar_score).toFixed(1),
                    battery: (pred1.component_scores.battery_score - pred2.component_scores.battery_score).toFixed(1),
                    temp: (pred1.component_scores.temp_score - pred2.component_scores.temp_score).toFixed(1)
                }
            };
        },

        /**
         * Get recommended actions based on health score
         * @param {number} healthScore - Current health score (0-100)
         * @returns {Object} Recommended actions
         */
        getRecommendations(healthScore) {
            if (healthScore >= 85) {
                return {
                    urgency: 'low',
                    actions: ['Continue nominal operations', 'Schedule routine maintenance', 'Monitor standard telemetry'],
                    next_review_days: 90
                };
            } else if (healthScore >= 65) {
                return {
                    urgency: 'medium',
                    actions: ['Increase monitoring frequency', 'Review degradation trends', 'Prepare contingency plans'],
                    next_review_days: 30
                };
            } else if (healthScore >= 40) {
                return {
                    urgency: 'high',
                    actions: ['Initiate EOL planning', 'Schedule disposal maneuver', 'Coordinate with ground stations'],
                    next_review_days: 14
                };
            } else if (healthScore >= 20) {
                return {
                    urgency: 'critical',
                    actions: ['Execute disposal immediately', 'Notify regulatory bodies', 'Begin decommissioning process'],
                    next_review_days: 7
                };
            } else {
                return {
                    urgency: 'emergency',
                    actions: ['Emergency disposal required', 'Collision avoidance active', 'Final operations window closing'],
                    next_review_days: 1
                };
            }
        }
    };

    // Helper function to calculate prediction confidence
    function calculateConfidence(healthScore, params) {
        // Confidence is higher when parameters are within normal ranges
        let confidence = 85; // Base confidence
        
        // Reduce confidence for extreme values
        if (params.ageYears > params.designLife * 1.5) confidence -= 10;
        if (params.solarCurrent < 10 || params.solarCurrent > 30) confidence -= 5;
        if (params.batteryVoltage < 24 || params.batteryVoltage > 32) confidence -= 5;
        if (params.temperature > 50 || params.temperature < -20) confidence -= 5;
        if (params.memoryErrors > 1000) confidence -= 5;
        
        // Health score at extremes gives higher confidence
        if (healthScore > 80 || healthScore < 20) confidence += 5;
        
        return Math.max(50, Math.min(98, confidence));
    }
})();

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Predictor;
}