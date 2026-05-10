// History Table Rendering
let selectedReferenceId = null;

const HistoryTable = {
    render() {
        const history = Storage.getHistory();
        const container = document.getElementById('history-list');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No predictions yet</div><div class="empty-sub">Enter parameters and click "Predict & Save"</div></div>';
            return;
        }
        
        container.innerHTML = history.map(item => `
            <div class="history-row ${selectedReferenceId === item.reference_id ? 'selected' : ''}" data-ref="${item.reference_id}">
                <div><span class="ref-badge" style="font-size:10px;background:#1f2937;padding:2px 6px;border-radius:8px;">${item.reference_id.substring(0, 6)}</span></div>
                <div><strong>${item.name}</strong><br><span style="font-size:10px;color:#6b7280;">${item.orbit_type}</span></div>
                <div>${item.age_years}y</div>
                <div style="font-weight:600;color:${item.health_score > 75 ? '#10b981' : item.health_score > 50 ? '#f59e0b' : '#ef4444'}">${item.health_score}%</div>
                <div><span style="font-size:10px;padding:2px 6px;border-radius:10px;background:${item.health_class === 'label-Healthy' ? 'rgba(16,185,129,0.2)' : item.health_class === 'label-Monitor' ? 'rgba(0,212,255,0.2)' : item.health_class === 'label-Degrading' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}">${item.health_label}</span></div>
                <div style="font-size:11px;">${item.eol_eoy || '—'}</div>
                <div><button class="btn-icon" style="padding:2px 6px;font-size:10px;" onclick="event.stopPropagation(); OrbitCycle.deleteHistoryItem('${item.reference_id}')">Del</button></div>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.history-row').forEach(row => {
            row.addEventListener('click', () => {
                const refId = row.dataset.ref;
                const selected = history.find(h => h.reference_id === refId);
                if (selected) {
                    selectedReferenceId = refId;
                    this.render();
                    if (typeof OrbitCycle !== 'undefined') {
                        OrbitCycle.showComparison(selected);
                    }
                }
            });
        });
    },

    selectReference(referenceId) {
        selectedReferenceId = referenceId;
        this.render();
    },

    clearSelection() {
        selectedReferenceId = null;
        this.render();
    }
};