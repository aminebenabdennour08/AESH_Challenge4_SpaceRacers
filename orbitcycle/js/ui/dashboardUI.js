// Dashboard UI Updates
const DashboardUI = {
    updateHealthScore(prediction) {
        const scoreEl = document.getElementById('health-score');
        const labelEl = document.getElementById('health-label-display');
        const gaugeProgress = document.getElementById('gauge-progress');
        
        scoreEl.textContent = prediction.health_score;
        labelEl.textContent = prediction.health_icon + ' ' + prediction.health_label;
        labelEl.className = `label-badge ${prediction.health_class}`;
        
        // Update gauge (circumference = 2*pi*85 = 534)
        const offset = 534 * (1 - prediction.health_score / 100);
        if (gaugeProgress) gaugeProgress.style.strokeDashoffset = offset;
    },

    updateComponentScores(scores) {
        const ageFill = document.getElementById('age-score-fill');
        const solarFill = document.getElementById('solar-score-fill');
        const batteryFill = document.getElementById('battery-score-fill');
        const tempFill = document.getElementById('temp-score-fill');
        
        const ageVal = document.getElementById('age-score');
        const solarVal = document.getElementById('solar-score');
        const batteryVal = document.getElementById('battery-score');
        const tempVal = document.getElementById('temp-score');
        
        if (ageFill) ageFill.style.width = scores.age_score + '%';
        if (solarFill) solarFill.style.width = scores.solar_score + '%';
        if (batteryFill) batteryFill.style.width = scores.battery_score + '%';
        if (tempFill) tempFill.style.width = scores.temp_score + '%';
        
        if (ageVal) ageVal.textContent = scores.age_score + '%';
        if (solarVal) solarVal.textContent = scores.solar_score + '%';
        if (batteryVal) batteryVal.textContent = scores.battery_score + '%';
        if (tempVal) tempVal.textContent = scores.temp_score + '%';
    },

    updateDegradationFactors(factors) {
        document.getElementById('solar-factor').textContent = factors.solar_factor;
        document.getElementById('battery-factor').textContent = factors.battery_factor;
        document.getElementById('voltage-drift').textContent = factors.voltage_drift;
        document.getElementById('temp-offset').textContent = factors.temp_offset;
        document.getElementById('error-mult').textContent = factors.error_mult;
        document.getElementById('reset-mult').textContent = factors.reset_mult;
    },

    updateEOLInfo(eol) {
        document.getElementById('years-left').textContent = eol.years_left + ' years';
        document.getElementById('eol-year').textContent = eol.eol_year;
        document.getElementById('recommendation').textContent = eol.recommendation;
    },

    updateHeroStats() {
        const stats = Storage.getStats();
        document.getElementById('total-predictions').textContent = stats.total;
        document.getElementById('unique-references').textContent = stats.uniqueReferences;
        document.getElementById('avg-health').textContent = stats.avgHealth;
        document.getElementById('eol-alerts').textContent = stats.eolAlerts;
    }
};