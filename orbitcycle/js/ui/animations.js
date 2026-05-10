// UI Animations
const Animations = {
    animateNumber(element, start, end, duration = 1000) {
        if (!element) return;
        const startTime = performance.now();
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(start + (end - start) * easeOut);
            element.textContent = value;
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    },

    animateProgressBar(element, targetWidth, duration = 800) {
        if (!element) return;
        const startWidth = parseFloat(element.style.width) || 0;
        const startTime = performance.now();
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const width = startWidth + (targetWidth - startWidth) * easeOut;
            element.style.width = width + '%';
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    },

    pulseElement(element) {
        if (!element) return;
        element.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => { element.style.animation = ''; }, 500);
    },

    addToHistoryAnimation(row) {
        if (row) {
            row.style.backgroundColor = '#1e3a5f';
            setTimeout(() => { row.style.backgroundColor = ''; }, 500);
        }
    }
};