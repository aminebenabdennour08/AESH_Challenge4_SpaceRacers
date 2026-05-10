// Main Application Entry Point
const OrbitCycle = {
    async predict() {
        const params = FormHandler.getCurrentParams();
        const prediction = Predictor.predict(params);
        const referenceId = Predictor.generateReferenceId(params);
        
        // Update UI
        DashboardUI.updateHealthScore(prediction);
        DashboardUI.updateComponentScores(prediction.component_scores);
        DashboardUI.updateDegradationFactors(prediction.degradation_factors);
        DashboardUI.updateEOLInfo(prediction.eol);
        DashboardUI.updateHeroStats();
        
        // Update chart
        Charts.updateDegradationChart(prediction.health_score, params.ageYears, params.designLife);
        
        // Animate
        Animations.pulseElement(document.getElementById('health-score'));
        
        // Save to history
        const historyEntry = {
            reference_id: referenceId,
            timestamp: Date.now(),
            name: params.name,
            orbit_type: params.orbitType,
            age_years: params.ageYears,
            design_life: params.designLife,
            altitude: params.altitude,
            solar_current: params.solarCurrent,
            battery_voltage: params.batteryVoltage,
            temperature: params.temperature,
            memory_errors: params.memoryErrors,
            resets: params.resets,
            health_score: prediction.health_score,
            health_label: prediction.health_label,
            health_class: prediction.health_class,
            component_scores: prediction.component_scores,
            degradation_factors: prediction.degradation_factors,
            eol_years_left: prediction.eol.years_left,
            eol_eoy: prediction.eol.eol_year,
            recommendation: prediction.eol.recommendation
        };
        
        Storage.saveToHistory(historyEntry);
        HistoryTable.render();
        
        return prediction;
    },
    
    resetForm() {
        FormHandler.resetForm();
        this.predict();
    },
    
    loadRandomExample() {
        FormHandler.loadRandomExample();
        this.predict();
    },
    
    clearHistory() {
        if (confirm('⚠️ Clear all historical predictions? This cannot be undone.')) {
            Storage.clearHistory();
            HistoryTable.render();
            ComparisonPanel.hide();
            DashboardUI.updateHeroStats();
            HistoryTable.clearSelection();
        }
    },
    
    deleteHistoryItem(referenceId) {
        Storage.deleteHistoryItem(referenceId);
        HistoryTable.render();
        DashboardUI.updateHeroStats();
        if (selectedReferenceId === referenceId) {
            ComparisonPanel.hide();
            HistoryTable.clearSelection();
        }
    },
    
    showComparison(historyItem) {
        const currentParams = FormHandler.getCurrentParams();
        const currentPrediction = Predictor.predict(currentParams);
        ComparisonPanel.show(historyItem, currentPrediction, currentParams);
    },
    
    closeComparison() {
        ComparisonPanel.hide();
        HistoryTable.clearSelection();
    },
    
    exportHistory() {
        const history = Storage.getHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orbitcycle_history_${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    init() {
        console.log('OrbitCycle™ Initialized');
        FormHandler.setupEventListeners();
        Charts.initDegradationChart();
        this.predict();
        HistoryTable.render();
        DashboardUI.updateHeroStats();
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => OrbitCycle.init());