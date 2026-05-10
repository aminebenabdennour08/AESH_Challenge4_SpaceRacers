// Health Score Calculation (mirrors Python calculate_health_score)
const HealthCalculator = {
    calculate(params) {
        const age_years = params.ageYears;
        const design_life = params.designLife;
        const solar_current = params.solarCurrent;
        const battery_voltage = params.batteryVoltage;
        const temperature = params.temperature;
        const memory_errors = params.memoryErrors;
        const resets = params.resets;

        const age_ratio = age_years / design_life;

        // Age score based on age ratio segments
        let age_score;
        if (age_ratio < 0.4) {
            age_score = 100 - age_ratio * 30;
        } else if (age_ratio < 0.7) {
            age_score = 88 - (age_ratio - 0.4) * 80;
        } else if (age_ratio < 1.0) {
            age_score = 64 - (age_ratio - 0.7) * 90;
        } else if (age_ratio < 1.3) {
            age_score = 37 - (age_ratio - 1.0) * 73;
        } else {
            age_score = 15 - (age_ratio - 1.3) * 25;
        }
        age_score = Math.max(0, Math.min(100, age_score));

        // Solar score (nominal ~20A)
        const solar_score = Math.max(0, Math.min(100, (solar_current / 20.0) * 100));

        // Battery score (nominal ~28V)
        const battery_score = Math.max(0, Math.min(100, (battery_voltage / 28.0) * 100));

        // Temperature score
        let temp_score;
        if (temperature < 35) {
            temp_score = 100;
        } else if (temperature < 45) {
            temp_score = 100 - (temperature - 35) * 8;
        } else {
            temp_score = Math.max(0, 60 - (temperature - 45) * 6);
        }

        // Error score
        const error_score = Math.max(0, 100 - Math.min(100, memory_errors / 1000));

        // Reset score
        const reset_score = Math.max(0, 100 - Math.min(100, resets * 5));

        // Weighted health score
        const health_score = (
            0.30 * age_score +
            0.20 * solar_score +
            0.20 * battery_score +
            0.15 * temp_score +
            0.08 * error_score +
            0.07 * reset_score
        );

        return {
            health_score: Math.round(Math.max(0, Math.min(100, health_score)) * 10) / 10,
            age_score: Math.round(age_score * 10) / 10,
            solar_score: Math.round(solar_score * 10) / 10,
            battery_score: Math.round(battery_score * 10) / 10,
            temp_score: Math.round(temp_score * 10) / 10,
            error_score: Math.round(error_score * 10) / 10,
            reset_score: Math.round(reset_score * 10) / 10,
            age_ratio: age_ratio.toFixed(3)
        };
    },

    getHealthLabel(health_score) {
        if (health_score >= 85) return { label: 'Healthy', class: 'label-Healthy', icon: '✅' };
        if (health_score >= 65) return { label: 'Monitor', class: 'label-Monitor', icon: '📡' };
        if (health_score >= 40) return { label: 'Degrading', class: 'label-Degrading', icon: '⚠️' };
        if (health_score >= 20) return { label: 'Critical', class: 'label-Critical', icon: '🔴' };
        return { label: 'Disposal Recommended', class: 'label-Disposal', icon: '💀' };
    }
};