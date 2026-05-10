// Chart Visualizations
let degradationChart = null;

const Charts = {
    initDegradationChart() {
        const ctx = document.getElementById('degradation-chart').getContext('2d');
        degradationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 20 }, (_, i) => i * 5),
                datasets: [{
                    label: 'Health Score',
                    data: Array.from({ length: 20 }, (_, i) => 100 - i * 3),
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
                scales: { y: { min: 0, max: 100, grid: { color: '#1f2937' } }, x: { grid: { display: false } } }
            }
        });
    },

    updateDegradationChart(currentHealth, age_years, design_life) {
        if (!degradationChart) this.initDegradationChart();
        
        const age_ratio = age_years / design_life;
        const data = [];
        for (let i = 0; i <= 20; i++) {
            const future_ratio = age_ratio + (i * 0.05);
            let health;
            if (future_ratio < 1.0) {
                health = 100 - future_ratio * 30;
            } else if (future_ratio < 1.3) {
                health = 70 - (future_ratio - 1.0) * 100;
            } else {
                health = 40 - (future_ratio - 1.3) * 50;
            }
            data.push(Math.max(0, Math.min(100, health)));
        }
        
        degradationChart.data.datasets[0].data = data;
        degradationChart.update();
    }
};