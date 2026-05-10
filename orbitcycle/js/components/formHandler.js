// Form Input Handling
const FormHandler = {
    getCurrentParams() {
        return {
            name: document.getElementById('sat-name').value || 'Unnamed',
            orbitType: document.getElementById('orbit-type').value,
            ageYears: parseFloat(document.getElementById('age-years').value),
            designLife: parseFloat(document.getElementById('design-life').value),
            altitude: parseFloat(document.getElementById('altitude').value),
            orbitalPhase: parseFloat(document.getElementById('orbital-phase').value),
            solarCurrent: parseFloat(document.getElementById('solar-current').value),
            batteryVoltage: parseFloat(document.getElementById('battery-voltage').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            busVoltage: parseFloat(document.getElementById('bus-voltage').value) || 28,
            memoryErrors: parseInt(document.getElementById('memory-errors').value) || 0,
            resets: parseInt(document.getElementById('resets').value) || 0
        };
    },

    updateFormFromParams(params) {
        document.getElementById('sat-name').value = params.name;
        document.getElementById('orbit-type').value = params.orbitType;
        document.getElementById('age-years').value = params.ageYears;
        document.getElementById('design-life').value = params.designLife;
        document.getElementById('altitude').value = params.altitude;
        document.getElementById('orbital-phase').value = params.orbitalPhase;
        document.getElementById('phase-value').textContent = params.orbitalPhase.toFixed(2);
        document.getElementById('solar-current').value = params.solarCurrent;
        document.getElementById('battery-voltage').value = params.batteryVoltage;
        document.getElementById('temperature').value = params.temperature;
        document.getElementById('bus-voltage').value = params.busVoltage;
        document.getElementById('memory-errors').value = params.memoryErrors;
        document.getElementById('resets').value = params.resets;
    },

    resetForm() {
        this.updateFormFromParams({
            name: 'Custom Satellite',
            orbitType: 'SSO',
            ageYears: 4.0,
            designLife: 7,
            altitude: 700,
            orbitalPhase: 0.5,
            solarCurrent: 18.5,
            batteryVoltage: 27.5,
            temperature: 22,
            busVoltage: 28,
            memoryErrors: 0,
            resets: 0
        });
    },

    loadRandomExample() {
        const examples = [
            { name: 'NOAA-19', orbitType: 'LEO', ageYears: 6.5, designLife: 7, altitude: 870, solarCurrent: 16.2, batteryVoltage: 26.1, temperature: 28, memoryErrors: 450, resets: 3 },
            { name: 'Sentinel-2A', orbitType: 'SSO', ageYears: 4.2, designLife: 7, altitude: 786, solarCurrent: 17.8, batteryVoltage: 27.2, temperature: 24, memoryErrors: 120, resets: 1 },
            { name: 'LANDSAT-9', orbitType: 'SSO', ageYears: 2.5, designLife: 7, altitude: 705, solarCurrent: 19.2, batteryVoltage: 28.1, temperature: 21, memoryErrors: 30, resets: 0 },
            { name: 'GOES-18', orbitType: 'GEO', ageYears: 3.2, designLife: 15, altitude: 35786, solarCurrent: 28.5, batteryVoltage: 69.2, temperature: 18, memoryErrors: 15, resets: 0 },
            { name: 'Critical Sat', orbitType: 'LEO', ageYears: 11.5, designLife: 7, altitude: 450, solarCurrent: 8.2, batteryVoltage: 22.1, temperature: 52, memoryErrors: 2500, resets: 12 }
        ];
        const random = examples[Math.floor(Math.random() * examples.length)];
        this.updateFormFromParams({ ...random, orbitalPhase: 0.5, busVoltage: 28 });
    },

    setupEventListeners() {
        const phaseSlider = document.getElementById('orbital-phase');
        if (phaseSlider) {
            phaseSlider.addEventListener('input', (e) => {
                document.getElementById('phase-value').textContent = parseFloat(e.target.value).toFixed(2);
            });
        }
    }
};