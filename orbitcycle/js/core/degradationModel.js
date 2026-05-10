// Degradation Factors Calculation (mirrors Python get_degradation_factors)
const DegradationModel = {
    calculate(age_years, design_life) {
        const age_ratio = age_years / design_life;

        let solar_factor, voltage_drift, temp_offset, battery_factor, error_mult, reset_mult;

        if (age_ratio < 1.0) {
            solar_factor = Math.max(0.01, Math.min(1.0, 1.0 - 0.03 * age_years));
            voltage_drift = age_ratio * 3;
            temp_offset = age_ratio * 15;
        } else {
            solar_factor = Math.max(0.01, Math.min(1.0, 0.70 - 0.35 * (age_ratio - 1.0)));
            voltage_drift = 3.0 + (age_ratio - 1.0) * 8;
            temp_offset = 15.0 + (age_ratio - 1.0) * 25;
        }

        if (age_ratio < 0.8) {
            battery_factor = Math.max(0.01, Math.min(1.0, 1.0 - 0.04 * age_years));
        } else {
            battery_factor = Math.max(0.01, Math.min(1.0, 0.68 - 0.45 * (age_ratio - 0.8)));
        }

        error_mult = Math.min(200, Math.exp(3.0 * age_ratio));
        reset_mult = Math.min(50, age_ratio < 1.0 ? 1 + 3 * age_ratio : 4 + 10 * (age_ratio - 1.0));

        return {
            solar_factor: solar_factor.toFixed(3),
            battery_factor: battery_factor.toFixed(3),
            voltage_drift: voltage_drift.toFixed(2),
            temp_offset: temp_offset.toFixed(2),
            error_mult: error_mult.toFixed(2),
            reset_mult: reset_mult.toFixed(2)
        };
    },

    estimateEOL(health_score, age_years) {
        const remaining_pct = health_score / 100;
        const years_left = Math.max(0.5, age_years * (1 - remaining_pct) * 1.5);
        const current_year = new Date().getFullYear();
        const eol_year = current_year + years_left;
        return {
            years_left: years_left.toFixed(1),
            eol_year: eol_year.toFixed(1),
            recommendation: health_score < 40 ? 'Immediate EOL planning recommended' :
                           health_score < 65 ? 'Monitor closely, prepare EOL plan' :
                           'Nominal operations'
        };
    }
};