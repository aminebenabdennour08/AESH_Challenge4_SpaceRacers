// Local Storage Management
const STORAGE_KEY = 'orbitcycle_health_history';

const Storage = {
    getHistory() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    },

    saveToHistory(entry) {
        let history = this.getHistory();
        const existingIndex = history.findIndex(h => h.reference_id === entry.reference_id);
        if (existingIndex !== -1) {
            history[existingIndex] = { ...history[existingIndex], ...entry, timestamp: Date.now() };
        } else {
            history.unshift(entry);
        }
        if (history.length > 100) history.pop();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history;
    },

    deleteHistoryItem(referenceId) {
        let history = this.getHistory();
        history = history.filter(h => h.reference_id !== referenceId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return history;
    },

    clearHistory() {
        localStorage.removeItem(STORAGE_KEY);
        return [];
    },

    getStats() {
        const history = this.getHistory();
        const total = history.length;
        const avgHealth = history.length > 0 ? 
            (history.reduce((sum, h) => sum + h.health_score, 0) / history.length).toFixed(1) : 0;
        const eolAlerts = history.filter(h => h.health_score < 40).length;
        return { total, uniqueReferences: total, avgHealth, eolAlerts };
    }
};