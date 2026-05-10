// Comparison Panel
const ComparisonPanel = {
    show(historyItem, currentPrediction, currentParams) {
        const panel = document.getElementById('comparison-panel');
        const content = document.getElementById('comparison-content');
        
        if (!panel || !content) return;
        
        content.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div style="background:#1a2332;border-radius:12px;padding:16px;">
                    <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">📜 REFERENCE (${new Date(historyItem.timestamp).toLocaleString()})</div>
                    <div style="font-size:24px;font-weight:700;margin-bottom:4px;">${historyItem.health_score}%</div>
                    <div style="font-size:12px;margin-bottom:12px;">${historyItem.health_label}</div>
                    <div style="font-size:11px;color:#6b7280;">${historyItem.orbit_type} | ${historyItem.age_years} yrs</div>
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1f2937;">
                        ${historyItem.component_scores ? `
                            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px;"><span>Age:</span><span>${historyItem.component_scores.age_score || 0}%</span></div>
                            <div style="display:flex;justify-content:space-between;font-size:10px;"><span>Solar:</span><span>${historyItem.component_scores.solar_score || 0}%</span></div>
                        ` : 'No component data'}
                    </div>
                </div>
                <div style="background:#1a2332;border-radius:12px;padding:16px;border-left:2px solid #00d4ff;">
                    <div style="font-size:11px;color:#6b7280;margin-bottom:8px;">🎯 CURRENT PREDICTION</div>
                    <div style="font-size:24px;font-weight:700;margin-bottom:4px;">${currentPrediction.health_score}%</div>
                    <div style="font-size:12px;margin-bottom:12px;">${currentPrediction.health_label}</div>
                    <div style="font-size:11px;color:#6b7280;">${currentParams.orbitType} | ${currentParams.ageYears} yrs</div>
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1f2937;">
                        <div style="display:flex;justify-content:space-between;font-size:10px;"><span>Difference:</span><span style="color:${Math.abs(currentPrediction.health_score - historyItem.health_score) > 10 ? '#ef4444' : '#f59e0b'}">${(currentPrediction.health_score - historyItem.health_score) > 0 ? '+' : ''}${(currentPrediction.health_score - historyItem.health_score).toFixed(1)}%</span></div>
                    </div>
                </div>
            </div>
        `;
        
        panel.style.display = 'block';
    },
    
    hide() {
        const panel = document.getElementById('comparison-panel');
        if (panel) panel.style.display = 'none';
    }
};